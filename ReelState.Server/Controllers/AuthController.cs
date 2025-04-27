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

        // ======================================================
        // TEMPORARY TEST METHODS - REMOVE IN PRODUCTION
        // ======================================================

        /*
        // Test endpoint for forcing token refresh - REMOVE IN PRODUCTION
        [HttpPost("refreshTokenForce")]
        public async Task<IActionResult> RefreshTokenForce([FromBody] TokenRequestDto model, [FromQuery] bool force = true)
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

            // Only check refresh token validity, not token expiration
            if (user == null || user.RefreshToken != model.RefreshToken)
                return BadRequest("Invalid refresh token");

            // Skip the expiration check that exists in the original method
            if (!force && user.RefreshTokenExpiryTime <= DateTime.Now)
                return BadRequest("Refresh token expired");

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

        // Debug endpoint for token inspection - REMOVE IN PRODUCTION
        [HttpGet("debug-token")]
        public async Task<IActionResult> DebugToken(string email)
        {
            if (string.IsNullOrEmpty(email))
                return BadRequest("Email is required");

            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
                return NotFound("User not found");

            return Ok(new
            {
                email = user.Email,
                refreshToken = user.RefreshToken?.Substring(0, 10) + "..." // Show first 10 chars for safety
            });
        }

        // Debug endpoint for full token inspection - REMOVE IN PRODUCTION
        [HttpGet("debug-token-full")]
        public async Task<IActionResult> DebugTokenFull(string email)
        {
            if (string.IsNullOrEmpty(email))
                return BadRequest("Email is required");

            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
                return NotFound("User not found");

            return Ok(new
            {
                email = user.Email,
                refreshTokenFull = user.RefreshToken,
                tokenLength = user.RefreshToken?.Length
            });
        }

        // Test endpoint for token refresh bypassing validation - REMOVE IN PRODUCTION
        [HttpPost("refreshTokenFull")]
        public async Task<IActionResult> RefreshTokenFull([FromBody] TokenRequestDto model)
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
            if (user == null)
                return BadRequest($"User not found with email: {email}");

            // Generate new tokens regardless of current token values
            var newToken = await _jwtService.GenerateJwtToken(user);
            var newRefreshToken = _jwtService.GenerateRefreshToken();

            // Store the new refresh token
            user.RefreshToken = newRefreshToken;
            await _userManager.UpdateAsync(user);

            // Return new tokens
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
        */

        // ======================================================
        // CORE AUTHENTICATION ENDPOINTS
        // ======================================================

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
            // Option 1: Get email directly from the Name claim
            var userEmail = User.FindFirst(ClaimTypes.Name)?.Value;

            if (string.IsNullOrEmpty(userEmail))
                return BadRequest(new { IsSuccess = false, Message = "User not found in token" });

            // Find user by email
            var user = await _userManager.FindByEmailAsync(userEmail);
            if (user == null)
                return NotFound(new { IsSuccess = false, Message = "User not found in database" });

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