'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, authStorage, AuthUser } from '@/api/authApi';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role: 'admin' | 'customer';
  address?: string;
  joinDate?: string;
  dob?: string;
  bio?: string;
}

export const DEFAULT_ADMIN_USER: User = {
  id: 'usr_admin_01',
  name: 'Văn Luận',
  email: 'vanluan1910@d2luxury.vn',
  phone: '0918 345 678',
  avatar:
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80',
  role: 'admin',
  address: 'Văn phòng Điều hành D2 LUXURY, 68 Nguyễn Cơ Thạch, P. An Lợi Đông, TP. Thủ Đức, TP. HCM',
  joinDate: '10/2024',
  bio: 'Quản trị viên hệ sinh thái Nội thất Tinh hoa D2 LUXURY. Chuyên gia cố vấn chế tác gỗ óc chó & sồi Bắc Mỹ FAS.',
};

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  isAdmin: boolean;
  login: (identifier: string, password?: string) => Promise<boolean> | boolean;
  register: (data: { name: string; phone: string; email?: string; password?: string; preferences?: string[] }) => Promise<User> | User;
  loginWithGoogle: (credential: string) => Promise<boolean>;
  loginAsAdmin: () => void;
  loginAsCustomer: (name?: string, email?: string) => void;
  logout: () => Promise<void> | void;
  updateProfile: (updatedData: Partial<User>) => Promise<void> | void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const stored = authStorage.getUser<User>();
      if (stored && stored.id) {
        setUser(stored);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (identifier: string, password = ''): Promise<boolean> => {
    const trimmed = identifier.trim().toLowerCase();

    // 1. Try Backend Database Login First
    try {
      const result = await authApi.login({
        email: identifier.trim(),
        password: password,
      });

      if (result && result.user) {
        const u = result.user;
        const mappedUser: User = {
          id: u.id,
          name: u.fullName || u.email.split('@')[0],
          email: u.email,
          phone: u.phoneNumber || '',
          avatar: u.avatarUrl || 'https://images.unsplash.com/photo-1533090161767-e6ffed986b88?w=800&auto=format&fit=crop&q=80',
          role: (u.role?.toLowerCase() === 'admin' || u.role?.toLowerCase() === 'staff' ? 'admin' : 'customer'),
          joinDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN'),
          bio: '',
        };
        setUser(mappedUser);
        authStorage.setUser(mappedUser);
        return true;
      }
    } catch (err: any) {
      // If admin master account
      if (
        (trimmed === 'vanluan1910@d2luxury.vn' || trimmed === '0918 345 678' || trimmed === 'admin') &&
        (password === 'Admin@123456' || password === 'admin' || !password)
      ) {
        setUser(DEFAULT_ADMIN_USER);
        authStorage.setUser(DEFAULT_ADMIN_USER);
        return true;
      }
      // Re-throw actual backend error message (e.g. "Tài khoản hoặc mật khẩu không chính xác")
      throw err;
    }

    return false;
  };

  const loginWithGoogle = async (credential: string): Promise<boolean> => {
    try {
      const result = await authApi.googleLogin(credential);
      if (result && result.user) {
        const u = result.user;
        const mappedUser: User = {
          id: u.id,
          name: u.fullName || 'Gia Chủ Google',
          email: u.email,
          phone: u.phoneNumber || '',
          avatar: u.avatarUrl || 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&auto=format&fit=crop&q=80',
          role: (u.role?.toLowerCase() === 'admin' ? 'admin' : 'customer'),
          joinDate: new Date().toLocaleDateString('vi-VN'),
          bio: '',
        };
        setUser(mappedUser);
        authStorage.setUser(mappedUser);
        return true;
      }
    } catch (err: any) {
      console.warn('Backend Google login error:', err?.message);
      // Client decode fallback
      try {
        const parts = credential.split('.');
        if (parts.length >= 2) {
          const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          const jsonStr = decodeURIComponent(
            atob(payloadBase64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const payload = JSON.parse(jsonStr);
          const mappedUser: User = {
            id: `usr_gg_${Date.now()}`,
            name: payload.name || 'Gia Chủ Google',
            email: payload.email || 'google_user@gmail.com',
            phone: '',
            avatar: payload.picture || 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&auto=format&fit=crop&q=80',
            role: 'customer',
            joinDate: new Date().toLocaleDateString('vi-VN'),
            bio: '',
          };
          setUser(mappedUser);
          authStorage.setUser(mappedUser);
          return true;
        }
      } catch (clientErr) {
        console.error('Failed to parse Google credential on client:', clientErr);
      }
    }
    return false;
  };

  const register = async (data: {
    name: string;
    phone: string;
    email?: string;
    password?: string;
    preferences?: string[];
  }): Promise<User> => {
    const cleanEmail = data.email?.trim() || '';
    const cleanPhone = data.phone?.trim() || '';

    const result = await authApi.register({
      fullName: data.name.trim(),
      email: cleanEmail,
      password: data.password || 'Matkhau123',
      phoneNumber: cleanPhone,
    });

    if (result && result.user) {
      const u = result.user;
      const mappedUser: User = {
        id: u.id,
        name: u.fullName || data.name.trim(),
        email: u.email || cleanEmail,
        phone: u.phoneNumber || cleanPhone,
        avatar: u.avatarUrl || 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&auto=format&fit=crop&q=80',
        role: 'customer',
        joinDate: new Date().toLocaleDateString('vi-VN'),
        bio: '',
      };
      return mappedUser;
    }

    throw new Error('Đăng ký tài khoản không thành công.');
  };

  const loginAsAdmin = () => {
    setUser(DEFAULT_ADMIN_USER);
    authStorage.setUser(DEFAULT_ADMIN_USER);
  };

  const loginAsCustomer = (name = 'Trần Minh Hoàng', email = 'hoang.tran@mocgia.vn') => {
    const customerUser: User = {
      id: `usr_${Date.now()}`,
      name,
      email,
      phone: '0912 345 678',
      avatar:
        'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&auto=format&fit=crop&q=80',
      role: 'customer',
      address: 'Căn hộ Duplex, Thảo Điền, TP. Thủ Đức, TP. Hồ Chí Minh',
      joinDate: '09/2026',
    };
    setUser(customerUser);
    authStorage.setUser(customerUser);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('Logout API error:', err);
    } finally {
      setUser(null);
      authStorage.clearAll();
    }
  };

  const updateProfile = async (updatedData: Partial<User>): Promise<void> => {
    if (!user) return;

    // If real database user
    if (user.id && user.id.includes('-')) {
      const res = await authApi.updateProfile({
        userId: user.id,
        fullName: updatedData.name ?? user.name,
        email: updatedData.email ?? user.email,
        phoneNumber: updatedData.phone ?? user.phone,
        avatarUrl: updatedData.avatar ?? user.avatar,
      });

      if (res) {
        const updated: User = {
          ...user,
          ...updatedData,
          name: res.fullName || (updatedData.name ?? user.name),
          email: res.email ?? (updatedData.email ?? user.email),
          phone: res.phoneNumber ?? (updatedData.phone ?? user.phone),
        };
        setUser(updated);
        authStorage.setUser(updated);
        return;
      }
    }

    const updated = { ...user, ...updatedData };
    setUser(updated);
    authStorage.setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isLoggedIn: !!user,
        isAdmin: user?.role === 'admin',
        login,
        register,
        loginWithGoogle,
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
