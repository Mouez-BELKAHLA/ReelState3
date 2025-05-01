using System;
using System.ComponentModel.DataAnnotations;

namespace ReelState.Server.Models.DTOs
{
    // DTO for creating a new comment
    public class CommentCreateDto
    {
        [Required]
        public string PropertyId { get; set; }

        [Required]
        [MaxLength(1000)]
        public string Text { get; set; }
    }

    // DTO for comment responses
    public class CommentResponseDto
    {
        public string Id { get; set; }
        public string UserId { get; set; }
        public string Username { get; set; }
        public string AvatarUrl { get; set; }
        public string Text { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}