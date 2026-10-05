using System.Diagnostics;
using System.Text;
using System.Text.Json;

namespace ReelState.Server.Services;

public class GeminiService
{
    private static readonly int[] RetryableStatusCodes = { 429, 500, 503, 504 };
    private const int MaxAttemptsPerModel = 3;

    private readonly HttpClient _http;
    private readonly IConfiguration _config;
    private readonly ILogger<GeminiService> _logger;

    public GeminiService(HttpClient http, IConfiguration config, ILogger<GeminiService> logger)
    {
        _http = http;
        _config = config;
        _logger = logger;
    }

    public async Task<string> GenerateJsonAsync(string prompt, CancellationToken ct = default)
    {
        var apiKey = _config["Gemini:ApiKey"]
            ?? throw new InvalidOperationException("Gemini:ApiKey is not configured.");

        var models = _config.GetSection("Gemini:Models").Get<string[]>()
            ?? new[] { "gemini-3.8-flash", "gemini-3.5-flash" };

        var body = JsonSerializer.Serialize(new
        {
            contents = new[] { new { parts = new[] { new { text = prompt } } } },
            generationConfig = new
            {
                temperature = 0.2,
                maxOutputTokens = 4000,
                responseMimeType = "application/json"
            }
        });

        var lastError = "Gemini request failed.";

        foreach (var model in models)
        {
            for (var attempt = 0; attempt < MaxAttemptsPerModel; attempt++)
            {
                var timer = Stopwatch.StartNew();

                using var request = new HttpRequestMessage(
                    HttpMethod.Post,
                    $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent");
                request.Headers.Add("x-goog-api-key", apiKey);
                request.Content = new StringContent(body, Encoding.UTF8, "application/json");

                using var response = await _http.SendAsync(request, ct);
                var json = await response.Content.ReadAsStringAsync(ct);
                timer.Stop();

                var status = (int)response.StatusCode;

                if (response.IsSuccessStatusCode)
                {
                    using var doc = JsonDocument.Parse(json);

                    var tokens = doc.RootElement.TryGetProperty("usageMetadata", out var usage)
                        && usage.TryGetProperty("totalTokenCount", out var total)
                            ? total.GetInt32()
                            : -1;

                    _logger.LogInformation(
                        "Gemini call ok: model={Model} attempt={Attempt} latencyMs={Latency} totalTokens={Tokens}",
                        model, attempt + 1, timer.ElapsedMilliseconds, tokens);

                    return doc.RootElement
                        .GetProperty("candidates")[0]
                        .GetProperty("content")
                        .GetProperty("parts")[0]
                        .GetProperty("text")
                        .GetString() ?? "";
                }

                lastError = $"Gemini {model} returned {status}.";
                _logger.LogWarning(
                    "Gemini call failed: model={Model} attempt={Attempt} status={Status} latencyMs={Latency}",
                    model, attempt + 1, status, timer.ElapsedMilliseconds);

                // Log the reason Google gave (first 500 chars; it contains no key)
                _logger.LogWarning("Gemini error body: {Body}", json.Length > 500 ? json[..500] : json);

                if (status == 404 || status == 429) break; // 429: go straight to the next model

                if (!RetryableStatusCodes.Contains(status))
                    throw new InvalidOperationException(lastError);

                // 500/503/504: overloaded, so retry with backoff, but don't wait after the last attempt
                if (attempt < MaxAttemptsPerModel - 1)
                    await Task.Delay(1000 * (1 << attempt), ct);
            }
        }

        throw new InvalidOperationException(lastError);
    }
}