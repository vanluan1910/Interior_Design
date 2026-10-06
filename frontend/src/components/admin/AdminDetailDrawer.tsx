'use client';

import React from 'react';
import { Drawer, Button, Popconfirm, Avatar, Segmented } from 'antd';
import {
  CloseOutlined,
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
} from '@ant-design/icons';

export interface DetailDrawerTab {
  key: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
}

export interface AdminDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  width?: number | string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  codeTag?: string;
  statusBadge?: React.ReactNode;
  avatar?: string;
  avatarText?: string;
  tabs?: DetailDrawerTab[];
  activeTab?: string;
  onTabChange?: (key: string) => void;
  children?: React.ReactNode;
  onEdit?: () => void;
  editText?: string;
  onDelete?: () => void;
  deleteText?: string;
  deleteConfirmTitle?: string;
  onStatusToggle?: () => void;
  statusToggleText?: string;
  statusToggleDanger?: boolean;
  extraFooter?: React.ReactNode;
}

export const AdminDetailDrawer: React.FC<AdminDetailDrawerProps> = ({
  open,
  onClose,
  width = 580,
  title,
  subtitle,
  codeTag,
  statusBadge,
  avatar,
  avatarText,
  tabs,
  activeTab,
  onTabChange,
  children,
  onEdit,
  editText = 'Chỉnh sửa',
  onDelete,
  deleteText = 'Xóa dữ liệu',
  deleteConfirmTitle = 'Bạn có chắc chắn muốn xóa mục này?',
  onStatusToggle,
  statusToggleText,
  statusToggleDanger = true,
  extraFooter,
}) => {
  const currentTabContent = tabs?.find((t) => t.key === activeTab)?.content;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      closable={false}
      styles={{
        wrapper: { width: width || 720, maxWidth: '100vw' },
        header: { display: 'none' },
        body: { padding: 0, backgroundColor: '#fcfbf9' },
        footer: { padding: '12px 16px', backgroundColor: '#ffffff', borderTop: '1px solid #f1ece7' },
      }}
      footer={
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            {onStatusToggle && statusToggleText && (
              <Button
                danger={statusToggleDanger}
                icon={<LockOutlined />}
                onClick={onStatusToggle}
                className="text-xs h-9"
              >
                {statusToggleText}
              </Button>
            )}
            {onDelete && (
              <Popconfirm
                title={deleteConfirmTitle}
                onConfirm={onDelete}
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
              >
                <Button danger icon={<DeleteOutlined />} className="text-xs h-9">
                  {deleteText}
                </Button>
              </Popconfirm>
            )}
            {extraFooter}
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={onClose} className="text-xs h-9">
              Đóng
            </Button>
            {onEdit && (
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={onEdit}
                className="text-xs h-9 bg-[#784e34] hover:!bg-[#5d371f] border-none shadow-none text-white font-medium"
              >
                {editText}
              </Button>
            )}
          </div>
        </div>
      }
    >
      {/* 1. Header Profile/Entity Card */}
      <div className="bg-white border-b border-slate-200/80 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            {avatar ? (
              <Avatar
                src={avatar}
                size={54}
                className="border-2 border-[#784e34]/30 shadow-xs shrink-0 rounded-xl"
              />
            ) : avatarText ? (
              <Avatar
                size={54}
                className="bg-[#784e34] text-white font-bold text-lg border-2 border-amber-200 shadow-xs shrink-0 rounded-xl"
              >
                {avatarText}
              </Avatar>
            ) : null}

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-slate-900 m-0">
                  {title}
                </h2>
                {codeTag && (
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                    {codeTag}
                  </span>
                )}
                {statusBadge}
              </div>
              {subtitle && (
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
                  {subtitle}
                </div>
              )}
            </div>
          </div>

          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100"
          />
        </div>

        {/* 2. Optional Tabs Navigation */}
        {tabs && tabs.length > 0 && onTabChange && (
          <div className="mt-4 pt-3 border-t border-slate-100">
            <Segmented
              value={activeTab}
              onChange={(val) => onTabChange(val as string)}
              options={tabs.map((t) => ({
                value: t.key,
                label: (
                  <span className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium">
                    {t.icon}
                    <span>{t.label}</span>
                  </span>
                ),
              }))}
              className="bg-slate-100 p-1 rounded-lg w-full"
              block
            />
          </div>
        )}
      </div>

      {/* 3. Body Content */}
      <div className="p-5 space-y-4">
        {tabs && tabs.length > 0 ? currentTabContent : children}
      </div>
    </Drawer>
  );
};
