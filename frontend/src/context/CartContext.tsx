'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Product } from '@/types';
import { productsData } from '@/data/products';

export interface CartItemData {
  id: string;
  sku: string;
  name: string;
  collection: string;
  badge: string;
  image: string;
  price: number;
  originalPrice: number;
  quantity: number;
  selected: boolean;
  isFavorite: boolean;
  specs: string[];
  giftInfo?: string;
}

const DEFAULT_INITIAL_CART: CartItemData[] = [
  {
    id: 'sofa-kyoto-01',
    sku: 'KYOTO-SF-01',
    name: 'Sofa Góc Chữ L Gỗ Óc Chó Kyoto',
    collection: 'Bộ sưu tập Kyoto 2025',
    badge: '12% Nghệ nhân',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDQRsgCBkXk2ENFvYz1MIvU_LUcCG4-zF_TKp8yQCWu2qEXucWTkueS1S9rYlrjYAVmEdiu9vVFawmJ5igwK_qHnmxyyKsofyqVlCXuNphzYECqgVniDeVda96x74jNeCfJ-TT1q3XRvC44hrCcfeviKISqf9x1ybDmzEVo-mO56aOxr--k0fKaPXeeIQ-Vl8f_ebRuZZp3AKyfwnZ3gOad9HgP40QyVwfe6DwrQNzZoeKtQDjz03yc',
    price: 38500000,
    originalPrice: 44000000,
    quantity: 1,
    selected: true,
    isFavorite: false,
    specs: ['Gỗ óc chó Bắc Mỹ FAS', 'Đệm Linen Oatmeal Bỉ', 'Phân hướng: Góc Phải (R)'],
    giftInfo: 'Tặng kèm: 2 gối tựa lông vũ Mộc Gia nguyên bản (Trị giá 1.800.000đ)',
  },
  {
    id: 'ban-tra-nami-02',
    sku: 'NAMI-TB-02',
    name: 'Bàn Trà Tròn Đôi Mộc Gia',
    collection: 'Bộ sưu tập Sóng Nami',
    badge: 'Nami Series',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD1eUFJm5O0CveRHXEq2DjzxskTcpkaicfB3U-olNREZdP1oq_Ywvo6qgZTpo38bsQ9dnUi7K9obB-nrhixenuyfNAkUUUq8sPc22O3Wx4C6pyq5sjvvl5u--CAqkkt--92J156F7tBRMtMIE0gSk-dHtU_z5i7j-5GiPgULfNvWNKjmhzaM1masM2uHvVXw0gExIB4Qavij4W0lBuZgowrlLt_zg_JkO8yuYPu1ITMjGJZKR3A5m5S',
    price: 11800000,
    originalPrice: 14200000,
    quantity: 1,
    selected: true,
    isFavorite: false,
    specs: ['Gỗ sồi trắng Bắc Mỹ', 'Dầu mộc Osmo Đức', 'Đường kính D800 + D500mm', 'Vát bo 45° lượn sóng'],
  },
  {
    id: 'ghe-asahi-03',
    sku: 'ASAHI-CH-03',
    name: 'Ghế Đơn Thư Giãn Asahi',
    collection: 'Ghế bành thư giãn',
    badge: 'Tuyệt phẩm mộc',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCeYxctmB1Dxdn8V4AgUwcZwDxyrTW-PD8eaXagufX9ZMRkovl0piwtfzujF_c3DEaI7p019YQuMg79N_yRabORZjBes6C9T6PjAY11rC9KS_dRcSz-AcMj9oH5tcZ8sgZDOR4j8OLTsw4GiVFQpbrSVI4fvH65cEp2ZPJKpylJXWLox37mmjjkS8FSNioYKRxa5MUYIvUXsOOS_7qA73gWeuK22kArdl6yXDvB7P-ZOSi8KDm3XpkK',
    price: 15500000,
    originalPrice: 18000000,
    quantity: 1,
    selected: true,
    isFavorite: true,
    specs: ['Khung gỗ sồi uốn mộng', 'Vải Bouclé lông cừu thô', 'Sấy chân không 45 ngày (ẩm 9-11%)'],
  },
];

interface CartContextType {
  cartItems: CartItemData[];
  cartCount: number;
  wishlistIds: string[];
  wishlistCount: number;
  isInitialized: boolean;
  addToCart: (
    item: Partial<CartItemData> & { id: string; name: string; price: number; image: string },
    quantity?: number
  ) => void;
  updateQuantity: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  removeSelected: () => void;
  toggleItemSelect: (id: string) => void;
  toggleSelectAll: () => void;
  toggleWishlist: (id: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'd2_luxury_cart_items_v2';
const WISHLIST_STORAGE_KEY = 'd2_luxury_wishlist_ids_v2';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItemData[]>(DEFAULT_INITIAL_CART);
  const [wishlistIds, setWishlistIds] = useState<string[]>(['ghe-asahi-03']);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (storedCart) {
        const parsed = JSON.parse(storedCart);
        if (Array.isArray(parsed)) {
          setCartItems(parsed);
        }
      } else {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(DEFAULT_INITIAL_CART));
      }

      const storedWishlist = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (storedWishlist) {
        const parsedWishlist = JSON.parse(storedWishlist);
        if (Array.isArray(parsedWishlist)) {
          setWishlistIds(parsedWishlist);
        }
      } else {
        localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(['ghe-asahi-03']));
      }
    } catch (e) {
      console.error('Failed to load cart from localStorage', e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [cartItems, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistIds));
    } catch (e) {
      console.error('Failed to save wishlist to localStorage', e);
    }
  }, [wishlistIds, isInitialized]);

  // Sync with other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CART_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setCartItems(parsed);
          }
        } catch {}
      }
      if (e.key === WISHLIST_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setWishlistIds(parsed);
          }
        } catch {}
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const addToCart = (
    item: Partial<CartItemData> & { id: string; name: string; price: number; image: string },
    quantity = 1
  ) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      const newItem: CartItemData = {
        id: item.id,
        sku: item.sku || `SKU-${item.id.toUpperCase()}`,
        name: item.name,
        collection: item.collection || 'Bộ sưu tập D2 LUXURY 2025',
        badge: item.badge || 'Tuyệt tác mộc',
        image: item.image,
        price: item.price,
        originalPrice: item.originalPrice || Math.round(item.price * 1.15),
        quantity: Math.max(1, quantity),
        selected: true,
        isFavorite: wishlistIds.includes(item.id),
        specs: item.specs || ['Gỗ tự nhiên chuẩn FAS', 'Sơn dầu mộc cao cấp'],
        giftInfo: item.giftInfo,
      };
      return [...prev, newItem];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const removeFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const removeSelected = () => {
    setCartItems((prev) => prev.filter((item) => !item.selected));
  };

  const toggleItemSelect = (id: string) => {
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const toggleSelectAll = () => {
    const allSelected = cartItems.length > 0 && cartItems.every((i) => i.selected);
    setCartItems((prev) => prev.map((item) => ({ ...item, selected: !allSelected })));
  };

  const toggleWishlist = (id: string) => {
    setWishlistIds((prev) => {
      const next = prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id];
      return next;
    });
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const wishlistCount = useMemo(() => {
    return wishlistIds.length;
  }, [wishlistIds]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        wishlistIds,
        wishlistCount,
        isInitialized,
        addToCart,
        updateQuantity,
        removeFromCart,
        removeSelected,
        toggleItemSelect,
        toggleSelectAll,
        toggleWishlist,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
