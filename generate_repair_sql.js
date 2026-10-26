const fs = require('fs');
const path = require('path');
const xlsx = require('./frontend/node_modules/xlsx');

function escapeSql(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/'/g, "''").trim();
}

console.log('>>> [1] Đang đọc file noithatgomay_products_cleaned.xlsx...');
const wb = xlsx.readFile('noithatgomay_products_cleaned.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const products = xlsx.utils.sheet_to_json(sheet);
console.log(`>>> Đã đọc thành công ${products.length} sản phẩm.`);

let sql = `-- ====================================================================
-- SCRIPT SỬA TOÀN BỘ LỖI FONT TIẾNG VIỆT TRONG DATABASE (UTF-8)
-- ====================================================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

USE [Interior_Design];
GO

PRINT N'>>> [1] Đang cập nhật lại bảng spaces...';
UPDATE [dbo].[spaces] SET [Name] = N'Phòng Khách', [Tagline] = N'Không Gian Sang Trọng', [Description] = N'Bộ sưu tập nội thất phòng khách gỗ tự nhiên cao cấp phong cách Japandi & Wabi-Sabi tinh tế.' WHERE [Code] = 'KG01';
UPDATE [dbo].[spaces] SET [Name] = N'Phòng Ăn', [Tagline] = N'Gắn Kết Yêu Thương', [Description] = N'Bàn ghế ăn gỗ tự nhiên nguyên tấm kiến tạo không gian sum vầy ấm cúng.' WHERE [Code] = 'KG02';
UPDATE [dbo].[spaces] SET [Name] = N'Phòng Làm Việc', [Tagline] = N'Khơi Nguồn Sáng Tạo', [Description] = N'Nội thất làm việc tĩnh tại, tối giản khơi nguồn cảm hứng sáng tạo vô tận.' WHERE [Code] = 'KG03';
UPDATE [dbo].[spaces] SET [Name] = N'Phòng Ngủ', [Tagline] = N'Chốn Về Bình Yên', [Description] = N'Không gian nghỉ ngơi an yên, thanh lọc tâm hồn với chất mộc tự nhiên thuần khiết.' WHERE [Code] = 'KG04';
UPDATE [dbo].[spaces] SET [Name] = N'Sản Phẩm Khác', [Tagline] = N'Tuyệt Tác Thủ Công', [Description] = N'Các tuyệt tác nội thất thủ công may đo cao cấp đa dạng không gian sống.' WHERE [Code] = 'KG05';
UPDATE [dbo].[spaces] SET [Name] = N'Sản Phẩm Khác', [Tagline] = N'Decor Tinh Tế', [Description] = N'Bộ sưu tập đồ nội thất và decor thủ công chế tác tỉ mỉ.' WHERE [Code] = 'KG06';
GO

PRINT N'>>> [2] Đang cập nhật lại bảng categories...';
UPDATE [dbo].[categories] SET [Name] = N'Bàn Ăn Gỗ Mây' WHERE [Code] = 'NH01';
UPDATE [dbo].[categories] SET [Name] = N'Giường Ngủ' WHERE [Code] = 'NH02';
UPDATE [dbo].[categories] SET [Name] = N'Bàn Trang Điểm' WHERE [Code] = 'NH03';
UPDATE [dbo].[categories] SET [Name] = N'Tủ Chạn Ly' WHERE [Code] = 'NH04';
UPDATE [dbo].[categories] SET [Name] = N'Tủ Giày' WHERE [Code] = 'NH05';
UPDATE [dbo].[categories] SET [Name] = N'Tủ Quần Áo' WHERE [Code] = 'NH06';
UPDATE [dbo].[categories] SET [Name] = N'Ghế Ăn Gỗ Mây' WHERE [Code] = 'NH07';
UPDATE [dbo].[categories] SET [Name] = N'Bàn Làm Việc' WHERE [Code] = 'NH08';
UPDATE [dbo].[categories] SET [Name] = N'Sofa Gỗ Mây' WHERE [Code] = 'NH09';
UPDATE [dbo].[categories] SET [Name] = N'Táp Đầu Giường' WHERE [Code] = 'NH10';
UPDATE [dbo].[categories] SET [Name] = N'Kệ Trang Trí' WHERE [Code] = 'NH12';
UPDATE [dbo].[categories] SET [Name] = N'Bàn Trà – Bàn Nước' WHERE [Code] = 'NH14';
UPDATE [dbo].[categories] SET [Name] = N'Ghế Mây' WHERE [Code] = 'NH16';
UPDATE [dbo].[categories] SET [Name] = N'Kệ Tivi' WHERE [Code] = 'NH17';
UPDATE [dbo].[categories] SET [Name] = N'Tủ Sách' WHERE [Code] = 'NH18';
UPDATE [dbo].[categories] SET [Name] = N'Tủ Góc' WHERE [Code] = 'NH19';
GO

PRINT N'>>> [3] Đang cập nhật lại bảng branches...';
UPDATE [dbo].[branches] SET [Name] = N'Showroom Phú Quốc - Trụ sở chính', [Address] = N'Ngã 4 Cửa Cạn, Đặc khu Phú Quốc, tỉnh Kiên Giang' WHERE [Code] = 'D2L-PQ01';
UPDATE [dbo].[branches] SET [Name] = N'Chi nhánh Hà Nội', [Address] = N'Khu đô thị Starlake, Tây Hồ Tây, Hà Nội' WHERE [Code] = 'D2L-HN01';
UPDATE [dbo].[branches] SET [Name] = N'Chi nhánh TP. Hồ Chí Minh', [Address] = N'Khu đô thị Sala, TP. Thủ Đức, TP. Hồ Chí Minh' WHERE [Code] = 'D2L-HCM01';
GO

PRINT N'>>> [4] Đang cập nhật lại bảng store_settings...';
UPDATE [dbo].[store_settings] SET [StoreName] = N'CÔNG TY CỔ PHẦN NỘI THẤT CAO CẤP D2 LUXURY', [Address] = N'Ngã 4 Cửa Cạn, Đặc khu Phú Quốc, tỉnh Kiên Giang';
GO

PRINT N'>>> [5] Đang cập nhật lại toàn bộ 615 sản phẩm...';
`;

for (const p of products) {
  const sku = escapeSql(p['Mã SKU']);
  if (!sku) continue;

  const name = escapeSql(p['Tên sản phẩm']);
  const space = escapeSql(p['Không gian']);
  const dimensions = escapeSql(p['Kích thước']);
  const woodType = escapeSql(p['Chất liệu']);
  const color = escapeSql(p['Màu sắc / Màu sơn']);
  const warranty = escapeSql(p['Bảo hành']);
  const delivery = escapeSql(p['Giao hàng / Lắp đặt']);
  const desc = escapeSql(p['Mô tả chi tiết']);

  sql += `UPDATE [dbo].[products] SET [Name] = N'${name}', [Space] = N'${space}', [Dimensions] = N'${dimensions}', [WoodType] = N'${woodType}', [Material] = N'${woodType}', [Color] = N'${color}', [Warranty] = N'${warranty}', [ShippingNote] = N'${delivery}', [Description] = N'${desc}' WHERE [Sku] = '${sku}';\n`;
}

sql += `
GO
PRINT N'>>> [HOÀN THÀNH] Đã phục hồi 100% tiếng Việt chuẩn xác cho toàn bộ hệ thống!';
`;

const bom = Buffer.from([0xEF, 0xBB, 0xBF]);
const fullBuffer = Buffer.concat([bom, Buffer.from(sql, 'utf8')]);
fs.writeFileSync('repair_all_vietnamese.sql', fullBuffer);
console.log('>>> Đã ghi file repair_all_vietnamese.sql thành công với UTF-8 BOM.');
