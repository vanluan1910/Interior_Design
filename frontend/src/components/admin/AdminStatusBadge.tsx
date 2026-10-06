'use client';

import React from 'react';

export type StatusPreset =
  | 'active'
  | 'inactive'
  | 'working'
  | 'resigned'
  | 'in_stock'
  | 'low'
  | 'custom'
  | 'processing'
  | 'completed'
  | 'cancelled'
  | 'delivering'
  | 'draft'
  | 'matched'
  | 'discrepancy'
  | 'pending';

export interface AdminStatusBadgeProps {
  status?: StatusPreset | string;
  label?: React.ReactNode;
  variant?: 'solid' | 'soft' | 'outline';
  dot?: boolean;
  className?: string;
}

const PRESET_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; dotColor: string }
> = {
  active: {
    label: 'Đang hoạt động',
    bg: 'bg-emerald-50 border-emerald-200/60',
    text: 'text-emerald-700',
    dotColor: 'bg-emerald-500',
  },
  inactive: {
    label: 'Tạm dừng',
    bg: 'bg-slate-100 border-slate-200/60',
    text: 'text-slate-600',
    dotColor: 'bg-slate-400',
  },
  working: {
    label: 'Đang làm việc',
    bg: 'bg-emerald-50 border-emerald-200/60',
    text: 'text-emerald-700',
    dotColor: 'bg-emerald-500',
  },
  resigned: {
    label: 'Đã nghỉ việc',
    bg: 'bg-rose-50 border-rose-200/60',
    text: 'text-rose-600',
    dotColor: 'bg-rose-500',
  },
  in_stock: {
    label: 'Còn hàng sẵn',
    bg: 'bg-emerald-50 border-emerald-200/60',
    text: 'text-emerald-700',
    dotColor: 'bg-emerald-500',
  },
  low: {
    label: 'Sắp hết hàng',
    bg: 'bg-rose-50 border-rose-200/60',
    text: 'text-rose-600',
    dotColor: 'bg-rose-500',
  },
  custom: {
    label: 'May đo theo đơn',
    bg: 'bg-amber-50 border-amber-200/70',
    text: 'text-[#784e34]',
    dotColor: 'bg-[#784e34]',
  },
  processing: {
    label: 'Đang gia công',
    bg: 'bg-blue-50 border-blue-200/60',
    text: 'text-blue-700',
    dotColor: 'bg-blue-500',
  },
  completed: {
    label: 'Đã hoàn thành',
    bg: 'bg-emerald-50 border-emerald-200/60',
    text: 'text-emerald-700',
    dotColor: 'bg-emerald-500',
  },
  delivering: {
    label: 'Đang vận chuyển',
    bg: 'bg-indigo-50 border-indigo-200/60',
    text: 'text-indigo-700',
    dotColor: 'bg-indigo-500',
  },
  cancelled: {
    label: 'Đã hủy',
    bg: 'bg-slate-100 border-slate-200/60',
    text: 'text-slate-500',
    dotColor: 'bg-slate-400',
  },
  draft: {
    label: 'Bản nháp',
    bg: 'bg-slate-100 border-slate-200/60',
    text: 'text-slate-600',
    dotColor: 'bg-slate-400',
  },
  matched: {
    label: 'Khớp 100%',
    bg: 'bg-emerald-50 border-emerald-200/60',
    text: 'text-emerald-700',
    dotColor: 'bg-emerald-500',
  },
  discrepancy: {
    label: 'Có chênh lệch',
    bg: 'bg-rose-50 border-rose-200/60',
    text: 'text-rose-600',
    dotColor: 'bg-rose-500',
  },
  pending: {
    label: 'Chờ kiểm tra',
    bg: 'bg-amber-50 border-amber-200/70',
    text: 'text-amber-700',
    dotColor: 'bg-amber-500',
  },
};

export const AdminStatusBadge: React.FC<AdminStatusBadgeProps> = ({
  status = 'active',
  label,
  dot = false,
  className = '',
}) => {
  const config = PRESET_CONFIG[status] || {
    label: typeof label === 'string' ? label : status,
    bg: 'bg-slate-100 border-slate-200/60',
    text: 'text-slate-700',
    dotColor: 'bg-slate-400',
  };

  const displayLabel = label ?? config.label;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap px-2.5 py-0.5 rounded-md text-xs font-medium border transition-colors ${config.bg} ${config.text} ${className}`.trim()}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dotColor}`}
        />
      )}
      <span>{displayLabel}</span>
    </span>
  );
};
