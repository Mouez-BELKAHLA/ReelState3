using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace ReelState.Server.Hubs;

// Clients connect here; the server pushes "ReceiveNotification" to a specific user.
[Authorize]
public class NotificationHub : Hub
{
}