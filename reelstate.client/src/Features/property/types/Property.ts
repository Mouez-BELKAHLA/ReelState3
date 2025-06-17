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
    // New fields for preferences and features
    propertyPreferences?: string[];
    propertyFeatures?: string[];
    // Social media sharing options
    uploadToYouTube?: boolean;
    uploadToTikTok?: boolean;
    uploadToInstagram?: boolean;
    uploadToFacebook?: boolean;
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
    // New fields for preferences and features
    propertyPreferences?: string[] | string;  // Can be array or JSON string from backend
    propertyFeatures?: string[] | string;     // Can be array or JSON string from backend

    // These fields will be populated by the API but aren't in the C# model directly
    likesCount?: number;
    commentsCount?: number;
    isLiked?: boolean;
    status: 'pending' | 'approved' | 'rejected';
    statusReason?: string; // For storing rejection reasons
    views?: number;        // Add view count field
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
    userId: string;
    username?: string;
    caption: string;
    videoUrl: string;
    likes?: number;
    comments?: number;
    views?: number;
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
    // New fields for preferences and features - always arrays in UI
    propertyPreferences?: string[];
    propertyFeatures?: string[];
    // Status field
    status?: 'pending' | 'approved' | 'rejected';
    statusReason?: string;
}

/**
 * Interface for search filters
 */
export interface SearchFilters {
    propertyType?: string;
    minRooms?: number;
    maxRooms?: number;
    minSpace?: number;
    maxSpace?: number;
    minPrice?: number;
    maxPrice?: number;
    city?: string;
    sortBy?: 'newest' | 'popular' | 'price_asc' | 'price_desc';
    preferences?: string[];
    features?: string[];
    page?: number;
    limit?: number;
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

/**
 * Constants for property preferences and features
 * Using const arrays makes these reusable across components
 */
export const propertyPreferences = [
    'Modern', 'Traditional', 'Spacious', 'Compact', 'Urban', 'Rural',
    'Near amenities', 'Quiet location', 'Family-friendly', 'Investment',
    'Luxury', 'Budget-friendly', 'Renovation potential', 'Move-in ready'
];

export const propertyFeatures = [
    'Parking', 'Garden', 'Balcony', 'Pool', 'Elevator',
    'Air conditioning', 'Heating', 'Furnished', 'Pet friendly',
    'Security system', 'Storage room', 'Gym', 'Laundry'
];

export const propertyTypes = [
    "apartment", "house", "studio", "villa", "loft", "land"
];