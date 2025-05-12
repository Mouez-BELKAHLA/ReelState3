import { Middleware } from 'redux';
import axios from 'axios';
import { RootState } from '../index';
import { refreshUserToken, clearCredentials } from '../slices/authSlice';

export const authMiddleware: Middleware<{}, RootState> = ({ dispatch, getState }) => {
    return next => action => {
        // Process the action first
        const result = next(action);

        // Check if the state has changed in a way we care about
        const { auth } = getState();

        // Set up axios auth header if we have a token
        if (auth.token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${auth.token}`;
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }

        return result;
    };
};

// Function to initialize axios interceptors
export const setupAxiosInterceptors = (store: any) => {
    axios.interceptors.response.use(
        response => response,
        async error => {
            const originalRequest = error.config;

            // Handle 401 Unauthorized errors by trying to refresh the token
            if (error.response?.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true;

                // Check if we have a refresh token
                const { auth } = store.getState();
                if (auth.refreshToken) {
                    try {
                        // Try to refresh the token
                        await store.dispatch(refreshUserToken());
                        const newState = store.getState();

                        // If we got a new token, retry the original request
                        if (newState.auth.token) {
                            originalRequest.headers['Authorization'] = `Bearer ${newState.auth.token}`;
                            return axios(originalRequest);
                        }
                    } catch (refreshError) {
                        // If refresh fails, log the user out
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