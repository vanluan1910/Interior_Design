'use client';

import React from 'react';
import Link from 'next/link';
import { Drawer, message } from 'antd';
import {
  CloseOutlined,
  HeartFilled,
  ShoppingCartOutlined,
  DeleteOutlined,
  ArrowRightOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useCart } from '@/context/CartContext';
import { productsData } from '@/data/products';
import { Product } from '@/types';

// Fallback registry for products not in productsData (e.g. cart items or demo products)
const ADDITIONAL_PRODUCTS: Record<string, Partial<Product>> = {
  'ghe-asahi-03': {
    id: 'ghe-asahi-03',
    sku: 'ASAHI-CH-03',
    name: 'Ghế Đơn Thư Giãn Asahi',
    category: 'living',
    categoryName: 'Phòng Khách',
    price: 15500000,
    originalPrice: 18000000,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCeYxctmB1Dxdn8V4AgUwcZwDxyrTW-PD8eaXagufX9ZMRkovl0piwtfzujF_c3DEaI7p019YQuMg79N_yRabORZjBes6C9T6PjAY11rC9KS_dRcSz-AcMj9oH5tcZ8sgZDOR4j8OLTsw4GiVFQpbrSVI4fvH65cEp2ZPJKpylJXWLox37mmjjkS8FSNioYKRxa5MUYIvUXsOOS_7qA73gWeuK22kArdl6yXDvB7P-ZOSi8KDm3XpkK',
    woodType: 'Khung gỗ sồi uốn mộng',
    dimensions: 'Rộng 72cm x Sâu 78cm x Cao 80cm',
    tag: 'Tuyệt phẩm mộc',
    subtitle: 'Vải Bouclé lông cừu thô nhập Ý',
  },
  'ke-tivi-haru-01': {
    id: 'ke-tivi-haru-01',
    sku: 'HARU-TV-01',
    name: 'Kệ Tivi Nan Gỗ Haru',
    category: 'living',
    categoryName: 'Phòng Khách',
    price: 19200000,
    originalPrice: 22500000,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDQeD8L9b-wQ84w_5m07m4p7kP_tLw8c6q1R0X5r9_tPq7b4Z-k3N1m_x8_z9L3_k2P8q-J1y5m_X2L9q-4b-1m_9q4b1_x2_1k2m3q4b5',
    woodType: 'Gỗ óc chó Bắc Mỹ',
    dimensions: 'Dài 2m x Sâu 42cm x Cao 48cm',
    tag: 'Sẵn tại Showroom',
    subtitle: 'Hệ nan trượt âm mộc thủ công',
  },
  'sofa-kyoto-02': {
    id: 'sofa-kyoto-02',
    sku: 'KYOTO-SF-02',
    name: 'Sofa Gỗ Óc Chó Kyoto',
    category: 'living',
    categoryName: 'Phòng Khách',
    price: 33900000,
    originalPrice: 38500000,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCLzX1m-X7qP4b-m0k_9_1L3rP4b-x2_1k2m3q4b5-x2_1k2m3q4b5_x2_1k2m3q4b5_x2_1k2m3q4b5_x2_1k2m3q4b5_x2_1k2m3q4b5',
    woodType: 'Gỗ óc chó Bắc Mỹ',
    dimensions: 'Dài 2m2 x Sâu 85cm x Cao 75cm',
    tag: 'Sẵn tại Showroom',
    subtitle: 'Nệm da Microfiber cao cấp',
  },
  'ban-tra-fujin-04': {
    id: 'ban-tra-fujin-04',
    sku: 'FUJIN-TB-04',
    name: 'Bàn Trà Tròn Đôi Fujin',
    category: 'living',
    categoryName: 'Phòng Khách',
    price: 12800000,
    originalPrice: 14500000,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAqUPQ9a0yHdlQ7Bz3fQ-I6wb9eR7E-C1m7mckzyZnh09REjlPzqSWxBv7awPl9y5vw3IaCZVjQFkabWYYwoNs4x73uBtFpNL6m-jBsNH4rb4U24m5f2BN8Sr8ZqijfWCwApfRt2kBVmEy2Anq7l8iCnKeg_bWwTYxP7dVzJhusfMJG8HiZ1t_tXf4eHcX0xXJsiKkoKmaLjoGi57oyt5KjDECuXyNmECHIH2L4xzBQN8ucf7zIVpE0',
    woodType: 'Gỗ sồi trắng Bắc Mỹ',
    dimensions: 'D800 + D500mm',
    tag: 'Tuyệt phẩm mộc',
    subtitle: 'Dầu mộc Osmo Đức',
  },
  'cs-01': {
    id: 'cs-01',
    sku: 'CS-01',
    name: 'Đôn Gỗ Óc Chó Điêu Khắc Mộng',
    category: 'living',
    categoryName: 'Phụ kiện',
    price: 4500000,
    originalPrice: 5200000,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCeYxctmB1Dxdn8V4AgUwcZwDxyrTW-PD8eaXagufX9ZMRkovl0piwtfzujF_c3DEaI7p019YQuMg79N_yRabORZjBes6C9T6PjAY11rC9KS_dRcSz-AcMj9oH5tcZ8sgZDOR4j8OLTsw4GiVFQpbrSVI4fvH65cEp2ZPJKpylJXWLox37mmjjkS8FSNioYKRxa5MUYIvUXsOOS_7qA73gWeuK22kArdl6yXDvB7P-ZOSi8KDm3XpkK',
    woodType: 'Gỗ óc chó Bắc Mỹ',
    dimensions: 'D35cm x Cao 45cm',
    tag: 'Gỗ nguyên khối',
    subtitle: 'Chạm khắc liền khối độc bản',
  },
  'cs-02': {
    id: 'cs-02',
    sku: 'CS-02',
    name: 'Thảm Len Lụa Dệt Tay Thiền Định',
    category: 'living',
    categoryName: 'Phụ kiện',
    price: 6800000,
    originalPrice: 7900000,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA0mYv6KR-IXvIVNV4Ii1JspydQgaItxZnvowNsSdHKBqslS9JAaL9r0dvB10V9F0S5FTPxiKLDVI2wf_QSO_LwxkGttnXsPa8x1kpMSC-tBWS6JG4wM2wXIdUr5kRWdNOwMZJMR13avraXRJOcftW59yQJMeaTLByAHmVpmsjxX9Lsk1xfoN_ESbWir-ySUEeXzBWiugM6LYft0uH6bofZXQPhB5IAbYU81KVDs9hDVnowCk9itX9-',
    woodType: 'Sợi len New Zealand & Lụa tơ tằm',
    dimensions: '2m x 3m',
    tag: 'Dệt thủ công',
    subtitle: 'Sợi tự nhiên dệt tay',
  },
  'cs-03': {
    id: 'cs-03',
    sku: 'CS-03',
    name: 'Đèn Sàn Wabi-sabi Chao Giấy Washi',
    category: 'living',
    categoryName: 'Phụ kiện',
    price: 3800000,
    originalPrice: 4500000,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDPMi2TNda8iR_z2y8trj0hiANnVhDXXY9E-aaMhYL2OKwsrFmYsQcKJgp2JnDBYvOD2olamFS3hoUvtk1PqHxh7lsRZmGgs60LhS4s374cxUn0gUVBRgLGyajGox23IsI10UXc2T46O6jc8rtY0Iv_DiwIrdb7BHalqEI88r3Q6v-RM3y5ye8B9rroxzwOkw096q8GSuKUA5WMV7N6-JE38ZnnUQtSEnWW7DYnb7qC-MxrfJZPyAkm',
    woodType: 'Khung gỗ sồi & Giấy Washi Nhật',
    dimensions: 'Cao 140cm',
    tag: 'Ánh sáng ấm',
    subtitle: 'Giấy Washi thủ công Nhật Bản',
  },
};

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WishlistDrawer({ isOpen, onClose }: WishlistDrawerProps) {
  const { wishlistIds, toggleWishlist, addToCart } = useCart();

  // Resolve all favorited items
  const favoritedProducts = wishlistIds.map((id) => {
    const foundInMain = productsData.find((p) => p.id === id);
    if (foundInMain) return foundInMain;

    const foundInExtra = ADDITIONAL_PRODUCTS[id];
    if (foundInExtra) {
      return {
        id: foundInExtra.id || id,
        sku: foundInExtra.sku || id.toUpperCase(),
        name: foundInExtra.name || 'Tác phẩm mộc thủ công',
        category: foundInExtra.category || 'living',
        categoryName: foundInExtra.categoryName || 'Tuyển chọn',
        price: foundInExtra.price || 15000000,
        originalPrice: foundInExtra.originalPrice || 17000000,
        image: foundInExtra.image || '/logo.png',
        tag: foundInExtra.tag || 'Nghệ nhân',
        woodType: foundInExtra.woodType || 'Gỗ tự nhiên cao cấp',
        rating: 5.0,
        reviewCount: 12,
        subtitle: foundInExtra.subtitle || 'Chế tác mộng mộc truyền thống',
        description: 'Tác phẩm nội thất chế tác tinh xảo.',
        dimensions: foundInExtra.dimensions || 'Tiêu chuẩn',
        stockStatus: 'Sẵn hàng',
        inStock: true,
        materialDetails: 'Gỗ sấy chân không đạt chuẩn',
      } as Product;
    }

    return {
      id,
      sku: id.toUpperCase(),
      name: 'Tác phẩm nội thất',
      category: 'living',
      categoryName: 'Bộ sưu tập',
      price: 15000000,
      originalPrice: 17000000,
      image: '/logo.png',
      tag: 'Yêu thích',
      woodType: 'Gỗ tự nhiên',
      rating: 5.0,
      reviewCount: 10,
      subtitle: 'Tuyệt phẩm mộc',
      description: '',
      dimensions: '',
      stockStatus: 'Sẵn hàng',
      inStock: true,
      materialDetails: '',
    } as Product;
  });

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
      width={460}
      closable={false}
      styles={{
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
                    {item.originalPrice && item.originalPrice > item.price && (
                      <span className="text-[10px] text-[#83746c] line-through font-data-mono block">
                        {item.originalPrice.toLocaleString('vi-VN')}đ
                      </span>
                    )}
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
