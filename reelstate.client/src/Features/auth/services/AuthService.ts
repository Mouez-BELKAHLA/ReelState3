import axios from 'axios'; // Removed AxiosError since it's not used
import {
    AuthResponse,
    LoginCredentials,
    RegisterCredentials
    // Removed TokenRequest since it's not used
} from '..'; // Import from barrel file
import { getErrorMessage, processAuthError } from '../../../shared';

import { API_URL } from '../../../shared/services/config'; // IMPORT FROM CONFIG

class AuthService {
    private setAuthHeader(token: string | null) {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    }

    // Helper method to construct API endpoints correctly
    private getApiEndpoint(path: string): string {
        // Check if API_URL already ends with /api or is empty (ngrok case)
        if (API_URL === '') {
            return `/api/${path}`; // For ngrok case, ensure /api prefix
        }

        // For localhost or IP cases where API_URL is already http://hostname:5034
        return `${API_URL}/api/${path}`;
    }

    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        try {
            const response = await axios.post<AuthResponse>(
                this.getApiEndpoint('Auth/login'),
                credentials
            );
            const data = response.data;

            if (data.isSuccess && data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('refreshToken', data.refreshToken);
                localStorage.setItem('userId', data.userId);
                localStorage.setItem('email', data.email);
                localStorage.setItem('firstName', data.firstName || '');
                localStorage.setItem('lastName', data.lastName || '');
                localStorage.setItem('profilePictureUrl', data.profilePictureUrl || '');
                this.setAuthHeader(data.token);
            }

            return data;
        } catch (error: unknown) {
            // Process error with our error helper, then rethrow with consistent format
            throw processAuthError(error, 'login');
        }
    }

    async register(credentials: RegisterCredentials): Promise<AuthResponse> {
        try {
            const response = await axios.post<AuthResponse>(
                this.getApiEndpoint('Auth/register'),
                credentials
            );
            const data = response.data;

            if (data.isSuccess && data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('refreshToken', data.refreshToken);
                localStorage.setItem('userId', data.userId);
                localStorage.setItem('email', data.email);
                localStorage.setItem('firstName', data.firstName || '');
                localStorage.setItem('lastName', data.lastName || '');
                localStorage.setItem('profilePictureUrl', data.profilePictureUrl || '');
                this.setAuthHeader(data.token);
            }

            return data;
        } catch (error: unknown) {
            throw processAuthError(error, 'registration');
        }
    }

    async googleAuth(idToken: string): Promise<AuthResponse> {
        try {
            const response = await axios.post<AuthResponse>(
                this.getApiEndpoint('Auth/google-login'),
                {
                    IdToken: idToken  // Capital I to match C# model
                }
            );

            const data = response.data;

            if (data.isSuccess && data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('refreshToken', data.refreshToken);
                localStorage.setItem('userId', data.userId);
                localStorage.setItem('email', data.email);
                localStorage.setItem('firstName', data.firstName || '');
                localStorage.setItem('lastName', data.lastName || '');
                localStorage.setItem('profilePictureUrl', data.profilePictureUrl || '');
                this.setAuthHeader(data.token);

                console.log("Token stored in localStorage:",
                    localStorage.getItem('token') ? "success" : "failed");
            }

            return data;
        } catch (error: unknown) {
            throw processAuthError(error, 'google');
        }
    }

    async refreshToken(): Promise<AuthResponse | null> {
        try {
            const token = localStorage.getItem('token');
            const refreshToken = localStorage.getItem('refreshToken');

            if (!token || !refreshToken) return null;

            console.log("Refresh Token Request:", {
                Token: token,
                RefreshToken: refreshToken
            });

            try {
                const response = await axios.post<AuthResponse>(
                    this.getApiEndpoint('Auth/refreshToken'),
                    {
                        Token: token,
                        RefreshToken: refreshToken
                    }
                );

                console.log("Refresh Token Response:", response.data);

                if (response.data.isSuccess && response.data.token) {
                    localStorage.setItem('token', response.data.token);
                    localStorage.setItem('refreshToken', response.data.refreshToken);
                    localStorage.setItem('userId', response.data.userId);
                    localStorage.setItem('email', response.data.email);
                    localStorage.setItem('firstName', response.data.firstName || '');
                    localStorage.setItem('lastName', response.data.lastName || '');
                    localStorage.setItem('profilePictureUrl', response.data.profilePictureUrl || '');
                    this.setAuthHeader(response.data.token);
                    return response.data;
                }

                return null;
            } catch (error: unknown) {
                console.error("Refresh Token Error Details:", getErrorMessage(error));
                throw processAuthError(error, 'refresh');
            }
        } catch (error: unknown) {
            console.error("Error refreshing token:", getErrorMessage(error));
            this.logout();
            return null;
        }
    }

    async logout(): Promise<void> {
        try {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('userId');
            localStorage.removeItem('email');
            localStorage.removeItem('firstName');
            localStorage.removeItem('lastName');
            localStorage.removeItem('profilePictureUrl');
            this.setAuthHeader(null);
        } catch (error: unknown) {
            console.error('Error during logout:', getErrorMessage(error));
        }
    }

    isAuthenticated(): boolean {
        return !!localStorage.getItem('token');
    }

    getToken(): string | null {
        return localStorage.getItem('token');
    }

    getCurrentUser(): { id: string; email: string; firstName: string; lastName: string; profilePictureUrl?: string } | null {
        const token = localStorage.getItem('token');
        if (!token) return null;

        try {
            // First try to get user info from localStorage
            const userId = localStorage.getItem('userId');
            const email = localStorage.getItem('email');

            if (userId && email) {
                return {
                    id: userId,
                    email: email,
                    firstName: localStorage.getItem('firstName') || '',
                    lastName: localStorage.getItem('lastName') || '',
                    profilePictureUrl: localStorage.getItem('profilePictureUrl') || '',
                };
            }

            // Fallback: decode the JWT token to extract user information
            const payload = JSON.parse(atob(token.split('.')[1]));
            return {
                id: payload.sub, // Assuming 'sub' contains the user ID
                email: payload.email,
                firstName: payload.given_name || '',
                lastName: payload.family_name || '',
                profilePictureUrl: payload.picture || '',
            };
        } catch (error) {
            console.error('Error getting user info:', error);
            return null;
        }
    }

    setupInterceptors(onUnauthorized: () => void): void {
        axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;

                // Only try to refresh if status is 401, not retried yet, and we have a refresh token
                if (error.response?.status === 401 &&
                    !originalRequest._retry &&
                    localStorage.getItem('refreshToken')) {

                    originalRequest._retry = true;

                    try {
                        const refreshResponse = await this.refreshToken();
                        if (refreshResponse && refreshResponse.token) {
                            // Update the authorization header with new token
                            originalRequest.headers['Authorization'] = `Bearer ${refreshResponse.token}`;
                            return axios(originalRequest);
                        } else {
                            // If refresh returns null, go to login
                            onUnauthorized();
                            return Promise.reject(error);
                        }
                    } catch (refreshError) {
                        // If refresh token fails, logout and redirect to login
                        onUnauthorized();
                        return Promise.reject(refreshError);
                    }
                }

                return Promise.reject(error);
            }
        );
    }
}

export default new AuthService();