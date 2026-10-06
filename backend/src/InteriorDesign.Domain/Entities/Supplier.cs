namespace InteriorDesign.Domain.Entities;

public sealed class Supplier
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string ContactPerson { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string TaxCode { get; set; } = string.Empty;
    public decimal Rating { get; set; } = 5.0m;
    public string Status { get; set; } = "active"; // active, paused
    public string Note { get; set; } = string.Empty;
    public decimal TotalPurchased { get; set; } = 0;
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
}
