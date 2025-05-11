import axios from 'axios';
import { API_URL } from "../../../shared";
import { Comment } from '..';

class CommentService {
    // Get comments for a property
    async getPropertyComments(propertyId: string): Promise<Comment[]> {
        try {
            // Get the authentication token
            const token = localStorage.getItem('token');

            // Create request headers object with or without token
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            // Send request with the headers
            const response = await axios.get(
                `${API_URL}/api/Comments/property/${propertyId}`,
                { headers }
            );

            return response.data;
        } catch (error) {
            console.error('Error fetching comments:', error);
            return [];
        }
    }

    // Add a new comment or reply
    async addComment(propertyId: string, text: string, parentCommentId?: string): Promise<Comment | null> {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication required');
            }

            const response = await axios.post(
                `${API_URL}/api/Comments`,
                { propertyId, text, parentCommentId },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

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