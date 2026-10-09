'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Product } from '@/types';

interface MaterialExperienceProps {
  onOpenSampleModal?: () => void;
  products?: Product[];
}

export interface WoodMaterialItem {
  id: string;
  name: string;
  subtitle: string;
  colorSwatch: string;
  title: string;
  desc: string;
  defaultImage: string;
  origin: string;
  density: string;
  finish: string;
}

const REAL_WOOD_MATERIALS: WoodMaterialItem[] = [
  {
    id: 'oak',
    name: 'Gỗ Sồi Tự Nhiên (Ash / Oak)',
    subtitle: 'Tông sáng hiện đại, kháng ẩm tự nhiên tốt',
    colorSwatch: '#c5a880',
    title: 'Gỗ Sồi Tự Nhiên (Ash / White Oak)',
    desc: 'Tông màu sáng tự nhiên, thớ gỗ đanh chắc, vân gỗ sáng trang nhã, chống cong vênh và co ngót vượt trội.',
    defaultImage: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=1000&auto=format&fit=crop&q=80',
    origin: 'Bắc Mỹ & Châu Âu',
    density: '750 kg/m³',
    finish: 'Lau dầu thực vật Osmo',
  },
  {
    id: 'ash',
    name: 'Gỗ Tần Bì + Veneer Sồi (Ashwood)',
    subtitle: 'Vân elip uyển chuyển, độ đàn hồi dẻo dai',
    colorSwatch: '#d8c7b0',
    title: 'Gỗ Tần Bì Tự Nhiên (Ashwood)',
    desc: 'Đường vân elip uyển chuyển nhiều tầng, độ đàn hồi dẻo dai chống va đập, hoàn thiện bề mặt mộc sắc nét.',
    defaultImage: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1000&auto=format&fit=crop&q=80',
    origin: 'Bắc Mỹ sấy chuẩn FAS',
    density: '680 kg/m³',
    finish: 'Sơn mờ lau dầu Rubio',
  },
  {
    id: 'metay',
    name: 'Gỗ Me Tây Nguyên Tấm (Live-Edge)',
    subtitle: 'Vân mây cuộn xoáy tự nhiên độc bản',
    colorSwatch: '#5c3d2e',
    title: 'Gỗ Me Tây Nguyên Tấm (Live-Edge / Epoxy)',
    desc: 'Giác gỗ vàng óng viền ngoài ôm trọn lõi gỗ nâu trầm sô-cô-la, vân mây cuộn xoáy độc bản sang trọng.',
    defaultImage: 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=1000&auto=format&fit=crop&q=80',
    origin: 'Gỗ thân cổ thụ tuyển chọn',
    density: '720 kg/m³',
    finish: 'Dầu mờ hữu cơ & Epoxy',
  },
  {
    id: 'rattan',
    name: 'Mây Tự Nhiên Đan Thủ Công',
    subtitle: 'Sợi mây dẻo dai thoáng khí phong cách Japandi',
    colorSwatch: '#d2b48c',
    title: 'Mây Tự Nhiên Kết Hợp Gỗ Mộc',
    desc: 'Đan thủ công tỉ mỉ theo kiểu mắt cáo truyền thống, mang đến cảm giác thanh thoát và gần gũi với thiên nhiên.',
    defaultImage: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1000&auto=format&fit=crop&q=80',
    origin: 'Mây rừng tự nhiên dẻo dai',
    density: 'Siêu nhẹ, thoáng khí',
    finish: 'Xử lý kháng mối mọt an toàn',
  },
];

