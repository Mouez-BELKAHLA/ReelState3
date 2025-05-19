using System;
using System.Collections.Generic;

namespace ReelState.Server.Models.DTOs
{
    public class UserActivityDto
    {
        public CommentsActivityDto Comments { get; set; } = new CommentsActivityDto();
        public LikesActivityDto Likes { get; set; } = new LikesActivityDto();
        public LikedCommentsActivityDto LikedComments { get; set; } = new LikedCommentsActivityDto();
        public PropertiesActivityDto Properties { get; set; } = new PropertiesActivityDto();
        public FollowingActivityDto Following { get; set; } = new FollowingActivityDto();
        public FollowersActivityDto Followers { get; set; } = new FollowersActivityDto();
    }

    public class CommentsActivityDto
    {
        public int Total { get; set; }
        public List<CommentActivityItemDto> Recent { get; set; } = new List<CommentActivityItemDto>();
    }

    public class CommentActivityItemDto
    {
        public string Id { get; set; } = string.Empty;
        public string PropertyId { get; set; } = string.Empty;
        public string PropertyTitle { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class LikesActivityDto
    {
        public int Total { get; set; }
        public List<LikeActivityItemDto> Recent { get; set; } = new List<LikeActivityItemDto>();
    }

    public class LikeActivityItemDto
    {
        public string Id { get; set; } = string.Empty;
        public string PropertyId { get; set; } = string.Empty;
        public string PropertyTitle { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public string? PropertyImage { get; set; }
    }

    public class LikedCommentsActivityDto
    {
        public int Total { get; set; }
        public List<LikedCommentActivityItemDto> Recent { get; set; } = new List<LikedCommentActivityItemDto>();
    }

    public class LikedCommentActivityItemDto
    {
        public string Id { get; set; } = string.Empty;
        public string CommentId { get; set; } = string.Empty;
        public string PropertyId { get; set; } = string.Empty;
        public string PropertyTitle { get; set; } = string.Empty;
        public string CommentContent { get; set; } = string.Empty;
        public string CommentAuthor { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class PropertiesActivityDto
    {
        public int Total { get; set; }
        public List<PropertyActivityItemDto> Recent { get; set; } = new List<PropertyActivityItemDto>();
    }

    public class PropertyActivityItemDto
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    // New DTOs for Follows
    public class FollowingActivityDto
    {
        public int Total { get; set; }
        public List<FollowingActivityItemDto> Recent { get; set; } = new List<FollowingActivityItemDto>();
    }

    public class FollowingActivityItemDto
    {
        public string Id { get; set; } = string.Empty;
        public string FollowedUserId { get; set; } = string.Empty;
        public string FollowedUsername { get; set; } = string.Empty;
        public string? FollowedProfilePicture { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class FollowersActivityDto
    {
        public int Total { get; set; }
        public List<FollowerActivityItemDto> Recent { get; set; } = new List<FollowerActivityItemDto>();
    }

    public class FollowerActivityItemDto
    {
        public string Id { get; set; } = string.Empty;
        public string FollowerUserId { get; set; } = string.Empty;
        public string FollowerUsername { get; set; } = string.Empty;
        public string? FollowerProfilePicture { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}