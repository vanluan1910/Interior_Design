using InteriorDesign.Application.Interfaces;
using InteriorDesign.Domain.Entities;
using InteriorDesign.Integration.Common;
using InteriorDesign.Integration.Requests;
using InteriorDesign.Integration.Responses;
using MediatR;

namespace InteriorDesign.Application.Features.Categories;

public sealed record GetCategoriesQuery : IRequest<ApiResponse<IReadOnlyList<CategoryDto>>>;
public sealed record GetCategoryByIdQuery(Guid Id) : IRequest<ApiResponse<CategoryDto>>;
public sealed record CreateCategoryCommand(CreateCategoryRequest Request) : IRequest<ApiResponse<CategoryDto>>;
public sealed record UpdateCategoryCommand(Guid Id, UpdateCategoryRequest Request) : IRequest<ApiResponse<CategoryDto>>;
public sealed record DeleteCategoryCommand(Guid Id) : IRequest<ApiResponse<bool>>;

public static class CategoryMapper
{
    public static CategoryDto ToDto(Category c) => new(
        c.Id,
        c.Name,
        c.Slug,
        c.Description,
        c.ImageUrl,
        c.Icon,
        c.Space,
        c.DisplayOrder,
        c.IsActive,
        c.Products?.Count ?? 0
    );
}

public sealed class GetCategoriesQueryHandler(IInteriorRepository repo)
    : IRequestHandler<GetCategoriesQuery, ApiResponse<IReadOnlyList<CategoryDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<CategoryDto>>> Handle(GetCategoriesQuery request, CancellationToken cancellationToken)
    {
        var categories = await repo.GetCategoriesAsync(cancellationToken);
        var dtos = categories.Select(CategoryMapper.ToDto).ToList();
        return ApiResponse<IReadOnlyList<CategoryDto>>.Ok(dtos);
    }
}

public sealed class GetCategoryByIdQueryHandler(IInteriorRepository repo)
    : IRequestHandler<GetCategoryByIdQuery, ApiResponse<CategoryDto>>
{
    public async Task<ApiResponse<CategoryDto>> Handle(GetCategoryByIdQuery query, CancellationToken cancellationToken)
    {
        var category = await repo.GetCategoryByIdAsync(query.Id, cancellationToken);
        if (category is null) return ApiResponse<CategoryDto>.Fail("Không tìm thấy danh mục.");
        return ApiResponse<CategoryDto>.Ok(CategoryMapper.ToDto(category));
    }
}

public sealed class CreateCategoryCommandHandler(IInteriorRepository repo)
    : IRequestHandler<CreateCategoryCommand, ApiResponse<CategoryDto>>
{
    public async Task<ApiResponse<CategoryDto>> Handle(CreateCategoryCommand command, CancellationToken cancellationToken)
    {
        var req = command.Request;
        var category = new Category
        {
            Name = req.Name,
            Slug = !string.IsNullOrWhiteSpace(req.Slug) ? req.Slug : req.Name.ToLowerInvariant().Replace(" ", "-"),
            Description = req.Description ?? "",
            ImageUrl = req.ImageUrl ?? "",
            Icon = req.Icon ?? "",
            Space = req.Space ?? "",
            DisplayOrder = req.DisplayOrder,
            IsActive = true
        };

        var created = await repo.AddCategoryAsync(category, cancellationToken);
        return ApiResponse<CategoryDto>.Ok(CategoryMapper.ToDto(created), "Tạo danh mục thành công.");
    }
}

public sealed class UpdateCategoryCommandHandler(IInteriorRepository repo)
    : IRequestHandler<UpdateCategoryCommand, ApiResponse<CategoryDto>>
{
    public async Task<ApiResponse<CategoryDto>> Handle(UpdateCategoryCommand command, CancellationToken cancellationToken)
    {
        var req = command.Request;
        var existing = await repo.GetCategoryByIdAsync(command.Id, cancellationToken);
        if (existing is null) return ApiResponse<CategoryDto>.Fail("Không tìm thấy danh mục cần cập nhật.");

        existing.Name = req.Name;
        existing.Slug = !string.IsNullOrWhiteSpace(req.Slug) ? req.Slug : existing.Slug;
        existing.Description = req.Description ?? existing.Description;
        existing.ImageUrl = req.ImageUrl ?? existing.ImageUrl;
        existing.Icon = req.Icon ?? existing.Icon;
        existing.Space = req.Space ?? existing.Space;
        existing.DisplayOrder = req.DisplayOrder;
        existing.IsActive = req.IsActive;

        var updated = await repo.UpdateCategoryAsync(existing, cancellationToken);
        return ApiResponse<CategoryDto>.Ok(CategoryMapper.ToDto(updated!), "Cập nhật danh mục thành công.");
    }
}

public sealed class DeleteCategoryCommandHandler(IInteriorRepository repo)
    : IRequestHandler<DeleteCategoryCommand, ApiResponse<bool>>
{
    public async Task<ApiResponse<bool>> Handle(DeleteCategoryCommand command, CancellationToken cancellationToken)
    {
        var success = await repo.DeleteCategoryAsync(command.Id, cancellationToken);
        if (!success) return ApiResponse<bool>.Fail("Không thể xóa danh mục này.");
        return ApiResponse<bool>.Ok(true, "Xóa danh mục thành công.");
    }
}
