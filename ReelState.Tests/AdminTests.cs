using System.Net;
using System.Net.Http.Headers;

public class AdminTests : IClassFixture<TestApiFactory>
{
    private readonly HttpClient _client;

    public AdminTests(TestApiFactory factory) => _client = factory.CreateClient();

    [Fact]
    public async Task Admin_endpoint_without_token_returns_401()
    {
        var response = await _client.GetAsync("/api/v1/admin/test");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Admin_endpoint_as_normal_user_returns_403()
    {
        var (_, body) = await TestUsers.RegisterAsync(_client);
        var token = body.GetProperty("token").GetString();

        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/admin/test");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }
}
