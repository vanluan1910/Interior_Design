namespace InteriorDesign.Domain.Entities;

public sealed class Warehouse
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "finished"; // showroom | finished | main | ready | transit
    public string TypeLabel { get; set; } = "Kho Thành Phẩm";
    public string Branch { get; set; } = string.Empty;
    public string Province { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public string StreetAddress { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string ManagerName { get; set; } = string.Empty;
    public string ManagerPhone { get; set; } = string.Empty;
    public decimal CapacityMax { get; set; } = 100;
    public decimal CapacityCurrent { get; set; } = 0;
    public string CapacityUnit { get; set; } = "sản phẩm";
    public decimal OccupancyPercent { get; set; } = 0;
    public string HumidityControl { get; set; } = "Điều hòa 24/7";
    public string Status { get; set; } = "active"; // active | inactive
    public bool IsDefault { get; set; } = false;
    public string Description { get; set; } = string.Empty;
    public decimal TotalValue { get; set; } = 0;
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
