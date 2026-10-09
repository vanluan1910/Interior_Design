import { OrderRow } from '@/types/admin';

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
  items?: any[];
  shippingAddress?: string;
  customerAddress?: string;
  customerProvince?: string;
  customerDistrict?: string;
  city?: string;
  district?: string;
  customerEmail?: string;
  note?: string;
  paymentMethod?: string;
  paymentStatus?: string;
}

export const orderApi = {
  /**
   * Lấy danh sách đơn hàng từ Backend API
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
  }): Promise<OrderRow[]> {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.append('page', String(params.page));
    if (params?.pageSize !== undefined) query.append('pageSize', String(params.pageSize));
    if (params?.search) query.append('search', params.search);
    if (params?.status && params.status !== 'all') query.append('status', params.status);
    if (params?.orderType && params.orderType !== 'all') query.append('orderType', params.orderType);
    if (params?.branch && params.branch !== 'all') query.append('branch', params.branch);
    if (params?.spaceType && params.spaceType !== 'all') query.append('spaceType', params.spaceType);
    if (params?.woodType && params.woodType !== 'all') query.append('woodType', params.woodType);
    if (params?.fromDate) query.append('fromDate', params.fromDate);
    if (params?.toDate) query.append('toDate', params.toDate);
    if (params?.includeDeleted) query.append('includeDeleted', 'true');

    const res = await fetch(`${API_BASE_URL}/api/orders?${query.toString()}`, {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch orders (${res.status})`);
    }

    const json: OrderApiResponse<OrderRow[]> = await res.json();
    return json.data || [];
  },

  /**
   * Lấy thống kê tổng quan đơn hàng
   */
  async getStats(): Promise<OrderStats> {
    const res = await fetch(`${API_BASE_URL}/api/orders/stats`, {
      headers: { Accept: 'application/json' },
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
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch order details (${res.status})`);
    }

    const json: OrderApiResponse<OrderRow> = await res.json();
    return json.data;
  },

  /**
   * Tạo mới đơn hàng
   */
  async createOrder(payload: CreateOrderPayload): Promise<OrderRow> {
    const res = await fetch(`${API_BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || `Thêm đơn hàng thất bại (${res.status})`);
    }

    const json: OrderApiResponse<OrderRow> = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.message || 'Thêm đơn hàng thất bại.');
    }

    return json.data;
  },

  /**
   * Cập nhật đơn hàng
   */
  async updateOrder(id: string, payload: CreateOrderPayload): Promise<OrderRow> {
    const res = await fetch(`${API_BASE_URL}/api/orders/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || `Cập nhật đơn hàng thất bại (${res.status})`);
    }

    const json: OrderApiResponse<OrderRow> = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.message || 'Cập nhật đơn hàng thất bại.');
    }

    return json.data;
  },

  /**
   * Cập nhật trạng thái đơn hàng
   */
  async updateOrderStatus(id: string, status: string, note?: string): Promise<OrderRow> {
    const res = await fetch(`${API_BASE_URL}/api/orders/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ status, note }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || `Cập nhật trạng thái đơn hàng thất bại (${res.status})`);
    }

    const json: OrderApiResponse<OrderRow> = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.message || 'Cập nhật trạng thái đơn hàng thất bại.');
    }

    return json.data;
  },

  /**
   * Cập nhật trạng thái thanh toán
   */
  async updatePaymentStatus(id: string, paymentStatus: string, paidAmount?: number, paymentMethod?: string): Promise<OrderRow> {
    const res = await fetch(`${API_BASE_URL}/api/orders/${id}/payment-status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
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

    return json.data;
  },

  /**
   * Cập nhật trạng thái hàng loạt
   */
  async bulkUpdateStatus(orderIds: string[], status: string, note?: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/orders/bulk-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ orderIds, status, note }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || `Cập nhật trạng thái hàng loạt thất bại (${res.status})`);
    }

    const json: OrderApiResponse<boolean> = await res.json();
    return Boolean(json.data ?? json.success);
  },

  /**
   * Xóa đơn hàng (Soft Delete)
   */
  async deleteOrder(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/orders/${id}`, {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || `Xóa đơn hàng thất bại (${res.status})`);
    }

    const json: OrderApiResponse<boolean> = await res.json();
    return Boolean(json.success);
  },
};
