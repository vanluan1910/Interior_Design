'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Table, Tag, Button, Popconfirm, Pagination } from 'antd';
import type { TableProps, TablePaginationConfig } from 'antd';
import {
  CopyOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { AdminSearchInput } from './AdminSearchInput';

export interface AdminDataTableProps<T = any> extends TableProps<T> {
  titleText?: React.ReactNode;
  titleIcon?: React.ReactNode;
  countTag?: React.ReactNode;
  subtitle?: React.ReactNode;
  extraHeaderActions?: React.ReactNode;
  hideHeader?: boolean;

  // Selection & Action Toolbar Props (Standardized across Admin tabs like Branch screen)
  enableSelectionToolbar?: boolean;
  selectedRowKeys?: React.Key[];
  onSelectionChange?: (keys: React.Key[], selectedRows?: T[]) => void;
  onCopySelected?: () => void;
  onEditSelected?: () => void;
  onDeleteSelected?: () => void;
  deleteConfirmTitle?: string;
  onCreateNew?: () => void;
  createButtonText?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  totalCount?: number;
  countUnit?: string;
  selectOnRowClick?: boolean;
  renderMobileCard?: (record: T, index: number) => React.ReactNode;
}

export function AdminDataTable<T extends object = any>({
  titleText,
  titleIcon,
  countTag,
  subtitle,
  extraHeaderActions,
  hideHeader = true,
  enableSelectionToolbar = false,
  selectedRowKeys,
  onSelectionChange,
  onCopySelected,
  onEditSelected,
  onDeleteSelected,
  deleteConfirmTitle = 'Xóa các mục đã chọn?',
  onCreateNew,
  createButtonText = 'Thêm mới',
  searchPlaceholder = 'Tìm kiếm...',
  searchValue,
  onSearchChange,
  totalCount,
  countUnit = 'bản ghi',
  selectOnRowClick = false,
  renderMobileCard,
  pagination,
  columns,
  dataSource,
  rowKey = 'id',
  rowSelection,
  onRow,
  className = '',
  scroll = { x: 'max-content' },
  sticky = { offsetHeader: 80 },
  ...restProps
}: AdminDataTableProps<T>) {
  const isSelectionToolbarActive = enableSelectionToolbar || Boolean(selectedRowKeys !== undefined && onSelectionChange);
  const selectedCount = selectedRowKeys ? selectedRowKeys.length : 0;
  const currentTotal = totalCount !== undefined ? totalCount : (Array.isArray(dataSource) ? dataSource.length : 0);

  // Domaco POS Pagination State Management
  const isExternalPagination = typeof pagination === 'object' && pagination !== null;
  const externalCurrent = isExternalPagination ? pagination.current : undefined;
  const externalPageSize = isExternalPagination ? pagination.pageSize : undefined;

  const [currentPage, setCurrentPage] = useState(externalCurrent || 1);
  const [pageSize, setPageSize] = useState(externalPageSize || 10);

  useEffect(() => {
    if (isExternalPagination) {
      if (externalCurrent && externalCurrent !== currentPage) setCurrentPage(externalCurrent);
      if (externalPageSize && externalPageSize !== pageSize) setPageSize(externalPageSize);
    }
  }, [externalCurrent, externalPageSize, isExternalPagination, currentPage, pageSize]);

  const paginatedData = useMemo(() => {
    if (pagination === false) return dataSource;
    if (!Array.isArray(dataSource)) return dataSource;
    if (isExternalPagination && typeof pagination?.onChange === 'function') {
      return dataSource;
    }
    const startIndex = (currentPage - 1) * pageSize;
    return dataSource.slice(startIndex, startIndex + pageSize);
  }, [dataSource, currentPage, pageSize, pagination, isExternalPagination]);

  const computedRowSelection = rowSelection || (isSelectionToolbarActive && onSelectionChange
    ? {
      selectedRowKeys: selectedRowKeys || [],
      onChange: (keys: React.Key[], selectedRows: T[]) => onSelectionChange(keys, selectedRows),
    }
    : undefined);

  const computedOnRow = (record: T, index?: number) => {
    const existing = onRow ? onRow(record, index) : {};
    if (selectOnRowClick && isSelectionToolbarActive && onSelectionChange && selectedRowKeys) {
      const recKey = typeof rowKey === 'function' ? rowKey(record) : (record as any)[rowKey as string] || (record as any).id;
      return {
        ...existing,
        onClick: (e: React.MouseEvent<HTMLElement>) => {
          if (existing.onClick) existing.onClick(e);
          const target = e.target as HTMLElement;
          if (target && target.closest('button, a, input, [role="button"], .ant-dropdown, .ant-popover, .ant-table-selection-column')) {
            return;
          }
          if (recKey !== undefined) {
            const nextKeys = selectedRowKeys.includes(recKey)
              ? selectedRowKeys.filter((k) => k !== recKey)
              : [...selectedRowKeys, recKey];
            onSelectionChange(nextKeys);
          }
        },
      };
    }
    return existing;
  };

  return (
    <div className={`w-full min-w-0 max-w-full overflow-x-hidden bg-white rounded-xl shadow-xs border border-slate-200 flex flex-col ${className}`}>
      {/* 1. Branch-style Standard Selection & Action Toolbar */}
      {isSelectionToolbarActive && (
        <div className="shrink-0 flex flex-col gap-2.5 sm:gap-3 border-b border-slate-200 bg-white p-3 sm:p-4 rounded-t-xl">
          {/* Top Row: Title + Count + (Mobile: Create Button | Desktop: Actions Cluster) */}
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 text-slate-900 min-w-0">
              {titleIcon && <span className="text-base shrink-0">{titleIcon}</span>}
              <h3 className="m-0 text-base sm:text-lg font-semibold text-slate-900 truncate">
                {titleText || 'Danh sách'}
              </h3>
              <span className="rounded-full bg-slate-100 px-2 sm:px-2.5 py-0.5 text-xs font-semibold text-slate-600 shrink-0">
                {currentTotal} {countUnit}
              </span>
            </div>

            {/* Desktop Action Buttons Cluster (hidden on mobile, visible on sm+) */}
            <div className="hidden sm:flex items-center gap-1.5 sm:gap-2">
              {onCopySelected && (
                <Button
                  htmlType="button"
                  icon={<CopyOutlined />}
                  disabled={selectedCount !== 1}
                  onClick={onCopySelected}
                  className="!h-8 !w-8 !p-0 rounded-lg border-slate-300 bg-white text-slate-700 text-xs shadow-xs inline-flex items-center justify-center disabled:opacity-40 disabled:bg-slate-50"
                  title="Sao chép"
                />
              )}

              {onEditSelected && (
                <Button
                  htmlType="button"
                  icon={<EditOutlined />}
                  disabled={selectedCount !== 1}
                  onClick={onEditSelected}
                  className="!h-8 !w-8 !p-0 rounded-lg border-slate-300 bg-white text-slate-700 text-xs shadow-xs inline-flex items-center justify-center disabled:opacity-40 disabled:bg-slate-50"
                  title="Chỉnh sửa"
                />
              )}

              {onDeleteSelected && (
                <Popconfirm
                  title={deleteConfirmTitle}
                  disabled={!selectedCount}
                  onConfirm={onDeleteSelected}
                  okText="Xóa"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true }}
                >
                  <Button
                    htmlType="button"
                    icon={<DeleteOutlined />}
                    disabled={!selectedCount}
                    className="!h-8 !w-8 !p-0 rounded-lg border-slate-300 bg-white text-rose-600 text-xs shadow-xs inline-flex items-center justify-center hover:!border-rose-300 hover:!bg-rose-50 disabled:opacity-40 disabled:bg-slate-50"
                    title="Xóa đã chọn"
                  />
                </Popconfirm>
              )}

              {extraHeaderActions}

              {onCreateNew && (
                <Button
                  htmlType="button"
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={onCreateNew}
                  className="!h-8 px-3.5 !bg-[#784e34] hover:!bg-[#5d371f] text-white border-none font-bold text-xs rounded-lg shadow-xs inline-flex items-center justify-center gap-1.5"
                >
                  {createButtonText}
                </Button>
              )}
            </div>

            {/* Mobile Create Button (visible on mobile only, placed neatly beside title) */}
            {onCreateNew && (
              <Button
                htmlType="button"
                type="primary"
                icon={<PlusOutlined />}
                onClick={onCreateNew}
                className="sm:hidden !h-8 px-2.5 !bg-[#784e34] hover:!bg-[#5d371f] text-white border-none font-bold text-xs rounded-lg shadow-xs inline-flex items-center justify-center gap-1 shrink-0"
              >
                {createButtonText}
              </Button>
            )}
          </div>

          {/* Mobile Selection Action Bar (appears smoothly only when items are selected on mobile) */}
          {selectedCount > 0 && (
            <div className="sm:hidden flex items-center justify-between bg-[#fbf2ee] border border-[#d8c3af] px-3 py-1.5 rounded-lg text-xs">
              <span className="font-bold text-[#5d371f]">
                Đã chọn {selectedCount}
              </span>
              <div className="flex items-center gap-1.5">
                {onCopySelected && selectedCount === 1 && (
                  <Button
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={onCopySelected}
                    className="!h-7 px-2 rounded-md bg-white border-slate-300 text-slate-700 text-xs shadow-2xs inline-flex items-center gap-1"
                  >
                    Sao chép
                  </Button>
                )}
                {onEditSelected && selectedCount === 1 && (
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={onEditSelected}
                    className="!h-7 px-2 rounded-md bg-white border-slate-300 text-slate-700 text-xs shadow-2xs inline-flex items-center gap-1"
                  >
                    Sửa
                  </Button>
                )}
                {onDeleteSelected && (
                  <Popconfirm
                    title={deleteConfirmTitle}
                    onConfirm={onDeleteSelected}
                    okText="Xóa"
                    cancelText="Hủy"
                    okButtonProps={{ danger: true }}
                  >
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      className="!h-7 px-2 rounded-md bg-white text-xs shadow-2xs inline-flex items-center gap-1"
                    >
                      Xóa
                    </Button>
                  </Popconfirm>
                )}
              </div>
            </div>
          )}

          {/* Bottom Row: Search Bar (+ Mobile Extra Actions like Filter & Export) */}
          <div className="flex items-center gap-2 w-full">
            {onSearchChange && (
              <div className="flex-1 min-w-0 sm:w-80 sm:flex-none">
                <AdminSearchInput
                  placeholder={searchPlaceholder}
                  value={searchValue || ''}
                  onChange={onSearchChange}
                  sizeVariant="sm"
                />
              </div>
            )}
            {/* On mobile, render extraHeaderActions (Filter & Export) inline with search */}
            {extraHeaderActions && (
              <div className="sm:hidden flex items-center gap-1.5 shrink-0">
                {extraHeaderActions}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Classic Header Bar (optional fallback if selection toolbar not active) */}
      {!isSelectionToolbarActive && !hideHeader && (titleText || extraHeaderActions) && (
        <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-white rounded-t-xl">
          <div className="flex items-center gap-2 flex-wrap">
            {titleIcon && <span className="text-base shrink-0">{titleIcon}</span>}
            {titleText && (
              <span className="font-semibold text-sm text-slate-900 tracking-tight">
                {titleText}
              </span>
            )}
            {countTag && (
              <Tag color="default" className="font-mono text-xs font-semibold m-0 bg-slate-100 border-slate-200 text-slate-700 rounded-md">
                {countTag}
              </Tag>
            )}
            {subtitle && (
              <span className="text-xs text-slate-500 font-normal hidden sm:inline-block ml-1">
                • {subtitle}
              </span>
            )}
          </div>

          {extraHeaderActions && (
            <div className="flex items-center gap-2">{extraHeaderActions}</div>
          )}
        </div>
      )}

      {/* 3. Table / Mobile Cards Body */}
      {paginatedData && paginatedData.length === 0 ? (
        <div className="py-10 px-4 text-center bg-white">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-xl text-slate-400 mb-2">
            {titleIcon || <InboxOutlined />}
          </div>
          <div className="font-bold text-sm text-slate-700">Chưa có dữ liệu</div>
          <div className="text-xs text-slate-400 mt-0.5">Không tìm thấy bản ghi phù hợp</div>
          {onCreateNew && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={onCreateNew}
              className="mt-3 !bg-[#784e34] hover:!bg-[#5d371f] font-bold text-xs rounded-lg shadow-xs"
            >
              {createButtonText}
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile Card List (< md) - ZERO Horizontal Scroll */}
          <div className="block md:hidden divide-y divide-slate-100 p-3 space-y-3">
            {paginatedData?.map((record: any, idx: number) => {
              if (renderMobileCard) {
                return <React.Fragment key={idx}>{renderMobileCard(record, idx)}</React.Fragment>;
              }

              const key = typeof rowKey === 'function' ? rowKey(record) : (record[rowKey as string] || record.id || idx);
              const isSelected = selectedRowKeys?.includes(key);

              // Extract columns excluding selection or empty
              const visibleCols = (columns || []).filter(
                (col: any) => col.key !== 'selection' && col.dataIndex !== 'selection'
              );
              const primaryCol = visibleCols[0];
              const secondaryCol = visibleCols[1];
              const remainingCols = visibleCols.slice(2);

              return (
                <div
                  key={key}
                  onClick={(e) => {
                    if (selectOnRowClick && onSelectionChange && selectedRowKeys) {
                      const next = isSelected ? selectedRowKeys.filter((k) => k !== key) : [...selectedRowKeys, key];
                      onSelectionChange(next);
                    }
                    if (onRow) {
                      const rowProps = onRow(record, idx);
                      if (rowProps?.onClick) rowProps.onClick(e);
                    }
                  }}
                  className={`p-3.5 bg-white border rounded-xl space-y-2 transition-all cursor-pointer ${isSelected ? 'border-[#784e34] bg-[#784e34]/5 shadow-xs' : 'border-slate-200 shadow-2xs'
                    }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {computedRowSelection && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (onSelectionChange && selectedRowKeys) {
                              const next = e.target.checked
                                ? [...selectedRowKeys, key]
                                : selectedRowKeys.filter((k) => k !== key);
                              onSelectionChange(next);
                            }
                          }}
                          className="rounded text-[#784e34] focus:ring-[#784e34] shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        {primaryCol && (
                          <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                            {(primaryCol as any).render
                              ? (primaryCol as any).render(record[(primaryCol as any).dataIndex], record, idx)
                              : record[(primaryCol as any).dataIndex]}
                          </div>
                        )}
                        {secondaryCol && (
                          <div className="text-xs text-slate-600 truncate mt-0.5">
                            {(secondaryCol as any).render
                              ? (secondaryCol as any).render(record[(secondaryCol as any).dataIndex], record, idx)
                              : record[(secondaryCol as any).dataIndex]}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {remainingCols.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                      {remainingCols.map((col: any, cIdx: number) => {
                        const colTitle = typeof col.title === 'string' ? col.title : (col.key || col.dataIndex || '');
                        const colVal = col.render ? col.render(record[col.dataIndex], record, idx) : record[col.dataIndex];
                        if (colVal === undefined || colVal === null || colVal === '') return null;

                        return (
                          <div key={cIdx} className="flex items-center justify-between gap-2">
                            <span className="text-slate-400 text-[11px] shrink-0">{colTitle}:</span>
                            <span className="text-slate-700 font-medium text-right truncate">{colVal}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop Table Body (>= md) */}
          <div className="hidden md:block w-full max-w-full flex-1 min-h-0">
            <Table<T>
              dataSource={paginatedData}
              columns={columns}
              rowKey={rowKey}
              pagination={false}
              rowSelection={computedRowSelection}
              onRow={computedOnRow}
              scroll={scroll}
              sticky={sticky}
              size="small"
              className="w-full [&_.ant-table-thead>tr>th]:!bg-white [&_.ant-table-thead>tr>th]:!font-semibold [&_.ant-table-thead>tr>th]:!text-slate-800 [&_.ant-table-thead>tr>th]:!py-2.5 [&_.ant-table-tbody>tr>td]:!py-2.5 [&_.ant-table-row-selected>td]:!bg-amber-50/40"
              {...restProps}
            />
          </div>
        </>
      )}

      {/* 4. Domaco POS Standard ERP High-Density Pagination Footer */}
      {pagination !== false && (
        <div
          className="px-3 sm:px-4 py-2 border-t border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between shrink-0 gap-2 rounded-b-xl"
          data-table-guide="pagination"
        >
          {/* Total data summary */}
          <div className="text-slate-500 font-medium text-xs tracking-tight">
            {(() => {
              const total = (isExternalPagination && pagination?.total) || currentTotal;
              if (total > 0) {
                const start = (currentPage - 1) * pageSize + 1;
                const end = Math.min(currentPage * pageSize, total);
                return `Hiển thị ${start} - ${end} trong tổng số ${total} ${countUnit}`;
              }
              return 'Không có dữ liệu';
            })()}
          </div>

          <Pagination
            size="small"
            showSizeChanger={isExternalPagination && pagination?.showSizeChanger !== undefined ? pagination.showSizeChanger : (currentTotal > pageSize)}
            pageSizeOptions={isExternalPagination && pagination?.pageSizeOptions ? pagination.pageSizeOptions : ['10', '20', '50', '100']}
            showQuickJumper={isExternalPagination && pagination?.showQuickJumper !== undefined ? pagination.showQuickJumper : false}
            hideOnSinglePage={isExternalPagination && pagination?.hideOnSinglePage !== undefined ? pagination.hideOnSinglePage : false}
            current={currentPage}
            pageSize={pageSize}
            total={(isExternalPagination && pagination?.total) || currentTotal}
            onChange={(page, pSize) => {
              setCurrentPage(page);
              setPageSize(pSize);
              if (isExternalPagination && pagination?.onChange) {
                pagination.onChange(page, pSize);
              }
            }}
            className="m-0 text-xs [&_.ant-pagination-item]:!rounded-md [&_.ant-pagination-item-active]:!border-[#784e34] [&_.ant-pagination-item-active]:!bg-[#784e34] [&_.ant-pagination-item-active_a]:!text-white [&_.ant-select-selector]:!rounded-md [&_.ant-select-selector]:!text-xs [&_.ant-pagination-options-quick-jumper_input]:!rounded-md [&_.ant-pagination-options-quick-jumper_input]:!text-xs [&_.ant-pagination-options-quick-jumper_input:focus]:!border-[#784e34]"
          />
        </div>
      )}
    </div>
  );
}

export default AdminDataTable;

