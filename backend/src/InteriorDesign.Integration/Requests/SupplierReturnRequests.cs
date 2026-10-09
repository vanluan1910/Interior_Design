namespace InteriorDesign.Integration.Requests;

public sealed record CreateSupplierReturnSlipRequest
{
    public string? Code { get; init; }
    public string? SourceImportCode { get; init; }
    public Guid? SupplierId { get; init; }
    public string SupplierName { get; init; } = string.Empty;
    public Guid? WarehouseId { get; init; }
    public string WarehouseName { get; init; } = string.Empty;
    public string ItemName { get; init; } = string.Empty;
    public decimal Quantity { get; init; } = 1;
    public string? Unit { get; init; } = "m³";
    public decimal TotalValue { get; init; } = 0;
    public decimal Discount { get; init; } = 0;
    public decimal SupplierRefund { get; init; } = 0;
    public decimal PaidAmount { get; init; } = 0;
    public string? ReturnDate { get; init; }
    public string? Reason { get; init; }
    public string? Solution { get; init; }
    public string? PaymentMethod { get; init; } = "Chuyển khoản";
    public string Status { get; init; } = "completed";
    public string? StatusLabel { get; init; } = "Đã cấn trừ công nợ";
    public string? StaffName { get; init; }
    public string? Note { get; init; }
    public string? ItemsJson { get; init; } = "[]";
}

public sealed record UpdateSupplierReturnSlipRequest
{
    public string? Code { get; init; }
    public string? SourceImportCode { get; init; }
    public Guid? SupplierId { get; init; }
    public string? SupplierName { get; init; }
    public Guid? WarehouseId { get; init; }
    public string? WarehouseName { get; init; }
    public string? ItemName { get; init; }
    public decimal? Quantity { get; init; }
    public string? Unit { get; init; }
    public decimal? TotalValue { get; init; }
    public decimal? Discount { get; init; }
    public decimal? SupplierRefund { get; init; }
    public decimal? PaidAmount { get; init; }
    public string? ReturnDate { get; init; }
    public string? Reason { get; init; }
    public string? Solution { get; init; }
    public string? PaymentMethod { get; init; }
    public string? Status { get; init; }
    public string? StatusLabel { get; init; }
    public string? StaffName { get; init; }
    public string? Note { get; init; }
    public string? ItemsJson { get; init; }
}

public sealed record BulkDeleteSupplierReturnSlipsRequest
{
    public List<Guid> Ids { get; init; } = new();
}
