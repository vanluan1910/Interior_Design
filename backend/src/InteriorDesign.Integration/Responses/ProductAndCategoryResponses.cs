namespace InteriorDesign.Integration.Responses;

public sealed record ProductDto(
    Guid Id,
    string Name,
    string Slug,
    string Sku,
    Guid CategoryId,
    string? CategoryName,
    string Space,
    decimal Price,
    decimal OriginalPrice,
    int DiscountPercent,
    string Status,
    string MainImageUrl,
    List<string> Images,
    string Dimensions,
    string Material,
    string WoodType,
    decimal Rating,
    int ReviewCount,
    bool IsFeatured,
    bool IsNew,
    int InStock,
    string ShortDescription,
    string Description,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt
);

public sealed record CategoryDto(
    Guid Id,
    string Name,
    string Slug,
    string Description,
    string ImageUrl,
    string Icon,
    string Space,
    int DisplayOrder,
    bool IsActive,
    int ProductCount
);
