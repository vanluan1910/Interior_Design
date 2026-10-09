'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import LivingSpaces from '@/components/LivingSpaces';
import FeaturedProducts from '@/components/FeaturedProducts';
import CraftsmanshipStory from '@/components/CraftsmanshipStory';
import MaterialExperience from '@/components/MaterialExperience';
import ShowroomSection from '@/components/ShowroomSection';
import Footer from '@/components/Footer';
import QuickViewModal from '@/components/QuickViewModal';
import SampleBoxModal from '@/components/SampleBoxModal';
import { Product } from '@/types';
import { App } from 'antd';
import { useCart } from '@/context/CartContext';
import { homeApi, HomeDataResponse, HomeProductItem } from '@/api/homeApi';
import { productApi, FeaturedCatalogProduct } from '@/api/productApi';

function detectCategory(space?: string, catName?: string, name?: string, sku?: string): 'living' | 'bedroom' | 'dining' | 'office' {
  const s = (space || '').toLowerCase().trim();
  const c = (catName || '').toLowerCase().trim();
  const n = (name || '').toLowerCase().trim();
  const k = (sku || '').toLowerCase().trim();

  if (
    s.includes('bed') || s.includes('ngủ') || s === 'kg03' || s === 'nh03' ||
    c.includes('ngủ') || c.includes('giường') ||
    n.includes('giường') || n.includes('táp') || n.includes('tab') || n.includes('tủ áo') || n.includes('tủ quần áo') || n.includes('nệm') ||
    k.startsWith('bd') || k.startsWith('gn')
  ) {
    return 'bedroom';
  }

  if (
    s.includes('din') || s.includes('ăn') || s.includes('bếp') || s === 'kg02' || s === 'nh02' ||
    c.includes('ăn') || c.includes('bếp') ||
    n.includes('bàn ăn') || n.includes('ghế ăn') || n.includes('tủ bếp') || n.includes('bàn ghế ăn') ||
    k.startsWith('dt') || k.startsWith('dc') || k.startsWith('ba') || k.startsWith('ga')
  ) {
    return 'dining';
  }

  if (
    s.includes('off') || s.includes('work') || s.includes('việc') || s.includes('sách') || s === 'kg04' || s === 'nh04' ||
    c.includes('việc') || c.includes('sách') ||
    n.includes('làm việc') || n.includes('bàn giám đốc') || n.includes('kệ sách') || n.includes('giá sách') || n.includes('ghế công thái học') || n.includes('bàn học') ||
    k.startsWith('of') || k.startsWith('dk') || k.startsWith('blv')
  ) {
    return 'office';
  }

  return 'living';
}

function mapHomeProductToProduct(item: HomeProductItem): Product {
  const cat = detectCategory(item.category, item.categoryName, item.name, item.sku);

  return {
    id: item.id,
    sku: item.sku || `SP-${item.id.slice(0, 5)}`,
    name: item.name,
    category: cat,
    categoryName: item.categoryName || (cat === 'living' ? 'Phòng Khách' : cat === 'bedroom' ? 'Phòng Ngủ' : cat === 'dining' ? 'Phòng Ăn' : 'Phòng Làm Việc'),
    price: item.price,
    image: item.image || '/images/placeholder.jpg',
    woodType: item.woodType || 'Gỗ tự nhiên',
    rating: item.rating || 5.0,
    reviewCount: item.reviewCount || 24,
    subtitle: item.woodType || 'Chế tác thủ công',
    description: `Sản phẩm ${item.name} từ gỗ tự nhiên cao cấp, hoàn thiện tỉ mỉ bởi nghệ nhân mộc D2 Luxury.`,
    dimensions: item.dimensions || 'Theo thiết kế',
    stockStatus: item.inStock ? 'Còn hàng' : 'Đặt may đo',
    inStock: item.inStock,
    materialDetails: `${item.woodType} tuyển chọn, sơn lau dầu thực vật Osmo an toàn`,
  };
}

function mapCatalogProductToProduct(item: FeaturedCatalogProduct): Product {
  const cat = detectCategory(item.space, item.categoryName, item.name, item.code);

  return {
    id: item.id,
    sku: item.code || `SP-${item.id.slice(0, 5)}`,
    name: item.name,
    category: cat,
    categoryName: item.categoryName || (cat === 'living' ? 'Phòng Khách' : cat === 'bedroom' ? 'Phòng Ngủ' : cat === 'dining' ? 'Phòng Ăn' : 'Phòng Làm Việc'),
    price: item.price,
    image: item.image || '/images/placeholder.jpg',
    woodType: item.metaInfo || item.material || 'Gỗ tự nhiên',
    rating: 5.0,
    reviewCount: 24,
    subtitle: item.collection || item.metaInfo || 'Chế tác thủ công',
    description: item.description || `Sản phẩm ${item.name} từ gỗ tự nhiên cao cấp, hoàn thiện tỉ mỉ bởi nghệ nhân mộc D2 Luxury.`,
    dimensions: item.dimensions || 'Theo thiết kế',
    stockStatus: item.stockType === 'custom' ? 'Đặt may đo' : 'Còn hàng',
    inStock: item.stockType !== 'custom',
    materialDetails: `${item.material || item.metaInfo || 'Gỗ tự nhiên'} tuyển chọn, sơn lau dầu thực vật Osmo an toàn`,
  };
}

