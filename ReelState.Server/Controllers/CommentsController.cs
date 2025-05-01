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
            if (string.IsNullOrEmpty(propertyId))
            {
                return BadRequest("Property ID is required");
            }

            var property = await _context.Properties.FindAsync(propertyId);
            if (property == null)
            {
                return NotFound("Property not found");
            }

            var comments = await _context.Comments
                .Include(c => c.User)
                .Where(c => c.PropertyId == propertyId)
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new CommentResponseDto
                {
                    Id = c.Id,
                    UserId = c.UserId,
                    Username = c.User.FirstName + " " + c.User.LastName,
                    AvatarUrl = c.User.ProfilePictureUrl,
                    Text = c.Text,
                    CreatedAt = c.CreatedAt
                })
                .ToListAsync();

            return Ok(comments);
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
                CreatedAt = DateTime.UtcNow
            };

            _context.Comments.Add(comment);
            await _context.SaveChangesAsync();

            var commentResponse = new CommentResponseDto
            {
                Id = comment.Id,
                UserId = comment.UserId,
                Username = user.FirstName + " " + user.LastName,
                AvatarUrl = user.ProfilePictureUrl,
                Text = comment.Text,
                CreatedAt = comment.CreatedAt
            };

            return CreatedAtAction("GetComment", new { id = comment.Id }, commentResponse);
        }

        // GET: api/Comments/{id}
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<CommentResponseDto>> GetComment(string id)
        {
            var comment = await _context.Comments
                .Include(c => c.User)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (comment == null)
            {
                return NotFound();
            }

            var commentDto = new CommentResponseDto
            {
                Id = comment.Id,
                UserId = comment.UserId,
                Username = comment.User.FirstName + " " + comment.User.LastName,
                AvatarUrl = comment.User.ProfilePictureUrl,
                Text = comment.Text,
                CreatedAt = comment.CreatedAt
            };

            return commentDto;
        }

        // DELETE: api/Comments/{id}
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteComment(string id)
        {
            var comment = await _context.Comments.FindAsync(id);
            if (comment == null)
            {
                return NotFound();
            }

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (comment.UserId != userId)
            {
                return Forbid("You can only delete your own comments");
            }

            _context.Comments.Remove(comment);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}