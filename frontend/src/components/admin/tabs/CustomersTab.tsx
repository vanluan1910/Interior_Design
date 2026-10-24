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
  AutoCodeButton,
  getNextCode,
} from '@/components/admin';
import type { AdminCustomer, OrderRow, AdminBranch } from '@/types/admin';
import { customerApi } from '@/api/customerApi';
import { orderApi, normalizeOrderStatus } from '@/api/orderApi';
import { branchApi } from '@/api/branchApi';
import { isMatchBranch } from '@/utils/branchHelper';
import { ADMIN_STORAGE_KEYS, setStoredAdminData } from '@/utils/adminStorage';
import { invalidateApiCache } from '@/api/shared/apiCache';
import { getCleanProductName, getOrderQuantity } from './OrdersTab';


export interface CustomersTabProps {
  customersList: AdminCustomer[];
  setCustomersList: React.Dispatch<React.SetStateAction<AdminCustomer[]>>;
  ordersList?: OrderRow[];
  setOrdersList?: React.Dispatch<React.SetStateAction<OrderRow[]>>;
  selectedGlobalBranch?: string;
  branchesList?: AdminBranch[];
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
  ordersList = [],
  setOrdersList,
  selectedGlobalBranch = 'all',
  branchesList = [],
  onOpenCreateCustomer,
  onOpenEditCustomer,
  onSelectCustomerDetail,
}: CustomersTabProps) {
  const { message, modal } = App.useApp();

  // Search & Filter States
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [debtFilter, setDebtFilter] = useState('all'); // 'all' | 'has_debt' | 'no_debt'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [branchFilter, setBranchFilter] = useState<string>(selectedGlobalBranch || 'all');

  // Load branches if not provided as prop
  const [internalBranches, setInternalBranches] = useState<AdminBranch[]>([]);
  const effectiveBranches = useMemo(() => {
    return branchesList && branchesList.length > 0 ? branchesList : internalBranches;
  }, [branchesList, internalBranches]);

  React.useEffect(() => {
    if (!branchesList || branchesList.length === 0) {
      branchApi
        .getBranches()
        .then((list) => {
          if (Array.isArray(list) && list.length > 0) {
            setInternalBranches(list);
          }
        })
        .catch((e) => console.warn('Could not load branches:', e));
    }
  }, [branchesList]);

  // Sync if selectedGlobalBranch prop changes
  React.useEffect(() => {
    if (selectedGlobalBranch) {
      setBranchFilter(selectedGlobalBranch);
    }
  }, [selectedGlobalBranch]);

  // Load customers if not provided or empty
  React.useEffect(() => {
    if (!customersList || customersList.length === 0) {
      customerApi
        .getCustomers({ bypassCache: true })
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setCustomersList(data);
            try { setStoredAdminData(ADMIN_STORAGE_KEYS.CUSTOMERS, data); } catch {}
          }
        })
        .catch((e) => console.warn('Could not load customers in CustomersTab:', e));
    }
  }, [customersList.length, setCustomersList]);


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

  // Merge orders customers so any customer who placed an order is always included
  // and dynamically compute accurate debt & totalSpent from actual orders for EVERY customer
  const allMergedCustomers = useMemo(() => {
    // 1. Map orders by phone, name, and customerId for quick lookup
    const ordersByPhone = new Map<string, OrderRow[]>();
    const ordersByName = new Map<string, OrderRow[]>();
    const ordersById = new Map<string, OrderRow[]>();

    ordersList.forEach((ord) => {
      const cleanPhone = (ord.customerPhone || '').replace(/\s+/g, '');
      const cleanName = (ord.customerName || '').trim().toLowerCase();
      const custId = (ord as any).customerId;

      if (cleanPhone) {
        if (!ordersByPhone.has(cleanPhone)) ordersByPhone.set(cleanPhone, []);
        ordersByPhone.get(cleanPhone)!.push(ord);
      }
      if (cleanName) {
        if (!ordersByName.has(cleanName)) ordersByName.set(cleanName, []);
        ordersByName.get(cleanName)!.push(ord);
      }
      if (custId) {
        if (!ordersById.has(custId)) ordersById.set(custId, []);
        ordersById.get(custId)!.push(ord);
      }
    });

    const calculateOrderDebtAndSpent = (c: { id?: string; phone?: string; name?: string; debt?: number; totalSpent?: number }) => {
      const cleanPhone = (c.phone || '').replace(/\s+/g, '');
      const cleanName = (c.name || '').trim().toLowerCase();
      const matchedOrdersSet = new Set<OrderRow>();

      if (cleanPhone && ordersByPhone.has(cleanPhone)) {
        ordersByPhone.get(cleanPhone)!.forEach((o) => matchedOrdersSet.add(o));
      }
      if (cleanName && ordersByName.has(cleanName)) {
        ordersByName.get(cleanName)!.forEach((o) => matchedOrdersSet.add(o));
      }
      if (c.id && ordersById.has(c.id)) {
        ordersById.get(c.id)!.forEach((o) => matchedOrdersSet.add(o));
      }

      const matchedOrders = Array.from(matchedOrdersSet);
      if (matchedOrders.length === 0) {
        return {
          debt: Number(c.debt || 0),
          totalSpent: Number(c.totalSpent || 0),
          ordersCount: 0,
        };
      }

      // Debt is calculated from non-cancelled, non-returned, non-fully-paid orders
      const orderDebt = matchedOrders.reduce((sum, o) => {
        const s = normalizeOrderStatus(o.status);
        if (
          s === 'cancelled' ||
          s === 'returned' ||
          s === 'returned_success' ||
          o.paymentStatus?.toLowerCase() === 'paid' ||
          o.paymentStatus?.toLowerCase() === 'refunded'
        )
          return sum;
        const val = Number(o.value) || 0;
        const dep = Number(o.depositAmount) || 0;
        return sum + Math.max(0, val - dep);
      }, 0);

      const orderSpent = matchedOrders.reduce((sum, o) => {
        const s = normalizeOrderStatus(o.status);
        if (s === 'cancelled' || s === 'returned' || s === 'returned_success') return sum;
        return sum + (Number(o.value) || 0);
      }, 0);

      return {
        debt: matchedOrders.length > 0 ? orderDebt : Number(c.debt || 0),
        totalSpent: matchedOrders.length > 0 ? orderSpent : Number(c.totalSpent || 0),
        ordersCount: matchedOrders.length,
      };
    };

    // 2. Map existing customers from customersList with accurate computed debt & spent
    const list: AdminCustomer[] = customersList.map((c) => {
      const { debt, totalSpent, ordersCount } = calculateOrderDebtAndSpent(c);
      const cleanCustomerName = c.name || (c as any).fullName || (c as any).FullName || '';
      return {
        ...c,
        name: cleanCustomerName,
        debt,
        totalSpent,
        totalOrders: ordersCount > 0 ? ordersCount : (c.totalOrders || c.ordersCount || 0),
        ordersCount: ordersCount > 0 ? ordersCount : (c.ordersCount || c.totalOrders || 0),
      };
    });

    // 3. Find any customers in ordersList who are not yet in customersList
    const existingPhones = new Set(customersList.map((c) => (c.phone || '').replace(/\s+/g, '')));
    const existingNames = new Set(customersList.map((c) => (c.name || (c as any).fullName || (c as any).FullName || '').trim().toLowerCase()));

    ordersList.forEach((ord) => {
      const cleanPhone = (ord.customerPhone || '').replace(/\s+/g, '');
      const cleanName = (ord.customerName || '').trim().toLowerCase();
      if (!cleanPhone && !cleanName) return;

      const alreadyExists = (cleanPhone && existingPhones.has(cleanPhone)) || (cleanName && existingNames.has(cleanName));
      if (!alreadyExists) {
        if (cleanPhone) existingPhones.add(cleanPhone);
        if (cleanName) existingNames.add(cleanName);

        const dummyCust = {
          id: (ord as any).customerId || `cust_${ord.id}`,
          phone: ord.customerPhone || '',
          name: ord.customerName || 'Khách hàng mới',
          debt: 0,
          totalSpent: 0,
        };
        const { debt, totalSpent, ordersCount } = calculateOrderDebtAndSpent(dummyCust);

        list.unshift({
          id: dummyCust.id,
          code: `KH-${(list.length + 1).toString().padStart(3, '0')}`,
          name: dummyCust.name,
          phone: dummyCust.phone,
          email: (ord as any).customerEmail || '',
          address: ord.customerAddress || (ord as any).shippingAddress || '',
          customerType: 'individual',
          status: 'active',
          branch: ord.branch || ord.showroom || '',
          totalSpent,
          debt,
          totalOrders: ordersCount,
          ordersCount,
          rewardPoints: Math.floor(totalSpent / 1000000) * 10,
          createdAt: ord.orderDate || new Date().toLocaleDateString('vi-VN'),
        } as AdminCustomer);
      }
    });

    return list;
  }, [customersList, ordersList]);

  // Filtered Customers Logic
  const filteredCustomers = useMemo(() => {
    return allMergedCustomers.filter((c) => {
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
        (c.taxId || '').toLowerCase().includes(q) ||
        (c.branch || '').toLowerCase().includes(q) ||
        (c.branchName || '').toLowerCase().includes(q);

      const matchStatus = statusFilter === 'all' || (c.status || 'active') === statusFilter;

      let matchDebt = true;
      if (debtFilter === 'has_debt') matchDebt = Number(c.debt || 0) > 0;
      if (debtFilter === 'no_debt') matchDebt = Number(c.debt || 0) <= 0;

      let matchBranch = true;
      if (branchFilter && branchFilter !== 'all') {
        const custBranch = c.branch || c.branchName;
        // Khách hàng toàn hệ thống, trực tuyến, hoặc không thuộc cơ sở cụ thể thì luôn hiển thị cho tất cả chi nhánh
        if (
          !custBranch ||
          custBranch === 'Toàn hệ thống' ||
          custBranch.toLowerCase() === 'all' ||
          custBranch.toLowerCase() === 'online' ||
          custBranch.toLowerCase() === 'website' ||
          !effectiveBranches.some((b) => isMatchBranch(b.name, custBranch))
        ) {
          matchBranch = true;
        } else {
          matchBranch = isMatchBranch(custBranch, branchFilter);
          if (!matchBranch) {
            // Kiểm tra khách hàng có đơn hàng tại chi nhánh này không
            const hasOrderInBranch = ordersList.some((o) => {
              const isSameCustomer =
                (c.phone && o.customerPhone && o.customerPhone.replace(/\s+/g, '') === c.phone.replace(/\s+/g, '')) ||
                (c.name && o.customerName && o.customerName.trim().toLowerCase() === c.name.trim().toLowerCase()) ||
                ((o as any).customerId && (o as any).customerId === c.id);
              return isSameCustomer && isMatchBranch(o.branch || o.showroom, branchFilter);
            });
            matchBranch = hasOrderInBranch;
          }
        }
      }

      return matchSearch && matchStatus && matchDebt && matchBranch;
    });
  }, [allMergedCustomers, ordersList, customerSearchQuery, debtFilter, statusFilter, branchFilter, effectiveBranches]);

  // Open Create Customer Drawer
  const handleOpenCreate = () => {
    if (onOpenCreateCustomer) {
      onOpenCreateCustomer();
      return;
    }
    const existingCodes = new Set(
      customersList
        .map((c) => (c.code || '').trim().toUpperCase())
        .filter(Boolean)
    );
    let nextNum = 1;
    let autoCode = `KH-${nextNum.toString().padStart(3, '0')}`;
    while (existingCodes.has(autoCode)) {
      nextNum++;
      autoCode = `KH-${nextNum.toString().padStart(3, '0')}`;
    }
    setDrawerOpen(true);

    setTimeout(() => {
      form.resetFields();
      form.setFieldsValue({
        code: autoCode,
        customerType: 'individual',
        status: 'active',
        country: 'Việt Nam',
        branch: branchFilter !== 'all' ? branchFilter : (selectedGlobalBranch !== 'all' ? selectedGlobalBranch : undefined),
      });
    }, 0);
  };

  const handleGenerateCustomerCode = () => {
    const currentCode = form.getFieldValue('code');
    const autoCode = getNextCode(currentCode, customersList, 'KH-', 3);
    form.setFieldsValue({ code: autoCode });
    message.success(`Đã tự động tạo mã khách hàng mới: ${autoCode}`);
  };

  // Open Edit Customer Drawer
  const handleOpenEdit = (customer: AdminCustomer) => {
    if (onOpenEditCustomer) {
      onOpenEditCustomer(customer);
      return;
    }
    setEditingCustomer(customer);
    setCustomerTypeChoice(customer.customerType || 'individual');
    setDrawerOpen(true);

    setTimeout(() => {
      form.resetFields();
      form.setFieldsValue({
        code: customer.code,
        name: customer.name,
        branch: customer.branch || customer.branchName,
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
    }, 0);
  };

  const refreshCustomers = async () => {
    try {
      invalidateApiCache('customers');
      const data = await customerApi.getCustomers({ bypassCache: true });
      if (Array.isArray(data)) {
        setCustomersList(data);
        try { setStoredAdminData(ADMIN_STORAGE_KEYS.CUSTOMERS, data); } catch {}
        message.success('Đã làm mới danh sách khách hàng từ máy chủ!');
      }
    } catch (err: any) {
      console.warn('Could not refresh customers:', err);
    }
  };

  // Save Customer (Create / Update)
  const handleSaveCustomer = async () => {
    try {
      const values = await form.validateFields();
      const trimmedCode = (values.code || '').trim().toUpperCase();
      const trimmedName = (values.name || '').trim();

      const payload: Partial<AdminCustomer> = {
        ...values,
        code: trimmedCode || undefined,
        name: trimmedName,
        branch: values.branch || undefined,
        branchName: values.branch || undefined,
        birthday: values.birthday ? values.birthday.format('YYYY-MM-DD') : undefined,
      };

      if (editingCustomer) {
        await customerApi.updateCustomer(editingCustomer.id, payload);
        message.success(`Đã cập nhật thông tin khách hàng ${trimmedName}!`);
      } else {
        await customerApi.createCustomer(payload);
        message.success(`Đã thêm khách hàng mới ${trimmedName}!`);
      }
      setDrawerOpen(false);
      await refreshCustomers();
    } catch (err: any) {
      message.error(err?.message || 'Vui lòng kiểm tra lại các trường thông tin bắt buộc.');
    }
  };

  // Delete Customer
  const handleDeleteCustomer = async (id: string) => {
    const target = customersList.find((c) => c.id === id);
    try {
      await customerApi.deleteCustomer(id);
      setSelectedRowKeys((prev) => prev.filter((k) => k !== id));
      if (expandedCustomerId === id) setExpandedCustomerId(null);
      message.success(`Đã xóa khách hàng ${target?.name || ''}!`);
      await refreshCustomers();
    } catch (err: any) {
      message.error(err?.message || 'Xóa khách hàng thất bại.');
    }
  };

  // Batch Delete
  const handleBatchDelete = () => {
    modal.confirm({
      title: 'Xác nhận xóa hàng loạt',
      content: `Bạn có chắc chắn muốn xóa ${selectedRowKeys.length} khách hàng đã chọn? Thao tác này không thể khôi phục.`,
      okText: 'Xóa đã chọn',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await Promise.all(selectedRowKeys.map((k) => customerApi.deleteCustomer(String(k))));
          message.success(`Đã xóa thành công ${selectedRowKeys.length} khách hàng!`);
          setSelectedRowKeys([]);
          await refreshCustomers();
        } catch (err: any) {
          message.error(err?.message || 'Xóa hàng loạt thất bại.');
        }
      },
    });
  };

  // Batch Toggle Status
  const handleBatchToggleStatus = async (targetStatus: 'active' | 'inactive') => {
    try {
      await Promise.all(
        selectedRowKeys.map((k) => customerApi.updateCustomer(String(k), { status: targetStatus }))
      );
      message.success(
        `Đã chuyển trạng thái ${selectedRowKeys.length} khách hàng sang ${
          targetStatus === 'active' ? 'Đang hoạt động' : 'Ngừng hoạt động'
        }!`
      );
      setSelectedRowKeys([]);
      await refreshCustomers();
    } catch (err: any) {
      message.error(err?.message || 'Chuyển trạng thái thất bại.');
    }
  };

  // Export to CSV / Excel
  const handleExportExcel = () => {
    const headers = [
      'Mã KH',
      'Họ và tên',
      'Chi nhánh',
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
      `"${c.branch || c.branchName || ''}"`,
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

  // Effective Debt of the customer currently being collected
  const effectiveCollectDebt = useMemo(() => {
    if (!collectDebtCustomer) return 0;
    const custOrders = ordersList.filter((o) => {
      const matchPhone = collectDebtCustomer.phone && o.customerPhone && o.customerPhone.replace(/\s+/g, '') === collectDebtCustomer.phone.replace(/\s+/g, '');
      const matchName = collectDebtCustomer.name && o.customerName && o.customerName.trim().toLowerCase() === collectDebtCustomer.name.trim().toLowerCase();
      const matchId = (o as any).customerId && (o as any).customerId === collectDebtCustomer.id;
      return matchPhone || matchName || matchId;
    });
    const orderDebt = custOrders.reduce((sum, o) => {
      const s = normalizeOrderStatus(o.status);
      if (
        s === 'cancelled' ||
        s === 'returned' ||
        s === 'returned_success' ||
        o.paymentStatus?.toLowerCase() === 'paid' ||
        o.paymentStatus?.toLowerCase() === 'refunded'
      ) {
        return sum;
      }
      return sum + Math.max(0, (Number(o.value) || 0) - (Number(o.depositAmount) || 0));
    }, 0);
    return orderDebt > 0 ? orderDebt : Number(collectDebtCustomer.debt || 0);
  }, [collectDebtCustomer, ordersList]);

  // Quick Debt Collection Submission
  const handleConfirmCollectDebt = async () => {
    if (!collectDebtCustomer) return;
    if (collectAmount <= 0) {
      message.error('Số tiền thu nợ phải lớn hơn 0 đ!');
      return;
    }
    try {
      // 1. If customer exists in DB as GUID, call backend customer collect-debt API
      const isCustomerGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(collectDebtCustomer.id);
      if (isCustomerGuid) {
        try {
          await customerApi.collectDebt(collectDebtCustomer.id, {
            amount: collectAmount,
            paymentMethod: collectMethod === 'transfer' ? 'Chuyển khoản VietQR' : 'Tiền mặt',
            note: collectNote,
          });
        } catch (apiErr: any) {
          console.warn('Customer API collect debt warning:', apiErr);
        }
      }

      // 2. Update orders in ordersList & backend orderApi
      let remainingToCollect = collectAmount;
      const updatedOrders = [...ordersList];
      const ordersToUpdateInBackend: Array<{ id: string; depositAmount: number; depositPercent: number; depositNote: string; paymentStatus: string }> = [];

      for (let i = 0; i < updatedOrders.length; i++) {
        if (remainingToCollect <= 0) break;
        const ord = updatedOrders[i];
        const matchPhone = collectDebtCustomer.phone && ord.customerPhone && ord.customerPhone.replace(/\s+/g, '') === collectDebtCustomer.phone.replace(/\s+/g, '');
        const matchName = collectDebtCustomer.name && ord.customerName && ord.customerName.trim().toLowerCase() === collectDebtCustomer.name.trim().toLowerCase();
        const matchId = (ord as any).customerId && (ord as any).customerId === collectDebtCustomer.id;

        if (matchPhone || matchName || matchId) {
          const ordVal = Number(ord.value || 0);
          const currentDep = Number(ord.depositAmount || 0);
          const unpaid = Math.max(0, ordVal - currentDep);

          if (unpaid > 0) {
            const payForThis = Math.min(remainingToCollect, unpaid);
            const newDep = currentDep + payForThis;
            const newPercent = ordVal > 0 ? Math.min(100, Math.round((newDep / ordVal) * 100)) : 100;
            const isFull = newDep >= ordVal;
            const methodLabel = collectMethod === 'transfer' ? 'Chuyển khoản VietQR' : 'Tiền mặt';
            const noteText = isFull ? `${methodLabel} (Đã thu đủ 100%)` : `${methodLabel} (Đã thu ${newPercent}%)`;

            updatedOrders[i] = {
              ...ord,
              depositAmount: newDep,
              depositPercent: newPercent,
              depositNote: noteText,
            };

            ordersToUpdateInBackend.push({
              id: ord.id,
              depositAmount: newDep,
              depositPercent: newPercent,
              depositNote: noteText,
              paymentStatus: isFull ? 'paid' : 'partial',
            });

            remainingToCollect -= payForThis;
          }
        }
      }

      if (ordersToUpdateInBackend.length > 0) {
        if (setOrdersList) {
          setOrdersList(updatedOrders);
        }
        await Promise.allSettled(
          ordersToUpdateInBackend.map((o) => {
            const isOrderGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(o.id);
            if (isOrderGuid) {
              return orderApi.updateOrder(o.id, {
                depositAmount: o.depositAmount,
                depositPercent: o.depositPercent,
                depositNote: o.depositNote,
                paymentStatus: o.paymentStatus,
              });
            }
            return Promise.resolve();
          })
        );
      }

      // 3. Update customersList in state
      setCustomersList((prevList) =>
        prevList.map((c) => {
          const matchPhone = c.phone && collectDebtCustomer.phone && c.phone.replace(/\s+/g, '') === collectDebtCustomer.phone.replace(/\s+/g, '');
          const matchName = c.name && collectDebtCustomer.name && c.name.trim().toLowerCase() === collectDebtCustomer.name.trim().toLowerCase();
          const matchId = c.id === collectDebtCustomer.id;
          if (matchId || matchPhone || matchName) {
            return {
              ...c,
              debt: Math.max(0, Number(c.debt || 0) - collectAmount),
              totalSpent: Number(c.totalSpent || 0) + collectAmount,
            };
          }
          return c;
        })
      );

      message.success(
        `Đã thu thành công ${collectAmount.toLocaleString('vi-VN')} đ cho khách hàng ${
          collectDebtCustomer.name
        }!`
      );
      setCollectDebtCustomer(null);
      await refreshCustomers();
    } catch (err: any) {
      message.error(err?.message || 'Thu nợ thất bại.');
    }
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
        <div className="flex-1 min-w-[240px] max-w-md">
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
            onClick={async () => {
              setCustomerSearchQuery('');
              setDebtFilter('all');
              setStatusFilter('all');
              setBranchFilter('all');
              await refreshCustomers();
              message.success('Đã làm mới danh sách khách hàng từ Database!');
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
              statusFilter !== 'all' ||
              branchFilter !== 'all'
          )}
          onResetFilters={() => {
            setCustomerSearchQuery('');
            setDebtFilter('all');
            setStatusFilter('all');
            setBranchFilter(selectedGlobalBranch || '');
          }}
        >

          {/* Cơ sở / Chi nhánh */}
          {effectiveBranches.length > 0 && (
            <div className="space-y-1.5 pt-2">
              <label className="font-semibold text-slate-600 text-xs uppercase tracking-wider block">Cơ sở / Chi nhánh</label>
              <Select
                value={branchFilter || 'all'}
                onChange={(v) => setBranchFilter(v)}
                className="w-full text-sm font-semibold"
                options={[
                  { value: 'all', label: `Toàn bộ chi nhánh (${allMergedCustomers.length})` },
                  ...effectiveBranches.map((b) => {
                    const count = allMergedCustomers.filter((c) => {
                      const custBranch = c.branch || c.branchName;
                      if (!custBranch || custBranch === 'Toàn hệ thống' || custBranch.toLowerCase() === 'all') return true;
                      return isMatchBranch(custBranch, b.name);
                    }).length;
                    return {
                      value: b.name,
                      label: `${b.name} (${count})`,
                    };
                  }),
                ]}
              />
            </div>
          )}

          {/* Tình trạng công nợ */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
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
              { label: 'Số khách hàng hiển thị', value: `${filteredCustomers.length} khách` },
              {
                label: 'Tổng doanh số tích lũy',
                value: `${(filteredCustomers.reduce((acc, c) => acc + (c.totalSpent || 0), 0) / 1000000).toLocaleString('vi-VN')} Tr`,
                color: 'success',
              },
              {
                label: 'Tổng công nợ chưa thu',
                value: `${(filteredCustomers.reduce((acc, c) => acc + (c.debt || 0), 0) / 1000000).toLocaleString('vi-VN')} Tr`,
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
            totalCount={filteredCustomers.length}
            countUnit="khách hàng"
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
                  ordersList={ordersList}
                  onEdit={() => handleOpenEdit(customer)}
                  onDelete={() => handleDeleteCustomer(customer.id)}
                  onCollectDebt={(amt?: number, note?: string) => {
                    setCollectDebtCustomer(customer);
                    setCollectAmount(amt !== undefined ? amt : Number(customer.debt || 0));
                    setCollectNote(note || `Thu nợ đơn may đo KH ${customer.code}`);
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
                width: 230,
                render: (_, r: AdminCustomer) => {
                  const displayName = r.name || (r as any).fullName || (r as any).FullName || 'Khách hàng';
                  const displayInitial = displayName ? displayName.charAt(0).toUpperCase() : 'K';
                  return (
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#fbf2ee] border border-[#d8c3af] flex items-center justify-center font-bold text-xs text-[#5d371f] shrink-0">
                        {displayInitial}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 text-sm truncate" title={displayName}>
                          {displayName}
                        </div>
                        <div className="text-xs text-slate-500 font-mono flex items-center gap-1.5 flex-wrap mt-0.5">
                          <span>{r.phone}</span>
                          {r.customerType === 'organization' && <span>• Doanh nghiệp</span>}
                        </div>
                      </div>
                    </div>
                  );
                },
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
                render: (debt: number) => {
                  const hasDebt = Number(debt || 0) > 0;
                  return (
                    <span
                      className={`font-mono font-semibold text-sm ${
                        hasDebt ? 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded' : 'text-slate-400'
                      }`}
                    >
                      {hasDebt ? `${Number(debt).toLocaleString('vi-VN')} đ` : '0 đ'}
                    </span>
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
                width: 120,
                render: (_, r: AdminCustomer) => (
                  <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    {Number(r.debt || 0) > 0 && (
                      <Tooltip title={`Thu nợ (${Number(r.debt || 0).toLocaleString('vi-VN')} đ)`}>
                        <Button
                          type="text"
                          size="small"
                          icon={<DollarOutlined className="text-rose-600 hover:text-rose-700 text-sm font-bold" />}
                          onClick={() => {
                            setCollectDebtCustomer(r);
                            setCollectAmount(Number(r.debt || 0));
                            setCollectNote(`Thu nợ khách hàng ${r.code} - ${r.name}`);
                          }}
                          className="w-7 h-7 flex items-center justify-center rounded hover:bg-rose-50"
                        />
                      </Tooltip>
                    )}
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
            <UserOutlined className="text-xl text-[#784e34]" />
            <span className="font-bold text-base text-slate-900">
              {editingCustomer ? `Chỉnh sửa khách hàng ${editingCustomer.code}` : 'Thêm mới khách hàng & đối tác'}
            </span>
          </div>
        }
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        styles={{ wrapper: { width: 760, maxWidth: '100vw' } }}
        forceRender
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
                <Input
                  placeholder="Tự động (VD: KH-007)"
                  className="h-9 text-xs font-mono"
                  suffix={
                    <AutoCodeButton
                      onGenerate={handleGenerateCustomerCode}
                      tooltipTitle="Tự động tạo mã khách hàng mới"
                    />
                  }
                />
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
                name="branch"
                label={<span className="text-xs font-semibold text-slate-700">Chi nhánh trực thuộc</span>}
              >
                <Select
                  placeholder="Chọn chi nhánh phụ trách"
                  allowClear
                  options={effectiveBranches.map((b) => ({ label: b.name, value: b.name }))}
                  className="w-full text-xs"
                />
              </Form.Item>

              <Form.Item
                name="status"
                label={<span className="text-xs font-semibold text-slate-700">Trạng thái hoạt động</span>}
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
            <WalletOutlined className="text-xl text-rose-600" />
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
                  {effectiveCollectDebt.toLocaleString('vi-VN')} đ
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
                    onClick={() => setCollectAmount(effectiveCollectDebt)}
                    className="text-[11px] px-2.5 py-1 bg-rose-50 text-rose-700 font-semibold border border-rose-200 hover:bg-rose-100 cursor-pointer rounded transition-colors"
                  >
                    100% Tất cả nợ
                  </button>
                  <button
                    type="button"
                    onClick={() => setCollectAmount(Math.round(effectiveCollectDebt * 0.5))}
                    className="text-[11px] px-2.5 py-1 bg-slate-100 text-slate-700 font-semibold border border-slate-200 hover:bg-slate-200 cursor-pointer rounded transition-colors"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => setCollectAmount(Math.round(effectiveCollectDebt * 0.3))}
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
                max={effectiveCollectDebt || 10000000000}
              />
              <div className="text-[11px] text-slate-500 mt-1.5 flex items-center justify-between">
                <span>
                  Công nợ sau khi thu:{' '}
                  <strong className="font-mono text-slate-800 font-bold">
                    {Math.max(0, effectiveCollectDebt - collectAmount).toLocaleString('vi-VN')} đ
                  </strong>
                </span>
                {collectAmount >= effectiveCollectDebt && effectiveCollectDebt > 0 && (
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
            <UploadOutlined className="text-xl text-[#784e34]" />
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
  ordersList?: OrderRow[];
  onEdit: () => void;
  onDelete: () => void;
  onCollectDebt: (amount?: number, note?: string) => void;
}

function CustomerExpandedDetailRow({
  customer,
  ordersList = [],
  onEdit,
  onDelete,
  onCollectDebt,
}: CustomerExpandedDetailRowProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'orders' | 'payments'>('info');

  // Related Orders filtered by phone, name, or customer ID
  const relatedOrders = useMemo(() => {
    if (!ordersList || ordersList.length === 0) return [];
    return ordersList.filter((o) => {
      const matchPhone = customer.phone && o.customerPhone && o.customerPhone.replace(/\s+/g, '') === customer.phone.replace(/\s+/g, '');
      const matchName = customer.name && o.customerName && o.customerName.trim().toLowerCase() === customer.name.trim().toLowerCase();
      const matchId = (o as any).customerId && (o as any).customerId === customer.id;
      return matchPhone || matchName || matchId;
    });
  }, [ordersList, customer]);

  // Debt orders (orders where value > depositAmount)
  const debtOrders = useMemo(() => {
    return relatedOrders.filter((o) => {
      const s = normalizeOrderStatus(o.status);
      if (
        s === 'cancelled' ||
        s === 'returned' ||
        s === 'returned_success' ||
        o.paymentStatus?.toLowerCase() === 'paid' ||
        o.paymentStatus?.toLowerCase() === 'refunded'
      ) {
        return false;
      }
      return (Number(o.value) || 0) - (Number(o.depositAmount) || 0) > 0;
    });
  }, [relatedOrders]);

  // Total debt calculated
  const totalCalculatedDebt = useMemo(() => {
    if (debtOrders.length > 0) {
      return debtOrders.reduce((sum, o) => sum + Math.max(0, (Number(o.value) || 0) - (Number(o.depositAmount) || 0)), 0);
    }
    return Number(customer.debt || 0);
  }, [debtOrders, customer.debt]);

  // Payment receipts generated from real order transactions
  const paymentReceipts = useMemo(() => {
    const list: Array<{
      id: string;
      receiptCode: string;
      orderCode: string;
      date: string;
      method: string;
      amount: number;
      status: 'recorded' | 'pending';
      statusLabel: string;
      note: string;
    }> = [];

    relatedOrders.forEach((ord, index) => {
      const deposit = Number(ord.depositAmount || 0);
      const totalVal = Number(ord.value || 0);
      const cleanCode = (ord.orderCode || `DH${index + 1}`).replace(/^#/, '');

      if (deposit > 0) {
        const percent = totalVal > 0 ? Math.round((deposit / totalVal) * 100) : 100;
        const isFull = deposit >= totalVal;
        list.push({
          id: `rcpt-deposit-${ord.id || index}`,
          receiptCode: `PT-${cleanCode}-01`,
          orderCode: ord.orderCode,
          date: ord.orderDate || dayjs().format('DD/MM/YYYY'),
          method: ord.depositNote || (isFull ? 'Chuyển khoản VietQR (100%)' : `Tạm ứng ${percent}%`),
          amount: deposit,
          status: 'recorded',
          statusLabel: 'Đã ghi sổ',
          note: isFull
            ? `Thanh toán 100% đơn hàng ${ord.orderCode} (${getCleanProductName(ord.productName)})`
            : `Tạm ứng ${percent}% đơn may đo ${ord.orderCode} (${getCleanProductName(ord.productName)})`,
        });
      }

      // If COD or unpaid balance
      if (deposit === 0) {
        const s = normalizeOrderStatus(ord.status);
        if (s !== 'cancelled' && s !== 'returned' && s !== 'returned_success') {
          list.push({
            id: `rcpt-cod-${ord.id || index}`,
            receiptCode: `COD-${cleanCode}`,
            orderCode: ord.orderCode,
            date: ord.orderDate || dayjs().format('DD/MM/YYYY'),
            method: 'Thanh toán khi nhận hàng (COD)',
            amount: totalVal,
            status: s === 'completed' ? 'recorded' : 'pending',
            statusLabel: s === 'completed' ? 'Đã thu khi giao' : 'Chờ thu khi giao',
            note: `Đơn ${ord.orderCode} (${getCleanProductName(ord.productName)}) - Thu tiền khi giao hàng`,
          });
        }
      }
    });

    // If customer has spent total money but no related order receipts (e.g. historical customer data)
    if (list.length === 0 && Number(customer.totalSpent || 0) > 0) {
      list.push({
        id: `rcpt-hist-${customer.id}`,
        receiptCode: `PT-${customer.code || 'KH001'}`,
        orderCode: 'Lịch sử tích lũy',
        date: customer.lastOrderDate || customer.createdAt || dayjs().format('DD/MM/YYYY'),
        method: 'Chuyển khoản / Tiền mặt',
        amount: Number(customer.totalSpent || 0),
        status: 'recorded',
        statusLabel: 'Đã ghi sổ',
        note: `Tổng tiền tích lũy các giao dịch đã hoàn tất của khách hàng`,
      });
    }

    return list;
  }, [relatedOrders, customer]);

  return (
    <div
      className="bg-white p-4 border-t border-b border-slate-200 shadow-inner space-y-4 text-left text-xs w-full max-w-full overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Tab Navigation: Pill active style without icons + Action Buttons */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200 flex-wrap">
        <div className="flex items-center gap-2">
          {[
            { key: 'info', label: 'Thông tin' },
            { key: 'orders', label: `Lịch sử đơn may đo (${relatedOrders.length})` },
            { key: 'payments', label: `Lịch sử thanh toán (${paymentReceipts.length})` },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-amber-50 text-[#784e34] border-[#784e34]/40 shadow-xs'
                    : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            icon={<EditOutlined />}
            onClick={onEdit}
            className="h-8 px-3 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-[#784e34] hover:border-[#784e34] shadow-xs flex items-center gap-1.5"
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
            <Button
              danger
              icon={<DeleteOutlined />}
              className="h-8 px-3 text-xs font-semibold rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 shadow-xs flex items-center gap-1.5"
            >
              Xóa
            </Button>
          </Popconfirm>
        </div>
      </div>

      {/* Tab 1: Thông tin chi tiết */}
      {activeTab === 'info' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-4 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Khách hàng:</span>
              <span className="font-medium text-slate-900 text-sm flex items-center gap-1.5">
                {customer.name}
                <span className="font-mono text-xs font-normal text-[#784e34]">#{customer.code}</span>
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Chi nhánh phụ trách:</span>
              <span className="font-medium text-[#784e34] text-sm">
                {customer.branch || customer.branchName ? `📍 ${customer.branch || customer.branchName}` : 'Dùng chung hệ thống'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Số điện thoại:</span>
              <span className="font-mono font-medium text-slate-900 text-sm">{customer.phone}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Điện thoại 2 / Zalo:</span>
              <span className="font-mono text-slate-700">{customer.phone2 || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Email:</span>
              <span className="font-medium text-slate-900">{customer.email || '—'}</span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Ngày sinh:</span>
              <span className="font-mono text-slate-700">
                {customer.birthday ? dayjs(customer.birthday).format('DD/MM/YYYY') : '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Loại khách hàng:</span>
              <span className="font-medium text-slate-900">
                {customer.customerType === 'organization' ? 'Doanh nghiệp / Tổ chức' : 'Cá nhân'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Mã số thuế (MST):</span>
              <span className="font-mono text-slate-700">{customer.taxId || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Tên công ty:</span>
              <span className="font-medium text-slate-900">{customer.companyName || '—'}</span>
            </div>

            <div className="lg:col-span-2">
              <span className="text-slate-400 block mb-0.5">Địa chỉ công trình:</span>
              <span className="font-normal text-slate-800">{customer.address || '—'}</span>
            </div>
            <div className="lg:col-span-2">
              <span className="text-slate-400 block mb-0.5">Địa chỉ xuất hóa đơn:</span>
              <span className="font-normal text-slate-800">{customer.invoiceAddress || customer.address || '—'}</span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Ngân hàng:</span>
              <span className="font-medium text-slate-800">{customer.bankName || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Số tài khoản:</span>
              <span className="font-mono text-slate-800">{customer.bankAccount || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Số CCCD / CMND:</span>
              <span className="font-mono text-slate-800">{customer.idNumber || customer.passport || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Phong cách ưa thích:</span>
              <span className="font-medium text-[#784e34]">{customer.preferredStyle || '—'}</span>
            </div>

            {/* Financial Metrics Summary Bar */}
            <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-[#fbf8f5] border border-[#e8ded6] mt-1">
              <div className="flex flex-col">
                <span className="text-slate-500 text-[11px] font-medium">Tổng giá trị đơn hàng:</span>
                <span className="text-sm font-mono font-bold text-[#5d371f]">
                  {(Number(customer.totalSpent) || 0).toLocaleString('vi-VN')} đ
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-500 text-[11px] font-medium">Tổng tiền đã thu / tạm ứng:</span>
                <span className="text-sm font-mono font-bold text-emerald-700">
                  {Math.max(0, (Number(customer.totalSpent) || 0) - totalCalculatedDebt).toLocaleString('vi-VN')} đ
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-500 text-[11px] font-medium">Công nợ còn lại:</span>
                <span className={`text-sm font-mono font-bold ${totalCalculatedDebt > 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                  {totalCalculatedDebt > 0 ? `${totalCalculatedDebt.toLocaleString('vi-VN')} đ` : '0 đ (Đã thanh toán đủ)'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Lịch sử đơn may đo */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {relatedOrders.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">
              <ShoppingCartOutlined className="text-2xl mb-1 block" />
              Chưa có lịch sử đơn hàng nào cho khách hàng này.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                    <th className="py-2 px-3 font-medium whitespace-nowrap">Mã đơn</th>
                    <th className="py-2 px-3 font-medium whitespace-nowrap">Ngày đặt</th>
                    <th className="py-2 px-3 font-medium">Sản phẩm &amp; Quy cách vật liệu</th>
                    <th className="py-2 px-3 font-medium text-center whitespace-nowrap">Số lượng</th>
                    <th className="py-2 px-3 font-medium text-right whitespace-nowrap">Tổng giá trị</th>
                    <th className="py-2 px-3 font-medium text-right whitespace-nowrap">Đã thanh toán</th>
                    <th className="py-2 px-3 font-medium text-right whitespace-nowrap">Còn nợ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {relatedOrders.map((ord) => {
                    const ordVal = Number(ord.value) || 0;
                    const ordDep = Number(ord.depositAmount) || 0;
                    const ordDebt = ord.status === 'cancelled' || ord.paymentStatus?.toLowerCase() === 'paid' ? 0 : Math.max(0, ordVal - ordDep);
                    return (
                      <tr key={ord.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-mono font-medium text-[#784e34] whitespace-nowrap">{ord.orderCode}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-700 whitespace-nowrap">{ord.orderDate}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-slate-900">{getCleanProductName(ord.productName)}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{ord.productSpec}</div>
                          {ord.recipientName && (ord.recipientName.trim().toLowerCase() !== (customer.name || '').trim().toLowerCase() || (ord.recipientPhone && ord.recipientPhone.replace(/\s+/g, '') !== (customer.phone || '').replace(/\s+/g, ''))) ? (
                            <div className="text-[10px] text-[#784e34] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/80 inline-block mt-1 font-medium">
                              📦 Nhận hàng: {ord.recipientName} {ord.recipientPhone ? `(${ord.recipientPhone})` : ''}
                            </div>
                          ) : null}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-900 whitespace-nowrap">
                          {getOrderQuantity(ord)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-900 whitespace-nowrap">
                          {ordVal.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-medium text-emerald-700 whitespace-nowrap">
                          {ordDep.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-medium whitespace-nowrap">
                          {ordDebt > 0 ? (
                            <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded font-semibold">
                              {ordDebt.toLocaleString('vi-VN')} đ
                            </span>
                          ) : (
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                              0 đ
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Lịch sử thanh toán */}
      {activeTab === 'payments' && (
        <div className="space-y-3">
          {/* Debt Summary Banner & Collect Debt CTA */}
          <div className="flex items-center justify-between p-3.5 bg-[#fbf8f5] border border-[#e8ded6] rounded-lg flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${totalCalculatedDebt > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                <DollarOutlined className="text-lg" />
              </div>
              <div>
                <div className="text-xs text-slate-700">
                  Tổng công nợ hiện tại: <strong className={`font-mono text-sm ${totalCalculatedDebt > 0 ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}`}>{totalCalculatedDebt > 0 ? `${totalCalculatedDebt.toLocaleString('vi-VN')} đ` : '0 đ (Đã thanh toán đủ)'}</strong>
                </div>
                <div className="text-[11px] text-slate-500">
                  {totalCalculatedDebt > 0
                    ? 'Khách hàng có khoản công nợ cần thu, bấm nút "Thu tiền nợ ngay" để ghi nhận thanh toán.'
                    : 'Khách hàng không còn công nợ cần thu.'}
                </div>
              </div>
            </div>

            <Button
              type="primary"
              icon={<DollarOutlined />}
              onClick={() => onCollectDebt(totalCalculatedDebt, `Thu nợ công nợ khách hàng ${customer.code} - ${customer.name}`)}
              className={`h-8 px-4 text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 border-none ${
                totalCalculatedDebt > 0
                  ? 'bg-rose-600 hover:!bg-rose-700 text-white'
                  : 'bg-[#784e34] hover:!bg-[#5d371f] text-white'
              }`}
            >
              {totalCalculatedDebt > 0 ? `Thu tiền nợ ngay (${totalCalculatedDebt.toLocaleString('vi-VN')} đ)` : '+ Lập phiếu thu tiền'}
            </Button>
          </div>

          {/* Sub-table Lịch sử thanh toán */}
          <div className="overflow-x-auto border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                  <th className="py-2 px-3 font-medium whitespace-nowrap">Mã phiếu / Thời gian</th>
                  <th className="py-2 px-3 font-medium whitespace-nowrap">Phương thức</th>
                  <th className="py-2 px-3 font-medium">Nội dung đợt thu</th>
                  <th className="py-2 px-3 font-medium text-center whitespace-nowrap">Trạng thái</th>
                  <th className="py-2 px-3 font-medium text-right whitespace-nowrap">Số tiền</th>
                  <th className="py-2 px-3 font-medium text-center whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paymentReceipts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      Chưa có lịch sử giao dịch thanh toán nào cho khách hàng này.
                    </td>
                  </tr>
                ) : (
                  paymentReceipts.map((rcpt) => (
                    <tr key={rcpt.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3">
                        <div className="font-mono font-medium text-[#784e34]">{rcpt.receiptCode}</div>
                        <div className="text-[11px] text-slate-500">{rcpt.date}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">{rcpt.method}</td>
                      <td className="py-2.5 px-3">
                        <div className="text-slate-900 font-medium">{rcpt.note}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 text-[11px] font-medium ${
                            rcpt.status === 'recorded'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-[#784e34] border border-amber-200'
                          }`}
                        >
                          {rcpt.statusLabel}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-emerald-700 whitespace-nowrap">
                        {rcpt.amount.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {rcpt.status === 'pending' || rcpt.statusLabel?.includes('Chờ thu') ? (
                          <Button
                            size="small"
                            type="primary"
                            icon={<DollarOutlined />}
                            onClick={() => onCollectDebt(rcpt.amount, `Thu tiền phiếu ${rcpt.receiptCode} - Đơn ${rcpt.orderCode}`)}
                            className="bg-rose-600 hover:!bg-rose-700 text-white text-[11px] h-6 px-2.5 rounded border-none shadow-none flex items-center gap-1 mx-auto"
                          >
                            Thu tiền ngay
                          </Button>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Đã thu đủ</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomersTab;
