import React from 'react';

export default function Testimonials() {
  const reviews = [
    {
      name: 'KTS. Trần Hoàng Lan',
      role: 'Sáng lập Văn phòng Thiết kế Kiến trúc A+',
      avatar:
        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80',
      quote:
        'Là một KTS theo đuổi trường phái tối giản tự nhiên, tôi rất kỹ tính trong việc hoàn thiện bề mặt gỗ. D2 LUXURY xử lý dầu Rubio mượt vô cùng, vân óc chó lên đều màu mà không bị bóng giả như sơn PU thông thường.',
    },
    {
      name: 'Anh Vũ Đăng Khoa',
      role: 'Gia chủ Penthouse Metropolis Liễu Giai',
      avatar:
        'https://images.unsplash.com/photo-1533090161767-e6ffed986b88?w=800&auto=format&fit=crop&q=80',
      quote:
        'Bộ bàn ăn kéo dài Kyoto đặt tại căn hộ Metropolis của gia đình khiến ai đến chơi cũng trầm trồ. Ray trượt êm ru, gỗ sồi đầm chắc. Đội ngũ lắp đặt đeo găng tay chỉn chu, dọn sạch trước khi về.',
    },
    {
      name: 'Chị Minh Nguyệt',
      role: 'Quận 2, TP. Hồ Chí Minh',
      avatar:
        'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&auto=format&fit=crop&q=80',
      quote:
        'Giường phản thấp ngủ rất thích, vững chãi không hề có tiếng cọt kẹt dù chỉ là mộng gỗ ghép. Dịch vụ bảo dưỡng tinh dầu định kỳ sau 1 năm của bên bạn khiến tôi vô cùng hài lòng.',
    },
  ];

  return (
    <section className="w-full py-16 md:py-24 bg-[#fff8f5]">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <span className="font-label-sm text-xs uppercase tracking-widest text-[#5d371f] font-semibold">
              Cảm Nhận Chân Thực
            </span>
            <h2 className="font-headline-lg text-2xl sm:text-3xl md:text-4xl text-[#1f1b19] mt-1 font-normal">
              Đồng Điệu Cùng Kiến Trúc Sư &amp; Gia Chủ
            </h2>
          </div>

          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-none border border-[#eae1dd] shadow-sm">
            <div className="flex text-[#5d371f]">
              {[1, 2, 3, 4, 5].map((i) => (
                <span
                  key={i}
                  className="material-symbols-outlined text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  star
                </span>
              ))}
            </div>
            <span className="font-title-md text-sm text-[#1f1b19] font-bold">4.96 / 5.0</span>
            <span className="font-body-sm text-xs text-[#83746c]">(640+ đánh giá xác thực)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((rev, index) => (
            <div
              key={index}
              className="p-6 md:p-8 rounded-none bg-[#fbf2ee] shadow-sm flex flex-col justify-between border border-[#eae1dd]/80 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col gap-3">
                <div className="flex text-[#5d371f] gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <span
                      key={i}
                      className="material-symbols-outlined text-[16px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                  ))}
                </div>
                <p className="font-body-md text-sm text-[#1f1b19] italic leading-relaxed">
                  &ldquo;{rev.quote}&rdquo;
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 mt-6 bg-white/60 p-2.5 rounded-none border border-[#eae1dd]/60">
                <img
                  alt={rev.name}
                  className="w-11 h-11 rounded-none object-cover ring-1 ring-[#d5c3ba]"
                  src={rev.avatar}
                />
                <div className="flex flex-col">
                  <span className="font-title-md text-sm text-[#1f1b19] font-semibold">
                    {rev.name}
                  </span>
                  <span className="font-body-sm text-xs text-[#83746c]">{rev.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
