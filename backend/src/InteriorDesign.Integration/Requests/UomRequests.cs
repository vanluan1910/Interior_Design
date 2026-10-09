namespace InteriorDesign.Integration.Requests;

public sealed record CreateUomRequest(
    string Code,
    string Name,
    string? Description,
    bool IsDefault,
    string Status
);

public sealed record UpdateUomRequest(
    string Code,
    string Name,
    string? Description,
    bool IsDefault,
    string Status
);

public sealed record UpdateUomStatusRequest(
    string Status
);
