import { AiConfig } from '../config/aiConfig';
import { PropertyRecommendation, AIMessage } from '../types/AiTypes';
import { SearchFilters } from '../../property/types/Property';

class AiService {
    private apiKey: string;
    private apiUrl: string;

    constructor() {
        this.apiKey = import.meta.env.VITE_AI_API_KEY || '';
        this.apiUrl = import.meta.env.VITE_AI_API_URL || 'https://api.example.com/ai';
    }

    /**
     * Process a natural language query for property search
     */
    async processQuery(query: string, filters?: SearchFilters): Promise<{
        recommendations: PropertyRecommendation[];
        parsedFilters: SearchFilters | null;
    }> {
        try {
            const response = await fetch(`${this.apiUrl}/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    query,
                    filters,
                    timestamp: new Date().toISOString()
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to process AI query');
            }

            return await response.json();
        } catch (error) {
            console.error('AI query processing error:', error);
            throw error;
        }
    }

    /**
     * Get property recommendations based on user preferences
     */
    async getRecommendations(userId: string, limit: number = 5): Promise<PropertyRecommendation[]> {
        try {
            const response = await fetch(`${this.apiUrl}/recommendations?userId=${userId}&limit=${limit}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to get AI recommendations');
            }

            const data = await response.json();
            return data.recommendations || [];
        } catch (error) {
            console.error('AI recommendation error:', error);
            throw error;
        }
    }
}

export const aiService = new AiService();