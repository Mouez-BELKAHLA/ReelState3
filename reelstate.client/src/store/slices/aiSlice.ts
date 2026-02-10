import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { SearchFilters } from '../../Features/property/types/Property';
import { PropertyRecommendation, AISearchState, AIThinkingProcess } from '../../Features/ai/types/AITypes';
import axios from 'axios';
import { API_URL } from "../../shared";

// Initial state
const initialState: AISearchState = {
    isLoading: false,
    query: '',
    recommendations: [],
    error: null,
    parsedFilters: null,
    aiReasoning: '',
    isThinking: false,
    thinkingProcess: null,
    showThinkingMode: false,
};

// Gemini API configuration
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_BASE_URL = import.meta.env.VITE_AI_API_URL || 'https://generativelanguage.googleapis.com/v1beta';
const MODEL = import.meta.env.VITE_AI_MODEL || 'gemini-2.0-flash';

// Function to get AI thinking process for a search query
const getAIThinkingProcess = async (query: string): Promise<{
    thinkingProcess: AIThinkingProcess;
    filters: SearchFilters;
    reasoning: string;
}> => {
    if (!API_KEY) {
        throw new Error('Gemini API key not configured');
    }

    console.log('Getting thinking process for query:', query);

    // Thinking prompt designed to show step-by-step reasoning
    const prompt = `I'm searching for real estate properties with this request: "${query}"

I want you to analyze this in a step-by-step thinking process, showing your reasoning for each part. 
Return a JSON object with:
1. "steps" - Array showing your thinking process:
   - Each step should have: "step" (number), "title" (short description), "description" (detailed thought process)
2. "conclusion" - Your final analysis of what the user wants
3. "filters" - The search filters you've determined from the user's query:
   - propertyType (string): Type of property (e.g. "Apartment", "House", or "Any" if unspecified)
   - minRooms (number): Minimum number of rooms if specified
   - maxRooms (number): Maximum number of rooms if specified
   - minSpace (number): Minimum space in square meters if specified
   - maxSpace (number): Maximum space in square meters if specified
   - city (string): City name if specified
   - preferences (array): Array of preferences like "modern", "garden", "parking"
   - features (array): Array of features like "balcony", "pool"
   
NOTE: For single-word queries like "garden" or "modern", include the term in BOTH preferences AND features arrays

Example output format:
{
  "steps": [
    {
      "step": 1,
      "title": "Identifying property type",
      "description": "First, I need to determine what type of property the user is looking for. The query mentions 'apartment', so the user is likely looking for an apartment rather than a house."
    },
    {
      "step": 2, 
      "title": "Analyzing room requirements",
      "description": "Next, I'll check if there are any room requirements. The query mentions '2 rooms', which indicates the user wants at least 2 rooms."
    },
    {
      "step": 3,
      "title": "Understanding preferences and features",
      "description": "The user wants a 'modern' apartment, suggesting a contemporary design style, and also mentions 'garden', indicating they want garden access or an outdoor space."
    }
  ],
  "conclusion": "The user is looking for a modern apartment with at least 2 rooms that has garden access.",
  "filters": {
    "propertyType": "Apartment",
    "minRooms": 2,
    "preferences": ["modern", "garden"],
    "features": ["garden"]
  }
}`;

    // Call Gemini API with higher temperature for more detailed reasoning
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
                temperature: 0.3,
                maxOutputTokens: 2000
            }
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Gemini API error for thinking mode:', errorData);
        throw new Error(errorData.error?.message || 'Failed to analyze search query');
    }

    const data = await response.json();
    console.log('Gemini thinking API response:', data);

    // Extract text content from response
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse JSON from response
    const jsonMatch = text.match(/```json([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/);
    let jsonContent = jsonMatch ? jsonMatch[1] || jsonMatch[0] : null;

    if (jsonContent) {
        jsonContent = jsonContent.replace(/```json|```/g, '').trim();
        try {
            const parsedContent = JSON.parse(jsonContent);
            return {
                thinkingProcess: {
                    steps: parsedContent.steps || [],
                    conclusion: parsedContent.conclusion || 'Analysis complete.'
                },
                filters: parsedContent.filters || {},
                reasoning: parsedContent.conclusion || 'Based on your search, here are properties that might match your criteria.'
            };
        } catch (e) {
            console.error('Error parsing JSON from thinking response:', e);
        }
    }

    // Fallback when parsing fails
    return {
        thinkingProcess: {
            steps: [
                {
                    step: 1,
                    title: "Processing query",
                    description: `Analyzing the search query: "${query}"`
                }
            ],
            conclusion: "Based on your search, I'm looking for properties that match your criteria."
        },
        filters: {},
        reasoning: "Based on your search, here are properties that might match your criteria."
    };
};

// Regular AI analysis function
const getAIAnalysis = async (query: string): Promise<{
    reasoning: string;
    filters: SearchFilters;
}> => {
    if (!API_KEY) {
        throw new Error('Gemini API key not configured');
    }

    console.log('Analyzing query with Gemini API:', query);

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

SPECIAL HANDLING RULES:
- If the query is a single word like "garden", "modern", "balcony", etc., always include it in BOTH preferences AND features arrays
- For single-word queries, set propertyType to "Any" unless specifically mentioned

Example response format for complex query:
{
  "reasoning": "This search is looking for a modern apartment with garden access and parking facilities.",
  "filters": {
    "propertyType": "Apartment",
    "minRooms": 2,
    "preferences": ["modern", "garden"],
    "features": ["parking"]
  }
}

Example response format for single-word query like "garden":
{
  "reasoning": "This search is looking for properties with gardens or outdoor spaces.",
  "filters": {
    "propertyType": "Any",
    "preferences": ["garden"],
    "features": ["garden"]
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

// Extract search terms from query and filters
const extractSearchTerms = (query: string, filters: SearchFilters): string[] => {
    const searchTerms: string[] = [];

    // Add main search terms from query
    const queryWords = query.toLowerCase().split(/\s+/).filter(word =>
        word.length > 2 &&
        !['and', 'with', 'the', 'for', 'has', 'have', 'that'].includes(word)
    );
    searchTerms.push(...queryWords);

    // Add terms from preferences and features arrays
    if (filters.preferences?.length) {
        searchTerms.push(...filters.preferences.map(p => p.toLowerCase()));
    }

    if (filters.features?.length) {
        searchTerms.push(...filters.features.map(f => f.toLowerCase()));
    }

    // Remove duplicates
    return [...new Set(searchTerms)];
};

// NEW FUNCTION: Fetch user information for properties
const fetchUserInfoForProperties = async (properties: any[]): Promise<any[]> => {
    if (!properties || properties.length === 0) return properties;

    try {
        // Create a set of unique user IDs to fetch
        const userIds = new Set(properties.map(p => p.userId).filter(id => id));

        if (userIds.size === 0) return properties;

        console.log(`Fetching user info for ${userIds.size} unique users`);

        // Create a map to store user information by ID
        const userInfoMap: Record<string, any> = {};

        // Fetch user information for each user ID
        // You may need to adjust this endpoint based on your API
        const userRequests = Array.from(userIds).map(async (userId) => {
            try {
                const response = await axios.get(`${API_URL}/api/User/${userId}`);
                if (response.data) {
                    userInfoMap[userId] = response.data;
                }
            } catch (error) {
                console.error(`Error fetching user info for user ${userId}:`, error);
            }
        });

        // Wait for all user info requests to complete
        await Promise.all(userRequests);

        console.log('User info fetched successfully:', Object.keys(userInfoMap).length);

        // Enrich properties with user information
        return properties.map(property => {
            if (property.userId && userInfoMap[property.userId]) {
                const userInfo = userInfoMap[property.userId];
                return {
                    ...property,
                    username: userInfo.username || userInfo.displayName || 'User',
                    avatarUrl: userInfo.avatarUrl || userInfo.photoUrl || null
                };
            }
            return property;
        });
    } catch (error) {
        console.error('Error fetching user information:', error);
        return properties;
    }
};

// Updated transform function
const transformBackendResponse = (properties: any[], reasoning: string, filters?: SearchFilters): PropertyRecommendation[] => {
    if (!properties || properties.length === 0) return [];

    // Extract all important search terms from reasoning and filters
    const keyTerms = new Set<string>();

    // Extract key terms from reasoning
    const reasoningTerms = reasoning.toLowerCase()
        .match(/\b(modern|garden|parking|traditional|balcony|pet friendly|air conditioning|storage|urban|rural)\b/g);

    if (reasoningTerms) {
        reasoningTerms.forEach(term => keyTerms.add(term));
    }

    // Add terms from filters if provided
    if (filters) {
        if (filters.features) {
            filters.features.forEach(feature => keyTerms.add(feature.toLowerCase()));
        }
        if (filters.preferences) {
            filters.preferences.forEach(preference => keyTerms.add(preference.toLowerCase()));
        }
    }

    // Convert to array for easier use
    const searchTerms = Array.from(keyTerms);
    console.log('Key search terms extracted:', searchTerms);

    // Calculate match scores for each property
    const scoredProperties = properties.map(property => {
        // Get all property features and preferences in lowercase
        const propFeatures = Array.isArray(property.propertyFeatures)
            ? property.propertyFeatures.map((f: string) => f.toLowerCase())
            : [];

        const propPreferences = Array.isArray(property.propertyPreferences)
            ? property.propertyPreferences.map((p: string) => p.toLowerCase())
            : [];

        // Combine all property attributes
        const propAttributes = [...propFeatures, ...propPreferences];

        // Count matching terms
        let matchCount = 0;
        let totalTerms = searchTerms.length || 1; // Avoid division by zero

        searchTerms.forEach(term => {
            // Check if the property has this term in its features or preferences
            if (propAttributes.some(attr => attr.includes(term))) {
                matchCount++;
            }
        });

        // Calculate match percentage (75% - 98%)
        const matchPercentage = Math.min(0.98, Math.max(0.75, 0.75 + (matchCount / totalTerms * 0.23)));

        return {
            property,
            matchScore: matchPercentage
        };
    });

    // Sort by match quality (highest first)
    scoredProperties.sort((a, b) => b.matchScore - a.matchScore);

    // Now transform the sorted properties
    return scoredProperties.map((scoredProp, index) => {
        const property = scoredProp.property;
        const confidence = scoredProp.matchScore;

        // Get the first photo URL or use placeholder
        let photoUrl = '';
        if (property.photos && property.photos.length > 0) {
            photoUrl = property.photos[0].photoUrl;
        }

        // Create match reason - for first item use the AI reasoning, for others generate generic reasons
        let matchReason = '';
        if (index === 0) {
            matchReason = reasoning;
        } else if (property.propertyType && property.propertyType.toLowerCase().includes('apartment')) {
            matchReason = `This ${property.propertyType.toLowerCase()} matches several aspects of your search criteria.`;
        } else {
            matchReason = `This property offers ${property.rooms || '?'} rooms and is located in ${property.city || 'a great area'}.`;
        }

        // Make sure full photo URL is used
        if (photoUrl && !photoUrl.startsWith('http') && !photoUrl.startsWith('data:')) {
            photoUrl = `${API_URL}${photoUrl}`;
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
            // Add these fields for PropertyCard to work correctly
            username: property.username || property.user?.username || 'User',  // Default to 'User' instead of empty string
            avatarUrl: property.avatarUrl || property.user?.avatarUrl || null,
            createdAt: property.createdAt,
            views: property.views || 0,
            likesCount: property.likesCount || 0,
            likes: property.likesCount || property.likes || 0, // Ensure likes is available for backward compatibility
            commentsCount: property.commentsCount || 0,
            status: property.status,
            statusReason: property.statusReason || property.rejectionReason,
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

// Updated AI search thunk with user info fetching
export const searchWithAI = createAsyncThunk(
    'ai/searchWithAI',
    async ({ query, useThinkingMode = false }: { query: string, useThinkingMode?: boolean }, { dispatch, rejectWithValue }) => {
        try {
            console.log('Starting AI search for query:', query, 'Using thinking mode:', useThinkingMode);

            // Set thinking mode flag if requested
            if (useThinkingMode) {
                dispatch({ type: 'ai/startThinking' });
            }

            // Step 1: Get AI analysis based on mode
            let filters: SearchFilters = {};
            let reasoning = '';
            let thinkingProcess: AIThinkingProcess | null = null;

            if (useThinkingMode) {
                // Get detailed thinking process
                const thinkingResult = await getAIThinkingProcess(query);
                filters = thinkingResult.filters;
                reasoning = thinkingResult.reasoning;
                thinkingProcess = thinkingResult.thinkingProcess;

                // Update thinking process state
                dispatch({
                    type: 'ai/updateThinkingProcess',
                    payload: thinkingProcess
                });
            } else {
                // Regular analysis
                const analysisResult = await getAIAnalysis(query);
                filters = analysisResult.filters;
                reasoning = analysisResult.reasoning;
            }

            console.log('AI analysis filters:', filters);

            // Create a modified version of filters to send to API
            const modifiedFilters = { ...filters };

            // 1. Remove "Any" property type completely to avoid filtering
            if (modifiedFilters.propertyType === "Any") {
                delete modifiedFilters.propertyType;
                console.log('Removed "Any" propertyType from filters');
            }

            // 2. For single-word queries, ensure both preferences and features have the term
            const isSimpleQuery = query.trim().split(/\s+/).length === 1;
            if (isSimpleQuery) {
                const searchTerm = query.trim().toLowerCase();
                console.log('Processing single-word query:', searchTerm);

                if (!modifiedFilters.features) modifiedFilters.features = [];
                if (!modifiedFilters.preferences) modifiedFilters.preferences = [];

                // Add the term to both arrays if not already present
                if (!modifiedFilters.features.some(f => f.toLowerCase() === searchTerm)) {
                    modifiedFilters.features.push(searchTerm);
                }

                if (!modifiedFilters.preferences.some(p => p.toLowerCase() === searchTerm)) {
                    modifiedFilters.preferences.push(searchTerm);
                }

                console.log('Enhanced filters for single-word query:', modifiedFilters);
            }

            // Step 2: Convert filters to JSON string for API
            const filtersJson = JSON.stringify(modifiedFilters);

            // Step 3: Call the unified AI search endpoint
            console.log('Calling unified ai-search endpoint with filters:', modifiedFilters);
            let response = await axios.get(`${API_URL}/api/Property/unified-ai-search`, {
                params: {
                    query: query,
                    filters: filtersJson
                }
            });

            console.log('AI search response count:', response.data.totalCount);

            // If no results from the unified search, try a simple text search as fallback
            if (!response.data.properties || response.data.properties.length === 0) {
                console.log('No results from AI search, trying text search fallback');

                // Use simple text search as fallback
                response = await axios.get(`${API_URL}/api/Property/search?q=${encodeURIComponent(query)}`);
                console.log('Fallback search response count:', response.data.totalCount || 0);
            }

            // Step 4: Fetch user information for properties
            let properties = response.data.properties || [];

            // Fetch user information
            properties = await fetchUserInfoForProperties(properties);

            // Step 5: Transform results with the enriched property data
            const recommendations = transformBackendResponse(properties, reasoning, filters);

            // Debug the first recommendation
            if (recommendations.length > 0) {
                console.log('First AI recommendation:', recommendations[0]);
                console.log('AI recommendation photo URL:', recommendations[0]?.photoUrl);
                console.log('AI recommendation username:', recommendations[0]?.username);
            }

            // Finish thinking mode animation
            if (useThinkingMode) {
                // Small delay to let user see the conclusion
                await new Promise(resolve => setTimeout(resolve, 1500));
                dispatch({ type: 'ai/finishThinking' });
            }

            return {
                recommendations,
                parsedFilters: filters, // Original filters for display
                aiReasoning: reasoning,
                thinkingProcess: thinkingProcess,
                totalCount: response.data.totalCount || 0
            };
        } catch (error: any) {
            console.error('AI search error:', error);

            // Clear thinking mode on error
            dispatch({ type: 'ai/finishThinking' });

            return rejectWithValue(error.message || 'An unknown error occurred');
        }
    }
);

// Updated slice with thinking mode actions
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
            state.thinkingProcess = null;
        },
        toggleThinkingMode: (state) => {
            state.showThinkingMode = !state.showThinkingMode;
        },
        startThinking: (state) => {
            state.isThinking = true;
            state.thinkingProcess = null;
        },
        updateThinkingProcess: (state, action: PayloadAction<AIThinkingProcess>) => {
            state.thinkingProcess = action.payload;
        },
        finishThinking: (state) => {
            state.isThinking = false;
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
                // Keep thinking process if it was part of the response
                if (action.payload.thinkingProcess) {
                    state.thinkingProcess = action.payload.thinkingProcess;
                }
            })
            .addCase(searchWithAI.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string || 'Failed to get AI recommendations';
            });
    }
});

// Export actions and reducer
export const { setQuery, clearAISearch, toggleThinkingMode, startThinking, updateThinkingProcess, finishThinking } = aiSlice.actions;
export default aiSlice.reducer;