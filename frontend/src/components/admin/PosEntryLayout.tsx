'use client';

import React from 'react';

export interface PosEntryLayoutProps {
  header: React.ReactNode;
  children: React.ReactNode;
  sidebar: React.ReactNode;
  leftSpanClass?: string;
  rightSpanClass?: string;
}

export function PosEntryLayout({
  header,
  children,
  sidebar,
  leftSpanClass = 'lg:col-span-8',
  rightSpanClass = 'lg:col-span-4',
}: PosEntryLayoutProps) {
  return (
    <div className="space-y-4">
      {/* 1. Header Top Bar */}
      {header}

      {/* 2. 2-Column Responsive Domaco POS Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Line Items Table */}
        <div className={`${leftSpanClass} bg-white p-4 rounded-none shadow-xs border border-slate-200 space-y-4`}>
          {children}
        </div>

        {/* Right Column: Metadata & Financial Form Sidebar */}
        <div className={`${rightSpanClass} bg-white p-4 rounded-none shadow-xs border border-slate-200 space-y-4`}>
          {sidebar}
        </div>
      </div>
    </div>
  );
}
