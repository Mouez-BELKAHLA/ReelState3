import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Notification, NotificationType } from '../types/NotificationTypes';
import { useAppDispatch } from '../../../store/hooks';
import { markNotificationAsRead, deleteNotification } from '../../../store/slices/notificationSlice';
import { formatDistanceToNow } from 'date-fns';

interface NotificationItemProps {
    notification: Notification;
    onClose?: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClose }) => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const handleClick = () => {
        if (!notification.isRead) {
            dispatch(markNotificationAsRead(notification.id));
        }

        // Navigate based on notification type
        if (notification.propertyId) {
            if (notification.type === NotificationType.COMMENT) {
                navigate(`/feed?property=${notification.propertyId}&showComments=true`);
            } else {
                navigate(`/feed?property=${notification.propertyId}`);
            }
        } else if (notification.type === NotificationType.FOLLOW) {
            navigate(`/profile/${notification.senderId}`);
        }

        if (onClose) onClose();
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        dispatch(deleteNotification(notification.id));
    };

    // Get appropriate icon for notification type
    const getNotificationIcon = () => {
        switch (notification.type) {
            case NotificationType.LIKE:
                return (
                    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
                        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                    </div>
                );
            case NotificationType.COMMENT:
                return (
                    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                        </svg>
                    </div>
                );
            case NotificationType.FOLLOW:
                return (
                    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                        </svg>
                    </div>
                );
            case NotificationType.PROPERTY_VIEW:
                return (
                    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full">
                        <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                );
            default:
                return (
                    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                        <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                );
        }
    };

    return (
        <div
            onClick={handleClick}
            className={`flex items-start p-4 ${notification.isRead ? 'bg-white' : 'bg-blue-50'} hover:bg-gray-50 cursor-pointer border-b border-gray-100`}
        >
            {notification.senderAvatar ? (
                <img
                    src={notification.senderAvatar}
                    alt={notification.senderName || 'User'}
                    className="flex-shrink-0 w-8 h-8 rounded-full object-cover mr-3"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2NjYyI+PHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgM2MyLjY3IDAgOC0xLjM0IDggNHYyYzAgMi42Ny01LjMzIDQtOCA0cy04LTEuMzMtOC00VjljMC0yLjY2IDUuMzMtNCA4LTR6bTAgMTAuOThjNy42NCAwIDkuMzktMy4zOCA5LjQtMy45OFYxNWMwIC42Ny0zLjEzIDQtOS40IDQtNi4yOCAwLTkuNC0zLjMzLTkuNC00di0yLjk4YzAtLjA3IDEuNzYgMy45OCA5LjQgMy45OHoiLz48L3N2Zz4=";
                    }}
                />
            ) : (
                getNotificationIcon()
            )}

            <div className="flex-1 min-w-0">
                <p className={`text-sm ${notification.isRead ? 'text-gray-700' : 'text-gray-900 font-medium'}`}>
                    {notification.message}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </p>
            </div>

            <button
                onClick={handleDelete}
                className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Remove this notification"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};

export default NotificationItem;