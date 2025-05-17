import axios from 'axios';
import { API_URL } from '../../../shared';
import { Notification } from '../types/NotificationTypes';

export class NotificationService {
    private static instance: NotificationService;
    private baseUrl: string;

    private constructor() {
        this.baseUrl = `${API_URL}/api/Notifications`;
    }

    public static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    async getNotifications(token: string): Promise<Notification[]> {
        try {
            const response = await axios.get(this.baseUrl, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching notifications', error);
            throw error;
        }
    }

    async markAsRead(notificationId: string, token: string): Promise<void> {
        try {
            await axios.put(`${this.baseUrl}/${notificationId}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            console.error('Error marking notification as read', error);
            throw error;
        }
    }

    async markAllAsRead(token: string): Promise<void> {
        try {
            await axios.put(`${this.baseUrl}/read-all`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            console.error('Error marking all notifications as read', error);
            throw error;
        }
    }

    async deleteNotification(notificationId: string, token: string): Promise<void> {
        try {
            await axios.delete(`${this.baseUrl}/${notificationId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            console.error('Error deleting notification', error);
            throw error;
        }
    }
}

export default NotificationService.getInstance();