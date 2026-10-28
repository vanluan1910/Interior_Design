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
  RightOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  AdminDataTable,
  AdminFilterSidebar,
  AdminSidebarSummary,
  AdminFormDrawer,
  AdminStatusBadge,
  AdminFilterDrawer,
  AdminSearchInput,
  AutoCodeButton,
  getNextCode,
} from '@/components/admin';
import { VietQrCard } from '@/components/common/VietQrCard';
import { exportToExcel } from '@/utils/exportExcel';
import type { AdminSupplier, StockImportSlip, SupplierReturnSlip } from '@/types/admin';
import { INITIAL_SUPPLIERS } from '@/data/admin/mockData';
import { supplierApi } from '@/api/supplierApi';
import { stockImportApi } from '@/api/stockImportApi';
import { isMatchBranch } from '@/utils/branchHelper';
import { ADMIN_STORAGE_KEYS, setStoredAdminData } from '@/utils/adminStorage';

export interface SuppliersTabProps {
  suppliersList?: AdminSupplier[];
  setSuppliersList?: React.Dispatch<React.SetStateAction<AdminSupplier[]>>;
  importsList?: StockImportSlip[];
  supplierReturnsList?: SupplierReturnSlip[];
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
  importsList: propImportsList,
  supplierReturnsList: propReturnsList = [],
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

  // Mobile UI States
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [mobileSort, setMobileSort] = useState<'name_asc' | 'debt_desc' | 'purchased_desc'>('name_asc');
  const [mobilePage, setMobilePage] = useState(1);

  // Selection & Accordion Detail Expansion State
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [expandedSupplierId, setExpandedSupplierId] = useState<string | null>(null);

