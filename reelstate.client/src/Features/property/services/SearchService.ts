import axios from 'axios';
import { API_URL } from '../../../shared';
import { SearchFilters, Property } from '../types/Property';

export interface SearchResponse {
    properties: Property[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export class SearchService {
    private static getAuthHeaders() {
        const token = localStorage.getItem('token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    static async searchProperties(filters: SearchFilters): Promise<SearchResponse> {
        try {
            console.log('=== SEARCH SERVICE DEBUG ===');
            console.log('API_URL:', API_URL);
            console.log('Input filters:', filters);

            const params = new URLSearchParams();

            // IMPORTANT: Add the 'q' parameter for text search
            if (filters.q) {
                params.append('q', filters.q);
                console.log('Added q parameter:', filters.q);
            }

            // Add other search parameters
            if (filters.propertyType) params.append('propertyType', filters.propertyType);
            if (filters.minRooms) params.append('minRooms', filters.minRooms.toString());
            if (filters.maxRooms) params.append('maxRooms', filters.maxRooms.toString());
            if (filters.minSpace) params.append('minSpace', filters.minSpace.toString());
            if (filters.maxSpace) params.append('maxSpace', filters.maxSpace.toString());
            if (filters.city) params.append('city', filters.city);
            if (filters.sortBy) params.append('sortBy', filters.sortBy);
            if (filters.page) params.append('page', filters.page.toString());
            if (filters.limit) params.append('limit', filters.limit.toString());

            // Add preferences and features as comma-separated strings
            if (filters.preferences && filters.preferences.length > 0) {
                params.append('preferences', filters.preferences.join(','));
            }
            if (filters.features && filters.features.length > 0) {
                params.append('features', filters.features.join(','));
            }

            const url = `${API_URL}/api/Property/search?${params.toString()}`;
            console.log('Final search URL:', url);

            const response = await axios.get(url, {
                headers: this.getAuthHeaders()
            });

            console.log('Search response received:', response.data);
            console.log('Response status:', response.status);

            return response.data;
        } catch (error) {
            console.error('=== SEARCH SERVICE ERROR ===');
            console.error('Search error:', error);
            if (axios.isAxiosError(error)) {
                console.error('Error response:', error.response?.data);
                console.error('Error status:', error.response?.status);
                console.error('Error URL:', error.config?.url);
            }
            throw error;
        }
    }

    static async quickSearch(query: string): Promise<Property[]> {
        try {
            console.log('Quick search for:', query);
            const response = await axios.get(
                `${API_URL}/api/Property/quick-search?q=${encodeURIComponent(query)}`,
                { headers: this.getAuthHeaders() }
            );

            console.log('Quick search response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Quick search error:', error);
            throw error;
        }
    }

    static async getSearchSuggestions(query: string): Promise<string[]> {
        try {
            console.log('Getting suggestions for:', query);
            const response = await axios.get(
                `${API_URL}/api/Property/search-suggestions?q=${encodeURIComponent(query)}`,
                { headers: this.getAuthHeaders() }
            );

            console.log('Suggestions response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Search suggestions error:', error);
            return [];
        }
    }
}