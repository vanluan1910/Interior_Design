import { FeaturedCatalogProduct } from '@/types/admin';

export type { FeaturedCatalogProduct };

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';


export interface ProductApiResponse<T> {
  success: boolean;
  data: T | null;
  message?: string;
  errors: string[];
}

export interface PagedProductResult {
  items: any[];
  page: number;
  pageSize: number;
  totalItems: number;
}

function mapDtoToCatalogProduct(dto: any): FeaturedCatalogProduct {
  const inStockQty = typeof dto.inStock === 'number' ? dto.inStock : 10;
  let stockType: 'in_stock' | 'low' | 'custom' = 'in_stock';
  if (inStockQty <= 2 && inStockQty > 0) {
    stockType = 'low';
  } else if (dto.status === 'Draft' || inStockQty === 0) {
    stockType = 'custom';
  }

  const imagesList = Array.isArray(dto.images) ? dto.images : [];
  const price = typeof dto.price === 'number' ? dto.price : (Number(dto.price) || 0);
  const rawOriginal = dto.originalPrice !== undefined && dto.originalPrice !== null ? Number(dto.originalPrice) : (dto.costPrice !== undefined ? Number(dto.costPrice) : price);
  const originalPrice = isNaN(rawOriginal) || rawOriginal <= 0 ? price : rawOriginal;

  return {
    id: dto.id || `prod_${Date.now()}`,
    code: dto.sku || dto.code || 'SP0000',
    name: dto.name || '',
    collection: dto.shortDescription || dto.collection || 'Bộ sưu tập gỗ tự nhiên',
    price: price,
    originalPrice: originalPrice,
    costPrice: originalPrice,
    stockNote: `${inStockQty} chiếc`,
    stockType: (dto.stockType as any) || stockType,
    image: dto.mainImageUrl || dto.image || '',
    images: imagesList,
    subImages: imagesList.join('\n'),
    categoryId: dto.categoryId || '',
    categoryName: dto.categoryName || '',
    space: dto.space || 'LivingRoom',
    unit: dto.unit || 'Bộ',
    metaInfo: dto.woodType || dto.material || 'Gỗ Óc Chó FAS',
    description: dto.description || '',
    dimensions: dto.dimensions || '',
    material: dto.material || dto.woodType || '',
    color: dto.color || '',
    warranty: dto.warranty || '',
    shippingNote: dto.shippingNote || '',
  };
}

