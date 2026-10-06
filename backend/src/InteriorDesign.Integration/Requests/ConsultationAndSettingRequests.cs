namespace InteriorDesign.Integration.Requests;

public sealed record CreateConsultationRequest(
    string FullName,
    string Phone,
    string? Email,
    string? Address,
    DateTimeOffset? PreferredDate,
    string? SpaceType,
    string? DesignStyle,
    string? BudgetRange,
    string? Notes
);

public sealed record UpdateConsultationStatusRequest(string Status);

public sealed record UpdateStoreSettingRequest(
    string StoreName,
    string Hotline,
    string Email,
    string Address,
    string? LogoUrl,
    string? HeroBannerUrl,
    string BankName,
    string BankAccountName,
    string BankAccountNumber,
    string? VietQrCodeUrl,
    string? SocialLinksJson
);
