'use client';

import React, { useEffect, useState } from 'react';
import { Button, Input, Select, InputNumber, Tag, Popconfirm, App } from 'antd';
import {
  PrinterOutlined,
  DeleteOutlined,
  FileExcelOutlined,
  ArrowLeftOutlined,
  SearchOutlined,
  UpOutlined,
  DownOutlined,
} from '@ant-design/icons';
import {
  PosEntryLayout,
  PosEntryHeader,
  PosEntrySidebar,
  PosEntryItemsCard,
} from '@/components/admin';
import type {
  AdminWarehouse,
  StockAuditItem,
} from '@/types/admin';
import { isProductInBranch, getProductStockForBranch } from '@/utils/branchHelper';

const normalizeSearchText = (str?: string) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .trim();
};

export interface StocktakeCreateProps {
  stocktakeViewMode: 'create' | 'edit';
  stocktakeSlipCode: string;
  stocktakeDate?: string;
  stocktakeWarehouseName: string;
  setStocktakeWarehouseName: (val: string) => void;
  stocktakeStaffName?: string;
  setStocktakeStaffName?: (val: string) => void;
  stocktakeNote: string;
  setStocktakeNote: (val: string) => void;
  stocktakeTabFilter: 'all' | 'matched' | 'diff' | 'increase' | 'decrease';
  setStocktakeTabFilter: (val: 'all' | 'matched' | 'diff' | 'increase' | 'decrease') => void;
  stocktakeEntryLines: StockAuditItem[];
  setStocktakeEntryLines: React.Dispatch<React.SetStateAction<StockAuditItem[]>>;
  stocktakeSearchProduct: string;
  setStocktakeSearchProduct: (val: string) => void;
  allAuditableStock: StockAuditItem[];
  allProducts?: import('@/types/admin').FeaturedCatalogProduct[];
  availableBranchWarehouses: AdminWarehouse[];
  onNavigateToProduct?: (query: string) => void;
  onBack: () => void;
  onSaveDraft: () => void;
  onSubmit: () => void;
  onPrint?: () => void;
  onExportExcel?: () => void;
  user?: { name?: string } | null;
}

