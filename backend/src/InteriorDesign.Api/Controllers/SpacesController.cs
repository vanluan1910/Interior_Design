using InteriorDesign.Domain.Entities;
using InteriorDesign.Domain.Enums;
using InteriorDesign.Infrastructure.Data;
using InteriorDesign.Integration.Common;
using InteriorDesign.Integration.Requests;
using InteriorDesign.Integration.Responses;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InteriorDesign.Api.Controllers;

[Route("api/spaces")]
public sealed class SpacesController : ApiControllerBase
{
    private readonly InteriorDbContext _context;

    public SpacesController(InteriorDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Lấy danh sách không gian nội thất (hỗ trợ tìm kiếm, lọc trạng thái)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetSpaces(
        [FromQuery] string? search = null,
        [FromQuery] string? status = null,
        [FromQuery] bool includeDeleted = false,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var query = includeDeleted
                ? _context.Spaces.IgnoreQueryFilters().AsNoTracking().AsQueryable()
                : _context.Spaces.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var q = search.Trim().ToLower();
                query = query.Where(s =>
                    s.Code.ToLower().Contains(q) ||
                    s.Name.ToLower().Contains(q) ||
                    s.Slug.ToLower().Contains(q) ||
                    s.Tagline.ToLower().Contains(q) ||
                    s.Description.ToLower().Contains(q)
                );
            }

            if (!string.IsNullOrWhiteSpace(status) && status != "all")
            {
                var st = status.Trim().ToLower();
                query = query.Where(s => s.Status.ToLower() == st);
            }

            var list = await query
                .OrderBy(s => s.DisplayOrder)
                .ThenByDescending(s => s.CreatedAt)
                .ToListAsync(cancellationToken);

            return Ok(ApiResponse<List<InteriorSpace>>.Ok(list));
        }
        catch (OperationCanceledException)
        {
            return StatusCode(499, ApiResponse<List<InteriorSpace>>.Fail("Yêu cầu đã bị hủy."));
        }
    }

    /// <summary>
    /// Lấy chi tiết & danh mục, sản phẩm của Không Gian Phòng Khách (Living Room Space API)
    /// </summary>
    [HttpGet("living-room")]
    [HttpGet("living")]
    [HttpGet("/api/living-room")]
    [HttpGet("/api/phong-khach")]
    public async Task<IActionResult> GetLivingRoomSpace(
        [FromQuery] string? search = null,
        [FromQuery] Guid? categoryId = null,
        [FromQuery] string? material = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        return await GetSpaceDetailInternal("living", search, categoryId, material, sortBy, page, pageSize, cancellationToken);
    }

    /// <summary>
    /// Lấy chi tiết & danh mục, sản phẩm của bất kỳ không gian nào theo Slug hoặc Mã (VD: living, bedroom, dining, office)
    /// </summary>
    [HttpGet("slug/{slug}")]
    [HttpGet("{slug}/detail")]
    public async Task<IActionResult> GetSpaceBySlugDetail(
        string slug,
        [FromQuery] string? search = null,
        [FromQuery] Guid? categoryId = null,
        [FromQuery] string? material = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        return await GetSpaceDetailInternal(slug, search, categoryId, material, sortBy, page, pageSize, cancellationToken);
    }

    private async Task<IActionResult> GetSpaceDetailInternal(
        string spaceIdentifier,
        string? search,
        Guid? categoryId,
        string? material,
        string? sortBy,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 100) pageSize = 20;

        var sid = (spaceIdentifier ?? "").Trim().ToLowerInvariant();

        // 1. Tìm thông tin không gian trong DB
        var spaceEntity = await _context.Spaces
            .AsNoTracking()
            .FirstOrDefaultAsync(s =>
                s.Slug.ToLower() == sid ||
                s.Code.ToLower() == sid ||
                ((sid.Contains("living") || sid.Contains("khách")) && (s.Slug == "living" || s.Code == "KG01" || s.Name.Contains("khách"))) ||
                ((sid.Contains("bedroom") || sid.Contains("ngủ")) && (s.Slug == "bedroom" || s.Code == "KG03" || s.Name.Contains("ngủ"))) ||
                ((sid.Contains("dining") || sid.Contains("ăn")) && (s.Slug == "dining" || s.Code == "KG02" || s.Name.Contains("ăn"))) ||
                ((sid.Contains("office") || sid.Contains("việc")) && (s.Slug == "office" || s.Code == "KG04" || s.Name.Contains("việc"))),
                cancellationToken);

        var spaceKey = spaceEntity?.Slug ?? (sid.Contains("khách") || sid.Contains("living") ? "living" : sid.Contains("ngủ") || sid.Contains("bedroom") ? "bedroom" : sid.Contains("ăn") || sid.Contains("dining") ? "dining" : "office");
        var spaceName = spaceEntity?.Name ?? (spaceKey == "living" ? "Phòng Khách Tĩnh Tại" : spaceKey == "bedroom" ? "Phòng Ngủ Vỗ Về" : spaceKey == "dining" ? "Phòng Ăn Sum Vầy" : "Phòng Làm Việc Sáng Tạo");

        var spaceDto = spaceEntity != null ? new HomeSpaceDto(
            Key: spaceEntity.Slug,
            Name: spaceEntity.Name,
            Tagline: spaceEntity.Tagline,
            Description: spaceEntity.Description,
            ImageUrl: spaceEntity.Image,
            CountText: $"{spaceEntity.CategoryCount} danh mục",
            CodeLabel: $"{spaceEntity.Code} / {spaceEntity.Name.ToUpper()}",
            ColSpan: spaceEntity.DisplayOrder,
            LinkUrl: $"/products?space={spaceEntity.Slug}",
            Id: spaceEntity.Id
        ) : new HomeSpaceDto(
            Key: spaceKey,
            Name: spaceName,
            Tagline: "Không gian kết nối & thư giãn",
            Description: "Sofa mộc bọc nỉ lanh tự nhiên, bàn trà điêu khắc hữu cơ, hệ kệ TV tinh gọn tôn vinh sự mộc mạc.",
            ImageUrl: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&auto=format&fit=crop&q=80",
            CountText: "226 sản phẩm thiết kế",
            CodeLabel: "01 / PHÒNG KHÁCH",
            ColSpan: 7,
            LinkUrl: $"/products?space={spaceKey}"
        );

        // 2. Query sản phẩm thuộc không gian
        var baseQuery = _context.Products
            .Include(p => p.Category)
            .AsNoTracking()
            .Where(p => p.Status == ProductStatus.Active);

        if (sid.Contains("living") || sid.Contains("khách") || sid == "kg01")
        {
            baseQuery = baseQuery.Where(p => p.Space.Contains("khách") || p.Space.Contains("Living") || p.Space == "KG01");
        }
        else if (sid.Contains("bedroom") || sid.Contains("ngủ") || sid == "kg03")
        {
            baseQuery = baseQuery.Where(p => p.Space.Contains("ngủ") || p.Space.Contains("Bed") || p.Space == "KG03");
        }
        else if (sid.Contains("dining") || sid.Contains("ăn") || sid == "kg02")
        {
            baseQuery = baseQuery.Where(p => p.Space.Contains("ăn") || p.Space.Contains("Dining") || p.Space == "KG02");
        }
        else if (sid.Contains("office") || sid.Contains("việc") || sid == "kg04")
        {
            baseQuery = baseQuery.Where(p => p.Space.Contains("việc") || p.Space.Contains("Office") || p.Space == "KG04");
        }
        else
        {
            baseQuery = baseQuery.Where(p => p.Space == spaceIdentifier || p.Space.Contains(spaceIdentifier));
        }

        // Lấy danh mục con và số lượng sản phẩm của không gian
        var allSpaceProducts = await baseQuery.Select(p => new { p.CategoryId, p.WoodType, p.Material }).ToListAsync(cancellationToken);
        var categoryGroupCounts = allSpaceProducts
            .Where(p => p.CategoryId != Guid.Empty)
            .GroupBy(p => p.CategoryId)
            .ToDictionary(g => g.Key, g => g.Count());

        var categoryIds = categoryGroupCounts.Keys.ToList();
        var categoryEntities = await _context.Categories
            .AsNoTracking()
            .Where(c => categoryIds.Contains(c.Id) && c.Status == "active")
            .ToListAsync(cancellationToken);

        var categoriesDto = categoryEntities.Select(c => new SpaceDetailCategoryDto(
            Id: c.Id,
            Code: c.Code,
            Name: c.Name,
            Slug: c.Slug,
            Image: c.ImageUrl,
            ProductCount: categoryGroupCounts.TryGetValue(c.Id, out var count) ? count : 0
        )).OrderByDescending(c => c.ProductCount).ToList();

        // Lấy danh sách chất liệu gỗ có sẵn
        var materials = allSpaceProducts
            .Select(p => !string.IsNullOrWhiteSpace(p.WoodType) ? p.WoodType : p.Material)
            .Where(m => !string.IsNullOrWhiteSpace(m))
            .Distinct()
            .ToList()!;

        // 3. Lọc theo search, categoryId, material
        var filterQuery = baseQuery;

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            filterQuery = filterQuery.Where(p => p.Name.ToLower().Contains(s) || p.Sku.ToLower().Contains(s) || p.Description.ToLower().Contains(s));
        }

        if (categoryId.HasValue && categoryId != Guid.Empty)
        {
            filterQuery = filterQuery.Where(p => p.CategoryId == categoryId.Value);
        }

        if (!string.IsNullOrWhiteSpace(material))
        {
            var mat = material.Trim().ToLower();
            filterQuery = filterQuery.Where(p => p.WoodType.ToLower().Contains(mat) || p.Material.ToLower().Contains(mat));
        }

        // 4. Sắp xếp
        filterQuery = (sortBy?.ToLower()) switch
        {
            "price-asc" => filterQuery.OrderBy(p => p.Price),
            "price-desc" => filterQuery.OrderByDescending(p => p.Price),
            "rating" => filterQuery.OrderByDescending(p => p.Rating),
            "featured" => filterQuery.OrderByDescending(p => p.IsFeatured).ThenByDescending(p => p.CreatedAt),
            _ => filterQuery.OrderByDescending(p => p.CreatedAt)
        };

        var totalItems = await filterQuery.CountAsync(cancellationToken);
        var totalPages = (int)Math.Ceiling((double)totalItems / pageSize);

        var pagedItems = await filterQuery
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var productsDto = pagedItems.Select(p => new HomeProductDto(
            Id: p.Id,
            Name: p.Name,
            Slug: p.Slug,
            Sku: p.Sku,
            Category: spaceKey,
            CategoryName: p.Category != null ? p.Category.Name : spaceName,
            Price: p.Price,
            OriginalPrice: null,
            Image: !string.IsNullOrWhiteSpace(p.MainImageUrl) ? p.MainImageUrl : "/images/placeholder.jpg",
            WoodType: !string.IsNullOrWhiteSpace(p.WoodType) ? p.WoodType : "Gỗ tự nhiên",
            Dimensions: !string.IsNullOrWhiteSpace(p.Dimensions) ? p.Dimensions : "Theo thiết kế",
            Tag: "",
            Rating: p.Rating > 0 ? p.Rating : 5.0m,
            ReviewCount: p.ReviewCount > 0 ? p.ReviewCount : 24,
            InStock: p.InStock > 0
        )).ToList();

        // 5. Featured products của không gian (top 8)
        var featuredItems = await baseQuery
            .OrderByDescending(p => p.IsFeatured)
            .ThenByDescending(p => p.CreatedAt)
            .Take(8)
            .ToListAsync(cancellationToken);

        var featuredDto = featuredItems.Select(p => new HomeProductDto(
            Id: p.Id,
            Name: p.Name,
            Slug: p.Slug,
            Sku: p.Sku,
            Category: spaceKey,
            CategoryName: p.Category != null ? p.Category.Name : spaceName,
            Price: p.Price,
            OriginalPrice: null,
            Image: !string.IsNullOrWhiteSpace(p.MainImageUrl) ? p.MainImageUrl : "/images/placeholder.jpg",
            WoodType: !string.IsNullOrWhiteSpace(p.WoodType) ? p.WoodType : "Gỗ tự nhiên",
            Dimensions: !string.IsNullOrWhiteSpace(p.Dimensions) ? p.Dimensions : "Theo thiết kế",
            Tag: "",
            Rating: p.Rating > 0 ? p.Rating : 5.0m,
            ReviewCount: p.ReviewCount > 0 ? p.ReviewCount : 24,
            InStock: p.InStock > 0
        )).ToList();

        var response = new SpaceDetailResponseDto(
            Space: spaceDto,
            Categories: categoriesDto,
            Materials: materials,
            FeaturedProducts: featuredDto,
            Products: productsDto,
            TotalItems: totalItems,
            Page: page,
            PageSize: pageSize,
            TotalPages: totalPages
        );

        return Ok(ApiResponse<SpaceDetailResponseDto>.Ok(response));
    }

    /// <summary>
    /// Thống kê không gian nội thất
    /// </summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetSpaceStats(CancellationToken cancellationToken)
    {
        var total = await _context.Spaces.CountAsync(cancellationToken);
        var active = await _context.Spaces.CountAsync(s => s.Status == "active", cancellationToken);
        var hidden = await _context.Spaces.CountAsync(s => s.Status == "hidden", cancellationToken);
        var categories = await _context.Spaces.SumAsync(s => s.CategoryCount, cancellationToken);

        var stats = new SpaceStatsResponse(
            TotalSpaces: total,
            ActiveSpaces: active,
            HiddenSpaces: hidden,
            TotalLinkedCategories: categories
        );

        return Ok(ApiResponse<SpaceStatsResponse>.Ok(stats));
    }

    /// <summary>
    /// Lấy chi tiết một không gian nội thất theo Id
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetSpaceById(Guid id, CancellationToken cancellationToken)
    {
        var space = await _context.Spaces.FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
        if (space is null)
            return NotFound(ApiResponse<InteriorSpace>.Fail("Không tìm thấy không gian nội thất."));

        return Ok(ApiResponse<InteriorSpace>.Ok(space));
    }

    /// <summary>
    /// Tạo mới không gian nội thất
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateSpace([FromBody] CreateSpaceRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(ApiResponse<InteriorSpace>.Fail("Tên không gian không được để trống."));

        var existingCodes = await _context.Spaces
            .Select(s => s.Code.ToUpper())
            .ToListAsync(cancellationToken);

        var code = request.Code?.Trim().ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(code) || existingCodes.Contains(code))
        {
            var nextNum = existingCodes.Count + 1;
            var autoCode = $"KG{nextNum:D2}";
            while (existingCodes.Contains(autoCode))
            {
                nextNum++;
                autoCode = $"KG{nextNum:D2}";
            }

            if (!string.IsNullOrWhiteSpace(code) && existingCodes.Contains(code))
            {
                return BadRequest(ApiResponse<InteriorSpace>.Fail($"Mã không gian '{code}' đã tồn tại trong hệ thống. Vui lòng sử dụng mã gợi ý: '{autoCode}' hoặc mã khác."));
            }
            code = autoCode;
        }

        var slug = !string.IsNullOrWhiteSpace(request.Slug)
            ? request.Slug.Trim().ToLower()
            : request.Name.Trim().ToLower().Replace(" ", "-").Replace("&", "va");

        var space = new InteriorSpace
        {
            Id = Guid.NewGuid(),
            Code = code,
            Name = request.Name.Trim(),
            Slug = slug,
            Tagline = request.Tagline?.Trim() ?? string.Empty,
            Description = request.Description?.Trim() ?? string.Empty,
            Image = request.Image?.Trim() ?? string.Empty,
            Icon = request.Icon?.Trim() ?? string.Empty,
            DisplayOrder = request.DisplayOrder >= 0 ? request.DisplayOrder : 1,
            Status = string.IsNullOrWhiteSpace(request.Status) ? "active" : request.Status.ToLowerInvariant(),
            ShowOnHome = request.ShowOnHome,
            ShowOnHeader = request.ShowOnHeader,
            CategoryCount = 0,
            CreatedAt = DateTime.UtcNow
        };

        _context.Spaces.Add(space);
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse<InteriorSpace>.Ok(space, "Tạo không gian nội thất thành công."));
    }

    /// <summary>
    /// Nhập dữ liệu danh sách không gian từ Excel (Hỗ trợ Thêm mới & Cập nhật - Upsert)
    /// </summary>
    [HttpPost("bulk")]
    public async Task<IActionResult> BulkImportSpaces(
        [FromBody] List<CreateSpaceRequest> requests,
        CancellationToken cancellationToken)
    {
        if (requests == null || requests.Count == 0)
            return BadRequest(ApiResponse<int>.Fail("Danh sách không gian trống."));

        var existingSpaces = await _context.Spaces.IgnoreQueryFilters().ToListAsync(cancellationToken);
        var spaceMapByCode = new Dictionary<string, InteriorSpace>(StringComparer.OrdinalIgnoreCase);
        var spaceMapByName = new Dictionary<string, InteriorSpace>(StringComparer.OrdinalIgnoreCase);

        // Ưu tiên bản ghi chưa xóa nếu trùng mã hoặc tên
        foreach (var s in existingSpaces.OrderBy(s => s.IsDeleted ? 1 : 0))
        {
            if (!string.IsNullOrWhiteSpace(s.Code))
            {
                var codeKey = s.Code.Trim();
                if (!spaceMapByCode.ContainsKey(codeKey) || !s.IsDeleted)
                {
                    spaceMapByCode[codeKey] = s;
                }
            }

            if (!string.IsNullOrWhiteSpace(s.Name))
            {
                var nameKey = s.Name.Trim();
                if (!spaceMapByName.ContainsKey(nameKey) || !s.IsDeleted)
                {
                    spaceMapByName[nameKey] = s;
                }
            }
        }

        var toAdd = new List<InteriorSpace>();
        int insertedCount = 0;
        int updatedCount = 0;
        int autoCodeIndex = existingSpaces.Count + 1;

        foreach (var req in requests)
        {
            if (string.IsNullOrWhiteSpace(req.Name)) continue;

            var nameTrimmed = req.Name.Trim();
            var code = req.Code?.Trim().ToUpperInvariant();

            InteriorSpace? matched = null;
            if (!string.IsNullOrWhiteSpace(code) && spaceMapByCode.TryGetValue(code, out var sByCode))
            {
                matched = sByCode;
            }
            else if (spaceMapByName.TryGetValue(nameTrimmed, out var sByName))
            {
                matched = sByName;
            }

            var slug = !string.IsNullOrWhiteSpace(req.Slug)
                ? req.Slug.Trim().ToLower()
                : nameTrimmed.ToLower().Replace(" ", "-").Replace("&", "va");

            if (matched != null)
            {
                // UPSERT - UPDATE
                matched.Name = nameTrimmed;
                matched.Slug = slug;
                if (!string.IsNullOrWhiteSpace(req.Tagline)) matched.Tagline = req.Tagline.Trim();
                if (!string.IsNullOrWhiteSpace(req.Description)) matched.Description = req.Description.Trim();
                if (!string.IsNullOrWhiteSpace(req.Image)) matched.Image = req.Image.Trim();
                if (!string.IsNullOrWhiteSpace(req.Icon)) matched.Icon = req.Icon.Trim();
                if (req.DisplayOrder > 0) matched.DisplayOrder = req.DisplayOrder;
                if (!string.IsNullOrWhiteSpace(req.Status)) matched.Status = req.Status.ToLowerInvariant();
                matched.ShowOnHome = req.ShowOnHome;
                matched.ShowOnHeader = req.ShowOnHeader;
                matched.IsDeleted = false;
                matched.DeletedAt = null;
                updatedCount++;
            }
            else
            {
                // UPSERT - INSERT
                if (string.IsNullOrWhiteSpace(code))
                {
                    var autoCode = $"KG{autoCodeIndex:D2}";
                    while (spaceMapByCode.ContainsKey(autoCode))
                    {
                        autoCodeIndex++;
                        autoCode = $"KG{autoCodeIndex:D2}";
                    }
                    code = autoCode;
                    autoCodeIndex++;
                }

                var newSpace = new InteriorSpace
                {
                    Id = Guid.NewGuid(),
                    Code = code,
                    Name = nameTrimmed,
                    Slug = slug,
                    Tagline = req.Tagline?.Trim() ?? string.Empty,
                    Description = req.Description?.Trim() ?? string.Empty,
                    Image = req.Image?.Trim() ?? string.Empty,
                    Icon = req.Icon?.Trim() ?? string.Empty,
                    DisplayOrder = req.DisplayOrder > 0 ? req.DisplayOrder : 1,
                    Status = string.IsNullOrWhiteSpace(req.Status) ? "active" : req.Status.ToLowerInvariant(),
                    ShowOnHome = req.ShowOnHome,
                    ShowOnHeader = req.ShowOnHeader,
                    CategoryCount = 0,
                    CreatedAt = DateTime.UtcNow
                };

                spaceMapByCode[code] = newSpace;
                spaceMapByName[nameTrimmed] = newSpace;
                toAdd.Add(newSpace);
                insertedCount++;
            }
        }

        if (toAdd.Count > 0)
        {
            await _context.Spaces.AddRangeAsync(toAdd, cancellationToken);
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse<int>.Ok(
            insertedCount + updatedCount,
            $"Đã nhập thành công {insertedCount + updatedCount} không gian (Thêm mới: {insertedCount}, Cập nhật: {updatedCount})."
        ));
    }

    /// <summary>
    /// Cập nhật thông tin không gian nội thất
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateSpace(Guid id, [FromBody] UpdateSpaceRequest request, CancellationToken cancellationToken)
    {
        var space = await _context.Spaces.FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
        if (space is null)
            return NotFound(ApiResponse<InteriorSpace>.Fail("Không tìm thấy không gian nội thất cần cập nhật."));

        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(ApiResponse<InteriorSpace>.Fail("Tên không gian không được để trống."));

        var code = request.Code?.Trim().ToUpperInvariant();
        if (!string.IsNullOrWhiteSpace(code) && code != space.Code)
        {
            var exists = await _context.Spaces.AnyAsync(s => s.Code == code && s.Id != id, cancellationToken);
            if (exists)
                return BadRequest(ApiResponse<InteriorSpace>.Fail($"Mã không gian '{code}' đã thuộc về không gian khác."));
            space.Code = code;
        }

        space.Name = request.Name.Trim();
        if (!string.IsNullOrWhiteSpace(request.Slug))
            space.Slug = request.Slug.Trim().ToLower();

        space.Tagline = request.Tagline?.Trim() ?? space.Tagline;
        space.Description = request.Description?.Trim() ?? space.Description;
        space.Image = request.Image?.Trim() ?? space.Image;
        space.Icon = request.Icon?.Trim() ?? space.Icon;
        space.DisplayOrder = request.DisplayOrder;
        space.Status = string.IsNullOrWhiteSpace(request.Status) ? space.Status : request.Status.ToLowerInvariant();
        space.ShowOnHome = request.ShowOnHome;
        space.ShowOnHeader = request.ShowOnHeader;

        await _context.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse<InteriorSpace>.Ok(space, "Cập nhật không gian nội thất thành công."));
    }

    /// <summary>
    /// Cập nhật trạng thái không gian nội thất (active/hidden)
    /// </summary>
    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateSpaceStatus(Guid id, [FromBody] UpdateSpaceStatusRequest request, CancellationToken cancellationToken)
    {
        var space = await _context.Spaces.FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
        if (space is null)
            return NotFound(ApiResponse<InteriorSpace>.Fail("Không tìm thấy không gian nội thất."));

        space.Status = string.IsNullOrWhiteSpace(request.Status) ? "active" : request.Status.ToLowerInvariant();
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse<InteriorSpace>.Ok(space, $"Đã chuyển trạng thái không gian thành '{space.Status}'."));
    }

    /// <summary>
    /// Xóa mềm không gian nội thất
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteSpace(Guid id, CancellationToken cancellationToken)
    {
        var space = await _context.Spaces.FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
        if (space is null)
            return NotFound(ApiResponse<bool>.Fail("Không tìm thấy không gian nội thất để xóa."));

        space.IsDeleted = true;
        space.DeletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse<bool>.Ok(true, $"Đã xóa không gian nội thất '{space.Name}'."));
    }

    /// <summary>
    /// Khôi phục không gian nội thất đã xóa
    /// </summary>
    [HttpPatch("{id:guid}/restore")]
    public async Task<IActionResult> RestoreSpace(Guid id, CancellationToken cancellationToken)
    {
        var space = await _context.Spaces
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(s => s.Id == id && s.IsDeleted, cancellationToken);

        if (space is null)
            return NotFound(ApiResponse<InteriorSpace>.Fail("Không tìm thấy không gian nội thất đã xóa."));

        space.IsDeleted = false;
        space.DeletedAt = null;
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse<InteriorSpace>.Ok(space, $"Đã khôi phục không gian nội thất '{space.Name}'."));
    }
}
