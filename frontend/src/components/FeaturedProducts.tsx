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
  activeCategory?: string;
  onCategoryChange?: (category: string) => void;
  onQuickView?: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onToggleWishlist?: (productId: string) => void;
  wishlistIds?: string[];
}

export default function FeaturedProducts({
  products,
  onAddToCart,
  onToggleWishlist,
  wishlistIds = [],
}: FeaturedProductsProps) {
  const [addedId, setAddedId] = useState<string | null>(null);
  const [shuffledProducts, setShuffledProducts] = useState<Product[]>([]);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const scrollPosRef = useRef<number>(0);
  const isInteractingRef = useRef<boolean>(false);

  // Xáo trộn / random sản phẩm hiển thị, ưu tiên các sản phẩm có khuyến mãi / giảm giá
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

  // Toàn bộ danh sách sản phẩm hiển thị ngẫu nhiên trực tiếp (không bộ lọc)
  const displayProducts = useMemo(() => {
    return shuffledProducts.length > 0 ? shuffledProducts : products;
  }, [shuffledProducts, products]);

  // Danh sách sản phẩm lặp vô tận liền mạch (seamless infinite loop) cho carousel
  const displayList = useMemo(() => {
    const topFeatured = displayProducts.slice(0, 12);
    if (topFeatured.length === 0) return { items: [] as Product[], baseLength: 0 };
    let base = [...topFeatured];
    while (base.length < 6) {
      base = [...base, ...topFeatured];
    }
    return {
      items: [...base, ...base],
      baseLength: base.length,
    };
  }, [displayProducts]);

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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
  const carouselY = useTransform(smoothProgress, [0, 1], [40, 0]);
  const opacity = useTransform(smoothProgress, [0, 0.8], [0, 1]);

  return (
    <section ref={sectionRef} id="featured-products" className="w-full py-7 md:py-9 bg-gradient-to-b from-[#f3e9e1] via-[#ece0d6] to-[#f2e7df] overflow-hidden border-b border-[#dfcfc2]">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        
        {/* SECTION HEADER: TIÊU ĐỀ NỔI BẬT KHÔNG BỘ LỌC */}
        <motion.div
          style={{ y: headerY, opacity }}
          className="text-center mb-5 sm:mb-7 md:mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-1.5 sm:mb-2">
            <span className="h-[1px] w-5 sm:w-8 bg-[#bda291]"></span>
            <span className="text-[10px] sm:text-[11px] tracking-[0.22em] uppercase text-[#784e34] font-semibold">
              Bộ Sưu Tập Tuyển Chọn
            </span>
            <span className="h-[1px] w-5 sm:w-8 bg-[#bda291]"></span>
          </div>
          <h2 className="font-sans text-2xl xs:text-3xl sm:text-4xl lg:text-[42px] text-[#201a17] font-bold tracking-tight">
            Sản Phẩm Thủ Công Nổi Bật
          </h2>
        </motion.div>

        {/* NỘI DUNG SẢN PHẨM: TRƯỜNG HỢP RỖNG */}
        {displayProducts.length === 0 ? (
          <div className="py-16 text-center bg-white/80 border border-[#eae1dd] p-8 rounded-none shadow-xs">
            <h4 className="text-base font-semibold text-[#1f1b19]">
              Đang cập nhật danh mục sản phẩm nổi bật
            </h4>
            <Link
              href="/products"
              className="inline-block mt-4 px-6 py-2.5 bg-[#5d371f] text-white text-xs font-semibold rounded-none hover:bg-[#784e34] transition-colors no-underline"
            >
              Xem toàn bộ sản phẩm
            </Link>
          </div>
        ) : (
          <>
            {/* BỐ CỤC LƯỚI 2 CỘT DUY NHẤT DÀNH CHO MOBILE */}
            <div className="block sm:hidden">
              <div className="grid grid-cols-2 gap-2.5">
                {displayProducts.slice(0, 4).map((p) => {
                  const isJustAdded = addedId === p.id;
                  const discPercent = p.discountPercent && p.discountPercent > 0
                    ? p.discountPercent
                    : (p.originalPrice && p.originalPrice > p.price
                        ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
                        : 0);

                  return (
                    <div
                      key={`mob-grid-${p.id}`}
                      className="flex flex-col bg-white rounded-none overflow-hidden shadow-[0_2px_12px_rgba(93,55,31,0.06)] border border-[#dfcfc2] hover:border-[#5d371f] transition-all"
                    >
                      {/* Ảnh sản phẩm (tỉ lệ 4:3 sắc nét) */}
                      <Link
                        href={`/products/${p.id}`}
                        className="block relative aspect-[4/3] bg-[#f7f0ea] overflow-hidden border-b border-[#f0e3d9] text-inherit no-underline group"
                      >
                        <img
                          alt={p.name}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                          src={p.image}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/logo.png';
                          }}
                        />

                        {/* Badges trên ảnh */}
                        <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 items-start z-10 pointer-events-none">
                          {discPercent > 0 && (
                            <span className="px-1.5 py-0.5 bg-[#ba1a1a] text-white text-[9px] font-bold shadow-xs">
                              -{discPercent}%
                            </span>
                          )}
                          {p.woodType && (
                            <span className="px-1.5 py-0.5 bg-white/95 text-[#1f1b19] text-[8px] font-medium backdrop-blur-xs border border-white/60 shadow-2xs truncate max-w-[95px]">
                              {p.woodType}
                            </span>
                          )}
                        </div>
                      </Link>

                      {/* Thông tin sản phẩm */}
                      <div className="p-2.5 flex flex-col justify-between flex-1 gap-2 bg-white">
                        <div>
                          <div className="flex items-center justify-between text-[9px] font-mono text-[#83746c]/80 truncate">
                            <span>{p.sku}</span>
                            <span className="text-[#5d371f] font-sans font-medium text-[9px]">
                              {p.inStock ? 'Sẵn hàng' : 'Đặt đóng'}
                            </span>
                          </div>
                          <Link href={`/products/${p.id}`} className="no-underline text-inherit block">
                            <h3 className="font-sans text-[12.5px] font-semibold text-[#1f1b19] line-clamp-2 leading-snug mt-0.5 hover:text-[#5d371f] transition-colors">
                              {p.name}
                            </h3>
                          </Link>
                          <p className="text-[10px] text-[#83746c] truncate mt-0.5">
                            {p.subtitle || p.dimensions || 'Nghệ nhân Mộc Gia'}
                          </p>
                        </div>

                        {/* Giá & Nút giỏ hàng */}
                        <div className="pt-2 border-t border-[#f0e3db] flex items-center justify-between gap-1">
                          <div className="flex flex-col min-w-0">
                            <span className="font-sans text-[13px] xs:text-[14px] text-[#5d371f] font-bold tracking-tight truncate leading-none">
                              {formatPrice(p.price)}
                            </span>
                            {p.originalPrice && p.originalPrice > p.price && (
                              <span className="text-[10px] text-[#a89b93] line-through font-mono mt-0.5 truncate">
                                {formatPrice(p.originalPrice)}
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            aria-label="Thêm vào giỏ"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleAdd(p);
                            }}
                            className={`w-7 h-7 shrink-0 rounded-none flex items-center justify-center text-white transition-all cursor-pointer ${
                              isJustAdded ? 'bg-[#3f4332]' : 'bg-[#5d371f] active:scale-90 hover:bg-[#784e34]'
                            }`}
                            title="Thêm nhanh vào giỏ"
                          >
                            {isJustAdded ? (
                              <CheckOutlined className="text-[11px]" />
                            ) : (
                              <ShoppingCartOutlined className="text-[12px]" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* BỐ CỤC LƯỚT THẺ (CAROUSEL): DÀNH CHO DESKTOP */}
            <motion.div
              style={{ y: carouselY, opacity }}
              className="relative group/carousel hidden sm:block"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
            
            {/* FLOATING LEFT ARROW BUTTON (<) */}
            <button
              type="button"
              onClick={() => handleScroll('left')}
              className="hidden sm:flex absolute -left-2 sm:-left-4 lg:-left-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-none bg-white/95 backdrop-blur-md text-[#5d371f] hover:bg-[#5d371f] hover:text-white border border-[#d5c3ba] shadow-md hover:shadow-xl items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
              title="Lướt sang trái"
              aria-label="Lướt sang trái"
            >
              <span className="material-symbols-outlined text-[24px]">chevron_left</span>
            </button>

            {/* FLOATING RIGHT ARROW BUTTON (>) */}
            <button
              type="button"
              onClick={() => handleScroll('right')}
              className="hidden sm:flex absolute -right-2 sm:-right-4 lg:-right-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-none bg-white/95 backdrop-blur-md text-[#5d371f] hover:bg-[#5d371f] hover:text-white border border-[#d5c3ba] shadow-md hover:shadow-xl items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
              title="Lướt sang phải"
              aria-label="Lướt sang phải"
            >
              <span className="material-symbols-outlined text-[24px]">chevron_right</span>
            </button>

            {/* HORIZONTAL PRODUCT TRACK */}
            <div
              ref={scrollContainerRef}
              className="flex flex-row overflow-x-auto gap-4 sm:gap-6 pb-6 pt-2 px-1 sm:px-2 no-scrollbar snap-x snap-mandatory sm:snap-none touch-pan-x"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {displayList.items.map((p, idx) => {
                const isJustAdded = addedId === p.id;
                const isOutOfStock = false;

                return (
                  <div
                    key={`${p.id}-${idx}`}
                    data-product-card="true"
                    className="w-[82%] sm:w-[48%] md:w-[32%] lg:w-[calc((100%-72px)/4)] shrink-0 select-none snap-center sm:snap-align-none"
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
        </>
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
            href="/products"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-none bg-[#5d371f] text-white hover:bg-[#784e34] font-semibold text-xs sm:text-sm shadow-md hover:shadow-xl transition-all cursor-pointer no-underline group border border-[#784e34]"
          >
            <span>Xem toàn bộ mẫu thiết kế</span>
            <ArrowRightOutlined className="text-[13px] transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>

      </div>
    </section>
  );
}
