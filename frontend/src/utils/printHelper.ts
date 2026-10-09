/**
 * Print Helper Utilities
 * Provides isolated iframe printing for all invoices, contracts, vouchers, and warehouse slips.
 * Strictly synchronizes with user templates configured in PrintTemplatesSettings (localStorage: 'd2_admin_print_templates').
 */

export interface PrintSlipOptions {
  title?: string;
  paperSize?: 'k80' | 'k57' | 'a4' | 'a5';
  headerNote?: string;
  footerNote?: string;
}

export interface StoredPrintTemplate {
  key: string;
  tab: string;
  select: string;
  title: string;
  codePrefix: string;
  paperSize: 'k80' | 'k57' | 'a4' | 'a5';
  showLogo: boolean;
  showQr: boolean;
  showCustomer: boolean;
  showSignature: boolean;
  headerNote?: string;
  footerNote: string;
  customHtml?: string;
}

const DEFAULT_TEMPLATES_FALLBACK: Record<string, Partial<StoredPrintTemplate>> = {
  invoice: {
    key: 'invoice',
    tab: 'Đơn hàng (Hóa đơn)',
    select: 'Mẫu Hóa đơn bán hàng (Màn hình Đơn hàng)',
    title: 'HÓA ĐƠN BÁN HÀNG & DỊCH VỤ NỘI THẤT',
    codePrefix: 'HD',
    paperSize: 'a4',
    showLogo: true,
    showQr: true,
    showCustomer: true,
    showSignature: true,
    headerNote: 'Hệ thống Showroom Nội Thất Cao Cấp D2 LUXURY',
    footerNote: 'Cảm ơn Quý khách! Sản phẩm gỗ tự nhiên được bảo hành chính hãng 05 năm.',
  },
  order: {
    key: 'order',
    tab: 'Đặt hàng may đo',
    select: 'Mẫu Phiếu đặt hàng / Cọc may đo (Màn hình Đơn hàng)',
    title: 'PHIẾU ĐẶT HÀNG & TẠM ỨNG MAY ĐO',
    codePrefix: 'DH',
    paperSize: 'a4',
    showLogo: true,
    showQr: true,
    showCustomer: true,
    showSignature: true,
    headerNote: 'Xưởng Sản Xuất & Gia Công Nội Thất Mộc Gia Atelier',
    footerNote: 'Tiến độ sản xuất từ 15-20 ngày làm việc kể từ ngày duyệt bản vẽ 3D kỹ thuật.',
  },
  purchase: {
    key: 'purchase',
    tab: 'Nhập kho',
    select: 'Mẫu Phiếu nhập kho (Màn hình Kho & Xưởng)',
    title: 'PHIẾU NHẬP KHO VẬT TƯ & HÀNG HÓA',
    codePrefix: 'PNK',
    paperSize: 'a4',
    showLogo: true,
    showQr: false,
    showCustomer: false,
    showSignature: true,
    headerNote: 'Kho Tổng Vật Tư & Nguyên Liệu Gỗ Tự Nhiên',
    footerNote: 'Thủ kho và người giao hàng chịu trách nhiệm về số lượng và quy cách quy chuẩn thực nhập.',
  },
  stocktake: {
    key: 'stocktake',
    tab: 'Kiểm kho',
    select: 'Mẫu Biên bản kiểm kê kho (Màn hình Kho & Xưởng)',
    title: 'PHIẾU KIỂM KÊ TỒN KHO HÀNG HÓA',
    codePrefix: 'KK',
    paperSize: 'a4',
    showLogo: true,
    showQr: false,
    showCustomer: false,
    showSignature: true,
    headerNote: 'Phân hệ Quản lý Kho Vật tư & Xưởng Sản Xuất',
    footerNote: 'Biên bản kiểm kê có giá trị làm căn cứ đối soát sổ sách kho và xử lý tồn kho.',
  },
  return: {
    key: 'return',
    tab: 'Xuất trả NCC',
    select: 'Mẫu Phiếu xuất trả hàng & Bảo hành NCC (Màn hình Kho & Xưởng)',
    title: 'PHIẾU XUẤT TRẢ HÀNG & BẢO HÀNH NCC',
    codePrefix: 'TH',
    paperSize: 'a5',
    showLogo: true,
    showQr: false,
    showCustomer: true,
    showSignature: true,
    headerNote: 'Trung Tâm Dịch Vụ Khách Hàng D2 LUXURY',
    footerNote: 'Cam kết xử lý và phản hồi tình trạng sản phẩm trong vòng 48h làm việc.',
  },
  delivery: {
    key: 'delivery',
    tab: 'Bàn giao & Lắp đặt',
    select: 'Mẫu Biên bản bàn giao lắp đặt công trình (Màn hình Đơn hàng)',
    title: 'BIÊN BẢN BÀN GIAO & LẮP ĐẶT NỘI THẤT',
    codePrefix: 'BG',
    paperSize: 'a4',
    showLogo: true,
    showQr: false,
    showCustomer: true,
    showSignature: true,
    headerNote: 'Đội Thi Công & Lắp Đặt Hoàn Thiện Công Trình',
    footerNote: 'Quý khách vui lòng kiểm tra kỹ hiện trạng sản phẩm, phụ kiện trước khi ký nhận bàn giao.',
  },
  receipt: {
    key: 'receipt',
    tab: 'Phiếu thu',
    select: 'Mẫu Phiếu thu tiền tạm ứng / thanh toán',
    title: 'PHIẾU THU TIỀN TẠM ỨNG DỰ ÁN',
    codePrefix: 'PT',
    paperSize: 'a5',
    showLogo: true,
    showQr: true,
    showCustomer: true,
    showSignature: true,
    headerNote: 'Phòng Kế Toán - Tài Chính D2 LUXURY',
    footerNote: 'Phiếu thu có giá trị xác nhận thanh toán khi có đủ chữ ký của thủ quỹ và người nộp tiền.',
  },
  payment: {
    key: 'payment',
    tab: 'Phiếu chi',
    select: 'Mẫu Phiếu chi thanh toán NCC / xưởng',
    title: 'PHIẾU CHI TIỀN THANH TOÁN VẬT TƯ',
    codePrefix: 'PC',
    paperSize: 'a5',
    showLogo: true,
    showQr: false,
    showCustomer: false,
    showSignature: true,
    headerNote: 'Phòng Kế Toán - Tài Chính D2 LUXURY',
    footerNote: 'Đề nghị người nhận tiền kiểm đếm đủ trước khi rời khỏi quầy thủ quỹ.',
  },
};

/**
 * Helper to get active company information from localStorage
 */
