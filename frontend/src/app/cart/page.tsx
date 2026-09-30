'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { App, Tooltip } from 'antd';
import {
  RightOutlined,
  DeleteOutlined,
  PlusOutlined,
  MinusOutlined,
  CheckOutlined,
  ArrowRightOutlined,
  SafetyCertificateOutlined,
  FileProtectOutlined,
  CreditCardOutlined,
  CustomerServiceOutlined,
  GiftOutlined,
  CarOutlined,
  CloseOutlined,
  TagOutlined,
} from '@ant-design/icons';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface CartProductItem {
  id: string;
  sku: string;
  name: string;
  collection: string;
  badge: string;
  image: string;
  price: number;
  originalPrice: number;
  quantity: number;
  selected: boolean;
  isFavorite: boolean;
  specs: string[];
  giftInfo?: string;
}

const INITIAL_CART_ITEMS: CartProductItem[] = [
  {
    id: 'sofa-kyoto-01',
    sku: 'KYOTO-SF-01',
    name: 'Sofa Góc Chữ L Gỗ Óc Chó Kyoto',
    collection: 'Bộ sưu tập Kyoto 2025',
    badge: '12% Nghệ nhân',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDQRsgCBkXk2ENFvYz1MIvU_LUcCG4-zF_TKp8yQCWu2qEXucWTkueS1S9rYlrjYAVmEdiu9vVFawmJ5igwK_qHnmxyyKsofyqVlCXuNphzYECqgVniDeVda96x74jNeCfJ-TT1q3XRvC44hrCcfeviKISqf9x1ybDmzEVo-mO56aOxr--k0fKaPXeeIQ-Vl8f_ebRuZZp3AKyfwnZ3gOad9HgP40QyVwfe6DwrQNzZoeKtQDjz03yc',
    price: 38500000,
    originalPrice: 44000000,
    quantity: 1,
    selected: true,
    isFavorite: false,
    specs: ['Gỗ óc chó Bắc Mỹ FAS', 'Đệm Linen Oatmeal Bỉ', 'Phân hướng: Góc Phải (R)'],
    giftInfo: 'Tặng kèm: 2 gối tựa lông vũ Mộc Gia nguyên bản (Trị giá 1.800.000đ)',
  },
  {
    id: 'ban-tra-nami-02',
    sku: 'NAMI-TB-02',
    name: 'Bàn Trà Tròn Đôi Mộc Gia',
    collection: 'Bộ sưu tập Sóng Nami',
    badge: 'Nami Series',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD1eUFJm5O0CveRHXEq2DjzxskTcpkaicfB3U-olNREZdP1oq_Ywvo6qgZTpo38bsQ9dnUi7K9obB-nrhixenuyfNAkUUUq8sPc22O3Wx4C6pyq5sjvvl5u--CAqkkt--92J156F7tBRMtMIE0gSk-dHtU_z5i7j-5GiPgULfNvWNKjmhzaM1masM2uHvVXw0gExIB4Qavij4W0lBuZgowrlLt_zg_JkO8yuYPu1ITMjGJZKR3A5m5S',
    price: 11800000,
    originalPrice: 14200000,
    quantity: 1,
    selected: true,
    isFavorite: false,
    specs: ['Gỗ sồi trắng Bắc Mỹ', 'Dầu mộc Osmo Đức', 'Đường kính D800 + D500mm', 'Vát bo 45° lượn sóng'],
  },
  {
    id: 'ghe-asahi-03',
    sku: 'ASAHI-CH-03',
    name: 'Ghế Đơn Thư Giãn Asahi',
    collection: 'Ghế bành thư giãn',
    badge: 'Tuyệt phẩm mộc',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCeYxctmB1Dxdn8V4AgUwcZwDxyrTW-PD8eaXagufX9ZMRkovl0piwtfzujF_c3DEaI7p019YQuMg79N_yRabORZjBes6C9T6PjAY11rC9KS_dRcSz-AcMj9oH5tcZ8sgZDOR4j8OLTsw4GiVFQpbrSVI4fvH65cEp2ZPJKpylJXWLox37mmjjkS8FSNioYKRxa5MUYIvUXsOOS_7qA73gWeuK22kArdl6yXDvB7P-ZOSi8KDm3XpkK',
    price: 15500000,
    originalPrice: 18000000,
    quantity: 1,
    selected: true,
    isFavorite: true,
    specs: ['Khung gỗ sồi uốn mộng', 'Vải Bouclé lông cừu thô', 'Sấy chân không 45 ngày (ẩm 9-11%)'],
  },
];

