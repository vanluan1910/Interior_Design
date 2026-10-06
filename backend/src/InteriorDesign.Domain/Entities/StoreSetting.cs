namespace InteriorDesign.Domain.Entities;

public sealed class StoreSetting
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string StoreName { get; set; } = "Komorebi Wood & Living";
    public string Hotline { get; set; } = "1900 6868";
    public string Email { get; set; } = "contact@komorebi-living.vn";
    public string Address { get; set; } = "284 Nguyễn Tri Phương, Quận 10, TP. Hồ Chí Minh";
    public string LogoUrl { get; set; } = "";
    public string HeroBannerUrl { get; set; } = "";
    public string BankName { get; set; } = "MB Bank";
    public string BankAccountName { get; set; } = "KOMOREBI INTERIOR DESIGN";
    public string BankAccountNumber { get; set; } = "999988886666";
    public string VietQrCodeUrl { get; set; } = "";
    public string SocialLinksJson { get; set; } = "{}";
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
