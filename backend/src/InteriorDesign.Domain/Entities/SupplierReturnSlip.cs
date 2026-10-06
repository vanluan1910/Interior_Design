namespace InteriorDesign.Domain.Entities;

public sealed class SupplierReturnSlip
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string Code { get; set; } = string.Empty;
    public Guid? SupplierId { get; set; }
    public string SupplierName { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public string Unit { get; set; } = "m³";
    public decimal TotalValue { get; set; }
    public string ReturnDate { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public string Status { get; set; } = "refund_deducted";
    public string StatusLabel { get; set; } = "Đã cấn trừ công nợ";
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
}
