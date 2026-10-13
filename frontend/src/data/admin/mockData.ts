import {
  AdminCustomer,
  OrderRow,
  LumberBatch,
  FeaturedCatalogProduct,
  StockAuditItem,
  AuditSlip,
  AdminWarehouse,
  StockImportSlip,
  AdminSupplier,
  SupplierReturnSlip,
  SupplierPaymentSlip,
  StockTransferSlip,
  StockHistoryLog,
  AdminBranch,
  AdminUom,
  PermissionGroup,
  AdminRole,
  AdminEmployee,
  AdminCategory,
  AdminSpace,
  AdminCompanyInfo,
} from '@/types/admin';

// Business entities initialized empty - loaded from real backend Database
export const INITIAL_CUSTOMERS: AdminCustomer[] = [];
export const INITIAL_ORDERS: OrderRow[] = [];
export const INITIAL_LUMBER: LumberBatch[] = [];
export const INITIAL_AUDIT_ITEMS: StockAuditItem[] = [];
export const INITIAL_AUDIT_SLIPS: AuditSlip[] = [];
export const INITIAL_WAREHOUSES: AdminWarehouse[] = [];
export const INITIAL_STOCK_IMPORTS: StockImportSlip[] = [];
export const INITIAL_SUPPLIERS: AdminSupplier[] = [];
export const INITIAL_SUPPLIER_RETURNS: SupplierReturnSlip[] = [];
export const INITIAL_SUPPLIER_PAYMENTS: SupplierPaymentSlip[] = [];
export const INITIAL_STOCK_TRANSFERS: StockTransferSlip[] = [];
export const INITIAL_STOCK_HISTORY: StockHistoryLog[] = [];
export const INITIAL_BRANCHES: AdminBranch[] = [];
export const INITIAL_EMPLOYEES: AdminEmployee[] = [];
export const INITIAL_SPACES: AdminSpace[] = [];
export const INITIAL_CATEGORIES: AdminCategory[] = [];
export const FEATURED_CATALOG: FeaturedCatalogProduct[] = [];

// System standard units of measure (UOM) - loaded from real backend Database
export const INITIAL_UOMS: AdminUom[] = [];

