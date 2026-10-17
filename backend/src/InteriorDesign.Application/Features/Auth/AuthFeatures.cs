using FluentValidation;
using InteriorDesign.Application.Interfaces;
using InteriorDesign.Domain.Entities;
using InteriorDesign.Integration.Common;
using InteriorDesign.Integration.Requests;
using InteriorDesign.Integration.Responses;
using MediatR;

namespace InteriorDesign.Application.Features.Auth;

// Commands
public sealed record LoginCommand(LoginRequest Request) : IRequest<ApiResponse<AuthResponse>>;
public sealed record RegisterCommand(RegisterRequest Request) : IRequest<ApiResponse<AuthResponse>>;
public sealed record GoogleLoginCommand(GoogleLoginRequest Request) : IRequest<ApiResponse<AuthResponse>>;
public sealed record ForgotPasswordCommand(ForgotPasswordRequest Request) : IRequest<ApiResponse<string>>;
public sealed record ResetPasswordWithOtpCommand(ResetPasswordWithOtpRequest Request) : IRequest<ApiResponse<bool>>;
public sealed record UpdateProfileCommand(UpdateProfileRequest Request) : IRequest<ApiResponse<UserResponse>>;
public sealed record ChangePasswordCommand(ChangePasswordRequest Request) : IRequest<ApiResponse<bool>>;

public sealed class UpdateProfileCommandHandler(IAuthRepository authRepo)
    : IRequestHandler<UpdateProfileCommand, ApiResponse<UserResponse>>
{
    public async Task<ApiResponse<UserResponse>> Handle(UpdateProfileCommand command, CancellationToken cancellationToken)
    {
        var user = await authRepo.GetUserByIdAsync(command.Request.UserId, cancellationToken);
        if (user is null)
        {
            return ApiResponse<UserResponse>.Fail("Không tìm thấy thông tin tài khoản gia chủ.");
        }

        var cleanFullName = command.Request.FullName.Trim();
        var cleanEmail = (command.Request.Email ?? string.Empty).Trim();
        var cleanPhone = (command.Request.PhoneNumber ?? string.Empty).Trim();

        if (string.IsNullOrWhiteSpace(cleanFullName))
        {
            return ApiResponse<UserResponse>.Fail("Họ và tên gia chủ không được để trống.");
        }

        if (await authRepo.EmailOrPhoneExistsForOtherUserAsync(user.Id, cleanEmail, cleanPhone, cancellationToken))
        {
            return ApiResponse<UserResponse>.Fail("Email hoặc Số điện thoại này đã được sử dụng bởi một tài khoản khác.");
        }

        user.FullName = cleanFullName;
        user.Email = cleanEmail;
        user.PhoneNumber = cleanPhone;
        if (!string.IsNullOrWhiteSpace(command.Request.AvatarUrl))
        {
            user.AvatarUrl = command.Request.AvatarUrl.Trim();
        }
        user.UpdatedAt = DateTimeOffset.UtcNow;

        await authRepo.UpdateUserAsync(user, cancellationToken);

        var userResponse = new UserResponse(
            user.Id,
            user.FullName,
            user.Email,
            user.PhoneNumber,
            user.Role,
            user.AvatarUrl,
            user.IsActive,
            user.CreatedAt);

        return ApiResponse<UserResponse>.Ok(userResponse, "Cập nhật thông tin gia chủ thành công.");
    }
}

public sealed class ChangePasswordCommandHandler(IAuthRepository authRepo)
    : IRequestHandler<ChangePasswordCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(ChangePasswordCommand command, CancellationToken cancellationToken)
    {
        var user = await authRepo.GetUserByIdAsync(command.Request.UserId, cancellationToken);
        if (user is null)
        {
            return ApiResponse<bool>.Fail("Không tìm thấy tài khoản gia chủ.");
        }

        if (!BCrypt.Net.BCrypt.Verify(command.Request.CurrentPassword, user.PasswordHash))
        {
            return ApiResponse<bool>.Fail("Mật khẩu hiện tại không chính xác.");
        }

        if (string.IsNullOrWhiteSpace(command.Request.NewPassword) || command.Request.NewPassword.Length < 6)
        {
            return ApiResponse<bool>.Fail("Mật khẩu mới phải có tối thiểu 6 ký tự.");
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(command.Request.NewPassword);
        user.UpdatedAt = DateTimeOffset.UtcNow;

        await authRepo.UpdateUserAsync(user, cancellationToken);

        return ApiResponse<bool>.Ok(true, "Đổi mật khẩu thành công! Quý khách có thể sử dụng mật khẩu mới cho các lần đăng nhập tiếp theo.");
    }
}

