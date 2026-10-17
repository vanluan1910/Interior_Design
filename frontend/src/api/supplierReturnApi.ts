export interface AdminSupplierReturnSlip {
  id: string;
  code: string;
  sourceImportCode?: string;
  supplierId?: string;
  supplierName: string;
  warehouseId?: string;
  warehouseName: string;
  itemName: string;
  spec?: string;
  quantity: number;
  unit?: string;
  purchasePrice?: number;
  returnPrice?: number;
  totalGoods?: number;
  totalValue: number;
  discount?: number;
  invoiceDiscount?: number;
  supplierRefund: number;
  paidAmount?: number;
  returnDate: string;
  reason: string;
  solution?: string;
  paymentMethod?: string;
  status: string; // draft | completed
  statusLabel?: string;
  staffName?: string;
  note?: string;
  itemsJson?: string;
  createdAt?: string;
}

export interface SupplierReturnApiResponse<T> {
  success: boolean;
  data: T | null;
  message?: string;
  errors: string[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export const supplierReturnApi = {
  /**
   * Lấy danh sách phiếu trả hàng từ Backend API
   */
  async getSupplierReturns(params?: {
    search?: string;
    supplier?: string;
    warehouse?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<AdminSupplierReturnSlip[]> {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.append('page', String(params.page));
    if (params?.pageSize !== undefined) query.append('pageSize', String(params.pageSize));
    if (params?.search) query.append('search', params.search);
    if (params?.supplier && params.supplier !== 'all') query.append('supplier', params.supplier);
    if (params?.warehouse && params.warehouse !== 'all') query.append('warehouse', params.warehouse);
    if (params?.status && params.status !== 'all') query.append('status', params.status);

    const res = await fetch(`${API_BASE_URL}/api/inventory/returns?${query.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch supplier returns: ${res.statusText}`);
    }

    const json: SupplierReturnApiResponse<AdminSupplierReturnSlip[]> = await res.json();
    return json.data || [];
  },

  /**
   * Lấy chi tiết phiếu trả hàng theo ID
   */
  async getSupplierReturnById(id: string): Promise<AdminSupplierReturnSlip | null> {
    const res = await fetch(`${API_BASE_URL}/api/inventory/returns/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch supplier return ${id}: ${res.statusText}`);
    }

    const json: SupplierReturnApiResponse<AdminSupplierReturnSlip> = await res.json();
    return json.data;
  },

  /**
   * Tạo mới phiếu trả hàng cho NCC
   */
  async createSupplierReturn(data: Partial<AdminSupplierReturnSlip>): Promise<AdminSupplierReturnSlip> {
    const res = await fetch(`${API_BASE_URL}/api/inventory/returns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.message || `Failed to create supplier return: ${res.statusText}`);
    }

    const json: SupplierReturnApiResponse<AdminSupplierReturnSlip> = await res.json();
    return json.data!;
  },

  /**
   * Cập nhật phiếu trả hàng
   */
  async updateSupplierReturn(id: string, data: Partial<AdminSupplierReturnSlip>): Promise<AdminSupplierReturnSlip> {
    const res = await fetch(`${API_BASE_URL}/api/inventory/returns/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.message || `Failed to update supplier return: ${res.statusText}`);
    }

    const json: SupplierReturnApiResponse<AdminSupplierReturnSlip> = await res.json();
    return json.data!;
  },

  /**
   * Xóa phiếu trả hàng
   */
  async deleteSupplierReturn(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/inventory/returns/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.message || `Failed to delete supplier return: ${res.statusText}`);
    }

    const json: SupplierReturnApiResponse<boolean> = await res.json();
    return json.data ?? true;
  },

  /**
   * Xóa nhiều phiếu trả hàng
   */
  async bulkDeleteSupplierReturns(ids: string[]): Promise<number> {
    const res = await fetch(`${API_BASE_URL}/api/inventory/returns/bulk-delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.message || `Failed to bulk delete supplier returns: ${res.statusText}`);
    }

    const json: SupplierReturnApiResponse<number> = await res.json();
    return json.data ?? ids.length;
  },
};
