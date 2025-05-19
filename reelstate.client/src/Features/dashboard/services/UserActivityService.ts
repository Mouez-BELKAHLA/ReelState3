import axios from 'axios';
import { API_URL } from '../../../shared';
import { UserActivityResponse } from '../types/UserActivity';

class UserActivityService {
    /**
     * Fetch user activity data from the API
     * @param userId The user ID to fetch activity for
     * @returns Promise with user activity data
     */
    static async getUserActivity(userId: string): Promise<UserActivityResponse> {
        try {
            console.log(`Fetching user activity for ${userId} from ${API_URL}/api/UserActivity/${userId}/activity`);
            // Make sure we're using the absolute URL with API_URL
            const response = await axios.get(`${API_URL}/api/UserActivity/${userId}/activity`, {
                // Add auth token from localStorage
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            console.log('User activity data received:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Error fetching user activity:', error.message);
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
            } else if (error.request) {
                console.error('No response received. Request:', error.request);
                console.error('Is API_URL correct?', API_URL);
            } else {
                console.error('Error setting up request:', error.message);
            }
            throw error;
        }
    }
}

export default UserActivityService;