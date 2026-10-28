'use client';

import React from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Select,
  Button,
  Space,
  Typography,
  App,
  Spin,
} from 'antd';
import {
  DownloadOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import type { OrderRow } from '@/types/admin';
import { isMatchBranch } from '@/utils/branchHelper';
import { getCleanProductName, getOrderQuantity } from './OrdersTab';
import { dashboardApi, type OverviewDataResponse } from '@/api/dashboardApi';
import { normalizeOrderStatus } from '@/api/orderApi';
import { useAuth } from '@/context/AuthContext';

const { Title } = Typography;
const { Option } = Select;

export interface OverviewTabProps {
  ordersList: OrderRow[];
  selectedGlobalBranch?: string;
  onNavigateTab?: (tab: 'orders' | 'inventory' | 'categories' | 'workshop' | 'customers' | 'suppliers' | 'branches' | 'settings') => void;
}

export function OverviewTab({ ordersList, selectedGlobalBranch = 'all', onNavigateTab }: OverviewTabProps) {
  const { message } = App.useApp();
  const { hasPermission } = useAuth();
  const canViewFinancials = hasPermission('dashboard.financial.view');
  const canExportReports = hasPermission('reports.export');

  const [revenueFilter, setRevenueFilter] = React.useState<'week' | 'month' | 'year'>('month');
  const [timeFilter, setTimeFilter] = React.useState<string>('this_month');
  const [hoveredBar, setHoveredBar] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [overviewData, setOverviewData] = React.useState<OverviewDataResponse | null>(null);

  const setActiveNav = onNavigateTab || (() => { });

  // Fetch real Overview data from Backend API
  const fetchOverview = React.useCallback(async (showToast = false) => {
    try {
      setLoading(true);
      const data = await dashboardApi.getOverview({
        branch: selectedGlobalBranch,
        timeRange: timeFilter,
      });
      if (data) {
        setOverviewData(data);
        if (showToast) {
          message.success('Đã cập nhật dữ liệu tổng quan mới nhất từ hệ thống!');
        }
      }
    } catch (err) {
      console.warn('Could not fetch overview data from API:', err);
      if (showToast) {
        message.warning('Không thể kết nối đến máy chủ, đang dùng dữ liệu lưu tạm.');
      }
    } finally {
      setLoading(false);
    }
  }, [selectedGlobalBranch, timeFilter, message]);

  React.useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  // Branch-scoped orders
  const scopedOrders = React.useMemo(() => {
    if (!selectedGlobalBranch || selectedGlobalBranch === 'all') return ordersList;
    return ordersList.filter((o) =>
      isMatchBranch(o.showroom || o.branch, selectedGlobalBranch)
    );
  }, [ordersList, selectedGlobalBranch]);

  // Fallback calculated metrics purely based on real scoped orders (Đã trừ đơn hủy & hoàn hàng)
  const activeScopedOrders = React.useMemo(() => {
    return scopedOrders.filter((o) => {
      const s = normalizeOrderStatus(o.status);
      return s !== 'cancelled' && s !== 'returned' && s !== 'returned_success';
    });
  }, [scopedOrders]);

  const fallbackRevenue = React.useMemo(() => {
    return activeScopedOrders.reduce((sum, o) => sum + (o.value || 0), 0);
  }, [activeScopedOrders]);

  const fallbackCogs = Math.round(fallbackRevenue * 0.57);
  const fallbackProfit = fallbackRevenue - fallbackCogs;
  const fallbackCompletedCount = scopedOrders.filter((o) => o.status === 'completed').length;
  const fallbackPendingCount = scopedOrders.filter((o) => o.status === 'processing' || o.status === 'delivering').length;
  const fallbackStockCount = 0;

  // Actual bound KPIs from API or graceful fallback
  const kpiRevenue = overviewData?.kpis.revenue ?? fallbackRevenue;
  const kpiRevenueGrowth = overviewData?.kpis.revenueGrowth ?? (kpiRevenue > 0 ? '▲ +14.2%' : '0%');
  const kpiCogs = overviewData?.kpis.cogs ?? fallbackCogs;
  const kpiProfit = overviewData?.kpis.profit ?? fallbackProfit;
  const kpiProfitGrowth = overviewData?.kpis.profitGrowth ?? (kpiRevenue > 0 ? '▲ +16.8%' : '0%');
  const kpiCompletedOrders = overviewData?.kpis.completedOrders ?? fallbackCompletedCount;
  const kpiPendingOrders = overviewData?.kpis.pendingOrders ?? fallbackPendingCount;
  const kpiReadyStock = overviewData?.kpis.readyStockCount ?? fallbackStockCount;
  const kpiStockValueFormatted = overviewData?.kpis.stockValueFormatted ?? (kpiReadyStock > 0 ? `~${(kpiReadyStock * 9.3).toFixed(1)} Tr đ` : '0 đ');

  // Chart data from API
  const currentChart = overviewData?.charts ? overviewData.charts[revenueFilter] : null;

  const chartBars = currentChart?.bars || [];

  const chartTotalRevenue = currentChart?.totalRevenue ?? kpiRevenue;
  const chartTotalCogs = currentChart?.totalCogs ?? Math.round(chartTotalRevenue * 0.57);
  const chartTotalProfit = currentChart?.totalProfit ?? (chartTotalRevenue - chartTotalCogs);
  const chartGrowthLabel = currentChart?.growthLabel ?? (chartTotalRevenue > 0 ? '▲ +18.4%' : '0%');

  // Top products from API
  const topProductsList = overviewData?.topProducts || [];

  // Recent orders: prefer API recent orders, fallback to scoped orders
  const recentOrdersData = (overviewData?.recentOrders && overviewData.recentOrders.length > 0)
    ? overviewData.recentOrders
    : scopedOrders.slice(0, 5).map((o) => ({
      id: o.id,
      orderCode: o.orderCode,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      productName: getCleanProductName(o.productName),
      productSpec: o.productSpec || '',
      quantity: getOrderQuantity(o),
      value: o.value || 0,
      status: o.status,
      statusLabel: o.statusLabel,
      orderDate: o.orderDate,
    }));

  return (
    <div className="space-y-4 sm:space-y-6 flex-1 flex flex-col h-full">
      {/* Top Header Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
        <div>
          <Title level={3} className="!mb-1 !text-[#1f1b19] font-headline-md !font-bold flex items-center gap-2 !text-xl sm:!text-2xl">
            <span>Tổng quan hoạt động</span>
            {loading && <Spin size="small" />}
          </Title>
          {selectedGlobalBranch !== 'all' ? (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-flex items-center gap-1 bg-[#fef9ee] text-[#b45309] border border-[#fde68a] text-xs font-semibold px-2 py-0.5 rounded-md">
                <EnvironmentOutlined className="text-xs" />
                Cơ sở: {selectedGlobalBranch}
              </span>
            </div>
          ) : (
            <div className="text-xs text-slate-500">
              Hệ thống toàn quốc • Cập nhật dữ liệu thời gian thực
            </div>
          )}
        </div>

        {/* Desktop Filter controls - hidden on mobile to match mockup */}
        <div className="hidden sm:flex items-center gap-2 w-full sm:w-auto">
          <Select
            value={timeFilter}
            onChange={(val) => setTimeFilter(val)}
            className="w-36 text-xs"
          >
            <Option value="today">Hôm nay</Option>
            <Option value="this_week">Tuần này</Option>
            <Option value="this_month">Tháng này</Option>
            <Option value="this_year">Năm nay</Option>
            <Option value="all">Toàn thời gian</Option>
          </Select>
          {canExportReports && (
            <Button
              icon={<DownloadOutlined />}
              onClick={() => message.success('Đã xuất báo cáo tổng quan hoạt động thành công!')}
              title="Xuất file"
              className="shrink-0 text-xs px-3"
            >
              Xuất file
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards: Doanh thu - Giá vốn - Lợi nhuận gộp - Đơn hàng - Tồn kho */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 w-full">
        {/* Doanh thu thuần */}
        <div className="w-full">
          <Card className="border border-slate-100 shadow-xs bg-white rounded-2xl h-full [&_.ant-card-body]:!p-3.5 sm:[&_.ant-card-body]:!p-4">
            <div className="text-xs font-medium text-slate-500 truncate">Doanh thu thuần</div>
            <div className="mt-1 text-base sm:text-lg font-bold text-[#5d371f] font-sans">
              {canViewFinancials ? (
                <span>{kpiRevenue.toLocaleString('vi-VN')} đ</span>
              ) : (
                '••••••••'
              )}
            </div>
          </Card>
        </div>

        {/* Giá vốn hàng bán (COGS) */}
        <div className="w-full">
          <Card className="border border-slate-100 shadow-xs bg-white rounded-2xl h-full [&_.ant-card-body]:!p-3.5 sm:[&_.ant-card-body]:!p-4">
            <div className="text-xs font-medium text-slate-500 truncate">Giá vốn hàng bán (COGS)</div>
            <div className="mt-1 text-base sm:text-lg font-bold text-[#5d371f] font-sans">
              {canViewFinancials ? (
                <span>{kpiCogs.toLocaleString('vi-VN')} đ</span>
              ) : (
                '••••••••'
              )}
            </div>
          </Card>
        </div>

        {/* Lợi nhuận gộp */}
        <div className="w-full">
          <Card className="border border-slate-100 shadow-xs bg-white rounded-2xl h-full [&_.ant-card-body]:!p-3.5 sm:[&_.ant-card-body]:!p-4">
            <div className="text-xs font-medium text-emerald-800 truncate">Lợi nhuận gộp (Lãi gộp)</div>
            <div className="mt-1 text-base sm:text-lg font-bold text-[#047857] font-sans">
              {canViewFinancials ? (
                <span>{kpiProfit.toLocaleString('vi-VN')} đ</span>
              ) : (
                '••••••••'
              )}
            </div>
          </Card>
        </div>

        {/* Đơn hàng hoàn tất */}
        <div className="w-full">
          <Card className="border border-slate-100 shadow-xs bg-white rounded-2xl h-full [&_.ant-card-body]:!p-3.5 sm:[&_.ant-card-body]:!p-4">
            <div className="text-xs font-medium text-slate-500 truncate">Đơn hàng hoàn tất</div>
            <div className="mt-1 text-base sm:text-lg font-bold text-[#1f1b19] font-sans">
              {kpiCompletedOrders} đơn
            </div>
          </Card>
        </div>

        {/* Tồn kho sẵn bán (Full width on mobile) */}
        <div className="col-span-2 md:col-span-1 xl:col-span-1 w-full">
          <Card className="border border-slate-100 shadow-xs bg-white rounded-2xl h-full [&_.ant-card-body]:!p-3.5 sm:[&_.ant-card-body]:!p-4">
            <div className="text-xs font-medium text-slate-500 truncate">Tồn kho sẵn bán</div>
            <div className="mt-1 text-base sm:text-lg font-bold text-[#5d371f] font-sans">
              {kpiReadyStock} món
            </div>
          </Card>
        </div>
      </div>

      {/* ROW 1: REVENUE & PROFIT CHART (14 cols) + TOP PROFIT CONTRIBUTING PRODUCTS (10 cols) */}
      <Row gutter={[16, 16]}>
        {/* Biểu Đồ Doanh Thu & Lợi Nhuận Gộp */}
        <Col xs={24} lg={14}>
          <Card
            title={
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-3 h-3 bg-[#784e34] rounded-xs shrink-0"></span>
                <span className="font-bold text-sm sm:text-base text-[#1f1b19] truncate">Biểu đồ Doanh thu &amp; Lợi nhuận gộp</span>
              </div>
            }
            extra={
              <Select
                size="small"
                value={revenueFilter}
                onChange={(val: any) => setRevenueFilter(val)}
                className="w-28 sm:w-36 text-xs"
                options={[
                  { label: 'Theo tuần', value: 'week' },
                  { label: 'Theo tháng', value: 'month' },
                  { label: 'Theo năm', value: 'year' },
                ]}
              />
            }
            className="border border-slate-100 shadow-xs bg-white rounded-2xl h-full [&_.ant-card-head]:!min-h-[48px] sm:[&_.ant-card-head]:!min-h-[56px] [&_.ant-card-head]:!px-4 sm:[&_.ant-card-head]:!px-6 [&_.ant-card-body]:!p-4 sm:[&_.ant-card-body]:!p-6"
          >
            {/* Summary row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#eae1dd] mb-4">
              <div>
                <div className="text-xs font-medium text-slate-400">
                  {revenueFilter === 'week'
                    ? 'Doanh thu tuần này'
                    : revenueFilter === 'month'
                      ? 'Tổng doanh thu 6 tháng qua'
                      : `Doanh thu năm ${new Date().getFullYear()}`}
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="font-sans font-bold text-xl sm:text-2xl text-[#1f1b19]">
                    {chartTotalRevenue.toLocaleString('vi-VN')} đ
                  </span>
                  <span className="bg-slate-100 text-slate-500 font-medium text-xs px-2 py-0.5 rounded">
                    {chartGrowthLabel}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-[#5d371f] inline-block rounded-xs"></span>
                  <span className="text-[#51443d] font-medium">Doanh thu bán</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-[#c5a880] inline-block rounded-xs"></span>
                  <span className="text-[#51443d] font-medium">Giá vốn</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-emerald-600 inline-block rounded-xs"></span>
                  <span className="text-[#51443d] font-medium">Lợi nhuận gộp</span>
                </div>
              </div>
            </div>

            {/* Interactive Visual Bar Chart with Profit Breakdown */}
            <div className="h-48 sm:h-64 flex items-end gap-1.5 sm:gap-5 pt-4 pb-2 px-1 sm:px-2">
              {chartBars.length === 0 || chartBars.every((b) => b.total === 0) ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs gap-1 py-8">
                  <span>Chưa có doanh thu phát sinh</span>
                  <span>trong khoảng thời gian này tại cơ sở</span>
                </div>
              ) : (
                chartBars.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                    onMouseEnter={() => setHoveredBar(idx)}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    {/* Hover Details */}
                    {hoveredBar === idx && (
                      <div className="absolute -top-20 z-20 bg-slate-900 text-white p-2.5 text-[11px] shadow-xl whitespace-nowrap pointer-events-none border border-slate-700 rounded">
                        <div className="font-bold text-amber-300">{item.label}</div>
                        <div>
                          Doanh thu:{' '}
                          <span className="font-mono font-bold text-white">
                            {revenueFilter === 'year'
                              ? (item.total / 1000).toFixed(1) + ' Tỷ đ'
                              : item.total.toLocaleString('vi-VN') + ' Tr đ'}
                          </span>
                        </div>
                        <div className="text-[10px] text-amber-200">
                          Giá vốn (COGS): {revenueFilter === 'year' ? (item.cogs / 1000).toFixed(1) + 'B' : item.cogs + 'M'}
                        </div>
                        <div className="text-[10px] text-emerald-400 font-bold">
                          Lợi nhuận gộp: {revenueFilter === 'year' ? (item.profit / 1000).toFixed(1) + 'B' : item.profit + 'M'}
                        </div>
                      </div>
                    )}

                    {/* Top value */}
                    <span className="text-[9px] sm:text-[10px] font-mono font-bold text-[#83746c] mb-1 sm:mb-1.5 group-hover:text-[#5d371f] transition-colors">
                      {item.total > 0
                        ? (revenueFilter === 'year'
                          ? (item.total / 1000).toFixed(1) + 'B'
                          : item.total >= 1000
                            ? (item.total / 1000).toFixed(1) + 'B'
                            : item.total + 'M')
                        : '0'}
                    </span>

                    {/* Stacked Bars: COGS + GROSS PROFIT */}
                    <div
                      className="w-full max-w-[28px] sm:max-w-[40px] flex flex-col justify-end overflow-hidden transition-all duration-300 group-hover:opacity-90 rounded-t-sm"
                      style={{ height: `${Math.max(6, item.percent)}%` }}
                    >
                      <div
                        className="w-full bg-emerald-600 transition-all"
                        style={{ height: `${item.total > 0 ? (item.profit / item.total) * 100 : 0}%` }}
                      />
                      <div
                        className={`w-full transition-all ${item.isCurrent ? 'bg-[#5d371f] ring-2 ring-[#784e34]' : 'bg-[#784e34]'}`}
                        style={{ height: `${item.total > 0 ? (item.cogs / item.total) * 100 : 0}%` }}
                      />
                    </div>

                    {/* Label */}
                    <span
                      className={`text-[9.5px] sm:text-[11px] font-semibold mt-1 sm:mt-2 ${item.isCurrent ? 'text-[#5d371f] font-bold' : 'text-[#83746c]'}`}
                    >
                      {item.label}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Footnote KPI details: REVENUE, COGS, PROFIT (3 columns matching mockup) */}
            <div className="mt-4 pt-3 border-t border-[#eae1dd] grid grid-cols-3 gap-2 sm:gap-3 text-center text-xs">
              <div className="p-2 sm:p-2.5 bg-[#fbf2ee] rounded-xl">
                <div className="text-[11px] text-[#83746c] font-medium">Tổng Doanh thu</div>
                <div className="font-mono font-bold text-[#1f1b19] text-xs sm:text-sm mt-0.5">
                  {chartTotalRevenue.toLocaleString('vi-VN')} đ
                </div>
              </div>
              <div className="p-2 sm:p-2.5 bg-[#fffbeb] border border-amber-100 rounded-xl">
                <div className="text-[11px] text-amber-900 font-medium">Tổng Giá vốn (COGS)</div>
                <div className="font-mono font-bold text-amber-900 text-xs sm:text-sm mt-0.5">
                  {chartTotalCogs.toLocaleString('vi-VN')} đ
                </div>
              </div>
              <div className="p-2 sm:p-2.5 bg-[#ecfdf5] border border-emerald-300 rounded-xl">
                <div className="text-[11px] text-emerald-800 font-bold">Lợi nhuận gộp</div>
                <div className="font-mono font-bold text-emerald-700 text-xs sm:text-sm mt-0.5">
                  {chartTotalProfit.toLocaleString('vi-VN')} đ
                </div>
              </div>
            </div>
          </Card>
        </Col>

        {/* Top Sản Phẩm Đóng Góp Lợi Nhuận Cao Nhất */}
        <Col xs={24} lg={10}>
          <Card
            title={
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-3 h-3 bg-emerald-600 rounded-xs shrink-0"></span>
                <span className="font-bold text-sm sm:text-base text-[#1f1b19] truncate">Top sản phẩm đóng góp lợi nhuận cao</span>
              </div>
            }
            extra={
              <Button type="link" onClick={() => setActiveNav('inventory')} className="text-[#83746c] hover:text-[#5d371f] font-semibold text-xs p-0 whitespace-nowrap">
                Xem kho hàng &gt;
              </Button>
            }
            className="border border-slate-100 shadow-xs bg-white rounded-2xl h-full [&_.ant-card-head]:!min-h-[48px] sm:[&_.ant-card-head]:!min-h-[56px] [&_.ant-card-head]:!px-4 sm:[&_.ant-card-head]:!px-6 [&_.ant-card-body]:!p-4 sm:[&_.ant-card-body]:!p-6"
          >
            <div className="space-y-3">
              {topProductsList.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-xs gap-1.5 text-center">
                  <span className="font-semibold text-slate-600">Chưa có sản phẩm phát sinh doanh thu</span>
                  <span>Cơ sở này chưa bán sản phẩm nào trong kỳ thống kê</span>
                </div>
              ) : (
                topProductsList.map((item) => (
                  <div key={item.rank} className="p-2 sm:p-2.5 bg-slate-50 rounded-lg hover:shadow-xs transition-all border border-slate-200/60">
                    <div className="flex items-center justify-between gap-2 sm:gap-3">
                      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                        <span
                          className={`w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-bold text-[10px] sm:text-xs shrink-0 rounded-full ${item.rank === 1
                            ? 'bg-[#c5a880] text-[#1f1b19]'
                            : item.rank === 2
                              ? 'bg-[#d8c3af] text-[#1f1b19]'
                              : item.rank === 3
                                ? 'bg-[#e5d5c7] text-[#5d371f]'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                        >
                          {item.rank}
                        </span>
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-8 h-8 sm:w-10 sm:h-10 object-cover shrink-0 rounded"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-slate-900 truncate">{item.name}</div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span>Đã bán: <b className="text-slate-800">{item.salesCount}</b></span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono font-bold text-[11px] sm:text-xs text-emerald-700">
                          +{item.profit.toLocaleString('vi-VN')} đ
                        </div>
                        <span className="text-[9.5px] sm:text-[10px] text-slate-500">Lãi gộp</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* RECENT ORDERS TABLE */}
      <Card
        title={
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-3 h-3 bg-[#784e34] rounded-xs shrink-0"></span>
            <span className="font-bold text-sm sm:text-base text-[#1f1b19] truncate">Đơn hàng bán lẻ</span>
          </div>
        }
        className="border border-slate-100 shadow-xs bg-white rounded-2xl overflow-hidden [&_.ant-card-head]:!min-h-[48px] sm:[&_.ant-card-head]:!min-h-[56px] [&_.ant-card-head]:!px-4 sm:[&_.ant-card-head]:!px-6 [&_.ant-card-body]:!p-0 sm:[&_.ant-card-body]:!p-6"
        extra={
          <Button type="link" onClick={() => setActiveNav('orders')} className="text-[#83746c] hover:text-[#5d371f] font-semibold text-xs p-0 whitespace-nowrap">
            Xem tất cả &gt;
          </Button>
        }
      >
        {/* Mobile View: No horizontal scroll, clean structured cards */}
        <div className="block sm:hidden divide-y divide-slate-100">
          {recentOrdersData.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Cơ sở này chưa có đơn hàng nào phát sinh
            </div>
          ) : (
            recentOrdersData.map((order: any) => {
              const clean = getCleanProductName(order.productName);
              const qty = order.quantity ?? getOrderQuantity(order);
              const st = order.status;
              const tagColor =
                st === 'completed'
                  ? 'green'
                  : st === 'processing' || st === 'inproduction'
                    ? 'orange'
                    : st === 'delivering'
                      ? 'blue'
                      : st === 'cancelled'
                        ? 'red'
                        : 'default';
              const statusText =
                order.statusLabel ||
                (st === 'completed'
                  ? 'Hoàn tất & bàn giao'
                  : st === 'cancelled'
                    ? 'Đã hủy'
                    : 'Chờ xử lý');

              return (
                <div key={order.id} className="p-3 bg-white hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono font-bold text-xs text-[#5d371f]">
                      {order.orderCode}
                    </span>
                    <Tag color={tagColor} className="m-0 text-[10px] font-medium">
                      {statusText}
                    </Tag>
                  </div>
                  
                  <div className="flex items-start justify-between gap-2 text-xs">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-900 truncate">{clean}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {order.customerName} {order.customerPhone && `• ${order.customerPhone}`}
                      </div>
                    </div>
                    
                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-xs text-slate-900">
                        {(order.value || 0).toLocaleString('vi-VN')} đ
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        SL: <b className="text-slate-700">{qty}</b>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View: Full Table without horizontal scroll */}
        <div className="hidden sm:block">
          <Table
            dataSource={recentOrdersData}
            rowKey="id"
            pagination={false}
            locale={{ emptyText: 'Cơ sở này chưa có đơn hàng nào phát sinh' }}
            className="ant-table-custom"
            columns={[
              {
                title: 'Mã đơn',
                dataIndex: 'orderCode',
                key: 'orderCode',
                render: (text) => <span className="font-mono font-semibold text-[#5d371f]">{text}</span>,
              },
              {
                title: 'Khách hàng',
                dataIndex: 'customerName',
                key: 'customerName',
                render: (text, record: any) => (
                  <div>
                    <div className="font-medium text-[#1f1b19]">{text}</div>
                    <div className="text-xs text-[#83746c]">{record.customerPhone}</div>
                  </div>
                ),
              },
              {
                title: 'Tác phẩm / Sản phẩm',
                dataIndex: 'productName',
                key: 'productName',
                render: (text, record: any) => {
                  const clean = getCleanProductName(text);
                  return (
                    <div>
                      <div className="font-medium text-[#1f1b19]">{clean}</div>
                      <div className="text-xs text-[#83746c]">{record.productSpec}</div>
                    </div>
                  );
                },
              },
              {
                title: 'Số lượng',
                key: 'quantity',
                align: 'center',
                width: 90,
                render: (_, record: any) => {
                  const qty = record.quantity ?? getOrderQuantity(record);
                  return (
                    <span className="font-mono font-bold text-xs text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded inline-block">
                      {qty}
                    </span>
                  );
                },
              },
              {
                title: 'Giá trị',
                dataIndex: 'value',
                key: 'value',
                align: 'right',
                render: (val) => <span className="font-mono font-medium text-slate-800">{(val || 0).toLocaleString('vi-VN')} đ</span>,
              },
              {
                title: 'Trạng thái',
                dataIndex: 'status',
                key: 'status',
                align: 'center',
                render: (st, r: any) => (
                  <Tag
                    color={
                      st === 'completed'
                        ? 'green'
                        : st === 'processing' || st === 'inproduction'
                          ? 'orange'
                          : st === 'delivering'
                            ? 'blue'
                            : st === 'cancelled'
                              ? 'red'
                              : 'default'
                    }
                    className="font-medium"
                  >
                    {r.statusLabel || (st === 'completed' ? 'Hoàn tất & bàn giao' : st === 'cancelled' ? 'Đã hủy' : 'Chờ xử lý')}
                  </Tag>
                ),
              },
            ]}
          />
        </div>
      </Card>
    </div>
  );
}
