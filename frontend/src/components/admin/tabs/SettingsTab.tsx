'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ADMIN_STORAGE_KEYS,
  getStoredAdminData,
  setStoredAdminData,
} from '@/utils/adminStorage';
import {
  Button,
  Input,
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
  ColumnWidthOutlined,
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
import { VietQrCard } from '@/components/common/VietQrCard';
import { AdminSearchInput } from '@/components/admin';
import { EmployeesTab } from './EmployeesTab';
import { PrintTemplatesSettings } from './PrintTemplatesSettings';
import type {
  AdminBranch,
  AdminUom,
  AdminRole,
  AdminEmployee,
  AdminCompanyInfo,
  PermissionDefinition,
} from '@/types/admin';
import {
  INITIAL_BRANCHES,
  INITIAL_UOMS,
  INITIAL_ROLES,
  INITIAL_EMPLOYEES,
  PERMISSION_GROUPS,
  INITIAL_COMPANY_INFO,
} from '@/data/admin/mockData';

const { Option } = Select;

export interface SettingsTabProps {
  branchesList?: AdminBranch[];
  setBranchesList?: React.Dispatch<React.SetStateAction<AdminBranch[]>>;
  uomsList?: AdminUom[];
  rolesList?: AdminRole[];
  employeesList?: AdminEmployee[];
  selectedGlobalBranch?: string;
  activeSettingsTab?: 'company' | 'payment' | 'print-templates' | 'branches' | 'uom' | 'employees' | 'permissions';
  onSettingsTabChange?: (tab: 'company' | 'payment' | 'print-templates' | 'branches' | 'uom' | 'employees' | 'permissions') => void;
}

interface SettingsMenuItem {
  key: 'company' | 'payment' | 'print-templates' | 'branches' | 'uom' | 'employees' | 'permissions';
  icon: React.ReactNode;
  label: string;
  badge?: React.ReactNode;
  group: 'general' | 'operations' | 'security';
}

export function SettingsTab({
  branchesList = INITIAL_BRANCHES,
  setBranchesList,
  uomsList = INITIAL_UOMS,
  rolesList = INITIAL_ROLES,
  employeesList = INITIAL_EMPLOYEES,
  selectedGlobalBranch = 'all',
  activeSettingsTab,
  onSettingsTabChange,
}: SettingsTabProps) {
  const { message, modal } = App.useApp();
  const searchParams = useSearchParams();

  const urlSettingsTab = searchParams.get('settingsTab');
  const validSettingsTab = (urlSettingsTab && ['company', 'payment', 'print-templates', 'branches', 'uom', 'employees', 'permissions'].includes(urlSettingsTab))
    ? (urlSettingsTab as 'company' | 'payment' | 'print-templates' | 'branches' | 'uom' | 'employees' | 'permissions')
    : null;

  const [settingsActiveTab, setSettingsActiveTabState] = useState<'company' | 'payment' | 'print-templates' | 'branches' | 'uom' | 'employees' | 'permissions'>(
    activeSettingsTab || validSettingsTab || 'company'
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const sTab = sp.get('settingsTab') || localStorage.getItem('admin_settings_tab');
      if (sTab && ['company', 'payment', 'print-templates', 'branches', 'uom', 'employees', 'permissions'].includes(sTab)) {
        setSettingsActiveTabState(sTab as any);
      }
    }
  }, []);

  useEffect(() => {
    if (activeSettingsTab && activeSettingsTab !== settingsActiveTab) {
      setSettingsActiveTabState(activeSettingsTab);
    }
  }, [activeSettingsTab]);

  const setSettingsActiveTab = (tab: 'company' | 'payment' | 'print-templates' | 'branches' | 'uom' | 'employees' | 'permissions') => {
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
    bankName: 'MB Bank (Ngân hàng Quân Đội)',
    accountNumber: '0903888999',
    accountName: 'CTY CP NOI THAT MOC GIA ATELIER',
    paymentPrefix: 'MG',
    branchName: 'Chi nhánh TP.HCM',
    defaultDeposit: 50,
  };

  // Form and state for Payment Settings with live VietQR preview
  const [paymentForm] = Form.useForm();
  const [paymentSettings, setPaymentSettings] = useState(DEFAULT_PAYMENT_SETTINGS);

  // ================= DOMACO POS COMPANY INFO STATE & FORM =================
  const [companyInfo, setCompanyInfo] = useState<AdminCompanyInfo>(INITIAL_COMPANY_INFO);
  const [companyForm] = Form.useForm<AdminCompanyInfo>();
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // ================= DOMACO POS BRANCHES STATE & HANDLERS =================
  const [currentBranches, setCurrentBranches] = useState<AdminBranch[]>(branchesList || INITIAL_BRANCHES);
  const [currentEmployees, setCurrentEmployees] = useState<AdminEmployee[]>(employeesList || INITIAL_EMPLOYEES);

  // Initial load from storage on mount
  useEffect(() => {
    setPaymentSettings(getStoredAdminData(ADMIN_STORAGE_KEYS.PAYMENT_SETTINGS, DEFAULT_PAYMENT_SETTINGS));
    setCompanyInfo(getStoredAdminData(ADMIN_STORAGE_KEYS.COMPANY_INFO, INITIAL_COMPANY_INFO));
    setCurrentBranches(getStoredAdminData(ADMIN_STORAGE_KEYS.BRANCHES, branchesList || INITIAL_BRANCHES));
    setCurrentEmployees(getStoredAdminData(ADMIN_STORAGE_KEYS.EMPLOYEES, employeesList || INITIAL_EMPLOYEES));
  }, []);

  // Sync from props
  useEffect(() => {
    if (branchesList && branchesList.length > 0) setCurrentBranches(branchesList);
  }, [branchesList]);

  useEffect(() => {
    if (employeesList && employeesList.length > 0) setCurrentEmployees(employeesList);
  }, [employeesList]);

  // Persistence hooks for settings
  useEffect(() => {
    setStoredAdminData(ADMIN_STORAGE_KEYS.COMPANY_INFO, companyInfo);
  }, [companyInfo]);

  useEffect(() => {
    setStoredAdminData(ADMIN_STORAGE_KEYS.PAYMENT_SETTINGS, paymentSettings);
  }, [paymentSettings]);

  useEffect(() => {
    setStoredAdminData(ADMIN_STORAGE_KEYS.BRANCHES, currentBranches);
    if (setBranchesList) {
      setBranchesList(currentBranches);
    }
  }, [currentBranches, setBranchesList]);

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
    branchForm.resetFields();
    const nextNum = currentBranches.length + 1;
    const nextCode = `CN${String(nextNum).padStart(6, '0')}`;
    branchForm.setFieldsValue({
      code: nextCode,
      status: true,
    });
    setBranchDrawerOpen(true);
  };

  const handleOpenEditBranch = (record: AdminBranch) => {
    setEditingBranch(record);
    branchForm.setFieldsValue({
      code: record.code,
      name: record.name,
      description: record.description,
      address: record.address,
      status: record.status !== 'inactive',
    });
    setBranchDrawerOpen(true);
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
        setCurrentBranches((prev) =>
          prev.map((b) =>
            b.id === editingBranch.id
              ? {
                  ...b,
                  code: values.code.trim().toUpperCase(),
                  name: values.name.trim(),
                  description: values.description?.trim() || '',
                  address: values.address?.trim() || '',
                  status: values.status ? 'active' : 'inactive',
                }
              : b
          )
        );
        message.success(`Đã cập nhật chi nhánh "${values.name}" thành công!`);
      } else {
        const newBranch: AdminBranch = {
          id: `br_${Date.now()}`,
          code: values.code.trim().toUpperCase(),
          name: values.name.trim(),
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
          establishedDate: '2026-10-05',
          status: values.status ? 'active' : 'inactive',
          description: values.description?.trim() || '',
        };
        setCurrentBranches((prev) => [...prev, newBranch]);
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
      onOk: () => {
        setCurrentBranches((prev) => prev.filter((b) => !selectedBranchKeys.includes(b.id)));
        setSelectedBranchKeys([]);
        message.success(`Đã xóa ${count} chi nhánh thành công!`);
      },
    });
  };

  const handleCloneBranch = (record: AdminBranch) => {
    const nextCode = `${record.code}_COPY`;
    const cloned: AdminBranch = {
      ...record,
      id: `br_${Date.now()}`,
      code: nextCode,
      name: `${record.name} (Bản sao)`,
      status: 'active',
    };
    setCurrentBranches((prev) => [...prev, cloned]);
    message.success(`Đã nhân bản chi nhánh "${record.name}"!`);
  };

  const handleSyncBranches = async () => {
    setBranchSyncing(true);
    setTimeout(() => {
      setBranchSyncing(false);
      message.success(`Đồng bộ chi nhánh từ Accounting API thành công. Tổng: ${currentBranches.length} chi nhánh.`);
    }, 800);
  };

  // ================= DOMACO POS UOM STATE & HANDLERS =================
  const [currentUoms, setCurrentUoms] = useState<AdminUom[]>(uomsList);
  const [uomSearchQuery, setUomSearchQuery] = useState('');
  const [selectedUomKeys, setSelectedUomKeys] = useState<React.Key[]>([]);
  const [uomDrawerOpen, setUomDrawerOpen] = useState(false);
  const [editingUom, setEditingUom] = useState<AdminUom | null>(null);
  const [uomForm] = Form.useForm();

  const filteredUoms = useMemo(() => {
    const q = uomSearchQuery.trim().toLowerCase();
    if (!q) return currentUoms;
    return currentUoms.filter(
      (u) =>
        (u.code && u.code.toLowerCase().includes(q)) ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.description && u.description.toLowerCase().includes(q))
    );
  }, [currentUoms, uomSearchQuery]);

  const selectedUomRecord = useMemo(() => {
    if (selectedUomKeys.length !== 1) return null;
    return currentUoms.find((u) => u.id === selectedUomKeys[0]) || null;
  }, [currentUoms, selectedUomKeys]);

  const handleOpenCreateUom = () => {
    setEditingUom(null);
    uomForm.resetFields();
    uomForm.setFieldsValue({
      code: '',
      name: '',
      description: '',
      status: 'active',
    });
    setUomDrawerOpen(true);
  };

  const handleOpenEditUom = (item: AdminUom) => {
    setEditingUom(item);
    uomForm.setFieldsValue({
      code: item.code,
      name: item.name,
      description: item.description || '',
      status: item.status || 'active',
    });
    setUomDrawerOpen(true);
  };

  const handleCloseUomDrawer = () => {
    setUomDrawerOpen(false);
    setEditingUom(null);
    uomForm.resetFields();
  };

  const handleSaveUomSubmit = async () => {
    try {
      const values = await uomForm.validateFields();
      if (editingUom) {
        setCurrentUoms((prev) =>
          prev.map((u) =>
            u.id === editingUom.id
              ? {
                  ...u,
                  code: values.code.trim().toUpperCase(),
                  name: values.name.trim(),
                  description: values.description?.trim() || '',
                  status: values.status,
                }
              : u
          )
        );
        message.success(`Đã cập nhật đơn vị tính "${values.name}" thành công!`);
      } else {
        const newUom: AdminUom = {
          id: `uom_${Date.now()}`,
          code: values.code.trim().toUpperCase(),
          name: values.name.trim(),
          description: values.description?.trim() || '',
          status: values.status,
          isDefault: false,
          createdAt: '2026-10-05',
        };
        setCurrentUoms((prev) => [...prev, newUom]);
        message.success(`Đã thêm mới đơn vị tính "${values.name}" thành công!`);
      }
      handleCloseUomDrawer();
    } catch {
      // form validate error
    }
  };

  const handleDeleteSingleUom = (item: AdminUom) => {
    setCurrentUoms((prev) => prev.filter((u) => u.id !== item.id));
    setSelectedUomKeys((prev) => prev.filter((k) => k !== item.id));
    message.success(`Đã xóa đơn vị tính "${item.name}"`);
  };

  const handleDeleteSelectedUoms = () => {
    if (!selectedUomKeys.length) return;
    const count = selectedUomKeys.length;
    modal.confirm({
      title: 'Xác nhận xóa đơn vị tính',
      content:
        count === 1 && selectedUomRecord
          ? `Bạn có chắc chắn muốn xóa đơn vị tính "${selectedUomRecord.name}" (${selectedUomRecord.code})?`
          : `Bạn có chắc chắn muốn xóa ${count} đơn vị tính đã chọn?`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy bỏ',
      onOk: () => {
        setCurrentUoms((prev) => prev.filter((u) => !selectedUomKeys.includes(u.id)));
        setSelectedUomKeys([]);
        message.success(`Đã xóa ${count} đơn vị tính thành công!`);
      },
    });
  };

  const handleCloneUom = (record: AdminUom) => {
    const nextCode = `${record.code}_COPY`;
    const cloned: AdminUom = {
      ...record,
      id: `uom_${Date.now()}`,
      code: nextCode,
      name: `${record.name} (Bản sao)`,
      status: 'active',
    };
    setCurrentUoms((prev) => [...prev, cloned]);
    message.success(`Đã nhân bản đơn vị tính "${record.name}"!`);
  };

  const uomColumns = [
    {
      title: (
        <div className="flex items-center gap-1">
          <span>Mã đơn vị</span>
          <SearchOutlined className="text-slate-400 text-2xs" />
        </div>
      ),
      dataIndex: 'code',
      key: 'code',
      width: 140,
      render: (value: string, record: AdminUom) => (
        <span
          onClick={() => handleOpenEditUom(record)}
          className="font-semibold text-[#784e34] hover:underline cursor-pointer"
        >
          {value || '—'}
        </span>
      ),
    },
    {
      title: (
        <div className="flex items-center gap-1">
          <span>Tên đơn vị tính</span>
          <SearchOutlined className="text-slate-400 text-2xs" />
        </div>
      ),
      dataIndex: 'name',
      key: 'name',
      width: 220,
      render: (value: string) => <span className="font-medium text-slate-800">{value || '—'}</span>,
    },
    {
      title: (
        <div className="flex items-center gap-1">
          <span>Ghi chú</span>
          <SearchOutlined className="text-slate-400 text-2xs" />
        </div>
      ),
      dataIndex: 'description',
      key: 'description',
      render: (value: string) => <span className="text-slate-600">{value || '---'}</span>,
    },
    {
      title: (
        <div className="flex items-center justify-center gap-1">
          <span>Trạng thái</span>
          <SearchOutlined className="text-slate-400 text-2xs" />
        </div>
      ),
      dataIndex: 'status',
      key: 'status',
      width: 130,
      align: 'center' as const,
      render: (value: string) =>
        value !== 'inactive' ? (
          <span className="inline-block rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2.5 py-0.5 text-2xs font-bold uppercase">
            MỞ
          </span>
        ) : (
          <span className="inline-block rounded bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-0.5 text-2xs font-bold uppercase">
            KHÓA
          </span>
        ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 140,
      align: 'center' as const,
      render: (_: any, item: AdminUom) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleOpenEditUom(item)}
            className="text-slate-600 hover:!text-[#784e34] !h-7 px-2 text-xs font-medium"
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xóa đơn vị tính"
            description={`Bạn có chắc muốn xóa đơn vị tính "${item.name}"?`}
            okText="Xóa"
            cancelText="Hủy"
            onConfirm={() => handleDeleteSingleUom(item)}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              className="!h-7 px-2 text-xs font-medium text-rose-600 hover:!text-rose-700"
            >
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ================= DOMACO POS RBAC ROLES & PERMISSIONS STATE =================
  const [currentRoles, setCurrentRoles] = useState<AdminRole[]>(rolesList || INITIAL_ROLES);

  useEffect(() => {
    setCurrentRoles(getStoredAdminData(ADMIN_STORAGE_KEYS.ROLES, rolesList || INITIAL_ROLES));
  }, []);

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

  // Helper to get real-time assigned employee count
  const getRoleUserCount = (role: AdminRole) => {
    return employeesList.filter((emp) => {
      if (emp.role === role.id || emp.role === role.code) return true;
      const titleLower = emp.title?.toLowerCase() || '';
      const deptLower = emp.department?.toLowerCase() || '';
      if (role.code === 'SUPER_ADMIN' || role.id === 'role_admin') {
        return emp.code === 'NV001' || titleLower.includes('giám đốc') || titleLower.includes('quản trị');
      }
      if (role.code === 'PROJECT_DIRECTOR' || role.id === 'role_director') {
        return titleLower.includes('quản lý') || titleLower.includes('trưởng phòng') || titleLower.includes('sales lead');
      }
      if (role.code === 'INTERIOR_ARCHITECT' || role.id === 'role_architect') {
        return titleLower.includes('tư vấn') || titleLower.includes('kiến trúc') || titleLower.includes('thiết kế');
      }
      if (role.code === 'STORE_WAREHOUSE_MANAGER' || role.id === 'role_warehouse_lead') {
        return titleLower.includes('kho') || deptLower.includes('kho');
      }
      if (role.code === 'PROJECT_COST_ACCOUNTANT' || role.id === 'role_cost_accountant') {
        return titleLower.includes('kế toán') || deptLower.includes('tài chính');
      }
      if (role.code === 'SITE_INSTALLATION_LEAD' || role.id === 'role_site_engineer') {
        return titleLower.includes('giao') || titleLower.includes('lắp đặt') || titleLower.includes('vận chuyển');
      }
      return false;
    }).length;
  };

  // Employees assigned to current role
  const assignedEmployees = useMemo(() => {
    if (!currentRole) return [];
    return employeesList.filter((emp) => {
      if (emp.role === currentRole.id || emp.role === currentRole.code) return true;
      const titleLower = emp.title?.toLowerCase() || '';
      const deptLower = emp.department?.toLowerCase() || '';
      if (currentRole.code === 'SUPER_ADMIN' || currentRole.id === 'role_admin') {
        return emp.code === 'NV001' || titleLower.includes('giám đốc') || titleLower.includes('quản trị');
      }
      if (currentRole.code === 'PROJECT_DIRECTOR' || currentRole.id === 'role_director') {
        return titleLower.includes('quản lý') || titleLower.includes('trưởng phòng') || titleLower.includes('sales lead');
      }
      if (currentRole.code === 'INTERIOR_ARCHITECT' || currentRole.id === 'role_architect') {
        return titleLower.includes('tư vấn') || titleLower.includes('kiến trúc') || titleLower.includes('thiết kế');
      }
      if (currentRole.code === 'STORE_WAREHOUSE_MANAGER' || currentRole.id === 'role_warehouse_lead') {
        return titleLower.includes('kho') || deptLower.includes('kho');
      }
      if (currentRole.code === 'PROJECT_COST_ACCOUNTANT' || currentRole.id === 'role_cost_accountant') {
        return titleLower.includes('kế toán') || deptLower.includes('tài chính');
      }
      if (currentRole.code === 'SITE_INSTALLATION_LEAD' || currentRole.id === 'role_site_engineer') {
        return titleLower.includes('giao') || titleLower.includes('lắp đặt') || titleLower.includes('vận chuyển');
      }
      return false;
    });
  }, [employeesList, currentRole]);

  // Total permissions across all groups
  const allPermissionKeys = useMemo(() => {
    return PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.key));
  }, []);

  const [permissionFilterSection, setPermissionFilterSection] = useState<string>('all');
  const [permissionKeywordSearch, setPermissionKeywordSearch] = useState<string>('');

  const displayedPermissionGroups = useMemo(() => {
    let groups = PERMISSION_GROUPS;
    if (permissionFilterSection !== 'all') {
      groups = groups.filter((g) => g.groupKey === permissionFilterSection);
    }
    if (!permissionKeywordSearch.trim()) return groups;
    const q = permissionKeywordSearch.toLowerCase();
    return groups.filter((g) => {
      return (
        g.groupName.toLowerCase().includes(q) ||
        g.permissions.some(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.key.toLowerCase().includes(q) ||
            (p.description && p.description.toLowerCase().includes(q))
        )
      );
    });
  }, [permissionFilterSection, permissionKeywordSearch]);

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
    const targetGroup = PERMISSION_GROUPS.find((g) => g.groupKey === groupKey);
    if (!targetGroup) return;

    const groupKeys = targetGroup.permissions.map((p) => p.key);
    let updatedPerms: string[];

    if (grant) {
      const merged = new Set([...currentRole.permissions, ...groupKeys]);
      updatedPerms = Array.from(merged);
    } else {
      updatedPerms = currentRole.permissions.filter((k) => !groupKeys.includes(k));
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
    roleForm.resetFields();
    roleForm.setFieldsValue({
      status: true,
      templateRoleId: currentRoles[0]?.id || 'role_director',
    });
    setShowRoleModal(true);
  };

  const handleOpenEditRole = (role: AdminRole) => {
    setEditingRole(role);
    roleForm.resetFields();
    roleForm.setFieldsValue({
      name: role.name,
      code: role.code,
      description: role.description,
      status: role.status === 'active',
    });
    setShowRoleModal(true);
  };

  const handleCloneRole = (role: AdminRole) => {
    const clonedId = `role_${Date.now()}`;
    const newRole: AdminRole = {
      id: clonedId,
      code: `${role.code}_COPY`,
      name: `${role.name} (Bản sao)`,
      description: `Bản sao quyền hạn từ ${role.name}`,
      userCount: 0,
      isSystem: false,
      status: 'active',
      permissions: [...role.permissions],
    };

    setCurrentRoles((prev) => [...prev, newRole]);
    setSelectedRoleId(clonedId);
    message.success(`Đã nhân bản vai trò "${role.name}" thành công!`);
  };

  const handleDeleteRole = (role: AdminRole) => {
    if (role.isSystem) {
      message.error('Không thể xóa vai trò quản trị mặc định của hệ thống!');
      return;
    }

    const remainingRoles = currentRoles.filter((r) => r.id !== role.id);
    setCurrentRoles(remainingRoles);
    if (selectedRoleId === role.id && remainingRoles.length > 0) {
      setSelectedRoleId(remainingRoles[0].id);
    }
    message.success(`Đã xóa vai trò "${role.name}" thành công!`);
  };

  const handleSaveRoleSubmit = async () => {
    try {
      const values = await roleForm.validateFields();
      if (editingRole) {
        // Update existing role
        setCurrentRoles((prev) =>
          prev.map((r) =>
            r.id === editingRole.id
              ? {
                  ...r,
                  name: values.name,
                  code: values.code.toUpperCase(),
                  description: values.description,
                  status: values.status ? 'active' : 'inactive',
                }
              : r
          )
        );
        message.success(`Đã cập nhật thông tin vai trò "${values.name}"!`);
      } else {
        // Create new role
        const templateRole = currentRoles.find((r) => r.id === values.templateRoleId);
        const newRoleId = `role_${Date.now()}`;
        const newRole: AdminRole = {
          id: newRoleId,
          code: values.code.toUpperCase(),
          name: values.name,
          description: values.description || '',
          userCount: 0,
          isSystem: false,
          status: values.status ? 'active' : 'inactive',
          permissions: templateRole ? [...templateRole.permissions] : [],
        };
        setCurrentRoles((prev) => [...prev, newRole]);
        setSelectedRoleId(newRoleId);
        message.success(`Đã tạo vai trò mới "${values.name}" thành công!`);
      }
      setShowRoleModal(false);
    } catch (err) {
      // Form validation error
    }
  };

  const handleSaveCompanyInfo = (values: AdminCompanyInfo) => {
    setCompanyInfo((prev) => ({
      ...prev,
      ...values,
    }));
    message.success('Đã lưu và cập nhật thông tin doanh nghiệp & cửa hàng POS thành công!');
  };

  const handleResetCompanyInfo = () => {
    companyForm.resetFields();
    companyForm.setFieldsValue(INITIAL_COMPANY_INFO);
    setCompanyInfo(INITIAL_COMPANY_INFO);
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

  const handleSaveSettings = (values: any) => {
    setPaymentSettings((prev) => ({ ...prev, ...values }));
    message.success('Đã lưu cấu hình tài khoản thanh toán & mã VietQR thành công!');
  };

  const handleTopToolbarSave = () => {
    if (settingsActiveTab === 'company') {
      companyForm.submit();
    } else if (settingsActiveTab === 'payment') {
      paymentForm.submit();
    } else {
      message.success('Cấu hình đã được đồng bộ!');
    }
  };

  // ================= SIDEBAR MENU DEFINITION =================
  const settingsMenuItems: SettingsMenuItem[] = [
    {
      key: 'company',
      icon: <ShopOutlined />,
      label: 'Thông tin doanh nghiệp',
      group: 'general',
    },
    {
      key: 'payment',
      icon: <CreditCardOutlined />,
      label: 'Cấu hình thanh toán & QR',
      group: 'general',
    },
    {
      key: 'print-templates',
      icon: <PrinterOutlined />,
      label: 'Mẫu phiếu in & Hóa đơn',
      group: 'general',
    },
    {
      key: 'branches',
      icon: <EnvironmentOutlined />,
      label: 'Chi nhánh & Cơ sở',
      badge: <Tag color="default" className="font-mono text-[10px] m-0 bg-slate-100 border-slate-200">{currentBranches.length}</Tag>,
      group: 'operations',
    },
    {
      key: 'uom',
      icon: <ColumnWidthOutlined />,
      label: 'Đơn vị tính (UOM)',
      badge: <Tag color="default" className="font-mono text-[10px] m-0 bg-slate-100 border-slate-200">{currentUoms.length}</Tag>,
      group: 'operations',
    },
    {
      key: 'employees',
      icon: <TeamOutlined />,
      label: 'Nhân viên & Người dùng',
      badge: <Tag color="default" className="font-mono text-[10px] m-0 bg-slate-100 border-slate-200">{currentEmployees.length}</Tag>,
      group: 'security',
    },
    {
      key: 'permissions',
      icon: <SafetyCertificateOutlined />,
      label: 'Vai trò & Phân quyền',
      badge: <Tag color="gold" className="font-mono text-[10px] m-0">{currentRoles.length} vai trò</Tag>,
      group: 'security',
    },
  ];

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
            <p className="text-xs text-slate-500 m-0">Quản lý cấu hình doanh nghiệp, thanh toán, mẫu phiếu in, cơ sở chi nhánh, đơn vị tính, nhân sự và phân quyền RBAC</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleTopToolbarSave}
            className="h-10 rounded-none bg-[#784e34] hover:!bg-[#5d371f] px-5 text-sm font-medium text-white shadow-none border-none flex items-center"
          >
            Lưu cấu hình
          </Button>
        </div>
      </div>

      {/* Responsive Segmented Tabs for Mobile / Tablet (< lg) */}
      <div className="block lg:hidden bg-white p-3 rounded-none border border-slate-200/80 shadow-xs overflow-x-auto">
        <Segmented
          value={settingsActiveTab}
          onChange={(val: any) => setSettingsActiveTab(val)}
          options={[
            { value: 'company', label: '🏢 Doanh nghiệp' },
            { value: 'payment', label: '💳 Thanh toán' },
            { value: 'print-templates', label: '🖨️ Phiếu in' },
            { value: 'branches', label: `🏬 Chi nhánh (${currentBranches.length})` },
            { value: 'uom', label: `📏 ĐVT (${currentUoms.length})` },
            { value: 'employees', label: `👥 Nhân viên (${currentEmployees.length})` },
            { value: 'permissions', label: `🔐 Phân quyền (${currentRoles.length})` },
          ]}
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
          {settingsActiveTab === 'company' && (
            <div className="space-y-4">
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
                  code: companyInfo.code || 'MOCGIA-LUXURY',
                  companyName: companyInfo.companyName || 'CÔNG TY CỔ PHẦN NỘI THẤT CAO CẤP MỘC GIA',
                  taxId: companyInfo.taxId || '0316888999',
                  phone: companyInfo.phone || '0903 888 999',
                  email: companyInfo.email || 'contact@mocgia-atelier.vn',
                  address: companyInfo.headquarters || 'Số 28 Đường Thảo Điền, Phường Thảo Điền, TP. Thủ Đức, TP. Hồ Chí Minh',
                  logoUrl: companyInfo.logoUrl || null,
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
                      <div className="flex min-w-0 items-center gap-3.5">
                        <div className="flex h-16 w-24 sm:h-20 sm:w-32 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white p-2">
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
                          <div className="text-xs sm:text-sm font-semibold text-slate-900">Logo công ty</div>
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
                    <h2 className="m-0 text-sm font-semibold text-slate-900">Thông tin liên hệ</h2>
                  </div>
                  <div className="px-4 py-4 sm:px-6 sm:py-5">
                    <div className="grid grid-cols-1 gap-x-4 gap-y-1">
                      <Form.Item label="Email hỗ trợ" name="email">
                        <Input
                          placeholder="Nhập email hỗ trợ"
                          className="h-9 sm:h-10 rounded-lg text-xs sm:text-sm"
                        />
                      </Form.Item>
                      <Form.Item label="Địa chỉ trụ sở chính" name="address">
                        <Input.TextArea
                          rows={3}
                          placeholder="Nhập địa chỉ trụ sở chính"
                          className="rounded-lg text-xs sm:text-sm"
                        />
                      </Form.Item>
                    </div>
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
          )}

          {/* TAB 2: CẤU HÌNH THANH TOÁN & VIETQR */}
          {settingsActiveTab === 'payment' && (
            <div className="space-y-5">
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCardOutlined className="text-[#784e34] text-lg" />
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 m-0">Tài khoản ngân hàng &amp; Mã QR Thanh toán</h3>
                    <p className="text-xs text-slate-500 m-0">Tự động sinh mã VietQR động cho khách đặt cọc và thanh toán đơn hàng</p>
                  </div>
                </div>
              </div>

              <Form
                form={paymentForm}
                layout="vertical"
                onFinish={handleSaveSettings}
                initialValues={paymentSettings}
                onValuesChange={(_, allValues) => setPaymentSettings((prev) => ({ ...prev, ...allValues }))}
              >
                <Row gutter={24} className="items-start">
                  <Col xs={24} lg={15}>
                    <div className="space-y-4">
                      <Form.Item label={<span className="text-xs font-semibold text-slate-800">Ngân hàng thụ hưởng</span>} name="bankName" rules={[{ required: true }]}>
                        <Select className="h-10 text-sm">
                          <Option value="MB Bank (Ngân hàng Quân Đội)">MB Bank - Ngân hàng TMCP Quân Đội (970422)</Option>
                          <Option value="Vietcombank (Ngân hàng Ngoại Thương)">Vietcombank - Ngân hàng Ngoại Thương (970436)</Option>
                          <Option value="Techcombank (Ngân hàng Kỹ Thương)">Techcombank - Ngân hàng Kỹ Thương (970407)</Option>
                          <Option value="ACB (Ngân hàng Á Châu)">ACB - Ngân hàng TMCP Á Châu (970416)</Option>
                          <Option value="BIDV (Ngân hàng Đầu tư & Phát triển)">BIDV - Ngân hàng Đầu tư &amp; Phát triển (970418)</Option>
                        </Select>
                      </Form.Item>

                      <Row gutter={16}>
                        <Col xs={24} sm={12}>
                          <Form.Item label={<span className="text-xs font-semibold text-slate-800">Số tài khoản</span>} name="accountNumber" rules={[{ required: true }]}>
                            <Input className="h-10 text-sm font-mono font-bold text-[#784e34] rounded-none" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item label={<span className="text-xs font-semibold text-slate-800">Tên chủ tài khoản</span>} name="accountName" rules={[{ required: true }]}>
                            <Input className="h-10 text-sm font-semibold uppercase rounded-none" />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col xs={24} sm={12}>
                          <Form.Item label={<span className="text-xs font-semibold text-slate-800">Tiền tố cú pháp chuyển khoản</span>} name="paymentPrefix">
                            <Input className="h-10 text-sm font-mono font-bold rounded-none" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item label={<span className="text-xs font-semibold text-slate-800">Tỷ lệ cọc mặc định (%)</span>} name="defaultDeposit">
                            <Select className="h-10 text-sm">
                              <Option value={30}>Đặt cọc 30% giá trị hợp đồng</Option>
                              <Option value={50}>Đặt cọc 50% giá trị hợp đồng</Option>
                              <Option value={100}>Thanh toán 100%</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>
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
                        paymentPrefix={paymentSettings.paymentPrefix}
                      />
                    </div>
                  </Col>
                </Row>
              </Form>
            </div>
          )}

          {/* TAB 2.5: MẪU PHIẾU IN & HÓA ĐƠN HỆ THỐNG */}
          {settingsActiveTab === 'print-templates' && (
            <PrintTemplatesSettings />
          )}

          {/* TAB 3: CHI NHÁNH & CƠ SỞ (DOMACO POS BRANCH SETTINGS) */}
          {settingsActiveTab === 'branches' && (
            <div className="space-y-4">
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
              <Drawer
                title={editingBranch ? 'Cập nhật chi nhánh' : 'Thêm mới chi nhánh'}
                open={branchDrawerOpen}
                onClose={handleCloseBranchDrawer}
                destroyOnHidden
                styles={{
                  wrapper: { width: 520, maxWidth: '100vw' },
                  header: { borderBottom: '1px solid #e2e8f0', padding: '12px 16px' },
                  body: { padding: 0, overflowY: 'auto' },
                }}
                extra={
                  <div className="flex items-center gap-2">
                    <Button onClick={handleCloseBranchDrawer} className="h-8 px-3 sm:px-4 rounded-lg border-slate-300 text-slate-600 text-xs font-semibold">
                      Hủy bỏ
                    </Button>
                    <Button
                      type="primary"
                      onClick={handleSaveBranchSubmit}
                      className="h-8 px-3 sm:px-4 rounded-lg text-xs font-semibold bg-[#784e34] hover:!bg-[#5d371f] text-white border-none shadow-none"
                    >
                      Lưu dữ liệu
                    </Button>
                  </div>
                }
              >
                <Form form={branchForm} layout="vertical">
                  <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                    {/* Section 1: THÔNG TIN CƠ BẢN */}
                    <div className="space-y-3 sm:space-y-4">
                      <div className="text-xs font-bold text-slate-500 tracking-widest uppercase border-b border-slate-100 pb-2">
                        THÔNG TIN CƠ BẢN
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <Form.Item
                          name="code"
                          label={<span className="text-xs font-medium text-slate-700">* Mã chi nhánh</span>}
                          rules={[{ required: true, message: 'Nhập mã chi nhánh' }]}
                          className="mb-0"
                        >
                          <Input
                            className="h-9 rounded-lg text-xs sm:text-sm font-mono uppercase"
                            placeholder="CN000001"
                          />
                        </Form.Item>

                        <Form.Item
                          name="name"
                          label={<span className="text-xs font-medium text-slate-700">* Tên chi nhánh</span>}
                          rules={[{ required: true, message: 'Nhập tên chi nhánh' }]}
                          className="mb-0"
                        >
                          <Input className="h-9 rounded-lg text-xs sm:text-sm" placeholder="Ví dụ: Showroom Thảo Điền" />
                        </Form.Item>
                      </div>

                      <Form.Item
                        name="description"
                        label={<span className="text-xs font-medium text-slate-700">Mô tả</span>}
                        className="mb-0"
                      >
                        <Input.TextArea rows={2} className="rounded-lg text-xs sm:text-sm" placeholder="Nhập mô tả chi nhánh..." />
                      </Form.Item>
                    </div>

                    {/* Section 2: THÔNG TIN CHI NHÁNH */}
                    <div className="space-y-3 sm:space-y-4 pt-2">
                      <div className="text-xs font-bold text-slate-500 tracking-widest uppercase border-b border-slate-100 pb-2">
                        THÔNG TIN CHI NHÁNH
                      </div>

                      <Form.Item
                        name="address"
                        label={<span className="text-xs font-medium text-slate-700">Địa chỉ chi nhánh</span>}
                        className="mb-0"
                      >
                        <Input className="h-9 rounded-lg text-xs sm:text-sm" placeholder="Nhập địa chỉ đầy đủ..." />
                      </Form.Item>

                      <Form.Item
                        name="status"
                        label={<span className="text-xs font-medium text-slate-700">Trạng thái hoạt động</span>}
                        valuePropName="checked"
                        className="mb-0"
                      >
                        <Switch checkedChildren="MỞ" unCheckedChildren="KHÓA" defaultChecked />
                      </Form.Item>
                    </div>
                  </div>
                </Form>
              </Drawer>
            </div>
          )}

          {/* ================= TAB 4: ĐƠN VỊ TÍNH (DOMACO POS SPEC) ================= */}
          {settingsActiveTab === 'uom' && (
            <div className="space-y-4">
              <section className="flex flex-col bg-white rounded-none border border-slate-200/80 shadow-xs overflow-hidden">
                {/* ── TOOLBAR (DOMACO POS SPEC) ── */}
                <div className="shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 bg-white p-3 sm:p-4">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <h3 className="text-sm font-semibold text-slate-900 m-0">Đơn vị tính</h3>
                    <div className="w-full sm:w-64">
                      <AdminSearchInput
                        placeholder="Tìm kiếm đơn vị tính..."
                        value={uomSearchQuery}
                        onChange={(val) => setUomSearchQuery(val)}
                        sizeVariant="sm"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2 w-full sm:w-auto">
                    <Button
                      icon={<CopyOutlined />}
                      disabled={selectedUomKeys.length !== 1 || !selectedUomRecord}
                      onClick={() => selectedUomRecord && handleCloneUom(selectedUomRecord)}
                      className="h-8 w-8 p-0 rounded-lg border-slate-300 bg-white text-slate-700 text-xs shadow-none inline-flex items-center justify-center disabled:opacity-50"
                      title="Sao chép"
                    />
                    <Button
                      icon={<EditOutlined />}
                      disabled={selectedUomKeys.length !== 1 || !selectedUomRecord}
                      onClick={() => selectedUomRecord && handleOpenEditUom(selectedUomRecord)}
                      className="h-8 w-8 p-0 rounded-lg border-slate-300 bg-white text-slate-700 text-xs shadow-none inline-flex items-center justify-center disabled:opacity-50"
                      title="Chỉnh sửa"
                    />
                    <Button
                      icon={<DeleteOutlined />}
                      disabled={!selectedUomKeys.length}
                      onClick={handleDeleteSelectedUoms}
                      className="h-8 w-8 p-0 rounded-lg border-slate-300 bg-white text-rose-600 text-xs shadow-none inline-flex items-center justify-center hover:!border-rose-300 hover:!bg-rose-50 disabled:opacity-50"
                      title="Xóa"
                    />
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleOpenCreateUom}
                      className="h-8 px-3 sm:px-4 bg-[#784e34] hover:!bg-[#5d371f] text-white border-none font-bold text-xs rounded-lg shadow-none inline-flex items-center justify-center gap-1.5"
                    >
                      Thêm đơn vị
                    </Button>
                  </div>
                </div>

                {/* ── DATA TABLE ── */}
                <div className="overflow-x-auto">
                  <Table
                    rowKey="id"
                    dataSource={filteredUoms}
                    columns={uomColumns}
                    size="middle"
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      pageSizeOptions: ['10', '20', '50'],
                      showTotal: (total, range) => (
                        <span className="text-xs text-slate-500 font-medium">
                          Hiển thị {range[0]} – {range[1]} trong tổng số {total} bản ghi
                        </span>
                      ),
                    }}
                    rowSelection={{
                      columnWidth: 42,
                      selectedRowKeys: selectedUomKeys,
                      onChange: (keys) => setSelectedUomKeys(keys),
                    }}
                    onRow={(record) => ({
                      onClick: () => {
                        setSelectedUomKeys((prev) =>
                          prev.includes(record.id) ? prev.filter((id) => id !== record.id) : [...prev, record.id]
                        );
                      },
                    })}
                    className="[&_.ant-table-thead>tr>th]:!bg-white [&_.ant-table-thead>tr>th]:!font-semibold [&_.ant-table-tbody>tr>td]:!py-2.5 [&_.ant-pagination]:!m-0 [&_.ant-pagination]:!py-2.5 [&_.ant-pagination]:!px-4 [&_.ant-pagination]:border-t [&_.ant-pagination]:border-slate-200"
                  />
                </div>
              </section>

              {/* ── DRAWER: THÊM MỚI / CHỈNH SỬA ĐƠN VỊ TÍNH (DOMACO POS SPEC) ── */}
              <Drawer
                title={editingUom ? 'Sửa đơn vị tính' : 'Thêm đơn vị tính'}
                open={uomDrawerOpen}
                onClose={handleCloseUomDrawer}
                destroyOnHidden
                styles={{
                  wrapper: { width: 460, maxWidth: '100vw' },
                  header: { borderBottom: '1px solid #e2e8f0', padding: '12px 16px' },
                  body: { padding: 0, overflowY: 'auto' },
                }}
                extra={
                  <div className="flex items-center gap-2">
                    <Button onClick={handleCloseUomDrawer} className="h-8 px-3 sm:px-4 rounded-lg border-slate-300 text-slate-600 text-xs font-semibold">
                      Hủy
                    </Button>
                    <Button
                      type="primary"
                      onClick={handleSaveUomSubmit}
                      className="h-8 px-3 sm:px-4 rounded-lg text-xs font-semibold bg-[#784e34] hover:!bg-[#5d371f] text-white border-none shadow-none"
                    >
                      Lưu
                    </Button>
                  </div>
                }
              >
                <Form form={uomForm} layout="vertical" className="p-4 sm:p-6 space-y-4">
                  <Form.Item
                    label={<span className="text-xs font-medium text-slate-700">* Mã đơn vị</span>}
                    name="code"
                    rules={[{ required: true, message: 'Vui lòng nhập mã đơn vị' }]}
                    className="mb-0"
                  >
                    <Input
                      aria-label="Mã đơn vị"
                      className="h-9 rounded-lg text-xs sm:text-sm font-mono uppercase"
                      placeholder="VD: HOP, CHIEC, LOC..."
                    />
                  </Form.Item>

                  <Form.Item
                    label={<span className="text-xs font-medium text-slate-700">* Tên đơn vị</span>}
                    name="name"
                    rules={[{ required: true, message: 'Vui lòng nhập tên đơn vị' }]}
                    className="mb-0"
                  >
                    <Input
                      aria-label="Tên đơn vị"
                      className="h-9 rounded-lg text-xs sm:text-sm font-medium"
                      placeholder="VD: Hộp, Chiếc, Lốc..."
                    />
                  </Form.Item>

                  <Form.Item
                    label={<span className="text-xs font-medium text-slate-700">Ghi chú</span>}
                    name="description"
                    className="mb-0"
                  >
                    <Input.TextArea
                      aria-label="Ghi chú đơn vị tính"
                      rows={3}
                      className="rounded-lg text-xs sm:text-sm"
                      placeholder="Nhập ghi chú hoặc quy cách..."
                    />
                  </Form.Item>

                  <Form.Item
                    label={<span className="text-xs font-medium text-slate-700">Trạng thái</span>}
                    name="status"
                    initialValue="active"
                    className="mb-0"
                  >
                    <Select
                      aria-label="Trạng thái đơn vị tính"
                      options={[
                        { value: 'active', label: 'Đang sử dụng (Mở)' },
                        { value: 'inactive', label: 'Ngừng sử dụng (Khóa)' },
                      ]}
                      className="w-full text-xs sm:text-sm"
                    />
                  </Form.Item>
                </Form>
              </Drawer>
            </div>
          )}

          {/* ================= TAB 5: QUẢN LÝ NHÂN SỰ & TÀI KHOẢN POS ================= */}
          {settingsActiveTab === 'employees' && (
            <div className="space-y-4">
              <EmployeesTab
                employeesList={currentEmployees}
                setEmployeesList={setCurrentEmployees}
                branchesList={currentBranches}
                rolesList={currentRoles}
                selectedGlobalBranch={selectedGlobalBranch}
              />
            </div>
          )}

          {/* ================= TAB 6: VAI TRÒ & PHÂN QUYỀN (DOMACO POS RBAC) ================= */}
          {settingsActiveTab === 'permissions' && (
            <div className="space-y-5">
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
                            onClick={() => message.success(`Đã lưu ma trận phân quyền cho vai trò "${currentRole.name}" thành công!`)}
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
                            ...PERMISSION_GROUPS.map((group) => {
                              const groupTotal = group.permissions.length;
                              const groupGranted = group.permissions.filter((p) => currentRole.permissions.includes(p.key)).length;
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
                        {displayedPermissionGroups.map((group) => {
                          const groupKeys = group.permissions.map((p) => p.key);
                          const groupGrantedCount = groupKeys.filter((k) => currentRole.permissions.includes(k)).length;
                          const groupTotalCount = groupKeys.length;
                          const groupAllChecked = groupGrantedCount === groupTotalCount && groupTotalCount > 0;
                          const groupIndeterminate = groupGrantedCount > 0 && groupGrantedCount < groupTotalCount;

                          const subGroups = group.subGroups || [
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
                                  {subGroups.map((sub) => {
                                    const subTotalCount = sub.permissions.length;
                                    const subGrantedCount = sub.permissions.filter((p) => currentRole.permissions.includes(p.key)).length;
                                    const subAllChecked = subGrantedCount === subTotalCount && subTotalCount > 0;
                                    const subIndeterminate = subGrantedCount > 0 && subGrantedCount < subTotalCount;

                                    const filteredSubPermissions = sub.permissions.filter((p) => {
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
                                          {filteredSubPermissions.map((perm) => {
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
          )}

          {/* ================= TAB 5: NHÂN VIÊN & TÀI KHOẢN (DOMACO POS SPEC) ================= */}
          {settingsActiveTab === 'employees' && (
            <EmployeesTab
              employeesList={currentEmployees}
              setEmployeesList={setCurrentEmployees}
              branchesList={currentBranches}
              rolesList={currentRoles}
            />
          )}
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
        onCancel={() => setShowRoleModal(false)}
        onOk={handleSaveRoleSubmit}
        okText={editingRole ? 'Lưu cập nhật' : 'Tạo vai trò'}
        cancelText="Hủy bỏ"
        okButtonProps={{ className: 'bg-[#784e34] hover:!bg-[#5d371f] font-bold rounded-none' }}
        cancelButtonProps={{ className: 'rounded-none' }}
        destroyOnHidden
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