  // Form Drawer States
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isSavingSupplier, setIsSavingSupplier] = useState(false);
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

  // Load Real Stock Imports for Purchase & Debt History
  const [apiImportsList, setApiImportsList] = useState<StockImportSlip[]>([]);

  React.useEffect(() => {
    if (propImportsList && propImportsList.length > 0) {
      setApiImportsList(propImportsList);
    } else {
      stockImportApi.getStockImports().then((data) => {
        if (data && Array.isArray(data)) {
          setApiImportsList(data as any);
        }
      }).catch(() => {});
    }
  }, [propImportsList]);

  // Purchase History for Detail View (derived from real stock imports)
  const purchaseHistory = useMemo(() => {
    const source = propImportsList || apiImportsList;
    return source.map((imp) => {
      const totalAmount = Number(imp.totalValue) || 0;
      const paidAmount = imp.paidAmount !== undefined ? Number(imp.paidAmount) : 0;
      const remainingDebt = imp.remainingDebt !== undefined
        ? Number(imp.remainingDebt)
        : (imp.debtAmount !== undefined
            ? Number(imp.debtAmount)
            : Math.max(0, totalAmount - paidAmount));

      return {
        id: imp.id,
        code: imp.code,
        supplierId: (imp as any).supplierId || imp.supplierCode || imp.supplier,
        supplierName: imp.supplier,
        warehouseName: imp.warehouseName,
        itemName: imp.itemName,
        quantity: imp.quantity || 1,
        unit: imp.unit || 'bộ',
        totalAmount,
        paidAmount,
        remainingDebt,
        importDate: imp.importDate,
        status: imp.status,
        statusLabel: imp.statusLabel,
      };
    });
  }, [propImportsList, apiImportsList]);

  // Enrich suppliers with real-time financial stats from stock imports & returns
  const enrichedSuppliersList = useMemo(() => {
    return suppliersList.map((sup) => {
      // Find all import slips matching this supplier
      const allSupplierPurchases = purchaseHistory.filter(
        (p) =>
          (p.supplierId && (p.supplierId === sup.id || p.supplierId === sup.code)) ||
          (p.supplierName && sup.name && p.supplierName.trim().toLowerCase() === sup.name.trim().toLowerCase())
      );

      // Find all return slips matching this supplier
      const returnsSource = propReturnsList || [];
      const allSupplierReturns = returnsSource.filter(
        (r) =>
          ((r as any).supplierId && ((r as any).supplierId === sup.id || (r as any).supplierId === sup.code)) ||
          (r.supplierName && sup.name && r.supplierName.trim().toLowerCase() === sup.name.trim().toLowerCase())
      );

      // Nếu NCC có phiếu trong hệ thống, tính toán lại dựa trên các phiếu thực tế đã nhập (loại trừ phiếu tạm draft)
      if (allSupplierPurchases.length > 0 || allSupplierReturns.length > 0) {
        const matchedPurchases = allSupplierPurchases.filter((p) => p.status !== 'draft');
        const matchedReturns = allSupplierReturns.filter((r) => (r as any).status !== 'draft');

        const returnDeduction = matchedReturns.reduce((sum, r) => sum + (Number(r.supplierRefund) || Number(r.totalValue) || 0), 0);
        const totalPurchased = matchedPurchases.reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0);
        const totalPaid = matchedPurchases.reduce((sum, p) => sum + (Number(p.paidAmount) || 0), 0);
        const grossDebt = matchedPurchases.reduce((sum, p) => sum + (Number(p.remainingDebt) || 0), 0);
        const netDebt = Math.max(0, grossDebt - returnDeduction);

        return {
          ...sup,
          totalPurchased,
          currentDebt: netDebt,
          totalCollected: totalPaid,
        };
      }

      return sup;
    });
  }, [suppliersList, purchaseHistory, propReturnsList]);

  // Filtered Suppliers Logic
  const filteredSuppliers = useMemo(() => {
    return enrichedSuppliersList.filter((s) => {
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
  }, [enrichedSuppliersList, searchQuery, statusFilter, debtFilter, selectedGlobalBranch]);

  const supplierActiveFiltersCount = useMemo(() => {
    return (
      (searchQuery ? 1 : 0) +
      (statusFilter !== 'all' ? 1 : 0) +
      (debtFilter !== 'all' ? 1 : 0) +
      (mobileSort !== 'name_asc' ? 1 : 0)
    );
  }, [searchQuery, statusFilter, debtFilter, mobileSort]);

  const sortedSuppliers = useMemo(() => {
    const list = [...filteredSuppliers];
    if (mobileSort === 'debt_desc') {
      return list.sort((a, b) => (Number(b.currentDebt) || 0) - (Number(a.currentDebt) || 0));
    }
    if (mobileSort === 'purchased_desc') {
      return list.sort((a, b) => (Number(b.totalPurchased) || 0) - (Number(a.totalPurchased) || 0));
    }
    return list.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'vi'));
  }, [filteredSuppliers, mobileSort]);

  const mobileTotalPages = Math.ceil(sortedSuppliers.length / 10) || 1;
  const paginatedSuppliers = useMemo(() => {
    return sortedSuppliers.slice((mobilePage - 1) * 10, mobilePage * 10);
  }, [sortedSuppliers, mobilePage]);

  const selectedSupplierRecord = useMemo(() => {
    if (selectedRowKeys.length === 1) {
      return enrichedSuppliersList.find((s) => s.id === selectedRowKeys[0]);
    }
    return null;
  }, [selectedRowKeys, enrichedSuppliersList]);

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
    const existingCodes = new Set(
      suppliersList
        .map((s) => (s.code || '').trim().toUpperCase())
        .filter(Boolean)
    );
    let nextNum = 1;
    let autoCode = `NCC${nextNum.toString().padStart(2, '0')}`;
    while (existingCodes.has(autoCode)) {
      nextNum++;
      autoCode = `NCC${nextNum.toString().padStart(2, '0')}`;
    }
    setDrawerOpen(true);
    setTimeout(() => {
      form.resetFields();
      form.setFieldsValue({
        code: autoCode,
        status: 'active',
        bankName: 'Vietcombank',
        branch: selectedGlobalBranch !== 'all' ? selectedGlobalBranch : undefined,
      });
    }, 0);
  };

  const handleGenerateSupplierCode = () => {
    const currentCode = form.getFieldValue('code');
    const autoCode = getNextCode(currentCode, suppliersList, 'NCC', 2);
    form.setFieldsValue({ code: autoCode });
    message.success(`Đã tự động tạo mã nhà cung cấp mới: ${autoCode}`);
  };

  // Open Edit Supplier Drawer
  const handleOpenEdit = (supplier: AdminSupplier) => {
    if (onOpenEditSupplier) {
      onOpenEditSupplier(supplier);
      return;
    }
    setEditingSupplier(supplier);
    setDrawerOpen(true);
    setTimeout(() => {
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
    }, 0);
  };

  // Handle Copy Supplier
  const handleCopySupplier = (sup: AdminSupplier) => {
    setEditingSupplier(null);
    const existingCodes = new Set(
      suppliersList
        .map((s) => (s.code || '').trim().toUpperCase())
        .filter(Boolean)
    );
    let nextNum = 1;
    let autoCode = `NCC${nextNum.toString().padStart(2, '0')}`;
    while (existingCodes.has(autoCode)) {
      nextNum++;
      autoCode = `NCC${nextNum.toString().padStart(2, '0')}`;
    }
    setDrawerOpen(true);
    setTimeout(() => {
      form.resetFields();
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
    }, 0);
  };

  // Handle Save Supplier (Create or Update)
  const handleSaveSupplier = async (values: any) => {
    const trimmedCode = (values.code || '').trim().toUpperCase();
    const trimmedName = (values.name || '').trim();

    if (!trimmedName) {
      message.error('Vui lòng nhập tên nhà cung cấp!');
      return;
    }

    if (isSavingSupplier) return;
    setIsSavingSupplier(true);

    try {
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
        const updated = await supplierApi.updateSupplier(editingSupplier.id, payload);
        const updatedList = suppliersList.map((s) =>
          s.id === editingSupplier.id ? { ...s, ...updated } : s
        );
        setSuppliersList(updatedList);
        setStoredAdminData(ADMIN_STORAGE_KEYS.SUPPLIERS, updatedList);
        message.success(`Đã cập nhật thông tin nhà cung cấp "${trimmedName}" thành công!`);
        setDrawerOpen(false);
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
        const created = await supplierApi.createSupplier(payload);
        const nextList = [created, ...suppliersList];
        setSuppliersList(nextList);
        setStoredAdminData(ADMIN_STORAGE_KEYS.SUPPLIERS, nextList);
        message.success(`Đã thêm nhà cung cấp "${created.name}" thành công!`);
        setDrawerOpen(false);
      }
    } catch (err: any) {
      message.error(err?.message || (editingSupplier ? 'Cập nhật nhà cung cấp thất bại.' : 'Thêm mới nhà cung cấp thất bại.'));
    } finally {
      setIsSavingSupplier(false);
    }
  };

  // Handle Delete Supplier
  const handleDeleteSupplier = async (id: string, name: string) => {
    try {
      await supplierApi.deleteSupplier(id);
      const nextList = suppliersList.filter((s) => s.id !== id);
      setSuppliersList(nextList);
      setStoredAdminData(ADMIN_STORAGE_KEYS.SUPPLIERS, nextList);
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
      const nextList = suppliersList.filter((s) => !keysToDelete.includes(s.id));
      setSuppliersList(nextList);
      setStoredAdminData(ADMIN_STORAGE_KEYS.SUPPLIERS, nextList);
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
      const XLSX = await import('xlsx');
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
      {/* 2-COLUMN LAYOUT: FILTER SIDEBAR + DATA TABLE (Desktop Only) */}
      <div className="hidden lg:flex flex-col lg:flex-row gap-4 items-start flex-1">
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
                  count: enrichedSuppliersList.filter((s) => Number(s.currentDebt || 0) > 0).length,
                },
                {
                  value: 'no_debt',
                  label: '🟢 Đã thanh toán hết',
                  count: enrichedSuppliersList.filter((s) => Number(s.currentDebt || 0) <= 0).length,
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
              { label: 'Tổng số nhà cung cấp', value: `${enrichedSuppliersList.length} đối tác` },
              {
                label: 'Đang hợp tác',
                value: `${enrichedSuppliersList.filter((s) => s.status === 'active').length} đối tác`,
                color: 'success',
              },
              {
                label: 'Tổng nợ cần trả NCC',
                value: `${(
                  enrichedSuppliersList.reduce((acc, s) => acc + (s.currentDebt || 0), 0) / 1000000
                ).toLocaleString('vi-VN')} Tr`,
                color: 'default',
              },
              {
                label: 'Tổng tiền mua hàng',
                value: `${(
                  enrichedSuppliersList.reduce((acc, s) => acc + (s.totalPurchased || 0), 0) / 1000000
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
            scroll={{ x: 'max-content' }}
            pagination={{ showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100'] }}
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
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedSupplierId((prev) => (prev === record.id ? null : record.id));
                    }}
                    className="font-semibold text-sm text-slate-900 hover:text-[#784e34] cursor-pointer whitespace-nowrap truncate transition-colors"
                    title={`${name}${record.company && record.company !== name ? ` (${record.company})` : ''}${record.address ? ` • ${record.address}` : ''}`}
                  >
                    {name}
                  </div>
                ),
              },
              {
                title: 'Người liên hệ & SĐT',
                key: 'contact',
                width: 220,
                render: (_, s) => {
                  const title = `${s.contactPerson || '---'}${s.phone ? ` • ${s.phone}` : ''}${s.email ? ` • ${s.email}` : ''}`;
                  return (
                    <div className="whitespace-nowrap truncate text-sm text-slate-800 flex items-center gap-1.5" title={title}>
                      <UserOutlined className="text-slate-400 text-xs shrink-0" />
                      <span className="truncate">{s.contactPerson || '---'}</span>
                      {s.phone && (
                        <span className="font-mono text-slate-500 text-xs shrink-0 font-normal">
                          ({s.phone})
                        </span>
                      )}
                    </div>
                  );
                },
              },
              {
                title: 'Tổng mua hàng',
                dataIndex: 'totalPurchased',
                key: 'totalPurchased',
                width: 170,
                align: 'right',
                render: (val) => (
                  <span className="font-mono font-semibold text-sm text-slate-900 whitespace-nowrap">
                    {(Number(val) || 0).toLocaleString('vi-VN')}&nbsp;đ
                  </span>
                ),
              },
              {
                title: 'Nợ cần trả hiện tại',
                dataIndex: 'currentDebt',
                key: 'currentDebt',
                width: 170,
                align: 'right',
                render: (debt) => {
                  const num = Number(debt || 0);
                  return (
                    <span
                      className={`font-mono font-semibold text-sm whitespace-nowrap ${
                        num > 0 ? 'text-rose-600' : 'text-slate-400'
                      }`}
                    >
                      {num.toLocaleString('vi-VN')}&nbsp;đ
                    </span>
                  );
                },
              },
              {
                title: 'Đã thanh toán',
                dataIndex: 'totalCollected',
                key: 'totalCollected',
                width: 175,
                align: 'right',
                render: (val, r) => {
                  const paid = val !== undefined ? Number(val) : Math.max(0, Number(r.totalPurchased || 0) - Number(r.currentDebt || 0));
                  return (
                    <span className="font-mono text-sm text-emerald-700 font-semibold whitespace-nowrap">
                      {paid.toLocaleString('vi-VN')}&nbsp;đ
                    </span>
                  );
                },
              },
              {
                title: 'Trạng thái',
                dataIndex: 'status',
                key: 'status',
                width: 135,
                align: 'center',
                render: (status: 'active' | 'inactive', s) => (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      handleChangeStatus(s.id, status === 'active' ? 'inactive' : 'active');
                    }}
                    className="cursor-pointer inline-block whitespace-nowrap"
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
            ]}
          />
        </div>
      </div>

      {/* MOBILE SUPPLIERS VIEW (Strictly Mobile Only) */}
      <div className="block lg:hidden space-y-3 flex-1 pb-24">
        {/* Mobile Search Bar */}
        <AdminSearchInput
          value={searchQuery}
          onChange={(val) => {
            setSearchQuery(val);
            setMobilePage(1);
          }}
          placeholder="Tìm mã, tên NCC, SĐT, MST..."
        />

        {/* Quick Action Buttons Row */}
        <div className="flex items-center justify-between gap-2">
          <Button
            size="small"
            icon={<FilterOutlined className={supplierActiveFiltersCount > 0 ? 'text-[#784e34]' : 'text-slate-600'} />}
            onClick={() => setIsMobileFilterOpen(true)}
            className={`h-8 w-8 !p-0 flex items-center justify-center rounded-lg border-slate-200 bg-white shadow-2xs hover:text-[#784e34] relative ${
              supplierActiveFiltersCount > 0 ? '!border-[#784e34] !text-[#784e34] !bg-amber-50/50' : 'text-slate-600'
            }`}
            title="Bộ lọc"
          >
            {supplierActiveFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#784e34] text-white rounded-full text-[9px] font-bold flex items-center justify-center shadow-xs">
                {supplierActiveFiltersCount}
              </span>
            )}
          </Button>
          <div className="flex items-center gap-1.5">
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={handleExportExcel}
              className="h-8 px-2.5 rounded-lg border-slate-200 text-xs text-slate-600 bg-white shadow-2xs hover:text-[#784e34]"
            >
              Xuất Excel
            </Button>
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={handleOpenCreate}
              className="h-8 px-3 rounded-lg !bg-[#784e34] !border-[#784e34] hover:!bg-[#5e3c28] text-xs font-semibold shadow-xs"
            >
              Thêm mới
            </Button>
          </div>
        </div>

        {/* Suppliers Cards List */}
        {paginatedSuppliers.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200/80 shadow-2xs">
            <ShopOutlined className="text-3xl text-slate-300 mb-2" />
            <p className="text-sm font-medium text-slate-600 m-0">Không tìm thấy nhà cung cấp nào phù hợp</p>
            <p className="text-xs text-slate-400 mt-1 mb-3">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            <Button
              size="small"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setDebtFilter('all');
              }}
              className="text-xs"
            >
              Đặt lại bộ lọc
            </Button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {paginatedSuppliers.map((supplier) => {
              const currentDebt = Number(supplier.currentDebt || 0);
              const totalPurchased = Number(supplier.totalPurchased || 0);

              return (
                <div
                  key={supplier.id}
                  className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs space-y-2.5 transition-all"
                >
                  {/* Top Bar: Name + Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Tag color="cyan" className="font-mono text-[11px] font-semibold m-0">
                          {supplier.code || 'NCC'}
                        </Tag>
                        {supplier.taxCode && (
                          <span className="text-[11px] text-slate-400 font-mono">
                            MST: {supplier.taxCode}
                          </span>
                        )}
                      </div>
                      <h4
                        className="font-bold text-slate-900 text-sm mt-1 mb-0 truncate cursor-pointer hover:text-[#784e34]"
                        onClick={() => handleOpenEdit(supplier)}
                      >
                        {supplier.name}
                      </h4>
                    </div>

                    <span
                      onClick={() => handleChangeStatus(supplier.id, supplier.status === 'active' ? 'inactive' : 'active')}
                      className="cursor-pointer shrink-0"
                      title="Nhấn để đổi trạng thái"
                    >
                      <AdminStatusBadge
                        status={supplier.status === 'active' ? 'active' : 'inactive'}
                        label={supplier.status === 'active' ? 'Đang hợp tác' : 'Tạm dừng'}
                        dot
                      />
                    </span>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1 text-xs text-slate-600 bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                    {supplier.contactPerson && (
                      <div className="flex items-center gap-1.5">
                        <UserOutlined className="text-slate-400 text-xs shrink-0" />
                        <span className="font-medium text-slate-700">{supplier.contactPerson}</span>
                      </div>
                    )}
                    {supplier.phone && (
                      <div className="flex items-center gap-1.5">
                        <PhoneOutlined className="text-slate-400 text-xs shrink-0" />
                        <a href={`tel:${supplier.phone}`} className="text-sky-600 hover:underline">
                          {supplier.phone}
                        </a>
                      </div>
                    )}
                    {supplier.email && (
                      <div className="flex items-center gap-1.5 truncate">
                        <MailOutlined className="text-slate-400 text-xs shrink-0" />
                        <span className="text-slate-600 truncate">{supplier.email}</span>
                      </div>
                    )}
                    {supplier.address && (
                      <div className="flex items-start gap-1.5">
                        <EnvironmentOutlined className="text-slate-400 text-xs shrink-0 mt-0.5" />
                        <span className="text-slate-500 line-clamp-1">{supplier.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Financial Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-amber-50/60 p-2 rounded-lg border border-amber-100/80">
                      <span className="text-slate-500 block text-[11px] mb-0.5">Còn nợ NCC</span>
                      <span
                        className={`font-mono font-bold text-xs ${
                          currentDebt > 0 ? 'text-rose-600' : 'text-emerald-700'
                        }`}
                      >
                        {currentDebt.toLocaleString('vi-VN')} đ
                      </span>
                    </div>

                    <div className="bg-slate-50/80 p-2 rounded-lg border border-slate-100">
                      <span className="text-slate-500 block text-[11px] mb-0.5">Tổng mua hàng</span>
                      <span className="font-mono font-bold text-xs text-[#784e34]">
                        {totalPurchased.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 gap-2">
                    {currentDebt > 0 ? (
                      <Button
                        size="small"
                        icon={<DollarOutlined />}
                        onClick={() => handleOpenPayment(supplier)}
                        className="h-7 text-xs !bg-emerald-600 !border-emerald-600 hover:!bg-emerald-700 text-white font-medium"
                      >
                        Thanh toán nợ
                      </Button>
                    ) : (
                      <div className="text-[11px] text-slate-400 italic">Đã hết nợ</div>
                    )}

                    <div className="flex items-center gap-1.5">
                      <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleOpenEdit(supplier)}
                        className="h-7 text-xs border-slate-200 text-slate-700"
                      >
                        Sửa
                      </Button>

                      <Popconfirm
                        title={`Xóa nhà cung cấp ${supplier.name}?`}
                        description="Hành động này không thể hoàn tác."
                        onConfirm={() => handleDeleteSupplier(supplier.id, supplier.name)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                      >
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          className="h-7 text-xs"
                        />
                      </Popconfirm>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Mobile Pagination */}
        {sortedSuppliers.length > 10 && (
          <div className="flex items-center justify-between pt-2 text-xs text-slate-600">
            <span>
              Tổng <strong>{sortedSuppliers.length}</strong> đối tác
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                size="small"
                disabled={mobilePage <= 1}
                onClick={() => setMobilePage((p) => Math.max(1, p - 1))}
                className="text-xs h-7"
              >
                Trước
              </Button>
              <span className="font-medium px-1">
                {mobilePage} / {mobileTotalPages}
              </span>
              <Button
                size="small"
                disabled={mobilePage >= mobileTotalPages}
                onClick={() => setMobilePage((p) => Math.min(mobileTotalPages, p + 1))}
                className="text-xs h-7"
              >
                Sau
              </Button>
            </div>
          </div>
        )}

        {/* Mobile Filter Drawer */}
        <AdminFilterDrawer
          open={isMobileFilterOpen}
          onClose={() => setIsMobileFilterOpen(false)}
          title="Bộ lọc nhà cung cấp"
          hasActiveFilters={supplierActiveFiltersCount > 0}
          onResetFilters={() => {
            setSearchQuery('');
            setStatusFilter('all');
            setDebtFilter('all');
            setMobileSort('name_asc');
            setMobilePage(1);
          }}
        >
          <div className="space-y-4">
            {/* Sắp xếp danh sách */}
            <div>
              <div className="mb-2 text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Sắp xếp danh sách
              </div>
              <Select
                value={mobileSort}
                onChange={(v) => {
                  setMobileSort(v);
                  setMobilePage(1);
                }}
                className="w-full text-xs"
                size="small"
                options={[
                  { value: 'name_asc', label: 'Tên A-Z' },
                  { value: 'debt_desc', label: 'Nợ giảm dần' },
                  { value: 'purchased_desc', label: 'Mua nhiều nhất' },
                ]}
              />
            </div>

            {/* Trạng thái hợp tác */}
            <div className="pt-2 border-t border-slate-100">
              <div className="mb-2 text-xs font-semibold text-slate-700 uppercase tracking-wide">
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
                      onClick={() => {
                        setStatusFilter(opt.value);
                        setMobilePage(1);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors cursor-pointer border-none ${
                        isSelected
                          ? 'bg-amber-50/80 font-semibold text-[#784e34]'
                          : 'bg-transparent text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{opt.label}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${
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
            <div className="pt-2 border-t border-slate-100">
              <div className="mb-2 text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Tình trạng công nợ
              </div>
              <div className="space-y-1">
                {[
                  { value: 'all', label: 'Tất cả đối tác' },
                  {
                    value: 'has_debt',
                    label: '🔴 Còn nợ cần trả',
                    count: enrichedSuppliersList.filter((s) => Number(s.currentDebt || 0) > 0).length,
                  },
                  {
                    value: 'no_debt',
                    label: '🟢 Đã thanh toán hết',
                    count: enrichedSuppliersList.filter((s) => Number(s.currentDebt || 0) <= 0).length,
                  },
                ].map((opt) => {
                  const isSelected = debtFilter === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setDebtFilter(opt.value);
                        setMobilePage(1);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors cursor-pointer border-none ${
                        isSelected
                          ? 'bg-amber-50/80 font-semibold text-[#784e34]'
                          : 'bg-transparent text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {opt.count !== undefined && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full ${
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

            {/* Thống kê đối tác */}
            <AdminSidebarSummary
              title="Thống kê đối tác NCC"
              items={[
                { label: 'Tổng số nhà cung cấp', value: `${enrichedSuppliersList.length} đối tác` },
                {
                  label: 'Đang hợp tác',
                  value: `${enrichedSuppliersList.filter((s) => s.status === 'active').length} đối tác`,
                  color: 'success',
                },
                {
                  label: 'Tổng nợ cần trả NCC',
                  value: `${(
                    enrichedSuppliersList.reduce((acc, s) => acc + (s.currentDebt || 0), 0) / 1000000
                  ).toLocaleString('vi-VN')} Tr`,
                  color: 'default',
                },
                {
                  label: 'Tổng tiền mua hàng',
                  value: `${(
                    enrichedSuppliersList.reduce((acc, s) => acc + (s.totalPurchased || 0), 0) / 1000000
                  ).toLocaleString('vi-VN')} Tr`,
                  color: 'primary',
                },
              ]}
            />
          </div>
        </AdminFilterDrawer>
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
        loading={isSavingSupplier}
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

            <Row gutter={[12, 12]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={<span className="text-xs font-semibold text-slate-800">Mã nhà cung cấp</span>}
                  name="code"
                >
                  <Input
                    placeholder="Tự động hoặc NCC01"
                    className="h-10 rounded-lg font-mono text-sm uppercase"
                    suffix={
                      <AutoCodeButton
                        onGenerate={handleGenerateSupplierCode}
                        tooltipTitle="Tự động tạo mã nhà cung cấp mới"
                      />
                    }
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={<span className="text-xs font-semibold text-slate-800">Mã số thuế (MST)</span>}
                  name="taxCode"
                >
                  <Input placeholder="VD: 0304567891" className="h-10 rounded-lg font-mono text-sm" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[12, 12]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={<span className="text-xs font-semibold text-slate-800">Người liên hệ / Đại diện</span>}
                  name="contactPerson"
                >
                  <Input placeholder="VD: David Johnson" className="h-10 rounded-lg text-sm" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={<span className="text-xs font-semibold text-slate-800">Số điện thoại liên hệ</span>}
                  name="phone"
                >
                  <Input placeholder="VD: 0908.123.456" className="h-10 rounded-lg font-mono text-sm" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[12, 12]}>
              <Col xs={24} sm={14}>
                <Form.Item label={<span className="text-xs font-semibold text-slate-800">Email giao dịch</span>} name="email">
                  <Input placeholder="sales@supplier.com" className="h-10 rounded-lg text-sm" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={10}>
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

            <Row gutter={[12, 12]}>
              <Col xs={24} sm={12}>
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
              <Col xs={24} sm={12}>
                <Form.Item label={<span className="text-xs font-semibold text-slate-800">Số tài khoản ngân hàng</span>} name="bankAccount">
                  <Input placeholder="VD: 0071001234567" className="h-10 rounded-lg font-mono text-sm" />
                </Form.Item>
              </Col>
            </Row>

            {/* Live VietQR Preview - Only QR code */}
            {watchedBankAccount && (
              <div className="bg-slate-50/70 p-3.5 rounded-xl border border-dashed border-slate-300 flex items-center justify-center">
                <VietQrCard
                  bankName={watchedBankName || 'MBBank'}
                  accountNumber={watchedBankAccount}
                  accountName={watchedCompanyName || 'NHÀ CUNG CẤP'}
                  paymentPrefix="THANH TOAN"
                  orderCode={form.getFieldValue('code') || 'NCC'}
                  amount={0}
                  showDetails={false}
                  className="max-w-[170px] p-1.5 bg-white border-slate-200 shadow-2xs"
                />
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
                    { value: 'transfer', label: 'Chuyển khoản ngân hàng' },
                    { value: 'cash', label: 'Tiền mặt' },
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
  onEdit?: () => void;
  onCopy?: () => void;
  onDelete?: () => void;
  onOpenPayment: () => void;
  onChangeStatus?: (status: 'active' | 'inactive') => void;
}

function SupplierExpandedDetailRow({
  supplier,
  purchaseHistory,
  paymentHistory,
  onOpenPayment,
}: SupplierExpandedDetailRowProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'orders' | 'debt'>('info');

  const relatedPurchases = useMemo(() => {
    return purchaseHistory.filter(
      (p) =>
        (p.supplierId && (p.supplierId === supplier.id || p.supplierId === supplier.code)) ||
        (p.supplierName && supplier.name && p.supplierName.trim().toLowerCase() === supplier.name.trim().toLowerCase())
    );
  }, [purchaseHistory, supplier.id, supplier.code, supplier.name]);


  const relatedPayments = useMemo(() => {
    return paymentHistory.filter((p) => p.supplierId === supplier.id || p.supplierName === supplier.name);
  }, [paymentHistory, supplier.id, supplier.name]);

  return (
    <div className="bg-[#fbf9f8] border-y border-slate-200 p-4 sm:p-5 -mx-4 space-y-4">
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
                        <div className="text-[11px] text-slate-500">Số lượng: {po.quantity}</div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">
                        {(po.totalAmount || 0).toLocaleString('vi-VN')} đ
                      </td>
                      <td className="px-3 py-2 font-mono text-slate-600">{po.importDate}</td>
                      <td className="px-3 py-2 text-center">
                        <Tag color={po.status === 'draft' ? 'gold' : 'success'} className="text-[10px] m-0 font-medium">
                          {po.statusLabel || (po.status === 'draft' ? 'Lưu tạm' : 'Đã nhập kho')}
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
