using InteriorDesign.Application.Interfaces;
using InteriorDesign.Domain.Entities;
using InteriorDesign.Domain.Enums;
using InteriorDesign.Integration.Common;
using InteriorDesign.Integration.Requests;
using InteriorDesign.Integration.Responses;
using MediatR;

namespace InteriorDesign.Application.Features.Products;

// Queries
public sealed record GetProductsQuery(
    int Page = 1,
    int PageSize = 20,
    string? Search = null,
    string? Space = null,
    Guid? CategoryId = null,
    string? Status = null
) : IRequest<ApiResponse<PagedResult<ProductDto>>>;

public sealed record GetProductByIdQuery(Guid Id) : IRequest<ApiResponse<ProductDto>>;
public sealed record GetProductBySlugQuery(string Slug) : IRequest<ApiResponse<ProductDto>>;
public sealed record GetFeaturedProductsQuery(int Limit = 8) : IRequest<ApiResponse<IReadOnlyList<ProductDto>>>;

// Commands
public sealed record CreateProductCommand(CreateProductRequest Request) : IRequest<ApiResponse<ProductDto>>;
public sealed record UpdateProductCommand(Guid Id, UpdateProductRequest Request) : IRequest<ApiResponse<ProductDto>>;
public sealed record DeleteProductCommand(Guid Id) : IRequest<ApiResponse<bool>>;

// Helpers
public static class ProductMapper
{
    public static ProductDto ToDto(Product p) => new(
        p.Id,
        p.Name,
        p.Slug,
        p.Sku,
        p.CategoryId,
        p.Category?.Name,
        p.Space,
        p.Price,
        p.OriginalPrice > 0 ? p.OriginalPrice : p.Price,
        p.DiscountPercent,
        p.Status.ToString(),
        p.MainImageUrl,
        p.Images ?? [],
        p.Dimensions,
        p.Material,
        p.WoodType,
        p.Rating,
        p.ReviewCount,
        p.IsFeatured,
        p.IsNew,
        p.InStock,
        p.ShortDescription,
        p.Description,
        p.CreatedAt,
        p.UpdatedAt
    );
}

// Handlers
public sealed class GetProductsQueryHandler(IInteriorRepository repo)
    : IRequestHandler<GetProductsQuery, ApiResponse<PagedResult<ProductDto>>>
{
    public async Task<ApiResponse<PagedResult<ProductDto>>> Handle(GetProductsQuery query, CancellationToken cancellationToken)
    {
        ProductStatus? statusFilter = null;
        if (!string.IsNullOrWhiteSpace(query.Status) && Enum.TryParse<ProductStatus>(query.Status, true, out var parsedStatus))
        {
            statusFilter = parsedStatus;
        }

        var result = await repo.GetProductsAsync(query.Page, query.PageSize, query.Search, query.Space, query.CategoryId, statusFilter, cancellationToken);
        var dtos = result.Items.Select(ProductMapper.ToDto).ToList();
        var paged = new PagedResult<ProductDto>(dtos, result.Page, result.PageSize, result.TotalItems);

        return ApiResponse<PagedResult<ProductDto>>.Ok(paged);
    }
}

public sealed class GetProductByIdQueryHandler(IInteriorRepository repo)
    : IRequestHandler<GetProductByIdQuery, ApiResponse<ProductDto>>
{
    public async Task<ApiResponse<ProductDto>> Handle(GetProductByIdQuery query, CancellationToken cancellationToken)
    {
        var product = await repo.GetProductByIdAsync(query.Id, cancellationToken);
        if (product is null) return ApiResponse<ProductDto>.Fail("Không tìm thấy sản phẩm.");
        return ApiResponse<ProductDto>.Ok(ProductMapper.ToDto(product));
    }
}

public sealed class GetProductBySlugQueryHandler(IInteriorRepository repo)
    : IRequestHandler<GetProductBySlugQuery, ApiResponse<ProductDto>>
{
    public async Task<ApiResponse<ProductDto>> Handle(GetProductBySlugQuery query, CancellationToken cancellationToken)
    {
        var product = await repo.GetProductBySlugAsync(query.Slug, cancellationToken);
        if (product is null) return ApiResponse<ProductDto>.Fail("Không tìm thấy sản phẩm.");
        return ApiResponse<ProductDto>.Ok(ProductMapper.ToDto(product));
    }
}

