'use client';

import React, { useEffect, useRef, useState } from 'react';
import { HomeSpace } from '@/api/homeApi';

interface LivingSpacesProps {
  onSelectCategory: (cat: string) => void;
  spaces?: HomeSpace[];
}

const DEFAULT_SPACES: HomeSpace[] = [
  {
    key: 'living',
    name: 'Phòng Khách Tĩnh Tại',
    tagline: 'Không gian chính',
    description: 'Sofa mộc bọc nỉ lanh tự nhiên, bàn trà điêu khắc hữu cơ, hệ kệ TV tinh gọn tôn vinh sự mộc mạc.',
    imageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&auto=format&fit=crop&q=80',
    countText: 'Xem 38 thiết kế',
    codeLabel: '01 / PHÒNG KHÁCH',
    colSpan: 7,
    linkUrl: '/products?space=living',
  },
  {
    key: 'dining',
    name: 'Phòng Ăn Sum Vầy',
    tagline: 'Bữa cơm ấm cúng',
    description: 'Bàn ăn mở rộng thông minh, ghế tựa công thái học ôm sát sống lưng.',
    imageUrl: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&auto=format&fit=crop&q=80',
    countText: 'Xem 19 thiết kế',
    codeLabel: '02 / PHÒNG ĂN',
    colSpan: 5,
    linkUrl: '/products?space=dining',
  },
  {
    key: 'office',
    name: 'Phòng Làm Việc Tĩnh Tại',
    tagline: 'Tập trung & sáng tạo',
    description: 'Bàn làm việc cạnh cong bo mềm, giá sách modul tuỳ biến theo kích thước căn hộ.',
    imageUrl: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&auto=format&fit=crop&q=80',
    countText: 'Xem 15 thiết kế',
    codeLabel: '03 / PHÒNG LÀM VIỆC',
    colSpan: 5,
    linkUrl: '/products?space=office',
  },
  {
    key: 'bedroom',
    name: 'Phòng Ngủ Vỗ Về',
    tagline: 'Giấc ngủ thư thái',
    description: 'Giường phản thấp giấu chân, tủ áo lam gỗ thanh mảnh và tab đầu giường nguyên khối.',
    imageUrl: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800&auto=format&fit=crop&q=80',
    countText: 'Xem 24 thiết kế',
    codeLabel: '04 / PHÒNG NGỦ',
    colSpan: 7,
    linkUrl: '/products?space=bedroom',
  },
];

export default function LivingSpaces({ onSelectCategory, spaces }: LivingSpacesProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const rawSpaces = spaces && spaces.length > 0 ? spaces : DEFAULT_SPACES;
  const displaySpaces = rawSpaces
    .filter((s) => s.key !== 'san-pham-khac' && s.key !== 'other' && s.key !== 'KG06')
    .slice(0, 4);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -60px 0px',
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="living-spaces"
      ref={sectionRef}
      className="w-full py-16 md:py-24 bg-[#fff8f5] overflow-hidden"
    >
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        <div
          className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 transition-all duration-1000 ease-out"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 1.2s cubic-bezier(0.2, 0.8, 0.2, 1), transform 1.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
        >
          <div>
            <span className="font-label-sm text-xs uppercase tracking-widest text-[#5d371f] font-semibold">
              Bộ Sưu Tập Theo Phòng
            </span>
            <h2 className="font-headline-lg text-2xl sm:text-3xl md:text-4xl text-[#1f1b19] mt-1 font-normal">
              Không Gian Trải Nghiệm
            </h2>
          </div>
          <p className="font-body-md text-[#51443d] max-w-md text-sm sm:text-base leading-relaxed">
            Mỗi không gian được kiến tạo như một nốt lặng an yên, kết nối xúc cảm con người với chất liệu thuần khiết.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {displaySpaces.map((item, idx) => {
            const isLeft = idx % 2 === 0;
            // Row 1: 7 + 5 = 12 cols, Row 2: 5 + 7 = 12 cols
            const colSpanClass = (idx === 0 || idx === 3) ? 'md:col-span-7' : 'md:col-span-5';
            const heightClass = (idx === 0 || idx === 1) ? 'h-96 md:h-[460px]' : 'h-80 md:h-[380px]';
            const delay = `${0.2 + idx * 0.25}s`;

            return (
              <div
                key={item.id ? `space-${item.id}-${idx}` : `space-${item.key || 'item'}-${idx}`}
                className={`${colSpanClass} group relative ${heightClass} rounded-none overflow-hidden shadow-sm bg-[#eae1dd] hover-lift will-change-transform`}
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible
                    ? 'translateX(0) scale(1)'
                    : `translateX(${isLeft ? '-160px' : '160px'}) scale(0.96)`,
                  transition: `opacity 2.2s cubic-bezier(0.16, 1, 0.3, 1) ${delay}, transform 2.4s cubic-bezier(0.16, 1, 0.3, 1) ${delay}`,
                }}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
                  style={{
                    backgroundImage: `url('${item.imageUrl}')`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1f1b19]/90 via-[#1f1b19]/40 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 flex flex-col justify-end text-[#f8efeb]">
                  <span className="font-label-sm text-[11px] text-[#ffdbc8] uppercase tracking-wider font-semibold">
                    {item.tagline}
                  </span>
                  <h3 className="font-headline-md text-2xl md:text-3xl text-white font-medium mt-1">
                    {item.name}
                  </h3>
                  <p className="font-body-sm text-sm text-[#f8efeb]/80 mt-1.5 max-w-md line-clamp-2">
                    {item.description}
                  </p>
                  <div className="flex items-center gap-3 mt-4">
                    <button
                      onClick={() => onSelectCategory(item.key)}
                      className="inline-flex items-center gap-1.5 font-label-md text-xs text-white bg-[#5d371f]/90 hover:bg-[#5d371f] px-4 py-2 rounded-none transition-colors backdrop-blur-sm shadow cursor-pointer border-none"
                    >
                      <span>{item.countText}</span>
                      <span className="material-symbols-outlined text-[16px]">north_east</span>
                    </button>
                    <span className="font-data-mono text-xs text-[#f8efeb]/60">{item.codeLabel}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
