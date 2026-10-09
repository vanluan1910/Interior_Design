using InteriorDesign.Application.Features.Auth;
using InteriorDesign.Integration.Requests;
using Microsoft.AspNetCore.Mvc;

namespace InteriorDesign.Api.Controllers;

[Route("api/auth")]
public sealed class AuthController : ApiControllerBase
{
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken cancellationToken) =>
        ToActionResult(await Sender.Send(new LoginCommand(request), cancellationToken));

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken cancellationToken) =>
        ToActionResult(await Sender.Send(new RegisterCommand(request), cancellationToken));

    [HttpPost("google-login")]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest request, CancellationToken cancellationToken) =>
        ToActionResult(await Sender.Send(new GoogleLoginCommand(request), cancellationToken));

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request, CancellationToken cancellationToken) =>
        ToActionResult(await Sender.Send(new ForgotPasswordCommand(request), cancellationToken));

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordWithOtpRequest request, CancellationToken cancellationToken) =>
        ToActionResult(await Sender.Send(new ResetPasswordWithOtpCommand(request), cancellationToken));

    [HttpPost("update-profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request, CancellationToken cancellationToken) =>
        ToActionResult(await Sender.Send(new UpdateProfileCommand(request), cancellationToken));

    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request, CancellationToken cancellationToken) =>
        ToActionResult(await Sender.Send(new ChangePasswordCommand(request), cancellationToken));

    [HttpPost("logout")]
    public IActionResult Logout() =>
        Ok(new { success = true, data = (object?)null, message = "Đăng xuất thành công." });
}
