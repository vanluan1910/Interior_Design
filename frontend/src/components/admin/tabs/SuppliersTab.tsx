'use client';

import React, { useState, useMemo } from 'react';
import {
  Button,
  Select,
  Tag,
  Popconfirm,
  App,
  Drawer,
  Modal,
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
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  AdminDataTable,
  AdminFilterSidebar,
  AdminSidebarSummary,
  AdminSearchInput,
} from '@/components/admin';
import { exportToExcel } from '@/utils/exportExcel';
import type { AdminSupplier } from '@/types/admin';
import { INITIAL_SUPPLIERS } from '@/data/admin/mockData';

export interface SuppliersTabProps {
  suppliersList?: AdminSupplier[];
  setSuppliersList?: React.Dispatch<React.SetStateAction<AdminSupplier[]>>;
  selectedGlobalBranch?: string;
  onOpenCreateSupplier?: () => void;
  onOpenEditSupplier?: (supplier: AdminSupplier) => void;
  onSelectSupplierDetail?: (supplier: AdminSupplier) => void;
}

// Danh sách ngân hàng phổ biến
const BANK_OPTIONS = [
  { label: 'Vietcombank - Ngân hàng Ngoại thương', value: 'Vietcombank' },
  { label: 'Techcombank - Ngân hàng Kỹ thương', value: 'Techcombank' },
  { label: 'MBBank - Ngân hàng Quân đội', value: 'MBBank' },
  { label: 'ACB - Ngân hàng Á Châu', value: 'ACB' },
  { label: 'BIDV - Ngân hàng Đầu tư & Phát triển', value: 'BIDV' },
  { label: 'VietinBank - Ngân hàng Công thương', value: 'VietinBank' },
  { label: 'VPBank - Ngân hàng Thịnh Vượng', value: 'VPBank' },
  { label: 'TPBank - Ngân hàng Tiên Phong', value: 'TPBank' },
  { label: 'JPMorgan Chase Bank (Quốc tế)', value: 'JPMorgan Chase Bank' },
  { label: 'Deutsche Bank (Quốc tế)', value: 'Deutsche Bank' },
  { label: 'UniCredit Bank (Quốc tế)', value: 'UniCredit Bank' },
];

