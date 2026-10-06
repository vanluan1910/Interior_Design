namespace InteriorDesign.Domain.Entities;

public sealed class StockImportSlip
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string Code { get; set; } = string.Empty;
    public string Supplier { get; set; } = string.Empty;
    public Guid? SupplierId { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public string Spec { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public string Unit { get; set; } = "m³";
    public string Mc { get; set; } = "< 12%";
    public decimal TotalValue { get; set; }
    public string ImportDate { get; set; } = string.Empty;
    public string Status { get; set; } = "completed";
    public string StatusLabel { get; set; } = "Đã nhập kho";
    public string Inspector { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
}
