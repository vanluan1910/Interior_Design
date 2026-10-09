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
  FeaturedCatalogProduct,
  AdminSupplier,
  AdminWarehouse,
  StockImportSlipItem,
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
}: StockImportCreateProps) {
  const { message } = App.useApp();
  return (
    <PosEntryLayout
      header={
        <PosEntryHeader
          title="Lập Phiếu Nhập Hàng"
          code={importCode || '#PN-2026-NEW'}
          codeColor="primary"
          onBack={onBack}
          backTooltip="Quay lại danh sách phiếu nhập (giữ nháp)"
          searchValue={importSearchProduct}
          onSearchChange={setImportSearchProduct}
          searchResults={filteredImportProducts}
          selectedItemCodes={importEntryLines.map((l) => l.code)}
          getItemQuantity={(code) => importEntryLines.find((l) => l.code === code)?.quantity || 0}
          onSelectProduct={(product) => {
            const alreadyLine = importEntryLines.find((l) => l.code === product.code || l.id === product.id);
            const itemCostPrice =
              product.originalPrice !== undefined
                ? product.originalPrice
                : product.costPrice !== undefined
                ? product.costPrice
                : product.price || 0;
            if (!alreadyLine) {
              const defaultUnit =
                product.name.toLowerCase().includes('sofa') || product.name.toLowerCase().includes('bàn')
                  ? 'Bộ'
                  : 'Chiếc';
              setImportEntryLines((prev) => [
                ...prev,
                {
                  id: `line_${Date.now()}_${product.id}`,
                  code: product.code,
                  name: product.name,
                  spec: product.collection || '',
                  unit: defaultUnit,
                  quantity: 1,
                  unitPrice: itemCostPrice,
                  discount: 0,
                  total: itemCostPrice,
                },
              ]);
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
          }}
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
                  onConfirm={() => {
                    setImportEntryLines([]);
                    message.info('Đã xóa danh sách mặt hàng!');
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
          creatorName={importInspector || user?.name || 'Nguyễn Văn Nam (KCS)'}
          createdDate={importDate || new Date().toLocaleDateString('vi-VN')}
          onCancel={onBack}
          onSaveDraft={onSaveDraft}
          onSubmit={onSubmit}
          submitText="✓ Nhập hàng vào kho"
          submitButtonBg="!bg-[#784e34] hover:!bg-[#633f2a]"
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-800">Nhà cung cấp đối tác</label>
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
              placeholder="Chọn nhà cung cấp..."
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
              value={importWarehouse}
              onChange={(val) => setImportWarehouse(val)}
              placeholder="Chọn kho tiếp nhận..."
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
            {(() => {
              const totalGoods = importEntryLines.reduce((sum, item) => sum + (item.total || (item.quantity * item.unitPrice)), 0);
              const payable = Math.max(0, totalGoods - (importDiscount || 0));
              const paid = importPaidAmount !== undefined ? Number(importPaidAmount) : payable;
              const debt = Math.max(0, payable - paid);

              return (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Tổng tiền hàng ({importEntryLines.length} món)</span>
                    <span className="font-mono font-bold text-slate-900">{totalGoods.toLocaleString('vi-VN')} đ</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-600 font-medium shrink-0">Giảm giá / Chiết khấu</span>
                    <InputNumber
                      min={0}
                      controls={false}
                      value={importDiscount}
                      formatter={formatInputMoney}
                      parser={parseInputMoney}
                      onChange={(val) => setImportDiscount(val !== null && val !== undefined ? Number(String(val).replace(/\./g, '')) || 0 : 0)}
                      style={{ width: 190, minWidth: 180 }}
                      className="w-48 sm:w-52 min-w-[180px] h-8 text-xs font-mono [&_.ant-input-number-input]:text-right [&_.ant-input-number-input]:px-2.5 !border-0 !border-b !border-slate-300 hover:!border-slate-500 focus-within:!border-[#784e34] !rounded-none !shadow-none !bg-transparent"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <span className="font-bold text-slate-900 text-xs">Cần trả nhà cung cấp</span>
                    <span className="font-mono font-bold text-[#784e34] text-sm">{payable.toLocaleString('vi-VN')} đ</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-700 font-semibold shrink-0">Tiền trả nhà cung cấp</span>
                    <InputNumber
                      min={0}
                      controls={false}
                      placeholder={payable ? formatInputMoney(payable) : '0'}
                      value={importPaidAmount}
                      formatter={formatInputMoney}
                      parser={parseInputMoney}
                      onChange={(val) => setImportPaidAmount(val !== null && val !== undefined ? Number(String(val).replace(/\./g, '')) || 0 : undefined)}
                      style={{ width: 190, minWidth: 180 }}
                      className="w-48 sm:w-52 min-w-[180px] h-8 text-xs font-mono font-bold text-emerald-700 [&_.ant-input-number-input]:text-right [&_.ant-input-number-input]:px-2.5 !border-0 !border-b !border-slate-300 hover:!border-slate-500 focus-within:!border-emerald-700 !rounded-none !shadow-none !bg-transparent"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Tính vào công nợ NCC</span>
                    <span className={`font-mono font-bold ${debt > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                      {debt > 0 ? `-${debt.toLocaleString('vi-VN')} đ` : '0 đ'}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Hình thức thanh toán</label>
                    <Select
                      value={importPaymentMethod}
                      onChange={(m) => setImportPaymentMethod(m)}
                      className="w-full h-8 text-xs"
                      options={[
                        { value: 'Chuyển khoản', label: 'Chuyển khoản MBBank / QR' },
                        { value: 'Tiền mặt', label: 'Tiền mặt' },
                        { value: 'Chưa thanh toán', label: 'Chưa thanh toán (Ghi nợ NCC)' },
                      ]}
                    />
                  </div>
                </>
              );
            })()}
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
        totalQuantity={importEntryLines.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)}
        emptyTitle="Chưa có sản phẩm nào trong phiếu nhập"
        emptyDescription="Tìm kiếm hàng hóa theo mã SKU hoặc tên sản phẩm ở ô tìm kiếm phía trên (F3) để thêm vào phiếu nhập."
        footerTotalValue={`${importEntryLines.reduce((sum, item) => sum + (item.total || (item.quantity * item.unitPrice)), 0).toLocaleString('vi-VN')} đ`}
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
                  <td className="px-3 py-2 text-center">
                    <Select
                      size="small"
                      value={line.unit || 'Bộ'}
                      onChange={(u) => {
                        setImportEntryLines((prev) =>
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
                        setImportEntryLines((prev) =>
                          prev.map((l) =>
                            l.id === line.id
                              ? { ...l, quantity: numQ, total: numQ * l.unitPrice }
                              : l
                          )
                        );
                      }}
                      style={{ width: '100%', minWidth: 80 }}
                      className="w-full min-w-[80px] h-8 text-xs font-mono font-bold [&_.ant-input-number-input]:!text-right [&_.ant-input-number-input]:!px-2 [&_.ant-input-number-handler-wrap]:!hidden !border-0 !border-b !border-slate-300 hover:!border-slate-500 focus-within:!border-[#784e34] !rounded-none !shadow-none !bg-transparent"
                    />
                  </td>
                  <td className="px-3 py-2 text-right w-56 min-w-[200px]">
                    <InputNumber<number>
                      min={0}
                      controls={false}
                      value={line.unitPrice}
                      formatter={formatInputMoney}
                      parser={parseInputMoney}
                      onChange={(p) => {
                        const numP = p !== null && p !== undefined ? Number(String(p).replace(/\./g, '')) || 0 : 0;
                        setImportEntryLines((prev) =>
                          prev.map((l) =>
                            l.id === line.id
                              ? { ...l, unitPrice: numP, total: line.quantity * numP }
                              : l
                          )
                        );
                      }}
                      style={{ width: '100%', minWidth: 180 }}
                      className="w-full min-w-[180px] h-8 text-xs font-mono font-bold [&_.ant-input-number-input]:!text-right [&_.ant-input-number-input]:!px-2.5 [&_.ant-input-number-handler-wrap]:!hidden !border-0 !border-b !border-slate-300 hover:!border-slate-500 focus-within:!border-[#784e34] !rounded-none !shadow-none !bg-transparent"
                    />
                  </td>
                  <td className="px-3 py-2 text-right w-44 min-w-[160px] font-mono font-bold text-[#784e34] whitespace-nowrap">
                    {(line.total || line.quantity * line.unitPrice).toLocaleString('vi-VN')} đ
                  </td>
                  <td className="px-3 py-2 text-center">
                    <Button
                      size="small"
                      type="text"
                      danger
                      icon={<DeleteOutlined className="text-slate-400 hover:text-red-600" />}
                      onClick={() => {
                        setImportEntryLines((prev) => prev.filter((l) => l.id !== line.id));
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
