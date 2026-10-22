'use client';

import { useState, useEffect } from 'react';
import { settingsApi } from '@/api/settingsApi';
import { getStoredAdminData, setStoredAdminData, ADMIN_STORAGE_KEYS } from '@/utils/adminStorage';
import type { AdminCompanyInfo } from '@/types/admin';

export const DEFAULT_COMPANY_PHONE = '0867612199';
export const DEFAULT_COMPANY_PHONE_DISPLAY = '0867 612 199';
export const DEFAULT_COMPANY_ZALO_URL = 'https://zalo.me/0867612199';

export const DEFAULT_COMPANY_INFO: AdminCompanyInfo = {
  code: 'D2L-001',
  companyName: 'CÔNG TY CỔ PHẦN NỘI THẤT CAO CẤP D2 LUXURY',
  brandName: 'D2 LUXURY DESIGN',
  taxId: '0343136004',
  representative: 'Nguyễn Văn Luận',
  representativeRole: 'Tổng Giám Đốc',
  businessSector: 'Nội Thất Gỗ Tự Nhiên',
  phone: '0867 612 199',
  hotline: '0867 612 199',
  email: 'contact@d2luxury.vn',
  website: 'https://d2luxury.vn',
  zalo: 'https://zalo.me/0867612199',
  fanpage: 'https://www.facebook.com/profile.php?id=61575009790250',
  headquarters: 'Ngã 4 Cửa Cạn, đặc khu Phú Quốc, tỉnh An Giang',
  warehouseAddress: '08 - Ngõ Như Ý - Huyện Thạch Thất - Tp Hà Nội',
  country: 'Việt Nam',
  province: 'Kiên Giang',
  district: 'TP. Phú Quốc',
  ward: 'Xã Cửa Cạn',
  logoUrl: '/logo.png',
  faviconUrl: '/favicon.ico',
  stampUrl: null,
  status: true,
  accessUrl: 'https://d2luxury.vn/admin',
  expiredAt: '',
  receiptHeaderTitle: 'HỆ THỐNG NỘI THẤT CAO CẤP D2 LUXURY',
  receiptFooterNote: 'Cảm ơn Quý khách! Sản phẩm gỗ tự nhiên được bảo hành chính hãng 05 năm.',
  showTaxOnReceipt: true,
  showHotlineOnReceipt: true,
  showQrOnReceipt: true,
};

export function cleanPhoneNumber(phone?: string | null): string {
  if (!phone) return DEFAULT_COMPANY_PHONE;
  const digits = phone.replace(/\D/g, '');
  if (digits === '0967323335' || digits === '0343136004' || digits === '0903888999') {
    return DEFAULT_COMPANY_PHONE;
  }
  return digits.length >= 9 ? digits : DEFAULT_COMPANY_PHONE;
}

export function formatPhoneNumber(phone?: string | null): string {
  const digits = cleanPhoneNumber(phone);
  if (digits.length === 10) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return digits;
}

export function getZaloUrl(zaloOrPhone?: string | null): string {
  if (!zaloOrPhone) return DEFAULT_COMPANY_ZALO_URL;
  const trimmed = zaloOrPhone.trim();
  if (trimmed.includes('0967323335') || trimmed.includes('0903888999')) {
    return DEFAULT_COMPANY_ZALO_URL;
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  const digits = cleanPhoneNumber(trimmed);
  return `https://zalo.me/${digits}`;
}

function sanitizeCompanyInfo(raw: any): AdminCompanyInfo {
  let cleanPhone = raw.phone || raw.hotline || DEFAULT_COMPANY_INFO.phone;
  if (cleanPhone === '0967 323 335' || cleanPhone === '0967323335' || cleanPhone === '0343 136 004') {
    cleanPhone = '0867 612 199';
  }
  let cleanHotline = raw.hotline || raw.phone || DEFAULT_COMPANY_INFO.hotline;
  if (cleanHotline === '0967 323 335' || cleanHotline === '0967323335' || cleanHotline === '0343 136 004') {
    cleanHotline = '0867 612 199';
  }
  let cleanZalo = raw.zalo;
  if (!cleanZalo || cleanZalo.includes('0967323335') || cleanZalo.includes('0903888999')) {
    cleanZalo = getZaloUrl(cleanHotline || DEFAULT_COMPANY_PHONE);
  } else if (!cleanZalo.startsWith('http://') && !cleanZalo.startsWith('https://')) {
    cleanZalo = getZaloUrl(cleanZalo);
  }

  let cleanWarehouse = raw.warehouseAddress;
  if (!cleanWarehouse || cleanWarehouse.includes('Cửa Cạn') || cleanWarehouse.includes('Phú Quốc')) {
    cleanWarehouse = DEFAULT_COMPANY_INFO.warehouseAddress;
  }

  return {
    ...DEFAULT_COMPANY_INFO,
    ...raw,
    phone: cleanPhone,
    hotline: cleanHotline,
    zalo: cleanZalo,
    warehouseAddress: cleanWarehouse,
  };
}

export function useCompanyInfo() {
  const [company, setCompany] = useState<AdminCompanyInfo>(DEFAULT_COMPANY_INFO);

  useEffect(() => {
    let isMounted = true;

    // Load cached info from localStorage on the client after hydration
    const stored = getStoredAdminData<any>(ADMIN_STORAGE_KEYS.COMPANY_INFO, null);
    if (stored && isMounted) {
      setCompany(sanitizeCompanyInfo(stored));
    }

    const loadCompany = async () => {
      try {
        const info = await settingsApi.getCompanyInfo();
        if (info && isMounted) {
          const merged = sanitizeCompanyInfo(info);
          setCompany(merged);
          setStoredAdminData(ADMIN_STORAGE_KEYS.COMPANY_INFO, merged);
        }
      } catch {
        // fallback
      }
    };

    loadCompany();

    const handleUpdated = (e: any) => {
      const detail = e.detail;
      if (detail && isMounted) {
        const merged = sanitizeCompanyInfo(detail);
        setCompany(merged);
        setStoredAdminData(ADMIN_STORAGE_KEYS.COMPANY_INFO, merged);
      } else {
        loadCompany();
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === ADMIN_STORAGE_KEYS.COMPANY_INFO && e.newValue && isMounted) {
        try {
          const parsed = JSON.parse(e.newValue);
          const sanitized = sanitizeCompanyInfo(parsed);
          setCompany(sanitized);
        } catch {}
      }
    };

    window.addEventListener('store_settings_updated', handleUpdated);
    window.addEventListener('storage', handleStorage);

    return () => {
      isMounted = false;
      window.removeEventListener('store_settings_updated', handleUpdated);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const rawPhone = cleanPhoneNumber(company.hotline || company.phone);
  const displayPhone = formatPhoneNumber(company.hotline || company.phone);
  const zaloUrl = getZaloUrl(company.zalo || rawPhone);

  return {
    company,
    rawPhone,
    displayPhone,
    zaloUrl,
    hotline: displayPhone,
    warehouseAddress: company.warehouseAddress || DEFAULT_COMPANY_INFO.warehouseAddress,
  };
}