export function getStoredCompanyInfo() {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('d2_admin_company_info');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          brandName: parsed.brandName || parsed.BrandName || 'D2 LUXURY',
          businessSector: parsed.businessSector || parsed.BusinessSector || 'NỘI THẤT GỖ TỰ NHIÊN',
          companyName: parsed.companyName || parsed.CompanyName || 'CÔNG TY CỔ PHẦN NỘI THẤT D2 LUXURY',
          address: parsed.address || parsed.Address || 'Showroom 01, KĐT Vinhomes Riverside, Long Biên, Hà Nội',
          hotline: parsed.hotline || parsed.Hotline || parsed.phone || '0986.739.587 - 0985.166.393',
          taxCode: parsed.taxCode || parsed.TaxCode || '0109887766',
          email: parsed.email || parsed.Email || 'contact@d2luxury.vn',
          logoUrl: parsed.logoUrl || parsed.LogoUrl || '/logo.png',
        };
      }
    } catch {}
  }
  return {
    brandName: 'D2 LUXURY',
    businessSector: 'NỘI THẤT GỖ TỰ NHIÊN',
    companyName: 'CÔNG TY CỔ PHẦN NỘI THẤT D2 LUXURY',
    address: 'Showroom 01, KĐT Vinhomes Riverside, Long Biên, Hà Nội',
    hotline: '0986.739.587 - 0985.166.393',
    taxCode: '0109887766',
    email: 'contact@d2luxury.vn',
    logoUrl: '/logo.png',
  };
}

/**
 * Helper to get active payment/bank account info from localStorage
 */
export function getStoredBankPayment() {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('d2_admin_payment_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          bankName: parsed.bankName || parsed.BankName || 'MBBank',
          bankBranch: parsed.bankBranch || parsed.BankBranch || 'Hà Nội',
          accountNumber: parsed.accountNumber || parsed.AccountNumber || '0986739587',
          accountHolder: parsed.accountHolder || parsed.AccountHolder || 'CTCP NOI THAT D2 LUXURY',
        };
      }
    } catch {}
  }
  return {
    bankName: 'MBBank',
    bankBranch: 'Hà Nội',
    accountNumber: '0986739587',
    accountHolder: 'CTCP NOI THAT D2 LUXURY',
  };
}

/**
 * Converts numbers to readable Vietnamese words (e.g. 87500000 -> Tám mươi bảy triệu năm trăm nghìn đồng chẵn)
 */
export function formatMoneyToVietnameseWords(amount: number): string {
  if (!amount || isNaN(amount) || amount <= 0) return 'Không đồng';
  const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  const units = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];

  const readGroup = (n: number): string => {
    let str = '';
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const o = n % 10;
    if (h > 0) {
      str += `${digits[h]} trăm `;
      if (t === 0 && o > 0) str += 'lẻ ';
    }
    if (t > 0) {
      if (t === 1) str += 'mười ';
      else str += `${digits[t]} mươi `;
    }
    if (o > 0) {
      if (t > 1 && o === 1) str += 'mốt ';
      else if (t > 0 && o === 5) str += 'lăm ';
      else str += `${digits[o]} `;
    }
    return str.trim();
  };

  let num = Math.floor(amount);
  const groups: number[] = [];
  while (num > 0) {
    groups.push(num % 1000);
    num = Math.floor(num / 1000);
  }

  const parts: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i];
    if (g > 0) {
      const read = readGroup(g);
      const unit = units[i];
      parts.push(`${read} ${unit}`.trim());
    }
  }

  const result = parts.join(' ').replace(/\s+/g, ' ').trim();
  return result ? `${result.charAt(0).toUpperCase() + result.slice(1)} đồng chẵn` : 'Không đồng';
}

/**
 * Get active template configuration from localStorage or default fallback
 */
export function getSavedPrintTemplate(key: string): StoredPrintTemplate {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('d2_admin_print_templates');
      if (saved) {
        const parsed: StoredPrintTemplate[] = JSON.parse(saved);
        const found = parsed.find((t) => t.key === key);
        if (found) return found;
      }
    } catch {}
  }
  const fallback = DEFAULT_TEMPLATES_FALLBACK[key] || DEFAULT_TEMPLATES_FALLBACK.invoice;
  return fallback as StoredPrintTemplate;
}

/**
 * Executes printing of HTML content in a dedicated, isolated hidden iframe
 */