const CROSS_SELL_ITEMS = [
  {
    id: 'cross-kaze-tray',
    sku: 'KAZE-TRY-01',
    name: 'Khay Trà Thủ Công Kaze',
    tag: 'Nguyên khối',
    desc: 'Gỗ óc chó nguyên khối chạm sóng gợn nước, phủ dầu mộc kháng nước tự nhiên an toàn.',
    price: 1250000,
    originalPrice: 1500000,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD319-cDweyMPD8117ZPiMqCyLRDIU_L8eoEWbOmlGAO0veNA6SFRAP7QDBW0DmRRHvgfVTU4PtTYFquAI3Gz-yUmO5k07319MCPvmXkGDwBQjoUlUtuJwvwa7L48nhqCPgM_ywsa3I-6-U0_86qdSiHkbCLqjd3fm8U2_fhzVoEMXqp-aDwizfe6NZi4D07FauxxeILFdwAmk0BNQM8I6cFXKDKCOfWlU9vSeC84fYT-8zICtVGbxd',
    specs: ['Gỗ óc chó FAS', 'Chạm khắc thủ công CNC'],
  },
  {
    id: 'cross-lamp-oak',
    sku: 'WABI-LMP-02',
    name: 'Đèn Sàn Đứng Gỗ Sồi Wabi-Sabi',
    tag: 'Ánh sáng ấm',
    desc: 'Khung sồi uốn nhiệt thủ công kết hợp chao vải dệt thô mộc, ánh sáng dịu 2700K êm ái.',
    price: 3450000,
    originalPrice: 4200000,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCviooxRvRYw4GwA7NoVuVnLDUakrH09moQ95wkxLzq-WGjog-PQXCtIvEQWFYOcB6SM1qqVfruyt5JvX3E8kS_95WkEEcSnT3C4cFh4lHdqngh7J-jpsQrVJICp8PQ1dFWv7XXj3gPbIMgdx-P7ObvNyxJd3sdK7fUFVv7uG5aQY1EHQIjA89MdUmQ1O7rQ88euj1XDl34SBfklW_Te2H8dSoKRKzSKTqUmWqlGgVa2mAW20VV_P2I',
    specs: ['Khung sồi tự nhiên', 'Chao vải dệt Linen'],
  },
  {
    id: 'cross-osmo-oil',
    sku: 'OSMO-KIT-03',
    name: 'Bộ Tinh Dầu & Sáp Dưỡng Osmo',
    tag: 'Chăm sóc mộc',
    desc: 'Chiết xuất sáp Carnauba & dầu đậu nành tự nhiên giúp sớ gỗ thở và lưu giữ sắc óc chó.',
    price: 650000,
    originalPrice: 850000,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDZpZ9z1mTWf7auKg7SFK28u_7elE7ODom-yDBNr7FWhE-E0OI8OOWpbvK5NrimzdC-ZLj6j9wMFnCh-uNCCSMT-DpU45k52TouwoHc1HqAqqdjhMwLu_gU-JTggel2nRvpG8Ygs0zbMYzSmRbx46MtfgGViYOCAqy_VtD6sMAAcPezYPr57_W9nb60B33dWlWF29pjTDSIFFAXAjQ6_YmheZPcFlC8kLgIXhL86JEYFiNG-OG7s3rh',
    specs: ['Sáp Carnauba Đức', 'Khăn cotton chuyên dụng'],
  },
];

import { useCart, CartItemData } from '@/context/CartContext';

