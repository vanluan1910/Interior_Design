namespace InteriorDesign.Domain.Entities;

public sealed class InteriorSpace
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Tagline { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Image { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public int DisplayOrder { get; set; } = 0;
    public string Status { get; set; } = "active"; // active | hidden
    public bool ShowOnHome { get; set; } = true;
    public bool ShowOnHeader { get; set; } = true;
    public int CategoryCount { get; set; } = 0;
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
