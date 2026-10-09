namespace InteriorDesign.Domain.Entities;

public sealed class StoreSetting
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string? StoreName { get; set; } = "";
    public string? Hotline { get; set; } = "";
    public string? Email { get; set; } = "";
    public string? Address { get; set; } = "";
    public string? LogoUrl { get; set; } = "";
    public string? HeroBannerUrl { get; set; } = "";
    public string? BankName { get; set; } = "";
    public string? BankAccountName { get; set; } = "";
    public string? BankAccountNumber { get; set; } = "";
    public string? VietQrCodeUrl { get; set; } = "";
    public string? SocialLinksJson { get; set; } = "{}";
    public string? CompanyInfoJson { get; set; } = "{}";
    public string? PaymentConfigJson { get; set; } = "{}";
    public string? PrintTemplatesJson { get; set; } = "[]";
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
