'use client';

import React from 'react';

export interface SummaryItem {
  label: string;
  value: React.ReactNode;
  color?: 'default' | 'primary' | 'success' | 'danger' | 'warning' | 'amber';
  tooltip?: string;
}

export interface AdminSidebarSummaryProps {
  title?: string;
  items: SummaryItem[];
  footerNote?: React.ReactNode;
  className?: string;
}

const COLOR_MAP: Record<string, string> = {
  default: 'text-slate-900',
  primary: 'text-[#784e34]',
  success: 'text-emerald-700',
  danger: 'text-rose-600',
  warning: 'text-amber-600',
  amber: 'text-[#784e34]',
};

export const AdminSidebarSummary: React.FC<AdminSidebarSummaryProps> = ({
  title,
  items,
  footerNote,
  className = '',
}) => {
  return (
    <div
      className={`bg-slate-50 p-3 rounded-lg border border-slate-200/80 space-y-2 text-[11px] ${className}`.trim()}
    >
      {title && (
        <div className="font-medium text-slate-700 uppercase tracking-wide text-[10px] pb-1 border-b border-slate-200/60">
          {title}
        </div>
      )}

      <div className="space-y-1.5">
        {items.map((item, idx) => {
          const colorClass = COLOR_MAP[item.color || 'default'] || 'text-slate-900';
          return (
            <div
              key={idx}
              className="flex items-center justify-between gap-2 text-slate-600"
            >
              <span className="truncate">{item.label}:</span>
              <span className={`font-mono font-normal shrink-0 ${colorClass}`}>
                {item.value}
              </span>
            </div>
          );
        })}
      </div>

      {footerNote && (
        <div className="pt-1.5 border-t border-slate-200/60 text-[10.5px] text-slate-500">
          {footerNote}
        </div>
      )}
    </div>
  );
};
