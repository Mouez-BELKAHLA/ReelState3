using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReelState.Data;
using ReelState.Server.Models;
using ReelState.Server.Models.DTOs;
using ReelState.Server.Services;

namespace ReelState.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LikesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly NotificationService _notificationService;

        public LikesController(
            ApplicationDbContext context,
            NotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        // GET: api/Likes/status/{propertyId}
        [HttpGet("status/{propertyId}")]
        [Authorize]
        public async Task<ActionResult<LikeStatusDto>> GetLikeStatus(string propertyId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new LikeStatusDto
                {
                    IsSuccess = false
                });
            }

            var property = await _context.Properties.FindAsync(propertyId);

            if (property == null)
            {
                return NotFound(new LikeStatusDto
                {
                    IsSuccess = false
                });
            }

            var like = await _context.Likes
                .FirstOrDefaultAsync(l => l.PropertyId == propertyId && l.UserId == userId);

            var likesCount = await _context.Likes.CountAsync(l => l.PropertyId == propertyId);

            return Ok(new LikeStatusDto
            {
                IsSuccess = true,
                IsLiked = like != null,
                LikesCount = likesCount
            });
        }

        // POST: api/Likes/toggle
        [HttpPost("toggle")]
        [Authorize]
        public async Task<ActionResult<LikeResponseDto>> ToggleLike([FromBody] LikeRequestDto request)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new LikeResponseDto
                {
                    IsSuccess = false,
                    Message = "User not authenticated"
                });
            }

            var property = await _context.Properties.FindAsync(request.PropertyId);

            if (property == null)
            {
                return NotFound(new LikeResponseDto
                {
                    IsSuccess = false,
                    Message = "Property not found"
                });
            }

            var like = await _context.Likes
                .FirstOrDefaultAsync(l => l.PropertyId == request.PropertyId && l.UserId == userId);

            // Check if we are liking our own property
            bool isOwnProperty = property.UserId == userId;

            if (like != null)
            {
                // Unlike: Remove existing like
                _context.Likes.Remove(like);
                await _context.SaveChangesAsync();

                var likesCount = await _context.Likes.CountAsync(l => l.PropertyId == request.PropertyId);

                return Ok(new LikeResponseDto
                {
                    IsSuccess = true,
                    IsLiked = false,
                    LikesCount = likesCount
                });
            }
            else
            {
                try
                {
                    // Like: Add new like
                    like = new Like(request.PropertyId, userId);

                    _context.Likes.Add(like);
                    await _context.SaveChangesAsync();

                    // Only create notification if the like was successfully added
                    // and it's not the user's own property
                    if (!isOwnProperty)
                    {
                        try
                        {
                            // Create notification
                            await _notificationService.CreatePropertyLikeNotification(request.PropertyId, userId);
                            Console.WriteLine($"Created property like notification for property {request.PropertyId}");
                        }
                        catch (Exception ex)
                        {
                            // Log the error but don't fail the like operation
                            Console.WriteLine($"Error creating property like notification: {ex.Message}");
                        }
                    }
                    else
                    {
                        Console.WriteLine($"Skip notification for user liking their own property {request.PropertyId}");
                    }

                    var likesCount = await _context.Likes.CountAsync(l => l.PropertyId == request.PropertyId);

                    return Ok(new LikeResponseDto
                    {
                        IsSuccess = true,
                        IsLiked = true,
                        LikesCount = likesCount
                    });
                }
                catch (Exception ex)
                {
                    return BadRequest(new LikeResponseDto
                    {
                        IsSuccess = false,
                        Message = $"Error adding like: {ex.Message}"
                    });
                }
            }
        }
    }
}