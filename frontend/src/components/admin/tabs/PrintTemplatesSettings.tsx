'use client';

import React, { useState, useEffect } from 'react';
import {
  Button,
  Segmented,
  Tag,
  Form,
  Input,
  Select,
  Switch,
  Space,
  Divider,
  App,
  Card,
  Row,
  Col,
  Tooltip,
} from 'antd';
import {
  PrinterOutlined,
  EditOutlined,
  CopyOutlined,
  ReloadOutlined,
  CheckOutlined,
  PlusOutlined,
  EyeOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  QrcodeOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { AdminFormDrawer } from '@/components/admin';

export interface PrintTemplateConfig {
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

const DEFAULT_PRINT_TEMPLATES: PrintTemplateConfig[] = [
  {
    key: 'invoice',
    tab: 'Hóa đơn bán hàng',
    select: 'Mẫu hóa đơn thanh toán Showroom',
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
  {
    key: 'order',
    tab: 'Phiếu đặt hàng / Cọc',
    select: 'Mẫu hợp đồng đặt cọc may đo',
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
  {
    key: 'delivery',
    tab: 'Phiếu giao hàng / Lắp đặt',
    select: 'Mẫu biên bản bàn giao công trình',
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
  {
    key: 'return',
    tab: 'Phiếu trả hàng / Bảo hành',
    select: 'Mẫu phiếu đổi trả hàng bảo hành',
    title: 'PHIẾU TIẾP NHẬN BẢO HÀNH & ĐỔI TRẢ',
    codePrefix: 'TH',
    paperSize: 'a5',
    showLogo: true,
    showQr: false,
    showCustomer: true,
    showSignature: true,
    headerNote: 'Trung Tâm Dịch Vụ Khách Hàng D2 LUXURY',
    footerNote: 'Cam kết xử lý và phản hồi tình trạng sản phẩm trong vòng 48h làm việc.',
  },
  {
    key: 'purchase',
    tab: 'Phiếu nhập kho vật tư',
    select: 'Mẫu phiếu nhập kho xưởng sản xuất',
    title: 'PHIẾU NHẬP KHO VẬT TƯ GỖ & PHỤ KIỆN',
    codePrefix: 'PNK',
    paperSize: 'a4',
    showLogo: true,
    showQr: false,
    showCustomer: false,
    showSignature: true,
    headerNote: 'Kho Tổng Vật Tư & Nguyên Liệu Gỗ Tự Nhiên',
    footerNote: 'Thủ kho và người giao hàng chịu trách nhiệm về số lượng và quy cách quy chuẩn thực nhập.',
  },
  {
    key: 'receipt',
    tab: 'Phiếu thu tiền',
    select: 'Mẫu phiếu thu tiền mặt / chuyển khoản',
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
  {
    key: 'payment',
    tab: 'Phiếu chi',
    select: 'Mẫu phiếu chi thanh toán xưởng / NCC',
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
];

const VARIABLE_TAGS = [
  { label: 'Logo cửa hàng', tag: '{Logo_Cua_Hang}' },
  { label: 'Tên thương hiệu', tag: '{Ten_Cua_Hang}' },
  { label: 'Địa chỉ Showroom', tag: '{Dia_Chi_Cua_Hang}' },
  { label: 'Số điện thoại', tag: '{So_Dien_Thoai}' },
  { label: 'Mã số phiếu', tag: '{Ma_Phieu}' },
  { label: 'Ngày lập phiếu', tag: '{Ngay_Lap}' },
  { label: 'Tên khách hàng', tag: '{Ten_Khach_Hang}' },
  { label: 'SĐT khách hàng', tag: '{SDT_Khach_Hang}' },
  { label: 'Địa chỉ công trình', tag: '{Dia_Chi_Khach_Hang}' },
  { label: 'Bảng sản phẩm', tag: '{Danh_Sach_SanPham}' },
  { label: 'Tổng tiền hàng', tag: '{Tong_Tien_Hang}' },
  { label: 'Chiết khấu KTS', tag: '{Chiet_Khau}' },
  { label: 'Tổng thanh toán', tag: '{Tong_Thanh_Toan}' },
  { label: 'Tiền bằng chữ', tag: '{Tong_Tien_Bang_Chu}' },
  { label: 'Mã QR VietQR', tag: '{Ma_QR_Thanh_Toan}' },
  { label: 'Ghi chú bảo hành', tag: '{Ghi_Chu_Bao_Hanh}' },
];

export function PrintTemplatesSettings() {
  const { message } = App.useApp();
  const [activeKey, setActiveKey] = useState<string>('invoice');
  const [templates, setTemplates] = useState<PrintTemplateConfig[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('d2_admin_print_templates');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return DEFAULT_PRINT_TEMPLATES;
  });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PrintTemplateConfig | null>(null);
  const [form] = Form.useForm();

  // Active current template config
  const activeTemplate = templates.find((t) => t.key === activeKey) || templates[0];

  // Save templates to localStorage
  const saveTemplatesToStorage = (nextTemplates: PrintTemplateConfig[]) => {
    setTemplates(nextTemplates);
    try {
      localStorage.setItem('d2_admin_print_templates', JSON.stringify(nextTemplates));
    } catch {}
  };

  const handleOpenEdit = () => {
    setEditingTemplate(activeTemplate);
    form.setFieldsValue({
      title: activeTemplate.title,
      paperSize: activeTemplate.paperSize,
      showLogo: activeTemplate.showLogo,
      showQr: activeTemplate.showQr,
      showCustomer: activeTemplate.showCustomer,
      showSignature: activeTemplate.showSignature,
      headerNote: activeTemplate.headerNote,
      footerNote: activeTemplate.footerNote,
    });
    setDrawerOpen(true);
  };

  const handleSaveForm = (values: any) => {
    const updatedTemplates = templates.map((t) => {
      if (t.key === activeKey) {
        return {
          ...t,
          ...values,
        };
      }
      return t;
    });
    saveTemplatesToStorage(updatedTemplates);
    message.success(`Đã lưu cấu hình mẫu in "${activeTemplate.tab}" thành công!`);
    setDrawerOpen(false);
  };

  const handleResetToDefault = () => {
    const defaultOne = DEFAULT_PRINT_TEMPLATES.find((t) => t.key === activeKey);
    if (defaultOne) {
      const updated = templates.map((t) => (t.key === activeKey ? { ...defaultOne } : t));
      saveTemplatesToStorage(updated);
      message.success(`Đã khôi phục mẫu in "${activeTemplate.tab}" về mặc định.`);
    }
  };

  const handlePrintTest = () => {
    const printEl = document.getElementById('print-preview-container');
    if (!printEl) {
      window.print();
      return;
    }

    const slipHtml = printEl.innerHTML;
    const isThermal = activeTemplate.paperSize === 'k80' || activeTemplate.paperSize === 'k57';
    const paperWidth = activeTemplate.paperSize === 'k80' ? '76mm' : activeTemplate.paperSize === 'k57' ? '54mm' : '190mm';
    const pageStyle = activeTemplate.paperSize === 'k80' 
      ? '@page { size: 80mm auto; margin: 0; }' 
      : activeTemplate.paperSize === 'k57' 
      ? '@page { size: 57mm auto; margin: 0; }' 
      : activeTemplate.paperSize === 'a5' 
      ? '@page { size: A5 landscape; margin: 5mm; }' 
      : '@page { size: A4 portrait; margin: 6mm; }';

    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>${activeTemplate.title} - ${activeTemplate.codePrefix}-2026-0889</title>
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
            padding: ${isThermal ? '2mm' : '6mm'} !important;
          }
          .receipt-isolated {
            width: 100% !important;
            max-width: ${paperWidth} !important;
            margin: 0 auto !important;
            font-size: ${activeTemplate.paperSize === 'k57' ? '9px' : activeTemplate.paperSize === 'k80' ? '11px' : '12px'};
            line-height: 1.4;
          }
          table { width: 100%; border-collapse: collapse; }
          img { max-width: 100%; height: auto; }
          .border-b { border-bottom: 1px solid #cbd5e1; }
          .border-t { border-top: 1px solid #cbd5e1; }
          .border-dashed { border-style: dashed; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .text-left { text-align: left; }
          .font-bold { font-weight: 700; }
          .font-semibold { font-weight: 600; }
          .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
          .italic { font-style: italic; }
          .uppercase { text-transform: uppercase; }
          .grid { display: grid; }
          .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .flex { display: flex; }
          .justify-between { justify-content: space-between; }
          .items-center { align-items: center; }
          .gap-2 { gap: 0.5rem; }
          .gap-4 { gap: 1rem; }
          .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
          .py-1\\.5 { padding-top: 0.375rem; padding-bottom: 0.375rem; }
          .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
          .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
          .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
          .my-3 { margin-top: 0.75rem; margin-bottom: 0.75rem; }
          .mt-4 { margin-top: 1rem; }
          .mt-6 { margin-top: 1.5rem; }
          .h-8 { height: 2rem; }
          .h-12 { height: 3rem; }
          .h-20 { height: 5rem; }
          .w-20 { width: 5rem; }
          .rounded-md { border-radius: 0.375rem; }
          .rounded-lg { border-radius: 0.5rem; }
          .bg-slate-50 { background-color: #f8fafc; }
          .text-slate-900 { color: #0f172a; }
          .text-slate-800 { color: #1e293b; }
          .text-slate-700 { color: #334155; }
          .text-slate-600 { color: #475569; }
          .text-slate-500 { color: #64748b; }
          .text-slate-400 { color: #94a3b8; }
          .text-rose-600 { color: #e11d48; }
          .text-emerald-700 { color: #047857; }
          .text-\\[\\#784e34\\] { color: #784e34; }
          .text-\\[\\#5d371f\\] { color: #5d371f; }
          .border-slate-200 { border-color: #e2e8f0; }
          .border-slate-300 { border-color: #cbd5e1; }
          .border-slate-900 { border-color: #0f172a; }
        </style>
      </head>
      <body>
        <div class="receipt-isolated">
          ${slipHtml}
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
  };

  const insertVariableToFooter = (tag: string) => {
    const current = form.getFieldValue('footerNote') || '';
    form.setFieldsValue({ footerNote: `${current} ${tag}`.trim() });
    message.info(`Đã chèn biến ${tag}`);
  };

  return (
    <div className="space-y-4 flex-1 flex flex-col h-full w-full">
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#784e34]/10 text-[#784e34] flex items-center justify-center text-xl shrink-0">
            <PrinterOutlined />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-slate-900 m-0">Mẫu Phiếu In & Hóa Đơn Hệ Thống</h2>
              <Tag color="gold" className="text-[10px] font-semibold m-0">POS &amp; ERP</Tag>
            </div>
            <p className="text-xs text-slate-500 m-0 mt-0.5">
              Tùy biến hóa đơn bán lẻ, phiếu bảo hành, hợp đồng may đo, biên bản giao hàng công trình và phiếu thu chi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            icon={<ReloadOutlined />}
            onClick={handleResetToDefault}
            className="rounded-lg text-xs hover:text-[#784e34]"
          >
            Khôi phục mặc định
          </Button>
          <Button
            icon={<EditOutlined />}
            onClick={handleOpenEdit}
            className="rounded-lg text-xs border-[#784e34] text-[#784e34] hover:bg-[#784e34]/5"
          >
            Chỉnh sửa mẫu
          </Button>
          <Button
            type="primary"
            icon={<PrinterOutlined />}
            onClick={handlePrintTest}
            className="rounded-lg bg-[#784e34] hover:!bg-[#5d371f] text-xs font-semibold px-4"
          >
            In thử nghiệm
          </Button>
        </div>
      </div>

      {/* 2. Sub-Tabs Selector */}
      <div className="bg-white p-2 rounded-xl border border-slate-200/80 shadow-xs overflow-x-auto">
        <Segmented
          value={activeKey}
          onChange={(val) => setActiveKey(val as string)}
          options={templates.map((t) => ({
            value: t.key,
            label: (
              <span className="px-2 py-1 font-medium text-xs sm:text-sm whitespace-nowrap">
                {t.tab}
              </span>
            ),
          }))}
          className="bg-slate-100 p-1 rounded-lg w-full flex overflow-x-auto"
        />
      </div>

      {/* 3. Main Workspace: Settings Quick Config + Live Preview Paper */}
      <div className="flex flex-col lg:flex-row gap-5 items-start flex-1 min-h-0">
        {/* Left Quick Settings Card */}
        <div className="w-full lg:w-80 bg-white rounded-xl border border-slate-200/80 shadow-xs p-4 space-y-4 shrink-0 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <SettingOutlined className="text-[#784e34]" /> Cấu hình nhanh
            </span>
            <Tag color="blue" className="m-0 font-mono text-[10px] uppercase">
              {activeTemplate.paperSize.toUpperCase()}
            </Tag>
          </div>

          {/* Paper Size */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-800 block">Khổ giấy in mặc định</label>
            <Select
              value={activeTemplate.paperSize}
              onChange={(val) => {
                const updated = templates.map((t) => (t.key === activeKey ? { ...t, paperSize: val } : t));
                saveTemplatesToStorage(updated);
                message.success(`Đã đổi khổ giấy sang ${val.toUpperCase()}`);
              }}
              className="w-full text-xs"
              size="small"
              options={[
                { value: 'k80', label: 'Khổ K80 (Cuộn nhiệt 80mm - Máy POS)' },
                { value: 'k57', label: 'Khổ K57 (Cuộn nhiệt 57mm mini)' },
                { value: 'a4', label: 'Khổ A4 (Khổ đứng văn phòng / Hợp đồng)' },
                { value: 'a5', label: 'Khổ A5 (Khổ ngang phiếu kho & vận chuyển)' },
              ]}
            />
          </div>

          {/* Toggle Switches */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-slate-700">Logo thương hiệu D2 LUXURY</span>
              <Switch
                size="small"
                checked={activeTemplate.showLogo}
                onChange={(checked) => {
                  const updated = templates.map((t) => (t.key === activeKey ? { ...t, showLogo: checked } : t));
                  saveTemplatesToStorage(updated);
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-700">Mã QR VietQR thanh toán</span>
              <Switch
                size="small"
                checked={activeTemplate.showQr}
                onChange={(checked) => {
                  const updated = templates.map((t) => (t.key === activeKey ? { ...t, showQr: checked } : t));
                  saveTemplatesToStorage(updated);
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-700">Thông tin Khách &amp; Công trình</span>
              <Switch
                size="small"
                checked={activeTemplate.showCustomer}
                onChange={(checked) => {
                  const updated = templates.map((t) => (t.key === activeKey ? { ...t, showCustomer: checked } : t));
                  saveTemplatesToStorage(updated);
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-700">Chữ ký xác nhận các bên</span>
              <Switch
                size="small"
                checked={activeTemplate.showSignature}
                onChange={(checked) => {
                  const updated = templates.map((t) => (t.key === activeKey ? { ...t, showSignature: checked } : t));
                  saveTemplatesToStorage(updated);
                }}
              />
            </div>
          </div>

          {/* Header & Footer Notes Summary */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div>
              <span className="font-semibold text-slate-700 block mb-1">Tiêu đề phụ:</span>
              <div className="bg-slate-50 p-2 rounded text-slate-600 text-[11px] italic border border-slate-100">
                {activeTemplate.headerNote || '—'}
              </div>
            </div>
            <div>
              <span className="font-semibold text-slate-700 block mb-1">Ghi chú chân trang:</span>
              <div className="bg-slate-50 p-2 rounded text-slate-600 text-[11px] italic border border-slate-100">
                {activeTemplate.footerNote || '—'}
              </div>
            </div>
          </div>

          <Button
            block
            icon={<EditOutlined />}
            onClick={handleOpenEdit}
            className="rounded-lg text-xs bg-slate-50 hover:!bg-[#784e34]/10 hover:!text-[#784e34] hover:!border-[#784e34]"
          >
            Chỉnh sửa toàn diện
          </Button>
        </div>

        {/* Right Live Preview Paper Area */}
        <div className="flex-1 w-full bg-slate-100/70 p-4 sm:p-6 rounded-xl border border-slate-200/80 flex flex-col items-center justify-start overflow-y-auto min-h-[680px]">
          <div className="text-center text-xs font-semibold text-slate-500 mb-3 flex items-center gap-1.5">
            <EyeOutlined className="text-[#784e34]" /> Bản xem trước thực tế (Khổ: {activeTemplate.paperSize.toUpperCase()})
          </div>

          {/* SIMULATED PAPER CONTAINER */}
          <div
            id="print-preview-container"
            className={`bg-white rounded-lg shadow-md border border-slate-300 p-6 sm:p-8 text-slate-900 transition-all font-sans ${
              activeTemplate.paperSize === 'k80'
                ? 'w-full max-w-[380px] text-[11px] leading-relaxed'
                : activeTemplate.paperSize === 'k57'
                ? 'w-full max-w-[300px] text-[10px] leading-tight'
                : activeTemplate.paperSize === 'a5'
                ? 'w-full max-w-[580px] text-xs leading-normal'
                : 'w-full max-w-[760px] text-xs leading-relaxed'
            }`}
          >
            {/* Header: Store Identity */}
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
              {activeTemplate.showLogo && (
                <div className="flex items-center justify-center gap-2 mb-1">
                  <img
                    src="/logo.png"
                    alt="Logo D2 LUXURY"
                    className="h-8 w-auto object-contain"
                  />
                  <div className="text-left">
                    <div className="font-bold text-sm text-[#5d371f] leading-none">D2 LUXURY</div>
                    <div className="text-[9px] text-[#83746c] tracking-wider mt-0.5">NỘI THẤT GỖ TỰ NHIÊN</div>
                  </div>
                </div>
              )}
              <div className="font-bold text-slate-900 text-xs">CÔNG TY CỔ PHẦN NỘI THẤT D2 LUXURY</div>
              <div className="text-slate-600 text-[10px]">Đ/c: Showroom 01, KĐT Vinhomes Riverside, Long Biên, Hà Nội</div>
              <div className="text-slate-600 text-[10px]">Hotline: 0986.739.587 - 0985.166.393 | MST: 0109887766</div>
              {activeTemplate.headerNote && (
                <div className="text-[10px] text-[#784e34] font-medium pt-0.5">{activeTemplate.headerNote}</div>
              )}
            </div>

            {/* Document Title & Meta */}
            <div className="text-center py-3 space-y-0.5">
              <h1 className="font-bold text-sm sm:text-base text-slate-900 uppercase tracking-wide m-0">
                {activeTemplate.title}
              </h1>
              <div className="font-mono text-xs font-semibold text-slate-700">
                Số: {activeTemplate.codePrefix}-2026-0889
              </div>
              <div className="text-[10px] text-slate-500 italic">
                Ngày 06 tháng 10 năm 2026 • 14:30
              </div>
            </div>

            {/* Customer & Project Info */}
            {activeTemplate.showCustomer && (
              <div className="py-2.5 px-3 bg-slate-50/80 rounded-md border border-slate-200 text-[11px] space-y-1 mb-3">
                <div className="flex justify-between">
                  <span><strong className="text-slate-800">Khách hàng:</strong> Ông Nguyễn Văn Luân</span>
                  <span className="font-mono font-semibold text-slate-700">0912.888.999</span>
                </div>
                <div>
                  <strong className="text-slate-800">Địa chỉ công trình:</strong> Biệt thự Hoa Sữa 08-12, KĐT Vinhomes Riverside, Long Biên, Hà Nội
                </div>
                <div className="flex justify-between text-slate-600 text-[10px]">
                  <span><strong>KTS phụ trách:</strong> Trần Quang Huy (Xưởng 01)</span>
                  <span><strong>Hình thức:</strong> May đo theo bản vẽ 3D</span>
                </div>
              </div>
            )}

            {/* Items Table */}
            <div className="my-3 border-t border-b border-slate-900 py-1">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 font-bold text-slate-900">
                    <th className="py-1 text-center w-8">#</th>
                    <th className="py-1">Sản phẩm &amp; Quy cách</th>
                    <th className="py-1 text-center w-12">ĐVT</th>
                    <th className="py-1 text-center w-10">SL</th>
                    <th className="py-1 text-right w-24">Đơn giá</th>
                    <th className="py-1 text-right w-24">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dashed divide-slate-200">
                  <tr>
                    <td className="py-1.5 text-center font-mono">1</td>
                    <td className="py-1.5">
                      <div className="font-semibold text-slate-900">Bàn Ăn Óc Chó Bắc Mỹ Tự Nhiên</div>
                      <div className="text-[9px] text-slate-500">Kích thước 2200 x 950 x 750mm, hoàn thiện sơn lau dầu Hesse Lignal Đức</div>
                    </td>
                    <td className="py-1.5 text-center text-slate-600">Bộ</td>
                    <td className="py-1.5 text-center font-semibold">1</td>
                    <td className="py-1.5 text-right font-mono">38,500,000</td>
                    <td className="py-1.5 text-right font-mono font-bold text-slate-900">38,500,000</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 text-center font-mono">2</td>
                    <td className="py-1.5">
                      <div className="font-semibold text-slate-900">Ghế Ăn Grace Da Bò Ý D2-M08</div>
                      <div className="text-[9px] text-slate-500">Khung gỗ Sồi Tần Bì, đệm mút cao cấp bọc da bò Mastrotto Ý màu Nâu Cà phê</div>
                    </td>
                    <td className="py-1.5 text-center text-slate-600">Chiếc</td>
                    <td className="py-1.5 text-center font-semibold">6</td>
                    <td className="py-1.5 text-right font-mono">4,500,000</td>
                    <td className="py-1.5 text-right font-mono font-bold text-slate-900">27,000,000</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 text-center font-mono">3</td>
                    <td className="py-1.5">
                      <div className="font-semibold text-slate-900">Tủ Trang Trí Gỗ Gõ Đỏ Pachyloba</div>
                      <div className="text-[9px] text-slate-500">Cánh kính khung nhôm Anode mạ PVD vàng đồng, ray trượt Blum giảm chấn</div>
                    </td>
                    <td className="py-1.5 text-center text-slate-600">Chiếc</td>
                    <td className="py-1.5 text-center font-semibold">1</td>
                    <td className="py-1.5 text-right font-mono">22,000,000</td>
                    <td className="py-1.5 text-right font-mono font-bold text-slate-900">22,000,000</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Totals Calculation */}
            <div className="space-y-1 text-right text-[11px] pt-1">
              <div className="flex justify-between text-slate-700">
                <span>Tổng tiền hàng (3 mục):</span>
                <span className="font-mono font-semibold">87,500,000 đ</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Chiết khấu đối tác KTS (6%):</span>
                <span className="font-mono text-rose-600 font-semibold">- 5,250,000 đ</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Chi phí vận chuyển &amp; lắp đặt tận nơi:</span>
                <span className="font-mono text-emerald-700 font-semibold">Miễn phí</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-slate-900 pt-1.5 border-t border-slate-900">
                <span className="uppercase">Tổng thanh toán:</span>
                <span className="text-sm font-mono font-bold text-[#784e34]">82,250,000 đ</span>
              </div>
              <div className="text-left text-[10px] italic text-slate-600 pt-0.5">
                (Bằng chữ: Tám mươi hai triệu hai trăm năm mươi nghìn đồng chẵn)
              </div>
            </div>

            {/* QR Code & Banking */}
            {activeTemplate.showQr && (
              <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-dashed border-slate-300 flex items-center justify-between gap-4">
                <div className="text-left text-[10px] space-y-0.5">
                  <div className="font-bold text-slate-900 flex items-center gap-1">
                    <QrcodeOutlined className="text-[#784e34]" /> Quét mã VietQR chuyển khoản:
                  </div>
                  <div>Ngân hàng: <strong>MBBank (Hà Nội)</strong></div>
                  <div>Số tài khoản: <strong className="font-mono font-bold text-[#784e34]">0986739587</strong></div>
                  <div>Chủ TK: <strong>CTCP NOI THAT D2 LUXURY</strong></div>
                  <div className="text-[9px] text-slate-500">Nội dung: HD-2026-0889</div>
                </div>

                <div className="flex flex-col items-center shrink-0">
                  <img
                    src="https://api.vietqr.io/image/970422-0986739587-n2LwzB0.jpg?accountName=CTCP%20NOI%20THAT%20D2%20LUXURY&amount=82250000&addInfo=HD-2026-0889"
                    alt="VietQR Chuyển khoản"
                    className="w-20 h-20 rounded border border-slate-200 object-contain bg-white p-0.5"
                    onError={(e: any) => {
                      e.currentTarget.src = '/logo.png';
                    }}
                  />
                  <span className="text-[8px] text-slate-400 font-mono mt-0.5">VietQR Chuẩn</span>
                </div>
              </div>
            )}

            {/* Signatures */}
            {activeTemplate.showSignature && (
              <div className="mt-6 pt-2 grid grid-cols-3 text-center text-[10px] text-slate-700 font-semibold gap-2">
                <div>
                  <div>Khách hàng / Đại diện</div>
                  <div className="text-[9px] font-normal italic text-slate-400 mt-0.5">(Ký &amp; ghi rõ họ tên)</div>
                  <div className="h-12"></div>
                  <div className="font-normal text-slate-800">Nguyễn Văn Luân</div>
                </div>
                <div>
                  <div>Kỹ sư giám sát</div>
                  <div className="text-[9px] font-normal italic text-slate-400 mt-0.5">(Ký &amp; ghi rõ họ tên)</div>
                  <div className="h-12"></div>
                  <div className="font-normal text-slate-800">Trần Quang Huy</div>
                </div>
                <div>
                  <div>Đại diện D2 LUXURY</div>
                  <div className="text-[9px] font-normal italic text-slate-400 mt-0.5">(Ký, đóng dấu)</div>
                  <div className="h-12"></div>
                  <div className="font-normal text-slate-800">Thủ trưởng đơn vị</div>
                </div>
              </div>
            )}

            {/* Footer Note */}
            {activeTemplate.footerNote && (
              <div className="mt-6 pt-3 border-t border-dashed border-slate-300 text-center text-[10px] italic text-slate-500">
                {activeTemplate.footerNote}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Drawer Edit Print Template */}
      <AdminFormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={`Chỉnh sửa: ${activeTemplate.tab}`}
        width={580}
        form={form}
        onSubmit={() => form.submit()}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveForm}
          className="space-y-4 text-xs"
        >
          <Form.Item
            label="Tiêu đề chính trên phiếu in"
            name="title"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề phiếu' }]}
          >
            <Input className="h-9 rounded-lg" placeholder="Ví dụ: HÓA ĐƠN BÁN HÀNG NỘI THẤT" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Khổ giấy in tiêu chuẩn" name="paperSize">
                <Select
                  className="w-full"
                  options={[
                    { value: 'k80', label: 'Khổ K80 (80mm)' },
                    { value: 'k57', label: 'Khổ K57 (57mm)' },
                    { value: 'a4', label: 'Khổ A4 (Khổ đứng)' },
                    { value: 'a5', label: 'Khổ A5 (Khổ ngang)' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Tiêu đề phụ / Đội thi công" name="headerNote">
                <Input className="h-9 rounded-lg" placeholder="Ví dụ: Showroom D2 LUXURY" />
              </Form.Item>
            </Col>
          </Row>

          <Divider className="my-2" />

          <div className="space-y-3">
            <span className="font-bold text-slate-800 block text-xs">Tùy chọn hiển thị các khối nội dung</span>
            <Row gutter={[16, 12]}>
              <Col span={12}>
                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-700">Logo thương hiệu</span>
                  <Form.Item name="showLogo" valuePropName="checked" noStyle>
                    <Switch size="small" />
                  </Form.Item>
                </div>
              </Col>
              <Col span={12}>
                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-700">Mã VietQR động</span>
                  <Form.Item name="showQr" valuePropName="checked" noStyle>
                    <Switch size="small" />
                  </Form.Item>
                </div>
              </Col>
              <Col span={12}>
                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-700">Khách &amp; Công trình</span>
                  <Form.Item name="showCustomer" valuePropName="checked" noStyle>
                    <Switch size="small" />
                  </Form.Item>
                </div>
              </Col>
              <Col span={12}>
                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-700">Chữ ký các bên</span>
                  <Form.Item name="showSignature" valuePropName="checked" noStyle>
                    <Switch size="small" />
                  </Form.Item>
                </div>
              </Col>
            </Row>
          </div>

          <Divider className="my-2" />

          {/* Quick Insert Tokens */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1">
                <ThunderboltOutlined className="text-amber-500" /> Nhấp để chèn biến dữ liệu nhanh
              </span>
              <span className="text-[10px] text-slate-400">Tự động thay thế khi in</span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-200">
              {VARIABLE_TAGS.map((item) => (
                <Tag
                  key={item.tag}
                  color="default"
                  onClick={() => insertVariableToFooter(item.tag)}
                  className="cursor-pointer hover:border-[#784e34] hover:text-[#784e34] text-[11px] font-mono py-0.5 px-1.5 m-0"
                  title={`Chèn ${item.label}`}
                >
                  + {item.tag}
                </Tag>
              ))}
            </div>
          </div>

          <Form.Item
            label="Ghi chú chính sách bảo hành & chân trang"
            name="footerNote"
            rules={[{ required: true, message: 'Vui lòng nhập ghi chú chân trang' }]}
          >
            <Input.TextArea
              rows={3}
              className="rounded-lg text-xs"
              placeholder="Ví dụ: Bảo hành 05 năm sản phẩm gỗ tự nhiên..."
            />
          </Form.Item>
        </Form>
      </AdminFormDrawer>
    </div>
  );
}

export default PrintTemplatesSettings;
