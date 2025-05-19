using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ReelState.Server.Models;

namespace ReelState.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Property> Properties { get; set; }
        public DbSet<PropertyPhoto> PropertyPhotos { get; set; }
        public DbSet<Comment> Comments { get; set; }
        public DbSet<Like> Likes { get; set; }
        public DbSet<CommentLike> CommentLikes { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<UserFollow> UserFollows { get; set; } // Add this line

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Configure Property entity
            builder.Entity<Property>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired();
                entity.Property(e => e.Caption).IsRequired();
                entity.Property(e => e.PropertyType).IsRequired();
                entity.Property(e => e.VideoUrl).IsRequired();
                entity.Property(e => e.UserId).IsRequired();

                // Configure relationship with User
                entity.HasOne(e => e.User)
                      .WithMany()
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.Restrict);

                // Configure relationship with PropertyPhotos
                entity.HasMany(e => e.Photos)
                      .WithOne(e => e.Property)
                      .HasForeignKey(e => e.PropertyId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure PropertyPhoto entity
            builder.Entity<PropertyPhoto>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.PhotoUrl).IsRequired();
                entity.Property(e => e.PropertyId).IsRequired();
            });

            // Configure Comment entity
            builder.Entity<Comment>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.PropertyId).IsRequired();
                entity.Property(e => e.UserId).IsRequired();
                entity.Property(e => e.Text).IsRequired().HasMaxLength(1000);
                entity.Property(e => e.CreatedAt).IsRequired();

                // Configure relationship with Property
                entity.HasOne(e => e.Property)
                      .WithMany()
                      .HasForeignKey(e => e.PropertyId)
                      .OnDelete(DeleteBehavior.Cascade);

                // Configure relationship with User
                entity.HasOne(e => e.User)
                      .WithMany()
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure Like entity
            builder.Entity<Like>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.PropertyId).IsRequired();
                entity.Property(e => e.UserId).IsRequired();

                // Create a unique index to prevent duplicate likes
                entity.HasIndex(e => new { e.PropertyId, e.UserId })
                      .IsUnique();

                // Configure relationship with Property
                entity.HasOne(e => e.Property)
                      .WithMany()
                      .HasForeignKey(e => e.PropertyId)
                      .OnDelete(DeleteBehavior.Cascade);

                // Configure relationship with User
                entity.HasOne(e => e.User)
                      .WithMany()
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure CommentLike entity
            builder.Entity<CommentLike>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.CommentId).IsRequired();
                entity.Property(e => e.UserId).IsRequired();

                // Create a unique index to prevent duplicate likes
                entity.HasIndex(e => new { e.CommentId, e.UserId })
                      .IsUnique();

                // Configure relationship with Comment
                entity.HasOne(e => e.Comment)
                      .WithMany(c => c.Likes)
                      .HasForeignKey(e => e.CommentId)
                      .OnDelete(DeleteBehavior.Cascade);

                // Configure relationship with User
                entity.HasOne(e => e.User)
                      .WithMany()
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure Notification entity
            builder.Entity<Notification>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.UserId).IsRequired();
                entity.Property(e => e.Type).IsRequired();
                entity.Property(e => e.Message).IsRequired();
                entity.Property(e => e.CreatedAt).IsRequired();

                // Configure relationship with receiving User
                entity.HasOne(e => e.User)
                      .WithMany()
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.Restrict);

                // Configure relationship with sending User (optional)
                entity.HasOne(e => e.Sender)
                      .WithMany()
                      .HasForeignKey(e => e.SenderId)
                      .OnDelete(DeleteBehavior.Restrict)
                      .IsRequired(false);

                // Configure relationship with Property (optional)
                entity.HasOne(e => e.Property)
                      .WithMany()
                      .HasForeignKey(e => e.PropertyId)
                      .OnDelete(DeleteBehavior.Restrict)
                      .IsRequired(false);

                // Configure relationship with Comment (optional)
                entity.HasOne(e => e.Comment)
                      .WithMany()
                      .HasForeignKey(e => e.CommentId)
                      .OnDelete(DeleteBehavior.Restrict)
                      .IsRequired(false);
            });
            builder.Entity<UserFollow>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.FollowerId).IsRequired();
                entity.Property(e => e.FollowedId).IsRequired();
                entity.Property(e => e.CreatedAt).IsRequired();

                // Create a unique index to prevent duplicate follows
                entity.HasIndex(e => new { e.FollowerId, e.FollowedId })
                      .IsUnique();

                // Configure relationship with Follower
                entity.HasOne(e => e.Follower)
                      .WithMany()
                      .HasForeignKey(e => e.FollowerId)
                      .OnDelete(DeleteBehavior.Restrict);

                // Configure relationship with Followed
                entity.HasOne(e => e.Followed)
                      .WithMany()
                      .HasForeignKey(e => e.FollowedId)
                      .OnDelete(DeleteBehavior.Restrict);
            });
        }
    }
}