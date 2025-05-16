// User Activity Types

export interface CommentActivity {
    id: string;
    propertyId: string;
    propertyTitle: string;
    content: string;
    createdAt: string;
}

export interface LikeActivity {
    id: string;
    propertyId: string;
    propertyTitle: string;
    createdAt: string;
    propertyImage?: string;
}

export interface LikedCommentActivity {
    id: string;
    commentId: string;
    propertyId: string;
    propertyTitle: string;
    commentContent: string;
    commentAuthor: string;
    createdAt: string;
}

export interface PropertyActivity {
    id: string;
    title: string;
    createdAt: string;
}

export interface UserActivityResponse {
    comments: {
        total: number;
        recent: CommentActivity[];
    };
    likes: {
        total: number;
        recent: LikeActivity[];
    };
    likedComments: {
        total: number;
        recent: LikedCommentActivity[];
    };
    properties: {
        total: number;
        recent: PropertyActivity[];
    };
}

export interface UserActivityState extends UserActivityResponse {
    loading: boolean;
    error: string | null;
}