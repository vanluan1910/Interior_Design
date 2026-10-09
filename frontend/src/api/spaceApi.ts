import { AdminSpace } from '@/types/admin';
import { cachedFetch, invalidateApiCache } from './shared/apiCache';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface SpaceStats {
  totalSpaces: number;
  activeSpaces: number;
  hiddenSpaces: number;
  totalLinkedCategories: number;
}

export interface SpaceDetailCategory {
  id: string;
  code: string;
  name: string;
  slug: string;
  image?: string;
  productCount: number;
}

export interface SpaceDetailResponse {
  space: {
    id?: string;
    key: string;
    name: string;
    tagline: string;
    description: string;
    imageUrl: string;
    countText: string;
    codeLabel: string;
    colSpan: number;
    linkUrl: string;
  };
  categories: SpaceDetailCategory[];
  materials: string[];
  featuredProducts: any[];
  products: any[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const spaceApi = {
  /**
   * Lấy chi tiết và danh mục, sản phẩm Không Gian Phòng Khách
   */
  async getLivingRoomSpace(params?: {
    search?: string;
    categoryId?: string;
    material?: string;
    sortBy?: string;
    page?: number;
    pageSize?: number;
  }): Promise<SpaceDetailResponse> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.categoryId) query.append('categoryId', params.categoryId);
    if (params?.material) query.append('material', params.material);
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());

    const cacheKey = `space:living-room:${query.toString()}`;
    return cachedFetch(cacheKey, async () => {
      const res = await fetch(`${API_BASE_URL}/api/spaces/living-room?${query.toString()}`, {
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch living room space (${res.status})`);
      }

      const json = await res.json();
      return json.data;
    });
  },

  /**
   * Lấy chi tiết không gian theo Slug (living, bedroom, dining, office...)
   */
  async getSpaceBySlug(
    slug: string,
    params?: {
      search?: string;
      categoryId?: string;
      material?: string;
      sortBy?: string;
      page?: number;
      pageSize?: number;
    }
  ): Promise<SpaceDetailResponse> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.categoryId) query.append('categoryId', params.categoryId);
    if (params?.material) query.append('material', params.material);
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());

    const cacheKey = `space:slug:${slug}:${query.toString()}`;
    return cachedFetch(cacheKey, async () => {
      const res = await fetch(`${API_BASE_URL}/api/spaces/slug/${slug}?${query.toString()}`, {
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch space ${slug} (${res.status})`);
      }

      const json = await res.json();
      return json.data;
    });
  },
  /**
   * Lấy danh sách không gian nội thất (có cache & deduplication)
   */
  async getSpaces(params?: {
    search?: string;
    status?: string;
    includeDeleted?: boolean;
  }): Promise<AdminSpace[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status && params.status !== 'all') query.append('status', params.status);
    if (params?.includeDeleted) query.append('includeDeleted', 'true');

    const cacheKey = `spaces:${query.toString()}`;
    return cachedFetch(cacheKey, async () => {
      const res = await fetch(`${API_BASE_URL}/api/spaces?${query.toString()}`, {
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch spaces (${res.status})`);
      }

      const json = await res.json();
      return json.data || [];
    });
  },

  /**
   * Lấy thống kê không gian nội thất
   */
  async getStats(): Promise<SpaceStats> {
    const res = await fetch(`${API_BASE_URL}/api/spaces/stats`, {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch space stats (${res.status})`);
    }

    const json = await res.json();
    return json.data;
  },

  /**
   * Lấy chi tiết 1 không gian theo ID
   */
  async getSpaceById(id: string): Promise<AdminSpace> {
    const res = await fetch(`${API_BASE_URL}/api/spaces/${id}`, {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch space with ID ${id}`);
    }

    const json = await res.json();
    return json.data;
  },

  /**
   * Tạo mới không gian nội thất
   */
  async createSpace(payload: Partial<AdminSpace>): Promise<AdminSpace> {
    const res = await fetch(`${API_BASE_URL}/api/spaces`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        code: payload.code,
        name: payload.name,
        slug: payload.slug,
        tagline: payload.tagline,
        description: payload.description,
        image: payload.image,
        icon: payload.icon,
        displayOrder: payload.displayOrder ?? 1,
        status: payload.status || 'active',
        showOnHome: Boolean(payload.showOnHome),
        showOnHeader: Boolean(payload.showOnHeader),
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || `Failed to create space (${res.status})`);
    }

    invalidateApiCache('spaces');
    const json = await res.json();
    return json.data;
  },

  /**
   * Nhập hàng loạt không gian từ file Excel
   */
  async bulkImportSpaces(spaces: any[]): Promise<{ count: number; message: string }> {
    const res = await fetch(`${API_BASE_URL}/api/spaces/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(spaces),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || `Failed to bulk import spaces (${res.status})`);
    }

    invalidateApiCache('spaces');
    const json = await res.json();
    return {
      count: json.data,
      message: json.message,
    };
  },

  /**
   * Cập nhật thông tin không gian nội thất
   */
  async updateSpace(id: string, payload: Partial<AdminSpace>): Promise<AdminSpace> {
    const res = await fetch(`${API_BASE_URL}/api/spaces/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        code: payload.code,
        name: payload.name,
        slug: payload.slug,
        tagline: payload.tagline,
        description: payload.description,
        image: payload.image,
        icon: payload.icon,
        displayOrder: payload.displayOrder ?? 1,
        status: payload.status || 'active',
        showOnHome: Boolean(payload.showOnHome),
        showOnHeader: Boolean(payload.showOnHeader),
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || `Failed to update space (${res.status})`);
    }

    invalidateApiCache('spaces');
    const json = await res.json();
    return json.data;
  },

  /**
   * Cập nhật trạng thái không gian (active/hidden)
   */
  async updateStatus(id: string, status: 'active' | 'hidden'): Promise<AdminSpace> {
    const res = await fetch(`${API_BASE_URL}/api/spaces/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || `Failed to update space status (${res.status})`);
    }

    invalidateApiCache('spaces');
    const json = await res.json();
    return json.data;
  },

  /**
   * Xóa mềm không gian nội thất
   */
  async deleteSpace(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/spaces/${id}`, {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || `Failed to delete space (${res.status})`);
    }

    invalidateApiCache('spaces');
    const json = await res.json();
    return json.data ?? true;
  },

  /**
   * Khôi phục không gian nội thất đã xóa
   */
  async restoreSpace(id: string): Promise<AdminSpace> {
    const res = await fetch(`${API_BASE_URL}/api/spaces/${id}/restore`, {
      method: 'PATCH',
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || `Failed to restore space (${res.status})`);
    }

    invalidateApiCache('spaces');
    const json = await res.json();
    return json.data;
  },
};
