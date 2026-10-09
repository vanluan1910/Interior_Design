'use client';

import React, { useState, useRef } from 'react';
import { Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { AdminSearchInput } from './AdminSearchInput';
import type { FeaturedCatalogProduct } from '@/types/admin';

export interface PosEntryHeaderProps {
  title: string;
  code?: string;
  codeColor?: 'primary' | 'rose' | 'amber' | 'emerald';
  onBack: () => void;
  backTooltip?: string;
  searchValue: string;
  onSearchChange: (val: string) => void;
  searchPlaceholder?: string;
  searchResults?: FeaturedCatalogProduct[];
  selectedItemCodes?: string[];
  getItemQuantity?: (code: string) => number;
  onSelectProduct?: (product: FeaturedCatalogProduct) => void;
  customSearchPopover?: React.ReactNode | ((close: () => void) => React.ReactNode);
  extraActions?: React.ReactNode;
}

export function PosEntryHeader({
  title,
  code,
  codeColor = 'primary',
  onBack,
  backTooltip = 'Quay lại danh sách',
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Tìm hàng hóa theo tên sản phẩm, mã SKU, bộ sưu tập (F3)...',
  searchResults = [],
  selectedItemCodes = [],
  getItemQuantity,
  onSelectProduct,
  customSearchPopover,
  extraActions,
}: PosEntryHeaderProps) {
  const [showPopover, setShowPopover] = useState(false);
  const inputRef = useRef<any>(null);

  const badgeBg =
    codeColor === 'rose'
      ? 'text-rose-700 bg-rose-50'
      : codeColor === 'amber'
      ? 'text-amber-800 bg-amber-50'
      : codeColor === 'emerald'
      ? 'text-emerald-700 bg-emerald-50'
      : 'text-[#784e34] bg-[#784e34]/10';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-none shadow-xs border border-slate-200">
      <div className="flex items-center gap-3 flex-1 min-w-[280px]">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={onBack}
          className="h-9 w-9 rounded-lg text-slate-700 hover:!bg-slate-100 hover:!text-[#784e34] flex items-center justify-center"
          title={backTooltip}
        />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="m-0 shrink-0 text-sm font-bold text-slate-950">{title}</h1>
            {code && (
              <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${badgeBg}`}>
                {code}
              </span>
            )}
          </div>
        </div>

        {/* Search Input with Dropdown Popover */}
        <div className="relative min-w-0 max-w-[540px] flex-1">
          <AdminSearchInput
            ref={inputRef}
            placeholder={searchPlaceholder}
            value={searchValue}
            onFocus={() => {
              if (searchValue.trim()) setShowPopover(true);
            }}
            onChange={(val) => {
              onSearchChange(val);
              setShowPopover(val.trim().length > 0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setShowPopover(false);
            }}
            sizeVariant="sm"
          />

          {showPopover && searchValue.trim() !== '' && (
            <div
              className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-96 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-2xl space-y-1"
              onMouseDown={(e) => e.stopPropagation()}
            >
              {customSearchPopover ? (
                typeof customSearchPopover === 'function' ? (
                  customSearchPopover(() => setShowPopover(false))
                ) : (
                  customSearchPopover
                )
              ) : (
                <>
                  <div className="flex items-center justify-between px-2.5 py-1.5 mb-1 bg-slate-50 rounded-lg text-[11px] text-slate-600 font-medium">
                    <span>
                      Kết quả tìm kiếm cho &quot;{searchValue}&quot; ({searchResults.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPopover(false)}
                      className="text-slate-400 hover:text-slate-700 border-none bg-transparent cursor-pointer p-0.5 text-xs font-semibold"
                    >
                      ✕ Đóng
                    </button>
                  </div>

                  {searchResults.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400 italic">
                      Không tìm thấy sản phẩm nào phù hợp với &quot;{searchValue}&quot;
                    </div>
                  ) : (
                    searchResults.map((product) => {
                      const pCode = product.code || product.id;
                      const alreadyAdded = selectedItemCodes.includes(pCode) || selectedItemCodes.includes(product.id);
                      const qty = getItemQuantity ? getItemQuantity(pCode) : 0;
                      const thumbUrl = product.image || (product.images && product.images[0]) || '';
                      const itemCostPrice =
                        product.originalPrice !== undefined
                          ? product.originalPrice
                          : product.costPrice !== undefined
                          ? product.costPrice
                          : product.price || 0;

                      return (
                        <button
                          key={product.id || product.code}
                          type="button"
                          onClick={() => {
                            onSelectProduct?.(product);
                            setShowPopover(false);
                          }}
                          className={`group flex w-full cursor-pointer items-center gap-3 rounded-lg p-2 text-left transition-all border ${
                            alreadyAdded
                              ? 'bg-amber-50/70 border-amber-200/80 hover:bg-amber-100/60'
                              : 'bg-white border-transparent hover:border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {/* Thumbnail */}
                          <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0 flex items-center justify-center relative">
                            {thumbUrl ? (
                              <img
                                src={thumbUrl}
                                alt={product.name}
                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src =
                                    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=120&q=80';
                                }}
                              />
                            ) : (
                              <div className="text-[11px] font-bold text-slate-400">SP</div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="font-mono font-bold text-[#784e34] bg-[#784e34]/10 px-1.5 py-0.2 rounded text-[11px]">
                                {product.code}
                              </span>
                              <span className="truncate text-xs font-semibold text-slate-900 group-hover:text-[#784e34]">
                                {product.name}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 truncate">
                              <span>{product.categoryName || product.collection || 'Nội thất'}</span>
                              <span>•</span>
                              <span className="text-emerald-700 font-medium">
                                Tồn: {product.stockNote || 'Có sẵn'}
                              </span>
                            </div>
                          </div>

                          {/* Price & Quantity status */}
                          <div className="shrink-0 text-right space-y-0.5">
                            <div className="text-xs font-bold font-mono text-[#008080]">
                              {itemCostPrice.toLocaleString('vi-VN')} đ
                              <span className="text-[10px] text-slate-400 font-normal ml-1">Gốc</span>
                            </div>
                            {product.price > 0 && (
                              <div className="text-[10px] font-mono text-slate-500">
                                {product.price.toLocaleString('vi-VN')} đ{' '}
                                <span className="text-[9px] text-slate-400">Bán</span>
                              </div>
                            )}
                            {alreadyAdded && (
                              <span className="inline-block text-[10px] font-semibold text-amber-800 bg-amber-200/70 px-1.5 py-0.2 rounded">
                                Đã chọn {qty > 0 ? `(${qty})` : ''}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {extraActions && <div className="flex items-center gap-2">{extraActions}</div>}
    </div>
  );
}
