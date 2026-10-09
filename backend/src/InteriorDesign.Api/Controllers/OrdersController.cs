using InteriorDesign.Application.Features.Orders;
using InteriorDesign.Domain.Entities;
using InteriorDesign.Domain.Enums;
using InteriorDesign.Infrastructure.Data;
using InteriorDesign.Integration.Common;
using InteriorDesign.Integration.Requests;
using InteriorDesign.Integration.Responses;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InteriorDesign.Api.Controllers;

[Route("api/orders")]
public sealed class OrdersController : ApiControllerBase
{
    private readonly InteriorDbContext _context;

    public OrdersController(InteriorDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Lấy danh sách đơn hàng (hỗ trợ tìm kiếm, lọc theo trạng thái, loại đơn, chi nhánh, không gian)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetOrders(
        [FromQuery] string? search = null,
        [FromQuery] string? status = null,
        [FromQuery] string? orderType = null,
        [FromQuery] string? branch = null,
        [FromQuery] string? spaceType = null,
        [FromQuery] bool includeDeleted = false,
        [FromQuery] int? page = null,
        [FromQuery] int? pageSize = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var query = includeDeleted
                ? _context.Orders.IgnoreQueryFilters().Include(o => o.Items).AsNoTracking().AsQueryable()
                : _context.Orders.Include(o => o.Items).AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim().ToLower();
                query = query.Where(x =>
                    x.OrderCode.ToLower().Contains(s) ||
                    x.CustomerName.ToLower().Contains(s) ||
                    x.CustomerPhone.Contains(s) ||
                    (x.CustomerEmail != null && x.CustomerEmail.ToLower().Contains(s)) ||
                    (x.ProductName != null && x.ProductName.ToLower().Contains(s)) ||
                    (x.ShippingAddress != null && x.ShippingAddress.ToLower().Contains(s)) ||
                    (x.Note != null && x.Note.ToLower().Contains(s)));
            }

            if (!string.IsNullOrWhiteSpace(status) && status != "all")
            {
                var st = status.Trim();
                if (Enum.TryParse<OrderStatus>(st, true, out var parsedStatus))
                {
                    query = query.Where(x => x.Status == parsedStatus);
                }
            }

            if (!string.IsNullOrWhiteSpace(orderType) && orderType != "all")
            {
                var ot = orderType.Trim().ToLower();
                query = query.Where(x => x.OrderType != null && x.OrderType.ToLower() == ot);
            }

            if (!string.IsNullOrWhiteSpace(branch) && branch != "all")
            {
                var br = branch.Trim().ToLower();
                query = query.Where(x => x.Branch != null && x.Branch.ToLower().Contains(br));
            }

            if (!string.IsNullOrWhiteSpace(spaceType) && spaceType != "all")
            {
                var sp = spaceType.Trim().ToLower();
                query = query.Where(x => x.SpaceType != null && x.SpaceType.ToLower() == sp);
            }

            query = query.OrderByDescending(x => x.OrderDate).ThenByDescending(x => x.CreatedAt);

            if (page.HasValue && pageSize.HasValue && pageSize.Value > 0)
            {
                var p = Math.Max(1, page.Value);
                var ps = Math.Max(1, pageSize.Value);
                query = query.Skip((p - 1) * ps).Take(ps);
            }

            var entities = await query.ToListAsync(cancellationToken);
            var dtos = entities.Select(OrderMapper.ToDto).ToList();

            return Ok(ApiResponse<List<OrderDto>>.Ok(dtos));
        }
        catch (OperationCanceledException)
        {
            return StatusCode(499, ApiResponse<List<OrderDto>>.Fail("Yêu cầu đã bị hủy."));
        }
    }

    /// <summary>
    /// Lấy thống kê tổng quan đơn hàng
    /// </summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetOrderStats(CancellationToken cancellationToken)
    {
        var orders = await _context.Orders.AsNoTracking().ToListAsync(cancellationToken);
        var stats = new OrderStatsDto(
            TotalOrders: orders.Count,
            PendingOrders: orders.Count(x => x.Status == OrderStatus.Pending),
            ProcessingOrders: orders.Count(x => x.Status == OrderStatus.Processing),
            CompletedOrders: orders.Count(x => x.Status == OrderStatus.Completed),
            TotalRevenue: orders.Sum(x => x.TotalAmount > 0 ? x.TotalAmount : x.SubTotal),
            TotalDeposit: orders.Sum(x => x.DepositAmount)
        );

        return Ok(ApiResponse<OrderStatsDto>.Ok(stats));
    }

    /// <summary>
    /// Lấy chi tiết đơn hàng theo ID
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetOrderById(Guid id, CancellationToken cancellationToken)
    {
        var order = await _context.Orders
            .Include(o => o.Items)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (order is null)
            return NotFound(ApiResponse<OrderDto>.Fail("Không tìm thấy đơn hàng."));

        return Ok(ApiResponse<OrderDto>.Ok(OrderMapper.ToDto(order)));
    }

    /// <summary>
    /// Tạo mới đơn hàng
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.CustomerName))
            return BadRequest(ApiResponse<OrderDto>.Fail("Tên khách hàng không được để trống."));

        if (string.IsNullOrWhiteSpace(request.CustomerPhone))
            return BadRequest(ApiResponse<OrderDto>.Fail("Số điện thoại không được để trống."));

        var code = request.OrderCode?.Trim().ToUpper();
        if (string.IsNullOrWhiteSpace(code))
        {
            var datePrefix = DateTime.UtcNow.ToString("yyMMdd");
            var count = await _context.Orders.IgnoreQueryFilters().CountAsync(cancellationToken);
            code = $"DH{datePrefix}-{(count + 1).ToString().PadLeft(3, '0')}";
            while (await _context.Orders.IgnoreQueryFilters().AnyAsync(x => x.OrderCode == code, cancellationToken))
            {
                count++;
                code = $"DH{datePrefix}-{(count + 1).ToString().PadLeft(3, '0')}";
            }
        }
        else
        {
            var exists = await _context.Orders.AnyAsync(x => x.OrderCode == code, cancellationToken);
            if (exists)
                return BadRequest(ApiResponse<OrderDto>.Fail($"Mã đơn hàng '{code}' đã tồn tại."));
        }

        var orderStatus = OrderStatus.Pending;
        if (!string.IsNullOrWhiteSpace(request.Status) && Enum.TryParse<OrderStatus>(request.Status, true, out var parsedStatus))
        {
            orderStatus = parsedStatus;
        }

        var paymentStatus = PaymentStatus.Pending;
        if (!string.IsNullOrWhiteSpace(request.PaymentStatus) && Enum.TryParse<PaymentStatus>(request.PaymentStatus, true, out var parsedPaymentStatus))
        {
            paymentStatus = parsedPaymentStatus;
        }

        DateTimeOffset orderDate = DateTimeOffset.UtcNow;
        if (!string.IsNullOrWhiteSpace(request.OrderDate) && DateTimeOffset.TryParse(request.OrderDate, out var parsedOrderDate))
        {
            orderDate = parsedOrderDate;
        }

        DateTimeOffset? deadlineDate = null;
        if (!string.IsNullOrWhiteSpace(request.DeadlineDate) && DateTimeOffset.TryParse(request.DeadlineDate, out var parsedDeadline))
        {
            deadlineDate = parsedDeadline;
        }

        decimal subTotal = request.Value ?? 0;
        var items = new List<OrderItem>();
        if (request.Items != null && request.Items.Count > 0)
        {
            subTotal = 0;
            foreach (var itemReq in request.Items)
            {
                var itemTotal = itemReq.UnitPrice * itemReq.Quantity;
                subTotal += itemTotal;
                items.Add(new OrderItem
                {
                    ProductId = itemReq.ProductId ?? Guid.NewGuid(),
                    ProductName = itemReq.ProductName,
                    ProductSku = itemReq.ProductSku ?? "",
                    ProductImage = itemReq.ProductImage ?? "",
                    Material = itemReq.Material ?? "",
                    Dimensions = itemReq.Dimensions ?? "",
                    UnitPrice = itemReq.UnitPrice,
                    Quantity = Math.Max(1, itemReq.Quantity),
                    TotalPrice = itemTotal
                });
            }
        }

        var totalAmount = subTotal + request.ShippingFee - request.DiscountAmount;
        if (totalAmount < 0) totalAmount = 0;

        decimal depositAmount = request.DepositAmount ?? 0;
        decimal depositPercent = request.DepositPercent ?? 0;
        if (depositAmount <= 0 && depositPercent > 0 && totalAmount > 0)
        {
            depositAmount = Math.Round(totalAmount * (depositPercent / 100m));
        }

        var order = new Order
        {
            OrderCode = code,
            OrderType = request.OrderType ?? "retail",
            CustomerId = request.CustomerId,
            CustomerName = request.CustomerName.Trim(),
            CustomerPhone = request.CustomerPhone.Trim(),
            CustomerEmail = request.CustomerEmail?.Trim() ?? "",
            ShippingAddress = request.ShippingAddress?.Trim() ?? "",
            City = request.City?.Trim() ?? "",
            District = request.District?.Trim() ?? "",
            ProductName = request.ProductName?.Trim(),
            ProductSpec = request.ProductSpec?.Trim(),
            WoodType = request.WoodType?.Trim(),
            SpaceType = request.SpaceType ?? "living",
            Branch = request.Branch?.Trim(),
            Showroom = request.Showroom?.Trim() ?? request.Branch?.Trim(),
            OrderDate = orderDate,
            DeadlineDate = deadlineDate,
            Note = request.Note?.Trim() ?? "",
            PaymentMethod = request.PaymentMethod ?? "VietQR",
            PaymentStatus = paymentStatus,
            Status = orderStatus,
            SubTotal = subTotal,
            DepositPercent = depositPercent,
            DepositAmount = depositAmount,
            DepositNote = request.DepositNote?.Trim(),
            ShippingFee = request.ShippingFee,
            DiscountAmount = request.DiscountAmount,
            TotalAmount = totalAmount,
            Items = items,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        _context.Orders.Add(order);
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse<OrderDto>.Ok(OrderMapper.ToDto(order), "Tạo đơn hàng thành công."));
    }

    /// <summary>
    /// Cập nhật thông tin đơn hàng
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateOrder(Guid id, [FromBody] UpdateOrderRequest request, CancellationToken cancellationToken)
    {
        var order = await _context.Orders.Include(o => o.Items).FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (order is null)
            return NotFound(ApiResponse<OrderDto>.Fail("Không tìm thấy đơn hàng."));

        if (!string.IsNullOrWhiteSpace(request.CustomerName))
            order.CustomerName = request.CustomerName.Trim();

        if (!string.IsNullOrWhiteSpace(request.CustomerPhone))
            order.CustomerPhone = request.CustomerPhone.Trim();

        if (!string.IsNullOrWhiteSpace(request.OrderCode))
        {
            var code = request.OrderCode.Trim().ToUpper();
            if (code != order.OrderCode)
            {
                var exists = await _context.Orders.AnyAsync(x => x.OrderCode == code && x.Id != id, cancellationToken);
                if (exists)
                    return BadRequest(ApiResponse<OrderDto>.Fail($"Mã đơn hàng '{code}' đã tồn tại."));
                order.OrderCode = code;
            }
        }

        order.OrderType = request.OrderType ?? order.OrderType;
        order.CustomerId = request.CustomerId ?? order.CustomerId;
        order.CustomerEmail = request.CustomerEmail?.Trim() ?? order.CustomerEmail;
        order.ShippingAddress = request.ShippingAddress?.Trim() ?? order.ShippingAddress;
        order.City = request.City?.Trim() ?? order.City;
        order.District = request.District?.Trim() ?? order.District;
        order.ProductName = request.ProductName?.Trim() ?? order.ProductName;
        order.ProductSpec = request.ProductSpec?.Trim() ?? order.ProductSpec;
        order.WoodType = request.WoodType?.Trim() ?? order.WoodType;
        order.SpaceType = request.SpaceType ?? order.SpaceType;
        order.Branch = request.Branch?.Trim() ?? order.Branch;
        order.Showroom = request.Showroom?.Trim() ?? order.Showroom;
        order.Note = request.Note?.Trim() ?? order.Note;

        if (!string.IsNullOrWhiteSpace(request.OrderDate) && DateTimeOffset.TryParse(request.OrderDate, out var od))
            order.OrderDate = od;

        if (!string.IsNullOrWhiteSpace(request.DeadlineDate) && DateTimeOffset.TryParse(request.DeadlineDate, out var dl))
            order.DeadlineDate = dl;

        if (!string.IsNullOrWhiteSpace(request.Status) && Enum.TryParse<OrderStatus>(request.Status, true, out var parsedStatus))
            order.Status = parsedStatus;

        if (!string.IsNullOrWhiteSpace(request.PaymentStatus) && Enum.TryParse<PaymentStatus>(request.PaymentStatus, true, out var parsedPaymentStatus))
            order.PaymentStatus = parsedPaymentStatus;

        if (!string.IsNullOrWhiteSpace(request.PaymentMethod))
            order.PaymentMethod = request.PaymentMethod;

        if (request.Value.HasValue)
        {
            order.SubTotal = request.Value.Value;
            order.TotalAmount = request.Value.Value + request.ShippingFee - request.DiscountAmount;
        }

        if (request.DepositPercent.HasValue)
            order.DepositPercent = request.DepositPercent.Value;

        if (request.DepositAmount.HasValue)
            order.DepositAmount = request.DepositAmount.Value;

        order.DepositNote = request.DepositNote?.Trim() ?? order.DepositNote;
        order.ShippingFee = request.ShippingFee;
        order.DiscountAmount = request.DiscountAmount;
        order.UpdatedAt = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return Ok(ApiResponse<OrderDto>.Ok(OrderMapper.ToDto(order), "Cập nhật đơn hàng thành công."));
    }

    /// <summary>
    /// Cập nhật nhanh trạng thái đơn hàng
    /// </summary>
    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateOrderStatus(Guid id, [FromBody] UpdateOrderStatusRequest request, CancellationToken cancellationToken)
    {
        var order = await _context.Orders.Include(o => o.Items).FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (order is null)
            return NotFound(ApiResponse<OrderDto>.Fail("Không tìm thấy đơn hàng."));

        if (!Enum.TryParse<OrderStatus>(request.Status, true, out var parsedStatus))
            return BadRequest(ApiResponse<OrderDto>.Fail("Trạng thái đơn hàng không hợp lệ."));

        order.Status = parsedStatus;
        order.UpdatedAt = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return Ok(ApiResponse<OrderDto>.Ok(OrderMapper.ToDto(order), "Cập nhật trạng thái đơn hàng thành công."));
    }

    /// <summary>
    /// Cập nhật trạng thái hàng loạt
    /// </summary>
    [HttpPost("bulk-status")]
    public async Task<IActionResult> BulkUpdateOrderStatus([FromBody] BulkUpdateOrderStatusRequest request, CancellationToken cancellationToken)
    {
        if (request.OrderIds == null || request.OrderIds.Count == 0)
            return BadRequest(ApiResponse<int>.Fail("Danh sách mã đơn rỗng."));

        if (!Enum.TryParse<OrderStatus>(request.Status, true, out var parsedStatus))
            return BadRequest(ApiResponse<int>.Fail("Trạng thái đơn hàng không hợp lệ."));

        var orders = await _context.Orders.Where(x => request.OrderIds.Contains(x.Id)).ToListAsync(cancellationToken);
        foreach (var order in orders)
        {
            order.Status = parsedStatus;
            order.UpdatedAt = DateTimeOffset.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);
        return Ok(ApiResponse<int>.Ok(orders.Count, $"Đã cập nhật trạng thái {orders.Count} đơn hàng thành công."));
    }

    /// <summary>
    /// Xóa đơn hàng (Soft Delete)
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteOrder(Guid id, CancellationToken cancellationToken)
    {
        var order = await _context.Orders.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (order is null)
            return NotFound(ApiResponse<bool>.Fail("Không tìm thấy đơn hàng."));

        order.IsDeleted = true;
        order.UpdatedAt = DateTimeOffset.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse<bool>.Ok(true, "Xóa đơn hàng thành công."));
    }
}
