using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using ReelState.Server.Services;

namespace ReelState.Tests;

public class GoogleAuthServiceTests
{
    private readonly Mock<IConfiguration> _config = new();
    private readonly Mock<ILogger<GoogleAuthService>> _logger = new();

    private GoogleAuthService CreateService() => new(_config.Object, _logger.Object);

    private void VerifyLogged(LogLevel level, string text, Times times) =>
        _logger.Verify(
            x => x.Log(
                level,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, _) => v.ToString()!.Contains(text)),
                It.IsAny<Exception?>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            times);

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    public async Task VerifyGoogleToken_ReturnsNull_AndLogsWarning_WhenTokenIsEmpty(string? token)
    {
        var result = await CreateService().VerifyGoogleToken(token!);

        Assert.Null(result);
        VerifyLogged(LogLevel.Warning, "null or empty", Times.Once());
    }

    [Fact]
    public async Task VerifyGoogleToken_ReturnsNull_AndLogsError_WhenClientIdIsMissing()
    {
        // No setup for the ClientId key, so the mocked configuration returns null
        var result = await CreateService().VerifyGoogleToken("some-token");

        Assert.Null(result);
        VerifyLogged(LogLevel.Error, "Error validating Google token", Times.Once());
    }

    [Fact]
    public async Task VerifyGoogleToken_ReturnsNull_AndLogsError_WhenTokenIsMalformed()
    {
        _config.Setup(c => c["Authentication:Google:ClientId"]).Returns("test-client-id");

        var result = await CreateService().VerifyGoogleToken("this-is-not-a-jwt");

        Assert.Null(result);
        VerifyLogged(LogLevel.Error, "Error validating Google token", Times.Once());
    }
}
