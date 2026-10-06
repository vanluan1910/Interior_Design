'use client';

import React, { useState, useMemo } from 'react';
import {
  Button,
  Select,
  Tag,
  Popconfirm,
  App,
  Drawer,
  Modal,
  Form,
  Input,
  Radio,
  DatePicker,
  Segmented,
  Upload,
  Tooltip,
  Space,
  Row,
  Col,
  Avatar,
  Switch,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
  DownloadOutlined,
  UploadOutlined,
  SearchOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  BankOutlined,
  KeyOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  TeamOutlined,
  IdcardOutlined,
  ShopOutlined,
  ApartmentOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  CalendarOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  AdminDataTable,
  AdminFilterSidebar,
  AdminSidebarSummary,
  AdminSearchInput,
} from '@/components/admin';
import { exportToExcel } from '@/utils/exportExcel';
import type { AdminEmployee, AdminBranch, AdminRole } from '@/types/admin';
import {
  INITIAL_EMPLOYEES,
  INITIAL_BRANCHES,
  INITIAL_ROLES,
} from '@/data/admin/mockData';
import { isMatchBranch } from '@/utils/branchHelper';

export interface EmployeesTabProps {
  employeesList?: AdminEmployee[];
  setEmployeesList?: React.Dispatch<React.SetStateAction<AdminEmployee[]>>;
  branchesList?: AdminBranch[];
  rolesList?: AdminRole[];
  selectedGlobalBranch?: string;
}

const DEPARTMENTS = [
  'Phòng Tư Vấn & Thiết Kế 3D',
  'Showroom Kinh Doanh',
  'Phòng Kho Vận & Giao Lắp',
  'Phòng Kế Toán & Tài Chính',
  'Xưởng Sản Xuất Gỗ Mộc',
  'Ban Giám Đốc & Quản Trị',
];

const TITLES = [
  'Trưởng phòng Tư vấn & Thiết kế',
  'Quản lý Showroom / Sales Lead',
  'Trưởng bộ phận Kho Vận & Điều Phối',
  'Chuyên viên Tư vấn Bán hàng Cao cấp',
  'Kế toán Dự án & Chi phí',
  'Kiến trúc sư Nội thất 3D',
  'Chỉ huy trưởng Thi công Lắp đặt',
  'Thợ Mộc Chính & KCS',
  'Giám đốc Điều hành',
];

// Helper to generate username from name
const generateUsername = (name: string): string => {
  if (!name) return '';
  const parts = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/);
  if (parts.length === 1) return parts[0];
  const lastName = parts[parts.length - 1];
  const initials = parts.slice(0, parts.length - 1).map((p) => p[0]).join('');
  return `${lastName}.${initials}`;
};

