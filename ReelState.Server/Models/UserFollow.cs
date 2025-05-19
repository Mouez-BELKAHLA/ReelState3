using ReelState.Server.Models;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

public class UserFollow
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    public string FollowerId { get; set; } = string.Empty;

    [Required]
    public string FollowedId { get; set; } = string.Empty;

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties should be nullable with EF Core
    [ForeignKey("FollowerId")]
    public ApplicationUser? Follower { get; set; }

    [ForeignKey("FollowedId")]
    public ApplicationUser? Followed { get; set; }

    // Default constructor for EF Core
    public UserFollow() { }

    // Parameterized constructor
    public UserFollow(string followerId, string followedId)
    {
        FollowerId = followerId;
        FollowedId = followedId;
    }
}