namespace InteriorDesign.Integration.Responses;

public sealed record UserResponse(
    Guid Id,
    string FullName,
    string Email,
    string? PhoneNumber,
    string Role,
    string? AvatarUrl,
    bool IsActive,
    DateTimeOffset CreatedAt
);

public sealed record AuthResponse(
    string Token,
    UserResponse User
);
