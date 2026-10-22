import { OrderRow } from '@/types/admin';
import { cachedFetch, invalidateApiCache } from './shared/apiCache';
import { getAuthHeaders } from './shared/authHeaders';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  totalDeposit: number;
}

export interface OrderApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors: string[];
}

export interface CreateOrderPayload extends Partial<OrderRow> {
  productSku?: string;
  items?: any[];
  shippingAddress?: string;
  customerAddress?: string;
  customerProvince?: string;
  customerDistrict?: string;
  city?: string;
  district?: string;
  customerEmail?: string;
  recipientName?: string;
  recipientPhone?: string;
  note?: string;
  paymentMethod?: string;
  paymentStatus?: string;
}

export function normalizeOrderStatus(rawStatus?: string | null): 'pending' | 'processing' | 'delivering' | 'completed' | 'cancelled' | 'returned' | 'returned_success' {
  if (!rawStatus) return 'pending';
  const s = String(rawStatus).trim().toLowerCase();
  if (s === 'processing' || s === 'inproduction' || s === 'in_production' || s === 'production') {
    return 'processing';
  }
  if (s === 'delivering' || s === 'shipping') {
    return 'delivering';
  }
  if (s === 'completed' || s === 'done' || s === 'finished') {
    return 'completed';
  }
  if (s === 'cancelled' || s === 'canceled') {
    return 'cancelled';
  }
  if (s === 'returned_success' || s === 'return_completed' || s === 'returncompleted' || s === 'returnedsuccess' || s === 'refunded') {
    return 'returned_success';
  }
  if (s === 'returned' || s === 'return' || s === 'returning') {
    return 'returned';
  }
  return 'pending';
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ duyệt',
  processing: 'Đang gia công',
  delivering: 'Đang giao hàng',
  completed: 'Hoàn tất bàn giao',
  cancelled: 'Đã hủy',
  returned: 'Khách trả hàng',
  returned_success: 'Hoàn hàng thành công',
};

export function normalizeOrderRow(order: OrderRow): OrderRow {
  if (!order) return order;
  const status = normalizeOrderStatus(order.status);
  return {
    ...order,
    orderCode: order.orderCode || '',
    customerName: order.customerName || '',
    customerPhone: order.customerPhone || '',
    recipientName: order.recipientName || '',
    recipientPhone: order.recipientPhone || '',
    productName: order.productName || 'Nội thất may đo',
    productSpec: order.productSpec || '',
    woodType: order.woodType || '',
    status,
    statusLabel: ORDER_STATUS_LABELS[status] || order.statusLabel || 'Chờ duyệt',
  };
}

const GUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseApiErrorMessage(err: any, fallbackStatus: number, actionName: string): string {
  if (!err) return `${actionName} (${fallbackStatus})`;
  if (typeof err.message === 'string' && err.message.trim()) return err.message;
  if (err.errors && typeof err.errors === 'object') {
    const errorDetails = Object.values(err.errors).flat().filter(Boolean).join('; ');
    if (errorDetails) return errorDetails;
  }
  if (typeof err.title === 'string' && err.title.trim()) return err.title;
  return `${actionName} (${fallbackStatus})`;
}

function sanitizeOrderPayload(payload: CreateOrderPayload): CreateOrderPayload {
  const sanitized = { ...payload };

  if (sanitized.customerId && !GUID_REGEX.test(sanitized.customerId)) {
    delete sanitized.customerId;
  }
  if (sanitized.productId && !GUID_REGEX.test(sanitized.productId)) {
    delete sanitized.productId;
  }
  if (Array.isArray(sanitized.items)) {
    sanitized.items = sanitized.items.map((item: any) => {
      if (!item) return item;
      const cleanItem = { ...item };
      if (cleanItem.productId && !GUID_REGEX.test(cleanItem.productId)) {
        delete cleanItem.productId;
      }
      return cleanItem;
    });
  }

  return sanitized;
}

