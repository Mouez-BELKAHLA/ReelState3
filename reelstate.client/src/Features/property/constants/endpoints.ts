import { API_URL } from '../../../shared';

// Property-specific endpoints
export const PROPERTY_ENDPOINTS = {
    GET_PROPERTIES: `${API_URL}/api/Property`,
    CREATE_PROPERTY: `${API_URL}/api/Property`,
    GET_PROPERTY_BY_ID: (id: string) => `${API_URL}/api/Property/${id}`,
    UPDATE_PROPERTY: (id: string) => `${API_URL}/api/Property/${id}`,
    DELETE_PROPERTY: (id: string) => `${API_URL}/api/Property/${id}`,
    LIKE_PROPERTY: `${API_URL}/api/Like`,
    GET_LIKES: (propertyId: string) => `${API_URL}/api/Like/${propertyId}`,
    // Add other property-related endpoints here
};