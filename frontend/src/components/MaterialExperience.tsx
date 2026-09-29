'use client';

import React, { useState } from 'react';

interface MaterialExperienceProps {
  onOpenSampleModal: () => void;
}

export default function MaterialExperience({ onOpenSampleModal }: MaterialExperienceProps) {
  const [selectedWood, setSelectedWood] = useState<'walnut' | 'oak' | 'ash'>('walnut');

  const woodData = {
    walnut: {
      title: 'Gỗ Óc Chó Bắc Mỹ (FAS)',
      desc: 'Tông màu nâu sô-cô-la trầm ấm, vân cuộn mây quyến rũ đặc trưng của dòng gỗ thượng hạng.',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDfh8Ntxsqe4nGOOs8HaPzUXuGIRKYG4xaYoHPORIkIJgFe8bxWXuF3S9hiwldAGj8psXtXynognrwAxok0Eqv7KMDwgHMDl2hHOiqiEH3hRAK3upAprITLYVOMsXfLVuMYYeIf3zl3VTrJsyVOXpJplaFx8CNg8t7eDDLwu-fEHdArHp5bmlCyqGygKSlIkHgZufsykwP8WeIKvO3OtffH8SWp5EAxg4EbOLMpuvlYVSI8fWlylItB',
      origin: 'Bắc Mỹ (FSC 100%)',
      density: '660 kg/m³',
      finish: 'Dầu lanh hữu cơ Rubio',
    },
    oak: {
      title: 'Gỗ Sồi Trắng Nga (White Oak)',
      desc: 'Tông vàng mật ong nhạt, tia gỗ sáng, thích hợp không gian trẻ trung phong cách Bắc Âu.',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuA0mYv6KR-IXvIVNV4Ii1JspydQgaItxZnvowNsSdHKBqslS9JAaL9r0dvB10V9F0S5FTPxiKLDVI2wf_QSO_LwxkGttnXsPa8x1kpMSC-tBWS6JG4wM2wXIdUr5kRWdNOwMZJMR13avraXRJOcftW59yQJMeaTLByAHmVpmsjxX9Lsk1xfoN_ESbWir-ySUEeXzBWiugM6LYft0uH6bofZXQPhB5IAbYU81KVDs9hDVnowCk9itX9-',
      origin: 'Châu Âu / Nga',
      density: '750 kg/m³',
      finish: 'Dầu dưỡng mờ tự nhiên',
    },
    ash: {
      title: 'Gỗ Tần Bì Tự Nhiên (Gỗ Ash)',
      desc: 'Vân elip xếp tầng mềm mại, dẻo dai chống va đập, hoàn hảo cho ghế uốn cong công thái học.',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuC3_P9LHWatPAmR9xlVesDMDP-dIYZLqy9ulQXUAK5Wjc7I5WRctoQ1XqEGdxRnvTce6MJezqHUsaHohWcajCgpSkwKngqqXYTmT0GiZQ8oQtDOlCytXRhVO7eK8rUNz8MbX0Q-6XunKuNE4h4EaGI40qgGQpuZPiCQaGV79mn3Ojkd4JJqzQKhn3zMUs3RQLYw-I58wfdOnebVitqDwYUCmi_Ss4cAN8dUmENb12Shg1fxi3YStBvk',
      origin: 'Bắc Mỹ',
      density: '680 kg/m³',
      finish: 'Sáp ong nguyên chất',
    },
  };

  const current = woodData[selectedWood];

  return (
    <section className="w-full py-16 md:py-24 bg-[#f5ece8]">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <span className="font-label-sm text-xs uppercase tracking-widest text-[#5d371f] font-semibold">
            Tự Do Tuỳ Biến
          </span>
          <h2 className="font-headline-lg text-2xl sm:text-3xl md:text-4xl text-[#1f1b19] mt-1 font-normal">
            Chất Liệu &amp; Sắc Thái Gỗ Tự Nhiên
          </h2>
          <p className="font-body-md text-sm sm:text-base text-[#51443d] mt-2">
            Chọn loại gỗ và chất liệu bề mặt để cảm nhận cách nội thất D2 LUXURY hòa nhịp vào phong cách ngôi nhà bạn.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center bg-white rounded-none p-6 sm:p-8 shadow-sm border border-[#eae1dd]">
          {/* Visual Showcase */}
          <div className="lg:col-span-7 aspect-[16/10] rounded-none overflow-hidden bg-[#eae1dd] relative shadow-inner">
            <img
              alt={current.title}
              className="w-full h-full object-cover transition-all duration-500"
              src={current.image}
            />
            <div className="absolute bottom-4 left-4 right-4 sm:right-auto bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-none shadow-md border border-[#d5c3ba]/40">
              <span className="font-title-md text-sm sm:text-base text-[#5d371f] font-semibold">
                {current.title}
              </span>
              <span className="block font-body-sm text-xs text-[#51443d] mt-0.5 max-w-sm">
                {current.desc}
              </span>
            </div>
          </div>

          {/* Options & Controls */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <h3 className="font-headline-sm text-lg sm:text-xl text-[#1f1b19]">
              Chọn mẫu vật liệu gửi tận nhà:
            </h3>

            <div className="flex flex-col gap-3">
              {/* Walnut */}
              <button
                onClick={() => setSelectedWood('walnut')}
                className={`w-full p-3.5 rounded-none flex items-center justify-between transition-all text-left cursor-pointer border ${
                  selectedWood === 'walnut'
                    ? 'bg-[#f5ece8] border-[#5d371f] ring-2 ring-[#5d371f]'
                    : 'bg-[#fff8f5] border-[#eae1dd] hover:bg-[#f5ece8]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-none bg-[#4a2e1b] shadow-inner shrink-0"></span>
                  <div>
                    <h4 className="font-title-md text-sm font-semibold text-[#1f1b19]">
                      Gỗ Óc Chó (Gỗ Óc Chó Bắc Mỹ)
                    </h4>
                    <p className="font-body-sm text-xs text-[#83746c]">
                      Độ bền cao, chống va đập, vân gỗ sang trọng
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[#5d371f] text-[20px]">
                  {selectedWood === 'walnut' ? 'check_circle' : 'radio_button_unchecked'}
                </span>
              </button>

              {/* Oak */}
              <button
                onClick={() => setSelectedWood('oak')}
                className={`w-full p-3.5 rounded-none flex items-center justify-between transition-all text-left cursor-pointer border ${
                  selectedWood === 'oak'
                    ? 'bg-[#f5ece8] border-[#5d371f] ring-2 ring-[#5d371f]'
                    : 'bg-[#fff8f5] border-[#eae1dd] hover:bg-[#f5ece8]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-none bg-[#c5a880] shadow-inner shrink-0"></span>
                  <div>
                    <h4 className="font-title-md text-sm font-semibold text-[#1f1b19]">
                      Gỗ Sồi Trắng (Gỗ Sồi Tự Nhiên)
                    </h4>
                    <p className="font-body-sm text-xs text-[#83746c]">
                      Tông sáng hiện đại, kháng nước tự nhiên tốt
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[#5d371f] text-[20px]">
                  {selectedWood === 'oak' ? 'check_circle' : 'radio_button_unchecked'}
                </span>
              </button>

              {/* Ash */}
              <button
                onClick={() => setSelectedWood('ash')}
                className={`w-full p-3.5 rounded-none flex items-center justify-between transition-all text-left cursor-pointer border ${
                  selectedWood === 'ash'
                    ? 'bg-[#f5ece8] border-[#5d371f] ring-2 ring-[#5d371f]'
                    : 'bg-[#fff8f5] border-[#eae1dd] hover:bg-[#f5ece8]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-none bg-[#d8c7b0] shadow-inner shrink-0"></span>
                  <div>
                    <h4 className="font-title-md text-sm font-semibold text-[#1f1b19]">
                      Gỗ Tần Bì (Gỗ Tần Bì Tự Nhiên)
                    </h4>
                    <p className="font-body-sm text-xs text-[#83746c]">
                      Đường vân elip uyển chuyển, độ đàn hồi dẻo dai
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[#5d371f] text-[20px]">
                  {selectedWood === 'ash' ? 'check_circle' : 'radio_button_unchecked'}
                </span>
              </button>
            </div>

            {/* Spec breakdown */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-none bg-[#fbf2ee] text-center border border-[#eae1dd]">
              <div>
                <span className="block font-data-mono text-[10px] text-[#83746c]">XUẤT XỨ</span>
                <span className="font-title-md text-xs text-[#1f1b19] font-medium">
                  {current.origin}
                </span>
              </div>
              <div>
                <span className="block font-data-mono text-[10px] text-[#83746c]">TỶ TRỌNG</span>
                <span className="font-title-md text-xs text-[#1f1b19] font-medium">
                  {current.density}
                </span>
              </div>
              <div>
                <span className="block font-data-mono text-[10px] text-[#83746c]">HOÀN THIỆN</span>
                <span className="font-title-md text-xs text-[#1f1b19] font-medium">
                  {current.finish}
                </span>
              </div>
            </div>

            {/* Sample Box Request Box */}
            <div className="p-4 rounded-none bg-[#fbf2ee] flex flex-col sm:flex-row items-center justify-between gap-3 border border-[#d5c3ba]/60">
              <span className="font-body-sm text-xs text-[#1f1b19] text-center sm:text-left font-medium">
                Hộp mẫu 4 thanh gỗ &amp; vải dệt thực tế:
              </span>
              <button
                onClick={onOpenSampleModal}
                className="w-full sm:w-auto px-4 py-2 rounded-none bg-[#5d371f] text-white font-label-md text-xs hover:bg-[#784e34] transition-colors shadow-sm whitespace-nowrap cursor-pointer"
              >
                Đăng ký nhận miễn phí
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
