using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ReelState.Data;
using ReelState.Server.Models;

namespace ReelState.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<UserController> _logger;

        public UserController(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager,
            ILogger<UserController> logger)
        {
            _context = context;
            _userManager = userManager;
            _logger = logger;
        }

        // GET: api/User/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetUser(string id)
        {
            try
            {
                _logger.LogInformation($"GetUser called for userId: {id}");

                if (string.IsNullOrEmpty(id))
                {
                    return BadRequest(new { isSuccess = false, message = "User ID is required" });
                }

                // Get basic user data
                var user = await _userManager.FindByIdAsync(id);
                if (user == null)
                {
                    _logger.LogWarning($"User not found: {id}");
                    return NotFound(new { isSuccess = false, message = "User not found" });
                }

                // Get follow counts
                int followersCount = await _context.UserFollows
                    .CountAsync(f => f.FollowedId == id);

                int followingCount = await _context.UserFollows
                    .CountAsync(f => f.FollowerId == id);

                // Get total likes received on properties
                int totalLikes = 0;
                var userProperties = await _context.Properties
                    .Where(p => p.UserId == id)
                    .Select(p => p.Id)
                    .ToListAsync();

                if (userProperties.Any())
                {
                    totalLikes = await _context.Likes
                        .CountAsync(l => userProperties.Contains(l.PropertyId));
                }

                // Get the username (either UserName or FirstName + LastName)
                string username = user.UserName ?? $"{user.FirstName} {user.LastName}".Trim();

                // Construct response
                var userProfileData = new
                {
                    id = user.Id,
                    username = username,
                    firstName = user.FirstName,
                    lastName = user.LastName,
                    email = user.Email,
                    bio = user.Bio ?? string.Empty,
                    profilePictureUrl = user.ProfilePictureUrl ?? string.Empty,
                    followersCount,
                    followingCount,
                    totalLikes,
                    isVerified = false, // Add logic for verification if needed
                    createdAt = user.CreatedAt,
                    lastLogin = user.LastLogin
                };

                return Ok(new { isSuccess = true, data = userProfileData });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user data");
                return StatusCode(500, new { isSuccess = false, message = "An error occurred while processing your request", detail = ex.Message });
            }
        }

        // Other methods can stay the same
        // GET: api/User/current
        [HttpGet("current")]
        [Authorize]
        public async Task<IActionResult> GetCurrentUser()
        {
            try
            {
                var user = await _userManager.GetUserAsync(User);
                if (user == null)
                {
                    return Unauthorized(new { isSuccess = false, message = "User not authenticated" });
                }

                // Redirect to the GetUser method to avoid code duplication
                return await GetUser(user.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving current user data");
                return StatusCode(500, new { isSuccess = false, message = "An error occurred while processing your request" });
            }
        }

        // GET: api/User/username/{username}
        [HttpGet("username/{username}")]
        public async Task<IActionResult> GetUserByUsername(string username)
        {
            try
            {
                if (string.IsNullOrEmpty(username))
                {
                    return BadRequest(new { isSuccess = false, message = "Username is required" });
                }

                var user = await _userManager.FindByNameAsync(username);
                if (user == null)
                {
                    return NotFound(new { isSuccess = false, message = "User not found" });
                }

                // Redirect to the GetUser method to avoid code duplication
                return await GetUser(user.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user by username");
                return StatusCode(500, new { isSuccess = false, message = "An error occurred while processing your request" });
            }
        }

        // GET: api/User/search
        [HttpGet("search")]
        public async Task<IActionResult> SearchUsers([FromQuery] string query, [FromQuery] int limit = 10)
        {
            try
            {
                if (string.IsNullOrEmpty(query) || query.Length < 2)
                {
                    return BadRequest(new { isSuccess = false, message = "Search query must be at least 2 characters" });
                }

                var users = await _userManager.Users
                    .Where(u =>
                        u.UserName.Contains(query) ||
                        u.FirstName.Contains(query) ||
                        u.LastName.Contains(query) ||
                        (u.FirstName + " " + u.LastName).Contains(query))
                    .Take(limit)
                    .Select(u => new
                    {
                        id = u.Id,
                        username = u.UserName,
                        firstName = u.FirstName,
                        lastName = u.LastName,
                        profilePictureUrl = u.ProfilePictureUrl
                    })
                    .ToListAsync();

                return Ok(new { isSuccess = true, data = users });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching users");
                return StatusCode(500, new { isSuccess = false, message = "An error occurred while processing your request" });
            }
        }

        // Test endpoint to verify controller is working
        [HttpGet("test")]
        public IActionResult Test()
        {
            return Ok(new { message = "User controller is working!", timestamp = DateTime.UtcNow });
        }
    }
}