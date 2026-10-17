namespace InteriorDesign.Domain.Entities;

public sealed class StockAuditSlip
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string Code { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public Guid? WarehouseId { get; set; }
    public string ScopeLabel { get; set; } = string.Empty;
    public string Creator { get; set; } = string.Empty;
    public string AuditDate { get; set; } = string.Empty;
    public string Status { get; set; } = "in_progress"; // in_progress | completed
    public string StatusLabel { get; set; } = "Đang kiểm đếm";
    public int TotalItems { get; set; }
    public int MatchedItems { get; set; }
    public int DiscrepantItems { get; set; }
    public decimal TotalDifferenceValue { get; set; }
    public string Note { get; set; } = string.Empty;
    public string ItemsJson { get; set; } = "[]";
    public bool IsDeleted { get; set; }
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAt { get; set; }
}
