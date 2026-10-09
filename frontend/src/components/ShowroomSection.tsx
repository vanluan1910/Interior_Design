'use client';

import React from 'react';
import { HomeShowroom, HomeCompanyInfo } from '@/api/homeApi';

interface ShowroomSectionProps {
  onOpenBooking: () => void;
  showrooms?: HomeShowroom[];
  companyInfo?: HomeCompanyInfo;
}

const DEFAULT_SHOWROOMS: HomeShowroom[] = [
  {
    id: '1',
    name: 'Showroom & Trụ sở Hà Nội',
    address: 'Số 88 Phố Huế, Quận Hai Bà Trưng, Hà Nội',
    phone: '0986.739.587',
    openingHours: 'Giờ mở cửa: 08:30 - 21:00 (Hàng ngày)',
    isHeadquarter: true,
  },
  {
    id: '2',
    name: 'Showroom TP. Hồ Chí Minh',
    address: '215 Nguyễn Văn Trỗi, Phường 10, Quận Phú Nhuận, TP.HCM',
    phone: '0986.739.587',
    openingHours: 'Giờ mở cửa: 09:00 - 21:30 (Hàng ngày)',
    isHeadquarter: false,
  },
];

export default function ShowroomSection({ onOpenBooking, showrooms, companyInfo }: ShowroomSectionProps) {
  const displayShowrooms = showrooms && showrooms.length > 0 ? showrooms : DEFAULT_SHOWROOMS;
  const hotline = companyInfo?.hotline || '0986.739.587';
  const rawPhone = hotline.replace(/\D/g, '') || '0986739587';

  return (
    <section id="showrooms" className="w-full py-16 md:py-24 bg-[#fbf2ee]">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Showroom Information */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <span className="font-label-sm text-xs uppercase tracking-widest text-[#5d371f] font-semibold">
              Không Gian Trải Nghiệm Thực Tế
            </span>
            <h2 className="font-headline-lg text-2xl sm:text-3xl md:text-4xl text-[#1f1b19] font-normal leading-tight">
              Đến Chạm Vào Gỗ Tại {companyInfo?.brandName || 'D2 LUXURY'}
            </h2>
            <p className="font-body-md text-sm sm:text-base text-[#51443d] leading-relaxed">
              Chúng tôi dành không gian rộng hơn 800m² tại trung tâm để mô phỏng hoàn chỉnh từng phòng chức năng. Mời bạn ghé uống trà, hít hà mùi gỗ mộc và lắng nghe chuyên gia tư vấn bản vẽ cá nhân hoá.
            </p>

            {/* Showroom Cards */}
            <div className="flex flex-col gap-3 pt-1">
              {displayShowrooms.map((sr, idx) => (
                <div
                  key={sr.id ? `showroom-${sr.id}-${idx}` : `showroom-${idx}`}
                  className="p-4 rounded-none bg-white shadow-sm border border-[#eae1dd] hover-border-[#5d371f]/40 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#5d371f] text-[24px] shrink-0 mt-0.5">
                      {sr.isHeadquarter ? 'storefront' : 'location_on'}
                    </span>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <h3 className="font-title-md text-sm sm:text-base text-[#1f1b19] font-semibold m-0">
                          {sr.name}
                        </h3>
                        {sr.isHeadquarter && (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-[#5d371f]/10 text-[#5d371f] rounded-none">
                            HQ Flagship
                          </span>
                        )}
                      </div>
                      <p className="font-body-sm text-xs sm:text-sm text-[#51443d] mt-1 m-0">
                        {sr.address}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-[#83746c] mt-1.5 flex-wrap">
                        <span className="font-data-mono">
                          {sr.openingHours || '08:00 - 21:00 (Hàng ngày)'}
                        </span>
                        {sr.phone && (
                          <span className="font-mono text-[#5d371f] font-semibold">
                            Hotline: {sr.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href={`tel:${rawPhone}`}
                className="px-6 py-3 rounded-none bg-[#5d371f] text-white font-title-md text-sm sm:text-base hover:bg-[#784e34] shadow-md hover:shadow-lg transition-all cursor-pointer inline-flex items-center gap-2 no-underline"
              >
                <span className="material-symbols-outlined text-[20px]">phone_in_talk</span>
                <span>Liên hệ tư vấn tiếp đón</span>
              </a>
              <a
                className="font-title-md text-sm sm:text-base text-[#5d371f] hover:underline flex items-center gap-1 font-semibold no-underline"
                href={`tel:${rawPhone}`}
              >
                <span>Hotline: {hotline}</span>
              </a>
            </div>
          </div>

          {/* Showroom Map & Interior Views */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div
              className="w-full h-72 md:h-80 rounded-none overflow-hidden shadow-md bg-cover bg-center border border-[#d5c3ba]/60 relative"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&auto=format&fit=crop&q=80')`,
              }}
            >
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-none shadow-sm text-xs font-semibold text-[#5d371f] flex items-center gap-1.5 border border-[#d5c3ba]/40">
                <span className="w-2 h-2 rounded-none bg-emerald-600 animate-pulse"></span>
                <span>Đang mở cửa đón khách</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative h-44 rounded-none overflow-hidden shadow-sm border border-[#eae1dd]">
                <img
                  alt="Không gian trưng bày nội thất D2 LUXURY"
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  src="https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&auto=format&fit=crop&q=80"
                />
              </div>

              <div className="relative h-44 rounded-none overflow-hidden shadow-sm border border-[#eae1dd]">
                <img
                  alt="Không gian trưng bày nội thất D2 LUXURY"
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  src="https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&auto=format&fit=crop&q=80"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
