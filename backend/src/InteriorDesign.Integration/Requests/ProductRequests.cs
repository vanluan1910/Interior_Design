namespace InteriorDesign.Integration.Requests;

public sealed record CreateProductRequest(
    string Name,
    string? Slug,
    string Sku,
    Guid CategoryId,
    string Space,
    decimal Price,
    decimal? OriginalPrice,
    int DiscountPercent,
    string? MainImageUrl,
    List<string>? Images,
    string? Dimensions,
    string? Material,
    string? WoodType,
    bool IsFeatured,
    bool IsNew,
    int InStock,
    string? ShortDescription,
    string? Description
);

public sealed record UpdateProductRequest(
    string Name,
    string? Slug,
    string Sku,
    Guid CategoryId,
    string Space,
    decimal Price,
    decimal? OriginalPrice,
    int DiscountPercent,
    string? Status,
    string? MainImageUrl,
    List<string>? Images,
    string? Dimensions,
    string? Material,
    string? WoodType,
    bool IsFeatured,
    bool IsNew,
    int InStock,
    string? ShortDescription,
    string? Description
);
