'use client';

import React, { useState, useMemo, use } from 'react';
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
import { productsData } from '@/data/products';
import { categoryProductsData } from '@/data/categoryProducts';
import { Product, CartItem } from '@/types';
import { useCart } from '@/context/CartContext';

// Default Flagship Gallery images for Kyoto Sofa / Solid Walnut collection
const DEFAULT_GALLERY = [
  {
    title: 'Toàn cảnh phòng khách Japandi',
    desc: 'Góc chụp toàn cảnh sofa trong không gian ánh sáng tự nhiên',
    src: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80',
    tag: 'Toàn cảnh',
  },
  {
    title: 'Mặt sau ghép mộng tinh xảo',
    desc: 'Kỹ nghệ ghép mộng truyền thống Hida Takayama không đinh ốc',
    src: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80',
    tag: 'Ghép mộng',
  },
  {
    title: 'Cận cảnh vân gỗ óc chó FAS',
    desc: 'Thớ gỗ Bắc Mỹ tuyển chọn với lớp dầu lau thực vật Rubio Monocoat',
    src: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
    tag: 'Vân gỗ',
  },
  {
    title: 'Chất liệu đệm lanh tự nhiên',
    desc: 'Vải linen dệt thô cao cấp thoáng khí cùng ruột đệm lông vũ',
    src: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80',
    tag: 'Chất đệm',
  },
  {
    title: 'Bản vẽ kích thước kỹ thuật',
    desc: 'Bản vẽ chi tiết CAD và tỷ lệ công thái học chuẩn milimet',
    src: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
    tag: 'Kỹ thuật CAD',
  },
];

const WOOD_OPTIONS = [
  {
    id: 'walnut',
    name: 'Gỗ Óc Chó (Walnut)',
    subtitle: 'Bắc Mỹ Chuẩn FAS',
    color: '#523826',
    priceModifier: 0,
    strikeModifier: 0,
  },
  {
    id: 'oak',
    name: 'Gỗ Sồi Trắng (White Oak)',
    subtitle: 'Nhập Khẩu Nga (-7.3M)',
    color: '#c8a97e',
    priceModifier: -7300000,
    strikeModifier: -8000000,
  },
  {
    id: 'ash',
    name: 'Gỗ Tần Bì (Ash)',
    subtitle: 'Tự Nhiên Tinh Khiết (-9.5M)',
    color: '#deb887',
    priceModifier: -9500000,
    strikeModifier: -10000000,
  },
];

const FABRIC_OPTIONS = [
  {
    id: 'linen-cream',
    label: 'Linen Kem Sữa Tự Nhiên',
    name: 'Linen Kem Sữa',
    color: '#f2ede4',
    priceModifier: 0,
  },
  {
    id: 'linen-grey',
    label: 'Vải Lanh Xám Khói Wabi',
    name: 'Xám Khói Wabi',
    color: '#8c8880',
    priceModifier: 0,
  },
  {
    id: 'leather-cognac',
    label: 'Da Bò Nappa Cognac (+3.500.000₫)',
    name: 'Da Bò Cognac',
    color: '#914d24',
    priceModifier: 3500000,
  },
];

