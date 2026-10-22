'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { App, Modal, Drawer, Input, Select, DatePicker, Popconfirm } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import 'dayjs/locale/vi';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  CalendarOutlined,
  SafetyCertificateOutlined,
  CheckCircleFilled,
  RightOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SaveOutlined,
  LogoutOutlined,
  LockOutlined,
  ShoppingOutlined,
  EnvironmentOutlined,
  CarOutlined,
  ArrowRightOutlined,
  IdcardOutlined,
  FileSearchOutlined,
  LoadingOutlined,
} from '@ant-design/icons';

dayjs.extend(customParseFormat);
dayjs.locale('vi');

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { authApi } from '@/api/authApi';
import { orderApi, normalizeOrderStatus } from '@/api/orderApi';
import { ADMIN_STORAGE_KEYS, getStoredAdminData, setStoredAdminData } from '@/utils/adminStorage';
import { VIETNAM_PROVINCES } from '@/data/vietnamAddresses';

const { TextArea } = Input;

interface AddressItem {
  id: string;
  isDefault: boolean;
  title: string;
  address: string;
  city?: string;
  district?: string;
  detailAddress?: string;
  note: string;
  recipient: string;
  phone: string;
  tag: string;
}

function ProfilePageContent() {
  const { message } = App.useApp();
  const router = useRouter();
  const { user, isLoading, isAdmin, updateProfile, logout } = useAuth();
  const { cartCount } = useCart();

  // Active navigation tab on left menu
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'orders' | 'security'>('profile');

  // Form states for profile
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState<Dayjs | null>(null);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Addresses state (isolated per user)
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newRecipient, setNewRecipient] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newDistrict, setNewDistrict] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newNote, setNewNote] = useState('');

  // Return Order Drawer State
  const [returnModalOrder, setReturnModalOrder] = useState<any | null>(null);
  const [returnReason, setReturnReason] = useState<string>('Gỗ bị trầy xước / cấn móp trong vận chuyển');
  const [returnDesiredResolution, setReturnDesiredResolution] = useState<string>('Hoàn lại 100% tiền thanh toán');
  const [returnNote, setReturnNote] = useState<string>('');
  const [returnImages, setReturnImages] = useState<string[]>([]);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  const handleOpenReturnModal = (order: any) => {
    setReturnModalOrder(order);
    setReturnReason(order.returnReason || 'Gỗ bị trầy xước / cấn móp trong vận chuyển');
    setReturnDesiredResolution(order.returnDesiredResolution || 'Hoàn lại 100% tiền thanh toán');
    setReturnNote(order.returnNote || '');
    setReturnImages(order.returnImages || []);
  };

  const handleCloseReturnModal = () => {
    if (isSubmittingReturn) return;
    setReturnModalOrder(null);
    setReturnImages([]);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 5 - returnImages.length;
    if (remainingSlots <= 0) {
      message.warning('Quý khách chỉ có thể tải lên tối đa 5 hình ảnh!');
      return;
    }

    const selectedFiles = Array.from(files).slice(0, remainingSlots);

    selectedFiles.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        message.error(`Tệp ${file.name} không phải là hình ảnh hợp lệ!`);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        message.error(`Ảnh ${file.name} vượt quá dung lượng tối đa 10MB!`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          setReturnImages((prev) => (prev.length < 5 ? [...prev, base64] : prev));
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setReturnImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmitReturn = async () => {
    if (!returnModalOrder) return;
    if (!returnReason) {
      message.error('Vui lòng chọn lý do hoàn trả hàng!');
      return;
    }
    setIsSubmittingReturn(true);
    const orderId = returnModalOrder.id;
    const orderCode = (returnModalOrder.orderCode || '').toUpperCase();

    const returnNoteWithImages = returnImages.length > 0
      ? `${returnNote ? `${returnNote}\n` : ''}[Đính kèm ${returnImages.length} ảnh thực tế]`
      : returnNote;

    try {
      await orderApi.requestOrderReturn(orderId, {
        reason: returnReason,
        desiredResolution: returnDesiredResolution,
        note: returnNoteWithImages,
        images: returnImages,
      });
    } catch {}

    setUserOrders((prev) =>
      prev.map((o) =>
        o.id === orderId || (orderCode && (o.orderCode || '').toUpperCase() === orderCode)
          ? {
              ...o,
              status: 'returned',
              statusLabel: 'Khách trả hàng',
              returnReason,
              returnDesiredResolution,
              returnNote,
              returnImages,
            }
          : o
      )
    );

    // Save to user storage
    if (user?.id) {
      try {
        const userOrderKey = `d2_orders_${user.id}`;
        const saved = JSON.parse(localStorage.getItem(userOrderKey) || '[]');
        const updated = saved.map((o: any) =>
          o.id === orderId || (orderCode && (o.orderCode || '').toUpperCase() === orderCode)
            ? {
                ...o,
                status: 'returned',
                statusLabel: 'Khách trả hàng',
                returnReason,
                returnDesiredResolution,
                returnNote,
                returnImages,
              }
            : o
        );
        localStorage.setItem(userOrderKey, JSON.stringify(updated));
      } catch {}
    }

    // Sync to admin orders storage
    try {
      const adminOrders = getStoredAdminData<any[]>(ADMIN_STORAGE_KEYS.ORDERS, []);
      const updatedAdmin = adminOrders.map((o: any) =>
        o.id === orderId || (orderCode && (o.orderCode || '').toUpperCase() === orderCode)
          ? {
              ...o,
              status: 'returned',
              statusLabel: 'Khách trả hàng',
              returnReason,
              returnDesiredResolution,
              returnNote,
              returnImages,
            }
          : o
      );
      setStoredAdminData(ADMIN_STORAGE_KEYS.ORDERS, updatedAdmin);
    } catch {}

    window.dispatchEvent(
      new CustomEvent('d2_orders_updated', {
        detail: [{ id: orderId, orderCode, status: 'returned', statusLabel: 'Khách trả hàng' }],
      })
    );

    message.success('Đã gửi yêu cầu hoàn hàng thành công! Showroom sẽ liên hệ hỗ trợ quý khách sớm nhất.');
    setReturnModalOrder(null);
    setReturnImages([]);
    setIsSubmittingReturn(false);
  };

  const handleCancelPendingOrder = async (orderId: string) => {
    const targetOrder = userOrders.find((o) => o.id === orderId);
    const orderCode = (targetOrder?.orderCode || '').toUpperCase();
    try {
      await orderApi.updateOrderStatus(orderId, 'cancelled', 'Khách hàng chủ động hủy đơn');
    } catch {}

    setUserOrders((prev) =>
      prev.map((o) =>
        o.id === orderId || (orderCode && (o.orderCode || '').toUpperCase() === orderCode)
          ? { ...o, status: 'cancelled', statusLabel: 'Đã hủy' }
          : o
      )
    );

    // Save to user storage
    if (user?.id) {
      try {
        const userOrderKey = `d2_orders_${user.id}`;
        const saved = JSON.parse(localStorage.getItem(userOrderKey) || '[]');
        const updated = saved.map((o: any) =>
          o.id === orderId || (orderCode && (o.orderCode || '').toUpperCase() === orderCode)
            ? { ...o, status: 'cancelled', statusLabel: 'Đã hủy' }
            : o
        );
        localStorage.setItem(userOrderKey, JSON.stringify(updated));
      } catch {}
    }

    // Sync to admin orders storage
    try {
      const adminOrders = getStoredAdminData<any[]>(ADMIN_STORAGE_KEYS.ORDERS, []);
      const updatedAdmin = adminOrders.map((o: any) =>
        o.id === orderId || (orderCode && (o.orderCode || '').toUpperCase() === orderCode)
          ? { ...o, status: 'cancelled', statusLabel: 'Đã hủy' }
          : o
      );
      setStoredAdminData(ADMIN_STORAGE_KEYS.ORDERS, updatedAdmin);
    } catch {}

    window.dispatchEvent(
      new CustomEvent('d2_orders_updated', {
        detail: [{ id: orderId, orderCode, status: 'cancelled', statusLabel: 'Đã hủy' }],
      })
    );

    message.success('Đã hủy đơn hàng thành công!');
  };

  // Synchronize state when user changes/loads from AuthContext
  useEffect(() => {
    if (isLoading) return;

    if (user) {
      setFullName(user.name || '');
      setPhone(user.phone || '');
      setEmail(user.email || '');
      setBio(user.bio || (user.role === 'admin' ? 'Quản trị viên hệ sinh thái Nội thất Tinh hoa D2 LUXURY. Chuyên gia cố vấn chế tác gỗ óc chó & sồi Bắc Mỹ FAS.' : ''));
      if (user.dob) {
        const parsed = dayjs(user.dob, 'DD/MM/YYYY');
        setDob(parsed.isValid() ? parsed : dayjs(user.dob));
      } else {
        setDob(null);
      }

      // Load user saved addresses from localStorage (clean up any legacy mock data)
      const userAddrKey = `d2_addresses_${user.id}`;
      let initialUserAddrs: AddressItem[] = [];
      try {
        const saved = localStorage.getItem(userAddrKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            // Clean out legacy mock addresses or auto-order entries
            initialUserAddrs = parsed.filter(
              (a: AddressItem) =>
                a.id !== 'addr_01' &&
                a.id !== 'addr_02' &&
                !a.id?.startsWith('addr_order_') &&
                !a.address?.includes('Đảo Kim Cương') &&
                !a.address?.includes('Gamuda')
            );
            localStorage.setItem(userAddrKey, JSON.stringify(initialUserAddrs));
          }
        }
      } catch {
        initialUserAddrs = [];
      }
      setAddresses(initialUserAddrs);

      // Load real orders for this user from Backend API & Admin Storage (with two-way sync)
      loadUserOrders();
    } else {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const loadUserOrders = async () => {
    if (!user) return;
    setIsLoadingOrders(true);
    try {
      const userPhone = user.phone?.trim() || '';
      const userEmail = user.email?.trim() || '';
      const userName = user.name?.trim() || '';
      const userOrderKey = `d2_orders_${user.id}`;

      let localOrders: any[] = [];
      try {
        const savedOrders = localStorage.getItem(userOrderKey);
        if (savedOrders) localOrders = JSON.parse(savedOrders);
      } catch {}

      // Get admin stored orders for real-time synchronization
      const adminOrders = getStoredAdminData<any[]>(ADMIN_STORAGE_KEYS.ORDERS, []);

      // Search API by email and phone in parallel
      const apiPromises: Promise<any[]>[] = [];
      if (userEmail) apiPromises.push(orderApi.getOrders({ search: userEmail }).catch(() => []));
      if (userPhone && userPhone !== userEmail) apiPromises.push(orderApi.getOrders({ search: userPhone }).catch(() => []));
      if (apiPromises.length === 0 && userName) apiPromises.push(orderApi.getOrders({ search: userName }).catch(() => []));
      apiPromises.push(orderApi.getOrders().catch(() => []));

      const results = await Promise.all(apiPromises);
      const allApiOrders = results.flat();

      // Index of latest statuses from API + adminOrders
      const latestOrderMap = new Map<string, any>();
      for (const ord of allApiOrders) {
        const normStatus = normalizeOrderStatus(ord.status);
        const code = (ord.orderCode || ord.id || '').toUpperCase();
        if (code) latestOrderMap.set(code, { ...ord, status: normStatus });
        if (ord.id) latestOrderMap.set(String(ord.id), { ...ord, status: normStatus });
      }
      for (const ord of adminOrders) {
        const normStatus = normalizeOrderStatus(ord.status);
        const code = (ord.orderCode || ord.id || '').toUpperCase();
        if (code) latestOrderMap.set(code, { ...(latestOrderMap.get(code) || {}), ...ord, status: normStatus });
        if (ord.id) latestOrderMap.set(String(ord.id), { ...(latestOrderMap.get(String(ord.id)) || {}), ...ord, status: normStatus });
      }

      const codeMap = new Set<string>();
      const merged: any[] = [];

      // 1. Add API orders for this user
      for (const ord of allApiOrders) {
        const ordEmail = (ord.customerEmail || '').trim().toLowerCase();
        const ordPhone = (ord.customerPhone || '').replace(/\s+/g, '');
        const cleanUserPhone = userPhone.replace(/\s+/g, '');
        const isUserOrder =
          (userEmail && ordEmail === userEmail.toLowerCase()) ||
          (cleanUserPhone && ordPhone && (ordPhone === cleanUserPhone || ordPhone.endsWith(cleanUserPhone) || cleanUserPhone.endsWith(ordPhone))) ||
          Boolean((ord as any).customerId && user?.id && String((ord as any).customerId).toLowerCase() === String(user.id).toLowerCase()) ||
          localOrders.some((lo) => (lo.orderCode && lo.orderCode.toUpperCase() === ord.orderCode?.toUpperCase()) || lo.id === ord.id);

        if (!isUserOrder) continue;

        const code = (ord.orderCode || ord.id || '').toUpperCase();
        if (code && !codeMap.has(code)) {
          codeMap.add(code);
          const override = latestOrderMap.get(code) || latestOrderMap.get(String(ord.id)) || ord;
          const finalStatus = normalizeOrderStatus(override.status || ord.status);
          merged.push({
            id: ord.id,
            orderCode: ord.orderCode,
            createdAt: ord.orderDate ? dayjs(ord.orderDate).format('DD/MM/YYYY') : 'Gần đây',
            value: ord.value || 0,
            depositAmount: ord.depositAmount || 0,
            productName: ord.productName || ord.items?.[0]?.productName || 'Tác phẩm Nội thất D2 LUXURY',
            productSpec: ord.productSpec || (ord.woodType ? `Gỗ ${ord.woodType} tuyển chọn hạng 1` : 'Chế tác mộng mòi Bắc Mỹ'),
            image: ord.items?.[0]?.productImage || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&auto=format&fit=crop&q=80',
            status: finalStatus,
            statusLabel: override.statusLabel || ord.statusLabel,
            branch: ord.branch || ord.showroom || 'Showroom Trung tâm',
            items: ord.items || [],
            shippingAddress: ord.shippingAddress || ord.customerAddress || '',
            recipientName: ord.recipientName,
            recipientPhone: ord.recipientPhone,
          });
        }
      }

      // 2. Add local storage orders with latest synced status
      for (const ord of localOrders) {
        const code = (ord.orderCode || ord.id || '').toUpperCase();
        if (code && !codeMap.has(code)) {
          codeMap.add(code);
          const override = latestOrderMap.get(code) || latestOrderMap.get(String(ord.id));
          const finalStatus = normalizeOrderStatus(override?.status || ord.status);
          merged.push({
            ...ord,
            status: finalStatus,
            statusLabel: override?.statusLabel || ord.statusLabel,
          });
        }
      }

      setUserOrders(merged);
      try {
        localStorage.setItem(userOrderKey, JSON.stringify(merged));
      } catch {}
    } catch (e) {
      console.warn('Error loading user orders:', e);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  // Real-time synchronization listener when admin updates order status in other tabs/windows
  useEffect(() => {
    const handleSync = () => {
      loadUserOrders();
    };
    window.addEventListener('d2_orders_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('d2_orders_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [user]);

  // Dynamic districts for Add Address modal
  const newDistricts = useMemo(() => {
    if (!newCity) return [];
    const found = VIETNAM_PROVINCES.find((p) => p.name === newCity);
    return found ? found.districts : [];
  }, [newCity]);

  const handleNewCityChange = (cityName: string) => {
    setNewCity(cityName);
    setNewDistrict('');
  };

  // Password change modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Save profile changes to database
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      message.warning('Vui lòng nhập Họ và tên.');
      return;
    }
    try {
      setIsSavingProfile(true);
      await updateProfile({
        name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        bio: bio.trim(),
        dob: dob ? dob.format('DD/MM/YYYY') : undefined,
      });
      message.success('Đã lưu thông tin gia chủ thành công!');
    } catch (err: any) {
      message.error(err?.message || 'Không thể lưu thông tin gia chủ.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Set default address
  const handleSetDefaultAddress = (id: string) => {
    const updated = addresses.map((a) => ({
      ...a,
      isDefault: a.id === id,
    }));
    setAddresses(updated);
    if (user?.id) {
      localStorage.setItem(`d2_addresses_${user.id}`, JSON.stringify(updated));
    }
    message.success('Đã đặt làm địa chỉ bàn giao mặc định!');
  };

  // Add new address
  const handleAddAddress = () => {
    if (!newTitle.trim()) {
      message.warning('Vui lòng nhập tên gợi nhớ công trình.');
      return;
    }
    if (!newRecipient.trim()) {
      message.warning('Vui lòng nhập họ và tên người nhận.');
      return;
    }
    if (!newPhone.trim()) {
      message.warning('Vui lòng nhập số điện thoại người nhận.');
      return;
    }
    if (!newCity) {
      message.warning('Vui lòng chọn Tỉnh / Thành phố.');
      return;
    }
    if (!newDistrict) {
      message.warning('Vui lòng chọn Quận / Huyện.');
      return;
    }
    if (!newAddress.trim()) {
      message.warning('Vui lòng nhập địa chỉ chi tiết (số nhà, tên đường, căn hộ...).');
      return;
    }

    const fullFormattedAddress = `${newAddress.trim()}, ${newDistrict}, ${newCity}`;

    const item: AddressItem = {
      id: `addr_${Date.now()}`,
      isDefault: addresses.length === 0,
      title: newTitle.trim(),
      address: fullFormattedAddress,
      city: newCity,
      district: newDistrict,
      detailAddress: newAddress.trim(),
      note: newNote.trim() || 'Không có ghi chú thêm.',
      recipient: newRecipient.trim(),
      phone: newPhone.trim(),
      tag: 'Công trình mới',
    };

    const updated = [...addresses, item];
    setAddresses(updated);
    if (user?.id) {
      localStorage.setItem(`d2_addresses_${user.id}`, JSON.stringify(updated));
    }
    setIsAddAddressOpen(false);
    setNewTitle('');
    setNewRecipient('');
    setNewPhone('');
    setNewCity('');
    setNewDistrict('');
    setNewAddress('');
    setNewNote('');
    message.success('Đã thêm địa chỉ công trình mới thành công!');
  };

  // Delete address
  const handleDeleteAddress = (id: string) => {
    const updated = addresses.filter((a) => a.id !== id);
    setAddresses(updated);
    if (user?.id) {
      localStorage.setItem(`d2_addresses_${user.id}`, JSON.stringify(updated));
    }
    message.success('Đã xóa địa chỉ!');
  };

  // Handle Password Change
  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      message.warning('Vui lòng điền đầy đủ các trường mật khẩu.');
      return;
    }
    if (newPassword !== confirmPassword) {
      message.error('Mật khẩu xác nhận không khớp!');
      return;
    }
    if (newPassword.length < 6) {
      message.warning('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }

    try {
      setIsChangingPassword(true);
      if (user?.id && user.id.includes('-')) {
        await authApi.changePassword({
          userId: user.id,
          currentPassword: oldPassword,
          newPassword: newPassword,
        });
      }
      setIsPasswordModalOpen(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      message.success('Đã cập nhật mật khẩu mới thành công!');
    } catch (err: any) {
      message.error(err?.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    message.info('Đã đăng xuất tài khoản.');
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fff8f5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-2 border-[#5d371f] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-serif tracking-widest text-[#5d371f] uppercase font-semibold">
            Đang tải dữ liệu gia chủ...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fff8f5] text-[#1f1b19] font-body-md selection:bg-[#ffdbc8] selection:text-[#311301]">
      {/* Header */}
      <Header cartCount={cartCount} onOpenBooking={() => {}} />

      <main className="w-full pt-20 flex-1">
        {/* Subtle Atmospheric Background Accents */}
        <div className="relative w-full overflow-hidden pb-16">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#ffdbc8]/20 blur-3xl pointer-events-none" />
          <div className="absolute top-96 -left-32 w-80 h-80 rounded-full bg-[#efe6e3]/50 blur-2xl pointer-events-none" />

          <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14 pt-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs text-[#83746c] mb-6">
              <Link href="/" className="hover:text-[#5d371f] transition-colors">
                Trang chủ
              </Link>
              <span className="material-symbols-outlined text-[14px] text-[#d5c3ba]">chevron_right</span>
              <span className="hover:text-[#5d371f] transition-colors cursor-pointer">
                Tài khoản của tôi
              </span>
              <span className="material-symbols-outlined text-[14px] text-[#d5c3ba]">chevron_right</span>
              <span className="text-[#5d371f] font-bold">Thông tin cá nhân</span>
            </nav>

            {/* Main Layout 2 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* LEFT COLUMN: Profile Summary & Sidebar Menu */}
              <aside className="lg:col-span-4 flex flex-col gap-6">
                {/* User Summary Card */}
                <div className="bg-white border border-[#eae1dd] p-6 shadow-sm flex flex-col">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#5d371f] to-[#382012] text-[#ffdbb5] font-serif font-bold text-2xl flex items-center justify-center ring-2 ring-[#d5c3ba] shadow-sm select-none shrink-0">
                        {(user?.name || fullName || 'G').trim().charAt(0).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#5d371f] text-[#ffdbb5] flex items-center justify-center border border-white">
                        <span className="material-symbols-outlined text-[12px]">workspace_premium</span>
                      </div>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <h3 className="font-serif text-lg font-bold text-[#1f1b19] truncate">
                        {user?.name || fullName || 'Khách hàng'}
                      </h3>
                      {isAdmin && (
                        <span className="text-[10px] uppercase tracking-wider text-[#5d371f] font-bold mt-0.5">
                          Quản Trị Viên
                        </span>
                      )}
                      <span className="font-data-mono text-[11px] text-[#83746c] mt-0.5">
                        Mã KH: #{user?.id ? (user.id.length > 8 ? user.id.substring(0, 8).toUpperCase() : user.id.replace('usr_', 'MG-')) : 'MG-88910'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-[#eae1dd] flex flex-col gap-2 text-xs">
                    {email ? (
                      <div className="flex items-center gap-2.5 text-[#51443d]">
                        <span className="material-symbols-outlined text-[18px] text-[#83746c]">mail</span>
                        <span className="truncate font-data-mono">{email}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5 text-[#83746c] italic">
                        <span className="material-symbols-outlined text-[18px]">mail</span>
                        <span>Chưa cập nhật email</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2.5 text-[#51443d]">
                      <span className="material-symbols-outlined text-[18px] text-[#83746c]">call</span>
                      <span className="font-data-mono">{phone || 'Chưa có số điện thoại'}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-[#51443d]">
                      <span className="material-symbols-outlined text-[18px] text-[#83746c]">verified_user</span>
                      <span className="text-[#3f4332] font-semibold">Tài khoản đã xác thực quyền lợi FSC</span>
                    </div>

                    <div className="mt-2 pt-3 border-t border-[#eae1dd] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById('section-doi-mat-khau');
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth' });
                          } else {
                            setIsPasswordModalOpen(true);
                          }
                        }}
                        className="text-xs text-[#5d371f] hover:underline font-semibold cursor-pointer flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">lock</span>
                        <span>Đổi mật khẩu</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="text-xs text-red-600 hover:underline font-semibold cursor-pointer"
                      >
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                </div>
              </aside>

              {/* RIGHT COLUMN: Main Content Blocks */}
              <div className="lg:col-span-8 flex flex-col gap-6 min-w-0">
                {/* SECTION 1: Form Thông tin cá nhân */}
                {(activeTab === 'profile' || activeTab === 'addresses' || activeTab === 'orders') && (
                  <section className="bg-white border border-[#eae1dd] p-6 sm:p-7 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-[#eae1dd]">
                      <div>
                        <h2 className="font-serif text-lg sm:text-xl font-bold text-[#5d371f]">
                          Thông Tin Gia Chủ &amp; Liên Hệ
                        </h2>
                      </div>
                      <span className="font-data-mono text-[11px] text-[#83746c] flex items-center gap-1 shrink-0">
                        <span className="material-symbols-outlined text-[14px]">schedule</span> Cập nhật: Hôm nay
                      </span>
                    </div>

                    <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Full Name */}
                        <div className="flex flex-col gap-1.5">
                          <label className="font-semibold text-[#1f1b19] uppercase tracking-wider text-[11px]">
                            Họ và tên gia chủ *
                          </label>
                          <Input
                            size="large"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Nhập họ và tên..."
                            suffix={<span className="material-symbols-outlined text-[#83746c] text-[18px]">badge</span>}
                            className="!bg-[#fbf2ee] !border-[#eae1dd] !rounded-none !text-[#1f1b19] font-medium hover:!border-[#5d371f] focus-within:!border-[#5d371f] !py-2.5 !px-3.5"
                          />
                        </div>

                        {/* Date of Birth */}
                        <div className="flex flex-col gap-1.5">
                          <label className="font-semibold text-[#1f1b19] uppercase tracking-wider text-[11px]">
                            Ngày sinh
                          </label>
                          <DatePicker
                            size="large"
                            format={['DD/MM/YYYY', 'D/M/YYYY', 'DD-MM-YYYY', 'D-M-YYYY', 'DDMMYYYY', 'YYYY-MM-DD', 'YYYY/MM/DD']}
                            value={dob}
                            onChange={(date) => setDob(date)}
                            placeholder="DD/MM/YYYY"
                            allowClear
                            inputReadOnly={false}
                            className="w-full !bg-[#fbf2ee] !border-[#eae1dd] !rounded-none !text-[#1f1b19] font-medium hover:!border-[#5d371f] focus:!border-[#5d371f] focus-within:!border-[#5d371f] !py-2.5 !px-3.5"
                          />
                        </div>

                        {/* Phone */}
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between">
                            <label className="font-semibold text-[#1f1b19] uppercase tracking-wider text-[11px]">
                              Số điện thoại *
                            </label>
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#3f4332] bg-[#e1e5ce] px-2 py-0.5">
                              <CheckCircleFilled className="text-[10px]" /> Đã xác thực
                            </span>
                          </div>
                          <Input
                            size="large"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="0918 345 678"
                            suffix={<span className="material-symbols-outlined text-[#83746c] text-[18px]">smartphone</span>}
                            className="!bg-[#fbf2ee] !border-[#eae1dd] !rounded-none !text-[#1f1b19] font-data-mono font-medium hover:!border-[#5d371f] focus-within:!border-[#5d371f] !py-2.5 !px-3.5"
                          />
                        </div>

                        {/* Email */}
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between">
                            <label className="font-semibold text-[#1f1b19] uppercase tracking-wider text-[11px]">
                              Hòm thư điện tử
                            </label>
                            {email ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#3f4332] bg-[#e1e5ce] px-2 py-0.5">
                                <CheckCircleFilled className="text-[10px]" /> Đã xác thực
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#83746c] bg-[#f0eae6] px-2 py-0.5">
                                Chưa liên kết
                              </span>
                            )}
                          </div>
                          <Input
                            size="large"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="email@example.com (Không bắt buộc)"
                            suffix={<span className="material-symbols-outlined text-[#83746c] text-[18px]">alternate_email</span>}
                            className="!bg-[#fbf2ee] !border-[#eae1dd] !rounded-none !text-[#1f1b19] font-medium hover:!border-[#5d371f] focus-within:!border-[#5d371f] !py-2.5 !px-3.5"
                          />
                        </div>
                      </div>

                      {/* Bio / Ghi chú gia chủ */}
                      <div className="flex flex-col gap-1.5 pt-1">
                        <label className="font-semibold text-[#1f1b19] uppercase tracking-wider text-[11px]">
                          Ghi chú gu thẩm mỹ &amp; phong cách kiến trúc
                        </label>
                        <TextArea
                          rows={2}
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="Ví dụ: Căn hộ phong cách Japandi tối giản, ưu tiên bàn ghế bo cong hữu cơ..."
                          className="!bg-[#fbf2ee] !border-[#eae1dd] !rounded-none !text-[#1f1b19] font-medium hover:!border-[#5d371f] focus-within:!border-[#5d371f] !py-2.5 !px-3.5 leading-relaxed"
                        />
                      </div>

                      {/* Form Action Buttons */}
                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eae1dd]">
                        <button
                          type="button"
                          onClick={() => {
                            setFullName(user?.name || '');
                            setPhone(user?.phone || '');
                            setEmail(user?.email || '');
                            setBio(user?.bio || '');
                            if (user?.dob) {
                              const parsed = dayjs(user.dob, 'DD/MM/YYYY');
                              setDob(parsed.isValid() ? parsed : dayjs(user.dob));
                            } else {
                              setDob(null);
                            }
                            message.info('Đã hoàn tác thay đổi.');
                          }}
                          className="px-4 py-2 text-[#51443d] hover:bg-[#f5ece8] font-semibold transition-colors cursor-pointer"
                        >
                          Hoàn tác
                        </button>
                        <button
                          type="submit"
                          disabled={isSavingProfile}
                          className="px-6 py-2 bg-[#5d371f] text-white hover:bg-[#784e34] font-semibold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-70"
                        >
                          <SaveOutlined /> {isSavingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                      </div>
                    </form>
                  </section>
                )}

                {/* SECTION 2: Sổ Địa Chỉ Công Trình */}
                <section className="bg-white border border-[#eae1dd] p-6 sm:p-7 shadow-sm">
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#eae1dd]">
                    <div>
                      <h2 className="font-serif text-lg sm:text-xl font-bold text-[#5d371f]">
                        Sổ Địa Chỉ Công Trình &amp; Giao Hàng Mặc Định
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAddAddressOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#fbf2ee] hover:bg-[#5d371f] hover:text-white border border-[#eae1dd] text-[#5d371f] font-semibold text-xs transition-colors cursor-pointer"
                    >
                      <PlusOutlined /> Thêm địa chỉ mới
                    </button>
                  </div>

                  {addresses.length === 0 ? (
                    <div className="p-8 text-center bg-[#fbf2ee] border border-[#eae1dd] flex flex-col items-center justify-center">
                      <span className="material-symbols-outlined text-[36px] text-[#83746c] mb-2">home_pin</span>
                      <h4 className="font-bold text-sm text-[#1f1b19]">Quý khách chưa lưu địa chỉ công trình nào</h4>
                      <p className="text-xs text-[#83746c] mt-1 max-w-sm">
                        Quý khách có thể thêm địa chỉ nhận hàng để tiện cho việc may đo và bàn giao nội thất tận nhà.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsAddAddressOpen(true)}
                        className="mt-4 px-4 py-2 bg-[#5d371f] hover:bg-[#784e34] text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <PlusOutlined /> Thêm địa chỉ mới
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {addresses.map((addr) => (
                        <div
                          key={addr.id}
                          className={`p-4 border flex flex-col justify-between shadow-sm transition-all ${
                            addr.isDefault
                              ? 'bg-[#fbf2ee] border-[#5d371f]'
                              : 'bg-white border-[#eae1dd] hover:border-[#5d371f]/50'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span
                                className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider ${
                                  addr.isDefault
                                    ? 'bg-[#5d371f] text-white'
                                    : 'bg-[#f5ece8] text-[#51443d]'
                                }`}
                              >
                                {addr.isDefault ? 'Địa chỉ mặc định' : addr.tag}
                              </span>
                              <div className="flex items-center gap-1.5">
                                {!addr.isDefault && (
                                  <button
                                    type="button"
                                    onClick={() => handleSetDefaultAddress(addr.id)}
                                    className="text-[11px] text-[#5d371f] hover:underline font-semibold cursor-pointer"
                                  >
                                    Đặt mặc định
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAddress(addr.id)}
                                  className="p-1 text-[#83746c] hover:text-red-600 transition-colors cursor-pointer"
                                  title="Xóa địa chỉ"
                                >
                                  <DeleteOutlined />
                                </button>
                              </div>
                            </div>

                            <h4 className="font-bold text-sm text-[#1f1b19]">{addr.title}</h4>
                            <p className="text-xs text-[#51443d] mt-1 leading-relaxed">
                              {addr.address}
                            </p>
                            <div className="mt-2.5 p-2 bg-white/80 border border-[#eae1dd] text-[11px] text-[#83746c] flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[16px] text-[#5d371f]">info</span>
                              <span>{addr.note}</span>
                            </div>
                          </div>

                          <div className="pt-3 mt-3 border-t border-[#eae1dd]/60 flex items-center justify-between font-data-mono text-xs text-[#83746c]">
                            <span>Người nhận: <strong>{addr.recipient}</strong></span>
                            <span>{addr.phone}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* SECTION 3: Đơn Hàng Gần Nhất */}
                <section className="bg-white border border-[#eae1dd] p-6 sm:p-7 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-[#eae1dd]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 bg-[#f5ece8] text-[#5d371f] flex items-center justify-center font-bold">
                        <span className="material-symbols-outlined text-[22px]">construction</span>
                      </div>
                      <div>
                        <h2 className="font-serif text-lg sm:text-xl font-bold text-[#5d371f]">
                          Đơn Hàng Gần Nhất {userOrders.length > 0 && `(${userOrders.length})`}
                        </h2>
                      </div>
                    </div>
                  </div>

                  {isLoadingOrders ? (
                    <div className="p-8 text-center bg-[#fbf2ee] border border-[#eae1dd] flex flex-col items-center justify-center gap-2">
                      <LoadingOutlined className="text-2xl text-[#5d371f] animate-spin" />
                      <span className="text-xs font-semibold text-[#5d371f]">Đang đồng bộ danh sách đơn hàng thực tế...</span>
                    </div>
                  ) : userOrders.length === 0 ? (
                    <div className="p-8 text-center bg-[#fbf2ee] border border-[#eae1dd] flex flex-col items-center justify-center">
                      <span className="material-symbols-outlined text-[36px] text-[#83746c] mb-2">shopping_bag</span>
                      <h4 className="font-bold text-sm text-[#1f1b19]">Quý khách chưa có đơn hàng nào</h4>
                      <p className="text-xs text-[#83746c] mt-1 max-w-sm">
                        Các đơn hàng mua sắm và tiến độ may đo gỗ tự nhiên của quý khách sẽ được lưu trữ và cập nhật tại đây.
                      </p>
                      <Link
                        href="/products"
                        className="mt-4 px-5 py-2 bg-[#5d371f] hover:bg-[#784e34] text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-sm"
                      >
                        <span>Khám phá bộ sưu tập</span>
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </Link>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {userOrders.map((ord: any) => {
                        const normStatus = normalizeOrderStatus(ord.status);
                        const statusColors: Record<string, { bg: string; text: string; border: string; label: string; step: number }> = {
                          pending: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300', label: 'Chờ duyệt', step: 1 },
                          processing: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-300', label: 'Đang gia công', step: 2 },
                          delivering: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-300', label: 'Đang giao hàng', step: 3 },
                          completed: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-300', label: 'Hoàn tất bàn giao', step: 4 },
                          cancelled: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-300', label: 'Đã hủy', step: -1 },
                          returned: { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-300', label: 'Khách trả hàng', step: -2 },
                          returned_success: { bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-300', label: 'Hoàn hàng thành công', step: -3 },
                        };
                        const currentStatus = statusColors[normStatus] || statusColors.pending;

                        return (
                          <div key={ord.id || ord.orderCode} className="bg-[#fbf2ee] border border-[#eae1dd] p-5 shadow-xs space-y-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#eae1dd]">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-data-mono font-bold text-sm text-[#5d371f]">
                                    #{ord.orderCode || 'D2-ORDER'}
                                  </span>
                                  <span className="text-[11px] text-[#83746c] font-data-mono">
                                    Ngày đặt: {ord.createdAt || 'Gần đây'}
                                  </span>
                                  <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded border ${currentStatus.bg} ${currentStatus.text} ${currentStatus.border}`}>
                                    {currentStatus.label}
                                  </span>
                                  {ord.branch && (
                                    <span className="text-[11px] text-[#83746c] font-medium hidden sm:inline">
                                      • Cơ sở: {ord.branch}
                                    </span>
                                  )}
                                  {ord.recipientName && ord.recipientName.trim().toLowerCase() !== (user?.name || '').trim().toLowerCase() && (
                                    <span className="text-[11px] text-[#784e34] bg-[#fbf2ee] px-2 py-0.5 border border-[#eae1dd] font-medium inline-flex items-center gap-1">
                                      <span className="material-symbols-outlined text-[13px]">local_shipping</span>
                                      Giao cho: {ord.recipientName} {ord.recipientPhone ? `(${ord.recipientPhone})` : ''}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-left md:text-right">
                                <span className="text-[10px] text-[#83746c] uppercase tracking-wider block">
                                  Tổng giá trị đơn hàng
                                </span>
                                <span className="font-serif text-lg font-bold text-[#5d371f] font-data-mono">
                                  {Number(ord.value || 0).toLocaleString('vi-VN')}₫
                                </span>
                                {ord.depositAmount > 0 && (
                                  <span className="text-[10px] text-emerald-700 block font-medium">
                                    Đã cọc: {Number(ord.depositAmount).toLocaleString('vi-VN')}₫
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Order Progress Stepper according to Admin status */}
                            {normStatus === 'cancelled' ? (
                              <div className="p-3 bg-rose-50/90 border border-rose-200 flex items-center gap-2.5 text-xs text-rose-800">
                                <span className="material-symbols-outlined text-[18px] text-rose-600 shrink-0">cancel</span>
                                <div>
                                  <span className="font-semibold">Đơn hàng đã hủy:</span> Đơn hàng đã được ghi nhận hủy trên hệ thống. Nếu có thắc mắc hoặc cần đặt lại, quý khách vui lòng liên hệ CSKH.
                                </div>
                              </div>
                            ) : normStatus === 'returned' ? (
                              <div className="p-3 bg-indigo-50/90 border border-indigo-200 flex items-center gap-2.5 text-xs text-indigo-800">
                                <span className="material-symbols-outlined text-[18px] text-indigo-600 shrink-0">assignment_return</span>
                                <div>
                                  <span className="font-semibold">Đã ghi nhận yêu cầu hoàn trả:</span> Showroom D2 Luxury đã tiếp nhận yêu cầu đổi trả / hoàn tiền và bộ phận dịch vụ sẽ liên hệ quý khách trong 24h.
                                </div>
                              </div>
                            ) : normStatus === 'returned_success' ? (
                              <div className="p-3 bg-teal-50/90 border border-teal-200 flex items-center gap-2.5 text-xs text-teal-800">
                                <span className="material-symbols-outlined text-[18px] text-teal-600 shrink-0">verified</span>
                                <div>
                                  <span className="font-semibold">Hoàn hàng thành công:</span> Showroom D2 Luxury đã hoàn tất thủ tục thu hồi tác phẩm và hoàn tất đối soát/hoàn trả tiền cho quý khách theo đúng cam kết.
                                </div>
                              </div>
                            ) : (
                              <div className="bg-white/80 p-3.5 border border-[#eae1dd]/80">
                                <div className="text-[11px] font-semibold text-[#83746c] uppercase tracking-wider mb-3 flex items-center justify-between">
                                  <span>Tiến độ thực hiện đơn hàng</span>
                                  <span className="text-[#5d371f] font-semibold normal-case text-xs">
                                    Trạng thái hiện tại: {currentStatus.label}
                                  </span>
                                </div>
                                <div className="grid grid-cols-4 gap-2 text-center text-xs relative">
                                  {[
                                    { stepNum: 1, title: 'Chờ duyệt', desc: 'Đã nhận đơn' },
                                    { stepNum: 2, title: 'Đang gia công', desc: 'Chế tác xưởng' },
                                    { stepNum: 3, title: 'Đang giao hàng', desc: 'Vận chuyển & lắp' },
                                    { stepNum: 4, title: 'Hoàn tất bàn giao', desc: 'Nghiệm thu & bảo hành' },
                                  ].map((st) => {
                                    const isCurrent = currentStatus.step === st.stepNum;
                                    const isPassed = currentStatus.step > st.stepNum;
                                    return (
                                      <div key={st.stepNum} className="flex flex-col items-center">
                                        <div
                                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all mb-1 ${
                                            isCurrent
                                              ? 'bg-[#5d371f] text-white shadow-xs ring-4 ring-[#5d371f]/20 scale-105'
                                              : isPassed
                                              ? 'bg-emerald-600 text-white'
                                              : 'bg-slate-100 text-slate-400 border border-slate-200'
                                          }`}
                                        >
                                          {isPassed ? '✓' : st.stepNum}
                                        </div>
                                        <span className={`font-semibold text-xs leading-tight ${isCurrent ? 'text-[#5d371f]' : isPassed ? 'text-slate-800' : 'text-slate-400'}`}>
                                          {st.title}
                                        </span>
                                        <span className="text-[10px] text-slate-500 hidden sm:inline-block mt-0.5">
                                          {st.desc}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                              <div className="flex items-center gap-3.5 w-full sm:w-auto">
                                <img
                                  src={
                                    ord.image ||
                                    ord.items?.[0]?.productImage ||
                                    'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&auto=format&fit=crop&q=80'
                                  }
                                  alt={ord.productName || 'Nội thất D2 Luxury'}
                                  className="w-16 h-16 object-cover border border-[#eae1dd] shrink-0"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&auto=format&fit=crop&q=80';
                                  }}
                                />
                                <div className="min-w-0">
                                  <h5 className="font-bold text-xs text-[#1f1b19] truncate">
                                    {ord.productName || 'Đơn hàng may đo D2 Luxury'}
                                  </h5>
                                  <p className="text-[11px] text-[#51443d] mt-0.5">
                                    {ord.productSpec || 'Quy cách: Gỗ tự nhiên Bắc Mỹ cao cấp'}
                                  </p>
                                  {Array.isArray(ord.items) && ord.items.length > 1 && (
                                    <span className="text-[10px] text-[#83746c] block mt-0.5">
                                      + {ord.items.length - 1} tác phẩm khác trong đơn
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 flex-wrap sm:flex-nowrap">
                                {normStatus === 'completed' && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenReturnModal(ord)}
                                    className="w-full sm:w-auto text-center px-3.5 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 font-bold text-xs transition-colors shrink-0 flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">assignment_return</span>
                                    <span>Yêu cầu trả hàng / Hoàn tiền</span>
                                  </button>
                                )}

                                {normStatus === 'returned' && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenReturnModal(ord)}
                                    className="w-full sm:w-auto text-center px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold inline-flex items-center justify-center gap-1 cursor-pointer transition-colors"
                                    title="Bấm để xem lại chi tiết yêu cầu hoàn trả & ảnh minh chứng"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">assignment_return</span>
                                    <span>Đang hoàn trả (Xem lại)</span>
                                  </button>
                                )}

                                {normStatus === 'returned_success' && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenReturnModal(ord)}
                                    className="w-full sm:w-auto text-center px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 text-xs font-semibold inline-flex items-center justify-center gap-1 cursor-pointer transition-colors"
                                    title="Showroom đã hoàn tất thu hồi tác phẩm và hoàn tiền cho quý khách"
                                  >
                                    <span className="material-symbols-outlined text-[16px] text-teal-600">check_circle</span>
                                    <span>Hoàn hàng thành công (Xem lại)</span>
                                  </button>
                                )}

                                {normStatus === 'pending' && (
                                  <Popconfirm
                                    title="Xác nhận hủy đơn hàng"
                                    description="Quý khách có chắc chắn muốn hủy đơn hàng này không?"
                                    onConfirm={() => handleCancelPendingOrder(ord.id)}
                                    okText="Hủy đơn"
                                    cancelText="Không"
                                    okButtonProps={{ danger: true }}
                                  >
                                    <button
                                      type="button"
                                      className="w-full sm:w-auto text-center px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs transition-colors shrink-0 flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                                    >
                                      <span className="material-symbols-outlined text-[16px]">close</span>
                                      <span>Hủy đơn</span>
                                    </button>
                                  </Popconfirm>
                                )}

                                <Link
                                  href="/products"
                                  className="w-full sm:w-auto text-center px-4 py-2 bg-[#5d371f] hover:bg-[#784e34] text-white font-bold text-xs transition-colors shrink-0 flex items-center justify-center gap-1.5 shadow-sm"
                                >
                                  <span>Khám phá bộ sưu tập</span>
                                  <ArrowRightOutlined className="text-xs" />
                                </Link>
                              </div>
                            </div>

                            <div className="pt-3 border-t border-[#eae1dd]/60 flex items-center gap-2 text-xs text-[#51443d]">
                              <span className="material-symbols-outlined text-[#5d371f] text-[18px]">verified</span>
                              <span>Bảo hành kết cấu mộng gỗ 5 năm • Bảo trì lớp dầu dưỡng gỗ miễn phí định kỳ hàng năm</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* SECTION 4: Đổi Mật Khẩu & Bảo Mật */}
                <section id="section-doi-mat-khau" className="bg-white border border-[#eae1dd] p-6 sm:p-7 shadow-sm scroll-mt-24">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-5 border-b border-[#eae1dd]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-[#f5ece8] text-[#5d371f] flex items-center justify-center font-bold">
                        <span className="material-symbols-outlined text-[20px]">lock_reset</span>
                      </div>
                      <div>
                        <h2 className="font-serif text-lg sm:text-xl font-bold text-[#5d371f]">
                          Đổi Mật Khẩu &amp; Bảo Mật Tài Khoản
                        </h2>
                      </div>
                    </div>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleChangePassword();
                    }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="flex flex-col gap-1.5">
                        <label className="font-semibold text-[#1f1b19] uppercase tracking-wider text-[11px]">
                          Mật khẩu hiện tại *
                        </label>
                        <Input.Password
                          size="large"
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          placeholder="••••••••"
                          prefix={<LockOutlined className="text-[#83746c] mr-1" />}
                          className="!bg-[#fbf2ee] !border-[#eae1dd] !rounded-none !text-[#1f1b19] font-medium hover:!border-[#5d371f] focus-within:!border-[#5d371f] !py-2.5 !px-3.5"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="font-semibold text-[#1f1b19] uppercase tracking-wider text-[11px]">
                          Mật khẩu mới *
                        </label>
                        <Input.Password
                          size="large"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Tối thiểu 6 ký tự..."
                          prefix={<LockOutlined className="text-[#83746c] mr-1" />}
                          className="!bg-[#fbf2ee] !border-[#eae1dd] !rounded-none !text-[#1f1b19] font-medium hover:!border-[#5d371f] focus-within:!border-[#5d371f] !py-2.5 !px-3.5"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="font-semibold text-[#1f1b19] uppercase tracking-wider text-[11px]">
                          Xác nhận mật khẩu mới *
                        </label>
                        <Input.Password
                          size="large"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Nhập lại mật khẩu mới..."
                          prefix={<LockOutlined className="text-[#83746c] mr-1" />}
                          className="!bg-[#fbf2ee] !border-[#eae1dd] !rounded-none !text-[#1f1b19] font-medium hover:!border-[#5d371f] focus-within:!border-[#5d371f] !py-2.5 !px-3.5"
                        />
                      </div>
                    </div>

                    <div className="p-3.5 bg-[#fbf2ee] border border-[#eae1dd] flex items-start gap-2.5 text-xs text-[#51443d]">
                      <span className="material-symbols-outlined text-[#5d371f] text-[18px] shrink-0 mt-0.5">
                        shield
                      </span>
                      <span>
                        <strong className="font-semibold text-[#1f1b19]">Lời khuyên bảo mật:</strong> Sử dụng mật khẩu kết hợp chữ in hoa, chữ thường, số và ký tự đặc biệt để bảo vệ tài khoản tốt nhất.
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[#eae1dd] flex-wrap gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setOldPassword('');
                          setNewPassword('');
                          setConfirmPassword('');
                        }}
                        className="px-4 py-2 border border-[#eae1dd] text-[#51443d] hover:bg-[#f5ece8] font-semibold transition-colors cursor-pointer"
                      >
                        Làm lại
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-[#5d371f] hover:bg-[#784e34] text-white font-semibold transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[16px]">save</span>
                        <span>Cập Nhật Mật Khẩu</span>
                      </button>
                    </div>
                  </form>
                </section>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Drawer: Add New Address */}
      <Drawer
        title={
          <div className="flex items-center gap-2.5 py-1">
            <div className="w-8 h-8 bg-[#f5ece8] text-[#5d371f] flex items-center justify-center font-bold shrink-0">
              <HomeOutlined className="text-[16px]" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-[#1f1b19] leading-tight">
                Thêm Địa Chỉ Công Trình / Nhận Hàng
              </h3>
              <p className="text-[11px] text-[#83746c] font-normal mt-0.5">
                Lưu vào sổ địa chỉ cá nhân để thuận tiện cho việc bàn giao nội thất
              </p>
            </div>
          </div>
        }
        placement="right"
        onClose={() => setIsAddAddressOpen(false)}
        open={isAddAddressOpen}
        styles={{
          wrapper: {
            width: 480,
            maxWidth: '100vw',
          },
          header: {
            borderBottom: '1px solid #eae1dd',
            padding: '16px 20px',
            backgroundColor: '#ffffff',
          },
          body: {
            padding: '24px 20px',
            backgroundColor: '#fffbf9',
          },
          footer: {
            borderTop: '1px solid #eae1dd',
            padding: '14px 20px',
            backgroundColor: '#ffffff',
          },
        }}
        footer={
          <div className="flex justify-end items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsAddAddressOpen(false)}
              className="px-4 py-2 border border-[#eae1dd] font-semibold text-xs text-[#51443d] hover:bg-[#f5ece8] transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleAddAddress}
              className="px-6 py-2 bg-[#5d371f] hover:bg-[#784e34] text-white font-semibold text-xs transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              <SaveOutlined /> Lưu Địa Chỉ
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-4 text-xs">
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-[#1f1b19] uppercase tracking-wider text-[11px]">
              Tên gợi nhớ công trình *
            </label>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="VD: Căn hộ Duplex Thảo Điền, Biệt thự Ecopark..."
              prefix={<HomeOutlined className="text-[#83746c] mr-1" />}
              className="!bg-[#fbf2ee] !border-[#eae1dd] !rounded-none !text-[#1f1b19] font-medium hover:!border-[#5d371f] focus-within:!border-[#5d371f] !py-2.5 !px-3"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[#1f1b19] uppercase tracking-wider text-[11px]">
                Người nhận *
              </label>
              <Input
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
                placeholder="Họ và tên..."
                prefix={<UserOutlined className="text-[#83746c] mr-1" />}
                className="!bg-[#fbf2ee] !border-[#eae1dd] !rounded-none !text-[#1f1b19] font-medium hover:!border-[#5d371f] focus-within:!border-[#5d371f] !py-2.5 !px-3"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[#1f1b19] uppercase tracking-wider text-[11px]">
                Số điện thoại *
              </label>
              <Input
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="0918 345 678"
                prefix={<PhoneOutlined className="text-[#83746c] mr-1" />}
                className="!bg-[#fbf2ee] !border-[#eae1dd] !rounded-none !text-[#1f1b19] font-medium hover:!border-[#5d371f] focus-within:!border-[#5d371f] !py-2.5 !px-3"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Province Select */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[#1f1b19] uppercase tracking-wider text-[11px]">
                Tỉnh / Thành phố *
              </label>
              <Select
                showSearch
                placeholder="-- Chọn Tỉnh / Thành phố --"
                optionFilterProp="label"
                value={newCity || undefined}
                onChange={(val) => handleNewCityChange(val)}
                options={VIETNAM_PROVINCES.map((prov) => ({
                  value: prov.name,
                  label: prov.name,
                }))}
                className="w-full !rounded-none"
                style={{ height: 40 }}
              />
            </div>

            {/* District Select */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-[#1f1b19] uppercase tracking-wider text-[11px]">
                  Quận / Huyện *
                </label>
                {!newCity && (
                  <span className="text-[10px] text-[#83746c] italic">(Chọn Tỉnh trước)</span>
                )}
              </div>
              <Select
                showSearch
                disabled={!newCity}
                placeholder={!newCity ? '-- Chọn Tỉnh/Thành trước --' : '-- Chọn Quận / Huyện --'}
                optionFilterProp="label"
                value={newDistrict || undefined}
                onChange={(val) => setNewDistrict(val)}
                options={newDistricts.map((d) => ({
                  value: d.name,
                  label: d.name,
                }))}
                className="w-full !rounded-none"
                style={{ height: 40 }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-[#1f1b19] uppercase tracking-wider text-[11px]">
              Địa chỉ chi tiết (số nhà, tòa nhà, căn hộ...) *
            </label>
            <Input
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              placeholder="Số nhà, tên đường, tòa tháp, căn hộ..."
              prefix={<EnvironmentOutlined className="text-[#83746c] mr-1" />}
              className="!bg-[#fbf2ee] !border-[#eae1dd] !rounded-none !text-[#1f1b19] font-medium hover:!border-[#5d371f] focus-within:!border-[#5d371f] !py-2.5 !px-3"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-[#1f1b19] uppercase tracking-wider text-[11px]">
                Lưu ý đặc thù vận chuyển / bàn giao
              </label>
              <span className="text-[10px] text-[#83746c]">Không bắt buộc</span>
            </div>
            <TextArea
              rows={3}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="VD: Thang máy tải hàng 2.4m, hẹn bàn giao cuối tuần, đăng ký ban quản lý trước 24h..."
              className="!bg-[#fbf2ee] !border-[#eae1dd] !rounded-none !text-[#1f1b19] font-medium hover:!border-[#5d371f] focus-within:!border-[#5d371f] !p-3 leading-relaxed"
            />
          </div>
        </div>
      </Drawer>

      {/* Modal: Change Password */}
      <Modal
        open={isPasswordModalOpen}
        onCancel={() => setIsPasswordModalOpen(false)}
        footer={null}
        width={450}
        centered
        styles={{
          body: {
            padding: '28px',
            backgroundColor: '#fff8f5',
          },
        }}
      >
        <div className="flex flex-col gap-4">
          <div className="border-b border-[#eae1dd] pb-3">
            <h3 className="font-serif text-lg font-bold text-[#1f1b19]">
              Đổi Mật Khẩu &amp; Bảo Mật
            </h3>
          </div>

          <div className="flex flex-col gap-3 text-xs">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-[#1f1b19]">Mật khẩu hiện tại *</label>
              <Input.Password
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="••••••••"
                prefix={<LockOutlined className="text-[#83746c] mr-1" />}
                className="!bg-[#fbf2ee] !border-[#eae1dd] !rounded-none !text-[#1f1b19] font-medium hover:!border-[#5d371f] focus-within:!border-[#5d371f] !py-2 !px-3"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-[#1f1b19]">Mật khẩu mới *</label>
              <Input.Password
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự..."
                prefix={<LockOutlined className="text-[#83746c] mr-1" />}
                className="!bg-[#fbf2ee] !border-[#eae1dd] !rounded-none !text-[#1f1b19] font-medium hover:!border-[#5d371f] focus-within:!border-[#5d371f] !py-2 !px-3"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-[#1f1b19]">Xác nhận mật khẩu mới *</label>
              <Input.Password
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới..."
                prefix={<LockOutlined className="text-[#83746c] mr-1" />}
                className="!bg-[#fbf2ee] !border-[#eae1dd] !rounded-none !text-[#1f1b19] font-medium hover:!border-[#5d371f] focus-within:!border-[#5d371f] !py-2 !px-3"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#eae1dd]">
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(false)}
              className="px-4 py-2 border border-[#eae1dd] font-semibold text-xs text-[#51443d] hover:bg-[#f5ece8] cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleChangePassword}
              disabled={isChangingPassword}
              className="px-5 py-2 bg-[#5d371f] hover:bg-[#784e34] text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-70"
            >
              {isChangingPassword ? 'Đang cập nhật...' : 'Cập Nhật Mật Khẩu'}
            </button>
          </div>
        </div>
      </Modal>

      {/* DRAWER YÊU CẦU TRẢ HÀNG / HOÀN TIỀN */}
      <Drawer
        title={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-700 flex items-center justify-center shrink-0 border border-rose-200">
              <span className="material-symbols-outlined text-[22px]">assignment_return</span>
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#1f1b19] leading-tight">
                {returnModalOrder?.status === 'returned_success'
                  ? 'Chi Tiết Hoàn Hàng Thành Công'
                  : returnModalOrder?.status === 'returned'
                  ? 'Chi Tiết Yêu Cầu Hoàn Trả & Thu Hồi'
                  : 'Phiếu Yêu Cầu Trả Hàng & Hoàn Tiền'}
              </h3>
              <p className="text-[11px] text-[#83746c] mt-0.5 font-data-mono">
                Đơn hàng #{returnModalOrder?.orderCode} • Giá trị: {Number(returnModalOrder?.value || 0).toLocaleString('vi-VN')}₫
              </p>
            </div>
          </div>
        }
        open={Boolean(returnModalOrder)}
        onClose={handleCloseReturnModal}
        placement="right"
        styles={{ wrapper: { width: 560, maxWidth: '100vw' } }}
        footer={
          <div className="flex items-center justify-between gap-3 py-1">
            <button
              type="button"
              disabled={isSubmittingReturn}
              onClick={handleCloseReturnModal}
              className="px-4 py-2 border border-[#eae1dd] text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Đóng
            </button>
            {returnModalOrder?.status === 'returned_success' ? (
              <div className="px-4 py-2 bg-teal-50 text-teal-800 border border-teal-200 text-xs font-semibold inline-flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-teal-600">verified</span>
                <span>Đơn hàng đã hoàn hàng & hoàn tiền thành công</span>
              </div>
            ) : returnModalOrder?.status === 'returned' ? (
              <div className="px-4 py-2 bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold inline-flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>Yêu cầu hoàn trả đã được tiếp nhận</span>
              </div>
            ) : (
              <button
                type="button"
                disabled={isSubmittingReturn}
                onClick={handleSubmitReturn}
                className="px-5 py-2.5 bg-[#5d371f] hover:bg-[#784e34] text-white text-xs font-bold transition-all cursor-pointer shadow-sm inline-flex items-center gap-2 disabled:opacity-60"
              >
                {isSubmittingReturn ? (
                  <>
                    <LoadingOutlined />
                    <span>Đang gửi yêu cầu...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">send</span>
                    <span>Gửi yêu cầu tới Showroom</span>
                  </>
                )}
              </button>
            )}
          </div>
        }
      >
        <div className="py-2 space-y-4 text-xs">
          {/* Thông tin tác phẩm hoàn trả */}
          <div className="p-3.5 bg-[#fbf2ee] border border-[#eae1dd] flex items-center gap-3.5">
            <img
              src={returnModalOrder?.image || returnModalOrder?.items?.[0]?.productImage || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&auto=format&fit=crop&q=80'}
              alt={returnModalOrder?.productName}
              className="w-16 h-16 object-cover border border-[#eae1dd] bg-white shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h5 className="font-serif font-bold text-sm text-[#1f1b19] truncate">{returnModalOrder?.productName}</h5>
                <span className="font-data-mono font-bold text-rose-700 text-xs shrink-0">
                  {Number(returnModalOrder?.value || 0).toLocaleString('vi-VN')}₫
                </span>
              </div>
              <p className="text-[11px] text-[#51443d] mt-1">{returnModalOrder?.productSpec}</p>
              <div className="mt-1 flex items-center gap-2 text-[10px] text-[#83746c]">
                <span>Cơ sở phụ trách: <strong className="text-[#1f1b19]">{returnModalOrder?.branch || 'Showroom Trung tâm'}</strong></span>
              </div>
            </div>
          </div>

          {/* Chọn lý do hoàn trả */}
          <div>
            <label className="font-semibold text-slate-800 block mb-1.5 uppercase text-[11px] tracking-wider">
              1. Lý do trả hàng / đổi tác phẩm <span className="text-rose-600">*</span>
            </label>
            <Select
              value={returnReason}
              onChange={(val) => setReturnReason(val)}
              className="w-full"
              disabled={returnModalOrder?.status === 'returned'}
              options={[
                { value: 'Gỗ bị trầy xước / cấn móp trong vận chuyển', label: '🚚 Gỗ bị trầy xước / cấn móp trong vận chuyển' },
                { value: 'Sai kích thước / quy cách kỹ thuật so với bản vẽ may đo', label: '📏 Sai kích thước / quy cách so với bản vẽ may đo' },
                { value: 'Sai chủng loại gỗ hoặc màu sắc vân gỗ', label: '🎨 Sai chủng loại hoặc màu sắc vân gỗ' },
                { value: 'Lỗi kỹ thuật / kết cấu mộng gỗ không khít', label: '🪵 Lỗi kỹ thuật / kết cấu mộng gỗ' },
                { value: 'Khách hàng đổi ý muốn đổi sang mẫu nội thất khác', label: '🔄 Đổi ý muốn đổi sang mẫu nội thất khác' },
                { value: 'Lý do khác', label: '📝 Lý do khác...' },
              ]}
            />
          </div>

          {/* Phương thức mong muốn */}
          <div>
            <label className="font-semibold text-slate-800 block mb-1.5 uppercase text-[11px] tracking-wider">
              2. Phương án quý khách mong muốn
            </label>
            <Select
              value={returnDesiredResolution}
              onChange={(val) => setReturnDesiredResolution(val)}
              className="w-full"
              disabled={returnModalOrder?.status === 'returned'}
              options={[
                { value: 'Hoàn lại 100% tiền thanh toán', label: '💵 Hoàn lại 100% tiền thanh toán (Refund)' },
                { value: 'Đổi sang sản phẩm / kích thước khác', label: '🔄 Đổi sang mẫu nội thất khác' },
                { value: 'Kỹ thuật viên xưởng đến bảo hành / sửa chữa tại nhà', label: '🛠️ Kỹ thuật viên bảo hành tại nhà / xưởng' },
              ]}
            />
          </div>

          {/* Hình ảnh thực tế sản phẩm (Chức năng up ảnh) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-800 block uppercase text-[11px] tracking-wider">
                3. Hình ảnh chụp thực tế sản phẩm <span className="text-rose-600">*</span>
              </label>
              <span className="text-[11px] font-medium text-[#83746c]">
                Đã chọn: <span className="text-[#5d371f] font-bold">{returnImages.length}</span>/5 ảnh
              </span>
            </div>
            <p className="text-[11px] text-[#83746c] mb-2.5">
              Chụp rõ các góc cạnh, tem xưởng D2 hoặc vết xước/lỗi kỹ thuật để bộ phận giám sát chất lượng nghiệm thu từ xa nhanh nhất.
            </p>

            {/* Grid preview ảnh & upload box */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {returnImages.map((imgSrc, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square border border-[#eae1dd] bg-slate-50 overflow-hidden group shadow-xs"
                >
                  <img
                    src={imgSrc}
                    alt={`Ảnh sản phẩm ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {returnModalOrder?.status !== 'returned' && (
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      title="Xóa ảnh này"
                      className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[13px]">close</span>
                    </button>
                  )}
                  <span className="absolute bottom-1 left-1 bg-black/50 text-white text-[9px] px-1 py-0.2 font-mono">
                    #{idx + 1}
                  </span>
                </div>
              ))}

              {returnModalOrder?.status !== 'returned' && returnImages.length < 5 && (
                <label className="aspect-square border-2 border-dashed border-[#d5c3ba] hover:border-[#5d371f] bg-[#fbf2ee]/40 hover:bg-[#fbf2ee] flex flex-col items-center justify-center cursor-pointer transition-all p-2 text-center group">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <span className="material-symbols-outlined text-2xl text-[#83746c] group-hover:text-[#5d371f] transition-colors">
                    add_photo_alternate
                  </span>
                  <span className="text-[11px] font-semibold text-[#5d371f] mt-1">
                    Thêm ảnh
                  </span>
                  <span className="text-[9px] text-[#83746c] mt-0.5">
                    (Còn {5 - returnImages.length})
                  </span>
                </label>
              )}
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-[#83746c]">
              <span className="material-symbols-outlined text-[13px] text-[#83746c]">info</span>
              <span>Định dạng: JPG, PNG, WEBP (Tối đa 10MB/ảnh)</span>
            </div>
          </div>

          {/* Mô tả chi tiết */}
          <div>
            <label className="font-semibold text-slate-800 block mb-1.5 uppercase text-[11px] tracking-wider">
              4. Mô tả chi tiết tình trạng thực tế / Ghi chú thêm
            </label>
            <TextArea
              rows={3}
              value={returnNote}
              disabled={returnModalOrder?.status === 'returned'}
              onChange={(e) => setReturnNote(e.target.value)}
              placeholder="Vui lòng mô tả thêm tình trạng thực tế để xưởng chuẩn bị phương án hỗ trợ chu đáo nhất..."
              className="!text-xs leading-relaxed"
            />
          </div>

          {/* Cam kết dịch vụ */}
          <div className="p-3 bg-[#fbf2ee] border border-[#d5c3ba] text-[11px] text-[#51443d] flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[18px] text-[#5d371f] shrink-0 mt-0.5">verified_user</span>
            <div className="leading-relaxed">
              <strong className="text-[#1f1b19] block mb-0.5">Cam Kết Đổi Trả &amp; Bảo Vệ Quyền Lợi Khách Hàng</strong>
              D2 LUXURY cam kết cử kỹ thuật viên liên hệ xác nhận trong vòng <strong className="text-[#5d371f]">24 - 48 giờ</strong>. Đối với sản phẩm hoàn trả, xưởng hỗ trợ xe chuyên dụng thu hồi tận nơi và hoàn tiền 100% sau khi đối soát vật lý.
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <App>
      <ProfilePageContent />
    </App>
  );
}
