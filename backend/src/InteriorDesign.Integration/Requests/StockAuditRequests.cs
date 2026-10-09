namespace InteriorDesign.Integration.Requests;

public sealed record CreateStockAuditSlipRequest
{
    public string? Code { get; init; }
    public string Title { get; init; } = string.Empty;
    public Guid? WarehouseId { get; init; }
    public string ScopeLabel { get; init; } = string.Empty;
    public string? Creator { get; init; }
    public string? AuditDate { get; init; }
    public string Status { get; init; } = "in_progress";
    public string? StatusLabel { get; init; } = "Đang kiểm đếm";
    public int TotalItems { get; init; } = 0;
    public int MatchedItems { get; init; } = 0;
    public int DiscrepantItems { get; init; } = 0;
    public decimal TotalDifferenceValue { get; init; } = 0;
    public string? Note { get; init; }
    public string? ItemsJson { get; init; } = "[]";
}

public sealed record UpdateStockAuditSlipRequest
{
    public string? Code { get; init; }
    public string? Title { get; init; }
    public Guid? WarehouseId { get; init; }
    public string? ScopeLabel { get; init; }
    public string? Creator { get; init; }
    public string? AuditDate { get; init; }
    public string? Status { get; init; }
    public string? StatusLabel { get; init; }
    public int? TotalItems { get; init; }
    public int? MatchedItems { get; init; }
    public int? DiscrepantItems { get; init; }
    public decimal? TotalDifferenceValue { get; init; }
    public string? Note { get; init; }
    public string? ItemsJson { get; init; }
}

public sealed record CompleteStockAuditSlipRequest
{
    public string? Note { get; init; }
    public string? ItemsJson { get; init; }
}

public sealed record BulkDeleteStockAuditSlipsRequest
{
    public List<Guid> Ids { get; init; } = new();
}
