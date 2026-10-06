'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  ADMIN_STORAGE_KEYS,
  getStoredAdminData,
  setStoredAdminData,
} from '@/utils/adminStorage';
import {
  App,
  Table,
  Button,
  Input,
  Select,
  Modal,
  Tag,
  Badge,
  Progress,
  Form,
  Card,
  Row,
  Col,
  Statistic,
  Dropdown,
  Space,
  Tooltip,
  Avatar,
  Segmented,
  InputNumber,
  Radio,
  Typography,
  Divider,
  Popconfirm,
  Switch,
  Drawer,
  Upload,
  AutoComplete,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  PrinterOutlined,
  SaveOutlined,
  DownloadOutlined,
  CheckOutlined,
  DeleteOutlined,
  CopyOutlined,
  FileTextOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  ShoppingOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  ArrowLeftOutlined,
  FilterOutlined,
  InboxOutlined,
  BellOutlined,
  ReloadOutlined,
  EditOutlined,
  DollarOutlined,
  QrcodeOutlined,
  LockOutlined,
  CheckSquareOutlined,
  BankOutlined,
  ShopOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  FilePdfOutlined,
  EyeOutlined,
  CarOutlined,
  CloseCircleOutlined,
  HomeOutlined,
  FileExcelOutlined,
  FileAddOutlined,
  ShareAltOutlined,
  ExclamationCircleOutlined,
  ArrowRightOutlined,
  CreditCardOutlined,
  TagOutlined,
  ScanOutlined,
  ClearOutlined,
  CompassOutlined,
  SwapOutlined,
  DatabaseOutlined,
  ApartmentOutlined,
  FieldTimeOutlined,
  GlobalOutlined,
  IdcardOutlined,
  KeyOutlined,
  NodeIndexOutlined,
  PaperClipOutlined,
  PercentageOutlined,
  PushpinOutlined,
  QuestionCircleOutlined,
  SafetyCertificateOutlined,
  SafetyOutlined,
  SolutionOutlined,
  TeamOutlined,
  ToolOutlined,
  UploadOutlined,
  VerticalAlignBottomOutlined,
  WalletOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  FolderOpenOutlined,
  UpOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAuth } from '@/context/AuthContext';
import {
  AdminDataTable,
  PosDateFilter,
  checkDateInRange,
  AdminFilterSidebar,
  AdminSidebarSummary,
  AdminStatusBadge,
  AdminDetailDrawer,
  AdminFormDrawer,
  AdminSearchInput,
} from '@/components/admin';
import {
  AdminWarehouse,
  StockImportSlip,
  SupplierReturnSlip,
  AuditSlip,
  StockAuditItem,
  FeaturedCatalogProduct,
  AdminSupplier,
  AdminBranch,
  StockTransferSlip,
} from '@/types/admin';
import {
  INITIAL_WAREHOUSES,
  INITIAL_STOCK_IMPORTS,
  INITIAL_SUPPLIER_RETURNS,
  INITIAL_AUDIT_SLIPS,
  INITIAL_AUDIT_ITEMS,
  INITIAL_SUPPLIERS,
  FEATURED_CATALOG,
  INITIAL_BRANCHES,
  INITIAL_STOCK_TRANSFERS,
} from '@/data/admin/mockData';
import { exportToExcel } from '@/utils/exportExcel';
import { SuppliersTab } from './SuppliersTab';
import { isMatchBranch } from '@/utils/branchHelper';
import {
  printElementById,
  printStocktakeSlip,
  printGoodsReceiptSlip,
  printGoodsReturnSlip,
} from '@/utils/printHelper';

const VIETNAM_PROVINCES = [
  'Hà Nội',
  'TP. Hồ Chí Minh',
  'Đà Nẵng',
  'Hải Phòng',
  'Cần Thơ',
  'Bình Dương',
  'Đồng Nai',
  'Bà Rịa - Vũng Tàu',
  'Quảng Ninh',
  'Bắc Ninh',
  'Hải Dương',
  'Hưng Yên',
  'Thái Nguyên',
  'Nam Định',
  'Ninh Bình',
  'Thanh Hóa',
  'Nghệ An',
  'Huế',
  'Quảng Nam',
  'Khánh Hòa',
  'Lâm Đồng',
  'Bình Định',
  'Kiên Giang',
  'An Giang',
  'Tiền Giang',
];

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

export interface WorkshopTabProps {
  catalogList?: FeaturedCatalogProduct[];
  suppliersList?: AdminSupplier[];
  setSuppliersList?: React.Dispatch<React.SetStateAction<AdminSupplier[]>>;
  branchesList?: AdminBranch[];
  selectedGlobalBranch?: string;
  initialSubTab?: 'warehouses' | 'imports' | 'returns' | 'stocktake' | 'suppliers';
}

