import { AdminCategory } from '@/types/admin';
import { cachedFetch, invalidateApiCache } from './shared/apiCache';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface CategoryStats {
  totalCategories: number;
  activeCategories: number;
  hiddenCategories: number;
  totalProductsAssigned: number;
}

export const categoryApi = {
  /**
   * Lấy danh sách danh mục nhóm hàng (có cache & deduplication)
   */
  async getCategories(params?: {
    search?: string;
    space?: string;
    status?: string;
    includeDeleted?: boolean;
  }): Promise<AdminCategory[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.space && params.space !== 'all') query.append('space', params.space);
    if (params?.status && params.status !== 'all') query.append('status', params.status);
    if (params?.includeDeleted) query.append('includeDeleted', 'true');

    const cacheKey = `categories:${query.toString()}`;
    return cachedFetch(cacheKey, async () => {
      const res = await fetch(`${API_BASE_URL}/api/categories?${query.toString()}`, {
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch categories (${res.status})`);
      }

      const json = await res.json();
      return json.data || [];
    });
  },

  /**
   * Lấy thống kê danh mục nhóm hàng
   */
  async getStats(): Promise<CategoryStats> {
    const res = await fetch(`${API_BASE_URL}/api/categories/stats`, {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch category stats (${res.status})`);
    }

    const json = await res.json();
    return json.data;
  },

  /**
   * Lấy chi tiết 1 danh mục theo ID
   */
  async getCategoryById(id: string): Promise<AdminCategory> {
    const res = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch category with ID ${id}`);
    }

    const json = await res.json();
    return json.data;
  },

  /**
   * Lấy chi tiết 1 danh mục theo đường dẫn Slug
   */
  async getCategoryBySlug(slug: string): Promise<AdminCategory> {
    const res = await fetch(`${API_BASE_URL}/api/categories/slug/${encodeURIComponent(slug)}`, {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch category with slug ${slug}`);
    }

    const json = await res.json();
    return json.data;
  },

  /**
   * Tạo mới danh mục nhóm hàng
   */
  async createCategory(payload: Partial<AdminCategory>): Promise<AdminCategory> {
    const res = await fetch(`${API_BASE_URL}/api/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        code: payload.code,
        name: payload.name,
        slug: payload.slug,
        description: payload.description,
        imageUrl: payload.image || '',
        icon: '',
        space: payload.space,
        spaceId: payload.spaceId,
        displayOrder: payload.displayOrder ?? 1,
        featuredProduct: payload.featuredProduct,
        badge: payload.badge,
        showOnHome: Boolean(payload.showOnHome),
        showOnMenu: Boolean(payload.showOnMenu),
        status: payload.status || 'active',
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || `Failed to create category (${res.status})`);
    }

    invalidateApiCache('categories');
    const json = await res.json();
    return json.data;
  },

  /**
   * Cập nhật danh mục nhóm hàng
   */
  async updateCategory(id: string, payload: Partial<AdminCategory>): Promise<AdminCategory> {
    const res = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        code: payload.code,
        name: payload.name,
        slug: payload.slug,
        description: payload.description,
        imageUrl: payload.image || '',
        icon: '',
        space: payload.space,
        spaceId: payload.spaceId,
        displayOrder: payload.displayOrder ?? 1,
        featuredProduct: payload.featuredProduct,
        badge: payload.badge,
        showOnHome: Boolean(payload.showOnHome),
        showOnMenu: Boolean(payload.showOnMenu),
        status: payload.status || 'active',
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || `Failed to update category (${res.status})`);
    }

    invalidateApiCache('categories');
    const json = await res.json();
    return json.data;
  },

  /**
   * Cập nhật trạng thái hoạt động của danh mục (active/hidden)
   */
  async updateStatus(id: string, status: 'active' | 'hidden'): Promise<AdminCategory> {
    const res = await fetch(`${API_BASE_URL}/api/categories/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || `Failed to update category status (${res.status})`);
    }

    invalidateApiCache('categories');
    const json = await res.json();
    return json.data;
  },

  /**
   * Xóa mềm danh mục nhóm hàng
   */
  async deleteCategory(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || `Failed to delete category (${res.status})`);
    }

    invalidateApiCache('categories');
    const json = await res.json();
    return json.data ?? true;
  },

  /**
   * Khôi phục danh mục đã xóa
   */
  async restoreCategory(id: string): Promise<AdminCategory> {
    const res = await fetch(`${API_BASE_URL}/api/categories/${id}/restore`, {
      method: 'PATCH',
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || `Failed to restore category (${res.status})`);
    }

    invalidateApiCache('categories');
    const json = await res.json();
    return json.data;
  },

  /**
   * Nhập hàng loạt danh mục từ Excel (Upsert)
   */
  async bulkImportCategories(categories: any[]): Promise<{ count: number; message: string }> {
    const res = await fetch(`${API_BASE_URL}/api/categories/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(categories),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || `Nhập danh mục từ Excel thất bại (${res.status})`);
    }

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.message || 'Nhập danh mục từ Excel thất bại.');
    }

    invalidateApiCache('categories');
    return {
      count: json.data || categories.length,
      message: json.message || `Đã nhập thành công ${json.data || categories.length} danh mục!`,
    };
  },

  /**
   * Dọn dẹp, gộp các danh mục trùng tên và chuẩn hóa mã NH01, NH02...
   */
  async cleanupCategories(): Promise<{ count: number; message: string }> {
    const res = await fetch(`${API_BASE_URL}/api/categories/cleanup`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || `Dọn dẹp danh mục thất bại (${res.status})`);
    }

    invalidateApiCache('categories');
    const json = await res.json();
    return {
      count: json.data || 0,
      message: json.message || 'Đã chuẩn hóa và gộp danh mục thành công!',
    };
  },
};
