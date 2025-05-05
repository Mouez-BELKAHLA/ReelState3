// Current Date and Time (UTC - YYYY-MM-DD HH:MM:SS formatted): 2025-05-05 20:09:44
// Current User's Login: Mouez-BELKAHLA

import { API_URL } from '../../../shared'; // Import API_URL from shared barrel file

export const ENDPOINTS = {
    LOGIN: `${API_URL}/api/Auth/login`,
    REGISTER: `${API_URL}/api/Auth/register`,
    GOOGLE_LOGIN: `${API_URL}/api/Auth/google-login`,
    REFRESH_TOKEN: `${API_URL}/api/Auth/refreshToken`,
    LOGOUT: `${API_URL}/api/Auth/logout`,
    PROFILE: `${API_URL}/api/Auth/profile`
};