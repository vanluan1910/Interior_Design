using System.Text.Json;
using System.Text.Encodings.Web;
using InteriorDesign.Domain.Entities;
using InteriorDesign.Infrastructure.Data;
using InteriorDesign.Integration.Common;
using InteriorDesign.Integration.Requests;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InteriorDesign.Api.Controllers;

[Route("api/inventory/imports")]
[Route("api/stock-imports")]
public sealed class StockImportsController : ApiControllerBase
{
    private readonly InteriorDbContext _context;

    public StockImportsController(InteriorDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Lấy danh sách phiếu nhập hàng (Hỗ trợ tìm kiếm, lọc nhà cung cấp, kho, trạng thái, ngày)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetStockImports(
        [FromQuery] string? search = null,
        [FromQuery] string? supplier = null,
        [FromQuery] string? warehouse = null,
        [FromQuery] string? status = null,
        [FromQuery] string? fromDate = null,
        [FromQuery] string? toDate = null,
        [FromQuery] bool includeDeleted = false,
        [FromQuery] int? page = null,
        [FromQuery] int? pageSize = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var query = includeDeleted
                ? _context.StockImportSlips.IgnoreQueryFilters().AsNoTracking().AsQueryable()
                : _context.StockImportSlips.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim().ToLower();
                query = query.Where(x =>
                    x.Code.ToLower().Contains(s) ||
                    x.ItemName.ToLower().Contains(s) ||
                    x.Supplier.ToLower().Contains(s) ||
                    x.WarehouseName.ToLower().Contains(s) ||
                    x.Inspector.ToLower().Contains(s) ||
                    x.Note.ToLower().Contains(s));
            }

            if (!string.IsNullOrWhiteSpace(supplier) && supplier != "all")
            {
                var sup = supplier.Trim().ToLower();
                query = query.Where(x => x.Supplier.ToLower().Contains(sup));
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

            var importCodes = list.Select(x => x.Code).Where(c => !string.IsNullOrEmpty(c)).ToList();
            if (importCodes.Count > 0)
            {
                var cleanImportCodes = importCodes.Select(c => c.Trim().TrimStart('#')).Where(c => !string.IsNullOrEmpty(c)).Distinct().ToList();
                var allLookupCodes = importCodes.Concat(cleanImportCodes).Concat(cleanImportCodes.Select(c => "#" + c)).Distinct().ToList();

                var returns = await _context.SupplierReturnSlips
                    .Where(r => !r.IsDeleted && r.Status != "draft" && allLookupCodes.Contains(r.SourceImportCode))
                    .Select(r => new
                    {
                        r.SourceImportCode,
                        Deduction = r.SupplierRefund > 0 ? r.SupplierRefund : r.TotalValue
                    })
                    .ToListAsync(cancellationToken);

                var returnDeductions = returns
                    .GroupBy(r => r.SourceImportCode.Trim().TrimStart('#'), StringComparer.OrdinalIgnoreCase)
                    .ToDictionary(g => g.Key, g => g.Sum(x => x.Deduction), StringComparer.OrdinalIgnoreCase);

                foreach (var item in list)
                {
                    var cleanItemKey = (item.Code ?? string.Empty).Trim().TrimStart('#');
                    if (returnDeductions.TryGetValue(cleanItemKey, out var deduction))
                    {
                        var grossDebt = Math.Max(0, item.TotalValue - item.PaidAmount);
                        var validDeduction = Math.Min(item.TotalValue, deduction);
                        item.RemainingDebt = Math.Max(0, grossDebt - validDeduction);
                    }
                }
            }

            return Ok(ApiResponse<List<StockImportSlip>>.Ok(list, "Lấy danh sách phiếu nhập hàng thành công."));
        }
        catch (OperationCanceledException)
        {
            return StatusCode(499);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<List<StockImportSlip>>.Fail($"Lỗi máy chủ khi lấy danh sách phiếu nhập: {ex.Message}"));
        }
    }

    /// <summary>
    /// Lấy chi tiết phiếu nhập hàng theo ID
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetStockImportById(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var item = await _context.StockImportSlips
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

            if (item == null)
            {
                return NotFound(ApiResponse<StockImportSlip>.Fail("Không tìm thấy phiếu nhập hàng."));
            }

            var cleanItemCode = (item.Code ?? string.Empty).Trim().TrimStart('#');
            var returnDeduction = await _context.SupplierReturnSlips
                .Where(r => !r.IsDeleted && r.Status != "draft" &&
                    (r.SourceImportCode == item.Code || r.SourceImportCode == cleanItemCode || r.SourceImportCode == "#" + cleanItemCode))
                .SumAsync(r => (decimal?)(r.SupplierRefund > 0 ? r.SupplierRefund : r.TotalValue), cancellationToken) ?? 0;

            if (returnDeduction > 0)
            {
                var grossDebt = Math.Max(0, item.TotalValue - item.PaidAmount);
                var validDeduction = Math.Min(item.TotalValue, returnDeduction);
                item.RemainingDebt = Math.Max(0, grossDebt - validDeduction);
            }

            return Ok(ApiResponse<StockImportSlip>.Ok(item, "Lấy chi tiết phiếu nhập hàng thành công."));
        }
        catch (OperationCanceledException)
        {
            return StatusCode(499);
        }
    }

    /// <summary>
    /// Tạo mới phiếu nhập hàng
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateStockImport([FromBody] CreateStockImportSlipRequest request, CancellationToken cancellationToken = default)
    {
        if (request == null)
        {
            return BadRequest(ApiResponse<StockImportSlip>.Fail("Dữ liệu phiếu nhập không hợp lệ."));
        }

        var code = string.IsNullOrWhiteSpace(request.Code)
            ? $"PN{DateTime.Now:yyyyMMddHHmmss}"
            : request.Code.Trim().ToUpper();

        var exists = await _context.StockImportSlips.AnyAsync(x => x.Code == code, cancellationToken);
        if (exists)
        {
            code = $"PN{DateTime.Now:yyyyMMddHHmmss}_{new Random().Next(100, 999)}";
        }

        var total = request.TotalValue > 0
            ? request.TotalValue
            : Math.Max(0, (request.Quantity * request.UnitPrice) - request.Discount);

        var remaining = Math.Max(0, total - request.PaidAmount);

        var slip = new StockImportSlip
        {
            Code = code,
            Supplier = request.Supplier?.Trim() ?? string.Empty,
            SupplierId = request.SupplierId,
            WarehouseName = request.WarehouseName?.Trim() ?? "Tổng Kho Mộc Gia",
            WarehouseId = request.WarehouseId,
            ItemName = request.ItemName?.Trim() ?? string.Empty,
            Spec = request.Spec?.Trim() ?? string.Empty,
            Quantity = request.Quantity > 0 ? request.Quantity : 1,
            Unit = request.Unit ?? "bộ",
            UnitPrice = request.UnitPrice,
            Discount = request.Discount,
            TotalValue = total,
            PaidAmount = request.PaidAmount,
            RemainingDebt = remaining,
            Mc = request.Mc ?? "< 12%",
            ImportDate = !string.IsNullOrWhiteSpace(request.ImportDate) ? request.ImportDate : DateTime.Now.ToString("yyyy-MM-dd HH:mm"),
            Status = request.Status ?? "completed",
            StatusLabel = request.StatusLabel ?? (request.Status == "draft" ? "Lưu tạm" : "Đã nhập kho"),
            Inspector = request.Inspector?.Trim() ?? "Quản lý kho",
            Note = request.Note?.Trim() ?? string.Empty,
            ItemsJson = request.ItemsJson ?? "[]",
            CreatedAt = DateTimeOffset.UtcNow,
        };

        _context.StockImportSlips.Add(slip);

        // Tăng công nợ và tổng mua của nhà cung cấp nếu có
        Supplier? supplier = null;
        if (request.SupplierId.HasValue)
        {
            supplier = await _context.Suppliers.FindAsync(new object[] { request.SupplierId.Value }, cancellationToken);
        }
        else if (!string.IsNullOrWhiteSpace(request.Supplier))
        {
            var trimmedSupplierName = request.Supplier.Trim().ToLower();
            supplier = await _context.Suppliers.FirstOrDefaultAsync(s => s.Name.ToLower() == trimmedSupplierName, cancellationToken);
            if (supplier != null)
            {
                slip.SupplierId = supplier.Id;
            }
        }

        if (supplier != null && string.Equals(slip.Status, "completed", StringComparison.OrdinalIgnoreCase))
        {
            supplier.TotalPurchased += total;
            supplier.CurrentDebt += remaining;
            supplier.TotalCollected += request.PaidAmount;
        }

        // Tự động tăng tồn kho (InStock) của các sản phẩm nhập kho theo từng Chi nhánh / Kho cụ thể nếu trạng thái là hoàn tất
        if (slip.Status == "completed" && !string.IsNullOrWhiteSpace(slip.ItemsJson) && slip.ItemsJson != "[]")
        {
            await ApplyStockImportProductsAsync(slip, cancellationToken);
        }

        await _context.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetStockImportById), new { id = slip.Id }, ApiResponse<StockImportSlip>.Ok(slip, "Tạo phiếu nhập hàng thành công."));
    }

    /// <summary>
    /// Cập nhật thông tin phiếu nhập hàng
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateStockImport(Guid id, [FromBody] UpdateStockImportSlipRequest request, CancellationToken cancellationToken = default)
    {
        var slip = await _context.StockImportSlips.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (slip == null)
        {
            return NotFound(ApiResponse<StockImportSlip>.Fail("Không tìm thấy phiếu nhập hàng cần cập nhật."));
        }

        var wasDraft = string.Equals(slip.Status, "draft", StringComparison.OrdinalIgnoreCase);

        if (!string.IsNullOrWhiteSpace(request.Code)) slip.Code = request.Code.Trim().ToUpper();
        if (request.Supplier != null) slip.Supplier = request.Supplier.Trim();
        if (request.SupplierId.HasValue) slip.SupplierId = request.SupplierId;
        if (request.WarehouseName != null) slip.WarehouseName = request.WarehouseName.Trim();
        if (request.WarehouseId.HasValue) slip.WarehouseId = request.WarehouseId;
        if (request.ItemName != null) slip.ItemName = request.ItemName.Trim();
        if (request.Spec != null) slip.Spec = request.Spec.Trim();
        if (request.Quantity.HasValue) slip.Quantity = request.Quantity.Value;
        if (request.Unit != null) slip.Unit = request.Unit.Trim();
        if (request.UnitPrice.HasValue) slip.UnitPrice = request.UnitPrice.Value;
        if (request.Discount.HasValue) slip.Discount = request.Discount.Value;
        if (request.TotalValue.HasValue) slip.TotalValue = request.TotalValue.Value;
        if (request.PaidAmount.HasValue) slip.PaidAmount = request.PaidAmount.Value;
        if (request.RemainingDebt.HasValue) slip.RemainingDebt = request.RemainingDebt.Value;
        if (request.Mc != null) slip.Mc = request.Mc.Trim();
        if (request.ImportDate != null) slip.ImportDate = request.ImportDate.Trim();
        if (request.Status != null) slip.Status = request.Status.Trim();
        if (request.StatusLabel != null) slip.StatusLabel = request.StatusLabel.Trim();
        if (request.Inspector != null) slip.Inspector = request.Inspector.Trim();
        if (request.Note != null) slip.Note = request.Note.Trim();
        if (request.ItemsJson != null) slip.ItemsJson = request.ItemsJson;

        slip.UpdatedAt = DateTimeOffset.UtcNow;

        // Nếu chuyển từ phiếu tạm (draft) sang đã nhập kho (completed), tự động cộng tồn kho vào chi nhánh và ghi nhận công nợ nhà cung cấp
        if (wasDraft && string.Equals(slip.Status, "completed", StringComparison.OrdinalIgnoreCase))
        {
            Supplier? targetSupplier = null;
            if (slip.SupplierId.HasValue)
            {
                targetSupplier = await _context.Suppliers.FindAsync(new object[] { slip.SupplierId.Value }, cancellationToken);
            }
            else if (!string.IsNullOrWhiteSpace(slip.Supplier))
            {
                var trimmedSupplierName = slip.Supplier.Trim().ToLower();
                targetSupplier = await _context.Suppliers.FirstOrDefaultAsync(s => s.Name.ToLower() == trimmedSupplierName, cancellationToken);
            }

            if (targetSupplier != null)
            {
                targetSupplier.TotalPurchased += slip.TotalValue;
                targetSupplier.CurrentDebt += slip.RemainingDebt;
                targetSupplier.TotalCollected += slip.PaidAmount;
            }

            if (!string.IsNullOrWhiteSpace(slip.ItemsJson) && slip.ItemsJson != "[]")
            {
                await ApplyStockImportProductsAsync(slip, cancellationToken);
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse<StockImportSlip>.Ok(slip, "Cập nhật phiếu nhập hàng thành công."));
    }

    private async Task ApplyStockImportProductsAsync(StockImportSlip slip, CancellationToken cancellationToken)
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
                            bStocks[existingKey] = curVal + (int)Math.Round(qty);
                        }
                        else
                        {
                            bStocks[targetBranch] = (int)Math.Round(qty);
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
    /// Xóa phiếu nhập hàng (Soft delete)
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteStockImport(Guid id, CancellationToken cancellationToken = default)
    {
        var slip = await _context.StockImportSlips.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (slip == null)
        {
            return NotFound(ApiResponse<bool>.Fail("Không tìm thấy phiếu nhập hàng cần xóa."));
        }

        slip.IsDeleted = true;
        slip.UpdatedAt = DateTimeOffset.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse<bool>.Ok(true, $"Đã xóa phiếu nhập hàng {slip.Code} thành công."));
    }

    /// <summary>
    /// Xóa hàng loạt phiếu nhập hàng
    /// </summary>
    [HttpPost("bulk-delete")]
    public async Task<IActionResult> BulkDeleteStockImports([FromBody] BulkDeleteStockImportSlipsRequest request, CancellationToken cancellationToken = default)
    {
        if (request == null || request.Ids == null || request.Ids.Count == 0)
        {
            return BadRequest(ApiResponse<int>.Fail("Vui lòng chọn ít nhất một phiếu nhập để xóa."));
        }

        var slips = await _context.StockImportSlips
            .Where(x => request.Ids.Contains(x.Id))
            .ToListAsync(cancellationToken);

        foreach (var s in slips)
        {
            s.IsDeleted = true;
            s.UpdatedAt = DateTimeOffset.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse<int>.Ok(slips.Count, $"Đã xóa thành công {slips.Count} phiếu nhập hàng."));
    }

}
