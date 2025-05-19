import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import NotificationService from '../../Features/notification/services/NotificationService';
import { Notification, NotificationState } from '../../Features/notification/types/NotificationTypes';

// Initial state
const initialState: NotificationState = {
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null
};
export const refreshNotifications = createAsyncThunk(
    'notifications/refreshNotifications',
    async (_, { getState, rejectWithValue }) => {
        try {
            const { auth } = getState() as { auth: { token: string } };
            if (!auth.token) return rejectWithValue('Authentication required');

            const notifications = await NotificationService.getNotifications(auth.token);
            return notifications;
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to refresh notifications');
        }
    }
);
// Async thunks
export const fetchNotifications = createAsyncThunk(
    'notifications/fetchNotifications',
    async (_, { getState, rejectWithValue }) => {
        try {
            const { auth } = getState() as { auth: { token: string } };
            if (!auth.token) return rejectWithValue('Authentication required');

            const notifications = await NotificationService.getNotifications(auth.token);
            return notifications;
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to fetch notifications');
        }
    }
);

export const markNotificationAsRead = createAsyncThunk(
    'notifications/markAsRead',
    async (notificationId: string, { getState, rejectWithValue }) => {
        try {
            const { auth } = getState() as { auth: { token: string } };
            if (!auth.token) return rejectWithValue('Authentication required');

            await NotificationService.markAsRead(notificationId, auth.token);
            return notificationId;
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to mark notification as read');
        }
    }
);

export const markAllNotificationsAsRead = createAsyncThunk(
    'notifications/markAllAsRead',
    async (_, { getState, rejectWithValue }) => {
        try {
            const { auth } = getState() as { auth: { token: string } };
            if (!auth.token) return rejectWithValue('Authentication required');

            await NotificationService.markAllAsRead(auth.token);
            return true;
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to mark all notifications as read');
        }
    }
);

export const deleteNotification = createAsyncThunk(
    'notifications/deleteNotification',
    async (notificationId: string, { getState, rejectWithValue }) => {
        try {
            const { auth } = getState() as { auth: { token: string } };
            if (!auth.token) return rejectWithValue('Authentication required');

            await NotificationService.deleteNotification(notificationId, auth.token);
            return notificationId;
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to delete notification');
        }
    }
);

// Create slice
const notificationSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        addNotification: (state, action: PayloadAction<Notification>) => {
            state.notifications.unshift(action.payload);
            if (!action.payload.isRead) {
                state.unreadCount += 1;
            }
        },
        clearNotifications: (state) => {
            state.notifications = [];
            state.unreadCount = 0;
        },
        resetNotificationState: () => initialState
    },
    extraReducers: (builder) => {
        builder
            // Fetch notifications
            .addCase(fetchNotifications.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                state.isLoading = false;
                state.notifications = action.payload;
                state.unreadCount = action.payload.filter(n => !n.isRead).length;
            })
            .addCase(fetchNotifications.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            // Mark as read
            .addCase(markNotificationAsRead.fulfilled, (state, action) => {
                const notification = state.notifications.find(n => n.id === action.payload);
                if (notification && !notification.isRead) {
                    notification.isRead = true;
                    state.unreadCount -= 1;
                }
            })

            // Mark all as read
            .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
                state.notifications.forEach(notification => {
                    notification.isRead = true;
                });
                state.unreadCount = 0;
            })

            // Delete notification
            .addCase(deleteNotification.fulfilled, (state, action) => {
                const index = state.notifications.findIndex(n => n.id === action.payload);
                if (index !== -1) {
                    const wasUnread = !state.notifications[index].isRead;
                    state.notifications.splice(index, 1);
                    if (wasUnread) {
                        state.unreadCount -= 1;
                    }
                }
            });
    }
});

export const { addNotification, clearNotifications, resetNotificationState } = notificationSlice.actions;
export default notificationSlice.reducer;