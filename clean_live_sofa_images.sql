-- =========================================================================================
-- SCRIPT: CHUẨN HÓA & ĐỒNG BỘ ẢNH SOFA THEO ĐÚNG TRANG QUẢN TRỊ (D2 LUXURY DESIGN)
-- Mục đích: Loại bỏ tất cả ảnh phụ rác/cũ (IMG_..., DSC_..., z394...) được nạp từ Excel ban đầu.
--           Đưa [Images] về đúng 1 ảnh đại diện [MainImageUrl] duy nhất đã thiết lập bên Quản trị.
-- =========================================================================================

USE [Interior_Design];
GO

PRINT N'>>> BẮT ĐẦU CHUẨN HÓA VÀ LÀM SẠCH ẢNH DANH MỤC SOFA...';

BEGIN TRANSACTION;

BEGIN TRY
    -- Cập nhật toàn bộ các sản phẩm Sofa: Đặt Images chỉ chứa duy nhất MainImageUrl
    UPDATE [dbo].[products]
    SET [Images] = N'["' + REPLACE(LTRIM(RTRIM([MainImageUrl])), N'"', N'') + N'"]',
        [UpdatedAt] = GETUTCDATE()
    WHERE ([Name] LIKE N'%Sofa%' 
       OR [Sku] LIKE N'SF-%' 
       OR [Sku] LIKE N'BSF-%'
       OR [CategoryId] = '4f967263-3e30-40cc-82c3-e03e38feb1b0')
      AND [MainImageUrl] IS NOT NULL 
      AND LTRIM(RTRIM([MainImageUrl])) <> '';

    DECLARE @UpdatedCount INT = @@ROWCOUNT;

    COMMIT TRANSACTION;

    PRINT N'>>> [HOÀN TẤT THÀNH CÔNG] Đã chuẩn hóa ' + CAST(@UpdatedCount AS NVARCHAR(10)) + N' sản phẩm Sofa về đúng 1 ảnh đại diện đã set!';
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    PRINT N'>>> [LỖI]: ' + ERROR_MESSAGE();
END CATCH;
GO
