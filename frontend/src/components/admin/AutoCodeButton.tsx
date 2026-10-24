'use client';

import React, { useState } from 'react';
import { Tooltip } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';

export interface AutoCodeButtonProps {
  /** Hàm callback thực hiện sinh mã tự động */
  onGenerate: () => void | Promise<void>;
  /** Nội dung tooltip hướng dẫn khi hover */
  tooltipTitle?: string;
  /** Vô hiệu hóa nút bấm */
  disabled?: boolean;
  /** Trạng thái đang tải (nếu có) */
  loading?: boolean;
  /** Class CSS tùy biến thêm */
  className?: string;
  /** Kích thước icon: 'sm' (mặc định), 'md', hoặc 'xs' */
  size?: 'xs' | 'sm' | 'md';
}

/**
 * Component dùng chung cho nút "Icon tia sét (⚡)" tự động sinh mã
 * Áp dụng thống nhất cho các form: Sản phẩm, Nhà cung cấp, Nhân viên, Khách hàng, Danh mục, Không gian, Kho, Chi nhánh
 */
export const AutoCodeButton: React.FC<AutoCodeButtonProps> = ({
  onGenerate,
  tooltipTitle = 'Tự động tạo mã mới',
  disabled = false,
  loading = false,
  className = '',
  size = 'sm',
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || loading) return;

    // Kích hoạt hiệu ứng nhấp nháy xoay nhẹ khi click
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 400);

    await onGenerate();
  };

  const sizeClasses = {
    xs: 'text-xs p-0.5',
    sm: 'text-sm p-1',
    md: 'text-base p-1.5',
  }[size];

  return (
    <Tooltip title={tooltipTitle} placement="top">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center text-[#784e34] hover:text-[#5d371f] active:text-[#422613] bg-transparent hover:bg-[#784e34]/10 active:bg-[#784e34]/20 rounded-md border-none cursor-pointer transition-all duration-150 select-none disabled:opacity-40 disabled:cursor-not-allowed ${sizeClasses} ${className}`}
        aria-label={tooltipTitle}
        title={tooltipTitle}
      >
        <ThunderboltOutlined
          className={`transition-transform duration-200 ${
            isAnimating ? 'scale-125 rotate-12 text-[#b45309]' : 'hover:scale-110 active:scale-95'
          }`}
        />
      </button>
    </Tooltip>
  );
};

/**
 * Hàm tiện ích thông minh tính toán mã kế tiếp:
 * - Nếu ô nhập đang có mã sẵn (VD: NH01, NCC01, NV001, KH-001, KHO0001, SP0001,...),
 *   khi người dùng bấm vào icon tia sét sẽ tự động TĂNG LÊN số kế tiếp (NH02, NH03,...)
 *   và tự động bỏ qua các mã đã tồn tại trong danh sách dữ liệu.
 * - Nếu ô nhập đang trống hoặc chưa theo định dạng: tìm mã số nhỏ nhất khả dụng chưa dùng.
 */
export function getNextCode(
  currentCode: string | undefined | null,
  existingCodesInput: Set<string> | string[] | any[],
  prefix: string,
  padLength: number = 2
): string {
  let existingSet: Set<string>;
  if (existingCodesInput instanceof Set) {
    existingSet = existingCodesInput;
  } else if (Array.isArray(existingCodesInput)) {
    existingSet = new Set(
      existingCodesInput
        .map((item) => (typeof item === 'string' ? item : item?.code || ''))
        .map((c) => String(c).trim().toUpperCase())
        .filter(Boolean)
    );
  } else {
    existingSet = new Set();
  }

  const cleanCurrent = (currentCode || '').trim().toUpperCase();
  const escapedPrefix = prefix.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const match = cleanCurrent.match(new RegExp(`^${escapedPrefix}(\\d+)$`));

  let startNum = 1;
  if (match) {
    const currentNum = parseInt(match[1], 10);
    if (!isNaN(currentNum)) {
      startNum = currentNum + 1;
    }
  }

  let nextNum = startNum;
  let candidate = `${prefix}${String(nextNum).padStart(padLength, '0')}`;

  // Tìm mã tiếp theo không có trong existingSet
  while (existingSet.has(candidate.toUpperCase())) {
    nextNum++;
    candidate = `${prefix}${String(nextNum).padStart(padLength, '0')}`;
  }

  return candidate;
}

export default AutoCodeButton;

