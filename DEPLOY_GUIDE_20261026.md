# 🚀 TÀI LIỆU HƯỚNG DẪN DEPLOY & DANH MỤC THAY ĐỔI
**Dự án**: D2 LUXURY Interior Design Platform  
**Ngày cập nhật**: 26/10/2026  
**Git Branch**: `luannv/finish`  
**Git Commit**: `70b81ce` (`perf(admin): optimize bundle size with dynamic imports, lazy loading, and memory caching`)  
**Môi trường áp dụng**: Staging / Production Server  

---

## I. TỔNG HỢP CÁC FILE ĐÃ THAY ĐỔI TRONG ĐỢT NÀY

### 1. Phân hệ Frontend (Next.js 16)
| Đường dẫn file | Nội dung thay đổi chính |
| :--- | :--- |
| `frontend/next.config.ts` | Bật `optimizePackageImports` cho `@ant-design/icons`, `antd`, `dayjs`, `lucide-react` để tối ưu Tree-shaking. |
| `frontend/src/app/admin/page.tsx` | Chuyển toàn bộ 8 Tab quản trị sang `dynamic()` Lazy Loading On-Demand; loại bỏ tải dư thừa `pageSize: 0`; cache dữ liệu tab bằng `loadedTabsRef`; tối ưu Polling 15s chống re-render giật lag. |
| `frontend/src/app/layout.tsx` | Thêm `preconnect` và `display=swap` cho phông chữ ngoại vi để khử hiện tượng Render-blocking lúc mở web. |
| `frontend/src/utils/exportExcel.ts` | Chuyển thư viện nặng `xlsx` sang Dynamic Import (`await import('xlsx')`), chỉ tải khi bấm nút xuất Excel. |
| `frontend/src/utils/adminStorage.ts` | Chuyển việc ghi đĩa `localStorage.setItem` sang macrotask không đồng bộ (`setTimeout`) để triệt tiêu hiện tượng đứng chuột (UI Jank). |
| `frontend/src/components/admin/tabs/InventoryTab.tsx` | Xóa bỏ `import * as XLSX from 'xlsx'` tĩnh; thêm `loading="lazy"` và `decoding="async"` cho thumbnail sản phẩm. |
| `frontend/src/components/admin/tabs/OrdersTab.tsx` | Thêm `loading="lazy"` và `decoding="async"` cho toàn bộ ảnh minh chứng thanh toán và ảnh chọn sản phẩm. |
| `frontend/src/components/admin/tabs/SuppliersTab.tsx` | Chuyển `xlsx` sang import động trong hàm đọc file nhập nhà cung cấp. |
| `frontend/src/components/admin/tabs/CategoriesTab.tsx` | Chuyển `xlsx` sang import động trong hàm nhập danh mục và xuất không gian; thêm lazy loading cho ảnh danh mục. |

### 2. Phân hệ Backend (.NET EF Core)
| Đường dẫn file | Nội dung thay đổi chính |
| :--- | :--- |
| `backend/.../Controllers/OrdersController.cs` | Tích hợp `IMemoryCache` (TTL 5 phút) lưu tạm danh sách Chi nhánh & Kho hàng khi lọc đơn hàng, giảm tải triệt để câu truy vấn thừa về SQL Server. |
| `backend/.../Controllers/ProductsController.cs` | Tối ưu hóa phân bổ tồn kho theo chi nhánh và định dạng giá trị. |
| `backend/.../Controllers/HomeController.cs` | Sửa các trường ánh xạ dữ liệu trang chủ, hỗ trợ cờ `IsDefault`. |
| `backend/.../Controllers/SpacesController.cs` | Đồng bộ dữ liệu không gian thiết kế chuẩn hóa tiếng Việt. |
| `backend/.../Repositories/InteriorRepository.cs` | Tối ưu truy vấn dữ liệu sản phẩm, không gian, liên kết danh mục. |

### 3. Database SQL Scripts & Kiểm thử
| Tên file | Mục đích sử dụng |
| :--- | :--- |
| `migration_fix_missing_isdefault.sql` | Bổ sung cột `IsDefault` vào các bảng `branches`, `warehouses`, `unit_of_measures` (chống lỗi 500 khi gọi `/api/home`). |
| `migration_20261026_fix_images_and_admin_text.sql` | Script chuẩn hóa chữ tiếng Việt có dấu chuẩn UTF-8 và đường dẫn ảnh sản phẩm cho 615 sản phẩm, 16 danh mục và 6 không gian. |
| `test_business_flows.js` | Kịch bản kiểm thử tự động 7 bước nghiệp vụ (Đặt hàng $\rightarrow$ Trừ kho $\rightarrow$ Hủy đơn $\rightarrow$ Nhập kho $\rightarrow$ Công nợ NCC $\rightarrow$ Trả hàng). |

