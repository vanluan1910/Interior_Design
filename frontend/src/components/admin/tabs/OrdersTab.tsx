import React, { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);
import {
  Button,
  Select,
  Drawer,
  Tag,
  Form,
  Row,
  Col,
  Space,
  Input,
  InputNumber,
  DatePicker,
  Popconfirm,
  App,
  Card,
  Divider,
  AutoComplete,
  Dropdown,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  FileExcelOutlined,
  DownloadOutlined,
  PrinterOutlined,
  SaveOutlined,
  CloseOutlined,
  ShoppingOutlined,
  UserOutlined,
  DollarOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import {
  AdminDataTable,
  AdminListToolbar,
  AdminFilterSidebar,
  PosDateFilter,
  checkDateInRange,
  type DateRangeValue,
} from '@/components/admin';
import { exportToExcel } from '@/utils/exportExcel';
import type { OrderRow, AdminCustomer, FeaturedCatalogProduct, AdminBranch } from '@/types/admin';
import { orderApi, normalizeOrderStatus, normalizeOrderRow } from '@/api/orderApi';
import { customerApi } from '@/api/customerApi';
import { productApi } from '@/api/productApi';
import { branchApi } from '@/api/branchApi';
import { VIETNAM_PROVINCES } from '@/data/vietnamAddresses';
import { isMatchBranch } from '@/utils/branchHelper';
import { printOrderInvoice } from '@/utils/printHelper';
import { ADMIN_STORAGE_KEYS, getStoredAdminData, setStoredAdminData } from '@/utils/adminStorage';
import { invalidateApiCache } from '@/api/shared/apiCache';

export interface OrdersTabProps {
  ordersList: OrderRow[];
  setOrdersList: React.Dispatch<React.SetStateAction<OrderRow[]>>;
  selectedGlobalBranch?: string;
  branchesList?: AdminBranch[];
  catalogList?: FeaturedCatalogProduct[];
  customersList?: AdminCustomer[];
  onNavigateToProduct?: (productCodeOrName: string) => void;
  onOpenCreateOrder?: () => void;
  onOpenEditOrder?: (order: OrderRow) => void;
  onSelectOrderDetail?: (order: OrderRow) => void;
}

export const formatWoodTypeName = (wood?: string): string => {
  if (!wood) return 'Gỗ tự nhiên';
  return wood;
};

export function getCleanProductName(productName?: string): string {
  if (!productName) return '';
  return productName.replace(/\s*\(x\d+\)/gi, '').trim();
}

export function getOrderQuantity(order?: Partial<OrderRow> | null): number {
  if (!order) return 1;
  if (order.items && order.items.length > 0) {
    const total = order.items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
    if (total > 0) return total;
  }
  if (typeof order.quantity === 'number' && order.quantity > 0) {
    return order.quantity;
  }
  if (order.productName) {
    const matches = Array.from(order.productName.matchAll(/\(x(\d+)\)/gi));
    if (matches.length > 0) {
      const sum = matches.reduce((acc, m) => acc + (parseInt(m[1], 10) || 1), 0);
      if (sum > 0) return sum;
    }
  }
  return 1;
}

export function removeVietnameseTones(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

export function hasVietnameseTone(str: string): boolean {
  return /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(str);
}

export function matchVietnameseText(query: string, target: string): boolean {
  if (!query || !target) return false;
  const q = query.trim();
  const t = target.trim();
  if (!q) return true;

  if (hasVietnameseTone(q)) {
    return t.toLowerCase().includes(q.toLowerCase());
  }

  return removeVietnameseTones(t).includes(removeVietnameseTones(q));
}

export function OrdersTab({
  ordersList,
  setOrdersList,
  selectedGlobalBranch = 'all',
  branchesList = [],
  catalogList = [],
  customersList = [],
  onNavigateToProduct,
  onOpenCreateOrder,
  onOpenEditOrder,
  onSelectOrderDetail,
}: OrdersTabProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm();

  // Local filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [orderDateRange, setOrderDateRange] = useState<DateRangeValue>(null);
  const [selectedOrderKeys, setSelectedOrderKeys] = useState<React.Key[]>([]);
  const [expandedOrderRowKeys, setExpandedOrderRowKeys] = useState<string[]>([]);
  const [orderPanelTabs, setOrderPanelTabs] = useState<Record<string, 'items' | 'info' | 'financial'>>({});

  // Drawer State (Create / Edit Order)
  const [isOrderDrawerOpen, setIsOrderDrawerOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<OrderRow | null>(null);

  // Real Database Data for Auto-complete (from props or fallback fetch)
  const [dbCustomers, setDbCustomers] = useState<AdminCustomer[]>([]);
  const [dbProducts, setDbProducts] = useState<FeaturedCatalogProduct[]>([]);

  const effectiveCustomers = customersList.length > 0 ? customersList : dbCustomers;
  const effectiveProducts = catalogList.length > 0 ? catalogList : dbProducts;

  // Province and District linkage
  const selectedProvince = Form.useWatch('customerProvince', form);
  const currentDistricts = useMemo(() => {
    if (!selectedProvince) return [];
    const found = VIETNAM_PROVINCES.find((p) => p.name === selectedProvince);
    return found ? found.districts : [];
  }, [selectedProvince]);

  // Distinct real materials extracted directly from the database products
  const availableWoodTypes = useMemo(() => {
    const materials = effectiveProducts
      .map((p) => p.material?.trim())
      .filter((m): m is string => Boolean(m));
    const unique = Array.from(new Set(materials));
    return unique.length > 0 ? unique : ['Gỗ Hương Đá', 'Gỗ Gõ Đỏ', 'Gỗ Mun Hoa', 'Gỗ Cẩm Lai', 'Gỗ Sồi Mỹ'];
  }, [effectiveProducts]);

  // Lazy load customer and product options ONLY when the create/edit order drawer is opened
  const hasFetchedDrawerDataRef = React.useRef(false);
  React.useEffect(() => {
    if (isOrderDrawerOpen && !hasFetchedDrawerDataRef.current) {
      hasFetchedDrawerDataRef.current = true;
      if (customersList.length === 0) {
        customerApi.getCustomers().then((res) => {
          if (Array.isArray(res) && res.length > 0) setDbCustomers(res);
        }).catch(() => {});
      }

      if (catalogList.length === 0) {
        productApi.getProducts().then((res) => {
          if (Array.isArray(res) && res.length > 0) setDbProducts(res);
        }).catch(() => {});
      }
    }
  }, [isOrderDrawerOpen, customersList.length, catalogList.length]);

  // Local branch filter state with sync to selectedGlobalBranch
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
        .catch((e) => console.warn('Could not load branches in OrdersTab:', e));
    }
  }, [branchesList]);

  // Sync if selectedGlobalBranch prop changes
  React.useEffect(() => {
    if (selectedGlobalBranch) {
      setBranchFilter(selectedGlobalBranch);
    }
  }, [selectedGlobalBranch]);


  // Branch-scoped orders
  const branchScopedOrders = useMemo(() => {
    if (!branchFilter || branchFilter === 'all') return ordersList;
    return ordersList.filter((item) =>
      isMatchBranch(item.showroom || item.branch || item.customerAddress, branchFilter)
    );
  }, [ordersList, branchFilter]);

  // Filtered orders calculation
  const filteredOrders = useMemo(() => {
    return branchScopedOrders.filter((item) => {
      const matchSearch =
        !searchQuery ||
        item.orderCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.customerPhone.includes(searchQuery) ||
        item.productName.toLowerCase().includes(searchQuery.toLowerCase());

      const itemStatus = normalizeOrderStatus(item.status);
      const matchStatus = statusFilter === 'all' || itemStatus === statusFilter;
      const matchDate = checkDateInRange(item.orderDate, orderDateRange);

      return matchSearch && matchStatus && matchDate;
    });
  }, [branchScopedOrders, searchQuery, statusFilter, orderDateRange]);

  // Derived filter counts
  const orderFilterCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: branchScopedOrders.length,
      pending: 0,
      processing: 0,
      delivering: 0,
      completed: 0,
      cancelled: 0,
      returned: 0,
      returned_success: 0,
    };
    branchScopedOrders.forEach((order) => {
      const s = normalizeOrderStatus(order.status);
      if (counts[s] !== undefined) {
        counts[s]++;
      }
    });
    return counts;
  }, [branchScopedOrders]);


  // Active valid orders excluding cancelled, returned and returned_success
  const activeBranchOrders = useMemo(() => {
    return branchScopedOrders.filter((o) => {
      const s = normalizeOrderStatus(o.status);
      return s !== 'cancelled' && s !== 'returned' && s !== 'returned_success';
    });
  }, [branchScopedOrders]);

  const activeBranchRevenue = useMemo(() => {
    return activeBranchOrders.reduce((sum, o) => sum + (o.value || 0), 0);
  }, [activeBranchOrders]);

  const activeBranchDeposit = useMemo(() => {
    return activeBranchOrders.reduce((sum, o) => sum + (o.depositAmount || 0), 0);
  }, [activeBranchOrders]);

  const activeBranchReceivable = useMemo(() => {
    return activeBranchOrders.reduce((sum, o) => sum + Math.max(0, (o.value || 0) - (o.depositAmount || 0)), 0);
  }, [activeBranchOrders]);

  const totalOrdersValue = useMemo(() => {
    return filteredOrders
      .filter((o) => {
        const s = normalizeOrderStatus(o.status);
        return s !== 'cancelled' && s !== 'returned' && s !== 'returned_success';
      })
      .reduce((sum, order) => sum + order.value, 0);
  }, [filteredOrders]);

  const totalDepositValue = useMemo(() => {
    return filteredOrders
      .filter((o) => {
        const s = normalizeOrderStatus(o.status);
        return s !== 'cancelled' && s !== 'returned' && s !== 'returned_success';
      })
      .reduce((sum, order) => sum + order.depositAmount, 0);
  }, [filteredOrders]);

  const selectedOrderTotal = useMemo(() => {
    return ordersList
      .filter((o) => selectedOrderKeys.includes(o.id))
      .reduce((sum, o) => sum + o.value, 0);
  }, [ordersList, selectedOrderKeys]);

  // Memoized real pagination config
  const paginationConfig = useMemo(
    () => ({
      pageSize: 10,
      showSizeChanger: true,
      pageSizeOptions: ['10', '20', '50'],
      total: filteredOrders.length,
      showTotal: (total: number, range: [number, number]) => `${range[0]}-${range[1]} trên tổng số ${total} đơn hàng`,
    }),
    [filteredOrders.length]
  );

  // Export & Action handlers
  const handleExportOrdersExcel = () => {
    const exportData = ordersList.map((o) => ({
      'Mã đơn': o.orderCode,
      'Khách hàng': o.customerName,
      'Số điện thoại': o.customerPhone,
      'Địa chỉ': o.customerAddress,
      'Sản phẩm chế tác': getCleanProductName(o.productName),
      'Số lượng': getOrderQuantity(o),
      'Quy cách kỹ thuật': o.productSpec,
      'Loại gỗ': formatWoodTypeName(o.woodType),
      'Ngày đặt': o.orderDate,
      'Hạn bàn giao': o.deadlineDate,
      'Tổng giá trị (VNĐ)': o.value,
      'Đã đặt cọc (VNĐ)': o.depositAmount,
      'Tỷ lệ cọc (%)': `${o.depositPercent}%`,
      'Còn phải thu (VNĐ)': o.value - o.depositAmount,
      'Trạng thái': o.statusLabel,
    }));
    exportToExcel(exportData, 'Danh_sach_don_hang');
    message.success('Đã xuất danh sách đơn hàng ra file Excel thành công!');
  };

  const handleExportSingleOrderDetail = (order: OrderRow) => {
    const exportData = [
      {
        'Mã đơn': order.orderCode,
        'Tên sản phẩm': getCleanProductName(order.productName),
        'Quy cách': order.productSpec,
        'Chủng loại gỗ': formatWoodTypeName(order.woodType),
        'Số lượng': getOrderQuantity(order),
        'Đơn giá (VNĐ)': order.value,
        'Giảm giá': 0,
        'Thành tiền (VNĐ)': order.value,
        'Đã đặt cọc (VNĐ)': order.depositAmount,
        'Còn lại (VNĐ)': order.value - order.depositAmount,
        'Khách hàng': order.customerName,
        'SĐT': order.customerPhone,
        'Địa chỉ giao nhận': order.customerAddress,
        'Hạn bàn giao': order.deadlineDate,
      },
    ];
    exportToExcel(exportData, `Chi_tiet_don_hang_${order.orderCode.replace(/[^a-zA-Z0-9_-]/g, '')}`);
    message.success(`Đã xuất file chi tiết đơn hàng ${order.orderCode} thành công!`);
  };

  const handleDeleteOrder = async (id: string) => {
    try {
      await orderApi.deleteOrder(id);
      invalidateApiCache('orders');
      setOrdersList((prev) => {
        const next = prev.filter((o) => o.id !== id);
        try { setStoredAdminData(ADMIN_STORAGE_KEYS.ORDERS, next); } catch {}
        return next;
      });
      message.success('Đã xóa đơn hàng thành công!');
    } catch (err: any) {
      message.error(err.message || 'Xóa đơn hàng thất bại');
    }
  };

  const handleBulkDeleteOrders = async () => {
    if (selectedOrderKeys.length === 0) return;
    try {
      await Promise.all(selectedOrderKeys.map((k) => orderApi.deleteOrder(String(k))));
      invalidateApiCache('orders');
      setOrdersList((prev) => {
        const next = prev.filter((o) => !selectedOrderKeys.includes(o.id));
        try { setStoredAdminData(ADMIN_STORAGE_KEYS.ORDERS, next); } catch {}
        return next;
      });
      setSelectedOrderKeys([]);
      message.success(`Đã xóa thành công ${selectedOrderKeys.length} đơn hàng đã chọn!`);
    } catch (err: any) {
      message.error(err.message || 'Xóa đơn hàng thất bại');
    }
  };

  // Helper to synchronize order status changes across customer local storages & broadcast
  const syncOrderToCustomerStorages = (ordersToSync: { id: string; orderCode?: string; status: string; statusLabel: string }[]) => {
    if (typeof window === 'undefined') return;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('d2_orders_') || key.startsWith('interior_admin_orders'))) {
          try {
            const raw = localStorage.getItem(key);
            if (!raw) continue;
            const customerOrders = JSON.parse(raw);
            if (Array.isArray(customerOrders)) {
              let modified = false;
              const updated = customerOrders.map((co: any) => {
                const coId = String(co.id || '');
                const coCode = String(co.orderCode || '').toUpperCase();
                const match = ordersToSync.find(
                  (item) => item.id === coId || (item.orderCode && item.orderCode.toUpperCase() === coCode)
                );
                if (match) {
                  modified = true;
                  return { ...co, status: match.status, statusLabel: match.statusLabel };
                }
                return co;
              });
              if (modified) {
                localStorage.setItem(key, JSON.stringify(updated));
              }
            }
          } catch {}
        }
      }
      window.dispatchEvent(new CustomEvent('d2_orders_updated', { detail: ordersToSync }));
    } catch (e) {
      console.warn('Could not sync orders to customer storage:', e);
    }
  };

  React.useEffect(() => {
    const handleSyncFromOutside = () => {
      const cached = getStoredAdminData<OrderRow[]>(ADMIN_STORAGE_KEYS.ORDERS, []);
      if (Array.isArray(cached) && cached.length > 0) {
        setOrdersList(cached.map(normalizeOrderRow));
      }
    };
    window.addEventListener('d2_orders_updated', handleSyncFromOutside);
    window.addEventListener('storage', handleSyncFromOutside);
    return () => {
      window.removeEventListener('d2_orders_updated', handleSyncFromOutside);
      window.removeEventListener('storage', handleSyncFromOutside);
    };
  }, []);

  const handleBulkUpdateStatus = async (status: OrderRow['status']) => {
    if (selectedOrderKeys.length === 0) return;
    const normStatus = normalizeOrderStatus(status);
    const labelMap: Record<string, string> = {
      pending: 'Chờ duyệt',
      processing: 'Đang gia công',
      delivering: 'Đang giao hàng',
      completed: 'Hoàn tất bàn giao',
      cancelled: 'Đã hủy',
      returned: 'Khách trả hàng',
      returned_success: 'Hoàn hàng thành công',
    };
    const newLabel = labelMap[normStatus] || normStatus;

    setOrdersList((prev) => {
      const next = prev.map((o) =>
        selectedOrderKeys.includes(o.id)
          ? { ...o, status: normStatus, statusLabel: newLabel }
          : o
      );
      try { setStoredAdminData(ADMIN_STORAGE_KEYS.ORDERS, next); } catch {}
      return next;
    });

    const syncItems = selectedOrderKeys.map((k) => {
      const ord = ordersList.find((o) => o.id === k);
      return { id: String(k), orderCode: ord?.orderCode, status: normStatus, statusLabel: newLabel };
    });
    syncOrderToCustomerStorages(syncItems);

    try {
      await orderApi.bulkUpdateStatus(selectedOrderKeys.map(String), normStatus);
      invalidateApiCache('orders');
      setSelectedOrderKeys([]);
      message.success(`Đã cập nhật trạng thái cho ${selectedOrderKeys.length} đơn hàng thành "${newLabel}"!`);
    } catch (err: any) {
      console.warn('Bulk update status on API error:', err);
      invalidateApiCache('orders');
      setSelectedOrderKeys([]);
      message.success(`Đã cập nhật trạng thái cho ${selectedOrderKeys.length} đơn hàng!`);
    }
  };

  const handleUpdateSingleOrderStatus = async (orderId: string, rawStatus: OrderRow['status']) => {
    const newStatus = normalizeOrderStatus(rawStatus);
    const labelMap: Record<string, string> = {
      pending: 'Chờ duyệt',
      processing: 'Đang gia công',
      delivering: 'Đang giao hàng',
      completed: 'Hoàn tất bàn giao',
      cancelled: 'Đã hủy',
      returned: 'Khách trả hàng',
      returned_success: 'Hoàn hàng thành công',
    };
    const newLabel = labelMap[newStatus] || newStatus;

    // 1. Optimistic UI update & persist to localStorage so reload preserves new status
    setOrdersList((prev) => {
      const next = prev.map((o) => (o.id === orderId ? { ...o, status: newStatus, statusLabel: newLabel } : o));
      try { setStoredAdminData(ADMIN_STORAGE_KEYS.ORDERS, next); } catch {}
      return next;
    });

    const targetOrder = ordersList.find((o) => o.id === orderId);
    syncOrderToCustomerStorages([
      { id: orderId, orderCode: targetOrder?.orderCode, status: newStatus, statusLabel: newLabel }
    ]);

    // 2. Call backend API to persist to real database
    try {
      await orderApi.updateOrderStatus(orderId, newStatus);
      invalidateApiCache('orders');
      message.success(`Đã cập nhật trạng thái đơn thành "${newLabel}"!`);
    } catch (err: any) {
      try {
        await orderApi.updateOrder(orderId, { status: newStatus, statusLabel: newLabel });
        invalidateApiCache('orders');
        message.success(`Đã cập nhật trạng thái đơn thành "${newLabel}"!`);
      } catch (err2: any) {
        console.warn('Could not update status on API, updated locally in storage:', err2);
        message.success(`Đã cập nhật trạng thái: "${newLabel}"!`);
      }
    }
  };

  const handlePrintOrderReceipt = (order: OrderRow) => {
    printOrderInvoice(order);
  };

  const handleOpenCreateOrder = () => {
    if (onOpenCreateOrder) {
      onOpenCreateOrder();
      return;
    }
    setEditingOrder(null);
    setIsOrderDrawerOpen(true);

    setTimeout(() => {
      form.resetFields();
      form.setFieldsValue({
        orderCode: `DH-${Date.now().toString().slice(-4)}`,
        woodType: '',
        orderType: 'retail',
        status: 'pending',
        customerProvince: undefined,
        customerDistrict: undefined,
        customerAddress: '',
        value: 0,
        depositAmount: 0,
        deadlineToPicker: dayjs().add(7, 'day'),
        showroom: selectedGlobalBranch !== 'all' ? selectedGlobalBranch : '',
      });
    }, 0);
  };

  const handleOpenEditOrder = (order: OrderRow) => {
    if (onOpenEditOrder) {
      onOpenEditOrder(order);
      return;
    }
    setEditingOrder(order);
    setIsOrderDrawerOpen(true);

    let parsedDeadline = undefined;
    if (order.deadlineDate) {
      const trimmed = order.deadlineDate.trim();
      if (trimmed.includes('/')) {
        parsedDeadline = dayjs(trimmed, 'DD/MM/YYYY');
      } else {
        parsedDeadline = dayjs(trimmed);
      }
    }

    setTimeout(() => {
      form.resetFields();
      form.setFieldsValue({
        orderCode: order.orderCode,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerProvince: order.customerProvince,
        customerDistrict: order.customerDistrict,
        customerAddress: order.customerAddress,
        productName: order.productName,
        productSpec: order.productSpec,
        woodType: order.woodType,
        orderType: order.orderType || 'retail',
        status: normalizeOrderStatus(order.status),
        value: order.value,
        depositAmount: order.depositAmount,
        deadlineToPicker: parsedDeadline && parsedDeadline.isValid() ? parsedDeadline : dayjs().add(7, 'day'),
        showroom: order.showroom || '',
      });
    }, 0);
  };

  const handleSaveOrder = async () => {
    try {
      const values = await form.validateFields();
      const statusLabels: Record<string, string> = {
        pending: 'Chờ duyệt',
        processing: 'Đang gia công',
        delivering: 'Đang giao hàng',
        completed: 'Hoàn tất bàn giao',
        cancelled: 'Đã hủy',
        returned: 'Khách trả hàng',
        returned_success: 'Hoàn hàng thành công',
      };
      const normStatus = normalizeOrderStatus(values.status);

      const depositPercent = values.value > 0 ? Math.round(((values.depositAmount || 0) / values.value) * 100) : 0;
      const fullShippingAddress = [
        values.customerAddress,
        values.customerDistrict,
        values.customerProvince,
      ].filter(Boolean).join(', ');

      const formattedDeadline = values.deadlineToPicker
        ? dayjs(values.deadlineToPicker).format('DD/MM/YYYY')
        : dayjs().add(7, 'day').format('DD/MM/YYYY');

      if (editingOrder) {
        const updated = await orderApi.updateOrder(editingOrder.id, {
          ...values,
          status: normStatus,
          deadlineDate: formattedDeadline,
          city: values.customerProvince,
          district: values.customerDistrict,
          shippingAddress: fullShippingAddress || values.customerAddress,
          orderType: values.orderType || editingOrder.orderType || 'retail',
          depositPercent,
        });
        invalidateApiCache('orders');
        setOrdersList((prev) => {
          const next = prev.map((item) =>
            item.id === editingOrder.id
              ? {
                  ...item,
                  ...updated,
                  status: normStatus,
                  deadlineDate: formattedDeadline,
                  customerProvince: values.customerProvince,
                  customerDistrict: values.customerDistrict,
                  statusLabel: statusLabels[normStatus] || item.statusLabel,
                  depositPercent,
                }
              : item
          );
          try { setStoredAdminData(ADMIN_STORAGE_KEYS.ORDERS, next); } catch {}
          return next;
        });
        message.success(`Đã cập nhật đơn hàng ${values.orderCode || editingOrder.orderCode} thành công!`);
      } else {
        const created = await orderApi.createOrder({
          orderCode: values.orderCode,
          customerName: values.customerName,
          customerPhone: values.customerPhone,
          customerAddress: values.customerAddress,
          customerProvince: values.customerProvince,
          customerDistrict: values.customerDistrict,
          city: values.customerProvince,
          district: values.customerDistrict,
          shippingAddress: fullShippingAddress || values.customerAddress,
          productName: values.productName,
          productSpec: values.productSpec || 'Theo thiết kế kỹ thuật',
          woodType: values.woodType || 'Gỗ tự nhiên cao cấp',
          value: values.value || 0,
          depositAmount: values.depositAmount || 0,
          depositPercent,
          status: normStatus,
          deadlineDate: formattedDeadline,
          orderType: values.orderType || 'retail',
          spaceType: 'living',
          showroom: values.showroom || (selectedGlobalBranch !== 'all' ? selectedGlobalBranch : ''),
          branch: selectedGlobalBranch !== 'all' ? selectedGlobalBranch : undefined,
        });
        invalidateApiCache('orders');
        setOrdersList((prev) => {
          const next = [created, ...prev];
          try { setStoredAdminData(ADMIN_STORAGE_KEYS.ORDERS, next); } catch {}
          return next;
        });
        message.success(`Đã tạo đơn hàng mới ${created.orderCode} thành công!`);
      }
      setIsOrderDrawerOpen(false);
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err.message || 'Lưu đơn hàng thất bại');
    }
  };

  return (
          <div className="space-y-4 w-full min-w-0 max-w-full flex-1 flex flex-col h-full">
            {/* Top Toolbar: Shared AdminListToolbar Component */}
            <AdminListToolbar
              searchPlaceholder="Theo mã đơn, tên khách, số điện thoại, sản phẩm nội thất..."
              searchValue={searchQuery}
              onSearchChange={(val) => setSearchQuery(val)}
              onRefresh={async () => {
                setSearchQuery('');
                setStatusFilter('all');
                setOrderDateRange(null);
                try {
                  invalidateApiCache('orders');
                  const fresh = await orderApi.getOrders();
                  setOrdersList(fresh);
                  try { setStoredAdminData(ADMIN_STORAGE_KEYS.ORDERS, fresh); } catch {}
                  message.success('Đã làm mới danh sách đơn hàng từ máy chủ!');
                } catch {
                  message.info('Đã làm mới bộ lọc danh sách đơn hàng!');
                }
              }}
              onExport={handleExportOrdersExcel}
              createButtonText="Tạo đơn hàng mới"
              onCreate={handleOpenCreateOrder}
            />

            {/* BATCH SELECTION BANNER (Hiển thị khi tick chọn các đơn hàng) */}
            {selectedOrderKeys.length > 0 && (
              <div className="bg-[#fbf2ee] border border-[#d8c3af] px-4 py-2.5 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
                <div className="flex items-center gap-2 text-[#5d371f]">
                  <span className="font-bold text-sm">Đã chọn {selectedOrderKeys.length} đơn hàng</span>
                  <span className="text-slate-400">|</span>
                  <Button
                    type="link"
                    size="small"
                    onClick={() => setSelectedOrderKeys([])}
                    className="text-[#784e34] p-0 font-medium hover:underline text-xs"
                  >
                    Bỏ chọn tất cả
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Dropdown
                    menu={{
                      items: [
                        { key: 'pending', label: 'Chờ duyệt' },
                        { key: 'processing', label: 'Đang gia công' },
                        { key: 'delivering', label: 'Đang giao hàng' },
                        { key: 'completed', label: 'Hoàn tất bàn giao' },
                        { key: 'cancelled', label: 'Đã hủy' },
                        { key: 'returned', label: 'Khách trả hàng' },
                        { key: 'returned_success', label: 'Hoàn hàng thành công' },
                      ],
                      onClick: ({ key }) => handleBulkUpdateStatus(key as any),
                    }}
                  >
                    <Button size="small" className="text-xs bg-white text-slate-700 border-slate-300 hover:bg-slate-50 font-medium">
                      Đổi trạng thái ({selectedOrderKeys.length}) ▾
                    </Button>
                  </Dropdown>
                  <Popconfirm
                    title={`Bạn có chắc chắn muốn xóa ${selectedOrderKeys.length} đơn hàng đã chọn?`}
                    onConfirm={handleBulkDeleteOrders}
                    okText="Xóa"
                    cancelText="Hủy"
                    okButtonProps={{ danger: true }}
                  >
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      className="text-xs font-medium"
                    >
                      Xóa đã chọn ({selectedOrderKeys.length})
                    </Button>
                  </Popconfirm>
                </div>
              </div>
            )}

            {/* STANDARDIZED 2-COLUMN LAYOUT: FILTER SIDEBAR + TABLE */}
            <div className="flex flex-col lg:flex-row gap-4 items-start w-full min-w-0 max-w-full flex-1">
              {/* Left Sidebar Filter */}
              <AdminFilterSidebar
                title="Bộ lọc đơn hàng"
                hasActiveFilters={Boolean(searchQuery || statusFilter !== 'all' || branchFilter !== 'all' || orderDateRange)}
                onResetFilters={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setBranchFilter(selectedGlobalBranch || '');
                  setOrderDateRange(null);
                }}
              >

                {/* Filter 1: Thời gian tạo đơn */}
                <div>
                  <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                    Thời gian đặt hàng
                  </div>
                  <PosDateFilter
                    value={orderDateRange}
                    onChange={(range) => setOrderDateRange(range)}
                    className="w-full flex-col !items-stretch gap-2 [&_.ant-picker]:!w-full [&_.ant-select]:!w-full"
                  />
                </div>

                {/* Filter 2: Trạng thái đơn hàng */}
                <div>
                  <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                    Trạng thái đơn hàng
                  </div>
                  <div className="space-y-1">
                    {[
                      { value: 'all', label: 'Tất cả đơn hàng', count: orderFilterCounts.all },
                      { value: 'pending', label: '⏳ Chờ duyệt', count: orderFilterCounts.pending },
                      { value: 'processing', label: '⚙️ Đang gia công', count: orderFilterCounts.processing },
                      { value: 'delivering', label: '🚚 Đang giao hàng', count: orderFilterCounts.delivering },
                      { value: 'completed', label: '✅ Hoàn tất bàn giao', count: orderFilterCounts.completed },
                      { value: 'cancelled', label: '❌ Đã hủy', count: orderFilterCounts.cancelled },
                      { value: 'returned', label: '↩️ Khách trả hàng', count: orderFilterCounts.returned },
                      { value: 'returned_success', label: '📦 Hoàn hàng thành công', count: orderFilterCounts.returned_success },
                    ].map((opt) => {
                      const isSelected = statusFilter === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setStatusFilter(opt.value)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer border ${
                            isSelected
                              ? 'bg-[#784e34]/10 text-[#784e34] font-semibold border-[#784e34]/20'
                              : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50'
                          }`}
                        >
                          <span>{opt.label}</span>
                          <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                            {opt.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Card Thống kê tài chính đơn hàng (Tự động trừ hàng hoàn & hàng hủy) */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-slate-600">
                    <span>Tổng đơn hàng:</span>
                    <span className="font-mono font-medium text-slate-900">{branchScopedOrders.length} đơn</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Doanh thu hiệu lực:</span>
                    <span className="font-mono font-medium text-[#784e34]">
                      {activeBranchRevenue.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Đã thu cọc:</span>
                    <span className="font-mono font-medium text-emerald-700">
                      {activeBranchDeposit.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Còn phải thu:</span>
                    <span className="font-mono font-medium text-rose-600">
                      {activeBranchReceivable.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                  {orderFilterCounts.returned > 0 && (
                    <div className="flex justify-between text-slate-500 pt-1 border-t border-slate-200/60">
                      <span>Đơn khách hoàn trả:</span>
                      <span className="font-mono text-indigo-700 font-semibold">{orderFilterCounts.returned} đơn</span>
                    </div>
                  )}
                  {orderFilterCounts.returned_success > 0 && (
                    <div className="flex justify-between text-slate-500 pt-1 border-t border-slate-200/60">
                      <span>Đơn hoàn thành công:</span>
                      <span className="font-mono text-teal-700 font-semibold">{orderFilterCounts.returned_success} đơn</span>
                    </div>
                  )}
                </div>
              </AdminFilterSidebar>

              {/* Right Table Container: Shared AdminDataTable Component */}
              <div className="flex-1 min-w-0 w-full max-w-full overflow-hidden">
                <AdminDataTable<OrderRow>
                  titleText="Danh Sách Đơn Hàng Bán Lẻ &amp; Hợp Đồng Dự Án"
                  titleIcon={<span className="w-2.5 h-2.5 rounded-full bg-[#784e34] inline-block" />}
                  countTag={`${filteredOrders.length} đơn hàng`}
                  totalCount={filteredOrders.length}
                  countUnit="đơn hàng"
                  dataSource={filteredOrders}
                  rowKey="id"
                  rowSelection={{
                    selectedRowKeys: selectedOrderKeys,
                    onChange: (keys) => setSelectedOrderKeys(keys),
                  }}
                  pagination={paginationConfig}
                  onRow={(record) => {
                    const isExp = expandedOrderRowKeys.includes(record.id);
                    return {
                      onClick: (e: React.MouseEvent<HTMLElement>) => {
                        const target = e.target as HTMLElement;
                        if (
                          target.closest('.ant-select') ||
                          target.closest('.ant-table-selection-column') ||
                          target.closest('.ant-checkbox-wrapper') ||
                          target.closest('button') ||
                          target.closest('.ant-dropdown-trigger') ||
                          target.closest('.ant-popover') ||
                          target.closest('.ant-popconfirm')
                        ) {
                          return;
                        }
                        setExpandedOrderRowKeys(isExp ? [] : [record.id]);
                        if (!isExp && !orderPanelTabs[record.id]) {
                          setOrderPanelTabs((prev) => ({ ...prev, [record.id]: 'items' }));
                        }
                      },
                      className: `cursor-pointer transition-colors ${
                        isExp
                          ? 'admin-order-row-active !bg-[#fbf5f0] [&>td]:!bg-[#fbf5f0]'
                          : 'hover:!bg-[#faf6f1] [&>td]:hover:!bg-[#faf6f1]'
                      }`,
                    };
                  }}
                  expandable={{
                    expandedRowKeys: expandedOrderRowKeys,
                    showExpandColumn: false,
                    onExpand: (expanded, record) => {
                      setExpandedOrderRowKeys(expanded ? [record.id] : []);
                      if (expanded && !orderPanelTabs[record.id]) {
                        setOrderPanelTabs((prev) => ({ ...prev, [record.id]: 'items' }));
                      }
                    },
                    expandedRowRender: (order) => {
                      const currentTab = orderPanelTabs[order.id] || 'items';
                      const setTab = (t: 'items' | 'info' | 'financial') => {
                        setOrderPanelTabs((prev) => ({ ...prev, [order.id]: t }));
                      };

                      return (
                        <div
                          className="bg-white p-4 border-t border-b border-slate-200 shadow-inner space-y-4 text-left text-xs w-full max-w-full overflow-hidden"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Tab Navigation: Pill active style without icons + Export Button */}
                          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
                            <div className="flex items-center gap-2">
                              {[
                                { key: 'items', label: 'Hàng hóa (1)' },
                                { key: 'info', label: 'Thông tin' },
                                { key: 'financial', label: 'Lịch sử thanh toán' },
                              ].map((tab) => {
                                const isActive = currentTab === tab.key;
                                return (
                                  <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setTab(tab.key as any)}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${isActive
                                        ? 'bg-amber-50 text-[#784e34] border-[#784e34]/40 shadow-xs'
                                        : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-100 hover:text-slate-900'
                                      }`}
                                  >
                                    {tab.label}
                                  </button>
                                );
                              })}
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                icon={<PrinterOutlined />}
                                onClick={() => printOrderInvoice(order)}
                                className="h-8 px-3 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-[#784e34] hover:border-[#784e34] shadow-xs flex items-center gap-1.5"
                              >
                                In hóa đơn / Phiếu in
                              </Button>
                              <Button
                                icon={<DownloadOutlined />}
                                onClick={() => handleExportSingleOrderDetail(order)}
                                className="h-8 px-3 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-[#784e34] hover:border-[#784e34] shadow-xs flex items-center gap-1.5"
                              >
                                Xuất file
                              </Button>
                            </div>
                          </div>

                          {/* Tab 1: Hàng hóa */}
                          {currentTab === 'items' && (
                            <div className="space-y-4">
                              {/* Sub-table Hàng hóa */}
                              <div className="overflow-x-auto border border-slate-200">
                                <table className="w-full text-left border-collapse text-xs">
                                  <thead>
                                    <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                                      <th className="py-2 px-3 font-medium whitespace-nowrap">Mã hàng</th>
                                      <th className="py-2 px-3 font-medium">Tên hàng / Quy cách chế tác</th>
                                      <th className="py-2 px-3 font-medium whitespace-nowrap">Loại gỗ</th>
                                      <th className="py-2 px-3 font-medium whitespace-nowrap">Hạn bàn giao</th>
                                      <th className="py-2 px-3 font-medium text-center whitespace-nowrap">Số lượng</th>
                                      <th className="py-2 px-3 font-medium text-right whitespace-nowrap">Thành tiền</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {order.items && order.items.length > 0 ? (
                                      order.items.map((it, idx) => (
                                        <tr key={it.id || idx} className="hover:bg-slate-50/50">
                                          <td className="py-2.5 px-3 font-mono font-medium text-[#784e34] whitespace-nowrap">{it.productSku || order.orderCode}</td>
                                          <td className="py-2.5 px-3">
                                            <div
                                              className="font-medium text-[#784e34] hover:underline cursor-pointer inline-flex items-center gap-1 group"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (onNavigateToProduct) onNavigateToProduct(it.productName);
                                              }}
                                              title={`Xem chi tiết sản phẩm "${it.productName}" trong danh mục`}
                                            >
                                              <span>{it.productName}</span>
                                              <span className="text-[10px] text-slate-400 group-hover:text-[#784e34]">↗</span>
                                            </div>
                                            <div className="text-[11px] text-slate-500 mt-0.5">{it.dimensions || it.material || order.productSpec}</div>
                                          </td>
                                          <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">{it.material || formatWoodTypeName(order.woodType)}</td>
                                          <td className="py-2.5 px-3 font-mono text-slate-700 whitespace-nowrap">{order.deadlineDate}</td>
                                          <td className="py-2.5 px-3 text-center font-bold text-slate-900 whitespace-nowrap">{it.quantity || 1}</td>
                                          <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-900 whitespace-nowrap">{(it.totalPrice || (it.unitPrice * (it.quantity || 1)) || order.value).toLocaleString('vi-VN')} đ</td>
                                        </tr>
                                      ))
                                    ) : (
                                      <tr className="hover:bg-slate-50/50">
                                        <td className="py-2.5 px-3 font-mono font-medium text-[#784e34] whitespace-nowrap">{order.orderCode}</td>
                                        <td className="py-2.5 px-3">
                                          <div
                                            className="font-medium text-[#784e34] hover:underline cursor-pointer inline-flex items-center gap-1 group"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (onNavigateToProduct) onNavigateToProduct(getCleanProductName(order.productName));
                                            }}
                                            title={`Xem chi tiết sản phẩm "${getCleanProductName(order.productName)}" trong danh mục`}
                                          >
                                            <span>{getCleanProductName(order.productName)}</span>
                                            <span className="text-[10px] text-slate-400 group-hover:text-[#784e34]">↗</span>
                                          </div>
                                          <div className="text-[11px] text-slate-500 mt-0.5">{order.productSpec}</div>
                                        </td>
                                        <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">{formatWoodTypeName(order.woodType)}</td>
                                        <td className="py-2.5 px-3 font-mono text-slate-700 whitespace-nowrap">{order.deadlineDate}</td>
                                        <td className="py-2.5 px-3 text-center font-bold text-slate-900 whitespace-nowrap">{getOrderQuantity(order)}</td>
                                        <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-900 whitespace-nowrap">{order.value.toLocaleString('vi-VN')} đ</td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>

                              {/* Bottom Section: Ghi chú & Bảng tổng kết số tiền */}
                              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-1">
                                {/* Cột Trái: Ghi chú */}
                                <div className="md:col-span-7 space-y-1.5">
                                  <label className="font-medium text-slate-700 block text-xs">Ghi chú &amp; Địa chỉ giao hàng</label>
                                  <div className="p-3 bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                                    <div><span className="text-slate-400">Khách hàng:</span> <span className="font-medium text-slate-900">{order.customerName}</span> • <span className="text-slate-400">SĐT:</span> <span className="font-mono">{order.customerPhone}</span></div>
                                    <div><span className="text-slate-400">Địa chỉ giao nhận:</span> <span>{order.customerAddress}</span></div>
                                    <div><span className="text-slate-400">Yêu cầu kỹ thuật:</span> <span>{order.productSpec}</span></div>
                                    <div><span className="text-slate-400">Ngày đặt hàng:</span> <span className="font-mono">{order.orderDate}</span> • <span className="text-slate-400">Hạn bàn giao:</span> <span className="font-mono text-rose-600">{order.deadlineDate}</span></div>
                                  </div>

                                  {(order.returnReason || (order as any).returnImages?.length || order.status === 'returned' || order.status === 'returned_success') && (
                                    <div className="p-3 bg-rose-50/70 border border-rose-200 text-xs text-slate-800 space-y-2 mt-2">
                                      <div className="flex items-center gap-2 text-rose-800 font-semibold text-xs border-b border-rose-200/80 pb-1.5">
                                        <span className="material-symbols-outlined text-[16px]">assignment_return</span>
                                        <span>Yêu cầu đổi trả / hoàn tiền từ khách hàng</span>
                                        {order.status === 'returned_success' ? (
                                          <Tag color="cyan" className="m-0 text-[10px]">Hoàn hàng thành công</Tag>
                                        ) : (
                                          <Tag color="red" className="m-0 text-[10px]">Khách trả hàng</Tag>
                                        )}
                                      </div>
                                      {order.returnReason && (
                                        <div><span className="text-slate-500">Lý do hoàn trả:</span> <strong className="text-slate-800">{order.returnReason}</strong></div>
                                      )}
                                      {order.returnDesiredResolution && (
                                        <div><span className="text-slate-500">Phương án mong muốn:</span> <span className="font-medium text-slate-800">{order.returnDesiredResolution}</span></div>
                                      )}
                                      {order.returnNote && (
                                        <div><span className="text-slate-500">Ghi chú của khách:</span> <span className="text-slate-700">{order.returnNote}</span></div>
                                      )}
                                      {(order as any).returnImages && (order as any).returnImages.length > 0 && (
                                        <div className="pt-1">
                                          <div className="text-[11px] font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px] text-rose-700">photo_library</span>
                                            <span>Ảnh sản phẩm thực tế do khách hàng tải lên ({(order as any).returnImages.length} ảnh):</span>
                                          </div>
                                          <div className="flex flex-wrap gap-2">
                                            {(order as any).returnImages.map((img: string, idx: number) => (
                                              <a
                                                key={idx}
                                                href={img}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block relative w-16 h-16 rounded border border-rose-200 overflow-hidden group shadow-2xs hover:scale-105 transition-transform"
                                                title="Bấm để xem ảnh kích thước đầy đủ"
                                              >
                                                <img src={img} alt={`Minh chứng ${idx + 1}`} className="w-full h-full object-cover" />
                                                <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] text-center font-mono py-0.5">
                                                  #{idx + 1}
                                                </span>
                                              </a>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Cột Phải: Bảng tóm tắt tài chính */}
                                <div className="md:col-span-5 p-3 bg-slate-50 border border-slate-200 space-y-1.5 text-xs flex flex-col justify-between">
                                  <div className="space-y-1.5">
                                    <div className="flex justify-between text-slate-600 py-0.5">
                                      <span>Tổng tiền hàng ({getOrderQuantity(order)} món)</span>
                                      <span className="font-mono text-slate-900 font-medium">{order.value.toLocaleString('vi-VN')} đ</span>
                                    </div>
                                    <div className="flex justify-between text-emerald-700 py-0.5">
                                      <span>Tiền đã đặt cọc ({order.depositPercent}%)</span>
                                      <span className="font-mono font-medium text-emerald-700">{order.depositAmount.toLocaleString('vi-VN')} đ</span>
                                    </div>
                                    <div className="flex justify-between text-rose-600 py-0.5">
                                      <span>Còn phải thu</span>
                                      <span className="font-mono font-medium text-rose-600">{(order.value - order.depositAmount).toLocaleString('vi-VN')} đ</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Tab 2: Thông tin chi tiết */}
                          {currentTab === 'info' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-4 border border-slate-200 text-xs">
                              <div>
                                <span className="text-slate-400 block mb-0.5">Khách hàng:</span>
                                <span className="font-medium text-slate-900 text-sm">{order.customerName}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block mb-0.5">Số điện thoại:</span>
                                <span className="font-mono font-medium text-slate-900 text-sm">{order.customerPhone}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block mb-0.5">Ngày đặt hàng:</span>
                                <span className="font-mono text-slate-700">{order.orderDate}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block mb-0.5">Hạn bàn giao:</span>
                                <span className="font-mono font-medium text-rose-600">{order.deadlineDate}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block mb-0.5">Loại gỗ chế tác:</span>
                                <span className="font-medium text-[#784e34]">{formatWoodTypeName(order.woodType)}</span>
                              </div>
                              <div className="lg:col-span-3">
                                <span className="text-slate-400 block mb-0.5">Địa chỉ giao hàng:</span>
                                <span className="font-normal text-slate-800">{order.customerAddress}</span>
                              </div>
                              <div className="lg:col-span-4 pt-2 border-t border-slate-100">
                                <span className="text-slate-400 block mb-0.5">Quy cách kỹ thuật may đo:</span>
                                <span className="font-normal text-slate-800">{order.productSpec}</span>
                              </div>
                            </div>
                          )}

                          {/* Tab 3: Lịch sử thanh toán */}
                          {currentTab === 'financial' && (
                            <div className="space-y-4">
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
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {order.depositAmount > 0 ? (
                                      <>
                                        <tr className="hover:bg-slate-50/50">
                                          <td className="py-2.5 px-3">
                                            <div className="font-mono font-medium text-[#784e34]">PT-{order.orderCode}-01</div>
                                            <div className="text-[11px] text-slate-500">{order.orderDate} 09:30</div>
                                          </td>
                                          <td className="py-2.5 px-3 text-slate-700">Chuyển khoản VietQR / Ngân hàng</td>
                                          <td className="py-2.5 px-3">
                                            <div className="text-slate-900 font-medium">Đặt cọc sản xuất ({order.depositPercent}%)</div>
                                            <div className="text-[11px] text-slate-500">Người lập: Kế toán bán hàng</div>
                                          </td>
                                          <td className="py-2.5 px-3 text-center">
                                            <span className="inline-block px-2 py-0.5 text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                              Đã thu tiền
                                            </span>
                                          </td>
                                          <td className="py-2.5 px-3 text-right font-mono font-medium text-emerald-700 whitespace-nowrap">
                                            {order.depositAmount.toLocaleString('vi-VN')} đ
                                          </td>
                                        </tr>
                                        {order.value - order.depositAmount > 0 && (
                                          <tr className="hover:bg-slate-50/50">
                                            <td className="py-2.5 px-3">
                                              <div className="font-mono text-slate-400">PT-{order.orderCode}-02</div>
                                              <div className="text-[11px] text-slate-500">{order.deadlineDate} (Dự kiến)</div>
                                            </td>
                                            <td className="py-2.5 px-3 text-slate-500">Tiền mặt / Chuyển khoản</td>
                                            <td className="py-2.5 px-3">
                                              <div className="text-slate-700">Tất toán đợt cuối khi nghiệm thu &amp; bàn giao</div>
                                              <div className="text-[11px] text-slate-500">Người lập: NV Lắp đặt &amp; Giao hàng</div>
                                            </td>
                                            <td className="py-2.5 px-3 text-center">
                                              <span className="inline-block px-2 py-0.5 text-[11px] font-medium bg-amber-50 text-[#784e34] border border-amber-200">
                                                Chờ thu khi giao
                                              </span>
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-mono font-medium text-rose-600 whitespace-nowrap">
                                              {(order.value - order.depositAmount).toLocaleString('vi-VN')} đ
                                            </td>
                                          </tr>
                                        )}
                                      </>
                                    ) : (
                                      <tr className="hover:bg-slate-50/50">
                                        <td className="py-2.5 px-3">
                                          <div className="font-mono text-[#784e34]">COD-{order.orderCode}</div>
                                          <div className="text-[11px] text-slate-500">{order.orderDate}</div>
                                        </td>
                                        <td className="py-2.5 px-3 text-slate-700">Thanh toán khi nhận hàng (COD)</td>
                                        <td className="py-2.5 px-3">
                                          <div className="text-slate-900 font-medium">Thu toàn bộ 100% khi giao hàng</div>
                                          <div className="text-[11px] text-slate-500">Người lập: NV Lắp đặt &amp; Giao hàng</div>
                                        </td>
                                        <td className="py-2.5 px-3 text-center">
                                          <span className="inline-block px-2 py-0.5 text-[11px] font-medium bg-amber-50 text-[#784e34] border border-amber-200">
                                            Chờ thu khi giao
                                          </span>
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-mono font-medium text-rose-600 whitespace-nowrap">
                                          {order.value.toLocaleString('vi-VN')} đ
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>

                              {/* Bottom Section: Thông tin tài khoản & Tổng kết số tiền */}
                              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-1">
                                {/* Cột Trái: Thông tin tài khoản nhận tiền & Điều khoản */}
                                <div className="md:col-span-7 space-y-1.5">
                                  <label className="font-medium text-slate-700 block text-xs">Thông tin &amp; Điều khoản thanh toán</label>
                                  <div className="p-3 bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                                    <div><span className="text-slate-400">Phương thức thanh toán:</span> <span className="font-medium text-slate-900">{order.depositAmount === 0 ? 'Thanh toán khi nhận hàng & Nghiệm thu (COD)' : 'Chuyển khoản VietQR / MBBank'}</span></div>
                                    <div><span className="text-slate-400">Điều khoản cọc:</span> <span>{order.depositAmount === 0 ? 'Không áp dụng cọc trước. Khách hàng thanh toán khi nghiệm thu bàn giao.' : `Đặt cọc trước ${order.depositPercent}% tổng giá trị để tiến hành sản xuất hoàn thiện.`}</span></div>
                                    <div><span className="text-slate-400">Quy định thanh toán đợt cuối:</span> <span>{order.depositAmount === 0 ? 'Thu 100% giá trị đơn hàng sau khi nghiệm thu lắp đặt tại công trình.' : 'Thanh toán 100% số tiền còn lại sau khi nghiệm thu lắp đặt tại công trình.'}</span></div>
                                    <div><span className="text-slate-400">Xuất hóa đơn GTGT:</span> <span>Đã ghi nhận thông tin xuất hóa đơn điện tử theo hợp đồng.</span></div>
                                  </div>
                                </div>

                                {/* Cột Phải: Bảng tóm tắt tài chính */}
                                <div className="md:col-span-5 p-3 bg-slate-50 border border-slate-200 space-y-1.5 text-xs flex flex-col justify-between">
                                  <div className="space-y-1.5">
                                    <div className="flex justify-between text-slate-600 py-0.5">
                                      <span>Tổng giá trị đơn hàng</span>
                                      <span className="font-mono font-medium text-slate-900">{order.value.toLocaleString('vi-VN')} đ</span>
                                    </div>
                                    <div className="flex justify-between text-emerald-700 py-0.5">
                                      <span>Tiền đã thanh toán (Đã cọc)</span>
                                      <span className="font-mono font-medium text-emerald-700">{order.depositAmount.toLocaleString('vi-VN')} đ</span>
                                    </div>
                                    <div className="flex justify-between text-rose-600 py-0.5">
                                      <span>Số tiền còn phải thu</span>
                                      <span className="font-mono font-medium text-rose-600">{(order.value - order.depositAmount).toLocaleString('vi-VN')} đ</span>
                                    </div>
                                    <div className="flex justify-between text-slate-900 font-medium pt-1.5 border-t border-slate-200">
                                      <span>Tỷ lệ đã thanh toán</span>
                                      <span className="font-mono text-xs font-bold text-[#784e34]">{order.depositPercent}%</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    },
                  }}
                  columns={[
                    {
                      title: 'Mã đơn',
                      dataIndex: 'orderCode',
                      key: 'orderCode',
                      width: 145,
                      render: (text) => (
                        <span className="font-mono text-xs font-semibold text-[#784e34] bg-[#784e34]/10 px-2.5 py-1 whitespace-nowrap inline-block rounded">
                          {text}
                        </span>
                      ),
                    },
                    {
                      title: 'Khách hàng',
                      dataIndex: 'customerName',
                      key: 'customerName',
                      width: 170,
                      render: (text, record: OrderRow) => (
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 text-sm">
                            {text || 'Khách lẻ'}
                          </span>
                          {record.customerPhone ? (
                            <span className="font-mono text-xs text-slate-500 mt-0.5">
                              {record.customerPhone}
                            </span>
                          ) : null}
                        </div>
                      ),
                    },
                    {
                      title: 'Sản phẩm may đo',
                      dataIndex: 'productName',
                      key: 'productName',
                      render: (text) => {
                        const cleanName = getCleanProductName(text);
                        return (
                          <span
                            className="font-medium text-[#784e34] hover:underline cursor-pointer inline-flex items-center gap-1 group"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onNavigateToProduct) onNavigateToProduct(cleanName);
                            }}
                            title={`Xem chi tiết sản phẩm "${cleanName}" trong danh mục`}
                          >
                            <span>{cleanName}</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-[#784e34]">↗</span>
                          </span>
                        );
                      },
                    },
                    {
                      title: 'Số lượng',
                      key: 'quantity',
                      align: 'center',
                      width: 95,
                      render: (_, record) => {
                        const qty = getOrderQuantity(record);
                        return (
                          <span className="font-mono font-bold text-xs text-slate-900 bg-white border border-slate-300 shadow-2xs px-2.5 py-0.5 rounded inline-block">
                            {qty}
                          </span>
                        );
                      },
                    },
                    {
                      title: 'Tổng giá trị',
                      dataIndex: 'value',
                      key: 'value',
                      align: 'right',
                      width: 150,
                      render: (val) => (
                        <span className="font-mono font-semibold text-sm text-[#784e34]">
                          {val.toLocaleString('vi-VN')} đ
                        </span>
                      ),
                    },
                    {
                      title: 'Trạng thái',
                      dataIndex: 'status',
                      key: 'status',
                      width: 175,
                      render: (rawStatus: OrderRow['status'], record: OrderRow) => {
                        const status = normalizeOrderStatus(rawStatus);
                        const statusColorMap: Record<string, { bg: string; text: string; border: string }> = {
                          pending: { bg: '!bg-amber-50', text: '!text-amber-800', border: '!border-amber-300' },
                          processing: { bg: '!bg-blue-50', text: '!text-blue-800', border: '!border-blue-300' },
                          delivering: { bg: '!bg-purple-50', text: '!text-purple-800', border: '!border-purple-300' },
                          completed: { bg: '!bg-emerald-50', text: '!text-emerald-800', border: '!border-emerald-300' },
                          cancelled: { bg: '!bg-rose-50', text: '!text-rose-800', border: '!border-rose-300' },
                          returned: { bg: '!bg-indigo-50', text: '!text-indigo-800', border: '!border-indigo-300' },
                          returned_success: { bg: '!bg-teal-50', text: '!text-teal-800', border: '!border-teal-300' },
                        };
                        const currentTheme = statusColorMap[status] || statusColorMap.pending;

                        return (
                          <div onClick={(e) => e.stopPropagation()} className="w-full min-w-[155px]">
                            <Select
                              value={status}
                              onChange={(newVal) => handleUpdateSingleOrderStatus(record.id, newVal)}
                              size="small"
                              className={`w-full font-semibold text-xs [&_.ant-select-selector]:!rounded-full [&_.ant-select-selector]:!border ${currentTheme.border} ${currentTheme.bg} ${currentTheme.text}`}
                              popupMatchSelectWidth={false}
                              options={[
                                {
                                  value: 'pending',
                                  label: (
                                    <div className="flex items-center gap-2 py-0.5 text-xs text-amber-700 font-semibold">
                                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                      <span>Chờ duyệt</span>
                                    </div>
                                  ),
                                },
                                {
                                  value: 'processing',
                                  label: (
                                    <div className="flex items-center gap-2 py-0.5 text-xs text-blue-700 font-semibold">
                                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                                      <span>Đang gia công</span>
                                    </div>
                                  ),
                                },
                                {
                                  value: 'delivering',
                                  label: (
                                    <div className="flex items-center gap-2 py-0.5 text-xs text-purple-700 font-semibold">
                                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                                      <span>Đang giao hàng</span>
                                    </div>
                                  ),
                                },
                                {
                                  value: 'completed',
                                  label: (
                                    <div className="flex items-center gap-2 py-0.5 text-xs text-emerald-700 font-semibold">
                                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                      <span>Hoàn tất bàn giao</span>
                                    </div>
                                  ),
                                },
                                {
                                  value: 'cancelled',
                                  label: (
                                    <div className="flex items-center gap-2 py-0.5 text-xs text-rose-700 font-semibold">
                                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                                      <span>Đã hủy</span>
                                    </div>
                                  ),
                                },
                                {
                                  value: 'returned',
                                  label: (
                                    <div className="flex items-center gap-2 py-0.5 text-xs text-indigo-700 font-semibold">
                                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                                      <span>Khách trả hàng</span>
                                    </div>
                                  ),
                                },
                                {
                                  value: 'returned_success',
                                  label: (
                                    <div className="flex items-center gap-2 py-0.5 text-xs text-teal-700 font-semibold">
                                      <span className="w-2 h-2 rounded-full bg-teal-500" />
                                      <span>Hoàn hàng thành công</span>
                                    </div>
                                  ),
                                },
                              ]}
                            />
                          </div>
                        );
                      },
                    },
                    {
                      title: 'Thao tác',
                      key: 'actions',
                      align: 'right',
                      width: 85,
                      render: (_, r) => (
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <Button
                            type="text"
                            size="small"
                            icon={<PrinterOutlined className="text-slate-600 hover:text-[#784e34] text-base" />}
                            title="In hóa đơn / Phiếu in"
                            onClick={() => printOrderInvoice(r)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100"
                          />
                          <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined className="text-slate-600 hover:text-[#784e34] text-base" />}
                            onClick={() => handleOpenEditOrder(r)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100"
                          />
                          <Popconfirm
                            title="Xác nhận xóa đơn hàng"
                            description={`Bạn có chắc chắn muốn xóa đơn ${r.orderCode}?`}
                            onConfirm={() => handleDeleteOrder(r.id)}
                            okText="Xóa"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true }}
                          >
                            <Button
                              type="text"
                              size="small"
                              danger
                              icon={<DeleteOutlined className="text-base" />}
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-rose-50 text-rose-600"
                            />
                          </Popconfirm>
                        </div>
                      ),
                    },
                  ]}
                />
            </div>
          </div>

          {/* CREATE / EDIT ORDER DRAWER */}
          <Drawer
            title={
              <div className="flex items-center gap-3 py-1">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg border shadow-xs ${
                    editingOrder
                      ? 'bg-amber-50 text-[#784e34] border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {editingOrder ? <EditOutlined /> : <ShoppingOutlined />}
                </div>
                <div>
                  <div className="text-base font-bold text-slate-800 flex items-center gap-2">
                    {editingOrder ? 'Chỉnh sửa đơn hàng' : 'Tạo mới đơn hàng may đo'}
                    {editingOrder && (
                      <Tag color="gold" className="font-mono text-sm px-2 m-0 font-medium">
                        {editingOrder.orderCode}
                      </Tag>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 font-normal">
                    {editingOrder
                      ? 'Cập nhật quy cách may đo, số tiền & tiến độ bàn giao'
                      : 'Lập phiếu đặt may đo / gia công nội thất gỗ tự nhiên'}
                  </div>
                </div>
              </div>
            }
            open={isOrderDrawerOpen}
            onClose={() => setIsOrderDrawerOpen(false)}
            styles={{ wrapper: { width: 760, maxWidth: '100vw' } }}
            forceRender
            footer={
              <div className="flex items-center justify-between px-2 py-1.5">
                <Button onClick={() => setIsOrderDrawerOpen(false)} icon={<CloseOutlined />} size="middle">
                  Đóng
                </Button>
                <Space>
                  <Button
                    type="primary"
                    onClick={handleSaveOrder}
                    icon={<SaveOutlined />}
                    className="!bg-[#784e34] hover:!bg-[#633e28] !border-[#784e34] font-medium h-10 px-6 rounded-lg shadow-sm"
                  >
                    {editingOrder ? 'Lưu thay đổi' : 'Tạo đơn hàng'}
                  </Button>
                </Space>
              </div>
            }
          >
            <Form form={form} layout="vertical" className="space-y-4">
              {/* Card 1: Thông tin chung */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 pb-1 border-b border-slate-200">
                  <AppstoreOutlined className="text-[#784e34]" />
                  <span>1. Thông tin chung & Kênh tiếp nhận</span>
                </div>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="Mã đơn hàng"
                      name="orderCode"
                      rules={[{ required: true, message: 'Vui lòng nhập mã đơn hàng' }]}
                    >
                      <Input placeholder="VD: DH-2026-09" className="font-mono font-medium" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Trạng thái đơn hàng" name="status">
                      <Select
                        options={[
                          { value: 'pending', label: '⏳ Chờ duyệt' },
                          { value: 'processing', label: '⚙️ Đang gia công' },
                          { value: 'delivering', label: '🚚 Đang giao hàng' },
                          { value: 'completed', label: '✅ Hoàn tất bàn giao' },
                          { value: 'cancelled', label: '❌ Đã hủy' },
                          { value: 'returned', label: '↩️ Khách trả hàng' },
                          { value: 'returned_success', label: '📦 Hoàn hàng thành công' },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item label="Chi nhánh / Showroom" name="showroom">
                  <Input placeholder="VD: Showroom Nam Từ Liêm (Hà Nội)" />
                </Form.Item>
              </div>

              {/* Card 2: Thông tin khách hàng */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 pb-1 border-b border-slate-200">
                  <UserOutlined className="text-[#784e34]" />
                  <span>2. Thông tin khách hàng & Địa chỉ</span>
                </div>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="Tên khách hàng"
                      name="customerName"
                      rules={[{ required: true, message: 'Vui lòng nhập tên khách hàng' }]}
                    >
                      <AutoComplete
                        options={effectiveCustomers.map((c) => ({
                          value: c.name,
                          label: (
                            <div className="flex justify-between items-center py-0.5">
                              <div>
                                <span className="font-semibold text-slate-800 mr-2">{c.name}</span>
                                {c.code && <span className="text-[11px] font-mono text-slate-400">({c.code})</span>}
                              </div>
                              <span className="text-xs text-slate-500 font-mono">{c.phone}</span>
                            </div>
                          ),
                          customer: c,
                        }))}
                        filterOption={(inputValue, option) => {
                          if (!inputValue) return true;
                          const c = (option as any)?.customer;
                          if (!c) {
                            return matchVietnameseText(inputValue, String(option?.value || ''));
                          }
                          return (
                            matchVietnameseText(inputValue, c.name || '') ||
                            matchVietnameseText(inputValue, c.phone || '') ||
                            matchVietnameseText(inputValue, c.code || '') ||
                            matchVietnameseText(inputValue, c.address || '')
                          );
                        }}
                        onSelect={(_val, option: any) => {
                          if (option?.customer) {
                            form.setFieldsValue({
                              customerPhone: option.customer.phone || '',
                              customerAddress: option.customer.address || '',
                              customerProvince: option.customer.invoiceProvince || undefined,
                              customerDistrict: option.customer.invoiceWard || undefined,
                            });
                          }
                        }}
                        placeholder="Nhập họ tên, SĐT hoặc chọn từ danh sách khách hàng..."
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Số điện thoại"
                      name="customerPhone"
                      rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
                    >
                      <Input placeholder="VD: 0918 345 678" />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="Tỉnh / Thành phố" name="customerProvince">
                      <Select
                        placeholder="-- Chọn Tỉnh / Thành phố --"
                        showSearch
                        optionFilterProp="label"
                        allowClear
                        onChange={() => {
                          form.setFieldsValue({ customerDistrict: undefined });
                        }}
                        options={VIETNAM_PROVINCES.map((p) => ({
                          value: p.name,
                          label: p.name,
                        }))}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Quận / Huyện" name="customerDistrict">
                      <Select
                        placeholder="-- Chọn Quận / Huyện --"
                        showSearch
                        optionFilterProp="label"
                        allowClear
                        disabled={!selectedProvince}
                        options={currentDistricts.map((d) => ({
                          value: d.name,
                          label: d.name,
                        }))}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item label="Địa chỉ cụ thể nhận nội thất" name="customerAddress">
                  <Input placeholder="Số nhà, đường, tòa nhà, căn hộ..." />
                </Form.Item>
              </div>

              {/* Card 3: Sản phẩm may đo */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 pb-1 border-b border-slate-200">
                  <ShoppingOutlined className="text-[#784e34]" />
                  <span>3. Quy cách sản phẩm</span>
                </div>
                <Row gutter={16}>
                  <Col span={14}>
                    <Form.Item
                      label="Sản phẩm / Hạng mục đặt làm"
                      name="productName"
                      rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}
                    >
                      <AutoComplete
                        options={effectiveProducts.map((p) => ({
                          value: p.name,
                          label: (
                            <div className="flex justify-between items-center py-0.5">
                              <div>
                                <span className="font-semibold text-slate-800 mr-2">{p.name}</span>
                                {p.code && <span className="text-[11px] font-mono text-slate-400">({p.code})</span>}
                              </div>
                              <span className="text-xs text-[#784e34] font-mono font-medium whitespace-nowrap ml-2">
                                {p.price.toLocaleString('vi-VN')} đ
                              </span>
                            </div>
                          ),
                          product: p,
                        }))}
                        filterOption={(inputValue, option) => {
                          if (!inputValue) return true;
                          const p = (option as any)?.product;
                          if (!p) {
                            return matchVietnameseText(inputValue, String(option?.value || ''));
                          }
                          return (
                            matchVietnameseText(inputValue, p.name || '') ||
                            matchVietnameseText(inputValue, p.code || '') ||
                            matchVietnameseText(inputValue, p.sku || '') ||
                            matchVietnameseText(inputValue, p.categoryName || '') ||
                            matchVietnameseText(inputValue, p.collection || '')
                          );
                        }}
                        onSelect={(_val, option: any) => {
                          if (option?.product) {
                            const realMaterial = option.product.material || '';
                            form.setFieldsValue({
                              value: option.product.price || 0,
                              woodType: realMaterial,
                              productSpec: option.product.dimensions
                                ? `${option.product.dimensions}${realMaterial ? ` - ${realMaterial}` : ''}`
                                : option.product.specs?.[0] || option.product.collection || 'Theo quy cách xuất xưởng',
                            });
                          }
                        }}
                        placeholder="Gõ tên, mã sản phẩm (VD: Tủ áo, Kệ Tivi, Sofa...)"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={10}>
                    <Form.Item label="Chủng loại gỗ / Chất liệu" name="woodType">
                      <AutoComplete
                        options={availableWoodTypes.map((mat) => ({
                          value: mat,
                          label: mat,
                        }))}
                        filterOption={(inputValue, option) => {
                          if (!inputValue) return true;
                          return matchVietnameseText(inputValue, String(option?.value || ''));
                        }}
                        placeholder="VD: Gỗ Óc Chó FAS, Gỗ Sồi Mỹ..."
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item label="Quy cách / Kích thước kỹ thuật" name="productSpec">
                  <Input placeholder="VD: 2800 x 1800 x 850 mm - Đệm Bỉ cao cấp" />
                </Form.Item>
              </div>

              {/* Card 4: Giá trị & Cọc */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 pb-1 border-b border-slate-200">
                  <DollarOutlined className="text-[#784e34]" />
                  <span>4. Giá trị đơn hàng, Đặt cọc & Hạn bàn giao</span>
                </div>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="Tổng giá trị đơn hàng (VNĐ)"
                      name="value"
                      rules={[{ required: true, message: 'Vui lòng nhập tổng giá trị' }]}
                    >
                      <InputNumber<number>
                        className="w-full font-mono text-base font-bold text-[#784e34]"
                        style={{ width: '100%' }}
                        controls={false}
                        min={0}
                        formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(val) => (val ? Number(val.replace(/\$\s?|(,*)/g, '')) : 0)}
                        placeholder="0"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Đã đặt cọc (VNĐ)" name="depositAmount">
                      <InputNumber<number>
                        className="w-full font-mono text-base font-bold text-emerald-700"
                        style={{ width: '100%' }}
                        controls={false}
                        min={0}
                        formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(val) => (val ? Number(val.replace(/\$\s?|(,*)/g, '')) : 0)}
                        placeholder="0"
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="Hạn bàn giao & Lắp đặt"
                      name="deadlineToPicker"
                      rules={[{ required: true, message: 'Vui lòng chọn hạn bàn giao' }]}
                    >
                      <DatePicker
                        className="w-full h-9 font-medium"
                        style={{ width: '100%' }}
                        format="DD/MM/YYYY"
                        placeholder="Chọn ngày (DD/MM/YYYY)"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 flex items-center justify-between h-9 mt-6">
                      <span className="text-slate-600 font-medium">Còn phải thu khi giao:</span>
                      <span className="font-mono font-bold text-rose-600 text-sm">
                        {Math.max(0, (Form.useWatch('value', form) || 0) - (Form.useWatch('depositAmount', form) || 0)).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </Col>
                </Row>
              </div>
            </Form>
          </Drawer>
        </div>
  );
}
