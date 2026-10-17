export interface AdminStockImportSlip {
  id: string;
  code: string;
  supplier: string;
  supplierId?: string;
  warehouseName: string;
  warehouseId?: string;
  itemName: string;
  spec?: string;
  quantity: number;
  unit?: string;
  unitPrice?: number;
  discount?: number;
  totalValue: number;
  paidAmount?: number;
  remainingDebt?: number;
  mc?: string;
  importDate: string;
  status: string; // draft | completed | cancelled
  statusLabel?: string;
  inspector?: string;
  note?: string;
  itemsJson?: string;
  createdAt?: string;
}

export interface StockImportApiResponse<T> {
  success: boolean;
  data: T | null;
  message?: string;
  errors: string[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export const stockImportApi = {
  /**
   * Lấy danh sách phiếu nhập hàng từ Backend API
   */
  async getStockImports(params?: {
    search?: string;
    supplier?: string;
    warehouse?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    pageSize?: number;
  }): Promise<AdminStockImportSlip[]> {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.append('page', String(params.page));
    if (params?.pageSize !== undefined) query.append('pageSize', String(params.pageSize));
    if (params?.search) query.append('search', params.search);
    if (params?.supplier && params.supplier !== 'all') query.append('supplier', params.supplier);
    if (params?.warehouse && params.warehouse !== 'all') query.append('warehouse', params.warehouse);
    if (params?.status && params.status !== 'all') query.append('status', params.status);
    if (params?.fromDate) query.append('fromDate', params.fromDate);
    if (params?.toDate) query.append('toDate', params.toDate);

    const res = await fetch(`${API_BASE_URL}/api/inventory/imports?${query.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch stock imports: ${res.statusText}`);
    }

    const json: StockImportApiResponse<AdminStockImportSlip[]> = await res.json();
    return json.data || [];
  },

  /**
   * Lấy chi tiết phiếu nhập hàng theo ID
   */
  async getStockImportById(id: string): Promise<AdminStockImportSlip | null> {
    const res = await fetch(`${API_BASE_URL}/api/inventory/imports/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch stock import ${id}: ${res.statusText}`);
    }

    const json: StockImportApiResponse<AdminStockImportSlip> = await res.json();
    return json.data;
  },

  /**
   * Tạo mới phiếu nhập hàng
   */
  async createStockImport(data: Partial<AdminStockImportSlip>): Promise<AdminStockImportSlip> {
    const res = await fetch(`${API_BASE_URL}/api/inventory/imports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.message || `Failed to create stock import: ${res.statusText}`);
    }

    const json: StockImportApiResponse<AdminStockImportSlip> = await res.json();
    return json.data!;
  },

  /**
   * Cập nhật phiếu nhập hàng
   */
  async updateStockImport(id: string, data: Partial<AdminStockImportSlip>): Promise<AdminStockImportSlip> {
    const res = await fetch(`${API_BASE_URL}/api/inventory/imports/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.message || `Failed to update stock import: ${res.statusText}`);
    }

    const json: StockImportApiResponse<AdminStockImportSlip> = await res.json();
    return json.data!;
  },

  /**
   * Xóa phiếu nhập hàng
   */
  async deleteStockImport(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/inventory/imports/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.message || `Failed to delete stock import: ${res.statusText}`);
    }

    const json: StockImportApiResponse<boolean> = await res.json();
    return json.data ?? true;
  },

  /**
   * Xóa nhiều phiếu nhập hàng
   */
  async bulkDeleteStockImports(ids: string[]): Promise<number> {
    const res = await fetch(`${API_BASE_URL}/api/inventory/imports/bulk-delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.message || `Failed to bulk delete stock imports: ${res.statusText}`);
    }

    const json: StockImportApiResponse<number> = await res.json();
    return json.data ?? ids.length;
  },
};
