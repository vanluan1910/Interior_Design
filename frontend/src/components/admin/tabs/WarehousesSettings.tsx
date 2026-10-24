'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  App,
  Button,
  Input,
  Select,
  Tag,
  Space,
  Popconfirm,
  Dropdown,
  Form,
  Row,
  Col,
  Switch,
  AutoComplete,
  Typography,
  Tooltip,
} from 'antd';
import {
  DownloadOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  EnvironmentOutlined,
  ReloadOutlined,
  ShopOutlined,
  CrownOutlined,
  CheckCircleOutlined,
  StarFilled,
} from '@ant-design/icons';
import {
  AdminDataTable,
  AdminFilterSidebar,
  AdminSidebarSummary,
  AdminFormDrawer,
  AutoCodeButton,
  getNextCode,
} from '@/components/admin';
import type { AdminWarehouse, AdminBranch } from '@/types/admin';
import { warehouseApi } from '@/api/warehouseApi';
import { locationApi, LocationItem, ProvinceItem } from '@/api/locationApi';
import { exportToExcel } from '@/utils/exportExcel';
import {
  ADMIN_STORAGE_KEYS,
  getStoredAdminData,
  setStoredAdminData,
} from '@/utils/adminStorage';

export interface WarehousesSettingsProps {
  branchesList?: AdminBranch[];
  selectedGlobalBranch?: string;
  onWarehousesUpdated?: (warehouses: AdminWarehouse[]) => void;
}

