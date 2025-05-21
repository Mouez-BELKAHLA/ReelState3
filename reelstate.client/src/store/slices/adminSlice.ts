import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../shared';
import { VideoCardProperty } from '../../Features/property/types/Property';

// Define types
interface AdminState {
    pendingVideos: VideoCardProperty[];
    loading: boolean;
    error: string | null;
}

// Initial state
const initialState: AdminState = {
    pendingVideos: [],
    loading: false,
    error: null
};

// Async thunks
export const fetchPendingVideos = createAsyncThunk(
    'admin/fetchPendingVideos',
    async (_, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/api/Admin/pending-videos`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.data.isSuccess) {
                return rejectWithValue(response.data.message || 'Failed to fetch pending videos');
            }

            return response.data.videos;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || error.message || 'An error occurred');
        }
    }
);

export const approveVideo = createAsyncThunk(
    'admin/approveVideo',
    async (videoId: string, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(
                `${API_URL}/api/Admin/approve-video/${videoId}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!response.data.isSuccess) {
                return rejectWithValue(response.data.message || 'Failed to approve video');
            }

            return videoId;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || error.message || 'An error occurred');
        }
    }
);

export const rejectVideo = createAsyncThunk(
    'admin/rejectVideo',
    async ({ videoId, reason }: { videoId: string; reason: string }, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(
                `${API_URL}/api/Admin/reject-video/${videoId}`,
                { reason },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!response.data.isSuccess) {
                return rejectWithValue(response.data.message || 'Failed to reject video');
            }

            return videoId;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || error.message || 'An error occurred');
        }
    }
);

// Create the slice
const adminSlice = createSlice({
    name: 'admin',
    initialState,
    reducers: {
        clearAdminError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch pending videos
            .addCase(fetchPendingVideos.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPendingVideos.fulfilled, (state, action: PayloadAction<VideoCardProperty[]>) => {
                state.pendingVideos = action.payload;
                state.loading = false;
            })
            .addCase(fetchPendingVideos.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Approve video
            .addCase(approveVideo.fulfilled, (state, action: PayloadAction<string>) => {
                state.pendingVideos = state.pendingVideos.filter(video => video.id !== action.payload);
            })

            // Reject video
            .addCase(rejectVideo.fulfilled, (state, action: PayloadAction<string>) => {
                state.pendingVideos = state.pendingVideos.filter(video => video.id !== action.payload);
            });
    }
});

export const { clearAdminError } = adminSlice.actions;
export default adminSlice.reducer;