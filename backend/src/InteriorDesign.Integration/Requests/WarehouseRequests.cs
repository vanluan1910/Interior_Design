namespace InteriorDesign.Integration.Requests;

public sealed record CreateWarehouseRequest
{
    public string? Code { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Type { get; init; } = "finished";
    public string? TypeLabel { get; init; }
    public string? Branch { get; init; }
    public string? Province { get; init; }
    public string? District { get; init; }
    public string? StreetAddress { get; init; }
    public string? Address { get; init; }
    public string? ManagerName { get; init; }
    public string? ManagerPhone { get; init; }
    public decimal CapacityMax { get; init; } = 100;
    public decimal CapacityCurrent { get; init; } = 0;
    public string? CapacityUnit { get; init; } = "sản phẩm";
    public decimal OccupancyPercent { get; init; } = 0;
    public string? HumidityControl { get; init; } = "Điều hòa 24/7";
    public string Status { get; init; } = "active";
    public bool IsDefault { get; init; } = false;
    public string? Description { get; init; }
    public decimal TotalValue { get; init; } = 0;
}

public sealed record UpdateWarehouseRequest
{
    public string? Code { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Type { get; init; } = "finished";
    public string? TypeLabel { get; init; }
    public string? Branch { get; init; }
    public string? Province { get; init; }
    public string? District { get; init; }
    public string? StreetAddress { get; init; }
    public string? Address { get; init; }
    public string? ManagerName { get; init; }
    public string? ManagerPhone { get; init; }
    public decimal CapacityMax { get; init; } = 100;
    public decimal CapacityCurrent { get; init; } = 0;
    public string? CapacityUnit { get; init; } = "sản phẩm";
    public decimal OccupancyPercent { get; init; } = 0;
    public string? HumidityControl { get; init; } = "Điều hòa 24/7";
    public string Status { get; init; } = "active";
    public bool IsDefault { get; init; } = false;
    public string? Description { get; init; }
    public decimal TotalValue { get; init; } = 0;
}

public sealed record UpdateWarehouseStatusRequest
{
    public string Status { get; init; } = "active";
}
