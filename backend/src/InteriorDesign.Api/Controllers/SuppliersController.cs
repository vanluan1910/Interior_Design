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

    [HttpGet]
    public async Task<IActionResult> GetSuppliers([FromQuery] string? search = null, [FromQuery] string? status = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Suppliers.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(x => x.Name.ToLower().Contains(s) || x.Code.ToLower().Contains(s) || x.ContactPerson.ToLower().Contains(s) || x.Phone.Contains(s));
        }

        if (!string.IsNullOrWhiteSpace(status) && status != "all")
        {
            query = query.Where(x => x.Status == status);
        }

        var suppliers = await query.OrderByDescending(x => x.CreatedAt).ToListAsync(cancellationToken);
        return Ok(ApiResponse<List<Supplier>>.Ok(suppliers));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetSupplierById(Guid id, CancellationToken cancellationToken)
    {
        var supplier = await _context.Suppliers.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (supplier is null)
            return NotFound(ApiResponse<Supplier>.Fail("Không tìm thấy nhà cung cấp."));

        return Ok(ApiResponse<Supplier>.Ok(supplier));
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> CreateSupplier([FromBody] Supplier request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(ApiResponse<Supplier>.Fail("Tên nhà cung cấp không được để trống."));

        if (string.IsNullOrWhiteSpace(request.Code))
        {
            var count = await _context.Suppliers.CountAsync(cancellationToken);
            request.Code = $"NCC{(count + 1).ToString().PadLeft(2, '0')}";
        }

        _context.Suppliers.Add(request);
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse<Supplier>.Ok(request, "Thêm nhà cung cấp thành công."));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> UpdateSupplier(Guid id, [FromBody] Supplier request, CancellationToken cancellationToken)
    {
        var supplier = await _context.Suppliers.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (supplier is null)
            return NotFound(ApiResponse<Supplier>.Fail("Không tìm thấy nhà cung cấp."));

        supplier.Name = request.Name;
        supplier.ContactPerson = request.ContactPerson;
        supplier.Phone = request.Phone;
        supplier.Email = request.Email;
        supplier.Address = request.Address;
        supplier.TaxCode = request.TaxCode;
        supplier.Status = request.Status;
        supplier.Note = request.Note;
        supplier.TotalPurchased = request.TotalPurchased;

        await _context.SaveChangesAsync(cancellationToken);
        return Ok(ApiResponse<Supplier>.Ok(supplier, "Cập nhật nhà cung cấp thành công."));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteSupplier(Guid id, CancellationToken cancellationToken)
    {
        var supplier = await _context.Suppliers.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (supplier is null)
            return NotFound(ApiResponse<bool>.Fail("Không tìm thấy nhà cung cấp."));

        _context.Suppliers.Remove(supplier);
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse<bool>.Ok(true, "Xóa nhà cung cấp thành công."));
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
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> CreateImportSlip([FromBody] StockImportSlip request, CancellationToken cancellationToken)
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
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> CreateReturnSlip([FromBody] SupplierReturnSlip request, CancellationToken cancellationToken)
    {
        _context.SupplierReturnSlips.Add(request);
        await _context.SaveChangesAsync(cancellationToken);
        return Ok(ApiResponse<SupplierReturnSlip>.Ok(request, "Tạo phiếu hoàn trả hàng thành công."));
    }

    [HttpDelete("returns/{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteReturnSlip(Guid id, CancellationToken cancellationToken)
    {
        var item = await _context.SupplierReturnSlips.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (item is null)
            return NotFound(ApiResponse<bool>.Fail("Không tìm thấy phiếu trả hàng."));

        _context.SupplierReturnSlips.Remove(item);
        await _context.SaveChangesAsync(cancellationToken);
        return Ok(ApiResponse<bool>.Ok(true, "Xóa phiếu trả hàng thành công."));
    }
}
