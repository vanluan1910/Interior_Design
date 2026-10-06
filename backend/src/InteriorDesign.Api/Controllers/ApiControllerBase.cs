using InteriorDesign.Integration.Common;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace InteriorDesign.Api.Controllers;

[ApiController]
public abstract class ApiControllerBase : ControllerBase
{
    private ISender? _sender;

    protected ISender Sender => _sender ??= HttpContext.RequestServices.GetRequiredService<ISender>();

    protected IActionResult ToActionResult<T>(ApiResponse<T> response)
    {
        if (response.Success) return Ok(response);
        if (response.Message?.Contains("không tìm thấy", StringComparison.OrdinalIgnoreCase) == true ||
            response.Message?.Contains("not found", StringComparison.OrdinalIgnoreCase) == true)
        {
            return NotFound(response);
        }
        return BadRequest(response);
    }
}
