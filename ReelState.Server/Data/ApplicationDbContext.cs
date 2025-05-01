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
        // Add this to your existing ApplicationDbContext
        public DbSet<Like> Likes { get; set; }
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

        }
    }
}