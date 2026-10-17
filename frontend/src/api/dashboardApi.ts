import { cachedFetch, invalidateApiCache } from './shared/apiCache';
import { getAuthHeaders } from './shared/authHeaders';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface OverviewKpi {
  revenue: number;
  revenueGrowth: string;
  cogs: number;
  cogsPercent: number;
  profit: number;
  profitMargin: number;
  profitGrowth: string;
  completedOrders: number;
  pendingOrders: number;
  readyStockCount: number;
  stockValue: number;
  stockValueFormatted: string;
}

export interface ChartBar {
  label: string;
  total: number;
  cogs: number;
  profit: number;
  percent: number;
  isCurrent?: boolean;
  date?: string | null;
}

export interface ChartSummary {
  totalRevenue: number;
  totalCogs: number;
  totalProfit: number;
  profitMargin: number;
  growthLabel: string;
  bars: ChartBar[];
}

export interface OverviewCharts {
  week: ChartSummary;
  month: ChartSummary;
  year: ChartSummary;
}

export interface TopProduct {
  rank: number;
  id?: string;
  name: string;
  collection: string;
  image: string;
  salesCount: number;
  revenue: number;
  cogs: number;
  profit: number;
  margin: number;
  woodBadge: string;
}

export interface CategoryPerformance {
  id?: string | null;
  name: string;
  revenue: number;
  cogs: number;
  profit: number;
  margin: number;
}

export interface BranchPerformance {
  id?: string | null;
  name: string;
  revenue: number;
  profit: number;
  margin: number;
  percent: number;
}

export interface OverviewRecentOrder {
  id: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  productName: string;
  productSpec: string;
  quantity: number;
  value: number;
  status: string;
  statusLabel: string;
  orderDate: string;
}

export interface OverviewDataResponse {
  kpis: OverviewKpi;
  charts: OverviewCharts;
  topProducts: TopProduct[];
  categoryPerformance: CategoryPerformance[];
  branchPerformance: BranchPerformance[];
  recentOrders: OverviewRecentOrder[];
  selectedBranch: string;
  timeRange: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors: string[];
}

export const dashboardApi = {
  /**
   * Lấy toàn bộ dữ liệu thống kê cho màn hình Tổng quan (Overview Tab)
   * @param branch Tên chi nhánh hoặc 'all'
   * @param timeRange 'today' | 'this_week' | 'this_month' | 'this_year' | 'all'
   */
  async getOverview(params?: {
    branch?: string;
    timeRange?: string;
  }): Promise<OverviewDataResponse> {
    const query = new URLSearchParams();
    if (params?.branch && params.branch !== 'all') {
      query.append('branch', params.branch);
    }
    if (params?.timeRange && params.timeRange !== 'all') {
      query.append('timeRange', params.timeRange);
    }

    const cacheKey = `dashboard:overview:${query.toString()}`;
    return cachedFetch(cacheKey, async () => {
      const res = await fetch(`${API_BASE_URL}/api/dashboard/overview?${query.toString()}`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch dashboard overview (${res.status})`);
      }

      const json: ApiResponse<OverviewDataResponse> = await res.json();
      return json.data;
    }, 10000); // cache 10 giây
  },

  /**
   * Xóa cache dữ liệu tổng quan
   */
  invalidateCache() {
    invalidateApiCache('dashboard:overview:');
  },
};
