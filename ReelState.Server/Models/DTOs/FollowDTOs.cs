namespace ReelState.Server.Models.DTOs
{
    public class FollowRequestDto
    {
        public string UserId { get; set; } = string.Empty;
    }

    public class FollowStatusDto
    {
        public bool IsSuccess { get; set; }
        public bool IsFollowing { get; set; }
        public int FollowersCount { get; set; }
        public int FollowingCount { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public class FollowCountDto
    {
        public bool IsSuccess { get; set; }
        public int FollowersCount { get; set; }
        public int FollowingCount { get; set; }
    }
}