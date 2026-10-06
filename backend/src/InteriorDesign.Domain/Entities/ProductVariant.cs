namespace InteriorDesign.Domain.Entities;

public sealed class ProductVariant
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid ProductId { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string MaterialName { get; set; } = string.Empty;
    public string ColorName { get; set; } = string.Empty;
    public string DimensionText { get; set; } = string.Empty;
    public decimal PriceAdjustment { get; set; } = 0;
    public int StockQuantity { get; set; } = 10;
}
