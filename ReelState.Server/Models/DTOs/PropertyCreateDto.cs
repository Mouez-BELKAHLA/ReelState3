using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace ReelState.Server.Models.DTOs
{
    public class PropertyCreateDto
    {
        [Required]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Caption { get; set; } = string.Empty;

        public int Rooms { get; set; } = 2;

        [Required]
        public string PropertyType { get; set; } = "apartment";

        public int Space { get; set; } = 75;

        public string? Address { get; set; }

        public string? City { get; set; }

        public double Latitude { get; set; }

        public double Longitude { get; set; }

        public IFormFile? VideoFile { get; set; }

        public List<IFormFile>? PhotoFiles { get; set; }
    }
}