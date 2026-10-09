'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Drawer, App } from 'antd';
import {
  CloseOutlined,
  HeartFilled,
  ShoppingCartOutlined,
  DeleteOutlined,
  ArrowRightOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useCart } from '@/context/CartContext';
import { Product } from '@/types';
import { productApi, FeaturedCatalogProduct } from '@/api/productApi';

function mapCatalogToWishlistProduct(item: FeaturedCatalogProduct): Product {
  const rawSpace = (item.space || '').toLowerCase();
  let space: 'living' | 'bedroom' | 'dining' | 'office' = 'living';
  if (rawSpace.includes('bed') || rawSpace.includes('ngủ')) space = 'bedroom';
  else if (rawSpace.includes('din') || rawSpace.includes('ăn')) space = 'dining';
  else if (rawSpace.includes('off') || rawSpace.includes('việc')) space = 'office';
  else space = 'living';

  return {
    id: item.id,
    sku: item.code || `SP-${item.id.slice(0, 5)}`,
    name: item.name,
    category: space,
    categoryName: item.categoryName || 'Tuyển chọn',
    price: item.price,
    originalPrice: item.originalPrice && item.originalPrice > item.price ? item.originalPrice : undefined,
    image: item.image || '/logo.png',
    tag: item.stockNote || item.collection || 'Nghệ nhân',
    woodType: item.material || item.metaInfo || 'Gỗ tự nhiên cao cấp',
    rating: 5.0,
    reviewCount: 24,
    subtitle: item.collection || 'Chế tác thủ công',
    description: item.description || '',
    dimensions: item.dimensions || 'Tiêu chuẩn',
    stockStatus: item.stockType === 'custom' ? 'Đặt may đo' : 'Sẵn hàng',
    inStock: item.stockType !== 'custom',
    materialDetails: item.material || 'Gỗ tự nhiên cao cấp',
  };
}

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WishlistDrawer({ isOpen, onClose }: WishlistDrawerProps) {
  const { message } = App.useApp();
  const { wishlistIds, toggleWishlist, addToCart } = useCart();
  const [dbProducts, setDbProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!isOpen || wishlistIds.length === 0) return;
    let isMounted = true;
    async function loadWishlistProducts() {
      try {
        const list = await productApi.getProducts({ pageSize: 100 });
        if (isMounted && Array.isArray(list)) {
          setDbProducts(list.map(mapCatalogToWishlistProduct));
        }
      } catch (e) {
        console.warn('Could not load products for wishlist:', e);
      }
    }
    loadWishlistProducts();
    return () => {
      isMounted = false;
    };
  }, [isOpen, wishlistIds]);

  // Resolve all favorited items
  const favoritedProducts = useMemo(() => {
    return wishlistIds
      .map((id) => {
        const found = dbProducts.find((p) => p.id === id || p.sku.toLowerCase() === id.toLowerCase());
        return found || null;
      })
      .filter((p): p is Product => p !== null);
  }, [wishlistIds, dbProducts]);


  const handleAddToCart = (item: Product) => {
    addToCart({
      id: item.id,
      sku: item.sku,
      name: item.name,
      collection: item.categoryName || 'Tuyệt tác mộc',
      badge: item.tag || 'Nghệ nhân',
      image: item.image,
      price: item.price,
      originalPrice: item.originalPrice,
      specs: [item.woodType, item.dimensions].filter(Boolean),
    }, 1);
    message.success(`Đã thêm "${item.name}" vào giỏ hàng!`);
  };

  const handleRemove = (id: string, name: string) => {
    toggleWishlist(id);
    message.info(`Đã xóa "${name}" khỏi danh sách yêu thích`);
  };

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      placement="right"
      destroyOnHidden
      closable={false}
      styles={{
        wrapper: {
          width: 460,
          maxWidth: '100vw',
        },
        body: {
          padding: 0,
          backgroundColor: '#fff8f5',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        },
      }}
    >
      {/* Header */}
      <div className="p-5 bg-white border-b border-[#eae1dd] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-none bg-[#f5ece8] text-[#5d371f] flex items-center justify-center">
            <HeartFilled className="text-base text-[#ba1a1a]" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-[#1f1b19]">
              Tác Phẩm Yêu Thích
            </h3>
            <p className="text-xs text-[#83746c]">
              {favoritedProducts.length > 0
                ? `${favoritedProducts.length} tác phẩm đã lưu`
                : 'Chưa có tác phẩm nào'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          type="button"
          aria-label="Đóng"
          className="p-2 text-[#83746c] hover:text-[#1f1b19] transition-colors cursor-pointer"
        >
          <CloseOutlined className="text-base" />
        </button>
      </div>

      {/* Content List */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
        {favoritedProducts.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-4">
            <div className="w-16 h-16 bg-[#f5ece8] rounded-none flex items-center justify-center text-[#d5c3ba] mb-4">
              <HeartFilled className="text-3xl text-[#d5c3ba]" />
            </div>
            <h4 className="font-serif text-lg font-bold text-[#1f1b19] mb-1">
              Danh sách yêu thích đang trống
            </h4>
            <p className="text-xs text-[#83746c] max-w-xs mb-6 leading-relaxed">
              Hãy thả tim những tuyệt tác nội thất gỗ tự nhiên bạn yêu thích để dễ dàng xem lại và so sánh.
            </p>
            <Link
              href="/products"
              onClick={onClose}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5d371f] text-white text-xs font-semibold hover:bg-[#784e34] transition-colors"
            >
              <span>Khám phá sản phẩm</span>
              <ArrowRightOutlined />
            </Link>
          </div>
        ) : (
          favoritedProducts.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-[#eae1dd] p-4 flex gap-4 shadow-sm hover:border-[#5d371f]/40 transition-all group"
            >
              {/* Product Thumbnail */}
              <Link
                href={`/products/${item.id}`}
                onClick={onClose}
                className="w-24 h-24 bg-[#f5ece8] border border-[#eae1dd] shrink-0 overflow-hidden relative block"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {item.tag && (
                  <span className="absolute top-1 left-1 bg-[#784e34] text-white text-[9px] font-bold px-1.5 py-0.5">
                    {item.tag}
                  </span>
                )}
              </Link>

              {/* Product Details & Actions */}
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/products/${item.id}`}
                      onClick={onClose}
                      className="font-serif text-sm font-bold text-[#1f1b19] hover:text-[#5d371f] transition-colors truncate block"
                    >
                      {item.name}
                    </Link>
                    <button
                      onClick={() => handleRemove(item.id, item.name)}
                      type="button"
                      title="Bỏ thích"
                      className="text-[#83746c] hover:text-[#ba1a1a] transition-colors p-0.5 cursor-pointer shrink-0"
                    >
                      <DeleteOutlined className="text-sm" />
                    </button>
                  </div>

                  <p className="text-[11px] text-[#83746c] truncate mt-0.5">
                    {item.woodType}
                  </p>
                </div>

                <div className="mt-2 pt-2 border-t border-[#f5ece8] flex items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-[#5d371f] font-data-mono block">
                      {item.price.toLocaleString('vi-VN')}đ
                    </span>
                  </div>

                  <button
                    onClick={() => handleAddToCart(item)}
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#5d371f] text-white text-[11px] font-semibold hover:bg-[#784e34] transition-colors shadow-sm cursor-pointer"
                  >
                    <ShoppingCartOutlined />
                    <span>Thêm giỏ</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Actions */}
      {favoritedProducts.length > 0 && (
        <div className="p-4 bg-white border-t border-[#eae1dd] flex flex-col gap-2">
          <Link
            href="/cart"
            onClick={onClose}
            className="w-full bg-[#5d371f] text-white py-2.5 px-4 text-center font-semibold text-xs hover:bg-[#784e34] transition-colors flex items-center justify-center gap-2"
          >
            <span>Đến trang giỏ hàng</span>
            <ArrowRightOutlined />
          </Link>
          <Link
            href="/products"
            onClick={onClose}
            className="w-full py-2 text-center text-xs text-[#5d371f] hover:text-[#784e34] transition-colors font-medium"
          >
            Tiếp tục xem bộ sưu tập
          </Link>
        </div>
      )}
    </Drawer>
  );
}
