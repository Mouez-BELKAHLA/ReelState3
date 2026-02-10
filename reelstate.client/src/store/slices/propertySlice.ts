import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../shared';
import { toVideoCardProperties } from '../../shared/Utils/TypeTransformers';
import { VideoCardProperty, SearchFilters } from '../../Features/property/types/Property';
import { PropertyLikeState, PropertyLoadingState } from '../../Features/property/types/Property';
import { LikeService } from '../../Features/property';
import { SearchService, SearchResponse } from '../../Features/property/services/SearchService';
import { getErrorMessage } from '../../shared/helpers';

// Define the property state interface
interface PropertyState {
    properties: VideoCardProperty[];
    searchResults: VideoCardProperty[];
    propertyLikes: PropertyLikeState;
    likeLoading: PropertyLoadingState;
    activeVideoIndex: number;
    activePropertyId: string | null;
    isLoading: boolean;
    isSearching: boolean;
    error: string | null;
    showComments: boolean;
    currentFilters: SearchFilters;
    searchQuery: string;
    pagination: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

const initialState: PropertyState = {
    properties: [],
    searchResults: [],
    propertyLikes: {},
    likeLoading: {},
    activeVideoIndex: 0,
    activePropertyId: null,
    isLoading: false,
    isSearching: false,
    error: null,
    showComments: false,
    currentFilters: {},
    searchQuery: '',
    pagination: {
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        hasNextPage: false,
        hasPreviousPage: false,
    },
};

// Async thunks for property actions
export const fetchProperties = createAsyncThunk(
    'property/fetchProperties',
    async (_, { getState, rejectWithValue }) => {
        try {
            const { auth } = getState() as { auth: { token: string | null } };

            const headers: Record<string, string> = {};
            if (auth.token) {
                headers.Authorization = `Bearer ${auth.token}`;
            }

            const response = await axios.get(`${API_URL}/api/Property`, { headers });

            // DEBUG LOGGING - Remove after fixing
            console.log('=== API RESPONSE DEBUG ===');
            console.log('Raw API response:', response.data);
            if (response.data && response.data.length > 0) {
                console.log('First property from API:', response.data[0]);
                console.log('API PropertyPreferences:', response.data[0]?.PropertyPreferences || response.data[0]?.propertyPreferences);
                console.log('API PropertyFeatures:', response.data[0]?.PropertyFeatures || response.data[0]?.propertyFeatures);
            }

            const transformedData = toVideoCardProperties(response.data, API_URL);

            console.log('=== TRANSFORMED DATA DEBUG ===');
            console.log('Transformed data:', transformedData);
            if (transformedData && transformedData.length > 0) {
                console.log('First transformed property:', transformedData[0]);
                console.log('Transformed propertyPreferences:', transformedData[0]?.propertyPreferences);
                console.log('Transformed propertyFeatures:', transformedData[0]?.propertyFeatures);
            }
            console.log('============================');

            return transformedData;
        } catch (error: unknown) {
            return rejectWithValue(getErrorMessage(error, 'Failed to fetch properties'));
        }
    }
);

// FIXED search thunk - use 'q' parameter instead of 'city'
export const searchProperties = createAsyncThunk(
    'property/searchProperties',
    async ({ query, filters }: { query: string; filters: SearchFilters }, { rejectWithValue }) => {
        try {
            console.log('=== PROPERTY SLICE SEARCH DEBUG ===');
            console.log('Input query:', query);
            console.log('Input filters:', filters);

            const searchFilters: SearchFilters = {
                ...filters,
                page: filters.page || 1,
                limit: filters.limit || 20,
            };

            // FIXED: Add query as 'q' parameter, not 'city'
            if (query.trim()) {
                searchFilters.q = query.trim();
                console.log('Added q parameter:', query.trim());
            }

            console.log('Final search filters being sent:', searchFilters);

            const response: SearchResponse = await SearchService.searchProperties(searchFilters);

            console.log('Search service response:', response);

            // Transform the properties
            const transformedProperties = toVideoCardProperties(response.properties, API_URL);

            console.log('Transformed search results:', transformedProperties);

            return {
                properties: transformedProperties,
                pagination: {
                    currentPage: response.currentPage,
                    totalPages: response.totalPages,
                    totalCount: response.totalCount,
                    hasNextPage: response.hasNextPage,
                    hasPreviousPage: response.hasPreviousPage,
                },
                query,
                filters: searchFilters,
            };
        } catch (error: unknown) {
            console.error('Property slice search error:', error);
            return rejectWithValue(getErrorMessage(error, 'Failed to search properties'));
        }
    }
);

// Export the check like status function that's being imported by components
export const checkLikeStatus = createAsyncThunk(
    'property/checkLikeStatus',
    async (propertyId: string, { rejectWithValue }) => {
        try {
            const response = await LikeService.checkLikeStatus(propertyId);
            if (!response.isSuccess) {
                return rejectWithValue('Failed to check like status');
            }
            return {
                propertyId,
                isLiked: response.isLiked,
                count: response.likesCount
            };
        } catch (error: unknown) {
            return rejectWithValue(getErrorMessage(error, 'Failed to check like status'));
        }
    }
);

export const checkAllLikeStatuses = createAsyncThunk(
    'property/checkAllLikeStatuses',
    async (_, { getState, rejectWithValue }) => {
        try {
            const { auth, property } = getState() as {
                auth: { token: string | null, isAuthenticated: boolean },
                property: { properties: VideoCardProperty[], searchResults: VideoCardProperty[] }
            };

            if (!auth.isAuthenticated || !auth.token) {
                return {};
            }

            // Check likes for either search results or regular properties
            const propertiesToCheck = property.searchResults.length > 0 ? property.searchResults : property.properties;

            if (propertiesToCheck.length === 0) {
                return {};
            }

            const propertyLikes: PropertyLikeState = {};

            for (const prop of propertiesToCheck) {
                try {
                    const response = await LikeService.checkLikeStatus(prop.id);
                    if (response.isSuccess) {
                        propertyLikes[prop.id] = {
                            count: response.likesCount || 0,
                            isLiked: response.isLiked
                        };
                    }
                } catch (innerError: unknown) {
                    console.error(`Error checking like status for property ${prop.id}:`,
                        getErrorMessage(innerError));
                }
            }

            return propertyLikes;
        } catch (error: unknown) {
            return rejectWithValue(getErrorMessage(error, 'Failed to check like statuses'));
        }
    }
);

export const toggleLike = createAsyncThunk(
    'property/toggleLike',
    async (propertyId: string, { rejectWithValue }) => {
        try {
            const response = await LikeService.toggleLike(propertyId);
            if (!response.isSuccess) {
                return rejectWithValue('Failed to toggle like');
            }
            return {
                propertyId,
                isLiked: response.isLiked,
                count: response.likesCount
            };
        } catch (error: unknown) {
            return rejectWithValue(getErrorMessage(error, 'Failed to toggle like'));
        }
    }
);

const propertySlice = createSlice({
    name: 'property',
    initialState,
    reducers: {
        setActiveVideoIndex: (state, action: PayloadAction<number>) => {
            state.activeVideoIndex = action.payload;

            // Safety check to prevent error when index is -1 or out of bounds
            if (action.payload >= 0 && state.searchResults.length > action.payload) {
                const property = state.searchResults[action.payload];
                if (property) {
                    state.activePropertyId = property.id;
                }
            } else {
                // If index is invalid, clear the active property ID
                state.activePropertyId = null;
            }
        },
        toggleComments: (state, action: PayloadAction<boolean | undefined>) => {
            state.showComments = action.payload !== undefined ? action.payload : !state.showComments;
        },
        setActiveProperty: (state, action: PayloadAction<string>) => {
            state.activePropertyId = action.payload;
        },
        updatePropertyLike: (state, action: PayloadAction<{
            propertyId: string;
            isLiked: boolean;
            count: number;
        }>) => {
            const { propertyId, isLiked, count } = action.payload;
            state.propertyLikes[propertyId] = { isLiked, count };
        },
        clearSearchResults: (state) => {
            state.searchResults = [];
            state.searchQuery = '';
            state.currentFilters = {};
            state.pagination = initialState.pagination;
        },
        setSearchFilters: (state, action: PayloadAction<SearchFilters>) => {
            state.currentFilters = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch properties cases
            .addCase(fetchProperties.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchProperties.fulfilled, (state, action) => {
                state.isLoading = false;
                state.properties = action.payload;

                // Initialize like state for all properties
                action.payload.forEach(prop => {
                    if (!state.propertyLikes[prop.id]) {
                        state.propertyLikes[prop.id] = {
                            count: prop.likes || 0,
                            isLiked: false
                        };
                    }
                });

                // Set active property ID if it doesn't exist yet
                if (!state.activePropertyId && action.payload.length > 0) {
                    state.activePropertyId = action.payload[0].id;
                }
            })
            .addCase(fetchProperties.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string || 'Failed to fetch properties';
            })

            // Search properties cases
            .addCase(searchProperties.pending, (state) => {
                state.isSearching = true;
                state.error = null;
            })
            .addCase(searchProperties.fulfilled, (state, action) => {
                state.isSearching = false;
                state.searchResults = action.payload.properties;
                state.pagination = action.payload.pagination;
                state.searchQuery = action.payload.query;
                state.currentFilters = action.payload.filters;

                // Initialize like state for search results
                action.payload.properties.forEach(prop => {
                    if (!state.propertyLikes[prop.id]) {
                        state.propertyLikes[prop.id] = {
                            count: prop.likes || 0,
                            isLiked: false
                        };
                    }
                });

                // Reset active video index when new search results come in
                state.activeVideoIndex = 0;
                if (action.payload.properties.length > 0) {
                    state.activePropertyId = action.payload.properties[0].id;
                }
            })
            .addCase(searchProperties.rejected, (state, action) => {
                state.isSearching = false;
                state.error = action.payload as string || 'Failed to search properties';
            })

            // Check like status cases
            .addCase(checkLikeStatus.pending, (state, action) => {
                const propertyId = action.meta.arg;
                state.likeLoading[propertyId] = true;
            })
            .addCase(checkLikeStatus.fulfilled, (state, action) => {
                const { propertyId, isLiked, count } = action.payload;
                state.propertyLikes[propertyId] = { isLiked, count };
                state.likeLoading[propertyId] = false;
            })
            .addCase(checkLikeStatus.rejected, (state, action) => {
                const propertyId = action.meta.arg;
                state.likeLoading[propertyId] = false;
            })

            // Check all like statuses cases
            .addCase(checkAllLikeStatuses.fulfilled, (state, action) => {
                state.propertyLikes = {
                    ...state.propertyLikes,
                    ...action.payload as PropertyLikeState
                };
            })

            // Toggle like cases
            .addCase(toggleLike.pending, (state, action) => {
                const propertyId = action.meta.arg;
                state.likeLoading[propertyId] = true;
            })
            .addCase(toggleLike.fulfilled, (state, action) => {
                const { propertyId, isLiked, count } = action.payload;
                state.propertyLikes[propertyId] = { isLiked, count };
                state.likeLoading[propertyId] = false;
            })
            .addCase(toggleLike.rejected, (state, action) => {
                const propertyId = action.meta.arg;
                state.likeLoading[propertyId] = false;
            });
    }
});

export const {
    setActiveVideoIndex,
    toggleComments,
    setActiveProperty,
    updatePropertyLike,
    clearSearchResults,
    setSearchFilters
} = propertySlice.actions;

export default propertySlice.reducer;