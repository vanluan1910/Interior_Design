namespace InteriorDesign.Domain.Entities;

public sealed class OrderItem
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid OrderId { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductSku { get; set; } = string.Empty;
    public string ProductImage { get; set; } = string.Empty;
    public string Material { get; set; } = string.Empty;
    public string Dimensions { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; } = 1;
    public decimal TotalPrice { get; set; }
}
