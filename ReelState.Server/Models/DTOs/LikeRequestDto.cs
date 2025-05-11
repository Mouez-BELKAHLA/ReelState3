namespace ReelState.Server.Models.DTOs
{
    // For like request
    public class LikeRequestDto
    {
        public required string PropertyId { get; set; }
    }

    // For like response
    public class LikeResponseDto
    {
        public bool IsSuccess { get; set; }
        public bool IsLiked { get; set; }
        public int LikesCount { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    // For like status
    public class LikeStatusDto
    {
        public bool IsSuccess { get; set; }
        public bool IsLiked { get; set; }
        public int LikesCount { get; set; }
    }
}