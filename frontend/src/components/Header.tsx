'use client';

import React, { useState, useRef, useEffect, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { App, Modal } from 'antd';
import { useAuth } from '@/context/AuthContext';
import ProfileModal from '@/components/ProfileModal';
import { spaceApi } from '@/api/spaceApi';
import { categoryApi } from '@/api/categoryApi';
import { settingsApi } from '@/api/settingsApi';
import { AdminSpace, AdminCategory } from '@/types/admin';

export interface HeaderNavItem {
  title: string;
  href: string;
  isActive: boolean;
  submenu?: { label: string; href: string }[];
}

export interface HeaderProps {
  cartCount?: number;
  wishlistCount?: number;
  onOpenCart?: () => void;
  onOpenBooking?: () => void;
  onOpenWishlist?: () => void;
}

// Global in-memory cache to prevent repetitive roundtrips during page navigation
let cachedHeaderSpaces: AdminSpace[] | null = null;
let cachedHeaderCategories: AdminCategory[] | null = null;
let lastHeaderFetchTime = 0;
const CACHE_DURATION_MS = 60 * 1000; // 60 seconds

function HeaderContent({
  cartCount = 0,
  onOpenCart,
  onOpenBooking,
}: HeaderProps) {
  const { message } = App.useApp();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const spaceParam = searchParams.get('space');
  const { user, isLoggedIn, isAdmin, logout, loginAsAdmin, loginAsCustomer } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [spaces, setSpaces] = useState<AdminSpace[]>(() => cachedHeaderSpaces || []);
  const [categories, setCategories] = useState<AdminCategory[]>(() => cachedHeaderCategories || []);
  const [storeInfo, setStoreInfo] = useState<{ logoUrl?: string | null; brandName?: string; companyName?: string }>({
    logoUrl: '/logo.png',
    brandName: 'D2 LUXURY',
    companyName: 'Nội Thất Gỗ Tự Nhiên',
  });
  const profileRef = useRef<HTMLDivElement>(null);

  // Clear legacy customer-branch overrides on customer storefront
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('d2_customer_branch');
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    const loadCompany = async () => {
      try {
        const info: any = await settingsApi.getCompanyInfo();
        if (info) {
          setStoreInfo({
            logoUrl: info.logoUrl || info.LogoUrl || '/logo.png',
            brandName: info.brandName || info.BrandName || info.companyName || info.CompanyName || 'D2 LUXURY',
            companyName: info.businessSector || info.BusinessSector || 'Nội Thất Gỗ Tự Nhiên',
          });
        }
      } catch {
        // fallback
      }
    };
    loadCompany();

    const handleSettingsUpdated = (e: any) => {
      const detail = e.detail;
      if (detail) {
        setStoreInfo({
          logoUrl: detail.logoUrl || detail.LogoUrl || '/logo.png',
          brandName: detail.brandName || detail.BrandName || detail.companyName || detail.CompanyName || 'D2 LUXURY',
          companyName: detail.businessSector || detail.BusinessSector || 'Nội Thất Gỗ Tự Nhiên',
        });
      } else {
        loadCompany();
      }
    };

    window.addEventListener('store_settings_updated', handleSettingsUpdated);
    return () => window.removeEventListener('store_settings_updated', handleSettingsUpdated);
  }, []);

  // Fetch dynamic spaces and categories from backend API with memory cache
  useEffect(() => {
    let isMounted = true;
    const now = Date.now();

    const fetchMenuData = async (force = false) => {
      try {
        const [spacesData, categoriesData] = await Promise.all([
          spaceApi.getSpaces({ status: 'active', forceRefresh: force }).catch(() => []),
          categoryApi.getCategories({ status: 'active', forceRefresh: force }).catch(() => []),
        ]);
        if (isMounted) {
          if (Array.isArray(spacesData)) {
            const filtered = spacesData.filter((s) => s.status !== 'hidden' && s.showOnHeader !== false);
            cachedHeaderSpaces = filtered;
            setSpaces(filtered);
          }
          if (Array.isArray(categoriesData)) {
            const filtered = categoriesData.filter((c) => c.status !== 'hidden' && c.showOnMenu !== false);
            cachedHeaderCategories = filtered;
            setCategories(filtered);
          }
          lastHeaderFetchTime = Date.now();
        }
      } catch (err) {
        console.error('Error loading header navigation:', err);
      }
    };

    if (!cachedHeaderSpaces || !cachedHeaderCategories || (now - lastHeaderFetchTime >= CACHE_DURATION_MS)) {
      fetchMenuData();
    }

    const handleMenuChanged = () => {
      cachedHeaderSpaces = null;
      cachedHeaderCategories = null;
      lastHeaderFetchTime = 0;
      fetchMenuData(true);
    };

    window.addEventListener('categories_changed', handleMenuChanged);
    window.addEventListener('spaces_changed', handleMenuChanged);

    return () => {
      isMounted = false;
      window.removeEventListener('categories_changed', handleMenuChanged);
      window.removeEventListener('spaces_changed', handleMenuChanged);
    };
  }, []);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsProfileOpen(false);
    message.success('Đã đăng xuất thành công!');
    router.push('/login');
  };

  // Determine active navigation item
  const isHomeActive = pathname === '/' && !spaceParam;

  // Dynamic spaces from Database only - no hardcoded fallbacks
  const currentSpaces = spaces.filter((s) => s.status !== 'hidden' && s.showOnHeader !== false);

  const navItems: HeaderNavItem[] = [
    {
      title: 'Trang chủ',
      href: '/',
      isActive: isHomeActive,
      submenu: undefined,
    },
    ...currentSpaces
      .slice()
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
      .map((s) => {
        const spaceParamKey = s.slug || s.code?.toLowerCase() || s.id;
        const sNameLower = (s.name || '').toLowerCase().trim();
        const sCodeLower = (s.code || '').toLowerCase().trim();
        const sSlugLower = (s.slug || '').toLowerCase().trim();
        const curSpaceLower = (spaceParam || '').toLowerCase().trim();

        const isCurrentSpaceActive =
          pathname === '/products' &&
          (curSpaceLower === spaceParamKey.toLowerCase() ||
            curSpaceLower === sSlugLower ||
            curSpaceLower === sCodeLower ||
            curSpaceLower === sNameLower);

        // Submenu categories
        const spaceCategories = categories.filter((c) => {
          if (c.spaceId && s.id && c.spaceId.toLowerCase() === s.id.toLowerCase()) return true;
          const cSpace = (c.space || '').toLowerCase().trim();
          return (
            cSpace === sNameLower ||
            cSpace === sCodeLower ||
            cSpace === sSlugLower ||
            cSpace.includes(sNameLower) ||
            sNameLower.includes(cSpace)
          );
        });

        const submenu =
          spaceCategories.length > 0
            ? spaceCategories.map((c) => ({
                label: c.name,
                href: `/products?space=${encodeURIComponent(spaceParamKey)}&category=${encodeURIComponent(c.slug || c.id)}`,
              }))
            : undefined;

        return {
          title: s.name,
          href: `/products?space=${encodeURIComponent(spaceParamKey)}`,
          isActive: isCurrentSpaceActive,
          submenu,
        };
      }),
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#fff8f5]/95 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-[#eae1dd]/60">
      <div className="h-16 sm:h-20 w-full px-3.5 sm:px-6 lg:px-8 xl:px-10 2xl:px-14 flex items-center justify-between flex-nowrap whitespace-nowrap gap-2 lg:gap-3 xl:gap-4">
        {/* Logo Thương Hiệu */}
        <Link href="/" className="flex items-center group shrink-0 py-1">
          <img
            alt={storeInfo.brandName || 'D2 LUXURY'}
            className="h-11 sm:h-16 md:h-[66px] w-auto max-h-[72px] object-contain transition-transform group-hover:scale-105"
            src={storeInfo.logoUrl || '/logo.png'}
          />
        </Link>

        {/* Thanh điều hướng chính với Dropdown Menu */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2.5 2xl:gap-5 shrink-0 flex-nowrap h-20">
          {navItems.map((item) => (
            <div key={item.title} className="relative group h-20 flex items-center">
              <Link
                href={item.href}
                className={`relative flex items-center gap-0.5 h-20 font-title-md text-xs xl:text-[13px] 2xl:text-[14px] transition-all whitespace-nowrap px-1 xl:px-1.5 2xl:px-2 cursor-pointer ${
                  item.isActive
                    ? 'text-[#5d371f] font-bold after:content-[\'\'] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-[#5d371f]'
                    : 'text-[#2e1d13] hover:text-[#5d371f] font-semibold after:content-[\'\'] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-transparent hover:after:bg-[#5d371f]/30'
                }`}
              >
                <span>{item.title}</span>
                {item.submenu && (
                  <span className="material-symbols-outlined text-[13px] transition-transform duration-200 group-hover:rotate-180 text-[#83746c] group-hover:text-[#5d371f]">
                    keyboard_arrow_down
                  </span>
                )}
              </Link>

              {/* Dropdown Menu Panel with smooth slide-in animation */}
              {item.submenu && (
                <div className="absolute top-[68px] left-1/2 -translate-x-1/2 w-60 bg-white border border-[#eae1dd] shadow-[0_16px_36px_rgba(0,0,0,0.12)] py-2.5 z-50 invisible opacity-0 -translate-y-3 pointer-events-none group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-out">
                  {/* Top arrow pointer */}
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-t border-l border-[#eae1dd] rotate-45" />

                  <div className="relative z-10 flex flex-col">
                    {item.submenu.map((sub, idx) => (
                      <Link
                        key={sub.label}
                        href={sub.href}
                        className="px-5 py-2.5 text-[13px] text-[#1f1b19] font-medium hover:font-bold hover:text-[#5d371f] hover:bg-[#fbf2ee] transition-all duration-200 whitespace-nowrap block text-left hover:translate-x-1"
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Action Controls (Strict 1 line) */}
        <div className="flex items-center gap-2 sm:gap-3 xl:gap-3.5 shrink-0 flex-nowrap">
          {/* Cart Button */}
          <Link
            href="/cart"
            aria-label="Giỏ hàng"
            onClick={(e) => {
              if (onOpenCart) {
                onOpenCart();
              }
            }}
            className="p-1.5 sm:p-2 rounded-none text-[#51443d] hover:text-[#5d371f] hover:bg-[#f5ece8] transition-colors relative cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[20px] sm:text-[22px]">shopping_bag</span>
            <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-4 h-4 rounded-none bg-[#784e34] text-white font-data-mono text-[10px] flex items-center justify-center font-bold">
              {cartCount}
            </span>
          </Link>

          {/* User Profile Avatar with Dropdown */}
          <div className="relative flex items-center pl-0.5 shrink-0" ref={profileRef}>
            {mounted && isLoggedIn && user ? (
              <button
                type="button"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="relative focus:outline-none cursor-pointer flex items-center group"
                aria-label="Tài khoản cá nhân"
              >
                <div className="w-8 h-8 rounded-none bg-gradient-to-br from-[#5d371f] to-[#382012] text-[#ffdbb5] font-sans font-bold text-xs flex items-center justify-center ring-1 ring-[#d5c3ba] group-hover:ring-[#5d371f] transition-all select-none shrink-0">
                  {user.name ? user.name.trim().charAt(0).toUpperCase() : 'G'}
                </div>
                {isAdmin && (
                  <span
                    className="absolute -top-1 -right-1 w-3 h-3 bg-[#5d371f] border border-white flex items-center justify-center text-[7px] text-[#ffdbb5] font-bold"
                    title="Quản trị viên (Admin)"
                  >
                    ★
                  </span>
                )}
              </button>
            ) : (
              <Link
                href="/login"
                className="px-2.5 py-1 text-xs font-semibold text-[#5d371f] bg-[#fbf2ee] hover:bg-[#5d371f] hover:text-white border border-[#eae1dd] transition-colors cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">account_circle</span>
                <span>Đăng nhập</span>
              </Link>
            )}

            {/* Profile Dropdown Menu */}
            {mounted && isProfileOpen && isLoggedIn && user && (
              <div className="absolute right-0 top-full mt-2.5 w-64 sm:w-72 bg-[#fff8f5] border border-[#eae1dd] shadow-xl z-50 animate-in fade-in-0 zoom-in-95 duration-150 flex flex-col">
                {/* Dropdown Header */}
                <div className="p-4 bg-[#241c18] text-white flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#5d371f] to-[#382012] text-[#ffdbb5] font-sans font-bold text-sm flex items-center justify-center ring-1 ring-[#d5c3ba] shrink-0 select-none">
                    {user.name ? user.name.trim().charAt(0).toUpperCase() : 'G'}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1 text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-[#fff8f5] truncate">
                        {user.name}
                      </span>
                      {isAdmin ? (
                        <span className="bg-[#5d371f] text-[#ffdbb5] text-[9px] font-bold px-1.5 py-0.2 border border-[#5d371f] shrink-0">
                          Admin
                        </span>
                      ) : (
                        <span className="bg-[#3f4332] text-white text-[9px] font-bold px-1.5 py-0.2 shrink-0">
                          VIP
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#d5c3ba] font-data-mono truncate mt-0.5">
                      {user.email}
                    </span>
                  </div>
                </div>

                {/* Dropdown Items */}
                <div className="py-1.5 flex flex-col text-xs text-[#1f1b19]">
                  {/* Item 1: Thông tin cá nhân */}
                  <Link
                    href="/profile"
                    onClick={() => setIsProfileOpen(false)}
                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-[#f5ece8] transition-colors text-left font-medium cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px] text-[#5d371f]">
                      person
                    </span>
                    <span className="font-medium text-[#1f1b19]">Thông tin cá nhân</span>
                  </Link>

                  {/* Item 2: Trang quản trị (If Admin) */}
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setIsProfileOpen(false)}
                      className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-[#f5ece8] transition-colors text-left font-medium cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px] text-[#5d371f]">
                        admin_panel_settings
                      </span>
                      <span className="font-medium text-[#5d371f] flex items-center gap-1.5">
                        Trang quản trị <span className="text-[9px] bg-[#5d371f] text-white px-1.5 py-0.5 rounded-none font-data-mono font-bold">ADMIN</span>
                      </span>
                    </Link>
                  )}

                  {/* Item 3: Đơn hàng & Giỏ hàng */}
                  <Link
                    href="/cart"
                    onClick={() => setIsProfileOpen(false)}
                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-[#f5ece8] transition-colors text-left font-medium cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px] text-[#5d371f]">
                      shopping_bag
                    </span>
                    <span className="font-medium text-[#1f1b19]">Giỏ hàng &amp; Đơn hàng</span>
                  </Link>

                  {/* Item 4: Đăng xuất */}
                  <div className="pt-1.5 mt-1 border-t border-[#eae1dd]">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full px-4 py-2 flex items-center gap-3 hover:bg-red-50 text-red-700 transition-colors text-left font-medium cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px] text-red-600">
                        logout
                      </span>
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mobile hamburger menu */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-none text-[#51443d] hover:bg-[#f5ece8] cursor-pointer shrink-0"
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined text-[24px]">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#fff8f5] border-b border-[#eae1dd] px-6 py-4 flex flex-col gap-3 shadow-lg max-h-[80vh] overflow-y-auto animate-in slide-in-from-top duration-200">
          {/* Trang chủ mobile */}
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`py-2 text-sm border-b border-[#eae1dd]/40 transition-colors font-bold ${
              isHomeActive
                ? 'text-[#5d371f] bg-[#f5ece8]/70 border-l-4 border-l-[#5d371f] pl-3'
                : 'text-[#51443d] hover:text-[#5d371f] pl-2'
            }`}
          >
            Trang chủ
          </Link>

          {/* Dynamic Spaces and Subcategories in Mobile Navigation */}
          {navItems
            .filter((item) => item.href !== '/')
            .map((item) => (
              <div key={item.title} className="flex flex-col border-b border-[#eae1dd]/40 pb-2">
                <Link
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-2 text-sm transition-colors font-bold flex items-center justify-between ${
                    item.isActive
                      ? 'text-[#5d371f] pl-3 bg-[#f5ece8]/70 border-l-4 border-l-[#5d371f]'
                      : 'text-[#51443d] pl-2 hover:text-[#5d371f]'
                  }`}
                >
                  <span>{item.title}</span>
                </Link>
                {item.submenu && item.submenu.length > 0 && (
                  <div className="grid grid-cols-2 gap-1.5 pl-4 pt-1">
                    {item.submenu.map((sub) => (
                      <Link
                        key={sub.label}
                        href={sub.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-xs text-[#83746c] hover:text-[#5d371f] py-1"
                      >
                        • {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

      {/* Profile Modal */}
      <ProfileModal
        open={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onGoToAdmin={() => router.push('/admin')}
      />

      {/* Quick Login Modal (When logged out) */}
      <Modal
        open={isLoginModalOpen}
        onCancel={() => setIsLoginModalOpen(false)}
        footer={null}
        width={420}
        centered
        styles={{
          body: {
            padding: '24px',
            backgroundColor: '#fff8f5',
          },
        }}
      >
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 bg-[#241c18] text-[#fff8f5] flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">lock</span>
          </div>
          <div>
            <h3 className="font-sans text-xl font-bold text-[#1f1b19]">
              Đăng Nhập Tài Khoản D2 LUXURY
            </h3>
            <p className="text-xs text-[#83746c] mt-1">
              Chọn vai trò đăng nhập để trải nghiệm hệ thống
            </p>
          </div>

          <div className="flex flex-col gap-2.5 w-full text-xs">
            <button
              type="button"
              onClick={() => {
                loginAsAdmin();
                setIsLoginModalOpen(false);
                message.success('Đã đăng nhập với tư cách Quản trị viên (Admin)!');
              }}
              className="w-full py-3 px-4 bg-[#5d371f] text-white font-bold hover:bg-[#784e34] transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <span>★ Đăng nhập Quản trị viên (Admin)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                loginAsCustomer();
                setIsLoginModalOpen(false);
                message.success('Đã đăng nhập với tư cách Khách hàng VIP!');
              }}
              className="w-full py-3 px-4 bg-white border border-[#eae1dd] text-[#1f1b19] font-bold hover:bg-[#f5ece8] transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Đăng nhập Khách hàng VIP</span>
            </button>
          </div>
        </div>
      </Modal>
    </header>
  );
}

export default function Header(props: HeaderProps) {
  return (
    <Suspense
      fallback={
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#fff8f5]/95 backdrop-blur-xl h-20 border-b border-[#eae1dd]/60" />
      }
    >
      <HeaderContent {...props} />
    </Suspense>
  );
}
