import { AdminBranch } from '@/types/admin';
import { cachedFetch, invalidateApiCache } from './shared/apiCache';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface BranchApiResponse<T> {
  success: boolean;
  data: T | null;
  message?: string;
  errors: string[];
}

export interface BranchStats {
  totalBranches: number;
  activeBranches: number;
  totalStaff: number;
  totalArea: number;
  showroomsCount: number;
  warehousesCount: number;
  totalActiveOrders: number;
}

export const branchApi = {
  /**
   * Lấy danh sách chi nhánh từ Backend API (có cache & deduplication)
   */
  async getBranches(params?: {
    search?: string;
    type?: string;
    region?: string;
    status?: string;
    isHeadquarter?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<AdminBranch[]> {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.append('page', String(params.page));
    if (params?.pageSize !== undefined) query.append('pageSize', String(params.pageSize));
    if (params?.search) query.append('search', params.search);
    if (params?.type && params.type !== 'all') query.append('type', params.type);
    if (params?.region && params.region !== 'all') query.append('region', params.region);
    if (params?.status && params.status !== 'all') query.append('status', params.status);
    if (params?.isHeadquarter !== undefined) query.append('isHeadquarter', String(params.isHeadquarter));

    const cacheKey = `branches:${query.toString()}`;
    return cachedFetch(cacheKey, async () => {
      const res = await fetch(`${API_BASE_URL}/api/branches?${query.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch branches: ${res.statusText}`);
      }

      const json: BranchApiResponse<AdminBranch[]> = await res.json();
      return json.data || [];
    });
  },

  /**
   * Lấy thống kê tổng quan các chi nhánh
   */
  async getStats(): Promise<BranchStats | null> {
    const res = await fetch(`${API_BASE_URL}/api/branches/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch branch stats: ${res.statusText}`);
    }

    const json: BranchApiResponse<BranchStats> = await res.json();
    return json.data;
  },

  /**
   * Lấy chi tiết một chi nhánh theo ID
   */
  async getBranchById(id: string): Promise<AdminBranch | null> {
    const res = await fetch(`${API_BASE_URL}/api/branches/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch branch detail: ${res.statusText}`);
    }

    const json: BranchApiResponse<AdminBranch> = await res.json();
    return json.data;
  },

  /**
   * Tạo chi nhánh mới
   */
  async createBranch(payload: Partial<AdminBranch>): Promise<AdminBranch> {
    const res = await fetch(`${API_BASE_URL}/api/branches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.message || `Tạo chi nhánh thất bại: ${res.statusText}`);
    }

    const json: BranchApiResponse<AdminBranch> = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.message || 'Tạo chi nhánh thất bại.');
    }

    invalidateApiCache('branches');
    return json.data;
  },

  /**
   * Cập nhật thông tin chi nhánh
   */
  async updateBranch(id: string, payload: Partial<AdminBranch>): Promise<AdminBranch> {
    const res = await fetch(`${API_BASE_URL}/api/branches/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.message || `Cập nhật chi nhánh thất bại: ${res.statusText}`);
    }

    const json: BranchApiResponse<AdminBranch> = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.message || 'Cập nhật chi nhánh thất bại.');
    }

    invalidateApiCache('branches');
    return json.data;
  },

  /**
   * Cập nhật trạng thái chi nhánh (Active / Inactive)
   */
  async updateStatus(id: string, status: 'active' | 'inactive'): Promise<AdminBranch> {
    const res = await fetch(`${API_BASE_URL}/api/branches/${id}/status`, {
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

    const json: BranchApiResponse<AdminBranch> = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.message || 'Cập nhật trạng thái thất bại.');
    }

    invalidateApiCache('branches');
    return json.data;
  },

  /**
   * Xóa mềm chi nhánh
   */
  async deleteBranch(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/branches/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.message || `Xóa chi nhánh thất bại: ${res.statusText}`);
    }

    invalidateApiCache('branches');
    const json: BranchApiResponse<boolean> = await res.json();
    return json.success;
  },

  /**
   * Khôi phục chi nhánh đã bị xóa mềm
   */
  async restoreBranch(id: string): Promise<AdminBranch> {
    const res = await fetch(`${API_BASE_URL}/api/branches/${id}/restore`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.message || `Khôi phục chi nhánh thất bại: ${res.statusText}`);
    }

    invalidateApiCache('branches');
    const json: BranchApiResponse<AdminBranch> = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.message || 'Khôi phục chi nhánh thất bại.');
    }

    return json.data;
  },
};
