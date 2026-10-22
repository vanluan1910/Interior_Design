'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Popover, Badge, Button, Tabs, Empty, Tag, Tooltip } from 'antd';
import {
  BellOutlined,
  ShoppingOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ToolOutlined,
  CheckOutlined,
  DeleteOutlined,
  ReloadOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { type OrderRow, type FeaturedCatalogProduct } from '@/types/admin';
import {
  isDesktopNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  triggerDesktopNotification,
  playChimeSound,
} from '@/utils/desktopNotification';

export interface AdminNotificationItem {
  id: string;
  type: 'order' | 'inventory' | 'workshop' | 'deposit';
  title: string;
  description: string;
  timeAgo: string;
  timestamp: number;
  unread: boolean;
  priority: 'high' | 'medium' | 'normal';
  linkTab: 'orders' | 'inventory' | 'workshop';
  meta?: {
    orderCode?: string;
    productName?: string;
    amount?: number;
    stock?: number;
  };
}

interface NotificationPopoverProps {
  orders?: OrderRow[];
  products?: FeaturedCatalogProduct[];
  onNavigateToTab: (
    tab: 'overview' | 'orders' | 'inventory' | 'categories' | 'workshop' | 'customers' | 'suppliers' | 'branches' | 'settings'
  ) => void;
  onNavigateToProduct?: (productCodeOrName: string) => void;
  onNavigateToOrder?: (orderCode: string) => void;
}

const STORAGE_READ_KEY = 'd2_admin_read_notification_ids';

function formatCurrency(amount: number): string {
  try {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  } catch {
    return `${amount.toLocaleString('vi-VN')} đ`;
  }
}

function getRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  if (diffMs < 0) return 'Vừa xong';
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec || 1} giây trước`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDays = Math.floor(diffHour / 24);
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return new Date(timestamp).toLocaleDateString('vi-VN');
}

export function NotificationPopover({
  orders = [],
  products = [],
  onNavigateToTab,
  onNavigateToProduct,
  onNavigateToOrder,
}: NotificationPopoverProps) {
  const [open, setOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'order' | 'inventory' | 'workshop'>('all');
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('d2_admin_notif_sound') !== 'disabled';
  });

  useEffect(() => {
    if (isDesktopNotificationSupported()) {
      setPermission(getNotificationPermission());
    }
  }, []);

  const handleRequestPermission = async () => {
    const perm = await requestNotificationPermission();
    setPermission(perm);
    if (perm === 'granted') {
      if (soundEnabled) playChimeSound();
      triggerDesktopNotification('🔔 D2 LUXURY: Đã kích hoạt thông báo Desktop!', {
        body: 'Khi có đơn hàng mới hoặc cảnh báo kho, hệ thống sẽ đẩy thông báo trực tiếp ra màn hình máy tính của bạn như Zalo/Facebook.',
      });
    }
  };

  const handleTestDesktopNotification = () => {
    if (soundEnabled) playChimeSound();
    triggerDesktopNotification('🎉 D2 LUXURY: Thử nghiệm thông báo thành công!', {
      body: 'Thông báo Desktop đã sẵn sàng! Bạn sẽ nhận thông báo ngay cả khi đang làm việc ở ứng dụng khác.',
      onClick: () => {
        onNavigateToTab('orders');
      },
    });
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    try {
      localStorage.setItem('d2_admin_notif_sound', next ? 'enabled' : 'disabled');
    } catch {}
    if (next) playChimeSound();
  };

  const [readIds, setReadIds] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const stored = localStorage.getItem(STORAGE_READ_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Lưu danh sách ID đã đọc vào LocalStorage
  const persistReadIds = useCallback((newIds: Set<string>) => {
    setReadIds(newIds);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_READ_KEY, JSON.stringify(Array.from(newIds)));
      } catch (err) {
        console.warn('Could not persist read notification IDs:', err);
      }
    }
  }, []);

  // Tổng hợp danh sách thông báo thông minh từ Đơn hàng & Kho hàng
  const allNotifications: AdminNotificationItem[] = useMemo(() => {
    const list: AdminNotificationItem[] = [];

    // 1. Phân tích các đơn hàng (Orders)
    (orders || []).forEach((order) => {
      const orderDateMs = order.orderDate
        ? new Date(order.orderDate).getTime()
        : Date.now() - 3600000;
      const validDate = isNaN(orderDateMs) ? Date.now() - 3600000 : orderDateMs;

      // Đơn hàng mới chờ duyệt
      if (
        order.status === 'pending' ||
        order.statusLabel?.toLowerCase().includes('chờ') ||
        order.statusLabel?.toLowerCase().includes('mới')
      ) {
        list.push({
          id: `ord_pending_${order.id || order.orderCode}`,
          type: 'order',
          title: `Đơn hàng mới: ${order.orderCode}`,
          description: `Khách ${order.customerName || 'Vãng lai'} vừa đặt mua ${order.productName || 'nội thất'} (${formatCurrency(order.value || 0)})`,
          timeAgo: getRelativeTime(validDate),
          timestamp: validDate,
          unread: !readIds.has(`ord_pending_${order.id || order.orderCode}`),
          priority: 'high',
          linkTab: 'orders',
          meta: {
            orderCode: order.orderCode,
            amount: order.value,
          },
        });
      }

      // Đơn hàng đang gia công / xưởng sản xuất
      if (
        order.status === 'processing' ||
        order.orderType === 'custom' ||
        order.statusLabel?.toLowerCase().includes('gia công') ||
        order.statusLabel?.toLowerCase().includes('sản xuất')
      ) {
        list.push({
          id: `ord_process_${order.id || order.orderCode}`,
          type: 'workshop',
          title: `Tiến độ xưởng: ${order.orderCode}`,
          description: `Đơn hàng may đo "${order.productName || 'nội thất'}" đang chế tác tại xưởng`,
          timeAgo: getRelativeTime(validDate),
          timestamp: validDate,
          unread: !readIds.has(`ord_process_${order.id || order.orderCode}`),
          priority: 'medium',
          linkTab: 'workshop',
          meta: {
            orderCode: order.orderCode,
          },
        });
      }

      // Đơn hàng có cọc thanh toán
      if (order.depositAmount && order.depositAmount > 0) {
        list.push({
          id: `ord_dep_${order.id || order.orderCode}`,
          type: 'deposit',
          title: `Đã cọc: ${order.orderCode}`,
          description: `Ghi nhận đặt cọc ${formatCurrency(order.depositAmount)} từ khách ${order.customerName || ''}`,
          timeAgo: getRelativeTime(validDate),
          timestamp: validDate,
          unread: !readIds.has(`ord_dep_${order.id || order.orderCode}`),
          priority: 'normal',
          linkTab: 'orders',
          meta: {
            orderCode: order.orderCode,
            amount: order.depositAmount,
          },
        });
      }
    });

    // 2. Phân tích cảnh báo tồn kho (Inventory Low Stock)
    (products || []).forEach((prod, index) => {
      const stock = prod.inStockQty ?? prod.inStock ?? 0;
      if (stock <= 3) {
        const fakeTime = Date.now() - (index + 1) * 7200000;
        const id = `inv_low_${prod.id || prod.code || prod.name}`;
        list.push({
          id,
          type: 'inventory',
          title: `Cảnh báo tồn kho: ${prod.name}`,
          description: `Mặt hàng "${prod.name}" chỉ còn ${stock} sản phẩm trong kho. Cần nhập hoặc sản xuất thêm.`,
          timeAgo: getRelativeTime(fakeTime),
          timestamp: fakeTime,
          unread: !readIds.has(id),
          priority: stock <= 1 ? 'high' : 'medium',
          linkTab: 'inventory',
          meta: {
            productName: prod.name,
            stock,
          },
        });
      }
    });

    // Sắp xếp: Ưu tiên thông báo chưa đọc lên trước, sau đó theo thời gian mới nhất
    return list.sort((a, b) => {
      if (a.unread !== b.unread) {
        return a.unread ? -1 : 1;
      }
      return b.timestamp - a.timestamp;
    });
  }, [orders, products, readIds]);

  // Danh sách đã lọc theo tab
  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'all') return allNotifications;
    if (activeFilter === 'order') return allNotifications.filter((n) => n.type === 'order' || n.type === 'deposit');
    if (activeFilter === 'inventory') return allNotifications.filter((n) => n.type === 'inventory');
    if (activeFilter === 'workshop') return allNotifications.filter((n) => n.type === 'workshop');
    return allNotifications;
  }, [allNotifications, activeFilter]);

  // Số lượng thông báo chưa đọc
  const unreadCount = useMemo(() => {
    return allNotifications.filter((n) => n.unread).length;
  }, [allNotifications]);

  // Đánh dấu tất cả là đã đọc
  const handleMarkAllAsRead = () => {
    const nextSet = new Set(readIds);
    allNotifications.forEach((n) => nextSet.add(n.id));
    persistReadIds(nextSet);
  };

  // Click vào 1 thông báo
  const handleItemClick = (item: AdminNotificationItem) => {
    // Đánh dấu đã đọc
    if (!readIds.has(item.id)) {
      const nextSet = new Set(readIds);
      nextSet.add(item.id);
      persistReadIds(nextSet);
    }
    setOpen(false);

    // Chuyển hướng tab phù hợp
    if (item.linkTab === 'inventory') {
      if (item.meta?.productName && onNavigateToProduct) {
        onNavigateToProduct(item.meta.productName);
      } else {
        onNavigateToTab('inventory');
      }
    } else if (item.linkTab === 'orders') {
      if (item.meta?.orderCode && onNavigateToOrder) {
        onNavigateToOrder(item.meta.orderCode);
      } else {
        onNavigateToTab('orders');
      }
    } else if (item.linkTab === 'workshop') {
      onNavigateToTab('workshop');
    }
  };

  // Xóa toàn bộ lịch sử đã đọc
  const handleClearHistory = () => {
    const nextSet = new Set<string>();
    persistReadIds(nextSet);
  };

  // Render Icon theo từng loại thông báo
  const renderIcon = (type: AdminNotificationItem['type']) => {
    switch (type) {
      case 'order':
        return (
          <div className="w-9 h-9 rounded-full bg-amber-50 border border-amber-200/80 flex items-center justify-center shrink-0 text-amber-700 shadow-sm">
            <ShoppingOutlined className="text-base" />
          </div>
        );
      case 'inventory':
        return (
          <div className="w-9 h-9 rounded-full bg-rose-50 border border-rose-200/80 flex items-center justify-center shrink-0 text-rose-600 shadow-sm">
            <WarningOutlined className="text-base" />
          </div>
        );
      case 'workshop':
        return (
          <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-200/80 flex items-center justify-center shrink-0 text-blue-600 shadow-sm">
            <ToolOutlined className="text-base" />
          </div>
        );
      case 'deposit':
        return (
          <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200/80 flex items-center justify-center shrink-0 text-emerald-600 shadow-sm">
            <CheckCircleOutlined className="text-base" />
          </div>
        );
      default:
        return (
          <div className="w-9 h-9 rounded-full bg-[#f4ebe6] flex items-center justify-center shrink-0 text-[#5d371f]">
            <BellOutlined className="text-base" />
          </div>
        );
    }
  };

  const popoverContent = (
    <div className="w-[360px] sm:w-[420px] max-w-[95vw] -mx-4 -my-3 bg-[#fff8f5] text-slate-800 rounded-xl overflow-hidden font-sans">
      {/* Header */}
      <div className="px-4 py-3 bg-[#fdf5f0] border-b border-[#eae1dd] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-serif font-bold text-base text-[#2e1d13]">Thông báo hệ thống</span>
          {unreadCount > 0 && (
            <Tag color="#5d371f" className="!rounded-full text-[11px] font-semibold border-0 px-2">
              {unreadCount} mới
            </Tag>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <Tooltip title="Đánh dấu tất cả đã đọc">
              <Button
                type="text"
                size="small"
                icon={<CheckOutlined className="text-xs text-[#5d371f]" />}
                onClick={handleMarkAllAsRead}
                className="text-xs text-[#5d371f] hover:!bg-[#f4ebe6] !px-2 font-medium"
              >
                Đã đọc hết
              </Button>
            </Tooltip>
          )}
          <Tooltip title="Đặt lại trạng thái">
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined className="text-xs text-slate-400 hover:text-slate-600" />}
              onClick={handleClearHistory}
              className="!px-1.5"
            />
          </Tooltip>
        </div>
      </div>

      {/* Desktop Notification Banner */}
      <div className="px-3.5 py-2 bg-gradient-to-r from-[#fbf3ee] to-[#f5e8e0] border-b border-[#eae1dd] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {permission === 'granted' ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold text-[11.5px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Báo Desktop: Bật
            </span>
          ) : permission === 'denied' ? (
            <span className="inline-flex items-center gap-1.5 text-rose-600 font-medium text-[11px]">
              <WarningOutlined /> Bị chặn trên trình duyệt
            </span>
          ) : (
            <span className="text-[#5d371f] font-semibold text-[11.5px] flex items-center gap-1">
              📢 Bật báo Desktop (Zalo / FB)
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {permission === 'granted' ? (
            <>
              <Tooltip title={soundEnabled ? 'Tắt âm thanh chuông' : 'Bật âm thanh chuông'}>
                <button
                  type="button"
                  onClick={toggleSound}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors border ${
                    soundEnabled
                      ? 'bg-amber-100/80 text-amber-800 border-amber-300'
                      : 'bg-white text-slate-400 border-slate-200 line-through'
                  }`}
                >
                  {soundEnabled ? '🔊 Chuông' : '🔇 Chuông'}
                </button>
              </Tooltip>
              <Tooltip title="Bắn thử 1 thông báo ra góc màn hình máy tính">
                <button
                  type="button"
                  onClick={handleTestDesktopNotification}
                  className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#5d371f] text-white hover:bg-[#3d2414] transition-colors shadow-xs"
                >
                  Bắn thử
                </button>
              </Tooltip>
            </>
          ) : permission !== 'denied' ? (
            <button
              type="button"
              onClick={handleRequestPermission}
              className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#5d371f] text-white hover:bg-[#3d2414] shadow-sm transition-all"
            >
              Cho phép ngay
            </button>
          ) : null}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-3 pt-2 bg-[#fff8f5] border-b border-[#eae1dd]/60">
        <div className="flex items-center gap-1.5 text-xs overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-2.5 py-1 rounded-full text-xs transition-all border ${
              activeFilter === 'all'
                ? 'bg-[#5d371f] text-white border-[#5d371f] font-medium shadow-sm'
                : 'bg-white/80 text-slate-600 border-[#eae1dd] hover:border-[#5d371f]/50'
            }`}
          >
            Tất cả ({allNotifications.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('order')}
            className={`px-2.5 py-1 rounded-full text-xs transition-all border ${
              activeFilter === 'order'
                ? 'bg-[#5d371f] text-white border-[#5d371f] font-medium shadow-sm'
                : 'bg-white/80 text-slate-600 border-[#eae1dd] hover:border-[#5d371f]/50'
            }`}
          >
            Đơn hàng ({allNotifications.filter((n) => n.type === 'order' || n.type === 'deposit').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('inventory')}
            className={`px-2.5 py-1 rounded-full text-xs transition-all border ${
              activeFilter === 'inventory'
                ? 'bg-[#5d371f] text-white border-[#5d371f] font-medium shadow-sm'
                : 'bg-white/80 text-slate-600 border-[#eae1dd] hover:border-[#5d371f]/50'
            }`}
          >
            Kho ({allNotifications.filter((n) => n.type === 'inventory').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('workshop')}
            className={`px-2.5 py-1 rounded-full text-xs transition-all border ${
              activeFilter === 'workshop'
                ? 'bg-[#5d371f] text-white border-[#5d371f] font-medium shadow-sm'
                : 'bg-white/80 text-slate-600 border-[#eae1dd] hover:border-[#5d371f]/50'
            }`}
          >
            Xưởng ({allNotifications.filter((n) => n.type === 'workshop').length})
          </button>
        </div>
      </div>

      {/* Notification List */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-[#eae1dd]/60 bg-[#fff8f5]">
        {filteredNotifications.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-600">Không có thông báo mới nào</p>
                  <p className="text-[11px] text-slate-400">Tất cả đơn hàng và tồn kho đều đang ở trạng thái an toàn.</p>
                </div>
              }
            />
          </div>
        ) : (
          filteredNotifications.map((item) => (
            <div
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer group hover:bg-[#f6eee9] relative ${
                item.unread ? 'bg-[#fcf5f1]' : 'bg-transparent opacity-85 hover:opacity-100'
              }`}
            >
              {/* Unread indicator pip */}
              {item.unread && (
                <span className="absolute top-4 right-3.5 w-2 h-2 rounded-full bg-[#5d371f] ring-4 ring-[#5d371f]/15" />
              )}

              {renderIcon(item.type)}

              <div className="flex-1 min-w-0 pr-3">
                <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                  <span className={`text-[13px] leading-tight ${item.unread ? 'font-bold text-[#2e1d13]' : 'font-medium text-slate-700'}`}>
                    {item.title}
                  </span>
                  {item.priority === 'high' && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 font-semibold">
                      Khẩn
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mb-1.5 font-normal">
                  {item.description}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{item.timeAgo}</span>
                  <span className="text-[#5d371f] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 font-medium">
                    Xem ngay <ArrowRightOutlined className="text-[10px]" />
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 bg-[#fbf3ee] border-t border-[#eae1dd] flex items-center justify-between text-xs">
        <span className="text-slate-500 text-[11px]">D2 LUXURY Hệ Thống Điều Hành</span>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            onNavigateToTab('orders');
          }}
          className="text-[#5d371f] hover:text-[#3d2414] font-medium text-xs flex items-center gap-1 transition-colors"
        >
          Xem tất cả đơn hàng &rarr;
        </button>
      </div>
    </div>
  );

  return (
    <Popover
      content={popoverContent}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
      arrow={false}
      overlayClassName="admin-notification-popover"
    >
      <Badge
        count={unreadCount}
        overflowCount={99}
        size="small"
        offset={[-2, 4]}
        styles={{
          indicator: {
            backgroundColor: '#5d371f',
            boxShadow: '0 0 0 1.5px #fff8f5',
            fontWeight: 600,
            fontSize: '10px',
          },
        }}
      >
        <Button
          type="text"
          icon={<BellOutlined className="text-base text-[#2e1d13] group-hover:text-[#5d371f]" />}
          className="hover:!bg-[#f5ece8] flex items-center justify-center shrink-0 w-9 h-9 rounded-lg transition-colors border border-transparent hover:border-[#eae1dd]"
          title="Thông báo hệ thống"
        />
      </Badge>
    </Popover>
  );
}
export default NotificationPopover;
