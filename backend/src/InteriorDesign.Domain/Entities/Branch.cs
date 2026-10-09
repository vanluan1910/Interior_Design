namespace InteriorDesign.Domain.Entities;

public sealed class Branch
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "showroom"; // showroom | warehouse | hybrid | office
    public string TypeLabel { get; set; } = "Showroom Trưng Bày";
    public string Address { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public string ManagerName { get; set; } = string.Empty;
    public string ManagerPhone { get; set; } = string.Empty;
    public string ManagerEmail { get; set; } = string.Empty;
    public decimal Area { get; set; } = 0;
    public int StaffCount { get; set; } = 0;
    public int WarehouseCount { get; set; } = 0;
    public int ActiveOrdersCount { get; set; } = 0;
    public string EstablishedDate { get; set; } = string.Empty;
    public string Status { get; set; } = "active"; // active | inactive
    public bool IsHeadquarter { get; set; } = false;
    public string Description { get; set; } = string.Empty;
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
