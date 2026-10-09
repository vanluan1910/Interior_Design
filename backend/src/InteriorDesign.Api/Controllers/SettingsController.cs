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
            if (string.IsNullOrWhiteSpace(settings.CompanyInfoJson) || settings.CompanyInfoJson == "{}")
            {
                var defaultCompany = new
                {
                    code = "",
                    companyName = "",
                    brandName = settings.StoreName ?? "",
                    taxId = "",
                    representative = "",
                    representativeRole = "",
                    businessSector = "",
                    phone = "",
                    hotline = settings.Hotline ?? "",
                    email = settings.Email ?? "",
                    website = "",
                    zalo = "",
                    fanpage = "",
                    headquarters = settings.Address ?? "",
                    warehouseAddress = "",
                    country = "Việt Nam",
                    province = "",
                    district = "",
                    ward = "",
                    logoUrl = settings.LogoUrl ?? "",
                    status = true,
                    receiptHeaderTitle = "",
                    receiptFooterNote = "",
                    showTaxOnReceipt = true,
                    showHotlineOnReceipt = true,
                    showQrOnReceipt = true
                };
                return Ok(ApiResponse<object>.Ok(defaultCompany));
            }

            try
            {
                var companyData = JsonSerializer.Deserialize<JsonElement>(settings.CompanyInfoJson);
                return Ok(ApiResponse<JsonElement>.Ok(companyData));
            }
            catch
            {
                return Ok(ApiResponse<string>.Ok(settings.CompanyInfoJson));
            }
        }
        catch (OperationCanceledException)
        {
            return StatusCode(499, ApiResponse<object>.Fail("Yêu cầu đã bị hủy bởi client."));
        }
    }

    [HttpPut("company")]
    public async Task<IActionResult> UpdateCompanyInfo([FromBody] UpdateCompanyInfoRequest request, CancellationToken cancellationToken)
    {
        var settings = await GetOrCreateSettingsAsync(cancellationToken);
        var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        var json = JsonSerializer.Serialize(request, jsonOptions);
        settings.CompanyInfoJson = json;

        if (!string.IsNullOrWhiteSpace(request.BrandName)) settings.StoreName = request.BrandName.Trim();
        if (!string.IsNullOrWhiteSpace(request.Hotline)) settings.Hotline = request.Hotline.Trim();
        if (!string.IsNullOrWhiteSpace(request.Email)) settings.Email = request.Email.Trim();
        if (!string.IsNullOrWhiteSpace(request.Headquarters)) settings.Address = request.Headquarters.Trim();
        if (!string.IsNullOrWhiteSpace(request.LogoUrl)) settings.LogoUrl = request.LogoUrl.Trim();
        settings.UpdatedAt = DateTimeOffset.UtcNow;

        _context.StoreSettings.Update(settings);
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse<UpdateCompanyInfoRequest>.Ok(request, "Cập nhật thông tin công ty thành công."));
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
            new("return", "Phiếu trả hàng / Bảo hành", "Mẫu phiếu đổi trả hàng bảo hành", "PHIẾU TIẾP NHẬN BẢO HÀNH & ĐỔI TRẢ", "TH", "a5", true, false, true, true, "Trung Tâm Chăm Sóc Khách Hàng & Dịch Vụ Sau Bán Hàng", "Thời gian xử lý thẩm định và khắc phục lỗi kỹ thuật trong vòng 48-72 giờ làm việc.", null)
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
