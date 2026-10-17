namespace InteriorDesign.Integration.Requests;

public sealed record LoginRequest(string Email, string Password);

public sealed record RegisterRequest(string FullName, string? Email, string Password, string? PhoneNumber);

public sealed record GoogleLoginRequest(string Credential);

public sealed record UpdateProfileRequest(Guid UserId, string FullName, string? Email, string? PhoneNumber, string? AvatarUrl);

public sealed record ChangePasswordRequest(Guid UserId, string CurrentPassword, string NewPassword);

public sealed record ForgotPasswordRequest(string Identifier);

public sealed record ResetPasswordWithOtpRequest(string Identifier, string Otp, string NewPassword);