---

## II. QUY TRÌNH DEPLOY TỪNG BƯỚC (STEP-BY-STEP)

### BƯỚC 1: CẬP NHẬT CƠ SỞ DỮ LIỆU (SQL SERVER)
> **Lưu ý**: Hãy sao lưu (Backup) Database `[Interior_Design]` trước khi chạy script.

1. Mở **SQL Server Management Studio (SSMS)** hoặc công cụ quản trị SQL trên Server.
2. Kết nối tới database `[Interior_Design]`.
3. Mở và thực thi lần lượt 2 file script sau:
   - **Script 1**: `migration_fix_missing_isdefault.sql` *(Đảm bảo các bảng có đầy đủ cột IsDefault)*
   - **Script 2**: `migration_20261026_fix_images_and_admin_text.sql` *(Sửa chữ tiếng Việt và chuẩn hóa ảnh 615 sản phẩm)*
4. Xác nhận thông báo `[HOÀN TẤT]` xuất hiện thành công không báo lỗi đỏ.

---

### BƯỚC 2: DEPLOY BACKEND API (.NET)

1. Mở Terminal trên Server tại thư mục dự án và kéo code mới:
   ```bash
   git fetch origin
   git checkout luannv/finish
   git pull origin luannv/finish
   ```

2. Biên dịch và đóng gói bản phát hành (Release):
   ```bash
   cd "backend/src/InteriorDesign.Api"
   dotnet publish -c Release -o ../../publish_output
   ```

3. Khởi động lại dịch vụ Backend:
   * **Nếu dùng Windows Server (IIS)**:
     - Mở IIS Manager $\rightarrow$ Chọn Application Pool của Backend $\rightarrow$ Bấm **Recycle** (hoặc restart Website).
   * **Nếu dùng Linux (Systemd Service)**:
     ```bash
     sudo systemctl restart kestrel-interiordesign.service
     ```
   * **Kiểm tra trạng thái**:
     Truy cập trình duyệt hoặc curl: `http://localhost:5000/api/home` $\rightarrow$ Trả về `{"success": true, ...}` là Backend đã sẵn sàng!

---

### BƯỚC 3: DEPLOY FRONTEND (NEXT.JS)

1. Di chuyển vào thư mục Frontend:
   ```bash
   cd ../../../frontend
   ```

2. Cài đặt các thư viện phụ thuộc (nếu có bổ sung):
   ```bash
   npm install --production=false
   ```

3. Đóng gói bản Production hoàn chỉnh:
   ```bash
   npm run build
   ```
   *(Xác nhận toàn bộ 20 route biên dịch thành công 100%, Exit Code 0).*

4. Khởi động lại ứng dụng:
   * **Nếu dùng PM2**:
     ```bash
     pm2 reload interior-frontend || pm2 start npm --name "interior-frontend" -- start
     ```
   * **Nếu dùng Windows Service / npm run start**:
     Khởi động lại process `npm run start` (hoặc `next start`).

---

### BƯỚC 4: KIỂM TRA NGHIỆM THU SAU KHI DEPLOY (VERIFICATION)

1. **Kiểm tra tự động toàn bộ luồng nghiệp vụ**:
   Tại thư mục gốc dự án, chạy lệnh:
   ```bash
   node test_business_flows.js
   ```
   *(Đảm bảo xuất hiện thông báo: `🎉 TẤT CẢ 7 BƯỚC KIỂM THỬ ĐÃ HOÀN TẤT VÀ CHÍNH XÁC 100%`).*

2. **Kiểm tra trực quan trên Trình duyệt**:
   * Truy cập: `https://ten-mien-cua-ban.com/admin`
   * Đăng nhập với tài khoản:
     - **Email**: `admin@d2luxury.vn`
     - **Mật khẩu**: `Admin@123`
   * **Xác nhận**:
     - Mở trang Admin tải nhanh dưới 1 giây.
     - Chuyển đổi qua lại giữa các tab: *Tổng quan, Đơn hàng, Sản phẩm, Mua hàng, Cài đặt* phản hồi ngay lập tức, không bị giật lag hay khựng giao diện.
     - Nút "Xuất Excel" và "Nhập Excel" ở các bảng hoạt động bình thường.
     - Trang chủ khách hàng hiển thị đủ 40 sản phẩm nổi bật kèm ảnh và chữ tiếng Việt không bị lỗi font.

---
**Người chuẩn bị**: AI Coding Assistant  
**Dự án**: D2 LUXURY Platform - Đã sẵn sàng golive!
