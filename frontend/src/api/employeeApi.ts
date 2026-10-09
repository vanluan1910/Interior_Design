import type { AdminEmployee } from '@/types/admin';

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
    try {
      const sp = new URLSearchParams();
      if (params?.search) sp.append('search', params.search);
      if (params?.department && params.department !== 'all') sp.append('department', params.department);
      if (params?.branch && params.branch !== 'all') sp.append('branch', params.branch);
      if (params?.role && params.role !== 'all') sp.append('role', params.role);
      if (params?.status && params.status !== 'all') sp.append('status', params.status);
      if (params?.page) sp.append('page', params.page.toString());
      if (params?.pageSize) sp.append('pageSize', params.pageSize.toString());
      if (params?.includeDeleted) sp.append('includeDeleted', 'true');

      const url = `${API_BASE_URL}/api/employees${sp.toString() ? `?${sp.toString()}` : ''}`;
      const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
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
  },

  getEmployeeById: async (id: string): Promise<AdminEmployee | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/employees/${id}`, {
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Thêm nhân viên thất bại');
      }
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Cập nhật nhân viên thất bại');
      }
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
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) return false;
      return true;
    } catch {
      return false;
    }
  },

  updateStatus: async (id: string, status: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/employees/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) return false;
      return true;
    } catch {
      return false;
    }
  },

  resetPassword: async (id: string, newPassword: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/employees/${id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
