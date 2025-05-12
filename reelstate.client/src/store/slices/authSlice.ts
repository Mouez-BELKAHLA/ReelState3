import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AuthService from '../../Features/auth/services/AuthService';
import { User, AuthState, LoginCredentials, RegisterCredentials } from '../../Features/auth/types/Auth';
import { getErrorMessage, handleAuthError } from '../../shared/helpers';

const initialState: AuthState = {
    user: null,
    token: localStorage.getItem('token'),
    refreshToken: localStorage.getItem('refreshToken'),
    isAuthenticated: !!localStorage.getItem('token'),
    isLoading: false,
    error: null
};

// Async thunks for authentication actions
export const loginUser = createAsyncThunk(
    'auth/login',
    async (credentials: LoginCredentials, { rejectWithValue }) => {
        try {
            const response = await AuthService.login(credentials);
            return response;
        } catch (error) {
            return rejectWithValue(handleAuthError(error, 'login'));
        }
    }
);

export const registerUser = createAsyncThunk(
    'auth/register',
    async (credentials: RegisterCredentials, { rejectWithValue }) => {
        try {
            const response = await AuthService.register(credentials);
            return response;
        } catch (error) {
            return rejectWithValue(handleAuthError(error, 'registration'));
        }
    }
);

export const googleLogin = createAsyncThunk(
    'auth/googleLogin',
    async (idToken: string, { rejectWithValue }) => {
        try {
            const response = await AuthService.googleAuth(idToken);
            return response;
        } catch (error) {
            return rejectWithValue(handleAuthError(error, 'google'));
        }
    }
);

export const logoutUser = createAsyncThunk(
    'auth/logout',
    async (_, { rejectWithValue }) => {
        try {
            await AuthService.logout();
            return null;
        } catch (error) {
            console.error('Error during logout:', getErrorMessage(error, ''));
            return rejectWithValue('Logout failed');
        }
    }
);

export const refreshUserToken = createAsyncThunk(
    'auth/refreshToken',
    async (_, { rejectWithValue }) => {
        try {
            const response = await AuthService.refreshToken();
            if (!response || !response.isSuccess) {
                return rejectWithValue('Token refresh failed');
            }
            return response;
        } catch (error) {
            return rejectWithValue(handleAuthError(error, 'refresh'));
        }
    }
);

// Auth slice definition
const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (state, action: PayloadAction<{ user: User; token: string; refreshToken: string }>) => {
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.refreshToken = action.payload.refreshToken;
            state.isAuthenticated = true;
            state.isLoading = false;
            state.error = null;
        },
        clearCredentials: (state) => {
            state.user = null;
            state.token = null;
            state.refreshToken = null;
            state.isAuthenticated = false;
        },
        setAuthLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        setAuthError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            // Login cases
            .addCase(loginUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                if (action.payload.isSuccess) {
                    state.user = {
                        id: action.payload.userId,
                        email: action.payload.email,
                        firstName: action.payload.firstName,
                        lastName: action.payload.lastName,
                        profilePictureUrl: action.payload.profilePictureUrl
                    };
                    state.token = action.payload.token;
                    state.refreshToken = action.payload.refreshToken;
                    state.isAuthenticated = true;
                }
                state.isLoading = false;
                state.error = action.payload.isSuccess ? null : action.payload.message || null;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string || 'Login failed';
            })

            // Register cases
            .addCase(registerUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                if (action.payload.isSuccess) {
                    state.user = {
                        id: action.payload.userId,
                        email: action.payload.email,
                        firstName: action.payload.firstName,
                        lastName: action.payload.lastName,
                        profilePictureUrl: action.payload.profilePictureUrl
                    };
                    state.token = action.payload.token;
                    state.refreshToken = action.payload.refreshToken;
                    state.isAuthenticated = true;
                }
                state.isLoading = false;
                state.error = action.payload.isSuccess ? null : action.payload.message || null;
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string || 'Registration failed';
            })

            // Google login cases
            .addCase(googleLogin.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(googleLogin.fulfilled, (state, action) => {
                if (action.payload.isSuccess) {
                    state.user = {
                        id: action.payload.userId,
                        email: action.payload.email,
                        firstName: action.payload.firstName,
                        lastName: action.payload.lastName,
                        profilePictureUrl: action.payload.profilePictureUrl
                    };
                    state.token = action.payload.token;
                    state.refreshToken = action.payload.refreshToken;
                    state.isAuthenticated = true;
                }
                state.isLoading = false;
                state.error = action.payload.isSuccess ? null : action.payload.message || null;
            })
            .addCase(googleLogin.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string || 'Google login failed';
            })

            // Logout case
            .addCase(logoutUser.fulfilled, (state) => {
                state.user = null;
                state.token = null;
                state.refreshToken = null;
                state.isAuthenticated = false;
                state.isLoading = false;
                state.error = null;
            })

            // Refresh token cases
            .addCase(refreshUserToken.fulfilled, (state, action) => {
                if (action.payload.isSuccess) {
                    state.user = {
                        id: action.payload.userId,
                        email: action.payload.email,
                        firstName: action.payload.firstName,
                        lastName: action.payload.lastName,
                        profilePictureUrl: action.payload.profilePictureUrl
                    };
                    state.token = action.payload.token;
                    state.refreshToken = action.payload.refreshToken;
                    state.isAuthenticated = true;
                }
            })
            .addCase(refreshUserToken.rejected, (state) => {
                state.user = null;
                state.token = null;
                state.refreshToken = null;
                state.isAuthenticated = false;
            });
    }
});

export const { setCredentials, clearCredentials, setAuthLoading, setAuthError } = authSlice.actions;

export default authSlice.reducer;