export const orderApi = {
  /**
   * Lấy danh sách đơn hàng từ Backend API (kèm bộ nhớ đệm chống trùng lặp request)
   */
  async getOrders(params?: {
    search?: string;
    status?: string;
    orderType?: string;
    branch?: string;
    spaceType?: string;
    woodType?: string;
    fromDate?: string;
    toDate?: string;
    includeDeleted?: boolean;
    page?: number;
    pageSize?: number;
    bypassCache?: boolean;
  }): Promise<OrderRow[]> {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.append('page', String(params.page));
    if (params?.pageSize !== undefined) query.append('pageSize', String(params.pageSize));
    if (params?.search) query.append('search', params.search);
    if (params?.status && params.status !== 'all') {
      query.append('status', normalizeOrderStatus(params.status));
    }
    if (params?.orderType && params.orderType !== 'all') query.append('orderType', params.orderType);
    if (params?.branch && params.branch !== 'all') query.append('branch', params.branch);
    if (params?.spaceType && params.spaceType !== 'all') query.append('spaceType', params.spaceType);
    if (params?.woodType && params.woodType !== 'all') query.append('woodType', params.woodType);
    if (params?.fromDate) query.append('fromDate', params.fromDate);
    if (params?.toDate) query.append('toDate', params.toDate);
    if (params?.includeDeleted) query.append('includeDeleted', 'true');

    if (params?.bypassCache) {
      const res = await fetch(`${API_BASE_URL}/api/orders?${query.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch orders (${res.status})`);
      }
      const json: OrderApiResponse<OrderRow[]> = await res.json();
      return (json.data || []).map(normalizeOrderRow);
    }

    const cacheKey = `orders:${query.toString()}`;
    return cachedFetch(cacheKey, async () => {
      const res = await fetch(`${API_BASE_URL}/api/orders?${query.toString()}`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch orders (${res.status})`);
      }

      const json: OrderApiResponse<OrderRow[]> = await res.json();
      return (json.data || []).map(normalizeOrderRow);
    }, 15000);
  },

  /**
   * Lấy thống kê tổng quan đơn hàng
   */
  async getStats(): Promise<OrderStats> {
    const res = await fetch(`${API_BASE_URL}/api/orders/stats`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch order stats (${res.status})`);
    }

    const json: OrderApiResponse<OrderStats> = await res.json();
    return json.data;
  },

  /**
   * Lấy chi tiết đơn hàng
   */
  async getOrderById(id: string): Promise<OrderRow> {
    const res = await fetch(`${API_BASE_URL}/api/orders/${id}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch order details (${res.status})`);
    }

    const json: OrderApiResponse<OrderRow> = await res.json();
    return normalizeOrderRow(json.data);
  },

  /**
   * Lấy chi tiết đơn hàng theo mã đơn (Order Code)
   */
  async getOrderByCode(code: string): Promise<OrderRow> {
    const res = await fetch(`${API_BASE_URL}/api/orders/by-code/${encodeURIComponent(code)}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch order by code (${res.status})`);
    }

    const json: OrderApiResponse<OrderRow> = await res.json();
    return normalizeOrderRow(json.data);
  },

  /**
   * Tạo mới đơn hàng
   */
  async createOrder(payload: CreateOrderPayload): Promise<OrderRow> {
    const cleanPayload = sanitizeOrderPayload(payload);
    const res = await fetch(`${API_BASE_URL}/api/orders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(cleanPayload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(parseApiErrorMessage(err, res.status, 'Thêm đơn hàng thất bại'));
    }

    const json: OrderApiResponse<OrderRow> = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.message || 'Thêm đơn hàng thất bại.');
    }

    invalidateApiCache('orders');
    return normalizeOrderRow(json.data);
  },

  /**
   * Cập nhật đơn hàng
   */
  async updateOrder(id: string, payload: CreateOrderPayload): Promise<OrderRow> {
    const cleanPayload = sanitizeOrderPayload(payload);
    const res = await fetch(`${API_BASE_URL}/api/orders/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(cleanPayload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(parseApiErrorMessage(err, res.status, 'Cập nhật đơn hàng thất bại'));
    }

    const json: OrderApiResponse<OrderRow> = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.message || 'Cập nhật đơn hàng thất bại.');
    }

    invalidateApiCache('orders');
    return normalizeOrderRow(json.data);
  },

  /**
   * Cập nhật trạng thái đơn hàng
   */
  async updateOrderStatus(id: string, status: string, note?: string): Promise<OrderRow> {
    const res = await fetch(`${API_BASE_URL}/api/orders/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, note }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(parseApiErrorMessage(err, res.status, 'Cập nhật trạng thái đơn hàng thất bại'));
    }

    const json: OrderApiResponse<OrderRow> = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.message || 'Cập nhật trạng thái đơn hàng thất bại.');
    }

    invalidateApiCache('orders');
    return normalizeOrderRow(json.data);
  },

  /**
   * Cập nhật trạng thái thanh toán
   */
  async updatePaymentStatus(id: string, paymentStatus: string, paidAmount?: number, paymentMethod?: string): Promise<OrderRow> {
    const res = await fetch(`${API_BASE_URL}/api/orders/${id}/payment-status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ paymentStatus, paidAmount, paymentMethod }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || `Cập nhật trạng thái thanh toán thất bại (${res.status})`);
    }

    const json: OrderApiResponse<OrderRow> = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.message || 'Cập nhật trạng thái thanh toán thất bại.');
    }

    invalidateApiCache('orders');
    return json.data;
  },

  /**
   * Cập nhật trạng thái hàng loạt
   */
  async bulkUpdateStatus(orderIds: string[], status: string, note?: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/orders/bulk-status`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ orderIds, status, note }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || `Cập nhật trạng thái hàng loạt thất bại (${res.status})`);
    }

    const json: OrderApiResponse<boolean> = await res.json();
    invalidateApiCache('orders');
    return Boolean(json.data ?? json.success);
  },

  /**
   * Xóa đơn hàng (Soft Delete)
   */
  async deleteOrder(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/orders/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || `Xóa đơn hàng thất bại (${res.status})`);
    }

    const json: OrderApiResponse<boolean> = await res.json();
    invalidateApiCache('orders');
    return Boolean(json.success);
  },

  /**
   * Khách hàng gửi yêu cầu đổi trả / hoàn hàng
   */
  async requestOrderReturn(id: string, payload: { reason: string; note?: string; desiredResolution?: string; images?: string[] }): Promise<OrderRow> {
    const res = await fetch(`${API_BASE_URL}/api/orders/${id}/request-return`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || `Gửi yêu cầu hoàn hàng thất bại (${res.status})`);
    }

    const json: OrderApiResponse<OrderRow> = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.message || 'Gửi yêu cầu hoàn hàng thất bại.');
    }

    invalidateApiCache('orders');
    return normalizeOrderRow(json.data);
  },
};
