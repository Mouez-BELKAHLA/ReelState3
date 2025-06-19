import { SearchFilters, Property, propertyTypes, propertyPreferences, propertyFeatures } from '../../property/types/Property';

// Add this new interface for the thinking process
export interface AIThinkingStep {
    step: number;
    title: string;
    description: string;
}

export interface AIThinkingProcess {
    steps: AIThinkingStep[];
    conclusion: string;
}

export interface PropertyRecommendation {
    id: string;
    title: string;
    caption: string;
    matchReason: string;
    confidence: number;
    rooms: number;
    propertyType: string; // Must match propertyTypes array values
    space: number;
    address: string;
    city: string;
    latitude: number;
    longitude: number;
    videoUrl: string;
    userId: string;
    createdAt: string;
    views?: number;
    likesCount?: number;
    commentsCount?: number;
    status: 'pending' | 'approved' | 'rejected';
    statusReason?: string;
    photoUrl?: string; // Added this to match your code
    propertyPreferences?: string[]; // Must use values from propertyPreferences array
    propertyFeatures?: string[]; // Must use values from propertyFeatures array
    photos?: Array<{
        id: string;
        photoUrl: string;
        createdAt: string;
    }>;
    user?: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        profilePictureUrl?: string;
    };
}

export interface AISearchState {
    isLoading: boolean;
    query: string;
    recommendations: PropertyRecommendation[];
    error: string | null;
    parsedFilters: SearchFilters | null;
    aiReasoning: string;
    // New fields for thinking mode
    isThinking: boolean;
    thinkingProcess: AIThinkingProcess | null;
    showThinkingMode: boolean;
}

export interface AIMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: Date;
}

export interface AISearchParams {
    query: string;
    filters?: SearchFilters;
    userId?: string;
    useThinkingMode?: boolean; // New parameter
}

export interface AISearchResponse {
    recommendations: PropertyRecommendation[];
    parsedFilters: SearchFilters | null;
    messages?: AIMessage[];
    thinkingProcess?: AIThinkingProcess; // New field
}

// Type guard to check if a PropertyRecommendation is a valid Property
export function isValidProperty(recommendation: PropertyRecommendation): recommendation is Property {
    return (
        typeof recommendation.id === 'string' &&
        typeof recommendation.title === 'string' &&
        typeof recommendation.caption === 'string' &&
        typeof recommendation.rooms === 'number' &&
        propertyTypes.includes(recommendation.propertyType) &&
        typeof recommendation.space === 'number' &&
        typeof recommendation.address === 'string' &&
        typeof recommendation.city === 'string' &&
        typeof recommendation.latitude === 'number' &&
        typeof recommendation.longitude === 'number' &&
        typeof recommendation.videoUrl === 'string' &&
        typeof recommendation.userId === 'string' &&
        ['pending', 'approved', 'rejected'].includes(recommendation.status)
    );
}

// Convert PropertyRecommendation to Property
export function recommendationToProperty(recommendation: PropertyRecommendation): Property {
    return {
        id: recommendation.id,
        title: recommendation.title,
        caption: recommendation.caption,
        rooms: recommendation.rooms,
        propertyType: recommendation.propertyType,
        space: recommendation.space,
        address: recommendation.address,
        city: recommendation.city,
        latitude: recommendation.latitude,
        longitude: recommendation.longitude,
        videoUrl: recommendation.videoUrl,
        userId: recommendation.userId,
        createdAt: recommendation.createdAt,
        views: recommendation.views,
        likesCount: recommendation.likesCount,
        commentsCount: recommendation.commentsCount,
        status: recommendation.status,
        statusReason: recommendation.statusReason,
        propertyPreferences: recommendation.propertyPreferences,
        propertyFeatures: recommendation.propertyFeatures,
        photos: recommendation.photos?.map(photo => ({
            id: photo.id,
            propertyId: recommendation.id,
            photoUrl: photo.photoUrl,
            createdAt: photo.createdAt
        })),
        user: recommendation.user
    };
}