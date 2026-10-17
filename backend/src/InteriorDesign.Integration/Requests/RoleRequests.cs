namespace InteriorDesign.Integration.Requests;

public sealed record CreateRoleRequest(
    string Code,
    string Name,
    string? Description = null,
    string? Status = "active",
    List<string>? Permissions = null,
    string? TemplateRoleId = null
);

public sealed record UpdateRoleRequest(
    string? Code = null,
    string? Name = null,
    string? Description = null,
    string? Status = null,
    List<string>? Permissions = null
);

public sealed record UpdateRolePermissionsRequest(
    List<string> Permissions
);

public sealed record CloneRoleRequest(
    string? NewCode = null,
    string? NewName = null,
    string? Description = null
);
