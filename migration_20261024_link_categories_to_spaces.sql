-- ==============================================================================
-- MIGRATION SCRIPT: LIÊN KẾT DANH MỤC VÀO KHÔNG GIAN (SpaceId)
-- Thời gian tạo: 2026-10-24
-- Mục đích: Tự động cập nhật SpaceId cho toàn bộ danh mục trong bảng categories
--           dựa theo tên không gian (Space) tương ứng trong bảng spaces.
-- ==============================================================================

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

BEGIN TRANSACTION;

BEGIN TRY
    PRINT N'Bắt đầu cập nhật SpaceId cho bảng categories...';

    UPDATE c
    SET c.SpaceId = s.Id
    FROM [categories] c
    INNER JOIN [spaces] s ON LOWER(LTRIM(RTRIM(c.Space))) = LOWER(LTRIM(RTRIM(s.Name)))
    WHERE c.SpaceId IS NULL OR c.SpaceId <> s.Id;

    DECLARE @UpdatedCount INT = @@ROWCOUNT;
    PRINT N'- Đã cập nhật SpaceId cho ' + CAST(@UpdatedCount AS NVARCHAR(10)) + N' danh mục.';

    COMMIT TRANSACTION;
    PRINT N'Hoàn tất liên kết danh mục vào không gian thành công!';
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH;
GO

-- Kiểm tra kết quả liên kết
SELECT 
    c.Code AS [MaDanhMuc],
    c.Name AS [TenDanhMuc],
    c.Space AS [TenKhongGian],
    c.SpaceId AS [SpaceGuid],
    s.Name AS [KhongGianKhop]
FROM [categories] c
LEFT JOIN [spaces] s ON c.SpaceId = s.Id
ORDER BY c.Space, c.DisplayOrder;
GO
