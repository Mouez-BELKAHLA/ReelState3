using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ReelState.Data;
using ReelState.Server.Models;
using ReelState.Server.Models.DTOs;  // Add this namespace reference

namespace ReelState.Server.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    [RequestFormLimits(MultipartBodyLengthLimit = 104857600)] // 100 MB limit
    [RequestSizeLimit(104857600)] // 100 MB limit
    public class PropertyController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;
        private readonly ILogger<PropertyController> _logger;

        public PropertyController(
            ApplicationDbContext context,
            IWebHostEnvironment env,
            ILogger<PropertyController> logger)
        {
            _context = context;
            _env = env;
            _logger = logger;
        }
        

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetProperties()
        {
            try
            {
                _logger.LogInformation("Fetching all properties");

                var properties = await _context.Properties
                    .Where(p => p.Status == PropertyStatus.Approved) // Only return approved properties
                    .Include(p => p.User)
                    .Include(p => p.Photos)
                    .OrderByDescending(p => p.CreatedAt)
                    .ToListAsync();

                // Clean up circular references before serialization
                var propertyDtos = properties.Select(p => new {
                    p.Id,
                    p.Title,
                    p.Caption,
                    p.Rooms,
                    p.PropertyType,
                    p.Space,
                    p.Address,
                    p.City,
                    p.Latitude,
                    p.Longitude,
                    p.VideoUrl,
                    p.UserId,
                    p.CreatedAt,
                    User = p.User != null ? new
                    {
                        p.User.Id,
                        p.User.Email,
                        p.User.FirstName,
                        p.User.LastName,
                        p.User.ProfilePictureUrl
                    } : null,
                    Photos = p.Photos.Select(photo => new {
                        photo.Id,
                        photo.PropertyId,
                        photo.PhotoUrl,
                        photo.CreatedAt
                    }).ToList()
                }).ToList();

                return Ok(propertyDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving properties");
                return StatusCode(500, new { message = $"Server error: {ex.Message}" });
            }
        }
        [HttpPost("create")]
        public async Task<IActionResult> CreateProperty([FromForm] PropertyCreateDto model)
        {
            try
            {
                _logger.LogInformation("Creating property with title: {Title}", model.Title);

                // Get user ID from token
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                {
                    return BadRequest(new { isSuccess = false, message = "User ID not found" });
                }

                // Validate video file size
                if (model.VideoFile == null)
                {
                    return BadRequest(new { isSuccess = false, message = "Video file is required" });
                }

                if (model.VideoFile.Length > 52428800) // 50MB limit
                {
                    return BadRequest(new { isSuccess = false, message = "Video file size exceeds the 50MB limit" });
                }

                // Check if user exists
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    _logger.LogError("User with ID {UserId} not found", userId);
                    return BadRequest(new { isSuccess = false, message = "User not found" });
                }

                // Save video file
                string videoFileName;
                try
                {
                    videoFileName = await SaveFileAsync(model.VideoFile, "videos");
                    _logger.LogInformation("Video file saved successfully: {FileName}", videoFileName);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error saving video file");
                    return StatusCode(500, new { isSuccess = false, message = $"Error saving video file: {ex.Message}" });
                }

                // Save photo files with validation
                List<string> photoFileNames = new List<string>();
                if (model.PhotoFiles != null && model.PhotoFiles.Count > 0)
                {
                    // Limit the number of photos
                    if (model.PhotoFiles.Count > 5)
                    {
                        return BadRequest(new { isSuccess = false, message = "Maximum 5 photos allowed" });
                    }

                    foreach (var photo in model.PhotoFiles)
                    {
                        // Check file size
                        if (photo.Length > 3145728) // 3MB limit
                        {
                            return BadRequest(new { isSuccess = false, message = "Each photo must be less than 3MB" });
                        }

                        // Check file type
                        var extension = Path.GetExtension(photo.FileName).ToLower();
                        if (extension != ".jpg" && extension != ".jpeg" && extension != ".png" && extension != ".gif")
                        {
                            return BadRequest(new { isSuccess = false, message = "Photos must be JPG, PNG or GIF format" });
                        }

                        try
                        {
                            string photoFileName = await SaveFileAsync(photo, "photos");
                            photoFileNames.Add(photoFileName);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Error saving photo file");
                            return StatusCode(500, new { isSuccess = false, message = $"Error saving photo file: {ex.Message}" });
                        }
                    }
                }

                // Create property record with transaction
                using (var transaction = await _context.Database.BeginTransactionAsync())
                {
                    try
                    {
                        var property = new Property
                        {
                            Title = model.Title,
                            Caption = model.Caption,
                            Rooms = model.Rooms,
                            PropertyType = model.PropertyType,
                            Space = model.Space,
                            Address = model.Address ?? string.Empty,
                            City = model.City ?? string.Empty,
                            Latitude = model.Latitude,
                            Longitude = model.Longitude,
                            VideoUrl = videoFileName,
                            UserId = userId
                        };

                        _logger.LogInformation("Saving property to database: {PropertyId}", property.Id);
                        await _context.Properties.AddAsync(property);
                        await _context.SaveChangesAsync();

                        // Add photos to database
                        foreach (var photoFileName in photoFileNames)
                        {
                            var propertyPhoto = new PropertyPhoto
                            {
                                PropertyId = property.Id,
                                PhotoUrl = photoFileName
                            };
                            await _context.PropertyPhotos.AddAsync(propertyPhoto);
                        }
                        await _context.SaveChangesAsync();

                        // Commit transaction
                        await transaction.CommitAsync();

                        _logger.LogInformation("Property created successfully: {PropertyId}", property.Id);
                        return Ok(new { isSuccess = true, propertyId = property.Id, message = "Property created successfully" });
                    }
                    catch (Exception ex)
                    {
                        // Rollback transaction on error
                        await transaction.RollbackAsync();

                        _logger.LogError(ex, "Database error while creating property");

                        // Log the full exception details including inner exceptions
                        var currentEx = ex;
                        int level = 0;
                        while (currentEx != null)
                        {
                            _logger.LogError("Exception level {Level}: {Message}", level++, currentEx.Message);
                            currentEx = currentEx.InnerException;
                        }

                        return StatusCode(500, new { isSuccess = false, message = $"Database error: {ex.Message}" });
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled exception in CreateProperty");
                return StatusCode(500, new { isSuccess = false, message = $"Server error: {ex.Message}" });
            }
        }

        private async Task<string> SaveFileAsync(IFormFile file, string folder)
        {
            try
            {
                if (file == null)
                    return string.Empty;

                // Generate unique filename
                string fileName = $"{Guid.NewGuid()}_{Path.GetFileNameWithoutExtension(file.FileName)}_{DateTime.Now.Ticks}{Path.GetExtension(file.FileName)}";
                fileName = fileName.Replace(" ", "_"); // Replace spaces with underscores

                // Use ContentRootPath instead of WebRootPath
                string folderPath = Path.Combine(_env.ContentRootPath, "uploads", folder);
                if (!Directory.Exists(folderPath))
                {
                    Directory.CreateDirectory(folderPath);
                }

                // Save file
                string filePath = Path.Combine(folderPath, fileName);
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                _logger.LogInformation("File saved successfully: {FilePath}", filePath);

                // Return relative path
                return $"/uploads/{folder}/{fileName}";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving file");
                throw; // Rethrow to handle in the calling method
            }
        }
    }
}