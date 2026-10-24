using System.Text.Json;
using InteriorDesign.Domain.Entities;
using InteriorDesign.Infrastructure.Data;
using InteriorDesign.Integration.Common;
using InteriorDesign.Integration.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InteriorDesign.Api.Controllers;

[Route("api/employees")]
public sealed class EmployeesController : ApiControllerBase
{
    private readonly InteriorDbContext _context;

    public EmployeesController(InteriorDbContext context)
    {
        _context = context;
    }

    private static bool _tableEnsured = false;

    private async Task EnsureTableExistsAsync(CancellationToken cancellationToken)
    {
        if (_tableEnsured) return;
        try
        {
            if (_context.Database.IsRelational())
            {
                await _context.Database.ExecuteSqlRawAsync(@"
                    IF OBJECT_ID(N'[dbo].[employees]', N'U') IS NULL
                    BEGIN
                        CREATE TABLE [dbo].[employees] (
                            [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
                            [Code] NVARCHAR(50) NOT NULL,
                            [Name] NVARCHAR(255) NOT NULL,
                            [Phone] NVARCHAR(50) NOT NULL DEFAULT '',
                            [IdNumber] NVARCHAR(50) NOT NULL DEFAULT '',
                            [Gender] NVARCHAR(20) NOT NULL DEFAULT 'Nam',
                            [Birthday] NVARCHAR(50) NOT NULL DEFAULT '',
                            [Email] NVARCHAR(150) NOT NULL DEFAULT '',
                            [Address] NVARCHAR(MAX) NOT NULL DEFAULT '',
                            [Department] NVARCHAR(150) NOT NULL DEFAULT 'Showroom Kinh Doanh',
                            [Title] NVARCHAR(150) NOT NULL DEFAULT 'Chuyên viên Tư vấn',
                            [Branch] NVARCHAR(150) NOT NULL DEFAULT 'Showroom Quận 10 (HQ)',
                            [BranchId] UNIQUEIDENTIFIER NULL,
                            [Login] NVARCHAR(100) NOT NULL DEFAULT '',
                            [Username] NVARCHAR(100) NOT NULL DEFAULT '',
                            [Role] NVARCHAR(50) NOT NULL DEFAULT 'Staff',
                            [Status] NVARCHAR(30) NOT NULL DEFAULT 'working',
                            [WorkingDate] NVARCHAR(50) NOT NULL DEFAULT '',
                            [Area] NVARCHAR(100) NOT NULL DEFAULT '',
                            [Ward] NVARCHAR(100) NOT NULL DEFAULT '',
                            [AddressDetail] NVARCHAR(MAX) NOT NULL DEFAULT '',
                            [Debt] DECIMAL(18,2) NOT NULL DEFAULT 0,
                            [Note] NVARCHAR(MAX) NOT NULL DEFAULT '',
                            [Facebook] NVARCHAR(255) NOT NULL DEFAULT '',
                            [Zalo] NVARCHAR(50) NOT NULL DEFAULT '',
                            [SkillsJson] NVARCHAR(MAX) NOT NULL DEFAULT '[]',
                            [IsDeleted] BIT NOT NULL DEFAULT 0,
                            [CreatedAt] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
                            [UpdatedAt] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
                        );
                    END
                    IF OBJECT_ID(N'[dbo].[employees]', N'U') IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_employees_Code' AND object_id = OBJECT_ID('employees'))
                    BEGIN
                        CREATE UNIQUE NONCLUSTERED INDEX [IX_employees_Code] ON [dbo].[employees] ([Code]) WHERE [IsDeleted] = 0;
                    END
                ", cancellationToken);
            }
            _tableEnsured = true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[EnsureEmployeesTable Warning]: {ex.Message}");
        }
    }

    /// <summary>
    /// Lấy danh sách nhân viên (Hỗ trợ tìm kiếm, lọc phòng ban, chi nhánh, chức vụ, trạng thái, phân trang)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetEmployees(
        [FromQuery] string? search = null,
        [FromQuery] string? department = null,
        [FromQuery] string? branch = null,
        [FromQuery] string? role = null,
        [FromQuery] string? status = null,
        [FromQuery] bool includeDeleted = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 0,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await EnsureTableExistsAsync(cancellationToken);
            var query = includeDeleted
                ? _context.Employees.IgnoreQueryFilters().AsNoTracking().AsQueryable()
                : _context.Employees.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim().ToLower();
                query = query.Where(x =>
                    (x.Name != null && x.Name.ToLower().Contains(s)) ||
                    (x.Code != null && x.Code.ToLower().Contains(s)) ||
                    (x.Phone != null && x.Phone.ToLower().Contains(s)) ||
                    (x.Email != null && x.Email.ToLower().Contains(s)) ||
                    (x.Username != null && x.Username.ToLower().Contains(s)) ||
                    (x.IdNumber != null && x.IdNumber.ToLower().Contains(s)));
            }

            if (!string.IsNullOrWhiteSpace(department) && department != "all")
            {
                var d = department.Trim().ToLower();
                query = query.Where(x => x.Department != null && x.Department.ToLower() == d);
            }

            if (!string.IsNullOrWhiteSpace(branch) && branch != "all")
            {
                var b = branch.Trim().ToLower();
                query = query.Where(x => x.Branch != null && x.Branch.ToLower().Contains(b));
            }

            if (!string.IsNullOrWhiteSpace(role) && role != "all")
            {
                var r = role.Trim().ToLower();
                query = query.Where(x => x.Role != null && x.Role.ToLower() == r);
            }

            if (!string.IsNullOrWhiteSpace(status) && status != "all")
            {
                var st = status.Trim().ToLower();
                query = query.Where(x => x.Status != null && x.Status.ToLower() == st);
            }

            var totalCount = await query.CountAsync(cancellationToken);

            var itemsQuery = query
                .OrderBy(x => x.Code)
                .ThenBy(x => x.Name);

            var items = pageSize > 0
                ? await itemsQuery.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken)
                : await itemsQuery.ToListAsync(cancellationToken);

