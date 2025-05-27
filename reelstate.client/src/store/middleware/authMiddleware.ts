import { Middleware } from 'redux';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { RootState } from '../index';
import { refreshUserToken, clearCredentials, setAuthError } from '../slices/authSlice';
import { processAuthError, getErrorMessage } from '../../shared/helpers';

// Define a type for JWT payload
interface JwtPayload {
    exp?: number;
    [key: string]: unknown;
}

// Standard Redux middleware without any reference to deprecated types
export const authMiddleware: Middleware =
    store => next => action => {
        // Process the action first
        const result = next(action);

        // Check if the state has changed in a way we care about
        const state = store.getState() as RootState;
        const { auth } = state;

        // Set up axios auth header if we have a token
        if (auth.token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${auth.token}`;

            // Check token expiration and refresh if needed
            const tokenData = parseJwt(auth.token);
            const currentTime = Math.floor(Date.now() / 1000);

            // If token will expire in less than 5 minutes, refresh it proactively
            if (tokenData.exp && tokenData.exp - currentTime < 300) {
                // Using Promise handling without type assertions
                Promise.resolve(store.dispatch(refreshUserToken()))
                    .catch((error: unknown) => {
                        console.error('Failed to refresh token:', getErrorMessage(error));
                        store.dispatch(setAuthError('Session expired. Please login again.'));
                        store.dispatch(clearCredentials());
                    });
            }
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }

        return result;
    };

// Helper function to parse JWT token
function parseJwt(token: string): JwtPayload {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(window.atob(base64));
    } catch {
        // Using empty catch block (allowed in TypeScript)
        return {};
    }
}

// Extended axios request config with retry property
interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
    _retry?: boolean;
}

// Strong typing for the store parameter with specific types
interface TypedStore {
    dispatch: (action: unknown) => unknown;
    getState: () => RootState;
}

// Function to initialize axios interceptors
export const setupAxiosInterceptors = (store: TypedStore): void => {
    axios.interceptors.response.use(
        response => response,
        async (error: unknown) => {
            if (!axios.isAxiosError(error)) {
                return Promise.reject(error);
            }

            const axiosError = error as AxiosError;
            const originalRequest = axiosError.config as ExtendedAxiosRequestConfig;

            // Handle 401 Unauthorized errors by trying to refresh the token
            if (axiosError.response?.status === 401 && originalRequest && !originalRequest._retry) {
                originalRequest._retry = true;

                // Check if we have a refresh token
                const { auth } = store.getState();
                if (auth.refreshToken) {
                    try {
                        // Try to refresh the token without type assertions
                        await Promise.resolve(store.dispatch(refreshUserToken()));
                        const newState = store.getState();

                        // If we got a new token, retry the original request
                        if (newState.auth.token) {
                            if (!originalRequest.headers) originalRequest.headers = {};
                            originalRequest.headers['Authorization'] = `Bearer ${newState.auth.token}`;
                            return axios(originalRequest);
                        }
                    } catch (refreshError) {
                        // Use our error helper for error handling
                        const errorMessage = processAuthError(refreshError, 'refresh').message;
                        store.dispatch(setAuthError(errorMessage));
                        store.dispatch(clearCredentials());
                        return Promise.reject(refreshError);
                    }
                } else {
                    // No refresh token, so just log the user out
                    store.dispatch(clearCredentials());
                }
            }

            return Promise.reject(error);
        }
    );
};