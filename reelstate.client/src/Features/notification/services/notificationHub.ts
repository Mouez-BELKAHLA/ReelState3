import * as signalR from '@microsoft/signalr';
import { API_URL } from '../../../shared';
import { Notification } from '../types/NotificationTypes';

export function createNotificationConnection(
    getToken: () => string | null,
    onNotification: (n: Notification) => void,
    onReconnected: () => void
): signalR.HubConnection {
    const connection = new signalR.HubConnectionBuilder()
        .withUrl(`${API_URL}/hubs/notifications`, {
            // The server reads this as ?access_token=... on /hubs paths
            accessTokenFactory: () => getToken() ?? ''
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Warning)
        .build();

    connection.on('ReceiveNotification', (n: Notification) => onNotification(n));
    // Anything pushed while we were offline is missed, so reload from REST
    connection.onreconnected(() => onReconnected());

    return connection;
}