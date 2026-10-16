'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
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
  Avatar,
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
} from '@ant-design/icons';
import {
  OverviewTab,
  OrdersTab,
  InventoryTab,
  CategoriesTab,
  WorkshopTab,
  CustomersTab,
  SuppliersTab,
  SettingsTab,
} from '@/components/admin/tabs';
import { branchApi } from '@/api/branchApi';
import { categoryApi } from '@/api/categoryApi';
import { spaceApi } from '@/api/spaceApi';
import { productApi } from '@/api/productApi';
import { supplierApi } from '@/api/supplierApi';
import { uomApi } from '@/api/uomApi';
import { customerApi } from '@/api/customerApi';
import { orderApi } from '@/api/orderApi';
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
  type AdminUom,
  type AdminRole,
  type AdminSpace,
} from '@/types/admin';
import {
  INITIAL_ORDERS,
  INITIAL_EMPLOYEES,
  INITIAL_BRANCHES,
  INITIAL_CUSTOMERS,
  INITIAL_SUPPLIERS,
  INITIAL_UOMS,
  INITIAL_ROLES,
} from '@/data/admin/mockData';

const { Header, Content } = Layout;

function AdminPageContent({
  initialTab = 'overview',
}: {
  initialTab?: 'overview' | 'orders' | 'inventory' | 'categories' | 'workshop' | 'customers' | 'suppliers' | 'branches' | 'settings';
}) {
  const { message } = App.useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading, logout, hasPermission, hasAnyPermission } = useAuth();

  const [mounted, setMounted] = useState(false);

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
    { key: 'overview', label: 'Tổng quan' },
    { key: 'orders', label: 'Đơn hàng', permission: 'orders.view' },
    { key: 'inventory', label: 'Sản phẩm', permission: 'catalog.products.view' },
    { key: 'categories', label: 'Danh mục', permissions: ['catalog.categories.view', 'catalog.spaces.view'] },
    { key: 'workshop', label: 'Kho & Showroom', permissions: ['inventory.warehouses.view', 'inventory.imports.view', 'inventory.returns.view', 'inventory.stocktake.view'] },
    { key: 'customers', label: 'Khách hàng', permissions: ['customers.profile.view', 'customers.consult.view'] },
    { key: 'settings', label: 'Cài đặt', permissions: ['settings.brand.view', 'settings.payment.view', 'settings.print.view', 'settings.branches.view', 'settings.uom.view', 'settings.employees.view', 'settings.rbac.view'] },
  ], []);

  const accessibleNavTabs: AdminNavTab[] = useMemo(() => {
    return ALL_ADMIN_TABS.filter((tab: AdminNavTab) => {
      if (!tab.permission && !tab.permissions) return true;
      if (tab.permission) return hasPermission(tab.permission);
      if (tab.permissions) return hasAnyPermission(tab.permissions);
      return true;
    });
  }, [ALL_ADMIN_TABS, hasPermission, hasAnyPermission]);

  const urlTab = searchParams.get('tab');
  const validUrlTab = (urlTab && ['overview', 'orders', 'inventory', 'categories', 'workshop', 'customers', 'suppliers', 'branches', 'settings'].includes(urlTab))
    ? (urlTab as 'overview' | 'orders' | 'inventory' | 'categories' | 'workshop' | 'customers' | 'suppliers' | 'branches' | 'settings')
    : null;

  const [activeNavState, setActiveNavState] = useState<'overview' | 'orders' | 'inventory' | 'categories' | 'workshop' | 'customers' | 'suppliers' | 'branches' | 'settings' | null>(validUrlTab);
  const [targetProductSearch, setTargetProductSearch] = useState<string | null>(searchParams.get('search') || searchParams.get('productSearch') || null);
  const [targetCreateImportProduct, setTargetCreateImportProduct] = useState<FeaturedCatalogProduct | null>(null);

  const activeNav = activeNavState || validUrlTab || initialTab;

  // Auto-switch to first accessible tab if current tab is forbidden for role
  useEffect(() => {
    if (!mounted || !user) return;
    const isCurrentAllowed = accessibleNavTabs.some((t: AdminNavTab) => t.key === activeNav);
    if (!isCurrentAllowed && accessibleNavTabs.length > 0) {
      setActiveNavState(accessibleNavTabs[0].key as any);
    }
  }, [activeNav, accessibleNavTabs, mounted, user]);

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
  const [uomsList, setUomsList] = useState<AdminUom[]>([]);
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
        } catch {}
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
    setEmployeesList(getStoredAdminData(ADMIN_STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES));
    setCustomersList(getStoredAdminData(ADMIN_STORAGE_KEYS.CUSTOMERS, []));
    setSuppliersList(getStoredAdminData(ADMIN_STORAGE_KEYS.SUPPLIERS, []));
    setUomsList(getStoredAdminData(ADMIN_STORAGE_KEYS.UOMS, []));
    setRolesList(getStoredAdminData(ADMIN_STORAGE_KEYS.ROLES, INITIAL_ROLES));
    const storedBranch = getStoredAdminData(ADMIN_STORAGE_KEYS.SELECTED_BRANCH, '');
    if (storedBranch && storedBranch !== 'all') {
      setSelectedGlobalBranch(storedBranch);
    }

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
    if (activeNav === 'workshop' || activeNav === 'inventory' || activeNav === 'overview') {
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
            if (prev && prev !== 'all' && branches.some((b) => b.name === prev)) {
              return prev;
            }
            const fallbackBranch = branches[0]?.name || '';
            setStoredAdminData(ADMIN_STORAGE_KEYS.SELECTED_BRANCH, fallbackBranch);
            return fallbackBranch;
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
          if (prev && prev !== 'all' && cleaned.some((b: AdminBranch) => b.name === prev)) {
            return prev;
          }
          const fallbackBranch = cleaned[0]?.name || '';
          setStoredAdminData(ADMIN_STORAGE_KEYS.SELECTED_BRANCH, fallbackBranch);
          return fallbackBranch;
        });
      }
    };

    // Fetch categories directly from Backend API (Real Data)
    const loadCategories = async () => {
      try {
        const categories = await categoryApi.getCategories();
        if (categories && Array.isArray(categories)) {
          setCategoriesList(categories);
          return;
        }
      } catch (err) {
        console.warn('Could not fetch categories from API:', err);
      }
      setCategoriesList([]);
    };

    // Fetch spaces directly from Backend API (Real Data)
    const loadSpaces = async () => {
      try {
        const spaces = await spaceApi.getSpaces();
        if (spaces && Array.isArray(spaces)) {
          setSpacesList(spaces);
          return;
        }
      } catch (err) {
        console.warn('Could not fetch spaces from API:', err);
      }
      setSpacesList([]);
    };

    // Fetch suppliers directly from Backend API (Real Data)
    const loadSuppliers = async () => {
      try {
        const suppliers = await supplierApi.getSuppliers();
        if (suppliers && Array.isArray(suppliers) && suppliers.length > 0) {
          setSuppliersList(suppliers);
          setStoredAdminData(ADMIN_STORAGE_KEYS.SUPPLIERS, suppliers);
          return;
        }
      } catch (err) {
        console.warn('Could not fetch suppliers from API, using fallback:', err);
      }
      setSuppliersList(getStoredAdminData(ADMIN_STORAGE_KEYS.SUPPLIERS, []));
    };

    // Fetch UOMs directly from Backend API (Real Data)
    const loadUoms = async () => {
      try {
        const uoms = await uomApi.getUoms();
        if (uoms && Array.isArray(uoms)) {
          setUomsList(uoms);
          setStoredAdminData(ADMIN_STORAGE_KEYS.UOMS, uoms);
          return;
        }
      } catch (err) {
        console.warn('Could not fetch UOMs from API, using fallback:', err);
      }
      setUomsList(getStoredAdminData(ADMIN_STORAGE_KEYS.UOMS, []));
    };

    // Fetch Customers directly from Backend API (Real Data)
    const loadCustomers = async () => {
      try {
        const customers = await customerApi.getCustomers();
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
        const orders = await orderApi.getOrders();
        if (orders && Array.isArray(orders)) {
          setOrdersList(orders);
          setStoredAdminData(ADMIN_STORAGE_KEYS.ORDERS, orders);
          return;
        }
      } catch (err) {
        console.warn('Could not fetch orders from API, using fallback:', err);
      }
      setOrdersList(getStoredAdminData(ADMIN_STORAGE_KEYS.ORDERS, []));
    };

    // Fetch Roles directly from Backend API (Real Data)
    const loadRoles = async () => {
      try {
        const roles = await roleApi.getRoles();
        if (roles && Array.isArray(roles) && roles.length > 0) {
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
        if (emps && Array.isArray(emps) && emps.length > 0) {
          setEmployeesList(emps);
          setStoredAdminData(ADMIN_STORAGE_KEYS.EMPLOYEES, emps);
          return;
        }
      } catch (err) {
        console.warn('Could not fetch employees from API, using fallback:', err);
      }
      setEmployeesList(getStoredAdminData(ADMIN_STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES));
    };

    // 1. Always load common master data (branches, uoms)
    loadBranches();
    loadUoms();

    // 2. Load tab-specific datasets lazily based on active tab
    if (activeNav === 'inventory' || activeNav === 'categories') {
      loadCategories();
      loadSpaces();
    } else if (activeNav === 'overview') {
      loadCategories();
      loadSpaces();
    } else if (activeNav === 'workshop') {
      loadProducts();
      loadSuppliers();
    } else if (activeNav === 'orders') {
      loadOrders();
      loadCustomers();
    } else if (activeNav === 'customers') {
      loadCustomers();
    } else if (activeNav === 'suppliers') {
      loadSuppliers();
    } else if (activeNav === 'settings') {
      loadRoles();
      loadEmployees();
    }
  }, [activeNav]);

  // Settings Sub-tab state
  const urlSettingsTab = searchParams.get('settingsTab');
  const validSettingsTab = (urlSettingsTab && ['store', 'company', 'payment', 'print-templates', 'branches', 'uom', 'roles', 'users', 'employees', 'permissions'].includes(urlSettingsTab))
    ? (urlSettingsTab as any)
    : null;
  const [settingsActiveTabState, setSettingsActiveTabState] = useState<string | null>(validSettingsTab);
  const settingsActiveTab = settingsActiveTabState || validSettingsTab || 'company';
  const setSettingsActiveTab = (tab: string) => {
    setSettingsActiveTabState(tab);
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_settings_tab', tab);
      const url = new URL(window.location.href);
      url.searchParams.set('settingsTab', tab);
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
    if (validUrlTab) {
      setActiveNavState(validUrlTab);
    } else if (initialTab) {
      setActiveNavState(initialTab);
    }
  }, [validUrlTab, initialTab]);

  const handleNavChange = (
    tab: 'overview' | 'orders' | 'inventory' | 'categories' | 'workshop' | 'customers' | 'suppliers' | 'branches' | 'settings'
  ) => {
    const targetTab = tab === 'branches' ? 'settings' : tab;
    setActiveNavState(targetTab);

    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_last_tab', targetTab);
    }

    const routeMap: Record<string, string> = {
      overview: '/admin',
      orders: '/admin/orders',
      inventory: '/admin/inventory',
      categories: '/admin/categories',
      workshop: '/admin/workshop',
      customers: '/admin/customers',
      suppliers: '/admin/workshop?subTab=suppliers',
      settings: tab === 'branches' ? '/admin/settings?settingsTab=branches' : '/admin/settings',
    };

    const targetUrl = routeMap[targetTab] || `/admin?tab=${targetTab}`;
    router.push(targetUrl);
  };

  const profileMenuItems: MenuProps['items'] = [
    {
      key: 'user-info',
      label: (
        <div className="py-1">
          <div className="font-bold text-slate-800">{user?.name || 'Nguyễn Văn Luân'}</div>
          <div className="text-xs text-slate-500">{user?.email || 'admin@mocgia.vn'}</div>
          <Tag color="gold" className="mt-1 text-[10px]">
            {user?.role || 'Quản trị viên'}
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

  if (!mounted || isLoading || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fff8f5]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-[#5d371f] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-[#83746c]">Đang kiểm tra quyền quản trị D2 LUXURY...</span>
        </div>
      </div>
    );
  }

  return (
    <Layout className="min-h-screen bg-[#fff8f5] flex flex-col">
      <Header
        style={{ height: '80px', lineHeight: 'normal' }}
        className="!bg-[#fff8f5]/95 backdrop-blur-xl border-b border-[#eae1dd]/60 !px-0 flex items-center sticky top-0 z-50 shadow-[0_1px_8px_rgba(0,0,0,0.04)] !leading-none w-full shrink-0"
      >
        <div className="h-20 w-full px-3 sm:px-5 lg:px-6 xl:px-8 flex items-center justify-between flex-nowrap whitespace-nowrap gap-2 sm:gap-4">
          {/* Left: Brand + Main Nav */}
          <div className="flex items-center gap-3 xl:gap-5 2xl:gap-6 min-w-0">
            <Link href="/admin" className="flex items-center gap-2 sm:gap-2.5 group shrink-0 select-none">
              <img
                alt={storeHeaderInfo.brandName || 'Logo'}
                className="h-9 sm:h-10 w-auto object-contain transition-transform group-hover:scale-105"
                src={storeHeaderInfo.logoUrl || '/logo.png'}
              />
              <div className="flex flex-col justify-center">
                <span className="font-headline-sm text-sm sm:text-base text-[#5d371f] leading-none tracking-tight font-medium">
                  {storeHeaderInfo.brandName || 'D2 LUXURY'}
                </span>
                <span className="font-label-sm text-[8px] text-[#83746c] tracking-wider mt-0.5 font-normal">
                  {storeHeaderInfo.companyName || 'Nội Thất Gỗ Tự Nhiên'}
                </span>
              </div>
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

              {/* Bán hàng (Quay lại trang bán hàng) */}
              <Link
                href="/"
                className="relative flex items-center gap-1.5 h-20 text-[13px] 2xl:text-[13.5px] text-[#51443d] hover:text-[#5d371f] font-normal px-1.5 2xl:px-2 transition-all whitespace-nowrap cursor-pointer select-none no-underline after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-transparent hover:after:bg-[#5d371f]/30"
                title="Chuyển sang trang bán hàng"
              >
                <ShopOutlined className="text-sm" />
                <span>Bán hàng</span>
              </Link>
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
                      { key: 'storefront', label: '🛍️ Bán hàng', onClick: () => router.push('/') },
                    ],
                    selectedKeys: [activeNav],
                  }}
                  placement="bottomLeft"
                  trigger={['hover', 'click']}
                >
                  <button
                    type="button"
                    className={`relative flex items-center gap-1 h-20 text-[12px] transition-all whitespace-nowrap px-1 cursor-pointer select-none bg-transparent border-0 outline-none ${
                      accessibleNavTabs.slice(5).some((t) => t.key === activeNav)
                        ? 'text-[#5d371f] font-medium after:content-[\'\'] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-[#5d371f]'
                        : 'text-[#51443d] hover:text-[#5d371f] font-normal after:content-[\'\'] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-transparent hover:after:bg-[#5d371f]/30'
                    }`}
                  >
                    <span>{accessibleNavTabs.slice(5).find((t) => t.key === activeNav)?.label || 'Thêm'}</span>
                    <EllipsisOutlined className="text-base" />
                  </button>
                </Dropdown>
              ) : (
                <Link
                  href="/"
                  className="relative flex items-center gap-1.5 h-20 text-[12.5px] text-[#51443d] hover:text-[#5d371f] font-normal px-1.5 transition-all whitespace-nowrap cursor-pointer select-none no-underline"
                  title="Chuyển sang trang bán hàng"
                >
                  <ShopOutlined className="text-sm" />
                  <span>Bán hàng</span>
                </Link>
              )}
            </nav>
          </div>

          {/* Right: Branch Selector, Notifications & Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Global Branch Selector Dropdown */}
            <div className="flex items-center shrink-0">
              <Select
                value={selectedGlobalBranch && selectedGlobalBranch !== 'all' ? selectedGlobalBranch : (displayBranches[0]?.name || undefined)}
                onChange={(val) => {
                  setSelectedGlobalBranch(val);
                  setStoredAdminData(ADMIN_STORAGE_KEYS.SELECTED_BRANCH, val);
                  try {
                    localStorage.setItem('d2_selected_branch', val);
                    window.dispatchEvent(new CustomEvent('branch_changed', { detail: { branchName: val } }));
                  } catch {}
                  message.success(`Đã chuyển cơ sở: ${val}`);
                }}
                className="w-48 sm:w-60 xl:w-72 text-xs font-semibold"
                popupMatchSelectWidth={false}
                placeholder="Chọn chi nhánh"
                options={displayBranches.map((b) => ({
                  value: b.name,
                  label: b.name,
                }))}
              />
            </div>

            {/* Notifications */}
            <Badge dot offset={[-2, 2]} color="#5d371f">
              <Button
                type="text"
                icon={<BellOutlined className="text-base text-[#2e1d13] hover:text-[#5d371f]" />}
                className="hover:!bg-[#f5ece8] flex items-center justify-center shrink-0"
              />
            </Badge>

            {/* User Profile */}
            <Dropdown menu={{ items: profileMenuItems }} placement="bottomRight" arrow trigger={['click']}>
              <div className="flex items-center gap-1.5 sm:gap-2 cursor-pointer p-1 sm:p-1.5 hover:bg-[#f5ece8] transition-colors border border-transparent hover:border-[#eae1dd] shrink-0 rounded-lg">
                <Avatar
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                  size={32}
                  className="border border-[#784e34] shrink-0"
                />
                <div className="flex flex-col justify-center text-left leading-none shrink-0">
                  <div className="text-xs font-bold text-[#1f1b19] leading-tight max-w-[110px] truncate">{user?.name || 'Quản trị viên'}</div>
                  <div className="text-[10px] text-[#83746c] leading-tight mt-0.5 truncate max-w-[110px]">{user?.roleName || user?.roleCode || (user?.role === 'admin' ? 'Quản trị viên' : 'Nhân viên')}</div>
                </div>
              </div>
            </Dropdown>
          </div>
        </div>
      </Header>

      {/* 2. MAIN CONTENT */}
      <Content className="p-4 sm:p-5 lg:p-6 w-full max-w-full overflow-x-hidden flex-1 flex flex-col min-h-[calc(100vh-80px)]">
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
          />
        )}

        {activeNav === 'inventory' && (
          <InventoryTab
            catalogList={catalogList}
            setCatalogList={setCatalogList}
            categoriesList={categoriesList}
            spacesList={spacesList}
            uomsList={uomsList}
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
            uomsList={uomsList}
            branchesList={branchesList}
            selectedGlobalBranch={selectedGlobalBranch}
            initialSubTab={(searchParams.get('subTab') as any) || (targetCreateImportProduct ? 'imports' : 'warehouses')}
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
            uomsList={uomsList}
            setUomsList={setUomsList}
            rolesList={rolesList}
            employeesList={employeesList}
            setEmployeesList={setEmployeesList}
            selectedGlobalBranch={selectedGlobalBranch}
            activeSettingsTab={settingsActiveTab as any}
            onSettingsTabChange={(tab) => setSettingsActiveTab(tab as any)}
          />
        )}
      </Content>
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
  initialTab?: 'overview' | 'orders' | 'inventory' | 'categories' | 'workshop' | 'customers' | 'suppliers' | 'branches' | 'settings';
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
