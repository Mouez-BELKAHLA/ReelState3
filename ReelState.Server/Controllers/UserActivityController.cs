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
using ReelState.Server.Models.DTOs;
using System.Collections.Generic;

namespace ReelState.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserActivityController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<UserActivityController> _logger;

        public UserActivityController(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager,
            ILogger<UserActivityController> logger)
        {
            _context = context;
            _userManager = userManager;
            _logger = logger;
        }

        [HttpGet("{userId}/activity")]
        public async Task<ActionResult<UserActivityDto>> GetUserActivity(string userId)
        {
            try
            {
                _logger.LogInformation($"GetUserActivity called for userId: {userId}");

                // Ensure the current user can only access their own data
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null)
                {
                    _logger.LogWarning("Current user is null");
                    return Unauthorized(new { message = "User not authenticated" });
                }

                if (currentUser.Id != userId)
                {
                    _logger.LogWarning($"User {currentUser.Id} attempted to access data for user {userId}");
                    return Forbid();
                }

                // Create activity response
                var activityResponse = new UserActivityDto();

                // Get recent comments (with property details)
                try
                {
                    _logger.LogInformation("Fetching comments data");
                    var recentComments = await _context.Comments
                        .Where(c => c.UserId == userId)
                        .OrderByDescending(c => c.CreatedAt)
                        .Take(10)
                        .Join(
                            _context.Properties,
                            comment => comment.PropertyId,
                            property => property.Id,
                            (comment, property) => new CommentActivityItemDto
                            {
                                Id = comment.Id,
                                PropertyId = comment.PropertyId,
                                PropertyTitle = property.Title,
                                Content = comment.Text,
                                CreatedAt = comment.CreatedAt
                            })
                        .ToListAsync();

                    // Get total comments count
                    var totalComments = await _context.Comments
                        .CountAsync(c => c.UserId == userId);

                    // Assign to response
                    activityResponse.Comments = new CommentsActivityDto
                    {
                        Total = totalComments,
                        Recent = recentComments
                    };
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error fetching comments");
                    // Continue - don't let one section failure stop the entire response
                }

                // Get recent likes (with property details)
                try
                {
                    _logger.LogInformation("Fetching likes data");
                    // Get likes first
                    var userLikes = await _context.Likes
                        .Where(l => l.UserId == userId)
                        .OrderByDescending(l => l.CreatedAt)
                        .Take(10)
                        .ToListAsync();

                    // Process each like individually to avoid anonymous type issues
                    var likesWithImages = new List<LikeActivityItemDto>();

                    foreach (var like in userLikes)
                    {
                        // Get property info
                        var property = await _context.Properties
                            .FirstOrDefaultAsync(p => p.Id == like.PropertyId);

                        if (property != null)
                        {
                            // Get first photo
                            var firstImage = await _context.PropertyPhotos
                                .Where(p => p.PropertyId == property.Id)
                                .OrderBy(p => p.CreatedAt)
                                .Select(p => p.PhotoUrl)
                                .FirstOrDefaultAsync();

                            likesWithImages.Add(new LikeActivityItemDto
                            {
                                Id = like.Id,
                                PropertyId = like.PropertyId,
                                PropertyTitle = property.Title,
                                CreatedAt = like.CreatedAt,
                                PropertyImage = firstImage
                            });
                        }
                    }

                    // Get total likes count
                    var totalLikes = await _context.Likes
                        .CountAsync(l => l.UserId == userId);

                    // Assign to response
                    activityResponse.Likes = new LikesActivityDto
                    {
                        Total = totalLikes,
                        Recent = likesWithImages
                    };
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error fetching likes");
                    // Continue - don't let one section failure stop the entire response
                }

                // Get user properties
                try
                {
                    _logger.LogInformation("Fetching properties data");
                    var properties = await _context.Properties
                        .Where(p => p.UserId == userId)
                        .OrderByDescending(p => p.CreatedAt)
                        .Take(5)
                        .Select(p => new PropertyActivityItemDto
                        {
                            Id = p.Id,
                            Title = p.Title,
                            CreatedAt = p.CreatedAt
                        })
                        .ToListAsync();

                    var totalProperties = await _context.Properties
                        .CountAsync(p => p.UserId == userId);

                    // Assign to response
                    activityResponse.Properties = new PropertiesActivityDto
                    {
                        Total = totalProperties,
                        Recent = properties
                    };
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error fetching properties");
                    // Continue - don't let one section failure stop the entire response
                }

                // Get recent liked comments - Only if the table exists
                try
                {
                    _logger.LogInformation("Fetching liked comments data");

                    // Check if CommentLikes table exists by doing a count
                    bool commentLikesTableExists = true;
                    try
                    {
                        await _context.CommentLikes.CountAsync();
                    }
                    catch
                    {
                        commentLikesTableExists = false;
                    }

                    if (commentLikesTableExists)
                    {
                        // Use the same approach as with likes to avoid anonymous type issues
                        var userCommentLikes = await _context.CommentLikes
                            .Where(cl => cl.UserId == userId)
                            .OrderByDescending(cl => cl.CreatedAt)
                            .Take(10)
                            .ToListAsync();

                        var likedCommentsResult = new List<LikedCommentActivityItemDto>();

                        foreach (var commentLike in userCommentLikes)
                        {
                            // Get the comment
                            var comment = await _context.Comments
                                .Include(c => c.Property)
                                .Include(c => c.User)
                                .FirstOrDefaultAsync(c => c.Id == commentLike.CommentId);

                            if (comment != null)
                            {
                                likedCommentsResult.Add(new LikedCommentActivityItemDto
                                {
                                    Id = commentLike.Id,
                                    CommentId = commentLike.CommentId,
                                    PropertyId = comment.PropertyId,
                                    PropertyTitle = comment.Property?.Title ?? "Unknown Property",
                                    CommentContent = comment.Text,
                                    CommentAuthor = comment.User?.UserName ?? "Unknown User",
                                    CreatedAt = commentLike.CreatedAt
                                });
                            }
                        }

                        // Get total liked comments count
                        var totalLikedComments = await _context.CommentLikes
                            .CountAsync(cl => cl.UserId == userId);

                        // Assign to response
                        activityResponse.LikedComments = new LikedCommentsActivityDto
                        {
                            Total = totalLikedComments,
                            Recent = likedCommentsResult
                        };
                    }
                    else
                    {
                        _logger.LogWarning("CommentLikes table does not exist - returning empty data");
                        // Return empty data for this section
                        activityResponse.LikedComments = new LikedCommentsActivityDto
                        {
                            Total = 0,
                            Recent = new List<LikedCommentActivityItemDto>()
                        };
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error fetching liked comments");
                    // Return empty data for this section
                    activityResponse.LikedComments = new LikedCommentsActivityDto
                    {
                        Total = 0,
                        Recent = new List<LikedCommentActivityItemDto>()
                    };
                }

                // NEW: Get Following data
                try
                {
                    _logger.LogInformation("Fetching following data");

                    // Get users that the current user follows
                    var following = await _context.UserFollows
                        .Where(f => f.FollowerId == userId)
                        .OrderByDescending(f => f.CreatedAt)
                        .Take(10)
                        .Join(
                            _context.Users,
                            follow => follow.FollowedId,
                            user => user.Id,
                            (follow, user) => new FollowingActivityItemDto
                            {
                                Id = follow.Id,
                                FollowedUserId = user.Id,
                                FollowedUsername = string.IsNullOrEmpty(user.UserName)
                                    ? $"{user.FirstName} {user.LastName}"
                                    : user.UserName,
                                FollowedProfilePicture = user.ProfilePictureUrl,
                                CreatedAt = follow.CreatedAt
                            })
                        .ToListAsync();

                    // Get total following count
                    var totalFollowing = await _context.UserFollows
                        .CountAsync(f => f.FollowerId == userId);

                    // Assign to response
                    activityResponse.Following = new FollowingActivityDto
                    {
                        Total = totalFollowing,
                        Recent = following
                    };
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error fetching following data");
                    // Return empty data for this section
                    activityResponse.Following = new FollowingActivityDto
                    {
                        Total = 0,
                        Recent = new List<FollowingActivityItemDto>()
                    };
                }

                // NEW: Get Followers data
                try
                {
                    _logger.LogInformation("Fetching followers data");

                    // Get users that follow the current user
                    var followers = await _context.UserFollows
                        .Where(f => f.FollowedId == userId)
                        .OrderByDescending(f => f.CreatedAt)
                        .Take(10)
                        .Join(
                            _context.Users,
                            follow => follow.FollowerId,
                            user => user.Id,
                            (follow, user) => new FollowerActivityItemDto
                            {
                                Id = follow.Id,
                                FollowerUserId = user.Id,
                                FollowerUsername = string.IsNullOrEmpty(user.UserName)
                                    ? $"{user.FirstName} {user.LastName}"
                                    : user.UserName,
                                FollowerProfilePicture = user.ProfilePictureUrl,
                                CreatedAt = follow.CreatedAt
                            })
                        .ToListAsync();

                    // Get total followers count
                    var totalFollowers = await _context.UserFollows
                        .CountAsync(f => f.FollowedId == userId);

                    // Assign to response
                    activityResponse.Followers = new FollowersActivityDto
                    {
                        Total = totalFollowers,
                        Recent = followers
                    };
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error fetching followers data");
                    // Return empty data for this section
                    activityResponse.Followers = new FollowersActivityDto
                    {
                        Total = 0,
                        Recent = new List<FollowerActivityItemDto>()
                    };
                }

                return Ok(activityResponse);
            }
            catch (Exception ex)
            {
                // Log the exception with full details
                _logger.LogError(ex, "Error processing user activity request");
                return StatusCode(500, new { message = "An error occurred while processing your request", detail = ex.Message });
            }
        }

        // Endpoint to test if controller is accessible
        [HttpGet("test")]
        public IActionResult Test()
        {
            return Ok(new { message = "UserActivity controller is working!" });
        }
    }
}