'use client';

import React from 'react';

export interface PosEntryItemsCardProps {
  title: string;
  itemCount: number;
  countUnit?: string;
  totalQuantity?: number;
  emptyIcon?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  children?: React.ReactNode;
  extraHeader?: React.ReactNode;
  footerTotalText?: string;
  footerTotalValue?: string;
}

export function PosEntryItemsCard({
  title,
  itemCount,
  countUnit = 'mặt hàng',
  totalQuantity,
  emptyIcon = '📥',
  emptyTitle = 'Chưa có sản phẩm nào trong danh sách',
  emptyDescription = 'Tìm kiếm hàng hóa theo mã SKU hoặc tên sản phẩm ở ô tìm kiếm phía trên (F3) để thêm vào phiếu.',
  children,
  extraHeader,
  footerTotalText = 'Tổng cộng',
  footerTotalValue,
}: PosEntryItemsCardProps) {
  return (
    <>
      {/* Title Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <span>{title}</span>
          <span className="bg-[#784e34]/10 text-[#784e34] px-2 py-0.5 rounded-full font-mono text-[11px]">
            {itemCount} {countUnit}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {extraHeader}
          {totalQuantity !== undefined && (
            <div className="text-xs text-slate-500 font-medium">
              Tổng SL: <strong className="text-slate-900 font-mono">{totalQuantity}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Empty State vs Content */}
      {itemCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50/50 rounded-lg border border-dashed border-slate-300">
          <div className="w-12 h-12 rounded-full bg-[#784e34]/10 text-[#784e34] flex items-center justify-center text-2xl mb-3">
            {emptyIcon}
          </div>
          <div className="mb-1 text-sm font-medium text-slate-900">{emptyTitle}</div>
          <p className="text-xs text-slate-500 max-w-sm">{emptyDescription}</p>
        </div>
      ) : (
        <>
          {children}

          {footerTotalValue !== undefined && (
            <div className="flex items-center justify-end pt-2">
              <span className="text-xs text-slate-500">
                {footerTotalText}:{' '}
                <strong className="text-sm font-mono text-[#784e34] font-bold">
                  {footerTotalValue}
                </strong>
              </span>
            </div>
          )}
        </>
      )}
    </>
  );
}
