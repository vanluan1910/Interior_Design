'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Modal } from 'antd';
import {
  ArrowRightOutlined,
  EnvironmentOutlined,
  AppstoreOutlined,
  CalendarOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  PhoneOutlined,
} from '@ant-design/icons';

interface ProjectItem {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  location: string;
  area: string;
  style: string;
  woodType: string;
  year: string;
  mainImage: string;
  galleryImages: string[];
  description: string;
  highlights: string[];
  scope: string;
}

const REAL_PROJECTS: ProjectItem[] = [
  {
    id: 'metropolis-penthouse',
    code: 'PRJ-01',
    title: 'Penthouse Metropolis Liễu Giai',
    subtitle: 'Nghệ Thuật Mộc Gỗ Óc Chó Giữa Tầng Không',
    location: 'Ba Đình, Hà Nội',
    area: '280 m²',
    style: 'Modern Wabi-Sabi Luxury',
    woodType: 'Gỗ Óc Chó Bắc Mỹ FAS',
    year: 'Bàn giao 11/2025',
    mainImage:
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&auto=format&fit=crop&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200&auto=format&fit=crop&q=80',
    ],
    description:
      'Không gian penthouse tối giản nhưng đẫm chất tĩnh tại với hệ thống sofa bọc vải nỉ cao cấp, bàn trà me tây cuộn sóng và hệ tủ rượu âm tường bằng gỗ óc chó Bắc Mỹ nguyên khối. Từng mối nối ghép mộng thủ công truyền thống không dùng đinh ốc kim loại.',
    highlights: [
      'Bàn ăn 10 ghế gỗ óc chó FAS ghép mộng âm dương',
      'Hệ tủ áo walk-in closet cánh kính viền gỗ mộc tự nhiên',
      'Hoàn thiện dầu thực vật hữu cơ Osmo 0% Formaldehyde',
    ],
    scope: 'Trọn gói phòng khách, phòng ăn & 3 phòng ngủ master',
  },
  {
    id: 'ecopark-island-villa',
    code: 'PRJ-02',
    title: 'Biệt Thự Đảo Ecopark Grand',
    subtitle: 'Khúc Giao Hưởng Giữa Gỗ Sồi Tự Nhiên & Mây Đan',
    location: 'Văn Giang, Hưng Yên',
    area: '520 m²',
    style: 'Japandi Zen Sanctuary',
    woodType: 'Gỗ Sồi Trắng & Mây Tự Nhiên',
    year: 'Bàn giao 01/2026',
    mainImage:
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&auto=format&fit=crop&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&auto=format&fit=crop&q=80',
    ],
    description:
      'Gia chủ là người yêu thiên nhiên và phong cách Wabi-Sabi Nhật Bản. D2 LUXURY kết hợp thớ gỗ sồi tự nhiên sáng màu cùng sợi mây rừng đan mắt cáo thủ công, đón trọn ánh sáng mặt hồ và mùi thơm gỗ mộc.',
    highlights: [
      'Phản trà thiền thấp gỗ sồi kết hợp chiếu cói Tatami',
      'Giường bay giấu chân chịu lực mộng xuyên tâm độc bản',
      'Cửa lùa Shoji gỗ sồi trắng Nga kháng ẩm nhiệt đới',
    ],
    scope: 'Thiết kế & chế tác toàn bộ 4 tầng biệt thự đơn lập',
  },
  {
    id: 'riverside-harmony-mansion',
    code: 'PRJ-03',
    title: 'Dinh Thự Vinhomes Riverside',
    subtitle: 'Nét Trầm Mặc Hoàng Gia Trong Thớ Gỗ Tuyển Chọn',
    location: 'Long Biên, Hà Nội',
    area: '450 m²',
    style: 'Neo-Classic Warm Timber',
    woodType: 'Gỗ Óc Chó & Gõ Đỏ Cao Cấp',
    year: 'Bàn giao 12/2025',
    mainImage:
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200&auto=format&fit=crop&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=1200&auto=format&fit=crop&q=80',
    ],
    description:
      'Công trình đòi hỏi độ chuẩn xác tuyệt đối trên từng đường phào chỉ mộc và độ phẳng thớ gỗ. Phòng ngủ Master và phòng làm việc được phủ gam nâu trầm sang trọng, cách âm tốt và duy trì độ ẩm phòng chuẩn dưới 50%.',
    highlights: [
      'Bàn giám đốc chữ L gỗ óc chó vân cuộn xoáy 3D',
      'Đảo bếp tích hợp bàn bar mini gỗ nguyên tấm dày 8cm',
      'Bảo hành kết cấu 24 tháng và bảo dưỡng dầu định kỳ',
    ],
    scope: 'Chế tác nội thất may đo theo bản vẽ chi tiết của KTS',
  },
  {
    id: 'thao-dien-duplex',
    code: 'PRJ-04',
    title: 'Duplex Sky Villa Thảo Điền',
    subtitle: 'Không Gian Sống Mở & Bàn Ăn Me Tây Nguyên Khối',
    location: 'Thủ Đức, TP. Hồ Chí Minh',
    area: '310 m²',
    style: 'Organic Modernism',
    woodType: 'Gỗ Me Tây & Tần Bì Ash',
    year: 'Bàn giao 02/2026',
    mainImage:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&auto=format&fit=crop&q=80',
    ],
    description:
      'Tâm điểm của căn duplex thông tầng là phiến bàn ăn Me Tây nguyên tấm dài 3m2 với viền tự nhiên live-edge. Cùng hệ lam gỗ tần bì thông gió giúp kết nối không gian phòng khách và khu vườn ban công xanh mát.',
    highlights: [
      'Mặt bàn Me Tây Live-Edge sấy chân không 45 ngày',
      'Kệ TV treo không chân chịu lực ngầm mộng gỗ 150kg',
      'Đôn ghế mộc nguyên khối giữ nguyên giác gỗ vàng óng',
    ],
    scope: 'Không gian phòng khách thông tầng, phòng ăn & quầy bar',
  },
];

