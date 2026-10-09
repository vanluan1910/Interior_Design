namespace InteriorDesign.Domain.Entities;

public sealed class Supplier
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string ContactPerson { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string TaxCode { get; set; } = string.Empty;
    public string Company { get; set; } = string.Empty;
    public string BankName { get; set; } = string.Empty;
    public string BankAccount { get; set; } = string.Empty;
    public string Province { get; set; } = string.Empty;
    public string Ward { get; set; } = string.Empty;
    public string IdentityNumber { get; set; } = string.Empty;
    public decimal Rating { get; set; } = 5.0m;
    public string Status { get; set; } = "active"; // active, inactive
    public string Note { get; set; } = string.Empty;
    public decimal TotalPurchased { get; set; } = 0;
    public decimal CurrentDebt { get; set; } = 0;
    public decimal TotalCollected { get; set; } = 0;
    public string CreatedBy { get; set; } = "Hệ thống";
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
}
