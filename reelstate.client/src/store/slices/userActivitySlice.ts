import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../shared';
import { UserActivityState } from '../../Features/dashboard/types/UserActivity';

// Initial state
const initialState: UserActivityState = {
    comments: {
        total: 0,
        recent: []
    },
    likes: {
        total: 0,
        recent: []
    },
    likedComments: {
        total: 0,
        recent: []
    },
    properties: {
        total: 0,
        recent: []
    },
    following: {
        total: 0,
        recent: []
    },
    followers: {
        total: 0,
        recent: []
    },
    loading: false,
    error: null
};

// Async thunk to fetch user activity
export const fetchUserActivity = createAsyncThunk(
    'userActivity/fetchUserActivity',
    async (userId: string, { getState, rejectWithValue }) => {
        try {
            console.log(`Fetching activity for user ${userId} at ${API_URL}/api/UserActivity/${userId}/activity`);

            const { auth } = getState() as { auth: { token: string } };
            const token = auth.token;

            console.log('Using auth token:', token ? 'Token present' : 'No token');

            const response = await axios.get(
                `${API_URL}/api/UserActivity/${userId}/activity`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            console.log('Activity data received from API:', response.data);

            // Log specifically if following data exists
            if (response.data.following) {
                console.log('Following data found:', response.data.following);
            } else {
                console.warn('Following data NOT found in API response!');
            }

            // Make sure following and followers are properly structured even if null
            const data = {
                ...response.data,
                following: response.data.following || { total: 0, recent: [] },
                followers: response.data.followers || { total: 0, recent: [] },
            };

            return data;
        } catch (error: any) {
            console.error('Error in fetchUserActivity:', error);

            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
            } else if (error.request) {
                console.error('No response received. Is the API running?');
                console.error('API URL used:', `${API_URL}/api/UserActivity/${userId}/activity`);
            }

            const errorMessage = error.response?.data?.message || 'Failed to fetch user activity';
            return rejectWithValue(errorMessage);
        }
    }
);

// Create slice
const userActivitySlice = createSlice({
    name: 'userActivity',
    initialState,
    reducers: {
        clearUserActivity: () => initialState
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUserActivity.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUserActivity.fulfilled, (state, action) => {
                state.loading = false;
                state.comments = action.payload.comments || { total: 0, recent: [] };
                state.likes = action.payload.likes || { total: 0, recent: [] };
                state.likedComments = action.payload.likedComments || { total: 0, recent: [] };
                state.properties = action.payload.properties || { total: 0, recent: [] };

                // Debug what's happening with following data
                console.log('Setting following in state:', action.payload.following);
                state.following = action.payload.following || { total: 0, recent: [] };

                console.log('Setting followers in state:', action.payload.followers);
                state.followers = action.payload.followers || { total: 0, recent: [] };

                // Print the entire state after update
                console.log('Updated state:', state);
            })
            .addCase(fetchUserActivity.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    }
});

export const { clearUserActivity } = userActivitySlice.actions;
export default userActivitySlice.reducer;