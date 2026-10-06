namespace InteriorDesign.Integration.Requests;

public sealed record LoginRequest(string Email, string Password);

public sealed record RegisterRequest(string FullName, string Email, string Password, string? PhoneNumber);

public sealed record GoogleLoginRequest(string Credential);

public sealed record ChangePasswordRequest(string CurrentPassword, string NewPassword);
