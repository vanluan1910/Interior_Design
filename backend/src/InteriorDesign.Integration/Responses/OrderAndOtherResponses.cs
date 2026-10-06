namespace InteriorDesign.Integration.Responses;

public sealed record OrderItemDto(
    Guid Id,
    Guid ProductId,
    string ProductName,
    string ProductSku,
    string ProductImage,
    string Material,
    string Dimensions,
    decimal UnitPrice,
    int Quantity,
    decimal TotalPrice
);

public sealed record OrderDto(
    Guid Id,
    string OrderCode,
    Guid? CustomerId,
    string CustomerName,
    string CustomerPhone,
    string CustomerEmail,
    string ShippingAddress,
    string City,
    string District,
    string Note,
    string PaymentMethod,
    string PaymentStatus,
    string Status,
    decimal SubTotal,
    decimal ShippingFee,
    decimal DiscountAmount,
    decimal TotalAmount,
    List<OrderItemDto> Items,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt
);

public sealed record ConsultationDto(
    Guid Id,
    string FullName,
    string Phone,
    string Email,
    string Address,
    DateTimeOffset? PreferredDate,
    string SpaceType,
    string DesignStyle,
    string BudgetRange,
    string Notes,
    string Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt
);

public sealed record StoreSettingDto(
    Guid Id,
    string StoreName,
    string Hotline,
    string Email,
    string Address,
    string LogoUrl,
    string HeroBannerUrl,
    string BankName,
    string BankAccountName,
    string BankAccountNumber,
    string VietQrCodeUrl,
    string SocialLinksJson,
    DateTimeOffset UpdatedAt
);

public sealed record DashboardSummaryDto(
    decimal TotalRevenue,
    int TotalOrders,
    int PendingOrders,
    int TotalProducts,
    int TotalConsultations,
    int TotalCustomers,
    List<OrderDto> RecentOrders,
    List<ConsultationDto> RecentConsultations
);
