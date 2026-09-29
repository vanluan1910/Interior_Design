'use client';

import React from 'react';

interface LivingSpacesProps {
  onSelectCategory: (cat: string) => void;
}

export default function LivingSpaces({ onSelectCategory }: LivingSpacesProps) {
  return (
    <section id="living-spaces" className="w-full py-16 md:py-24 bg-[#fff8f5]">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
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
          {/* Living Room: Large Card (7 cols) */}
          <div className="md:col-span-7 group relative h-96 md:h-[460px] rounded-none overflow-hidden shadow-sm bg-[#eae1dd] hover-lift">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
              style={{
                backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDmS710a_c1wwnOBeDRCOfdX02Mci2NPEIGqq5wWn-VUt5KFWGd5Wpz1v0paEcUBvqKIUQxbS4wmFHtA74Q55KzBpobzhltrQwywHWh3ATUWzlIo2xrjocoeSuY9uObBETkq08i6Zblqjh20GThMBShw0t6IvY5Vbg6GdjJs60TJPJ3H_H3M5weIGtzYugzNgL-oF1X7ZGKEu6mp92TwhyUyYNXb_QnE77b3k0tAqsO-xQggmXMiWhz')`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1f1b19]/90 via-[#1f1b19]/40 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 flex flex-col justify-end text-[#f8efeb]">
              <span className="font-label-sm text-[11px] text-[#ffdbc8] uppercase tracking-wider font-semibold">
                Không gian chính
              </span>
              <h3 className="font-headline-md text-2xl md:text-3xl text-white font-medium mt-1">
                Phòng Khách Tĩnh Tại
              </h3>
              <p className="font-body-sm text-sm text-[#f8efeb]/80 mt-1.5 max-w-md">
                Sofa mộc bọc nỉ lanh tự nhiên, bàn trà điêu khắc hữu cơ, hệ kệ TV tinh gọn tôn vinh sự mộc mạc.
              </p>
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={() => onSelectCategory('living')}
                  className="inline-flex items-center gap-1.5 font-label-md text-xs text-white bg-[#5d371f]/90 hover:bg-[#5d371f] px-4 py-2 rounded-none transition-colors backdrop-blur-sm shadow"
                >
                  <span>Xem 38 thiết kế</span>
                  <span className="material-symbols-outlined text-[16px]">north_east</span>
                </button>
                <span className="font-data-mono text-xs text-[#f8efeb]/60">01 / KHÁCH</span>
              </div>
            </div>
          </div>

          {/* Bedroom: Medium Card (5 cols) */}
          <div className="md:col-span-5 group relative h-96 md:h-[460px] rounded-none overflow-hidden shadow-sm bg-[#eae1dd] hover-lift">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
              style={{
                backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCxiqsNh_95GHa7l9_712e8Qi3PsKHZxt3wnSEAwzKxI3eliaM25p_6UH_UegZ62vqYG02YO2S1xjHYp1BJ4hwo4404F-SDBAqxllxA5QVQEEvZhGMVuBJ6sOpoxaaOIeuDtks6IJWMuc5GhZctdNkhRNaxaNnOxV2l3NC8e4aYdIy1bYEpGLoG7jsoyH9xPGd8zV6X4QJFOM7-nJBcfPxwG5t1h74liz1JsL-AzQEyx0f_K-p8VhAk')`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1f1b19]/90 via-[#1f1b19]/40 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 flex flex-col justify-end text-[#f8efeb]">
              <span className="font-label-sm text-[11px] text-[#ffdbc8] uppercase tracking-wider font-semibold">
                Giấc ngủ thư thái
              </span>
              <h3 className="font-headline-md text-2xl md:text-3xl text-white font-medium mt-1">
                Phòng Ngủ Gỗ Óc Chó
              </h3>
              <p className="font-body-sm text-sm text-[#f8efeb]/80 mt-1.5">
                Giường phản thấp giấu chân, tủ áo lam gỗ thanh mảnh và tab đầu giường nguyên khối.
              </p>
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={() => onSelectCategory('bedroom')}
                  className="inline-flex items-center gap-1.5 font-label-md text-xs text-white bg-[#5d371f]/90 hover:bg-[#5d371f] px-4 py-2 rounded-none transition-colors backdrop-blur-sm shadow"
                >
                  <span>Xem 24 thiết kế</span>
                  <span className="material-symbols-outlined text-[16px]">north_east</span>
                </button>
                <span className="font-data-mono text-xs text-[#f8efeb]/60">02 / NGỦ</span>
              </div>
            </div>
          </div>

          {/* Dining Room: Medium Card (5 cols) */}
          <div className="md:col-span-5 group relative h-80 md:h-[380px] rounded-none overflow-hidden shadow-sm bg-[#eae1dd] hover-lift">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
              style={{
                backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuC3_P9LHWatPAmR9xlVesDMDP-dIYZLqy9ulQXUAK5Wjc7I5WRctoQ1XqEGdxRnvTce6MJezqHUsaHohWcajCgpSkwKngqqXYTmT0GiZQ8oQtDOlCytXRhVO7eK8rUNz8MbX0Q-6XunKuNE4h4EaGI40qgGQpuZPiCQaGV79mn3Ojkd4JJqzQKhn3zMUs3RQLYw-I58wfdOnebVitqDwYUCmi_Ss4cAN8dUmENb12Shg1fxi3YStBvk')`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1f1b19]/90 via-[#1f1b19]/40 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 flex flex-col justify-end text-[#f8efeb]">
              <span className="font-label-sm text-[11px] text-[#ffdbc8] uppercase tracking-wider font-semibold">
                Bữa cơm ấm cúng
              </span>
              <h3 className="font-headline-sm text-xl md:text-2xl text-white font-medium mt-1">
                Phòng Ăn Sum Vầy
              </h3>
              <p className="font-body-sm text-sm text-[#f8efeb]/80 mt-1">
                Bàn ăn mở rộng thông minh, ghế tựa công thái học ôm sát sống lưng.
              </p>
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={() => onSelectCategory('dining')}
                  className="inline-flex items-center gap-1.5 font-label-md text-xs text-white bg-[#5d371f]/90 hover:bg-[#5d371f] px-4 py-2 rounded-none transition-colors backdrop-blur-sm shadow"
                >
                  <span>Xem 19 thiết kế</span>
                  <span className="material-symbols-outlined text-[16px]">north_east</span>
                </button>
                <span className="font-data-mono text-xs text-[#f8efeb]/60">03 / ĂN</span>
              </div>
            </div>
          </div>

          {/* Home Office / Study: Large Card (7 cols) */}
          <div className="md:col-span-7 group relative h-80 md:h-[380px] rounded-none overflow-hidden shadow-sm bg-[#eae1dd] hover-lift">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
              style={{
                backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDEeDKuBXu_pPSw4vC1pouZNbHUs4zt0GmDknJsgiQbFkMV-SAuSXmo5PQEbNGm23qxK19UHZ86ZZE6LRC-gs7DsmkHhrZrU91-hTek_vUt0dz2St0W_sG7lg0f5neFPdDtupEgQ_by3AXy0ZkhGvUlAbhiKWciNnXRU_YzGM8HLVynIZUmbtCiH_iv4bMAbmu6WqUlh76p7DpRTYtghONAhy-DTQq31qRZYrcFtjJXtdJiUVl114-l')`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1f1b19]/90 via-[#1f1b19]/40 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 flex flex-col justify-end text-[#f8efeb]">
              <span className="font-label-sm text-[11px] text-[#ffdbc8] uppercase tracking-wider font-semibold">
                Tập trung &amp; sáng tạo
              </span>
              <h3 className="font-headline-sm text-xl md:text-2xl text-white font-medium mt-1">
                Góc Làm Việc Tĩnh Tại
              </h3>
              <p className="font-body-sm text-sm text-[#f8efeb]/80 mt-1 max-w-lg">
                Bàn làm việc cạnh cong bo mềm, giá sách modul tuỳ biến theo kích thước căn hộ.
              </p>
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={() => onSelectCategory('office')}
                  className="inline-flex items-center gap-1.5 font-label-md text-xs text-white bg-[#5d371f]/90 hover:bg-[#5d371f] px-4 py-2 rounded-none transition-colors backdrop-blur-sm shadow"
                >
                  <span>Xem 15 thiết kế</span>
                  <span className="material-symbols-outlined text-[16px]">north_east</span>
                </button>
                <span className="font-data-mono text-xs text-[#f8efeb]/60">04 / LÀM VIỆC</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
