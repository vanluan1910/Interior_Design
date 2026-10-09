namespace InteriorDesign.Domain.Entities;

public sealed class Employee
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string? Code { get; set; } = string.Empty;
    public string? Name { get; set; } = string.Empty;
    public string? Phone { get; set; } = string.Empty;
    public string? IdNumber { get; set; } = string.Empty;
    public string? Gender { get; set; } = "Nam"; // Nam / Nữ
    public string? Birthday { get; set; } = string.Empty;
    public string? Email { get; set; } = string.Empty;
    public string? Address { get; set; } = string.Empty;
    public string? Department { get; set; } = "Showroom Kinh Doanh";
    public string? Title { get; set; } = "Chuyên viên Tư vấn";
    public string? Branch { get; set; } = "Showroom Quận 10 (HQ)";
    public Guid? BranchId { get; set; }
    public string? Login { get; set; } = string.Empty;
    public string? Username { get; set; } = string.Empty;
    public string? Role { get; set; } = "Staff";
    public string? Status { get; set; } = "working"; // working / resigned
    public string? WorkingDate { get; set; } = string.Empty;
    public string? Area { get; set; } = string.Empty;
    public string? Ward { get; set; } = string.Empty;
    public string? AddressDetail { get; set; } = string.Empty;
    public decimal Debt { get; set; } = 0;
    public string? Note { get; set; } = string.Empty;
    public string? Facebook { get; set; } = string.Empty;
    public string? Zalo { get; set; } = string.Empty;
    public string? SkillsJson { get; set; } = "[]";
    public bool IsDeleted { get; set; } = false;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
