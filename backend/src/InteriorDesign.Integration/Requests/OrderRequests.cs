namespace InteriorDesign.Integration.Requests;

public sealed record CreateOrderItemRequest
{
    public Guid? ProductId { get; init; }
    public string ProductName { get; init; } = string.Empty;
    public string? ProductSku { get; init; }
    public string? ProductImage { get; init; }
    public string? Material { get; init; }
    public string? Dimensions { get; init; }
    public decimal UnitPrice { get; init; }
    public int Quantity { get; init; } = 1;
}

public sealed record CreateOrderRequest
{
    public string? OrderCode { get; init; }
    public string? OrderType { get; init; } = "retail";
    public Guid? CustomerId { get; init; }
    public string CustomerName { get; init; } = string.Empty;
    public string CustomerPhone { get; init; } = string.Empty;
    public string? CustomerEmail { get; init; }
    public string? ShippingAddress { get; init; }
    public string? CustomerAddress { get; init; }
    public string? CustomerProvince { get; init; }
    public string? CustomerDistrict { get; init; }
    public string? City { get; init; }
    public string? District { get; init; }
    public string? ProductName { get; init; }
    public string? ProductSpec { get; init; }
    public string? WoodType { get; init; }
    public string? SpaceType { get; init; }
    public string? Branch { get; init; }
    public string? Showroom { get; init; }
    public string? OrderDate { get; init; }
    public string? DeadlineDate { get; init; }
    public string? Note { get; init; }
    public string? PaymentMethod { get; init; }
    public string? Status { get; init; } = "pending";
    public string? PaymentStatus { get; init; } = "pending";
    public decimal? Value { get; init; }
    public decimal? DepositPercent { get; init; }
    public decimal? DepositAmount { get; init; }
    public string? DepositNote { get; init; }
    public decimal ShippingFee { get; init; } = 0;
    public decimal DiscountAmount { get; init; } = 0;
    public List<CreateOrderItemRequest>? Items { get; init; } = new();
}

public sealed record UpdateOrderRequest
{
    public string? OrderCode { get; init; }
    public string? OrderType { get; init; }
    public Guid? CustomerId { get; init; }
    public string CustomerName { get; init; } = string.Empty;
    public string CustomerPhone { get; init; } = string.Empty;
    public string? CustomerEmail { get; init; }
    public string? ShippingAddress { get; init; }
    public string? CustomerAddress { get; init; }
    public string? CustomerProvince { get; init; }
    public string? CustomerDistrict { get; init; }
    public string? City { get; init; }
    public string? District { get; init; }
    public string? ProductName { get; init; }
    public string? ProductSpec { get; init; }
    public string? WoodType { get; init; }
    public string? SpaceType { get; init; }
    public string? Branch { get; init; }
    public string? Showroom { get; init; }
    public string? OrderDate { get; init; }
    public string? DeadlineDate { get; init; }
    public string? Note { get; init; }
    public string? PaymentMethod { get; init; }
    public string? Status { get; init; }
    public string? PaymentStatus { get; init; }
    public decimal? Value { get; init; }
    public decimal? DepositPercent { get; init; }
    public decimal? DepositAmount { get; init; }
    public string? DepositNote { get; init; }
    public decimal ShippingFee { get; init; } = 0;
    public decimal DiscountAmount { get; init; } = 0;
    public List<CreateOrderItemRequest>? Items { get; init; }
}

public sealed record UpdateOrderStatusRequest(string Status, string? Note = null);

public sealed record UpdatePaymentStatusRequest(string PaymentStatus, decimal? PaidAmount = null, string? PaymentMethod = null);

public sealed record BulkUpdateOrderStatusRequest(List<Guid> OrderIds, string Status, string? Note = null);
