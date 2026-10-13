import { AdminCustomer } from '@/types/admin';
import { cachedFetch, invalidateApiCache } from './shared/apiCache';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  indivualCount: number;
  organizationCount: number;
  totalDebt: number;
  totalRevenue: number;
}

export interface CustomerApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors: string[];
}

export const customerApi = {
  /**
   * Lấy danh sách khách hàng từ Backend API (kèm bộ nhớ đệm chống trùng lặp request)
   */
  async getCustomers(params?: {
    search?: string;
    status?: string;
    debtFilter?: string;
    branch?: string;
    customerType?: string;
    includeDeleted?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<AdminCustomer[]> {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.append('page', String(params.page));
    if (params?.pageSize !== undefined) query.append('pageSize', String(params.pageSize));
    if (params?.search) query.append('search', params.search);
    if (params?.status && params.status !== 'all') query.append('status', params.status);
    if (params?.debtFilter && params.debtFilter !== 'all') query.append('debtFilter', params.debtFilter);
    if (params?.branch && params.branch !== 'all') query.append('branch', params.branch);
    if (params?.customerType && params.customerType !== 'all') query.append('customerType', params.customerType);
    if (params?.includeDeleted) query.append('includeDeleted', 'true');

    const cacheKey = `customers:${query.toString()}`;
    return cachedFetch(cacheKey, async () => {
      const res = await fetch(`${API_BASE_URL}/api/customers?${query.toString()}`, {
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch customers (${res.status})`);
      }

      const json: CustomerApiResponse<AdminCustomer[]> = await res.json();
      return json.data || [];
    }, 15000);
  },

  /**
   * Lấy thống kê tổng quan khách hàng
   */
  async getStats(): Promise<CustomerStats> {
    const res = await fetch(`${API_BASE_URL}/api/customers/stats`, {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch customer stats (${res.status})`);
    }

    const json: CustomerApiResponse<CustomerStats> = await res.json();
    return json.data;
  },

  /**
   * Lấy thông tin chi tiết một khách hàng
   */
  async getCustomerById(id: string): Promise<AdminCustomer> {
    const res = await fetch(`${API_BASE_URL}/api/customers/${id}`, {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch customer details (${res.status})`);
    }

    const json: CustomerApiResponse<AdminCustomer> = await res.json();
    return json.data;
  },

  /**
   * Thêm mới khách hàng
   */
  async createCustomer(payload: Partial<AdminCustomer>): Promise<AdminCustomer> {
    const res = await fetch(`${API_BASE_URL}/api/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || `Thêm khách hàng thất bại (${res.status})`);
    }

    const json: CustomerApiResponse<AdminCustomer> = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.message || 'Thêm khách hàng thất bại.');
    }

    invalidateApiCache('customers');
    return json.data;
  },

  /**
   * Cập nhật thông tin khách hàng
   */
  async updateCustomer(id: string, payload: Partial<AdminCustomer>): Promise<AdminCustomer> {
    const res = await fetch(`${API_BASE_URL}/api/customers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || `Cập nhật khách hàng thất bại (${res.status})`);
    }

    const json: CustomerApiResponse<AdminCustomer> = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.message || 'Cập nhật khách hàng thất bại.');
    }

    invalidateApiCache('customers');
    return json.data;
  },

  /**
   * Xóa khách hàng (Soft Delete)
   */
  async deleteCustomer(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/customers/${id}`, {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || `Xóa khách hàng thất bại (${res.status})`);
    }

    const json: CustomerApiResponse<boolean> = await res.json();
    invalidateApiCache('customers');
    return Boolean(json.success);
  },

  /**
   * Thu nợ nhanh
   */
  async collectDebt(id: string, payload: { amount: number; paymentMethod?: string; note?: string }): Promise<AdminCustomer> {
    const res = await fetch(`${API_BASE_URL}/api/customers/${id}/collect-debt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || `Thu nợ thất bại (${res.status})`);
    }

    const json: CustomerApiResponse<AdminCustomer> = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.message || 'Thu nợ thất bại.');
    }

    invalidateApiCache('customers');
    return json.data;
  },

  /**
   * Nhập hàng loạt khách hàng từ Excel
   */
  async bulkImport(customers: Partial<AdminCustomer>[]): Promise<number> {
    const res = await fetch(`${API_BASE_URL}/api/customers/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(customers),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || `Nhập khách hàng thất bại (${res.status})`);
    }

    const json: CustomerApiResponse<number> = await res.json();
    invalidateApiCache('customers');
    return json.data || customers.length;
  },
};
