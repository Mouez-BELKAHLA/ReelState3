using System.Net;
using System.Net.Http.Json;

// Own class = own app instance = own rate limit counters.
public class RateLimitTests : IClassFixture<TestApiFactory>
{
    private readonly HttpClient _client;

    public RateLimitTests(TestApiFactory factory) => _client = factory.CreateClient();

    [Fact]
    public async Task Auth_endpoint_returns_429_after_10_requests_in_a_minute()
    {
        var statuses = new List<HttpStatusCode>();

        for (var i = 0; i < 12; i++)
        {
            var response = await _client.PostAsJsonAsync("/api/v1/auth/login",
                new { email = "nobody@example.com", password = "Password1" });
            statuses.Add(response.StatusCode);
        }

        Assert.Equal(HttpStatusCode.Unauthorized, statuses[0]);
        Assert.Contains(HttpStatusCode.TooManyRequests, statuses);
        Assert.Equal(10, statuses.Count(s => s != HttpStatusCode.TooManyRequests));
    }
}