export function printIsolatedHtml({
  title = 'Phiếu in',
  paperSize = 'a4',
  htmlContent,
}: {
  title?: string;
  paperSize?: 'k80' | 'k57' | 'a4' | 'a5';
  htmlContent: string;
}) {
  if (typeof window === 'undefined') return;

  const isThermal = paperSize === 'k80' || paperSize === 'k57';
  const paperWidth = paperSize === 'k80' ? '76mm' : paperSize === 'k57' ? '54mm' : paperSize === 'a5' ? '148mm' : '190mm';

  const pageStyle =
    paperSize === 'k80'
      ? '@page { size: 80mm auto; margin: 0; }'
      : paperSize === 'k57'
      ? '@page { size: 57mm auto; margin: 0; }'
      : paperSize === 'a5'
      ? '@page { size: A5 landscape; margin: 6mm; }'
      : '@page { size: A4 portrait; margin: 8mm; }';

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="utf-8" />
      <title>${title}</title>
      <style>
        ${pageStyle}
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          color: #0f172a !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          padding: ${isThermal ? '2mm 1mm' : '4mm 6mm'} !important;
        }
        .receipt-isolated {
          width: 100% !important;
          max-width: ${paperWidth} !important;
          margin: 0 auto !important;
          font-size: ${paperSize === 'k57' ? '9px' : paperSize === 'k80' ? '11px' : '12px'};
          line-height: 1.45;
        }
        table { width: 100%; border-collapse: collapse; margin-top: 4px; margin-bottom: 4px; }
        th, td { padding: 4px 6px; }
        img { max-width: 100%; height: auto; }
        .border-b { border-bottom: 1px solid #cbd5e1; }
        .border-t { border-top: 1px solid #cbd5e1; }
        .border { border: 1px solid #cbd5e1; }
        .border-dashed { border-style: dashed; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .font-bold { font-weight: 700; }
        .font-semibold { font-weight: 600; }
        .font-medium { font-weight: 500; }
        .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
        .italic { font-style: italic; }
        .uppercase { text-transform: uppercase; }
        .capitalize { text-transform: capitalize; }
        .grid { display: grid; }
        .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
        .flex { display: flex; }
        .justify-between { justify-content: space-between; }
        .justify-center { justify-content: center; }
        .items-center { align-items: center; }
        .gap-1 { gap: 0.25rem; }
        .gap-1\.5 { gap: 0.375rem; }
        .gap-2 { gap: 0.5rem; }
        .gap-3 { gap: 0.75rem; }
        .gap-4 { gap: 1rem; }
        .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
        .py-1\.5 { padding-top: 0.375rem; padding-bottom: 0.375rem; }
        .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
        .py-2\.5 { padding-top: 0.625rem; padding-bottom: 0.625rem; }
        .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
        .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
        .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
        .p-1\.5 { padding: 0.375rem; }
        .p-2 { padding: 0.5rem; }
        .p-2\.5 { padding: 0.625rem; }
        .p-3 { padding: 0.75rem; }
        .p-4 { padding: 1rem; }
        .my-1 { margin-top: 0.25rem; margin-bottom: 0.25rem; }
        .my-2 { margin-top: 0.5rem; margin-bottom: 0.5rem; }
        .my-3 { margin-top: 0.75rem; margin-bottom: 0.75rem; }
        .mt-0\.5 { margin-top: 0.125rem; }
        .mt-1 { margin-top: 0.25rem; }
        .mt-2 { margin-top: 0.5rem; }
        .mt-3 { margin-top: 0.75rem; }
        .mt-4 { margin-top: 1rem; }
        .mt-6 { margin-top: 1.5rem; }
        .mb-1 { margin-bottom: 0.25rem; }
        .mb-2 { margin-bottom: 0.5rem; }
        .mb-3 { margin-bottom: 0.75rem; }
        .mb-4 { margin-bottom: 1rem; }
        .pb-2 { padding-bottom: 0.5rem; }
        .pb-3 { padding-bottom: 0.75rem; }
        .pt-1 { padding-top: 0.25rem; }
        .pt-2 { padding-top: 0.5rem; }
        .pt-3 { padding-top: 0.75rem; }
        .pt-4 { padding-top: 1rem; }
        .h-8 { height: 2rem; }
        .h-12 { height: 3rem; }
        .h-16 { height: 4rem; }
        .h-20 { height: 5rem; }
        .w-8 { width: 2rem; }
        .w-10 { width: 2.5rem; }
        .w-12 { width: 3rem; }
        .w-16 { width: 4rem; }
        .w-20 { width: 5rem; }
        .w-24 { width: 6rem; }
        .w-28 { width: 7rem; }
        .w-32 { width: 8rem; }
        .w-36 { width: 9rem; }
        .w-full { width: 100%; }
        .rounded-md { border-radius: 0.375rem; }
        .rounded-lg { border-radius: 0.5rem; }
        .rounded-xl { border-radius: 0.75rem; }
        .bg-white { background-color: #ffffff; }
        .bg-slate-50 { background-color: #f8fafc; }
        .bg-slate-100 { background-color: #f1f5f9; }
        .bg-rose-50 { background-color: #fff1f2; }
        .bg-emerald-50 { background-color: #ecfdf5; }
        .text-slate-900 { color: #0f172a; }
        .text-slate-800 { color: #1e293b; }
        .text-slate-700 { color: #334155; }
        .text-slate-600 { color: #475569; }
        .text-slate-500 { color: #64748b; }
        .text-slate-400 { color: #94a3b8; }
        .text-rose-600 { color: #e11d48; }
        .text-rose-700 { color: #be123c; }
        .text-rose-800 { color: #9f1239; }
        .text-emerald-700 { color: #047857; }
        .text-emerald-800 { color: #065f46; }
        .text-[#784e34] { color: #784e34; }
        .text-[#5d371f] { color: #5d371f; }
        .border-slate-100 { border-color: #f1f5f9; }
        .border-slate-200 { border-color: #e2e8f0; }
        .border-slate-300 { border-color: #cbd5e1; }
        .border-slate-900 { border-color: #0f172a; }
        .divide-y > * + * { border-top-width: 1px; }
        .divide-slate-200 > * + * { border-color: #e2e8f0; }
        .divide-dashed > * + * { border-style: dashed; }
        .space-y-0\.5 > * + * { margin-top: 0.125rem; }
        .space-y-1 > * + * { margin-top: 0.25rem; }
        .space-y-2 > * + * { margin-top: 0.5rem; }
        .col-span-2 { grid-column: span 2 / span 2; }
      </style>
    </head>
    <body>
      <div class="receipt-isolated">
        ${htmlContent}
      </div>
    </body>
    </html>
  `;

  let iframe = document.getElementById('print-isolated-slip-iframe') as HTMLIFrameElement;
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'print-isolated-slip-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    document.body.appendChild(iframe);
  }

  const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
  if (iframeDoc) {
    iframeDoc.open();
    iframeDoc.write(fullHtml);
    iframeDoc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 250);
  }
}

/**
 * Print by reading innerHTML from an existing DOM element container
 */
export function printElementById(elementId: string, options?: PrintSlipOptions) {
  const el = document.getElementById(elementId);
  if (!el) {
    window.print();
    return;
  }
  printIsolatedHtml({
    title: options?.title || 'In phiếu',
    paperSize: options?.paperSize || 'a4',
    htmlContent: el.innerHTML,
  });
}

/**
 * 1. IN HÓA ĐƠN BÁN HÀNG / HỢP ĐỒNG MAY ĐO / BÀN GIAO (Templates: 'invoice', 'order', 'delivery')
 * Synchronized with settings configured in PrintTemplatesSettings
 */
export function printOrderInvoice(order: any, options?: { templateType?: 'invoice' | 'order' | 'delivery' }) {
  const code = (order?.orderCode || '').toUpperCase();
  let templateKey: 'invoice' | 'order' | 'delivery' = 'invoice';

  if (options?.templateType) {
    templateKey = options.templateType;
  } else if (code.startsWith('HD') || order?.orderType === 'retail' || order?.orderType === 'ready') {
    templateKey = 'invoice';
  } else if (code.startsWith('DH') || order?.orderType === 'custom' || order?.orderType === 'package') {
    templateKey = 'order';
  } else if (code.startsWith('BG')) {
    templateKey = 'delivery';
  } else {
    templateKey = order?.orderType === 'custom' ? 'order' : 'invoice';
  }

  const tpl = getSavedPrintTemplate(templateKey);
  const company = getStoredCompanyInfo();
  const bank = getStoredBankPayment();

  const paperSize = tpl.paperSize || (templateKey === 'order' || templateKey === 'delivery' ? 'a4' : 'k80');
  const title = tpl.title || (templateKey === 'order' ? 'PHIẾU ĐẶT HÀNG & TẠM ỨNG MAY ĐO' : templateKey === 'delivery' ? 'BIÊN BẢN BÀN GIAO & LẮP ĐẶT NỘI THẤT' : 'HÓA ĐƠN BÁN HÀNG & DỊCH VỤ NỘI THẤT');
  const headerNote = tpl.headerNote || 'Hệ thống Showroom Nội Thất Cao Cấp D2 LUXURY';
  const footerNote = tpl.footerNote || 'Cảm ơn Quý khách! Sản phẩm gỗ tự nhiên được bảo hành chính hãng 05 năm.';
  const showLogo = tpl.showLogo ?? true;
  const showQr = tpl.showQr ?? true;
  const showCustomer = tpl.showCustomer ?? true;
  const showSign = tpl.showSignature ?? true;

  const isThermal = paperSize === 'k80' || paperSize === 'k57';
  const remainingValue = Math.max(0, (order.value || 0) - (order.depositAmount || 0));
  const totalInWords = formatMoneyToVietnameseWords(order.value || 0);

  // QR Code URL using VietQR API with fallback
  const qrAmount = remainingValue > 0 ? remainingValue : (order.value || 0);
  const qrUrl = `https://api.vietqr.io/image/970422-${bank.accountNumber}-n2LwzB0.jpg?accountName=${encodeURIComponent(
    bank.accountHolder
  )}&amount=${qrAmount}&addInfo=${encodeURIComponent(order.orderCode || 'DH')}`;

  const htmlContent = `
    <!-- Header: Store Identity -->
    <div class="text-center pb-3 border-b ${isThermal ? 'border-dashed' : ''} border-slate-300">
      ${showLogo ? `
        <div class="flex items-center justify-center gap-2 mb-1">
          <img src="${company.logoUrl || '/logo.png'}" alt="Logo" class="h-8 w-auto object-contain" />
          <div class="text-left">
            <div class="font-bold text-sm text-[#5d371f] uppercase">${company.brandName || 'D2 LUXURY'}</div>
            <div class="text-[9px] text-[#83746c] tracking-wider mt-0.5">${company.businessSector || 'NỘI THẤT GỖ TỰ NHIÊN'}</div>
          </div>
        </div>
      ` : ''}
      <div class="font-bold text-slate-900 text-xs">${company.companyName || 'CÔNG TY CỔ PHẦN NỘI THẤT D2 LUXURY'}</div>
      <div class="text-slate-600 text-[10px]">Đ/c: ${company.address || 'Showroom 01, KĐT Vinhomes Riverside, Long Biên, Hà Nội'}</div>
      <div class="text-slate-600 text-[10px]">Hotline: ${company.hotline || '0986.739.587'} ${company.taxCode ? `| MST: ${company.taxCode}` : ''}</div>
      ${headerNote ? `<div class="text-[10px] text-[#784e34] font-medium pt-0.5">${headerNote}</div>` : ''}
    </div>

    <!-- Document Title & Meta -->
    <div class="text-center py-3 space-y-0.5">
      <h1 class="font-bold ${isThermal ? 'text-sm' : 'text-base'} text-slate-900 uppercase tracking-wide m-0">
        ${title}
      </h1>
      <div class="font-mono text-xs font-semibold text-slate-700">
        Số: <strong class="text-[#784e34]">${order.orderCode || `${tpl.codePrefix || 'HD'}-2026-0889`}</strong>
      </div>
      <div class="text-[10px] text-slate-500 italic">
        Ngày ${order.orderDate || new Date().toLocaleDateString('vi-VN')}
      </div>
    </div>

    <!-- Customer & Project Info -->
    ${showCustomer ? `
      <div class="py-2.5 px-3 bg-slate-50/80 rounded-md border border-slate-200 text-[11px] space-y-1 mb-3">
        <div class="flex justify-between">
          <span><strong class="text-slate-800">Khách hàng:</strong> ${order.customerName || 'Khách vãng lai'}</span>
          <span class="font-mono font-semibold text-slate-700">${order.customerPhone || '---'}</span>
        </div>
        <div>
          <strong class="text-slate-800">Địa chỉ công trình:</strong> ${order.customerAddress || 'Showroom giao nhận'}
        </div>
        <div class="flex justify-between text-slate-600 text-[10px]">
          <span><strong>Chất liệu gỗ:</strong> ${order.woodType ? `Gỗ ${order.woodType}` : 'Gỗ tự nhiên cao cấp'}</span>
          <span><strong>Hạn bàn giao:</strong> <span class="font-mono text-rose-600 font-semibold">${order.deadlineDate || 'Theo hợp đồng'}</span></span>
        </div>
        ${order.showroom || order.branch ? `
          <div class="text-[10px] text-slate-500">
            <strong>Cơ sở phụ trách:</strong> ${order.showroom || order.branch}
          </div>
        ` : ''}
      </div>
    ` : ''}

    <!-- Items Table -->
    <div class="my-3 border-t border-b border-slate-900 py-1">
      <table class="w-full text-left text-[11px] border-collapse">
        <thead>
          <tr class="border-b border-slate-300 font-bold text-slate-900">
            <th class="py-1 text-center w-8">#</th>
            <th class="py-1">Sản phẩm &amp; Quy cách</th>
            <th class="py-1 text-center w-12">ĐVT</th>
            <th class="py-1 text-center w-10">SL</th>
            <th class="py-1 text-right w-24">Đơn giá</th>
            <th class="py-1 text-right w-24">Thành tiền</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-dashed divide-slate-200">
          <tr>
            <td class="py-1.5 text-center font-mono">1</td>
            <td class="py-1.5">
              <div class="font-semibold text-slate-900">${order.productName || 'Sản phẩm nội thất'}</div>
              <div class="text-[9px] text-slate-500">${order.productSpec || (order.woodType ? `Chất liệu gỗ ${order.woodType}, may đo hoàn thiện` : 'Gia công theo thiết kế 3D')}</div>
            </td>
            <td class="py-1.5 text-center text-slate-600">Bộ</td>
            <td class="py-1.5 text-center font-semibold">1</td>
            <td class="py-1.5 text-right font-mono">${(order.value || 0).toLocaleString('vi-VN')}</td>
            <td class="py-1.5 text-right font-mono font-bold text-slate-900">${(order.value || 0).toLocaleString('vi-VN')}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Totals Calculation -->
    <div class="space-y-1 text-right text-[11px] pt-1 border-b ${isThermal ? 'border-dashed' : ''} border-slate-300 pb-2">
      <div class="flex justify-between text-slate-700">
        <span>Tổng giá trị đơn hàng:</span>
        <span class="font-mono font-semibold">${(order.value || 0).toLocaleString('vi-VN')} đ</span>
      </div>
      <div class="flex justify-between text-emerald-700">
        <span>Đã đặt cọc (${order.depositPercent || 0}%):</span>
        <span class="font-mono font-bold">${(order.depositAmount || 0).toLocaleString('vi-VN')} đ</span>
      </div>
      <div class="flex justify-between items-center text-xs font-bold text-slate-900 pt-1.5 border-t border-slate-900">
        <span class="uppercase">Còn lại thanh toán khi giao:</span>
        <span class="text-sm font-mono font-bold text-[#784e34]">${remainingValue.toLocaleString('vi-VN')} đ</span>
      </div>
      <div class="text-left text-[10px] italic text-slate-600 pt-0.5">
        (Bằng chữ: ${totalInWords})
      </div>
    </div>

    <!-- VietQR & Banking -->
    ${showQr ? `
      <div class="mt-3 p-2.5 bg-slate-50 rounded-lg border border-dashed border-slate-300 flex items-center justify-between gap-3">
        <div class="text-left text-[10px] space-y-0.5">
          <div class="font-bold text-slate-900">Quét mã VietQR chuyển khoản nhanh:</div>
          <div>Ngân hàng: <strong>${bank.bankName} (${bank.bankBranch})</strong></div>
          <div>Số tài khoản: <strong class="font-mono font-bold text-[#784e34]">${bank.accountNumber}</strong></div>
          <div>Chủ TK: <strong>${bank.accountHolder}</strong></div>
          <div class="text-[9px] text-slate-500">Nội dung: <strong class="font-mono">${order.orderCode || 'DH'}</strong></div>
        </div>
        <div class="flex flex-col items-center shrink-0">
          <img
            src="${qrUrl}"
            alt="VietQR"
            class="w-16 h-16 rounded border border-slate-200 object-contain bg-white p-0.5"
          />
        </div>
      </div>
    ` : ''}

    <!-- Footer Note -->
    <div class="text-[10px] text-slate-500 italic text-center my-2">
      * ${footerNote}
    </div>

    <!-- Signatures -->
    ${showSign ? `
      <div class="grid ${isThermal ? 'grid-cols-2' : 'grid-cols-3'} gap-2 text-center text-xs mt-3 pt-3 border-t border-slate-200">
        <div>
          <div class="font-bold text-slate-800 uppercase">Khách hàng</div>
          <div class="text-[10px] text-slate-400 italic">(Ký, ghi rõ họ tên)</div>
          <div class="h-12"></div>
          <div class="font-semibold text-slate-700">${order.customerName || 'Quý khách'}</div>
        </div>
        <div>
          <div class="font-bold text-slate-800 uppercase">Người lập phiếu</div>
          <div class="text-[10px] text-slate-400 italic">(Ký, ghi rõ họ tên)</div>
          <div class="h-12"></div>
          <div class="font-semibold text-slate-700">Kế toán bán hàng</div>
        </div>
        ${!isThermal ? `
          <div>
            <div class="font-bold text-slate-800 uppercase">Đại diện Showroom</div>
            <div class="text-[10px] text-slate-400 italic">(Ký, đóng dấu)</div>
            <div class="h-12"></div>
            <div class="font-semibold text-slate-700">${company.brandName || 'D2 LUXURY'}</div>
          </div>
        ` : ''}
      </div>
    ` : ''}
  `;

  printIsolatedHtml({
    title: `${title} - ${order.orderCode}`,
    paperSize,
    htmlContent,
  });
}

/**
 * 2. IN PHIẾU NHẬP KHO HÀNG HÓA & VẬT TƯ (Template: 'purchase')
 */
export function printGoodsReceiptSlip(slip: any) {
  const tpl = getSavedPrintTemplate('purchase');
  const company = getStoredCompanyInfo();
  const paperSize = tpl.paperSize || 'a4';
  const title = tpl.title || 'PHIẾU NHẬP KHO VẬT TƯ GỖ & PHỤ KIỆN';
  const headerNote = tpl.headerNote || 'Kho Tổng Vật Tư & Nguyên Liệu Gỗ Tự Nhiên';
  const footerNote = tpl.footerNote || 'Thủ kho và người giao hàng chịu trách nhiệm về số lượng và quy cách quy chuẩn thực nhập.';
  const showLogo = tpl.showLogo ?? true;
  const showSign = tpl.showSignature ?? true;

  const htmlContent = `
    <!-- Header -->
    <div class="text-center mb-3 pb-3 border-b border-slate-300">
      ${showLogo ? `
        <div class="font-bold text-slate-900 text-sm uppercase">${company.companyName}</div>
      ` : ''}
      <div class="text-xs text-slate-500">${headerNote}</div>
      <h1 class="text-lg font-bold text-slate-900 uppercase mt-2 tracking-wide">${title}</h1>
      <div class="flex items-center justify-center gap-4 text-xs mt-1 text-slate-700">
        <span>Mã phiếu: <strong class="font-mono text-[#784e34]">${slip.code || 'PNK'}</strong></span>
        <span>•</span>
        <span>Ngày nhập: <strong>${slip.importDate || new Date().toLocaleDateString('vi-VN')}</strong></span>
      </div>
    </div>

    <!-- Metadata Grid -->
    <div class="grid grid-cols-2 gap-2 text-xs mb-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
      <div><span class="text-slate-500">Nhà cung cấp:</span> <strong class="text-slate-900">${slip.supplier || 'Đối tác NCC'}</strong></div>
      <div><span class="text-slate-500">Kho tiếp nhận:</span> <strong class="text-[#784e34]">${slip.warehouseName || 'Tổng Kho'}</strong></div>
      <div><span class="text-slate-500">Cán bộ KCS:</span> <strong class="text-slate-800">${slip.inspector || 'Cán bộ KCS'}</strong></div>
      <div><span class="text-slate-500">Hình thức thanh toán:</span> <span class="font-semibold text-slate-800">${slip.paymentMethod || 'Chuyển khoản'}</span></div>
    </div>

    <!-- Items Table -->
    <table class="w-full border-collapse border border-slate-300 text-xs mb-3">
      <thead>
        <tr class="bg-slate-100 text-slate-800 font-bold">
          <th class="border border-slate-300 p-1.5 text-center w-10">STT</th>
          <th class="border border-slate-300 p-1.5 text-left">Tên hàng hóa / Vật tư</th>
          <th class="border border-slate-300 p-1.5 text-left">Quy cách kỹ thuật</th>
          <th class="border border-slate-300 p-1.5 text-center w-16">ĐVT</th>
          <th class="border border-slate-300 p-1.5 text-center w-16">SL</th>
          <th class="border border-slate-300 p-1.5 text-right w-28">Tổng tiền</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="border border-slate-300 p-2 text-center font-mono font-semibold">01</td>
          <td class="border border-slate-300 p-2 font-bold text-slate-900">${slip.itemName || 'Vật tư gỗ'}</td>
          <td class="border border-slate-300 p-2 text-slate-600 font-mono text-[11px]">${slip.spec || 'Quy cách tiêu chuẩn'}</td>
          <td class="border border-slate-300 p-2 text-center">${slip.unit || 'm3'}</td>
          <td class="border border-slate-300 p-2 text-center font-mono font-bold text-slate-900">${slip.quantity || 1}</td>
          <td class="border border-slate-300 p-2 text-right font-mono font-bold text-[#784e34]">
            ${(slip.totalValue || 0).toLocaleString('vi-VN')} đ
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr class="bg-slate-50 font-bold">
          <td colspan="5" class="border border-slate-300 p-2 text-right text-slate-800">Tổng giá trị nhập kho:</td>
          <td class="border border-slate-300 p-2 text-right font-mono text-sm text-[#784e34]">
            ${(slip.totalValue || 0).toLocaleString('vi-VN')} đ
          </td>
        </tr>
      </tfoot>
    </table>

    <div class="text-[10px] text-slate-500 italic mb-3">
      * ${footerNote}
    </div>

    <!-- Signatures -->
    ${showSign ? `
      <div class="grid grid-cols-4 gap-2 text-center text-xs mt-4 pt-3 border-t border-slate-200">
        <div>
          <div class="font-bold text-slate-800 uppercase">Người lập phiếu</div>
          <div class="text-[10px] text-slate-400 italic">(Ký, ghi rõ họ tên)</div>
          <div class="h-12"></div>
          <div class="font-semibold text-slate-700">Người lập</div>
        </div>
        <div>
          <div class="font-bold text-slate-800 uppercase">Thủ kho nhập</div>
          <div class="text-[10px] text-slate-400 italic">(Ký, ghi rõ họ tên)</div>
          <div class="h-12"></div>
          <div class="font-semibold text-slate-700">Thủ kho</div>
        </div>
        <div>
          <div class="font-bold text-slate-800 uppercase">Kỹ thuật KCS</div>
          <div class="text-[10px] text-slate-400 italic">(Ký, ghi rõ họ tên)</div>
          <div class="h-12"></div>
          <div class="font-semibold text-slate-700">${slip.inspector || 'KCS'}</div>
        </div>
        <div>
          <div class="font-bold text-slate-800 uppercase">Đại diện Giao hàng</div>
          <div class="text-[10px] text-slate-400 italic">(Ký, ghi rõ họ tên)</div>
          <div class="h-12"></div>
          <div class="font-semibold text-slate-700">${slip.supplier || 'Đối tác NCC'}</div>
        </div>
      </div>
    ` : ''}
  `;

  printIsolatedHtml({
    title: `${title} - ${slip.code}`,
    paperSize,
    htmlContent,
  });
}

/**
 * 3. IN PHIẾU XUẤT TRẢ HÀNG NCC / BẢO HÀNH (Template: 'return')
 */
export function printGoodsReturnSlip(slip: any) {
  const tpl = getSavedPrintTemplate('return');
  const company = getStoredCompanyInfo();
  const paperSize = tpl.paperSize || 'a5';
  const title = tpl.title || 'PHIẾU TIẾP NHẬN BẢO HÀNH & ĐỔI TRẢ';
  const headerNote = tpl.headerNote || 'Trung Tâm Dịch Vụ Khách Hàng D2 LUXURY';
  const footerNote = tpl.footerNote || 'Cam kết xử lý và phản hồi tình trạng sản phẩm trong vòng 48h làm việc.';
  const showLogo = tpl.showLogo ?? true;
  const showSign = tpl.showSignature ?? true;

  const htmlContent = `
    <div class="text-center mb-3 pb-3 border-b border-slate-300">
      ${showLogo ? `
        <div class="font-bold text-slate-900 text-sm uppercase">${company.companyName}</div>
      ` : ''}
      <div class="text-xs text-slate-500">${headerNote}</div>
      <h1 class="text-lg font-bold text-slate-900 uppercase mt-2 tracking-wide">${title}</h1>
      <div class="flex items-center justify-center gap-4 text-xs mt-1 text-slate-700">
        <span>Mã phiếu: <strong class="font-mono text-rose-700 font-bold">${slip.code || 'TH'}</strong></span>
        <span>•</span>
        <span>Ngày lập: <strong>${slip.returnDate || new Date().toLocaleDateString('vi-VN')}</strong></span>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-2 text-xs mb-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
      <div><span class="text-slate-500">Đối tác:</span> <strong class="text-slate-900">${slip.supplierName || slip.supplier || 'NCC Đối tác'}</strong></div>
      <div><span class="text-slate-500">Mã gốc liên kết:</span> <strong class="font-mono text-[#784e34]">${slip.sourcePurchaseEntryCode || '---'}</strong></div>
      <div><span class="text-slate-500">Kho xuất trả:</span> <strong class="text-[#784e34]">${slip.warehouseName || 'Tổng Kho'}</strong></div>
      <div><span class="text-slate-500">Người lập:</span> <span class="font-semibold text-slate-800">${slip.staffName || 'Nhân viên'}</span></div>
      <div class="col-span-2"><span class="text-slate-500">Lý do:</span> <span class="font-semibold text-rose-800 italic">${slip.reason || 'Sai quy cách / Bảo hành đổi mới'}</span></div>
    </div>

    <table class="w-full border-collapse border border-slate-300 text-xs mb-3">
      <thead>
        <tr class="bg-slate-100 text-slate-800 font-bold">
          <th class="border border-slate-300 p-1.5 text-center w-10">STT</th>
          <th class="border border-slate-300 p-1.5 text-left">Mặt hàng &amp; Quy cách</th>
          <th class="border border-slate-300 p-1.5 text-center w-16">ĐVT</th>
          <th class="border border-slate-300 p-1.5 text-right w-16">Số lượng</th>
          <th class="border border-slate-300 p-1.5 text-right w-28">Tổng tiền</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="border border-slate-300 p-2 text-center font-mono">01</td>
          <td class="border border-slate-300 p-2 font-semibold text-slate-900">${slip.itemName || 'Sản phẩm hoàn trả'}</td>
          <td class="border border-slate-300 p-2 text-center">${slip.unit || 'm3'}</td>
          <td class="border border-slate-300 p-2 text-right font-mono font-bold">${slip.quantity || 1}</td>
          <td class="border border-slate-300 p-2 text-right font-mono font-bold text-rose-700">
            ${(slip.totalGoods || slip.supplierRefund || 0).toLocaleString('vi-VN')} đ
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr class="bg-rose-50/50 font-bold">
          <td colspan="4" class="border border-slate-300 p-2 text-right text-rose-800">Giá trị cấn trừ / hoàn tiền:</td>
          <td class="border border-slate-300 p-2 text-right font-mono text-sm text-rose-700">
            ${(slip.supplierRefund || slip.totalGoods || 0).toLocaleString('vi-VN')} đ
          </td>
        </tr>
      </tfoot>
    </table>

    <div class="text-[10px] text-slate-500 italic mb-3">
      * ${footerNote}
    </div>

    ${showSign ? `
      <div class="grid grid-cols-3 gap-2 text-center text-xs mt-4 pt-3 border-t border-slate-200">
        <div>
          <div class="font-bold text-slate-800 uppercase">Người lập phiếu</div>
          <div class="text-[10px] text-slate-400 italic">(Ký, ghi rõ họ tên)</div>
          <div class="h-12"></div>
          <div class="font-semibold text-slate-700">${slip.staffName || 'Nhân viên'}</div>
        </div>
        <div>
          <div class="font-bold text-slate-800 uppercase">Thủ kho xuất</div>
          <div class="text-[10px] text-slate-400 italic">(Ký, ghi rõ họ tên)</div>
          <div class="h-12"></div>
          <div class="font-semibold text-slate-700">Thủ kho</div>
        </div>
        <div>
          <div class="font-bold text-slate-800 uppercase">Đại diện tiếp nhận</div>
          <div class="text-[10px] text-slate-400 italic">(Ký, đóng dấu)</div>
          <div class="h-12"></div>
          <div class="font-semibold text-slate-700">${slip.supplierName || 'Đối tác'}</div>
        </div>
      </div>
    ` : ''}
  `;

  printIsolatedHtml({
    title: `${title} - ${slip.code}`,
    paperSize,
    htmlContent,
  });
}

/**
 * 4. IN PHIẾU KIỂM KÊ KHO
 */
export function printStocktakeSlip(data: {
  code: string;
  date: string;
  warehouseName: string;
  staffName: string;
  note?: string;
  lines: Array<{
    itemCode: string;
    itemName: string;
    unit: string;
    systemQty: number;
    actualQty: number;
    diffQty: number;
    unitPrice?: number;
    diffValue?: number;
    reason?: string;
  }>;
}) {
  const company = getStoredCompanyInfo();
  const totalDiffValue = data.lines.reduce((acc, curr) => acc + (curr.diffValue || 0), 0);

  const rowsHtml = data.lines
    .map(
      (line, idx) => `
    <tr>
      <td class="border border-slate-300 p-1.5 text-center font-mono">${String(idx + 1).padStart(2, '0')}</td>
      <td class="border border-slate-300 p-1.5 font-mono text-[#784e34]">${line.itemCode}</td>
      <td class="border border-slate-300 p-1.5 font-semibold text-slate-900">${line.itemName}</td>
      <td class="border border-slate-300 p-1.5 text-center">${line.unit}</td>
      <td class="border border-slate-300 p-1.5 text-right font-mono">${line.systemQty}</td>
      <td class="border border-slate-300 p-1.5 text-right font-mono font-bold text-slate-900">${line.actualQty}</td>
      <td class="border border-slate-300 p-1.5 text-right font-mono font-bold ${line.diffQty > 0 ? 'text-emerald-700' : line.diffQty < 0 ? 'text-rose-600' : 'text-slate-600'}">
        ${line.diffQty > 0 ? `+${line.diffQty}` : line.diffQty}
      </td>
      <td class="border border-slate-300 p-1.5 text-right font-mono text-slate-700">${(line.unitPrice || 0).toLocaleString('vi-VN')} đ</td>
      <td class="border border-slate-300 p-1.5 text-right font-mono font-semibold ${(line.diffValue || 0) < 0 ? 'text-rose-600' : 'text-slate-900'}">
        ${(line.diffValue || 0).toLocaleString('vi-VN')} đ
      </td>
      <td class="border border-slate-300 p-1.5 text-slate-600 italic text-[10px]">${line.reason || 'Khớp số liệu'}</td>
    </tr>
  `
    )
    .join('');

  const htmlContent = `
    <div class="text-center pb-3 mb-3 border-b border-slate-300">
      <div class="font-bold text-slate-900 text-sm uppercase">${company.companyName}</div>
      <div class="text-xs text-slate-500">Phân hệ Quản lý Kho Vật tư &amp; Xưởng Sản Xuất</div>
      <h1 class="text-lg font-bold text-slate-900 uppercase mt-2 tracking-wide">
        PHIẾU KIỂM KÊ TỒN KHO HÀNG HÓA
      </h1>
      <div class="flex items-center justify-center gap-4 text-xs mt-1 text-slate-700">
        <span>Mã phiếu: <strong class="font-mono text-[#784e34]">${data.code}</strong></span>
        <span>•</span>
        <span>Ngày kiểm: <strong>${data.date}</strong></span>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-2 text-xs mb-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
      <div><span class="text-slate-500">Kho kiểm kê:</span> <strong class="text-slate-900">${data.warehouseName}</strong></div>
      <div><span class="text-slate-500">Trưởng ban kiểm kê:</span> <strong class="text-slate-900">${data.staffName}</strong></div>
      <div class="col-span-2"><span class="text-slate-500">Ghi chú:</span> <span>${data.note || 'Kiểm kê định kỳ đối soát sổ sách và thực tế.'}</span></div>
    </div>

    <table class="w-full border-collapse border border-slate-300 text-xs mb-3">
      <thead>
        <tr class="bg-slate-100 text-slate-800 font-bold">
          <th class="border border-slate-300 p-1.5 text-center w-8">STT</th>
          <th class="border border-slate-300 p-1.5 text-left w-20">Mã</th>
          <th class="border border-slate-300 p-1.5 text-left">Tên hàng</th>
          <th class="border border-slate-300 p-1.5 text-center w-12">ĐVT</th>
          <th class="border border-slate-300 p-1.5 text-right w-14">Tồn sổ</th>
          <th class="border border-slate-300 p-1.5 text-right w-14">Thực tế</th>
          <th class="border border-slate-300 p-1.5 text-right w-14">Chênh</th>
          <th class="border border-slate-300 p-1.5 text-right w-20">Đơn giá</th>
          <th class="border border-slate-300 p-1.5 text-right w-24">Giá trị lệch</th>
          <th class="border border-slate-300 p-1.5 text-left w-24">Ghi chú</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
      <tfoot>
        <tr class="bg-slate-100 font-bold">
          <td colspan="8" class="border border-slate-300 p-1.5 text-right text-slate-900">
            Tổng giá trị chênh lệch:
          </td>
          <td class="border border-slate-300 p-1.5 text-right font-mono ${totalDiffValue < 0 ? 'text-rose-600' : 'text-slate-900'}">
            ${totalDiffValue.toLocaleString('vi-VN')} đ
          </td>
          <td class="border border-slate-300 p-1.5"></td>
        </tr>
      </tfoot>
    </table>

    <div class="text-[10px] text-slate-500 italic mb-3">
      * Biên bản kiểm kê có giá trị làm căn cứ đối soát sổ sách kho và xử lý tồn kho.
    </div>

    <div class="grid grid-cols-4 gap-2 text-center text-xs mt-4 pt-3 border-t border-slate-200">
      <div>
        <div class="font-bold text-slate-800 uppercase">Trưởng ban kiểm</div>
        <div class="text-[10px] text-slate-400 italic">(Ký, ghi rõ họ tên)</div>
        <div class="h-12"></div>
        <div class="font-semibold text-slate-700">${data.staffName}</div>
      </div>
      <div>
        <div class="font-bold text-slate-800 uppercase">Thủ kho</div>
        <div class="text-[10px] text-slate-400 italic">(Ký, ghi rõ họ tên)</div>
        <div class="h-12"></div>
        <div class="font-semibold text-slate-700">Thủ kho</div>
      </div>
      <div>
        <div class="font-bold text-slate-800 uppercase">Kế toán kho</div>
        <div class="text-[10px] text-slate-400 italic">(Ký, ghi rõ họ tên)</div>
        <div class="h-12"></div>
        <div class="font-semibold text-slate-700">Kế toán</div>
      </div>
      <div>
        <div class="font-bold text-slate-800 uppercase">Ban Giám Đốc</div>
        <div class="text-[10px] text-slate-400 italic">(Ký, đóng dấu)</div>
        <div class="h-12"></div>
        <div class="font-semibold text-slate-700">${company.brandName || 'D2 LUXURY'}</div>
      </div>
    </div>
  `;

  printIsolatedHtml({
    title: `Phiếu kiểm kê kho - ${data.code}`,
    paperSize: 'a4',
    htmlContent,
  });
}

/**
 * 5. IN PHIẾU THU / CHI TIỀN (Template: 'receipt' hoặc 'payment')
 */
export function printCustomerReceipt(receipt: {
  code: string;
  type: 'receipt' | 'payment';
  date: string;
  payerOrReceiver: string;
  phone?: string;
  address?: string;
  reason: string;
  amount: number;
  paymentMethod: string;
  orderCode?: string;
}) {
  const templateKey = receipt.type === 'payment' ? 'payment' : 'receipt';
  const tpl = getSavedPrintTemplate(templateKey);
  const company = getStoredCompanyInfo();
  const bank = getStoredBankPayment();

  const paperSize = tpl.paperSize || 'a5';
  const title = tpl.title || (receipt.type === 'payment' ? 'PHIẾU CHI TIỀN THANH TOÁN' : 'PHIẾU THU TIỀN TẠM ỨNG DỰ ÁN');
  const headerNote = tpl.headerNote || 'Phòng Kế Toán - Tài Chính D2 LUXURY';
  const footerNote = tpl.footerNote || 'Phiếu xác nhận thanh toán khi có đủ chữ ký của thủ quỹ và người giao nhận tiền.';
  const showLogo = tpl.showLogo ?? true;
  const showQr = tpl.showQr ?? true;
  const showSign = tpl.showSignature ?? true;

  const isThermal = paperSize === 'k80' || paperSize === 'k57';
  const amountWords = formatMoneyToVietnameseWords(receipt.amount || 0);

  const qrUrl = `https://api.vietqr.io/image/970422-${bank.accountNumber}-n2LwzB0.jpg?accountName=${encodeURIComponent(
    bank.accountHolder
  )}&amount=${receipt.amount || 0}&addInfo=${encodeURIComponent(receipt.code || 'PT')}`;

  const htmlContent = `
    <div class="text-center pb-2.5 border-b ${isThermal ? 'border-dashed' : ''} border-slate-300">
      ${showLogo ? `
        <div class="font-bold text-slate-900 text-xs uppercase">${company.companyName}</div>
      ` : ''}
      <div class="text-[10px] text-slate-500">${headerNote}</div>
      <h1 class="text-base font-bold text-slate-900 uppercase mt-1 tracking-wide">${title}</h1>
      <div class="text-xs text-slate-600 mt-0.5">
        Mã số: <strong class="font-mono text-[#784e34]">${receipt.code}</strong> &nbsp;|&nbsp; Ngày: <strong>${receipt.date}</strong>
      </div>
    </div>

    <div class="py-2.5 space-y-1.5 text-xs border-b ${isThermal ? 'border-dashed' : ''} border-slate-300">
      <div class="flex justify-between">
        <span class="text-slate-600">${receipt.type === 'payment' ? 'Người nhận tiền:' : 'Người nộp tiền:'}</span>
        <strong class="text-slate-900">${receipt.payerOrReceiver}</strong>
      </div>
      ${receipt.phone ? `
        <div class="flex justify-between">
          <span class="text-slate-600">Số điện thoại:</span>
          <span class="font-mono font-semibold text-slate-800">${receipt.phone}</span>
        </div>
      ` : ''}
      ${receipt.address ? `
        <div class="flex justify-between">
          <span class="text-slate-600">Địa chỉ:</span>
          <span class="text-slate-800">${receipt.address}</span>
        </div>
      ` : ''}
      <div class="flex justify-between">
        <span class="text-slate-600">Lý do thu/chi:</span>
        <span class="font-medium text-slate-900">${receipt.reason}</span>
      </div>
      ${receipt.orderCode ? `
        <div class="flex justify-between">
          <span class="text-slate-600">Đơn hàng liên quan:</span>
          <span class="font-mono font-bold text-[#784e34]">${receipt.orderCode}</span>
        </div>
      ` : ''}
      <div class="flex justify-between items-center pt-1 border-t border-slate-200">
        <span class="font-bold text-slate-900">Số tiền:</span>
        <strong class="font-mono text-base text-[#784e34]">${(receipt.amount || 0).toLocaleString('vi-VN')} đ</strong>
      </div>
      <div class="text-[10px] italic text-slate-600">
        (Bằng chữ: ${amountWords})
      </div>
    </div>

    ${showQr && receipt.type === 'receipt' ? `
      <div class="mt-2.5 p-2 bg-slate-50 rounded border border-dashed border-slate-300 flex items-center justify-between gap-2">
        <div class="text-left text-[10px] space-y-0.5">
          <div class="font-bold text-slate-800">VietQR xác nhận thanh toán:</div>
          <div>Ngân hàng: <strong>${bank.bankName}</strong></div>
          <div>Số TK: <strong class="font-mono text-[#784e34]">${bank.accountNumber}</strong></div>
        </div>
        <img src="${qrUrl}" alt="VietQR" class="w-14 h-14 border rounded p-0.5 bg-white" />
      </div>
    ` : ''}

    <div class="text-[10px] text-slate-500 italic text-center my-2">
      * ${footerNote}
    </div>

    ${showSign ? `
      <div class="grid grid-cols-3 gap-2 text-center text-xs mt-3 pt-2.5 border-t border-slate-200">
        <div>
          <div class="font-bold text-slate-800 uppercase">${receipt.type === 'payment' ? 'Người nhận' : 'Người nộp'}</div>
          <div class="text-[10px] text-slate-400 italic">(Ký, họ tên)</div>
          <div class="h-10"></div>
          <div class="font-semibold text-slate-700">${receipt.payerOrReceiver}</div>
        </div>
        <div>
          <div class="font-bold text-slate-800 uppercase">Thủ quỹ</div>
          <div class="text-[10px] text-slate-400 italic">(Ký, họ tên)</div>
          <div class="h-10"></div>
          <div class="font-semibold text-slate-700">Thủ quỹ</div>
        </div>
        <div>
          <div class="font-bold text-slate-800 uppercase">Kế toán trưởng</div>
          <div class="text-[10px] text-slate-400 italic">(Ký, họ tên)</div>
          <div class="h-10"></div>
          <div class="font-semibold text-slate-700">Kế toán</div>
        </div>
      </div>
    ` : ''}
  `;

  printIsolatedHtml({
    title: `${title} - ${receipt.code}`,
    paperSize,
    htmlContent,
  });
}
