namespace ReelState.Server.Models.DTOs
{
    // For like request
    public class LikeRequestDto
    {
        public string PropertyId { get; set; }
    }

    // For like response
    public class LikeResponseDto
    {
        public bool IsSuccess { get; set; }
        public bool IsLiked { get; set; }
        public int LikesCount { get; set; }
        public string Message { get; set; }
    }

    // For like status
    public class LikeStatusDto
    {
        public bool IsSuccess { get; set; }
        public bool IsLiked { get; set; }
        public int LikesCount { get; set; }
    }
}