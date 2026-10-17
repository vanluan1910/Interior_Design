import { Product } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface HomeStat {
  label: string;
  value: string;
  suffix?: string;
}

export interface HomeHero {
  tagline: string;
  title: string;
  subtitle: string;
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText: string;
  secondaryCtaLink: string;
  backgroundImageUrl: string;
  stats: HomeStat[];
}

export interface HomeSpace {
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
}

export interface HomeProductItem {
  id: string;
  name: string;
  slug: string;
  sku: string;
  category: string;
  categoryName: string;
  price: number;
  originalPrice?: number;
  image: string;
  woodType: string;
  dimensions: string;
  tag: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
}

export interface HomeCommitment {
  icon: string;
  title: string;
  description: string;
}

export interface HomeCraftsmanship {
  badge: string;
  title: string;
  description: string;
  imageUrl: string;
  highlights: string[];
}

export interface HomeShowroom {
  id: string;
  name: string;
  address: string;
  phone: string;
  openingHours: string;
  imageUrl?: string;
  isHeadquarter: boolean;
}

export interface HomeCompanyInfo {
  brandName: string;
  slogan: string;
  hotline: string;
  email: string;
  address: string;
  logoUrl: string;
  website: string;
}

export interface HomeTestimonial {
  customerName: string;
  projectLocation: string;
  quote: string;
  rating: number;
  avatarUrl?: string;
}

export interface HomeDataResponse {
  hero: HomeHero;
  livingSpaces: HomeSpace[];
  featuredProducts: HomeProductItem[];
  commitments: HomeCommitment[];
  craftsmanship: HomeCraftsmanship;
  showrooms: HomeShowroom[];
  companyInfo: HomeCompanyInfo;
  testimonials: HomeTestimonial[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message?: string;
  errors: string[];
}

export const homeApi = {
  /**
   * Lấy toàn bộ dữ liệu Trang chủ từ Backend API (/api/home)
   */
  async getHomeData(): Promise<HomeDataResponse | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/home`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const json: ApiResponse<HomeDataResponse> = await res.json();
      return json.data;
    } catch (err) {
      console.warn('[homeApi.getHomeData] Failed to fetch home data:', err);
      return null;
    }
  },

  /**
   * Lấy danh sách sản phẩm nổi bật theo danh mục (/api/home/featured-products)
   */
  async getFeaturedProducts(category?: string, limit = 8): Promise<HomeProductItem[]> {
    try {
      const params = new URLSearchParams();
      if (category && category !== 'all') {
        params.append('category', category);
      }
      params.append('limit', limit.toString());

      const res = await fetch(`${API_BASE_URL}/api/home/featured-products?${params.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const json: ApiResponse<HomeProductItem[]> = await res.json();
      return json.data || [];
    } catch (err) {
      console.warn('[homeApi.getFeaturedProducts] Failed to fetch featured products:', err);
      return [];
    }
  },

  /**
   * Lấy danh sách showroom & chi nhánh hiển thị trên trang chủ (/api/home/showrooms)
   */
  async getShowrooms(): Promise<HomeShowroom[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/home/showrooms`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const json: ApiResponse<HomeShowroom[]> = await res.json();
      return json.data || [];
    } catch (err) {
      console.warn('[homeApi.getShowrooms] Failed to fetch showrooms:', err);
      return [];
    }
  },
};
