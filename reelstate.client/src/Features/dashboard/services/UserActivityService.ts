import axios from 'axios';
import { UserActivityResponse } from '../types/UserActivity';

class UserActivityService {
    /**
     * Fetch user activity data from the API
     * @param userId The user ID to fetch activity for
     * @returns Promise with user activity data
     */
    static async getUserActivity(userId: string): Promise<UserActivityResponse> {
        try {
            console.log(`Fetching user activity for ${userId}`);
            const response = await axios.get(`/api/UserActivity/${userId}/activity`);
            return response.data;
        } catch (error: any) {
            console.error('Error fetching user activity:', error.message);
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
            }
            throw error;
        }
    }
}

export default UserActivityService;