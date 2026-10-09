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
    groupKey: 'overview_dashboard',
    groupName: 'Tổng quan & Báo cáo',
    groupIcon: '📊',
    subGroups: [
      {
        subKey: 'dashboard_stats',
        subName: 'Bảng điều khiển & Doanh thu',
        permissions: [
          { key: 'reports.overview.view', name: 'Xem bảng điều khiển tổng quan', description: 'Theo dõi doanh thu, tăng trưởng, đơn hàng may đo và tiến độ dự án' },
          { key: 'reports.overview.export', name: 'Xuất dữ liệu thống kê tổng quan (Excel)', description: 'Tải báo cáo số liệu tổng quan kinh doanh' },
          { key: 'reports.sales.performance', name: 'Xem báo cáo doanh số theo không gian & tháng', description: 'Phân tích doanh số phòng khách, phòng ăn, phòng ngủ' },
          { key: 'reports.staff.kpi', name: 'Xem báo cáo KPI & Hoa hồng của KTS', description: 'Thống kê hiệu suất tư vấn và hoa hồng dự án của đội ngũ KTS' },
        ],
      },
    ],
    permissions: [
      { key: 'reports.overview.view', name: 'Xem bảng điều khiển tổng quan', description: 'Theo dõi doanh thu, tăng trưởng, đơn hàng may đo và tiến độ dự án' },
      { key: 'reports.overview.export', name: 'Xuất dữ liệu thống kê tổng quan (Excel)', description: 'Tải báo cáo số liệu tổng quan kinh doanh' },
      { key: 'reports.sales.performance', name: 'Xem báo cáo doanh số theo không gian & tháng', description: 'Phân tích doanh số phòng khách, phòng ăn, phòng ngủ' },
      { key: 'reports.staff.kpi', name: 'Xem báo cáo KPI & Hoa hồng của KTS', description: 'Thống kê hiệu suất tư vấn và hoa hồng dự án của đội ngũ KTS' },
    ],
  },
  {
    groupKey: 'orders_management',
    groupName: 'Quản lý Đơn hàng',
    groupIcon: '🛒',
    subGroups: [
      {
        subKey: 'orders_processing',
        subName: 'Đơn may đo & Hợp đồng thi công',
        permissions: [
          { key: 'orders.custom.view', name: 'Xem danh sách đơn hàng may đo', description: 'Tra cứu đơn may đo, đơn sản xuất và tiến độ thực hiện' },
          { key: 'orders.custom.create', name: 'Thêm mới đơn may đo / sản xuất', description: 'Lập đơn đặt may đo theo bản vẽ thiết kế 3D cho gia chủ' },
          { key: 'orders.custom.update', name: 'Chỉnh sửa đơn hàng & Quy cách', description: 'Cập nhật quy cách gỗ óc chó, sồi, da Ý và tiến độ hoàn thiện' },
          { key: 'orders.custom.discount', name: 'Duyệt chiết khấu hợp đồng & Ưu đãi KTS', description: 'Áp dụng chiết khấu dự án giá trị lớn và hoa hồng KTS' },
          { key: 'orders.custom.delete', name: 'Hủy / Xóa đơn hàng may đo', description: 'Hủy đơn hàng khi khách thay đổi phương án' },
          { key: 'orders.custom.contract', name: 'In hợp đồng may đo & Biên bản bàn giao A4', description: 'In hợp đồng kinh tế và phiếu thu tiền cọc theo tiến độ' },
          { key: 'orders.custom.export', name: 'Xuất danh sách đơn hàng (Excel)', description: 'Tải file Excel danh sách đơn hàng và trạng thái thi công' },
        ],
      },
    ],
    permissions: [
      { key: 'orders.custom.view', name: 'Xem danh sách đơn hàng may đo', description: 'Tra cứu đơn may đo, đơn sản xuất và tiến độ thực hiện' },
      { key: 'orders.custom.create', name: 'Thêm mới đơn may đo / sản xuất', description: 'Lập đơn đặt may đo theo bản vẽ thiết kế 3D cho gia chủ' },
      { key: 'orders.custom.update', name: 'Chỉnh sửa đơn hàng & Quy cách', description: 'Cập nhật quy cách gỗ óc chó, sồi, da Ý và tiến độ hoàn thiện' },
      { key: 'orders.custom.discount', name: 'Duyệt chiết khấu hợp đồng & Ưu đãi KTS', description: 'Áp dụng chiết khấu dự án giá trị lớn và hoa hồng KTS' },
      { key: 'orders.custom.delete', name: 'Hủy / Xóa đơn hàng may đo', description: 'Hủy đơn hàng khi khách thay đổi phương án' },
      { key: 'orders.custom.contract', name: 'In hợp đồng may đo & Biên bản bàn giao A4', description: 'In hợp đồng kinh tế và phiếu thu tiền cọc theo tiến độ' },
      { key: 'orders.custom.export', name: 'Xuất danh sách đơn hàng (Excel)', description: 'Tải file Excel danh sách đơn hàng và trạng thái thi công' },
    ],
  },
  {
    groupKey: 'products_categories',
    groupName: 'Sản phẩm & Danh mục',
    groupIcon: '🪵',
    subGroups: [
      {
        subKey: 'products_catalog',
        subName: 'Danh mục sản phẩm hoàn thiện',
        permissions: [
          { key: 'catalog.products.view', name: 'Xem danh mục sản phẩm & Bộ sưu tập', description: 'Tra cứu danh sách sofa, bàn ghế, giường tủ và giá niêm yết' },
          { key: 'catalog.products.create', name: 'Thêm mới sản phẩm vào danh mục', description: 'Thêm mẫu thiết kế mới vào catalog' },
          { key: 'catalog.products.update', name: 'Chỉnh sửa giá bán & Ảnh render 3D', description: 'Cập nhật hình ảnh render chi tiết, kích thước và chất liệu' },
          { key: 'catalog.products.delete', name: 'Ẩn / Xóa sản phẩm khỏi danh mục', description: 'Tạm ẩn hoặc xóa mẫu sản phẩm' },
          { key: 'catalog.products.export', name: 'Xuất danh mục sản phẩm (Excel)', description: 'Tải file Excel danh sách sản phẩm và giá niêm yết' },
        ],
      },
      {
        subKey: 'categories_space',
        subName: 'Danh mục nhóm không gian',
        permissions: [
          { key: 'catalog.categories.view', name: 'Xem danh mục nhóm không gian', description: 'Xem danh sách Phòng khách, Phòng ăn, Phòng ngủ, Phòng làm việc' },
          { key: 'catalog.categories.create', name: 'Thêm mới nhóm không gian', description: 'Tạo thêm nhóm không gian nội thất mới' },
          { key: 'catalog.categories.update', name: 'Chỉnh sửa nhóm không gian', description: 'Chỉnh sửa tên, mã, thứ tự hiển thị và ảnh đại diện nhóm' },
          { key: 'catalog.categories.delete', name: 'Xóa nhóm không gian', description: 'Xóa nhóm không gian khỏi hệ thống' },
        ],
      },
    ],
    permissions: [
      { key: 'catalog.products.view', name: 'Xem danh mục sản phẩm & Bộ sưu tập', description: 'Tra cứu danh sách sofa, bàn ghế, giường tủ và giá niêm yết' },
      { key: 'catalog.products.create', name: 'Thêm mới sản phẩm vào danh mục', description: 'Thêm mẫu thiết kế mới vào catalog' },
      { key: 'catalog.products.update', name: 'Chỉnh sửa giá bán & Ảnh render 3D', description: 'Cập nhật hình ảnh render chi tiết, kích thước và chất liệu' },
      { key: 'catalog.products.delete', name: 'Ẩn / Xóa sản phẩm khỏi danh mục', description: 'Tạm ẩn hoặc xóa mẫu sản phẩm' },
      { key: 'catalog.products.export', name: 'Xuất danh mục sản phẩm (Excel)', description: 'Tải file Excel danh sách sản phẩm và giá niêm yết' },
      { key: 'catalog.categories.view', name: 'Xem danh mục nhóm không gian', description: 'Xem danh sách Phòng khách, Phòng ăn, Phòng ngủ, Phòng làm việc' },
      { key: 'catalog.categories.create', name: 'Thêm mới nhóm không gian', description: 'Tạo thêm nhóm không gian nội thất mới' },
      { key: 'catalog.categories.update', name: 'Chỉnh sửa nhóm không gian', description: 'Chỉnh sửa tên, mã, thứ tự hiển thị và ảnh đại diện nhóm' },
      { key: 'catalog.categories.delete', name: 'Xóa nhóm không gian', description: 'Xóa nhóm không gian khỏi hệ thống' },
    ],
  },
  {
    groupKey: 'warehouses_inventory',
    groupName: 'Kho hàng & Showroom',
    groupIcon: '🏢',
    subGroups: [
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
        subName: 'Kiểm kê, Điều chuyển & Thẻ kho',
        permissions: [
          { key: 'inventory.stocktake.view', name: 'Xem danh sách phiếu kiểm kê (#KK)', description: 'Tra cứu lịch sử các đợt kiểm đếm hàng' },
          { key: 'inventory.stocktake.create', name: 'Thêm mới phiếu kiểm kê kho (#KK)', description: 'Lập phiếu kiểm đếm số lượng tồn kho thực tế' },
          { key: 'inventory.stocktake.update', name: 'Cập nhật & Cân bằng kiểm kê (#KK)', description: 'Xác nhận chênh lệch và điều chỉnh tồn kho' },
          { key: 'inventory.transfer.view', name: 'Xem danh sách phiếu điều chuyển (#CK)', description: 'Tra cứu lịch sử luân chuyển hàng hóa' },
          { key: 'inventory.transfer.create', name: 'Thêm mới lệnh điều chuyển kho (#CK)', description: 'Lập phiếu điều chuyển giữa các kho và showroom' },
          { key: 'inventory.transfer.update', name: 'Cập nhật / Xác nhận điều chuyển (#CK)', description: 'Xác nhận xuất/nhập hàng đến cơ sở đích' },
          { key: 'inventory.history.view', name: 'Xem lịch sử xuất nhập tồn (Thẻ kho)', description: 'Tra cứu biến động số lượng xuất nhập theo từng mặt hàng' },
        ],
      },
    ],
    permissions: [
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
      { key: 'inventory.transfer.view', name: 'Xem danh sách phiếu điều chuyển (#CK)', description: 'Tra cứu lịch sử luân chuyển hàng hóa' },
      { key: 'inventory.transfer.create', name: 'Thêm mới lệnh điều chuyển kho (#CK)', description: 'Lập phiếu điều chuyển giữa các kho và showroom' },
      { key: 'inventory.transfer.update', name: 'Cập nhật / Xác nhận điều chuyển (#CK)', description: 'Xác nhận xuất/nhập hàng đến cơ sở đích' },
      { key: 'inventory.history.view', name: 'Xem lịch sử xuất nhập tồn (Thẻ kho)', description: 'Tra cứu biến động số lượng xuất nhập theo từng mặt hàng' },
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
        subName: 'Phiếu chi & Công nợ nhà cung cấp',
        permissions: [
          { key: 'suppliers.payments.view', name: 'Xem danh sách phiếu chi (#UNC, #PT)', description: 'Tra cứu phiếu chi tiền thanh toán cho nhà cung cấp' },
          { key: 'suppliers.payments.create', name: 'Thêm mới phiếu chi thanh toán (#UNC, #PT)', description: 'Lập phiếu thanh toán tiền hàng cho đối tác' },
          { key: 'suppliers.payments.update', name: 'Chỉnh sửa / Duyệt phiếu chi NCC', description: 'Cập nhật hoặc phê duyệt chi tiền' },
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
      { key: 'suppliers.payments.view', name: 'Xem danh sách phiếu chi (#UNC, #PT)', description: 'Tra cứu phiếu chi tiền thanh toán cho nhà cung cấp' },
      { key: 'suppliers.payments.create', name: 'Thêm mới phiếu chi thanh toán (#UNC, #PT)', description: 'Lập phiếu thanh toán tiền hàng cho đối tác' },
      { key: 'suppliers.payments.update', name: 'Chỉnh sửa / Duyệt phiếu chi NCC', description: 'Cập nhật hoặc phê duyệt chi tiền' },
      { key: 'suppliers.debt.view', name: 'Xem công nợ phải trả nhà cung cấp', description: 'Đối soát công nợ gối đầu tiền vật tư' },
      { key: 'suppliers.debt.update', name: 'Cập nhật & Đối chiếu công nợ NCC', description: 'Ghi nhận cấn trừ và thanh toán công nợ' },
    ],
  },
  {
    groupKey: 'system_settings',
    groupName: 'Cài đặt hệ thống',
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
        subName: 'Quản lý Nhân sự & Tài khoản POS',
        permissions: [
          { key: 'settings.employees.view', name: 'Xem danh sách nhân sự & tài khoản', description: 'Tra cứu danh sách hồ sơ nhân viên, phòng ban và chi nhánh' },
          { key: 'settings.employees.create', name: 'Thêm mới hồ sơ nhân viên', description: 'Tạo mới hồ sơ nhân sự và cấp tài khoản đăng nhập POS' },
          { key: 'settings.employees.update', name: 'Chỉnh sửa thông tin nhân sự', description: 'Cập nhật lý lịch, chức danh, phòng ban, đổi trạng thái làm việc' },
          { key: 'settings.employees.delete', name: 'Xóa hồ sơ nhân viên', description: 'Xóa nhân sự và thu hồi tài khoản truy cập hệ thống' },
          { key: 'settings.employees.reset_password', name: 'Đặt lại / Cấp lại mật khẩu nhân viên', description: 'Cấp lại mật khẩu mới cho tài khoản POS của nhân viên' },
          { key: 'settings.employees.export', name: 'Xuất danh sách nhân viên (Excel)', description: 'Tải file Excel toàn bộ dữ liệu nhân sự' },
          { key: 'settings.employees.import', name: 'Nhập dữ liệu nhân viên từ Excel', description: 'Tải lên danh sách nhân sự hàng loạt bằng file Excel' },
        ],
      },
      {
        subKey: 'rbac_settings',
        subName: 'Ma trận Phân quyền & Vai trò',
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
      { key: 'settings.employees.create', name: 'Thêm mới hồ sơ nhân viên', description: 'Tạo mới hồ sơ nhân sự và cấp tài khoản đăng nhập POS' },
      { key: 'settings.employees.update', name: 'Chỉnh sửa thông tin nhân sự', description: 'Cập nhật lý lịch, chức danh, phòng ban, đổi trạng thái làm việc' },
      { key: 'settings.employees.delete', name: 'Xóa hồ sơ nhân viên', description: 'Xóa nhân sự và thu hồi tài khoản truy cập hệ thống' },
      { key: 'settings.employees.reset_password', name: 'Đặt lại / Cấp lại mật khẩu nhân viên', description: 'Cấp lại mật khẩu mới cho tài khoản POS của nhân viên' },
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
