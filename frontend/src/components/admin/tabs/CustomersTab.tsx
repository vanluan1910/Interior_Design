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
  Radio,
  DatePicker,
  InputNumber,
  Segmented,
  Upload,
  Tooltip,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
  DownloadOutlined,
  UploadOutlined,
  SearchOutlined,
  UserOutlined,
  DollarOutlined,
  WalletOutlined,
  ShoppingCartOutlined,
  GiftOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  AdminDataTable,
  AdminFilterSidebar,
  AdminSidebarSummary,
  AdminSearchInput,
} from '@/components/admin';
import type { AdminCustomer } from '@/types/admin';
import { INITIAL_ORDERS } from '@/data/admin/mockData';
import { isMatchBranch } from '@/utils/branchHelper';

export interface CustomersTabProps {
  customersList: AdminCustomer[];
  setCustomersList: React.Dispatch<React.SetStateAction<AdminCustomer[]>>;
  selectedGlobalBranch?: string;
  onOpenCreateCustomer?: () => void;
  onOpenEditCustomer?: (customer: AdminCustomer) => void;
  onSelectCustomerDetail?: (customer: AdminCustomer) => void;
}

// Danh sách ngân hàng phổ biến (Domaco POS Spec)
const BANK_OPTIONS = [
  { label: 'Vietcombank - Ngân hàng Ngoại thương Việt Nam', value: 'Vietcombank' },
  { label: 'Techcombank - Ngân hàng Kỹ thương Việt Nam', value: 'Techcombank' },
  { label: 'MBBank - Ngân hàng Quân đội', value: 'MBBank' },
  { label: 'ACB - Ngân hàng Á Châu', value: 'ACB' },
  { label: 'BIDV - Ngân hàng Đầu tư & Phát triển Việt Nam', value: 'BIDV' },
  { label: 'VietinBank - Ngân hàng Công thương Việt Nam', value: 'VietinBank' },
  { label: 'VPBank - Ngân hàng Việt Nam Thịnh Vượng', value: 'VPBank' },
  { label: 'TPBank - Ngân hàng Tiên Phong', value: 'TPBank' },
];

