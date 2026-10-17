using System.Text.Json;
using InteriorDesign.Domain.Entities;
using InteriorDesign.Infrastructure.Data;
using InteriorDesign.Integration.Common;
using InteriorDesign.Integration.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InteriorDesign.Api.Controllers;

[Route("api/settings")]
public sealed class SettingsController : ApiControllerBase
{
    private readonly InteriorDbContext _context;

    public SettingsController(InteriorDbContext context)
    {
        _context = context;
    }

    private async Task<StoreSetting> GetOrCreateSettingsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var settings = await _context.StoreSettings.AsNoTracking().FirstOrDefaultAsync(cancellationToken);
            if (settings is null)
            {
                settings = new StoreSetting
                {
                    StoreName = "",
                    Hotline = "",
                    Email = "",
                    Address = "",
                    LogoUrl = "",
                    BankName = "",
                    BankAccountName = "",
                    BankAccountNumber = "",
                    VietQrCodeUrl = "",
                    SocialLinksJson = "{}",
                    CompanyInfoJson = "{}",
                    PaymentConfigJson = "{}",
                    PrintTemplatesJson = "[]",
                    UpdatedAt = DateTimeOffset.UtcNow
                };
                _context.StoreSettings.Add(settings);
                await _context.SaveChangesAsync(CancellationToken.None);
            }
            return settings;
        }
        catch (OperationCanceledException)
        {
            return new StoreSetting();
        }
    }

    // ==========================================
    // 1. GENERAL STORE SETTINGS
    // ==========================================
    [HttpGet]
    public async Task<IActionResult> GetSettings(CancellationToken cancellationToken)
    {
        try
        {
            var settings = await GetOrCreateSettingsAsync(cancellationToken);
            return Ok(ApiResponse<StoreSetting>.Ok(settings));
        }
        catch (OperationCanceledException)
        {
            return StatusCode(499, ApiResponse<object>.Fail("Yêu cầu đã bị hủy bởi client."));
        }
    }

    [HttpPut]
    [Authorize(Roles = "Admin,SuperAdmin,Manager")]
    public async Task<IActionResult> UpdateSettings([FromBody] UpdateStoreSettingRequest request, CancellationToken cancellationToken)
    {
        var settings = await GetOrCreateSettingsAsync(cancellationToken);
        settings.StoreName = request.StoreName?.Trim() ?? settings.StoreName;
        settings.Hotline = request.Hotline?.Trim() ?? settings.Hotline;
        settings.Email = request.Email?.Trim() ?? settings.Email;
        settings.Address = request.Address?.Trim() ?? settings.Address;
        settings.LogoUrl = request.LogoUrl ?? settings.LogoUrl;
        settings.HeroBannerUrl = request.HeroBannerUrl ?? settings.HeroBannerUrl;
        settings.BankName = request.BankName?.Trim() ?? settings.BankName;
        settings.BankAccountName = request.BankAccountName?.Trim() ?? settings.BankAccountName;
        settings.BankAccountNumber = request.BankAccountNumber?.Trim() ?? settings.BankAccountNumber;
        settings.VietQrCodeUrl = request.VietQrCodeUrl ?? settings.VietQrCodeUrl;
        settings.SocialLinksJson = request.SocialLinksJson ?? settings.SocialLinksJson;
        settings.UpdatedAt = DateTimeOffset.UtcNow;

        _context.StoreSettings.Update(settings);
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse<StoreSetting>.Ok(settings, "Cập nhật cấu hình cửa hàng thành công."));
    }

    // ==========================================
    // 2. COMPANY INFORMATION (THÔNG TIN DOANH NGHIỆP)
    // ==========================================
    [HttpGet("company")]
    public async Task<IActionResult> GetCompanyInfo(CancellationToken cancellationToken)
    {
        try
        {
            var settings = await GetOrCreateSettingsAsync(cancellationToken);
            
            // Build canonical D2 Luxury default info
            var defaultCompany = new Dictionary<string, object?>
            {
                ["code"] = "D2L-001",
                ["companyName"] = "CÔNG TY CỔ PHẦN NỘI THẤT CAO CẤP D2 LUXURY",
                ["brandName"] = !string.IsNullOrWhiteSpace(settings.StoreName) ? settings.StoreName : "D2 LUXURY DESIGN",
                ["taxId"] = "0343136004",
                ["representative"] = "Nguyễn Văn Luận",
                ["representativeRole"] = "Tổng Giám Đốc",
                ["businessSector"] = "",
                ["phone"] = "0343 136 004",
                ["hotline"] = !string.IsNullOrWhiteSpace(settings.Hotline) ? settings.Hotline : "0967 323 335",
                ["email"] = !string.IsNullOrWhiteSpace(settings.Email) ? settings.Email : "contact@d2luxury.vn",
                ["website"] = "https://d2luxury.vn",
                ["zalo"] = "https://zalo.me/0967323335",
                ["fanpage"] = "https://www.facebook.com/profile.php?id=61575009790250",
                ["headquarters"] = !string.IsNullOrWhiteSpace(settings.Address) ? settings.Address : "Ngã 4 Cửa Cạn, Đặc khu Phú Quốc, tỉnh Kiên Giang",
                ["warehouseAddress"] = "Khu tiểu thủ công nghiệp Cửa Cạn, TP. Phú Quốc, tỉnh Kiên Giang",
                ["country"] = "Việt Nam",
                ["province"] = "Kiên Giang",
                ["district"] = "TP. Phú Quốc",
                ["ward"] = "Xã Cửa Cạn",
                ["logoUrl"] = !string.IsNullOrWhiteSpace(settings.LogoUrl) ? settings.LogoUrl : "/logo.png",
                ["faviconUrl"] = "/favicon.ico",
                ["stampUrl"] = null,
                ["status"] = true,
                ["accessUrl"] = "https://d2luxury.vn/admin",
                ["expiredAt"] = "",
                ["receiptHeaderTitle"] = "HỆ THỐNG NỘI THẤT CAO CẤP D2 LUXURY",
                ["receiptFooterNote"] = "Cảm ơn Quý khách! Sản phẩm gỗ tự nhiên được bảo hành chính hãng 05 năm.",
                ["showTaxOnReceipt"] = true,
                ["showHotlineOnReceipt"] = true,
                ["showQrOnReceipt"] = true
            };

            if (string.IsNullOrWhiteSpace(settings.CompanyInfoJson) || settings.CompanyInfoJson == "{}")
            {
                return Ok(ApiResponse<object>.Ok(defaultCompany));
            }

            try
            {
                using var doc = JsonDocument.Parse(settings.CompanyInfoJson);
                var root = doc.RootElement;
                var result = new Dictionary<string, object?>(defaultCompany);

                foreach (var prop in root.EnumerateObject())
                {
                    var val = prop.Value;
                    var key = char.ToLowerInvariant(prop.Name[0]) + prop.Name.Substring(1);

                    if (val.ValueKind == JsonValueKind.String)
                    {
                        var str = val.GetString();
                        if (!string.IsNullOrWhiteSpace(str))
                        {
                            // Sanitize any corrupt UTF-8 text in address
                            if (key == "headquarters" && (str.Contains("NgÃ£") || str.Contains("Cá»­a") || str.Contains("Ä‘áº·c")))
                            {
                                str = "Ngã 4 Cửa Cạn, Đặc khu Phú Quốc, tỉnh Kiên Giang";
                            }
                            result[key] = str;
                        }
                    }
                    else if (val.ValueKind == JsonValueKind.True || val.ValueKind == JsonValueKind.False)
                    {
                        result[key] = val.GetBoolean();
                    }
                    else if (val.ValueKind == JsonValueKind.Number)
                    {
                        result[key] = val.GetDecimal();
                    }
                    else if (val.ValueKind != JsonValueKind.Null && val.ValueKind != JsonValueKind.Undefined)
                    {
                        result[key] = val.Clone();
                    }
                }

                return Ok(ApiResponse<Dictionary<string, object?>>.Ok(result));
            }
            catch
            {
                return Ok(ApiResponse<object>.Ok(defaultCompany));
            }
        }
        catch (OperationCanceledException)
        {
            return StatusCode(499, ApiResponse<object>.Fail("Yêu cầu đã bị hủy bởi client."));
        }
    }

    [HttpPut("company")]
    [Authorize(Roles = "Admin,SuperAdmin,Manager")]
    public async Task<IActionResult> UpdateCompanyInfo([FromBody] UpdateCompanyInfoRequest request, CancellationToken cancellationToken)
    {
        var settings = await GetOrCreateSettingsAsync(cancellationToken);
        
        var cleanHeadquarters = request.Headquarters?.Trim();
        if (!string.IsNullOrEmpty(cleanHeadquarters) && (cleanHeadquarters.Contains("NgÃ£") || cleanHeadquarters.Contains("Cá»­a") || cleanHeadquarters.Contains("Ä‘áº·c")))
        {
            cleanHeadquarters = "Ngã 4 Cửa Cạn, Đặc khu Phú Quốc, tỉnh Kiên Giang";
        }

        var sanitizedRequest = request with { Headquarters = cleanHeadquarters };

        var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        var json = JsonSerializer.Serialize(sanitizedRequest, jsonOptions);
        settings.CompanyInfoJson = json;

        if (!string.IsNullOrWhiteSpace(sanitizedRequest.BrandName)) settings.StoreName = sanitizedRequest.BrandName.Trim();
        else if (!string.IsNullOrWhiteSpace(sanitizedRequest.CompanyName)) settings.StoreName = sanitizedRequest.CompanyName.Trim();

        if (!string.IsNullOrWhiteSpace(sanitizedRequest.Hotline)) settings.Hotline = sanitizedRequest.Hotline.Trim();
        else if (!string.IsNullOrWhiteSpace(sanitizedRequest.Phone)) settings.Hotline = sanitizedRequest.Phone.Trim();

        if (!string.IsNullOrWhiteSpace(sanitizedRequest.Email)) settings.Email = sanitizedRequest.Email.Trim();
        if (!string.IsNullOrWhiteSpace(cleanHeadquarters)) settings.Address = cleanHeadquarters;
        if (!string.IsNullOrWhiteSpace(sanitizedRequest.LogoUrl)) settings.LogoUrl = sanitizedRequest.LogoUrl.Trim();
        settings.UpdatedAt = DateTimeOffset.UtcNow;

        _context.StoreSettings.Update(settings);
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse<UpdateCompanyInfoRequest>.Ok(sanitizedRequest, "Cập nhật thông tin công ty thành công."));
    }

    // ==========================================
    // 3. PAYMENT & VIETQR CONFIGURATION
    // ==========================================
    [HttpGet("payment")]
    public async Task<IActionResult> GetPaymentConfig(CancellationToken cancellationToken)
    {
        try
        {
            var settings = await GetOrCreateSettingsAsync(cancellationToken);
            if (string.IsNullOrWhiteSpace(settings.PaymentConfigJson) || settings.PaymentConfigJson == "{}")
            {
                var defaultPayment = new
                {
                    bankName = settings.BankName ?? "",
                    bankAccountName = settings.BankAccountName ?? "",
                    bankAccountNumber = settings.BankAccountNumber ?? "",
                    bankBin = "",
                    branchName = "",
                    defaultDeposit = 30,
                    vietQrTemplate = "compact",
                    vietQrCodeUrl = !string.IsNullOrWhiteSpace(settings.BankAccountNumber) 
                        ? $"https://img.vietqr.io/image/970422-{settings.BankAccountNumber}-compact.png?accountName={Uri.EscapeDataString(settings.BankAccountName ?? "")}" 
                        : "",
                    isCodActive = true,
                    isBankingActive = true,
                    paymentInstructions = ""
                };
                return Ok(ApiResponse<object>.Ok(defaultPayment));
            }

            try
            {
                var paymentData = JsonSerializer.Deserialize<JsonElement>(settings.PaymentConfigJson);
                return Ok(ApiResponse<JsonElement>.Ok(paymentData));
            }
            catch
            {
                return Ok(ApiResponse<string>.Ok(settings.PaymentConfigJson));
            }
        }
        catch (OperationCanceledException)
        {
            return StatusCode(499, ApiResponse<object>.Fail("Yêu cầu đã bị hủy bởi client."));
        }
    }

    [HttpPut("payment")]
    [Authorize(Roles = "Admin,SuperAdmin,Manager")]
    public async Task<IActionResult> UpdatePaymentConfig([FromBody] UpdatePaymentConfigRequest request, CancellationToken cancellationToken)
    {
        var settings = await GetOrCreateSettingsAsync(cancellationToken);
        
        var accName = !string.IsNullOrWhiteSpace(request.BankAccountName) 
            ? request.BankAccountName.Trim() 
            : (!string.IsNullOrWhiteSpace(request.AccountName) ? request.AccountName.Trim() : settings.BankAccountName);

        var accNumber = !string.IsNullOrWhiteSpace(request.BankAccountNumber) 
            ? request.BankAccountNumber.Trim() 
            : (!string.IsNullOrWhiteSpace(request.AccountNumber) ? request.AccountNumber.Trim() : settings.BankAccountNumber);

        var qrUrl = request.VietQrCodeUrl;
        if (string.IsNullOrWhiteSpace(qrUrl) && !string.IsNullOrWhiteSpace(accNumber))
        {
            var bin = !string.IsNullOrWhiteSpace(request.BankBin) ? request.BankBin : "970422";
            var tpl = !string.IsNullOrWhiteSpace(request.VietQrTemplate) ? request.VietQrTemplate : "compact";
            qrUrl = $"https://img.vietqr.io/image/{bin}-{accNumber}-{tpl}.png?accountName={Uri.EscapeDataString(accName ?? "")}";
        }

        var updatedObj = new
        {
            bankName = request.BankName?.Trim() ?? settings.BankName,
            bankAccountName = accName,
            bankAccountNumber = accNumber,
            accountName = accName,
            accountNumber = accNumber,
            branchName = request.BranchName?.Trim() ?? "",
            defaultDeposit = request.DefaultDeposit ?? 30,
            bankBin = request.BankBin ?? "970422",
            vietQrTemplate = request.VietQrTemplate ?? "compact",
            vietQrCodeUrl = qrUrl ?? "",
            isCodActive = request.IsCodActive ?? true,
            isBankingActive = request.IsBankingActive ?? true,
            paymentInstructions = request.PaymentInstructions ?? ""
        };

        settings.PaymentConfigJson = JsonSerializer.Serialize(updatedObj, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
        settings.BankName = updatedObj.bankName;
        settings.BankAccountName = updatedObj.bankAccountName;
        settings.BankAccountNumber = updatedObj.bankAccountNumber;
        settings.VietQrCodeUrl = updatedObj.vietQrCodeUrl;
        settings.UpdatedAt = DateTimeOffset.UtcNow;

        _context.StoreSettings.Update(settings);
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse<object>.Ok(updatedObj, "Cập nhật cấu hình thanh toán & VietQR thành công."));
    }

    // ==========================================
    // 4. PRINT TEMPLATES (MẪU IN CHỨNG TỪ & HÓA ĐƠN)
    // ==========================================
    private static List<PrintTemplateDto> GetDefaultPrintTemplates()
    {
        return new List<PrintTemplateDto>
        {
            new("invoice", "Hóa đơn bán hàng", "Mẫu hóa đơn thanh toán Showroom", "HÓA ĐƠN BÁN HÀNG & DỊCH VỤ NỘI THẤT", "HD", "k80", true, true, true, true, "Hệ thống Showroom Nội Thất Cao Cấp D2 LUXURY", "Cảm ơn Quý khách! Sản phẩm gỗ tự nhiên được bảo hành chính hãng 05 năm.", null),
            new("order", "Phiếu đặt hàng / Cọc", "Mẫu hợp đồng đặt cọc may đo", "PHIẾU ĐẶT HÀNG & TẠM ỨNG MAY ĐO", "DH", "a4", true, true, true, true, "Xưởng Sản Xuất & Gia Công Nội Thất Mộc Gia Atelier", "Tiến độ sản xuất từ 15-20 ngày làm việc kể từ ngày duyệt bản vẽ 3D kỹ thuật.", null),
            new("delivery", "Phiếu giao hàng / Lắp đặt", "Mẫu biên bản bàn giao công trình", "BIÊN BẢN BÀN GIAO & LẮP ĐẶT NỘI THẤT", "BG", "a4", true, false, true, true, "Đội Thi Công & Lắp Đặt Hoàn Thiện Công Trình", "Quý khách vui lòng kiểm tra kỹ hiện trạng sản phẩm, phụ kiện trước khi ký nhận bàn giao.", null),
            new("purchase", "Phiếu nhập kho vật tư", "Mẫu phiếu nhập kho hàng hóa", "PHIẾU NHẬP KHO VẬT TƯ & HÀNG HÓA", "PNK", "a4", true, false, false, true, "Kho Tổng Vật Tư & Nguyên Liệu Gỗ Tự Nhiên", "Thủ kho và người giao hàng chịu trách nhiệm về số lượng và quy cách thực nhập.", null),
            new("stocktake", "Biên bản kiểm kê kho", "Mẫu kiểm kê tồn kho hàng hóa", "PHIẾU KIỂM KÊ TỒN KHO HÀNG HÓA", "KK", "a4", true, false, false, true, "Phân hệ Quản lý Kho Vật tư & Xưởng Sản Xuất", "Biên bản kiểm kê có giá trị làm căn cứ đối soát sổ sách kho và xử lý tồn kho.", null),
            new("return", "Phiếu xuất trả NCC", "Mẫu phiếu xuất trả hàng & bảo hành NCC", "PHIẾU XUẤT TRẢ HÀNG & BẢO HÀNH NCC", "TH", "a5", true, false, true, true, "Trung Tâm Dịch Vụ Khách Hàng D2 LUXURY", "Cam kết xử lý và phản hồi tình trạng sản phẩm trong vòng 48h làm việc.", null),
            new("receipt", "Phiếu thu tiền", "Mẫu phiếu thu tiền tạm ứng / thanh toán", "PHIẾU THU TIỀN TẠM ỨNG DỰ ÁN", "PT", "a5", true, true, true, true, "Phòng Kế Toán - Tài Chính D2 LUXURY", "Phiếu thu có giá trị xác nhận thanh toán khi có đủ chữ ký của thủ quỹ và người nộp tiền.", null),
            new("payment", "Phiếu chi tiền", "Mẫu phiếu chi thanh toán NCC / xưởng", "PHIẾU CHI TIỀN THANH TOÁN VẬT TƯ", "PC", "a5", true, false, false, true, "Phòng Kế Toán - Tài Chính D2 LUXURY", "Đề nghị người nhận tiền kiểm đếm đủ trước khi rời khỏi quầy thủ quỹ.", null)
        };
    }

    [HttpGet("print-templates")]
    public async Task<IActionResult> GetPrintTemplates(CancellationToken cancellationToken)
    {
        try
        {
            var settings = await GetOrCreateSettingsAsync(cancellationToken);
            if (string.IsNullOrWhiteSpace(settings.PrintTemplatesJson) || settings.PrintTemplatesJson == "[]" || settings.PrintTemplatesJson == "{}")
            {
                var defaultTemplates = GetDefaultPrintTemplates();
                return Ok(ApiResponse<List<PrintTemplateDto>>.Ok(defaultTemplates));
            }

            try
            {
                var templates = JsonSerializer.Deserialize<List<PrintTemplateDto>>(settings.PrintTemplatesJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                return Ok(ApiResponse<List<PrintTemplateDto>>.Ok(templates ?? GetDefaultPrintTemplates()));
            }
            catch
            {
                return Ok(ApiResponse<List<PrintTemplateDto>>.Ok(GetDefaultPrintTemplates()));
            }
        }
        catch (OperationCanceledException)
        {
            return StatusCode(499, ApiResponse<object>.Fail("Yêu cầu đã bị hủy bởi client."));
        }
    }

    [HttpGet("print-templates/{key}")]
    public async Task<IActionResult> GetPrintTemplateByKey(string key, CancellationToken cancellationToken)
    {
        try
        {
            var settings = await GetOrCreateSettingsAsync(cancellationToken);
            var templates = GetDefaultPrintTemplates();
            if (!string.IsNullOrWhiteSpace(settings.PrintTemplatesJson) && settings.PrintTemplatesJson != "[]")
            {
                try
                {
                    var parsed = JsonSerializer.Deserialize<List<PrintTemplateDto>>(settings.PrintTemplatesJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (parsed != null && parsed.Count > 0) templates = parsed;
                }
                catch { }
            }

            var found = templates.FirstOrDefault(t => t.Key.Equals(key, StringComparison.OrdinalIgnoreCase));
            if (found is null) return NotFound(ApiResponse<PrintTemplateDto>.Fail($"Không tìm thấy mẫu in với key: {key}"));

            return Ok(ApiResponse<PrintTemplateDto>.Ok(found));
        }
        catch (OperationCanceledException)
        {
            return StatusCode(499, ApiResponse<object>.Fail("Yêu cầu đã bị hủy bởi client."));
        }
    }

    [HttpPut("print-templates/{key}")]
    [Authorize(Roles = "Admin,SuperAdmin,Manager")]
    public async Task<IActionResult> UpdatePrintTemplate(string key, [FromBody] PrintTemplateDto request, CancellationToken cancellationToken)
    {
        var settings = await GetOrCreateSettingsAsync(cancellationToken);
        var templates = GetDefaultPrintTemplates();
        if (!string.IsNullOrWhiteSpace(settings.PrintTemplatesJson) && settings.PrintTemplatesJson != "[]")
        {
            try
            {
                var parsed = JsonSerializer.Deserialize<List<PrintTemplateDto>>(settings.PrintTemplatesJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                if (parsed != null && parsed.Count > 0) templates = parsed;
            }
            catch { }
        }

        var idx = templates.FindIndex(t => t.Key.Equals(key, StringComparison.OrdinalIgnoreCase));
        if (idx >= 0)
        {
            templates[idx] = request;
        }
        else
        {
            templates.Add(request);
        }

        settings.PrintTemplatesJson = JsonSerializer.Serialize(templates);
        settings.UpdatedAt = DateTimeOffset.UtcNow;
        _context.StoreSettings.Update(settings);
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse<PrintTemplateDto>.Ok(request, "Cập nhật mẫu in thành công."));
    }

    [HttpPost("print-templates")]
    [Authorize(Roles = "Admin,SuperAdmin,Manager")]
    public async Task<IActionResult> BulkSavePrintTemplates([FromBody] SavePrintTemplatesRequest request, CancellationToken cancellationToken)
    {
        var settings = await GetOrCreateSettingsAsync(cancellationToken);
        settings.PrintTemplatesJson = JsonSerializer.Serialize(request.Templates ?? GetDefaultPrintTemplates());
        settings.UpdatedAt = DateTimeOffset.UtcNow;
        _context.StoreSettings.Update(settings);
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse<List<PrintTemplateDto>>.Ok(request.Templates ?? GetDefaultPrintTemplates(), "Lưu cấu hình mẫu in thành công."));
    }

    [HttpPost("print-templates/reset")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ResetPrintTemplates(CancellationToken cancellationToken)
    {
        var settings = await GetOrCreateSettingsAsync(cancellationToken);
        var defaultTemplates = GetDefaultPrintTemplates();
        settings.PrintTemplatesJson = JsonSerializer.Serialize(defaultTemplates);
        settings.UpdatedAt = DateTimeOffset.UtcNow;
        _context.StoreSettings.Update(settings);
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse<List<PrintTemplateDto>>.Ok(defaultTemplates, "Đã khôi phục mẫu in mặc định thành công."));
    }
}
