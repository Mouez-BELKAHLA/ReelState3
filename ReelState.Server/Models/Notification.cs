using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ReelState.Server.Models
{
    public class Notification
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string UserId { get; set; }  // User who receives the notification

        public string? SenderId { get; set; }  // User who triggered the notification (optional)

        [Required]
        public string Type { get; set; }  // like, comment, follow, property_view, system

        [Required]
        public string Message { get; set; }

        public string? PropertyId { get; set; }

        public string? CommentId { get; set; }

        [Required]
        public bool IsRead { get; set; } = false;

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("UserId")]
        public ApplicationUser User { get; set; }

        [ForeignKey("SenderId")]
        public ApplicationUser? Sender { get; set; }

        [ForeignKey("PropertyId")]
        public Property? Property { get; set; }

        [ForeignKey("CommentId")]
        public Comment? Comment { get; set; }

        // Default constructor for EF Core
        public Notification() { }

        // Parameterized constructor for convenience
        public Notification(string userId, string type, string message)
        {
            UserId = userId;
            Type = type;
            Message = message;
        }
    }
}