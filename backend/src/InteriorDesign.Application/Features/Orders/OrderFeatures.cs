using InteriorDesign.Application.Interfaces;
using InteriorDesign.Domain.Entities;
using InteriorDesign.Domain.Enums;
using InteriorDesign.Integration.Common;
using InteriorDesign.Integration.Requests;
using InteriorDesign.Integration.Responses;
using MediatR;

namespace InteriorDesign.Application.Features.Orders;

public sealed record GetOrdersQuery(
    int? Page = null,
    int? PageSize = null,
    string? Search = null,
    string? Status = null,
    string? OrderType = null,
    string? Branch = null,
    string? SpaceType = null
) : IRequest<ApiResponse<List<OrderDto>>>;

public sealed record GetOrderByIdQuery(Guid Id) : IRequest<ApiResponse<OrderDto>>;
public sealed record GetOrderByCodeQuery(string Code) : IRequest<ApiResponse<OrderDto>>;
public sealed record CreateOrderCommand(CreateOrderRequest Request) : IRequest<ApiResponse<OrderDto>>;
public sealed record UpdateOrderCommand(Guid Id, UpdateOrderRequest Request) : IRequest<ApiResponse<OrderDto>>;
public sealed record DeleteOrderCommand(Guid Id) : IRequest<ApiResponse<bool>>;
public sealed record UpdateOrderStatusCommand(Guid Id, UpdateOrderStatusRequest Request) : IRequest<ApiResponse<OrderDto>>;
public sealed record UpdatePaymentStatusCommand(Guid Id, UpdatePaymentStatusRequest Request) : IRequest<ApiResponse<OrderDto>>;
public sealed record BulkUpdateOrderStatusCommand(BulkUpdateOrderStatusRequest Request) : IRequest<ApiResponse<int>>;

public static class OrderMapper
{
    public static OrderDto ToDto(Order o)
    {
        var typeLabel = o.OrderType switch
        {
            "custom" => "Sản xuất may đo",
            "package" => "Gói nội thất",
            "project" => "Dự án công trình",
            "subcontract" => "Gia công xưởng",
            "ready" => "Hàng sẵn showroom",
            _ => "Bán lẻ showroom"
        };

        var statusLabel = o.Status switch
        {
            OrderStatus.Pending => "Chờ xử lý",
            OrderStatus.Processing => "Đang xử lý / SX",
            OrderStatus.Delivering => "Đang giao hàng",
            OrderStatus.Completed => "Hoàn thành",
            OrderStatus.Cancelled => "Đã hủy",
            _ => o.Status.ToString()
        };

        var spaceLabel = o.SpaceType switch
        {
            "living" => "Phòng khách",
            "dining" => "Phòng ăn",
            "bedroom" => "Phòng ngủ",
            "office" => "Phòng làm việc",
            "full" => "Toàn bộ căn hộ",
            _ => o.SpaceType ?? ""
        };

        var val = o.TotalAmount > 0 ? o.TotalAmount : o.SubTotal;

        return new OrderDto(
            Id: o.Id,
            OrderCode: o.OrderCode,
            OrderType: o.OrderType,
            OrderTypeLabel: typeLabel,
            CustomerId: o.CustomerId,
            CustomerName: o.CustomerName,
            CustomerPhone: o.CustomerPhone,
            CustomerEmail: o.CustomerEmail,
            ShippingAddress: o.ShippingAddress,
            CustomerProvince: o.City,
            CustomerDistrict: o.District,
            CustomerAddress: o.ShippingAddress,
            ProductName: o.ProductName,
            ProductSpec: o.ProductSpec,
            WoodType: o.WoodType,
            SpaceType: o.SpaceType,
            SpaceLabel: spaceLabel,
            Branch: o.Branch,
            Showroom: o.Showroom ?? o.Branch,
            OrderDate: o.OrderDate.ToString("yyyy-MM-dd"),
            DeadlineDate: o.DeadlineDate?.ToString("yyyy-MM-dd"),
            Note: o.Note,
            PaymentMethod: o.PaymentMethod,
            PaymentStatus: o.PaymentStatus.ToString(),
            Status: o.Status.ToString().ToLower(),
            StatusLabel: statusLabel,
            SubTotal: o.SubTotal,
            Value: val,
            DepositPercent: o.DepositPercent,
            DepositAmount: o.DepositAmount,
            DepositNote: o.DepositNote,
            ShippingFee: o.ShippingFee,
            DiscountAmount: o.DiscountAmount,
            TotalAmount: o.TotalAmount > 0 ? o.TotalAmount : val,
            Items: o.Items?.Select(i => new OrderItemDto(
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
            )).ToList() ?? [],
            CreatedAt: o.CreatedAt,
            UpdatedAt: o.UpdatedAt
        );
    }
}
