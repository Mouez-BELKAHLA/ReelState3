using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ReelState.Data;
using ReelState.Server.Services;
using System.Text;
using ReelState.Server.Models;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.Extensions.FileProviders;
using System.Text.Json.Serialization.Metadata;
using System.Net;
using CloudinaryDotNet;
using Asp.Versioning;
using FluentValidation;
using SharpGrip.FluentValidation.AutoValidation.Mvc.Extensions;
using Microsoft.AspNetCore.RateLimiting;
using ReelState.Server.Infrastructure;
using Serilog;
using System.Security.Claims;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using ReelState.Server.Hubs;

var builder = WebApplication.CreateBuilder(args);
// Cache: Redis when Redis:ConnectionString is set, otherwise in-memory fallback
var redisConnection = builder.Configuration["Redis:ConnectionString"];
if (!string.IsNullOrWhiteSpace(redisConnection))
{
    builder.Services.AddStackExchangeRedisCache(o =>
    {
        var redisOptions = StackExchange.Redis.ConfigurationOptions.Parse(redisConnection);
        redisOptions.AbortOnConnectFail = false;
        redisOptions.ConnectTimeout = 1000;
        redisOptions.SyncTimeout = 500;
        redisOptions.AsyncTimeout = 500;
        redisOptions.BacklogPolicy = StackExchange.Redis.BacklogPolicy.FailFast;
        o.ConfigurationOptions = redisOptions;
        o.InstanceName = "reelstate:";
    });
}
else
{
    builder.Services.AddDistributedMemoryCache();
}

// ---- Serilog: structured logs to console + daily rolling file ----
builder.Host.UseSerilog((ctx, services, cfg) => cfg
    .ReadFrom.Configuration(ctx.Configuration)
    .Enrich.FromLogContext()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft.AspNetCore", Serilog.Events.LogEventLevel.Warning)
    .WriteTo.Console()
    .WriteTo.File("logs/reelstate-.log", rollingInterval: RollingInterval.Day, retainedFileCountLimit: 14));

// Configure Kestrel to handle large file uploads and listen on all interfaces
builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.Limits.MaxRequestBodySize = 104857600; // 100MB
    // Render provides a PORT environment variable; locally we fall back to 5034
    var port = int.TryParse(Environment.GetEnvironmentVariable("PORT"), out var p) ? p : 5034;
    serverOptions.ListenAnyIP(port); // Listen on all network interfaces
});

// Configure IIS Server options for large file uploads
builder.Services.Configure<IISServerOptions>(options =>
{
    options.MaxRequestBodySize = 104857600; // 100MB
});

// Configure request form options
builder.Services.Configure<FormOptions>(options =>
{
    options.ValueLengthLimit = 104857600; // 100MB
    options.MultipartBodyLengthLimit = 104857600; // 100MB
    options.MultipartHeadersLengthLimit = 32768; // 32KB
});

// FIXED: Add controllers with correctly configured JSON serialization
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        options.JsonSerializerOptions.Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping;
        // Need to set TypeInfoResolver for .NET 9
        options.JsonSerializerOptions.TypeInfoResolver = JsonSerializer.IsReflectionEnabledByDefault
            ? new DefaultJsonTypeInfoResolver()
            : JsonTypeInfoResolver.Combine(new DefaultJsonTypeInfoResolver());
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });
builder.Services.AddSignalR();

// ---- API versioning (URL segment /api/v1/... ; the legacy /api/... routes keep working as v1) ----
builder.Services.AddApiVersioning(o =>
{
    o.DefaultApiVersion = new ApiVersion(1, 0);
    o.AssumeDefaultVersionWhenUnspecified = true;
    o.ReportApiVersions = true;
    o.ApiVersionReader = new UrlSegmentApiVersionReader();
})
.AddMvc()
.AddApiExplorer(o =>
{
    o.GroupNameFormat = "'v'VVV";
    o.SubstituteApiVersionInUrl = true;
});

// ---- FluentValidation: validators in /Validators run automatically before controller actions ----
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

// ---- Global error handling (RFC 7807 ProblemDetails) ----
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

// ---- Rate limiting ----
builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // Global: 200 requests/minute per user (or per IP when anonymous)
    o.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(ctx =>
        RateLimitPartition.GetFixedWindowLimiter(
            ctx.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? ctx.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
            _ => new FixedWindowRateLimiterOptions { PermitLimit = 200, Window = TimeSpan.FromMinutes(1) }));

    // Strict policy for login / register / refresh: 10 requests/minute per IP (brute-force protection)
    o.AddPolicy("auth", ctx =>
        RateLimitPartition.GetFixedWindowLimiter(
            ctx.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
            _ => new FixedWindowRateLimiterOptions { PermitLimit = 10, Window = TimeSpan.FromMinutes(1) }));
});

