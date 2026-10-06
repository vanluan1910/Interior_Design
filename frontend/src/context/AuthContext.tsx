'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role: 'admin' | 'customer';
  address?: string;
  joinDate?: string;
  bio?: string;
}

export const DEFAULT_ADMIN_USER: User = {
  id: 'usr_admin_01',
  name: 'Văn Luận',
  email: 'vanluan1910@d2luxury.vn',
  phone: '0918 345 678',
  avatar:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCat_S6E8qhOpd0scj-6rD4LfY-vo8Z8BklqUwqxMQ7KmIIIgjWnFYxUX5fCgoVlCAAL_D8yl8U9ygJ0mEVG7YKDvo7gJ6zFOVjaKRNG_Cg0c2N5V8m5uiyP19HNH0NrH3dQdUC9VFMfNIe6EMKef3NZFvNCfCOWMVw2Q1X0zJcbXJvCdsvo8d1fnvyZGmzP2qJA0aHtNnpovE1Pk7M0kbgrh3_ATbB9f5cnwRYJTPAtz9HlOwVQrbq',
  role: 'admin',
  address: 'Văn phòng Điều hành D2 LUXURY, 68 Nguyễn Cơ Thạch, P. An Lợi Đông, TP. Thủ Đức, TP. HCM',
  joinDate: '10/2024',
  bio: 'Quản trị viên hệ sinh thái Nội thất Tinh hoa D2 LUXURY. Chuyên gia cố vấn chế tác gỗ óc chó & sồi Bắc Mỹ FAS.',
};

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  login: (identifier: string, password?: string) => boolean;
  register: (data: { name: string; phone: string; email?: string; password?: string; preferences?: string[] }) => User;
  loginAsAdmin: () => void;
  loginAsCustomer: (name?: string, email?: string) => void;
  logout: () => void;
  updateProfile: (updatedData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'd2_luxury_auth_user_v1';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(DEFAULT_ADMIN_USER);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      } else {
        // Default initialized as Admin per user request
        setUser(DEFAULT_ADMIN_USER);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(DEFAULT_ADMIN_USER));
      }
    } catch {
      setUser(DEFAULT_ADMIN_USER);
    }
  }, []);

  const login = (identifier: string, _password?: string): boolean => {
    const trimmed = identifier.trim().toLowerCase();
    // If admin credentials or matches admin email/phone
    if (
      trimmed === 'vanluan1910@d2luxury.vn' ||
      trimmed === '0918 345 678' ||
      trimmed === 'admin' ||
      trimmed.includes('vanluan')
    ) {
      setUser(DEFAULT_ADMIN_USER);
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(DEFAULT_ADMIN_USER));
      } catch {}
      return true;
    }

    // Customer login
    const customerUser: User = {
      id: `usr_${Date.now()}`,
      name: trimmed.includes('@') ? trimmed.split('@')[0] : 'Gia Chủ Tinh Hoa',
      email: trimmed.includes('@') ? trimmed : 'khachhang@mocgia.vn',
      phone: !trimmed.includes('@') ? identifier.trim() : '0912 345 678',
      avatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCat_S6E8qhOpd0scj-6rD4LfY-vo8Z8BklqUwqxMQ7KmIIIgjWnFYxUX5fCgoVlCAAL_D8yl8U9ygJ0mEVG7YKDvo7gJ6zFOVjaKRNG_Cg0c2N5V8m5uiyP19HNH0NrH3dQdUC9VFMfNIe6EMKef3NZFvNCfCOWMVw2Q1X0zJcbXJvCdsvo8d1fnvyZGmzP2qJA0aHtNnpovE1Pk7M0kbgrh3_ATbB9f5cnwRYJTPAtz9HlOwVQrbq',
      role: 'customer',
      address: 'Khu biệt thự Vinhomes Riverside, Long Biên, Hà Nội',
      joinDate: '09/2026',
    };
    setUser(customerUser);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(customerUser));
    } catch {}
    return true;
  };

  const register = (data: {
    name: string;
    phone: string;
    email?: string;
    password?: string;
    preferences?: string[];
  }): User => {
    const newUser: User = {
      id: `usr_${Date.now()}`,
      name: data.name.trim() || 'Gia Chủ Mộc Gia',
      email: data.email?.trim() || `${data.phone.replace(/\s+/g, '')}@mocgia.vn`,
      phone: data.phone.trim(),
      avatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCat_S6E8qhOpd0scj-6rD4LfY-vo8Z8BklqUwqxMQ7KmIIIgjWnFYxUX5fCgoVlCAAL_D8yl8U9ygJ0mEVG7YKDvo7gJ6zFOVjaKRNG_Cg0c2N5V8m5uiyP19HNH0NrH3dQdUC9VFMfNIe6EMKef3NZFvNCfCOWMVw2Q1X0zJcbXJvCdsvo8d1fnvyZGmzP2qJA0aHtNnpovE1Pk7M0kbgrh3_ATbB9f5cnwRYJTPAtz9HlOwVQrbq',
      role: 'customer',
      address: 'Đang cập nhật địa chỉ công trình...',
      joinDate: '09/2026',
      bio: data.preferences?.length ? `Ưa chuộng phong cách: ${data.preferences.join(', ')}` : undefined,
    };
    setUser(newUser);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
    } catch {}
    return newUser;
  };

  const loginAsAdmin = () => {
    setUser(DEFAULT_ADMIN_USER);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(DEFAULT_ADMIN_USER));
    } catch {}
  };

  const loginAsCustomer = (name = 'Trần Minh Hoàng', email = 'hoang.tran@mocgia.vn') => {
    const customerUser: User = {
      id: `usr_${Date.now()}`,
      name,
      email,
      phone: '0912 345 678',
      avatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCat_S6E8qhOpd0scj-6rD4LfY-vo8Z8BklqUwqxMQ7KmIIIgjWnFYxUX5fCgoVlCAAL_D8yl8U9ygJ0mEVG7YKDvo7gJ6zFOVjaKRNG_Cg0c2N5V8m5uiyP19HNH0NrH3dQdUC9VFMfNIe6EMKef3NZFvNCfCOWMVw2Q1X0zJcbXJvCdsvo8d1fnvyZGmzP2qJA0aHtNnpovE1Pk7M0kbgrh3_ATbB9f5cnwRYJTPAtz9HlOwVQrbq',
      role: 'customer',
      address: 'Căn hộ Duplex, Thảo Điền, TP. Thủ Đức, TP. Hồ Chí Minh',
      joinDate: '09/2026',
    };
    setUser(customerUser);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(customerUser));
    } catch {}
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {}
  };

  const updateProfile = (updatedData: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updatedData };
    setUser(updated);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isAdmin: user?.role === 'admin',
        login,
        register,
        loginAsAdmin,
        loginAsCustomer,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
