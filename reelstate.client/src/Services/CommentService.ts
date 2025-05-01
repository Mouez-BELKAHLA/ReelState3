import axios from 'axios';
import { API_URL } from '../Services/config';
import { Comment } from '../Components/CommentOverlay';

class CommentService {
    // Get comments for a property
    async getPropertyComments(propertyId: string): Promise<Comment[]> {
        try {
            const token = localStorage.getItem('token');
            const headers: Record<string, string> = {};

            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }

            const response = await axios.get(`${API_URL}/api/Comments/property/${propertyId}`, {
                headers
            });

            return response.data;
        } catch (error) {
            console.error('Error fetching comments:', error);
            return [];
        }
    }

    // Add a new comment
    async addComment(propertyId: string, text: string): Promise<Comment | null> {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication required');
            }

            console.log("Sending comment to API:", { propertyId, text });

            const response = await axios.post(
                `${API_URL}/api/Comments`,
                { propertyId, text },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log("API response for adding comment:", response.data);
            return response.data;
        } catch (error) {
            console.error('Error adding comment:', error);
            return null;
        }
    }

    // Delete a comment
    async deleteComment(commentId: string): Promise<boolean> {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication required');
            }

            await axios.delete(
                `${API_URL}/api/Comments/${commentId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            return true;
        } catch (error) {
            console.error('Error deleting comment:', error);
            return false;
        }
    }
}

export default new CommentService();