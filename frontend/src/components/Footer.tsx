'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  return (
    <footer className="w-full bg-[#fbf2ee] text-[#1f1b19] pt-16 pb-8 border-t border-[#eae1dd]">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-12 border-b border-[#eae1dd]">
          {/* Brand Info */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="flex items-center gap-3.5">
              <img
                alt="D2 Luxury Design Logo"
                className="h-12 w-auto object-contain"
                src="/logo.png"
              />
              <div className="flex flex-col">
                <span className="font-headline-sm text-lg text-[#5d371f] tracking-tight font-bold">
                  D2 LUXURY
                </span>
                <span className="font-label-sm text-[10px] text-[#83746c] tracking-widest uppercase">
                  Nội Thất Gỗ Tự Nhiên
                </span>
              </div>
            </div>
            <p className="font-body-sm text-xs sm:text-sm text-[#51443d] leading-relaxed">
              Giao hưởng giữa triết lý tối giản Wabi-Sabi Nhật Bản và công năng tinh tế Scandinavian. Từng thớ gỗ tự nhiên được chế tác bởi nghệ nhân giàu tâm huyết, gìn giữ vẻ đẹp nguyên bản của không gian sống.
            </p>
            <div className="flex items-center gap-2 pt-1 text-[#5d371f]">
              <span className="material-symbols-outlined text-[20px]">verified</span>
              <span className="font-label-sm text-xs text-[#51443d]">
                Chứng chỉ FSC 100% Gỗ rừng trồng bền vững
              </span>
            </div>
          </div>

          {/* Collections */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            <h3 className="font-title-md text-sm text-[#5d371f] font-semibold uppercase tracking-wider">
              Bộ sưu tập
            </h3>
            <ul className="flex flex-col gap-2 font-body-sm text-xs sm:text-sm text-[#51443d]">
              <li>
                <Link href="#living-spaces" className="hover:text-[#5d371f] transition-colors">
                  Phòng khách
                </Link>
              </li>
              <li>
                <Link href="#living-spaces" className="hover:text-[#5d371f] transition-colors">
                  Phòng ngủ
                </Link>
              </li>
              <li>
                <Link href="#living-spaces" className="hover:text-[#5d371f] transition-colors">
                  Phòng ăn
                </Link>
              </li>
              <li>
                <Link href="#featured-products" className="hover:text-[#5d371f] transition-colors">
                  Bộ sưu tập Kyoto
                </Link>
              </li>
              <li>
                <Link href="#featured-products" className="hover:text-[#5d371f] transition-colors">
                  Bộ sưu tập Nordic Calm
                </Link>
              </li>
            </ul>
          </div>

          {/* Experience Spaces */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            <h3 className="font-title-md text-sm text-[#5d371f] font-semibold uppercase tracking-wider">
              Không gian trải nghiệm
            </h3>
            <div className="flex flex-col gap-2 font-body-sm text-xs sm:text-sm text-[#51443d]">
              <p className="font-title-md text-xs text-[#1f1b19] font-bold">Showroom Hà Nội:</p>
              <p>48 Phố Tràng Tiền, Quận Hoàn Kiếm, Hà Nội</p>
              <p className="font-title-md text-xs text-[#1f1b19] font-bold pt-2">
                Showroom TP. Hồ Chí Minh:
              </p>
              <p>126 Nguyễn Thị Minh Khai, Phường Võ Thị Sáu, Quận 3</p>
              <p className="pt-2 text-[#83746c] font-data-mono text-xs">
                Hotline: 1900 8922 (8:30 - 21:00)
              </p>
            </div>
          </div>

          {/* Privileges & Newsletter */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            <h3 className="font-title-md text-sm text-[#5d371f] font-semibold uppercase tracking-wider">
              Đặc quyền D2 LUXURY
            </h3>
            <ul className="flex flex-col gap-1.5 font-body-sm text-xs sm:text-sm text-[#51443d] mb-2">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5d371f]"></span>
                <span>Bảo hành cấu trúc gỗ 5 năm tận tâm</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5d371f]"></span>
                <span>Vận chuyển &amp; lắp đặt chuyên nghiệp toàn quốc</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5d371f]"></span>
                <span>Bảo dưỡng định kỳ tinh dầu gỗ hàng năm</span>
              </li>
            </ul>

            <div className="flex flex-col gap-1.5 pt-2">
              <span className="font-label-md text-xs text-[#1f1b19] font-semibold">
                Bản tin không gian sống
              </span>
              <p className="font-body-sm text-xs text-[#83746c]">
                Nhận ấn phẩm phong cách &amp; ưu đãi giới hạn 10%.
              </p>
              <form onSubmit={handleSubscribe} className="flex gap-1.5 mt-1">
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-none bg-white font-body-sm text-xs text-[#1f1b19] placeholder:text-[#83746c] border border-[#d5c3ba]/60 focus:outline-none focus:ring-1 focus:ring-[#5d371f]"
                  placeholder="Email của quý khách..."
                  type="email"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-none bg-[#5d371f] text-white font-label-md text-xs hover:bg-[#784e34] transition-colors shrink-0 shadow-sm cursor-pointer"
                >
                  Đăng ký
                </button>
              </form>
              {subscribed && (
                <span className="text-xs text-emerald-700 font-medium animate-in fade-in">
                  ✓ Cảm ơn Quý khách đã đăng ký thành công!
                </span>
              )}
            </div>
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
