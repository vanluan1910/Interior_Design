'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HomeSpace } from '@/api/homeApi';

interface LivingSpacesProps {
  onSelectCategory: (cat: string) => void;
  spaces?: HomeSpace[];
}

const DEFAULT_SPACES: HomeSpace[] = [
  {
    key: 'living',
    name: 'Phòng Khách Tĩnh Tại',
    tagline: 'Không gian chính • Trung tâm sum họp',
    description: 'Sofa mộc bọc nỉ lanh tự nhiên, bàn trà điêu khắc hữu cơ, hệ kệ TV tinh gọn tôn vinh sự mộc mạc và an yên.',
    imageUrl: '/uploads/36b2215d-edd6-4316-ad67-da469a07bf12.jpg',
    countText: 'Xem 206 thiết kế',
    codeLabel: '01 / PHÒNG KHÁCH',
    colSpan: 1,
    linkUrl: '/products?space=living',
  },
  {
    key: 'dining',
    name: 'Phòng Ăn Sum Vầy',
    tagline: 'Bữa cơm ấm cúng • Gắn kết gia đình',
    description: 'Bàn ăn mở rộng thông minh từ gỗ tự nhiên, ghế tựa công thái học ôm sát sống lưng cho phút giây quây quần trọn vẹn.',
    imageUrl: '/uploads/d8bd58cb-0550-492f-a78f-4d96caf1a9bb.jpg',
    countText: 'Xem 117 thiết kế',
    codeLabel: '02 / PHÒNG ĂN',
    colSpan: 1,
    linkUrl: '/products?space=dining',
  },
  {
    key: 'office',
    name: 'Phòng Làm Việc Tĩnh Tại',
    tagline: 'Tập trung & Sáng tạo vô tận',
    description: 'Bàn làm việc cạnh cong bo mềm mại, giá sách modul tuỳ biến theo kích thước công trình, mang cảm hứng làm việc mỗi ngày.',
    imageUrl: '/uploads/68d0d710-7e08-4cf6-89e4-e66e5d156192.png',
    countText: 'Xem 31 thiết kế',
    codeLabel: '03 / PHÒNG LÀM VIỆC',
    colSpan: 1,
    linkUrl: '/products?space=office',
  },
  {
    key: 'bedroom',
    name: 'Phòng Ngủ Vỗ Về',
    tagline: 'Giấc ngủ an lành • Tái tạo năng lượng',
    description: 'Giường phản thấp giấu chân, tủ áo lam gỗ thanh mảnh và tab đầu giường nguyên khối ru trọn giấc nồng bình yên.',
    imageUrl: '/uploads/58a80c3d-39cb-4479-aa6f-0855971658b8.jpg',
    countText: 'Xem 117 thiết kế',
    codeLabel: '04 / PHÒNG NGỦ',
    colSpan: 1,
    linkUrl: '/products?space=bedroom',
  },
];

