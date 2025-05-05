import { Property, PropertyPhoto } from '../Types/ApiTypes';
import { VideoCardProperty } from '../Types/ComponentTypes';

/**
 * Transforms a backend Property model to a frontend VideoCardProperty
 * @param property The backend property model
 * @param apiBaseUrl The base URL for the API (for constructing full URLs)
 * @returns A VideoCardProperty suitable for UI rendering
 */
export function toVideoCardProperty(property: Property, apiBaseUrl: string): VideoCardProperty {
    return {
        id: property.id,
        username: property.user?.firstName || 'Unknown User',
        caption: property.caption,
        videoUrl: `${apiBaseUrl}${property.videoUrl}`,
        likes: property.likesCount || 0,
        comments: property.commentsCount || 0,
        avatarUrl: property.user?.profilePictureUrl || 'https://randomuser.me/api/portraits/lego/1.jpg',
        rooms: property.rooms,
        propertyType: property.propertyType,
        space: property.space,
        photos: property.photos?.map(p => `${apiBaseUrl}${p.photoUrl}`) || [],
        location: {
            address: property.address,
            city: property.city,
            coordinates: {
                lat: property.latitude,
                lng: property.longitude
            }
        }
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