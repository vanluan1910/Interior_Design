'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';

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

const DEFAULT_INITIAL_CART: CartItemData[] = [];

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

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [cartItems, setCartItems] = useState<CartItemData[]>(DEFAULT_INITIAL_CART);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const currentUserId = user?.id || 'guest';
  const prevUserIdRef = useRef<string>(currentUserId);

  const cartStorageKey = user?.id ? `d2_luxury_cart_${user.id}` : 'd2_luxury_cart_guest';
  const wishlistStorageKey = user?.id ? `d2_luxury_wishlist_${user.id}` : 'd2_luxury_wishlist_guest';

  // Load from localStorage on mount and when user changes
  useEffect(() => {
    if (isAuthLoading) return;

    try {
      // Clean up legacy global keys if any
      localStorage.removeItem('d2_luxury_cart_items_v2');
      localStorage.removeItem('d2_luxury_wishlist_ids_v2');

      const storedCart = localStorage.getItem(cartStorageKey);
      if (storedCart) {
        const parsed = JSON.parse(storedCart);
        if (Array.isArray(parsed)) {
          setCartItems(parsed);
        } else {
          setCartItems([]);
        }
      } else {
        setCartItems([]);
      }

      const storedWishlist = localStorage.getItem(wishlistStorageKey);
      if (storedWishlist) {
        const parsedWishlist = JSON.parse(storedWishlist);
        if (Array.isArray(parsedWishlist)) {
          setWishlistIds(parsedWishlist);
        } else {
          setWishlistIds([]);
        }
      } else {
        setWishlistIds([]);
      }
    } catch (e) {
      console.error('Failed to load cart from localStorage', e);
      setCartItems([]);
      setWishlistIds([]);
    } finally {
      setIsInitialized(true);
      prevUserIdRef.current = currentUserId;
    }
  }, [currentUserId, isAuthLoading, cartStorageKey, wishlistStorageKey]);

  // Save to localStorage on change
  useEffect(() => {
    if (!isInitialized || isAuthLoading) return;
    if (prevUserIdRef.current !== currentUserId) return;

    try {
      localStorage.setItem(cartStorageKey, JSON.stringify(cartItems));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [cartItems, isInitialized, isAuthLoading, cartStorageKey, currentUserId]);

  useEffect(() => {
    if (!isInitialized || isAuthLoading) return;
    if (prevUserIdRef.current !== currentUserId) return;

    try {
      localStorage.setItem(wishlistStorageKey, JSON.stringify(wishlistIds));
    } catch (e) {
      console.error('Failed to save wishlist to localStorage', e);
    }
  }, [wishlistIds, isInitialized, isAuthLoading, wishlistStorageKey, currentUserId]);

  // Sync with other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === cartStorageKey && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setCartItems(parsed);
          }
        } catch {}
      }
      if (e.key === wishlistStorageKey && e.newValue) {
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
  }, [cartStorageKey, wishlistStorageKey]);

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
