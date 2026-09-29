'use client';

import React from 'react';

interface ShowroomSectionProps {
  onOpenBooking: () => void;
}

export default function ShowroomSection({ onOpenBooking }: ShowroomSectionProps) {
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
              Đến Chạm Vào Gỗ Tại Showroom D2 LUXURY
            </h2>
            <p className="font-body-md text-sm sm:text-base text-[#51443d] leading-relaxed">
              Chúng tôi dành không gian rộng hơn 800m² tại trung tâm để mô phỏng hoàn chỉnh từng phòng chức năng. Mời bạn ghé uống trà, hít hà mùi gỗ mộc và lắng nghe chuyên gia tư vấn bản vẽ cá nhân hoá.
            </p>

            {/* Showroom Cards */}
            <div className="flex flex-col gap-3 pt-1">
              <div className="p-4 rounded-none bg-white shadow-sm border border-[#eae1dd] hover:border-[#5d371f]/40 transition-colors">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#5d371f] text-[24px] shrink-0 mt-0.5">
                    storefront
                  </span>
                  <div className="flex flex-col">
                    <h3 className="font-title-md text-sm sm:text-base text-[#1f1b19] font-semibold">
                      Showroom Hà Nội
                    </h3>
                    <p className="font-body-sm text-xs sm:text-sm text-[#51443d] mt-0.5">
                      48 Phố Tràng Tiền, Quận Hoàn Kiếm, Hà Nội
                    </p>
                    <span className="font-data-mono text-[11px] text-[#83746c] mt-1">
                      Giờ mở cửa: 08:30 - 21:00 (Hàng ngày)
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-none bg-white shadow-sm border border-[#eae1dd] hover:border-[#5d371f]/40 transition-colors">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#5d371f] text-[24px] shrink-0 mt-0.5">
                    location_on
                  </span>
                  <div className="flex flex-col">
                    <h3 className="font-title-md text-sm sm:text-base text-[#1f1b19] font-semibold">
                      Showroom TP. Hồ Chí Minh
                    </h3>
                    <p className="font-body-sm text-xs sm:text-sm text-[#51443d] mt-0.5">
                      126 Nguyễn Thị Minh Khai, Phường Võ Thị Sáu, Quận 3
                    </p>
                    <span className="font-data-mono text-[11px] text-[#83746c] mt-1">
                      Giờ mở cửa: 09:00 - 21:30 (Hàng ngày)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onOpenBooking}
                className="px-6 py-3 rounded-none bg-[#5d371f] text-white font-title-md text-sm sm:text-base hover:bg-[#784e34] shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                Đặt lịch tiếp đón riêng (Ưu tiên)
              </button>
              <a
                className="font-title-md text-sm sm:text-base text-[#5d371f] hover:underline flex items-center gap-1 font-semibold"
                href="tel:19008922"
              >
                <span className="material-symbols-outlined text-[20px]">call</span>
                <span>1900 8922</span>
              </a>
            </div>
          </div>

          {/* Showroom Map & Interior Views */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div
              className="w-full h-72 md:h-80 rounded-none overflow-hidden shadow-md bg-cover bg-center border border-[#d5c3ba]/60 relative"
              style={{
                backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDFIoXwnB8816-DEPX5Gq_CpL1IwMlKcH9jZ1C4Sh4CMjYTvH5qGyuWhEQ7S0fbkbX1zj4frIafh8rqsmkCB9rFRKFaitOQ1dPeiIJb90FTSEkm5rzUL6Q8LAMYykdq1VQgP8O7FIN53MOSxjT4dOMSuZZZZymqX5sIRKWsRSbDaNHST8HTUFs3_sK-E543JUE6Opl9IDRLxyyxFPiNnCJ3DGgW84SoECDM0YxhswE_GR81Ehs3fWhf')`,
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
                  alt="Không gian trưng bày nội thất D2 LUXURY Tràng Tiền Hà Nội"
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuALSe3Hyrsmh4gDgbARcQ5F3Jr6dNMJdf6Qz6ZgbTUxIkniV7TM_d2GjimawFj0Ywvo0gq92b3uuZGzvo0K95Rxo_mdOCjWdKJm_u-lWvmRg8uZyZfsX69QyZfr0XdF3BeTwOt4NbIu594drNgSn0Xt_o8etCVcT8sOYXsaG2MEDtxxGJ51qjGktmNpleqaLt3XwoGscQxz-FWUYfjMHGddCk9NO7vT-TGCBCsqPVfL0Jgpr6WiQkeC"
                />
                <div className="absolute inset-0 bg-[#1f1b19]/20 pointer-events-none"></div>
                <span className="absolute bottom-2.5 left-2.5 text-white font-label-sm text-[11px] bg-[#1f1b19]/70 px-2.5 py-1 rounded-none backdrop-blur-sm">
                  Showroom Tràng Tiền (Hà Nội)
                </span>
              </div>

              <div className="relative h-44 rounded-none overflow-hidden shadow-sm border border-[#eae1dd]">
                <img
                  alt="Không gian trưng bày nội thất D2 LUXURY Quận 3 TP.HCM"
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDoQbiu3oeTmvSuj9qir3L-Q9BDw9DQNTy-0FYXRZfOtwScIaiXuDkAsdgt27qTMB57FAjL-lzy_dU691PXs9v-7VL1nF7MzfMbMeF9g1ocbvZ08cWFn-p_tkFgY7_qlwF2Khz8aQA_dgB2arcNc-9kxbiB19NI4hm7tbSGjJgCX5VZZd022k6--JFKJ8mIiCctt_1RRpEugGHDWW6H8046AD5iTmVMFMHwwFajA4-FnkCFintOv6dL"
                />
                <div className="absolute inset-0 bg-[#1f1b19]/20 pointer-events-none"></div>
                <span className="absolute bottom-2.5 left-2.5 text-white font-label-sm text-[11px] bg-[#1f1b19]/70 px-2.5 py-1 rounded-none backdrop-blur-sm">
                  Showroom Quận 3 (TP.HCM)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
