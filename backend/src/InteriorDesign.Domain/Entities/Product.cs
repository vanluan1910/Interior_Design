using InteriorDesign.Domain.Enums;

namespace InteriorDesign.Domain.Entities;

public sealed class Product
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public Guid CategoryId { get; set; }
    public Category? Category { get; set; }
    public string Space { get; set; } = "LivingRoom"; // living, dining, bedroom, office, decor
    public decimal Price { get; set; }
    public decimal OriginalPrice { get; set; }
    public int DiscountPercent { get; set; }
    public ProductStatus Status { get; set; } = ProductStatus.Active;
    public string MainImageUrl { get; set; } = string.Empty;
    public List<string> Images { get; set; } = [];
    public string Dimensions { get; set; } = string.Empty;
    public string Material { get; set; } = string.Empty;
    public string WoodType { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public string Warranty { get; set; } = string.Empty;
    public string ShippingNote { get; set; } = string.Empty;
    public decimal Rating { get; set; } = 5.0m;
    public int ReviewCount { get; set; } = 0;
    public bool IsFeatured { get; set; } = false;
    public bool IsNew { get; set; } = false;
    public int InStock { get; set; } = 10;
    public string Unit { get; set; } = "Bộ";
    public string BranchStocksJson { get; set; } = "{}";
    public string ShortDescription { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
