using InteriorDesign.Application.Interfaces;
using InteriorDesign.Domain.Entities;
using InteriorDesign.Domain.Enums;
using InteriorDesign.Integration.Common;
using InteriorDesign.Integration.Requests;
using InteriorDesign.Integration.Responses;
using MediatR;

namespace InteriorDesign.Application.Features.Orders;

public sealed record GetOrdersQuery(
    int Page = 1,
    int PageSize = 20,
    string? Search = null,
    string? Status = null
) : IRequest<ApiResponse<PagedResult<OrderDto>>>;

public sealed record GetOrderByIdQuery(Guid Id) : IRequest<ApiResponse<OrderDto>>;
public sealed record GetOrderByCodeQuery(string Code) : IRequest<ApiResponse<OrderDto>>;
public sealed record CreateOrderCommand(CreateOrderRequest Request) : IRequest<ApiResponse<OrderDto>>;
public sealed record UpdateOrderStatusCommand(Guid Id, UpdateOrderStatusRequest Request) : IRequest<ApiResponse<OrderDto>>;
public sealed record UpdatePaymentStatusCommand(Guid Id, UpdatePaymentStatusRequest Request) : IRequest<ApiResponse<OrderDto>>;

public static class OrderMapper
{
    public static OrderDto ToDto(Order o) => new(
        o.Id,
        o.OrderCode,
        o.CustomerId,
        o.CustomerName,
        o.CustomerPhone,
        o.CustomerEmail,
        o.ShippingAddress,
        o.City,
        o.District,
        o.Note,
        o.PaymentMethod,
        o.PaymentStatus.ToString(),
        o.Status.ToString(),
        o.SubTotal,
        o.ShippingFee,
        o.DiscountAmount,
        o.TotalAmount,
        o.Items.Select(i => new OrderItemDto(
            i.Id,
            i.ProductId,
            i.ProductName,
            i.ProductSku,
            i.ProductImage,
            i.Material,
            i.Dimensions,
            i.UnitPrice,
            i.Quantity,
            i.TotalPrice
        )).ToList(),
        o.CreatedAt,
        o.UpdatedAt
    );
}

public sealed class GetOrdersQueryHandler(IInteriorRepository repo)
    : IRequestHandler<GetOrdersQuery, ApiResponse<PagedResult<OrderDto>>>
{
    public async Task<ApiResponse<PagedResult<OrderDto>>> Handle(GetOrdersQuery query, CancellationToken cancellationToken)
    {
        OrderStatus? statusFilter = null;
        if (!string.IsNullOrWhiteSpace(query.Status) && Enum.TryParse<OrderStatus>(query.Status, true, out var parsedStatus))
        {
            statusFilter = parsedStatus;
        }

        var result = await repo.GetOrdersAsync(query.Page, query.PageSize, query.Search, statusFilter, cancellationToken);
        var dtos = result.Items.Select(OrderMapper.ToDto).ToList();
        var paged = new PagedResult<OrderDto>(dtos, result.Page, result.PageSize, result.TotalItems);
        return ApiResponse<PagedResult<OrderDto>>.Ok(paged);
    }
}

public sealed class GetOrderByIdQueryHandler(IInteriorRepository repo)
    : IRequestHandler<GetOrderByIdQuery, ApiResponse<OrderDto>>
{
    public async Task<ApiResponse<OrderDto>> Handle(GetOrderByIdQuery query, CancellationToken cancellationToken)
    {
        var order = await repo.GetOrderByIdAsync(query.Id, cancellationToken);
        if (order is null) return ApiResponse<OrderDto>.Fail("Không tìm thấy đơn hàng.");
        return ApiResponse<OrderDto>.Ok(OrderMapper.ToDto(order));
    }
}

