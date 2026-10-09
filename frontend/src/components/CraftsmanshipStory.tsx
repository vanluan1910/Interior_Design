'use client';

import React, { useState } from 'react';

interface CraftsmanshipStoryProps {
  onOpenBooking: () => void;
}

export default function CraftsmanshipStory({ onOpenBooking }: CraftsmanshipStoryProps) {
  const [showVideoModal, setShowVideoModal] = useState(false);

  return (
    <section id="craftsmanship" className="w-full py-16 md:py-24 bg-[#fff8f5] overflow-hidden">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Visual Story Mosaic */}
          <div className="lg:col-span-6 relative">
            <div className="relative w-full h-[460px] sm:h-[520px] rounded-none overflow-hidden shadow-xl bg-[#eae1dd]">
              <img
                alt="Vietnamese master artisan woodworker hand-planing a large solid walnut timber"
                className="w-full h-full object-cover"
                src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&auto=format&fit=crop&q=80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1f1b19]/80 via-transparent to-transparent"></div>

              {/* Bottom Feature Card */}
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-none bg-white/90 backdrop-blur-md shadow-lg border border-[#d5c3ba]/40">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#5d371f] text-[28px] shrink-0">
                    eco
                  </span>
                  <div>
                    <h4 className="font-title-md text-sm font-semibold text-[#1f1b19]">
                      Hoàn Thiện Dầu Thực Vật 0% VOC
                    </h4>
                    <p className="font-body-sm text-xs text-[#51443d] mt-0.5 leading-snug">
                      Không sơn PU độc hại. Bảo vệ bề mặt bằng tinh dầu lanh &amp; sáp ong nguyên chất, giữ trọn mùi hương gỗ mộc.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Overlapping Small Floating Card */}
            <div className="hidden sm:block absolute -bottom-5 -right-5 w-64 p-4 rounded-none bg-[#5d371f] text-white shadow-2xl border border-[#ffdbc8]/20">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="material-symbols-outlined text-[20px] text-[#ffdbc8]">
                  construction
                </span>
                <span className="font-label-md text-[11px] text-[#ffdbc8] uppercase tracking-wider">
                  Kỹ thuật mộng âm dương
                </span>
              </div>
              <p className="font-body-sm text-xs text-white/90 leading-tight">
                Không phụ thuộc đinh ốc kim loại. Thớ gỗ co giãn tự nhiên theo khí hậu nhiệt đới ẩm Việt Nam.
              </p>
            </div>
          </div>

          {/* Text Story Content */}
          <div className="lg:col-span-6 flex flex-col gap-5">
            <span className="font-label-sm text-xs uppercase tracking-widest text-[#5d371f] font-semibold">
              Tâm Huyết Nghệ Nhân
            </span>
            <h2 className="font-headline-lg text-2xl sm:text-3xl md:text-4xl text-[#1f1b19] leading-tight font-normal">
              Khi bàn tay người thợ lắng nghe từng hơi thở của vân gỗ.
            </h2>
            <p className="font-body-lg text-sm sm:text-base text-[#51443d] leading-relaxed">
              Tại xưởng D2 LUXURY, chúng tôi không xem gỗ là vật liệu công nghiệp vô tri. Mỗi phiến gỗ óc chó, sồi hay dổi rừng trồng đều có câu chuyện năm tháng riêng thể hiện qua từng mắt gỗ, đường vân cuộn sóng.
            </p>

            {/* Feature Sub-cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="flex flex-col gap-1 p-3.5 rounded-none bg-[#f5ece8] border border-[#eae1dd]">
                <div className="flex items-center gap-2 text-[#5d371f] font-semibold font-title-md text-sm">
                  <span className="material-symbols-outlined text-[20px]">architecture</span>
                  <span>Khảo Sát Độ Ẩm &lt;10%</span>
                </div>
                <p className="font-body-sm text-xs text-[#51443d]">
                  Sấy công nghệ chân không hiện đại, triệt tiêu nguy cơ mối mọt và nứt vỡ theo mùa.
                </p>
              </div>

              <div className="flex flex-col gap-1 p-3.5 rounded-none bg-[#f5ece8] border border-[#eae1dd]">
                <div className="flex items-center gap-2 text-[#5d371f] font-semibold font-title-md text-sm">
                  <span className="material-symbols-outlined text-[20px]">brush</span>
                  <span>Chà Nhám 6 Lớp Thủ Công</span>
                </div>
                <p className="font-body-sm text-xs text-[#51443d]">
                  Độ mịn tuyệt đối từ giấy nhám hạt 400 đến 1000, cho cảm giác chạm mượt mà tựa lụa.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={() => setShowVideoModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-none bg-[#5d371f] text-white font-title-md text-sm hover:bg-[#784e34] transition-all shadow-md cursor-pointer"
              >
                <span>Tham quan Xưởng chế tác</span>
                <span className="material-symbols-outlined text-[18px]">play_circle</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="font-data-mono text-xs text-[#83746c]">Xưởng mộc:</span>
                <span className="font-body-sm text-xs text-[#1f1b19] font-medium">
                  Làng nghề Chàng Sơn, Thạch Thất, Hà Nội
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Workshop Tour Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#1c1917]/70 backdrop-blur-sm"
            onClick={() => setShowVideoModal(false)}
          ></div>
          <div className="relative z-10 w-full max-w-3xl bg-[#fff8f5] rounded-none overflow-hidden shadow-2xl p-6 border border-[#d5c3ba]/60">
            <div className="flex items-center justify-between pb-4 border-b border-[#eae1dd]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#5d371f]">movie</span>
                <h3 className="font-headline-sm text-lg text-[#1f1b19]">
                  Hành Trình Chế Tác Tại Xưởng D2 LUXURY
                </h3>
              </div>
              <button
                onClick={() => setShowVideoModal(false)}
                className="p-1 rounded-none text-[#51443d] hover:bg-[#eae1dd]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="py-6 text-center">
              <div className="aspect-video w-full rounded-none bg-[#1f1b19] overflow-hidden relative flex items-center justify-center">
                <img
                  alt="Hình ảnh phim xưởng chế tác gỗ"
                  className="w-full h-full object-cover opacity-70"
                  src="https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&auto=format&fit=crop&q=80"
                />
                <div className="absolute flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-none bg-[#5d371f]/90 text-white flex items-center justify-center shadow-xl hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[36px]">play_arrow</span>
                  </div>
                  <span className="text-white text-sm font-medium bg-black/50 px-3 py-1 rounded-none backdrop-blur-sm">
                    Phim tài liệu nghệ nhân 4K (3:45)
                  </span>
                </div>
              </div>
              <p className="font-body-sm text-xs text-[#51443d] mt-4">
                Trải nghiệm từng công đoạn: Lựa phôi gỗ FAS, bào tay truyền thống, ghép mộng chuẩn xác từng mi-li-mét và lau dầu sinh học dưỡng gỗ.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
