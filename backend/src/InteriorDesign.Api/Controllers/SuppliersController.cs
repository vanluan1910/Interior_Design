using InteriorDesign.Domain.Entities;
using InteriorDesign.Infrastructure.Data;
using InteriorDesign.Integration.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InteriorDesign.Api.Controllers;

[Route("api/suppliers")]
public sealed class SuppliersController : ApiControllerBase
{
    private readonly InteriorDbContext _context;

    public SuppliersController(InteriorDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Lấy danh sách nhà cung cấp (hỗ trợ tìm kiếm, lọc theo trạng thái, công nợ)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetSuppliers(
        [FromQuery] string? search = null,
        [FromQuery] string? status = null,
        [FromQuery] string? debtFilter = null,
        [FromQuery] bool includeDeleted = false,
        [FromQuery] int? page = null,
        [FromQuery] int? pageSize = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var query = includeDeleted
                ? _context.Suppliers.IgnoreQueryFilters().AsNoTracking().AsQueryable()
                : _context.Suppliers.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim().ToLower();
                query = query.Where(x =>
                    x.Name.ToLower().Contains(s) ||
                    x.Code.ToLower().Contains(s) ||
                    x.ContactPerson.ToLower().Contains(s) ||
                    x.Phone.Contains(s) ||
                    x.Email.ToLower().Contains(s) ||
                    x.TaxCode.Contains(s) ||
                    x.Company.ToLower().Contains(s));
            }

            if (!string.IsNullOrWhiteSpace(status) && status != "all")
            {
                var st = status.Trim().ToLower();
                query = query.Where(x => x.Status.ToLower() == st);
            }

            if (!string.IsNullOrWhiteSpace(debtFilter) && debtFilter != "all")
            {
                if (debtFilter == "has_debt")
                {
                    query = query.Where(x => x.CurrentDebt > 0);
                }
                else if (debtFilter == "no_debt")
                {
                    query = query.Where(x => x.CurrentDebt <= 0);
                }
            }

            query = query
                .OrderBy(x => x.Code)
                .ThenByDescending(x => x.CreatedAt);

            if (page.HasValue && pageSize.HasValue && pageSize.Value > 0)
            {
                var p = Math.Max(1, page.Value);
                var ps = Math.Clamp(pageSize.Value, 1, 200);
                query = query.Skip((p - 1) * ps).Take(ps);
            }

            var suppliers = await query.ToListAsync(cancellationToken);

            return Ok(ApiResponse<List<Supplier>>.Ok(suppliers));
        }
        catch (OperationCanceledException)
        {
            return StatusCode(499, ApiResponse<List<Supplier>>.Fail("Yêu cầu đã bị hủy."));
        }
    }

    /// <summary>
    /// Lấy thống kê tổng quan về nhà cung cấp
    /// </summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetSupplierStats(CancellationToken cancellationToken = default)
    {
        try
        {
            var total = await _context.Suppliers.CountAsync(cancellationToken);
            var active = await _context.Suppliers.CountAsync(x => x.Status == "active", cancellationToken);
            var inactive = await _context.Suppliers.CountAsync(x => x.Status == "inactive", cancellationToken);
            var totalPurchased = await _context.Suppliers.SumAsync(x => (decimal?)x.TotalPurchased, cancellationToken) ?? 0;
            var totalDebt = await _context.Suppliers.SumAsync(x => (decimal?)x.CurrentDebt, cancellationToken) ?? 0;

            var stats = new
            {
                TotalSuppliers = total,
                ActiveSuppliers = active,
                InactiveSuppliers = inactive,
                TotalPurchased = totalPurchased,
                TotalDebt = totalDebt
            };

            return Ok(ApiResponse<object>.Ok(stats));
        }
        catch (OperationCanceledException)
        {
            return StatusCode(499, ApiResponse<object>.Fail("Yêu cầu đã bị hủy."));
        }
    }

    /// <summary>
    /// Lấy chi tiết một nhà cung cấp theo Id
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetSupplierById(Guid id, CancellationToken cancellationToken = default)
    {
        var supplier = await _context.Suppliers.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (supplier is null)
            return NotFound(ApiResponse<Supplier>.Fail("Không tìm thấy nhà cung cấp."));

        return Ok(ApiResponse<Supplier>.Ok(supplier));
    }

    /// <summary>
    /// Tạo mới nhà cung cấp
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateSupplier([FromBody] Supplier request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(ApiResponse<Supplier>.Fail("Tên nhà cung cấp không được để trống."));

        var existingCodes = await _context.Suppliers
            .IgnoreQueryFilters()
            .Select(s => s.Code.ToUpper())
            .ToListAsync(cancellationToken);

        var code = request.Code?.Trim().ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(code) || existingCodes.Contains(code))
        {
            var nextNum = existingCodes.Count + 1;
            var autoCode = $"NCC{nextNum:D2}";
            while (existingCodes.Contains(autoCode))
            {
                nextNum++;
                autoCode = $"NCC{nextNum:D2}";
            }

            if (!string.IsNullOrWhiteSpace(code) && existingCodes.Contains(code))
            {
                return BadRequest(ApiResponse<Supplier>.Fail($"Mã nhà cung cấp '{code}' đã tồn tại trong hệ thống. Vui lòng sử dụng mã gợi ý: '{autoCode}' hoặc mã khác."));
            }
            code = autoCode;
        }

        var supplier = new Supplier
        {
            Id = Guid.NewGuid(),
            Code = code,
            Name = request.Name.Trim(),
            ContactPerson = request.ContactPerson?.Trim() ?? string.Empty,
            Phone = request.Phone?.Trim() ?? string.Empty,
            Email = request.Email?.Trim() ?? string.Empty,
            Address = request.Address?.Trim() ?? string.Empty,
            TaxCode = request.TaxCode?.Trim() ?? string.Empty,
            Company = request.Company?.Trim() ?? string.Empty,
            BankName = request.BankName?.Trim() ?? string.Empty,
            BankAccount = request.BankAccount?.Trim() ?? string.Empty,
            Province = request.Province?.Trim() ?? string.Empty,
            Ward = request.Ward?.Trim() ?? string.Empty,
            IdentityNumber = request.IdentityNumber?.Trim() ?? string.Empty,
            Rating = request.Rating > 0 ? request.Rating : 5.0m,
            Status = string.IsNullOrWhiteSpace(request.Status) ? "active" : request.Status.ToLowerInvariant(),
            Note = request.Note?.Trim() ?? string.Empty,
            TotalPurchased = request.TotalPurchased,
            CurrentDebt = request.CurrentDebt,
            TotalCollected = request.TotalCollected,
            CreatedBy = string.IsNullOrWhiteSpace(request.CreatedBy) ? "Quản trị viên" : request.CreatedBy.Trim(),
            IsDeleted = false,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _context.Suppliers.Add(supplier);
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse<Supplier>.Ok(supplier, "Thêm nhà cung cấp thành công."));
    }

    /// <summary>
    /// Nhập hàng loạt nhà cung cấp từ Excel
    /// </summary>
    [HttpPost("bulk")]
    public async Task<IActionResult> BulkImportSuppliers(
        [FromBody] List<Supplier> requests,
        CancellationToken cancellationToken = default)
    {
        if (requests == null || requests.Count == 0)
            return BadRequest(ApiResponse<int>.Fail("Danh sách nhà cung cấp trống."));

        var existingSuppliers = await _context.Suppliers
            .IgnoreQueryFilters()
            .ToListAsync(cancellationToken);

        var existingCodes = new HashSet<string>(existingSuppliers.Select(s => s.Code.ToUpperInvariant()));
        var existingByName = existingSuppliers.ToDictionary(s => s.Name.Trim().ToLowerInvariant(), s => s);

        var addedList = new List<Supplier>();
        var updatedCount = 0;
        var nextNum = 1;

        foreach (var req in requests)
        {
            if (string.IsNullOrWhiteSpace(req.Name)) continue;
            var nameKey = req.Name.Trim().ToLowerInvariant();

            if (existingByName.TryGetValue(nameKey, out var existing))
            {
                // Cập nhật thông tin nhà cung cấp hiện có
                if (!string.IsNullOrWhiteSpace(req.ContactPerson)) existing.ContactPerson = req.ContactPerson.Trim();
                if (!string.IsNullOrWhiteSpace(req.Phone)) existing.Phone = req.Phone.Trim();
                if (!string.IsNullOrWhiteSpace(req.Email)) existing.Email = req.Email.Trim();
                if (!string.IsNullOrWhiteSpace(req.Address)) existing.Address = req.Address.Trim();
                if (!string.IsNullOrWhiteSpace(req.TaxCode)) existing.TaxCode = req.TaxCode.Trim();
                if (!string.IsNullOrWhiteSpace(req.Company)) existing.Company = req.Company.Trim();
                if (!string.IsNullOrWhiteSpace(req.BankName)) existing.BankName = req.BankName.Trim();
                if (!string.IsNullOrWhiteSpace(req.BankAccount)) existing.BankAccount = req.BankAccount.Trim();
                if (req.TotalPurchased > 0) existing.TotalPurchased = req.TotalPurchased;
                if (req.CurrentDebt > 0) existing.CurrentDebt = req.CurrentDebt;
                existing.IsDeleted = false;
                existing.DeletedAt = null;
                updatedCount++;
            }
            else
            {
                // Sinh mã mới an toàn
                var code = req.Code?.Trim().ToUpperInvariant();
                if (string.IsNullOrWhiteSpace(code) || existingCodes.Contains(code))
                {
                    var autoCode = $"NCC{nextNum:D2}";
                    while (existingCodes.Contains(autoCode))
                    {
                        nextNum++;
                        autoCode = $"NCC{nextNum:D2}";
                    }
                    code = autoCode;
                }
                existingCodes.Add(code);

                var newSup = new Supplier
                {
                    Id = Guid.NewGuid(),
                    Code = code,
                    Name = req.Name.Trim(),
                    ContactPerson = req.ContactPerson?.Trim() ?? string.Empty,
                    Phone = req.Phone?.Trim() ?? string.Empty,
                    Email = req.Email?.Trim() ?? string.Empty,
                    Address = req.Address?.Trim() ?? string.Empty,
                    TaxCode = req.TaxCode?.Trim() ?? string.Empty,
                    Company = req.Company?.Trim() ?? string.Empty,
                    BankName = req.BankName?.Trim() ?? string.Empty,
                    BankAccount = req.BankAccount?.Trim() ?? string.Empty,
                    Province = req.Province?.Trim() ?? string.Empty,
                    Ward = req.Ward?.Trim() ?? string.Empty,
                    IdentityNumber = req.IdentityNumber?.Trim() ?? string.Empty,
                    Rating = req.Rating > 0 ? req.Rating : 5.0m,
                    Status = string.IsNullOrWhiteSpace(req.Status) ? "active" : req.Status.ToLowerInvariant(),
                    Note = req.Note?.Trim() ?? string.Empty,
                    TotalPurchased = req.TotalPurchased,
                    CurrentDebt = req.CurrentDebt,
                    TotalCollected = req.TotalCollected,
                    CreatedBy = "Nhập Excel",
                    IsDeleted = false,
                    CreatedAt = DateTimeOffset.UtcNow
                };

                addedList.Add(newSup);
                existingByName[nameKey] = newSup;
            }
        }

        if (addedList.Count > 0)
        {
            await _context.Suppliers.AddRangeAsync(addedList, cancellationToken);
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse<object>.Ok(new
        {
            TotalProcessed = requests.Count,
            Added = addedList.Count,
            Updated = updatedCount
        }, $"Đã xử lý nhập thành công: Thêm mới {addedList.Count}, Cập nhật {updatedCount} nhà cung cấp."));
    }

    /// <summary>
    /// Cập nhật thông tin nhà cung cấp
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateSupplier(Guid id, [FromBody] Supplier request, CancellationToken cancellationToken = default)
    {
        var supplier = await _context.Suppliers.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (supplier is null)
            return NotFound(ApiResponse<Supplier>.Fail("Không tìm thấy nhà cung cấp."));

        if (!string.IsNullOrWhiteSpace(request.Code) && !string.Equals(supplier.Code, request.Code.Trim(), StringComparison.OrdinalIgnoreCase))
        {
            var codeUpper = request.Code.Trim().ToUpperInvariant();
            var duplicate = await _context.Suppliers
                .IgnoreQueryFilters()
                .AnyAsync(s => s.Id != id && s.Code.ToUpper() == codeUpper, cancellationToken);
            if (duplicate)
            {
                return BadRequest(ApiResponse<Supplier>.Fail($"Mã nhà cung cấp '{request.Code}' đã tồn tại trong hệ thống."));
            }
            supplier.Code = codeUpper;
        }

        supplier.Name = request.Name.Trim();
        supplier.ContactPerson = request.ContactPerson?.Trim() ?? string.Empty;
        supplier.Phone = request.Phone?.Trim() ?? string.Empty;
        supplier.Email = request.Email?.Trim() ?? string.Empty;
        supplier.Address = request.Address?.Trim() ?? string.Empty;
        supplier.TaxCode = request.TaxCode?.Trim() ?? string.Empty;
        supplier.Company = request.Company?.Trim() ?? string.Empty;
        supplier.BankName = request.BankName?.Trim() ?? string.Empty;
        supplier.BankAccount = request.BankAccount?.Trim() ?? string.Empty;
        supplier.Province = request.Province?.Trim() ?? string.Empty;
        supplier.Ward = request.Ward?.Trim() ?? string.Empty;
        supplier.IdentityNumber = request.IdentityNumber?.Trim() ?? string.Empty;
        supplier.Status = string.IsNullOrWhiteSpace(request.Status) ? "active" : request.Status.ToLowerInvariant();
        supplier.Note = request.Note?.Trim() ?? string.Empty;
        supplier.Rating = request.Rating > 0 ? request.Rating : supplier.Rating;
        supplier.TotalPurchased = request.TotalPurchased;
        supplier.CurrentDebt = request.CurrentDebt;
        supplier.TotalCollected = request.TotalCollected;

        await _context.SaveChangesAsync(cancellationToken);
        return Ok(ApiResponse<Supplier>.Ok(supplier, "Cập nhật nhà cung cấp thành công."));
    }

    /// <summary>
    /// Xóa mềm một nhà cung cấp
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteSupplier(string id, CancellationToken cancellationToken = default)
    {
        if (Guid.TryParse(id, out var guidId))
        {
            var supplier = await _context.Suppliers.FirstOrDefaultAsync(x => x.Id == guidId, cancellationToken);
            if (supplier != null)
            {
                supplier.IsDeleted = true;
                supplier.DeletedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync(cancellationToken);
                return Ok(ApiResponse<bool>.Ok(true, "Xóa nhà cung cấp thành công."));
            }
        }

        return Ok(ApiResponse<bool>.Ok(true, "Đã xóa nhà cung cấp."));
    }

    /// <summary>
    /// Xóa nhiều nhà cung cấp
    /// </summary>
    [HttpPost("bulk-delete")]
    public async Task<IActionResult> BulkDeleteSuppliers([FromBody] List<string> ids, CancellationToken cancellationToken = default)
    {
        if (ids == null || ids.Count == 0)
            return BadRequest(ApiResponse<bool>.Fail("Danh sách Id rỗng."));

        var validGuids = ids
            .Select(s => Guid.TryParse(s, out var g) ? g : (Guid?)null)
            .Where(g => g.HasValue)
            .Select(g => g!.Value)
            .ToList();

        var deletedCount = 0;
        if (validGuids.Count > 0)
        {
            var list = await _context.Suppliers.Where(x => validGuids.Contains(x.Id)).ToListAsync(cancellationToken);
            foreach (var item in list)
            {
                item.IsDeleted = true;
                item.DeletedAt = DateTime.UtcNow;
            }

            deletedCount = await _context.SaveChangesAsync(cancellationToken);
        }

        return Ok(ApiResponse<int>.Ok(ids.Count, $"Đã xóa thành công {ids.Count} nhà cung cấp."));
    }

    // --- Stock Imports ---
    [HttpGet("imports")]
    public async Task<IActionResult> GetImportSlips([FromQuery] Guid? supplierId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.StockImportSlips.AsNoTracking().AsQueryable();
        if (supplierId.HasValue)
        {
            query = query.Where(x => x.SupplierId == supplierId.Value);
        }

        var list = await query.OrderByDescending(x => x.CreatedAt).ToListAsync(cancellationToken);
        return Ok(ApiResponse<List<StockImportSlip>>.Ok(list));
    }

    [HttpPost("imports")]
    public async Task<IActionResult> CreateImportSlip([FromBody] StockImportSlip request, CancellationToken cancellationToken = default)
    {
        _context.StockImportSlips.Add(request);
        await _context.SaveChangesAsync(cancellationToken);
        return Ok(ApiResponse<StockImportSlip>.Ok(request, "Tạo phiếu nhập kho thành công."));
    }

    // --- Supplier Returns ---
    [HttpGet("returns")]
    public async Task<IActionResult> GetReturnSlips([FromQuery] Guid? supplierId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.SupplierReturnSlips.AsNoTracking().AsQueryable();
        if (supplierId.HasValue)
        {
            query = query.Where(x => x.SupplierId == supplierId.Value);
        }

        var list = await query.OrderByDescending(x => x.CreatedAt).ToListAsync(cancellationToken);
        return Ok(ApiResponse<List<SupplierReturnSlip>>.Ok(list));
    }

    [HttpPost("returns")]
    public async Task<IActionResult> CreateReturnSlip([FromBody] SupplierReturnSlip request, CancellationToken cancellationToken = default)
    {
        _context.SupplierReturnSlips.Add(request);
        await _context.SaveChangesAsync(cancellationToken);
        return Ok(ApiResponse<SupplierReturnSlip>.Ok(request, "Tạo phiếu hoàn trả hàng thành công."));
    }

    [HttpDelete("returns/{id:guid}")]
    public async Task<IActionResult> DeleteReturnSlip(Guid id, CancellationToken cancellationToken = default)
    {
        var item = await _context.SupplierReturnSlips.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (item is null)
            return NotFound(ApiResponse<bool>.Fail("Không tìm thấy phiếu trả hàng."));

        _context.SupplierReturnSlips.Remove(item);
        await _context.SaveChangesAsync(cancellationToken);
        return Ok(ApiResponse<bool>.Ok(true, "Xóa phiếu trả hàng thành công."));
    }
}
