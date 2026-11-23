using System.Text.Json;

static class McpTransport
{
    private const string Protocol = "2025-11-25";
    private const string Tool = "verify_dispatch";
    private static readonly object Schema = new
    {
        type = "object",
        properties = new { shipment = new { type = "string" }, document = new { type = "string" } },
        required = new[] { "shipment", "document" },
        additionalProperties = false
    };

    public static async Task Run(Fixtures data, JsonSerializerOptions json)
    {
        while (await Console.In.ReadLineAsync() is { } line)
        {
            try
            {
                using var parsed = JsonDocument.Parse(line);
                var request = parsed.RootElement;
                if (request.ValueKind != JsonValueKind.Object ||
                    Text(request, "jsonrpc") != "2.0" ||
                    Text(request, "method") is not { } method)
                {
                    await Output(new { jsonrpc = "2.0", id = (object?)null, error = new { code = -32600, message = "Invalid request" } }, json);
                    continue;
                }
                if (!request.TryGetProperty("id", out var id)) continue;
                request.TryGetProperty("params", out var parameters);
                object? result = method switch
                {
                    "initialize" => new { protocolVersion = Protocol, capabilities = new { tools = new { listChanged = false } }, serverInfo = new { name = "aardvarkland-dispatch", version = "1.0.0" } },
                    "ping" => new { },
                    "tools/list" => new { tools = new[] { new { name = Tool, description = "Verify dispatch status against an exact warehouse document.", inputSchema = Schema } } },
                    "tools/call" when Text(parameters, "name") == Tool => Call(data, parameters, json),
                    _ => null
                };
                if (result is null)
                {
                    var isCall = method == "tools/call";
                    await Output(new { jsonrpc = "2.0", id, error = new { code = isCall ? -32602 : -32601, message = isCall ? "Unknown tool" : "Unknown method" } }, json);
                }
                else await Output(new { jsonrpc = "2.0", id, result }, json);
            }
            catch (JsonException)
            {
                await Output(new { jsonrpc = "2.0", id = (object?)null, error = new { code = -32700, message = "Parse error" } }, json);
            }
        }
    }

    private static object Call(Fixtures data, JsonElement parameters, JsonSerializerOptions json)
    {
        if (parameters.TryGetProperty("arguments", out var args) &&
            Text(args, "shipment") is { } shipment && Text(args, "document") is { } document &&
            Dispatch.Verify(data, shipment, document) is { } verification)
        {
            return new
            {
                content = new[] { new { type = "text", text = JsonSerializer.Serialize(verification, json) } },
                structuredContent = verification,
                isError = false
            };
        }
        return new { content = new[] { new { type = "text", text = "Provide a known shipment and a document identifier." } }, isError = true };
    }

    private static string? Text(JsonElement element, string key) =>
        element.ValueKind == JsonValueKind.Object && element.TryGetProperty(key, out var value) && value.ValueKind == JsonValueKind.String
            ? value.GetString() : null;

    private static Task Output(object message, JsonSerializerOptions json) =>
        Console.Out.WriteLineAsync(JsonSerializer.Serialize(message, json));
}
