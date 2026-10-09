import { AdminUom } from '@/types/admin';
import { cachedFetch, invalidateApiCache } from './shared/apiCache';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface UomApiResponse<T> {
  success: boolean;
  data: T | null;
  message?: string;
  errors: string[];
}

export interface UomStats {
  totalUoms: number;
  activeUoms: number;
  defaultUoms: number;
}

export const uomApi = {
  /**
   * Lấy danh sách đơn vị tính (UOM) từ Backend API (có cache & deduplication)
   */
  async getUoms(params?: {
    search?: string;
    status?: string;
    isDefault?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<AdminUom[]> {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.append('page', String(params.page));
    if (params?.pageSize !== undefined) query.append('pageSize', String(params.pageSize));
    if (params?.search) query.append('search', params.search);
    if (params?.status && params.status !== 'all') query.append('status', params.status);
    if (params?.isDefault !== undefined) query.append('isDefault', String(params.isDefault));

    const cacheKey = `uoms:${query.toString()}`;
    return cachedFetch(cacheKey, async () => {
      const res = await fetch(`${API_BASE_URL}/api/uoms?${query.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch UOMs: ${res.statusText}`);
      }

      const json: UomApiResponse<AdminUom[]> = await res.json();
      return json.data || [];
    });
  },

  /**
   * Lấy thống kê tổng quan các đơn vị tính
   */
  async getStats(): Promise<UomStats | null> {
    const res = await fetch(`${API_BASE_URL}/api/uoms/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch UOM stats: ${res.statusText}`);
    }

    const json: UomApiResponse<UomStats> = await res.json();
    return json.data;
  },

  /**
   * Lấy chi tiết một đơn vị tính theo ID
   */
  async getUomById(id: string): Promise<AdminUom | null> {
    const res = await fetch(`${API_BASE_URL}/api/uoms/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch UOM detail: ${res.statusText}`);
    }

    const json: UomApiResponse<AdminUom> = await res.json();
    return json.data;
  },

  /**
   * Tạo đơn vị tính mới
   */
  async createUom(payload: Partial<AdminUom>): Promise<AdminUom> {
    const res = await fetch(`${API_BASE_URL}/api/uoms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.message || `Tạo đơn vị tính thất bại: ${res.statusText}`);
    }

    const json: UomApiResponse<AdminUom> = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.message || 'Tạo đơn vị tính thất bại.');
    }

    invalidateApiCache('uoms');
    return json.data;
  },

  /**
   * Cập nhật thông tin đơn vị tính
   */
  async updateUom(id: string, payload: Partial<AdminUom>): Promise<AdminUom> {
    const res = await fetch(`${API_BASE_URL}/api/uoms/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.message || `Cập nhật đơn vị tính thất bại: ${res.statusText}`);
    }

    const json: UomApiResponse<AdminUom> = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.message || 'Cập nhật đơn vị tính thất bại.');
    }

    invalidateApiCache('uoms');
    return json.data;
  },

  /**
   * Cập nhật trạng thái đơn vị tính (Active / Inactive)
   */
  async updateStatus(id: string, status: 'active' | 'inactive'): Promise<AdminUom> {
    const res = await fetch(`${API_BASE_URL}/api/uoms/${id}/status`, {
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

    const json: UomApiResponse<AdminUom> = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.message || 'Cập nhật trạng thái thất bại.');
    }

    invalidateApiCache('uoms');
    return json.data;
  },

  /**
   * Xóa đơn vị tính
   */
  async deleteUom(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/uoms/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.message || `Xóa đơn vị tính thất bại: ${res.statusText}`);
    }

    invalidateApiCache('uoms');
    const json: UomApiResponse<boolean> = await res.json();
    return json.success;
  },
};
