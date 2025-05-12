/**
 * TypeScript interface matching the C# PropertyCreateDto
 * Used for creating new property listings
 */
import { ApplicationUser } from '../../../shared'

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
 * UI representation of a property for use in the VideoCard component
 * Transformed from the backend Property model
 */
export interface VideoCardProperty {
    id: string;
    userId: string; // Add this field
    username?: string;
    caption: string;
    videoUrl: string;
    likes?: number;
    comments?: number;
    avatarUrl?: string;
    rooms?: number;
    propertyType?: string;
    space?: number;
    photos?: { id: string; photoUrl: string }[];
    location?: {
        address: string;
        city: string;
        coordinates: {
            lat: number;
            lng: number;
        };
    };
    title?: string;
    // Other fields...
}

/**
 * Shared state structure for property likes
 */
export interface PropertyLikeState {
    [propertyId: string]: {
        count: number;
        isLiked: boolean;
    };
}

/**
 * Shared state structure for property loading states
 */
export interface PropertyLoadingState {
    [propertyId: string]: boolean;
}