export function EmployeesTab({
  employeesList: initialEmployees = INITIAL_EMPLOYEES,
  setEmployeesList: externalSetEmployeesList,
  branchesList = INITIAL_BRANCHES,
  rolesList = INITIAL_ROLES,
  selectedGlobalBranch = 'all',
}: EmployeesTabProps) {
  const { message } = App.useApp();

  const [internalEmployees, setInternalEmployees] = useState<AdminEmployee[]>(initialEmployees);
  const employeesList = externalSetEmployeesList ? initialEmployees : internalEmployees;
  const setEmployeesList = externalSetEmployeesList || setInternalEmployees;

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'working' | 'resigned'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');

  // Drawer Create / Edit States
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<AdminEmployee | null>(null);
  const [form] = Form.useForm();
  const [isUsernameCustom, setIsUsernameCustom] = useState(false);

  // Detail Drawer States
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<AdminEmployee | null>(null);
  const [detailTab, setDetailTab] = useState<'profile' | 'contract' | 'account'>('profile');

  // Reset Password Modal State
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordTargetEmployee, setPasswordTargetEmployee] = useState<AdminEmployee | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Import Excel Modal State
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Filtered employees list
  const filteredEmployees = useMemo(() => {
    return employeesList.filter((emp) => {
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        (emp.name || '').toLowerCase().includes(q) ||
        (emp.code || '').toLowerCase().includes(q) ||
        (emp.phone || '').includes(q) ||
        (emp.email || '').toLowerCase().includes(q) ||
        (emp.idNumber || '').includes(q) ||
        (emp.login || '').toLowerCase().includes(q) ||
        (emp.title || '').toLowerCase().includes(q) ||
        (emp.department || '').toLowerCase().includes(q) ||
        (emp.branch || '').toLowerCase().includes(q);

      const matchStatus = statusFilter === 'all' || emp.status === statusFilter;
      const matchDept = departmentFilter === 'all' || emp.department === departmentFilter;
      const matchBranch = branchFilter === 'all' || emp.branch === branchFilter;
      const matchGlobalBranch = isMatchBranch(emp.branch, selectedGlobalBranch);

      return matchSearch && matchStatus && matchDept && matchBranch && matchGlobalBranch;
    });
  }, [employeesList, searchQuery, statusFilter, departmentFilter, branchFilter, selectedGlobalBranch]);

  // Open Create Employee Drawer
  const handleOpenCreate = () => {
    setEditingEmployee(null);
    setIsUsernameCustom(false);
    form.resetFields();
    const nextNum = employeesList.length + 1;
    const nextCode = `NV${String(nextNum).padStart(3, '0')}`;

    form.setFieldsValue({
      code: nextCode,
      name: '',
      gender: 'Nam',
      birthday: null,
      idNumber: '',
      phone: '',
      email: '',
      address: '',
      department: DEPARTMENTS[0],
      title: TITLES[0],
      branch: branchesList[0]?.name || 'Showroom Flagship Thảo Điền',
      branchIds: [branchesList[0]?.id || 'br_1'],
      username: '',
      password: 'D2Luxury@2026',
      role: 'role_staff',
      status: true,
      workingDate: dayjs(),
      skills: [],
    });
    setDrawerOpen(true);
  };

  // Open Edit Employee Drawer
  const handleOpenEdit = (emp: AdminEmployee) => {
    setEditingEmployee(emp);
    setIsUsernameCustom(true);
    form.resetFields();
    form.setFieldsValue({
      code: emp.code,
      name: emp.name,
      gender: emp.gender || 'Nam',
      birthday: emp.birthday ? dayjs(emp.birthday, 'DD/MM/YYYY') : null,
      idNumber: emp.idNumber || '',
      phone: emp.phone || '',
      email: emp.email || '',
      address: emp.address || '',
      department: emp.department,
      title: emp.title,
      branch: emp.branch,
      branchIds: emp.branchIds || [],
      username: emp.username || emp.login,
      role: emp.role || 'role_staff',
      status: emp.status === 'working',
      workingDate: emp.workingDate ? dayjs(emp.workingDate) : dayjs(),
      skills: emp.skills || [],
      note: emp.note || '',
    });
    setDrawerOpen(true);
  };

  // Open Detail Drawer
  const handleOpenDetail = (emp: AdminEmployee) => {
    setSelectedEmployee(emp);
    setDetailTab('profile');
    setDetailDrawerOpen(true);
  };

  // Save Employee Form (Create / Edit)
  const handleSaveEmployee = async (values: any) => {
    const trimmedCode = (values.code || '').trim().toUpperCase();
    const trimmedName = (values.name || '').trim();
    const username = (values.username || generateUsername(trimmedName)).trim();

    if (editingEmployee) {
      const updatedList = employeesList.map((emp) =>
        emp.id === editingEmployee.id
          ? {
              ...emp,
              code: trimmedCode,
              name: trimmedName,
              gender: values.gender || 'Nam',
              birthday: values.birthday ? values.birthday.format('DD/MM/YYYY') : emp.birthday,
              idNumber: values.idNumber || '',
              phone: values.phone || '',
              email: values.email || '',
              address: values.address || '',
              department: values.department || '',
              title: values.title || '',
              branch: values.branch || '',
              branchIds: values.branchIds || [],
              login: username,
              username: username,
              role: values.role,
              status: values.status ? ('working' as const) : ('resigned' as const),
              workingDate: values.workingDate ? values.workingDate.format('YYYY-MM-DD') : emp.workingDate,
              skills: values.skills || [],
              note: values.note || '',
            }
          : emp
      );
      setEmployeesList(updatedList);
      if (selectedEmployee?.id === editingEmployee.id) {
        setSelectedEmployee({
          ...selectedEmployee,
          code: trimmedCode,
          name: trimmedName,
          gender: values.gender || 'Nam',
          birthday: values.birthday ? values.birthday.format('DD/MM/YYYY') : selectedEmployee.birthday,
          idNumber: values.idNumber || '',
          phone: values.phone || '',
          email: values.email || '',
          address: values.address || '',
          department: values.department || '',
          title: values.title || '',
          branch: values.branch || '',
          login: username,
          username: username,
          role: values.role,
          status: values.status ? 'working' : 'resigned',
          skills: values.skills || [],
          note: values.note || '',
        });
      }
      message.success(`Đã cập nhật hồ sơ nhân viên "${trimmedName}" thành công!`);
    } else {
      const newEmp: AdminEmployee = {
        id: `emp_${Date.now()}`,
        code: trimmedCode || `NV${String(employeesList.length + 1).padStart(3, '0')}`,
        name: trimmedName,
        gender: values.gender || 'Nam',
        birthday: values.birthday ? values.birthday.format('DD/MM/YYYY') : '01/01/1990',
        idNumber: values.idNumber || '',
        phone: values.phone || '',
        email: values.email || '',
        address: values.address || '',
        department: values.department || DEPARTMENTS[0],
        title: values.title || TITLES[0],
        branch: values.branch || branchesList[0]?.name || 'Showroom Thảo Điền',
        branchIds: values.branchIds || [],
        login: username,
        username: username,
        password: values.password || 'D2Luxury@2026',
        role: values.role || 'role_staff',
        status: values.status ? ('working' as const) : ('resigned' as const),
        workingDate: values.workingDate ? values.workingDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        skills: values.skills || ['Tư vấn nội thất'],
        note: values.note || '',
      };
      setEmployeesList([newEmp, ...employeesList]);
      message.success(`Đã thêm mới nhân viên "${newEmp.name}" vào hệ thống!`);
    }
    setDrawerOpen(false);
  };

  // Toggle Working Status
  const handleToggleStatus = (empId: string, currentStatus: 'working' | 'resigned') => {
    const newStatus = currentStatus === 'working' ? 'resigned' : 'working';
    const target = employeesList.find((e) => e.id === empId);
    setEmployeesList((prev) =>
      prev.map((e) => (e.id === empId ? { ...e, status: newStatus } : e))
    );
    if (selectedEmployee?.id === empId) {
      setSelectedEmployee((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
    message.success(
      `Đã chuyển trạng thái nhân viên "${target?.name || ''}" thành ${
        newStatus === 'working' ? 'Đang làm việc' : 'Đã nghỉ việc'
      }`
    );
  };

  // Delete Employee
  const handleDeleteEmployee = (empId: string, empName: string) => {
    setEmployeesList((prev) => prev.filter((e) => e.id !== empId));
    if (selectedEmployee?.id === empId) {
      setDetailDrawerOpen(false);
    }
    message.success(`Đã xóa nhân viên "${empName}" khỏi hệ thống!`);
  };

  // Open Reset Password Modal
  const handleOpenResetPassword = (emp: AdminEmployee) => {
    setPasswordTargetEmployee(emp);
    setNewPassword('D2Luxury@' + Math.floor(1000 + Math.random() * 9000));
    setPasswordModalOpen(true);
  };

  // Confirm Reset Password
  const handleConfirmResetPassword = () => {
    if (!passwordTargetEmployee) return;
    if (!newPassword.trim()) {
      message.error('Vui lòng nhập mật khẩu mới!');
      return;
    }
    message.success(
      `Đã đặt lại mật khẩu mới cho tài khoản "${passwordTargetEmployee.login}": ${newPassword}`
    );
    setPasswordModalOpen(false);
  };

  // Export Employees to Excel
  const handleExportExcel = () => {
    const data = filteredEmployees.map((e) => ({
      'Mã nhân viên': e.code,
      'Họ và tên': e.name,
      'Giới tính': e.gender,
      'Ngày sinh': e.birthday,
      'Số CMND/CCCD': e.idNumber,
      'Số điện thoại': e.phone,
      'Email': e.email,
      'Phòng ban': e.department,
      'Chức danh': e.title,
      'Chi nhánh': e.branch,
      'Tên đăng nhập': e.login || e.username,
      'Ngày vào làm': e.workingDate || '',
      'Trạng thái': e.status === 'working' ? 'Đang làm việc' : 'Đã nghỉ',
      'Địa chỉ': e.address,
    }));
    exportToExcel(data, `Danh_sach_nhan_vien_${dayjs().format('YYYYMMDD')}`);
    message.success('Đã xuất danh sách nhân viên ra file Excel thành công!');
  };

  return (
    <div className="space-y-4">
      {/* 1. TOP ACTION TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-none shadow-xs border border-slate-200/80">
        <div className="flex flex-1 items-center gap-2.5 min-w-[280px] max-w-xl">
          <AdminSearchInput
            placeholder="Tìm theo tên nhân viên, mã NV, SĐT, email, CCCD, chức vụ, phòng ban..."
            value={searchQuery}
            onChange={(val) => setSearchQuery(val)}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setDepartmentFilter('all');
              setBranchFilter('all');
              message.success('Đã làm mới danh sách nhân viên!');
            }}
            className="h-10 rounded-none text-sm font-normal text-slate-700 hover:text-[#784e34]"
          >
            Làm mới
          </Button>

          <Button
            icon={<DownloadOutlined />}
            onClick={handleExportExcel}
            className="h-10 rounded-none text-sm font-normal text-slate-700 hover:text-[#784e34]"
          >
            Xuất Excel
          </Button>

          <Button
            icon={<UploadOutlined />}
            onClick={() => setImportModalOpen(true)}
            className="h-10 rounded-none text-sm font-normal text-slate-700 hover:text-[#784e34]"
          >
            Nhập Excel
          </Button>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenCreate}
            className="h-10 rounded-none bg-[#784e34] hover:!bg-[#5d371f] px-4 text-sm font-medium text-white shadow-none border-none flex items-center"
          >
            Thêm nhân viên
          </Button>
        </div>
      </div>

      {/* 2. MAIN 2-COLUMN LAYOUT: FILTER SIDEBAR + EMPLOYEES TABLE */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* Left Filter Sidebar */}
        <AdminFilterSidebar
          title="Bộ lọc nhân sự"
          hasActiveFilters={Boolean(
            searchQuery ||
              statusFilter !== 'all' ||
              departmentFilter !== 'all' ||
              branchFilter !== 'all'
          )}
          onResetFilters={() => {
            setSearchQuery('');
            setStatusFilter('all');
            setDepartmentFilter('all');
            setBranchFilter('all');
          }}
        >
          {/* Lọc Trạng thái làm việc */}
          <div>
            <div className="mb-2 text-xs font-medium text-slate-700 uppercase tracking-wide">
              Trạng thái làm việc
            </div>
            <div className="space-y-1">
              {[
                { value: 'all', label: 'Tất cả nhân sự', count: employeesList.length },
                {
                  value: 'working',
                  label: '🟢 Đang làm việc',
                  count: employeesList.filter((e) => e.status === 'working').length,
                },
                {
                  value: 'resigned',
                  label: '⚪ Đã nghỉ việc',
                  count: employeesList.filter((e) => e.status === 'resigned').length,
                },
              ].map((opt) => {
                const isSelected = statusFilter === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatusFilter(opt.value as any)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors cursor-pointer border-none ${
                      isSelected
                        ? 'bg-amber-50/80 font-semibold text-[#784e34]'
                        : 'bg-transparent text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        isSelected ? 'bg-[#784e34] text-white' : 'text-slate-400 bg-slate-100'
                      }`}
                    >
                      {opt.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lọc theo Phòng ban */}
          <div className="pt-2 border-t border-slate-100">
            <div className="mb-2 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Phòng ban
            </div>
            <Select
              value={departmentFilter}
              onChange={setDepartmentFilter}
              className="w-full text-sm"
              options={[
                { value: 'all', label: 'Tất cả phòng ban' },
                ...DEPARTMENTS.map((d) => ({ value: d, label: d })),
              ]}
            />
          </div>

          {/* Lọc theo Chi nhánh */}
          <div className="pt-2 border-t border-slate-100">
            <div className="mb-2 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Cơ sở / Chi nhánh
            </div>
            <Select
              value={branchFilter}
              onChange={setBranchFilter}
              className="w-full text-sm"
              options={[
                { value: 'all', label: 'Tất cả chi nhánh' },
                ...branchesList.map((b) => ({ value: b.name, label: b.name })),
              ]}
            />
          </div>

          {/* Summary Card */}
          <AdminSidebarSummary
            title="Thống kê nhân sự POS"
            items={[
              { label: 'Tổng số nhân viên', value: `${employeesList.length} người` },
              {
                label: 'Đang làm việc',
                value: `${employeesList.filter((e) => e.status === 'working').length} người`,
                color: 'success',
              },
              {
                label: 'Đã nghỉ việc',
                value: `${employeesList.filter((e) => e.status === 'resigned').length} người`,
                color: 'default',
              },
              {
                label: 'Tài khoản đăng nhập',
                value: `${employeesList.filter((e) => Boolean(e.login || e.username)).length} TK`,
                color: 'primary',
              },
            ]}
          />
        </AdminFilterSidebar>

        {/* Right Employees Data Table */}
        <div className="flex-1 w-full min-w-0">
          <AdminDataTable
            titleText="Danh Sách Nhân Viên & Tài Khoản POS"
            titleIcon={<TeamOutlined className="text-[#784e34]" />}
            countTag={`${filteredEmployees.length} nhân sự`}
            dataSource={filteredEmployees}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            onRow={(record) => ({
              onClick: () => handleOpenDetail(record),
              className: 'cursor-pointer hover:bg-slate-50 transition-colors',
            })}
            columns={[
              {
                title: 'Mã NV',
                dataIndex: 'code',
                key: 'code',
                width: 95,
                render: (code) => (
                  <span className="font-mono text-xs text-[#784e34] bg-[#784e34]/10 px-2.5 py-1 rounded font-semibold whitespace-nowrap">
                    {code}
                  </span>
                ),
              },
              {
                title: 'Tên nhân viên',
                dataIndex: 'name',
                key: 'name',
                render: (name) => (
                  <span className="font-semibold text-sm text-slate-900 hover:text-[#784e34] transition-colors">
                    {name}
                  </span>
                ),
              },
              {
                title: 'Số điện thoại',
                dataIndex: 'phone',
                key: 'phone',
                width: 130,
                render: (phone) => (
                  <span className="font-mono text-sm text-slate-800 font-medium">
                    {phone}
                  </span>
                ),
              },
              {
                title: 'Phòng ban',
                dataIndex: 'department',
                key: 'department',
                render: (dept) => (
                  <span className="text-sm text-slate-800">
                    {dept}
                  </span>
                ),
              },
              {
                title: 'Chức danh',
                dataIndex: 'title',
                key: 'title',
                render: (title) => (
                  <span className="text-sm text-slate-700">
                    {title}
                  </span>
                ),
              },
              {
                title: 'Chi nhánh',
                dataIndex: 'branch',
                key: 'branch',
                width: 180,
                render: (branch) => (
                  <span className="text-sm text-slate-700 truncate block" title={branch}>
                    {branch}
                  </span>
                ),
              },
              {
                title: 'Tài khoản POS',
                key: 'login',
                width: 120,
                render: (_, emp) => (
                  <span className="font-mono text-xs font-semibold text-slate-800">
                    {emp.login || emp.username || '---'}
                  </span>
                ),
              },
              {
                title: 'Trạng thái',
                dataIndex: 'status',
                key: 'status',
                width: 125,
                align: 'center',
                render: (status: 'working' | 'resigned', emp) => (
                  <Tag
                    color={status === 'working' ? 'emerald' : 'default'}
                    className="cursor-pointer text-xs font-semibold px-2.5 py-0.5 rounded-full select-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStatus(emp.id, status);
                    }}
                    title="Bấm để đổi trạng thái làm việc"
                  >
                    {status === 'working' ? '● Đang làm việc' : '○ Đã nghỉ'}
                  </Tag>
                ),
              },
              {
                title: 'Thao tác',
                key: 'actions',
                width: 120,
                align: 'center',
                render: (_, emp) => (
                  <Space size={2} onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="Xem hồ sơ chi tiết">
                      <Button
                        size="small"
                        type="text"
                        icon={<EyeOutlined className="text-slate-600 hover:text-[#784e34]" />}
                        onClick={() => handleOpenDetail(emp)}
                        className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100"
                      />
                    </Tooltip>

                    <Tooltip title="Chỉnh sửa thông tin">
                      <Button
                        size="small"
                        type="text"
                        icon={<EditOutlined className="text-slate-600 hover:text-[#784e34]" />}
                        onClick={() => handleOpenEdit(emp)}
                        className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100"
                      />
                    </Tooltip>

                    <Tooltip title="Cấp lại mật khẩu">
                      <Button
                        size="small"
                        type="text"
                        icon={<LockOutlined className="text-amber-600 hover:text-amber-700" />}
                        onClick={() => handleOpenResetPassword(emp)}
                        className="w-8 h-8 flex items-center justify-center rounded hover:bg-amber-50"
                      />
                    </Tooltip>

                    <Popconfirm
                      title={`Xóa nhân viên "${emp.name}"?`}
                      description="Hành động này sẽ gỡ bỏ tài khoản và quyền truy cập của nhân sự."
                      onConfirm={() => handleDeleteEmployee(emp.id, emp.name)}
                      okText="Xóa"
                      cancelText="Hủy"
                      okButtonProps={{ danger: true }}
                    >
                      <Tooltip title="Xóa nhân viên">
                        <Button
                          size="small"
                          type="text"
                          danger
                          icon={<DeleteOutlined className="text-rose-500 hover:text-rose-700" />}
                          className="w-8 h-8 flex items-center justify-center rounded hover:bg-rose-50"
                        />
                      </Tooltip>
                    </Popconfirm>
                  </Space>
                ),
              },
            ]}
          />
        </div>
      </div>

      {/* 3. DRAWER CHI TIẾT NHÂN VIÊN (3 TABS CHUẨN DOMACO POS) */}
      <Drawer
        title={
          selectedEmployee ? (
            <div className="flex items-center justify-between w-full pr-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base text-slate-900">{selectedEmployee.name}</span>
                  <span className="font-mono text-xs font-bold text-[#784e34] bg-[#784e34]/10 px-2 py-0.5 rounded">
                    {selectedEmployee.code}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{selectedEmployee.title}</div>
              </div>
              <Button
                icon={<EditOutlined />}
                onClick={() => {
                  setDetailDrawerOpen(false);
                  handleOpenEdit(selectedEmployee);
                }}
                className="text-xs font-semibold rounded-lg"
              >
                Chỉnh sửa
              </Button>
            </div>
          ) : (
            'Hồ sơ nhân viên'
          )
        }
        open={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        styles={{ wrapper: { width: 840, maxWidth: '100vw' } }}
        destroyOnHidden
      >
        {selectedEmployee && (
          <div className="space-y-5">
            {/* Tabs Segmented Header */}
            <Segmented
              value={detailTab}
              onChange={(val: any) => setDetailTab(val)}
              options={[
                { value: 'profile', label: <span className="px-3 py-1 font-semibold text-xs sm:text-sm">👤 Thông tin cá nhân</span> },
                { value: 'contract', label: <span className="px-3 py-1 font-semibold text-xs sm:text-sm">🏢 Công việc &amp; Cơ sở</span> },
                { value: 'account', label: <span className="px-3 py-1 font-semibold text-xs sm:text-sm">🔐 Tài khoản &amp; Phân quyền</span> },
              ]}
              className="w-full bg-slate-100 p-1 rounded-lg"
              block
            />

            {/* TAB 1: THÔNG TIN CÁ NHÂN & LIÊN HỆ */}
            {detailTab === 'profile' && (
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2 m-0">
                    <IdcardOutlined className="text-[#784e34]" /> Lý lịch &amp; Pháp lý
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block">Mã nhân viên:</span>
                      <strong className="font-mono text-[#784e34] bg-[#784e34]/10 px-2 py-0.5 rounded text-sm inline-block">{selectedEmployee.code}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Họ và tên:</span>
                      <strong className="text-slate-900 text-sm">{selectedEmployee.name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Giới tính:</span>
                      <span className="font-medium text-slate-900">{selectedEmployee.gender || 'Nam'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Ngày sinh:</span>
                      <span className="font-mono text-slate-900">{selectedEmployee.birthday || '15/08/1988'}</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-500 block">Số CMND / CCCD:</span>
                      <span className="font-mono font-bold text-slate-900">{selectedEmployee.idNumber || '---'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2 m-0">
                    <PhoneOutlined className="text-emerald-600" /> Thông tin liên hệ
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block">Số điện thoại di động:</span>
                      <strong className="font-mono text-slate-900 text-sm">{selectedEmployee.phone}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Email nội bộ:</span>
                      <strong className="text-slate-900">{selectedEmployee.email}</strong>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-500 block">Địa chỉ thường trú:</span>
                      <span className="text-slate-900">{selectedEmployee.address || 'Chưa cập nhật'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CÔNG VIỆC & CƠ SỞ CHI NHÁNH */}
            {detailTab === 'contract' && (
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2 m-0">
                    <ApartmentOutlined className="text-[#784e34]" /> Vị trí công tác &amp; Phòng ban
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block">Phòng ban:</span>
                      <strong className="text-slate-900">{selectedEmployee.department}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Chức danh / Vị trí:</span>
                      <strong className="text-slate-900">{selectedEmployee.title}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Chi nhánh làm việc chính:</span>
                      <strong className="text-[#784e34]">{selectedEmployee.branch}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Ngày bắt đầu vào làm:</span>
                      <span className="font-mono text-slate-800">{selectedEmployee.workingDate || '01/01/2026'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Tình trạng hợp đồng:</span>
                      <Tag color={selectedEmployee.status === 'working' ? 'green' : 'default'} className="font-semibold text-xs mt-1">
                        {selectedEmployee.status === 'working' ? 'Hợp đồng chính thức (Đang làm việc)' : 'Đã thôi việc'}
                      </Tag>
                    </div>
                  </div>
                </div>

                {/* Kỹ năng & Chuyên môn */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider m-0">
                    Kỹ năng &amp; Phạm vi phụ trách
                  </h4>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(selectedEmployee.skills || ['Tư vấn không gian nội thất', 'Thiết kế 3D 3dsMax']).map((skill, idx) => (
                      <Tag key={idx} color="orange" className="text-xs px-2.5 py-1 rounded">
                        ✓ {skill}
                      </Tag>
                    ))}
                  </div>
                </div>

                {/* Ghi chú */}
                {selectedEmployee.note && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-1 text-xs">
                    <span className="text-slate-500 font-semibold block">Ghi chú diễn giải:</span>
                    <p className="text-slate-800 italic m-0">{selectedEmployee.note}</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: TÀI KHOẢN & PHÂN QUYỀN */}
            {detailTab === 'account' && (
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2 m-0">
                    <SafetyCertificateOutlined className="text-amber-600" /> Tài khoản đăng nhập hệ thống
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block">Tên đăng nhập (Username):</span>
                      <strong className="font-mono text-slate-900 text-sm">{selectedEmployee.login || selectedEmployee.username}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Nhóm quyền hạn (RBAC Role):</span>
                      <Tag color="gold" className="font-semibold text-xs mt-0.5">
                        {rolesList.find((r) => r.id === selectedEmployee.role)?.name || 'Nhân viên nghiệp vụ POS'}
                      </Tag>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Trạng thái tài khoản:</span>
                      <Tag color="success" className="font-semibold text-xs mt-0.5">
                        ✓ Đang hoạt động
                      </Tag>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Mật khẩu:</span>
                      <Button
                        size="small"
                        icon={<LockOutlined />}
                        onClick={() => handleOpenResetPassword(selectedEmployee)}
                        className="text-xs font-semibold text-amber-700 bg-amber-50 border-amber-200 hover:!bg-amber-100 mt-1"
                      >
                        Đặt lại mật khẩu
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200/80 text-xs text-amber-900">
                  <p className="m-0 font-medium leading-relaxed">
                    💡 <strong>Ghi chú phân quyền:</strong> Nhân sự này có quyền truy cập vào các chức năng dựa trên nhóm vai trò được gán. Để thay đổi chi tiết quyền từng module (Đơn hàng, Kho, Khách hàng, Báo cáo), vui lòng truy cập tab <strong>&quot;Vai trò &amp; Phân quyền&quot;</strong>.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* 4. DRAWER TẠO MỚI / CHỈNH SỬA NHÂN VIÊN (FORM DRAWER DOMACO POS) */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-slate-900">
              {editingEmployee ? 'Chỉnh sửa hồ sơ nhân viên' : 'Thêm mới nhân viên'}
            </span>
          </div>
        }
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        styles={{ wrapper: { width: 720, maxWidth: '100vw' } }}
        destroyOnHidden
        footer={
          <div className="flex items-center justify-between">
            <Button onClick={() => setDrawerOpen(false)} className="h-10 px-5 text-sm font-semibold rounded-lg">
              Hủy bỏ
            </Button>
            <Button
              type="primary"
              onClick={() => form.submit()}
              className="h-10 px-6 bg-[#784e34] hover:!bg-[#5d371f] text-sm font-bold text-white rounded-lg border-none shadow-none"
            >
              {editingEmployee ? 'Lưu hồ sơ' : 'Tạo nhân viên'}
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleSaveEmployee} className="space-y-4">
          {/* SECTION 1: THÔNG TIN CƠ BẢN */}
          <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2 m-0">
              <UserOutlined className="text-[#784e34]" /> Thông tin cơ bản
            </h4>

            <Row gutter={12}>
              <Col span={14}>
                <Form.Item
                  label={<span className="text-xs font-semibold text-slate-800">Mã nhân viên</span>}
                  name="code"
                  rules={[{ required: true, message: 'Nhập mã NV' }]}
                >
                  <Input placeholder="NV001" className="h-10 rounded-lg font-mono text-sm uppercase" />
                </Form.Item>
              </Col>
              <Col span={10}>
                <Form.Item
                  label={<span className="text-xs font-semibold text-slate-800">Trạng thái</span>}
                  name="status"
                  valuePropName="checked"
                >
                  <Switch
                    checkedChildren="Đang làm"
                    unCheckedChildren="Đã nghỉ"
                    className="mt-1.5 bg-slate-300"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label={<span className="text-xs font-semibold text-slate-800">Họ và tên nhân viên</span>}
              name="name"
              rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
            >
              <Input
                placeholder="VD: KTS. Trần Minh Quân"
                className="h-10 rounded-lg text-sm font-semibold"
                onChange={(e) => {
                  const val = e.target.value;
                  if (!editingEmployee && !isUsernameCustom) {
                    form.setFieldsValue({ username: generateUsername(val) });
                  }
                }}
              />
            </Form.Item>

            <Row gutter={12}>
              <Col span={8}>
                <Form.Item label={<span className="text-xs font-semibold text-slate-800">Giới tính</span>} name="gender">
                  <Radio.Group className="mt-1">
                    <Radio value="Nam">Nam</Radio>
                    <Radio value="Nữ">Nữ</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label={<span className="text-xs font-semibold text-slate-800">Ngày sinh</span>} name="birthday">
                  <DatePicker format="DD/MM/YYYY" placeholder="DD/MM/YYYY" className="w-full h-10 text-sm rounded-lg" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label={<span className="text-xs font-semibold text-slate-800">Số CMND/CCCD</span>} name="idNumber">
                  <Input placeholder="079090012345" className="h-10 rounded-lg font-mono text-sm" />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* SECTION 2: TÀI KHOẢN ĐĂNG NHẬP & BẢO MẬT */}
          <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2 m-0">
              <KeyOutlined className="text-amber-600" /> Tài khoản đăng nhập &amp; Vai trò
            </h4>

            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  label={<span className="text-xs font-semibold text-slate-800">Tên đăng nhập (Username)</span>}
                  name="username"
                  rules={[{ required: true, message: 'Nhập tên đăng nhập' }]}
                >
                  <Input
                    placeholder="quan.tm"
                    className="h-10 rounded-lg font-mono text-sm"
                    onChange={() => setIsUsernameCustom(true)}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={<span className="text-xs font-semibold text-slate-800">Nhóm quyền hạn (Role)</span>}
                  name="role"
                  rules={[{ required: true, message: 'Chọn nhóm quyền' }]}
                >
                  <Select className="h-10 text-sm">
                    {rolesList.map((r) => (
                      <Select.Option key={r.id} value={r.id}>
                        {r.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            {!editingEmployee && (
              <Form.Item
                label={<span className="text-xs font-semibold text-slate-800">Mật khẩu khởi tạo</span>}
                name="password"
                rules={[{ required: true, message: 'Nhập mật khẩu ban đầu' }]}
              >
                <Input.Password placeholder="Nhập mật khẩu..." className="h-10 rounded-lg text-sm" />
              </Form.Item>
            )}
          </div>

          {/* SECTION 3: TỔ CHỨC & VỊ TRÍ CÔNG TÁC */}
          <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2 m-0">
              <ApartmentOutlined className="text-[#784e34]" /> Phòng ban &amp; Chi nhánh
            </h4>

            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  label={<span className="text-xs font-semibold text-slate-800">Phòng ban</span>}
                  name="department"
                  rules={[{ required: true, message: 'Chọn phòng ban' }]}
                >
                  <Select className="h-10 text-sm">
                    {DEPARTMENTS.map((d) => (
                      <Select.Option key={d} value={d}>
                        {d}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={<span className="text-xs font-semibold text-slate-800">Chức danh / Chức vụ</span>}
                  name="title"
                  rules={[{ required: true, message: 'Nhập chức danh' }]}
                >
                  <Input placeholder="VD: Trưởng phòng Tư vấn & Thiết kế" className="h-10 rounded-lg text-sm" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  label={<span className="text-xs font-semibold text-slate-800">Chi nhánh làm việc chính</span>}
                  name="branch"
                  rules={[{ required: true, message: 'Chọn chi nhánh chính' }]}
                >
                  <Select className="h-10 text-sm">
                    {branchesList.map((b) => (
                      <Select.Option key={b.id} value={b.name}>
                        {b.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label={<span className="text-xs font-semibold text-slate-800">Ngày vào làm</span>} name="workingDate">
                  <DatePicker format="DD/MM/YYYY" placeholder="DD/MM/YYYY" className="w-full h-10 text-sm rounded-lg" />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* SECTION 4: LIÊN HỆ & ĐỊA CHỈ */}
          <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2 m-0">
              <PhoneOutlined className="text-emerald-600" /> Thông tin liên hệ
            </h4>

            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  label={<span className="text-xs font-semibold text-slate-800">Số điện thoại di động</span>}
                  name="phone"
                  rules={[{ required: true, message: 'Nhập số điện thoại' }]}
                >
                  <Input placeholder="0918.234.567" className="h-10 rounded-lg font-mono text-sm" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label={<span className="text-xs font-semibold text-slate-800">Email nội bộ</span>} name="email">
                  <Input placeholder="quan.tm@d2luxury.vn" className="h-10 rounded-lg text-sm" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label={<span className="text-xs font-semibold text-slate-800">Địa chỉ thường trú / Tạm trú</span>} name="address">
              <Input placeholder="Số nhà, đường phố, phường/xã, quận/huyện..." className="h-10 rounded-lg text-sm" />
            </Form.Item>
          </div>

          {/* GHI CHÚ */}
          <Form.Item label={<span className="text-xs font-semibold text-slate-800">Ghi chú &amp; Diễn giải</span>} name="note">
            <Input.TextArea rows={2} placeholder="Nhập ghi chú khác..." className="rounded-lg text-sm" />
          </Form.Item>
        </Form>
      </Drawer>

      {/* 5. MODAL ĐẶT LẠI MẬT KHẨU TÀI KHOẢN */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <LockOutlined className="text-amber-600" />
            <span className="font-bold text-slate-900">Đặt lại mật khẩu nhân viên</span>
          </div>
        }
        open={passwordModalOpen}
        onCancel={() => setPasswordModalOpen(false)}
        onOk={handleConfirmResetPassword}
        okText="Xác nhận đổi mật khẩu"
        cancelText="Hủy"
        okButtonProps={{ className: 'bg-[#784e34] hover:!bg-[#5d371f]' }}
      >
        {passwordTargetEmployee && (
          <div className="py-2 space-y-3">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
              <div className="flex justify-between mb-1">
                <span className="text-slate-500">Nhân viên:</span>
                <strong className="text-slate-900">{passwordTargetEmployee.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tên đăng nhập:</span>
                <strong className="font-mono text-slate-900">{passwordTargetEmployee.login}</strong>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-800 block mb-1">Mật khẩu mới:</label>
              <Input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-10 text-sm font-mono rounded-lg"
                placeholder="Nhập mật khẩu mới..."
              />
            </div>
          </div>
        )}
      </Modal>

      {/* 6. MODAL NHẬP EXCEL NHÂN VIÊN */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <UploadOutlined className="text-[#784e34]" />
            <span className="font-bold text-slate-900">Nhập danh sách nhân viên từ Excel</span>
          </div>
        }
        open={importModalOpen}
        onCancel={() => setImportModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setImportModalOpen(false)}>
            Đóng
          </Button>,
          <Button
            key="download"
            icon={<DownloadOutlined />}
            onClick={() => {
              const template = [
                {
                  'Mã NV': 'NV099',
                  'Họ và tên': 'Nguyễn Văn Mẫu',
                  'Giới tính': 'Nam',
                  'Ngày sinh': '01/01/1995',
                  'Số CMND/CCCD': '079095001234',
                  'Số điện thoại': '0909123456',
                  'Email': 'mau.nv@d2luxury.vn',
                  'Phòng ban': 'Showroom Kinh Doanh',
                  'Chức danh': 'Chuyên viên Bán hàng',
                  'Chi nhánh': 'Showroom Thảo Điền',
                  'Địa chỉ': 'TP.HCM',
                },
              ];
              exportToExcel(template, 'Mau_nhap_nhan_vien');
              message.success('Đã tải file mẫu nhập nhân viên!');
            }}
          >
            Tải file mẫu
          </Button>,
        ]}
      >
        <div className="py-4 text-center space-y-3">
          <p className="text-xs text-slate-600">
            Kéo thả hoặc tải lên file Excel (.xlsx) chứa thông tin nhân sự theo chuẩn biểu mẫu Domaco POS.
          </p>
          <Upload.Dragger
            maxCount={1}
            beforeUpload={(file) => {
              message.success(`Đã nhận file ${file.name}, đang xử lý nhập hồ sơ nhân sự...`);
              setImportModalOpen(false);
              return false;
            }}
          >
            <p className="ant-upload-drag-icon text-3xl text-[#784e34]">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text text-sm font-semibold text-slate-800">
              Nhấp hoặc kéo thả file Excel vào đây
            </p>
            <p className="ant-upload-hint text-xs text-slate-500">
              Hỗ trợ định dạng .xlsx, .xls. Tối đa 10MB.
            </p>
          </Upload.Dragger>
        </div>
      </Modal>
    </div>
  );
}

export default EmployeesTab;
