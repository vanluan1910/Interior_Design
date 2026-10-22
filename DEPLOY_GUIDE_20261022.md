-- ====================================================================
-- SCRIPT MIGRATION DATABASE: CẬP NHẬT BẢNG [dbo].[orders]
-- Dự án: D2 LUXURY Interior Design Platform
-- Ngày cập nhật: 22/10/2026
-- Mô tả: Thêm 2 cột RecipientName và RecipientPhone để tách biệt
--       thông tin người nhận hàng với chủ tài khoản đặt hàng (công nợ).
-- ====================================================================

USE [Interior_Design];
GO

-- 1. Kiểm tra bảng orders và thêm cột RecipientName nếu chưa có
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'orders')
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'orders' AND COLUMN_NAME = 'RecipientName')
    BEGIN
        ALTER TABLE [dbo].[orders] ADD [RecipientName] NVARCHAR(255) NULL;
        PRINT N'>>> [SUCCESS] Đã thêm cột [RecipientName] NVARCHAR(255) NULL vào bảng [orders].';
    END
    ELSE
    BEGIN
        PRINT N'>>> [INFO] Cột [RecipientName] đã tồn tại trong bảng [orders].';
    END

    -- 2. Kiểm tra và thêm cột RecipientPhone nếu chưa có
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'orders' AND COLUMN_NAME = 'RecipientPhone')
    BEGIN
        ALTER TABLE [dbo].[orders] ADD [RecipientPhone] NVARCHAR(50) NULL;
        PRINT N'>>> [SUCCESS] Đã thêm cột [RecipientPhone] NVARCHAR(50) NULL vào bảng [orders].';
    END
    ELSE
    BEGIN
        PRINT N'>>> [INFO] Cột [RecipientPhone] đã tồn tại trong bảng [orders].';
    END
END
ELSE
BEGIN
    PRINT N'>>> [WARNING] Không tìm thấy bảng [orders]. Vui lòng kiểm tra lại tên cơ sở dữ liệu.';
END
GO

-- 3. Câu lệnh kiểm tra lại cấu trúc bảng orders sau khi chạy
SELECT 
    TABLE_NAME, 
    COLUMN_NAME, 
    DATA_TYPE, 
    CHARACTER_MAXIMUM_LENGTH, 
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'orders' 
  AND COLUMN_NAME IN ('RecipientName', 'RecipientPhone', 'CustomerName', 'CustomerPhone');
GO
