namespace InteriorDesign.Domain.Entities;

public sealed class SupplierReturnSlip
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string Code { get; set; } = string.Empty;
    public string SourceImportCode { get; set; } = string.Empty;
    public Guid? SupplierId { get; set; }
    public string SupplierName { get; set; } = string.Empty;
    public Guid? WarehouseId { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public string Unit { get; set; } = "m³";
    public decimal TotalValue { get; set; }
    public decimal Discount { get; set; }
    public decimal SupplierRefund { get; set; }
    public decimal PaidAmount { get; set; }
    public string ReturnDate { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public string Solution { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = "Chuyển khoản";
    public string Status { get; set; } = "completed"; // draft | completed
    public string StatusLabel { get; set; } = "Đã cấn trừ công nợ";
    public string StaffName { get; set; } = string.Empty;
    public string Note { get; set; } = string.Empty;
    public string ItemsJson { get; set; } = "[]";
    public bool IsDeleted { get; set; }
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAt { get; set; }
}
