'use client';

import React from 'react';
import { Drawer } from 'antd';
import { FilterOutlined } from '@ant-design/icons';

export interface AdminFilterDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  hasActiveFilters?: boolean;
  onResetFilters?: () => void;
  children: React.ReactNode;
  className?: string;
  zIndex?: number;
}

/**
 * Shared mobile filter drawer for Admin tabs.
 * Standardizes full-screen mobile layout (100vw), header, reset button,
 * and eliminates deprecated Ant Design Drawer props like `width`.
 */
export function AdminFilterDrawer({
  open,
  onClose,
  title = 'Bộ lọc dữ liệu',
  hasActiveFilters = false,
  onResetFilters,
  children,
  className = '',
  zIndex,
}: AdminFilterDrawerProps) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      placement="right"
      className={`admin-filter-drawer mobile-fullscreen-drawer ${className}`}
      zIndex={zIndex}
      styles={{
        wrapper: { width: '100vw', maxWidth: '100vw' },
        header: {
          padding: '14px 16px',
          borderBottom: '1px solid #f1ece7',
          backgroundColor: '#ffffff',
        },
        body: {
          padding: '16px',
          backgroundColor: '#ffffff',
          WebkitOverflowScrolling: 'touch',
        },
      }}
      title={
        <div className="flex items-center justify-between w-full pr-6">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
            <FilterOutlined className="text-[#784e34]" />
            <span>{title}</span>
          </div>
          {hasActiveFilters && onResetFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="text-xs text-[#784e34] hover:underline bg-transparent border-none font-medium cursor-pointer"
            >
              Xóa lọc
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-4">{children}</div>
    </Drawer>
  );
}

export default AdminFilterDrawer;
