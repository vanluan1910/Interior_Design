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
  FeaturedCatalogProduct,
  AdminSupplier,
  AdminWarehouse,
} from '@/types/admin';

const { Option } = Select;

export interface StockImportCreateProps {
  importCode: string;
  importDate: string;
  importSupplier?: string;
  setImportSupplier: (val?: string) => void;
  importWarehouse?: string;
  setImportWarehouse: (val?: string) => void;
  importInvoiceNumber: string;
  setImportInvoiceNumber: (val: string) => void;
  importInspector: string;
  setImportInspector: (val: string) => void;
  importDiscount: number;
  setImportDiscount: (val: number) => void;
  importPaidAmount: number | undefined;
  setImportPaidAmount: (val: number | undefined) => void;
  importPaymentMethod: string;
  setImportPaymentMethod: (val: string) => void;
  importNote: string;
  setImportNote: (val: string) => void;
  importEntryLines: Array<{
    id: string;
    code: string;
    name: string;
    spec?: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    total: number;
  }>;
  setImportEntryLines: React.Dispatch<React.SetStateAction<Array<{
    id: string;
    code: string;
    name: string;
    spec?: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    total: number;
  }>>>;
  importSearchProduct: string;
  setImportSearchProduct: (val: string) => void;
  filteredImportProducts: FeaturedCatalogProduct[];
  availableBranchSuppliers: AdminSupplier[];
  availableBranchWarehouses: AdminWarehouse[];
  onNavigateToProduct?: (query: string) => void;
  onBack: () => void;
  onSaveDraft: () => void;
  onSubmit: () => void;
  onOpenCreateSupplier?: () => void;
  onExportExcel?: () => void;
  user?: { name?: string } | null;
  isEditing?: boolean;
}