// ---- Policy-based authorization ----
builder.Services.AddAuthorization(o =>
{
    o.AddPolicy("AdminOnly", p => p.RequireAuthenticatedUser().RequireRole("Admin"));
    o.AddPolicy("RegisteredUser", p => p.RequireAuthenticatedUser().RequireClaim(ClaimTypes.NameIdentifier));
});

// ---- Health checks ----
builder.Services.AddHealthChecks()
    .AddDbContextCheck<ApplicationDbContext>("database")
    .AddCheck<MigrationsHealthCheck>("migrations")
    .AddCheck<CloudinaryHealthCheck>("cloudinary")
    .Add(new HealthCheckRegistration("gemini",
        sp => new ConfigHealthCheck(sp.GetRequiredService<IConfiguration>(), "Gemini", "Gemini:ApiKey"),
        HealthStatus.Degraded, null))
    .Add(new HealthCheckRegistration("google-auth",
        sp => new ConfigHealthCheck(sp.GetRequiredService<IConfiguration>(), "Google auth",
            "Authentication:Google:ClientId", "Authentication:Google:ClientSecret"),
        HealthStatus.Degraded, null));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "ReelState API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});
if (builder.Environment.IsDevelopment())
{
    var csDebug = builder.Configuration.GetConnectionString("DefaultConnection");
    if (!string.IsNullOrEmpty(csDebug))
    {
        var sb = new Microsoft.Data.SqlClient.SqlConnectionStringBuilder(csDebug);
        Console.WriteLine($"DB host in use: {sb.DataSource} | db: {sb.InitialCatalog}");
    }
}
// Add DbContext
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection") ??
        throw new InvalidOperationException("Connection string 'DefaultConnection' not found.")));

// Add Identity
builder.Services.AddIdentity<ApplicationUser, IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

// Configure Identity options
builder.Services.Configure<IdentityOptions>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 8;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = true;
    options.Password.RequireLowercase = true;
});

// Get JWT config with null safety
var jwtSecret = builder.Configuration["JWT:Secret"] ??
    throw new InvalidOperationException("JWT:Secret configuration is missing");
var jwtIssuer = builder.Configuration["JWT:ValidIssuer"] ??
    throw new InvalidOperationException("JWT:ValidIssuer configuration is missing");
var jwtAudience = builder.Configuration["JWT:ValidAudience"] ??
    throw new InvalidOperationException("JWT:ValidAudience configuration is missing");

// Google auth is optional: only enabled when both values are configured
var googleClientId = builder.Configuration["Authentication:Google:ClientId"];
var googleClientSecret = builder.Configuration["Authentication:Google:ClientSecret"];
var googleAuthEnabled = !string.IsNullOrWhiteSpace(googleClientId)
                        && !string.IsNullOrWhiteSpace(googleClientSecret);

// Adding Authentication
var authBuilder = builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
// Adding JWT Bearer
.AddJwtBearer(options =>
{
    options.SaveToken = true;
    options.RequireHttpsMetadata = false;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ClockSkew = TimeSpan.Zero
    };
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            if (!string.IsNullOrEmpty(accessToken) &&
                context.HttpContext.Request.Path.StartsWithSegments("/hubs"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

// Add Google Authentication only when configured
if (googleAuthEnabled)
{
    authBuilder.AddGoogle(options =>
    {
        options.ClientId = googleClientId!;
        options.ClientSecret = googleClientSecret!;
        options.CallbackPath = "/api/auth/google-callback";
    });
}
else
{
    Console.WriteLine("Google authentication disabled: ClientId/ClientSecret not configured.");
}

// Enhanced CORS policy to allow access from mobile devices on the same network
builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
    {
        // In development mode, allow any origin to make it easier to test from mobile
        if (builder.Environment.IsDevelopment())
        {
            policy
                .SetIsOriginAllowed(_ => true) // Allow any origin in development
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials();
        }
        else
        {
            // Comma-separated list, e.g. "https://your-app.vercel.app"
            var allowedOrigins = (builder.Configuration["Cors:AllowedOrigins"] ?? "")
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

            policy
                .WithOrigins(allowedOrigins)
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials();
        }
    });
});
builder.Services.AddSingleton<ReelState.Server.Services.IMediaStorage>(sp =>
{
    var cfg = sp.GetRequiredService<IConfiguration>();
    var cloud = cfg["Cloudinary:CloudName"];
    var key = cfg["Cloudinary:ApiKey"];
    var secret = cfg["Cloudinary:ApiSecret"];

    if (string.IsNullOrWhiteSpace(cloud) || string.IsNullOrWhiteSpace(key) || string.IsNullOrWhiteSpace(secret))
        return new ReelState.Server.Services.DisabledMediaStorage();

    var cloudinary = new Cloudinary(new Account(cloud, key, secret)) { Api = { Secure = true } };
    return new ReelState.Server.Services.CloudinaryMediaStorage(
        cloudinary,
        sp.GetRequiredService<ILogger<ReelState.Server.Services.CloudinaryMediaStorage>>());
});

