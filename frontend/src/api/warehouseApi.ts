import { AdminWarehouse } from '@/types/admin';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface WarehouseApiResponse<T> {
  success: boolean;
  data: T | null;
  message?: string;
  errors: string[];
}

export interface WarehouseStats {
  totalWarehouses: number;
  activeWarehouses: number;
  totalCapacity: number;
  currentCapacity: number;
  averageOccupancyPercent: number;
  totalInventoryValue: number;
  showroomCount: number;
  transitCount: number;
  finishedCount: number;
}

export const warehouseApi = {
  /**
   * Lấy danh sách kho / showroom từ Backend API
   */
  async getWarehouses(params?: {
    search?: string;
    branch?: string;
    type?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<AdminWarehouse[]> {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.append('page', String(params.page));
    if (params?.pageSize !== undefined) query.append('pageSize', String(params.pageSize));
    if (params?.search) query.append('search', params.search);
    if (params?.branch && params.branch !== 'all') query.append('branch', params.branch);
    if (params?.type && params.type !== 'all') query.append('type', params.type);
    if (params?.status && params.status !== 'all') query.append('status', params.status);

    const res = await fetch(`${API_BASE_URL}/api/warehouses?${query.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch warehouses: ${res.statusText}`);
    }

    const json: WarehouseApiResponse<AdminWarehouse[]> = await res.json();
    return json.data || [];
  },

  /**
   * Lấy thống kê tổng quan kho bãi
   */
  async getStats(): Promise<WarehouseStats | null> {
    const res = await fetch(`${API_BASE_URL}/api/warehouses/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch warehouse stats: ${res.statusText}`);
    }

    const json: WarehouseApiResponse<WarehouseStats> = await res.json();
    return json.data;
  },

  /**
   * Lấy chi tiết một kho theo ID
   */
  async getWarehouseById(id: string): Promise<AdminWarehouse | null> {
    const res = await fetch(`${API_BASE_URL}/api/warehouses/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch warehouse detail: ${res.statusText}`);
    }

    const json: WarehouseApiResponse<AdminWarehouse> = await res.json();
    return json.data;
  },

  /**
   * Tạo kho hàng mới
   */
  async createWarehouse(payload: Partial<AdminWarehouse>): Promise<AdminWarehouse> {
    const res = await fetch(`${API_BASE_URL}/api/warehouses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.message || `Tạo kho hàng thất bại: ${res.statusText}`);
    }

    const json: WarehouseApiResponse<AdminWarehouse> = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.message || 'Tạo kho hàng thất bại.');
    }

    return json.data;
  },

  /**
   * Cập nhật thông tin kho hàng
   */
  async updateWarehouse(id: string, payload: Partial<AdminWarehouse>): Promise<AdminWarehouse> {
    const res = await fetch(`${API_BASE_URL}/api/warehouses/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.message || `Cập nhật kho hàng thất bại: ${res.statusText}`);
    }

    const json: WarehouseApiResponse<AdminWarehouse> = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.message || 'Cập nhật kho hàng thất bại.');
    }

    return json.data;
  },

  /**
   * Cập nhật trạng thái kho (Active / Inactive)
   */
  async updateStatus(id: string, status: 'active' | 'inactive'): Promise<AdminWarehouse> {
    const res = await fetch(`${API_BASE_URL}/api/warehouses/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.message || `Cập nhật trạng thái thất bại: ${res.statusText}`);
    }

    const json: WarehouseApiResponse<AdminWarehouse> = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.message || 'Cập nhật trạng thái thất bại.');
    }

    return json.data;
  },

  /**
   * Xóa mềm kho hàng
   */
  async deleteWarehouse(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/warehouses/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.message || `Xóa kho hàng thất bại: ${res.statusText}`);
    }

    const json: WarehouseApiResponse<boolean> = await res.json();
    return json.success;
  },

  /**
   * Khôi phục kho hàng đã bị xóa mềm
   */
  async restoreWarehouse(id: string): Promise<AdminWarehouse> {
    const res = await fetch(`${API_BASE_URL}/api/warehouses/${id}/restore`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.message || `Khôi phục kho hàng thất bại: ${res.statusText}`);
    }

    const json: WarehouseApiResponse<AdminWarehouse> = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.message || 'Khôi phục kho hàng thất bại.');
    }

    return json.data;
  },
};