export default function LivingSpaces({ onSelectCategory, spaces }: LivingSpacesProps) {
  // Desktop active hovered index (default to 0: Living Room)
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const rawSpaces = spaces && spaces.length > 0 ? spaces : DEFAULT_SPACES;
  const displaySpaces = rawSpaces
    .filter((s) => s.key !== 'san-pham-khac' && s.key !== 'other' && s.key !== 'KG06')
    .slice(0, 4);

  return (
    <section
      id="living-spaces"
      className="w-full py-7 md:py-9 bg-[#fff8f5] overflow-hidden border-b border-[#ebdcd2]"
    >
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6 md:mb-7">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-none bg-[#f4ebe3] text-[#5d371f] text-xs uppercase tracking-widest font-semibold mb-2">
              <span className="w-1.5 h-1.5 rounded-none bg-[#5d371f]" />
              <span>Bộ Sưu Tập Theo Phòng • Nghệ Thuật Không Gian</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#1f1b19] font-normal tracking-tight">
              Không Gian Trải Nghiệm
            </h2>
          </div>
          
          {/* Nav Indicators */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            {displaySpaces.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`h-2 rounded-none transition-all duration-300 cursor-pointer ${
                  activeIndex === idx ? 'w-8 bg-[#5d371f]' : 'w-2 bg-[#d5c3ba] hover:bg-[#a89083]'
                }`}
                aria-label={`Chuyển đến không gian ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* DESKTOP: BỐ CỤC HÀNG NGANG TƯƠNG TÁC DÃN NỞ (EXPANDABLE HORIZONTAL ACCORDION) */}
        <div className="hidden md:flex flex-row gap-4 h-[520px] lg:h-[560px] w-full">
          {displaySpaces.map((item, idx) => {
            const isActive = activeIndex === idx;

            return (
              <motion.div
                key={item.id ? `space-${item.id}-${idx}` : `space-${item.key || 'item'}-${idx}`}
                onMouseEnter={() => setActiveIndex(idx)}
                layout
                transition={{
                  layout: { duration: 0.55, ease: [0.25, 1, 0.5, 1] },
                }}
                className={`relative rounded-none overflow-hidden cursor-pointer shadow-sm hover:shadow-2xl transition-shadow duration-500 will-change-transform ${
                  isActive ? 'flex-[2.6]' : 'flex-1'
                }`}
              >
                {/* Background Image with Parallax Zoom */}
                <motion.div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 ease-out"
                  style={{
                    backgroundImage: `url('${item.imageUrl}')`,
                    transform: isActive ? 'scale(1.06)' : 'scale(1)',
                  }}
                />

                {/* Gradient Overlays: Subtle when inactive, deeper when active */}
                <div
                  className={`absolute inset-0 transition-opacity duration-500 ${
                    isActive
                      ? 'bg-gradient-to-t from-[#1f1b19]/95 via-[#1f1b19]/45 to-black/20'
                      : 'bg-gradient-to-t from-[#1f1b19]/90 via-[#1f1b19]/30 to-black/30 hover:from-[#1f1b19]/95'
                  }`}
                />

                {/* Top Code Badge (e.g., 01 / PHÒNG KHÁCH) */}
                <div className="absolute top-6 left-6 right-6 flex items-center justify-between text-white/90 z-10">
                  <span className="font-mono text-xs tracking-wider px-3 py-1 rounded-none bg-black/40 backdrop-blur-md border border-white/15">
                    {item.codeLabel || `0${idx + 1}`}
                  </span>
                  {isActive && (
                    <span className="hidden lg:inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#c5a880] bg-black/50 backdrop-blur-md px-3 py-1 rounded-none border border-[#c5a880]/30 animate-fade-in">
                      <span className="w-1.5 h-1.5 rounded-none bg-[#c5a880] animate-pulse" />
                      <span>Đang xem</span>
                    </span>
                  )}
                </div>

                {/* Content Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8 flex flex-col justify-end text-white z-10">
                  
                  {/* Tagline */}
                  <span className="text-[11px] uppercase tracking-widest text-[#ffdbc8] font-semibold mb-1">
                    {item.tagline}
                  </span>

                  {/* Room Name */}
                  <h3 className={`font-serif text-white font-normal transition-all duration-300 ${
                    isActive ? 'text-2xl lg:text-3xl' : 'text-xl lg:text-2xl line-clamp-1'
                  }`}>
                    {item.name}
                  </h3>

                  {/* Expanded Description & CTA (Reveals on Hover / Active) */}
                  <AnimatePresence>
                    {isActive ? (
                      <motion.div
                        initial={{ opacity: 0, height: 0, y: 15 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: 15 }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                        className="overflow-hidden"
                      >
                        <p className="text-xs sm:text-sm text-white/80 leading-relaxed mt-2.5 max-w-lg line-clamp-2">
                          {item.description}
                        </p>

                        <div className="flex items-center gap-3.5 mt-5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectCategory(item.key);
                            }}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-none bg-[#5d371f] hover:bg-[#724528] text-white text-xs font-semibold shadow-lg hover:shadow-xl transition-all cursor-pointer group"
                          >
                            <span>{item.countText || 'Khám phá ngay'}</span>
                            <span className="material-symbols-outlined text-[16px] transition-transform group-hover:translate-x-1">
                              arrow_forward
                            </span>
                          </button>

                          <span className="text-xs text-white/60 font-mono">
                            D2 Luxury Bespoke
                          </span>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-3 flex items-center gap-1 text-xs text-white/70 font-medium"
                      >
                        <span>Chạm để mở rộng</span>
                        <span className="material-symbols-outlined text-[15px]">expand_content</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>
              </motion.div>
            );
          })}
        </div>

        {/* MOBILE & TABLET: HORIZONTAL SMOOTH SWIPE CAROUSEL */}
        <div className="flex md:hidden overflow-x-auto snap-x snap-mandatory gap-4 pb-6 pt-2 -mx-4 px-4 no-scrollbar">
          {displaySpaces.map((item, idx) => (
            <div
              key={`mob-${item.key}-${idx}`}
              onClick={() => onSelectCategory(item.key)}
              className="min-w-[85%] sm:min-w-[55%] h-[420px] relative rounded-none overflow-hidden snap-center shadow-md shrink-0 cursor-pointer"
            >
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url('${item.imageUrl}')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1f1b19]/95 via-[#1f1b19]/40 to-transparent" />

              <div className="absolute top-4 left-4 z-10">
                <span className="font-mono text-[11px] px-2.5 py-1 rounded-none bg-black/40 backdrop-blur-md text-white border border-white/20">
                  {item.codeLabel || `0${idx + 1}`}
                </span>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-5 text-white z-10 flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-[#ffdbc8] font-semibold mb-0.5">
                  {item.tagline}
                </span>
                <h3 className="font-serif text-xl font-medium text-white">
                  {item.name}
                </h3>
                <p className="text-xs text-white/80 line-clamp-2 mt-1.5 leading-relaxed">
                  {item.description}
                </p>
                <div className="mt-4">
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-none bg-[#5d371f] text-white text-xs font-semibold shadow-sm">
                    <span>{item.countText}</span>
                    <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