export default function MaterialExperience({ onOpenSampleModal, products = [] }: MaterialExperienceProps) {
  const [selectedId, setSelectedId] = useState<string>('oak');
  const [randomImage, setRandomImage] = useState<string>('');

  const current = REAL_WOOD_MATERIALS.find((m) => m.id === selectedId) || REAL_WOOD_MATERIALS[0];

  // Pool of product images matching the selected wood type
  const matchingImages = useMemo(() => {
    if (!products || products.length === 0) return [];

    let filtered: Product[] = [];
    if (selectedId === 'metay') {
      filtered = products.filter((p) => {
        const text = (p.woodType + ' ' + p.materialDetails + ' ' + p.name + ' ' + p.sku).toLowerCase();
        return text.includes('me tây') || text.includes('bm-') || text.includes('bm0') || text.includes('nguyên tấm');
      });
    } else if (selectedId === 'rattan') {
      filtered = products.filter((p) => {
        const text = (p.woodType + ' ' + p.materialDetails + ' ' + p.name + ' ' + p.sku).toLowerCase();
        return text.includes('mây') || text.includes('gm-') || text.includes('gm0') || text.includes('spk');
      });
    } else if (selectedId === 'ash') {
      filtered = products.filter((p) => {
        const text = (p.woodType + ' ' + p.materialDetails + ' ' + p.name).toLowerCase();
        return text.includes('tần bì') || text.includes('ash') || (text.includes('ktv') && !text.includes('sồi nguyên khối'));
      });
    } else {
      // 'oak'
      filtered = products.filter((p) => {
        const text = (p.woodType + ' ' + p.materialDetails + ' ' + p.name).toLowerCase();
        return text.includes('sồi') || text.includes('oak') || (!text.includes('me tây') && !text.includes('mây'));
      });
    }

    const validImages = filtered
      .map((p) => p.image)
      .filter((img) => img && !img.includes('placeholder') && img.length > 5);

    return validImages;
  }, [products, selectedId]);

  // When selectedId changes, pick a random image from matching products or fallback to defaultImage
  useEffect(() => {
    if (matchingImages.length > 0) {
      const randomIndex = Math.floor(Math.random() * matchingImages.length);
      setRandomImage(matchingImages[randomIndex]);
    } else {
      setRandomImage(current.defaultImage);
    }
  }, [selectedId, matchingImages, current.defaultImage]);

  const displayImage = randomImage || current.defaultImage;

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
          {/* Visual Showcase: Clean Image Only */}
          <div className="lg:col-span-7 aspect-[16/10] rounded-none overflow-hidden bg-[#eae1dd] relative shadow-inner">
            <img
              alt={current.title}
              className="w-full h-full object-cover transition-all duration-700 ease-out"
              src={displayImage}
            />

            {/* Subtle info label overlay */}
            <div className="absolute bottom-4 left-4 right-4 sm:right-auto bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-none shadow-md border border-[#d5c3ba]/40 max-w-md">
              <span className="font-title-md text-sm sm:text-base text-[#5d371f] font-semibold">
                {current.title}
              </span>
              <span className="block font-body-sm text-xs text-[#51443d] mt-0.5">
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
              {REAL_WOOD_MATERIALS.map((mat) => {
                const isSelected = selectedId === mat.id;
                return (
                  <button
                    key={mat.id}
                    onClick={() => setSelectedId(mat.id)}
                    className={`w-full p-3.5 rounded-none flex items-center justify-between transition-all text-left cursor-pointer border ${
                      isSelected
                        ? 'bg-[#f5ece8] border-[#5d371f] ring-2 ring-[#5d371f]'
                        : 'bg-[#fff8f5] border-[#eae1dd] hover:bg-[#f5ece8]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-10 h-10 rounded-none shadow-inner shrink-0 border border-[#d5c3ba]/40"
                        style={{ backgroundColor: mat.colorSwatch }}
                      ></span>
                      <div>
                        <h4 className="font-title-md text-sm font-semibold text-[#1f1b19]">
                          {mat.name}
                        </h4>
                        <p className="font-body-sm text-xs text-[#83746c] mt-0.5">
                          {mat.subtitle}
                        </p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[#5d371f] text-[20px] shrink-0 ml-2">
                      {isSelected ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                  </button>
                );
              })}
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

            {/* Link to Products Catalog filtered by this wood */}
            <div className="pt-1">
              <Link
                href={`/products?material=${encodeURIComponent(current.name)}`}
                className="w-full block py-2.5 px-4 bg-[#5d371f] hover:bg-[#784e34] text-white text-xs font-semibold uppercase tracking-wider text-center transition-colors shadow-sm"
              >
                Khám phá các sản phẩm từ {current.name.split('(')[0].trim()} →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