// System Permission Matrix
export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    groupKey: 'pos_orders',
    groupName: 'Đơn hàng & Bán hàng POS',
    groupIcon: '🛒',
    subGroups: [
      {
        subKey: 'orders_management',
        subName: 'Quản lý Đơn hàng & Bán lẻ',
        permissions: [
          { key: 'orders.view', name: 'Xem danh sách đơn hàng POS', description: 'Tra cứu và lọc đơn hàng theo trạng thái, khách hàng, ngày tạo' },
          { key: 'orders.create', name: 'Tạo mới đơn hàng POS & Bán lẻ', description: 'Tạo đơn hàng mới từ màn hình thu ngân và chốt đơn' },
          { key: 'orders.update', name: 'Chỉnh sửa đơn hàng & Chiết khấu', description: 'Sửa số lượng, đổi thông tin giao hàng, áp dụng giảm giá' },
          { key: 'orders.delete', name: 'Hủy / Xóa đơn hàng', description: 'Hủy đơn hàng chưa thanh toán hoặc xóa đơn nháp' },
          { key: 'orders.export', name: 'Xuất danh sách đơn hàng (Excel)', description: 'Tải báo cáo đơn hàng định dạng Excel' },
          { key: 'orders.print', name: 'In hóa đơn & Phiếu giao hàng', description: 'In phiếu thu, phiếu xuất kho giao hàng K80 / A4 / A5' },
        ],
      },
      {
        subKey: 'pos_checkout',
        subName: 'Thu ngân & Thanh toán',
        permissions: [
          { key: 'pos.checkout.cash', name: 'Thanh toán Tiền mặt', description: 'Thu tiền mặt trực tiếp tại quầy' },
          { key: 'pos.checkout.bank', name: 'Thanh toán Chuyển khoản / VietQR', description: 'Tạo mã QR động và nhận tiền chuyển khoản MB Bank' },
          { key: 'pos.checkout.deposit', name: 'Nhận cọc & Trả góp nội thất', description: 'Thu tiền đặt cọc thi công và thanh toán theo từng đợt' },
          { key: 'pos.refund', name: 'Hoàn tiền & Đổi trả sản phẩm', description: 'Lập phiếu chi hoàn tiền cọc hoặc hủy đơn trả hàng' },
        ],
      },
    ],
    permissions: [
      { key: 'orders.view', name: 'Xem danh sách đơn hàng POS', description: 'Tra cứu và lọc đơn hàng theo trạng thái, khách hàng, ngày tạo' },
      { key: 'orders.create', name: 'Tạo mới đơn hàng POS & Bán lẻ', description: 'Tạo đơn hàng mới từ màn hình thu ngân và chốt đơn' },
      { key: 'orders.update', name: 'Chỉnh sửa đơn hàng & Chiết khấu', description: 'Sửa số lượng, đổi thông tin giao hàng, áp dụng giảm giá' },
      { key: 'orders.delete', name: 'Hủy / Xóa đơn hàng', description: 'Hủy đơn hàng chưa thanh toán hoặc xóa đơn nháp' },
      { key: 'orders.export', name: 'Xuất danh sách đơn hàng (Excel)', description: 'Tải báo cáo đơn hàng định dạng Excel' },
      { key: 'orders.print', name: 'In hóa đơn & Phiếu giao hàng', description: 'In phiếu thu, phiếu xuất kho giao hàng K80 / A4 / A5' },
      { key: 'pos.checkout.cash', name: 'Thanh toán Tiền mặt', description: 'Thu tiền mặt trực tiếp tại quầy' },
      { key: 'pos.checkout.bank', name: 'Thanh toán Chuyển khoản / VietQR', description: 'Tạo mã QR động và nhận tiền chuyển khoản MB Bank' },
      { key: 'pos.checkout.deposit', name: 'Nhận cọc & Trả góp nội thất', description: 'Thu tiền đặt cọc thi công và thanh toán theo từng đợt' },
      { key: 'pos.refund', name: 'Hoàn tiền & Đổi trả sản phẩm', description: 'Lập phiếu chi hoàn tiền cọc hoặc hủy đơn trả hàng' },
    ],
  },
  {
    groupKey: 'inventory_warehouse',
    groupName: 'Kho hàng, Sản phẩm & Xuất nhập tồn',
    groupIcon: '🏢',
    subGroups: [
      {
        subKey: 'catalog_products',
        subName: 'Danh mục Sản phẩm & Báo giá',
        permissions: [
          { key: 'catalog.products.view', name: 'Xem danh mục sản phẩm & Báo giá', description: 'Xem bảng giá, tồn kho tức thời và thông số kỹ thuật' },
          { key: 'catalog.products.create', name: 'Thêm mới sản phẩm vào danh mục', description: 'Thêm mẫu thiết kế mới vào catalog' },
          { key: 'catalog.products.update', name: 'Chỉnh sửa giá bán & Ảnh render 3D', description: 'Cập nhật hình ảnh render chi tiết, kích thước và chất liệu' },
          { key: 'catalog.products.delete', name: 'Ẩn / Xóa sản phẩm khỏi danh mục', description: 'Tạm ẩn hoặc xóa mẫu sản phẩm' },
          { key: 'catalog.products.export', name: 'Xuất danh mục sản phẩm (Excel)', description: 'Tải file Excel danh sách sản phẩm và giá niêm yết' },
        ],
      },
      {
        subKey: 'warehouses_list',
        subName: 'Danh sách Kho hàng & Showroom',
        permissions: [
          { key: 'inventory.warehouses.view', name: 'Xem danh sách kho hàng & Showroom', description: 'Tra cứu danh sách kho và cơ sở' },
          { key: 'inventory.warehouses.create', name: 'Thêm mới kho hàng & Showroom', description: 'Tạo mới cơ sở kho hoặc showroom' },
          { key: 'inventory.warehouses.update', name: 'Chỉnh sửa thông tin kho & Showroom', description: 'Cập nhật sức chứa, địa chỉ, người quản lý kho' },
          { key: 'inventory.warehouses.delete', name: 'Xóa / Đóng cửa kho & Showroom', description: 'Ngừng hoạt động cơ sở kho hoặc showroom' },
        ],
      },
      {
        subKey: 'stock_imports_returns',
        subName: 'Nhập kho & Xuất trả hàng',
        permissions: [
          { key: 'inventory.imports.view', name: 'Xem danh sách phiếu nhập kho (#PN)', description: 'Tra cứu phiếu nhập thành phẩm nội thất' },
          { key: 'inventory.imports.create', name: 'Thêm mới phiếu nhập kho (#PN)', description: 'Lập phiếu nhập sản phẩm nội thất từ nhà cung ứng' },
          { key: 'inventory.imports.update', name: 'Chỉnh sửa phiếu nhập kho (#PN)', description: 'Cập nhật số lượng, đơn giá phiếu nhập chưa chốt' },
          { key: 'inventory.returns.view', name: 'Xem danh sách phiếu trả hàng (#TH)', description: 'Tra cứu phiếu xuất trả hàng NCC' },
          { key: 'inventory.returns.create', name: 'Thêm mới phiếu xuất trả hàng (#TH)', description: 'Lập phiếu xuất trả hàng lỗi kỹ thuật' },
          { key: 'inventory.returns.update', name: 'Chỉnh sửa phiếu xuất trả hàng (#TH)', description: 'Cập nhật thông tin phiếu trả hàng chưa duyệt' },
        ],
      },
      {
        subKey: 'stock_audit_transfer',
        subName: 'Kiểm kê & Cân bằng tồn kho',
        permissions: [
          { key: 'inventory.stocktake.view', name: 'Xem danh sách phiếu kiểm kê (#KK)', description: 'Tra cứu lịch sử các đợt kiểm đếm hàng' },
          { key: 'inventory.stocktake.create', name: 'Thêm mới phiếu kiểm kê kho (#KK)', description: 'Lập phiếu kiểm đếm số lượng tồn kho thực tế' },
          { key: 'inventory.stocktake.update', name: 'Cập nhật & Cân bằng kiểm kê (#KK)', description: 'Xác nhận chênh lệch và điều chỉnh tồn kho' },
          { key: 'inventory.history.view', name: 'Xem lịch sử xuất nhập tồn (Thẻ kho)', description: 'Tra cứu biến động số lượng xuất nhập theo từng mặt hàng' },
        ],
      },
    ],
    permissions: [
      { key: 'catalog.products.view', name: 'Xem danh mục sản phẩm & Báo giá', description: 'Xem bảng giá, tồn kho tức thời và thông số kỹ thuật' },
      { key: 'catalog.products.create', name: 'Thêm mới sản phẩm vào danh mục', description: 'Thêm mẫu thiết kế mới vào catalog' },
      { key: 'catalog.products.update', name: 'Chỉnh sửa giá bán & Ảnh render 3D', description: 'Cập nhật hình ảnh render chi tiết, kích thước và chất liệu' },
      { key: 'catalog.products.delete', name: 'Ẩn / Xóa sản phẩm khỏi danh mục', description: 'Tạm ẩn hoặc xóa mẫu sản phẩm' },
      { key: 'catalog.products.export', name: 'Xuất danh mục sản phẩm (Excel)', description: 'Tải file Excel danh sách sản phẩm và giá niêm yết' },
      { key: 'inventory.warehouses.view', name: 'Xem danh sách kho hàng & Showroom', description: 'Tra cứu danh sách kho và cơ sở' },
      { key: 'inventory.warehouses.create', name: 'Thêm mới kho hàng & Showroom', description: 'Tạo mới cơ sở kho hoặc showroom' },
      { key: 'inventory.warehouses.update', name: 'Chỉnh sửa thông tin kho & Showroom', description: 'Cập nhật sức chứa, địa chỉ, người quản lý kho' },
      { key: 'inventory.warehouses.delete', name: 'Xóa / Đóng cửa kho & Showroom', description: 'Ngừng hoạt động cơ sở kho hoặc showroom' },
      { key: 'inventory.imports.view', name: 'Xem danh sách phiếu nhập kho (#PN)', description: 'Tra cứu phiếu nhập thành phẩm nội thất' },
      { key: 'inventory.imports.create', name: 'Thêm mới phiếu nhập kho (#PN)', description: 'Lập phiếu nhập sản phẩm nội thất từ nhà cung ứng' },
      { key: 'inventory.imports.update', name: 'Chỉnh sửa phiếu nhập kho (#PN)', description: 'Cập nhật số lượng, đơn giá phiếu nhập chưa chốt' },
      { key: 'inventory.returns.view', name: 'Xem danh sách phiếu trả hàng (#TH)', description: 'Tra cứu phiếu xuất trả hàng NCC' },
      { key: 'inventory.returns.create', name: 'Thêm mới phiếu xuất trả hàng (#TH)', description: 'Lập phiếu xuất trả hàng lỗi kỹ thuật' },
      { key: 'inventory.returns.update', name: 'Chỉnh sửa phiếu xuất trả hàng (#TH)', description: 'Cập nhật thông tin phiếu trả hàng chưa duyệt' },
      { key: 'inventory.stocktake.view', name: 'Xem danh sách phiếu kiểm kê (#KK)', description: 'Tra cứu lịch sử các đợt kiểm đếm hàng' },
      { key: 'inventory.stocktake.create', name: 'Thêm mới phiếu kiểm kê kho (#KK)', description: 'Lập phiếu kiểm đếm số lượng tồn kho thực tế' },
      { key: 'inventory.stocktake.update', name: 'Cập nhật & Cân bằng kiểm kê (#KK)', description: 'Xác nhận chênh lệch và điều chỉnh tồn kho' },
      { key: 'inventory.history.view', name: 'Xem lịch sử xuất nhập tồn (Thẻ kho)', description: 'Tra cứu biến động số lượng xuất nhập theo từng mặt hàng' },
    ],
  },
  {
    groupKey: 'categories_spaces',
    groupName: 'Danh mục & Không gian nội thất',
    groupIcon: '📐',
    subGroups: [
      {
        subKey: 'categories_mgmt',
        subName: 'Nhóm Danh mục sản phẩm',
        permissions: [
          { key: 'catalog.categories.view', name: 'Xem danh mục nhóm sản phẩm', description: 'Xem danh sách Sofa, Bàn ăn, Giường, Tủ áo...' },
          { key: 'catalog.categories.create', name: 'Thêm mới nhóm danh mục', description: 'Tạo thêm danh mục sản phẩm mới' },
          { key: 'catalog.categories.update', name: 'Chỉnh sửa nhóm danh mục', description: 'Chỉnh sửa tên, mã, thứ tự hiển thị và ảnh đại diện' },
          { key: 'catalog.categories.delete', name: 'Xóa nhóm danh mục', description: 'Xóa nhóm danh mục khỏi hệ thống' },
        ],
      },
      {
        subKey: 'spaces_mgmt',
        subName: 'Không gian kiến trúc 3D',
        permissions: [
          { key: 'catalog.spaces.view', name: 'Xem danh sách không gian nội thất', description: 'Tra cứu Phòng khách, Phòng ngủ, Phòng ăn, Penthouse...' },
          { key: 'catalog.spaces.create', name: 'Thêm mới không gian thiết kế', description: 'Tạo mới khu vực không gian trưng bày' },
          { key: 'catalog.spaces.update', name: 'Chỉnh sửa không gian thiết kế', description: 'Cập nhật ảnh banner, mô tả phong cách không gian' },
          { key: 'catalog.spaces.delete', name: 'Xóa không gian thiết kế', description: 'Xóa không gian khỏi hệ thống' },
        ],
      },
    ],
    permissions: [
      { key: 'catalog.categories.view', name: 'Xem danh mục nhóm sản phẩm', description: 'Xem danh sách Sofa, Bàn ăn, Giường, Tủ áo...' },
      { key: 'catalog.categories.create', name: 'Thêm mới nhóm danh mục', description: 'Tạo thêm danh mục sản phẩm mới' },
      { key: 'catalog.categories.update', name: 'Chỉnh sửa nhóm danh mục', description: 'Chỉnh sửa tên, mã, thứ tự hiển thị và ảnh đại diện' },
      { key: 'catalog.categories.delete', name: 'Xóa nhóm danh mục', description: 'Xóa nhóm danh mục khỏi hệ thống' },
      { key: 'catalog.spaces.view', name: 'Xem danh sách không gian nội thất', description: 'Tra cứu Phòng khách, Phòng ngủ, Phòng ăn, Penthouse...' },
      { key: 'catalog.spaces.create', name: 'Thêm mới không gian thiết kế', description: 'Tạo mới khu vực không gian trưng bày' },
      { key: 'catalog.spaces.update', name: 'Chỉnh sửa không gian thiết kế', description: 'Cập nhật ảnh banner, mô tả phong cách không gian' },
      { key: 'catalog.spaces.delete', name: 'Xóa không gian thiết kế', description: 'Xóa không gian khỏi hệ thống' },
    ],
  },
  {
    groupKey: 'customers_consultations',
    groupName: 'Khách hàng & Tư vấn thiết kế',
    groupIcon: '🏛️',
    subGroups: [
      {
        subKey: 'customers_profiles',
        subName: 'Hồ sơ khách hàng & Đối tác KTS',
        permissions: [
          { key: 'customers.profile.view', name: 'Xem danh bạ gia chủ & Đối tác KTS', description: 'Xem thông tin khách hàng VIP, gia chủ biệt thự, KTS liên kết' },
          { key: 'customers.profile.create', name: 'Thêm mới hồ sơ gia chủ / đối tác', description: 'Tạo mới thông tin khách hàng và công trình' },
          { key: 'customers.profile.update', name: 'Chỉnh sửa thông tin, SĐT & Địa chỉ', description: 'Cập nhật thông tin liên hệ và địa chỉ nhận hàng' },
          { key: 'customers.profile.delete', name: 'Xóa hồ sơ khách hàng', description: 'Xóa thông tin khách hàng khỏi hệ thống' },
          { key: 'customers.debt.view', name: 'Xem công nợ khách hàng', description: 'Tra cứu tổng chi tiêu, công nợ còn lại của gia chủ' },
          { key: 'customers.debt.update', name: 'Cập nhật & Thu hồi công nợ gia chủ', description: 'Ghi nhận thanh toán và cấn trừ công nợ khách hàng' },
        ],
      },
      {
        subKey: 'design_consultations',
        subName: 'Yêu cầu tư vấn thiết kế 3D',
        permissions: [
          { key: 'customers.consult.view', name: 'Xem danh sách đăng ký tư vấn 3D', description: 'Xem các yêu cầu tư vấn thiết kế nội thất từ website' },
          { key: 'customers.consult.update', name: 'Xử lý & Cập nhật trạng thái tư vấn 3D', description: 'Cập nhật tiến độ liên hệ, khảo sát hiện trạng mặt bằng' },
        ],
      },
    ],
    permissions: [
      { key: 'customers.profile.view', name: 'Xem danh bạ gia chủ & Đối tác KTS', description: 'Xem thông tin khách hàng VIP, gia chủ biệt thự, KTS liên kết' },
      { key: 'customers.profile.create', name: 'Thêm mới hồ sơ gia chủ / đối tác', description: 'Tạo mới thông tin khách hàng và công trình' },
      { key: 'customers.profile.update', name: 'Chỉnh sửa thông tin, SĐT & Địa chỉ', description: 'Cập nhật thông tin liên hệ và địa chỉ nhận hàng' },
      { key: 'customers.profile.delete', name: 'Xóa hồ sơ khách hàng', description: 'Xóa thông tin khách hàng khỏi hệ thống' },
      { key: 'customers.debt.view', name: 'Xem công nợ khách hàng', description: 'Tra cứu tổng chi tiêu, công nợ còn lại của gia chủ' },
      { key: 'customers.debt.update', name: 'Cập nhật & Thu hồi công nợ gia chủ', description: 'Ghi nhận thanh toán và cấn trừ công nợ khách hàng' },
      { key: 'customers.consult.view', name: 'Xem danh sách đăng ký tư vấn 3D', description: 'Xem các yêu cầu tư vấn thiết kế nội thất từ website' },
      { key: 'customers.consult.update', name: 'Xử lý & Cập nhật trạng thái tư vấn 3D', description: 'Cập nhật tiến độ liên hệ, khảo sát hiện trạng mặt bằng' },
    ],
  },
  {
    groupKey: 'suppliers_procurement',
    groupName: 'Nhà cung cấp & Vật tư',
    groupIcon: '🤝',
    subGroups: [
      {
        subKey: 'suppliers_master',
        subName: 'Danh bạ nhà cung cấp vật tư',
        permissions: [
          { key: 'suppliers.vendors.view', name: 'Xem danh sách nhà cung cấp', description: 'Tra cứu đối tác cung cấp gỗ FAS, da Mastrotto, phụ kiện' },
          { key: 'suppliers.vendors.create', name: 'Thêm mới đối tác cung ứng', description: 'Tạo mới hồ sơ nhà cung cấp' },
          { key: 'suppliers.vendors.update', name: 'Chỉnh sửa thông tin NCC & Tài khoản', description: 'Cập nhật thông tin liên hệ và thanh toán của đối tác' },
          { key: 'suppliers.vendors.delete', name: 'Xóa nhà cung cấp', description: 'Xóa nhà cung cấp không còn giao dịch' },
        ],
      },
      {
        subKey: 'suppliers_finance',
        subName: 'Công nợ nhà cung cấp',
        permissions: [
          { key: 'suppliers.debt.view', name: 'Xem công nợ phải trả nhà cung cấp', description: 'Đối soát công nợ gối đầu tiền vật tư' },
          { key: 'suppliers.debt.update', name: 'Cập nhật & Đối chiếu công nợ NCC', description: 'Ghi nhận cấn trừ và thanh toán công nợ' },
        ],
      },
    ],
    permissions: [
      { key: 'suppliers.vendors.view', name: 'Xem danh sách nhà cung cấp', description: 'Tra cứu đối tác cung cấp gỗ FAS, da Mastrotto, phụ kiện' },
      { key: 'suppliers.vendors.create', name: 'Thêm mới đối tác cung ứng', description: 'Tạo mới hồ sơ nhà cung cấp' },
      { key: 'suppliers.vendors.update', name: 'Chỉnh sửa thông tin NCC & Tài khoản', description: 'Cập nhật thông tin liên hệ và thanh toán của đối tác' },
      { key: 'suppliers.vendors.delete', name: 'Xóa nhà cung cấp', description: 'Xóa nhà cung cấp không còn giao dịch' },
      { key: 'suppliers.debt.view', name: 'Xem công nợ phải trả nhà cung cấp', description: 'Đối soát công nợ gối đầu tiền vật tư' },
      { key: 'suppliers.debt.update', name: 'Cập nhật & Đối chiếu công nợ NCC', description: 'Ghi nhận cấn trừ và thanh toán công nợ' },
    ],
  },
  {
    groupKey: 'system_settings',
    groupName: 'Cài đặt hệ thống & Bảo mật RBAC',
    groupIcon: '⚙️',
    subGroups: [
      {
        subKey: 'company_payment_settings',
        subName: 'Thông tin công ty & Thanh toán VietQR',
        permissions: [
          { key: 'settings.brand.view', name: 'Xem hồ sơ thương hiệu', description: 'Xem thông tin công ty, địa chỉ và mã số thuế' },
          { key: 'settings.brand.update', name: 'Chỉnh sửa thông tin công ty & Logo', description: 'Cập nhật thông tin pháp nhân, thương hiệu' },
          { key: 'settings.payment.view', name: 'Xem cấu hình tài khoản MB Bank & VietQR', description: 'Tra cứu thông tin tài khoản nhận tiền' },
          { key: 'settings.payment.update', name: 'Chỉnh sửa tài khoản MB Bank & Mã VietQR', description: 'Thiết lập tài khoản nhận tiền cọc và cú pháp VietQR' },
        ],
      },
      {
        subKey: 'print_templates_settings',
        subName: 'Quản lý Mẫu phiếu in & Hóa đơn',
        permissions: [
          { key: 'settings.print.view', name: 'Xem danh sách mẫu in & Xem trước', description: 'Xem trước các mẫu hóa đơn K80/A4/A5, phiếu giao hàng, phiếu kho' },
          { key: 'settings.print.update', name: 'Chỉnh sửa cấu hình & Ghi chú mẫu in', description: 'Tùy biến logo, mã VietQR, ghi chú bảo hành chân trang trên mẫu in' },
          { key: 'settings.print.reset', name: 'Khôi phục mẫu in gốc mặc định', description: 'Khôi phục các mẫu in hệ thống về trạng thái tiêu chuẩn ban đầu' },
        ],
      },
      {
        subKey: 'branches_settings',
        subName: 'Quản lý Chi nhánh & Cơ sở',
        permissions: [
          { key: 'settings.branches.view', name: 'Xem danh sách Chi nhánh & Showroom', description: 'Tra cứu các cơ sở chi nhánh' },
          { key: 'settings.branches.create', name: 'Thêm mới Chi nhánh / Showroom', description: 'Tạo cơ sở chi nhánh mới' },
          { key: 'settings.branches.update', name: 'Chỉnh sửa thông tin Chi nhánh / Showroom', description: 'Cập nhật địa chỉ, quản lý, diện tích' },
          { key: 'settings.branches.delete', name: 'Xóa Chi nhánh / Showroom', description: 'Xóa cơ sở chi nhánh' },
        ],
      },
      {
        subKey: 'uom_settings',
        subName: 'Quản lý Đơn vị tính (UOM)',
        permissions: [
          { key: 'settings.uom.view', name: 'Xem danh sách Đơn vị tính (UOM)', description: 'Tra cứu danh mục đơn vị tính' },
          { key: 'settings.uom.create', name: 'Thêm mới Đơn vị tính (UOM)', description: 'Tạo đơn vị tính m³, m², bộ, chiếc...' },
          { key: 'settings.uom.update', name: 'Chỉnh sửa Đơn vị tính (UOM)', description: 'Cập nhật tên, mã, mô tả đơn vị tính' },
          { key: 'settings.uom.delete', name: 'Xóa Đơn vị tính (UOM)', description: 'Xóa đơn vị tính không dùng' },
        ],
      },
      {
        subKey: 'employees_settings',
        subName: 'Quản lý Nhân sự & Tài khoản',
        permissions: [
          { key: 'settings.employees.view', name: 'Xem danh sách nhân sự & tài khoản', description: 'Tra cứu danh sách hồ sơ nhân viên, phòng ban và chi nhánh' },
          { key: 'settings.employees.create', name: 'Thêm mới hồ sơ nhân viên', description: 'Tạo mới hồ sơ nhân sự và cấp tài khoản đăng nhập' },
          { key: 'settings.employees.update', name: 'Chỉnh sửa thông tin nhân sự', description: 'Cập nhật lý lịch, chức danh, phòng ban, đổi trạng thái làm việc' },
          { key: 'settings.employees.delete', name: 'Xóa hồ sơ nhân viên', description: 'Xóa nhân sự và thu hồi tài khoản truy cập hệ thống' },
          { key: 'settings.employees.reset_password', name: 'Đặt lại / Cấp lại mật khẩu nhân viên', description: 'Cấp lại mật khẩu mới cho tài khoản của nhân viên' },
          { key: 'settings.employees.export', name: 'Xuất danh sách nhân viên (Excel)', description: 'Tải file Excel toàn bộ dữ liệu nhân sự' },
          { key: 'settings.employees.import', name: 'Nhập dữ liệu nhân viên từ Excel', description: 'Tải lên danh sách nhân sự hàng loạt bằng file Excel' },
        ],
      },
      {
        subKey: 'rbac_settings',
        subName: 'Ma trận Phân quyền & Vai trò (RBAC)',
        permissions: [
          { key: 'settings.rbac.view', name: 'Xem danh sách Vai trò & Ma trận quyền', description: 'Tra cứu danh sách vai trò hệ thống' },
          { key: 'settings.rbac.create', name: 'Thêm mới Vai trò người dùng', description: 'Tạo chức danh vai trò mới' },
          { key: 'settings.rbac.update', name: 'Chỉnh sửa Vai trò & Phân bổ quyền', description: 'Cập nhật các quyền hạn cho vai trò' },
          { key: 'settings.rbac.delete', name: 'Xóa Vai trò người dùng', description: 'Xóa vai trò không còn sử dụng' },
        ],
      },
    ],
    permissions: [
      { key: 'settings.brand.view', name: 'Xem hồ sơ thương hiệu', description: 'Xem thông tin công ty, địa chỉ và mã số thuế' },
      { key: 'settings.brand.update', name: 'Chỉnh sửa thông tin công ty & Logo', description: 'Cập nhật thông tin pháp nhân, thương hiệu' },
      { key: 'settings.payment.view', name: 'Xem cấu hình tài khoản MB Bank & VietQR', description: 'Tra cứu thông tin tài khoản nhận tiền' },
      { key: 'settings.payment.update', name: 'Chỉnh sửa tài khoản MB Bank & Mã VietQR', description: 'Thiết lập tài khoản nhận tiền cọc và cú pháp VietQR' },
      { key: 'settings.print.view', name: 'Xem danh sách mẫu in & Xem trước', description: 'Xem trước các mẫu hóa đơn K80/A4/A5, phiếu giao hàng, phiếu kho' },
      { key: 'settings.print.update', name: 'Chỉnh sửa cấu hình & Ghi chú mẫu in', description: 'Tùy biến logo, mã VietQR, ghi chú bảo hành chân trang trên mẫu in' },
      { key: 'settings.print.reset', name: 'Khôi phục mẫu in gốc mặc định', description: 'Khôi phục các mẫu in hệ thống về trạng thái tiêu chuẩn ban đầu' },
      { key: 'settings.branches.view', name: 'Xem danh sách Chi nhánh & Showroom', description: 'Tra cứu các cơ sở chi nhánh' },
      { key: 'settings.branches.create', name: 'Thêm mới Chi nhánh / Showroom', description: 'Tạo cơ sở chi nhánh mới' },
      { key: 'settings.branches.update', name: 'Chỉnh sửa thông tin Chi nhánh / Showroom', description: 'Cập nhật địa chỉ, quản lý, diện tích' },
      { key: 'settings.branches.delete', name: 'Xóa Chi nhánh / Showroom', description: 'Xóa cơ sở chi nhánh' },
      { key: 'settings.uom.view', name: 'Xem danh sách Đơn vị tính (UOM)', description: 'Tra cứu danh mục đơn vị tính' },
      { key: 'settings.uom.create', name: 'Thêm mới Đơn vị tính (UOM)', description: 'Tạo đơn vị tính m³, m², bộ, chiếc...' },
      { key: 'settings.uom.update', name: 'Chỉnh sửa Đơn vị tính (UOM)', description: 'Cập nhật tên, mã, mô tả đơn vị tính' },
      { key: 'settings.uom.delete', name: 'Xóa Đơn vị tính (UOM)', description: 'Xóa đơn vị tính không dùng' },
      { key: 'settings.employees.view', name: 'Xem danh sách nhân sự & tài khoản', description: 'Tra cứu danh sách hồ sơ nhân viên, phòng ban và chi nhánh' },
      { key: 'settings.employees.create', name: 'Thêm mới hồ sơ nhân viên', description: 'Tạo mới hồ sơ nhân sự và cấp tài khoản đăng nhập' },
      { key: 'settings.employees.update', name: 'Chỉnh sửa thông tin nhân sự', description: 'Cập nhật lý lịch, chức danh, phòng ban, đổi trạng thái làm việc' },
      { key: 'settings.employees.delete', name: 'Xóa hồ sơ nhân viên', description: 'Xóa nhân sự và thu hồi tài khoản truy cập hệ thống' },
      { key: 'settings.employees.reset_password', name: 'Đặt lại / Cấp lại mật khẩu nhân viên', description: 'Cấp lại mật khẩu mới cho tài khoản của nhân viên' },
      { key: 'settings.employees.export', name: 'Xuất danh sách nhân viên (Excel)', description: 'Tải file Excel toàn bộ dữ liệu nhân sự' },
      { key: 'settings.employees.import', name: 'Nhập dữ liệu nhân viên từ Excel', description: 'Tải lên danh sách nhân sự hàng loạt bằng file Excel' },
      { key: 'settings.rbac.view', name: 'Xem danh sách Vai trò & Ma trận quyền', description: 'Tra cứu danh sách vai trò hệ thống' },
      { key: 'settings.rbac.create', name: 'Thêm mới Vai trò người dùng', description: 'Tạo chức danh vai trò mới' },
      { key: 'settings.rbac.update', name: 'Chỉnh sửa Vai trò & Phân bổ quyền', description: 'Cập nhật các quyền hạn cho vai trò' },
      { key: 'settings.rbac.delete', name: 'Xóa Vai trò người dùng', description: 'Xóa vai trò không còn sử dụng' },
    ],
  },
];

