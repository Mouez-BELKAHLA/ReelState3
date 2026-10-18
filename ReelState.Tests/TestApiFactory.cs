using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using ReelState.Data;
using System.Net.Http.Json;
using System.Text.Json;

// Starts the real app, but with an in-memory database and fake settings,
// so tests never touch the real database and also work in CI.
public class TestApiFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = Guid.NewGuid().ToString();

    static TestApiFactory()
    {
        // Program.cs reads these while the app is being built, so they must be environment variables.
        Environment.SetEnvironmentVariable("ConnectionStrings__DefaultConnection", "Server=unused;Database=unused;");
        Environment.SetEnvironmentVariable("JWT__Secret", "test-secret-key-for-integration-tests-at-least-32-chars");
        Environment.SetEnvironmentVariable("JWT__ValidIssuer", "reelstate-tests");
        Environment.SetEnvironmentVariable("JWT__ValidAudience", "reelstate-tests");
        Environment.SetEnvironmentVariable("Authentication__Google__ClientId", "test-client-id");
        Environment.SetEnvironmentVariable("Authentication__Google__ClientSecret", "test-client-secret");
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development"); // role seeding only runs in Development

        builder.ConfigureServices(services =>
        {
            var toRemove = services.Where(d =>
                d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>) ||
                d.ServiceType == typeof(DbContextOptions) ||
                (d.ServiceType.FullName?.Contains("IDbContextOptionsConfiguration") == true &&
                 d.ServiceType.GenericTypeArguments.Length == 1 &&
                 d.ServiceType.GenericTypeArguments[0] == typeof(ApplicationDbContext))).ToList();

            foreach (var d in toRemove) services.Remove(d);

            services.AddDbContext<ApplicationDbContext>(o => o.UseInMemoryDatabase(_dbName));
        });
    }
}

public static class TestUsers
{
    public const string Password = "Password1";

    public static async Task<(string Email, JsonElement Body)> RegisterAsync(HttpClient client)
    {
        var email = $"{Guid.NewGuid():N}@example.com";
        var response = await client.PostAsJsonAsync("/api/v1/auth/register",
            new { email, password = Password, firstName = "Test", lastName = "User" });
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        return (email, body);
    }
}
