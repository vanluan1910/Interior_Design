using InteriorDesign.Domain.Entities;
using InteriorDesign.Infrastructure.Data;
using InteriorDesign.Integration.Common;
using InteriorDesign.Integration.Requests;
using InteriorDesign.Integration.Responses;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InteriorDesign.Api.Controllers;

[Route("api/customers")]
public sealed class CustomersController : ApiControllerBase
{
    private readonly InteriorDbContext _context;

    public CustomersController(InteriorDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Lấy danh sách khách hàng (hỗ trợ tìm kiếm, lọc theo trạng thái, công nợ, chi nhánh, loại khách)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetCustomers(
        [FromQuery] string? search = null,
        [FromQuery] string? status = null,
        [FromQuery] string? debtFilter = null,
        [FromQuery] string? branch = null,
        [FromQuery] string? customerType = null,
        [FromQuery] bool includeDeleted = false,
        [FromQuery] int? page = null,
        [FromQuery] int? pageSize = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var query = includeDeleted
                ? _context.Customers.IgnoreQueryFilters().AsNoTracking().AsQueryable()
                : _context.Customers.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim().ToLower();
                query = query.Where(x =>
                    x.FullName.ToLower().Contains(s) ||
                    x.Code.ToLower().Contains(s) ||
                    x.Phone.Contains(s) ||
                    (x.Phone2 != null && x.Phone2.Contains(s)) ||
                    (x.Email != null && x.Email.ToLower().Contains(s)) ||
                    (x.Address != null && x.Address.ToLower().Contains(s)) ||
                    (x.CompanyName != null && x.CompanyName.ToLower().Contains(s)) ||
                    (x.BuyerName != null && x.BuyerName.ToLower().Contains(s)) ||
                    (x.TaxId != null && x.TaxId.Contains(s)));
            }

            if (!string.IsNullOrWhiteSpace(status) && status != "all")
            {
                var st = status.Trim().ToLower();
                query = query.Where(x => x.Status.ToLower() == st);
            }

            if (!string.IsNullOrWhiteSpace(debtFilter) && debtFilter != "all")
            {
                if (debtFilter == "has_debt")
                    query = query.Where(x => x.Debt > 0);
                else if (debtFilter == "no_debt")
                    query = query.Where(x => x.Debt <= 0);
            }

            if (!string.IsNullOrWhiteSpace(branch) && branch != "all")
            {
                var br = branch.Trim().ToLower();
                query = query.Where(x => x.Branch != null && x.Branch.ToLower().Contains(br));
            }

            if (!string.IsNullOrWhiteSpace(customerType) && customerType != "all")
            {
                var ct = customerType.Trim().ToLower();
                query = query.Where(x => x.CustomerType != null && x.CustomerType.ToLower() == ct);
            }

            query = query.OrderByDescending(x => x.CreatedAt);

            if (page.HasValue && pageSize.HasValue && pageSize.Value > 0)
            {
                var p = Math.Max(1, page.Value);
                var ps = Math.Max(1, pageSize.Value);
                query = query.Skip((p - 1) * ps).Take(ps);
            }

            var entities = await query.ToListAsync(cancellationToken);
            var dtos = entities.Select(MapToDto).ToList();

            return Ok(ApiResponse<List<CustomerDto>>.Ok(dtos));
        }
        catch (OperationCanceledException)
        {
            return StatusCode(499, ApiResponse<List<CustomerDto>>.Fail("Yêu cầu đã bị hủy."));
        }
    }

    /// <summary>
    /// Lấy thống kê tổng quan khách hàng
    /// </summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetCustomerStats(CancellationToken cancellationToken)
    {
        var customers = await _context.Customers.AsNoTracking().ToListAsync(cancellationToken);
        var stats = new CustomerStatsDto(
            TotalCustomers: customers.Count,
            ActiveCustomers: customers.Count(x => x.Status == "active"),
            IndivualCount: customers.Count(x => x.CustomerType == "individual" || string.IsNullOrWhiteSpace(x.CustomerType)),
            OrganizationCount: customers.Count(x => x.CustomerType == "organization"),
            TotalDebt: customers.Sum(x => x.Debt),
            TotalRevenue: customers.Sum(x => x.TotalSpent)
        );

        return Ok(ApiResponse<CustomerStatsDto>.Ok(stats));
    }

    /// <summary>
    /// Lấy chi tiết khách hàng theo ID
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetCustomerById(Guid id, CancellationToken cancellationToken)
    {
        var customer = await _context.Customers.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (customer is null)
            return NotFound(ApiResponse<CustomerDto>.Fail("Không tìm thấy khách hàng."));

        return Ok(ApiResponse<CustomerDto>.Ok(MapToDto(customer)));
    }

    /// <summary>
    /// Thêm mới khách hàng
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateCustomer([FromBody] CreateCustomerRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(ApiResponse<CustomerDto>.Fail("Tên khách hàng không được để trống."));

        if (string.IsNullOrWhiteSpace(request.Phone))
            return BadRequest(ApiResponse<CustomerDto>.Fail("Số điện thoại không được để trống."));

        var cleanPhone = request.Phone.Trim();
        var code = request.Code?.Trim().ToUpper();

        if (string.IsNullOrWhiteSpace(code))
        {
            var count = await _context.Customers.IgnoreQueryFilters().CountAsync(cancellationToken);
            code = $"KH-{(count + 1).ToString().PadLeft(3, '0')}";
            while (await _context.Customers.IgnoreQueryFilters().AnyAsync(x => x.Code == code, cancellationToken))
            {
                count++;
                code = $"KH-{(count + 1).ToString().PadLeft(3, '0')}";
            }
        }
        else
        {
            var exists = await _context.Customers.AnyAsync(x => x.Code == code, cancellationToken);
            if (exists)
                return BadRequest(ApiResponse<CustomerDto>.Fail($"Mã khách hàng '{code}' đã tồn tại."));
        }

        DateTimeOffset? parsedBirthday = null;
        if (!string.IsNullOrWhiteSpace(request.Birthday) && DateTimeOffset.TryParse(request.Birthday, out var bday))
        {
            parsedBirthday = bday;
        }

        var customer = new Customer
        {
            Code = code,
            FullName = request.Name.Trim(),
            Phone = cleanPhone,
            Phone2 = request.Phone2?.Trim(),
            Email = request.Email?.Trim(),
            Facebook = request.Facebook?.Trim(),
            Zalo = request.Zalo?.Trim(),
            Gender = request.Gender,
            Birthday = parsedBirthday,
            Address = request.Address?.Trim(),
            City = request.City?.Trim(),
            Branch = request.Branch?.Trim(),
            CustomerType = request.CustomerType ?? "individual",
            Type = request.Type ?? "retail",
            Tier = request.Tier ?? "standard",
            SalesRep = request.SalesRep?.Trim(),
            Notes = request.Notes?.Trim(),
            CompanyName = request.CompanyName?.Trim(),
            BuyerName = request.BuyerName?.Trim(),
            TaxId = request.TaxId?.Trim(),
            InvoiceAddress = request.InvoiceAddress?.Trim() ?? request.Address?.Trim(),
            IdNumber = request.IdNumber?.Trim(),
            Passport = request.Passport?.Trim(),
            BankName = request.BankName?.Trim(),
            BankAccount = request.BankAccount?.Trim(),
            PreferredStyle = request.PreferredStyle?.Trim(),
            ProjectLocation = request.ProjectLocation?.Trim(),
            Status = request.Status ?? "active",
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        _context.Customers.Add(customer);
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse<CustomerDto>.Ok(MapToDto(customer), "Thêm khách hàng thành công."));
    }

    /// <summary>
    /// Cập nhật thông tin khách hàng
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateCustomer(Guid id, [FromBody] UpdateCustomerRequest request, CancellationToken cancellationToken)
    {
        var customer = await _context.Customers.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (customer is null)
            return NotFound(ApiResponse<CustomerDto>.Fail("Không tìm thấy khách hàng."));

        if (!string.IsNullOrWhiteSpace(request.Name))
            customer.FullName = request.Name.Trim();

        if (!string.IsNullOrWhiteSpace(request.Phone))
            customer.Phone = request.Phone.Trim();

        if (!string.IsNullOrWhiteSpace(request.Code))
        {
            var code = request.Code.Trim().ToUpper();
            if (code != customer.Code)
            {
                var exists = await _context.Customers.AnyAsync(x => x.Code == code && x.Id != id, cancellationToken);
                if (exists)
                    return BadRequest(ApiResponse<CustomerDto>.Fail($"Mã khách hàng '{code}' đã tồn tại."));
                customer.Code = code;
            }
        }

        customer.Phone2 = request.Phone2?.Trim() ?? customer.Phone2;
        customer.Email = request.Email?.Trim() ?? customer.Email;
        customer.Facebook = request.Facebook?.Trim() ?? customer.Facebook;
        customer.Zalo = request.Zalo?.Trim() ?? customer.Zalo;
        customer.Gender = request.Gender ?? customer.Gender;

        if (!string.IsNullOrWhiteSpace(request.Birthday) && DateTimeOffset.TryParse(request.Birthday, out var bday))
        {
            customer.Birthday = bday;
        }

        customer.Address = request.Address?.Trim() ?? customer.Address;
        customer.City = request.City?.Trim() ?? customer.City;
        customer.Branch = request.Branch?.Trim() ?? customer.Branch;
        customer.CustomerType = request.CustomerType ?? customer.CustomerType;
        customer.Type = request.Type ?? customer.Type;
        customer.Tier = request.Tier ?? customer.Tier;
        customer.SalesRep = request.SalesRep?.Trim() ?? customer.SalesRep;
        customer.Notes = request.Notes?.Trim() ?? customer.Notes;
        customer.CompanyName = request.CompanyName?.Trim() ?? customer.CompanyName;
        customer.BuyerName = request.BuyerName?.Trim() ?? customer.BuyerName;
        customer.TaxId = request.TaxId?.Trim() ?? customer.TaxId;
        customer.InvoiceAddress = request.InvoiceAddress?.Trim() ?? customer.InvoiceAddress;
        customer.IdNumber = request.IdNumber?.Trim() ?? customer.IdNumber;
        customer.Passport = request.Passport?.Trim() ?? customer.Passport;
        customer.BankName = request.BankName?.Trim() ?? customer.BankName;
        customer.BankAccount = request.BankAccount?.Trim() ?? customer.BankAccount;
        customer.PreferredStyle = request.PreferredStyle?.Trim() ?? customer.PreferredStyle;
        customer.ProjectLocation = request.ProjectLocation?.Trim() ?? customer.ProjectLocation;

        if (!string.IsNullOrWhiteSpace(request.Status))
            customer.Status = request.Status;

        customer.UpdatedAt = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return Ok(ApiResponse<CustomerDto>.Ok(MapToDto(customer), "Cập nhật thông tin khách hàng thành công."));
    }

    /// <summary>
    /// Xóa khách hàng (Soft Delete)
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteCustomer(Guid id, CancellationToken cancellationToken)
    {
        var customer = await _context.Customers.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (customer is null)
            return NotFound(ApiResponse<bool>.Fail("Không tìm thấy khách hàng."));

        customer.IsDeleted = true;
        customer.UpdatedAt = DateTimeOffset.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse<bool>.Ok(true, "Xóa khách hàng thành công."));
    }

    /// <summary>
    /// Thu nợ / Thanh toán công nợ nhanh cho khách hàng
    /// </summary>
    [HttpPost("{id:guid}/collect-debt")]
    public async Task<IActionResult> CollectDebt(Guid id, [FromBody] CollectDebtRequest request, CancellationToken cancellationToken)
    {
        var customer = await _context.Customers.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (customer is null)
            return NotFound(ApiResponse<CustomerDto>.Fail("Không tìm thấy khách hàng."));

        if (request.Amount <= 0)
            return BadRequest(ApiResponse<CustomerDto>.Fail("Số tiền thu nợ phải lớn hơn 0."));

        customer.Debt = Math.Max(0, customer.Debt - request.Amount);
        customer.UpdatedAt = DateTimeOffset.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse<CustomerDto>.Ok(MapToDto(customer), $"Đã thu nợ {request.Amount:N0} VNĐ thành công."));
    }

    /// <summary>
    /// Nhập hàng loạt khách hàng từ danh sách / Excel
    /// </summary>
    [HttpPost("bulk")]
    public async Task<IActionResult> BulkImportCustomers([FromBody] List<CreateCustomerRequest> requests, CancellationToken cancellationToken)
    {
        if (requests == null || requests.Count == 0)
            return BadRequest(ApiResponse<int>.Fail("Danh sách khách hàng nhập rỗng."));

        var importedCount = 0;
        var existingCodes = new HashSet<string>(await _context.Customers.IgnoreQueryFilters().Select(x => x.Code).ToListAsync(cancellationToken));

        var count = existingCodes.Count;
        foreach (var req in requests)
        {
            if (string.IsNullOrWhiteSpace(req.Name) || string.IsNullOrWhiteSpace(req.Phone))
                continue;

            var code = req.Code?.Trim().ToUpper();
            if (string.IsNullOrWhiteSpace(code) || existingCodes.Contains(code))
            {
                count++;
                code = $"KH-{count.ToString().PadLeft(3, '0')}";
            }
            existingCodes.Add(code);

            DateTimeOffset? parsedBirthday = null;
            if (!string.IsNullOrWhiteSpace(req.Birthday) && DateTimeOffset.TryParse(req.Birthday, out var bday))
            {
                parsedBirthday = bday;
            }

            var customer = new Customer
            {
                Code = code,
                FullName = req.Name.Trim(),
                Phone = req.Phone.Trim(),
                Phone2 = req.Phone2?.Trim(),
                Email = req.Email?.Trim(),
                Facebook = req.Facebook?.Trim(),
                Zalo = req.Zalo?.Trim(),
                Gender = req.Gender,
                Birthday = parsedBirthday,
                Address = req.Address?.Trim(),
                City = req.City?.Trim(),
                Branch = req.Branch?.Trim(),
                CustomerType = req.CustomerType ?? "individual",
                Type = req.Type ?? "retail",
                Tier = req.Tier ?? "standard",
                SalesRep = req.SalesRep?.Trim(),
                Notes = req.Notes?.Trim(),
                CompanyName = req.CompanyName?.Trim(),
                BuyerName = req.BuyerName?.Trim(),
                TaxId = req.TaxId?.Trim(),
                InvoiceAddress = req.InvoiceAddress?.Trim() ?? req.Address?.Trim(),
                IdNumber = req.IdNumber?.Trim(),
                Passport = req.Passport?.Trim(),
                BankName = req.BankName?.Trim(),
                BankAccount = req.BankAccount?.Trim(),
                PreferredStyle = req.PreferredStyle?.Trim(),
                ProjectLocation = req.ProjectLocation?.Trim(),
                Status = req.Status ?? "active",
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };

            _context.Customers.Add(customer);
            importedCount++;
        }

        await _context.SaveChangesAsync(cancellationToken);
        return Ok(ApiResponse<int>.Ok(importedCount, $"Đã nhập thành công {importedCount} khách hàng vào hệ thống!"));
    }

    private static CustomerDto MapToDto(Customer c)
    {
        var typeLabel = c.Type switch
        {
            "vip" => "VIP",
            "architect" => "KTS / Đối tác",
            "corporate" => "Doanh nghiệp",
            _ => "Khách lẻ"
        };

        return new CustomerDto(
            Id: c.Id,
            Code: c.Code,
            Name: c.FullName,
            Phone: c.Phone,
            Phone2: c.Phone2,
            Email: c.Email,
            Facebook: c.Facebook,
            Zalo: c.Zalo,
            Gender: c.Gender,
            Birthday: c.Birthday?.ToString("yyyy-MM-dd"),
            Address: c.Address,
            City: c.City,
            Branch: c.Branch,
            BranchName: c.Branch,
            CustomerType: c.CustomerType ?? "individual",
            Type: c.Type ?? "retail",
            TypeLabel: typeLabel,
            Tier: c.Tier ?? "standard",
            SalesRep: c.SalesRep,
            Notes: c.Notes,
            CompanyName: c.CompanyName,
            BuyerName: c.BuyerName,
            TaxId: c.TaxId,
            InvoiceAddress: c.InvoiceAddress,
            IdNumber: c.IdNumber,
            Passport: c.Passport,
            BankName: c.BankName,
            BankAccount: c.BankAccount,
            PreferredStyle: c.PreferredStyle,
            ProjectLocation: c.ProjectLocation,
            TotalSpent: c.TotalSpent,
            Debt: c.Debt,
            TotalOrders: c.OrderCount,
            OrdersCount: c.OrderCount,
            RewardPoints: c.RewardPoints,
            LastOrderDate: c.LastOrderDate?.ToString("yyyy-MM-dd"),
            Status: c.Status ?? "active",
            CreatedAt: c.CreatedAt,
            UpdatedAt: c.UpdatedAt
        );
    }
}
