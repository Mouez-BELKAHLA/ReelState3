using Microsoft.AspNetCore.Identity;
using System;

namespace ReelState.Server.Models // Updated namespace to match folder structure
{
    public class ApplicationUser : IdentityUser
    {
        // Required properties with initializers
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;

        // Optional properties should be nullable
        public string? ProfilePictureUrl { get; set; }
        public string? RefreshToken { get; set; }

        // Non-nullable DateTime should have default values
        public DateTime RefreshTokenExpiryTime { get; set; } = DateTime.MinValue;

        // Required with defaults
        public string Provider { get; set; } = "Local";
        public string ProviderId { get; set; } = string.Empty;

        // Already has default
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Already nullable
        public DateTime? LastLogin { get; set; }
    }
}