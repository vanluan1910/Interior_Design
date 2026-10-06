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
} from 'antd';
import {
  DownloadOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import type { OrderRow } from '@/types/admin';
import { isMatchBranch } from '@/utils/branchHelper';

const { Title, Text } = Typography;
const { Option } = Select;

export interface OverviewTabProps {
  ordersList: OrderRow[];
  selectedGlobalBranch?: string;
  onNavigateTab?: (tab: 'orders' | 'inventory' | 'categories' | 'workshop' | 'customers' | 'suppliers' | 'branches' | 'settings') => void;
}

export function OverviewTab({ ordersList, selectedGlobalBranch = 'all', onNavigateTab }: OverviewTabProps) {
  const { message } = App.useApp();
  const [revenueFilter, setRevenueFilter] = React.useState<'week' | 'month' | 'year'>('month');
  const [hoveredMonth, setHoveredMonth] = React.useState<number | null>(null);
  const setActiveNav = onNavigateTab || (() => {});

  // Branch-scoped orders
  const scopedOrders = React.useMemo(() => {
    if (!selectedGlobalBranch || selectedGlobalBranch === 'all') return ordersList;
    return ordersList.filter((o) =>
      isMatchBranch(o.showroom || o.branch || o.customerAddress, selectedGlobalBranch)
    );
  }, [ordersList, selectedGlobalBranch]);

  // Dynamic calculated metrics
  const branchRevenue = React.useMemo(() => {
    if (selectedGlobalBranch === 'all') return 1480000000;
    const totalOrderVal = scopedOrders.reduce((sum, o) => sum + (o.value || 0), 0);
    return totalOrderVal > 0 ? totalOrderVal : 420000000;
  }, [scopedOrders, selectedGlobalBranch]);

  const branchCogs = Math.round(branchRevenue * 0.57);
  const branchProfit = branchRevenue - branchCogs;
  const completedOrdersCount = scopedOrders.filter((o) => o.status === 'completed').length || (selectedGlobalBranch === 'all' ? 28 : scopedOrders.length);
  const pendingOrdersCount = scopedOrders.filter((o) => o.status === 'processing' || o.status === 'delivering').length || (selectedGlobalBranch === 'all' ? 6 : 2);
  const readyStockCount = selectedGlobalBranch === 'all' ? 348 : Math.max(45, Math.round(348 / 3));

  return (
          <div className="space-y-6 flex-1 flex flex-col h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <Title level={3} className="!mb-0 !text-[#1f1b19] font-headline-md">
                  Tổng quan hoạt động
                </Title>
                {selectedGlobalBranch !== 'all' && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Tag color="gold" className="text-xs font-semibold px-2 py-0.5 border-[#c5a880]">
                      <EnvironmentOutlined className="mr-1" />
                      Cơ sở: {selectedGlobalBranch}
                    </Tag>
                  </div>
                )}
              </div>
              <Space>
                <Select defaultValue="this_month" className="w-36 text-xs">
                  <Option value="today">Hôm nay</Option>
                  <Option value="this_week">Tuần này</Option>
                  <Option value="this_month">Tháng này</Option>
                  <Option value="this_year">Năm nay</Option>
                </Select>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() => message.success('Đã xuất báo cáo tổng quan hoạt động thành công!')}
                >
                  Xuất file
                </Button>
              </Space>
            </div>

            {/* KPI Cards: DOANH THU - GIÁ VỐN - LỢI NHUẬN GỘP - ĐƠN HÀNG - TỒN KHO (5 CỘT ĐỀU NHAU 100% CHIỀU RỘNG) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 w-full">
              <div className="w-full">
                <Card className="border border-slate-200/80 shadow-xs bg-white rounded-xl p-1 h-full">
                  <Statistic
                    title={<span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Doanh thu thuần</span>}
                    value={branchRevenue}
                    precision={0}
                    suffix="đ"
                    styles={{ content: { color: '#5d371f', fontWeight: 700, fontSize: '1.25rem' } }}
                  />
                  <div className="mt-2 text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                    <span>▲ +14.2%</span> <span className="text-slate-500 font-normal">{selectedGlobalBranch === 'all' ? 'toàn hệ thống' : 'tại cơ sở'}</span>
                  </div>
                </Card>
              </div>

              <div className="w-full">
                <Card className="border border-slate-200/80 shadow-xs bg-white rounded-xl p-1 h-full">
                  <Statistic
                    title={<span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Giá vốn hàng bán (COGS)</span>}
                    value={branchCogs}
                    precision={0}
                    suffix="đ"
                    styles={{ content: { color: '#854d0e', fontWeight: 700, fontSize: '1.25rem' } }}
                  />
                  <div className="mt-2 text-[11px] text-amber-800 font-semibold flex items-center gap-1">
                    <span>57.0%</span> <span className="text-slate-500 font-normal">tiền vốn nhập hàng</span>
                  </div>
                </Card>
              </div>

              <div className="w-full">
                <Card className="border border-emerald-200 shadow-xs bg-emerald-50/40 rounded-xl p-1 h-full">
                  <Statistic
                    title={<span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Lợi nhuận gộp (Lãi gộp)</span>}
                    value={branchProfit}
                    precision={0}
                    suffix="đ"
                    styles={{ content: { color: '#047857', fontWeight: 800, fontSize: '1.25rem' } }}
                  />
                  <div className="mt-2 text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                    <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px]">Tỷ suất: 43.0%</span>
                    <span className="text-emerald-700">▲ +16.8%</span>
                  </div>
                </Card>
              </div>

              <div className="w-full">
                <Card className="border border-slate-200/80 shadow-xs bg-white rounded-xl p-1 h-full">
                  <Statistic
                    title={<span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Đơn hàng hoàn tất</span>}
                    value={completedOrdersCount}
                    suffix="đơn"
                    styles={{ content: { color: '#1f1b19', fontWeight: 700, fontSize: '1.25rem' } }}
                  />
                  <div className="mt-2 text-[11px] text-slate-600 flex items-center gap-1">
                    <span className="font-semibold text-[#784e34]">{pendingOrdersCount} đơn</span> <span>đang giao &amp; lắp đặt</span>
                  </div>
                </Card>
              </div>

              <div className="w-full">
                <Card className="border border-slate-200/80 shadow-xs bg-white rounded-xl p-1 h-full">
                  <Statistic
                    title={<span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tồn kho sẵn bán</span>}
                    value={readyStockCount}
                    precision={0}
                    suffix="món"
                    styles={{ content: { color: '#5d371f', fontWeight: 700, fontSize: '1.25rem' } }}
                  />
                  <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1 truncate">
                    <span>Giá trị:</span> <span className="font-semibold text-slate-800 font-mono">~{(readyStockCount * 9.3).toFixed(1)} Tr đ</span>
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
                            : 'Kế hoạch doanh thu năm 2026'}
                      </div>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="font-mono font-semibold text-2xl text-[#5d371f]">
                          {revenueFilter === 'week'
                            ? '1.755.000.000'
                            : revenueFilter === 'month'
                              ? '7.970.000.000'
                              : '17.500.000.000'} đ
                        </span>
                        <Tag color="green" className="font-medium text-xs">
                          {revenueFilter === 'week' ? '▲ +12.6%' : revenueFilter === 'month' ? '▲ +18.4%' : '▲ +22.8%'}
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
                        <span className="text-[#51443d] font-medium">Giá vốn nhập (57%)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 bg-emerald-600 inline-block"></span>
                        <span className="text-emerald-800 font-bold">Lợi nhuận gộp (43%)</span>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Visual Bar Chart with Profit Breakdown */}
                  <div className="h-64 flex items-end gap-3 sm:gap-5 pt-4 pb-2 px-2">
                    {(revenueFilter === 'week'
                      ? [
                        { label: 'Thứ 2', total: 180, cogs: 104, profit: 76, percent: 55 },
                        { label: 'Thứ 3', total: 240, cogs: 136, profit: 104, percent: 72 },
                        { label: 'Thứ 4', total: 195, cogs: 111, profit: 84, percent: 60 },
                        { label: 'Thứ 5', total: 310, cogs: 173, profit: 137, percent: 90 },
                        { label: 'Thứ 6', total: 280, cogs: 159, profit: 121, percent: 82 },
                        { label: 'Thứ 7', total: 340, cogs: 193, profit: 147, percent: 98, isCurrent: true },
                        { label: 'CN', total: 210, cogs: 120, profit: 90, percent: 64 },
                      ]
                      : revenueFilter === 'month'
                        ? [
                          { label: 'T10/25', total: 1150, cogs: 667, profit: 483, percent: 62 },
                          { label: 'T11/25', total: 1320, cogs: 752, profit: 568, percent: 71 },
                          { label: 'T12/25', total: 1720, cogs: 980, profit: 740, percent: 93 },
                          { label: 'T01/26', total: 980, cogs: 568, profit: 412, percent: 53 },
                          { label: 'T02/26', total: 1320, cogs: 752, profit: 568, percent: 71 },
                          { label: 'T03/26', total: 1480, cogs: 843, profit: 637, percent: 80, isCurrent: true },
                        ]
                        : [
                          { label: '2023', total: 8400, cogs: 4872, profit: 3528, percent: 52 },
                          { label: '2024', total: 11600, cogs: 6612, profit: 4988, percent: 70 },
                          { label: '2025', total: 14800, cogs: 8436, profit: 6364, percent: 88 },
                          { label: '2026 (KH)', total: 17500, cogs: 9975, profit: 7525, percent: 100, isCurrent: true },
                        ]
                    ).map((item, idx) => (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                        onMouseEnter={() => setHoveredMonth(idx)}
                        onMouseLeave={() => setHoveredMonth(null)}
                      >
                        {/* Hover Details */}
                        {hoveredMonth === idx && (
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
                              Lợi nhuận gộp: {revenueFilter === 'year' ? (item.profit / 1000).toFixed(1) + 'B' : item.profit + 'M'} ({((item.profit / item.total) * 100).toFixed(1)}%)
                            </div>
                          </div>
                        )}

                        {/* Top value */}
                        <span className="text-[10px] font-mono font-bold text-[#83746c] mb-1.5 group-hover:text-[#5d371f] transition-colors">
                          {revenueFilter === 'year'
                            ? (item.total / 1000).toFixed(1) + 'B'
                            : item.total >= 1000
                              ? (item.total / 1000).toFixed(1) + 'B'
                              : item.total + 'M'}
                        </span>

                        {/* Stacked Bars: COGS + GROSS PROFIT */}
                        <div
                          className="w-full max-w-[40px] flex flex-col justify-end overflow-hidden transition-all duration-300 group-hover:opacity-90 rounded-t-sm"
                          style={{ height: `${item.percent}%` }}
                        >
                          <div
                            className="w-full bg-emerald-600 transition-all"
                            style={{ height: `${(item.profit / item.total) * 100}%` }}
                          />
                          <div
                            className={`w-full transition-all ${item.isCurrent ? 'bg-[#5d371f] ring-2 ring-[#784e34]' : 'bg-[#784e34]'}`}
                            style={{ height: `${(item.cogs / item.total) * 100}%` }}
                          />
                        </div>

                        {/* Label */}
                        <span
                          className={`text-[11px] font-semibold mt-2 ${item.isCurrent ? 'text-[#5d371f] font-bold' : 'text-[#83746c]'}`}
                        >
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Footnote KPI details: REVENUE, COGS, PROFIT */}
                  <div className="mt-4 pt-3 border-t border-[#eae1dd] grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2.5 bg-[#fbf2ee] rounded">
                      <div className="text-[10px] text-[#83746c] font-medium">Tổng Doanh thu</div>
                      <div className="font-mono font-bold text-[#5d371f] text-sm">
                        {revenueFilter === 'week'
                          ? '1.755.000.000 đ'
                          : revenueFilter === 'month'
                            ? '7.970.000.000 đ'
                            : '17.500.000.000 đ'}
                      </div>
                    </div>
                    <div className="p-2.5 bg-amber-50/70 border border-amber-100 rounded">
                      <div className="text-[10px] text-amber-800 font-medium">Tổng Giá vốn (COGS)</div>
                      <div className="font-mono font-bold text-amber-900 text-sm">
                        {revenueFilter === 'week'
                          ? '1.000.350.000 đ'
                          : revenueFilter === 'month'
                            ? '4.542.900.000 đ'
                            : '9.975.000.000 đ'}
                      </div>
                    </div>
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded">
                      <div className="text-[10px] text-emerald-800 font-bold">Lợi nhuận gộp (43.0%)</div>
                      <div className="font-mono font-bold text-emerald-700 text-sm">
                        {revenueFilter === 'week'
                          ? '754.650.000 đ'
                          : revenueFilter === 'month'
                            ? '3.427.100.000 đ'
                            : '7.525.000.000 đ'}
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
                    {[
                      {
                        rank: 1,
                        name: 'Bàn ăn Komorebi 2.8m Gỗ Óc Chó FAS',
                        collection: 'Bộ Sưu Tập Zen Living',
                        image: 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=600&auto=format&fit=crop&q=80',
                        salesCount: 24,
                        revenue: 2064000000,
                        cogs: 1135200000,
                        profit: 928800000,
                        margin: 45.0,
                        woodBadge: 'Óc Chó Bắc Mỹ',
                      },
                      {
                        rank: 2,
                        name: 'Bộ Sofa Kyoto Japandi Góc L Khung Sồi',
                        collection: 'Kyoto Minimalist Series',
                        image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80',
                        salesCount: 18,
                        revenue: 1584000000,
                        cogs: 950400000,
                        profit: 633600000,
                        margin: 40.0,
                        woodBadge: 'Sồi Trắng Mỹ',
                      },
                      {
                        rank: 3,
                        name: 'Hệ Tủ Áo Walk-in Closet Euralux',
                        collection: 'Euralux Custom Atelier',
                        image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=600&auto=format&fit=crop&q=80',
                        salesCount: 11,
                        revenue: 1595000000,
                        cogs: 877250000,
                        profit: 717750000,
                        margin: 45.0,
                        woodBadge: 'Sồi + Kính Khói',
                      },
                      {
                        rank: 4,
                        name: 'Kệ Tivi Console Zen Minimal Mây Đan',
                        collection: 'Japandi Heritage',
                        image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&auto=format&fit=crop&q=80',
                        salesCount: 28,
                        revenue: 907200000,
                        cogs: 498960000,
                        profit: 408240000,
                        margin: 45.0,
                        woodBadge: 'Mây & Óc Chó',
                      },
                      {
                        rank: 5,
                        name: 'Đèn Cây Decor Minimal Nordic Art',
                        collection: 'Atelier Light Series',
                        image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80',
                        salesCount: 42,
                        revenue: 378000000,
                        cogs: 181440000,
                        profit: 196560000,
                        margin: 52.0,
                        woodBadge: 'Đồng & Pha lê',
                      },
                    ].map((item) => (
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
                                <span>Đã bán: <b className="text-slate-800">{item.salesCount}</b></span>
                                <span>•</span>
                                <span className="text-emerald-700 font-bold bg-emerald-50 px-1 rounded">Biên lãi: {item.margin}%</span>
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

                        <div className="mt-2 flex items-center gap-2">
                          <Progress
                            percent={item.margin}
                            size="small"
                            showInfo={false}
                            strokeColor="#059669"
                            className="m-0 flex-1"
                          />
                          <span className="text-[10px] font-mono font-bold text-emerald-800 shrink-0">{item.margin}%</span>
                        </div>
                      </div>
                    ))}
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
                          <th className="py-2 px-3 text-center">Tỷ suất (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {[
                          { name: '🛋️ Sofa & Ghế thư giãn', revenue: 580000000, cogs: 348000000, profit: 232000000, margin: 40.0 },
                          { name: '🪑 Bàn ăn & Bàn trà gỗ cao cấp', revenue: 420000000, cogs: 231000000, profit: 189000000, margin: 45.0 },
                          { name: '🚪 Tủ áo & Kệ decor trang trí', revenue: 260000000, cogs: 143000000, profit: 117000000, margin: 45.0 },
                          { name: '🛏️ Giường ngủ & Phản Wabi-sabi', revenue: 140000000, cogs: 81200000, profit: 58800000, margin: 42.0 },
                          { name: '💡 Đèn trang trí & Phụ kiện', revenue: 80000000, cogs: 38400000, profit: 41600000, margin: 52.0 },
                        ].map((cat, idx) => (
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
                            <td className="py-2.5 px-3 text-center">
                              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700">
                                {cat.margin}%
                              </span>
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
                    {[
                      { name: 'Showroom Thảo Điền (TP.HCM)', revenue: 720000000, profit: 324000000, margin: 45.0, percent: 51 },
                      { name: 'Showroom Quận 10 (TP.HCM)', revenue: 430000000, profit: 180600000, margin: 42.0, percent: 28 },
                      { name: 'Showroom Hoàn Kiếm (Hà Nội)', revenue: 210000000, profit: 88200000, margin: 42.0, percent: 14 },
                      { name: 'Kênh Online & Đối tác KTS', revenue: 120000000, profit: 43600000, margin: 36.3, percent: 7 },
                    ].map((branch, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-lg">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-bold text-slate-900">{branch.name}</span>
                          <span className="font-mono font-bold text-emerald-700">+{branch.profit.toLocaleString('vi-VN')} đ</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                          <span>Doanh thu: {branch.revenue.toLocaleString('vi-VN')} đ</span>
                          <span className="font-semibold text-emerald-800">Biên lãi: {branch.margin}%</span>
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
                dataSource={scopedOrders.slice(0, 5)}
                rowKey="id"
                pagination={false}
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
                    render: (text, record) => (
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
                    render: (text, record) => (
                      <div>
                        <div className="font-medium text-[#1f1b19]">{text}</div>
                        <div className="text-xs text-[#83746c]">{record.productSpec}</div>
                      </div>
                    ),
                  },
                  {
                    title: 'Giá trị',
                    dataIndex: 'value',
                    key: 'value',
                    align: 'right',
                    render: (val) => <span className="font-mono font-medium text-slate-800">{val.toLocaleString('vi-VN')} đ</span>,
                  },
                  {
                    title: 'Trạng thái',
                    dataIndex: 'status',
                    key: 'status',
                    align: 'center',
                    render: (st, r) => (
                      <Tag
                        color={
                          st === 'completed'
                            ? 'green'
                            : st === 'processing'
                              ? 'orange'
                              : st === 'delivering'
                                ? 'blue'
                                : 'default'
                        }
                        className="font-medium"
                      >
                        {r.statusLabel}
                      </Tag>
                    ),
                  },
                ]}
              />
            </Card>
          </div>
  );
}
