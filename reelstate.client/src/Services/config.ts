// Create this file to centralize your API configuration
export const API_URL = 'http://localhost:5034'; // WITHOUT the /api suffix

// Export constants for all endpoints to prevent errors
export const ENDPOINTS = {
    LOGIN: `${API_URL}/api/Auth/login`,
    REGISTER: `${API_URL}/api/Auth/register`,
    GOOGLE_LOGIN: `${API_URL}/api/Auth/google-login`,
    REFRESH_TOKEN: `${API_URL}/api/Auth/refreshToken`,
    LOGOUT: `${API_URL}/api/Auth/logout`,
    PROFILE: `${API_URL}/api/Auth/profile`
};