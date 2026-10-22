'use client';

import React from 'react';
import Link from 'next/link';
import { useCompanyInfo } from '@/hooks/useCompanyInfo';

export default function Footer() {
  const { company, rawPhone, displayPhone, warehouseAddress, zaloUrl } = useCompanyInfo();

  return (
    <footer className="w-full bg-[#fbf2ee] text-[#1f1b19] pt-8 pb-8 border-t border-[#eae1dd]">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-8 pb-12 border-b border-[#eae1dd] items-start">
          {/* Cột 1: Thương hiệu & Liên hệ */}
          <div className="lg:col-span-3 flex flex-col gap-3.5">
            <div className="flex items-center gap-3.5">
              <img
                alt="D2 Luxury Design Logo"
                className="h-12 w-auto object-contain"
                src="/logo.png"
              />
              <div className="flex flex-col">
                <span className="font-headline-sm text-lg text-[#5d371f] tracking-tight font-bold" suppressHydrationWarning>
                  {company.brandName || 'D2 LUXURY'}
                </span>
                <span className="font-label-sm text-[10px] text-[#83746c] tracking-widest uppercase" suppressHydrationWarning>
                  {company.businessSector || 'Nội Thất Gỗ Tự Nhiên'}
                </span>
              </div>
            </div>

            <p className="font-body-sm text-xs sm:text-sm text-[#51443d] leading-relaxed">
              Kiến tạo không gian sống thượng lưu từ tinh hoa gỗ tự nhiên nguyên bản. Chế tác thủ công bởi nghệ nhân giàu tâm huyết.
            </p>

            <div className="flex flex-col gap-1.5 text-xs text-[#51443d] pt-1 border-t border-[#ebdcd2]">
              <div className="flex items-center gap-2">
                <span className="text-[#83746c] shrink-0">Tư vấn KTS:</span>
                <a href={`tel:${rawPhone}`} className="hover:text-[#5d371f] transition-colors font-bold text-[#5d371f]" suppressHydrationWarning>
                  {displayPhone}
                </a>
              </div>
            </div>
          </div>

          {/* Cột 2: Không gian trải nghiệm */}
          <div className="lg:col-span-3 flex flex-col gap-3.5">
            <h3 className="font-title-md text-sm text-[#5d371f] font-semibold uppercase tracking-wider">
              Không gian trải nghiệm
            </h3>
            <div className="flex flex-col gap-1 text-xs sm:text-sm text-[#51443d]">
              <p className="font-title-md text-xs text-[#1f1b19] font-bold">Trụ sở &amp; Showroom trải nghiệm:</p>
              <p className="text-xs" suppressHydrationWarning>{company.headquarters || 'Ngã 4 Cửa Cạn, đặc khu Phú Quốc, tỉnh An Giang'}</p>
              <p className="text-[#83746c] font-data-mono text-xs">
                Hotline &amp; Zalo:{' '}
                <a href={zaloUrl} target="_blank" rel="noopener noreferrer" className="text-[#5d371f] font-bold hover:underline" suppressHydrationWarning>
                  {displayPhone}
                </a>{' '}
                (8:30 - 21:00)
              </p>
            </div>
            <div className="flex flex-col gap-1 text-xs sm:text-sm text-[#51443d] pt-2 border-t border-[#ebdcd2]">
              <p className="font-title-md text-xs text-[#1f1b19] font-bold">Nhà máy &amp; Xưởng chế tác:</p>
              <p className="text-xs" suppressHydrationWarning>{warehouseAddress || '08 - Ngõ Như Ý - Huyện Thạch Thất - Tp Hà Nội'}</p>
              <p className="text-[#83746c] text-xs">Nhận may đo &amp; lên bản vẽ 3D theo yêu cầu</p>
            </div>
          </div>

          {/* Cột 3: Chính sách hỗ trợ */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            <h3 className="font-title-md text-sm text-[#5d371f] font-semibold uppercase tracking-wider">
              Chính sách hỗ trợ
            </h3>
            <ul className="flex flex-col gap-2 font-body-sm text-xs sm:text-sm text-[#51443d]">
              <li>
                <a href="#" className="hover:text-[#5d371f] transition-colors inline-block">
                  Chính sách bảo hành gỗ
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#5d371f] transition-colors inline-block">
                  Vận chuyển &amp; Lắp đặt
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#5d371f] transition-colors inline-block">
                  Chính sách đổi trả
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#5d371f] transition-colors inline-block">
                  Bảo mật thông tin
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#5d371f] transition-colors inline-block">
                  Quy trình may đo 3D
                </a>
              </li>
            </ul>
          </div>

          {/* Cột 4: Fanpage Facebook */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            <h3 className="font-title-md text-sm text-[#5d371f] font-semibold uppercase tracking-wider">
              Fanpage Facebook
            </h3>
            <a
              href="https://www.facebook.com/profile.php?id=61575009790250&mibextid=wwXIfr"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Fanpage Facebook Nội Thất D2 Luxury Design"
              title="Ghé thăm Fanpage Facebook Nội Thất D2 Luxury Design"
              className="group block overflow-hidden rounded-none border border-[#d5c3ba] bg-white shadow-sm hover:shadow-md hover:border-[#5d371f] transition-all duration-300 cursor-pointer"
            >
              <div className="relative overflow-hidden">
                <img
                  src="/facebook-banner.png"
                  alt="Fanpage Nội Thất D2 Luxury Design"
                  className="w-full h-auto object-cover block group-hover:scale-[1.02] transition-transform duration-500 ease-out"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 pointer-events-none" />
              </div>
            </a>
            <p className="text-[11px] text-[#83746c] italic">
              * Nhấn vào ảnh để cập nhật hình ảnh công trình thực tế &amp; video bàn giao mới nhất.
            </p>
          </div>
        </div>

        {/* Bottom Policy & Copyright */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 font-label-sm text-xs text-[#83746c]">
          <p>© 2025 Nội Thất D2 LUXURY. Bảo lưu mọi quyền.</p>
          <div className="flex flex-wrap items-center gap-6">
            <a href="#" className="hover:text-[#5d371f] transition-colors">
              Chính sách bảo hành
            </a>
            <a href="#" className="hover:text-[#5d371f] transition-colors">
              Vận chuyển &amp; Lắp đặt
            </a>
            <a href="#" className="hover:text-[#5d371f] transition-colors">
              Bảo mật thông tin
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