public sealed class CreateOrderCommandHandler(IInteriorRepository repo)
    : IRequestHandler<CreateOrderCommand, ApiResponse<OrderDto>>
{
    public async Task<ApiResponse<OrderDto>> Handle(CreateOrderCommand command, CancellationToken cancellationToken)
    {
        var req = command.Request;
        var orderCode = "KD" + DateTime.UtcNow.ToString("yyMMdd") + new Random().Next(1000, 9999).ToString();

        var subTotal = req.Items.Sum(i => i.UnitPrice * i.Quantity);
        var total = subTotal + req.ShippingFee - req.DiscountAmount;
        if (total < 0) total = 0;

        var order = new Order
        {
            OrderCode = orderCode,
            CustomerName = req.CustomerName,
            CustomerPhone = req.CustomerPhone,
            CustomerEmail = req.CustomerEmail ?? "",
            ShippingAddress = req.ShippingAddress,
            City = req.City ?? "",
            District = req.District ?? "",
            Note = req.Note ?? "",
            PaymentMethod = req.PaymentMethod ?? "VietQR",
            PaymentStatus = req.PaymentMethod == "COD" ? PaymentStatus.Pending : PaymentStatus.Paid,
            Status = OrderStatus.Pending,
            SubTotal = subTotal,
            ShippingFee = req.ShippingFee,
            DiscountAmount = req.DiscountAmount,
            TotalAmount = total,
            Items = req.Items.Select(i => new OrderItem
            {
                ProductId = i.ProductId,
                ProductName = i.ProductName,
                ProductSku = i.ProductSku ?? "",
                ProductImage = i.ProductImage ?? "",
                Material = i.Material ?? "",
                Dimensions = i.Dimensions ?? "",
                UnitPrice = i.UnitPrice,
                Quantity = i.Quantity,
                TotalPrice = i.UnitPrice * i.Quantity
            }).ToList()
        };

        var created = await repo.AddOrderAsync(order, cancellationToken);
        return ApiResponse<OrderDto>.Ok(OrderMapper.ToDto(created), "Đặt hàng thành công.");
    }
}

public sealed class UpdateOrderStatusCommandHandler(IInteriorRepository repo)
    : IRequestHandler<UpdateOrderStatusCommand, ApiResponse<OrderDto>>
{
    public async Task<ApiResponse<OrderDto>> Handle(UpdateOrderStatusCommand command, CancellationToken cancellationToken)
    {
        var existing = await repo.GetOrderByIdAsync(command.Id, cancellationToken);
        if (existing is null) return ApiResponse<OrderDto>.Fail("Không tìm thấy đơn hàng.");

        if (Enum.TryParse<OrderStatus>(command.Request.Status, true, out var status))
        {
            existing.Status = status;
            existing.UpdatedAt = DateTimeOffset.UtcNow;
            var updated = await repo.UpdateOrderAsync(existing, cancellationToken);
            return ApiResponse<OrderDto>.Ok(OrderMapper.ToDto(updated!), "Cập nhật trạng thái đơn hàng thành công.");
        }

        return ApiResponse<OrderDto>.Fail("Trạng thái không hợp lệ.");
    }
}

public sealed class UpdatePaymentStatusCommandHandler(IInteriorRepository repo)
    : IRequestHandler<UpdatePaymentStatusCommand, ApiResponse<OrderDto>>
{
    public async Task<ApiResponse<OrderDto>> Handle(UpdatePaymentStatusCommand command, CancellationToken cancellationToken)
    {
        var existing = await repo.GetOrderByIdAsync(command.Id, cancellationToken);
        if (existing is null) return ApiResponse<OrderDto>.Fail("Không tìm thấy đơn hàng.");

        if (Enum.TryParse<PaymentStatus>(command.Request.PaymentStatus, true, out var paymentStatus))
        {
            existing.PaymentStatus = paymentStatus;
            existing.UpdatedAt = DateTimeOffset.UtcNow;
            var updated = await repo.UpdateOrderAsync(existing, cancellationToken);
            return ApiResponse<OrderDto>.Ok(OrderMapper.ToDto(updated!), "Cập nhật trạng thái thanh toán thành công.");
        }

        return ApiResponse<OrderDto>.Fail("Trạng thái thanh toán không hợp lệ.");
    }
}
