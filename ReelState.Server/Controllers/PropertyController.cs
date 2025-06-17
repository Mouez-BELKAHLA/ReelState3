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
using ReelState.Server.Models.DTOs;

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
                    .Where(p => p.Status == PropertyStatus.Approved)
                    .Include(p => p.User)
                    .Include(p => p.Photos)
                    .OrderByDescending(p => p.CreatedAt)
                    .ToListAsync();

                // Get like counts for each property
                var propertyIds = properties.Select(p => p.Id).ToList();
                var likeCounts = await _context.Likes
                    .Where(l => propertyIds.Contains(l.PropertyId))
                    .GroupBy(l => l.PropertyId)
                    .Select(g => new { PropertyId = g.Key, Count = g.Count() })
                    .ToDictionaryAsync(x => x.PropertyId, x => x.Count);

                // Get comment counts for each property
                var commentCounts = await _context.Comments
                    .Where(c => propertyIds.Contains(c.PropertyId))
                    .GroupBy(c => c.PropertyId)
                    .Select(g => new { PropertyId = g.Key, Count = g.Count() })
                    .ToDictionaryAsync(x => x.PropertyId, x => x.Count);

                // Helper method to parse JSON strings to arrays
                List<string> ParseJsonArray(string? jsonString)
                {
                    if (string.IsNullOrEmpty(jsonString))
                        return new List<string>();

                    try
                    {
                        return System.Text.Json.JsonSerializer.Deserialize<List<string>>(jsonString) ?? new List<string>();
                    }
                    catch
                    {
                        // If it's not valid JSON, try to split by comma
                        return jsonString.Split(',').Select(s => s.Trim()).Where(s => !string.IsNullOrEmpty(s)).ToList();
                    }
                }

                // Clean up circular references before serialization and include like counts + views
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
                    p.Views,
                    p.Status,
                    p.RejectionReason,
                    // Parse JSON strings to arrays
                    PropertyPreferences = ParseJsonArray(p.PropertyPreferences),
                    PropertyFeatures = ParseJsonArray(p.PropertyFeatures),
                    p.UploadToYouTube,
                    p.UploadToTikTok,
                    p.UploadToInstagram,
                    p.UploadToFacebook,
                    LikesCount = likeCounts.GetValueOrDefault(p.Id, 0),
                    CommentsCount = commentCounts.GetValueOrDefault(p.Id, 0),
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

                _logger.LogInformation("Retrieved {Count} properties with views", propertyDtos.Count);
                return Ok(propertyDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving properties");
                return StatusCode(500, new { message = $"Server error: {ex.Message}" });
            }
        }

        [HttpPost("{propertyId}/view")]
        [AllowAnonymous] // Allow anonymous users to increment views
        public async Task<IActionResult> IncrementView(string propertyId)
        {
            try
            {
                _logger.LogInformation("Incrementing view count for property {PropertyId}", propertyId);

                // Find the property first
                var property = await _context.Properties.FindAsync(propertyId);
                if (property == null)
                {
                    _logger.LogWarning("Property {PropertyId} not found", propertyId);
                    return NotFound(new { message = "Property not found", success = false });
                }

                // Increment the view count
                property.Views += 1;

                // Save changes
                var result = await _context.SaveChangesAsync();

                if (result > 0)
                {
                    _logger.LogInformation("View count incremented for property {PropertyId}. New count: {Views}", propertyId, property.Views);

                    return Ok(new
                    {
                        success = true,
                        views = property.Views,
                        propertyId = propertyId,
                        message = "View count updated successfully"
                    });
                }
                else
                {
                    _logger.LogWarning("Failed to save view count for property {PropertyId}", propertyId);
                    return StatusCode(500, new { message = "Failed to save view count", success = false });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error incrementing view count for property {PropertyId}", propertyId);
                return StatusCode(500, new { message = "Failed to increment view count", success = false });
            }
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetProperty(string id)
        {
            try
            {
                var property = await _context.Properties
                    .Include(p => p.User)
                    .Include(p => p.Photos)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (property == null)
                {
                    return NotFound(new { message = "Property not found" });
                }

                // Get like count for this property
                var likeCount = await _context.Likes.CountAsync(l => l.PropertyId == id);
                var commentCount = await _context.Comments.CountAsync(c => c.PropertyId == id);

                var propertyDto = new
                {
                    property.Id,
                    property.Title,
                    property.Caption,
                    property.Rooms,
                    property.PropertyType,
                    property.Space,
                    property.Address,
                    property.City,
                    property.Latitude,
                    property.Longitude,
                    property.VideoUrl,
                    property.UserId,
                    property.CreatedAt,
                    property.Views,
                    property.Status,
                    property.RejectionReason,
                    property.PropertyPreferences,
                    property.PropertyFeatures,
                    property.UploadToYouTube,
                    property.UploadToTikTok,
                    property.UploadToInstagram,
                    property.UploadToFacebook,
                    LikesCount = likeCount,
                    CommentsCount = commentCount,
                    User = property.User != null ? new
                    {
                        property.User.Id,
                        property.User.Email,
                        property.User.FirstName,
                        property.User.LastName,
                        property.User.ProfilePictureUrl
                    } : null,
                    Photos = property.Photos.Select(photo => new {
                        photo.Id,
                        photo.PropertyId,
                        photo.PhotoUrl,
                        photo.CreatedAt
                    }).ToList()
                };

                return Ok(propertyDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving property {PropertyId}", id);
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
                            UserId = userId,
                            Views = 0, // Initialize views to 0

                            // Add the new properties
                            PropertyPreferences = model.PropertyPreferences,
                            PropertyFeatures = model.PropertyFeatures,
                            UploadToYouTube = model.UploadToYouTube,
                            UploadToTikTok = model.UploadToTikTok,
                            UploadToInstagram = model.UploadToInstagram,
                            UploadToFacebook = model.UploadToFacebook
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

        // Add a new endpoint for search with preferences and features
        [HttpGet("search")]
        [AllowAnonymous]
        public async Task<IActionResult> SearchProperties(
            [FromQuery] string? query,
            [FromQuery] string? propertyType,
            [FromQuery] int? minRooms,
            [FromQuery] int? maxRooms,
            [FromQuery] int? minSpace,
            [FromQuery] int? maxSpace,
            [FromQuery] string? city,
            [FromQuery] string? preferences,
            [FromQuery] string? features,
            [FromQuery] string sortBy = "newest",
            [FromQuery] int page = 1,
            [FromQuery] int limit = 20)
        {
            try
            {
                _logger.LogInformation("Searching properties with query: {Query}", query);

                // Start with all approved properties
                var propertiesQuery = _context.Properties
                    .Where(p => p.Status == PropertyStatus.Approved)
                    .Include(p => p.User)
                    .Include(p => p.Photos)
                    .AsQueryable();

                // Apply text search if provided
                if (!string.IsNullOrWhiteSpace(query))
                {
                    query = query.ToLower();
                    propertiesQuery = propertiesQuery.Where(p =>
                        p.Title.ToLower().Contains(query) ||
                        p.Caption.ToLower().Contains(query) ||
                        p.Address.ToLower().Contains(query) ||
                        p.City.ToLower().Contains(query) ||
                        p.PropertyType.ToLower().Contains(query));
                }

                // Apply filters
                if (!string.IsNullOrWhiteSpace(propertyType))
                {
                    propertiesQuery = propertiesQuery.Where(p => p.PropertyType == propertyType);
                }

                if (minRooms.HasValue)
                {
                    propertiesQuery = propertiesQuery.Where(p => p.Rooms >= minRooms.Value);
                }

                if (maxRooms.HasValue)
                {
                    propertiesQuery = propertiesQuery.Where(p => p.Rooms <= maxRooms.Value);
                }

                if (minSpace.HasValue)
                {
                    propertiesQuery = propertiesQuery.Where(p => p.Space >= minSpace.Value);
                }

                if (maxSpace.HasValue)
                {
                    propertiesQuery = propertiesQuery.Where(p => p.Space <= maxSpace.Value);
                }

                if (!string.IsNullOrWhiteSpace(city))
                {
                    propertiesQuery = propertiesQuery.Where(p => p.City.ToLower().Contains(city.ToLower()));
                }

                // Filter by preferences if provided (check if JSON strings contain any of the specified preferences)
                if (!string.IsNullOrWhiteSpace(preferences))
                {
                    var preferenceList = preferences.Split(',').Select(p => p.Trim());
                    foreach (var preference in preferenceList)
                    {
                        propertiesQuery = propertiesQuery.Where(p => p.PropertyPreferences != null &&
                                                                 p.PropertyPreferences.Contains(preference));
                    }
                }

                // Filter by features if provided
                if (!string.IsNullOrWhiteSpace(features))
                {
                    var featureList = features.Split(',').Select(f => f.Trim());
                    foreach (var feature in featureList)
                    {
                        propertiesQuery = propertiesQuery.Where(p => p.PropertyFeatures != null &&
                                                                 p.PropertyFeatures.Contains(feature));
                    }
                }

                // Apply sorting
                propertiesQuery = sortBy switch
                {
                    "popular" => propertiesQuery.OrderByDescending(p => p.Views),
                    "price_asc" => propertiesQuery.OrderBy(p => p.Space), // Using space as a price proxy
                    "price_desc" => propertiesQuery.OrderByDescending(p => p.Space),
                    _ => propertiesQuery.OrderByDescending(p => p.CreatedAt) // Default is newest
                };

                // Count total matches
                var totalCount = await propertiesQuery.CountAsync();

                // Apply pagination
                var paginatedProperties = await propertiesQuery
                    .Skip((page - 1) * limit)
                    .Take(limit)
                    .ToListAsync();

                // Get like counts and comment counts
                var propertyIds = paginatedProperties.Select(p => p.Id).ToList();
                var likeCounts = await _context.Likes
                    .Where(l => propertyIds.Contains(l.PropertyId))
                    .GroupBy(l => l.PropertyId)
                    .Select(g => new { PropertyId = g.Key, Count = g.Count() })
                    .ToDictionaryAsync(x => x.PropertyId, x => x.Count);

                var commentCounts = await _context.Comments
                    .Where(c => propertyIds.Contains(c.PropertyId))
                    .GroupBy(c => c.PropertyId)
                    .Select(g => new { PropertyId = g.Key, Count = g.Count() })
                    .ToDictionaryAsync(x => x.PropertyId, x => x.Count);

                // Transform to DTOs
                var propertyDtos = paginatedProperties.Select(p => new
                {
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
                    p.Views,
                    p.PropertyPreferences,
                    p.PropertyFeatures,
                    LikesCount = likeCounts.GetValueOrDefault(p.Id, 0),
                    CommentsCount = commentCounts.GetValueOrDefault(p.Id, 0),
                    User = p.User != null ? new
                    {
                        p.User.Id,
                        p.User.FirstName,
                        p.User.LastName,
                        p.User.Email,
                        p.User.ProfilePictureUrl
                    } : null,
                    Photos = p.Photos.Select(photo => new
                    {
                        photo.Id,
                        photo.PhotoUrl
                    }).ToList()
                }).ToList();

                // Return search results with metadata
                return Ok(new
                {
                    properties = propertyDtos,
                    total = totalCount,
                    page,
                    pages = (int)Math.Ceiling((double)totalCount / limit),
                    hasMore = (page * limit) < totalCount
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching properties");
                return StatusCode(500, new { message = $"Server error: {ex.Message}" });
            }
        }
    }
}