export const productApi = {
  /**
   * Lấy danh sách sản phẩm từ Backend API (theo tham số phân trang động, không hardcode pageSize)
   */
  async getProducts(params?: {
    search?: string;
    space?: string;
    categoryId?: string;
    status?: string;
    branch?: string;
    page?: number;
    pageSize?: number;
  }): Promise<FeaturedCatalogProduct[]> {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.append('page', String(params.page));
    if (params?.pageSize !== undefined) query.append('pageSize', String(params.pageSize));
    if (params?.search) query.append('search', params.search);
    if (params?.space && params.space !== 'all') query.append('space', params.space);
    if (params?.categoryId && params.categoryId !== 'all') query.append('categoryId', params.categoryId);
    if (params?.status && params.status !== 'all') query.append('status', params.status);
    if (params?.branch && params.branch !== 'all') query.append('branch', params.branch);

    const res = await fetch(`${API_BASE_URL}/api/products?${query.toString()}`, {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch products (${res.status})`);
    }

    const json = await res.json();
    const data = json.data;
    if (data && Array.isArray(data.items)) {
      return data.items.map(mapDtoToCatalogProduct);
    }
    if (Array.isArray(data)) {
      return data.map(mapDtoToCatalogProduct);
    }
    return [];
  },

  /**
   * Lấy danh sách sản phẩm kèm thông tin phân trang (items, totalItems, page, pageSize)
   */
  async getPagedProducts(params?: {
    search?: string;
    space?: string;
    categoryId?: string;
    status?: string;
    branch?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: FeaturedCatalogProduct[]; totalItems: number; page: number; pageSize: number }> {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.append('page', String(params.page));
    if (params?.pageSize !== undefined) query.append('pageSize', String(params.pageSize));
    if (params?.search) query.append('search', params.search);
    if (params?.space && params.space !== 'all') query.append('space', params.space);
    if (params?.categoryId && params.categoryId !== 'all') query.append('categoryId', params.categoryId);
    if (params?.status && params.status !== 'all') query.append('status', params.status);
    if (params?.branch && params.branch !== 'all') query.append('branch', params.branch);

    try {
      const res = await fetch(`${API_BASE_URL}/api/products?${query.toString()}`, {
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        console.warn(`Backend returned status ${res.status} for paged products`);
        return { items: [], totalItems: 0, page: params?.page || 1, pageSize: params?.pageSize || 10 };
      }

      const json = await res.json();
      const data = json.data;
      if (data && Array.isArray(data.items)) {
        return {
          items: data.items.map(mapDtoToCatalogProduct),
          totalItems: data.totalItems ?? data.items.length,
          page: data.page ?? (params?.page || 1),
          pageSize: data.pageSize ?? (params?.pageSize || data.items.length),
        };
      }
      if (Array.isArray(data)) {
        return {
          items: data.map(mapDtoToCatalogProduct),
          totalItems: data.length,
          page: params?.page || 1,
          pageSize: params?.pageSize || data.length,
        };
      }
    } catch (err) {
      console.warn('Backend server is unreachable or offline:', err);
    }
    return { items: [], totalItems: 0, page: params?.page || 1, pageSize: params?.pageSize || 10 };
  },

  /**
   * Lấy chi tiết sản phẩm kèm sản phẩm đồng điệu liên quan theo ID, Slug hoặc SKU
   */
  async getProductDetail(identifier: string, relatedLimit = 4): Promise<{
    product: FeaturedCatalogProduct;
    relatedProducts: FeaturedCatalogProduct[];
  } | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/detail/${encodeURIComponent(identifier)}?relatedLimit=${relatedLimit}`, {
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.product) {
          return {
            product: mapDtoToCatalogProduct(json.data.product),
            relatedProducts: Array.isArray(json.data.relatedProducts)
              ? json.data.relatedProducts.map(mapDtoToCatalogProduct)
              : [],
          };
        }
      }
    } catch (err) {
      console.warn(`Failed to fetch product detail for ${identifier}:`, err);
    }

    // Fallback to single product lookup
    try {
      const single = await this.getProductById(identifier);
      if (single) {
        return {
          product: single,
          relatedProducts: [],
        };
      }
    } catch {}

    return null;
  },

  /**
   * Lấy chi tiết một sản phẩm theo ID hoặc Slug
   */
  async getProductById(id: string): Promise<FeaturedCatalogProduct | null> {
    try {
      const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      const url = isGuid
        ? `${API_BASE_URL}/api/products/${id}`
        : `${API_BASE_URL}/api/products/slug/${encodeURIComponent(id)}`;

      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data) return mapDtoToCatalogProduct(json.data);
      }
    } catch (err) {
      console.warn(`Failed to fetch product with ID/Slug ${id}:`, err);
    }
    return null;
  },

  /**
   * Tạo mới sản phẩm
   */
  async createProduct(payload: Partial<FeaturedCatalogProduct>): Promise<FeaturedCatalogProduct> {
    const rawQty = typeof payload.stockNote === 'string'
      ? parseInt(payload.stockNote.replace(/\D/g, ''), 10)
      : (typeof payload.stockNote === 'number' ? payload.stockNote : 10);
    const parsedQty = isNaN(rawQty) ? 10 : rawQty;

    const subImagesList = Array.isArray(payload.images)
      ? payload.images
      : (typeof payload.subImages === 'string'
          ? payload.subImages.split(/[\n,]/).map((s) => s.trim()).filter(Boolean)
          : []);

    const res = await fetch(`${API_BASE_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        name: payload.name,
        code: payload.code,
        sku: payload.code,
        categoryId: payload.categoryId,
        price: payload.price || 0,
        originalPrice: payload.originalPrice !== undefined ? payload.originalPrice : (payload.costPrice !== undefined ? payload.costPrice : payload.price || 0),
        inStock: parsedQty,
        unit: payload.unit || 'Bộ',
        stockType: payload.stockType,
        shortDescription: payload.collection || '',
        description: payload.description || payload.name || '',
        dimensions: payload.dimensions || '',
        material: payload.material || 'Gỗ Sồi tự nhiên (Ash/Oak)',
        woodType: payload.material || 'Gỗ Sồi tự nhiên',
        color: payload.color || 'Nâu hạt dẻ / tự nhiên (Đa dạng)',
        warranty: payload.warranty || '24 tháng',
        shippingNote: payload.shippingNote || 'Miễn phí giao hàng và lắp đặt toàn quốc.',
        mainImageUrl: payload.image || '',
        images: subImagesList,
        space: payload.space || 'LivingRoom',
        discountPercent: 0,
        isFeatured: false,
        isNew: true,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || `Tạo sản phẩm thất bại (${res.status})`);
    }

    const json = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.message || 'Tạo sản phẩm thất bại.');
    }

    return mapDtoToCatalogProduct(json.data);
  },

  /**
   * Cập nhật thông tin sản phẩm
   */
  async updateProduct(id: string, payload: Partial<FeaturedCatalogProduct>): Promise<FeaturedCatalogProduct> {
    const rawQty = typeof payload.stockNote === 'string'
      ? parseInt(payload.stockNote.replace(/\D/g, ''), 10)
      : (typeof payload.stockNote === 'number' ? payload.stockNote : 10);
    const parsedQty = isNaN(rawQty) ? 10 : rawQty;

    const subImagesList = Array.isArray(payload.images)
      ? payload.images
      : (typeof payload.subImages === 'string'
          ? payload.subImages.split(/[\n,]/).map((s) => s.trim()).filter(Boolean)
          : []);

    const res = await fetch(`${API_BASE_URL}/api/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        name: payload.name,
        code: payload.code,
        sku: payload.code,
        categoryId: payload.categoryId,
        price: payload.price || 0,
        originalPrice: payload.originalPrice !== undefined ? payload.originalPrice : (payload.costPrice !== undefined ? payload.costPrice : payload.price || 0),
        inStock: parsedQty,
        unit: payload.unit || 'Bộ',
        stockType: payload.stockType,
        shortDescription: payload.collection || '',
        description: payload.description || payload.name || '',
        dimensions: payload.dimensions || '',
        material: payload.material || 'Gỗ Sồi tự nhiên (Ash/Oak)',
        woodType: payload.material || 'Gỗ Sồi tự nhiên',
        color: payload.color || 'Nâu hạt dẻ / tự nhiên (Đa dạng)',
        warranty: payload.warranty || '24 tháng',
        shippingNote: payload.shippingNote || 'Miễn phí giao hàng và lắp đặt toàn quốc.',
        mainImageUrl: payload.image || '',
        images: subImagesList,
        space: payload.space || 'LivingRoom',
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || `Cập nhật sản phẩm thất bại (${res.status})`);
    }

    const json = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.message || 'Cập nhật sản phẩm thất bại.');
    }

    return mapDtoToCatalogProduct(json.data);
  },

  /**
   * Xóa sản phẩm
   */
  async deleteProduct(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/products/${id}`, {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || `Xóa sản phẩm thất bại (${res.status})`);
    }

    const json = await res.json();
    return Boolean(json.success);
  },

  /**
   * Nhập hàng loạt sản phẩm từ Excel / danh sách
   */
  async bulkImportProducts(products: any[]): Promise<{ count: number; message: string }> {
    const res = await fetch(`${API_BASE_URL}/api/products/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(products),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || `Nhập sản phẩm từ Excel thất bại (${res.status})`);
    }

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.message || 'Nhập sản phẩm từ Excel thất bại.');
    }

    return {
      count: json.data || products.length,
      message: json.message || `Đã nhập thành công ${json.data || products.length} sản phẩm!`,
    };
  },
};
