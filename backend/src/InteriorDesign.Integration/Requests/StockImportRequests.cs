namespace InteriorDesign.Integration.Requests;

public sealed record CreateStockImportSlipRequest
{
    public string? Code { get; init; }
    public string Supplier { get; init; } = string.Empty;
    public Guid? SupplierId { get; init; }
    public string WarehouseName { get; init; } = string.Empty;
    public Guid? WarehouseId { get; init; }
    public string ItemName { get; init; } = string.Empty;
    public string? Spec { get; init; }
    public decimal Quantity { get; init; } = 1;
    public string? Unit { get; init; } = "m³";
    public decimal UnitPrice { get; init; } = 0;
    public decimal Discount { get; init; } = 0;
    public decimal TotalValue { get; init; } = 0;
    public decimal PaidAmount { get; init; } = 0;
    public decimal RemainingDebt { get; init; } = 0;
    public string? Mc { get; init; } = "< 12%";
    public string? ImportDate { get; init; }
    public string Status { get; init; } = "completed";
    public string? StatusLabel { get; init; } = "Đã nhập kho";
    public string? Inspector { get; init; }
    public string? Note { get; init; }
    public string? ItemsJson { get; init; } = "[]";
}

public sealed record UpdateStockImportSlipRequest
{
    public string? Code { get; init; }
    public string? Supplier { get; init; }
    public Guid? SupplierId { get; init; }
    public string? WarehouseName { get; init; }
    public Guid? WarehouseId { get; init; }
    public string? ItemName { get; init; }
    public string? Spec { get; init; }
    public decimal? Quantity { get; init; }
    public string? Unit { get; init; }
    public decimal? UnitPrice { get; init; }
    public decimal? Discount { get; init; }
    public decimal? TotalValue { get; init; }
    public decimal? PaidAmount { get; init; }
    public decimal? RemainingDebt { get; init; }
    public string? Mc { get; init; }
    public string? ImportDate { get; init; }
    public string? Status { get; init; }
    public string? StatusLabel { get; init; }
    public string? Inspector { get; init; }
    public string? Note { get; init; }
    public string? ItemsJson { get; init; }
}

public sealed record BulkDeleteStockImportSlipsRequest
{
    public List<Guid> Ids { get; init; } = new();
}
