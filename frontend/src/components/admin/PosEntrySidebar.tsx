'use client';

import React from 'react';
import { Button, Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';

export interface PosEntrySidebarProps {
  creatorName: string;
  creatorRole?: string;
  createdDate?: string;
  avatarBg?: string;
  avatarIcon?: React.ReactNode;
  children: React.ReactNode;
  onCancel?: () => void;
  cancelText?: string;
  onSaveDraft?: () => void;
  saveDraftText?: string;
  onSubmit?: () => void;
  submitText?: string;
  submitButtonBg?: string;
  submitting?: boolean;
}

export function PosEntrySidebar({
  creatorName,
  creatorRole = 'Người lập phiếu / KCS',
  createdDate,
  avatarBg = 'bg-[#784e34]',
  avatarIcon,
  children,
  onCancel,
  cancelText = 'Bỏ qua (Giữ nháp)',
  onSaveDraft,
  saveDraftText = '📝 Lưu tạm',
  onSubmit,
  submitText = '✓ Hoàn thành',
  submitButtonBg = '!bg-[#784e34] hover:!bg-[#633f2a]',
  submitting = false,
}: PosEntrySidebarProps) {
  return (
    <div className="space-y-4">
      {/* Creator Info Box */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Avatar size="small" icon={avatarIcon || <UserOutlined />} className={avatarBg} />
          <div>
            <div className="text-xs font-bold text-slate-900">{creatorName}</div>
            <div className="text-[11px] text-slate-400">{creatorRole}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-mono font-medium text-slate-700">
            {createdDate || new Date().toLocaleDateString('vi-VN')}
          </div>
          <div className="text-[11px] text-slate-400">Thời gian tạo</div>
        </div>
      </div>

      {/* Main Form Fields and Calculations */}
      <div className="space-y-3">{children}</div>

      {/* Sticky Bottom Actions */}
      <div className="pt-3 border-t border-slate-200 space-y-2">
        {(onCancel || onSaveDraft) && (
          <div className="grid grid-cols-2 gap-2">
            {onCancel && (
              <Button
                onClick={onCancel}
                className="h-10 text-xs font-semibold rounded-lg text-slate-700 hover:!border-slate-400"
              >
                {cancelText}
              </Button>
            )}
            {onSaveDraft && (
              <Button
                onClick={onSaveDraft}
                className="h-10 text-xs font-bold rounded-lg border-amber-400 text-amber-800 bg-amber-50 hover:!bg-amber-100"
              >
                {saveDraftText}
              </Button>
            )}
          </div>
        )}
        {onSubmit && (
          <Button
            type="primary"
            onClick={onSubmit}
            loading={submitting}
            className={`w-full h-11 text-xs font-bold rounded-lg text-white border-none shadow-sm ${submitButtonBg}`}
          >
            {submitText}
          </Button>
        )}
      </div>
    </div>
  );
}
