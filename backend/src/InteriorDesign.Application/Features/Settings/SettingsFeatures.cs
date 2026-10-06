using InteriorDesign.Application.Interfaces;
using InteriorDesign.Domain.Entities;
using InteriorDesign.Integration.Common;
using InteriorDesign.Integration.Requests;
using InteriorDesign.Integration.Responses;
using MediatR;

namespace InteriorDesign.Application.Features.Settings;

public sealed record GetSettingsQuery : IRequest<ApiResponse<StoreSettingDto>>;
public sealed record UpdateSettingsCommand(UpdateStoreSettingRequest Request) : IRequest<ApiResponse<StoreSettingDto>>;

public static class SettingMapper
{
    public static StoreSettingDto ToDto(StoreSetting s) => new(
        s.Id,
        s.StoreName,
        s.Hotline,
        s.Email,
        s.Address,
        s.LogoUrl,
        s.HeroBannerUrl,
        s.BankName,
        s.BankAccountName,
        s.BankAccountNumber,
        s.VietQrCodeUrl,
        s.SocialLinksJson,
        s.UpdatedAt
    );
}

public sealed class GetSettingsQueryHandler(ISettingsRepository repo)
    : IRequestHandler<GetSettingsQuery, ApiResponse<StoreSettingDto>>
{
    public async Task<ApiResponse<StoreSettingDto>> Handle(GetSettingsQuery request, CancellationToken cancellationToken)
    {
        var settings = await repo.GetSettingsAsync(cancellationToken);
        return ApiResponse<StoreSettingDto>.Ok(SettingMapper.ToDto(settings));
    }
}

public sealed class UpdateSettingsCommandHandler(ISettingsRepository repo)
    : IRequestHandler<UpdateSettingsCommand, ApiResponse<StoreSettingDto>>
{
    public async Task<ApiResponse<StoreSettingDto>> Handle(UpdateSettingsCommand command, CancellationToken cancellationToken)
    {
        var req = command.Request;
        var existing = await repo.GetSettingsAsync(cancellationToken);

        existing.StoreName = req.StoreName;
        existing.Hotline = req.Hotline;
        existing.Email = req.Email;
        existing.Address = req.Address;
        existing.LogoUrl = req.LogoUrl ?? existing.LogoUrl;
        existing.HeroBannerUrl = req.HeroBannerUrl ?? existing.HeroBannerUrl;
        existing.BankName = req.BankName;
        existing.BankAccountName = req.BankAccountName;
        existing.BankAccountNumber = req.BankAccountNumber;
        existing.VietQrCodeUrl = req.VietQrCodeUrl ?? existing.VietQrCodeUrl;
        existing.SocialLinksJson = req.SocialLinksJson ?? existing.SocialLinksJson;
        existing.UpdatedAt = DateTimeOffset.UtcNow;

        var updated = await repo.UpdateSettingsAsync(existing, cancellationToken);
        return ApiResponse<StoreSettingDto>.Ok(SettingMapper.ToDto(updated), "Cập nhật thông tin cửa hàng thành công.");
    }
}
