'use client';

import React, { useEffect, useState } from 'react';
import { Button, Input, Select, InputNumber, Popconfirm, App } from 'antd';
import {
  FileExcelOutlined,
  DeleteOutlined,
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
  AdminSupplier,
  AdminWarehouse,
  StockImportSlip,
} from '@/types/admin';
import { isMatchBranch, isProductInBranch, getProductStockForBranch } from '@/utils/branchHelper';

const { Option } = Select;

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

export interface SupplierReturnLine {
  id: string;
  code: string;
  name: string;
  spec?: string;
  unit: string;
  quantity: number;
  purchasePrice: number;
  returnPrice: number;
  total: number;
  reason?: string;
}

export interface SupplierReturnCreateProps {
  returnCode: string;
  returnDate: string;
  returnSourceCode?: string;
  setReturnSourceCode: (val?: string) => void;
  returnSupplier?: string;
  setReturnSupplier: (val?: string) => void;
  returnWarehouse?: string;
  setReturnWarehouse: (val?: string) => void;
  returnStaffName: string;
  setReturnStaffName: (val: string) => void;
  returnReason: string;
  setReturnReason: (val: string) => void;
  returnSolution: string;
  setReturnSolution: (val: string) => void;
  returnDiscount: number;
  setReturnDiscount: (val: number) => void;
  returnPaidAmount?: number;
  setReturnPaidAmount: (val?: number) => void;
  returnPaymentMethod: string;
  setReturnPaymentMethod: (val: string) => void;
  returnNote: string;
  setReturnNote: (val: string) => void;
  returnEntryLines: SupplierReturnLine[];
  setReturnEntryLines: React.Dispatch<React.SetStateAction<SupplierReturnLine[]>>;
  returnSearchProduct: string;
  setReturnSearchProduct: (val: string) => void;
  allProducts?: import('@/types/admin').FeaturedCatalogProduct[];
  importsList: StockImportSlip[];
  availableBranchSuppliers: AdminSupplier[];
  availableBranchWarehouses: AdminWarehouse[];
  isMatchGlobalBranch?: (name?: string) => boolean;
  onNavigateToProduct?: (query: string) => void;
  onBack: () => void;
  onSaveDraft: () => void;
  onSubmit: () => void;
  onOpenCreateSupplier?: () => void;
  onExportExcel?: () => void;
  user?: { name?: string } | null;
}

