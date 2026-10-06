using InteriorDesign.Application.Interfaces;
using InteriorDesign.Domain.Entities;
using InteriorDesign.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InteriorDesign.Infrastructure.Repositories;

public sealed class AuthRepository(InteriorDbContext db) : IAuthRepository
{
    public async Task<User?> GetUserByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
    }

    public async Task<User?> GetUserByEmailAsync(string email, CancellationToken cancellationToken)
    {
        return await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower(), cancellationToken);
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
        return await db.Users.AnyAsync(u => u.Email.ToLower() == email.ToLower(), cancellationToken);
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
