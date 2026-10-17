namespace InteriorDesign.Integration.Requests;

public sealed record CreateSpaceRequest
{
    public string? Code { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Slug { get; init; }
    public string? Tagline { get; init; }
    public string? Description { get; init; }
    public string? Image { get; init; }
    public string? Icon { get; init; }
    public int DisplayOrder { get; init; } = 1;
    public string Status { get; init; } = "active";
    public bool ShowOnHome { get; init; } = true;
    public bool ShowOnHeader { get; init; } = true;
}

public sealed record UpdateSpaceRequest
{
    public string? Code { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Slug { get; init; }
    public string? Tagline { get; init; }
    public string? Description { get; init; }
    public string? Image { get; init; }
    public string? Icon { get; init; }
    public int DisplayOrder { get; init; } = 1;
    public string Status { get; init; } = "active";
    public bool ShowOnHome { get; init; } = true;
    public bool ShowOnHeader { get; init; } = true;
}

public sealed record UpdateSpaceStatusRequest
{
    public string Status { get; init; } = "active";
}

public sealed record SpaceStatsResponse(
    int TotalSpaces,
    int ActiveSpaces,
    int HiddenSpaces,
    int TotalLinkedCategories
);

