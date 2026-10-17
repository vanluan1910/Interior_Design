import type { AdminRole, PermissionGroup } from '@/types/admin';
import { cachedFetch, invalidateApiCache } from './shared/apiCache';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface GetRolesParams {
  search?: string;
  status?: string;
  includeDeleted?: boolean;
}

export const roleApi = {
  getRoles: async (params?: GetRolesParams): Promise<AdminRole[]> => {
    const sp = new URLSearchParams();
    if (params?.search) sp.append('search', params.search);
    if (params?.status && params.status !== 'all') sp.append('status', params.status);
    if (params?.includeDeleted) sp.append('includeDeleted', 'true');

    const queryString = sp.toString();
    const cacheKey = `roles:${queryString}`;

    return cachedFetch(cacheKey, async () => {
      try {
        const url = `${API_BASE_URL}/api/roles${queryString ? `?${queryString}` : ''}`;
        const res = await fetch(url, {
          headers: { 'Content-Type': 'application/json' },
        });

        if (!res.ok) return [];
        const json = await res.json();
        return json.data || [];
      } catch {
        return [];
      }
    });
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
    return cachedFetch('permissions_catalog', async () => {
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
    });
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
    invalidateApiCache('roles');
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
    invalidateApiCache('roles');
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
    invalidateApiCache('roles');
    invalidateApiCache('permissions_catalog');
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
    invalidateApiCache('roles');
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
    invalidateApiCache('roles');
    return json.data === true;
  },
};
