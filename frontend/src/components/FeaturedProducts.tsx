'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
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
  onAddToCart,
}: FeaturedProductsProps) {
  const [addedId, setAddedId] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [shuffledProducts, setShuffledProducts] = useState<Product[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Randomize / shuffle products on initial load, prioritizing items on sale / discount
  useEffect(() => {
    if (products && products.length > 0) {
      const copy = [...products];
      const promoItems = copy.filter(
        (p) => (p.discountPercent && p.discountPercent > 0) || (p.originalPrice && p.originalPrice > p.price)
      );
      const regularItems = copy.filter(
        (p) => !((p.discountPercent && p.discountPercent > 0) || (p.originalPrice && p.originalPrice > p.price))
      );

      // Shuffle regular items
      for (let i = regularItems.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [regularItems[i], regularItems[j]] = [regularItems[j], regularItems[i]];
      }

      setShuffledProducts([...promoItems, ...regularItems]);
    }
  }, [products]);

  const categoryCounts = {
    all: products.length,
    living: products.filter((p) => p.category === 'living').length,
    bedroom: products.filter((p) => p.category === 'bedroom').length,
    dining: products.filter((p) => p.category === 'dining').length,
    office: products.filter((p) => p.category === 'office').length,
  };

  // Filter products by category, search query, and provide cyclical continuous list
  const filteredProducts = useMemo(() => {
    const source = shuffledProducts.length > 0 ? shuffledProducts : products;
    let list =
      activeCategory === 'all'
        ? [...source]
        : source.filter((p) => p.category === activeCategory);

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.woodType && p.woodType.toLowerCase().includes(q)) ||
          (p.subtitle && p.subtitle.toLowerCase().includes(q)) ||
          (p.categoryName && p.categoryName.toLowerCase().includes(q))
      );
    }

    // If no search filter active, repeat to ensure endless cyclical scrolling experience
    if (!searchQuery.trim() && list.length > 0 && list.length < 16) {
      return [...list, ...list, ...list].slice(0, 24);
    }

    return list;
  }, [shuffledProducts, products, activeCategory, searchQuery]);

  const handleAdd = (p: Product) => {
    if (!p.inStock || p.stockStatus === 'Hết hàng') {
      return;
    }
    onAddToCart(p);
    setAddedId(p.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(val) + ' ₫';
  };

  // Track horizontal scroll progress
  const handleScrollUpdate = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      const maxScroll = scrollWidth - clientWidth;
      if (maxScroll > 0) {
        setScrollProgress((scrollLeft / maxScroll) * 100);
      } else {
        setScrollProgress(0);
      }
    }
  };

  useEffect(() => {
    handleScrollUpdate();
  }, [filteredProducts]);

  // Scroll 4 products at a time with infinite loop (quay lại đầu khi chạm đáy)
  const handleScroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const clientWidth = container.clientWidth;
    const scrollLeft = container.scrollLeft;
    const scrollWidth = container.scrollWidth;
    const maxScroll = scrollWidth - clientWidth;
    
    // Width of 4 product cards (exact clientWidth)
    const scrollStep = clientWidth;

    if (direction === 'right') {
      // Khi lướt đến cuối: Tự động quay lại các sản phẩm ở đầu mượt mà
      if (scrollLeft >= maxScroll - 35) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        // Trượt sang 4 sản phẩm tiếp theo
        const target = Math.min(scrollLeft + scrollStep, maxScroll);
        container.scrollTo({ left: target, behavior: 'smooth' });
      }
    } else {
      // Khi đang ở đầu và bấm sang trái: Quay về các sản phẩm cuối
      if (scrollLeft <= 35) {
        container.scrollTo({ left: maxScroll, behavior: 'smooth' });
      } else {
        // Trượt lùi 4 sản phẩm
        const target = Math.max(scrollLeft - scrollStep, 0);
        container.scrollTo({ left: target, behavior: 'smooth' });
      }
    }
  };

  return (
    <section id="featured-products" className="w-full py-7 md:py-9 bg-gradient-to-b from-[#f3e9e1] via-[#ece0d6] to-[#f2e7df] overflow-hidden border-b border-[#dfcfc2]">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        
        {/* SECTION HEADER: TITLE CĂN CHÍNH GIỮA DÒNG */}
        <div className="text-center mb-5 md:mb-6">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-[42px] text-[#201a17] font-normal tracking-tight">
            Sản Phẩm Thủ Công Nổi Bật
          </h2>
        </div>

        {/* SECTION CONTROLS: BỘ LỌC BÊN TRÁI & TÌM KIẾM BÊN PHẢI DƯỚI TÊN SECTION */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 mb-5 md:mb-6">
          {/* BỘ LỌC CATEGORY PILLS (BÊN TRÁI) */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 bg-white/90 p-1.5 rounded-none shadow-xs border border-[#d5c3ba] backdrop-blur-md">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'living', label: 'Phòng Khách' },
              { id: 'bedroom', label: 'Phòng Ngủ' },
              { id: 'dining', label: 'Phòng Ăn' },
              { id: 'office', label: 'Làm Việc' },
            ].map((cat) => {
              const count = categoryCounts[cat.id as keyof typeof categoryCounts] || 0;
              const isActive = activeCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    onCategoryChange(cat.id);
                    if (scrollContainerRef.current) {
                      scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                    }
                  }}
                  className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-none text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#5d371f] text-white shadow-xs'
                      : 'text-[#51443d] hover:text-[#5d371f] hover:bg-[#f7f0ea]'
                  }`}
                >
                  <span>{cat.label}</span>
                  {count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-none font-mono ${
                        isActive
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

          {/* FIELD TÌM KIẾM THEO TÊN / CHẤT LIỆU (BÊN PHẢI) */}
          <div className="relative flex items-center w-full sm:w-auto">
            <span className="material-symbols-outlined text-[18px] text-[#83746c] absolute left-3 pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm sản phẩm, gỗ..."
              className="pl-9 pr-8 py-2 rounded-none bg-white/95 border border-[#d5c3ba] text-xs text-[#1f1b19] placeholder-[#83746c] focus:outline-none focus:border-[#5d371f] focus:ring-1 focus:ring-[#5d371f] transition-all w-full sm:w-56 md:w-64 shadow-xs backdrop-blur-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-[#83746c] hover:text-[#1f1b19] cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <span className="material-symbols-outlined text-[15px]">close</span>
              </button>
            )}
          </div>
        </div>

        {/* 1 SINGLE HORIZONTAL SCROLLING ROW (TRƯỢT 4 SẢN PHẨM / LẦN & VÒNG LẶP VÔ TẬN) */}
        {filteredProducts.length === 0 ? (
          <div className="py-16 text-center bg-white/80 border border-[#eae1dd] p-8 rounded-none shadow-xs">
            <h4 className="text-base font-semibold text-[#1f1b19]">
              {searchQuery ? `Không tìm thấy sản phẩm "${searchQuery}"` : 'Chưa có sản phẩm trong không gian này'}
            </h4>
            <p className="text-sm text-[#83746c] mt-1">
              {searchQuery
                ? 'Thử tìm kiếm với từ khóa khác như: sofa, bàn ăn, giường, gỗ óc chó...'
                : 'Khám phá thêm các tuyệt tác thủ công khác trong danh mục sản phẩm của D2 Luxury.'}
            </p>
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-4 px-6 py-2.5 bg-[#5d371f] text-white text-xs font-semibold rounded-none hover:bg-[#784e34] transition-colors cursor-pointer"
              >
                Xóa bộ lọc tìm kiếm
              </button>
            ) : (
              <Link
                href="/products"
                className="inline-block mt-4 px-6 py-2.5 bg-[#5d371f] text-white text-xs font-semibold rounded-none hover:bg-[#784e34] transition-colors no-underline"
              >
                Xem toàn bộ sản phẩm
              </Link>
            )}
          </div>
        ) : (
          <div className="relative group/carousel">
            
            {/* FLOATING LEFT ARROW BUTTON (<) */}
            <button
              type="button"
              onClick={() => handleScroll('left')}
              className="absolute -left-2 sm:-left-4 lg:-left-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-none bg-white/95 backdrop-blur-md text-[#5d371f] hover:bg-[#5d371f] hover:text-white border border-[#d5c3ba] shadow-md hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
              title="Lướt sang trái (4 sản phẩm)"
              aria-label="Lướt sang trái"
            >
              <span className="material-symbols-outlined text-[24px]">chevron_left</span>
            </button>

            {/* FLOATING RIGHT ARROW BUTTON (>) */}
            <button
              type="button"
              onClick={() => handleScroll('right')}
              className="absolute -right-2 sm:-right-4 lg:-right-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-none bg-white/95 backdrop-blur-md text-[#5d371f] hover:bg-[#5d371f] hover:text-white border border-[#d5c3ba] shadow-md hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
              title="Lướt sang phải (4 sản phẩm)"
              aria-label="Lướt sang phải"
            >
              <span className="material-symbols-outlined text-[24px]">chevron_right</span>
            </button>

            {/* HORIZONTAL PRODUCT TRACK */}
            <div
              ref={scrollContainerRef}
              onScroll={handleScrollUpdate}
              className="flex flex-row overflow-x-auto snap-x snap-mandatory gap-6 pb-6 pt-2 px-1 sm:px-2 no-scrollbar scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {filteredProducts.map((p, idx) => {
                const isJustAdded = addedId === p.id;
                const isOutOfStock = !p.inStock || p.stockStatus === 'Hết hàng';

                return (
                  <div
                    key={`${p.id}-${idx}`}
                    className="w-[85%] sm:w-[48%] md:w-[32%] lg:w-[calc((100%-72px)/4)] shrink-0 snap-start"
                  >
                    <Link
                      href={`/products/${p.id}`}
                      className="group/card flex flex-col bg-white rounded-none overflow-hidden shadow-[0_4px_20px_rgba(93,55,31,0.06)] hover:border-[#5d371f] hover:shadow-[0_14px_30px_rgba(93,55,31,0.12)] border border-[#dfcfc2] transition-all duration-300 cursor-pointer text-inherit no-underline h-full"
                    >
                      {/* Image Container: Khung hình hàng ngang (aspect 16:10) không bị cắt xén sản phẩm */}
                      <div className="relative aspect-[16/10] bg-[#f7f0ea] overflow-hidden rounded-none border-b border-[#f0e3d9]">
                        <img
                          alt={p.name}
                          className={`w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover/card:scale-108 ${
                            isOutOfStock ? 'grayscale-[40%] opacity-80' : ''
                          }`}
                          src={p.image}
                        />

                        {/* Badges: Wood Type & Out of Stock */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1 items-start z-10 pointer-events-none">
                          {isOutOfStock ? (
                            <span className="px-2.5 py-0.5 rounded-none bg-[#ba1a1a] text-white text-[10px] font-bold shadow-xs">
                              Hết hàng
                            </span>
                          ) : (
                            <>
                              {p.originalPrice && p.originalPrice > p.price && (
                                <span className="px-2.5 py-0.5 rounded-none bg-[#ba1a1a] text-white text-[10px] font-bold shadow-xs">
                                  -{p.discountPercent && p.discountPercent > 0 ? p.discountPercent : Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)}%
                                </span>
                              )}
                              {p.woodType ? (
                                <span className="px-2.5 py-0.5 rounded-none bg-white/95 text-[#1f1b19] text-[10px] backdrop-blur-md border border-white/60 font-medium shadow-xs">
                                  {p.woodType}
                                </span>
                              ) : null}
                            </>
                          )}
                        </div>

                        {/* Out of Stock Overlay */}
                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-black/35 flex items-center justify-center pointer-events-none z-10">
                            <span className="px-3.5 py-1.5 bg-[#ba1a1a] text-white text-xs font-bold uppercase tracking-wider shadow-md rounded-none">
                              Hết hàng
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Information Container */}
                      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3">
                        <div>
                          {/* SKU & Rating */}
                          <div className="flex items-center justify-between text-[#83746c] text-[11px]">
                            <span className="font-mono text-[#83746c]/80">{p.sku}</span>
                            <div className="flex items-center gap-1 text-[#5d371f]">
                              <StarFilled className="text-[#5d371f] text-[11px]" />
                              <span className="font-mono font-medium">
                                {p.rating} ({p.reviewCount})
                              </span>
                            </div>
                          </div>

                          {/* Product Title */}
                          <h3 className="font-serif text-[16px] sm:text-[17px] text-[#1f1b19] font-medium mt-1 group-hover/card:text-[#5d371f] transition-colors line-clamp-1 leading-snug">
                            {p.name}
                          </h3>

                          {/* Subtitle / Wood Specs */}
                          <p className="text-xs text-[#83746c] line-clamp-1 mt-1 leading-relaxed">
                            {p.subtitle || p.dimensions || 'Nghệ nhân Mộc Gia chế tác'}
                          </p>
                        </div>

                        {/* Price, Stock & Add to Cart Action */}
                        <div className="flex items-center justify-between pt-3 border-t border-[#f0e3db]">
                          <div className="flex flex-col">
                            <div className="flex items-baseline gap-2">
                              <span className="font-serif text-[17px] sm:text-lg text-[#5d371f] font-bold tracking-tight leading-tight">
                                {formatPrice(p.price)}
                              </span>
                              {p.originalPrice && p.originalPrice > p.price && (
                                <span className="text-xs text-[#a89b93] line-through font-mono">
                                  {formatPrice(p.originalPrice)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span
                                className={`text-[10px] font-medium ${
                                  isOutOfStock
                                    ? 'text-[#ba1a1a] font-bold'
                                    : 'text-[#3f4332]'
                                }`}
                              >
                                {isOutOfStock ? 'Hết hàng' : p.stockStatus || 'Còn hàng'}
                              </span>
                              {p.originalPrice && p.originalPrice > p.price && (
                                <span className="text-[10px] font-bold text-red-600 bg-red-100/80 px-1 py-0.2 rounded-none">
                                  -{p.discountPercent && p.discountPercent > 0 ? p.discountPercent : Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)}%
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Clean Quick Add Button (Không che khuất hình ảnh) */}
                          {!isOutOfStock && (
                            <button
                              type="button"
                              aria-label="Thêm vào giỏ"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleAdd(p);
                              }}
                              className={`px-3 py-1.5 rounded-none text-white text-xs font-medium shadow-xs flex items-center gap-1.5 transition-all duration-300 hover:scale-102 active:scale-98 cursor-pointer ${
                                isJustAdded ? 'bg-[#3f4332]' : 'bg-[#5d371f] hover:bg-[#784e34]'
                              }`}
                              title="Thêm nhanh vào giỏ hàng"
                            >
                              {isJustAdded ? (
                                <>
                                  <CheckOutlined className="text-[13px]" />
                                  <span className="text-[11px]">Đã thêm</span>
                                </>
                              ) : (
                                <>
                                  <ShoppingCartOutlined className="text-[13px]" />
                                  <span className="text-[11px]">Thêm</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* MINIMALIST SCROLL PROGRESS INDICATOR */}
            <div className="w-48 h-1 bg-[#dfcfc2] rounded-none mx-auto overflow-hidden mt-4">
              <div
                className="h-full bg-[#5d371f] rounded-none transition-all duration-200"
                style={{
                  width: `${Math.max(20, scrollProgress)}%`,
                  transform: `translateX(${scrollProgress * 0.8}%)`,
                }}
              />
            </div>

          </div>
        )}

        {/* BOTTOM CTA: VIEW ALL CATALOG */}
        <div className="mt-10 text-center flex items-center justify-center gap-3">
          <Link
            href={activeCategory === 'all' ? '/products' : `/products?space=${activeCategory}`}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-none bg-[#5d371f] text-white hover:bg-[#784e34] font-semibold text-xs sm:text-sm shadow-md hover:shadow-xl transition-all cursor-pointer no-underline group border border-[#784e34]"
          >
            <span>Xem toàn bộ {products.length}+ mẫu thiết kế</span>
            <ArrowRightOutlined className="text-[13px] transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

      </div>
    </section>
  );
}
