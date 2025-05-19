using System;
using System.Collections.Generic;

namespace ReelState.Server.Models.DTOs
{
    // For user follows (who you follow)
    public class FollowActivityItemDto
    {
        public string Id { get; set; }
        public string FollowedUserId { get; set; }
        public string FollowedUsername { get; set; }
        public string FollowedUserProfilePicture { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    // For user followers (who follows you)
    public class FollowerActivityItemDto
    {
        public string Id { get; set; }
        public string FollowerUserId { get; set; }
        public string FollowerUsername { get; set; }
        public string FollowerProfilePicture { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    // Collection of follows
    public class FollowsActivityDto
    {
        public int Total { get; set; }
        public List<FollowActivityItemDto> Recent { get; set; } = new List<FollowActivityItemDto>();
    }

    // Collection of followers
    public class FollowersActivityDto
    {
        public int Total { get; set; }
        public List<FollowerActivityItemDto> Recent { get; set; } = new List<FollowerActivityItemDto>();
    }
}