'use client';

import React from 'react';
import { Button, Input, Select, InputNumber, Popconfirm, App } from 'antd';
import { FileExcelOutlined, DeleteOutlined } from '@ant-design/icons';
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

const { Option } = Select;

const COMMON_UOM_OPTIONS = [
  { value: 'Bộ', label: 'Bộ' },
  { value: 'Chiếc', label: 'Chiếc' },
  { value: 'Cái', label: 'Cái' },
  { value: 'Tấm', label: 'Tấm' },
  { value: 'Thanh', label: 'Thanh' },
  { value: 'm3', label: 'm³ (Khối)' },
  { value: 'm2', label: 'm²' },
  { value: 'md', label: 'md (Mét dài)' },
  { value: 'kg', label: 'kg' },
  { value: 'Hộp', label: 'Hộp' },
  { value: 'Gói', label: 'Gói' },
];

const formatInputMoney = (value: number | string | undefined): string => {
  if (value === undefined || value === null || value === '') return '';
  const numStr = String(value).replace(/\D/g, '');
  if (!numStr) return '';
  return Number(numStr).toLocaleString('vi-VN');
};

const parseInputMoney = (displayValue: string | undefined): number => {
  if (!displayValue) return 0;
  const cleanStr = String(displayValue).replace(/\./g, '').replace(/\D/g, '');
  return cleanStr ? Number(cleanStr) : 0;
};

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

  const allSearchableProducts = React.useMemo(() => {
    const map = new Map<string, import('@/types/admin').FeaturedCatalogProduct>();

    // 1. Catalog products
    (allProducts || []).forEach((p) => {
      const key = p.code || p.id;
      if (key) map.set(key, p);
    });

    // 2. Import slip items
    (importsList || []).forEach((imp) => {
      const key = imp.code || imp.id;
      if (key && !map.has(key)) {
        map.set(key, {
          id: imp.id,
          code: imp.code,
          name: imp.itemName || `Phiếu nhập ${imp.code}`,
          price: imp.totalValue || imp.unitPrice || 0,
          originalPrice: imp.unitPrice || imp.totalValue || 0,
          costPrice: imp.unitPrice || imp.totalValue || 0,
          collection: imp.warehouseName || 'Kho chính',
          categoryName: `NCC: ${imp.supplier}`,
          stockNote: `${imp.quantity || 1} ${imp.unit || 'bộ'}`,
          stockType: 'in_stock',
          image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=120&q=80',
          description: imp.spec || '',
        });
      }
    });

    return Array.from(map.values());
  }, [allProducts, importsList]);

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

    // Check if matched from an import slip to auto-set source/supplier/warehouse
    const matchedImport = importsList.find((imp) => imp.code === pCode || imp.id === product.id);
    if (matchedImport) {
      if (!returnSourceCode) setReturnSourceCode(matchedImport.code);
      if (!returnSupplier) setReturnSupplier(matchedImport.supplier);
      if (!returnWarehouse) setReturnWarehouse(matchedImport.warehouseName);
    }

    if (!alreadyLine) {
      const defaultUnit = (product as any).unit || (product as any).uom || 'Bộ';
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

  return (
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
                  onConfirm={() => {
                    setReturnEntryLines([]);
                    message.info('Đã xóa danh sách mặt hàng trả!');
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
          creatorName={returnStaffName || user?.name || 'Nguyễn Văn Nam (KCS)'}
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
                  message.success(`Đã tự động điền thông tin từ phiếu nhập ${matched.code}`);
                }
              }}
              placeholder="Chọn phiếu nhập gốc để trả hàng..."
              className="w-full h-9 text-xs"
              allowClear
            >
              {importsList.filter((i) => isMatchGlobalBranch(i.warehouseName)).map((i) => (
                <Option key={i.id} value={i.code}>
                  <span className="font-mono">{i.code}</span> - {i.itemName} ({i.supplier})
                </Option>
              ))}
            </Select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-800">Nhà cung cấp nhận hàng</label>
              {onOpenCreateSupplier && (
                <button
                  type="button"
                  onClick={onOpenCreateSupplier}
                  className="text-[11px] font-medium text-rose-700 hover:underline bg-transparent border-none cursor-pointer"
                >
                  + Thêm NCC
                </button>
              )}
            </div>
            <Select
              value={returnSupplier}
              onChange={(val) => setReturnSupplier(val)}
              placeholder="Chọn nhà cung cấp..."
              className="w-full h-9 text-xs"
              showSearch
              optionFilterProp="children"
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
              value={returnWarehouse}
              onChange={(val) => setReturnWarehouse(val)}
              placeholder="Chọn kho xuất trả..."
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
              <label className="text-xs font-semibold text-slate-800 block mb-1">Lý do hoàn trả</label>
              <Select
                value={returnReason}
                onChange={(r) => setReturnReason(r)}
                className="w-full h-8 text-xs"
                options={[
                  { value: 'Lỗi quy cách / Kiểm định không đạt tiêu chuẩn', label: 'Lỗi quy cách / KCS' },
                  { value: 'Giao sai mẫu mã / vật tư', label: 'Sai mẫu mã' },
                  { value: 'Nứt vỡ / trầy xước trong vận chuyển', label: 'Hỏng do vận chuyển' },
                  { value: 'Hàng thừa sau khi nghiệm thu công trình', label: 'Hàng thừa hoàn lại' },
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
                  { value: 'Đã hoàn bù lô mới', label: 'Hoàn bù lô mới' },
                  { value: 'NCC đã hoàn lại tiền', label: 'NCC hoàn lại tiền' },
                  { value: 'Cấn trừ vào công nợ', label: 'Cấn trừ công nợ' },
                  { value: 'Đổi mặt hàng tương đương', label: 'Đổi hàng tương đương' },
                ]}
              />
            </div>
          </div>

          {/* Financial Calculations Box */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5 text-xs">
            {(() => {
              const totalGoods = returnEntryLines.reduce((sum, item) => sum + (item.total || (item.quantity * item.returnPrice)), 0);
              const refund = Math.max(0, totalGoods - (returnDiscount || 0));
              const paid = returnPaidAmount !== undefined ? Number(returnPaidAmount) : refund;
              const remaining = Math.max(0, refund - paid);

              return (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Tổng tiền hàng ({returnEntryLines.length} món)</span>
                    <span className="font-mono font-bold text-slate-900">{totalGoods.toLocaleString('vi-VN')} đ</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-600 font-medium shrink-0">Giảm giá / Phí hoàn hàng</span>
                    <InputNumber
                      min={0}
                      controls={false}
                      value={returnDiscount}
                      formatter={formatInputMoney}
                      parser={parseInputMoney}
                      onChange={(val) => setReturnDiscount(val !== null && val !== undefined ? Number(String(val).replace(/\./g, '')) || 0 : 0)}
                      style={{ width: 190, minWidth: 180 }}
                      className="w-48 sm:w-52 min-w-[180px] h-8 text-xs font-mono [&_.ant-input-number-input]:text-right [&_.ant-input-number-input]:px-2.5 !border-0 !border-b !border-slate-300 hover:!border-slate-500 focus-within:!border-rose-600 !rounded-none !shadow-none !bg-transparent"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <span className="font-bold text-slate-900 text-xs">NCC cần hoàn lại</span>
                    <span className="font-mono font-bold text-rose-700 text-sm">{refund.toLocaleString('vi-VN')} đ</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-700 font-semibold shrink-0">Tiền NCC đã trả</span>
                    <InputNumber
                      min={0}
                      controls={false}
                      placeholder={refund ? formatInputMoney(refund) : '0'}
                      value={returnPaidAmount}
                      formatter={formatInputMoney}
                      parser={parseInputMoney}
                      onChange={(val) => setReturnPaidAmount(val !== null && val !== undefined ? Number(String(val).replace(/\./g, '')) || 0 : undefined)}
                      style={{ width: 190, minWidth: 180 }}
                      className="w-48 sm:w-52 min-w-[180px] h-8 text-xs font-mono font-bold text-emerald-700 [&_.ant-input-number-input]:text-right [&_.ant-input-number-input]:px-2.5 !border-0 !border-b !border-slate-300 hover:!border-slate-500 focus-within:!border-emerald-700 !rounded-none !shadow-none !bg-transparent"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Còn nợ hoàn tiền</span>
                    <span className={`font-mono font-bold ${remaining > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                      {remaining > 0 ? `${remaining.toLocaleString('vi-VN')} đ` : '0 đ'}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Hình thức hoàn tiền</label>
                    <Select
                      value={returnPaymentMethod}
                      onChange={(m) => setReturnPaymentMethod(m)}
                      className="w-full h-8 text-xs"
                      options={[
                        { value: 'Chuyển khoản', label: 'Chuyển khoản ngân hàng' },
                        { value: 'Tiền mặt', label: 'Tiền mặt' },
                        { value: 'Cấn trừ công nợ', label: 'Cấn trừ vào công nợ tiếp theo' },
                      ]}
                    />
                  </div>
                </>
              );
            })()}
          </div>

          {/* Note */}
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
        totalQuantity={returnEntryLines.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)}
        emptyIcon="🔄"
        emptyTitle="Chưa có sản phẩm nào trong phiếu trả hàng"
        emptyDescription="Chọn phiếu nhập gốc hoặc tìm kiếm mặt hàng ở thanh tìm kiếm phía trên để lập phiếu xuất trả."
        footerTotalText="Tổng giá trị hoàn trả"
        footerTotalValue={`${returnEntryLines.reduce((sum, item) => sum + (item.total || (item.quantity * item.returnPrice)), 0).toLocaleString('vi-VN')} đ`}
      >
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-[860px] w-full text-xs">
            <colgroup>
              <col style={{ width: 44 }} />
              <col style={{ width: 110 }} />
              <col style={{ minWidth: 160 }} />
              <col style={{ width: 100 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 220 }} />
              <col style={{ width: 160 }} />
              <col style={{ width: 48 }} />
            </colgroup>
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-3 py-2.5 text-center w-10">STT</th>
                <th className="px-3 py-2.5 text-left w-28">Mã hàng</th>
                <th className="px-3 py-2.5 text-left min-w-[140px]">Tên sản phẩm</th>
                <th className="px-3 py-2.5 text-center w-28">ĐVT</th>
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
                  <td className="px-3 py-2 text-center">
                    <Select
                      size="small"
                      value={line.unit || 'Bộ'}
                      onChange={(u) => {
                        setReturnEntryLines((prev) =>
                          prev.map((l) => (l.id === line.id ? { ...l, unit: u } : l))
                        );
                      }}
                      popupMatchSelectWidth={false}
                      classNames={{ popup: { root: 'min-w-[120px]' } }}
                      className="w-full min-w-[85px] text-xs [&_.ant-select-selector]:!h-8 [&_.ant-select-selector]:!px-2 [&_.ant-select-selection-item]:!text-xs [&_.ant-select-selection-item]:!leading-[30px] [&_.ant-select-selector]:!border-0 [&_.ant-select-selector]:!border-b [&_.ant-select-selector]:!border-slate-300 [&_.ant-select-selector]:!rounded-none [&_.ant-select-selector]:!shadow-none [&_.ant-select-selector]:!bg-transparent hover:[&_.ant-select-selector]:!border-slate-500"
                      options={COMMON_UOM_OPTIONS}
                    />
                  </td>
                  <td className="px-3 py-2 text-right w-28 min-w-[90px]">
                    <InputNumber<number>
                      min={1}
                      controls={false}
                      value={line.quantity}
                      onChange={(q) => {
                        const numQ = q !== null && q !== undefined ? Number(q) || 1 : 1;
                        setReturnEntryLines((prev) =>
                          prev.map((l) =>
                            l.id === line.id
                              ? { ...l, quantity: numQ, total: numQ * l.returnPrice }
                              : l
                          )
                        );
                      }}
                      style={{ width: '100%', minWidth: 80 }}
                      className="w-full min-w-[80px] h-8 text-xs font-mono font-bold [&_.ant-input-number-input]:!text-right [&_.ant-input-number-input]:!px-2 [&_.ant-input-number-handler-wrap]:!hidden !border-0 !border-b !border-slate-300 hover:!border-slate-500 focus-within:!border-rose-600 !rounded-none !shadow-none !bg-transparent"
                    />
                  </td>
                  <td className="px-3 py-2 text-right w-56 min-w-[200px]">
                    <InputNumber<number>
                      min={0}
                      controls={false}
                      value={line.returnPrice}
                      formatter={formatInputMoney}
                      parser={parseInputMoney}
                      onChange={(p) => {
                        const numP = p !== null && p !== undefined ? Number(String(p).replace(/\./g, '')) || 0 : 0;
                        setReturnEntryLines((prev) =>
                          prev.map((l) =>
                            l.id === line.id
                              ? { ...l, returnPrice: numP, total: line.quantity * numP }
                              : l
                          )
                        );
                      }}
                      style={{ width: '100%', minWidth: 180 }}
                      className="w-full min-w-[180px] h-8 text-xs font-mono font-bold [&_.ant-input-number-input]:!text-right [&_.ant-input-number-input]:!px-2.5 [&_.ant-input-number-handler-wrap]:!hidden !border-0 !border-b !border-slate-300 hover:!border-slate-500 focus-within:!border-rose-600 !rounded-none !shadow-none !bg-transparent"
                    />
                  </td>
                  <td className="px-3 py-2 text-right w-44 min-w-[160px] font-mono font-bold text-rose-700 whitespace-nowrap">
                    {(line.total || line.quantity * line.returnPrice).toLocaleString('vi-VN')} đ
                  </td>
                  <td className="px-3 py-2 text-center">
                    <Button
                      size="small"
                      type="text"
                      danger
                      icon={<DeleteOutlined className="text-slate-400 hover:text-red-600" />}
                      onClick={() => {
                        setReturnEntryLines((prev) => prev.filter((l) => l.id !== line.id));
                      }}
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
  );
}