export function SupplierReturnCreate({
  returnCode,
  returnDate,
  returnSourceCode,
  setReturnSourceCode,
  returnSupplier,
  setReturnSupplier,
  returnWarehouse,
  setReturnWarehouse,
  returnStaffName,
  setReturnStaffName,
  returnReason,
  setReturnReason,
  returnSolution,
  setReturnSolution,
  returnDiscount,
  setReturnDiscount,
  returnPaidAmount,
  setReturnPaidAmount,
  returnPaymentMethod,
  setReturnPaymentMethod,
  returnNote,
  setReturnNote,
  returnEntryLines,
  setReturnEntryLines,
  returnSearchProduct,
  setReturnSearchProduct,
  allProducts = [],
  importsList,
  availableBranchSuppliers,
  availableBranchWarehouses,
  isMatchGlobalBranch = () => true,
  onNavigateToProduct,
  onBack,
  onSaveDraft,
  onSubmit,
  onOpenCreateSupplier,
  onExportExcel,
  user,
}: SupplierReturnCreateProps) {
  const { message } = App.useApp();
  const [showExtraDetails, setShowExtraDetails] = useState(false);
  const [showMobileSearchPopover, setShowMobileSearchPopover] = useState(false);

  const prevRefundRef = React.useRef<number | undefined>(undefined);

  // Auto-sync return warehouse to currently available branch warehouses
  useEffect(() => {
    if (availableBranchWarehouses.length > 0) {
      const isValid = availableBranchWarehouses.some((w) => w.name === returnWarehouse);
      if (!isValid) {
        setReturnWarehouse(availableBranchWarehouses[0].name);
      }
    }
  }, [availableBranchWarehouses, returnWarehouse, setReturnWarehouse]);

  // Common calculations
  const totalRefundGoods = returnEntryLines.reduce(
    (sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.returnPrice) || 0)),
    0
  );
  const totalQuantity = returnEntryLines.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0
  );
  const isDebtOffset = returnPaymentMethod === 'Cấn trừ công nợ';
  const refund = Math.max(0, totalRefundGoods - (returnDiscount || 0));
  const paid = isDebtOffset ? 0 : Math.min(refund, Math.max(0, Number(returnPaidAmount ?? 0)));
  const remaining = isDebtOffset ? 0 : Math.max(0, refund - paid);

  // Smart auto-sync refund paid amount whenever return lines, discount, or payment method change
  useEffect(() => {
    const currentTotal = returnEntryLines.reduce(
      (sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.returnPrice) || 0)),
      0
    );
    const currentRefund = Math.max(0, currentTotal - (returnDiscount || 0));

    if (returnPaymentMethod !== 'Cấn trừ công nợ') {
      if (
        returnPaidAmount === undefined ||
        (prevRefundRef.current !== undefined && returnPaidAmount === prevRefundRef.current)
      ) {
        if (currentRefund > 0) {
          setReturnPaidAmount(currentRefund);
        }
      } else if (returnPaidAmount > currentRefund) {
        setReturnPaidAmount(currentRefund);
      }
    } else {
      if (returnPaidAmount !== 0) {
        setReturnPaidAmount(0);
      }
    }

    prevRefundRef.current = currentRefund;
  }, [returnEntryLines, returnDiscount, returnPaymentMethod]);

  const currentBranch = React.useMemo(() => {
    if (returnWarehouse) {
      const matched = availableBranchWarehouses.find((w) => w.name === returnWarehouse);
      if (matched?.branch) return matched.branch;
      return returnWarehouse;
    }
    return availableBranchWarehouses[0]?.branch || availableBranchWarehouses[0]?.name || '';
  }, [returnWarehouse, availableBranchWarehouses]);

  const allSearchableProducts = React.useMemo(() => {
    const map = new Map<string, import('@/types/admin').FeaturedCatalogProduct>();

    // 1. Catalog products belonging to this branch with available stock > 0
    (allProducts || []).forEach((p) => {
      if (!isProductInBranch(p, currentBranch, availableBranchWarehouses)) return;
      const stock = getProductStockForBranch(p, currentBranch, availableBranchWarehouses);
      if (stock <= 0) return;
      const key = p.code || p.id;
      if (key) {
        map.set(key, {
          ...p,
          inStock: stock,
          stockNote: `${stock}`,
        });
      }
    });

    // 2. Import slip items belonging to this warehouse/branch
    (importsList || []).forEach((imp) => {
      const isSlipMatch =
        (returnWarehouse && imp.warehouseName === returnWarehouse) ||
        isMatchBranch(imp.warehouseName, currentBranch, availableBranchWarehouses);
      if (!isSlipMatch) return;

      const key = imp.code || imp.id;
      if (key && !map.has(key)) {
        map.set(key, {
          id: imp.id,
          code: imp.code,
          name: imp.itemName || `Phiếu nhập ${imp.code}`,
          price: imp.totalValue || imp.unitPrice || 0,
          originalPrice: imp.unitPrice || imp.totalValue || 0,
          costPrice: imp.unitPrice || imp.totalValue || 0,
          collection: imp.warehouseName || returnWarehouse || 'Kho chính',
          categoryName: `NCC: ${imp.supplier}`,
          stockNote: `${imp.quantity || 1}`,
          inStock: imp.quantity || 1,
          stockType: 'in_stock',
          image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=120&q=80',
          description: imp.spec || '',
        });
      }
    });

    return Array.from(map.values());
  }, [allProducts, importsList, currentBranch, returnWarehouse, availableBranchWarehouses]);

  const filteredProducts = React.useMemo(() => {
    const rawQuery = (returnSearchProduct || '').trim().toLowerCase();
    const query = normalizeSearchText(returnSearchProduct);
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
  }, [allSearchableProducts, returnSearchProduct]);

  const handleSelectProduct = (product: import('@/types/admin').FeaturedCatalogProduct) => {
    const pCode = product.code || product.id;
    const alreadyLine = returnEntryLines.find((l) => l.code === pCode || l.id === product.id);
    const itemCostPrice =
      product.originalPrice !== undefined
        ? product.originalPrice
        : product.costPrice !== undefined
        ? product.costPrice
        : product.price || 0;

    const matchedImport = importsList.find((imp) => imp.code === pCode || imp.id === product.id);
    if (matchedImport) {
      if (!returnSourceCode) setReturnSourceCode(matchedImport.code);
      if (!returnSupplier) setReturnSupplier(matchedImport.supplier);
      if (!returnWarehouse) setReturnWarehouse(matchedImport.warehouseName);
    }

    if (!alreadyLine) {
      const defaultUnit = (product as any).unit || 'Bộ';
      const newLine: SupplierReturnLine = {
        id: `line_ret_${Date.now()}_${product.id || pCode}`,
        code: pCode,
        name: product.name,
        spec: (product as any).spec || product.dimensions || product.material || product.description || '',
        unit: defaultUnit,
        quantity: 1,
        purchasePrice: itemCostPrice,
        returnPrice: itemCostPrice,
        total: itemCostPrice,
        reason: 'Lỗi quy cách / Kiểm định không đạt tiêu chuẩn',
      };
      setReturnEntryLines((prev) => [...prev, newLine]);
      message.success(`Đã thêm sản phẩm "${product.name}" vào phiếu trả hàng`);
    } else {
      const currentStock = getProductStockForBranch(product, currentBranch, availableBranchWarehouses);
      if (currentStock > 0 && alreadyLine.quantity >= currentStock) {
        message.warning(`Số lượng trả hàng (${alreadyLine.quantity + 1}) vượt quá tồn kho hiện tại (${currentStock})`);
        return;
      }
      setReturnEntryLines((prev) =>
        prev.map((l) =>
          l.code === pCode || l.id === alreadyLine.id
            ? {
                ...l,
                quantity: l.quantity + 1,
                total: (l.quantity + 1) * l.returnPrice,
              }
            : l
        )
      );
      message.success(`Đã tăng số lượng "${product.name}" lên ${alreadyLine.quantity + 1}`);
    }
    setReturnSearchProduct('');
  };

  const handleUpdateQuantity = (id: string, qty: number) => {
    const safeQty = Math.max(1, qty);
    setReturnEntryLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, quantity: safeQty, total: safeQty * l.returnPrice } : l))
    );
  };

  const handleUpdateReturnPrice = (id: string, price: number) => {
    const safePrice = Math.max(0, price);
    setReturnEntryLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, returnPrice: safePrice, total: (l.quantity || 0) * safePrice } : l))
    );
  };

  const handleDeleteLine = (id: string) => {
    setReturnEntryLines((prev) => prev.filter((l) => l.id !== id));
  };

  const handleClearAll = () => {
    setReturnEntryLines([]);
    message.info('Đã xóa danh sách mặt hàng trả!');
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. DESKTOP VIEW (lg: and up): 100% UNCHANGED, PRESERVED EXACTLY AS IS     */}
      {/* ========================================================================= */}
      <div className="hidden lg:block">
        <PosEntryLayout
          header={
            <PosEntryHeader
              title="Lập Phiếu Trả Hàng Cho NCC"
              code={returnCode || '#TH-2026-NEW'}
              codeColor="rose"
              onBack={onBack}
              backTooltip="Quay lại danh sách phiếu trả hàng (giữ nháp)"
              searchValue={returnSearchProduct}
              onSearchChange={setReturnSearchProduct}
              searchPlaceholder="Tìm hàng hóa theo tên, mã SKU, mã phiếu nhập gốc (#PN-)..."
              searchResults={filteredProducts}
              selectedItemCodes={returnEntryLines.map((l) => l.code)}
              getItemQuantity={(code) => returnEntryLines.find((l) => l.code === code)?.quantity || 0}
              onSelectProduct={handleSelectProduct}
              extraActions={
                returnEntryLines.length > 0 && (
                  <>
                    {onExportExcel && (
                      <Button
                        size="small"
                        icon={<FileExcelOutlined />}
                        onClick={onExportExcel}
                        className="h-9 px-3 text-xs font-medium rounded-lg border-emerald-600 text-emerald-700 bg-emerald-50/50 hover:!bg-emerald-100 hover:!border-emerald-700"
                      >
                        Xuất Excel chi tiết
                      </Button>
                    )}
                    <Popconfirm
                      title="Xóa tất cả mặt hàng xuất trả?"
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
                        Xóa trắng ({returnEntryLines.length})
                      </Button>
                    </Popconfirm>
                  </>
                )
              }
            />
          }
          sidebar={
            <PosEntrySidebar
              creatorName={returnStaffName || user?.name || 'Thủ kho / KCS'}
              createdDate={returnDate || new Date().toLocaleDateString('vi-VN')}
              avatarBg="bg-rose-700"
              onCancel={onBack}
              onSaveDraft={onSaveDraft}
              onSubmit={onSubmit}
              submitText="✓ Xác nhận trả hàng"
              submitButtonBg="!bg-rose-700 hover:!bg-rose-800"
            >
              <div>
                <label className="text-xs font-semibold text-slate-800 block mb-1">Phiếu nhập gốc (Liên kết)</label>
                <Select
                  value={returnSourceCode}
                  onChange={(val) => {
                    setReturnSourceCode(val);
                    const matched = importsList.find((i) => i.code === val);
                    if (matched) {
                      setReturnSupplier(matched.supplier);
                      setReturnWarehouse(matched.warehouseName);
                      let linesSource = (matched.items && matched.items.length > 0) ? matched.items : [];
                      if (linesSource.length === 0 && (matched as any).itemsJson) {
                        try {
                          linesSource = JSON.parse((matched as any).itemsJson);
                        } catch {
                          linesSource = [];
                        }
                      }

                      if (linesSource.length > 0) {
                        setReturnEntryLines(
                          linesSource.map((it: any, i: number) => ({
                            id: `line_ret_${Date.now()}_${i}_${it.id || it.code || i}`,
                            code: it.code || matched.code,
                            name: it.name || matched.itemName,
                            spec: it.spec || matched.spec || '',
                            unit: it.unit || matched.unit || 'bộ',
                            quantity: it.quantity || 1,
                            purchasePrice: it.unitPrice || it.importPrice || matched.unitPrice || 0,
                            returnPrice: it.unitPrice || it.importPrice || matched.unitPrice || 0,
                            total: it.total || ((it.quantity || 1) * (it.unitPrice || matched.unitPrice || 0)),
                            reason: 'Lỗi quy cách / Kiểm định không đạt tiêu chuẩn',
                          }))
                        );
                      } else {
                        setReturnEntryLines([
                          {
                            id: `line_ret_${Date.now()}_${matched.id}`,
                            code: matched.code,
                            name: matched.itemName,
                            spec: matched.spec || '',
                            unit: matched.unit || 'bộ',
                            quantity: matched.quantity || 1,
                            purchasePrice: matched.unitPrice || matched.totalValue || 0,
                            returnPrice: matched.unitPrice || matched.totalValue || 0,
                            total: matched.totalValue || (matched.unitPrice ? matched.unitPrice * matched.quantity : 0),
                            reason: 'Lỗi quy cách / Kiểm định không đạt tiêu chuẩn',
                          },
                        ]);
                      }

                      const isUnpaidSlip = (matched.paidAmount || 0) === 0 || (matched.debtAmount || 0) > 0 || ((matched.paidAmount || 0) < (matched.totalValue || 0));
                      if (isUnpaidSlip) {
                        setReturnPaymentMethod('Cấn trừ công nợ');
                        setReturnSolution('Cấn trừ vào công nợ');
                        setReturnPaidAmount(0);
                      } else {
                        setReturnPaymentMethod('Chuyển khoản');
                        setReturnSolution('NCC đã hoàn lại tiền');
                        setReturnPaidAmount(undefined);
                      }
                    }
                  }}
                  placeholder="Chọn phiếu nhập gốc để liên kết..."
                  className="w-full h-9 text-xs font-mono"
                  showSearch
                  optionFilterProp="children"
                  allowClear
                >
                  {importsList.map((imp) => (
                    <Option key={imp.id} value={imp.code}>
                      {imp.code} - {imp.itemName} ({imp.supplier})
                    </Option>
                  ))}
                </Select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-800">
                    Nhà cung cấp đối tác <span className="text-red-500 font-bold">*</span>
                  </label>
                  {onOpenCreateSupplier && (
                    <button
                      type="button"
                      onClick={onOpenCreateSupplier}
                      className="text-[11px] font-medium text-[#784e34] hover:underline bg-transparent border-none cursor-pointer"
                    >
                      + Thêm NCC
                    </button>
                  )}
                </div>
                <Select
                  value={returnSupplier}
                  onChange={(val) => setReturnSupplier(val)}
                  placeholder="Chọn nhà cung cấp nhận hàng..."
                  status={!returnSupplier ? 'warning' : undefined}
                  className="w-full h-9 text-xs"
                  showSearch
                  optionFilterProp="children"
                  allowClear
                >
                  {availableBranchSuppliers.map((s) => (
                    <Option key={s.id} value={s.name}>
                      {s.name} ({s.code})
                    </Option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-800 block mb-1">Kho xuất trả hàng</label>
                <Select
                  value={returnWarehouse || availableBranchWarehouses[0]?.name || undefined}
                  onChange={(val) => setReturnWarehouse(val)}
                  placeholder="Chọn kho xuất hoàn trả..."
                  className="w-full h-9 text-xs"
                  showSearch
                  optionFilterProp="children"
                >
                  {availableBranchWarehouses.map((w) => (
                    <Option key={w.id} value={w.name}>
                      {w.name} ({w.branch})
                    </Option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-800 block mb-1">Lý do xuất trả</label>
                  <Select
                    value={returnReason}
                    onChange={(r) => setReturnReason(r)}
                    className="w-full h-8 text-xs"
                    options={[
                      { value: 'Lỗi quy cách / KCS không đạt', label: 'Lỗi quy cách / KCS' },
                      { value: 'Hàng hư hỏng do vận chuyển', label: 'Hư hỏng vận chuyển' },
                      { value: 'Giao sai mẫu mã / màu sắc', label: 'Sai mẫu / màu sắc' },
                      { value: 'Tồn kho chậm luân chuyển', label: 'Chậm luân chuyển' },
                      { value: 'Khác', label: 'Khác' },
                    ]}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-800 block mb-1">Phương án xử lý</label>
                  <Select
                    value={returnSolution}
                    onChange={(s) => setReturnSolution(s)}
                    className="w-full h-8 text-xs"
                    options={[
                      { value: 'Cấn trừ vào công nợ', label: 'Cấn trừ công nợ' },
                      { value: 'NCC đã hoàn lại tiền', label: 'NCC hoàn lại tiền' },
                      { value: 'Đổi hàng mới', label: 'Đổi hàng mới' },
                    ]}
                  />
                </div>
              </div>

              {/* Financial Calculations */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Tổng tiền hàng trả ({returnEntryLines.length} món)</span>
                  <span className="font-mono font-bold text-slate-900">{totalRefundGoods.toLocaleString('vi-VN')} đ</span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-600 font-medium shrink-0">Giảm giá / Phí trả hàng</span>
                  <InputNumber<number>
                    min={0}
                    max={totalRefundGoods > 0 ? totalRefundGoods : undefined}
                    placeholder="0"
                    value={returnDiscount || undefined}
                    onChange={(val) => {
                      const d = val ? Math.max(0, Number(val)) : 0;
                      setReturnDiscount(totalRefundGoods > 0 ? Math.min(totalRefundGoods, d) : d);
                    }}
                    formatter={(val) => (val !== undefined && val !== null ? `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '')}
                    parser={(val) => (val ? Number(val.replace(/\./g, '').replace(/[^\d]/g, '')) : ('' as any))}
                    controls={false}
                    style={{ width: 190, minWidth: 180 }}
                    className="w-48 sm:w-52 min-w-[180px] h-8 text-xs font-mono text-right px-2.5 !border-0 !border-b !border-slate-300 hover:!border-slate-500 focus-within:!border-rose-600 !rounded-none !shadow-none !bg-transparent [&_.ant-input-number-input]:text-right [&_.ant-input-number-input]:h-8 [&_.ant-input-number-input]:px-0"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-900 text-xs">
                    {isDebtOffset ? 'Giá trị cấn trừ công nợ' : 'Cần NCC hoàn lại tiền'}
                  </span>
                  <span className="font-mono font-bold text-rose-700 text-sm">{refund.toLocaleString('vi-VN')} đ</span>
                </div>

                {!isDebtOffset && (
                  <>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-slate-700 font-semibold">Tiền NCC đã trả</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setReturnPaidAmount(refund)}
                              className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded border border-emerald-200 cursor-pointer font-medium"
                              title="Điền đủ số tiền hoàn trả"
                            >
                              Trả đủ
                            </button>
                            <button
                              type="button"
                              onClick={() => setReturnPaidAmount(0)}
                              className="text-[10px] px-1.5 py-0.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded border border-rose-200 cursor-pointer font-medium"
                              title="Chưa nhận lại tiền (0 đ)"
                            >
                              Chưa trả
                            </button>
                          </div>
                        </div>
                        <InputNumber<number>
                          placeholder="Nhập số tiền..."
                          value={returnPaidAmount}
                          min={0}
                          max={refund > 0 ? refund : 0}
                          formatter={(val) => (val !== undefined && val !== null ? `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '')}
                          parser={(val) => (val ? Number(val.replace(/\./g, '').replace(/[^\d]/g, '')) : ('' as any))}
                          onChange={(val) => {
                            if (val === null || val === undefined) {
                              setReturnPaidAmount(undefined);
                            } else {
                              const num = Math.max(0, Number(val));
                              setReturnPaidAmount(refund > 0 ? Math.min(refund, num) : num);
                            }
                          }}
                          controls={false}
                          style={{ width: 190, minWidth: 180 }}
                          className="w-48 sm:w-52 min-w-[180px] h-8 text-xs font-mono font-bold text-right px-2.5 !border-0 !border-b !border-slate-300 hover:!border-slate-500 focus-within:!border-emerald-700 !rounded-none !shadow-none !bg-transparent [&_.ant-input-number-input]:text-right [&_.ant-input-number-input]:h-8 [&_.ant-input-number-input]:px-0 text-emerald-700"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-medium">Còn nợ hoàn tiền</span>
                      <span className={`font-mono font-bold ${remaining > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                        {remaining > 0 ? `${remaining.toLocaleString('vi-VN')} đ` : '0 đ'}
                      </span>
                    </div>
                  </>
                )}

                <div className="pt-2 border-t border-slate-200">
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Hình thức hoàn trả / cấn trừ</label>
                  <Select
                    value={returnPaymentMethod}
                    onChange={(m) => {
                      setReturnPaymentMethod(m);
                      if (m === 'Cấn trừ công nợ') {
                        setReturnPaidAmount(0);
                        setReturnSolution('Cấn trừ vào công nợ');
                      } else {
                        setReturnSolution('NCC đã hoàn lại tiền');
                        if (returnPaidAmount === 0 || returnPaidAmount === undefined) {
                          setReturnPaidAmount(refund);
                        }
                      }
                    }}
                    className="w-full h-8 text-xs"
                    options={[
                      { value: 'Chuyển khoản', label: 'Chuyển khoản ngân hàng (NCC hoàn tiền)' },
                      { value: 'Tiền mặt', label: 'Tiền mặt (NCC hoàn tiền)' },
                      { value: 'Cấn trừ công nợ', label: 'Cấn trừ vào công nợ NCC (Giảm nợ mua hàng)' },
                    ]}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-800 block mb-1">Ghi chú phiếu trả hàng</label>
                <Input.TextArea
                  value={returnNote}
                  onChange={(e) => setReturnNote(e.target.value)}
                  placeholder="VD: Biên bản kiểm định chất lượng kèm theo..."
                  rows={2}
                  className="text-xs rounded-lg"
                />
              </div>
            </PosEntrySidebar>
          }
        >
          <PosEntryItemsCard
            title="Danh sách hàng hóa hoàn trả NCC"
            itemCount={returnEntryLines.length}
            totalQuantity={totalQuantity}
            emptyIcon="🔄"
            emptyTitle="Chưa có sản phẩm nào trong phiếu trả hàng"
            emptyDescription="Chọn phiếu nhập gốc hoặc tìm kiếm mặt hàng ở thanh tìm kiếm phía trên để lập phiếu xuất trả."
            footerTotalText="Tổng giá trị hoàn trả"
            footerTotalValue={`${totalRefundGoods.toLocaleString('vi-VN')} đ`}
          >
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-[860px] w-full text-xs">
                <colgroup>
                  <col style={{ width: 44 }} />
                  <col style={{ width: 120 }} />
                  <col style={{ minWidth: 180 }} />
                  <col style={{ width: 120 }} />
                  <col style={{ width: 220 }} />
                  <col style={{ width: 160 }} />
                  <col style={{ width: 48 }} />
                </colgroup>
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2.5 text-center w-10">STT</th>
                    <th className="px-3 py-2.5 text-left w-28">Mã hàng</th>
                    <th className="px-3 py-2.5 text-left min-w-[140px]">Tên sản phẩm</th>
                    <th className="px-3 py-2.5 text-right w-28 min-w-[90px]">Số lượng</th>
                    <th className="px-3 py-2.5 text-right w-56 min-w-[200px]">Giá trả lại</th>
                    <th className="px-3 py-2.5 text-right w-44 min-w-[160px]">Thành tiền</th>
                    <th className="px-3 py-2.5 text-center w-12">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {returnEntryLines.map((line, idx) => (
                    <tr key={line.id} className="hover:bg-rose-50/20 transition-colors">
                      <td className="px-3 py-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="px-3 py-2 font-mono font-medium text-rose-700">
                        <span
                          className="cursor-pointer hover:underline"
                          onClick={() => onNavigateToProduct?.(line.code || line.name)}
                          title={`Xem chi tiết sản phẩm "${line.name}"`}
                        >
                          {line.code}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-medium text-slate-900">
                        <span
                          className="cursor-pointer hover:text-[#784e34] hover:underline"
                          onClick={() => onNavigateToProduct?.(line.code || line.name)}
                          title={`Xem chi tiết sản phẩm "${line.name}"`}
                        >
                          {line.name}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right w-28 min-w-[90px]">
                        <Input
                          type="number"
                          min={1}
                          value={line.quantity || ''}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const numQ = raw === '' ? 0 : Math.max(0, parseInt(raw, 10) || 0);
                            handleUpdateQuantity(line.id, numQ);
                          }}
                          onBlur={(e) => {
                            const raw = e.target.value;
                            const numQ = Math.max(1, parseInt(raw, 10) || 1);
                            handleUpdateQuantity(line.id, numQ);
                          }}
                          style={{ width: '100%', minWidth: 80 }}
                          className="w-full min-w-[80px] h-8 text-xs font-mono font-bold text-right px-2 !border-0 !border-b !border-slate-300 hover:!border-slate-500 focus-within:!border-rose-600 !rounded-none !shadow-none !bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </td>
                      <td className="px-3 py-2 text-right w-56 min-w-[200px]">
                        <InputNumber<number>
                          min={0}
                          placeholder="0"
                          value={line.returnPrice || undefined}
                          onChange={(val) => handleUpdateReturnPrice(line.id, val ? Number(val) : 0)}
                          formatter={(val) => (val !== undefined && val !== null ? `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '')}
                          parser={(val) => (val ? Number(val.replace(/\./g, '').replace(/[^\d]/g, '')) : ('' as any))}
                          controls={false}
                          style={{ width: '100%', minWidth: 180 }}
                          className="w-full min-w-[180px] h-8 text-xs font-mono font-bold text-right px-2.5 !border-0 !border-b !border-slate-300 hover:!border-slate-500 focus-within:!border-rose-600 !rounded-none !shadow-none !bg-transparent [&_.ant-input-number-input]:text-right [&_.ant-input-number-input]:h-8 [&_.ant-input-number-input]:px-0"
                        />
                      </td>
                      <td className="px-3 py-2 text-right w-44 min-w-[160px] font-mono font-bold text-rose-700 whitespace-nowrap">
                        {((Number(line.quantity) || 0) * (Number(line.returnPrice) || 0)).toLocaleString('vi-VN')} đ
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Button
                          size="small"
                          type="text"
                          danger
                          icon={<DeleteOutlined className="text-slate-400 hover:text-red-600" />}
                          onClick={() => handleDeleteLine(line.id)}
                          className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-50"
                        />
                      </td>
                    </tr>
                  ))}
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
        {/* 2.1 Mobile Header Bar & Search */}
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
                  Lập phiếu trả hàng NCC
                </h1>
                <span className="font-mono text-[10.5px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded shrink-0">
                  {returnCode || '#TH-NEW'}
                </span>
              </div>
            </div>

            {returnEntryLines.length > 0 && (
              <div className="flex items-center gap-1.5 shrink-0">
                {onExportExcel && (
                  <Button
                    size="small"
                    icon={<FileExcelOutlined />}
                    onClick={onExportExcel}
                    className="h-8 w-8 p-0 flex items-center justify-center rounded-lg border-emerald-600 text-emerald-700 bg-emerald-50 hover:!bg-emerald-100"
                    title="Xuất Excel chi tiết"
                  />
                )}
                <Popconfirm
                  title="Xóa tất cả mặt hàng xuất trả?"
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
                    title={`Xóa tất cả (${returnEntryLines.length})`}
                  />
                </Popconfirm>
              </div>
            )}
          </div>

          {/* Row 2: Search Input Full Width */}
          <div className="relative w-full">
            <Input
              prefix={<SearchOutlined className="text-slate-400 text-xs mr-1" />}
              placeholder="Tìm hàng hóa, mã SKU, phiếu nhập (#PN-)..."
              value={returnSearchProduct}
              onChange={(e) => {
                setReturnSearchProduct(e.target.value);
                setShowMobileSearchPopover(e.target.value.trim().length > 0);
              }}
              onFocus={() => {
                if (returnSearchProduct.trim()) setShowMobileSearchPopover(true);
              }}
              allowClear
              className="h-9 text-xs rounded-lg bg-slate-50 border-slate-200 focus:bg-white"
            />

            {/* Mobile Dropdown Search Results */}
            {showMobileSearchPopover && returnSearchProduct.trim() !== '' && (
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
                    const alreadyLine = returnEntryLines.find((l) => l.code === pCode || l.id === p.id);
                    const thumbUrl = p.image || (p.images && p.images[0]) || '';
                    const itemCostPrice =
                      p.originalPrice !== undefined
                        ? p.originalPrice
                        : p.costPrice !== undefined
                        ? p.costPrice
                        : p.price || 0;

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
                            ? 'bg-rose-50/70 border-rose-200'
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
                            <span className="text-rose-700 font-bold">{p.code}</span>
                            <span>•</span>
                            <span className="text-emerald-700">Tồn: {p.inStock ?? 0}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-mono font-bold text-rose-700">
                            {itemCostPrice.toLocaleString('vi-VN')} đ
                          </div>
                          {alreadyLine && (
                            <span className="text-[10px] text-rose-700 bg-rose-100/80 px-1 rounded">
                              Đã chọn ({alreadyLine.quantity})
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

        {/* 2.2 Mobile Supplier & Return Slip Info Card */}
        <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-2">
          {/* Phiếu nhập gốc liên kết */}
          <div>
            <label className="text-xs font-semibold text-slate-800 block mb-1">Phiếu nhập gốc (Liên kết)</label>
            <Select
              value={returnSourceCode}
              onChange={(val) => {
                setReturnSourceCode(val);
                const matched = importsList.find((i) => i.code === val);
                if (matched) {
                  setReturnSupplier(matched.supplier);
                  setReturnWarehouse(matched.warehouseName);
                  let linesSource = (matched.items && matched.items.length > 0) ? matched.items : [];
                  if (linesSource.length === 0 && (matched as any).itemsJson) {
                    try {
                      linesSource = JSON.parse((matched as any).itemsJson);
                    } catch {
                      linesSource = [];
                    }
                  }

                  if (linesSource.length > 0) {
                    setReturnEntryLines(
                      linesSource.map((it: any, i: number) => ({
                        id: `line_ret_${Date.now()}_${i}_${it.id || it.code || i}`,
                        code: it.code || matched.code,
                        name: it.name || matched.itemName,
                        spec: it.spec || matched.spec || '',
                        unit: it.unit || matched.unit || 'bộ',
                        quantity: it.quantity || 1,
                        purchasePrice: it.unitPrice || it.importPrice || matched.unitPrice || 0,
                        returnPrice: it.unitPrice || it.importPrice || matched.unitPrice || 0,
                        total: it.total || ((it.quantity || 1) * (it.unitPrice || matched.unitPrice || 0)),
                        reason: 'Lỗi quy cách / Kiểm định không đạt tiêu chuẩn',
                      }))
                    );
                  }

                  const isUnpaidSlip = (matched.paidAmount || 0) === 0 || (matched.debtAmount || 0) > 0 || ((matched.paidAmount || 0) < (matched.totalValue || 0));
                  if (isUnpaidSlip) {
                    setReturnPaymentMethod('Cấn trừ công nợ');
                    setReturnSolution('Cấn trừ vào công nợ');
                    setReturnPaidAmount(0);
                  } else {
                    setReturnPaymentMethod('Chuyển khoản');
                    setReturnSolution('NCC đã hoàn lại tiền');
                    setReturnPaidAmount(undefined);
                  }
                }
              }}
              placeholder="Chọn phiếu nhập gốc để liên kết..."
              className="w-full h-8 text-xs font-mono"
              showSearch
              optionFilterProp="children"
              allowClear
            >
              {importsList.map((imp) => (
                <Option key={imp.id} value={imp.code}>
                  {imp.code} - {imp.itemName} ({imp.supplier})
                </Option>
              ))}
            </Select>
          </div>

          {/* Nhà cung cấp đối tác */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-800">
                Nhà cung cấp đối tác <span className="text-red-500 font-bold">*</span>
              </label>
              {onOpenCreateSupplier && (
                <button
                  type="button"
                  onClick={onOpenCreateSupplier}
                  className="text-[11px] font-medium text-[#784e34] hover:underline bg-transparent border-none cursor-pointer p-0"
                >
                  + Thêm NCC
                </button>
              )}
            </div>
            <Select
              value={returnSupplier}
              onChange={(val) => setReturnSupplier(val)}
              placeholder="Chọn nhà cung cấp..."
              status={!returnSupplier ? 'warning' : undefined}
              className="w-full h-8 text-xs"
              showSearch
              optionFilterProp="children"
              allowClear
            >
              {availableBranchSuppliers.map((s) => (
                <Option key={s.id} value={s.name}>
                  {s.name} ({s.code})
                </Option>
              ))}
            </Select>
          </div>

          {/* Kho xuất trả */}
          <div>
            <label className="text-xs font-semibold text-slate-800 block mb-1">Kho xuất trả hàng</label>
            <Select
              value={returnWarehouse || availableBranchWarehouses[0]?.name || undefined}
              onChange={(val) => setReturnWarehouse(val)}
              className="w-full h-8 text-xs"
              showSearch
              optionFilterProp="children"
            >
              {availableBranchWarehouses.map((w) => (
                <Option key={w.id} value={w.name}>
                  {w.name} ({w.branch})
                </Option>
              ))}
            </Select>
          </div>

          {/* Collapsible toggle for extra details (Lý do, phương án, KCS, Ghi chú) */}
          <button
            type="button"
            onClick={() => setShowExtraDetails(!showExtraDetails)}
            className="flex items-center justify-between w-full pt-1.5 border-t border-slate-100 text-[11px] text-slate-500 font-medium bg-transparent border-none cursor-pointer p-0 hover:text-slate-800"
          >
            <span className="flex items-center gap-1.5">
              <span>{showExtraDetails ? 'Thu gọn chi tiết xuất trả' : 'Thêm lý do, phương án, KCS, ghi chú...'}</span>
              {(returnNote || returnStaffName) && !showExtraDetails && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600" title="Đã có ghi chú" />
              )}
            </span>
            {showExtraDetails ? <UpOutlined className="text-[10px]" /> : <DownOutlined className="text-[10px]" />}
          </button>

          {showExtraDetails && (
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">Lý do xuất trả</label>
                  <Select
                    value={returnReason}
                    onChange={(r) => setReturnReason(r)}
                    className="w-full h-7 text-xs"
                    options={[
                      { value: 'Lỗi quy cách / KCS không đạt', label: 'Lỗi quy cách / KCS' },
                      { value: 'Hàng hư hỏng do vận chuyển', label: 'Hư hỏng vận chuyển' },
                      { value: 'Giao sai mẫu mã / màu sắc', label: 'Sai mẫu / màu sắc' },
                      { value: 'Tồn kho chậm luân chuyển', label: 'Chậm luân chuyển' },
                      { value: 'Khác', label: 'Khác' },
                    ]}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">Phương án xử lý</label>
                  <Select
                    value={returnSolution}
                    onChange={(s) => setReturnSolution(s)}
                    className="w-full h-7 text-xs"
                    options={[
                      { value: 'Cấn trừ vào công nợ', label: 'Cấn trừ công nợ' },
                      { value: 'NCC đã hoàn lại tiền', label: 'NCC hoàn lại tiền' },
                      { value: 'Đổi hàng mới', label: 'Đổi hàng mới' },
                    ]}
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">Người phụ trách KCS</label>
                <Input
                  value={returnStaffName}
                  onChange={(e) => setReturnStaffName(e.target.value)}
                  placeholder="VD: Nguyễn Văn Nam"
                  className="h-7 text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">Ghi chú phiếu trả hàng</label>
                <Input.TextArea
                  value={returnNote}
                  onChange={(e) => setReturnNote(e.target.value)}
                  placeholder="VD: Biên bản kiểm định chất lượng..."
                  rows={2}
                  className="text-xs rounded-lg"
                />
              </div>
            </div>
          )}
        </div>

        {/* 2.3 Mobile Return Items List (Cards with stepper) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <span>Hàng xuất trả ({returnEntryLines.length})</span>
              <span className="bg-rose-50 text-rose-700 px-1.5 py-0.2 rounded font-mono text-[10.5px]">
                {totalQuantity} chiếc/bộ
              </span>
            </div>
            {returnEntryLines.length > 0 && (
              <span className="text-xs font-mono font-bold text-rose-700">
                {totalRefundGoods.toLocaleString('vi-VN')} đ
              </span>
            )}
          </div>

          {returnEntryLines.length === 0 ? (
            <div className="p-4 text-center bg-white rounded-xl border border-dashed border-slate-200">
              <div className="text-slate-400 text-xs font-medium mb-0.5">Chưa có sản phẩm nào xuất trả</div>
              <div className="text-[11px] text-slate-400">Chọn phiếu nhập gốc hoặc tìm theo tên / mã SKU ở trên</div>
            </div>
          ) : (
            <div className="space-y-2">
              {returnEntryLines.map((line) => (
                <div
                  key={line.id}
                  className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-2"
                >
                  {/* Top: Name & Delete */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div
                        className="text-xs font-semibold text-slate-900 line-clamp-1 cursor-pointer hover:text-rose-700"
                        onClick={() => onNavigateToProduct?.(line.code || line.name)}
                        title={`Xem sản phẩm ${line.name}`}
                      >
                        {line.name}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500 font-mono">
                        <span className="text-rose-700 font-bold bg-rose-50 px-1 py-0.2 rounded">
                          {line.code}
                        </span>
                        {line.unit && <span>• {line.unit}</span>}
                        {line.spec && <span className="truncate max-w-[120px]">• {line.spec}</span>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteLine(line.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 border-none bg-transparent cursor-pointer rounded hover:bg-rose-50"
                      title="Xóa mặt hàng này"
                    >
                      <DeleteOutlined className="text-sm" />
                    </button>
                  </div>

                  {/* Bottom: Price Input, Stepper [-] [Q] [+], and Subtotal */}
                  <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-100 text-xs">
                    {/* Price Input */}
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10.5px] text-slate-400 font-medium">Giá:</span>
                      <InputNumber<number>
                        min={0}
                        value={line.returnPrice || undefined}
                        onChange={(val) => handleUpdateReturnPrice(line.id, val ? Number(val) : 0)}
                        formatter={(val) => (val !== undefined && val !== null ? `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '')}
                        parser={(val) => (val ? Number(val.replace(/\./g, '').replace(/[^\d]/g, '')) : ('' as any))}
                        controls={false}
                        size="small"
                        className="w-24 h-7 text-xs font-mono font-bold text-right px-1"
                      />
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center border border-slate-200 rounded-md overflow-hidden bg-slate-50 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(line.id, line.quantity - 1)}
                        className="w-6 h-7 flex items-center justify-center text-slate-700 font-bold border-none bg-transparent cursor-pointer active:bg-slate-200"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={line.quantity || ''}
                        onChange={(e) => handleUpdateQuantity(line.id, parseInt(e.target.value, 10) || 1)}
                        className="w-8 h-7 text-center font-mono font-bold text-xs bg-white border-0 border-x border-slate-200 outline-none p-0"
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(line.id, line.quantity + 1)}
                        className="w-6 h-7 flex items-center justify-center text-slate-700 font-bold border-none bg-transparent cursor-pointer active:bg-slate-200"
                      >
                        +
                      </button>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right font-mono font-bold text-xs text-rose-700 shrink-0">
                      {((Number(line.quantity) || 0) * (Number(line.returnPrice) || 0)).toLocaleString('vi-VN')} đ
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2.4 Mobile Financials / Refund / Debt Offset Card */}
        <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-2 text-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-1.5 border-b border-slate-100 flex items-center justify-between">
            <span>Hoàn tiền & Cấn trừ nợ</span>
            <span className="text-[11px] font-mono text-slate-400 font-normal">
              {returnDate || new Date().toLocaleDateString('vi-VN')}
            </span>
          </div>

          {/* Tổng tiền hàng */}
          <div className="flex items-center justify-between">
            <span className="text-slate-600 font-medium">Tổng tiền hàng trả ({returnEntryLines.length} món)</span>
            <span className="font-mono font-bold text-slate-900">{totalRefundGoods.toLocaleString('vi-VN')} đ</span>
          </div>

          {/* Giảm giá */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-600 font-medium shrink-0">Giảm giá / Phí trừ</span>
            <InputNumber<number>
              min={0}
              max={totalRefundGoods > 0 ? totalRefundGoods : undefined}
              placeholder="0"
              value={returnDiscount || undefined}
              onChange={(val) => {
                const d = val ? Math.max(0, Number(val)) : 0;
                setReturnDiscount(totalRefundGoods > 0 ? Math.min(totalRefundGoods, d) : d);
              }}
              formatter={(val) => (val !== undefined && val !== null ? `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '')}
              parser={(val) => (val ? Number(val.replace(/\./g, '').replace(/[^\d]/g, '')) : ('' as any))}
              controls={false}
              size="small"
              className="w-28 sm:w-36 h-7 text-xs font-mono text-right"
            />
          </div>

          {/* Cần NCC hoàn tiền / Cấn trừ */}
          <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
            <span className="font-bold text-slate-900">
              {isDebtOffset ? 'Giá trị cấn trừ công nợ' : 'Cần NCC hoàn lại tiền'}
            </span>
            <span className="font-mono font-bold text-rose-700 text-sm">{refund.toLocaleString('vi-VN')} đ</span>
          </div>

          {/* Tiền NCC đã trả (nếu không phải cấn trừ nợ) */}
          {!isDebtOffset && (
            <>
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-slate-700 font-semibold text-[11px]">Đã nhận:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setReturnPaidAmount(refund)}
                      className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded border border-emerald-200 cursor-pointer font-medium"
                      title="Nhận đủ tiền"
                    >
                      Đủ
                    </button>
                    <button
                      type="button"
                      onClick={() => setReturnPaidAmount(0)}
                      className="text-[10px] px-1.5 py-0.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded border border-rose-200 cursor-pointer font-medium"
                      title="Chưa nhận lại tiền (0 đ)"
                    >
                      0 đ
                    </button>
                  </div>
                </div>
                <InputNumber<number>
                  placeholder="Nhập số tiền..."
                  value={returnPaidAmount}
                  min={0}
                  max={refund > 0 ? refund : 0}
                  formatter={(val) => (val !== undefined && val !== null ? `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '')}
                  parser={(val) => (val ? Number(val.replace(/\./g, '').replace(/[^\d]/g, '')) : ('' as any))}
                  onChange={(val) => {
                    if (val === null || val === undefined) {
                      setReturnPaidAmount(undefined);
                    } else {
                      const num = Math.max(0, Number(val));
                      setReturnPaidAmount(refund > 0 ? Math.min(refund, num) : num);
                    }
                  }}
                  controls={false}
                  size="small"
                  className="w-28 sm:w-36 h-7 text-xs font-mono font-bold text-right text-emerald-700"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Còn nợ hoàn tiền</span>
                <span className={`font-mono font-bold ${remaining > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                  {remaining > 0 ? `${remaining.toLocaleString('vi-VN')} đ` : '0 đ'}
                </span>
              </div>
            </>
          )}

          {/* Hình thức hoàn trả / cấn trừ */}
          <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-2">
            <label className="text-[11px] font-semibold text-slate-600 shrink-0">Hình thức:</label>
            <Select
              value={returnPaymentMethod}
              onChange={(m) => {
                setReturnPaymentMethod(m);
                if (m === 'Cấn trừ công nợ') {
                  setReturnPaidAmount(0);
                  setReturnSolution('Cấn trừ vào công nợ');
                } else {
                  setReturnSolution('NCC đã hoàn lại tiền');
                  if (returnPaidAmount === 0 || returnPaidAmount === undefined) {
                    setReturnPaidAmount(refund);
                  }
                }
              }}
              size="small"
              className="w-48 text-xs"
              options={[
                { value: 'Chuyển khoản', label: 'Chuyển khoản (NCC hoàn)' },
                { value: 'Tiền mặt', label: 'Tiền mặt (NCC hoàn)' },
                { value: 'Cấn trừ công nợ', label: 'Cấn trừ công nợ' },
              ]}
            />
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
              className="h-10 text-xs font-bold rounded-xl !bg-rose-700 !border-rose-700 hover:!bg-rose-800 text-white shadow-xs"
            >
              ✓ Xác nhận trả hàng
            </Button>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="w-full text-center text-xs text-slate-500 hover:text-slate-700 py-1 bg-transparent border-none cursor-pointer"
          >
            ← Quay lại danh sách phiếu trả hàng
          </button>
        </div>
      </div>
    </>
  );
}
