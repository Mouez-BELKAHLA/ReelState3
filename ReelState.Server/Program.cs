using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ReelState.Data;
using ReelState.Services;
using System.Text;
using ReelState.Server.Models;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Mvc.Formatters;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.Extensions.FileProviders;
using System.Text.Json.Serialization.Metadata;
using ReelState.Server.Services;

var builder = WebApplication.CreateBuilder(args);

// Configure Kestrel to handle large file uploads
builder.Services.Configure<KestrelServerOptions>(options =>
{
    options.Limits.MaxRequestBodySize = 104857600; // 100MB
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

// Get Google auth config with null safety
var googleClientId = builder.Configuration["Authentication:Google:ClientId"] ??
    throw new InvalidOperationException("Google ClientId configuration is missing");
var googleClientSecret = builder.Configuration["Authentication:Google:ClientSecret"] ??
    throw new InvalidOperationException("Google ClientSecret configuration is missing");

// Adding Authentication
builder.Services.AddAuthentication(options =>
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
})
// Add Google Authentication
.AddGoogle(options =>
{
    options.ClientId = googleClientId;
    options.ClientSecret = googleClientSecret;
    options.CallbackPath = "/api/auth/google-callback";
});

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:5174")
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

// Add Services
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IGoogleAuthService, GoogleAuthService>();
builder.Services.AddScoped<ReelState.Server.Services.NotificationService>();
// Configure static files to serve uploaded files
builder.Services.AddDirectoryBrowser();
builder.Services.AddScoped<NotificationService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "ReelState API v1");
    });

    // In development, detailed errors are helpful
    app.UseDeveloperExceptionPage();
}
else
{
    // In production, use the error handler middleware
    app.UseExceptionHandler("/error");
    app.UseHsts();
}

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

app.UseHttpsRedirection();

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

// Authentication comes before Authorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();