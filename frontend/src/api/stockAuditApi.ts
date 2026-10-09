export interface AdminStockAuditSlip {
  id: string;
  code: string;
  title: string;
  warehouseId?: string;
  scopeLabel: string;
  creator: string;
  auditDate: string;
  status: string; // in_progress | completed
  statusLabel?: string;
  totalItems: number;
  matchedItems: number;
  discrepantItems: number;
  totalDifferenceValue: number;
  note?: string;
  itemsJson?: string;
  createdAt?: string;
}

export interface StockAuditApiResponse<T> {
  success: boolean;
  data: T | null;
  message?: string;
  errors: string[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export const stockAuditApi = {
  /**
   * Lấy danh sách các đợt kiểm kho từ Backend API
   */
  async getStockAudits(params?: {
    search?: string;
    warehouse?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<AdminStockAuditSlip[]> {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.append('page', String(params.page));
    if (params?.pageSize !== undefined) query.append('pageSize', String(params.pageSize));
    if (params?.search) query.append('search', params.search);
    if (params?.warehouse && params.warehouse !== 'all') query.append('warehouse', params.warehouse);
    if (params?.status && params.status !== 'all') query.append('status', params.status);

    const res = await fetch(`${API_BASE_URL}/api/inventory/audits?${query.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch stock audits: ${res.statusText}`);
    }

    const json: StockAuditApiResponse<AdminStockAuditSlip[]> = await res.json();
    return json.data || [];
  },

  /**
   * Lấy chi tiết phiên kiểm kho theo ID
   */
  async getStockAuditById(id: string): Promise<AdminStockAuditSlip | null> {
    const res = await fetch(`${API_BASE_URL}/api/inventory/audits/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch stock audit ${id}: ${res.statusText}`);
    }

    const json: StockAuditApiResponse<AdminStockAuditSlip> = await res.json();
    return json.data;
  },

  /**
   * Tạo mới phiên kiểm kho
   */
  async createStockAudit(data: Partial<AdminStockAuditSlip>): Promise<AdminStockAuditSlip> {
    const res = await fetch(`${API_BASE_URL}/api/inventory/audits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.message || `Failed to create stock audit: ${res.statusText}`);
    }

    const json: StockAuditApiResponse<AdminStockAuditSlip> = await res.json();
    return json.data!;
  },

  /**
   * Cập nhật phiên kiểm kho
   */
  async updateStockAudit(id: string, data: Partial<AdminStockAuditSlip>): Promise<AdminStockAuditSlip> {
    const res = await fetch(`${API_BASE_URL}/api/inventory/audits/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.message || `Failed to update stock audit: ${res.statusText}`);
    }

    const json: StockAuditApiResponse<AdminStockAuditSlip> = await res.json();
    return json.data!;
  },

  /**
   * Hoàn tất phiên kiểm kê và cân bằng số liệu
   */
  async completeStockAudit(id: string, data?: { note?: string; itemsJson?: string }): Promise<AdminStockAuditSlip> {
    const res = await fetch(`${API_BASE_URL}/api/inventory/audits/${id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data || {}),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.message || `Failed to complete stock audit: ${res.statusText}`);
    }

    const json: StockAuditApiResponse<AdminStockAuditSlip> = await res.json();
    return json.data!;
  },

  /**
   * Xóa phiên kiểm kho
   */
  async deleteStockAudit(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/inventory/audits/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.message || `Failed to delete stock audit: ${res.statusText}`);
    }

    const json: StockAuditApiResponse<boolean> = await res.json();
    return json.data ?? true;
  },

  /**
   * Xóa nhiều phiên kiểm kho
   */
  async bulkDeleteStockAudits(ids: string[]): Promise<number> {
    const res = await fetch(`${API_BASE_URL}/api/inventory/audits/bulk-delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.message || `Failed to bulk delete stock audits: ${res.statusText}`);
    }

    const json: StockAuditApiResponse<number> = await res.json();
    return json.data ?? ids.length;
  },
};
