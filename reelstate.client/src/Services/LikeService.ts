import axios from 'axios';
import { API_URL } from './config';
import { LikeResponseDto, LikeStatusDto } from '../Types/ApiTypes';

class LikeService {
    // Toggle like for a property (like if not liked, unlike if liked)
    async toggleLike(propertyId: string): Promise<LikeResponseDto> {
        try {
            // Include token as Bearer in header
            const token = localStorage.getItem('token');
            if (!token) {
                return {
                    isSuccess: false,
                    isLiked: false,
                    likesCount: 0,
                    message: 'Authentication required'
                };
            }

            const response = await axios.post(
                `${API_URL}/api/Likes/toggle`,
                { propertyId },
                {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true
                }
            );
            return response.data;
        } catch (error: any) {
            console.error('Like toggle error:', error);
            return {
                isSuccess: false,
                isLiked: false,
                likesCount: 0,
                message: error.response?.data?.message || 'Failed to update like status'
            };
        }
    }

    // Check if user has liked a property
    async checkLikeStatus(propertyId: string): Promise<LikeStatusDto> {
        try {
            // Include token as Bearer in header
            const token = localStorage.getItem('token');
            if (!token) {
                return {
                    isSuccess: false,
                    isLiked: false,
                    likesCount: 0
                };
            }

            const response = await axios.get(
                `${API_URL}/api/Likes/status/${propertyId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true
                }
            );
            return response.data;
        } catch (error) {
            console.error('Check like status error:', error);
            return {
                isSuccess: false,
                isLiked: false,
                likesCount: 0
            };
        }
    }
}

export default new LikeService();