namespace InteriorDesign.Domain.Entities;

public sealed class Category
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public string Space { get; set; } = string.Empty;
    public Guid? SpaceId { get; set; }
    public int DisplayOrder { get; set; } = 0;
    public int ProductCount { get; set; } = 0;
    public string FeaturedProduct { get; set; } = string.Empty;
    public string Badge { get; set; } = string.Empty;
    public bool ShowOnHome { get; set; } = true;
    public bool ShowOnMenu { get; set; } = true;
    public string Status { get; set; } = "active"; // active | hidden
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public List<Product> Products { get; set; } = [];
}
