import axios from 'axios';
import { API_URL } from "../../../shared";

class CommentLikeService {
    // Get like status for a comment
    async getLikeStatus(commentId: string): Promise<{ isLiked: boolean, likesCount: number }> {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                return { isLiked: false, likesCount: 0 };
            }

            const response = await axios.get(
                `${API_URL}/api/CommentLikes/status/${commentId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            return {
                isLiked: response.data.isLiked,
                likesCount: response.data.likesCount
            };
        } catch (error) {
            console.error('Error getting comment like status:', error);
            return { isLiked: false, likesCount: 0 };
        }
    }

    // Toggle like for a comment
    async toggleLike(commentId: string): Promise<{ isLiked: boolean, likesCount: number }> {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication required');
            }

            const response = await axios.post(
                `${API_URL}/api/CommentLikes/toggle`,
                { commentId },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            return {
                isLiked: response.data.isLiked,
                likesCount: response.data.likesCount
            };
        } catch (error) {
            console.error('Error toggling comment like:', error);
            throw error;
        }
    }
}

export default new CommentLikeService();