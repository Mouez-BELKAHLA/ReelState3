using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

// Note: the "auth" rate limit allows 10 requests per minute, so keep this class under 10 auth calls.
public class AuthTests : IClassFixture<TestApiFactory>
{
    private readonly HttpClient _client;

    public AuthTests(TestApiFactory factory) => _client = factory.CreateClient();

    [Fact]
    public async Task Register_returns_token_and_user_role()
    {
        var (_, body) = await TestUsers.RegisterAsync(_client);

        Assert.False(string.IsNullOrEmpty(body.GetProperty("token").GetString()));
        var roles = body.GetProperty("roles").EnumerateArray().Select(r => r.GetString());
        Assert.Contains("User", roles);
    }

    [Fact]
    public async Task Register_with_empty_email_returns_400()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/auth/register",
            new { email = "", password = TestUsers.Password, firstName = "Test", lastName = "User" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Login_with_wrong_password_returns_401()
    {
        var (email, _) = await TestUsers.RegisterAsync(_client);

        var response = await _client.PostAsJsonAsync("/api/v1/auth/login",
            new { email, password = "WrongPassword1" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_with_correct_password_returns_token()
    {
        var (email, _) = await TestUsers.RegisterAsync(_client);

        var response = await _client.PostAsJsonAsync("/api/v1/auth/login",
            new { email, password = TestUsers.Password });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.False(string.IsNullOrEmpty(body.GetProperty("token").GetString()));
    }

    [Fact]
    public async Task Refresh_token_returns_new_tokens()
    {
        var (_, reg) = await TestUsers.RegisterAsync(_client);

        var response = await _client.PostAsJsonAsync("/api/v1/auth/refreshToken", new
        {
            token = reg.GetProperty("token").GetString(),
            refreshToken = reg.GetProperty("refreshToken").GetString()
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