export function StocktakeCreate({
  stocktakeViewMode,
  stocktakeSlipCode,
  stocktakeDate,
  stocktakeWarehouseName,
  setStocktakeWarehouseName,
  stocktakeStaffName,
  setStocktakeStaffName,
  stocktakeNote,
  setStocktakeNote,
  stocktakeTabFilter,
  setStocktakeTabFilter,
  stocktakeEntryLines,
  setStocktakeEntryLines,
  stocktakeSearchProduct,
  setStocktakeSearchProduct,
  allAuditableStock,
  allProducts = [],
  availableBranchWarehouses,
  onNavigateToProduct,
  onBack,
  onSaveDraft,
  onSubmit,
  onPrint,
  onExportExcel,
  user,
}: StocktakeCreateProps) {
  const { message } = App.useApp();
  const [showExtraDetails, setShowExtraDetails] = useState(false);
  const [showMobileSearchPopover, setShowMobileSearchPopover] = useState(false);

  // Auto-sync stocktake warehouse to currently available branch warehouses
  useEffect(() => {
    if (availableBranchWarehouses.length > 0) {
      const isValid = availableBranchWarehouses.some((w) => w.name === stocktakeWarehouseName);
      if (!isValid) {
        setStocktakeWarehouseName(availableBranchWarehouses[0].name);
      }
    }
  }, [availableBranchWarehouses, stocktakeWarehouseName, setStocktakeWarehouseName]);

  const currentBranch = React.useMemo(() => {
    return availableBranchWarehouses.find((w) => w.name === stocktakeWarehouseName)?.branch;
  }, [availableBranchWarehouses, stocktakeWarehouseName]);

  const allSearchableProducts = React.useMemo(() => {
    const map = new Map<string, import('@/types/admin').FeaturedCatalogProduct>();

    // 1. Catalog products - must strictly belong to current warehouse's branch
    (allProducts || []).forEach((p) => {
      if (isProductInBranch(p, currentBranch, availableBranchWarehouses)) {
        const key = p.code || p.id;
        if (key) map.set(key, p);
      }
    });

    // 2. Auditable stock items
    (allAuditableStock || []).forEach((item) => {
      const key = item.code || item.id;
      if (key && !map.has(key)) {
        map.set(key, {
          id: item.id,
          code: item.code,
          name: item.name,
          price: 0,
          originalPrice: 0,
          costPrice: 0,
          collection: item.location || 'Kho xưởng',
          categoryName: item.location || 'Sản phẩm nội thất',
          stockNote: `${item.systemQty}`,
          stockType: 'in_stock',
          image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=120&q=80',
          location: item.location,
        });
      }
    });

    return Array.from(map.values());
  }, [allProducts, allAuditableStock, currentBranch, availableBranchWarehouses]);

  const filteredProducts = React.useMemo(() => {
    const rawQuery = (stocktakeSearchProduct || '').trim().toLowerCase();
    const query = normalizeSearchText(stocktakeSearchProduct);
    if (!query) return [];
    const queryWords = query.split(/\s+/).filter(Boolean);

    const matches = allSearchableProducts.filter((p) => {
      const nameRaw = (p.name || '').toLowerCase();
      const codeRaw = (p.code || '').toLowerCase();
      const collRaw = (p.collection || '').toLowerCase();
      const catRaw = (p.categoryName || '').toLowerCase();

      const nameNorm = normalizeSearchText(p.name);
      const codeNorm = normalizeSearchText(p.code);
      const collNorm = normalizeSearchText(p.collection);
      const catNorm = normalizeSearchText(p.categoryName);

      if (codeRaw.includes(rawQuery) || codeNorm.includes(query)) return true;
      if (nameRaw.includes(rawQuery) || nameNorm.includes(query)) return true;
      if (queryWords.every((w) => nameNorm.includes(w))) return true;

      const combined = `${nameNorm} ${catNorm} ${collNorm}`;
      return queryWords.every((w) => combined.includes(w));
    });

    return matches.sort((a, b) => {
      const aNameNorm = normalizeSearchText(a.name);
      const bNameNorm = normalizeSearchText(b.name);
      const aCodeNorm = normalizeSearchText(a.code);
      const bCodeNorm = normalizeSearchText(b.code);

      const aExactName = aNameNorm.startsWith(query) ? 3 : aNameNorm.includes(query) ? 2 : 0;
      const bExactName = bNameNorm.startsWith(query) ? 3 : bNameNorm.includes(query) ? 2 : 0;
      if (aExactName !== bExactName) return bExactName - aExactName;

      const aExactCode = aCodeNorm.startsWith(query) ? 3 : aCodeNorm.includes(query) ? 2 : 0;
      const bExactCode = bCodeNorm.startsWith(query) ? 3 : bCodeNorm.includes(query) ? 2 : 0;
      if (aExactCode !== bExactCode) return bExactCode - aExactCode;

      return a.name.localeCompare(b.name);
    });
  }, [allSearchableProducts, stocktakeSearchProduct]);

  const handleSelectProduct = (product: import('@/types/admin').FeaturedCatalogProduct) => {
    const pCode = product.code || product.id;
    const matchedAudit = allAuditableStock.find((a) => a.code === pCode || a.id === product.id);
    const alreadyLine = stocktakeEntryLines.find((line) => line.code === pCode || line.id === product.id);

    if (!alreadyLine) {
      const branchStock = getProductStockForBranch(product, currentBranch, availableBranchWarehouses);
      const initialQty = (product as any).systemQty ?? (matchedAudit ? matchedAudit.systemQty : branchStock);
      const defaultUnit = product.unit || 'Bộ';
      const newItem: StockAuditItem = matchedAudit
        ? { ...matchedAudit, productId: product.id, actualQty: matchedAudit.systemQty, status: 'matched', unit: matchedAudit.unit || defaultUnit }
        : {
            id: product.id || `audit_${Date.now()}`,
            productId: product.id,
            code: pCode,
            name: product.name,
            type: 'product',
            location: product.location || stocktakeWarehouseName || 'Kho chính',
            systemQty: initialQty,
            actualQty: initialQty,
            unit: defaultUnit,
            systemMc: 'Đạt chuẩn',
            actualMc: 'Đạt chuẩn',
            status: 'matched',
            qualityNote: (product.collection || '') + ' • ' + (product.metaInfo || 'Hàng sẵn bán'),
            checked: true,
          };
      setStocktakeEntryLines((prev) => [...prev, newItem]);
      message.success(`Đã thêm "${product.name}" vào phiếu kiểm!`);
    } else {
      setStocktakeEntryLines((prev) =>
        prev.map((l) =>
          l.code === pCode || l.id === alreadyLine.id
            ? {
                ...l,
                actualQty: (l.actualQty || 0) + 1,
                status: (l.actualQty || 0) + 1 === l.systemQty ? 'matched' : 'discrepancy',
              }
            : l
        )
      );
      message.success(`Đã tăng số lượng thực tế của "${product.name}" lên ${(alreadyLine.actualQty || 0) + 1}`);
    }
    setStocktakeSearchProduct('');
  };

  const handleUpdateActualQty = (code: string, newQty: number) => {
    const safeQty = Math.max(0, newQty);
    setStocktakeEntryLines((prev) =>
      prev.map((l) =>
        l.code === code
          ? {
              ...l,
              actualQty: safeQty,
              status: safeQty === Number(l.systemQty) ? 'matched' : 'discrepancy',
            }
          : l
      )
    );
  };

  const handleDeleteItem = (code: string) => {
    setStocktakeEntryLines((prev) => prev.filter((l) => l.code !== code));
  };

  const handleClearAll = () => {
    setStocktakeEntryLines([]);
    message.info('Đã xóa toàn bộ danh sách kiểm kê!');
  };

  // Calculations
  const totalActual = stocktakeEntryLines.reduce((acc, curr) => acc + (Number(curr.actualQty) || 0), 0);
  const totalSystem = stocktakeEntryLines.reduce((acc, curr) => acc + (Number(curr.systemQty) || 0), 0);
  const totalDiff = stocktakeEntryLines.reduce(
    (acc, curr) => acc + ((Number(curr.actualQty) || 0) - (Number(curr.systemQty) || 0)),
    0
  );
  const totalIncrease = stocktakeEntryLines.reduce((acc, curr) => {
    const diff = (Number(curr.actualQty) || 0) - (Number(curr.systemQty) || 0);
    return diff > 0 ? acc + diff : acc;
  }, 0);
  const totalDecrease = stocktakeEntryLines.reduce((acc, curr) => {
    const diff = (Number(curr.actualQty) || 0) - (Number(curr.systemQty) || 0);
    return diff < 0 ? acc + Math.abs(diff) : acc;
  }, 0);

  const matchedCount = stocktakeEntryLines.filter((l) => Number(l.actualQty || 0) === Number(l.systemQty || 0)).length;
  const diffCount = stocktakeEntryLines.filter((l) => Number(l.actualQty || 0) !== Number(l.systemQty || 0)).length;
  const increaseCount = stocktakeEntryLines.filter((l) => Number(l.actualQty || 0) > Number(l.systemQty || 0)).length;
  const decreaseCount = stocktakeEntryLines.filter((l) => Number(l.actualQty || 0) < Number(l.systemQty || 0)).length;

  const filteredLines = stocktakeEntryLines.filter((line) => {
    const diff = Number(line.actualQty || 0) - Number(line.systemQty || 0);
    if (stocktakeTabFilter === 'matched') return diff === 0;
    if (stocktakeTabFilter === 'diff') return diff !== 0;
    if (stocktakeTabFilter === 'increase') return diff > 0;
    if (stocktakeTabFilter === 'decrease') return diff < 0;
    return true;
  });

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. DESKTOP VIEW (lg: and up): 100% UNCHANGED, PRESERVED EXACTLY AS IS     */}
      {/* ========================================================================= */}
      <div className="hidden lg:block">
        <PosEntryLayout
          header={
            <PosEntryHeader
              title={stocktakeViewMode === 'create' ? 'Kiểm kho' : 'Cập nhật phiếu kiểm kho'}
              code={stocktakeSlipCode || 'KK-2026-08'}
              codeColor="primary"
              onBack={onBack}
              backTooltip="Quay lại danh sách kiểm kho"
              searchValue={stocktakeSearchProduct}
              onSearchChange={setStocktakeSearchProduct}
              searchPlaceholder="Tìm hàng hóa theo tên sản phẩm, mã SKU, bộ sưu tập (F3)..."
              searchResults={filteredProducts}
              selectedItemCodes={stocktakeEntryLines.map((l) => l.code)}
              getItemQuantity={(code) => stocktakeEntryLines.find((l) => l.code === code)?.actualQty || 0}
              onSelectProduct={handleSelectProduct}
              extraActions={
                <>
                  {onPrint && (
                    <Button
                      icon={<PrinterOutlined />}
                      onClick={onPrint}
                      title="In phiếu kiểm kho (A4)"
                      className="h-9 w-9 rounded-lg p-0 text-slate-700 hover:text-[#784e34] flex items-center justify-center"
                    />
                  )}
                  {stocktakeEntryLines.length > 0 && (
                    <>
                      {onExportExcel && (
                        <Button
                          size="small"
                          icon={<FileExcelOutlined />}
                          onClick={onExportExcel}
                          className="h-9 px-3 text-xs font-medium rounded-lg border-emerald-600 text-emerald-700 bg-emerald-50/50 hover:!bg-emerald-100 hover:!border-emerald-700"
                        >
                          Xuất Excel
                        </Button>
                      )}
                      <Popconfirm
                        title="Xóa tất cả mặt hàng kiểm kê?"
                        onConfirm={handleClearAll}
                        okText="Xóa hết"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                      >
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          className="h-9 px-3 text-xs font-medium rounded-lg"
                        >
                          Xóa trắng ({stocktakeEntryLines.length})
                        </Button>
                      </Popconfirm>
                    </>
                  )}
                </>
              }
            />
          }
          sidebar={
            <PosEntrySidebar
              creatorName={stocktakeStaffName || user?.name || 'Thủ kho'}
              creatorRole="Người lập phiếu kiểm kho"
              createdDate={stocktakeDate || new Date().toLocaleDateString('vi-VN')}
              onCancel={onBack}
              cancelText="Bỏ qua"
              onSaveDraft={onSaveDraft}
              saveDraftText="📝 Lưu tạm"
              onSubmit={onSubmit}
              submitText="✓ Cân bằng kho"
              submitButtonBg="!bg-[#784e34] hover:!bg-[#633f2a]"
            >
              <div className="space-y-2.5 text-xs text-slate-700">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Mã kiểm kho:</span>
                  <span className="font-mono text-[#784e34] font-medium bg-[#784e34]/10 px-2.5 py-0.5 rounded">
                    {stocktakeSlipCode}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Chi nhánh:</span>
                  <span className="font-medium text-slate-900 text-right">
                    {availableBranchWarehouses.find((w) => w.name === stocktakeWarehouseName)?.branch || availableBranchWarehouses[0]?.branch || 'Chi nhánh quản lý'}
                  </span>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 block">Kho kiểm kê:</label>
                  <Select
                    value={stocktakeWarehouseName || availableBranchWarehouses[0]?.name || undefined}
                    onChange={setStocktakeWarehouseName}
                    options={availableBranchWarehouses.map((w) => ({ value: w.name, label: `${w.name} (${w.branch})` }))}
                    placeholder={availableBranchWarehouses.length === 0 ? 'Chi nhánh chưa có kho lưu trữ' : 'Chọn kho kiểm kê...'}
                    notFoundContent={<span className="text-xs text-slate-500 p-2 block">Không có kho nào thuộc chi nhánh này</span>}
                    className="w-full text-xs font-normal"
                  />
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-slate-500">Trạng thái:</span>
                  <Tag color={stocktakeViewMode === 'edit' ? 'processing' : 'gold'} className="m-0 text-xs font-normal">
                    {stocktakeViewMode === 'edit' ? 'Đang kiểm đếm' : 'Phiếu tạm'}
                  </Tag>
                </div>
              </div>

              {/* Statistics Box */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between text-slate-700">
                  <span>Tổng SL thực tế:</span>
                  <span className="font-mono font-medium text-slate-950">
                    {totalActual.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Tổng SL lệch:</span>
                  <span
                    className={`font-mono font-medium ${
                      totalDiff !== 0 ? 'text-amber-600' : 'text-slate-950'
                    }`}
                  >
                    {totalDiff.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-700 pt-1 border-t border-slate-200">
                  <span>Tổng lệch tăng:</span>
                  <span className="font-mono font-medium">
                    +{totalIncrease.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>Tổng lệch giảm:</span>
                  <span className="font-mono font-medium">
                    -{totalDecrease.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Note Box */}
              <div className="space-y-1">
                <label className="text-slate-700 block text-xs font-normal">Ghi chú kiểm kho:</label>
                <Input.TextArea
                  rows={3}
                  placeholder="Nhập ghi chú hoặc lý do chênh lệch..."
                  value={stocktakeNote}
                  onChange={(e) => setStocktakeNote(e.target.value)}
                  className="text-xs font-normal rounded-lg"
                />
              </div>
            </PosEntrySidebar>
          }
        >
          <PosEntryItemsCard
            title="Danh sách hàng hóa kiểm kê"
            itemCount={stocktakeEntryLines.length}
            countUnit="mặt hàng"
            totalQuantity={Number(totalActual.toFixed(1))}
            emptyIcon="📋"
            emptyTitle="Thêm sản phẩm vào phiếu kiểm kho"
            emptyDescription="Tìm kiếm hàng hóa theo mã hoặc tên ở ô tìm kiếm phía trên để bắt đầu kiểm kê."
            footerTotalText="Tổng SL thực tế kiểm đếm"
            footerTotalValue={`${totalActual.toFixed(1)} (Sổ sách: ${totalSystem.toFixed(1)})`}
            extraHeader={
              stocktakeEntryLines.length > 0 && (
                <div className="flex items-center gap-3 text-xs overflow-x-auto">
                  {[
                    { key: 'all', label: `Tất cả (${stocktakeEntryLines.length})` },
                    { key: 'matched', label: `Khớp (${matchedCount})` },
                    { key: 'diff', label: `Lệch (${diffCount})` },
                    { key: 'increase', label: `Lệch tăng (${increaseCount})` },
                    { key: 'decrease', label: `Lệch giảm (${decreaseCount})` },
                  ].map((tab) => {
                    const isActive = stocktakeTabFilter === tab.key;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setStocktakeTabFilter(tab.key as any)}
                        className={`pb-1 transition-all cursor-pointer border-none bg-transparent whitespace-nowrap text-xs font-normal ${
                          isActive
                            ? 'border-b-2 !border-[#784e34] text-[#784e34] font-medium'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              )
            }
          >
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-medium border-b border-slate-200">
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3">Mã hàng</th>
                    <th className="py-2.5 px-3">Tên hàng hóa</th>
                    <th className="py-2.5 px-3 text-center">Độ ẩm MC</th>
                    <th className="py-2.5 px-3 text-right">Tồn kho</th>
                    <th className="py-2.5 px-3 text-center w-28">Thực tế</th>
                    <th className="py-2.5 px-3 text-right">SL lệch</th>
                    <th className="py-2.5 px-3 text-center w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-normal">
                  {filteredLines.map((line, idx) => {
                    const diff = Number((Number(line.actualQty || 0) - Number(line.systemQty || 0)).toFixed(2));
                    const diffColor =
                      diff > 0
                        ? 'text-emerald-600'
                        : diff < 0
                        ? 'text-rose-600'
                        : 'text-slate-600';
                    return (
                      <tr key={line.id || line.code || idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2 px-3 text-center font-mono text-slate-400 text-[11px]">{idx + 1}</td>
                        <td className="py-2 px-3">
                          <span
                            className="font-mono text-xs text-[#784e34] bg-[#784e34]/10 hover:bg-[#784e34]/20 px-2 py-0.5 rounded cursor-pointer"
                            onClick={() => onNavigateToProduct?.(line.code || line.name)}
                            title={`Xem chi tiết sản phẩm "${line.name}"`}
                          >
                            {line.code}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <div
                            className="font-medium text-slate-900 text-xs hover:text-[#784e34] hover:underline cursor-pointer"
                            onClick={() => onNavigateToProduct?.(line.code || line.name)}
                            title={`Xem chi tiết sản phẩm "${line.name}"`}
                          >
                            {line.name}
                          </div>
                          <div className="text-[11px] text-slate-500">{line.qualityNote || line.location}</div>
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-slate-600">{line.actualMc || line.systemMc}</td>
                        <td className="py-2 px-3 text-right font-mono font-medium text-slate-900">{line.systemQty}</td>
                        <td className="py-2 px-3 text-center">
                          <Input
                            type="number"
                            min={0}
                            step={0.1}
                            value={line.actualQty !== undefined ? line.actualQty : ''}
                            onChange={(e) => {
                              const raw = e.target.value;
                              const newQty = raw === '' ? 0 : Number(raw) || 0;
                              handleUpdateActualQty(line.code, newQty);
                            }}
                            className="w-24 text-xs font-mono font-medium text-center !border-0 !border-b !border-slate-300 hover:!border-slate-500 focus-within:!border-[#784e34] !rounded-none !shadow-none !bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </td>
                        <td className={`py-2 px-3 text-right font-mono font-medium ${diffColor}`}>
                          {diff > 0 ? `+${diff}` : diff}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <Button
                            type="text"
                            size="small"
                            icon={<DeleteOutlined className="text-slate-400 hover:text-rose-600 text-sm" />}
                            onClick={() => handleDeleteItem(line.code)}
                            className="w-7 h-7 flex items-center justify-center rounded hover:bg-rose-50"
                            title="Xóa khỏi danh sách"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </PosEntryItemsCard>
        </PosEntryLayout>
      </div>

      {/* ========================================================================= */}
      {/* 2. MOBILE VIEW (< lg): COMPACT, INTUITIVE, NO OVERFLOW, STREAMLINED POS   */}
      {/* ========================================================================= */}
      <div className="block lg:hidden space-y-2.5 pb-24 text-xs">
        {/* 2.1 Mobile Header & Product Search */}
        <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-2">
          {/* Row 1: Back, Title, Code Badge, Quick Actions */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Button
                icon={<ArrowLeftOutlined />}
                size="small"
                onClick={onBack}
                className="h-8 w-8 rounded-lg text-slate-700 flex items-center justify-center p-0 border-slate-200 hover:!bg-slate-100"
                title="Quay lại danh sách"
              />
              <div className="flex items-center gap-1.5 min-w-0">
                <h1 className="m-0 text-xs sm:text-sm font-bold text-slate-900 truncate">
                  {stocktakeViewMode === 'create' ? 'Kiểm kho' : 'Cập nhật kiểm kho'}
                </h1>
                <span className="font-mono text-[10.5px] font-bold text-[#784e34] bg-[#784e34]/10 px-1.5 py-0.5 rounded shrink-0">
                  {stocktakeSlipCode || 'KK-NEW'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {onPrint && (
                <Button
                  size="small"
                  icon={<PrinterOutlined />}
                  onClick={onPrint}
                  className="h-8 w-8 p-0 flex items-center justify-center rounded-lg border-slate-200 text-slate-700 bg-slate-50 hover:!bg-slate-100"
                  title="In phiếu kiểm"
                />
              )}
              {onExportExcel && stocktakeEntryLines.length > 0 && (
                <Button
                  size="small"
                  icon={<FileExcelOutlined />}
                  onClick={onExportExcel}
                  className="h-8 w-8 p-0 flex items-center justify-center rounded-lg border-emerald-600 text-emerald-700 bg-emerald-50 hover:!bg-emerald-100"
                  title="Xuất Excel chi tiết"
                />
              )}
              {stocktakeEntryLines.length > 0 && (
                <Popconfirm
                  title="Xóa tất cả mặt hàng kiểm kê?"
                  onConfirm={handleClearAll}
                  okText="Xóa hết"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true }}
                >
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    className="h-8 w-8 p-0 flex items-center justify-center rounded-lg"
                    title={`Xóa tất cả (${stocktakeEntryLines.length})`}
                  />
                </Popconfirm>
              )}
            </div>
          </div>

          {/* Row 2: Search Input Full Width */}
          <div className="relative w-full">
            <Input
              prefix={<SearchOutlined className="text-slate-400 text-xs mr-1" />}
              placeholder="Tìm theo tên sản phẩm, mã SKU (F3)..."
              value={stocktakeSearchProduct}
              onChange={(e) => {
                setStocktakeSearchProduct(e.target.value);
                setShowMobileSearchPopover(e.target.value.trim().length > 0);
              }}
              onFocus={() => {
                if (stocktakeSearchProduct.trim()) setShowMobileSearchPopover(true);
              }}
              allowClear
              className="h-9 text-xs rounded-lg bg-slate-50 border-slate-200 focus:bg-white"
            />

            {/* Mobile Dropdown Search Results */}
            {showMobileSearchPopover && stocktakeSearchProduct.trim() !== '' && (
              <div
                className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl space-y-1"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-2 py-1 bg-slate-50 rounded-lg text-[11px] text-slate-500 font-medium">
                  <span>Kết quả ({filteredProducts.length})</span>
                  <button
                    type="button"
                    onClick={() => setShowMobileSearchPopover(false)}
                    className="text-slate-400 hover:text-slate-700 border-none bg-transparent cursor-pointer p-0 text-xs font-semibold"
                  >
                    ✕ Đóng
                  </button>
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-400 italic">
                    Không tìm thấy sản phẩm nào
                  </div>
                ) : (
                  filteredProducts.map((p) => {
                    const pCode = p.code || p.id;
                    const alreadyLine = stocktakeEntryLines.find((l) => l.code === pCode || l.id === p.id);
                    const thumbUrl = p.image || (p.images && p.images[0]) || '';

                    return (
                      <button
                        key={p.id || p.code}
                        type="button"
                        onClick={() => {
                          handleSelectProduct(p);
                          setShowMobileSearchPopover(false);
                        }}
                        className={`flex w-full cursor-pointer items-center gap-2 rounded-lg p-2 text-left transition-colors border ${
                          alreadyLine
                            ? 'bg-amber-50/70 border-amber-200'
                            : 'bg-white border-transparent hover:bg-slate-50'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-md overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                          {thumbUrl ? (
                            <img src={thumbUrl} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold">SP</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-slate-900 line-clamp-1">{p.name}</div>
                          <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500 font-mono mt-0.5">
                            <span className="text-[#784e34] font-bold">{p.code}</span>
                            <span>•</span>
                            <span className="text-emerald-700">Tồn: {p.inStock ?? 0}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          {alreadyLine ? (
                            <span className="text-[10px] text-amber-800 bg-amber-100/80 px-1 rounded font-medium">
                              TT: {alreadyLine.actualQty}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 bg-slate-100 px-1 rounded">
                              + Thêm
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* 2.2 Mobile Stocktake Info Card */}
        <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-2">
          {/* Kho kiểm kê */}
          <div>
            <label className="text-xs font-semibold text-slate-800 block mb-1">Kho kiểm kê</label>
            <Select
              value={stocktakeWarehouseName || availableBranchWarehouses[0]?.name || undefined}
              onChange={setStocktakeWarehouseName}
              options={availableBranchWarehouses.map((w) => ({ value: w.name, label: `${w.name} (${w.branch})` }))}
              placeholder="Chọn kho kiểm kê..."
              className="w-full h-8 text-xs font-normal"
            />
          </div>

          {/* Chi nhánh & Trạng thái */}
          <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">
            <div>
              <span className="text-slate-400 text-[11px] block">Chi nhánh:</span>
              <span className="font-semibold text-slate-800">
                {availableBranchWarehouses.find((w) => w.name === stocktakeWarehouseName)?.branch || 'Chi nhánh quản lý'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 text-[11px] block">Trạng thái:</span>
              <Tag color={stocktakeViewMode === 'edit' ? 'processing' : 'gold'} className="m-0 text-[10.5px]">
                {stocktakeViewMode === 'edit' ? 'Đang kiểm đếm' : 'Phiếu tạm'}
              </Tag>
            </div>
          </div>

          {/* Collapsible toggle for extra details (Người kiểm, Ghi chú) */}
          <button
            type="button"
            onClick={() => setShowExtraDetails(!showExtraDetails)}
            className="flex items-center justify-between w-full pt-1.5 border-t border-slate-100 text-[11px] text-slate-500 font-medium bg-transparent border-none cursor-pointer p-0 hover:text-slate-800"
          >
            <span className="flex items-center gap-1.5">
              <span>{showExtraDetails ? 'Thu gọn thông tin phụ' : 'Thêm người kiểm, ghi chú...'}</span>
              {(stocktakeNote || stocktakeStaffName) && !showExtraDetails && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#784e34]" title="Đã có ghi chú" />
              )}
            </span>
            {showExtraDetails ? <UpOutlined className="text-[10px]" /> : <DownOutlined className="text-[10px]" />}
          </button>

          {showExtraDetails && (
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">Người lập phiếu / KCS</label>
                <Input
                  value={stocktakeStaffName}
                  onChange={(e) => setStocktakeStaffName?.(e.target.value)}
                  placeholder="VD: Nguyễn Văn Nam"
                  className="h-7 text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">Ghi chú kiểm kho / Lý do lệch</label>
                <Input.TextArea
                  rows={2}
                  placeholder="Nhập ghi chú hoặc lý do chênh lệch..."
                  value={stocktakeNote}
                  onChange={(e) => setStocktakeNote(e.target.value)}
                  className="text-xs rounded-lg"
                />
              </div>
            </div>
          )}
        </div>

        {/* 2.3 Mobile Stocktake Items List */}
        <div className="space-y-2">
          {/* Header & Filter Pills */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Mặt hàng ({stocktakeEntryLines.length})
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Tổng thực tế: <strong className="text-slate-900 font-mono">{totalActual.toFixed(1)}</strong>
              </span>
            </div>

            {/* Filter Pills Scrollable */}
            {stocktakeEntryLines.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
                {[
                  { key: 'all', label: `Tất cả (${stocktakeEntryLines.length})` },
                  { key: 'matched', label: `Khớp (${matchedCount})` },
                  { key: 'diff', label: `Lệch (${diffCount})` },
                  { key: 'increase', label: `Tăng (${increaseCount})` },
                  { key: 'decrease', label: `Giảm (${decreaseCount})` },
                ].map((tab) => {
                  const isActive = stocktakeTabFilter === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setStocktakeTabFilter(tab.key as any)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap border cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-[#784e34] text-white border-[#784e34] shadow-2xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {filteredLines.length === 0 ? (
            <div className="p-4 text-center bg-white rounded-xl border border-dashed border-slate-200">
              <div className="text-slate-400 text-xs font-medium mb-0.5">
                {stocktakeEntryLines.length === 0 ? 'Chưa có sản phẩm nào kiểm kê' : 'Không có sản phẩm nào trong bộ lọc này'}
              </div>
              <div className="text-[11px] text-slate-400">Tìm kiếm theo tên hoặc mã SKU ở ô phía trên</div>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLines.map((line) => {
                const diff = Number((Number(line.actualQty || 0) - Number(line.systemQty || 0)).toFixed(2));
                const isMatched = diff === 0;

                return (
                  <div
                    key={line.id || line.code}
                    className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-2"
                  >
                    {/* Top: Name & Delete */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div
                          className="text-xs font-semibold text-slate-900 line-clamp-1 cursor-pointer hover:text-[#784e34]"
                          onClick={() => onNavigateToProduct?.(line.code || line.name)}
                          title={`Xem sản phẩm ${line.name}`}
                        >
                          {line.name}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500 font-mono">
                          <span className="text-[#784e34] font-bold bg-[#784e34]/10 px-1 py-0.2 rounded">
                            {line.code}
                          </span>
                          <span>• Tồn sổ: <strong className="text-slate-800">{line.systemQty}</strong></span>
                          {line.unit && <span>• {line.unit}</span>}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(line.code)}
                        className="text-slate-400 hover:text-rose-600 p-1 border-none bg-transparent cursor-pointer rounded hover:bg-rose-50"
                        title="Xóa khỏi danh sách"
                      >
                        <DeleteOutlined className="text-sm" />
                      </button>
                    </div>

                    {/* Bottom: Actual Qty Stepper [-] [Q] [+] & Difference badge */}
                    <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-100 text-xs">
                      {/* Stepper */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-500 font-medium">Thực tế:</span>
                        <div className="flex items-center border border-slate-200 rounded-md overflow-hidden bg-slate-50 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleUpdateActualQty(line.code, (Number(line.actualQty) || 0) - 1)}
                            className="w-6 h-7 flex items-center justify-center text-slate-700 font-bold border-none bg-transparent cursor-pointer active:bg-slate-200"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={0}
                            step={0.1}
                            value={line.actualQty !== undefined ? line.actualQty : ''}
                            onChange={(e) => {
                              const raw = e.target.value;
                              const newQty = raw === '' ? 0 : Number(raw) || 0;
                              handleUpdateActualQty(line.code, newQty);
                            }}
                            className="w-12 h-7 text-center font-mono font-bold text-xs bg-white border-0 border-x border-slate-200 outline-none p-0"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateActualQty(line.code, (Number(line.actualQty) || 0) + 1)}
                            className="w-6 h-7 flex items-center justify-center text-slate-700 font-bold border-none bg-transparent cursor-pointer active:bg-slate-200"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Discrepancy Status */}
                      <div className="text-right shrink-0">
                        {isMatched ? (
                          <span className="font-mono text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            ✓ Khớp (0)
                          </span>
                        ) : diff > 0 ? (
                          <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            +{diff} (Thừa)
                          </span>
                        ) : (
                          <span className="font-mono text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            {diff} (Thiếu)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 2.4 Mobile Audit Statistics Summary */}
        <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-1.5 text-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-1 border-b border-slate-100 flex items-center justify-between">
            <span>Tổng kết kiểm đếm</span>
            <span className="text-[11px] font-mono text-slate-400 font-normal">
              {stocktakeDate || new Date().toLocaleDateString('vi-VN')}
            </span>
          </div>

          <div className="flex justify-between text-slate-700 pt-0.5">
            <span>Tổng SL thực tế:</span>
            <span className="font-mono font-bold text-slate-900">{totalActual.toFixed(1)}</span>
          </div>
          <div className="flex justify-between text-slate-700">
            <span>Tổng SL sổ sách:</span>
            <span className="font-mono font-bold text-slate-900">{totalSystem.toFixed(1)}</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-slate-100">
            <span className="font-semibold text-slate-800">Tổng SL chênh lệch:</span>
            <span className={`font-mono font-bold ${totalDiff !== 0 ? (totalDiff > 0 ? 'text-emerald-700' : 'text-rose-700') : 'text-slate-600'}`}>
              {totalDiff > 0 ? `+${totalDiff.toFixed(1)}` : totalDiff.toFixed(1)}
            </span>
          </div>
          <div className="flex justify-between text-emerald-700">
            <span>Lệch tăng (Thừa hàng):</span>
            <span className="font-mono font-semibold">+{totalIncrease.toFixed(1)}</span>
          </div>
          <div className="flex justify-between text-rose-600">
            <span>Lệch giảm (Thiếu hàng):</span>
            <span className="font-mono font-semibold">-{totalDecrease.toFixed(1)}</span>
          </div>
        </div>

        {/* 2.5 Mobile Action Buttons */}
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={onSaveDraft}
              className="h-10 text-xs font-bold rounded-xl border-amber-400 text-amber-800 bg-amber-50 active:bg-amber-100 shadow-2xs"
            >
              📝 Lưu tạm
            </Button>
            <Button
              type="primary"
              onClick={onSubmit}
              className="h-10 text-xs font-bold rounded-xl !bg-[#784e34] !border-[#784e34] hover:!bg-[#633f2a] text-white shadow-xs"
            >
              ✓ Cân bằng kho
            </Button>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="w-full text-center text-xs text-slate-500 hover:text-slate-700 py-1 bg-transparent border-none cursor-pointer"
          >
            ← Quay lại danh sách kiểm kho
          </button>
        </div>
      </div>
    </>
  );
}
