'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { App, Modal, Tooltip } from 'antd';
import {
  RightOutlined,
  DeleteOutlined,
  PlusOutlined,
  MinusOutlined,
  ArrowRightOutlined,
  SafetyCertificateOutlined,
  FileProtectOutlined,
  CreditCardOutlined,
  CustomerServiceOutlined,
  CheckCircleFilled,
  LockOutlined,
  QrcodeOutlined,
  CopyOutlined,
  HomeOutlined,
  TagOutlined,
} from '@ant-design/icons';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart, CartItemData } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { VIETNAM_PROVINCES } from '@/data/vietnamAddresses';
import { orderApi } from '@/api/orderApi';
import { branchApi } from '@/api/branchApi';
import { productApi, FeaturedCatalogProduct } from '@/api/productApi';
import { AdminBranch } from '@/types/admin';
import { ADMIN_STORAGE_KEYS, getStoredAdminData } from '@/utils/adminStorage';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDirectMode = searchParams.get('direct') === '1';

  const { message, modal } = App.useApp();
  const { user } = useAuth();
  const { cartItems, cartCount, updateQuantity, removeFromCart, clearCart } = useCart();

  const [mounted, setMounted] = useState(false);

  // Direct checkout items (When clicking "Mua ngay", does not affect shopping cart)
  const [directItems, setDirectItems] = useState<CartItemData[]>([]);

  useEffect(() => {
    setMounted(true);
    if (isDirectMode && typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('d2_direct_checkout_item');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setDirectItems(parsed);
          }
        }
      } catch (e) {
        console.warn('Could not parse direct checkout items', e);
      }
    }
  }, [isDirectMode]);

  // Real-time catalog products for stock validation
  const [catalogProducts, setCatalogProducts] = useState<FeaturedCatalogProduct[]>([]);

  useEffect(() => {
    let isMounted = true;
    productApi
      .getProducts()
      .then((res) => {
        if (isMounted && res.length) {
          setCatalogProducts(res);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const getItemAvailableStock = (item: { id: string; sku?: string; inStockQty?: number }) => {
    const found = catalogProducts.find(
      (p) => p.id === item.id || (p.code && item.sku && p.code.toLowerCase() === item.sku.toLowerCase())
    );
    if (found) {
      const rawStock = typeof found.inStock === 'number' ? found.inStock : (found.inStockQty !== undefined ? found.inStockQty : undefined);
      return rawStock !== undefined ? rawStock : (found.stockNote ? (parseInt(found.stockNote.replace(/\D/g, ''), 10) || 0) : 0);
    }
    return item.inStockQty !== undefined ? item.inStockQty : 99;
  };

  const isItemOutOfStock = (_item?: any) => false;
  const isItemExceedingStock = (_item?: any) => false;

  // Filter items in cart vs direct mode
  const selectedItems = useMemo(() => {
    return cartItems.filter((i) => i.selected);
  }, [cartItems]);

  const activeItems = useMemo(() => {
    if (isDirectMode) {
      return directItems;
    }
    return selectedItems.length > 0 ? selectedItems : cartItems;
  }, [isDirectMode, directItems, selectedItems, cartItems]);

  const handleUpdateItemQuantity = (id: string, delta: number) => {
    if (isDirectMode) {
      setDirectItems((prev) => {
        const updated = prev.map((item) =>
          item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
        );
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('d2_direct_checkout_item', JSON.stringify(updated));
        }
        return updated;
      });
    } else {
      updateQuantity(id, delta);
    }
  };

  const handleRemoveCheckoutItem = (id: string) => {
    if (isDirectMode) {
      setDirectItems((prev) => {
        const updated = prev.filter((item) => item.id !== id);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('d2_direct_checkout_item', JSON.stringify(updated));
        }
        return updated;
      });
    } else {
      removeFromCart(id);
    }
  };

  const hasOutOfStockInCheckout = false;
  const hasExceededStockInCheckout = false;
  const hasInvalidInCheckout = false;

  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [specialNote, setSpecialNote] = useState('');
  const [branches, setBranches] = useState<AdminBranch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');

  React.useEffect(() => {
    const loadBranches = async () => {
      try {
        const list = await branchApi.getBranches();
        if (list && Array.isArray(list) && list.length > 0) {
          setBranches(list);
          const savedBranch = getStoredAdminData<string>(ADMIN_STORAGE_KEYS.SELECTED_BRANCH, '') || localStorage.getItem('d2_selected_branch') || '';
          if (savedBranch && list.some((b) => b.name === savedBranch)) {
            setSelectedBranch(savedBranch);
          } else {
            setSelectedBranch(list[0].name);
          }
          return;
        }
      } catch (err) {
        console.warn('Could not load branches for checkout:', err);
      }
      const fallback = getStoredAdminData<string>(ADMIN_STORAGE_KEYS.SELECTED_BRANCH, '') || 'Chi nhánh Hà Nội';
      setSelectedBranch(fallback);
    };
    loadBranches();
  }, []);

  // Sync user info into checkout form
  React.useEffect(() => {
    if (user) {
      if (user.name) setFullName(user.name);
      if (user.phone) setPhone(user.phone);
    } else {
      setFullName('');
      setPhone('');
    }
  }, [user]);

  // Dynamic provinces & districts
  const currentDistricts = useMemo(() => {
    if (!city) return [];
    const found = VIETNAM_PROVINCES.find((p) => p.name === city);
    return found ? found.districts : [];
  }, [city]);

  const handleCityChange = (newCityName: string) => {
    setCity(newCityName);
    setDistrict(''); // Reset district so user is required to select district for newly selected province
  };

  // Payment method: 'qr' | 'cod'
  const [paymentMethod, setPaymentMethod] = useState<'qr' | 'cod'>('qr');

  // Pricing calculations
  const subtotal = useMemo(() => {
    return activeItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [activeItems]);

  const finalTotal = useMemo(() => {
    return subtotal;
  }, [subtotal]);

  // Order Success Modal
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [createdOrderCode, setCreatedOrderCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      message.success(`Đã sao chép ${label}`);
    }
  };

  // Submit Order
  const handleSubmitOrder = async () => {
    if (!fullName.trim()) {
      message.warning('Vui lòng nhập Họ & Tên người nhận hàng.');
      return;
    }
    if (!phone.trim()) {
      message.warning('Vui lòng nhập Số điện thoại liên hệ.');
      return;
    }
    if (!city) {
      message.warning('Vui lòng chọn Tỉnh / Thành phố nhận bàn giao.');
      return;
    }
    if (!district) {
      message.warning('Vui lòng chọn Quận / Huyện nhận bàn giao.');
      return;
    }
    if (!address.trim()) {
      message.warning('Vui lòng nhập Địa chỉ chi tiết nhận nội thất.');
      return;
    }

    setIsSubmitting(true);
    try {
      const productNameSummary = activeItems.map((i) => i.name).join(', ');
      const fullShippingAddress = `${address}, ${district}, ${city}`;

      const isGuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const finalBranch = selectedBranch || (typeof window !== 'undefined'
        ? (getStoredAdminData<string>(ADMIN_STORAGE_KEYS.SELECTED_BRANCH, '') || localStorage.getItem('d2_selected_branch') || 'Chi nhánh Hà Nội')
        : 'Chi nhánh Hà Nội');

      const isCod = paymentMethod === 'cod';
      const orderDepositAmount = isCod ? 0 : finalTotal;
      const orderDepositPercent = isCod ? 0 : 100;
      const orderPaymentMethod = isCod ? 'COD' : 'VietQR';
      const orderPaymentStatus = 'Pending';

      const created = await orderApi.createOrder({
        orderType: 'retail',
        branch: finalBranch,
        showroom: finalBranch,
        customerName: fullName.trim(),
        customerPhone: phone.trim(),
        customerEmail: user?.email || undefined,
        customerAddress: fullShippingAddress,
        shippingAddress: fullShippingAddress,
        city: city,
        district: district,
        productName: productNameSummary || 'Nội thất D2 Luxury',
        productSpec: activeItems.map((i) => i.specs?.[0]).filter(Boolean).join('; ') || 'Theo thiết kế',
        value: finalTotal,
        depositAmount: orderDepositAmount,
        depositPercent: orderDepositPercent,
        paymentMethod: orderPaymentMethod,
        paymentStatus: orderPaymentStatus,
        status: 'pending',
        note: specialNote.trim() || undefined,
        items: activeItems.map((i) => ({
          productId: isGuidRegex.test(i.id) ? i.id : undefined,
          productSku: i.sku || undefined,
          productImage: i.image || undefined,
          productName: i.name,
          unitPrice: i.price,
          quantity: i.quantity,
          dimensions: i.specs?.[0] || '',
          material: i.specs?.[1] || 'Gỗ tự nhiên cao cấp',
        })),
      });

      setCreatedOrderCode(created.orderCode);

      // Save order into user's isolated order storage
      if (user?.id) {
        try {
          const userOrderKey = `d2_orders_${user.id}`;
          const existing = JSON.parse(localStorage.getItem(userOrderKey) || '[]');
          const newOrderRecord = {
            id: created.id || `ord_${Date.now()}`,
            orderCode: created.orderCode,
            createdAt: new Date().toLocaleDateString('vi-VN'),
            value: finalTotal,
            depositAmount: orderDepositAmount,
            depositPercent: orderDepositPercent,
            paymentMethod: orderPaymentMethod,
            paymentStatus: orderPaymentStatus,
            productName: productNameSummary || 'Nội thất D2 Luxury',
            productSpec: activeItems.map((i) => i.specs?.[0]).filter(Boolean).join('; ') || 'Theo quy cách may đo',
            items: activeItems,
            shippingAddress: fullShippingAddress,
            status: 'pending',
          };
          localStorage.setItem(userOrderKey, JSON.stringify([newOrderRecord, ...existing]));
        } catch (e) {
          console.warn('Could not save local user order:', e);
        }
      }

      if (isDirectMode && typeof window !== 'undefined') {
        sessionStorage.removeItem('d2_direct_checkout_item');
      }

      setIsSuccessModalOpen(true);
    } catch (err: any) {
      console.error('Error creating order:', err);
      message.error(err.message || 'Đặt hàng thất bại. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishAndReturnHome = () => {
    if (isDirectMode) {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('d2_direct_checkout_item');
      }
    } else {
      clearCart();
    }
    setIsSuccessModalOpen(false);
    router.push('/');
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col bg-[#fff8f5] text-[#1f1b19] font-body-md">
        <Header cartCount={0} onOpenBooking={() => {}} />
        <main className="w-full pt-28 flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 py-24">
            <div className="w-10 h-10 border-4 border-[#5d371f] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-serif text-[#83746c] tracking-wider uppercase">Đang tải thông tin đơn hàng...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fff8f5] text-[#1f1b19] font-body-md selection:bg-[#ffdbc8] selection:text-[#311301]">
      {/* Header */}
      <Header
        cartCount={cartCount}
        onOpenBooking={() => {}}
      />

      <main className="w-full pt-20 flex-1">
        {/* Top Breadcrumb & SSL Security Notice */}
        <section className="w-full bg-[#fbf2ee] py-3.5 border-b border-[#eae1dd]">
          <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-medium text-[#83746c]">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 flex-wrap text-xs text-[#83746c]">
              <Link href="/" className="hover:text-[#5d371f] transition-colors">
                Trang chủ
              </Link>
              <span className="text-[#d5c3ba]">/</span>
              {isDirectMode ? (
                <Link href="/products" className="hover:text-[#5d371f] transition-colors">
                  Sản phẩm
                </Link>
              ) : (
                <Link href="/cart" className="hover:text-[#5d371f] transition-colors">
                  Giỏ hàng
                </Link>
              )}
              <span className="text-[#d5c3ba]">/</span>
              <span className="text-[#5d371f] font-bold">Thanh toán &amp; Lập lịch bàn giao</span>
            </nav>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#ffffff] border border-[#eae1dd] text-[11px] text-[#3f4332] font-semibold shadow-sm">
              <LockOutlined className="text-[#5d371f]" />
              <span>Thanh toán bảo mật 256-bit SSL · Chứng chỉ FSC 100%</span>
            </div>
          </div>
        </section>

        {/* Main Grid: 7 Cols Left Form / 5 Cols Sticky Summary */}
        <section className="max-w-[1720px] mx-auto w-full px-4 sm:px-6 lg:px-10 xl:px-14 py-6">
          {activeItems.length === 0 ? (
            <div className="bg-white border border-[#eae1dd] p-12 text-center my-8 shadow-sm">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#f5ece8] flex items-center justify-center text-[#5d371f] text-2xl">
                <TagOutlined />
              </div>
              <h3 className="font-serif text-2xl font-bold text-[#1f1b19] mb-2">Không có sản phẩm nào cần thanh toán</h3>
              <p className="text-sm text-[#83746c] max-w-md mx-auto mb-6">
                Vui lòng chọn các tác phẩm nội thất vào giỏ hàng hoặc chọn Mua ngay để tiến hành thanh toán và đặt lịch bàn giao.
              </p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#5d371f] text-white text-xs font-bold hover:bg-[#784e34] transition-colors"
              >
                <span>Khám phá bộ sưu tập</span>
                <ArrowRightOutlined />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in-up">
              {/* LEFT COLUMN: 7 Columns Form Blocks */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                {/* Block 1: Cart Items List */}
                <div className="bg-white border border-[#eae1dd] p-6 shadow-sm flex flex-col gap-5">
                  <div className="flex items-center justify-between pb-3 border-b border-[#eae1dd]">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 bg-[#5d371f] text-white font-data-mono text-xs font-bold flex items-center justify-center">
                        1
                      </span>
                      <h2 className="font-serif text-lg font-bold text-[#1f1b19]">
                        {isDirectMode ? 'Tác phẩm mua trực tiếp' : 'Tác phẩm tuyển chọn trong đơn hàng'} ({activeItems.length})
                      </h2>
                    </div>
                    {!isDirectMode && (
                      <Link
                        href="/cart"
                        className="text-xs text-[#5d371f] hover:text-[#784e34] font-semibold transition-colors"
                      >
                        Chỉnh sửa giỏ hàng
                      </Link>
                    )}
                  </div>

                  <div className="flex flex-col gap-3">
                    {activeItems.map((item) => {
                      return (
                        <div
                          key={item.id}
                          className="flex flex-col sm:flex-row gap-4 p-3.5 border transition-all bg-[#fbf2ee] border-[#eae1dd] hover:border-[#5d371f]/30"
                        >
                          <div className="w-20 h-20 bg-[#f5ece8] overflow-hidden shrink-0 border border-[#eae1dd] relative">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="flex-1 flex flex-col justify-between">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-serif text-base font-bold text-[#1f1b19]">
                                    {item.name}
                                  </h3>
                                </div>
                                <p className="text-xs text-[#83746c] mt-0.5">
                                  {item.specs?.[0] || 'Gỗ tự nhiên nguyên khối'}
                                </p>
                              </div>
                              <button
                                onClick={() => handleRemoveCheckoutItem(item.id)}
                                type="button"
                                className="text-[#83746c] hover:text-[#ba1a1a] transition-colors p-1 cursor-pointer"
                                title="Xóa tác phẩm"
                              >
                                <DeleteOutlined className="text-sm" />
                              </button>
                            </div>

                            <div className="flex items-center justify-between pt-2 mt-2 border-t border-[#eae1dd]/60">
                              {/* Quantity Counter */}
                              <div className="flex items-center bg-white border border-[#eae1dd] p-0.5 shadow-sm">
                                <button
                                  onClick={() => handleUpdateItemQuantity(item.id, -1)}
                                  disabled={item.quantity <= 1}
                                  type="button"
                                  className="w-6 h-6 flex items-center justify-center text-[#51443d] hover:bg-[#f5ece8] disabled:opacity-30 cursor-pointer"
                                >
                                  <MinusOutlined className="text-[10px]" />
                                </button>
                                <span className="w-7 text-center font-data-mono text-xs font-bold text-[#1f1b19]">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => handleUpdateItemQuantity(item.id, 1)}
                                  type="button"
                                  className="w-6 h-6 flex items-center justify-center text-[#51443d] hover:bg-[#f5ece8] cursor-pointer"
                                >
                                  <PlusOutlined className="text-[10px]" />
                                </button>
                              </div>

                              <span className="font-data-mono text-sm font-bold text-[#5d371f]">
                                {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Block 2: Delivery & Technical Information */}
                <div className="bg-white border border-[#eae1dd] p-6 shadow-sm flex flex-col gap-5">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-[#eae1dd]">
                    <span className="w-6 h-6 bg-[#5d371f] text-white font-data-mono text-xs font-bold flex items-center justify-center">
                      2
                    </span>
                    <h2 className="font-serif text-lg font-bold text-[#1f1b19]">
                      Thông tin Bàn giao &amp; Kỹ thuật Lắp đặt
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="md:col-span-2 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="font-semibold text-[#1f1b19]">
                          Chi nhánh / Showroom xuất kho &amp; xử lý đơn *
                        </label>
                        <span className="text-[11px] text-[#5d371f] font-medium">
                          Kho hàng xuất &amp; trừ tồn theo chi nhánh
                        </span>
                      </div>
                      <select
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        className="px-3.5 py-2.5 bg-[#fbf2ee] border border-[#eae1dd] text-[#1f1b19] font-medium focus:outline-none focus:border-[#5d371f] transition-colors cursor-pointer"
                      >
                        {branches.length > 0 ? (
                          branches.map((b) => (
                            <option key={b.id || b.name} value={b.name}>
                              {b.name} {b.address ? `· ${b.address}` : ''}
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="Chi nhánh Hà Nội">Chi nhánh Hà Nội</option>
                            <option value="Chi nhánh Nam Định">Chi nhánh Nam Định</option>
                            <option value="Showroom Flagship Thảo Điền">Showroom Flagship Thảo Điền</option>
                          </>
                        )}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-semibold text-[#1f1b19]">
                        Họ &amp; Tên người nhận *
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="VD: Trần Thị Mai"
                        className="px-3.5 py-2.5 bg-[#fbf2ee] border border-[#eae1dd] text-[#1f1b19] font-medium focus:outline-none focus:border-[#5d371f] transition-colors"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-semibold text-[#1f1b19]">
                        Số điện thoại liên lạc *
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="VD: 0918 345 678"
                        className="px-3.5 py-2.5 bg-[#fbf2ee] border border-[#eae1dd] text-[#1f1b19] font-medium focus:outline-none focus:border-[#5d371f] transition-colors"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-semibold text-[#1f1b19]">
                        Tỉnh / Thành phố *
                      </label>
                      <select
                        value={city}
                        onChange={(e) => handleCityChange(e.target.value)}
                        className="px-3.5 py-2.5 bg-[#fbf2ee] border border-[#eae1dd] text-[#1f1b19] font-medium focus:outline-none focus:border-[#5d371f] transition-colors cursor-pointer"
                      >
                        <option value="">-- Chọn Tỉnh / Thành phố --</option>
                        {VIETNAM_PROVINCES.map((prov, idx) => (
                          <option key={`${prov.code}-${idx}`} value={prov.name}>
                            {prov.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="font-semibold text-[#1f1b19]">
                          Quận / Huyện *
                        </label>
                        {!city && (
                          <span className="text-[11px] text-[#83746c] italic">
                            (Chọn Tỉnh/Thành trước)
                          </span>
                        )}
                      </div>
                      <select
                        value={district}
                        disabled={!city}
                        onChange={(e) => setDistrict(e.target.value)}
                        className={`px-3.5 py-2.5 border border-[#eae1dd] font-medium transition-colors ${
                          !city
                            ? 'bg-[#f3ece8] text-[#a89b93] cursor-not-allowed opacity-80'
                            : 'bg-[#fbf2ee] text-[#1f1b19] focus:outline-none focus:border-[#5d371f] cursor-pointer'
                        }`}
                      >
                        {!city ? (
                          <option value="">-- Vui lòng chọn Tỉnh / Thành phố trước --</option>
                        ) : (
                          <>
                            <option value="">-- Chọn Quận / Huyện --</option>
                            {currentDistricts.map((d, idx) => (
                              <option key={`${d.code}-${idx}`} value={d.name}>
                                {d.name}
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                    </div>

                    <div className="md:col-span-2 flex flex-col gap-1.5">
                      <label className="font-semibold text-[#1f1b19]">
                        Địa chỉ cụ thể nhận nội thất *
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Số nhà, tên đường, tên tòa nhà, căn hộ..."
                        className="px-3.5 py-2.5 bg-[#fbf2ee] border border-[#eae1dd] text-[#1f1b19] font-medium focus:outline-none focus:border-[#5d371f] transition-colors"
                      />
                    </div>

                    <div className="md:col-span-2 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="font-semibold text-[#1f1b19]">
                          Ghi chú chuyên biệt cho đội ngũ thợ D2 LUXURY
                        </label>
                        <span className="text-[11px] text-[#83746c]">Đặc thù thang vận chuyển / căn hộ</span>
                      </div>
                      <textarea
                        rows={3}
                        value={specialNote}
                        onChange={(e) => setSpecialNote(e.target.value)}
                        placeholder="Ví dụ: Chung cư cần đăng ký chuyển hàng trước 24h, thang máy tải trọng 1000kg, lót sàn bảo vệ trước khi lắp..."
                        className="px-3.5 py-2.5 bg-[#fbf2ee] border border-[#eae1dd] text-[#1f1b19] font-medium focus:outline-none focus:border-[#5d371f] transition-colors leading-relaxed"
                      />
                    </div>
                  </div>
                </div>

                {/* Block 3: Payment Methods */}
                <div className="bg-white border border-[#eae1dd] p-6 shadow-sm flex flex-col gap-5">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-[#eae1dd]">
                    <span className="w-6 h-6 bg-[#5d371f] text-white font-data-mono text-xs font-bold flex items-center justify-center">
                      3
                    </span>
                    <h2 className="font-serif text-lg font-bold text-[#1f1b19]">
                      Phương thức Thanh toán Tín nhiệm
                    </h2>
                  </div>

                  <div className="flex flex-col gap-3">
                    {/* Option 1: VietQR Transfer */}
                    <div
                      onClick={() => setPaymentMethod('qr')}
                      className={`p-4 border transition-all cursor-pointer ${
                        paymentMethod === 'qr'
                          ? 'border-[#5d371f] bg-[#fbf2ee]'
                          : 'border-[#eae1dd] bg-white hover:border-[#5d371f]/40'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === 'qr'}
                          onChange={() => setPaymentMethod('qr')}
                          className="w-4 h-4 mt-1 accent-[#5d371f] cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-[#1f1b19]">
                                Chuyển khoản Tức thì qua Mã QR VietQR
                              </span>
                            </div>
                            <QrcodeOutlined className="text-lg text-[#5d371f]" />
                          </div>

                          <p className="text-xs text-[#51443d] mt-1 leading-relaxed">
                            Hệ thống kích hoạt bảo chứng đơn hàng tự động sau 10 giây qua Napas 24/7.
                          </p>

                          {/* VietQR Bank Preview Box */}
                          {paymentMethod === 'qr' && (
                            <div className="mt-4 p-4 sm:p-5 bg-white border border-[#eae1dd] flex flex-col md:flex-row items-center gap-5 shadow-sm animate-scale-in">
                              <div className="flex flex-col items-center gap-2 shrink-0">
                                <div className="bg-white p-2 border border-[#eae1dd] shadow-sm">
                                  <img
                                    src={`https://img.vietqr.io/image/vietinbank-113366668888-compact.jpg?amount=${finalTotal}&addInfo=${encodeURIComponent(`D2 ${phone.replace(/\s+/g, '') || 'LUXURY'}`)}&accountName=D2%20LUXURY`}
                                    alt="Mã QR Chuyển khoản VietinBank"
                                    className="w-44 h-auto object-contain"
                                  />
                                </div>
                                <span className="text-[10px] text-[#83746c] flex items-center gap-1 font-medium">
                                  <QrcodeOutlined /> Quét QR tự điền số tiền &amp; nội dung
                                </span>
                              </div>

                              <div className="flex flex-col gap-2 text-xs flex-1 w-full">
                                <div className="pb-2 border-b border-[#eae1dd]">
                                  <span className="text-[10px] uppercase font-bold text-[#83746c] block tracking-wider">Ngân hàng thụ hưởng</span>
                                  <p className="font-bold text-sm text-[#1f1b19]">VietinBank (Ngân hàng TMCP Công Thương VN)</p>
                                </div>

                                <div className="flex items-center justify-between py-1 border-b border-[#eae1dd]/60">
                                  <div>
                                    <span className="text-[10px] text-[#83746c] block">Chủ tài khoản:</span>
                                    <strong className="font-serif text-[#5d371f] text-xs">CÔNG TY CỔ PHẦN NỘI THẤT D2 LUXURY</strong>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between py-1 border-b border-[#eae1dd]/60">
                                  <div>
                                    <span className="text-[10px] text-[#83746c] block">Số tài khoản:</span>
                                    <strong className="font-data-mono text-sm text-[#1f1b19]">113366668888</strong>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy('113366668888', 'Số tài khoản')}
                                    className="px-2.5 py-1 bg-[#fbf2ee] hover:bg-[#eae1dd] border border-[#eae1dd] text-[11px] font-bold text-[#5d371f] flex items-center gap-1 transition-colors cursor-pointer"
                                  >
                                    <CopyOutlined /> Sao chép
                                  </button>
                                </div>

                                <div className="flex items-center justify-between py-1 border-b border-[#eae1dd]/60">
                                  <div>
                                    <span className="text-[10px] text-[#83746c] block">Số tiền thanh toán:</span>
                                    <strong className="font-data-mono text-sm text-[#5d371f]">{finalTotal.toLocaleString('vi-VN')}₫</strong>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(finalTotal.toString(), 'Số tiền')}
                                    className="px-2.5 py-1 bg-[#fbf2ee] hover:bg-[#eae1dd] border border-[#eae1dd] text-[11px] font-bold text-[#5d371f] flex items-center gap-1 transition-colors cursor-pointer"
                                  >
                                    <CopyOutlined /> Sao chép
                                  </button>
                                </div>

                                <div className="flex items-center justify-between pt-1">
                                  <div>
                                    <span className="text-[10px] text-[#83746c] block">Nội dung chuyển khoản:</span>
                                    <strong className="font-data-mono text-xs text-[#5d371f]">D2 {phone.replace(/\s+/g, '') || 'LUXURY'}</strong>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(`D2 ${phone.replace(/\s+/g, '') || 'LUXURY'}`, 'Nội dung chuyển khoản')}
                                    className="px-2.5 py-1 bg-[#fbf2ee] hover:bg-[#eae1dd] border border-[#eae1dd] text-[11px] font-bold text-[#5d371f] flex items-center gap-1 transition-colors cursor-pointer"
                                  >
                                    <CopyOutlined /> Sao chép
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Option 2: COD Payment */}
                    <div
                      onClick={() => setPaymentMethod('cod')}
                      className={`p-4 border transition-all cursor-pointer ${
                        paymentMethod === 'cod'
                          ? 'border-[#5d371f] bg-[#fbf2ee]'
                          : 'border-[#eae1dd] bg-white hover:border-[#5d371f]/40'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === 'cod'}
                          onChange={() => setPaymentMethod('cod')}
                          className="w-4 h-4 mt-1 accent-[#5d371f] cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-[#1f1b19]">
                                Thanh toán khi nhận hàng &amp; Nghiệm thu (COD)
                              </span>
                            </div>
                            <SafetyCertificateOutlined className="text-lg text-[#5d371f]" />
                          </div>

                          <p className="text-xs text-[#51443d] mt-1 leading-relaxed">
                            Quý khách trực tiếp kiểm tra vân gỗ, kết cấu và đường hoàn thiện tinh dầu tại nhà trước khi thanh toán cho đội ngũ giao lắp D2 LUXURY.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: 5 Columns Sticky Summary Card */}
              <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24">
                <div className="bg-white border border-[#eae1dd] p-6 shadow-md flex flex-col gap-5">
                  <div className="flex items-center justify-between pb-3 border-b border-[#eae1dd]">
                    <div>
                      <span className="text-xs text-[#83746c] font-medium block">
                        Phiếu thanh toán
                      </span>
                      <h2 className="font-serif text-xl font-bold text-[#1f1b19]">Tóm tắt Đơn Hàng</h2>
                    </div>
                    <span className="font-data-mono text-xs px-2.5 py-1 bg-[#f5ece8] border border-[#eae1dd] text-[#5d371f] font-bold">
                      #D2-2025-89
                    </span>
                  </div>

                  {/* Price breakdown table */}
                  <div className="flex flex-col gap-3 text-xs pt-1">
                    <div className="flex justify-between text-[#51443d]">
                      <span>Tạm tính ({activeItems.length} tác phẩm):</span>
                      <span className="font-data-mono font-bold text-[#1f1b19]">
                        {subtotal.toLocaleString('vi-VN')}đ
                      </span>
                    </div>

                    <div className="flex justify-between text-[#51443d]">
                      <div>
                        <span>Vận chuyển &amp; Bê lên tầng chuyên dụng:</span>
                        <p className="text-[10px] text-[#83746c]">Bọc màng chống sốc 3 lớp &amp; xe thùng kín</p>
                      </div>
                      <span className="text-xs font-semibold text-[#3f4332] bg-[#e1e5ce] px-2.5 py-0.5 self-start">
                        Miễn phí
                      </span>
                    </div>

                    <div className="flex justify-between text-[#51443d]">
                      <span>Dịch vụ kỹ thuật căn chỉnh tại nhà:</span>
                      <span className="text-xs font-semibold text-[#3f4332] bg-[#e1e5ce] px-2.5 py-0.5 self-start">
                        Miễn phí
                      </span>
                    </div>
                  </div>

                  {/* Grand Total box */}
                  <div className="bg-[#fbf2ee] border border-[#eae1dd] p-4 flex flex-col gap-1">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-sm font-bold text-[#1f1b19]">Tổng thanh toán:</span>
                        <span className="block text-[10px] text-[#83746c]">
                          Đã bao gồm 8% thuế GTGT &amp; bảo hiểm hành trình
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-serif text-xl sm:text-2xl font-bold text-[#5d371f] font-data-mono">
                          {finalTotal.toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSubmitOrder}
                    disabled={isSubmitting || activeItems.length === 0}
                    type="button"
                    style={
                      activeItems.length === 0
                        ? { backgroundColor: '#eae1dd', color: '#83746c' }
                        : { backgroundColor: '#5d371f', color: '#ffffff' }
                    }
                    className={`w-full py-3.5 px-6 font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-md ${
                      activeItems.length === 0
                        ? 'cursor-not-allowed opacity-60'
                        : '!bg-[#5d371f] !text-white hover:!bg-[#784e34] cursor-pointer hover-lift'
                    }`}
                  >
                    <span className="font-bold">
                      {isSubmitting
                        ? 'Đang kích hoạt lịch bàn giao...'
                        : 'Xác nhận đặt hàng & Giữ lịch giao'}
                    </span>
                    <ArrowRightOutlined className="text-sm" />
                  </button>

                  <p className="text-[11px] text-[#83746c] text-center leading-relaxed">
                    Bằng việc xác nhận, quý khách đồng ý với điều khoản chăm sóc đồ gỗ &amp; quy chuẩn nghiệm thu của D2 LUXURY.
                  </p>

                  {/* 2 Reassurance Badges */}
                  <div className="flex flex-col gap-3 pt-3 border-t border-[#eae1dd] bg-[#fbf2ee] p-4">
                    <div className="flex items-start gap-3">
                      <SafetyCertificateOutlined className="text-[#5d371f] text-base shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-[#1f1b19]">Cam kết Nghiệm thu Tận mắt</h4>
                        <p className="text-[11px] text-[#51443d] leading-relaxed">
                          Quý khách trực tiếp kiểm tra vân gỗ, mối mộng và đường chỉ bọc da/vải. Chỉ thanh toán khi hoàn toàn mãn nguyện.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <FileProtectOutlined className="text-[#5d371f] text-base shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-[#1f1b19]">Bảo hành Kết cấu 5 Năm</h4>
                        <p className="text-[11px] text-[#51443d] leading-relaxed">
                          Bảo dưỡng đánh sáp tự nhiên định kỳ 12 tháng/lần miễn phí tại không gian sống của quý khách.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Hotline box */}
                  <div className="bg-[#f5ece8] border border-[#eae1dd] p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CustomerServiceOutlined className="text-[#5d371f] text-2xl" />
                      <div>
                        <p className="text-xs font-bold text-[#1f1b19]">Cần hỗ trợ về không gian?</p>
                        <p className="text-[11px] text-[#83746c]">KTS D2 LUXURY tư vấn trực tiếp 1-1</p>
                      </div>
                    </div>
                    <a
                      href="tel:19008922"
                      className="px-3 py-1.5 bg-white border border-[#eae1dd] text-xs font-bold text-[#5d371f] hover:bg-[#5d371f] hover:text-white transition-colors"
                    >
                      1900 8922
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <Footer />

      {/* Order Success Modal */}
      <Modal
        open={isSuccessModalOpen}
        onCancel={() => setIsSuccessModalOpen(false)}
        footer={null}
        width={540}
        centered
        styles={{
          body: {
            padding: '28px',
            backgroundColor: '#fff8f5',
          },
        }}
      >
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 bg-[#e1e5ce] text-[#3f4332] flex items-center justify-center shadow-sm">
            <CheckCircleFilled className="text-3xl text-[#3f4332]" />
          </div>

          <div>
            <span className="text-xs text-[#5d371f] font-semibold block">
              Xác Nhận Đặt Hàng Thành Công
            </span>
            <h3 className="font-serif text-2xl font-bold text-[#1f1b19] mt-1">
              Đơn Hàng {createdOrderCode} Đã Được Ghi Nhận
            </h3>
            <p className="text-xs text-[#83746c] mt-2 max-w-md leading-relaxed">
              Cảm ơn quý khách <strong>{fullName}</strong>. Kỹ sư trưởng xưởng mộc D2 LUXURY sẽ liên hệ trực tiếp qua số điện thoại <strong>{phone}</strong> trong vòng 15 phút để xác thực phôi gỗ và đối chiếu kích thước thang máy.
            </p>
          </div>

          <div className="w-full bg-white border border-[#eae1dd] p-4 text-left text-xs flex flex-col gap-2 shadow-sm">
            <div className="flex justify-between">
              <span className="text-[#83746c]">Người nhận:</span>
              <span className="font-semibold text-[#1f1b19]">{fullName} ({phone})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#83746c]">Địa chỉ nhận hàng:</span>
              <span className="font-semibold text-[#1f1b19] text-right truncate max-w-[260px]">{address}{district ? `, ${district}` : ''}{city ? `, ${city}` : ''}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#83746c]">Phương thức:</span>
              <span className="font-semibold text-[#5d371f]">
                {paymentMethod === 'qr' ? 'Chuyển khoản VietQR' : 'Thanh toán khi nhận hàng (COD)'}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#eae1dd]">
              <span className="text-sm font-bold text-[#1f1b19]">Tổng giá trị:</span>
              <span className="font-serif text-base font-bold text-[#5d371f] font-data-mono">
                {finalTotal.toLocaleString('vi-VN')}đ
              </span>
            </div>
          </div>

          {paymentMethod === 'qr' && (
            <div className="w-full bg-[#fbf2ee] border border-[#eae1dd] p-4 flex flex-col items-center gap-2">
              <span className="text-xs font-bold text-[#5d371f]">Quét mã VietQR VietinBank để thanh toán ngay</span>
              <img
                src={`https://img.vietqr.io/image/vietinbank-113366668888-compact.jpg?amount=${finalTotal}&addInfo=${encodeURIComponent(`D2 ${phone.replace(/\s+/g, '') || 'LUXURY'}`)}&accountName=D2%20LUXURY`}
                alt="VietQR VietinBank"
                className="w-40 h-auto rounded border border-[#eae1dd] shadow-sm bg-white p-1"
              />
              <span className="text-[11px] text-[#83746c]">STK: <strong>113366668888</strong> • Nội dung: <strong>D2 {phone.replace(/\s+/g, '') || 'LUXURY'}</strong></span>
            </div>
          )}

          <button
            onClick={handleFinishAndReturnHome}
            type="button"
            className="w-full bg-[#5d371f] text-white py-3 px-6 font-semibold text-sm hover:bg-[#784e34] transition-colors mt-2 shadow-md cursor-pointer"
          >
            Hoàn tất &amp; Về trang chủ
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <App>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-[#fff8f5]">
            <div className="text-[#5d371f] font-serif text-sm">Đang tải thông tin thanh toán...</div>
          </div>
        }
      >
        <CheckoutContent />
      </Suspense>
    </App>
  );
}