export function CustomersTab({
  customersList,
  setCustomersList,
  selectedGlobalBranch = 'all',
  onOpenCreateCustomer,
  onOpenEditCustomer,
  onSelectCustomerDetail,
}: CustomersTabProps) {
  const { message, modal } = App.useApp();

  // Search & Filter States
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [debtFilter, setDebtFilter] = useState('all'); // 'all' | 'has_debt' | 'no_debt'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'

  // Table Selection & Accordion Expansion States
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);

  // Drawer / Modal States
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<AdminCustomer | null>(null);
  const [form] = Form.useForm();
  const [customerTypeChoice, setCustomerTypeChoice] = useState<'individual' | 'organization'>('individual');

  // Quick Debt Collection Modal
  const [collectDebtCustomer, setCollectDebtCustomer] = useState<AdminCustomer | null>(null);
  const [collectAmount, setCollectAmount] = useState<number>(0);
  const [collectMethod, setCollectMethod] = useState<string>('transfer');
  const [collectNote, setCollectNote] = useState<string>('');

  // Import Excel Modal
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Filtered Customers Logic
  const filteredCustomers = useMemo(() => {
    return customersList.filter((c) => {
      const q = customerSearchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        (c.name || '').toLowerCase().includes(q) ||
        (c.code || '').toLowerCase().includes(q) ||
        (c.phone || '').includes(q) ||
        (c.phone2 || '').includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.address || '').toLowerCase().includes(q) ||
        (c.buyerName || '').toLowerCase().includes(q) ||
        (c.companyName || '').toLowerCase().includes(q) ||
        (c.taxId || '').toLowerCase().includes(q);

      const matchStatus = statusFilter === 'all' || (c.status || 'active') === statusFilter;

      let matchDebt = true;
      if (debtFilter === 'has_debt') matchDebt = Number(c.debt || 0) > 0;
      if (debtFilter === 'no_debt') matchDebt = Number(c.debt || 0) <= 0;

      const matchBranch = isMatchBranch(c.branch || c.branchName || c.salesRep || c.address, selectedGlobalBranch);

      return matchSearch && matchStatus && matchDebt && matchBranch;
    });
  }, [customersList, customerSearchQuery, debtFilter, statusFilter, selectedGlobalBranch]);

  // Open Create Customer Drawer
  const handleOpenCreate = () => {
    if (onOpenCreateCustomer) {
      onOpenCreateCustomer();
      return;
    }
    setEditingCustomer(null);
    setCustomerTypeChoice('individual');
    form.resetFields();
    const autoCode = `KH-${(customersList.length + 1).toString().padStart(3, '0')}`;
    form.setFieldsValue({
      code: autoCode,
      customerType: 'individual',
      status: 'active',
      country: 'Việt Nam',
    });
    setDrawerOpen(true);
  };

  // Open Edit Customer Drawer
  const handleOpenEdit = (customer: AdminCustomer) => {
    if (onOpenEditCustomer) {
      onOpenEditCustomer(customer);
      return;
    }
    setEditingCustomer(customer);
    setCustomerTypeChoice(customer.customerType || 'individual');
    form.resetFields();
    form.setFieldsValue({
      code: customer.code,
      name: customer.name,
      phone: customer.phone,
      phone2: customer.phone2,
      email: customer.email,
      facebook: customer.facebook,
      zalo: customer.zalo,
      gender: customer.gender,
      birthday: customer.birthday ? dayjs(customer.birthday) : null,
      address: customer.address,
      status: customer.status || 'active',
      customerType: customer.customerType || 'individual',
      companyName: customer.companyName,
      buyerName: customer.buyerName,
      taxId: customer.taxId,
      invoiceAddress: customer.invoiceAddress || customer.address,
      idNumber: customer.idNumber,
      passport: customer.passport,
      bankName: customer.bankName,
      bankAccount: customer.bankAccount,
      preferredStyle: customer.preferredStyle,
      projectLocation: customer.projectLocation,
    });
    setDrawerOpen(true);
  };

  // Save Customer (Create / Update)
  const handleSaveCustomer = async () => {
    try {
      const values = await form.validateFields();
      const trimmedCode = (values.code || '').trim().toUpperCase();
      const trimmedName = (values.name || '').trim();

      if (editingCustomer) {
        setCustomersList((prev) =>
          prev.map((c) =>
            c.id === editingCustomer.id
              ? {
                  ...c,
                  ...values,
                  code: trimmedCode || c.code,
                  name: trimmedName,
                  birthday: values.birthday ? values.birthday.format('YYYY-MM-DD') : undefined,
                }
              : c
          )
        );
        message.success(`Đã cập nhật thông tin khách hàng ${trimmedName}!`);
      } else {
        const newCustomer: AdminCustomer = {
          id: `cust_${Date.now()}`,
          ...values,
          code: trimmedCode || `KH-${(customersList.length + 1).toString().padStart(3, '0')}`,
          name: trimmedName,
          type: 'retail',
          birthday: values.birthday ? values.birthday.format('YYYY-MM-DD') : undefined,
          totalSpent: 0,
          debt: 0,
          rewardPoints: 0,
          totalOrders: 0,
          createdAt: dayjs().format('YYYY-MM-DD'),
        };
        setCustomersList((prev) => [newCustomer, ...prev]);
        message.success(`Đã thêm khách hàng mới ${trimmedName}!`);
      }
      setDrawerOpen(false);
    } catch (err) {
      message.error('Vui lòng kiểm tra lại các trường thông tin bắt buộc.');
    }
  };

  // Delete Customer
  const handleDeleteCustomer = (id: string) => {
    const target = customersList.find((c) => c.id === id);
    setCustomersList((prev) => prev.filter((c) => c.id !== id));
    setSelectedRowKeys((prev) => prev.filter((k) => k !== id));
    if (expandedCustomerId === id) setExpandedCustomerId(null);
    message.success(`Đã xóa khách hàng ${target?.name || ''}!`);
  };

  // Batch Delete
  const handleBatchDelete = () => {
    modal.confirm({
      title: 'Xác nhận xóa hàng loạt',
      content: `Bạn có chắc chắn muốn xóa ${selectedRowKeys.length} khách hàng đã chọn? Thao tác này không thể khôi phục.`,
      okText: 'Xóa đã chọn',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      onOk: () => {
        setCustomersList((prev) => prev.filter((c) => !selectedRowKeys.includes(c.id)));
        message.success(`Đã xóa thành công ${selectedRowKeys.length} khách hàng!`);
        setSelectedRowKeys([]);
      },
    });
  };

  // Batch Toggle Status
  const handleBatchToggleStatus = (targetStatus: 'active' | 'inactive') => {
    setCustomersList((prev) =>
      prev.map((c) =>
        selectedRowKeys.includes(c.id) ? { ...c, status: targetStatus } : c
      )
    );
    message.success(
      `Đã chuyển trạng thái ${selectedRowKeys.length} khách hàng sang ${
        targetStatus === 'active' ? 'Đang hoạt động' : 'Ngừng hoạt động'
      }!`
    );
    setSelectedRowKeys([]);
  };

  // Export to CSV / Excel
  const handleExportExcel = () => {
    const headers = [
      'Mã KH',
      'Họ và tên',
      'Số điện thoại',
      'Email',
      'Địa chỉ / Công trình',
      'Tổng chi tiêu (VNĐ)',
      'Công nợ (VNĐ)',
      'Trạng thái',
    ];
    const dataRows = filteredCustomers.map((c) => [
      `"${c.code}"`,
      `"${c.name}"`,
      `"${c.phone}"`,
      `"${c.email || ''}"`,
      `"${(c.address || '').replace(/"/g, '""')}"`,
      c.totalSpent,
      c.debt,
      `"${c.status === 'inactive' ? 'Ngừng hoạt động' : 'Đang hoạt động'}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...dataRows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `moc_gia_danh_sach_khach_hang_${dayjs().format('YYYYMMDD_HHmm')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success(`Đã xuất thành công danh sách ${filteredCustomers.length} khách hàng ra file Excel (CSV)!`);
  };

  // Quick Debt Collection Submission
  const handleConfirmCollectDebt = () => {
    if (!collectDebtCustomer) return;
    if (collectAmount <= 0) {
      message.error('Số tiền thu nợ phải lớn hơn 0 đ!');
      return;
    }
    const oldDebt = Number(collectDebtCustomer.debt || 0);
    const newDebt = Math.max(0, oldDebt - collectAmount);

    setCustomersList((prev) =>
      prev.map((c) => (c.id === collectDebtCustomer.id ? { ...c, debt: newDebt } : c))
    );
    message.success(
      `Đã thu thành công ${collectAmount.toLocaleString('vi-VN')} đ cho khách hàng ${
        collectDebtCustomer.name
      }. Nợ còn lại: ${newDebt.toLocaleString('vi-VN')} đ.`
    );
    setCollectDebtCustomer(null);
  };

  // Lookup Tax Code Mock (Domaco POS Spec)
  const handleLookupTax = () => {
    const tax = form.getFieldValue('taxId');
    if (!tax) {
      message.warning('Vui lòng nhập Mã số thuế để tra cứu!');
      return;
    }
    message.loading({ content: `Đang tra cứu MST ${tax}...`, key: 'taxLookup' });
    setTimeout(() => {
      form.setFieldsValue({
        companyName: `Công ty TNHH Thiết Kế & Đầu Tư BĐS (${tax})`,
        invoiceAddress: 'Tòa nhà Landmark 81, 720A Điện Biên Phủ, Phường 22, Quận Bình Thạnh, TP.HCM',
      });
      message.success({ content: 'Đã tìm thấy thông tin doanh nghiệp từ Tổng cục Thuế!', key: 'taxLookup' });
    }, 600);
  };

  return (
    <div className="space-y-4 flex-1 flex flex-col h-full">
      {/* ── TOP ACTION TOOLBAR ────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-none shadow-xs border border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
        {/* Search Box */}
        <div className="flex flex-1 items-center gap-2.5 min-w-[280px] max-w-xl">
          <AdminSearchInput
            placeholder="Tìm kiếm theo mã KH, họ tên, số điện thoại, email, địa chỉ, MST..."
            value={customerSearchQuery}
            onChange={(val) => setCustomerSearchQuery(val)}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              setCustomerSearchQuery('');
              setDebtFilter('all');
              setStatusFilter('all');
              message.success('Đã làm mới danh sách khách hàng!');
            }}
            className="h-10 rounded-none text-sm font-normal text-slate-700 hover:text-[#784e34]"
          >
            Làm mới
          </Button>

          <Button
            icon={<UploadOutlined />}
            onClick={() => setImportModalOpen(true)}
            className="h-10 rounded-none text-sm font-normal text-slate-700 hover:text-[#784e34]"
          >
            Nhập Excel
          </Button>

          <Button
            icon={<DownloadOutlined />}
            onClick={handleExportExcel}
            className="h-10 rounded-none text-sm font-normal text-slate-700 hover:text-[#784e34]"
          >
            Xuất Excel
          </Button>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenCreate}
            className="h-10 rounded-none bg-[#784e34] hover:!bg-[#5d371f] px-4 text-sm font-medium text-white shadow-none border-none flex items-center"
          >
            Thêm mới khách hàng
          </Button>
        </div>
      </div>

      {/* ── BATCH SELECTION BANNER ───────────────────────────────────── */}
      {selectedRowKeys.length > 0 && (
        <div className="bg-[#fbf2ee] border border-[#d8c3af] px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#5d371f]">
            <span className="font-bold text-sm">Đã chọn {selectedRowKeys.length} khách hàng</span>
            <span className="text-slate-500">|</span>
            <Button
              type="link"
              size="small"
              onClick={() => setSelectedRowKeys([])}
              className="text-[#784e34] p-0 font-medium hover:underline"
            >
              Bỏ chọn tất cả
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="small"
              onClick={() => handleBatchToggleStatus('active')}
              className="rounded-none text-xs bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50"
            >
              Kích hoạt ({selectedRowKeys.length})
            </Button>
            <Button
              size="small"
              onClick={() => handleBatchToggleStatus('inactive')}
              className="rounded-none text-xs bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
            >
              Khóa / Ngừng ({selectedRowKeys.length})
            </Button>
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={handleBatchDelete}
              className="rounded-none text-xs"
            >
              Xóa đã chọn ({selectedRowKeys.length})
            </Button>
          </div>
        </div>
      )}

      {/* ── 2-COLUMN LAYOUT: FILTER SIDEBAR + DATA TABLE ─────────────── */}
      <div className="flex flex-col lg:flex-row gap-4 items-start flex-1">
        {/* LEFT FILTER SIDEBAR */}
        <AdminFilterSidebar
          title="Bộ lọc khách hàng"
          hasActiveFilters={Boolean(
            customerSearchQuery ||
              debtFilter !== 'all' ||
              statusFilter !== 'all'
          )}
          onResetFilters={() => {
            setCustomerSearchQuery('');
            setDebtFilter('all');
            setStatusFilter('all');
          }}
        >
          {/* Tình trạng công nợ */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-600 text-xs uppercase tracking-wider block">Tình trạng công nợ</label>
            <Select
              value={debtFilter}
              onChange={(v) => setDebtFilter(v)}
              className="w-full text-sm"
              options={[
                { value: 'all', label: 'Tất cả công nợ' },
                { value: 'has_debt', label: '⚠️ Đang có công nợ (> 0đ)' },
                { value: 'no_debt', label: '✅ Không có công nợ (0đ)' },
              ]}
            />
          </div>

          {/* Trạng thái hoạt động */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="font-semibold text-slate-600 text-xs uppercase tracking-wider block">Trạng thái tài khoản</label>
            <Select
              value={statusFilter}
              onChange={(v) => setStatusFilter(v)}
              className="w-full text-sm"
              options={[
                { value: 'all', label: 'Tất cả trạng thái' },
                { value: 'active', label: '🟢 Đang hoạt động' },
                { value: 'inactive', label: '⚪ Ngừng hoạt động' },
              ]}
            />
          </div>

          {/* Quick Metrics Summary */}
          <AdminSidebarSummary
            title="Thống kê khách hàng"
            items={[
              { label: 'Tổng số khách hàng', value: `${customersList.length} khách` },
              {
                label: 'Tổng doanh số tích lũy',
                value: `${(customersList.reduce((acc, c) => acc + (c.totalSpent || 0), 0) / 1000000).toLocaleString('vi-VN')} Tr`,
                color: 'success',
              },
              {
                label: 'Tổng công nợ chưa thu',
                value: `${(customersList.reduce((acc, c) => acc + (c.debt || 0), 0) / 1000000).toLocaleString('vi-VN')} Tr`,
                color: 'danger',
              },
            ]}
          />
        </AdminFilterSidebar>

        {/* RIGHT MAIN DATA TABLE */}
        <div className="flex-1 w-full">
          <AdminDataTable
            titleText="Danh Sách Khách Hàng & Đối Tác Mộc Gia Atelier"
            titleIcon={<span className="w-2.5 h-2.5 rounded-full bg-[#784e34] inline-block" />}
            countTag={`${filteredCustomers.length} khách hàng`}
            dataSource={filteredCustomers}
            rowKey="id"
            rowSelection={{
              selectedRowKeys,
              onChange: (keys) => setSelectedRowKeys(keys),
            }}
            onRow={(record) => ({
              onClick: () => {
                setExpandedCustomerId((prev) => (prev === record.id ? null : record.id));
              },
              className: 'cursor-pointer hover:bg-[#fbf2ee]/40 transition-colors',
            })}
            expandable={{
              expandedRowKeys: expandedCustomerId ? [expandedCustomerId] : [],
              onExpand: (expanded, record) => {
                setExpandedCustomerId(expanded ? record.id : null);
              },
              expandedRowRender: (customer: AdminCustomer) => (
                <CustomerExpandedDetailRow
                  customer={customer}
                  onEdit={() => handleOpenEdit(customer)}
                  onDelete={() => handleDeleteCustomer(customer.id)}
                  onCollectDebt={() => {
                    setCollectDebtCustomer(customer);
                    setCollectAmount(Number(customer.debt || 0));
                    setCollectNote(`Thu nợ đơn may đo KH ${customer.code}`);
                  }}
                />
              ),
              showExpandColumn: false,
            }}
            columns={[
              {
                title: 'Mã KH',
                dataIndex: 'code',
                key: 'code',
                width: 110,
                render: (text, record: AdminCustomer) => (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedCustomerId((prev) => (prev === record.id ? null : record.id));
                    }}
                    className="font-mono text-xs font-semibold text-[#784e34] hover:underline bg-[#784e34]/10 px-2 py-0.5 whitespace-nowrap inline-block text-left border-none cursor-pointer"
                  >
                    {text}
                  </button>
                ),
              },
              {
                title: 'Khách hàng',
                key: 'name',
                width: 250,
                render: (_, r: AdminCustomer) => (
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#fbf2ee] border border-[#d8c3af] flex items-center justify-center font-bold text-xs text-[#5d371f] shrink-0">
                      {r.name ? r.name.charAt(0).toUpperCase() : 'K'}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 text-sm truncate">
                        {r.name}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        {r.phone} {r.customerType === 'organization' ? '• Doanh nghiệp' : ''}
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                title: 'Địa chỉ / Công trình',
                dataIndex: 'address',
                key: 'address',
                render: (addr: string, r: AdminCustomer) => (
                  <div className="max-w-xs">
                    <div className="text-sm text-slate-700 truncate" title={addr}>
                      {addr || '—'}
                    </div>
                    {r.preferredStyle && (
                      <div className="text-xs text-slate-400 truncate">
                        🎨 {r.preferredStyle}
                      </div>
                    )}
                  </div>
                ),
              },
              {
                title: 'Tổng chi tiêu',
                dataIndex: 'totalSpent',
                key: 'totalSpent',
                align: 'right',
                width: 140,
                render: (val: number) => (
                  <span className="font-mono font-semibold text-sm text-[#5d371f]">
                    {val > 0 ? `${Number(val).toLocaleString('vi-VN')} đ` : '0 đ'}
                  </span>
                ),
              },
              {
                title: 'Công nợ',
                dataIndex: 'debt',
                key: 'debt',
                align: 'right',
                width: 140,
                render: (debt: number, r: AdminCustomer) => {
                  const hasDebt = Number(debt || 0) > 0;
                  return (
                    <div className="flex items-center justify-end gap-1">
                      <span
                        className={`font-mono font-semibold text-sm ${
                          hasDebt ? 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded' : 'text-slate-400'
                        }`}
                      >
                        {hasDebt ? `${Number(debt).toLocaleString('vi-VN')} đ` : '0 đ'}
                      </span>
                      {hasDebt && (
                        <Tooltip title="Thu tiền nợ ngay">
                          <Button
                            type="text"
                            size="small"
                            icon={<WalletOutlined className="text-rose-600 text-xs" />}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCollectDebtCustomer(r);
                              setCollectAmount(Number(r.debt || 0));
                              setCollectNote(`Thu nợ đơn may đo KH ${r.code}`);
                            }}
                            className="w-6 h-6 flex items-center justify-center p-0 hover:bg-rose-100"
                          />
                        </Tooltip>
                      )}
                    </div>
                  );
                },
              },
              {
                title: 'Trạng thái',
                dataIndex: 'status',
                key: 'status',
                align: 'center',
                width: 130,
                render: (status: string) => {
                  const isActive = (status || 'active') === 'active';
                  return isActive ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Đang hoạt động
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                      Ngừng hoạt động
                    </span>
                  );
                },
              },
              {
                title: 'Thao tác',
                key: 'actions',
                align: 'right',
                width: 90,
                render: (_, r: AdminCustomer) => (
                  <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="Chỉnh sửa">
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined className="text-slate-600 hover:text-[#784e34] text-sm" />}
                        onClick={() => handleOpenEdit(r)}
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100"
                      />
                    </Tooltip>
                    <Popconfirm
                      title="Xác nhận xóa khách hàng"
                      description={`Bạn có chắc chắn muốn xóa khách hàng ${r.name}?`}
                      onConfirm={() => handleDeleteCustomer(r.id)}
                      okText="Xóa"
                      cancelText="Hủy"
                      okButtonProps={{ danger: true }}
                    >
                      <Tooltip title="Xóa">
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<DeleteOutlined className="text-sm" />}
                          className="w-7 h-7 flex items-center justify-center rounded hover:bg-rose-50 text-rose-600"
                        />
                      </Tooltip>
                    </Popconfirm>
                  </div>
                ),
              },
            ]}
          />
        </div>
      </div>

      {/* ── DRAWER: THÊM MỚI / CHỈNH SỬA KHÁCH HÀNG (DOMACO POS SPEC) ─── */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-xl text-[#784e34]">person</span>
            <span className="font-bold text-base text-slate-900">
              {editingCustomer ? `Chỉnh sửa khách hàng ${editingCustomer.code}` : 'Thêm mới khách hàng & đối tác'}
            </span>
          </div>
        }
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        styles={{ wrapper: { width: 720, maxWidth: '100vw' } }}
        destroyOnHidden
        className="[&_.ant-drawer-header]:px-6 [&_.ant-drawer-header]:py-4 [&_.ant-drawer-header]:border-b [&_.ant-drawer-header]:border-slate-200 [&_.ant-drawer-body]:px-6 [&_.ant-drawer-body]:py-5 [&_.ant-drawer-footer]:px-6 [&_.ant-drawer-footer]:py-3 [&_.ant-drawer-footer]:border-t [&_.ant-drawer-footer]:border-slate-200"
        footer={
          <div className="flex items-center justify-between">
            <Button onClick={() => setDrawerOpen(false)} className="rounded-none">
              Hủy bỏ
            </Button>
            <Button
              type="primary"
              onClick={handleSaveCustomer}
              className="bg-[#784e34] hover:!bg-[#5d371f] text-white rounded-none px-6 font-medium shadow-none border-none"
            >
              {editingCustomer ? 'Lưu thay đổi' : 'Tạo khách hàng'}
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical" className="space-y-6">
          {/* SECTION 1: THÔNG TIN CƠ BẢN */}
          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 mb-4">
              <span className="font-bold text-sm text-slate-900">1. Thông tin liên hệ cơ bản</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Form.Item
                name="name"
                label={<span className="text-xs font-semibold text-slate-700">Họ và tên khách hàng</span>}
                rules={[{ required: true, message: 'Vui lòng nhập họ tên khách hàng' }]}
              >
                <Input placeholder="VD: Anh Trần Đăng Khoa hoặc Chị Hoàng Yến Vy" className="h-9 text-xs" />
              </Form.Item>

              <Form.Item
                name="code"
                label={<span className="text-xs font-semibold text-slate-700">Mã khách hàng</span>}
                rules={[{ required: true, message: 'Vui lòng nhập mã KH' }]}
              >
                <Input placeholder="Tự động (VD: KH-007)" className="h-9 text-xs font-mono" />
              </Form.Item>

              <Form.Item
                name="phone"
                label={<span className="text-xs font-semibold text-slate-700">Số điện thoại chính</span>}
                rules={[{ required: true, message: 'Vui lòng nhập số điện thoại chính' }]}
              >
                <Input placeholder="VD: 0918.421.888" className="h-9 text-xs font-mono" />
              </Form.Item>

              <Form.Item
                name="phone2"
                label={<span className="text-xs font-semibold text-slate-700">Số điện thoại 2 / Zalo</span>}
              >
                <Input placeholder="VD: 0908.112.334" className="h-9 text-xs font-mono" />
              </Form.Item>

              <Form.Item
                name="email"
                label={<span className="text-xs font-semibold text-slate-700">Email</span>}
              >
                <Input placeholder="VD: customer@gmail.com" className="h-9 text-xs" />
              </Form.Item>

              <Form.Item
                name="facebook"
                label={<span className="text-xs font-semibold text-slate-700">Facebook / Profile</span>}
              >
                <Input placeholder="VD: facebook.com/username" className="h-9 text-xs" />
              </Form.Item>

              <Form.Item
                name="birthday"
                label={<span className="text-xs font-semibold text-slate-700">Ngày sinh</span>}
              >
                <DatePicker format="DD/MM/YYYY" placeholder="Chọn ngày sinh" className="w-full h-9 text-xs" />
              </Form.Item>

              <Form.Item
                name="gender"
                label={<span className="text-xs font-semibold text-slate-700">Giới tính</span>}
              >
                <Select
                  placeholder="Chọn giới tính"
                  options={[
                    { label: 'Nam', value: 'male' },
                    { label: 'Nữ', value: 'female' },
                    { label: 'Khác', value: 'other' },
                  ]}
                  className="w-full text-xs"
                />
              </Form.Item>

              <Form.Item
                name="status"
                label={<span className="text-xs font-semibold text-slate-700">Trạng thái hoạt động</span>}
                className="sm:col-span-2"
              >
                <Select
                  options={[
                    { value: 'active', label: '🟢 Đang hoạt động' },
                    { value: 'inactive', label: '⚪ Ngừng hoạt động' },
                  ]}
                  className="w-full text-xs"
                />
              </Form.Item>
            </div>
          </div>

          {/* SECTION 2: ĐỊA CHỈ & CÔNG TRÌNH */}
          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 mb-4">
              <span className="font-bold text-sm text-slate-900">2. Địa chỉ giao nhận & Công trình</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Form.Item
                name="address"
                label={<span className="text-xs font-semibold text-slate-700">Địa chỉ công trình / Biệt thự</span>}
                rules={[{ required: true, message: 'Vui lòng nhập địa chỉ giao hàng / công trình' }]}
                className="sm:col-span-2"
              >
                <Input placeholder="VD: Biệt thự Thảo Điền, Số 12 Đường 49, TP. Thủ Đức, TP.HCM" className="h-9 text-xs" />
              </Form.Item>

              <Form.Item
                name="projectLocation"
                label={<span className="text-xs font-semibold text-slate-700">Khu vực / Tên dự án BĐS</span>}
              >
                <Input placeholder="VD: Serenity Sky Villas, Vinhomes Central Park..." className="h-9 text-xs" />
              </Form.Item>

              <Form.Item
                name="preferredStyle"
                label={<span className="text-xs font-semibold text-slate-700">Gu thẩm mỹ / Phong cách ưa thích</span>}
              >
                <Input placeholder="VD: Japandi Gỗ Óc Chó, Indochine, Hiện đại Luxury..." className="h-9 text-xs" />
              </Form.Item>
            </div>
          </div>

          {/* SECTION 3: THÔNG TIN XUẤT HÓA ĐƠN & DOANH NGHIỆP (DOMACO POS SPEC) */}
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-4">
              <span className="font-bold text-sm text-slate-900">3. Thông tin xuất hóa đơn VAT & Doanh nghiệp</span>
            </div>

            <div className="mb-4">
              <Form.Item name="customerType" noStyle>
                <Radio.Group
                  value={customerTypeChoice}
                  onChange={(e) => {
                    setCustomerTypeChoice(e.target.value);
                    form.setFieldValue('customerType', e.target.value);
                  }}
                  className="text-xs"
                >
                  <Radio value="individual">Khách hàng Cá nhân</Radio>
                  <Radio value="organization">Tổ chức / Doanh nghiệp / Hộ KD</Radio>
                </Radio.Group>
              </Form.Item>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Form.Item
                name="taxId"
                label={<span className="text-xs font-semibold text-slate-700">Mã số thuế (MST)</span>}
              >
                <Input
                  placeholder="Nhập mã số thuế"
                  className="h-9 text-xs font-mono"
                  suffix={
                    <button
                      type="button"
                      onClick={handleLookupTax}
                      className="rounded bg-[#784e34] px-2 py-0.5 text-[11px] font-bold text-white border-none cursor-pointer hover:bg-[#5d371f]"
                    >
                      Tra cứu MST
                    </button>
                  }
                />
              </Form.Item>

              <Form.Item
                name="companyName"
                label={<span className="text-xs font-semibold text-slate-700">Tên công ty / Doanh nghiệp</span>}
              >
                <Input placeholder="VD: Công ty TNHH Kiến Trúc..." className="h-9 text-xs" />
              </Form.Item>

              <Form.Item
                name="buyerName"
                label={<span className="text-xs font-semibold text-slate-700">Tên người mua hàng / Đại diện</span>}
              >
                <Input placeholder="Nhập tên người mua" className="h-9 text-xs" />
              </Form.Item>

              <Form.Item
                name="idNumber"
                label={<span className="text-xs font-semibold text-slate-700">Số CCCD / CMND / Hộ chiếu</span>}
              >
                <Input placeholder="Nhập số CCCD/CMND" className="h-9 text-xs font-mono" />
              </Form.Item>

              <Form.Item
                name="invoiceAddress"
                label={<span className="text-xs font-semibold text-slate-700">Địa chỉ xuất hóa đơn VAT</span>}
                className="sm:col-span-2"
              >
                <Input placeholder="Địa chỉ theo đăng ký kinh doanh hoặc CMND" className="h-9 text-xs" />
              </Form.Item>

              <Form.Item
                name="bankName"
                label={<span className="text-xs font-semibold text-slate-700">Ngân hàng</span>}
              >
                <Select
                  placeholder="Chọn ngân hàng"
                  allowClear
                  options={BANK_OPTIONS}
                  className="w-full text-xs"
                />
              </Form.Item>

              <Form.Item
                name="bankAccount"
                label={<span className="text-xs font-semibold text-slate-700">Số tài khoản ngân hàng</span>}
              >
                <Input placeholder="Nhập số tài khoản" className="h-9 text-xs font-mono" />
              </Form.Item>
            </div>
          </div>
        </Form>
      </Drawer>

      {/* ── DRAWER: THU NỢ & THANH TOÁN CÔNG NỢ (DOMACO POS SPEC) ────── */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-xl text-rose-600">account_balance_wallet</span>
            <span className="font-bold text-base text-slate-900">
              Phiếu thu tiền &amp; Thanh toán công nợ
            </span>
          </div>
        }
        open={Boolean(collectDebtCustomer)}
        onClose={() => setCollectDebtCustomer(null)}
        styles={{ wrapper: { width: 520, maxWidth: '100vw' } }}
        destroyOnHidden
        className="[&_.ant-drawer-header]:px-6 [&_.ant-drawer-header]:py-4 [&_.ant-drawer-header]:border-b [&_.ant-drawer-header]:border-slate-200 [&_.ant-drawer-body]:px-6 [&_.ant-drawer-body]:py-5 [&_.ant-drawer-footer]:px-6 [&_.ant-drawer-footer]:py-3 [&_.ant-drawer-footer]:border-t [&_.ant-drawer-footer]:border-slate-200"
        footer={
          <div className="flex items-center justify-between">
            <Button onClick={() => setCollectDebtCustomer(null)} className="rounded-none">
              Đóng
            </Button>
            <Button
              type="primary"
              onClick={handleConfirmCollectDebt}
              className="bg-rose-600 hover:!bg-rose-700 text-white rounded-none px-6 font-medium shadow-none border-none"
            >
              Xác nhận thu {collectAmount > 0 ? `${collectAmount.toLocaleString('vi-VN')} đ` : 'tiền'}
            </Button>
          </div>
        }
      >
        {collectDebtCustomer && (
          <div className="space-y-5 text-xs">
            {/* Customer Summary Card */}
            <div className="bg-[#fbf2ee] p-4 border border-[#d8c3af] rounded-none space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{collectDebtCustomer.name}</span>
                <span className="font-mono text-xs font-bold text-[#784e34] bg-[#784e34]/10 px-2 py-0.5">
                  #{collectDebtCustomer.code}
                </span>
              </div>
              <div className="text-slate-600 text-xs">
                SĐT: <strong className="font-mono text-slate-800">{collectDebtCustomer.phone}</strong> • Địa chỉ: <span className="text-slate-700">{collectDebtCustomer.address || '—'}</span>
              </div>
              <div className="pt-2 border-t border-[#d8c3af] flex items-center justify-between">
                <span className="text-slate-600 font-medium">Tổng công nợ còn lại:</span>
                <span className="font-bold text-rose-600 text-base font-mono">
                  {Number(collectDebtCustomer.debt || 0).toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>

            {/* Amount to Collect with Quick Percent Presets */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-semibold text-slate-800 block text-xs">
                  Số tiền thu hôm nay (VNĐ) <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCollectAmount(Number(collectDebtCustomer.debt || 0))}
                    className="text-[11px] px-2.5 py-1 bg-rose-50 text-rose-700 font-semibold border border-rose-200 hover:bg-rose-100 cursor-pointer rounded transition-colors"
                  >
                    100% Tất cả nợ
                  </button>
                  <button
                    type="button"
                    onClick={() => setCollectAmount(Math.round(Number(collectDebtCustomer.debt || 0) * 0.5))}
                    className="text-[11px] px-2.5 py-1 bg-slate-100 text-slate-700 font-semibold border border-slate-200 hover:bg-slate-200 cursor-pointer rounded transition-colors"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => setCollectAmount(Math.round(Number(collectDebtCustomer.debt || 0) * 0.3))}
                    className="text-[11px] px-2.5 py-1 bg-slate-100 text-slate-700 font-semibold border border-slate-200 hover:bg-slate-200 cursor-pointer rounded transition-colors"
                  >
                    30%
                  </button>
                </div>
              </div>
              <InputNumber
                style={{ width: '100%' }}
                value={collectAmount}
                onChange={(val) => setCollectAmount(val || 0)}
                formatter={(value) => (value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '')}
                parser={(value) => (value ? Number(value.replace(/\./g, '')) : 0)}
                controls={false}
                suffix={<span className="font-semibold text-xs text-slate-500 select-none">VNĐ</span>}
                className="w-full !w-full text-base font-mono font-bold rounded-none h-11 [&_.ant-input-number-input]:h-11 [&_.ant-input-number-input]:text-base [&_.ant-input-number-input]:font-mono [&_.ant-input-number-input]:font-bold [&_.ant-input-number-input]:px-3.5"
                size="large"
                min={0}
                max={Number(collectDebtCustomer.debt || 0)}
              />
              <div className="text-[11px] text-slate-500 mt-1.5 flex items-center justify-between">
                <span>
                  Công nợ sau khi thu:{' '}
                  <strong className="font-mono text-slate-800 font-bold">
                    {Math.max(0, Number(collectDebtCustomer.debt || 0) - collectAmount).toLocaleString('vi-VN')} đ
                  </strong>
                </span>
                {collectAmount >= Number(collectDebtCustomer.debt || 0) && (
                  <span className="text-emerald-600 font-semibold">✅ Thanh toán hết 100% nợ</span>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="font-semibold text-slate-800 block mb-1.5 text-xs">Hình thức thanh toán</label>
              <Radio.Group
                value={collectMethod}
                onChange={(e) => setCollectMethod(e.target.value)}
                className="w-full grid grid-cols-2 gap-2 text-xs"
              >
                <Radio.Button value="transfer" className="text-center h-9 leading-9 font-medium">
                  Chuyển khoản VietQR
                </Radio.Button>
                <Radio.Button value="cash" className="text-center h-9 leading-9 font-medium">
                  Tiền mặt tại Showroom
                </Radio.Button>
              </Radio.Group>
            </div>

            {/* Note */}
            <div>
              <label className="font-semibold text-slate-800 block mb-1.5 text-xs">Ghi chú phiếu thu</label>
              <Input.TextArea
                value={collectNote}
                onChange={(e) => setCollectNote(e.target.value)}
                rows={3}
                placeholder="VD: Khách chuyển khoản thanh toán đợt cuối đơn may đo bàn ăn Komorebi..."
                className="text-xs"
              />
            </div>
          </div>
        )}
      </Drawer>

      {/* ── MODAL: NHẬP DỮ LIỆU TỪ FILE EXCEL (DOMACO POS SPEC) ──────── */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-xl text-[#784e34]">upload_file</span>
            <span className="font-bold text-base text-slate-900">Nhập danh sách khách hàng từ Excel</span>
          </div>
        }
        open={importModalOpen}
        onCancel={() => setImportModalOpen(false)}
        onOk={() => {
          message.success('Đã nạp thành công 5 khách hàng mới từ file Excel mẫu!');
          setImportModalOpen(false);
        }}
        okText="Tiến hành nhập dữ liệu"
        cancelText="Đóng"
        okButtonProps={{ className: 'bg-[#784e34] hover:!bg-[#5d371f] text-white rounded-none' }}
        width={600}
      >
        <div className="space-y-4 py-2 text-xs">
          <div className="bg-slate-50 p-3 border border-slate-200 rounded-none space-y-1">
            <div className="font-bold text-slate-800">Hướng dẫn nhập file:</div>
            <p className="text-slate-600 m-0 leading-relaxed">
              1. Tải về file mẫu Excel chuẩn định dạng Mộc Gia Atelier để điền dữ liệu.
              <br />
              2. Các cột bắt buộc: <strong>Tên khách hàng, Số điện thoại chính, Địa chỉ</strong>.
              <br />
              3. Hệ thống sẽ tự động đối soát trùng lặp theo Số điện thoại và Mã khách hàng.
            </p>
            <div className="pt-2">
              <Button
                type="link"
                icon={<DownloadOutlined />}
                onClick={() => message.info('Đang tải file Excel mẫu: moc_gia_customer_template.xlsx')}
                className="p-0 text-[#784e34] font-semibold text-xs h-auto"
              >
                Tải file Excel mẫu (.xlsx)
              </Button>
            </div>
          </div>

          <Upload.Dragger
            name="file"
            multiple={false}
            accept=".xlsx,.xls,.csv"
            beforeUpload={() => {
              message.success('Đã đọc file Excel thành công (Tìm thấy 5 dòng dữ liệu hợp lệ)');
              return false;
            }}
            className="p-4 bg-white"
          >
            <p className="ant-upload-drag-icon text-3xl text-[#784e34] mb-2">
              <UploadOutlined />
            </p>
            <p className="font-bold text-slate-800 text-xs">Kéo thả file Excel (.xlsx, .csv) vào đây hoặc bấm để chọn</p>
            <p className="text-slate-400 text-[11px] m-0">Hỗ trợ tối đa 5,000 khách hàng mỗi lượt import</p>
          </Upload.Dragger>
        </div>
      </Modal>
    </div>
  );
}

// ── SUB-COMPONENT: CUSTOMER EXPANDED DETAIL ROW (MATCHING DOMACO POS) ───────────
interface CustomerExpandedDetailRowProps {
  customer: AdminCustomer;
  onEdit: () => void;
  onDelete: () => void;
  onCollectDebt: () => void;
}

function CustomerExpandedDetailRow({
  customer,
  onEdit,
  onDelete,
  onCollectDebt,
}: CustomerExpandedDetailRowProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'orders' | 'payments' | 'rewards'>('info');

  // Related Orders from INITIAL_ORDERS
  const relatedOrders = useMemo(() => {
    return INITIAL_ORDERS.filter(
      (o) =>
        (o.customerName && customer.name && o.customerName.toLowerCase().includes(customer.name.toLowerCase())) ||
        (o.customerPhone && customer.phone && o.customerPhone.includes(customer.phone))
    );
  }, [customer]);

  return (
    <div className="bg-[#fbf9f8] border-y border-slate-200 p-4 sm:p-5 -mx-4 space-y-4">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#fbf2ee] border border-[#d8c3af] flex items-center justify-center font-bold text-sm text-[#5d371f] shrink-0">
            {customer.name ? customer.name.charAt(0).toUpperCase() : 'K'}
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
              {customer.name}
              <span className="font-mono text-xs font-normal text-slate-500">#{customer.code}</span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              SĐT: <strong className="text-slate-800">{customer.phone}</strong> • Email:{' '}
              <span className="text-slate-800">{customer.email || '—'}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {Number(customer.debt || 0) > 0 && (
            <Button
              type="primary"
              size="small"
              icon={<WalletOutlined />}
              onClick={onCollectDebt}
              className="bg-rose-600 hover:!bg-rose-700 text-white rounded-none text-xs font-semibold h-7 border-none shadow-none"
            >
              Thu tiền nợ ({Number(customer.debt).toLocaleString('vi-VN')} đ)
            </Button>
          )}
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={onEdit}
            className="rounded-none text-xs h-7"
          >
            Chỉnh sửa
          </Button>
          <Popconfirm
            title="Xóa khách hàng"
            description={`Bạn có chắc chắn muốn xóa khách hàng ${customer.name}?`}
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
                  <ShoppingCartOutlined /> Lịch sử đơn may đo ({relatedOrders.length})
                </span>
              ),
              value: 'orders',
            },
            {
              label: (
                <span className="flex items-center gap-1.5 px-1 py-0.5 text-xs font-semibold">
                  <DollarOutlined /> Lịch sử thanh toán & Thu nợ
                </span>
              ),
              value: 'payments',
            },
            {
              label: (
                <span className="flex items-center gap-1.5 px-1 py-0.5 text-xs font-semibold">
                  <GiftOutlined /> Điểm tích lũy & Ưu đãi ({customer.rewardPoints || 0} pts)
                </span>
              ),
              value: 'rewards',
            },
          ]}
          className="bg-slate-200/70 p-1 rounded-none"
        />
      </div>

      {/* TAB 1: THÔNG TIN CHI TIẾT (DOMACO POS SPEC) */}
      {activeTab === 'info' && (
        <div className="space-y-4">
          <div className="bg-white p-4 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Điện thoại chính</span>
              <span className="font-semibold text-slate-800 font-mono">{customer.phone}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Điện thoại 2 / Zalo</span>
              <span className="font-semibold text-slate-800 font-mono">{customer.phone2 || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Email</span>
              <span className="font-semibold text-slate-800">{customer.email || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Ngày sinh</span>
              <span className="font-semibold text-slate-800">
                {customer.birthday ? dayjs(customer.birthday).format('DD/MM/YYYY') : '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Loại khách hàng</span>
              <span className="font-semibold text-slate-800">
                {customer.customerType === 'organization' ? 'Doanh nghiệp / Tổ chức' : 'Cá nhân'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Mã số thuế (MST)</span>
              <span className="font-semibold text-slate-800 font-mono">{customer.taxId || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Tên công ty</span>
              <span className="font-semibold text-slate-800">{customer.companyName || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Người đại diện / Mua</span>
              <span className="font-semibold text-slate-800">{customer.buyerName || customer.name}</span>
            </div>

            <div className="sm:col-span-2">
              <span className="text-slate-400 block mb-0.5">Địa chỉ công trình</span>
              <span className="font-semibold text-slate-800">{customer.address || '—'}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-400 block mb-0.5">Địa chỉ xuất hóa đơn</span>
              <span className="font-semibold text-slate-800">{customer.invoiceAddress || customer.address || '—'}</span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Ngân hàng</span>
              <span className="font-semibold text-slate-800">{customer.bankName || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Số tài khoản</span>
              <span className="font-semibold text-slate-800 font-mono">{customer.bankAccount || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Số CCCD / CMND</span>
              <span className="font-semibold text-slate-800 font-mono">{customer.idNumber || customer.passport || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Phong cách ưa thích</span>
              <span className="font-semibold text-[#784e34]">{customer.preferredStyle || '—'}</span>
            </div>

            <div className="sm:col-span-4 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs">
              <div>
                <span className="text-slate-500">Tổng chi tiêu tích lũy:</span>{' '}
                <strong className="text-emerald-700 font-mono font-bold">
                  {Number(customer.totalSpent || 0).toLocaleString('vi-VN')} đ
                </strong>
              </div>
              <div>
                <span className="text-slate-500">Công nợ hiện tại:</span>{' '}
                <strong className="text-rose-600 font-mono font-bold">
                  {Number(customer.debt || 0).toLocaleString('vi-VN')} đ
                </strong>
              </div>
              <div>
                <span className="text-slate-500">Điểm thưởng thành viên:</span>{' '}
                <strong className="text-purple-700 font-mono font-bold">
                  {Number(customer.rewardPoints || 0).toLocaleString('vi-VN')} điểm
                </strong>
              </div>
              <div>
                <span className="text-slate-500">Ngày tạo hồ sơ:</span>{' '}
                <strong className="text-slate-800">{customer.createdAt || '10/01/2025'}</strong>
              </div>
            </div>
          </div>

          {/* Công nợ chưa thu (Domaco POS Accordion feature) */}
          {Number(customer.debt || 0) > 0 && (
            <div className="bg-white p-4 border border-rose-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-rose-700 text-xs flex items-center gap-1.5">
                  <WalletOutlined /> Danh sách chứng từ / Đơn may đo còn nợ
                </span>
                <Button
                  size="small"
                  type="primary"
                  onClick={onCollectDebt}
                  className="bg-rose-600 hover:!bg-rose-700 text-white rounded-none text-xs font-semibold h-7 border-none"
                >
                  Thu tiền ngay
                </Button>
              </div>

              <div className="overflow-x-auto border border-slate-200">
                <table className="min-w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Mã chứng từ</th>
                      <th className="px-3 py-2 font-semibold">Nội dung sản phẩm may đo</th>
                      <th className="px-3 py-2 font-semibold text-right">Tổng giá trị</th>
                      <th className="px-3 py-2 font-semibold text-right">Đã thanh toán</th>
                      <th className="px-3 py-2 font-semibold text-right text-rose-600">Còn nợ</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-slate-100 hover:bg-slate-50/60">
                      <td className="px-3 py-2 font-mono font-bold text-[#784e34]">#DH-2026-8890</td>
                      <td className="px-3 py-2 text-slate-700">Hệ Sofa Kyoto Chữ L + Kệ Tivi Zen Minimal</td>
                      <td className="px-3 py-2 text-right font-mono">145,000,000 đ</td>
                      <td className="px-3 py-2 text-right font-mono text-emerald-600">72,500,000 đ (50%)</td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-rose-600">
                        {Number(customer.debt).toLocaleString('vi-VN')} đ
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LỊCH SỬ ĐƠN MAY ĐO & HÓA ĐƠN */}
      {activeTab === 'orders' && (
        <div className="bg-white p-4 border border-slate-200 space-y-3">
          {relatedOrders.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">
              <ShoppingCartOutlined className="text-2xl mb-1 block" />
              Chưa có lịch sử đơn hàng nào cho khách hàng này.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200">
              <table className="min-w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Mã đơn may đo</th>
                    <th className="px-3 py-2 font-semibold">Ngày đặt</th>
                    <th className="px-3 py-2 font-semibold">Sản phẩm & Quy cách vật liệu</th>
                    <th className="px-3 py-2 font-semibold text-right">Tổng giá trị</th>
                    <th className="px-3 py-2 font-semibold text-right">Đã thanh toán</th>
                    <th className="px-3 py-2 font-semibold text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {relatedOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/60">
                      <td className="px-3 py-2 font-mono font-bold text-[#784e34]">{ord.orderCode}</td>
                      <td className="px-3 py-2 text-slate-600">{ord.orderDate}</td>
                      <td className="px-3 py-2">
                        <div className="font-medium text-slate-900">{ord.productName}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">{ord.productSpec}</div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-semibold">
                        {ord.value.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-emerald-600 font-semibold">
                        {ord.depositAmount.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Tag color="blue" className="text-[10px] m-0">
                          {ord.statusLabel}
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

      {/* TAB 3: LỊCH SỬ THANH TOÁN & THU NỢ */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          {/* CÔNG NỢ ALERT BANNER (IF CUSTOMER HAS DEBT) */}
          {Number(customer.debt || 0) > 0 ? (
            <div className="bg-rose-50 border border-rose-200 p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                  <WalletOutlined className="text-lg" />
                </div>
                <div>
                  <div className="font-bold text-rose-900 text-xs flex items-center gap-2">
                    <span>Công nợ chưa thanh toán:</span>
                    <span className="font-mono text-sm text-rose-600 font-bold bg-white px-2 py-0.5 border border-rose-300">
                      {Number(customer.debt).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                  <div className="text-[11px] text-rose-700 mt-0.5">
                    Đơn may đo #DH-2026-8890 (Hệ Sofa Kyoto Chữ L) còn nợ đợt 2. Bấm nút bên cạnh để mở phiếu thu tiền.
                  </div>
                </div>
              </div>

              <Button
                type="primary"
                icon={<WalletOutlined />}
                onClick={onCollectDebt}
                className="bg-rose-600 hover:!bg-rose-700 text-white rounded-none text-xs font-semibold h-8 border-none shadow-none flex items-center gap-1.5"
              >
                Thanh toán / Thu nợ ngay
              </Button>
            </div>
          ) : null}

          {/* CÔNG NỢ CHỨNG TỪ CHI TIẾT (NẾU CÓ) */}
          {Number(customer.debt || 0) > 0 && (
            <div className="bg-white p-4 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-800 text-xs flex items-center justify-between">
                <span>Chứng từ &amp; Đơn may đo đang nợ</span>
                <span className="text-slate-500 font-normal">1 đơn hàng chưa hoàn tất thanh toán</span>
              </div>
              <div className="overflow-x-auto border border-slate-200">
                <table className="min-w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Mã chứng từ</th>
                      <th className="px-3 py-2 font-semibold">Nội dung sản phẩm</th>
                      <th className="px-3 py-2 font-semibold text-right">Tổng giá trị</th>
                      <th className="px-3 py-2 font-semibold text-right">Đã thanh toán</th>
                      <th className="px-3 py-2 font-semibold text-right text-rose-600">Còn nợ</th>
                      <th className="px-3 py-2 font-semibold text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-slate-100 hover:bg-slate-50/60">
                      <td className="px-3 py-2 font-mono font-bold text-[#784e34]">#DH-2026-8890</td>
                      <td className="px-3 py-2 text-slate-700">Hệ Sofa Kyoto Chữ L + Kệ Tivi Zen Minimal</td>
                      <td className="px-3 py-2 text-right font-mono">145,000,000 đ</td>
                      <td className="px-3 py-2 text-right font-mono text-emerald-600">72,500,000 đ (50%)</td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-rose-600">
                        {Number(customer.debt).toLocaleString('vi-VN')} đ
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Button
                          size="small"
                          type="link"
                          onClick={onCollectDebt}
                          className="p-0 text-rose-600 font-bold hover:underline text-xs"
                        >
                          Thu tiền
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* LỊCH SỬ CÁC PHIẾU THU ĐÃ GHI SỔ */}
          <div className="bg-white p-4 border border-slate-200 space-y-2">
            <div className="overflow-x-auto border border-slate-200">
              <table className="min-w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Mã chứng từ / Phiếu thu</th>
                    <th className="px-3 py-2 font-semibold">Ngày thu</th>
                    <th className="px-3 py-2 font-semibold">Phương thức</th>
                    <th className="px-3 py-2 font-semibold text-right">Số tiền thu</th>
                    <th className="px-3 py-2 font-semibold text-center">Trạng thái</th>
                    <th className="px-3 py-2 font-semibold">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/60">
                    <td className="px-3 py-2 font-mono font-bold text-[#784e34]">PT-2026-0912</td>
                    <td className="px-3 py-2 text-slate-600">14/11/2026</td>
                    <td className="px-3 py-2 text-slate-700">Chuyển khoản VietQR (MBBank)</td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">
                      72,500,000 đ
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Đã ghi sổ
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-500">Tạm ứng 50% đơn may đo Sofa Kyoto</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ĐIỂM TÍCH LŨY & LOYALTY */}
      {activeTab === 'rewards' && (
        <div className="bg-white p-4 border border-slate-200 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#fbf2ee] p-3 border border-[#d8c3af]">
              <div className="text-slate-500 text-[11px]">Số dư điểm hiện tại</div>
              <div className="text-xl font-bold text-[#5d371f] font-mono mt-1">
                {Number(customer.rewardPoints || 0).toLocaleString('vi-VN')} điểm
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Tương đương {(Number(customer.rewardPoints || 0) * 1000).toLocaleString('vi-VN')} đ</div>
            </div>
            <div className="bg-emerald-50 p-3 border border-emerald-200">
              <div className="text-slate-500 text-[11px]">Tổng điểm đã nhận</div>
              <div className="text-xl font-bold text-emerald-700 font-mono mt-1">
                {Number(customer.rewardPoints || 0).toLocaleString('vi-VN')} điểm
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Tích lũy từ đơn may đo</div>
            </div>
            <div className="bg-slate-50 p-3 border border-slate-200">
              <div className="text-slate-500 text-[11px]">Tổng điểm đã đổi thưởng</div>
              <div className="text-xl font-bold text-slate-700 font-mono mt-1">0 điểm</div>
              <div className="text-[10px] text-slate-500 mt-1">Chưa sử dụng</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomersTab;
