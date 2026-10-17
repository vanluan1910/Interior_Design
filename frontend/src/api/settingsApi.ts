import type { AdminCompanyInfo } from '@/types/admin';
import type { PrintTemplateConfig } from '@/components/admin/tabs/PrintTemplatesSettings';
import { cachedFetch, invalidateApiCache } from './shared/apiCache';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface VietQrBank {
  id: number;
  name: string;
  code: string;
  bin: string;
  shortName: string;
  logo: string;
  transferSupported?: number;
  lookupSupported?: number;
}

export interface PaymentConfigData {
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  paymentPrefix?: string;
  branchName?: string;
  defaultDeposit?: number;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankBin?: string;
  vietQrTemplate?: string;
  vietQrCodeUrl?: string;
  isCodActive?: boolean;
  isBankingActive?: boolean;
  paymentInstructions?: string;
  [key: string]: any;
}

export const settingsApi = {
  // VietQR Official API: Get all active VN banks with logos & BIN (Cached for 1 hour)
  getVietQrBanks: async (): Promise<VietQrBank[]> => {
    return cachedFetch('vietqr_banks', async () => {
      try {
        const res = await fetch('https://api.vietqr.io/v2/banks');
        if (!res.ok) throw new Error('Không thể tải danh sách ngân hàng VietQR');
        const json = await res.json();
        return json.data || [];
      } catch (error) {
        console.warn('VietQR getBanks error:', error);
        return [];
      }
    }, 3600000);
  },
  // 1. General Store Settings
  getStoreSettings: async () => {
    return cachedFetch('store_settings', async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/settings`, {
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) return null;
        const json = await res.json();
        return json.data || null;
      } catch {
        return null;
      }
    });
  },

  updateStoreSettings: async (data: any) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Cập nhật cấu hình cửa hàng thất bại');
      }
      invalidateApiCache('store_settings');
      const json = await res.json();
      return json.data;
    } catch (error) {
      console.warn('updateStoreSettings warning:', error);
      throw error;
    }
  },

  // 2. Company Information API
  getCompanyInfo: async (): Promise<AdminCompanyInfo | null> => {
    return cachedFetch('company_info', async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/settings/company`, {
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) return null;
        const json = await res.json();
        return json.data || null;
      } catch {
        return null;
      }
    });
  },

  updateCompanyInfo: async (data: Partial<AdminCompanyInfo>): Promise<AdminCompanyInfo | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/settings/company`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Cập nhật thông tin công ty thất bại');
      }
      invalidateApiCache('company_info');
      const json = await res.json();
      return json.data;
    } catch (error) {
      console.warn('updateCompanyInfo warning:', error);
      throw error;
    }
  },

  // 3. Payment & VietQR Config API
  getPaymentConfig: async (): Promise<PaymentConfigData | null> => {
    return cachedFetch('payment_config', async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/settings/payment`, {
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) return null;
        const json = await res.json();
        const raw = json.data || null;
        if (!raw) return null;

        return {
          ...raw,
          bankName: raw.bankName || raw.BankName || '',
          accountNumber: raw.accountNumber || raw.AccountNumber || raw.bankAccountNumber || raw.BankAccountNumber || '',
          accountName: raw.accountName || raw.AccountName || raw.bankAccountName || raw.BankAccountName || '',
          bankAccountNumber: raw.bankAccountNumber || raw.BankAccountNumber || raw.accountNumber || raw.AccountNumber || '',
          bankAccountName: raw.bankAccountName || raw.BankAccountName || raw.accountName || raw.AccountName || '',
          branchName: raw.branchName || raw.BranchName || '',
          defaultDeposit: raw.defaultDeposit ?? raw.DefaultDeposit ?? 30,
        };
      } catch {
        return null;
      }
    });
  },

  updatePaymentConfig: async (data: Partial<PaymentConfigData>): Promise<PaymentConfigData | null> => {
    try {
      const payload = {
        bankName: data.bankName || '',
        bankAccountName: data.bankAccountName || data.accountName || '',
        bankAccountNumber: data.bankAccountNumber || data.accountNumber || '',
        accountName: data.accountName || data.bankAccountName || '',
        accountNumber: data.accountNumber || data.bankAccountNumber || '',
        bankBin: data.bankBin || '',
        branchName: data.branchName || '',
        defaultDeposit: data.defaultDeposit !== undefined ? Number(data.defaultDeposit) : 30,
        vietQrTemplate: data.vietQrTemplate || 'compact',
        vietQrCodeUrl: data.vietQrCodeUrl || '',
        isCodActive: data.isCodActive ?? true,
        isBankingActive: data.isBankingActive ?? true,
        paymentInstructions: data.paymentInstructions || '',
      };

      const res = await fetch(`${API_BASE_URL}/api/settings/payment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Cập nhật cấu hình thanh toán thất bại');
      }
      invalidateApiCache('payment_config');
      invalidateApiCache('store_settings');
      const json = await res.json();
      return json.data;
    } catch (error) {
      console.warn('updatePaymentConfig warning:', error);
      throw error;
    }
  },

  // 4. Print Templates API
  getPrintTemplates: async (): Promise<PrintTemplateConfig[] | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/settings/print-templates`, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch {
      return null;
    }
  },

  getPrintTemplateByKey: async (key: string): Promise<PrintTemplateConfig | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/settings/print-templates/${key}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch {
      return null;
    }
  },

  updatePrintTemplate: async (key: string, data: Partial<PrintTemplateConfig>): Promise<PrintTemplateConfig | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/settings/print-templates/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Cập nhật mẫu in thất bại');
      }
      const json = await res.json();
      return json.data;
    } catch (error) {
      console.warn('updatePrintTemplate warning:', error);
      throw error;
    }
  },

  savePrintTemplates: async (templates: PrintTemplateConfig[]): Promise<PrintTemplateConfig[] | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/settings/print-templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templates }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Lưu danh sách mẫu in thất bại');
      }
      const json = await res.json();
      return json.data;
    } catch (error) {
      console.warn('savePrintTemplates warning:', error);
      throw error;
    }
  },

  resetPrintTemplates: async (): Promise<PrintTemplateConfig[] | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/settings/print-templates/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Khôi phục mẫu in mặc định thất bại');
      }
      const json = await res.json();
      return json.data;
    } catch (error) {
      console.warn('resetPrintTemplates warning:', error);
      throw error;
    }
  },
};
