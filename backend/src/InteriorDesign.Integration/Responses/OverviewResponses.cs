namespace InteriorDesign.Integration.Responses;

public sealed record OverviewKpiDto(
    decimal Revenue,
    string RevenueGrowth,
    decimal Cogs,
    decimal CogsPercent,
    decimal Profit,
    decimal ProfitMargin,
    string ProfitGrowth,
    int CompletedOrders,
    int PendingOrders,
    int ReadyStockCount,
    decimal StockValue,
    string StockValueFormatted
);

public sealed record ChartBarDto(
    string Label,
    decimal Total,
    decimal Cogs,
    decimal Profit,
    int Percent,
    bool IsCurrent = false,
    string? Date = null
);

public sealed record ChartSummaryDto(
    decimal TotalRevenue,
    decimal TotalCogs,
    decimal TotalProfit,
    decimal ProfitMargin,
    string GrowthLabel,
    List<ChartBarDto> Bars
);

public sealed record OverviewChartsDto(
    ChartSummaryDto Week,
    ChartSummaryDto Month,
    ChartSummaryDto Year
);

public sealed record TopProductDto(
    int Rank,
    Guid? Id,
    string Name,
    string Collection,
    string Image,
    int SalesCount,
    decimal Revenue,
    decimal Cogs,
    decimal Profit,
    decimal Margin,
    string WoodBadge
);

public sealed record CategoryPerformanceDto(
    Guid? Id,
    string Name,
    decimal Revenue,
    decimal Cogs,
    decimal Profit,
    decimal Margin
);

public sealed record BranchPerformanceDto(
    Guid? Id,
    string Name,
    decimal Revenue,
    decimal Profit,
    decimal Margin,
    int Percent
);

public sealed record OverviewRecentOrderDto(
    Guid Id,
    string OrderCode,
    string CustomerName,
    string CustomerPhone,
    string ProductName,
    string ProductSpec,
    int Quantity,
    decimal Value,
    string Status,
    string StatusLabel,
    string OrderDate
);

public sealed record OverviewDataResponse(
    OverviewKpiDto Kpis,
    OverviewChartsDto Charts,
    List<TopProductDto> TopProducts,
    List<CategoryPerformanceDto> CategoryPerformance,
    List<BranchPerformanceDto> BranchPerformance,
    List<OverviewRecentOrderDto> RecentOrders,
    string SelectedBranch,
    string TimeRange
);
