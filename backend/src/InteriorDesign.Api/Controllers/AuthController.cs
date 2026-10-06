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
}
