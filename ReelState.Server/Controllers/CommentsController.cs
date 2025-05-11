using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReelState.Data;
using ReelState.Server.Models;
using ReelState.Server.Models.DTOs;

namespace ReelState.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CommentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CommentsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Comments/property/{propertyId}
        [HttpGet("property/{propertyId}")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<CommentResponseDto>>> GetPropertyComments(string propertyId)
        {
            // Existing code...

            // Try to get current user ID if authenticated
            var currentUserId = User.Identity?.IsAuthenticated == true ?
                User.FindFirst(ClaimTypes.NameIdentifier)?.Value : null;

            // Get only top-level comments (no parent)
            var comments = await _context.Comments
                .Include(c => c.User)
                .Include(c => c.Replies)
                    .ThenInclude(r => r.User)
                .Where(c => c.PropertyId == propertyId && c.ParentCommentId == null)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            // Map to DTOs with replies
            var commentDtos = new List<CommentResponseDto>();
            foreach (var comment in comments)
            {
                commentDtos.Add(await MapCommentWithRepliesAsync(comment, currentUserId));
            }

            return Ok(commentDtos);
        }

        // Helper method to recursively map comments and their replies
        private async Task<CommentResponseDto> MapCommentWithRepliesAsync(Comment comment, string? currentUserId)
        {
            bool isLiked = false;
            if (!string.IsNullOrEmpty(currentUserId))
            {
                isLiked = await _context.CommentLikes
                    .AnyAsync(l => l.CommentId == comment.Id && l.UserId == currentUserId);
            }

            var likesCount = await _context.CommentLikes
                .CountAsync(l => l.CommentId == comment.Id);

            var dto = new CommentResponseDto
            {
                Id = comment.Id,
                UserId = comment.UserId,
                Username = comment.User != null ? $"{comment.User.FirstName} {comment.User.LastName}" : "Unknown User",
                AvatarUrl = comment.User != null && comment.User.ProfilePictureUrl != null ? comment.User.ProfilePictureUrl : string.Empty,
                Text = comment.Text,
                CreatedAt = comment.CreatedAt,
                ParentCommentId = comment.ParentCommentId,
                IsLiked = isLiked,
                LikesCount = likesCount,
                Replies = new List<CommentResponseDto>()
            };

            // Add replies if they exist
            if (comment.Replies != null && comment.Replies.Any())
            {
                foreach (var reply in comment.Replies.OrderBy(r => r.CreatedAt))
                {
                    dto.Replies.Add(await MapCommentWithRepliesAsync(reply, currentUserId));
                }
            }

            return dto;
        }

        // POST: api/Comments
        [HttpPost]
        [Authorize]
        public async Task<ActionResult<CommentResponseDto>> PostComment([FromBody] CommentCreateDto commentDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User not authenticated");
            }

            var property = await _context.Properties.FindAsync(commentDto.PropertyId);
            if (property == null)
            {
                return NotFound("Property not found");
            }

            // Validate parent comment if it's a reply
            if (!string.IsNullOrEmpty(commentDto.ParentCommentId))
            {
                var parentComment = await _context.Comments.FindAsync(commentDto.ParentCommentId);
                if (parentComment == null)
                {
                    return NotFound("Parent comment not found");
                }

                // Ensure parent comment belongs to same property
                if (parentComment.PropertyId != commentDto.PropertyId)
                {
                    return BadRequest("Parent comment does not belong to the specified property");
                }
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound("User not found");
            }

            var comment = new Comment
            {
                PropertyId = commentDto.PropertyId,
                UserId = userId,
                Text = commentDto.Text,
                CreatedAt = DateTime.UtcNow,
                ParentCommentId = commentDto.ParentCommentId
            };

            _context.Comments.Add(comment);
            await _context.SaveChangesAsync();

            var commentResponse = new CommentResponseDto
            {
                Id = comment.Id,
                UserId = comment.UserId,
                Username = $"{user.FirstName} {user.LastName}",
                AvatarUrl = user.ProfilePictureUrl != null ? user.ProfilePictureUrl : string.Empty,
                Text = comment.Text,
                CreatedAt = comment.CreatedAt,
                ParentCommentId = comment.ParentCommentId,
                Replies = new List<CommentResponseDto>()
            };

            return CreatedAtAction("GetComment", new { id = comment.Id }, commentResponse);
        }

        // GET: api/Comments/{id}
        // GET: api/Comments/{id}
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<CommentResponseDto>> GetComment(string id)
        {
            var comment = await _context.Comments
                .Include(c => c.User)
                .Include(c => c.Replies)
                    .ThenInclude(r => r.User)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (comment == null)
            {
                return NotFound();
            }

            // Get current user ID if authenticated
            var currentUserId = User.Identity?.IsAuthenticated == true ?
                User.FindFirst(ClaimTypes.NameIdentifier)?.Value : null;

            return await MapCommentWithRepliesAsync(comment, currentUserId);
        }

        // DELETE: api/Comments/{id}
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteComment(string id)
        {
            var comment = await _context.Comments
                .Include(c => c.Replies)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (comment == null)
            {
                return NotFound();
            }

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (comment.UserId != userId)
            {
                return Forbid("You can only delete your own comments");
            }

            // Remove this comment and all its replies
            _context.Comments.Remove(comment);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}