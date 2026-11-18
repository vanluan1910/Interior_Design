'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { CheckCircleFilled, EnvironmentOutlined } from '@ant-design/icons';
import { Quote } from 'lucide-react';
import { HomeTestimonial } from '@/api/homeApi';

export interface FeedbackItem {
  id: string;
  projectTitle: string;
  location: string;
  projectImage: string;
  quote: string;
  woodType: string;
}

const FEEDBACK_LIST: FeedbackItem[] = [
  {
    id: 'fb-01',
    projectTitle: 'Penthouse Metropolis',
    location: 'Ba Đình, Hà Nội',
    projectImage: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&auto=format&fit=crop&q=80',
    quote:
      'Bộ bàn ăn nguyên khối và sofa gỗ óc chó của D2 LUXURY thực sự là tâm điểm của ngôi nhà. Vân gỗ cuộn sóng 3D có chiều sâu, sơn lau dầu Osmo mát mịn, sờ vào cảm nhận rõ thớ gỗ mộc tự nhiên. Đội ngũ thi công tỉ mỉ và chuẩn xác từng đường mộng ghép.',
    woodType: 'Gỗ Óc Chó Bắc Mỹ FAS',
  },
  {
    id: 'fb-02',
    projectTitle: 'Sky Villa Đảo Kim Cương',
    location: 'Quận 1, TP. Hồ Chí Minh',
    projectImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80',
    quote:
      'Là một kiến trúc sư theo đuổi trường phái tối giản tự nhiên, tôi cực kỳ khắt khe về độ ẩm sấy và hoàn thiện bề mặt gỗ. D2 LUXURY xử lý dầu thực vật hữu cơ 0% Formaldehyde rất chuẩn, gỗ thở tự nhiên và an toàn cho sức khỏe gia chủ.',
    woodType: 'Gỗ Me Tây & Lam Tần Bì',
  },
  {
    id: 'fb-03',
    projectTitle: 'Biệt Thự Đảo Grand',
    location: 'Ecopark, Hưng Yên',
    projectImage: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&auto=format&fit=crop&q=80',
    quote:
      'Sau gần một năm trải qua bốn mùa thời tiết miền Bắc, các sản phẩm gỗ của D2 LUXURY vẫn phẳng phiu, không cong vênh hay cọt kẹt dù chỉ 1mm. Dịch vụ bảo dưỡng tinh dầu định kỳ tận nhà của các bạn vô cùng chuyên nghiệp và chu đáo.',
    woodType: 'Gỗ Sồi Trắng & Mây Tự Nhiên',
  },
];

interface CustomerFeedbackProps {
  onOpenBooking?: () => void;
  testimonials?: HomeTestimonial[];
}

export default function CustomerFeedback({}: CustomerFeedbackProps = {}) {
  const sectionRef = useRef<HTMLElement>(null);

  // Smooth scroll parallax
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'start 50%'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 26,
    restDelta: 0.001,
  });

  const headerY = useTransform(smoothProgress, [0, 0.8], [30, 0]);
  const opacity = useTransform(smoothProgress, [0, 0.8], [0, 1]);

  return (
    <section
      ref={sectionRef}
      id="customer-feedback"
      className="w-full py-10 md:py-16 bg-[#fff8f5] overflow-hidden border-b border-[#ebdcd2]"
    >
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">

        {/* SECTION HEADER - Tinh gọn, sang trọng */}
        <motion.div
          style={{ y: headerY, opacity }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 md:mb-12"
        >
          <div>
            <h2 className="font-sans text-2xl xs:text-3xl sm:text-4xl lg:text-[40px] text-[#1f1b19] font-bold tracking-tight">
              Cảm Nhận Từ Những Gia Chủ Đẳng Cấp
            </h2>
            <p className="text-xs sm:text-base text-[#68574d] max-w-2xl mt-1.5 sm:mt-2 leading-relaxed">
              Chiêm ngưỡng các không gian sống thực tế và cảm nhận chân thực từ những khách hàng đã tin chọn nội thất mộc cao cấp D2 LUXURY.
            </p>
          </div>
        </motion.div>

        {/* 3-COLUMN EDITORIAL CARDS - Cân xứng, tối giản, sang trọng */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {FEEDBACK_LIST.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
              className="group flex flex-col justify-between bg-white overflow-hidden border border-[#e5d4c8] shadow-2xs hover:border-[#5d371f] hover:shadow-md transition-all duration-300"
            >
              {/* Ảnh công trình thực tế (16:10) không bị che lấp */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#ede3db]">
                <img
                  alt={item.projectTitle}
                  src={item.projectImage}
                  className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                />
              </div>

              {/* Nội dung đánh giá */}
              <div className="p-6 sm:p-7 flex flex-col justify-between flex-1 gap-6 bg-white">
                <div className="flex flex-col gap-3.5">
                  {/* Tag chất liệu */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-[#5d371f] px-2.5 py-1 bg-[#fbf4f0] border border-[#f0e3db]">
                      {item.woodType}
                    </span>
                  </div>

                  {/* Lời trích dẫn */}
                  <div className="relative">
                    <Quote className="w-5 h-5 text-[#5d371f]/20 mb-2 rotate-180" />
                    <p className="font-sans text-xs sm:text-sm text-[#3b322c] leading-relaxed italic">
                      &ldquo;{item.quote}&rdquo;
                    </p>
                  </div>
                </div>

                {/* Thông tin công trình thực tế (Không hiện tên cá nhân gia chủ) */}
                <div className="pt-3.5 border-t border-[#f2e7e0] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-[#51443d] font-medium truncate">
                    <EnvironmentOutlined className="text-[#5d371f] text-[11px]" />
                    <span className="font-semibold text-[#1f1b19]">{item.projectTitle}</span>
                    <span className="text-[#83746c]">&bull; {item.location}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium shrink-0">
                    <CheckCircleFilled className="text-[10px]" /> Đã nghiệm thu
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
