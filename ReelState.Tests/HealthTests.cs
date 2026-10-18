using System.Net;

public class HealthTests : IClassFixture<TestApiFactory>
{
    private readonly HttpClient _client;

    public HealthTests(TestApiFactory factory) => _client = factory.CreateClient();

    [Fact]
    public async Task Health_returns_200()
    {
        var response = await _client.GetAsync("/health");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
