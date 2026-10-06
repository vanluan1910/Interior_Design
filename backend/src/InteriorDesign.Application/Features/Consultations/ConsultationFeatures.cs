using InteriorDesign.Application.Interfaces;
using InteriorDesign.Domain.Entities;
using InteriorDesign.Domain.Enums;
using InteriorDesign.Integration.Common;
using InteriorDesign.Integration.Requests;
using InteriorDesign.Integration.Responses;
using MediatR;

namespace InteriorDesign.Application.Features.Consultations;

public sealed record GetConsultationsQuery(
    int Page = 1,
    int PageSize = 20,
    string? Search = null,
    string? Status = null
) : IRequest<ApiResponse<PagedResult<ConsultationDto>>>;

public sealed record GetConsultationByIdQuery(Guid Id) : IRequest<ApiResponse<ConsultationDto>>;
public sealed record CreateConsultationCommand(CreateConsultationRequest Request) : IRequest<ApiResponse<ConsultationDto>>;
public sealed record UpdateConsultationStatusCommand(Guid Id, UpdateConsultationStatusRequest Request) : IRequest<ApiResponse<ConsultationDto>>;

public static class ConsultationMapper
{
    public static ConsultationDto ToDto(ConsultationBooking b) => new(
        b.Id,
        b.FullName,
        b.Phone,
        b.Email,
        b.Address,
        b.PreferredDate,
        b.SpaceType,
        b.DesignStyle,
        b.BudgetRange,
        b.Notes,
        b.Status.ToString(),
        b.CreatedAt,
        b.UpdatedAt
    );
}

public sealed class GetConsultationsQueryHandler(IInteriorRepository repo)
    : IRequestHandler<GetConsultationsQuery, ApiResponse<PagedResult<ConsultationDto>>>
{
    public async Task<ApiResponse<PagedResult<ConsultationDto>>> Handle(GetConsultationsQuery query, CancellationToken cancellationToken)
    {
        ConsultationStatus? statusFilter = null;
        if (!string.IsNullOrWhiteSpace(query.Status) && Enum.TryParse<ConsultationStatus>(query.Status, true, out var parsedStatus))
        {
            statusFilter = parsedStatus;
        }

        var result = await repo.GetConsultationsAsync(query.Page, query.PageSize, query.Search, statusFilter, cancellationToken);
        var dtos = result.Items.Select(ConsultationMapper.ToDto).ToList();
        var paged = new PagedResult<ConsultationDto>(dtos, result.Page, result.PageSize, result.TotalItems);
        return ApiResponse<PagedResult<ConsultationDto>>.Ok(paged);
    }
}

public sealed class GetConsultationByIdQueryHandler(IInteriorRepository repo)
    : IRequestHandler<GetConsultationByIdQuery, ApiResponse<ConsultationDto>>
{
    public async Task<ApiResponse<ConsultationDto>> Handle(GetConsultationByIdQuery query, CancellationToken cancellationToken)
    {
        var item = await repo.GetConsultationByIdAsync(query.Id, cancellationToken);
        if (item is null) return ApiResponse<ConsultationDto>.Fail("Không tìm thấy thông tin tư vấn.");
        return ApiResponse<ConsultationDto>.Ok(ConsultationMapper.ToDto(item));
    }
}

public sealed class CreateConsultationCommandHandler(IInteriorRepository repo)
    : IRequestHandler<CreateConsultationCommand, ApiResponse<ConsultationDto>>
{
    public async Task<ApiResponse<ConsultationDto>> Handle(CreateConsultationCommand command, CancellationToken cancellationToken)
    {
        var req = command.Request;
        var booking = new ConsultationBooking
        {
            FullName = req.FullName,
            Phone = req.Phone,
            Email = req.Email ?? "",
            Address = req.Address ?? "",
            PreferredDate = req.PreferredDate,
            SpaceType = req.SpaceType ?? "LivingRoom",
            DesignStyle = req.DesignStyle ?? "Japandi",
            BudgetRange = req.BudgetRange ?? "",
            Notes = req.Notes ?? "",
            Status = ConsultationStatus.Pending,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        var created = await repo.AddConsultationAsync(booking, cancellationToken);
        return ApiResponse<ConsultationDto>.Ok(ConsultationMapper.ToDto(created), "Đăng ký tư vấn thiết kế thành công. Chúng tôi sẽ liên hệ trong 24h.");
    }
}

public sealed class UpdateConsultationStatusCommandHandler(IInteriorRepository repo)
    : IRequestHandler<UpdateConsultationStatusCommand, ApiResponse<ConsultationDto>>
{
    public async Task<ApiResponse<ConsultationDto>> Handle(UpdateConsultationStatusCommand command, CancellationToken cancellationToken)
    {
        var existing = await repo.GetConsultationByIdAsync(command.Id, cancellationToken);
        if (existing is null) return ApiResponse<ConsultationDto>.Fail("Không tìm thấy thông tin tư vấn.");

        if (Enum.TryParse<ConsultationStatus>(command.Request.Status, true, out var status))
        {
            existing.Status = status;
            existing.UpdatedAt = DateTimeOffset.UtcNow;
            var updated = await repo.UpdateConsultationAsync(existing, cancellationToken);
            return ApiResponse<ConsultationDto>.Ok(ConsultationMapper.ToDto(updated!), "Cập nhật trạng thái thành công.");
        }

        return ApiResponse<ConsultationDto>.Fail("Trạng thái không hợp lệ.");
    }
}
