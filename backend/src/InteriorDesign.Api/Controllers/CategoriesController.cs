using InteriorDesign.Domain.Entities;
using InteriorDesign.Domain.Enums;
using InteriorDesign.Infrastructure.Data;
using InteriorDesign.Integration.Common;
using InteriorDesign.Integration.Requests;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace InteriorDesign.Api.Controllers;

[Route("api/categories")]
public sealed class CategoriesController : ApiControllerBase
{
    private readonly InteriorDbContext _context;
    private readonly IMemoryCache _cache;

    public CategoriesController(InteriorDbContext context, IMemoryCache cache)
    {
        _context = context;
        _cache = cache;
    }

    /// <summary>
    /// Lấy danh sách danh mục nhóm hàng (hỗ trợ tìm kiếm, lọc theo không gian, lọc trạng thái)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetCategories(
        [FromQuery] string? search = null,
        [FromQuery] string? space = null,
        [FromQuery] string? status = null,
        [FromQuery] bool includeDeleted = false,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var query = includeDeleted
                ? _context.Categories.IgnoreQueryFilters().AsNoTracking().AsQueryable()
                : _context.Categories.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var q = search.Trim();
                query = query.Where(c =>
                    c.Code.Contains(q) ||
                    c.Name.Contains(q) ||
                    c.Slug.Contains(q) ||
                    c.Description.Contains(q) ||
                    c.FeaturedProduct.Contains(q)
                );
            }

            if (!string.IsNullOrWhiteSpace(space) && space != "all")
            {
                var s = space.Trim();
                query = query.Where(c => c.Space == s || c.Space.Contains(s));
            }

            if (!string.IsNullOrWhiteSpace(status) && status != "all")
            {
                var st = status.Trim();
                query = query.Where(c => c.Status == st);
            }

            var list = await query
                .OrderBy(c => c.DisplayOrder)
                .ThenByDescending(c => c.CreatedAt)
                .ToListAsync(cancellationToken);

            // Populate fresh product counts if available, otherwise fallback to existing cat.ProductCount from DB
            try
            {
                var productCounts = await _context.Products
                    .AsNoTracking()
                    .Where(p => p.Status == ProductStatus.Active)
                    .GroupBy(p => p.CategoryId)
                    .Select(g => new { CategoryId = g.Key, Count = g.Count() })
                    .ToDictionaryAsync(g => g.CategoryId, g => g.Count, cancellationToken);

                foreach (var cat in list)
                {
                    cat.ProductCount = productCounts.GetValueOrDefault(cat.Id, cat.ProductCount);
                }
            }
            catch (Exception ex) when (ex is OperationCanceledException ||
                cancellationToken.IsCancellationRequested ||
                HttpContext.RequestAborted.IsCancellationRequested ||
                (ex is SqlException sqlEx && (sqlEx.Number == 0 || sqlEx.Message.Contains("Operation cancelled by user", StringComparison.OrdinalIgnoreCase))))
            {
                return Ok(ApiResponse<List<Category>>.Ok(list));
            }
            catch
            {
                // Fallback to cat.ProductCount from database column
            }

            return Ok(ApiResponse<List<Category>>.Ok(list));
        }
        catch (Exception ex) when (ex is OperationCanceledException ||
            cancellationToken.IsCancellationRequested ||
            HttpContext.RequestAborted.IsCancellationRequested ||
            (ex is SqlException sqlEx && (sqlEx.Number == 0 || sqlEx.Message.Contains("Operation cancelled by user", StringComparison.OrdinalIgnoreCase))))
        {
            return StatusCode(499, ApiResponse<List<Category>>.Fail("Yêu cầu đã bị hủy bởi phía client."));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<List<Category>>.Fail($"Lỗi khi lấy danh mục: {ex.Message}"));
        }
    }

    /// <summary>
    /// Lấy chi tiết danh mục theo đường dẫn Slug
    /// </summary>
    [HttpGet("slug/{slug}")]
    public async Task<IActionResult> GetCategoryBySlug(string slug, CancellationToken cancellationToken)
    {
        try
        {
            var category = await _context.Categories
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Slug == slug.Trim().ToLower(), cancellationToken);

            if (category is null)
                return NotFound(ApiResponse<Category>.Fail("Không tìm thấy danh mục nhóm hàng."));

            category.ProductCount = await _context.Products.CountAsync(p => p.CategoryId == category.Id, cancellationToken);
            return Ok(ApiResponse<Category>.Ok(category));
        }
        catch (Exception ex) when (ex is OperationCanceledException ||
            cancellationToken.IsCancellationRequested ||
            HttpContext.RequestAborted.IsCancellationRequested ||
            (ex is SqlException sqlEx && (sqlEx.Number == 0 || sqlEx.Message.Contains("Operation cancelled by user", StringComparison.OrdinalIgnoreCase))))
        {
            return StatusCode(499, ApiResponse<Category>.Fail("Yêu cầu đã bị hủy bởi phía client."));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<Category>.Fail($"Lỗi khi lấy chi tiết danh mục: {ex.Message}"));
        }
    }

    /// <summary>
    /// Thống kê danh mục nhóm hàng
    /// </summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetCategoryStats(CancellationToken cancellationToken)
    {
        try
        {
            var total = await _context.Categories.CountAsync(cancellationToken);
            var active = await _context.Categories.CountAsync(c => c.Status == "active", cancellationToken);
            var hidden = await _context.Categories.CountAsync(c => c.Status == "hidden", cancellationToken);
            var products = await _context.Products.CountAsync(cancellationToken);

            var stats = new CategoryStatsResponse(
                TotalCategories: total,
                ActiveCategories: active,
                HiddenCategories: hidden,
                TotalProductsAssigned: products
            );

            return Ok(ApiResponse<CategoryStatsResponse>.Ok(stats));
        }
        catch (Exception ex) when (ex is OperationCanceledException ||
            cancellationToken.IsCancellationRequested ||
            HttpContext.RequestAborted.IsCancellationRequested ||
            (ex is SqlException sqlEx && (sqlEx.Number == 0 || sqlEx.Message.Contains("Operation cancelled by user", StringComparison.OrdinalIgnoreCase))))
        {
            return StatusCode(499, ApiResponse<CategoryStatsResponse>.Fail("Yêu cầu đã bị hủy bởi phía client."));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<CategoryStatsResponse>.Fail($"Lỗi khi lấy thống kê danh mục: {ex.Message}"));
        }
    }

    /// <summary>
    /// Lấy chi tiết một danh mục nhóm hàng theo Id
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetCategoryById(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var category = await _context.Categories
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

            if (category is null)
                return NotFound(ApiResponse<Category>.Fail("Không tìm thấy danh mục nhóm hàng."));

            category.ProductCount = await _context.Products.CountAsync(p => p.CategoryId == category.Id, cancellationToken);
            return Ok(ApiResponse<Category>.Ok(category));
        }
        catch (Exception ex) when (ex is OperationCanceledException ||
            cancellationToken.IsCancellationRequested ||
            HttpContext.RequestAborted.IsCancellationRequested ||
            (ex is SqlException sqlEx && (sqlEx.Number == 0 || sqlEx.Message.Contains("Operation cancelled by user", StringComparison.OrdinalIgnoreCase))))
        {
            return StatusCode(499, ApiResponse<Category>.Fail("Yêu cầu đã bị hủy bởi phía client."));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<Category>.Fail($"Lỗi khi lấy danh mục: {ex.Message}"));
        }
    }

    /// <summary>
    /// Tạo mới danh mục nhóm hàng
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(ApiResponse<Category>.Fail("Tên nhóm hàng không được để trống."));

        var existingCodes = await _context.Categories
            .Select(c => c.Code.ToUpper())
            .ToListAsync(cancellationToken);

        var code = request.Code?.Trim().ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(code) || existingCodes.Contains(code))
        {
            var nextNum = existingCodes.Count + 1;
            var autoCode = $"NH{nextNum:D2}";
            while (existingCodes.Contains(autoCode))
            {
                nextNum++;
                autoCode = $"NH{nextNum:D2}";
            }

            if (!string.IsNullOrWhiteSpace(code) && existingCodes.Contains(code))
            {
                return BadRequest(ApiResponse<Category>.Fail($"Mã nhóm hàng '{code}' đã tồn tại trong hệ thống. Vui lòng sử dụng mã gợi ý: '{autoCode}' hoặc mã khác."));
            }
            code = autoCode;
        }

        var slug = !string.IsNullOrWhiteSpace(request.Slug)
            ? request.Slug.Trim().ToLower()
            : request.Name.Trim().ToLower().Replace(" ", "-").Replace("&", "va");

        var category = new Category
        {
            Id = Guid.NewGuid(),
            Code = code,
            Name = request.Name.Trim(),
            Slug = slug,
            Description = request.Description?.Trim() ?? string.Empty,
            ImageUrl = request.ImageUrl?.Trim() ?? string.Empty,
            Icon = request.Icon?.Trim() ?? string.Empty,
            Space = request.Space?.Trim() ?? string.Empty,
            SpaceId = request.SpaceId,
            DisplayOrder = request.DisplayOrder >= 0 ? request.DisplayOrder : 1,
            ProductCount = 0,
            FeaturedProduct = request.FeaturedProduct?.Trim() ?? string.Empty,
            Badge = request.Badge?.Trim() ?? string.Empty,
            ShowOnHome = request.ShowOnHome,
            ShowOnMenu = request.ShowOnMenu,
            Status = string.IsNullOrWhiteSpace(request.Status) ? "active" : request.Status.ToLowerInvariant(),
            IsActive = request.Status?.ToLowerInvariant() != "hidden",
            CreatedAt = DateTime.UtcNow
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync(cancellationToken);
        InvalidateCategoryCache();

        return Ok(ApiResponse<Category>.Ok(category, "Tạo danh mục nhóm hàng thành công."));
    }

    private void InvalidateCategoryCache()
    {
        _cache.Remove("categories_all");
        _cache.Remove("home_data");
    }

    /// <summary>
    /// Nhập hàng loạt danh mục nhóm hàng từ Excel (Upsert)
    /// </summary>
    [HttpPost("bulk")]
    public async Task<IActionResult> BulkImportCategories(
        [FromBody] List<CreateCategoryRequest> requests,
        CancellationToken cancellationToken)
    {
        if (requests == null || requests.Count == 0)
            return BadRequest(ApiResponse<int>.Fail("Danh sách danh mục trống."));

        // Gom nhóm duy nhất theo Tên danh mục và kết hợp tất cả các không gian tương ứng
        var uniqueRequests = requests
            .Where(r => !string.IsNullOrWhiteSpace(r.Name))
            .GroupBy(r => r.Name.Trim(), StringComparer.OrdinalIgnoreCase)
            .Select(g =>
            {
                var first = g.First();
                var combinedSpaces = g
                    .SelectMany(x => (x.Space ?? "").Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();

                var code = g.Select(x => x.Code).FirstOrDefault(c => !string.IsNullOrWhiteSpace(c) && (c.StartsWith("NH", StringComparison.OrdinalIgnoreCase) || c.StartsWith("DM", StringComparison.OrdinalIgnoreCase)));

                return new CreateCategoryRequest
                {
                    Name = g.Key,
                    Code = code,
                    Slug = first.Slug,
                    Description = first.Description,
                    ImageUrl = first.ImageUrl,
                    Icon = first.Icon,
                    Space = combinedSpaces.Count > 0 ? string.Join(", ", combinedSpaces) : (first.Space ?? "Phòng Khách"),
                    SpaceId = first.SpaceId,
                    DisplayOrder = first.DisplayOrder,
                    FeaturedProduct = first.FeaturedProduct,
                    Badge = first.Badge,
                    ShowOnHome = first.ShowOnHome,
                    ShowOnMenu = first.ShowOnMenu,
                    Status = first.Status
                };
            })
            .ToList();

        // Bước 1: Dọn dẹp và chuẩn hóa dữ liệu hiện tại trước để đảm bảo không còn danh mục rác / trùng lặp
        await DeduplicateCategoriesInternalAsync(cancellationToken);

        var existingCategories = await _context.Categories.IgnoreQueryFilters().ToListAsync(cancellationToken);
        var categoryMapByName = new Dictionary<string, Category>(StringComparer.OrdinalIgnoreCase);
        var usedCodes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var c in existingCategories)
        {
            if (!string.IsNullOrWhiteSpace(c.Name))
            {
                categoryMapByName[c.Name.Trim()] = c;
            }
            if (!string.IsNullOrWhiteSpace(c.Code))
            {
                usedCodes.Add(c.Code.Trim());
            }
        }

        string GenerateNextCode()
        {
            int i = 1;
            while (usedCodes.Contains($"NH{i:D2}"))
            {
                i++;
            }
            var nextCode = $"NH{i:D2}";
            usedCodes.Add(nextCode);
            return nextCode;
        }

        var toAdd = new List<Category>();
        int insertedCount = 0;
        int updatedCount = 0;

        var activeSpaces = await _context.Spaces
            .Where(s => !s.IsDeleted && s.Status == "active")
            .ToListAsync(cancellationToken);

        foreach (var req in uniqueRequests)
        {
            var nameTrimmed = req.Name.Trim();

            Category? matched = null;
            if (categoryMapByName.TryGetValue(nameTrimmed, out var cByName))
            {
                matched = cByName;
            }

            var slug = !string.IsNullOrWhiteSpace(req.Slug)
                ? req.Slug.Trim().ToLower()
                : nameTrimmed.ToLower().Replace(" ", "-").Replace("&", "va");

            var spaceName = !string.IsNullOrWhiteSpace(req.Space) ? req.Space.Trim() : "Phòng Khách";
            var lowerCatName = nameTrimmed.ToLowerInvariant();
            if (lowerCatName.Contains("bàn trà") || lowerCatName.Contains("bàn nước") || lowerCatName.Contains("sofa") || lowerCatName.Contains("kệ tivi") || lowerCatName.Contains("tủ giày"))
            {
                spaceName = "Phòng Khách";
            }
            else if (lowerCatName.Contains("bàn ăn") || lowerCatName.Contains("ghế ăn") || lowerCatName.Contains("chạn ly") || lowerCatName.Contains("tủ bếp"))
            {
                spaceName = "Phòng Ăn";
            }
            else if (lowerCatName.Contains("giường") || lowerCatName.Contains("táp") || lowerCatName.Contains("tủ áo") || lowerCatName.Contains("quần áo") || lowerCatName.Contains("trang điểm"))
            {
                spaceName = "Phòng Ngủ";
            }
            else if (lowerCatName.Contains("làm việc") || lowerCatName.Contains("giá sách") || lowerCatName.Contains("kệ sách"))
            {
                spaceName = "Phòng Làm Việc";
            }

            Guid? targetSpaceId = req.SpaceId;
            if (!targetSpaceId.HasValue || targetSpaceId == Guid.Empty)
            {
                var normSpaceName = spaceName.ToLowerInvariant();
                var sMatch = activeSpaces.FirstOrDefault(s =>
                    s.Name.ToLowerInvariant() == normSpaceName ||
                    s.Code.ToLowerInvariant() == normSpaceName ||
                    (normSpaceName.Contains("khách") && s.Code == "KG01") ||
                    (normSpaceName.Contains("ăn") && s.Code == "KG02") ||
                    (normSpaceName.Contains("việc") && s.Code == "KG03") ||
                    (normSpaceName.Contains("ngủ") && s.Code == "KG04") ||
                    (normSpaceName.Contains("khác") && s.Code == "KG05"));

                if (sMatch != null)
                {
                    targetSpaceId = sMatch.Id;
                    spaceName = sMatch.Name;
                }
            }
            else
            {
                var sById = activeSpaces.FirstOrDefault(s => s.Id == targetSpaceId.Value);
                if (sById != null) spaceName = sById.Name;
            }

            if (matched != null)
            {
                // UPDATE
                matched.Name = nameTrimmed;
                matched.Slug = slug;
                if (!string.IsNullOrWhiteSpace(req.Description)) matched.Description = req.Description.Trim();
                if (!string.IsNullOrWhiteSpace(req.Icon)) matched.Icon = req.Icon.Trim();
                matched.Space = spaceName;
                if (targetSpaceId.HasValue && targetSpaceId != Guid.Empty)
                {
                    matched.SpaceId = targetSpaceId.Value;
                }
                if (req.DisplayOrder > 0) matched.DisplayOrder = req.DisplayOrder;
                if (!string.IsNullOrWhiteSpace(req.Badge)) matched.Badge = req.Badge.Trim();
                if (!string.IsNullOrWhiteSpace(req.FeaturedProduct)) matched.FeaturedProduct = req.FeaturedProduct.Trim();
                if (!string.IsNullOrWhiteSpace(req.Status)) matched.Status = req.Status.ToLowerInvariant();
                matched.IsActive = matched.Status != "hidden";
                matched.IsDeleted = false;
                matched.DeletedAt = null;

                if (string.IsNullOrWhiteSpace(matched.Code) || (!matched.Code.StartsWith("NH", StringComparison.OrdinalIgnoreCase) && !matched.Code.StartsWith("DM", StringComparison.OrdinalIgnoreCase)))
                {
                    matched.Code = GenerateNextCode();
                }

                updatedCount++;
            }
            else
            {
                // INSERT
                var code = GenerateNextCode();

                var newCat = new Category
                {
                    Id = Guid.NewGuid(),
                    Code = code,
                    Name = nameTrimmed,
                    Slug = slug,
                    Description = req.Description?.Trim() ?? string.Empty,
                    ImageUrl = req.ImageUrl?.Trim() ?? string.Empty,
                    Icon = req.Icon?.Trim() ?? "folder",
                    Space = spaceName,
                    SpaceId = targetSpaceId,
                    DisplayOrder = req.DisplayOrder > 0 ? req.DisplayOrder : 1,
                    ProductCount = 0,
                    FeaturedProduct = req.FeaturedProduct?.Trim() ?? string.Empty,
                    Badge = req.Badge?.Trim() ?? string.Empty,
                    ShowOnHome = req.ShowOnHome,
                    ShowOnMenu = req.ShowOnMenu,
                    Status = string.IsNullOrWhiteSpace(req.Status) ? "active" : req.Status.ToLowerInvariant(),
                    IsActive = req.Status?.ToLowerInvariant() != "hidden",
                    CreatedAt = DateTime.UtcNow
                };

                categoryMapByName[nameTrimmed] = newCat;
                toAdd.Add(newCat);
                insertedCount++;
            }
        }

        if (toAdd.Count > 0)
        {
            await _context.Categories.AddRangeAsync(toAdd, cancellationToken);
        }

        await _context.SaveChangesAsync(cancellationToken);
        InvalidateCategoryCache();

        int totalHandled = insertedCount + updatedCount;
        return Ok(ApiResponse<int>.Ok(
            totalHandled,
            $"Đã xử lý {totalHandled} danh mục chuẩn (Thêm mới: {insertedCount}, Cập nhật: {updatedCount})!"
        ));
    }

    /// <summary>
    /// Gộp và chuẩn hóa mã danh mục tự động (NH01, NH02...), xóa các danh mục trùng tên
    /// </summary>
    [HttpPost("cleanup")]
    public async Task<IActionResult> CleanupCategories(CancellationToken cancellationToken)
    {
        var cleanedCount = await DeduplicateCategoriesInternalAsync(cancellationToken);
        InvalidateCategoryCache();
        return Ok(ApiResponse<int>.Ok(cleanedCount, "Đã chuẩn hóa và gộp danh mục thành công!"));
    }

    private async Task<int> DeduplicateCategoriesInternalAsync(CancellationToken cancellationToken)
    {
        var allCats = await _context.Categories.IgnoreQueryFilters().ToListAsync(cancellationToken);
        if (allCats.Count == 0) return 0;

        // Bước 1: Gán mã tạm thời ngẫu nhiên cho TẤT CẢ các danh mục để tránh bất kỳ xung đột Unique Index nào
        foreach (var cat in allCats)
        {
            cat.Code = $"TMP_{Guid.NewGuid():N}";
        }
        await _context.SaveChangesAsync(cancellationToken);

        // Bước 2: Xử lý gộp các danh mục trùng tên
        var groups = allCats.GroupBy(c => c.Name.Trim(), StringComparer.OrdinalIgnoreCase).ToList();
        var distinctPrimaries = new List<Category>();
        int merged = 0;

        foreach (var grp in groups)
        {
            var primary = grp.OrderBy(c => c.IsDeleted ? 1 : 0).ThenBy(c => c.CreatedAt).First();
            primary.IsDeleted = false;
            primary.DeletedAt = null;
            distinctPrimaries.Add(primary);

            var duplicates = grp.Where(c => c.Id != primary.Id).ToList();
            if (duplicates.Count > 0)
            {
                var duplicateIds = duplicates.Select(d => d.Id).ToList();
                var productsToUpdate = await _context.Products.Where(p => duplicateIds.Contains(p.CategoryId)).ToListAsync(cancellationToken);
                foreach (var p in productsToUpdate)
                {
                    p.CategoryId = primary.Id;
                }

                _context.Categories.RemoveRange(duplicates);
                merged += duplicates.Count;
            }
        }

        if (merged > 0)
        {
            await _context.SaveChangesAsync(cancellationToken);
        }

        // Bước 3: Đánh số thứ tự chuẩn NH01, NH02... cho các danh mục duy nhất còn lại
        int index = 1;
        foreach (var cat in distinctPrimaries.OrderBy(c => c.DisplayOrder).ThenBy(c => c.CreatedAt))
        {
            cat.Code = $"NH{index:D2}";
            index++;
        }
        await _context.SaveChangesAsync(cancellationToken);

        return merged;
    }

    /// <summary>
    /// Cập nhật thông tin danh mục nhóm hàng
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateCategory(Guid id, [FromBody] UpdateCategoryRequest request, CancellationToken cancellationToken)
    {
        var category = await _context.Categories.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        if (category is null)
            return NotFound(ApiResponse<Category>.Fail("Không tìm thấy danh mục nhóm hàng cần cập nhật."));

        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(ApiResponse<Category>.Fail("Tên nhóm hàng không được để trống."));

        var code = request.Code?.Trim().ToUpperInvariant();
        if (!string.IsNullOrWhiteSpace(code) && code != category.Code)
        {
            var exists = await _context.Categories.AnyAsync(c => c.Code == code && c.Id != id, cancellationToken);
            if (exists)
                return BadRequest(ApiResponse<Category>.Fail($"Mã nhóm hàng '{code}' đã thuộc về danh mục khác."));
            category.Code = code;
        }

        category.Name = request.Name.Trim();
        if (!string.IsNullOrWhiteSpace(request.Slug))
            category.Slug = request.Slug.Trim().ToLower();

        category.Description = request.Description?.Trim() ?? category.Description;
        category.ImageUrl = request.ImageUrl?.Trim() ?? category.ImageUrl;
        category.Icon = request.Icon?.Trim() ?? category.Icon;
        category.Space = request.Space?.Trim() ?? category.Space;
        category.SpaceId = request.SpaceId ?? category.SpaceId;
        category.DisplayOrder = request.DisplayOrder;
        category.FeaturedProduct = request.FeaturedProduct?.Trim() ?? category.FeaturedProduct;
        category.Badge = request.Badge?.Trim() ?? category.Badge;
        category.ShowOnHome = request.ShowOnHome;
        category.ShowOnMenu = request.ShowOnMenu;
        category.Status = string.IsNullOrWhiteSpace(request.Status) ? category.Status : request.Status.ToLowerInvariant();
        category.IsActive = category.Status != "hidden";

        await _context.SaveChangesAsync(cancellationToken);
        InvalidateCategoryCache();

        return Ok(ApiResponse<Category>.Ok(category, "Cập nhật danh mục nhóm hàng thành công."));
    }

    /// <summary>
    /// Cập nhật trạng thái danh mục nhóm hàng (active/hidden)
    /// </summary>
    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateCategoryStatus(Guid id, [FromBody] UpdateCategoryStatusRequest request, CancellationToken cancellationToken)
    {
        var category = await _context.Categories.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        if (category is null)
            return NotFound(ApiResponse<Category>.Fail("Không tìm thấy danh mục nhóm hàng."));

        category.Status = string.IsNullOrWhiteSpace(request.Status) ? "active" : request.Status.ToLowerInvariant();
        category.IsActive = category.Status == "active";
        await _context.SaveChangesAsync(cancellationToken);
        InvalidateCategoryCache();

        return Ok(ApiResponse<Category>.Ok(category, $"Đã chuyển trạng thái danh mục thành '{category.Status}'."));
    }

    /// <summary>
    /// Xóa mềm danh mục nhóm hàng (Không được xóa nếu đang có sản phẩm)
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteCategory(Guid id, CancellationToken cancellationToken)
    {
        var category = await _context.Categories.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        if (category is null)
            return NotFound(ApiResponse<bool>.Fail("Không tìm thấy danh mục nhóm hàng để xóa."));

        var productCount = await _context.Products.CountAsync(p => p.CategoryId == id, cancellationToken);
        if (productCount > 0)
        {
            return BadRequest(ApiResponse<bool>.Fail($"Không thể xóa danh mục '{category.Name}' vì đang có {productCount} sản phẩm thuộc danh mục này. Vui lòng chuyển danh mục hoặc xóa các sản phẩm liên quan trước!"));
        }

        category.IsDeleted = true;
        category.DeletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
        InvalidateCategoryCache();

        return Ok(ApiResponse<bool>.Ok(true, $"Đã xóa danh mục nhóm hàng '{category.Name}'."));
    }

    /// <summary>
    /// Khôi phục danh mục nhóm hàng đã xóa
    /// </summary>
    [HttpPatch("{id:guid}/restore")]
    public async Task<IActionResult> RestoreCategory(Guid id, CancellationToken cancellationToken)
    {
        var category = await _context.Categories
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(c => c.Id == id && c.IsDeleted, cancellationToken);

        if (category is null)
            return NotFound(ApiResponse<Category>.Fail("Không tìm thấy danh mục nhóm hàng đã xóa."));

        category.IsDeleted = false;
        category.DeletedAt = null;
        await _context.SaveChangesAsync(cancellationToken);
        InvalidateCategoryCache();

        return Ok(ApiResponse<Category>.Ok(category, $"Đã khôi phục danh mục nhóm hàng '{category.Name}'."));
    }
}
