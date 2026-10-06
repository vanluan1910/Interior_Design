'use client';

import React from 'react';
import { FilterOutlined } from '@ant-design/icons';

export interface AdminFilterSidebarProps {
  title?: string;
  hasActiveFilters?: boolean;
  onResetFilters?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function AdminFilterSidebar({
  title = 'Bộ lọc dữ liệu',
  hasActiveFilters = false,
  onResetFilters,
  children,
  className = '',
}: AdminFilterSidebarProps) {
  return (
    <aside
      className={`w-full lg:w-64 bg-white rounded-none shadow-xs border border-slate-200/80 p-4 shrink-0 space-y-4 text-sm text-slate-700 ${className}`}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
        <span className="font-semibold text-sm text-slate-900 flex items-center gap-1.5">
          <FilterOutlined className="text-[#784e34]" /> {title}
        </span>
        {hasActiveFilters && onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-xs font-medium text-[#784e34] hover:underline cursor-pointer border-none bg-transparent p-0"
          >
            Xóa lọc
          </button>
        )}
      </div>

      {/* Filter Options & Cards */}
      <div className="space-y-4">{children}</div>
    </aside>
  );
}

export default AdminFilterSidebar;
