using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ReelState.Data;
using ReelState.Server.Models;
using Microsoft.AspNetCore.SignalR;
using ReelState.Server.Hubs;
using ReelState.Server.Models.DTOs;

namespace ReelState.Server.Services
{
    public class NotificationService
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<NotificationHub> _hub;

        public NotificationService(ApplicationDbContext context, IHubContext<NotificationHub> hub)
        {
            _context = context;
            _hub = hub;
        }

        // Real-time push. Failures are swallowed: the notification is already saved in the DB.
        private async Task PushAsync(Notification n, string? senderName)
        {
            try
            {
                var dto = new NotificationDTO
                {
                    Id = n.Id,
                    UserId = n.UserId,
                    SenderId = n.SenderId,
                    SenderName = senderName,
                    Type = n.Type,
                    Message = n.Message,
                    PropertyId = n.PropertyId,
                    CommentId = n.CommentId,
                    IsRead = false,
                    CreatedAt = n.CreatedAt
                };
                await _hub.Clients.User(n.UserId).SendAsync("ReceiveNotification", dto);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error pushing notification: {ex.Message}");
            }
        }

        // For likes on properties
        public async Task CreatePropertyLikeNotification(string propertyId, string likerId)
        {
            var property = await _context.Properties
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.Id == propertyId);

            if (property == null || property.UserId == likerId)
                return;

            var liker = await _context.Users.FindAsync(likerId);
            if (liker == null) return;

            var likerName = $"{liker.FirstName} {liker.LastName}";

            var notification = new Notification
            {
                UserId = property.UserId,
                SenderId = likerId,
                Type = "like",
                Message = $"{likerName} liked your property listing",
                PropertyId = propertyId,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();
            await PushAsync(notification, likerName);
        }

        // For likes on comments
        public async Task CreateCommentLikeNotification(string commentId, string likerId)
        {
            var comment = await _context.Comments
                .Include(c => c.User)
                .Include(c => c.Property)
                .FirstOrDefaultAsync(c => c.Id == commentId);

            if (comment == null || comment.UserId == likerId)
                return;

            var liker = await _context.Users.FindAsync(likerId);
            if (liker == null) return;

            var likerName = $"{liker.FirstName} {liker.LastName}";

            var notification = new Notification
            {
                UserId = comment.UserId,
                SenderId = likerId,
                Type = "comment_like",
                Message = $"{likerName} liked your comment",
                PropertyId = comment.PropertyId,
                CommentId = commentId,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();
            await PushAsync(notification, likerName);
        }

        // For new comments on properties
        public async Task CreateNewCommentNotification(string propertyId, string commentId, string commenterId)
        {
            var property = await _context.Properties
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.Id == propertyId);

            if (property == null || property.UserId == commenterId)
                return;

            var commenter = await _context.Users.FindAsync(commenterId);
            if (commenter == null) return;

            var commenterName = $"{commenter.FirstName} {commenter.LastName}";

            var notification = new Notification
            {
                UserId = property.UserId,
                SenderId = commenterId,
                Type = "comment",
                Message = $"{commenterName} commented on your property",
                PropertyId = propertyId,
                CommentId = commentId,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();
            await PushAsync(notification, commenterName);
        }

        // For follows
        public async Task CreateFollowNotification(string followedUserId, string followerId)
        {
            try
            {
                Console.WriteLine($"Creating follow notification: {followerId} followed {followedUserId}");

                if (followedUserId == followerId)
                {
                    Console.WriteLine("Skipping notification - user tried to follow themselves");
                    return;
                }

                var follower = await _context.Users.FindAsync(followerId);
                if (follower == null)
                {
                    Console.WriteLine($"Follower user not found: {followerId}");
                    return;
                }

                var followerName = $"{follower.FirstName} {follower.LastName}".Trim();
                if (string.IsNullOrEmpty(followerName))
                    followerName = follower.UserName ?? "Someone";

                var notification = new Notification
                {
                    UserId = followedUserId,
                    SenderId = followerId,
                    Type = "follow",
                    Message = $"{followerName} started following you",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };

                await _context.Notifications.AddAsync(notification);
                await _context.SaveChangesAsync();
                await PushAsync(notification, followerName);
                Console.WriteLine($"Created follow notification with ID: {notification.Id}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error creating follow notification: {ex.Message}");
            }
        }
    }
}