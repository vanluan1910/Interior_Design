'use client';

import React, { forwardRef } from 'react';
import { Input, InputProps, InputRef } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

export interface AdminSearchInputProps extends Omit<InputProps, 'onChange'> {
  value?: string;
  onChange?: (value: string) => void;
  onNativeChange?: InputProps['onChange'];
  placeholder?: string;
  sizeVariant?: 'sm' | 'md' | 'lg';
}

/**
 * Reusable underline search field component across admin views.
 * Removes 4-sided borders and applies a sleek underline border-b-2.
 */
export const AdminSearchInput = forwardRef<InputRef, AdminSearchInputProps>(function AdminSearchInput(
  {
    value,
    onChange,
    onNativeChange,
    placeholder = 'Tìm kiếm...',
    allowClear = true,
    sizeVariant = 'md',
    prefix,
    className = '',
    ...restProps
  },
  ref
) {
  const heightClass =
    sizeVariant === 'sm'
      ? 'h-8 text-xs'
      : sizeVariant === 'lg'
      ? 'h-11 text-base'
      : 'h-10 text-sm';

  const defaultIcon = (
    <SearchOutlined
      className={`text-slate-400 mr-1 ${sizeVariant === 'sm' ? 'text-xs' : 'text-base'}`}
    />
  );

  return (
    <Input
      ref={ref}
      value={value}
      onChange={(e) => {
        onChange?.(e.target.value);
        onNativeChange?.(e);
      }}
      placeholder={placeholder}
      allowClear={allowClear}
      prefix={prefix !== undefined ? prefix : defaultIcon}
      className={`w-full font-normal !border-0 !border-b-2 !border-slate-300 hover:!border-slate-400 focus:!border-[#784e34] focus-within:!border-[#784e34] !rounded-none !shadow-none !bg-transparent transition-colors px-1 ${heightClass} ${className}`}
      {...restProps}
    />
  );
});
