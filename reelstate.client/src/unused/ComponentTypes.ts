/**
 * UI representation of a property for use in the VideoCard component
 * Transformed from the backend Property model
 */
export interface VideoCardProperty {
    id: string;
    username: string;
    caption: string;
    videoUrl: string;
    likes: number;
    comments: number;
    avatarUrl: string;
    rooms?: number;
    propertyType?: string;
    space?: number;
    photos?: string[];
    location?: {
        address: string;
        city: string;
        coordinates?: {
            lat: number;
            lng: number;
        };
    };
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