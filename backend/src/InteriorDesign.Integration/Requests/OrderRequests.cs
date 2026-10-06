namespace InteriorDesign.Integration.Requests;

public sealed record CreateOrderItemRequest(
    Guid ProductId,
    string ProductName,
    string? ProductSku,
    string? ProductImage,
    string? Material,
    string? Dimensions,
    decimal UnitPrice,
    int Quantity
);

public sealed record CreateOrderRequest(
    string CustomerName,
    string CustomerPhone,
    string? CustomerEmail,
    string ShippingAddress,
    string? City,
    string? District,
    string? Note,
    string PaymentMethod,
    List<CreateOrderItemRequest> Items,
    decimal ShippingFee,
    decimal DiscountAmount
);

public sealed record UpdateOrderStatusRequest(string Status);

public sealed record UpdatePaymentStatusRequest(string PaymentStatus);
