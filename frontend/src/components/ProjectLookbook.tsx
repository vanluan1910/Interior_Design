'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import {
  ArrowRightOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
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

  const featuredHero = REAL_PROJECTS[0];
  const secondaryProjects = REAL_PROJECTS.slice(1);

  const sectionRef = useRef<HTMLElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'start 55%'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 85,
    damping: 26,
    restDelta: 0.001,
  });

  const headerY = useTransform(smoothProgress, [0, 0.8], [35, 0]);
  const heroX = useTransform(smoothProgress, [0, 1], [-80, 0]);
  const sideX = useTransform(smoothProgress, [0, 1], [80, 0]);
  const opacity = useTransform(smoothProgress, [0, 0.8], [0, 1]);

  return (
    <section ref={sectionRef} id="real-projects" className="w-full py-7 md:py-9 bg-[#fff8f5] overflow-hidden border-b border-[#ebdcd2]">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">

        {/* SECTION HEADER (NỔI LÊN THEO ĐỘ LĂN CHUỘT) */}
        <motion.div
          style={{ y: headerY, opacity }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 mb-5 md:mb-7"
        >
          <div>
            <h2 className="font-sans text-2xl xs:text-3xl sm:text-4xl lg:text-[42px] text-[#1f1b19] font-bold tracking-tight">
              Dự Án Biệt Thự &amp; Penthouse Thực Tế
            </h2>
            <p className="text-xs sm:text-base text-[#51443d] max-w-2xl mt-1.5 sm:mt-2 leading-relaxed">
              Chiêm ngưỡng các không gian sống độc bản được kiến tạo từ gỗ tự nhiên nguyên khối. Mỗi công trình là một câu chuyện phong cách sống được may đo riêng biệt.
            </p>
          </div>

          {onOpenBooking && (
            <button
              type="button"
              onClick={onOpenBooking}
              className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-none bg-[#5d371f] hover:bg-[#724528] text-white text-xs font-semibold shadow-sm hover:shadow-md transition-all cursor-pointer self-start md:self-end"
            >
              <span>Tư vấn thiết kế dự án</span>
              <ArrowRightOutlined className="text-[12px]" />
            </button>
          )}
        </motion.div>

        {/* BENTO LOOKBOOK LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-stretch">

          {/* 1. HERO FEATURED PROJECT (Trượt từ bên trái vào theo độ lăn chuột) */}
          {featuredHero && (
            <motion.div
              style={{ x: isMobile ? 0 : heroX, opacity }}
              className="lg:col-span-7 group/card flex flex-col justify-between bg-white rounded-none overflow-hidden border border-[#d8c8bc] shadow-sm hover:border-[#5d371f] transition-all duration-300"
            >
              {/* Image Frame (Landscape 16:10) */}
              <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-[#ede3db] rounded-none">
                <img
                  alt={featuredHero.title}
                  className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover/card:scale-105"
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

                  <h3 className="font-sans text-2xl sm:text-3xl text-[#1f1b19] font-bold group-hover/card:text-[#5d371f] transition-colors">
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

                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5d371f]">
                    <CheckCircleOutlined className="text-emerald-600 text-xs" />
                    <span>Thực tế công trình</span>
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* 2. SIDE PROJECTS LIST (Chiếm 5 cột bên phải, trượt từ bên phải vào theo độ lăn chuột) */}
          <motion.div
            style={{ x: isMobile ? 0 : sideX, opacity }}
            className="lg:col-span-5 flex flex-col gap-5"
          >
            {secondaryProjects.map((item) => (
              <div
                key={item.id}
                className="group/side flex flex-col sm:flex-row items-stretch bg-white rounded-none overflow-hidden border border-[#d8c8bc] shadow-sm hover:border-[#5d371f] transition-all duration-300 flex-1"
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

                    <h4 className="font-sans text-base sm:text-lg text-[#1f1b19] font-semibold group-hover/side:text-[#5d371f] transition-colors line-clamp-1">
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
          </motion.div>

        </div>


      </div>


    </section>
  );
}
