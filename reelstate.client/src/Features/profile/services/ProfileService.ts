import axios from 'axios';
import { API_URL } from '../../../shared';

// Types for user profile data
export interface UserProfileData {
    id: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    email?: string;
    bio?: string;
    profilePictureUrl?: string;
    followersCount?: number;
    followingCount?: number;
    totalLikes?: number;
    isVerified?: boolean;
}

// Interface matching your backend FollowStatusDto
export interface FollowStatusResponse {
    isSuccess: boolean;
    isFollowing: boolean;
    followersCount: number;
    followingCount: number;
    message?: string;
}

// Get user profile data
export const getUserProfile = async (userId: string, token?: string): Promise<UserProfileData> => {
    try {
        const headers: Record<string, string> = {};
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await axios.get(`${API_URL}/api/User/${userId}`, { headers });
        console.log('User profile response:', response.data);

        if (response.data && response.data.isSuccess) {
            return response.data.data;
        }

        throw new Error('Failed to fetch user profile');
    } catch (error) {
        console.error('Error fetching user profile:', error);
        throw error;
    }
};

// Get user's properties
export const getUserProperties = async (userId: string, token?: string) => {
    try {
        const headers: Record<string, string> = {};
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        // Get properties and filter by userId
        const response = await axios.get(`${API_URL}/api/Property`, { headers });

        // Filter properties by userId on client side
        if (response.data) {
            return response.data.filter((property: any) => property.userId === userId);
        }

        return [];
    } catch (error) {
        console.error('Error fetching user properties:', error);
        throw error;
    }
};

// Get follow status - returns the FollowStatusDto from backend
export const getFollowStatus = async (userId: string, token: string): Promise<FollowStatusResponse> => {
    try {
        console.log(`Fetching follow status for user: ${userId}`);

        const response = await axios.get(
            `${API_URL}/api/Follows/status/${userId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log('Follow status response:', response.data);

        return response.data;
    } catch (error) {
        console.error('Error fetching follow status:', error);
        throw error;
    }
};

// Toggle follow - returns the FollowStatusDto from backend
export const toggleFollow = async (userId: string, token: string): Promise<FollowStatusResponse> => {
    try {
        console.log(`Toggling follow for user: ${userId}`);

        const response = await axios.post(
            `${API_URL}/api/Follows/toggle`,
            { userId }, // This matches your FollowRequestDto
            { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log('Toggle follow response:', response.data);

        return response.data;
    } catch (error) {
        console.error('Error toggling follow:', error);
        throw error;
    }
};

// Get follow counts
export const getFollowCounts = async (userId: string): Promise<{ followersCount: number, followingCount: number }> => {
    try {
        const response = await axios.get(`${API_URL}/api/Follows/count/${userId}`);

        if (response.data && response.data.isSuccess) {
            return {
                followersCount: response.data.followersCount,
                followingCount: response.data.followingCount
            };
        }

        return { followersCount: 0, followingCount: 0 };
    } catch (error) {
        console.error('Error fetching follow counts:', error);
        return { followersCount: 0, followingCount: 0 };
    }
};