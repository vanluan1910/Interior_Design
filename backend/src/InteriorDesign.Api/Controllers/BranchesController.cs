using InteriorDesign.Domain.Entities;
using InteriorDesign.Infrastructure.Data;
using InteriorDesign.Integration.Common;
using InteriorDesign.Integration.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InteriorDesign.Api.Controllers;

[Route("api/branches")]
public sealed class BranchesController : ApiControllerBase
{
    private readonly InteriorDbContext _context;

    public BranchesController(InteriorDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Lấy danh sách chi nhánh (Hỗ trợ tìm kiếm, lọc theo loại, khu vực, trạng thái)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetBranches(
        [FromQuery] string? search = null,
        [FromQuery] string? type = null,
        [FromQuery] string? region = null,
        [FromQuery] string? status = null,
        [FromQuery] bool? isHeadquarter = null,
        [FromQuery] bool includeDeleted = false,
        [FromQuery] int? page = null,
        [FromQuery] int? pageSize = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var query = includeDeleted
                ? _context.Branches.IgnoreQueryFilters().AsNoTracking().AsQueryable()
                : _context.Branches.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim().ToLower();
                query = query.Where(x =>
                    x.Name.ToLower().Contains(s) ||
                    x.Code.ToLower().Contains(s) ||
                    x.Address.ToLower().Contains(s) ||
                    x.ManagerName.ToLower().Contains(s) ||
                    x.ManagerPhone.Contains(s));
            }

            if (!string.IsNullOrWhiteSpace(type) && type != "all")
            {
                query = query.Where(x => x.Type.ToLower() == type.Trim().ToLower());
            }

            if (!string.IsNullOrWhiteSpace(region) && region != "all")
            {
                query = query.Where(x => x.Region.ToLower().Contains(region.Trim().ToLower()));
            }

            if (!string.IsNullOrWhiteSpace(status) && status != "all")
            {
                query = query.Where(x => x.Status.ToLower() == status.Trim().ToLower());
            }

            if (isHeadquarter.HasValue)
            {
                query = query.Where(x => x.IsHeadquarter == isHeadquarter.Value);
            }

            query = query
                .OrderByDescending(x => x.IsHeadquarter)
                .ThenByDescending(x => x.CreatedAt);

            if (page.HasValue && pageSize.HasValue && pageSize.Value > 0)
            {
                var p = Math.Max(1, page.Value);
                var ps = Math.Clamp(pageSize.Value, 1, 200);
                query = query.Skip((p - 1) * ps).Take(ps);
            }

            var branches = await query.ToListAsync(cancellationToken);

            return Ok(ApiResponse<List<Branch>>.Ok(branches));
        }
        catch (OperationCanceledException)
        {
            return StatusCode(499, ApiResponse<List<Branch>>.Fail("Yêu cầu đã bị hủy."));
        }
    }

    /// <summary>
    /// Lấy thông tin thống kê tổng quan các chi nhánh
    /// </summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetBranchStats(CancellationToken cancellationToken)
    {
        var branches = await _context.Branches.AsNoTracking().ToListAsync(cancellationToken);

        var stats = new
        {
            TotalBranches = branches.Count,
            ActiveBranches = branches.Count(b => b.Status.Equals("active", StringComparison.OrdinalIgnoreCase)),
            TotalStaff = branches.Sum(b => b.StaffCount),
            TotalArea = branches.Sum(b => b.Area),
            ShowroomsCount = branches.Count(b => b.Type.Equals("showroom", StringComparison.OrdinalIgnoreCase) || b.Type.Equals("hybrid", StringComparison.OrdinalIgnoreCase)),
            WarehousesCount = branches.Count(b => b.Type.Equals("warehouse", StringComparison.OrdinalIgnoreCase) || b.Type.Equals("hybrid", StringComparison.OrdinalIgnoreCase)),
            TotalActiveOrders = branches.Sum(b => b.ActiveOrdersCount)
        };

        return Ok(ApiResponse<object>.Ok(stats));
    }

    /// <summary>
    /// Lấy chi tiết một chi nhánh theo ID
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetBranchById(Guid id, CancellationToken cancellationToken)
    {
        var branch = await _context.Branches.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (branch is null)
            return NotFound(ApiResponse<Branch>.Fail("Không tìm thấy chi nhánh yêu cầu."));

        return Ok(ApiResponse<Branch>.Ok(branch));
    }

    /// <summary>
    /// Tạo mới một chi nhánh
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateBranch([FromBody] CreateBranchRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(ApiResponse<Branch>.Fail("Tên chi nhánh không được để trống."));

        var code = request.Code?.Trim().ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(code))
        {
            var count = await _context.Branches.CountAsync(cancellationToken);
            code = $"CN-{(count + 1).ToString().PadLeft(2, '0')}";
        }
        else
        {
            var exists = await _context.Branches.AnyAsync(x => x.Code == code, cancellationToken);
            if (exists)
                return BadRequest(ApiResponse<Branch>.Fail($"Mã chi nhánh '{code}' đã tồn tại trong hệ thống."));
        }

        var branchType = string.IsNullOrWhiteSpace(request.Type) ? "showroom" : request.Type.ToLowerInvariant();
        var typeLabel = !string.IsNullOrWhiteSpace(request.TypeLabel) ? request.TypeLabel : branchType switch
        {
            "showroom" => "Showroom Trưng Bày",
            "warehouse" => "Kho Trung Chuyển",
            "hybrid" => "Showroom & Kho Tổng",
            "office" => "Văn Phòng Điều Hành",
            _ => "Chi Nhánh"
        };

        // Nếu chi nhánh này được đánh dấu là trụ sở chính, cập nhật các chi nhánh khác thành false
        if (request.IsHeadquarter)
        {
            var existingHqs = await _context.Branches.Where(x => x.IsHeadquarter).ToListAsync(cancellationToken);
            foreach (var hq in existingHqs)
            {
                hq.IsHeadquarter = false;
            }
        }

        var branch = new Branch
        {
            Id = Guid.NewGuid(),
            Code = code,
            Name = request.Name.Trim(),
            Type = branchType,
            TypeLabel = typeLabel,
            Address = request.Address?.Trim() ?? string.Empty,
            Region = request.Region?.Trim() ?? "TP.HCM",
            ManagerName = request.ManagerName?.Trim() ?? string.Empty,
            ManagerPhone = request.ManagerPhone?.Trim() ?? string.Empty,
            ManagerEmail = request.ManagerEmail?.Trim() ?? string.Empty,
            Area = request.Area >= 0 ? request.Area : 0,
            StaffCount = request.StaffCount >= 0 ? request.StaffCount : 0,
            WarehouseCount = request.WarehouseCount >= 0 ? request.WarehouseCount : 0,
            ActiveOrdersCount = 0,
            EstablishedDate = string.IsNullOrWhiteSpace(request.EstablishedDate) ? DateTime.Now.ToString("dd/MM/yyyy") : request.EstablishedDate.Trim(),
            Status = string.IsNullOrWhiteSpace(request.Status) ? "active" : request.Status.ToLowerInvariant(),
            IsHeadquarter = request.IsHeadquarter,
            Description = request.Description?.Trim() ?? string.Empty,
            CreatedAt = DateTime.UtcNow
        };

        _context.Branches.Add(branch);
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse<Branch>.Ok(branch, "Tạo mới chi nhánh thành công."));
    }

    /// <summary>
    /// Cập nhật thông tin chi nhánh
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateBranch(Guid id, [FromBody] UpdateBranchRequest request, CancellationToken cancellationToken)
    {
        var branch = await _context.Branches.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (branch is null)
            return NotFound(ApiResponse<Branch>.Fail("Không tìm thấy chi nhánh cần cập nhật."));

        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(ApiResponse<Branch>.Fail("Tên chi nhánh không được để trống."));

        var code = request.Code?.Trim().ToUpperInvariant();
        if (!string.IsNullOrWhiteSpace(code) && code != branch.Code)
        {
            var exists = await _context.Branches.AnyAsync(x => x.Code == code && x.Id != id, cancellationToken);
            if (exists)
                return BadRequest(ApiResponse<Branch>.Fail($"Mã chi nhánh '{code}' đã thuộc về chi nhánh khác."));
            branch.Code = code;
        }

        // Nếu chi nhánh này được đánh dấu là trụ sở chính, cập nhật các chi nhánh khác thành false
        if (request.IsHeadquarter && !branch.IsHeadquarter)
        {
            var existingHqs = await _context.Branches.Where(x => x.IsHeadquarter && x.Id != id).ToListAsync(cancellationToken);
            foreach (var hq in existingHqs)
            {
                hq.IsHeadquarter = false;
            }
        }

        branch.Name = request.Name.Trim();
        branch.Type = string.IsNullOrWhiteSpace(request.Type) ? branch.Type : request.Type.ToLowerInvariant();
        branch.TypeLabel = !string.IsNullOrWhiteSpace(request.TypeLabel) ? request.TypeLabel : branch.Type switch
        {
            "showroom" => "Showroom Trưng Bày",
            "warehouse" => "Kho Trung Chuyển",
            "hybrid" => "Showroom & Kho Tổng",
            "office" => "Văn Phòng Điều Hành",
            _ => branch.TypeLabel
        };
        branch.Address = request.Address?.Trim() ?? branch.Address;
        branch.Region = request.Region?.Trim() ?? branch.Region;
        branch.ManagerName = request.ManagerName?.Trim() ?? branch.ManagerName;
        branch.ManagerPhone = request.ManagerPhone?.Trim() ?? branch.ManagerPhone;
        branch.ManagerEmail = request.ManagerEmail?.Trim() ?? branch.ManagerEmail;
        branch.Area = request.Area >= 0 ? request.Area : branch.Area;
        branch.StaffCount = request.StaffCount >= 0 ? request.StaffCount : branch.StaffCount;
        branch.WarehouseCount = request.WarehouseCount >= 0 ? request.WarehouseCount : branch.WarehouseCount;
        if (!string.IsNullOrWhiteSpace(request.EstablishedDate))
        {
            branch.EstablishedDate = request.EstablishedDate.Trim();
        }
        branch.Status = string.IsNullOrWhiteSpace(request.Status) ? branch.Status : request.Status.ToLowerInvariant();
        branch.IsHeadquarter = request.IsHeadquarter;
        branch.Description = request.Description?.Trim() ?? branch.Description;

        await _context.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse<Branch>.Ok(branch, "Cập nhật thông tin chi nhánh thành công."));
    }

    /// <summary>
    /// Thay đổi trạng thái hoạt động của chi nhánh
    /// </summary>
    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateBranchStatus(Guid id, [FromBody] UpdateBranchStatusRequest request, CancellationToken cancellationToken)
    {
        var branch = await _context.Branches.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (branch is null)
            return NotFound(ApiResponse<Branch>.Fail("Không tìm thấy chi nhánh."));

        branch.Status = string.IsNullOrWhiteSpace(request.Status) ? "active" : request.Status.ToLowerInvariant();
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse<Branch>.Ok(branch, $"Đã cập nhật trạng thái chi nhánh thành '{branch.Status}'."));
    }

    /// <summary>
    /// Xóa mềm chi nhánh (Đánh dấu đã xóa, không làm mất dữ liệu lịch sử)
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteBranch(Guid id, CancellationToken cancellationToken)
    {
        var branch = await _context.Branches.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (branch is null)
            return NotFound(ApiResponse<bool>.Fail("Không tìm thấy chi nhánh cần xóa."));

        branch.IsDeleted = true;
        branch.DeletedAt = DateTime.UtcNow;
        branch.Status = "inactive";

        await _context.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse<bool>.Ok(true, "Đã xóa mềm chi nhánh thành công."));
    }

    /// <summary>
    /// Khôi phục chi nhánh đã bị xóa mềm
    /// </summary>
    [HttpPost("{id:guid}/restore")]
    public async Task<IActionResult> RestoreBranch(Guid id, CancellationToken cancellationToken)
    {
        var branch = await _context.Branches
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(x => x.Id == id && x.IsDeleted, cancellationToken);

        if (branch is null)
            return NotFound(ApiResponse<Branch>.Fail("Không tìm thấy chi nhánh đã xóa để khôi phục."));

        branch.IsDeleted = false;
        branch.DeletedAt = null;
        branch.Status = "active";

        await _context.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse<Branch>.Ok(branch, "Khôi phục chi nhánh thành công."));
    }
}
