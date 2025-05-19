export enum NotificationType {
    LIKE = 'like',
    COMMENT = 'comment',
    FOLLOW = 'follow',
    COMMENT_LIKE = 'comment_like',
    PROPERTY_VIEW = 'property_view',
    SYSTEM = 'system'
}

export interface Notification {
    id: string;
    userId: string; // User who receives the notification
    senderId?: string; // User who triggered the notification (optional for system notifications)
    senderName?: string;
    senderAvatar?: string;
    type: NotificationType;
    message: string;
    propertyId?: string; // Optional related property ID
    commentId?: string; // Optional related comment ID
    isRead: boolean;
    createdAt: string;
}

export interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    error: string | null;
}