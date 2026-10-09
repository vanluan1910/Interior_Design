export interface OrderRow {
  id: string;
  orderCode: string;
  orderType: 'retail' | 'custom' | 'package' | 'project' | 'subcontract' | 'ready';
  orderTypeLabel?: string;
  customerName: string;
  customerProvince?: string;
  customerDistrict?: string;
  customerAddress?: string;
  customerPhone: string;
  productName: string;
  productSpec: string;
  woodType?: string;
  orderDate: string;
  deadlineDate: string;
  value: number;
  depositPercent: number;
  depositAmount: number;
  depositNote?: string;
  status: 'pending' | 'processing' | 'delivering' | 'completed' | 'cancelled';
  statusLabel: string;
  spaceType?: 'living' | 'dining' | 'bedroom' | 'office' | 'full';
  spaceLabel?: string;
  branch?: string;
  showroom?: string;
}

export interface AdminCustomer {
  id: string;
  code: string;
  name: string;
  phone: string;
  phone2?: string;
  email: string;
  facebook?: string;
  zalo?: string;
  gender?: 'male' | 'female' | 'other';
  birthday?: string;
  address: string;
  branch?: string;
  branchName?: string;
  type: 'vip' | 'architect' | 'retail' | 'corporate';
  typeLabel?: string;
  tier?: 'standard' | 'silver' | 'gold' | 'diamond' | string;
  salesRep?: string;
  notes?: string;
  totalOrders?: number;
  ordersCount?: number;
  totalSpent: number;
  debt: number;
  lastOrderDate?: string;
  status?: 'active' | 'inactive';
  createdAt?: string;
  customerType?: 'individual' | 'organization';
  companyName?: string;
  buyerName?: string;
  taxId?: string;
  invoiceAddress?: string;
  invoiceProvince?: string;
  invoiceWard?: string;
  budgetUnitCode?: string;
  idNumber?: string;
  passport?: string;
  bankName?: string;
  bankAccount?: string;
  rewardPoints?: number;
  preferredStyle?: string;
  projectLocation?: string;
  budgetRange?: string;
}

export interface LumberBatch {
  id: string;
  code: string;
  badge: string;
  name: string;
  source: string;
  grade: string;
  spec: string;
  mc: string;
  volume: number;
  value: number;
  safetyPercent: number;
  safetyStatus: 'optimal' | 'warning' | 'normal';
}

export interface FeaturedCatalogProduct {
  id: string;
  code: string;
  collection: string;
  name: string;
  price: number; // Giá bán niêm yết
  originalPrice?: number; // Giá gốc / Giá vốn / Giá nhập
  costPrice?: number; // Alias giá gốc
  stockNote: string;
  stockType: 'in_stock' | 'low' | 'custom';
  image: string;
  images?: string[];
  subImages?: string;
  metaInfo?: string;
  metaIcon?: string;
  categoryId?: string;
  categoryName?: string;
  space?: string;
  unit?: string;
  branch?: string;
  location?: string;
  description?: string;
  dimensions?: string;
  material?: string;
  color?: string;
  warranty?: string;
  shippingNote?: string;
}

export interface StockAuditItem {
  id: string;
  code: string;
  name: string;
  type: 'furniture' | 'product' | 'accessory' | string;
  location: string;
  systemQty: number;
  actualQty: number;
  unit: string;
  systemMc?: string;
  actualMc?: string;
  status: 'matched' | 'discrepancy' | 'pending';
  qualityNote: string;
  checked: boolean;
  auditor?: string;
  auditorRole?: string;
  unitPrice?: number;
  costPrice?: number;
  reason?: string;
}

export interface AuditSlip {
  id: string;
  code: string;
  title: string;
  createdAt: string;
  creator: string;
  scope: 'all' | 'catalog' | 'sofa' | 'dining' | 'bedroom' | 'storage' | 'custom' | string;
  scopeLabel: string;
  status: 'auditing' | 'completed' | 'draft';
  statusLabel: string;
  note: string;
  items: StockAuditItem[];
}

export interface AdminWarehouse {
  id: string;
  code: string;
  name: string;
  type: 'showroom' | 'finished' | 'main' | 'ready' | 'transit' | string;
  typeLabel: string;
  branch: string;
  province?: string;
  district?: string;
  ward?: string;
  streetAddress?: string;
  address: string;
  managerName: string;
  managerPhone: string;
  capacityMax: number;
  capacityCurrent: number;
  capacityUnit: string;
  occupancyPercent: number;
  humidityControl?: string;
  status: 'active' | 'inactive';
  isDefault?: boolean;
  description?: string;
  totalValue: number;
}

export interface StockImportSlipItem {
  id?: string;
  code: string;
  name: string;
  unit: string;
  batch?: string;
  expiryDate?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  importPrice?: number;
  total: number;
}

export interface StockImportPaymentHistory {
  id: string;
  code: string;
  date: string;
  amount: number;
  method: string;
  creator: string;
  status: string;
  note?: string;
}

export interface StockImportSlip {
  id: string;
  code: string;
  supplier: string;
  supplierCode?: string;
  supplierPhone?: string;
  warehouseName: string;
  warehouseCode?: string;
  itemName: string;
  spec: string;
  quantity: number;
  unitPrice?: number;
  unit: string;
  mc: string;
  totalValue: number;
  discount?: number;
  paidAmount?: number;
  debtAmount?: number;
  returnStatus?: string;
  paymentMethod?: string;
  invoiceNumber?: string;
  creator?: string;
  note?: string;
  importDate: string;
  inspector: string;
  status: 'completed' | 'inspecting' | 'draft';
  statusLabel: string;
  items?: StockImportSlipItem[];
  payments?: StockImportPaymentHistory[];
}

