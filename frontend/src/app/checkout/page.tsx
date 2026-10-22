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
import { settingsApi, PaymentConfigData } from '@/api/settingsApi';
import { getBankBin } from '@/components/common/VietQrCard';
import { AdminBranch } from '@/types/admin';
import { ADMIN_STORAGE_KEYS, getStoredAdminData, setStoredAdminData } from '@/utils/adminStorage';
import { getProductStockForBranch } from '@/utils/branchHelper';

interface ProfileAddressItem {
  id: string;
  isDefault: boolean;
  title: string;
  address: string;
  city?: string;
  district?: string;
  detailAddress?: string;
  note?: string;
  recipient?: string;
  phone?: string;
  tag?: string;
}

interface LastShippingInfo {
  fullName: string;
  phone: string;
  city: string;
  district: string;
  address: string;
  specialNote?: string;
  savedAt?: string;
}

function extractAddressComponents(addr: ProfileAddressItem): { city: string; district: string; detailAddress: string } {
  if (addr.city && addr.district) {
    return {
      city: addr.city,
      district: addr.district,
      detailAddress: addr.detailAddress || (addr.address ? addr.address.split(',')[0].trim() : ''),
    };
  }

  const raw = addr.address || '';
  if (!raw) return { city: '', district: '', detailAddress: '' };

  for (const prov of VIETNAM_PROVINCES) {
    if (raw.toLowerCase().includes(prov.name.toLowerCase())) {
      const matchedDist = prov.districts.find((d) =>
        raw.toLowerCase().includes(d.name.toLowerCase())
      );
      if (matchedDist) {
        const parts = raw.split(',');
        let detail = parts[0]?.trim() || '';
        if (parts.length > 2) {
          detail = parts.slice(0, parts.length - 2).join(', ').trim();
        }
        return {
          city: prov.name,
          district: matchedDist.name,
          detailAddress: detail,
        };
      }
      return {
        city: prov.name,
        district: '',
        detailAddress: raw,
      };
    }
  }

  const parts = raw.split(',').map((s) => s.trim());
  if (parts.length >= 3) {
    return {
      city: parts[parts.length - 1],
      district: parts[parts.length - 2],
      detailAddress: parts.slice(0, parts.length - 2).join(', '),
    };
  }

  return { city: '', district: '', detailAddress: raw };
}

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

  // Payment configuration from Admin Settings
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfigData | null>(null);

  useEffect(() => {
    let isMounted = true;

    // 1. Initial cached load on client mount
    const stored = getStoredAdminData<any>(ADMIN_STORAGE_KEYS.PAYMENT_SETTINGS, null);
    if (stored && isMounted) {
      setPaymentConfig(stored);
    }

    // 2. Fetch fresh from API
    const loadConfig = () => {
      settingsApi
        .getPaymentConfig()
        .then((res) => {
          if (isMounted && res) {
            setPaymentConfig(res);
            try { setStoredAdminData(ADMIN_STORAGE_KEYS.PAYMENT_SETTINGS, res); } catch {}
          }
        })
        .catch((err) => {
          console.warn('Could not load payment config from API:', err);
          const s = getStoredAdminData<any>(ADMIN_STORAGE_KEYS.PAYMENT_SETTINGS, null);
          if (isMounted && s) {
            setPaymentConfig(s);
          }
        });
    };

    loadConfig();

    const handleSettingsUpdated = (e: any) => {
      if (e?.detail && isMounted) {
        setPaymentConfig(e.detail);
      } else {
        loadConfig();
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === ADMIN_STORAGE_KEYS.PAYMENT_SETTINGS && e.newValue && isMounted) {
        try {
          setPaymentConfig(JSON.parse(e.newValue));
        } catch {}
      }
    };

    window.addEventListener('store_settings_updated', handleSettingsUpdated);
    window.addEventListener('storage', handleStorage);

    return () => {
      isMounted = false;
      window.removeEventListener('store_settings_updated', handleSettingsUpdated);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const getItemAvailableStock = (item: { id: string; sku?: string; inStockQty?: number }) => {
    const found = catalogProducts.find(
      (p) => p.id === item.id || (p.code && item.sku && p.code.toLowerCase() === item.sku.toLowerCase())
    );
    if (found) {
      return getProductStockForBranch(found, selectedBranch);
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

  // Address source & profile address management
  const [profileAddresses, setProfileAddresses] = useState<ProfileAddressItem[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [addressSource, setAddressSource] = useState<'profile' | 'last_order' | 'manual'>('manual');

  // Guest Checkout -> Login/Register modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const saveCurrentDraft = () => {
    try {
      const draftData = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        city,
        district,
        address: address.trim(),
        specialNote: specialNote.trim(),
        paymentMethod,
        selectedBranch,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem('d2_checkout_pending_draft', JSON.stringify(draftData));
    } catch (e) {
      console.warn('Failed to save checkout draft:', e);
    }
  };

  const handleRedirectAuth = (targetPath: string) => {
    saveCurrentDraft();
    const returnUrl = `/checkout${isDirectMode ? '?direct=1' : ''}`;
    const sep = targetPath.includes('?') ? '&' : '?';
    router.push(`${targetPath}${sep}redirect=${encodeURIComponent(returnUrl)}`);
  };

  React.useEffect(() => {
    const loadBranches = async () => {
      try {
        const list = await branchApi.getBranches();
        if (list && Array.isArray(list) && list.length > 0) {
          setBranches(list);
          const savedBranch = localStorage.getItem('d2_selected_branch') || localStorage.getItem('d2_customer_branch') || '';
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
      const fallback = localStorage.getItem('d2_selected_branch') || localStorage.getItem('d2_customer_branch') || 'Chi nhánh Hà Nội';
      setSelectedBranch(fallback);
    };
    loadBranches();

    const handleBranchChanged = (e: any) => {
      const b = e.detail?.branch || e.detail?.branchName;
      if (b && b !== 'all') {
        setSelectedBranch(b);
      }
    };
    window.addEventListener('customer_branch_changed', handleBranchChanged);
    window.addEventListener('branch_changed', handleBranchChanged);
    return () => {
      window.removeEventListener('customer_branch_changed', handleBranchChanged);
      window.removeEventListener('branch_changed', handleBranchChanged);
    };
  }, []);

  // Synchronize delivery address according to business rules:
  // 1. If user has saved addresses in Profile -> use default profile address.
  // 2. If NO address in Profile -> check and use address from the previous order (if any).
  // 3. Otherwise -> user enters new address manually.
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    // Priority Rule 0: If there is a pending checkout draft (e.g. from guest who just logged in/registered)
    try {
      const draftStr = localStorage.getItem('d2_checkout_pending_draft');
      if (draftStr) {
        const draft = JSON.parse(draftStr);
        if (draft && (draft.city || draft.address || draft.fullName || draft.phone)) {
          setSelectedAddressId('manual');
          setAddressSource('manual');
          setFullName(draft.fullName || user?.name || '');
          setPhone(draft.phone || user?.phone || '');
          setCity(draft.city || '');
          setDistrict(draft.district || '');
          setAddress(draft.address || '');
          if (draft.specialNote) setSpecialNote(draft.specialNote);
          if (draft.paymentMethod) setPaymentMethod(draft.paymentMethod);
          if (draft.selectedBranch) setSelectedBranch(draft.selectedBranch);
          localStorage.removeItem('d2_checkout_pending_draft');
          message.success('Đã tự động khôi phục toàn bộ thông tin nhận hàng quý khách vừa điền trước đó!');
          return;
        }
      }
    } catch (e) {
      console.warn('Could not restore checkout draft:', e);
    }

    let profileAddrs: ProfileAddressItem[] = [];
    if (user?.id) {
      try {
        const raw = localStorage.getItem(`d2_addresses_${user.id}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            profileAddrs = parsed.filter(
              (a: any) =>
                a.id !== 'addr_01' &&
                a.id !== 'addr_02' &&
                !a.id?.startsWith('addr_order_') &&
                !a.address?.includes('Đảo Kim Cương') &&
                !a.address?.includes('Gamuda')
            );
          }
        }
      } catch {}
    }

    setProfileAddresses(profileAddrs);

    // Rule 1: Profile has saved addresses
    if (profileAddrs.length > 0) {
      const defaultAddr = profileAddrs.find((a) => a.isDefault) || profileAddrs[0];
      setSelectedAddressId(defaultAddr.id);
      setAddressSource('profile');

      setFullName(defaultAddr.recipient || user?.name || '');
      setPhone(defaultAddr.phone || user?.phone || '');
      const parsed = extractAddressComponents(defaultAddr);
      setCity(parsed.city);
      setDistrict(parsed.district);
      setAddress(parsed.detailAddress);
      if (defaultAddr.note && defaultAddr.note !== 'Không có ghi chú thêm.') {
        setSpecialNote(defaultAddr.note);
      }
      return;
    }

    // Rule 2: No address in Profile -> Check previous order delivery address
    const lastKey = user?.id ? `d2_last_checkout_shipping_${user.id}` : 'd2_last_checkout_shipping_guest';
    let lastShipping: LastShippingInfo | null = null;
    try {
      const savedLast = localStorage.getItem(lastKey) || localStorage.getItem('d2_last_checkout_shipping_guest');
      if (savedLast) {
        lastShipping = JSON.parse(savedLast);
      }
    } catch {}

    if (lastShipping && (lastShipping.address || lastShipping.city)) {
      setSelectedAddressId('last_order');
      setAddressSource('last_order');
      setFullName(lastShipping.fullName || user?.name || '');
      setPhone(lastShipping.phone || user?.phone || '');
      setCity(lastShipping.city || '');
      setDistrict(lastShipping.district || '');
      setAddress(lastShipping.address || '');
      if (lastShipping.specialNote) {
        setSpecialNote(lastShipping.specialNote);
      }
      return;
    }

    // Rule 3: Manual address input
    setSelectedAddressId('manual');
    setAddressSource('manual');
    setFullName(user?.name || '');
    setPhone(user?.phone || '');
    setCity('');
    setDistrict('');
    setAddress('');
  }, [user]);

  const handleSelectProfileAddress = (addrId: string) => {
    setSelectedAddressId(addrId);
    if (addrId === 'manual') {
      setAddressSource('manual');
      setCity('');
      setDistrict('');
      setAddress('');
      return;
    }
    const found = profileAddresses.find((a) => a.id === addrId);
    if (found) {
      setAddressSource('profile');
      if (found.recipient) setFullName(found.recipient);
      if (found.phone) setPhone(found.phone);
      const parsed = extractAddressComponents(found);
      setCity(parsed.city);
      setDistrict(parsed.district);
      setAddress(parsed.detailAddress);
      if (found.note && found.note !== 'Không có ghi chú thêm.') {
        setSpecialNote(found.note);
      }
    }
  };

  const handleClearToManual = () => {
    setSelectedAddressId('manual');
    setAddressSource('manual');
    setCity('');
    setDistrict('');
    setAddress('');
    setSpecialNote('');
  };

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

  // Deposit configuration from Admin Settings
  const settingDepositPercent = useMemo(() => {
    if (paymentConfig?.defaultDeposit !== undefined && paymentConfig?.defaultDeposit !== null) {
      const parsed = Number(paymentConfig.defaultDeposit);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) return parsed;
    }
    return 30; // standard fallback
  }, [paymentConfig]);

  // User choice: 'deposit' | 'full'
  const [depositChoice, setDepositChoice] = useState<'deposit' | 'full'>('deposit');

  const isCod = paymentMethod === 'cod';

  const activeDepositPercent = useMemo(() => {
    if (isCod) return 0;
    if (depositChoice === 'full' || settingDepositPercent >= 100) return 100;
    return settingDepositPercent;
  }, [isCod, depositChoice, settingDepositPercent]);

  const payableNow = useMemo(() => {
    if (isCod) return 0;
    if (activeDepositPercent === 100) return finalTotal;
    return Math.round(finalTotal * (activeDepositPercent / 100));
  }, [isCod, activeDepositPercent, finalTotal]);

  const remainingOnDelivery = useMemo(() => {
    return Math.max(0, finalTotal - payableNow);
  }, [finalTotal, payableNow]);

  // Dynamic Bank and VietQR details from Store Configuration
  const activeBankName = paymentConfig?.bankName || 'MB Bank';
  const activeAccountNumber = (paymentConfig?.accountNumber || paymentConfig?.bankAccountNumber || '00867612199999').trim();
  const activeAccountName = (paymentConfig?.accountName || paymentConfig?.bankAccountName || 'BÙI VĂN DŨNG').trim();
  const activeBankBin = paymentConfig?.bankBin || getBankBin(activeBankName);
  const transferMemo = `D2 ${phone.replace(/\s+/g, '') || 'LUXURY'}`;
  const qrTemplate = paymentConfig?.vietQrTemplate || 'compact';

  const dynamicQrUrl = `https://img.vietqr.io/image/${activeBankBin}-${activeAccountNumber}-${qrTemplate}.png?amount=${payableNow}&addInfo=${encodeURIComponent(transferMemo)}&accountName=${encodeURIComponent(activeAccountName)}`;

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

    // Yêu cầu đăng nhập trước khi tạo đơn để gắn tài khoản, kích hoạt bảo hành và theo dõi đơn hàng
    if (!user) {
      saveCurrentDraft();
      setIsAuthModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const productNameSummary = activeItems.map((i) => i.name).join(', ');
      const fullShippingAddress = `${address}, ${district}, ${city}`;

      const isGuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const orderDepositAmount = isCod ? 0 : payableNow;
      const orderDepositPercent = isCod ? 0 : activeDepositPercent;
      const orderPaymentMethod = isCod
        ? 'COD'
        : activeDepositPercent < 100
        ? `VietQR (Cọc ${activeDepositPercent}%)`
        : 'VietQR (Đủ 100%)';
      const orderPaymentStatus = 'Pending';

      // Phân định chính xác: Chủ tài khoản đặt hàng (Tính công nợ) và Người nhận hàng (Bàn giao tại địa chỉ)
      const buyerName = ((user as any)?.name || (user as any)?.fullName || '').trim() || fullName.trim();
      const buyerPhone = (user?.phone || '').trim() || phone.trim();
      const buyerEmail = user?.email?.trim() || undefined;
      const recipientName = fullName.trim() || buyerName;
      const recipientPhone = phone.trim() || buyerPhone;

      let finalOrderNote = specialNote.trim();
      const isRecipientDifferent =
        recipientName.toLowerCase() !== buyerName.toLowerCase() ||
        recipientPhone.replace(/\s+/g, '') !== buyerPhone.replace(/\s+/g, '');

      if (isRecipientDifferent) {
        const handoverTag = `[Người nhận hàng: ${recipientName} - SĐT: ${recipientPhone}]`;
        if (!finalOrderNote.includes(handoverTag)) {
          finalOrderNote = finalOrderNote ? `${handoverTag} ${finalOrderNote}` : handoverTag;
        }
      }

      const created = await orderApi.createOrder({
        orderType: 'retail',
        branch: undefined,
        showroom: undefined,
        customerId: user?.id && isGuidRegex.test(user.id) ? user.id : undefined,
        customerName: buyerName,
        customerPhone: buyerPhone,
        customerEmail: buyerEmail,
        recipientName: recipientName,
        recipientPhone: recipientPhone,
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
        note: finalOrderNote || undefined,
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

      // Bắn thông báo thời gian thực ngay lập tức sang tab Admin
      try {
        const orderNotificationEvent = {
          orderCode: created.orderCode,
          customerName: buyerName,
          recipientName: recipientName,
          value: finalTotal,
          productName: productNameSummary || 'Nội thất D2 Luxury',
          timestamp: Date.now(),
        };
        localStorage.setItem('d2_latest_order_event', JSON.stringify(orderNotificationEvent));
        window.dispatchEvent(new CustomEvent('d2_new_order_placed', { detail: orderNotificationEvent }));
      } catch (evtErr) {
        console.warn('Could not dispatch new order event:', evtErr);
      }

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

          // Save delivery address for next checkout autofill (DO NOT save into personal profile address book!)
          try {
            const lastShippingData: LastShippingInfo = {
              fullName: fullName.trim(),
              phone: phone.trim(),
              city,
              district,
              address: address.trim(),
              specialNote: specialNote.trim(),
              savedAt: new Date().toISOString(),
            };
            if (user?.id) {
              localStorage.setItem(`d2_last_checkout_shipping_${user.id}`, JSON.stringify(lastShippingData));
            }
            localStorage.setItem('d2_last_checkout_shipping_guest', JSON.stringify(lastShippingData));
          } catch {}
        } catch (e) {
          console.warn('Could not save local user order:', e);
        }
      } else {
        // Also remember for guest checkout
        try {
          const lastShippingData: LastShippingInfo = {
            fullName: fullName.trim(),
            phone: phone.trim(),
            city,
            district,
            address: address.trim(),
            specialNote: specialNote.trim(),
            savedAt: new Date().toISOString(),
          };
          localStorage.setItem('d2_last_checkout_shipping_guest', JSON.stringify(lastShippingData));
        } catch {}
      }

      // Sync to admin orders local storage if available
      try {
        const currentAdminOrders = getStoredAdminData<any[]>(ADMIN_STORAGE_KEYS.ORDERS, []);
        if (Array.isArray(currentAdminOrders)) {
          setStoredAdminData(ADMIN_STORAGE_KEYS.ORDERS, [created, ...currentAdminOrders.filter((o) => o.id !== created.id)]);
        }
        window.dispatchEvent(new CustomEvent('d2_orders_updated', { detail: [created] }));
      } catch {}

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

                    {/* Address Source Notification & Selection */}
                    {profileAddresses.length > 0 ? (
                      <div className="md:col-span-2 p-3.5 bg-[#fbf2ee] border border-[#d2b8aa] flex flex-col gap-2.5">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <HomeOutlined className="text-[#5d371f] text-sm" />
                            <span className="font-bold text-xs text-[#5d371f] uppercase tracking-wider">
                              Địa chỉ từ Sổ Thông Tin Cá Nhân ({profileAddresses.length})
                            </span>
                          </div>
                          <Link
                            href="/profile"
                            target="_blank"
                            className="text-[11px] text-[#5d371f] hover:underline font-semibold"
                          >
                            Quản lý sổ địa chỉ ↗
                          </Link>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                          {profileAddresses.map((addr) => {
                            const isSelected = selectedAddressId === addr.id;
                            return (
                              <div
                                key={addr.id}
                                onClick={() => handleSelectProfileAddress(addr.id)}
                                className={`p-3 border transition-all cursor-pointer flex flex-col justify-between ${
                                  isSelected
                                    ? 'bg-white border-[#5d371f] ring-1 ring-[#5d371f] shadow-sm'
                                    : 'bg-white/70 border-[#eae1dd] hover:border-[#5d371f]/50'
                                }`}
                              >
                                <div>
                                  <div className="flex items-center justify-between mb-1 gap-2">
                                    <span className="font-bold text-xs text-[#1f1b19] truncate">{addr.title}</span>
                                    {addr.isDefault && (
                                      <span className="px-1.5 py-0.5 bg-[#5d371f] text-white text-[9px] font-bold uppercase shrink-0">
                                        Mặc định
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-[#51443d] line-clamp-2 leading-relaxed">{addr.address}</p>
                                </div>
                                <div className="mt-2 pt-1.5 border-t border-[#eae1dd]/60 flex items-center justify-between text-[10px] text-[#83746c]">
                                  <span>{addr.recipient}</span>
                                  <span>{addr.phone}</span>
                                </div>
                              </div>
                            );
                          })}

                          <div
                            onClick={() => handleSelectProfileAddress('manual')}
                            className={`p-3 border transition-all cursor-pointer flex items-center justify-center text-center ${
                              selectedAddressId === 'manual'
                                ? 'bg-white border-[#5d371f] ring-1 ring-[#5d371f]'
                                : 'bg-white/40 border-dashed border-[#eae1dd] hover:border-[#5d371f]/50'
                            }`}
                          >
                            <span className="text-xs font-semibold text-[#5d371f]">
                              + Nhập địa chỉ khác cho riêng đơn này
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : addressSource === 'last_order' ? (
                      <div className="md:col-span-2 p-3 bg-[#f5ece8] border border-[#d2b8aa] flex items-center justify-between gap-3 text-xs text-[#5d371f]">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px]">history</span>
                          <span>
                            Đã tự động điền địa chỉ từ <strong>lần mua hàng trước</strong> của quý khách.
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleClearToManual}
                          className="text-[11px] font-bold underline hover:text-[#784e34] cursor-pointer shrink-0"
                        >
                          Xóa để nhập mới
                        </button>
                      </div>
                    ) : (
                      <div className="md:col-span-2 p-3 bg-[#fbf2ee] border border-[#d2b8aa] flex items-center justify-between flex-wrap gap-2 text-xs text-[#5d371f]">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px] text-[#5d371f]">account_circle</span>
                          <span>
                            {!user ? (
                              <>
                                Quý khách đang đặt hàng với tư cách <strong>Khách vãng lai</strong>. Hãy{' '}
                                <button
                                  type="button"
                                  onClick={() => handleRedirectAuth('/login')}
                                  className="underline font-bold text-[#5d371f] hover:text-[#784e34] cursor-pointer bg-transparent border-0 p-0"
                                >
                                  Đăng nhập
                                </button>{' '}
                                hoặc{' '}
                                <button
                                  type="button"
                                  onClick={() => handleRedirectAuth('/login?tab=register')}
                                  className="underline font-bold text-[#5d371f] hover:text-[#784e34] cursor-pointer bg-transparent border-0 p-0"
                                >
                                  Đăng ký tài khoản
                                </button>{' '}
                                để bảo lưu đơn hàng &amp; kích hoạt bảo hành. Mọi thông tin quý khách đang nhập sẽ được tự động bảo toàn.
                              </>
                            ) : (
                              'Quý khách chưa lưu sổ địa chỉ cá nhân. Vui lòng nhập địa chỉ bên dưới, hệ thống sẽ tự động nhớ cho lần mua hàng tiếp theo.'
                            )}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Account Holder Indicator & Recipient Clarification */}
                    {user && (
                      <div className="md:col-span-2 p-3 bg-amber-50/70 border border-amber-200/80 text-xs text-[#5d371f] flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px] text-[#5d371f] shrink-0">verified_user</span>
                          <span>
                            Đơn hàng đứng tên tài khoản: <strong>{user.name || (user as any).fullName}</strong> {user.phone ? `(${user.phone})` : ''} • Lịch sử mua sắm, điểm thưởng &amp; công nợ sẽ được tính cho tài khoản này.
                          </span>
                        </div>
                        {((fullName.trim() && fullName.trim().toLowerCase() !== ((user.name || (user as any).fullName || '').trim().toLowerCase())) ||
                          (phone.trim() && user.phone && phone.replace(/\s+/g, '') !== user.phone.replace(/\s+/g, ''))) ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-[#5d371f] text-white px-2.5 py-0.5 self-start sm:self-auto shrink-0 shadow-2xs">
                            <span className="material-symbols-outlined text-[13px]">local_shipping</span>
                            Giao cho: {fullName.trim() || 'Người nhận hộ'}
                          </span>
                        ) : null}
                      </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                      <label className="font-semibold text-[#1f1b19] flex items-center justify-between">
                        <span>Họ &amp; Tên người nhận *</span>
                        <span className="text-[10px] text-[#83746c] font-normal">(Người nhận tại công trình / nhận hộ)</span>
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
                      <label className="font-semibold text-[#1f1b19] flex items-center justify-between">
                        <span>Số điện thoại người nhận *</span>
                        <span className="text-[10px] text-[#83746c] font-normal">(Để tài xế liên hệ khi giao hàng)</span>
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

                          {/* VietQR Deposit Selection Toggle */}
                          {paymentMethod === 'qr' && settingDepositPercent < 100 && (
                            <div className="mt-3.5 p-3.5 bg-white border border-[#eae1dd] flex flex-col gap-2 shadow-2xs">
                              <div className="flex items-center justify-between flex-wrap gap-1">
                                <span className="text-xs font-bold text-[#1f1b19] flex items-center gap-1.5">
                                  <span>Mức thanh toán đơn hàng:</span>
                                </span>
                                <span className="text-[11px] text-[#784e34] font-semibold bg-[#ffdbc8]/50 px-2 py-0.5 border border-[#784e34]/20">
                                  Tỷ lệ cọc cài đặt: {settingDepositPercent}%
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setDepositChoice('deposit')}
                                  className={`p-3 text-left border transition-all cursor-pointer flex flex-col gap-1 ${
                                    depositChoice === 'deposit'
                                      ? 'border-[#5d371f] bg-[#fbf2ee] ring-1 ring-[#5d371f]'
                                      : 'border-[#eae1dd] bg-white hover:border-[#5d371f]/40'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-[#5d371f]">
                                      Đặt cọc {settingDepositPercent}%
                                    </span>
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 bg-[#5d371f] text-white">
                                      Khuyên dùng
                                    </span>
                                  </div>
                                  <div className="text-sm font-data-mono font-bold text-[#1f1b19]">
                                    {Math.round(finalTotal * (settingDepositPercent / 100)).toLocaleString('vi-VN')}₫
                                  </div>
                                  <span className="text-[10px] text-[#83746c]">
                                    Còn lại {(finalTotal - Math.round(finalTotal * (settingDepositPercent / 100))).toLocaleString('vi-VN')}₫ khi nhận hàng
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setDepositChoice('full')}
                                  className={`p-3 text-left border transition-all cursor-pointer flex flex-col gap-1 ${
                                    depositChoice === 'full'
                                      ? 'border-[#5d371f] bg-[#fbf2ee] ring-1 ring-[#5d371f]'
                                      : 'border-[#eae1dd] bg-white hover:border-[#5d371f]/40'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-[#1f1b19]">
                                      Thanh toán 100%
                                    </span>
                                    <span className="text-[9px] text-[#83746c]">
                                      Toàn bộ
                                    </span>
                                  </div>
                                  <div className="text-sm font-data-mono font-bold text-[#1f1b19]">
                                    {finalTotal.toLocaleString('vi-VN')}₫
                                  </div>
                                  <span className="text-[10px] text-[#83746c]">
                                    Thanh toán trọn gói một lần
                                  </span>
                                </button>
                              </div>
                            </div>
                          )}

                          {/* VietQR Bank Preview Box */}
                          {paymentMethod === 'qr' && (
                            <div className="mt-4 p-4 sm:p-5 bg-white border border-[#eae1dd] flex flex-col md:flex-row items-center gap-5 shadow-sm animate-scale-in">
                              <div className="flex flex-col items-center gap-2 shrink-0">
                                <div className="bg-white p-2 border border-[#eae1dd] shadow-sm">
                                  <img
                                    src={dynamicQrUrl}
                                    alt={`Mã QR Chuyển khoản ${activeBankName}`}
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
                                  <p className="font-bold text-sm text-[#1f1b19]">{activeBankName}</p>
                                </div>

                                <div className="flex items-center justify-between py-1 border-b border-[#eae1dd]/60">
                                  <div>
                                    <span className="text-[10px] text-[#83746c] block">Chủ tài khoản:</span>
                                    <strong className="font-serif text-[#5d371f] text-xs uppercase">{activeAccountName}</strong>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between py-1 border-b border-[#eae1dd]/60">
                                  <div>
                                    <span className="text-[10px] text-[#83746c] block">Số tài khoản:</span>
                                    <strong className="font-data-mono text-sm text-[#1f1b19]">{activeAccountNumber}</strong>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(activeAccountNumber, 'Số tài khoản')}
                                    className="px-2.5 py-1 bg-[#fbf2ee] hover:bg-[#eae1dd] border border-[#eae1dd] text-[11px] font-bold text-[#5d371f] flex items-center gap-1 transition-colors cursor-pointer"
                                  >
                                    <CopyOutlined /> Sao chép
                                  </button>
                                </div>

                                <div className="flex items-center justify-between py-1 border-b border-[#eae1dd]/60">
                                  <div>
                                    <span className="text-[10px] text-[#83746c] block">
                                      {activeDepositPercent < 100 ? `Số tiền đặt cọc (${activeDepositPercent}%):` : 'Số tiền thanh toán (100%):'}
                                    </span>
                                    <strong className="font-data-mono text-sm text-[#5d371f]">{payableNow.toLocaleString('vi-VN')}₫</strong>
                                    {activeDepositPercent < 100 && (
                                      <span className="text-[10px] text-[#83746c] block mt-0.5">
                                        (Còn lại: {remainingOnDelivery.toLocaleString('vi-VN')}₫ thanh toán khi nhận hàng)
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(payableNow.toString(), 'Số tiền')}
                                    className="px-2.5 py-1 bg-[#fbf2ee] hover:bg-[#eae1dd] border border-[#eae1dd] text-[11px] font-bold text-[#5d371f] flex items-center gap-1 transition-colors cursor-pointer"
                                  >
                                    <CopyOutlined /> Sao chép
                                  </button>
                                </div>

                                <div className="flex items-center justify-between pt-1">
                                  <div>
                                    <span className="text-[10px] text-[#83746c] block">Nội dung chuyển khoản:</span>
                                    <strong className="font-data-mono text-xs text-[#5d371f]">{transferMemo}</strong>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(transferMemo, 'Nội dung chuyển khoản')}
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

                    <div className="flex justify-between text-[#1f1b19] font-semibold pt-1 border-t border-[#eae1dd]/60">
                      <span>Tổng giá trị đơn hàng:</span>
                      <span className="font-data-mono text-sm">
                        {finalTotal.toLocaleString('vi-VN')}đ
                      </span>
                    </div>

                    {!isCod && activeDepositPercent < 100 && (
                      <>
                        <div className="flex justify-between text-[#5d371f] font-semibold pt-1 border-t border-dashed border-[#eae1dd]">
                          <span>Tiền đặt cọc ({activeDepositPercent}% theo cài đặt):</span>
                          <span className="font-data-mono text-sm font-bold">
                            {payableNow.toLocaleString('vi-VN')}đ
                          </span>
                        </div>
                        <div className="flex justify-between text-[#83746c]">
                          <span>Còn lại khi nhận hàng ({100 - activeDepositPercent}%):</span>
                          <span className="font-data-mono font-semibold">
                            {remainingOnDelivery.toLocaleString('vi-VN')}đ
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Grand Total box */}
                  <div className="bg-[#fbf2ee] border border-[#eae1dd] p-4 flex flex-col gap-1">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-sm font-bold text-[#1f1b19]">
                          {!isCod && activeDepositPercent < 100
                            ? `Cần thanh toán hôm nay (Cọc ${activeDepositPercent}%):`
                            : isCod
                            ? 'Thanh toán khi nhận hàng (COD):'
                            : 'Tổng thanh toán:'}
                        </span>
                        <span className="block text-[10px] text-[#83746c]">
                          {!isCod && activeDepositPercent < 100
                            ? `Còn lại ${remainingOnDelivery.toLocaleString('vi-VN')}đ thanh toán khi giao lắp & nghiệm thu`
                            : 'Đã bao gồm 8% thuế GTGT & bảo hiểm hành trình'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-serif text-xl sm:text-2xl font-bold text-[#5d371f] font-data-mono">
                          {(!isCod && activeDepositPercent < 100
                            ? payableNow
                            : finalTotal
                          ).toLocaleString('vi-VN')}đ
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
                      href="tel:0867612199"
                      className="px-3 py-1.5 bg-white border border-[#eae1dd] text-xs font-bold text-[#5d371f] hover:bg-[#5d371f] hover:text-white transition-colors"
                    >
                      0867 612 199
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
              <span className="text-xs font-bold text-[#5d371f]">Quét mã VietQR {activeBankName} để thanh toán ngay</span>
              <img
                src={dynamicQrUrl}
                alt={`VietQR ${activeBankName}`}
                className="w-40 h-auto rounded border border-[#eae1dd] shadow-sm bg-white p-1"
              />
              <span className="text-[11px] text-[#83746c]">
                STK: <strong>{activeAccountNumber}</strong> ({activeBankName}) • Chủ TK: <strong>{activeAccountName}</strong> • Nội dung: <strong>{transferMemo}</strong>
              </span>
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

      {/* Modal Yêu cầu Đăng nhập / Đăng ký để bảo toàn thông tin đặt hàng */}
      <Modal
        open={isAuthModalOpen}
        onCancel={() => setIsAuthModalOpen(false)}
        footer={null}
        centered
        width={480}
        styles={{
          body: {
            padding: '28px 24px',
            backgroundColor: '#fff8f5',
          },
        }}
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-[#f5ece8] border border-[#d2b8aa] flex items-center justify-center mb-3.5">
            <SafetyCertificateOutlined className="text-2xl text-[#5d371f]" />
          </div>

          <h3 className="font-serif text-xl font-bold text-[#1f1b19] tracking-tight mb-1.5">
            Đăng nhập để hoàn tất đơn hàng
          </h3>
          <p className="text-xs text-[#83746c] max-w-sm leading-relaxed mb-4">
            Để đảm bảo quyền lợi bảo hành 10 năm mộng gỗ thủ công D2 LUXURY, xuất hóa đơn hợp đồng và theo dõi tiến độ thi công bàn giao, quý khách vui lòng đăng nhập hoặc tạo tài khoản.
          </p>

          <div className="w-full bg-white border border-[#d2b8aa] p-3 text-left mb-5 flex items-start gap-2.5 shadow-xs">
            <CheckCircleFilled className="text-emerald-700 text-sm mt-0.5 shrink-0" />
            <div className="text-[11px] text-[#5d371f] leading-relaxed">
              <strong className="block text-[#1f1b19]">Thông tin nhận hàng của quý khách đã được lưu tạm:</strong>
              <div className="text-[#83746c] mt-0.5 truncate">
                {fullName || 'Chưa nhập tên'} &bull; {phone || 'Chưa nhập SĐT'} &bull; {address ? `${address}, ${district}, ${city}` : 'Địa chỉ nhận hàng'}
              </div>
            </div>
          </div>

          <div className="w-full flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => handleRedirectAuth('/login')}
              className="w-full py-3 bg-[#5d371f] hover:bg-[#784e34] text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border-0 shadow-sm"
            >
              Đăng nhập tài khoản gia chủ
            </button>
            <button
              type="button"
              onClick={() => handleRedirectAuth('/login?tab=register')}
              className="w-full py-2.5 bg-white hover:bg-[#f5ece8] text-[#5d371f] border border-[#d2b8aa] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              Đăng ký tài khoản mới (Tự động đăng nhập)
            </button>
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(false)}
              className="text-[11px] text-[#83746c] hover:text-[#1f1b19] underline cursor-pointer bg-transparent border-0 mt-1"
            >
              Quay lại chỉnh sửa thêm thông tin đơn hàng
            </button>
          </div>
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
