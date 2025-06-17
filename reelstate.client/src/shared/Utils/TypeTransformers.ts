import { Property, VideoCardProperty } from '../../Features/property/types/Property';

/**
 * Transforms a backend Property model to a frontend VideoCardProperty
 * @param property The backend property model
 * @param apiBaseUrl The base URL for the API (for constructing full URLs)
 * @returns A VideoCardProperty suitable for UI rendering
 */
export function toVideoCardProperty(property: Property, apiBaseUrl: string): VideoCardProperty {
    // Default avatar fallback
    const defaultAvatar = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2NjYyI+PHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgM2MyLjY3IDAgOC0xLjM0IDgtNHYyYzAgMi42Ny01LjMzIDQtOCA0cy04LTEuMzMtOC00VjljMC0yLjY2IDUuMzMtNCA4LTR6bTAgMTAuOThjNy42NCAwIDkuMzktMy4zOCA5LjQtMy45OFYxNWMwIC42Ny0zLjEzIDQtOS40IDQtNi4yOCAwLTkuNC0zLjMzLTkuNC00di0yLjk4YzAtLjA3IDEuNzYgMy45OCA5LjQgMy45OHoiLz48L3N2Zz4=";

    // Ensure videoUrl and photoUrls have proper URL formatting
    const videoUrl = property.videoUrl.startsWith('http') ?
        property.videoUrl :
        `${apiBaseUrl}${property.videoUrl}`;

    const photos = property.photos?.map(p => {
        const photoUrl = p.photoUrl.startsWith('http') ?
            p.photoUrl :
            `${apiBaseUrl}${p.photoUrl}`;
        return {
            id: p.id,
            photoUrl: photoUrl
        };
    }) || [];

    // Handle username construction more robustly
    const username = property.user ?
        `${property.user.firstName || ''} ${property.user.lastName || ''}`.trim() ||
        property.user.email || 'Unknown User' :
        'Unknown User';

    // Helper function to safely parse preferences and features
    const parsePropertyTags = (value: string[] | string | undefined): string[] => {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed : [];
            } catch {
                // If JSON parsing fails, try comma separation
                return value.split(',').map(item => item.trim()).filter(Boolean);
            }
        }
        return [];
    };

    return {
        id: property.id,
        userId: property.userId,
        username: username,
        caption: property.caption,
        title: property.title,
        videoUrl: videoUrl,
        likes: property.likesCount || 0,
        comments: property.commentsCount || 0,
        views: property.views || 0,
        avatarUrl: property.user?.profilePictureUrl || defaultAvatar,
        rooms: property.rooms,
        propertyType: property.propertyType,
        space: property.space,
        photos: photos,
        location: {
            address: property.address,
            city: property.city,
            coordinates: {
                lat: property.latitude,
                lng: property.longitude
            }
        },
        // ADD THESE MISSING FIELDS
        propertyPreferences: parsePropertyTags(property.propertyPreferences),
        propertyFeatures: parsePropertyTags(property.propertyFeatures),
        status: property.status,
        statusReason: property.statusReason
    };
}

/**
 * Batch transform properties from API format to UI format
 * @param properties Array of backend property models
 * @param apiBaseUrl The base URL for the API
 * @returns Array of VideoCardProperty objects
 */
export function toVideoCardProperties(
    properties: Property[],
    apiBaseUrl: string
): VideoCardProperty[] {
    return properties.map(property => toVideoCardProperty(property, apiBaseUrl));
}

/**
 * Helper function to format view count for display
 * @param viewCount The raw view count number
 * @returns Formatted string (e.g., "1.2K" for 1200 views)
 */
export function formatViewCount(viewCount: number): string {
    if (viewCount >= 1000000) {
        return `${(viewCount / 1000000).toFixed(1)}M`;
    } else if (viewCount >= 1000) {
        return `${(viewCount / 1000).toFixed(1)}K`;
    } else {
        return viewCount.toString();
    }
}

/**
 * Helper function to format like count for display
 * @param likeCount The raw like count number
 * @returns Formatted string (e.g., "1.2K" for 1200 likes)
 */
export function formatLikeCount(likeCount: number): string {
    if (likeCount >= 1000000) {
        return `${(likeCount / 1000000).toFixed(1)}M`;
    } else if (likeCount >= 1000) {
        return `${(likeCount / 1000).toFixed(1)}K`;
    } else {
        return likeCount.toString();
    }
}

/**
 * Helper function to validate if a property has all required fields
 * @param property The VideoCardProperty to validate
 * @returns boolean indicating if the property is valid
 */
export function isValidVideoCardProperty(property: VideoCardProperty): boolean {
    return !!(
        property.id &&
        property.userId &&
        property.caption &&
        property.videoUrl &&
        typeof property.views === 'number' &&
        typeof property.likes === 'number' &&
        typeof property.comments === 'number'
    );
}