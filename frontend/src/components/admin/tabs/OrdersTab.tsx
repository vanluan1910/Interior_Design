import React, { useState, useMemo } from 'react';
import {
  Button,
  Select,
  Modal,
  Tag,
  Form,
  Row,
  Col,
  Space,
  Input,
  InputNumber,
  DatePicker,
  Popconfirm,
  App,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  FileExcelOutlined,
  DownloadOutlined,
  PrinterOutlined,
} from '@ant-design/icons';
import {
  AdminDataTable,
  AdminListToolbar,
  AdminFilterSidebar,
  PosDateFilter,
  checkDateInRange,
  type DateRangeValue,
} from '@/components/admin';
import { exportToExcel } from '@/utils/exportExcel';
import type { OrderRow } from '@/types/admin';
import { isMatchBranch } from '@/utils/branchHelper';
import { printOrderInvoice } from '@/utils/printHelper';

export interface OrdersTabProps {
  ordersList: OrderRow[];
  setOrdersList: React.Dispatch<React.SetStateAction<OrderRow[]>>;
  selectedGlobalBranch?: string;
  onOpenCreateOrder?: () => void;
  onOpenEditOrder?: (order: OrderRow) => void;
  onSelectOrderDetail?: (order: OrderRow) => void;
}

export function OrdersTab({
  ordersList,
  setOrdersList,
  selectedGlobalBranch = 'all',
  onOpenCreateOrder,
  onOpenEditOrder,
  onSelectOrderDetail,
}: OrdersTabProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm();

  // Local filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [orderTypeFilter, setOrderTypeFilter] = useState('all');
  const [spaceFilter, setSpaceFilter] = useState('all');
  const [orderWoodFilter, setOrderWoodFilter] = useState('all');
  const [orderDateRange, setOrderDateRange] = useState<DateRangeValue>(null);
  const [selectedOrderKeys, setSelectedOrderKeys] = useState<React.Key[]>([]);
  const [expandedOrderRowKeys, setExpandedOrderRowKeys] = useState<string[]>([]);
  const [orderPanelTabs, setOrderPanelTabs] = useState<Record<string, 'items' | 'info' | 'financial'>>({});

  // Modal State
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<OrderRow | null>(null);

  // Branch-scoped orders
  const branchScopedOrders = useMemo(() => {
    if (!selectedGlobalBranch || selectedGlobalBranch === 'all') return ordersList;
    return ordersList.filter((item) =>
      isMatchBranch(item.showroom || item.branch || item.customerAddress, selectedGlobalBranch)
    );
  }, [ordersList, selectedGlobalBranch]);

  // Filtered orders calculation
  const filteredOrders = useMemo(() => {
    return branchScopedOrders.filter((item) => {
      const matchSearch =
        !searchQuery ||
        item.orderCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.customerPhone.includes(searchQuery) ||
        item.productName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchType = orderTypeFilter === 'all' || item.orderType === orderTypeFilter;
      const matchSpace = spaceFilter === 'all' || item.spaceType === spaceFilter;
      const matchWood = orderWoodFilter === 'all' || item.woodType === orderWoodFilter;
      const matchDate = checkDateInRange(item.orderDate, orderDateRange);

      return matchSearch && matchStatus && matchType && matchSpace && matchWood && matchDate;
    });
  }, [branchScopedOrders, searchQuery, statusFilter, orderTypeFilter, spaceFilter, orderWoodFilter, orderDateRange]);

  // Derived filter counts
  const orderFilterCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: branchScopedOrders.length,
      pending: 0,
      processing: 0,
      delivering: 0,
      completed: 0,
      cancelled: 0,
    };
    branchScopedOrders.forEach((order) => {
      if (counts[order.status] !== undefined) {
        counts[order.status]++;
      }
    });
    return counts;
  }, [branchScopedOrders]);

  const orderTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: branchScopedOrders.length,
      retail: 0,
      custom: 0,
      package: 0,
      project: 0,
      subcontract: 0,
      ready: 0,
    };
    branchScopedOrders.forEach((order) => {
      if (counts[order.orderType] !== undefined) {
        counts[order.orderType]++;
      }
    });
    return counts;
  }, [branchScopedOrders]);

  const totalOrdersValue = useMemo(() => {
    return filteredOrders.reduce((sum, order) => sum + order.value, 0);
  }, [filteredOrders]);

  const totalDepositValue = useMemo(() => {
    return filteredOrders.reduce((sum, order) => sum + order.depositAmount, 0);
  }, [filteredOrders]);

  const selectedOrderTotal = useMemo(() => {
    return ordersList
      .filter((o) => selectedOrderKeys.includes(o.id))
      .reduce((sum, o) => sum + o.value, 0);
  }, [ordersList, selectedOrderKeys]);

  // Export & Action handlers
  const handleExportOrdersExcel = () => {
    const exportData = ordersList.map((o) => ({
      'Mã đơn': o.orderCode,
      'Khách hàng': o.customerName,
      'Số điện thoại': o.customerPhone,
      'Địa chỉ': o.customerAddress,
      'Sản phẩm chế tác': o.productName,
      'Quy cách kỹ thuật': o.productSpec,
      'Loại gỗ': o.woodType === 'walnut' ? 'Gỗ Óc Chó' : o.woodType === 'oak' ? 'Gỗ Sồi' : o.woodType,
      'Ngày đặt': o.orderDate,
      'Hạn bàn giao': o.deadlineDate,
      'Tổng giá trị (VNĐ)': o.value,
      'Đã đặt cọc (VNĐ)': o.depositAmount,
      'Tỷ lệ cọc (%)': `${o.depositPercent}%`,
      'Còn phải thu (VNĐ)': o.value - o.depositAmount,
      'Trạng thái': o.statusLabel,
    }));
    exportToExcel(exportData, 'Danh_sach_don_hang');
    message.success('Đã xuất danh sách đơn hàng ra file Excel thành công!');
  };

  const handleExportSingleOrderDetail = (order: OrderRow) => {
    const exportData = [
      {
        'Mã đơn': order.orderCode,
        'Tên sản phẩm': order.productName,
        'Quy cách': order.productSpec,
        'Chủng loại gỗ': `Gỗ ${order.woodType}`,
        'Số lượng': 1,
        'Đơn giá (VNĐ)': order.value,
        'Giảm giá': 0,
        'Thành tiền (VNĐ)': order.value,
        'Đã đặt cọc (VNĐ)': order.depositAmount,
        'Còn lại (VNĐ)': order.value - order.depositAmount,
        'Khách hàng': order.customerName,
        'SĐT': order.customerPhone,
        'Địa chỉ giao nhận': order.customerAddress,
        'Hạn bàn giao': order.deadlineDate,
      },
    ];
    exportToExcel(exportData, `Chi_tiet_don_hang_${order.orderCode.replace(/[^a-zA-Z0-9_-]/g, '')}`);
    message.success(`Đã xuất file chi tiết đơn hàng ${order.orderCode} thành công!`);
  };

  const handleDeleteOrder = (id: string) => {
    setOrdersList((prev) => prev.filter((o) => o.id !== id));
    message.success('Đã xóa đơn hàng thành công!');
  };

  const handleBulkDeleteOrders = () => {
    if (selectedOrderKeys.length === 0) return;
    setOrdersList((prev) => prev.filter((o) => !selectedOrderKeys.includes(o.id)));
    setSelectedOrderKeys([]);
    message.success(`Đã xóa thành công ${selectedOrderKeys.length} đơn hàng đã chọn!`);
  };

  const handleBulkUpdateStatus = (status: OrderRow['status']) => {
    if (selectedOrderKeys.length === 0) return;
    const labelMap: Record<string, string> = {
      pending: 'Chờ duyệt',
      processing: 'Đang gia công',
      delivering: 'Đang giao hàng',
      completed: 'Hoàn tất bàn giao',
      cancelled: 'Đã hủy',
    };
    setOrdersList((prev) =>
      prev.map((o) =>
        selectedOrderKeys.includes(o.id)
          ? { ...o, status, statusLabel: labelMap[status] || o.statusLabel }
          : o
      )
    );
    setSelectedOrderKeys([]);
    message.success(`Đã cập nhật trạng thái cho ${selectedOrderKeys.length} đơn hàng!`);
  };

  const handlePrintOrderReceipt = (order: OrderRow) => {
    message.info(`Đang mở lệnh in hóa đơn tạm tính cho đơn hàng ${order.orderCode}...`);
  };

  const handleOpenCreateOrder = () => {
    if (onOpenCreateOrder) {
      onOpenCreateOrder();
      return;
    }
    setEditingOrder(null);
    form.resetFields();
    form.setFieldsValue({
      orderCode: `DH-${Date.now().toString().slice(-4)}`,
      woodType: 'walnut',
      orderType: 'custom',
      status: 'pending',
      value: 45000000,
      depositAmount: 15000000,
      deadlineDate: '25/05/2026',
      showroom: selectedGlobalBranch !== 'all' ? selectedGlobalBranch : 'Showroom Nam Từ Liêm (Hà Nội)',
    });
    setIsOrderModalOpen(true);
  };

  const handleOpenEditOrder = (order: OrderRow) => {
    if (onOpenEditOrder) {
      onOpenEditOrder(order);
      return;
    }
    setEditingOrder(order);
    form.setFieldsValue({
      orderCode: order.orderCode,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerAddress: order.customerAddress,
      productName: order.productName,
      productSpec: order.productSpec,
      woodType: order.woodType,
      orderType: order.orderType,
      status: order.status,
      value: order.value,
      depositAmount: order.depositAmount,
      deadlineDate: order.deadlineDate,
      showroom: order.showroom || 'Showroom Nam Từ Liêm (Hà Nội)',
    });
    setIsOrderModalOpen(true);
  };

  const handleSaveOrder = async () => {
    try {
      const values = await form.validateFields();
      const statusLabels: Record<string, string> = {
        pending: 'Chờ duyệt',
        processing: 'Đang gia công',
        delivering: 'Đang giao hàng',
        completed: 'Hoàn tất bàn giao',
        cancelled: 'Đã hủy',
      };

      const depositPercent = values.value > 0 ? Math.round(((values.depositAmount || 0) / values.value) * 100) : 0;

      if (editingOrder) {
        setOrdersList((prev) =>
          prev.map((item) =>
            item.id === editingOrder.id
              ? {
                  ...item,
                  ...values,
                  statusLabel: statusLabels[values.status] || item.statusLabel,
                  depositPercent,
                }
              : item
          )
        );
        message.success(`Đã cập nhật đơn hàng ${values.orderCode} thành công!`);
      } else {
        const newOrder: OrderRow = {
          id: `ord_${Date.now()}`,
          orderCode: values.orderCode || `DH-${Date.now().toString().slice(-4)}`,
          customerName: values.customerName,
          customerPhone: values.customerPhone,
          customerAddress: values.customerAddress,
          productName: values.productName,
          productSpec: values.productSpec || 'Theo thiết kế kỹ thuật',
          woodType: values.woodType || 'walnut',
          value: values.value || 0,
          depositAmount: values.depositAmount || 0,
          depositPercent,
          status: values.status || 'pending',
          statusLabel: statusLabels[values.status] || 'Chờ duyệt',
          orderDate: '06/10/2026',
          deadlineDate: values.deadlineDate || '25/05/2026',
          orderType: values.orderType || 'custom',
          spaceType: 'living',
          showroom: values.showroom || 'Showroom Nam Từ Liêm (Hà Nội)',
        };
        setOrdersList((prev) => [newOrder, ...prev]);
        message.success(`Đã tạo đơn hàng mới ${newOrder.orderCode} thành công!`);
      }
      setIsOrderModalOpen(false);
    } catch {
      // Form validation failed
    }
  };

  return (
          <div className="space-y-4 w-full min-w-0 max-w-full flex-1 flex flex-col h-full">
            {/* Top Toolbar: Shared AdminListToolbar Component */}
            <AdminListToolbar
              searchPlaceholder="Theo mã đơn, tên khách, số điện thoại, sản phẩm nội thất..."
              searchValue={searchQuery}
              onSearchChange={(val) => setSearchQuery(val)}
              onRefresh={() => {
                setSearchQuery('');
                setOrderWoodFilter('all');
                setOrderTypeFilter('all');
                message.success('Đã làm mới danh sách đơn hàng!');
              }}
              onExport={handleExportOrdersExcel}
              createButtonText="Tạo đơn hàng mới"
              onCreate={handleOpenCreateOrder}
            />

            {/* STANDARDIZED 2-COLUMN LAYOUT: FILTER SIDEBAR + TABLE */}
            <div className="flex flex-col lg:flex-row gap-4 items-start w-full min-w-0 max-w-full flex-1">
              {/* Left Sidebar Filter */}
              <AdminFilterSidebar
                title="Bộ lọc đơn hàng"
                hasActiveFilters={Boolean(searchQuery || orderWoodFilter !== 'all' || orderTypeFilter !== 'all' || orderDateRange)}
                onResetFilters={() => {
                  setSearchQuery('');
                  setOrderWoodFilter('all');
                  setOrderTypeFilter('all');
                  setOrderDateRange(null);
                }}
              >
                {/* Filter 1: Thời gian tạo đơn */}
                <div>
                  <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                    Thời gian đặt hàng
                  </div>
                  <PosDateFilter
                    value={orderDateRange}
                    onChange={(range) => setOrderDateRange(range)}
                    className="w-full flex-col !items-stretch gap-2 [&_.ant-picker]:!w-full [&_.ant-select]:!w-full"
                  />
                </div>

                {/* Filter 2: Phân loại đơn hàng */}
                <div>
                  <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                    Phân loại đơn hàng
                  </div>
                  <div className="space-y-1">
                    {[
                      { value: 'all', label: 'Tất cả đơn hàng', count: branchScopedOrders.length },
                      { value: 'custom', label: '🛍️ Bán lẻ Showroom', count: branchScopedOrders.filter((o) => o.orderType === 'custom').length },
                      { value: 'package', label: '🏠 Combo Căn hộ', count: branchScopedOrders.filter((o) => o.orderType === 'package').length },
                      { value: 'subcontract', label: '📐 Dự án KTS Đối tác', count: branchScopedOrders.filter((o) => o.orderType === 'subcontract').length },
                      { value: 'ready', label: '✨ Đặt theo yêu cầu', count: branchScopedOrders.filter((o) => o.orderType === 'ready').length },
                    ].map((opt) => {
                      const isSelected = orderTypeFilter === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setOrderTypeFilter(opt.value)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer border ${isSelected
                              ? 'bg-[#784e34]/10 text-[#784e34] font-semibold border-[#784e34]/20'
                              : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50'
                            }`}
                        >
                          <span>{opt.label}</span>
                          <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                            {opt.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Filter 3: Loại gỗ tự nhiên */}
                <div>
                  <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                    Chất liệu gỗ chủ đạo
                  </div>
                  <div className="space-y-1">
                    {[
                      { value: 'all', label: 'Tất cả loại gỗ', count: branchScopedOrders.length },
                      { value: 'walnut', label: 'Gỗ Óc Chó FAS', count: branchScopedOrders.filter((o) => (o.woodType || '').toLowerCase().includes('óc chó') || o.woodType === 'walnut').length },
                      { value: 'oak', label: 'Gỗ Sồi Trắng', count: branchScopedOrders.filter((o) => (o.woodType || '').toLowerCase().includes('sồi') || o.woodType === 'oak').length },
                      { value: 'ash', label: 'Gỗ Tần Bì', count: branchScopedOrders.filter((o) => (o.woodType || '').toLowerCase().includes('tần bì') || o.woodType === 'ash').length },
                    ].map((opt) => {
                      const isSelected = orderWoodFilter === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setOrderWoodFilter(opt.value)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer border ${isSelected
                              ? 'bg-[#784e34]/10 text-[#784e34] font-semibold border-[#784e34]/20'
                              : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50'
                            }`}
                        >
                          <span>{opt.label}</span>
                          <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                            {opt.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Card Thống kê tài chính đơn hàng */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-slate-600">
                    <span>Tổng đơn hàng:</span>
                    <span className="font-mono font-medium text-slate-900">{branchScopedOrders.length} đơn</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Tổng giá trị:</span>
                    <span className="font-mono font-medium text-[#784e34]">
                      {branchScopedOrders.reduce((sum, o) => sum + o.value, 0).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Đã thu cọc:</span>
                    <span className="font-mono font-medium text-emerald-700">
                      {branchScopedOrders.reduce((sum, o) => sum + o.depositAmount, 0).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Còn phải thu:</span>
                    <span className="font-mono font-medium text-rose-600">
                      {branchScopedOrders.reduce((sum, o) => sum + (o.value - o.depositAmount), 0).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>
              </AdminFilterSidebar>

              {/* Right Table Container: Shared AdminDataTable Component */}
              <div className="flex-1 min-w-0 w-full max-w-full overflow-hidden">
                <AdminDataTable<OrderRow>
                  titleText="Danh Sách Đơn Hàng Bán Lẻ &amp; Hợp Đồng Dự Án"
                  titleIcon={<span className="w-2.5 h-2.5 rounded-full bg-[#784e34] inline-block" />}
                  countTag={`${filteredOrders.length} đơn hàng`}
                  dataSource={filteredOrders}
                  rowKey="id"
                  pagination={{ pageSize: 10, showTotal: (total) => `Tổng cộng ${total} đơn hàng` }}
                  onRow={(record) => {
                    const isExp = expandedOrderRowKeys.includes(record.id);
                    return {
                      onClick: () => {
                        setExpandedOrderRowKeys(isExp ? [] : [record.id]);
                        if (!isExp && !orderPanelTabs[record.id]) {
                          setOrderPanelTabs((prev) => ({ ...prev, [record.id]: 'items' }));
                        }
                      },
                      className: `cursor-pointer transition-colors ${isExp ? 'admin-order-row-active' : 'hover:!bg-amber-50/30'
                        }`,
                    };
                  }}
                  expandable={{
                    expandedRowKeys: expandedOrderRowKeys,
                    onExpand: (expanded, record) => {
                      setExpandedOrderRowKeys(expanded ? [record.id] : []);
                      if (expanded && !orderPanelTabs[record.id]) {
                        setOrderPanelTabs((prev) => ({ ...prev, [record.id]: 'items' }));
                      }
                    },
                    expandedRowRender: (order) => {
                      const currentTab = orderPanelTabs[order.id] || 'items';
                      const setTab = (t: 'items' | 'info' | 'financial') => {
                        setOrderPanelTabs((prev) => ({ ...prev, [order.id]: t }));
                      };

                      return (
                        <div
                          className="bg-white p-4 border-t border-b border-slate-200 shadow-inner space-y-4 text-left text-xs w-full max-w-full overflow-hidden"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Tab Navigation: Pill active style without icons + Export Button */}
                          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
                            <div className="flex items-center gap-2">
                              {[
                                { key: 'items', label: 'Hàng hóa (1)' },
                                { key: 'info', label: 'Thông tin' },
                                { key: 'financial', label: 'Lịch sử thanh toán' },
                              ].map((tab) => {
                                const isActive = currentTab === tab.key;
                                return (
                                  <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setTab(tab.key as any)}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${isActive
                                        ? 'bg-amber-50 text-[#784e34] border-[#784e34]/40 shadow-xs'
                                        : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-100 hover:text-slate-900'
                                      }`}
                                  >
                                    {tab.label}
                                  </button>
                                );
                              })}
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                icon={<PrinterOutlined />}
                                onClick={() => printOrderInvoice(order)}
                                className="h-8 px-3 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-[#784e34] hover:border-[#784e34] shadow-xs flex items-center gap-1.5"
                              >
                                In hóa đơn / Hợp đồng
                              </Button>
                              <Button
                                icon={<DownloadOutlined />}
                                onClick={() => handleExportSingleOrderDetail(order)}
                                className="h-8 px-3 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-[#784e34] hover:border-[#784e34] shadow-xs flex items-center gap-1.5"
                              >
                                Xuất file
                              </Button>
                            </div>
                          </div>

                          {/* Tab 1: Hàng hóa */}
                          {currentTab === 'items' && (
                            <div className="space-y-4">
                              {/* Sub-table Hàng hóa */}
                              <div className="overflow-x-auto border border-slate-200">
                                <table className="w-full text-left border-collapse text-xs">
                                  <thead>
                                    <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                                      <th className="py-2 px-3 font-medium whitespace-nowrap">Mã hàng</th>
                                      <th className="py-2 px-3 font-medium">Tên hàng / Quy cách chế tác</th>
                                      <th className="py-2 px-3 font-medium whitespace-nowrap">ĐVT</th>
                                      <th className="py-2 px-3 font-medium whitespace-nowrap">Loại gỗ</th>
                                      <th className="py-2 px-3 font-medium whitespace-nowrap">Hạn bàn giao</th>
                                      <th className="py-2 px-3 font-medium text-center whitespace-nowrap">Số lượng</th>
                                      <th className="py-2 px-3 font-medium text-right whitespace-nowrap">Thành tiền</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    <tr className="hover:bg-slate-50/50">
                                      <td className="py-2.5 px-3 font-mono font-medium text-[#784e34] whitespace-nowrap">{order.orderCode}</td>
                                      <td className="py-2.5 px-3">
                                        <div className="font-medium text-slate-900">{order.productName}</div>
                                        <div className="text-[11px] text-slate-500 mt-0.5">{order.productSpec}</div>
                                      </td>
                                      <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">Bộ / Chiếc</td>
                                      <td className="py-2.5 px-3 text-slate-600 capitalize whitespace-nowrap">Gỗ {order.woodType}</td>
                                      <td className="py-2.5 px-3 font-mono text-slate-700 whitespace-nowrap">{order.deadlineDate}</td>
                                      <td className="py-2.5 px-3 text-center font-medium text-slate-900 whitespace-nowrap">1</td>
                                      <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-900 whitespace-nowrap">{order.value.toLocaleString('vi-VN')} đ</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>

                              {/* Bottom Section: Ghi chú & Bảng tổng kết số tiền */}
                              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-1">
                                {/* Cột Trái: Ghi chú */}
                                <div className="md:col-span-7 space-y-1.5">
                                  <label className="font-medium text-slate-700 block text-xs">Ghi chú &amp; Địa chỉ giao hàng</label>
                                  <div className="p-3 bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                                    <div><span className="text-slate-400">Khách hàng:</span> <span className="font-medium text-slate-900">{order.customerName}</span> • <span className="text-slate-400">SĐT:</span> <span className="font-mono">{order.customerPhone}</span></div>
                                    <div><span className="text-slate-400">Địa chỉ giao nhận:</span> <span>{order.customerAddress}</span></div>
                                    <div><span className="text-slate-400">Yêu cầu kỹ thuật:</span> <span>{order.productSpec}</span></div>
                                    <div><span className="text-slate-400">Ngày đặt hàng:</span> <span className="font-mono">{order.orderDate}</span> • <span className="text-slate-400">Hạn bàn giao:</span> <span className="font-mono text-rose-600">{order.deadlineDate}</span></div>
                                  </div>
                                </div>

                                {/* Cột Phải: Bảng tóm tắt tài chính */}
                                <div className="md:col-span-5 p-3 bg-slate-50 border border-slate-200 space-y-1.5 text-xs flex flex-col justify-between">
                                  <div className="space-y-1.5">
                                    <div className="flex justify-between text-slate-600 py-0.5">
                                      <span>Tổng tiền hàng (1 món)</span>
                                      <span className="font-mono text-slate-900 font-medium">{order.value.toLocaleString('vi-VN')} đ</span>
                                    </div>
                                    <div className="flex justify-between text-emerald-700 py-0.5">
                                      <span>Tiền đã đặt cọc ({order.depositPercent}%)</span>
                                      <span className="font-mono font-medium text-emerald-700">{order.depositAmount.toLocaleString('vi-VN')} đ</span>
                                    </div>
                                    <div className="flex justify-between text-rose-600 py-0.5">
                                      <span>Còn phải thu</span>
                                      <span className="font-mono font-medium text-rose-600">{(order.value - order.depositAmount).toLocaleString('vi-VN')} đ</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Tab 2: Thông tin chi tiết */}
                          {currentTab === 'info' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-4 border border-slate-200 text-xs">
                              <div>
                                <span className="text-slate-400 block mb-0.5">Khách hàng:</span>
                                <span className="font-medium text-slate-900 text-sm">{order.customerName}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block mb-0.5">Số điện thoại:</span>
                                <span className="font-mono font-medium text-slate-900 text-sm">{order.customerPhone}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block mb-0.5">Ngày đặt hàng:</span>
                                <span className="font-mono text-slate-700">{order.orderDate}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block mb-0.5">Hạn bàn giao:</span>
                                <span className="font-mono font-medium text-rose-600">{order.deadlineDate}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block mb-0.5">Loại gỗ chế tác:</span>
                                <span className="font-medium text-[#784e34] capitalize">Gỗ {order.woodType} tự nhiên</span>
                              </div>
                              <div className="lg:col-span-3">
                                <span className="text-slate-400 block mb-0.5">Địa chỉ giao hàng:</span>
                                <span className="font-normal text-slate-800">{order.customerAddress}</span>
                              </div>
                              <div className="lg:col-span-4 pt-2 border-t border-slate-100">
                                <span className="text-slate-400 block mb-0.5">Quy cách kỹ thuật may đo:</span>
                                <span className="font-normal text-slate-800">{order.productSpec}</span>
                              </div>
                            </div>
                          )}

                          {/* Tab 3: Lịch sử thanh toán */}
                          {currentTab === 'financial' && (
                            <div className="space-y-4">
                              {/* Sub-table Lịch sử thanh toán */}
                              <div className="overflow-x-auto border border-slate-200">
                                <table className="w-full text-left border-collapse text-xs">
                                  <thead>
                                    <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                                      <th className="py-2 px-3 font-medium whitespace-nowrap">Mã phiếu / Thời gian</th>
                                      <th className="py-2 px-3 font-medium whitespace-nowrap">Phương thức</th>
                                      <th className="py-2 px-3 font-medium">Nội dung đợt thu</th>
                                      <th className="py-2 px-3 font-medium text-center whitespace-nowrap">Trạng thái</th>
                                      <th className="py-2 px-3 font-medium text-right whitespace-nowrap">Số tiền</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    <tr className="hover:bg-slate-50/50">
                                      <td className="py-2.5 px-3">
                                        <div className="font-mono font-medium text-[#784e34]">PT-{order.orderCode}-01</div>
                                        <div className="text-[11px] text-slate-500">{order.orderDate} 09:30</div>
                                      </td>
                                      <td className="py-2.5 px-3 text-slate-700">Chuyển khoản MBBank / QR</td>
                                      <td className="py-2.5 px-3">
                                        <div className="text-slate-900 font-medium">Đặt cọc sản xuất đợt 1 ({order.depositPercent}%)</div>
                                        <div className="text-[11px] text-slate-500">Người lập: Kế toán bán hàng</div>
                                      </td>
                                      <td className="py-2.5 px-3 text-center">
                                        <span className="inline-block px-2 py-0.5 text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                          Đã thu tiền
                                        </span>
                                      </td>
                                      <td className="py-2.5 px-3 text-right font-mono font-medium text-emerald-700 whitespace-nowrap">
                                        {order.depositAmount.toLocaleString('vi-VN')} đ
                                      </td>
                                    </tr>
                                    {order.value - order.depositAmount > 0 && (
                                      <tr className="hover:bg-slate-50/50">
                                        <td className="py-2.5 px-3">
                                          <div className="font-mono text-slate-400">PT-{order.orderCode}-02</div>
                                          <div className="text-[11px] text-slate-500">{order.deadlineDate} (Dự kiến)</div>
                                        </td>
                                        <td className="py-2.5 px-3 text-slate-500">Tiền mặt / Chuyển khoản</td>
                                        <td className="py-2.5 px-3">
                                          <div className="text-slate-700">Tất toán đợt cuối khi nghiệm thu &amp; bàn giao</div>
                                          <div className="text-[11px] text-slate-500">Người lập: NV Lắp đặt &amp; Giao hàng</div>
                                        </td>
                                        <td className="py-2.5 px-3 text-center">
                                          <span className="inline-block px-2 py-0.5 text-[11px] font-medium bg-amber-50 text-[#784e34] border border-amber-200">
                                            Chờ thu khi giao
                                          </span>
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-mono font-medium text-rose-600 whitespace-nowrap">
                                          {(order.value - order.depositAmount).toLocaleString('vi-VN')} đ
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>

                              {/* Bottom Section: Thông tin tài khoản & Tổng kết số tiền */}
                              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-1">
                                {/* Cột Trái: Thông tin tài khoản nhận tiền & Điều khoản */}
                                <div className="md:col-span-7 space-y-1.5">
                                  <label className="font-medium text-slate-700 block text-xs">Thông tin &amp; Điều khoản thanh toán</label>
                                  <div className="p-3 bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                                    <div><span className="text-slate-400">Tài khoản nhận tiền:</span> <span className="font-medium text-slate-900">MBBank - 0987654321</span> (CTCP Nội thất Mộc Gia)</div>
                                    <div><span className="text-slate-400">Điều khoản cọc:</span> <span>Đặt cọc trước {order.depositPercent}% tổng giá trị để tiến hành sản xuất hoàn thiện.</span></div>
                                    <div><span className="text-slate-400">Quy định thanh toán đợt cuối:</span> <span>Thanh toán 100% số tiền còn lại sau khi nghiệm thu lắp đặt tại công trình.</span></div>
                                    <div><span className="text-slate-400">Xuất hóa đơn GTGT:</span> <span>Đã ghi nhận thông tin xuất hóa đơn điện tử theo hợp đồng.</span></div>
                                  </div>
                                </div>

                                {/* Cột Phải: Bảng tóm tắt tài chính */}
                                <div className="md:col-span-5 p-3 bg-slate-50 border border-slate-200 space-y-1.5 text-xs flex flex-col justify-between">
                                  <div className="space-y-1.5">
                                    <div className="flex justify-between text-slate-600 py-0.5">
                                      <span>Tổng giá trị đơn hàng</span>
                                      <span className="font-mono font-medium text-slate-900">{order.value.toLocaleString('vi-VN')} đ</span>
                                    </div>
                                    <div className="flex justify-between text-emerald-700 py-0.5">
                                      <span>Tiền đã thanh toán (Đã cọc)</span>
                                      <span className="font-mono font-medium text-emerald-700">{order.depositAmount.toLocaleString('vi-VN')} đ</span>
                                    </div>
                                    <div className="flex justify-between text-rose-600 py-0.5">
                                      <span>Số tiền còn phải thu</span>
                                      <span className="font-mono font-medium text-rose-600">{(order.value - order.depositAmount).toLocaleString('vi-VN')} đ</span>
                                    </div>
                                    <div className="flex justify-between text-slate-900 font-medium pt-1.5 border-t border-slate-200">
                                      <span>Tỷ lệ đã thanh toán</span>
                                      <span className="font-mono text-xs font-bold text-[#784e34]">{order.depositPercent}%</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    },
                  }}
                  columns={[
                    {
                      title: 'Mã đơn',
                      dataIndex: 'orderCode',
                      key: 'orderCode',
                      width: 155,
                      render: (text) => (
                        <span className="font-mono text-xs font-semibold text-[#784e34] bg-[#784e34]/10 px-2.5 py-1 whitespace-nowrap inline-block rounded">
                          {text}
                        </span>
                      ),
                    },
                    {
                      title: 'Khách hàng',
                      dataIndex: 'customerName',
                      key: 'customerName',
                      width: 200,
                      render: (text) => (
                        <span className="font-semibold text-slate-900 text-sm">{text}</span>
                      ),
                    },
                    {
                      title: 'Sản phẩm may đo',
                      dataIndex: 'productName',
                      key: 'productName',
                      render: (text) => (
                        <span className="font-normal text-slate-700 text-sm">{text}</span>
                      ),
                    },
                    {
                      title: 'Tổng giá trị',
                      dataIndex: 'value',
                      key: 'value',
                      align: 'right',
                      width: 160,
                      render: (val) => (
                        <span className="font-mono font-semibold text-sm text-[#784e34]">
                          {val.toLocaleString('vi-VN')} đ
                        </span>
                      ),
                    },
                    {
                      title: 'Hạn bàn giao',
                      dataIndex: 'deadlineDate',
                      key: 'deadlineDate',
                      width: 140,
                      render: (d) => (
                        <span className="font-mono text-sm font-normal text-rose-700">
                          {d}
                        </span>
                      ),
                    },
                    {
                      title: 'Thao tác',
                      key: 'actions',
                      align: 'right',
                      width: 85,
                      render: (_, r) => (
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <Button
                            type="text"
                            size="small"
                            icon={<PrinterOutlined className="text-slate-600 hover:text-[#784e34] text-base" />}
                            title="In hóa đơn / Phiếu may đo"
                            onClick={() => printOrderInvoice(r)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100"
                          />
                          <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined className="text-slate-600 hover:text-[#784e34] text-base" />}
                            onClick={() => handleOpenEditOrder(r)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100"
                          />
                          <Popconfirm
                            title="Xác nhận xóa đơn hàng"
                            description={`Bạn có chắc chắn muốn xóa đơn ${r.orderCode}?`}
                            onConfirm={() => {
                              setOrdersList((prev) => prev.filter((item) => item.id !== r.id));
                              message.success(`Đã xóa đơn hàng ${r.orderCode}!`);
                            }}
                            okText="Xóa"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true }}
                          >
                            <Button
                              type="text"
                              size="small"
                              danger
                              icon={<DeleteOutlined className="text-base" />}
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-rose-50 text-rose-600"
                            />
                          </Popconfirm>
                        </div>
                      ),
                    },
                  ]}
                />
            </div>
          </div>

          {/* CREATE / EDIT ORDER MODAL */}
          <Modal
            title={editingOrder ? `Chỉnh sửa đơn hàng ${editingOrder.orderCode}` : 'Tạo mới đơn hàng'}
            open={isOrderModalOpen}
            onOk={handleSaveOrder}
            onCancel={() => setIsOrderModalOpen(false)}
            okText={editingOrder ? 'Cập nhật' : 'Tạo đơn'}
            cancelText="Hủy"
            width={700}
          >
            <Form form={form} layout="vertical" className="mt-4">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Mã đơn hàng"
                    name="orderCode"
                    rules={[{ required: true, message: 'Vui lòng nhập mã đơn hàng' }]}
                  >
                    <Input placeholder="VD: DH-2026-09" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Phân loại đơn"
                    name="orderType"
                    rules={[{ required: true, message: 'Vui lòng chọn loại đơn' }]}
                  >
                    <Select
                      options={[
                        { value: 'custom', label: '🛍️ Bán lẻ Showroom' },
                        { value: 'package', label: '📦 Thi công trọn gói' },
                        { value: 'project', label: '🏢 Dự án / Doanh nghiệp' },
                      ]}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Tên khách hàng"
                    name="customerName"
                    rules={[{ required: true, message: 'Vui lòng nhập tên khách hàng' }]}
                  >
                    <Input placeholder="VD: Nguyễn Văn Luân" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Số điện thoại"
                    name="customerPhone"
                    rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
                  >
                    <Input placeholder="VD: 0918 345 678" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="Địa chỉ giao nhận" name="customerAddress">
                <Input placeholder="VD: Vinhomes Grand Park, TP. Thủ Đức" />
              </Form.Item>

              <Row gutter={16}>
                <Col span={14}>
                  <Form.Item
                    label="Sản phẩm / Hạng mục đặt làm"
                    name="productName"
                    rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}
                  >
                    <Input placeholder="VD: Sofa Chữ L Óc Chó Kyoto" />
                  </Form.Item>
                </Col>
                <Col span={10}>
                  <Form.Item label="Chủng loại gỗ" name="woodType">
                    <Select
                      options={[
                        { value: 'walnut', label: 'Gỗ Óc Chó (FAS)' },
                        { value: 'oak', label: 'Gỗ Sồi Mỹ (White Oak)' },
                        { value: 'lim', label: 'Gỗ Lim Xanh' },
                        { value: 'other', label: 'Khác' },
                      ]}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="Quy cách / Kích thước kỹ thuật" name="productSpec">
                <Input placeholder="VD: 2800 x 1800 x 850 mm - Đệm Bỉ" />
              </Form.Item>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label="Tổng giá trị (VNĐ)"
                    name="value"
                    rules={[{ required: true, message: 'Vui lòng nhập tổng tiền' }]}
                  >
                    <InputNumber
                      className="w-full"
                      formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={(val) => (val ? Number(val.replace(/\$\s?|(,*)/g, '')) : 0)}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Đã đặt cọc (VNĐ)" name="depositAmount">
                    <InputNumber
                      className="w-full"
                      formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={(val) => (val ? Number(val.replace(/\$\s?|(,*)/g, '')) : 0)}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Hạn bàn giao" name="deadlineDate">
                    <Input placeholder="VD: 25/05/2026" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Trạng thái đơn hàng" name="status">
                    <Select
                      options={[
                        { value: 'pending', label: 'Chờ duyệt' },
                        { value: 'processing', label: 'Đang gia công' },
                        { value: 'delivering', label: 'Đang giao hàng' },
                        { value: 'completed', label: 'Hoàn tất bàn giao' },
                        { value: 'cancelled', label: 'Đã hủy' },
                      ]}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Chi nhánh Showroom" name="showroom">
                    <Input placeholder="VD: Showroom Nam Từ Liêm (Hà Nội)" />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Modal>
        </div>
  );
}
