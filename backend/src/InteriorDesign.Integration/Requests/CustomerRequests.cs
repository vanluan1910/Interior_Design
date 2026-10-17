namespace InteriorDesign.Integration.Requests;

public sealed record CreateCustomerRequest
{
    public string? Code { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Phone { get; init; } = string.Empty;
    public string? Phone2 { get; init; }
    public string? Email { get; init; }
    public string? Facebook { get; init; }
    public string? Zalo { get; init; }
    public string? Gender { get; init; }
    public string? Birthday { get; init; }
    public string? Address { get; init; }
    public string? City { get; init; }
    public string? Branch { get; init; }
    public string? CustomerType { get; init; } = "individual";
    public string? Type { get; init; } = "retail";
    public string? Tier { get; init; } = "standard";
    public string? SalesRep { get; init; }
    public string? Notes { get; init; }

    public string? CompanyName { get; init; }
    public string? BuyerName { get; init; }
    public string? TaxId { get; init; }
    public string? InvoiceAddress { get; init; }

    public string? IdNumber { get; init; }
    public string? Passport { get; init; }
    public string? BankName { get; init; }
    public string? BankAccount { get; init; }

    public string? PreferredStyle { get; init; }
    public string? ProjectLocation { get; init; }
    public string? Status { get; init; } = "active";
}

public sealed record UpdateCustomerRequest
{
    public string? Code { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Phone { get; init; } = string.Empty;
    public string? Phone2 { get; init; }
    public string? Email { get; init; }
    public string? Facebook { get; init; }
    public string? Zalo { get; init; }
    public string? Gender { get; init; }
    public string? Birthday { get; init; }
    public string? Address { get; init; }
    public string? City { get; init; }
    public string? Branch { get; init; }
    public string? CustomerType { get; init; }
    public string? Type { get; init; }
    public string? Tier { get; init; }
    public string? SalesRep { get; init; }
    public string? Notes { get; init; }

    public string? CompanyName { get; init; }
    public string? BuyerName { get; init; }
    public string? TaxId { get; init; }
    public string? InvoiceAddress { get; init; }

    public string? IdNumber { get; init; }
    public string? Passport { get; init; }
    public string? BankName { get; init; }
    public string? BankAccount { get; init; }

    public string? PreferredStyle { get; init; }
    public string? ProjectLocation { get; init; }
    public string? Status { get; init; }
}

public sealed record CollectDebtRequest
{
    public decimal Amount { get; init; }
    public string? PaymentMethod { get; init; } = "transfer"; // cash, transfer, card
    public string? Note { get; init; }
}
