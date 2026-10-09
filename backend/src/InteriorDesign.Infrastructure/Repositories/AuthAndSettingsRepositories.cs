using InteriorDesign.Application.Interfaces;
using InteriorDesign.Domain.Entities;
using InteriorDesign.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InteriorDesign.Infrastructure.Repositories;

public sealed class AuthRepository(InteriorDbContext db) : IAuthRepository
{
    public async Task<User?> GetUserByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await db.Users.FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
    }

    public async Task<User?> GetUserByEmailAsync(string email, CancellationToken cancellationToken)
    {
        var trimmed = (email ?? string.Empty).Trim().ToLower();
        if (string.IsNullOrEmpty(trimmed)) return null;
        return await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Email.ToLower() == trimmed, cancellationToken);
    }

    public async Task<User?> GetUserByIdentifierAsync(string identifier, CancellationToken cancellationToken)
    {
        var trimmed = (identifier ?? string.Empty).Trim().ToLower();
        var rawTrimmed = (identifier ?? string.Empty).Trim();
        if (string.IsNullOrEmpty(trimmed)) return null;

        // 1. Check if the identifier matches an Employee's Username or Login
        // Rule: Employees are ONLY allowed to log in using their exact Username / Login account.
        var emp = await db.Employees.AsNoTracking().FirstOrDefaultAsync(
            e => !e.IsDeleted && (
                (!string.IsNullOrEmpty(e.Username) && e.Username.ToLower() == trimmed) ||
                (!string.IsNullOrEmpty(e.Login) && e.Login.ToLower() == trimmed)
            ), cancellationToken);

        if (emp != null)
        {
            // Found employee by their exact Username / Login account!
            var empUser = await db.Users.FirstOrDefaultAsync(
                u => u.Id == emp.Id ||
                     (!string.IsNullOrEmpty(u.Username) && u.Username.ToLower() == trimmed) ||
                     (!string.IsNullOrEmpty(u.Email) && u.Email.ToLower() == trimmed) ||
                     (!string.IsNullOrEmpty(emp.Email) && u.Email.ToLower() == emp.Email.ToLower()) ||
                     (!string.IsNullOrEmpty(emp.Phone) && u.PhoneNumber == emp.Phone),
                cancellationToken);

            if (empUser != null)
            {
                return empUser;
            }
        }

        // 2. Reject if identifier matches an employee's Code (Mã NV) or internal Email (Gmail nội bộ)
        // Rule: Mã nhân viên and Gmail nội bộ are strictly forbidden from logging in!
        var isForbiddenEmployeeAttr = await db.Employees.AsNoTracking().AnyAsync(
            e => !e.IsDeleted && (
                (!string.IsNullOrEmpty(e.Code) && e.Code.ToLower() == trimmed) ||
                (!string.IsNullOrEmpty(e.Email) && e.Email.ToLower() == trimmed && e.Username.ToLower() != trimmed && e.Login.ToLower() != trimmed)
            ), cancellationToken);

        if (isForbiddenEmployeeAttr)
        {
            return null; // Reject login via employee code or internal email
        }

        // 3. For regular customers / non-employee accounts: match by Email, Username, or PhoneNumber
        var customerUser = await db.Users.FirstOrDefaultAsync(
            u => (!string.IsNullOrEmpty(u.Email) && u.Email.ToLower() == trimmed) ||
                 (!string.IsNullOrEmpty(u.Username) && u.Username.ToLower() == trimmed) ||
                 (!string.IsNullOrEmpty(u.PhoneNumber) && u.PhoneNumber == rawTrimmed),
            cancellationToken);

        if (customerUser != null)
        {
            // If this user is an active employee, they must log in using their Username only
            var isUserEmployee = await db.Employees.AsNoTracking().AnyAsync(
                e => !e.IsDeleted && (
                    e.Id == customerUser.Id ||
                    (!string.IsNullOrEmpty(e.Email) && customerUser.Email != "" && e.Email.ToLower() == customerUser.Email.ToLower()) ||
                    (!string.IsNullOrEmpty(e.Phone) && customerUser.PhoneNumber != "" && e.Phone == customerUser.PhoneNumber)
                ), cancellationToken);

            if (isUserEmployee)
            {
                // This is an employee. Employees are ONLY permitted to log in with their exact Username or Login!
                var isEmployeeUsername = await db.Employees.AsNoTracking().AnyAsync(
                    e => !e.IsDeleted && (
                        e.Id == customerUser.Id ||
                        (!string.IsNullOrEmpty(e.Email) && customerUser.Email != "" && e.Email.ToLower() == customerUser.Email.ToLower()) ||
                        (!string.IsNullOrEmpty(e.Phone) && customerUser.PhoneNumber != "" && e.Phone == customerUser.PhoneNumber)
                    ) && (
                        (!string.IsNullOrEmpty(e.Username) && e.Username.ToLower() == trimmed) ||
                        (!string.IsNullOrEmpty(e.Login) && e.Login.ToLower() == trimmed)
                    ), cancellationToken);

                if (!isEmployeeUsername)
                {
                    // Attempting to log in with phone, code, or email rather than employee username -> Reject!
                    return null;
                }
            }

            return customerUser;
        }

        return null;
    }

    public async Task<User> CreateUserAsync(User user, CancellationToken cancellationToken)
    {
        db.Users.Add(user);
        await db.SaveChangesAsync(cancellationToken);
        return user;
    }

    public async Task<User?> UpdateUserAsync(User user, CancellationToken cancellationToken)
    {
        db.Users.Update(user);
        await db.SaveChangesAsync(cancellationToken);
        return user;
    }

    public async Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken)
    {
        var trimmed = (email ?? string.Empty).Trim().ToLower();
        if (string.IsNullOrEmpty(trimmed)) return false;
        return await db.Users.AnyAsync(u => u.Email.ToLower() == trimmed, cancellationToken);
    }

    public async Task<bool> EmailOrPhoneExistsAsync(string email, string? phone, CancellationToken cancellationToken)
    {
        var trimmedEmail = (email ?? string.Empty).Trim().ToLower();
        var trimmedPhone = (phone ?? string.Empty).Trim();
        if (string.IsNullOrEmpty(trimmedEmail) && string.IsNullOrEmpty(trimmedPhone)) return false;

        return await db.Users.AnyAsync(
            u => (!string.IsNullOrEmpty(trimmedEmail) && u.Email.ToLower() == trimmedEmail) ||
                 (!string.IsNullOrEmpty(trimmedPhone) && u.PhoneNumber == trimmedPhone),
            cancellationToken);
    }

    public async Task<bool> EmailOrPhoneExistsForOtherUserAsync(Guid excludeUserId, string email, string? phone, CancellationToken cancellationToken)
    {
        var trimmedEmail = (email ?? string.Empty).Trim().ToLower();
        var trimmedPhone = (phone ?? string.Empty).Trim();
        if (string.IsNullOrEmpty(trimmedEmail) && string.IsNullOrEmpty(trimmedPhone)) return false;

        return await db.Users.AnyAsync(
            u => u.Id != excludeUserId && (
                 (!string.IsNullOrEmpty(trimmedEmail) && u.Email.ToLower() == trimmedEmail) ||
                 (!string.IsNullOrEmpty(trimmedPhone) && u.PhoneNumber == trimmedPhone)
            ),
            cancellationToken);
    }
}

public sealed class SettingsRepository(InteriorDbContext db) : ISettingsRepository
{
    public async Task<StoreSetting> GetSettingsAsync(CancellationToken cancellationToken)
    {
        var settings = await db.StoreSettings.FirstOrDefaultAsync(cancellationToken);
        if (settings is null)
        {
            settings = InteriorSeedData.GetStoreSetting();
            db.StoreSettings.Add(settings);
            await db.SaveChangesAsync(cancellationToken);
        }
        return settings;
    }

    public async Task<StoreSetting> UpdateSettingsAsync(StoreSetting setting, CancellationToken cancellationToken)
    {
        db.StoreSettings.Update(setting);
        await db.SaveChangesAsync(cancellationToken);
        return setting;
    }
}
