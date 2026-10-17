'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ADMIN_STORAGE_KEYS,
  getStoredAdminData,
  setStoredAdminData,
} from '@/utils/adminStorage';
import {
  Button,
  Input,
  InputNumber,
  Select,
  Tag,
  Segmented,
  Form,
  Row,
  Col,
  Space,
  Switch,
  Divider,
  Modal,
  Popconfirm,
  Avatar,
  Tooltip,
  App,
  Upload,
  Card,
  Alert,
  Table,
  Drawer,
  Checkbox,
  Tabs,
} from 'antd';
import {
  SettingOutlined,
  CreditCardOutlined,
  SaveOutlined,
  ShopOutlined,
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  TeamOutlined,
  KeyOutlined,
  EnvironmentOutlined,
  BankOutlined,
  AppstoreOutlined,
  InfoCircleOutlined,
  SearchOutlined,
  CheckOutlined,
  UploadOutlined,
  GlobalOutlined,
  PhoneOutlined,
  MailOutlined,
  LinkOutlined,
  QrcodeOutlined,
  PrinterOutlined,
  IdcardOutlined,
  ReloadOutlined,
  SafetyOutlined,
  CrownOutlined,
  PictureOutlined,
  FileTextOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { VietQrCard, getBankBin } from '@/components/common/VietQrCard';
import { useAuth } from '@/context/AuthContext';
import { AdminSearchInput, AdminFormDrawer } from '@/components/admin';
import { branchApi } from '@/api/branchApi';
import { roleApi } from '@/api/roleApi';
import { employeeApi } from '@/api/employeeApi';
import { settingsApi, type VietQrBank } from '@/api/settingsApi';
import { EmployeesTab } from './EmployeesTab';
import { PrintTemplatesSettings } from './PrintTemplatesSettings';
import { WarehousesSettings } from './WarehousesSettings';
import type {
  AdminBranch,
  AdminRole,
  AdminEmployee,
  AdminCompanyInfo,
  PermissionDefinition,
  PermissionGroup,
  PermissionSubGroup,
} from '@/types/admin';
import {
  INITIAL_BRANCHES,
  INITIAL_ROLES,
  INITIAL_EMPLOYEES,
  PERMISSION_GROUPS,
  INITIAL_COMPANY_INFO,
} from '@/data/admin/mockData';

const { Option } = Select;

export interface SettingsTabProps {
  branchesList?: AdminBranch[];
  setBranchesList?: React.Dispatch<React.SetStateAction<AdminBranch[]>>;
  rolesList?: AdminRole[];
  setRolesList?: React.Dispatch<React.SetStateAction<AdminRole[]>>;
  onUpdateRoles?: (roles: AdminRole[] | ((prev: AdminRole[]) => AdminRole[])) => void;
  employeesList?: AdminEmployee[];
  setEmployeesList?: React.Dispatch<React.SetStateAction<AdminEmployee[]>>;
  selectedGlobalBranch?: string;
  activeSettingsTab?: 'company' | 'payment' | 'print-templates' | 'branches' | 'warehouses' | 'employees' | 'permissions';
  onSettingsTabChange?: (tab: 'company' | 'payment' | 'print-templates' | 'branches' | 'warehouses' | 'employees' | 'permissions') => void;
}

interface SettingsMenuItem {
  key: 'company' | 'payment' | 'print-templates' | 'branches' | 'warehouses' | 'employees' | 'permissions';
  icon: React.ReactNode;
  label: string;
  badge?: React.ReactNode;
  group: 'general' | 'operations' | 'security';
}

export function SettingsTab({
  branchesList = INITIAL_BRANCHES,
  setBranchesList,
  rolesList = INITIAL_ROLES,
  setRolesList,
  onUpdateRoles,
  employeesList = INITIAL_EMPLOYEES,
  setEmployeesList,
  selectedGlobalBranch = 'all',
  activeSettingsTab,
  onSettingsTabChange,
}: SettingsTabProps) {
  const { hasPermission } = useAuth();
  const { message, modal } = App.useApp();
  const searchParams = useSearchParams();

  const urlSettingsTab = searchParams.get('settingsTab');
  const validSettingsTab = (urlSettingsTab && ['company', 'payment', 'print-templates', 'branches', 'warehouses', 'employees', 'permissions'].includes(urlSettingsTab))
    ? (urlSettingsTab as 'company' | 'payment' | 'print-templates' | 'branches' | 'warehouses' | 'employees' | 'permissions')
    : null;

  const [settingsActiveTab, setSettingsActiveTabState] = useState<'company' | 'payment' | 'print-templates' | 'branches' | 'warehouses' | 'employees' | 'permissions'>(
    activeSettingsTab || validSettingsTab || 'company'
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const sTab = sp.get('settingsTab') || localStorage.getItem('admin_settings_tab');
      if (sTab && ['company', 'payment', 'print-templates', 'branches', 'warehouses', 'employees', 'permissions'].includes(sTab)) {
        setSettingsActiveTabState(sTab as any);
      }
    }
  }, []);

  useEffect(() => {
    if (activeSettingsTab && activeSettingsTab !== settingsActiveTab) {
      setSettingsActiveTabState(activeSettingsTab);
    }
  }, [activeSettingsTab]);

  const setSettingsActiveTab = (tab: 'company' | 'payment' | 'print-templates' | 'branches' | 'warehouses' | 'employees' | 'permissions') => {
    setSettingsActiveTabState(tab);
    if (onSettingsTabChange) {
      onSettingsTabChange(tab);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_settings_tab', tab);
      const url = new URL(window.location.href);
      url.searchParams.set('tab', 'settings');
      url.searchParams.set('settingsTab', tab);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const DEFAULT_PAYMENT_SETTINGS = {
    bankName: '',
    accountNumber: '',
    accountName: '',
    branchName: '',
    defaultDeposit: 30,
    bankBin: '',
    vietQrTemplate: 'compact',
  };

  // Form and state for Payment Settings with live VietQR preview
  const [paymentForm] = Form.useForm();
  const [paymentSettings, setPaymentSettings] = useState(DEFAULT_PAYMENT_SETTINGS);

  // ================= DOMACO POS COMPANY INFO STATE & FORM =================
  const EMPTY_COMPANY_INFO: AdminCompanyInfo = {
    code: 'D2L-001',
    companyName: 'CÔNG TY CỔ PHẦN NỘI THẤT CAO CẤP D2 LUXURY',
    brandName: 'D2 LUXURY DESIGN',
    taxId: '0343136004',
    representative: 'Nguyễn Văn Luận',
    representativeRole: 'Tổng Giám Đốc',
    businessSector: '',
    phone: '0343 136 004',
    hotline: '0967 323 335',
    email: 'contact@d2luxury.vn',
    website: 'https://d2luxury.vn',
    zalo: 'https://zalo.me/0967323335',
    fanpage: 'https://www.facebook.com/profile.php?id=61575009790250',
    headquarters: 'Ngã 4 Cửa Cạn, Đặc khu Phú Quốc, tỉnh Kiên Giang',
    warehouseAddress: 'Khu tiểu thủ công nghiệp Cửa Cạn, TP. Phú Quốc, tỉnh Kiên Giang',
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

  const [companyInfo, setCompanyInfo] = useState<AdminCompanyInfo>(EMPTY_COMPANY_INFO);
  const [companyForm] = Form.useForm<AdminCompanyInfo>();
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // ================= DOMACO POS BRANCHES STATE & HANDLERS =================
  const [currentBranches, setCurrentBranches] = useState<AdminBranch[]>(branchesList || []);
  const [currentEmployees, setCurrentEmployees] = useState<AdminEmployee[]>(employeesList || INITIAL_EMPLOYEES);
  const [warehousesCount, setWarehousesCount] = useState<number>(() => {
    const stored = getStoredAdminData<any[]>(ADMIN_STORAGE_KEYS.WAREHOUSES, []);
    return stored.length;
  });

  const loadCompanyInfoFromApi = async () => {
    try {
      const rawInfo: any = await settingsApi.getCompanyInfo();
      if (rawInfo) {
        let cleanHq = rawInfo.headquarters || rawInfo.Headquarters || rawInfo.address || rawInfo.Address || EMPTY_COMPANY_INFO.headquarters;
        if (cleanHq && (cleanHq.includes('NgÃ£') || cleanHq.includes('Cá»­a') || cleanHq.includes('Ä‘áº·c'))) {
          cleanHq = 'Ngã 4 Cửa Cạn, Đặc khu Phú Quốc, tỉnh Kiên Giang';
        }

        const merged: AdminCompanyInfo = {
          ...EMPTY_COMPANY_INFO,
          code: rawInfo.code || rawInfo.Code || EMPTY_COMPANY_INFO.code,
          companyName: rawInfo.companyName || rawInfo.CompanyName || EMPTY_COMPANY_INFO.companyName,
          brandName: rawInfo.brandName || rawInfo.BrandName || EMPTY_COMPANY_INFO.brandName,
          taxId: rawInfo.taxId || rawInfo.TaxId || EMPTY_COMPANY_INFO.taxId,
          representative: rawInfo.representative || rawInfo.Representative || EMPTY_COMPANY_INFO.representative,
          representativeRole: rawInfo.representativeRole || rawInfo.RepresentativeRole || EMPTY_COMPANY_INFO.representativeRole,
          businessSector: rawInfo.businessSector || rawInfo.BusinessSector || EMPTY_COMPANY_INFO.businessSector,
          phone: rawInfo.phone || rawInfo.Phone || EMPTY_COMPANY_INFO.phone,
          hotline: rawInfo.hotline || rawInfo.Hotline || EMPTY_COMPANY_INFO.hotline,
          email: rawInfo.email || rawInfo.Email || EMPTY_COMPANY_INFO.email,
          website: rawInfo.website || rawInfo.Website || EMPTY_COMPANY_INFO.website,
          zalo: rawInfo.zalo || rawInfo.Zalo || EMPTY_COMPANY_INFO.zalo,
          fanpage: rawInfo.fanpage || rawInfo.Fanpage || EMPTY_COMPANY_INFO.fanpage,
          headquarters: cleanHq,
          warehouseAddress: rawInfo.warehouseAddress || rawInfo.WarehouseAddress || EMPTY_COMPANY_INFO.warehouseAddress,
          country: rawInfo.country || rawInfo.Country || 'Việt Nam',
          logoUrl: rawInfo.logoUrl || rawInfo.LogoUrl || EMPTY_COMPANY_INFO.logoUrl,
          status: (rawInfo.status ?? rawInfo.Status) !== false,
        };
        setCompanyInfo(merged);
        companyForm.setFieldsValue(merged);
        setStoredAdminData(ADMIN_STORAGE_KEYS.COMPANY_INFO, merged);
      }
    } catch (err) {
      console.warn('Could not load company info from API:', err);
    }
  };

  // VietQR Banks State
  const [vietQrBanks, setVietQrBanks] = useState<VietQrBank[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);

  const loadVietQrBanks = async () => {
    try {
      setLoadingBanks(true);
      const banks = await settingsApi.getVietQrBanks();
      if (banks && banks.length > 0) {
        setVietQrBanks(banks);
      }
    } catch (err) {
      console.warn('Could not load VietQR banks:', err);
    } finally {
      setLoadingBanks(false);
    }
  };

  const loadPaymentConfigFromApi = async () => {
    try {
      const rawPayment: any = await settingsApi.getPaymentConfig();
      if (rawPayment) {
        const merged = {
          bankName: rawPayment.bankName || rawPayment.BankName || '',
          accountNumber: rawPayment.accountNumber || rawPayment.AccountNumber || rawPayment.bankAccountNumber || rawPayment.BankAccountNumber || '',
          accountName: rawPayment.accountName || rawPayment.AccountName || rawPayment.bankAccountName || rawPayment.BankAccountName || '',
          branchName: rawPayment.branchName || rawPayment.BranchName || '',
          defaultDeposit: rawPayment.defaultDeposit ?? rawPayment.DefaultDeposit ?? 30,
          bankBin: rawPayment.bankBin || rawPayment.BankBin || '',
          vietQrTemplate: rawPayment.vietQrTemplate || rawPayment.VietQrTemplate || 'compact',
        };
        setPaymentSettings(merged);
        paymentForm.setFieldsValue(merged);
        setStoredAdminData(ADMIN_STORAGE_KEYS.PAYMENT_SETTINGS, merged);
      }
    } catch (err) {
      console.warn('Could not load payment config from API:', err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (settingsActiveTab === 'company') {
        companyForm.setFieldsValue({
          code: companyInfo.code || (companyInfo as any).Code || '',
          companyName: companyInfo.companyName || (companyInfo as any).CompanyName || '',
          taxId: companyInfo.taxId || (companyInfo as any).TaxId || '',
          phone: companyInfo.phone || (companyInfo as any).Phone || '',
          hotline: companyInfo.hotline || (companyInfo as any).Hotline || '',
          email: companyInfo.email || (companyInfo as any).Email || '',
          website: companyInfo.website || (companyInfo as any).Website || '',
          representative: companyInfo.representative || (companyInfo as any).Representative || '',
          headquarters: companyInfo.headquarters || (companyInfo as any).Headquarters || (companyInfo as any).address || '',
          logoUrl: companyInfo.logoUrl || (companyInfo as any).LogoUrl || null,
          status: (companyInfo.status ?? (companyInfo as any).Status) !== false,
        });
      } else if (settingsActiveTab === 'payment') {
        paymentForm.setFieldsValue(paymentSettings);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [settingsActiveTab, companyInfo, paymentSettings]);

  const loadBranchesFromApi = async () => {
    try {
      const branches = await branchApi.getBranches();
      if (branches && Array.isArray(branches) && branches.length > 0) {
        setCurrentBranches(branches);
        setStoredAdminData(ADMIN_STORAGE_KEYS.BRANCHES, branches);
        if (setBranchesList) {
          setBranchesList(branches);
        }
        return;
      }
    } catch (err) {
      console.warn('Could not load branches from API, using fallback data:', err);
    }
    const stored = getStoredAdminData<AdminBranch[]>(ADMIN_STORAGE_KEYS.BRANCHES, branchesList || []);
    const cleaned = (stored || []).filter((b: AdminBranch) => !['br_1', 'br_2', 'br_3', 'br_4'].includes(b.id));
    setCurrentBranches(cleaned);
    setStoredAdminData(ADMIN_STORAGE_KEYS.BRANCHES, cleaned);
  };

  // Initial load from storage on mount
  useEffect(() => {
    const storedCompany = getStoredAdminData<AdminCompanyInfo | null>(ADMIN_STORAGE_KEYS.COMPANY_INFO, null);
    if (storedCompany) {
      setCompanyInfo(storedCompany);
      companyForm.setFieldsValue(storedCompany);
    }
    const storedPayment = getStoredAdminData<any>(ADMIN_STORAGE_KEYS.PAYMENT_SETTINGS, null);
    if (storedPayment) {
      setPaymentSettings(storedPayment);
      paymentForm.setFieldsValue(storedPayment);
    }
    setCurrentEmployees(getStoredAdminData(ADMIN_STORAGE_KEYS.EMPLOYEES, employeesList || INITIAL_EMPLOYEES));
  }, []);

  const loadEmployeesFromApi = useCallback(async () => {
    try {
      const res = await employeeApi.getEmployees();
      if (Array.isArray(res) && res.length > 0) {
        setCurrentEmployees(res);
        setEmployeesList?.(res);
        setStoredAdminData(ADMIN_STORAGE_KEYS.EMPLOYEES, res);
      }
    } catch (err) {
      console.warn('Failed to load employees in SettingsTab:', err);
    }
  }, [setEmployeesList]);

  // Lazy load tab data on active tab change
  useEffect(() => {
    if (settingsActiveTab === 'company') {
      loadCompanyInfoFromApi();
    } else if (settingsActiveTab === 'payment') {
      loadPaymentConfigFromApi();
      loadVietQrBanks();
    } else if (settingsActiveTab === 'branches') {
      loadBranchesFromApi();
    } else if (settingsActiveTab === 'employees' || settingsActiveTab === 'permissions') {
      loadEmployeesFromApi();
    }
  }, [settingsActiveTab, loadEmployeesFromApi]);

  // Sync from props
  useEffect(() => {
    if (branchesList && branchesList.length > 0) setCurrentBranches(branchesList);
  }, [branchesList]);

  useEffect(() => {
    if (employeesList && employeesList.length > 0) setCurrentEmployees(employeesList);
  }, [employeesList]);

  // Persistence hooks for local master data
  useEffect(() => {
    setStoredAdminData(ADMIN_STORAGE_KEYS.BRANCHES, currentBranches);
  }, [currentBranches]);

  useEffect(() => {
    setStoredAdminData(ADMIN_STORAGE_KEYS.EMPLOYEES, currentEmployees);
  }, [currentEmployees]);
  const [branchSearchQuery, setBranchSearchQuery] = useState('');
  const [selectedBranchKeys, setSelectedBranchKeys] = useState<React.Key[]>([]);
  const [branchDrawerOpen, setBranchDrawerOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<AdminBranch | null>(null);
  const [branchForm] = Form.useForm();
  const [branchSyncing, setBranchSyncing] = useState(false);

  const filteredBranches = useMemo(() => {
    const q = branchSearchQuery.trim().toLowerCase();
    if (!q) return currentBranches;
    return currentBranches.filter(
      (b) =>
        (b.code && b.code.toLowerCase().includes(q)) ||
        (b.name && b.name.toLowerCase().includes(q)) ||
        (b.address && b.address.toLowerCase().includes(q)) ||
        (b.description && b.description.toLowerCase().includes(q))
    );
  }, [currentBranches, branchSearchQuery]);

  const selectedBranchRecord = useMemo(() => {
    return currentBranches.find((b) => b.id === selectedBranchKeys[0]) || null;
  }, [currentBranches, selectedBranchKeys]);

  const handleOpenCreateBranch = () => {
    setEditingBranch(null);
    const nextNum = currentBranches.length + 1;
    const nextCode = `CN${String(nextNum).padStart(6, '0')}`;
    setBranchDrawerOpen(true);

    setTimeout(() => {
      branchForm.resetFields();
      branchForm.setFieldsValue({
        code: nextCode,
        status: true,
      });
    }, 0);
  };

  const handleOpenEditBranch = (record: AdminBranch) => {
    setEditingBranch(record);
    setBranchDrawerOpen(true);

    setTimeout(() => {
      branchForm.resetFields();
      branchForm.setFieldsValue({
        code: record.code,
        name: record.name,
        description: record.description,
        address: record.address,
        status: record.status !== 'inactive',
      });
    }, 0);
  };

  const handleCloseBranchDrawer = () => {
    setBranchDrawerOpen(false);
    setEditingBranch(null);
    branchForm.resetFields();
  };

  const handleSaveBranchSubmit = async () => {
    try {
      const values = await branchForm.validateFields();
      if (editingBranch) {
        let updatedList: AdminBranch[] = [];
        try {
          const updated = await branchApi.updateBranch(editingBranch.id, {
            ...editingBranch,
            code: values.code?.trim().toUpperCase(),
            name: values.name?.trim(),
            description: values.description?.trim() || '',
            address: values.address?.trim() || '',
            status: values.status ? 'active' : 'inactive',
          });
          updatedList = currentBranches.map((b) => (b.id === editingBranch.id ? updated : b));
        } catch {
          updatedList = currentBranches.map((b) =>
            b.id === editingBranch.id
              ? {
                  ...b,
                  code: values.code?.trim().toUpperCase(),
                  name: values.name?.trim(),
                  description: values.description?.trim() || '',
                  address: values.address?.trim() || '',
                  status: values.status ? 'active' : 'inactive',
                }
              : b
          );
        }
        setCurrentBranches(updatedList);
        if (setBranchesList) setBranchesList(updatedList);
        message.success(`Đã cập nhật chi nhánh "${values.name}" thành công!`);
      } else {
        const payload: Partial<AdminBranch> = {
          code: values.code?.trim().toUpperCase(),
          name: values.name?.trim(),
          type: 'showroom',
          typeLabel: 'Showroom & Điểm bán',
          address: values.address?.trim() || '',
          region: 'Toàn quốc',
          managerName: 'Chưa phân công',
          managerPhone: '',
          managerEmail: '',
          area: 120,
          staffCount: 4,
          warehouseCount: 1,
          activeOrdersCount: 0,
          establishedDate: new Date().toLocaleDateString('vi-VN'),
          status: values.status ? 'active' : 'inactive',
          description: values.description?.trim() || '',
        };
        let updatedList: AdminBranch[] = [];
        try {
          const created = await branchApi.createBranch(payload);
          updatedList = [...currentBranches, created];
        } catch {
          const localBranch: AdminBranch = {
            ...payload,
            id: `br_${Date.now()}`,
          } as AdminBranch;
          updatedList = [...currentBranches, localBranch];
        }
        setCurrentBranches(updatedList);
        if (setBranchesList) setBranchesList(updatedList);
        message.success(`Đã thêm mới chi nhánh "${values.name}" thành công!`);
      }
      handleCloseBranchDrawer();
    } catch {
      // form validate error
    }
  };

  const handleDeleteSelectedBranches = () => {
    if (!selectedBranchKeys.length) return;
    const count = selectedBranchKeys.length;
    modal.confirm({
      title: 'Xác nhận xóa chi nhánh',
      content:
        count === 1
          ? `Bạn có chắc chắn muốn xóa chi nhánh "${selectedBranchRecord?.name || ''}" (${selectedBranchRecord?.code || ''}) không?`
          : `Bạn có chắc chắn muốn xóa ${count} chi nhánh đã chọn không?`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy bỏ',
      onOk: async () => {
        try {
          await Promise.all(
            selectedBranchKeys.map((k) => branchApi.deleteBranch(String(k)))
          );
          const updated = currentBranches.filter((b) => !selectedBranchKeys.includes(b.id));
          setCurrentBranches(updated);
          setStoredAdminData(ADMIN_STORAGE_KEYS.BRANCHES, updated);
          if (setBranchesList) {
            setBranchesList(updated);
          }
          setSelectedBranchKeys([]);
          message.success(`Đã xóa ${count} chi nhánh thành công!`);
        } catch (e: any) {
          message.error(e?.message || 'Xóa chi nhánh thất bại.');
        }
      },
    });
  };

  const handleCloneBranch = async (record: AdminBranch) => {
    const nextCode = `${record.code}_COPY`;
    const clonedPayload: Partial<AdminBranch> = {
      ...record,
      code: nextCode,
      name: `${record.name} (Bản sao)`,
      status: 'active',
    };
    let updatedList: AdminBranch[] = [];
    try {
      const created = await branchApi.createBranch(clonedPayload);
      updatedList = [...currentBranches, created];
    } catch {
      const cloned: AdminBranch = {
        ...clonedPayload,
        id: `br_${Date.now()}`,
      } as AdminBranch;
      updatedList = [...currentBranches, cloned];
    }
    setCurrentBranches(updatedList);
    if (setBranchesList) setBranchesList(updatedList);
    message.success(`Đã nhân bản chi nhánh "${record.name}"!`);
  };

  const handleSyncBranches = async () => {
    setBranchSyncing(true);
    try {
      await loadBranchesFromApi();
      message.success(`Đồng bộ chi nhánh từ Backend API thành công.`);
    } catch (err: any) {
      message.error(err?.message || 'Đồng bộ chi nhánh thất bại.');
    } finally {
      setBranchSyncing(false);
    }
  };



  // ================= DOMACO POS RBAC ROLES & PERMISSIONS STATE =================
  const [currentRoles, setCurrentRoles] = useState<AdminRole[]>(rolesList || INITIAL_ROLES);
  const [permissionCatalogGroups, setPermissionCatalogGroups] = useState<PermissionGroup[]>(PERMISSION_GROUPS);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);

  const loadRolesFromApi = async () => {
    try {
      const roles = await roleApi.getRoles();
      if (roles && roles.length > 0) {
        setCurrentRoles(roles);
        onUpdateRoles?.(roles);
        setSelectedRoleId((prev) => (roles.some((r) => r.id === prev) ? prev : roles[0].id));
      }
    } catch (err) {
      console.warn('Load roles from API failed:', err);
    }
  };

  const loadPermissionsCatalog = async () => {
    try {
      const catalog = await roleApi.getPermissionsCatalog();
      if (catalog && catalog.length > 0) {
        setPermissionCatalogGroups(catalog);
      }
    } catch (err) {
      console.warn('Load permissions catalog failed:', err);
    }
  };

  useEffect(() => {
    loadRolesFromApi();
    loadPermissionsCatalog();
    loadEmployeesFromApi();
  }, [loadEmployeesFromApi]);

  useEffect(() => {
    if (rolesList && rolesList.length > 0) setCurrentRoles(rolesList);
  }, [rolesList]);

  useEffect(() => {
    setStoredAdminData(ADMIN_STORAGE_KEYS.ROLES, currentRoles);
  }, [currentRoles]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('role_admin');
  const [roleSearchQuery, setRoleSearchQuery] = useState('');
  const [roleDetailTab, setRoleDetailTab] = useState<'matrix' | 'members'>('matrix');

  // Role Create / Edit Modal State
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<AdminRole | null>(null);
  const [roleForm] = Form.useForm();

  // Current selected role object
  const currentRole = useMemo(() => {
    return currentRoles.find((r) => r.id === selectedRoleId) || currentRoles[0];
  }, [currentRoles, selectedRoleId]);

  // Filtered roles list for selection
  const filteredRoles = useMemo(() => {
    if (!roleSearchQuery.trim()) return currentRoles;
    const q = roleSearchQuery.toLowerCase();
    return currentRoles.filter(
      (r) => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q)
    );
  }, [currentRoles, roleSearchQuery]);

  // Helper to determine if an employee is assigned to a given role
  const isEmployeeInRole = (emp: AdminEmployee, role: AdminRole): boolean => {
    if (!emp || !role) return false;

    const empRole = (emp.role || '').trim();
    const empRoleId = ((emp as any).roleId || '').trim();
    const empRoleName = ((emp as any).roleName || '').trim();

    const roleId = (role.id || '').trim();
    const roleCode = (role.code || '').trim();
    const roleName = (role.name || '').trim();

    // 1. Direct match by ID, Code, or Name
    if (empRole && (empRole === roleId || empRole === roleCode || empRole === roleName)) return true;
    if (empRoleId && (empRoleId === roleId || empRoleId === roleCode || empRoleId === roleName)) return true;
    if (empRoleName && (empRoleName === roleName || empRoleName === roleCode)) return true;

    // 2. Case-insensitive comparison
    const empRoleLower = empRole.toLowerCase();
    const roleIdLower = roleId.toLowerCase();
    const roleCodeLower = roleCode.toLowerCase();
    const roleNameLower = roleName.toLowerCase();

    if (empRoleLower && (
      empRoleLower === roleIdLower ||
      empRoleLower === roleCodeLower ||
      empRoleLower === roleNameLower
    )) {
      return true;
    }

    if (empRoleId && empRoleId.toLowerCase() === roleIdLower) return true;

    // 3. Super Admin aliases
    const isSuperAdminRole =
      roleCodeLower === 'super_admin' ||
      roleCodeLower === 'admin' ||
      roleIdLower === 'role_admin' ||
      roleIdLower === 'a1111111-1111-1111-1111-111111111111' ||
      roleNameLower.includes('quản trị viên tối cao');

    if (isSuperAdminRole) {
      if (
        empRoleLower === 'super_admin' ||
        empRoleLower === 'admin' ||
        empRoleLower === 'quản trị viên tối cao' ||
        empRoleLower === 'a1111111-1111-1111-1111-111111111111'
      ) {
        return true;
      }
    }

    return false;
  };

  // List of active employees to evaluate for roles
  const effectiveEmployees = useMemo(() => {
    if (currentEmployees && currentEmployees.length > 0) return currentEmployees;
    if (employeesList && employeesList.length > 0) return employeesList;
    return [];
  }, [currentEmployees, employeesList]);

  // Helper to get real-time assigned employee count
  const getRoleUserCount = (role: AdminRole) => {
    return effectiveEmployees.filter((emp) => isEmployeeInRole(emp, role)).length;
  };

  // Employees assigned to current role
  const assignedEmployees = useMemo(() => {
    if (!currentRole) return [];
    return effectiveEmployees.filter((emp) => isEmployeeInRole(emp, currentRole));
  }, [effectiveEmployees, currentRole]);

  // Total permissions across all groups
  const allPermissionKeys = useMemo(() => {
    return permissionCatalogGroups.flatMap((g: PermissionGroup) => g.permissions.map((p: PermissionDefinition) => p.key));
  }, [permissionCatalogGroups]);

  const [permissionFilterSection, setPermissionFilterSection] = useState<string>('all');
  const [permissionKeywordSearch, setPermissionKeywordSearch] = useState<string>('');

  const displayedPermissionGroups = useMemo(() => {
    let groups = permissionCatalogGroups;
    if (permissionFilterSection !== 'all') {
      groups = groups.filter((g: PermissionGroup) => g.groupKey === permissionFilterSection);
    }
    if (!permissionKeywordSearch.trim()) return groups;
    const q = permissionKeywordSearch.toLowerCase();
    return groups.filter((g: PermissionGroup) => {
      return (
        g.groupName.toLowerCase().includes(q) ||
        g.permissions.some(
          (p: PermissionDefinition) =>
            p.name.toLowerCase().includes(q) ||
            p.key.toLowerCase().includes(q) ||
            (p.description && p.description.toLowerCase().includes(q))
        )
      );
    });
  }, [permissionCatalogGroups, permissionFilterSection, permissionKeywordSearch]);

  // ================= PERMISSION TOGGLES =================
  const handleTogglePermission = (permKey: string) => {
    if (!currentRole) return;
    const hasPerm = currentRole.permissions.includes(permKey);
    const updatedPerms = hasPerm
      ? currentRole.permissions.filter((p) => p !== permKey)
      : [...currentRole.permissions, permKey];

    setCurrentRoles((prev) =>
      prev.map((r) => (r.id === currentRole.id ? { ...r, permissions: updatedPerms } : r))
    );
  };

  const handleToggleGroupPermissions = (groupKey: string, grant: boolean) => {
    if (!currentRole) return;
    const targetGroup = permissionCatalogGroups.find((g: PermissionGroup) => g.groupKey === groupKey);
    if (!targetGroup) return;

    const groupKeys = targetGroup.permissions.map((p: PermissionDefinition) => p.key);
    let updatedPerms: string[];

    if (grant) {
      const merged = new Set([...currentRole.permissions, ...groupKeys]);
      updatedPerms = Array.from(merged);
    } else {
      updatedPerms = currentRole.permissions.filter((k: string) => !groupKeys.includes(k));
    }

    setCurrentRoles((prev) =>
      prev.map((r) => (r.id === currentRole.id ? { ...r, permissions: updatedPerms } : r))
    );
    message.success(`${grant ? 'Đã cấp tất cả' : 'Đã bỏ chọn tất cả'} quyền nhóm "${targetGroup.groupName}"!`);
  };

  const handleToggleSubGroupPermissions = (subPermissions: PermissionDefinition[], grant: boolean) => {
    if (!currentRole) return;
    const subKeys = subPermissions.map((p) => p.key);
    let updatedPerms: string[];

    if (grant) {
      const merged = new Set([...currentRole.permissions, ...subKeys]);
      updatedPerms = Array.from(merged);
    } else {
      updatedPerms = currentRole.permissions.filter((k) => !subKeys.includes(k));
    }

    setCurrentRoles((prev) =>
      prev.map((r) => (r.id === currentRole.id ? { ...r, permissions: updatedPerms } : r))
    );
  };

  const handleToggleAllPermissions = (grant: boolean) => {
    if (!currentRole) return;
    const updatedPerms = grant ? [...allPermissionKeys] : [];
    setCurrentRoles((prev) =>
      prev.map((r) => (r.id === currentRole.id ? { ...r, permissions: updatedPerms } : r))
    );
    message.success(grant ? 'Đã bật toàn bộ quyền hạn hệ thống!' : 'Đã thu hồi tất cả quyền hạn!');
  };

  // ================= ROLE CRUD HANDLERS =================
  const handleOpenCreateRole = () => {
    setEditingRole(null);
    setShowRoleModal(true);

    setTimeout(() => {
      roleForm.resetFields();
      roleForm.setFieldsValue({
        status: true,
        templateRoleId: currentRoles[0]?.id || 'role_director',
      });
    }, 0);
  };

  const handleOpenEditRole = (role: AdminRole) => {
    setEditingRole(role);
    setShowRoleModal(true);

    setTimeout(() => {
      roleForm.resetFields();
      roleForm.setFieldsValue({
        name: role.name,
        code: role.code,
        description: role.description,
        status: role.status === 'active',
      });
    }, 0);
  };

  const handleCloneRole = async (role: AdminRole) => {
    try {
      const cloned = await roleApi.cloneRole(role.id, {
        newCode: `${role.code}_COPY`,
        newName: `${role.name} (Bản sao)`,
        description: `Bản sao quyền hạn từ ${role.name}`,
      });
      if (cloned) {
        setCurrentRoles((prev) => [...prev, cloned]);
        onUpdateRoles?.((prev: AdminRole[]) => [...prev, cloned]);
        setSelectedRoleId(cloned.id);
        message.success(`Đã nhân bản vai trò "${role.name}" thành công!`);
      }
    } catch (err: any) {
      message.error(err.message || 'Nhân bản vai trò thất bại');
    }
  };

  const handleDeleteRole = async (role: AdminRole) => {
    if (role.isSystem) {
      message.error('Không thể xóa vai trò quản trị mặc định của hệ thống!');
      return;
    }

    try {
      await roleApi.deleteRole(role.id);
      const remainingRoles = currentRoles.filter((r) => r.id !== role.id);
      setCurrentRoles(remainingRoles);
      onUpdateRoles?.(remainingRoles);
      if (selectedRoleId === role.id && remainingRoles.length > 0) {
        setSelectedRoleId(remainingRoles[0].id);
      }
      message.success(`Đã xóa vai trò "${role.name}" thành công!`);
    } catch (err: any) {
      message.error(err.message || 'Xóa vai trò thất bại');
    }
  };

  const handleSaveRoleSubmit = async () => {
    try {
      const values = await roleForm.validateFields();
      if (editingRole) {
        try {
          const updated = await roleApi.updateRole(editingRole.id, {
            name: values.name,
            code: values.code?.toUpperCase(),
            description: values.description,
            status: values.status ? 'active' : 'inactive',
          });
          if (updated) {
            setCurrentRoles((prev) =>
              prev.map((r) => (r.id === editingRole.id ? updated : r))
            );
            onUpdateRoles?.((prev: AdminRole[]) =>
              prev.map((r) => (r.id === editingRole.id ? updated : r))
            );
          }
        } catch (err: any) {
          message.error(err.message || 'Cập nhật vai trò thất bại');
          return;
        }
        message.success(`Đã cập nhật thông tin vai trò "${values.name}"!`);
      } else {
        try {
          const created = await roleApi.createRole({
            name: values.name,
            code: values.code?.toUpperCase(),
            description: values.description || '',
            status: values.status ? 'active' : 'inactive',
            templateRoleId: values.templateRoleId,
          });
          if (created) {
            setCurrentRoles((prev) => [...prev, created]);
            onUpdateRoles?.((prev: AdminRole[]) => [...prev, created]);
            setSelectedRoleId(created.id);
          }
        } catch (err: any) {
          message.error(err.message || 'Tạo mới vai trò thất bại');
          return;
        }
        message.success(`Đã tạo vai trò mới "${values.name}" thành công!`);
      }
      setShowRoleModal(false);
    } catch (err) {
      // Form validation error
    }
  };

  const handleSavePermissions = async () => {
    if (!currentRole) return;
    try {
      setIsSavingPermissions(true);
      const updated = await roleApi.updateRolePermissions(currentRole.id, currentRole.permissions);
      if (updated) {
        setCurrentRoles((prev) =>
          prev.map((r) => (r.id === currentRole.id ? updated : r))
        );
        onUpdateRoles?.((prev: AdminRole[]) =>
          prev.map((r) => (r.id === currentRole.id ? updated : r))
        );
      }
      message.success(`Đã lưu ma trận phân quyền cho vai trò "${currentRole.name}" thành công!`);
    } catch (err: any) {
      message.error(err.message || 'Lưu phân quyền thất bại');
    } finally {
      setIsSavingPermissions(false);
    }
  };

  const handleSaveCompanyInfo = async (values: any) => {
    let cleanHeadquarters = values.headquarters || values.address || companyInfo.headquarters || '';
    if (cleanHeadquarters.includes('NgÃ£') || cleanHeadquarters.includes('Cá»­a') || cleanHeadquarters.includes('Ä‘áº·c')) {
      cleanHeadquarters = 'Ngã 4 Cửa Cạn, Đặc khu Phú Quốc, tỉnh Kiên Giang';
    }

    const payload: AdminCompanyInfo = {
      ...EMPTY_COMPANY_INFO,
      ...companyInfo,
      ...values,
      headquarters: cleanHeadquarters,
      brandName: values.companyName || companyInfo.brandName || '',
    };
    try {
      const res = await settingsApi.updateCompanyInfo(payload);
      const nextData: AdminCompanyInfo = {
        ...payload,
        ...(res || {}),
        headquarters: cleanHeadquarters,
      };
      setCompanyInfo(nextData);
      companyForm.setFieldsValue(nextData);
      setStoredAdminData(ADMIN_STORAGE_KEYS.COMPANY_INFO, nextData);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('store_settings_updated', { detail: nextData }));
      }
      message.success('Đã lưu và cập nhật thông tin doanh nghiệp & cửa hàng POS thành công!');
    } catch (err: any) {
      console.warn('API update company info failed:', err);
      setCompanyInfo(payload);
      companyForm.setFieldsValue(payload);
      setStoredAdminData(ADMIN_STORAGE_KEYS.COMPANY_INFO, payload);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('store_settings_updated', { detail: payload }));
      }
      message.success('Đã lưu cấu hình thành công!');
    }
  };

  const handleResetCompanyInfo = () => {
    companyForm.resetFields();
    companyForm.setFieldsValue(EMPTY_COMPANY_INFO);
    setCompanyInfo(EMPTY_COMPANY_INFO);
    setStoredAdminData(ADMIN_STORAGE_KEYS.COMPANY_INFO, EMPTY_COMPANY_INFO);
    message.info('Đã khôi phục thông tin doanh nghiệp về giá trị mặc định!');
  };

  const handleLogoUpload = (file: File) => {
    const isImage = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp';
    if (!isImage) {
      message.error('Chỉ hỗ trợ file ảnh PNG, JPG hoặc WEBP!');
      return false;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Kích thước ảnh tối đa là 2MB!');
      return false;
    }
    setUploadingLogo(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      companyForm.setFieldsValue({ logoUrl: result });
      setCompanyInfo((prev) => ({ ...prev, logoUrl: result }));
      setUploadingLogo(false);
      message.success('Đã cập nhật logo doanh nghiệp thành công!');
    };
    reader.readAsDataURL(file);
    return false;
  };

  const handleCopyAccessUrl = () => {
    if (companyInfo.accessUrl) {
      navigator.clipboard.writeText(companyInfo.accessUrl);
      message.success('Đã sao chép địa chỉ truy cập hệ thống POS!');
    }
  };

  const handleSaveSettings = async (values: any) => {
    try {
      const bankBin = values.bankBin || paymentSettings.bankBin || getBankBin(values.bankName || paymentSettings.bankName);
      const payload = {
        ...paymentSettings,
        ...values,
        bankBin,
        accountNumber: values.accountNumber || paymentSettings.accountNumber,
        accountName: values.accountName || paymentSettings.accountName,
        bankAccountNumber: values.accountNumber || paymentSettings.accountNumber,
        bankAccountName: values.accountName || paymentSettings.accountName,
      };
      await settingsApi.updatePaymentConfig(payload);
      setPaymentSettings(payload);
      paymentForm.setFieldsValue(payload);
      setStoredAdminData(ADMIN_STORAGE_KEYS.PAYMENT_SETTINGS, payload);
      message.success('Đã lưu cấu hình tài khoản thanh toán & mã VietQR thành công!');
    } catch (err: any) {
      console.warn('API update payment config failed:', err);
      message.error(err?.message || 'Lưu cấu hình thanh toán thất bại.');
    }
  };

  // ================= SIDEBAR MENU DEFINITION =================
  // ================= SIDEBAR MENU DEFINITION =================
  const rawSettingsMenuItems: (SettingsMenuItem & { permission?: string })[] = [
    {
      key: 'company',
      icon: <ShopOutlined />,
      label: 'Thông tin doanh nghiệp',
      group: 'general',
      permission: 'settings.brand.view',
    },
    {
      key: 'payment',
      icon: <CreditCardOutlined />,
      label: 'Cấu hình thanh toán & QR',
      group: 'general',
      permission: 'settings.payment.view',
    },
    {
      key: 'print-templates',
      icon: <PrinterOutlined />,
      label: 'Mẫu phiếu in & Hóa đơn',
      group: 'general',
      permission: 'settings.print.view',
    },
    {
      key: 'branches',
      icon: <EnvironmentOutlined />,
      label: 'Chi nhánh & Cơ sở',
      badge: <Tag color="default" className="font-mono text-[10px] m-0 bg-slate-100 border-slate-200">{currentBranches.length}</Tag>,
      group: 'operations',
      permission: 'settings.branches.view',
    },
    {
      key: 'warehouses',
      icon: <ShopOutlined />,
      label: 'Kho & Điểm lưu kho',
      badge: <Tag color="default" className="font-mono text-[10px] m-0 bg-slate-100 border-slate-200">{warehousesCount}</Tag>,
      group: 'operations',
      permission: 'inventory.warehouses.view',
    },
    {
      key: 'employees',
      icon: <TeamOutlined />,
      label: 'Nhân viên & Người dùng',
      badge: <Tag color="default" className="font-mono text-[10px] m-0 bg-slate-100 border-slate-200">{currentEmployees.length}</Tag>,
      group: 'security',
      permission: 'settings.employees.view',
    },
    {
      key: 'permissions',
      icon: <SafetyCertificateOutlined />,
      label: 'Vai trò & Phân quyền',
      badge: <Tag color="gold" className="font-mono text-[10px] m-0">{currentRoles.length} vai trò</Tag>,
      group: 'security',
      permission: 'settings.rbac.view',
    },
  ];

  const settingsMenuItems = useMemo(() => {
    return rawSettingsMenuItems.filter((item) => {
      if (!item.permission) return true;
      return hasPermission(item.permission);
    });
  }, [rawSettingsMenuItems, hasPermission]);

  // Auto-switch to first accessible settings tab if current tab is forbidden for role
  useEffect(() => {
    if (settingsMenuItems.length > 0 && !settingsMenuItems.some((item) => item.key === settingsActiveTab)) {
      setSettingsActiveTab(settingsMenuItems[0].key);
    }
  }, [settingsMenuItems, settingsActiveTab]);

  return (
    <div className="space-y-4 flex-1 flex flex-col h-full">
      {/* Top Header Toolbar: Standardized matching AdminListToolbar container */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-none shadow-xs border border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#784e34]/10 text-[#784e34] flex items-center justify-center text-lg shrink-0">
            <SettingOutlined />
          </div>
          <div>
            <h2 className="font-bold text-sm sm:text-base text-slate-900 m-0">Thiết lập &amp; Cài đặt hệ thống</h2>
          </div>
        </div>
      </div>

      {/* Responsive Segmented Tabs for Mobile / Tablet (< lg) */}
      <div className="block lg:hidden bg-white p-3 rounded-none border border-slate-200/80 shadow-xs overflow-x-auto">
        <Segmented
          value={settingsActiveTab}
          onChange={(val: any) => setSettingsActiveTab(val)}
          options={settingsMenuItems.map((item) => ({
            value: item.key,
            label: `${item.label}${item.badge ? ` (${item.key === 'branches' ? currentBranches.length : item.key === 'employees' ? currentEmployees.length : currentRoles.length})` : ''}`,
          }))}
          className="w-full bg-slate-100 p-1"
        />
      </div>

      {/* 2-COLUMN MASTER LAYOUT: LEFT SIDEBAR MENU (DESKTOP) + RIGHT CONTENT */}
      <div className="flex flex-col lg:flex-row gap-4 items-start w-full flex-1">
        
        {/* ================= LEFT SIDEBAR MENU (UNIFIED WITH ADMINFILTERBAR WIDTH) ================= */}
        <aside className="hidden lg:block w-72 bg-white rounded-none shadow-xs border border-slate-200/80 p-3 space-y-3 shrink-0 text-xs">
          
          {/* GROUP 1: DOANH NGHIỆP & THANH TOÁN */}
          <div className="space-y-1">
            <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Doanh nghiệp &amp; Thanh toán
            </div>
            {settingsMenuItems
              .filter((item) => item.group === 'general')
              .map((item) => {
                const isActive = settingsActiveTab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSettingsActiveTab(item.key)}
                    className={`w-full text-left px-3 py-2 transition-all flex items-center justify-between gap-2.5 border ${
                      isActive
                        ? 'bg-[#784e34]/8 border-l-[3px] !border-l-[#784e34] border-slate-200/80 text-[#784e34] font-bold shadow-2xs'
                        : 'bg-transparent border-transparent hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`p-1.5 rounded text-sm shrink-0 ${isActive ? 'bg-[#784e34] text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {item.icon}
                      </span>
                      <span className={`text-xs truncate ${isActive ? 'text-[#784e34] font-bold' : 'text-slate-900 font-medium'}`}>
                        {item.label}
                      </span>
                    </div>
                    {item.badge}
                  </button>
                );
              })}
          </div>

          {/* GROUP 2: CƠ CẤU VẬN HÀNH */}
          <div className="space-y-1 pt-2 border-t border-slate-100">
            <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Cơ cấu &amp; Vận hành
            </div>
            {settingsMenuItems
              .filter((item) => item.group === 'operations')
              .map((item) => {
                const isActive = settingsActiveTab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSettingsActiveTab(item.key)}
                    className={`w-full text-left px-3 py-2 transition-all flex items-center justify-between gap-2.5 border ${
                      isActive
                        ? 'bg-[#784e34]/8 border-l-[3px] !border-l-[#784e34] border-slate-200/80 text-[#784e34] font-bold shadow-2xs'
                        : 'bg-transparent border-transparent hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`p-1.5 rounded text-sm shrink-0 ${isActive ? 'bg-[#784e34] text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {item.icon}
                      </span>
                      <span className={`text-xs truncate ${isActive ? 'text-[#784e34] font-bold' : 'text-slate-900 font-medium'}`}>
                        {item.label}
                      </span>
                    </div>
                    {item.badge}
                  </button>
                );
              })}
          </div>

          {/* GROUP 3: BẢO MẬT & PHÂN QUYỀN */}
          <div className="space-y-1 pt-2 border-t border-slate-100">
            <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Bảo mật &amp; Phân quyền
            </div>
            {settingsMenuItems
              .filter((item) => item.group === 'security')
              .map((item) => {
                const isActive = settingsActiveTab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSettingsActiveTab(item.key)}
                    className={`w-full text-left px-3 py-2 transition-all flex items-center justify-between gap-2.5 border ${
                      isActive
                        ? 'bg-[#784e34]/8 border-l-[3px] !border-l-[#784e34] border-slate-200/80 text-[#784e34] font-bold shadow-2xs'
                        : 'bg-transparent border-transparent hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`p-1.5 rounded text-sm shrink-0 ${isActive ? 'bg-[#784e34] text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {item.icon}
                      </span>
                      <span className={`text-xs truncate ${isActive ? 'text-[#784e34] font-bold' : 'text-slate-900 font-medium'}`}>
                        {item.label}
                      </span>
                    </div>
                    {item.badge}
                  </button>
                );
              })}
          </div>
        </aside>

        {/* ================= RIGHT MAIN CONTENT CONTAINER ================= */}
        <main className="flex-1 min-w-0 w-full bg-white rounded-none shadow-xs border border-slate-200/80 p-5 sm:p-6 space-y-6">
          
          {/* TAB 1: THÔNG TIN CỬA HÀNG (DOMACO POS STORE INFO) */}
          <div className={settingsActiveTab === 'company' ? 'space-y-4' : 'hidden'}>
              {/* Header: Title & Action Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 m-0">Thông tin cửa hàng</h3>
                </div>

                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={() => companyForm.submit()}
                  className="h-9 sm:h-10 rounded-lg bg-[#784e34] hover:!bg-[#5d371f] px-4 sm:px-5 text-xs sm:text-sm font-semibold text-white border-none shadow-none shrink-0"
                >
                  Lưu Cấu Hình
                </Button>
              </div>

              {/* Main Form: Exact 3 SectionCards matching Domaco POS */}
              <Form
                form={companyForm}
                layout="vertical"
                initialValues={{
                  code: companyInfo.code || EMPTY_COMPANY_INFO.code,
                  companyName: companyInfo.companyName || EMPTY_COMPANY_INFO.companyName,
                  taxId: companyInfo.taxId || EMPTY_COMPANY_INFO.taxId,
                  phone: companyInfo.phone || EMPTY_COMPANY_INFO.phone,
                  hotline: companyInfo.hotline || EMPTY_COMPANY_INFO.hotline,
                  email: companyInfo.email || EMPTY_COMPANY_INFO.email,
                  website: companyInfo.website || EMPTY_COMPANY_INFO.website,
                  representative: companyInfo.representative || EMPTY_COMPANY_INFO.representative,
                  headquarters: companyInfo.headquarters || EMPTY_COMPANY_INFO.headquarters,
                  logoUrl: companyInfo.logoUrl || EMPTY_COMPANY_INFO.logoUrl,
                  status: companyInfo.status !== false,
                }}
                onFinish={handleSaveCompanyInfo}
                className="space-y-4 [&_.ant-form-item]:!mb-4 [&_.ant-form-item-label]:!pb-1.5 [&_.ant-form-item-label_label]:!text-xs [&_.ant-form-item-label_label]:!font-medium [&_.ant-form-item-label_label]:!text-slate-700"
              >
                <Form.Item name="logoUrl" hidden>
                  <Input />
                </Form.Item>

                {/* 1. ĐỊNH DANH & PHÁP LÝ */}
                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
                  <div className="border-b border-slate-200 px-4 py-3.5 sm:px-6 sm:py-5">
                    <h2 className="m-0 text-sm font-semibold text-slate-900">Định danh &amp; Pháp lý</h2>
                  </div>
                  <div className="px-4 py-4 sm:px-6 sm:py-5">
                    <div className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
                      <Form.Item
                        label="Mã công ty"
                        name="code"
                        rules={[{ required: true, message: 'Vui lòng nhập mã công ty' }]}
                      >
                        <Input
                          placeholder="Nhập mã công ty"
                          className="h-9 sm:h-10 rounded-lg text-xs sm:text-sm font-mono uppercase"
                        />
                      </Form.Item>

                      <Form.Item
                        label="Tên công ty (Pháp lý)"
                        name="companyName"
                        rules={[{ required: true, message: 'Vui lòng nhập tên công ty' }]}
                      >
                        <Input
                          prefix={<ShopOutlined className="text-slate-400 mr-1" />}
                          placeholder="Nhập tên công ty pháp lý"
                          className="h-9 sm:h-10 rounded-lg text-xs sm:text-sm"
                        />
                      </Form.Item>

                      <Form.Item label="Mã số thuế" name="taxId">
                        <Input
                          prefix={<CreditCardOutlined className="text-slate-400 mr-1" />}
                          placeholder="Nhập mã số thuế"
                          className="h-9 sm:h-10 rounded-lg text-xs sm:text-sm font-mono"
                        />
                      </Form.Item>

                      <Form.Item label="Số điện thoại" name="phone">
                        <Input
                          placeholder="Nhập số điện thoại"
                          className="h-9 sm:h-10 rounded-lg text-xs sm:text-sm"
                        />
                      </Form.Item>
                    </div>
                  </div>
                </section>

                {/* 2. HÌNH ẢNH THƯƠNG HIỆU */}
                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
                  <div className="border-b border-slate-200 px-4 py-3.5 sm:px-6 sm:py-5">
                    <h2 className="m-0 text-sm font-semibold text-slate-900">Hình ảnh thương hiệu</h2>
                  </div>
                  <div className="px-4 py-4 sm:px-6 sm:py-5">
                    <div className="flex flex-col gap-3.5 rounded-xl border border-slate-200 p-3.5 sm:p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-24 w-36 sm:h-28 sm:w-48 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs">
                          {companyInfo.logoUrl ? (
                            <img
                              src={companyInfo.logoUrl}
                              alt="Logo công ty"
                              className="max-h-full max-w-full object-contain"
                            />
                          ) : (
                            <span className="text-xs text-slate-400">Chưa có logo</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-semibold text-slate-900">Logo thương hiệu</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">Kích thước chuẩn, tự động tối ưu hiển thị trên thanh tiêu đề và hóa đơn POS</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Upload
                          accept="image/png,image/jpeg,image/jpg"
                          showUploadList={false}
                          beforeUpload={handleLogoUpload}
                          disabled={uploadingLogo}
                          className="w-full sm:w-auto"
                        >
                          <Button
                            icon={uploadingLogo ? <ReloadOutlined spin /> : <UploadOutlined />}
                            className="h-9 sm:h-10 rounded-lg px-4 text-xs sm:text-sm font-medium w-full sm:w-auto"
                            disabled={uploadingLogo}
                          >
                            {uploadingLogo ? 'Đang tải logo...' : 'Tải logo lên'}
                          </Button>
                        </Upload>

                        {companyInfo.logoUrl && (
                          <Button
                            type="text"
                            danger
                            size="small"
                            onClick={() => {
                              companyForm.setFieldsValue({ logoUrl: null });
                              setCompanyInfo((prev) => ({ ...prev, logoUrl: null }));
                              message.info('Đã xóa logo');
                            }}
                            className="text-xs"
                          >
                            Xóa
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* 3. THÔNG TIN LIÊN HỆ */}
                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
                  <div className="border-b border-slate-200 px-4 py-3.5 sm:px-6 sm:py-5">
                    <h2 className="m-0 text-sm font-semibold text-slate-900">Thông tin liên hệ &amp; Pháp lý</h2>
                  </div>
                  <div className="px-4 py-4 sm:px-6 sm:py-5">
                    <div className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
                      <Form.Item label="Email hỗ trợ" name="email">
                        <Input
                          prefix={<MailOutlined className="text-slate-400 mr-1" />}
                          placeholder="Nhập email hỗ trợ"
                          className="h-9 sm:h-10 rounded-lg text-xs sm:text-sm"
                        />
                      </Form.Item>
                      <Form.Item label="Hotline CSKH / Bán hàng" name="hotline">
                        <Input
                          prefix={<PhoneOutlined className="text-slate-400 mr-1" />}
                          placeholder="VD: 0986.739.587"
                          className="h-9 sm:h-10 rounded-lg text-xs sm:text-sm"
                        />
                      </Form.Item>
                      <Form.Item label="Website thương hiệu" name="website">
                        <Input
                          prefix={<GlobalOutlined className="text-slate-400 mr-1" />}
                          placeholder="VD: https://d2luxury.vn"
                          className="h-9 sm:h-10 rounded-lg text-xs sm:text-sm"
                        />
                      </Form.Item>
                      <Form.Item label="Người đại diện pháp luật" name="representative">
                        <Input
                          prefix={<UserOutlined className="text-slate-400 mr-1" />}
                          placeholder="Nhập tên người đại diện"
                          className="h-9 sm:h-10 rounded-lg text-xs sm:text-sm"
                        />
                      </Form.Item>
                    </div>
                    <Form.Item label="Địa chỉ trụ sở chính" name="headquarters">
                      <Input.TextArea
                        rows={2}
                        placeholder="Nhập địa chỉ trụ sở chính"
                        className="rounded-lg text-xs sm:text-sm"
                      />
                    </Form.Item>
                  </div>

                  <div className="border-t border-slate-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6 px-4 py-3.5 sm:px-6 sm:py-5">
                      <div className="min-w-0 flex-1 pr-0 sm:pr-4">
                        <div className="text-xs sm:text-sm font-medium text-slate-900">Trạng thái cửa hàng</div>
                      </div>
                      <div className="shrink-0">
                        <Form.Item name="status" valuePropName="checked" noStyle>
                          <Switch checkedChildren="Hoạt động" unCheckedChildren="Khóa" />
                        </Form.Item>
                      </div>
                    </div>
                  </div>
                </section>
              </Form>
            </div>

          {/* TAB 2: CẤU HÌNH THANH TOÁN & VIETQR */}
          <div className={settingsActiveTab === 'payment' ? 'space-y-5' : 'hidden'}>
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <CreditCardOutlined className="text-[#784e34] text-lg" />
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 m-0">Tài khoản ngân hàng &amp; Mã QR Thanh toán</h3>
                    <p className="text-xs text-slate-500 m-0">Tự động sinh mã VietQR động cho khách đặt cọc và thanh toán đơn hàng</p>
                  </div>
                </div>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={() => paymentForm.submit()}
                  className="bg-[#5d371f] hover:bg-[#784e34] text-white font-semibold text-xs px-4 h-9 rounded-none shadow-sm cursor-pointer"
                >
                  Lưu cấu hình thanh toán
                </Button>
              </div>

              <Form
                form={paymentForm}
                layout="vertical"
                onFinish={handleSaveSettings}
                initialValues={paymentSettings}
                onValuesChange={(_, allValues) => setPaymentSettings((prev) => ({ ...prev, ...allValues }))}
              >
                <Form.Item name="bankBin" noStyle>
                  <Input type="hidden" />
                </Form.Item>
                <Row gutter={24} className="items-start">
                  <Col xs={24} lg={15}>
                    <div className="space-y-4">
                      <Form.Item label={<span className="text-xs font-semibold text-slate-800">Ngân hàng thụ hưởng</span>} name="bankName" rules={[{ required: true, message: 'Vui lòng chọn ngân hàng' }]}>
                        <Select
                          showSearch
                          loading={loadingBanks}
                          placeholder="Tìm kiếm ngân hàng (MB, VCB, ACB, Techcombank...)..."
                          className="h-10 text-sm"
                          onChange={(val, option: any) => {
                            const bin = option?.key || getBankBin(val);
                            paymentForm.setFieldsValue({ bankBin: bin, bankName: val });
                            setPaymentSettings((prev) => ({ ...prev, bankName: val, bankBin: bin }));
                          }}
                          filterOption={(input, option) => {
                            const label = String(option?.label || '');
                            const val = String(option?.value || '');
                            return label.toLowerCase().includes(input.toLowerCase()) || val.toLowerCase().includes(input.toLowerCase());
                          }}
                        >
                          {vietQrBanks.length > 0 ? (
                            vietQrBanks.map((b) => (
                              <Option key={b.bin} value={`${b.shortName} (${b.name})`} label={`${b.shortName} - ${b.name} (${b.bin})`}>
                                <div className="flex items-center gap-2 py-0.5">
                                  {b.logo && (
                                    <img src={b.logo} alt={b.shortName} className="h-4 w-auto max-w-[42px] object-contain shrink-0" />
                                  )}
                                  <span className="font-semibold text-slate-800 text-xs">{b.shortName}</span>
                                  <span className="text-slate-400 text-xs truncate max-w-[280px]">- {b.name}</span>
                                  <span className="ml-auto text-[10px] font-mono text-slate-400">({b.bin})</span>
                                </div>
                              </Option>
                            ))
                          ) : (
                            <>
                              <Option value="MB Bank (Ngân hàng Quân Đội)">MB Bank - Ngân hàng TMCP Quân Đội (970422)</Option>
                              <Option value="Vietcombank (Ngân hàng Ngoại Thương)">Vietcombank - Ngân hàng Ngoại Thương (970436)</Option>
                              <Option value="Techcombank (Ngân hàng Kỹ Thương)">Techcombank - Ngân hàng Kỹ Thương (970407)</Option>
                              <Option value="ACB (Ngân hàng Á Châu)">ACB - Ngân hàng TMCP Á Châu (970416)</Option>
                              <Option value="BIDV (Ngân hàng Đầu tư & Phát triển)">BIDV - Ngân hàng Đầu tư &amp; Phát triển (970418)</Option>
                            </>
                          )}
                        </Select>
                      </Form.Item>

                      <Row gutter={16}>
                        <Col xs={24} sm={12}>
                          <Form.Item 
                            label={<span className="text-xs font-semibold text-slate-800">Số tài khoản</span>} 
                            name="accountNumber" 
                            rules={[{ required: true, message: 'Vui lòng nhập số tài khoản ngân hàng' }]}
                          >
                            <Input placeholder="VD: 0379241075" className="h-10 text-sm font-mono font-bold text-[#784e34] rounded-none" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item 
                            label={<span className="text-xs font-semibold text-slate-800">Tên chủ tài khoản</span>} 
                            name="accountName" 
                            rules={[{ required: true, message: 'Vui lòng nhập tên chủ tài khoản' }]}
                          >
                            <Input placeholder="VD: NGUYEN VAN A" className="h-10 text-sm font-semibold uppercase rounded-none" />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col xs={24} sm={12}>
                          <Form.Item label={<span className="text-xs font-semibold text-slate-800">Chi nhánh ngân hàng (không bắt buộc)</span>} name="branchName">
                            <Input placeholder="VD: Chi nhánh Sở Giao Dịch Hà Nội" className="h-10 text-sm rounded-none" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item 
                            label={<span className="text-xs font-semibold text-slate-800">Tỷ lệ cọc mặc định (%)</span>} 
                            required
                          >
                            <div className="space-y-2">
                              <Space.Compact className="w-40">
                                <Form.Item
                                  name="defaultDeposit"
                                  noStyle
                                  rules={[{ required: true, message: 'Vui lòng nhập tỷ lệ cọc' }]}
                                >
                                  <InputNumber
                                    min={0}
                                    max={100}
                                    className="h-10 text-sm w-full font-semibold text-[#784e34] rounded-none"
                                    placeholder="30"
                                  />
                                </Form.Item>
                                <div className="h-10 px-3.5 bg-slate-100 border border-l-0 border-slate-300 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0 select-none">
                                  %
                                </div>
                              </Space.Compact>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {[10, 20, 30, 50, 70, 100].map((pct) => (
                                  <button
                                    key={pct}
                                    type="button"
                                    onClick={() => {
                                      paymentForm.setFieldsValue({ defaultDeposit: pct });
                                      setPaymentSettings((prev) => ({ ...prev, defaultDeposit: pct }));
                                    }}
                                    className="px-2 py-1 text-xs border border-slate-200 bg-white hover:border-[#784e34] hover:text-[#784e34] text-slate-600 rounded cursor-pointer transition-colors"
                                  >
                                    {pct}%
                                  </button>
                                ))}
                              </div>
                            </div>
                          </Form.Item>
                        </Col>
                      </Row>
                      <div className="pt-4 border-t border-slate-200 flex items-center justify-end">
                        <Button
                          type="primary"
                          htmlType="submit"
                          icon={<SaveOutlined />}
                          className="bg-[#5d371f] hover:bg-[#784e34] text-white font-bold text-sm px-6 h-10 rounded-none shadow-sm cursor-pointer"
                        >
                          Lưu cấu hình thanh toán &amp; VietQR
                        </Button>
                      </div>
                    </div>
                  </Col>

                  {/* Live Preview QR Card */}
                  <Col xs={24} lg={9}>
                    <div className="bg-slate-50/70 p-4 rounded-none border border-slate-200/80 flex flex-col items-center">
                      <span className="text-xs font-bold text-slate-800 pb-2 mb-2 border-b border-slate-200/80 w-full text-center">
                        Xem trước mã VietQR tự động
                      </span>
                      <VietQrCard
                        bankName={paymentSettings.bankName}
                        accountNumber={paymentSettings.accountNumber}
                        accountName={paymentSettings.accountName}
                      />
                    </div>
                  </Col>
                </Row>
              </Form>
            </div>

          {/* TAB 2.5: MẪU PHIẾU IN & HÓA ĐƠN HỆ THỐNG */}
          <div className={settingsActiveTab === 'print-templates' ? 'space-y-4' : 'hidden'}>
            <PrintTemplatesSettings />
          </div>

          {/* TAB 3: CHI NHÁNH & CƠ SỞ (DOMACO POS BRANCH SETTINGS) */}
          <div className={settingsActiveTab === 'branches' ? 'space-y-4' : 'hidden'}>
              {/* Main Card Container */}
              <section className="flex-1 min-h-0 flex flex-col bg-white overflow-hidden rounded-xl border border-slate-200 shadow-xs">
                {/* Header Toolbar matching Domaco POS */}
                <div className="shrink-0 flex flex-col gap-3 border-b border-slate-200 bg-white p-3.5 sm:p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-slate-900">
                      <h3 className="m-0 text-base sm:text-lg font-semibold text-slate-900">Quản lý chi nhánh</h3>
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                        {currentBranches.length} chi nhánh
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-start sm:justify-end gap-1.5 sm:gap-2 w-full sm:w-auto">
                      <Button
                        htmlType="button"
                        icon={<CopyOutlined />}
                        disabled={selectedBranchKeys.length !== 1 || !selectedBranchRecord}
                        onClick={() => selectedBranchRecord && handleCloneBranch(selectedBranchRecord)}
                        className="!h-8 !w-8 !p-0 rounded-lg border-slate-300 bg-white text-slate-700 text-xs shadow-xs inline-flex items-center justify-center"
                        title="Sao chép chi nhánh"
                      />

                      <Button
                        htmlType="button"
                        icon={<EditOutlined />}
                        disabled={selectedBranchKeys.length !== 1 || !selectedBranchRecord}
                        onClick={() => selectedBranchRecord && handleOpenEditBranch(selectedBranchRecord)}
                        className="!h-8 !w-8 !p-0 rounded-lg border-slate-300 bg-white text-slate-700 text-xs shadow-xs inline-flex items-center justify-center"
                        title="Chỉnh sửa chi nhánh"
                      />

                      <Button
                        htmlType="button"
                        icon={<DeleteOutlined />}
                        disabled={!selectedBranchKeys.length}
                        onClick={handleDeleteSelectedBranches}
                        className="!h-8 !w-8 !p-0 rounded-lg border-slate-300 bg-white text-rose-600 text-xs shadow-xs inline-flex items-center justify-center hover:!border-rose-300 hover:!bg-rose-50"
                        title="Xóa chi nhánh đã chọn"
                      />

                      <Button
                        htmlType="button"
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleOpenCreateBranch}
                        className="!h-8 px-3 sm:px-4 bg-[#784e34] hover:!bg-[#5d371f] text-white border-none font-bold text-xs rounded-lg shadow-xs inline-flex items-center justify-center gap-1.5 ml-auto sm:ml-0"
                      >
                        Thêm mới
                      </Button>
                    </div>
                  </div>

                  {/* Quick Search Bar */}
                  <div className="w-full sm:w-80">
                    <AdminSearchInput
                      placeholder="Tìm theo mã, tên, địa chỉ..."
                      value={branchSearchQuery}
                      onChange={(val) => setBranchSearchQuery(val)}
                      sizeVariant="sm"
                    />
                  </div>
                </div>

                {/* Table View */}
                <div className="overflow-x-auto">
                  <Table
                    rowKey="id"
                    size="small"
                    dataSource={filteredBranches}
                    rowSelection={{
                      selectedRowKeys: selectedBranchKeys,
                      onChange: (keys) => setSelectedBranchKeys(keys),
                    }}
                    onRow={(record) => ({
                      onClick: () => {
                        setSelectedBranchKeys((prev) =>
                          prev.includes(record.id) ? prev.filter((k) => k !== record.id) : [...prev, record.id]
                        );
                      },
                    })}
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      pageSizeOptions: ['10', '20', '50'],
                      showTotal: (total, range) => (
                        <span className="text-xs text-slate-500 font-medium">
                          Hiển thị {range[0]} – {range[1]} trong tổng số {total} chi nhánh
                        </span>
                      ),
                    }}
                    columns={[
                      {
                        title: (
                          <div className="flex items-center gap-1">
                            <span>Mã số</span>
                            <SearchOutlined className="text-slate-400 text-3xs" />
                          </div>
                        ),
                        dataIndex: 'code',
                        key: 'code',
                        width: 130,
                        render: (value, record) => (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditBranch(record);
                            }}
                            className="font-semibold text-[#784e34] hover:underline cursor-pointer font-mono"
                          >
                            {value || '—'}
                          </span>
                        ),
                      },
                      {
                        title: (
                          <div className="flex items-center gap-1">
                            <span>Tên / Nội dung</span>
                            <SearchOutlined className="text-slate-400 text-3xs" />
                          </div>
                        ),
                        dataIndex: 'name',
                        key: 'name',
                        width: 220,
                        render: (value) => <span className="font-semibold text-slate-900">{value || '—'}</span>,
                      },
                      {
                        title: (
                          <div className="flex items-center gap-1">
                            <span>Ghi chú</span>
                            <SearchOutlined className="text-slate-400 text-3xs" />
                          </div>
                        ),
                        dataIndex: 'description',
                        key: 'description',
                        width: 200,
                        render: (value, record) => (
                          <span className="text-xs text-slate-500">
                            {value || record.typeLabel || '—'}
                          </span>
                        ),
                      },
                      {
                        title: (
                          <div className="flex items-center gap-1">
                            <span>Địa chỉ</span>
                            <SearchOutlined className="text-slate-400 text-3xs" />
                          </div>
                        ),
                        dataIndex: 'address',
                        key: 'address',
                        width: 260,
                        render: (value) => (
                          <span className="text-xs text-slate-700 truncate max-w-xs block" title={value}>
                            {value || '—'}
                          </span>
                        ),
                      },
                      {
                        title: (
                          <div className="flex items-center justify-center gap-1">
                            <span>Trạng thái</span>
                            <SearchOutlined className="text-slate-400 text-3xs" />
                          </div>
                        ),
                        dataIndex: 'status',
                        key: 'status',
                        width: 110,
                        align: 'center',
                        render: (value) => (
                          value === 'active' || value === true ? (
                            <span className="inline-block rounded bg-emerald-50 px-2.5 py-0.5 text-2xs font-bold text-emerald-700 uppercase">
                              Mở
                            </span>
                          ) : (
                            <span className="inline-block rounded bg-slate-100 px-2.5 py-0.5 text-2xs font-bold text-slate-500 uppercase">
                              Khóa
                            </span>
                          )
                        ),
                      },
                    ]}
                    className="[&_.ant-table-thead>tr>th]:!bg-white [&_.ant-table-thead>tr>th]:!font-semibold [&_.ant-table-tbody>tr>td]:!py-2.5 [&_.ant-pagination]:!m-0 [&_.ant-pagination]:!py-2.5 [&_.ant-pagination]:!px-4 [&_.ant-pagination]:border-t [&_.ant-pagination]:border-slate-200"
                  />
                </div>
              </section>

              {/* ── DRAWER: THÊM MỚI / CHỈNH SỬA CHI NHÁNH (DOMACO POS SPEC) ────────────────── */}
              <AdminFormDrawer
                open={branchDrawerOpen}
                onClose={handleCloseBranchDrawer}
                isEditing={!!editingBranch}
                createTitle="Thêm mới chi nhánh"
                editTitle="Cập nhật chi nhánh"
                recordId={editingBranch?.code}
                width={560}
                onSubmit={handleSaveBranchSubmit}
                submitText={editingBranch ? 'Lưu thay đổi' : 'Thêm chi nhánh'}
              >
                <Form form={branchForm} layout="vertical" className="space-y-4">
                  {/* Section 1: THÔNG TIN CƠ BẢN */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
                    <div className="text-xs font-bold text-slate-500 tracking-wider uppercase border-b border-slate-100 pb-2 flex items-center gap-1.5">
                      <ShopOutlined className="text-[#784e34]" /> THÔNG TIN CƠ BẢN
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <Form.Item
                        name="code"
                        label={<span className="text-xs font-semibold text-slate-700">Mã chi nhánh</span>}
                        rules={[{ required: true, message: 'Vui lòng nhập mã chi nhánh' }]}
                        className="mb-0"
                      >
                        <Input
                          className="h-10 rounded-lg text-sm font-mono font-semibold uppercase border !border-slate-300 bg-white hover:!border-[#784e34] focus:!border-[#784e34]"
                          placeholder="CN000001"
                        />
                      </Form.Item>

                      <Form.Item
                        name="name"
                        label={<span className="text-xs font-semibold text-slate-700">Tên chi nhánh</span>}
                        rules={[{ required: true, message: 'Vui lòng nhập tên chi nhánh' }]}
                        className="mb-0"
                      >
                        <Input
                          className="h-10 rounded-lg text-sm font-medium border !border-slate-300 bg-white hover:!border-[#784e34] focus:!border-[#784e34]"
                          placeholder="Ví dụ: Showroom Thảo Điền"
                        />
                      </Form.Item>
                    </div>

                    <Form.Item
                      name="description"
                      label={<span className="text-xs font-semibold text-slate-700">Mô tả</span>}
                      className="mb-0"
                    >
                      <Input.TextArea
                        rows={2}
                        className="rounded-lg text-sm border !border-slate-300 bg-white hover:!border-[#784e34] focus:!border-[#784e34] p-2.5"
                        placeholder="Nhập mô tả chi nhánh..."
                      />
                    </Form.Item>
                  </div>

                  {/* Section 2: THÔNG TIN CHI NHÁNH */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
                    <div className="text-xs font-bold text-slate-500 tracking-wider uppercase border-b border-slate-100 pb-2 flex items-center gap-1.5">
                      <EnvironmentOutlined className="text-[#784e34]" /> ĐỊA CHỈ & TRẠNG THÁI
                    </div>

                    <Form.Item
                      name="address"
                      label={<span className="text-xs font-semibold text-slate-700">Địa chỉ chi nhánh</span>}
                      className="mb-0"
                    >
                      <Input
                        className="h-10 rounded-lg text-sm border !border-slate-300 bg-white hover:!border-[#784e34] focus:!border-[#784e34]"
                        placeholder="Nhập địa chỉ đầy đủ..."
                      />
                    </Form.Item>

                    <Form.Item
                      name="status"
                      label={<span className="text-xs font-semibold text-slate-700">Trạng thái hoạt động</span>}
                      valuePropName="checked"
                      className="mb-0"
                    >
                      <Switch checkedChildren="MỞ" unCheckedChildren="KHÓA" defaultChecked />
                    </Form.Item>
                  </div>
                </Form>
              </AdminFormDrawer>
            </div>

          {/* ================= TAB 3.5: KHO HÀNG & ĐIỂM LƯU KHO TOÀN HỆ THỐNG ================= */}
          <div className={settingsActiveTab === 'warehouses' ? 'space-y-4' : 'hidden'}>
            <WarehousesSettings
              branchesList={currentBranches}
              selectedGlobalBranch={selectedGlobalBranch}
              onWarehousesUpdated={(whs) => setWarehousesCount(whs.length)}
            />
          </div>



          {/* ================= TAB 5: QUẢN LÝ NHÂN SỰ & VAI TRÒ ================= */}
          <div className={settingsActiveTab === 'employees' ? 'space-y-4' : 'hidden'}>
            <EmployeesTab
              employeesList={currentEmployees}
              setEmployeesList={setCurrentEmployees}
              branchesList={currentBranches}
              rolesList={currentRoles}
              selectedGlobalBranch="all"
            />
          </div>

          {/* ================= TAB 6: VAI TRÒ & PHÂN QUYỀN (DOMACO POS RBAC) ================= */}
          <div className={settingsActiveTab === 'permissions' ? 'space-y-5' : 'hidden'}>
              {/* Permissions Header */}
              <div className="pb-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <SafetyCertificateOutlined className="text-[#784e34] text-lg" />
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 m-0">Bảo mật, Vai trò &amp; Ma trận phân quyền (RBAC)</h3>
                    <p className="text-xs text-slate-500 m-0">Thiết lập chi tiết quyền hạn theo chức danh, phân bổ nhân sự và bảo vệ dữ liệu</p>
                  </div>
                </div>

                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleOpenCreateRole}
                  className="bg-[#784e34] hover:!bg-[#5d371f] text-xs font-semibold rounded-none shadow-none border-none flex items-center h-9"
                >
                  Tạo vai trò mới
                </Button>
              </div>

              {/* ROLE SELECTOR CAROUSEL / PILLS BAR */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">Chọn vai trò cần thiết lập quyền hạn ({currentRoles.length} vai trò):</span>
                  <div className="w-60">
                    <AdminSearchInput
                      placeholder="Tìm vai trò..."
                      value={roleSearchQuery}
                      onChange={(val) => setRoleSearchQuery(val)}
                      sizeVariant="sm"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                  {filteredRoles.map((role) => {
                    const isSelected = role.id === currentRole?.id;
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setSelectedRoleId(role.id)}
                        className={`p-3 text-left transition-all border shrink-0 min-w-[200px] max-w-[240px] cursor-pointer ${
                          isSelected
                            ? 'bg-[#784e34]/8 border-[#784e34] shadow-xs'
                            : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className={`text-xs font-bold truncate ${isSelected ? 'text-[#784e34]' : 'text-slate-900'}`}>
                            {role.name}
                          </span>
                          {role.isSystem && (
                            <Tag color="purple" className="text-[9px] px-1 py-0 m-0 leading-none">Hệ thống</Tag>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>{getRoleUserCount(role)} nhân sự</span>
                          <span className="font-bold text-[#784e34]">{role.permissions.length} quyền</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ACTIVE ROLE DETAIL CARD */}
              {currentRole && (
                <div className="border border-slate-200/80 rounded-none bg-white p-4 sm:p-5 shadow-xs space-y-4">
                  {/* Active Role Header Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-base text-slate-900">{currentRole.name}</span>
                        {currentRole.isSystem && (
                          <Tag color="purple" className="text-xs">Vai trò quản trị viên mặc định</Tag>
                        )}
                        <Tag color={currentRole.status === 'active' ? 'success' : 'default'} className="text-xs">
                          {currentRole.status === 'active' ? 'Đang áp dụng' : 'Tạm dừng'}
                        </Tag>
                      </div>
                      {currentRole.description ? (
                        <p className="text-xs text-slate-500 m-0">
                          {currentRole.description}
                        </p>
                      ) : null}
                    </div>

                    {/* Quick Role Actions (Edit, Clone, Delete) */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleOpenEditRole(currentRole)}
                        className="rounded-none text-xs"
                      >
                        Chỉnh sửa vai trò
                      </Button>

                      <Button
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => handleCloneRole(currentRole)}
                        className="rounded-none text-xs"
                      >
                        Nhân bản
                      </Button>

                      {!currentRole.isSystem && (
                        <Popconfirm
                          title="Xác nhận xóa vai trò"
                          description={`Bạn có chắc chắn muốn xóa vai trò "${currentRole.name}"?`}
                          onConfirm={() => handleDeleteRole(currentRole)}
                          okText="Xóa"
                          cancelText="Hủy"
                          okButtonProps={{ danger: true }}
                        >
                          <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            className="rounded-none text-xs"
                          >
                            Xóa
                          </Button>
                        </Popconfirm>
                      )}
                    </div>
                  </div>

                  {/* Detail View Switcher: Ma trận quyền vs Nhân sự đảm nhiệm */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <Segmented
                      value={roleDetailTab}
                      onChange={(val: any) => setRoleDetailTab(val)}
                      options={[
                        {
                          value: 'matrix',
                          label: (
                            <span className="flex items-center gap-1.5 px-3 py-0.5 text-xs font-semibold">
                              <KeyOutlined /> Ma trận phân quyền ({currentRole.permissions.length}/{allPermissionKeys.length})
                            </span>
                          ),
                        },
                        {
                          value: 'members',
                          label: (
                            <span className="flex items-center gap-1.5 px-3 py-0.5 text-xs font-semibold">
                              <TeamOutlined /> Nhân sự đảm nhiệm ({assignedEmployees.length})
                            </span>
                          ),
                        },
                      ]}
                      className="bg-slate-100 p-1 rounded-none"
                    />
                  </div>

                  {/* TAB 1: PERMISSION MATRIX VIEW (100% CHECKBOXES - NO SWITCHES) */}
                  {roleDetailTab === 'matrix' && (
                    <div className="space-y-4">
                      {/* Search & Filter Toolbar */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-none border border-slate-200">
                        <div className="w-full sm:w-80">
                          <AdminSearchInput
                            placeholder="Tìm nhanh tên quyền hoặc mã..."
                            value={permissionKeywordSearch}
                            onChange={(val) => setPermissionKeywordSearch(val)}
                            sizeVariant="sm"
                          />
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            size="small"
                            onClick={() => handleToggleAllPermissions(true)}
                            className="text-xs font-semibold text-emerald-700 bg-emerald-50 border-emerald-200 hover:!bg-emerald-100 rounded-none h-8 px-3"
                          >
                            Chọn tất cả ({allPermissionKeys.length})
                          </Button>
                          <Button
                            size="small"
                            onClick={() => handleToggleAllPermissions(false)}
                            className="text-xs font-semibold text-slate-600 bg-white border-slate-300 hover:!bg-slate-100 rounded-none h-8 px-3"
                          >
                            Bỏ chọn tất cả
                          </Button>
                          <Button
                            type="primary"
                            icon={<SaveOutlined />}
                            loading={isSavingPermissions}
                            onClick={handleSavePermissions}
                            className="bg-[#784e34] hover:!bg-[#5d371f] text-xs font-bold rounded-none h-8 px-4 shadow-none border-none"
                          >
                            Lưu phân quyền
                          </Button>
                        </div>
                      </div>

                      {/* Section Filter Tabs */}
                      <div className="overflow-x-auto border-b border-slate-200 pb-1">
                        <Tabs
                          activeKey={permissionFilterSection}
                          onChange={setPermissionFilterSection}
                          className="[&_.ant-tabs-nav]:!mb-0 [&_.ant-tabs-tab]:!py-1.5 [&_.ant-tabs-tab]:!text-xs font-medium"
                          items={[
                            {
                              key: 'all',
                              label: (
                                <span className="flex items-center gap-1.5">
                                  <span>Tất cả chức năng</span>
                                  <span className={`rounded-full px-2 py-0.2 text-[10px] font-bold ${
                                    currentRole.permissions.length > 0 ? 'bg-[#784e34]/10 text-[#784e34]' : 'bg-slate-200 text-slate-500'
                                  }`}>
                                    {currentRole.permissions.length}/{allPermissionKeys.length}
                                  </span>
                                </span>
                              ),
                            },
                            ...permissionCatalogGroups.map((group: PermissionGroup) => {
                              const groupTotal = group.permissions.length;
                              const groupGranted = group.permissions.filter((p: PermissionDefinition) => currentRole.permissions.includes(p.key)).length;
                              return {
                                key: group.groupKey,
                                label: (
                                  <span className="flex items-center gap-1.5">
                                    <span>{group.groupIcon} {group.groupName.split('(')[0].trim()}</span>
                                    <span className={`rounded-full px-2 py-0.2 text-[10px] font-bold ${
                                      groupGranted > 0 ? 'bg-[#784e34]/10 text-[#784e34]' : 'bg-slate-200 text-slate-500'
                                    }`}>
                                      {groupGranted}/{groupTotal}
                                    </span>
                                  </span>
                                ),
                              };
                            }),
                          ]}
                        />
                      </div>

                      {/* Granular Matrix Cards */}
                      <div className="space-y-4">
                        {displayedPermissionGroups.map((group: PermissionGroup) => {
                          const groupKeys = group.permissions.map((p: PermissionDefinition) => p.key);
                          const groupGrantedCount = groupKeys.filter((k: string) => currentRole.permissions.includes(k)).length;
                          const groupTotalCount = groupKeys.length;
                          const groupAllChecked = groupGrantedCount === groupTotalCount && groupTotalCount > 0;
                          const groupIndeterminate = groupGrantedCount > 0 && groupGrantedCount < groupTotalCount;

                          const subGroups: PermissionSubGroup[] = group.subGroups || [
                            { subKey: group.groupKey, subName: group.groupName, permissions: group.permissions },
                          ];

                          return (
                            <div key={group.groupKey} className="rounded-none border border-slate-200 bg-white shadow-xs overflow-hidden">
                              {/* Group Card Header */}
                              <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
                                <Checkbox
                                  checked={groupAllChecked}
                                  indeterminate={groupIndeterminate}
                                  onChange={(e) => handleToggleGroupPermissions(group.groupKey, e.target.checked)}
                                >
                                  <span className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                                    <span>{group.groupIcon}</span>
                                    <span>{group.groupName}</span>
                                  </span>
                                </Checkbox>

                                <Tag
                                  color={groupGrantedCount > 0 ? 'processing' : 'default'}
                                  className="font-mono text-xs font-bold m-0 rounded-full px-2.5"
                                >
                                  {groupGrantedCount} / {groupTotalCount} quyền đã cấp
                                </Tag>
                              </div>

                              {/* SubGroups Grid */}
                              <div className="p-3 sm:p-4 bg-slate-50/20">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                                  {subGroups.map((sub: PermissionSubGroup) => {
                                    const subTotalCount = sub.permissions.length;
                                    const subGrantedCount = sub.permissions.filter((p: PermissionDefinition) => currentRole.permissions.includes(p.key)).length;
                                    const subAllChecked = subGrantedCount === subTotalCount && subTotalCount > 0;
                                    const subIndeterminate = subGrantedCount > 0 && subGrantedCount < subTotalCount;

                                    const filteredSubPermissions = sub.permissions.filter((p: PermissionDefinition) => {
                                      if (!permissionKeywordSearch.trim()) return true;
                                      const q = permissionKeywordSearch.toLowerCase();
                                      return (
                                        p.name.toLowerCase().includes(q) ||
                                        p.key.toLowerCase().includes(q) ||
                                        (p.description && p.description.toLowerCase().includes(q))
                                      );
                                    });

                                    if (permissionKeywordSearch.trim() && filteredSubPermissions.length === 0) {
                                      return null;
                                    }

                                    return (
                                      <div key={sub.subKey} className="rounded-none border border-slate-200 bg-white shadow-2xs overflow-hidden flex flex-col">
                                        {/* SubGroup Header with SubGroup Checkbox */}
                                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/80 px-3 py-2">
                                          <Checkbox
                                            checked={subAllChecked}
                                            indeterminate={subIndeterminate}
                                            onChange={(e) => handleToggleSubGroupPermissions(sub.permissions, e.target.checked)}
                                          >
                                            <span className="font-semibold text-xs text-slate-800">{sub.subName}</span>
                                          </Checkbox>
                                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                            subGrantedCount > 0 ? 'bg-[#784e34]/10 text-[#784e34]' : 'bg-slate-100 text-slate-400'
                                          }`}>
                                            {subGrantedCount}/{subTotalCount}
                                          </span>
                                        </div>

                                        {/* Permissions List with Checkboxes (NO SWITCHES) */}
                                        <div className="p-2.5 space-y-1.5 flex-1 bg-white">
                                          {filteredSubPermissions.map((perm: PermissionDefinition) => {
                                            const isChecked = currentRole.permissions.includes(perm.key);
                                            return (
                                              <div
                                                key={perm.key}
                                                className={`flex items-start gap-2.5 p-2 rounded-none transition-colors cursor-pointer ${
                                                  isChecked
                                                    ? 'bg-[#784e34]/5 border border-[#784e34]/20'
                                                    : 'hover:bg-slate-50 border border-transparent'
                                                }`}
                                                onClick={() => handleTogglePermission(perm.key)}
                                              >
                                                <Checkbox
                                                  checked={isChecked}
                                                  onChange={() => handleTogglePermission(perm.key)}
                                                  onClick={(e) => e.stopPropagation()}
                                                  className="mt-0.5"
                                                />
                                                <div className="min-w-0 flex-1 select-none">
                                                  <div className="flex items-center gap-2">
                                                    <span className={`text-xs font-semibold ${isChecked ? 'text-[#784e34]' : 'text-slate-800'}`}>
                                                      {perm.name}
                                                    </span>
                                                  </div>
                                                  {perm.description && (
                                                    <p className="text-[11px] text-slate-500 line-clamp-1 m-0 pt-0.5">
                                                      {perm.description}
                                                    </p>
                                                  )}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: ASSIGNED EMPLOYEES VIEW */}
                  {roleDetailTab === 'members' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Danh sách nhân sự đang được áp dụng vai trò <strong>{currentRole.name}</strong> ({assignedEmployees.length} nhân viên)</span>
                        <Button
                          size="small"
                          type="link"
                          icon={<TeamOutlined />}
                          onClick={() => setSettingsActiveTab('employees')}
                          className="text-xs font-semibold text-[#784e34] p-0"
                        >
                          Quản lý hồ sơ nhân viên →
                        </Button>
                      </div>

                      {assignedEmployees.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-none border border-dashed border-slate-200">
                          <TeamOutlined className="text-3xl mb-2 text-slate-300" />
                          <p className="text-xs font-medium m-0">Chưa có nhân viên nào được phân bổ vai trò này.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                          {assignedEmployees.map((emp) => (
                            <div
                              key={emp.id}
                              className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-none flex items-center gap-3"
                            >
                              <div className="space-y-0.5 min-w-0 flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-xs text-slate-900 truncate">{emp.name}</span>
                                  <Tag color="cyan" className="font-mono text-[10px] m-0">{emp.code}</Tag>
                                </div>
                                <div className="text-[11px] text-slate-600 truncate">{emp.title}</div>
                                <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                                  <span>📞 {emp.phone}</span>
                                  <span>•</span>
                                  <span className="truncate">{emp.branch}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

        </main>
      </div>

      {/* ================= MODAL: THÊM / CHỈNH SỬA VAI TRÒ (DOMACO POS RBAC) ================= */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
            <SafetyCertificateOutlined className="text-[#784e34]" />
            <span>{editingRole ? 'Chỉnh sửa vai trò & chức danh' : 'Tạo mới vai trò & phân quyền'}</span>
          </div>
        }
        open={showRoleModal}
        forceRender
        onCancel={() => setShowRoleModal(false)}
        onOk={handleSaveRoleSubmit}
        okText={editingRole ? 'Lưu cập nhật' : 'Tạo vai trò'}
        cancelText="Hủy bỏ"
        okButtonProps={{ className: 'bg-[#784e34] hover:!bg-[#5d371f] font-bold rounded-none' }}
        cancelButtonProps={{ className: 'rounded-none' }}
      >
        <Form
          form={roleForm}
          layout="vertical"
          className="space-y-3 pt-3"
        >
          <Form.Item
            label={<span className="text-xs font-semibold text-slate-800">Tên vai trò / Chức danh</span>}
            name="name"
            rules={[{ required: true, message: 'Vui lòng nhập tên vai trò' }]}
          >
            <Input placeholder="VD: Giám đốc Dự án, KTS Trưởng, Quản lý Kho vận, Kế toán Công trình..." className="h-10 text-sm rounded-none" />
          </Form.Item>

          <Form.Item
            label={<span className="text-xs font-semibold text-slate-800">Mã vai trò (Code)</span>}
            name="code"
            rules={[{ required: true, message: 'Vui lòng nhập mã vai trò' }]}
          >
            <Input placeholder="VD: PROJECT_DIRECTOR, INTERIOR_ARCHITECT, SITE_INSTALLATION_LEAD..." className="h-10 font-mono font-bold text-sm uppercase rounded-none" />
          </Form.Item>

          {!editingRole && (
            <Form.Item
              label={<span className="text-xs font-semibold text-slate-800">Sao chép mẫu quyền từ</span>}
              name="templateRoleId"
            >
              <Select className="h-10 text-sm">
                {currentRoles.map((r) => (
                  <Option key={r.id} value={r.id}>
                    {r.name} ({r.permissions.length} quyền)
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item
            label={<span className="text-xs font-semibold text-slate-800">Mô tả chức năng & nhiệm vụ</span>}
            name="description"
          >
            <Input.TextArea
              rows={3}
              placeholder="VD: Chịu trách nhiệm tư vấn thiết kế 3D, bóc tách khối lượng dự toán, khảo sát hiện trạng công trình và điều phối lắp đặt hoàn thiện..."
              className="text-sm rounded-none"
            />
          </Form.Item>

          <div className="bg-slate-50 p-3 rounded-none border border-slate-200/80 flex items-center justify-between">
            <div>
              <div className="font-semibold text-xs text-slate-800">Trạng thái áp dụng</div>
              <div className="text-[11px] text-slate-500">Cho phép phân bổ vai trò này cho nhân viên trong hệ thống</div>
            </div>
            <Form.Item name="status" valuePropName="checked" initialValue={true} className="m-0">
              <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

export default SettingsTab;
