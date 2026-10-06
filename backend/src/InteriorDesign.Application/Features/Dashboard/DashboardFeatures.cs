using InteriorDesign.Application.Features.Consultations;
using InteriorDesign.Application.Features.Orders;
using InteriorDesign.Application.Interfaces;
using InteriorDesign.Integration.Common;
using InteriorDesign.Integration.Responses;
using MediatR;

namespace InteriorDesign.Application.Features.Dashboard;

public sealed record GetDashboardSummaryQuery : IRequest<ApiResponse<DashboardSummaryDto>>;

public sealed class GetDashboardSummaryQueryHandler(IInteriorRepository repo)
    : IRequestHandler<GetDashboardSummaryQuery, ApiResponse<DashboardSummaryDto>>
{
    public async Task<ApiResponse<DashboardSummaryDto>> Handle(GetDashboardSummaryQuery request, CancellationToken cancellationToken)
    {
        var stats = await repo.GetDashboardStatsAsync(cancellationToken);
        var orders = await repo.GetOrdersAsync(1, 5, null, null, cancellationToken);
        var consultations = await repo.GetConsultationsAsync(1, 5, null, null, cancellationToken);

        var dto = new DashboardSummaryDto(
            stats.TotalRevenue,
            stats.TotalOrders,
            stats.PendingOrders,
            stats.TotalProducts,
            stats.TotalConsultations,
            stats.TotalCustomers,
            orders.Items.Select(OrderMapper.ToDto).ToList(),
            consultations.Items.Select(ConsultationMapper.ToDto).ToList()
        );

        return ApiResponse<DashboardSummaryDto>.Ok(dto);
    }
}
