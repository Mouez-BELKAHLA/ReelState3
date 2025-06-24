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

        // Helper method to parse JSON arrays for searching
        private List<string> ParseJsonArrayForSearch(string? jsonString)
        {
            if (string.IsNullOrEmpty(jsonString))
                return new List<string>();

            try
            {
                // Try to parse as JSON array
                return System.Text.Json.JsonSerializer.Deserialize<List<string>>(jsonString) ?? new List<string>();
            }
            catch
            {
                // Fallback to simple comma-separated handling
                return jsonString.Split(',').Select(s => s.Trim()).Where(s => !string.IsNullOrEmpty(s)).ToList();
            }
        }

        // New debug endpoint specifically for garden searches
       
        
        
        [HttpGet("search")]
        [AllowAnonymous]
        public async Task<ActionResult<SearchResponse>> SearchProperties(
            [FromQuery] string? q = null,
            [FromQuery] string? propertyType = null,
            [FromQuery] int? minRooms = null,
            [FromQuery] int? maxRooms = null,
            [FromQuery] int? minSpace = null,
            [FromQuery] int? maxSpace = null,
            [FromQuery] string? city = null,
            [FromQuery] string? sortBy = "newest",
            [FromQuery] string? preferences = null,
            [FromQuery] string? features = null,
            [FromQuery] int page = 1,
            [FromQuery] int limit = 20)
        {
            try
            {
                _logger.LogInformation("Search request received with query: {Query}, filters: {Filters}",
                    q, new { propertyType, minRooms, maxRooms, minSpace, maxSpace, city, sortBy, preferences, features, page, limit });

                // Log specifically for AI debugging
                if (!string.IsNullOrEmpty(features) && features.Contains("garden", StringComparison.OrdinalIgnoreCase))
                {
                    _logger.LogInformation("Garden search detected: features={Features}", features);
                }

                var query = _context.Properties
                    .Where(p => p.Status == PropertyStatus.Approved)
                    .Include(p => p.User)
                    .Include(p => p.Photos)
                    .AsQueryable();

                // Apply text search filter (q parameter)
                if (!string.IsNullOrEmpty(q))
                {
                    var searchTerm = q.ToLower();
                    query = query.Where(p =>
                        p.Title.ToLower().Contains(searchTerm) ||
                        p.Caption.ToLower().Contains(searchTerm) ||
                        p.City.ToLower().Contains(searchTerm) ||
                        p.Address.ToLower().Contains(searchTerm) ||
                        p.PropertyType.ToLower().Contains(searchTerm));
                }

                // Apply filters
                if (!string.IsNullOrEmpty(propertyType))
                    query = query.Where(p => p.PropertyType.ToLower() == propertyType.ToLower());

                if (minRooms.HasValue)
                    query = query.Where(p => p.Rooms >= minRooms.Value);

                if (maxRooms.HasValue)
                    query = query.Where(p => p.Rooms <= maxRooms.Value);

                if (minSpace.HasValue)
                    query = query.Where(p => p.Space >= minSpace.Value);

                if (maxSpace.HasValue)
                    query = query.Where(p => p.Space <= maxSpace.Value);

                if (!string.IsNullOrEmpty(city))
                    query = query.Where(p => p.City.ToLower().Contains(city.ToLower()) ||
                                            p.Address.ToLower().Contains(city.ToLower()));

                // Handle preferences filter - improved for case-insensitivity
                if (!string.IsNullOrEmpty(preferences))
                {
                    var preferenceList = preferences.Split(',').Select(p => p.Trim()).ToList();

                    // Special handling for garden in preferences
                    if (preferenceList.Any(p => p.Equals("garden", StringComparison.OrdinalIgnoreCase)))
                    {
                        _logger.LogInformation("Garden found in preferences, adding special handling");

                        // Get all properties with proper JSON parsing
                        var allProperties = await query.ToListAsync();

                        // Filter using JSON deserialization
                        var filteredProperties = allProperties.Where(p => {
                            // Check if property features contain garden
                            bool hasGarden = false;
                            if (!string.IsNullOrEmpty(p.PropertyFeatures))
                            {
                                try
                                {
                                    var features = System.Text.Json.JsonSerializer.Deserialize<List<string>>(p.PropertyFeatures);
                                    hasGarden = features != null && features.Any(f => f.Equals("Garden", StringComparison.OrdinalIgnoreCase));
                                }
                                catch
                                {
                                    hasGarden = p.PropertyFeatures.Contains("Garden") || p.PropertyFeatures.Contains("garden");
                                }
                            }

                            // Check preferences
                            bool matchesPreferences = false;
                            if (!string.IsNullOrEmpty(p.PropertyPreferences))
                            {
                                try
                                {
                                    var prefs = System.Text.Json.JsonSerializer.Deserialize<List<string>>(p.PropertyPreferences);
                                    matchesPreferences = prefs != null && preferenceList.Any(searchPref =>
                                        prefs.Any(pref => pref.Contains(searchPref, StringComparison.OrdinalIgnoreCase)));
                                }
                                catch
                                {
                                    matchesPreferences = preferenceList.Any(searchPref =>
                                        p.PropertyPreferences.Contains(searchPref, StringComparison.OrdinalIgnoreCase));
                                }
                            }

                            // Return true if either condition is met
                            return hasGarden || matchesPreferences;
                        }).ToList();

                        // Keep only filtered properties IDs
                        var filteredIds = filteredProperties.Select(p => p.Id).ToList();
                        query = query.Where(p => filteredIds.Contains(p.Id));
                    }
                    else
                    {
                        // Regular preference handling without garden
                        // Get all properties to filter in memory with proper JSON handling
                        var allProperties = await query.ToListAsync();
                        var filteredProperties = allProperties.Where(p => {
                            if (string.IsNullOrEmpty(p.PropertyPreferences))
                                return false;

                            try
                            {
                                // Parse JSON and do case-insensitive comparison
                                var propPrefs = ParseJsonArrayForSearch(p.PropertyPreferences)
                                    .Select(pref => pref.ToLowerInvariant())
                                    .ToList();

                                return preferenceList.Any(searchPref =>
                                    propPrefs.Any(pref => pref.Contains(searchPref.ToLowerInvariant())));
                            }
                            catch
                            {
                                // If JSON parsing fails, do simple string contains
                                return preferenceList.Any(searchPref =>
                                    p.PropertyPreferences.Contains(searchPref, StringComparison.OrdinalIgnoreCase));
                            }
                        }).ToList();

                        // Keep only filtered properties IDs
                        var filteredIds = filteredProperties.Select(p => p.Id).ToList();
                        query = query.Where(p => filteredIds.Contains(p.Id));
                    }
                }

                // Handle features filter - improved for case-insensitivity and proper JSON handling
                if (!string.IsNullOrEmpty(features))
                {
                    var featureList = features.Split(',').Select(f => f.Trim()).ToList();
                    _logger.LogInformation("Searching for features: {Features}", string.Join(", ", featureList));

                    // Special handling for garden in features
                    if (featureList.Any(f => f.Equals("garden", StringComparison.OrdinalIgnoreCase) || f.Equals("Garden")))
                    {
                        _logger.LogInformation("GARDEN DEBUG - JSON-aware garden search");

                        // Get all properties first
                        var allProperties = await query.ToListAsync();

                        // Then filter them using proper JSON deserialization
                        var gardenProperties = allProperties.Where(p => {
                            if (string.IsNullOrEmpty(p.PropertyFeatures))
                                return false;

                            try
                            {
                                // This is the key part - properly deserialize the JSON
                                var features = System.Text.Json.JsonSerializer.Deserialize<List<string>>(p.PropertyFeatures);
                                return features != null &&
                                      features.Any(f => f.Equals("Garden", StringComparison.OrdinalIgnoreCase));
                            }
                            catch (Exception ex)
                            {
                                _logger.LogError(ex, "Error parsing PropertyFeatures JSON: {Features}", p.PropertyFeatures);
                                // Fallback to string contains
                                return p.PropertyFeatures.Contains("\"Garden\"") ||
                                       p.PropertyFeatures.Contains("\"garden\"");
                            }
                        }).ToList();

                        _logger.LogInformation("GARDEN DEBUG - Found {Count} properties with Garden", gardenProperties.Count);

                        // Use these properties for the result
                        var filteredIds = gardenProperties.Select(p => p.Id).ToList();
                        query = query.Where(p => filteredIds.Contains(p.Id));
                    }
                    else
                    {
                        // Regular feature handling for non-garden features
                        // Get all properties to filter in memory with proper JSON handling
                        var allProperties = await query.ToListAsync();
                        var filteredProperties = allProperties.Where(p => {
                            if (string.IsNullOrEmpty(p.PropertyFeatures))
                                return false;

                            try
                            {
                                // Parse JSON and do case-insensitive comparison
                                var propFeatures = ParseJsonArrayForSearch(p.PropertyFeatures)
                                    .Select(feat => feat.ToLowerInvariant())
                                    .ToList();

                                var result = featureList.Any(searchFeat =>
                                    propFeatures.Any(feat => feat.Contains(searchFeat.ToLowerInvariant())));

                                return result;
                            }
                            catch (Exception ex)
                            {
                                // Log parsing errors
                                _logger.LogWarning(ex, "Failed to parse features JSON: {Features}", p.PropertyFeatures);

                                // If JSON parsing fails, do simple string contains
                                return featureList.Any(searchFeat =>
                                    p.PropertyFeatures.Contains(searchFeat, StringComparison.OrdinalIgnoreCase));
                            }
                        }).ToList();

                        // Keep only filtered properties IDs
                        var filteredIds = filteredProperties.Select(p => p.Id).ToList();
                        query = query.Where(p => filteredIds.Contains(p.Id));
                    }
                }

                // Get total count before applying pagination
                var finalQuery = query;
                var totalCount = await finalQuery.CountAsync();
                var totalPages = (int)Math.Ceiling((double)totalCount / limit);

                // Apply sorting
                if (sortBy == "popular")
                {
                    // For popular sorting, we need to join with likes and order by like count
                    var propertyIds = await finalQuery.Select(p => p.Id).ToListAsync();

                    var likeCounts = await _context.Likes
                        .Where(l => propertyIds.Contains(l.PropertyId))
                        .GroupBy(l => l.PropertyId)
                        .Select(g => new { PropertyId = g.Key, Count = g.Count() })
                        .ToDictionaryAsync(x => x.PropertyId, x => x.Count);

                    var filteredProperties = await finalQuery.ToListAsync();

                    var sortedProperties = filteredProperties
                        .OrderByDescending(p => likeCounts.GetValueOrDefault(p.Id, 0))
                        .ThenByDescending(p => p.CreatedAt)
                        .Skip((page - 1) * limit)
                        .Take(limit)
                        .ToList();

                    _logger.LogInformation("Search found {Count} properties (popular sort)", totalCount);

                    return Ok(new SearchResponse
                    {
                        Properties = sortedProperties,
                        TotalCount = totalCount,
                        CurrentPage = page,
                        TotalPages = totalPages,
                        HasNextPage = page < totalPages,
                        HasPreviousPage = page > 1
                    });
                }
                else
                {
                    // Apply other sorting options
                    finalQuery = sortBy switch
                    {
                        "oldest" => finalQuery.OrderBy(p => p.CreatedAt),
                        "space_asc" => finalQuery.OrderBy(p => p.Space),
                        "space_desc" => finalQuery.OrderByDescending(p => p.Space),
                        "rooms_asc" => finalQuery.OrderBy(p => p.Rooms),
                        "rooms_desc" => finalQuery.OrderByDescending(p => p.Rooms),
                        _ => finalQuery.OrderByDescending(p => p.CreatedAt) // newest first (default)
                    };

                    // Apply pagination and execute the query
                    var properties = await finalQuery
                        .Skip((page - 1) * limit)
                        .Take(limit)
                        .ToListAsync();

                    _logger.LogInformation("Search found {Count} properties", totalCount);

                    return Ok(new SearchResponse
                    {
                        Properties = properties,
                        TotalCount = totalCount,
                        CurrentPage = page,
                        TotalPages = totalPages,
                        HasNextPage = page < totalPages,
                        HasPreviousPage = page > 1
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while searching properties");
                return StatusCode(500, new { message = "An error occurred while searching properties.", error = ex.Message });
            }
        }

        [HttpGet("search-suggestions")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<string>>> GetSearchSuggestions([FromQuery] string q)
        {
            try
            {
                if (string.IsNullOrEmpty(q) || q.Length < 2)
                    return Ok(new List<string>());

                var searchTerm = q.ToLower();

                // Get suggestions from different fields
                var citySuggestions = await _context.Properties
                    .Where(p => p.Status == PropertyStatus.Approved && p.City.ToLower().Contains(searchTerm))
                    .Select(p => p.City)
                    .Distinct()
                    .Take(3)
                    .ToListAsync();

                var titleSuggestions = await _context.Properties
                    .Where(p => p.Status == PropertyStatus.Approved && p.Title.ToLower().Contains(searchTerm))
                    .Select(p => p.Title)
                    .Distinct()
                    .Take(3)
                    .ToListAsync();

                var typeSuggestions = await _context.Properties
                    .Where(p => p.Status == PropertyStatus.Approved && p.PropertyType.ToLower().Contains(searchTerm))
                    .Select(p => p.PropertyType)
                    .Distinct()
                    .Take(2)
                    .ToListAsync();

                // Special case for garden suggestions
                var featureSuggestions = new List<string>();
                if (searchTerm.Contains("garden"))
                {
                    _logger.LogInformation("Garden suggestion query detected");
                    featureSuggestions.Add("Garden");
                    featureSuggestions.Add("Properties with Gardens");
                }

                // Combine and limit suggestions
                var allSuggestions = new List<string>();
                allSuggestions.AddRange(citySuggestions);
                allSuggestions.AddRange(titleSuggestions);
                allSuggestions.AddRange(typeSuggestions);
                allSuggestions.AddRange(featureSuggestions);

                return Ok(allSuggestions.Distinct().Take(8));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while getting search suggestions");
                return Ok(new List<string>()); // Return empty list on error
            }
        }
       
       
        [HttpGet("unified-ai-search")]
        [AllowAnonymous]
        public async Task<IActionResult> UnifiedAISearch([FromQuery] string query, [FromQuery] string? filters = null)
        {
            try
            {
                _logger.LogInformation("Unified AI search requested with query: {Query}, filters: {Filters}", query, filters);

                // Step 1: Get all properties first for complete filtering flexibility
                var allProperties = await _context.Properties
                    .Where(p => p.Status == PropertyStatus.Approved)
                    .Include(p => p.User)
                    .Include(p => p.Photos)
                    .ToListAsync(); // Convert to list to perform filtering in memory

                _logger.LogInformation("Retrieved {Count} properties for AI filtering", allProperties.Count);

                // Step 2: Parse filters if provided
                Dictionary<string, object> filterDict = new Dictionary<string, object>();
                if (!string.IsNullOrEmpty(filters))
                {
                    try
                    {
                        filterDict = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(filters) ??
                            new Dictionary<string, object>();
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to parse filters JSON");
                    }
                }

                // Step 3: Apply filters in memory (not as LINQ expressions) for more flexibility
                IEnumerable<Property> filteredProperties = allProperties;

                // Apply propertyType filter (if present and not "Any")
                if (filterDict.TryGetValue("propertyType", out var propType) && propType != null)
                {
                    string propertyTypeStr = propType.ToString() ?? "";

                    if (!string.Equals(propertyTypeStr, "Any", StringComparison.OrdinalIgnoreCase))
                    {
                        filteredProperties = filteredProperties.Where(p =>
                            p.PropertyType != null &&
                            p.PropertyType.IndexOf(propertyTypeStr, StringComparison.OrdinalIgnoreCase) >= 0);
                    }
                }

                // Apply room filters
                if (filterDict.TryGetValue("minRooms", out var minR) && int.TryParse(minR?.ToString(), out int minRooms))
                {
                    filteredProperties = filteredProperties.Where(p => p.Rooms >= minRooms);
                }

                if (filterDict.TryGetValue("maxRooms", out var maxR) && int.TryParse(maxR?.ToString(), out int maxRooms))
                {
                    filteredProperties = filteredProperties.Where(p => p.Rooms <= maxRooms);
                }

                // Apply space filters
                if (filterDict.TryGetValue("minSpace", out var minS) && int.TryParse(minS?.ToString(), out int minSpace))
                {
                    filteredProperties = filteredProperties.Where(p => p.Space >= minSpace);
                }

                if (filterDict.TryGetValue("maxSpace", out var maxS) && int.TryParse(maxS?.ToString(), out int maxSpace))
                {
                    filteredProperties = filteredProperties.Where(p => p.Space <= maxSpace);
                }

                // Apply city filter
                if (filterDict.TryGetValue("city", out var cityVal) && cityVal != null)
                {
                    string cityStr = cityVal.ToString() ?? "";
                    filteredProperties = filteredProperties.Where(p =>
                        (p.City != null && p.City.IndexOf(cityStr, StringComparison.OrdinalIgnoreCase) >= 0) ||
                        (p.Address != null && p.Address.IndexOf(cityStr, StringComparison.OrdinalIgnoreCase) >= 0));
                }

                // NEW: IMPROVED JSON SEARCH FOR BOTH PREFERENCES AND FEATURES
                // This is the key improvement that will work for all terms like "modern", "garden", etc.

                // First, extract search terms from preferences and features
                var searchTerms = new List<string>();

                // Add the main query as a search term
                if (!string.IsNullOrEmpty(query))
                {
                    searchTerms.Add(query.ToLower());
                }

                // Add preferences from filters
                if (filterDict.TryGetValue("preferences", out var prefsObj) && prefsObj != null)
                {
                    try
                    {
                        string prefsJson = prefsObj.ToString() ?? "[]";
                        var preferences = System.Text.Json.JsonSerializer.Deserialize<List<string>>(prefsJson);
                        if (preferences != null)
                        {
                            searchTerms.AddRange(preferences.Select(p => p.ToLower()));
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to parse preferences");
                    }
                }

                // Add features from filters
                if (filterDict.TryGetValue("features", out var featsObj) && featsObj != null)
                {
                    try
                    {
                        string featsJson = featsObj.ToString() ?? "[]";
                        var features = System.Text.Json.JsonSerializer.Deserialize<List<string>>(featsJson);
                        if (features != null)
                        {
                            searchTerms.AddRange(features.Select(f => f.ToLower()));
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to parse features");
                    }
                }

                // If we have search terms, filter properties that match ANY term
                if (searchTerms.Count > 0)
                {
                    _logger.LogInformation("Filtering by search terms: {Terms}", string.Join(", ", searchTerms));

                    // Find properties that match ANY of the search terms in ANY field
                    filteredProperties = filteredProperties.Where(p => {
                        // Look for matches in various text fields
                        bool titleMatch = searchTerms.Any(term =>
                            p.Title != null && p.Title.ToLower().Contains(term));

                        bool captionMatch = searchTerms.Any(term =>
                            p.Caption != null && p.Caption.ToLower().Contains(term));

                        // Check PropertyPreferences JSON
                        bool preferenceMatch = false;
                        if (!string.IsNullOrEmpty(p.PropertyPreferences))
                        {
                            try
                            {
                                // First try proper JSON parsing
                                var prefs = System.Text.Json.JsonSerializer.Deserialize<List<string>>(p.PropertyPreferences);
                                if (prefs != null)
                                {
                                    preferenceMatch = searchTerms.Any(term =>
                                        prefs.Any(pref => pref.IndexOf(term, StringComparison.OrdinalIgnoreCase) >= 0));
                                }
                            }
                            catch
                            {
                                // Fallback to simple string contains
                                preferenceMatch = searchTerms.Any(term =>
                                    p.PropertyPreferences.IndexOf(term, StringComparison.OrdinalIgnoreCase) >= 0);
                            }
                        }

                        // Check PropertyFeatures JSON
                        bool featureMatch = false;
                        if (!string.IsNullOrEmpty(p.PropertyFeatures))
                        {
                            try
                            {
                                // First try proper JSON parsing
                                var features = System.Text.Json.JsonSerializer.Deserialize<List<string>>(p.PropertyFeatures);
                                if (features != null)
                                {
                                    featureMatch = searchTerms.Any(term =>
                                        features.Any(feat => feat.IndexOf(term, StringComparison.OrdinalIgnoreCase) >= 0));
                                }
                            }
                            catch
                            {
                                // Fallback to simple string contains
                                featureMatch = searchTerms.Any(term =>
                                    p.PropertyFeatures.IndexOf(term, StringComparison.OrdinalIgnoreCase) >= 0);
                            }
                        }

                        // Return true if ANY of the matches succeeded
                        return titleMatch || captionMatch || preferenceMatch || featureMatch;
                    });
                }

                // Step 4: Convert to list for final processing
                var finalProperties = filteredProperties.ToList();
                _logger.LogInformation("Unified AI search found {Count} matching properties", finalProperties.Count);

                // Step 5: Get like and comment counts
                var propertyIds = finalProperties.Select(p => p.Id).ToList();

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

                // Step 6: Format the response
                var resultProperties = finalProperties.Select(p => new {
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
                    PropertyPreferences = ParseJsonArrayForSearch(p.PropertyPreferences),
                    PropertyFeatures = ParseJsonArrayForSearch(p.PropertyFeatures),
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

                return Ok(new
                {
                    properties = resultProperties,
                    totalCount = resultProperties.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in unified AI search");
                return StatusCode(500, new { message = "Error processing unified AI search", error = ex.Message });
            }
        }
        [HttpGet("quick-search")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<Property>>> QuickSearch([FromQuery] string q)
        {
            try
            {
                if (string.IsNullOrEmpty(q) || q.Length < 2)
                    return Ok(new List<Property>());

                var searchTerm = q.ToLower();

                // Special handling for garden searches
                if (searchTerm.Contains("garden"))
                {
                    _logger.LogInformation("Garden quick search detected");

                    // Get all properties first for proper JSON handling
                    var allProperties = await _context.Properties
                        .Where(p => p.Status == PropertyStatus.Approved)
                        .Include(p => p.User)
                        .Include(p => p.Photos)
                        .ToListAsync();

                    // Filter in memory with proper JSON deserialization
                    var gardenProperties = allProperties
                        .Where(p => {
                            if (string.IsNullOrEmpty(p.PropertyFeatures))
                                return false;

                            try
                            {
                                var features = System.Text.Json.JsonSerializer.Deserialize<List<string>>(p.PropertyFeatures);
                                return features != null && features.Any(f =>
                                    f.IndexOf("garden", StringComparison.OrdinalIgnoreCase) >= 0);
                            }
                            catch
                            {
                                return p.PropertyFeatures.IndexOf("garden", StringComparison.OrdinalIgnoreCase) >= 0;
                            }
                        })
                        .Take(10)
                        .ToList();

                    if (gardenProperties.Count > 0)
                    {
                        _logger.LogInformation("Found {Count} garden properties in quick search", gardenProperties.Count);
                        return Ok(gardenProperties);
                    }
                }

                // Regular search for other terms
                var properties = await _context.Properties
                    .Where(p => p.Status == PropertyStatus.Approved)
                    .Include(p => p.User)
                    .Include(p => p.Photos)
                    .Where(p => p.Title.ToLower().Contains(searchTerm) ||
                              p.City.ToLower().Contains(searchTerm) ||
                              p.Address.ToLower().Contains(searchTerm) ||
                              p.PropertyType.ToLower().Contains(searchTerm))
                    .Take(10)
                    .ToListAsync();

                return Ok(properties);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during quick search");
                return StatusCode(500, new { message = "An error occurred during quick search.", error = ex.Message });
            }
        }
    }
}