'use client';

import React, { useState } from 'react';
import { Modal, Form, Input, Checkbox, Button, App } from 'antd';
import confetti from 'canvas-confetti';

interface SampleBoxModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SampleBoxModal({ isOpen, onClose }: SampleBoxModalProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedAddress, setSubmittedAddress] = useState('');

  const onFinish = (values: any) => {
    setLoading(true);
    setSubmittedAddress(values.address);

    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#5d371f', '#fcc2a1', '#784e34'],
      });
    } catch {}

    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      message.success('Đã ghi nhận yêu cầu gửi hộp mẫu!');
      setTimeout(() => {
        setSubmitted(false);
        form.resetFields();
        onClose();
      }, 3000);
    }, 800);
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      centered
      width={560}
      destroyOnHidden
      styles={{
        body: {
          backgroundColor: '#fff8f5',
          padding: '12px 6px',
        },
      }}
    >
      <div className="flex flex-col gap-3">
        <div>
          <span className="font-label-sm text-xs text-[#5d371f] uppercase tracking-widest font-bold">
            Trải nghiệm xúc giác tại gia
          </span>
          <h3 className="font-headline-sm text-2xl text-[#1f1b19] font-bold mt-0.5">
            Nhận Hộp Mẫu Gỗ &amp; Vải Miễn Phí
          </h3>
        </div>

        {submitted ? (
          <div className="py-8 text-center flex flex-col items-center gap-3 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-none bg-[#e1e5ce] text-[#3f4332] flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[36px]">local_shipping</span>
            </div>
            <h4 className="font-headline-sm text-xl text-[#5d371f] font-bold">
              Đã Ghi Nhận Địa Chỉ Giao Mẫu!
            </h4>
            <p className="font-body-sm text-sm text-[#51443d] max-w-sm leading-relaxed">
              Hộp mẫu gỗ tự nhiên và vải bọc cao cấp sẽ được chuyển phát nhanh đến{' '}
              <strong className="text-[#1f1b19]">{submittedAddress}</strong> trong 24-48 giờ tới.
            </p>
          </div>
        ) : (
          <>
            <p className="font-body-sm text-xs sm:text-sm text-[#51443d] mb-2 leading-relaxed">
              D2 LUXURY gửi tặng hộp mẫu gồm 4 phôi gỗ tự nhiên (Óc chó, Sồi, Tần bì, Teak) đã hoàn thiện dầu Rubio thực tế kèm 6 mẫu vải nỉ cao cấp để Quý khách ướm thử cùng ánh sáng căn hộ.
            </p>

            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              initialValues={{
                woods: ['walnut', 'oak'],
              }}
              requiredMark="optional"
            >
              <Form.Item
                label={<span className="font-label-md text-xs font-semibold text-[#1f1b19]">Chọn mẫu gỗ quan tâm:</span>}
                name="woods"
                rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 loại gỗ!' }]}
              >
                <Checkbox.Group className="grid grid-cols-3 gap-2">
                  <Checkbox value="walnut" className="font-medium text-xs">Gỗ Óc Chó Tự Nhiên</Checkbox>
                  <Checkbox value="oak" className="font-medium text-xs">Gỗ Sồi Trắng</Checkbox>
                  <Checkbox value="ash" className="font-medium text-xs">Gỗ Tần Bì Tự Nhiên</Checkbox>
                </Checkbox.Group>
              </Form.Item>

              <Form.Item
                label={<span className="font-label-md text-xs font-semibold text-[#1f1b19]">Họ và tên người nhận</span>}
                name="name"
                rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
              >
                <Input
                  size="large"
                  placeholder="Nguyễn Văn A"
                />
              </Form.Item>

              <Form.Item
                label={<span className="font-label-md text-xs font-semibold text-[#1f1b19]">Số điện thoại nhận hàng</span>}
                name="phone"
                rules={[
                  { required: true, message: 'Vui lòng nhập số điện thoại!' },
                  { pattern: /^[0-9]{9,11}$/, message: 'Số điện thoại không hợp lệ!' },
                ]}
              >
                <Input
                  size="large"
                  placeholder="091 234 5678"
                />
              </Form.Item>

              <Form.Item
                label={<span className="font-label-md text-xs font-semibold text-[#1f1b19]">Địa chỉ giao mẫu tận nhà</span>}
                name="address"
                rules={[{ required: true, message: 'Vui lòng nhập địa chỉ nhận hàng!' }]}
              >
                <Input.TextArea
                  rows={2}
                  placeholder="Số nhà, tên đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố"
                />
              </Form.Item>

              <Form.Item className="mb-0 mt-2">
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={loading}
                  block
                  className="h-12 bg-[#5d371f] hover:!bg-[#784e34] font-title-md text-sm font-bold shadow-md rounded-none"
                  icon={<span className="material-symbols-outlined text-[18px]">package_2</span>}
                >
                  Gửi hộp mẫu miễn phí tận nhà
                </Button>
              </Form.Item>
            </Form>
          </>
        )}
      </div>
    </Modal>
  );
}
