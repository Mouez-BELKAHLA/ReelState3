using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;

namespace ReelState.Server.Models.DTOs
{
    public class PropertyOwnerDto
    {
        public string Id { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? ProfilePictureUrl { get; set; }
    }

    public class PropertyPhotoDto
    {
        public string Id { get; set; } = string.Empty;
        public string PhotoUrl { get; set; } = string.Empty;
    }

    public class PropertySearchItemDto
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Caption { get; set; } = string.Empty;
        public int Rooms { get; set; }
        public string PropertyType { get; set; } = string.Empty;
        public int Space { get; set; }
        public string Address { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string VideoUrl { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public int Views { get; set; }
        public PropertyStatus Status { get; set; }
        public string? PropertyPreferences { get; set; }
        public string? PropertyFeatures { get; set; }
        public PropertyOwnerDto? User { get; set; }
        public List<PropertyPhotoDto> Photos { get; set; } = new List<PropertyPhotoDto>();

        // Translated to SQL by EF Core: only these columns are read from the database.
        public static readonly Expression<Func<Property, PropertySearchItemDto>> Projection = p => new PropertySearchItemDto
        {
            Id = p.Id,
            Title = p.Title,
            Caption = p.Caption,
            Rooms = p.Rooms,
            PropertyType = p.PropertyType,
            Space = p.Space,
            Address = p.Address,
            City = p.City,
            Latitude = p.Latitude,
            Longitude = p.Longitude,
            VideoUrl = p.VideoUrl,
            UserId = p.UserId,
            CreatedAt = p.CreatedAt,
            Views = p.Views,
            Status = p.Status,
            PropertyPreferences = p.PropertyPreferences,
            PropertyFeatures = p.PropertyFeatures,
            User = p.User == null ? null : new PropertyOwnerDto
            {
                Id = p.User.Id,
                FirstName = p.User.FirstName,
                LastName = p.User.LastName,
                ProfilePictureUrl = p.User.ProfilePictureUrl
            },
            Photos = p.Photos.Select(ph => new PropertyPhotoDto { Id = ph.Id, PhotoUrl = ph.PhotoUrl }).ToList()
        };
    }
}