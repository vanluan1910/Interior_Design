/**
 * Interior Design & POS Admin - Centralized LocalStorage Data Persistence Service
 * Enables automatic persistent storage for demo and master data across browser reloads.
 */

export const ADMIN_STORAGE_KEYS = {
  EMPLOYEES: 'interior_admin_employees',
  ROLES: 'interior_admin_roles',
  CUSTOMERS: 'interior_admin_customers',
  SUPPLIERS: 'interior_admin_suppliers',
  ORDERS: 'interior_admin_orders',
  BRANCHES: 'interior_admin_branches',
  UOMS: 'interior_admin_uoms',
  CATEGORIES: 'interior_admin_categories',
  WAREHOUSES: 'interior_admin_warehouses',
  COMPANY_INFO: 'interior_admin_company_info',
  PAYMENT_SETTINGS: 'interior_admin_payment_settings',
} as const;

export function getStoredAdminData<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    let raw = localStorage.getItem(key);
    // Backward compatibility fallback for previous temporary keys
    if (!raw) {
      const legacyKey = key.replace('interior_admin_', 'domaco_pos_');
      raw = localStorage.getItem(legacyKey);
    }
    if (!raw) return defaultValue;
    const parsed = JSON.parse(raw);
    return parsed as T;
  } catch (err) {
    console.warn(`[adminStorage] Failed to read ${key} from localStorage:`, err);
    return defaultValue;
  }
}

export function setStoredAdminData<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[adminStorage] Failed to write ${key} to localStorage:`, err);
  }
}

export function removeStoredAdminData(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.warn(`[adminStorage] Failed to remove ${key} from localStorage:`, err);
  }
}

export function resetAllAdminStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    Object.values(ADMIN_STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  } catch (err) {
    console.warn(`[adminStorage] Failed to reset admin storage:`, err);
  }
}
