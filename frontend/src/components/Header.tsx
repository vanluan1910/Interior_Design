'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface HeaderProps {
  cartCount: number;
  wishlistCount?: number;
  onOpenCart?: () => void;
  onOpenBooking: () => void;
  onOpenWishlist?: () => void;
}

function HeaderContent({
  cartCount,
  onOpenCart,
  onOpenBooking,
}: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const spaceParam = searchParams.get('space');

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Determine active navigation item
  const isHomeActive = pathname === '/' && !spaceParam;
  const isLivingActive =
    (pathname === '/san-pham' && spaceParam === 'living') || pathname === '/phong-khach';
  const isDiningActive =
    (pathname === '/san-pham' && spaceParam === 'dining') || pathname === '/phong-an';
  const isBedroomActive =
    (pathname === '/san-pham' && spaceParam === 'bedroom') || pathname === '/phong-ngu';
  const isOfficeActive =
    (pathname === '/san-pham' && spaceParam === 'office') || pathname === '/phong-lam-viec';
  const isCollectionActive =
    ((pathname === '/san-pham' || pathname === '/danh-muc') && (!spaceParam || spaceParam === 'all')) ||
    pathname.startsWith('/bo-suu-tap');

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`/san-pham?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const executeSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/san-pham?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navItems = [
    {
      title: 'Trang chủ',
      href: '/',
      isActive: isHomeActive,
    },
    {
      title: 'Phòng khách',
      href: '/san-pham?space=living',
      isActive: isLivingActive,
      submenu: [
        { label: 'Bàn trà – Bàn nước', href: '/san-pham?space=living&category=table' },
        { label: 'Kệ tivi', href: '/san-pham?space=living&category=cabinet' },
        { label: 'Kệ trang trí', href: '/san-pham?space=living&category=cabinet' },
        { label: 'Sofa Gỗ Mây', href: '/san-pham?space=living&category=sofa' },
        { label: 'Tủ giày', href: '/san-pham?space=living&category=cabinet' },
        { label: 'Tủ góc', href: '/san-pham?space=living&category=cabinet' },
        { label: 'Tủ ly', href: '/san-pham?space=living&category=cabinet' },
        { label: 'Sofa Đệm Êm', href: '/san-pham?space=living&category=sofa' },
        { label: 'Ghế thư giãn & Đôn', href: '/san-pham?space=living&category=chair' },
      ],
    },
    {
      title: 'Phòng ăn',
      href: '/san-pham?space=dining',
      isActive: isDiningActive,
      submenu: [
        { label: 'Bàn ăn tự nhiên', href: '/san-pham?space=dining&category=dining' },
        { label: 'Ghế ăn cao cấp', href: '/san-pham?space=dining&category=chair' },
        { label: 'Tủ rượu & Đảo bếp', href: '/san-pham?space=dining&category=island' },
        { label: 'Tủ buffet & Kệ bát', href: '/san-pham?space=dining&category=cabinet' },
      ],
    },
    {
      title: 'Phòng ngủ',
      href: '/san-pham?space=bedroom',
      isActive: isBedroomActive,
      submenu: [
        { label: 'Giường ngủ tự nhiên', href: '/san-pham?space=bedroom&category=bed' },
        { label: 'Táp đầu giường', href: '/san-pham?space=bedroom&category=tab' },
        { label: 'Tủ quần áo', href: '/san-pham?space=bedroom&category=wardrobe' },
        { label: 'Bàn trang điểm', href: '/san-pham?space=bedroom&category=dresser' },
        { label: 'Tủ ngăn kéo', href: '/san-pham?space=bedroom&category=cabinet' },
      ],
    },
    {
      title: 'Phòng làm việc',
      href: '/san-pham?space=office',
      isActive: isOfficeActive,
      submenu: [
        { label: 'Bàn làm việc tự nhiên', href: '/san-pham?space=office&category=desk' },
        { label: 'Kệ sách & Tủ tài liệu', href: '/san-pham?space=office&category=cabinet' },
        { label: 'Ghế làm việc cao cấp', href: '/san-pham?space=office&category=chair' },
        { label: 'Tủ hồ sơ & Ngăn kéo', href: '/san-pham?space=office&category=cabinet' },
      ],
    },
    {
      title: 'Sản phẩm khác',
      href: '/san-pham',
      isActive: isCollectionActive,
      submenu: [
        { label: 'BST Gỗ Óc Chó Bắc Mỹ', href: '/san-pham?material=walnut' },
        { label: 'BST Gỗ Sồi Trắng Mỹ', href: '/san-pham?material=oak' },
        { label: 'BST Gỗ Tần Bì Bắc Âu', href: '/san-pham?material=ash' },
        { label: 'BST Khung Gỗ Bọc Da Ý', href: '/san-pham?material=leather' },
        { label: 'Tất cả sản phẩm', href: '/san-pham' },
      ],
    },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#fff8f5]/95 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-[#eae1dd]/60">
      <div className="h-20 w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14 flex items-center justify-between flex-nowrap whitespace-nowrap gap-3">
        {/* Logo Thương Hiệu */}
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3.5 group shrink-0">
          <img
            alt="Logo Nội Thất D2 LUXURY"
            className="h-11 sm:h-12 md:h-14 w-auto object-contain transition-transform group-hover:scale-105"
            src="/logo.png"
          />
          <div className="flex flex-col">
            <span className="font-headline-sm text-base sm:text-lg md:text-xl text-[#5d371f] leading-none tracking-tight font-bold">
              D2 LUXURY
            </span>
            <span className="font-label-sm text-[9px] sm:text-[10px] md:text-label-sm text-[#83746c] tracking-wider mt-0.5 font-medium">
              Nội Thất Gỗ Tự Nhiên
            </span>
          </div>
        </Link>

        {/* Thanh điều hướng chính với Dropdown Menu */}
        <nav className="hidden lg:flex items-center gap-2 xl:gap-4 2xl:gap-6 shrink-0 flex-nowrap h-20">
          {navItems.map((item) => (
            <div key={item.title} className="relative group h-20 flex items-center">
              <Link
                href={item.href}
                className={`relative flex items-center gap-0.5 h-20 font-title-md text-[13px] xl:text-[13.5px] 2xl:text-[14px] transition-all whitespace-nowrap px-1 cursor-pointer ${
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

              {/* Dropdown Menu Panel with caret pointer */}
              {item.submenu && (
                <div className="absolute top-[68px] left-1/2 -translate-x-1/2 w-56 bg-white border border-[#eae1dd] shadow-[0_12px_32px_rgba(0,0,0,0.12)] py-2.5 z-50 invisible opacity-0 translate-y-1 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
                  {/* Top arrow pointer */}
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-t border-l border-[#eae1dd] rotate-45" />

                  <div className="relative z-10 flex flex-col">
                    {item.submenu.map((sub) => (
                      <Link
                        key={sub.label}
                        href={sub.href}
                        className="px-5 py-2 text-[13px] text-[#1f1b19] font-medium hover:font-bold hover:text-[#5d371f] hover:bg-[#fbf2ee] transition-colors whitespace-nowrap block text-left"
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
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 flex-nowrap">
          {/* Search bar */}
          <div className="relative hidden md:block">
            <button
              onClick={executeSearch}
              aria-label="Tìm kiếm"
              className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#83746c] hover:text-[#5d371f] text-[18px] cursor-pointer"
            >
              search
            </button>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              className="w-36 lg:w-44 xl:w-52 pl-8 pr-3 py-1.5 rounded-none bg-[#ffffff] text-[#1f1b19] font-body-sm text-xs placeholder:text-[#83746c] focus:outline-none focus:ring-1 focus:ring-[#5d371f] border border-[#d5c3ba]/60 shadow-sm"
              placeholder="Tìm kiếm nội thất..."
              type="text"
            />
          </div>

          {/* Cart Button */}
          <Link
            href="/gio-hang"
            aria-label="Giỏ hàng"
            onClick={(e) => {
              if (onOpenCart) {
                onOpenCart();
              }
            }}
            className="p-2 rounded-none text-[#51443d] hover:text-[#5d371f] hover:bg-[#f5ece8] transition-colors relative cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[22px]">shopping_bag</span>
            <span className="absolute top-1 right-1 w-4 h-4 rounded-none bg-[#784e34] text-white font-data-mono text-[10px] flex items-center justify-center font-bold">
              {cartCount}
            </span>
          </Link>

          {/* User Profile Avatar */}
          <div className="flex items-center pl-0.5 shrink-0">
            <img
              alt="Profile"
              className="w-8 h-8 rounded-none object-cover ring-1 ring-[#d5c3ba] hover:ring-[#5d371f] transition-all cursor-pointer"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCat_S6E8qhOpd0scj-6rD4LfY-vo8Z8BklqUwqxMQ7KmIIIgjWnFYxUX5fCgoVlCAAL_D8yl8U9ygJ0mEVG7YKDvo7gJ6zFOVjaKRNG_Cg0c2N5V8m5uiyP19HNH0NrH3dQdUC9VFMfNIe6EMKef3NZFvNCfCOWMVw2Q1X0zJcbXJvCdsvo8d1fnvyZGmzP2qJA0aHtNnpovE1Pk7M0kbgrh3_ATbB9f5cnwRYJTPAtz9HlOwVQrbq"
            />
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

          {/* Phòng khách mobile */}
          <div className="flex flex-col border-b border-[#eae1dd]/40 pb-2">
            <Link
              href="/san-pham?space=living"
              onClick={() => setMobileMenuOpen(false)}
              className={`py-2 text-sm transition-colors font-bold flex items-center justify-between ${
                isLivingActive ? 'text-[#5d371f] pl-3 bg-[#f5ece8]/70 border-l-4 border-l-[#5d371f]' : 'text-[#51443d] pl-2'
              }`}
            >
              <span>Phòng khách</span>
            </Link>
            <div className="grid grid-cols-2 gap-1.5 pl-4 pt-1">
              {[
                { label: 'Bàn trà – Bàn nước', href: '/san-pham?space=living&category=table' },
                { label: 'Kệ tivi', href: '/san-pham?space=living&category=cabinet' },
                { label: 'Kệ trang trí', href: '/san-pham?space=living&category=cabinet' },
                { label: 'Sofa Gỗ Mây', href: '/san-pham?space=living&category=sofa' },
                { label: 'Tủ giày', href: '/san-pham?space=living&category=cabinet' },
                { label: 'Sofa Đệm Êm', href: '/san-pham?space=living&category=sofa' },
              ].map((sub) => (
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
          </div>

          {/* Phòng ăn mobile */}
          <div className="flex flex-col border-b border-[#eae1dd]/40 pb-2">
            <Link
              href="/san-pham?space=dining"
              onClick={() => setMobileMenuOpen(false)}
              className={`py-2 text-sm transition-colors font-bold flex items-center justify-between ${
                isDiningActive ? 'text-[#5d371f] pl-3 bg-[#f5ece8]/70 border-l-4 border-l-[#5d371f]' : 'text-[#51443d] pl-2'
              }`}
            >
              <span>Phòng ăn</span>
            </Link>
            <div className="grid grid-cols-2 gap-1.5 pl-4 pt-1">
              {[
                { label: 'Bàn ăn tự nhiên', href: '/san-pham?space=dining&category=dining' },
                { label: 'Ghế ăn cao cấp', href: '/san-pham?space=dining&category=chair' },
                { label: 'Tủ rượu & Đảo bếp', href: '/san-pham?space=dining&category=island' },
                { label: 'Tủ buffet', href: '/san-pham?space=dining&category=cabinet' },
              ].map((sub) => (
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
          </div>

          {/* Phòng ngủ mobile */}
          <div className="flex flex-col border-b border-[#eae1dd]/40 pb-2">
            <Link
              href="/san-pham?space=bedroom"
              onClick={() => setMobileMenuOpen(false)}
              className={`py-2 text-sm transition-colors font-bold flex items-center justify-between ${
                isBedroomActive ? 'text-[#5d371f] pl-3 bg-[#f5ece8]/70 border-l-4 border-l-[#5d371f]' : 'text-[#51443d] pl-2'
              }`}
            >
              <span>Phòng ngủ</span>
            </Link>
            <div className="grid grid-cols-2 gap-1.5 pl-4 pt-1">
              {[
                { label: 'Giường ngủ tự nhiên', href: '/san-pham?space=bedroom&category=bed' },
                { label: 'Táp đầu giường', href: '/san-pham?space=bedroom&category=tab' },
                { label: 'Tủ quần áo', href: '/san-pham?space=bedroom&category=wardrobe' },
                { label: 'Bàn trang điểm', href: '/san-pham?space=bedroom&category=dresser' },
              ].map((sub) => (
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
          </div>

          {/* Phòng làm việc mobile */}
          <div className="flex flex-col border-b border-[#eae1dd]/40 pb-2">
            <Link
              href="/san-pham?space=office"
              onClick={() => setMobileMenuOpen(false)}
              className={`py-2 text-sm transition-colors font-bold flex items-center justify-between ${
                isOfficeActive ? 'text-[#5d371f] pl-3 bg-[#f5ece8]/70 border-l-4 border-l-[#5d371f]' : 'text-[#51443d] pl-2'
              }`}
            >
              <span>Phòng làm việc</span>
            </Link>
            <div className="grid grid-cols-2 gap-1.5 pl-4 pt-1">
              {[
                { label: 'Bàn làm việc tự nhiên', href: '/san-pham?space=office&category=desk' },
                { label: 'Kệ sách & Tủ tài liệu', href: '/san-pham?space=office&category=cabinet' },
                { label: 'Ghế làm việc cao cấp', href: '/san-pham?space=office&category=chair' },
                { label: 'Tủ hồ sơ & Ngăn kéo', href: '/san-pham?space=office&category=cabinet' },
              ].map((sub) => (
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
          </div>

          {/* Sản phẩm khác mobile */}
          <div className="flex flex-col border-b border-[#eae1dd]/40 pb-2">
            <Link
              href="/san-pham"
              onClick={() => setMobileMenuOpen(false)}
              className={`py-2 text-sm transition-colors font-bold flex items-center justify-between ${
                isCollectionActive ? 'text-[#5d371f] pl-3 bg-[#f5ece8]/70 border-l-4 border-l-[#5d371f]' : 'text-[#51443d] pl-2'
              }`}
            >
              <span>Sản phẩm khác</span>
            </Link>
            <div className="grid grid-cols-2 gap-1.5 pl-4 pt-1">
              {[
                { label: 'Gỗ óc chó Bắc Mỹ', href: '/san-pham?material=walnut' },
                { label: 'Gỗ sồi trắng Mỹ', href: '/san-pham?material=oak' },
                { label: 'Gỗ tần bì tự nhiên', href: '/san-pham?material=ash' },
                { label: 'Khung gỗ da bò Ý', href: '/san-pham?material=leather' },
                { label: 'Tất cả sản phẩm', href: '/san-pham' },
              ].map((sub) => (
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
          </div>
        </div>
      )}
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
