import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { SearchFilters } from '../../Features/property/types/Property';
import { PropertyRecommendation, AISearchState, AIMessage } from '../../Features/ai/types/AiTypes';
import axios from 'axios';

// Initial state
const initialState: AISearchState = {
    isLoading: false,
    query: '',
    recommendations: [],
    error: null,
    parsedFilters: null,
    aiReasoning: '',
};

// Gemini API configuration
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_BASE_URL = import.meta.env.VITE_AI_API_URL || 'https://generativelanguage.googleapis.com/v1beta';
const MODEL = import.meta.env.VITE_AI_MODEL || 'gemini-2.0-flash';

// Function to query Gemini for AI reasoning and filter extraction
const getAIAnalysis = async (query: string): Promise<{
    reasoning: string;
    filters: SearchFilters;
}> => {
    if (!API_KEY) {
        throw new Error('Gemini API key not configured');
    }

    console.log('Analyzing query with Gemini API:', query);

    // Create a prompt that asks Gemini to analyze the search request
    const prompt = `I'm searching for properties with this request: "${query}"

Please analyze this search request and extract search parameters. Return ONLY a JSON object with:
1. "reasoning" - Brief explanation of what the user is looking for (1-2 sentences)
2. "filters" - Search filters including any of these that apply:
   - propertyType (string): Type of property (e.g. "Apartment", "House")
   - minRooms (number): Minimum number of rooms required
   - maxRooms (number): Maximum number of rooms if specified
   - minSpace (number): Minimum space in square meters if specified
   - maxSpace (number): Maximum space in square meters if specified
   - city (string): City name if specified
   - preferences (array): Array of preferences like "modern", "garden", "parking"
   - features (array): Array of features like "balcony", "pool"

Example response format:
{
  "reasoning": "This search is looking for a modern apartment with garden access and parking facilities.",
  "filters": {
    "propertyType": "Apartment",
    "minRooms": 2,
    "preferences": ["modern", "garden"],
    "features": ["parking"]
  }
}`;

    // Call Gemini API
    const response = await fetch(`${API_BASE_URL}/models/${MODEL}:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [
                        {
                            text: prompt
                        }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 1000
            }
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Gemini API error:', errorData);
        throw new Error(errorData.error?.message || 'Failed to analyze search query');
    }

    const data = await response.json();
    console.log('Gemini API response:', data);

    // Extract the text content from Gemini response
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Try to find JSON content in the response
    const jsonMatch = text.match(/```json([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/);
    let jsonContent = jsonMatch ? jsonMatch[1] || jsonMatch[0] : null;

    if (jsonContent) {
        // Clean up the JSON string if needed
        jsonContent = jsonContent.replace(/```json|```/g, '').trim();

        try {
            // Parse the JSON content
            const parsedContent = JSON.parse(jsonContent);
            return {
                reasoning: parsedContent.reasoning || 'Based on your search, here are properties that match your criteria.',
                filters: parsedContent.filters || {}
            };
        } catch (e) {
            console.error('Error parsing JSON from Gemini response:', e);
        }
    }

    // Fallback if JSON parsing fails
    return {
        reasoning: 'Based on your search, here are properties that match your criteria.',
        filters: {}
    };
};

// Function to transform backend property response to PropertyRecommendation format
const transformBackendResponse = (properties: any[], reasoning: string): PropertyRecommendation[] => {
    if (!properties || properties.length === 0) return [];

    return properties.map((property, index) => {
        // Calculate confidence score based on index position (first items are best matches)
        const confidence = Math.max(0.95 - (index * 0.05), 0.7);

        // Get the first photo URL or use placeholder
        let photoUrl = '';
        if (property.photos && property.photos.length > 0) {
            photoUrl = property.photos[0].photoUrl;
        }

        // Create match reason - for first item use the AI reasoning, for others generate generic reasons
        let matchReason = '';
        if (index === 0) {
            matchReason = reasoning;
        } else if (property.propertyType.toLowerCase().includes('apartment')) {
            matchReason = `This ${property.propertyType.toLowerCase()} matches several aspects of your search criteria.`;
        } else {
            matchReason = `This property offers ${property.rooms} rooms and is located in ${property.city}.`;
        }

        return {
            id: property.id,
            title: property.title,
            caption: property.caption,
            matchReason: matchReason,
            confidence: confidence,
            propertyType: property.propertyType,
            rooms: property.rooms,
            space: property.space,
            address: property.address,
            city: property.city,
            latitude: property.latitude,
            longitude: property.longitude,
            videoUrl: property.videoUrl,
            userId: property.userId,
            createdAt: property.createdAt,
            views: property.views || 0,
            likesCount: property.likesCount || 0,
            commentsCount: property.commentsCount || 0,
            status: property.status,
            statusReason: property.rejectionReason,
            photoUrl: photoUrl,
            propertyPreferences: Array.isArray(property.propertyPreferences)
                ? property.propertyPreferences
                : (property.propertyPreferences ? [property.propertyPreferences] : []),
            propertyFeatures: Array.isArray(property.propertyFeatures)
                ? property.propertyFeatures
                : (property.propertyFeatures ? [property.propertyFeatures] : []),
            photos: property.photos || []
        };
    });
};

// Async thunk for making AI search requests - now with backend integration
export const searchWithAI = createAsyncThunk(
    'ai/searchWithAI',
    async ({ query }: { query: string }, { rejectWithValue }) => {
        try {
            // Step 1: Use Gemini to analyze the query and extract filters
            const { reasoning, filters } = await getAIAnalysis(query);
            console.log('AI extracted filters:', filters);
            console.log('AI reasoning:', reasoning);

            // Step 2: Build query parameters for backend API
            const params = new URLSearchParams();

            // Add search query as q parameter
            params.set('q', query);

            // Add extracted filters
            if (filters.propertyType) params.set('propertyType', filters.propertyType);
            if (filters.minRooms) params.set('minRooms', filters.minRooms.toString());
            if (filters.maxRooms) params.set('maxRooms', filters.maxRooms.toString());
            if (filters.minSpace) params.set('minSpace', filters.minSpace.toString());
            if (filters.maxSpace) params.set('maxSpace', filters.maxSpace.toString());
            if (filters.city) params.set('city', filters.city);

            // Handle arrays
            if (filters.preferences && Array.isArray(filters.preferences) && filters.preferences.length > 0) {
                params.set('preferences', filters.preferences.join(','));
            }

            if (filters.features && Array.isArray(filters.features) && filters.features.length > 0) {
                params.set('features', filters.features.join(','));
            }

            // Step 3: Call backend API with extracted parameters
            console.log('Calling backend search API with params:', params.toString());
            const response = await axios.get(`/api/Property/search?${params.toString()}`);

            console.log('Backend API response:', response.data);

            // Step 4: Transform backend response to our app's format
            const properties = response.data.properties || [];
            const recommendations = transformBackendResponse(properties, reasoning);

            return {
                recommendations,
                parsedFilters: filters,
                aiReasoning: reasoning,
                totalCount: response.data.totalCount || 0
            };
        } catch (error: any) {
            console.error('AI search error:', error);
            return rejectWithValue(error.message || 'An unknown error occurred');
        }
    }
);

// AI slice
const aiSlice = createSlice({
    name: 'ai',
    initialState,
    reducers: {
        setQuery: (state, action: PayloadAction<string>) => {
            state.query = action.payload;
        },
        clearAISearch: (state) => {
            state.recommendations = [];
            state.error = null;
            state.parsedFilters = null;
            state.aiReasoning = '';
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(searchWithAI.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(searchWithAI.fulfilled, (state, action) => {
                state.isLoading = false;
                state.recommendations = action.payload.recommendations;
                state.parsedFilters = action.payload.parsedFilters;
                state.aiReasoning = action.payload.aiReasoning;
            })
            .addCase(searchWithAI.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string || 'Failed to get AI recommendations';
            });
    }
});

// Export actions and reducer
export const { setQuery, clearAISearch } = aiSlice.actions;
export default aiSlice.reducer;