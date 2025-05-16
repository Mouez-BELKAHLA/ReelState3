import { API_URL } from '../../../shared';

// Dashboard-specific endpoints
export const DASHBOARD_ENDPOINTS = {
    USER_ACTIVITY: (userId: string) => `${API_URL}/api/UserActivity/${userId}/activity`,
    USER_ACTIVITY_TEST: `${API_URL}/api/UserActivity/test`,
    // Add other dashboard-related endpoints here as needed
};