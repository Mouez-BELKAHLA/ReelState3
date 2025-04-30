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
        }
    }
}