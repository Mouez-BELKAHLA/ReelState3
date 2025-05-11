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
    public class CommentLikesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CommentLikesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/CommentLikes/status/{commentId}
        [HttpGet("status/{commentId}")]
        [Authorize]
        public async Task<ActionResult<CommentLikeStatusDto>> GetLikeStatus(string commentId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new CommentLikeStatusDto
                {
                    IsSuccess = false
                });
            }

            var comment = await _context.Comments.FindAsync(commentId);

            if (comment == null)
            {
                return NotFound(new CommentLikeStatusDto
                {
                    IsSuccess = false
                });
            }

            var like = await _context.CommentLikes
                .FirstOrDefaultAsync(l => l.CommentId == commentId && l.UserId == userId);

            var likesCount = await _context.CommentLikes.CountAsync(l => l.CommentId == commentId);

            return Ok(new CommentLikeStatusDto
            {
                IsSuccess = true,
                IsLiked = like != null,
                LikesCount = likesCount
            });
        }

        // POST: api/CommentLikes/toggle
        [HttpPost("toggle")]
        [Authorize]
        public async Task<ActionResult<CommentLikeResponseDto>> ToggleLike([FromBody] CommentLikeRequestDto request)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new CommentLikeResponseDto
                {
                    IsSuccess = false,
                    Message = "User not authenticated"
                });
            }

            var comment = await _context.Comments.FindAsync(request.CommentId);

            if (comment == null)
            {
                return NotFound(new CommentLikeResponseDto
                {
                    IsSuccess = false,
                    Message = "Comment not found"
                });
            }

            var like = await _context.CommentLikes
                .FirstOrDefaultAsync(l => l.CommentId == request.CommentId && l.UserId == userId);

            if (like != null)
            {
                // Unlike: Remove existing like
                _context.CommentLikes.Remove(like);
                await _context.SaveChangesAsync();

                var likesCount = await _context.CommentLikes.CountAsync(l => l.CommentId == request.CommentId);

                return Ok(new CommentLikeResponseDto
                {
                    IsSuccess = true,
                    IsLiked = false,
                    LikesCount = likesCount
                });
            }
            else
            {
                // Like: Add new like
                like = new CommentLike(request.CommentId, userId);

                _context.CommentLikes.Add(like);
                await _context.SaveChangesAsync();

                var likesCount = await _context.CommentLikes.CountAsync(l => l.CommentId == request.CommentId);

                return Ok(new CommentLikeResponseDto
                {
                    IsSuccess = true,
                    IsLiked = true,
                    LikesCount = likesCount
                });
            }
        }
    }
}