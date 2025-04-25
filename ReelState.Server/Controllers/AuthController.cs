using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System;
using System.Security.Claims;
using System.Threading.Tasks;
using ReelState.Models;
using ReelState.Models.DTOs;
using ReelState.Services;
using ReelState.Server.Models;


namespace ReelState.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IJwtService _jwtService;
        private readonly IGoogleAuthService _googleAuthService;

        public AuthController(
            UserManager<ApplicationUser> userManager,
            IJwtService jwtService,
            IGoogleAuthService googleAuthService)
        {
            _userManager = userManager;
            _jwtService = jwtService;
            _googleAuthService = googleAuthService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userExists = await _userManager.FindByEmailAsync(model.Email);
            if (userExists != null)
                return BadRequest(new AuthResponseDto { IsSuccess = false, Message = "User already exists!" });

            var user = new ApplicationUser
            {
                Email = model.Email,
                UserName = model.Email,
                FirstName = model.FirstName,
                LastName = model.LastName,
                SecurityStamp = Guid.NewGuid().ToString(),
                Provider = "Local"
            };

            var result = await _userManager.CreateAsync(user, model.Password);
            if (!result.Succeeded)
                return BadRequest(new AuthResponseDto
                {
                    IsSuccess = false,
                    Message = "User creation failed! Please check details and try again."
                });

            // Generate tokens
            var token = await _jwtService.GenerateJwtToken(user);
            var refreshToken = _jwtService.GenerateRefreshToken();

            // Store refresh token
            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.Now.AddDays(7);
            await _userManager.UpdateAsync(user);

            return Ok(new AuthResponseDto
            {
                IsSuccess = true,
                Token = token,
                RefreshToken = refreshToken,
                Expiration = DateTime.Now.AddMinutes(120),
                UserId = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Message = "User created successfully!"
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null)
                return Unauthorized(new AuthResponseDto { IsSuccess = false, Message = "Invalid email or password" });

            // Check if this is a Google user trying to login with password
            if (user.Provider == "Google")
                return BadRequest(new AuthResponseDto
                {
                    IsSuccess = false,
                    Message = "This account uses Google authentication. Please sign in with Google."
                });

            var isPasswordValid = await _userManager.CheckPasswordAsync(user, model.Password);
            if (!isPasswordValid)
                return Unauthorized(new AuthResponseDto { IsSuccess = false, Message = "Invalid email or password" });

            // Update last login time
            user.LastLogin = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);

            // Generate tokens
            var token = await _jwtService.GenerateJwtToken(user);
            var refreshToken = _jwtService.GenerateRefreshToken();

            // Store refresh token
            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.Now.AddDays(7);
            await _userManager.UpdateAsync(user);

            return Ok(new AuthResponseDto
            {
                IsSuccess = true,
                Token = token,
                RefreshToken = refreshToken,
                Expiration = DateTime.Now.AddMinutes(120),
                UserId = user.Id,
                Email = user.Email ?? string.Empty,
                FirstName = user.FirstName,
                LastName = user.LastName,
                ProfilePictureUrl = user.ProfilePictureUrl
            });
        }

        [HttpPost("google-login")]
        public async Task<IActionResult> GoogleAuth([FromBody] GoogleAuthDto model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var payload = await _googleAuthService.VerifyGoogleToken(model.IdToken);
            if (payload == null)
                return BadRequest(new AuthResponseDto { IsSuccess = false, Message = "Invalid Google token" });

            var user = await _userManager.FindByEmailAsync(payload.Email);

            // If user doesn't exist, create a new one
            if (user == null)
            {
                user = new ApplicationUser
                {
                    Email = payload.Email,
                    UserName = payload.Email,
                    FirstName = payload.GivenName ?? string.Empty,
                    LastName = payload.FamilyName ?? string.Empty,
                    ProfilePictureUrl = payload.Picture,
                    SecurityStamp = Guid.NewGuid().ToString(),
                    Provider = "Google",
                    ProviderId = payload.Subject,
                    EmailConfirmed = payload.EmailVerified
                };

                var result = await _userManager.CreateAsync(user);
                if (!result.Succeeded)
                    return BadRequest(new AuthResponseDto
                    {
                        IsSuccess = false,
                        Message = "User creation failed! Please try again."
                    });
            }
            else
            {
                // Update user info if they already exist but are now using Google
                if (user.Provider != "Google")
                {
                    user.Provider = "Google";
                    user.ProviderId = payload.Subject;
                    user.ProfilePictureUrl = payload.Picture;
                    await _userManager.UpdateAsync(user);
                }
            }

            // Update last login
            user.LastLogin = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);

            // Generate tokens
            var token = await _jwtService.GenerateJwtToken(user);
            var refreshToken = _jwtService.GenerateRefreshToken();

            // Store refresh token
            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.Now.AddDays(7);
            await _userManager.UpdateAsync(user);

            return Ok(new AuthResponseDto
            {
                IsSuccess = true,
                Token = token,
                RefreshToken = refreshToken,
                Expiration = DateTime.Now.AddMinutes(120),
                UserId = user.Id,
                Email = user.Email ?? string.Empty,
                FirstName = user.FirstName,
                LastName = user.LastName,
                ProfilePictureUrl = user.ProfilePictureUrl
            });
        }

        [HttpPost("refreshToken")]
        public async Task<IActionResult> RefreshToken([FromBody] TokenRequestDto model)
        {
            if (model == null)
                return BadRequest("Invalid client request");

            var principal = _jwtService.GetPrincipalFromExpiredToken(model.Token);
            if (principal == null)
                return BadRequest("Invalid jwt token");

            var email = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (email == null)
                return BadRequest("Invalid token claim");

            var user = await _userManager.FindByEmailAsync(email);

            if (user == null || user.RefreshToken != model.RefreshToken || user.RefreshTokenExpiryTime <= DateTime.Now)
                return BadRequest("Invalid refresh token or token expired");

            var newToken = await _jwtService.GenerateJwtToken(user);
            var newRefreshToken = _jwtService.GenerateRefreshToken();

            user.RefreshToken = newRefreshToken;
            await _userManager.UpdateAsync(user);

            return Ok(new AuthResponseDto
            {
                IsSuccess = true,
                Token = newToken,
                RefreshToken = newRefreshToken,
                Expiration = DateTime.Now.AddMinutes(120),
                UserId = user.Id,
                Email = user.Email ?? string.Empty,
                FirstName = user.FirstName,
                LastName = user.LastName
            });
        }

        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            var userEmail = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userEmail))
                return BadRequest(new AuthResponseDto { IsSuccess = false, Message = "User not found" });

            var user = await _userManager.FindByEmailAsync(userEmail);
            if (user == null)
                return BadRequest(new AuthResponseDto { IsSuccess = false, Message = "User not found" });

            // Invalidate refresh token
            user.RefreshToken = null;
            await _userManager.UpdateAsync(user);

            return Ok(new AuthResponseDto { IsSuccess = true, Message = "Logged out successfully" });
        }
        [Authorize]
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var userEmail = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userEmail))
                return BadRequest(new { IsSuccess = false, Message = "User not found" });

            var user = await _userManager.FindByEmailAsync(userEmail);
            if (user == null)
                return NotFound(new { IsSuccess = false, Message = "User not found" });

            return Ok(new
            {
                IsSuccess = true,
                UserId = user.Id,
                user.Email,
                user.FirstName,
                LastName = user.LastName,
                ProfilePictureUrl = user.ProfilePictureUrl,
                Provider = user.Provider,
                LastLogin = user.LastLogin
            });
        }
    }
}