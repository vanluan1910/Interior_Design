'use client';

import React from 'react';
import Link from 'next/link';
import { HomeHero } from '@/api/homeApi';

interface HeroProps {
  onOpenBooking: () => void;
  hero?: HomeHero;
}

const DEFAULT_HERO_BG = '/hero-bg.jpg';

export default function Hero({ onOpenBooking, hero }: HeroProps) {
  const tagline = hero?.tagline || 'Xưởng Chế Tác Gỗ Mộc • Bộ Sưu Tập 2026';
  const title = hero?.title || 'Tinh hoa gỗ mộc trong không gian sống hiện đại.';
  const subtitle =
    hero?.subtitle ||
    'Tôn vinh vân gỗ độc bản và kết cấu mộng truyền thống. Từng tạo tác tại D2 LUXURY là lời đối thoại tĩnh lặng giữa thiên nhiên và lối sống tối giản đương đại.';
  const primaryCtaText = hero?.primaryCtaText || 'Khám phá bộ sưu tập';
  const primaryCtaLink = hero?.primaryCtaLink || '#featured-products';
  const secondaryCtaText = hero?.secondaryCtaText || 'Trải nghiệm Showroom';
  const secondaryCtaLink = hero?.secondaryCtaLink || '#showrooms';

  const rawBg = hero?.backgroundImageUrl;
  const bgImage = rawBg && rawBg.trim() && rawBg !== '/hero-interior.jpg' ? rawBg : DEFAULT_HERO_BG;

  const stats = hero?.stats && hero.stats.length > 0 ? hero.stats : [
    { value: '15+', label: 'Năm chế tác thủ công' },
    { value: '2.500+', label: 'Không gian hoàn thiện' },
    { value: '100%', label: 'Gỗ tự nhiên chứng nhận FSC' },
  ];

  return (
    <section id="hero" className="relative w-full overflow-hidden bg-[#fbf2ee]">
      {/* Background Image Layer with gentle soft fade */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div
          className="w-full h-full bg-cover bg-center md:bg-[center_right] transition-transform duration-1000 scale-100 hover:scale-102"
          style={{
            backgroundImage: `url('${bgImage}')`,
          }}
        />
        {/* Soft elegant gradient overlays for high legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#fff8f5]/95 via-[#fff8f5]/80 to-[#fff8f5]/20 md:to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#fff8f5] via-transparent to-[#fff8f5]/30 pointer-events-none" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 pt-32 pb-20 md:pt-44 md:pb-32 flex flex-col justify-center min-h-[880px]">
        <div className="max-w-3xl flex flex-col gap-4 animate-slide-in-left">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-none bg-white/85 backdrop-blur-md shadow-sm border border-[#d5c3ba]/50 animate-float">
            <span className="w-2 h-2 rounded-none bg-[#5d371f] animate-pulse"></span>
            <span className="font-label-sm text-[11px] uppercase tracking-widest text-[#5d371f] font-semibold">
              {tagline}
            </span>
          </div>

          {/* Main Title */}
          <h1 className="font-headline-lg text-3xl sm:text-4xl md:text-5xl lg:text-[56px] text-[#1f1b19] leading-[1.15] font-normal tracking-tight">
            {title}
          </h1>

          {/* Subtitle */}
          <p className="font-body-lg text-base sm:text-lg text-[#51443d] max-w-xl leading-relaxed">
            {subtitle}
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href={primaryCtaLink}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-none bg-[#5d371f] text-white font-title-md text-title-md hover:bg-[#784e34] shadow-md hover:shadow-lg transition-all group hover-lift cursor-pointer"
            >
              <span>{primaryCtaText}</span>
              <span className="material-symbols-outlined text-[20px] transition-transform group-hover:translate-x-1">
                arrow_forward
              </span>
            </Link>

            <Link
              href={secondaryCtaLink}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-none bg-white/90 text-[#5d371f] font-title-md text-title-md hover:bg-[#eae1dd] shadow-sm backdrop-blur border border-[#d5c3ba]/60 transition-all cursor-pointer hover-lift"
            >
              <span className="material-symbols-outlined text-[20px]">storefront</span>
              <span>{secondaryCtaText}</span>
            </Link>
          </div>

          {/* Metrics & Trust Badges */}
          <div className="flex items-center gap-6 sm:gap-8 pt-6 text-[#51443d] flex-wrap">
            {stats.map((stat, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <div className="hidden sm:block w-px h-8 bg-[#eae1dd]"></div>}
                <div className="flex flex-col">
                  <span className="font-headline-sm text-xl sm:text-2xl text-[#5d371f] font-bold">
                    {stat.value}
                  </span>
                  <span className="font-body-sm text-xs sm:text-sm text-[#83746c]">
                    {stat.label}
                  </span>
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* 2 Core Service Guarantees (Integrated into Hero) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-4 max-w-2xl">
            <div className="flex items-center gap-3 p-3 rounded-none bg-white/80 backdrop-blur-md border border-[#d5c3ba]/60 shadow-xs hover:bg-white transition-all group hover-lift">
              <div className="w-9 h-9 rounded-none bg-[#5d371f]/10 text-[#5d371f] flex items-center justify-center shrink-0 group-hover:bg-[#5d371f] group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[20px]">local_shipping</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-title-md text-xs sm:text-[13px] font-bold text-[#1f1b19] tracking-tight">
                  Miễn Phí Vận Chuyển
                </span>
                <span className="font-body-sm text-[11px] text-[#6b584d] truncate">
                  Giao lắp đặt trọn gói tận nơi nội thành
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-none bg-white/80 backdrop-blur-md border border-[#d5c3ba]/60 shadow-xs hover:bg-white transition-all group hover-lift">
              <div className="w-9 h-9 rounded-none bg-[#5d371f]/10 text-[#5d371f] flex items-center justify-center shrink-0 group-hover:bg-[#5d371f] group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[20px]">published_with_changes</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-title-md text-xs sm:text-[13px] font-bold text-[#1f1b19] tracking-tight">
                  Đổi Trả Trong 30 Ngày
                </span>
                <span className="font-body-sm text-[11px] text-[#6b584d] truncate">
                  Trải nghiệm an tâm tuyệt đối tại công trình
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
