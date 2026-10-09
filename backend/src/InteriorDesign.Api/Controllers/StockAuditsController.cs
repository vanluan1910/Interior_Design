using System.Text.Json;
using InteriorDesign.Domain.Entities;
using InteriorDesign.Infrastructure.Data;
using InteriorDesign.Integration.Common;
using InteriorDesign.Integration.Requests;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InteriorDesign.Api.Controllers;

[Route("api/inventory/audits")]
[Route("api/stock-audits")]
public sealed class StockAuditsController : ApiControllerBase
{
    private readonly InteriorDbContext _context;

    public StockAuditsController(InteriorDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Lấy danh sách các đợt kiểm kho (Hỗ trợ tìm kiếm, lọc theo kho, trạng thái)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetStockAudits(
        [FromQuery] string? search = null,
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
                ? _context.StockAuditSlips.IgnoreQueryFilters().AsNoTracking().AsQueryable()
                : _context.StockAuditSlips.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim().ToLower();
                query = query.Where(x =>
                    x.Code.ToLower().Contains(s) ||
                    x.Title.ToLower().Contains(s) ||
                    x.ScopeLabel.ToLower().Contains(s) ||
                    x.Creator.ToLower().Contains(s) ||
                    x.Note.ToLower().Contains(s));
            }

            if (!string.IsNullOrWhiteSpace(warehouse) && warehouse != "all")
            {
                var w = warehouse.Trim().ToLower();
                query = query.Where(x => x.ScopeLabel.ToLower().Contains(w));
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

            return Ok(ApiResponse<List<StockAuditSlip>>.Ok(list, "Lấy danh sách phiếu kiểm kho thành công."));
        }
        catch (OperationCanceledException)
        {
            return StatusCode(499);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<List<StockAuditSlip>>.Fail($"Lỗi máy chủ khi lấy danh sách kiểm kho: {ex.Message}"));
        }
    }

    /// <summary>
    /// Lấy chi tiết phiên kiểm kho theo ID
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetStockAuditById(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var item = await _context.StockAuditSlips
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

            if (item == null)
            {
                return NotFound(ApiResponse<StockAuditSlip>.Fail("Không tìm thấy phiếu kiểm kho."));
            }

            return Ok(ApiResponse<StockAuditSlip>.Ok(item, "Lấy chi tiết phiếu kiểm kho thành công."));
        }
        catch (OperationCanceledException)
        {
            return StatusCode(499);
        }
    }

    /// <summary>
    /// Tạo mới phiên kiểm kho
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateStockAudit([FromBody] CreateStockAuditSlipRequest request, CancellationToken cancellationToken = default)
    {
        if (request == null)
        {
            return BadRequest(ApiResponse<StockAuditSlip>.Fail("Dữ liệu phiếu kiểm kho không hợp lệ."));
        }

        var code = string.IsNullOrWhiteSpace(request.Code)
            ? $"KK{DateTime.Now:yyyyMMddHHmmss}"
            : request.Code.Trim().ToUpper();

        var exists = await _context.StockAuditSlips.AnyAsync(x => x.Code == code, cancellationToken);
        if (exists)
        {
            code = $"KK{DateTime.Now:yyyyMMddHHmmss}_{new Random().Next(100, 999)}";
        }

        var slip = new StockAuditSlip
        {
            Code = code,
            Title = !string.IsNullOrWhiteSpace(request.Title) ? request.Title.Trim() : $"Kiểm kê kho {DateTime.Now:MM/yyyy}",
            WarehouseId = request.WarehouseId,
            ScopeLabel = request.ScopeLabel?.Trim() ?? "Toàn bộ kho & showroom",
            Creator = request.Creator?.Trim() ?? "Quản trị viên",
            AuditDate = !string.IsNullOrWhiteSpace(request.AuditDate) ? request.AuditDate : DateTime.Now.ToString("yyyy-MM-dd"),
            Status = request.Status ?? "in_progress",
            StatusLabel = request.StatusLabel ?? (request.Status == "completed" ? "Đã hoàn tất 100%" : "Đang kiểm đếm"),
            TotalItems = request.TotalItems,
            MatchedItems = request.MatchedItems,
            DiscrepantItems = request.DiscrepantItems,
            TotalDifferenceValue = request.TotalDifferenceValue,
            Note = request.Note?.Trim() ?? string.Empty,
            ItemsJson = request.ItemsJson ?? "[]",
            CreatedAt = DateTimeOffset.UtcNow,
        };

        _context.StockAuditSlips.Add(slip);

        // Cân bằng tồn kho (InStock) theo số lượng thực tế kiểm đếm (actualQty) theo từng Chi nhánh / Kho cụ thể nếu trạng thái là hoàn tất
        if (slip.Status == "completed" && !string.IsNullOrWhiteSpace(slip.ItemsJson) && slip.ItemsJson != "[]")
        {
            try
            {
                string targetBranch = string.Empty;
                if (slip.WarehouseId.HasValue && slip.WarehouseId.Value != Guid.Empty)
                {
                    var wh = await _context.Warehouses.FirstOrDefaultAsync(w => w.Id == slip.WarehouseId.Value, cancellationToken);
                    if (wh != null && !string.IsNullOrWhiteSpace(wh.Branch))
                    {
                        targetBranch = wh.Branch;
                    }
                }
                if (string.IsNullOrWhiteSpace(targetBranch) && !string.IsNullOrWhiteSpace(slip.ScopeLabel))
                {
                    var wh = await _context.Warehouses.FirstOrDefaultAsync(w => w.Name == slip.ScopeLabel, cancellationToken);
                    if (wh != null && !string.IsNullOrWhiteSpace(wh.Branch))
                    {
                        targetBranch = wh.Branch;
                    }
                    else
                    {
                        var br = await _context.Branches.FirstOrDefaultAsync(b => b.Name == slip.ScopeLabel, cancellationToken);
                        if (br != null)
                        {
                            targetBranch = br.Name;
                        }
                    }
                }
                if (string.IsNullOrWhiteSpace(targetBranch))
                {
                    var defBr = await _context.Branches.FirstOrDefaultAsync(b => !b.IsDeleted, cancellationToken);
                    targetBranch = defBr?.Name ?? "Chi nhánh Hà Nội";
                }

                using var doc = JsonDocument.Parse(slip.ItemsJson);
                if (doc.RootElement.ValueKind == JsonValueKind.Array)
                {
                    foreach (var elem in doc.RootElement.EnumerateArray())
                    {
                        var idStr = elem.TryGetProperty("id", out var idProp) ? idProp.GetString() : null;
                        var codeStr = elem.TryGetProperty("code", out var codeProp) ? codeProp.GetString() : null;
                        var nameStr = elem.TryGetProperty("name", out var nameProp) ? nameProp.GetString() : null;
                        var actualQty = elem.TryGetProperty("actualQty", out var actProp)
                            ? (actProp.ValueKind == JsonValueKind.Number ? actProp.GetDecimal() : 0)
                            : (elem.TryGetProperty("quantity", out var qProp) && qProp.ValueKind == JsonValueKind.Number ? qProp.GetDecimal() : 0);

                        Product? product = null;
                        if (!string.IsNullOrWhiteSpace(idStr) && Guid.TryParse(idStr, out var prodGuid))
                        {
                            product = await _context.Products.FirstOrDefaultAsync(p => p.Id == prodGuid, cancellationToken);
                        }
                        if (product == null && !string.IsNullOrWhiteSpace(codeStr))
                        {
                            product = await _context.Products.FirstOrDefaultAsync(p => p.Sku == codeStr, cancellationToken);
                        }
                        if (product == null && !string.IsNullOrWhiteSpace(nameStr))
                        {
                            product = await _context.Products.FirstOrDefaultAsync(p => p.Name == nameStr, cancellationToken);
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

                            var existingKey = bStocks.Keys.FirstOrDefault(k => string.Equals(k, targetBranch, StringComparison.OrdinalIgnoreCase) || k.Contains(targetBranch, StringComparison.OrdinalIgnoreCase) || targetBranch.Contains(k, StringComparison.OrdinalIgnoreCase));
                            if (existingKey != null)
                            {
                                bStocks[existingKey] = Math.Max(0, (int)Math.Round(actualQty));
                            }
                            else
                            {
                                bStocks[targetBranch] = Math.Max(0, (int)Math.Round(actualQty));
                            }

                            product.BranchStocksJson = JsonSerializer.Serialize(bStocks);
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

        await _context.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetStockAuditById), new { id = slip.Id }, ApiResponse<StockAuditSlip>.Ok(slip, "Tạo phiên kiểm kho thành công."));
    }

    /// <summary>
    /// Cập nhật phiên kiểm kho
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateStockAudit(Guid id, [FromBody] UpdateStockAuditSlipRequest request, CancellationToken cancellationToken = default)
    {
        var slip = await _context.StockAuditSlips.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (slip == null)
        {
            return NotFound(ApiResponse<StockAuditSlip>.Fail("Không tìm thấy phiếu kiểm kho cần cập nhật."));
        }

        if (!string.IsNullOrWhiteSpace(request.Code)) slip.Code = request.Code.Trim().ToUpper();
        if (request.Title != null) slip.Title = request.Title.Trim();
        if (request.WarehouseId.HasValue) slip.WarehouseId = request.WarehouseId;
        if (request.ScopeLabel != null) slip.ScopeLabel = request.ScopeLabel.Trim();
        if (request.Creator != null) slip.Creator = request.Creator.Trim();
        if (request.AuditDate != null) slip.AuditDate = request.AuditDate.Trim();
        if (request.Status != null) slip.Status = request.Status.Trim();
        if (request.StatusLabel != null) slip.StatusLabel = request.StatusLabel.Trim();
        if (request.TotalItems.HasValue) slip.TotalItems = request.TotalItems.Value;
        if (request.MatchedItems.HasValue) slip.MatchedItems = request.MatchedItems.Value;
        if (request.DiscrepantItems.HasValue) slip.DiscrepantItems = request.DiscrepantItems.Value;
        if (request.TotalDifferenceValue.HasValue) slip.TotalDifferenceValue = request.TotalDifferenceValue.Value;
        if (request.Note != null) slip.Note = request.Note.Trim();
        if (request.ItemsJson != null) slip.ItemsJson = request.ItemsJson;

        // Cân bằng tồn kho (InStock) nếu cập nhật sang trạng thái hoàn tất
        if (slip.Status == "completed" && !string.IsNullOrWhiteSpace(slip.ItemsJson) && slip.ItemsJson != "[]")
        {
            try
            {
                using var doc = JsonDocument.Parse(slip.ItemsJson);
                if (doc.RootElement.ValueKind == JsonValueKind.Array)
                {
                    foreach (var elem in doc.RootElement.EnumerateArray())
                    {
                        var idStr = elem.TryGetProperty("id", out var idProp) ? idProp.GetString() : null;
                        var codeStr = elem.TryGetProperty("code", out var codeProp) ? codeProp.GetString() : null;
                        var nameStr = elem.TryGetProperty("name", out var nameProp) ? nameProp.GetString() : null;
                        var actualQty = elem.TryGetProperty("actualQty", out var actProp)
                            ? (actProp.ValueKind == JsonValueKind.Number ? actProp.GetDecimal() : 0)
                            : (elem.TryGetProperty("quantity", out var qProp) && qProp.ValueKind == JsonValueKind.Number ? qProp.GetDecimal() : 0);

                        Product? product = null;
                        if (!string.IsNullOrWhiteSpace(idStr) && Guid.TryParse(idStr, out var prodGuid))
                        {
                            product = await _context.Products.FirstOrDefaultAsync(p => p.Id == prodGuid, cancellationToken);
                        }
                        if (product == null && !string.IsNullOrWhiteSpace(codeStr))
                        {
                            product = await _context.Products.FirstOrDefaultAsync(p => p.Sku == codeStr, cancellationToken);
                        }
                        if (product == null && !string.IsNullOrWhiteSpace(nameStr))
                        {
                            product = await _context.Products.FirstOrDefaultAsync(p => p.Name == nameStr, cancellationToken);
                        }

                        if (product != null)
                        {
                            product.InStock = Math.Max(0, (int)Math.Round(actualQty));
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

        slip.UpdatedAt = DateTimeOffset.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse<StockAuditSlip>.Ok(slip, "Cập nhật phiếu kiểm kho thành công."));
    }

    /// <summary>
    /// Hoàn tất và cân bằng tồn kho từ phiên kiểm kê
    /// </summary>
    [HttpPost("{id:guid}/complete")]
    public async Task<IActionResult> CompleteStockAudit(Guid id, [FromBody] CompleteStockAuditSlipRequest? request, CancellationToken cancellationToken = default)
    {
        var slip = await _context.StockAuditSlips.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (slip == null)
        {
            return NotFound(ApiResponse<StockAuditSlip>.Fail("Không tìm thấy phiếu kiểm kho."));
        }

        slip.Status = "completed";
        slip.StatusLabel = "Đã hoàn tất 100%";
        if (request?.Note != null) slip.Note = request.Note;
        if (request?.ItemsJson != null) slip.ItemsJson = request.ItemsJson;
        slip.UpdatedAt = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse<StockAuditSlip>.Ok(slip, "Đã hoàn tất phiên kiểm kho và cân bằng số liệu thành công."));
    }

    /// <summary>
    /// Xóa phiên kiểm kho (Soft delete)
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteStockAudit(Guid id, CancellationToken cancellationToken = default)
    {
        var slip = await _context.StockAuditSlips.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (slip == null)
        {
            return NotFound(ApiResponse<bool>.Fail("Không tìm thấy phiếu kiểm kho cần xóa."));
        }

        slip.IsDeleted = true;
        slip.UpdatedAt = DateTimeOffset.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse<bool>.Ok(true, $"Đã xóa phiếu kiểm kho {slip.Code} thành công."));
    }

    /// <summary>
    /// Xóa hàng loạt phiên kiểm kho
    /// </summary>
    [HttpPost("bulk-delete")]
    public async Task<IActionResult> BulkDeleteStockAudits([FromBody] BulkDeleteStockAuditSlipsRequest request, CancellationToken cancellationToken = default)
    {
        if (request == null || request.Ids == null || request.Ids.Count == 0)
        {
            return BadRequest(ApiResponse<int>.Fail("Vui lòng chọn ít nhất một phiếu kiểm kho để xóa."));
        }

        var slips = await _context.StockAuditSlips
            .Where(x => request.Ids.Contains(x.Id))
            .ToListAsync(cancellationToken);

        foreach (var s in slips)
        {
            s.IsDeleted = true;
            s.UpdatedAt = DateTimeOffset.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse<int>.Ok(slips.Count, $"Đã xóa thành công {slips.Count} phiếu kiểm kho."));
    }
}
