using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ReelState.Data;
using ReelState.Server.Models;
using ReelState.Server.Models.DTOs;
using ReelState.Server.Services;

namespace ReelState.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class FollowsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly NotificationService _notificationService;
        private readonly ILogger<FollowsController> _logger;

        public FollowsController(
            ApplicationDbContext context,
            NotificationService notificationService,
            ILogger<FollowsController> logger)
        {
            _context = context;
            _notificationService = notificationService;
            _logger = logger;
        }

        // GET: api/Follows/status/{userId}
        [HttpGet("status/{userId}")]
        public async Task<ActionResult<FollowStatusDto>> GetFollowStatus(string userId)
        {
            try
            {
                _logger.LogInformation($"GetFollowStatus called for userId: {userId}");

                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                _logger.LogInformation($"Current user ID: {currentUserId}");

                if (string.IsNullOrEmpty(currentUserId))
                {
                    _logger.LogWarning("Current user ID is null or empty");
                    return Unauthorized(new FollowStatusDto { IsSuccess = false });
                }

                if (currentUserId == userId)
                {
                    _logger.LogInformation("User attempted to check follow status for self");
                    return BadRequest(new FollowStatusDto
                    {
                        IsSuccess = false,
                        Message = "You cannot follow yourself"
                    });
                }

                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    _logger.LogWarning($"User not found: {userId}");
                    return NotFound(new FollowStatusDto
                    {
                        IsSuccess = false,
                        Message = "User not found"
                    });
                }

                // Check if already following
                var isFollowing = await _context.UserFollows
                    .AnyAsync(f => f.FollowerId == currentUserId && f.FollowedId == userId);

                _logger.LogInformation($"Is following: {isFollowing}");

                // Get counts
                var followersCount = await _context.UserFollows
                    .CountAsync(f => f.FollowedId == userId);

                var followingCount = await _context.UserFollows
                    .CountAsync(f => f.FollowerId == userId);

                _logger.LogInformation($"Follower count: {followersCount}, Following count: {followingCount}");

                // Create dto object
                var statusDto = new FollowStatusDto
                {
                    IsSuccess = true,
                    IsFollowing = isFollowing,
                    FollowersCount = followersCount,
                    FollowingCount = followingCount
                };

                return Ok(statusDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting follow status");
                return StatusCode(500, new FollowStatusDto
                {
                    IsSuccess = false,
                    Message = "An error occurred while processing your request"
                });
            }
        }

        // POST: api/Follows/toggle
        // POST: api/Follows/toggle
        [HttpPost("toggle")]
        public async Task<ActionResult<FollowStatusDto>> ToggleFollow([FromBody] FollowRequestDto request)
        {
            try
            {
                _logger.LogInformation($"ToggleFollow called for userId: {request?.UserId}");

                if (request == null || string.IsNullOrEmpty(request.UserId))
                {
                    _logger.LogWarning("FollowRequestDto is null or UserId is empty");
                    return BadRequest(new FollowStatusDto
                    {
                        IsSuccess = false,
                        Message = "User ID is required"
                    });
                }

                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                _logger.LogInformation($"Current user ID: {currentUserId}");

                if (string.IsNullOrEmpty(currentUserId))
                {
                    _logger.LogWarning("Current user ID is null or empty");
                    return Unauthorized(new FollowStatusDto { IsSuccess = false });
                }

                if (currentUserId == request.UserId)
                {
                    _logger.LogInformation("User attempted to follow self");
                    return BadRequest(new FollowStatusDto
                    {
                        IsSuccess = false,
                        Message = "You cannot follow yourself"
                    });
                }

                var user = await _context.Users.FindAsync(request.UserId);
                if (user == null)
                {
                    _logger.LogWarning($"User not found: {request.UserId}");
                    return NotFound(new FollowStatusDto
                    {
                        IsSuccess = false,
                        Message = "User not found"
                    });
                }

                // Check if already following
                var existingFollow = await _context.UserFollows
                    .FirstOrDefaultAsync(f => f.FollowerId == currentUserId && f.FollowedId == request.UserId);

                bool isNowFollowing = false;

                if (existingFollow == null)
                {
                    // Follow: create new follow relationship
                    _logger.LogInformation($"Creating new follow relationship: {currentUserId} -> {request.UserId}");
                    var follow = new UserFollow(currentUserId, request.UserId);

                    _context.UserFollows.Add(follow);
                    await _context.SaveChangesAsync();
                    isNowFollowing = true;

                    // Create notification
                    try
                    {
                        _logger.LogInformation($"About to create follow notification for user {request.UserId}");
                        await _notificationService.CreateFollowNotification(request.UserId, currentUserId);
                        _logger.LogInformation($"Successfully created follow notification");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error creating follow notification");
                        // Continue - notifications are non-critical
                    }
                }
                else
                {
                    // Unfollow: remove existing follow relationship
                    _logger.LogInformation($"Removing follow relationship: {currentUserId} -> {request.UserId}");
                    _context.UserFollows.Remove(existingFollow);
                    await _context.SaveChangesAsync();
                    isNowFollowing = false;
                }

                // Get updated counts
                var followersCount = await _context.UserFollows
                    .CountAsync(f => f.FollowedId == request.UserId);

                var followingCount = await _context.UserFollows
                    .CountAsync(f => f.FollowerId == request.UserId);

                _logger.LogInformation($"Updated follower count: {followersCount}, Following count: {followingCount}");

                // Create dto object with correct following state
                var statusDto = new FollowStatusDto
                {
                    IsSuccess = true,
                    IsFollowing = isNowFollowing,
                    FollowersCount = followersCount,
                    FollowingCount = followingCount
                };

                return Ok(statusDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling follow");
                return StatusCode(500, new FollowStatusDto
                {
                    IsSuccess = false,
                    Message = "An error occurred while processing your request"
                });
            }
        }

        // GET: api/Follows/count/{userId}
        [HttpGet("count/{userId}")]
        [AllowAnonymous]
        public async Task<ActionResult<FollowCountDto>> GetFollowCounts(string userId)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    return NotFound(new FollowCountDto { IsSuccess = false });
                }

                var followersCount = await _context.UserFollows
                    .CountAsync(f => f.FollowedId == userId);

                var followingCount = await _context.UserFollows
                    .CountAsync(f => f.FollowerId == userId);

                return Ok(new FollowCountDto
                {
                    IsSuccess = true,
                    FollowersCount = followersCount,
                    FollowingCount = followingCount
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting follow counts");
                return StatusCode(500, new FollowCountDto
                {
                    IsSuccess = false
                });
            }
        }

        // Other methods can remain the same...
    }
}