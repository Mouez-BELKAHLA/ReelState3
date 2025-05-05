// Current Date and Time (UTC - YYYY-MM-DD HH:MM:SS formatted): 2025-05-05 21:40:30
// Current User's Login: Mouez-BELKAHLA

// This should match CommentResponseDto from your backend
export interface Comment {
    id: string;
    userId: string;
    username: string; // Required by CommentPanel
    avatarUrl: string; // Required by CommentPanel
    text: string;
    createdAt: string;
    propertyId?: string; // Optional since it's not in the DTO
}