export interface AdminSupplier {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  branch?: string;
  totalPurchased: number;
  currentDebt?: number;
  totalCollected?: number;
  status: 'active' | 'inactive';
  rating?: number;
  note?: string;
  taxCode?: string;
  company?: string;
  bankName?: string;
  bankAccount?: string;
  province?: string;
  ward?: string;
  identityNumber?: string;
  createdAt?: string;
  createdBy?: string;
}

export interface SupplierReturnSlip {
  id: string;
  code: string;
  sourcePurchaseEntryCode?: string;
  supplierName: string;
  warehouseName: string;
  itemName: string;
  spec?: string;
  quantity: number;
  unit: string;
  purchasePrice?: number;
  returnPrice?: number;
  totalGoods: number;
  totalValue?: number;
  invoiceDiscount: number;
  supplierRefund: number;
  paidAmount: number;
  paymentMethod?: string;
  returnDate: string;
  staffName: string;
  reason: string;
  solution: string;
  status: 'completed' | 'draft' | 'cancelled';
  statusLabel: string;
  note?: string;
}

export interface SupplierPaymentSlip {
  id: string;
  code: string;
  supplierName: string;
  amount: number;
  paymentDate: string;
  method: string;
  bankAccount: string;
  note: string;
  status: 'success' | 'pending';
}

export interface StockTransferSlip {
  id: string;
  code: string;
  fromWarehouse: string;
  toWarehouse: string;
  transferDate: string;
  creator: string;
  itemSummary: string;
  totalQuantity: number;
  status: 'delivering' | 'completed' | 'draft';
  statusLabel: string;
  note: string;
}

export interface StockHistoryLog {
  id: string;
  code: string;
  type: 'import' | 'export' | 'transfer' | 'audit_adjust';
  typeLabel: string;
  warehouseName: string;
  itemName: string;
  itemCode: string;
  changeQty: number;
  balanceQty: number;
  unit: string;
  date: string;
  actor: string;
  docRef: string;
}

export interface AdminBranch {
  id: string;
  code: string;
  name: string;
  type: 'warehouse' | 'showroom' | 'hybrid' | 'office';
  typeLabel: string;
  address: string;
  region: string;
  managerName: string;
  managerPhone: string;
  managerEmail: string;
  area: number;
  staffCount: number;
  warehouseCount: number;
  activeOrdersCount: number;
  establishedDate: string;
  status: 'active' | 'inactive';
  isHeadquarter?: boolean;
  description?: string;
}

export interface AdminUom {
  id: string;
  code: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  status: 'active' | 'inactive';
  createdAt?: string;
}

export interface PermissionDefinition {
  key: string;
  name: string;
  description?: string;
  action?: string;
}

export interface PermissionSubGroup {
  subKey: string;
  subName: string;
  permissions: PermissionDefinition[];
}

export interface PermissionGroup {
  groupKey: string;
  groupName: string;
  groupIcon: string;
  subGroups?: PermissionSubGroup[];
  permissions: PermissionDefinition[];
}

export interface AdminRole {
  id: string;
  code: string;
  name: string;
  description: string;
  userCount: number;
  isSystem?: boolean;
  status: 'active' | 'inactive';
  permissions: string[];
}

export interface AdminEmployee {
  id: string;
  code: string;
  name: string;
  phone: string;
  idNumber: string;
  gender: 'Nam' | 'Nữ';
  birthday: string;
  email: string;
  address: string;
  department: string;
  title: string;
  branch: string;
  branchId?: string;
  branchIds?: string[];
  login: string;
  username?: string;
  password?: string;
  role?: string;
  status: 'working' | 'resigned';
  workingDate?: string;
  area?: string;
  province?: string;
  district?: string;
  ward?: string;
  addressDetail?: string;
  debt?: number;
  note?: string;
  facebook?: string;
  zalo?: string;
  linkedUsernames?: string | string[];
  skills?: string[];
}

export interface AdminSpace {
  id: string;
  code: string;
  name: string;
  slug: string;
  tagline?: string;
  description?: string;
  image?: string;
  icon?: string;
  displayOrder: number;
  status: 'active' | 'hidden';
  showOnHome: boolean;
  showOnHeader: boolean;
  categoryCount?: number;
}

export interface AdminCategory {
  id: string;
  code: string;
  name: string;
  slug: string;
  productCount: number;
  featuredProduct: string;
  image: string;
  space: string;
  spaceId?: string;
  displayOrder: number;
  status: 'active' | 'hidden';
  showOnHome: boolean;
  showOnMenu: boolean;
  description: string;
  badge?: string;
}

export interface AdminCompanyInfo {
  code: string;
  companyName: string;
  brandName: string;
  taxId: string;
  representative: string;
  representativeRole: string;
  businessSector: string;
  phone: string;
  hotline: string;
  email: string;
  website: string;
  zalo: string;
  fanpage: string;
  headquarters: string;
  warehouseAddress?: string;
  country: string;
  province?: string;
  district?: string;
  ward?: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  stampUrl?: string | null;
  status: boolean;
  accessUrl?: string;
  expiredAt?: string;
  receiptHeaderTitle?: string;
  receiptFooterNote?: string;
  showTaxOnReceipt?: boolean;
  showHotlineOnReceipt?: boolean;
  showQrOnReceipt?: boolean;
}
