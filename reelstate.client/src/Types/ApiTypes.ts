/**
 * TypeScript interface matching the C# PropertyCreateDto
 * Used for creating new property listings
 */
export interface PropertyCreateDto {
    title: string;
    caption: string;
    rooms: number;
    propertyType: string;
    space: number;
    address?: string;
    city?: string;
    latitude: number;
    longitude: number;
    videoFile?: File | null;
    photoFiles?: File[] | null;
}

/**
 * Interface for ApplicationUser (matching your C# ApplicationUser)
 * Represents user data from the backend
 */
export interface ApplicationUser {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    profilePictureUrl?: string;
}

/**
 * Interface for Property entity from the backend
 * Full representation including relationships
 */
export interface Property {
    id: string;
    title: string;
    caption: string;
    rooms: number;
    propertyType: string;
    space: number;
    address: string;
    city: string;
    latitude: number;
    longitude: number;
    videoUrl: string;
    userId: string;
    createdAt: string;
    user?: ApplicationUser;     // Matching the navigation property in C#
    photos?: PropertyPhoto[];    // Matching the navigation property in C#

    // These fields will be populated by the API but aren't in the C# model directly
    // They would typically be calculated in the backend when returning properties
    likesCount?: number;
    commentsCount?: number;
    isLiked?: boolean;
}

/**
 * Interface for PropertyPhoto entity (matches C# model)
 */
export interface PropertyPhoto {
    id: string;
    propertyId: string;
    photoUrl: string;
    createdAt: string;
}

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