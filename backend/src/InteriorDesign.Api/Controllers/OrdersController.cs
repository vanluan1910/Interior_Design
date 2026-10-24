using InteriorDesign.Application.Features.Orders;
using InteriorDesign.Domain.Entities;
using InteriorDesign.Domain.Enums;
using InteriorDesign.Infrastructure.Data;
using InteriorDesign.Integration.Common;
using InteriorDesign.Integration.Requests;
using InteriorDesign.Integration.Responses;
using Microsoft.AspNetCore.Authorization;
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
                if (TryParseOrderStatus(status, out var parsedStatus))
                {
                    query = query.Where(x => x.Status == parsedStatus);
                }
            }

            if (!string.IsNullOrWhiteSpace(orderType) && orderType != "all")
            {
                var ot = orderType.Trim().ToLower();
                query = query.Where(x => x.OrderType != null && x.OrderType.ToLower() == ot);
            }

            if (!string.IsNullOrWhiteSpace(spaceType) && spaceType != "all")
            {
                var sp = spaceType.Trim().ToLower();
                query = query.Where(x => x.SpaceType != null && x.SpaceType.ToLower() == sp);
            }

            query = query.OrderByDescending(x => x.OrderDate).ThenByDescending(x => x.CreatedAt);

            List<Order> entities;
            if (!string.IsNullOrWhiteSpace(branch) && branch != "all")
            {
                var rawEntities = await query.ToListAsync(cancellationToken);
                var allBranches = await _context.Branches.AsNoTracking().Where(b => !b.IsDeleted).ToListAsync(cancellationToken);
                var allWarehouses = await _context.Warehouses.AsNoTracking().Where(w => !w.IsDeleted).ToListAsync(cancellationToken);
                var filtered = rawEntities.Where(x => BranchMatcher.IsBranchMatch(x.Branch, branch, allBranches, allWarehouses) || BranchMatcher.IsBranchMatch(x.Showroom, branch, allBranches, allWarehouses)).ToList();
                if (pageSize.HasValue && pageSize.Value > 0)
                {
                    var p = Math.Max(1, page ?? 1);
                    var ps = Math.Min(1000, pageSize.Value);
                    entities = filtered.Skip((p - 1) * ps).Take(ps).ToList();
                }
                else
                {
                    entities = filtered;
                }
            }
            else
            {
                if (pageSize.HasValue && pageSize.Value > 0)
                {
                    var p = Math.Max(1, page ?? 1);
                    var ps = Math.Min(1000, pageSize.Value);
                    query = query.Skip((p - 1) * ps).Take(ps);
                }
                entities = await query.ToListAsync(cancellationToken);
            }

            var dtos = entities.Select(OrderMapper.ToDto).ToList();
            return Ok(ApiResponse<List<OrderDto>>.Ok(dtos));
        }
        catch (OperationCanceledException)
        {
            return StatusCode(499, ApiResponse<List<OrderDto>>.Fail("Yêu cầu đã bị hủy."));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<List<OrderDto>>.Fail($"Lỗi khi tải danh sách đơn hàng: {ex.Message}"));
        }
    }

    /// <summary>
    /// Lấy thống kê tổng quan đơn hàng
    /// </summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetOrderStats(CancellationToken cancellationToken)
    {
        try
        {
            var total = await _context.Orders.CountAsync(cancellationToken);
            var pending = await _context.Orders.CountAsync(x => x.Status == OrderStatus.Pending, cancellationToken);
            var processing = await _context.Orders.CountAsync(x => x.Status == OrderStatus.Processing, cancellationToken);
            var completed = await _context.Orders.CountAsync(x => x.Status == OrderStatus.Completed, cancellationToken);
            var totalRevenue = await _context.Orders
                .Where(x => x.Status != OrderStatus.Cancelled && x.Status != OrderStatus.Returned && x.Status != OrderStatus.ReturnCompleted)
                .SumAsync(x => (decimal?)(x.TotalAmount > 0 ? x.TotalAmount : x.SubTotal), cancellationToken) ?? 0;
            var totalDeposit = await _context.Orders
                .Where(x => x.Status != OrderStatus.Cancelled && x.Status != OrderStatus.Returned && x.Status != OrderStatus.ReturnCompleted)
                .SumAsync(x => (decimal?)x.DepositAmount, cancellationToken) ?? 0;

            var stats = new OrderStatsDto(
                TotalOrders: total,
                PendingOrders: pending,
                ProcessingOrders: processing,
                CompletedOrders: completed,
                TotalRevenue: totalRevenue,
                TotalDeposit: totalDeposit
            );

            return Ok(ApiResponse<OrderStatsDto>.Ok(stats));
        }
        catch (OperationCanceledException)
        {
            return StatusCode(499, ApiResponse<OrderStatsDto>.Fail("Yêu cầu đã bị hủy."));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<OrderStatsDto>.Fail($"Lỗi khi tải thống kê đơn hàng: {ex.Message}"));
        }
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
    /// Lấy chi tiết đơn hàng theo mã đơn (OrderCode)
    /// </summary>
    [HttpGet("by-code/{code}")]
    public async Task<IActionResult> GetOrderByCode(string code, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(code))
            return BadRequest(ApiResponse<OrderDto>.Fail("Mã đơn hàng không hợp lệ."));

        var order = await _context.Orders
            .Include(o => o.Items)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.OrderCode.ToLower() == code.Trim().ToLower(), cancellationToken);

        if (order is null)
            return NotFound(ApiResponse<OrderDto>.Fail($"Không tìm thấy đơn hàng với mã '{code}'."));

        return Ok(ApiResponse<OrderDto>.Ok(OrderMapper.ToDto(order)));
    }

    /// <summary>
    /// Tạo mới đơn hàng (Checkout / Đặt hàng trực tiếp vào Database thật)
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.CustomerName))
            return BadRequest(ApiResponse<OrderDto>.Fail("Tên khách hàng không được để trống."));

        if (string.IsNullOrWhiteSpace(request.CustomerPhone))
            return BadRequest(ApiResponse<OrderDto>.Fail("Số điện thoại không được để trống."));

        var cleanPhone = request.CustomerPhone.Trim();
        var cleanName = request.CustomerName.Trim();
        var cleanEmail = request.CustomerEmail?.Trim() ?? string.Empty;

        // Sinh mã đơn hàng tự động duy nhất
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
        if (!string.IsNullOrWhiteSpace(request.DeadlineDate))
        {
            if (DateTimeOffset.TryParse(request.DeadlineDate, out var parsedDeadline))
            {
                deadlineDate = parsedDeadline;
            }
            else if (DateTime.TryParseExact(request.DeadlineDate, new[] { "dd/MM/yyyy", "d/M/yyyy", "yyyy-MM-dd" }, System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.None, out var dt))
            {
                deadlineDate = new DateTimeOffset(dt, TimeSpan.Zero);
            }
        }

        // Xác định chi nhánh đặt hàng & kho mặc định chuẩn xác
        var allBranches = await _context.Branches.AsNoTracking().Where(b => !b.IsDeleted).ToListAsync(cancellationToken);
        var allWarehouses = await _context.Warehouses.AsNoTracking().Where(w => !w.IsDeleted).ToListAsync(cancellationToken);

        var defaultBranch = allBranches.FirstOrDefault(b => b.IsDefault)
                         ?? allBranches.FirstOrDefault(b => b.IsHeadquarter)
                         ?? allBranches.FirstOrDefault();

        var defaultWh = (defaultBranch != null
                            ? allWarehouses.FirstOrDefault(w => BranchMatcher.IsBranchMatch(w.Branch ?? w.Name, defaultBranch.Name, allBranches, allWarehouses))
                            : null)
                     ?? allWarehouses.FirstOrDefault(w => w.IsDefault)
                     ?? allWarehouses.FirstOrDefault(w => w.Type == "main" || w.Type == "central" || w.Type == "transit")
                     ?? allWarehouses.FirstOrDefault();

        string defaultTargetName = defaultBranch?.Name
                                 ?? (defaultWh != null && !string.IsNullOrWhiteSpace(defaultWh.Branch) ? defaultWh.Branch : defaultWh?.Name)
                                 ?? "Toàn hệ thống";
        bool isRetailSale = string.Equals(request.OrderType, "retail", StringComparison.OrdinalIgnoreCase) || string.IsNullOrWhiteSpace(request.OrderType);

        var targetBranch = !string.IsNullOrWhiteSpace(request.Branch) ? request.Branch.Trim() : (!string.IsNullOrWhiteSpace(request.Showroom) ? request.Showroom.Trim() : null);

        if (isRetailSale && (string.IsNullOrWhiteSpace(targetBranch) || string.Equals(targetBranch, "default", StringComparison.OrdinalIgnoreCase) || string.Equals(targetBranch, "Mặc định", StringComparison.OrdinalIgnoreCase) || string.Equals(targetBranch, "all", StringComparison.OrdinalIgnoreCase)))
        {
            targetBranch = defaultTargetName;
        }
        else if (!string.IsNullOrWhiteSpace(targetBranch))
        {
            var mb = BranchMatcher.FindMatchingBranch(allBranches, targetBranch, allWarehouses);
            if (mb != null) targetBranch = mb.Name;
        }
        else
        {
            targetBranch = defaultTargetName;
        }

        // Xử lý giỏ hàng & sản phẩm từ database thật
        decimal subTotal = request.Value ?? 0;
        var items = new List<OrderItem>();
        var orderId = Guid.NewGuid();

        if (request.Items != null && request.Items.Count > 0)
        {
            subTotal = 0;
            foreach (var itemReq in request.Items)
            {
                Product? product = null;

                // 1. Tìm theo ProductId nếu có
                if (itemReq.ProductId.HasValue && itemReq.ProductId.Value != Guid.Empty)
                {
                    product = await _context.Products.FirstOrDefaultAsync(p => p.Id == itemReq.ProductId.Value, cancellationToken);
                }

                // 2. Tìm theo SKU nếu chưa thấy
                if (product == null && !string.IsNullOrWhiteSpace(itemReq.ProductSku))
                {
                    product = await _context.Products.FirstOrDefaultAsync(p => p.Sku.ToLower() == itemReq.ProductSku.Trim().ToLower(), cancellationToken);
                }

                // 3. Tìm theo Tên nếu chưa thấy
                if (product == null && !string.IsNullOrWhiteSpace(itemReq.ProductName))
                {
                    product = await _context.Products.FirstOrDefaultAsync(p => p.Name.ToLower() == itemReq.ProductName.Trim().ToLower(), cancellationToken);
                }

                var qty = Math.Max(1, itemReq.Quantity);
                var unitPrice = itemReq.UnitPrice > 0 ? itemReq.UnitPrice : (product?.Price ?? 0);
                var itemTotal = unitPrice * qty;
                subTotal += itemTotal;

                items.Add(new OrderItem
                {
                    Id = Guid.NewGuid(),
                    OrderId = orderId,
                    ProductId = product?.Id ?? itemReq.ProductId ?? Guid.NewGuid(),
                    ProductName = !string.IsNullOrWhiteSpace(itemReq.ProductName) ? itemReq.ProductName : (product?.Name ?? "Sản phẩm nội thất"),
                    ProductSku = !string.IsNullOrWhiteSpace(itemReq.ProductSku) ? itemReq.ProductSku : (product?.Sku ?? string.Empty),
                    ProductImage = !string.IsNullOrWhiteSpace(itemReq.ProductImage) ? itemReq.ProductImage : (product?.MainImageUrl ?? string.Empty),
                    Material = !string.IsNullOrWhiteSpace(itemReq.Material) ? itemReq.Material : (product?.Material ?? "Gỗ tự nhiên cao cấp"),
                    Dimensions = !string.IsNullOrWhiteSpace(itemReq.Dimensions) ? itemReq.Dimensions : (product?.Dimensions ?? string.Empty),
                    UnitPrice = unitPrice,
                    Quantity = qty,
                    TotalPrice = itemTotal
                });
            }
        }
        else if (!string.IsNullOrWhiteSpace(request.ProductName))
        {
            Product? product = null;
            if (!string.IsNullOrWhiteSpace(request.ProductSku))
            {
                product = await _context.Products.FirstOrDefaultAsync(p => p.Sku.ToLower() == request.ProductSku.Trim().ToLower(), cancellationToken);
            }
            if (product == null)
            {
                product = await _context.Products.FirstOrDefaultAsync(p => p.Name.ToLower() == request.ProductName.Trim().ToLower(), cancellationToken);
            }

            var qty = 1;
            var unitPrice = request.Value > 0 ? request.Value.Value : (product?.Price ?? 0);
            var itemTotal = unitPrice * qty;
            subTotal = itemTotal;

            items.Add(new OrderItem
            {
                Id = Guid.NewGuid(),
                OrderId = orderId,
                ProductId = product?.Id ?? Guid.NewGuid(),
                ProductName = request.ProductName.Trim(),
                ProductSku = product?.Sku ?? request.ProductSku ?? string.Empty,
                ProductImage = product?.MainImageUrl ?? string.Empty,
                Material = request.WoodType ?? product?.Material ?? "Gỗ tự nhiên cao cấp",
                Dimensions = product?.Dimensions ?? request.ProductSpec ?? string.Empty,
                UnitPrice = unitPrice,
                Quantity = qty,
                TotalPrice = itemTotal
            });
        }

        // Trừ tồn kho sản phẩm: Khách hàng mua hàng -> ưu tiên trừ kho mặc định trước
        if (orderStatus != OrderStatus.Cancelled && items.Count > 0)
        {
            await DeductOrRestoreStockAsync(targetBranch, items, isRestoring: false, cancellationToken, preferDefaultWarehouse: isRetailSale);
        }

        var totalAmount = subTotal + request.ShippingFee - request.DiscountAmount;
        if (totalAmount < 0) totalAmount = 0;

        decimal depositAmount = request.DepositAmount ?? 0;
        decimal depositPercent = request.DepositPercent ?? 0;
        if (depositAmount <= 0 && depositPercent > 0 && totalAmount > 0)
        {
            depositAmount = Math.Round(totalAmount * (depositPercent / 100m));
        }

        // Tự động liên kết / ghi nhận Khách Hàng vào bảng Customers trong DB thật (Ghi nhận công nợ cho Người Mua / Chủ tài khoản)
        Customer? customer = null;
        if (request.CustomerId.HasValue && request.CustomerId.Value != Guid.Empty)
        {
            customer = await _context.Customers.FirstOrDefaultAsync(c => c.Id == request.CustomerId.Value, cancellationToken);
        }

        if (customer == null && !string.IsNullOrWhiteSpace(cleanPhone))
        {
            customer = await _context.Customers.FirstOrDefaultAsync(c => c.Phone == cleanPhone, cancellationToken);
        }

        if (customer == null && !string.IsNullOrWhiteSpace(cleanEmail))
        {
            customer = await _context.Customers.FirstOrDefaultAsync(c => c.Email == cleanEmail, cancellationToken);
        }

        var orderDebt = paymentStatus == PaymentStatus.Paid ? 0 : Math.Max(0, totalAmount - depositAmount);

        if (customer != null)
        {
            customer.TotalSpent += totalAmount;
            customer.Debt += orderDebt;
            customer.OrderCount += 1;
            customer.LastOrderDate = DateTimeOffset.UtcNow;
            customer.UpdatedAt = DateTimeOffset.UtcNow;
            if (string.IsNullOrWhiteSpace(customer.Branch))
            {
                customer.Branch = targetBranch;
            }
            if (string.IsNullOrWhiteSpace(customer.Address) && !string.IsNullOrWhiteSpace(request.ShippingAddress))
            {
                customer.Address = request.ShippingAddress.Trim();
            }
            if (string.IsNullOrWhiteSpace(customer.City) && !string.IsNullOrWhiteSpace(request.City))
            {
                customer.City = request.City.Trim();
            }
            if (string.IsNullOrWhiteSpace(customer.Email) && !string.IsNullOrWhiteSpace(cleanEmail))
            {
                customer.Email = cleanEmail;
            }
        }
        else
        {
            var custCount = await _context.Customers.IgnoreQueryFilters().CountAsync(cancellationToken);
            var custCode = $"KH-{(custCount + 1).ToString().PadLeft(3, '0')}";
            while (await _context.Customers.IgnoreQueryFilters().AnyAsync(x => x.Code == custCode, cancellationToken))
            {
                custCount++;
                custCode = $"KH-{(custCount + 1).ToString().PadLeft(3, '0')}";
            }

            customer = new Customer
            {
                Id = request.CustomerId.HasValue && request.CustomerId.Value != Guid.Empty ? request.CustomerId.Value : Guid.NewGuid(),
                Code = custCode,
                FullName = cleanName,
                Phone = cleanPhone,
                Email = string.IsNullOrWhiteSpace(cleanEmail) ? null : cleanEmail,
                Address = request.ShippingAddress?.Trim() ?? request.CustomerAddress?.Trim(),
                City = request.City?.Trim(),
                Branch = targetBranch,
                CustomerType = "individual",
                Type = "retail",
                Tier = "standard",
                TotalSpent = totalAmount,
                Debt = orderDebt,
                OrderCount = 1,
                LastOrderDate = DateTimeOffset.UtcNow,
                Status = "active",
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };
            _context.Customers.Add(customer);
        }

        // Tách bạch rõ Người Đặt Hàng (Chủ tài khoản / Công nợ) và Người Nhận Hàng tại công trình
        var recipientName = !string.IsNullOrWhiteSpace(request.RecipientName) ? request.RecipientName.Trim() : cleanName;
        var recipientPhone = !string.IsNullOrWhiteSpace(request.RecipientPhone) ? request.RecipientPhone.Trim() : cleanPhone;

        var finalOrderNote = request.Note?.Trim() ?? string.Empty;
        if (!string.Equals(recipientName, cleanName, StringComparison.OrdinalIgnoreCase) ||
            !string.Equals(recipientPhone.Replace(" ", ""), cleanPhone.Replace(" ", ""), StringComparison.OrdinalIgnoreCase))
        {
            var handoverTag = $"[Người nhận hàng: {recipientName} - SĐT: {recipientPhone}]";
            if (!finalOrderNote.Contains(handoverTag, StringComparison.OrdinalIgnoreCase))
            {
                finalOrderNote = string.IsNullOrWhiteSpace(finalOrderNote) ? handoverTag : $"{handoverTag} {finalOrderNote}";
            }
        }

        var order = new Order
        {
            Id = orderId,
            OrderCode = code,
            OrderType = request.OrderType ?? "retail",
            CustomerId = customer.Id,
            CustomerName = cleanName,
            CustomerPhone = cleanPhone,
            CustomerEmail = cleanEmail,
            RecipientName = recipientName,
            RecipientPhone = recipientPhone,
            ShippingAddress = request.ShippingAddress?.Trim() ?? request.CustomerAddress?.Trim() ?? string.Empty,
            City = request.City?.Trim() ?? string.Empty,
            District = request.District?.Trim() ?? string.Empty,
            ProductName = request.ProductName?.Trim() ?? (items.FirstOrDefault()?.ProductName),
            ProductSpec = request.ProductSpec?.Trim(),
            WoodType = request.WoodType?.Trim() ?? (items.FirstOrDefault()?.Material),
            SpaceType = request.SpaceType ?? "living",
            Branch = targetBranch,
            Showroom = targetBranch,
            OrderDate = orderDate,
            DeadlineDate = deadlineDate,
            Note = finalOrderNote,
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

        if (!string.IsNullOrWhiteSpace(request.RecipientName))
            order.RecipientName = request.RecipientName.Trim();

        if (!string.IsNullOrWhiteSpace(request.RecipientPhone))
            order.RecipientPhone = request.RecipientPhone.Trim();

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

        if (!string.IsNullOrWhiteSpace(request.DeadlineDate))
        {
            if (DateTimeOffset.TryParse(request.DeadlineDate, out var dl))
            {
                order.DeadlineDate = dl;
            }
            else if (DateTime.TryParseExact(request.DeadlineDate, new[] { "dd/MM/yyyy", "d/M/yyyy", "yyyy-MM-dd" }, System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.None, out var dt))
            {
                order.DeadlineDate = new DateTimeOffset(dt, TimeSpan.Zero);
            }
        }

        var oldStatus = order.Status;
        if (!string.IsNullOrWhiteSpace(request.Status) && TryParseOrderStatus(request.Status, out var parsedStatus))
        {
            order.Status = parsedStatus;
            bool wasRestored = oldStatus == OrderStatus.Cancelled || oldStatus == OrderStatus.Returned || oldStatus == OrderStatus.ReturnCompleted;
            bool isRestored = parsedStatus == OrderStatus.Cancelled || parsedStatus == OrderStatus.Returned || parsedStatus == OrderStatus.ReturnCompleted;
            if (!wasRestored && isRestored)
            {
                await DeductOrRestoreStockAsync(order.Branch ?? order.Showroom, order.Items.ToList(), isRestoring: true, cancellationToken);
            }
            else if (wasRestored && !isRestored)
            {
                await DeductOrRestoreStockAsync(order.Branch ?? order.Showroom, order.Items.ToList(), isRestoring: false, cancellationToken);
            }

            if ((parsedStatus == OrderStatus.Returned || parsedStatus == OrderStatus.ReturnCompleted) && order.PaymentStatus != PaymentStatus.Refunded)
            {
                order.PaymentStatus = PaymentStatus.Refunded;
            }
        }

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

        if (!TryParseOrderStatus(request.Status, out var parsedStatus))
            return BadRequest(ApiResponse<OrderDto>.Fail("Trạng thái đơn hàng không hợp lệ."));

        var oldStatus = order.Status;
        order.Status = parsedStatus;
        if (!string.IsNullOrWhiteSpace(request.Note))
        {
            order.Note = string.IsNullOrWhiteSpace(order.Note) ? request.Note : $"{order.Note}; {request.Note}";
        }
        order.UpdatedAt = DateTimeOffset.UtcNow;

        bool wasRestored = oldStatus == OrderStatus.Cancelled || oldStatus == OrderStatus.Returned || oldStatus == OrderStatus.ReturnCompleted;
        bool isRestored = parsedStatus == OrderStatus.Cancelled || parsedStatus == OrderStatus.Returned || parsedStatus == OrderStatus.ReturnCompleted;
        if (!wasRestored && isRestored)
        {
            await DeductOrRestoreStockAsync(order.Branch ?? order.Showroom, order.Items.ToList(), isRestoring: true, cancellationToken, preferDefaultWarehouse: string.Equals(order.OrderType, "retail", StringComparison.OrdinalIgnoreCase));
        }
        else if (wasRestored && !isRestored)
        {
            await DeductOrRestoreStockAsync(order.Branch ?? order.Showroom, order.Items.ToList(), isRestoring: false, cancellationToken, preferDefaultWarehouse: string.Equals(order.OrderType, "retail", StringComparison.OrdinalIgnoreCase));
        }

        if ((parsedStatus == OrderStatus.Returned || parsedStatus == OrderStatus.ReturnCompleted) && order.PaymentStatus != PaymentStatus.Refunded)
        {
            order.PaymentStatus = PaymentStatus.Refunded;
        }

        await _context.SaveChangesAsync(cancellationToken);
        return Ok(ApiResponse<OrderDto>.Ok(OrderMapper.ToDto(order), "Cập nhật trạng thái đơn hàng thành công."));
    }

    /// <summary>
    /// Khách hàng gửi yêu cầu đổi trả / hoàn hàng
    /// </summary>
    [HttpPost("{id:guid}/request-return")]
    public async Task<IActionResult> RequestOrderReturn(Guid id, [FromBody] RequestOrderReturnRequest request, CancellationToken cancellationToken)
    {
        var order = await _context.Orders.Include(o => o.Items).FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (order is null)
            return NotFound(ApiResponse<OrderDto>.Fail("Không tìm thấy đơn hàng."));

        var oldStatus = order.Status;
        order.Status = OrderStatus.Returned;
        var returnNote = $"[Yêu cầu hoàn trả - {DateTimeOffset.UtcNow.ToLocalTime():dd/MM/yyyy HH:mm}] Lý do: {request.Reason}";
        if (!string.IsNullOrWhiteSpace(request.DesiredResolution))
        {
            returnNote += $". Mong muốn: {request.DesiredResolution}";
        }
        if (!string.IsNullOrWhiteSpace(request.Note))
        {
            returnNote += $". Chi tiết: {request.Note}";
        }
        if (request.Images != null && request.Images.Count > 0)
        {
            returnNote += $". Đính kèm {request.Images.Count} ảnh thực tế";
        }
        order.Note = string.IsNullOrWhiteSpace(order.Note) ? returnNote : $"{order.Note}\n{returnNote}";
        order.UpdatedAt = DateTimeOffset.UtcNow;

        bool wasRestored = oldStatus == OrderStatus.Cancelled || oldStatus == OrderStatus.Returned;
        if (!wasRestored)
        {
            await DeductOrRestoreStockAsync(order.Branch ?? order.Showroom, order.Items.ToList(), isRestoring: true, cancellationToken, preferDefaultWarehouse: string.Equals(order.OrderType, "retail", StringComparison.OrdinalIgnoreCase));
        }

        if (order.PaymentStatus != PaymentStatus.Refunded)
        {
            order.PaymentStatus = PaymentStatus.Refunded;
        }

        await _context.SaveChangesAsync(cancellationToken);
        return Ok(ApiResponse<OrderDto>.Ok(OrderMapper.ToDto(order), "Đã tiếp nhận yêu cầu hoàn hàng của quý khách thành công."));
    }

    /// <summary>
    /// Cập nhật trạng thái thanh toán
    /// </summary>
    [HttpPatch("{id:guid}/payment-status")]
    public async Task<IActionResult> UpdatePaymentStatus(Guid id, [FromBody] UpdatePaymentStatusRequest request, CancellationToken cancellationToken)
    {
        var order = await _context.Orders.Include(o => o.Items).FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (order is null)
            return NotFound(ApiResponse<OrderDto>.Fail("Không tìm thấy đơn hàng."));

        if (!Enum.TryParse<PaymentStatus>(request.PaymentStatus, true, out var parsedPaymentStatus))
            return BadRequest(ApiResponse<OrderDto>.Fail("Trạng thái thanh toán không hợp lệ."));

        order.PaymentStatus = parsedPaymentStatus;
        if (!string.IsNullOrWhiteSpace(request.PaymentMethod))
        {
            order.PaymentMethod = request.PaymentMethod;
        }
        if (request.PaidAmount.HasValue && request.PaidAmount.Value > 0)
        {
            order.DepositAmount = request.PaidAmount.Value;
        }
        order.UpdatedAt = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return Ok(ApiResponse<OrderDto>.Ok(OrderMapper.ToDto(order), "Cập nhật trạng thái thanh toán thành công."));
    }

    /// <summary>
    /// Cập nhật trạng thái hàng loạt
    /// </summary>
    [HttpPost("bulk-status")]
    public async Task<IActionResult> BulkUpdateOrderStatus([FromBody] BulkUpdateOrderStatusRequest request, CancellationToken cancellationToken)
    {
        if (request.OrderIds == null || request.OrderIds.Count == 0)
            return BadRequest(ApiResponse<int>.Fail("Danh sách mã đơn rỗng."));

        if (!TryParseOrderStatus(request.Status, out var parsedStatus))
            return BadRequest(ApiResponse<int>.Fail("Trạng thái đơn hàng không hợp lệ."));

        var orders = await _context.Orders.Include(o => o.Items).Where(x => request.OrderIds.Contains(x.Id)).ToListAsync(cancellationToken);
        foreach (var order in orders)
        {
            var oldStatus = order.Status;
            order.Status = parsedStatus;
            if (!string.IsNullOrWhiteSpace(request.Note))
            {
                order.Note = string.IsNullOrWhiteSpace(order.Note) ? request.Note : $"{order.Note}; {request.Note}";
            }
            order.UpdatedAt = DateTimeOffset.UtcNow;

            bool wasRestored = oldStatus == OrderStatus.Cancelled || oldStatus == OrderStatus.Returned || oldStatus == OrderStatus.ReturnCompleted;
            bool isRestored = parsedStatus == OrderStatus.Cancelled || parsedStatus == OrderStatus.Returned || parsedStatus == OrderStatus.ReturnCompleted;
            if (!wasRestored && isRestored)
            {
                await DeductOrRestoreStockAsync(order.Branch ?? order.Showroom, order.Items.ToList(), isRestoring: true, cancellationToken, preferDefaultWarehouse: string.Equals(order.OrderType, "retail", StringComparison.OrdinalIgnoreCase));
            }
            else if (wasRestored && !isRestored)
            {
                await DeductOrRestoreStockAsync(order.Branch ?? order.Showroom, order.Items.ToList(), isRestoring: false, cancellationToken, preferDefaultWarehouse: string.Equals(order.OrderType, "retail", StringComparison.OrdinalIgnoreCase));
            }

            if ((parsedStatus == OrderStatus.Returned || parsedStatus == OrderStatus.ReturnCompleted) && order.PaymentStatus != PaymentStatus.Refunded)
            {
                order.PaymentStatus = PaymentStatus.Refunded;
            }
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
        var order = await _context.Orders.Include(o => o.Items).FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (order is null)
            return NotFound(ApiResponse<bool>.Fail("Không tìm thấy đơn hàng."));

        if (!order.IsDeleted && order.Status != OrderStatus.Cancelled)
        {
            await DeductOrRestoreStockAsync(order.Branch ?? order.Showroom, order.Items.ToList(), isRestoring: true, cancellationToken, preferDefaultWarehouse: string.Equals(order.OrderType, "retail", StringComparison.OrdinalIgnoreCase));
        }

        order.IsDeleted = true;
        order.UpdatedAt = DateTimeOffset.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse<bool>.Ok(true, "Xóa đơn hàng thành công."));
    }

    private async Task DeductOrRestoreStockAsync(
        string? targetBranch,
        List<OrderItem> items,
        bool isRestoring,
        CancellationToken cancellationToken,
        bool preferDefaultWarehouse = false)
    {
        if (items == null || items.Count == 0) return;

        var allBranches = await _context.Branches.AsNoTracking().Where(b => !b.IsDeleted).ToListAsync(cancellationToken);
        var allWarehouses = await _context.Warehouses.AsNoTracking().Where(w => !w.IsDeleted).ToListAsync(cancellationToken);

        // 1. Xác định kho mặc định và chi nhánh mặc định
        var defaultWh = allWarehouses.FirstOrDefault(w => w.IsDefault)
                     ?? allWarehouses.FirstOrDefault(w => w.Type == "main" || w.Type == "central" || w.Type == "transit")
                     ?? allWarehouses.FirstOrDefault();

        var defaultBranch = allBranches.FirstOrDefault(b => b.IsDefault)
                         ?? allBranches.FirstOrDefault(b => b.IsHeadquarter)
                         ?? (defaultWh != null && !string.IsNullOrWhiteSpace(defaultWh.Branch)
                                 ? BranchMatcher.FindMatchingBranch(allBranches, defaultWh.Branch, allWarehouses)
                                 : null)
                         ?? allBranches.FirstOrDefault();

        string defaultTargetName = (defaultWh != null && defaultWh.IsDefault ? (defaultWh.Name ?? defaultWh.Branch) : null)
                                 ?? defaultBranch?.Name
                                 ?? defaultWh?.Name
                                 ?? defaultWh?.Branch
                                 ?? "Kho Mặc Định";

        string branchName = targetBranch?.Trim() ?? string.Empty;
        if (preferDefaultWarehouse || string.IsNullOrWhiteSpace(branchName) || string.Equals(branchName, "default", StringComparison.OrdinalIgnoreCase) || string.Equals(branchName, "Mặc định", StringComparison.OrdinalIgnoreCase))
        {
            branchName = defaultTargetName;
        }
        else
        {
            var matchedBranch = BranchMatcher.FindMatchingBranch(allBranches, branchName, allWarehouses);
            if (matchedBranch != null)
            {
                branchName = matchedBranch.Name;
            }
        }

        foreach (var item in items)
        {
            Product? product = null;
            if (item.ProductId != Guid.Empty)
            {
                product = await _context.Products.FirstOrDefaultAsync(p => p.Id == item.ProductId, cancellationToken);
            }
            if (product == null && !string.IsNullOrWhiteSpace(item.ProductSku))
            {
                product = await _context.Products.FirstOrDefaultAsync(p => p.Sku.ToLower() == item.ProductSku.Trim().ToLower(), cancellationToken);
            }
            if (product == null && !string.IsNullOrWhiteSpace(item.ProductName))
            {
                product = await _context.Products.FirstOrDefaultAsync(p => p.Name.ToLower() == item.ProductName.Trim().ToLower(), cancellationToken);
            }

            if (product == null) continue;

            var qty = Math.Max(1, item.Quantity);
            var branchStocks = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

            if (!string.IsNullOrWhiteSpace(product.BranchStocksJson) && product.BranchStocksJson != "{}")
            {
                try
                {
                    var existing = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, int>>(product.BranchStocksJson);
                    if (existing != null)
                    {
                        foreach (var kvp in existing) branchStocks[kvp.Key] = kvp.Value;
                    }
                }
                catch { }
            }

            // Tìm key đại diện cho Kho / Chi nhánh Mặc Định trong danh sách tồn kho của sản phẩm
            string? primaryDefaultKey = null;

            // a. Ưu tiên cao nhất: Khớp chính xác với Kho Mặc Định (được cấu hình IsDefault = true)
            if (defaultWh != null && defaultWh.IsDefault)
            {
                primaryDefaultKey = branchStocks.Keys.FirstOrDefault(k => string.Equals(k, defaultWh.Name, StringComparison.OrdinalIgnoreCase))
                                 ?? (!string.IsNullOrWhiteSpace(defaultWh.Branch) ? branchStocks.Keys.FirstOrDefault(k => string.Equals(k, defaultWh.Branch, StringComparison.OrdinalIgnoreCase)) : null)
                                 ?? branchStocks.Keys.FirstOrDefault(k => BranchMatcher.IsBranchMatch(k, defaultWh.Name, allBranches, allWarehouses))
                                 ?? (!string.IsNullOrWhiteSpace(defaultWh.Branch) ? branchStocks.Keys.FirstOrDefault(k => BranchMatcher.IsBranchMatch(k, defaultWh.Branch, allBranches, allWarehouses)) : null);
            }

            // b. Khớp với Chi nhánh Mặc Định (defaultBranch)
            if (primaryDefaultKey == null && defaultBranch != null)
            {
                primaryDefaultKey = branchStocks.Keys.FirstOrDefault(k => string.Equals(k, defaultBranch.Name, StringComparison.OrdinalIgnoreCase))
                                 ?? branchStocks.Keys.FirstOrDefault(k => BranchMatcher.IsBranchMatch(k, defaultBranch.Name, allBranches, allWarehouses));
            }

            // c. Thử match branchName chỉ định riêng
            if (primaryDefaultKey == null && !string.IsNullOrWhiteSpace(branchName))
            {
                primaryDefaultKey = branchStocks.Keys.FirstOrDefault(k => string.Equals(k, branchName, StringComparison.OrdinalIgnoreCase))
                                 ?? branchStocks.Keys.FirstOrDefault(k => BranchMatcher.IsBranchMatch(k, branchName, allBranches, allWarehouses));
            }

            // d. Khớp với defaultWh thông thường
            if (primaryDefaultKey == null && defaultWh != null)
            {
                primaryDefaultKey = branchStocks.Keys.FirstOrDefault(k => string.Equals(k, defaultWh.Name, StringComparison.OrdinalIgnoreCase))
                                 ?? (!string.IsNullOrWhiteSpace(defaultWh.Branch) ? branchStocks.Keys.FirstOrDefault(k => string.Equals(k, defaultWh.Branch, StringComparison.OrdinalIgnoreCase)) : null)
                                 ?? branchStocks.Keys.FirstOrDefault(k => string.Equals(k, defaultWh.Code, StringComparison.OrdinalIgnoreCase))
                                 ?? branchStocks.Keys.FirstOrDefault(k => BranchMatcher.IsBranchMatch(k, defaultWh.Name, allBranches, allWarehouses))
                                 ?? (!string.IsNullOrWhiteSpace(defaultWh.Branch) ? branchStocks.Keys.FirstOrDefault(k => BranchMatcher.IsBranchMatch(k, defaultWh.Branch, allBranches, allWarehouses)) : null);
            }

            // d. Tìm kho có chứa từ khóa Mặc Định, Tổng Kho, Trụ Sở, Phú Quốc
            if (primaryDefaultKey == null)
            {
                primaryDefaultKey = branchStocks.Keys.FirstOrDefault(k =>
                    k.Contains("Mặc Định", StringComparison.OrdinalIgnoreCase) ||
                    k.Contains("Tổng Kho", StringComparison.OrdinalIgnoreCase) ||
                    k.Contains("Trụ Sở", StringComparison.OrdinalIgnoreCase) ||
                    k.Contains("Phú Quốc", StringComparison.OrdinalIgnoreCase));
            }

            // e. Nếu trong danh sách tồn kho chưa có key cho kho mặc định, tạo key trực tiếp cho kho mặc định
            if (primaryDefaultKey == null)
            {
                primaryDefaultKey = defaultBranch?.Name ?? defaultWh?.Name ?? defaultWh?.Branch ?? defaultTargetName;
                if (!branchStocks.ContainsKey(primaryDefaultKey))
                {
                    if (branchStocks.Count == 0 && product.InStock > 0)
                    {
                        branchStocks[primaryDefaultKey] = product.InStock;
                    }
                    else
                    {
                        branchStocks[primaryDefaultKey] = 0;
                    }
                }
            }

            if (isRestoring)
            {
                // Hoàn lại số lượng đã bán về kho mặc định
                if (!branchStocks.ContainsKey(primaryDefaultKey))
                {
                    branchStocks[primaryDefaultKey] = 0;
                }
                branchStocks[primaryDefaultKey] += qty;
            }
            else
            {
                // Bán hàng: ƯU TIÊN TRỪ KHO MẶC ĐỊNH TRƯỚC
                int remainingToDeduct = qty;

                // 1. Trừ tại kho mặc định trước
                if (branchStocks.TryGetValue(primaryDefaultKey, out var defStock) && defStock > 0)
                {
                    int deduct = Math.Min(remainingToDeduct, defStock);
                    branchStocks[primaryDefaultKey] = defStock - deduct;
                    remainingToDeduct -= deduct;
                }

                // 2. Nếu kho mặc định chưa đủ số lượng, trừ tiếp từ các kho/chi nhánh khác có tồn > 0
                if (remainingToDeduct > 0)
                {
                    var otherKeysWithStock = branchStocks
                        .Where(kv => !string.Equals(kv.Key, primaryDefaultKey, StringComparison.OrdinalIgnoreCase) && kv.Value > 0)
                        .OrderByDescending(kv => kv.Value)
                        .Select(kv => kv.Key)
                        .ToList();

                    foreach (var key in otherKeysWithStock)
                    {
                        if (remainingToDeduct <= 0) break;
                        int curStock = branchStocks[key];
                        int deduct = Math.Min(remainingToDeduct, curStock);
                        branchStocks[key] = curStock - deduct;
                        remainingToDeduct -= deduct;
                    }
                }

                // 3. Nếu các kho đều hết tồn mà vẫn còn số lượng cần trừ (bán âm / đặt trước)
                if (remainingToDeduct > 0)
                {
                    if (!branchStocks.ContainsKey(primaryDefaultKey))
                    {
                        branchStocks[primaryDefaultKey] = 0;
                    }
                    branchStocks[primaryDefaultKey] -= remainingToDeduct;
                    remainingToDeduct = 0;
                }
            }

            var jsonOptions = new System.Text.Json.JsonSerializerOptions { Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping };
            product.BranchStocksJson = System.Text.Json.JsonSerializer.Serialize(branchStocks, jsonOptions);
            product.InStock = branchStocks.Values.Sum();
            product.UpdatedAt = DateTimeOffset.UtcNow;
        }
    }

    private static bool TryParseOrderStatus(string? statusStr, out OrderStatus status)
    {
        status = OrderStatus.Pending;
        if (string.IsNullOrWhiteSpace(statusStr)) return false;
        var s = statusStr.Trim();
        if (string.Equals(s, "returned_success", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(s, "return_completed", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(s, "returncompleted", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(s, "returnedsuccess", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(s, "refunded", StringComparison.OrdinalIgnoreCase))
        {
            status = OrderStatus.ReturnCompleted;
            return true;
        }
        return Enum.TryParse<OrderStatus>(s, true, out status);
    }
}
