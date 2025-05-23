import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { fetchNotifications } from '../../../store/slices/notificationSlice';

interface NotificationBadgeProps {
    onClick: () => void;
    small?: boolean;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ onClick, small = false }) => {
    const dispatch = useAppDispatch();
    const { unreadCount, isLoading, notifications } = useAppSelector(state => state.notifications);
    // Get the latest unread notification for the tooltip
    const latestUnread = notifications.find(n => !n.isRead);
    const tooltipText = latestUnread
        ? `${latestUnread.message}`
        : "No new notifications";

    const { isAuthenticated } = useAppSelector(state => state.auth);

    useEffect(() => {
        if (isAuthenticated) {
            dispatch(fetchNotifications());

            // Refresh notifications every 2 minutes
            const interval = setInterval(() => {
                dispatch(fetchNotifications());
            }, 120000);

            return () => clearInterval(interval);
        }
    }, [dispatch, isAuthenticated]);

    return (
        <button
            onClick={onClick}
            className={`relative inline-flex items-center ${small ? 'p-1' : 'p-2'} text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-full`}
            aria-label="Notifications"
            title={tooltipText}
        >
            <svg className={`${small ? 'w-5 h-5' : 'w-6 h-6'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
            </svg>

            {/* Enhanced notification badge with animation for new notifications */}
            {unreadCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/3 -translate-y-1/3 bg-red-600 rounded-full animate-pulse-short">
                    {unreadCount > 99 ? '99+' : unreadCount}
                </span>
            )}

            {isLoading && (
                <span className="absolute top-0 right-0 block w-2 h-2 transform translate-x-1/2 -translate-y-1/2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
            )}
        </button>
    );
};

export default NotificationBadge;