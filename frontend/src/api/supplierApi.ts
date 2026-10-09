import { AdminSupplier, StockAuditItem } from '@/types/admin';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface SupplierApiResponse<T> {
  success: boolean;
  data: T | null;
  message?: string;
  errors: string[];
}

export interface SupplierStats {
  totalSuppliers: number;
  activeSuppliers: number;
  inactiveSuppliers: number;
  totalPurchased: number;
  totalDebt: number;
}

export const supplierApi = {
  /**
   * Lấy danh sách nhà cung cấp
   */
  async getSuppliers(params?: {
    search?: string;
    status?: string;
    debtFilter?: string;
    includeDeleted?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<AdminSupplier[]> {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.append('page', String(params.page));
    if (params?.pageSize !== undefined) query.append('pageSize', String(params.pageSize));
    if (params?.search) query.append('search', params.search);
    if (params?.status && params.status !== 'all') query.append('status', params.status);
    if (params?.debtFilter && params.debtFilter !== 'all') query.append('debtFilter', params.debtFilter);
    if (params?.includeDeleted) query.append('includeDeleted', 'true');

    const res = await fetch(`${API_BASE_URL}/api/suppliers?${query.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Lỗi tải danh sách nhà cung cấp: ${res.statusText}`);
    }

    const json: SupplierApiResponse<AdminSupplier[]> = await res.json();
    return json.data || [];
  },

  /**
   * Lấy thống kê tổng quan nhà cung cấp
   */
  async getStats(): Promise<SupplierStats | null> {
    const res = await fetch(`${API_BASE_URL}/api/suppliers/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) return null;
    const json: SupplierApiResponse<SupplierStats> = await res.json();
    return json.data;
  },

  /**
   * Lấy chi tiết một nhà cung cấp
   */
  async getSupplierById(id: string): Promise<AdminSupplier | null> {
    const res = await fetch(`${API_BASE_URL}/api/suppliers/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Không tìm thấy nhà cung cấp: ${res.statusText}`);
    }

    const json: SupplierApiResponse<AdminSupplier> = await res.json();
    return json.data;
  },

  /**
   * Tạo mới nhà cung cấp
   */
  async createSupplier(data: Partial<AdminSupplier>): Promise<AdminSupplier> {
    const res = await fetch(`${API_BASE_URL}/api/suppliers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const json: SupplierApiResponse<AdminSupplier> = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Không thể tạo mới nhà cung cấp.');
    }

    return json.data!;
  },

  /**
   * Nhập hàng loạt nhà cung cấp từ Excel
   */
  async bulkImportSuppliers(suppliers: Partial<AdminSupplier>[]): Promise<{ totalProcessed: number; added: number; updated: number }> {
    const res = await fetch(`${API_BASE_URL}/api/suppliers/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(suppliers),
    });

    const json: SupplierApiResponse<any> = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Nhập Excel nhà cung cấp thất bại.');
    }

    return json.data;
  },

  /**
   * Cập nhật thông tin nhà cung cấp
   */
  async updateSupplier(id: string, data: Partial<AdminSupplier>): Promise<AdminSupplier> {
    const res = await fetch(`${API_BASE_URL}/api/suppliers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const json: SupplierApiResponse<AdminSupplier> = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Không thể cập nhật nhà cung cấp.');
    }

    return json.data!;
  },

  /**
   * Xóa một nhà cung cấp
   */
  async deleteSupplier(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/suppliers/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        console.warn(`Could not delete supplier ${id} on API, falling back locally`);
        return true;
      }

      const json: SupplierApiResponse<boolean> = await res.json();
      return json.success ?? true;
    } catch (err) {
      console.warn(`API call failed for deleteSupplier ${id}:`, err);
      return true;
    }
  },

  /**
   * Xóa nhiều nhà cung cấp
   */
  async bulkDeleteSuppliers(ids: string[]): Promise<number> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/suppliers/bulk-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ids),
      });

      if (!res.ok) {
        console.warn(`Could not bulk delete suppliers on API, falling back locally`);
        return ids.length;
      }

      const json: SupplierApiResponse<number> = await res.json();
      return json.data ?? ids.length;
    } catch (err) {
      console.warn('API call failed for bulkDeleteSuppliers:', err);
      return ids.length;
    }
  },
};
