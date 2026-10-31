import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { HubConnectionState } from '@microsoft/signalr';
import { createNotificationConnection } from '../services/notificationHub';
import { addNotification, fetchNotifications } from '../../../store/slices/notificationSlice';

// Renders nothing. Opens one SignalR connection while the user is logged in.
const NotificationHubConnector = () => {
    const dispatch = useDispatch<any>();
    const token = useSelector((state: { auth: { token: string | null } }) => state.auth.token);
    const tokenRef = useRef<string | null>(token);
    tokenRef.current = token; // always the latest token, without reconnecting on refresh

    const loggedIn = !!token;

    useEffect(() => {
        if (!loggedIn) return;

        const connection = createNotificationConnection(
            () => tokenRef.current,
            (n) => dispatch(addNotification(n)),
            () => dispatch(fetchNotifications())
        );

        connection.start().catch((err) => console.warn('Notification hub unavailable', err));

        return () => {
            if (connection.state !== HubConnectionState.Disconnected) {
                connection.stop();
            }
        };
    }, [loggedIn, dispatch]);

    return null;
};

export default NotificationHubConnector;