export default function HomePage() {
  const { message } = App.useApp();

  // Home API Data state
  const [homeData, setHomeData] = useState<HomeDataResponse | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Modal States
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [sampleModalOpen, setSampleModalOpen] = useState(false);

  // Global Cart & Wishlist from localStorage
  const { cartCount, wishlistCount, wishlistIds, toggleWishlist: contextToggleWishlist, addToCart } = useCart();

  // Load Home Data & Product Catalog from API with instant cache hydration
  useEffect(() => {
    let isMounted = true;

    // 1. Instant hydration from cache to prevent any delay / image flash
    try {
      const cached = typeof window !== 'undefined' ? sessionStorage.getItem('d2_homedata_cache') : null;
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed) {
          setHomeData(parsed);
          if (parsed.featuredProducts && parsed.featuredProducts.length > 0) {
            setProducts(parsed.featuredProducts.map(mapHomeProductToProduct));
          }
        }
      }
    } catch {}

    // 2. Fetch fresh data from APIs in background
    async function fetchAllData() {
      setIsLoading(true);
      try {
        const [homeRes, catalogRes] = await Promise.allSettled([
          homeApi.getHomeData(),
          productApi.getProducts({ pageSize: 500 }),
        ]);

        if (isMounted) {
          if (homeRes.status === 'fulfilled' && homeRes.value) {
            setHomeData(homeRes.value);
            try {
              sessionStorage.setItem('d2_homedata_cache', JSON.stringify(homeRes.value));
            } catch {}
          }

          if (catalogRes.status === 'fulfilled' && catalogRes.value && catalogRes.value.length > 0) {
            const mappedCatalog = catalogRes.value.map(mapCatalogProductToProduct);
            setProducts(mappedCatalog);
          } else if (homeRes.status === 'fulfilled' && homeRes.value?.featuredProducts && homeRes.value.featuredProducts.length > 0) {
            const mappedHome = homeRes.value.featuredProducts.map(mapHomeProductToProduct);
            setProducts(mappedHome);
          }
        }
      } catch (err) {
        console.warn('Could not load homepage data from API:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchAllData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Cart Handlers
  const handleAddToCart = (product: Product, quantity = 1) => {
    addToCart(
      {
        id: product.id,
        sku: product.sku,
        name: product.name,
        collection: product.categoryName || 'Tuyệt tác mộc',
        badge: product.tag || 'Nghệ nhân',
        image: product.image,
        price: product.price,
        originalPrice: product.originalPrice,
        specs: [product.woodType, product.dimensions],
      },
      quantity
    );
    message.success(`Đã thêm ${product.name} vào giỏ hàng!`);
  };

  const handleToggleWishlist = (productId: string) => {
    const willBeFavorite = !wishlistIds.includes(productId);
    contextToggleWishlist(productId);
    if (willBeFavorite) {
      message.success('Đã lưu vào danh sách yêu thích!');
    } else {
      message.info('Đã xóa khỏi danh sách yêu thích');
    }
  };

  const handleCategorySelect = (category: string) => {
    setActiveCategory(category);
    const element = document.getElementById('featured-products');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#fff8f5] text-[#1f1b19] selection:bg-[#ffdbc8] selection:text-[#311301]">
      {/* Header */}
      <Header
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        onOpenBooking={() => {}}
      />

      {/* Main Content Sections */}
      <main className="w-full animate-slide-in-bottom">
        {/* Hero Banner with Integrated Service Guarantees */}
        <Hero onOpenBooking={() => {}} hero={homeData?.hero} />

        {/* Bento Living Space Categories */}
        <LivingSpaces onSelectCategory={handleCategorySelect} spaces={homeData?.livingSpaces} />

        {/* Featured Artisan Products */}
        <FeaturedProducts
          products={products}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          onQuickView={(p) => setQuickViewProduct(p)}
          onAddToCart={(p) => handleAddToCart(p, 1)}
          onToggleWishlist={handleToggleWishlist}
          wishlistIds={wishlistIds}
        />

        {/* Craftsmanship & Workshop Story */}
        <CraftsmanshipStory onOpenBooking={() => {}} />

        {/* Interactive Material Experience */}
        <MaterialExperience products={products} />

        {/* Showrooms & Consultation */}
        <ShowroomSection
          onOpenBooking={() => {}}
          showrooms={homeData?.showrooms}
          companyInfo={homeData?.companyInfo}
        />
      </main>

      {/* Footer */}
      <Footer />

      {/* Modals */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={handleAddToCart}
      />

      <SampleBoxModal
        isOpen={sampleModalOpen}
        onClose={() => setSampleModalOpen(false)}
      />
    </div>
  );
}
