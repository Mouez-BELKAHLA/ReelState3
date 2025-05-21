using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ReelState.Data;
using ReelState.Server.Models;
using ReelState.Server.Services;

namespace ReelState.Server.Controllers
{
    [Authorize(Roles = "Admin")]
    [Route("api/[controller]")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<AdminController> _logger;
        private readonly NotificationService _notificationService;

        public AdminController(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager,
            ILogger<AdminController> logger,
            NotificationService notificationService)
        {
            _context = context;
            _userManager = userManager;
            _logger = logger;
            _notificationService = notificationService;
        }

        // GET: api/Admin/pending-videos
        [HttpGet("pending-videos")]
        public async Task<IActionResult> GetPendingVideos()
        {
            try
            {
                var pendingProperties = await _context.Properties
                    .Where(p => p.Status == PropertyStatus.Pending)
                    .Include(p => p.User)
                    .Include(p => p.Photos)
                    .OrderByDescending(p => p.CreatedAt)
                    .ToListAsync();

                var result = pendingProperties.Select(p => new
                {
                    id = p.Id,
                    userId = p.UserId,
                    username = p.User != null ? (p.User.UserName ?? $"{p.User.FirstName} {p.User.LastName}") : "Unknown User",
                    caption = p.Caption,
                    videoUrl = p.VideoUrl,
                    likes = _context.Likes.Count(l => l.PropertyId == p.Id),
                    comments = _context.Comments.Count(c => c.PropertyId == p.Id),
                    avatarUrl = p.User?.ProfilePictureUrl,
                    rooms = p.Rooms,
                    propertyType = p.PropertyType,
                    space = p.Space,
                    photos = p.Photos.Select(photo => new { id = photo.Id, photoUrl = photo.PhotoUrl }),
                    location = new
                    {
                        address = p.Address,
                        city = p.City,
                        coordinates = new
                        {
                            lat = p.Latitude,
                            lng = p.Longitude
                        }
                    },
                    title = p.Title,
                    createdAt = p.CreatedAt
                }).ToList();

                return Ok(new { isSuccess = true, videos = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving pending videos");
                return StatusCode(500, new { isSuccess = false, message = "An error occurred while retrieving pending videos" });
            }
        }

        // PUT: api/Admin/approve-video/{id}
        [HttpPut("approve-video/{id}")]
        public async Task<IActionResult> ApproveVideo(string id)
        {
            try
            {
                var property = await _context.Properties
                    .Include(p => p.User)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (property == null)
                {
                    return NotFound(new { isSuccess = false, message = "Property not found" });
                }

                if (property.Status != PropertyStatus.Pending)
                {
                    return BadRequest(new { isSuccess = false, message = "Property is not in pending status" });
                }

                property.Status = PropertyStatus.Approved;
                await _context.SaveChangesAsync();

                // Manually create notification instead of using CreateNotification
                if (property.User != null)
                {
                    // Create notification directly using Notification model
                    var notification = new Notification
                    {
                        UserId = property.UserId,
                        SenderId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value,
                        Type = "property_approved",
                        Message = "Your property listing has been approved!",
                        PropertyId = property.Id,
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.Notifications.Add(notification);
                    await _context.SaveChangesAsync();
                }

                return Ok(new { isSuccess = true, message = "Property approved successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error approving video");
                return StatusCode(500, new { isSuccess = false, message = "An error occurred while approving the video" });
            }
        }

        // PUT: api/Admin/reject-video/{id}
        [HttpPut("reject-video/{id}")]
        public async Task<IActionResult> RejectVideo(string id, [FromBody] RejectVideoDto model)
        {
            try
            {
                if (string.IsNullOrEmpty(model.Reason))
                {
                    return BadRequest(new { isSuccess = false, message = "Rejection reason is required" });
                }

                var property = await _context.Properties
                    .Include(p => p.User)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (property == null)
                {
                    return NotFound(new { isSuccess = false, message = "Property not found" });
                }

                if (property.Status != PropertyStatus.Pending)
                {
                    return BadRequest(new { isSuccess = false, message = "Property is not in pending status" });
                }

                property.Status = PropertyStatus.Rejected;
                property.RejectionReason = model.Reason;
                await _context.SaveChangesAsync();

                // Manually create notification instead of using CreateNotification
                if (property.User != null)
                {
                    // Create notification directly using Notification model
                    var notification = new Notification
                    {
                        UserId = property.UserId,
                        SenderId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value,
                        Type = "property_rejected",
                        Message = $"Your property listing has been rejected: {model.Reason}",
                        PropertyId = property.Id,
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.Notifications.Add(notification);
                    await _context.SaveChangesAsync();
                }

                return Ok(new { isSuccess = true, message = "Property rejected successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error rejecting video");
                return StatusCode(500, new { isSuccess = false, message = "An error occurred while rejecting the video" });
            }
        }

        // Create a test endpoint to check if the admin controller is working
        [HttpGet("test")]
        public IActionResult Test()
        {
            return Ok(new { message = "Admin controller is working!", timestamp = DateTime.UtcNow });
        }
    }

    public class RejectVideoDto
    {
        public string Reason { get; set; } = string.Empty;
    }
}