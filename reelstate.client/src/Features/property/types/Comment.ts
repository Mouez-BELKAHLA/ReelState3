// Update the Comment interface
export interface Comment {
    id: string;
    userId: string;
    username: string;
    avatarUrl: string;
    text: string;
    createdAt: string;
    propertyId?: string;
    parentCommentId?: string | null;
    replies?: Comment[];
    isLiked: boolean; // Add this
    likesCount: number; // Add this
}