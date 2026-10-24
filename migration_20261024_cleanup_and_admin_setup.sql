-- ====================================================================
-- SCRIPT MIGRATION DATABASE: DỌN DẸP DỮ LIỆU & THIẾT LẬP TÀI KHOẢN ADMIN
-- Dự án: D2 LUXURY Interior Design Platform
-- Ngày cập nhật: 24/10/2026
-- Mô tả: 
--   1. Xóa sạch toàn bộ dữ liệu mẫu / dữ liệu nghiệp vụ cũ (Sản phẩm,
--      Đơn hàng, Khách hàng, Danh mục, Không gian, Chi nhánh, Kho hàng...).
--   2. Khởi tạo / cập nhật duy nhất 1 tài khoản quản trị tối cao:
--      - Tài khoản (Username): admin
--      - Email: admin@d2luxury.vn
--      - Mật khẩu: Admin@123 (mã hóa chuẩn BCrypt $2a$11$)
--      - Vai trò: Admin (Super Admin)
-- ====================================================================

USE [Interior_Design];
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

BEGIN TRANSACTION;

BEGIN TRY
    PRINT N'>>> [BẮT ĐẦU] Tiến trình dọn dẹp dữ liệu và thiết lập tài khoản Admin...';

    -- 1. Xóa chi tiết đơn hàng & đơn hàng
    IF OBJECT_ID('dbo.order_items', 'U') IS NOT NULL
    BEGIN
        DELETE FROM [dbo].[order_items];
        PRINT N'>>> [SUCCESS] Đã xóa toàn bộ dữ liệu bảng [order_items].';
    END

    IF OBJECT_ID('dbo.orders', 'U') IS NOT NULL
    BEGIN
        DELETE FROM [dbo].[orders];
        PRINT N'>>> [SUCCESS] Đã xóa toàn bộ dữ liệu bảng [orders].';
    END

    -- 2. Xóa sản phẩm & biến thể sản phẩm
    IF OBJECT_ID('dbo.ProductVariants', 'U') IS NOT NULL
    BEGIN
        DELETE FROM [dbo].[ProductVariants];
        PRINT N'>>> [SUCCESS] Đã xóa toàn bộ dữ liệu bảng [ProductVariants].';
    END

    IF OBJECT_ID('dbo.products', 'U') IS NOT NULL
    BEGIN
        DELETE FROM [dbo].[products];
        PRINT N'>>> [SUCCESS] Đã xóa toàn bộ dữ liệu bảng [products].';
    END

    -- 3. Xóa danh mục và không gian thiết kế
    IF OBJECT_ID('dbo.categories', 'U') IS NOT NULL
    BEGIN
        DELETE FROM [dbo].[categories];
        PRINT N'>>> [SUCCESS] Đã xóa toàn bộ dữ liệu bảng [categories].';
    END

    IF OBJECT_ID('dbo.spaces', 'U') IS NOT NULL
    BEGIN
        DELETE FROM [dbo].[spaces];
        PRINT N'>>> [SUCCESS] Đã xóa toàn bộ dữ liệu bảng [spaces].';
    END

    -- 4. Xóa phiếu đặt lịch tư vấn & khách hàng
    IF OBJECT_ID('dbo.consultation_bookings', 'U') IS NOT NULL
    BEGIN
        DELETE FROM [dbo].[consultation_bookings];
        PRINT N'>>> [SUCCESS] Đã xóa toàn bộ dữ liệu bảng [consultation_bookings].';
    END

    IF OBJECT_ID('dbo.customers', 'U') IS NOT NULL
    BEGIN
        DELETE FROM [dbo].[customers];
        PRINT N'>>> [SUCCESS] Đã xóa toàn bộ dữ liệu bảng [customers].';
    END

    -- 5. Xóa các phiếu nghiệp vụ kho & nhà cung cấp
    IF OBJECT_ID('dbo.stock_import_slips', 'U') IS NOT NULL
    BEGIN
        DELETE FROM [dbo].[stock_import_slips];
        PRINT N'>>> [SUCCESS] Đã xóa toàn bộ dữ liệu bảng [stock_import_slips].';
    END

    IF OBJECT_ID('dbo.stock_audit_slips', 'U') IS NOT NULL
    BEGIN
        DELETE FROM [dbo].[stock_audit_slips];
        PRINT N'>>> [SUCCESS] Đã xóa toàn bộ dữ liệu bảng [stock_audit_slips].';
    END

    IF OBJECT_ID('dbo.supplier_return_slips', 'U') IS NOT NULL
    BEGIN
        DELETE FROM [dbo].[supplier_return_slips];
        PRINT N'>>> [SUCCESS] Đã xóa toàn bộ dữ liệu bảng [supplier_return_slips].';
    END

    IF OBJECT_ID('dbo.suppliers', 'U') IS NOT NULL
    BEGIN
        DELETE FROM [dbo].[suppliers];
        PRINT N'>>> [SUCCESS] Đã xóa toàn bộ dữ liệu bảng [suppliers].';
    END

    -- 6. Xóa kho hàng và chi nhánh
    IF OBJECT_ID('dbo.warehouses', 'U') IS NOT NULL
    BEGIN
        DELETE FROM [dbo].[warehouses];
        PRINT N'>>> [SUCCESS] Đã xóa toàn bộ dữ liệu bảng [warehouses].';
    END

    IF OBJECT_ID('dbo.branches', 'U') IS NOT NULL
    BEGIN
        DELETE FROM [dbo].[branches];
        PRINT N'>>> [SUCCESS] Đã xóa toàn bộ dữ liệu bảng [branches].';
    END

    -- 7. Xóa nhân viên & đơn vị tính
    IF OBJECT_ID('dbo.employees', 'U') IS NOT NULL
    BEGIN
        DELETE FROM [dbo].[employees];
        PRINT N'>>> [SUCCESS] Đã xóa toàn bộ dữ liệu bảng [employees].';
    END

    IF OBJECT_ID('dbo.unit_of_measures', 'U') IS NOT NULL
    BEGIN
        DELETE FROM [dbo].[unit_of_measures];
        PRINT N'>>> [SUCCESS] Đã xóa toàn bộ dữ liệu bảng [unit_of_measures].';
    END

    -- 8. Thiết lập duy nhất 1 tài khoản Quản trị viên (Admin)
    PRINT N'>>> Đang cấu hình tài khoản Quản trị viên duy nhất...';
    
    -- Xóa tất cả tài khoản cũ khác
    DELETE FROM [dbo].[users] 
    WHERE Username <> 'admin' AND Email <> 'admin@d2luxury.vn';

    -- Chuỗi BCrypt hash cho mật khẩu "Admin@123" (work factor 11)
    DECLARE @adminHash NVARCHAR(255) = N'$2a$11$Srk96R5aA/m2wkjHj8xsyej6g/nPyAtwE6mnGEPG0//0Gsjf2R9fO';

    IF EXISTS (SELECT 1 FROM [dbo].[users] WHERE Username = 'admin' OR Email = 'admin@d2luxury.vn')
    BEGIN
        UPDATE [dbo].[users]
        SET 
            [FullName] = N'Quản trị viên',
            [Username] = 'admin',
            [Email] = 'admin@d2luxury.vn',
            [PhoneNumber] = '0900000000',
            [PasswordHash] = @adminHash,
            [Role] = 'Admin',
            [AvatarUrl] = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
            [IsActive] = 1,
            [UpdatedAt] = SYSDATETIMEOFFSET()
        WHERE Username = 'admin' OR Email = 'admin@d2luxury.vn';

        PRINT N'>>> [SUCCESS] Đã cập nhật mật khẩu và thông tin tài khoản [admin].';
    END
    ELSE
    BEGIN
        INSERT INTO [dbo].[users] (
            [Id], [FullName], [Email], [PhoneNumber], [PasswordHash], [Role], [AvatarUrl], [IsActive], [CreatedAt], [UpdatedAt], [Username]
        ) VALUES (
            'A1111111-1111-1111-1111-111111111111',
            N'Quản trị viên',
            'admin@d2luxury.vn',
            '0900000000',
            @adminHash,
            'Admin',
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
            1,
            SYSDATETIMEOFFSET(),
            SYSDATETIMEOFFSET(),
            'admin'
        );

        PRINT N'>>> [SUCCESS] Đã thêm mới tài khoản [admin] (Mật khẩu: Admin@123).';
    END

    -- 9. Đảm bảo vai trò Quản trị viên tối cao tồn tại trong roles
    IF OBJECT_ID('dbo.roles', 'U') IS NOT NULL
    BEGIN
        DELETE FROM [dbo].[roles] WHERE Name NOT LIKE '%Admin%' AND Name NOT LIKE N'%Quản trị%';
        
        IF NOT EXISTS (SELECT 1 FROM [dbo].[roles] WHERE Id = 'A1111111-1111-1111-1111-111111111111')
        BEGIN
            INSERT INTO [dbo].[roles] ([Id], [Name], [Code], [Description], [IsSystem], [Status], [Permissions], [IsDeleted], [CreatedAt], [UpdatedAt])
            VALUES (
                'A1111111-1111-1111-1111-111111111111',
                N'Quản trị viên tối cao (Super Admin)',
                'SUPER_ADMIN',
                N'Toàn quyền quản trị hệ thống, cấu hình RBAC và quản lý dữ liệu toàn diện.',
                1,
                'active',
                '["*"]',
                0,
                SYSDATETIMEOFFSET(),
                SYSDATETIMEOFFSET()
            );
        END
    END

    COMMIT TRANSACTION;
    PRINT N'>>> [HOÀN TẤT] Migration hoàn thành 100% thành công!';
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    PRINT N'>>> [LỖI] Có lỗi xảy ra trong quá trình migration: ' + ERROR_MESSAGE();
    THROW;
END CATCH
GO

-- 10. Báo cáo kiểm tra số lượng bản ghi sau migration
SELECT 
    t.name AS [TableName], 
    i.rows AS [RowCount]
FROM sys.tables t
JOIN sys.sysindexes i ON t.object_id = i.id
WHERE i.indid < 2 AND t.name <> '__EFMigrationsHistory'
ORDER BY [RowCount] DESC;
GO
