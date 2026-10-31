using System;
using System.Threading.Tasks;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace ReelState.Server.Services;

public interface IMediaStorage
{
    bool IsEnabled { get; }
    Task<string> UploadAsync(IFormFile file, string folder);
}

public class MediaStorageDisabledException : InvalidOperationException
{
    public MediaStorageDisabledException()
        : base("Media uploads are disabled because Cloudinary is not configured.") { }
}

public class DisabledMediaStorage : IMediaStorage
{
    public bool IsEnabled => false;

    public Task<string> UploadAsync(IFormFile file, string folder)
        => throw new MediaStorageDisabledException();
}

public class CloudinaryMediaStorage : IMediaStorage
{
    private readonly Cloudinary _cloudinary;
    private readonly ILogger<CloudinaryMediaStorage> _logger;

    public CloudinaryMediaStorage(Cloudinary cloudinary, ILogger<CloudinaryMediaStorage> logger)
    {
        _cloudinary = cloudinary;
        _logger = logger;
    }

    public bool IsEnabled => true;

    public async Task<string> UploadAsync(IFormFile file, string folder)
    {
        await using var stream = file.OpenReadStream();
        var fileDesc = new FileDescription(file.FileName, stream);

        RawUploadResult result;
        if (folder == "videos")
        {
            result = await _cloudinary.UploadAsync(new VideoUploadParams
            {
                File = fileDesc,
                Folder = "reelstate/videos"
            });
        }
        else
        {
            result = await _cloudinary.UploadAsync(new ImageUploadParams
            {
                File = fileDesc,
                Folder = "reelstate/photos"
            });
        }

        if (result.Error != null)
            throw new InvalidOperationException($"Cloudinary upload failed: {result.Error.Message}");

        _logger.LogInformation("File uploaded to Cloudinary: {Url}", result.SecureUrl);
        return result.SecureUrl.ToString();
    }
}