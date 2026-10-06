namespace InteriorDesign.Integration.Requests;

public sealed record CreateCategoryRequest(
    string Name,
    string? Slug,
    string? Description,
    string? ImageUrl,
    string? Icon,
    string? Space,
    int DisplayOrder
);

public sealed record UpdateCategoryRequest(
    string Name,
    string? Slug,
    string? Description,
    string? ImageUrl,
    string? Icon,
    string? Space,
    int DisplayOrder,
    bool IsActive
);
