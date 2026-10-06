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

// Handlers
public sealed class LoginCommandHandler(IAuthRepository authRepo, ITokenService tokenService)
    : IRequestHandler<LoginCommand, ApiResponse<AuthResponse>>
{
    public async Task<ApiResponse<AuthResponse>> Handle(LoginCommand command, CancellationToken cancellationToken)
    {
        var user = await authRepo.GetUserByEmailAsync(command.Request.Email, cancellationToken);
        if (user is null || !BCrypt.Net.BCrypt.Verify(command.Request.Password, user.PasswordHash))
        {
            return ApiResponse<AuthResponse>.Fail("Email hoặc mật khẩu không chính xác.");
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
        if (await authRepo.EmailExistsAsync(command.Request.Email, cancellationToken))
        {
            return ApiResponse<AuthResponse>.Fail("Email này đã được sử dụng.");
        }

        var newUser = new User
        {
            FullName = command.Request.FullName,
            Email = command.Request.Email,
            PhoneNumber = command.Request.PhoneNumber ?? string.Empty,
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
