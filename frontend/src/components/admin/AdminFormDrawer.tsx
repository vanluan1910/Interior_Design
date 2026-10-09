'use client';

import React from 'react';
import { Drawer, Button, Space } from 'antd';
import type { FormInstance } from 'antd';
import { CheckOutlined } from '@ant-design/icons';

export interface AdminFormDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  isEditing?: boolean;
  editTitle?: React.ReactNode;
  createTitle?: React.ReactNode;
  recordId?: string | number;
  loading?: boolean;
  form?: FormInstance;
  onSubmit?: () => void;
  submitText?: string;
  cancelText?: string;
  size?: 'default' | 'large';
  width?: number | string;
  extraHeader?: React.ReactNode;
  extraFooter?: React.ReactNode;
  children: React.ReactNode;
  destroyOnHidden?: boolean;
  className?: string;
}

export const AdminFormDrawer: React.FC<AdminFormDrawerProps> = ({
  open,
  onClose,
  title,
  isEditing = false,
  editTitle,
  createTitle,
  recordId,
  loading = false,
  form,
  onSubmit,
  submitText,
  cancelText = 'Hủy',
  size = 'default',
  width,
  extraHeader,
  extraFooter,
  children,
  destroyOnHidden = false,
  className = '',
}) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const displayTitle =
    title ||
    (isEditing
      ? editTitle || 'Chỉnh sửa'
      : createTitle || 'Thêm mới');

  const defaultSubmitText =
    submitText || (isEditing ? 'Lưu thay đổi' : 'Tạo mới');

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit();
    } else if (form) {
      form.submit();
    }
  };

  const computedWidth = width || (size === 'large' ? 760 : 580);

  if (!mounted) {
    return null;
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      forceRender
      destroyOnHidden={destroyOnHidden}
      className={`admin-form-drawer ${className}`}
      styles={{
        wrapper: { width: computedWidth, maxWidth: '100vw' },
        header: {
          padding: '14px 20px',
          borderBottom: '1px solid #f1ece7',
          backgroundColor: '#ffffff',
        },
        body: {
          padding: '20px',
          backgroundColor: '#faf8f5',
        },
        footer: {
          padding: '12px 20px',
          borderTop: '1px solid #f1ece7',
          backgroundColor: '#ffffff',
        },
      }}
      title={
        <div className="flex items-center gap-2">
          <span className="font-bold text-base text-slate-900 leading-snug">
            {displayTitle}
          </span>
          {isEditing && recordId && (
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-amber-50 text-[#784e34] border border-amber-200">
              #{recordId}
            </span>
          )}
        </div>
      }
      extra={extraHeader ? <Space size="small">{extraHeader}</Space> : undefined}
      footer={
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-xs text-slate-400 font-normal">
            {extraFooter || (
              <span>
                {isEditing
                  ? `Đang chỉnh sửa bản ghi ${recordId ? `(${recordId})` : ''}`
                  : 'Điền đầy đủ thông tin để tạo mới'}
              </span>
            )}
          </div>
          <Space size="small">
            <Button
              htmlType="button"
              onClick={onClose}
              className="!h-8 px-3.5 rounded-lg border-slate-300 bg-white text-slate-700 text-xs font-medium hover:text-slate-900"
            >
              Đóng
            </Button>
            <Button
              htmlType="button"
              type="primary"
              loading={loading}
              onClick={handleSubmit}
              icon={<CheckOutlined />}
              className="!h-8 px-4 !bg-[#784e34] hover:!bg-[#5d371f] text-white border-none font-bold text-xs rounded-lg shadow-xs inline-flex items-center justify-center gap-1.5"
            >
              {defaultSubmitText}
            </Button>
          </Space>
        </div>
      }
    >
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        {children}
      </div>
    </Drawer>
  );
};
