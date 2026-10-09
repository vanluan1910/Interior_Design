using InteriorDesign.Domain.Entities;
using InteriorDesign.Infrastructure.Data;
using InteriorDesign.Integration.Common;
using InteriorDesign.Integration.Requests;
using InteriorDesign.Integration.Responses;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InteriorDesign.Api.Controllers;

[Route("api/roles")]
public sealed class RolesController : ApiControllerBase
{
    private readonly InteriorDbContext _context;

    public RolesController(InteriorDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Lấy danh mục toàn bộ nhóm quyền hạn ma trận (RBAC) của hệ thống
    /// </summary>
    [HttpGet("permissions")]
    public IActionResult GetPermissionsCatalog()
    {
        var catalog = PermissionCatalog.GetPermissionGroups();
        return Ok(ApiResponse<List<PermissionGroupDto>>.Ok(catalog, "Lấy danh mục phân quyền thành công."));
    }

    /// <summary>
    /// Lấy danh sách vai trò hệ thống kèm số lượng nhân sự đảm nhiệm
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetRoles(
        [FromQuery] string? search = null,
        [FromQuery] string? status = null,
        [FromQuery] bool includeDeleted = false,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var query = includeDeleted
                ? _context.Roles.IgnoreQueryFilters().AsNoTracking().AsQueryable()
                : _context.Roles.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim().ToLower();
                query = query.Where(r =>
                    r.Name.ToLower().Contains(s) ||
                    r.Code.ToLower().Contains(s) ||
                    r.Description.ToLower().Contains(s));
            }

            if (!string.IsNullOrWhiteSpace(status) && status != "all")
            {
                query = query.Where(r => r.Status.ToLower() == status.Trim().ToLower());
            }

            var roles = await query
                .OrderByDescending(r => r.IsSystem)
                .ThenBy(r => r.CreatedAt)
                .ToListAsync(cancellationToken);

            // Fetch active employee roles to compute exact assigned user count
            var employeeRoles = await _context.Employees
                .AsNoTracking()
                .Where(e => !e.IsDeleted)
                .Select(e => e.Role)
                .ToListAsync(cancellationToken);

            var result = roles.Select(r =>
            {
                var count = employeeRoles.Count(empRole =>
                {
                    if (string.IsNullOrWhiteSpace(empRole)) return false;
                    var trimmed = empRole.Trim();
                    return string.Equals(trimmed, r.Code, StringComparison.OrdinalIgnoreCase) ||
                           string.Equals(trimmed, r.Name, StringComparison.OrdinalIgnoreCase) ||
                           string.Equals(trimmed, r.Id.ToString(), StringComparison.OrdinalIgnoreCase) ||
                           (r.Code.Equals("SUPER_ADMIN", StringComparison.OrdinalIgnoreCase) &&
                            (trimmed.Equals("Admin", StringComparison.OrdinalIgnoreCase) || trimmed.Equals("role_admin", StringComparison.OrdinalIgnoreCase))) ||
                           (r.Code.Equals("STORE_MANAGER", StringComparison.OrdinalIgnoreCase) &&
                            (trimmed.Equals("Manager", StringComparison.OrdinalIgnoreCase) || trimmed.Equals("role_manager", StringComparison.OrdinalIgnoreCase))) ||
                           (r.Code.Equals("STAFF", StringComparison.OrdinalIgnoreCase) &&
                            (trimmed.Equals("Staff", StringComparison.OrdinalIgnoreCase) || trimmed.Equals("role_staff", StringComparison.OrdinalIgnoreCase)));
                });

                return new RoleResponse(
                    r.Id,
                    r.Code,
                    r.Name,
                    r.Description,
                    count,
                    r.IsSystem,
                    r.Status,
                    r.Permissions ?? new List<string>(),
                    r.CreatedAt,
                    r.UpdatedAt
                );
            }).ToList();

            return Ok(ApiResponse<List<RoleResponse>>.Ok(result, "Lấy danh sách vai trò thành công."));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<List<RoleResponse>>.Fail($"Lỗi khi lấy danh sách vai trò: {ex.Message}"));
        }
    }

    /// <summary>
    /// Lấy chi tiết vai trò theo ID
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetRoleById(Guid id, CancellationToken cancellationToken)
    {
        var role = await _context.Roles.AsNoTracking().FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
        if (role == null)
            return NotFound(ApiResponse<string>.Fail("Không tìm thấy vai trò."));

        var userCount = await _context.Employees.AsNoTracking().CountAsync(e => !e.IsDeleted && (
            e.Role == role.Code || e.Role == role.Name || e.Role == role.Id.ToString()
        ), cancellationToken);

        var response = new RoleResponse(
            role.Id,
            role.Code,
            role.Name,
            role.Description,
            userCount,
            role.IsSystem,
            role.Status,
            role.Permissions ?? new List<string>(),
            role.CreatedAt,
            role.UpdatedAt
        );

        return Ok(ApiResponse<RoleResponse>.Ok(response));
    }

    /// <summary>
    /// Tạo mới vai trò và ma trận phân quyền
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateRole([FromBody] CreateRoleRequest request, CancellationToken cancellationToken)
    {
        if (request == null)
            return BadRequest(ApiResponse<string>.Fail("Dữ liệu không hợp lệ."));

        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(ApiResponse<string>.Fail("Tên vai trò không được để trống."));

        var code = (request.Code ?? string.Empty).Trim().ToUpper();
        if (string.IsNullOrWhiteSpace(code))
        {
            code = $"ROLE_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}";
        }

        var exists = await _context.Roles.IgnoreQueryFilters().AnyAsync(r => r.Code == code && !r.IsDeleted, cancellationToken);
        if (exists)
            return BadRequest(ApiResponse<string>.Fail($"Mã vai trò '{code}' đã tồn tại trong hệ thống."));

        List<string> perms = request.Permissions ?? new List<string>();

        // If template role provided and permissions empty, clone from template
        if (perms.Count == 0 && !string.IsNullOrWhiteSpace(request.TemplateRoleId))
        {
            Role? templateRole = null;
            if (Guid.TryParse(request.TemplateRoleId, out var tId))
            {
                templateRole = await _context.Roles.AsNoTracking().FirstOrDefaultAsync(r => r.Id == tId, cancellationToken);
            }
            else
            {
                templateRole = await _context.Roles.AsNoTracking().FirstOrDefaultAsync(r => r.Code.ToUpper() == request.TemplateRoleId.ToUpper(), cancellationToken);
            }

            if (templateRole != null && templateRole.Permissions != null)
            {
                perms = new List<string>(templateRole.Permissions);
            }
        }

        var newRole = new Role
        {
            Id = Guid.NewGuid(),
            Code = code,
            Name = request.Name.Trim(),
            Description = request.Description?.Trim() ?? string.Empty,
            IsSystem = false,
            Status = string.Equals(request.Status, "inactive", StringComparison.OrdinalIgnoreCase) ? "inactive" : "active",
            Permissions = perms,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        _context.Roles.Add(newRole);
        await _context.SaveChangesAsync(cancellationToken);

        var response = new RoleResponse(
            newRole.Id,
            newRole.Code,
            newRole.Name,
            newRole.Description,
            0,
            newRole.IsSystem,
            newRole.Status,
            newRole.Permissions,
            newRole.CreatedAt,
            newRole.UpdatedAt
        );

        return Ok(ApiResponse<RoleResponse>.Ok(response, "Tạo mới vai trò thành công."));
    }

    /// <summary>
    /// Cập nhật thông tin vai trò
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateRole(Guid id, [FromBody] UpdateRoleRequest request, CancellationToken cancellationToken)
    {
        if (request == null)
            return BadRequest(ApiResponse<string>.Fail("Dữ liệu không hợp lệ."));

        var role = await _context.Roles.FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
        if (role == null)
            return NotFound(ApiResponse<string>.Fail("Không tìm thấy vai trò."));

        if (!string.IsNullOrWhiteSpace(request.Name))
            role.Name = request.Name.Trim();

        if (request.Description != null)
            role.Description = request.Description.Trim();

        if (!string.IsNullOrWhiteSpace(request.Status))
            role.Status = string.Equals(request.Status, "inactive", StringComparison.OrdinalIgnoreCase) ? "inactive" : "active";

        // Non-system roles can update their code
        if (!role.IsSystem && !string.IsNullOrWhiteSpace(request.Code))
        {
            var newCode = request.Code.Trim().ToUpper();
            if (newCode != role.Code)
            {
                var exists = await _context.Roles.IgnoreQueryFilters().AnyAsync(r => r.Id != id && r.Code == newCode && !r.IsDeleted, cancellationToken);
                if (exists)
                    return BadRequest(ApiResponse<string>.Fail($"Mã vai trò '{newCode}' đã được sử dụng bởi vai trò khác."));

                role.Code = newCode;
            }
        }

        if (request.Permissions != null)
        {
            role.Permissions = request.Permissions;
        }

        role.UpdatedAt = DateTimeOffset.UtcNow;
        _context.Roles.Update(role);
        await _context.SaveChangesAsync(cancellationToken);

        var userCount = await _context.Employees.AsNoTracking().CountAsync(e => !e.IsDeleted && (
            e.Role == role.Code || e.Role == role.Name || e.Role == role.Id.ToString()
        ), cancellationToken);

        var response = new RoleResponse(
            role.Id,
            role.Code,
            role.Name,
            role.Description,
            userCount,
            role.IsSystem,
            role.Status,
            role.Permissions,
            role.CreatedAt,
            role.UpdatedAt
        );

        return Ok(ApiResponse<RoleResponse>.Ok(response, "Cập nhật thông tin vai trò thành công."));
    }

    /// <summary>
    /// Lưu ma trận phân quyền chi tiết cho một vai trò
    /// </summary>
    [HttpPut("{id:guid}/permissions")]
    public async Task<IActionResult> UpdateRolePermissions(Guid id, [FromBody] UpdateRolePermissionsRequest request, CancellationToken cancellationToken)
    {
        if (request == null || request.Permissions == null)
            return BadRequest(ApiResponse<string>.Fail("Danh sách quyền hạn không hợp lệ."));

        var role = await _context.Roles.FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
        if (role == null)
            return NotFound(ApiResponse<string>.Fail("Không tìm thấy vai trò."));

        role.Permissions = request.Permissions.Distinct().ToList();
        role.UpdatedAt = DateTimeOffset.UtcNow;

        _context.Roles.Update(role);
        await _context.SaveChangesAsync(cancellationToken);

        var userCount = await _context.Employees.AsNoTracking().CountAsync(e => !e.IsDeleted && (
            e.Role == role.Code || e.Role == role.Name || e.Role == role.Id.ToString()
        ), cancellationToken);

        var response = new RoleResponse(
            role.Id,
            role.Code,
            role.Name,
            role.Description,
            userCount,
            role.IsSystem,
            role.Status,
            role.Permissions,
            role.CreatedAt,
            role.UpdatedAt
        );

        return Ok(ApiResponse<RoleResponse>.Ok(response, $"Đã lưu ma trận phân quyền cho vai trò '{role.Name}' thành công."));
    }

    /// <summary>
    /// Nhân bản vai trò
    /// </summary>
    [HttpPost("{id:guid}/clone")]
    public async Task<IActionResult> CloneRole(Guid id, [FromBody] CloneRoleRequest? request, CancellationToken cancellationToken)
    {
        var sourceRole = await _context.Roles.AsNoTracking().FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
        if (sourceRole == null)
            return NotFound(ApiResponse<string>.Fail("Không tìm thấy vai trò gốc để nhân bản."));

        var newCode = (request?.NewCode ?? $"{sourceRole.Code}_COPY").Trim().ToUpper();
        var index = 1;
        while (await _context.Roles.IgnoreQueryFilters().AnyAsync(r => r.Code == newCode && !r.IsDeleted, cancellationToken))
        {
            newCode = $"{sourceRole.Code}_COPY_{index++}";
        }

        var newName = (!string.IsNullOrWhiteSpace(request?.NewName) ? request.NewName.Trim() : $"{sourceRole.Name} (Bản sao)");
        var newDescription = request?.Description ?? $"Bản sao quyền hạn từ vai trò {sourceRole.Name}";

        var clonedRole = new Role
        {
            Id = Guid.NewGuid(),
            Code = newCode,
            Name = newName,
            Description = newDescription,
            IsSystem = false,
            Status = "active",
            Permissions = new List<string>(sourceRole.Permissions ?? new List<string>()),
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        _context.Roles.Add(clonedRole);
        await _context.SaveChangesAsync(cancellationToken);

        var response = new RoleResponse(
            clonedRole.Id,
            clonedRole.Code,
            clonedRole.Name,
            clonedRole.Description,
            0,
            clonedRole.IsSystem,
            clonedRole.Status,
            clonedRole.Permissions,
            clonedRole.CreatedAt,
            clonedRole.UpdatedAt
        );

        return Ok(ApiResponse<RoleResponse>.Ok(response, $"Đã nhân bản vai trò '{sourceRole.Name}' thành công."));
    }

    /// <summary>
    /// Xóa vai trò (Hỗ trợ soft delete, bảo vệ vai trò hệ thống và vai trò đang có nhân sự)
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteRole(Guid id, CancellationToken cancellationToken)
    {
        var role = await _context.Roles.FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
        if (role == null)
            return NotFound(ApiResponse<string>.Fail("Không tìm thấy vai trò."));

        if (role.IsSystem)
            return BadRequest(ApiResponse<string>.Fail("Không thể xóa vai trò quản trị mặc định của hệ thống."));

        var assignedCount = await _context.Employees.AsNoTracking().CountAsync(e => !e.IsDeleted && (
            e.Role == role.Code || e.Role == role.Name || e.Role == role.Id.ToString()
        ), cancellationToken);

        if (assignedCount > 0)
        {
            return BadRequest(ApiResponse<string>.Fail($"Không thể xóa vai trò này vì đang có {assignedCount} nhân sự đảm nhiệm. Vui lòng chuyển vai trò của nhân viên trước khi xóa."));
        }

        role.IsDeleted = true;
        role.DeletedAt = DateTimeOffset.UtcNow;
        role.UpdatedAt = DateTimeOffset.UtcNow;

        _context.Roles.Update(role);
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse<bool>.Ok(true, $"Đã xóa vai trò '{role.Name}' thành công."));
    }
}
