namespace InteriorDesign.Integration.Requests;

public sealed record CreateCategoryRequest
{
    public string? Code { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Slug { get; init; }
    public string? Description { get; init; }
    public string? ImageUrl { get; init; }
    public string? Icon { get; init; }
    public string? Space { get; init; }
    public Guid? SpaceId { get; init; }
    public int DisplayOrder { get; init; } = 1;
    public string? FeaturedProduct { get; init; }
    public string? Badge { get; init; }
    public bool ShowOnHome { get; init; } = true;
    public bool ShowOnMenu { get; init; } = true;
    public string Status { get; init; } = "active";
}

public sealed record UpdateCategoryRequest
{
    public string? Code { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Slug { get; init; }
    public string? Description { get; init; }
    public string? ImageUrl { get; init; }
    public string? Icon { get; init; }
    public string? Space { get; init; }
    public Guid? SpaceId { get; init; }
    public int DisplayOrder { get; init; } = 1;
    public string? FeaturedProduct { get; init; }
    public string? Badge { get; init; }
    public bool ShowOnHome { get; init; } = true;
    public bool ShowOnMenu { get; init; } = true;
    public string Status { get; init; } = "active";
}

public sealed record UpdateCategoryStatusRequest
{
    public string Status { get; init; } = "active";
}

public sealed record CategoryStatsResponse(
    int TotalCategories,
    int ActiveCategories,
    int HiddenCategories,
    int TotalProductsAssigned
);

