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
  roleCode?: string;
  roleId?: string;
  roleName?: string;
  branch?: string;
  branchId?: string;
  permissions?: string[];
  address?: string;
  joinDate?: string;
  dob?: string;
  bio?: string;
}

export const DEFAULT_ADMIN_USER: User = {
  id: 'A1111111-1111-1111-1111-111111111111',
  name: 'Admin',
  email: 'admin@d2luxury.vn',
  phone: '0900 000 000',
  avatar:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  role: 'admin',
  roleCode: 'SUPER_ADMIN',
  roleName: 'Quản trị viên',
  permissions: ['*'],
  address: 'Văn phòng Điều hành D2 LUXURY',
  joinDate: '10/2026',
  bio: 'Quản trị viên hệ sinh thái D2 LUXURY.',
};

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  isAdmin: boolean;
  hasPermission: (permissionKey: string) => boolean;
  hasAnyPermission: (permissionKeys: string[]) => boolean;
  login: (identifier: string, password?: string) => Promise<boolean> | boolean;
  register: (data: { name: string; phone: string; email?: string; password?: string; preferences?: string[] }) => Promise<User> | User;
  loginWithGoogle: (credential: string) => Promise<boolean>;
  loginAsAdmin: () => void;
  loginAsCustomer: (name?: string, email?: string) => void;
  logout: () => Promise<void> | void;
  updateProfile: (updatedData: Partial<User>) => Promise<void> | void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function sanitizeMojibake(str?: string): string {
  if (!str) return '';
  if (
    str.includes('Quá') ||
    str.includes('trá»') ||
    str.includes('viÃªn') ||
    str.includes('viA*n') ||
    str.includes('Quá*') ||
    str.includes('trá»<')
  ) {
    return 'Quản trị viên';
  }
  return str;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const stored = authStorage.getUser<User>();
      if (stored && stored.id) {
        let changed = false;
        const cleanedName = sanitizeMojibake(stored.name);
        if (cleanedName !== stored.name) {
          stored.name = cleanedName;
          changed = true;
        }
        const cleanedRole = sanitizeMojibake(stored.roleName);
        if (cleanedRole !== stored.roleName) {
          stored.roleName = cleanedRole;
          changed = true;
        }
        if (changed) {
          authStorage.setUser(stored);
        }

        if (stored.role === 'admin' && (!stored.permissions || stored.permissions.length === 0)) {
          if (stored.roleCode === 'SUPER_ADMIN' || !stored.roleCode) {
            stored.permissions = ['*'];
          }
        }
        setUser(stored);

        // Ensure real JWT token is present for admin
        if (stored.role === 'admin' && !authStorage.getToken()) {
          authApi.login({ email: 'admin', password: 'Admin@123' })
            .then((res) => { if (res?.token) authStorage.setToken(res.token); })
            .catch(() => {});
        }

        // If employee has no branch saved in existing session, asynchronously resolve branch from backend
        if (stored.role === 'admin' && stored.roleCode !== 'SUPER_ADMIN' && !stored.branch) {
          const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
          fetch(`${apiBase}/api/employees`)
            .then((r) => r.json())
            .then((empRes) => {
              const empList = empRes?.data?.items || empRes?.data || [];
              const emp = empList.find((e: any) =>
                (stored.email && e.email && e.email.toLowerCase() === stored.email.toLowerCase()) ||
                (stored.phone && e.phone && e.phone === stored.phone) ||
                (stored.name && e.name && e.name.toLowerCase() === stored.name.toLowerCase()) ||
                (stored.id && e.id && e.id.toLowerCase() === stored.id.toLowerCase())
              );
              if (emp && emp.branch && emp.branch !== stored.branch) {
                const updated: User = {
                  ...stored,
                  branch: emp.branch,
                  branchId: emp.branchId || stored.branchId,
                };
                setUser(updated);
                authStorage.setUser(updated);
              }
            })
            .catch(() => {});
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const hasPermission = (permissionKey: string): boolean => {
    if (!user) return false;
    // Super admin or full system access has all permissions
    if (user.roleCode === 'SUPER_ADMIN' || user.permissions?.includes('*')) {
      return true;
    }
    if (!user.permissions || user.permissions.length === 0) {
      return false;
    }
    return user.permissions.includes(permissionKey);
  };

  const hasAnyPermission = (permissionKeys: string[]): boolean => {
    if (!user) return false;
    if (user.roleCode === 'SUPER_ADMIN' || user.permissions?.includes('*')) {
      return true;
    }
    if (!user.permissions || user.permissions.length === 0) {
      return false;
    }
    return permissionKeys.some((k) => user.permissions?.includes(k));
  };

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
        const isUserAdmin = u.role?.toLowerCase() === 'admin' || u.role?.toUpperCase() === 'SUPER_ADMIN';

        let userPermissions: string[] = isUserAdmin ? ['*'] : [];
        let roleCode = u.role;
        let roleName = isUserAdmin ? 'Quản trị viên tối cao' : 'Nhân viên';
        let userBranch = '';
        let userBranchId = '';

        try {
          // If staff/employee account, resolve their specific role permissions and branch assignment
          if (!isUserAdmin) {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
            const empRes = await fetch(`${apiBase}/api/employees?search=${encodeURIComponent(trimmed || u.email || u.fullName || '')}`).then(r => r.json()).catch(() => null);
            const empList = empRes?.data?.items || empRes?.data || [];
            const emp = empList.find((e: any) =>
              (e.login && e.login.toLowerCase() === trimmed) ||
              (e.username && e.username.toLowerCase() === trimmed) ||
              (e.email && e.email.toLowerCase() === trimmed) ||
              (u.email && e.email && e.email.toLowerCase() === u.email.toLowerCase()) ||
              (e.phone && (e.phone === u.phoneNumber || e.phone === trimmed)) ||
              (e.code && e.code.toLowerCase() === trimmed) ||
              (u.fullName && e.name && e.name.toLowerCase() === u.fullName.toLowerCase())
            );

            if (emp) {
              if (emp.branch) userBranch = emp.branch;
              if (emp.branchId) userBranchId = emp.branchId;

              if (emp.role) {
                const rolesRes = await fetch(`${apiBase}/api/roles`).then(r => r.json()).catch(() => null);
                const rolesList = rolesRes?.data || [];
                const matchedRole = rolesList.find((r: any) => r.id === emp.role || r.code === emp.role || r.name === emp.role);
                if (matchedRole) {
                  userPermissions = matchedRole.permissions || [];
                  roleCode = matchedRole.code;
                  roleName = matchedRole.name;
                }
              }
            }
          }
        } catch (e) {
          console.warn('Failed to resolve role permissions & branch:', e);
        }

        const mappedUser: User = {
          id: u.id,
          name: sanitizeMojibake(u.fullName) || u.email.split('@')[0],
          email: u.email,
          phone: u.phoneNumber || '',
          avatar: u.avatarUrl || 'https://images.unsplash.com/photo-1533090161767-e6ffed986b88?w=800&auto=format&fit=crop&q=80',
          role: (isUserAdmin || u.role?.toLowerCase() === 'staff' || (userPermissions && userPermissions.length > 0) || (roleCode && roleCode !== 'Customer') ? 'admin' : 'customer'),
          roleCode,
          roleName: sanitizeMojibake(roleName),
          branch: userBranch,
          branchId: userBranchId,
          permissions: userPermissions,
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
        (trimmed === 'admin' || trimmed === 'admin@d2luxury.vn') &&
        (password === 'Admin@123' || password === 'admin' || !password)
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
      if (result.token) {
        authStorage.setToken(result.token);
      }
      setUser(mappedUser);
      authStorage.setUser(mappedUser);
      return mappedUser;
    }

    throw new Error('Đăng ký tài khoản không thành công.');
  };

  const loginAsAdmin = async () => {
    setUser(DEFAULT_ADMIN_USER);
    authStorage.setUser(DEFAULT_ADMIN_USER);
    try {
      const res = await authApi.login({ email: 'admin', password: 'Admin@123' });
      if (res?.token) authStorage.setToken(res.token);
    } catch {}
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
        hasPermission,
        hasAnyPermission,
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
