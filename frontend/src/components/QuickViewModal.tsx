'use client';

import React, { useState } from 'react';
import { Modal, Radio, InputNumber, Button, Tag, Rate, App } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { Product } from '@/types';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export default function QuickViewModal({
  product,
  onClose,
  onAddToCart,
}: QuickViewModalProps) {
  const { message } = App.useApp();
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedWoodOption, setSelectedWoodOption] = useState<string>('walnut');

  if (!product) return null;

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(val) + ' ₫';
  };

  const handleAdd = () => {
    onAddToCart(product, quantity || 1);
    message.success(`Đã thêm "${product.name}" vào giỏ hàng!`);
    onClose();
  };

  return (
    <Modal
      open={!!product}
      onCancel={onClose}
      footer={null}
      centered
      width={860}
      destroyOnHidden
      styles={{
        body: {
          backgroundColor: '#fff8f5',
          padding: '12px 6px',
        },
      }}
    >
      <div className="flex flex-col md:flex-row gap-6 pt-2">
        {/* Product Image */}
        <div className="md:w-1/2 aspect-square rounded-none bg-[#eae1dd] overflow-hidden relative shadow-inner">
          <img
            alt={product.name}
            className="w-full h-full object-cover"
            src={product.image}
          />
          {product.tag && (
            <div className="absolute top-3 left-3">
              <Tag color="#5d371f" className="px-3 py-1 rounded-none font-bold text-xs border-0 shadow">
                {product.tag}
              </Tag>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="md:w-1/2 flex flex-col justify-between">
          <div className="flex flex-col gap-2">
            <span className="font-label-sm text-xs uppercase tracking-wider text-[#5d371f] font-bold">
              Xem nhanh sản phẩm • {product.categoryName}
            </span>

            <h3 className="font-headline-md text-2xl text-[#1f1b19] font-bold leading-tight">
              {product.name}
            </h3>

            <div className="flex items-center gap-2">
              <Rate disabled defaultValue={5} style={{ color: '#5d371f', fontSize: 14 }} />
              <span className="font-data-mono text-xs text-[#83746c] font-semibold">(42 đánh giá)</span>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <span className="font-title-lg text-2xl text-[#5d371f] font-bold">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <span className="font-data-mono text-xs text-[#83746c] line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>

            <p className="font-body-sm text-xs sm:text-sm text-[#51443d] mt-1 leading-relaxed">
              {product.description}
            </p>

            {/* Wood type options */}
            <div className="pt-2">
              <span className="block font-label-md text-xs text-[#1f1b19] mb-2 font-semibold">
                Tùy chọn chất liệu hoàn thiện:
              </span>
              <Radio.Group
                value={selectedWoodOption}
                onChange={(e) => setSelectedWoodOption(e.target.value)}
                buttonStyle="solid"
                className="flex flex-wrap gap-2"
              >
                <Radio.Button value="walnut" className="rounded-none text-xs">Gỗ Óc Chó FAS</Radio.Button>
                <Radio.Button value="oak" className="rounded-none text-xs">Gỗ Sồi Trắng Nga</Radio.Button>
                <Radio.Button value="ash" className="rounded-none text-xs">Gỗ Tần Bì Ash</Radio.Button>
              </Radio.Group>
            </div>

            {/* Specifications list */}
            <div className="p-3.5 rounded-none bg-[#f5ece8] flex flex-col gap-1.5 text-xs text-[#51443d] mt-2 border border-[#eae1dd]">
              <div className="flex justify-between">
                <span className="text-[#83746c]">Kích thước:</span>
                <span className="font-semibold text-[#1f1b19]">{product.dimensions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#83746c]">Mã sản phẩm:</span>
                <span className="font-data-mono font-bold text-[#1f1b19]">{product.sku}</span>
              </div>
            </div>
          </div>

          {/* Quantity and Actions */}
          <div className="flex flex-col gap-3 pt-4 border-t border-[#eae1dd]">
            <div className="flex items-center justify-between">
              <span className="font-label-md text-xs text-[#1f1b19] font-semibold">Số lượng:</span>
              <InputNumber
                min={1}
                max={99}
                value={quantity}
                onChange={(val) => setQuantity(val || 1)}
                className="rounded-none border-[#d5c3ba]"
              />
            </div>

            <Button
              type="primary"
              size="large"
              onClick={handleAdd}
              block
              className="h-12 bg-[#5d371f] hover:!bg-[#784e34] font-title-md text-sm font-bold shadow-md rounded-none"
              icon={<ShoppingCartOutlined className="text-[18px]" />}
            >
              Thêm vào giỏ hàng ngay
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
