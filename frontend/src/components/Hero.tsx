'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { HomeHero } from '@/api/homeApi';

interface HeroProps {
  onOpenBooking: () => void;
  hero?: HomeHero;
}

const DEFAULT_HERO_BG = '/hero-bg.jpg';

export default function Hero({ onOpenBooking, hero }: HeroProps) {
  const tagline = hero?.tagline || 'Xưởng Chế Tác Gỗ Mộc • Bộ Sưu Tập 2026';
  const title = hero?.title || 'Kiến Tạo Nghệ Thuật Sống Từ Tâm & Đôi Bàn Tay Nghệ Nhân';
  const subtitle =
    hero?.subtitle ||
    'Đồng hành cùng 2,500+ biệt thự và căn hộ cao cấp kiến tạo không gian sống đỉnh cao từ gỗ óc chó Bắc Mỹ, gõ đỏ và sồi tự nhiên.';
  const primaryCtaText = hero?.primaryCtaText || 'Khám phá bộ sưu tập';
  const primaryCtaLink = hero?.primaryCtaLink || '#featured-products';
  const secondaryCtaText = hero?.secondaryCtaText || 'Đặt lịch tư vấn KTS';

  const rawBg = hero?.backgroundImageUrl;
  const bgImage = rawBg && rawBg.trim() && rawBg !== '/hero-interior.jpg' ? rawBg : DEFAULT_HERO_BG;

  const stats = [
    { value: '15+', label: 'Năm chế tác thủ công' },
    { value: '2.500+', label: 'Dự án biệt thự & căn hộ' },
    { value: '100%', label: 'Gỗ tự nhiên chuẩn FSC' },
  ];

  return (
    <section id="hero" className="relative w-full overflow-hidden bg-[#faf3ef] border-b border-[#ebdcd2]">
      {/* BACKGROUND IMAGE & VIBRANT SHOWROOM DEPTH */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Crisp background image aligned right with subtle ambient zoom */}
        <div
          className="w-full h-full bg-cover bg-center md:bg-[center_right] transition-transform duration-1000 scale-100 hover:scale-102"
          style={{ backgroundImage: `url('${bgImage}')` }}
        />

        {/* REFINED GRADIENT: Keeps text crystal-clear on the left while preserving rich showroom contrast on the right */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#faf3ef] via-[#faf3ef]/90 via-35% md:via-48% to-transparent to-75% pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#faf3ef]/80 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* HERO CONTENT: ELEGANT EDITORIAL TYPOGRAPHY & BREATHING ROOM */}
      <div className="relative z-10 w-full max-w-[1720px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 pt-24 pb-8 sm:pt-28 sm:pb-8 md:pt-32 md:pb-10 lg:pt-36 lg:pb-10 flex flex-col justify-center min-h-auto md:min-h-[540px]">
        <div className="max-w-2xl lg:max-w-3xl flex flex-col gap-4 sm:gap-5">
          
          {/* Refined Badge */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-none bg-white/90 backdrop-blur-md shadow-xs border border-[#d5c3ba]/60"
          >
            <span className="w-1.5 h-1.5 rounded-none bg-[#5d371f]" />
            <span className="text-[11px] uppercase tracking-widest text-[#5d371f] font-semibold">
              {tagline}
            </span>
          </motion.div>

          {/* Main Title: Editorial & Luxury Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="font-sans text-3xl sm:text-4xl md:text-5xl lg:text-[52px] xl:text-[56px] text-[#1f1b19] leading-[1.14] font-bold tracking-tight"
          >
            {title}
          </motion.h1>

          {/* Subtitle: High Legibility & Balanced Tone */}
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="text-sm sm:text-base md:text-[17px] text-[#51443d] max-w-xl leading-relaxed"
          >
            {subtitle}
          </motion.p>

          {/* Animated Single CTA: Liên hệ ngay */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.36, ease: [0.16, 1, 0.3, 1] }}
            className="pt-2 flex items-center"
          >
            <div className="relative group inline-flex">
              {/* Soft luxury ambient glow behind the button */}
              <div className="absolute -inset-1 rounded-none bg-gradient-to-r from-[#5d371f]/50 via-[#c5a880]/40 to-[#5d371f]/50 blur-lg opacity-60 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <button
                type="button"
                onClick={onOpenBooking}
                className="relative inline-flex items-center justify-center gap-3 px-8 sm:px-9 py-3.5 sm:py-4 rounded-none bg-gradient-to-r from-[#5d371f] via-[#754426] to-[#5d371f] text-white font-semibold text-sm sm:text-base shadow-xl hover:shadow-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 active:translate-y-0 active:scale-98 border border-[#c5a880]/30"
              >
                {/* Continuous Shimmer Light Beam Effect */}
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform ease-out pointer-events-none" />

                {/* Pulsing Status Dot */}
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-none bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-none h-2.5 w-2.5 bg-emerald-400" />
                </span>

                {/* Text */}
                <span className="relative z-10 tracking-wide font-medium">
                  Liên hệ ngay
                </span>

                {/* Interactive Phone / Arrow Icon with micro-animation */}
                <span className="relative z-10 w-7 h-7 rounded-none bg-white/15 flex items-center justify-center transition-all duration-300 group-hover:translate-x-1 group-hover:bg-white group-hover:text-[#5d371f]">
                  <span className="material-symbols-outlined text-[17px] transition-transform duration-300 group-hover:rotate-12">
                    call
                  </span>
                </span>
              </button>
            </div>
          </motion.div>

          {/* Metrics & Trust Row (Clean Single Row) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.48, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-6 sm:gap-10 pt-5 text-[#51443d] flex-wrap border-t border-[#ecdcd2]/70 mt-2"
          >
            {stats.map((stat, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <div className="hidden sm:block w-px h-8 bg-[#e8ded7]" />}
                <div className="flex flex-col">
                  <span className="font-sans text-2xl sm:text-3xl text-[#5d371f] font-bold">
                    {stat.value}
                  </span>
                  <span className="text-xs sm:text-[13px] text-[#83746c] mt-0.5">
                    {stat.label}
                  </span>
                </div>
              </React.Fragment>
            ))}
          </motion.div>

        </div>
      </div>

      {/* ELEGANT BOTTOM TICKER RIBBON */}
      <div className="relative z-10 w-full bg-white/85 backdrop-blur-md border-t border-[#ebdcd2] py-3.5 px-4 sm:px-8">
        <div className="max-w-[1720px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-[#51443d]">
          
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[20px] text-[#5d371f] shrink-0">
              local_shipping
            </span>
            <div className="text-xs">
              <strong className="block text-[#1f1b19] font-semibold">Vận Chuyển Toàn Quốc</strong>
              <span className="text-[#83746c] text-[11px]">Lắp đặt trọn gói tại nhà</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[20px] text-[#5d371f] shrink-0">
              verified
            </span>
            <div className="text-xs">
              <strong className="block text-[#1f1b19] font-semibold">100% Gỗ Tự Nhiên</strong>
              <span className="text-[#83746c] text-[11px]">Chứng nhận canh tác FSC</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[20px] text-[#5d371f] shrink-0">
              published_with_changes
            </span>
            <div className="text-xs">
              <strong className="block text-[#1f1b19] font-semibold">Đổi Trả 30 Ngày</strong>
              <span className="text-[#83746c] text-[11px]">Trải nghiệm an tâm tuyệt đối</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[20px] text-[#5d371f] shrink-0">
              handyman
            </span>
            <div className="text-xs">
              <strong className="block text-[#1f1b19] font-semibold">Bảo Hành 24 Tháng</strong>
              <span className="text-[#83746c] text-[11px]">Bảo trì mộng gỗ trọn đời</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
