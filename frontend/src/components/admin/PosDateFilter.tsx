'use client';

import React, { useState } from 'react';
import { DatePicker, Select } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

export type DateRangeValue = [Dayjs | null, Dayjs | null] | null;

export const QUICK_DATE_PRESETS = [
  { value: 'all', label: 'Toàn bộ thời gian' },
  { value: 'today', label: 'Hôm nay' },
  { value: 'yesterday', label: 'Hôm qua' },
  { value: 'last7days', label: '7 ngày qua' },
  { value: 'thisMonth', label: 'Tháng này' },
  { value: 'lastMonth', label: 'Tháng trước' },
  { value: 'thisYear', label: 'Năm nay' },
  { value: 'custom', label: 'Tùy chọn ngày' },
];

export const calculatePresetRange = (preset: string): DateRangeValue => {
  const now = dayjs();
  switch (preset) {
    case 'today':
      return [now.startOf('day'), now.endOf('day')];
    case 'yesterday': {
      const yesterday = now.subtract(1, 'day');
      return [yesterday.startOf('day'), yesterday.endOf('day')];
    }
    case 'last7days':
      return [now.subtract(6, 'day').startOf('day'), now.endOf('day')];
    case 'thisMonth':
      return [now.startOf('month'), now.endOf('month')];
    case 'lastMonth': {
      const lastMonth = now.subtract(1, 'month');
      return [lastMonth.startOf('month'), lastMonth.endOf('month')];
    }
    case 'thisYear':
      return [now.startOf('year'), now.endOf('year')];
    case 'all':
    default:
      return null;
  }
};

/**
 * Utility helper to test if a record date string falls inside the selected date range.
 * Supports "DD/MM/YYYY HH:mm", "DD/MM/YYYY", "YYYY-MM-DD", etc.
 */
export const checkDateInRange = (dateStr?: string, dateRange?: DateRangeValue): boolean => {
  if (!dateRange || !dateRange[0] || !dateRange[1]) return true;
  if (!dateStr) return false;

  let target: Dayjs | null = null;
  const trimmed = dateStr.trim();
  const datePart = trimmed.split(' ')[0];

  if (datePart.includes('/')) {
    const parts = datePart.split('/');
    if (parts.length === 3) {
      // DD/MM/YYYY
      target = dayjs(`${parts[2]}-${parts[1]}-${parts[0]}`);
    }
  } else if (datePart.includes('-')) {
    target = dayjs(datePart);
  } else {
    target = dayjs(trimmed);
  }

  if (!target || !target.isValid()) return true;

  const start = dateRange[0].startOf('day');
  const end = dateRange[1].endOf('day');
  return (
    (target.isAfter(start) || target.isSame(start, 'day')) &&
    (target.isBefore(end) || target.isSame(end, 'day'))
  );
};

interface PosDateFilterProps {
  value?: DateRangeValue;
  onChange?: (range: DateRangeValue) => void;
  className?: string;
  showPresets?: boolean;
}

export const PosDateFilter: React.FC<PosDateFilterProps> = ({
  value = null,
  onChange,
  className = '',
  showPresets = true,
}) => {
  const [activePreset, setActivePreset] = useState<string>('all');

  const handlePresetChange = (preset: string) => {
    setActivePreset(preset);
    if (preset === 'custom') {
      return;
    }
    const calculated = calculatePresetRange(preset);
    onChange?.(calculated);
  };

  const handleRangeChange = (dates: DateRangeValue) => {
    if (!dates || (!dates[0] && !dates[1])) {
      setActivePreset('all');
      onChange?.(null);
    } else {
      setActivePreset('custom');
      onChange?.(dates);
    }
  };

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      {showPresets && (
        <Select
          value={activePreset}
          onChange={handlePresetChange}
          options={QUICK_DATE_PRESETS}
          className="w-36 sm:w-40 h-10 text-xs font-medium [&_.ant-select-selector]:!border-0 [&_.ant-select-selector]:!bg-slate-100 hover:[&_.ant-select-selector]:!bg-slate-200/80 [&_.ant-select-selector]:!rounded-lg"
          popupMatchSelectWidth={false}
        />
      )}
      <RangePicker
        value={value}
        onChange={handleRangeChange}
        format="DD/MM/YYYY"
        placeholder={['Từ ngày', 'Đến ngày']}
        suffixIcon={<CalendarOutlined className="text-slate-400 text-xs" />}
        className="h-10 text-xs rounded-lg border-slate-200 hover:border-slate-300 w-56 sm:w-64 font-medium [&_.ant-picker-input>input]:text-xs [&_.ant-picker-input>input]:font-medium"
        allowClear
      />
    </div>
  );
};

export default PosDateFilter;
