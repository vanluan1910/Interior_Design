namespace InteriorDesign.Integration.Requests;

public sealed record UpdateCompanyInfoRequest(
    string? Code,
    string? CompanyName,
    string? BrandName,
    string? TaxId,
    string? Representative,
    string? RepresentativeRole,
    string? BusinessSector,
    string? Phone,
    string? Hotline,
    string? Email,
    string? Website,
    string? Zalo,
    string? Fanpage,
    string? Headquarters,
    string? WarehouseAddress,
    string? Country,
    string? Province,
    string? District,
    string? Ward,
    string? LogoUrl,
    string? FaviconUrl,
    string? StampUrl,
    bool Status,
    string? AccessUrl,
    string? ExpiredAt,
    string? ReceiptHeaderTitle,
    string? ReceiptFooterNote,
    bool? ShowTaxOnReceipt,
    bool? ShowHotlineOnReceipt,
    bool? ShowQrOnReceipt
);

public sealed record UpdatePaymentConfigRequest(
    string? BankName,
    string? BankAccountName,
    string? BankAccountNumber,
    string? AccountName,
    string? AccountNumber,
    string? BankBin,
    string? VietQrTemplate,
    string? VietQrCodeUrl,
    bool? IsCodActive,
    bool? IsBankingActive,
    string? PaymentInstructions,
    decimal? DefaultDeposit,
    string? BranchName
);

public sealed record PrintTemplateDto(
    string Key,
    string Tab,
    string Select,
    string Title,
    string CodePrefix,
    string PaperSize,
    bool ShowLogo,
    bool ShowQr,
    bool ShowCustomer,
    bool ShowSignature,
    string? HeaderNote,
    string FooterNote,
    string? CustomHtml
);

public sealed record SavePrintTemplatesRequest(
    List<PrintTemplateDto> Templates
);
