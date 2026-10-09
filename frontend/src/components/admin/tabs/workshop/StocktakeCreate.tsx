'use client';

import React from 'react';
import { Button, Input, Select, InputNumber, Tag, Popconfirm, App } from 'antd';
import { PrinterOutlined, DeleteOutlined, FileExcelOutlined } from '@ant-design/icons';
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
  const allSearchableProducts = React.useMemo(() => {
    const map = new Map<string, import('@/types/admin').FeaturedCatalogProduct>();

    // 1. Catalog products
    (allProducts || []).forEach((p) => {
      const key = p.code || p.id;
      if (key) map.set(key, p);
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
          categoryName: `ĐVT: ${item.unit || 'Bộ'}`,
          stockNote: `${item.systemQty} ${item.unit || 'bộ'}`,
          stockType: 'in_stock',
          image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=120&q=80',
          location: item.location,
        });
      }
    });

    return Array.from(map.values());
  }, [allProducts, allAuditableStock]);

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
      const newItem: StockAuditItem = matchedAudit
        ? { ...matchedAudit, actualQty: matchedAudit.systemQty, status: 'matched' }
        : {
            id: product.id || `audit_${Date.now()}`,
            code: pCode,
            name: product.name,
            type: 'furniture',
            location: product.location || stocktakeWarehouseName || 'Kho chính',
            systemQty: (product as any).systemQty ?? 1,
            actualQty: (product as any).systemQty ?? 1,
            unit: (product as any).unit || (product as any).uom || 'Bộ',
            systemMc: '10.5%',
            actualMc: '10.5%',
            status: 'matched',
            qualityNote: 'Bình thường',
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

  return (
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
                    onConfirm={() => {
                      setStocktakeEntryLines([]);
                      message.info('Đã xóa toàn bộ danh sách kiểm kê!');
                    }}
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
          creatorName={stocktakeStaffName || user?.name || 'Nguyễn Văn Nam (Thủ kho)'}
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
              <span className="font-medium text-slate-900 text-right">Xưởng Sản Xuất Bình Chánh</span>
            </div>
            <div className="space-y-1">
              <label className="text-slate-500 block">Kho kiểm kê:</label>
              <Select
                value={stocktakeWarehouseName}
                onChange={setStocktakeWarehouseName}
                options={availableBranchWarehouses.map((w) => ({ value: w.name, label: `${w.name} (${w.branch})` }))}
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
                {stocktakeEntryLines
                  .reduce((acc, curr) => acc + (Number(curr.actualQty) || 0), 0)
                  .toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>Tổng SL lệch:</span>
              <span
                className={`font-mono font-medium ${
                  stocktakeEntryLines.reduce(
                    (acc, curr) => acc + ((Number(curr.actualQty) || 0) - (Number(curr.systemQty) || 0)),
                    0
                  ) !== 0
                    ? 'text-amber-600'
                    : 'text-slate-950'
                }`}
              >
                {stocktakeEntryLines
                  .reduce(
                    (acc, curr) => acc + ((Number(curr.actualQty) || 0) - (Number(curr.systemQty) || 0)),
                    0
                  )
                  .toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between text-emerald-700 pt-1 border-t border-slate-200">
              <span>Tổng lệch tăng:</span>
              <span className="font-mono font-medium">
                +
                {stocktakeEntryLines
                  .reduce((acc, curr) => {
                    const diff = (Number(curr.actualQty) || 0) - (Number(curr.systemQty) || 0);
                    return diff > 0 ? acc + diff : acc;
                  }, 0)
                  .toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between text-rose-600">
              <span>Tổng lệch giảm:</span>
              <span className="font-mono font-medium">
                -
                {stocktakeEntryLines
                  .reduce((acc, curr) => {
                    const diff = (Number(curr.actualQty) || 0) - (Number(curr.systemQty) || 0);
                    return diff < 0 ? acc + Math.abs(diff) : acc;
                  }, 0)
                  .toFixed(1)}
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
        totalQuantity={Number(stocktakeEntryLines.reduce((acc, curr) => acc + (Number(curr.actualQty) || 0), 0).toFixed(1))}
        emptyIcon="📋"
        emptyTitle="Thêm sản phẩm vào phiếu kiểm kho"
        emptyDescription="Tìm kiếm hàng hóa theo mã hoặc tên ở ô tìm kiếm phía trên để bắt đầu kiểm kê."
        footerTotalText="Tổng SL thực tế kiểm đếm"
        footerTotalValue={`${stocktakeEntryLines.reduce((acc, curr) => acc + (Number(curr.actualQty) || 0), 0).toFixed(1)} (Sổ sách: ${stocktakeEntryLines.reduce((acc, curr) => acc + (Number(curr.systemQty) || 0), 0).toFixed(1)})`}
        extraHeader={
          stocktakeEntryLines.length > 0 && (
            <div className="flex items-center gap-3 text-xs overflow-x-auto">
              {[
                { key: 'all', label: `Tất cả (${stocktakeEntryLines.length})` },
                {
                  key: 'matched',
                  label: `Khớp (${
                    stocktakeEntryLines.filter(
                      (l) => Number(l.actualQty || 0) === Number(l.systemQty || 0)
                    ).length
                  })`,
                },
                {
                  key: 'diff',
                  label: `Lệch (${
                    stocktakeEntryLines.filter(
                      (l) => Number(l.actualQty || 0) !== Number(l.systemQty || 0)
                    ).length
                  })`,
                },
                {
                  key: 'increase',
                  label: `Lệch tăng (${
                    stocktakeEntryLines.filter(
                      (l) => Number(l.actualQty || 0) > Number(l.systemQty || 0)
                    ).length
                  })`,
                },
                {
                  key: 'decrease',
                  label: `Lệch giảm (${
                    stocktakeEntryLines.filter(
                      (l) => Number(l.actualQty || 0) < Number(l.systemQty || 0)
                    ).length
                  })`,
                },
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
                <th className="py-2.5 px-3 text-center">ĐVT</th>
                <th className="py-2.5 px-3 text-center">Độ ẩm MC</th>
                <th className="py-2.5 px-3 text-right">Tồn kho</th>
                <th className="py-2.5 px-3 text-center w-28">Thực tế</th>
                <th className="py-2.5 px-3 text-right">SL lệch</th>
                <th className="py-2.5 px-3 text-center w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-normal">
              {stocktakeEntryLines
                .filter((line) => {
                  const diff = Number(line.actualQty || 0) - Number(line.systemQty || 0);
                  if (stocktakeTabFilter === 'matched') return diff === 0;
                  if (stocktakeTabFilter === 'diff') return diff !== 0;
                  if (stocktakeTabFilter === 'increase') return diff > 0;
                  if (stocktakeTabFilter === 'decrease') return diff < 0;
                  return true;
                })
                .map((line, idx) => {
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
                      <td className="py-2 px-3 text-center text-slate-600">{line.unit}</td>
                      <td className="py-2 px-3 text-center font-mono text-slate-600">{line.actualMc || line.systemMc}</td>
                      <td className="py-2 px-3 text-right font-mono font-medium text-slate-900">{line.systemQty}</td>
                      <td className="py-2 px-3 text-center">
                        <InputNumber
                          min={0}
                          step={0.1}
                          value={line.actualQty}
                          onChange={(val) => {
                            const newQty = val === null ? 0 : Number(val);
                            setStocktakeEntryLines((prev) =>
                              prev.map((l) =>
                                l.code === line.code
                                  ? {
                                      ...l,
                                      actualQty: newQty,
                                      status: newQty === Number(l.systemQty) ? 'matched' : 'discrepancy',
                                    }
                                  : l
                              )
                            );
                          }}
                          className="w-24 text-xs font-mono font-medium [&_.ant-input-number-input]:text-center !border-0 !border-b !border-slate-300 hover:!border-slate-500 focus-within:!border-[#784e34] !rounded-none !shadow-none !bg-transparent"
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
                          onClick={() =>
                            setStocktakeEntryLines((prev) => prev.filter((l) => l.code !== line.code))
                          }
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
  );
}
