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
  Tooltip,
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
  RollbackOutlined,
  PictureOutlined,
  CheckCircleOutlined,
  ShopOutlined,
  InfoCircleOutlined,
  QrcodeOutlined,
  ExclamationCircleOutlined,
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
import { settingsApi, type PaymentConfigData } from '@/api/settingsApi';
import { VietQrCard } from '@/components/common/VietQrCard';
import { VIETNAM_PROVINCES } from '@/data/vietnamAddresses';
import { isMatchBranch, getProductStockForBranch } from '@/utils/branchHelper';
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
  initialSearch?: string;
  onClearInitialSearch?: () => void;
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
  initialSearch,
  onClearInitialSearch,
}: OrdersTabProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm();

  // Local filter states
  const [searchQuery, setSearchQuery] = useState(initialSearch || '');

  React.useEffect(() => {
    if (initialSearch !== undefined && initialSearch !== null) {
      setSearchQuery(initialSearch);
    }
  }, [initialSearch]);
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
  const [dbMaterials, setDbMaterials] = useState<string[]>([]);
  const [selectedProductData, setSelectedProductData] = useState<FeaturedCatalogProduct | null>(null);

  // Real Payment Config from Settings Screen (VietQR & Default Deposit %)
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfigData | null>(() => {
    return getStoredAdminData<PaymentConfigData | null>(ADMIN_STORAGE_KEYS.PAYMENT_SETTINGS, null);
  });

  const settingDepositPercent = useMemo(() => {
    if (paymentConfig?.defaultDeposit !== undefined && paymentConfig.defaultDeposit !== null) {
      const parsed = Number(paymentConfig.defaultDeposit);
      if (!isNaN(parsed) && parsed >= 0) return parsed;
    }
    return 20;
  }, [paymentConfig]);

  // Form watches for live VietQR and financial calculation
  const currentOrderCode = Form.useWatch('orderCode', form) || 'DH-001';
  const currentPaymentMethod = Form.useWatch('paymentMethod', form) || 'VietQR';
  const currentTotalValue = Form.useWatch('value', form) || 0;
  const currentDepositAmount = Form.useWatch('depositAmount', form) || 0;
  const currentDepositPercentForm = Form.useWatch('depositPercent', form);
  const currentDepositPercent = useMemo(() => {
    if (currentDepositPercentForm !== undefined && currentDepositPercentForm !== null && currentDepositPercentForm !== '') {
      return Number(currentDepositPercentForm);
    }
    if (!currentTotalValue || currentTotalValue <= 0) return 0;
    return Math.round((currentDepositAmount / currentTotalValue) * 100);
  }, [currentDepositPercentForm, currentTotalValue, currentDepositAmount]);

  // All available deposit preset options dynamically matching settings and standard business tiers
  const depositPresets = useMemo(() => {
    const defaultPcts = [0, 10, 20, 30, 50, 70, 100];
    const all = Array.from(new Set([settingDepositPercent, ...defaultPcts])).sort((a, b) => a - b);
    return all.map((pct) => {
      if (pct === 0) return { percent: 0, label: '0% (Chưa cọc)' };
      if (pct === 100) return { percent: 100, label: '100% (Đủ)' };
      if (pct === settingDepositPercent) return { percent: pct, label: `${pct}% (Cài đặt)` };
      return { percent: pct, label: `${pct}%` };
    });
  }, [settingDepositPercent]);

  const qrTransferAmount = currentDepositAmount > 0 ? currentDepositAmount : currentTotalValue;

  const effectiveCustomers = customersList.length > 0 ? customersList : dbCustomers;
  const effectiveProducts = catalogList.length > 0 ? catalogList : dbProducts;

  // Selected Showroom from form watch to show real-time branch stock
  const selectedShowroom = Form.useWatch('showroom', form);
  const selectedCustomerId = Form.useWatch('customerId', form);
  const selectedCustomer = useMemo(() => {
    if (!selectedCustomerId) return null;
    return effectiveCustomers.find((c) => c.id === selectedCustomerId) || null;
  }, [selectedCustomerId, effectiveCustomers]);

  // Province and District linkage
  const selectedProvince = Form.useWatch('customerProvince', form);
  const currentDistricts = useMemo(() => {
    if (!selectedProvince) return [];
    const found = VIETNAM_PROVINCES.find((p) => p.name === selectedProvince);
    return found ? found.districts : [];
  }, [selectedProvince]);

  // Distinct real materials extracted directly from the database API & catalog products
  const availableWoodTypes = useMemo(() => {
    const fromProducts = effectiveProducts
      .map((p) => p.material?.trim())
      .filter((m): m is string => Boolean(m));
    const combined = Array.from(new Set([...dbMaterials, ...fromProducts]));
    return combined.length > 0
      ? combined
      : ['Gỗ Sồi tự nhiên ( Ash / Oak)', 'Gỗ Tần Bì + Veneer Sồi', 'Gỗ Me Tây', 'Gỗ Óc Chó Bắc Mỹ FAS', 'Gỗ Gõ Đỏ Pachyloba', 'Gỗ Hương Đá Nam Phi'];
  }, [dbMaterials, effectiveProducts]);

  // Load payment config on mount
  React.useEffect(() => {
    settingsApi.getPaymentConfig().then((cfg) => {
      if (cfg) {
        setPaymentConfig(cfg);
        try { setStoredAdminData(ADMIN_STORAGE_KEYS.PAYMENT_SETTINGS, cfg); } catch {}
      }
    }).catch(() => {});
  }, []);

  // Lazy load customer, product and real materials ONLY when the create/edit order drawer is opened
  const hasFetchedDrawerDataRef = React.useRef(false);
  React.useEffect(() => {
    if (isOrderDrawerOpen) {
      settingsApi.getPaymentConfig().then((cfg) => {
        if (cfg) {
          setPaymentConfig(cfg);
          try { setStoredAdminData(ADMIN_STORAGE_KEYS.PAYMENT_SETTINGS, cfg); } catch {}
        }
      }).catch(() => {});

      if (!hasFetchedDrawerDataRef.current) {
        hasFetchedDrawerDataRef.current = true;
        if (customersList.length === 0) {
          customerApi.getCustomers().then((res) => {
            if (Array.isArray(res) && res.length > 0) setDbCustomers(res);
          }).catch(() => {});
        }

        if (catalogList.length === 0) {
          productApi.getProducts({ pageSize: 0 }).then((res) => {
            if (Array.isArray(res) && res.length > 0) setDbProducts(res);
          }).catch(() => {});
        }

        productApi.getMaterials().then((mats) => {
          if (Array.isArray(mats) && mats.length > 0) {
            setDbMaterials(mats.map((m) => m.name).filter(Boolean));
          }
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
    return ordersList.filter((item) => {
      if (isMatchBranch(item.showroom || item.branch || item.customerAddress, branchFilter)) {
        return true;
      }
      if (
        item.orderType === 'retail' &&
        (!item.showroom ||
          item.showroom === 'Website' ||
          item.showroom === 'Toàn hệ thống' ||
          !effectiveBranches.some((b) => isMatchBranch(b.name, item.showroom)))
      ) {
        return true;
      }
      return false;
    });
  }, [ordersList, branchFilter, effectiveBranches]);

  // Filtered orders calculation
  const filteredOrders = useMemo(() => {
    const q = searchQuery ? searchQuery.trim().toLowerCase() : '';
    return branchScopedOrders.filter((item) => {
      const matchSearch =
        !q ||
        (item.orderCode ? item.orderCode.toLowerCase().includes(q) : false) ||
        (item.customerName ? item.customerName.toLowerCase().includes(q) : false) ||
        (item.customerPhone ? item.customerPhone.includes(q) : false) ||
        (item.recipientName ? item.recipientName.toLowerCase().includes(q) : false) ||
        (item.recipientPhone ? item.recipientPhone.includes(q) : false) ||
        (item.productName ? item.productName.toLowerCase().includes(q) : false);

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
    setSelectedProductData(null);
    setIsOrderDrawerOpen(true);

    const defaultBranch = selectedGlobalBranch !== 'all'
      ? selectedGlobalBranch
      : (effectiveBranches[0]?.name || '');

    const generatedCode = `DH${dayjs().format('YYMMDD')}-${Math.floor(100 + Math.random() * 900)}`;

    setTimeout(() => {
      form.resetFields();
      form.setFieldsValue({
        orderCode: generatedCode,
        orderType: 'retail',
        status: 'pending',
        showroom: defaultBranch,
        customerId: undefined,
        customerName: '',
        customerPhone: '',
        customerProvince: undefined,
        customerDistrict: undefined,
        customerAddress: '',
        productId: undefined,
        productName: '',
        productSku: '',
        woodType: '',
        productSpec: '',
        quantity: 1,
        unitPrice: 0,
        value: 0,
        depositPercent: settingDepositPercent,
        depositAmount: 0,
        paymentMethod: 'VietQR',
        deadlineToPicker: dayjs().add(7, 'day'),
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

    // Locate matching real catalog product
    const matchedProduct = effectiveProducts.find(
      (p) =>
        (order.productId && p.id === order.productId) ||
        (order.items?.[0]?.productId && p.id === order.items[0].productId) ||
        (order.items?.[0]?.productSku && (p.code === order.items[0].productSku || (p as any).sku === order.items[0].productSku)) ||
        (Boolean(order.productName) && Boolean(p.name) && p.name.trim().toLowerCase() === order.productName.trim().toLowerCase())
    );
    setSelectedProductData(matchedProduct || null);

    let parsedDeadline = undefined;
    if (order.deadlineDate) {
      const trimmed = order.deadlineDate.trim();
      if (trimmed.includes('/')) {
        parsedDeadline = dayjs(trimmed, 'DD/MM/YYYY');
      } else {
        parsedDeadline = dayjs(trimmed);
      }
    }

    const defaultBranch = order.showroom || order.branch || (selectedGlobalBranch !== 'all' ? selectedGlobalBranch : (effectiveBranches[0]?.name || ''));
    const orderQty = order.quantity || order.items?.[0]?.quantity || 1;
    const orderUnitPrice = order.items?.[0]?.unitPrice || (orderQty ? Math.round(order.value / orderQty) : order.value);
    const orderDepositPct = order.depositPercent !== undefined && order.depositPercent !== null
      ? order.depositPercent
      : (order.value > 0 ? Math.round((order.depositAmount / order.value) * 100) : 0);

    setTimeout(() => {
      form.resetFields();
      form.setFieldsValue({
        orderCode: order.orderCode,
        customerId: order.customerId || undefined,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        recipientName: order.recipientName || '',
        recipientPhone: order.recipientPhone || '',
        customerProvince: order.customerProvince,
        customerDistrict: order.customerDistrict,
        customerAddress: order.customerAddress,
        productId: order.productId || order.items?.[0]?.productId || matchedProduct?.id || undefined,
        productName: order.productName,
        productSku: order.items?.[0]?.productSku || matchedProduct?.code || '',
        productSpec: order.productSpec,
        woodType: order.woodType,
        quantity: orderQty,
        unitPrice: orderUnitPrice,
        orderType: order.orderType || 'retail',
        status: normalizeOrderStatus(order.status),
        value: order.value,
        depositPercent: orderDepositPct,
        depositAmount: order.depositAmount,
        paymentMethod: order.paymentMethod || 'VietQR',
        deadlineToPicker: parsedDeadline && parsedDeadline.isValid() ? parsedDeadline : dayjs().add(7, 'day'),
        showroom: defaultBranch,
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

      const depositPercent = values.depositPercent !== undefined && values.depositPercent !== null && values.depositPercent !== ''
        ? Number(values.depositPercent)
        : (values.value > 0 ? Math.round(((values.depositAmount || 0) / values.value) * 100) : 0);
      const fullShippingAddress = [
        values.customerAddress,
        values.customerDistrict,
        values.customerProvince,
      ].filter(Boolean).join(', ');

      const formattedDeadline = values.deadlineToPicker
        ? dayjs(values.deadlineToPicker).format('YYYY-MM-DD')
        : dayjs().add(7, 'day').format('YYYY-MM-DD');

      const isPaid = (values.depositAmount || 0) >= values.value && values.value > 0;
      const paymentStatus = isPaid ? 'paid' : ((values.depositAmount || 0) > 0 ? 'partial' : 'pending');
      const targetBranch = values.showroom || (selectedGlobalBranch !== 'all' ? selectedGlobalBranch : (effectiveBranches[0]?.name || ''));

      const orderItemPayload = {
        productId: values.productId || undefined,
        productName: values.productName,
        productSku: values.productSku || undefined,
        productImage: selectedProductData?.image || undefined,
        material: values.woodType,
        dimensions: values.productSpec,
        unitPrice: values.unitPrice || (values.quantity ? Math.round(values.value / values.quantity) : values.value),
        quantity: values.quantity || 1,
        totalPrice: values.value,
      };

      const finalRecipientName = values.recipientName?.trim() || values.customerName?.trim();
      const finalRecipientPhone = values.recipientPhone?.trim() || values.customerPhone?.trim();

      if (editingOrder) {
        const updated = await orderApi.updateOrder(editingOrder.id, {
          ...values,
          customerId: values.customerId || undefined,
          productId: values.productId || undefined,
          recipientName: finalRecipientName,
          recipientPhone: finalRecipientPhone,
          status: normStatus,
          paymentStatus,
          paymentMethod: values.paymentMethod || 'VietQR',
          deadlineDate: formattedDeadline,
          city: values.customerProvince,
          district: values.customerDistrict,
          shippingAddress: fullShippingAddress || values.customerAddress,
          orderType: values.orderType || editingOrder.orderType || 'retail',
          depositPercent,
          showroom: targetBranch,
          branch: targetBranch,
          quantity: values.quantity || 1,
          items: [orderItemPayload],
        });
        invalidateApiCache('orders');
        setOrdersList((prev) => {
          const next = prev.map((item) =>
            item.id === editingOrder.id
              ? {
                  ...item,
                  ...updated,
                  customerId: values.customerId || item.customerId,
                  productId: values.productId || item.productId,
                  recipientName: finalRecipientName,
                  recipientPhone: finalRecipientPhone,
                  status: normStatus,
                  paymentStatus,
                  paymentMethod: values.paymentMethod || item.paymentMethod || 'VietQR',
                  deadlineDate: formattedDeadline,
                  customerProvince: values.customerProvince,
                  customerDistrict: values.customerDistrict,
                  statusLabel: statusLabels[normStatus] || item.statusLabel,
                  depositPercent,
                  showroom: targetBranch,
                  branch: targetBranch,
                  quantity: values.quantity || 1,
                  items: [orderItemPayload],
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
          customerId: values.customerId || undefined,
          customerName: values.customerName,
          customerPhone: values.customerPhone,
          recipientName: finalRecipientName,
          recipientPhone: finalRecipientPhone,
          customerAddress: values.customerAddress,
          customerProvince: values.customerProvince,
          customerDistrict: values.customerDistrict,
          city: values.customerProvince,
          district: values.customerDistrict,
          shippingAddress: fullShippingAddress || values.customerAddress,
          productId: values.productId || undefined,
          productName: values.productName,
          productSku: values.productSku || undefined,
          productSpec: values.productSpec || 'Theo thiết kế kỹ thuật',
          woodType: values.woodType || 'Gỗ tự nhiên cao cấp',
          value: values.value || 0,
          quantity: values.quantity || 1,
          depositAmount: values.depositAmount || 0,
          depositPercent,
          status: normStatus,
          paymentStatus,
          paymentMethod: values.paymentMethod || 'VietQR',
          deadlineDate: formattedDeadline,
          orderType: values.orderType || 'retail',
          spaceType: 'living',
          showroom: targetBranch,
          branch: targetBranch,
          items: [orderItemPayload],
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

                {/* Filter 0: Cơ sở / Chi nhánh */}
                {effectiveBranches.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                      Cơ sở / Chi nhánh
                    </div>
                    <Select
                      value={branchFilter || 'all'}
                      onChange={(val) => setBranchFilter(val)}
                      className="w-full text-xs font-semibold"
                      options={[
                        { value: 'all', label: `Toàn bộ chi nhánh (${ordersList.length})` },
                        ...effectiveBranches.map((b) => {
                          const count = ordersList.filter((o) =>
                            isMatchBranch(o.showroom || o.branch || o.customerAddress, b.name)
                          ).length;
                          return {
                            value: b.name,
                            label: `${b.name} (${count})`,
                          };
                        }),
                      ]}
                    />
                  </div>
                )}

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
              <div className="flex-1 min-w-0 w-full max-w-full">
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
                                    <div><span className="text-slate-400">Khách hàng đặt (Công nợ):</span> <span className="font-medium text-slate-900">{order.customerName}</span> • <span className="text-slate-400">SĐT:</span> <span className="font-mono">{order.customerPhone}</span></div>
                                    {order.recipientName && (order.recipientName !== order.customerName || (order.recipientPhone && order.recipientPhone !== order.customerPhone)) ? (
                                      <div><span className="text-slate-400">Người nhận hàng:</span> <span className="font-medium text-[#784e34]">{order.recipientName}</span> {order.recipientPhone ? <>• <span className="text-slate-400">SĐT:</span> <span className="font-mono">{order.recipientPhone}</span></> : null}</div>
                                    ) : null}
                                    <div><span className="text-slate-400">Địa chỉ giao nhận:</span> <span>{order.customerAddress}</span></div>
                                    <div><span className="text-slate-400">Yêu cầu kỹ thuật:</span> <span>{order.productSpec}</span></div>
                                    <div><span className="text-slate-400">Ngày đặt hàng:</span> <span className="font-mono">{order.orderDate}</span> • <span className="text-slate-400">Hạn bàn giao:</span> <span className="font-mono text-rose-600">{order.deadlineDate}</span></div>
                                  </div>

                                  {(order.returnReason || (order as any).returnImages?.length || order.status === 'returned' || order.status === 'returned_success') && (
                                    <div className="p-3 bg-rose-50/70 border border-rose-200 text-xs text-slate-800 space-y-2 mt-2">
                                      <div className="flex items-center gap-2 text-rose-800 font-semibold text-xs border-b border-rose-200/80 pb-1.5">
                                        <RollbackOutlined className="text-sm" />
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
                                            <PictureOutlined className="text-xs text-rose-700" />
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
                                                <img src={img} alt={`Minh chứng ${idx + 1}`} loading="lazy" decoding="async" className="w-full h-full object-cover" />
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
                                <span className="text-slate-400 block mb-0.5">Khách đặt (Công nợ):</span>
                                <span className="font-medium text-slate-900 text-sm">{order.customerName}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block mb-0.5">SĐT người đặt:</span>
                                <span className="font-mono font-medium text-slate-900 text-sm">{order.customerPhone}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block mb-0.5">Người nhận hàng:</span>
                                <span className="font-medium text-[#784e34] text-sm">{order.recipientName || order.customerName}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block mb-0.5">SĐT người nhận:</span>
                                <span className="font-mono font-medium text-[#784e34] text-sm">{order.recipientPhone || order.customerPhone}</span>
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
                      width: 190,
                      render: (text, record: OrderRow) => {
                        const hasDifferentRecipient =
                          Boolean(record.recipientName) &&
                          record.recipientName?.trim().toLowerCase() !== (text || '').trim().toLowerCase();
                        return (
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900 text-sm">
                              {text || 'Khách lẻ'}
                            </span>
                            {record.customerPhone ? (
                              <span className="font-mono text-xs text-slate-500 mt-0.5">
                                {record.customerPhone}
                              </span>
                            ) : null}
                            {hasDifferentRecipient ? (
                              <div className="mt-1 text-[11px] text-[#784e34] bg-amber-50/90 px-1.5 py-0.5 rounded border border-amber-200/80 inline-flex flex-col">
                                <span className="font-medium">Nhận hàng: {record.recipientName}</span>
                                {record.recipientPhone && record.recipientPhone !== record.customerPhone ? (
                                  <span className="font-mono text-[10px] text-slate-500">SĐT: {record.recipientPhone}</span>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        );
                      },
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
                <Form.Item name="orderType" hidden>
                  <Input />
                </Form.Item>
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item
                      label="Mã đơn hàng"
                      name="orderCode"
                      rules={[{ required: true, message: 'Vui lòng nhập mã đơn hàng' }]}
                    >
                      <Input placeholder="VD: DH261022-001" className="font-mono font-medium" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      label="Chi nhánh tiếp nhận"
                      name="showroom"
                      rules={[{ required: true, message: 'Vui lòng chọn chi nhánh' }]}
                    >
                      <Select
                        placeholder="-- Chọn chi nhánh tiếp nhận --"
                        options={effectiveBranches.map((b) => ({
                          value: b.name,
                          label: `🏬 ${b.name}`,
                        }))}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
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
              </div>

              {/* Card 2: Thông tin khách hàng */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <UserOutlined className="text-[#784e34]" />
                    <span>2. Thông tin khách hàng & Địa chỉ</span>
                  </div>
                  {selectedCustomer && (
                    <span className="text-xs font-medium text-emerald-700 flex items-center gap-1">
                      <CheckCircleOutlined /> Khách hàng thật: {selectedCustomer.code || selectedCustomer.name}
                    </span>
                  )}
                </div>
                <Form.Item name="customerId" hidden>
                  <Input />
                </Form.Item>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="Tên khách hàng"
                      name="customerName"
                      rules={[{ required: true, message: 'Vui lòng nhập tên khách hàng' }]}
                    >
                      <AutoComplete
                        options={effectiveCustomers.map((c) => {
                          const isVip = c.type === 'vip' || c.tier === 'diamond' || c.tier === 'gold';
                          return {
                            value: c.name,
                            label: (
                              <div className="flex justify-between items-center py-1">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="font-semibold text-slate-800 text-xs truncate">{c.name}</span>
                                  {c.code && (
                                    <span className="text-[10px] font-mono px-1 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                      {c.code}
                                    </span>
                                  )}
                                  {isVip && (
                                    <span className="text-[9px] font-bold px-1 rounded bg-amber-100 text-amber-800 border border-amber-300">
                                      {c.tier ? `VIP ${c.tier.toUpperCase()}` : 'VIP'}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0 text-slate-500">
                                  <span className="text-[11px] font-mono">{c.phone}</span>
                                  {c.branch && <span className="text-[10px] text-slate-400">({c.branch.replace('Chi nhánh ', 'CN ')})</span>}
                                </div>
                              </div>
                            ),
                            customer: c,
                          };
                        })}
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
                            const cust = option.customer;
                            form.setFieldsValue({
                              customerId: cust.id,
                              customerName: cust.name,
                              customerPhone: cust.phone || '',
                              customerAddress: cust.address || '',
                              customerProvince: cust.invoiceProvince || cust.province || undefined,
                              customerDistrict: cust.invoiceWard || cust.district || undefined,
                            });
                          }
                        }}
                        onChange={() => {
                          // If user edits name manually, clear linked customerId if it no longer matches
                          const currentId = form.getFieldValue('customerId');
                          if (currentId) {
                            const currentCust = effectiveCustomers.find((c) => c.id === currentId);
                            if (currentCust && currentCust.name !== form.getFieldValue('customerName')) {
                              form.setFieldsValue({ customerId: undefined });
                            }
                          }
                        }}
                        placeholder="Tìm theo tên, SĐT hoặc mã khách hàng (VD: KH-006)..."
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

                {/* Live Customer Linked Info Box */}
                {selectedCustomer && (
                  <div className="p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200 text-xs flex flex-wrap items-center justify-between gap-2 text-emerald-800">
                    <div className="flex items-center gap-2">
                      <CheckCircleOutlined className="text-emerald-600" />
                      <span>
                        Hồ sơ: <strong>{selectedCustomer.name}</strong> - Mã: <code>{selectedCustomer.code}</code>
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                      <span>Đơn đã mua: <strong className="text-slate-800">{selectedCustomer.totalOrders || selectedCustomer.ordersCount || 0}</strong></span>
                      {selectedCustomer.totalSpent > 0 && (
                        <span>Chi tiêu: <strong className="text-emerald-700">{selectedCustomer.totalSpent.toLocaleString('vi-VN')} đ</strong></span>
                      )}
                      {selectedCustomer.debt > 0 && (
                        <span className="text-rose-600 font-medium">Nợ cũ: {selectedCustomer.debt.toLocaleString('vi-VN')} đ</span>
                      )}
                    </div>
                  </div>
                )}

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

                <div className="pt-2 border-t border-slate-200/80">
                  <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-[#784e34]">local_shipping</span>
                    <span>Thông tin người nhận hàng tại công trình (Tùy chọn nếu khác người đặt)</span>
                  </div>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="Họ tên người nhận" name="recipientName">
                        <Input placeholder="Mặc định lấy theo tên khách đặt..." />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="SĐT người nhận" name="recipientPhone">
                        <Input placeholder="Mặc định lấy theo SĐT khách đặt..." />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              </div>

              {/* Card 3: Sản phẩm đặt làm / Mua hàng */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <ShoppingOutlined className="text-[#784e34]" />
                    <span>3. Sản phẩm & Quy cách may đo</span>
                  </div>
                  {selectedProductData && (
                    <span className="text-xs font-medium text-amber-800 flex items-center gap-1 font-mono">
                      SKU: {selectedProductData.code}
                    </span>
                  )}
                </div>
                <Form.Item name="productId" hidden>
                  <Input />
                </Form.Item>
                <Form.Item name="productSku" hidden>
                  <Input />
                </Form.Item>
                <Row gutter={16}>
                  <Col span={14}>
                    <Form.Item
                      label="Sản phẩm / Hạng mục đặt làm"
                      name="productName"
                      rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}
                    >
                      <AutoComplete
                        options={effectiveProducts.map((p) => {
                          const branchStock = getProductStockForBranch(p, selectedShowroom);
                          const totalStock = p.inStock ?? 0;
                          return {
                            value: p.name,
                            label: (
                              <div className="flex justify-between items-center py-1 gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  {p.image ? (
                                    <img src={p.image} alt="" loading="lazy" decoding="async" className="w-8 h-8 rounded object-cover flex-shrink-0 border border-slate-200" />
                                  ) : (
                                    <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-400">
                                      <ShoppingOutlined className="text-xs" />
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <div className="font-semibold text-slate-800 truncate text-xs">{p.name}</div>
                                    <div className="text-[11px] font-mono text-slate-400 truncate">
                                      SKU: {p.code} {p.material ? `• ${p.material}` : ''}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end flex-shrink-0">
                                  <span className="text-xs text-[#784e34] font-mono font-semibold">
                                    {p.price.toLocaleString('vi-VN')} đ
                                  </span>
                                  <span className={`text-[10px] font-mono px-1 rounded ${branchStock > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                    Kho: {branchStock} | Tổng: {totalStock}
                                  </span>
                                </div>
                              </div>
                            ),
                            product: p,
                          };
                        })}
                        filterOption={(inputValue, option) => {
                          if (!inputValue) return true;
                          const p = (option as any)?.product;
                          if (!p) {
                            return matchVietnameseText(inputValue, String(option?.value || ''));
                          }
                          return (
                            matchVietnameseText(inputValue, p.name || '') ||
                            matchVietnameseText(inputValue, p.code || '') ||
                            matchVietnameseText(inputValue, (p as any).sku || '') ||
                            matchVietnameseText(inputValue, p.categoryName || '') ||
                            matchVietnameseText(inputValue, p.material || '') ||
                            matchVietnameseText(inputValue, p.collection || '')
                          );
                        }}
                        onSelect={(_val, option: any) => {
                          if (option?.product) {
                            const p = option.product;
                            const realMaterial = p.material || '';
                            const unitP = p.price || 0;
                            const curQty = form.getFieldValue('quantity') || 1;
                            const totalVal = unitP * curQty;
                            const autoDeposit = Math.round(totalVal * (settingDepositPercent / 100));
                            form.setFieldsValue({
                              productId: p.id,
                              productSku: p.sku || p.code || '',
                              productName: p.name,
                              unitPrice: unitP,
                              value: totalVal,
                              depositAmount: autoDeposit,
                              woodType: realMaterial,
                              productSpec: p.dimensions
                                ? `${p.dimensions}${realMaterial ? ` - ${realMaterial}` : ''}`
                                : p.specs?.[0] || p.collection || 'Theo quy cách xuất xưởng',
                            });
                            setSelectedProductData(p);
                          }
                        }}
                        placeholder="Gõ tên, mã SKU sản phẩm (VD: KTV-G42, Tủ áo, Kệ Tivi...)"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={10}>
                    <Form.Item label="Chủng loại gỗ / Chất liệu" name="woodType">
                      <AutoComplete
                        options={availableWoodTypes.map((mat) => ({
                          value: mat,
                          label: (
                            <div className="flex justify-between items-center py-0.5">
                              <span className="text-xs text-slate-800">{mat}</span>
                              <Tag color="cyan" className="text-[10px] m-0">Thực tế</Tag>
                            </div>
                          ),
                        }))}
                        filterOption={(inputValue, option) => {
                          if (!inputValue) return true;
                          return matchVietnameseText(inputValue, String(option?.value || ''));
                        }}
                        placeholder="Chọn hoặc gõ chất liệu gỗ..."
                      />
                    </Form.Item>
                  </Col>
                </Row>

                {/* Live Real Stock & Product Specification Card */}
                {selectedProductData && (
                  <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200 text-xs space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2.5">
                        {selectedProductData.image ? (
                          <img
                            src={selectedProductData.image}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="w-11 h-11 rounded-lg object-cover border border-amber-200 shadow-sm"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-lg bg-amber-100 flex items-center justify-center text-[#784e34]">
                            <ShopOutlined className="text-lg" />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-slate-800 text-sm">{selectedProductData.name}</div>
                          <div className="font-mono text-[11px] text-slate-600">
                            Mã SKU: <span className="font-bold text-slate-800">{selectedProductData.code}</span>
                            {selectedProductData.dimensions && ` • KT: ${selectedProductData.dimensions}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const branchStock = getProductStockForBranch(selectedProductData, selectedShowroom);
                          const totalStock = selectedProductData.inStock ?? 0;
                          return (
                            <>
                              <Tag color={branchStock > 0 ? 'success' : 'warning'} className="font-semibold m-0 text-xs px-2 py-0.5">
                                Tại {selectedShowroom ? selectedShowroom.replace('Chi nhánh ', 'CN ') : 'chi nhánh'}: {branchStock} cái
                              </Tag>
                              <Tag color="blue" className="font-mono m-0 text-xs px-2 py-0.5">
                                Tổng hệ thống: {totalStock}
                              </Tag>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item label="Số lượng" name="quantity" rules={[{ required: true, message: 'Nhập số lượng' }]}>
                      <InputNumber
                        min={1}
                        className="w-full"
                        style={{ width: '100%' }}
                        onChange={(qty) => {
                          const unitP = form.getFieldValue('unitPrice') || 0;
                          if (qty && unitP) {
                            const totalVal = qty * unitP;
                            const curPct = form.getFieldValue('depositPercent');
                            const usePct = curPct !== undefined && curPct !== null ? Number(curPct) : settingDepositPercent;
                            form.setFieldsValue({
                              value: totalVal,
                              depositAmount: Math.round(totalVal * (usePct / 100)),
                            });
                          }
                        }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={16}>
                    <Form.Item label="Đơn giá tham chiếu (VNĐ)" name="unitPrice">
                      <InputNumber<number>
                        className="w-full font-mono font-medium"
                        style={{ width: '100%' }}
                        min={0}
                        formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(val) => (val ? Number(val.replace(/\$\s?|(,*)/g, '')) : 0)}
                        placeholder="Nhập đơn giá / bộ"
                        onChange={(price) => {
                          const curQty = form.getFieldValue('quantity') || 1;
                          if (price !== null && price !== undefined) {
                            const totalVal = price * curQty;
                            const curPct = form.getFieldValue('depositPercent');
                            const usePct = curPct !== undefined && curPct !== null ? Number(curPct) : settingDepositPercent;
                            form.setFieldsValue({
                              value: totalVal,
                              depositAmount: Math.round(totalVal * (usePct / 100)),
                            });
                          }
                        }}
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
                  <span>4. Giá trị đơn hàng & Đặt cọc</span>
                </div>
                {/* Hàng 1: 3 ô tài chính ngang hàng tuyệt đối */}
                <Row gutter={12} className="items-start">
                  <Col span={8}>
                    <Form.Item
                      label={<span className="whitespace-nowrap text-xs font-semibold text-slate-700">Tổng giá trị đơn</span>}
                      name="value"
                      rules={[{ required: true, message: 'Vui lòng nhập tổng giá trị' }]}
                      className="mb-0 [&_.ant-form-item-label]:h-6 [&_.ant-form-item-label]:leading-6 [&_.ant-form-item-label]:mb-1"
                    >
                      <InputNumber<number>
                        className="w-full font-mono text-base font-bold text-[#784e34]"
                        style={{ width: '100%' }}
                        controls={false}
                        min={0}
                        suffix={<span className="text-slate-400 font-sans text-xs">đ</span>}
                        formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(val) => (val ? Number(val.replace(/\$\s?|(,*)/g, '')) : 0)}
                        placeholder="0"
                        onChange={(val) => {
                          const total = val || 0;
                          const pct = form.getFieldValue('depositPercent');
                          const usePct = pct !== undefined && pct !== null ? Number(pct) : settingDepositPercent;
                          form.setFieldsValue({
                            depositAmount: Math.round(total * (usePct / 100)),
                          });
                        }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      label={
                        <span className="whitespace-nowrap text-xs font-semibold text-slate-700 flex items-center gap-1">
                          Tỷ lệ đặt cọc
                          <Tooltip title={`Tỷ lệ cọc mặc định từ Cài đặt hệ thống là ${settingDepositPercent}%. Bạn có thể chọn các mức cọc bên dưới hoặc tự nhập số % tuỳ ý.`}>
                            <InfoCircleOutlined className="text-slate-400 text-xs" />
                          </Tooltip>
                        </span>
                      }
                      name="depositPercent"
                      className="mb-0 [&_.ant-form-item-label]:h-6 [&_.ant-form-item-label]:leading-6 [&_.ant-form-item-label]:mb-1"
                    >
                      <InputNumber<number>
                        className="w-full font-mono text-base font-bold text-blue-700"
                        style={{ width: '100%' }}
                        min={0}
                        max={100}
                        controls={false}
                        suffix={<span className="text-slate-400 font-sans text-xs">%</span>}
                        placeholder={String(settingDepositPercent)}
                        onChange={(pctVal) => {
                          const pct = pctVal !== null && pctVal !== undefined ? Number(pctVal) : 0;
                          const total = form.getFieldValue('value') || 0;
                          form.setFieldsValue({
                            depositAmount: Math.round(total * (pct / 100)),
                          });
                        }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      label={<span className="whitespace-nowrap text-xs font-semibold text-slate-700">Số tiền đặt cọc</span>}
                      name="depositAmount"
                      className="mb-0 [&_.ant-form-item-label]:h-6 [&_.ant-form-item-label]:leading-6 [&_.ant-form-item-label]:mb-1"
                    >
                      <InputNumber<number>
                        className="w-full font-mono text-base font-bold text-emerald-700"
                        style={{ width: '100%' }}
                        controls={false}
                        min={0}
                        suffix={<span className="text-slate-400 font-sans text-xs">đ</span>}
                        formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(val) => (val ? Number(val.replace(/\$\s?|(,*)/g, '')) : 0)}
                        placeholder="0"
                        onChange={(amtVal) => {
                          const amt = amtVal || 0;
                          const total = form.getFieldValue('value') || 0;
                          const calculatedPct = total > 0 ? Math.round((amt / total) * 100) : 0;
                          form.setFieldsValue({
                            depositPercent: calculatedPct,
                          });
                        }}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                {/* Hàng 2: Chọn nhanh mức cọc theo hàng ngang đồng đều */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Mức cọc nhanh:</span>
                    <span className="text-slate-600 font-mono text-xs">
                      Tỷ lệ đang chọn:{' '}
                      <strong className="text-[#784e34] font-bold">
                        {currentDepositPercent}%
                      </strong>
                    </span>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 w-full">
                    {depositPresets.map((preset) => {
                      const isSelected = currentDepositPercent === preset.percent;
                      return (
                        <Button
                          key={preset.percent}
                          size="small"
                          type={isSelected ? 'primary' : 'default'}
                          className={
                            isSelected
                              ? '!bg-[#784e34] hover:!bg-[#633e28] !border-[#784e34] font-bold text-white shadow-sm ring-2 ring-[#784e34]/30 w-full text-center px-1'
                              : 'bg-white text-slate-700 hover:text-[#784e34] hover:border-[#784e34] font-medium transition-all w-full text-center px-1'
                          }
                          onClick={() => {
                            const total = form.getFieldValue('value') || 0;
                            const amount = Math.round(total * (preset.percent / 100));
                            form.setFieldsValue({
                              depositPercent: preset.percent,
                              depositAmount: amount,
                            });
                          }}
                        >
                          <span className="text-[11px] truncate">{preset.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Hàng 3: Hình thức thanh toán & Còn phải thu ngang hàng nhau */}
                <Row gutter={12} className="items-end pt-1">
                  <Col span={12}>
                    <Form.Item
                      label={<span className="whitespace-nowrap text-xs font-semibold text-slate-700">Hình thức thanh toán</span>}
                      name="paymentMethod"
                      className="mb-0 [&_.ant-form-item-label]:h-6 [&_.ant-form-item-label]:leading-6 [&_.ant-form-item-label]:mb-1"
                    >
                      <Select
                        className="w-full"
                        options={[
                          { value: 'VietQR', label: '💳 VietQR (Chuyển khoản)' },
                          { value: 'Tiền mặt', label: '💵 Tiền mặt (Cash)' },
                          { value: 'POS', label: '🏧 Thẻ ngân hàng / POS' },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <div className="flex items-center justify-between px-3 h-[32px] rounded-lg bg-emerald-50/90 border border-emerald-200 text-xs font-medium">
                      <span className="text-slate-600">Còn phải thu khi giao:</span>
                      <span className="font-mono font-bold text-emerald-800 text-sm">
                        {Math.max(0, (currentTotalValue || 0) - (currentDepositAmount || 0)).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </Col>
                </Row>

                {/* Hiển thị Mã VietQR Thật khi chọn phương thức VietQR */}
                {currentPaymentMethod === 'VietQR' && (
                  <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-50/90 via-slate-50 to-amber-50/50 border border-emerald-200 shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between pb-1.5 border-b border-emerald-200/60">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900">
                        <QrcodeOutlined className="text-emerald-600 text-sm" />
                        <span>Mã VietQR thanh toán tự động (Thiết lập tại Cài đặt)</span>
                      </div>
                      {paymentConfig?.bankName && (
                        <Tag color="cyan" className="font-mono m-0 text-[10px]">
                          {paymentConfig.bankName}
                        </Tag>
                      )}
                    </div>

                    {(paymentConfig?.accountNumber || paymentConfig?.bankAccountNumber) ? (
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <div className="flex-shrink-0 bg-white p-2 rounded-lg border border-emerald-200 shadow-xs flex items-center justify-center">
                          <VietQrCard
                            bankName={paymentConfig?.bankName || 'MB Bank'}
                            accountNumber={paymentConfig?.accountNumber || paymentConfig?.bankAccountNumber || ''}
                            accountName={paymentConfig?.accountName || paymentConfig?.bankAccountName || ''}
                            paymentPrefix={paymentConfig?.paymentPrefix || 'D2L'}
                            orderCode={currentOrderCode}
                            amount={qrTransferAmount}
                            template={(paymentConfig?.vietQrTemplate as any) || 'compact'}
                            size="small"
                            showDetails={false}
                            className="!max-w-[135px] !p-0 !border-0 !bg-transparent"
                          />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1.5 text-xs w-full">
                          <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1 font-mono text-[11px]">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 font-sans">Ngân hàng:</span>
                              <span className="font-bold text-slate-800">{paymentConfig?.bankName || 'MB Bank'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 font-sans">Số tài khoản:</span>
                              <span className="font-bold text-[#784e34]">{paymentConfig?.accountNumber || paymentConfig?.bankAccountNumber}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 font-sans">Chủ tài khoản:</span>
                              <span className="font-bold text-slate-800 uppercase">{paymentConfig?.accountName || paymentConfig?.bankAccountName}</span>
                            </div>
                            <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                              <span className="text-slate-500 font-sans">Số tiền cọc:</span>
                              <span className="font-bold text-emerald-700 text-xs">
                                {qrTransferAmount.toLocaleString('vi-VN')} đ {currentDepositAmount > 0 ? `(Cọc ${currentTotalValue > 0 ? Math.round((currentDepositAmount / currentTotalValue) * 100) : 0}%)` : '(Tổng đơn)'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 font-sans">Nội dung CK:</span>
                              <span className="font-bold text-slate-800 bg-amber-100/70 text-amber-900 px-1.5 py-0.5 rounded text-[10px]">
                                {`${paymentConfig?.paymentPrefix || 'D2L'} ${currentOrderCode}`.trim()}
                              </span>
                            </div>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <InfoCircleOutlined className="text-emerald-600" />
                            <span>Mã VietQR đã gán sẵn số tiền {qrTransferAmount.toLocaleString('vi-VN')} đ và cú pháp để khách chuyển khoản tức thì.</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ExclamationCircleOutlined className="text-amber-600" />
                          <span>Chưa cấu hình tài khoản ngân hàng trong tab <strong>Cài đặt &gt; Thanh toán</strong>.</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </Form>
          </Drawer>
        </div>
  );
}
