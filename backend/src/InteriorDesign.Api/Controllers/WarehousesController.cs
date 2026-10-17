using InteriorDesign.Domain.Entities;
using InteriorDesign.Infrastructure.Data;
using InteriorDesign.Integration.Common;
using InteriorDesign.Integration.Requests;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InteriorDesign.Api.Controllers;

[Route("api/warehouses")]
public sealed class WarehousesController : ApiControllerBase
{
    private readonly InteriorDbContext _context;

    public WarehousesController(InteriorDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Lấy danh sách kho / showroom (Hỗ trợ tìm kiếm, lọc theo chi nhánh, loại kho, trạng thái)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetWarehouses(
        [FromQuery] string? search = null,
        [FromQuery] string? branch = null,
        [FromQuery] string? type = null,
        [FromQuery] string? status = null,
        [FromQuery] bool includeDeleted = false,
        [FromQuery] int? page = null,
        [FromQuery] int? pageSize = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var query = includeDeleted
                ? _context.Warehouses.IgnoreQueryFilters().AsNoTracking().AsQueryable()
                : _context.Warehouses.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim().ToLower();
                query = query.Where(x =>
                    x.Name.ToLower().Contains(s) ||
                    x.Code.ToLower().Contains(s) ||
                    x.Address.ToLower().Contains(s) ||
                    x.ManagerName.ToLower().Contains(s) ||
                    x.ManagerPhone.Contains(s) ||
                    x.Branch.ToLower().Contains(s));
            }

            if (!string.IsNullOrWhiteSpace(branch) && branch != "all")
            {
                var b = branch.Trim().ToLower();
                query = query.Where(x => x.Branch.ToLower().Contains(b) || x.Address.ToLower().Contains(b));
            }

            if (!string.IsNullOrWhiteSpace(type) && type != "all")
            {
                query = query.Where(x => x.Type.ToLower() == type.Trim().ToLower());
            }

            if (!string.IsNullOrWhiteSpace(status) && status != "all")
            {
                query = query.Where(x => x.Status.ToLower() == status.Trim().ToLower());
            }

            query = query
                .OrderByDescending(x => x.IsDefault)
                .ThenByDescending(x => x.CreatedAt);

            if (page.HasValue && pageSize.HasValue && pageSize.Value > 0)
            {
                var p = Math.Max(1, page.Value);
                var ps = Math.Clamp(pageSize.Value, 1, 200);
                query = query.Skip((p - 1) * ps).Take(ps);
            }

            var warehouses = await query.ToListAsync(cancellationToken);

            return Ok(ApiResponse<List<Warehouse>>.Ok(warehouses));
        }
        catch (OperationCanceledException)
        {
            return StatusCode(499, ApiResponse<List<Warehouse>>.Fail("Yêu cầu đã bị hủy."));
        }
    }

    /// <summary>
    /// Thống kê tổng quan kho bãi
    /// </summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetWarehouseStats(CancellationToken cancellationToken = default)
    {
        try
        {
            var list = await _context.Warehouses.AsNoTracking().ToListAsync(cancellationToken);

            var totalCapacity = list.Sum(x => x.CapacityMax);
            var currentStock = list.Sum(x => x.CapacityCurrent);
            var avgOccupancy = totalCapacity > 0 ? Math.Round((currentStock / totalCapacity) * 100, 1) : 0;

            var stats = new
            {
                TotalWarehouses = list.Count,
                ActiveWarehouses = list.Count(w => w.Status.Equals("active", StringComparison.OrdinalIgnoreCase)),
                TotalCapacity = totalCapacity,
                CurrentCapacity = currentStock,
                AverageOccupancyPercent = avgOccupancy,
                TotalInventoryValue = list.Sum(x => x.TotalValue),
                ShowroomCount = list.Count(x => x.Type.Equals("showroom", StringComparison.OrdinalIgnoreCase)),
                TransitCount = list.Count(x => x.Type.Equals("transit", StringComparison.OrdinalIgnoreCase)),
                FinishedCount = list.Count(x => x.Type.Equals("finished", StringComparison.OrdinalIgnoreCase))
            };

            return Ok(ApiResponse<object>.Ok(stats));
        }
        catch (OperationCanceledException)
        {
            return StatusCode(499, ApiResponse<object>.Fail("Yêu cầu đã bị hủy."));
        }
    }

    /// <summary>
    /// Lấy chi tiết kho theo ID
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetWarehouseById(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var warehouse = await _context.Warehouses.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
            if (warehouse is null)
                return NotFound(ApiResponse<Warehouse>.Fail("Không tìm thấy kho hàng yêu cầu."));

            return Ok(ApiResponse<Warehouse>.Ok(warehouse));
        }
        catch (OperationCanceledException)
        {
            return StatusCode(499, ApiResponse<Warehouse>.Fail("Yêu cầu đã bị hủy."));
        }
    }

    /// <summary>
    /// Tạo mới một kho hàng
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateWarehouse([FromBody] CreateWarehouseRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(ApiResponse<Warehouse>.Fail("Tên kho không được để trống."));

        var code = request.Code?.Trim().ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(code))
        {
            var count = await _context.Warehouses.CountAsync(cancellationToken);
            code = $"KHO-{(count + 1).ToString().PadLeft(2, '0')}";
        }
        else
        {
            var exists = await _context.Warehouses.AnyAsync(x => x.Code == code, cancellationToken);
            if (exists)
                return BadRequest(ApiResponse<Warehouse>.Fail($"Mã kho '{code}' đã tồn tại trong hệ thống."));
        }

        var whType = string.IsNullOrWhiteSpace(request.Type) ? "finished" : request.Type.ToLowerInvariant();
        var typeLabel = !string.IsNullOrWhiteSpace(request.TypeLabel) ? request.TypeLabel : whType switch
        {
            "showroom" => "Showroom Trưng Bày & Bán Lẻ",
            "transit" => "Tổng Kho Trung Chuyển & Giao Vận",
            "finished" => "Kho Thành Phẩm",
            "ready" => "Kho Xuất Xưởng",
            "main" => "Kho Tổng Trung Tâm",
            _ => "Kho Hàng"
        };

        // Nếu đặt là kho mặc định, bỏ cờ mặc định của các kho khác
        if (request.IsDefault)
        {
            var defaults = await _context.Warehouses.Where(x => x.IsDefault).ToListAsync(cancellationToken);
            foreach (var d in defaults) d.IsDefault = false;
        }

        var warehouse = new Warehouse
        {
            Id = Guid.NewGuid(),
            Code = code,
            Name = request.Name.Trim(),
            Type = whType,
            TypeLabel = typeLabel,
            Branch = request.Branch?.Trim() ?? string.Empty,
            Province = request.Province?.Trim() ?? string.Empty,
            District = request.District?.Trim() ?? string.Empty,
            StreetAddress = request.StreetAddress?.Trim() ?? string.Empty,
            Address = request.Address?.Trim() ?? string.Empty,
            ManagerName = request.ManagerName?.Trim() ?? string.Empty,
            ManagerPhone = request.ManagerPhone?.Trim() ?? string.Empty,
            CapacityMax = request.CapacityMax >= 0 ? request.CapacityMax : 100,
            CapacityCurrent = request.CapacityCurrent >= 0 ? request.CapacityCurrent : 0,
            CapacityUnit = string.IsNullOrWhiteSpace(request.CapacityUnit) ? "sản phẩm" : request.CapacityUnit.Trim(),
            OccupancyPercent = request.OccupancyPercent >= 0 ? request.OccupancyPercent : 0,
            HumidityControl = string.IsNullOrWhiteSpace(request.HumidityControl) ? "Điều hòa 24/7" : request.HumidityControl.Trim(),
            Status = string.IsNullOrWhiteSpace(request.Status) ? "active" : request.Status.ToLowerInvariant(),
            IsDefault = request.IsDefault,
            Description = request.Description?.Trim() ?? string.Empty,
            TotalValue = request.TotalValue >= 0 ? request.TotalValue : 0,
            CreatedAt = DateTime.UtcNow
        };

        _context.Warehouses.Add(warehouse);
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse<Warehouse>.Ok(warehouse, "Tạo mới kho hàng thành công."));
    }

    /// <summary>
    /// Cập nhật thông tin kho hàng
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateWarehouse(Guid id, [FromBody] UpdateWarehouseRequest request, CancellationToken cancellationToken)
    {
        var warehouse = await _context.Warehouses.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (warehouse is null)
            return NotFound(ApiResponse<Warehouse>.Fail("Không tìm thấy kho hàng cần cập nhật."));

        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(ApiResponse<Warehouse>.Fail("Tên kho không được để trống."));

        var code = request.Code?.Trim().ToUpperInvariant();
        if (!string.IsNullOrWhiteSpace(code) && code != warehouse.Code)
        {
            var exists = await _context.Warehouses.AnyAsync(x => x.Code == code && x.Id != id, cancellationToken);
            if (exists)
                return BadRequest(ApiResponse<Warehouse>.Fail($"Mã kho '{code}' đã thuộc về kho khác."));
            warehouse.Code = code;
        }

        if (request.IsDefault && !warehouse.IsDefault)
        {
            var defaults = await _context.Warehouses.Where(x => x.IsDefault && x.Id != id).ToListAsync(cancellationToken);
            foreach (var d in defaults) d.IsDefault = false;
        }

        warehouse.Name = request.Name.Trim();
        warehouse.Type = string.IsNullOrWhiteSpace(request.Type) ? warehouse.Type : request.Type.ToLowerInvariant();
        warehouse.TypeLabel = !string.IsNullOrWhiteSpace(request.TypeLabel) ? request.TypeLabel : warehouse.Type switch
        {
            "showroom" => "Showroom Trưng Bày & Bán Lẻ",
            "transit" => "Tổng Kho Trung Chuyển & Giao Vận",
            "finished" => "Kho Thành Phẩm",
            "ready" => "Kho Xuất Xưởng",
            "main" => "Kho Tổng Trung Tâm",
            _ => warehouse.TypeLabel
        };
        warehouse.Branch = request.Branch?.Trim() ?? warehouse.Branch;
        warehouse.Province = request.Province?.Trim() ?? warehouse.Province;
        warehouse.District = request.District?.Trim() ?? warehouse.District;
        warehouse.StreetAddress = request.StreetAddress?.Trim() ?? warehouse.StreetAddress;
        warehouse.Address = request.Address?.Trim() ?? warehouse.Address;
        warehouse.ManagerName = request.ManagerName?.Trim() ?? warehouse.ManagerName;
        warehouse.ManagerPhone = request.ManagerPhone?.Trim() ?? warehouse.ManagerPhone;
        warehouse.CapacityMax = request.CapacityMax >= 0 ? request.CapacityMax : warehouse.CapacityMax;
        warehouse.CapacityCurrent = request.CapacityCurrent >= 0 ? request.CapacityCurrent : warehouse.CapacityCurrent;
        warehouse.CapacityUnit = string.IsNullOrWhiteSpace(request.CapacityUnit) ? warehouse.CapacityUnit : request.CapacityUnit.Trim();
        warehouse.OccupancyPercent = request.OccupancyPercent >= 0 ? request.OccupancyPercent : warehouse.OccupancyPercent;
        warehouse.HumidityControl = string.IsNullOrWhiteSpace(request.HumidityControl) ? warehouse.HumidityControl : request.HumidityControl.Trim();
        warehouse.Status = string.IsNullOrWhiteSpace(request.Status) ? warehouse.Status : request.Status.ToLowerInvariant();
        warehouse.IsDefault = request.IsDefault;
        warehouse.Description = request.Description?.Trim() ?? warehouse.Description;
        warehouse.TotalValue = request.TotalValue >= 0 ? request.TotalValue : warehouse.TotalValue;

        await _context.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse<Warehouse>.Ok(warehouse, "Cập nhật thông tin kho hàng thành công."));
    }

    /// <summary>
    /// Thay đổi trạng thái hoạt động của kho hàng
    /// </summary>
    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateWarehouseStatus(Guid id, [FromBody] UpdateWarehouseStatusRequest request, CancellationToken cancellationToken)
    {
        var warehouse = await _context.Warehouses.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (warehouse is null)
            return NotFound(ApiResponse<Warehouse>.Fail("Không tìm thấy kho hàng."));

        warehouse.Status = string.IsNullOrWhiteSpace(request.Status) ? "active" : request.Status.ToLowerInvariant();
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse<Warehouse>.Ok(warehouse, $"Đã cập nhật trạng thái kho thành '{warehouse.Status}'."));
    }

    /// <summary>
    /// Xóa mềm kho hàng
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteWarehouse(Guid id, CancellationToken cancellationToken)
    {
        var warehouse = await _context.Warehouses.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (warehouse is null)
            return NotFound(ApiResponse<bool>.Fail("Không tìm thấy kho hàng cần xóa."));

        warehouse.IsDeleted = true;
        warehouse.DeletedAt = DateTime.UtcNow;
        warehouse.Status = "inactive";

        await _context.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse<bool>.Ok(true, "Đã xóa mềm kho hàng thành công."));
    }

    /// <summary>
    /// Khôi phục kho hàng đã bị xóa mềm
    /// </summary>
    [HttpPost("{id:guid}/restore")]
    public async Task<IActionResult> RestoreWarehouse(Guid id, CancellationToken cancellationToken)
    {
        var warehouse = await _context.Warehouses
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(x => x.Id == id && x.IsDeleted, cancellationToken);

        if (warehouse is null)
            return NotFound(ApiResponse<Warehouse>.Fail("Không tìm thấy kho hàng đã xóa để khôi phục."));

        warehouse.IsDeleted = false;
        warehouse.DeletedAt = null;
        warehouse.Status = "active";

        await _context.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse<Warehouse>.Ok(warehouse, "Khôi phục kho hàng thành công."));
    }
}
