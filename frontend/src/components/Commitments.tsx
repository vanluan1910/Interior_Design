import React from 'react';

export interface CommitmentItem {
  icon: string;
  title: string;
  desc?: string;
  description?: string;
}

interface CommitmentsProps {
  commitments?: CommitmentItem[];
}

const DEFAULT_COMMITMENTS: CommitmentItem[] = [
  {
    icon: 'local_shipping',
    title: 'Miễn Phí Vận Chuyển',
    desc: 'Giao hàng và lắp đặt trọn gói tận nhà miễn phí tại nội thành Hà Nội & TP.HCM.',
  },
  {
    icon: 'published_with_changes',
    title: 'Đổi Trả Trong 30 Ngày',
    desc: 'Trải nghiệm an tâm tuyệt đối, đổi trả linh hoạt nếu không tương thích không gian.',
  },
];

export default function Commitments({ commitments }: CommitmentsProps) {
  const displayItems = commitments && commitments.length > 0 ? commitments : DEFAULT_COMMITMENTS;

  return (
    <section className="w-full bg-[#f5ece8] py-8 border-y border-[#eae1dd]/60">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {displayItems.map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-3.5 p-4 sm:p-5 rounded-none bg-white/80 backdrop-blur-sm border border-[#d5c3ba]/40 hover:bg-white transition-all shadow-sm hover-lift cursor-default"
            >
              <div className="p-2.5 rounded-none bg-[#5d371f]/10 text-[#5d371f] shrink-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
              </div>
              <div className="flex flex-col">
                <h2 className="font-title-md text-[15px] sm:text-base font-semibold text-[#1f1b19]">
                  {item.title}
                </h2>
                <p className="font-body-sm text-[13px] sm:text-sm text-[#51443d] mt-1 leading-snug">
                  {item.desc || item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
