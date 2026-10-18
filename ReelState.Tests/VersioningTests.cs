using System.Net;

public class VersioningTests : IClassFixture<TestApiFactory>
{
    private readonly HttpClient _client;

    public VersioningTests(TestApiFactory factory) => _client = factory.CreateClient();

    [Fact]
    public async Task Versioned_route_v1_works()
    {
        var response = await _client.GetAsync("/api/v1/Property");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Legacy_unversioned_route_still_works()
    {
        var response = await _client.GetAsync("/api/Property");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
