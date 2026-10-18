using System.Net;

public class VersioningTests : IClassFixture<TestApiFactory>
{
    private readonly HttpClient _client;

    public VersioningTests(TestApiFactory factory) => _client = factory.CreateClient();

    [Fact]
    public async Task Versioned_route_v1_works()
    {
        var response = await _client.GetAsync("/api/v1/Property");
        var body = await response.Content.ReadAsStringAsync();
        Assert.True(response.StatusCode == HttpStatusCode.OK, $"Expected 200 but got {(int)response.StatusCode}: {body}");
    }

    [Fact]
    public async Task Legacy_unversioned_route_still_works()
    {
        var response = await _client.GetAsync("/api/Property");
        var body = await response.Content.ReadAsStringAsync();
        Assert.True(response.StatusCode == HttpStatusCode.OK, $"Expected 200 but got {(int)response.StatusCode}: {body}");
    }
}
