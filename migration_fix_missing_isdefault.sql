-- ====================================================================
-- SCRIPT MIGRATION: BỔ SUNG CỘT IsDefault CHO CÁC BẢNG TRÊN SERVER PRODUCTION
-- Dự án: D2 LUXURY Interior Design Platform
-- Ngày: 26/10/2026
-- Mô tả: Khắc phục triệt để lỗi "Invalid column name 'IsDefault'" khi gọi GET /api/home
-- ====================================================================

USE [Interior_Design];
GO

-- 1. Bổ sung cột IsDefault cho bảng branches nếu chưa có
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'branches')
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'branches' AND COLUMN_NAME = 'IsDefault')
    BEGIN
        ALTER TABLE [dbo].[branches] ADD [IsDefault] BIT NOT NULL CONSTRAINT DF_branches_IsDefault DEFAULT 0;
        PRINT N'>>> [SUCCESS] Đã thêm cột [IsDefault] vào bảng [branches].';
    END
    ELSE
    BEGIN
        PRINT N'>>> [INFO] Cột [IsDefault] đã có sẵn trong bảng [branches].';
    END
END
GO

-- 2. Bổ sung cột IsDefault cho bảng warehouses nếu chưa có
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'warehouses')
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'warehouses' AND COLUMN_NAME = 'IsDefault')
    BEGIN
        ALTER TABLE [dbo].[warehouses] ADD [IsDefault] BIT NOT NULL CONSTRAINT DF_warehouses_IsDefault DEFAULT 0;
        PRINT N'>>> [SUCCESS] Đã thêm cột [IsDefault] vào bảng [warehouses].';
    END
    ELSE
    BEGIN
        PRINT N'>>> [INFO] Cột [IsDefault] đã có sẵn trong bảng [warehouses].';
    END
END
GO

-- 3. Bổ sung cột IsDefault cho bảng unit_of_measures nếu chưa có
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'unit_of_measures')
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'unit_of_measures' AND COLUMN_NAME = 'IsDefault')
    BEGIN
        ALTER TABLE [dbo].[unit_of_measures] ADD [IsDefault] BIT NOT NULL CONSTRAINT DF_unit_of_measures_IsDefault DEFAULT 0;
        PRINT N'>>> [SUCCESS] Đã thêm cột [IsDefault] vào bảng [unit_of_measures].';
    END
    ELSE
    BEGIN
        PRINT N'>>> [INFO] Cột [IsDefault] đã có sẵn trong bảng [unit_of_measures].';
    END
END
GO
