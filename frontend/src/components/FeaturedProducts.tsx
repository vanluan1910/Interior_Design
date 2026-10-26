'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import {
  ShoppingCartOutlined,
  CheckOutlined,
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
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const scrollPosRef = useRef<number>(0);
  const isInteractingRef = useRef<boolean>(false);

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

  // Filter products by category, search query
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

    return list;
  }, [shuffledProducts, products, activeCategory, searchQuery]);

  // Danh sách sản phẩm lặp vô tận liền mạch (seamless infinite loop) - tối đa 8-10 sản phẩm để mượt mà 60fps
  const displayList = useMemo(() => {
    const topFeatured = filteredProducts.slice(0, 10);
    if (topFeatured.length === 0) return { items: [] as Product[], baseLength: 0 };
    let base = [...topFeatured];
    while (base.length < 6) {
      base = [...base, ...topFeatured];
    }
    return {
      items: [...base, ...base],
      baseLength: base.length,
    };
  }, [filteredProducts]);

  const handleAdd = (p: Product) => {
    onAddToCart(p);
    setAddedId(p.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(val) + ' ₫';
  };

  // Hiệu ứng tự động lướt liên tục từ phải qua trái (smooth infinite continuous glide - không giật, đi từ từ qua)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || displayList.items.length === 0) return;

    let animId: number;
    // Tốc độ: ~0.75 pixel mỗi frame (~45px/giây tại 60fps) - nhẹ nhàng, từ tốn
    const speed = 0.75;

    const tick = () => {
      if (!isPaused && !isInteractingRef.current && container) {
        const firstCard = container.querySelector('[data-product-card]') as HTMLElement;
        const cardWidthWithGap = firstCard ? firstCard.offsetWidth + 24 : 340;
        const halfScrollWidth = displayList.baseLength * cardWidthWithGap;

        scrollPosRef.current += speed;

        // Khi trượt hết 1 vòng cơ bản, trừ đúng độ rộng đó để lặp lại vô tận liền mạch 100%
        if (halfScrollWidth > 0 && scrollPosRef.current >= halfScrollWidth) {
          scrollPosRef.current -= halfScrollWidth;
        }

        container.scrollLeft = scrollPosRef.current;

        // Cập nhật thanh tiến trình trực tiếp qua ref
        if (progressBarRef.current && halfScrollWidth > 0) {
          const progress = (scrollPosRef.current % halfScrollWidth) / halfScrollWidth;
          progressBarRef.current.style.transform = `translateX(${progress * 150}%)`;
        }
      } else if (container && !isInteractingRef.current) {
        scrollPosRef.current = container.scrollLeft;
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPaused, displayList]);

  // Hỗ trợ nút mũi tên trượt sang trái / phải 1 sản phẩm mượt mà
  const handleScroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const firstCard = container.querySelector('[data-product-card]') as HTMLElement;
    const step = firstCard ? firstCard.offsetWidth + 24 : 340;
    const halfScrollWidth = displayList.baseLength * step;

    isInteractingRef.current = true;

    if (direction === 'right') {
      scrollPosRef.current += step;
      if (halfScrollWidth > 0 && scrollPosRef.current >= halfScrollWidth) {
        scrollPosRef.current -= halfScrollWidth;
      }
    } else {
      scrollPosRef.current -= step;
      if (scrollPosRef.current < 0) {
        scrollPosRef.current += halfScrollWidth;
      }
    }

    container.scrollTo({ left: scrollPosRef.current, behavior: 'smooth' });

    setTimeout(() => {
      isInteractingRef.current = false;
    }, 600);
  };

  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'start 55%'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 85,
    damping: 26,
    restDelta: 0.001,
  });

  const headerY = useTransform(smoothProgress, [0, 0.8], [35, 0]);
  const pillsX = useTransform(smoothProgress, [0, 1], [-50, 0]);
  const searchX = useTransform(smoothProgress, [0, 1], [50, 0]);
  const carouselY = useTransform(smoothProgress, [0, 1], [50, 0]);
  const opacity = useTransform(smoothProgress, [0, 0.8], [0, 1]);

  return (
    <section ref={sectionRef} id="featured-products" className="w-full py-7 md:py-9 bg-gradient-to-b from-[#f3e9e1] via-[#ece0d6] to-[#f2e7df] overflow-hidden border-b border-[#dfcfc2]">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        
        {/* SECTION HEADER: TITLE CĂN CHÍNH GIỮA DÒNG (NỔI LÊN THEO ĐỘ LĂN CHUỘT) */}
        <motion.div
          style={{ y: headerY, opacity }}
          className="text-center mb-5 md:mb-6"
        >
          <h2 className="font-sans text-3xl sm:text-4xl lg:text-[42px] text-[#201a17] font-bold tracking-tight">
            Sản Phẩm Thủ Công Nổi Bật
          </h2>
        </motion.div>

        {/* SECTION CONTROLS: BỘ LỌC BÊN TRÁI & TÌM KIẾM BÊN PHẢI (TRƯỢT TỪ 2 BÊN VÀO THEO ĐỘ LĂN CHUỘT) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 mb-5 md:mb-6">
          {/* BỘ LỌC CATEGORY PILLS (TRƯỢT TỪ TRÁI VÀO) */}
          <motion.div
            style={{ x: pillsX, opacity }}
            className="flex flex-wrap items-center gap-1.5 sm:gap-2 bg-white/90 p-1.5 rounded-none shadow-xs border border-[#d5c3ba] backdrop-blur-md"
          >
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'living', label: 'Phòng Khách' },
              { id: 'bedroom', label: 'Phòng Ngủ' },
              { id: 'dining', label: 'Phòng Ăn' },
              { id: 'office', label: 'Làm Việc' },
            ].map((cat) => {
              const isActive = activeCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    onCategoryChange(cat.id);
                    scrollPosRef.current = 0;
                    if (scrollContainerRef.current) {
                      scrollContainerRef.current.scrollLeft = 0;
                    }
                  }}
                  className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-none text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center justify-center ${
                    isActive
                      ? 'bg-[#5d371f] text-white shadow-xs'
                      : 'text-[#51443d] hover:text-[#5d371f] hover:bg-[#f7f0ea]'
                  }`}
                >
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </motion.div>

          {/* FIELD TÌM KIẾM THEO TÊN / CHẤT LIỆU (TRƯỢT TỪ PHẢI VÀO) */}
          <motion.div
            style={{ x: searchX, opacity }}
            className="relative flex items-center w-full sm:w-auto"
          >
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
          </motion.div>
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
          <motion.div
            style={{ y: carouselY, opacity }}
            className="relative group/carousel"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          >
            
            {/* FLOATING LEFT ARROW BUTTON (<) */}
            <button
              type="button"
              onClick={() => handleScroll('left')}
              className="absolute -left-2 sm:-left-4 lg:-left-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-none bg-white/95 backdrop-blur-md text-[#5d371f] hover:bg-[#5d371f] hover:text-white border border-[#d5c3ba] shadow-md hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
              title="Lướt sang trái"
              aria-label="Lướt sang trái"
            >
              <span className="material-symbols-outlined text-[24px]">chevron_left</span>
            </button>

            {/* FLOATING RIGHT ARROW BUTTON (>) */}
            <button
              type="button"
              onClick={() => handleScroll('right')}
              className="absolute -right-2 sm:-right-4 lg:-right-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-none bg-white/95 backdrop-blur-md text-[#5d371f] hover:bg-[#5d371f] hover:text-white border border-[#d5c3ba] shadow-md hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
              title="Lướt sang phải"
              aria-label="Lướt sang phải"
            >
              <span className="material-symbols-outlined text-[24px]">chevron_right</span>
            </button>

            {/* HORIZONTAL PRODUCT TRACK */}
            <div
              ref={scrollContainerRef}
              className="flex flex-row overflow-x-auto gap-6 pb-6 pt-2 px-1 sm:px-2 no-scrollbar"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {displayList.items.map((p, idx) => {
                const isJustAdded = addedId === p.id;
                const isOutOfStock = false;

                return (
                  <div
                    key={`${p.id}-${idx}`}
                    data-product-card="true"
                    className="w-[85%] sm:w-[48%] md:w-[32%] lg:w-[calc((100%-72px)/4)] shrink-0 select-none"
                  >
                    <Link
                      href={`/products/${p.id}`}
                      className="group/card flex flex-col bg-white rounded-none overflow-hidden shadow-[0_4px_20px_rgba(93,55,31,0.06)] hover:border-[#5d371f] hover:shadow-[0_14px_30px_rgba(93,55,31,0.12)] border border-[#dfcfc2] transition-all duration-300 cursor-pointer text-inherit no-underline h-full"
                    >
                      {/* Image Container: Khung hình hàng ngang (aspect 16:10) không bị cắt xén sản phẩm */}
                      <div className="relative aspect-[16/10] bg-[#f7f0ea] overflow-hidden rounded-none border-b border-[#f0e3d9]">
                        <img
                          alt={p.name}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover/card:scale-108"
                          src={p.image}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/logo.png';
                          }}
                        />

                        {/* Badges: Wood Type */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1 items-start z-10 pointer-events-none">
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
                        </div>
                      </div>

                      {/* Information Container */}
                      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3">
                        <div>
                          {/* SKU */}
                          <div className="flex items-center text-[#83746c] text-[11px]">
                            <span className="font-mono text-[#83746c]/80">{p.sku}</span>
                          </div>

                          {/* Product Title */}
                          <h3 className="font-sans text-[16px] sm:text-[17px] text-[#1f1b19] font-semibold mt-1 group-hover/card:text-[#5d371f] transition-colors line-clamp-1 leading-snug">
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
                              <span className="font-sans text-[17px] sm:text-lg text-[#5d371f] font-bold tracking-tight leading-tight">
                                {formatPrice(p.price)}
                              </span>
                              {p.originalPrice && p.originalPrice > p.price && (
                                <span className="text-xs text-[#a89b93] line-through font-mono">
                                  {formatPrice(p.originalPrice)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Clean Quick Add Button (Không che khuất hình ảnh) */}
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
                ref={progressBarRef}
                className="h-full w-20 bg-[#5d371f] rounded-none will-change-transform"
                style={{
                  transform: 'translateX(0%)',
                }}
              />
            </div>

          </motion.div>
        )}

        {/* BOTTOM CTA: VIEW ALL CATALOG (NỔI LÊN) */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 text-center flex items-center justify-center gap-3"
        >
          <Link
            href={activeCategory === 'all' ? '/products' : `/products?space=${activeCategory}`}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-none bg-[#5d371f] text-white hover:bg-[#784e34] font-semibold text-xs sm:text-sm shadow-md hover:shadow-xl transition-all cursor-pointer no-underline group border border-[#784e34]"
          >
            <span>Xem toàn bộ {products.length}+ mẫu thiết kế</span>
            <ArrowRightOutlined className="text-[13px] transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>

      </div>
    </section>
  );
}
