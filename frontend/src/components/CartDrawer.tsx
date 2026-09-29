'use client';

import React from 'react';
import { Drawer, InputNumber, Button, Badge, Empty, App } from 'antd';
import { ShoppingOutlined, DeleteOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { CartItem } from '@/types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}: CartDrawerProps) {
  const { message } = App.useApp();
  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const totalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(val) + ' ₫';
  };

  const handleRemove = (id: string, name: string) => {
    onRemoveItem(id);
    message.info(`Đã xóa "${name}" khỏi giỏ hàng`);
  };

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <ShoppingOutlined className="text-[#5d371f] text-[22px]" />
          <span className="font-headline-sm text-lg text-[#1f1b19] font-bold">
            Giỏ Hàng Của Bạn
          </span>
          <Badge count={totalCount} style={{ backgroundColor: '#5d371f' }} />
        </div>
      }
      styles={{
        wrapper: {
          width: 460,
          maxWidth: '100vw',
        },
        header: {
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #eae1dd',
          padding: '20px 24px',
        },
        body: {
          backgroundColor: '#fff8f5',
          padding: '20px 24px',
        },
        footer: {
          backgroundColor: '#ffffff',
          borderTop: '1px solid #eae1dd',
          padding: '20px 24px',
        },
      }}
      footer={
        cartItems.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs text-[#51443d]">
                <span>Vận chuyển &amp; Lắp đặt tận nhà:</span>
                <span className="font-semibold text-emerald-700">Miễn phí (Nội thành)</span>
              </div>
              <div className="flex justify-between items-baseline pt-1.5 border-t border-[#eae1dd]">
                <span className="font-title-md text-sm text-[#1f1b19] font-bold">Tổng thanh toán:</span>
                <span className="font-headline-sm text-2xl text-[#5d371f] font-bold">
                  {formatPrice(totalAmount)}
                </span>
              </div>
            </div>

            <Button
              type="primary"
              size="large"
              onClick={onCheckout}
              block
              className="h-12 bg-[#5d371f] hover:!bg-[#784e34] font-title-md text-sm font-bold shadow-md rounded-none"
              icon={<ArrowRightOutlined />}
              iconPosition="end"
            >
              Tiến hành đặt hàng tư vấn
            </Button>
          </div>
        )
      }
    >
      <div className="flex flex-col gap-4">
        {cartItems.length === 0 ? (
          <div className="py-16 text-center">
            <Empty
              description={
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-[#1f1b19] text-sm">Giỏ hàng chưa có sản phẩm</span>
                  <span className="text-xs text-[#83746c]">Khám phá bộ sưu tập nội thất nghệ nhân của D2 LUXURY</span>
                </div>
              }
            >
              <Button
                type="primary"
                onClick={onClose}
                className="bg-[#5d371f] hover:!bg-[#784e34] rounded-none text-xs font-bold mt-2"
              >
                Khám phá ngay
              </Button>
            </Empty>
          </div>
        ) : (
          cartItems.map((item) => (
            <div
              key={item.product.id}
              className="flex gap-4 p-3.5 rounded-none bg-white border border-[#eae1dd] shadow-sm relative"
            >
              <img
                alt={item.product.name}
                className="w-20 h-20 rounded-none object-cover bg-[#eae1dd] shrink-0"
                src={item.product.image}
              />

              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <h4 className="font-title-md text-sm text-[#1f1b19] font-bold line-clamp-1 pr-4">
                      {item.product.name}
                    </h4>
                    <button
                      onClick={() => handleRemove(item.product.id, item.product.name)}
                      className="text-[#83746c] hover:text-[#ba1a1a] transition-colors cursor-pointer"
                      title="Xóa"
                    >
                      <DeleteOutlined className="text-[15px]" />
                    </button>
                  </div>
                  <span className="font-data-mono text-[11px] text-[#83746c]">
                    {item.product.woodType}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="font-title-md text-sm text-[#5d371f] font-bold">
                    {formatPrice(item.product.price * item.quantity)}
                  </span>

                  <InputNumber
                    min={1}
                    max={99}
                    size="small"
                    value={item.quantity}
                    onChange={(val) => {
                      if (val) {
                        const delta = val - item.quantity;
                        onUpdateQuantity(item.product.id, delta);
                      }
                    }}
                    className="rounded-none border-[#d5c3ba]"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Drawer>
  );
}
