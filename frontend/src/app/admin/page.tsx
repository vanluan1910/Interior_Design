'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
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
} from '@/types/admin';
import {
  INITIAL_ORDERS,
  FEATURED_CATALOG,
  INITIAL_CATEGORIES,
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
  const { user, logout } = useAuth();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const urlTab = searchParams.get('tab');
  const validUrlTab = (urlTab && ['overview', 'orders', 'inventory', 'categories', 'workshop', 'customers', 'suppliers', 'branches', 'settings'].includes(urlTab))
    ? (urlTab as 'overview' | 'orders' | 'inventory' | 'categories' | 'workshop' | 'customers' | 'suppliers' | 'branches' | 'settings')
    : null;

  const [activeNavState, setActiveNavState] = useState<'overview' | 'orders' | 'inventory' | 'categories' | 'workshop' | 'customers' | 'suppliers' | 'branches' | 'settings' | null>(validUrlTab);

  const activeNav = activeNavState || validUrlTab || initialTab;

  // Data State with LocalStorage Persistence (SSR Safe)
  const [ordersList, setOrdersList] = useState<OrderRow[]>(INITIAL_ORDERS);
  const [catalogList, setCatalogList] = useState<FeaturedCatalogProduct[]>(FEATURED_CATALOG);
  const [categoriesList, setCategoriesList] = useState<AdminCategory[]>(INITIAL_CATEGORIES);
  const [employeesList, setEmployeesList] = useState<AdminEmployee[]>(INITIAL_EMPLOYEES);
  const [branchesList, setBranchesList] = useState<AdminBranch[]>(INITIAL_BRANCHES);
  const [customersList, setCustomersList] = useState<AdminCustomer[]>(INITIAL_CUSTOMERS);
  const [suppliersList, setSuppliersList] = useState<AdminSupplier[]>(INITIAL_SUPPLIERS);
  const [uomsList, setUomsList] = useState<AdminUom[]>(INITIAL_UOMS);
  const [rolesList, setRolesList] = useState<AdminRole[]>(INITIAL_ROLES);

  // Global Branch Selection State (in Header)
  const [selectedGlobalBranch, setSelectedGlobalBranch] = useState<string>('all');

  // Load stored data on mount safely after hydration
  useEffect(() => {
    setOrdersList(getStoredAdminData(ADMIN_STORAGE_KEYS.ORDERS, INITIAL_ORDERS));
    setCategoriesList(getStoredAdminData(ADMIN_STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES));
    setEmployeesList(getStoredAdminData(ADMIN_STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES));
    setBranchesList(getStoredAdminData(ADMIN_STORAGE_KEYS.BRANCHES, INITIAL_BRANCHES));
    setCustomersList(getStoredAdminData(ADMIN_STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS));
    setSuppliersList(getStoredAdminData(ADMIN_STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS));
    setUomsList(getStoredAdminData(ADMIN_STORAGE_KEYS.UOMS, INITIAL_UOMS));
    setRolesList(getStoredAdminData(ADMIN_STORAGE_KEYS.ROLES, INITIAL_ROLES));
  }, []);

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

  // Sync to localStorage
  useEffect(() => {
    if (mounted) setStoredAdminData(ADMIN_STORAGE_KEYS.ORDERS, ordersList);
  }, [ordersList, mounted]);

  useEffect(() => {
    if (mounted) setStoredAdminData(ADMIN_STORAGE_KEYS.CATEGORIES, categoriesList);
  }, [categoriesList, mounted]);

  useEffect(() => {
    if (mounted) setStoredAdminData(ADMIN_STORAGE_KEYS.EMPLOYEES, employeesList);
  }, [employeesList, mounted]);

  useEffect(() => {
    if (mounted) setStoredAdminData(ADMIN_STORAGE_KEYS.CUSTOMERS, customersList);
  }, [customersList, mounted]);

  useEffect(() => {
    if (mounted) setStoredAdminData(ADMIN_STORAGE_KEYS.SUPPLIERS, suppliersList);
  }, [suppliersList, mounted]);

  useEffect(() => {
    if (mounted) setStoredAdminData(ADMIN_STORAGE_KEYS.BRANCHES, branchesList);
  }, [branchesList, mounted]);

  useEffect(() => {
    if (mounted) setStoredAdminData(ADMIN_STORAGE_KEYS.UOMS, uomsList);
  }, [uomsList, mounted]);

  useEffect(() => {
    if (mounted) setStoredAdminData(ADMIN_STORAGE_KEYS.ROLES, rolesList);
  }, [rolesList, mounted]);

  const handleNavChange = (
    tab: 'overview' | 'orders' | 'inventory' | 'categories' | 'workshop' | 'customers' | 'suppliers' | 'branches' | 'settings'
  ) => {
    if (tab === 'branches') {
      setActiveNavState('settings');
      setSettingsActiveTab('branches');
      const url = new URL(window.location.href);
      url.searchParams.set('tab', 'settings');
      url.searchParams.set('settingsTab', 'branches');
      window.history.replaceState({}, '', url.toString());
      return;
    }
    setActiveNavState(tab);
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_last_tab', tab);
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState({}, '', url.toString());
    }
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
      key: 'storefront',
      icon: <ShopOutlined />,
      label: 'Quay về trang bán hàng',
      onClick: () => router.push('/'),
    },
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
                alt="Logo Nội Thất D2 LUXURY"
                className="h-9 sm:h-10 w-auto object-contain transition-transform group-hover:scale-105"
                src="/logo.png"
              />
              <div className="flex flex-col justify-center">
                <span className="font-headline-sm text-sm sm:text-base text-[#5d371f] leading-none tracking-tight font-medium">
                  D2 LUXURY
                </span>
                <span className="font-label-sm text-[8px] text-[#83746c] tracking-wider mt-0.5 font-normal">
                  Nội Thất Gỗ Tự Nhiên
                </span>
              </div>
            </Link>

            {/* Desktop Navigation (XL screens >= 1280px show all tabs directly) */}
            <nav className="hidden xl:flex items-center gap-1.5 2xl:gap-3.5 h-20">
              {[
                { key: 'overview', label: 'Tổng quan' },
                { key: 'orders', label: 'Đơn hàng' },
                { key: 'inventory', label: 'Sản phẩm' },
                { key: 'categories', label: 'Danh mục' },
                { key: 'workshop', label: 'Kho & Showroom' },
                { key: 'customers', label: 'Khách hàng' },
                { key: 'settings', label: 'Cài đặt' },
              ].map((tab) => (
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
            </nav>

            {/* Tablet / Compact Desktop Navigation (LG screens: 6 primary tabs + "..." Dropdown) */}
            <nav className="hidden lg:flex xl:hidden items-center gap-1.5 h-20">
              {[
                { key: 'overview', label: 'Tổng quan' },
                { key: 'orders', label: 'Đơn hàng' },
                { key: 'inventory', label: 'Sản phẩm' },
                { key: 'categories', label: 'Danh mục' },
                { key: 'workshop', label: 'Kho & Showroom' },
                { key: 'customers', label: 'Khách hàng' },
              ].map((tab) => (
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
              <Dropdown
                menu={{
                  items: [
                    { key: 'settings', label: '⚙️ Cài đặt hệ thống', onClick: () => handleNavChange('settings') },
                  ],
                  selectedKeys: [activeNav],
                }}
                placement="bottomLeft"
                trigger={['hover', 'click']}
              >
                <button
                  type="button"
                  className={`relative flex items-center gap-1 h-20 text-[12.5px] transition-all whitespace-nowrap px-1.5 cursor-pointer select-none bg-transparent border-0 outline-none ${activeNav === 'settings'
                      ? 'text-[#5d371f] font-medium after:content-[\'\'] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-[#5d371f]'
                      : 'text-[#51443d] hover:text-[#5d371f] font-normal after:content-[\'\'] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-transparent hover:after:bg-[#5d371f]/30'
                    }`}
                >
                  {activeNav === 'settings' ? (
                    <span>Cài đặt</span>
                  ) : (
                    <span>Thêm</span>
                  )}
                  <EllipsisOutlined className="text-base" />
                </button>
              </Dropdown>
            </nav>
          </div>

          {/* Right: Branch Selector, Notifications & Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Global Branch Selector Dropdown */}
            <div className="flex items-center shrink-0">
              <Select
                value={selectedGlobalBranch}
                onChange={(val) => {
                  setSelectedGlobalBranch(val);
                  message.success(`Đã chuyển cơ sở: ${val === 'all' ? 'Tất cả chi nhánh' : val}`);
                }}
                className="w-48 sm:w-60 xl:w-72 text-xs font-semibold"
                popupMatchSelectWidth={false}
                placeholder="Chọn chi nhánh"
                options={[
                  { value: 'all', label: 'Tất cả chi nhánh' },
                  ...branchesList.map((b) => ({
                    value: b.name,
                    label: b.name,
                  })),
                ]}
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
                  <div className="text-[10px] text-[#83746c] leading-tight mt-0.5">d2luxury.admin</div>
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
            selectedGlobalBranch={selectedGlobalBranch}
          />
        )}

        {activeNav === 'inventory' && (
          <InventoryTab
            catalogList={catalogList}
            setCatalogList={setCatalogList}
            categoriesList={categoriesList}
            selectedGlobalBranch={selectedGlobalBranch}
          />
        )}

        {activeNav === 'categories' && (
          <CategoriesTab
            categoriesList={categoriesList}
            setCategoriesList={setCategoriesList}
            selectedGlobalBranch={selectedGlobalBranch}
          />
        )}

        {activeNav === 'workshop' && (
          <WorkshopTab
            catalogList={catalogList}
            suppliersList={suppliersList}
            setSuppliersList={setSuppliersList}
            branchesList={branchesList}
            selectedGlobalBranch={selectedGlobalBranch}
          />
        )}

        {activeNav === 'customers' && (
          <CustomersTab
            customersList={customersList}
            setCustomersList={setCustomersList}
            selectedGlobalBranch={selectedGlobalBranch}
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
            rolesList={rolesList}
            employeesList={employeesList}
            selectedGlobalBranch={selectedGlobalBranch}
            activeSettingsTab={settingsActiveTab as any}
            onSettingsTabChange={(tab) => setSettingsActiveTab(tab as any)}
          />
        )}
      </Content>
    </Layout>
  );
}

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
      <AdminPageContent {...props} />
    </Suspense>
  );
}
