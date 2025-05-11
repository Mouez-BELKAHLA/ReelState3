using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ReelState.Server.Models
{
    public class Comment
    {
        public Comment()
        {
            // Initialize the ID property in the constructor
            Id = Guid.NewGuid().ToString();
            CreatedAt = DateTime.UtcNow;
            // Default values to satisfy non-null requirements
            PropertyId = string.Empty;
            UserId = string.Empty;
            Text = string.Empty;

            // Initialize collections
            Replies = new List<Comment>();
            Likes = new List<CommentLike>();
        }

        [Key]
        public string Id { get; set; }

        [Required]
        public string PropertyId { get; set; }

        [Required]
        public string UserId { get; set; }

        [Required]
        [MaxLength(1000)]
        public string Text { get; set; }

        public DateTime CreatedAt { get; set; }

        // Field for reply functionality
        public string? ParentCommentId { get; set; }

        [ForeignKey("PropertyId")]
        public virtual Property? Property { get; set; }

        [ForeignKey("UserId")]
        public virtual ApplicationUser? User { get; set; }

        [ForeignKey("ParentCommentId")]
        public virtual Comment? ParentComment { get; set; }

        public virtual ICollection<Comment> Replies { get; set; }

        // Add likes collection
        public virtual ICollection<CommentLike> Likes { get; set; }
    }
}