export function SuppliersTab({
  suppliersList: initialSuppliers = INITIAL_SUPPLIERS,
  setSuppliersList: externalSetSuppliersList,
  selectedGlobalBranch = 'all',
  onOpenCreateSupplier,
  onOpenEditSupplier,
  onSelectSupplierDetail,
}: SuppliersTabProps) {
  const { message, modal } = App.useApp();

  const [internalSuppliersList, setInternalSuppliersList] = useState<AdminSupplier[]>(initialSuppliers);
  const suppliersList = externalSetSuppliersList ? initialSuppliers : internalSuppliersList;
  const setSuppliersList = externalSetSuppliersList || setInternalSuppliersList;

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [debtFilter, setDebtFilter] = useState('all'); // 'all' | 'has_debt' | 'no_debt'

  // Selection state
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // Drawer Create / Edit States
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<AdminSupplier | null>(null);
  const [form] = Form.useForm();

  // Detail Drawer States
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<AdminSupplier | null>(null);
  const [detailTab, setDetailTab] = useState<'info' | 'orders' | 'debt'>('info');

  // Quick Debt Payment Drawer States
  const [paymentDrawerOpen, setPaymentDrawerOpen] = useState(false);
  const [payingSupplier, setPayingSupplier] = useState<AdminSupplier | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('transfer');
  const [paymentDate, setPaymentDate] = useState<string>(dayjs().format('YYYY-MM-DD HH:mm'));
  const [paymentNote, setPaymentNote] = useState<string>('');

  // Import Modal State
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Mock Payment History for Detail View
  const [paymentHistory, setPaymentHistory] = useState<
    Array<{
      id: string;
      code: string;
      supplierId: string;
      amount: number;
      method: string;
      date: string;
      note: string;
      creator: string;
    }>
  >([
    {
      id: 'pay_1',
      code: 'PC-2026-001',
      supplierId: 'sup_1',
      amount: 500000000,
      method: 'Chuyển khoản',
      date: '2026-03-20 14:30',
      note: 'Thanh toán đợt 1 tiền gỗ Óc Chó FAS',
      creator: 'Hương - Kế Toán',
    },
    {
      id: 'pay_2',
      code: 'PC-2026-002',
      supplierId: 'sup_1',
      amount: 400000000,
      method: 'Chuyển khoản',
      date: '2026-04-10 10:15',
      note: 'Thanh toán tiền hàng công nợ tháng 3',
      creator: 'Nguyễn Văn Luân',
    },
    {
      id: 'pay_3',
      code: 'PC-2026-003',
      supplierId: 'sup_3',
      amount: 150000000,
      method: 'Chuyển khoản',
      date: '2026-04-05 16:00',
      note: 'Thanh toán phụ kiện ray trượt Blum Legrabox',
      creator: 'Hương - Kế Toán',
    },
    {
      id: 'pay_4',
      code: 'PC-2026-004',
      supplierId: 'sup_4',
      amount: 200000000,
      method: 'Chuyển khoản',
      date: '2026-04-12 09:45',
      note: 'Thanh toán da Nappa nhập khẩu Mastrotto',
      creator: 'Nguyễn Văn Luân',
    },
    {
      id: 'pay_5',
      code: 'PC-2026-005',
      supplierId: 'sup_6',
      amount: 100000000,
      method: 'Tiền mặt',
      date: '2026-04-18 11:20',
      note: 'Thanh toán tiền phụ kiện tủ Hafele',
      creator: 'Hương - Kế Toán',
    },
  ]);

  // Mock Purchase History for Detail View
  const purchaseHistory = useMemo(() => {
    return [
      {
        id: 'po_1',
        code: 'PN000036',
        supplierId: 'sup_1',
        supplierName: 'Northwest Hardwoods (USA)',
        warehouseName: 'Tổng Kho Phân Phối & Giao Vận Bình Chánh',
        itemName: 'Khung Gỗ Óc Chó & Ghế Katakana Bắc Mỹ',
        quantity: '45 bộ',
        totalAmount: 1140000000,
        importDate: '2026-03-15 09:30',
        status: 'completed',
        inspector: 'Phạm Văn Tuấn (KCS)',
      },
      {
        id: 'po_2',
        code: 'PN000032',
        supplierId: 'sup_1',
        supplierName: 'Northwest Hardwoods (USA)',
        warehouseName: 'Tổng Kho Phân Phối & Giao Vận Bình Chánh',
        itemName: 'Khung Bàn Ăn Komorebi Sồi Trắng',
        quantity: '30 bộ',
        totalAmount: 710000000,
        importDate: '2026-02-28 14:15',
        status: 'completed',
        inspector: 'Phạm Văn Tuấn (KCS)',
      },
      {
        id: 'po_3',
        code: 'PN000028',
        supplierId: 'sup_2',
        supplierName: 'Pollmeier Furnierwerkstoffe (Đức)',
        warehouseName: 'Tổng Kho Phân Phối & Giao Vận Bình Chánh',
        itemName: 'Khung Giường Phản Tatami Gỗ Tự Nhiên',
        quantity: '25 chiếc',
        totalAmount: 980000000,
        importDate: '2026-02-10 10:00',
        status: 'completed',
        inspector: 'Nguyễn Đình Bảo',
      },
      {
        id: 'po_4',
        code: 'PN000025',
        supplierId: 'sup_3',
        supplierName: 'Blum Eurolux Fittings (Austria)',
        warehouseName: 'Kho Phụ Kiện & Vật Tư Kim Khí',
        itemName: 'Bản lề Clip Top Blumotion 110 & Ray Legrabox',
        quantity: '650 bộ',
        totalAmount: 420000000,
        importDate: '2026-03-05 11:30',
        status: 'completed',
        inspector: 'Trần Văn Mạnh',
      },
      {
        id: 'po_5',
        code: 'PN000022',
        supplierId: 'sup_4',
        supplierName: 'Gruppo Mastrotto (Italy)',
        warehouseName: 'Kho Da Bọc & Vật Liệu Đệm Mút',
        itemName: 'Da Bò Tự Nhiên Nappa Zen Full Grain',
        quantity: '450 m²',
        totalAmount: 560000000,
        importDate: '2026-03-18 15:45',
        status: 'completed',
        inspector: 'Lê Hoàng Long',
      },
      {
        id: 'po_6',
        code: 'PN000019',
        supplierId: 'sup_5',
        supplierName: 'Osmo Holz und Color (Đức)',
        warehouseName: 'Kho Sơn & Dầu Lau Hoàn Thiện',
        itemName: 'Dầu lau gỗ Polyx-Oil Clear Satin 3032',
        quantity: '120 thùng',
        totalAmount: 210000000,
        importDate: '2026-04-12 13:20',
        status: 'completed',
        inspector: 'Phạm Văn Tuấn (KCS)',
      },
      {
        id: 'po_7',
        code: 'PN000015',
        supplierId: 'sup_6',
        supplierName: 'Hafele Premium Furniture Systems',
        warehouseName: 'Kho Phụ Kiện & Vật Tư Kim Khí',
        itemName: 'Bộ tay nâng đôi Free fold & ray âm giảm chấn',
        quantity: '180 bộ',
        totalAmount: 340000000,
        importDate: '2026-05-02 09:10',
        status: 'completed',
        inspector: 'Nguyễn Đình Bảo',
      },
    ];
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

      const matchStatus = statusFilter === 'all' || s.status === statusFilter;

      let matchDebt = true;
      if (debtFilter === 'has_debt') matchDebt = Number(s.currentDebt || 0) > 0;
      if (debtFilter === 'no_debt') matchDebt = Number(s.currentDebt || 0) <= 0;

      return matchSearch && matchStatus && matchDebt;
    });
  }, [suppliersList, searchQuery, statusFilter, debtFilter]);

  // Handle Open Create Supplier Drawer
  const handleOpenCreate = () => {
    if (onOpenCreateSupplier) {
      onOpenCreateSupplier();
      return;
    }
    setEditingSupplier(null);
    form.resetFields();
    const nextNum = (suppliersList.length + 1).toString().padStart(2, '0');
    form.setFieldsValue({
      code: `NCC-${nextNum}`,
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      taxCode: '',
      bankName: '',
      bankAccount: '',
      company: '',
      status: 'active',
      note: '',
    });
    setDrawerOpen(true);
  };

  // Handle Open Edit Supplier Drawer
  const handleOpenEdit = (sup: AdminSupplier) => {
    if (onOpenEditSupplier) {
      onOpenEditSupplier(sup);
      return;
    }
    setEditingSupplier(sup);
    form.resetFields();
    form.setFieldsValue({
      code: sup.code,
      name: sup.name,
      contactPerson: sup.contactPerson,
      phone: sup.phone,
      email: sup.email,
      address: sup.address,
      taxCode: sup.taxCode || '',
      bankName: sup.bankName || '',
      bankAccount: sup.bankAccount || '',
      company: sup.company || sup.name,
      status: sup.status || 'active',
      note: sup.note || '',
    });
    setDrawerOpen(true);
  };

  // Handle Save Supplier (Create or Update)
  const handleSaveSupplier = (values: any) => {
    const trimmedCode = (values.code || '').trim().toUpperCase();
    const trimmedName = (values.name || '').trim();

    if (editingSupplier) {
      const updatedList = suppliersList.map((s) =>
        s.id === editingSupplier.id
          ? {
              ...s,
              code: trimmedCode,
              name: trimmedName,
              contactPerson: values.contactPerson || '',
              phone: values.phone || '',
              email: values.email || '',
              address: values.address || '',
              taxCode: values.taxCode || '',
              bankName: values.bankName || '',
              bankAccount: values.bankAccount || '',
              company: values.company || trimmedName,
              status: values.status || 'active',
              note: values.note || '',
            }
          : s
      );
      setSuppliersList(updatedList);
      if (selectedSupplier?.id === editingSupplier.id) {
        setSelectedSupplier({
          ...selectedSupplier,
          code: trimmedCode,
          name: trimmedName,
          contactPerson: values.contactPerson || '',
          phone: values.phone || '',
          email: values.email || '',
          address: values.address || '',
          taxCode: values.taxCode || '',
          bankName: values.bankName || '',
          bankAccount: values.bankAccount || '',
          company: values.company || trimmedName,
          status: values.status || 'active',
          note: values.note || '',
        });
      }
      message.success(`Đã cập nhật thông tin nhà cung cấp "${trimmedName}" thành công!`);
    } else {
      const newSup: AdminSupplier = {
        id: `sup_${Date.now()}`,
        code: trimmedCode || `NCC-${(suppliersList.length + 1).toString().padStart(2, '0')}`,
        name: trimmedName,
        contactPerson: values.contactPerson || '',
        phone: values.phone || '',
        email: values.email || '',
        address: values.address || '',
        totalPurchased: 0,
        currentDebt: 0,
        totalCollected: 0,
        status: values.status || 'active',
        taxCode: values.taxCode || '',
        bankName: values.bankName || '',
        bankAccount: values.bankAccount || '',
        company: values.company || trimmedName,
        createdAt: dayjs().format('YYYY-MM-DD HH:mm'),
        createdBy: 'Nguyễn Văn Luân',
        note: values.note || '',
      };
      setSuppliersList([newSup, ...suppliersList]);
      message.success(`Đã thêm nhà cung cấp "${newSup.name}" thành công!`);
    }
    setDrawerOpen(false);
  };

  // Handle Delete Supplier
  const handleDeleteSupplier = (id: string, name: string) => {
    setSuppliersList(suppliersList.filter((s) => s.id !== id));
    if (selectedSupplier?.id === id) {
      setDetailDrawerOpen(false);
    }
    message.success(`Đã xóa nhà cung cấp "${name}" thành công!`);
  };

  // Handle Change Supplier Status
  const handleChangeStatus = (id: string, newStatus: 'active' | 'inactive') => {
    const target = suppliersList.find((s) => s.id === id);
    setSuppliersList(
      suppliersList.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
    );
    if (selectedSupplier?.id === id) {
      setSelectedSupplier({ ...selectedSupplier, status: newStatus });
    }
    message.success(
      `Đã chuyển trạng thái nhà cung cấp "${target?.name || ''}" thành ${
        newStatus === 'active' ? 'Đang hợp tác' : 'Tạm dừng'
      }`
    );
  };

  // Handle Open Detail Drawer
  const handleOpenDetail = (supplier: AdminSupplier) => {
    if (onSelectSupplierDetail) {
      onSelectSupplierDetail(supplier);
      return;
    }
    setSelectedSupplier(supplier);
    setDetailTab('info');
    setDetailDrawerOpen(true);
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
      method: paymentMethod === 'transfer' ? 'Chuyển khoản' : paymentMethod === 'cash' ? 'Tiền mặt' : 'Cấn trừ công nợ',
      date: paymentDate,
      note: paymentNote,
      creator: 'Nguyễn Văn Luân',
    };

    setPaymentHistory([newPaymentSlip, ...paymentHistory]);

    // Update supplier debt & collected amount
    const updatedDebt = Math.max(0, Number(payingSupplier.currentDebt || 0) - paymentAmount);
    const updatedCollected = Number(payingSupplier.totalCollected || 0) + paymentAmount;

    setSuppliersList((prev) =>
      prev.map((s) =>
        s.id === payingSupplier.id
          ? { ...s, currentDebt: updatedDebt, totalCollected: updatedCollected }
          : s
      )
    );

    if (selectedSupplier?.id === payingSupplier.id) {
      setSelectedSupplier((prev) =>
        prev
          ? { ...prev, currentDebt: updatedDebt, totalCollected: updatedCollected }
          : null
      );
    }

    message.success(
      `Đã ghi nhận thanh toán ${(paymentAmount || 0).toLocaleString('vi-VN')} đ cho "${payingSupplier.name}"!`
    );
    setPaymentDrawerOpen(false);
  };

  // Export to Excel
  const handleExportExcel = () => {
    const data = filteredSuppliers.map((s) => ({
      'Mã NCC': s.code,
      'Tên nhà cung cấp': s.name,
      'Mã số thuế': s.taxCode || '',
      'Người liên hệ': s.contactPerson,
      'Điện thoại': s.phone,
      'Email': s.email,
      'Địa chỉ': s.address,
      'Ngân hàng': s.bankName || '',
      'Số tài khoản': s.bankAccount || '',
      'Tổng mua hàng (VNĐ)': s.totalPurchased || 0,
      'Nợ cần trả hiện tại (VNĐ)': s.currentDebt || 0,
      'Đã thanh toán (VNĐ)': s.totalCollected || 0,
      'Trạng thái': s.status === 'active' ? 'Đang hợp tác' : 'Tạm dừng',
      'Ghi chú': s.note || '',
    }));
    exportToExcel(data, `Danh_sach_nha_cung_cap_${dayjs().format('YYYYMMDD')}`);
    message.success('Đã xuất danh sách nhà cung cấp ra file Excel thành công!');
  };

  return (
    <div className="space-y-4 flex-1 flex flex-col h-full">
      {/* 1. TOP ACTION TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-none shadow-xs border border-slate-200/80">
        <div className="flex flex-1 items-center gap-2.5 min-w-[280px] max-w-xl">
          <AdminSearchInput
            placeholder="Tìm theo tên nhà cung cấp, mã NCC, SĐT, MST, người đại diện..."
            value={searchQuery}
            onChange={(val) => setSearchQuery(val)}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setDebtFilter('all');
              message.success('Đã làm mới danh sách nhà cung cấp!');
            }}
            className="h-10 rounded-none text-sm font-normal text-slate-700 hover:text-[#784e34]"
          >
            Làm mới
          </Button>

          <Button
            icon={<DownloadOutlined />}
            onClick={handleExportExcel}
            className="h-10 rounded-none text-sm font-normal text-slate-700 hover:text-[#784e34]"
          >
            Xuất Excel
          </Button>

          <Button
            icon={<UploadOutlined />}
            onClick={() => setImportModalOpen(true)}
            className="h-10 rounded-none text-sm font-normal text-slate-700 hover:text-[#784e34]"
          >
            Nhập Excel
          </Button>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenCreate}
            className="h-10 rounded-none bg-[#784e34] hover:!bg-[#5d371f] px-4 text-sm font-medium text-white shadow-none border-none flex items-center"
          >
            Thêm nhà cung cấp
          </Button>
        </div>
      </div>

      {/* 2. MAIN 2-COLUMN LAYOUT: FILTER SIDEBAR + DATA TABLE */}
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

          {/* Lọc theo công nợ */}
          <div className="pt-2 border-t border-slate-100">
            <div className="mb-2 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Công nợ phải trả
            </div>
            <div className="space-y-1">
              {[
                { value: 'all', label: 'Tất cả nhà cung cấp' },
                {
                  value: 'has_debt',
                  label: '🔴 Đang có nợ cần trả',
                  count: suppliersList.filter((s) => Number(s.currentDebt || 0) > 0).length,
                },
                {
                  value: 'no_debt',
                  label: '🟢 Đã thanh toán hết (0đ)',
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

        {/* Right Suppliers Data Table */}
        <div className="flex-1 w-full min-w-0">
          <AdminDataTable
            titleText="Danh Sách Nhà Cung Cấp &amp; Đối Tác Vật Tư Gỗ Mộc"
            titleIcon={<span className="w-2.5 h-2.5 rounded-full bg-[#784e34] inline-block" />}
            countTag={`${filteredSuppliers.length} nhà cung cấp`}
            dataSource={filteredSuppliers}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            columns={[
              {
                title: 'Mã NCC',
                dataIndex: 'code',
                key: 'code',
                width: 110,
                render: (code, record) => (
                  <button
                    type="button"
                    onClick={() => handleOpenDetail(record)}
                    className="font-mono text-xs text-[#784e34] bg-[#784e34]/10 hover:bg-[#784e34]/20 px-2.5 py-1 rounded font-semibold whitespace-nowrap border-none cursor-pointer text-left"
                    title="Bấm để xem chi tiết nhà cung cấp"
                  >
                    {code}
                  </button>
                ),
              },
              {
                title: 'Tên nhà cung cấp / Doanh nghiệp',
                key: 'name',
                render: (_, s) => (
                  <div>
                    <button
                      type="button"
                      onClick={() => handleOpenDetail(s)}
                      className="font-semibold text-sm text-slate-900 hover:text-[#784e34] flex items-center gap-1.5 border-none bg-transparent p-0 cursor-pointer text-left"
                    >
                      <ShopOutlined className="text-[#784e34]" />
                      <span>{s.name}</span>
                    </button>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                      {s.taxCode && <span className="font-mono">MST: {s.taxCode}</span>}
                      {s.taxCode && <span>•</span>}
                      <span className="truncate max-w-[260px]" title={s.address}>
                        {s.address}
                      </span>
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
                      <span>{s.contactPerson}</span>
                    </div>
                    <div className="font-mono text-sm text-slate-600 mt-0.5">{s.phone}</div>
                    <div className="text-xs text-slate-400 truncate max-w-[170px]" title={s.email}>
                      {s.email}
                    </div>
                  </div>
                ),
              },
              {
                title: 'Tổng mua hàng',
                dataIndex: 'totalPurchased',
                key: 'totalPurchased',
                width: 150,
                align: 'right',
                render: (val) => (
                  <span className="font-mono font-semibold text-sm text-slate-900">
                    {(val || 0).toLocaleString('vi-VN')} đ
                  </span>
                ),
              },
              {
                title: 'Nợ cần trả hiện tại',
                dataIndex: 'currentDebt',
                key: 'currentDebt',
                width: 160,
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
                width: 150,
                align: 'right',
                render: (val, r) => {
                  const paid = val !== undefined ? Number(val) : Math.max(0, Number(r.totalPurchased || 0) - Number(r.currentDebt || 0));
                  return (
                    <span className="font-mono text-sm text-emerald-700">
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
                  <Tag
                    color={status === 'active' ? 'emerald' : 'default'}
                    className="cursor-pointer text-xs font-semibold px-2.5 py-0.5 rounded-full select-none"
                    onClick={() => handleChangeStatus(s.id, status === 'active' ? 'inactive' : 'active')}
                    title="Bấm để đổi trạng thái hợp tác"
                  >
                    {status === 'active' ? '● Đang hợp tác' : '○ Tạm dừng'}
                  </Tag>
                ),
              },
              {
                title: 'Thao tác',
                key: 'actions',
                width: 130,
                align: 'center',
                render: (_, s) => (
                  <Space size={2} onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="Xem chi tiết & lịch sử">
                      <Button
                        size="small"
                        type="text"
                        icon={<EyeOutlined className="text-slate-600 hover:text-[#784e34]" />}
                        onClick={() => handleOpenDetail(s)}
                        className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100"
                      />
                    </Tooltip>

                    <Tooltip title="Chỉnh sửa thông tin">
                      <Button
                        size="small"
                        type="text"
                        icon={<EditOutlined className="text-slate-600 hover:text-[#784e34]" />}
                        onClick={() => handleOpenEdit(s)}
                        className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100"
                      />
                    </Tooltip>

                    <Tooltip title="Chi trả tiền hàng / Thanh toán nợ">
                      <Button
                        size="small"
                        type="text"
                        icon={<WalletOutlined className="text-emerald-600 hover:text-emerald-700" />}
                        onClick={() => handleOpenPayment(s)}
                        className="w-8 h-8 flex items-center justify-center rounded hover:bg-emerald-50"
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
                          icon={<DeleteOutlined className="text-rose-500 hover:text-rose-700" />}
                          className="w-8 h-8 flex items-center justify-center rounded hover:bg-rose-50"
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

      {/* 3. DRAWER CHI TIẾT NHÀ CUNG CẤP (DETAIL DRAWER - 3 TABS DOMACO POS) */}
      <Drawer
        title={
          selectedSupplier ? (
            <div className="flex items-center justify-between w-full pr-6">
              <div className="flex items-center gap-3">
                <span className="font-bold text-base text-slate-900">{selectedSupplier.name}</span>
                <span className="font-mono text-xs font-bold text-[#784e34] bg-[#784e34]/10 px-2 py-0.5 rounded">
                  {selectedSupplier.code}
                </span>
                <Tag color={selectedSupplier.status === 'active' ? 'emerald' : 'default'} className="font-semibold text-xs">
                  {selectedSupplier.status === 'active' ? 'Đang hợp tác' : 'Tạm dừng'}
                </Tag>
              </div>
              <Button
                icon={<EditOutlined />}
                onClick={() => {
                  setDetailDrawerOpen(false);
                  handleOpenEdit(selectedSupplier);
                }}
                className="text-xs font-semibold rounded-lg"
              >
                Chỉnh sửa
              </Button>
            </div>
          ) : (
            'Chi tiết nhà cung cấp'
          )
        }
        open={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        styles={{ wrapper: { width: 880, maxWidth: '100vw' } }}
        destroyOnHidden
      >
        {selectedSupplier && (
          <div className="space-y-5">
            {/* Tabs Header */}
            <Segmented
              value={detailTab}
              onChange={(val: any) => setDetailTab(val)}
              options={[
                { value: 'info', label: <span className="px-3 py-1 font-semibold text-xs sm:text-sm">🏢 Thông tin đối tác</span> },
                { value: 'orders', label: <span className="px-3 py-1 font-semibold text-xs sm:text-sm">📦 Lịch sử nhập/trả hàng</span> },
                { value: 'debt', label: <span className="px-3 py-1 font-semibold text-xs sm:text-sm">💳 Công nợ &amp; Thanh toán</span> },
              ]}
              className="w-full bg-slate-100 p-1 rounded-lg"
              block
            />

            {/* TAB 1: THÔNG TIN CHI TIẾT */}
            {detailTab === 'info' && (
              <div className="space-y-4">
                {/* Thông tin liên hệ & Pháp nhân */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2 m-0">
                    <ShopOutlined className="text-[#784e34]" /> Thông tin doanh nghiệp &amp; Liên hệ
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block">Tên nhà cung cấp / Công ty:</span>
                      <strong className="text-slate-900 text-sm">{selectedSupplier.name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Mã số thuế / Tax ID:</span>
                      <strong className="font-mono text-slate-900">{selectedSupplier.taxCode || '---'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Người đại diện liên hệ:</span>
                      <span className="font-medium text-slate-900">{selectedSupplier.contactPerson || '---'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Số điện thoại:</span>
                      <span className="font-mono font-medium text-slate-900">{selectedSupplier.phone || '---'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Email giao dịch:</span>
                      <span className="text-slate-900">{selectedSupplier.email || '---'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Ngày bắt đầu hợp tác:</span>
                      <span className="font-mono text-slate-700">{selectedSupplier.createdAt || '2026-01-15'}</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-500 block">Địa chỉ trụ sở / Kho bãi:</span>
                      <span className="text-slate-900">{selectedSupplier.address || '---'}</span>
                    </div>
                  </div>
                </div>

                {/* Tài khoản ngân hàng thụ hưởng */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2 m-0">
                    <BankOutlined className="text-emerald-600" /> Tài khoản ngân hàng thụ hưởng
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block">Tên ngân hàng:</span>
                      <strong className="text-slate-900">{selectedSupplier.bankName || 'Chưa cập nhật'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Số tài khoản:</span>
                      <strong className="font-mono text-slate-900 text-sm">{selectedSupplier.bankAccount || 'Chưa cập nhật'}</strong>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-500 block">Chủ tài khoản thụ hưởng:</span>
                      <span className="font-medium text-slate-900">{selectedSupplier.company || selectedSupplier.name}</span>
                    </div>
                  </div>
                </div>

                {/* Ghi chú & Đánh giá chất lượng hàng */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                  <span className="text-slate-500 block font-semibold">Ghi chú đối tác &amp; Danh mục vật tư chính:</span>
                  <div className="text-slate-800 bg-white p-3 rounded-lg border border-slate-200 italic">
                    {selectedSupplier.note || 'Chưa có ghi chú đặc biệt cho đối tác này.'}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: LỊCH SỬ NHẬP & TRẢ HÀNG */}
            {detailTab === 'orders' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Chứng từ nhập hàng &amp; Trả hàng
                  </span>
                  <span className="text-xs text-slate-500">
                    Tổng cộng:{' '}
                    <strong>
                      {purchaseHistory.filter((p) => p.supplierId === selectedSupplier.id).length} phiếu
                    </strong>
                  </span>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Mã phiếu</th>
                        <th className="py-2.5 px-3">Kho tiếp nhận</th>
                        <th className="py-2.5 px-3">Hàng hóa / Vật tư</th>
                        <th className="py-2.5 px-3 text-right">Tổng giá trị</th>
                        <th className="py-2.5 px-3">Thời gian</th>
                        <th className="py-2.5 px-3 text-center">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {purchaseHistory
                        .filter((p) => p.supplierId === selectedSupplier.id)
                        .map((po) => (
                          <tr key={po.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2.5 px-3 font-mono font-bold text-[#784e34]">{po.code}</td>
                            <td className="py-2.5 px-3 text-slate-700">{po.warehouseName}</td>
                            <td className="py-2.5 px-3 text-slate-900 font-medium">
                              <div>{po.itemName}</div>
                              <div className="text-[11px] text-slate-500">{po.quantity}</div>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                              {(po.totalAmount || 0).toLocaleString('vi-VN')} đ
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-500">{po.importDate}</td>
                            <td className="py-2.5 px-3 text-center">
                              <Tag color="green" className="font-semibold text-xs">
                                ✓ Đã nhập kho
                              </Tag>
                            </td>
                          </tr>
                        ))}
                      {purchaseHistory.filter((p) => p.supplierId === selectedSupplier.id).length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                            Chưa có lịch sử nhập hàng nào từ nhà cung cấp này.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: LỊCH SỬ THANH TOÁN & CÔNG NỢ */}
            {detailTab === 'debt' && (
              <div className="space-y-4">
                {/* Prominent Debt Banner with Payment Button */}
                <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 p-4 rounded-xl border border-amber-200/90 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold text-amber-900 uppercase tracking-wide">
                      Tình trạng công nợ phải trả NCC
                    </div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-mono text-2xl font-bold text-rose-600">
                        {(Number(selectedSupplier.currentDebt) || 0).toLocaleString('vi-VN')} đ
                      </span>
                      {Number(selectedSupplier.currentDebt || 0) > 0 ? (
                        <Tag color="error" className="font-semibold text-xs">
                          Đang có nợ gối đầu
                        </Tag>
                      ) : (
                        <Tag color="success" className="font-semibold text-xs">
                          Đã thanh toán 100%
                        </Tag>
                      )}
                    </div>
                  </div>

                  <Button
                    type="primary"
                    icon={<WalletOutlined />}
                    onClick={() => handleOpenPayment(selectedSupplier)}
                    className="h-10 px-5 bg-[#784e34] hover:!bg-[#5d371f] font-bold text-sm text-white rounded-lg shadow-none border-none flex items-center gap-1.5"
                  >
                    Thanh toán / Chi tiền hàng ngay
                  </Button>
                </div>

                {/* Payment History Table */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                  <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Lịch sử chứng từ phiếu chi đã ghi nhận
                    </span>
                    <span className="text-xs text-slate-500">
                      Tổng đã thanh toán:{' '}
                      <strong className="text-emerald-700 font-mono">
                        {(
                          paymentHistory
                            .filter((p) => p.supplierId === selectedSupplier.id)
                            .reduce((acc, c) => acc + c.amount, 0) || 0
                        ).toLocaleString('vi-VN')}{' '}
                        đ
                      </strong>
                    </span>
                  </div>

                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-600 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Mã phiếu chi</th>
                        <th className="py-2.5 px-3">Ngày chi</th>
                        <th className="py-2.5 px-3 text-right">Số tiền chi</th>
                        <th className="py-2.5 px-3">Hình thức</th>
                        <th className="py-2.5 px-3">Người lập</th>
                        <th className="py-2.5 px-3">Nội dung / Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paymentHistory
                        .filter((p) => p.supplierId === selectedSupplier.id)
                        .map((pay) => (
                          <tr key={pay.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">{pay.code}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-600">{pay.date}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                              {pay.amount.toLocaleString('vi-VN')} đ
                            </td>
                            <td className="py-2.5 px-3 text-slate-700">
                              <Tag color="blue" className="text-xs font-medium">
                                {pay.method}
                              </Tag>
                            </td>
                            <td className="py-2.5 px-3 text-slate-800">{pay.creator}</td>
                            <td className="py-2.5 px-3 text-slate-600">{pay.note}</td>
                          </tr>
                        ))}
                      {paymentHistory.filter((p) => p.supplierId === selectedSupplier.id).length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                            Chưa có chứng từ phiếu chi nào cho nhà cung cấp này.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* 4. DRAWER TẠO MỚI / CHỈNH SỬA NHÀ CUNG CẤP (CREATE / EDIT DRAWER) */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-slate-900">
              {editingSupplier ? 'Chỉnh sửa nhà cung cấp' : 'Thêm mới nhà cung cấp'}
            </span>
          </div>
        }
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        styles={{ wrapper: { width: 620, maxWidth: '100vw' } }}
        destroyOnHidden
        footer={
          <div className="flex items-center justify-between">
            <Button onClick={() => setDrawerOpen(false)} className="h-10 px-5 text-sm font-semibold rounded-lg">
              Hủy bỏ
            </Button>
            <Button
              type="primary"
              onClick={() => form.submit()}
              className="h-10 px-6 bg-[#784e34] hover:!bg-[#5d371f] text-sm font-bold text-white rounded-lg border-none shadow-none"
            >
              {editingSupplier ? 'Lưu thay đổi' : 'Tạo nhà cung cấp'}
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleSaveSupplier} className="space-y-4">
          {/* SECTION 1: THÔNG TIN CƠ BẢN */}
          <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2 m-0">
              <ShopOutlined className="text-[#784e34]" /> Thông tin cơ bản
            </h4>

            <Form.Item
              label={<span className="text-xs font-semibold text-slate-800">Tên nhà cung cấp / Doanh nghiệp</span>}
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
                  rules={[{ required: true, message: 'Vui lòng nhập mã NCC' }]}
                >
                  <Input placeholder="NCC-01" className="h-10 rounded-lg font-mono text-sm uppercase" />
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
                  rules={[{ required: true, message: 'Vui lòng nhập tên người liên hệ' }]}
                >
                  <Input placeholder="VD: David Johnson" className="h-10 rounded-lg text-sm" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={<span className="text-xs font-semibold text-slate-800">Số điện thoại liên hệ</span>}
                  name="phone"
                  rules={[{ required: true, message: 'Vui lòng nhập SĐT' }]}
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
                <Form.Item label={<span className="text-xs font-semibold text-slate-800">Trạng thái hợp tác</span>} name="status">
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
              rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
            >
              <Input placeholder="Số nhà, đường, KCN, quận/huyện, tỉnh/thành..." className="h-10 rounded-lg text-sm" />
            </Form.Item>
          </div>

          {/* SECTION 2: TÀI KHOẢN NGÂN HÀNG */}
          <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2 m-0">
              <BankOutlined className="text-emerald-600" /> Tài khoản ngân hàng thụ hưởng
            </h4>

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
          </div>

          {/* SECTION 3: GHI CHÚ */}
          <Form.Item label={<span className="text-xs font-semibold text-slate-800">Ghi chú &amp; Danh mục vật tư</span>} name="note">
            <Input.TextArea rows={3} placeholder="VD: Cung ứng gỗ FAS, phụ kiện giảm chấn Blum..." className="rounded-lg text-sm" />
          </Form.Item>
        </Form>
      </Drawer>

      {/* 5. DRAWER LẬP PHIẾU CHI / THANH TOÁN TIỀN HÀNG (QUICK DEBT PAYMENT DRAWER) */}
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
                rows={3}
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                placeholder="VD: Thanh toán tiền hàng đợt 2 theo hợp đồng..."
                className="rounded-lg text-sm"
              />
            </div>
          </div>
        )}
      </Drawer>

      {/* 6. MODAL NHẬP EXCEL NHÀ CUNG CẤP */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <UploadOutlined className="text-[#784e34]" />
            <span className="font-bold text-slate-900">Nhập danh sách nhà cung cấp từ Excel</span>
          </div>
        }
        open={importModalOpen}
        onCancel={() => setImportModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setImportModalOpen(false)}>
            Đóng
          </Button>,
          <Button
            key="download"
            icon={<DownloadOutlined />}
            onClick={() => {
              const template = [
                {
                  'Mã NCC': 'NCC-99',
                  'Tên nhà cung cấp': 'Công ty Gỗ Mẫu',
                  'Mã số thuế': '0101234567',
                  'Người liên hệ': 'Nguyễn Văn A',
                  'Điện thoại': '0901234567',
                  'Email': 'supplier@example.com',
                  'Địa chỉ': 'Hà Nội',
                  'Ngân hàng': 'Vietcombank',
                  'Số tài khoản': '001100223344',
                },
              ];
              exportToExcel(template, 'Mau_nhap_nha_cung_cap');
              message.success('Đã tải file mẫu nhập nhà cung cấp!');
            }}
          >
            Tải file mẫu
          </Button>,
        ]}
      >
        <div className="py-4 text-center space-y-3">
          <p className="text-xs text-slate-600">
            Kéo thả hoặc tải lên file Excel (.xlsx) chứa thông tin nhà cung cấp theo chuẩn biểu mẫu Domaco POS.
          </p>
          <Upload.Dragger
            maxCount={1}
            beforeUpload={(file) => {
              message.success(`Đã nhận file ${file.name}, đang xử lý nhập dữ liệu...`);
              setImportModalOpen(false);
              return false;
            }}
          >
            <p className="ant-upload-drag-icon text-3xl text-[#784e34]">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text text-sm font-semibold text-slate-800">
              Nhấp hoặc kéo thả file Excel vào đây
            </p>
            <p className="ant-upload-hint text-xs text-slate-500">
              Hỗ trợ định dạng .xlsx, .xls. Tối đa 10MB.
            </p>
          </Upload.Dragger>
        </div>
      </Modal>
    </div>
  );
}

export default SuppliersTab;
