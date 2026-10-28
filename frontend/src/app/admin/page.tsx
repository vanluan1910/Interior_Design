'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  ADMIN_STORAGE_KEYS,
  getStoredAdminData,
  setStoredAdminData,
} from '@/utils/adminStorage';
import {
  App,
  Layout,
  Select,
  Tag,
  Badge,
  Dropdown,
  Space,
  Button,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  SettingOutlined,
  LogoutOutlined,
  BellOutlined,
  EllipsisOutlined,
  PrinterOutlined,
  ShopOutlined,
  MenuOutlined,
  DownOutlined,
  PieChartOutlined,
  InboxOutlined,
  TagsOutlined,
  AppstoreOutlined,
  ShoppingCartOutlined,
  FolderOutlined,
  TeamOutlined,
  BankOutlined,
  RightOutlined,
  RollbackOutlined,
  FileTextOutlined,
  CreditCardOutlined,
  SafetyCertificateOutlined,
  EnvironmentOutlined,
  IdcardOutlined,
  LeftOutlined,
} from '@ant-design/icons';
const TabLoadingSkeleton = () => (
  <div className="w-full min-h-[420px] flex items-center justify-center bg-white/40 backdrop-blur-sm rounded-xl border border-[#eae1dd]/60 p-8 shadow-sm">
    <div className="flex flex-col items-center gap-3">
      <div className="w-7 h-7 border-2 border-[#5d371f] border-t-transparent rounded-full animate-spin" />
      <span className="text-xs text-[#83746c] font-medium tracking-wide">Đang tải phân hệ quản trị...</span>
    </div>
  </div>
);

const OverviewTab = dynamic(() => import('@/components/admin/tabs/OverviewTab').then((m) => m.OverviewTab), {
  ssr: false,
  loading: () => <TabLoadingSkeleton />,
});

const OrdersTab = dynamic(() => import('@/components/admin/tabs/OrdersTab').then((m) => m.OrdersTab), {
  ssr: false,
  loading: () => <TabLoadingSkeleton />,
});

const InventoryTab = dynamic(() => import('@/components/admin/tabs/InventoryTab').then((m) => m.InventoryTab), {
  ssr: false,
  loading: () => <TabLoadingSkeleton />,
});

const CategoriesTab = dynamic(() => import('@/components/admin/tabs/CategoriesTab').then((m) => m.CategoriesTab), {
  ssr: false,
  loading: () => <TabLoadingSkeleton />,
});

const WorkshopTab = dynamic(() => import('@/components/admin/tabs/WorkshopTab').then((m) => m.WorkshopTab), {
  ssr: false,
  loading: () => <TabLoadingSkeleton />,
});

const CustomersTab = dynamic(() => import('@/components/admin/tabs/CustomersTab').then((m) => m.CustomersTab), {
  ssr: false,
  loading: () => <TabLoadingSkeleton />,
});

const SuppliersTab = dynamic(() => import('@/components/admin/tabs/SuppliersTab').then((m) => m.SuppliersTab), {
  ssr: false,
  loading: () => <TabLoadingSkeleton />,
});

const SettingsTab = dynamic(() => import('@/components/admin/tabs/SettingsTab').then((m) => m.SettingsTab), {
  ssr: false,
  loading: () => <TabLoadingSkeleton />,
});
import { NotificationPopover } from '@/components/admin/NotificationPopover';
import { triggerDesktopNotification, playChimeSound } from '@/utils/desktopNotification';
import { branchApi } from '@/api/branchApi';
import { categoryApi } from '@/api/categoryApi';
import { spaceApi } from '@/api/spaceApi';
import { productApi } from '@/api/productApi';
import { supplierApi } from '@/api/supplierApi';
import { customerApi } from '@/api/customerApi';
import { orderApi, normalizeOrderRow } from '@/api/orderApi';
import { settingsApi } from '@/api/settingsApi';
import { roleApi } from '@/api/roleApi';
import { employeeApi } from '@/api/employeeApi';
import { isMatchBranch } from '@/utils/branchHelper';
import {
  type OrderRow,
  type AdminCustomer,
  type FeaturedCatalogProduct,
  type AdminCategory,
  type AdminSupplier,
  type AdminEmployee,
  type AdminBranch,
  type AdminRole,
  type AdminSpace,
} from '@/types/admin';
import {
  INITIAL_ORDERS,
  INITIAL_EMPLOYEES,
  INITIAL_BRANCHES,
  INITIAL_CUSTOMERS,
  INITIAL_SUPPLIERS,
  INITIAL_ROLES,
} from '@/data/admin/mockData';

const { Header, Content } = Layout;

export type AdminNavTabKey =
  | 'overview'
  | 'orders'
  | 'inventory'
  | 'categories'
  | 'workshop'
  | 'customers'
  | 'suppliers'
  | 'branches'
  | 'settings'
  | 'functions';

export interface AdminFunctionItem {
  key: string;
  tab: AdminNavTabKey;
  subTab?: string;
  settingsTab?: 'company' | 'payment' | 'print-templates' | 'branches' | 'warehouses' | 'employees' | 'permissions';
  label: string;
  desc: string;
  icon: React.ReactNode;
  bg: string;
  border: string;
}