export function WorkshopTab({
  catalogList = FEATURED_CATALOG,
  suppliersList = INITIAL_SUPPLIERS,
  setSuppliersList,
  branchesList = INITIAL_BRANCHES,
  selectedGlobalBranch = 'all',
  initialSubTab = 'warehouses',
}: WorkshopTabProps) {
  const { message } = App.useApp();
  const { user } = useAuth();

  // Sub-Tab Switcher State
  const [warehouseSubTab, setWarehouseSubTab] = useState<'warehouses' | 'imports' | 'returns' | 'stocktake' | 'suppliers'>(initialSubTab);

  // Warehouses State
  const [warehousesList, setWarehousesList] = useState<AdminWarehouse[]>(INITIAL_WAREHOUSES);
  const [selectedWarehouseKeys, setSelectedWarehouseKeys] = useState<React.Key[]>([]);
  const [warehouseSearchQuery, setWarehouseSearchQuery] = useState('');
  const [warehouseBranchFilter, setWarehouseBranchFilter] = useState('all');
  const [warehouseStatusFilter, setWarehouseStatusFilter] = useState('all');
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<AdminWarehouse | null>(null);
  const [warehouseForm] = Form.useForm();

  const selectedWarehouseRecord = warehousesList.find((w) => selectedWarehouseKeys.includes(w.id));

  const handleDeleteSelectedWarehouses = () => {
    if (!selectedWarehouseKeys.length) return;
    setWarehousesList(warehousesList.filter((w) => !selectedWarehouseKeys.includes(w.id)));
    message.success(`Đã xóa ${selectedWarehouseKeys.length} kho đã chọn!`);
    setSelectedWarehouseKeys([]);
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

  // Load and sync warehouses with LocalStorage
  useEffect(() => {
    setWarehousesList(getStoredAdminData(ADMIN_STORAGE_KEYS.WAREHOUSES, INITIAL_WAREHOUSES));
  }, []);

  useEffect(() => {
    setStoredAdminData(ADMIN_STORAGE_KEYS.WAREHOUSES, warehousesList);
  }, [warehousesList]);

  // Imports State
  const [importsList, setImportsList] = useState<StockImportSlip[]>(INITIAL_STOCK_IMPORTS);
  const [importSearchQuery, setImportSearchQuery] = useState('');
  const [importStatusFilter, setImportStatusFilter] = useState('all');
  const [importDateRange, setImportDateRange] = useState<[any, any] | null>(null);
  const [selectedImportDetail, setSelectedImportDetail] = useState<StockImportSlip | null>(null);
  const [showImportDetailDrawer, setShowImportDetailDrawer] = useState(false);
  const [importDetailTab, setImportDetailTab] = useState<'items' | 'info'>('items');
  const [expandedImportRowKeys, setExpandedImportRowKeys] = useState<string[]>([]);
  const [importPanelTabs, setImportPanelTabs] = useState<Record<string, 'items' | 'info'>>({});
  const [importRowTabs, setImportRowTabs] = useState<Record<string, 'items' | 'info'>>({});
  const [selectedImportSlipForPrint, setSelectedImportSlipForPrint] = useState<StockImportSlip | null>(null);

  // Import Entry State
  const [importViewMode, setImportViewMode] = useState<'list' | 'create'>('list');
  const [importEntryLines, setImportEntryLines] = useState<Array<{
    id: string;
    code: string;
    name: string;
    spec?: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    total: number;
  }>>([]);
  const [importSearchProduct, setImportSearchProduct] = useState('');
  const [showImportProductPopover, setShowImportProductPopover] = useState(false);
  const [importCode, setImportCode] = useState('');
  const [importDate, setImportDate] = useState('');
  const [importSupplier, setImportSupplier] = useState<string | undefined>(undefined);
  const [importWarehouse, setImportWarehouse] = useState<string | undefined>(undefined);
  const [importInvoiceNumber, setImportInvoiceNumber] = useState('');
  const [importInspector, setImportInspector] = useState('');
  const [importDiscount, setImportDiscount] = useState<number>(0);
  const [importPaidAmount, setImportPaidAmount] = useState<number | undefined>(undefined);
  const [importPaymentMethod, setImportPaymentMethod] = useState('Chuyển khoản');
  const [importNote, setImportNote] = useState('');

  // Returns State
  const [supplierReturnsList, setSupplierReturnsList] = useState<SupplierReturnSlip[]>(INITIAL_SUPPLIER_RETURNS);
  const [returnSearchQuery, setReturnSearchQuery] = useState('');
  const [returnStatusFilter, setReturnStatusFilter] = useState('all');
  const [returnDateRange, setReturnDateRange] = useState<[any, any] | null>(null);
  const [selectedReturnSlipForPrint, setSelectedReturnSlipForPrint] = useState<SupplierReturnSlip | null>(null);
  const [expandedReturnRowKeys, setExpandedReturnRowKeys] = useState<string[]>([]);
  const [returnRowTabs, setReturnRowTabs] = useState<Record<string, 'items' | 'info'>>({});

  // Return Entry State
  const [returnViewMode, setReturnViewMode] = useState<'list' | 'create'>('list');
  const [returnEntryLines, setReturnEntryLines] = useState<Array<{
    id: string;
    code: string;
    name: string;
    spec?: string;
    unit: string;
    quantity: number;
    purchasePrice: number;
    returnPrice: number;
    total: number;
    reason?: string;
  }>>([]);
  const [returnSearchProduct, setReturnSearchProduct] = useState('');
  const [showReturnProductPopover, setShowReturnProductPopover] = useState(false);
  const [returnCode, setReturnCode] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [returnSourceCode, setReturnSourceCode] = useState<string | undefined>(undefined);
  const [returnSupplier, setReturnSupplier] = useState<string | undefined>(undefined);
  const [returnWarehouse, setReturnWarehouse] = useState<string | undefined>(undefined);
  const [returnStaffName, setReturnStaffName] = useState('');
  const [returnReason, setReturnReason] = useState('Lỗi quy cách / Kiểm định không đạt tiêu chuẩn');
  const [returnSolution, setReturnSolution] = useState('Đã hoàn bù lô mới');
  const [returnDiscount, setReturnDiscount] = useState<number>(0);
  const [returnPaidAmount, setReturnPaidAmount] = useState<number | undefined>(undefined);
  const [returnPaymentMethod, setReturnPaymentMethod] = useState('Chuyển khoản');
  const [returnNote, setReturnNote] = useState('');

  // Stocktake State
  const [stocktakeViewMode, setStocktakeViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [stocktakeTabFilter, setStocktakeTabFilter] = useState<'all' | 'matched' | 'diff' | 'increase' | 'decrease'>('all');
  const [stocktakeEntryLines, setStocktakeEntryLines] = useState<StockAuditItem[]>([]);
  const [stocktakeSearchProduct, setStocktakeSearchProduct] = useState('');
  const [showStocktakeProductPopover, setShowStocktakeProductPopover] = useState(false);
  const [stocktakeCode, setStocktakeCode] = useState('');
  const [stocktakeSlipCode, setStocktakeSlipCode] = useState('');
  const [stocktakeDate, setStocktakeDate] = useState('');
  const [stocktakeWarehouse, setStocktakeWarehouse] = useState<string | undefined>(undefined);
  const [stocktakeWarehouseName, setStocktakeWarehouseName] = useState('Kho Phôi Gỗ Nguyên Khối FAS');
  const [stocktakeStaffName, setStocktakeStaffName] = useState('');
  const [stocktakeNote, setStocktakeNote] = useState('');
  const [auditSlips, setAuditSlips] = useState<AuditSlip[]>(INITIAL_AUDIT_SLIPS);
  const [activeSlipId, setActiveSlipId] = useState<string>('slip_1');
  const [editingSlipId, setEditingSlipId] = useState<string | null>(null);
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [auditDateRange, setAuditDateRange] = useState<[any, any] | null>(null);
  const [stockTypeFilter, setStockTypeFilter] = useState('all');
  const [stockDiffFilter, setStockDiffFilter] = useState('all');
  const [selectedAuditSlip, setSelectedAuditSlip] = useState<AuditSlip | null>(null);
  const [showAuditSlipDrawer, setShowAuditSlipDrawer] = useState(false);
  const [showCreateSlipModal, setShowCreateSlipModal] = useState(false);
  const [createSlipForm] = Form.useForm();
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [addItemForm] = Form.useForm();

  // Active slip derived
  const activeSlip = useMemo(() => {
    return auditSlips.find((s) => s.id === activeSlipId) || auditSlips[0];
  }, [auditSlips, activeSlipId]);

  // Transfer State
  const [transfersList, setTransfersList] = useState<StockTransferSlip[]>(INITIAL_STOCK_TRANSFERS);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferForm] = Form.useForm();

  // Suppliers State
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');
  const [supplierStatusFilter, setSupplierStatusFilter] = useState('all');
  const [showSupplierDrawer, setShowSupplierDrawer] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<AdminSupplier | null>(null);

  const isMatchGlobalBranch = (targetNameOrBranch?: string) => {
    return isMatchBranch(targetNameOrBranch, selectedGlobalBranch, warehousesList);
  };

  const allAuditableStock: StockAuditItem[] = useMemo(() => {
    const catalogItems: StockAuditItem[] = (catalogList || []).map((prod, idx) => {
      const parsedStock = parseInt(prod.stockNote?.replace(/\D/g, '') || '5', 10) || 5;
      return {
        id: 'prod_' + prod.code,
        code: prod.code,
        name: prod.name,
        type: 'product' as const,
        location: 'Showroom Thảo Điền - Khu ' + String.fromCharCode(65 + (idx % 4)),
        systemQty: parsedStock,
        actualQty: parsedStock,
        unit: prod.name.toLowerCase().includes('bàn ăn') || prod.name.toLowerCase().includes('sofa') ? 'bộ' : 'chiếc',
        systemMc: 'Đạt chuẩn',
        actualMc: 'Đạt chuẩn',
        status: 'matched' as const,
        qualityNote: (prod.collection || '') + ' • ' + (prod.metaInfo || 'Hàng sẵn bán'),
        checked: true,
      };
    });

    const existingCodes = new Set(catalogItems.map((i) => i.code));
    const additionalInitials = INITIAL_AUDIT_ITEMS.filter((i) => !existingCodes.has(i.code));

    return [...catalogItems, ...additionalInitials];
  }, [catalogList]);


  const handleOpenCreateWarehouse = () => {
    setEditingWarehouse(null);
    const existingCodes = new Set(warehousesList.map((w) => (w.code || '').toUpperCase()));
    let nextNum = warehousesList.length + 1;
    let autoCode = `KHO${nextNum.toString().padStart(4, '0')}`;
    while (existingCodes.has(autoCode)) {
      nextNum++;
      autoCode = `KHO${nextNum.toString().padStart(4, '0')}`;
    }
    const defaultBranch = selectedGlobalBranch !== 'all' ? selectedGlobalBranch : (branchesList[0]?.name || 'Chi nhánh trung tâm');
    warehouseForm.resetFields();
    warehouseForm.setFieldsValue({
      code: autoCode,
      name: '',
      branch: defaultBranch,
      description: '',
      streetAddress: '',
      district: '',
      province: 'TP. Hồ Chí Minh',
      isDefault: false,
      status: true,
    });
    setShowWarehouseModal(true);
  };

  const handleOpenEditWarehouse = (wh: AdminWarehouse) => {
    setEditingWarehouse(wh);
    warehouseForm.setFieldsValue({
      code: wh.code,
      name: wh.name,
      branch: wh.branch || branchesList[0]?.name || 'Chi nhánh trung tâm',
      description: wh.description || '',
      streetAddress: wh.streetAddress || wh.address || '',
      district: wh.district || '',
      province: wh.province || 'TP. Hồ Chí Minh',
      isDefault: Boolean(wh.isDefault),
      status: wh.status !== 'inactive',
    });
    setShowWarehouseModal(true);
  };

  const handleCopyWarehouse = (wh: AdminWarehouse) => {
    const existingCodes = new Set(warehousesList.map((w) => (w.code || '').toUpperCase()));
    let nextNum = warehousesList.length + 1;
    let autoCode = `KHO${nextNum.toString().padStart(4, '0')}`;
    while (existingCodes.has(autoCode)) {
      nextNum++;
      autoCode = `KHO${nextNum.toString().padStart(4, '0')}`;
    }
    const clonedWh: AdminWarehouse = {
      ...wh,
      id: `wh_${Date.now()}`,
      code: autoCode,
      name: `${wh.name} (Bản sao)`,
      isDefault: false,
    };
    setWarehousesList([clonedWh, ...warehousesList]);
    message.success(`Đã nhân bản kho "${wh.name}" thành "${clonedWh.name}"!`);
  };

  const handleWarehouseFormSubmit = (values: any) => {
    const trimmedCode = (values.code || '').trim().toUpperCase();
    const trimmedName = (values.name || '').trim();
    const defaultBranch = selectedGlobalBranch !== 'all' ? selectedGlobalBranch : (branchesList[0]?.name || 'Chi nhánh trung tâm');
    const isDef = Boolean(values.isDefault);
    const itemStatus: 'active' | 'inactive' = typeof values.status === 'boolean'
      ? (values.status ? 'active' : 'inactive')
      : (values.status === 'inactive' ? 'inactive' : 'active');

    const parts = [values.streetAddress, values.district, values.province].filter(Boolean);
    const fullAddress = parts.length > 0 ? parts.join(', ') : (values.streetAddress || '');

    if (editingWarehouse) {
      const updated = warehousesList.map((w) => {
        if (w.id === editingWarehouse.id) {
          return {
            ...w,
            code: trimmedCode,
            name: trimmedName,
            branch: values.branch || defaultBranch,
            province: values.province || 'TP. Hồ Chí Minh',
            district: values.district || '',
            streetAddress: values.streetAddress || '',
            address: fullAddress,
            isDefault: isDef,
            status: itemStatus,
            description: values.description || '',
          };
        }
        if (isDef) {
          return { ...w, isDefault: false };
        }
        return w;
      });
      setWarehousesList(updated);
      message.success(`Đã cập nhật thông tin kho "${trimmedName}" thành công!`);
    } else {
      const newWh: AdminWarehouse = {
        id: `wh_${Date.now()}`,
        code: trimmedCode,
        name: trimmedName,
        type: 'main',
        typeLabel: 'Tổng kho hàng nội thất',
        branch: values.branch || defaultBranch,
        province: values.province || 'TP. Hồ Chí Minh',
        district: values.district || '',
        streetAddress: values.streetAddress || '',
        address: fullAddress,
        managerName: 'Chưa phân công',
        managerPhone: '',
        capacityMax: 300,
        capacityCurrent: 0,
        capacityUnit: 'sản phẩm',
        occupancyPercent: 0,
        humidityControl: 'Kho tiêu chuẩn',
        isDefault: isDef,
        status: itemStatus,
        description: values.description || '',
        totalValue: 0,
      };
      if (isDef) {
        setWarehousesList([newWh, ...warehousesList.map((w) => ({ ...w, isDefault: false }))]);
      } else {
        setWarehousesList([newWh, ...warehousesList]);
      }
      message.success(`Đã thêm kho "${trimmedName}" thành công!`);
    }

    setShowWarehouseModal(false);
    warehouseForm.resetFields();
  };

  const handleChangeWarehouseStatus = (id: string, newStatus: 'active' | 'inactive') => {
    const updated = warehousesList.map((w) => {
      if (w.id === id) {
        message.success(`Đã đổi trạng thái kho "${w.name}" thành ${newStatus === 'active' ? 'Đang hoạt động' : 'Tạm dừng'}`);
        return { ...w, status: newStatus };
      }
      return w;
    });
    setWarehousesList(updated);
  };

  const handleDeleteWarehouse = (id: string, name: string) => {
    setWarehousesList(warehousesList.filter((w) => w.id !== id));
    message.success(`Đã xóa kho "${name}" thành công!`);
  };

  const handleGenerateWarehouseCode = () => {
    const existingCodes = new Set(warehousesList.map((w) => (w.code || '').toUpperCase()));
    let nextNum = warehousesList.length + 1;
    let genCode = `KHO${nextNum.toString().padStart(4, '0')}`;
    while (existingCodes.has(genCode)) {
      nextNum++;
      genCode = `KHO${nextNum.toString().padStart(4, '0')}`;
    }
    warehouseForm.setFieldsValue({ code: genCode });
    message.success(`Đã tự động tạo mã kho: ${genCode}`);
  };


  const handleOpenCreateImport = () => {
    if (!importCode) {
      const nextNum = (importsList.length + 91).toString().padStart(3, '0');
      const nowStr = new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      setImportCode(`#PN-2026-${nextNum}`);
      setImportDate(nowStr);
      setImportInspector(user?.name || 'Nguyễn Văn Nam (KCS)');
      setImportSupplier(undefined);
      setImportWarehouse(warehousesList[0]?.name || 'Tổng Kho Bình Chánh');
      setImportInvoiceNumber('');
      setImportDiscount(0);
      setImportPaidAmount(undefined);
      setImportPaymentMethod('Chuyển khoản');
      setImportNote('');
    }
    setImportViewMode('create');
  };

  const handleSaveImportSlip = (targetStatus: 'completed' | 'draft') => {
    if (importEntryLines.length === 0) {
      message.error('Vui lòng thêm ít nhất 1 mặt hàng vào phiếu nhập!');
      return;
    }
    const totalGoods = importEntryLines.reduce((sum, item) => sum + (item.total || (item.quantity * item.unitPrice)), 0);
    const payable = Math.max(0, totalGoods - (importDiscount || 0));
    const paid = importPaidAmount !== undefined ? Number(importPaidAmount) : payable;
    const debt = Math.max(0, payable - paid);
    const currentCode = importCode || `#PN-2026-${(importsList.length + 91).toString().padStart(3, '0')}`;
    const firstItem = importEntryLines[0];

    const newSlip: StockImportSlip = {
      id: `imp_${Date.now()}`,
      code: currentCode,
      supplier: importSupplier || suppliersList[0]?.name || 'Northwest Hardwoods (USA)',
      warehouseName: importWarehouse || warehousesList[0]?.name || 'Tổng Kho Bình Chánh',
      itemName: importEntryLines.length === 1 ? firstItem.name : `${firstItem.name} + ${importEntryLines.length - 1} món khác`,
      spec: firstItem.spec || '',
      quantity: importEntryLines.reduce((sum, item) => sum + item.quantity, 0),
      unitPrice: firstItem.unitPrice || 0,
      unit: firstItem.unit || 'bộ',
      mc: 'Đạt chuẩn',
      totalValue: payable,
      paidAmount: paid,
      debtAmount: debt,
      paymentMethod: importPaymentMethod || 'Chuyển khoản',
      invoiceNumber: importInvoiceNumber || '',
      note: importNote || '',
      importDate: importDate || (new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })),
      inspector: importInspector || user?.name || 'Nguyễn Văn Nam (KCS)',
      status: targetStatus,
      statusLabel: targetStatus === 'draft' ? 'Lưu tạm' : 'Đã nhập kho',
    };

    setImportsList([newSlip, ...importsList]);

    // Update supplier's total purchased
    if (targetStatus === 'completed' && newSlip.supplier && setSuppliersList) {
      const supName = newSlip.supplier;
      setSuppliersList((prev) =>
        prev.map((s) =>
          s.name.toLowerCase() === supName.toLowerCase() || supName.toLowerCase().includes(s.name.toLowerCase())
            ? { ...s, totalPurchased: (s.totalPurchased || 0) + payable }
            : s
        )
      );
    }

    if (targetStatus === 'draft') {
      message.success(`Đã lưu tạm phiếu nhập kho "${newSlip.code}"!`);
    } else {
      message.success(`Đã lập phiếu nhập kho "${newSlip.code}" thành công!`);
    }

    setImportEntryLines([]);
    setImportCode('');
    setImportSearchProduct('');
    setImportViewMode('list');
  };

  const handleDeleteImport = (id: string, code: string) => {
    setImportsList((prev) => prev.filter((i) => i.id !== id));
    message.success(`Đã xóa phiếu nhập kho ${code}!`);
  };


  const handleOpenCreateStocktake = () => {
    const nextCode = `#KK-2026-${(auditSlips.length + 1).toString().padStart(2, '0')}`;
    setStocktakeSlipCode(nextCode);
    setStocktakeWarehouseName(warehousesList[0]?.name || 'Kho Phôi Gỗ Nguyên Khối FAS');
    setStocktakeNote('');
    setEditingSlipId(null);
    setStocktakeTabFilter('all');
    setStocktakeEntryLines([]);
    setStocktakeSearchProduct('');
    setStocktakeViewMode('create');
  };

  const handleOpenEditStocktake = (slip: AuditSlip) => {
    setStocktakeSlipCode(slip.code);
    setStocktakeWarehouseName(slip.scopeLabel || warehousesList[0]?.name || 'Kho Phôi Gỗ Nguyên Khối FAS');
    setStocktakeNote(slip.note || '');
    setEditingSlipId(slip.id);
    setStocktakeTabFilter('all');
    setStocktakeEntryLines(slip.items || []);
    setStocktakeViewMode('edit');
  };

  const handleSaveDraftStocktake = () => {
    if (editingSlipId) {
      setAuditSlips(auditSlips.map(s => s.id === editingSlipId ? {
        ...s,
        note: stocktakeNote,
        items: stocktakeEntryLines,
      } : s));
      message.success(`Đã lưu cập nhật phiếu kiểm ${stocktakeSlipCode}!`);
    } else {
      const newSlip: AuditSlip = {
        id: `slip_${Date.now()}`,
        code: stocktakeSlipCode,
        title: `Phiên kiểm kê ${stocktakeWarehouseName}`,
        createdAt: new Date().toLocaleDateString('vi-VN'),
        creator: user?.name || 'Nguyễn Văn Nam (Thủ kho)',
        scope: 'all',
        scopeLabel: stocktakeWarehouseName,
        status: 'auditing',
        statusLabel: 'Đang kiểm đếm',
        note: stocktakeNote,
        items: stocktakeEntryLines,
      };
      setAuditSlips([newSlip, ...auditSlips]);
      message.success(`Đã lưu tạm phiếu kiểm ${stocktakeSlipCode}!`);
    }
    setStocktakeViewMode('list');
  };

  const handleCompleteStocktake = () => {
    if (editingSlipId) {
      setAuditSlips(auditSlips.map(s => s.id === editingSlipId ? {
        ...s,
        status: 'completed' as const,
        statusLabel: 'Đã hoàn tất 100%',
        note: stocktakeNote,
        items: stocktakeEntryLines,
      } : s));
    } else {
      const newSlip: AuditSlip = {
        id: `slip_${Date.now()}`,
        code: stocktakeSlipCode,
        title: `Phiên kiểm kê ${stocktakeWarehouseName}`,
        createdAt: new Date().toLocaleDateString('vi-VN'),
        creator: user?.name || 'Nguyễn Văn Nam (Thủ kho)',
        scope: 'all',
        scopeLabel: stocktakeWarehouseName,
        status: 'completed',
        statusLabel: 'Đã hoàn tất 100%',
        note: stocktakeNote,
        items: stocktakeEntryLines,
      };
      setAuditSlips([newSlip, ...auditSlips]);
    }
    setStocktakeViewMode('list');
    message.success(`Đã hoàn tất cân bằng tồn kho theo phiếu kiểm ${stocktakeSlipCode}!`);
  };

  const handleOpenCreateReturn = () => {
    if (!returnCode) {
      const nextNum = (supplierReturnsList.length + 9).toString().padStart(3, '0');
      const nowStr = new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      setReturnCode(`#TH-2026-${nextNum}`);
      setReturnDate(nowStr);
      setReturnStaffName(user?.name || 'Nguyễn Văn Nam (KCS)');
      setReturnSupplier(undefined);
      setReturnWarehouse(warehousesList[0]?.name || 'Tổng Kho Bình Chánh');
      setReturnSourceCode(undefined);
      setReturnReason('Lỗi quy cách / Kiểm định không đạt tiêu chuẩn');
      setReturnSolution('Đã hoàn bù lô mới');
      setReturnDiscount(0);
      setReturnPaidAmount(undefined);
      setReturnPaymentMethod('Chuyển khoản');
      setReturnNote('');
    }
    setReturnViewMode('create');
  };

  const handleSaveReturnSlip = (targetStatus: 'completed' | 'draft') => {
    if (returnEntryLines.length === 0) {
      message.error('Vui lòng thêm ít nhất 1 mặt hàng vào phiếu trả hàng!');
      return;
    }
    const totalGoods = returnEntryLines.reduce((sum, item) => sum + (item.total || (item.quantity * item.returnPrice)), 0);
    const refund = Math.max(0, totalGoods - (returnDiscount || 0));
    const paid = returnPaidAmount !== undefined ? Number(returnPaidAmount) : refund;
    const currentCode = returnCode || `#TH-2026-${(supplierReturnsList.length + 9).toString().padStart(3, '0')}`;
    const firstItem = returnEntryLines[0];

    const newReturn: SupplierReturnSlip = {
      id: `ret_${Date.now()}`,
      code: currentCode,
      sourcePurchaseEntryCode: returnSourceCode || '',
      supplierName: returnSupplier || suppliersList[0]?.name || 'Gruppo Mastrotto (Italy)',
      warehouseName: returnWarehouse || warehousesList[0]?.name || 'Tổng Kho Bình Chánh',
      itemName: returnEntryLines.length === 1 ? firstItem.name : `${firstItem.name} + ${returnEntryLines.length - 1} món khác`,
      spec: firstItem.spec || '',
      quantity: returnEntryLines.reduce((sum, item) => sum + item.quantity, 0),
      unit: firstItem.unit || 'bộ',
      purchasePrice: firstItem.purchasePrice || firstItem.returnPrice || 0,
      returnPrice: firstItem.returnPrice || 0,
      totalGoods: totalGoods,
      totalValue: totalGoods,
      invoiceDiscount: returnDiscount || 0,
      supplierRefund: refund,
      paidAmount: paid,
      paymentMethod: returnPaymentMethod || 'Chuyển khoản',
      returnDate: returnDate || (new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })),
      staffName: returnStaffName || user?.name || 'Nguyễn Văn Nam (KCS)',
      reason: returnReason || 'Lỗi quy cách / Kiểm định không đạt tiêu chuẩn',
      solution: returnSolution || 'Đã hoàn bù lô mới',
      status: targetStatus,
      statusLabel: targetStatus === 'draft' ? 'Phiếu tạm' : 'Đã trả hàng',
      note: returnNote || '',
    };

    setSupplierReturnsList([newReturn, ...supplierReturnsList]);

    if (targetStatus === 'draft') {
      message.success(`Đã lưu tạm phiếu trả hàng "${newReturn.code}"!`);
    } else {
      message.success(`Đã lập phiếu trả hàng "${newReturn.code}" thành công!`);
    }

    setReturnEntryLines([]);
    setReturnCode('');
    setReturnSearchProduct('');
    setReturnViewMode('list');
  };

  const handleDeleteReturnSlip = (id: string, code: string) => {
    setSupplierReturnsList(supplierReturnsList.filter((r) => r.id !== id));
    message.success(`Đã xóa phiếu trả hàng ${code}!`);
  };

  const handleTransferSubmit = (values: any) => {
    const newTransfer: StockTransferSlip = {
      id: `tr_${Date.now()}`,
      code: `CK-2026-${(transfersList.length + 89).toString().padStart(3, '0')}`,
      fromWarehouse: values.fromWarehouse,
      toWarehouse: values.toWarehouse,
      transferDate: 'Hôm nay ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      creator: user?.name || 'Nguyễn Văn Nam',
      itemSummary: values.itemSummary,
      totalQuantity: Number(values.totalQuantity) || 1,
      status: 'delivering',
      statusLabel: 'Đang vận chuyển',
      note: values.note || 'Điều chuyển nội bộ phục vụ sản xuất',
    };
    setTransfersList([newTransfer, ...transfersList]);
    message.success(`Đã tạo phiếu điều chuyển ${newTransfer.code} thành công!`);
    setShowTransferModal(false);
    transferForm.resetFields();
  };

  const handleGenerateImportCode = () => {
    const nextNum = (importsList.length + 91).toString().padStart(3, '0');
    const autoCode = `#PN-2026-${nextNum}`;
    setImportCode(autoCode);
    message.success(`Đã tạo mã phiếu nhập: ${autoCode}`);
  };


  const handleExportWarehousesExcel = () => {
    const exportData = warehousesList.map((w) => ({
      'Mã kho': w.code,
      'Tên kho': w.name,
      'Loại kho': w.typeLabel,
      'Chi nhánh': w.branch,
      'Địa chỉ': w.address,
      'Thủ kho': w.managerName,
      'SĐT': w.managerPhone,
      'Sức chứa tối đa': `${w.capacityMax} ${w.capacityUnit}`,
      'Kiểm soát độ ẩm MC': w.humidityControl,
      'Trạng thái': w.status === 'active' ? 'Đang hoạt động' : 'Tạm dừng',
    }));
    exportToExcel(exportData, 'Danh_sach_kho_hang');
    message.success('Đã xuất danh sách kho hàng ra file Excel thành công!');
  };

  const handleExportImportsExcel = () => {
    const exportData = importsList.map((i, idx) => ({
      'STT': idx + 1,
      'Mã phiếu nhập': i.code,
      'Nhà cung cấp': i.supplier,
      'Kho tiếp nhận': i.warehouseName,
      'Tên hàng hóa': i.itemName,
      'Quy cách': i.spec || '',
      'Số lượng': i.quantity,
      'ĐVT': i.unit,
      'Đơn giá nhập (VNĐ)': i.unitPrice || 0,
      'Tổng tiền hàng (VNĐ)': i.totalValue,
      'Đã thanh toán (VNĐ)': i.paidAmount !== undefined ? i.paidAmount : i.totalValue,
      'Thời gian nhập': i.importDate,
      'Người tiếp nhận / KCS': i.inspector,
      'Hình thức thanh toán': i.paymentMethod || 'Chuyển khoản',
      'Trạng thái': i.statusLabel,
    }));
    exportToExcel(exportData, 'Danh_sach_phieu_nhap_kho');
    message.success('Đã xuất danh sách phiếu nhập kho ra file Excel thành công!');
  };

  const handleExportSingleImportDetail = (imp: StockImportSlip) => {
    const exportData = [
      {
        'Mã phiếu nhập': imp.code,
        'Mã hàng': imp.code,
        'Tên hàng hóa': imp.itemName,
        'Quy cách': imp.spec || '',
        'Đơn vị tính': imp.unit || 'bộ',
        'Số lượng nhập': imp.quantity,
        'Đơn giá nhập (VNĐ)': imp.unitPrice || 0,
        'Tổng tiền hàng (VNĐ)': imp.totalValue || 0,
        'Đã thanh toán (VNĐ)': imp.paidAmount !== undefined ? imp.paidAmount : imp.totalValue,
        'Còn nợ lại NCC (VNĐ)': Math.max(0, (imp.totalValue || 0) - (imp.paidAmount !== undefined ? imp.paidAmount : imp.totalValue)),
        'Nhà cung cấp': imp.supplier,
        'Kho tiếp nhận': imp.warehouseName,
        'Số hóa đơn VAT': imp.invoiceNumber || 'Chưa kèm hóa đơn',
        'Người tiếp nhận & KCS': imp.inspector,
        'Thời gian nhập': imp.importDate,
        'Hình thức thanh toán': imp.paymentMethod || 'Chuyển khoản',
        'Trạng thái': imp.status === 'draft' ? 'Bản lưu tạm' : 'Đã nhập kho',
        'Ghi chú': imp.note || '',
      },
    ];
    exportToExcel(exportData, `Chi_tiet_phieu_nhap_${imp.code.replace(/[^a-zA-Z0-9_-]/g, '')}`);
    message.success(`Đã xuất chi tiết phiếu nhập ${imp.code} ra file Excel thành công!`);
  };

  const handleExportCreateImportLinesExcel = () => {
    if (!importEntryLines || importEntryLines.length === 0) {
      message.warning('Chưa có mặt hàng nào trong phiếu để xuất Excel!');
      return;
    }
    const totalGoods = importEntryLines.reduce((sum, item) => sum + (item.total || item.quantity * item.unitPrice), 0);
    const payable = Math.max(0, totalGoods - (importDiscount || 0));
    const paid = importPaidAmount !== undefined ? Number(importPaidAmount) : payable;
    const debt = Math.max(0, payable - paid);

    const exportData = importEntryLines.map((line, idx) => ({
      'STT': idx + 1,
      'Mã phiếu nhập': importCode || '#PN-2026-NEW',
      'Mã hàng': line.code,
      'Tên sản phẩm': line.name,
      'Đơn vị tính': line.unit,
      'Số lượng': line.quantity,
      'Đơn giá nhập (VNĐ)': line.unitPrice,
      'Thành tiền (VNĐ)': line.total || line.quantity * line.unitPrice,
      'Nhà cung cấp': importSupplier,
      'Kho tiếp nhận': importWarehouse,
      'Số HĐ VAT / Chứng từ': importInvoiceNumber || 'Chưa có',
      'Người phụ trách KCS': importInspector || 'Nguyễn Văn Nam (KCS)',
      'Tổng tiền hàng phiếu': totalGoods,
      'Chiết khấu / Giảm giá': importDiscount || 0,
      'Cần trả NCC': payable,
      'Đã trả NCC': paid,
      'Còn nợ lại NCC': debt,
      'Hình thức thanh toán': importPaymentMethod,
      'Ghi chú phiếu': importNote || '',
    }));
    exportToExcel(exportData, `Chi_tiet_don_nhap_hang_${(importCode || 'PN').replace(/[^a-zA-Z0-9_-]/g, '')}`);
    message.success(`Đã xuất chi tiết đơn nhập hàng ${importCode} ra file Excel thành công!`);
  };

  const handleExportReturnsExcel = () => {
    const exportData = supplierReturnsList.map((r, idx) => ({
      'STT': idx + 1,
      'Mã phiếu trả': r.code,
      'Phiếu nhập gốc': r.sourcePurchaseEntryCode || 'Không liên kết',
      'Nhà cung cấp nhận': r.supplierName,
      'Kho xuất trả': r.warehouseName || '',
      'Tên mặt hàng hoàn trả': r.itemName,
      'Quy cách': r.spec || '',
      'ĐVT': r.unit || 'bộ',
      'Số lượng trả': r.quantity,
      'Đơn giá trả (VNĐ)': r.returnPrice || r.purchasePrice || 0,
      'Tổng tiền hàng trả (VNĐ)': r.totalGoods || r.supplierRefund || 0,
      'NCC cần hoàn tiền (VNĐ)': r.supplierRefund || 0,
      'NCC đã hoàn tiền (VNĐ)': r.paidAmount !== undefined ? r.paidAmount : (r.supplierRefund || 0),
      'Hình thức hoàn tiền': r.paymentMethod || 'Chuyển khoản',
      'Phương án xử lý': r.solution || 'Đã hoàn bù lô mới',
      'Ngày xuất trả': r.returnDate,
      'Người lập phiếu': r.staffName || 'Nguyễn Văn Nam (KCS)',
      'Lý do trả hàng': r.reason,
      'Trạng thái': r.status === 'completed' ? 'Đã hoàn tất trả hàng' : 'Bản lưu tạm',
    }));
    exportToExcel(exportData, 'Danh_sach_phieu_tra_hang');
    message.success('Đã xuất danh sách phiếu trả hàng ra file Excel thành công!');
  };

  const handleExportSingleReturnDetail = (r: SupplierReturnSlip) => {
    const exportData = [
      {
        'Mã phiếu trả': r.code,
        'Phiếu nhập gốc': r.sourcePurchaseEntryCode || 'Không liên kết',
        'Mã hàng': r.code,
        'Tên mặt hàng hoàn trả': r.itemName,
        'Quy cách': r.spec || '',
        'Đơn vị tính': r.unit || 'bộ',
        'Số lượng trả': r.quantity,
        'Giá nhập ban đầu (VNĐ)': r.purchasePrice || 0,
        'Giá xuất trả (VNĐ)': r.returnPrice || r.purchasePrice || 0,
        'Tổng tiền hàng trả (VNĐ)': r.totalGoods || r.supplierRefund || 0,
        'Giảm giá / Chiết khấu': r.invoiceDiscount || 0,
        'NCC cần hoàn tiền (VNĐ)': r.supplierRefund || 0,
        'NCC đã hoàn tiền (VNĐ)': r.paidAmount !== undefined ? r.paidAmount : (r.supplierRefund || 0),
        'Nhà cung cấp nhận': r.supplierName,
        'Kho xuất trả': r.warehouseName || '',
        'Ngày xuất trả': r.returnDate,
        'Người lập phiếu': r.staffName || 'Nguyễn Văn Nam (KCS)',
        'Hình thức hoàn tiền': r.paymentMethod || 'Chuyển khoản',
        'Phương án xử lý': r.solution || 'Đã hoàn bù lô mới',
        'Lý do hoàn trả': r.reason,
        'Trạng thái': r.status === 'completed' ? 'Đã hoàn tất trả hàng' : 'Bản lưu tạm',
        'Ghi chú': r.note || '',
      },
    ];
    exportToExcel(exportData, `Chi_tiet_phieu_tra_hang_${r.code.replace(/[^a-zA-Z0-9_-]/g, '')}`);
    message.success(`Đã xuất chi tiết phiếu trả hàng ${r.code} ra file Excel thành công!`);
  };

  const handleExportCreateReturnLinesExcel = () => {
    if (!returnEntryLines || returnEntryLines.length === 0) {
      message.warning('Chưa có mặt hàng nào trong phiếu để xuất Excel!');
      return;
    }
    const totalGoods = returnEntryLines.reduce((sum, item) => sum + (item.total || item.quantity * item.returnPrice), 0);
    const refund = Math.max(0, totalGoods - (returnDiscount || 0));
    const paid = returnPaidAmount !== undefined ? returnPaidAmount : refund;
    const remaining = Math.max(0, refund - paid);

    const exportData = returnEntryLines.map((line, idx) => ({
      'STT': idx + 1,
      'Mã phiếu trả': returnCode || '#TH-2026-NEW',
      'Phiếu nhập gốc': returnSourceCode || 'Không liên kết',
      'Mã hàng': line.code,
      'Tên sản phẩm': line.name,
      'Đơn vị tính': line.unit,
      'Số lượng xuất trả': line.quantity,
      'Đơn giá trả (VNĐ)': line.returnPrice,
      'Thành tiền (VNĐ)': line.total || line.quantity * line.returnPrice,
      'Nhà cung cấp nhận': returnSupplier,
      'Kho xuất trả': returnWarehouse,
      'Người lập phiếu': returnStaffName || 'Nguyễn Văn Nam (KCS)',
      'Ngày xuất trả': returnDate,
      'Tổng tiền hàng trả': totalGoods,
      'Giảm giá hoàn lại': returnDiscount || 0,
      'NCC cần hoàn tiền': refund,
      'NCC đã hoàn tiền': paid,
      'Còn nợ hoàn tiền': remaining,
      'Hình thức hoàn tiền': returnPaymentMethod,
      'Phương án xử lý': returnSolution,
      'Lý do xuất trả': returnReason,
      'Ghi chú phiếu': returnNote || '',
    }));
    exportToExcel(exportData, `Chi_tiet_don_tra_hang_${(returnCode || 'TH').replace(/[^a-zA-Z0-9_-]/g, '')}`);
    message.success(`Đã xuất chi tiết đơn trả hàng ${returnCode} ra file Excel thành công!`);
  };


  const handleCreateSlipSubmit = (values: any) => {
    const chosenIds: string[] = values.selectedItemIds || [];
    let targetItems: StockAuditItem[] = [];

    if (chosenIds.length > 0) {
      targetItems = allAuditableStock.filter((item) => chosenIds.includes(item.id));
    } else {
      if (values.scope === 'lumber') {
        targetItems = allAuditableStock.filter((i) => i.type === 'lumber');
      } else if (values.scope === 'catalog') {
        targetItems = allAuditableStock.filter((i) => i.type === 'product');
      } else {
        targetItems = [...allAuditableStock];
      }
    }

    if (targetItems.length === 0) {
      message.error('Vui lòng chọn ít nhất 1 sản phẩm để kiểm kê!');
      return;
    }

    const initialItems: StockAuditItem[] = targetItems.map((item, idx) => ({
      id: `aud_${Date.now()}_${idx}`,
      code: item.code,
      name: item.name,
      type: item.type,
      location: item.location,
      systemQty: item.systemQty,
      actualQty: values.initMode === 'zero' ? 0 : item.systemQty,
      unit: item.unit,
      systemMc: item.systemMc,
      actualMc: item.actualMc,
      status: values.initMode === 'zero' ? 'pending' : 'matched',
      qualityNote: item.qualityNote,
      checked: values.initMode !== 'zero',
    }));

    const newSlip: AuditSlip = {
      id: 'slip_' + (auditSlips.length + 1),
      code: values.code || `#KK-${new Date().getFullYear()}-${String(auditSlips.length + 1).padStart(2, '0')}`,
      title: values.title,
      createdAt: new Date().toLocaleDateString('vi-VN'),
      creator: values.creator,
      scope: values.scope,
      scopeLabel:
        values.selectedItemIds && values.selectedItemIds.length < allAuditableStock.length
          ? `Tùy chọn (${initialItems.length} mặt hàng)`
          : values.scope === 'lumber'
            ? 'Kho gỗ tự nhiên FAS'
            : values.scope === 'catalog'
              ? 'Danh mục thành phẩm'
              : 'Toàn bộ kho (Phôi gỗ & Thành phẩm)',
      status: 'auditing',
      statusLabel: 'Đang kiểm đếm',
      note: values.note || '',
      items: initialItems,
    };

    setAuditSlips([newSlip, ...auditSlips]);
    setActiveSlipId(newSlip.id);
    setShowCreateSlipModal(false);
    createSlipForm.resetFields();
    message.success(`Đã khởi tạo thành công phiếu kiểm ${newSlip.code} gồm ${initialItems.length} sản phẩm!`);
  };

  const handleAddItemSubmit = (values: any) => {
    const newItem: StockAuditItem = {
      id: 'aud_custom_' + Date.now(),
      code: values.code,
      name: values.name,
      type: values.type,
      location: values.location || 'Khu phôi D-01',
      systemQty: Number(values.systemQty),
      actualQty: Number(values.actualQty),
      unit: values.type === 'lumber' ? 'm³' : 'chiếc',
      systemMc: values.actualMc || '8.5%',
      actualMc: values.actualMc || '8.5%',
      status: Number(values.systemQty) === Number(values.actualQty) ? 'matched' : 'discrepancy',
      qualityNote: values.qualityNote || '',
      checked: true,
    };

    const updatedItems = [newItem, ...activeSlip.items];
    setAuditSlips(auditSlips.map((s) => (s.id === activeSlipId ? { ...s, items: updatedItems } : s)));
    setShowAddItemModal(false);
    addItemForm.resetFields();
    message.success(`Đã thêm dòng ${newItem.name} vào phiếu kiểm!`);
  };



  const handleOpenCreateSupplier = () => {
    setEditingSupplier(null);
    setShowSupplierDrawer(true);
  };

  return (
    <>

          <div className="space-y-4 flex-1 flex flex-col h-full">
            {/* Sub-Tabs Switcher (Domaco Kho Header: 5 Tabs Architecture) */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-none shadow-xs">
              <Segmented
                value={warehouseSubTab}
                onChange={(val: any) => {
                  setWarehouseSubTab(val);
                  setStocktakeViewMode('list');
                  setImportViewMode('list');
                  setReturnViewMode('list');
                }}
                options={[
                  { value: 'warehouses', label: <span className="px-2 py-1 font-medium text-xs sm:text-sm">🏢 Danh sách kho</span> },
                  { value: 'imports', label: <span className="px-2 py-1 font-medium text-xs sm:text-sm">📥 Nhập hàng</span> },
                  { value: 'returns', label: <span className="px-2 py-1 font-medium text-xs sm:text-sm">🔄 Trả hàng</span> },
                  { value: 'stocktake', label: <span className="px-2 py-1 font-medium text-xs sm:text-sm">📋 Kiểm kho</span> },
                  { value: 'suppliers', label: <span className="px-2 py-1 font-medium text-xs sm:text-sm">🏭 Nhà cung cấp</span> },
                ]}
                className="bg-slate-100 p-1 rounded-lg"
              />

              <div className="flex items-center gap-2">
                {warehouseSubTab === 'warehouses' && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleOpenCreateWarehouse}
                    className="h-10 rounded-lg bg-[#784e34] hover:!bg-[#5d371f] px-4 text-sm font-medium text-white shadow-none border-none flex items-center"
                  >
                    Tạo mới kho
                  </Button>
                )}
                {warehouseSubTab === 'imports' && importViewMode === 'list' && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleOpenCreateImport}
                    className="h-10 rounded-lg bg-[#784e34] hover:!bg-[#5d371f] px-4 text-sm font-medium text-white shadow-none border-none flex items-center"
                  >
                    Lập phiếu nhập hàng
                  </Button>
                )}
                {warehouseSubTab === 'returns' && returnViewMode === 'list' && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleOpenCreateReturn}
                    className="h-10 rounded-lg bg-rose-700 hover:!bg-rose-800 px-4 text-sm font-medium text-white shadow-none border-none flex items-center"
                  >
                    Lập phiếu trả hàng
                  </Button>
                )}
                {warehouseSubTab === 'stocktake' && stocktakeViewMode === 'list' && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleOpenCreateStocktake}
                    className="h-10 rounded-lg bg-[#784e34] hover:!bg-[#5d371f] px-4 text-sm font-medium text-white shadow-none border-none flex items-center"
                  >
                    Kiểm kho
                  </Button>
                )}
                {warehouseSubTab === 'suppliers' && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleOpenCreateSupplier}
                    className="h-10 rounded-lg bg-[#784e34] hover:!bg-[#5d371f] px-4 text-sm font-medium text-white shadow-none border-none flex items-center"
                  >
                    Thêm nhà cung cấp
                  </Button>
                )}
              </div>
            </div>

            {/* SUB-TAB 1: DANH SÁCH KHO HÀNG (DOMACO WAREHOUSES MASTER) */}
            {warehouseSubTab === 'warehouses' && (
              <div className="space-y-4">
                {/* 2-Column Layout: Filter Sidebar + Warehouses Table */}
                <div className="flex flex-col lg:flex-row gap-4 items-start">
                  {/* Filter Sidebar */}
                  <aside className="hidden lg:block w-64 shrink-0">
                    <div className="bg-white rounded-none shadow-xs p-4 sticky top-4 space-y-4 text-sm text-slate-700 font-normal">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <span className="font-medium text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <FilterOutlined className="text-[#784e34]" /> Bộ lọc kho
                        </span>
                        {(warehouseStatusFilter !== 'all' || warehouseSearchQuery) && (
                          <button
                            type="button"
                            onClick={() => {
                              setWarehouseSearchQuery('');
                              setWarehouseStatusFilter('all');
                              setSelectedWarehouseKeys([]);
                            }}
                            className="text-xs text-[#784e34] hover:underline font-normal bg-transparent border-none cursor-pointer p-0"
                          >
                            Xóa lọc
                          </button>
                        )}
                      </div>

                      {/* Trạng thái hoạt động */}
                      <div>
                        <div className="mb-2 text-xs font-medium text-slate-700 uppercase tracking-wide">Trạng thái hoạt động</div>
                        <div className="space-y-1">
                          {[
                            { value: 'all', label: 'Tất cả trạng thái', count: warehousesList.length },
                            { value: 'active', label: 'Đang hoạt động', count: warehousesList.filter(w => w.status === 'active').length },
                            { value: 'inactive', label: 'Tạm dừng', count: warehousesList.filter(w => w.status === 'inactive').length },
                          ].map((opt) => {
                            const isSelected = warehouseStatusFilter === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => setWarehouseStatusFilter(opt.value)}
                                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors cursor-pointer border-none ${isSelected
                                    ? 'bg-amber-50/70 font-normal text-[#784e34]'
                                    : 'bg-transparent font-normal text-slate-600 hover:bg-slate-50'
                                  }`}
                              >
                                <span>{opt.label}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${isSelected ? 'bg-[#784e34] text-white font-normal' : 'text-slate-400 bg-slate-100'}`}>
                                  {opt.count}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Summary Card */}
                      <AdminSidebarSummary
                        title="Thống kê kho bãi"
                        className="mt-3"
                        items={[
                          { label: 'Tổng số kho lưu trữ', value: `${warehousesList.length} kho` },
                          { label: 'Đang hoạt động', value: `${warehousesList.filter(w => w.status === 'active').length} kho`, color: 'success' },
                          { label: 'Tạm dừng', value: `${warehousesList.filter(w => w.status === 'inactive').length} kho`, color: 'default' },
                        ]}
                      />
                    </div>
                  </aside>

                  {/* Main Warehouses Table */}
                  <div className="min-w-0 flex-1 w-full">
                    <AdminDataTable
                      enableSelectionToolbar
                      selectedRowKeys={selectedWarehouseKeys}
                      onSelectionChange={(keys) => setSelectedWarehouseKeys(keys)}
                      titleText="Quản lý kho"
                      totalCount={warehousesList.length}
                      countUnit="kho"
                      onCopySelected={handleCopySelectedWarehouse}
                      onEditSelected={handleEditSelectedWarehouse}
                      onDeleteSelected={handleDeleteSelectedWarehouses}
                      deleteConfirmTitle={`Xóa ${selectedWarehouseKeys.length} kho đã chọn?`}
                      onCreateNew={handleOpenCreateWarehouse}
                      createButtonText="Thêm mới"
                      searchValue={warehouseSearchQuery}
                      onSearchChange={(val) => setWarehouseSearchQuery(val)}
                      searchPlaceholder="Tìm theo mã, tên, địa chỉ..."
                      extraHeaderActions={
                        <>
                          <Button
                            icon={<ReloadOutlined />}
                            onClick={() => {
                              setWarehouseSearchQuery('');
                              setWarehouseStatusFilter('all');
                              setSelectedWarehouseKeys([]);
                              message.success('Đã làm mới danh sách kho hàng!');
                            }}
                            className="!h-8 px-2.5 rounded-lg border-slate-300 bg-white text-slate-700 text-xs shadow-xs inline-flex items-center justify-center hover:text-[#784e34]"
                            title="Làm mới"
                          >
                            Làm mới
                          </Button>
                          <Button
                            icon={<DownloadOutlined />}
                            onClick={handleExportWarehousesExcel}
                            className="!h-8 px-2.5 rounded-lg border-slate-300 bg-white text-slate-700 text-xs shadow-xs inline-flex items-center justify-center hover:text-[#784e34]"
                            title="Xuất Excel"
                          >
                            Xuất Excel
                          </Button>
                        </>
                      }
                      dataSource={warehousesList.filter((w) => {
                        const q = warehouseSearchQuery.toLowerCase();
                        const matchSearch =
                          !warehouseSearchQuery ||
                          (w.name || '').toLowerCase().includes(q) ||
                          (w.code || '').toLowerCase().includes(q) ||
                          (w.branch || '').toLowerCase().includes(q) ||
                          (w.streetAddress || '').toLowerCase().includes(q) ||
                          (w.address || '').toLowerCase().includes(q);
                        const matchBranch = !w.branch || isMatchGlobalBranch(w.branch) || isMatchGlobalBranch(w.name);
                        const matchStatus = warehouseStatusFilter === 'all' || w.status === warehouseStatusFilter;
                        return matchSearch && matchBranch && matchStatus;
                      })}
                      rowKey="id"
                      scroll={{ x: 900 }}
                      columns={[
                        {
                          title: 'Mã kho',
                          dataIndex: 'code',
                          key: 'code',
                          width: 140,
                          render: (code, record) => (
                            <div className="flex flex-col items-start gap-1">
                              <span
                                onClick={() => handleOpenEditWarehouse(record)}
                                className="font-mono text-xs font-semibold text-[#784e34] hover:underline cursor-pointer bg-[#784e34]/10 px-2 py-0.5 rounded whitespace-nowrap inline-block"
                              >
                                {code}
                              </span>
                              {record.isDefault ? (
                                <span className="inline-block rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200 whitespace-nowrap">
                                  Mặc định
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
                              <span
                                onClick={() => handleOpenEditWarehouse(record)}
                                className="font-medium text-sm text-slate-900 hover:text-[#784e34] cursor-pointer transition-colors"
                              >
                                {name}
                              </span>
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
                          width: 190,
                          render: (_, w) => (
                            <div>
                              <div className="font-normal text-sm text-slate-700">{w.branch}</div>
                              <span className="text-xs text-slate-400 block mt-0.5 font-normal">Cơ sở trực thuộc</span>
                            </div>
                          ),
                        },
                        {
                          title: 'Địa chỉ',
                          dataIndex: 'address',
                          key: 'address',
                          width: 240,
                          render: (address: string, record) => (
                            <span className="text-xs text-slate-600 block truncate max-w-[240px]">
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
                              <Button
                                icon={<EditOutlined className="text-sm" />}
                                size="small"
                                type="text"
                                onClick={() => handleOpenEditWarehouse(w)}
                                className="text-slate-600 hover:text-[#784e34] hover:bg-slate-100"
                              />
                              <Button
                                icon={<CopyOutlined className="text-sm" />}
                                size="small"
                                type="text"
                                onClick={() => handleCopyWarehouse(w)}
                                className="text-slate-600 hover:text-[#784e34] hover:bg-slate-100"
                              />
                              <Popconfirm
                                title={`Xóa kho "${w.name}"?`}
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
                                />
                              </Popconfirm>
                            </Space>
                          ),
                        },
                      ]}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 2: NHẬP HÀNG HÓA (STOCK IN / IMPORTS - LIST MODE) */}
            {warehouseSubTab === 'imports' && importViewMode === 'list' && (
              <div className="space-y-4">
                {/* Search & Action Bar (Domaco POS Style) */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-none shadow-xs">
                  <div className="flex flex-1 items-center gap-2.5 min-w-[280px] max-w-md">
                    <AdminSearchInput
                      placeholder="Theo mã phiếu nhập, nhà cung cấp, tên hàng hóa, kho tiếp nhận..."
                      value={importSearchQuery}
                      onChange={(val) => setImportSearchQuery(val)}
                    />
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Date Filter (Domaco POS Architecture) */}
                    <PosDateFilter
                      value={importDateRange}
                      onChange={(range) => setImportDateRange(range)}
                    />

                    <Select
                      variant="filled"
                      value={importStatusFilter}
                      onChange={(val) => setImportStatusFilter(val)}
                      className="w-40 h-10 text-sm [&_.ant-select-selector]:!border-0 [&_.ant-select-selector]:!bg-slate-100 hover:[&_.ant-select-selector]:!bg-slate-200/80 [&_.ant-select-selector]:!rounded-lg"
                      options={[
                        { value: 'all', label: 'Tất cả trạng thái' },
                        { value: 'completed', label: 'Đã nhập kho' },
                        { value: 'inspecting', label: 'Đang kiểm KCS' },
                      ]}
                    />
                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      onClick={handleExportImportsExcel}
                      className="h-10 rounded-lg text-sm font-semibold !bg-emerald-600 hover:!bg-emerald-700 !text-white !border-0 shadow-xs flex items-center gap-1.5"
                    >
                      Xuất Excel
                    </Button>
                  </div>
                </div>

                {/* Table of Imports */}
                {(() => {
                  const filteredImports = importsList.filter((imp) => {
                    const matchSearch =
                      !importSearchQuery ||
                      imp.code.toLowerCase().includes(importSearchQuery.toLowerCase()) ||
                      imp.supplier.toLowerCase().includes(importSearchQuery.toLowerCase()) ||
                      imp.warehouseName.toLowerCase().includes(importSearchQuery.toLowerCase()) ||
                      imp.itemName.toLowerCase().includes(importSearchQuery.toLowerCase()) ||
                      imp.inspector.toLowerCase().includes(importSearchQuery.toLowerCase());
                    const matchBranch = isMatchGlobalBranch(imp.warehouseName);
                    const matchStatus = importStatusFilter === 'all' || imp.status === importStatusFilter;
                    const matchDate = checkDateInRange(imp.importDate, importDateRange);
                    return matchSearch && matchBranch && matchStatus && matchDate;
                  });
                  const totalImportGoodsSum = filteredImports.reduce((acc, i) => acc + (i.totalValue || 0), 0);
                  const totalImportPaidSum = filteredImports.reduce((acc, i) => acc + (i.paidAmount !== undefined ? i.paidAmount : i.totalValue), 0);
                  const totalImportDebtSum = filteredImports.reduce((acc, i) => acc + Math.max(0, (i.totalValue || 0) - (i.paidAmount !== undefined ? i.paidAmount : i.totalValue)), 0);

                  return (
                    <div className="space-y-0">
                      {/* Top 1-Line Metric Summary Bar (Domaco POS Style) */}
                      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-50 border border-slate-200 text-xs text-slate-700">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">Tổng cộng:</span>
                          <span className="bg-slate-200/70 text-slate-800 font-mono font-bold px-2 py-0.5 rounded text-[11px]">
                            {filteredImports.length} phiếu
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-5 sm:gap-7">
                          <div>
                            <span className="text-slate-500 mr-1.5">Tổng giá trị nhập:</span>
                            <span className="font-mono font-bold text-[#784e34]">{totalImportGoodsSum.toLocaleString('vi-VN')} đ</span>
                          </div>
                          <div>
                            <span className="text-emerald-600 mr-1.5 font-semibold">Đã thanh toán:</span>
                            <span className="font-mono font-bold text-emerald-700">{totalImportPaidSum.toLocaleString('vi-VN')} đ</span>
                          </div>
                          <div>
                            <span className="text-amber-600 mr-1.5 font-semibold">Còn nợ NCC:</span>
                            <span className="font-mono font-bold text-amber-700">{totalImportDebtSum.toLocaleString('vi-VN')} đ</span>
                          </div>
                        </div>
                      </div>

                      <AdminDataTable
                        dataSource={filteredImports}
                        rowKey="id"
                        scroll={{ x: 1900 }}
                  onRow={(record) => {
                    const isExp = expandedImportRowKeys.includes(record.id);
                    return {
                      onClick: () => {
                        setExpandedImportRowKeys(isExp ? [] : [record.id]);
                        if (!isExp && !importRowTabs[record.id]) {
                          setImportRowTabs((prev) => ({ ...prev, [record.id]: 'items' }));
                        }
                      },
                      className: `cursor-pointer transition-colors ${isExp ? '!bg-[#784e34]/10 font-medium' : 'hover:!bg-[#784e34]/5'}`,
                    };
                  }}
                  expandable={{
                    expandedRowKeys: expandedImportRowKeys,
                    onExpand: (expanded, record) => {
                      setExpandedImportRowKeys(expanded ? [record.id] : []);
                      if (expanded && !importRowTabs[record.id]) {
                        setImportRowTabs((prev) => ({ ...prev, [record.id]: 'items' }));
                      }
                    },
                    expandedRowRender: (imp) => {
                      const currentTab = importRowTabs[imp.id] || 'items';
                      const setTab = (t: 'items' | 'info') => {
                        setImportRowTabs((prev) => ({ ...prev, [imp.id]: t }));
                      };
                      return (
                        <div className="bg-slate-50/80 border border-slate-200 rounded-xl overflow-hidden my-1.5 shadow-xs">
                          {/* 1. Dedicated Tabs Strip (Domaco POS Style) */}
                          <div className="flex items-center gap-6 border-b border-slate-200 px-5 pt-2.5 bg-white overflow-x-auto">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setTab('items'); }}
                              className={`border-b-2 px-1 pb-2 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                                currentTab === 'items'
                                  ? 'border-[#784e34] text-[#784e34]'
                                  : 'border-transparent text-slate-600 hover:text-slate-950'
                              }`}
                            >
                              Hàng hóa (1)
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setTab('info'); }}
                              className={`border-b-2 px-1 pb-2 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                                currentTab === 'info'
                                  ? 'border-[#784e34] text-[#784e34]'
                                  : 'border-transparent text-slate-600 hover:text-slate-950'
                              }`}
                            >
                              Thông tin phiếu nhập
                            </button>
                          </div>

                          {/* 2. Tab Body */}
                          <div className="p-4 space-y-4">
                            {currentTab === 'items' && (
                              <div className="space-y-3">
                                {/* Product items table */}
                                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                                  <table className="min-w-full text-xs">
                                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                                      <tr>
                                        <th className="px-3 py-2 text-center w-10">STT</th>
                                        <th className="px-3 py-2 text-left w-32">Mã phiếu</th>
                                        <th className="px-3 py-2 text-left">Tên sản phẩm</th>
                                        <th className="px-3 py-2 text-center w-20">ĐVT</th>
                                        <th className="px-3 py-2 text-right w-24">Số lượng</th>
                                        <th className="px-3 py-2 text-right w-32">Đơn giá nhập</th>
                                        <th className="px-3 py-2 text-right w-36">Thành tiền</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      <tr className="hover:bg-slate-50/50">
                                        <td className="px-3 py-2.5 text-center text-slate-400 font-mono">1</td>
                                        <td className="px-3 py-2.5 font-mono text-[#784e34] font-medium">{imp.code}</td>
                                        <td className="px-3 py-2.5 font-medium text-slate-900">
                                          <div>{imp.itemName}</div>
                                        </td>
                                        <td className="px-3 py-2.5 text-center text-slate-600">{imp.unit}</td>
                                        <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">{imp.quantity}</td>
                                        <td className="px-3 py-2.5 text-right font-mono text-slate-700">{(imp.unitPrice || 0).toLocaleString('vi-VN')} đ</td>
                                        <td className="px-3 py-2.5 text-right font-mono font-bold text-[#784e34]">{(imp.totalValue || 0).toLocaleString('vi-VN')} đ</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>

                                {/* Financial Summary Box (Domaco POS Style) */}
                                <div className="rounded-xl border border-slate-200 bg-white p-4">
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                    <div>
                                      <div className="text-[11px] text-slate-500 mb-0.5">Tổng tiền hàng</div>
                                      <div className="font-bold text-slate-900 text-sm font-mono">{(imp.totalValue || 0).toLocaleString('vi-VN')} đ</div>
                                    </div>
                                    <div>
                                      <div className="text-[11px] text-slate-500 mb-0.5">Đã thanh toán cho NCC</div>
                                      <div className="font-bold text-emerald-700 text-sm font-mono">{(imp.paidAmount !== undefined ? imp.paidAmount : imp.totalValue).toLocaleString('vi-VN')} đ</div>
                                    </div>
                                    <div>
                                      <div className="text-[11px] text-slate-500 mb-0.5">Còn nợ lại NCC</div>
                                      <div className="font-bold text-rose-600 text-sm font-mono">
                                        {Math.max(0, (imp.totalValue || 0) - (imp.paidAmount !== undefined ? imp.paidAmount : imp.totalValue)).toLocaleString('vi-VN')} đ
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-[11px] text-slate-500 mb-0.5">Hình thức thanh toán</div>
                                      <div className="font-semibold text-slate-800">{imp.paymentMethod || 'Chuyển khoản'}</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {currentTab === 'info' && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 text-xs">
                                <div>
                                  <span className="text-slate-400 block text-[11px]">Mã phiếu nhập:</span>
                                  <span className="font-mono font-bold text-slate-800">{imp.code}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[11px]">Thời gian nhập kho:</span>
                                  <span className="font-mono font-medium text-slate-800">{imp.importDate}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[11px]">Kho tiếp nhận:</span>
                                  <span className="font-bold text-[#784e34]">{imp.warehouseName}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[11px]">Nhà cung cấp:</span>
                                  <span className="font-semibold text-slate-800">{imp.supplier}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[11px]">Người tiếp nhận &amp; KCS:</span>
                                  <span className="font-medium text-slate-800">{imp.inspector}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[11px]">Số hóa đơn VAT:</span>
                                  <span className="font-mono font-medium text-slate-800">{imp.invoiceNumber || 'Chưa kèm hóa đơn'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[11px]">Trạng thái:</span>
                                  <span className="font-medium text-slate-800">{imp.status === 'draft' ? 'Bản lưu tạm' : 'Đã nhập kho'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[11px]">Ghi chú:</span>
                                  <span className="text-slate-700 italic">{imp.note || 'Không có'}</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 3. Footer Bar with Domaco POS Action Buttons */}
                          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-white border-t border-slate-200">
                            <Button
                              size="small"
                              icon={<UpOutlined />}
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedImportRowKeys((prev) => prev.filter((k) => k !== imp.id));
                              }}
                              className="h-8 rounded-lg border-slate-300 px-3 text-xs font-medium text-slate-700 hover:!border-slate-400"
                            >
                              Thu gọn
                            </Button>
                            <div className="flex items-center gap-2">
                              <Button
                                size="small"
                                icon={<FileExcelOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleExportSingleImportDetail(imp);
                                }}
                                className="h-8 rounded-lg border-emerald-600 text-emerald-700 bg-emerald-50/50 hover:!bg-emerald-100 hover:!border-emerald-700 px-3.5 text-xs font-semibold"
                              >
                                Xuất Excel
                              </Button>
                              <Button
                                size="small"
                                icon={<PrinterOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedImportSlipForPrint(imp);
                                }}
                                className="h-8 rounded-lg border-slate-300 px-3.5 text-xs font-semibold text-slate-700 hover:!border-[#784e34] hover:!text-[#784e34]"
                              >
                                In phiếu nhập
                              </Button>
                              <Popconfirm
                                title={`Xóa phiếu nhập ${imp.code}?`}
                                description="Hành động này không thể hoàn tác."
                                onConfirm={(e) => {
                                  e?.stopPropagation();
                                  handleDeleteImport(imp.id, imp.code);
                                }}
                                okText="Xóa"
                                cancelText="Hủy"
                                okButtonProps={{ danger: true }}
                              >
                                <Button
                                  danger
                                  size="small"
                                  icon={<DeleteOutlined />}
                                  onClick={(e) => e.stopPropagation()}
                                  className="h-8 rounded-lg px-3.5 text-xs font-semibold"
                                >
                                  Xóa phiếu
                                </Button>
                              </Popconfirm>
                            </div>
                          </div>
                        </div>
                      );
                    },
                  }}
                  columns={[
                    {
                      title: 'Mã phiếu nhập',
                      dataIndex: 'code',
                      key: 'code',
                      width: 170,
                      render: (code) => (
                        <span className="font-mono text-xs font-normal text-[#784e34] bg-[#784e34]/10 px-2.5 py-1 rounded whitespace-nowrap inline-block">
                          {code}
                        </span>
                      ),
                    },
                    {
                      title: 'Kho tiếp nhận',
                      dataIndex: 'warehouseName',
                      key: 'warehouseName',
                      width: 240,
                      render: (wh) => (
                        <span className="font-normal text-sm text-slate-800 leading-tight block">
                          {wh}
                        </span>
                      ),
                    },
                    {
                      title: 'Nhà cung cấp',
                      dataIndex: 'supplier',
                      key: 'supplier',
                      width: 240,
                      render: (sup) => (
                        <div>
                          <span className="font-normal text-sm text-slate-700">{sup}</span>
                        </div>
                      ),
                    },
                    {
                      title: 'Tên hàng hóa',
                      key: 'item',
                      width: 280,
                      render: (_, r) => (
                        <div className="font-normal text-sm text-slate-800 leading-snug">{r.itemName}</div>
                      ),
                    },
                    {
                      title: 'Số lượng',
                      key: 'qty',
                      width: 120,
                      align: 'right',
                      render: (_, r) => (
                        <span className="font-mono font-normal text-sm text-slate-800 whitespace-nowrap">
                          {r.quantity} {r.unit}
                        </span>
                      ),
                    },
                    {
                      title: 'Đơn giá nhập',
                      dataIndex: 'unitPrice',
                      key: 'unitPrice',
                      width: 140,
                      align: 'right',
                      render: (price) => (
                        <span className="font-mono font-normal text-xs text-slate-700 whitespace-nowrap">
                          {(price || 0).toLocaleString('vi-VN')} đ
                        </span>
                      ),
                    },
                    {
                      title: 'Tổng giá trị nhập',
                      dataIndex: 'totalValue',
                      key: 'totalValue',
                      width: 160,
                      align: 'right',
                      render: (val) => (
                        <span className="font-mono font-normal text-sm text-[#784e34] whitespace-nowrap">
                          {(val || 0).toLocaleString('vi-VN')} đ
                        </span>
                      ),
                    },
                    {
                      title: 'Thời gian & KCS',
                      key: 'inspector',
                      width: 180,
                      render: (_, r) => (
                        <div>
                          <div className="font-mono text-xs text-slate-600 font-normal whitespace-nowrap">{r.importDate}</div>
                          <div className="text-xs text-slate-500 mt-0.5 font-normal">{r.inspector}</div>
                        </div>
                      ),
                    },
                    {
                      title: 'Trạng thái',
                      dataIndex: 'status',
                      key: 'status',
                      width: 140,
                      align: 'center',
                      render: (s, r) => (
                        <Tag color={r.status === 'draft' ? 'gold' : 'green'} className="font-normal text-xs px-2.5 py-0.5 whitespace-nowrap">
                          {r.status === 'draft' ? '📝 Lưu tạm' : `✓ ${r.statusLabel || 'Đã nhập kho'}`}
                        </Tag>
                      ),
                    },
                    {
                      title: 'Thao tác',
                      key: 'actions',
                      width: 85,
                      align: 'center',
                      render: (_, r) => (
                        <Space size={2} onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="small"
                            type="text"
                            icon={<PrinterOutlined className="text-slate-500 hover:text-[#784e34]" />}
                            onClick={() => setSelectedImportSlipForPrint(r)}
                            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-slate-100"
                          />
                          <Popconfirm
                            title={`Xóa phiếu nhập ${r.code}?`}
                            description="Hành động này không thể hoàn tác."
                            onConfirm={() => handleDeleteImport(r.id, r.code)}
                            okText="Xóa"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true }}
                          >
                            <Button
                              size="small"
                              type="text"
                              danger
                              icon={<DeleteOutlined className="text-rose-500 hover:text-rose-700" />}
                              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-rose-50"
                            />
                          </Popconfirm>
                        </Space>
                      ),
                    },
                  ]}
                />
              </div>
            );
          })()}
              </div>
            )}

            {/* SUB-TAB 2 (ENTRY MODE): GIAO DIỆN LẬP PHIẾU NHẬP HÀNG CHUẨN DOMACO POS */}
            {warehouseSubTab === 'imports' && importViewMode === 'create' && (
              <div className="space-y-4">
                {/* Header Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-none shadow-xs border border-slate-200">
                  <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                    <Button
                      icon={<ArrowLeftOutlined />}
                      onClick={() => setImportViewMode('list')}
                      className="h-9 w-9 rounded-lg text-slate-700 hover:!bg-slate-100 hover:!text-[#784e34] flex items-center justify-center"
                      title="Quay lại danh sách phiếu nhập (giữ nháp)"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h1 className="m-0 shrink-0 text-sm font-bold text-slate-950">
                          Lập Phiếu Nhập Hàng
                        </h1>
                        <span className="font-mono text-xs font-bold text-[#784e34] bg-[#784e34]/10 px-2 py-0.5 rounded">
                          {importCode || '#PN-2026-NEW'}
                        </span>
                      </div>
                    </div>

                    {/* Product Search Input with Dropdown Popover */}
                    <div className="relative min-w-0 max-w-[500px] flex-1">
                      <AdminSearchInput
                        placeholder="Tìm hàng hóa theo tên sản phẩm, mã SKU, bộ sưu tập (F3)..."
                        value={importSearchProduct}
                        onChange={(val) => {
                          setImportSearchProduct(val);
                          setShowImportProductPopover(val.trim().length > 0);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') setShowImportProductPopover(false);
                        }}
                        sizeVariant="sm"
                      />

                      {showImportProductPopover && importSearchProduct.trim() !== '' && (
                        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-2xl">
                          <div className="flex items-center justify-between px-2 py-1 mb-1 border-b border-slate-100 text-[11px] text-slate-500 font-medium">
                            <span>Kết quả tìm kiếm cho &quot;{importSearchProduct}&quot;</span>
                            <button
                              type="button"
                              onClick={() => setShowImportProductPopover(false)}
                              className="text-slate-400 hover:text-slate-700 border-none bg-transparent cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                          {catalogList
                            .filter(
                              (p) =>
                                p.name.toLowerCase().includes(importSearchProduct.toLowerCase()) ||
                                p.code.toLowerCase().includes(importSearchProduct.toLowerCase()) ||
                                (p.collection && p.collection.toLowerCase().includes(importSearchProduct.toLowerCase()))
                            )
                            .map((product) => {
                              const alreadyAdded = importEntryLines.some((l) => l.code === product.code || l.id === product.id);
                              return (
                                <button
                                  key={product.id || product.code}
                                  type="button"
                                  onClick={() => {
                                    if (!alreadyAdded) {
                                      const defaultUnit = product.name.toLowerCase().includes('sofa') || product.name.toLowerCase().includes('bàn') ? 'bộ' : 'chiếc';
                                      setImportEntryLines((prev) => [
                                        ...prev,
                                        {
                                          id: `line_${Date.now()}_${product.id}`,
                                          code: product.code,
                                          name: product.name,
                                          spec: product.collection || '',
                                          unit: defaultUnit,
                                          quantity: 1,
                                          unitPrice: product.price || 0,
                                          discount: 0,
                                          total: product.price || 0,
                                        },
                                      ]);
                                      message.success(`Đã thêm ${product.name} vào phiếu nhập!`);
                                    } else {
                                      setImportEntryLines((prev) =>
                                        prev.map((l) =>
                                          l.code === product.code || l.id === product.id
                                            ? { ...l, quantity: l.quantity + 1, total: (l.quantity + 1) * l.unitPrice }
                                            : l
                                        )
                                      );
                                      message.info(`Đã tăng số lượng ${product.name} (+1)!`);
                                    }
                                    setImportSearchProduct('');
                                    setShowImportProductPopover(false);
                                  }}
                                  className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg p-2 text-left transition-colors border-none bg-transparent ${
                                    alreadyAdded ? 'bg-amber-50/50' : 'hover:bg-slate-50'
                                  }`}
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="truncate text-xs font-medium text-slate-900">
                                      <span className="font-mono text-[#784e34] mr-1.5">{product.code}</span>
                                      {product.name}
                                    </div>
                                    <div className="text-[11px] text-slate-500">
                                      {product.collection || 'Nội thất xuất khẩu'} • Giá niêm yết: {(product.price || 0).toLocaleString('vi-VN')} đ
                                    </div>
                                  </div>
                                  <div className="shrink-0 text-right">
                                    <span className="text-xs font-bold text-[#784e34]">
                                      {(product.price || 0).toLocaleString('vi-VN')} đ
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {importEntryLines.length > 0 && (
                      <>
                        <Button
                          size="small"
                          icon={<FileExcelOutlined />}
                          onClick={handleExportCreateImportLinesExcel}
                          className="h-9 px-3 text-xs font-medium rounded-lg border-emerald-600 text-emerald-700 bg-emerald-50/50 hover:!bg-emerald-100 hover:!border-emerald-700"
                        >
                          Xuất Excel chi tiết
                        </Button>
                        <Popconfirm
                          title="Xóa tất cả các mặt hàng đã chọn?"
                          onConfirm={() => {
                            setImportEntryLines([]);
                            message.info('Đã xóa danh sách mặt hàng!');
                          }}
                          okText="Xóa hết"
                          cancelText="Hủy"
                          okButtonProps={{ danger: true }}
                        >
                          <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            className="h-9 px-3 text-xs font-medium rounded-lg"
                          >
                            Xóa trắng ({importEntryLines.length})
                          </Button>
                        </Popconfirm>
                      </>
                    )}
                  </div>
                </div>

                {/* 2-Column Domaco POS Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                  {/* Left Column: Line Items Table (col-span-8) */}
                  <div className="lg:col-span-8 bg-white p-4 rounded-none shadow-xs border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                      <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <span>Danh sách hàng hóa nhập kho</span>
                        <span className="bg-[#784e34]/10 text-[#784e34] px-2 py-0.5 rounded-full font-mono text-[11px]">
                          {importEntryLines.length} mặt hàng
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        Tổng SL: <strong className="text-slate-900 font-mono">{importEntryLines.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)}</strong>
                      </div>
                    </div>

                    {importEntryLines.length === 0 ? (
                      /* Domaco POS Empty State */
                      <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50/50 rounded-lg border border-dashed border-slate-300">
                        <div className="w-12 h-12 rounded-full bg-[#784e34]/10 text-[#784e34] flex items-center justify-center text-2xl mb-3">
                          📥
                        </div>
                        <div className="mb-1 text-sm font-medium text-slate-900">
                          Chưa có sản phẩm nào trong phiếu nhập
                        </div>
                        <p className="text-xs text-slate-500 max-w-sm">
                          Tìm kiếm hàng hóa theo mã SKU hoặc tên sản phẩm ở ô tìm kiếm phía trên (F3) để thêm vào phiếu nhập.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="overflow-x-auto rounded-lg border border-slate-200">
                          <table className="min-w-full text-xs">
                            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                              <tr>
                                <th className="px-3 py-2.5 text-center w-10">STT</th>
                                <th className="px-3 py-2.5 text-left w-28">Mã hàng</th>
                                <th className="px-3 py-2.5 text-left">Tên sản phẩm</th>
                                <th className="px-3 py-2.5 text-center w-20">ĐVT</th>
                                <th className="px-3 py-2.5 text-right w-24">Số lượng</th>
                                <th className="px-3 py-2.5 text-right w-36">Đơn giá nhập</th>
                                <th className="px-3 py-2.5 text-right w-36">Thành tiền</th>
                                <th className="px-3 py-2.5 text-center w-12">Xóa</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {importEntryLines.map((line, idx) => (
                                <tr key={line.id} className="hover:bg-amber-50/20 transition-colors">
                                  <td className="px-3 py-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                                  <td className="px-3 py-2 font-mono font-medium text-[#784e34]">{line.code}</td>
                                  <td className="px-3 py-2.5 font-medium text-slate-900">
                                    {line.name}
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <Select
                                      value={line.unit}
                                      onChange={(u) => {
                                        setImportEntryLines((prev) =>
                                          prev.map((l) => (l.id === line.id ? { ...l, unit: u } : l))
                                        );
                                      }}
                                      className="h-7 text-xs w-20"
                                      options={[
                                        { value: 'bộ', label: 'Bộ' },
                                        { value: 'chiếc', label: 'Chiếc' },
                                        { value: 'cái', label: 'Cái' },
                                        { value: 'sản phẩm', label: 'Sản phẩm' },
                                        { value: 'hộp', label: 'Hộp' },
                                        { value: 'thùng', label: 'Thùng' },
                                      ]}
                                    />
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    <InputNumber
                                      min={1}
                                      step={1}
                                      value={line.quantity}
                                      onChange={(q) => {
                                        const numQ = Number(q) || 1;
                                        setImportEntryLines((prev) =>
                                          prev.map((l) =>
                                            l.id === line.id
                                              ? { ...l, quantity: numQ, total: numQ * l.unitPrice }
                                              : l
                                          )
                                        );
                                      }}
                                      className="w-20 h-7 text-xs font-mono font-bold"
                                    />
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    <InputNumber
                                      min={0}
                                      value={line.unitPrice}
                                      formatter={(val) => (val !== undefined && val !== null ? `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '')}
                                      parser={(val) => (val ? Number(val.replace(/\$\s?|(,*)/g, '')) : 0) as any}
                                      onChange={(p) => {
                                        const numP = Number(p) || 0;
                                        setImportEntryLines((prev) =>
                                          prev.map((l) =>
                                            l.id === line.id
                                              ? { ...l, unitPrice: numP, total: line.quantity * numP }
                                              : l
                                          )
                                        );
                                      }}
                                      className="w-32 h-7 text-xs font-mono font-bold [&_input]:!text-right"
                                    />
                                  </td>
                                  <td className="px-3 py-2 text-right font-mono font-bold text-[#784e34]">
                                    {(line.total || line.quantity * line.unitPrice).toLocaleString('vi-VN')} đ
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <Button
                                      size="small"
                                      type="text"
                                      danger
                                      icon={<DeleteOutlined className="text-slate-400 hover:text-red-600" />}
                                      onClick={() => {
                                        setImportEntryLines((prev) => prev.filter((l) => l.id !== line.id));
                                      }}
                                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-50"
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="flex items-center justify-end pt-2">
                          <span className="text-xs text-slate-500">
                            Tổng cộng: <strong className="text-sm font-mono text-[#784e34] font-bold">
                              {importEntryLines.reduce((sum, item) => sum + (item.total || (item.quantity * item.unitPrice)), 0).toLocaleString('vi-VN')} đ
                            </strong>
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Right Column: Metadata & Financial Calculation Sidebar (col-span-4) */}
                  <div className="lg:col-span-4 bg-white p-4 rounded-none shadow-xs border border-slate-200 space-y-4">
                    {/* Meta Header Box */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Avatar size="small" icon={<UserOutlined />} className="bg-[#784e34]" />
                        <div>
                          <div className="text-xs font-bold text-slate-900">{importInspector || user?.name || 'Nguyễn Văn Nam (KCS)'}</div>
                          <div className="text-[11px] text-slate-400">Người lập phiếu / KCS</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-mono font-medium text-slate-700">{importDate || new Date().toLocaleDateString('vi-VN')}</div>
                        <div className="text-[11px] text-slate-400">Thời gian tạo</div>
                      </div>
                    </div>

                    {/* Basic Form Controls */}
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-slate-800">Nhà cung cấp đối tác</label>
                          <button
                            type="button"
                            onClick={handleOpenCreateSupplier}
                            className="text-[11px] font-medium text-[#784e34] hover:underline bg-transparent border-none cursor-pointer"
                          >
                            + Thêm NCC
                          </button>
                        </div>
                        <Select
                          value={importSupplier}
                          onChange={(val) => setImportSupplier(val)}
                          placeholder="Chọn nhà cung cấp..."
                          className="w-full h-9 text-xs"
                          showSearch
                          optionFilterProp="children"
                          allowClear
                        >
                          {suppliersList.map((s) => (
                            <Option key={s.id} value={s.name}>
                              {s.name} ({s.code})
                            </Option>
                          ))}
                        </Select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-800 block mb-1">Kho tiếp nhận lưu trữ</label>
                        <Select
                          value={importWarehouse}
                          onChange={(val) => setImportWarehouse(val)}
                          placeholder="Chọn kho tiếp nhận..."
                          className="w-full h-9 text-xs"
                          showSearch
                          optionFilterProp="children"
                        >
                          {warehousesList.map((w) => (
                            <Option key={w.id} value={w.name}>
                              {w.name} ({w.branch})
                            </Option>
                          ))}
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-semibold text-slate-800 block mb-1">Số hóa đơn VAT / Phiếu giao</label>
                          <Input
                            value={importInvoiceNumber}
                            onChange={(e) => setImportInvoiceNumber(e.target.value)}
                            placeholder="VD: HD-2026/089"
                            className="h-8 text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-800 block mb-1">Người phụ trách KCS</label>
                          <Input
                            value={importInspector}
                            onChange={(e) => setImportInspector(e.target.value)}
                            placeholder="VD: Nguyễn Văn Nam"
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Financial Calculations Box (Domaco POS Architecture) */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5 text-xs">
                      {(() => {
                        const totalGoods = importEntryLines.reduce((sum, item) => sum + (item.total || (item.quantity * item.unitPrice)), 0);
                        const payable = Math.max(0, totalGoods - (importDiscount || 0));
                        const paid = importPaidAmount !== undefined ? Number(importPaidAmount) : payable;
                        const debt = Math.max(0, payable - paid);

                        return (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-600 font-medium">Tổng tiền hàng ({importEntryLines.length} món)</span>
                              <span className="font-mono font-bold text-slate-900">{totalGoods.toLocaleString('vi-VN')} đ</span>
                            </div>

                            <div className="flex items-center justify-between gap-2">
                              <span className="text-slate-600 font-medium shrink-0">Giảm giá / Chiết khấu</span>
                              <InputNumber
                                min={0}
                                value={importDiscount}
                                formatter={(val) => (val !== undefined && val !== null ? `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '')}
                                parser={(val) => (val ? Number(val.replace(/\$\s?|(,*)/g, '')) : 0) as any}
                                onChange={(val) => setImportDiscount(Number(val) || 0)}
                                className="w-36 h-7 text-xs font-mono [&_input]:!text-right"
                              />
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                              <span className="font-bold text-slate-900 text-xs">Cần trả nhà cung cấp</span>
                              <span className="font-mono font-bold text-[#784e34] text-sm">{payable.toLocaleString('vi-VN')} đ</span>
                            </div>

                            <div className="flex items-center justify-between gap-2">
                              <span className="text-slate-700 font-semibold shrink-0">Tiền trả nhà cung cấp</span>
                              <InputNumber
                                min={0}
                                placeholder={payable.toLocaleString('vi-VN')}
                                value={importPaidAmount}
                                formatter={(val) => (val !== undefined && val !== null ? `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '')}
                                parser={(val) => (val ? Number(val.replace(/\$\s?|(,*)/g, '')) : 0) as any}
                                onChange={(val) => setImportPaidAmount(val !== null && val !== undefined ? Number(val) : undefined)}
                                className="w-36 h-7 text-xs font-mono font-bold text-emerald-700 [&_input]:!text-right"
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-slate-600 font-medium">Tính vào công nợ NCC</span>
                              <span className={`font-mono font-bold ${debt > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                                {debt > 0 ? `-${debt.toLocaleString('vi-VN')} đ` : '0 đ'}
                              </span>
                            </div>

                            <div className="pt-2 border-t border-slate-200">
                              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Hình thức thanh toán</label>
                              <Select
                                value={importPaymentMethod}
                                onChange={(m) => setImportPaymentMethod(m)}
                                className="w-full h-8 text-xs"
                                options={[
                                  { value: 'Chuyển khoản', label: 'Chuyển khoản MBBank / QR' },
                                  { value: 'Tiền mặt', label: 'Tiền mặt' },
                                  { value: 'Chưa thanh toán', label: 'Chưa thanh toán (Ghi nợ NCC)' },
                                ]}
                              />
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {/* Note */}
                    <div>
                      <label className="text-xs font-semibold text-slate-800 block mb-1">Ghi chú phiếu nhập / Vị trí xếp kho</label>
                      <Input.TextArea
                        value={importNote}
                        onChange={(e) => setImportNote(e.target.value)}
                        placeholder="VD: Xếp tại Kệ B2 - Showroom Thảo Điền, hàng nguyên đai nguyên kiện..."
                        rows={2}
                        className="text-xs rounded-lg"
                      />
                    </div>

                    {/* Sticky Bottom Actions */}
                    <div className="pt-3 border-t border-slate-200 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => setImportViewMode('list')}
                          className="h-10 text-xs font-semibold rounded-lg text-slate-700 hover:!border-slate-400"
                        >
                          Bỏ qua (Giữ nháp)
                        </Button>
                        <Button
                          onClick={() => handleSaveImportSlip('draft')}
                          className="h-10 text-xs font-bold rounded-lg border-amber-400 text-amber-800 bg-amber-50 hover:!bg-amber-100"
                        >
                          📝 Lưu tạm
                        </Button>
                      </div>
                      <Button
                        type="primary"
                        onClick={() => handleSaveImportSlip('completed')}
                        className="w-full h-11 text-xs font-bold rounded-lg bg-[#784e34] hover:!bg-[#5d371f] text-white border-none shadow-sm"
                      >
                        ✓ Xác nhận nhập kho
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB: TRẢ HÀNG CHO NHÀ CUNG CẤP (DOMACO POS PURCHASE RETURNS - LIST MODE) */}
            {warehouseSubTab === 'returns' && returnViewMode === 'list' && (
              <div className="space-y-4">
                {/* Search & Action Bar (Domaco POS Style) */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-none shadow-xs">
                  <div className="flex flex-1 items-center gap-2.5 min-w-[280px] max-w-md">
                    <AdminSearchInput
                      placeholder="Theo mã phiếu trả (#TH-), mã nhập hàng (#PN-), NCC, mặt hàng hoàn trả..."
                      value={returnSearchQuery}
                      onChange={(val) => setReturnSearchQuery(val)}
                    />
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Date Filter (Domaco POS Architecture) */}
                    <PosDateFilter
                      value={returnDateRange}
                      onChange={(range) => setReturnDateRange(range)}
                    />

                    <Select
                      variant="filled"
                      value={returnStatusFilter}
                      onChange={(val) => setReturnStatusFilter(val)}
                      className="w-44 h-10 text-sm [&_.ant-select-selector]:!border-0 [&_.ant-select-selector]:!bg-slate-100 hover:[&_.ant-select-selector]:!bg-slate-200/80 [&_.ant-select-selector]:!rounded-lg"
                      options={[
                        { value: 'all', label: 'Tất cả trạng thái' },
                        { value: 'completed', label: 'Đã trả hàng' },
                        { value: 'draft', label: 'Phiếu tạm' },
                      ]}
                    />
                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      onClick={handleExportReturnsExcel}
                      className="h-10 rounded-lg text-sm font-semibold !bg-emerald-600 hover:!bg-emerald-700 !text-white !border-0 shadow-xs flex items-center gap-1.5"
                    >
                      Xuất Excel
                    </Button>
                  </div>
                </div>

                {/* Summary Metrics Bar (Domaco POS Style) */}
                {(() => {
                  const filteredReturns = supplierReturnsList.filter((ret) => {
                    const matchSearch =
                      !returnSearchQuery ||
                      ret.code.toLowerCase().includes(returnSearchQuery.toLowerCase()) ||
                      (ret.sourcePurchaseEntryCode && ret.sourcePurchaseEntryCode.toLowerCase().includes(returnSearchQuery.toLowerCase())) ||
                      ret.supplierName.toLowerCase().includes(returnSearchQuery.toLowerCase()) ||
                      ret.itemName.toLowerCase().includes(returnSearchQuery.toLowerCase()) ||
                      (ret.warehouseName && ret.warehouseName.toLowerCase().includes(returnSearchQuery.toLowerCase())) ||
                      (ret.reason && ret.reason.toLowerCase().includes(returnSearchQuery.toLowerCase()));
                    const matchBranch = isMatchGlobalBranch(ret.warehouseName);
                    const matchStatus = returnStatusFilter === 'all' || ret.status === returnStatusFilter;
                    const matchDate = checkDateInRange(ret.returnDate, returnDateRange);
                    return matchSearch && matchBranch && matchStatus && matchDate;
                  });
                  const totalGoodsSum = filteredReturns.reduce((acc, r) => acc + (r.totalGoods || 0), 0);
                  const totalDiscountSum = filteredReturns.reduce((acc, r) => acc + (r.invoiceDiscount || 0), 0);
                  const totalRefundSum = filteredReturns.reduce((acc, r) => acc + (r.supplierRefund || 0), 0);
                  const totalPaidSum = filteredReturns.reduce((acc, r) => acc + (r.paidAmount || 0), 0);

                  return (
                    <div className="space-y-0">
                      {/* Top 1-Line Metric Summary Bar (Domaco POS Style) */}
                      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-50 border border-slate-200 text-xs text-slate-700">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">Tổng cộng:</span>
                          <span className="bg-slate-200/70 text-slate-800 font-mono font-bold px-2 py-0.5 rounded text-[11px]">
                            {filteredReturns.length} phiếu
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-5 sm:gap-7">
                          <div>
                            <span className="text-slate-500 mr-1.5">Tổng tiền hàng:</span>
                            <span className="font-mono font-bold text-slate-900">{totalGoodsSum.toLocaleString('vi-VN')} đ</span>
                          </div>
                          <div>
                            <span className="text-slate-500 mr-1.5">Giảm giá:</span>
                            <span className="font-mono font-medium text-slate-600">{totalDiscountSum.toLocaleString('vi-VN')} đ</span>
                          </div>
                          <div>
                            <span className="text-rose-600 mr-1.5 font-semibold">NCC cần trả:</span>
                            <span className="font-mono font-bold text-rose-700">{totalRefundSum.toLocaleString('vi-VN')} đ</span>
                          </div>
                          <div>
                            <span className="text-emerald-600 mr-1.5 font-semibold">NCC đã trả:</span>
                            <span className="font-mono font-bold text-emerald-700">{totalPaidSum.toLocaleString('vi-VN')} đ</span>
                          </div>
                        </div>
                      </div>

                      <AdminDataTable
                        dataSource={filteredReturns}
                        rowKey="id"
                        scroll={{ x: 2200 }}
                        onRow={(record) => {
                          const isExp = expandedReturnRowKeys.includes(record.id);
                          return {
                            onClick: () => {
                              setExpandedReturnRowKeys(isExp ? [] : [record.id]);
                              if (!isExp && !returnRowTabs[record.id]) {
                                setReturnRowTabs((prev) => ({ ...prev, [record.id]: 'items' }));
                              }
                            },
                            className: `cursor-pointer transition-colors ${isExp ? '!bg-[#784e34]/10 font-medium' : 'hover:!bg-[#784e34]/5'}`,
                          };
                        }}
                        expandable={{
                          expandedRowKeys: expandedReturnRowKeys,
                          onExpand: (expanded, record) => {
                            setExpandedReturnRowKeys(expanded ? [record.id] : []);
                            if (expanded && !returnRowTabs[record.id]) {
                              setReturnRowTabs((prev) => ({ ...prev, [record.id]: 'items' }));
                            }
                          },
                          expandedRowRender: (ret) => {
                            const currentTab = returnRowTabs[ret.id] || 'items';
                            const setTab = (t: 'items' | 'info') => {
                              setReturnRowTabs((prev) => ({ ...prev, [ret.id]: t }));
                            };
                            return (
                              <div className="bg-slate-50/80 border border-slate-200 rounded-xl overflow-hidden my-1.5 shadow-xs">
                                {/* 1. Dedicated Tabs Strip (Domaco POS Style) */}
                                <div className="flex items-center gap-6 border-b border-slate-200 px-5 pt-2.5 bg-white overflow-x-auto">
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setTab('items'); }}
                                    className={`border-b-2 px-1 pb-2 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                                      currentTab === 'items'
                                        ? 'border-[#784e34] text-[#784e34]'
                                        : 'border-transparent text-slate-600 hover:text-slate-950'
                                    }`}
                                  >
                                    Hàng hóa (1)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setTab('info'); }}
                                    className={`border-b-2 px-1 pb-2 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                                      currentTab === 'info'
                                        ? 'border-[#784e34] text-[#784e34]'
                                        : 'border-transparent text-slate-600 hover:text-slate-950'
                                    }`}
                                  >
                                    Thông tin phiếu trả hàng
                                  </button>
                                </div>

                                {/* 2. Tab Body */}
                                <div className="p-4 space-y-4">
                                  {currentTab === 'items' && (
                                    <div className="space-y-3">
                                      {/* Returned product items table */}
                                      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                                        <table className="min-w-full text-xs">
                                          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                                            <tr>
                                              <th className="px-3 py-2 text-center w-10">STT</th>
                                              <th className="px-3 py-2 text-left w-36">Mã trả hàng</th>
                                              <th className="px-3 py-2 text-left">Tên sản phẩm</th>
                                              <th className="px-3 py-2 text-center w-20">ĐVT</th>
                                              <th className="px-3 py-2 text-right w-24">Số lượng</th>
                                              <th className="px-3 py-2 text-right w-32">Giá nhập</th>
                                              <th className="px-3 py-2 text-right w-32">Giá trả lại</th>
                                              <th className="px-3 py-2 text-right w-36">Thành tiền</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-100">
                                            <tr className="hover:bg-slate-50/50">
                                              <td className="px-3 py-2.5 text-center text-slate-400 font-mono">1</td>
                                              <td className="px-3 py-2.5 font-mono text-rose-700 font-medium">{ret.code}</td>
                                              <td className="px-3 py-2.5 font-medium text-slate-900">
                                                <div>{ret.itemName}</div>
                                              </td>
                                              <td className="px-3 py-2.5 text-center text-slate-600">{ret.unit}</td>
                                              <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">{ret.quantity}</td>
                                              <td className="px-3 py-2.5 text-right font-mono text-slate-700">{(ret.purchasePrice || ret.returnPrice || 0).toLocaleString('vi-VN')} đ</td>
                                              <td className="px-3 py-2.5 text-right font-mono text-slate-700">{(ret.returnPrice || ret.purchasePrice || 0).toLocaleString('vi-VN')} đ</td>
                                              <td className="px-3 py-2.5 text-right font-mono font-bold text-rose-700">{(ret.totalGoods || 0).toLocaleString('vi-VN')} đ</td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      </div>

                                      {/* Financial Summary Box (Domaco POS Style) */}
                                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                                          <div>
                                            <div className="text-[11px] text-slate-500 mb-0.5">Số lượng mặt hàng</div>
                                            <div className="font-mono font-bold text-slate-800 text-sm">1</div>
                                          </div>
                                          <div>
                                            <div className="text-[11px] text-slate-500 mb-0.5">Tổng tiền hàng</div>
                                            <div className="font-mono font-bold text-slate-900 text-sm">{(ret.totalGoods || 0).toLocaleString('vi-VN')} đ</div>
                                          </div>
                                          <div>
                                            <div className="text-[11px] text-slate-500 mb-0.5">Giảm giá</div>
                                            <div className="font-mono font-bold text-slate-700 text-sm">{(ret.invoiceDiscount || 0).toLocaleString('vi-VN')} đ</div>
                                          </div>
                                          <div>
                                            <div className="text-[11px] text-rose-600 font-semibold mb-0.5">NCC cần trả</div>
                                            <div className="font-mono font-bold text-rose-700 text-sm">{(ret.supplierRefund || 0).toLocaleString('vi-VN')} đ</div>
                                          </div>
                                          <div>
                                            <div className="text-[11px] text-emerald-600 font-semibold mb-0.5">NCC đã trả</div>
                                            <div className="font-mono font-bold text-emerald-700 text-sm">{(ret.paidAmount || 0).toLocaleString('vi-VN')} đ</div>
                                            <div className="text-[10px] text-slate-400 mt-0.5">{ret.paymentMethod || 'Chuyển khoản'}</div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {currentTab === 'info' && (
                                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                                        <div className="space-y-2 border-b md:border-b-0 md:border-r border-slate-100 pb-3 md:pb-0 md:pr-3">
                                          <div className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">1. Mã phiếu &amp; Trạng thái</div>
                                          <div>
                                            <span className="text-slate-500 block">Mã trả hàng:</span>
                                            <span className="font-mono font-bold text-rose-700 text-sm">{ret.code}</span>
                                          </div>
                                          <div>
                                            <span className="text-slate-500 block">Mã nhập gốc:</span>
                                            <span className="font-mono text-slate-800 font-medium">{ret.sourcePurchaseEntryCode || '---'}</span>
                                          </div>
                                          <div>
                                            <span className="text-slate-500 block">Trạng thái:</span>
                                            <Tag color={ret.status === 'draft' ? 'gold' : 'green'} className="font-normal text-xs px-2 py-0.5 m-0 mt-0.5">
                                              {ret.status === 'draft' ? '📝 Lưu tạm' : `✓ ${ret.statusLabel || 'Đã trả hàng'}`}
                                            </Tag>
                                          </div>
                                        </div>

                                        <div className="space-y-2 border-b md:border-b-0 md:border-r border-slate-100 pb-3 md:pb-0 md:pr-3">
                                          <div className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">2. Thời gian &amp; Nhân sự</div>
                                          <div>
                                            <span className="text-slate-500 block">Ngày xuất trả:</span>
                                            <span className="font-mono text-slate-800">{ret.returnDate}</span>
                                          </div>
                                          <div>
                                            <span className="text-slate-500 block">Người lập phiếu:</span>
                                            <span className="font-medium text-slate-800">{ret.staffName || 'Nguyễn Văn Nam (KCS)'}</span>
                                          </div>
                                          <div>
                                            <span className="text-slate-500 block">Phương án xử lý:</span>
                                            <span className="font-medium text-slate-800">{ret.solution || ret.statusLabel || 'Đã hoàn bù lô mới'}</span>
                                          </div>
                                        </div>

                                        <div className="space-y-2 border-b md:border-b-0 md:border-r border-slate-100 pb-3 md:pb-0 md:pr-3">
                                          <div className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">3. Nhà cung cấp &amp; Kho</div>
                                          <div>
                                            <span className="text-slate-500 block">Nhà cung cấp nhận:</span>
                                            <span className="font-medium text-slate-900">{ret.supplierName}</span>
                                          </div>
                                          <div>
                                            <span className="text-slate-500 block">Kho xuất trả:</span>
                                            <span className="font-medium text-[#784e34]">{ret.warehouseName || 'Tổng Kho Bình Chánh'}</span>
                                          </div>
                                          <div>
                                            <span className="text-slate-500 block">Hình thức hoàn tiền:</span>
                                            <span className="font-mono text-slate-700">{ret.paymentMethod || 'Chuyển khoản'}</span>
                                          </div>
                                        </div>

                                        <div className="space-y-2">
                                          <div className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">4. Lý do &amp; Ghi chú</div>
                                          <div>
                                            <span className="text-slate-500 block">Lý do hoàn trả:</span>
                                            <span className="text-slate-800 italic block mt-0.5">{ret.reason || '---'}</span>
                                          </div>
                                          <div>
                                            <span className="text-slate-500 block">Ghi chú nội bộ:</span>
                                            <span className="text-slate-600 block mt-0.5">{ret.note || '---'}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* 3. Action Footer Bar (Domaco POS Style) */}
                                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-white border-t border-slate-200">
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="small"
                                      icon={<UpOutlined />}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setExpandedReturnRowKeys([]);
                                      }}
                                      className="h-8 rounded-lg px-3 text-xs font-semibold text-slate-700"
                                    >
                                      Thu gọn
                                    </Button>
                                    <Button
                                      size="small"
                                      icon={<FileExcelOutlined />}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleExportSingleReturnDetail(ret);
                                      }}
                                      className="h-8 rounded-lg border-emerald-600 text-emerald-700 bg-emerald-50/50 hover:!bg-emerald-100 hover:!border-emerald-700 px-3.5 text-xs font-semibold"
                                    >
                                      Xuất Excel
                                    </Button>
                                    <Button
                                      size="small"
                                      type="primary"
                                      icon={<PrinterOutlined />}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedReturnSlipForPrint(ret);
                                      }}
                                      className="h-8 rounded-lg bg-rose-700 hover:!bg-rose-800 text-xs font-semibold"
                                    >
                                      In phiếu trả hàng
                                    </Button>
                                  </div>

                                  <Popconfirm
                                    title={`Xóa phiếu trả hàng ${ret.code}?`}
                                    description="Hành động này không thể hoàn tác."
                                    onConfirm={(e) => {
                                      e?.stopPropagation?.();
                                      handleDeleteReturnSlip(ret.id, ret.code);
                                    }}
                                    okText="Xóa"
                                    cancelText="Hủy"
                                    okButtonProps={{ danger: true }}
                                  >
                                    <Button
                                      danger
                                      size="small"
                                      icon={<DeleteOutlined />}
                                      onClick={(e) => e.stopPropagation()}
                                      className="h-8 rounded-lg px-3.5 text-xs font-semibold"
                                    >
                                      Xóa phiếu
                                    </Button>
                                  </Popconfirm>
                                </div>
                              </div>
                            );
                          },
                        }}
                        columns={[
                          {
                            title: 'Mã trả hàng nhập',
                            dataIndex: 'code',
                            key: 'code',
                            width: 170,
                            render: (code) => (
                              <span className="font-mono text-xs font-normal text-rose-700 bg-rose-50 px-2.5 py-1 rounded whitespace-nowrap inline-block">
                                {code}
                              </span>
                            ),
                          },
                          {
                            title: 'Thời gian',
                            dataIndex: 'returnDate',
                            key: 'returnDate',
                            width: 160,
                            render: (d) => <span className="font-mono text-xs text-slate-600 font-normal whitespace-nowrap">{d}</span>,
                          },
                          {
                            title: 'Mã nhập hàng',
                            dataIndex: 'sourcePurchaseEntryCode',
                            key: 'sourcePurchaseEntryCode',
                            width: 160,
                            render: (code) => (
                              <span className="font-mono text-xs text-[#784e34] bg-[#784e34]/5 px-2 py-0.5 rounded whitespace-nowrap">
                                {code || '---'}
                              </span>
                            ),
                          },
                          {
                            title: 'Nhà cung cấp',
                            dataIndex: 'supplierName',
                            key: 'supplierName',
                            width: 240,
                            render: (sup) => <span className="font-normal text-sm text-slate-800 leading-tight block">{sup}</span>,
                          },
                          {
                            title: 'Kho xuất trả',
                            dataIndex: 'warehouseName',
                            key: 'warehouseName',
                            width: 240,
                            render: (wh) => <span className="font-normal text-xs text-slate-700 leading-snug">{wh}</span>,
                          },
                          {
                            title: 'Mặt hàng hoàn trả',
                            key: 'item',
                            width: 280,
                            render: (_, r) => (
                              <div className="font-normal text-sm text-slate-800 leading-snug">{r.itemName}</div>
                            ),
                          },
                          {
                            title: 'Số lượng',
                            key: 'qty',
                            width: 120,
                            align: 'right',
                            render: (_, r) => (
                              <span className="font-mono font-normal text-sm text-slate-800 whitespace-nowrap">
                                {r.quantity} {r.unit}
                              </span>
                            ),
                          },
                          {
                            title: 'Tổng tiền hàng',
                            dataIndex: 'totalGoods',
                            key: 'totalGoods',
                            width: 160,
                            align: 'right',
                            render: (val) => (
                              <span className="font-mono font-normal text-xs text-slate-700 whitespace-nowrap">
                                {(val || 0).toLocaleString('vi-VN')} đ
                              </span>
                            ),
                          },
                          {
                            title: 'Giảm giá',
                            dataIndex: 'invoiceDiscount',
                            key: 'invoiceDiscount',
                            width: 130,
                            align: 'right',
                            render: (val) => (
                              <span className="font-mono font-normal text-xs text-slate-500 whitespace-nowrap">
                                {(val || 0).toLocaleString('vi-VN')} đ
                              </span>
                            ),
                          },
                          {
                            title: 'NCC cần trả',
                            dataIndex: 'supplierRefund',
                            key: 'supplierRefund',
                            width: 160,
                            align: 'right',
                            render: (val) => (
                              <span className="font-mono font-bold text-sm text-rose-700 whitespace-nowrap">
                                {(val || 0).toLocaleString('vi-VN')} đ
                              </span>
                            ),
                          },
                          {
                            title: 'NCC đã trả',
                            dataIndex: 'paidAmount',
                            key: 'paidAmount',
                            width: 160,
                            align: 'right',
                            render: (val) => (
                              <span className="font-mono font-bold text-xs text-emerald-700 whitespace-nowrap">
                                {(val || 0).toLocaleString('vi-VN')} đ
                              </span>
                            ),
                          },
                          {
                            title: 'Trạng thái',
                            dataIndex: 'status',
                            key: 'status',
                            width: 140,
                            align: 'center',
                            render: (s, r) => (
                              <Tag color={r.status === 'draft' ? 'gold' : 'green'} className="font-normal text-xs px-2.5 py-0.5 whitespace-nowrap">
                                {r.status === 'draft' ? '📝 Lưu tạm' : `✓ ${r.statusLabel || 'Đã trả hàng'}`}
                              </Tag>
                            ),
                          },
                          {
                            title: 'Thao tác',
                            key: 'actions',
                            width: 90,
                            align: 'center',
                            render: (_, r) => (
                              <Space size={2} onClick={(e) => e.stopPropagation()}>
                                <Button
                                  size="small"
                                  type="text"
                                  icon={<PrinterOutlined className="text-slate-500 hover:text-rose-700" />}
                                  onClick={() => setSelectedReturnSlipForPrint(r)}
                                  className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-slate-100"
                                />
                                <Popconfirm
                                  title={`Xóa phiếu trả hàng ${r.code}?`}
                                  description="Hành động này không thể hoàn tác."
                                  onConfirm={() => handleDeleteReturnSlip(r.id, r.code)}
                                  okText="Xóa"
                                  cancelText="Hủy"
                                  okButtonProps={{ danger: true }}
                                >
                                  <Button
                                    size="small"
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined className="text-rose-500 hover:text-rose-700" />}
                                    className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-rose-50"
                                  />
                                </Popconfirm>
                              </Space>
                            ),
                          },
                        ]}
                      />
                    </div>
                  );
                })()}
              </div>
            )}

            {/* SUB-TAB: TRẢ HÀNG CHO NHÀ CUNG CẤP (DOMACO POS PURCHASE RETURN ENTRY MODE) */}
            {warehouseSubTab === 'returns' && returnViewMode === 'create' && (
              <div className="space-y-4">
                {/* Header Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-none shadow-xs border border-slate-200">
                  <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                    <Button
                      icon={<ArrowLeftOutlined />}
                      onClick={() => setReturnViewMode('list')}
                      className="h-9 w-9 rounded-lg text-slate-700 hover:!bg-slate-100 hover:!text-rose-700 flex items-center justify-center"
                      title="Quay lại danh sách phiếu trả hàng (giữ nháp)"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h1 className="m-0 shrink-0 text-sm font-bold text-slate-950">
                          Lập Phiếu Trả Hàng Cho NCC
                        </h1>
                        <span className="font-mono text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                          {returnCode || '#TH-2026-NEW'}
                        </span>
                      </div>
                    </div>

                    {/* Product / Slip Search Input with Dropdown Popover */}
                    <div className="relative min-w-0 max-w-[500px] flex-1">
                      <AdminSearchInput
                        placeholder="Tìm hàng hóa theo mã, tên, mã phiếu nhập gốc (#PN-)..."
                        value={returnSearchProduct}
                        onChange={(val) => {
                          setReturnSearchProduct(val);
                          setShowReturnProductPopover(val.trim().length > 0);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') setShowReturnProductPopover(false);
                        }}
                        sizeVariant="sm"
                      />

                      {showReturnProductPopover && returnSearchProduct.trim() !== '' && (
                        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-2xl">
                          <div className="flex items-center justify-between px-2 py-1 mb-1 border-b border-slate-100 text-[11px] text-slate-500 font-medium">
                            <span>Kết quả tìm kiếm cho &quot;{returnSearchProduct}&quot;</span>
                            <button
                              type="button"
                              onClick={() => setShowReturnProductPopover(false)}
                              className="text-slate-400 hover:text-slate-700 border-none bg-transparent cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                          {/* Search matching import slips */}
                          {importsList
                            .filter(
                              (i) =>
                                i.code.toLowerCase().includes(returnSearchProduct.toLowerCase()) ||
                                i.itemName.toLowerCase().includes(returnSearchProduct.toLowerCase()) ||
                                i.supplier.toLowerCase().includes(returnSearchProduct.toLowerCase())
                            )
                            .map((imp) => (
                              <button
                                key={imp.id}
                                type="button"
                                onClick={() => {
                                  setReturnSourceCode(imp.code);
                                  setReturnSupplier(imp.supplier);
                                  setReturnWarehouse(imp.warehouseName);
                                  setReturnEntryLines((prev) => [
                                    ...prev,
                                    {
                                      id: `line_ret_${Date.now()}_${imp.id}`,
                                      code: imp.code,
                                      name: imp.itemName,
                                      spec: imp.spec || '',
                                      unit: imp.unit || 'bộ',
                                      quantity: 1,
                                      purchasePrice: imp.unitPrice || imp.totalValue || 0,
                                      returnPrice: imp.unitPrice || imp.totalValue || 0,
                                      total: imp.unitPrice || imp.totalValue || 0,
                                      reason: 'Lỗi quy cách / Kiểm định không đạt KCS',
                                    },
                                  ]);
                                  message.success(`Đã tự động nạp mặt hàng từ phiếu nhập ${imp.code}!`);
                                  setReturnSearchProduct('');
                                  setShowReturnProductPopover(false);
                                }}
                                className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg p-2 text-left hover:bg-rose-50/50 transition-colors border-none bg-transparent"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-xs font-medium text-slate-900">
                                    <span className="font-mono text-rose-700 mr-1.5">{imp.code}</span>
                                    {imp.itemName}
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    NCC: {imp.supplier} | Kho: {imp.warehouseName}
                                  </div>
                                </div>
                                <div className="shrink-0 text-right">
                                  <span className="text-xs font-bold text-rose-700">
                                    {(imp.totalValue || 0).toLocaleString('vi-VN')} đ
                                  </span>
                                </div>
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {returnEntryLines.length > 0 && (
                      <>
                        <Button
                          size="small"
                          icon={<FileExcelOutlined />}
                          onClick={handleExportCreateReturnLinesExcel}
                          className="h-9 px-3 text-xs font-medium rounded-lg border-emerald-600 text-emerald-700 bg-emerald-50/50 hover:!bg-emerald-100 hover:!border-emerald-700"
                        >
                          Xuất Excel chi tiết
                        </Button>
                        <Popconfirm
                          title="Xóa tất cả mặt hàng xuất trả?"
                          onConfirm={() => {
                            setReturnEntryLines([]);
                            message.info('Đã xóa danh sách mặt hàng trả!');
                          }}
                          okText="Xóa hết"
                          cancelText="Hủy"
                          okButtonProps={{ danger: true }}
                        >
                          <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            className="h-9 px-3 text-xs font-medium rounded-lg"
                          >
                            Xóa trắng ({returnEntryLines.length})
                          </Button>
                        </Popconfirm>
                      </>
                    )}
                  </div>
                </div>

                {/* 2-Column Domaco Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                  {/* Left Column: Return Line Items (col-span-8) */}
                  <div className="lg:col-span-8 bg-white p-4 rounded-none shadow-xs border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                      <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <span>Danh sách hàng hóa hoàn trả NCC</span>
                        <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-mono text-[11px]">
                          {returnEntryLines.length} mặt hàng
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        Tổng SL trả: <strong className="text-slate-900 font-mono">{returnEntryLines.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)}</strong>
                      </div>
                    </div>

                    {returnEntryLines.length === 0 ? (
                      /* Domaco POS Empty State */
                      <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50/50 rounded-lg border border-dashed border-slate-300">
                        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-2xl mb-3">
                          🔄
                        </div>
                        <div className="mb-1 text-sm font-medium text-slate-900">
                          Chưa có sản phẩm nào trong phiếu trả hàng
                        </div>
                        <p className="text-xs text-slate-500 max-w-sm">
                          Chọn phiếu nhập gốc hoặc tìm kiếm mặt hàng ở thanh tìm kiếm phía trên để lập phiếu xuất trả.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="overflow-x-auto rounded-lg border border-slate-200">
                          <table className="min-w-full text-xs">
                            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                              <tr>
                                <th className="px-3 py-2.5 text-center w-10">STT</th>
                                <th className="px-3 py-2.5 text-left w-28">Mã hàng</th>
                                <th className="px-3 py-2.5 text-left">Tên sản phẩm</th>
                                <th className="px-3 py-2.5 text-center w-20">ĐVT</th>
                                <th className="px-3 py-2.5 text-right w-24">Số lượng</th>
                                <th className="px-3 py-2.5 text-right w-32">Giá trả lại</th>
                                <th className="px-3 py-2.5 text-right w-36">Thành tiền</th>
                                <th className="px-3 py-2.5 text-center w-12">Xóa</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {returnEntryLines.map((line, idx) => (
                                <tr key={line.id} className="hover:bg-rose-50/20 transition-colors">
                                  <td className="px-3 py-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                                  <td className="px-3 py-2 font-mono font-medium text-rose-700">{line.code}</td>
                                  <td className="px-3 py-2.5 font-medium text-slate-900">
                                    {line.name}
                                  </td>
                                  <td className="px-3 py-2 text-center text-slate-600 font-medium">
                                    {line.unit}
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    <InputNumber
                                      min={0.1}
                                      step={1}
                                      value={line.quantity}
                                      onChange={(q) => {
                                        const numQ = Number(q) || 1;
                                        setReturnEntryLines((prev) =>
                                          prev.map((l) =>
                                            l.id === line.id
                                              ? { ...l, quantity: numQ, total: numQ * l.returnPrice }
                                              : l
                                          )
                                        );
                                      }}
                                      className="w-20 h-7 text-xs font-mono font-bold"
                                    />
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    <InputNumber
                                      min={0}
                                      value={line.returnPrice}
                                      formatter={(val) => (val !== undefined && val !== null ? `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '')}
                                      parser={(val) => (val ? Number(val.replace(/\$\s?|(,*)/g, '')) : 0) as any}
                                      onChange={(p) => {
                                        const numP = Number(p) || 0;
                                        setReturnEntryLines((prev) =>
                                          prev.map((l) =>
                                            l.id === line.id
                                              ? { ...l, returnPrice: numP, total: line.quantity * numP }
                                              : l
                                          )
                                        );
                                      }}
                                      className="w-32 h-7 text-xs font-mono font-bold [&_input]:!text-right"
                                    />
                                  </td>
                                  <td className="px-3 py-2 text-right font-mono font-bold text-rose-700">
                                    {(line.total || line.quantity * line.returnPrice).toLocaleString('vi-VN')} đ
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <Button
                                      size="small"
                                      type="text"
                                      danger
                                      icon={<DeleteOutlined className="text-slate-400 hover:text-red-600" />}
                                      onClick={() => {
                                        setReturnEntryLines((prev) => prev.filter((l) => l.id !== line.id));
                                      }}
                                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-50"
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="flex items-center justify-end pt-2">
                          <span className="text-xs text-slate-500">
                            Tổng giá trị hoàn trả: <strong className="text-sm font-mono text-rose-700 font-bold">
                              {returnEntryLines.reduce((sum, item) => sum + (item.total || (item.quantity * item.returnPrice)), 0).toLocaleString('vi-VN')} đ
                            </strong>
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Right Column: Metadata & Financial Calculation Sidebar (col-span-4) */}
                  <div className="lg:col-span-4 bg-white p-4 rounded-none shadow-xs border border-slate-200 space-y-4">
                    {/* Meta Header Box */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Avatar size="small" icon={<UserOutlined />} className="bg-rose-700" />
                        <div>
                          <div className="text-xs font-bold text-slate-900">{returnStaffName || user?.name || 'Nguyễn Văn Nam (KCS)'}</div>
                          <div className="text-[11px] text-slate-400">Người lập phiếu trả hàng</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-mono font-medium text-slate-700">{returnDate || new Date().toLocaleDateString('vi-VN')}</div>
                        <div className="text-[11px] text-slate-400">Thời gian tạo</div>
                      </div>
                    </div>

                    {/* Basic Form Controls */}
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-800 block mb-1">Phiếu nhập gốc (Liên kết)</label>
                        <Select
                          value={returnSourceCode}
                          onChange={(val) => {
                            setReturnSourceCode(val);
                            const matched = importsList.find((i) => i.code === val);
                            if (matched) {
                              setReturnSupplier(matched.supplier);
                              setReturnWarehouse(matched.warehouseName);
                              setReturnEntryLines([
                                {
                                  id: `line_ret_${Date.now()}_${matched.id}`,
                                  code: matched.code,
                                  name: matched.itemName,
                                  spec: matched.spec || '',
                                  unit: matched.unit || 'bộ',
                                  quantity: matched.quantity || 1,
                                  purchasePrice: matched.unitPrice || matched.totalValue || 0,
                                  returnPrice: matched.unitPrice || matched.totalValue || 0,
                                  total: matched.totalValue || (matched.unitPrice ? matched.unitPrice * matched.quantity : 0),
                                  reason: 'Lỗi quy cách / Kiểm định không đạt tiêu chuẩn',
                                },
                              ]);
                              message.success(`Đã tự động điền thông tin từ phiếu nhập ${matched.code}`);
                            }
                          }}
                          placeholder="Chọn phiếu nhập gốc để trả hàng..."
                          className="w-full h-9 text-xs"
                          allowClear
                        >
                          {importsList.map((i) => (
                            <Option key={i.id} value={i.code}>
                              <span className="font-mono">{i.code}</span> - {i.itemName} ({i.supplier})
                            </Option>
                          ))}
                        </Select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-800 block mb-1">Nhà cung cấp nhận hàng</label>
                        <Select
                          value={returnSupplier}
                          onChange={(val) => setReturnSupplier(val)}
                          placeholder="Chọn nhà cung cấp..."
                          className="w-full h-9 text-xs"
                          showSearch
                          optionFilterProp="children"
                        >
                          {suppliersList.map((s) => (
                            <Option key={s.id} value={s.name}>
                              {s.name} ({s.code})
                            </Option>
                          ))}
                        </Select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-800 block mb-1">Kho xuất trả hàng</label>
                        <Select
                          value={returnWarehouse}
                          onChange={(val) => setReturnWarehouse(val)}
                          placeholder="Chọn kho xuất trả..."
                          className="w-full h-9 text-xs"
                          showSearch
                          optionFilterProp="children"
                        >
                          {warehousesList.map((w) => (
                            <Option key={w.id} value={w.name}>
                              {w.name}
                            </Option>
                          ))}
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-semibold text-slate-800 block mb-1">Lý do hoàn trả</label>
                          <Select
                            value={returnReason}
                            onChange={(r) => setReturnReason(r)}
                            className="w-full h-8 text-xs"
                            options={[
                              { value: 'Lỗi quy cách / Kiểm định không đạt tiêu chuẩn', label: 'Lỗi quy cách / KCS' },
                              { value: 'Giao sai mẫu mã / vật tư', label: 'Sai mẫu mã' },
                              { value: 'Nứt vỡ / trầy xước trong vận chuyển', label: 'Hỏng do vận chuyển' },
                              { value: 'Hàng thừa sau khi nghiệm thu công trình', label: 'Hàng thừa hoàn lại' },
                            ]}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-800 block mb-1">Phương án xử lý</label>
                          <Select
                            value={returnSolution}
                            onChange={(s) => setReturnSolution(s)}
                            className="w-full h-8 text-xs"
                            options={[
                              { value: 'Đã hoàn bù lô mới', label: 'Hoàn bù lô mới' },
                              { value: 'NCC đã hoàn lại tiền', label: 'NCC hoàn lại tiền' },
                              { value: 'Cấn trừ vào công nợ', label: 'Cấn trừ công nợ' },
                              { value: 'Đổi mặt hàng tương đương', label: 'Đổi hàng tương đương' },
                            ]}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Financial Calculations Box */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5 text-xs">
                      {(() => {
                        const totalGoods = returnEntryLines.reduce((sum, item) => sum + (item.total || (item.quantity * item.returnPrice)), 0);
                        const refund = Math.max(0, totalGoods - (returnDiscount || 0));
                        const paid = returnPaidAmount !== undefined ? Number(returnPaidAmount) : refund;
                        const remaining = Math.max(0, refund - paid);

                        return (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-600 font-medium">Tổng tiền hàng ({returnEntryLines.length} món)</span>
                              <span className="font-mono font-bold text-slate-900">{totalGoods.toLocaleString('vi-VN')} đ</span>
                            </div>

                            <div className="flex items-center justify-between gap-2">
                              <span className="text-slate-600 font-medium shrink-0">Giảm giá / Phí hoàn hàng</span>
                              <InputNumber
                                min={0}
                                value={returnDiscount}
                                formatter={(val) => (val !== undefined && val !== null ? `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '')}
                                parser={(val) => (val ? Number(val.replace(/\$\s?|(,*)/g, '')) : 0) as any}
                                onChange={(val) => setReturnDiscount(Number(val) || 0)}
                                className="w-36 h-7 text-xs font-mono [&_input]:!text-right"
                              />
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                              <span className="font-bold text-slate-900 text-xs">NCC cần hoàn lại</span>
                              <span className="font-mono font-bold text-rose-700 text-sm">{refund.toLocaleString('vi-VN')} đ</span>
                            </div>

                            <div className="flex items-center justify-between gap-2">
                              <span className="text-slate-700 font-semibold shrink-0">Tiền NCC đã trả</span>
                              <InputNumber
                                min={0}
                                placeholder={refund.toLocaleString('vi-VN')}
                                value={returnPaidAmount}
                                formatter={(val) => (val !== undefined && val !== null ? `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '')}
                                parser={(val) => (val ? Number(val.replace(/\$\s?|(,*)/g, '')) : 0) as any}
                                onChange={(val) => setReturnPaidAmount(val !== null && val !== undefined ? Number(val) : undefined)}
                                className="w-36 h-7 text-xs font-mono font-bold text-emerald-700 [&_input]:!text-right"
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-slate-600 font-medium">Còn nợ hoàn tiền</span>
                              <span className={`font-mono font-bold ${remaining > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                                {remaining > 0 ? `${remaining.toLocaleString('vi-VN')} đ` : '0 đ'}
                              </span>
                            </div>

                            <div className="pt-2 border-t border-slate-200">
                              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Hình thức hoàn tiền</label>
                              <Select
                                value={returnPaymentMethod}
                                onChange={(m) => setReturnPaymentMethod(m)}
                                className="w-full h-8 text-xs"
                                options={[
                                  { value: 'Chuyển khoản', label: 'Chuyển khoản ngân hàng' },
                                  { value: 'Tiền mặt', label: 'Tiền mặt' },
                                  { value: 'Cấn trừ công nợ', label: 'Cấn trừ vào công nợ tiếp theo' },
                                ]}
                              />
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {/* Note */}
                    <div>
                      <label className="text-xs font-semibold text-slate-800 block mb-1">Ghi chú phiếu trả hàng</label>
                      <Input.TextArea
                        value={returnNote}
                        onChange={(e) => setReturnNote(e.target.value)}
                        placeholder="VD: Biên bản kiểm định chất lượng kèm theo..."
                        rows={2}
                        className="text-xs rounded-lg"
                      />
                    </div>

                    {/* Sticky Bottom Actions */}
                    <div className="pt-3 border-t border-slate-200 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => setReturnViewMode('list')}
                          className="h-10 text-xs font-semibold rounded-lg text-slate-700 hover:!border-slate-400"
                        >
                          Bỏ qua (Giữ nháp)
                        </Button>
                        <Button
                          onClick={() => handleSaveReturnSlip('draft')}
                          className="h-10 text-xs font-bold rounded-lg border-amber-400 text-amber-800 bg-amber-50 hover:!bg-amber-100"
                        >
                          📝 Lưu tạm
                        </Button>
                      </div>
                      <Button
                        type="primary"
                        onClick={() => handleSaveReturnSlip('completed')}
                        className="w-full h-11 text-xs font-bold rounded-lg bg-rose-700 hover:!bg-rose-800 text-white border-none shadow-sm"
                      >
                        ✓ Xác nhận trả hàng
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 3: KIỂM KÊ KHO (DOMACO POS / ACCOUNTING STOCKTAKE) */}
            {warehouseSubTab === 'stocktake' && stocktakeViewMode === 'list' && (
              <div className="space-y-4">
                {/* Search & Action Bar (Domaco POS Style) */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-none shadow-xs">
                  <div className="flex flex-1 items-center gap-2.5 min-w-[280px] max-w-md">
                    <AdminSearchInput
                      placeholder="Theo mã kiểm kho, tên phiên, người tạo..."
                      value={auditSearchQuery}
                      onChange={(val) => setAuditSearchQuery(val)}
                    />
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Date Filter (Domaco POS Architecture) */}
                    <PosDateFilter
                      value={auditDateRange}
                      onChange={(range) => setAuditDateRange(range)}
                    />

                    <Button
                      icon={<ReloadOutlined />}
                      onClick={() => {
                        setAuditSearchQuery('');
                        setAuditDateRange(null);
                        message.success('Đã làm mới danh sách phiếu kiểm!');
                      }}
                      className="h-10 rounded-lg text-sm font-normal text-slate-700 hover:text-[#784e34]"
                    >
                      Làm mới
                    </Button>
                    <Button
                      icon={<DownloadOutlined />}
                      onClick={() => message.success('Đã xuất danh sách phiếu kiểm ra Excel!')}
                      className="h-10 rounded-lg text-sm font-normal text-slate-700 hover:text-[#784e34]"
                    >
                      Xuất Excel
                    </Button>
                  </div>
                </div>

                <div className="bg-white rounded-none shadow-xs border border-slate-200/80 overflow-hidden">
                  <Table
                    dataSource={auditSlips.filter((s) => {
                      const matchBranch = isMatchGlobalBranch(s.scopeLabel) || isMatchGlobalBranch(s.title);
                      const matchSearch =
                        !auditSearchQuery ||
                        s.code.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
                        s.title.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
                        s.creator.toLowerCase().includes(auditSearchQuery.toLowerCase());
                      const matchDate = checkDateInRange(s.createdAt, auditDateRange);
                      return matchBranch && matchSearch && matchDate;
                    })}
                    rowKey="id"
                    pagination={false}
                    className="[&_.ant-table-thead>tr>th]:!bg-slate-50/90 [&_.ant-table-thead>tr>th]:!text-slate-700 [&_.ant-table-thead>tr>th]:!font-medium [&_.ant-table-thead>tr>th]:!text-xs [&_.ant-table-thead>tr>th]:!py-3.5 [&_.ant-table-thead>tr>th]:!whitespace-nowrap [&_.ant-table-cell]:!py-3.5 [&_.ant-table-cell]:!text-sm"
                    columns={[
                      {
                        title: 'Mã kiểm kho',
                        dataIndex: 'code',
                        key: 'code',
                        width: 150,
                        render: (c) => (
                          <span className="font-mono font-semibold text-xs text-[#784e34] bg-[#784e34]/10 px-2.5 py-1 rounded whitespace-nowrap inline-block">
                            {c}
                          </span>
                        ),
                      },
                      {
                        title: 'Tên phiên kiểm kê',
                        dataIndex: 'title',
                        key: 'title',
                        render: (t) => <span className="font-semibold text-xs text-slate-900 leading-normal">{t}</span>,
                      },
                      {
                        title: 'Phạm vi kho',
                        dataIndex: 'scopeLabel',
                        key: 'scopeLabel',
                        render: (s) => <span className="text-xs text-slate-600 font-normal">{s}</span>,
                      },
                      {
                        title: 'Ngày kiểm',
                        dataIndex: 'createdAt',
                        key: 'createdAt',
                        width: 130,
                        render: (d) => <span className="font-mono text-xs text-slate-500 font-normal whitespace-nowrap">{d}</span>,
                      },
                      {
                        title: 'Người chủ trì',
                        dataIndex: 'creator',
                        key: 'creator',
                        render: (cr) => <span className="text-xs text-slate-700 font-normal">{cr}</span>,
                      },
                      {
                        title: 'Trạng thái',
                        dataIndex: 'status',
                        key: 'status',
                        align: 'center',
                        width: 150,
                        render: (s) =>
                          s === 'completed' ? (
                            <Tag color="green" className="font-normal text-xs px-2.5 py-1 rounded whitespace-nowrap">Đã hoàn tất 100%</Tag>
                          ) : (
                            <Tag color="processing" className="font-normal text-xs px-2.5 py-1 rounded whitespace-nowrap">Đang kiểm đếm</Tag>
                          ),
                      },
                      {
                        title: 'Thao tác',
                        key: 'action',
                        align: 'center',
                        width: 90,
                        render: (_, r) => (
                          <Space size={4}>
                            <Button
                              icon={<EditOutlined className="text-base" />}
                              size="small"
                              type="text"
                              onClick={() => handleOpenEditStocktake(r)}
                              className="text-slate-600 hover:text-[#784e34] hover:bg-slate-100"
                              title="Chỉnh sửa phiếu kiểm"
                            />
                            <Popconfirm
                              title={`Xóa phiếu kiểm kê "${r.code}"?`}
                              onConfirm={() => {
                                setAuditSlips((prev) => prev.filter((s) => s.id !== r.id));
                                message.success(`Đã xóa phiếu kiểm kê ${r.code} thành công!`);
                              }}
                              okText="Xóa"
                              cancelText="Hủy"
                              okButtonProps={{ danger: true }}
                            >
                              <Button
                                icon={<DeleteOutlined className="text-base" />}
                                size="small"
                                type="text"
                                className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                                title="Xóa phiếu"
                              />
                            </Popconfirm>
                          </Space>
                        ),
                      },
                    ]}
                  />
                </div>
              </div>
            )}

            {/* SUB-TAB 3 (ENTRY MODE): GIAO DIỆN KIỂM KHO CHUẨN DOMACO ACCOUNTING / POS */}
            {warehouseSubTab === 'stocktake' && (stocktakeViewMode === 'create' || stocktakeViewMode === 'edit') && (
              <div className="space-y-4">
                {/* Header Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-none shadow-xs border border-slate-200">
                  <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                    <Button
                      icon={<ArrowLeftOutlined />}
                      onClick={() => setStocktakeViewMode('list')}
                      className="h-9 w-9 rounded-lg text-slate-700 hover:!bg-slate-100 hover:!text-[#784e34] flex items-center justify-center"
                      title="Quay lại danh sách kiểm kho"
                    />
                    <h1 className="m-0 shrink-0 text-sm font-medium text-slate-950">
                      {stocktakeViewMode === 'create' ? 'Kiểm kho' : 'Cập nhật phiếu kiểm kho'}
                    </h1>

                    {/* Product Search Input with Dropdown Popover */}
                    <div className="relative min-w-0 max-w-[480px] flex-1">
                      <AdminSearchInput
                        placeholder="Tìm hàng hóa theo mã hoặc tên sản phẩm thành phẩm (F3)..."
                        value={stocktakeSearchProduct}
                        onChange={(val) => {
                          setStocktakeSearchProduct(val);
                          setShowStocktakeProductPopover(val.trim().length > 0);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') setShowStocktakeProductPopover(false);
                        }}
                        sizeVariant="sm"
                      />

                      {showStocktakeProductPopover && stocktakeSearchProduct.trim() !== '' && (
                        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-2xl">
                          <div className="flex items-center justify-between px-2 py-1 mb-1 border-b border-slate-100 text-[11px] text-slate-500 font-medium">
                            <span>Kết quả tìm kiếm cho &quot;{stocktakeSearchProduct}&quot;</span>
                            <button
                              type="button"
                              onClick={() => setShowStocktakeProductPopover(false)}
                              className="text-slate-400 hover:text-slate-700 border-none bg-transparent cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                          {allAuditableStock
                            .filter(
                              (p) =>
                                p.name.toLowerCase().includes(stocktakeSearchProduct.toLowerCase()) ||
                                p.code.toLowerCase().includes(stocktakeSearchProduct.toLowerCase())
                            )
                            .map((product) => {
                              const alreadyAdded = stocktakeEntryLines.some((line) => line.code === product.code);
                              return (
                                <button
                                  key={product.id || product.code}
                                  type="button"
                                  onClick={() => {
                                    if (!alreadyAdded) {
                                      setStocktakeEntryLines((prev) => [
                                        ...prev,
                                        { ...product, actualQty: product.systemQty, status: 'matched' },
                                      ]);
                                      message.success(`Đã thêm ${product.name} vào phiếu kiểm!`);
                                    } else {
                                      message.info(`${product.name} đã có trong danh sách!`);
                                    }
                                    setStocktakeSearchProduct('');
                                    setShowStocktakeProductPopover(false);
                                  }}
                                  className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg p-2 text-left transition-colors border-none bg-transparent ${
                                    alreadyAdded ? 'bg-amber-50/50' : 'hover:bg-slate-50'
                                  }`}
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="truncate text-xs font-medium text-slate-900">
                                      <span className="font-mono text-[#784e34] mr-1.5">{product.code}</span>
                                      {product.name}
                                    </div>
                                    <div className="text-[11px] text-slate-500">
                                      ĐVT: {product.unit} | MC: {product.systemMc} | {product.location}
                                    </div>
                                  </div>
                                  <div className="shrink-0 text-right">
                                    {alreadyAdded ? (
                                      <span className="text-xs font-medium text-[#784e34]">Đã chọn ✓</span>
                                    ) : (
                                      <span className="text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                                        Tồn: {product.systemQty} {product.unit}
                                      </span>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          {allAuditableStock.filter(
                            (p) =>
                              p.name.toLowerCase().includes(stocktakeSearchProduct.toLowerCase()) ||
                              p.code.toLowerCase().includes(stocktakeSearchProduct.toLowerCase())
                          ).length === 0 && (
                            <div className="p-4 text-center text-xs text-slate-400">Không tìm thấy sản phẩm phù hợp</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      icon={<PrinterOutlined />}
                      onClick={() => {
                        if (stocktakeEntryLines.length === 0) {
                          message.warning('Vui lòng thêm sản phẩm vào danh sách để in phiếu kiểm!');
                          return;
                        }
                        printStocktakeSlip({
                          code: stocktakeSlipCode || 'KK-2026-08',
                          date: new Date().toLocaleDateString('vi-VN'),
                          warehouseName: stocktakeWarehouseName || 'Tổng Kho Bình Chánh',
                          staffName: user?.name || 'Nguyễn Văn Nam (KCS)',
                          lines: stocktakeEntryLines.map((l) => ({
                            itemCode: l.code,
                            itemName: l.name,
                            unit: l.unit || 'Bộ',
                            systemQty: Number(l.systemQty || 0),
                            actualQty: Number(l.actualQty || 0),
                            diffQty: Number(l.actualQty || 0) - Number(l.systemQty || 0),
                            unitPrice: Number(l.unitPrice || l.costPrice || 500000),
                            diffValue: (Number(l.actualQty || 0) - Number(l.systemQty || 0)) * Number(l.unitPrice || l.costPrice || 500000),
                            reason: l.reason || (Number(l.actualQty || 0) === Number(l.systemQty || 0) ? 'Khớp số liệu tồn' : 'Chênh lệch thực tế'),
                          })),
                        });
                      }}
                      title="In phiếu kiểm kho (A4)"
                      className="h-9 w-9 rounded-lg p-0 text-slate-700 hover:text-[#784e34] flex items-center justify-center"
                    />
                  </div>
                </div>

                {/* 2-Column Domaco Layout (Left: Lines Table, Right: Sticky Aside Panel) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                  {/* Left Column: Stocktake Lines Table & Filters */}
                  <div className="lg:col-span-8 bg-white p-4 rounded-none shadow-xs border border-slate-200 space-y-3">
                    {stocktakeEntryLines.length === 0 ? (
                      /* Domaco POS Empty State */
                      <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50/50 rounded-lg border border-dashed border-slate-300">
                        <div className="w-12 h-12 rounded-full bg-[#784e34]/10 text-[#784e34] flex items-center justify-center text-2xl mb-3">
                          📋
                        </div>
                        <div className="mb-1 text-sm font-medium text-slate-900">
                          Thêm sản phẩm vào phiếu kiểm kho
                        </div>
                        <p className="mb-4 text-xs text-slate-500 max-w-sm">
                          Tìm kiếm hàng hóa theo mã hoặc tên ở ô tìm kiếm phía trên để bắt đầu kiểm kê.
                        </p>
                        <Button
                          type="primary"
                          icon={<SearchOutlined />}
                          onClick={() => {
                            const input = document.querySelector('input[placeholder*="Tìm hàng hóa"]') as HTMLInputElement;
                            if (input) {
                              input.focus();
                            }
                          }}
                          className="h-9 rounded-lg bg-[#784e34] hover:!bg-[#5d371f] px-4 text-xs font-normal text-white shadow-none border-none flex items-center gap-1.5"
                        >
                          Tìm hàng hóa
                        </Button>
                      </div>
                    ) : (
                      <>
                        {/* Sub-Filter Tabs: Tất cả, Khớp, Lệch, Lệch tăng, Lệch giảm */}
                        <div className="flex items-center gap-4 border-b border-slate-200 text-xs pb-1 overflow-x-auto">
                          {[
                            { key: 'all', label: `Tất cả (${stocktakeEntryLines.length})` },
                            {
                              key: 'matched',
                              label: `Khớp (${
                                stocktakeEntryLines.filter(
                                  (l) => Number(l.actualQty || 0) === Number(l.systemQty || 0)
                                ).length
                              })`,
                            },
                            {
                              key: 'diff',
                              label: `Lệch (${
                                stocktakeEntryLines.filter(
                                  (l) => Number(l.actualQty || 0) !== Number(l.systemQty || 0)
                                ).length
                              })`,
                            },
                            {
                              key: 'increase',
                              label: `Lệch tăng (${
                                stocktakeEntryLines.filter(
                                  (l) => Number(l.actualQty || 0) > Number(l.systemQty || 0)
                                ).length
                              })`,
                            },
                            {
                              key: 'decrease',
                              label: `Lệch giảm (${
                                stocktakeEntryLines.filter(
                                  (l) => Number(l.actualQty || 0) < Number(l.systemQty || 0)
                                ).length
                              })`,
                            },
                          ].map((tab) => {
                            const isActive = stocktakeTabFilter === tab.key;
                            return (
                              <button
                                key={tab.key}
                                type="button"
                                onClick={() => setStocktakeTabFilter(tab.key as any)}
                                className={`pb-2 transition-all cursor-pointer border-none bg-transparent whitespace-nowrap text-xs font-normal ${
                                  isActive
                                    ? 'border-b-2 !border-[#784e34] text-[#784e34] font-medium'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                {tab.label}
                              </button>
                            );
                          })}
                        </div>

                        {/* Lines Table */}
                        <div className="overflow-x-auto border border-slate-200 rounded-lg">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50 text-slate-700 font-medium border-b border-slate-200">
                                <th className="py-2.5 px-3 w-10 text-center">#</th>
                                <th className="py-2.5 px-3">Mã hàng</th>
                                <th className="py-2.5 px-3">Tên hàng hóa</th>
                                <th className="py-2.5 px-3 text-center">ĐVT</th>
                                <th className="py-2.5 px-3 text-center">Độ ẩm MC</th>
                                <th className="py-2.5 px-3 text-right">Tồn kho</th>
                                <th className="py-2.5 px-3 text-center w-28">Thực tế</th>
                                <th className="py-2.5 px-3 text-right">SL lệch</th>
                                <th className="py-2.5 px-3 text-center w-12"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-normal">
                              {stocktakeEntryLines
                                .filter((line) => {
                                  const diff = Number(line.actualQty || 0) - Number(line.systemQty || 0);
                                  if (stocktakeTabFilter === 'matched') return diff === 0;
                                  if (stocktakeTabFilter === 'diff') return diff !== 0;
                                  if (stocktakeTabFilter === 'increase') return diff > 0;
                                  if (stocktakeTabFilter === 'decrease') return diff < 0;
                                  return true;
                                })
                                .map((line, idx) => {
                                  const diff = Number((Number(line.actualQty || 0) - Number(line.systemQty || 0)).toFixed(2));
                                  const diffColor =
                                    diff > 0
                                      ? 'text-emerald-600'
                                      : diff < 0
                                      ? 'text-rose-600'
                                      : 'text-slate-600';
                                  return (
                                    <tr key={line.id || line.code || idx} className="hover:bg-slate-50/80 transition-colors">
                                      <td className="py-2 px-3 text-center font-mono text-slate-400 text-[11px]">{idx + 1}</td>
                                      <td className="py-2 px-3">
                                        <span className="font-mono text-xs text-[#784e34] bg-[#784e34]/10 px-2 py-0.5 rounded">
                                          {line.code}
                                        </span>
                                      </td>
                                      <td className="py-2 px-3">
                                        <div className="font-medium text-slate-900 text-xs">{line.name}</div>
                                        <div className="text-[11px] text-slate-500">{line.qualityNote || line.location}</div>
                                      </td>
                                      <td className="py-2 px-3 text-center text-slate-600">{line.unit}</td>
                                      <td className="py-2 px-3 text-center font-mono text-slate-600">{line.actualMc || line.systemMc}</td>
                                      <td className="py-2 px-3 text-right font-mono font-medium text-slate-900">{line.systemQty}</td>
                                      <td className="py-2 px-3 text-center">
                                        <InputNumber
                                          min={0}
                                          step={0.1}
                                          value={line.actualQty}
                                          onChange={(val) => {
                                            const newQty = val === null ? 0 : Number(val);
                                            setStocktakeEntryLines((prev) =>
                                              prev.map((l) =>
                                                l.code === line.code
                                                  ? {
                                                      ...l,
                                                      actualQty: newQty,
                                                      status: newQty === Number(l.systemQty) ? 'matched' : 'discrepancy',
                                                    }
                                                  : l
                                              )
                                            );
                                          }}
                                          className="w-24 text-center h-8 text-xs font-normal"
                                        />
                                      </td>
                                      <td className={`py-2 px-3 text-right font-mono font-medium ${diffColor}`}>
                                        {diff > 0 ? `+${diff}` : diff}
                                      </td>
                                      <td className="py-2 px-3 text-center">
                                        <Button
                                          type="text"
                                          size="small"
                                          icon={<DeleteOutlined className="text-slate-400 hover:text-rose-600 text-sm" />}
                                          onClick={() =>
                                            setStocktakeEntryLines((prev) => prev.filter((l) => l.code !== line.code))
                                          }
                                          className="w-7 h-7 flex items-center justify-center rounded hover:bg-rose-50"
                                          title="Xóa khỏi danh sách"
                                        />
                                      </td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Right Column: Sticky Summary & Action Panel */}
                  <div className="lg:col-span-4 bg-white p-4 rounded-none shadow-xs border border-slate-200 space-y-4">
                    {/* User & Date Bar */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
                      <div className="flex items-center gap-2 text-slate-800 font-medium">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                          <UserOutlined />
                        </span>
                        <span>{user?.name || 'Nguyễn Văn Nam (Thủ kho)'}</span>
                      </div>
                      <span className="font-mono text-slate-500 text-xs">{new Date().toLocaleDateString('vi-VN')}</span>
                    </div>

                    {/* Metadata Grid */}
                    <div className="space-y-2.5 text-xs text-slate-700">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Mã kiểm kho:</span>
                        <span className="font-mono text-[#784e34] font-medium bg-[#784e34]/10 px-2.5 py-0.5 rounded">
                          {stocktakeSlipCode}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Chi nhánh:</span>
                        <span className="font-medium text-slate-900 text-right">Xưởng Sản Xuất Bình Chánh</span>
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-500 block">Kho kiểm kê:</label>
                        <Select
                          value={stocktakeWarehouseName}
                          onChange={setStocktakeWarehouseName}
                          options={warehousesList.map((w) => ({ value: w.name, label: w.name }))}
                          className="w-full text-xs font-normal"
                        />
                      </div>
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-slate-500">Trạng thái:</span>
                        <Tag color={stocktakeViewMode === 'edit' ? 'processing' : 'gold'} className="m-0 text-xs font-normal">
                          {stocktakeViewMode === 'edit' ? 'Đang kiểm đếm' : 'Phiếu tạm'}
                        </Tag>
                      </div>
                    </div>

                    {/* Statistics Box */}
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-700">
                        <span>Tổng SL thực tế:</span>
                        <span className="font-mono font-medium text-slate-950">
                          {stocktakeEntryLines
                            .reduce((acc, curr) => acc + (Number(curr.actualQty) || 0), 0)
                            .toFixed(1)}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>Tổng SL lệch:</span>
                        <span
                          className={`font-mono font-medium ${
                            stocktakeEntryLines.reduce(
                              (acc, curr) => acc + ((Number(curr.actualQty) || 0) - (Number(curr.systemQty) || 0)),
                              0
                            ) !== 0
                              ? 'text-amber-600'
                              : 'text-slate-950'
                          }`}
                        >
                          {stocktakeEntryLines
                            .reduce(
                              (acc, curr) => acc + ((Number(curr.actualQty) || 0) - (Number(curr.systemQty) || 0)),
                              0
                            )
                            .toFixed(1)}
                        </span>
                      </div>
                      <div className="flex justify-between text-emerald-700 pt-1 border-t border-slate-200">
                        <span>Tổng lệch tăng:</span>
                        <span className="font-mono font-medium">
                          +
                          {stocktakeEntryLines
                            .reduce((acc, curr) => {
                              const diff = (Number(curr.actualQty) || 0) - (Number(curr.systemQty) || 0);
                              return diff > 0 ? acc + diff : acc;
                            }, 0)
                            .toFixed(1)}
                        </span>
                      </div>
                      <div className="flex justify-between text-rose-600">
                        <span>Tổng lệch giảm:</span>
                        <span className="font-mono font-medium">
                          -
                          {stocktakeEntryLines
                            .reduce((acc, curr) => {
                              const diff = (Number(curr.actualQty) || 0) - (Number(curr.systemQty) || 0);
                              return diff < 0 ? acc + Math.abs(diff) : acc;
                            }, 0)
                            .toFixed(1)}
                        </span>
                      </div>
                    </div>

                    {/* Note Box */}
                    <div className="space-y-1">
                      <label className="text-slate-700 block text-xs font-normal">Ghi chú kiểm kho:</label>
                      <Input.TextArea
                        rows={3}
                        placeholder="Nhập ghi chú hoặc lý do chênh lệch..."
                        value={stocktakeNote}
                        onChange={(e) => setStocktakeNote(e.target.value)}
                        className="text-xs font-normal rounded-lg"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <Button
                        onClick={handleSaveDraftStocktake}
                        className="h-10 rounded-lg text-xs font-normal text-slate-700 hover:text-[#784e34] border-slate-300"
                      >
                        Lưu tạm
                      </Button>
                      <Button
                        type="primary"
                        onClick={handleCompleteStocktake}
                        className="h-10 rounded-lg text-xs font-normal bg-[#784e34] hover:!bg-[#5d371f] text-white shadow-none border-none"
                      >
                        Cân bằng kho
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 5: QUẢN LÝ NHÀ CUNG CẤP (DOMACO ACCOUNTING / CRM VENDOR MASTER) */}
            {warehouseSubTab === 'suppliers' && (
              <SuppliersTab
                suppliersList={suppliersList}
                setSuppliersList={setSuppliersList}
              />
            )}
          </div>

      {/* DRAWER: TẠO MỚI / CHỈNH SỬA KHO HÀNG (DOMACO POS WAREHOUSE DRAWER) */}
      <AdminFormDrawer
        open={showWarehouseModal}
        onClose={() => setShowWarehouseModal(false)}
        form={warehouseForm}
        isEditing={Boolean(editingWarehouse)}
        recordId={editingWarehouse?.code || editingWarehouse?.id}
        editTitle="Chỉnh sửa"
        createTitle="Thêm mới"
        size="default"
      >
        <Form
          form={warehouseForm}
          layout="vertical"
          onFinish={handleWarehouseFormSubmit}
          className="space-y-3"
        >
          <Form.Item
            label={<span className="text-xs font-semibold text-slate-700">Chi nhánh <span className="text-red-500">*</span></span>}
            name="branch"
            rules={[{ required: true, message: 'Chọn chi nhánh' }]}
          >
            <Select
              className="h-9 rounded-lg text-xs sm:text-sm"
              placeholder="Chọn chi nhánh..."
              options={branchesList.map((b) => ({ value: b.name, label: b.name }))}
            />
          </Form.Item>

          <Form.Item
            label={<span className="text-xs font-semibold text-slate-700">Mã số kho <span className="text-red-500">*</span></span>}
            name="code"
            rules={[{ required: true, message: 'Nhập mã kho' }]}
          >
            <Input
              className="h-9 rounded-lg text-xs sm:text-sm font-mono uppercase font-semibold"
              placeholder="Tự động hoặc nhập tay"
              suffix={
                <button
                  type="button"
                  onClick={handleGenerateWarehouseCode}
                  className="text-[#784e34] hover:text-[#5d371f] border-none bg-transparent cursor-pointer p-0.5 inline-flex items-center"
                  title="Tự động tạo mã"
                >
                  <ThunderboltOutlined className="text-sm" />
                </button>
              }
            />
          </Form.Item>

          <Form.Item
            label={<span className="text-xs font-semibold text-slate-700">Tên kho lưu trữ <span className="text-red-500">*</span></span>}
            name="name"
            rules={[{ required: true, message: 'Nhập tên kho' }]}
          >
            <Input className="h-9 rounded-lg text-xs sm:text-sm" placeholder="VD: Tổng Kho Bình Chánh..." />
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

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                label={<span className="text-xs font-semibold text-slate-700">Xã / Phường</span>}
                name="district"
              >
                <Input className="h-9 rounded-lg text-xs sm:text-sm" placeholder="Chọn xã/phường..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={<span className="text-xs font-semibold text-slate-700">Tỉnh / Thành phố</span>}
                name="province"
              >
                <Select
                  className="h-9 rounded-lg text-xs sm:text-sm"
                  placeholder="Chọn tỉnh..."
                  showSearch
                  options={VIETNAM_PROVINCES.map((p) => ({ value: p, label: p }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16} className="pt-2">
            <Col span={12}>
              <Form.Item
                label={<span className="text-xs font-semibold text-slate-700">Kho mặc định</span>}
                name="isDefault"
                valuePropName="checked"
              >
                <Switch checkedChildren="BẬT" unCheckedChildren="TẮT" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={<span className="text-xs font-semibold text-slate-700">Trạng thái hoạt động</span>}
                name="status"
                valuePropName="checked"
              >
                <Switch
                  checkedChildren="MỞ"
                  unCheckedChildren="KHÓA"
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </AdminFormDrawer>

      {/* DRAWER: TẠO PHIẾU KIỂM KHO MỚI */}
      <Drawer
        title={<span className="font-bold text-base text-[#1f1b19]">📋 Tạo phiếu kiểm kê kho mới</span>}
        open={showCreateSlipModal}
        onClose={() => setShowCreateSlipModal(false)}
        styles={{ wrapper: { width: 620, maxWidth: '100vw' } }}
        destroyOnHidden
        className="[&_.ant-drawer-header]:px-5 [&_.ant-drawer-header]:py-3.5 [&_.ant-drawer-header]:border-b [&_.ant-drawer-header]:border-slate-200 [&_.ant-drawer-body]:px-5 [&_.ant-drawer-body]:py-5 [&_.ant-drawer-footer]:px-5 [&_.ant-drawer-footer]:py-3 [&_.ant-drawer-footer]:border-t [&_.ant-drawer-footer]:border-slate-200"
        footer={
          <div className="flex items-center justify-between">
            <Button onClick={() => setShowCreateSlipModal(false)} className="h-9 px-4 text-xs font-semibold rounded-lg">
              Bỏ qua
            </Button>
            <Button
              type="primary"
              onClick={() => createSlipForm.submit()}
              className="h-9 px-5 bg-[#784e34] hover:!bg-[#5d371f] text-xs font-bold text-white rounded-lg border-none shadow-none"
            >
              Khởi tạo &amp; bắt đầu kiểm
            </Button>
          </div>
        }
      >
        <Form form={createSlipForm} layout="vertical" onFinish={handleCreateSlipSubmit} className="space-y-3 [&_.ant-form-item-label]:!pb-1 [&_.ant-form-item]:!mb-3">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label={<span className="text-xs font-semibold text-slate-800">Mã phiếu kiểm</span>} name="code" rules={[{ required: true }]}>
                <Input placeholder="VD: #KK-2026-10" className="h-9 font-mono text-xs" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={<span className="text-xs font-semibold text-slate-800">Người thực hiện</span>} name="creator" rules={[{ required: true }]}>
                <Input placeholder="VD: Nguyễn Văn Nam" className="h-9 text-xs" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label={<span className="text-xs font-semibold text-slate-800">Tên / Mục đích kiểm kê</span>} name="title" rules={[{ required: true }]}>
            <Input placeholder="VD: Phiên kiểm kê đối soát định kỳ kho gỗ &amp; thành phẩm" className="h-9 text-xs" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label={<span className="text-xs font-semibold text-slate-800">Phạm vi kiểm kê</span>} name="scope" initialValue="all">
                <Select
                  className="h-9 text-xs"
                  onChange={(val) => {
                    if (val === 'all') {
                      createSlipForm.setFieldsValue({ selectedItemIds: allAuditableStock.map((i) => i.id) });
                    } else if (val === 'sofa') {
                      createSlipForm.setFieldsValue({
                        selectedItemIds: allAuditableStock.filter((i) => i.name.toLowerCase().includes('sofa') || i.name.toLowerCase().includes('kệ')).map((i) => i.id),
                      });
                    } else if (val === 'dining') {
                      createSlipForm.setFieldsValue({
                        selectedItemIds: allAuditableStock.filter((i) => i.name.toLowerCase().includes('bàn') || i.name.toLowerCase().includes('ghế')).map((i) => i.id),
                      });
                    } else if (val === 'bedroom') {
                      createSlipForm.setFieldsValue({
                        selectedItemIds: allAuditableStock.filter((i) => i.name.toLowerCase().includes('giường') || i.name.toLowerCase().includes('tủ')).map((i) => i.id),
                      });
                    }
                  }}
                >
                  <Option value="all">Toàn bộ kho (Tất cả sản phẩm nội thất)</Option>
                  <Option value="sofa">Nhóm Sofa &amp; Bàn Trà</Option>
                  <Option value="dining">Nhóm Bàn Ghế Ăn</Option>
                  <Option value="bedroom">Nhóm Giường Tủ Phòng Ngủ</Option>
                  <Option value="custom">Tùy chọn danh sách mặt hàng cụ thể</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={<span className="text-xs font-semibold text-slate-800">Khởi tạo số lượng thực tế</span>} name="initMode" initialValue="system">
                <Select className="h-9 text-xs">
                  <Option value="system">Điền sẵn theo sổ sách (Đối soát nhanh)</Option>
                  <Option value="zero">Để trống = 0 (Bắt buộc kiểm đếm từ đầu)</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* CHỌN SẢN PHẨM KIỂM KÊ */}
          <div className="mb-4 bg-[#fcf9f6] p-3 rounded-lg border border-[#eae1dd]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2">
              <label className="text-xs font-semibold text-[#1f1b19] flex items-center gap-1.5">
                <span>📦 Danh sách sản phẩm nội thất cần kiểm</span>
              </label>
              <Space size="small" wrap>
                <Button
                  size="small"
                  type="link"
                  className="!p-0 text-xs !text-[#784e34] font-semibold"
                  onClick={() => {
                    const allIds = allAuditableStock.map((i) => i.id);
                    createSlipForm.setFieldsValue({ selectedItemIds: allIds, scope: 'all' });
                  }}
                >
                  Chọn tất cả ({allAuditableStock.length})
                </Button>
                <span className="text-[#d5c7c0]">|</span>
                <Button
                  size="small"
                  type="link"
                  className="!p-0 text-xs !text-[#784e34] font-medium"
                  onClick={() => {
                    const diningIds = allAuditableStock.filter((i) => i.name.toLowerCase().includes('bàn') || i.name.toLowerCase().includes('ghế')).map((i) => i.id);
                    createSlipForm.setFieldsValue({ selectedItemIds: diningIds, scope: 'dining' });
                  }}
                >
                  Bàn ghế ăn ({allAuditableStock.filter((i) => i.name.toLowerCase().includes('bàn') || i.name.toLowerCase().includes('ghế')).length})
                </Button>
                <span className="text-[#d5c7c0]">|</span>
                <Button
                  size="small"
                  type="link"
                  className="!p-0 text-xs !text-[#784e34] font-medium"
                  onClick={() => {
                    const sofaIds = allAuditableStock.filter((i) => i.name.toLowerCase().includes('sofa') || i.name.toLowerCase().includes('kệ')).map((i) => i.id);
                    createSlipForm.setFieldsValue({ selectedItemIds: sofaIds, scope: 'sofa' });
                  }}
                >
                  Sofa &amp; Phòng khách ({allAuditableStock.filter((i) => i.name.toLowerCase().includes('sofa') || i.name.toLowerCase().includes('kệ')).length})
                </Button>
                <span className="text-[#d5c7c0]">|</span>
                <Button
                  size="small"
                  type="link"
                  className="!p-0 text-xs !text-red-600 font-medium"
                  onClick={() => {
                    createSlipForm.setFieldsValue({ selectedItemIds: [], scope: 'custom' });
                  }}
                >
                  Bỏ chọn hết
                </Button>
              </Space>
            </div>

            <Form.Item
              name="selectedItemIds"
              rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 sản phẩm nội thất để kiểm kê' }]}
              className="!mb-1"
            >
              <Select
                mode="multiple"
                placeholder="Tìm và chọn các sản phẩm nội thất cần đưa vào đợt kiểm..."
                className="w-full text-xs"
                maxTagCount="responsive"
                optionFilterProp="label"
                showSearch
                style={{ width: '100%' }}
              >
                {allAuditableStock.map((item) => (
                  <Option key={item.id} value={item.id} label={`${item.code} - ${item.name}`}>
                    <div className="flex items-center justify-between py-0.5">
                      <div className="flex items-center gap-2">
                        <Tag color="blue" className="!mr-0 font-mono text-[10px]">
                          🪑 Thành phẩm
                        </Tag>
                        <span className="font-semibold text-xs text-[#1f1b19] font-mono">{item.code}</span>
                        <span className="text-xs text-[#443831] truncate max-w-[280px]">{item.name}</span>
                      </div>
                      <div className="text-[11px] text-[#83746c] ml-2 shrink-0 font-medium">
                        Sổ sách: <span className="font-bold text-[#1f1b19]">{item.systemQty} {item.unit}</span>
                      </div>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <div className="text-[11px] text-[#83746c] mt-1.5">
              <span>💡 Tìm kiếm nhanh theo mã SKU, tên sản phẩm hoặc bộ sưu tập</span>
            </div>
          </div>

          <Form.Item label={<span className="text-xs font-semibold text-slate-800">Ghi chú kiểm kê</span>} name="note" initialValue="Kiểm kê đối soát định kỳ kho showroom">
            <Input.TextArea rows={2} className="text-xs" />
          </Form.Item>
        </Form>
      </Drawer>

      {/* DRAWER: THÊM DÒNG VÀO PHIẾU KIỂM */}
      <Drawer
        title={<span className="font-bold text-base text-[#1f1b19]">📝 Thêm Dòng Vào Phiếu Kiểm</span>}
        open={showAddItemModal}
        onClose={() => setShowAddItemModal(false)}
        styles={{ wrapper: { width: 560, maxWidth: '100vw' } }}
        destroyOnHidden
        className="[&_.ant-drawer-header]:px-5 [&_.ant-drawer-header]:py-3.5 [&_.ant-drawer-header]:border-b [&_.ant-drawer-header]:border-slate-200 [&_.ant-drawer-body]:px-5 [&_.ant-drawer-body]:py-5 [&_.ant-drawer-footer]:px-5 [&_.ant-drawer-footer]:py-3 [&_.ant-drawer-footer]:border-t [&_.ant-drawer-footer]:border-slate-200"
        footer={
          <div className="flex items-center justify-between">
            <Button onClick={() => setShowAddItemModal(false)} className="h-9 px-4 text-xs font-semibold rounded-lg">
              Bỏ qua
            </Button>
            <Button
              type="primary"
              onClick={() => addItemForm.submit()}
              className="h-9 px-5 bg-[#784e34] hover:!bg-[#5d371f] text-xs font-bold text-white rounded-lg border-none shadow-none"
            >
              Bổ Sung Vào Phiếu
            </Button>
          </div>
        }
      >
        <Form form={addItemForm} layout="vertical" onFinish={handleAddItemSubmit} className="space-y-3 [&_.ant-form-item-label]:!pb-1 [&_.ant-form-item]:!mb-3">
          {/* QUICK SELECTOR FROM INVENTORY */}
          <div className="mb-3 bg-[#fcf9f6] p-2.5 rounded-lg border border-[#eae1dd]">
            <label className="text-xs font-bold text-[#1f1b19] block mb-1.5">
              🔍 Chọn nhanh sản phẩm nội thất từ kho (Tự động điền thông tin):
            </label>
            <Select
              placeholder="-- Chọn sản phẩm nội thất từ kho để tự điền --"
              className="w-full text-xs"
              showSearch
              optionFilterProp="label"
              allowClear
              onChange={(val) => {
                const found = allAuditableStock.find((i) => i.id === val);
                if (found) {
                  addItemForm.setFieldsValue({
                    code: found.code,
                    name: found.name,
                    type: found.type,
                    location: found.location,
                    systemQty: found.systemQty,
                    actualQty: found.systemQty,
                    actualMc: found.systemMc || 'Đạt chuẩn',
                    qualityNote: found.qualityNote,
                  });
                }
              }}
            >
              {allAuditableStock.map((item) => (
                <Option key={item.id} value={item.id} label={`${item.code} ${item.name}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#784e34]">[{item.code}]</span>
                    <span className="text-xs text-[#1f1b19] truncate ml-2 flex-1">{item.name}</span>
                    <Tag color="blue" className="!mr-0 text-[10px] ml-2">
                      SP ({item.systemQty} {item.unit})
                    </Tag>
                  </div>
                </Option>
              ))}
            </Select>
          </div>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label={<span className="text-xs font-semibold text-slate-800">Mã sản phẩm / SKU</span>} name="code" rules={[{ required: true }]}>
                <Input placeholder="VD: MG-TB-08" className="h-9 font-mono text-xs uppercase" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={<span className="text-xs font-semibold text-slate-800">Phân loại hàng hóa</span>} name="type" initialValue="product">
                <Select className="h-9 text-xs">
                  <Option value="product">Sản phẩm nội thất (chiếc/bộ)</Option>
                  <Option value="accessory">Phụ kiện &amp; Decor (chiếc)</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label={<span className="text-xs font-semibold text-slate-800">Tên sản phẩm &amp; Bộ sưu tập</span>} name="name" rules={[{ required: true }]}>
            <Input placeholder="VD: Bàn Ăn Komorebi 2.8m Gỗ Óc Chó FAS" className="h-9 text-xs" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label={<span className="text-xs font-semibold text-slate-800">Sổ sách HT</span>} name="systemQty" initialValue={5} rules={[{ required: true }]}>
                <InputNumber className="w-full h-9 text-xs" min={0} step={1} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label={<span className="text-xs font-semibold text-slate-800">Thực tế đếm</span>} name="actualQty" initialValue={5} rules={[{ required: true }]}>
                <InputNumber className="w-full h-9 text-xs" min={0} step={1} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label={<span className="text-xs font-semibold text-slate-800">Chất lượng KCS</span>} name="actualMc" initialValue="Đạt chuẩn">
                <Input className="h-9 text-xs" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label={<span className="text-xs font-semibold text-slate-800">Ghi chú chất lượng &amp; Vị trí</span>} name="qualityNote">
            <Input placeholder="VD: Bề mặt phẳng phiu, khu vực kệ D-01" className="h-9 text-xs" />
          </Form.Item>
        </Form>
      </Drawer>

      {/* DRAWER: TẠO PHIẾU CHUYỂN KHO (DOMACO STOCK TRANSFER) */}
      <Drawer
        title={<span className="font-bold text-base text-[#1f1b19]">🔄 Tạo Phiếu Điều Chuyển Kho Nội Bộ</span>}
        open={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        styles={{ wrapper: { width: 560, maxWidth: '100vw' } }}
        destroyOnHidden
        className="[&_.ant-drawer-header]:px-5 [&_.ant-drawer-header]:py-3.5 [&_.ant-drawer-header]:border-b [&_.ant-drawer-header]:border-slate-200 [&_.ant-drawer-body]:px-5 [&_.ant-drawer-body]:py-5 [&_.ant-drawer-footer]:px-5 [&_.ant-drawer-footer]:py-3 [&_.ant-drawer-footer]:border-t [&_.ant-drawer-footer]:border-slate-200"
        footer={
          <div className="flex items-center justify-between">
            <Button onClick={() => setShowTransferModal(false)} className="h-9 px-4 text-xs font-semibold rounded-lg">
              Bỏ qua
            </Button>
            <Button
              type="primary"
              onClick={() => transferForm.submit()}
              className="h-9 px-5 bg-[#784e34] hover:!bg-[#5d371f] text-xs font-bold text-white rounded-lg border-none shadow-none"
            >
              Xác nhận tạo phiếu chuyển
            </Button>
          </div>
        }
      >
        <Form
          form={transferForm}
          layout="vertical"
          onFinish={handleTransferSubmit}
          className="space-y-3 [&_.ant-form-item-label]:!pb-1 [&_.ant-form-item]:!mb-3"
        >
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                label={<span className="text-xs font-semibold text-slate-800">Kho xuất hàng</span>}
                name="fromWarehouse"
                rules={[{ required: true, message: 'Chọn kho xuất' }]}
              >
                <Select className="h-9 text-xs">
                  {warehousesList.map((w) => (
                    <Option key={w.id} value={w.name}>
                      {w.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={<span className="text-xs font-semibold text-slate-800">Kho nhập nhận</span>}
                name="toWarehouse"
                rules={[{ required: true, message: 'Chọn kho nhận' }]}
              >
                <Select className="h-9 text-xs">
                  {warehousesList.map((w) => (
                    <Option key={w.id} value={w.name}>
                      {w.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label={<span className="text-xs font-semibold text-slate-800">Chi tiết sản phẩm nội thất điều chuyển</span>}
            name="itemSummary"
            rules={[{ required: true, message: 'Nhập chi tiết sản phẩm điều chuyển' }]}
          >
            <Input placeholder="VD: 03 Bộ Sofa Kyoto hoặc 05 Bàn Ăn Komorebi" className="h-9 text-xs" />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                label={<span className="text-xs font-semibold text-slate-800">Số lượng điều chuyển</span>}
                name="totalQuantity"
                rules={[{ required: true, message: 'Nhập số lượng' }]}
              >
                <InputNumber className="w-full h-9 text-xs font-mono font-bold" min={1} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={<span className="text-xs font-semibold text-slate-800">Lý do điều chuyển</span>}
                name="note"
              >
                <Input placeholder="VD: Bổ sung phục vụ đơn may đo" className="h-9 text-xs" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Drawer>



      {/* DRAWER IN PHIẾU XUẤT TRẢ HÀNG CHO NHÀ CUNG CẤP (DOMACO POS PRINT PURCHASE RETURN RECEIPT) */}
      <Drawer
        open={!!selectedReturnSlipForPrint}
        onClose={() => setSelectedReturnSlipForPrint(null)}
        styles={{ wrapper: { width: 820, maxWidth: '100vw' } }}
        destroyOnHidden
        title={
          <div className="flex items-center gap-2">
            <PrinterOutlined className="text-rose-700 text-lg" />
            <span className="text-sm font-bold text-slate-900">
              In phiếu xuất trả hàng NCC {selectedReturnSlipForPrint ? `(${selectedReturnSlipForPrint.code})` : ''}
            </span>
          </div>
        }
        extra={
          <Space>
            <Button
              icon={<FileExcelOutlined />}
              onClick={() => {
                if (selectedReturnSlipForPrint) {
                  handleExportSingleReturnDetail(selectedReturnSlipForPrint);
                }
              }}
              className="h-8 rounded-lg border-emerald-600 text-emerald-700 bg-emerald-50/50 hover:!bg-emerald-100 hover:!border-emerald-700 text-xs font-semibold"
            >
              Xuất Excel
            </Button>
            <Button
              type="primary"
              icon={<PrinterOutlined />}
              className="h-8 rounded-lg !bg-rose-700 !border-rose-700 text-xs font-semibold"
              onClick={() => {
                if (selectedReturnSlipForPrint) {
                  printGoodsReturnSlip(selectedReturnSlipForPrint);
                }
              }}
            >
              In Phiếu (Print)
            </Button>
          </Space>
        }
        footer={
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 italic">
              Xem trước mẫu phiếu in khổ A4 chuẩn POS Nội Thất Mộc Gia
            </span>
            <Button onClick={() => setSelectedReturnSlipForPrint(null)}>
              Đóng
            </Button>
          </div>
        }
      >
        {selectedReturnSlipForPrint && (
          <div className="p-4 bg-white text-slate-900 printable-slip rounded-xl border border-slate-200 shadow-xs" id="print-return-slip">
            {/* Title */}
            <div className="text-center mb-5 pb-3 border-b border-slate-200">
              <h1 className="text-xl font-bold text-slate-900 uppercase tracking-wide m-0">
                PHIẾU TRẢ HÀNG NHẬP / XUẤT TRẢ NHÀ CUNG CẤP
              </h1>
              <span className="text-xs text-slate-500 italic block mt-0.5">
                (Goods Return Note / Purchase Return Voucher)
              </span>
              <div className="flex items-center justify-center gap-4 text-xs mt-2 text-slate-600">
                <span>Mã phiếu: <strong className="font-mono text-rose-700 font-bold">{selectedReturnSlipForPrint.code}</strong></span>
                <span>•</span>
                <span>Ngày lập: <strong>{selectedReturnSlipForPrint.returnDate}</strong></span>
              </div>
            </div>

            {/* Info */}
            <div className="grid grid-cols-2 gap-4 text-xs mb-5 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-500">Nhà cung cấp nhận hoàn trả: </span>
                <span className="font-bold text-slate-900">{selectedReturnSlipForPrint.supplierName}</span>
              </div>
              <div>
                <span className="text-slate-500">Phiếu nhập gốc liên kết: </span>
                <span className="font-mono font-bold text-[#784e34]">
                  {selectedReturnSlipForPrint.sourcePurchaseEntryCode || '---'}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Kho xuất trả: </span>
                <span className="font-bold text-[#784e34]">
                  {selectedReturnSlipForPrint.warehouseName || 'Tổng Kho Bình Chánh'}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Người lập phiếu: </span>
                <span className="font-semibold text-slate-800">
                  {selectedReturnSlipForPrint.staffName || 'Nguyễn Văn Nam (KCS)'}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Phương án giải quyết: </span>
                <span className="font-bold text-slate-900">
                  {selectedReturnSlipForPrint.solution || selectedReturnSlipForPrint.statusLabel}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Hình thức hoàn tiền: </span>
                <span className="font-semibold text-slate-800">
                  {selectedReturnSlipForPrint.paymentMethod || 'Chuyển khoản'}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500">Lý do hoàn trả: </span>
                <span className="font-semibold text-rose-800 italic">{selectedReturnSlipForPrint.reason}</span>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full border-collapse border border-slate-300 text-xs mb-4">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold">
                  <th className="border border-slate-300 p-2 text-center w-12">STT</th>
                  <th className="border border-slate-300 p-2 text-left">Tên mặt hàng &amp; Quy cách hoàn trả</th>
                  <th className="border border-slate-300 p-2 text-center w-20">ĐVT</th>
                  <th className="border border-slate-300 p-2 text-right w-24">Số lượng</th>
                  <th className="border border-slate-300 p-2 text-right w-32">Giá trả lại</th>
                  <th className="border border-slate-300 p-2 text-right w-36">Tổng thành tiền</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 p-2.5 text-center font-mono font-semibold">01</td>
                  <td className="border border-slate-300 p-2.5 font-semibold text-slate-900">
                    <div>{selectedReturnSlipForPrint.itemName}</div>
                    {selectedReturnSlipForPrint.spec && (
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">{selectedReturnSlipForPrint.spec}</div>
                    )}
                  </td>
                  <td className="border border-slate-300 p-2.5 text-center">{selectedReturnSlipForPrint.unit}</td>
                  <td className="border border-slate-300 p-2.5 text-right font-mono font-bold text-slate-900">
                    {selectedReturnSlipForPrint.quantity}
                  </td>
                  <td className="border border-slate-300 p-2.5 text-right font-mono text-slate-700">
                    {(selectedReturnSlipForPrint.returnPrice || selectedReturnSlipForPrint.purchasePrice || 0).toLocaleString('vi-VN')} đ
                  </td>
                  <td className="border border-slate-300 p-2.5 text-right font-mono font-bold text-rose-700">
                    {(selectedReturnSlipForPrint.totalGoods || 0).toLocaleString('vi-VN')} đ
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold">
                  <td colSpan={5} className="border border-slate-300 p-2.5 text-right text-slate-800">
                    Tổng tiền hàng xuất trả:
                  </td>
                  <td className="border border-slate-300 p-2.5 text-right font-mono text-xs text-slate-900">
                    {(selectedReturnSlipForPrint.totalGoods || 0).toLocaleString('vi-VN')} đ
                  </td>
                </tr>
                {Boolean(selectedReturnSlipForPrint.invoiceDiscount) && (
                  <tr className="bg-slate-50 font-bold">
                    <td colSpan={5} className="border border-slate-300 p-2.5 text-right text-slate-600">
                      Giảm giá:
                    </td>
                    <td className="border border-slate-300 p-2.5 text-right font-mono text-xs text-slate-600">
                      {(selectedReturnSlipForPrint.invoiceDiscount || 0).toLocaleString('vi-VN')} đ
                    </td>
                  </tr>
                )}
                <tr className="bg-rose-50/50 font-bold">
                  <td colSpan={5} className="border border-slate-300 p-2.5 text-right text-rose-800">
                    NCC cần hoàn trả / cấn trừ:
                  </td>
                  <td className="border border-slate-300 p-2.5 text-right font-mono text-sm text-rose-700">
                    {(selectedReturnSlipForPrint.supplierRefund || selectedReturnSlipForPrint.totalGoods || 0).toLocaleString('vi-VN')} đ
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Note */}
            <div className="text-xs text-slate-600 mb-8 italic">
              * Ghi chú: Mặt hàng đã được bộ phận KCS và Quản lý kho Mộc Gia kiểm định không đạt tiêu chuẩn kỹ thuật hoặc sai quy cách hợp đồng. Đã cấn trừ công nợ hoặc hoàn bù theo thỏa thuận với nhà cung cấp.
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs mt-6 pt-4 border-t border-slate-200">
              <div>
                <div className="font-bold text-slate-800 uppercase">Người lập phiếu</div>
                <div className="text-[11px] text-slate-400 italic">(Ký, ghi rõ họ tên)</div>
                <div className="h-16"></div>
                <div className="font-semibold text-slate-700">{selectedReturnSlipForPrint.staffName || 'Nguyễn Văn Nam'}</div>
              </div>
              <div>
                <div className="font-bold text-slate-800 uppercase">Thủ kho xuất</div>
                <div className="text-[11px] text-slate-400 italic">(Ký, ghi rõ họ tên)</div>
                <div className="h-16"></div>
                <div className="font-semibold text-slate-700">Phạm Văn Tuấn</div>
              </div>
              <div>
                <div className="font-bold text-slate-800 uppercase">KCS / Kiểm định</div>
                <div className="text-[11px] text-slate-400 italic">(Ký, ghi rõ họ tên)</div>
                <div className="h-16"></div>
                <div className="font-semibold text-slate-700">Nguyễn Đình Bảo</div>
              </div>
              <div>
                <div className="font-bold text-slate-800 uppercase">Đại diện NCC</div>
                <div className="text-[11px] text-slate-400 italic">(Ký, đóng dấu)</div>
                <div className="h-16"></div>
                <div className="font-semibold text-slate-700">{selectedReturnSlipForPrint.supplierName}</div>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* DRAWER IN PHIẾU NHẬP KHO HÀNG HÓA */}
      <Drawer
        open={!!selectedImportSlipForPrint}
        onClose={() => setSelectedImportSlipForPrint(null)}
        styles={{ wrapper: { width: 820, maxWidth: '100vw' } }}
        destroyOnHidden
        title={
          <div className="flex items-center gap-2">
            <PrinterOutlined className="text-[#784e34] text-lg" />
            <span className="text-sm font-bold text-slate-900">
              In phiếu nhập kho hàng hóa {selectedImportSlipForPrint ? `(${selectedImportSlipForPrint.code})` : ''}
            </span>
          </div>
        }
        extra={
          <Space>
            <Button
              icon={<FileExcelOutlined />}
              onClick={() => {
                if (selectedImportSlipForPrint) {
                  handleExportSingleImportDetail(selectedImportSlipForPrint);
                }
              }}
              className="h-8 rounded-lg border-emerald-600 text-emerald-700 bg-emerald-50/50 hover:!bg-emerald-100 hover:!border-emerald-700 text-xs font-semibold"
            >
              Xuất Excel
            </Button>
            <Button
              type="primary"
              icon={<PrinterOutlined />}
              className="h-8 rounded-lg !bg-[#784e34] !border-[#784e34] text-xs font-semibold"
              onClick={() => {
                if (selectedImportSlipForPrint) {
                  printGoodsReceiptSlip(selectedImportSlipForPrint);
                }
              }}
            >
              In Phiếu (Print)
            </Button>
          </Space>
        }
        footer={
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 italic">
              Xem trước mẫu phiếu in khổ A4 chuẩn POS Nội Thất Mộc Gia
            </span>
            <Button onClick={() => setSelectedImportSlipForPrint(null)}>
              Đóng
            </Button>
          </div>
        }
      >
        {selectedImportSlipForPrint && (
          <div className="p-4 bg-white text-slate-900 printable-slip rounded-xl border border-slate-200 shadow-xs" id="print-import-slip">
            {/* Title */}
            <div className="text-center mb-5 pb-3 border-b border-slate-200">
              <h1 className="text-xl font-bold text-slate-900 uppercase tracking-wide m-0">
                PHIẾU NHẬP KHO HÀNG HÓA
              </h1>
              <span className="text-xs text-slate-500 italic block mt-0.5">
                (Goods Receipt Note / Stock Inward Slip)
              </span>
              <div className="flex items-center justify-center gap-4 text-xs mt-2 text-slate-600">
                <span>Mã phiếu: <strong className="font-mono text-[#784e34] font-bold">{selectedImportSlipForPrint.code}</strong></span>
                <span>•</span>
                <span>Ngày nhập: <strong>{selectedImportSlipForPrint.importDate}</strong></span>
              </div>
            </div>

            {/* Info */}
            <div className="grid grid-cols-2 gap-4 text-xs mb-5 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-500">Nhà cung cấp đối tác: </span>
                <span className="font-bold text-slate-900">{selectedImportSlipForPrint.supplier}</span>
              </div>
              <div>
                <span className="text-slate-500">Kho tiếp nhận: </span>
                <span className="font-bold text-[#784e34]">{selectedImportSlipForPrint.warehouseName}</span>
              </div>
              <div>
                <span className="text-slate-500">Cán bộ phụ trách KCS / Nhận hàng: </span>
                <span className="font-semibold text-slate-800">{selectedImportSlipForPrint.inspector}</span>
              </div>
              <div>
                <span className="text-slate-500">Hình thức thanh toán: </span>
                <span className="font-semibold text-slate-800">
                  {selectedImportSlipForPrint.paymentMethod || 'Chuyển khoản'}
                </span>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full border-collapse border border-slate-300 text-xs mb-4">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold">
                  <th className="border border-slate-300 p-2 text-center w-12">STT</th>
                  <th className="border border-slate-300 p-2 text-left">Tên hàng hóa / Sản phẩm</th>
                  <th className="border border-slate-300 p-2 text-left">Quy cách / Phân loại</th>
                  <th className="border border-slate-300 p-2 text-center w-24">Số lượng</th>
                  <th className="border border-slate-300 p-2 text-center w-20">Đơn vị</th>
                  <th className="border border-slate-300 p-2 text-right w-36">Tổng thành tiền</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 p-2.5 text-center font-mono font-semibold">01</td>
                  <td className="border border-slate-300 p-2.5 font-bold text-slate-900">
                    {selectedImportSlipForPrint.itemName}
                  </td>
                  <td className="border border-slate-300 p-2.5 text-slate-600 font-mono text-[11px]">
                    {selectedImportSlipForPrint.spec || 'Quy cách chuẩn thương mại'}
                  </td>
                  <td className="border border-slate-300 p-2.5 text-center font-mono font-bold text-slate-900">
                    {selectedImportSlipForPrint.quantity}
                  </td>
                  <td className="border border-slate-300 p-2.5 text-center">{selectedImportSlipForPrint.unit}</td>
                  <td className="border border-slate-300 p-2.5 text-right font-mono font-bold text-[#784e34]">
                    {selectedImportSlipForPrint.totalValue.toLocaleString('vi-VN')} đ
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold">
                  <td colSpan={5} className="border border-slate-300 p-2.5 text-right text-slate-800">
                    Tổng giá trị nhập kho (đã nghiệm thu):
                  </td>
                  <td className="border border-slate-300 p-2.5 text-right font-mono text-sm text-[#784e34]">
                    {selectedImportSlipForPrint.totalValue.toLocaleString('vi-VN')} đ
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Note */}
            <div className="text-xs text-slate-600 mb-8 italic">
              * Lô hàng mới 100% nguyên đai nguyên kiện, đã đối chiếu quy cách và phụ kiện đạt chuẩn trước khi nhập kho.
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs mt-6 pt-4 border-t border-slate-200">
              <div>
                <div className="font-bold text-slate-800 uppercase">Người lập phiếu</div>
                <div className="text-[11px] text-slate-400 italic">(Ký, ghi rõ họ tên)</div>
                <div className="h-16"></div>
                <div className="font-semibold text-slate-700">Trần Minh Quân</div>
              </div>
              <div>
                <div className="font-bold text-slate-800 uppercase">Thủ kho nhập</div>
                <div className="text-[11px] text-slate-400 italic">(Ký, ghi rõ họ tên)</div>
                <div className="h-16"></div>
                <div className="font-semibold text-slate-700">Phạm Văn Tuấn</div>
              </div>
              <div>
                <div className="font-bold text-slate-800 uppercase">Kỹ thuật KCS</div>
                <div className="text-[11px] text-slate-400 italic">(Ký, ghi rõ họ tên)</div>
                <div className="h-16"></div>
                <div className="font-semibold text-slate-700">{selectedImportSlipForPrint.inspector}</div>
              </div>
              <div>
                <div className="font-bold text-slate-800 uppercase">Đại diện Giao hàng</div>
                <div className="text-[11px] text-slate-400 italic">(Ký, ghi rõ họ tên)</div>
                <div className="h-16"></div>
                <div className="font-semibold text-slate-700">{selectedImportSlipForPrint.supplier}</div>
              </div>
            </div>
          </div>
        )}
      </Drawer>

    </>
  );
}

export default WorkshopTab;
