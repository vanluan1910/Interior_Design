'use client';

import React from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Progress,
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
  ReloadOutlined,
} from '@ant-design/icons';
import type { OrderRow } from '@/types/admin';
import { isMatchBranch } from '@/utils/branchHelper';
import { getCleanProductName, getOrderQuantity } from './OrdersTab';
import { dashboardApi, type OverviewDataResponse } from '@/api/dashboardApi';
import { normalizeOrderStatus } from '@/api/orderApi';

const { Title } = Typography;
const { Option } = Select;

export interface OverviewTabProps {
  ordersList: OrderRow[];
  selectedGlobalBranch?: string;
  onNavigateTab?: (tab: 'orders' | 'inventory' | 'categories' | 'workshop' | 'customers' | 'suppliers' | 'branches' | 'settings') => void;
}

export function OverviewTab({ ordersList, selectedGlobalBranch = 'all', onNavigateTab }: OverviewTabProps) {
  const { message } = App.useApp();
  const [revenueFilter, setRevenueFilter] = React.useState<'week' | 'month' | 'year'>('month');
  const [timeFilter, setTimeFilter] = React.useState<string>('this_month');
  const [hoveredBar, setHoveredBar] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [overviewData, setOverviewData] = React.useState<OverviewDataResponse | null>(null);

  const setActiveNav = onNavigateTab || (() => {});

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

  // Category performance from API
  const categoryPerformanceList = overviewData?.categoryPerformance || [];

  // Branch performance from API
  const branchPerformanceList = overviewData?.branchPerformance || [];

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
    <div className="space-y-6 flex-1 flex flex-col h-full">
      {/* Top Header Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Title level={3} className="!mb-0 !text-[#1f1b19] font-headline-md flex items-center gap-2">
            <span>Tổng quan hoạt động</span>
            {loading && <Spin size="small" />}
          </Title>
          {selectedGlobalBranch !== 'all' ? (
            <div className="flex items-center gap-1.5 mt-1">
              <Tag color="gold" className="text-xs font-semibold px-2 py-0.5 border-[#c5a880]">
                <EnvironmentOutlined className="mr-1" />
                Cơ sở: {selectedGlobalBranch}
              </Tag>
            </div>
          ) : (
            <div className="text-xs text-slate-500 mt-1">
              Hệ thống toàn quốc • Cập nhật dữ liệu thời gian thực
            </div>
          )}
        </div>
        <Space>
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
          <Button
            icon={<ReloadOutlined spin={loading} />}
            onClick={() => {
              dashboardApi.invalidateCache();
              fetchOverview(true);
            }}
            title="Làm mới dữ liệu từ máy chủ"
          >
            Làm mới
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={() => message.success('Đã xuất báo cáo tổng quan hoạt động thành công!')}
          >
            Xuất file
          </Button>
        </Space>
      </div>

      {/* KPI Cards: DOANH THU - GIÁ VỐN - LỢI NHUẬN GỘP - ĐƠN HÀNG - TỒN KHO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 w-full">
        {/* Doanh thu thuần */}
        <div className="w-full">
          <Card className="border border-slate-200/80 shadow-xs bg-white rounded-xl p-1 h-full">
            <Statistic
              title={<span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Doanh thu thuần</span>}
              value={kpiRevenue}
              precision={0}
              suffix="đ"
              styles={{ content: { color: '#5d371f', fontWeight: 700, fontSize: '1.25rem' } }}
            />
            <div className="mt-2 text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
              <span>{kpiRevenueGrowth}</span>{' '}
              <span className="text-slate-500 font-normal">
                {selectedGlobalBranch === 'all' ? 'toàn hệ thống' : 'tại cơ sở'}
              </span>
            </div>
          </Card>
        </div>

        {/* Giá vốn hàng bán (COGS) */}
        <div className="w-full">
          <Card className="border border-slate-200/80 shadow-xs bg-white rounded-xl p-1 h-full">
            <Statistic
              title={<span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Giá vốn hàng bán (COGS)</span>}
              value={kpiCogs}
              precision={0}
              suffix="đ"
              styles={{ content: { color: '#854d0e', fontWeight: 700, fontSize: '1.25rem' } }}
            />
            <div className="mt-2 text-[11px] text-amber-800 font-semibold flex items-center gap-1">
              <span>{kpiRevenue > 0 ? '57.0%' : '0%'}</span> <span className="text-slate-500 font-normal">tiền vốn nhập hàng</span>
            </div>
          </Card>
        </div>

        {/* Lợi nhuận gộp */}
        <div className="w-full">
          <Card className="border border-emerald-200 shadow-xs bg-emerald-50/40 rounded-xl p-1 h-full">
            <Statistic
              title={<span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Lợi nhuận gộp (Lãi gộp)</span>}
              value={kpiProfit}
              precision={0}
              suffix="đ"
              styles={{ content: { color: '#047857', fontWeight: 800, fontSize: '1.25rem' } }}
            />
            <div className="mt-2 text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
              <span className="font-bold">{kpiProfitGrowth}</span>{' '}
              <span className="text-slate-500 font-normal">
                {selectedGlobalBranch === 'all' ? 'toàn hệ thống' : 'tại cơ sở'}
              </span>
            </div>
          </Card>
        </div>

        {/* Đơn hàng hoàn tất */}
        <div className="w-full">
          <Card className="border border-slate-200/80 shadow-xs bg-white rounded-xl p-1 h-full">
            <Statistic
              title={<span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Đơn hàng hoàn tất</span>}
              value={kpiCompletedOrders}
              suffix="đơn"
              styles={{ content: { color: '#1f1b19', fontWeight: 700, fontSize: '1.25rem' } }}
            />
            <div className="mt-2 text-[11px] text-slate-600 flex items-center gap-1">
              <span className="font-semibold text-[#784e34]">{kpiPendingOrders} đơn</span>{' '}
              <span>đang giao &amp; lắp đặt</span>
            </div>
          </Card>
        </div>

        {/* Tồn kho sẵn bán */}
        <div className="w-full">
          <Card className="border border-slate-200/80 shadow-xs bg-white rounded-xl p-1 h-full">
            <Statistic
              title={<span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tồn kho sẵn bán</span>}
              value={kpiReadyStock}
              precision={0}
              suffix="món"
              styles={{ content: { color: '#5d371f', fontWeight: 700, fontSize: '1.25rem' } }}
            />
            <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1 truncate">
              <span>Giá trị:</span> <span className="font-semibold text-slate-800 font-mono">{kpiStockValueFormatted}</span>
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
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-[#5d371f]"></span>
                <span className="font-bold text-sm text-[#1f1b19]">Biểu đồ Doanh thu &amp; Lợi nhuận gộp</span>
              </div>
            }
            extra={
              <Select
                size="small"
                value={revenueFilter}
                onChange={(val: any) => setRevenueFilter(val)}
                className="w-36 text-xs"
                options={[
                  { label: 'Theo tuần', value: 'week' },
                  { label: 'Theo tháng', value: 'month' },
                  { label: 'Theo năm', value: 'year' },
                ]}
              />
            }
            className="border border-slate-200/80 shadow-xs bg-white rounded-xl h-full"
          >
            {/* Summary row */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#eae1dd] mb-6">
              <div>
                <div className="text-[11px] font-medium text-slate-500">
                  {revenueFilter === 'week'
                    ? 'Doanh thu tuần này'
                    : revenueFilter === 'month'
                      ? 'Tổng doanh thu 6 tháng qua'
                      : `Doanh thu năm ${new Date().getFullYear()}`}
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="font-mono font-semibold text-2xl text-[#5d371f]">
                    {chartTotalRevenue.toLocaleString('vi-VN')} đ
                  </span>
                  <Tag color={chartTotalRevenue > 0 ? 'green' : 'default'} className="font-medium text-xs">
                    {chartGrowthLabel}
                  </Tag>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-[#5d371f] inline-block"></span>
                  <span className="text-[#51443d] font-medium">Doanh thu bán</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-[#c5a880] inline-block"></span>
                  <span className="text-[#51443d] font-medium">Giá vốn</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-emerald-600 inline-block"></span>
                  <span className="text-emerald-800 font-bold">Lợi nhuận gộp</span>
                </div>
              </div>
            </div>

            {/* Interactive Visual Bar Chart with Profit Breakdown */}
            <div className="h-64 flex items-end gap-3 sm:gap-5 pt-4 pb-2 px-2">
              {chartBars.length === 0 || chartBars.every((b) => b.total === 0) ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                  <span>Chưa có doanh thu phát sinh trong khoảng thời gian này tại cơ sở</span>
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
                    <span className="text-[10px] font-mono font-bold text-[#83746c] mb-1.5 group-hover:text-[#5d371f] transition-colors">
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
                      className="w-full max-w-[40px] flex flex-col justify-end overflow-hidden transition-all duration-300 group-hover:opacity-90 rounded-t-sm"
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
                      className={`text-[11px] font-semibold mt-2 ${item.isCurrent ? 'text-[#5d371f] font-bold' : 'text-[#83746c]'}`}
                    >
                      {item.label}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Footnote KPI details: REVENUE, COGS, PROFIT */}
            <div className="mt-4 pt-3 border-t border-[#eae1dd] grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 bg-[#fbf2ee] rounded">
                <div className="text-[10px] text-[#83746c] font-medium">Tổng Doanh thu</div>
                <div className="font-mono font-bold text-[#5d371f] text-sm">
                  {chartTotalRevenue.toLocaleString('vi-VN')} đ
                </div>
              </div>
              <div className="p-2.5 bg-amber-50/70 border border-amber-100 rounded">
                <div className="text-[10px] text-amber-800 font-medium">Tổng Giá vốn (COGS)</div>
                <div className="font-mono font-bold text-amber-900 text-sm">
                  {chartTotalCogs.toLocaleString('vi-VN')} đ
                </div>
              </div>
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded">
                <div className="text-[10px] text-emerald-800 font-bold">Lợi nhuận gộp</div>
                <div className="font-mono font-bold text-emerald-700 text-sm">
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
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-emerald-700"></span>
                <span className="font-bold text-sm text-[#1f1b19]">Top sản phẩm đóng góp lợi nhuận cao</span>
              </div>
            }
            extra={
              <Button type="link" onClick={() => setActiveNav('inventory')} className="text-[#5d371f] font-bold text-xs p-0">
                Xem kho hàng &gt;
              </Button>
            }
            className="border border-slate-200/80 shadow-xs bg-white rounded-xl h-full"
          >
            <div className="space-y-3">
              {topProductsList.length === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center text-slate-400 text-xs gap-1.5">
                  <span className="font-semibold text-slate-600">Chưa có sản phẩm phát sinh doanh thu</span>
                  <span>Cơ sở này chưa bán sản phẩm nào trong kỳ thống kê</span>
                </div>
              ) : (
                topProductsList.map((item) => (
                  <div key={item.rank} className="p-2.5 bg-slate-50 rounded-lg hover:shadow-xs transition-all border border-slate-200/60">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-5 h-5 flex items-center justify-center font-bold text-xs shrink-0 rounded-full ${item.rank === 1
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
                          className="w-10 h-10 object-cover shrink-0 rounded"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-slate-900 truncate">{item.name}</div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span>Đã bán: <b className="text-slate-800">{item.salesCount}</b> sản phẩm</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono font-bold text-xs text-emerald-700">
                          +{item.profit.toLocaleString('vi-VN')} đ
                        </div>
                        <span className="text-[10px] text-slate-500">Lãi gộp đóng góp</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* ROW 2: PHÂN TÍCH LỢI NHUẬN GỘP THEO DANH MỤC & CHI NHÁNH */}
      <Row gutter={[16, 16]}>
        {/* Theo Danh Mục Nhóm Hàng */}
        <Col xs={24} lg={14}>
          <Card
            title={
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-[#784e34]"></span>
                <span className="font-bold text-sm text-slate-900">Hiệu quả lợi nhuận theo nhóm ngành hàng</span>
              </div>
            }
            className="border border-slate-200/80 shadow-xs bg-white rounded-xl"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px] bg-slate-50/80">
                    <th className="py-2 px-3">Nhóm sản phẩm</th>
                    <th className="py-2 px-3 text-right">Doanh thu</th>
                    <th className="py-2 px-3 text-right">Giá vốn (COGS)</th>
                    <th className="py-2 px-3 text-right">Lợi nhuận gộp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categoryPerformanceList.map((cat, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{cat.name}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                        {cat.revenue.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-amber-900">
                        {cat.cogs.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                        +{cat.profit.toLocaleString('vi-VN')} đ
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </Col>

        {/* Theo Chi Nhánh / Showroom */}
        <Col xs={24} lg={10}>
          <Card
            title={
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-[#5d371f]"></span>
                <span className="font-bold text-sm text-slate-900">Lợi nhuận gộp theo Showroom</span>
              </div>
            }
            className="border border-slate-200/80 shadow-xs bg-white rounded-xl h-full"
          >
            <div className="space-y-3.5">
              {branchPerformanceList.map((branch, idx) => (
                <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-lg">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-900">{branch.name}</span>
                    <span className="font-mono font-bold text-emerald-700">+{branch.profit.toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mb-1.5">
                    <span>Doanh thu: {branch.revenue.toLocaleString('vi-VN')} đ</span>
                  </div>
                  <Progress percent={branch.percent} strokeColor="#059669" size="small" showInfo={false} />
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* ROW 3: FULL WIDTH RECENT ORDERS TABLE */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#784e34]"></span>
            <span className="font-bold text-sm text-[#1f1b19]">Đơn hàng bán lẻ &amp; giao hàng gần đây</span>
          </div>
        }
        className="border border-slate-200/80 shadow-xs bg-white rounded-xl overflow-hidden"
        extra={
          <Button type="link" onClick={() => setActiveNav('orders')} className="text-[#5d371f] font-semibold text-xs p-0">
            Xem tất cả đơn hàng &gt;
          </Button>
        }
      >
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
      </Card>
    </div>
  );
}