const ALL_SYSTEM_PERMISSION_KEYS = PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.key));

export const INITIAL_ROLES: AdminRole[] = [
  {
    id: 'role_admin',
    code: 'SUPER_ADMIN',
    name: 'Quản trị viên tối cao',
    description: '',
    userCount: 2,
    isSystem: true,
    status: 'active',
    permissions: ALL_SYSTEM_PERMISSION_KEYS,
  },
];

export const INITIAL_COMPANY_INFO: AdminCompanyInfo = {
  code: 'D2LUXURY',
  companyName: 'CÔNG TY CỔ PHẦN NỘI THẤT CAO CẤP D2 LUXURY',
  brandName: 'D2 LUXURY - Nội Thất Gỗ Tự Nhiên',
  taxId: '0316888999',
  representative: 'Nguyễn Văn Luân',
  representativeRole: 'Tổng Giám Đốc',
  businessSector: 'Sản xuất & Thi công Nội thất cao cấp, Gỗ tự nhiên & May đo',
  phone: '0903 888 999',
  hotline: '1900 8899',
  email: 'contact@d2luxury.vn',
  website: 'https://d2luxury.vn',
  zalo: '0903888999',
  fanpage: 'fb.com/d2luxury',
  headquarters: 'Hà Nội & Nam Định',
  warehouseAddress: 'Tổng Kho D2 LUXURY',
  country: 'Việt Nam',
  province: 'Hà Nội',
  district: 'Nam Từ Liêm',
  ward: 'Mỹ Đình',
  logoUrl: '/logo.png',
  faviconUrl: null,
  stampUrl: null,
  status: true,
  accessUrl: 'https://admin.d2luxury.vn',
  expiredAt: '31/12/2026 23:59',
  receiptHeaderTitle: 'PHIẾU XUẤT BÁN HÀNG KIÊM BIÊN BẢN BÀN GIAO NỘI THẤT',
  receiptFooterNote: 'Cảm ơn Quý khách đã tin tưởng D2 LUXURY! Bảo hành chính hãng 05 năm.',
  showTaxOnReceipt: true,
  showHotlineOnReceipt: true,
  showQrOnReceipt: true,
};