function CartContent() {
  const { modal, message } = App.useApp();
  const {
    cartItems,
    cartCount,
    wishlistIds,
    wishlistCount,
    updateQuantity,
    removeFromCart,
    removeSelected,
    toggleItemSelect,
    toggleSelectAll,
    toggleWishlist,
    addToCart,
  } = useCart();

  // Toggle select all
  const allSelected = useMemo(() => {
    return cartItems.length > 0 && cartItems.every((item) => item.selected);
  }, [cartItems]);

  const handleRemoveItem = (id: string, name: string) => {
    modal.confirm({
      title: 'Bỏ sản phẩm khỏi giỏ hàng?',
      content: `Bạn có chắc chắn muốn bỏ "${name}" khỏi giỏ hàng?`,
      okText: 'Bỏ sản phẩm',
      cancelText: 'Giữ lại',
      okButtonProps: { danger: true, className: 'rounded-none' },
      cancelButtonProps: { className: 'rounded-none' },
      onOk: () => {
        removeFromCart(id);
        message.info(`Đã bỏ "${name}" khỏi giỏ hàng`);
      },
    });
  };

  const handleRemoveSelected = () => {
    const selectedCount = cartItems.filter((i) => i.selected).length;
    if (selectedCount === 0) {
      message.warning('Vui lòng chọn ít nhất 1 sản phẩm để xóa');
      return;
    }
    modal.confirm({
      title: 'Xóa các sản phẩm đã chọn?',
      content: `Bạn có chắc chắn muốn xóa ${selectedCount} sản phẩm đã chọn khỏi giỏ hàng?`,
      okText: 'Xóa mục đã chọn',
      cancelText: 'Hủy',
      okButtonProps: { danger: true, className: 'rounded-none' },
      cancelButtonProps: { className: 'rounded-none' },
      onOk: () => {
        removeSelected();
        message.info(`Đã xóa ${selectedCount} sản phẩm khỏi giỏ hàng`);
      },
    });
  };

  // Cross-sell quick add
  const handleAddCrossSell = (item: (typeof CROSS_SELL_ITEMS)[0]) => {
    addToCart({
      id: item.id,
      sku: item.sku,
      name: item.name,
      collection: 'Phụ kiện bổ trợ mộc',
      badge: item.tag,
      image: item.image,
      price: item.price,
      originalPrice: item.originalPrice,
      specs: item.specs,
    }, 1);
    message.success(`Đã thêm "${item.name}" vào giỏ hàng!`);
  };

  // Financial Calculations
  const selectedItems = useMemo(() => cartItems.filter((i) => i.selected), [cartItems]);

  const subtotal = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [selectedItems]);

  const finalTotal = useMemo(() => {
    return Math.max(0, subtotal);
  }, [subtotal]);

  const monthlyInstallment = useMemo(() => {
    return finalTotal > 0 ? Math.round(finalTotal / 12) : 0;
  }, [finalTotal]);

  return (
    <div className="min-h-screen flex flex-col bg-[#fff8f5] text-[#1f1b19] font-body-md selection:bg-[#ffdbc8] selection:text-[#311301]">
      {/* Global Header */}
      <Header
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        onOpenCart={() => {}}
        onOpenBooking={() => {}}
      />

      <main className="w-full pt-20 flex-1">
        {/* Top Breadcrumb & Spatial Status Bar */}
        <section className="w-full bg-[#fbf2ee] py-3.5 border-b border-[#eae1dd]">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-medium text-[#83746c]">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 flex-wrap text-xs font-medium text-[#83746c]">
              <Link href="/" className="hover:text-[#5d371f] transition-colors">
                Trang chủ
              </Link>
              <span className="text-[#d5c3ba]">/</span>
              <Link href="/products" className="hover:text-[#5d371f] transition-colors">
                Bộ sưu tập
              </Link>
              <span className="text-[#d5c3ba]">/</span>
              <span className="text-[#5d371f] font-bold">
                Giỏ hàng của bạn
              </span>
            </nav>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#ffffff] border border-[#eae1dd] text-[11px] text-[#51443d] font-medium shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#5d371f] animate-pulse"></span>
              <span>Phôi gỗ tuyển chọn nguyên khối · Giữ mộng trong 48 giờ</span>
            </div>
          </div>
        </section>

        {/* Main Architecture Grid: 8 Cols Cart / 4 Cols Summary */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-8 lg:px-12 py-6">
          {cartItems.length === 0 ? (
            /* Empty Cart State */
            <div className="bg-white border border-[#eae1dd] p-12 text-center my-8 shadow-sm">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#f5ece8] flex items-center justify-center text-[#5d371f] text-2xl">
                <TagOutlined />
              </div>
              <h3 className="font-serif text-2xl font-bold text-[#1f1b19] mb-2">Giỏ hàng của bạn đang trống</h3>
              <p className="text-sm text-[#83746c] max-w-md mx-auto mb-6">
                Hãy khám phá các tuyệt tác nội thất gỗ tự nhiên mộng truyền thống từ Bộ sưu tập D2 LUXURY 2025.
              </p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#5d371f] text-white text-xs font-bold hover:bg-[#784e34] transition-colors"
              >
                <span>Khám phá bộ sưu tập</span>
                <ArrowRightOutlined />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in-up">
              {/* LEFT COLUMN: 8 Columns */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                {/* Cart Action Controls Bar */}
                <div className="flex items-center justify-between bg-[#ffffff] px-5 py-4 border border-[#eae1dd] shadow-sm">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      type="checkbox"
                      className="w-4 h-4 rounded-none accent-[#5d371f] text-[#5d371f] cursor-pointer"
                    />
                    <span className="text-sm font-bold text-[#1f1b19]">
                      Chọn tất cả ({cartItems.length} tác phẩm mộc)
                    </span>
                  </label>

                  <button
                    onClick={handleRemoveSelected}
                    type="button"
                    className="flex items-center gap-1.5 text-xs text-[#83746c] hover:text-[#ba1a1a] transition-colors font-medium cursor-pointer"
                  >
                    <DeleteOutlined className="text-sm" />
                    <span>Xóa mục đã chọn</span>
                  </button>
                </div>

                {/* Product Items List */}
                {cartItems.map((item) => (
                  <article
                    key={item.id}
                    className="bg-[#ffffff] border border-[#eae1dd] p-6 flex flex-col gap-5 shadow-sm transition-all hover:border-[#5d371f]/40 hover-lift"
                  >
                    <div className="flex flex-col sm:flex-row gap-5">
                      <div className="flex items-start gap-3">
                        <input
                          checked={item.selected}
                          onChange={() => toggleItemSelect(item.id)}
                          type="checkbox"
                          className="w-4 h-4 mt-2 rounded-none accent-[#5d371f] text-[#5d371f] cursor-pointer shrink-0"
                        />
                        <div className="w-32 h-32 sm:w-40 sm:h-40 bg-[#f5ece8] overflow-hidden shrink-0 relative border border-[#eae1dd]">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-2 left-2 bg-[#784e34] text-white text-[10px] font-bold px-2 py-0.5 shadow-sm">
                            {item.badge}
                          </span>
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <span className="text-xs text-[#3f4332] font-semibold block">
                                {item.collection}
                              </span>
                              <Link
                                href={`/products/${item.id}`}
                                className="font-serif text-lg sm:text-xl font-bold text-[#1f1b19] mt-0.5 hover:text-[#5d371f] transition-colors block"
                              >
                                {item.name}
                              </Link>
                            </div>

                            <div className="flex items-center gap-2">
                              <Tooltip title="Bỏ sản phẩm">
                                <button
                                  onClick={() => handleRemoveItem(item.id, item.name)}
                                  type="button"
                                  className="text-[#83746c] hover:text-[#ba1a1a] transition-colors p-1 cursor-pointer"
                                >
                                  <DeleteOutlined className="text-lg" />
                                </button>
                              </Tooltip>
                            </div>
                          </div>

                          {/* Material & Spec Tags */}
                          <div className="mt-3 flex flex-wrap gap-1.5 text-xs text-[#51443d]">
                            {item.specs.map((sp, idx) => (
                              <span
                                key={idx}
                                className="bg-[#f5ece8] border border-[#eae1dd] px-2.5 py-1 text-[11px] font-medium"
                              >
                                {sp}
                              </span>
                            ))}
                          </div>

                          {/* Gift Addon info if available */}
                          {item.giftInfo && (
                            <div className="mt-2.5 flex items-center gap-2 text-xs text-[#5d371f] font-semibold bg-[#fff8f5] p-2 border border-[#fcc2a1]/60">
                              <GiftOutlined className="text-[#5d371f]" />
                              <span>{item.giftInfo}</span>
                            </div>
                          )}
                        </div>

                        {/* Price & Quantity Controls */}
                        <div className="mt-5 flex items-center justify-between pt-3 border-t border-[#eae1dd] bg-[#fbf2ee] px-4 py-2.5">
                          <div className="flex items-baseline gap-2">
                            <span className="text-base sm:text-lg font-bold text-[#5d371f] font-data-mono">
                              {item.price.toLocaleString('vi-VN')}đ
                            </span>
                            {item.originalPrice > item.price && (
                              <span className="text-xs text-[#83746c] line-through font-data-mono">
                                {item.originalPrice.toLocaleString('vi-VN')}đ
                              </span>
                            )}
                          </div>

                          {/* Quantity Counter */}
                          <div className="flex items-center bg-white border border-[#eae1dd] p-0.5 shadow-sm">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              disabled={item.quantity <= 1}
                              type="button"
                              className="w-7 h-7 flex items-center justify-center text-[#51443d] hover:bg-[#f5ece8] disabled:opacity-40 cursor-pointer"
                            >
                              <MinusOutlined className="text-xs" />
                            </button>
                            <span className="w-8 text-center font-data-mono text-xs font-bold text-[#1f1b19]">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              type="button"
                              className="w-7 h-7 flex items-center justify-center text-[#51443d] hover:bg-[#f5ece8] cursor-pointer"
                            >
                              <PlusOutlined className="text-xs" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}

                {/* White-glove Logistics Notice */}
                <div className="bg-[#fbf2ee] border border-[#eae1dd] p-5 flex items-start gap-4 shadow-sm">
                  <div className="w-10 h-10 bg-white border border-[#eae1dd] text-[#5d371f] flex items-center justify-center shrink-0 shadow-sm">
                    <CarOutlined className="text-xl" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h4 className="text-sm font-bold text-[#1f1b19]">
                      Quy chuẩn Đóng kiện &amp; Vận chuyển Căn hộ Cao cấp
                    </h4>
                    <p className="text-xs text-[#51443d] leading-relaxed">
                      Mỗi tác phẩm được bọc 3 lớp màng khí chống sốc, lót đệm nỉ bảo hộ và cố định khung pallet gỗ thông
                      xẻ dày 20mm. Đội ngũ nghệ nhân D2 LUXURY trực tiếp khiêng vận chuyển tận phòng, căn chỉnh thăng
                      bằng theo cốt nền và thu dọn toàn bộ vật liệu bảo hộ sau khi lắp ráp hoàn thiện.
                    </p>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: 4 Columns Summary Sticky Box */}
              <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-24">
                <div className="bg-[#ffffff] border border-[#eae1dd] shadow-md p-6 flex flex-col gap-6">
                  <div className="flex items-center justify-between pb-3 border-b border-[#eae1dd]">
                    <div>
                      <span className="text-xs text-[#83746c] font-medium block">
                        Phiếu đặt trước
                      </span>
                      <h2 className="font-serif text-xl font-bold text-[#1f1b19]">Tóm Tắt Đơn Hàng</h2>
                    </div>
                    <span className="font-data-mono text-xs px-2.5 py-1 bg-[#f5ece8] border border-[#eae1dd] text-[#5d371f] font-bold">
                      #D2-2025-89
                    </span>
                  </div>

                  {/* Price Calculation Lines */}
                  <div className="flex flex-col gap-3 text-xs">
                    <div className="flex justify-between text-[#51443d]">
                      <span>Tạm tính ({selectedItems.length} tác phẩm)</span>
                      <span className="font-data-mono font-bold text-[#1f1b19]">
                        {subtotal.toLocaleString('vi-VN')}đ
                      </span>
                    </div>

                    <div className="flex justify-between text-[#51443d]">
                      <span>Vận chuyển xe thùng &amp; Thang máy</span>
                      <span className="text-xs font-semibold text-[#3f4332] bg-[#e1e5ce] px-2.5 py-0.5">
                        Miễn phí
                      </span>
                    </div>

                    <div className="flex justify-between text-[#51443d]">
                      <span>Cân chỉnh mộng &amp; Lau dầu dưỡng tận nhà</span>
                      <span className="text-xs font-semibold text-[#3f4332] bg-[#e1e5ce] px-2.5 py-0.5">
                        Miễn phí
                      </span>
                    </div>
                  </div>

                  {/* Grand Total */}
                  <div className="bg-[#fbf2ee] border border-[#eae1dd] p-4 flex flex-col gap-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-bold text-[#1f1b19]">Tổng thanh toán</span>
                      <span className="font-serif text-xl sm:text-2xl font-bold text-[#5d371f] font-data-mono">
                        {finalTotal.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                    <span className="text-[10px] text-[#83746c] mt-1">
                      Đã bao gồm 8% thuế GTGT và bảo hiểm trọn gói vận chuyển
                    </span>
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex flex-col gap-3">
                    <Link
                      href="/checkout"
                      style={{ backgroundColor: '#5d371f', color: '#ffffff' }}
                      className={`w-full !bg-[#5d371f] !text-white py-3.5 px-6 font-semibold text-sm hover:!bg-[#784e34] transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer hover-lift ${
                        selectedItems.length === 0 ? 'pointer-events-none opacity-50' : ''
                      }`}
                    >
                      <span className="!text-white font-bold">Tiến hành đặt hàng &amp; Giữ phôi gỗ</span>
                      <ArrowRightOutlined className="text-sm !text-white" />
                    </Link>

                    <Link
                      href="/products"
                      className="w-full py-2.5 text-center text-xs text-[#5d371f] hover:text-[#784e34] transition-colors font-medium"
                    >
                      Tiếp tục ngắm nhìn sản phẩm khác
                    </Link>
                  </div>

                  {/* 3 Reassurance Badges */}
                  <div className="flex flex-col gap-3 pt-2 border-t border-[#eae1dd]">
                    <div className="flex items-start gap-3">
                      <SafetyCertificateOutlined className="text-[#5d371f] text-base shrink-0 mt-0.5" />
                      <p className="text-xs text-[#51443d] leading-snug">
                        <strong>Bảo hành 5 năm kết cấu mộng</strong>, cong vênh nứt nẻ do thời tiết được nghệ nhân đổi
                        mới tận nơi.
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <FileProtectOutlined className="text-[#5d371f] text-base shrink-0 mt-0.5" />
                      <p className="text-xs text-[#51443d] leading-snug">
                        <strong>Kiểm tra vân gỗ thực tế</strong> &amp; đối chiếu chứng thư xuất xưởng trước khi kích hoạt
                        thanh toán phần còn lại.
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <CreditCardOutlined className="text-[#5d371f] text-base shrink-0 mt-0.5" />
                      <p className="text-xs text-[#51443d] leading-snug">
                        <strong>Trả góp 0% linh hoạt</strong> qua thẻ tín dụng chỉ từ{' '}
                        <span className="font-data-mono font-bold text-[#1f1b19]">
                          {monthlyInstallment.toLocaleString('vi-VN')}đ/tháng
                        </span>
                        .
                      </p>
                    </div>
                  </div>

                  {/* Direct Studio Architect Contact */}
                  <div className="bg-[#f5ece8] border border-[#eae1dd] p-4 flex items-center gap-3">
                    <CustomerServiceOutlined className="text-[#5d371f] text-2xl shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-[#1f1b19] font-bold">Cần tư vấn phối cảnh 3D?</p>
                      <p className="text-[11px] text-[#83746c]">KTS D2 LUXURY hỗ trợ trực tiếp (08:00 - 22:00)</p>
                      <a
                        href="tel:19008922"
                        className="font-serif text-base font-bold text-[#5d371f] tracking-tight block mt-0.5"
                      >
                        1900 8922
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Cross-sell Gallery Section: Complete the Living Space */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-8 lg:px-12 pt-16 pb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs text-[#5d371f] font-semibold block">
                Bản Giao Hưởng Không Gian
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1f1b19] mt-1">
                Hoàn Thiện Không Gian Cùng Sofa &amp; Bàn Trà Của Bạn
              </h2>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center gap-1 text-xs text-[#5d371f] hover:text-[#784e34] transition-colors font-semibold"
            >
              <span>Xem toàn bộ phụ kiện</span>
              <RightOutlined className="text-[10px]" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CROSS_SELL_ITEMS.map((item) => (
              <div
                key={item.id}
                className="bg-[#ffffff] border border-[#eae1dd] overflow-hidden flex flex-col justify-between group hover:border-[#5d371f]/50 transition-all shadow-sm hover-lift"
              >
                <div className="aspect-[4/3] bg-[#f5ece8] overflow-hidden relative">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2.5 py-1 text-[10px] font-bold text-[#1f1b19] border border-[#eae1dd]">
                    {item.tag}
                  </div>
                </div>

                <div className="p-5 flex flex-col gap-3">
                  <div>
                    <h3 className="font-serif text-base font-bold text-[#1f1b19]">{item.name}</h3>
                    <p className="text-xs text-[#83746c] mt-1 leading-relaxed line-clamp-2">
                      {item.desc}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#eae1dd]">
                    <span className="font-data-mono text-sm font-bold text-[#5d371f]">
                      {item.price.toLocaleString('vi-VN')}đ
                    </span>
                    <button
                      onClick={() => handleAddCrossSell(item)}
                      type="button"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f5ece8] border border-[#eae1dd] text-[#1f1b19] hover:bg-[#5d371f] hover:text-white transition-colors text-xs font-semibold cursor-pointer"
                    >
                      <PlusOutlined className="text-[10px]" />
                      <span>Thêm nhanh</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}

export default function CartPage() {
  return (
    <App>
      <CartContent />
    </App>
  );
}
