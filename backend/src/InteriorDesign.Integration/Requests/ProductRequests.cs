namespace InteriorDesign.Integration.Requests;

public sealed record CreateProductRequest
{
    public string Name { get; init; } = string.Empty;
    public string? Slug { get; init; }
    public string? Sku { get; init; }
    public string? Code { get; init; } // Alias for Sku
    public Guid CategoryId { get; init; }
    public string? Space { get; init; } = "LivingRoom";
    public decimal Price { get; init; } = 0;
    public decimal? OriginalPrice { get; init; }
    public int DiscountPercent { get; init; } = 0;
    public string? MainImageUrl { get; init; }
    public List<string>? Images { get; init; }
    public string? Dimensions { get; init; }
    public string? Material { get; init; }
    public string? WoodType { get; init; }
    public string? Color { get; init; }
    public string? Warranty { get; init; }
    public string? ShippingNote { get; init; }
    public bool IsFeatured { get; init; } = false;
    public bool IsNew { get; init; } = false;
    public int InStock { get; init; } = 10;
    public string? Unit { get; init; } = "Bộ";
    public string? StockType { get; init; }
    public string? ShortDescription { get; init; }
    public string? Description { get; init; }
    public string? Collection { get; init; }
}

public sealed record UpdateProductRequest
{
    public string Name { get; init; } = string.Empty;
    public string? Slug { get; init; }
    public string? Sku { get; init; }
    public string? Code { get; init; } // Alias for Sku
    public Guid CategoryId { get; init; }
    public string? Space { get; init; }
    public decimal Price { get; init; } = 0;
    public decimal? OriginalPrice { get; init; }
    public int DiscountPercent { get; init; } = 0;
    public string? Status { get; init; }
    public string? MainImageUrl { get; init; }
    public List<string>? Images { get; init; }
    public string? Dimensions { get; init; }
    public string? Material { get; init; }
    public string? WoodType { get; init; }
    public string? Color { get; init; }
    public string? Warranty { get; init; }
    public string? ShippingNote { get; init; }
    public bool IsFeatured { get; init; } = false;
    public bool IsNew { get; init; } = false;
    public int InStock { get; init; } = 10;
    public string? Unit { get; init; } = "Bộ";
    public string? StockType { get; init; }
    public string? ShortDescription { get; init; }
    public string? Description { get; init; }
    public string? Collection { get; init; }
}
