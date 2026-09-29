import React from 'react';

export default function Commitments() {
  const commitments = [
    {
      icon: 'forest',
      title: '100% Gỗ Chuẩn FSC',
      desc: 'Nguồn gỗ sồi & óc chó Bắc Mỹ tuyển chọn từ rừng canh tác bền vững.',
    },
    {
      icon: 'local_shipping',
      title: 'Miễn Phí Vận Chuyển',
      desc: 'Giao hàng và lắp đặt trọn gói tận nhà miễn phí tại nội thành Hà Nội & TP.HCM.',
    },
    {
      icon: 'verified_user',
      title: 'Bảo Hành 5 Năm',
      desc: 'Bảo hành kết cấu mộng và cong vênh 5 năm. Bảo dưỡng tinh dầu trọn đời.',
    },
    {
      icon: 'published_with_changes',
      title: 'Đổi Trả Trong 30 Ngày',
      desc: 'Trải nghiệm an tâm tuyệt đối, đổi trả linh hoạt nếu không tương thích không gian.',
    },
  ];

  return (
    <section className="w-full bg-[#f5ece8] py-8 border-y border-[#eae1dd]/60">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {commitments.map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-3.5 p-4 rounded-none bg-white/70 backdrop-blur-sm border border-[#d5c3ba]/40 hover:bg-white transition-all shadow-sm hover-lift cursor-default"
            >
              <div className="p-2.5 rounded-none bg-[#5d371f]/10 text-[#5d371f] shrink-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
              </div>
              <div className="flex flex-col">
                <h2 className="font-title-md text-[15px] font-semibold text-[#1f1b19]">
                  {item.title}
                </h2>
                <p className="font-body-sm text-[13px] text-[#51443d] mt-1 leading-snug">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