interface ProjectLookbookProps {
  onOpenBooking?: () => void;
}

export default function ProjectLookbook({ onOpenBooking }: ProjectLookbookProps = {}) {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [activeModalImg, setActiveModalImg] = useState<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedProject(null);
      }
      if (e.key === 'ArrowLeft' && selectedProject) {
        setActiveModalImg((prev) => (prev > 0 ? prev - 1 : selectedProject.galleryImages.length - 1));
      }
      if (e.key === 'ArrowRight' && selectedProject) {
        setActiveModalImg((prev) => (prev < selectedProject.galleryImages.length - 1 ? prev + 1 : 0));
      }
    };
    if (selectedProject) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedProject]);

  const filters = [
    { id: 'all', label: 'Tất cả công trình' },
    { id: 'villa', label: 'Biệt thự & Dinh thự' },
    { id: 'penthouse', label: 'Penthouse & Duplex' },
  ];

  const filteredProjects = REAL_PROJECTS.filter((p) => {
    if (activeFilter === 'villa') {
      return p.id.includes('villa') || p.id.includes('harmony') || p.id.includes('riverside');
    }
    if (activeFilter === 'penthouse') {
      return p.id.includes('penthouse') || p.id.includes('duplex');
    }
    return true;
  });

  const featuredHero = filteredProjects[0];
  const secondaryProjects = filteredProjects.slice(1);

  return (
    <section id="real-projects" className="w-full py-7 md:py-9 bg-[#fff8f5] overflow-hidden border-b border-[#ebdcd2]">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        
        {/* SECTION HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6 md:mb-7">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-none bg-[#5d371f] text-[#ffdbc8] text-[11px] uppercase tracking-widest font-semibold mb-2.5 border border-[#784e34] shadow-xs">
              <span className="w-1.5 h-1.5 rounded-none bg-[#c5a880]" />
              <span>Thực Tế Công Trình • 2,500+ Gia Chủ Tin Chọn</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-[42px] text-[#1f1b19] font-normal tracking-tight">
              Dự Án Biệt Thự &amp; Penthouse Thực Tế
            </h2>
            <p className="text-sm sm:text-base text-[#51443d] max-w-2xl mt-2 leading-relaxed">
              Chiêm ngưỡng các không gian sống độc bản được kiến tạo từ gỗ tự nhiên nguyên khối. Mỗi công trình là một câu chuyện phong cách sống được may đo riêng biệt.
            </p>
          </div>

          {/* FILTER BUTTONS */}
          <div className="flex items-center gap-2 bg-[#f5ece8] p-1.5 rounded-none border border-[#d5c3ba]/60 self-start md:self-end">
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id)}
                className={`px-4 py-2 text-xs font-semibold rounded-none transition-all cursor-pointer ${
                  activeFilter === f.id
                    ? 'bg-[#5d371f] text-white shadow-xs'
                    : 'text-[#51443d] hover:text-[#5d371f] hover:bg-white/60'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* BENTO LOOKBOOK LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          
          {/* 1. HERO FEATURED PROJECT (Chiếm 7 cột bên trái) */}
          {featuredHero && (
            <div
              onClick={() => {
                setSelectedProject(featuredHero);
                setActiveModalImg(0);
              }}
              className="lg:col-span-7 group/card flex flex-col justify-between bg-white rounded-none overflow-hidden border border-[#d8c8bc] shadow-sm hover:border-[#5d371f] transition-all duration-300 cursor-pointer"
            >
              {/* Image Frame (Landscape 16:10) */}
              <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-[#ede3db] rounded-none">
                <img
                  alt={featuredHero.title}
                  className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover/card:scale-108"
                  src={featuredHero.mainImage}
                />

                {/* Badges on Top */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                  <span className="font-mono text-xs px-3 py-1 rounded-none bg-black/50 backdrop-blur-md text-white border border-white/20">
                    {featuredHero.code} • {featuredHero.area}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-none bg-white/95 backdrop-blur-md text-[#5d371f] shadow-xs border border-[#d5c3ba]">
                    <CheckCircleOutlined className="text-emerald-600" />
                    <span>{featuredHero.year}</span>
                  </span>
                </div>

                {/* Hover Quick View Pill */}
                <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <span className="px-5 py-2.5 rounded-none bg-white text-[#5d371f] font-semibold text-xs shadow-xl flex items-center gap-2">
                    <EyeOutlined />
                    <span>Chiêm ngưỡng góc chụp thực tế</span>
                  </span>
                </div>
              </div>

              {/* Information Row */}
              <div className="p-6 sm:p-8 flex flex-col justify-between flex-1 gap-4 bg-white">
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#83746c] mb-1.5">
                    <EnvironmentOutlined className="text-[#5d371f]" />
                    <span>{featuredHero.location}</span>
                    <span className="text-[#d5c3ba]">•</span>
                    <span className="font-semibold text-[#5d371f]">{featuredHero.style}</span>
                  </div>

                  <h3 className="font-serif text-2xl sm:text-3xl text-[#1f1b19] font-normal group-hover/card:text-[#5d371f] transition-colors">
                    {featuredHero.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#51443d] mt-2 line-clamp-2 leading-relaxed">
                    {featuredHero.description}
                  </p>
                </div>

                {/* Specs Pill List */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#f0e3db]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded-none bg-[#f5ece8] text-[#5d371f] text-xs font-medium border border-[#eae1dd]">
                      {featuredHero.woodType}
                    </span>
                    <span className="px-2.5 py-1 rounded-none bg-[#f5ece8] text-[#51443d] text-xs">
                      {featuredHero.scope}
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5d371f] group-hover/card:translate-x-1 transition-transform">
                    <span>Xem ảnh căn hộ</span>
                    <ArrowRightOutlined className="text-[11px]" />
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 2. SIDE PROJECTS LIST (Chiếm 5 cột bên phải, 3 thẻ gọn gàng) */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {secondaryProjects.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedProject(item);
                  setActiveModalImg(0);
                }}
                className="group/side flex flex-col sm:flex-row items-stretch bg-white rounded-none overflow-hidden border border-[#d8c8bc] shadow-sm hover:border-[#5d371f] transition-all duration-300 cursor-pointer flex-1"
              >
                {/* Thumbnail Image (Square / 4:3 on mobile) */}
                <div className="sm:w-44 md:w-48 aspect-[16/10] sm:aspect-square shrink-0 overflow-hidden bg-[#ede3db] relative">
                  <img
                    alt={item.title}
                    className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover/side:scale-108"
                    src={item.mainImage}
                  />
                  <span className="sm:hidden absolute top-2.5 left-2.5 font-mono text-[10px] px-2 py-0.5 rounded-none bg-black/60 text-white">
                    {item.code}
                  </span>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5 flex flex-col justify-between flex-1 gap-2">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-[#83746c] mb-1">
                      <span className="hidden sm:inline font-mono font-bold text-[#5d371f]">{item.code}</span>
                      <span className="flex items-center gap-1">
                        <EnvironmentOutlined className="text-[#5d371f]" />
                        <span>{item.location}</span>
                      </span>
                    </div>

                    <h4 className="font-serif text-base sm:text-lg text-[#1f1b19] font-medium group-hover/side:text-[#5d371f] transition-colors line-clamp-1">
                      {item.title}
                    </h4>

                    <p className="text-xs text-[#51443d] line-clamp-2 mt-1 leading-snug">
                      {item.subtitle}
                    </p>
                  </div>

                  {/* Footer specs */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#f0e3db] text-[11px]">
                    <span className="text-[#5d371f] font-medium truncate max-w-[170px]">
                      {item.woodType}
                    </span>
                    <span className="font-mono text-[#83746c] font-semibold">
                      {item.area}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>


      </div>

      {/* HORIZONTAL SPLIT POPUP: REAL VILLA & PENTHOUSE LOOKBOOK */}
      <Modal
        open={!!selectedProject}
        onCancel={() => setSelectedProject(null)}
        footer={null}
        centered
        width={1060}
        destroyOnHidden
        className="[&_.ant-modal-content]:!p-0 [&_.ant-modal-content]:!rounded-none [&_.ant-modal-content]:!overflow-hidden [&_.ant-modal-content]:!bg-[#fff8f5] [&_.ant-modal-content]:!border [&_.ant-modal-content]:!border-[#d5c3ba]"
        closeIcon={
          <span className="material-symbols-outlined text-[20px] text-[#51443d] hover:text-[#ba1a1a] transition-colors">
            close
          </span>
        }
        styles={{
          mask: {
            backgroundColor: 'rgba(20, 16, 14, 0.82)',
            backdropFilter: 'blur(8px)',
          },
          body: {
            padding: 0,
            backgroundColor: '#fff8f5',
          },
        }}
      >
        {selectedProject && (
          <div className="flex flex-col md:flex-row h-auto md:h-[600px] max-h-[82vh] overflow-hidden bg-[#fff8f5]">
            {/* CỘT TRÁI (58%): HÌNH ẢNH TOÀN CẢNH NGANG & THUMBNAILS */}
            <div className="md:w-[58%] lg:w-[60%] h-[320px] sm:h-[360px] md:h-full min-h-0 flex flex-col bg-[#14100e] relative select-none shrink-0 overflow-hidden">
              {/* Ảnh chính lớn */}
              <div className="flex-1 min-h-0 w-full relative overflow-hidden flex items-center justify-center bg-black/60 group/modalimg">
                <img
                  alt={`${selectedProject.title} - Góc chụp ${activeModalImg + 1}`}
                  className="w-full h-full object-cover transition-all duration-300"
                  src={selectedProject.galleryImages[activeModalImg] || selectedProject.mainImage}
                />

                {/* Badges trên ảnh */}
                <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
                  <span className="font-mono text-[11px] px-2.5 py-1 rounded-none bg-black/70 backdrop-blur-md text-white border border-white/20">
                    {selectedProject.code} • {selectedProject.area}
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-none bg-white/95 backdrop-blur-md text-[#5d371f]">
                    <CheckCircleOutlined className="text-emerald-600 text-[10px]" />
                    <span>{selectedProject.year}</span>
                  </span>
                </div>

                {/* Photo Counter Pill */}
                <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/70 backdrop-blur-md text-white font-mono text-[11px] rounded-none border border-white/15 z-10">
                  {activeModalImg + 1} / {selectedProject.galleryImages.length} góc chụp
                </div>

                {/* Left Arrow Button */}
                {selectedProject.galleryImages.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveModalImg((prev) => (prev > 0 ? prev - 1 : selectedProject.galleryImages.length - 1));
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-none bg-black/70 hover:bg-[#5d371f] text-white flex items-center justify-center transition-all cursor-pointer shadow-lg backdrop-blur-sm border border-white/20"
                    aria-label="Ảnh trước"
                  >
                    <span className="material-symbols-outlined text-[22px]">chevron_left</span>
                  </button>
                )}

                {/* Right Arrow Button */}
                {selectedProject.galleryImages.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveModalImg((prev) => (prev < selectedProject.galleryImages.length - 1 ? prev + 1 : 0));
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-none bg-black/70 hover:bg-[#5d371f] text-white flex items-center justify-center transition-all cursor-pointer shadow-lg backdrop-blur-sm border border-white/20"
                    aria-label="Ảnh tiếp theo"
                  >
                    <span className="material-symbols-outlined text-[22px]">chevron_right</span>
                  </button>
                )}
              </div>

              {/* Dải Thumbnails ngang căn giữa */}
              {selectedProject.galleryImages.length > 1 && (
                <div className="h-18 p-2 bg-[#0c0908] border-t border-white/10 flex items-center justify-center gap-2.5 shrink-0">
                  {selectedProject.galleryImages.map((imgUrl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveModalImg(i)}
                      className={`h-full aspect-[16/10] overflow-hidden rounded-none border transition-all cursor-pointer relative shrink-0 ${
                        activeModalImg === i
                          ? 'border-[#c5a880] ring-2 ring-[#c5a880]/80 opacity-100 scale-105'
                          : 'border-white/20 opacity-55 hover:opacity-90 hover:border-white/50'
                      }`}
                    >
                      <img alt={`Góc chụp ${i + 1}`} className="w-full h-full object-cover" src={imgUrl} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* CỘT PHẢI (42%): THÔNG TIN DỰ ÁN CHI TIẾT */}
            <div className="md:w-[42%] lg:w-[40%] h-full min-h-0 flex flex-col bg-[#fff8f5] border-t md:border-t-0 md:border-l border-[#ebdcd2] overflow-hidden">
              {/* Header Cột Phải */}
              <div className="px-5 py-4 border-b border-[#ebdcd2] bg-white shrink-0 pr-12">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded-none bg-[#5d371f]/10 text-[#5d371f] font-bold">
                    {selectedProject.code}
                  </span>
                  <span className="text-[10px] font-semibold text-[#83746c] uppercase tracking-wider truncate">
                    {selectedProject.style}
                  </span>
                </div>
                <h3 className="font-serif text-lg sm:text-xl text-[#1f1b19] font-medium leading-snug line-clamp-1">
                  {selectedProject.title}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-[#83746c] mt-0.5">
                  <EnvironmentOutlined className="text-[#5d371f]" />
                  <span className="truncate">{selectedProject.location}</span>
                </div>
              </div>

              {/* Thân Cột Phải - Cuộn nội dung thông số & mô tả */}
              <div className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0 space-y-4">
                {/* Grid 4 thông số cốt lõi */}
                <div className="grid grid-cols-2 gap-2 p-3 bg-[#f5ece8] border border-[#d5c3ba]/60 rounded-none text-xs">
                  <div>
                    <span className="block text-[10px] text-[#83746c]">Diện tích:</span>
                    <strong className="text-[#1f1b19] font-mono text-xs">{selectedProject.area}</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] text-[#83746c]">Bàn giao:</span>
                    <strong className="text-[#1f1b19] text-xs">{selectedProject.year.replace('Bàn giao ', '')}</strong>
                  </div>
                  <div className="col-span-2 pt-1.5 border-t border-[#ebdcd2]">
                    <span className="block text-[10px] text-[#83746c]">Chất liệu chủ đạo:</span>
                    <strong className="text-[#5d371f] font-medium">{selectedProject.woodType}</strong>
                  </div>
                </div>

                {/* Ý tưởng kiến trúc */}
                <div>
                  <h4 className="text-[11px] font-bold text-[#1f1b19] uppercase tracking-wider mb-1.5">
                    Ý Tưởng Kiến Trúc &amp; Không Gian
                  </h4>
                  <p className="text-xs text-[#51443d] leading-relaxed">
                    {selectedProject.description}
                  </p>
                </div>

                {/* Hạng mục chế tác tiêu biểu */}
                <div>
                  <h4 className="text-[11px] font-bold text-[#1f1b19] uppercase tracking-wider mb-1.5">
                    Hạng Mục Chế Tác Tiêu Biểu
                  </h4>
                  <ul className="space-y-1.5 text-xs text-[#51443d]">
                    {selectedProject.highlights.map((hl, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-none bg-[#5d371f] mt-1.5 shrink-0" />
                        <span>{hl}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Quy mô chế tác */}
                <div className="p-2.5 bg-white border border-[#ebdcd2] rounded-none text-xs">
                  <span className="text-[#83746c] block text-[10px]">Phạm vi thực hiện:</span>
                  <strong className="text-[#1f1b19] font-medium mt-0.5 block">{selectedProject.scope}</strong>
                </div>
              </div>

              {/* Footer Cột Phải - Các nút liên hệ & tư vấn */}
              <div className="p-3.5 sm:p-4 bg-white border-t border-[#ebdcd2] flex flex-col gap-2 shrink-0">
                <a
                  href="tel:0967323335"
                  className="w-full py-2.5 bg-[#5d371f] hover:bg-[#784e34] text-white text-xs font-semibold text-center rounded-none shadow-sm transition-colors flex items-center justify-center gap-2 no-underline"
                >
                  <PhoneOutlined />
                  <span>Tư vấn thi công: 0967.323.335</span>
                </a>
                <a
                  href="https://zalo.me/0967323335"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 bg-[#f5ece8] hover:bg-[#ede0d8] text-[#5d371f] text-xs font-semibold text-center rounded-none border border-[#d5c3ba] transition-colors flex items-center justify-center gap-2 no-underline"
                >
                  <span>Gửi bản vẽ nhận 3D &amp; Báo giá</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
