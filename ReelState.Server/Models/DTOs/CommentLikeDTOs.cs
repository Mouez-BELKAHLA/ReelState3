using System.ComponentModel.DataAnnotations;

namespace ReelState.Server.Models.DTOs
{
    // DTO for comment like status
    public class CommentLikeStatusDto
    {
        public bool IsSuccess { get; set; }
        public bool IsLiked { get; set; }
        public int LikesCount { get; set; }
    }

    // DTO for comment like request
    public class CommentLikeRequestDto
    {
        [Required]
        public required string CommentId { get; set; }
    }

    // DTO for comment like response
    public class CommentLikeResponseDto
    {
        public bool IsSuccess { get; set; }
        public bool IsLiked { get; set; }
        public int LikesCount { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}