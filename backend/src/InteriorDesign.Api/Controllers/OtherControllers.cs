using InteriorDesign.Application.Features.Consultations;
using InteriorDesign.Application.Features.Dashboard;
using InteriorDesign.Application.Features.Settings;
using InteriorDesign.Integration.Common;
using InteriorDesign.Integration.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InteriorDesign.Api.Controllers;

[Route("api/consultations")]
public sealed class ConsultationsController : ApiControllerBase
{
    [HttpGet]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> GetConsultations(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? status = null,
        CancellationToken cancellationToken = default)
    {
        var response = await Sender.Send(new GetConsultationsQuery(page, pageSize, search, status), cancellationToken);
        return Ok(response);
    }

    [HttpGet("{id:guid}")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> GetConsultationById(Guid id, CancellationToken cancellationToken) =>
        ToActionResult(await Sender.Send(new GetConsultationByIdQuery(id), cancellationToken));

    [HttpPost]
    public async Task<IActionResult> CreateConsultation([FromBody] CreateConsultationRequest request, CancellationToken cancellationToken) =>
        ToActionResult(await Sender.Send(new CreateConsultationCommand(request), cancellationToken));

    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> UpdateConsultationStatus(Guid id, [FromBody] UpdateConsultationStatusRequest request, CancellationToken cancellationToken) =>
        ToActionResult(await Sender.Send(new UpdateConsultationStatusCommand(id, request), cancellationToken));
}

[Route("api/dashboard")]
[Authorize(Roles = "Admin,Staff")]
public sealed class DashboardController : ApiControllerBase
{
    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary(CancellationToken cancellationToken) =>
        Ok(await Sender.Send(new GetDashboardSummaryQuery(), cancellationToken));
}

[Route("api/settings")]
public sealed class SettingsController : ApiControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetSettings(CancellationToken cancellationToken) =>
        Ok(await Sender.Send(new GetSettingsQuery(), cancellationToken));

    [HttpPut]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateSettings([FromBody] UpdateStoreSettingRequest request, CancellationToken cancellationToken) =>
        ToActionResult(await Sender.Send(new UpdateSettingsCommand(request), cancellationToken));
}

[Route("api/upload")]
[Authorize(Roles = "Admin,Staff")]
public sealed class UploadController : ApiControllerBase
{
    private readonly IWebHostEnvironment _env;

    public UploadController(IWebHostEnvironment env) => _env = env;

    [HttpPost]
    public async Task<IActionResult> UploadImage(IFormFile? file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(ApiResponse<string>.Fail("Vui lòng chọn một file hợp lệ."));

        var uploadsFolder = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads");
        if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

        var ext = Path.GetExtension(file.FileName);
        var fileName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(uploadsFolder, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var url = $"/uploads/{fileName}";
        return Ok(ApiResponse<string>.Ok(url, "Tải ảnh lên thành công."));
    }
}
