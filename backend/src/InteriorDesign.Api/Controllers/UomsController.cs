using InteriorDesign.Domain.Entities;
using InteriorDesign.Infrastructure.Data;
using InteriorDesign.Integration.Common;
using InteriorDesign.Integration.Requests;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InteriorDesign.Api.Controllers;

[Route("api/uoms")]
public sealed class UomsController : ApiControllerBase
{
    private readonly InteriorDbContext _context;

    public UomsController(InteriorDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Lấy danh sách đơn vị tính UOM (Hỗ trợ tìm kiếm, lọc trạng thái, phân trang)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetUoms(
        [FromQuery] string? search = null,
        [FromQuery] string? status = null,
        [FromQuery] bool? isDefault = null,
        [FromQuery] bool includeDeleted = false,
        [FromQuery] int? page = null,
        [FromQuery] int? pageSize = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var query = includeDeleted
                ? _context.UnitOfMeasures.IgnoreQueryFilters().AsNoTracking().AsQueryable()
                : _context.UnitOfMeasures.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim().ToLower();
                query = query.Where(x =>
                    x.Name.ToLower().Contains(s) ||
                    x.Code.ToLower().Contains(s) ||
                    x.Description.ToLower().Contains(s));
            }

            if (!string.IsNullOrWhiteSpace(status) && status != "all")
            {
                query = query.Where(x => x.Status.ToLower() == status.Trim().ToLower());
            }

            if (isDefault.HasValue)
            {
                query = query.Where(x => x.IsDefault == isDefault.Value);
            }

            query = query
                .OrderByDescending(x => x.IsDefault)
                .ThenBy(x => x.Name);

            if (page.HasValue && pageSize.HasValue && pageSize.Value > 0)
            {
                var p = Math.Max(1, page.Value);
                var ps = Math.Clamp(pageSize.Value, 1, 200);
                query = query.Skip((p - 1) * ps).Take(ps);
            }

            var list = await query.ToListAsync(cancellationToken);

            return Ok(ApiResponse<List<UnitOfMeasure>>.Ok(list));
        }
        catch (OperationCanceledException)
        {
            return StatusCode(499, ApiResponse<List<UnitOfMeasure>>.Fail("Yêu cầu đã bị hủy."));
        }
    }

    /// <summary>
    /// Thống kê tổng quan đơn vị tính
    /// </summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetUomStats(CancellationToken cancellationToken = default)
    {
        try
        {
            var list = await _context.UnitOfMeasures.AsNoTracking().ToListAsync(cancellationToken);

            var total = list.Count;
            var active = list.Count(x => x.Status == "active");
            var defaultCount = list.Count(x => x.IsDefault);

            var stats = new
            {
                totalUoms = total,
                activeUoms = active,
                defaultUoms = defaultCount
            };

            return Ok(ApiResponse<object>.Ok(stats));
        }
        catch (OperationCanceledException)
        {
            return StatusCode(499, ApiResponse<object>.Fail("Yêu cầu đã bị hủy."));
        }
    }

    /// <summary>
    /// Lấy chi tiết đơn vị tính theo ID hoặc Code
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetUomById(string id, CancellationToken cancellationToken = default)
    {
        try
        {
            UnitOfMeasure? uom = null;

            if (Guid.TryParse(id, out var guid))
            {
                uom = await _context.UnitOfMeasures
                    .AsNoTracking()
                    .FirstOrDefaultAsync(x => x.Id == guid, cancellationToken);
            }

            if (uom is null)
            {
                uom = await _context.UnitOfMeasures
                    .AsNoTracking()
                    .FirstOrDefaultAsync(x => x.Code.ToLower() == id.Trim().ToLower(), cancellationToken);
            }

            if (uom is null)
            {
                return NotFound(ApiResponse<UnitOfMeasure>.Fail("Không tìm thấy đơn vị tính."));
            }

            return Ok(ApiResponse<UnitOfMeasure>.Ok(uom));
        }
        catch (OperationCanceledException)
        {
            return StatusCode(499, ApiResponse<UnitOfMeasure>.Fail("Yêu cầu đã bị hủy."));
        }
    }

    /// <summary>
    /// Tạo đơn vị tính mới
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateUom([FromBody] CreateUomRequest request, CancellationToken cancellationToken = default)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(ApiResponse<UnitOfMeasure>.Fail("Tên đơn vị tính không được để trống."));
            }

            if (string.IsNullOrWhiteSpace(request.Code))
            {
                return BadRequest(ApiResponse<UnitOfMeasure>.Fail("Mã đơn vị tính không được để trống."));
            }

            var cleanCode = request.Code.Trim().ToUpper();

            var exists = await _context.UnitOfMeasures
                .AnyAsync(x => x.Code.ToUpper() == cleanCode, cancellationToken);

            if (exists)
            {
                return BadRequest(ApiResponse<UnitOfMeasure>.Fail($"Mã đơn vị tính '{cleanCode}' đã tồn tại trong hệ thống."));
            }

            var uom = new UnitOfMeasure
            {
                Id = Guid.NewGuid(),
                Code = cleanCode,
                Name = request.Name.Trim(),
                Description = request.Description?.Trim() ?? string.Empty,
                IsDefault = request.IsDefault,
                Status = string.IsNullOrWhiteSpace(request.Status) ? "active" : request.Status.Trim().ToLower(),
                IsDeleted = false,
                CreatedAt = DateTimeOffset.UtcNow,
            };

            await _context.UnitOfMeasures.AddAsync(uom, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            return CreatedAtAction(nameof(GetUomById), new { id = uom.Id }, ApiResponse<UnitOfMeasure>.Ok(uom, "Tạo đơn vị tính thành công."));
        }
        catch (OperationCanceledException)
        {
            return StatusCode(499, ApiResponse<UnitOfMeasure>.Fail("Yêu cầu đã bị hủy."));
        }
    }

    /// <summary>
    /// Cập nhật thông tin đơn vị tính
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateUom(Guid id, [FromBody] UpdateUomRequest request, CancellationToken cancellationToken = default)
    {
        try
        {
            var uom = await _context.UnitOfMeasures.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
            if (uom is null)
            {
                return NotFound(ApiResponse<UnitOfMeasure>.Fail("Không tìm thấy đơn vị tính."));
            }

            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(ApiResponse<UnitOfMeasure>.Fail("Tên đơn vị tính không được để trống."));
            }

            if (!string.IsNullOrWhiteSpace(request.Code))
            {
                var cleanCode = request.Code.Trim().ToUpper();
                if (cleanCode != uom.Code.ToUpper())
                {
                    var exists = await _context.UnitOfMeasures
                        .AnyAsync(x => x.Id != id && x.Code.ToUpper() == cleanCode, cancellationToken);

                    if (exists)
                    {
                        return BadRequest(ApiResponse<UnitOfMeasure>.Fail($"Mã đơn vị tính '{cleanCode}' đã được sử dụng bởi đơn vị khác."));
                    }
                    uom.Code = cleanCode;
                }
            }

            uom.Name = request.Name.Trim();
            uom.Description = request.Description?.Trim() ?? string.Empty;
            uom.IsDefault = request.IsDefault;
            uom.Status = string.IsNullOrWhiteSpace(request.Status) ? "active" : request.Status.Trim().ToLower();
            uom.UpdatedAt = DateTimeOffset.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            return Ok(ApiResponse<UnitOfMeasure>.Ok(uom, "Cập nhật đơn vị tính thành công."));
        }
        catch (OperationCanceledException)
        {
            return StatusCode(499, ApiResponse<UnitOfMeasure>.Fail("Yêu cầu đã bị hủy."));
        }
    }

    /// <summary>
    /// Cập nhật trạng thái đơn vị tính (active / inactive)
    /// </summary>
    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateUomStatus(Guid id, [FromBody] UpdateUomStatusRequest request, CancellationToken cancellationToken = default)
    {
        try
        {
            var uom = await _context.UnitOfMeasures.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
            if (uom is null)
            {
                return NotFound(ApiResponse<UnitOfMeasure>.Fail("Không tìm thấy đơn vị tính."));
            }

            var status = request.Status?.Trim().ToLower();
            if (status != "active" && status != "inactive")
            {
                return BadRequest(ApiResponse<UnitOfMeasure>.Fail("Trạng thái không hợp lệ (chỉ chấp nhận 'active' hoặc 'inactive')."));
            }

            uom.Status = status;
            uom.UpdatedAt = DateTimeOffset.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            return Ok(ApiResponse<UnitOfMeasure>.Ok(uom, $"Đã cập nhật trạng thái đơn vị tính thành '{status}'."));
        }
        catch (OperationCanceledException)
        {
            return StatusCode(499, ApiResponse<UnitOfMeasure>.Fail("Yêu cầu đã bị hủy."));
        }
    }

    /// <summary>
    /// Xóa đơn vị tính (Xóa mềm)
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteUom(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var uom = await _context.UnitOfMeasures.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
            if (uom is null)
            {
                return NotFound(ApiResponse<bool>.Fail("Không tìm thấy đơn vị tính để xóa."));
            }

            uom.IsDeleted = true;
            uom.UpdatedAt = DateTimeOffset.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            return Ok(ApiResponse<bool>.Ok(true, "Đã xóa đơn vị tính thành công."));
        }
        catch (OperationCanceledException)
        {
            return StatusCode(499, ApiResponse<bool>.Fail("Yêu cầu đã bị hủy."));
        }
    }

    /// <summary>
    /// Khôi phục đơn vị tính đã bị xóa
    /// </summary>
    [HttpPost("{id:guid}/restore")]
    public async Task<IActionResult> RestoreUom(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var uom = await _context.UnitOfMeasures
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(x => x.Id == id && x.IsDeleted, cancellationToken);

            if (uom is null)
            {
                return NotFound(ApiResponse<UnitOfMeasure>.Fail("Không tìm thấy đơn vị tính đã xóa để khôi phục."));
            }

            uom.IsDeleted = false;
            uom.UpdatedAt = DateTimeOffset.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            return Ok(ApiResponse<UnitOfMeasure>.Ok(uom, "Khôi phục đơn vị tính thành công."));
        }
        catch (OperationCanceledException)
        {
            return StatusCode(499, ApiResponse<UnitOfMeasure>.Fail("Yêu cầu đã bị hủy."));
        }
    }
}
