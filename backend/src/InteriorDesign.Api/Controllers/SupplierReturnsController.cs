using System.Text.Json;
using System.Text.Encodings.Web;
using InteriorDesign.Domain.Entities;
using InteriorDesign.Infrastructure.Data;
using InteriorDesign.Integration.Common;
using InteriorDesign.Integration.Requests;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InteriorDesign.Api.Controllers;

[Route("api/inventory/returns")]
[Route("api/supplier-returns")]
public sealed class SupplierReturnsController : ApiControllerBase
{
    private readonly InteriorDbContext _context;

    public SupplierReturnsController(InteriorDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Lấy danh sách phiếu trả hàng cho nhà cung cấp (Hỗ trợ tìm kiếm, lọc nhà cung cấp, kho, trạng thái)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetSupplierReturns(
        [FromQuery] string? search = null,
        [FromQuery] string? supplier = null,
        [FromQuery] string? warehouse = null,
        [FromQuery] string? status = null,
        [FromQuery] bool includeDeleted = false,
        [FromQuery] int? page = null,
        [FromQuery] int? pageSize = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var query = includeDeleted
                ? _context.SupplierReturnSlips.IgnoreQueryFilters().AsNoTracking().AsQueryable()
                : _context.SupplierReturnSlips.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim().ToLower();
                query = query.Where(x =>
                    x.Code.ToLower().Contains(s) ||
                    x.SourceImportCode.ToLower().Contains(s) ||
                    x.ItemName.ToLower().Contains(s) ||
                    x.SupplierName.ToLower().Contains(s) ||
                    x.WarehouseName.ToLower().Contains(s) ||
                    x.Reason.ToLower().Contains(s) ||
                    x.Note.ToLower().Contains(s));
            }

            if (!string.IsNullOrWhiteSpace(supplier) && supplier != "all")
            {
                var sup = supplier.Trim().ToLower();
                query = query.Where(x => x.SupplierName.ToLower().Contains(sup));
            }

            if (!string.IsNullOrWhiteSpace(warehouse) && warehouse != "all")
            {
                var w = warehouse.Trim().ToLower();
                query = query.Where(x => x.WarehouseName.ToLower().Contains(w));
            }

            if (!string.IsNullOrWhiteSpace(status) && status != "all")
            {
                query = query.Where(x => x.Status.ToLower() == status.Trim().ToLower());
            }

            query = query.OrderByDescending(x => x.CreatedAt);

            if (page.HasValue && pageSize.HasValue && pageSize.Value > 0)
            {
                var p = Math.Max(1, page.Value);
                var ps = Math.Clamp(pageSize.Value, 1, 200);
                query = query.Skip((p - 1) * ps).Take(ps);
            }

            var list = await query.ToListAsync(cancellationToken);

            return Ok(ApiResponse<List<SupplierReturnSlip>>.Ok(list, "Lấy danh sách phiếu trả hàng thành công."));
        }
        catch (OperationCanceledException)
        {
            return StatusCode(499);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<List<SupplierReturnSlip>>.Fail($"Lỗi máy chủ khi lấy danh sách phiếu trả hàng: {ex.Message}"));
        }
    }

    /// <summary>
    /// Lấy chi tiết phiếu trả hàng theo ID
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetSupplierReturnById(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var item = await _context.SupplierReturnSlips
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

            if (item == null)
            {
                return NotFound(ApiResponse<SupplierReturnSlip>.Fail("Không tìm thấy phiếu trả hàng."));
            }

            return Ok(ApiResponse<SupplierReturnSlip>.Ok(item, "Lấy chi tiết phiếu trả hàng thành công."));
        }
        catch (OperationCanceledException)
        {
            return StatusCode(499);
        }
    }

    /// <summary>
    /// Tạo mới phiếu trả hàng cho NCC
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateSupplierReturn([FromBody] CreateSupplierReturnSlipRequest request, CancellationToken cancellationToken = default)
    {
        if (request == null)
        {
            return BadRequest(ApiResponse<SupplierReturnSlip>.Fail("Dữ liệu phiếu trả hàng không hợp lệ."));
        }

        var code = string.IsNullOrWhiteSpace(request.Code)
            ? $"TH{DateTime.Now:yyyyMMddHHmmss}"
            : request.Code.Trim().ToUpper();

        var exists = await _context.SupplierReturnSlips.AnyAsync(x => x.Code == code, cancellationToken);
        if (exists)
        {
            code = $"TH{DateTime.Now:yyyyMMddHHmmss}_{new Random().Next(100, 999)}";
        }

        var refund = request.SupplierRefund > 0
            ? request.SupplierRefund
            : Math.Max(0, request.TotalValue - request.Discount);

        var slip = new SupplierReturnSlip
        {
            Code = code,
            SourceImportCode = request.SourceImportCode?.Trim() ?? string.Empty,
            SupplierId = request.SupplierId,
            SupplierName = request.SupplierName?.Trim() ?? string.Empty,
            WarehouseId = request.WarehouseId,
            WarehouseName = request.WarehouseName?.Trim() ?? "Tổng Kho Mộc Gia",
            ItemName = request.ItemName?.Trim() ?? string.Empty,
            Quantity = request.Quantity > 0 ? request.Quantity : 1,
            Unit = request.Unit ?? "bộ",
            TotalValue = request.TotalValue,
            Discount = request.Discount,
            SupplierRefund = refund,
            PaidAmount = request.PaidAmount,
            ReturnDate = !string.IsNullOrWhiteSpace(request.ReturnDate) ? request.ReturnDate : DateTime.Now.ToString("yyyy-MM-dd HH:mm"),
            Reason = request.Reason?.Trim() ?? "Lỗi quy cách / Kiểm định không đạt",
            Solution = request.Solution?.Trim() ?? "Cấn trừ vào công nợ",
            PaymentMethod = request.PaymentMethod?.Trim() ?? "Chuyển khoản",
            Status = request.Status ?? "completed",
            StatusLabel = request.StatusLabel ?? (request.Status == "draft" ? "Lưu tạm" : "Đã cấn trừ công nợ"),
            StaffName = request.StaffName?.Trim() ?? "Quản lý kho",
            Note = request.Note?.Trim() ?? string.Empty,
            ItemsJson = request.ItemsJson ?? "[]",
            CreatedAt = DateTimeOffset.UtcNow,
        };

        _context.SupplierReturnSlips.Add(slip);

        // Giảm công nợ nhà cung cấp nếu có cấn trừ
        Supplier? supplier = null;
        if (request.SupplierId.HasValue)
        {
            supplier = await _context.Suppliers.FindAsync(new object[] { request.SupplierId.Value }, cancellationToken);
        }
        else if (!string.IsNullOrWhiteSpace(request.SupplierName))
        {
            var trimmedSupplierName = request.SupplierName.Trim().ToLower();
            supplier = await _context.Suppliers.FirstOrDefaultAsync(s => s.Name.ToLower() == trimmedSupplierName, cancellationToken);
            if (supplier != null && !slip.SupplierId.HasValue)
            {
                slip.SupplierId = supplier.Id;
            }
        }

        if (supplier != null && string.Equals(slip.Status, "completed", StringComparison.OrdinalIgnoreCase))
        {
            supplier.CurrentDebt = Math.Max(0, supplier.CurrentDebt - refund);
        }

        // Tự động giảm tồn kho (InStock) của các sản phẩm trả lại NCC theo từng Chi nhánh / Kho cụ thể
        if (string.Equals(slip.Status, "completed", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(slip.ItemsJson) && slip.ItemsJson != "[]")
        {
            await ApplySupplierReturnProductsAsync(slip, cancellationToken);
        }

        await _context.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetSupplierReturnById), new { id = slip.Id }, ApiResponse<SupplierReturnSlip>.Ok(slip, "Tạo phiếu trả hàng thành công."));
    }

    private async Task ApplySupplierReturnProductsAsync(SupplierReturnSlip slip, CancellationToken cancellationToken)
    {
        try
        {
            string targetBranch = string.Empty;
            if (slip.WarehouseId.HasValue && slip.WarehouseId.Value != Guid.Empty)
            {
                var wh = await _context.Warehouses.FirstOrDefaultAsync(w => w.Id == slip.WarehouseId.Value, cancellationToken);
                if (wh != null)
                {
                    targetBranch = !string.IsNullOrWhiteSpace(wh.Branch) ? wh.Branch : wh.Name;
                }
            }
            if (string.IsNullOrWhiteSpace(targetBranch) && !string.IsNullOrWhiteSpace(slip.WarehouseName))
            {
                var wh = await _context.Warehouses.FirstOrDefaultAsync(w => w.Name == slip.WarehouseName, cancellationToken);
                if (wh != null)
                {
                    targetBranch = !string.IsNullOrWhiteSpace(wh.Branch) ? wh.Branch : wh.Name;
                }
                else
                {
                    var br = await _context.Branches.FirstOrDefaultAsync(b => b.Name == slip.WarehouseName, cancellationToken);
                    if (br != null)
                    {
                        targetBranch = br.Name;
                    }
                    else
                    {
                        targetBranch = slip.WarehouseName;
                    }
                }
            }
            var allBranches = await _context.Branches.Where(b => !b.IsDeleted).ToListAsync(cancellationToken);
            var allWarehouses = await _context.Warehouses.Where(w => !w.IsDeleted).ToListAsync(cancellationToken);

            if (string.IsNullOrWhiteSpace(targetBranch))
            {
                var defBr = allBranches.FirstOrDefault(b => b.Status == "active");
                targetBranch = defBr?.Name ?? "Chi nhánh Hà Nội";
            }

            var matchedBranch = BranchMatcher.FindMatchingBranch(allBranches, targetBranch, allWarehouses);
            if (matchedBranch != null)
            {
                targetBranch = matchedBranch.Name;
            }

            using var doc = JsonDocument.Parse(slip.ItemsJson);
            if (doc.RootElement.ValueKind == JsonValueKind.Array)
            {
                var allProducts = await _context.Products.ToListAsync(cancellationToken);

                foreach (var elem in doc.RootElement.EnumerateArray())
                {
                    var idStr = elem.TryGetProperty("id", out var idProp) ? idProp.GetString() : null;
                    var productIdStr = elem.TryGetProperty("productId", out var pidProp) ? pidProp.GetString() : null;
                    var codeStr = elem.TryGetProperty("code", out var codeProp) ? codeProp.GetString() : (elem.TryGetProperty("sku", out var skuProp) ? skuProp.GetString() : null);
                    var nameStr = elem.TryGetProperty("name", out var nameProp) ? nameProp.GetString() : null;
                    var qty = elem.TryGetProperty("quantity", out var qtyProp) ? (qtyProp.ValueKind == JsonValueKind.Number ? qtyProp.GetDecimal() : 0) : 0;
                    if (qty <= 0) continue;

                    Product? product = null;
                    if (!string.IsNullOrWhiteSpace(productIdStr) && Guid.TryParse(productIdStr, out var pGuid))
                    {
                        product = allProducts.FirstOrDefault(p => p.Id == pGuid);
                    }
                    if (product == null && !string.IsNullOrWhiteSpace(idStr))
                    {
                        if (Guid.TryParse(idStr, out var prodGuid))
                        {
                            product = allProducts.FirstOrDefault(p => p.Id == prodGuid);
                        }
                        else if (idStr.StartsWith("prod_", StringComparison.OrdinalIgnoreCase))
                        {
                            var strippedCode = idStr.Substring(5);
                            product = allProducts.FirstOrDefault(p => string.Equals(p.Sku, strippedCode, StringComparison.OrdinalIgnoreCase));
                        }
                    }
                    if (product == null && !string.IsNullOrWhiteSpace(codeStr))
                    {
                        var cleanCode = codeStr.Trim();
                        product = allProducts.FirstOrDefault(p =>
                            string.Equals(p.Sku, cleanCode, StringComparison.OrdinalIgnoreCase) ||
                            string.Equals(p.Sku.Replace("-", "").Replace("_", ""), cleanCode.Replace("-", "").Replace("_", ""), StringComparison.OrdinalIgnoreCase));
                    }
                    if (product == null && !string.IsNullOrWhiteSpace(nameStr))
                    {
                        var cleanName = nameStr.Trim();
                        product = allProducts.FirstOrDefault(p => string.Equals(p.Name, cleanName, StringComparison.OrdinalIgnoreCase));
                    }

                    if (product != null)
                    {
                        var bStocks = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
                        if (!string.IsNullOrWhiteSpace(product.BranchStocksJson) && product.BranchStocksJson != "{}")
                        {
                            try
                            {
                                bStocks = JsonSerializer.Deserialize<Dictionary<string, int>>(product.BranchStocksJson) ?? new(StringComparer.OrdinalIgnoreCase);
                            }
                            catch { }
                        }

                        var existingKey = bStocks.Keys.FirstOrDefault(k => BranchMatcher.IsBranchMatch(k, targetBranch, allBranches, allWarehouses));
                        if (existingKey != null && bStocks.TryGetValue(existingKey, out var curVal))
                        {
                            bStocks[existingKey] = Math.Max(0, curVal - (int)Math.Round(qty));
                        }
                        else
                        {
                            bStocks[targetBranch] = 0;
                        }

                        var jsonOptions = new JsonSerializerOptions { Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping };
                        product.BranchStocksJson = JsonSerializer.Serialize(bStocks, jsonOptions);
                        product.InStock = bStocks.Values.Sum();
                        product.UpdatedAt = DateTimeOffset.UtcNow;
                    }
                }
            }
        }
        catch
        {
            // Json fallback
        }
    }

    /// <summary>
    /// Cập nhật phiếu trả hàng
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateSupplierReturn(Guid id, [FromBody] UpdateSupplierReturnSlipRequest request, CancellationToken cancellationToken = default)
    {
        var slip = await _context.SupplierReturnSlips.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (slip == null)
        {
            return NotFound(ApiResponse<SupplierReturnSlip>.Fail("Không tìm thấy phiếu trả hàng cần cập nhật."));
        }

        var wasDraft = string.Equals(slip.Status, "draft", StringComparison.OrdinalIgnoreCase);

        if (!string.IsNullOrWhiteSpace(request.Code)) slip.Code = request.Code.Trim().ToUpper();
        if (request.SourceImportCode != null) slip.SourceImportCode = request.SourceImportCode.Trim();
        if (request.SupplierId.HasValue) slip.SupplierId = request.SupplierId;
        if (request.SupplierName != null) slip.SupplierName = request.SupplierName.Trim();
        if (request.WarehouseId.HasValue) slip.WarehouseId = request.WarehouseId;
        if (request.WarehouseName != null) slip.WarehouseName = request.WarehouseName.Trim();
        if (request.ItemName != null) slip.ItemName = request.ItemName.Trim();
        if (request.Quantity.HasValue) slip.Quantity = request.Quantity.Value;
        if (request.Unit != null) slip.Unit = request.Unit.Trim();
        if (request.TotalValue.HasValue) slip.TotalValue = request.TotalValue.Value;
        if (request.Discount.HasValue) slip.Discount = request.Discount.Value;
        if (request.SupplierRefund.HasValue) slip.SupplierRefund = request.SupplierRefund.Value;
        if (request.PaidAmount.HasValue) slip.PaidAmount = request.PaidAmount.Value;
        if (request.ReturnDate != null) slip.ReturnDate = request.ReturnDate.Trim();
        if (request.Reason != null) slip.Reason = request.Reason.Trim();
        if (request.Solution != null) slip.Solution = request.Solution.Trim();
        if (request.PaymentMethod != null) slip.PaymentMethod = request.PaymentMethod.Trim();
        if (request.Status != null) slip.Status = request.Status.Trim();
        if (request.StatusLabel != null) slip.StatusLabel = request.StatusLabel.Trim();
        if (request.StaffName != null) slip.StaffName = request.StaffName.Trim();
        if (request.Note != null) slip.Note = request.Note.Trim();
        if (request.ItemsJson != null) slip.ItemsJson = request.ItemsJson;

        slip.UpdatedAt = DateTimeOffset.UtcNow;

        // Nếu chuyển từ phiếu tạm (draft) sang đã hoàn tất (completed), trừ công nợ NCC và trừ tồn kho
        if (wasDraft && string.Equals(slip.Status, "completed", StringComparison.OrdinalIgnoreCase))
        {
            Supplier? targetSupplier = null;
            if (slip.SupplierId.HasValue)
            {
                targetSupplier = await _context.Suppliers.FindAsync(new object[] { slip.SupplierId.Value }, cancellationToken);
            }
            else if (!string.IsNullOrWhiteSpace(slip.SupplierName))
            {
                var trimmedSupplierName = slip.SupplierName.Trim().ToLower();
                targetSupplier = await _context.Suppliers.FirstOrDefaultAsync(s => s.Name.ToLower() == trimmedSupplierName, cancellationToken);
            }

            if (targetSupplier != null)
            {
                var refund = slip.SupplierRefund > 0 ? slip.SupplierRefund : slip.TotalValue;
                targetSupplier.CurrentDebt = Math.Max(0, targetSupplier.CurrentDebt - refund);
            }

            if (!string.IsNullOrWhiteSpace(slip.ItemsJson) && slip.ItemsJson != "[]")
            {
                await ApplySupplierReturnProductsAsync(slip, cancellationToken);
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse<SupplierReturnSlip>.Ok(slip, "Cập nhật phiếu trả hàng thành công."));
    }

    /// <summary>
    /// Xóa phiếu trả hàng (Soft delete)
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteSupplierReturn(Guid id, CancellationToken cancellationToken = default)
    {
        var slip = await _context.SupplierReturnSlips.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (slip == null)
        {
            return NotFound(ApiResponse<bool>.Fail("Không tìm thấy phiếu trả hàng cần xóa."));
        }

        slip.IsDeleted = true;
        slip.UpdatedAt = DateTimeOffset.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse<bool>.Ok(true, $"Đã xóa phiếu trả hàng {slip.Code} thành công."));
    }

    /// <summary>
    /// Xóa hàng loạt phiếu trả hàng
    /// </summary>
    [HttpPost("bulk-delete")]
    public async Task<IActionResult> BulkDeleteSupplierReturns([FromBody] BulkDeleteSupplierReturnSlipsRequest request, CancellationToken cancellationToken = default)
    {
        if (request == null || request.Ids == null || request.Ids.Count == 0)
        {
            return BadRequest(ApiResponse<int>.Fail("Vui lòng chọn ít nhất một phiếu trả hàng để xóa."));
        }

        var slips = await _context.SupplierReturnSlips
            .Where(x => request.Ids.Contains(x.Id))
            .ToListAsync(cancellationToken);

        foreach (var s in slips)
        {
            s.IsDeleted = true;
            s.UpdatedAt = DateTimeOffset.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse<int>.Ok(slips.Count, $"Đã xóa thành công {slips.Count} phiếu trả hàng."));
    }

}
