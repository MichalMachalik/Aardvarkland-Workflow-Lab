using System.Text.Json;

var json = new JsonSerializerOptions(JsonSerializerDefaults.Web);
var path = Path.Combine(AppContext.BaseDirectory, "fixtures.json");
var fixtures = JsonSerializer.Deserialize<Fixtures>(File.ReadAllText(path), json)
    ?? throw new InvalidOperationException("Expected connector fixtures.");

if (args.Contains("--mcp", StringComparer.Ordinal))
{
    await McpTransport.Run(fixtures, json);
    return;
}

var app = WebApplication.CreateBuilder(args).Build();
app.MapGet("/api/verify", (string shipment, string document) =>
    Dispatch.Verify(fixtures, shipment, document) is { } result
        ? Results.Ok(result) : Results.NotFound(new { error = "Zásilka nebyla nalezena." }));
app.Run("http://127.0.0.1:4181");

record Fixtures(Shipment[] Shipments, Evidence[] Documents);
record Shipment(string Id, string Name, string Status, string? RequiredKind);
record Evidence(string Id, string ShipmentId, string Kind, string Title, string Note);
record Verification(string Code, string ShipmentId, string? Status, Evidence? Evidence);

static class Dispatch
{
    public static Verification? Verify(Fixtures data, string shipmentId, string documentId)
    {
        var shipment = data.Shipments.SingleOrDefault(item => item.Id == shipmentId);
        if (shipment is null) return null;
        var document = data.Documents.SingleOrDefault(item => item.Id == documentId);
        if (document is null) return new("missing", shipmentId, null, null);
        if (document.ShipmentId != shipmentId) return new("unrelated", shipmentId, null, null);
        if (document.Kind != shipment.RequiredKind) return new("insufficient", shipmentId, null, document);
        return new("verified", shipmentId, shipment.Status, document);
    }
}
