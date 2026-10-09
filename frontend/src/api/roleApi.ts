import type { AdminRole, PermissionGroup } from '@/types/admin';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface GetRolesParams {
  search?: string;
  status?: string;
  includeDeleted?: boolean;
}

export const roleApi = {
  getRoles: async (params?: GetRolesParams): Promise<AdminRole[]> => {
    try {
      const sp = new URLSearchParams();
      if (params?.search) sp.append('search', params.search);
      if (params?.status && params.status !== 'all') sp.append('status', params.status);
      if (params?.includeDeleted) sp.append('includeDeleted', 'true');

      const url = `${API_BASE_URL}/api/roles${sp.toString() ? `?${sp.toString()}` : ''}`;
      const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    } catch {
      return [];
    }
  },

  getRoleById: async (id: string): Promise<AdminRole | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/roles/${id}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch {
      return null;
    }
  },

  getPermissionsCatalog: async (): Promise<PermissionGroup[]> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/roles/permissions`, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    } catch {
      return [];
    }
  },

  createRole: async (data: Partial<AdminRole> & { templateRoleId?: string }): Promise<AdminRole | null> => {
    const res = await fetch(`${API_BASE_URL}/api/roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Tạo mới vai trò thất bại');
    }
    return json.data;
  },

  updateRole: async (id: string, data: Partial<AdminRole>): Promise<AdminRole | null> => {
    const res = await fetch(`${API_BASE_URL}/api/roles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Cập nhật vai trò thất bại');
    }
    return json.data;
  },

  updateRolePermissions: async (id: string, permissions: string[]): Promise<AdminRole | null> => {
    const res = await fetch(`${API_BASE_URL}/api/roles/${id}/permissions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissions }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Lưu phân quyền thất bại');
    }
    return json.data;
  },

  cloneRole: async (id: string, data?: { newCode?: string; newName?: string; description?: string }): Promise<AdminRole | null> => {
    const res = await fetch(`${API_BASE_URL}/api/roles/${id}/clone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data || {}),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Nhân bản vai trò thất bại');
    }
    return json.data;
  },

  deleteRole: async (id: string): Promise<boolean> => {
    const res = await fetch(`${API_BASE_URL}/api/roles/${id}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Xóa vai trò thất bại');
    }
    return json.data === true;
  },
};