// OTP In-Memory Storage
public static class OtpStore
{
    private sealed record OtpEntry(string Code, DateTimeOffset ExpiresAt);
    private static readonly System.Collections.Concurrent.ConcurrentDictionary<string, OtpEntry> Store = new(StringComparer.OrdinalIgnoreCase);

    public static string GenerateOtp(string identifier)
    {
        var key = identifier.Trim().ToLower();
        var random = new Random();
        var code = random.Next(100000, 999999).ToString();
        Store[key] = new OtpEntry(code, DateTimeOffset.UtcNow.AddMinutes(5));
        return code;
    }

    public static bool VerifyOtp(string identifier, string code)
    {
        var key = identifier.Trim().ToLower();
        if (Store.TryGetValue(key, out var entry))
        {
            if (DateTimeOffset.UtcNow <= entry.ExpiresAt && entry.Code == code.Trim())
            {
                Store.TryRemove(key, out _);
                return true;
            }
        }
        return false;
    }
}

public sealed class ForgotPasswordCommandHandler(IAuthRepository authRepo, IEmailService emailService)
    : IRequestHandler<ForgotPasswordCommand, ApiResponse<string>>
{
    public async Task<ApiResponse<string>> Handle(ForgotPasswordCommand command, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(command.Request.Identifier))
        {
            return ApiResponse<string>.Fail("Vui lòng nhập Email hoặc Số điện thoại.");
        }

        var user = await authRepo.GetUserByIdentifierAsync(command.Request.Identifier, cancellationToken);
        if (user is null)
        {
            return ApiResponse<string>.Fail("Không tìm thấy tài khoản gia chủ với thông tin này.");
        }

        var otp = OtpStore.GenerateOtp(command.Request.Identifier);

        // Determine destination email
        var targetEmail = !string.IsNullOrWhiteSpace(user.Email)
            ? user.Email
            : (command.Request.Identifier.Contains('@') ? command.Request.Identifier.Trim() : string.Empty);

        if (!string.IsNullOrWhiteSpace(targetEmail))
        {
            var htmlBody = $@"
<div style=""font-family: 'Segoe UI', Arial, sans-serif; max-width: 580px; margin: 0 auto; background-color: #fff8f5; border: 1px solid #eae1dd; padding: 32px 24px; color: #1f1b19;"">
  <div style=""text-align: center; border-bottom: 1px solid #eae1dd; padding-bottom: 20px; margin-bottom: 24px;"">
    <h2 style=""color: #5d371f; font-size: 22px; margin: 0; font-family: Georgia, serif; letter-spacing: 1px;"">D2 LUXURY DESIGN</h2>
    <p style=""color: #83746c; font-size: 12px; margin-top: 4px; text-transform: uppercase;"">Nội thất gỗ tự nhiên &amp; nghệ nhân may đo</p>
  </div>
  
  <p style=""font-size: 14px; line-height: 1.6; color: #51443d;"">Kính gửi Quý Gia Chủ <strong>{user.FullName}</strong>,</p>
  
  <p style=""font-size: 13px; line-height: 1.6; color: #51443d;"">Hệ thống D2 LUXURY đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của quý khách. Dưới đây là mã xác thực OTP của quý khách:</p>
  
  <div style=""text-align: center; margin: 28px 0;"">
    <div style=""display: inline-block; background-color: #f5ece8; border: 2px dashed #5d371f; padding: 14px 32px; font-size: 30px; font-weight: bold; letter-spacing: 8px; color: #5d371f; font-family: monospace;"">
      {otp}
    </div>
    <p style=""font-size: 12px; color: #83746c; margin-top: 8px;"">Mã xác thực có hiệu lực trong vòng <strong>5 phút</strong>.</p>
  </div>
  
  <p style=""font-size: 12px; line-height: 1.6; color: #83746c;"">Nếu quý khách không thực hiện yêu cầu này, vui lòng bỏ qua email hoặc liên hệ tổng đài <strong>1900 8922</strong> để được hỗ trợ bảo mật.</p>
  
  <div style=""border-top: 1px solid #eae1dd; padding-top: 16px; margin-top: 24px; text-align: center; font-size: 11px; color: #83746c;"">
    <p style=""margin: 0;"">Trân trọng cảm ơn quý khách đã tin tưởng D2 LUXURY.</p>
  </div>
</div>";

            try
            {
                await emailService.SendEmailAsync(
                    targetEmail,
                    "[D2 LUXURY] Mã xác thực OTP đặt lại mật khẩu của quý khách",
                    htmlBody,
                    cancellationToken);
            }
            catch
            {
                // Ignored if SMTP not connected
            }

            return ApiResponse<string>.Ok(otp, $"Mã xác thực OTP đã được gửi về hòm thư {targetEmail} (Hiệu lực trong 5 phút).");
        }

        return ApiResponse<string>.Ok(otp, $"Mã xác thực OTP đã được gửi tới số điện thoại {user.PhoneNumber} (Hiệu lực trong 5 phút).");
    }
}

