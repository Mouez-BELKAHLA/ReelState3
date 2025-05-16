import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import UserActivityService from '../../Features/dashboard/services/UserActivityService';
import { UserActivityState } from '../../Features/dashboard/types/UserActivity';

// Initial state
const initialState: UserActivityState = {
    comments: {
        total: 0,
        recent: [],
    },
    likes: {
        total: 0,
        recent: [],
    },
    likedComments: {
        total: 0,
        recent: [],
    },
    properties: {
        total: 0,
        recent: [],
    },
    loading: false,
    error: null,
};

// Create async thunk for fetching user activity
export const fetchUserActivity = createAsyncThunk(
    'userActivity/fetchUserActivity',
    async (userId: string, { rejectWithValue }) => {
        try {
            const data = await UserActivityService.getUserActivity(userId);
            return data;
        } catch (error: any) {
            console.error('Error fetching user activity:', error);
            return rejectWithValue('Failed to load activity data. Please try again.');
        }
    }
);

// Create the slice
const userActivitySlice = createSlice({
    name: 'userActivity',
    initialState,
    reducers: {
        clearUserActivity: (state) => {
            state.comments.recent = [];
            state.likes.recent = [];
            state.likedComments.recent = [];
            state.properties.recent = [];
            state.comments.total = 0;
            state.likes.total = 0;
            state.likedComments.total = 0;
            state.properties.total = 0;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUserActivity.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUserActivity.fulfilled, (state, action) => {
                state.loading = false;
                state.comments = action.payload.comments;
                state.likes = action.payload.likes;
                state.likedComments = action.payload.likedComments;
                state.properties = action.payload.properties;
            })
            .addCase(fetchUserActivity.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearUserActivity } = userActivitySlice.actions;
export default userActivitySlice.reducer;