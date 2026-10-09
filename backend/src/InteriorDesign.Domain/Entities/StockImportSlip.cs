namespace InteriorDesign.Domain.Entities;

public sealed class StockImportSlip
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string Code { get; set; } = string.Empty;
    public string Supplier { get; set; } = string.Empty;
    public Guid? SupplierId { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
    public Guid? WarehouseId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string Spec { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public string Unit { get; set; } = "m³";
    public decimal UnitPrice { get; set; }
    public decimal Discount { get; set; }
    public decimal TotalValue { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal RemainingDebt { get; set; }
    public string Mc { get; set; } = "< 12%";
    public string ImportDate { get; set; } = string.Empty;
    public string Status { get; set; } = "completed"; // draft | completed | cancelled
    public string StatusLabel { get; set; } = "Đã nhập kho";
    public string Inspector { get; set; } = string.Empty;
    public string Note { get; set; } = string.Empty;
    public string ItemsJson { get; set; } = "[]";
    public bool IsDeleted { get; set; }
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAt { get; set; }
}
