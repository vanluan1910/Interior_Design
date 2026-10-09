using InteriorDesign.Integration.Responses;

namespace InteriorDesign.Infrastructure.Data;

public static class PermissionCatalog
{
    public static List<PermissionGroupDto> GetPermissionGroups()
    {
        return new List<PermissionGroupDto>
        {
            new(
                GroupKey: "pos_orders",
                GroupName: "Đơn hàng & Bán hàng POS",
                GroupIcon: "🛒",
                SubGroups: new List<PermissionSubGroupDto>
                {
                    new(
                        SubKey: "orders_management",
                        SubName: "Quản lý Đơn hàng & Bán lẻ",
                        Permissions: new List<PermissionDefinitionDto>
                        {
                            new("orders.view", "Xem danh sách đơn hàng POS", "Tra cứu và lọc đơn hàng theo trạng thái, khách hàng, ngày tạo"),
                            new("orders.create", "Tạo mới đơn hàng POS & Bán lẻ", "Tạo đơn hàng mới từ màn hình thu ngân và chốt đơn"),
                            new("orders.update", "Chỉnh sửa đơn hàng & Chiết khấu", "Sửa số lượng, đổi thông tin giao hàng, áp dụng giảm giá"),
                            new("orders.delete", "Hủy / Xóa đơn hàng", "Hủy đơn hàng chưa thanh toán hoặc xóa đơn nháp"),
                            new("orders.export", "Xuất danh sách đơn hàng (Excel)", "Tải báo cáo đơn hàng định dạng Excel"),
                            new("orders.print", "In hóa đơn & Phiếu giao hàng", "In phiếu thu, phiếu xuất kho giao hàng K80 / A4 / A5")
                        }
                    ),
                    new(
                        SubKey: "pos_checkout",
                        SubName: "Thu ngân & Thanh toán",
                        Permissions: new List<PermissionDefinitionDto>
                        {
                            new("pos.checkout.cash", "Thanh toán Tiền mặt", "Thu tiền mặt trực tiếp tại quầy"),
                            new("pos.checkout.bank", "Thanh toán Chuyển khoản / VietQR", "Tạo mã QR động và nhận tiền chuyển khoản MB Bank"),
                            new("pos.checkout.deposit", "Nhận cọc & Trả góp nội thất", "Thu tiền đặt cọc thi công và thanh toán theo từng đợt"),
                            new("pos.refund", "Hoàn tiền & Đổi trả sản phẩm", "Lập phiếu chi hoàn tiền cọc hoặc hủy đơn trả hàng")
                        }
                    )
                },
                Permissions: new List<PermissionDefinitionDto>
                {
                    new("orders.view", "Xem danh sách đơn hàng POS", "Tra cứu và lọc đơn hàng theo trạng thái, khách hàng, ngày tạo"),
                    new("orders.create", "Tạo mới đơn hàng POS & Bán lẻ", "Tạo đơn hàng mới từ màn hình thu ngân và chốt đơn"),
                    new("orders.update", "Chỉnh sửa đơn hàng & Chiết khấu", "Sửa số lượng, đổi thông tin giao hàng, áp dụng giảm giá"),
                    new("orders.delete", "Hủy / Xóa đơn hàng", "Hủy đơn hàng chưa thanh toán hoặc xóa đơn nháp"),
                    new("orders.export", "Xuất danh sách đơn hàng (Excel)", "Tải báo cáo đơn hàng định dạng Excel"),
                    new("orders.print", "In hóa đơn & Phiếu giao hàng", "In phiếu thu, phiếu xuất kho giao hàng K80 / A4 / A5"),
                    new("pos.checkout.cash", "Thanh toán Tiền mặt", "Thu tiền mặt trực tiếp tại quầy"),
                    new("pos.checkout.bank", "Thanh toán Chuyển khoản / VietQR", "Tạo mã QR động và nhận tiền chuyển khoản MB Bank"),
                    new("pos.checkout.deposit", "Nhận cọc & Trả góp nội thất", "Thu tiền đặt cọc thi công và thanh toán theo từng đợt"),
                    new("pos.refund", "Hoàn tiền & Đổi trả sản phẩm", "Lập phiếu chi hoàn tiền cọc hoặc hủy đơn trả hàng")
                }
            ),

            new(
                GroupKey: "inventory_warehouse",
                GroupName: "Kho hàng, Sản phẩm & Xuất nhập tồn",
                GroupIcon: "🏢",
                SubGroups: new List<PermissionSubGroupDto>
                {
                    new(
                        SubKey: "catalog_products",
                        SubName: "Danh mục Sản phẩm & Báo giá",
                        Permissions: new List<PermissionDefinitionDto>
                        {
                            new("catalog.products.view", "Xem danh mục sản phẩm & Báo giá", "Xem bảng giá, tồn kho tức thời và thông số kỹ thuật"),
                            new("catalog.products.create", "Thêm mới sản phẩm vào danh mục", "Thêm mẫu thiết kế mới vào catalog"),
                            new("catalog.products.update", "Chỉnh sửa giá bán & Ảnh render 3D", "Cập nhật hình ảnh render chi tiết, kích thước và chất liệu"),
                            new("catalog.products.delete", "Ẩn / Xóa sản phẩm khỏi danh mục", "Tạm ẩn hoặc xóa mẫu sản phẩm"),
                            new("catalog.products.export", "Xuất danh mục sản phẩm (Excel)", "Tải file Excel danh sách sản phẩm và giá niêm yết")
                        }
                    ),
                    new(
                        SubKey: "warehouses_list",
                        SubName: "Danh sách Kho hàng & Showroom",
                        Permissions: new List<PermissionDefinitionDto>
                        {
                            new("inventory.warehouses.view", "Xem danh sách kho hàng & Showroom", "Tra cứu danh sách kho và cơ sở"),
                            new("inventory.warehouses.create", "Thêm mới kho hàng & Showroom", "Tạo mới cơ sở kho hoặc showroom"),
                            new("inventory.warehouses.update", "Chỉnh sửa thông tin kho & Showroom", "Cập nhật sức chứa, địa chỉ, người quản lý kho"),
                            new("inventory.warehouses.delete", "Xóa / Đóng cửa kho & Showroom", "Ngừng hoạt động cơ sở kho hoặc showroom")
                        }
                    ),
                    new(
                        SubKey: "stock_imports_returns",
                        SubName: "Nhập kho & Xuất trả hàng",
                        Permissions: new List<PermissionDefinitionDto>
                        {
                            new("inventory.imports.view", "Xem danh sách phiếu nhập kho (#PN)", "Tra cứu phiếu nhập thành phẩm nội thất"),
                            new("inventory.imports.create", "Thêm mới phiếu nhập kho (#PN)", "Lập phiếu nhập sản phẩm nội thất từ nhà cung ứng"),
                            new("inventory.imports.update", "Chỉnh sửa phiếu nhập kho (#PN)", "Cập nhật số lượng, đơn giá phiếu nhập chưa chốt"),
                            new("inventory.returns.view", "Xem danh sách phiếu trả hàng (#TH)", "Tra cứu phiếu xuất trả hàng NCC"),
                            new("inventory.returns.create", "Thêm mới phiếu xuất trả hàng (#TH)", "Lập phiếu xuất trả hàng lỗi kỹ thuật"),
                            new("inventory.returns.update", "Chỉnh sửa phiếu xuất trả hàng (#TH)", "Cập nhật thông tin phiếu trả hàng chưa duyệt")
                        }
                    ),
                    new(
                        SubKey: "stock_audit_transfer",
                        SubName: "Kiểm kê & Cân bằng tồn kho",
                        Permissions: new List<PermissionDefinitionDto>
                        {
                            new("inventory.stocktake.view", "Xem danh sách phiếu kiểm kê (#KK)", "Tra cứu lịch sử các đợt kiểm đếm hàng"),
                            new("inventory.stocktake.create", "Thêm mới phiếu kiểm kê kho (#KK)", "Lập phiếu kiểm đếm số lượng tồn kho thực tế"),
                            new("inventory.stocktake.update", "Cập nhật & Cân bằng kiểm kê (#KK)", "Xác nhận chênh lệch và điều chỉnh tồn kho"),
                            new("inventory.history.view", "Xem lịch sử xuất nhập tồn (Thẻ kho)", "Tra cứu biến động số lượng xuất nhập theo từng mặt hàng")
                        }
                    )
                },
                Permissions: new List<PermissionDefinitionDto>
                {
                    new("catalog.products.view", "Xem danh mục sản phẩm & Báo giá", "Xem bảng giá, tồn kho tức thời và thông số kỹ thuật"),
                    new("catalog.products.create", "Thêm mới sản phẩm vào danh mục", "Thêm mẫu thiết kế mới vào catalog"),
                    new("catalog.products.update", "Chỉnh sửa giá bán & Ảnh render 3D", "Cập nhật hình ảnh render chi tiết, kích thước và chất liệu"),
                    new("catalog.products.delete", "Ẩn / Xóa sản phẩm khỏi danh mục", "Tạm ẩn hoặc xóa mẫu sản phẩm"),
                    new("catalog.products.export", "Xuất danh mục sản phẩm (Excel)", "Tải file Excel danh sách sản phẩm và giá niêm yết"),
                    new("inventory.warehouses.view", "Xem danh sách kho hàng & Showroom", "Tra cứu danh sách kho và cơ sở"),
                    new("inventory.warehouses.create", "Thêm mới kho hàng & Showroom", "Tạo mới cơ sở kho hoặc showroom"),
                    new("inventory.warehouses.update", "Chỉnh sửa thông tin kho & Showroom", "Cập nhật sức chứa, địa chỉ, người quản lý kho"),
                    new("inventory.warehouses.delete", "Xóa / Đóng cửa kho & Showroom", "Ngừng hoạt động cơ sở kho hoặc showroom"),
                    new("inventory.imports.view", "Xem danh sách phiếu nhập kho (#PN)", "Tra cứu phiếu nhập thành phẩm nội thất"),
                    new("inventory.imports.create", "Thêm mới phiếu nhập kho (#PN)", "Lập phiếu nhập sản phẩm nội thất từ nhà cung ứng"),
                    new("inventory.imports.update", "Chỉnh sửa phiếu nhập kho (#PN)", "Cập nhật số lượng, đơn giá phiếu nhập chưa chốt"),
                    new("inventory.returns.view", "Xem danh sách phiếu trả hàng (#TH)", "Tra cứu phiếu xuất trả hàng NCC"),
                    new("inventory.returns.create", "Thêm mới phiếu xuất trả hàng (#TH)", "Lập phiếu xuất trả hàng lỗi kỹ thuật"),
                    new("inventory.returns.update", "Chỉnh sửa phiếu xuất trả hàng (#TH)", "Cập nhật thông tin phiếu trả hàng chưa duyệt"),
                    new("inventory.stocktake.view", "Xem danh sách phiếu kiểm kê (#KK)", "Tra cứu lịch sử các đợt kiểm đếm hàng"),
                    new("inventory.stocktake.create", "Thêm mới phiếu kiểm kê kho (#KK)", "Lập phiếu kiểm đếm số lượng tồn kho thực tế"),
                    new("inventory.stocktake.update", "Cập nhật & Cân bằng kiểm kê (#KK)", "Xác nhận chênh lệch và điều chỉnh tồn kho"),
                    new("inventory.history.view", "Xem lịch sử xuất nhập tồn (Thẻ kho)", "Tra cứu biến động số lượng xuất nhập theo từng mặt hàng")
                }
            ),

            new(
                GroupKey: "categories_spaces",
                GroupName: "Danh mục & Không gian nội thất",
                GroupIcon: "📐",
                SubGroups: new List<PermissionSubGroupDto>
                {
                    new(
                        SubKey: "categories_mgmt",
                        SubName: "Nhóm Danh mục sản phẩm",
                        Permissions: new List<PermissionDefinitionDto>
                        {
                            new("catalog.categories.view", "Xem danh mục nhóm sản phẩm", "Xem danh sách Sofa, Bàn ăn, Giường, Tủ áo..."),
                            new("catalog.categories.create", "Thêm mới nhóm danh mục", "Tạo thêm danh mục sản phẩm mới"),
                            new("catalog.categories.update", "Chỉnh sửa nhóm danh mục", "Chỉnh sửa tên, mã, thứ tự hiển thị và ảnh đại diện"),
                            new("catalog.categories.delete", "Xóa nhóm danh mục", "Xóa nhóm danh mục khỏi hệ thống")
                        }
                    ),
                    new(
                        SubKey: "spaces_mgmt",
                        SubName: "Không gian kiến trúc 3D",
                        Permissions: new List<PermissionDefinitionDto>
                        {
                            new("catalog.spaces.view", "Xem danh sách không gian nội thất", "Tra cứu Phòng khách, Phòng ngủ, Phòng ăn, Penthouse..."),
                            new("catalog.spaces.create", "Thêm mới không gian thiết kế", "Tạo mới khu vực không gian trưng bày"),
                            new("catalog.spaces.update", "Chỉnh sửa không gian thiết kế", "Cập nhật ảnh banner, mô tả phong cách không gian"),
                            new("catalog.spaces.delete", "Xóa không gian thiết kế", "Xóa không gian khỏi hệ thống")
                        }
                    )
                },
                Permissions: new List<PermissionDefinitionDto>
                {
                    new("catalog.categories.view", "Xem danh mục nhóm sản phẩm", "Xem danh sách Sofa, Bàn ăn, Giường, Tủ áo..."),
                    new("catalog.categories.create", "Thêm mới nhóm danh mục", "Tạo thêm danh mục sản phẩm mới"),
                    new("catalog.categories.update", "Chỉnh sửa nhóm danh mục", "Chỉnh sửa tên, mã, thứ tự hiển thị và ảnh đại diện"),
                    new("catalog.categories.delete", "Xóa nhóm danh mục", "Xóa nhóm danh mục khỏi hệ thống"),
                    new("catalog.spaces.view", "Xem danh sách không gian nội thất", "Tra cứu Phòng khách, Phòng ngủ, Phòng ăn, Penthouse..."),
                    new("catalog.spaces.create", "Thêm mới không gian thiết kế", "Tạo mới khu vực không gian trưng bày"),
                    new("catalog.spaces.update", "Chỉnh sửa không gian thiết kế", "Cập nhật ảnh banner, mô tả phong cách không gian"),
                    new("catalog.spaces.delete", "Xóa không gian thiết kế", "Xóa không gian khỏi hệ thống")
                }
            ),

            new(
                GroupKey: "customers_consultations",
                GroupName: "Khách hàng & Tư vấn thiết kế",
                GroupIcon: "🏛️",
                SubGroups: new List<PermissionSubGroupDto>
                {
                    new(
                        SubKey: "customers_profiles",
                        SubName: "Hồ sơ khách hàng & Đối tác KTS",
                        Permissions: new List<PermissionDefinitionDto>
                        {
                            new("customers.profile.view", "Xem danh bạ gia chủ & Đối tác KTS", "Xem thông tin khách hàng VIP, gia chủ biệt thự, KTS liên kết"),
                            new("customers.profile.create", "Thêm mới hồ sơ gia chủ / đối tác", "Tạo mới thông tin khách hàng và công trình"),
                            new("customers.profile.update", "Chỉnh sửa thông tin, SĐT & Địa chỉ", "Cập nhật thông tin liên hệ và địa chỉ nhận hàng"),
                            new("customers.profile.delete", "Xóa hồ sơ khách hàng", "Xóa thông tin khách hàng khỏi hệ thống"),
                            new("customers.debt.view", "Xem công nợ khách hàng", "Tra cứu tổng chi tiêu, công nợ còn lại của gia chủ"),
                            new("customers.debt.update", "Cập nhật & Thu hồi công nợ gia chủ", "Ghi nhận thanh toán và cấn trừ công nợ khách hàng")
                        }
                    ),
                    new(
                        SubKey: "design_consultations",
                        SubName: "Yêu cầu tư vấn thiết kế 3D",
                        Permissions: new List<PermissionDefinitionDto>
                        {
                            new("customers.consult.view", "Xem danh sách đăng ký tư vấn 3D", "Xem các yêu cầu tư vấn thiết kế nội thất từ website"),
                            new("customers.consult.update", "Xử lý & Cập nhật trạng thái tư vấn 3D", "Cập nhật tiến độ liên hệ, khảo sát hiện trạng mặt bằng")
                        }
                    )
                },
                Permissions: new List<PermissionDefinitionDto>
                {
                    new("customers.profile.view", "Xem danh bạ gia chủ & Đối tác KTS", "Xem thông tin khách hàng VIP, gia chủ biệt thự, KTS liên kết"),
                    new("customers.profile.create", "Thêm mới hồ sơ gia chủ / đối tác", "Tạo mới thông tin khách hàng và công trình"),
                    new("customers.profile.update", "Chỉnh sửa thông tin, SĐT & Địa chỉ", "Cập nhật thông tin liên hệ và địa chỉ nhận hàng"),
                    new("customers.profile.delete", "Xóa hồ sơ khách hàng", "Xóa thông tin khách hàng khỏi hệ thống"),
                    new("customers.debt.view", "Xem công nợ khách hàng", "Tra cứu tổng chi tiêu, công nợ còn lại của gia chủ"),
                    new("customers.debt.update", "Cập nhật & Thu hồi công nợ gia chủ", "Ghi nhận thanh toán và cấn trừ công nợ khách hàng"),
                    new("customers.consult.view", "Xem danh sách đăng ký tư vấn 3D", "Xem các yêu cầu tư vấn thiết kế nội thất từ website"),
                    new("customers.consult.update", "Xử lý & Cập nhật trạng thái tư vấn 3D", "Cập nhật tiến độ liên hệ, khảo sát hiện trạng mặt bằng")
                }
            ),

            new(
                GroupKey: "suppliers_procurement",
                GroupName: "Nhà cung cấp & Vật tư",
                GroupIcon: "🤝",
                SubGroups: new List<PermissionSubGroupDto>
                {
                    new(
                        SubKey: "suppliers_master",
                        SubName: "Danh bạ nhà cung cấp vật tư",
                        Permissions: new List<PermissionDefinitionDto>
                        {
                            new("suppliers.vendors.view", "Xem danh sách nhà cung cấp", "Tra cứu đối tác cung cấp gỗ FAS, da Mastrotto, phụ kiện"),
                            new("suppliers.vendors.create", "Thêm mới đối tác cung ứng", "Tạo mới hồ sơ nhà cung cấp"),
                            new("suppliers.vendors.update", "Chỉnh sửa thông tin NCC & Tài khoản", "Cập nhật thông tin liên hệ và thanh toán của đối tác"),
                            new("suppliers.vendors.delete", "Xóa nhà cung cấp", "Xóa nhà cung cấp không còn giao dịch")
                        }
                    ),
                    new(
                        SubKey: "suppliers_finance",
                        SubName: "Công nợ nhà cung cấp",
                        Permissions: new List<PermissionDefinitionDto>
                        {
                            new("suppliers.debt.view", "Xem công nợ phải trả nhà cung cấp", "Đối soát công nợ gối đầu tiền vật tư"),
                            new("suppliers.debt.update", "Cập nhật & Đối chiếu công nợ NCC", "Ghi nhận cấn trừ và thanh toán công nợ")
                        }
                    )
                },
                Permissions: new List<PermissionDefinitionDto>
                {
                    new("suppliers.vendors.view", "Xem danh sách nhà cung cấp", "Tra cứu đối tác cung cấp gỗ FAS, da Mastrotto, phụ kiện"),
                    new("suppliers.vendors.create", "Thêm mới đối tác cung ứng", "Tạo mới hồ sơ nhà cung cấp"),
                    new("suppliers.vendors.update", "Chỉnh sửa thông tin NCC & Tài khoản", "Cập nhật thông tin liên hệ và thanh toán của đối tác"),
                    new("suppliers.vendors.delete", "Xóa nhà cung cấp", "Xóa nhà cung cấp không còn giao dịch"),
                    new("suppliers.debt.view", "Xem công nợ phải trả nhà cung cấp", "Đối soát công nợ gối đầu tiền vật tư"),
                    new("suppliers.debt.update", "Cập nhật & Đối chiếu công nợ NCC", "Ghi nhận cấn trừ và thanh toán công nợ")
                }
            ),

            new(
                GroupKey: "system_settings",
                GroupName: "Cài đặt hệ thống & Bảo mật RBAC",
                GroupIcon: "⚙️",
                SubGroups: new List<PermissionSubGroupDto>
                {
                    new(
                        SubKey: "company_payment_settings",
                        SubName: "Thông tin công ty & Thanh toán VietQR",
                        Permissions: new List<PermissionDefinitionDto>
                        {
                            new("settings.brand.view", "Xem hồ sơ thương hiệu", "Xem thông tin công ty, địa chỉ và mã số thuế"),
                            new("settings.brand.update", "Chỉnh sửa thông tin công ty & Logo", "Cập nhật thông tin pháp nhân, thương hiệu"),
                            new("settings.payment.view", "Xem cấu hình tài khoản MB Bank & VietQR", "Tra cứu thông tin tài khoản nhận tiền"),
                            new("settings.payment.update", "Chỉnh sửa tài khoản MB Bank & Mã VietQR", "Thiết lập tài khoản nhận tiền cọc và cú pháp VietQR")
                        }
                    ),
                    new(
                        SubKey: "print_templates_settings",
                        SubName: "Quản lý Mẫu phiếu in & Hóa đơn",
                        Permissions: new List<PermissionDefinitionDto>
                        {
                            new("settings.print.view", "Xem danh sách mẫu in & Xem trước", "Xem trước các mẫu hóa đơn K80/A4/A5, phiếu giao hàng, phiếu kho"),
                            new("settings.print.update", "Chỉnh sửa cấu hình & Ghi chú mẫu in", "Tùy biến logo, mã VietQR, ghi chú bảo hành chân trang trên mẫu in"),
                            new("settings.print.reset", "Khôi phục mẫu in gốc mặc định", "Khôi phục các mẫu in hệ thống về trạng thái tiêu chuẩn ban đầu")
                        }
                    ),
                    new(
                        SubKey: "branches_settings",
                        SubName: "Quản lý Chi nhánh & Cơ sở",
                        Permissions: new List<PermissionDefinitionDto>
                        {
                            new("settings.branches.view", "Xem danh sách Chi nhánh & Showroom", "Tra cứu các cơ sở chi nhánh"),
                            new("settings.branches.create", "Thêm mới Chi nhánh / Showroom", "Tạo cơ sở chi nhánh mới"),
                            new("settings.branches.update", "Chỉnh sửa thông tin Chi nhánh / Showroom", "Cập nhật địa chỉ, quản lý, diện tích"),
                            new("settings.branches.delete", "Xóa Chi nhánh / Showroom", "Xóa cơ sở chi nhánh")
                        }
                    ),
                    new(
                        SubKey: "uom_settings",
                        SubName: "Quản lý Đơn vị tính (UOM)",
                        Permissions: new List<PermissionDefinitionDto>
                        {
                            new("settings.uom.view", "Xem danh sách Đơn vị tính (UOM)", "Tra cứu danh mục đơn vị tính"),
                            new("settings.uom.create", "Thêm mới Đơn vị tính (UOM)", "Tạo đơn vị tính m³, m², bộ, chiếc..."),
                            new("settings.uom.update", "Chỉnh sửa Đơn vị tính (UOM)", "Cập nhật tên, mã, mô tả đơn vị tính"),
                            new("settings.uom.delete", "Xóa Đơn vị tính (UOM)", "Xóa đơn vị tính không dùng")
                        }
                    ),
                    new(
                        SubKey: "employees_settings",
                        SubName: "Quản lý Nhân sự & Tài khoản",
                        Permissions: new List<PermissionDefinitionDto>
                        {
                            new("settings.employees.view", "Xem danh sách nhân sự & tài khoản", "Tra cứu danh sách hồ sơ nhân viên, phòng ban và chi nhánh"),
                            new("settings.employees.create", "Thêm mới hồ sơ nhân viên", "Tạo mới hồ sơ nhân sự và cấp tài khoản đăng nhập"),
                            new("settings.employees.update", "Chỉnh sửa thông tin nhân sự", "Cập nhật lý lịch, chức danh, phòng ban, đổi trạng thái làm việc"),
                            new("settings.employees.delete", "Xóa hồ sơ nhân viên", "Xóa nhân sự và thu hồi tài khoản truy cập hệ thống"),
                            new("settings.employees.reset_password", "Đặt lại / Cấp lại mật khẩu nhân viên", "Cấp lại mật khẩu mới cho tài khoản của nhân viên"),
                            new("settings.employees.export", "Xuất danh sách nhân viên (Excel)", "Tải file Excel toàn bộ dữ liệu nhân sự"),
                            new("settings.employees.import", "Nhập dữ liệu nhân viên từ Excel", "Tải lên danh sách nhân sự hàng loạt bằng file Excel")
                        }
                    ),
                    new(
                        SubKey: "rbac_settings",
                        SubName: "Ma trận Phân quyền & Vai trò (RBAC)",
                        Permissions: new List<PermissionDefinitionDto>
                        {
                            new("settings.rbac.view", "Xem danh sách Vai trò & Ma trận quyền", "Tra cứu danh sách vai trò hệ thống"),
                            new("settings.rbac.create", "Thêm mới Vai trò người dùng", "Tạo chức danh vai trò mới"),
                            new("settings.rbac.update", "Chỉnh sửa Vai trò & Phân bổ quyền", "Cập nhật các quyền hạn cho vai trò"),
                            new("settings.rbac.delete", "Xóa Vai trò người dùng", "Xóa vai trò không còn sử dụng")
                        }
                    )
                },
                Permissions: new List<PermissionDefinitionDto>
                {
                    new("settings.brand.view", "Xem hồ sơ thương hiệu", "Xem thông tin công ty, địa chỉ và mã số thuế"),
                    new("settings.brand.update", "Chỉnh sửa thông tin công ty & Logo", "Cập nhật thông tin pháp nhân, thương hiệu"),
                    new("settings.payment.view", "Xem cấu hình tài khoản MB Bank & VietQR", "Tra cứu thông tin tài khoản nhận tiền"),
                    new("settings.payment.update", "Chỉnh sửa tài khoản MB Bank & Mã VietQR", "Thiết lập tài khoản nhận tiền cọc và cú pháp VietQR"),
                    new("settings.print.view", "Xem danh sách mẫu in & Xem trước", "Xem trước các mẫu hóa đơn K80/A4/A5, phiếu giao hàng, phiếu kho"),
                    new("settings.print.update", "Chỉnh sửa cấu hình & Ghi chú mẫu in", "Tùy biến logo, mã VietQR, ghi chú bảo hành chân trang trên mẫu in"),
                    new("settings.print.reset", "Khôi phục mẫu in gốc mặc định", "Khôi phục các mẫu in hệ thống về trạng thái tiêu chuẩn ban đầu"),
                    new("settings.branches.view", "Xem danh sách Chi nhánh & Showroom", "Tra cứu các cơ sở chi nhánh"),
                    new("settings.branches.create", "Thêm mới Chi nhánh / Showroom", "Tạo cơ sở chi nhánh mới"),
                    new("settings.branches.update", "Chỉnh sửa thông tin Chi nhánh / Showroom", "Cập nhật địa chỉ, quản lý, diện tích"),
                    new("settings.branches.delete", "Xóa Chi nhánh / Showroom", "Xóa cơ sở chi nhánh"),
                    new("settings.uom.view", "Xem danh sách Đơn vị tính (UOM)", "Tra cứu danh mục đơn vị tính"),
                    new("settings.uom.create", "Thêm mới Đơn vị tính (UOM)", "Tạo đơn vị tính m³, m², bộ, chiếc..."),
                    new("settings.uom.update", "Chỉnh sửa Đơn vị tính (UOM)", "Cập nhật tên, mã, mô tả đơn vị tính"),
                    new("settings.uom.delete", "Xóa Đơn vị tính (UOM)", "Xóa đơn vị tính không dùng"),
                    new("settings.employees.view", "Xem danh sách nhân sự & tài khoản", "Tra cứu danh sách hồ sơ nhân viên, phòng ban và chi nhánh"),
                    new("settings.employees.create", "Thêm mới hồ sơ nhân viên", "Tạo mới hồ sơ nhân sự và cấp tài khoản đăng nhập"),
                    new("settings.employees.update", "Chỉnh sửa thông tin nhân sự", "Cập nhật lý lịch, chức danh, phòng ban, đổi trạng thái làm việc"),
                    new("settings.employees.delete", "Xóa hồ sơ nhân viên", "Xóa nhân sự và thu hồi tài khoản truy cập hệ thống"),
                    new("settings.employees.reset_password", "Đặt lại / Cấp lại mật khẩu nhân viên", "Cấp lại mật khẩu mới cho tài khoản của nhân viên"),
                    new("settings.employees.export", "Xuất danh sách nhân viên (Excel)", "Tải file Excel toàn bộ dữ liệu nhân sự"),
                    new("settings.employees.import", "Nhập dữ liệu nhân viên từ Excel", "Tải lên danh sách nhân sự hàng loạt bằng file Excel"),
                    new("settings.rbac.view", "Xem danh sách Vai trò & Ma trận quyền", "Tra cứu danh sách vai trò hệ thống"),
                    new("settings.rbac.create", "Thêm mới Vai trò người dùng", "Tạo chức danh vai trò mới"),
                    new("settings.rbac.update", "Chỉnh sửa Vai trò & Phân bổ quyền", "Cập nhật các quyền hạn cho vai trò"),
                    new("settings.rbac.delete", "Xóa Vai trò người dùng", "Xóa vai trò không còn sử dụng")
                }
            )
        };
    }

    public static List<string> GetAllPermissionKeys()
    {
        return GetPermissionGroups()
            .SelectMany(g => g.Permissions.Select(p => p.Key))
            .Distinct()
            .ToList();
    }
}
