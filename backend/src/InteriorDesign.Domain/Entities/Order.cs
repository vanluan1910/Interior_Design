using InteriorDesign.Domain.Enums;

namespace InteriorDesign.Domain.Entities;

public sealed class Order
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string OrderCode { get; set; } = string.Empty;
    public string OrderType { get; set; } = "retail"; // retail, custom, package, project, subcontract, ready
    public Guid? CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public string ShippingAddress { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public string? ProductName { get; set; }
    public string? ProductSpec { get; set; }
    public string? WoodType { get; set; }
    public string? SpaceType { get; set; }
    public string? Branch { get; set; }
    public string? Showroom { get; set; }
    public DateTimeOffset OrderDate { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? DeadlineDate { get; set; }
    public string Note { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = "VietQR"; // VietQR, COD, BankTransfer, CreditCard, Cash
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public decimal SubTotal { get; set; }
    public decimal DepositPercent { get; set; } = 0;
    public decimal DepositAmount { get; set; } = 0;
    public string? DepositNote { get; set; }
    public decimal ShippingFee { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public List<OrderItem> Items { get; set; } = [];
    public bool IsDeleted { get; set; } = false;
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
