using System;
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

        [ForeignKey("PropertyId")]
        public virtual Property Property { get; set; }

        [ForeignKey("UserId")]
        public virtual ApplicationUser User { get; set; }
    }
}