export function StockImportCreate({
  importCode,
  importDate,
  importSupplier,
  setImportSupplier,
  importWarehouse,
  setImportWarehouse,
  importInvoiceNumber,
  setImportInvoiceNumber,
  importInspector,
  setImportInspector,
  importDiscount,
  setImportDiscount,
  importPaidAmount,
  setImportPaidAmount,
  importPaymentMethod,
  setImportPaymentMethod,
  importNote,
  setImportNote,
  importEntryLines,
  setImportEntryLines,
  importSearchProduct,
  setImportSearchProduct,
  filteredImportProducts,
  availableBranchSuppliers,
  availableBranchWarehouses,
  onNavigateToProduct,
  onBack,
  onSaveDraft,
  onSubmit,
  onOpenCreateSupplier,
  onExportExcel,
  user,
  isEditing,
}: StockImportCreateProps) {
  const { message } = App.useApp();
  const [showExtraDetails, setShowExtraDetails] = useState(false);
  const [showMobileSearchPopover, setShowMobileSearchPopover] = useState(false);

  const prevPayableRef = React.useRef<number | undefined>(undefined);

  // Auto-sync import warehouse to currently available branch warehouses
  useEffect(() => {
    if (availableBranchWarehouses.length > 0) {
      const isValid = availableBranchWarehouses.some((w) => w.name === importWarehouse);
      if (!isValid) {
        setImportWarehouse(availableBranchWarehouses[0].name);
      }
    }
  }, [availableBranchWarehouses, importWarehouse, setImportWarehouse]);

  // Common calculations
  const totalGoods = importEntryLines.reduce(
    (sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)),
    0
  );
  const totalQuantity = importEntryLines.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0
  );
  const payable = Math.max(0, totalGoods - (importDiscount || 0));
  const isUnpaid = importPaymentMethod === 'Chưa thanh toán';
  const paid = isUnpaid ? 0 : Math.min(payable, Math.max(0, Number(importPaidAmount ?? 0)));
  const debt = Math.max(0, payable - paid);

  // Smart auto-sync paid amount whenever items, discount, or payment method change
  useEffect(() => {
    const currentTotal = importEntryLines.reduce(
      (sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)),
      0
    );
    const currentPayable = Math.max(0, currentTotal - (importDiscount || 0));

    if (importPaymentMethod !== 'Chưa thanh toán') {
      if (
        importPaidAmount === undefined ||
        (prevPayableRef.current !== undefined && importPaidAmount === prevPayableRef.current)
      ) {
        if (currentPayable > 0) {
          setImportPaidAmount(currentPayable);
        }
      } else if (importPaidAmount > currentPayable) {
        setImportPaidAmount(currentPayable);
      }
    } else {
      if (importPaidAmount !== 0) {
        setImportPaidAmount(0);
      }
    }

    prevPayableRef.current = currentPayable;
  }, [importEntryLines, importDiscount, importPaymentMethod]);

  // Shared handlers
  const handleSelectProduct = (product: FeaturedCatalogProduct) => {
    const alreadyLine = importEntryLines.find((l) => l.code === product.code || l.id === product.id);
    const itemCostPrice =
      product.originalPrice !== undefined
        ? product.originalPrice
        : product.costPrice !== undefined
        ? product.costPrice
        : product.price || 0;
    if (!alreadyLine) {
      const defaultUnit = (product as any).unit || 'Bộ';
      const newLine = {
        id: `line_${Date.now()}_${product.id}`,
        code: product.code,
        name: product.name,
        spec: product.collection || '',
        unit: defaultUnit,
        quantity: 1,
        unitPrice: itemCostPrice,
        discount: 0,
        total: itemCostPrice,
      };
      setImportEntryLines((prev) => [...prev, newLine]);
      message.success(`Đã thêm "${product.name}" vào phiếu nhập với giá gốc ${itemCostPrice.toLocaleString('vi-VN')} đ!`);
    } else {
      setImportEntryLines((prev) =>
        prev.map((l) =>
          l.code === product.code || l.id === product.id
            ? { ...l, quantity: l.quantity + 1, total: (l.quantity + 1) * l.unitPrice }
            : l
        )
      );
      message.info(`Đã tăng số lượng "${product.name}" (+1)!`);
    }
    setImportSearchProduct('');
  };

  const handleUpdateQuantity = (id: string, qty: number) => {
    const safeQty = Math.max(1, qty);
    setImportEntryLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, quantity: safeQty, total: safeQty * l.unitPrice } : l))
    );
  };

  const handleUpdateUnitPrice = (id: string, price: number) => {
    const safePrice = Math.max(0, price);
    setImportEntryLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, unitPrice: safePrice, total: (l.quantity || 0) * safePrice } : l))
    );
  };

  const handleDeleteLine = (id: string) => {
    setImportEntryLines((prev) => prev.filter((l) => l.id !== id));
  };

  const handleClearAll = () => {
    setImportEntryLines([]);
    message.info('Đã xóa danh sách mặt hàng!');
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
              title={isEditing ? 'Cập Nhật Phiếu Nhập Hàng' : 'Lập Phiếu Nhập Hàng'}
              code={importCode || '#PN-2026-NEW'}
              codeColor="primary"
              onBack={onBack}
              backTooltip="Quay lại danh sách phiếu nhập (giữ nháp)"
              searchValue={importSearchProduct}
              onSearchChange={setImportSearchProduct}
              searchResults={filteredImportProducts}
              selectedItemCodes={importEntryLines.map((l) => l.code)}
              getItemQuantity={(code) => importEntryLines.find((l) => l.code === code)?.quantity || 0}
              onSelectProduct={handleSelectProduct}
              extraActions={
                importEntryLines.length > 0 && (
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
                      title="Xóa tất cả các mặt hàng đã chọn?"
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
                        Xóa trắng ({importEntryLines.length})
                      </Button>
                    </Popconfirm>
                  </>
                )
              }
            />
          }
          sidebar={
            <PosEntrySidebar
              creatorName={importInspector || user?.name || 'Thủ kho / KCS'}
              createdDate={importDate || new Date().toLocaleDateString('vi-VN')}
              onCancel={onBack}
              onSaveDraft={onSaveDraft}
              onSubmit={onSubmit}
              submitText={isEditing ? '✓ Hoàn thành nhập kho' : '✓ Nhập hàng vào kho'}
              submitButtonBg="!bg-[#784e34] hover:!bg-[#633f2a]"
            >
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
                  value={importSupplier}
                  onChange={(val) => setImportSupplier(val)}
                  placeholder="Chọn nhà cung cấp (bắt buộc)..."
                  status={!importSupplier ? 'warning' : undefined}
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
                <label className="text-xs font-semibold text-slate-800 block mb-1">Kho tiếp nhận lưu trữ</label>
                <Select
                  value={importWarehouse || availableBranchWarehouses[0]?.name || undefined}
                  onChange={(val) => setImportWarehouse(val)}
                  placeholder={availableBranchWarehouses.length === 0 ? 'Chi nhánh chưa có kho lưu trữ' : 'Chọn kho tiếp nhận...'}
                  className="w-full h-9 text-xs"
                  showSearch
                  optionFilterProp="children"
                  notFoundContent={<span className="text-xs text-slate-500 p-2 block">Không có kho nào thuộc chi nhánh này</span>}
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
                  <label className="text-xs font-semibold text-slate-800 block mb-1">Số hóa đơn VAT / Phiếu giao</label>
                  <Input
                    value={importInvoiceNumber}
                    onChange={(e) => setImportInvoiceNumber(e.target.value)}
                    placeholder="VD: HD-2026/089"
                    className="h-8 text-xs font-mono !border-0 !border-b !border-slate-300 hover:!border-slate-500 focus:!border-[#784e34] !rounded-none !shadow-none !bg-transparent"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-800 block mb-1">Người phụ trách KCS</label>
                  <Input
                    value={importInspector}
                    onChange={(e) => setImportInspector(e.target.value)}
                    placeholder="VD: Nguyễn Văn Nam"
                    className="h-8 text-xs !border-0 !border-b !border-slate-300 hover:!border-slate-500 focus:!border-[#784e34] !rounded-none !shadow-none !bg-transparent"
                  />
                </div>
              </div>

              {/* Financial Calculations */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Tổng tiền hàng ({importEntryLines.length} món)</span>
                  <span className="font-mono font-bold text-slate-900">{totalGoods.toLocaleString('vi-VN')} đ</span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-600 font-medium shrink-0">Giảm giá / Chiết khấu</span>
                  <InputNumber<number>
                    min={0}
                    max={totalGoods > 0 ? totalGoods : undefined}
                    placeholder="0"
                    value={importDiscount || undefined}
                    onChange={(val) => {
                      const d = val ? Math.max(0, Number(val)) : 0;
                      setImportDiscount(totalGoods > 0 ? Math.min(totalGoods, d) : d);
                    }}
                    formatter={(val) => (val !== undefined && val !== null ? `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '')}
                    parser={(val) => (val ? Number(val.replace(/\./g, '').replace(/[^\d]/g, '')) : ('' as any))}
                    controls={false}
                    style={{ width: 190, minWidth: 180 }}
                    className="w-48 sm:w-52 min-w-[180px] h-8 text-xs font-mono text-right px-2.5 !border-0 !border-b !border-slate-300 hover:!border-slate-500 focus-within:!border-[#784e34] !rounded-none !shadow-none !bg-transparent [&_.ant-input-number-input]:text-right [&_.ant-input-number-input]:h-8 [&_.ant-input-number-input]:px-0"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-900 text-xs">Cần trả nhà cung cấp</span>
                  <span className="font-mono font-bold text-[#784e34] text-sm">{payable.toLocaleString('vi-VN')} đ</span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-slate-700 font-semibold">Tiền trả nhà cung cấp</span>
                      {!isUnpaid && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setImportPaidAmount(payable)}
                            className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded border border-emerald-200 cursor-pointer font-medium"
                            title="Điền đủ toàn bộ số tiền cần trả"
                          >
                            Trả đủ
                          </button>
                          <button
                            type="button"
                            onClick={() => setImportPaidAmount(0)}
                            className="text-[10px] px-1.5 py-0.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded border border-rose-200 cursor-pointer font-medium"
                            title="Chưa trả tiền (0 đ)"
                          >
                            Chưa trả
                          </button>
                        </div>
                      )}
                    </div>
                    <InputNumber<number>
                      disabled={isUnpaid}
                      placeholder={isUnpaid ? '0 đ (Chưa thanh toán)' : 'Nhập tiền đã trả...'}
                      value={isUnpaid ? 0 : importPaidAmount}
                      min={0}
                      max={payable > 0 ? payable : 0}
                      formatter={(val) => (val !== undefined && val !== null ? `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '')}
                      parser={(val) => (val ? Number(val.replace(/\./g, '').replace(/[^\d]/g, '')) : ('' as any))}
                      onChange={(val) => {
                        if (val === null || val === undefined) {
                          setImportPaidAmount(undefined);
                        } else {
                          const num = Math.max(0, Number(val));
                          setImportPaidAmount(payable > 0 ? Math.min(payable, num) : num);
                        }
                      }}
                      controls={false}
                      style={{ width: 190, minWidth: 180 }}
                      className={`w-48 sm:w-52 min-w-[180px] h-8 text-xs font-mono font-bold text-right px-2.5 !border-0 !border-b !border-slate-300 hover:!border-slate-500 focus-within:!border-emerald-700 !rounded-none !shadow-none !bg-transparent [&_.ant-input-number-input]:text-right [&_.ant-input-number-input]:h-8 [&_.ant-input-number-input]:px-0 ${isUnpaid ? 'text-slate-400 italic' : 'text-emerald-700'}`}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Tính vào công nợ NCC</span>
                  <span className={`font-mono font-bold ${debt > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                    {debt > 0 ? `${debt.toLocaleString('vi-VN')} đ` : '0 đ'}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Hình thức thanh toán</label>
                  <Select
                    value={importPaymentMethod}
                    onChange={(m) => {
                      setImportPaymentMethod(m);
                      if (m === 'Chưa thanh toán') {
                        setImportPaidAmount(0);
                      } else if (importPaidAmount === 0 || importPaidAmount === undefined) {
                        setImportPaidAmount(payable);
                      }
                    }}
                    className="w-full h-8 text-xs"
                    options={[
                      { value: 'Chuyển khoản', label: 'Chuyển khoản MBBank / QR' },
                      { value: 'Tiền mặt', label: 'Tiền mặt' },
                      { value: 'Chưa thanh toán', label: 'Chưa thanh toán (Ghi nợ NCC)' },
                    ]}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-800 block mb-1">Ghi chú phiếu nhập / Vị trí xếp kho</label>
                <Input.TextArea
                  value={importNote}
                  onChange={(e) => setImportNote(e.target.value)}
                  placeholder="VD: Xếp tại Kệ B2 - Showroom Thảo Điền, hàng nguyên đai nguyên kiện..."
                  rows={2}
                  className="text-xs rounded-lg"
                />
              </div>
            </PosEntrySidebar>
          }
        >
          <PosEntryItemsCard
            title="Danh sách hàng hóa nhập kho"
            itemCount={importEntryLines.length}
            totalQuantity={totalQuantity}
            emptyTitle="Chưa có sản phẩm nào trong phiếu nhập"
            emptyDescription="Tìm kiếm hàng hóa theo mã SKU hoặc tên sản phẩm ở ô tìm kiếm phía trên (F3) để thêm vào phiếu nhập."
            footerTotalValue={`${totalGoods.toLocaleString('vi-VN')} đ`}
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
                    <th className="px-3 py-2.5 text-right w-56 min-w-[200px]">Đơn giá nhập</th>
                    <th className="px-3 py-2.5 text-right w-44 min-w-[160px]">Thành tiền</th>
                    <th className="px-3 py-2.5 text-center w-12">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {importEntryLines.map((line, idx) => (
                    <tr key={line.id} className="hover:bg-amber-50/20 transition-colors">
                      <td className="px-3 py-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="px-3 py-2 font-mono font-medium text-[#784e34]">
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
                          className="w-full min-w-[80px] h-8 text-xs font-mono font-bold text-right px-2 !border-0 !border-b !border-slate-300 hover:!border-slate-500 focus-within:!border-[#784e34] !rounded-none !shadow-none !bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </td>
                      <td className="px-3 py-2 text-right w-56 min-w-[200px]">
                        <InputNumber<number>
                          min={0}
                          placeholder="0"
                          value={line.unitPrice || undefined}
                          onChange={(val) => handleUpdateUnitPrice(line.id, val ? Number(val) : 0)}
                          formatter={(val) => (val !== undefined && val !== null ? `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '')}
                          parser={(val) => (val ? Number(val.replace(/\./g, '').replace(/[^\d]/g, '')) : ('' as any))}
                          controls={false}
                          style={{ width: '100%', minWidth: 180 }}
                          className="w-full min-w-[180px] h-8 text-xs font-mono font-bold text-right px-2.5 !border-0 !border-b !border-slate-300 hover:!border-slate-500 focus-within:!border-[#784e34] !rounded-none !shadow-none !bg-transparent [&_.ant-input-number-input]:text-right [&_.ant-input-number-input]:h-8 [&_.ant-input-number-input]:px-0"
                        />
                      </td>
                      <td className="px-3 py-2 text-right w-44 min-w-[160px] font-mono font-bold text-[#784e34] whitespace-nowrap">
                        {((Number(line.quantity) || 0) * (Number(line.unitPrice) || 0)).toLocaleString('vi-VN')} đ
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
        {/* 2.1 Mobile Header Bar & Product Search */}
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
                  {isEditing ? 'Cập nhật phiếu nhập' : 'Lập phiếu nhập hàng'}
                </h1>
                <span className="font-mono text-[10.5px] font-bold text-[#784e34] bg-[#784e34]/10 px-1.5 py-0.5 rounded shrink-0">
                  {importCode || '#PN-NEW'}
                </span>
              </div>
            </div>

            {importEntryLines.length > 0 && (
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
                  title="Xóa tất cả các mặt hàng đã chọn?"
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
                    title={`Xóa tất cả (${importEntryLines.length})`}
                  />
                </Popconfirm>
              </div>
            )}
          </div>

          {/* Row 2: Search Product Input Full Width */}
          <div className="relative w-full">
            <Input
              prefix={<SearchOutlined className="text-slate-400 text-xs mr-1" />}
              placeholder="Tìm theo tên sản phẩm, mã SKU (F3)..."
              value={importSearchProduct}
              onChange={(e) => {
                setImportSearchProduct(e.target.value);
                setShowMobileSearchPopover(e.target.value.trim().length > 0);
              }}
              onFocus={() => {
                if (importSearchProduct.trim()) setShowMobileSearchPopover(true);
              }}
              allowClear
              className="h-9 text-xs rounded-lg bg-slate-50 border-slate-200 focus:bg-white"
            />

            {/* Mobile Dropdown Search Results Popover */}
            {showMobileSearchPopover && importSearchProduct.trim() !== '' && (
              <div
                className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl space-y-1"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-2 py-1 bg-slate-50 rounded-lg text-[11px] text-slate-500 font-medium">
                  <span>Kết quả ({filteredImportProducts.length})</span>
                  <button
                    type="button"
                    onClick={() => setShowMobileSearchPopover(false)}
                    className="text-slate-400 hover:text-slate-700 border-none bg-transparent cursor-pointer p-0 text-xs font-semibold"
                  >
                    ✕ Đóng
                  </button>
                </div>

                {filteredImportProducts.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-400 italic">
                    Không tìm thấy sản phẩm nào phù hợp
                  </div>
                ) : (
                  filteredImportProducts.map((p) => {
                    const pCode = p.code || p.id;
                    const alreadyLine = importEntryLines.find((l) => l.code === pCode || l.id === p.id);
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
                          <div className="text-xs font-mono font-bold text-[#784e34]">
                            {itemCostPrice.toLocaleString('vi-VN')} đ
                          </div>
                          {alreadyLine && (
                            <span className="text-[10px] text-amber-700 bg-amber-100/80 px-1 rounded">
                              Đã có ({alreadyLine.quantity})
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

        {/* 2.2 Mobile Supplier & Warehouse Selector Card */}
        <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-2">
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
              value={importSupplier}
              onChange={(val) => setImportSupplier(val)}
              placeholder="Chọn nhà cung cấp (bắt buộc)..."
              status={!importSupplier ? 'warning' : undefined}
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

          {/* Kho lưu trữ */}
          <div>
            <label className="text-xs font-semibold text-slate-800 block mb-1">Kho tiếp nhận lưu trữ</label>
            <Select
              value={importWarehouse || availableBranchWarehouses[0]?.name || undefined}
              onChange={(val) => setImportWarehouse(val)}
              placeholder={availableBranchWarehouses.length === 0 ? 'Chưa có kho' : 'Chọn kho...'}
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

          {/* Collapsible toggle for extra details (VAT invoice, Inspector, Notes) */}
          <button
            type="button"
            onClick={() => setShowExtraDetails(!showExtraDetails)}
            className="flex items-center justify-between w-full pt-1.5 border-t border-slate-100 text-[11px] text-slate-500 font-medium bg-transparent border-none cursor-pointer p-0 hover:text-slate-800"
          >
            <span className="flex items-center gap-1.5">
              <span>{showExtraDetails ? 'Thu gọn thông tin phụ' : 'Thêm số HĐ, KCS, Ghi chú...'}</span>
              {(importInvoiceNumber || importNote) && !showExtraDetails && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#784e34]" title="Đã có ghi chú / hóa đơn" />
              )}
            </span>
            {showExtraDetails ? <UpOutlined className="text-[10px]" /> : <DownOutlined className="text-[10px]" />}
          </button>

          {showExtraDetails && (
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">Số hóa đơn VAT</label>
                  <Input
                    value={importInvoiceNumber}
                    onChange={(e) => setImportInvoiceNumber(e.target.value)}
                    placeholder="VD: HD-089"
                    className="h-7 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">Người KCS</label>
                  <Input
                    value={importInspector}
                    onChange={(e) => setImportInspector(e.target.value)}
                    placeholder="VD: Văn Nam"
                    className="h-7 text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">Ghi chú / Vị trí kho</label>
                <Input.TextArea
                  value={importNote}
                  onChange={(e) => setImportNote(e.target.value)}
                  placeholder="VD: Kệ B2 - Showroom..."
                  rows={2}
                  className="text-xs rounded-lg"
                />
              </div>
            </div>
          )}
        </div>

        {/* 2.3 Mobile Line Items List (Card-based, zero horizontal scrolling) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <span>Mặt hàng ({importEntryLines.length})</span>
              <span className="bg-[#784e34]/10 text-[#784e34] px-1.5 py-0.2 rounded font-mono text-[10.5px]">
                {totalQuantity} chiếc/bộ
              </span>
            </div>
            {importEntryLines.length > 0 && (
              <span className="text-xs font-mono font-bold text-[#784e34]">
                {totalGoods.toLocaleString('vi-VN')} đ
              </span>
            )}
          </div>

          {importEntryLines.length === 0 ? (
            <div className="p-4 text-center bg-white rounded-xl border border-dashed border-slate-200">
              <div className="text-slate-400 text-xs font-medium mb-0.5">Chưa có sản phẩm nào trong phiếu</div>
              <div className="text-[11px] text-slate-400">Gõ tên sản phẩm hoặc mã SKU ở ô tìm kiếm phía trên để thêm</div>
            </div>
          ) : (
            <div className="space-y-2">
              {importEntryLines.map((line) => (
                <div
                  key={line.id}
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

                  {/* Bottom: Unit Price Input, Stepper [-] [Q] [+], and Subtotal */}
                  <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-100 text-xs">
                    {/* Price Input */}
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10.5px] text-slate-400 font-medium">Giá:</span>
                      <InputNumber<number>
                        min={0}
                        value={line.unitPrice || undefined}
                        onChange={(val) => handleUpdateUnitPrice(line.id, val ? Number(val) : 0)}
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
                    <div className="text-right font-mono font-bold text-xs text-[#784e34] shrink-0">
                      {((Number(line.quantity) || 0) * (Number(line.unitPrice) || 0)).toLocaleString('vi-VN')} đ
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2.4 Mobile Financial Calculations Card */}
        <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-2 text-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-1.5 border-b border-slate-100 flex items-center justify-between">
            <span>Thanh toán & Công nợ</span>
            <span className="text-[11px] font-mono text-slate-400 font-normal">
              {importDate || new Date().toLocaleDateString('vi-VN')}
            </span>
          </div>

          {/* Tổng tiền hàng */}
          <div className="flex items-center justify-between">
            <span className="text-slate-600 font-medium">Tổng tiền hàng ({importEntryLines.length} món)</span>
            <span className="font-mono font-bold text-slate-900">{totalGoods.toLocaleString('vi-VN')} đ</span>
          </div>

          {/* Giảm giá */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-600 font-medium shrink-0">Giảm giá / Chiết khấu</span>
            <InputNumber<number>
              min={0}
              max={totalGoods > 0 ? totalGoods : undefined}
              placeholder="0"
              value={importDiscount || undefined}
              onChange={(val) => {
                const d = val ? Math.max(0, Number(val)) : 0;
                setImportDiscount(totalGoods > 0 ? Math.min(totalGoods, d) : d);
              }}
              formatter={(val) => (val !== undefined && val !== null ? `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '')}
              parser={(val) => (val ? Number(val.replace(/\./g, '').replace(/[^\d]/g, '')) : ('' as any))}
              controls={false}
              size="small"
              className="w-28 sm:w-36 h-7 text-xs font-mono text-right"
            />
          </div>

          {/* Cần trả NCC */}
          <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
            <span className="font-bold text-slate-900">Cần trả nhà cung cấp</span>
            <span className="font-mono font-bold text-[#784e34] text-sm">{payable.toLocaleString('vi-VN')} đ</span>
          </div>

          {/* Tiền trả NCC */}
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-slate-700 font-semibold text-[11px]">Đã trả NCC:</span>
              {!isUnpaid && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setImportPaidAmount(payable)}
                    className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded border border-emerald-200 cursor-pointer font-medium"
                    title="Trả đủ"
                  >
                    Đủ
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportPaidAmount(0)}
                    className="text-[10px] px-1.5 py-0.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded border border-rose-200 cursor-pointer font-medium"
                    title="Chưa trả (0 đ)"
                  >
                    0 đ
                  </button>
                </div>
              )}
            </div>
            <InputNumber<number>
              disabled={isUnpaid}
              placeholder={isUnpaid ? '0 đ (Ghi nợ)' : 'Nhập số tiền...'}
              value={isUnpaid ? 0 : importPaidAmount}
              min={0}
              max={payable > 0 ? payable : 0}
              formatter={(val) => (val !== undefined && val !== null ? `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '')}
              parser={(val) => (val ? Number(val.replace(/\./g, '').replace(/[^\d]/g, '')) : ('' as any))}
              onChange={(val) => {
                if (val === null || val === undefined) {
                  setImportPaidAmount(undefined);
                } else {
                  const num = Math.max(0, Number(val));
                  setImportPaidAmount(payable > 0 ? Math.min(payable, num) : num);
                }
              }}
              controls={false}
              size="small"
              className={`w-28 sm:w-36 h-7 text-xs font-mono font-bold text-right ${isUnpaid ? 'text-slate-400 italic' : 'text-emerald-700'}`}
            />
          </div>

          {/* Còn nợ NCC */}
          <div className="flex items-center justify-between">
            <span className="text-slate-600 font-medium">Tính vào công nợ NCC</span>
            <span className={`font-mono font-bold ${debt > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
              {debt > 0 ? `${debt.toLocaleString('vi-VN')} đ` : '0 đ'}
            </span>
          </div>

          {/* Hình thức thanh toán */}
          <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-2">
            <label className="text-[11px] font-semibold text-slate-600 shrink-0">Hình thức TT:</label>
            <Select
              value={importPaymentMethod}
              onChange={(m) => {
                setImportPaymentMethod(m);
                if (m === 'Chưa thanh toán') {
                  setImportPaidAmount(0);
                } else if (importPaidAmount === 0 || importPaidAmount === undefined) {
                  setImportPaidAmount(payable);
                }
              }}
              size="small"
              className="w-48 text-xs"
              options={[
                { value: 'Chuyển khoản', label: 'Chuyển khoản / QR' },
                { value: 'Tiền mặt', label: 'Tiền mặt' },
                { value: 'Chưa thanh toán', label: 'Chưa thanh toán (Ghi nợ)' },
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
              className="h-10 text-xs font-bold rounded-xl !bg-[#784e34] !border-[#784e34] hover:!bg-[#633f2a] text-white shadow-xs"
            >
              {isEditing ? '✓ Cập nhật kho' : '✓ Nhập hàng vào kho'}
            </Button>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="w-full text-center text-xs text-slate-500 hover:text-slate-700 py-1 bg-transparent border-none cursor-pointer"
          >
            ← Quay lại danh sách phiếu nhập
          </button>
        </div>
      </div>
    </>
  );
}
