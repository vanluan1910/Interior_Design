'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  App,
  Table,
  Tag,
  Modal,
  message,
  Tabs,
  Badge,
  Tooltip,
} from 'antd';
import {
  DashboardOutlined,
  ShoppingOutlined,
  SkinOutlined,
  CalendarOutlined,
  SettingOutlined,
  ArrowLeftOutlined,
  LogoutOutlined,
  UserOutlined,
  CrownOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  EyeOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  SafetyCertificateOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/context/AuthContext';
import { productsData } from '@/data/products';

interface OrderItem {
  id: string;
  orderCode: string;
  customerName: string;
  phone: string;
  itemsCount: number;
  totalAmount: number;
  paymentMethod: string;
  status: 'pending' | 'processing' | 'finishing' | 'completed';
  createdAt: string;
  address: string;
}

const INITIAL_ORDERS: OrderItem[] = [
  {
    id: 'ord_101',
    orderCode: 'D2-2025-9821',
    customerName: 'Nguyễn Hoàng Minh',
    phone: '0918 345 678',
    itemsCount: 2,
    totalAmount: 50300000,
    paymentMethod: 'VietQR (VietinBank)',
    status: 'pending',
    createdAt: 'Hôm nay, 14:30',
    address: 'Căn hộ A18.04, Tháp Maldives, Đảo Kim Cương, TP. Thủ Đức',
  },
  {
    id: 'ord_102',
    orderCode: 'D2-2025-8742',
    customerName: 'Trần Thị Thu Hằng',
    phone: '0903 889 123',
    itemsCount: 3,
    totalAmount: 94800000,
    paymentMethod: 'Đặt cọc 30%',
    status: 'processing',
    createdAt: 'Hôm qua, 09:15',
    address: 'Biệt thự Đơn lập Chateau, Phú Mỹ Hưng, Quận 7, TP. HCM',
  },
  {
    id: 'ord_103',
    orderCode: 'D2-2025-7639',
    customerName: 'Lê Văn Hoàng',
    phone: '0988 123 456',
    itemsCount: 1,
    totalAmount: 38500000,
    paymentMethod: 'Trả góp 0% (12T)',
    status: 'finishing',
    createdAt: '28/09/2026',
    address: 'Penthouse Landmark 81, Bình Thạnh, TP. HCM',
  },
  {
    id: 'ord_104',
    orderCode: 'D2-2025-6512',
    customerName: 'Phạm Quốc Bảo',
    phone: '0977 456 789',
    itemsCount: 4,
    totalAmount: 142000000,
    paymentMethod: 'VietQR (VietinBank)',
    status: 'completed',
    createdAt: '25/09/2026',
    address: 'Biệt thự Vinhomes Riverside, Long Biên, Hà Nội',
  },
];

const INITIAL_BOOKINGS = [
  {
    id: 'bk_01',
    name: 'Đoàn Nhật Quang',
    phone: '0912 345 678',
    email: 'quang.doan@invest.vn',
    space: 'Toàn bộ Căn hộ Duplex (280m²)',
    woodType: 'Gỗ Óc Chó Bắc Mỹ FAS',
    date: '30/09/2026 (14:00)',
    status: 'Mới đăng ký',
  },
  {
    id: 'bk_02',
    name: 'Bùi Lan Anh',
    phone: '0908 765 432',
    email: 'lananh.bui@gmail.com',
    space: 'Phòng khách & Phòng trà thiền',
    woodType: 'Gỗ Sồi Trắng & Mây Đan',
    date: '02/10/2026 (09:30)',
    status: 'Đã phân công KTS',
  },
];

function AdminContent() {
  const { message } = App.useApp();
  const router = useRouter();
  const { user, isAdmin, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState<OrderItem[]>(INITIAL_ORDERS);
  const [bookings, setBookings] = useState(INITIAL_BOOKINGS);
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [isOrderDetailOpen, setIsOrderDetailOpen] = useState(false);

  // Update order status
  const handleUpdateStatus = (orderId: string, newStatus: OrderItem['status']) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    message.success('Đã cập nhật trạng thái đơn hàng thành công!');
  };

  const handleLogout = () => {
    logout();
    message.info('Đã đăng xuất khỏi trang quản trị');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[#f7f2ef] text-[#1f1b19] font-body-md selection:bg-[#ffdbc8] selection:text-[#311301]">
      {/* Admin Top Navigation */}
      <header className="w-full bg-[#241c18] text-white border-b border-[#3d312a] sticky top-0 z-50 shadow-md">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-xs font-semibold text-[#d5c3ba] hover:text-white px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
            >
              <ArrowLeftOutlined /> Về Cửa Hàng
            </Link>

            <div className="flex items-center gap-2.5 border-l border-white/10 pl-4">
              <span className="font-serif text-lg font-bold tracking-wider text-[#fff8f5]">
                D2 LUXURY
              </span>
              <span className="bg-[#5d371f] text-[#ffdbb5] text-[10px] font-bold px-2 py-0.5 tracking-widest uppercase border border-[#5d371f]">
                Admin Center
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs">
              <img
                src={user?.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCat_S6E8qhOpd0scj-6rD4LfY-vo8Z8BklqUwqxMQ7KmIIIgjWnFYxUX5fCgoVlCAAL_D8yl8U9ygJ0mEVG7YKDvo7gJ6zFOVjaKRNG_Cg0c2N5V8m5uiyP19HNH0NrH3dQdUC9VFMfNIe6EMKef3NZFvNCfCOWMVw2Q1X0zJcbXJvCdsvo8d1fnvyZGmzP2qJA0aHtNnpovE1Pk7M0kbgrh3_ATbB9f5cnwRYJTPAtz9HlOwVQrbq'}
                alt="Admin Avatar"
                className="w-8 h-8 object-cover ring-1 ring-[#d5c3ba]"
              />
              <div className="hidden sm:flex flex-col text-left">
                <span className="font-bold text-[#fff8f5]">{user?.name || 'Văn Luận (Admin)'}</span>
                <span className="text-[10px] text-[#ffdbb5] font-data-mono">Tổng Quản Trị</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              type="button"
              className="p-2 text-[#d5c3ba] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Đăng xuất"
            >
              <LogoutOutlined className="text-base" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Workspace */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        {/* KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#eae1dd] p-5 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold text-[#83746c]">Doanh thu tháng 09/2026</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="font-serif text-2xl font-bold text-[#5d371f] font-data-mono">
                1.842.000.000₫
              </span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5">
                +14.8%
              </span>
            </div>
          </div>

          <div className="bg-white border border-[#eae1dd] p-5 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold text-[#83746c]">Đơn hàng đặt chế tác</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="font-serif text-2xl font-bold text-[#1f1b19] font-data-mono">
                {orders.length} Đơn hàng
              </span>
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5">
                {orders.filter((o) => o.status === 'pending').length} Chờ duyệt
              </span>
            </div>
          </div>

          <div className="bg-white border border-[#eae1dd] p-5 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold text-[#83746c]">Lịch hẹn KTS tư vấn mộc</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="font-serif text-2xl font-bold text-[#1f1b19] font-data-mono">
                {bookings.length} Lịch hẹn
              </span>
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5">
                Tuần này
              </span>
            </div>
          </div>

          <div className="bg-white border border-[#eae1dd] p-5 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold text-[#83746c]">Danh mục tác phẩm niêm yết</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="font-serif text-2xl font-bold text-[#1f1b19] font-data-mono">
                {productsData.length} Mẫu mộc
              </span>
              <span className="text-[11px] font-bold text-[#5d371f] bg-[#fbf2ee] px-2 py-0.5">
                Bắc Mỹ FAS
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="bg-white border border-[#eae1dd] shadow-sm">
          <div className="flex border-b border-[#eae1dd] px-6 text-sm font-semibold text-[#51443d] overflow-x-auto">
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-4 px-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'orders'
                  ? 'border-[#5d371f] text-[#5d371f] font-bold'
                  : 'border-transparent text-[#83746c] hover:text-[#1f1b19]'
              }`}
            >
              <ShoppingOutlined /> Quản Lý Đơn Hàng ({orders.length})
            </button>

            <button
              onClick={() => setActiveTab('bookings')}
              className={`py-4 px-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'bookings'
                  ? 'border-[#5d371f] text-[#5d371f] font-bold'
                  : 'border-transparent text-[#83746c] hover:text-[#1f1b19]'
              }`}
            >
              <CalendarOutlined /> Lịch Hẹn Tư Vấn KTS ({bookings.length})
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`py-4 px-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'products'
                  ? 'border-[#5d371f] text-[#5d371f] font-bold'
                  : 'border-transparent text-[#83746c] hover:text-[#1f1b19]'
              }`}
            >
              <SkinOutlined /> Danh Mục Sản Phẩm ({productsData.length})
            </button>
          </div>

          <div className="p-6">
            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#1f1b19]">
                      Danh sách Đơn hàng &amp; Tiến độ Chế tác
                    </h3>
                    <p className="text-xs text-[#83746c]">
                      Theo dõi quy trình nghiệm thu mộc thô, phun sơn hữu cơ và lập lịch bàn giao nhà khách.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto border border-[#eae1dd]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#fbf2ee] border-b border-[#eae1dd] text-[#51443d] font-bold">
                      <tr>
                        <th className="p-3.5">Mã Đơn</th>
                        <th className="p-3.5">Khách Hàng &amp; SĐT</th>
                        <th className="p-3.5">Địa Chỉ Bàn Giao</th>
                        <th className="p-3.5">Tổng Tiền</th>
                        <th className="p-3.5">Thanh Toán</th>
                        <th className="p-3.5">Trạng Thái</th>
                        <th className="p-3.5 text-right">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eae1dd]">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-[#faf6f3] transition-colors">
                          <td className="p-3.5 font-data-mono font-bold text-[#5d371f]">
                            {order.orderCode}
                            <span className="block text-[10px] text-[#83746c] font-normal">
                              {order.createdAt}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className="font-bold text-[#1f1b19] block">
                              {order.customerName}
                            </span>
                            <span className="text-[#83746c] font-data-mono">{order.phone}</span>
                          </td>
                          <td className="p-3.5 text-[#51443d] max-w-xs truncate" title={order.address}>
                            {order.address}
                          </td>
                          <td className="p-3.5 font-data-mono font-bold text-[#1f1b19]">
                            {order.totalAmount.toLocaleString('vi-VN')}₫
                          </td>
                          <td className="p-3.5">
                            <span className="bg-[#f5ece8] text-[#5d371f] font-medium px-2 py-0.5 border border-[#eae1dd]">
                              {order.paymentMethod}
                            </span>
                          </td>
                          <td className="p-3.5">
                            {order.status === 'pending' && (
                              <span className="bg-amber-100 text-amber-900 px-2 py-1 font-bold text-[11px]">
                                Chờ duyệt đơn
                              </span>
                            )}
                            {order.status === 'processing' && (
                              <span className="bg-blue-100 text-blue-900 px-2 py-1 font-bold text-[11px]">
                                Đang chọn phôi mộc
                              </span>
                            )}
                            {order.status === 'finishing' && (
                              <span className="bg-purple-100 text-purple-900 px-2 py-1 font-bold text-[11px]">
                                Đang phun bóng tự nhiên
                              </span>
                            )}
                            {order.status === 'completed' && (
                              <span className="bg-emerald-100 text-emerald-900 px-2 py-1 font-bold text-[11px]">
                                Đã nghiệm thu bàn giao
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-right">
                            <select
                              value={order.status}
                              onChange={(e) =>
                                handleUpdateStatus(order.id, e.target.value as OrderItem['status'])
                              }
                              className="px-2 py-1 bg-white border border-[#eae1dd] text-xs font-medium text-[#1f1b19] focus:outline-none focus:border-[#5d371f] cursor-pointer"
                            >
                              <option value="pending">Chờ duyệt</option>
                              <option value="processing">Mộc thô</option>
                              <option value="finishing">Phun bóng</option>
                              <option value="completed">Đã giao</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#1f1b19]">
                      Lịch Hẹn Khảo Sát &amp; Tư Vấn Không Gian
                    </h3>
                    <p className="text-xs text-[#83746c]">
                      Khách hàng đăng ký tư vấn trực tiếp cùng Kiến trúc sư trưởng D2 LUXURY.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto border border-[#eae1dd]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#fbf2ee] border-b border-[#eae1dd] text-[#51443d] font-bold">
                      <tr>
                        <th className="p-3.5">Khách Hàng</th>
                        <th className="p-3.5">Số Điện Thoại / Email</th>
                        <th className="p-3.5">Hạng Mục Không Gian</th>
                        <th className="p-3.5">Chất Liệu Mong Muốn</th>
                        <th className="p-3.5">Thời Gian Hẹn</th>
                        <th className="p-3.5">Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eae1dd]">
                      {bookings.map((bk) => (
                        <tr key={bk.id} className="hover:bg-[#faf6f3] transition-colors">
                          <td className="p-3.5 font-bold text-[#1f1b19]">{bk.name}</td>
                          <td className="p-3.5">
                            <span className="font-data-mono block text-[#5d371f]">{bk.phone}</span>
                            <span className="text-[#83746c]">{bk.email}</span>
                          </td>
                          <td className="p-3.5 font-medium text-[#1f1b19]">{bk.space}</td>
                          <td className="p-3.5 text-[#51443d]">{bk.woodType}</td>
                          <td className="p-3.5 font-data-mono font-bold text-[#5d371f]">
                            {bk.date}
                          </td>
                          <td className="p-3.5">
                            <span className="bg-emerald-100 text-emerald-900 px-2 py-1 font-bold text-[11px]">
                              {bk.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Products Tab */}
            {activeTab === 'products' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#1f1b19]">
                      Danh Mục Tuyệt Phẩm Nội Thất ({productsData.length} sản phẩm)
                    </h3>
                    <p className="text-xs text-[#83746c]">
                      Quản lý thông số gỗ, giá niêm yết và trạng thái trưng bày trên hệ thống.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {productsData.slice(0, 9).map((product) => (
                    <div
                      key={product.id}
                      className="bg-[#fff8f5] border border-[#eae1dd] p-4 flex gap-3.5 items-center shadow-sm"
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-20 h-20 object-cover shrink-0 border border-[#eae1dd]"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] text-[#83746c] uppercase font-bold block truncate">
                          {product.categoryName} • {product.woodType}
                        </span>
                        <h4 className="font-bold text-xs text-[#1f1b19] truncate">{product.name}</h4>
                        <p className="font-data-mono text-xs font-bold text-[#5d371f] mt-1">
                          {product.price.toLocaleString('vi-VN')}₫
                        </p>
                        <span className="text-[10px] bg-[#e1e5ce] text-[#3f4332] font-semibold px-1.5 py-0.5 mt-1 inline-block">
                          Đang niêm yết
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <App>
      <AdminContent />
    </App>
  );
}
