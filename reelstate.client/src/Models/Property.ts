// TypeScript interface matching the C# PropertyCreateDto
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

// Interface for Property entity
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
    photos?: PropertyPhoto[];
}

// Interface for PropertyPhoto entity
export interface PropertyPhoto {
    id: string;
    propertyId: string;
    photoUrl: string;
    createdAt: string;
}