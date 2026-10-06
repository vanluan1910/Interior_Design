'use client';

import React from 'react';
import { Table, Tag, Button, Popconfirm } from 'antd';
import type { TableProps, TablePaginationConfig } from 'antd';
import {
  CopyOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
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
  pagination,
  columns,
  dataSource,
  rowKey = 'id',
  rowSelection,
  onRow,
  className = '',
  scroll = { x: 'max-content' },
  ...restProps
}: AdminDataTableProps<T>) {
  const isSelectionToolbarActive = enableSelectionToolbar || Boolean(selectedRowKeys !== undefined && onSelectionChange);
  const selectedCount = selectedRowKeys ? selectedRowKeys.length : 0;
  const currentTotal = totalCount !== undefined ? totalCount : (Array.isArray(dataSource) ? dataSource.length : 0);

  const defaultPagination: TablePaginationConfig | false =
    pagination === false
      ? false
      : {
          pageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          showTotal: (total, range) => (
            <span className="text-xs text-slate-500 font-medium">
              Hiển thị {range[0]} – {range[1]} trong tổng số {total} {countUnit}
            </span>
          ),
          className: '!px-4 !py-2.5 !m-0 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between',
          ...(typeof pagination === 'object' ? pagination : {}),
        };

  const computedRowSelection = rowSelection || (isSelectionToolbarActive && onSelectionChange
    ? {
        selectedRowKeys: selectedRowKeys || [],
        onChange: (keys: React.Key[], selectedRows: T[]) => onSelectionChange(keys, selectedRows),
      }
    : undefined);

  const computedOnRow = (record: T, index?: number) => {
    const existing = onRow ? onRow(record, index) : {};
    if (isSelectionToolbarActive && onSelectionChange && selectedRowKeys) {
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
    <div className={`w-full min-w-0 max-w-full bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden flex flex-col ${className}`}>
      {/* 1. Branch-style Standard Selection & Action Toolbar */}
      {isSelectionToolbarActive && (
        <div className="shrink-0 flex flex-col gap-3 border-b border-slate-200 bg-white p-3.5 sm:p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-slate-900">
              {titleIcon && <span className="text-base shrink-0">{titleIcon}</span>}
              <h3 className="m-0 text-base sm:text-lg font-semibold text-slate-900">
                {titleText || 'Danh sách'}
              </h3>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                {currentTotal} {countUnit}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-start sm:justify-end gap-1.5 sm:gap-2 w-full sm:w-auto">
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
                  className="!h-8 px-3 sm:px-4 !bg-[#784e34] hover:!bg-[#5d371f] text-white border-none font-bold text-xs rounded-lg shadow-xs inline-flex items-center justify-center gap-1.5 ml-auto sm:ml-0"
                >
                  {createButtonText}
                </Button>
              )}
            </div>
          </div>

          {/* Quick Search Bar */}
          {onSearchChange && (
            <div className="w-full sm:w-80">
              <AdminSearchInput
                placeholder={searchPlaceholder}
                value={searchValue || ''}
                onChange={onSearchChange}
                sizeVariant="sm"
              />
            </div>
          )}
        </div>
      )}

      {/* 2. Classic Header Bar (optional fallback if selection toolbar not active) */}
      {!isSelectionToolbarActive && !hideHeader && (titleText || extraHeaderActions) && (
        <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-white">
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

      {/* 3. Table Body */}
      <div className="w-full max-w-full overflow-x-auto flex-1 min-h-0">
        <Table<T>
          dataSource={dataSource}
          columns={columns}
          rowKey={rowKey}
          pagination={defaultPagination}
          rowSelection={computedRowSelection}
          onRow={computedOnRow}
          scroll={scroll}
          size="small"
          className="w-full [&_.ant-table-thead>tr>th]:!bg-white [&_.ant-table-thead>tr>th]:!font-semibold [&_.ant-table-thead>tr>th]:!text-slate-800 [&_.ant-table-thead>tr>th]:!py-2.5 [&_.ant-table-tbody>tr>td]:!py-2.5 [&_.ant-table-row-selected>td]:!bg-amber-50/40"
          {...restProps}
        />
      </div>
    </div>
  );
}

export default AdminDataTable;

