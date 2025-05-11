using System;
using System.ComponentModel.DataAnnotations;

namespace ReelState.Server.Models.DTOs
{
    // DTO for creating a new comment
    public class CommentCreateDto
    {
        [Required]
        public required string PropertyId { get; set; }

        [Required]
        [MaxLength(1000)]
        public required string Text { get; set; }
    }

    // DTO for comment responses
    public class CommentResponseDto
    {
        public string Id { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string AvatarUrl { get; set; } = string.Empty;
        public string Text { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}