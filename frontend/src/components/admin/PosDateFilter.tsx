'use client';

import React, { useState, useEffect } from 'react';
import { DatePicker, Select } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';

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
  if (!dateRange || (!dateRange[0] && !dateRange[1])) return true;
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

  const start = dateRange[0] ? dateRange[0].startOf('day') : null;
  const end = dateRange[1] ? dateRange[1].endOf('day') : null;

  if (start && end) {
    return (
      (target.isAfter(start) || target.isSame(start, 'day')) &&
      (target.isBefore(end) || target.isSame(end, 'day'))
    );
  }
  if (start) {
    return target.isAfter(start) || target.isSame(start, 'day');
  }
  if (end) {
    return target.isBefore(end) || target.isSame(end, 'day');
  }
  return true;
};

interface PosDateFilterProps {
  value?: DateRangeValue;
  onChange?: (range: DateRangeValue) => void;
  className?: string;
  showPresets?: boolean;
  size?: 'small' | 'middle' | 'large';
  fullWidth?: boolean;
}


export const PosDateFilter: React.FC<PosDateFilterProps> = ({
  value = null,
  onChange,
  className = '',
  showPresets = true,
  size = 'small',
  fullWidth = true,
}) => {
  const [activePreset, setActivePreset] = useState<string>('all');

  const startDate = value && value[0] ? value[0] : null;
  const endDate = value && value[1] ? value[1] : null;

  // Đồng bộ activePreset khi value từ ngoài truyền vào thay đổi
  useEffect(() => {
    if (!value || (!value[0] && !value[1])) {
      setActivePreset('all');
      return;
    }
    const [s, e] = value;
    if (s && e) {
      const now = dayjs();
      if (s.isSame(now, 'day') && e.isSame(now, 'day')) {
        setActivePreset('today');
      } else if (
        s.isSame(now.subtract(6, 'day'), 'day') &&
        e.isSame(now, 'day')
      ) {
        setActivePreset('last7days');
      } else if (
        s.isSame(now.startOf('month'), 'day') &&
        e.isSame(now.endOf('month'), 'day')
      ) {
        setActivePreset('thisMonth');
      } else {
        setActivePreset('custom');
      }
    } else {
      setActivePreset('custom');
    }
  }, [value]);

  const handlePresetChange = (preset: string) => {
    setActivePreset(preset);
    if (preset === 'custom') {
      return;
    }
    const calculated = calculatePresetRange(preset);
    onChange?.(calculated);
  };

  const handleStartDateChange = (date: Dayjs | null) => {
    setActivePreset('custom');
    if (!date && !endDate) {
      setActivePreset('all');
      onChange?.(null);
    } else {
      onChange?.([date ? date.startOf('day') : null, endDate ? endDate.endOf('day') : null]);
    }
  };

  const handleEndDateChange = (date: Dayjs | null) => {
    setActivePreset('custom');
    if (!startDate && !date) {
      setActivePreset('all');
      onChange?.(null);
    } else {
      onChange?.([startDate ? startDate.startOf('day') : null, date ? date.endOf('day') : null]);
    }
  };

  if (!fullWidth) {
    return (
      <div className={`flex items-center gap-2 flex-wrap ${className}`}>
        {showPresets && (
          <Select
            value={activePreset}
            onChange={handlePresetChange}
            options={QUICK_DATE_PRESETS}
            size={size}
            className="w-40 text-xs font-normal [&_.ant-select-selector]:!rounded-lg"
          />
        )}
        <div className="flex items-center gap-1.5">
          <DatePicker
            value={startDate}
            onChange={handleStartDateChange}
            format="DD/MM/YYYY"
            placeholder="Từ ngày"
            size={size}
            className="w-32 text-xs rounded-lg border-slate-200 hover:border-slate-300 font-normal [&_.ant-picker-input>input]:text-xs"
            allowClear
            maxDate={endDate || undefined}
          />
          <span className="text-slate-400 text-xs font-medium">→</span>
          <DatePicker
            value={endDate}
            onChange={handleEndDateChange}
            format="DD/MM/YYYY"
            placeholder="Đến ngày"
            size={size}
            className="w-32 text-xs rounded-lg border-slate-200 hover:border-slate-300 font-normal [&_.ant-picker-input>input]:text-xs"
            allowClear
            minDate={startDate || undefined}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2.5 w-full ${className}`}>
      {showPresets && (
        <Select
          value={activePreset}
          onChange={handlePresetChange}
          options={QUICK_DATE_PRESETS}
          size={size}
          className="w-full text-xs font-normal [&_.ant-select-selector]:!rounded-lg"
        />
      )}

      {/* 2 ô chọn ngày riêng biệt với popup 1 tháng gọn gàng, không bị tràn màn hình */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <span className="text-[11px] font-medium text-slate-500 block">Từ ngày:</span>
          <DatePicker
            value={startDate}
            onChange={handleStartDateChange}
            format="DD/MM/YYYY"
            placeholder="Từ ngày"
            size={size}
            className="w-full text-xs rounded-lg border-slate-200 hover:border-slate-300 font-normal [&_.ant-picker-input>input]:text-xs"
            allowClear
            maxDate={endDate || undefined}
          />
        </div>
        <div className="space-y-1">
          <span className="text-[11px] font-medium text-slate-500 block">Đến ngày:</span>
          <DatePicker
            value={endDate}
            onChange={handleEndDateChange}
            format="DD/MM/YYYY"
            placeholder="Đến ngày"
            size={size}
            className="w-full text-xs rounded-lg border-slate-200 hover:border-slate-300 font-normal [&_.ant-picker-input>input]:text-xs"
            allowClear
            minDate={startDate || undefined}
          />
        </div>
      </div>
    </div>
  );
};

export default PosDateFilter;
