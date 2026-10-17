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



[Route("api/upload")]
public sealed class UploadController : ApiControllerBase
{
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp", ".svg", ".gif", ".avif"
    };
    private const long MaxFileSizeBytes = 20 * 1024 * 1024; // 20 MB

    private readonly IWebHostEnvironment _env;

    public UploadController(IWebHostEnvironment env) => _env = env;

    [HttpPost]
    public async Task<IActionResult> UploadImage(IFormFile? file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(ApiResponse<string>.Fail("Vui lòng chọn một file hợp lệ."));

        if (file.Length > MaxFileSizeBytes)
            return BadRequest(ApiResponse<string>.Fail("Dung lượng file vượt quá giới hạn tối đa 20MB."));

        var ext = Path.GetExtension(file.FileName);
        if (string.IsNullOrWhiteSpace(ext) || !AllowedExtensions.Contains(ext))
            return BadRequest(ApiResponse<string>.Fail($"Định dạng file '{ext}' không được hỗ trợ. Vui lòng chọn ảnh JPG, PNG, WEBP hoặc SVG."));

        var uploadsFolder = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads");
        if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

        var fileName = $"{Guid.NewGuid()}{ext.ToLowerInvariant()}";
        var filePath = Path.Combine(uploadsFolder, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var url = $"/uploads/{fileName}";
        return Ok(ApiResponse<string>.Ok(url, "Tải ảnh lên thành công."));
    }

    [HttpPost("multiple")]
    public async Task<IActionResult> UploadMultipleImages([FromForm] List<IFormFile>? files)
    {
        if (files is null || files.Count == 0)
            return BadRequest(ApiResponse<List<string>>.Fail("Vui lòng chọn ít nhất một file ảnh."));

        var uploadsFolder = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads");
        if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

        var uploadedUrls = new List<string>();

        foreach (var file in files)
        {
            if (file.Length == 0 || file.Length > MaxFileSizeBytes) continue;

            var ext = Path.GetExtension(file.FileName);
            if (string.IsNullOrWhiteSpace(ext) || !AllowedExtensions.Contains(ext)) continue;

            var fileName = $"{Guid.NewGuid()}{ext.ToLowerInvariant()}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            uploadedUrls.Add($"/uploads/{fileName}");
        }

        if (uploadedUrls.Count == 0)
            return BadRequest(ApiResponse<List<string>>.Fail("Không có file ảnh hợp lệ nào được tải lên."));

        return Ok(ApiResponse<List<string>>.Ok(uploadedUrls, $"Đã tải lên thành công {uploadedUrls.Count} ảnh."));
    }
}