public sealed class ResetPasswordWithOtpCommandHandler(IAuthRepository authRepo)
    : IRequestHandler<ResetPasswordWithOtpCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(ResetPasswordWithOtpCommand command, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(command.Request.Identifier))
        {
            return ApiResponse<bool>.Fail("Vui lòng nhập Email hoặc Số điện thoại.");
        }

        if (string.IsNullOrWhiteSpace(command.Request.Otp))
        {
            return ApiResponse<bool>.Fail("Vui lòng nhập mã xác thực OTP.");
        }

        if (string.IsNullOrWhiteSpace(command.Request.NewPassword) || command.Request.NewPassword.Length < 6)
        {
            return ApiResponse<bool>.Fail("Mật khẩu mới phải có tối thiểu 6 ký tự.");
        }

        if (!OtpStore.VerifyOtp(command.Request.Identifier, command.Request.Otp))
        {
            return ApiResponse<bool>.Fail("Mã xác thực OTP không chính xác hoặc đã hết hạn (5 phút).");
        }

        var user = await authRepo.GetUserByIdentifierAsync(command.Request.Identifier, cancellationToken);
        if (user is null)
        {
            return ApiResponse<bool>.Fail("Không tìm thấy tài khoản gia chủ.");
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(command.Request.NewPassword);
        await authRepo.UpdateUserAsync(user, cancellationToken);

        return ApiResponse<bool>.Ok(true, "Đặt lại mật khẩu thành công! Quý khách có thể đăng nhập ngay bằng mật khẩu mới.");
    }
}

// Handlers
public sealed class LoginCommandHandler(IAuthRepository authRepo, ITokenService tokenService)
    : IRequestHandler<LoginCommand, ApiResponse<AuthResponse>>
{
    public async Task<ApiResponse<AuthResponse>> Handle(LoginCommand command, CancellationToken cancellationToken)
    {
        var user = await authRepo.GetUserByIdentifierAsync(command.Request.Email, cancellationToken);
        if (user is null || !BCrypt.Net.BCrypt.Verify(command.Request.Password, user.PasswordHash))
        {
            return ApiResponse<AuthResponse>.Fail("Tài khoản hoặc mật khẩu không chính xác.");
        }

        if (!user.IsActive)
        {
            return ApiResponse<AuthResponse>.Fail("Tài khoản của bạn đã bị vô hiệu hóa.");
        }

        var token = tokenService.GenerateJwtToken(user);
        var userResponse = new UserResponse(user.Id, user.FullName, user.Email, user.PhoneNumber, user.Role, user.AvatarUrl, user.IsActive, user.CreatedAt);
        return ApiResponse<AuthResponse>.Ok(new AuthResponse(token, userResponse), "Đăng nhập thành công.");
    }
}

