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
    tab: 'Hóa đơn bán hàng',
    title: 'HÓA ĐƠN BÁN HÀNG & DỊCH VỤ NỘI THẤT',
    codePrefix: 'HD',
    paperSize: 'k80',
    showLogo: true,
    showQr: true,
    showCustomer: true,
    showSignature: true,
    headerNote: 'Hệ thống Showroom Nội Thất Cao Cấp D2 LUXURY',
    footerNote: 'Cảm ơn Quý khách! Sản phẩm gỗ tự nhiên được bảo hành chính hãng 05 năm.',
  },
  order: {
    key: 'order',
    tab: 'Phiếu đặt hàng / Cọc',
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
  delivery: {
    key: 'delivery',
    tab: 'Phiếu giao hàng / Lắp đặt',
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
  return: {
    key: 'return',
    tab: 'Phiếu trả hàng / Bảo hành',
    title: 'PHIẾU XUẤT TRẢ HÀNG & BẢO HÀNH NHÀ CUNG CẤP',
    codePrefix: 'TH',
    paperSize: 'a4',
    showLogo: true,
    showQr: false,
    showCustomer: true,
    showSignature: true,
    headerNote: 'Trung Tâm Dịch Vụ & Kho Vật Tư D2 LUXURY',
    footerNote: 'Mặt hàng hoàn trả theo biên bản kiểm định KCS và thỏa thuận bảo hành với Nhà cung cấp.',
  },
  purchase: {
    key: 'purchase',
    tab: 'Phiếu nhập kho vật tư',
    title: 'PHIẾU NHẬP KHO HÀNG HÓA & VẬT TƯ GỖ',
    codePrefix: 'PNK',
    paperSize: 'a4',
    showLogo: true,
    showQr: false,
    showCustomer: false,
    showSignature: true,
    headerNote: 'Kho Tổng Vật Tư & Nguyên Liệu Gỗ Tự Nhiên Mộc Gia Atelier',
    footerNote: 'Thủ kho và người giao hàng chịu trách nhiệm về số lượng và quy cách quy chuẩn thực nhập.',
  },
  receipt: {
    key: 'receipt',
    tab: 'Phiếu thu tiền',
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
        .gap-2 { gap: 0.5rem; }
        .gap-4 { gap: 1rem; }
        .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
        .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
        .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
        .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
        .p-2 { padding: 0.5rem; }
        .p-3 { padding: 0.75rem; }
        .p-4 { padding: 1rem; }
        .my-2 { margin-top: 0.5rem; margin-bottom: 0.5rem; }
        .my-3 { margin-top: 0.75rem; margin-bottom: 0.75rem; }
        .mt-1 { margin-top: 0.25rem; }
        .mt-2 { margin-top: 0.5rem; }
        .mt-3 { margin-top: 0.75rem; }
        .mt-4 { margin-top: 1rem; }
        .mt-6 { margin-top: 1.5rem; }
        .mb-2 { margin-bottom: 0.5rem; }
        .mb-3 { margin-bottom: 0.75rem; }
        .mb-4 { margin-bottom: 1rem; }
        .h-8 { height: 2rem; }
        .h-12 { height: 3rem; }
        .h-16 { height: 4rem; }
        .h-20 { height: 5rem; }
        .w-20 { width: 5rem; }
        .w-24 { width: 6rem; }
        .rounded-md { border-radius: 0.375rem; }
        .rounded-lg { border-radius: 0.5rem; }
        .bg-slate-50 { background-color: #f8fafc; }
        .bg-slate-100 { background-color: #f1f5f9; }
        .bg-rose-50 { background-color: #fff1f2; }
        .bg-amber-50 { background-color: #fffbeb; }
        .text-slate-900 { color: #0f172a; }
        .text-slate-800 { color: #1e293b; }
        .text-slate-700 { color: #334155; }
        .text-slate-600 { color: #475569; }
        .text-slate-500 { color: #64748b; }
        .text-slate-400 { color: #94a3b8; }
        .text-rose-600 { color: #e11d48; }
        .text-rose-700 { color: #be123c; }
        .text-emerald-700 { color: #047857; }
        .text-amber-800 { color: #92400e; }
        .text-[#784e34] { color: #784e34; }
        .text-[#5d371f] { color: #5d371f; }
        .border-slate-200 { border-color: #e2e8f0; }
        .border-slate-300 { border-color: #cbd5e1; }
        .border-slate-900 { border-color: #0f172a; }
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
 * 1. IN HÓA ĐƠN BÁN HÀNG / HỢP ĐỒNG MAY ĐO (Templates: 'invoice' hoặc 'order')
 */
export function printOrderInvoice(order: any, options?: { templateType?: 'invoice' | 'order' | 'delivery' }) {
  const templateKey = options?.templateType || (order.orderType === 'custom' ? 'order' : 'invoice');
  const tpl = getSavedPrintTemplate(templateKey);

  const paperSize = tpl.paperSize || (templateKey === 'order' ? 'a4' : 'k80');
  const title = tpl.title || 'HÓA ĐƠN BÁN HÀNG & DỊCH VỤ NỘI THẤT';
  const headerNote = tpl.headerNote || 'Hệ thống Showroom Nội Thất Cao Cấp D2 LUXURY';
  const footerNote = tpl.footerNote || 'Cảm ơn Quý khách! Sản phẩm gỗ tự nhiên được bảo hành chính hãng 05 năm.';
  const showLogo = tpl.showLogo ?? true;
  const showQr = tpl.showQr ?? true;
  const showCustomer = tpl.showCustomer ?? true;
  const showSign = tpl.showSignature ?? true;

  const isThermal = paperSize === 'k80' || paperSize === 'k57';
  const remainingValue = (order.value || 0) - (order.depositAmount || 0);

  const htmlContent = `
    <!-- Header Brand -->
    <div class="text-center pb-2 border-b ${isThermal ? 'border-dashed' : ''} border-slate-300">
      ${showLogo ? `
        <div class="font-bold text-slate-900 ${isThermal ? 'text-sm' : 'text-base'} uppercase tracking-wide">
          NỘI THẤT CAO CẤP D2 LUXURY
        </div>
      ` : ''}
      <div class="text-[11px] text-slate-600 mt-0.5">${headerNote}</div>
      <div class="text-[11px] text-slate-600">Hotline: 098.888.6666 • Showroom &amp; Xưởng: Tòa V3 The Vesta, Phú Lãm, Hà Đông</div>
      <div class="font-bold text-slate-900 ${isThermal ? 'text-sm mt-2' : 'text-base mt-3'} uppercase">
        ${title}
      </div>
      <div class="text-xs text-slate-500 mt-0.5">
        Mã số: <strong class="font-mono text-[#784e34]">${order.orderCode}</strong> &nbsp;|&nbsp; Ngày: <strong>${order.orderDate}</strong>
      </div>
    </div>

    <!-- Customer & Delivery Info -->
    ${showCustomer ? `
      <div class="py-2.5 ${isThermal ? 'space-y-1 text-xs' : 'grid grid-cols-2 gap-2 text-xs'} border-b ${isThermal ? 'border-dashed' : ''} border-slate-300">
        <div><span class="text-slate-500">Khách hàng:</span> <strong class="text-slate-900">${order.customerName}</strong></div>
        <div><span class="text-slate-500">Điện thoại:</span> <strong class="font-mono text-slate-900">${order.customerPhone}</strong></div>
        <div class="${isThermal ? '' : 'col-span-2'}"><span class="text-slate-500">Địa chỉ công trình:</span> <span>${order.customerAddress || 'Showroom giao nhận'}</span></div>
        ${order.woodType ? `<div><span class="text-slate-500">Chất liệu gỗ:</span> <strong class="text-[#784e34] capitalize">Gỗ ${order.woodType}</strong></div>` : ''}
        <div><span class="text-slate-500">Hạn bàn giao:</span> <strong class="font-mono text-rose-600">${order.deadlineDate}</strong></div>
      </div>
    ` : ''}

    <!-- Product Items Table -->
    <table class="w-full my-2 text-xs border border-slate-300">
      <thead>
        <tr class="bg-slate-100 text-slate-800 font-bold">
          <th class="text-left border border-slate-300 p-1.5">Sản phẩm / Quy cách</th>
          <th class="text-center border border-slate-300 p-1.5 w-12">SL</th>
          <th class="text-right border border-slate-300 p-1.5 ${isThermal ? 'w-24' : 'w-32'}">Thành tiền</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="border border-slate-300 p-1.5 text-slate-900">
            <div class="font-semibold">${order.productName}</div>
            <div class="text-[11px] text-slate-500 mt-0.5">${order.productSpec || 'Gia công theo thiết kế 3D'}</div>
          </td>
          <td class="text-center border border-slate-300 p-1.5 font-mono">1</td>
          <td class="text-right border border-slate-300 p-1.5 font-mono font-semibold text-slate-900">
            ${(order.value || 0).toLocaleString('vi-VN')} đ
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Financial Summary -->
    <div class="py-2 space-y-1 text-xs border-b ${isThermal ? 'border-dashed' : ''} border-slate-300">
      <div class="flex justify-between">
        <span class="text-slate-600">Tổng giá trị đơn hàng:</span>
        <strong class="font-mono text-slate-900 text-sm">${(order.value || 0).toLocaleString('vi-VN')} đ</strong>
      </div>
      <div class="flex justify-between text-emerald-700">
        <span>Đã đặt cọc (${order.depositPercent || 0}%):</span>
        <strong class="font-mono">${(order.depositAmount || 0).toLocaleString('vi-VN')} đ</strong>
      </div>
      <div class="flex justify-between text-rose-600 font-bold">
        <span>Còn lại cần thanh toán khi giao:</span>
        <span class="font-mono">${remainingValue.toLocaleString('vi-VN')} đ</span>
      </div>
    </div>

    <!-- VietQR & Footer Note -->
    ${showQr ? `
      <div class="py-2.5 flex items-center justify-between gap-3 text-xs border-b ${isThermal ? 'border-dashed' : ''} border-slate-300 bg-slate-50 p-2 rounded-lg my-2">
        <div class="space-y-0.5 text-[11px]">
          <div class="font-bold text-slate-800">Quét mã VietQR chuyển khoản nhanh:</div>
          <div>Ngân hàng: <strong>MBBank (Hà Nội)</strong></div>
          <div>Số TK: <strong class="font-mono text-emerald-700 font-bold">0988886666</strong></div>
          <div>Nội dung: <strong class="font-mono text-[#784e34]">${order.orderCode}</strong></div>
        </div>
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=2|99|0988886666|CTCP%20NOI%20THAT%20D2|${order.orderCode}|0|0|${remainingValue > 0 ? remainingValue : order.value}" alt="VietQR" class="w-16 h-16 border border-slate-300 rounded p-0.5 bg-white" />
      </div>
    ` : ''}

    <div class="text-[11px] text-slate-600 my-2 italic text-center">
      * ${footerNote}
    </div>

    <!-- Signatures -->
    ${showSign ? `
      <div class="grid ${isThermal ? 'grid-cols-2' : 'grid-cols-3'} gap-2 text-center text-xs mt-4 pt-3 border-t border-slate-300">
        <div>
          <div class="font-bold text-slate-800 uppercase">Khách hàng</div>
          <div class="text-[10px] text-slate-400 italic">(Ký, ghi rõ họ tên)</div>
          <div class="h-12"></div>
          <div class="font-semibold text-slate-700">${order.customerName}</div>
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
            <div class="font-semibold text-slate-700">D2 LUXURY</div>
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
  const paperSize = tpl.paperSize || 'a4';
  const title = tpl.title || 'PHIẾU NHẬP KHO HÀNG HÓA & VẬT TƯ GỖ';
  const headerNote = tpl.headerNote || 'Kho Tổng Vật Tư & Nguyên Liệu Gỗ Tự Nhiên Mộc Gia Atelier';
  const footerNote = tpl.footerNote || 'Thủ kho và người giao hàng chịu trách nhiệm về số lượng và quy cách quy chuẩn thực nhập.';
  const showLogo = tpl.showLogo ?? true;
  const showSign = tpl.showSignature ?? true;

  const htmlContent = `
    <!-- Header -->
    <div class="text-center mb-4 pb-3 border-b border-slate-300">
      ${showLogo ? `
        <div class="font-bold text-slate-900 text-sm uppercase">CÔNG TY CỔ PHẦN NỘI THẤT MỘC GIA ATELIER</div>
      ` : ''}
      <div class="text-xs text-slate-500">${headerNote}</div>
      <h1 class="text-xl font-bold text-slate-900 uppercase mt-2 tracking-wide">${title}</h1>
      <div class="text-xs text-slate-500 italic">(Goods Receipt Note / Stock Inward Slip)</div>
      <div class="flex items-center justify-center gap-4 text-xs mt-2 text-slate-700">
        <span>Mã phiếu: <strong class="font-mono text-[#784e34]">${slip.code}</strong></span>
        <span>•</span>
        <span>Ngày nhập: <strong>${slip.importDate || new Date().toLocaleDateString('vi-VN')}</strong></span>
      </div>
    </div>

    <!-- Metadata Grid -->
    <div class="grid grid-cols-2 gap-3 text-xs mb-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
      <div><span class="text-slate-500">Nhà cung cấp đối tác:</span> <strong class="text-slate-900">${slip.supplier || 'Nhà Cung Cấp Gỗ An Cường'}</strong></div>
      <div><span class="text-slate-500">Kho tiếp nhận:</span> <strong class="text-[#784e34]">${slip.warehouseName || 'Tổng Kho Bình Chánh'}</strong></div>
      <div><span class="text-slate-500">Cán bộ KCS / Nhận hàng:</span> <strong class="text-slate-800">${slip.inspector || 'Nguyễn Văn Nam (KCS)'}</strong></div>
      <div><span class="text-slate-500">Hình thức thanh toán:</span> <span class="font-semibold text-slate-800">${slip.paymentMethod || 'Chuyển khoản'}</span></div>
    </div>

    <!-- Items Table -->
    <table class="w-full border-collapse border border-slate-300 text-xs mb-3">
      <thead>
        <tr class="bg-slate-100 text-slate-800 font-bold">
          <th class="border border-slate-300 p-2 text-center w-12">STT</th>
          <th class="border border-slate-300 p-2 text-left">Tên hàng hóa / Vật tư nhập</th>
          <th class="border border-slate-300 p-2 text-left">Quy cách kỹ thuật</th>
          <th class="border border-slate-300 p-2 text-center w-20">ĐVT</th>
          <th class="border border-slate-300 p-2 text-center w-24">Số lượng</th>
          <th class="border border-slate-300 p-2 text-right w-36">Tổng thành tiền</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="border border-slate-300 p-2 text-center font-mono font-semibold">01</td>
          <td class="border border-slate-300 p-2 font-bold text-slate-900">${slip.itemName || 'Gỗ Óc Chó Nhập Khẩu Bắc Mỹ'}</td>
          <td class="border border-slate-300 p-2 text-slate-600 font-mono text-[11px]">${slip.spec || 'Dày 50mm x Rộng 250mm x Dài 2800mm'}</td>
          <td class="border border-slate-300 p-2 text-center">${slip.unit || 'm3'}</td>
          <td class="border border-slate-300 p-2 text-center font-mono font-bold text-slate-900">${slip.quantity || 1}</td>
          <td class="border border-slate-300 p-2 text-right font-mono font-bold text-[#784e34]">
            ${(slip.totalValue || 0).toLocaleString('vi-VN')} đ
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr class="bg-slate-50 font-bold">
          <td colspan="5" class="border border-slate-300 p-2 text-right text-slate-800">Tổng giá trị nhập kho (đã nghiệm thu):</td>
          <td class="border border-slate-300 p-2 text-right font-mono text-sm text-[#784e34]">
            ${(slip.totalValue || 0).toLocaleString('vi-VN')} đ
          </td>
        </tr>
      </tfoot>
    </table>

    <div class="text-[11px] text-slate-500 italic mb-4">
      * ${footerNote}
    </div>

    <!-- Signatures -->
    ${showSign ? `
      <div class="grid grid-cols-4 gap-2 text-center text-xs mt-6 pt-4 border-t border-slate-200">
        <div>
          <div class="font-bold text-slate-800 uppercase">Người lập phiếu</div>
          <div class="text-[11px] text-slate-400 italic">(Ký, ghi rõ họ tên)</div>
          <div class="h-16"></div>
          <div class="font-semibold text-slate-700">Trần Minh Quân</div>
        </div>
        <div>
          <div class="font-bold text-slate-800 uppercase">Thủ kho nhập</div>
          <div class="text-[11px] text-slate-400 italic">(Ký, ghi rõ họ tên)</div>
          <div class="h-16"></div>
          <div class="font-semibold text-slate-700">Phạm Văn Tuấn</div>
        </div>
        <div>
          <div class="font-bold text-slate-800 uppercase">Kỹ thuật KCS</div>
          <div class="text-[11px] text-slate-400 italic">(Ký, ghi rõ họ tên)</div>
          <div class="h-16"></div>
          <div class="font-semibold text-slate-700">${slip.inspector || 'Nguyễn Văn Nam'}</div>
        </div>
        <div>
          <div class="font-bold text-slate-800 uppercase">Đại diện Giao hàng</div>
          <div class="text-[11px] text-slate-400 italic">(Ký, ghi rõ họ tên)</div>
          <div class="h-16"></div>
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
  const paperSize = tpl.paperSize || 'a4';
  const title = tpl.title || 'PHIẾU XUẤT TRẢ HÀNG & BẢO HÀNH NHÀ CUNG CẤP';
  const headerNote = tpl.headerNote || 'Trung Tâm Dịch Vụ & Kho Vật Tư D2 LUXURY';
  const footerNote = tpl.footerNote || 'Mặt hàng hoàn trả theo biên bản kiểm định KCS và thỏa thuận bảo hành với Nhà cung cấp.';
  const showLogo = tpl.showLogo ?? true;
  const showSign = tpl.showSignature ?? true;

  const htmlContent = `
    <!-- Header -->
    <div class="text-center mb-4 pb-3 border-b border-slate-300">
      ${showLogo ? `
        <div class="font-bold text-slate-900 text-sm uppercase">CÔNG TY CỔ PHẦN NỘI THẤT MỘC GIA ATELIER</div>
      ` : ''}
      <div class="text-xs text-slate-500">${headerNote}</div>
      <h1 class="text-xl font-bold text-slate-900 uppercase mt-2 tracking-wide">${title}</h1>
      <div class="text-xs text-slate-500 italic">(Goods Return Note / Purchase Return Voucher)</div>
      <div class="flex items-center justify-center gap-4 text-xs mt-2 text-slate-700">
        <span>Mã phiếu: <strong class="font-mono text-rose-700 font-bold">${slip.code}</strong></span>
        <span>•</span>
        <span>Ngày lập: <strong>${slip.returnDate || new Date().toLocaleDateString('vi-VN')}</strong></span>
      </div>
    </div>

    <!-- Metadata Grid -->
    <div class="grid grid-cols-2 gap-3 text-xs mb-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
      <div><span class="text-slate-500">Nhà cung cấp nhận hoàn trả:</span> <strong class="text-slate-900">${slip.supplierName || 'NCC Đối tác'}</strong></div>
      <div><span class="text-slate-500">Phiếu nhập gốc liên kết:</span> <strong class="font-mono text-[#784e34]">${slip.sourcePurchaseEntryCode || '---'}</strong></div>
      <div><span class="text-slate-500">Kho xuất trả:</span> <strong class="text-[#784e34]">${slip.warehouseName || 'Tổng Kho Bình Chánh'}</strong></div>
      <div><span class="text-slate-500">Người lập phiếu:</span> <span class="font-semibold text-slate-800">${slip.staffName || 'Nguyễn Văn Nam (KCS)'}</span></div>
      <div><span class="text-slate-500">Phương án giải quyết:</span> <strong class="text-slate-900">${slip.solution || slip.statusLabel || 'Hoàn tiền / Đổi bù'}</strong></div>
      <div><span class="text-slate-500">Hình thức hoàn tiền:</span> <span class="font-semibold text-slate-800">${slip.paymentMethod || 'Chuyển khoản'}</span></div>
      <div class="col-span-2"><span class="text-slate-500">Lý do hoàn trả:</span> <span class="font-semibold text-rose-800 italic">${slip.reason || 'Sai quy cách hợp đồng / Không đạt KCS'}</span></div>
    </div>

    <!-- Items Table -->
    <table class="w-full border-collapse border border-slate-300 text-xs mb-3">
      <thead>
        <tr class="bg-slate-100 text-slate-800 font-bold">
          <th class="border border-slate-300 p-2 text-center w-12">STT</th>
          <th class="border border-slate-300 p-2 text-left">Tên mặt hàng &amp; Quy cách hoàn trả</th>
          <th class="border border-slate-300 p-2 text-center w-20">ĐVT</th>
          <th class="border border-slate-300 p-2 text-right w-24">Số lượng</th>
          <th class="border border-slate-300 p-2 text-right w-32">Giá trả lại</th>
          <th class="border border-slate-300 p-2 text-right w-36">Tổng thành tiền</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="border border-slate-300 p-2.5 text-center font-mono font-semibold">01</td>
          <td class="border border-slate-300 p-2.5 font-semibold text-slate-900">
            <div>${slip.itemName || 'Gỗ nguyên liệu'}</div>
            ${slip.spec ? `<div class="text-[11px] text-slate-500 font-mono mt-0.5">${slip.spec}</div>` : ''}
          </td>
          <td class="border border-slate-300 p-2.5 text-center">${slip.unit || 'm3'}</td>
          <td class="border border-slate-300 p-2.5 text-right font-mono font-bold text-slate-900">${slip.quantity || 1}</td>
          <td class="border border-slate-300 p-2.5 text-right font-mono text-slate-700">
            ${(slip.returnPrice || slip.purchasePrice || 0).toLocaleString('vi-VN')} đ
          </td>
          <td class="border border-slate-300 p-2.5 text-right font-mono font-bold text-rose-700">
            ${(slip.totalGoods || 0).toLocaleString('vi-VN')} đ
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr class="bg-rose-50/50 font-bold">
          <td colspan="5" class="border border-slate-300 p-2.5 text-right text-rose-800">NCC cần hoàn trả / cấn trừ:</td>
          <td class="border border-slate-300 p-2.5 text-right font-mono text-sm text-rose-700">
            ${(slip.supplierRefund || slip.totalGoods || 0).toLocaleString('vi-VN')} đ
          </td>
        </tr>
      </tfoot>
    </table>

    <div class="text-[11px] text-slate-500 italic mb-4">
      * ${footerNote}
    </div>

    <!-- Signatures -->
    ${showSign ? `
      <div class="grid grid-cols-4 gap-2 text-center text-xs mt-6 pt-4 border-t border-slate-200">
        <div>
          <div class="font-bold text-slate-800 uppercase">Người lập phiếu</div>
          <div class="text-[11px] text-slate-400 italic">(Ký, ghi rõ họ tên)</div>
          <div class="h-16"></div>
          <div class="font-semibold text-slate-700">${slip.staffName || 'Nguyễn Văn Nam'}</div>
        </div>
        <div>
          <div class="font-bold text-slate-800 uppercase">Thủ kho xuất</div>
          <div class="text-[11px] text-slate-400 italic">(Ký, ghi rõ họ tên)</div>
          <div class="h-16"></div>
          <div class="font-semibold text-slate-700">Phạm Văn Tuấn</div>
        </div>
        <div>
          <div class="font-bold text-slate-800 uppercase">KCS / Kiểm định</div>
          <div class="text-[11px] text-slate-400 italic">(Ký, ghi rõ họ tên)</div>
          <div class="h-16"></div>
          <div class="font-semibold text-slate-700">Nguyễn Đình Bảo</div>
        </div>
        <div>
          <div class="font-bold text-slate-800 uppercase">Đại diện NCC</div>
          <div class="text-[11px] text-slate-400 italic">(Ký, đóng dấu)</div>
          <div class="h-16"></div>
          <div class="font-semibold text-slate-700">${slip.supplierName || 'Đối tác NCC'}</div>
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
 * 4. IN PHIẾU KIỂM KÊ KHO (Template: 'stocktake' - Phiếu kiểm kê A4)
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
  const totalDiffValue = data.lines.reduce((acc, curr) => acc + (curr.diffValue || 0), 0);

  const rowsHtml = data.lines
    .map(
      (line, idx) => `
    <tr>
      <td class="border border-slate-300 p-2 text-center font-mono">${String(idx + 1).padStart(2, '0')}</td>
      <td class="border border-slate-300 p-2 font-mono text-[#784e34]">${line.itemCode}</td>
      <td class="border border-slate-300 p-2 font-semibold text-slate-900">${line.itemName}</td>
      <td class="border border-slate-300 p-2 text-center">${line.unit}</td>
      <td class="border border-slate-300 p-2 text-right font-mono">${line.systemQty}</td>
      <td class="border border-slate-300 p-2 text-right font-mono font-bold text-slate-900">${line.actualQty}</td>
      <td class="border border-slate-300 p-2 text-right font-mono font-bold ${line.diffQty > 0 ? 'text-emerald-700' : line.diffQty < 0 ? 'text-rose-600' : 'text-slate-600'}">
        ${line.diffQty > 0 ? `+${line.diffQty}` : line.diffQty}
      </td>
      <td class="border border-slate-300 p-2 text-right font-mono text-slate-700">${(line.unitPrice || 0).toLocaleString('vi-VN')} đ</td>
      <td class="border border-slate-300 p-2 text-right font-mono font-semibold ${(line.diffValue || 0) < 0 ? 'text-rose-600' : 'text-slate-900'}">
        ${(line.diffValue || 0).toLocaleString('vi-VN')} đ
      </td>
      <td class="border border-slate-300 p-2 text-slate-600 italic text-[11px]">${line.reason || 'Khớp số liệu'}</td>
    </tr>
  `
    )
    .join('');

  const htmlContent = `
    <div class="text-center pb-3 mb-3 border-b border-slate-300">
      <div class="font-bold text-slate-900 text-sm uppercase">CÔNG TY CỔ PHẦN NỘI THẤT MỘC GIA ATELIER</div>
      <div class="text-xs text-slate-500">Phân hệ Quản lý Kho Vật tư &amp; Thành phẩm</div>
      <h1 class="text-xl font-bold text-slate-900 uppercase mt-2 tracking-wide">
        PHIẾU KIỂM KÊ TỒN KHO HÀNG HÓA
      </h1>
      <div class="text-xs text-slate-500 italic">(Stocktake &amp; Physical Inventory Audit Sheet)</div>
      <div class="flex items-center justify-center gap-4 text-xs mt-2 text-slate-700">
        <span>Mã phiếu kiểm: <strong class="font-mono text-[#784e34]">${data.code}</strong></span>
        <span>•</span>
        <span>Ngày kiểm kê: <strong>${data.date}</strong></span>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3 text-xs mb-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
      <div><span class="text-slate-500">Kho thực hiện kiểm kê:</span> <strong class="text-slate-900">${data.warehouseName}</strong></div>
      <div><span class="text-slate-500">Cán bộ trưởng ban kiểm kê:</span> <strong class="text-slate-900">${data.staffName}</strong></div>
      <div class="col-span-2"><span class="text-slate-500">Mục đích / Ghi chú kiểm:</span> <span>${data.note || 'Kiểm kê định kỳ tháng đối chiếu sổ cái và thực tế hàng tồn.'}</span></div>
    </div>

    <table class="w-full border-collapse border border-slate-300 text-xs mb-3">
      <thead>
        <tr class="bg-slate-100 text-slate-800 font-bold">
          <th class="border border-slate-300 p-2 text-center w-10">STT</th>
          <th class="border border-slate-300 p-2 text-left w-24">Mã hàng</th>
          <th class="border border-slate-300 p-2 text-left">Tên hàng hóa / Vật tư</th>
          <th class="border border-slate-300 p-2 text-center w-14">ĐVT</th>
          <th class="border border-slate-300 p-2 text-right w-16">Tồn sổ</th>
          <th class="border border-slate-300 p-2 text-right w-16">Thực tế</th>
          <th class="border border-slate-300 p-2 text-right w-16">Chênh lệch</th>
          <th class="border border-slate-300 p-2 text-right w-24">Đơn giá</th>
          <th class="border border-slate-300 p-2 text-right w-28">Giá trị lệch</th>
          <th class="border border-slate-300 p-2 text-left w-32">Ghi chú</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
      <tfoot>
        <tr class="bg-slate-100 font-bold">
          <td colspan="8" class="border border-slate-300 p-2 text-right text-slate-900">
            Tổng giá trị chênh lệch kiểm kê:
          </td>
          <td class="border border-slate-300 p-2 text-right font-mono ${totalDiffValue < 0 ? 'text-rose-600' : 'text-slate-900'}">
            ${totalDiffValue.toLocaleString('vi-VN')} đ
          </td>
          <td class="border border-slate-300 p-2"></td>
        </tr>
      </tfoot>
    </table>

    <div class="text-[11px] text-slate-500 italic mb-4">
      * Biên bản kiểm kê có giá trị làm căn cứ điều chỉnh sổ sách tồn kho kế toán và xử lý trách nhiệm bồi hoàn (nếu có).
    </div>

    <div class="grid grid-cols-4 gap-2 text-center text-xs mt-6 pt-4 border-t border-slate-200">
      <div>
        <div class="font-bold text-slate-800 uppercase">Trưởng ban kiểm kê</div>
        <div class="text-[11px] text-slate-400 italic">(Ký, ghi rõ họ tên)</div>
        <div class="h-16"></div>
        <div class="font-semibold text-slate-700">${data.staffName}</div>
      </div>
      <div>
        <div class="font-bold text-slate-800 uppercase">Thủ kho</div>
        <div class="text-[11px] text-slate-400 italic">(Ký, ghi rõ họ tên)</div>
        <div class="h-16"></div>
        <div class="font-semibold text-slate-700">Phạm Văn Tuấn</div>
      </div>
      <div>
        <div class="font-bold text-slate-800 uppercase">Kế toán kho</div>
        <div class="text-[11px] text-slate-400 italic">(Ký, ghi rõ họ tên)</div>
        <div class="h-16"></div>
        <div class="font-semibold text-slate-700">Nguyễn Thu Trang</div>
      </div>
      <div>
        <div class="font-bold text-slate-800 uppercase">Ban Giám Đốc Duyệt</div>
        <div class="text-[11px] text-slate-400 italic">(Ký, đóng dấu)</div>
        <div class="h-16"></div>
        <div class="font-semibold text-slate-700">D2 LUXURY</div>
      </div>
    </div>
  `;

  printIsolatedHtml({
    title: `Phiếu kiểm kê kho - ${data.code}`,
    paperSize: 'a4',
    htmlContent,
  });
}
