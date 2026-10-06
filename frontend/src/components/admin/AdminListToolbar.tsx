'use client';

import React from 'react';
import { Button, Segmented } from 'antd';
import {
  ReloadOutlined,
  DownloadOutlined,
  PlusOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { AdminSearchInput } from './AdminSearchInput';

export interface AdminListToolbarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  onRefresh?: () => void;
  onExport?: () => void;
  createButtonText?: string;
  onCreate?: () => void;
  viewMode?: 'list' | 'grid' | 'table';
  onViewModeChange?: (val: any) => void;
  showViewModeToggle?: boolean;
  extraActions?: React.ReactNode;
  className?: string;
}

export function AdminListToolbar({
  searchPlaceholder = 'Tìm kiếm dữ liệu...',
  searchValue = '',
  onSearchChange,
  onRefresh,
  onExport,
  createButtonText,
  onCreate,
  viewMode = 'list',
  onViewModeChange,
  showViewModeToggle = false,
  extraActions,
  className = '',
}: AdminListToolbarProps) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-none shadow-xs border border-slate-200/80 ${className}`}
    >
      {/* Search Input Box */}
      <div className="flex flex-1 items-center gap-2.5 min-w-[280px] max-w-xl">
        <AdminSearchInput
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={onSearchChange}
        />
      </div>

      {/* Actions Toolbar */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {onRefresh && (
          <Button
            icon={<ReloadOutlined />}
            onClick={onRefresh}
            className="h-10 rounded-none text-sm font-normal text-slate-700 hover:text-[#784e34]"
          >
            Làm mới
          </Button>
        )}

        {onExport && (
          <Button
            icon={<DownloadOutlined />}
            onClick={onExport}
            className="h-10 rounded-none text-sm font-normal text-slate-700 hover:text-[#784e34]"
          >
            Xuất Excel
          </Button>
        )}

        {showViewModeToggle && onViewModeChange && (
          <Segmented
            value={viewMode}
            onChange={onViewModeChange}
            options={[
              { value: 'list', icon: <UnorderedListOutlined /> },
              { value: 'grid', icon: <AppstoreOutlined /> },
            ]}
            className="bg-slate-100 p-1 rounded-none"
          />
        )}

        {extraActions}

        {createButtonText && onCreate && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onCreate}
            className="h-10 rounded-none bg-[#784e34] hover:!bg-[#5d371f] px-4 text-sm font-medium text-white shadow-none border-none flex items-center"
          >
            {createButtonText}
          </Button>
        )}
      </div>
    </div>
  );
}

export default AdminListToolbar;
