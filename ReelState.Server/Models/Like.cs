using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ReelState.Server.Models
{
    public class Like
    {
        // Parameterless constructor for EF Core
        protected Like()
        {
            Id = Guid.NewGuid().ToString();
            CreatedAt = DateTime.UtcNow;
            PropertyId = string.Empty; // Default value to satisfy compiler
            UserId = string.Empty;     // Default value to satisfy compiler
        }

        // Main constructor to use when creating new likes
        public Like(string propertyId, string userId)
        {
            Id = Guid.NewGuid().ToString();
            CreatedAt = DateTime.UtcNow;
            PropertyId = propertyId;
            UserId = userId;
        }

        [Key]
        public string Id { get; set; }

        [Required]
        public string PropertyId { get; set; }

        [Required]
        public string UserId { get; set; }

        public DateTime CreatedAt { get; set; }

        [ForeignKey("PropertyId")]
        public virtual Property? Property { get; set; }

        [ForeignKey("UserId")]
        public virtual ApplicationUser? User { get; set; }
    }
}