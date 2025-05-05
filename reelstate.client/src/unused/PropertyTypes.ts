// Define the VideoCardProperty type that's used in both components
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