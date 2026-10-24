'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  CrownOutlined,
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
  PosEntryLayout,
  PosEntryHeader,
  PosEntryItemsCard,
  PosEntrySidebar,
  AutoCodeButton,
  getNextCode,
} from '@/components/admin';
import {
  AdminWarehouse,
  StockImportSlip,
  StockImportSlipItem,
  StockImportPaymentHistory,
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
import {
  StockImportCreate,
  SupplierReturnCreate,
  StocktakeCreate,
} from './workshop';
import { isMatchBranch, isProductInBranch, getProductStockForBranch } from '@/utils/branchHelper';
import {
  printElementById,
  printStocktakeSlip,
  printGoodsReceiptSlip,
  printGoodsReturnSlip,
} from '@/utils/printHelper';
import { warehouseApi } from '@/api/warehouseApi';
import { locationApi, LocationItem, ProvinceItem } from '@/api/locationApi';
import { stockImportApi } from '@/api/stockImportApi';
import { supplierReturnApi } from '@/api/supplierReturnApi';
import { stockAuditApi } from '@/api/stockAuditApi';
import { productApi } from '@/api/productApi';
import { invalidateApiCache } from '@/api/shared/apiCache';
import {
  ADMIN_STORAGE_KEYS,
  getStoredAdminData,
  setStoredAdminData,
} from '@/utils/adminStorage';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

const formatInputMoney = (value: number | string | undefined | null) => {
  if (value === undefined || value === null || value === '') return '';
  const clean = String(value).replace(/\./g, '').replace(/,/g, '');
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const parseInputMoney = (value: string | undefined | null) => {
  if (!value) return '' as unknown as number;
  return String(value).replace(/\./g, '').replace(/,/g, '') as unknown as number;
};

export interface WorkshopTabProps {
  catalogList?: FeaturedCatalogProduct[];
  setCatalogList?: React.Dispatch<React.SetStateAction<FeaturedCatalogProduct[]>>;
  suppliersList?: AdminSupplier[];
  setSuppliersList?: React.Dispatch<React.SetStateAction<AdminSupplier[]>>;
  branchesList?: AdminBranch[];
  selectedGlobalBranch?: string;
  initialSubTab?: 'imports' | 'returns' | 'stocktake' | 'suppliers' | 'warehouses';
  initialImportMode?: 'list' | 'create';
  initialImportProduct?: FeaturedCatalogProduct | null;
  onClearInitialImportProduct?: () => void;
  onNavigateToProduct?: (productCodeOrName: string) => void;
}

export function WorkshopTab({
  catalogList = FEATURED_CATALOG,
  setCatalogList,
  suppliersList = INITIAL_SUPPLIERS,
  setSuppliersList,
  branchesList = INITIAL_BRANCHES,
  selectedGlobalBranch = 'all',
  initialSubTab = 'imports',
  initialImportMode = 'list',
  initialImportProduct = null,
  onClearInitialImportProduct,
  onNavigateToProduct,
}: WorkshopTabProps) {
  const { message } = App.useApp();
  const { user } = useAuth();

  // Sub-Tab Switcher State
  const [warehouseSubTab, setWarehouseSubTab] = useState<'warehouses' | 'imports' | 'returns' | 'stocktake' | 'suppliers'>(
    initialSubTab === 'warehouses' ? 'imports' : (initialSubTab || 'imports')
  );

  useEffect(() => {
    if (initialSubTab) {
      setWarehouseSubTab(initialSubTab === 'warehouses' ? 'imports' : initialSubTab);
    }
  }, [initialSubTab]);

  const handleSubTabChange = (val: 'warehouses' | 'imports' | 'returns' | 'stocktake' | 'suppliers') => {
    setWarehouseSubTab(val);
    setStocktakeViewMode('list');
    setImportViewMode('list');
    setReturnViewMode('list');
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('subTab', val);
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Warehouses State
  const [warehousesList, setWarehousesList] = useState<AdminWarehouse[]>([]);
  const [selectedWarehouseKeys, setSelectedWarehouseKeys] = useState<React.Key[]>([]);
  const [warehouseSearchQuery, setWarehouseSearchQuery] = useState('');
  const [warehouseBranchFilter, setWarehouseBranchFilter] = useState('all');
  const [warehouseStatusFilter, setWarehouseStatusFilter] = useState('all');
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<AdminWarehouse | null>(null);
  const [warehouseForm] = Form.useForm();
  const selectedWarehouseProvince = Form.useWatch('province', warehouseForm);
  const selectedWarehouseDistrict = Form.useWatch('district', warehouseForm);
  const selectedWarehouseIsDefault = Form.useWatch('isDefault', warehouseForm);

  const [provincesList, setProvincesList] = useState<ProvinceItem[]>([]);
  const [districtOptions, setDistrictOptions] = useState<LocationItem[]>([]);
  const [wardOptions, setWardOptions] = useState<LocationItem[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  useEffect(() => {
    locationApi.getProvinces().then((data) => {
      setProvincesList(data);
    });
  }, []);

  useEffect(() => {
    if (!selectedWarehouseProvince) {
      setDistrictOptions([]);
      setWardOptions([]);
      return;
    }
    setLoadingDistricts(true);
    locationApi.getDistrictsByProvince(selectedWarehouseProvince)
      .then((districts) => {
        setDistrictOptions(districts);
      })
      .finally(() => {
        setLoadingDistricts(false);
      });
  }, [selectedWarehouseProvince]);

  useEffect(() => {
    if (!selectedWarehouseDistrict || !selectedWarehouseProvince) {
      setWardOptions([]);
      return;
    }
    setLoadingWards(true);
    locationApi.getWardsByDistrict(selectedWarehouseDistrict, selectedWarehouseProvince)
      .then((wards) => {
        setWardOptions(wards);
      })
      .finally(() => {
        setLoadingWards(false);
      });
  }, [selectedWarehouseDistrict, selectedWarehouseProvince]);

  const selectedWarehouseRecord = warehousesList.find((w) => selectedWarehouseKeys.includes(w.id));

  const loadWarehousesFromApi = async () => {
    try {
      const data = await warehouseApi.getWarehouses();
      const list = data || [];
      setWarehousesList(list);
      setStoredAdminData(ADMIN_STORAGE_KEYS.WAREHOUSES, list);
    } catch (err: any) {
      console.warn('Could not load warehouses from API:', err);
    }
  };

  const refreshCatalogProducts = useCallback(async () => {
    try {
      invalidateApiCache('products');
      const targetBranch = selectedGlobalBranch !== 'all' ? selectedGlobalBranch : undefined;
      const prods = await productApi.getProducts({
        branch: targetBranch,
        pageSize: 0,
      });
      if (prods && Array.isArray(prods)) {
        const filtered = targetBranch
          ? prods.filter((p) => isProductInBranch(p, targetBranch, warehousesList))
          : prods;
        setDbProducts(filtered);
        if (setCatalogList) {
          setCatalogList(filtered);
        }
      }
    } catch (e) {
      console.warn('Could not refresh catalog products:', e);
    }
  }, [selectedGlobalBranch, warehousesList, setCatalogList]);

  const loadImportsFromApi = async () => {
    try {
      const data = await stockImportApi.getStockImports();
      if (data && Array.isArray(data)) {
        const mapped: StockImportSlip[] = data.map((d) => {
          let parsedItems: StockImportSlipItem[] = [];
          if (d.itemsJson) {
            try {
              parsedItems = JSON.parse(d.itemsJson);
            } catch {
              parsedItems = [];
            }
          }
          if (parsedItems.length === 0 && d.itemName) {
            parsedItems = [
              {
                id: `line_${d.id}`,
                code: d.code || 'SP0001',
                name: d.itemName,
                unit: d.unit || 'bộ',
                batch: '---',
                expiryDate: '---',
                quantity: d.quantity || 1,
                unitPrice: d.unitPrice || 0,
                discount: d.discount || 0,
                importPrice: d.unitPrice || 0,
                total: d.totalValue || ((d.quantity || 1) * (d.unitPrice || 0)),
              },
            ];
          }
          return {
            id: d.id,
            code: d.code,
            supplier: d.supplier,
            supplierId: d.supplierId,
            warehouseName: d.warehouseName,
            warehouseId: d.warehouseId,
            itemName: d.itemName,
            spec: d.spec || '',
            quantity: d.quantity,
            unitPrice: d.unitPrice,
            unit: d.unit || 'bộ',
            mc: d.mc || 'Đạt chuẩn',
            discount: d.discount,
            totalValue: d.totalValue,
            paidAmount: d.paidAmount,
            debtAmount: d.remainingDebt,
            paymentMethod: 'Chuyển khoản',
            note: d.note,
            importDate: d.importDate,
            inspector: d.inspector || 'KCS',
            status: (d.status === 'draft' || d.status === 'inspecting' || d.status === 'completed' ? d.status : 'completed') as any,
            statusLabel: d.statusLabel || (d.status === 'draft' ? 'Lưu tạm' : 'Đã nhập kho'),
            items: parsedItems,
          };
        });
        setImportsList(mapped);
        setStoredAdminData(ADMIN_STORAGE_KEYS.STOCK_IMPORTS, mapped);
      }
    } catch (err: any) {
      console.warn('Could not load imports from API:', err);
    }
  };

  const loadReturnsFromApi = async () => {
    try {
      const data = await supplierReturnApi.getSupplierReturns();
      if (data && Array.isArray(data)) {
        const mapped: SupplierReturnSlip[] = data.map((d) => ({
          id: d.id,
          code: d.code,
          sourcePurchaseEntryCode: d.sourceImportCode,
          supplierName: d.supplierName,
          warehouseName: d.warehouseName || '',
          itemName: d.itemName,
          spec: d.spec || '',
          quantity: d.quantity,
          unit: d.unit || 'bộ',
          purchasePrice: d.purchasePrice,
          returnPrice: d.returnPrice,
          totalGoods: d.totalGoods || d.supplierRefund || 0,
          totalValue: d.totalGoods || d.supplierRefund || 0,
          invoiceDiscount: d.discount || 0,
          supplierRefund: d.supplierRefund || 0,
          paidAmount: d.paidAmount !== undefined ? d.paidAmount : (d.supplierRefund || 0),
          paymentMethod: d.paymentMethod || 'Chuyển khoản',
          returnDate: d.returnDate,
          staffName: d.staffName || '',
          reason: d.reason || '',
          solution: d.solution || '',
          status: (d.status === 'draft' || d.status === 'completed' ? d.status : 'completed') as any,
          statusLabel: d.status === 'draft' ? 'Phiếu tạm' : 'Đã trả hàng',
          note: d.note,
          itemsJson: d.itemsJson || '[]',
        }));
        setSupplierReturnsList(mapped);
        setStoredAdminData(ADMIN_STORAGE_KEYS.SUPPLIER_RETURNS, mapped);
      }
    } catch (err: any) {
      console.warn('Could not load returns from API:', err);
    }
  };

  const loadAuditsFromApi = async () => {
    try {
      const data = await stockAuditApi.getStockAudits();
      if (data && Array.isArray(data)) {
        const mapped: AuditSlip[] = data.map((d) => {
          let items: StockAuditItem[] = [];
          if (d.itemsJson) {
            try {
              items = JSON.parse(d.itemsJson);
            } catch {}
          }
          return {
            id: d.id,
            code: d.code,
            title: d.title,
            createdAt: d.auditDate || (d.createdAt ? new Date(d.createdAt).toLocaleDateString('vi-VN') : ''),
            creator: d.creator,
            scope: 'all',
            scopeLabel: d.scopeLabel,
            status: (d.status === 'completed' || d.status === 'draft' ? d.status : 'auditing') as any,
            statusLabel: d.statusLabel || (d.status === 'completed' ? 'Đã hoàn tất 100%' : 'Đang kiểm đếm'),
            note: d.note || '',
            items,
          };
        });
        setAuditSlips(mapped);
        setStoredAdminData(ADMIN_STORAGE_KEYS.STOCK_AUDITS, mapped);
      }
    } catch (err: any) {
      console.warn('Could not load audits from API:', err);
    }
  };

  useEffect(() => {
    // 1. Instantly read cached state after client hydration
    const storedWh = getStoredAdminData(ADMIN_STORAGE_KEYS.WAREHOUSES, []);
    if (storedWh && storedWh.length > 0) setWarehousesList(storedWh);

    const storedImp = getStoredAdminData(ADMIN_STORAGE_KEYS.STOCK_IMPORTS, []);
    if (storedImp && storedImp.length > 0) setImportsList(storedImp);

    const storedRet = getStoredAdminData(ADMIN_STORAGE_KEYS.SUPPLIER_RETURNS, []);
    if (storedRet && storedRet.length > 0) setSupplierReturnsList(storedRet);

    const storedAud = getStoredAdminData(ADMIN_STORAGE_KEYS.STOCK_AUDITS, []);
    if (storedAud && storedAud.length > 0) setAuditSlips(storedAud);

    // 2. Fetch fresh updates from backend API
    loadWarehousesFromApi();
    loadImportsFromApi();
    loadReturnsFromApi();
    loadAuditsFromApi();
  }, []);

  const handleDeleteSelectedWarehouses = async () => {
    if (!selectedWarehouseKeys.length) return;
    try {
      await Promise.all(
        selectedWarehouseKeys.map((k) => warehouseApi.deleteWarehouse(String(k)))
      );
      setWarehousesList((prev) => prev.filter((w) => !selectedWarehouseKeys.includes(w.id)));
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

  // Imports State
  const [importsList, setImportsList] = useState<StockImportSlip[]>([]);
  const [selectedImportKeys, setSelectedImportKeys] = useState<React.Key[]>([]);
  const [importSearchQuery, setImportSearchQuery] = useState('');
  const [importStatusFilter, setImportStatusFilter] = useState('all');
  const [importWarehouseFilter, setImportWarehouseFilter] = useState('all');
  const [importDateRange, setImportDateRange] = useState<[any, any] | null>(null);
  const [selectedImportDetail, setSelectedImportDetail] = useState<StockImportSlip | null>(null);
  const [showImportDetailDrawer, setShowImportDetailDrawer] = useState(false);
  const [importDetailTab, setImportDetailTab] = useState<'items' | 'info' | 'payments'>('items');
  const [expandedImportRowKeys, setExpandedImportRowKeys] = useState<string[]>([]);
  const [importPanelTabs, setImportPanelTabs] = useState<Record<string, 'items' | 'info' | 'payments'>>({});
  const [importRowTabs, setImportRowTabs] = useState<Record<string, 'items' | 'info' | 'payments'>>({});
  const [selectedImportSlipForPrint, setSelectedImportSlipForPrint] = useState<StockImportSlip | null>(null);
  const [editingImportSlipId, setEditingImportSlipId] = useState<string | null>(null);
  const [importRowNotes, setImportRowNotes] = useState<Record<string, string>>({});
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentSlipTarget, setPaymentSlipTarget] = useState<StockImportSlip | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethodSelect, setPaymentMethodSelect] = useState<'Chuyển khoản (VietQR)' | 'Tiền mặt'>('Chuyển khoản (VietQR)');
  const [paymentNoteText, setPaymentNoteText] = useState('');

  const selectedImportRecord = importsList.find((i) => selectedImportKeys.includes(i.id));

  const handleDeleteSelectedImports = async () => {
    if (!selectedImportKeys.length) return;
    const keysToDelete = [...selectedImportKeys];
    try {
      await Promise.all(
        keysToDelete.map((k) => {
          const keyStr = String(k);
          if (keyStr.includes('-')) {
            return stockImportApi.deleteStockImport(keyStr).catch(() => {});
          }
          return Promise.resolve(true);
        })
      );
      setImportsList((prev) => {
        const nextList = prev.filter((i) => !keysToDelete.includes(i.id));
        setStoredAdminData(ADMIN_STORAGE_KEYS.STOCK_IMPORTS, nextList);
        return nextList;
      });
      setExpandedImportRowKeys((prev) => prev.filter((k) => !keysToDelete.includes(k)));
      message.success(`Đã xóa ${keysToDelete.length} phiếu nhập đã chọn!`);
      setSelectedImportKeys([]);
      await loadImportsFromApi();
    } catch (e: any) {
      message.error(e?.message || 'Xóa phiếu nhập thất bại.');
    }
  };

  const handleCopySelectedImport = () => {
    if (!selectedImportRecord) return;
    const nextNum = (importsList.length + 91).toString().padStart(3, '0');
    const cloned: StockImportSlip = {
      ...selectedImportRecord,
      id: `imp_${Date.now()}`,
      code: `#PN-2026-${nextNum}`,
      importDate: new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };
    setImportsList((prev) => [cloned, ...prev]);
    message.success(`Đã nhân bản phiếu nhập "${selectedImportRecord.code}"!`);
  };

  const handleEditSelectedImport = () => {
    if (!selectedImportRecord) return;
    setExpandedImportRowKeys([selectedImportRecord.id]);
    setImportRowTabs((prev) => ({ ...prev, [selectedImportRecord.id]: 'items' }));
  };

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
  const [dbProducts, setDbProducts] = useState<FeaturedCatalogProduct[]>([]);
  const [importSearchProduct, setImportSearchProduct] = useState('');
  const [returnSearchProduct, setReturnSearchProduct] = useState('');
  const [stocktakeSearchProduct, setStocktakeSearchProduct] = useState('');
  const [showImportProductPopover, setShowImportProductPopover] = useState(false);
  const [importCode, setImportCode] = useState('');
  const [importDate, setImportDate] = useState('');
  const [importSupplier, setImportSupplier] = useState<string | undefined>(undefined);
  const [importWarehouse, setImportWarehouse] = useState<string | undefined>(undefined);
  const [returnWarehouse, setReturnWarehouse] = useState<string | undefined>(undefined);
  const [stocktakeWarehouseName, setStocktakeWarehouseName] = useState('');
  const [importInvoiceNumber, setImportInvoiceNumber] = useState('');
  const [importInspector, setImportInspector] = useState('');
  const [importDiscount, setImportDiscount] = useState<number>(0);
  const [importPaidAmount, setImportPaidAmount] = useState<number | undefined>(undefined);
  const [importPaymentMethod, setImportPaymentMethod] = useState('Chuyển khoản');
  const [importNote, setImportNote] = useState('');
  const importSearchInputRef = React.useRef<any>(null);

  const isMatchGlobalBranch = useCallback((targetNameOrBranch?: string) => {
    return isMatchBranch(targetNameOrBranch, selectedGlobalBranch, warehousesList);
  }, [selectedGlobalBranch, warehousesList]);

  const activeBranch = useMemo(() => {
    if (selectedGlobalBranch && selectedGlobalBranch !== 'all') {
      return selectedGlobalBranch;
    }
    const currentWhName =
      warehouseSubTab === 'imports'
        ? importWarehouse
        : warehouseSubTab === 'returns'
        ? returnWarehouse
        : warehouseSubTab === 'stocktake'
        ? stocktakeWarehouseName
        : undefined;
    if (currentWhName) {
      const wh = warehousesList.find((w) => w.name === currentWhName);
      if (wh?.branch) return wh.branch;
      return currentWhName;
    }
    return selectedGlobalBranch;
  }, [selectedGlobalBranch, warehouseSubTab, importWarehouse, returnWarehouse, stocktakeWarehouseName, warehousesList]);

  const availableBranchWarehouses = useMemo(() => {
    if (!selectedGlobalBranch || selectedGlobalBranch === 'all') {
      return warehousesList;
    }
    return warehousesList.filter((w) => isMatchGlobalBranch(w.branch) || isMatchGlobalBranch(w.name));
  }, [warehousesList, selectedGlobalBranch, isMatchGlobalBranch]);

  const availableBranchSuppliers = useMemo(() => {
    if (!selectedGlobalBranch || selectedGlobalBranch === 'all') {
      return suppliersList;
    }
    const matched = suppliersList.filter((s) => isMatchGlobalBranch(s.branch || s.address || s.name));
    return matched.length > 0 ? matched : suppliersList;
  }, [suppliersList, selectedGlobalBranch, isMatchGlobalBranch]);

  useEffect(() => {
    if (warehousesList.length > 0) {
      const targetWh = availableBranchWarehouses[0]?.name || warehousesList[0]?.name;
      if (targetWh) {
        setImportWarehouse((prev) => {
          if (!prev) return targetWh;
          const currentMatches = availableBranchWarehouses.some((w) => w.name === prev);
          return currentMatches ? prev : targetWh;
        });
        setReturnWarehouse((prev) => {
          if (!prev) return targetWh;
          const currentMatches = availableBranchWarehouses.some((w) => w.name === prev);
          return currentMatches ? prev : targetWh;
        });
        setStocktakeWarehouseName((prev) => {
          if (!prev) return targetWh;
          const currentMatches = availableBranchWarehouses.some((w) => w.name === prev);
          return currentMatches ? prev : targetWh;
        });
      }
    }
  }, [selectedGlobalBranch, warehousesList, availableBranchWarehouses]);

  // Auto-switch to create stock import mode and prefill product when navigating from product detail
  useEffect(() => {
    if (initialImportMode === 'create' || initialImportProduct) {
      setWarehouseSubTab('imports');
      setImportViewMode('create');
      if (!importCode) {
        const nextNum = (importsList.length + 91).toString().padStart(3, '0');
        const nowStr = new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        setImportCode(`#PN-2026-${nextNum}`);
        setImportDate(nowStr);
        setImportInspector(user?.name || 'Nguyễn Văn Nam (KCS)');
        const defaultWh = availableBranchWarehouses[0]?.name || warehousesList[0]?.name || '';
        setImportWarehouse(defaultWh);
      }
      if (initialImportProduct) {
        const unitPrice = initialImportProduct.costPrice || (initialImportProduct.price ? Math.round(initialImportProduct.price * 0.6) : 0);
        const newLine = {
          id: `line_${Date.now()}`,
          code: initialImportProduct.code || '',
          name: initialImportProduct.name,
          spec: initialImportProduct.dimensions || initialImportProduct.material || initialImportProduct.metaInfo || '',
          unit: initialImportProduct.unit || 'Bộ',
          quantity: 1,
          unitPrice: unitPrice,
          discount: 0,
          total: unitPrice,
        };
        setImportEntryLines((prev) => {
          const exists = prev.some((l) => (newLine.code && l.code === newLine.code) || l.name === newLine.name);
          if (exists) return prev;
          return [newLine, ...prev];
        });
        message.success(`Đã chuyển tới tạo phiếu nhập hàng cho sản phẩm "${initialImportProduct.name}"`);
        if (onClearInitialImportProduct) {
          onClearInitialImportProduct();
        }
      }
    }
  }, [initialImportMode, initialImportProduct, warehousesList, importsList.length, user?.name, onClearInitialImportProduct, availableBranchWarehouses]);

  const normalizeSearchText = (str?: string) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'd')
      .trim();
  };

  const allAvailableProducts = useMemo(() => {
    const map = new Map<string, FeaturedCatalogProduct>();
    const targetBranch = activeBranch !== 'all' ? activeBranch : undefined;

    (catalogList || []).forEach((p) => {
      if (!targetBranch || isProductInBranch(p, targetBranch, warehousesList)) {
        const key = p.code || p.id;
        if (key) map.set(key, p);
      }
    });
    dbProducts.forEach((p) => {
      if (!targetBranch || isProductInBranch(p, targetBranch, warehousesList)) {
        const key = p.code || p.id;
        if (key) map.set(key, p);
      }
    });
    return Array.from(map.values());
  }, [catalogList, dbProducts, activeBranch, warehousesList]);

  const filteredImportProducts = useMemo(() => {
    const rawQuery = importSearchProduct.trim().toLowerCase();
    const query = normalizeSearchText(importSearchProduct);
    if (!query) {
      return [];
    }
    const queryWords = query.split(/\s+/).filter(Boolean);

    const matches = allAvailableProducts.filter((p) => {
      const nameRaw = (p.name || '').toLowerCase();
      const codeRaw = (p.code || '').toLowerCase();
      const collRaw = (p.collection || '').toLowerCase();
      const catRaw = (p.categoryName || '').toLowerCase();

      const nameNorm = normalizeSearchText(p.name);
      const codeNorm = normalizeSearchText(p.code);
      const collNorm = normalizeSearchText(p.collection);
      const catNorm = normalizeSearchText(p.categoryName);

      // Direct match on code
      if (codeRaw.includes(rawQuery) || codeNorm.includes(query)) return true;

      // Direct match on name
      if (nameRaw.includes(rawQuery) || nameNorm.includes(query)) return true;

      // All words present in name
      if (queryWords.every((w) => nameNorm.includes(w))) return true;

      // All words present in (name + category + collection)
      const combined = `${nameNorm} ${catNorm} ${collNorm}`;
      return queryWords.every((w) => combined.includes(w));
    });

    // Sort by relevance (Exact name start > Exact name contains > Code match > Others)
    return matches.sort((a, b) => {
      const aNameNorm = normalizeSearchText(a.name);
      const bNameNorm = normalizeSearchText(b.name);
      const aCodeNorm = normalizeSearchText(a.code);
      const bCodeNorm = normalizeSearchText(b.code);

      const aExactName = aNameNorm.startsWith(query) ? 3 : aNameNorm.includes(query) ? 2 : 0;
      const bExactName = bNameNorm.startsWith(query) ? 3 : bNameNorm.includes(query) ? 2 : 0;
      if (aExactName !== bExactName) return bExactName - aExactName;

      const aExactCode = aCodeNorm.startsWith(query) ? 3 : aCodeNorm.includes(query) ? 2 : 0;
      const bExactCode = bCodeNorm.startsWith(query) ? 3 : bCodeNorm.includes(query) ? 2 : 0;
      if (aExactCode !== bExactCode) return bExactCode - aExactCode;

      return a.name.localeCompare(b.name);
    });
  }, [allAvailableProducts, importSearchProduct]);

  // Real-time backend search when typing in product search box
  useEffect(() => {
    const term = (importSearchProduct || returnSearchProduct || stocktakeSearchProduct).trim();
    if (!term) return;
    const timer = setTimeout(async () => {
      try {
        const targetBranch = activeBranch !== 'all' ? activeBranch : undefined;
        const res = await productApi.getProducts({
          search: term,
          branch: targetBranch,
          pageSize: 0,
        });
        if (res && res.length > 0) {
          const filtered = targetBranch
            ? res.filter((p) => isProductInBranch(p, targetBranch, warehousesList))
            : res;
          if (filtered.length > 0) {
            setDbProducts((prev) => {
              const map = new Map<string, FeaturedCatalogProduct>();
              prev.forEach((p) => map.set(p.code || p.id, p));
              filtered.forEach((p) => map.set(p.code || p.id, p));
              return Array.from(map.values());
            });
          }
        }
      } catch (e) {
        // ignore
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [importSearchProduct, returnSearchProduct, stocktakeSearchProduct, activeBranch, warehousesList]);

  // refreshCatalogProducts được gọi có chủ đích sau khi tạo/cập nhật phiếu nhập/trả kho, không kích hoạt tự động theo loop


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F3') {
        e.preventDefault();
        importSearchInputRef.current?.focus();
        setShowImportProductPopover(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Returns State
  const [supplierReturnsList, setSupplierReturnsList] = useState<SupplierReturnSlip[]>([]);
  const [selectedReturnKeys, setSelectedReturnKeys] = useState<React.Key[]>([]);
  const [returnSearchQuery, setReturnSearchQuery] = useState('');
  const [returnStatusFilter, setReturnStatusFilter] = useState('all');
  const [returnWarehouseFilter, setReturnWarehouseFilter] = useState('all');
  const [returnDateRange, setReturnDateRange] = useState<[any, any] | null>(null);
  const [selectedReturnSlipForPrint, setSelectedReturnSlipForPrint] = useState<SupplierReturnSlip | null>(null);
  const [expandedReturnRowKeys, setExpandedReturnRowKeys] = useState<string[]>([]);
  const [returnRowTabs, setReturnRowTabs] = useState<Record<string, 'items' | 'info' | 'payments'>>({});
  const [returnRowNotes, setReturnRowNotes] = useState<Record<string, string>>({});

  const selectedReturnRecord = supplierReturnsList.find((r) => selectedReturnKeys.includes(r.id));

  const handleDeleteSelectedReturns = async () => {
    if (!selectedReturnKeys.length) return;
    try {
      await Promise.all(
        selectedReturnKeys.map((k) => supplierReturnApi.deleteSupplierReturn(String(k)).catch(() => {}))
      );
      setSupplierReturnsList((prev) => prev.filter((r) => !selectedReturnKeys.includes(r.id)));
      message.success(`Đã xóa ${selectedReturnKeys.length} phiếu trả hàng đã chọn!`);
      setSelectedReturnKeys([]);
    } catch (e: any) {
      message.error(e?.message || 'Xóa phiếu trả hàng thất bại.');
    }
  };

  const handleCopySelectedReturn = () => {
    if (!selectedReturnRecord) return;
    const nextNum = (supplierReturnsList.length + 1).toString().padStart(2, '0');
    const cloned: SupplierReturnSlip = {
      ...selectedReturnRecord,
      id: `ret_${Date.now()}`,
      code: `#TH-2026-${nextNum}`,
      returnDate: new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };
    setSupplierReturnsList((prev) => [cloned, ...prev]);
    message.success(`Đã nhân bản phiếu trả hàng "${selectedReturnRecord.code}"!`);
  };

  const handleEditSelectedReturn = () => {
    if (!selectedReturnRecord) return;
    setExpandedReturnRowKeys([selectedReturnRecord.id]);
    setReturnRowTabs((prev) => ({ ...prev, [selectedReturnRecord.id]: 'items' }));
  };

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
  const [showReturnProductPopover, setShowReturnProductPopover] = useState(false);
  const [returnCode, setReturnCode] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [returnSourceCode, setReturnSourceCode] = useState<string | undefined>(undefined);
  const [returnSupplier, setReturnSupplier] = useState<string | undefined>(undefined);
  const [returnStaffName, setReturnStaffName] = useState('');
  const [returnReason, setReturnReason] = useState('Lỗi quy cách / Kiểm định không đạt tiêu chuẩn');
  const [returnSolution, setReturnSolution] = useState('Đã hoàn bù lô mới');
  const [returnDiscount, setReturnDiscount] = useState<number>(0);
  const [returnPaidAmount, setReturnPaidAmount] = useState<number | undefined>(undefined);
  const [returnPaymentMethod, setReturnPaymentMethod] = useState('Chuyển khoản');
  const [returnNote, setReturnNote] = useState('');

  // Stocktake State
  const [stocktakeViewMode, setStocktakeViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedAuditKeys, setSelectedAuditKeys] = useState<React.Key[]>([]);
  const [stocktakeTabFilter, setStocktakeTabFilter] = useState<'all' | 'matched' | 'diff' | 'increase' | 'decrease'>('all');
  const [stocktakeEntryLines, setStocktakeEntryLines] = useState<StockAuditItem[]>([]);
  const [showStocktakeProductPopover, setShowStocktakeProductPopover] = useState(false);
  const [stocktakeCode, setStocktakeCode] = useState('');
  const [stocktakeSlipCode, setStocktakeSlipCode] = useState('');
  const [stocktakeDate, setStocktakeDate] = useState('');
  const [stocktakeWarehouse, setStocktakeWarehouse] = useState<string | undefined>(undefined);
  const [stocktakeStaffName, setStocktakeStaffName] = useState('');
  const [stocktakeNote, setStocktakeNote] = useState('');
  const [auditSlips, setAuditSlips] = useState<AuditSlip[]>([]);
  const [expandedAuditRowKeys, setExpandedAuditRowKeys] = useState<string[]>([]);
  const [auditRowTabs, setAuditRowTabs] = useState<Record<string, 'items' | 'info'>>({});
  const [activeSlipId, setActiveSlipId] = useState<string>('slip_1');
  const [editingSlipId, setEditingSlipId] = useState<string | null>(null);
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [auditDateRange, setAuditDateRange] = useState<[any, any] | null>(null);
  const [auditStatusFilter, setAuditStatusFilter] = useState('all');
  const [auditWarehouseFilter, setAuditWarehouseFilter] = useState('all');
  const [stockTypeFilter, setStockTypeFilter] = useState('all');
  const [stockDiffFilter, setStockDiffFilter] = useState('all');
  const [selectedAuditSlip, setSelectedAuditSlip] = useState<AuditSlip | null>(null);
  const [showAuditSlipDrawer, setShowAuditSlipDrawer] = useState(false);
  const [showCreateSlipModal, setShowCreateSlipModal] = useState(false);
  const [createSlipForm] = Form.useForm();
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [addItemForm] = Form.useForm();

  const selectedAuditRecord = auditSlips.find((a) => selectedAuditKeys.includes(a.id));

  const handleDeleteSelectedAudits = async () => {
    if (!selectedAuditKeys.length) return;
    try {
      await Promise.all(
        selectedAuditKeys.map((k) => stockAuditApi.deleteStockAudit(String(k)).catch(() => {}))
      );
      setAuditSlips((prev) => prev.filter((s) => !selectedAuditKeys.includes(s.id)));
      message.success(`Đã xóa ${selectedAuditKeys.length} phiếu kiểm kho đã chọn!`);
      setSelectedAuditKeys([]);
    } catch (e: any) {
      message.error(e?.message || 'Xóa phiếu kiểm kho thất bại.');
    }
  };

  const handleCopySelectedAudit = () => {
    if (!selectedAuditRecord) return;
    const nextNum = (auditSlips.length + 1).toString().padStart(2, '0');
    const cloned: AuditSlip = {
      ...selectedAuditRecord,
      id: `slip_${Date.now()}`,
      code: `#KK-2026-${nextNum}`,
      title: `${selectedAuditRecord.title} (Bản sao)`,
      createdAt: new Date().toLocaleDateString('vi-VN'),
    };
    setAuditSlips((prev) => [cloned, ...prev]);
    message.success(`Đã nhân bản phiếu kiểm kho "${selectedAuditRecord.code}"!`);
  };

  const handleEditSelectedAudit = () => {
    if (selectedAuditRecord) {
      handleOpenEditStocktake(selectedAuditRecord);
    }
  };

  const handleRefreshAudits = async () => {
    try {
      await loadAuditsFromApi();
      setAuditSearchQuery('');
      setAuditStatusFilter('all');
      setAuditWarehouseFilter('all');
      setAuditDateRange(null);
      setSelectedAuditKeys([]);
      message.success('Đã làm mới danh sách phiếu kiểm!');
    } catch (err: any) {
      message.error('Làm mới thất bại.');
    }
  };

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

  const allAuditableStock: StockAuditItem[] = useMemo(() => {
    const targetBranch = activeBranch !== 'all' ? activeBranch : undefined;
    const branchProds = targetBranch
      ? allAvailableProducts.filter((p) => isProductInBranch(p, targetBranch, warehousesList))
      : allAvailableProducts;

    const catalogItems: StockAuditItem[] = branchProds.map((prod, idx) => {
      const parsedStock = getProductStockForBranch(prod, targetBranch, warehousesList);
      const defaultLoc = stocktakeWarehouseName || 'Kho chi nhánh';
      return {
        id: prod.id || ('prod_' + prod.code),
        productId: prod.id,
        code: prod.code,
        name: prod.name,
        type: 'product' as const,
        location: `${defaultLoc} - Khu ` + String.fromCharCode(65 + (idx % 4)),
        systemQty: parsedStock,
        actualQty: parsedStock,
        unit: prod.unit || (prod.name.toLowerCase().includes('bàn ăn') || prod.name.toLowerCase().includes('sofa') ? 'bộ' : 'chiếc'),
        systemMc: 'Đạt chuẩn',
        actualMc: 'Đạt chuẩn',
        status: 'matched' as const,
        qualityNote: (prod.collection || '') + ' • ' + (prod.metaInfo || 'Hàng sẵn bán'),
        checked: true,
      };
    });

    return catalogItems;
  }, [allAvailableProducts, activeBranch, warehousesList, stocktakeWarehouseName]);


  const handleOpenCreateWarehouse = () => {
    setEditingWarehouse(null);
    const existingCodes = new Set(warehousesList.map((w) => (w.code || '').toUpperCase()));
    let nextNum = 1;
    let autoCode = `KHO${nextNum.toString().padStart(4, '0')}`;
    while (existingCodes.has(autoCode)) {
      nextNum++;
      autoCode = `KHO${nextNum.toString().padStart(4, '0')}`;
    }
    const defaultBranch = selectedGlobalBranch !== 'all' ? selectedGlobalBranch : (branchesList[0]?.name || '');
    setShowWarehouseModal(true);
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
        isDefault: false,
        status: true,
      });
    }, 0);
  };

  const handleOpenEditWarehouse = (wh: AdminWarehouse) => {
    setEditingWarehouse(wh);
    setShowWarehouseModal(true);
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
      setWarehousesList((prev) => [created, ...prev]);
      message.success(`Đã nhân bản kho "${wh.name}"!`);
    } catch (err: any) {
      message.error(err?.message || 'Nhân bản kho thất bại.');
    }
  };

  const handleWarehouseFormSubmit = async (values: any) => {
    const trimmedCode = (values.code || '').trim().toUpperCase();
    const trimmedName = (values.name || '').trim();
    const defaultBranch = selectedGlobalBranch !== 'all' ? selectedGlobalBranch : (branchesList[0]?.name || '');
    const isDef = Boolean(values.isDefault);
    const itemStatus: 'active' | 'inactive' = typeof values.status === 'boolean'
      ? (values.status ? 'active' : 'inactive')
      : (values.status === 'inactive' ? 'inactive' : 'active');

    const parts = [values.streetAddress, values.ward, values.district, values.province].filter(Boolean);
    const fullAddress = parts.length > 0 ? parts.join(', ') : (values.streetAddress || '');

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
        message.success(`Đã cập nhật thông tin kho "${trimmedName}" thành công!`);
        setShowWarehouseModal(false);
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
      try {
        const createdWh = await warehouseApi.createWarehouse(newWhPayload);
        if (isDef) {
          setWarehousesList([createdWh, ...warehousesList.map((w) => ({ ...w, isDefault: false }))]);
        } else {
          setWarehousesList([createdWh, ...warehousesList]);
        }
        message.success(`Đã thêm kho "${trimmedName}" thành công!`);
        setShowWarehouseModal(false);
        warehouseForm.resetFields();
      } catch (err: any) {
        message.error(err?.message || 'Thêm kho hàng thất bại.');
      }
    }
  };

  const handleChangeWarehouseStatus = async (id: string, newStatus: 'active' | 'inactive') => {
    try {
      await warehouseApi.updateStatus(id, newStatus);
      setWarehousesList((prev) =>
        prev.map((w) => (w.id === id ? { ...w, status: newStatus } : w))
      );
      message.success(`Đã đổi trạng thái kho thành ${newStatus === 'active' ? 'Đang hoạt động' : 'Tạm dừng'}`);
    } catch (err: any) {
      message.error(err?.message || 'Đổi trạng thái kho thất bại.');
    }
  };

  const handleDeleteWarehouse = async (id: string, name: string) => {
    try {
      await warehouseApi.deleteWarehouse(id);
      setWarehousesList((prev) => prev.filter((w) => w.id !== id));
      message.success(`Đã xóa kho "${name}" thành công!`);
    } catch (err: any) {
      message.error(err?.message || 'Xóa kho hàng thất bại.');
    }
  };

  const handleGenerateWarehouseCode = () => {
    const currentCode = warehouseForm.getFieldValue('code');
    const genCode = getNextCode(currentCode, warehousesList, 'KHO', 4);
    warehouseForm.setFieldsValue({ code: genCode });
    message.success(`Đã tự động tạo mã kho mới: ${genCode}`);
  };


  const handleOpenCreateImport = () => {
    setEditingImportSlipId(null);
    const nextNum = (importsList.length + 91).toString().padStart(3, '0');
    const nowStr = new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    setImportCode(`#PN-2026-${nextNum}`);
    setImportDate(nowStr);
    setImportInspector(user?.name || 'Nguyễn Văn Nam (KCS)');
    setImportSupplier(undefined);
    const defaultWh = availableBranchWarehouses[0]?.name || warehousesList[0]?.name || '';
    setImportWarehouse(defaultWh);
    setImportInvoiceNumber('');
    setImportDiscount(0);
    setImportPaidAmount(undefined);
    setImportPaymentMethod('Chuyển khoản');
    setImportNote('');
    setImportEntryLines([]);
    setImportViewMode('create');
  };

  const handleSaveImportSlip = async (targetStatus: 'completed' | 'draft') => {
    if (!importSupplier || !importSupplier.trim()) {
      message.error('Vui lòng chọn Nhà cung cấp trước khi lập phiếu nhập hàng để ghi nhận công nợ chính xác!');
      return;
    }
    if (importEntryLines.length === 0) {
      message.error('Vui lòng thêm ít nhất 1 mặt hàng vào phiếu nhập!');
      return;
    }
    const totalGoods = importEntryLines.reduce((sum, item) => sum + (item.total || (item.quantity * item.unitPrice)), 0);
    const payable = Math.max(0, totalGoods - (importDiscount || 0));
    const isUnpaid = importPaymentMethod === 'Chưa thanh toán';
    const paid = isUnpaid ? 0 : Math.min(payable, Math.max(0, Number(importPaidAmount !== undefined ? importPaidAmount : payable)));
    const debt = Math.max(0, payable - paid);
    const currentCode = importCode || `#PN-2026-${(importsList.length + 91).toString().padStart(3, '0')}`;
    const firstItem = importEntryLines[0];
    const itemName = importEntryLines.length === 1 ? firstItem.name : `${firstItem.name} + ${importEntryLines.length - 1} món khác`;

    const matchedSupplier = suppliersList.find((s) => s.name === importSupplier || s.id === importSupplier);
    const matchedWarehouse = warehousesList.find((w) => w.name === importWarehouse || w.id === importWarehouse);

    const payload = {
      code: currentCode,
      supplier: matchedSupplier?.name || importSupplier,
      supplierId: matchedSupplier?.id && matchedSupplier.id.includes('-') ? matchedSupplier.id : undefined,
      warehouseName: matchedWarehouse?.name || importWarehouse || warehousesList[0]?.name || 'Tổng kho',
      warehouseId: matchedWarehouse?.id && matchedWarehouse.id.includes('-') ? matchedWarehouse.id : undefined,
      itemName: itemName,
      spec: firstItem?.spec || '',
      quantity: importEntryLines.reduce((sum, item) => sum + item.quantity, 0),
      unit: firstItem?.unit || 'bộ',
      unitPrice: firstItem?.unitPrice || 0,
      discount: importDiscount || 0,
      totalValue: payable,
      paidAmount: paid,
      remainingDebt: debt,
      mc: 'Đạt chuẩn',
      importDate: importDate || (new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })),
      status: targetStatus,
      statusLabel: targetStatus === 'draft' ? 'Lưu tạm' : 'Đã nhập kho',
      inspector: importInspector || user?.name || 'KCS',
      note: importNote || '',
      itemsJson: JSON.stringify(importEntryLines),
    };

    try {
      if (editingImportSlipId && editingImportSlipId.includes('-')) {
        await stockImportApi.updateStockImport(editingImportSlipId, payload);
      } else if (!editingImportSlipId) {
        await stockImportApi.createStockImport(payload);
      }

      setImportsList((prev) => {
        if (editingImportSlipId) {
          const nextList = prev.map((item) => {
            if (item.id === editingImportSlipId) {
              return {
                ...item,
                ...payload,
                items: importEntryLines.map((it) => ({
                  id: it.id,
                  code: it.code,
                  name: it.name,
                  unit: it.unit,
                  batch: '---',
                  expiryDate: '---',
                  quantity: it.quantity,
                  unitPrice: it.unitPrice,
                  discount: it.discount || 0,
                  importPrice: it.unitPrice,
                  total: it.total,
                })),
              } as StockImportSlip;
            }
            return item;
          });
          setStoredAdminData(ADMIN_STORAGE_KEYS.STOCK_IMPORTS, nextList);
          return nextList;
        }
        return prev;
      });

      await loadImportsFromApi();
      await refreshCatalogProducts();

      if (targetStatus === 'draft') {
        message.success(editingImportSlipId ? `Đã lưu cập nhật bản nháp phiếu "${payload.code}"!` : `Đã lưu tạm phiếu nhập kho "${payload.code}" thành công!`);
      } else {
        message.success(editingImportSlipId ? `Đã hoàn thành và duyệt phiếu nhập kho "${payload.code}"!` : `Đã lập phiếu nhập kho "${payload.code}" và lưu vào Database thành công!`);
      }

      setEditingImportSlipId(null);
      setImportEntryLines([]);
      setImportCode('');
      setImportSearchProduct('');
      setImportViewMode('list');
    } catch (err: any) {
      console.error('Error saving import slip:', err);
      message.error(err?.message || 'Không thể lưu phiếu nhập kho vào Database!');
    }
  };

  const handleOpenImportSlip = (imp: StockImportSlip, itemsList?: StockImportSlipItem[]) => {
    setEditingImportSlipId(imp.id);
    setImportCode(imp.code);
    setImportDate(imp.importDate || new Date().toLocaleDateString('vi-VN'));
    setImportSupplier(imp.supplier);
    setImportWarehouse(imp.warehouseName);
    setImportInvoiceNumber(imp.invoiceNumber || '');
    setImportInspector(imp.inspector || imp.creator || user?.name || 'KCS');
    setImportDiscount(imp.discount || 0);
    setImportPaidAmount(imp.paidAmount);
    setImportPaymentMethod(imp.paymentMethod || 'Chuyển khoản');
    setImportNote(importRowNotes[imp.id] !== undefined ? importRowNotes[imp.id] : (imp.note || ''));

    let linesSource = (itemsList && itemsList.length > 0) ? itemsList : (imp.items || []);
    if (linesSource.length === 0 && imp.itemsJson) {
      try {
        linesSource = JSON.parse(imp.itemsJson);
      } catch {
        linesSource = [];
      }
    }
    if (linesSource.length === 0) {
      linesSource = [
        {
          id: `line_${imp.id}`,
          code: imp.code || 'SP0001',
          name: imp.itemName || 'Sản phẩm nhập khẩu',
          unit: imp.unit || 'bộ',
          batch: '---',
          expiryDate: '---',
          quantity: imp.quantity || 1,
          unitPrice: imp.unitPrice || 0,
          discount: imp.discount || 0,
          importPrice: imp.unitPrice || 0,
          total: imp.totalValue || ((imp.quantity || 1) * (imp.unitPrice || 0)),
        },
      ];
    }

    setImportEntryLines(
      linesSource.map((it, idx) => ({
        id: it.id || `edit_line_${Date.now()}_${idx}`,
        code: it.code || `SP${idx + 1}`,
        name: it.name || 'Sản phẩm',
        spec: it.spec || '',
        unit: it.unit || 'bộ',
        quantity: it.quantity || 1,
        unitPrice: it.unitPrice || 0,
        discount: it.discount || 0,
        total: it.total || ((it.quantity || 1) * (it.unitPrice || 0)),
      }))
    );

    setImportViewMode('create');
    message.info(`Đang mở phiếu nhập ${imp.code} để kiểm tra và cập nhật.`);
  };

  const handleSaveImportNote = async (imp: StockImportSlip) => {
    const currentNote = importRowNotes[imp.id] !== undefined ? importRowNotes[imp.id] : (imp.note || '');
    try {
      if (imp.id && imp.id.includes('-')) {
        await stockImportApi.updateStockImport(imp.id, { note: currentNote });
      }
      setImportsList((prev) => {
        const nextList = prev.map((item) => (item.id === imp.id ? { ...item, note: currentNote } : item));
        setStoredAdminData(ADMIN_STORAGE_KEYS.STOCK_IMPORTS, nextList);
        return nextList;
      });
      message.success(`Đã lưu ghi chú và thông tin phiếu nhập ${imp.code} thành công!`);
    } catch (e: any) {
      message.error(e?.message || 'Lỗi khi lưu ghi chú phiếu nhập.');
    }
  };

  const handleCopyImportSlip = (imp: StockImportSlip, itemsList?: StockImportSlipItem[]) => {
    const nextNum = (importsList.length + 91).toString().padStart(3, '0');
    const nowStr = new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    setEditingImportSlipId(null);
    setImportCode(`#PN-2026-${nextNum}`);
    setImportDate(nowStr);
    setImportSupplier(imp.supplier);
    setImportWarehouse(imp.warehouseName);
    setImportInvoiceNumber(imp.invoiceNumber ? `${imp.invoiceNumber}-COPY` : '');
    setImportInspector(user?.name || imp.inspector || 'KCS');
    setImportDiscount(imp.discount || 0);
    setImportPaidAmount(undefined);
    setImportPaymentMethod(imp.paymentMethod || 'Chuyển khoản');
    setImportNote(`Sao chép từ phiếu ${imp.code}. ${importRowNotes[imp.id] ?? imp.note ?? ''}`.trim());

    let linesSource = (itemsList && itemsList.length > 0) ? itemsList : (imp.items || []);
    if (linesSource.length === 0 && imp.itemsJson) {
      try {
        linesSource = JSON.parse(imp.itemsJson);
      } catch {
        linesSource = [];
      }
    }
    if (linesSource.length === 0) {
      linesSource = [
        {
          id: `line_${imp.id}`,
          code: imp.code || 'SP0001',
          name: imp.itemName || 'Sản phẩm',
          unit: imp.unit || 'bộ',
          quantity: imp.quantity || 1,
          unitPrice: imp.unitPrice || 0,
          discount: 0,
          total: imp.totalValue || ((imp.quantity || 1) * (imp.unitPrice || 0)),
        },
      ];
    }

    setImportEntryLines(
      linesSource.map((it, idx) => ({
        id: `copy_line_${Date.now()}_${idx}`,
        code: it.code || `SP${idx + 1}`,
        name: it.name || 'Sản phẩm',
        spec: it.spec || '',
        unit: it.unit || 'bộ',
        quantity: it.quantity || 1,
        unitPrice: it.unitPrice || 0,
        discount: it.discount || 0,
        total: it.total || ((it.quantity || 1) * (it.unitPrice || 0)),
      }))
    );

    setImportViewMode('create');
    message.success(`Đã sao chép các mặt hàng từ ${imp.code} sang phiếu mới #PN-2026-${nextNum}!`);
  };

  const isSlipOffsetDebt = (r?: { paymentMethod?: string; solution?: string; statusLabel?: string } | null) =>
    Boolean(
      r && (
        r.paymentMethod === 'Cấn trừ công nợ' ||
        r.solution?.toLowerCase().includes('cấn trừ') ||
        r.statusLabel?.toLowerCase().includes('cấn trừ')
      )
    );

  const getImportReturnDeduction = useCallback(
    (impOrCode?: StockImportSlip | string) => {
      if (!impOrCode) return 0;
      const cleanCode = (typeof impOrCode === 'string' ? impOrCode : impOrCode.code || '').trim();
      if (!cleanCode) return 0;
      const cleanRaw = cleanCode.replace(/^#/, '');
      const impSupplier = typeof impOrCode === 'object' ? (impOrCode.supplier || '').trim().toLowerCase() : '';
      const impTotal = typeof impOrCode === 'object' ? Number(impOrCode.totalValue) || 0 : undefined;

      const totalMatched = supplierReturnsList
        .filter((ret) => {
          if (ret.status === 'draft') return false;
          const src = (ret.sourcePurchaseEntryCode || '').trim();
          const srcRaw = src.replace(/^#/, '');
          const retCode = (ret.code || '').trim();
          const retCodeRaw = retCode.replace(/^#/, '');

          const codeMatches =
            (src && (src === cleanCode || srcRaw === cleanRaw)) ||
            (retCode && (retCode === cleanCode || retCodeRaw === cleanRaw)) ||
            (ret.itemName && ret.itemName.includes(cleanCode));

          if (!codeMatches) return false;

          // Nếu có thông tin nhà cung cấp, kiểm tra xem có khớp nhà cung cấp không (tránh trùng mã phiếu giữa các NCC)
          if (impSupplier && ret.supplierName) {
            const retSup = ret.supplierName.trim().toLowerCase();
            const supMatches =
              retSup === impSupplier ||
              retSup.includes(impSupplier) ||
              impSupplier.includes(retSup);
            if (!supMatches) return false;
          }

          return true;
        })
        .reduce((sum, ret) => sum + (Number(ret.supplierRefund) || Number(ret.totalGoods) || Number(ret.totalValue) || 0), 0);

      // Số tiền hàng trả lại khấu trừ cho 1 phiếu nhập không thể vượt quá giá trị của chính phiếu nhập đó
      if (impTotal !== undefined && impTotal > 0) {
        return Math.min(impTotal, totalMatched);
      }
      return totalMatched;
    },
    [supplierReturnsList]
  );

  const getImportNetDebt = useCallback(
    (imp: StockImportSlip) => {
      const total = Number(imp.totalValue) || 0;
      const paid =
        imp.paidAmount !== undefined
          ? Number(imp.paidAmount)
          : imp.debtAmount !== undefined
          ? Math.max(0, total - Number(imp.debtAmount))
          : total;
      const grossDebt = Math.max(0, total - paid);
      const returned = getImportReturnDeduction(imp);
      return Math.max(0, grossDebt - returned);
    },
    [getImportReturnDeduction]
  );

  const handleReturnFromImportSlip = (imp: StockImportSlip, itemsList?: StockImportSlipItem[]) => {
    const nextNum = (supplierReturnsList.length + 91).toString().padStart(3, '0');
    const nowStr = new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const isUnpaid = (imp.paidAmount || 0) === 0 || (imp.debtAmount || 0) > 0 || ((imp.paidAmount || 0) < (imp.totalValue || 0));

    setWarehouseSubTab('returns');
    setReturnViewMode('create');
    setReturnCode(`#TH-2026-${nextNum}`);
    setReturnDate(nowStr);
    setReturnSourceCode(imp.code);
    setReturnSupplier(imp.supplier);
    setReturnWarehouse(imp.warehouseName);
    setReturnStaffName(user?.name || imp.inspector || 'Admin');
    setReturnReason(`Trả hàng từ phiếu nhập ${imp.code}`);
    setReturnSolution(isUnpaid ? 'Cấn trừ vào công nợ' : 'NCC đã hoàn lại tiền');
    setReturnPaymentMethod(isUnpaid ? 'Cấn trừ công nợ' : 'Chuyển khoản');
    setReturnPaidAmount(isUnpaid ? 0 : undefined);
    setReturnDiscount(0);

    let linesSource = (itemsList && itemsList.length > 0) ? itemsList : (imp.items || []);
    if (linesSource.length === 0 && imp.itemsJson) {
      try {
        linesSource = JSON.parse(imp.itemsJson);
      } catch {
        linesSource = [];
      }
    }

    if (linesSource.length > 0) {
      setReturnEntryLines(
        linesSource.map((it, i) => ({
          id: `ret_line_${Date.now()}_${i}`,
          code: it.code,
          name: it.name,
          spec: it.spec || '',
          unit: it.unit,
          quantity: it.quantity,
          purchasePrice: it.unitPrice || 0,
          returnPrice: it.unitPrice || 0,
          total: it.total || (it.quantity * (it.unitPrice || 0)),
        }))
      );
    }
    if (isUnpaid) {
      message.info(`Phiếu nhập ${imp.code} còn công nợ chưa trả -> Hệ thống tự động chọn hình thức "Cấn trừ công nợ" (không yêu cầu hoàn tiền mặt).`);
    } else {
      message.info(`Đã mở giao diện lập phiếu trả hàng NCC cho phiếu nhập ${imp.code}`);
    }
  };

  const handlePrintImportSlip = (imp: StockImportSlip, itemsList?: StockImportSlipItem[]) => {
    let itemsToPrint = (itemsList && itemsList.length > 0) ? itemsList : (imp.items || []);
    if (itemsToPrint.length === 0 && imp.itemsJson) {
      try {
        itemsToPrint = JSON.parse(imp.itemsJson);
      } catch {
        itemsToPrint = [];
      }
    }
    if (itemsToPrint.length === 0) {
      itemsToPrint = [
        {
          id: `line_${imp.id}`,
          code: imp.code,
          name: imp.itemName || 'Sản phẩm nội thất',
          unit: imp.unit || 'bộ',
          quantity: imp.quantity || 1,
          unitPrice: imp.unitPrice || 0,
          discount: imp.discount || 0,
          total: imp.totalValue || ((imp.quantity || 1) * (imp.unitPrice || 0)),
        },
      ];
    }
    const slipForPrint = {
      ...imp,
      note: importRowNotes[imp.id] !== undefined ? importRowNotes[imp.id] : (imp.note || ''),
      items: itemsToPrint,
    };
    printGoodsReceiptSlip(slipForPrint);
  };

  const handleConfirmPaySupplier = async () => {
    if (!paymentSlipTarget) return;
    if (paymentAmount <= 0) {
      message.warning('Vui lòng nhập số tiền chi lớn hơn 0!');
      return;
    }
    const currentDebt = getImportNetDebt(paymentSlipTarget);
    if (paymentAmount > currentDebt) {
      message.warning(`Số tiền chi không thể vượt quá công nợ còn lại (${currentDebt.toLocaleString('vi-VN')} đ)!`);
      return;
    }

    const newPaymentRecord = {
      id: `pay_${Date.now()}`,
      code: `PC${Date.now().toString().slice(-6)}`,
      date: new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      amount: paymentAmount,
      method: paymentMethodSelect,
      creator: user?.name || 'Admin',
      status: 'Đã chi tiền',
      note: paymentNoteText || `Thanh toán tiền hàng phiếu ${paymentSlipTarget.code}`,
    };

    const newPaid = (paymentSlipTarget.paidAmount || 0) + paymentAmount;
    const newDebt = Math.max(0, currentDebt - paymentAmount);
    const updatedPayments = [...(paymentSlipTarget.payments || []), newPaymentRecord];

    try {
      if (paymentSlipTarget.id && paymentSlipTarget.id.includes('-')) {
        await stockImportApi.updateStockImport(paymentSlipTarget.id, {
          paidAmount: newPaid,
          remainingDebt: newDebt,
        });
      }
      setImportsList((prev) => {
        const nextList = prev.map((s) => {
          if (s.id === paymentSlipTarget.id) {
            return {
              ...s,
              paidAmount: newPaid,
              debtAmount: newDebt,
              payments: updatedPayments,
            };
          }
          return s;
        });
        setStoredAdminData(ADMIN_STORAGE_KEYS.STOCK_IMPORTS, nextList);
        return nextList;
      });
      if (setSuppliersList) {
        setSuppliersList((prev) =>
          prev.map((s) => {
            if (s.name === paymentSlipTarget.supplier || s.id === (paymentSlipTarget as any).supplierId) {
              const oldDebt = Number(s.currentDebt || 0);
              const oldPaid = Number(s.totalCollected || 0);
              return {
                ...s,
                currentDebt: Math.max(0, oldDebt - paymentAmount),
                totalCollected: oldPaid + paymentAmount,
              };
            }
            return s;
          })
        );
      }
      await loadImportsFromApi();
      message.success(`Đã ghi nhận chi ${paymentAmount.toLocaleString('vi-VN')} đ cho nhà cung cấp ${paymentSlipTarget.supplier}!`);
      setPaymentModalVisible(false);
      setPaymentSlipTarget(null);
    } catch (e: any) {
      message.error(e?.message || 'Không thể cập nhật thanh toán vào hệ thống!');
    }
  };

  const handleDeleteImport = async (id: string, code: string) => {
    try {
      if (id && id.includes('-')) {
        await stockImportApi.deleteStockImport(id);
      }
      setImportsList((prev) => {
        const nextList = prev.filter((i) => i.id !== id && i.code !== code);
        setStoredAdminData(ADMIN_STORAGE_KEYS.STOCK_IMPORTS, nextList);
        return nextList;
      });
      setSelectedImportKeys((prev) => prev.filter((k) => k !== id));
      setExpandedImportRowKeys((prev) => prev.filter((k) => k !== id));
      await loadImportsFromApi();
      message.success(`Đã xóa phiếu nhập kho ${code}!`);
    } catch (err: any) {
      console.error('Error deleting import slip:', err);
      // Fallback local removal
      setImportsList((prev) => {
        const nextList = prev.filter((i) => i.id !== id && i.code !== code);
        setStoredAdminData(ADMIN_STORAGE_KEYS.STOCK_IMPORTS, nextList);
        return nextList;
      });
      setSelectedImportKeys((prev) => prev.filter((k) => k !== id));
      setExpandedImportRowKeys((prev) => prev.filter((k) => k !== id));
      message.success(`Đã xóa phiếu nhập kho ${code}!`);
    }
  };

  const handleOpenCreateStocktake = () => {
    const nextCode = `#KK-2026-${(auditSlips.length + 1).toString().padStart(2, '0')}`;
    setStocktakeSlipCode(nextCode);
    const defaultWh = availableBranchWarehouses[0]?.name || warehousesList[0]?.name || '';
    setStocktakeWarehouseName(defaultWh);
    setStocktakeNote('');
    setEditingSlipId(null);
    setStocktakeTabFilter('all');
    setStocktakeEntryLines([]);
    setStocktakeSearchProduct('');
    setStocktakeViewMode('create');
  };

  const handleOpenEditStocktake = (slip: AuditSlip) => {
    setStocktakeSlipCode(slip.code);
    const defaultWh = availableBranchWarehouses[0]?.name || warehousesList[0]?.name || '';
    setStocktakeWarehouseName(slip.scopeLabel || defaultWh);
    setStocktakeNote(slip.note || '');
    setEditingSlipId(slip.id);
    setStocktakeTabFilter('all');
    setStocktakeEntryLines(slip.items || []);
    setStocktakeViewMode('edit');
  };

  const handleSaveDraftStocktake = async () => {
    const matchedWarehouse = warehousesList.find((w) => w.name === stocktakeWarehouseName || w.id === stocktakeWarehouseName);
    const matchedCount = stocktakeEntryLines.filter((it) => (it.actualQty ?? 0) === (it.systemQty ?? 0)).length;
    const diffCount = stocktakeEntryLines.filter((it) => (it.actualQty ?? 0) !== (it.systemQty ?? 0)).length;

    const payload = {
      code: stocktakeSlipCode,
      title: `Phiên kiểm kê ${stocktakeWarehouseName}`,
      warehouseId: matchedWarehouse?.id && matchedWarehouse.id.includes('-') ? matchedWarehouse.id : undefined,
      scopeLabel: stocktakeWarehouseName,
      creator: user?.name || 'Thủ kho',
      auditDate: new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      status: 'draft',
      statusLabel: 'Đang kiểm đếm',
      totalItems: stocktakeEntryLines.length,
      matchedItems: matchedCount,
      discrepantItems: diffCount,
      totalDifferenceValue: 0,
      note: stocktakeNote || '',
      itemsJson: JSON.stringify(stocktakeEntryLines),
    };

    try {
      if (editingSlipId && editingSlipId.includes('-')) {
        await stockAuditApi.updateStockAudit(editingSlipId, payload);
      } else {
        await stockAuditApi.createStockAudit(payload);
      }
      await loadAuditsFromApi();
      message.success(`Đã lưu tạm phiếu kiểm ${stocktakeSlipCode} vào Database!`);
      setStocktakeViewMode('list');
    } catch (err: any) {
      console.error('Error saving stock audit:', err);
      message.error(err?.message || 'Không thể lưu phiếu kiểm kho vào Database!');
    }
  };

  const handleCompleteStocktake = async () => {
    const matchedWarehouse = warehousesList.find((w) => w.name === stocktakeWarehouseName || w.id === stocktakeWarehouseName);
    const matchedCount = stocktakeEntryLines.filter((it) => (it.actualQty ?? 0) === (it.systemQty ?? 0)).length;
    const diffCount = stocktakeEntryLines.filter((it) => (it.actualQty ?? 0) !== (it.systemQty ?? 0)).length;

    const payload = {
      code: stocktakeSlipCode,
      title: `Phiên kiểm kê ${stocktakeWarehouseName}`,
      warehouseId: matchedWarehouse?.id && matchedWarehouse.id.includes('-') ? matchedWarehouse.id : undefined,
      scopeLabel: stocktakeWarehouseName,
      creator: user?.name || 'Thủ kho',
      auditDate: new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      status: 'completed',
      statusLabel: 'Đã hoàn tất 100%',
      totalItems: stocktakeEntryLines.length,
      matchedItems: matchedCount,
      discrepantItems: diffCount,
      totalDifferenceValue: 0,
      note: stocktakeNote || '',
      itemsJson: JSON.stringify(stocktakeEntryLines),
    };

    try {
      if (editingSlipId && editingSlipId.includes('-')) {
        await stockAuditApi.updateStockAudit(editingSlipId, payload);
      } else {
        await stockAuditApi.createStockAudit(payload);
      }
      invalidateApiCache('products');
      await loadAuditsFromApi();
      await refreshCatalogProducts();
      message.success(`Đã hoàn tất và cân bằng tồn kho phiếu kiểm ${stocktakeSlipCode} vào Database!`);
      setStocktakeViewMode('list');
    } catch (err: any) {
      console.error('Error completing stock audit:', err);
      message.error(err?.message || 'Không thể hoàn tất phiếu kiểm kho!');
    }
  };

  const handleOpenCreateReturn = () => {
    if (!returnCode) {
      const nextNum = (supplierReturnsList.length + 9).toString().padStart(3, '0');
      const nowStr = new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      setReturnCode(`#TH-2026-${nextNum}`);
      setReturnDate(nowStr);
      setReturnStaffName(user?.name || 'Nguyễn Văn Nam (KCS)');
      setReturnSupplier(undefined);
      const defaultWh = availableBranchWarehouses[0]?.name || warehousesList[0]?.name || '';
      setReturnWarehouse(defaultWh);
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

  const handleSaveReturnSlip = async (targetStatus: 'completed' | 'draft') => {
    if (!returnSupplier || !returnSupplier.trim()) {
      message.error('Vui lòng chọn Nhà cung cấp nhận hàng trước khi lập phiếu trả hàng để cấn trừ công nợ chính xác!');
      return;
    }
    if (returnEntryLines.length === 0) {
      message.error('Vui lòng thêm ít nhất 1 mặt hàng vào phiếu trả hàng!');
      return;
    }
    const totalGoods = returnEntryLines.reduce((sum, item) => sum + (item.total || (item.quantity * item.returnPrice)), 0);
    const refund = Math.max(0, totalGoods - (returnDiscount || 0));
    const isOffset = returnPaymentMethod === 'Cấn trừ công nợ';
    const paid = isOffset ? 0 : Math.min(refund, Math.max(0, Number(returnPaidAmount !== undefined ? returnPaidAmount : refund)));
    const currentCode = returnCode || `#TH-2026-${(supplierReturnsList.length + 9).toString().padStart(3, '0')}`;
    const firstItem = returnEntryLines[0];

    const matchedSupplier = suppliersList.find((s) => s.name === returnSupplier || s.id === returnSupplier);
    const matchedWarehouse = warehousesList.find((w) => w.name === returnWarehouse || w.id === returnWarehouse);

    const payload = {
      code: currentCode,
      sourceImportCode: returnSourceCode || '',
      supplierName: matchedSupplier?.name || returnSupplier,
      supplierId: matchedSupplier?.id && matchedSupplier.id.includes('-') ? matchedSupplier.id : undefined,
      warehouseName: matchedWarehouse?.name || returnWarehouse || warehousesList[0]?.name || 'Tổng kho',
      warehouseId: matchedWarehouse?.id && matchedWarehouse.id.includes('-') ? matchedWarehouse.id : undefined,
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
      staffName: returnStaffName || user?.name || 'KCS',
      reason: returnReason || 'Lỗi quy cách / Kiểm định không đạt tiêu chuẩn',
      solution: returnSolution || 'Đã hoàn bù lô mới',
      status: targetStatus,
      statusLabel: targetStatus === 'draft' ? 'Phiếu tạm' : 'Đã trả hàng',
      note: returnNote || '',
      itemsJson: JSON.stringify(returnEntryLines),
    };

    try {
      await supplierReturnApi.createSupplierReturn(payload);
      await loadReturnsFromApi();
      await refreshCatalogProducts();
      await loadImportsFromApi();

      if (targetStatus === 'draft') {
        message.success(`Đã lưu tạm phiếu trả hàng "${payload.code}" vào Database thành công!`);
      } else {
        message.success(`Đã lập phiếu trả hàng "${payload.code}" vào Database thành công!`);
      }

      if (returnSourceCode) {
        setImportsList((prev) =>
          prev.map((imp) =>
            imp.code === returnSourceCode
              ? {
                  ...imp,
                  returnStatus: targetStatus === 'draft' ? 'Đang xuất trả' : 'Đã trả hàng',
                }
              : imp
          )
        );
      }

      setReturnEntryLines([]);
      setReturnCode('');
      setReturnSearchProduct('');
      setReturnViewMode('list');
    } catch (err: any) {
      console.error('Error saving supplier return slip:', err);
      message.error(err?.message || 'Không thể lưu phiếu trả hàng vào Database!');
    }
  };

  const handleDeleteReturnSlip = async (id: string, code: string) => {
    try {
      if (id && id.includes('-')) {
        await supplierReturnApi.deleteSupplierReturn(id);
      }
      setSupplierReturnsList((prev) => {
        const nextList = prev.filter((r) => r.id !== id && r.code !== code);
        setStoredAdminData(ADMIN_STORAGE_KEYS.SUPPLIER_RETURNS, nextList);
        return nextList;
      });
      setSelectedReturnKeys((prev) => prev.filter((k) => k !== id));
      setExpandedReturnRowKeys((prev) => prev.filter((k) => k !== id));
      await loadReturnsFromApi();
      await loadImportsFromApi();
      message.success(`Đã xóa phiếu trả hàng ${code}!`);
    } catch (err: any) {
      console.error('Error deleting supplier return:', err);
      setSupplierReturnsList((prev) => {
        const nextList = prev.filter((r) => r.id !== id && r.code !== code);
        setStoredAdminData(ADMIN_STORAGE_KEYS.SUPPLIER_RETURNS, nextList);
        return nextList;
      });
      setSelectedReturnKeys((prev) => prev.filter((k) => k !== id));
      setExpandedReturnRowKeys((prev) => prev.filter((k) => k !== id));
      message.success(`Đã xóa phiếu trả hàng ${code}!`);
    }
  };

  const handleSaveReturnNote = async (ret: SupplierReturnSlip) => {
    const currentNote = returnRowNotes[ret.id] !== undefined ? returnRowNotes[ret.id] : (ret.note || '');
    try {
      if (ret.id && ret.id.includes('-')) {
        await supplierReturnApi.updateSupplierReturn(ret.id, { note: currentNote });
      }
      setSupplierReturnsList((prev) => {
        const nextList = prev.map((item) => (item.id === ret.id ? { ...item, note: currentNote } : item));
        setStoredAdminData(ADMIN_STORAGE_KEYS.SUPPLIER_RETURNS, nextList);
        return nextList;
      });
      message.success(`Đã lưu ghi chú phiếu trả hàng ${ret.code} thành công!`);
    } catch (e: any) {
      message.error(e?.message || 'Lỗi khi lưu ghi chú phiếu trả hàng.');
    }
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

  const handleExportSingleImportDetail = (imp: StockImportSlip, itemsList?: StockImportSlipItem[]) => {
    let itemsToExport: StockImportSlipItem[] = (itemsList && itemsList.length > 0) ? itemsList : (imp.items || []);
    if (itemsToExport.length === 0 && imp.itemsJson) {
      try {
        itemsToExport = JSON.parse(imp.itemsJson);
      } catch {
        itemsToExport = [];
      }
    }
    if (itemsToExport.length === 0) {
      itemsToExport = [
        {
          id: `line_${imp.id}`,
          code: imp.code,
          name: imp.itemName || 'Hàng hóa nhập kho',
          unit: imp.unit || 'bộ',
          quantity: imp.quantity || 1,
          unitPrice: imp.unitPrice || 0,
          discount: imp.discount || 0,
          total: imp.totalValue || ((imp.quantity || 1) * (imp.unitPrice || 0)),
        },
      ];
    }

    const exportData = itemsToExport.map((item, idx) => ({
      'STT': idx + 1,
      'Mã phiếu nhập': imp.code,
      'Thời gian nhập': imp.importDate,
      'Kho tiếp nhận': imp.warehouseName,
      'Nhà cung cấp': imp.supplier,
      'Mã hàng': item.code || '---',
      'Tên hàng hóa': item.name || imp.itemName,
      'Số lượng': item.quantity,
      'Đơn giá nhập (VNĐ)': item.unitPrice || 0,
      'Giảm giá (VNĐ)': item.discount || 0,
      'Giá nhập (VNĐ)': item.importPrice ?? item.unitPrice ?? 0,
      'Thành tiền (VNĐ)': item.total || (item.quantity * (item.unitPrice || 0)),
      'Tổng tiền hàng': imp.totalValue || 0,
      'Đã thanh toán (VNĐ)': imp.paidAmount !== undefined ? imp.paidAmount : imp.totalValue,
      'Còn nợ NCC (VNĐ)': Math.max(0, (imp.totalValue || 0) - (imp.paidAmount !== undefined ? imp.paidAmount : imp.totalValue)),
      'Trạng thái': imp.statusLabel || (imp.status === 'draft' ? 'Phiếu tạm' : 'Đã nhập kho'),
      'Ghi chú': importRowNotes[imp.id] ?? imp.note ?? '',
    }));

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
    const isUnpaid = importPaymentMethod === 'Chưa thanh toán';
    const paid = isUnpaid ? 0 : Math.min(payable, Math.max(0, Number(importPaidAmount !== undefined ? importPaidAmount : payable)));
    const debt = Math.max(0, payable - paid);

    const exportData = importEntryLines.map((line, idx) => ({
      'STT': idx + 1,
      'Mã phiếu nhập': importCode || '#PN-2026-NEW',
      'Mã hàng': line.code,
      'Tên sản phẩm': line.name,
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
    const exportData = supplierReturnsList.map((r, idx) => {
      const isOffset = isSlipOffsetDebt(r);
      return {
        'STT': idx + 1,
        'Mã phiếu trả': r.code,
        'Phiếu nhập gốc': r.sourcePurchaseEntryCode || 'Không liên kết',
        'Nhà cung cấp nhận': r.supplierName,
        'Kho xuất trả': r.warehouseName || '',
        'Tên mặt hàng hoàn trả': r.itemName,
        'Quy cách': r.spec || '',
        'Số lượng trả': r.quantity,
        'Đơn giá trả (VNĐ)': r.returnPrice || r.purchasePrice || 0,
        'Tổng tiền hàng trả (VNĐ)': r.totalGoods || r.supplierRefund || 0,
        'Cấn trừ nợ NCC (VNĐ)': isOffset ? (r.supplierRefund || r.totalGoods || 0) : 0,
        'NCC cần hoàn tiền (VNĐ)': isOffset ? 0 : (r.supplierRefund || 0),
        'NCC đã hoàn tiền (VNĐ)': isOffset ? 0 : (r.paidAmount !== undefined ? r.paidAmount : (r.supplierRefund || 0)),
        'Hình thức xử lý': r.paymentMethod || (isOffset ? 'Cấn trừ công nợ' : 'Chuyển khoản'),
        'Phương án xử lý': r.solution || (isOffset ? 'Cấn trừ vào công nợ' : 'Đã hoàn bù lô mới'),
        'Ngày xuất trả': r.returnDate,
        'Người lập phiếu': r.staffName || 'Nguyễn Văn Nam (KCS)',
        'Lý do trả hàng': r.reason,
        'Trạng thái': r.status === 'completed' ? (isOffset ? 'Đã cấn trừ công nợ' : 'Đã hoàn tất trả hàng') : 'Bản lưu tạm',
      };
    });
    exportToExcel(exportData, 'Danh_sach_phieu_tra_hang');
    message.success('Đã xuất danh sách phiếu trả hàng ra file Excel thành công!');
  };

  const handleExportSingleReturnDetail = (r: SupplierReturnSlip) => {
    const isOffset = isSlipOffsetDebt(r);
    const exportData = [
      {
        'Mã phiếu trả': r.code,
        'Phiếu nhập gốc': r.sourcePurchaseEntryCode || 'Không liên kết',
        'Mã hàng': r.code,
        'Tên mặt hàng hoàn trả': r.itemName,
        'Quy cách': r.spec || '',
        'Số lượng trả': r.quantity,
        'Giá nhập ban đầu (VNĐ)': r.purchasePrice || 0,
        'Giá xuất trả (VNĐ)': r.returnPrice || r.purchasePrice || 0,
        'Tổng tiền hàng trả (VNĐ)': r.totalGoods || r.supplierRefund || 0,
        'Giảm giá / Chiết khấu': r.invoiceDiscount || 0,
        'Cấn trừ nợ NCC (VNĐ)': isOffset ? (r.supplierRefund || r.totalGoods || 0) : 0,
        'NCC cần hoàn tiền (VNĐ)': isOffset ? 0 : (r.supplierRefund || 0),
        'NCC đã hoàn tiền (VNĐ)': isOffset ? 0 : (r.paidAmount !== undefined ? r.paidAmount : (r.supplierRefund || 0)),
        'Nhà cung cấp nhận': r.supplierName,
        'Kho xuất trả': r.warehouseName || '',
        'Ngày xuất trả': r.returnDate,
        'Người lập phiếu': r.staffName || 'Nguyễn Văn Nam (KCS)',
        'Hình thức xử lý': r.paymentMethod || (isOffset ? 'Cấn trừ công nợ' : 'Chuyển khoản'),
        'Phương án xử lý': r.solution || (isOffset ? 'Cấn trừ vào công nợ' : 'Đã hoàn bù lô mới'),
        'Lý do hoàn trả': r.reason,
        'Trạng thái': r.status === 'completed' ? (isOffset ? 'Đã cấn trừ công nợ' : 'Đã hoàn tất trả hàng') : 'Bản lưu tạm',
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
    const isOffset = returnPaymentMethod === 'Cấn trừ công nợ';
    const paid = isOffset ? 0 : Math.min(refund, Math.max(0, Number(returnPaidAmount !== undefined ? returnPaidAmount : refund)));
    const remaining = Math.max(0, refund - paid);

    const exportData = returnEntryLines.map((line, idx) => ({
      'STT': idx + 1,
      'Mã phiếu trả': returnCode || '#TH-2026-NEW',
      'Phiếu nhập gốc': returnSourceCode || 'Không liên kết',
      'Mã hàng': line.code,
      'Tên sản phẩm': line.name,
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

  const handleExportCreateStocktakeLinesExcel = () => {
    if (!stocktakeEntryLines || stocktakeEntryLines.length === 0) {
      message.warning('Chưa có mặt hàng nào trong phiếu kiểm kê để xuất Excel!');
      return;
    }
    const exportData = stocktakeEntryLines.map((line, idx) => ({
      'STT': idx + 1,
      'Mã phiếu kiểm': stocktakeSlipCode || 'KK-2026-08',
      'Mã hàng': line.code,
      'Tên sản phẩm': line.name,
      'Độ ẩm MC': line.actualMc || line.systemMc || '---',
      'Tồn sổ sách': line.systemQty,
      'Tồn thực tế': line.actualQty,
      'Số lượng chênh lệch': (Number(line.actualQty) || 0) - (Number(line.systemQty) || 0),
      'Trạng thái kiểm': line.status === 'matched' ? 'Khớp tồn' : 'Lệch tồn',
      'Vị trí / Kho': line.location || stocktakeWarehouseName,
      'Ghi chú chất lượng': line.qualityNote || '',
      'Kho kiểm kê': stocktakeWarehouseName,
      'Người kiểm': stocktakeStaffName || user?.name || 'Nguyễn Văn Nam (Thủ kho)',
      'Ngày kiểm': stocktakeDate || new Date().toLocaleDateString('vi-VN'),
    }));
    exportToExcel(exportData, `Phieu_kiem_kho_${(stocktakeSlipCode || 'KK').replace(/[^a-zA-Z0-9_-]/g, '')}`);
    message.success(`Đã xuất dữ liệu phiếu kiểm kho ${stocktakeSlipCode} ra file Excel thành công!`);
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

          <div className="flex-1 flex flex-col h-full">
            {/* Sub-Tabs Switcher (Domaco Kho Header: 5 Tabs Architecture - Flush with Main Header) */}
            <div className="-mx-4 sm:-mx-5 lg:-mx-6 -mt-4 sm:-mt-5 lg:-mt-6 px-4 sm:px-6 lg:px-8 py-2.5 bg-white border-b border-[#eae1dd] flex flex-wrap items-center justify-between gap-3 shadow-2xs mb-4">
              <Segmented
                value={warehouseSubTab === 'warehouses' ? 'imports' : warehouseSubTab}
                onChange={(val: any) => handleSubTabChange(val)}
                options={[
                  { value: 'imports', label: <span className="px-2 py-1 font-medium text-xs sm:text-sm">📥 Nhập hàng</span> },
                  { value: 'returns', label: <span className="px-2 py-1 font-medium text-xs sm:text-sm">🔄 Trả hàng</span> },
                  { value: 'stocktake', label: <span className="px-2 py-1 font-medium text-xs sm:text-sm">📋 Kiểm kho</span> },
                  { value: 'suppliers', label: <span className="px-2 py-1 font-medium text-xs sm:text-sm">🏭 Nhà cung cấp</span> },
                ]}
                className="bg-slate-100 p-1 rounded-lg"
              />
            </div>

            {/* SUB-TAB 1: DANH SÁCH KHO HÀNG (DOMACO WAREHOUSES MASTER) */}
            {warehouseSubTab === 'warehouses' && (() => {
              const filteredWarehouses = warehousesList.filter((w) => {
                const q = warehouseSearchQuery.toLowerCase();
                const matchSearch =
                  !warehouseSearchQuery ||
                  (w.name || '').toLowerCase().includes(q) ||
                  (w.code || '').toLowerCase().includes(q) ||
                  (w.branch || '').toLowerCase().includes(q) ||
                  (w.streetAddress || '').toLowerCase().includes(q) ||
                  (w.address || '').toLowerCase().includes(q);
                const matchBranch = isMatchGlobalBranch(w.branch) || isMatchGlobalBranch(w.name);
                const matchStatus = warehouseStatusFilter === 'all' || w.status === warehouseStatusFilter;
                return matchSearch && matchBranch && matchStatus;
              });

              return (
              <div className="space-y-4">
                {/* 2-Column Layout: Filter Sidebar + Warehouses Table */}
                <div className="flex flex-col lg:flex-row gap-4 items-start">
                  {/* Filter Sidebar */}
                  <AdminFilterSidebar
                    title="Bộ lọc kho"
                    hasActiveFilters={Boolean(warehouseStatusFilter !== 'all' || warehouseSearchQuery)}
                    onResetFilters={() => {
                      setWarehouseSearchQuery('');
                      setWarehouseStatusFilter('all');
                      setSelectedWarehouseKeys([]);
                    }}
                  >
                    {/* Trạng thái hoạt động */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-800 text-xs block">Trạng thái hoạt động</label>
                      <Select
                        value={warehouseStatusFilter}
                        onChange={(v) => setWarehouseStatusFilter(v)}
                        className="w-full text-xs"
                        size="small"
                        options={[
                          { value: 'all', label: `Tất cả trạng thái (${warehousesList.length})` },
                          { value: 'active', label: `Đang hoạt động (${warehousesList.filter(w => w.status === 'active').length})` },
                          { value: 'inactive', label: `Tạm dừng (${warehousesList.filter(w => w.status === 'inactive').length})` },
                        ]}
                      />
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
                  </AdminFilterSidebar>

                  {/* Main Warehouses Table */}
                  <div className="min-w-0 flex-1 w-full">
                    <AdminDataTable
                      enableSelectionToolbar
                      selectedRowKeys={selectedWarehouseKeys}
                      onSelectionChange={(keys) => setSelectedWarehouseKeys(keys)}
                      titleText="Quản lý kho"
                      totalCount={filteredWarehouses.length}
                      countUnit="kho"
                      onCopySelected={handleCopySelectedWarehouse}
                      onEditSelected={handleEditSelectedWarehouse}
                      onDeleteSelected={handleDeleteSelectedWarehouses}
                      deleteConfirmTitle={`Xóa ${selectedWarehouseKeys.length} kho đã chọn?`}
                      onCreateNew={handleOpenCreateWarehouse}
                      createButtonText="Kho"
                      searchValue={warehouseSearchQuery}
                      onSearchChange={(val) => setWarehouseSearchQuery(val)}
                      searchPlaceholder="Tìm theo mã, tên, địa chỉ..."
                      extraHeaderActions={
                        <>
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
                      dataSource={filteredWarehouses}
                      rowKey="id"
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
              );
            })()}

            {/* SUB-TAB 2: NHẬP HÀNG HÓA (STOCK IN / IMPORTS - LIST MODE) */}
            {warehouseSubTab === 'imports' && importViewMode === 'list' && (
              <div className="space-y-4 flex-1 flex flex-col h-full">
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
                    const matchWarehouse = importWarehouseFilter === 'all' || imp.warehouseName === importWarehouseFilter;
                    const matchDate = checkDateInRange(imp.importDate, importDateRange);
                    return matchSearch && matchBranch && matchStatus && matchWarehouse && matchDate;
                  });
                  const totalImportGoodsSum = filteredImports.reduce((acc, i) => acc + (i.totalValue || 0), 0);
                  const totalImportPaidSum = filteredImports.reduce((acc, i) => acc + (i.paidAmount !== undefined ? i.paidAmount : i.totalValue), 0);
                  const totalImportReturnSum = filteredImports.reduce((acc, i) => acc + getImportReturnDeduction(i), 0);
                  const totalImportDebtSum = filteredImports.reduce((acc, i) => acc + getImportNetDebt(i), 0);

                  return (
                    <div className="flex flex-col lg:flex-row gap-4 items-start flex-1">
                      {/* Left Filter Sidebar */}
                      <AdminFilterSidebar
                        title="Bộ lọc phiếu nhập"
                        hasActiveFilters={Boolean(importSearchQuery || importStatusFilter !== 'all' || importWarehouseFilter !== 'all' || importDateRange)}
                        onResetFilters={() => {
                          setImportSearchQuery('');
                          setImportStatusFilter('all');
                          setImportWarehouseFilter('all');
                          setImportDateRange(null);
                          setSelectedImportKeys([]);
                        }}
                      >
                        {/* Trạng thái nhập kho */}
                        <div className="space-y-1.5">
                          <label className="font-semibold text-slate-800 text-xs block">Trạng thái phiếu</label>
                          <Select
                            value={importStatusFilter}
                            onChange={(v) => setImportStatusFilter(v)}
                            className="w-full text-xs"
                            size="small"
                            options={[
                              { value: 'all', label: 'Tất cả trạng thái' },
                              { value: 'completed', label: 'Đã nhập kho' },
                              { value: 'draft', label: 'Lưu tạm' },
                              { value: 'inspecting', label: 'Đang kiểm KCS' },
                            ]}
                          />
                        </div>

                        {/* Kho tiếp nhận */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-100">
                          <label className="font-semibold text-slate-800 text-xs block">Kho tiếp nhận</label>
                          <Select
                            value={importWarehouseFilter}
                            onChange={(v) => setImportWarehouseFilter(v)}
                            className="w-full text-xs"
                            size="small"
                            options={[
                              { value: 'all', label: 'Tất cả kho' },
                              ...availableBranchWarehouses.map((w) => ({ value: w.name, label: w.name })),
                            ]}
                          />
                        </div>

                        {/* Thời gian nhập */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-100">
                          <label className="font-semibold text-slate-800 text-xs block">Thời gian nhập</label>
                          <PosDateFilter
                            value={importDateRange}
                            onChange={(range) => setImportDateRange(range)}
                          />
                        </div>

                        {/* Summary Card */}
                        <AdminSidebarSummary
                          title="Thống kê nhập kho"
                          className="mt-3"
                          items={[
                            { label: 'Tổng số phiếu', value: `${filteredImports.length} phiếu` },
                            { label: 'Tổng giá trị nhập', value: `${totalImportGoodsSum.toLocaleString('vi-VN')} đ`, color: 'primary' },
                            ...(totalImportReturnSum > 0
                              ? [{ label: 'Giá trị đã trả lại', value: `${totalImportReturnSum.toLocaleString('vi-VN')} đ`, color: 'warning' as const }]
                              : []),
                            { label: 'Đã thanh toán', value: `${totalImportPaidSum.toLocaleString('vi-VN')} đ`, color: 'success' },
                            { label: 'Còn nợ NCC', value: `${totalImportDebtSum.toLocaleString('vi-VN')} đ`, color: totalImportDebtSum > 0 ? 'danger' : 'default' },
                          ]}
                        />
                      </AdminFilterSidebar>

                      {/* Right Main Imports Table */}
                      <div className="min-w-0 flex-1 w-full">
                        <AdminDataTable
                          enableSelectionToolbar
                          selectedRowKeys={selectedImportKeys}
                          onSelectionChange={(keys) => setSelectedImportKeys(keys)}
                          titleText="Quản lý nhập hàng"
                          totalCount={filteredImports.length}
                          countUnit="phiếu"
                          onCreateNew={handleOpenCreateImport}
                          createButtonText="Nhập hàng"
                          onCopySelected={handleCopySelectedImport}
                          onEditSelected={handleEditSelectedImport}
                          onDeleteSelected={handleDeleteSelectedImports}
                          deleteConfirmTitle={`Xóa ${selectedImportKeys.length} phiếu nhập đã chọn?`}
                          searchValue={importSearchQuery}
                          onSearchChange={(val) => setImportSearchQuery(val)}
                          searchPlaceholder="Tìm theo mã phiếu, NCC, mặt hàng, kho..."
                          extraHeaderActions={
                            <>
                              <Button
                                icon={<DownloadOutlined />}
                                onClick={handleExportImportsExcel}
                                className="!h-8 px-2.5 rounded-lg border-slate-300 bg-white text-slate-700 text-xs shadow-xs inline-flex items-center justify-center hover:text-[#784e34]"
                                title="Xuất Excel"
                              >
                                Xuất Excel
                              </Button>
                            </>
                          }
                          dataSource={filteredImports}
                          rowKey="id"
                  onRow={(record) => {
                    const isExp = expandedImportRowKeys.includes(record.id);
                    return {
                      onClick: () => {
                        setExpandedImportRowKeys(isExp ? [] : [record.id]);
                        if (!isExp && !importRowTabs[record.id]) {
                          setImportRowTabs((prev) => ({ ...prev, [record.id]: 'items' }));
                        }
                      },
                      className: `cursor-pointer transition-colors ${
                        isExp
                          ? '!bg-amber-50/80 [&>td]:!bg-amber-50/80 font-medium'
                          : 'hover:!bg-slate-50 [&>td]:hover:!bg-slate-50'
                      }`,
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
                      const setTab = (t: 'items' | 'info' | 'payments') => {
                        setImportRowTabs((prev) => ({ ...prev, [imp.id]: t }));
                      };

                      const itemsList: StockImportSlipItem[] =
                        imp.items && imp.items.length > 0
                          ? imp.items
                          : imp.itemsJson
                          ? (() => {
                              try {
                                const parsed = JSON.parse(imp.itemsJson);
                                return Array.isArray(parsed) && parsed.length > 0 ? parsed : [];
                              } catch {
                                return [];
                              }
                            })()
                          : [];

                      const activeItemsList: StockImportSlipItem[] =
                        itemsList.length > 0
                          ? itemsList
                          : [
                              {
                                id: `line_${imp.id}`,
                                code: imp.code || 'SP003261',
                                name: imp.itemName || 'Sản phẩm nội thất nhập khẩu',
                                unit: imp.unit || 'Bộ',
                                batch: '---',
                                expiryDate: '---',
                                quantity: imp.quantity || 1,
                                unitPrice: imp.unitPrice || 0,
                                discount: imp.discount || 0,
                                importPrice: imp.unitPrice || 0,
                                total: imp.totalValue || ((imp.quantity || 1) * (imp.unitPrice || 0)),
                              },
                            ];

                      const totalQty = activeItemsList.reduce((acc, item) => acc + (item.quantity || 0), 0);
                      const totalGoods = imp.totalValue || activeItemsList.reduce((acc, item) => acc + (item.total || 0), 0);
                      const discountAmount = imp.discount || 0;
                      const paidAmount = imp.paidAmount !== undefined ? imp.paidAmount : totalGoods;
                      const returnDeduction = getImportReturnDeduction(imp);
                      const netDebt = Math.max(0, (totalGoods - paidAmount) - returnDeduction);

                      return (
                        <div
                          className="bg-white border-x border-b border-slate-200 shadow-sm overflow-hidden mb-2 text-slate-800"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* 1. Header Tabs Strip (Domaco POS Style) */}
                          <div className="flex items-center gap-6 border-b border-slate-200 px-5 pt-3 bg-white overflow-x-auto">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTab('items');
                              }}
                              className={`border-b-2 px-1 pb-2.5 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                                currentTab === 'items'
                                  ? 'border-[#008080] text-[#008080]'
                                  : 'border-transparent text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Hàng hóa ({activeItemsList.length})
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTab('info');
                              }}
                              className={`border-b-2 px-1 pb-2.5 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                                currentTab === 'info'
                                  ? 'border-[#008080] text-[#008080]'
                                  : 'border-transparent text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Thông tin
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTab('payments');
                              }}
                              className={`border-b-2 px-1 pb-2.5 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                                currentTab === 'payments'
                                  ? 'border-[#008080] text-[#008080]'
                                  : 'border-transparent text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Lịch sử thanh toán
                            </button>
                          </div>

                          {/* 2. Tab Body */}
                          <div className="p-4 space-y-4">
                            {/* TAB 1: HÀNG HÓA */}
                            {currentTab === 'items' && (
                              <div className="space-y-4">
                                {/* Table of items */}
                                <div className="overflow-x-auto border border-slate-200 bg-white">
                                  <table className="min-w-full text-xs">
                                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                                      <tr>
                                        <th className="px-3 py-2 text-left w-28">Mã hàng</th>
                                        <th className="px-3 py-2 text-left">Tên hàng</th>
                                        <th className="px-3 py-2 text-left w-28">Hạn sử dụng</th>
                                        <th className="px-3 py-2 text-right w-24">Số lượng</th>
                                        <th className="px-3 py-2 text-right w-28">Đơn giá</th>
                                        <th className="px-3 py-2 text-right w-24">Giảm giá</th>
                                        <th className="px-3 py-2 text-right w-28">Giá nhập</th>
                                        <th className="px-3 py-2 text-right w-32">Thành tiền</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {activeItemsList.map((item, idx) => (
                                        <tr key={item.id || idx} className="hover:bg-slate-50/70">
                                          <td className="px-3 py-2.5 font-mono text-[#008080] font-medium">
                                            <span
                                              className="cursor-pointer hover:underline inline-flex items-center gap-1 group"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (onNavigateToProduct) onNavigateToProduct(item.code || item.name);
                                              }}
                                              title={`Xem chi tiết sản phẩm "${item.name}" trong danh mục`}
                                            >
                                              <span>{item.code}</span>
                                              <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
                                            </span>
                                          </td>
                                          <td className="px-3 py-2.5 font-medium text-slate-900">
                                            <span
                                              className="cursor-pointer hover:text-[#008080] hover:underline"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (onNavigateToProduct) onNavigateToProduct(item.code || item.name);
                                              }}
                                              title={`Xem chi tiết sản phẩm "${item.name}"`}
                                            >
                                              {item.name}
                                            </span>
                                          </td>
                                          <td className="px-3 py-2.5 text-slate-400">{item.expiryDate || '---'}</td>
                                          <td className="px-3 py-2.5 text-right font-mono font-medium text-slate-900">
                                            {item.quantity}
                                          </td>
                                          <td className="px-3 py-2.5 text-right font-mono text-slate-700">
                                            {(item.unitPrice || 0).toLocaleString('vi-VN')}
                                          </td>
                                          <td className="px-3 py-2.5 text-right font-mono text-slate-500">
                                            {(item.discount || 0).toLocaleString('vi-VN')}
                                          </td>
                                          <td className="px-3 py-2.5 text-right font-mono text-slate-700">
                                            {(item.importPrice ?? item.unitPrice ?? 0).toLocaleString('vi-VN')}
                                          </td>
                                          <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-950">
                                            {(item.total || (item.quantity * (item.unitPrice || 0))).toLocaleString('vi-VN')}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>

                                {/* Bottom 2-Column: Ghi chú (Left) & Financial Summary (Right) */}
                                <div className="flex flex-col md:flex-row gap-6 items-start justify-between pt-1">
                                  {/* Left: Ghi chú full box */}
                                  <div className="flex-1 w-full">
                                    <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                                      Ghi chú
                                    </label>
                                    <Input.TextArea
                                      rows={4}
                                      value={importRowNotes[imp.id] !== undefined ? importRowNotes[imp.id] : (imp.note || '')}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setImportRowNotes((prev) => ({ ...prev, [imp.id]: val }));
                                      }}
                                      placeholder="Ghi chú phiếu nhập hàng..."
                                      className="w-full text-xs rounded-none border border-slate-200 bg-white p-2.5 text-slate-700 resize-none hover:border-slate-300 focus:border-[#008080]"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>

                                  {/* Right: Metrics Calculation lines */}
                                  <div className="w-full md:w-80 shrink-0 space-y-1.5 text-xs text-slate-700 bg-slate-50/50 p-3 border border-slate-100">
                                    <div className="flex justify-between items-center py-0.5">
                                      <span className="text-slate-600">Số lượng mặt hàng</span>
                                      <span className="font-mono font-semibold text-slate-900">{activeItemsList.length}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-0.5">
                                      <span className="text-slate-600">Tổng số lượng</span>
                                      <span className="font-mono font-semibold text-slate-900">{totalQty}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-0.5">
                                      <span className="text-slate-600">Tổng tiền hàng</span>
                                      <span className="font-mono font-semibold text-slate-900">{totalGoods.toLocaleString('vi-VN')}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-0.5">
                                      <span className="text-slate-600">Giảm giá</span>
                                      <span className="font-mono text-slate-700">{discountAmount.toLocaleString('vi-VN')}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                                      <span className="font-bold text-slate-950 text-sm">Tổng cộng</span>
                                      <span className="font-mono font-bold text-slate-950 text-base">{totalGoods.toLocaleString('vi-VN')}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-0.5">
                                      <span className="font-semibold text-slate-800">Tiền đã trả NCC</span>
                                      <span className="font-mono font-bold text-emerald-700 text-sm">{paidAmount.toLocaleString('vi-VN')}</span>
                                    </div>
                                    {returnDeduction > 0 && (
                                      <div className="flex justify-between items-center py-0.5 text-amber-700">
                                        <span className="font-semibold">Hàng đã trả lại NCC</span>
                                        <span className="font-mono font-bold text-sm">-{returnDeduction.toLocaleString('vi-VN')}</span>
                                      </div>
                                    )}
                                    <div className="flex justify-between items-center py-0.5">
                                      <span className="font-semibold text-slate-800">Còn nợ NCC</span>
                                      <span className={`font-mono font-bold text-sm ${netDebt > 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                                        {netDebt.toLocaleString('vi-VN')}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* TAB 2: THÔNG TIN PHIẾU NHẬP */}
                            {currentTab === 'info' && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/70 p-4 border border-slate-200 text-xs">
                                <div>
                                  <span className="text-slate-400 block text-[11px] mb-0.5">Mã nhập hàng:</span>
                                  <span className="font-mono font-bold text-[#008080]">{imp.code}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[11px] mb-0.5">Thời gian nhập hàng:</span>
                                  <span className="font-mono font-medium text-slate-800">{imp.importDate}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[11px] mb-0.5">Kho tiếp nhận:</span>
                                  <span className="font-bold text-slate-900">{imp.warehouseName}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[11px] mb-0.5">Nhà cung cấp:</span>
                                  <span className="font-semibold text-slate-900">{imp.supplier}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[11px] mb-0.5">Mã nhà cung cấp:</span>
                                  <span className="font-mono font-medium text-slate-700">{imp.supplierCode || 'NCC lẻ'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[11px] mb-0.5">Người tạo / Người nhập:</span>
                                  <span className="font-medium text-slate-800">{imp.creator || imp.inspector || 'Admin'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[11px] mb-0.5">Số hóa đơn đầu vào:</span>
                                  <span className="font-mono font-medium text-slate-800">{imp.invoiceNumber || 'Chưa kèm hóa đơn'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[11px] mb-0.5">Trạng thái:</span>
                                  <span className="font-medium text-emerald-700">{imp.statusLabel || (imp.status === 'draft' ? 'Phiếu tạm' : 'Đã nhập hàng')}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[11px] mb-0.5">Trạng thái trả hàng:</span>
                                  <span className="font-medium text-slate-700">{imp.returnStatus || 'Chưa trả'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[11px] mb-0.5">Hình thức thanh toán:</span>
                                  <span className="font-medium text-slate-800">{imp.paymentMethod || 'Chuyển khoản'}</span>
                                </div>
                                <div className="sm:col-span-2">
                                  <span className="text-slate-400 block text-[11px] mb-0.5">Ghi chú phiếu:</span>
                                  <span className="text-slate-700 italic">{importRowNotes[imp.id] !== undefined ? importRowNotes[imp.id] : (imp.note || 'Không có ghi chú')}</span>
                                </div>
                              </div>
                            )}

                            {/* TAB 3: LỊCH SỬ THANH TOÁN */}
                            {currentTab === 'payments' && (
                              <div className="space-y-3">
                                {/* Summary banner & Pay button if remaining debt */}
                                <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200">
                                  <div className="flex items-center gap-4 text-xs">
                                    <span>Tổng tiền hàng: <strong className="font-mono text-slate-900">{totalGoods.toLocaleString('vi-VN')} đ</strong></span>
                                    <span>•</span>
                                    <span>Đã trả NCC: <strong className="font-mono text-emerald-700">{paidAmount.toLocaleString('vi-VN')} đ</strong></span>
                                    {returnDeduction > 0 && (
                                      <>
                                        <span>•</span>
                                        <span className="text-amber-700">Hàng đã trả: <strong className="font-mono">-{returnDeduction.toLocaleString('vi-VN')} đ</strong></span>
                                      </>
                                    )}
                                    <span>•</span>
                                    <span>Còn nợ NCC: <strong className={`font-mono ${netDebt > 0 ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>{netDebt.toLocaleString('vi-VN')} đ</strong></span>
                                  </div>
                                  {netDebt > 0 && (
                                    <Button
                                      size="small"
                                      type="primary"
                                      icon={<DollarOutlined />}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPaymentSlipTarget(imp);
                                        setPaymentAmount(Math.max(0, netDebt));
                                        setPaymentNoteText(`Thanh toán tiền hàng phiếu ${imp.code}`);
                                        setPaymentModalVisible(true);
                                      }}
                                      className="h-7 text-xs !bg-[#008080] !border-[#008080] hover:!bg-[#006666] font-medium"
                                    >
                                      + Lập phiếu chi trả nợ NCC
                                    </Button>
                                  )}
                                </div>

                                <div className="overflow-x-auto border border-slate-200 bg-white">
                                  <table className="min-w-full text-xs">
                                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                                      <tr>
                                        <th className="px-3 py-2 text-left w-32">Mã phiếu chi</th>
                                        <th className="px-3 py-2 text-left w-36">Thời gian</th>
                                        <th className="px-3 py-2 text-left w-36">Phương thức</th>
                                        <th className="px-3 py-2 text-right w-36">Số tiền chi</th>
                                        <th className="px-3 py-2 text-left w-32">Người tạo</th>
                                        <th className="px-3 py-2 text-center w-28">Trạng thái</th>
                                        <th className="px-3 py-2 text-left">Ghi chú</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {(imp.payments && imp.payments.length > 0 ? imp.payments : [
                                        {
                                          id: `pay_${imp.id}`,
                                          code: `PC${imp.code.replace(/[^0-9]/g, '') || '000329'}`,
                                          date: imp.importDate,
                                          amount: paidAmount,
                                          method: imp.paymentMethod || 'Chuyển khoản (VietQR)',
                                          creator: imp.creator || 'Admin',
                                          status: 'Đã chi tiền',
                                          note: `Thanh toán tiền hàng nhập theo phiếu ${imp.code}`,
                                        },
                                      ]).map((pay) => (
                                        <tr key={pay.id} className="hover:bg-slate-50/70">
                                          <td className="px-3 py-2.5 font-mono text-[#008080] font-medium">{pay.code}</td>
                                          <td className="px-3 py-2.5 font-mono text-slate-600">{pay.date}</td>
                                          <td className="px-3 py-2.5 text-slate-800">{pay.method}</td>
                                          <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-700">
                                            {pay.amount.toLocaleString('vi-VN')} đ
                                          </td>
                                          <td className="px-3 py-2.5 text-slate-700">{pay.creator}</td>
                                          <td className="px-3 py-2.5 text-center">
                                            <Tag color="green" className="m-0 text-[11px] font-normal border-none">
                                              {pay.status}
                                            </Tag>
                                          </td>
                                          <td className="px-3 py-2.5 text-slate-500 italic">{pay.note || '---'}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 3. Action Footer Bar matching Screenshot */}
                          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-white border-t border-slate-200">
                            {/* Left: Thu gọn & Xóa */}
                            <div className="flex items-center gap-2">
                              <Button
                                size="small"
                                icon={<UpOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedImportRowKeys((prev) => prev.filter((k) => k !== imp.id));
                                }}
                                className="h-8 rounded-none border-slate-300 px-3 text-xs font-normal text-slate-700 hover:!border-slate-400 flex items-center"
                              >
                                Thu gọn
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
                                  size="small"
                                  icon={<DeleteOutlined />}
                                  onClick={(e) => e.stopPropagation()}
                                  className="h-8 rounded-none border-slate-300 px-3 text-xs font-normal text-slate-500 hover:text-rose-600 hover:!border-rose-400 flex items-center"
                                >
                                  Xóa
                                </Button>
                              </Popconfirm>
                            </div>

                            {/* Right: Mở phiếu, Lưu, Sao chép, Trả hàng nhập, In, Xuất file */}
                            <div className="flex flex-wrap items-center gap-2">
                              <Button
                                size="small"
                                icon={<FileTextOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenImportSlip(imp, activeItemsList);
                                }}
                                className="h-8 rounded-none !bg-[#008080] !border-[#008080] hover:!bg-[#006666] text-white px-3.5 text-xs font-medium flex items-center shadow-none"
                              >
                                Mở phiếu
                              </Button>

                              <Button
                                size="small"
                                icon={<SaveOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSaveImportNote(imp);
                                }}
                                className="h-8 rounded-none border-slate-300 px-3 text-xs font-normal text-slate-700 hover:!border-slate-400 flex items-center"
                              >
                                Lưu
                              </Button>

                              <Button
                                size="small"
                                icon={<CopyOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyImportSlip(imp, activeItemsList);
                                }}
                                className="h-8 rounded-none border-slate-300 px-3 text-xs font-normal text-slate-700 hover:!border-slate-400 flex items-center"
                              >
                                Sao chép
                              </Button>

                              <Button
                                size="small"
                                icon={<SwapOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReturnFromImportSlip(imp, activeItemsList);
                                }}
                                className="h-8 rounded-none border-slate-300 px-3 text-xs font-normal text-slate-700 hover:!border-slate-400 flex items-center"
                              >
                                Trả hàng nhập
                              </Button>

                              <Button
                                size="small"
                                icon={<PrinterOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePrintImportSlip(imp, activeItemsList);
                                }}
                                className="h-8 rounded-none border-slate-300 px-3 text-xs font-normal text-slate-700 hover:!border-slate-400 flex items-center"
                              >
                                In
                              </Button>

                              <Button
                                size="small"
                                icon={<DownloadOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleExportSingleImportDetail(imp, activeItemsList);
                                }}
                                className="h-8 rounded-none border-slate-300 px-3 text-xs font-normal text-slate-700 hover:!border-slate-400 flex items-center"
                              >
                                Xuất file
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    },
                  }}
                  columns={[
                    {
                      title: 'Mã nhập hàng',
                      dataIndex: 'code',
                      key: 'code',
                      width: 160,
                      render: (code) => {
                        return (
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded whitespace-nowrap inline-block text-[#784e34] bg-[#784e34]/10">
                            {code}
                          </span>
                        );
                      },
                    },
                    {
                      title: 'Thời gian',
                      dataIndex: 'importDate',
                      key: 'importDate',
                      width: 170,
                      render: (date) => {
                        return (
                          <span className="font-mono text-xs text-slate-700">
                            {date}
                          </span>
                        );
                      },
                    },
                    {
                      title: 'Mã NCC',
                      dataIndex: 'supplierCode',
                      key: 'supplierCode',
                      width: 120,
                      render: (code) => {
                        return (
                          <span className="text-xs text-slate-500">
                            {code || '---'}
                          </span>
                        );
                      },
                    },
                    {
                      title: 'Nhà cung cấp',
                      dataIndex: 'supplier',
                      key: 'supplier',
                      width: 220,
                      render: (sup) => {
                        return (
                          <span className="font-medium text-sm text-slate-800">
                            {sup}
                          </span>
                        );
                      },
                    },
                    {
                      title: 'Cần trả NCC',
                      dataIndex: 'totalValue',
                      key: 'totalValue',
                      width: 170,
                      align: 'right',
                      render: (val, record) => {
                        const returnDeduction = getImportReturnDeduction(record);
                        const netDebt = getImportNetDebt(record);
                        if (returnDeduction > 0) {
                          return (
                            <div className="text-right">
                              <span className={`font-mono font-bold text-sm ${netDebt > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                                {netDebt.toLocaleString('vi-VN')}
                              </span>
                              <div className="text-[10px] text-emerald-700 font-medium whitespace-nowrap">
                                (Đã trừ trả {returnDeduction.toLocaleString('vi-VN')})
                              </div>
                            </div>
                          );
                        }
                        return (
                          <span className={`font-mono font-bold text-sm ${netDebt > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                            {(netDebt || 0).toLocaleString('vi-VN')}
                          </span>
                        );
                      },
                    },
                    {
                      title: 'Trạng thái',
                      dataIndex: 'status',
                      key: 'status',
                      width: 140,
                      align: 'center',
                      render: (s, r) => {
                        return (
                          <Tag
                            color={r.status === 'draft' ? 'gold' : 'cyan'}
                            className="font-normal text-xs px-2.5 py-0.5 whitespace-nowrap rounded-full border-none"
                          >
                            {r.status === 'draft' ? 'Phiếu tạm' : r.statusLabel || 'Đã nhập hàng'}
                          </Tag>
                        );
                      },
                    },
                    {
                      title: 'Trạng thái trả hàng',
                      dataIndex: 'returnStatus',
                      key: 'returnStatus',
                      width: 140,
                      align: 'center',
                      render: (s, record) => {
                        const matchedReturn = supplierReturnsList.find(
                          (ret) =>
                            (ret.sourcePurchaseEntryCode && ret.sourcePurchaseEntryCode === record.code) ||
                            (ret.code && ret.code === record.code) ||
                            (ret.itemName && ret.itemName.includes(record.code))
                        );

                        const isReturned = Boolean(matchedReturn) || (s && s !== 'Chưa trả');
                        const statusLabel = matchedReturn
                          ? (matchedReturn.status === 'draft' ? 'Đang xuất trả' : 'Đã trả hàng')
                          : (s || 'Đã trả hàng');

                        if (isReturned) {
                          return (
                            <Tag
                              color="volcano"
                              className="font-medium text-xs px-2.5 py-0.5 whitespace-nowrap rounded-full border-none m-0"
                            >
                              {statusLabel}
                            </Tag>
                          );
                        }

                        return (
                          <span className="text-xs text-slate-400">
                            Chưa trả
                          </span>
                        );
                      },
                    },
                    {
                      title: 'Thao tác',
                      key: 'actions',
                      width: 80,
                      align: 'center',
                      render: (_, imp) => (
                        <Popconfirm
                          title={`Xóa phiếu nhập "${imp.code}"?`}
                          onConfirm={() => handleDeleteImport(imp.id, imp.code)}
                          okText="Xóa"
                          cancelText="Hủy"
                          okButtonProps={{ danger: true }}
                        >
                          <Button
                            icon={<DeleteOutlined className="text-sm" />}
                            size="small"
                            type="text"
                            className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </Popconfirm>
                      ),
                    },
                  ]}
                />
              </div>
            </div>
              );
            })()}
          </div>
        )}

            {/* SUB-TAB 2 (ENTRY MODE): GIAO DIỆN LẬP PHIẾU NHẬP HÀNG CHUẨN DOMACO POS */}
            {warehouseSubTab === 'imports' && importViewMode === 'create' && (
              <StockImportCreate
                importCode={importCode}
                importDate={importDate}
                importSupplier={importSupplier}
                setImportSupplier={setImportSupplier}
                importWarehouse={importWarehouse}
                setImportWarehouse={setImportWarehouse}
                importInvoiceNumber={importInvoiceNumber}
                setImportInvoiceNumber={setImportInvoiceNumber}
                importInspector={importInspector}
                setImportInspector={setImportInspector}
                importDiscount={importDiscount}
                setImportDiscount={setImportDiscount}
                importPaidAmount={importPaidAmount}
                setImportPaidAmount={setImportPaidAmount}
                importPaymentMethod={importPaymentMethod}
                setImportPaymentMethod={setImportPaymentMethod}
                importNote={importNote}
                setImportNote={setImportNote}
                importEntryLines={importEntryLines}
                setImportEntryLines={setImportEntryLines}
                importSearchProduct={importSearchProduct}
                setImportSearchProduct={setImportSearchProduct}
                filteredImportProducts={filteredImportProducts}
                availableBranchSuppliers={availableBranchSuppliers}
                availableBranchWarehouses={availableBranchWarehouses}
                onNavigateToProduct={onNavigateToProduct}
                onBack={() => {
                  setEditingImportSlipId(null);
                  setImportViewMode('list');
                }}
                onSaveDraft={() => handleSaveImportSlip('draft')}
                onSubmit={() => handleSaveImportSlip('completed')}
                onOpenCreateSupplier={handleOpenCreateSupplier}
                onExportExcel={handleExportCreateImportLinesExcel}
                user={user}
                isEditing={!!editingImportSlipId}
              />
            )}
            

            {/* SUB-TAB: TRẢ HÀNG CHO NHÀ CUNG CẤP (DOMACO POS PURCHASE RETURNS - LIST MODE) */}
            {warehouseSubTab === 'returns' && returnViewMode === 'list' && (
              <div className="space-y-4 flex-1 flex flex-col h-full">
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
                    const matchWarehouse = returnWarehouseFilter === 'all' || ret.warehouseName === returnWarehouseFilter;
                    const matchDate = checkDateInRange(ret.returnDate, returnDateRange);
                    return matchSearch && matchBranch && matchStatus && matchWarehouse && matchDate;
                  });
                  const totalGoodsSum = filteredReturns.reduce((acc, r) => acc + (r.totalGoods || 0), 0);
                  const totalDiscountSum = filteredReturns.reduce((acc, r) => acc + (r.invoiceDiscount || 0), 0);
                  
                  // Tổng cấn trừ nợ NCC (giảm nợ mua hàng, NCC không cần hoàn tiền mặt)
                  const totalOffsetDebtSum = filteredReturns
                    .filter(isSlipOffsetDebt)
                    .reduce((acc, r) => acc + (r.supplierRefund || r.totalGoods || 0), 0);

                  // Các phiếu yêu cầu NCC hoàn tiền mặt/chuyển khoản
                  const cashRefundReturns = filteredReturns.filter((r) => !isSlipOffsetDebt(r));
                  const totalCashRefundSum = cashRefundReturns.reduce((acc, r) => acc + (r.supplierRefund || 0), 0);
                  const totalCashPaidSum = cashRefundReturns.reduce((acc, r) => acc + (r.paidAmount || 0), 0);

                  return (
                    <div className="flex flex-col lg:flex-row gap-4 items-start flex-1">
                      {/* Left Filter Sidebar */}
                      <AdminFilterSidebar
                        title="Bộ lọc trả hàng"
                        hasActiveFilters={Boolean(returnSearchQuery || returnStatusFilter !== 'all' || returnWarehouseFilter !== 'all' || returnDateRange)}
                        onResetFilters={() => {
                          setReturnSearchQuery('');
                          setReturnStatusFilter('all');
                          setReturnWarehouseFilter('all');
                          setReturnDateRange(null);
                          setSelectedReturnKeys([]);
                        }}
                      >
                        {/* Trạng thái trả hàng */}
                        <div className="space-y-1.5">
                          <label className="font-semibold text-slate-800 text-xs block">Trạng thái phiếu</label>
                          <Select
                            value={returnStatusFilter}
                            onChange={(v) => setReturnStatusFilter(v)}
                            className="w-full text-xs"
                            size="small"
                            options={[
                              { value: 'all', label: 'Tất cả trạng thái' },
                              { value: 'completed', label: 'Đã trả hàng' },
                              { value: 'draft', label: 'Phiếu tạm' },
                            ]}
                          />
                        </div>

                        {/* Kho xuất trả */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-100">
                          <label className="font-semibold text-slate-800 text-xs block">Kho xuất trả</label>
                          <Select
                            value={returnWarehouseFilter}
                            onChange={(v) => setReturnWarehouseFilter(v)}
                            className="w-full text-xs"
                            size="small"
                            options={[
                              { value: 'all', label: 'Tất cả kho' },
                              ...availableBranchWarehouses.map((w) => ({ value: w.name, label: w.name })),
                            ]}
                          />
                        </div>

                        {/* Thời gian xuất trả */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-100">
                          <label className="font-semibold text-slate-800 text-xs block">Thời gian trả</label>
                          <PosDateFilter
                            value={returnDateRange}
                            onChange={(range) => setReturnDateRange(range)}
                          />
                        </div>

                        {/* Summary Card */}
                        <AdminSidebarSummary
                          title="Thống kê trả hàng"
                          className="mt-3"
                          items={[
                            { label: 'Tổng số phiếu', value: `${filteredReturns.length} phiếu` },
                            { label: 'Tổng tiền hàng', value: `${totalGoodsSum.toLocaleString('vi-VN')} đ`, color: 'primary' },
                            { label: 'Cấn trừ nợ NCC', value: `${totalOffsetDebtSum.toLocaleString('vi-VN')} đ`, color: 'success' },
                            { label: 'NCC cần hoàn', value: `${totalCashRefundSum.toLocaleString('vi-VN')} đ`, color: totalCashRefundSum > 0 ? 'danger' : 'default' },
                            { label: 'NCC đã trả', value: `${totalCashPaidSum.toLocaleString('vi-VN')} đ`, color: 'success' },
                          ]}
                        />
                      </AdminFilterSidebar>

                      {/* Right Main Table */}
                      <div className="min-w-0 flex-1 w-full">
                        <AdminDataTable
                          enableSelectionToolbar
                          selectedRowKeys={selectedReturnKeys}
                          onSelectionChange={(keys) => setSelectedReturnKeys(keys)}
                          titleText="Quản lý trả hàng"
                          totalCount={filteredReturns.length}
                          countUnit="phiếu"
                          onCreateNew={handleOpenCreateReturn}
                          createButtonText="Trả hàng"
                          onCopySelected={handleCopySelectedReturn}
                          onEditSelected={handleEditSelectedReturn}
                          onDeleteSelected={handleDeleteSelectedReturns}
                          deleteConfirmTitle={`Xóa ${selectedReturnKeys.length} phiếu trả hàng đã chọn?`}
                          searchValue={returnSearchQuery}
                          onSearchChange={(val) => setReturnSearchQuery(val)}
                          searchPlaceholder="Theo mã phiếu trả (#TH-), mã nhập (#PN-), NCC..."
                          extraHeaderActions={
                            <>
                              <Button
                                icon={<DownloadOutlined />}
                                onClick={handleExportReturnsExcel}
                                className="!h-8 px-2.5 rounded-lg border-slate-300 bg-white text-slate-700 text-xs shadow-xs inline-flex items-center justify-center hover:text-[#784e34]"
                                title="Xuất Excel"
                              >
                                Xuất Excel
                              </Button>
                            </>
                          }
                          dataSource={filteredReturns}
                          rowKey="id"
                        onRow={(record) => {
                          const isExp = expandedReturnRowKeys.includes(record.id);
                          return {
                            onClick: () => {
                              setExpandedReturnRowKeys(isExp ? [] : [record.id]);
                              if (!isExp && !returnRowTabs[record.id]) {
                                setReturnRowTabs((prev) => ({ ...prev, [record.id]: 'items' }));
                              }
                            },
                            className: `cursor-pointer transition-colors ${
                              isExp
                                ? '!bg-amber-50/80 [&>td]:!bg-amber-50/80 font-medium'
                                : 'hover:!bg-slate-50 [&>td]:hover:!bg-slate-50'
                            }`,
                          };
                        }}
                        scroll={{ x: '100%' }}
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
                            const setTab = (t: 'items' | 'info' | 'payments') => {
                              setReturnRowTabs((prev) => ({ ...prev, [ret.id]: t }));
                            };

                            const itemsList: any[] =
                              ret.items && ret.items.length > 0
                                ? ret.items
                                : ret.itemsJson
                                ? (() => {
                                    try {
                                      const parsed = JSON.parse(ret.itemsJson);
                                      return Array.isArray(parsed) && parsed.length > 0 ? parsed : [];
                                    } catch {
                                      return [];
                                    }
                                  })()
                                : [];

                            const activeItemsList =
                              itemsList.length > 0
                                ? itemsList
                                : [
                                    {
                                      id: `line_${ret.id}`,
                                      code: ret.code || 'SP001',
                                      name: ret.itemName || 'Sản phẩm hoàn trả',
                                      spec: ret.spec || '',
                                      unit: ret.unit || 'Bộ',
                                      quantity: ret.quantity || 1,
                                      purchasePrice: ret.purchasePrice || ret.returnPrice || 0,
                                      returnPrice: ret.returnPrice || ret.purchasePrice || 0,
                                      total: ret.totalGoods || ((ret.quantity || 1) * (ret.returnPrice || 0)),
                                      reason: ret.reason || 'Hàng lỗi / không đạt tiêu chuẩn',
                                    },
                                  ];

                            const totalQty = activeItemsList.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);
                            const totalGoods = ret.totalGoods || ret.totalValue || activeItemsList.reduce((acc, item) => acc + (Number(item.total) || 0), 0);
                            const discountAmount = ret.invoiceDiscount || 0;
                            const isOffset = isSlipOffsetDebt(ret);
                            const refundAmount = ret.supplierRefund !== undefined ? ret.supplierRefund : Math.max(0, totalGoods - discountAmount);
                            const paidAmount = isOffset ? 0 : (ret.paidAmount !== undefined ? ret.paidAmount : refundAmount);

                            return (
                              <div
                                className="bg-white border-x border-b border-slate-200 shadow-sm overflow-hidden mb-2 text-slate-800"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {/* 1. Header Tabs Strip (Domaco POS Style) */}
                                <div className="flex items-center gap-6 border-b border-slate-200 px-5 pt-3 bg-white overflow-x-auto">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setTab('items');
                                    }}
                                    className={`border-b-2 px-1 pb-2.5 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                                      currentTab === 'items'
                                        ? 'border-[#008080] text-[#008080]'
                                        : 'border-transparent text-slate-600 hover:text-slate-900'
                                    }`}
                                  >
                                    Hàng hóa ({activeItemsList.length})
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setTab('info');
                                    }}
                                    className={`border-b-2 px-1 pb-2.5 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                                      currentTab === 'info'
                                        ? 'border-[#008080] text-[#008080]'
                                        : 'border-transparent text-slate-600 hover:text-slate-900'
                                    }`}
                                  >
                                    Thông tin
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setTab('payments');
                                    }}
                                    className={`border-b-2 px-1 pb-2.5 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                                      currentTab === 'payments'
                                        ? 'border-[#008080] text-[#008080]'
                                        : 'border-transparent text-slate-600 hover:text-slate-900'
                                    }`}
                                  >
                                    Lịch sử thanh toán
                                  </button>
                                </div>

                                {/* 2. Tab Body */}
                                <div className="p-4 space-y-4">
                                  {/* TAB 1: HÀNG HÓA */}
                                  {currentTab === 'items' && (
                                    <div className="space-y-4">
                                      <div className="overflow-x-auto border border-slate-200 bg-white">
                                        <table className="min-w-full text-xs">
                                          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                                            <tr>
                                              <th className="px-3 py-2 text-left w-28">Mã hàng</th>
                                              <th className="px-3 py-2 text-left">Tên hàng</th>
                                              <th className="px-3 py-2 text-left w-36">Quy cách</th>
                                              <th className="px-3 py-2 text-right w-24">Số lượng</th>
                                              <th className="px-3 py-2 text-right w-28">Giá nhập</th>
                                              <th className="px-3 py-2 text-right w-28">Giá trả lại</th>
                                              <th className="px-3 py-2 text-right w-32">Thành tiền</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-100">
                                            {activeItemsList.map((item, idx) => (
                                              <tr key={item.id || idx} className="hover:bg-slate-50/70">
                                                <td className="px-3 py-2.5 font-mono text-[#008080] font-medium">
                                                  <span
                                                    className="cursor-pointer hover:underline inline-flex items-center gap-1 group"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      if (onNavigateToProduct) onNavigateToProduct(item.code || item.name);
                                                    }}
                                                    title={`Xem chi tiết sản phẩm "${item.name}" trong danh mục`}
                                                  >
                                                    <span>{item.code || ret.code}</span>
                                                    <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
                                                  </span>
                                                </td>
                                                <td className="px-3 py-2.5 font-medium text-slate-900">
                                                  <span
                                                    className="cursor-pointer hover:text-[#008080] hover:underline"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      if (onNavigateToProduct) onNavigateToProduct(item.code || item.name);
                                                    }}
                                                    title={`Xem chi tiết sản phẩm "${item.name}"`}
                                                  >
                                                    {item.name}
                                                  </span>
                                                </td>
                                                <td className="px-3 py-2.5 text-slate-500 font-mono text-[11px]">{item.spec || ret.spec || '---'}</td>
                                                <td className="px-3 py-2.5 text-right font-mono font-medium text-slate-900">
                                                  {item.quantity} {item.unit || ret.unit || ''}
                                                </td>
                                                <td className="px-3 py-2.5 text-right font-mono text-slate-700">
                                                  {(item.purchasePrice || item.returnPrice || ret.purchasePrice || 0).toLocaleString('vi-VN')}
                                                </td>
                                                <td className="px-3 py-2.5 text-right font-mono text-slate-700">
                                                  {(item.returnPrice || ret.returnPrice || item.purchasePrice || 0).toLocaleString('vi-VN')}
                                                </td>
                                                <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-950">
                                                  {(item.total || (item.quantity * (item.returnPrice || item.purchasePrice || 0))).toLocaleString('vi-VN')}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>

                                      {/* Bottom 2-Column: Ghi chú (Left) & Financial Summary (Right) */}
                                      <div className="flex flex-col md:flex-row gap-6 items-start justify-between pt-1">
                                        <div className="flex-1 w-full">
                                          <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                                            Ghi chú phiếu trả hàng
                                          </label>
                                          <Input.TextArea
                                            rows={4}
                                            value={returnRowNotes[ret.id] !== undefined ? returnRowNotes[ret.id] : (ret.note || '')}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              setReturnRowNotes((prev) => ({ ...prev, [ret.id]: val }));
                                            }}
                                            placeholder="Ghi chú phiếu trả hàng nhà cung cấp..."
                                            className="w-full text-xs rounded-none border border-slate-200 bg-white p-2.5 text-slate-700 resize-none hover:border-slate-300 focus:border-[#008080]"
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                        </div>

                                        <div className="w-full md:w-80 shrink-0 space-y-1.5 text-xs text-slate-700 bg-slate-50/50 p-3 border border-slate-100">
                                          <div className="flex justify-between items-center py-0.5">
                                            <span className="text-slate-600">Số lượng mặt hàng</span>
                                            <span className="font-mono font-semibold text-slate-900">{activeItemsList.length}</span>
                                          </div>
                                          <div className="flex justify-between items-center py-0.5">
                                            <span className="text-slate-600">Tổng số lượng xuất trả</span>
                                            <span className="font-mono font-semibold text-slate-900">{totalQty}</span>
                                          </div>
                                          <div className="flex justify-between items-center py-0.5">
                                            <span className="text-slate-600">Tổng tiền hàng trả</span>
                                            <span className="font-mono font-semibold text-slate-900">{totalGoods.toLocaleString('vi-VN')}</span>
                                          </div>
                                          <div className="flex justify-between items-center py-0.5">
                                            <span className="text-slate-600">Giảm giá / Chiết khấu</span>
                                            <span className="font-mono text-slate-700">{discountAmount.toLocaleString('vi-VN')}</span>
                                          </div>
                                          <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                                            <span className="font-bold text-slate-950 text-sm">Tổng cộng</span>
                                            <span className="font-mono font-bold text-slate-950 text-base">{refundAmount.toLocaleString('vi-VN')}</span>
                                          </div>
                                          {isOffset ? (
                                            <div className="flex justify-between items-center py-0.5 text-emerald-700">
                                              <span className="font-semibold">Cấn trừ công nợ NCC</span>
                                              <span className="font-mono font-bold text-sm">-{refundAmount.toLocaleString('vi-VN')}</span>
                                            </div>
                                          ) : (
                                            <>
                                              <div className="flex justify-between items-center py-0.5">
                                                <span className="font-semibold text-slate-800">NCC cần hoàn tiền</span>
                                                <span className="font-mono font-bold text-rose-600 text-sm">{refundAmount.toLocaleString('vi-VN')}</span>
                                              </div>
                                              <div className="flex justify-between items-center py-0.5">
                                                <span className="font-semibold text-slate-800">NCC đã hoàn tiền</span>
                                                <span className="font-mono font-bold text-emerald-700 text-sm">{paidAmount.toLocaleString('vi-VN')}</span>
                                              </div>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* TAB 2: THÔNG TIN */}
                                  {currentTab === 'info' && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/70 p-4 border border-slate-200 text-xs">
                                      <div>
                                        <span className="text-slate-400 block text-[11px] mb-0.5">Mã trả hàng:</span>
                                        <span className="font-mono font-bold text-[#008080]">{ret.code}</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-400 block text-[11px] mb-0.5">Thời gian trả hàng:</span>
                                        <span className="font-mono font-medium text-slate-800">{ret.returnDate}</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-400 block text-[11px] mb-0.5">Kho xuất trả:</span>
                                        <span className="font-bold text-slate-900">{ret.warehouseName || 'Tổng Kho'}</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-400 block text-[11px] mb-0.5">Nhà cung cấp nhận:</span>
                                        <span className="font-semibold text-slate-900">{ret.supplierName}</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-400 block text-[11px] mb-0.5">Mã nhập gốc:</span>
                                        <span className="font-mono font-medium text-slate-700">{ret.sourcePurchaseEntryCode || 'Không liên kết'}</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-400 block text-[11px] mb-0.5">Người lập phiếu:</span>
                                        <span className="font-medium text-slate-800">{ret.staffName || 'Admin'}</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-400 block text-[11px] mb-0.5">Hình thức hoàn tiền / xử lý:</span>
                                        <span className="font-medium text-slate-800">{ret.paymentMethod || (isOffset ? 'Cấn trừ công nợ' : 'Chuyển khoản')}</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-400 block text-[11px] mb-0.5">Trạng thái:</span>
                                        <span className="font-medium text-emerald-700">{ret.statusLabel || (ret.status === 'draft' ? 'Phiếu tạm' : 'Đã trả hàng')}</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-400 block text-[11px] mb-0.5">Phương án xử lý:</span>
                                        <span className="font-medium text-slate-700">{ret.solution || (isOffset ? 'Cấn trừ vào công nợ' : 'Đã hoàn bù lô mới')}</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-400 block text-[11px] mb-0.5">Lý do hoàn trả:</span>
                                        <span className="text-slate-700 italic">{ret.reason || 'Lỗi quy cách / Kiểm định không đạt tiêu chuẩn'}</span>
                                      </div>
                                      <div className="sm:col-span-2">
                                        <span className="text-slate-400 block text-[11px] mb-0.5">Ghi chú phiếu:</span>
                                        <span className="text-slate-700 italic">{returnRowNotes[ret.id] !== undefined ? returnRowNotes[ret.id] : (ret.note || 'Không có ghi chú')}</span>
                                      </div>
                                    </div>
                                  )}

                                  {/* TAB 3: LỊCH SỬ THANH TOÁN */}
                                  {currentTab === 'payments' && (
                                    <div className="space-y-3">
                                      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200">
                                        <div className="flex items-center gap-4 text-xs">
                                          <span>Tổng giá trị hoàn trả: <strong className="font-mono text-slate-900">{totalGoods.toLocaleString('vi-VN')} đ</strong></span>
                                          <span>•</span>
                                          <span>Hình thức: <strong className="font-semibold text-slate-800">{ret.paymentMethod || (isOffset ? 'Cấn trừ công nợ' : 'Chuyển khoản')}</strong></span>
                                          <span>•</span>
                                          <span>
                                            Trạng thái:{' '}
                                            <strong className={`font-mono ${isOffset ? 'text-emerald-700 font-bold' : (paidAmount >= refundAmount ? 'text-emerald-700' : 'text-amber-600')}`}>
                                              {isOffset ? 'Đã cấn trừ trực tiếp vào công nợ' : (paidAmount >= refundAmount ? 'Đã hoàn tiền đủ' : 'Chờ hoàn tiền')}
                                            </strong>
                                          </span>
                                        </div>
                                      </div>

                                      <div className="overflow-x-auto border border-slate-200 bg-white">
                                        <table className="min-w-full text-xs">
                                          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                                            <tr>
                                              <th className="px-3 py-2 text-left w-32">Mã chứng từ</th>
                                              <th className="px-3 py-2 text-left w-36">Thời gian</th>
                                              <th className="px-3 py-2 text-left w-36">Phương thức</th>
                                              <th className="px-3 py-2 text-right w-36">Số tiền</th>
                                              <th className="px-3 py-2 text-left w-32">Người thực hiện</th>
                                              <th className="px-3 py-2 text-center w-36">Trạng thái</th>
                                              <th className="px-3 py-2 text-left">Ghi chú</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-100">
                                            <tr className="hover:bg-slate-50/70">
                                              <td className="px-3 py-2.5 font-mono text-[#008080] font-medium">
                                                {isOffset ? `CT${ret.code.replace(/[^0-9]/g, '') || '001'}` : `PT${ret.code.replace(/[^0-9]/g, '') || '001'}`}
                                              </td>
                                              <td className="px-3 py-2.5 font-mono text-slate-600">{ret.returnDate}</td>
                                              <td className="px-3 py-2.5 text-slate-800">{ret.paymentMethod || (isOffset ? 'Cấn trừ công nợ' : 'Chuyển khoản')}</td>
                                              <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-700">
                                                {refundAmount.toLocaleString('vi-VN')} đ
                                              </td>
                                              <td className="px-3 py-2.5 text-slate-700">{ret.staffName || 'Admin'}</td>
                                              <td className="px-3 py-2.5 text-center">
                                                <Tag color="green" className="m-0 text-[11px] font-normal border-none">
                                                  {isOffset ? 'Đã cấn trừ công nợ' : 'Đã hoàn tất'}
                                                </Tag>
                                              </td>
                                              <td className="px-3 py-2.5 text-slate-500 italic">
                                                {isOffset
                                                  ? `Cấn trừ trực tiếp vào công nợ phiếu nhập ${ret.sourcePurchaseEntryCode || ''}`
                                                  : `Hoàn tiền phiếu trả ${ret.code}`}
                                              </td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* 3. Action Footer Bar (Domaco POS Style) */}
                                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-white border-t border-slate-200">
                                  {/* Left: Thu gọn & Xóa */}
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="small"
                                      icon={<UpOutlined />}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setExpandedReturnRowKeys((prev) => prev.filter((k) => k !== ret.id));
                                      }}
                                      className="h-8 rounded-none border-slate-300 px-3 text-xs font-normal text-slate-700 hover:!border-slate-400 flex items-center"
                                    >
                                      Thu gọn
                                    </Button>

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
                                        size="small"
                                        icon={<DeleteOutlined />}
                                        onClick={(e) => e.stopPropagation()}
                                        className="h-8 rounded-none border-slate-300 px-3 text-xs font-normal text-slate-500 hover:text-rose-600 hover:!border-rose-400 flex items-center"
                                      >
                                        Xóa
                                      </Button>
                                    </Popconfirm>
                                  </div>

                                  {/* Right: Lưu, In, Xuất file */}
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Button
                                      size="small"
                                      icon={<SaveOutlined />}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSaveReturnNote(ret);
                                      }}
                                      className="h-8 rounded-none border-slate-300 px-3 text-xs font-normal text-slate-700 hover:!border-slate-400 flex items-center"
                                    >
                                      Lưu
                                    </Button>

                                    <Button
                                      size="small"
                                      icon={<PrinterOutlined />}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedReturnSlipForPrint(ret);
                                      }}
                                      className="h-8 rounded-none border-slate-300 px-3 text-xs font-normal text-slate-700 hover:!border-slate-400 flex items-center"
                                    >
                                      In
                                    </Button>

                                    <Button
                                      size="small"
                                      icon={<DownloadOutlined />}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleExportSingleReturnDetail(ret);
                                      }}
                                      className="h-8 rounded-none border-slate-300 px-3 text-xs font-normal text-slate-700 hover:!border-slate-400 flex items-center"
                                    >
                                      Xuất file
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            );
                          },
                        }}
                        columns={[
                          {
                            title: 'Mã trả hàng',
                            dataIndex: 'code',
                            key: 'code',
                            width: 150,
                            render: (code) => {
                              return (
                                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded whitespace-nowrap inline-block text-rose-700 bg-rose-50">
                                  {code}
                                </span>
                              );
                            },
                          },
                          {
                            title: 'Thời gian',
                            dataIndex: 'returnDate',
                            key: 'returnDate',
                            width: 160,
                            render: (date) => {
                              return (
                                <span className="font-mono text-xs text-slate-700">
                                  {date}
                                </span>
                              );
                            },
                          },
                          {
                            title: 'Mã nhập hàng',
                            dataIndex: 'sourcePurchaseEntryCode',
                            key: 'sourcePurchaseEntryCode',
                            width: 140,
                            render: (code) => {
                              return (
                                <span className="font-mono text-xs text-[#784e34] bg-[#784e34]/10 px-2 py-0.5 rounded whitespace-nowrap inline-block">
                                  {code || '---'}
                                </span>
                              );
                            },
                          },
                          {
                            title: 'Nhà cung cấp',
                            dataIndex: 'supplierName',
                            key: 'supplierName',
                            render: (sup) => {
                              return (
                                <span className="font-medium text-sm text-slate-800">
                                  {sup}
                                </span>
                              );
                            },
                          },
                          {
                            title: 'Tổng tiền hàng',
                            dataIndex: 'totalGoods',
                            key: 'totalGoods',
                            width: 150,
                            align: 'right',
                            render: (val) => {
                              return (
                                <span className="font-mono text-xs text-slate-700">
                                  {(val || 0).toLocaleString('vi-VN')}
                                </span>
                              );
                            },
                          },
                          {
                            title: 'NCC cần trả',
                            dataIndex: 'supplierRefund',
                            key: 'supplierRefund',
                            width: 180,
                            align: 'right',
                            render: (val, r) => {
                              const isOffset = isSlipOffsetDebt(r);
                              if (isOffset) {
                                return (
                                  <div className="text-right">
                                    <span className="inline-block text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 whitespace-nowrap">
                                      Cấn trừ nợ: {(r.supplierRefund || r.totalGoods || 0).toLocaleString('vi-VN')}
                                    </span>
                                  </div>
                                );
                              }
                              return (
                                <span className="font-mono font-bold text-sm text-rose-700 whitespace-nowrap">
                                  {(val || 0).toLocaleString('vi-VN')}
                                </span>
                              );
                            },
                          },
                          {
                            title: 'Trạng thái',
                            dataIndex: 'status',
                            key: 'status',
                            width: 130,
                            align: 'center',
                            render: (s, r) => {
                              return (
                                <Tag
                                  color={r.status === 'draft' ? 'gold' : 'green'}
                                  className="font-normal text-xs px-2.5 py-0.5 whitespace-nowrap rounded-full border-none"
                                >
                                  {r.status === 'draft' ? 'Phiếu tạm' : r.statusLabel || 'Đã trả hàng'}
                                </Tag>
                              );
                            },
                          },
                          {
                            title: 'Thao tác',
                            key: 'actions',
                            width: 80,
                            align: 'center',
                            render: (_, r) => (
                              <Space size={2} onClick={(e) => e.stopPropagation()}>
                                <Button
                                  size="small"
                                  type="text"
                                  icon={<PrinterOutlined className="text-slate-500 hover:text-rose-700" />}
                                  onClick={() => setSelectedReturnSlipForPrint(r)}
                                  className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-slate-100"
                                  title="In phiếu trả hàng"
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
                  );
                })()}
              </div>
            )}

            {/* SUB-TAB: TRẢ HÀNG CHO NHÀ CUNG CẤP (DOMACO POS PURCHASE RETURN ENTRY MODE) */}
            {warehouseSubTab === 'returns' && returnViewMode === 'create' && (
              <SupplierReturnCreate
                returnCode={returnCode}
                returnDate={returnDate}
                returnSourceCode={returnSourceCode}
                setReturnSourceCode={setReturnSourceCode}
                returnSupplier={returnSupplier}
                setReturnSupplier={setReturnSupplier}
                returnWarehouse={returnWarehouse}
                setReturnWarehouse={setReturnWarehouse}
                returnStaffName={returnStaffName}
                setReturnStaffName={setReturnStaffName}
                returnReason={returnReason}
                setReturnReason={setReturnReason}
                returnSolution={returnSolution}
                setReturnSolution={setReturnSolution}
                returnDiscount={returnDiscount}
                setReturnDiscount={setReturnDiscount}
                returnPaidAmount={returnPaidAmount}
                setReturnPaidAmount={setReturnPaidAmount}
                returnPaymentMethod={returnPaymentMethod}
                setReturnPaymentMethod={setReturnPaymentMethod}
                returnNote={returnNote}
                setReturnNote={setReturnNote}
                returnEntryLines={returnEntryLines}
                setReturnEntryLines={setReturnEntryLines}
                returnSearchProduct={returnSearchProduct}
                setReturnSearchProduct={setReturnSearchProduct}
                allProducts={allAvailableProducts}
                importsList={importsList}
                availableBranchSuppliers={availableBranchSuppliers}
                availableBranchWarehouses={availableBranchWarehouses}
                isMatchGlobalBranch={isMatchGlobalBranch}
                onNavigateToProduct={onNavigateToProduct}
                onBack={() => setReturnViewMode('list')}
                onSaveDraft={() => handleSaveReturnSlip('draft')}
                onSubmit={() => handleSaveReturnSlip('completed')}
                onOpenCreateSupplier={handleOpenCreateSupplier}
                onExportExcel={handleExportCreateReturnLinesExcel}
                user={user}
              />
            )}
            

            {/* SUB-TAB 3: KIỂM KÊ KHO (DOMACO POS / ACCOUNTING STOCKTAKE) */}
            {warehouseSubTab === 'stocktake' && stocktakeViewMode === 'list' && (
              <div className="space-y-4 flex-1 flex flex-col h-full">
                {(() => {
                  const filteredAudits = auditSlips.filter((s) => {
                    const matchBranch = isMatchGlobalBranch(s.scopeLabel) || isMatchGlobalBranch(s.title);
                    const matchSearch =
                      !auditSearchQuery ||
                      s.code.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
                      s.title.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
                      s.creator.toLowerCase().includes(auditSearchQuery.toLowerCase());
                    const matchStatus = auditStatusFilter === 'all' || s.status === auditStatusFilter;
                    const matchWarehouse = auditWarehouseFilter === 'all' || s.scopeLabel === auditWarehouseFilter;
                    const matchDate = checkDateInRange(s.createdAt, auditDateRange);
                    return matchBranch && matchSearch && matchStatus && matchWarehouse && matchDate;
                  });
                  const completedCount = filteredAudits.filter((s) => s.status === 'completed').length;
                  const inProgressCount = filteredAudits.filter((s) => s.status !== 'completed').length;

                  return (
                    <div className="flex flex-col lg:flex-row gap-4 items-start flex-1">
                      {/* Left Filter Sidebar */}
                      <AdminFilterSidebar
                        title="Bộ lọc kiểm kho"
                        hasActiveFilters={Boolean(auditSearchQuery || auditStatusFilter !== 'all' || auditWarehouseFilter !== 'all' || auditDateRange)}
                        onResetFilters={() => {
                          setAuditSearchQuery('');
                          setAuditStatusFilter('all');
                          setAuditWarehouseFilter('all');
                          setAuditDateRange(null);
                          setSelectedAuditKeys([]);
                        }}
                      >
                        {/* Trạng thái kiểm kê */}
                        <div className="space-y-1.5">
                          <label className="font-semibold text-slate-800 text-xs block">Trạng thái phiếu</label>
                          <Select
                            value={auditStatusFilter}
                            onChange={(v) => setAuditStatusFilter(v)}
                            className="w-full text-xs"
                            size="small"
                            options={[
                              { value: 'all', label: 'Tất cả trạng thái' },
                              { value: 'completed', label: 'Đã hoàn tất 100%' },
                              { value: 'in_progress', label: 'Đang kiểm đếm' },
                            ]}
                          />
                        </div>

                        {/* Phạm vi kho */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-100">
                          <label className="font-semibold text-slate-800 text-xs block">Kho kiểm kê</label>
                          <Select
                            value={auditWarehouseFilter}
                            onChange={(v) => setAuditWarehouseFilter(v)}
                            className="w-full text-xs"
                            size="small"
                            options={[
                              { value: 'all', label: 'Tất cả kho' },
                              ...availableBranchWarehouses.map((w) => ({ value: w.name, label: w.name })),
                            ]}
                          />
                        </div>

                        {/* Thời gian kiểm */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-100">
                          <label className="font-semibold text-slate-800 text-xs block">Thời gian kiểm</label>
                          <PosDateFilter
                            value={auditDateRange}
                            onChange={(range) => setAuditDateRange(range)}
                          />
                        </div>

                        {/* Summary Card */}
                        <AdminSidebarSummary
                          title="Thống kê kiểm kê"
                          className="mt-3"
                          items={[
                            { label: 'Tổng số phiếu', value: `${filteredAudits.length} phiếu` },
                            { label: 'Đã hoàn tất', value: `${completedCount} phiếu`, color: 'success' },
                            { label: 'Đang kiểm đếm', value: `${inProgressCount} phiếu`, color: 'primary' },
                          ]}
                        />
                      </AdminFilterSidebar>

                      {/* Right Main Table */}
                      <div className="min-w-0 flex-1 w-full">
                        <AdminDataTable
                          enableSelectionToolbar
                          selectedRowKeys={selectedAuditKeys}
                          onSelectionChange={(keys) => setSelectedAuditKeys(keys)}
                          titleText="Quản lý kiểm kho"
                          totalCount={filteredAudits.length}
                          countUnit="phiếu"
                          onCreateNew={handleOpenCreateStocktake}
                          createButtonText="Kiểm kho"
                          onCopySelected={handleCopySelectedAudit}
                          onEditSelected={handleEditSelectedAudit}
                          onDeleteSelected={handleDeleteSelectedAudits}
                          deleteConfirmTitle={`Xóa ${selectedAuditKeys.length} phiếu kiểm kho đã chọn?`}
                          searchValue={auditSearchQuery}
                          onSearchChange={(val) => setAuditSearchQuery(val)}
                          searchPlaceholder="Tìm theo mã kiểm, tên phiên, người tạo..."
                          extraHeaderActions={
                            <>
                              <Button
                                icon={<ReloadOutlined />}
                                onClick={handleRefreshAudits}
                                className="!h-8 px-2.5 rounded-lg border-slate-300 bg-white text-slate-700 text-xs shadow-xs inline-flex items-center justify-center hover:text-[#784e34]"
                                title="Làm mới"
                              >
                                Làm mới
                              </Button>
                              <Button
                                icon={<DownloadOutlined />}
                                onClick={() => {
                                  const exportData = filteredAudits.map((a, idx) => ({
                                    'STT': idx + 1,
                                    'Mã kiểm kho': a.code,
                                    'Tên phiên kiểm': a.title,
                                    'Phạm vi kho': a.scopeLabel,
                                    'Ngày kiểm': a.createdAt,
                                    'Người chủ trì': a.creator,
                                    'Trạng thái': a.status === 'completed' ? 'Đã hoàn tất 100%' : 'Đang kiểm đếm',
                                    'Ghi chú': a.note || '',
                                  }));
                                  exportToExcel(exportData, 'Danh_sach_phieu_kiem_kho');
                                  message.success('Đã xuất danh sách phiếu kiểm kho ra Excel!');
                                }}
                                className="!h-8 px-2.5 rounded-lg border-slate-300 bg-white text-slate-700 text-xs shadow-xs inline-flex items-center justify-center hover:text-[#784e34]"
                                title="Xuất Excel"
                              >
                                Xuất Excel
                              </Button>
                            </>
                          }
                          dataSource={filteredAudits}
                          rowKey="id"
                          onRow={(record) => {
                            const isExp = expandedAuditRowKeys.includes(record.id);
                            return {
                              onClick: () => {
                                setExpandedAuditRowKeys(isExp ? [] : [record.id]);
                                if (!isExp && !auditRowTabs[record.id]) {
                                  setAuditRowTabs((prev) => ({ ...prev, [record.id]: 'items' }));
                                }
                              },
                              className: `cursor-pointer transition-colors ${
                                isExp
                                  ? '!bg-amber-50/80 [&>td]:!bg-amber-50/80 font-medium'
                                  : 'hover:!bg-slate-50 [&>td]:hover:!bg-slate-50'
                              }`,
                            };
                          }}
                          expandable={{
                            expandedRowKeys: expandedAuditRowKeys,
                            onExpand: (expanded, record) => {
                              setExpandedAuditRowKeys(expanded ? [record.id] : []);
                              if (expanded && !auditRowTabs[record.id]) {
                                setAuditRowTabs((prev) => ({ ...prev, [record.id]: 'items' }));
                              }
                            },
                            expandedRowRender: (slip) => {
                              const currentTab = auditRowTabs[slip.id] || 'items';
                              const setTab = (t: 'items' | 'info') => {
                                setAuditRowTabs((prev) => ({ ...prev, [slip.id]: t }));
                              };
                              const itemsList: StockAuditItem[] =
                                slip.items && slip.items.length > 0 ? slip.items : [];

                              const totalItems = itemsList.length;
                              const totalSystemQty = itemsList.reduce((acc, it) => acc + (it.systemQty || 0), 0);
                              const totalActualQty = itemsList.reduce((acc, it) => acc + (it.actualQty || 0), 0);
                              const diffQty = totalActualQty - totalSystemQty;
                              const matchedCount = itemsList.filter(
                                (it) => (it.actualQty || 0) === (it.systemQty || 0)
                              ).length;
                              const diffCount = itemsList.filter(
                                (it) => (it.actualQty || 0) !== (it.systemQty || 0)
                              ).length;

                              return (
                                <div
                                  className="bg-white border-x border-b border-slate-200 shadow-sm overflow-hidden mb-2 text-slate-800"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {/* 1. Header Tabs Strip (Domaco POS Style) */}
                                  <div className="flex items-center gap-6 border-b border-slate-200 px-5 pt-3 bg-white overflow-x-auto">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setTab('items');
                                      }}
                                      className={`border-b-2 px-1 pb-2.5 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                                        currentTab === 'items'
                                          ? 'border-[#008080] text-[#008080]'
                                          : 'border-transparent text-slate-600 hover:text-slate-900'
                                      }`}
                                    >
                                      Hàng hóa kiểm kê ({itemsList.length})
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setTab('info');
                                      }}
                                      className={`border-b-2 px-1 pb-2.5 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                                        currentTab === 'info'
                                          ? 'border-[#008080] text-[#008080]'
                                          : 'border-transparent text-slate-600 hover:text-slate-900'
                                      }`}
                                    >
                                      Thông tin phiên kiểm
                                    </button>
                                  </div>

                                  {/* 2. Tab Body */}
                                  <div className="p-4 space-y-4">
                                    {/* TAB 1: HÀNG HÓA KIỂM KÊ */}
                                    {currentTab === 'items' && (
                                      <div className="space-y-4">
                                        {/* Table of items */}
                                        <div className="overflow-x-auto border border-slate-200 bg-white">
                                          <table className="min-w-full text-xs">
                                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                                              <tr>
                                                <th className="px-3 py-2 text-center w-12">STT</th>
                                                <th className="px-3 py-2 text-left w-32">Mã hàng</th>
                                                <th className="px-3 py-2 text-left">Tên sản phẩm</th>
                                                <th className="px-3 py-2 text-right w-28">Tồn sổ sách</th>
                                                <th className="px-3 py-2 text-right w-28">Thực tế</th>
                                                <th className="px-3 py-2 text-right w-28">Chênh lệch</th>
                                                <th className="px-3 py-2 text-center w-32">Trạng thái</th>
                                                <th className="px-3 py-2 text-left">Ghi chú / Vị trí</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                              {itemsList.map((item, idx) => {
                                                const diff = (item.actualQty ?? 0) - (item.systemQty ?? 0);
                                                return (
                                                  <tr key={item.id || idx} className="hover:bg-slate-50/70">
                                                    <td className="px-3 py-2.5 text-center font-mono text-slate-400">
                                                      {idx + 1}
                                                    </td>
                                                    <td className="px-3 py-2.5 font-mono text-[#008080] font-medium">
                                                      <span
                                                        className="cursor-pointer hover:underline inline-flex items-center gap-1 group"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          if (onNavigateToProduct) onNavigateToProduct(item.code || item.name);
                                                        }}
                                                        title={`Xem chi tiết sản phẩm "${item.name}" trong danh mục`}
                                                      >
                                                        <span>{item.code}</span>
                                                        <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
                                                      </span>
                                                    </td>
                                                    <td className="px-3 py-2.5 font-medium text-slate-900">
                                                      <span
                                                        className="cursor-pointer hover:text-[#008080] hover:underline"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          if (onNavigateToProduct) onNavigateToProduct(item.code || item.name);
                                                        }}
                                                        title={`Xem chi tiết sản phẩm "${item.name}"`}
                                                      >
                                                        {item.name}
                                                      </span>
                                                    </td>
                                                    <td className="px-3 py-2.5 text-right font-mono text-slate-700">
                                                      {item.systemQty ?? 0}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">
                                                      {item.actualQty ?? 0}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-right font-mono font-bold">
                                                      {diff === 0 ? (
                                                        <span className="text-slate-500">0</span>
                                                      ) : diff > 0 ? (
                                                        <span className="text-emerald-600">+{diff}</span>
                                                      ) : (
                                                        <span className="text-rose-600">{diff}</span>
                                                      )}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-center">
                                                      {diff === 0 ? (
                                                        <Tag color="green" className="m-0 text-[11px] font-normal border-none">
                                                          Khớp 100%
                                                        </Tag>
                                                      ) : diff > 0 ? (
                                                        <Tag color="cyan" className="m-0 text-[11px] font-normal border-none">
                                                          Thừa (+{diff})
                                                        </Tag>
                                                      ) : (
                                                        <Tag color="red" className="m-0 text-[11px] font-normal border-none">
                                                          Thiếu ({diff})
                                                        </Tag>
                                                      )}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-slate-500">
                                                      {item.location || item.qualityNote || '---'}
                                                    </td>
                                                  </tr>
                                                );
                                              })}
                                            </tbody>
                                          </table>
                                        </div>

                                        {/* Bottom 2-Column: Ghi chú (Left) & Summary (Right) */}
                                        <div className="flex flex-col md:flex-row gap-6 items-start justify-between pt-1">
                                          {/* Left: Ghi chú box */}
                                          <div className="flex-1 w-full">
                                            <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                                              Ghi chú phiên kiểm
                                            </label>
                                            <Input.TextArea
                                              rows={4}
                                              defaultValue={slip.note || ''}
                                              placeholder="Ghi chú đợt kiểm kê kho..."
                                              className="w-full text-xs rounded-none border border-slate-200 bg-white p-2.5 text-slate-700 resize-none hover:border-slate-300 focus:border-[#008080]"
                                              onClick={(e) => e.stopPropagation()}
                                            />
                                          </div>

                                          {/* Right: Metrics Calculation lines */}
                                          <div className="w-full md:w-80 shrink-0 space-y-1.5 text-xs text-slate-700 bg-slate-50/50 p-3 border border-slate-100">
                                            <div className="flex justify-between items-center py-0.5">
                                              <span className="text-slate-600">Số lượng mặt hàng</span>
                                              <span className="font-mono font-semibold text-slate-900">{totalItems}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-0.5">
                                              <span className="text-slate-600">Tổng tồn sổ sách</span>
                                              <span className="font-mono font-semibold text-slate-900">{totalSystemQty}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-0.5">
                                              <span className="text-slate-600">Tổng tồn thực tế</span>
                                              <span className="font-mono font-bold text-slate-900 text-sm">{totalActualQty}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-0.5">
                                              <span className="text-slate-600">Mặt hàng khớp</span>
                                              <span className="font-mono font-semibold text-emerald-600">{matchedCount}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-0.5">
                                              <span className="text-slate-600">Mặt hàng lệch</span>
                                              <span className="font-mono font-semibold text-rose-600">{diffCount}</span>
                                            </div>
                                            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                                              <span className="font-bold text-slate-950 text-sm">Tổng lệch</span>
                                              <span
                                                className={`font-mono font-bold text-base ${
                                                  diffQty === 0
                                                    ? 'text-emerald-700'
                                                    : diffQty > 0
                                                    ? 'text-cyan-700'
                                                    : 'text-rose-700'
                                                }`}
                                              >
                                                {diffQty > 0 ? `+${diffQty}` : diffQty}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* TAB 2: THÔNG TIN PHIẾU KIỂM */}
                                    {currentTab === 'info' && (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/70 p-4 border border-slate-200 text-xs">
                                        <div>
                                          <span className="text-slate-400 block text-[11px] mb-0.5">Mã kiểm kho:</span>
                                          <span className="font-mono font-bold text-[#008080]">{slip.code}</span>
                                        </div>
                                        <div>
                                          <span className="text-slate-400 block text-[11px] mb-0.5">Tên phiên kiểm kê:</span>
                                          <span className="font-semibold text-slate-900">{slip.title}</span>
                                        </div>
                                        <div>
                                          <span className="text-slate-400 block text-[11px] mb-0.5">Phạm vi kho:</span>
                                          <span className="font-bold text-slate-900">{slip.scopeLabel}</span>
                                        </div>
                                        <div>
                                          <span className="text-slate-400 block text-[11px] mb-0.5">Thời gian kiểm:</span>
                                          <span className="font-mono font-medium text-slate-800">{slip.createdAt}</span>
                                        </div>
                                        <div>
                                          <span className="text-slate-400 block text-[11px] mb-0.5">Người chủ trì / Kiểm đếm:</span>
                                          <span className="font-medium text-slate-800">{slip.creator}</span>
                                        </div>
                                        <div>
                                          <span className="text-slate-400 block text-[11px] mb-0.5">Trạng thái:</span>
                                          <span className="font-medium text-emerald-700">
                                            {slip.status === 'completed' ? 'Đã hoàn tất 100%' : 'Đang kiểm đếm'}
                                          </span>
                                        </div>
                                        <div className="sm:col-span-2">
                                          <span className="text-slate-400 block text-[11px] mb-0.5">Ghi chú phiên kiểm:</span>
                                          <span className="text-slate-700 italic">{slip.note || 'Không có ghi chú'}</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* 3. Action Footer Bar */}
                                  <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-white border-t border-slate-200">
                                    {/* Left: Thu gọn & Xóa */}
                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="small"
                                        icon={<UpOutlined />}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setExpandedAuditRowKeys((prev) => prev.filter((k) => k !== slip.id));
                                        }}
                                        className="h-8 rounded-none border-slate-300 px-3 text-xs font-normal text-slate-700 hover:!border-slate-400 flex items-center"
                                      >
                                        Thu gọn
                                      </Button>

                                      <Popconfirm
                                        title={`Xóa phiếu kiểm kho ${slip.code}?`}
                                        description="Hành động này không thể hoàn tác."
                                        onConfirm={async (e) => {
                                          e?.stopPropagation();
                                          try {
                                            await stockAuditApi.deleteStockAudit(slip.id);
                                          } catch {}
                                          setAuditSlips((prev) => prev.filter((s) => s.id !== slip.id));
                                          message.success(`Đã xóa phiếu kiểm kho ${slip.code} thành công!`);
                                        }}
                                        okText="Xóa"
                                        cancelText="Hủy"
                                        okButtonProps={{ danger: true }}
                                      >
                                        <Button
                                          size="small"
                                          icon={<DeleteOutlined />}
                                          onClick={(e) => e.stopPropagation()}
                                          className="h-8 rounded-none border-slate-300 px-3 text-xs font-normal text-slate-500 hover:text-rose-600 hover:!border-rose-400 flex items-center"
                                        >
                                          Xóa
                                        </Button>
                                      </Popconfirm>
                                    </div>

                                    {/* Right: Cập nhật kết quả, Lưu, Sao chép, In, Xuất file */}
                                    <div className="flex flex-wrap items-center gap-2">
                                      {slip.status !== 'completed' && (
                                        <Popconfirm
                                          title={`Hoàn tất và cân bằng tồn kho theo phiếu ${slip.code}?`}
                                          description="Số lượng tồn kho thực tế của các mặt hàng sẽ được cập nhật đồng bộ vào hệ thống."
                                          onConfirm={async (e) => {
                                            e?.stopPropagation();
                                            try {
                                              await stockAuditApi.completeStockAudit(slip.id, {
                                                note: slip.note,
                                                itemsJson: JSON.stringify(slip.items || []),
                                              });
                                              invalidateApiCache('products');
                                              await loadAuditsFromApi();
                                              await refreshCatalogProducts();
                                              message.success(`Đã hoàn tất và cân bằng tồn kho phiếu ${slip.code}!`);
                                            } catch (err: any) {
                                              message.error(err?.message || 'Hoàn tất kiểm kho thất bại.');
                                            }
                                          }}
                                          okText="Cân bằng ngay"
                                          cancelText="Hủy"
                                        >
                                          <Button
                                            size="small"
                                            icon={<CheckCircleOutlined />}
                                            onClick={(e) => e.stopPropagation()}
                                            className="h-8 rounded-none !bg-emerald-600 !border-emerald-600 hover:!bg-emerald-700 text-white px-3 text-xs font-medium flex items-center shadow-none"
                                          >
                                            Cân bằng tồn kho
                                          </Button>
                                        </Popconfirm>
                                      )}

                                      <Button
                                        size="small"
                                        icon={<EditOutlined />}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenEditStocktake(slip);
                                        }}
                                        className="h-8 rounded-none !bg-[#008080] !border-[#008080] hover:!bg-[#006666] text-white px-3.5 text-xs font-medium flex items-center shadow-none"
                                      >
                                        Cập nhật kết quả
                                      </Button>

                                      <Button
                                        size="small"
                                        icon={<SaveOutlined />}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          message.success(`Đã lưu cập nhật kết quả kiểm kho ${slip.code}!`);
                                        }}
                                        className="h-8 rounded-none border-slate-300 px-3 text-xs font-normal text-slate-700 hover:!border-slate-400 flex items-center"
                                      >
                                        Lưu
                                      </Button>

                                      <Button
                                        size="small"
                                        icon={<CopyOutlined />}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const nextNum = (auditSlips.length + 1).toString().padStart(2, '0');
                                          const cloned: AuditSlip = {
                                            ...slip,
                                            id: `slip_${Date.now()}`,
                                            code: `#KK-2026-${nextNum}`,
                                            title: `${slip.title} (Bản sao)`,
                                            createdAt: new Date().toLocaleDateString('vi-VN'),
                                            status: 'auditing',
                                            statusLabel: 'Đang kiểm đếm',
                                          };
                                          setAuditSlips((prev) => [cloned, ...prev]);
                                          message.success(`Đã nhân bản phiếu kiểm kho "${slip.code}"!`);
                                        }}
                                        className="h-8 rounded-none border-slate-300 px-3 text-xs font-normal text-slate-700 hover:!border-slate-400 flex items-center"
                                      >
                                        Sao chép
                                      </Button>

                                      <Button
                                        size="small"
                                        icon={<PrinterOutlined />}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          printStocktakeSlip({
                                            code: slip.code,
                                            date: slip.createdAt,
                                            warehouseName: slip.scopeLabel || 'Kho Tổng',
                                            staffName: slip.creator || 'Admin',
                                            lines: itemsList.map((l) => ({
                                              itemCode: l.code,
                                              itemName: l.name,
                                              unit: l.unit || 'Cái',
                                              systemQty: Number(l.systemQty || 0),
                                              actualQty: Number(l.actualQty || 0),
                                              diffQty: Number(l.actualQty || 0) - Number(l.systemQty || 0),
                                              unitPrice: Number(l.unitPrice || l.costPrice || 500000),
                                              diffValue:
                                                (Number(l.actualQty || 0) - Number(l.systemQty || 0)) *
                                                Number(l.unitPrice || l.costPrice || 500000),
                                              reason:
                                                l.qualityNote ||
                                                (Number(l.actualQty || 0) === Number(l.systemQty || 0)
                                                  ? 'Khớp số liệu tồn'
                                                  : 'Chênh lệch thực tế'),
                                            })),
                                          });
                                        }}
                                        className="h-8 rounded-none border-slate-300 px-3 text-xs font-normal text-slate-700 hover:!border-slate-400 flex items-center"
                                      >
                                        In
                                      </Button>

                                      <Button
                                        size="small"
                                        icon={<DownloadOutlined />}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const exportData = itemsList.map((it, idx) => ({
                                            'STT': idx + 1,
                                            'Mã hàng': it.code,
                                            'Tên sản phẩm': it.name,
                                            'Tồn sổ sách': it.systemQty ?? 0,
                                            'Tồn thực tế': it.actualQty ?? 0,
                                            'Chênh lệch': (it.actualQty ?? 0) - (it.systemQty ?? 0),
                                            'Trạng thái':
                                              (it.actualQty ?? 0) === (it.systemQty ?? 0)
                                                ? 'Khớp'
                                                : (it.actualQty ?? 0) > (it.systemQty ?? 0)
                                                ? 'Thừa'
                                                : 'Thiếu',
                                            'Ghi chú': it.location || it.qualityNote || '',
                                          }));
                                          exportToExcel(exportData, `Phieu_kiem_kho_${slip.code}`);
                                          message.success(`Đã xuất dữ liệu phiếu ${slip.code} ra Excel!`);
                                        }}
                                        className="h-8 rounded-none border-slate-300 px-3 text-xs font-normal text-slate-700 hover:!border-slate-400 flex items-center"
                                      >
                                        Xuất file
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              );
                            },
                          }}
                          columns={[
                            {
                              title: 'Mã kiểm kho',
                              dataIndex: 'code',
                              key: 'code',
                              width: 150,
                              render: (c) => (
                                <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded whitespace-nowrap inline-block text-[#784e34] bg-[#784e34]/10">
                                  {c}
                                </span>
                              ),
                            },
                            {
                              title: 'Tên phiên kiểm kê',
                              dataIndex: 'title',
                              key: 'title',
                              render: (t) => (
                                <span className="font-semibold text-xs leading-normal text-slate-900">
                                  {t}
                                </span>
                              ),
                            },
                            {
                              title: 'Phạm vi kho',
                              dataIndex: 'scopeLabel',
                              key: 'scopeLabel',
                              render: (s) => (
                                <span className="text-xs text-slate-600 font-normal">
                                  {s}
                                </span>
                              ),
                            },
                            {
                              title: 'Ngày kiểm',
                              dataIndex: 'createdAt',
                              key: 'createdAt',
                              width: 130,
                              render: (d) => (
                                <span className="font-mono text-xs whitespace-nowrap text-slate-500 font-normal">
                                  {d}
                                </span>
                              ),
                            },
                            {
                              title: 'Người chủ trì',
                              dataIndex: 'creator',
                              key: 'creator',
                              render: (cr) => (
                                <span className="text-xs text-slate-700 font-normal">
                                  {cr}
                                </span>
                              ),
                            },
                            {
                              title: 'Trạng thái',
                              dataIndex: 'status',
                              key: 'status',
                              align: 'center',
                              width: 150,
                              render: (s) =>
                                s === 'completed' ? (
                                  <Tag color="green" className="font-normal text-xs px-2.5 py-1 rounded whitespace-nowrap">
                                    Đã hoàn tất 100%
                                  </Tag>
                                ) : (
                                  <Tag
                                    color="processing"
                                    className="font-normal text-xs px-2.5 py-1 rounded whitespace-nowrap"
                                  >
                                    Đang kiểm đếm
                                  </Tag>
                                ),
                            },
                            {
                              title: 'Thao tác',
                              key: 'action',
                              align: 'center',
                              width: 90,
                              render: (_, r) => {
                                return (
                                  <Space size={4} onClick={(e) => e.stopPropagation()}>
                                    <Button
                                      icon={<EditOutlined className="text-base text-slate-600 hover:text-[#784e34]" />}
                                      size="small"
                                      type="text"
                                      onClick={() => handleOpenEditStocktake(r)}
                                      className="hover:bg-slate-100"
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
                                        icon={<DeleteOutlined className="text-base text-slate-400 hover:text-red-600" />}
                                        size="small"
                                        type="text"
                                        className="hover:bg-rose-50"
                                        title="Xóa phiếu"
                                      />
                                    </Popconfirm>
                                  </Space>
                                );
                              },
                            },
                          ]}
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* SUB-TAB 3 (ENTRY MODE): GIAO DIỆN KIỂM KHO CHUẨN DOMACO ACCOUNTING / POS */}
            {warehouseSubTab === 'stocktake' && (stocktakeViewMode === 'create' || stocktakeViewMode === 'edit') && (
              <StocktakeCreate
                stocktakeViewMode={stocktakeViewMode}
                stocktakeSlipCode={stocktakeSlipCode}
                stocktakeDate={stocktakeDate}
                stocktakeWarehouseName={stocktakeWarehouseName}
                setStocktakeWarehouseName={setStocktakeWarehouseName}
                stocktakeStaffName={stocktakeStaffName}
                setStocktakeStaffName={setStocktakeStaffName}
                stocktakeNote={stocktakeNote}
                setStocktakeNote={setStocktakeNote}
                stocktakeTabFilter={stocktakeTabFilter}
                setStocktakeTabFilter={setStocktakeTabFilter}
                stocktakeEntryLines={stocktakeEntryLines}
                setStocktakeEntryLines={setStocktakeEntryLines}
                stocktakeSearchProduct={stocktakeSearchProduct}
                setStocktakeSearchProduct={setStocktakeSearchProduct}
                allAuditableStock={allAuditableStock}
                allProducts={allAvailableProducts}
                availableBranchWarehouses={availableBranchWarehouses}
                onNavigateToProduct={onNavigateToProduct}
                onBack={() => setStocktakeViewMode('list')}
                onSaveDraft={handleSaveDraftStocktake}
                onSubmit={handleCompleteStocktake}
                onExportExcel={handleExportCreateStocktakeLinesExcel}
                onPrint={() => {
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
                user={user}
              />
            )}

            {/* SUB-TAB 5: QUẢN LÝ NHÀ CUNG CẤP (DOMACO ACCOUNTING / CRM VENDOR MASTER) */}
            {warehouseSubTab === 'suppliers' && (
              <SuppliersTab
                suppliersList={suppliersList}
                setSuppliersList={setSuppliersList}
                importsList={importsList}
                supplierReturnsList={supplierReturnsList}
                selectedGlobalBranch={selectedGlobalBranch}
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
                    placeholder={selectedWarehouseDistrict ? 'Chọn/nhập phường/xã...' : 'Chọn quận/huyện trước'}
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

      {/* DRAWER: TẠO PHIẾU KIỂM KHO MỚI */}
      <Drawer
        title={<span className="font-bold text-base text-[#1f1b19]">📋 Tạo phiếu kiểm kê kho mới</span>}
        open={showCreateSlipModal}
        onClose={() => setShowCreateSlipModal(false)}
        styles={{ wrapper: { width: 640, maxWidth: '100vw' } }}
        forceRender
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
                        Sổ sách: <span className="font-bold text-[#1f1b19]">{item.systemQty}</span>
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
        styles={{ wrapper: { width: 520, maxWidth: '100vw' } }}
        forceRender
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
                      SP ({item.systemQty})
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
        styles={{ wrapper: { width: 520, maxWidth: '100vw' } }}
        forceRender
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
        styles={{ wrapper: { width: 840, maxWidth: '100vw' } }}
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
                  <td colSpan={4} className="border border-slate-300 p-2.5 text-right text-slate-800">
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
        styles={{ wrapper: { width: 840, maxWidth: '100vw' } }}
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
                                    <th className="border border-slate-300 p-2 text-right w-36">Tổng thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let itemsToRender = selectedImportSlipForPrint.items || [];
                  if (itemsToRender.length === 0 && selectedImportSlipForPrint.itemsJson) {
                    try {
                      itemsToRender = JSON.parse(selectedImportSlipForPrint.itemsJson);
                    } catch {
                      itemsToRender = [];
                    }
                  }
                  if (itemsToRender.length === 0) {
                    itemsToRender = [
                      {
                        id: '01',
                        code: selectedImportSlipForPrint.code,
                        name: selectedImportSlipForPrint.itemName,
                        spec: selectedImportSlipForPrint.spec || 'Quy cách chuẩn thương mại',
                        quantity: selectedImportSlipForPrint.quantity,
                        unit: selectedImportSlipForPrint.unit,
                        unitPrice: selectedImportSlipForPrint.unitPrice,
                        total: selectedImportSlipForPrint.totalValue,
                      } as any,
                    ];
                  }
                  return itemsToRender.map((it, idx) => (
                    <tr key={it.id || idx}>
                      <td className="border border-slate-300 p-2.5 text-center font-mono font-semibold">
                        {(idx + 1).toString().padStart(2, '0')}
                      </td>
                      <td className="border border-slate-300 p-2.5 font-bold text-slate-900">
                        {it.name}
                        {it.code && <div className="text-[11px] font-mono text-slate-500 font-normal">{it.code}</div>}
                      </td>
                      <td className="border border-slate-300 p-2.5 text-slate-600 font-mono text-[11px]">
                        {it.spec || 'Quy cách chuẩn'}
                      </td>
                      <td className="border border-slate-300 p-2.5 text-center font-mono font-bold text-slate-900">
                        {it.quantity}
                      </td>
                                            <td className="border border-slate-300 p-2.5 text-right font-mono font-bold text-[#784e34]">
                        {(it.total || (it.quantity * (it.unitPrice || 0))).toLocaleString('vi-VN')} đ
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold">
                  <td colSpan={4} className="border border-slate-300 p-2.5 text-right text-slate-800">
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

      {/* MODAL LẬP PHIẾU CHI TRẢ NỢ NCC */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-slate-900 font-bold">
            <DollarOutlined className="text-[#008080] text-base" />
            <span>Lập phiếu chi trả nợ nhà cung cấp</span>
          </div>
        }
        open={paymentModalVisible}
        onCancel={() => {
          setPaymentModalVisible(false);
          setPaymentSlipTarget(null);
        }}
        onOk={handleConfirmPaySupplier}
        okText="Xác nhận chi tiền"
        cancelText="Đóng"
        okButtonProps={{ className: '!bg-[#008080] !border-[#008080]' }}
        width={520}
        destroyOnHidden
      >
        {paymentSlipTarget && (
          <div className="space-y-4 py-2">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Mã phiếu nhập:</span>
                <span className="font-mono font-bold text-[#008080]">{paymentSlipTarget.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nhà cung cấp:</span>
                <span className="font-semibold text-slate-800">{paymentSlipTarget.supplier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tổng tiền hàng:</span>
                <span className="font-mono font-medium text-slate-900">
                  {(paymentSlipTarget.totalValue || 0).toLocaleString('vi-VN')} đ
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Đã thanh toán:</span>
                <span className="font-mono font-medium text-emerald-700">
                  {(paymentSlipTarget.paidAmount || 0).toLocaleString('vi-VN')} đ
                </span>
              </div>
              {(() => {
                const retDed = getImportReturnDeduction(paymentSlipTarget);
                const netDebt = getImportNetDebt(paymentSlipTarget);
                return (
                  <>
                    {retDed > 0 && (
                      <div className="flex justify-between text-amber-700">
                        <span className="font-medium">Hàng đã trả NCC:</span>
                        <span className="font-mono font-medium">-{retDed.toLocaleString('vi-VN')} đ</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-1 border-t border-slate-200">
                      <span className="font-semibold text-slate-700">Công nợ còn lại:</span>
                      <span className={`font-mono font-bold ${netDebt > 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                        {netDebt.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số tiền chi trả (VNĐ) <span className="text-rose-500">*</span>
              </label>
              <InputNumber
                className="w-full"
                size="large"
                min={1000}
                max={Math.max(0, (paymentSlipTarget.totalValue || 0) - (paymentSlipTarget.paidAmount || 0))}
                value={paymentAmount}
                onChange={(val) => setPaymentAmount(val || 0)}
                formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                parser={(val) => Number((val || '').replace(/\./g, '')) as any}
                addonAfter="đ"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phương thức chi tiền
              </label>
              <Select
                className="w-full"
                value={paymentMethodSelect}
                onChange={(v) => setPaymentMethodSelect(v)}
                options={[
                  { value: 'Chuyển khoản (VietQR)', label: 'Chuyển khoản (VietQR)' },
                  { value: 'Tiền mặt', label: 'Tiền mặt' },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ghi chú phiếu chi
              </label>
              <Input.TextArea
                rows={3}
                placeholder="Nhập ghi chú chi tiết đợt thanh toán..."
                value={paymentNoteText}
                onChange={(e) => setPaymentNoteText(e.target.value)}
              />
            </div>
          </div>
        )}
      </Modal>

    </>
  );
}

export default WorkshopTab;
