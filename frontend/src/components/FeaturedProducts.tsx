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

  const categoryCounts = {
    all: products.length,
    living: products.filter((p) => p.category === 'living').length,
    bedroom: products.filter((p) => p.category === 'bedroom').length,
    dining: products.filter((p) => p.category === 'dining').length,
    office: products.filter((p) => p.category === 'office').length,
  };

  const filteredProducts =
    activeCategory === 'all'
      ? products.slice(0, 8)
      : products.filter((p) => p.category === activeCategory).slice(0, 8);

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
              { id: 'dining', label: 'Phòng Ăn' },
              { id: 'office', label: 'Phòng Làm Việc' },
            ].map((cat) => {
              const count = categoryCounts[cat.id as keyof typeof categoryCounts] || 0;
              return (
                <button
                  key={cat.id}
                  onClick={() => onCategoryChange(cat.id)}
                  className={`px-3.5 py-1.5 rounded-none text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeCategory === cat.id
                      ? 'bg-[#5d371f] text-white shadow-sm'
                      : 'text-[#51443d] hover:text-[#5d371f] hover:bg-[#f5ece8]'
                  }`}
                >
                  <span>{cat.label}</span>
                  {count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-none font-mono ${
                        activeCategory === cat.id
                          ? 'bg-white/20 text-white'
                          : 'bg-[#f0e8e4] text-[#83746c]'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="py-16 text-center bg-white/70 border border-[#eae1dd] p-8">
            <h4 className="text-base font-semibold text-[#1f1b19]">Chưa có sản phẩm trong không gian này</h4>
            <p className="text-sm text-[#83746c] mt-1">
              Khám phá thêm các tuyệt tác thủ công khác trong danh mục sản phẩm của D2 Luxury.
            </p>
            <Link
              href="/products"
              className="inline-block mt-4 px-6 py-2.5 bg-[#5d371f] text-white text-xs font-semibold hover:bg-[#784e34] transition-colors no-underline"
            >
              Xem toàn bộ sản phẩm
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((p) => {
              const isJustAdded = addedId === p.id;

              return (
                <Link
                  key={p.id}
                  href={`/products/${p.id}`}
                  className="group flex flex-col bg-white rounded-none overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-[#eae1dd]/60 hover-lift cursor-pointer text-inherit no-underline"
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
                      {p.woodType && (
                        <span className="px-2.5 py-0.5 rounded-none bg-[#eae1dd]/95 text-[#1f1b19] font-label-sm text-[11px] backdrop-blur-sm border border-[#d5c3ba]/40 font-medium">
                          {p.woodType}
                        </span>
                      )}
                    </div>

                    {/* Quick Add to Cart Button */}
                    <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <button
                        type="button"
                        aria-label="Thêm vào giỏ"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleAdd(p);
                        }}
                        className={`p-2.5 rounded-none text-white shadow-md flex items-center justify-center transition-all cursor-pointer ${
                          isJustAdded ? 'bg-[#3f4332]' : 'bg-[#5d371f] hover:bg-[#784e34]'
                        }`}
                        title="Thêm nhanh vào giỏ hàng"
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
                        {p.name}
                      </h3>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#eae1dd]/40">
                      <div className="flex flex-col">
                        <span className="font-title-lg text-base text-[#5d371f] font-bold">
                          {formatPrice(p.price)}
                        </span>
                      </div>
                      <span className="font-label-sm text-[11px] text-[#3f4332] bg-[#e1e5ce]/50 px-2 py-0.5 rounded-none font-medium">
                        {p.stockStatus}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* View All CTA */}
        <div className="mt-12 text-center">
          <Link
            href={activeCategory === 'all' ? '/products' : `/products?space=${activeCategory}`}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-none bg-white text-[#5d371f] font-title-md text-sm sm:text-base shadow-sm hover:shadow-md border border-[#d5c3ba]/60 hover:bg-[#fff8f5] transition-all cursor-pointer no-underline"
          >
            <span>Khám phá trọn bộ sưu tập thiết kế</span>
            <ArrowRightOutlined className="text-[14px]" />
          </Link>
        </div>
      </div>
    </section>
  );
}
