using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ReelState.Server.Models
{
    public class Property
    {
        public Property()
        {
            // Initialize the ID property in the constructor
            Id = Guid.NewGuid().ToString();
            CreatedAt = DateTime.UtcNow;
            Photos = new List<PropertyPhoto>();
        }

        [Key]
        public string Id { get; set; }

        [Required]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Caption { get; set; } = string.Empty;

        public int Rooms { get; set; }

        [Required]
        public string PropertyType { get; set; } = string.Empty;

        public int Space { get; set; }

        public string Address { get; set; } = string.Empty;

        public string City { get; set; } = string.Empty;

        public double Latitude { get; set; }

        public double Longitude { get; set; }

        [Required]
        public string VideoUrl { get; set; } = string.Empty;

        [Required]
        public string UserId { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }

        [ForeignKey("UserId")]
        public virtual ApplicationUser? User { get; set; }

        public virtual ICollection<PropertyPhoto> Photos { get; set; }
    }

    public class PropertyPhoto
    {
        public PropertyPhoto()
        {
            // Initialize the ID property in the constructor
            Id = Guid.NewGuid().ToString();
            CreatedAt = DateTime.UtcNow;
        }

        [Key]
        public string Id { get; set; }

        [Required]
        public string PropertyId { get; set; } = string.Empty;

        [Required]
        public string PhotoUrl { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }

        [ForeignKey("PropertyId")]
        public virtual Property? Property { get; set; }
    }
}