export function WarehousesSettings({
  branchesList = [],
  selectedGlobalBranch = 'all',
  onWarehousesUpdated,
}: WarehousesSettingsProps) {
  const { message } = App.useApp();

  // Warehouses State
  const [warehousesList, setWarehousesList] = useState<AdminWarehouse[]>(() => {
    return getStoredAdminData<AdminWarehouse[]>(ADMIN_STORAGE_KEYS.WAREHOUSES, []);
  });
  const [loading, setLoading] = useState(false);
  const [selectedWarehouseKeys, setSelectedWarehouseKeys] = useState<React.Key[]>([]);
  const [warehouseSearchQuery, setWarehouseSearchQuery] = useState('');
  
  // NOTE: User requested all warehouses across all branches displayed by default
  const [warehouseBranchFilter, setWarehouseBranchFilter] = useState<string>('all');
  const [warehouseStatusFilter, setWarehouseStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Drawer Form State
  const [showWarehouseDrawer, setShowWarehouseDrawer] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<AdminWarehouse | null>(null);
  const [warehouseForm] = Form.useForm();
  const selectedWarehouseProvince = Form.useWatch('province', warehouseForm);
  const selectedWarehouseDistrict = Form.useWatch('district', warehouseForm);
  const selectedWarehouseIsDefault = Form.useWatch('isDefault', warehouseForm);

  // Address Cascading Options
  const [provincesList, setProvincesList] = useState<ProvinceItem[]>([]);
  const [districtOptions, setDistrictOptions] = useState<LocationItem[]>([]);
  const [wardOptions, setWardOptions] = useState<LocationItem[]>([]);

  // Load provinces on mount
  useEffect(() => {
    locationApi.getProvinces().then((data) => {
      setProvincesList(data || []);
    }).catch(() => {});
  }, []);

  // Cascading districts
  useEffect(() => {
    if (!selectedWarehouseProvince) {
      setDistrictOptions([]);
      setWardOptions([]);
      return;
    }
    locationApi.getDistrictsByProvince(selectedWarehouseProvince)
      .then((districts) => {
        setDistrictOptions(districts || []);
      })
      .catch(() => setDistrictOptions([]));
  }, [selectedWarehouseProvince]);

  // Cascading wards
  useEffect(() => {
    if (!selectedWarehouseDistrict || !selectedWarehouseProvince) {
      setWardOptions([]);
      return;
    }
    locationApi.getWardsByDistrict(selectedWarehouseDistrict, selectedWarehouseProvince)
      .then((wards) => {
        setWardOptions(wards || []);
      })
      .catch(() => setWardOptions([]));
  }, [selectedWarehouseDistrict, selectedWarehouseProvince]);

  // Fetch warehouses from API
  const loadWarehousesFromApi = useCallback(async () => {
    setLoading(true);
    try {
      // NOTE: getWarehouses without branch param fetches all warehouses across all branches
      const data = await warehouseApi.getWarehouses();
      const list = data || [];
      setWarehousesList(list);
      setStoredAdminData(ADMIN_STORAGE_KEYS.WAREHOUSES, list);
      if (onWarehousesUpdated) {
        onWarehousesUpdated(list);
      }
    } catch (err: any) {
      console.warn('Could not load warehouses from API:', err);
    } finally {
      setLoading(false);
    }
  }, [onWarehousesUpdated]);

  useEffect(() => {
    loadWarehousesFromApi();
  }, [loadWarehousesFromApi]);

  // Filter warehouses: Displays ALL warehouses across ALL branches by default
  const filteredWarehouses = useMemo(() => {
    return warehousesList.filter((w) => {
      const q = warehouseSearchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        (w.name || '').toLowerCase().includes(q) ||
        (w.code || '').toLowerCase().includes(q) ||
        (w.branch || '').toLowerCase().includes(q) ||
        (w.streetAddress || '').toLowerCase().includes(q) ||
        (w.address || '').toLowerCase().includes(q) ||
        (w.description || '').toLowerCase().includes(q);

      const matchBranch = warehouseBranchFilter === 'all' || (w.branch || '').trim() === warehouseBranchFilter.trim();
      const matchStatus = warehouseStatusFilter === 'all' || w.status === warehouseStatusFilter;

      return matchSearch && matchBranch && matchStatus;
    });
  }, [warehousesList, warehouseSearchQuery, warehouseBranchFilter, warehouseStatusFilter]);

  const selectedWarehouseRecord = useMemo(() => {
    return warehousesList.find((w) => selectedWarehouseKeys.includes(w.id));
  }, [warehousesList, selectedWarehouseKeys]);

  // Unique branches from warehouse list for filter counts
  const branchCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    warehousesList.forEach((w) => {
      const b = w.branch || 'Khác';
      counts[b] = (counts[b] || 0) + 1;
    });
    return counts;
  }, [warehousesList]);

  // Warehouse CRUD Actions
  const handleOpenCreateWarehouse = () => {
    setEditingWarehouse(null);
    const existingCodes = new Set(warehousesList.map((w) => (w.code || '').toUpperCase()));
    let nextNum = 1;
    let autoCode = `KHO${nextNum.toString().padStart(4, '0')}`;
    while (existingCodes.has(autoCode)) {
      nextNum++;
      autoCode = `KHO${nextNum.toString().padStart(4, '0')}`;
    }
    const defaultBranch =
      (selectedGlobalBranch !== 'all' && selectedGlobalBranch) ||
      (branchesList[0]?.name || '');

    setShowWarehouseDrawer(true);
    setTimeout(() => {
      warehouseForm.resetFields();
      warehouseForm.setFieldsValue({
        code: autoCode,
        name: '',
        branch: defaultBranch,
        description: '',
        streetAddress: '',
        ward: undefined,
        district: undefined,
        province: undefined,
        isDefault: warehousesList.length === 0,
        status: true,
      });
    }, 0);
  };

  const handleOpenEditWarehouse = (wh: AdminWarehouse) => {
    setEditingWarehouse(wh);
    setShowWarehouseDrawer(true);
    setTimeout(() => {
      warehouseForm.resetFields();
      warehouseForm.setFieldsValue({
        code: wh.code,
        name: wh.name,
        branch: wh.branch || branchesList[0]?.name || '',
        description: wh.description || '',
        streetAddress: wh.streetAddress || wh.address || '',
        ward: wh.ward || undefined,
        district: wh.district || undefined,
        province: wh.province || undefined,
        isDefault: Boolean(wh.isDefault),
        status: wh.status !== 'inactive',
      });
    }, 0);
  };

  const handleCopyWarehouse = async (wh: AdminWarehouse) => {
    const existingCodes = new Set(warehousesList.map((w) => (w.code || '').toUpperCase()));
    let nextNum = 1;
    let autoCode = `KHO${nextNum.toString().padStart(4, '0')}`;
    while (existingCodes.has(autoCode)) {
      nextNum++;
      autoCode = `KHO${nextNum.toString().padStart(4, '0')}`;
    }
    const clonedWhPayload: Partial<AdminWarehouse> = {
      ...wh,
      code: autoCode,
      name: `${wh.name} (Bản sao)`,
      isDefault: false,
    };
    try {
      const created = await warehouseApi.createWarehouse(clonedWhPayload);
      const updated = [created, ...warehousesList];
      setWarehousesList(updated);
      setStoredAdminData(ADMIN_STORAGE_KEYS.WAREHOUSES, updated);
      if (onWarehousesUpdated) onWarehousesUpdated(updated);
      message.success(`Đã nhân bản kho "${wh.name}" thành ${created.code}!`);
    } catch (err: any) {
      message.error(err?.message || 'Nhân bản kho thất bại.');
    }
  };

  const handleSetDefaultWarehouse = async (wh: AdminWarehouse) => {
    try {
      const payload: Partial<AdminWarehouse> = {
        ...wh,
        isDefault: true,
      };
      await warehouseApi.updateWarehouse(wh.id, payload);
      const updated = warehousesList.map((w) => ({
        ...w,
        isDefault: w.id === wh.id,
      }));
      setWarehousesList(updated);
      setStoredAdminData(ADMIN_STORAGE_KEYS.WAREHOUSES, updated);
      if (onWarehousesUpdated) onWarehousesUpdated(updated);
      message.success(`Đã chọn kho "${wh.name}" làm kho mặc định (Hệ thống sẽ ưu tiên trừ tồn kho này khi khách mua hàng)!`);
    } catch (err: any) {
      message.error(err?.message || 'Không thể thiết lập kho mặc định.');
    }
  };

  const handleWarehouseFormSubmit = async (values: any) => {
    const trimmedCode = (values.code || '').trim().toUpperCase();
    const trimmedName = (values.name || '').trim();
    const defaultBranch =
      (selectedGlobalBranch !== 'all' && selectedGlobalBranch) ||
      (branchesList[0]?.name || '');
    const isDef = Boolean(values.isDefault);
    const itemStatus: 'active' | 'inactive' =
      typeof values.status === 'boolean'
        ? values.status
          ? 'active'
          : 'inactive'
        : values.status === 'inactive'
        ? 'inactive'
        : 'active';

    const parts = [values.streetAddress, values.ward, values.district, values.province].filter(Boolean);
    const fullAddress = parts.length > 0 ? parts.join(', ') : values.streetAddress || '';

    if (editingWarehouse) {
      const payload: Partial<AdminWarehouse> = {
        ...editingWarehouse,
        code: trimmedCode,
        name: trimmedName,
        branch: values.branch || defaultBranch,
        province: values.province || '',
        district: values.district || '',
        ward: values.ward || '',
        streetAddress: values.streetAddress || '',
        address: fullAddress,
        isDefault: isDef,
        status: itemStatus,
        description: values.description || '',
      };
      try {
        const updatedWh = await warehouseApi.updateWarehouse(editingWarehouse.id, payload);
        const updated = warehousesList.map((w) => {
          if (w.id === editingWarehouse.id) return updatedWh;
          if (isDef) return { ...w, isDefault: false };
          return w;
        });
        setWarehousesList(updated);
        setStoredAdminData(ADMIN_STORAGE_KEYS.WAREHOUSES, updated);
        if (onWarehousesUpdated) onWarehousesUpdated(updated);
        message.success(`Đã cập nhật kho "${trimmedName}" thành công!`);
        setShowWarehouseDrawer(false);
        warehouseForm.resetFields();
      } catch (err: any) {
        message.error(err?.message || 'Cập nhật kho hàng thất bại.');
      }
    } else {
      const newWhPayload: Partial<AdminWarehouse> = {
        code: trimmedCode,
        name: trimmedName,
        type: 'main',
        typeLabel: 'Tổng kho hàng nội thất',
        branch: values.branch || defaultBranch,
        province: values.province || '',
        district: values.district || '',
        ward: values.ward || '',
        streetAddress: values.streetAddress || '',
        address: fullAddress,
        managerName: 'Chưa phân công',
        managerPhone: '',
        capacityMax: 500,
        capacityCurrent: 0,
        capacityUnit: 'sản phẩm',
        occupancyPercent: 0,
        humidityControl: 'Kho tiêu chuẩn',
        isDefault: isDef,
        status: itemStatus,
        description: values.description || '',
        totalValue: 0,
      };
      try {
        const createdWh = await warehouseApi.createWarehouse(newWhPayload);
        let updated: AdminWarehouse[];
        if (isDef) {
          updated = [createdWh, ...warehousesList.map((w) => ({ ...w, isDefault: false }))];
        } else {
          updated = [createdWh, ...warehousesList];
        }
        setWarehousesList(updated);
        setStoredAdminData(ADMIN_STORAGE_KEYS.WAREHOUSES, updated);
        if (onWarehousesUpdated) onWarehousesUpdated(updated);
        message.success(`Đã thêm kho "${trimmedName}" (${createdWh.code}) thành công!`);
        setShowWarehouseDrawer(false);
        warehouseForm.resetFields();
      } catch (err: any) {
        message.error(err?.message || 'Thêm kho hàng thất bại.');
      }
    }
  };

  const handleChangeWarehouseStatus = async (id: string, newStatus: 'active' | 'inactive') => {
    try {
      await warehouseApi.updateStatus(id, newStatus);
      const updated = warehousesList.map((w) => (w.id === id ? { ...w, status: newStatus } : w));
      setWarehousesList(updated);
      setStoredAdminData(ADMIN_STORAGE_KEYS.WAREHOUSES, updated);
      if (onWarehousesUpdated) onWarehousesUpdated(updated);
      message.success(`Đã đổi trạng thái kho sang ${newStatus === 'active' ? 'Đang hoạt động' : 'Tạm dừng'}`);
    } catch (err: any) {
      message.error(err?.message || 'Đổi trạng thái kho thất bại.');
    }
  };

  const handleDeleteWarehouse = async (id: string, name: string) => {
    try {
      await warehouseApi.deleteWarehouse(id);
      const updated = warehousesList.filter((w) => w.id !== id);
      setWarehousesList(updated);
      setStoredAdminData(ADMIN_STORAGE_KEYS.WAREHOUSES, updated);
      if (onWarehousesUpdated) onWarehousesUpdated(updated);
      message.success(`Đã xóa kho "${name}" thành công!`);
    } catch (err: any) {
      message.error(err?.message || 'Xóa kho hàng thất bại.');
    }
  };

  const handleDeleteSelectedWarehouses = async () => {
    if (!selectedWarehouseKeys.length) return;
    try {
      await Promise.all(selectedWarehouseKeys.map((k) => warehouseApi.deleteWarehouse(String(k))));
      const updated = warehousesList.filter((w) => !selectedWarehouseKeys.includes(w.id));
      setWarehousesList(updated);
      setStoredAdminData(ADMIN_STORAGE_KEYS.WAREHOUSES, updated);
      if (onWarehousesUpdated) onWarehousesUpdated(updated);
      message.success(`Đã xóa ${selectedWarehouseKeys.length} kho đã chọn!`);
      setSelectedWarehouseKeys([]);
    } catch (e: any) {
      message.error(e?.message || 'Xóa kho hàng thất bại.');
    }
  };

  const handleCopySelectedWarehouse = () => {
    if (selectedWarehouseRecord) {
      handleCopyWarehouse(selectedWarehouseRecord);
    }
  };

  const handleEditSelectedWarehouse = () => {
    if (selectedWarehouseRecord) {
      handleOpenEditWarehouse(selectedWarehouseRecord);
    }
  };

  const handleGenerateWarehouseCode = () => {
    const currentCode = warehouseForm.getFieldValue('code');
    const genCode = getNextCode(currentCode, warehousesList, 'KHO', 4);
    warehouseForm.setFieldsValue({ code: genCode });
    message.success(`Đã tự động tạo mã kho mới: ${genCode}`);
  };

  const handleExportWarehousesExcel = () => {
    const exportData = filteredWarehouses.map((w) => ({
      'Mã kho': w.code,
      'Tên kho': w.name,
      'Chi nhánh trực thuộc': w.branch,
      'Địa chỉ': w.address || w.streetAddress || '',
      'Tỉnh/Thành': w.province || '',
      'Quận/Huyện': w.district || '',
      'Kho mặc định': w.isDefault ? 'Có' : 'Không',
      'Trạng thái': w.status === 'active' ? 'Đang sử dụng' : 'Ngừng sử dụng',
      'Diễn giải': w.description || '',
    }));
    exportToExcel(exportData, `Danh_Sach_Kho_Toan_He_Thong_${new Date().toISOString().slice(0, 10)}`);
    message.success(`Đã xuất Excel ${exportData.length} kho lưu trữ.`);
  };

  const activeCount = useMemo(() => warehousesList.filter((w) => w.status === 'active').length, [warehousesList]);
  const inactiveCount = useMemo(() => warehousesList.filter((w) => w.status === 'inactive').length, [warehousesList]);
  const branchesWithWarehousesCount = useMemo(() => Object.keys(branchCounts).length, [branchCounts]);
  const defaultWarehouse = useMemo(() => warehousesList.find((w) => w.isDefault), [warehousesList]);

  return (
    <div className="space-y-4">
      {/* 2-Column Layout: Filter Sidebar + Warehouses Table */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* Filter Sidebar */}
        <AdminFilterSidebar
          title="Bộ lọc kho hàng"
          hasActiveFilters={Boolean(
            warehouseBranchFilter !== 'all' ||
            warehouseStatusFilter !== 'all' ||
            warehouseSearchQuery
          )}
          onResetFilters={() => {
            setWarehouseSearchQuery('');
            setWarehouseBranchFilter('all');
            setWarehouseStatusFilter('all');
            setSelectedWarehouseKeys([]);
          }}
        >
          {/* Lọc theo Chi nhánh (Mặc định hiển thị tất cả các chi nhánh) */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-800 text-xs block">Chi nhánh trực thuộc</label>
            <Select
              value={warehouseBranchFilter}
              onChange={(v) => setWarehouseBranchFilter(v)}
              className="w-full text-xs"
              size="small"
              options={[
                { value: 'all', label: `Tất cả chi nhánh (${warehousesList.length})` },
                ...branchesList.map((b) => ({
                  value: b.name,
                  label: `${b.name} (${branchCounts[b.name] || 0})`,
                })),
              ]}
            />
          </div>

          {/* Trạng thái hoạt động */}
          <div className="space-y-1.5 mt-3">
            <label className="font-semibold text-slate-800 text-xs block">Trạng thái hoạt động</label>
            <Select
              value={warehouseStatusFilter}
              onChange={(v) => setWarehouseStatusFilter(v)}
              className="w-full text-xs"
              size="small"
              options={[
                { value: 'all', label: `Tất cả trạng thái (${warehousesList.length})` },
                { value: 'active', label: `Đang sử dụng (${activeCount})` },
                { value: 'inactive', label: `Tạm dừng (${inactiveCount})` },
              ]}
            />
          </div>

          {/* Summary Card */}
          <AdminSidebarSummary
            title="Thống kê kho bãi"
            className="mt-4"
            items={[
              { label: 'Tổng số kho (toàn hệ thống)', value: `${warehousesList.length} kho` },
              { label: 'Đang hoạt động', value: `${activeCount} kho`, color: 'success' },
              { label: 'Tạm dừng', value: `${inactiveCount} kho`, color: 'default' },
              { label: 'Chi nhánh có kho', value: `${branchesWithWarehousesCount} chi nhánh`, color: 'primary' },
              { label: 'Kho trừ tồn mặc định', value: defaultWarehouse?.name || 'Chưa thiết lập', color: defaultWarehouse ? 'warning' : 'default' },
            ]}
          />
        </AdminFilterSidebar>

        {/* Main Warehouses Table */}
        <div className="min-w-0 flex-1 w-full">
          <AdminDataTable
            enableSelectionToolbar
            selectedRowKeys={selectedWarehouseKeys}
            onSelectionChange={(keys) => setSelectedWarehouseKeys(keys)}
            titleText="Danh sách kho toàn hệ thống"
            totalCount={filteredWarehouses.length}
            countUnit="kho"
            onCopySelected={handleCopySelectedWarehouse}
            onEditSelected={handleEditSelectedWarehouse}
            onDeleteSelected={handleDeleteSelectedWarehouses}
            deleteConfirmTitle={`Xóa ${selectedWarehouseKeys.length} kho đã chọn?`}
            onCreateNew={handleOpenCreateWarehouse}
            createButtonText="Kho mới"
            searchValue={warehouseSearchQuery}
            onSearchChange={(val) => setWarehouseSearchQuery(val)}
            searchPlaceholder="Tìm theo mã, tên, chi nhánh, địa chỉ..."
            extraHeaderActions={
              <Space size={8}>
                <Button
                  icon={<ReloadOutlined spin={loading} />}
                  onClick={loadWarehousesFromApi}
                  className="!h-8 px-2.5 rounded-lg border-slate-300 bg-white text-slate-700 text-xs shadow-xs inline-flex items-center justify-center hover:text-[#784e34]"
                  title="Tải lại danh sách"
                >
                  Làm mới
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={handleExportWarehousesExcel}
                  className="!h-8 px-2.5 rounded-lg border-slate-300 bg-white text-slate-700 text-xs shadow-xs inline-flex items-center justify-center hover:text-[#784e34]"
                  title="Xuất Excel danh sách kho"
                >
                  Xuất Excel
                </Button>
              </Space>
            }
            dataSource={filteredWarehouses}
            rowKey="id"
            columns={[
              {
                title: 'Mã kho',
                dataIndex: 'code',
                key: 'code',
                width: 155,
                render: (code, record) => (
                  <div className="flex flex-col items-start gap-1">
                    <span
                      onClick={() => handleOpenEditWarehouse(record)}
                      className="font-mono text-xs font-semibold text-[#784e34] hover:underline cursor-pointer bg-[#784e34]/10 px-2 py-0.5 rounded whitespace-nowrap inline-block"
                      title="Nhấn để chỉnh sửa"
                    >
                      {code}
                    </span>
                    {record.isDefault ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-300 whitespace-nowrap shadow-2xs">
                        <CrownOutlined className="text-[10px] text-amber-600" />
                        Mặc định trừ tồn
                      </span>
                    ) : null}
                  </div>
                ),
              },
              {
                title: 'Tên kho lưu trữ',
                dataIndex: 'name',
                key: 'name',
                render: (name: string, record) => (
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        onClick={() => handleOpenEditWarehouse(record)}
                        className="font-medium text-sm text-slate-900 hover:text-[#784e34] cursor-pointer transition-colors"
                      >
                        {name}
                      </span>
                      {record.isDefault && (
                        <Tag color="gold" className="text-[10px] font-medium m-0 border-amber-300 bg-amber-50 text-amber-800">
                          ⚡ Trừ tồn khi khách mua
                        </Tag>
                      )}
                    </div>
                    {record.description ? (
                      <div className="text-xs text-slate-400 truncate max-w-xs mt-0.5 font-normal">
                        {record.description}
                      </div>
                    ) : null}
                  </div>
                ),
              },
              {
                title: 'Chi nhánh',
                key: 'branch',
                width: 200,
                render: (_, w) => (
                  <div>
                    <Tag
                      color="blue"
                      className="inline-flex items-center gap-1 font-medium text-xs px-2.5 py-0.5 rounded-full border-blue-200 bg-blue-50 text-blue-700"
                    >
                      <EnvironmentOutlined className="text-[11px]" />
                      {w.branch || 'Chưa gán chi nhánh'}
                    </Tag>
                    <span className="text-[11px] text-slate-400 block mt-1">Cơ sở trực thuộc</span>
                  </div>
                ),
              },
              {
                title: 'Địa chỉ',
                dataIndex: 'address',
                key: 'address',
                width: 250,
                render: (address: string, record) => (
                  <span className="text-xs text-slate-600 block truncate max-w-[250px]" title={address || record.streetAddress || ''}>
                    {address || record.streetAddress || '—'}
                  </span>
                ),
              },
              {
                title: 'Trạng thái',
                dataIndex: 'status',
                key: 'status',
                width: 145,
                align: 'center',
                render: (status: 'active' | 'inactive', w) => (
                  <Dropdown
                    menu={{
                      items: [
                        {
                          key: 'active',
                          label: (
                            <span className="inline-flex items-center text-xs font-medium text-emerald-700">
                              <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-500" />
                              Đang sử dụng
                            </span>
                          ),
                        },
                        {
                          key: 'inactive',
                          label: (
                            <span className="inline-flex items-center text-xs font-medium text-slate-500">
                              <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-slate-400" />
                              Ngừng sử dụng
                            </span>
                          ),
                        },
                      ],
                      onClick: ({ key }) => handleChangeWarehouseStatus(w.id, key as 'active' | 'inactive'),
                    }}
                    trigger={['click']}
                  >
                    <button
                      type="button"
                      className={`inline-flex items-center whitespace-nowrap px-2.5 py-1 rounded text-xs font-medium cursor-pointer border transition ${
                        status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 mr-1.5 rounded-full shrink-0 ${
                          status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                      />
                      {status === 'active' ? 'Đang sử dụng' : 'Ngừng sử dụng'}
                    </button>
                  </Dropdown>
                ),
              },
              {
                title: 'Thao tác',
                key: 'actions',
                width: 105,
                align: 'center',
                render: (_, w) => (
                  <Space size={2}>
                    {!w.isDefault ? (
                      <Tooltip title="Đặt làm kho mặc định xuất bán (Hệ thống sẽ ưu tiên trừ tồn kho này khi khách mua hàng)">
                        <Button
                          icon={<CrownOutlined className="text-sm text-amber-600" />}
                          size="small"
                          type="text"
                          onClick={() => handleSetDefaultWarehouse(w)}
                          className="text-amber-600 hover:text-amber-800 hover:bg-amber-50"
                        />
                      </Tooltip>
                    ) : (
                      <Tooltip title="Kho mặc định xuất bán (đang ưu tiên trừ tồn)">
                        <Button
                          icon={<StarFilled className="text-sm text-amber-500" />}
                          size="small"
                          type="text"
                          className="text-amber-500 cursor-default"
                        />
                      </Tooltip>
                    )}
                    <Button
                      icon={<EditOutlined className="text-sm" />}
                      size="small"
                      type="text"
                      onClick={() => handleOpenEditWarehouse(w)}
                      className="text-slate-600 hover:text-[#784e34] hover:bg-slate-100"
                      title="Chỉnh sửa kho"
                    />
                    <Button
                      icon={<CopyOutlined className="text-sm" />}
                      size="small"
                      type="text"
                      onClick={() => handleCopyWarehouse(w)}
                      className="text-slate-600 hover:text-[#784e34] hover:bg-slate-100"
                      title="Nhân bản kho"
                    />
                    <Popconfirm
                      title={`Xóa kho "${w.name}"?`}
                      description="Hành động này không thể hoàn tác nếu kho đã có giao dịch nhập/xuất."
                      onConfirm={() => handleDeleteWarehouse(w.id, w.name)}
                      okText="Xóa"
                      cancelText="Hủy"
                      okButtonProps={{ danger: true }}
                    >
                      <Button
                        icon={<DeleteOutlined className="text-sm" />}
                        size="small"
                        type="text"
                        className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                        title="Xóa kho"
                      />
                    </Popconfirm>
                  </Space>
                ),
              },
            ]}
          />
        </div>
      </div>

      {/* DRAWER: TẠO MỚI / CHỈNH SỬA KHO HÀNG */}
      <AdminFormDrawer
        open={showWarehouseDrawer}
        onClose={() => setShowWarehouseDrawer(false)}
        form={warehouseForm}
        isEditing={Boolean(editingWarehouse)}
        recordId={editingWarehouse?.code || editingWarehouse?.id}
        editTitle="Chỉnh sửa kho"
        createTitle="Thêm kho hàng mới"
        size="default"
      >
        <Form
          form={warehouseForm}
          layout="vertical"
          onFinish={handleWarehouseFormSubmit}
          className="space-y-3"
        >
          <Form.Item
            label={<span className="text-xs font-semibold text-slate-700">Chi nhánh trực thuộc <span className="text-red-500">*</span></span>}
            name="branch"
            rules={[{ required: true, message: 'Vui lòng chọn chi nhánh trực thuộc' }]}
          >
            <Select
              className="h-9 rounded-lg text-xs sm:text-sm"
              placeholder="Chọn chi nhánh..."
              options={branchesList.map((b) => ({ value: b.name, label: b.name }))}
            />
          </Form.Item>

          <Form.Item
            label={<span className="text-xs font-semibold text-slate-700">Mã kho lưu trữ <span className="text-red-500">*</span></span>}
            name="code"
            rules={[{ required: true, message: 'Nhập mã kho lưu trữ' }]}
          >
            <Input
              className="h-9 rounded-lg text-xs sm:text-sm font-mono uppercase font-semibold"
              placeholder="Tự động hoặc nhập tay"
              suffix={
                <AutoCodeButton
                  onGenerate={handleGenerateWarehouseCode}
                  tooltipTitle="Tự động tạo mã kho lưu trữ mới"
                />
              }
            />
          </Form.Item>

          <Form.Item
            label={<span className="text-xs font-semibold text-slate-700">Tên kho lưu trữ <span className="text-red-500">*</span></span>}
            name="name"
            rules={[{ required: true, message: 'Nhập tên kho' }]}
          >
            <Input className="h-9 rounded-lg text-xs sm:text-sm" placeholder="VD: Tổng Kho Bình Chánh, Showroom Sala..." />
          </Form.Item>

          <Form.Item
            label={<span className="text-xs font-semibold text-slate-700">Diễn giải / Ghi chú</span>}
            name="description"
          >
            <Input className="h-9 rounded-lg text-xs sm:text-sm" placeholder="Nhập diễn giải..." />
          </Form.Item>

          <Form.Item
            label={<span className="text-xs font-semibold text-slate-700">Địa chỉ chi tiết</span>}
            name="streetAddress"
          >
            <Input className="h-9 rounded-lg text-xs sm:text-sm" placeholder="Số nhà, đường phố, thôn/xóm..." />
          </Form.Item>

          <Row gutter={10}>
            <Col span={8}>
              <Form.Item
                label={<span className="text-xs font-semibold text-slate-700">Tỉnh / Thành</span>}
                name="province"
              >
                <AutoComplete
                  className="w-full text-xs sm:text-sm"
                  options={provincesList.map((p) => ({ value: p.name, label: p.name }))}
                  onChange={() => {
                    warehouseForm.setFieldsValue({
                      district: undefined,
                      ward: undefined,
                    });
                  }}
                  filterOption={(inputValue, option) =>
                    (option?.value ?? '').toLowerCase().includes(inputValue.toLowerCase())
                  }
                >
                  <Input
                    placeholder="Chọn/nhập tỉnh..."
                    allowClear
                    className="h-9 rounded-lg text-xs sm:text-sm"
                  />
                </AutoComplete>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label={<span className="text-xs font-semibold text-slate-700">Quận / Huyện</span>}
                name="district"
              >
                <AutoComplete
                  className="w-full text-xs sm:text-sm"
                  disabled={!selectedWarehouseProvince}
                  options={districtOptions.map((d) => ({ value: d.name, label: d.name }))}
                  onChange={() => {
                    warehouseForm.setFieldValue('ward', undefined);
                  }}
                  filterOption={(inputValue, option) =>
                    (option?.value ?? '').toLowerCase().includes(inputValue.toLowerCase())
                  }
                >
                  <Input
                    placeholder={selectedWarehouseProvince ? 'Chọn/nhập quận/huyện...' : 'Chọn tỉnh trước'}
                    allowClear
                    disabled={!selectedWarehouseProvince}
                    className="h-9 rounded-lg text-xs sm:text-sm"
                  />
                </AutoComplete>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label={<span className="text-xs font-semibold text-slate-700">Phường / Xã</span>}
                name="ward"
              >
                <AutoComplete
                  className="w-full text-xs sm:text-sm"
                  disabled={!selectedWarehouseDistrict}
                  options={wardOptions.map((w) => ({ value: w.name, label: w.name }))}
                  filterOption={(inputValue, option) =>
                    (option?.value ?? '').toLowerCase().includes(inputValue.toLowerCase())
                  }
                >
                  <Input
                    placeholder={selectedWarehouseDistrict ? 'Chọn/nhập phường/xã...' : 'Chọn quận trước'}
                    allowClear
                    disabled={!selectedWarehouseDistrict}
                    className="h-9 rounded-lg text-xs sm:text-sm"
                  />
                </AutoComplete>
              </Form.Item>
            </Col>
          </Row>

          {/* Card: Kho mặc định trừ tồn khi khách mua hàng */}
          <div className="rounded-xl border border-amber-300 bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-amber-50/30 p-3.5 space-y-2.5 transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                  <CrownOutlined className="text-base" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-xs sm:text-sm text-slate-800">
                      Kho mặc định xuất hàng
                    </span>
                    <Tag color="gold" className="text-[10px] m-0 font-medium border-amber-300 bg-amber-100 text-amber-800">
                      Ưu tiên trừ tồn kho #1
                    </Tag>
                  </div>
                  <p className="text-[11px] text-slate-600 m-0 mt-1 leading-relaxed">
                    Khi có khách hàng mua hàng (đặt online hoặc tạo đơn), hệ thống sẽ <strong>tự động ưu tiên trừ số lượng tồn kho</strong> tại kho này trước tiên.
                  </p>
                </div>
              </div>
              <Form.Item
                name="isDefault"
                valuePropName="checked"
                className="mb-0 shrink-0"
              >
                <Switch
                  checkedChildren="BẬT"
                  unCheckedChildren="TẮT"
                  className="bg-slate-300 [&.ant-switch-checked]:bg-amber-600"
                />
              </Form.Item>
            </div>
            {selectedWarehouseIsDefault ? (
              <div className="flex items-center gap-1.5 text-xs text-amber-800 bg-white/90 px-3 py-1.5 rounded-lg border border-amber-200 shadow-2xs">
                <CheckCircleOutlined className="text-emerald-600 text-xs shrink-0" />
                <span>Kho này được đặt làm <strong>Kho mặc định trừ tồn</strong> cho toàn hệ thống khi có đơn hàng mới.</span>
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 pl-10">
                Gạt BẬT nếu bạn muốn kho này là kho ưu tiên trừ tồn khi khách hàng mua hàng.
              </div>
            )}
          </div>

          {/* Trạng thái hoạt động */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-800 block">Trạng thái hoạt động</span>
              <span className="text-[11px] text-slate-500">Cho phép giao dịch và sử dụng kho này trong hệ thống</span>
            </div>
            <Form.Item
              name="status"
              valuePropName="checked"
              className="mb-0"
            >
              <Switch
                checkedChildren="MỞ"
                unCheckedChildren="KHÓA"
                className="bg-slate-300 [&.ant-switch-checked]:bg-emerald-600"
              />
            </Form.Item>
          </div>
        </Form>
      </AdminFormDrawer>
    </div>
  );
}
