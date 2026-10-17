'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion } from 'framer-motion';

// Dynamic import with ssr: false to prevent WebGL hydration mismatches in Next.js
const Hero3DCanvas = dynamic(() => import('./Hero3DCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[450px] md:h-[550px] flex flex-col items-center justify-center bg-[#f7ebe3]/40 rounded-3xl border border-[#d5c3ba]/30">
      <div className="w-12 h-12 border-3 border-[#5d371f] border-t-transparent rounded-full animate-spin mb-4" />
      <span className="text-xs uppercase tracking-widest text-[#5d371f] font-semibold">
        Đang khởi tạo không gian 3D...
      </span>
    </div>
  ),
});

const WOOD_OPTIONS = [
  { id: 'walnut', label: 'Gỗ Óc Chó', price: 24500000, desc: 'Bắc Mỹ cao cấp' },
  { id: 'oak', label: 'Gỗ Sồi Trắng', price: 16800000, desc: 'Tự nhiên sáng màu' },
  { id: 'ash', label: 'Tần Bì Hun Khói', price: 19500000, desc: 'Phong cách Dark Mộc' },
] as const;

const CUSHION_OPTIONS = [
  { id: 'cream', label: 'Vải Kem Bouclé', color: '#f3ece2' },
  { id: 'cognac', label: 'Da Bò Cognac', color: '#884b25' },
  { id: 'olive', label: 'Nỉ Rêu Japandi', color: '#3d4838' },
] as const;

export default function Hero3DSection() {
  const [woodType, setWoodType] = useState<'walnut' | 'oak' | 'ash'>('walnut');
  const [cushionType, setCushionType] = useState<'cream' | 'cognac' | 'olive'>('cognac');
  const [displayPrice, setDisplayPrice] = useState(24500000);

  const currentWood = WOOD_OPTIONS.find((w) => w.id === woodType) || WOOD_OPTIONS[0];

  useEffect(() => {
    setDisplayPrice(currentWood.price);
  }, [currentWood]);

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(val) + ' ₫';
  };

  return (
    <section id="hero-3d" className="relative w-full overflow-hidden bg-gradient-to-b from-[#fbf2ee] via-[#fff8f5] to-[#fbf2ee] pt-28 pb-16 md:pt-32 md:pb-24 border-b border-[#d5c3ba]/40">
      {/* Decorative ambient blurred orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 w-96 h-96 bg-[#e8d5c4]/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#f3d9c7]/30 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-[1720px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* CỘT TRÁI: TIÊU ĐỀ NGHỆ NHÂN & BẢO CHỨNG GIÁ TIỀN (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md shadow-sm border border-[#d5c3ba]/60">
              <span className="w-2 h-2 rounded-full bg-[#5d371f] animate-pulse" />
              <span className="text-[11px] uppercase tracking-widest text-[#5d371f] font-semibold">
                Interactive 3D Atelier • BST 2026
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[46px] xl:text-[52px] text-[#1f1b19] leading-[1.18] font-normal tracking-tight">
              Tuyệt tác mộc thủ công trong không gian sống hiện đại.
            </h1>

            {/* Description */}
            <p className="text-sm sm:text-base text-[#51443d] leading-relaxed max-w-xl">
              Trải nghiệm xoay 360° trực tiếp trên từng thớ gỗ. Thay đổi chất liệu gỗ mộc và đệm ngồi để xem dự toán báo giá thời gian thực tức thì.
            </p>

            {/* LIVE PRICE ESTIMATION BOX */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white/95 backdrop-blur-md border border-[#d5c3ba]/60 shadow-md">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#f0e3db]">
                <span className="text-xs uppercase tracking-wider text-[#83746c] font-semibold">
                  Mẫu Ghế Nghệ Nhân: The Hans Solo
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-[#f4ebe3] text-[#5d371f] font-semibold">
                  Có sẵn tại Showroom
                </span>
              </div>

              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <span className="text-xs text-[#83746c]">Dự toán hoàn thiện:</span>
                  <div className="text-2xl sm:text-3xl font-bold text-[#5d371f]">
                    {formatPrice(displayPrice)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-[#83746c] block">Gợi ý trả góp 0%:</span>
                  <span className="text-xs font-semibold text-[#3f4332] bg-[#eef3ea] px-2 py-0.5 rounded">
                    Chỉ ~{formatPrice(Math.round(displayPrice / 12))}/tháng
                  </span>
                </div>
              </div>

              {/* CONTROLS ĐỔI VẬT LIỆU NGAY TRÊN HERO */}
              <div className="mt-4 pt-3 border-t border-[#f0e3db] flex flex-col gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#51443d] uppercase tracking-wider block mb-1.5">
                    1. Đổi Loại Gỗ Tự Nhiên:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    {WOOD_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setWoodType(opt.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-left text-xs transition-all border cursor-pointer ${
                          woodType === opt.id
                            ? 'bg-[#5d371f] text-white border-[#5d371f] shadow-sm font-semibold'
                            : 'bg-white/80 text-[#51443d] border-[#d5c3ba]/60 hover:bg-[#f7ede7]'
                        }`}
                      >
                        <span className="block truncate">{opt.label}</span>
                        <span className={`text-[10px] block opacity-80 ${woodType === opt.id ? 'text-white' : 'text-[#83746c]'}`}>
                          {opt.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#51443d] uppercase tracking-wider block mb-1.5">
                    2. Đổi Chất Liệu Đệm:
                  </label>
                  <div className="flex items-center gap-2">
                    {CUSHION_OPTIONS.map((cush) => (
                      <button
                        key={cush.id}
                        onClick={() => setCushionType(cush.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all border cursor-pointer ${
                          cushionType === cush.id
                            ? 'bg-white text-[#5d371f] border-[#5d371f] font-semibold ring-2 ring-[#5d371f]/20'
                            : 'bg-white/70 text-[#51443d] border-[#d5c3ba]/60 hover:bg-[#f7ede7]'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/20"
                          style={{ backgroundColor: cush.color }}
                        />
                        <span>{cush.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a
                href="#featured-products"
                className="inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3 rounded-xl bg-[#5d371f] text-white font-semibold text-sm hover:bg-[#784e34] shadow-md hover:shadow-lg transition-all group cursor-pointer"
              >
                <span>Xem Toàn Bộ Sản Phẩm</span>
                <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-1">
                  arrow_forward
                </span>
              </a>

              <a
                href="#budget-estimator"
                className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 rounded-xl bg-white text-[#5d371f] font-semibold text-sm hover:bg-[#f7ede7] border border-[#d5c3ba]/80 shadow-sm transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">calculate</span>
                <span>Dự Toán Ngân Sách</span>
              </a>
            </div>
          </div>

          {/* CỘT PHẢI: 3D MODEL CANVAS VIEWPORT (7 cols) */}
          <div className="lg:col-span-7 relative">
            <div className="w-full h-full rounded-3xl bg-gradient-to-br from-[#ffffff]/70 via-[#f9efe8]/80 to-[#eddcd0]/60 backdrop-blur-xl border border-white/80 shadow-[0_20px_50px_rgba(93,55,31,0.08)] p-2 sm:p-4 overflow-hidden">
              <Hero3DCanvas woodType={woodType} cushionType={cushionType} />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
