-- ==============================================================================
-- MIGRATION SCRIPT: XÓA SẠCH DỮ LIỆU SẢN PHẨM & DANH MỤC
-- Thời gian tạo: 2026-10-24
-- Mục đích: Dọn sạch toàn bộ dữ liệu bảng products, categories, ProductVariants
--           để chuẩn bị import mới, giữ nguyên tài khoản và cấu hình hệ thống.
-- ==============================================================================

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

BEGIN TRANSACTION;

BEGIN TRY
    PRINT N'Bắt đầu dọn sạch dữ liệu sản phẩm...';

    -- 1. Xóa các biến thể sản phẩm (nếu có)
    IF OBJECT_ID('ProductVariants', 'U') IS NOT NULL
    BEGIN
        DELETE FROM [ProductVariants];
        PRINT N'- Đã xóa sạch bảng ProductVariants.';
    END

    -- 2. Xóa toàn bộ sản phẩm
    IF OBJECT_ID('products', 'U') IS NOT NULL
    BEGIN
        DELETE FROM [products];
        PRINT N'- Đã xóa sạch bảng products.';
    END

    -- 3. Xóa danh mục sản phẩm (nếu muốn làm mới cả danh mục)
    IF OBJECT_ID('categories', 'U') IS NOT NULL
    BEGIN
        DELETE FROM [categories];
        PRINT N'- Đã xóa sạch bảng categories.';
    END

    COMMIT TRANSACTION;
    PRINT N'Hoàn tất dọn sạch dữ liệu sản phẩm thành công!';
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH;
GO

-- Kiểm tra lại số lượng bản ghi sau khi dọn dẹp
SELECT 
    'products' AS TableName, COUNT(*) AS TotalRows FROM [products]
UNION ALL
SELECT 
    'categories' AS TableName, COUNT(*) AS TotalRows FROM [categories]
UNION ALL
SELECT 
    'ProductVariants' AS TableName, COUNT(*) AS TotalRows FROM [ProductVariants];
GO