public sealed class GetFeaturedProductsQueryHandler(IInteriorRepository repo)
    : IRequestHandler<GetFeaturedProductsQuery, ApiResponse<IReadOnlyList<ProductDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<ProductDto>>> Handle(GetFeaturedProductsQuery query, CancellationToken cancellationToken)
    {
        var products = await repo.GetFeaturedProductsAsync(query.Limit, cancellationToken);
        var dtos = products.Select(ProductMapper.ToDto).ToList();
        return ApiResponse<IReadOnlyList<ProductDto>>.Ok(dtos);
    }
}

public sealed class CreateProductCommandHandler(IInteriorRepository repo)
    : IRequestHandler<CreateProductCommand, ApiResponse<ProductDto>>
{
    public async Task<ApiResponse<ProductDto>> Handle(CreateProductCommand command, CancellationToken cancellationToken)
    {
        var req = command.Request;
        var slug = !string.IsNullOrWhiteSpace(req.Slug) ? req.Slug : req.Name.ToLowerInvariant().Replace(" ", "-");
        
        var product = new Product
        {
            Name = req.Name,
            Slug = slug,
            Sku = req.Sku,
            CategoryId = req.CategoryId,
            Space = req.Space ?? "LivingRoom",
            Price = req.Price,
            OriginalPrice = req.OriginalPrice ?? req.Price,
            DiscountPercent = req.DiscountPercent,
            MainImageUrl = req.MainImageUrl ?? "",
            Images = req.Images ?? [],
            Dimensions = req.Dimensions ?? "",
            Material = req.Material ?? "",
            WoodType = req.WoodType ?? "",
            IsFeatured = req.IsFeatured,
            IsNew = req.IsNew,
            InStock = req.InStock,
            ShortDescription = req.ShortDescription ?? "",
            Description = req.Description ?? "",
            Status = ProductStatus.Active,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        var created = await repo.AddProductAsync(product, cancellationToken);
        return ApiResponse<ProductDto>.Ok(ProductMapper.ToDto(created), "Tạo sản phẩm thành công.");
    }
}

public sealed class UpdateProductCommandHandler(IInteriorRepository repo)
    : IRequestHandler<UpdateProductCommand, ApiResponse<ProductDto>>
{
    public async Task<ApiResponse<ProductDto>> Handle(UpdateProductCommand command, CancellationToken cancellationToken)
    {
        var req = command.Request;
        var existing = await repo.GetProductByIdAsync(command.Id, cancellationToken);
        if (existing is null) return ApiResponse<ProductDto>.Fail("Không tìm thấy sản phẩm cần cập nhật.");

        existing.Name = req.Name;
        existing.Slug = !string.IsNullOrWhiteSpace(req.Slug) ? req.Slug : existing.Slug;
        existing.Sku = req.Sku;
        existing.CategoryId = req.CategoryId;
        existing.Space = req.Space;
        existing.Price = req.Price;
        existing.OriginalPrice = req.OriginalPrice ?? req.Price;
        existing.DiscountPercent = req.DiscountPercent;
        if (Enum.TryParse<ProductStatus>(req.Status, true, out var parsedStatus))
        {
            existing.Status = parsedStatus;
        }
        existing.MainImageUrl = req.MainImageUrl ?? existing.MainImageUrl;
        existing.Images = req.Images ?? existing.Images;
        existing.Dimensions = req.Dimensions ?? existing.Dimensions;
        existing.Material = req.Material ?? existing.Material;
        existing.WoodType = req.WoodType ?? existing.WoodType;
        existing.IsFeatured = req.IsFeatured;
        existing.IsNew = req.IsNew;
        existing.InStock = req.InStock;
        existing.ShortDescription = req.ShortDescription ?? existing.ShortDescription;
        existing.Description = req.Description ?? existing.Description;
        existing.UpdatedAt = DateTimeOffset.UtcNow;

        var updated = await repo.UpdateProductAsync(existing, cancellationToken);
        return ApiResponse<ProductDto>.Ok(ProductMapper.ToDto(updated!), "Cập nhật sản phẩm thành công.");
    }
}

public sealed class DeleteProductCommandHandler(IInteriorRepository repo)
    : IRequestHandler<DeleteProductCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(DeleteProductCommand command, CancellationToken cancellationToken)
    {
        var success = await repo.DeleteProductAsync(command.Id, cancellationToken);
        if (!success) return ApiResponse<bool>.Fail("Không tìm thấy hoặc không thể xóa sản phẩm.");
        return ApiResponse<bool>.Ok(true, "Xóa sản phẩm thành công.");
    }
}
