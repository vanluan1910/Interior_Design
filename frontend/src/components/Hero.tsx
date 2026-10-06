'use client';

import React from 'react';
import Link from 'next/link';

interface HeroProps {
  onOpenBooking: () => void;
}

export default function Hero({ onOpenBooking }: HeroProps) {
  return (
    <section id="hero" className="relative w-full overflow-hidden bg-[#fbf2ee]">
      {/* Background Image Layer */}
      <div className="absolute inset-0 z-0">
        <div
          className="w-full h-full bg-cover bg-center md:bg-[center_right] transition-transform duration-1000 scale-100 hover:scale-102"
          style={{
            backgroundImage: `url('/hero-bg.jpg')`,
          }}
        />
        {/* Soft elegant gradient overlays for high legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#fff8f5]/95 via-[#fff8f5]/75 to-[#fff8f5]/20 md:to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#fff8f5] via-transparent to-[#fff8f5]/30"></div>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 pt-32 pb-20 md:pt-44 md:pb-32 flex flex-col justify-center min-h-[880px]">
        <div className="max-w-3xl flex flex-col gap-4 animate-slide-in-left">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-none bg-white/85 backdrop-blur-md shadow-sm border border-[#d5c3ba]/50 animate-float">
            <span className="w-2 h-2 rounded-none bg-[#5d371f] animate-pulse"></span>
            <span className="font-label-sm text-[11px] uppercase tracking-widest text-[#5d371f] font-semibold">
              Xưởng Chế Tác Gỗ Mộc • Bộ Sưu Tập 2025
            </span>
          </div>

          {/* Main Title */}
          <h1 className="font-headline-lg text-3xl sm:text-4xl md:text-5xl lg:text-[56px] text-[#1f1b19] leading-[1.15] font-normal tracking-tight">
            Tinh hoa gỗ mộc trong không gian{' '}
            <span className="italic font-headline-lg text-[#5d371f] font-medium">
              sống hiện đại.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="font-body-lg text-base sm:text-lg text-[#51443d] max-w-xl leading-relaxed">
            Tôn vinh vân gỗ độc bản và kết cấu mộng truyền thống. Từng tạo tác tại D2 LUXURY là lời đối thoại tĩnh lặng giữa thiên nhiên và lối sống tối giản đương đại.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="#featured-products"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-none bg-[#5d371f] text-white font-title-md text-title-md hover:bg-[#784e34] shadow-md hover:shadow-lg transition-all group hover-lift cursor-pointer"
            >
              <span>Khám phá BST Thu - Đông</span>
              <span className="material-symbols-outlined text-[20px] transition-transform group-hover:translate-x-1">
                arrow_forward
              </span>
            </Link>

            <Link
              href="#showrooms"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-none bg-white/90 text-[#5d371f] font-title-md text-title-md hover:bg-[#eae1dd] shadow-sm backdrop-blur border border-[#d5c3ba]/60 transition-all cursor-pointer hover-lift"
            >
              <span className="material-symbols-outlined text-[20px]">storefront</span>
              <span>Trải nghiệm Showroom</span>
            </Link>
          </div>

          {/* Metrics & Trust Badges */}
          <div className="flex items-center gap-6 sm:gap-8 pt-8 text-[#51443d]">
            <div className="flex flex-col">
              <span className="font-headline-sm text-xl sm:text-2xl text-[#5d371f] font-bold">
                12+
              </span>
              <span className="font-body-sm text-xs sm:text-sm text-[#83746c]">
                Năm chế tác thủ công
              </span>
            </div>
            <div className="w-px h-8 bg-[#eae1dd]"></div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-xl sm:text-2xl text-[#5d371f] font-bold">
                4.200+
              </span>
              <span className="font-body-sm text-xs sm:text-sm text-[#83746c]">
                Không gian hoàn thiện
              </span>
            </div>
            <div className="w-px h-8 bg-[#eae1dd]"></div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-xl sm:text-2xl text-[#5d371f] font-bold">
                100%
              </span>
              <span className="font-body-sm text-xs sm:text-sm text-[#83746c]">
                Gỗ tự nhiên chứng nhận FSC
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
