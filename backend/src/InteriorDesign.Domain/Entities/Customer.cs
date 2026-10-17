namespace InteriorDesign.Domain.Entities;

public sealed class Customer
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string Code { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Phone2 { get; set; }
    public string? Email { get; set; }
    public string? Facebook { get; set; }
    public string? Zalo { get; set; }
    public string? Gender { get; set; } // male, female, other
    public DateTimeOffset? Birthday { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? Branch { get; set; }
    public string? CustomerType { get; set; } = "individual"; // individual, organization
    public string? Type { get; set; } = "retail"; // vip, architect, retail, corporate
    public string? Tier { get; set; } = "standard"; // standard, silver, gold, diamond
    public string? SalesRep { get; set; }
    public string? Notes { get; set; }

    // Organization specific fields
    public string? CompanyName { get; set; }
    public string? BuyerName { get; set; }
    public string? TaxId { get; set; }
    public string? InvoiceAddress { get; set; }

    // Identification & Banking
    public string? IdNumber { get; set; }
    public string? Passport { get; set; }
    public string? BankName { get; set; }
    public string? BankAccount { get; set; }

    // Design & preferences
    public string? PreferredStyle { get; set; }
    public string? ProjectLocation { get; set; }

    // Financial & metrics
    public decimal TotalSpent { get; set; } = 0;
    public decimal Debt { get; set; } = 0;
    public int OrderCount { get; set; } = 0;
    public int RewardPoints { get; set; } = 0;
    public DateTimeOffset? LastOrderDate { get; set; }

    public string Status { get; set; } = "active"; // active, inactive
    public bool IsDeleted { get; set; } = false;
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
