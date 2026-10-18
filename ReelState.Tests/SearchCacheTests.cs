using System.Net;

namespace ReelState.Tests;

public class SearchCacheTests : IClassFixture<TestApiFactory>
{
    private readonly HttpClient _client;

    public SearchCacheTests(TestApiFactory factory) => _client = factory.CreateClient();

    [Fact]
    public async Task Search_SecondIdenticalRequest_IsServedFromCache()
    {
        var url = "/api/v1/property/search?q=cache-test&page=1&limit=5";

        var first = await _client.GetAsync(url);
        var second = await _client.GetAsync(url);

        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        Assert.Equal("MISS", first.Headers.GetValues("X-Cache").Single());
        Assert.Equal("HIT", second.Headers.GetValues("X-Cache").Single());
    }

    [Fact]
    public async Task Search_DifferentFilters_DoNotShareCachedResults()
    {
        await _client.GetAsync("/api/v1/property/search?q=alpha");
        var other = await _client.GetAsync("/api/v1/property/search?q=beta");

        Assert.Equal("MISS", other.Headers.GetValues("X-Cache").Single());
    }
}