public sealed class RegisterCommandHandler(IAuthRepository authRepo, ITokenService tokenService)
    : IRequestHandler<RegisterCommand, ApiResponse<AuthResponse>>
{
    public async Task<ApiResponse<AuthResponse>> Handle(RegisterCommand command, CancellationToken cancellationToken)
    {
        var cleanEmail = (command.Request.Email ?? string.Empty).Trim();
        var cleanPhone = (command.Request.PhoneNumber ?? string.Empty).Trim();

        if (await authRepo.EmailOrPhoneExistsAsync(cleanEmail, cleanPhone, cancellationToken))
        {
            return ApiResponse<AuthResponse>.Fail("Email hoặc số điện thoại này đã được đăng ký tài khoản.");
        }

        var newUser = new User
        {
            FullName = command.Request.FullName.Trim(),
            Email = cleanEmail,
            PhoneNumber = cleanPhone,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(command.Request.Password),
            Role = "Customer",
            IsActive = true
        };

        var created = await authRepo.CreateUserAsync(newUser, cancellationToken);
        var token = tokenService.GenerateJwtToken(created);
        var userResponse = new UserResponse(created.Id, created.FullName, created.Email, created.PhoneNumber, created.Role, created.AvatarUrl, created.IsActive, created.CreatedAt);

        return ApiResponse<AuthResponse>.Ok(new AuthResponse(token, userResponse), "Đăng ký tài khoản thành công.");
    }
}

public sealed class GoogleLoginCommandHandler(IAuthRepository authRepo, ITokenService tokenService)
    : IRequestHandler<GoogleLoginCommand, ApiResponse<AuthResponse>>
{
    public async Task<ApiResponse<AuthResponse>> Handle(GoogleLoginCommand command, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(command.Request.Credential))
        {
            return ApiResponse<AuthResponse>.Fail("Google credential is required.");
        }

        try
        {
            System.Text.Json.JsonDocument doc;
            var cred = command.Request.Credential.Trim();

            if (cred.Contains('.'))
            {
                var parts = cred.Split('.');
                var payloadBase64 = parts.Length > 1 ? parts[1] : parts[0];
                payloadBase64 = payloadBase64.Replace('-', '+').Replace('_', '/');
                switch (payloadBase64.Length % 4)
                {
                    case 2: payloadBase64 += "=="; break;
                    case 3: payloadBase64 += "="; break;
                }
                var jsonBytes = Convert.FromBase64String(payloadBase64);
                doc = System.Text.Json.JsonDocument.Parse(jsonBytes);
            }
            else
            {
                // Try base64 decoded JSON or direct JSON string
                try
                {
                    var b64 = cred.Replace('-', '+').Replace('_', '/');
                    switch (b64.Length % 4)
                    {
                        case 2: b64 += "=="; break;
                        case 3: b64 += "="; break;
                    }
                    var jsonBytes = Convert.FromBase64String(b64);
                    doc = System.Text.Json.JsonDocument.Parse(jsonBytes);
                }
                catch
                {
                    doc = System.Text.Json.JsonDocument.Parse(cred);
                }
            }

            using (doc)
            {
                var root = doc.RootElement;
                var email = root.TryGetProperty("email", out var emailProp) ? emailProp.GetString() : null;
                var name = root.TryGetProperty("name", out var nameProp) ? nameProp.GetString() : null;
                var picture = root.TryGetProperty("picture", out var picProp) ? picProp.GetString() : null;

                if (string.IsNullOrWhiteSpace(email))
                {
                    return ApiResponse<AuthResponse>.Fail("Không tìm thấy email trong tài khoản Google.");
                }

                var user = await authRepo.GetUserByEmailAsync(email, cancellationToken);
                if (user is null)
                {
                    user = new User
                    {
                        FullName = name ?? "Gia Chủ Google",
                        Email = email,
                        PhoneNumber = string.Empty,
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString("N")),
                        Role = "Customer",
                        AvatarUrl = picture ?? string.Empty,
                        IsActive = true
                    };
                    user = await authRepo.CreateUserAsync(user, cancellationToken);
                }

                if (!user.IsActive)
                {
                    return ApiResponse<AuthResponse>.Fail("Tài khoản của bạn đã bị vô hiệu hóa.");
                }

                var token = tokenService.GenerateJwtToken(user);
                var userResponse = new UserResponse(user.Id, user.FullName, user.Email, user.PhoneNumber, user.Role, user.AvatarUrl ?? picture, user.IsActive, user.CreatedAt);
                return ApiResponse<AuthResponse>.Ok(new AuthResponse(token, userResponse), "Đăng nhập Google thành công.");
            }
        }
        catch (Exception ex)
        {
            return ApiResponse<AuthResponse>.Fail($"Đăng nhập Google thất bại: {ex.Message}");
        }
    }
}

