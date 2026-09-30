'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  EyeOutlined,
  ShoppingCartOutlined,
  CheckOutlined,
  StarFilled,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { Product } from '@/types';

interface FeaturedProductsProps {
  products: Product[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  onQuickView: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onToggleWishlist: (productId: string) => void;
  wishlistIds: string[];
}

export default function FeaturedProducts({
  products,
  activeCategory,
  onCategoryChange,
  onQuickView,
  onAddToCart,
  onToggleWishlist,
  wishlistIds,
}: FeaturedProductsProps) {
  const [addedId, setAddedId] = useState<string | null>(null);

  const filteredProducts =
    activeCategory === 'all'
      ? products
      : products.filter((p) => p.category === activeCategory);

  const handleAdd = (p: Product) => {
    onAddToCart(p);
    setAddedId(p.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(val) + ' ₫';
  };

  return (
    <section id="featured-products" className="w-full py-16 md:py-24 bg-[#fbf2ee]">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <span className="font-label-sm text-xs uppercase tracking-widest text-[#5d371f] font-semibold">
              Tuyển Chọn Độc Quyền
            </span>
            <h2 className="font-headline-lg text-2xl sm:text-3xl md:text-4xl text-[#1f1b19] mt-1 font-normal">
              Sản Phẩm Thủ Công Nổi Bật
            </h2>
          </div>

          {/* Filter Categories */}
          <div className="flex flex-wrap items-center gap-1.5 bg-white p-1.5 rounded-none shadow-sm border border-[#d5c3ba]/50">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'living', label: 'Phòng Khách' },
              { id: 'bedroom', label: 'Phòng Ngủ' },
              { id: 'dining', label: 'Bàn Ghế Ăn' },
              { id: 'office', label: 'Góc Làm Việc' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => onCategoryChange(cat.id)}
                className={`px-3.5 py-1.5 rounded-none text-xs font-semibold transition-all cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-[#5d371f] text-white shadow-sm'
                    : 'text-[#51443d] hover:text-[#5d371f] hover:bg-[#f5ece8]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((p) => {
            const isWishlisted = wishlistIds.includes(p.id);
            const isJustAdded = addedId === p.id;

            return (
              <div
                key={p.id}
                className="group flex flex-col bg-white rounded-none overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-[#eae1dd]/60 hover-lift"
              >
                {/* Image Container */}
                <div className="relative aspect-[4/5] bg-[#eae1dd] overflow-hidden">
                  <img
                    alt={p.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    src={p.image}
                  />

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
                    {p.tag && (
                      <span className="px-2.5 py-0.5 rounded-none bg-[#5d371f] text-white font-label-sm text-[11px] font-semibold shadow-sm">
                        {p.tag}
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 rounded-none bg-[#eae1dd]/95 text-[#1f1b19] font-label-sm text-[11px] backdrop-blur-sm border border-[#d5c3ba]/40">
                      {p.woodType}
                    </span>
                  </div>

                  {/* Quick View & Add to Cart Overlay */}
                  <div className="absolute inset-x-3 bottom-3 flex gap-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    <Link
                      href={`/products/${p.id}`}
                      style={{ backgroundColor: '#ffffff' }}
                      className="flex-1 py-2.5 rounded-none bg-white text-[#1f1b19] font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition-all border border-[#d5c3ba] hover:!bg-[#5d371f] hover:!text-white hover:!border-[#5d371f] cursor-pointer"
                    >
                      <EyeOutlined className="text-[15px]" />
                      <span className="font-bold text-xs tracking-wide">Xem chi tiết</span>
                    </Link>
                    <button
                      aria-label="Thêm vào giỏ"
                      onClick={() => handleAdd(p)}
                      className={`p-2.5 rounded-none text-white shadow-md flex items-center justify-center transition-all cursor-pointer ${
                        isJustAdded ? 'bg-[#3f4332]' : 'bg-[#5d371f] hover:bg-[#784e34]'
                      }`}
                    >
                      {isJustAdded ? (
                        <CheckOutlined className="text-[16px]" />
                      ) : (
                        <ShoppingCartOutlined className="text-[16px]" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Info Container */}
                <div className="p-4 flex flex-col flex-1 justify-between gap-2">
                  <div>
                    <div className="flex items-center justify-between text-[#83746c]">
                      <span className="font-data-mono text-[11px]">{p.sku}</span>
                      <div className="flex items-center gap-1 text-[#5d371f]">
                        <StarFilled className="text-[#5d371f] text-[12px]" />
                        <span className="font-data-mono text-[11px] font-medium">
                          {p.rating} ({p.reviewCount})
                        </span>
                      </div>
                    </div>
                    <h3 className="font-title-md text-[15px] text-[#1f1b19] font-semibold mt-1 group-hover:text-[#5d371f] transition-colors line-clamp-1">
                      <Link href={`/products/${p.id}`} className="hover:underline">
                        {p.name}
                      </Link>
                    </h3>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#eae1dd]/40">
                    <div className="flex flex-col">
                      <span className="font-title-lg text-base text-[#5d371f] font-bold">
                        {formatPrice(p.price)}
                      </span>
                      {p.originalPrice && (
                        <span className="font-data-mono text-[10px] text-[#83746c] line-through">
                          {formatPrice(p.originalPrice)}
                        </span>
                      )}
                    </div>
                    <span className="font-label-sm text-[11px] text-[#3f4332] bg-[#e1e5ce]/50 px-2 py-0.5 rounded-none font-medium">
                      {p.stockStatus}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* View All CTA */}
        <div className="mt-12 text-center">
          <button
            onClick={() => onCategoryChange('all')}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-none bg-white text-[#5d371f] font-title-md text-sm sm:text-base shadow-sm hover:shadow-md border border-[#d5c3ba]/60 hover:bg-[#fff8f5] transition-all cursor-pointer"
          >
            <span>Xem trọn bộ 120+ sản phẩm thiết kế</span>
            <ArrowRightOutlined className="text-[14px]" />
          </button>
        </div>
      </div>
    </section>
  );
}