// Add Services
builder.Services.AddHttpClient<GeminiService>(c => c.Timeout = TimeSpan.FromSeconds(60));
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IGoogleAuthService, GoogleAuthService>();
builder.Services.AddScoped<ReelState.Server.Services.NotificationService>();
// Configure static files to serve uploaded files
builder.Services.AddDirectoryBrowser();
//builder.Services.AddScoped<NotificationService>(); Duplicated

// ---- Behind a reverse proxy (Render): read the real client IP from X-Forwarded-For ----
// Without this, every visitor shares the proxy's IP, so the rate limiter would count them all together.
builder.Services.Configure<ForwardedHeadersOptions>(o =>
{
    o.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    o.KnownNetworks.Clear();
    o.KnownProxies.Clear();
});

var app = builder.Build();

// Must run first so later middleware (rate limiter, logging) sees the real client IP
app.UseForwardedHeaders();
// Optional: apply EF Core migrations on startup (enabled in docker compose only)
if (app.Configuration.GetValue<bool>("Database:MigrateOnStartup"))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    for (var attempt = 1; ; attempt++)
    {
        try
        {
            db.Database.Migrate();
            break;
        }
        catch (Exception ex) when (attempt < 10)
        {
            Console.WriteLine($"Database not ready (attempt {attempt}/10): {ex.Message}");
            Thread.Sleep(3000);
        }
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "ReelState API v1");
    });

    // Print listening addresses for debugging
    Console.WriteLine("Development server is running. Listening on:");
    Console.WriteLine($"- http://localhost:5034");

    // Find and print local IP addresses
    var hostName = Dns.GetHostName();
    var addresses = Dns.GetHostAddresses(hostName)
        .Where(ip => ip.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork)
        .Select(ip => ip.ToString());

    foreach (var address in addresses)
    {
        Console.WriteLine($"- http://{address}:5034");
    }

    // Initialize roles and admin user in development mode
    Task.Run(async () => {
        await ReelState.Server.InitializeDb.InitializeRolesAndAdmin(app);
    }).GetAwaiter().GetResult();
}
else
{
    app.UseHsts();
}

// Global exception handler (all environments; detail is only exposed in Development)
app.UseExceptionHandler();
app.UseStatusCodePages();
app.UseSerilogRequestLogging();

// Create uploads directory in the content root path instead of web root
var contentRootPath = app.Environment.ContentRootPath;
var uploadsPath = Path.Combine(contentRootPath, "uploads");

// Ensure the uploads directory exists
if (!Directory.Exists(uploadsPath))
{
    Directory.CreateDirectory(uploadsPath);
}

// Create subdirectories for different file types
var videosPath = Path.Combine(uploadsPath, "videos");
var photosPath = Path.Combine(uploadsPath, "photos");

if (!Directory.Exists(videosPath))
{
    Directory.CreateDirectory(videosPath);
}

if (!Directory.Exists(photosPath))
{
    Directory.CreateDirectory(photosPath);
}

// Log the upload paths for debugging
Console.WriteLine($"Content Root Path: {contentRootPath}");
Console.WriteLine($"Uploads Path: {uploadsPath}");
Console.WriteLine($"Videos Path: {videosPath}");
Console.WriteLine($"Photos Path: {photosPath}");

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
// Configure the static file middleware to serve files from the uploads folder
app.UseStaticFiles(); // Serve files from wwwroot folder

// Serve files from our custom uploads folder
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads"
});

// Apply CORS policy before authentication
app.UseCors("CorsPolicy");
app.UseRateLimiter();

// Authentication comes before Authorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health", new HealthCheckOptions
{
    ResponseWriter = async (context, report) =>
    {
        context.Response.ContentType = "application/json";
        var result = new
        {
            status = report.Status.ToString(),
            totalDurationMs = Math.Round(report.TotalDuration.TotalMilliseconds, 1),
            checks = report.Entries.Select(e => new
            {
                name = e.Key,
                status = e.Value.Status.ToString(),
                description = e.Value.Description,
                durationMs = Math.Round(e.Value.Duration.TotalMilliseconds, 1)
            })
        };
        await context.Response.WriteAsync(JsonSerializer.Serialize(result));
    }
});
app.MapHub<NotificationHub>("/hubs/notifications");

app.Run();
public partial class Program { }
