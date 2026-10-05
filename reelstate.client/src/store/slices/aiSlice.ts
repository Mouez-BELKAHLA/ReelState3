import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
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

// ---------- RAG call (the Gemini key now lives only on the server) ----------

interface AskMatch {
    id: string;
    reason: string;
}

interface AskResult {
    answer: string;
    matches: AskMatch[];
}

// POST /api/Ai/ask: the backend retrieves listings from SQL Server,
// gives only those to Gemini, and returns the answer + a reason per listing.
const askListings = async (question: string): Promise<AskResult> => {
    const response = await axios.post(`${API_URL}/api/Ai/ask`, { question });
    return {
        answer: response.data?.answer || '',
        matches: Array.isArray(response.data?.matches) ? response.data.matches : []
    };
};

// The /api/Property/{id} endpoint returns these lists as JSON strings
// like "[\"Parking\",\"Garden\"]", so turn them into real arrays.
const parseList = (value: any): string[] => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value.trim().startsWith('[')) {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }
    return value ? [String(value)] : [];
};

// Load the full property for each match using the existing endpoint
const fetchPropertiesByIds = async (ids: string[]): Promise<any[]> => {
    const results = await Promise.all(
        ids.map(id =>
            axios
                .get(`${API_URL}/api/Property/${id}`)
                .then(r => ({
                    ...r.data,
                    propertyFeatures: parseList(r.data.propertyFeatures),
                    propertyPreferences: parseList(r.data.propertyPreferences)
                }))
                .catch(error => {
                    console.error(`Could not load property ${id}:`, error);
                    return null;
                })
        )
    );
    return results.filter(Boolean);
};

// Fetch user information for properties
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

// Transform backend response into recommendations
const transformBackendResponse = (properties: any[], reasoning: string): PropertyRecommendation[] => {
    if (!properties || properties.length === 0) return [];

    // Extract key terms from the AI answer (used only for the legacy score below)
    const keyTerms = new Set<string>();
    const reasoningTerms = reasoning.toLowerCase()
        .match(/\b(modern|garden|parking|traditional|balcony|pet friendly|air conditioning|storage|urban|rural)\b/g);

    if (reasoningTerms) {
        reasoningTerms.forEach(term => keyTerms.add(term));
    }

    const searchTerms = Array.from(keyTerms);

    // Legacy score (kept so PropertyCard still receives a "confidence" value).
    // It is NOT an AI score; the real explanation is the per-listing reason.
    const scoredProperties = properties.map(property => {
        const propFeatures = Array.isArray(property.propertyFeatures)
            ? property.propertyFeatures.map((f: string) => f.toLowerCase())
            : [];

        const propPreferences = Array.isArray(property.propertyPreferences)
            ? property.propertyPreferences.map((p: string) => p.toLowerCase())
            : [];

        const propAttributes = [...propFeatures, ...propPreferences];

        let matchCount = 0;
        const totalTerms = searchTerms.length || 1;

        searchTerms.forEach(term => {
            if (propAttributes.some(attr => attr.includes(term))) {
                matchCount++;
            }
        });

        const matchPercentage = Math.min(0.98, Math.max(0.75, 0.75 + (matchCount / totalTerms * 0.23)));

        return { property, matchScore: matchPercentage };
    });

    return scoredProperties.map((scoredProp) => {
        const property = scoredProp.property;

        // Get the first photo URL or use placeholder
        let photoUrl = '';
        if (property.photos && property.photos.length > 0) {
            photoUrl = property.photos[0].photoUrl;
        }

        // Make sure full photo URL is used
        if (photoUrl && !photoUrl.startsWith('http') && !photoUrl.startsWith('data:')) {
            photoUrl = `${API_URL}${photoUrl}`;
        }

        return {
            id: property.id,
            title: property.title,
            caption: property.caption,
            matchReason: '', // filled in with the real per-listing reason from the RAG answer
            confidence: scoredProp.matchScore,
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
            username: property.username || property.user?.username || 'User',
            avatarUrl: property.avatarUrl || property.user?.avatarUrl || null,
            createdAt: property.createdAt,
            views: property.views || 0,
            likesCount: property.likesCount || 0,
            likes: property.likesCount || property.likes || 0,
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

// AI search thunk: RAG through the backend
export const searchWithAI = createAsyncThunk(
    'ai/searchWithAI',
    async ({ query, useThinkingMode = false }: { query: string, useThinkingMode?: boolean }, { dispatch, rejectWithValue }) => {
        try {
            console.log('Starting AI search for query:', query, 'Using thinking mode:', useThinkingMode);

            if (useThinkingMode) {
                dispatch({ type: 'ai/startThinking' });
            }

            // Step 1: ask the backend (retrieve -> Gemini -> validated matches)
            let rag: AskResult;
            let aiFailed = false;
            try {
                rag = await askListings(query);
            } catch (error) {
                console.warn('RAG endpoint failed, falling back to keyword search:', error);
                aiFailed = true;
                rag = {
                    answer: 'The AI assistant is unavailable right now, so these are keyword results.',
                    matches: []
                };
            }

            // Step 2: load the matched listings
            let properties: any[] = [];

            if (aiFailed) {
                const fallback = await axios.get(`${API_URL}/api/Property/search?q=${encodeURIComponent(query)}`);
                properties = fallback.data.properties || [];
            } else {
                properties = await fetchPropertiesByIds(rag.matches.map(m => String(m.id)));
            }

            // Step 3: add user info and transform
            properties = await fetchUserInfoForProperties(properties);

            const reasonById = new Map(rag.matches.map(m => [String(m.id), m.reason]));
            const orderById = new Map(rag.matches.map((m, index) => [String(m.id), index]));

            const recommendations = transformBackendResponse(properties, rag.answer)
                .map(rec => ({
                    ...rec,
                    matchReason: reasonById.get(String(rec.id)) || rec.matchReason
                }))
                // keep the order chosen by the AI (best match first)
                .sort((a, b) =>
                    (orderById.get(String(a.id)) ?? 999) - (orderById.get(String(b.id)) ?? 999)
                );

            // Step 4: "thinking" panel built from the real answer (one step per matched listing)
            let thinkingProcess: AIThinkingProcess | null = null;
            if (useThinkingMode) {
                thinkingProcess = {
                    steps: recommendations.map((rec, index) => ({
                        step: index + 1,
                        title: rec.title || `Listing ${index + 1}`,
                        description: rec.matchReason || ''
                    })),
                    conclusion: rag.answer || 'Analysis complete.'
                };

                dispatch({ type: 'ai/updateThinkingProcess', payload: thinkingProcess });

                // Small delay to let the user see the conclusion
                await new Promise(resolve => setTimeout(resolve, 1500));
                dispatch({ type: 'ai/finishThinking' });
            }

            return {
                recommendations,
                parsedFilters: null,
                aiReasoning: rag.answer,
                thinkingProcess: thinkingProcess,
                totalCount: recommendations.length
            };
        } catch (error: any) {
            console.error('AI search error:', error);

            // Clear thinking mode on error
            dispatch({ type: 'ai/finishThinking' });

            return rejectWithValue(error.message || 'An unknown error occurred');
        }
    }
);

// Slice with thinking mode actions
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