function AdminPageContent({
  initialTab = 'overview',
  initialSubTab,
  initialSettingsTab,
}: {
  initialTab?: AdminNavTabKey;
  initialSubTab?: string;
  initialSettingsTab?: string;
}) {
  const { message, notification } = App.useApp();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isLoading, logout, hasPermission, hasAnyPermission } = useAuth();

  const [mounted, setMounted] = useState(false);
  const knownOrderCodesRef = React.useRef<Set<string>>(new Set());
  const isInitialOrderLoadRef = React.useRef(true);
  const loadedTabsRef = React.useRef<Set<string>>(new Set());

  useEffect(() => {
    setMounted(true);
  }, []);

  // Route Guard: Chặn khách vãng lai và tài khoản khách hàng, chỉ cho phép quản trị viên / nhân viên
  useEffect(() => {
    if (!mounted || isLoading) return;
    if (!user || user.role !== 'admin') {
      const returnUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/admin';
      router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`);
    }
  }, [mounted, isLoading, user, router]);

  interface AdminNavTab {
    key: string;
    label: string;
    permission?: string;
    permissions?: string[];
  }

  const ALL_ADMIN_TABS: AdminNavTab[] = useMemo(() => [
    { key: 'overview', label: 'Tổng quan', permission: 'dashboard.view' },
    { key: 'orders', label: 'Đơn hàng', permission: 'orders.view' },
    { key: 'inventory', label: 'Sản phẩm', permission: 'catalog.products.view' },
    { key: 'categories', label: 'Danh mục', permissions: ['catalog.categories.view', 'catalog.spaces.view'] },
    { key: 'workshop', label: 'Mua hàng', permissions: ['inventory.imports.view', 'inventory.returns.view', 'inventory.stocktake.view', 'inventory.warehouses.view', 'suppliers.vendors.view'] },
    { key: 'customers', label: 'Khách hàng', permissions: ['customers.profile.view', 'customers.consult.view'] },
    { key: 'settings', label: 'Cài đặt', permissions: ['settings.brand.view', 'settings.payment.view', 'settings.print.view', 'settings.branches.view', 'inventory.warehouses.view', 'settings.employees.view', 'settings.rbac.view'] },
  ], []);

  const accessibleNavTabs: AdminNavTab[] = useMemo(() => {
    return ALL_ADMIN_TABS.filter((tab: AdminNavTab) => {
      if (!tab.permission && !tab.permissions) return true;
      if (tab.permission) return hasPermission(tab.permission);
      if (tab.permissions) return hasAnyPermission(tab.permissions);
      return true;
    });
  }, [ALL_ADMIN_TABS, hasPermission, hasAnyPermission]);

  const canAccessPOS = useMemo(() => {
    return hasAnyPermission(['pos.checkout.cash', 'pos.checkout.bank', 'orders.create', 'orders.view']);
  }, [hasAnyPermission]);

  const urlTab = searchParams.get('tab');
  const validUrlTab = (urlTab && ['overview', 'orders', 'inventory', 'categories', 'workshop', 'customers', 'suppliers', 'branches', 'settings', 'functions'].includes(urlTab))
    ? (urlTab as AdminNavTabKey)
    : null;

  const initialNavTab = useMemo<AdminNavTabKey>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname;
      const sp = new URLSearchParams(window.location.search);
      const tabParam = sp.get('tab');
      if (tabParam && ['overview', 'orders', 'inventory', 'categories', 'workshop', 'customers', 'suppliers', 'branches', 'settings', 'functions'].includes(tabParam)) {
        return tabParam as AdminNavTabKey;
      }
      if (p.includes('/admin/orders')) return 'orders';
      if (p.includes('/admin/inventory')) return 'inventory';
      if (p.includes('/admin/categories')) return 'categories';
      if (p.includes('/admin/imports') || p.includes('/admin/returns') || p.includes('/admin/stocktake') || p.includes('/admin/workshop')) return 'workshop';
      if (p.includes('/admin/branches') || p.includes('/admin/settings') || p.includes('/admin/employees') || p.includes('/admin/warehouses')) return 'settings';
      if (p.includes('/admin/customers')) return 'customers';
      if (p.includes('/admin/suppliers')) return 'suppliers';
      if (p === '/admin' || p === '/admin/') return 'overview';
    }
    return validUrlTab || initialTab;
  }, [validUrlTab, initialTab]);

  const [activeNavState, setActiveNavState] = useState<AdminNavTabKey | null>(initialNavTab);

  const initialWorkshopSubTab = useMemo<string>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname;
      if (p.includes('/admin/imports')) return 'imports';
      if (p.includes('/admin/returns')) return 'returns';
      if (p.includes('/admin/stocktake')) return 'stocktake';
    }
    return initialSubTab || searchParams.get('subTab') || 'imports';
  }, [initialSubTab, searchParams]);

  const [workshopSubTabState, setWorkshopSubTabState] = useState<string | null>(initialWorkshopSubTab);
  const [targetProductSearch, setTargetProductSearch] = useState<string | null>(searchParams.get('search') || searchParams.get('productSearch') || null);
  const [targetCreateImportProduct, setTargetCreateImportProduct] = useState<FeaturedCatalogProduct | null>(null);

  const activeNav = activeNavState || initialNavTab;

  // Auto-switch to first accessible tab if current tab is forbidden for role
  useEffect(() => {
    if (!mounted || !user) return;
    if (user.roleCode === 'SUPER_ADMIN' || user.permissions?.includes('*')) return;
    if (activeNav === 'functions') return;
    if (activeNav === 'suppliers') {
      const canAccessSuppliers = hasAnyPermission(['suppliers.vendors.view', 'suppliers.debt.view', 'inventory.imports.view']);
      if (!canAccessSuppliers && accessibleNavTabs.length > 0) {
        setActiveNavState(accessibleNavTabs[0].key as any);
      }
      return;
    }
    const isCurrentAllowed = accessibleNavTabs.some((t: AdminNavTab) => t.key === activeNav);
    if (!isCurrentAllowed && accessibleNavTabs.length > 0) {
      setActiveNavState(accessibleNavTabs[0].key as any);
    }
  }, [activeNav, accessibleNavTabs, mounted, user, hasAnyPermission]);

  const handleNavigateToProduct = useCallback((productCodeOrNameOrId: string) => {
    const clean = productCodeOrNameOrId.replace(/^[#]/, '').trim();
    setTargetProductSearch(clean);
    setActiveNavState('inventory');
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', 'inventory');
      url.searchParams.set('search', clean);
      window.history.pushState({}, '', url.toString());
    }
  }, []);

  const handleClearProductSearch = useCallback(() => {
    setTargetProductSearch(null);
  }, []);

  const [targetOrderSearch, setTargetOrderSearch] = useState<string | null>(null);

  const handleNavigateToOrder = useCallback((orderCode: string) => {
    const clean = orderCode.trim();
    setTargetOrderSearch(clean);
    setActiveNavState('orders');
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', 'orders');
      url.searchParams.set('search', clean);
      window.history.pushState({}, '', url.toString());
    }
  }, []);

  const handleClearOrderSearch = useCallback(() => {
    setTargetOrderSearch(null);
  }, []);

  const handleNavigateToCreateImport = useCallback((product: FeaturedCatalogProduct) => {
    setTargetCreateImportProduct(product);
    setActiveNavState('workshop');
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', 'workshop');
      url.searchParams.set('subTab', 'imports');
      url.searchParams.set('mode', 'create');
      if (product.code) url.searchParams.set('productCode', product.code);
      window.history.pushState({}, '', url.toString());
    }
  }, []);

  // Data State with LocalStorage Persistence (SSR Safe)
  const [ordersList, setOrdersList] = useState<OrderRow[]>([]);
  const [catalogList, setCatalogList] = useState<FeaturedCatalogProduct[]>([]);
  const [categoriesList, setCategoriesList] = useState<AdminCategory[]>([]);
  const [spacesList, setSpacesList] = useState<AdminSpace[]>([]);
  const [employeesList, setEmployeesList] = useState<AdminEmployee[]>(INITIAL_EMPLOYEES);
  const [branchesList, setBranchesList] = useState<AdminBranch[]>(INITIAL_BRANCHES);
  const [customersList, setCustomersList] = useState<AdminCustomer[]>([]);
  const [suppliersList, setSuppliersList] = useState<AdminSupplier[]>([]);
  const [rolesList, setRolesList] = useState<AdminRole[]>(INITIAL_ROLES);
  const [storeHeaderInfo, setStoreHeaderInfo] = useState<{ logoUrl?: string | null; brandName?: string; companyName?: string }>({
    logoUrl: '/logo.png',
    brandName: 'D2 LUXURY',
    companyName: 'Nội Thất Gỗ Tự Nhiên',
  });

  const loadHeaderCompanyInfo = useCallback(async () => {
    try {
      const info: any = await settingsApi.getCompanyInfo();
      if (info) {
        setStoreHeaderInfo({
          logoUrl: info.logoUrl || info.LogoUrl || '/logo.png',
          brandName: info.brandName || info.BrandName || info.companyName || info.CompanyName || 'D2 LUXURY',
          companyName: info.businessSector || info.BusinessSector || 'Nội Thất Gỗ Tự Nhiên',
        });
      }
    } catch {
      // fallback
    }
  }, []);

  // Global Branch Selection State (in Header) - persistent across page reloads
  const [selectedGlobalBranch, setSelectedGlobalBranch] = useState<string>('');

  // Determine if current user can switch between branches
  const canSwitchBranch = useMemo(() => {
    if (!user) return true;
    if (user.roleCode === 'SUPER_ADMIN' || user.permissions?.includes('*')) return true;
    if (hasPermission('settings.branches.view') || hasPermission('settings.branches.update')) return true;
    // If the employee has a specific branch assigned, they are restricted strictly to that branch
    if (user.branch && user.branch.trim() !== '') return false;
    return true;
  }, [user, hasPermission]);

  // Filter selectable branches: if employee is assigned to a specific branch, only show that branch
  const displayBranches = useMemo(() => {
    if (canSwitchBranch) {
      return branchesList;
    }
    if (user?.branch) {
      const matched = branchesList.filter((b) => isMatchBranch(b.name, user.branch));
      if (matched.length > 0) return matched;
      return [{ id: 'user_branch', name: user.branch } as AdminBranch];
    }
    return branchesList;
  }, [canSwitchBranch, branchesList, user?.branch]);

  // Enforce branch isolation for branch-assigned employees
  useEffect(() => {
    if (!canSwitchBranch && user?.branch) {
      const targetBranch = branchesList.find((b) => isMatchBranch(b.name, user.branch))?.name || user.branch;
      if (selectedGlobalBranch !== targetBranch) {
        setSelectedGlobalBranch(targetBranch);
        setStoredAdminData(ADMIN_STORAGE_KEYS.SELECTED_BRANCH, targetBranch);
        try {
          localStorage.setItem('d2_selected_branch', targetBranch);
          window.dispatchEvent(new CustomEvent('branch_changed', { detail: { branchName: targetBranch } }));
        } catch { }
      }
    }
  }, [canSwitchBranch, user?.branch, selectedGlobalBranch, branchesList]);

  // Load stored data on mount safely after hydration
  useEffect(() => {
    loadHeaderCompanyInfo();

    const handleSettingsUpdated = (e: any) => {
      const detail = e.detail;
      if (detail) {
        setStoreHeaderInfo({
          logoUrl: detail.logoUrl || detail.LogoUrl || '/logo.png',
          brandName: detail.brandName || detail.BrandName || detail.companyName || detail.CompanyName || 'D2 LUXURY',
          companyName: detail.businessSector || detail.BusinessSector || 'Nội Thất Gỗ Tự Nhiên',
        });
      } else {
        loadHeaderCompanyInfo();
      }
    };

    window.addEventListener('store_settings_updated', handleSettingsUpdated);
    return () => window.removeEventListener('store_settings_updated', handleSettingsUpdated);
  }, [loadHeaderCompanyInfo]);

  useEffect(() => {
    setOrdersList(getStoredAdminData(ADMIN_STORAGE_KEYS.ORDERS, []));
    setCategoriesList(getStoredAdminData(ADMIN_STORAGE_KEYS.CATEGORIES, []));
    setSpacesList(getStoredAdminData(ADMIN_STORAGE_KEYS.SPACES, []));
    setEmployeesList(getStoredAdminData(ADMIN_STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES));
    setCustomersList(getStoredAdminData(ADMIN_STORAGE_KEYS.CUSTOMERS, []));
    setSuppliersList(getStoredAdminData(ADMIN_STORAGE_KEYS.SUPPLIERS, []));
    setRolesList(getStoredAdminData(ADMIN_STORAGE_KEYS.ROLES, INITIAL_ROLES));
    const storedBranch = getStoredAdminData(ADMIN_STORAGE_KEYS.SELECTED_BRANCH, 'all');
    if (storedBranch) {
      setSelectedGlobalBranch(storedBranch);
    } else {
      setSelectedGlobalBranch('all');
    }

    customerApi.getCustomers().then((res) => {
      if (Array.isArray(res)) {
        setCustomersList(res);
        setStoredAdminData(ADMIN_STORAGE_KEYS.CUSTOMERS, res);
      }
    }).catch(() => { });

    const handleBranchSync = (e: any) => {
      const branch = e?.detail?.branchName;
      if (branch && branch !== selectedGlobalBranch) {
        setSelectedGlobalBranch(branch);
      }
    };
    window.addEventListener('branch_changed', handleBranchSync);
    return () => window.removeEventListener('branch_changed', handleBranchSync);
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      const products = await productApi.getProducts({
        branch: selectedGlobalBranch !== 'all' ? selectedGlobalBranch : undefined,
        pageSize: 0, // 0 = lấy toàn bộ sản phẩm thực tế từ DB, không gán số cứng 500 hay 1000
      });
      if (products && Array.isArray(products)) {
        setCatalogList(products);
        return;
      }
    } catch (err) {
      console.warn('Could not fetch products from API:', err);
    }
    setCatalogList([]);
  }, [selectedGlobalBranch]);

  // Load real product catalog from DB whenever branch changes or tab is active
  useEffect(() => {
    // Tab 'inventory' tự phân trang riêng theo trang thật từ bảng (10, 20, 50, 100)
    // Chỉ tải danh mục dùng chung khi vào workshop hoặc orders (để chọn sản phẩm tạo đơn/nhập kho)
    if (activeNav === 'workshop' || activeNav === 'orders') {
      loadProducts();
    }
  }, [selectedGlobalBranch, activeNav, loadProducts]);

  useEffect(() => {
    // Fetch branches from Backend API with fallback to local storage
    const loadBranches = async () => {
      try {
        const branches = await branchApi.getBranches();
        if (branches && Array.isArray(branches) && branches.length > 0) {
          setBranchesList(branches);
          setStoredAdminData(ADMIN_STORAGE_KEYS.BRANCHES, branches);
          setSelectedGlobalBranch((prev) => {
            if (!canSwitchBranch && user?.branch) {
              const matched = branches.find((b) => isMatchBranch(b.name, user.branch));
              const assigned = matched ? matched.name : user.branch;
              setStoredAdminData(ADMIN_STORAGE_KEYS.SELECTED_BRANCH, assigned);
              return assigned;
            }
            if (prev === 'all' || !prev) {
              return 'all';
            }
            if (branches.some((b) => b.name === prev)) {
              return prev;
            }
            return 'all';
          });
          return;
        }
      } catch (err) {
        console.warn('Could not fetch branches from API, using fallback:', err);
      }
      const stored = getStoredAdminData<AdminBranch[]>(ADMIN_STORAGE_KEYS.BRANCHES, []);
      const cleaned: AdminBranch[] = (stored || []).filter((b: AdminBranch) => !['br_1', 'br_2', 'br_3', 'br_4'].includes(b.id));
      setBranchesList(cleaned);
      setStoredAdminData(ADMIN_STORAGE_KEYS.BRANCHES, cleaned);
      if (cleaned.length > 0) {
        setSelectedGlobalBranch((prev) => {
          if (!canSwitchBranch && user?.branch) {
            const matched = cleaned.find((b: AdminBranch) => isMatchBranch(b.name, user.branch));
            const assigned = matched ? matched.name : user.branch;
            setStoredAdminData(ADMIN_STORAGE_KEYS.SELECTED_BRANCH, assigned);
            return assigned;
          }
          if (prev === 'all' || !prev) {
            return 'all';
          }
          if (cleaned.some((b: AdminBranch) => b.name === prev)) {
            return prev;
          }
          return 'all';
        });
      }
    };

    // Fetch categories directly from Backend API (Real Data)
    const loadCategories = async () => {
      try {
        const categories = await categoryApi.getCategories();
        if (categories && Array.isArray(categories) && categories.length > 0) {
          setCategoriesList(categories);
          setStoredAdminData(ADMIN_STORAGE_KEYS.CATEGORIES, categories);
          return;
        }
      } catch (err) {
        console.warn('Could not fetch categories from API, using fallback:', err);
      }
      const stored = getStoredAdminData<AdminCategory[]>(ADMIN_STORAGE_KEYS.CATEGORIES, []);
      if (stored && stored.length > 0) {
        setCategoriesList(stored);
      }
    };

    // Fetch spaces directly from Backend API (Real Data)
    const loadSpaces = async () => {
      try {
        const spaces = await spaceApi.getSpaces();
        if (spaces && Array.isArray(spaces) && spaces.length > 0) {
          setSpacesList(spaces);
          setStoredAdminData(ADMIN_STORAGE_KEYS.SPACES, spaces);
          return;
        }
      } catch (err) {
        console.warn('Could not fetch spaces from API, using fallback:', err);
      }
      const stored = getStoredAdminData<AdminSpace[]>(ADMIN_STORAGE_KEYS.SPACES, []);
      if (stored && stored.length > 0) {
        setSpacesList(stored);
      }
    };

    // Fetch suppliers directly from Backend API (Real Data)
    const loadSuppliers = async () => {
      try {
        const suppliers = await supplierApi.getSuppliers();
        if (suppliers && Array.isArray(suppliers)) {
          setSuppliersList(suppliers);
          setStoredAdminData(ADMIN_STORAGE_KEYS.SUPPLIERS, suppliers);
          return;
        }
      } catch (err) {
        console.warn('Could not fetch suppliers from API, using fallback:', err);
      }
      setSuppliersList(getStoredAdminData(ADMIN_STORAGE_KEYS.SUPPLIERS, []));
    };


    // Fetch Customers directly from Backend API (Real Data)
    const loadCustomers = async () => {
      try {
        const customers = await customerApi.getCustomers({ bypassCache: true });
        if (customers && Array.isArray(customers)) {
          setCustomersList(customers);
          setStoredAdminData(ADMIN_STORAGE_KEYS.CUSTOMERS, customers);
          return;
        }
      } catch (err) {
        console.warn('Could not fetch customers from API, using fallback:', err);
      }
      setCustomersList(getStoredAdminData(ADMIN_STORAGE_KEYS.CUSTOMERS, []));
    };

    // Fetch Orders directly from Backend API (Real Data)
    const loadOrders = async () => {
      try {
        const orders = await orderApi.getOrders({ bypassCache: true });
        if (orders && Array.isArray(orders)) {
          const normalized = orders.map(normalizeOrderRow);
          if (isInitialOrderLoadRef.current) {
            normalized.forEach((o) => {
              if (o.orderCode) knownOrderCodesRef.current.add(o.orderCode);
            });
            isInitialOrderLoadRef.current = false;
          }
          setOrdersList(normalized);
          setStoredAdminData(ADMIN_STORAGE_KEYS.ORDERS, normalized);
          return;
        }
      } catch (err) {
        console.warn('Could not fetch orders from API, using fallback:', err);
      }
      const cached = getStoredAdminData(ADMIN_STORAGE_KEYS.ORDERS, []);
      const normalizedCached = Array.isArray(cached) ? cached.map(normalizeOrderRow) : [];
      if (isInitialOrderLoadRef.current) {
        normalizedCached.forEach((o) => {
          if (o.orderCode) knownOrderCodesRef.current.add(o.orderCode);
        });
        isInitialOrderLoadRef.current = false;
      }
      setOrdersList(normalizedCached);
    };

    // Fetch Roles directly from Backend API (Real Data)
    const loadRoles = async () => {
      try {
        const roles = await roleApi.getRoles();
        if (roles && Array.isArray(roles)) {
          setRolesList(roles);
          setStoredAdminData(ADMIN_STORAGE_KEYS.ROLES, roles);
          return;
        }
      } catch (err) {
        console.warn('Could not fetch roles from API, using fallback:', err);
      }
      setRolesList(getStoredAdminData(ADMIN_STORAGE_KEYS.ROLES, INITIAL_ROLES));
    };

    // Fetch Employees directly from Backend API (Real Data)
    const loadEmployees = async () => {
      try {
        const emps = await employeeApi.getEmployees();
        if (emps && Array.isArray(emps)) {
          setEmployeesList(emps);
          setStoredAdminData(ADMIN_STORAGE_KEYS.EMPLOYEES, emps);
          return;
        }
      } catch (err) {
        console.warn('Could not fetch employees from API, using fallback:', err);
      }
      setEmployeesList(getStoredAdminData(ADMIN_STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES));
    };

    // 1. Chỉ tải danh sách chi nhánh & đơn hàng 1 lần duy nhất khi vừa vào trang Admin
    if (!loadedTabsRef.current.has('initial_mount')) {
      loadedTabsRef.current.add('initial_mount');
      loadBranches();
      loadOrders();
    }

    // 2. Tải dữ liệu đặc thù theo từng tab lười (lazy) - chỉ tải 1 lần khi người dùng lần đầu mở tab đó
    if ((activeNav === 'inventory' || activeNav === 'categories' || activeNav === 'overview') && !loadedTabsRef.current.has('categories_spaces')) {
      loadedTabsRef.current.add('categories_spaces');
      loadCategories();
      loadSpaces();
    } else if ((activeNav === 'workshop' || activeNav === 'suppliers') && !loadedTabsRef.current.has('suppliers')) {
      loadedTabsRef.current.add('suppliers');
      loadSuppliers();
    } else if ((activeNav === 'orders' || activeNav === 'customers') && !loadedTabsRef.current.has('customers')) {
      loadedTabsRef.current.add('customers');
      loadCustomers();
    } else if (activeNav === 'settings' && !loadedTabsRef.current.has('settings')) {
      loadedTabsRef.current.add('settings');
      loadRoles();
      loadEmployees();
    }

    const handleCategoriesChanged = () => {
      loadedTabsRef.current.delete('categories_spaces');
      loadCategories();
    };
    window.addEventListener('categories_changed', handleCategoriesChanged);
    return () => {
      window.removeEventListener('categories_changed', handleCategoriesChanged);
    };
  }, [activeNav]);

  // Hàm phát thông báo đơn hàng mới: Âm thanh chuông + Thông báo Desktop Windows + Popup nổi
  const notifyNewOrderArrival = useCallback((newOrder: {
    orderCode: string;
    customerName?: string;
    productName?: string;
    value?: number;
  }) => {
    if (!newOrder || !newOrder.orderCode) return;
    if (knownOrderCodesRef.current.has(newOrder.orderCode)) return;
    knownOrderCodesRef.current.add(newOrder.orderCode);

    // 1. Âm thanh chuông "Ting ting"
    playChimeSound();

    const formattedVal = new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(newOrder.value || 0);

    // 2. Bắn thông báo ra góc màn hình máy tính (Desktop Notification kiểu Zalo / Facebook)
    triggerDesktopNotification(`🔔 D2 LUXURY: Đơn hàng mới #${newOrder.orderCode}!`, {
      body: `Khách ${newOrder.customerName || 'Vãng lai'} vừa đặt mua ${newOrder.productName || 'nội thất'} (${formattedVal})`,
      onClick: () => handleNavigateToOrder(newOrder.orderCode),
      requireInteraction: true,
    });

    // 3. Hiển thị popup nổi trực tiếp trên trang Admin
    notification.open({
      message: <span className="font-bold text-[#5d371f] text-sm">🔔 Đơn hàng mới: #{newOrder.orderCode}</span>,
      description: (
        <div className="text-xs text-slate-700 mt-1 space-y-0.5">
          <div>Khách hàng: <strong>{newOrder.customerName || 'Vãng lai'}</strong></div>
          <div>Sản phẩm: <strong>{newOrder.productName || 'Nội thất may đo'}</strong></div>
          <div className="font-semibold text-emerald-700">Giá trị: {formattedVal}</div>
        </div>
      ),
      placement: 'bottomRight',
      duration: 10,
      actions: (
        <Button
          type="primary"
          size="small"
          style={{ backgroundColor: '#5d371f', borderColor: '#5d371f' }}
          onClick={() => handleNavigateToOrder(newOrder.orderCode)}
        >
          Xem đơn hàng ngay
        </Button>
      ),
    });
  }, [handleNavigateToOrder, notification]);

  // Nhận thông báo tức thì khi có khách đặt hàng từ tab Checkout (Instant Cross-Tab Event)
  useEffect(() => {
    if (!mounted) return;

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'd2_latest_order_event' && e.newValue) {
        try {
          const orderData = JSON.parse(e.newValue);
          notifyNewOrderArrival(orderData);
          // Tải lại danh sách đơn hàng ngay lập tức
          orderApi.getOrders({ bypassCache: true }).then((fresh) => {
            if (Array.isArray(fresh)) setOrdersList(fresh.map(normalizeOrderRow));
          }).catch(() => { });
        } catch { }
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    const handleCustomOrderEvent = (e: any) => {
      if (e.detail) {
        notifyNewOrderArrival(e.detail);
        orderApi.getOrders({ bypassCache: true }).then((fresh) => {
          if (Array.isArray(fresh)) setOrdersList(fresh.map(normalizeOrderRow));
        }).catch(() => { });
      }
    };
    window.addEventListener('d2_new_order_placed', handleCustomOrderEvent);

    return () => {
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('d2_new_order_placed', handleCustomOrderEvent);
    };
  }, [mounted, notifyNewOrderArrival]);

  // Realtime Polling: Kiểm tra đơn hàng mới từ máy khác định kỳ mỗi 15 giây (bỏ qua cache)
  useEffect(() => {
    if (!mounted || !user || user.role !== 'admin') return;

    const interval = setInterval(async () => {
      try {
        const freshOrders = await orderApi.getOrders({ bypassCache: true });
        if (freshOrders && Array.isArray(freshOrders)) {
          const normalized = freshOrders.map(normalizeOrderRow);

          if (!isInitialOrderLoadRef.current) {
            const newOrders = normalized.filter(
              (o) => o.orderCode && !knownOrderCodesRef.current.has(o.orderCode)
            );

            if (newOrders.length > 0) {
              newOrders.forEach((no) => {
                notifyNewOrderArrival(no);
              });
            }
          } else {
            normalized.forEach((o) => {
              if (o.orderCode) knownOrderCodesRef.current.add(o.orderCode);
            });
            isInitialOrderLoadRef.current = false;
          }

          setOrdersList((prev) => {
            // Ngăn chặn re-render thác nước nếu danh sách đơn không có thay đổi
            if (
              prev.length === normalized.length &&
              prev[0]?.orderCode === normalized[0]?.orderCode &&
              prev[0]?.status === normalized[0]?.status
            ) {
              return prev;
            }
            return normalized;
          });
        }
      } catch (e) {
        // silent polling catch
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [mounted, user, notifyNewOrderArrival]);

  // Settings Sub-tab state
  const urlSettingsTab = searchParams.get('settingsTab');
  const validSettingsTab = (urlSettingsTab && ['store', 'company', 'payment', 'print-templates', 'branches', 'warehouses', 'roles', 'users', 'employees', 'permissions'].includes(urlSettingsTab))
    ? (urlSettingsTab === 'roles' ? 'permissions' : urlSettingsTab === 'users' ? 'employees' : urlSettingsTab === 'store' ? 'company' : urlSettingsTab as any)
    : null;
  const [settingsActiveTabState, setSettingsActiveTabState] = useState<string | null>(initialSettingsTab || validSettingsTab);
  const settingsActiveTab = settingsActiveTabState || initialSettingsTab || validSettingsTab || 'company';
  const setSettingsActiveTab = (tab: string) => {
    const normalized = tab === 'roles' ? 'permissions' : tab === 'users' ? 'employees' : tab === 'store' ? 'company' : tab;
    setSettingsActiveTabState(normalized);
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_settings_tab', normalized);
      const url = new URL(window.location.href);
      url.searchParams.set('settingsTab', normalized);
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Remember selected branch preference across reloads
  useEffect(() => {
    if (mounted && selectedGlobalBranch) {
      setStoredAdminData(ADMIN_STORAGE_KEYS.SELECTED_BRANCH, selectedGlobalBranch);
    }
  }, [selectedGlobalBranch, mounted]);

  useEffect(() => {
    if (initialSubTab) {
      setWorkshopSubTabState(initialSubTab);
    }
  }, [initialSubTab]);

  useEffect(() => {
    if (initialSettingsTab) {
      const normalized = initialSettingsTab === 'roles' ? 'permissions' : initialSettingsTab === 'users' ? 'employees' : initialSettingsTab === 'store' ? 'company' : initialSettingsTab;
      setSettingsActiveTabState(normalized);
    }
  }, [initialSettingsTab]);

  useEffect(() => {
    const sTab = searchParams.get('settingsTab');
    if (sTab) {
      const normalized = sTab === 'roles' ? 'permissions' : sTab === 'users' ? 'employees' : sTab === 'store' ? 'company' : sTab;
      if (['company', 'payment', 'print-templates', 'branches', 'warehouses', 'employees', 'permissions'].includes(normalized)) {
        setSettingsActiveTabState(normalized);
      }
    }
  }, [searchParams]);

  // Hỗ trợ nút Back/Forward trên trình duyệt để chuyển tab ngay lập tức mà không reload trang
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window === 'undefined') return;
      const p = window.location.pathname;
      const sp = new URLSearchParams(window.location.search);
      const tabParam = sp.get('tab');
      if (tabParam && ['overview', 'orders', 'inventory', 'categories', 'workshop', 'customers', 'suppliers', 'branches', 'settings', 'functions'].includes(tabParam)) {
        setActiveNavState(tabParam as any);
        const st = sp.get('settingsTab');
        if (st) setSettingsActiveTabState(st === 'roles' ? 'permissions' : st === 'users' ? 'employees' : st === 'store' ? 'company' : st);
        return;
      }
      if (p.includes('/admin/orders')) setActiveNavState('orders');
      else if (p.includes('/admin/inventory')) setActiveNavState('inventory');
      else if (p.includes('/admin/categories')) setActiveNavState('categories');
      else if (p.includes('/admin/imports')) {
        setActiveNavState('workshop');
        setWorkshopSubTabState('imports');
      }
      else if (p.includes('/admin/returns')) {
        setActiveNavState('workshop');
        setWorkshopSubTabState('returns');
      }
      else if (p.includes('/admin/stocktake')) {
        setActiveNavState('workshop');
        setWorkshopSubTabState('stocktake');
      }
      else if (p.includes('/admin/workshop')) {
        const sub = sp.get('subTab');
        if (sub === 'suppliers') {
          setActiveNavState('suppliers');
        } else {
          setActiveNavState('workshop');
          if (sub) setWorkshopSubTabState(sub);
        }
      }
      else if (p.includes('/admin/branches')) {
        setActiveNavState('settings');
        setSettingsActiveTabState('branches');
      }
      else if (p.includes('/admin/employees')) {
        setActiveNavState('settings');
        setSettingsActiveTabState('employees');
      }
      else if (p.includes('/admin/warehouses')) {
        setActiveNavState('settings');
        setSettingsActiveTabState('warehouses');
      }
      else if (p.includes('/admin/customers')) setActiveNavState('customers');
      else if (p.includes('/admin/suppliers')) setActiveNavState('suppliers');
      else if (p.includes('/admin/settings')) {
        setActiveNavState('settings');
        const st = sp.get('settingsTab');
        if (st) setSettingsActiveTabState(st === 'roles' ? 'permissions' : st === 'users' ? 'employees' : st === 'store' ? 'company' : st);
      }
      else if (p === '/admin' || p === '/admin/') {
        if (tabParam === 'functions') {
          setActiveNavState('functions');
        } else {
          setActiveNavState('overview');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavChange = (
    tab: 'overview' | 'orders' | 'inventory' | 'categories' | 'workshop' | 'customers' | 'suppliers' | 'branches' | 'settings' | 'functions',
    subTab?: string,
    settingsTab?: 'company' | 'payment' | 'print-templates' | 'branches' | 'warehouses' | 'employees' | 'permissions' | string
  ) => {
    const targetTab = tab === 'branches' ? 'settings' : tab;
    setActiveNavState(targetTab);
    if (tab === 'branches' || settingsTab === 'branches') {
      setSettingsActiveTabState('branches');
    } else if (settingsTab) {
      const normalized = settingsTab === 'roles' ? 'permissions' : settingsTab === 'users' ? 'employees' : settingsTab === 'store' ? 'company' : settingsTab;
      setSettingsActiveTabState(normalized);
    }
    if (subTab) {
      setWorkshopSubTabState(subTab);
    } else if (tab === 'workshop') {
      setWorkshopSubTabState('imports');
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_last_tab', targetTab);
      if (tab === 'branches' || settingsTab === 'branches') {
        localStorage.setItem('admin_settings_tab', 'branches');
      } else if (settingsTab) {
        const normalized = settingsTab === 'roles' ? 'permissions' : settingsTab === 'users' ? 'employees' : settingsTab === 'store' ? 'company' : settingsTab;
        localStorage.setItem('admin_settings_tab', normalized);
      }
    }

    let targetUrl = '/admin';
    if (tab === 'branches' || (targetTab === 'settings' && settingsTab === 'branches')) {
      targetUrl = '/admin/branches';
    } else if (targetTab === 'settings' && settingsTab === 'employees') {
      targetUrl = '/admin/employees';
    } else if (targetTab === 'settings' && settingsTab === 'warehouses') {
      targetUrl = '/admin/warehouses';
    } else if (targetTab === 'workshop') {
      const activeSub = subTab || 'imports';
      if (activeSub === 'imports') targetUrl = '/admin/imports';
      else if (activeSub === 'returns') targetUrl = '/admin/returns';
      else if (activeSub === 'stocktake') targetUrl = '/admin/stocktake';
      else targetUrl = `/admin/workshop?subTab=${activeSub}`;
    } else if (targetTab === 'overview') {
      targetUrl = '/admin';
    } else if (targetTab === 'functions') {
      targetUrl = '/admin?tab=functions';
    } else if (targetTab === 'settings') {
      const activeSt = settingsTab || settingsActiveTab || 'company';
      targetUrl = `/admin/settings?settingsTab=${activeSt}`;
    } else {
      targetUrl = `/admin/${targetTab}`;
    }

    if (typeof window !== 'undefined') {
      window.history.pushState({ tab: targetTab, subTab, settingsTab }, '', targetUrl);
    }
  };

  const cleanAdminName = user?.name && !user.name.includes('Quá') && !user.name.includes('trá»') && !user.name.includes('viÃªn') ? user.name : 'Quản trị viên';

  const profileMenuItems: MenuProps['items'] = [
    {
      key: 'user-info',
      label: (
        <div className="py-1">
          <div className="font-bold text-slate-800">{cleanAdminName}</div>
          <div className="text-xs text-slate-500">{user?.email || 'admin@d2luxury.vn'}</div>
          <Tag color="gold" className="mt-1 text-[10px]">
            {user?.roleCode === 'SUPER_ADMIN' || user?.role === 'admin' ? 'Quản trị viên tối cao' : (user?.roleName || 'Nhân viên')}
          </Tag>
        </div>
      ),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
      onClick: () => {
        logout();
        router.push('/login');
      },
    },
  ];

  const functionGroups: { title: string; items: AdminFunctionItem[] }[] = useMemo(() => [
    {
      title: 'Kinh doanh & Bán hàng',
      items: [
        {
          key: 'overview',
          tab: 'overview' as const,
          label: 'Tổng quan',
          desc: 'Báo cáo doanh thu',
          icon: <PieChartOutlined className="text-xl" />,
          bg: 'bg-[#f5ece8] text-[#784e34]',
          border: '',
        },
        {
          key: 'orders',
          tab: 'orders' as const,
          label: 'Đơn hàng',
          desc: 'Quản lý đơn hàng',
          icon: <ShoppingCartOutlined className="text-xl" />,
          bg: 'bg-[#f5ece8] text-[#784e34]',
          border: '',
        },
        {
          key: 'inventory',
          tab: 'inventory' as const,
          label: 'Sản phẩm',
          desc: 'Hàng hóa & bảng giá',
          icon: <TagsOutlined className="text-xl" />,
          bg: 'bg-[#f5ece8] text-[#784e34]',
          border: '',
        },
        {
          key: 'categories',
          tab: 'categories' as const,
          label: 'Danh mục',
          desc: 'Phân loại sản phẩm',
          icon: <FolderOutlined className="text-xl" />,
          bg: 'bg-[#f5ece8] text-[#784e34]',
          border: '',
        },
      ],
    },
    {
      title: 'Kho vận & Đối tác',
      items: [
        {
          key: 'imports',
          tab: 'workshop' as const,
          subTab: 'imports',
          label: 'Nhập hàng',
          desc: 'Phiếu nhập kho',
          icon: <InboxOutlined className="text-xl" />,
          bg: 'bg-[#f5ece8] text-[#784e34]',
          border: '',
        },
        {
          key: 'returns',
          tab: 'workshop' as const,
          subTab: 'returns',
          label: 'Trả hàng',
          desc: 'Xuất hoàn trả NCC',
          icon: <RollbackOutlined className="text-xl" />,
          bg: 'bg-[#f5ece8] text-[#784e34]',
          border: '',
        },
        {
          key: 'stocktake',
          tab: 'workshop' as const,
          subTab: 'stocktake',
          label: 'Kiểm kho',
          desc: 'Kiểm kê định kỳ',
          icon: <FileTextOutlined className="text-xl" />,
          bg: 'bg-[#f5ece8] text-[#784e34]',
          border: '',
        },
        {
          key: 'suppliers',
          tab: 'suppliers' as const,
          label: 'Nhà cung cấp',
          desc: 'Hồ sơ đối tác & nợ',
          icon: <ShopOutlined className="text-xl" />,
          bg: 'bg-[#f5ece8] text-[#784e34]',
          border: '',
        },
      ],
    },
    {
      title: 'Khách hàng & Cơ cấu',
      items: [
        {
          key: 'customers',
          tab: 'customers' as const,
          label: 'Khách hàng',
          desc: 'Hồ sơ khách hàng',
          icon: <TeamOutlined className="text-xl" />,
          bg: 'bg-[#f5ece8] text-[#784e34]',
          border: '',
        },
        {
          key: 'branches',
          tab: 'settings' as const,
          settingsTab: 'branches',
          label: 'Chi nhánh',
          desc: 'Cơ sở & chi nhánh',
          icon: <EnvironmentOutlined className="text-xl" />,
          bg: 'bg-[#f5ece8] text-[#784e34]',
          border: '',
        },
        {
          key: 'warehouses',
          tab: 'settings' as const,
          settingsTab: 'warehouses',
          label: 'Kho bãi',
          desc: 'Điểm lưu kho',
          icon: <BankOutlined className="text-xl" />,
          bg: 'bg-[#f5ece8] text-[#784e34]',
          border: '',
        },
      ],
    },
    {
      title: 'Thiết lập & Cài đặt hệ thống',
      items: [
        {
          key: 'company',
          tab: 'settings' as const,
          settingsTab: 'company',
          label: 'Doanh nghiệp',
          desc: 'Thông tin & thương hiệu',
          icon: <IdcardOutlined className="text-xl" />,
          bg: 'bg-[#f5ece8] text-[#784e34]',
          border: '',
        },
        {
          key: 'payment',
          tab: 'settings' as const,
          settingsTab: 'payment',
          label: 'Thanh toán & QR',
          desc: 'Tài khoản & VietQR',
          icon: <CreditCardOutlined className="text-xl" />,
          bg: 'bg-[#f5ece8] text-[#784e34]',
          border: '',
        },
        {
          key: 'print-templates',
          tab: 'settings' as const,
          settingsTab: 'print-templates',
          label: 'Mẫu phiếu in',
          desc: 'Khổ giấy & bill',
          icon: <PrinterOutlined className="text-xl" />,
          bg: 'bg-[#f5ece8] text-[#784e34]',
          border: '',
        },
        {
          key: 'employees',
          tab: 'settings' as const,
          settingsTab: 'employees',
          label: 'Nhân viên',
          desc: 'Tài khoản & nhân sự',
          icon: <TeamOutlined className="text-xl" />,
          bg: 'bg-[#f5ece8] text-[#784e34]',
          border: '',
        },
        {
          key: 'permissions',
          tab: 'settings' as const,
          settingsTab: 'permissions',
          label: 'Phân quyền',
          desc: 'Vai trò & quyền hạn',
          icon: <SafetyCertificateOutlined className="text-xl" />,
          bg: 'bg-[#f5ece8] text-[#784e34]',
          border: '',
        },
      ],
    },
  ], []);

  const filteredFunctionGroups = useMemo(() => {
    return functionGroups.map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.key === 'suppliers') return hasPermission('suppliers.vendors.view') || hasPermission('inventory.imports.view');
        if (item.key === 'branches') return hasAnyPermission(['settings.branches.view', 'inventory.warehouses.view']);
        if (item.key === 'warehouses') return hasPermission('inventory.warehouses.view');
        if (item.key === 'company') return hasPermission('settings.brand.view');
        if (item.key === 'payment') return hasPermission('settings.payment.view');
        if (item.key === 'print-templates') return hasPermission('settings.print.view');
        if (item.key === 'employees') return hasPermission('settings.employees.view');
        if (item.key === 'permissions') return hasPermission('settings.rbac.view');
        if (item.key === 'returns') return hasPermission('inventory.returns.view');
        if (item.key === 'stocktake') return hasPermission('inventory.stocktake.view');
        if (item.key === 'imports') return hasPermission('inventory.imports.view');
        return accessibleNavTabs.some((t) => t.key === item.tab);
      }),
    })).filter((group) => group.items.length > 0);
  }, [functionGroups, hasPermission, hasAnyPermission, accessibleNavTabs]);

  if (!mounted || isLoading || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fff8f5] font-sans">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-[#5d371f] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-[#83746c]">Đang kiểm tra quyền quản trị D2 LUXURY...</span>
        </div>
      </div>
    );
  }

  return (
    <Layout className="min-h-screen bg-[#fff8f5] flex flex-col font-sans admin-underline-mode overflow-x-hidden">
      <Header
        style={{ lineHeight: 'normal' }}
        className="!h-16 sm:!h-20 !bg-[#fff8f5]/95 backdrop-blur-xl border-b border-[#eae1dd]/60 !px-0 flex items-center sticky top-0 z-50 shadow-[0_1px_8px_rgba(0,0,0,0.04)] !leading-none w-full shrink-0"
      >
        <div className="h-16 sm:h-20 w-full px-3 sm:px-5 lg:px-6 xl:px-8 flex items-center justify-between flex-nowrap whitespace-nowrap gap-2 sm:gap-4">
          {/* Left: Hamburger (mobile) + Brand Logo + Desktop Nav */}
          <div className="flex items-center gap-2 sm:gap-3 xl:gap-5 2xl:gap-6 min-w-0">
            {/* Hamburger button for mobile (< lg) */}
            <Button
              type="text"
              icon={<MenuOutlined className="text-xl text-[#51443d]" />}
              onClick={() => handleNavChange('functions')}
              className="lg:hidden !p-1.5 flex items-center justify-center shrink-0"
              aria-label="Mở danh sách chức năng"
            />

            {/* Brand Logo */}
            <Link
              href="/admin"
              onClick={(e) => {
                e.preventDefault();
                handleNavChange('overview');
              }}
              className="flex items-center group shrink-0 select-none py-1"
            >
              <img
                alt={storeHeaderInfo.brandName || 'Logo'}
                className="h-10 sm:h-14 lg:h-[66px] w-auto max-h-[72px] object-contain transition-transform group-hover:scale-105"
                src={storeHeaderInfo.logoUrl || '/logo.png'}
              />
            </Link>

            {/* Desktop Navigation (XL screens >= 1280px show all permitted tabs directly) */}
            <nav className="hidden xl:flex items-center gap-1.5 2xl:gap-3.5 h-20">
              {accessibleNavTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    handleNavChange(tab.key as any);
                  }}
                  className={`relative flex items-center h-20 text-[13px] 2xl:text-[13.5px] transition-all whitespace-nowrap px-1.5 2xl:px-2 cursor-pointer select-none bg-transparent border-0 outline-none ${activeNav === tab.key
                    ? 'text-[#5d371f] font-medium after:content-[\'\'] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-[#5d371f]'
                    : 'text-[#51443d] hover:text-[#5d371f] font-normal after:content-[\'\'] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-transparent hover:after:bg-[#5d371f]/30'
                    }`}
                >
                  <span>{tab.label}</span>
                </button>
              ))}

              {/* Bán hàng (Quay lại trang bán hàng POS) */}
              {canAccessPOS && (
                <Link
                  href="/"
                  className="relative flex items-center gap-1.5 h-20 text-[13px] 2xl:text-[13.5px] text-[#51443d] hover:text-[#5d371f] font-normal px-1.5 2xl:px-2 transition-all whitespace-nowrap cursor-pointer select-none no-underline after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-transparent hover:after:bg-[#5d371f]/30"
                  title="Chuyển sang trang bán hàng"
                >
                  <ShopOutlined className="text-sm" />
                  <span>Bán hàng</span>
                </Link>
              )}
            </nav>

            {/* Tablet / Compact Desktop Navigation (LG screens) */}
            <nav className="hidden lg:flex xl:hidden items-center gap-1.5 h-20">
              {accessibleNavTabs.slice(0, 5).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    handleNavChange(tab.key as any);
                  }}
                  className={`relative flex items-center h-20 text-[12.5px] transition-all whitespace-nowrap px-1.5 cursor-pointer select-none bg-transparent border-0 outline-none ${activeNav === tab.key
                    ? 'text-[#5d371f] font-medium after:content-[\'\'] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-[#5d371f]'
                    : 'text-[#51443d] hover:text-[#5d371f] font-normal after:content-[\'\'] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-transparent hover:after:bg-[#5d371f]/30'
                    }`}
                >
                  <span>{tab.label}</span>
                </button>
              ))}

              {/* Overflow "..." Dropdown Menu for LG screens */}
              {accessibleNavTabs.length > 5 ? (
                <Dropdown
                  menu={{
                    items: [
                      ...accessibleNavTabs.slice(5).map((t) => ({
                        key: t.key,
                        label: `${t.key === 'settings' ? '⚙️ ' : ''}${t.label}`,
                        onClick: () => handleNavChange(t.key as any),
                      })),
                      ...(canAccessPOS ? [{ key: 'storefront', label: '🛍️ Bán hàng', onClick: () => router.push('/') }] : []),
                    ],
                    selectedKeys: [activeNav],
                  }}
                  placement="bottomLeft"
                  trigger={['hover', 'click']}
                >
                  <button
                    type="button"
                    className={`relative flex items-center gap-1 h-20 text-[12px] transition-all whitespace-nowrap px-1 cursor-pointer select-none bg-transparent border-0 outline-none ${accessibleNavTabs.slice(5).some((t) => t.key === activeNav)
                        ? 'text-[#5d371f] font-medium after:content-[\'\'] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-[#5d371f]'
                        : 'text-[#51443d] hover:text-[#5d371f] font-normal after:content-[\'\'] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-transparent hover:after:bg-[#5d371f]/30'
                      }`}
                  >
                    <span>{accessibleNavTabs.slice(5).find((t) => t.key === activeNav)?.label || 'Thêm'}</span>
                    <EllipsisOutlined className="text-base" />
                  </button>
                </Dropdown>
              ) : canAccessPOS ? (
                <Link
                  href="/"
                  className="relative flex items-center gap-1.5 h-20 text-[12.5px] text-[#51443d] hover:text-[#5d371f] font-normal px-1.5 transition-all whitespace-nowrap cursor-pointer select-none no-underline"
                  title="Chuyển sang trang bán hàng"
                >
                  <ShopOutlined className="text-sm" />
                  <span>Bán hàng</span>
                </Link>
              ) : null}
            </nav>
          </div>

          {/* Right: Branch Selector (Desktop), Notifications & Profile */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Global Branch Selector Dropdown (Desktop only, mobile has dedicated full-width row below) */}
            <div className="hidden lg:flex items-center shrink-0">
              <Select
                value={selectedGlobalBranch || 'all'}
                onChange={(val) => {
                  setSelectedGlobalBranch(val);
                  setStoredAdminData(ADMIN_STORAGE_KEYS.SELECTED_BRANCH, val);
                  try {
                    localStorage.setItem('d2_selected_branch', val);
                    window.dispatchEvent(new CustomEvent('branch_changed', { detail: { branchName: val } }));
                  } catch { }
                  message.success(`Đã chuyển cơ sở: ${val === 'all' ? 'Tất cả chi nhánh' : val}`);
                }}
                className="w-48 sm:w-60 xl:w-72 text-xs font-semibold"
                popupMatchSelectWidth={false}
                placeholder="Chọn chi nhánh"
                options={[
                  ...(canSwitchBranch ? [{ value: 'all', label: '🏢 Tất cả chi nhánh (Toàn bộ)' }] : []),
                  ...displayBranches.map((b) => ({
                    value: b.name,
                    label: b.name,
                  })),
                ]}
              />
            </div>

            {/* Notifications Popover */}
            <NotificationPopover
              orders={ordersList}
              products={catalogList}
              onNavigateToTab={handleNavChange}
              onNavigateToProduct={handleNavigateToProduct}
              onNavigateToOrder={handleNavigateToOrder}
            />

            {/* User Profile */}
            <Dropdown menu={{ items: profileMenuItems }} placement="bottomRight" arrow trigger={['click']}>
              <div className="flex items-center gap-1.5 sm:gap-2 cursor-pointer p-1 sm:p-1.5 hover:bg-[#f5ece8] transition-colors border border-transparent hover:border-[#eae1dd] shrink-0 rounded-lg">
                <div className="flex flex-col justify-center text-left leading-none shrink-0">
                  <div className="text-xs font-bold text-[#1f1b19] leading-tight max-w-[120px] truncate">{cleanAdminName}</div>
                  <div className="text-[10px] text-[#83746c] leading-tight mt-0.5 truncate max-w-[120px]">{user?.roleName || user?.roleCode || (user?.role === 'admin' ? 'Quản trị viên tối cao' : 'Nhân viên')}</div>
                </div>
                <DownOutlined className="text-[9px] text-[#83746c] ml-0.5 shrink-0" />
              </div>
            </Dropdown>
          </div>
        </div>
      </Header>

      {/* Mobile Full-Width Branch Selector Row (Matches mockup) */}
      <div className="lg:hidden px-3.5 py-2 bg-[#fff8f5] border-b border-[#eae1dd]/60">
        <Select
          value={selectedGlobalBranch || 'all'}
          onChange={(val) => {
            setSelectedGlobalBranch(val);
            setStoredAdminData(ADMIN_STORAGE_KEYS.SELECTED_BRANCH, val);
            try {
              localStorage.setItem('d2_selected_branch', val);
              window.dispatchEvent(new CustomEvent('branch_changed', { detail: { branchName: val } }));
            } catch { }
            message.success(`Đã chuyển cơ sở: ${val === 'all' ? 'Tất cả chi nhánh' : val}`);
          }}
          className="w-full h-10 text-xs sm:text-sm font-semibold rounded-lg bg-white shadow-xs"
          popupMatchSelectWidth={false}
          placeholder="Chọn chi nhánh"
          options={[
            ...(canSwitchBranch ? [{ value: 'all', label: '🏢 Tất cả chi nhánh (Toàn bộ)' }] : []),
            ...displayBranches.map((b) => ({
              value: b.name,
              label: b.name,
            })),
          ]}
        />
      </div>



      {/* 2. MAIN CONTENT */}
      <Content className="p-3 sm:p-5 lg:p-6 w-full max-w-full overflow-x-hidden flex-1 flex flex-col min-h-[calc(100vh-80px)] pb-24 lg:pb-6">
        {activeNav === 'overview' && (
          <OverviewTab
            ordersList={ordersList}
            selectedGlobalBranch={selectedGlobalBranch}
            onNavigateTab={(tab) => handleNavChange(tab as any)}
          />
        )}

        {activeNav === 'orders' && (
          <OrdersTab
            ordersList={ordersList}
            setOrdersList={setOrdersList}
            catalogList={catalogList}
            customersList={customersList}
            branchesList={branchesList}
            selectedGlobalBranch={selectedGlobalBranch}
            onNavigateToProduct={handleNavigateToProduct}
            initialSearch={targetOrderSearch || undefined}
            onClearInitialSearch={handleClearOrderSearch}
          />
        )}

        {activeNav === 'inventory' && (
          <InventoryTab
            catalogList={catalogList}
            setCatalogList={setCatalogList}
            categoriesList={categoriesList}
            spacesList={spacesList}
            branchesList={branchesList}
            selectedGlobalBranch={selectedGlobalBranch}
            initialSearch={targetProductSearch || undefined}
            onClearInitialSearch={handleClearProductSearch}
            onNavigateToCreateImport={handleNavigateToCreateImport}
          />
        )}

        {activeNav === 'categories' && (
          <CategoriesTab
            categoriesList={categoriesList}
            setCategoriesList={setCategoriesList}
            spacesList={spacesList}
            setSpacesList={setSpacesList}
            selectedGlobalBranch={selectedGlobalBranch}
          />
        )}

        {activeNav === 'workshop' && (
          <WorkshopTab
            catalogList={catalogList}
            setCatalogList={setCatalogList}
            suppliersList={suppliersList}
            setSuppliersList={setSuppliersList}
            branchesList={branchesList}
            selectedGlobalBranch={selectedGlobalBranch}
            initialSubTab={(workshopSubTabState as any) || (searchParams.get('subTab') as any) || 'imports'}
            initialImportProduct={targetCreateImportProduct}
            initialImportMode={searchParams.get('mode') === 'create' || Boolean(targetCreateImportProduct) ? 'create' : 'list'}
            onClearInitialImportProduct={() => setTargetCreateImportProduct(null)}
            onNavigateToProduct={handleNavigateToProduct}
          />
        )}

        {activeNav === 'customers' && (
          <CustomersTab
            customersList={customersList}
            setCustomersList={setCustomersList}
            ordersList={ordersList}
            setOrdersList={setOrdersList}
            selectedGlobalBranch={selectedGlobalBranch}
            branchesList={branchesList}
          />
        )}

        {activeNav === 'suppliers' && (
          <SuppliersTab
            suppliersList={suppliersList}
            setSuppliersList={setSuppliersList}
            selectedGlobalBranch={selectedGlobalBranch}
          />
        )}

        {activeNav === 'settings' && (
          <SettingsTab
            branchesList={branchesList}
            setBranchesList={setBranchesList}
            rolesList={rolesList}
            employeesList={employeesList}
            setEmployeesList={setEmployeesList}
            selectedGlobalBranch={selectedGlobalBranch}
            activeSettingsTab={settingsActiveTab as any}
            onSettingsTabChange={(tab) => setSettingsActiveTab(tab as any)}
            onBackToFunctions={() => handleNavChange('functions')}
          />
        )}

        {/* 9. MÀN HÌNH TẤT CẢ CHỨC NĂNG (DÀNH CHO MOBILE / TABLET) */}
        {activeNav === 'functions' && (
          <div className="space-y-3.5 max-w-2xl mx-auto w-full animate-fadeIn pb-8">
            {/* Header / Profile Card */}
            <div className="bg-white rounded-2xl p-4 shadow-2xs">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-[#784e34] text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                    {cleanAdminName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-sm text-[#1f1b19] truncate">{cleanAdminName}</span>
                      <span className="text-[10px] font-semibold text-[#784e34] bg-[#f5ece8] px-2 py-0.5 rounded-full">
                        {user?.roleCode === 'SUPER_ADMIN' || user?.role === 'admin' ? 'Quản trị viên' : (user?.roleName || 'Nhân viên')}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">{user?.email || 'admin@d2luxury.vn'}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    logout();
                    router.push('/login');
                  }}
                  className="text-rose-600 hover:text-rose-700 bg-rose-50/80 hover:bg-rose-100 border-0 px-2.5 py-1.5 rounded-xl font-medium flex items-center gap-1 cursor-pointer text-xs transition-colors shrink-0"
                >
                  <LogoutOutlined />
                  <span>Đăng xuất</span>
                </button>
              </div>

              {/* Branch indicator */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Chi nhánh:</span>
                  <span className="font-medium text-[#784e34]">
                    {selectedGlobalBranch === 'all' ? 'Toàn bộ chi nhánh' : selectedGlobalBranch}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">D2 LUXURY</span>
              </div>
            </div>

            {/* Banner Bán hàng POS */}
            {canAccessPOS && (
              <Link
                href="/"
                style={{ backgroundColor: '#784e34', color: '#ffffff' }}
                className="flex items-center justify-between px-4 py-3.5 rounded-2xl !bg-[#784e34] hover:!bg-[#5d371f] !text-white shadow-sm no-underline active:scale-[0.99] transition-all border-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl !text-white shrink-0 shadow-inner"
                  >
                    <ShopOutlined style={{ color: '#ffffff', fontSize: '20px' }} />
                  </div>
                  <div>
                    <div style={{ color: '#ffffff' }} className="font-bold text-sm !text-white">
                      Chuyển sang Bán hàng (POS)
                    </div>
                    <div style={{ color: 'rgba(255, 255, 255, 0.85)' }} className="text-xs !text-white/85 mt-0.5">
                      Tạo đơn nhanh, quét mã & thanh toán
                    </div>
                  </div>
                </div>
                <RightOutlined style={{ color: '#ffffff', fontSize: '13px' }} className="!text-white" />
              </Link>
            )}

            {/* Categorized Function Sections - Simple & borderless */}
            {filteredFunctionGroups.map((group) => (
              <div key={group.title} className="bg-white rounded-2xl p-3.5 shadow-2xs space-y-2">
                <div className="px-1 flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-500">
                    {group.title}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {group.items.length} mục
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                  {group.items.map((item) => {
                    const isCurrent =
                      activeNav === item.tab &&
                      (item.subTab ? (workshopSubTabState || 'imports') === item.subTab : true) &&
                      (item.settingsTab ? settingsActiveTab === item.settingsTab : true);

                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handleNavChange(item.tab, item.subTab, item.settingsTab)}
                        className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl border-0 transition-all text-center cursor-pointer select-none active:scale-95 ${isCurrent
                            ? 'bg-[#f5ece8]/90 text-[#784e34]'
                            : 'bg-transparent hover:bg-[#fbf7f4] text-slate-700'
                          }`}
                      >
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-1.5 transition-transform ${isCurrent ? 'bg-[#ebd8ce] text-[#784e34]' : 'bg-[#f5ece8] text-[#784e34]'}`}>
                          {item.icon}
                        </div>
                        <span className={`text-[11.5px] leading-tight line-clamp-1 ${isCurrent ? 'text-[#784e34] font-bold' : 'text-slate-800 font-medium'}`}>
                          {item.label}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                          {item.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Content>

      {/* Mobile Bottom Navigation Bar (Chỉ hiển thị trên Mobile < lg) */}
      <nav
        className="block lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]"
        style={{ paddingBottom: 'max(0.25rem, env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="grid grid-cols-4 h-16">
          {/* 1. Tổng quan */}
          <button
            type="button"
            onClick={() => handleNavChange('overview')}
            className={`flex flex-col items-center justify-center gap-1 select-none transition-all border-0 bg-transparent cursor-pointer active:scale-95 ${activeNav === 'overview'
                ? 'text-[#784e34] font-bold'
                : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
          >
            <PieChartOutlined className={`text-xl transition-transform ${activeNav === 'overview' ? 'scale-110' : ''}`} />
            <span className="text-[11px] leading-tight">Tổng quan</span>
          </button>

          {/* 2. Nhập hàng */}
          <button
            type="button"
            onClick={() => handleNavChange('workshop', 'imports')}
            className={`flex flex-col items-center justify-center gap-1 select-none transition-all border-0 bg-transparent cursor-pointer active:scale-95 ${activeNav === 'workshop' && (workshopSubTabState === 'imports' || !workshopSubTabState)
                ? 'text-[#784e34] font-bold'
                : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
          >
            <InboxOutlined className={`text-xl transition-transform ${activeNav === 'workshop' && (workshopSubTabState === 'imports' || !workshopSubTabState) ? 'scale-110' : ''}`} />
            <span className="text-[11px] leading-tight">Nhập hàng</span>
          </button>

          {/* 3. Sản phẩm */}
          <button
            type="button"
            onClick={() => handleNavChange('inventory')}
            className={`flex flex-col items-center justify-center gap-1 select-none transition-all border-0 bg-transparent cursor-pointer active:scale-95 ${activeNav === 'inventory'
                ? 'text-[#784e34] font-bold'
                : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
          >
            <TagsOutlined className={`text-xl transition-transform ${activeNav === 'inventory' ? 'scale-110' : ''}`} />
            <span className="text-[11px] leading-tight">Sản phẩm</span>
          </button>

          {/* 4. Chức năng */}
          <button
            type="button"
            onClick={() => handleNavChange('functions')}
            className={`flex flex-col items-center justify-center gap-1 select-none transition-all border-0 bg-transparent cursor-pointer active:scale-95 ${activeNav === 'functions' || (!['overview', 'inventory'].includes(activeNav || '') && !(activeNav === 'workshop' && (workshopSubTabState === 'imports' || !workshopSubTabState)))
                ? 'text-[#784e34] font-bold'
                : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
          >
            <AppstoreOutlined className={`text-xl transition-transform ${activeNav === 'functions' || (!['overview', 'inventory'].includes(activeNav || '') && !(activeNav === 'workshop' && (workshopSubTabState === 'imports' || !workshopSubTabState))) ? 'scale-110' : ''}`} />
            <span className="text-[11px] leading-tight">Chức năng</span>
          </button>
        </div>
      </nav>
    </Layout>
  );
}

const DynamicAdminPageContent = dynamic(() => Promise.resolve(AdminPageContent), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#fff8f5] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#784e34] border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm font-semibold text-[#784e34]">Đang tải hệ thống quản trị...</span>
      </div>
    </div>
  ),
});

export default function AdminPage(props: {
  initialTab?: AdminNavTabKey;
  initialSubTab?: string;
  initialSettingsTab?: string;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fff8f5] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#784e34] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-semibold text-[#784e34]">Đang tải hệ thống quản trị...</span>
          </div>
        </div>
      }
    >
      <DynamicAdminPageContent {...props} />
    </Suspense>
  );
}
