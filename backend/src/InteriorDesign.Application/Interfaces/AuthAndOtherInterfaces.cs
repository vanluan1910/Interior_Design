using InteriorDesign.Domain.Entities;

namespace InteriorDesign.Application.Interfaces;

public interface IAuthRepository
{
    Task<User?> GetUserByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<User?> GetUserByEmailAsync(string email, CancellationToken cancellationToken);
    Task<User?> GetUserByIdentifierAsync(string identifier, CancellationToken cancellationToken);
    Task<User> CreateUserAsync(User user, CancellationToken cancellationToken);
    Task<User?> UpdateUserAsync(User user, CancellationToken cancellationToken);
    Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken);
    Task<bool> EmailOrPhoneExistsAsync(string email, string? phone, CancellationToken cancellationToken);
    Task<bool> EmailOrPhoneExistsForOtherUserAsync(Guid excludeUserId, string email, string? phone, CancellationToken cancellationToken);
}

public interface ISettingsRepository
{
    Task<StoreSetting> GetSettingsAsync(CancellationToken cancellationToken);
    Task<StoreSetting> UpdateSettingsAsync(StoreSetting setting, CancellationToken cancellationToken);
}

public interface IEmailService
{
    Task SendEmailAsync(string to, string subject, string htmlBody, CancellationToken cancellationToken = default);
}

public interface ITokenService
{
    string GenerateJwtToken(User user);
}
