'use client';

import React, { useState, useMemo, use, useEffect } from 'react';
import Link from 'next/link';

import { useRouter } from 'next/navigation';
import { Modal, Tag, Rate, Tooltip, App, Button } from 'antd';
import {
  ShoppingCartOutlined,
  EyeOutlined,
  CheckOutlined,
  StarFilled,
  ArrowRightOutlined,
  RightOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  CloseOutlined,
  CheckCircleFilled,
  CheckCircleOutlined,
  PlusOutlined,
  MinusOutlined,
  CarOutlined,
  SafetyCertificateOutlined,
  GiftOutlined,
  ToolOutlined,
  SunOutlined,
  ClearOutlined,
  SmileOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SampleBoxModal from '@/components/SampleBoxModal';
import QuickViewModal from '@/components/QuickViewModal';
import { Product, CartItem } from '@/types';
import { useCart } from '@/context/CartContext';
import { productApi, FeaturedCatalogProduct } from '@/api/productApi';

function mapCatalogToDetailProduct(item: FeaturedCatalogProduct): Product {
  const rawSpace = (item.space || '').toLowerCase();
  let space: 'living' | 'bedroom' | 'dining' | 'office' = 'living';
  if (rawSpace.includes('bed') || rawSpace.includes('ngủ')) space = 'bedroom';
  else if (rawSpace.includes('din') || rawSpace.includes('ăn')) space = 'dining';
  else if (rawSpace.includes('off') || rawSpace.includes('việc')) space = 'office';
  else space = 'living';

  const spaceNames: Record<string, string> = {
    living: 'Phòng Khách',
    bedroom: 'Phòng Ngủ',
    dining: 'Phòng Ăn',
    office: 'Phòng Làm Việc',
  };

  const subCategoryName = item.categoryName && item.categoryName !== spaceNames[space] ? item.categoryName : undefined;

  // Extract all real images from backend (images list or subImages)
  let images: string[] = [];
  if (Array.isArray(item.images) && item.images.length > 0) {
    images = item.images.filter((img) => typeof img === 'string' && img.trim().length > 0);
  } else if (item.subImages) {
    images = item.subImages.split(/[\n,]+/).map((s) => s.trim()).filter((s) => s.length > 0);
  }
  if (item.image && !images.includes(item.image)) {
    images = [item.image, ...images];
  }
  if (images.length === 0 && item.image) {
    images = [item.image];
  }

  return {
    id: item.id,
    sku: item.code || `SP-${item.id.slice(0, 5)}`,
    name: item.name,
    category: space,
    categoryName: spaceNames[space] || 'Phòng Khách',
    spaceName: spaceNames[space],
    subCategoryName,
    price: item.price,
    originalPrice: item.originalPrice && item.originalPrice > item.price ? item.originalPrice : undefined,
    image: item.image || (images.length > 0 ? images[0] : '/logo.png'),
    images: images.length > 0 ? images : (item.image ? [item.image] : []),
    subImages: item.subImages,
    tag: item.stockNote || item.collection || 'Tuyệt phẩm mộc',
    woodType: item.material || item.metaInfo || 'Gỗ tự nhiên cao cấp',
    rating: 5.0,
    reviewCount: 48,
    subtitle: item.collection || item.material || 'Chế tác mộng mộc truyền thống',
    description: item.description || `Sản phẩm ${item.name} chế tác tỉ mỉ từ gỗ tự nhiên tuyển chọn bởi nghệ nhân D2 LUXURY.`,
    dimensions: item.dimensions || 'Theo thiết kế tiêu chuẩn',
    stockStatus: item.stockType === 'custom' ? 'Đặt may đo (7-14 ngày)' : 'Sẵn tại Showroom',
    inStock: item.stockType !== 'custom',
    materialDetails: item.material || item.metaInfo || 'Gỗ tự nhiên sấy chân không đạt chuẩn',
    material: item.material || item.metaInfo,
    color: item.color || 'Nâu hạt dẻ / tự nhiên (Đa dạng)',
    warranty: item.warranty || '24 tháng',
    shippingNote: item.shippingNote || 'Miễn phí giao hàng và lắp đặt toàn quốc.',
  };
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { message } = App.useApp();
  const router = useRouter();

  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [companionProducts, setCompanionProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load product dynamically from Database API
  useEffect(() => {
    let isMounted = true;
    async function loadProductData() {
      setIsLoading(true);
      try {
        const detailResult = await productApi.getProductDetail(id, 4);

        if (isMounted) {
          if (detailResult && detailResult.product) {
            const mapped = mapCatalogToDetailProduct(detailResult.product);
            setCurrentProduct(mapped);

            if (detailResult.relatedProducts && detailResult.relatedProducts.length > 0) {
              const companions = detailResult.relatedProducts
                .filter((p) => p.id !== detailResult.product.id)
                .slice(0, 3)
                .map(mapCatalogToDetailProduct);
              setCompanionProducts(companions);
            }
          } else {
            // Secondary fallback search if identifier is custom
            const list = await productApi.getProducts({ pageSize: 100 });
            const found = list.find((p) => p.id === id || p.code.toLowerCase() === id.toLowerCase() || p.name.toLowerCase() === id.toLowerCase()) || null;
            if (found) {
              setCurrentProduct(mapCatalogToDetailProduct(found));
              const crossList = await productApi.getProducts({ space: found.space, pageSize: 6 });
              const companions = crossList
                .filter((p) => p.id !== found.id)
                .slice(0, 3)
                .map(mapCatalogToDetailProduct);
              setCompanionProducts(companions);
            } else {
              setCurrentProduct(null);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to load product detail from API:', err);
        if (isMounted) setCurrentProduct(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadProductData();
    return () => {
      isMounted = false;
    };
  }, [id]);

  // Gallery - Dynamic real images from database
  const galleryImages = useMemo(() => {
    if (!currentProduct) return [];
    const list = (currentProduct.images && currentProduct.images.length > 0)
      ? currentProduct.images
      : (currentProduct.image ? [currentProduct.image] : []);

    return list.map((src, idx) => ({
      title: `${currentProduct.name} - Ảnh ${idx + 1}`,
      desc: `Góc chụp chi tiết ${currentProduct.name}`,
      src,
      tag: idx === 0 ? 'Toàn cảnh' : `Góc ${idx + 1}`,
    }));
  }, [currentProduct]);

  // Component States
  const [selectedImgIdx, setSelectedImgIdx] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'specs' | 'care' | 'shipping'>('specs');

  // Modals & Drawers
  const [isSampleBoxOpen, setIsSampleBoxOpen] = useState<boolean>(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Global Cart & Wishlist context
  const { cartCount, wishlistCount, wishlistIds, toggleWishlist: contextToggleWishlist, addToCart } = useCart();

  const toggleWishlist = (productId: string) => {
    const willBeFavorite = !wishlistIds.includes(productId);
    contextToggleWishlist(productId);
    if (willBeFavorite) {
      message.success('Đã lưu vào danh sách yêu thích');
    } else {
      message.info('Đã xóa khỏi danh sách yêu thích');
    }
  };

  // Price Calculation
  const calculatedPrice = currentProduct?.price || 0;
  const calculatedStrike = currentProduct?.originalPrice || null;

  const isUpholstered = useMemo(() => {
    if (!currentProduct) return false;
    const name = currentProduct.name.toLowerCase();
    const cat = (currentProduct.categoryName || '').toLowerCase();
    return name.includes('sofa') || name.includes('nệm') || name.includes('đệm') || cat.includes('sofa');
  }, [currentProduct]);

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(val) + ' ₫';
  };

  const handleAddToCart = () => {
    if (!currentProduct) return;
    addToCart({
      id: currentProduct.id,
      sku: currentProduct.sku,
      name: currentProduct.name,
      collection: currentProduct.categoryName || 'Bộ sưu tập D2 LUXURY',
      badge: 'Tuyệt phẩm mộc',
      image: currentProduct.image,
      price: calculatedPrice,
      originalPrice: calculatedStrike || Math.round(calculatedPrice * 1.15),
      specs: [
        currentProduct.woodType,
        currentProduct.dimensions,
      ].filter(Boolean),
      giftInfo: isUpholstered ? 'Tặng kèm 2 gối tựa cao cấp D2 LUXURY' : 'Tặng bộ dầu dưỡng gỗ tự nhiên D2 LUXURY',
    }, quantity);
    message.success(`Đã thêm ${quantity} "${currentProduct.name}" vào giỏ hàng!`);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push('/checkout');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#fff8f5] text-[#1f1b19] font-body-md">
        <Header
          cartCount={cartCount}
          wishlistCount={wishlistCount}
          onOpenBooking={() => {}}
        />
        <main className="w-full pt-32 pb-24 flex items-center justify-center flex-1">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[#5d371f] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-[#83746c]">Đang tải tác phẩm nội thất...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!currentProduct) {
    return (
      <div className="min-h-screen flex flex-col bg-[#fff8f5] text-[#1f1b19] font-body-md">
        <Header
          cartCount={cartCount}
          wishlistCount={wishlistCount}
          onOpenBooking={() => {}}
        />
        <main className="w-full pt-32 pb-24 flex items-center justify-center flex-1">
          <div className="max-w-md text-center flex flex-col items-center gap-4 p-8 bg-white border border-[#eae1dd]">
            <h2 className="font-serif text-2xl font-bold text-[#1f1b19]">Sản Phẩm Không Tồn Tại</h2>
            <p className="text-sm text-[#83746c]">Tác phẩm này hiện không có trong hệ thống hoặc đã được cập nhật sang bộ sưu tập mới.</p>
            <Link
              href="/products"
              className="px-6 py-2.5 bg-[#5d371f] text-white text-sm font-semibold hover:bg-[#784e34] transition-colors"
            >
              Xem bộ sưu tập sản phẩm
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fff8f5] text-[#1f1b19] font-body-md">
      {/* Global Header */}
      <Header
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        onOpenBooking={() => {}}
      />

      <main className="w-full pt-20">
        {/* Top Breadcrumb & Quick Actions Bar */}
        <section className="w-full bg-[#fbf2ee] py-3.5 border-b border-[#eae1dd]">
          <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 flex flex-wrap items-center justify-between gap-3 text-xs font-medium text-[#83746c]">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 flex-wrap">
              <Link href="/" className="hover:text-[#5d371f] transition-colors">
                Trang chủ
              </Link>
              <RightOutlined className="text-[10px]" />
              <Link
                href={`/products?space=${currentProduct.category}`}
                className="hover:text-[#5d371f] transition-colors"
              >
                {currentProduct.spaceName || currentProduct.categoryName || 'Phòng Khách'}
              </Link>
              {currentProduct.subCategoryName && (
                <>
                  <RightOutlined className="text-[10px]" />
                  <Link
                    href={`/products?space=${currentProduct.category}&category=${encodeURIComponent(currentProduct.subCategoryName)}`}
                    className="hover:text-[#5d371f] transition-colors"
                  >
                    {currentProduct.subCategoryName}
                  </Link>
                </>
              )}
              <RightOutlined className="text-[10px]" />
              <span className="text-[#5d371f] font-bold line-clamp-1">
                {currentProduct.name}
              </span>
            </nav>

            <div className="flex items-center gap-4 text-[#51443d]">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[#eae1dd] text-[#3f4332] text-[11px] font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                Bộ sưu tập D2 LUXURY
              </span>

              <button
                onClick={() => {
                  if (typeof navigator !== 'undefined' && navigator.clipboard) {
                    navigator.clipboard.writeText(window.location.href);
                    message.success('Đã sao chép liên kết sản phẩm!');
                  }
                }}
                className="inline-flex items-center gap-1.5 hover:text-[#5d371f] transition-colors cursor-pointer text-xs font-medium"
                title="Chia sẻ sản phẩm"
              >
                <ShareAltOutlined className="text-[14px]" />
                <span className="hidden sm:inline">Chia sẻ</span>
              </button>
            </div>
          </div>
        </section>

        {/* Main Showcase & Buy Action Section */}
        <section className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 py-8 md:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* Gallery Column (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              {/* Main Large Frame */}
              <div className="relative w-full aspect-[4/3] bg-[#eae1dd] overflow-hidden shadow-sm border border-[#eae1dd] group">
                <img
                  alt={galleryImages[selectedImgIdx]?.title || currentProduct.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  src={galleryImages[selectedImgIdx]?.src || currentProduct.image}
                />

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  <span className="px-3 py-1 bg-[#5d371f] text-white text-[11px] font-semibold uppercase tracking-wider shadow-sm">
                    Nghệ nhân D2 LUXURY
                  </span>
                  <span className="px-3 py-1 bg-white/95 backdrop-blur-sm text-[#3f4332] text-[11px] font-semibold shadow-sm border border-[#eae1dd] flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span> Gỗ FSC Tuyển Chọn
                  </span>
                </div>
              </div>

              {/* Thumbnail Strip (Only shown if multiple real images exist) */}
              {galleryImages.length > 1 && (
                <div className="grid grid-cols-5 gap-3">
                  {galleryImages.map((thumb, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImgIdx(idx)}
                      className={`relative aspect-[4/3] overflow-hidden bg-[#eae1dd] transition-all cursor-pointer border ${
                        selectedImgIdx === idx
                          ? 'border-[#5d371f] ring-2 ring-[#5d371f] shadow-md'
                          : 'border-[#eae1dd] opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img
                        alt={thumb.title}
                        className="w-full h-full object-cover"
                        src={thumb.src}
                      />
                      <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] font-medium py-0.5 text-center truncate px-1">
                        {thumb.tag}
                      </span>
                    </button>
                  ))}
                </div>
              )}

            </div>

            {/* Right Column: Product Detail & Purchase Configuration (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-5">
              {/* Header Info */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-[#83746c] font-medium">
                  <span className="font-mono">{currentProduct.sku}</span>
                  <span className="inline-flex items-center gap-1 text-[#3f4332] font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    {currentProduct.stockStatus}
                  </span>
                </div>

                <h1 className="font-headline-lg text-2xl sm:text-3xl text-[#1f1b19] font-normal tracking-tight">
                  {currentProduct.name}
                </h1>
              </div>

              {/* Price Banner */}
              <div className="p-4 bg-[#fbf2ee] border border-[#eae1dd] flex flex-col gap-1.5 shadow-sm">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="font-headline-lg text-2xl sm:text-3xl text-[#5d371f] font-bold">
                    {formatPrice(calculatedPrice)}
                  </span>
                </div>
              </div>


              {/* Product Specifications Bento Card */}
              <div className="flex flex-col bg-white border border-[#eae1dd] shadow-sm">
                <div className="px-4 py-2.5 bg-[#fbf2ee] border-b border-[#eae1dd] flex items-center justify-between">
                  <span className="font-bold text-xs uppercase tracking-wider text-[#5d371f] flex items-center gap-1.5">
                    <CheckCircleOutlined className="text-sm" />
                    Thông số sản phẩm chi tiết
                  </span>
                  <span className="text-[11px] text-[#83746c]">Chuẩn nghệ nhân D2 LUXURY</span>
                </div>

                <div className="p-3.5 flex flex-col gap-2.5 text-xs">
                  {/* 1. Kích thước */}
                  <div className="flex items-start justify-between gap-3 pb-2 border-b border-[#eae1dd]/60">
                    <span className="font-bold text-[#1f1b19] min-w-[110px] text-slate-700">Kích thước:</span>
                    <span className="font-mono font-bold text-[#5d371f] text-right">
                      {currentProduct.dimensions || 'Theo thiết kế tiêu chuẩn'}
                    </span>
                  </div>

                  {/* 2. Chất liệu */}
                  <div className="flex items-start justify-between gap-3 pb-2 border-b border-[#eae1dd]/60">
                    <span className="font-bold text-[#1f1b19] min-w-[110px] text-slate-700">Chất liệu:</span>
                    <span className="font-medium text-[#1f1b19] text-right">
                      {currentProduct.woodType || currentProduct.materialDetails || 'Gỗ tự nhiên cao cấp'}
                    </span>
                  </div>

                  {/* 3. Màu sản phẩm */}
                  <div className="flex items-start justify-between gap-3 pb-2 border-b border-[#eae1dd]/60">
                    <span className="font-bold text-[#1f1b19] min-w-[110px] text-slate-700">Màu sản phẩm:</span>
                    <span className="font-medium text-[#1f1b19] text-right">
                      {currentProduct.color || 'Nâu hạt dẻ / tự nhiên (Đa dạng)'}
                    </span>
                  </div>

                  {/* 4. Màu nệm gối (Nếu là sản phẩm có bọc nệm) */}
                  {isUpholstered && (
                    <div className="flex items-start justify-between gap-3 pb-2 border-b border-[#eae1dd]/60">
                      <span className="font-bold text-[#1f1b19] min-w-[110px] text-slate-700">Vải bọc / Nệm:</span>
                      <span className="font-medium text-[#1f1b19] text-right">
                        Linen dệt sợi thô tự nhiên / Đệm cao su êm ái
                      </span>
                    </div>
                  )}

                  {/* 5. Bảo hành */}
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-bold text-[#1f1b19] min-w-[110px] text-slate-700">Bảo hành:</span>
                    <span className="font-semibold text-emerald-700 text-right">
                      {currentProduct.warranty || '24 tháng'} chính hãng &amp; Bảo trì trọn đời
                    </span>
                  </div>
                </div>
              </div>

                {/* Quantity & Action Buttons */}
                <div className="flex flex-col gap-2.5 pt-2">
                  <div className="flex items-center gap-3">
                    {/* Stepper */}
                    <div className="flex items-center bg-white border border-[#d5c3ba] shadow-sm">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="w-10 h-10 flex items-center justify-center text-[#51443d] hover:bg-[#f5ece8] cursor-pointer"
                      >
                        <MinusOutlined className="text-[12px]" />
                      </button>
                      <input
                        type="text"
                        readOnly
                        value={quantity}
                        className="w-12 text-center font-bold text-sm text-[#1f1b19] bg-transparent focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => q + 1)}
                        className="w-10 h-10 flex items-center justify-center text-[#51443d] hover:bg-[#f5ece8] cursor-pointer"
                      >
                        <PlusOutlined className="text-[12px]" />
                      </button>
                    </div>

                    {/* Cart Button */}
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className="flex-1 h-10 px-4 bg-[#f5ece8] hover:bg-[#eae1dd] text-[#5d371f] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-[#d5c3ba] transition-all cursor-pointer shadow-sm"
                    >
                      <ShoppingCartOutlined className="text-[16px]" />
                      <span>Thêm vào giỏ hàng</span>
                    </button>
                  </div>

                  {/* Buy Now Button */}
                  <button
                    type="button"
                    onClick={handleBuyNow}
                    className="w-full h-12 bg-[#5d371f] hover:bg-[#784e34] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer uppercase tracking-wider"
                  >
                    <CarOutlined className="text-[18px]" />
                    <span>Mua ngay — Giao &amp; Lắp đặt tận nhà</span>
                  </button>
                </div>

              {/* Guarantee & Benefits Bento */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                <div className="p-3 bg-white border border-[#eae1dd] shadow-sm flex flex-col gap-1">
                  <SafetyCertificateOutlined className="text-[#5d371f] text-[18px]" />
                  <h4 className="font-bold text-xs text-[#1f1b19]">Chất lượng nghệ nhân</h4>
                  <p className="text-[11px] text-[#83746c] leading-tight">
                    100% gỗ tự nhiên chất lượng cao, kết cấu mộng truyền thống chuẩn mực.
                  </p>
                </div>
                <div className="p-3 bg-white border border-[#eae1dd] shadow-sm flex flex-col gap-1">
                  <GiftOutlined className="text-[#5d371f] text-[18px]" />
                  <h4 className="font-bold text-xs text-[#1f1b19]">Bảo hành {currentProduct.warranty || '24 tháng'}</h4>
                  <p className="text-[11px] text-[#83746c] leading-tight">
                    Bảo hành kết cấu khung gỗ {currentProduct.warranty || '24 tháng'} &amp; hỗ trợ bảo trì trọn đời.
                  </p>
                </div>
                <div className="p-3 bg-white border border-[#eae1dd] shadow-sm flex flex-col gap-1">
                  <ToolOutlined className="text-[#5d371f] text-[18px]" />
                  <h4 className="font-bold text-xs text-[#1f1b19]">Giao lắp tận nhà</h4>
                  <p className="text-[11px] text-[#83746c] leading-tight">
                    {currentProduct.shippingNote || 'Đội ngũ kỹ thuật D2 LUXURY vận chuyển và lắp đặt hoàn thiện.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Deep Dive Interactive Tabs Section */}
        <section className="w-full bg-[#fbf2ee] py-12 md:py-16 border-t border-[#eae1dd]">
          <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 flex flex-col gap-6">
            {/* Tab Headers */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[#eae1dd]">
              {[
                { id: 'specs', label: 'Thông số kỹ thuật & Chế tác' },
                { id: 'care', label: 'Hướng dẫn bảo dưỡng gỗ tự nhiên' },
                { id: 'shipping', label: 'Chính sách giao nhận & Đổi trả' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2.5 font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer border-b-2 ${
                    activeTab === tab.id
                      ? 'border-[#5d371f] text-[#5d371f] bg-white shadow-sm'
                      : 'border-transparent text-[#83746c] hover:text-[#5d371f]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab 1: Specs & Craftsmanship */}
            {activeTab === 'specs' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-7 flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs uppercase tracking-widest text-[#83746c] font-semibold">
                      Triết lý chế tác
                    </span>
                    <h3 className="font-headline-md text-xl sm:text-2xl text-[#5d371f] font-normal">
                      Chế tác mộc mộng tinh xảo từ {currentProduct.woodType || 'gỗ tự nhiên'}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#51443d] leading-relaxed mt-1">
                      {currentProduct.description || `Sản phẩm ${currentProduct.name} được chế tác tỉ mỉ bởi nghệ nhân D2 LUXURY, sử dụng hệ chốt ghép mộng chắc chắn, hoàn thiện lớp bảo vệ an toàn cho sức khỏe và tôn vinh trọn vẹn vân gỗ tự nhiên.`}
                    </p>
                  </div>

                  {/* Spec Table */}
                  <div className="overflow-hidden bg-white border border-[#eae1dd] shadow-sm">
                    <table className="w-full text-left text-xs">
                      <tbody>
                        <tr className="bg-[#fbf2ee]/60 border-b border-[#eae1dd]">
                          <td className="p-3 font-bold text-[#1f1b19] w-1/3">Tên sản phẩm</td>
                          <td className="p-3 text-[#51443d] font-semibold">{currentProduct.name}</td>
                        </tr>
                        <tr className="border-b border-[#eae1dd]">
                          <td className="p-3 font-bold text-[#1f1b19]">Mã sản phẩm (SKU)</td>
                          <td className="p-3 font-mono text-[#51443d]">{currentProduct.sku}</td>
                        </tr>
                        <tr className="bg-[#fbf2ee]/60 border-b border-[#eae1dd]">
                          <td className="p-3 font-bold text-[#1f1b19]">Kích thước tiêu chuẩn</td>
                          <td className="p-3 text-[#51443d]">{currentProduct.dimensions || 'Theo thiết kế tiêu chuẩn (Nhận may đo theo yêu cầu)'}</td>
                        </tr>
                        <tr className="border-b border-[#eae1dd]">
                          <td className="p-3 font-bold text-[#1f1b19]">Vật liệu chế tác</td>
                          <td className="p-3 text-[#51443d]">{currentProduct.woodType || currentProduct.materialDetails || 'Gỗ tự nhiên tuyển chọn cao cấp'}</td>
                        </tr>
                        <tr className="bg-[#fbf2ee]/60 border-b border-[#eae1dd]">
                          <td className="p-3 font-bold text-[#1f1b19]">Màu sắc hoàn thiện</td>
                          <td className="p-3 text-[#51443d]">{currentProduct.color || 'Nâu hạt dẻ / Tự nhiên'}</td>
                        </tr>
                        <tr className="border-b border-[#eae1dd]">
                          <td className="p-3 font-bold text-[#1f1b19]">Thời hạn bảo hành</td>
                          <td className="p-3 text-emerald-700 font-semibold">{currentProduct.warranty || '24 tháng'} chính hãng &amp; Bảo trì trọn đời</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-[#1f1b19]">Xuất xứ &amp; Chế tác</td>
                          <td className="p-3 text-[#51443d]">Xưởng mộc thủ công nghệ nhân D2 LUXURY</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="lg:col-span-5 flex flex-col gap-4">
                  <div className="aspect-[4/3] bg-[#eae1dd] overflow-hidden shadow-sm border border-[#eae1dd]">
                    <img
                      alt={currentProduct.name}
                      className="w-full h-full object-cover"
                      src={currentProduct.image}
                    />
                  </div>
                  <div className="p-4 bg-white border border-[#eae1dd] flex flex-col gap-1.5 shadow-sm">
                    <h4 className="font-bold text-sm text-[#5d371f] flex items-center gap-1.5">
                      <SafetyCertificateOutlined className="text-[18px]" />
                      Cam kết chất lượng 100%
                    </h4>
                    <p className="text-xs text-[#51443d] leading-relaxed">
                      D2 LUXURY cam kết tuyển chọn gỗ kỹ càng, không sử dụng gỗ pha tạp kém chất lượng. Quý khách hoàn toàn yên tâm về độ bền và thẩm mỹ vượt thời gian của {currentProduct.name}.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Care Guide */}
            {activeTab === 'care' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 bg-white border border-[#eae1dd] shadow-sm flex flex-col gap-2">
                  <div className="w-10 h-10 bg-[#f5ece8] flex items-center justify-center text-[#5d371f] text-[20px]">
                    <SunOutlined />
                  </div>
                  <h4 className="font-bold text-sm text-[#1f1b19]">Vị trí đặt nội thất</h4>
                  <p className="text-xs text-[#51443d] leading-relaxed">
                    Tránh để ánh nắng mặt trời gắt chiếu trực diện nhiều giờ trong ngày. Giữ khoảng cách tối thiểu 1.5 mét với các nguồn nhiệt lớn hoặc luồng thổi trực tiếp của điều hòa.
                  </p>
                </div>

                <div className="p-5 bg-white border border-[#eae1dd] shadow-sm flex flex-col gap-2">
                  <div className="w-10 h-10 bg-[#f5ece8] flex items-center justify-center text-[#5d371f] text-[20px]">
                    <ClearOutlined />
                  </div>
                  <h4 className="font-bold text-sm text-[#1f1b19]">Vệ sinh định kỳ</h4>
                  <p className="text-xs text-[#51443d] leading-relaxed">
                    Lau bề mặt gỗ bằng khăn cotton mềm hơi ẩm, sau đó lau lại ngay bằng khăn khô. Tránh dùng các hóa chất tẩy rửa mạnh làm ảnh hưởng đến lớp bảo vệ bề mặt gỗ.
                  </p>
                </div>

                <div className="p-5 bg-white border border-[#eae1dd] shadow-sm flex flex-col gap-2">
                  <div className="w-10 h-10 bg-[#f5ece8] flex items-center justify-center text-[#5d371f] text-[20px]">
                    <SmileOutlined />
                  </div>
                  <h4 className="font-bold text-sm text-[#1f1b19]">Dưỡng dầu gỗ hàng năm</h4>
                  <p className="text-xs text-[#51443d] leading-relaxed">
                    Mỗi 12 - 24 tháng, thoa một lớp dầu bảo dưỡng mỏng sẽ giúp thớ gỗ tự nhiên luôn giữ được độ bóng mượt, trầm ấm và tăng cường khả năng chống ẩm.
                  </p>
                </div>
              </div>
            )}

            {/* Tab 3: Shipping & Warranty */}
            {activeTab === 'shipping' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-white border border-[#eae1dd] shadow-sm flex flex-col gap-3">
                  <h4 className="font-bold text-sm text-[#5d371f] flex items-center gap-2">
                    <CarOutlined className="text-[18px]" />
                    Vận chuyển &amp; Lắp đặt
                  </h4>
                  <ul className="flex flex-col gap-2 text-xs text-[#51443d] leading-relaxed">
                    <li className="flex items-start gap-2">
                      <CheckCircleFilled className="text-emerald-700 text-[14px] mt-0.5" />
                      <span>{currentProduct.shippingNote || 'Miễn phí vận chuyển và khiêng lắp tận nơi cho các đơn hàng tại Hà Nội & TP.HCM.'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleFilled className="text-emerald-700 text-[14px] mt-0.5" />
                      <span>Khảo sát kích thước lối đi, thang máy trước khi giao hàng để đảm bảo lắp đặt thuận tiện nhất.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleFilled className="text-emerald-700 text-[14px] mt-0.5" />
                      <span>Các tỉnh thành khác: Đóng kiện pallet gỗ tiêu chuẩn chống va đập, giao hàng an toàn đến tận nơi.</span>
                    </li>
                  </ul>
                </div>

                <div className="p-5 bg-white border border-[#eae1dd] shadow-sm flex flex-col gap-3">
                  <h4 className="font-bold text-sm text-[#5d371f] flex items-center gap-2">
                    <SyncOutlined className="text-[18px]" />
                    Chính sách bảo hành &amp; Đổi trả
                  </h4>
                  <ul className="flex flex-col gap-2 text-xs text-[#51443d] leading-relaxed">
                    <li className="flex items-start gap-2">
                      <CheckCircleFilled className="text-emerald-700 text-[14px] mt-0.5" />
                      <span>Bảo hành {currentProduct.warranty || '24 tháng'} chính hãng đối với mọi lỗi kỹ thuật do nhà sản xuất.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleFilled className="text-emerald-700 text-[14px] mt-0.5" />
                      <span>Đổi mới hoàn toàn trong 14 ngày nếu phát hiện lỗi kết cấu nghiêm trọng.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleFilled className="text-emerald-700 text-[14px] mt-0.5" />
                      <span>Bảo trì trọn đời: Hỗ trợ đánh bóng, làm mới bề mặt gỗ với chi phí ưu đãi cho khách hàng D2 LUXURY.</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Curated Companion Pieces (Cross-sell in same style) */}
        {companionProducts.length > 0 && (
          <section className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 py-12 md:py-16">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div>
                  <span className="text-xs uppercase tracking-widest text-[#83746c] font-semibold">
                    Không gian đồng điệu
                  </span>
                  <h2 className="font-headline-lg text-2xl sm:text-3xl text-[#1f1b19] font-normal tracking-tight mt-1">
                    Nội thất phối hợp hoàn hảo
                  </h2>
                </div>
                <Link
                  href="/products?space=living"
                  className="inline-flex items-center gap-1.5 font-bold text-xs text-[#5d371f] hover:underline"
                >
                  <span>Xem trọn bộ Không Gian Sống</span>
                  <ArrowRightOutlined className="text-[12px]" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {companionProducts.map((p) => (
                  <div
                    key={p.id}
                    className="group flex flex-col bg-white border border-[#eae1dd] shadow-sm hover:shadow-xl transition-all duration-300"
                  >
                    <div className="relative aspect-[4/3] bg-[#eae1dd] overflow-hidden">
                      <img
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        src={p.image}
                      />
                      <span className="absolute top-3 left-3 px-2.5 py-0.5 bg-white/95 text-[#1f1b19] text-[11px] font-bold shadow-sm">
                        {p.woodType}
                      </span>
                    </div>

                    <div className="p-4 flex flex-col gap-2 flex-1 justify-between">
                      <div>
                        <Link
                          href={`/products/${p.id}`}
                          className="font-bold text-sm sm:text-base text-[#1f1b19] group-hover:text-[#5d371f] transition-colors line-clamp-1 cursor-pointer block"
                        >
                          {p.name}
                        </Link>
                        <p className="text-xs text-[#83746c] mt-0.5">{p.subtitle || p.dimensions}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#eae1dd]/60">
                        <span className="font-bold text-sm sm:text-base text-[#5d371f]">
                          {formatPrice(p.price)}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <Button
                            size="small"
                            onClick={() => setQuickViewProduct(p)}
                            className="rounded-none bg-[#f5ece8] border-[#eae1dd] text-[#1f1b19] font-bold text-xs hover:!bg-[#eae1dd]"
                            icon={<EyeOutlined />}
                          />
                          <Button
                            type="primary"
                            size="small"
                            onClick={() => {
                              addToCart({
                                id: p.id,
                                sku: p.sku,
                                name: p.name,
                                collection: p.categoryName || 'Tuyệt phẩm mộc',
                                badge: p.tag || 'Nghệ nhân',
                                image: p.image,
                                price: p.price,
                                originalPrice: p.originalPrice,
                                specs: [p.woodType, p.dimensions],
                              }, 1);
                              message.success(`Đã thêm "${p.name}" vào giỏ!`);
                            }}
                            className="bg-[#5d371f] hover:!bg-[#784e34] rounded-none shadow-sm"
                            icon={<ShoppingCartOutlined />}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>


      {/* Global Footer */}
      <Footer />

      {/* Sample Box Modal */}
      <SampleBoxModal
        isOpen={isSampleBoxOpen}
        onClose={() => setIsSampleBoxOpen(false)}
      />

      {/* Quick View Modal for companion products */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={(product, quantity) => {
          addToCart({
            id: product.id,
            sku: product.sku,
            name: product.name,
            collection: product.categoryName || 'Tuyệt phẩm mộc',
            badge: product.tag || 'Nghệ nhân',
            image: product.image,
            price: product.price,
            originalPrice: product.originalPrice,
            specs: [product.woodType, product.dimensions],
          }, quantity);
          message.success(`Đã thêm "${product.name}" vào giỏ hàng!`);
        }}
      />
    </div>
  );
}
