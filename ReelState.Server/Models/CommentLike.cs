using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ReelState.Server.Models
{
    public class CommentLike
    {
        public CommentLike()
        {
            Id = Guid.NewGuid().ToString();
            CreatedAt = DateTime.UtcNow;
            CommentId = string.Empty;
            UserId = string.Empty;
        }

        public CommentLike(string commentId, string userId)
        {
            Id = Guid.NewGuid().ToString();
            CreatedAt = DateTime.UtcNow;
            CommentId = commentId;
            UserId = userId;
        }

        [Key]
        public string Id { get; set; }

        [Required]
        public string CommentId { get; set; }

        [Required]
        public string UserId { get; set; }

        public DateTime CreatedAt { get; set; }

        [ForeignKey("CommentId")]
        public virtual Comment? Comment { get; set; }

        [ForeignKey("UserId")]
        public virtual ApplicationUser? User { get; set; }
    }
}