const CORNER_OPTIONS = [
  { id: 'left', label: 'Góc Trái (L)' },
  { id: 'right', label: 'Góc Phải (R)' },
  { id: 'ottoman', label: 'Đôn Rời Linh Hoạt' },
];

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { message } = App.useApp();
  const router = useRouter();

  // Find product from dataset or fallback to premier sofa Kyoto
  const currentProduct = useMemo(() => {
    const fromCat = categoryProductsData.find((p) => p.id === id || p.sku.toLowerCase() === id.toLowerCase());
    if (fromCat) {
      return {
        id: fromCat.id,
        sku: fromCat.sku,
        name: fromCat.name,
        category: fromCat.space,
        categoryName: fromCat.spaceName,
        price: fromCat.price,
        originalPrice: fromCat.originalPrice || Math.round(fromCat.price * 1.15),
        image: fromCat.image,
        woodType: fromCat.woodMaterialName,
        rating: 4.9,
        reviewCount: 86,
        subtitle: fromCat.woodMaterialName,
        description: fromCat.description,
        dimensions: fromCat.dimensions,
        stockStatus: fromCat.stockLabel,
        inStock: fromCat.stockStatus === 'showroom',
        materialDetails: fromCat.woodMaterialName,
      } as Product;
    }

    const fromProd = productsData.find((p) => p.id === id || p.sku.toLowerCase() === id.toLowerCase());
    if (fromProd) return fromProd;

    // Fallback premier product
    return {
      id: 'sofa-kyoto-l',
      sku: 'MG-SF-084KY',
      name: 'Sofa Góc Chữ L Gỗ Óc Chó Kyoto',
      category: 'living',
      categoryName: 'Phòng Khách',
      price: 38500000,
      originalPrice: 44000000,
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80',
      tag: 'Nghệ nhân D2 LUXURY',
      woodType: 'Gỗ Óc Chó Bắc Mỹ (FAS)',
      rating: 4.9,
      reviewCount: 86,
      subtitle: 'Phong cách Japandi tối giản kết hợp mộng mộc truyền thống',
      description:
        'Chế tác từ gỗ óc chó Bắc Mỹ nguyên khối tuyển chọn vân núi cuộn xoáy tự nhiên. Kết cấu mộng âm dương không lộ ốc vít kim loại, sơn dầu thực vật Rubio Monocoat an toàn 0% VOC.',
      dimensions: 'D 2800 x R 1750 x C 820 mm',
      stockStatus: 'Sẵn sàng gia công theo yêu cầu (7-10 ngày)',
      inStock: true,
      materialDetails: 'Gỗ Óc Chó FAS + Nệm cao su lông vũ',
    } as Product;
  }, [id]);

  // Gallery
  const galleryImages = useMemo(() => {
    if (currentProduct.image) {
      return [
        { ...DEFAULT_GALLERY[0], src: currentProduct.image, title: currentProduct.name },
        ...DEFAULT_GALLERY.slice(1),
      ];
    }
    return DEFAULT_GALLERY;
  }, [currentProduct]);

  // Component States
  const [selectedImgIdx, setSelectedImgIdx] = useState<number>(0);
  const [selectedWood, setSelectedWood] = useState<string>('walnut');
  const [selectedFabric, setSelectedFabric] = useState<string>('linen-cream');
  const [selectedCorner, setSelectedCorner] = useState<string>('left');
  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'specs' | 'care' | 'shipping'>('specs');

  // Modals & Drawers
  const [isCornerGuideOpen, setIsCornerGuideOpen] = useState<boolean>(false);
  const [isWoodModalOpen, setIsWoodModalOpen] = useState<boolean>(false);
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

  // Price Calculation based on options
  const currentWoodObj = WOOD_OPTIONS.find((w) => w.id === selectedWood) || WOOD_OPTIONS[0];
  const currentFabricObj = FABRIC_OPTIONS.find((f) => f.id === selectedFabric) || FABRIC_OPTIONS[0];

  const calculatedPrice = Math.max(
    10000000,
    currentProduct.price + currentWoodObj.priceModifier + currentFabricObj.priceModifier
  );
  const calculatedStrike = currentProduct.originalPrice
    ? currentProduct.originalPrice + currentWoodObj.strikeModifier + currentFabricObj.priceModifier
    : null;

  const discountPercent = calculatedStrike
    ? Math.round(((calculatedStrike - calculatedPrice) / calculatedStrike) * 100)
    : 0;

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(val) + ' ₫';
  };

  const handleAddToCart = () => {
    addToCart({
      id: `${currentProduct.id}-${selectedWood}-${selectedFabric}`,
      sku: currentProduct.sku,
      name: currentProduct.name,
      collection: currentProduct.categoryName || 'Bộ sưu tập D2 LUXURY',
      badge: 'Tuyệt phẩm mộc',
      image: currentProduct.image,
      price: calculatedPrice,
      originalPrice: calculatedStrike || Math.round(calculatedPrice * 1.15),
      specs: [
        currentWoodObj.name,
        currentFabricObj.name,
        `Phân hướng: ${selectedCorner === 'left' ? 'Góc Trái (L)' : 'Góc Phải (R)'}`,
      ],
      giftInfo: 'Tặng kèm: 2 gối tựa lông vũ D2 LUXURY nguyên bản (Trị giá 1.800.000đ)',
    }, quantity);
    message.success(`Đã thêm ${quantity} "${currentProduct.name}" vào giỏ hàng!`);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push('/checkout');
  };

  // Companion cross-sell products
  const companionProducts = useMemo(() => {
    return productsData.filter((p) => p.id !== currentProduct.id).slice(0, 3);
  }, [currentProduct]);

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
              <Link href="/products?space=living" className="hover:text-[#5d371f] transition-colors">
                {currentProduct.categoryName || 'Phòng Khách'}
              </Link>
              <RightOutlined className="text-[10px]" />
              <span className="text-[#5d371f] font-bold line-clamp-1">
                {currentProduct.name}
              </span>
            </nav>

            <div className="flex items-center gap-4 text-[#51443d]">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[#eae1dd] text-[#3f4332] text-[11px] font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                Bộ sưu tập D2 LUXURY 2025
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

              {/* Thumbnail Strip (5 items) */}
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
                  {calculatedStrike && (
                    <span className="text-sm font-mono text-[#83746c] line-through">
                      {formatPrice(calculatedStrike)}
                    </span>
                  )}
                  {discountPercent > 0 && (
                    <span className="px-2 py-0.5 bg-[#ba1a1a]/10 text-[#ba1a1a] font-bold text-xs uppercase">
                      Tiết kiệm {discountPercent}%
                    </span>
                  )}
                </div>
              </div>

              {/* Configuration Form */}
              <div className="flex flex-col gap-4">
                {/* 1. Wood Selection */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-[#1f1b19] uppercase tracking-wider">
                      1. Chất liệu gỗ tự nhiên: <span className="font-normal lowercase text-[#5d371f] font-semibold">{currentWoodObj.name}</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsWoodModalOpen(true)}
                      className="text-[#5d371f] hover:underline cursor-pointer font-medium"
                    >
                      So sánh chất gỗ
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {WOOD_OPTIONS.map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setSelectedWood(w.id)}
                        className={`text-left p-2.5 bg-white border transition-all cursor-pointer flex items-center gap-2.5 ${
                          selectedWood === w.id
                            ? 'border-[#5d371f] ring-2 ring-[#5d371f] shadow-sm'
                            : 'border-[#eae1dd] opacity-80 hover:opacity-100 hover:border-[#d5c3ba]'
                        }`}
                      >
                        <div
                          style={{ backgroundColor: w.color }}
                          className="w-6 h-6 shrink-0 shadow-inner border border-black/10"
                        />
                        <div className="flex flex-col min-w-0">
                          <p className="text-xs font-bold text-[#1f1b19] truncate">{w.name}</p>
                          <p className="text-[11px] text-[#83746c] truncate">{w.subtitle}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Cushion Fabric & Color Selection */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-[#1f1b19] uppercase tracking-wider">
                      2. Vỏ bọc đệm ngồi: <span className="font-normal lowercase text-[#5d371f] font-semibold">{currentFabricObj.name}</span>
                    </label>
                    <span className="text-[#83746c] text-[11px]">Tháo giặt vệ sinh được</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {FABRIC_OPTIONS.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setSelectedFabric(f.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 bg-white border text-xs transition-all cursor-pointer ${
                          selectedFabric === f.id
                            ? 'border-[#5d371f] ring-2 ring-[#5d371f] shadow-sm font-bold text-[#5d371f]'
                            : 'border-[#eae1dd] text-[#51443d] opacity-85 hover:opacity-100'
                        }`}
                      >
                        <span
                          style={{ backgroundColor: f.color }}
                          className="w-4 h-4 rounded-full border border-black/15 shadow-inner"
                        />
                        <span>{f.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Corner Configuration */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-[#1f1b19] uppercase tracking-wider">
                      3. Hướng góc chữ L:
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCornerGuideOpen(true)}
                      className="text-[#5d371f] hover:underline cursor-pointer font-medium"
                    >
                      Cách xác định góc sofa
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {CORNER_OPTIONS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedCorner(c.id)}
                        className={`py-2 text-center text-xs font-bold transition-all cursor-pointer border ${
                          selectedCorner === c.id
                            ? 'bg-[#5d371f] text-white border-[#5d371f] shadow-sm'
                            : 'bg-white text-[#51443d] border-[#eae1dd] hover:bg-[#f5ece8]'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Dimension & Space Fit */}
                <div className="flex flex-col gap-1 p-3 bg-[#f5ece8] border border-[#eae1dd] text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#1f1b19] uppercase">Kích thước chuẩn:</span>
                    <span className="font-mono font-bold text-[#5d371f]">
                      {currentProduct.dimensions || 'D 2800 x R 1750 x C 820 mm'}
                    </span>
                  </div>
                  <p className="text-[#51443d] leading-relaxed">
                    Tối ưu cho không gian phòng khách diện tích từ 18m² – 35m². Chiều cao đệm ngồi 420mm đạt chuẩn công thái học thư giãn.
                  </p>
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
              </div>

              {/* Guarantee & Benefits Bento */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                <div className="p-3 bg-white border border-[#eae1dd] shadow-sm flex flex-col gap-1">
                  <SafetyCertificateOutlined className="text-[#5d371f] text-[18px]" />
                  <h4 className="font-bold text-xs text-[#1f1b19]">Chất lượng nghệ nhân</h4>
                  <p className="text-[11px] text-[#83746c] leading-tight">
                    Cam kết kết cấu mộng và 100% gỗ tự nhiên chuẩn FAS.
                  </p>
                </div>
                <div className="p-3 bg-white border border-[#eae1dd] shadow-sm flex flex-col gap-1">
                  <GiftOutlined className="text-[#5d371f] text-[18px]" />
                  <h4 className="font-bold text-xs text-[#1f1b19]">Tặng 2 gối lông vũ</h4>
                  <p className="text-[11px] text-[#83746c] leading-tight">
                    Vỏ đệm đồng màu cùng ruột lông vũ êm ái trị giá 1.800.000₫.
                  </p>
                </div>
                <div className="p-3 bg-white border border-[#eae1dd] shadow-sm flex flex-col gap-1">
                  <ToolOutlined className="text-[#5d371f] text-[18px]" />
                  <h4 className="font-bold text-xs text-[#1f1b19]">Lắp đặt tỉ mỉ</h4>
                  <p className="text-[11px] text-[#83746c] leading-tight">
                    Đội ngũ kỹ thuật D2 LUXURY căn chỉnh vừa vặn từng milimet.
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
                { id: 'care', label: 'Hướng dẫn bảo dưỡng gỗ Wabi-Sabi' },
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
                      Ghép mộng truyền thống kết hợp hoàn thiện dầu thực vật
                    </h3>
                    <p className="text-xs sm:text-sm text-[#51443d] leading-relaxed mt-1">
                      Dòng sofa Kyoto được sinh ra từ niềm say mê kỹ nghệ mộc mộng của vùng Hida Takayama (Nhật Bản). Từng thanh gỗ óc chó Bắc Mỹ nguyên khối được thợ tiện và gọt giũa tỉ mỉ, lắp ráp bằng hệ chốt gỗ âm dương mà không dùng ốc vít kim loại lộ thiên, cho phép gỗ thở và thích nghi hoàn hảo với độ ẩm khí hậu Việt Nam.
                    </p>
                  </div>

                  {/* Spec Table */}
                  <div className="overflow-hidden bg-white border border-[#eae1dd] shadow-sm">
                    <table className="w-full text-left text-xs">
                      <tbody>
                        <tr className="bg-[#fbf2ee]/60 border-b border-[#eae1dd]">
                          <td className="p-3 font-bold text-[#1f1b19] w-1/3">Vật liệu khung chính</td>
                          <td className="p-3 text-[#51443d]">Gỗ Óc Chó Bắc Mỹ tự nhiên (American Black Walnut - chuẩn FAS).</td>
                        </tr>
                        <tr className="border-b border-[#eae1dd]">
                          <td className="p-3 font-bold text-[#1f1b19]">Lớp hoàn thiện bề mặt</td>
                          <td className="p-3 text-[#51443d]">Sơn dầu lau thực vật Rubio Monocoat 0% VOC (Bỉ), an toàn cho trẻ nhỏ.</td>
                        </tr>
                        <tr className="bg-[#fbf2ee]/60 border-b border-[#eae1dd]">
                          <td className="p-3 font-bold text-[#1f1b19]">Cấu trúc nệm ngồi</td>
                          <td className="p-3 text-[#51443d]">Cao su thiên nhiên hoạt tính kết hợp lớp phủ lông vũ 70/30 chống xẹp lún.</td>
                        </tr>
                        <tr className="border-b border-[#eae1dd]">
                          <td className="p-3 font-bold text-[#1f1b19]">Vải bọc bề mặt</td>
                          <td className="p-3 text-[#51443d]">Linen dệt sợi thô tự nhiên nhập khẩu Nhật Bản, thoáng mát tuyệt đối.</td>
                        </tr>
                        <tr className="bg-[#fbf2ee]/60 border-b border-[#eae1dd]">
                          <td className="p-3 font-bold text-[#1f1b19]">Tải trọng khuyến nghị</td>
                          <td className="p-3 text-[#51443d]">Khung chịu lực tĩnh lên tới 480 kg (4-5 người lớn ngồi thoải mái).</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-[#1f1b19]">Xuất xứ &amp; Chế tác</td>
                          <td className="p-3 text-[#51443d]">Xưởng mộc thủ công nghệ nhân D2 LUXURY tại Làng nghề Chàng Sơn, Hà Nội.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="lg:col-span-5 flex flex-col gap-4">
                  <div className="aspect-[4/3] bg-[#eae1dd] overflow-hidden shadow-sm border border-[#eae1dd]">
                    <img
                      alt="Nghệ nhân D2 LUXURY"
                      className="w-full h-full object-cover"
                      src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80"
                    />
                  </div>
                  <div className="p-4 bg-white border border-[#eae1dd] flex flex-col gap-1.5 shadow-sm">
                    <h4 className="font-bold text-sm text-[#5d371f] flex items-center gap-1.5">
                      <SafetyCertificateOutlined className="text-[18px]" />
                      Cam kết mộc tự nhiên 100%
                    </h4>
                    <p className="text-xs text-[#51443d] leading-relaxed">
                      D2 LUXURY cam kết tuyệt đối không sử dụng gỗ công nghiệp MDF/MFC hay gỗ dán ép cho bất kỳ vị trí chịu lực nào trên bộ sofa Kyoto. Quý khách có thể yêu cầu kiểm tra mộc thô tại xưởng trước khi hoàn thiện nước dầu bảo vệ cuối cùng.
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
                  <h4 className="font-bold text-sm text-[#1f1b19]">Vị trí đặt sofa</h4>
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
                    Lau bề mặt gỗ bằng khăn cotton mềm hơi ẩm, sau đó lau lại ngay bằng khăn khô. Với vỏ đệm linen, khuyến nghị giặt khô hoặc sử dụng dịch vụ làm sạch hơi nước 6 tháng/lần.
                  </p>
                </div>

                <div className="p-5 bg-white border border-[#eae1dd] shadow-sm flex flex-col gap-2">
                  <div className="w-10 h-10 bg-[#f5ece8] flex items-center justify-center text-[#5d371f] text-[20px]">
                    <SmileOutlined />
                  </div>
                  <h4 className="font-bold text-sm text-[#1f1b19]">Dưỡng dầu gỗ hàng năm</h4>
                  <p className="text-xs text-[#51443d] leading-relaxed">
                    D2 LUXURY tặng kèm 01 chai sáp ong &amp; tinh dầu thực vật lau gỗ hữu cơ. Mỗi 12 tháng, thoa một lớp mỏng sẽ giúp vân gỗ óc chó giữ nguyên độ bóng mượt trầm ấm vĩnh cửu.
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
                    Vận chuyển &amp; Bốc dỡ tầng lầu
                  </h4>
                  <ul className="flex flex-col gap-2 text-xs text-[#51443d] leading-relaxed">
                    <li className="flex items-start gap-2">
                      <CheckCircleFilled className="text-emerald-700 text-[14px] mt-0.5" />
                      <span>Miễn phí vận chuyển và khiêng lắp tận phòng khách cho mọi đơn hàng tại nội thành Hà Nội &amp; TP.HCM.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleFilled className="text-emerald-700 text-[14px] mt-0.5" />
                      <span>Hỗ trợ khảo sát kích thước thang máy chung cư, cầu thang bộ trước khi xuất xưởng để đảm bảo sofa vừa vặn cửa ra vào.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleFilled className="text-emerald-700 text-[14px] mt-0.5" />
                      <span>Các tỉnh thành khác: Đóng kiện gỗ pallet tiêu chuẩn bảo vệ tuyệt đối, cước phí tính theo biểu giá thực tế nhà xe uy tín.</span>
                    </li>
                  </ul>
                </div>

                <div className="p-5 bg-white border border-[#eae1dd] shadow-sm flex flex-col gap-3">
                  <h4 className="font-bold text-sm text-[#5d371f] flex items-center gap-2">
                    <SyncOutlined className="text-[18px]" />
                    Chính sách trải nghiệm &amp; Đổi trả
                  </h4>
                  <ul className="flex flex-col gap-2 text-xs text-[#51443d] leading-relaxed">
                    <li className="flex items-start gap-2">
                      <CheckCircleFilled className="text-emerald-700 text-[14px] mt-0.5" />
                      <span>Đổi mới hoàn toàn trong 14 ngày nếu phát hiện lỗi mối mọt ngầm hoặc cong vênh do kết cấu kỹ thuật.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleFilled className="text-emerald-700 text-[14px] mt-0.5" />
                      <span>Bảo trì trọn đời: Hỗ trợ may lại vỏ đệm vải, thay thế mút hoặc đánh bóng làm mới khung gỗ với chi phí gốc cho khách hàng D2 LUXURY.</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Curated Companion Pieces (Cross-sell in same style) */}
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
      </main>

      {/* Global Footer */}
      <Footer />

      {/* Corner Guide Info Modal */}
      <Modal
        open={isCornerGuideOpen}
        onCancel={() => setIsCornerGuideOpen(false)}
        footer={null}
        centered
        width={540}
        destroyOnHidden
      >
        <div className="flex flex-col gap-4 p-2">
          <h3 className="font-bold text-base text-[#5d371f]">
            Quy ước chọn góc sofa chữ L
          </h3>

          <div className="flex flex-col gap-3 text-xs text-[#51443d] leading-relaxed">
            <p>
              <strong className="text-[#1f1b19] font-bold">Góc Trái (L):</strong> Khi quý khách đứng đối diện nhìn thẳng vào mặt trước của bộ sofa, phần góc chữ L vươn dài nằm ở phía tay trái của quý khách.
            </p>
            <p>
              <strong className="text-[#1f1b19] font-bold">Góc Phải (R):</strong> Khi đứng đối diện nhìn thẳng vào sofa, phần góc vươn dài nằm ở phía tay phải của quý khách.
            </p>
            <p>
              <strong className="text-[#1f1b19] font-bold">Đôn Rời:</strong> Phần chữ L có thể tách rời linh hoạt, quý khách dễ dàng chuyển đổi bên trái hoặc bên phải tùy ý theo từng dịp sum họp.
            </p>
          </div>

          <Button
            type="primary"
            onClick={() => setIsCornerGuideOpen(false)}
            block
            className="h-10 bg-[#5d371f] hover:!bg-[#784e34] rounded-none font-bold mt-2"
          >
            Tôi đã hiểu
          </Button>
        </div>
      </Modal>

      {/* Wood Comparison Modal */}
      <Modal
        open={isWoodModalOpen}
        onCancel={() => setIsWoodModalOpen(false)}
        footer={null}
        centered
        width={720}
        destroyOnHidden
      >
        <div className="flex flex-col gap-4 p-2">
          <h3 className="font-bold text-base text-[#5d371f]">
            So sánh đặc tính các loại gỗ tự nhiên
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-[#fbf2ee] border border-[#eae1dd] flex flex-col gap-2">
              <div className="w-full h-16 bg-[#523826] shadow-inner" />
              <h4 className="font-bold text-sm text-[#1f1b19]">Gỗ Óc Chó (Walnut)</h4>
              <p className="text-[#51443d] leading-relaxed">
                Chuẩn FAS Bắc Mỹ. Vân gỗ cuộn sóng nâu trầm sang trọng, tính ổn định cực cao, chống co ngót cong vênh hoàn hảo.
              </p>
            </div>

            <div className="p-3 bg-[#fbf2ee] border border-[#eae1dd] flex flex-col gap-2">
              <div className="w-full h-16 bg-[#c8a97e] shadow-inner" />
              <h4 className="font-bold text-sm text-[#1f1b19]">Gỗ Sồi Trắng (Oak)</h4>
              <p className="text-[#51443d] leading-relaxed">
                Nhập khẩu Nga. Vân gỗ thẳng dài, tone sáng ấm áp, mang đậm nét thư thái phong cách Scandinavian &amp; Japandi.
              </p>
            </div>

            <div className="p-3 bg-[#fbf2ee] border border-[#eae1dd] flex flex-col gap-2">
              <div className="w-full h-16 bg-[#deb887] shadow-inner" />
              <h4 className="font-bold text-sm text-[#1f1b19]">Gỗ Tần Bì (Ash)</h4>
              <p className="text-[#51443d] leading-relaxed">
                Gỗ tự nhiên dẻo dai, thớ vân sáng rõ nét, phản chiếu ánh sáng tự nhiên tốt, độ bám ốc mộng chắc chắn.
              </p>
            </div>
          </div>

          <Button
            type="primary"
            onClick={() => setIsWoodModalOpen(false)}
            block
            className="h-10 bg-[#5d371f] hover:!bg-[#784e34] rounded-none font-bold"
          >
            Đóng bảng so sánh
          </Button>
        </div>
      </Modal>

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
