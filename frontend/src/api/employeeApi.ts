import type { AdminEmployee } from '@/types/admin';
import { cachedFetch, invalidateApiCache } from './shared/apiCache';
import { getAuthHeaders } from './shared/authHeaders';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface GetEmployeesParams {
  search?: string;
  department?: string;
  branch?: string;
  role?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  includeDeleted?: boolean;
}

export interface EmployeesResponse {
  items: AdminEmployee[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const employeeApi = {
  getEmployees: async (params?: GetEmployeesParams): Promise<AdminEmployee[]> => {
    const sp = new URLSearchParams();
    if (params?.search) sp.append('search', params.search);
    if (params?.department && params.department !== 'all') sp.append('department', params.department);
    if (params?.branch && params.branch !== 'all') sp.append('branch', params.branch);
    if (params?.role && params.role !== 'all') sp.append('role', params.role);
    if (params?.status && params.status !== 'all') sp.append('status', params.status);
    if (params?.page) sp.append('page', params.page.toString());
    if (params?.pageSize !== undefined) {
      sp.append('pageSize', params.pageSize.toString());
    } else {
      sp.append('pageSize', '0');
    }
    if (params?.includeDeleted) sp.append('includeDeleted', 'true');

    const queryString = sp.toString();
    const cacheKey = `employees:${queryString}`;

    return cachedFetch(cacheKey, async () => {
      try {
        const url = `${API_BASE_URL}/api/employees${queryString ? `?${queryString}` : ''}`;
        const res = await fetch(url, {
          headers: getAuthHeaders(),
        });

        if (!res.ok) return [];
        const json = await res.json();
        if (json?.data?.items) {
          return json.data.items;
        }
        return json.data || [];
      } catch {
        return [];
      }
    });
  },

  getEmployeeById: async (id: string): Promise<AdminEmployee | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/employees/${id}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch {
      return null;
    }
  },

  createEmployee: async (data: Partial<AdminEmployee>): Promise<AdminEmployee> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/employees`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Thêm nhân viên thất bại');
      }
      invalidateApiCache('employees');
      const json = await res.json();
      return json.data;
    } catch (error) {
      console.warn('createEmployee warning:', error);
      throw error;
    }
  },

  updateEmployee: async (id: string, data: Partial<AdminEmployee>): Promise<AdminEmployee> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/employees/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Cập nhật nhân viên thất bại');
      }
      invalidateApiCache('employees');
      const json = await res.json();
      return json.data;
    } catch (error) {
      console.warn('updateEmployee warning:', error);
      throw error;
    }
  },

  deleteEmployee: async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/employees/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) return false;
      invalidateApiCache('employees');
      return true;
    } catch {
      return false;
    }
  },

  updateStatus: async (id: string, status: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/employees/${id}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });
      if (!res.ok) return false;
      invalidateApiCache('employees');
      return true;
    } catch {
      return false;
    }
  },

  resetPassword: async (id: string, newPassword: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/employees/${id}/reset-password`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ newPassword }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Đặt lại mật khẩu thất bại');
      }
      return true;
    } catch (error) {
      console.warn('resetPassword error:', error);
      throw error;
    }
  },
};
