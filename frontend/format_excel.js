const ExcelJS = require('exceljs');

async function createComprehensiveReport() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Nguyễn Văn Luân';

  const borderDark = {
    top: { style: 'thin', color: { argb: 'FF555555' } },
    left: { style: 'thin', color: { argb: 'FF555555' } },
    bottom: { style: 'thin', color: { argb: 'FF555555' } },
    right: { style: 'thin', color: { argb: 'FF555555' } }
  };

  // ==========================================
  // SHEET 1: 1. Đánh giá chung
  // ==========================================
  const ws1 = wb.addWorksheet('1. Đánh giá chung', { views: [{ showGridLines: true }] });

  ws1.columns = [
    { key: 'col1', width: 8 },   // STT
    { key: 'col2', width: 38 },  // Mục tiêu
    { key: 'col3', width: 55 },  // Kết quả
    { key: 'col4', width: 15 },  // Tiến độ
    { key: 'col5', width: 22 },  // Đánh giá
    { key: 'col6', width: 55 },  // Ghi chú
    { key: 'col7', width: 26 }   // Mức độ
  ];

  // Row 1: Title
  ws1.mergeCells('A1:G1');
  const title1 = ws1.getCell('A1');
  title1.value = 'BẢN TỰ ĐÁNH GIÁ HIỆU QUẢ CÔNG VIỆC THÁNG 10/2026';
  title1.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  title1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } };
  title1.alignment = { horizontal: 'center', vertical: 'middle' };
  title1.border = borderDark;
  ws1.getRow(1).height = 42;

  // Row 2: Subtitle
  ws1.mergeCells('A2:G2');
  const sub1 = ws1.getCell('A2');
  sub1.value = 'Dự án: E-Commerce Quản trị Nội thất | GSI Advisory Website | Hỗ trợ Hệ thống Domaco CRM & Finova';
  sub1.font = { name: 'Calibri', size: 11.5, italic: true, bold: true, color: { argb: 'FF1F4E79' } };
  sub1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
  sub1.alignment = { horizontal: 'center', vertical: 'middle' };
  sub1.border = borderDark;
  ws1.getRow(2).height = 28;

  // Row 4: Section I Header
  ws1.mergeCells('A4:G4');
  const sec1 = ws1.getCell('A4');
  sec1.value = 'I. THÔNG TIN NHÂN SỰ & KỲ ĐÁNH GIÁ';
  sec1.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
  sec1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F5597' } };
  sec1.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  sec1.border = borderDark;
  ws1.getRow(4).height = 30;

  // Layout 6 ô thông tin
  const infoRows = [
    {
      l1: 'Họ và tên:', v1: 'Nguyễn Văn Luân',
      l2: 'Mã nhân sự:', v2: '1910',
      l3: 'Kỳ đánh giá:', v3: '15/09/2026 – 15/10/2026 (Tháng 10/2026)'
    },
    {
      l1: 'Vị trí:', v1: 'Fullstack Developer (.NET / Next.js / React)',
      l2: 'Phòng ban:', v2: 'Khối Kỹ thuật & Công nghệ',
      l3: 'Ngày lập báo cáo:', v3: '15/10/2026'
    },
    {
      l1: 'Dự án chính:', v1: 'Interior Design E-Commerce & GSI Advisory Website',
      l2: 'Quản lý trực tiếp:', v2: 'Hoàng Văn Thắng',
      l3: 'Tình trạng:', v3: 'Nhân viên chính thức'
    }
  ];

  infoRows.forEach((item, idx) => {
    const rowNum = 5 + idx;
    const r = ws1.getRow(rowNum);
    r.height = 32;

    ws1.mergeCells(`F${rowNum}:G${rowNum}`);

    r.getCell(1).value = item.l1;
    r.getCell(2).value = item.v1;
    r.getCell(3).value = item.l2;
    r.getCell(4).value = item.v2;
    r.getCell(5).value = item.l3;
    r.getCell(6).value = item.v3;

    for (let c = 1; c <= 7; c++) {
      const cell = r.getCell(c);
      cell.border = borderDark;
      cell.alignment = { vertical: 'middle', wrapText: true };
      if (c === 1 || c === 3 || c === 5) {
        cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF1F4E79' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F5F9' } };
        cell.alignment = { horizontal: 'right', vertical: 'middle', indent: 1 };
      } else {
        cell.font = { name: 'Calibri', size: 11, color: { argb: 'FF111111' } };
        cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
      }
    }
  });

  // Row 9: Section II Header
  ws1.mergeCells('A9:G9');
  const sec2 = ws1.getCell('A9');
  sec2.value = 'II. KẾT QUẢ THỰC HIỆN THEO MỤC TIÊU THÁNG (KPIS)';
  sec2.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
  sec2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F5597' } };
  sec2.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  sec2.border = borderDark;
  ws1.getRow(9).height = 30;

  // Row 10: KPI Table Headers
  const kpiHeaders = ['STT', 'Mục tiêu công việc tháng', 'Kết quả đầu ra chính (Key Deliverables)', 'Tiến độ', 'Đánh giá', 'Ghi chú thêm', 'Mức độ ảnh hưởng'];
  const r10 = ws1.getRow(10);
  r10.height = 34;
  kpiHeaders.forEach((h, i) => {
    const cell = r10.getCell(i + 1);
    cell.value = h;
    cell.font = { name: 'Calibri', size: 11.5, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF365F91' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = borderDark;
  });

  const kpiRows = [
    [
      1,
      'Phát triển Hệ thống Quản trị Admin Đa chi nhánh (Interior Design)',
      'Dashboard Overview, Quản lý Đơn hàng, Kho chi nhánh, Xưởng sản xuất (Nhập/Kiểm/Trả hàng), Khách hàng, Nhân viên, Mẫu in ấn',
      0.95,
      'Xuất sắc',
      'Chuyển đổi toàn diện từ Mock data sang Dynamic APIs Backend, sẵn sàng vận hành thực tế.',
      'Rất cao (Critical)'
    ],
    [
      2,
      'Xây dựng Nền tảng E-Commerce Bán lẻ Nội thất & Trải nghiệm 3D (Customer UI)',
      'Trang chủ, Hero 3D tương tác (Three.js), Danh mục & Chi tiết sản phẩm, Bộ lọc không gian & chất liệu gỗ, Giỏ hàng, Wishlist, Checkout VietQR',
      1.00,
      'Xuất sắc',
      'UI/UX sang trọng, hiệu ứng mượt mà, tích hợp thanh toán mã QR động VietQR tự sinh chính xác.',
      'Cao (High)'
    ],
    [
      3,
      'Phát triển & Tối ưu Hệ thống Backend API .NET 8/9 (Clean Architecture)',
      'RESTful APIs: Products, Orders, StockImports, StockAudits, SupplierReturns, Dashboard; Xử lý nghiệp vụ tách kho theo chi nhánh (BranchMatcher)',
      0.95,
      'Hoàn thành tốt',
      'Đảm bảo tính toàn vẹn dữ liệu giao dịch kho và đơn hàng, cấu trúc Clean Architecture chuẩn mực.',
      'Rất cao (Critical)'
    ],
    [
      4,
      'Phát triển Chuyên trang & Tối ưu Nền tảng GSI Advisory Website (gsi-website)',
      'Hoàn thiện các chuyên trang ngành (Semiconductors, Social Sector, Telecom, Travel & Aviation), Bộ Reusable Practice Components, Mega-menu Header & Footer hiện đại, Tối ưu hóa Image Caching & Deployment Vercel',
      1.00,
      'Xuất sắc',
      'Thực hiện 14+ commits trong tháng 10, hoàn thành và merge thành công 3 PRs (#5, #6, #8) cùng Lead Hoàng Văn Thắng; tối ưu nén ảnh và loại bỏ asset nặng giúp website tải mượt mà trên Vercel.',
      'Rất cao (Critical)'
    ],
    [
      5,
      'Hỗ trợ Phân hệ Đăng ký Ca & Lịch hẹn Khách hàng (Domaco CRM & Finova Core)',
      'Module TaskShiftRegistrationModule (UI + 100% Jest tests), EmployeeShiftsController & Repositories .NET, scripts migration DB & tài liệu deploy',
      1.00,
      'Vượt kỳ vọng',
      'Task hỗ trợ hoàn thành đúng hạn theo yêu cầu điều phối của Lead Hoàng Văn Thắng.',
      'Cao (High)'
    ]
  ];

  kpiRows.forEach((row, idx) => {
    const rowNum = 11 + idx;
    const r = ws1.getRow(rowNum);
    r.height = 58;
    row.forEach((val, colIdx) => {
      const cell = r.getCell(colIdx + 1);
      cell.value = val;
      cell.border = borderDark;
      cell.font = { name: 'Calibri', size: 11 };
      if (idx % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFC' } };
      }
      if (colIdx === 0) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { bold: true };
      } else if (colIdx === 1) {
        cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
        cell.font = { bold: true, color: { argb: 'FF1F4E79' } };
      } else if (colIdx === 2 || colIdx === 5) {
        cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
      } else if (colIdx === 3) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.numFmt = '0%';
        cell.font = { bold: true, color: { argb: 'FF006100' } };
      } else if (colIdx === 4) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { bold: true, color: { argb: 'FF006100' } };
      } else if (colIdx === 6) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { bold: true, color: val.includes('Critical') ? { argb: 'FFC00000' } : { argb: 'FFED7D31' } };
      }
    });
  });

  // Signatures
  const sigRowStart = 18;
  ws1.mergeCells(`B${sigRowStart}:C${sigRowStart}`);
  const sig1Title = ws1.getCell(`B${sigRowStart}`);
  sig1Title.value = 'NHÂN VIÊN TỰ ĐÁNH GIÁ';
  sig1Title.font = { name: 'Calibri', size: 11, bold: true };
  sig1Title.alignment = { horizontal: 'center', vertical: 'middle' };

  ws1.mergeCells(`E${sigRowStart}:G${sigRowStart}`);
  const sig2Title = ws1.getCell(`E${sigRowStart}`);
  sig2Title.value = 'QUẢN LÝ TRỰC TIẾP DUYỆT';
  sig2Title.font = { name: 'Calibri', size: 11, bold: true };
  sig2Title.alignment = { horizontal: 'center', vertical: 'middle' };

  ws1.mergeCells(`B${sigRowStart + 1}:C${sigRowStart + 1}`);
  const sig1Sub = ws1.getCell(`B${sigRowStart + 1}`);
  sig1Sub.value = '(Ký và ghi rõ họ tên)';
  sig1Sub.font = { name: 'Calibri', size: 10, italic: true };
  sig1Sub.alignment = { horizontal: 'center', vertical: 'middle' };

  ws1.mergeCells(`E${sigRowStart + 1}:G${sigRowStart + 1}`);
  const sig2Sub = ws1.getCell(`E${sigRowStart + 1}`);
  sig2Sub.value = '(Nhận xét, ký và ghi rõ họ tên)';
  sig2Sub.font = { name: 'Calibri', size: 10, italic: true };
  sig2Sub.alignment = { horizontal: 'center', vertical: 'middle' };

  const sigNameRow = sigRowStart + 4;
  ws1.mergeCells(`B${sigNameRow}:C${sigNameRow}`);
  const sig1Name = ws1.getCell(`B${sigNameRow}`);
  sig1Name.value = 'Nguyễn Văn Luân';
  sig1Name.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF1F4E79' } };
  sig1Name.alignment = { horizontal: 'center', vertical: 'middle' };

  ws1.mergeCells(`E${sigNameRow}:G${sigNameRow}`);
  const sig2Name = ws1.getCell(`E${sigNameRow}`);
  sig2Name.value = 'Hoàng Văn Thắng';
  sig2Name.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF1F4E79' } };
  sig2Name.alignment = { horizontal: 'center', vertical: 'middle' };

  // ==========================================
  // SHEET 2: 2. Chi tiết công việc
  // ==========================================
  const ws2 = wb.addWorksheet('2. Chi tiết công việc', { views: [{ showGridLines: true }] });
  ws2.columns = [
    { key: 'stt', width: 6 },
    { key: 'group', width: 28 },
    { key: 'feature', width: 44 },
    { key: 'module', width: 46 },
    { key: 'tech', width: 26 },
    { key: 'details', width: 64 },
    { key: 'status', width: 16 }
  ];

  ws2.mergeCells('A1:G1');
  const title2 = ws2.getCell('A1');
  title2.value = 'DANH SÁCH CHI TIẾT CÔNG VIỆC ĐÃ HOÀN THÀNH TRONG THÁNG (KÈM GSI ADVISORY)';
  title2.font = { name: 'Calibri', size: 15, bold: true, color: { argb: 'FFFFFFFF' } };
  title2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } };
  title2.alignment = { horizontal: 'center', vertical: 'middle' };
  title2.border = borderDark;
  ws2.getRow(1).height = 36;

  const sheet2Headers = ['STT', 'Nhóm công việc', 'Hạng mục / Tính năng', 'Module / Vị trí Code', 'Công nghệ', 'Chi tiết giải pháp & Kết quả đạt được', 'Trạng thái'];
  const r2_2 = ws2.getRow(2);
  r2_2.height = 32;
  sheet2Headers.forEach((h, i) => {
    const cell = r2_2.getCell(i + 1);
    cell.value = h;
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F5597' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = borderDark;
  });

  const tasks = [
    // --- 1. E-Commerce (Frontend) ---
    [1, 'E-Commerce (Frontend)', 'Hero 3D Section & Trải nghiệm tương tác sống động', 'frontend/src/components/Hero3DSection.tsx, Hero3DCanvas.tsx', 'Next.js, Three.js, React Three Fiber', 'Tích hợp mô hình 3D nội thất tương tác xoay, zoom, đổi góc nhìn; tối ưu frame rate và hiệu ứng chuyển động mượt mà.', 'Hoàn thành'],
    [2, 'E-Commerce (Frontend)', 'Bộ lọc Sản phẩm theo Không gian & Chất liệu gỗ', 'frontend/src/app/products, components/LivingSpaces.tsx', 'Next.js, Tailwind CSS', 'Hỗ trợ lọc linh hoạt theo phòng khách, phòng ngủ, phòng ăn và nhóm chất liệu gỗ tự nhiên (woodMaterials), phân trang chuẩn.', 'Hoàn thành'],
    [3, 'E-Commerce (Frontend)', 'Project Lookbook & Showroom Section', 'frontend/src/components/ProjectLookbook.tsx, ShowroomSection.tsx', 'Next.js, GSAP, Lenis', 'Xây dựng giao diện giới thiệu các dự án thiết kế nội thất thực tế, tích hợp cuộn mượt và xem nhanh chi tiết sản phẩm mẫu.', 'Hoàn thành'],
    [4, 'E-Commerce (Frontend)', 'Giỏ hàng, Wishlist & Thanh toán VietQR động', 'frontend/src/app/checkout, CartDrawer.tsx, VietQrCard.tsx', 'Next.js, TypeScript, QR API', 'Triển khai luồng đặt hàng hoàn chỉnh: kiểm tra tồn kho, chọn chi nhánh giao, tự động sinh mã VietQR chuyển khoản chính xác theo số tiền.', 'Hoàn thành'],

    // --- 2. Admin Quản trị (Vận hành) ---
    [5, 'Admin Quản trị (Vận hành)', 'Dashboard Tổng quan & Biểu đồ kinh doanh (Overview Tab)', 'frontend/src/components/admin/tabs/OverviewTab.tsx', 'Next.js, Ant Design, Dashboard API', 'Xây dựng màn hình thống kê doanh thu, đơn hàng, khách hàng mới, cảnh báo tồn kho; kết nối trực tiếp API Backend dynamic.', 'Hoàn thành'],
    [6, 'Admin Quản trị (Vận hành)', 'Quản lý Đơn hàng & Bộ công cụ in ấn (Orders Tab)', 'frontend/src/components/admin/tabs/OrdersTab.tsx, utils/printHelper.ts', 'Next.js, TypeScript', 'Quản lý danh sách đơn hàng, lọc theo trạng thái (Chờ duyệt, Đang giao, Đã giao); tích hợp mẫu in hóa đơn bán lẻ và phiếu xuất kho chuẩn.', 'Hoàn thành'],
    [7, 'Admin Quản trị (Vận hành)', 'Quản lý Kho hàng theo Chi nhánh (Inventory Tab)', 'frontend/src/components/admin/tabs/InventoryTab.tsx', 'Next.js, Ant Design', 'Theo dõi số lượng tồn kho thực tế của từng sản phẩm tại từng kho chi nhánh; cảnh báo hết hàng và hỗ trợ điều chỉnh số lượng tồn.', 'Hoàn thành'],
    [8, 'Admin Quản trị (Vận hành)', 'Quản lý Xưởng sản xuất: Nhập hàng NCC (Stock Import)', 'frontend/src/components/admin/tabs/workshop/StockImportCreate.tsx', 'Next.js, TypeScript, Form Antd', 'Triển khai giao diện tạo phiếu nhập kho từ nhà cung cấp, tự động tính tổng tiền nhập, thuế và cập nhật tăng số lượng tồn kho tức thì.', 'Hoàn thành'],
    [9, 'Admin Quản trị (Vận hành)', 'Quản lý Xưởng sản xuất: Kiểm kê kho (Stocktake)', 'frontend/src/components/admin/tabs/workshop/StocktakeCreate.tsx', 'Next.js, TypeScript', 'Xây dựng quy trình kiểm kê định kỳ, so khớp số lượng tồn hệ thống với thực tế kiểm đếm, tự động sinh phiếu điều chỉnh lệch kho.', 'Hoàn thành'],
    [10, 'Admin Quản trị (Vận hành)', 'Quản lý Xưởng sản xuất: Trả hàng NCC (Supplier Return)', 'frontend/src/components/admin/tabs/workshop/SupplierReturnCreate.tsx', 'Next.js, TypeScript', 'Xây dựng tính năng lập phiếu trả hàng lỗi/hỏng cho nhà cung cấp, tự động giảm trừ tồn kho và ghi nhận công nợ nhà cung cấp.', 'Hoàn thành'],
    [11, 'Admin Quản trị (Vận hành)', 'Quản lý Khách hàng, Nhân viên & Mẫu in ấn (Settings Tab)', 'frontend/src/components/admin/tabs/CustomersTab, EmployeesTab, SettingsTab', 'Next.js, TypeScript', 'Quản lý thông tin khách hàng, nhân viên theo chi nhánh; cấu hình mẫu in ấn tùy biến (PrintTemplatesSettings) cho xưởng và cửa hàng.', 'Hoàn thành'],

    // --- 3. Backend .NET (Dự án chính) ---
    [12, 'Backend .NET (Dự án chính)', 'Bộ RESTful API Core: Products, Orders & Dashboard', 'backend/src/InteriorDesign.Api/Controllers', '.NET 8/9, ASP.NET Core, Clean Arch', 'Viết mới và hoàn thiện ProductsController, OrdersController, DashboardController; chuẩn hóa DTOs, Validation và ExceptionMiddleware.', 'Hoàn thành'],
    [13, 'Backend .NET (Dự án chính)', 'Xử lý Logic Kho Đa Chi nhánh & Tồn kho (BranchMatcher)', 'backend/src/InteriorDesign.Infrastructure/Data/BranchMatcher.cs', 'C#, Repository Pattern', 'Xây dựng cơ chế mapping và xử lý dữ liệu đơn hàng / tồn kho linh hoạt theo mã chi nhánh, bảo đảm tính toàn vẹn dữ liệu giao dịch.', 'Hoàn thành'],
    [14, 'Backend .NET (Dự án chính)', 'Bộ Controller Giao dịch Kho: Nhập, Kiểm kê & Trả hàng', 'backend/src/InteriorDesign.Api/Controllers/Stock*.cs', 'C#, Clean Architecture', 'Hoàn thiện StockImportsController, StockAuditsController, SupplierReturnsController đáp ứng toàn bộ các luồng thao tác của xưởng sản xuất.', 'Hoàn thành'],
    [15, 'Backend .NET (Dự án chính)', 'Database Seeding sản phẩm thực tế từ Excel', 'backend/src/InteriorDesign.Infrastructure/Data/DatabaseInitializer.cs', 'C#, EF Core, Excel Reader', 'Xây dựng script tự động khởi tạo DB và import hàng trăm sản phẩm nội thất thực tế kèm phân loại chất liệu từ file Excel chuẩn.', 'Hoàn thành'],

    // --- 4. Website GSI Advisory (Thực hiện Tháng 10) ---
    [16, 'Website GSI Advisory', 'Chuyên trang Ngành Bán dẫn & Khối Xã hội (Semiconductors & Social Sector)', 'gsi-website/src/app/industries/semiconductors, social-sector', 'Next.js 14, TypeScript, Tailwind CSS', 'Xây dựng trọn bộ các trang chuyên đề: About, How We Help Clients, Our Insights, Our People, Contact Us; bố cục hiện đại theo chuẩn các hãng tư vấn quản trị quốc tế (McKinsey/BCG).', 'Hoàn thành'],
    [17, 'Website GSI Advisory', 'Chuyên trang Hàng không, Du lịch & Viễn thông (Travel, Aviation & Telecom)', 'gsi-website/src/app/industries/travel, telecommunications', 'Next.js, Framer Motion, TypeScript', 'Phát triển giao diện chuyên sâu The State of Aviation, lưới chuyên gia cấp cao (Our People), danh mục bài viết phân tích Insights và form liên hệ tư vấn chuyên ngành.', 'Hoàn thành'],
    [18, 'Website GSI Advisory', 'Thư viện Thành phần Dùng chung (Reusable Practice Components)', 'gsi-website/src/shared/components/practice/*', 'Next.js, React, Clean Architecture', 'Xây dựng và chuẩn hóa bộ component: EnhancedHeroBanner, AllInsightsGrid, OneUpMediumArticle, PracticeFactoidBanner, PracticeSectionHeader, PracticeSimplePromoBar, RelatedPracticesList giúp tái sử dụng nhất quán cho 15+ chuyên trang ngành.', 'Hoàn thành'],
    [19, 'Website GSI Advisory', 'Tái cấu trúc Layout Toàn hệ thống (Header & Modern Footer GSI)', 'gsi-website/src/shared/components/layout/Header.tsx, Footer.tsx', 'Next.js, Tailwind CSS, Responsive Design', 'Thiết kế lại Header đa tầng (Mega-menu điều hướng quốc tế), nâng cấp Footer hiện đại cho GSI Advisory; duy trì video spotlight section và xử lý mượt mà chuyển động cuộn trang (SmoothScroll).', 'Hoàn thành'],
    [20, 'Website GSI Advisory', 'Tối ưu Image Caching, Nén Tài nguyên & Vercel Deployment', 'gsi-website/src/app/what-we-do, PodcastSection.tsx, next.config.mjs', 'Next.js Image Opt, Vercel CI/CD', 'Cấu hình tối ưu Image Caching, bổ sung sizes prop cho Image fill trong Podcast & Insights để triệt tiêu layout shift, loại bỏ video nặng không cần thiết giúp giảm tải bundle size và build thành công 100% trên Vercel.', 'Hoàn thành'],
    [21, 'Website GSI Advisory', 'Phối hợp Nhánh & Đóng góp Code (Pull Requests #5, #6, #8)', 'Repository gsi-website (Branches: luannv/upadte_industries, luannv/update-services)', 'Git Flow, GitHub Pull Requests', 'Phối hợp trực tiếp với Tech Lead Hoàng Văn Thắng (Hoangthang194), tạo và hoàn thiện các PRs lớn cập nhật Services và Industries; xử lý triệt để các xung đột merge (HeroShowcase, Footer) bảo đảm nhánh chính luôn ổn định.', 'Hoàn thành'],

    // --- 5. Task Hỗ trợ (Domaco CRM & Finova Core) ---
    [22, 'Task Hỗ trợ (Domaco CRM)', 'Module Đăng ký Ca làm việc Nhân sự (TaskShiftRegistration)', 'Domaco_Accounting_CRM/src/modules/task/organization', 'React, JavaScript, Jest', 'Phát triển giao diện đăng ký ca làm việc, tích hợp dịch vụ shiftRegistrationService, bộ lọc phòng ban và viết 100% test case tự động.', 'Hoàn thành'],
    [23, 'Task Hỗ trợ (Domaco CRM)', 'Quản lý Lịch hẹn Khách hàng & Tối ưu Bộ lọc', 'Domaco_Accounting_CRM/src/modules/task/customers', 'React, JavaScript', 'Cải tiến trang CustomerAppointmentsPage, thêm CustomerAppointmentNotesDrawer ghi chú nhanh lịch hẹn, hỗ trợ preview import khách hàng.', 'Hoàn thành'],
    [24, 'Task Hỗ trợ (Finova Core)', 'Backend Quản lý Ca làm việc & Migration Cơ sở dữ liệu', 'Finova/src/Hosts/Task.Api, Modules/TaskManagement', '.NET 8, C#, SQL Server', 'Xây dựng EmployeeShiftsController, TaskEmployeeShiftRepository, viết file migration 20261014-deploy-task-db-changes.sql & tài liệu deploy.', 'Hoàn thành']
  ];

  tasks.forEach((row, idx) => {
    const rowNum = 3 + idx;
    const r = ws2.getRow(rowNum);
    r.height = 46;
    row.forEach((val, colIdx) => {
      const cell = r.getCell(colIdx + 1);
      cell.value = val;
      cell.border = borderDark;
      cell.font = { name: 'Calibri', size: 10.5 };
      if (idx % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFC' } };
      }
      if (colIdx === 0) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { bold: true };
      } else if (colIdx === 1) {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
        cell.font = { bold: true, color: val.includes('GSI') ? { argb: 'FF0070C0' } : (val.includes('Domaco') || val.includes('Finova')) ? { argb: 'FF7030A0' } : { argb: 'FF1F4E79' } };
      } else if (colIdx === 2) {
        cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
        cell.font = { bold: true };
      } else if (colIdx === 3) {
        cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
        cell.font = { name: 'Consolas', size: 9.5, color: { argb: 'FF555555' } };
      } else if (colIdx === 4) {
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      } else if (colIdx === 5) {
        cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
      } else if (colIdx === 6) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { bold: true, color: { argb: 'FF006100' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } };
      }
    });
  });

  // ==========================================
  // SHEET 3: 3. Kế hoạch tháng tới
  // ==========================================
  const ws3 = wb.addWorksheet('3. Kế hoạch tháng tới', { views: [{ showGridLines: true }] });
  ws3.columns = [
    { key: 'stt', width: 6 },
    { key: 'goal', width: 36 },
    { key: 'deliverable', width: 54 },
    { key: 'priority', width: 18 },
    { key: 'deadline', width: 24 },
    { key: 'collab', width: 24 },
    { key: 'risk', width: 50 }
  ];

  ws3.mergeCells('A1:G1');
  const title3 = ws3.getCell('A1');
  title3.value = 'MỤC TIÊU & KẾ HOẠCH HÀNH ĐỘNG THÁNG TIẾP THEO (NEXT MONTH)';
  title3.font = { name: 'Calibri', size: 15, bold: true, color: { argb: 'FFFFFFFF' } };
  title3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } };
  title3.alignment = { horizontal: 'center', vertical: 'middle' };
  title3.border = borderDark;
  ws3.getRow(1).height = 36;

  const sheet3Headers = ['STT', 'Mục tiêu trọng tâm', 'Kết quả đầu ra kỳ vọng (Deliverables)', 'Mức độ ưu tiên', 'Thời hạn dự kiến', 'Phối hợp thực hiện', 'Dự phòng rủi ro & Giải pháp'];
  const r3_2 = ws3.getRow(2);
  r3_2.height = 32;
  sheet3Headers.forEach((h, i) => {
    const cell = r3_2.getCell(i + 1);
    cell.value = h;
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F5597' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = borderDark;
  });

  const nextGoals = [
    [1, 'Tích hợp Cổng thanh toán Online & Webhook tự động (Interior Design)', 'Đấu nối cổng thanh toán VNPay / PayOS / MoMo tự động xác nhận đơn hàng khi khách chuyển khoản, giảm tải xác minh thủ công.', 'Cao (High)', '31/10/2026 (Tuần 2)', 'Backend & Frontend', 'Tạo webhook retry queue và ghi log đối soát tránh thất thoát đơn hàng.'],
    [2, 'Tối ưu Hiệu năng & Caching Danh mục Sản phẩm (Interior Design)', 'Áp dụng Redis Caching hoặc In-Memory Cache cho danh mục sản phẩm và dữ liệu trang chủ, giảm thời gian phản hồi API xuống <100ms.', 'Cao (High)', '07/11/2026 (Tuần 3)', 'Backend & DevOps', 'Kiểm thử tải đồng thời (load test) trước khi bật cache trên production.'],
    [3, 'Mở rộng Headless CMS & Tối ưu SEO cho Website GSI Advisory (gsi-website)', 'Đấu nối Headless CMS quản trị bài viết phân tích (Insights), tối ưu Schema.org, Open Graph metadata và sitemap động phục vụ chiến lược SEO quốc tế của GSI.', 'Cao (High)', '07/11/2026 (Tuần 3)', 'Frontend & Content Lead', 'Kiểm tra kỹ metadata fallback và Open Graph images tránh lỗi hiển thị khi chia sẻ link mạng xã hội.'],
    [4, 'Báo cáo Tài chính - Lợi nhuận chi tiết cho Admin (Interior Design)', 'Bổ sung màn hình báo cáo giá vốn hàng bán (COGS), biên lợi nhuận gộp theo từng chi nhánh và theo nhân viên kinh doanh.', 'Trung bình (Medium)', '15/11/2026 (Tuần 4)', 'Frontend & BA', 'Thống nhất công thức tính giá vốn xuất kho (FIFO / Bình quân gia quyền) với kế toán.'],
    [5, 'Mở rộng Bộ Test Tự động (Unit & Integration Tests)', 'Bổ sung bộ test tự động cho toàn bộ luồng tạo đơn hàng, trừ tồn kho và các modules chính của GSI Advisory để chống lỗi hồi quy.', 'Trung bình (Medium)', '15/11/2026 (Tuần 4)', 'Backend & QA Team', 'Viết mock repository và test suites tự động tích hợp trong CI/CD pipeline.']
  ];

  nextGoals.forEach((row, idx) => {
    const rowNum = 3 + idx;
    const r = ws3.getRow(rowNum);
    r.height = 48;
    row.forEach((val, colIdx) => {
      const cell = r.getCell(colIdx + 1);
      cell.value = val;
      cell.border = borderDark;
      cell.font = { name: 'Calibri', size: 10.5 };
      if (idx % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFC' } };
      }
      if (colIdx === 0) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { bold: true };
      } else if (colIdx === 1) {
        cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
        cell.font = { bold: true, color: { argb: 'FF1F4E79' } };
      } else if (colIdx === 2 || colIdx === 6) {
        cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
      } else if (colIdx === 3) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { bold: true, color: val.includes('High') ? { argb: 'FFC00000' } : { argb: 'FFED7D31' } };
      } else if (colIdx === 4 || colIdx === 5) {
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      }
    });
  });

  // Ghi đè vào các file liên quan để user sử dụng tiện lợi nhất
  const filesToSave = [
    'BAO_CAO_DANH_GIA_THANG_10_2026_NGUYEN_VAN_LUAN_CHINH_THUC.xlsx',
    'Ban_Danh_Gia_Cong_Viec_NguyenVanLuan_10.xlsx',
    'Ban_Danh_Gia_Cong_Viec_NguyenVanLuan_09.xlsx'
  ];

  for (const f of filesToSave) {
    await wb.xlsx.writeFile(f);
    console.log('Successfully saved to:', f);
  }
}

createComprehensiveReport().catch(err => {
  console.error(err);
  process.exit(1);
});
