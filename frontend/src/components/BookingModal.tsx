'use client';

import React, { useState } from 'react';
import { Modal, Form, Input, Select, DatePicker, Button, App } from 'antd';
import confetti from 'canvas-confetti';
import dayjs from 'dayjs';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BookingModal({ isOpen, onClose }: BookingModalProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedName, setSubmittedName] = useState('');
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const onFinish = (values: any) => {
    setLoading(true);
    setSubmittedName(values.name);

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#5d371f', '#fcc2a1', '#784e34', '#3f4332'],
      });
    } catch {}

    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      message.success('Đã ghi nhận yêu cầu đặt lịch tiếp đón VIP!');
      setTimeout(() => {
        setSubmitted(false);
        form.resetFields();
        onClose();
      }, 3000);
    }, 800);
  };

  if (!mounted) {
    return null;
  }

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      centered
      width={560}
      forceRender
      styles={{
        body: {
          backgroundColor: '#fff8f5',
          padding: '12px 6px',
        },
      }}
    >
      <div className="flex flex-col gap-3">
        <div>
          <span className="font-label-sm text-xs text-[#5d371f] font-semibold">
            Đặc quyền khách hàng D2 LUXURY
          </span>
          <h3 className="font-headline-sm text-2xl text-[#1f1b19] font-bold mt-0.5">
            Đặt Lịch Tiếp Đón Showroom
          </h3>
        </div>

        {submitted ? (
          <div className="py-8 text-center flex flex-col items-center gap-3 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-none bg-[#e1e5ce] text-[#3f4332] flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[36px]">check_circle</span>
            </div>
            <h4 className="font-headline-sm text-xl text-[#5d371f] font-bold">
              Đăng Ký Thành Công!
            </h4>
            <p className="font-body-sm text-sm text-[#51443d] max-w-sm leading-relaxed">
              Cảm ơn Quý khách <strong className="text-[#1f1b19]">{submittedName}</strong>. Chuyên viên D2 LUXURY sẽ liên hệ xác nhận lịch hẹn trong vòng 15 phút.
            </p>
          </div>
        ) : (
          <>
            <p className="font-body-sm text-xs sm:text-sm text-[#51443d] mb-2 leading-relaxed">
              Chuyên gia nội thất D2 LUXURY sẽ chuẩn bị sẵn mẫu vật liệu gỗ thực tế và bản vẽ không gian 3D tương ứng cho căn hộ của quý khách.
            </p>

            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              initialValues={{
                location: 'hanoi',
                date: dayjs().add(1, 'day'),
              }}
              requiredMark="optional"
            >
              <Form.Item
                label={<span className="font-label-md text-xs font-semibold text-[#1f1b19]">Họ và tên quý khách</span>}
                name="name"
                rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
              >
                <Input
                  size="large"
                  placeholder="Ví dụ: Nguyễn Văn An"
                />
              </Form.Item>

              <Form.Item
                label={<span className="font-label-md text-xs font-semibold text-[#1f1b19]">Số điện thoại liên hệ</span>}
                name="phone"
                rules={[
                  { required: true, message: 'Vui lòng nhập số điện thoại!' },
                  { pattern: /^[0-9]{9,11}$/, message: 'Số điện thoại không hợp lệ!' },
                ]}
              >
                <Input
                  size="large"
                  placeholder="090 123 4567"
                />
              </Form.Item>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Form.Item
                  label={<span className="font-label-md text-xs font-semibold text-[#1f1b19]">Chọn Showroom</span>}
                  name="location"
                >
                  <Select
                    size="large"
                    options={[
                      { value: 'hanoi', label: 'Hà Nội (48 Tràng Tiền)' },
                      { value: 'saigon', label: 'TP. HCM (126 Nguyễn Thị Minh Khai)' },
                    ]}
                  />
                </Form.Item>

                <Form.Item
                  label={<span className="font-label-md text-xs font-semibold text-[#1f1b19]">Ngày mong muốn</span>}
                  name="date"
                  rules={[{ required: true, message: 'Vui lòng chọn ngày!' }]}
                >
                  <DatePicker
                    size="large"
                    className="w-full"
                    format="DD/MM/YYYY"
                  />
                </Form.Item>
              </div>

              <Form.Item className="mb-0 mt-2">
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={loading}
                  block
                  className="h-12 bg-[#5d371f] hover:!bg-[#784e34] font-title-md text-sm font-bold shadow-md rounded-none"
                  icon={<span className="material-symbols-outlined text-[18px]">calendar_month</span>}
                >
                  Xác nhận đăng ký trải nghiệm VIP
                </Button>
              </Form.Item>
            </Form>
          </>
        )}
      </div>
    </Modal>
  );
}
