/**
 * Interface for Like entity (matches C# model)
 */
export interface Like {
    id: string;
    propertyId: string;
    userId: string;
    createdAt: string;
}

/**
 * DTOs for like operations (matching your C# DTOs)
 */
export interface LikeRequestDto {
    propertyId: string;
}

export interface LikeResponseDto {
    isSuccess: boolean;
    isLiked: boolean;
    likesCount: number;
    message?: string;
}

export interface LikeStatusDto {
    isSuccess: boolean;
    isLiked: boolean;
    likesCount: number;
}