using InteriorDesign.Application.Features.Products;
using InteriorDesign.Domain.Entities;
using InteriorDesign.Infrastructure.Data;
using InteriorDesign.Integration.Common;
using InteriorDesign.Integration.Requests;
using InteriorDesign.Integration.Responses;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InteriorDesign.Api.Controllers;

[Route("api/products")]
public sealed class ProductsController : ApiControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetProducts(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] string? space = null,
        [FromQuery] Guid? categoryId = null,
        [FromQuery] string? status = null,
        [FromQuery] string? branch = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var clampedPage = Math.Max(1, page);
            var clampedPageSize = Math.Max(1, pageSize);
            var response = await Sender.Send(new GetProductsQuery(clampedPage, clampedPageSize, search, space, categoryId, status), cancellationToken);

            if (response.Success && response.Data?.Items != null && !string.IsNullOrWhiteSpace(branch) && !string.Equals(branch, "all", StringComparison.OrdinalIgnoreCase))
            {
                var adjustedItems = response.Data.Items.Select(p =>
                {
                    int branchQty = 0;
                    if (!string.IsNullOrWhiteSpace(p.BranchStocksJson) && p.BranchStocksJson != "{}")
                    {
                        try
                        {
                            var dict = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, int>>(p.BranchStocksJson);
                            if (dict != null)
                            {
                                var matchKey = dict.Keys.FirstOrDefault(k => string.Equals(k, branch, StringComparison.OrdinalIgnoreCase) || k.Contains(branch, StringComparison.OrdinalIgnoreCase) || branch.Contains(k, StringComparison.OrdinalIgnoreCase));
                                if (matchKey != null && dict.TryGetValue(matchKey, out var q))
                                {
                                    branchQty = q;
                                }
                            }
                        }
                        catch { }
                    }
                    else
                    {
                        // Chưa chia tồn kho chi nhánh -> trả về 0 cho chi nhánh phụ hoặc giữ nguyên nếu là chi nhánh gốc
                        branchQty = p.InStock;
                    }
                    return p with { InStock = branchQty };
                }).ToList();

                var pagedResult = new PagedResult<ProductDto>(adjustedItems, response.Data.Page, response.Data.PageSize, response.Data.TotalItems);
                return Ok(ApiResponse<PagedResult<ProductDto>>.Ok(pagedResult));
            }

            return Ok(response);
        }
        catch (OperationCanceledException)
        {
            return StatusCode(499, ApiResponse<object>.Fail("Yêu cầu đã bị hủy."));
        }
    }

    [HttpGet("featured")]
    public async Task<IActionResult> GetFeaturedProducts([FromQuery] int limit = 8, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await Sender.Send(new GetFeaturedProductsQuery(limit), cancellationToken);
            return Ok(response);
        }
        catch (OperationCanceledException)
        {
            return StatusCode(499, ApiResponse<object>.Fail("Yêu cầu đã bị hủy."));
        }
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetProductById(Guid id, CancellationToken cancellationToken) =>
        ToActionResult(await Sender.Send(new GetProductByIdQuery(id), cancellationToken));

    [HttpGet("slug/{slug}")]
    public async Task<IActionResult> GetProductBySlug(string slug, CancellationToken cancellationToken) =>
        ToActionResult(await Sender.Send(new GetProductBySlugQuery(slug), cancellationToken));

    [HttpGet("detail/{identifier}")]
    public async Task<IActionResult> GetProductDetail(string identifier, [FromQuery] int relatedLimit = 4, CancellationToken cancellationToken = default) =>
        ToActionResult(await Sender.Send(new GetProductDetailQuery(identifier, relatedLimit), cancellationToken));

    [HttpPost]
    public async Task<IActionResult> CreateProduct([FromBody] CreateProductRequest request, CancellationToken cancellationToken) =>
        ToActionResult(await Sender.Send(new CreateProductCommand(request), cancellationToken));

    [HttpPost("bulk")]
    public async Task<IActionResult> BulkImportProducts(
        [FromBody] List<CreateProductRequest> requests,
        [FromServices] InteriorDbContext context,
        CancellationToken cancellationToken)
    {
        if (requests == null || requests.Count == 0)
            return BadRequest(ApiResponse<int>.Fail("Danh sách sản phẩm trống."));

        var existingCategories = await context.Categories.ToListAsync(cancellationToken);
        var existingProducts = await context.Products.ToListAsync(cancellationToken);
        var usedCatCodes = new HashSet<string>(existingCategories.Select(c => c.Code?.Trim() ?? "").Where(c => !string.IsNullOrEmpty(c)), StringComparer.OrdinalIgnoreCase);

        string GenerateCategoryCode()
        {
            int i = 1;
            while (usedCatCodes.Contains($"NH{i:D2}"))
            {
                i++;
            }
            var code = $"NH{i:D2}";
            usedCatCodes.Add(code);
            return code;
        }

        var productMapBySku = new Dictionary<string, Product>(StringComparer.OrdinalIgnoreCase);
        foreach (var p in existingProducts)
        {
            if (!string.IsNullOrWhiteSpace(p.Sku))
            {
                productMapBySku[p.Sku.Trim()] = p;
            }
        }

        var toAdd = new List<Product>();
        int insertedCount = 0;
        int updatedCount = 0;

        foreach (var req in requests)
        {
            if (string.IsNullOrWhiteSpace(req.Name)) continue;

            var sku = !string.IsNullOrWhiteSpace(req.Sku) ? req.Sku.Trim() : (!string.IsNullOrWhiteSpace(req.Code) ? req.Code.Trim() : $"SP-{DateTime.UtcNow.Ticks % 100000:D5}");
            var skuKey = sku.ToLowerInvariant();

            Guid categoryId = req.CategoryId;
            if (categoryId == Guid.Empty)
            {
                var catText = (req.Collection ?? "").Trim();
                if (!string.IsNullOrWhiteSpace(catText))
                {
                    var matched = existingCategories.FirstOrDefault(c =>
                        c.Name.Equals(catText, StringComparison.OrdinalIgnoreCase) ||
                        catText.Contains(c.Name, StringComparison.OrdinalIgnoreCase) ||
                        c.Name.Contains(catText, StringComparison.OrdinalIgnoreCase));

                    if (matched != null)
                    {
                        categoryId = matched.Id;
                    }
                    else
                    {
                        var newCatCode = GenerateCategoryCode();
                        var newCat = new Category
                        {
                            Id = Guid.NewGuid(),
                            Code = newCatCode,
                            Name = catText,
                            Slug = catText.ToLowerInvariant().Replace(" ", "-").Replace("/", "-"),
                            Space = !string.IsNullOrWhiteSpace(req.Space) ? req.Space : "Phòng Khách",
                            Status = "active",
                            IsActive = true,
                            DisplayOrder = existingCategories.Count + 1,
                            CreatedAt = DateTime.UtcNow
                        };
                        context.Categories.Add(newCat);
                        existingCategories.Add(newCat);
                        categoryId = newCat.Id;
                    }
                }
                else
                {
                    categoryId = existingCategories.FirstOrDefault()?.Id ?? Guid.Empty;
                }
            }

            if (productMapBySku.TryGetValue(skuKey, out var existingProduct))
            {
                // UPSERT - CẬP NHẬT SẢN PHẨM ĐÃ TỒN TẠI
                existingProduct.Name = req.Name.Trim();
                if (categoryId != Guid.Empty) existingProduct.CategoryId = categoryId;
                if (!string.IsNullOrWhiteSpace(req.Space)) existingProduct.Space = req.Space;
                if (req.Price > 0) existingProduct.Price = req.Price;
                if (req.OriginalPrice.HasValue && req.OriginalPrice.Value > 0) existingProduct.OriginalPrice = req.OriginalPrice.Value;
                else if (req.Price > 0) existingProduct.OriginalPrice = req.Price;

                if (!string.IsNullOrWhiteSpace(req.MainImageUrl)) existingProduct.MainImageUrl = req.MainImageUrl;
                if (req.Images != null && req.Images.Count > 0) existingProduct.Images = req.Images;
                if (!string.IsNullOrWhiteSpace(req.Dimensions)) existingProduct.Dimensions = req.Dimensions;
                if (!string.IsNullOrWhiteSpace(req.Material)) existingProduct.Material = req.Material;
                if (!string.IsNullOrWhiteSpace(req.WoodType)) existingProduct.WoodType = req.WoodType;
                if (!string.IsNullOrWhiteSpace(req.Color)) existingProduct.Color = req.Color;
                if (!string.IsNullOrWhiteSpace(req.Warranty)) existingProduct.Warranty = req.Warranty;
                if (!string.IsNullOrWhiteSpace(req.ShippingNote)) existingProduct.ShippingNote = req.ShippingNote;
                if (!string.IsNullOrWhiteSpace(req.Description)) existingProduct.Description = req.Description;
                if (!string.IsNullOrWhiteSpace(req.ShortDescription) || !string.IsNullOrWhiteSpace(req.Collection))
                    existingProduct.ShortDescription = req.ShortDescription ?? req.Collection ?? "";

                if (req.InStock > 0) existingProduct.InStock = req.InStock;
                if (!string.IsNullOrWhiteSpace(req.Unit)) existingProduct.Unit = req.Unit.Trim();
                existingProduct.UpdatedAt = DateTimeOffset.UtcNow;
                updatedCount++;
            }
            else
            {
                // UPSERT - THÊM MỚI SẢN PHẨM CHƯA CÓ TRONG CSDL
                var slug = !string.IsNullOrWhiteSpace(req.Slug) ? req.Slug.Trim() : req.Name.ToLowerInvariant().Trim().Replace(" ", "-").Replace("/", "-");
                slug = System.Text.RegularExpressions.Regex.Replace(slug, @"[^a-z0-9\-]", "");
                if (string.IsNullOrEmpty(slug)) slug = $"san-pham-{sku.ToLower()}";

                var product = new Product
                {
                    Id = Guid.NewGuid(),
                    Name = req.Name.Trim(),
                    Slug = $"{slug}-{sku.ToLower()}",
                    Sku = sku,
                    CategoryId = categoryId,
                    Space = !string.IsNullOrWhiteSpace(req.Space) ? req.Space : "Phòng Ăn",
                    Price = req.Price > 0 ? req.Price : 0,
                    OriginalPrice = req.OriginalPrice ?? req.Price,
                    DiscountPercent = req.DiscountPercent,
                    MainImageUrl = req.MainImageUrl ?? "",
                    Images = req.Images ?? [],
                    Dimensions = req.Dimensions ?? "",
                    Material = req.Material ?? "Gỗ Sồi tự nhiên (Ash/Oak)",
                    WoodType = req.WoodType ?? req.Material ?? "Gỗ Sồi tự nhiên",
                    Color = req.Color ?? "Nâu hạt dẻ / tự nhiên (Đa dạng)",
                    Warranty = req.Warranty ?? "24 tháng",
                    ShippingNote = req.ShippingNote ?? "Miễn phí giao hàng và lắp đặt toàn quốc.",
                    IsFeatured = req.IsFeatured,
                    IsNew = true,
                    InStock = req.InStock > 0 ? req.InStock : 10,
                    Unit = !string.IsNullOrWhiteSpace(req.Unit) ? req.Unit.Trim() : "Bộ",
                    ShortDescription = req.ShortDescription ?? req.Collection ?? "",
                    Description = req.Description ?? req.Name,
                    Status = Domain.Enums.ProductStatus.Active,
                    CreatedAt = DateTimeOffset.UtcNow,
                    UpdatedAt = DateTimeOffset.UtcNow
                };

                toAdd.Add(product);
                productMapBySku[skuKey] = product; // Tránh trùng lặp nếu trong cùng file có mã SKU lặp
                insertedCount++;
            }
        }

        if (toAdd.Count > 0)
        {
            await context.Products.AddRangeAsync(toAdd, cancellationToken);
        }

        await context.SaveChangesAsync(cancellationToken);

        int totalProcessed = insertedCount + updatedCount;
        return Ok(ApiResponse<int>.Ok(totalProcessed, $"Đã xử lý {totalProcessed} sản phẩm (Thêm mới: {insertedCount}, Cập nhật: {updatedCount})!"));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateProduct(Guid id, [FromBody] UpdateProductRequest request, CancellationToken cancellationToken) =>
        ToActionResult(await Sender.Send(new UpdateProductCommand(id, request), cancellationToken));

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteProduct(Guid id, CancellationToken cancellationToken) =>
        ToActionResult(await Sender.Send(new DeleteProductCommand(id), cancellationToken));
}
