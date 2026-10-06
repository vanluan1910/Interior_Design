'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Commitments from '@/components/Commitments';
import LivingSpaces from '@/components/LivingSpaces';
import FeaturedProducts from '@/components/FeaturedProducts';
import CraftsmanshipStory from '@/components/CraftsmanshipStory';
import MaterialExperience from '@/components/MaterialExperience';
import ShowroomSection from '@/components/ShowroomSection';
import Footer from '@/components/Footer';
import QuickViewModal from '@/components/QuickViewModal';
import SampleBoxModal from '@/components/SampleBoxModal';
import { productsData } from '@/data/products';
import { Product, CartItem } from '@/types';
import { App } from 'antd';

import { useCart } from '@/context/CartContext';

export default function HomePage() {
  const { message } = App.useApp();
  // Products & Categories
  const [products] = useState<Product[]>(productsData);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Modal States
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [sampleModalOpen, setSampleModalOpen] = useState(false);

  // Global Cart & Wishlist from localStorage
  const { cartCount, wishlistCount, wishlistIds, toggleWishlist: contextToggleWishlist, addToCart } = useCart();

  // Cart Handlers
  const handleAddToCart = (product: Product, quantity = 1) => {
    addToCart({
      id: product.id,
      sku: product.sku,
      name: product.name,
      collection: product.categoryName || 'Tuyệt tác mộc',
      badge: product.tag || 'Nghệ nhân',
      image: product.image,
      price: product.price,
      originalPrice: product.originalPrice,
      specs: [product.woodType, product.dimensions],
    }, quantity);
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
        {/* Hero Banner */}
        <Hero onOpenBooking={() => {}} />

        {/* Brand Commitments */}
        <Commitments />

        {/* Bento Living Space Categories */}
        <LivingSpaces onSelectCategory={handleCategorySelect} />

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

        {/* Interactive Material Experience & Free Samples */}
        <MaterialExperience onOpenSampleModal={() => setSampleModalOpen(true)} />

        {/* Showrooms & Consultation */}
        <ShowroomSection onOpenBooking={() => {}} />
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