            // Map skills JSON to List<string> for clean frontend consumption
            var mapped = items.Select(e => new
            {
                e.Id,
                e.Code,
                e.Name,
                e.Phone,
                e.IdNumber,
                e.Gender,
                e.Birthday,
                e.Email,
                e.Address,
                e.Department,
                e.Title,
                e.Branch,
                e.BranchId,
                e.Login,
                e.Username,
                e.Role,
                e.Status,
                e.WorkingDate,
                e.Area,
                e.Ward,
                e.AddressDetail,
                e.Debt,
                e.Note,
                e.Facebook,
                e.Zalo,
                Skills = ParseSkills(e.SkillsJson),
                e.CreatedAt,
                e.UpdatedAt
            }).ToList();

            var result = new PagedResult<object>(mapped, page, mapped.Count > 0 ? mapped.Count : totalCount, totalCount);

            return Ok(ApiResponse<PagedResult<object>>.Ok(result));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<string>.Fail($"Lỗi hệ thống khi tải danh sách nhân viên: {ex.Message}"));
        }
    }

    /// <summary>
    /// Lấy chi tiết nhân viên theo ID
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetEmployeeById(Guid id, CancellationToken cancellationToken)
    {
        var employee = await _context.Employees.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (employee is null)
            return NotFound(ApiResponse<string>.Fail("Không tìm thấy nhân viên."));

        var response = new
        {
            employee.Id,
            employee.Code,
            employee.Name,
            employee.Phone,
            employee.IdNumber,
            employee.Gender,
            employee.Birthday,
            employee.Email,
            employee.Address,
            employee.Department,
            employee.Title,
            employee.Branch,
            employee.BranchId,
            employee.Login,
            employee.Username,
            employee.Role,
            employee.Status,
            employee.WorkingDate,
            employee.Area,
            employee.Ward,
            employee.AddressDetail,
            employee.Debt,
            employee.Note,
            employee.Facebook,
            employee.Zalo,
            Skills = ParseSkills(employee.SkillsJson),
            employee.CreatedAt,
            employee.UpdatedAt
        };

        return Ok(ApiResponse<object>.Ok(response));
    }

    /// <summary>
    /// Thêm mới nhân viên
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateEmployee([FromBody] CreateEmployeeRequest request, CancellationToken cancellationToken)
    {
        await EnsureTableExistsAsync(cancellationToken);
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(ApiResponse<string>.Fail("Tên nhân viên không được để trống."));

        if (string.IsNullOrWhiteSpace(request.Phone))
            return BadRequest(ApiResponse<string>.Fail("Số điện thoại không được để trống."));

        var cleanName = request.Name.Trim();

        // Auto-generate code if empty
        var code = request.Code?.Trim().ToUpper();
        if (string.IsNullOrWhiteSpace(code))
        {
            var maxId = await _context.Employees.CountAsync(cancellationToken) + 1;
            code = $"NV{maxId:D2}";
            while (await _context.Employees.AnyAsync(x => !x.IsDeleted && x.Code == code, cancellationToken))
            {
                maxId++;
                code = $"NV{maxId:D2}";
            }
        }
        else
        {
            var isDuplicateCode = await _context.Employees.AnyAsync(x => !x.IsDeleted && x.Code == code, cancellationToken);
            if (isDuplicateCode)
                return BadRequest(ApiResponse<string>.Fail($"Mã nhân viên '{code}' đã tồn tại trên hệ thống."));
        }

        var username = request.Username?.Trim();
        if (string.IsNullOrWhiteSpace(username))
        {
            username = request.Login?.Trim();
        }

        var targetEmail = !string.IsNullOrWhiteSpace(request.Email)
            ? request.Email.Trim().ToLower()
            : (!string.IsNullOrWhiteSpace(username) && username.Contains('@')
                ? username.Trim().ToLower()
                : $"{code.ToLower()}@d2luxury.vn");

        var targetUsername = !string.IsNullOrWhiteSpace(username)
            ? username.Trim()
            : (!string.IsNullOrWhiteSpace(request.Email) ? request.Email.Split('@')[0] : code.ToLower());

        // Validate duplicate email directly on Employees
        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            var cleanEmail = request.Email.Trim().ToLower();
            var existingByEmail = await _context.Employees.FirstOrDefaultAsync(
                x => !x.IsDeleted && x.Email != null && x.Email.ToLower() == cleanEmail,
                cancellationToken);
            if (existingByEmail != null)
                return BadRequest(ApiResponse<string>.Fail($"Email đăng nhập '{request.Email.Trim()}' đã được sử dụng bởi nhân viên '{existingByEmail.Name}' ({existingByEmail.Code}). Vui lòng nhập email khác."));
        }

        // Validate duplicate username / login directly on Employees
        if (!string.IsNullOrWhiteSpace(targetUsername))
        {
            var uLower = targetUsername.ToLower();
            var existingByUsername = await _context.Employees.FirstOrDefaultAsync(
                x => !x.IsDeleted && ((x.Username != null && x.Username.ToLower() == uLower) ||
                     (x.Login != null && x.Login.ToLower() == uLower)),
                cancellationToken);
            if (existingByUsername != null)
                return BadRequest(ApiResponse<string>.Fail($"Tên đăng nhập '{targetUsername}' đã được sử dụng bởi nhân viên '{existingByUsername.Name}' ({existingByUsername.Code}). Vui lòng chọn tên đăng nhập khác."));
        }

        // Validate duplicate phone directly on Employees
        if (!string.IsNullOrWhiteSpace(request.Phone))
        {
            var cleanPhone = request.Phone.Trim();
            var existingByPhone = await _context.Employees.FirstOrDefaultAsync(
                x => !x.IsDeleted && x.Phone == cleanPhone,
                cancellationToken);
            if (existingByPhone != null)
                return BadRequest(ApiResponse<string>.Fail($"Số điện thoại '{cleanPhone}' đã được sử dụng bởi nhân viên '{existingByPhone.Name}' ({existingByPhone.Code}). Vui lòng nhập số khác."));
        }

        // Check if a user account already exists by Email, Username, or Phone
        var existingUser = await _context.Users.FirstOrDefaultAsync(
            u => u.Email.ToLower() == targetEmail ||
                 (!string.IsNullOrWhiteSpace(targetUsername) && u.Username.ToLower() == targetUsername.ToLower()) ||
                 (!string.IsNullOrWhiteSpace(request.Phone) && u.PhoneNumber == request.Phone.Trim()),
            cancellationToken);

        var rawPassword = !string.IsNullOrWhiteSpace(request.Password) ? request.Password.Trim() : "D2Luxury@2026";
        var userRole = (request.Role?.Trim().ToLower()) switch
        {
            "admin" or "role_admin" => "Admin",
            "manager" or "role_manager" => "Admin",
            _ => "Staff"
        };

        Employee? employee = null;

        if (existingUser != null)
        {
            // Check if this existing user is already attached to an active employee
            var otherEmployee = await _context.Employees.IgnoreQueryFilters().FirstOrDefaultAsync(
                e => e.Id == existingUser.Id || (!string.IsNullOrWhiteSpace(e.Email) && e.Email.ToLower() == targetEmail),
                cancellationToken);

            if (otherEmployee != null && !otherEmployee.IsDeleted)
            {
                return BadRequest(ApiResponse<string>.Fail($"Email hoặc Tên đăng nhập '{targetEmail}' đã được sử dụng bởi nhân viên '{otherEmployee.Name}' ({otherEmployee.Code}). Vui lòng chọn email hoặc tên đăng nhập khác."));
            }

            if (otherEmployee != null && otherEmployee.IsDeleted)
            {
                employee = otherEmployee;
                employee.IsDeleted = false;
            }

            existingUser.FullName = request.Name.Trim();
            existingUser.Username = targetUsername;
            existingUser.Email = targetEmail;
            existingUser.PhoneNumber = request.Phone.Trim();
            existingUser.Role = userRole;
            existingUser.IsActive = (request.Status?.Trim() ?? "working") == "working";
            if (!string.IsNullOrWhiteSpace(request.Password))
            {
                existingUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword(rawPassword);
            }
            existingUser.UpdatedAt = DateTimeOffset.UtcNow;
            _context.Users.Update(existingUser);
        }
        else
        {
            var newUserId = Guid.NewGuid();
            while (await _context.Users.AnyAsync(u => u.Id == newUserId, cancellationToken))
            {
                newUserId = Guid.NewGuid();
            }

            var newUser = new User
            {
                Id = newUserId,
                FullName = request.Name.Trim(),
                Username = targetUsername,
                Email = targetEmail,
                PhoneNumber = request.Phone.Trim(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(rawPassword),
                Role = userRole,
                IsActive = (request.Status?.Trim() ?? "working") == "working",
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };
            _context.Users.Add(newUser);
        }

        if (employee == null)
        {
            var newEmpId = Guid.NewGuid();
            while (await _context.Employees.IgnoreQueryFilters().AnyAsync(e => e.Id == newEmpId, cancellationToken))
            {
                newEmpId = Guid.NewGuid();
            }

            employee = new Employee
            {
                Id = newEmpId,
                Code = code,
                Name = request.Name.Trim(),
                Phone = request.Phone.Trim(),
                IdNumber = request.IdNumber?.Trim() ?? string.Empty,
                Gender = request.Gender?.Trim() ?? "Nam",
                Birthday = request.Birthday?.Trim() ?? string.Empty,
                Email = targetEmail,
                Address = request.Address?.Trim() ?? string.Empty,
                Department = request.Department?.Trim() ?? "Showroom Kinh Doanh",
                Title = request.Title?.Trim() ?? "Chuyên viên Tư vấn",
                Branch = request.Branch?.Trim() ?? "Showroom Quận 10 (HQ)",
                BranchId = request.BranchId,
                Login = targetUsername,
                Username = targetUsername,
                Role = request.Role?.Trim() ?? "Staff",
                Status = request.Status?.Trim() ?? "working",
                WorkingDate = request.WorkingDate?.Trim() ?? DateTime.Now.ToString("yyyy-MM-dd"),
                Area = request.Area?.Trim() ?? string.Empty,
                Ward = request.Ward?.Trim() ?? string.Empty,
                AddressDetail = request.AddressDetail?.Trim() ?? string.Empty,
                Debt = request.Debt ?? 0,
                Note = request.Note?.Trim() ?? string.Empty,
                Facebook = request.Facebook?.Trim() ?? string.Empty,
                Zalo = request.Zalo?.Trim() ?? string.Empty,
                SkillsJson = request.Skills != null ? JsonSerializer.Serialize(request.Skills) : "[]",
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };

            _context.Employees.Add(employee);
        }
        else
        {
            employee.Code = code;
            employee.Name = request.Name.Trim();
            employee.Phone = request.Phone.Trim();
            employee.IdNumber = request.IdNumber?.Trim() ?? string.Empty;
            employee.Gender = request.Gender?.Trim() ?? "Nam";
            employee.Birthday = request.Birthday?.Trim() ?? string.Empty;
            employee.Email = targetEmail;
            employee.Address = request.Address?.Trim() ?? string.Empty;
            employee.Department = request.Department?.Trim() ?? "Showroom Kinh Doanh";
            employee.Title = request.Title?.Trim() ?? "Chuyên viên Tư vấn";
            employee.Branch = request.Branch?.Trim() ?? "Showroom Quận 10 (HQ)";
            employee.BranchId = request.BranchId;
            employee.Login = targetUsername;
            employee.Username = targetUsername;
            employee.Role = request.Role?.Trim() ?? "Staff";
            employee.Status = request.Status?.Trim() ?? "working";
            employee.WorkingDate = request.WorkingDate?.Trim() ?? DateTime.Now.ToString("yyyy-MM-dd");
            employee.Area = request.Area?.Trim() ?? string.Empty;
            employee.Ward = request.Ward?.Trim() ?? string.Empty;
            employee.AddressDetail = request.AddressDetail?.Trim() ?? string.Empty;
            employee.Debt = request.Debt ?? 0;
            employee.Note = request.Note?.Trim() ?? string.Empty;
            employee.Facebook = request.Facebook?.Trim() ?? string.Empty;
            employee.Zalo = request.Zalo?.Trim() ?? string.Empty;
            employee.SkillsJson = request.Skills != null ? JsonSerializer.Serialize(request.Skills) : "[]";
            employee.UpdatedAt = DateTimeOffset.UtcNow;

            _context.Employees.Update(employee);
        }

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex)
        {
            var msg = ex.InnerException?.Message ?? ex.Message;
            return BadRequest(ApiResponse<string>.Fail($"Không thể tạo nhân viên: {msg}"));
        }

        return Ok(ApiResponse<Employee>.Ok(employee, "Thêm nhân viên thành công."));
    }

    /// <summary>
    /// Cập nhật thông tin nhân viên
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateEmployee(Guid id, [FromBody] UpdateEmployeeRequest request, CancellationToken cancellationToken)
    {
        var employee = await _context.Employees.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (employee is null)
            return NotFound(ApiResponse<string>.Fail("Không tìm thấy nhân viên cần cập nhật."));

        if (!string.IsNullOrWhiteSpace(request.Code))
        {
            var code = request.Code.Trim().ToUpper();
            var duplicate = await _context.Employees.AnyAsync(x => x.Id != id && !x.IsDeleted && x.Code == code, cancellationToken);
            if (duplicate)
                return BadRequest(ApiResponse<string>.Fail($"Mã nhân viên '{code}' đã thuộc về nhân viên khác."));
            employee.Code = code;
        }

        if (!string.IsNullOrWhiteSpace(request.Name))
        {
            employee.Name = request.Name.Trim();
        }

        if (!string.IsNullOrWhiteSpace(request.Phone))
        {
            var cleanPhone = request.Phone.Trim();
            var duplicatePhone = await _context.Employees.AnyAsync(x => x.Id != id && !x.IsDeleted && x.Phone == cleanPhone, cancellationToken);
            if (duplicatePhone)
                return BadRequest(ApiResponse<string>.Fail($"Số điện thoại '{cleanPhone}' đã thuộc về nhân viên khác."));
            employee.Phone = cleanPhone;
        }

        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            var cleanEmail = request.Email.Trim().ToLower();
            var duplicateEmail = await _context.Employees.AnyAsync(x => x.Id != id && !x.IsDeleted && x.Email != null && x.Email.ToLower() == cleanEmail, cancellationToken);
            if (duplicateEmail)
                return BadRequest(ApiResponse<string>.Fail($"Email '{request.Email.Trim()}' đã thuộc về nhân viên khác."));
            employee.Email = request.Email.Trim();
        }
        if (request.Address != null) employee.Address = request.Address.Trim();
        if (!string.IsNullOrWhiteSpace(request.Department)) employee.Department = request.Department.Trim();
        if (!string.IsNullOrWhiteSpace(request.Title)) employee.Title = request.Title.Trim();
        if (!string.IsNullOrWhiteSpace(request.Branch)) employee.Branch = request.Branch.Trim();
        if (request.BranchId.HasValue) employee.BranchId = request.BranchId;
        if (!string.IsNullOrWhiteSpace(request.Role)) employee.Role = request.Role.Trim();
        if (!string.IsNullOrWhiteSpace(request.Status)) employee.Status = request.Status.Trim();
        if (request.WorkingDate != null) employee.WorkingDate = request.WorkingDate.Trim();
        if (request.Area != null) employee.Area = request.Area.Trim();
        if (request.Ward != null) employee.Ward = request.Ward.Trim();
        if (request.AddressDetail != null) employee.AddressDetail = request.AddressDetail.Trim();
        if (request.Debt.HasValue) employee.Debt = request.Debt.Value;
        if (request.Note != null) employee.Note = request.Note.Trim();
        if (request.Facebook != null) employee.Facebook = request.Facebook.Trim();
        if (request.Zalo != null) employee.Zalo = request.Zalo.Trim();
        if (request.Skills != null) employee.SkillsJson = JsonSerializer.Serialize(request.Skills);

        var username = request.Username?.Trim() ?? request.Login?.Trim();
        if (!string.IsNullOrWhiteSpace(username))
        {
            var uLower = username.ToLower();
            var duplicateUsername = await _context.Employees.AnyAsync(
                x => x.Id != id && ((x.Username != null && x.Username.ToLower() == uLower) || (x.Login != null && x.Login.ToLower() == uLower)),
                cancellationToken);
            if (duplicateUsername)
                return BadRequest(ApiResponse<string>.Fail($"Tên đăng nhập '{username}' đã thuộc về nhân viên khác."));

            employee.Username = username;
            employee.Login = username;
        }

        employee.UpdatedAt = DateTimeOffset.UtcNow;
        _context.Employees.Update(employee);

        // Sync corresponding User account
        var targetEmail = !string.IsNullOrWhiteSpace(employee.Email)
            ? employee.Email.Trim().ToLower()
            : (!string.IsNullOrWhiteSpace(employee.Username) && employee.Username.Contains('@')
                ? employee.Username.Trim().ToLower()
                : $"{(employee.Code ?? "nv").ToLower()}@d2luxury.vn");

        var targetUsername = !string.IsNullOrWhiteSpace(employee.Username)
            ? employee.Username.Trim()
            : (!string.IsNullOrWhiteSpace(employee.Email) ? employee.Email.Split('@')[0] : (employee.Code ?? "nv").ToLower());

        employee.Email = targetEmail;
        employee.Username = targetUsername;
        employee.Login = targetUsername;

        var user = await _context.Users.FirstOrDefaultAsync(
            u => u.Id == employee.Id ||
                 u.Email.ToLower() == targetEmail ||
                 (!string.IsNullOrWhiteSpace(targetUsername) && u.Username.ToLower() == targetUsername.ToLower()) ||
                 (!string.IsNullOrWhiteSpace(employee.Phone) && u.PhoneNumber == employee.Phone),
            cancellationToken);

        var userRole = (employee.Role?.Trim().ToLower()) switch
        {
            "admin" or "role_admin" => "Admin",
            "manager" or "role_manager" => "Admin",
            _ => "Staff"
        };

        if (user != null)
        {
            user.FullName = employee.Name ?? "";
            user.PhoneNumber = employee.Phone ?? "";
            user.Username = targetUsername;
            user.Email = targetEmail;
            user.Role = userRole;
            user.IsActive = employee.Status == "working";
            if (!string.IsNullOrWhiteSpace(request.Password))
            {
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password.Trim());
            }
            user.UpdatedAt = DateTimeOffset.UtcNow;
            _context.Users.Update(user);
        }
        else
        {
            var newUser = new User
            {
                Id = employee.Id,
                FullName = employee.Name ?? "",
                Username = targetUsername,
                Email = targetEmail,
                PhoneNumber = employee.Phone ?? "",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(!string.IsNullOrWhiteSpace(request.Password) ? request.Password.Trim() : "D2Luxury@2026"),
                Role = userRole,
                IsActive = employee.Status == "working",
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };
            _context.Users.Add(newUser);
        }

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            return BadRequest(ApiResponse<string>.Fail($"Không thể cập nhật nhân viên do Email '{targetEmail}' hoặc Tên đăng nhập đã thuộc về tài khoản khác."));
        }

        return Ok(ApiResponse<Employee>.Ok(employee, "Cập nhật thông tin nhân viên thành công."));
    }

    /// <summary>
    /// Xóa nhân viên (Soft delete)
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteEmployee(Guid id, CancellationToken cancellationToken)
    {
        var employee = await _context.Employees.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (employee is null)
            return NotFound(ApiResponse<string>.Fail("Không tìm thấy nhân viên."));

        employee.IsDeleted = true;
        employee.UpdatedAt = DateTimeOffset.UtcNow;
        _context.Employees.Update(employee);

        var user = await _context.Users.FirstOrDefaultAsync(
            u => u.Id == employee.Id ||
                 (!string.IsNullOrEmpty(employee.Email) && u.Email.ToLower() == employee.Email.ToLower()) ||
                 (!string.IsNullOrEmpty(employee.Phone) && u.PhoneNumber == employee.Phone),
            cancellationToken);
        if (user != null)
        {
            user.IsActive = false;
            user.UpdatedAt = DateTimeOffset.UtcNow;
            _context.Users.Update(user);
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse<bool>.Ok(true, "Xóa nhân viên thành công."));
    }

    /// <summary>
    /// Cập nhật trạng thái nhân viên (working / resigned)
    /// </summary>
    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateEmployeeStatusRequest request, CancellationToken cancellationToken)
    {
        var employee = await _context.Employees.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (employee is null)
            return NotFound(ApiResponse<string>.Fail("Không tìm thấy nhân viên."));

        employee.Status = request.Status?.Trim().ToLower() == "resigned" ? "resigned" : "working";
        employee.UpdatedAt = DateTimeOffset.UtcNow;
        _context.Employees.Update(employee);

        var user = await _context.Users.FirstOrDefaultAsync(
            u => u.Id == employee.Id ||
                 (!string.IsNullOrEmpty(employee.Email) && u.Email.ToLower() == employee.Email.ToLower()) ||
                 (!string.IsNullOrEmpty(employee.Phone) && u.PhoneNumber == employee.Phone),
            cancellationToken);
        if (user != null)
        {
            user.IsActive = employee.Status == "working";
            user.UpdatedAt = DateTimeOffset.UtcNow;
            _context.Users.Update(user);
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse<Employee>.Ok(employee, "Cập nhật trạng thái làm việc thành công."));
    }

    /// <summary>
    /// Đặt lại mật khẩu tài khoản nhân viên
    /// </summary>
    [HttpPost("{id:guid}/reset-password")]
    public async Task<IActionResult> ResetPassword(Guid id, [FromBody] ResetEmployeePasswordRequest request, CancellationToken cancellationToken)
    {
        var employee = await _context.Employees.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (employee is null)
            return NotFound(ApiResponse<string>.Fail("Không tìm thấy nhân viên."));

        if (string.IsNullOrWhiteSpace(request?.NewPassword))
            return BadRequest(ApiResponse<string>.Fail("Mật khẩu mới không được để trống."));

        var user = await _context.Users.FirstOrDefaultAsync(
            u => u.Id == employee.Id ||
                 (!string.IsNullOrEmpty(employee.Username) && u.Username.ToLower() == employee.Username.ToLower()) ||
                 (!string.IsNullOrEmpty(employee.Email) && u.Email.ToLower() == employee.Email.ToLower()) ||
                 (!string.IsNullOrEmpty(employee.Phone) && u.PhoneNumber == employee.Phone),
            cancellationToken);

        var userRole = (employee.Role?.Trim().ToLower()) switch
        {
            "admin" or "role_admin" => "Admin",
            "manager" or "role_manager" => "Admin",
            _ => "Staff"
        };

        if (user != null)
        {
            if (!string.IsNullOrWhiteSpace(employee.Username)) user.Username = employee.Username.Trim();
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword.Trim());
            user.UpdatedAt = DateTimeOffset.UtcNow;
            _context.Users.Update(user);
        }
        else
        {
            var email = !string.IsNullOrWhiteSpace(employee.Email)
                ? employee.Email
                : (!string.IsNullOrWhiteSpace(employee.Username) && employee.Username.Contains('@')
                    ? employee.Username
                    : $"{(employee.Code ?? "nv").ToLower()}@d2luxury.vn");

            var newUser = new User
            {
                Id = employee.Id,
                FullName = employee.Name ?? "",
                Username = !string.IsNullOrWhiteSpace(employee.Username) ? employee.Username.Trim() : (!string.IsNullOrWhiteSpace(employee.Login) ? employee.Login.Trim() : ""),
                Email = email,
                PhoneNumber = employee.Phone ?? "",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword.Trim()),
                Role = userRole,
                IsActive = employee.Status == "working",
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };
            _context.Users.Add(newUser);
        }

        await _context.SaveChangesAsync(cancellationToken);
        return Ok(ApiResponse<bool>.Ok(true, "Đặt lại mật khẩu nhân viên thành công."));
    }

    private static List<string> ParseSkills(string? json)
    {
        if (string.IsNullOrWhiteSpace(json) || json == "[]") return new List<string>();
        try
        {
            return JsonSerializer.Deserialize<List<string>>(json) ?? new List<string>();
        }
        catch
        {
            return new List<string>();
        }
    }
}
