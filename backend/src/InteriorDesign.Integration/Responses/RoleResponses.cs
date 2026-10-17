namespace InteriorDesign.Integration.Responses;

public sealed record RoleResponse(
    Guid Id,
    string Code,
    string Name,
    string Description,
    int UserCount,
    bool IsSystem,
    string Status,
    List<string> Permissions,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt
);

public sealed record PermissionDefinitionDto(
    string Key,
    string Name,
    string? Description = null,
    string? Action = null
);

public sealed record PermissionSubGroupDto(
    string SubKey,
    string SubName,
    List<PermissionDefinitionDto> Permissions
);

public sealed record PermissionGroupDto(
    string GroupKey,
    string GroupName,
    string GroupIcon,
    List<PermissionSubGroupDto>? SubGroups,
    List<PermissionDefinitionDto> Permissions
);
