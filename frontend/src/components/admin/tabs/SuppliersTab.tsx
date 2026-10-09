'use client';

import React, { useState, useMemo } from 'react';
import {
  Button,
  Select,
  Tag,
  Popconfirm,
  App,
  Drawer,
  Form,
  Input,
  InputNumber,
  Segmented,
  Upload,
  Tooltip,
  Space,
  Row,
  Col,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
  DownloadOutlined,
  UploadOutlined,
  SearchOutlined,
  ShopOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  BankOutlined,
  FileTextOutlined,
  DollarOutlined,
  WalletOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  HistoryOutlined,
  CopyOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import {
  AdminDataTable,
  AdminFilterSidebar,
  AdminSidebarSummary,
  AdminFormDrawer,
  AdminStatusBadge,
} from '@/components/admin';
import { VietQrCard } from '@/components/common/VietQrCard';
import { exportToExcel } from '@/utils/exportExcel';
import type { AdminSupplier } from '@/types/admin';
import { INITIAL_SUPPLIERS } from '@/data/admin/mockData';
import { supplierApi } from '@/api/supplierApi';
import { isMatchBranch } from '@/utils/branchHelper';

export interface SuppliersTabProps {
  suppliersList?: AdminSupplier[];
  setSuppliersList?: React.Dispatch<React.SetStateAction<AdminSupplier[]>>;
  selectedGlobalBranch?: string;
  onOpenCreateSupplier?: () => void;
  onOpenEditSupplier?: (supplier: AdminSupplier) => void;
  onSelectSupplierDetail?: (supplier: AdminSupplier) => void;
}

// Danh sách ngân hàng phổ biến hỗ trợ VietQR
const BANK_OPTIONS = [
  { label: 'Vietcombank - Ngân hàng Ngoại thương (VCB)', value: 'Vietcombank' },
  { label: 'Techcombank - Ngân hàng Kỹ thương (TCB)', value: 'Techcombank' },
  { label: 'MBBank - Ngân hàng Quân đội (MB)', value: 'MBBank' },
  { label: 'VietinBank - Ngân hàng Công thương (ICB)', value: 'VietinBank' },
  { label: 'BIDV - Ngân hàng Đầu tư & Phát triển (BIDV)', value: 'BIDV' },
  { label: 'ACB - Ngân hàng Á Châu (ACB)', value: 'ACB' },
  { label: 'VPBank - Ngân hàng Thịnh Vượng (VPB)', value: 'VPBank' },
  { label: 'TPBank - Ngân hàng Tiên Phong (TPB)', value: 'TPBank' },
  { label: 'Agribank - Ngân hàng Nông nghiệp & PTNT (VBA)', value: 'Agribank' },
  { label: 'HDBank - Ngân hàng Phát triển TP.HCM (HDB)', value: 'HDBank' },
  { label: 'Sacombank - Ngân hàng Sài Gòn Thương Tín (STB)', value: 'Sacombank' },
  { label: 'VIB - Ngân hàng Quốc tế (VIB)', value: 'VIB' },
  { label: 'SHB - Ngân hàng Sài Gòn - Hà Nội (SHB)', value: 'SHB' },
  { label: 'MSB - Ngân hàng Hàng Hải (MSB)', value: 'MSB' },
  { label: 'OCB - Ngân hàng Phương Đông (OCB)', value: 'OCB' },
  { label: 'LPBank - Ngân hàng Lộc Phát (LPB)', value: 'LPBank' },
  { label: 'SeABank - Ngân hàng Đông Nam Á (SEAB)', value: 'SeABank' },
  { label: 'Eximbank - Ngân hàng Xuất Nhập Khẩu (EIB)', value: 'Eximbank' },
];

export function SuppliersTab({
  suppliersList: initialSuppliers = INITIAL_SUPPLIERS,
  setSuppliersList: externalSetSuppliersList,
  selectedGlobalBranch = 'all',
  onOpenCreateSupplier,
  onOpenEditSupplier,
  onSelectSupplierDetail,
}: SuppliersTabProps) {
  const { message } = App.useApp();

  const [internalSuppliersList, setInternalSuppliersList] = useState<AdminSupplier[]>(initialSuppliers);
  const suppliersList = externalSetSuppliersList ? initialSuppliers : internalSuppliersList;
  const setSuppliersList = externalSetSuppliersList || setInternalSuppliersList;

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [debtFilter, setDebtFilter] = useState('all'); // 'all' | 'has_debt' | 'no_debt'

  // Selection & Accordion Detail Expansion State
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [expandedSupplierId, setExpandedSupplierId] = useState<string | null>(null);

  // Form Drawer States
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<AdminSupplier | null>(null);
  const [form] = Form.useForm();
  const watchedBankName = Form.useWatch('bankName', form);
  const watchedBankAccount = Form.useWatch('bankAccount', form);
  const watchedCompanyName = Form.useWatch('company', form) || Form.useWatch('name', form);

  // Quick Payment Drawer States
  const [paymentDrawerOpen, setPaymentDrawerOpen] = useState(false);
  const [payingSupplier, setPayingSupplier] = useState<AdminSupplier | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('transfer');
  const [paymentDate, setPaymentDate] = useState<string>(dayjs().format('YYYY-MM-DD HH:mm'));
  const [paymentNote, setPaymentNote] = useState<string>('');
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);

  // Purchase History for Detail View (derived from real stock imports)
  const purchaseHistory = useMemo(() => {
    return [];
  }, []);


  // Filtered Suppliers Logic
  const filteredSuppliers = useMemo(() => {
    return suppliersList.filter((s) => {
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        (s.name || '').toLowerCase().includes(q) ||
        (s.code || '').toLowerCase().includes(q) ||
        (s.phone || '').includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        (s.contactPerson || '').toLowerCase().includes(q) ||
        (s.taxCode || '').toLowerCase().includes(q) ||
        (s.address || '').toLowerCase().includes(q);

      const matchBranch = !s.branch || isMatchBranch(s.branch || s.address, selectedGlobalBranch);
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;

      let matchDebt = true;
      if (debtFilter === 'has_debt') matchDebt = Number(s.currentDebt || 0) > 0;
      if (debtFilter === 'no_debt') matchDebt = Number(s.currentDebt || 0) <= 0;

      return matchSearch && matchBranch && matchStatus && matchDebt;
    });
  }, [suppliersList, searchQuery, statusFilter, debtFilter, selectedGlobalBranch]);

  const selectedSupplierRecord = useMemo(() => {
    if (selectedRowKeys.length === 1) {
      return suppliersList.find((s) => s.id === selectedRowKeys[0]);
    }
    return null;
  }, [selectedRowKeys, suppliersList]);

  // Handle Refresh from API
  const handleRefreshSuppliers = async () => {
    try {
      const refreshed = await supplierApi.getSuppliers();
      setSuppliersList(refreshed);
      setSearchQuery('');
      setStatusFilter('all');
      setDebtFilter('all');
      message.success('Đã làm mới danh sách nhà cung cấp từ hệ thống!');
    } catch (err: any) {
      message.error(err?.message || 'Làm mới thất bại.');
    }
  };

  // Open Create Supplier Drawer
  const handleOpenCreate = () => {
    if (onOpenCreateSupplier) {
      onOpenCreateSupplier();
      return;
    }
    setEditingSupplier(null);
    form.resetFields();
    const autoCode = `NCC${(suppliersList.length + 1).toString().padStart(2, '0')}`;
    form.setFieldsValue({
      code: autoCode,
      status: 'active',
      bankName: 'Vietcombank',
      branch: selectedGlobalBranch !== 'all' ? selectedGlobalBranch : undefined,
    });
    setDrawerOpen(true);
  };

  // Open Edit Supplier Drawer
  const handleOpenEdit = (supplier: AdminSupplier) => {
    if (onOpenEditSupplier) {
      onOpenEditSupplier(supplier);
      return;
    }
    setEditingSupplier(supplier);
    form.resetFields();
    form.setFieldsValue({
      code: supplier.code,
      name: supplier.name,
      taxCode: supplier.taxCode || '',
      contactPerson: supplier.contactPerson,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      branch: supplier.branch || (selectedGlobalBranch !== 'all' ? selectedGlobalBranch : undefined),
      company: supplier.company || supplier.name,
      bankName: supplier.bankName || '',
      bankAccount: supplier.bankAccount || '',
      status: supplier.status || 'active',
      note: supplier.note || '',
    });
    setDrawerOpen(true);
  };

  // Handle Copy Supplier
  const handleCopySupplier = (sup: AdminSupplier) => {
    setEditingSupplier(null);
    form.resetFields();
    const autoCode = `NCC${(suppliersList.length + 1).toString().padStart(2, '0')}`;
    form.setFieldsValue({
      code: autoCode,
      name: `${sup.name} (Bản sao)`,
      taxCode: sup.taxCode || '',
      contactPerson: sup.contactPerson,
      phone: sup.phone,
      email: sup.email,
      address: sup.address,
      branch: sup.branch || (selectedGlobalBranch !== 'all' ? selectedGlobalBranch : undefined),
      company: sup.company || sup.name,
      bankName: sup.bankName || '',
      bankAccount: sup.bankAccount || '',
      status: sup.status || 'active',
      note: sup.note || '',
    });
    setDrawerOpen(true);
  };

  // Handle Save Supplier (Create or Update)
  const handleSaveSupplier = async (values: any) => {
    const trimmedCode = (values.code || '').trim().toUpperCase();
    const trimmedName = (values.name || '').trim();

    if (!trimmedName) {
      message.error('Vui lòng nhập tên nhà cung cấp!');
      return;
    }

    if (editingSupplier) {
      const payload: Partial<AdminSupplier> = {
        code: trimmedCode || editingSupplier.code,
        name: trimmedName,
        contactPerson: values.contactPerson || '',
        phone: values.phone || '',
        email: values.email || '',
        address: values.address || '',
        branch: values.branch || editingSupplier.branch || (selectedGlobalBranch !== 'all' ? selectedGlobalBranch : undefined),
        taxCode: values.taxCode || '',
        bankName: values.bankName || '',
        bankAccount: values.bankAccount || '',
        company: values.company || trimmedName,
        status: values.status || 'active',
        note: values.note || '',
      };
      try {
        const updated = await supplierApi.updateSupplier(editingSupplier.id, payload);
        const updatedList = suppliersList.map((s) =>
          s.id === editingSupplier.id ? { ...s, ...updated } : s
        );
        setSuppliersList(updatedList);
        message.success(`Đã cập nhật thông tin nhà cung cấp "${trimmedName}" thành công!`);
        setDrawerOpen(false);
      } catch (err: any) {
        message.error(err?.message || 'Cập nhật nhà cung cấp thất bại.');
      }
    } else {
      const payload: Partial<AdminSupplier> = {
        code: trimmedCode || undefined,
        name: trimmedName,
        contactPerson: values.contactPerson || '',
        phone: values.phone || '',
        email: values.email || '',
        address: values.address || '',
        branch: values.branch || (selectedGlobalBranch !== 'all' ? selectedGlobalBranch : undefined),
        taxCode: values.taxCode || '',
        bankName: values.bankName || '',
        bankAccount: values.bankAccount || '',
        company: values.company || trimmedName,
        status: values.status || 'active',
        note: values.note || '',
        totalPurchased: 0,
        currentDebt: 0,
        totalCollected: 0,
        createdBy: 'Quản trị viên',
      };
      try {
        const created = await supplierApi.createSupplier(payload);
        setSuppliersList([created, ...suppliersList]);
        message.success(`Đã thêm nhà cung cấp "${created.name}" thành công!`);
        setDrawerOpen(false);
      } catch (err: any) {
        message.error(err?.message || 'Thêm mới nhà cung cấp thất bại.');
      }
    }
  };

  // Handle Delete Supplier
  const handleDeleteSupplier = async (id: string, name: string) => {
    try {
      await supplierApi.deleteSupplier(id);
      setSuppliersList((prev) => prev.filter((s) => s.id !== id));
      setSelectedRowKeys((prev) => prev.filter((k) => k !== id));
      if (expandedSupplierId === id) {
        setExpandedSupplierId(null);
      }
      message.success(`Đã xóa nhà cung cấp "${name}" thành công!`);
    } catch (err: any) {
      message.error(err?.message || 'Xóa nhà cung cấp thất bại.');
    }
  };

  // Handle Bulk Delete Selected Suppliers
  const handleBulkDelete = async () => {
    if (!selectedRowKeys.length) return;
    const keysToDelete = [...selectedRowKeys];
    try {
      const count = await supplierApi.bulkDeleteSuppliers(keysToDelete as string[]);
      setSuppliersList((prev) => prev.filter((s) => !keysToDelete.includes(s.id)));
      setSelectedRowKeys([]);
      if (expandedSupplierId && keysToDelete.includes(expandedSupplierId)) {
        setExpandedSupplierId(null);
      }
      message.success(`Đã xóa thành công ${count} nhà cung cấp đã chọn!`);
    } catch (err: any) {
      message.error(err?.message || 'Xóa nhà cung cấp thất bại.');
    }
  };

  // Handle Change Supplier Status
  const handleChangeStatus = async (id: string, newStatus: 'active' | 'inactive') => {
    const target = suppliersList.find((s) => s.id === id);
    try {
      await supplierApi.updateSupplier(id, { status: newStatus });
      setSuppliersList(
        suppliersList.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
      );
      message.success(
        `Đã chuyển trạng thái nhà cung cấp "${target?.name || ''}" thành ${
          newStatus === 'active' ? 'Đang hợp tác' : 'Tạm dừng'
        }`
      );
    } catch (err: any) {
      message.error(err?.message || 'Cập nhật trạng thái thất bại.');
    }
  };

  // Handle Open Quick Payment Drawer
  const handleOpenPayment = (supplier: AdminSupplier) => {
    setPayingSupplier(supplier);
    setPaymentAmount(Number(supplier.currentDebt || 0));
    setPaymentMethod('transfer');
    setPaymentDate(dayjs().format('YYYY-MM-DD HH:mm'));
    setPaymentNote(`Thanh toán tiền vật tư / công nợ cho ${supplier.name}`);
    setPaymentDrawerOpen(true);
  };

  // Handle Submit Payment
  const handleSubmitPayment = () => {
    if (!payingSupplier) return;
    if (paymentAmount <= 0) {
      message.error('Vui lòng nhập số tiền thanh toán hợp lệ (lớn hơn 0đ)');
      return;
    }

    const newPaymentSlip = {
      id: `pay_${Date.now()}`,
      code: `PC-${dayjs().format('YYYYMMDD')}-${Math.floor(1000 + Math.random() * 9000)}`,
      supplierId: payingSupplier.id,
      amount: paymentAmount,
      method: paymentMethod === 'transfer' ? 'Chuyển khoản VietQR' : paymentMethod === 'cash' ? 'Tiền mặt' : 'Cấn trừ',
      date: paymentDate,
      note: paymentNote || `Thanh toán công nợ nhà cung cấp ${payingSupplier.name}`,
      creator: 'Nguyễn Văn Luân',
    };

    setPaymentHistory([newPaymentSlip, ...paymentHistory]);

    // Giảm công nợ nhà cung cấp
    const updatedSuppliers = suppliersList.map((s) => {
      if (s.id === payingSupplier.id) {
        const oldDebt = Number(s.currentDebt || 0);
        const oldPaid = Number(s.totalCollected || 0);
        const newDebt = Math.max(0, oldDebt - paymentAmount);
        const newPaid = oldPaid + paymentAmount;
        return { ...s, currentDebt: newDebt, totalCollected: newPaid };
      }
      return s;
    });

    setSuppliersList(updatedSuppliers);
    message.success(
      `Đã lập phiếu chi ${paymentAmount.toLocaleString('vi-VN')} đ cho nhà cung cấp "${payingSupplier.name}" thành công!`
    );
    setPaymentDrawerOpen(false);
  };

  // Handle Excel Export
  const handleExportExcel = () => {
    const data = filteredSuppliers.map((s, idx) => ({
      STT: idx + 1,
      'Mã nhà cung cấp': s.code,
      'Tên nhà cung cấp': s.name,
      'Mã số thuế (MST)': s.taxCode || '',
      'Người đại diện': s.contactPerson || '',
      'Số điện thoại': s.phone || '',
      Email: s.email || '',
      'Địa chỉ trụ sở / Kho': s.address || '',
      'Tên ngân hàng': s.bankName || '',
      'Số tài khoản': s.bankAccount || '',
      'Tổng tiền mua (VNĐ)': s.totalPurchased || 0,
      'Công nợ còn lại (VNĐ)': s.currentDebt || 0,
      'Đã thanh toán (VNĐ)': s.totalCollected || 0,
      'Trạng thái': s.status === 'active' ? 'Đang hợp tác' : 'Tạm dừng',
      'Ghi chú': s.note || '',
    }));
    exportToExcel(data, `Danh_sach_nha_cung_cap_${dayjs().format('YYYYMMDD')}`);
    message.success('Đã xuất danh sách nhà cung cấp ra file Excel thành công!');
  };

  // Handle Excel Import
  const handleImportExcel = async (file: File) => {
    const hideLoading = message.loading(`Đang đọc và nhập file ${file.name}...`, 0);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const rawRows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      if (!rawRows || rawRows.length === 0) {
        hideLoading();
        message.error('File Excel không có dữ liệu nhà cung cấp.');
        return false;
      }

      const importedSuppliers: Partial<AdminSupplier>[] = rawRows.map((r) => ({
        code: String(r['Mã NCC'] || r['Mã nhà cung cấp'] || r['Mã đối tác'] || r['code'] || '').trim(),
        name: String(r['Tên nhà cung cấp'] || r['Tên NCC'] || r['Tên'] || r['name'] || '').trim(),
        taxCode: String(r['Mã số thuế'] || r['MST'] || r['taxCode'] || '').trim(),
        contactPerson: String(r['Người liên hệ'] || r['Đại diện'] || r['contactPerson'] || '').trim(),
        phone: String(r['Điện thoại'] || r['SĐT'] || r['Số điện thoại'] || r['phone'] || '').trim(),
        email: String(r['Email'] || r['email'] || '').trim(),
        address: String(r['Địa chỉ'] || r['address'] || '').trim(),
        company: String(r['Công ty'] || r['Tên công ty'] || r['company'] || '').trim(),
        bankName: String(r['Ngân hàng'] || r['bankName'] || '').trim(),
        bankAccount: String(r['Số tài khoản'] || r['STK'] || r['bankAccount'] || '').trim(),
        note: String(r['Ghi chú'] || r['note'] || '').trim(),
        status: 'active' as const,
      })).filter((s) => Boolean(s.name));

      const res = await supplierApi.bulkImportSuppliers(importedSuppliers);
      hideLoading();
      message.success(`Đã xử lý nhập: Thêm mới ${res.added}, Cập nhật ${res.updated} nhà cung cấp!`);
      const refreshed = await supplierApi.getSuppliers();
      setSuppliersList(refreshed);
    } catch (err: any) {
      hideLoading();
      message.error(err?.message || 'Có lỗi xảy ra khi nhập file Excel nhà cung cấp.');
    }
    return false;
  };

  return (
    <div className="space-y-4 flex-1 flex flex-col h-full">
      {/* 2-COLUMN LAYOUT: FILTER SIDEBAR + DATA TABLE */}
      <div className="flex flex-col lg:flex-row gap-4 items-start flex-1">
        {/* Left Filter Sidebar */}
        <AdminFilterSidebar
          title="Bộ lọc nhà cung cấp"
          hasActiveFilters={Boolean(searchQuery || statusFilter !== 'all' || debtFilter !== 'all')}
          onResetFilters={() => {
            setSearchQuery('');
            setStatusFilter('all');
            setDebtFilter('all');
          }}
        >
          {/* Trạng thái hợp tác */}
          <div>
            <div className="mb-2 text-xs font-medium text-slate-700 uppercase tracking-wide">
              Trạng thái hợp tác
            </div>
            <div className="space-y-1">
              {[
                { value: 'all', label: 'Tất cả đối tác', count: suppliersList.length },
                {
                  value: 'active',
                  label: '🟢 Đang hợp tác',
                  count: suppliersList.filter((s) => s.status === 'active').length,
                },
                {
                  value: 'inactive',
                  label: '⚪ Tạm dừng',
                  count: suppliersList.filter((s) => s.status === 'inactive').length,
                },
              ].map((opt) => {
                const isSelected = statusFilter === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatusFilter(opt.value)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors cursor-pointer border-none ${
                      isSelected
                        ? 'bg-amber-50/80 font-semibold text-[#784e34]'
                        : 'bg-transparent text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        isSelected ? 'bg-[#784e34] text-white' : 'text-slate-400 bg-slate-100'
                      }`}
                    >
                      {opt.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tình trạng công nợ */}
          <div>
            <div className="mb-2 text-xs font-medium text-slate-700 uppercase tracking-wide">
              Tình trạng công nợ
            </div>
            <div className="space-y-1">
              {[
                { value: 'all', label: 'Tất cả đối tác' },
                {
                  value: 'has_debt',
                  label: '🔴 Còn nợ cần trả',
                  count: suppliersList.filter((s) => Number(s.currentDebt || 0) > 0).length,
                },
                {
                  value: 'no_debt',
                  label: '🟢 Đã thanh toán hết',
                  count: suppliersList.filter((s) => Number(s.currentDebt || 0) <= 0).length,
                },
              ].map((opt) => {
                const isSelected = debtFilter === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDebtFilter(opt.value)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors cursor-pointer border-none ${
                      isSelected
                        ? 'bg-amber-50/80 font-semibold text-[#784e34]'
                        : 'bg-transparent text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {opt.count !== undefined && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          isSelected ? 'bg-[#784e34] text-white' : 'text-slate-400 bg-slate-100'
                        }`}
                      >
                        {opt.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sidebar Summary Card */}
          <AdminSidebarSummary
            title="Thống kê đối tác NCC"
            items={[
              { label: 'Tổng số nhà cung cấp', value: `${suppliersList.length} đối tác` },
              {
                label: 'Đang hợp tác',
                value: `${suppliersList.filter((s) => s.status === 'active').length} đối tác`,
                color: 'success',
              },
              {
                label: 'Tổng nợ cần trả NCC',
                value: `${(
                  suppliersList.reduce((acc, s) => acc + (s.currentDebt || 0), 0) / 1000000
                ).toLocaleString('vi-VN')} Tr`,
                color: 'default',
              },
              {
                label: 'Tổng tiền mua hàng',
                value: `${(
                  suppliersList.reduce((acc, s) => acc + (s.totalPurchased || 0), 0) / 1000000
                ).toLocaleString('vi-VN')} Tr`,
                color: 'primary',
              },
            ]}
          />
        </AdminFilterSidebar>

        {/* Right Suppliers Data Table with Accordion Detail Expansion */}
        <div className="flex-1 w-full min-w-0">
          <AdminDataTable
            enableSelectionToolbar
            selectedRowKeys={selectedRowKeys}
            onSelectionChange={(keys) => setSelectedRowKeys(keys)}
            titleText="Nhà cung cấp & Đối tác vật tư"
            totalCount={filteredSuppliers.length}
            countUnit="nhà cung cấp"
            onCopySelected={() => selectedSupplierRecord && handleCopySupplier(selectedSupplierRecord)}
            onEditSelected={() => selectedSupplierRecord && handleOpenEdit(selectedSupplierRecord)}
            onDeleteSelected={handleBulkDelete}
            deleteConfirmTitle={`Xóa ${selectedRowKeys.length} nhà cung cấp đã chọn?`}
            onCreateNew={handleOpenCreate}
            createButtonText="Tạo mới"
            searchValue={searchQuery}
            onSearchChange={(val) => setSearchQuery(val)}
            searchPlaceholder="Theo mã, tên nhà cung cấp, SĐT, MST, người liên hệ..."
            extraHeaderActions={
              <>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleRefreshSuppliers}
                  className="!h-8 px-2.5 rounded-lg border-slate-300 bg-white text-slate-700 text-xs shadow-xs inline-flex items-center justify-center hover:text-[#784e34]"
                  title="Làm mới"
                >
                  Làm mới
                </Button>
                <Upload
                  accept=".xlsx,.xls"
                  showUploadList={false}
                  beforeUpload={handleImportExcel}
                >
                  <Button
                    icon={<UploadOutlined />}
                    className="!h-8 px-2.5 rounded-lg border-emerald-600/30 bg-emerald-50 text-emerald-700 text-xs shadow-xs inline-flex items-center justify-center hover:!bg-emerald-100 hover:!border-emerald-600 hover:!text-emerald-800"
                    title="Nhập dữ liệu nhà cung cấp từ Excel"
                  >
                    Nhập Excel
                  </Button>
                </Upload>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={handleExportExcel}
                  className="!h-8 px-2.5 rounded-lg border-slate-300 bg-white text-slate-700 text-xs shadow-xs inline-flex items-center justify-center hover:text-[#784e34]"
                  title="Xuất Excel"
                >
                  Xuất Excel
                </Button>
              </>
            }
            dataSource={filteredSuppliers}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            onRow={(record) => ({
              onClick: () => {
                setExpandedSupplierId((prev) => (prev === record.id ? null : record.id));
              },
              className: 'cursor-pointer hover:bg-[#fbf2ee]/40 transition-colors',
            })}
            expandable={{
              expandedRowKeys: expandedSupplierId ? [expandedSupplierId] : [],
              onExpand: (expanded, record) => {
                setExpandedSupplierId(expanded ? record.id : null);
              },
              expandedRowRender: (supplier: AdminSupplier) => (
                <SupplierExpandedDetailRow
                  supplier={supplier}
                  purchaseHistory={purchaseHistory}
                  paymentHistory={paymentHistory}
                  onEdit={() => handleOpenEdit(supplier)}
                  onCopy={() => handleCopySupplier(supplier)}
                  onDelete={() => handleDeleteSupplier(supplier.id, supplier.name)}
                  onOpenPayment={() => handleOpenPayment(supplier)}
                  onChangeStatus={(status) => handleChangeStatus(supplier.id, status)}
                />
              ),
              showExpandColumn: false,
            }}
            columns={[
              {
                title: 'STT',
                key: 'stt',
                width: 55,
                align: 'center',
                render: (_, __, index) => (
                  <span className="font-mono text-xs text-slate-500 font-semibold">{index + 1}</span>
                ),
              },
              {
                title: 'Mã NCC',
                dataIndex: 'code',
                key: 'code',
                width: 110,
                render: (code, record) => (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedSupplierId((prev) => (prev === record.id ? null : record.id));
                    }}
                    className="font-mono text-xs text-[#784e34] bg-[#784e34]/10 hover:bg-[#784e34]/20 px-2.5 py-1 rounded font-semibold whitespace-nowrap border-none cursor-pointer text-left inline-block"
                    title="Bấm để xem chi tiết nhà cung cấp"
                  >
                    {code}
                  </button>
                ),
              },
              {
                title: 'Tên nhà cung cấp / Doanh nghiệp',
                dataIndex: 'name',
                key: 'name',
                render: (name, record) => (
                  <div className="min-w-0">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedSupplierId((prev) => (prev === record.id ? null : record.id));
                      }}
                      className="font-semibold text-sm text-slate-900 hover:text-[#784e34] cursor-pointer line-clamp-1 transition-colors"
                    >
                      {name}
                    </div>
                    {record.company && record.company !== name && (
                      <div className="text-xs text-slate-500 line-clamp-1">{record.company}</div>
                    )}
                    <div className="text-xs text-slate-400 line-clamp-1 mt-0.5 flex items-center gap-1">
                      <EnvironmentOutlined className="text-[11px]" />
                      <span>{record.address || 'Chưa cập nhật địa chỉ'}</span>
                    </div>
                  </div>
                ),
              },
              {
                title: 'Người liên hệ & SĐT',
                key: 'contact',
                width: 190,
                render: (_, s) => (
                  <div>
                    <div className="text-sm font-medium text-slate-800 flex items-center gap-1">
                      <UserOutlined className="text-slate-400 text-xs" />
                      <span>{s.contactPerson || '---'}</span>
                    </div>
                    <div className="font-mono text-xs text-slate-600 mt-0.5">{s.phone || '---'}</div>
                    <div className="text-xs text-slate-400 truncate max-w-[170px]" title={s.email}>
                      {s.email || ''}
                    </div>
                  </div>
                ),
              },
              {
                title: 'Tổng mua hàng',
                dataIndex: 'totalPurchased',
                key: 'totalPurchased',
                width: 145,
                align: 'right',
                render: (val) => (
                  <span className="font-mono font-semibold text-sm text-slate-900">
                    {(Number(val) || 0).toLocaleString('vi-VN')} đ
                  </span>
                ),
              },
              {
                title: 'Nợ cần trả hiện tại',
                dataIndex: 'currentDebt',
                key: 'currentDebt',
                width: 155,
                align: 'right',
                render: (debt) => {
                  const num = Number(debt || 0);
                  return (
                    <span
                      className={`font-mono font-semibold text-sm ${
                        num > 0 ? 'text-rose-600' : 'text-slate-400'
                      }`}
                    >
                      {num.toLocaleString('vi-VN')} đ
                    </span>
                  );
                },
              },
              {
                title: 'Đã thanh toán',
                dataIndex: 'totalCollected',
                key: 'totalCollected',
                width: 145,
                align: 'right',
                render: (val, r) => {
                  const paid = val !== undefined ? Number(val) : Math.max(0, Number(r.totalPurchased || 0) - Number(r.currentDebt || 0));
                  return (
                    <span className="font-mono text-sm text-emerald-700 font-semibold">
                      {paid.toLocaleString('vi-VN')} đ
                    </span>
                  );
                },
              },
              {
                title: 'Trạng thái',
                dataIndex: 'status',
                key: 'status',
                width: 130,
                align: 'center',
                render: (status: 'active' | 'inactive', s) => (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      handleChangeStatus(s.id, status === 'active' ? 'inactive' : 'active');
                    }}
                    className="cursor-pointer inline-block"
                    title="Nhấn để đổi trạng thái"
                  >
                    <AdminStatusBadge
                      status={status === 'active' ? 'active' : 'inactive'}
                      label={status === 'active' ? 'Đang hợp tác' : 'Tạm dừng'}
                      dot
                    />
                  </span>
                ),
              },
              {
                title: 'Thao tác',
                key: 'actions',
                width: 125,
                align: 'center',
                render: (_, s) => (
                  <Space size={2} onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="Chỉnh sửa thông tin">
                      <Button
                        size="small"
                        type="text"
                        icon={<EditOutlined className="text-sm text-slate-600 hover:text-[#784e34]" />}
                        onClick={() => handleOpenEdit(s)}
                        className="text-slate-600 hover:text-[#784e34] hover:bg-slate-100"
                      />
                    </Tooltip>

                    <Tooltip title="Sao chép NCC">
                      <Button
                        size="small"
                        type="text"
                        icon={<CopyOutlined className="text-sm text-slate-600 hover:text-[#784e34]" />}
                        onClick={() => handleCopySupplier(s)}
                        className="text-slate-600 hover:text-[#784e34] hover:bg-slate-100"
                      />
                    </Tooltip>

                    <Tooltip title="Chi trả tiền hàng / Thanh toán nợ">
                      <Button
                        size="small"
                        type="text"
                        icon={<WalletOutlined className="text-sm text-emerald-600 hover:text-emerald-700" />}
                        onClick={() => handleOpenPayment(s)}
                        className="hover:bg-emerald-50"
                      />
                    </Tooltip>

                    <Popconfirm
                      title={`Xóa nhà cung cấp "${s.name}"?`}
                      description="Thao tác này sẽ xóa hồ sơ NCC khỏi hệ thống."
                      onConfirm={() => handleDeleteSupplier(s.id, s.name)}
                      okText="Xóa"
                      cancelText="Hủy"
                      okButtonProps={{ danger: true }}
                    >
                      <Tooltip title="Xóa nhà cung cấp">
                        <Button
                          size="small"
                          type="text"
                          danger
                          icon={<DeleteOutlined className="text-sm text-slate-400 hover:text-rose-600" />}
                          className="hover:bg-rose-50"
                        />
                      </Tooltip>
                    </Popconfirm>
                  </Space>
                ),
              },
            ]}
          />
        </div>
      </div>

      {/* FORM DRAWER SỬ DỤNG ADMIN FORM DRAWER CHUNG */}
      <AdminFormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        form={form}
        isEditing={Boolean(editingSupplier)}
        recordId={editingSupplier?.code || editingSupplier?.id}
        editTitle="Chỉnh sửa thông tin nhà cung cấp"
        createTitle="Thêm mới nhà cung cấp"
        size="large"
      >
        <Form form={form} layout="vertical" onFinish={handleSaveSupplier} requiredMark={false} className="space-y-4">
          {/* SECTION 1: THÔNG TIN CƠ BẢN */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 space-y-3 shadow-xs">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2 m-0">
              <ShopOutlined className="text-[#784e34]" /> Thông tin cơ bản
            </h4>

            <Form.Item
              label={<span className="text-xs font-semibold text-slate-800">Tên nhà cung cấp / Doanh nghiệp <span className="text-rose-500">*</span></span>}
              name="name"
              rules={[{ required: true, message: 'Vui lòng nhập tên nhà cung cấp' }]}
            >
              <Input placeholder="VD: Northwest Hardwoods (USA)" className="h-10 rounded-lg text-sm" />
            </Form.Item>

            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  label={<span className="text-xs font-semibold text-slate-800">Mã nhà cung cấp</span>}
                  name="code"
                >
                  <Input placeholder="Tự động hoặc NCC01" className="h-10 rounded-lg font-mono text-sm uppercase" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={<span className="text-xs font-semibold text-slate-800">Mã số thuế (MST)</span>}
                  name="taxCode"
                >
                  <Input placeholder="VD: 0304567891" className="h-10 rounded-lg font-mono text-sm" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  label={<span className="text-xs font-semibold text-slate-800">Người liên hệ / Đại diện</span>}
                  name="contactPerson"
                >
                  <Input placeholder="VD: David Johnson" className="h-10 rounded-lg text-sm" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={<span className="text-xs font-semibold text-slate-800">Số điện thoại liên hệ</span>}
                  name="phone"
                >
                  <Input placeholder="VD: 0908.123.456" className="h-10 rounded-lg font-mono text-sm" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={12}>
              <Col span={14}>
                <Form.Item label={<span className="text-xs font-semibold text-slate-800">Email giao dịch</span>} name="email">
                  <Input placeholder="sales@supplier.com" className="h-10 rounded-lg text-sm" />
                </Form.Item>
              </Col>
              <Col span={10}>
                <Form.Item label={<span className="text-xs font-semibold text-slate-800">Trạng thái hợp tác</span>} name="status" initialValue="active">
                  <Select className="h-10 text-sm">
                    <Select.Option value="active">🟢 Đang hợp tác</Select.Option>
                    <Select.Option value="inactive">⚪ Tạm dừng</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label={<span className="text-xs font-semibold text-slate-800">Địa chỉ trụ sở / Kho giao hàng</span>}
              name="address"
            >
              <Input placeholder="Số nhà, đường, KCN, quận/huyện, tỉnh/thành..." className="h-10 rounded-lg text-sm" />
            </Form.Item>
          </div>

          {/* SECTION 2: TÀI KHOẢN NGÂN HÀNG */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 m-0">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 m-0">
                <BankOutlined className="text-emerald-600" /> Tài khoản ngân hàng &amp; Mã VietQR thụ hưởng
              </h4>
              <Tag color="cyan" className="text-[10px] m-0 font-medium font-mono">
                VietQR Chuẩn NAPAS 247
              </Tag>
            </div>

            <Row gutter={12}>
              <Col span={12}>
                <Form.Item label={<span className="text-xs font-semibold text-slate-800">Ngân hàng thụ hưởng</span>} name="bankName">
                  <Select
                    placeholder="Chọn ngân hàng"
                    options={BANK_OPTIONS}
                    showSearch
                    allowClear
                    className="h-10 text-sm"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label={<span className="text-xs font-semibold text-slate-800">Số tài khoản ngân hàng</span>} name="bankAccount">
                  <Input placeholder="VD: 0071001234567" className="h-10 rounded-lg font-mono text-sm" />
                </Form.Item>
              </Col>
            </Row>

            {/* Live VietQR Preview */}
            {watchedBankAccount && (
              <div className="bg-slate-50 p-3.5 rounded-xl border border-dashed border-slate-300 flex flex-col sm:flex-row items-center gap-4">
                <div className="shrink-0">
                  <VietQrCard
                    bankName={watchedBankName || 'MBBank'}
                    accountNumber={watchedBankAccount}
                    accountName={watchedCompanyName || 'NHÀ CUNG CẤP'}
                    paymentPrefix="THANH TOAN"
                    orderCode={form.getFieldValue('code') || 'NCC'}
                    amount={0}
                    showDetails={false}
                    className="max-w-[140px] p-1.5 bg-white border-slate-200"
                  />
                </div>
                <div className="text-xs space-y-1 text-slate-600 flex-1">
                  <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <span>Mã VietQR Thanh Toán Động</span>
                    <Tag color="success" className="text-[10px] m-0">Tự động tạo</Tag>
                  </div>
                  <p className="text-[11px] text-slate-500 m-0">
                    Mã VietQR này sẽ được sử dụng trực tiếp khi lập phiếu chi, thanh toán tiền hàng hoặc quét QR chuyển khoản qua ứng dụng ngân hàng.
                  </p>
                  <div className="font-mono text-[11px] text-[#784e34] bg-white p-1.5 rounded border border-slate-200">
                    Ngân hàng: <strong>{watchedBankName || '---'}</strong> • STK: <strong>{watchedBankAccount}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: GHI CHÚ */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <Form.Item label={<span className="text-xs font-semibold text-slate-800">Ghi chú &amp; Danh mục vật tư chính</span>} name="note" className="!mb-0">
              <Input.TextArea rows={3} placeholder="VD: Cung ứng gỗ FAS, phụ kiện giảm chấn Blum..." className="rounded-lg text-sm" />
            </Form.Item>
          </div>
        </Form>
      </AdminFormDrawer>

      {/* DRAWER LẬP PHIẾU CHI / THANH TOÁN TIỀN HÀNG */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <WalletOutlined className="text-[#784e34] text-lg" />
            <span className="text-base font-bold text-slate-900">
              Lập Phiếu Chi / Thanh Toán Tiền Hàng Cho NCC
            </span>
          </div>
        }
        open={paymentDrawerOpen}
        onClose={() => setPaymentDrawerOpen(false)}
        styles={{ wrapper: { width: 520, maxWidth: '100vw' } }}
        destroyOnHidden
        footer={
          <div className="flex items-center justify-between">
            <Button onClick={() => setPaymentDrawerOpen(false)} className="h-10 px-5 text-sm font-semibold rounded-lg">
              Hủy bỏ
            </Button>
            <Button
              type="primary"
              onClick={handleSubmitPayment}
              className="h-10 px-6 bg-[#784e34] hover:!bg-[#5d371f] text-sm font-bold text-white rounded-lg border-none shadow-none"
            >
              Xác nhận chi tiền
            </Button>
          </div>
        }
      >
        {payingSupplier && (
          <div className="space-y-4">
            <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-200/80 text-xs text-amber-900 flex items-center justify-between">
              <div>
                <span className="text-slate-600 block">Nhà cung cấp thụ hưởng:</span>
                <strong className="text-sm text-slate-900">{payingSupplier.name}</strong>
              </div>
              <div className="text-right">
                <span className="text-slate-600 block">Nợ hiện tại:</span>
                <strong className="font-mono text-base text-rose-600 font-bold">
                  {(Number(payingSupplier.currentDebt) || 0).toLocaleString('vi-VN')} đ
                </strong>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 block">Số tiền thanh toán (VNĐ) *</label>
              <InputNumber
                style={{ width: '100%' }}
                size="large"
                min={1000}
                value={paymentAmount}
                onChange={(val) => setPaymentAmount(val || 0)}
                formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(val) => (val ? Number(val.replace(/\$\s?|(,*)/g, '')) : 0) as any}
                className="font-mono font-bold text-emerald-700 text-lg rounded-lg"
                suffix={<span className="text-xs text-slate-400 font-normal">VNĐ</span>}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">Hình thức thanh toán</label>
                <Select
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  className="w-full h-10 text-sm"
                  options={[
                    { value: 'transfer', label: '🏦 Chuyển khoản ngân hàng' },
                    { value: 'cash', label: '💵 Tiền mặt' },
                    { value: 'offset', label: '🔄 Cấn trừ công nợ' },
                  ]}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">Ngày thanh toán</label>
                <Input
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="h-10 text-xs font-mono rounded-lg"
                  placeholder="YYYY-MM-DD HH:mm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 block">Nội dung phiếu chi / Ghi chú</label>
              <Input.TextArea
                rows={2}
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                placeholder="VD: Thanh toán tiền hàng đợt 2 theo hợp đồng..."
                className="rounded-lg text-sm"
              />
            </div>

            {/* VietQR Dynamic Card for Bank Transfer */}
            {paymentMethod === 'transfer' && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <BankOutlined className="text-emerald-600" /> Quét mã VietQR Chuyển Khoản Nhanh
                  </span>
                  <Tag color="success" className="text-[10px] m-0 font-medium font-mono">
                    VietQR Động NAPAS 247
                  </Tag>
                </div>

                {payingSupplier.bankAccount ? (
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3 rounded-lg border border-slate-200">
                    <div className="shrink-0">
                      <VietQrCard
                        bankName={payingSupplier.bankName || 'MBBank'}
                        accountNumber={payingSupplier.bankAccount}
                        accountName={payingSupplier.company || payingSupplier.name}
                        paymentPrefix="CHI"
                        orderCode={payingSupplier.code || 'NCC'}
                        amount={paymentAmount || 0}
                        showDetails={false}
                        className="max-w-[150px] p-1 bg-white border-slate-100"
                      />
                    </div>
                    <div className="text-xs space-y-1.5 text-slate-700 flex-1">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Ngân hàng nhận:</span>
                        <strong className="text-slate-900">{payingSupplier.bankName || 'Chưa cập nhật'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Số tài khoản:</span>
                        <strong className="font-mono text-[#784e34] text-sm font-bold">{payingSupplier.bankAccount}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Chủ tài khoản:</span>
                        <strong className="uppercase text-slate-900">{payingSupplier.company || payingSupplier.name}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Số tiền chi:</span>
                        <strong className="font-mono text-emerald-700 text-sm font-bold">
                          {(paymentAmount || 0).toLocaleString('vi-VN')} đ
                        </strong>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 text-center text-xs text-amber-700 bg-amber-50 rounded-lg border border-amber-200">
                    Nhà cung cấp này chưa được thiết lập tài khoản ngân hàng. Bạn có thể cập nhật thông tin tài khoản trong mục chỉnh sửa NCC.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}

// -------------------------------------------------------------------------------------------------
// SUBCOMPONENT: SUPPLIER EXPANDED ACCORDION DETAIL ROW (MATCHING CUSTOMER DETAIL PANEL PATTERN)
// -------------------------------------------------------------------------------------------------
interface SupplierExpandedDetailRowProps {
  supplier: AdminSupplier;
  purchaseHistory: any[];
  paymentHistory: any[];
  onEdit: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onOpenPayment: () => void;
  onChangeStatus: (status: 'active' | 'inactive') => void;
}

function SupplierExpandedDetailRow({
  supplier,
  purchaseHistory,
  paymentHistory,
  onEdit,
  onCopy,
  onDelete,
  onOpenPayment,
  onChangeStatus,
}: SupplierExpandedDetailRowProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'orders' | 'debt'>('info');

  const relatedPurchases = useMemo(() => {
    return purchaseHistory.filter((p) => p.supplierId === supplier.id);
  }, [purchaseHistory, supplier.id]);

  const relatedPayments = useMemo(() => {
    return paymentHistory.filter((p) => p.supplierId === supplier.id);
  }, [paymentHistory, supplier.id]);

  return (
    <div className="bg-[#fbf9f8] border-y border-slate-200 p-4 sm:p-5 -mx-4 space-y-4">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#fbf2ee] border border-[#d8c3af] flex items-center justify-center font-bold text-sm text-[#5d371f] shrink-0">
            {supplier.name ? supplier.name.charAt(0).toUpperCase() : 'N'}
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span>{supplier.name}</span>
              <span className="font-mono text-xs font-semibold text-[#784e34] bg-[#784e34]/10 px-2 py-0.5">
                #{supplier.code}
              </span>
              <AdminStatusBadge
                status={supplier.status === 'active' ? 'active' : 'inactive'}
                label={supplier.status === 'active' ? 'Đang hợp tác' : 'Tạm dừng'}
                dot
              />
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Đại diện: <strong className="text-slate-800">{supplier.contactPerson || '---'}</strong> • SĐT:{' '}
              <span className="font-mono text-slate-800">{supplier.phone || '---'}</span> • Email:{' '}
              <span className="text-slate-800">{supplier.email || '---'}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            size="small"
            icon={<SwapOutlined />}
            onClick={() => onChangeStatus(supplier.status === 'active' ? 'inactive' : 'active')}
            className="text-xs h-7 rounded-none"
          >
            {supplier.status === 'active' ? 'Tạm dừng' : 'Kích hoạt'}
          </Button>

          {Number(supplier.currentDebt || 0) > 0 && (
            <Button
              type="primary"
              size="small"
              icon={<WalletOutlined />}
              onClick={onOpenPayment}
              className="bg-rose-600 hover:!bg-rose-700 text-white rounded-none text-xs font-semibold h-7 border-none shadow-none"
            >
              Chi trả nợ ({(Number(supplier.currentDebt) || 0).toLocaleString('vi-VN')} đ)
            </Button>
          )}

          <Button
            size="small"
            icon={<CopyOutlined />}
            onClick={onCopy}
            className="rounded-none text-xs h-7"
          >
            Sao chép
          </Button>

          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={onEdit}
            className="rounded-none text-xs h-7"
          >
            Chỉnh sửa
          </Button>

          <Popconfirm
            title="Xóa nhà cung cấp"
            description={`Bạn có chắc chắn muốn xóa nhà cung cấp "${supplier.name}"?`}
            onConfirm={onDelete}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} className="rounded-none text-xs h-7">
              Xóa
            </Button>
          </Popconfirm>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200">
        <Segmented
          value={activeTab}
          onChange={(val: any) => setActiveTab(val)}
          options={[
            {
              label: (
                <span className="flex items-center gap-1.5 px-1 py-0.5 text-xs font-semibold">
                  <UserOutlined /> Thông tin chi tiết
                </span>
              ),
              value: 'info',
            },
            {
              label: (
                <span className="flex items-center gap-1.5 px-1 py-0.5 text-xs font-semibold">
                  <FileTextOutlined /> Lịch sử nhập hàng ({relatedPurchases.length})
                </span>
              ),
              value: 'orders',
            },
            {
              label: (
                <span className="flex items-center gap-1.5 px-1 py-0.5 text-xs font-semibold">
                  <WalletOutlined /> Công nợ &amp; Thanh toán
                </span>
              ),
              value: 'debt',
            },
          ]}
          className="bg-slate-200/70 p-1 rounded-none"
        />
      </div>

      {/* TAB 1: THÔNG TIN CHI TIẾT */}
      {activeTab === 'info' && (
        <div className="space-y-4">
          <div className="bg-white p-4 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Số điện thoại liên hệ</span>
              <span className="font-semibold text-slate-800 font-mono">{supplier.phone || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Email giao dịch</span>
              <span className="font-semibold text-slate-800">{supplier.email || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Mã số thuế (MST)</span>
              <span className="font-semibold text-slate-800 font-mono">{supplier.taxCode || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Người đại diện liên hệ</span>
              <span className="font-semibold text-slate-800">{supplier.contactPerson || '—'}</span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Tên doanh nghiệp / Công ty</span>
              <span className="font-semibold text-slate-800">{supplier.company || supplier.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Trạng thái hợp tác</span>
              <span className="font-semibold text-slate-800">
                {supplier.status === 'active' ? '🟢 Đang hợp tác' : '⚪ Tạm dừng'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Ngân hàng thụ hưởng</span>
              <span className="font-semibold text-slate-800">{supplier.bankName || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Số tài khoản thụ hưởng</span>
              <span className="font-semibold text-slate-800 font-mono text-[#784e34]">{supplier.bankAccount || '—'}</span>
            </div>

            <div className="sm:col-span-2">
              <span className="text-slate-400 block mb-0.5">Địa chỉ trụ sở / Kho bãi</span>
              <span className="font-semibold text-slate-800">{supplier.address || '—'}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-400 block mb-0.5">Ghi chú đối tác &amp; Danh mục vật tư chính</span>
              <span className="text-slate-800 italic">{supplier.note || 'Chưa có ghi chú đặc biệt.'}</span>
            </div>

            <div className="sm:col-span-4 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs">
              <div>
                <span className="text-slate-500">Tổng tiền mua tích lũy:</span>{' '}
                <strong className="text-slate-900 font-mono font-bold">
                  {(Number(supplier.totalPurchased) || 0).toLocaleString('vi-VN')} đ
                </strong>
              </div>
              <div>
                <span className="text-slate-500">Đã thanh toán:</span>{' '}
                <strong className="text-emerald-700 font-mono font-bold">
                  {(Number(supplier.totalCollected) || 0).toLocaleString('vi-VN')} đ
                </strong>
              </div>
              <div>
                <span className="text-slate-500">Công nợ cần trả hiện tại:</span>{' '}
                <strong className="text-rose-600 font-mono font-bold">
                  {(Number(supplier.currentDebt) || 0).toLocaleString('vi-VN')} đ
                </strong>
              </div>
              <div>
                <span className="text-slate-500">Ngày tạo hồ sơ / Hợp tác:</span>{' '}
                <strong className="text-slate-800">{supplier.createdAt ? dayjs(supplier.createdAt).format('DD/MM/YYYY') : '15/01/2025'}</strong>
              </div>
            </div>
          </div>

          {/* Công nợ chưa thanh toán alert banner */}
          {Number(supplier.currentDebt || 0) > 0 && (
            <div className="bg-white p-4 border border-rose-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-rose-700 text-xs flex items-center gap-1.5">
                  <WalletOutlined /> Danh sách chứng từ / Phiếu nhập hàng còn nợ NCC
                </span>
                <Button
                  size="small"
                  type="primary"
                  onClick={onOpenPayment}
                  className="bg-rose-600 hover:!bg-rose-700 text-white rounded-none text-xs font-semibold h-7 border-none shadow-none"
                >
                  Lập phiếu chi ngay
                </Button>
              </div>

              <div className="overflow-x-auto border border-slate-200">
                <table className="min-w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Mã phiếu nhập</th>
                      <th className="px-3 py-2 font-semibold">Kho tiếp nhận</th>
                      <th className="px-3 py-2 font-semibold">Vật tư &amp; Quy cách</th>
                      <th className="px-3 py-2 font-semibold text-right">Tổng giá trị</th>
                      <th className="px-3 py-2 font-semibold text-right text-rose-600">Nợ cần trả</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-slate-100 hover:bg-slate-50/60">
                      <td className="px-3 py-2 font-mono font-bold text-[#784e34]">#PN-2026-0036</td>
                      <td className="px-3 py-2 text-slate-700">Tổng Kho Bình Chánh</td>
                      <td className="px-3 py-2 text-slate-700">Khung Gỗ Óc Chó FAS &amp; Phụ kiện mộng chốt</td>
                      <td className="px-3 py-2 text-right font-mono">1,140,000,000 đ</td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-rose-600">
                        {(Number(supplier.currentDebt) || 0).toLocaleString('vi-VN')} đ
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LỊCH SỬ NHẬP/TRẢ HÀNG */}
      {activeTab === 'orders' && (
        <div className="bg-white p-4 border border-slate-200 space-y-3">
          {relatedPurchases.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">
              <FileTextOutlined className="text-2xl mb-1 block" />
              Chưa có chứng từ nhập hàng nào từ nhà cung cấp này.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200">
              <table className="min-w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Mã phiếu</th>
                    <th className="px-3 py-2 font-semibold">Kho tiếp nhận</th>
                    <th className="px-3 py-2 font-semibold">Hàng hóa / Vật tư</th>
                    <th className="px-3 py-2 font-semibold text-right">Tổng giá trị</th>
                    <th className="px-3 py-2 font-semibold">Thời gian</th>
                    <th className="px-3 py-2 font-semibold text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {relatedPurchases.map((po) => (
                    <tr key={po.id} className="hover:bg-slate-50/60">
                      <td className="px-3 py-2 font-mono font-bold text-[#784e34]">{po.code}</td>
                      <td className="px-3 py-2 text-slate-700">{po.warehouseName}</td>
                      <td className="px-3 py-2">
                        <div className="font-medium text-slate-900">{po.itemName}</div>
                        <div className="text-[11px] text-slate-500">{po.quantity}</div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">
                        {po.totalAmount.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="px-3 py-2 font-mono text-slate-600">{po.importDate}</td>
                      <td className="px-3 py-2 text-center">
                        <Tag color="success" className="text-[10px] m-0 font-medium">
                          Đã nhập kho
                        </Tag>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CÔNG NỢ & THANH TOÁN (COMPACT & BALANCED) */}
      {activeTab === 'debt' && (
        <div className="space-y-3">
          {/* Top Compact KPI Summary Bar */}
          <div className="bg-white p-2.5 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-500 font-medium">Tổng mua tích lũy:</span>
              <strong className="font-mono text-xs text-slate-900 font-bold">
                {(Number(supplier.totalPurchased) || 0).toLocaleString('vi-VN')} đ
              </strong>
            </div>

            <div className="flex items-center justify-between px-3 py-1.5 bg-emerald-50/50 border border-emerald-100">
              <span className="text-xs text-emerald-700 font-medium">Đã thanh toán:</span>
              <strong className="font-mono text-xs text-emerald-800 font-bold">
                {(Number(supplier.totalCollected) || 0).toLocaleString('vi-VN')} đ
              </strong>
            </div>

            <div className="flex items-center justify-between px-3 py-1.5 bg-rose-50/60 border border-rose-100">
              <span className="text-xs text-rose-700 font-bold">Nợ cần trả hiện tại:</span>
              <strong className="font-mono text-xs text-rose-700 font-bold">
                {(Number(supplier.currentDebt) || 0).toLocaleString('vi-VN')} đ
              </strong>
            </div>
          </div>

          {/* Lịch sử phiếu chi & thanh toán tiền hàng */}
          <div className="bg-white p-3.5 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileTextOutlined className="text-[#784e34]" /> Lịch sử phiếu chi &amp; Thanh toán ({relatedPayments.length})
              </span>
              <Button
                size="small"
                icon={<PlusOutlined />}
                onClick={onOpenPayment}
                className="rounded-none text-xs h-7 px-2.5"
              >
                Tạo phiếu chi
              </Button>
            </div>

            <div className="overflow-x-auto border border-slate-100">
              <table className="min-w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 text-xs">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Mã phiếu chi</th>
                    <th className="px-3 py-2 font-semibold">Thời gian</th>
                    <th className="px-3 py-2 font-semibold text-right">Số tiền chi</th>
                    <th className="px-3 py-2 font-semibold text-center">Hình thức thanh toán</th>
                    <th className="px-3 py-2 font-semibold">Người lập</th>
                    <th className="px-3 py-2 font-semibold">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {relatedPayments.map((pay) => (
                    <tr key={pay.id} className="hover:bg-slate-50/60">
                      <td className="px-3 py-2 font-mono font-bold text-[#784e34]">{pay.code}</td>
                      <td className="px-3 py-2 font-mono text-slate-600">{pay.date}</td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-emerald-700">
                        {pay.amount.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Tag color="cyan" className="text-[11px] m-0 font-medium">
                          {pay.method}
                        </Tag>
                      </td>
                      <td className="px-3 py-2 text-slate-800">{pay.creator}</td>
                      <td className="px-3 py-2 text-slate-600">{pay.note || '—'}</td>
                    </tr>
                  ))}
                  {relatedPayments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400 italic text-xs">
                        Chưa có chứng từ phiếu chi nào cho nhà cung cấp này.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SuppliersTab;
