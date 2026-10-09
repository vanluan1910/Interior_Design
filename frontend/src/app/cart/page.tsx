'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { App, Tooltip } from 'antd';
import {
  RightOutlined,
  DeleteOutlined,
  PlusOutlined,
  MinusOutlined,
  ArrowRightOutlined,
  SafetyCertificateOutlined,
  FileProtectOutlined,
  CreditCardOutlined,
  CustomerServiceOutlined,
  GiftOutlined,
  CarOutlined,
  TagOutlined,
} from '@ant-design/icons';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import { productApi, FeaturedCatalogProduct } from '@/api/productApi';

function CartContent() {
  const { modal, message } = App.useApp();
  const {
    cartItems,
    cartCount,
    wishlistCount,
    updateQuantity,
    removeFromCart,
    removeSelected,
    toggleItemSelect,
    toggleSelectAll,
    addToCart,
  } = useCart();

  const [crossSellProducts, setCrossSellProducts] = useState<FeaturedCatalogProduct[]>([]);

  useEffect(() => {
    let isMounted = true;
    productApi
      .getProducts({ pageSize: 6 })
      .then((res) => {
        if (isMounted && res.length) {
          setCrossSellProducts(res.slice(0, 3));
        }
      })
      .catch(() => {
        // Silent catch
      });
    return () => {
      isMounted = false;
    };
  }, []);

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
  const handleAddCrossSell = (item: FeaturedCatalogProduct) => {
    addToCart(
      {
        id: item.id,
        sku: item.code || item.id,
        name: item.name,
        collection: item.categoryName || 'Nội thất Mộc Gia',
        badge: '',
        image: item.image,
        price: item.price,
        specs: [item.material || item.metaInfo, item.dimensions].filter(Boolean) as string[],
      },
      1
    );
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
          <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-medium text-[#83746c]">
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
        <section className="max-w-[1720px] mx-auto w-full px-4 sm:px-6 lg:px-10 xl:px-14 py-6">
          {cartItems.length === 0 ? (
            /* Empty Cart State */
            <div className="bg-white border border-[#eae1dd] p-12 text-center my-8 shadow-sm">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#f5ece8] flex items-center justify-center text-[#5d371f] text-2xl">
                <TagOutlined />
              </div>
              <h3 className="font-serif text-2xl font-bold text-[#1f1b19] mb-2">Giỏ hàng của bạn đang trống</h3>
              <p className="text-sm text-[#83746c] max-w-md mx-auto mb-6">
                Hãy khám phá các tuyệt tác nội thất gỗ tự nhiên mộng truyền thống từ Bộ sưu tập D2 LUXURY.
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
                          {item.specs && item.specs.length > 0 && (
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
                          )}

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
        {crossSellProducts.length > 0 && (
          <section className="max-w-7xl mx-auto w-full px-4 sm:px-8 lg:px-12 pt-16 pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <span className="text-xs text-[#5d371f] font-semibold block">
                  Bản Giao Hưởng Không Gian
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1f1b19] mt-1">
                  Gợi Ý Tác Phẩm Phù Hợp Không Gian Của Bạn
                </h2>
              </div>
              <Link
                href="/products"
                className="inline-flex items-center gap-1 text-xs text-[#5d371f] hover:text-[#784e34] transition-colors font-semibold"
              >
                <span>Xem toàn bộ bộ sưu tập</span>
                <RightOutlined className="text-[10px]" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {crossSellProducts.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#ffffff] border border-[#eae1dd] overflow-hidden flex flex-col justify-between group hover:border-[#5d371f]/50 transition-all shadow-sm hover-lift"
                >
                  <Link href={`/products/${item.id}`} className="aspect-[4/3] bg-[#f5ece8] overflow-hidden relative block">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2.5 py-1 text-[10px] font-bold text-[#1f1b19] border border-[#eae1dd]">
                      {item.categoryName || 'D2 LUXURY'}
                    </div>
                  </Link>

                  <div className="p-5 flex flex-col gap-3">
                    <div>
                      <Link href={`/products/${item.id}`} className="font-serif text-base font-bold text-[#1f1b19] hover:text-[#5d371f] transition-colors">
                        {item.name}
                      </Link>
                      <p className="text-xs text-[#83746c] mt-1 leading-relaxed line-clamp-2">
                        {item.material || item.metaInfo} {item.dimensions ? `· ${item.dimensions}` : ''}
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
        )}
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
