using CloudinaryDotNet;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using ReelState.Data;

namespace ReelState.Server.Infrastructure;

/// <summary>Unhealthy if the database has migrations that were not applied.</summary>
public class MigrationsHealthCheck : IHealthCheck
{
    private readonly ApplicationDbContext _db;
    public MigrationsHealthCheck(ApplicationDbContext db) => _db = db;

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context, CancellationToken ct = default)
    {
        // In-memory/test providers have no migrations: nothing to check.
        if (!_db.Database.IsRelational())
            return HealthCheckResult.Healthy("Non-relational provider, migrations not applicable");

        try
        {
            var pending = (await _db.Database.GetPendingMigrationsAsync(ct)).ToList();
            return pending.Count == 0
                ? HealthCheckResult.Healthy("All migrations applied")
                : HealthCheckResult.Unhealthy($"{pending.Count} pending migration(s)");
        }
        catch
        {
            return HealthCheckResult.Unhealthy("Could not read migration state");
        }
    }
}

/// <summary>Degraded (not Unhealthy) because Cloudinary is an optional dependency.</summary>
public class CloudinaryHealthCheck : IHealthCheck
{
    private readonly IConfiguration _config;
    public CloudinaryHealthCheck(IConfiguration config) => _config = config;

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context, CancellationToken ct = default)
    {
        var cloud = _config["Cloudinary:CloudName"];
        var key = _config["Cloudinary:ApiKey"];
        var secret = _config["Cloudinary:ApiSecret"];

        if (string.IsNullOrWhiteSpace(cloud) || string.IsNullOrWhiteSpace(key) || string.IsNullOrWhiteSpace(secret))
            return HealthCheckResult.Degraded("Cloudinary not configured");

        try
        {
            var client = new Cloudinary(new Account(cloud, key, secret));
            var result = await client.PingAsync();
            return result.StatusCode == System.Net.HttpStatusCode.OK
                ? HealthCheckResult.Healthy("Cloudinary reachable")
                : HealthCheckResult.Degraded("Cloudinary ping failed");
        }
        catch
        {
            return HealthCheckResult.Degraded("Cloudinary unreachable or keys invalid");
        }
    }
}

/// <summary>Config-only check: no external calls, so no API quota is used.</summary>
public class ConfigHealthCheck : IHealthCheck
{
    private readonly IConfiguration _config;
    private readonly string _name;
    private readonly string[] _keys;

    public ConfigHealthCheck(IConfiguration config, string name, params string[] keys)
    {
        _config = config;
        _name = name;
        _keys = keys;
    }

    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context, CancellationToken ct = default)
    {
        var missing = _keys.Where(k => string.IsNullOrWhiteSpace(_config[k])).ToList();
        return Task.FromResult(missing.Count == 0
            ? HealthCheckResult.Healthy($"{_name} configured")
            : HealthCheckResult.Degraded($"{_name} not configured"));
    }
}