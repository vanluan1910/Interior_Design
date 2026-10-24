-- ==============================================================================
-- MIGRATION SCRIPT: CHUẨN HÓA KHÔNG GIAN CHO DANH MỤC & CẬP NHẬT SpaceId CHÍNH XÁC
-- Thời gian tạo: 2026-10-24
-- Mục đích:
--   1. Khắc phục lỗi "Bàn trà - Bàn nước" bị gán nhầm sang "Phòng ăn" -> chuyển về "Phòng khách".
--   2. Chuẩn hóa tên không gian cho toàn bộ 17 danh mục chuẩn.
--   3. Cập nhật SpaceId tham chiếu chính xác đến các không gian đang hoạt động (IsDeleted = 0).
-- ==============================================================================

USE [Interior_Design];
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

BEGIN TRANSACTION;

BEGIN TRY
    PRINT N'>>> [1] Đang chuẩn hóa Không Gian (Space) cho danh mục...';

    -- 1. Sửa Bàn trà - Bàn nước về Phòng khách
    UPDATE [dbo].[categories]
    SET [Space] = N'Phòng khách'
    WHERE [Name] LIKE N'%Bàn trà%' OR [Name] LIKE N'%Bàn nước%';

    -- 2. Đảm bảo các danh mục khác thuộc đúng không gian chuẩn
    UPDATE [dbo].[categories]
    SET [Space] = N'Phòng khách'
    WHERE [Name] IN (N'Sofa Gỗ Mây', N'Sofa Đệm Êm', N'Kệ tivi', N'Kệ trang trí', N'Tủ giày');

    UPDATE [dbo].[categories]
    SET [Space] = N'Phòng ăn'
    WHERE [Name] IN (N'Bàn ăn', N'Bàn ăn Gỗ Mây', N'Ghế Ăn Gỗ Mây', N'Tủ chạn ly');

    UPDATE [dbo].[categories]
    SET [Space] = N'Phòng làm việc'
    WHERE [Name] IN (N'Bàn làm việc');

    UPDATE [dbo].[categories]
    SET [Space] = N'Phòng ngủ'
    WHERE [Name] IN (N'Giường ngủ', N'Tủ quần áo', N'Táp đầu giường', N'Bàn trang điểm');

    UPDATE [dbo].[categories]
    SET [Space] = N'Sản phẩm khác'
    WHERE [Name] IN (N'Ghế Mây', N'Ghế Song Mây');

    PRINT N'>>> [2] Đang liên kết SpaceId theo không gian đang hoạt động (IsDeleted = 0)...';

    -- Lấy ID các không gian đang hoạt động
    DECLARE @LivingSpaceId UNIQUEIDENTIFIER = (SELECT TOP 1 Id FROM [dbo].[spaces] WHERE [IsDeleted] = 0 AND ([Code] = 'KG01' OR [Name] LIKE N'%Khách%'));
    DECLARE @DiningSpaceId UNIQUEIDENTIFIER = (SELECT TOP 1 Id FROM [dbo].[spaces] WHERE [IsDeleted] = 0 AND ([Code] = 'KG02' OR [Name] LIKE N'%Ăn%'));
    DECLARE @OfficeSpaceId UNIQUEIDENTIFIER = (SELECT TOP 1 Id FROM [dbo].[spaces] WHERE [IsDeleted] = 0 AND ([Code] = 'KG03' OR [Name] LIKE N'%Việc%'));
    DECLARE @BedroomSpaceId UNIQUEIDENTIFIER = (SELECT TOP 1 Id FROM [dbo].[spaces] WHERE [IsDeleted] = 0 AND ([Code] = 'KG04' OR [Name] LIKE N'%Ngủ%'));
    DECLARE @OtherSpaceId UNIQUEIDENTIFIER = (SELECT TOP 1 Id FROM [dbo].[spaces] WHERE [IsDeleted] = 0 AND [Code] = 'KG05');

    -- Cập nhật SpaceId cho từng không gian
    UPDATE [dbo].[categories]
    SET [SpaceId] = @LivingSpaceId
    WHERE [Space] = N'Phòng khách';

    UPDATE [dbo].[categories]
    SET [SpaceId] = @DiningSpaceId
    WHERE [Space] = N'Phòng ăn';

    UPDATE [dbo].[categories]
    SET [SpaceId] = @OfficeSpaceId
    WHERE [Space] = N'Phòng làm việc';

    UPDATE [dbo].[categories]
    SET [SpaceId] = @BedroomSpaceId
    WHERE [Space] = N'Phòng ngủ';

    UPDATE [dbo].[categories]
    SET [SpaceId] = @OtherSpaceId
    WHERE [Space] = N'Sản phẩm khác';

    COMMIT TRANSACTION;
    PRINT N'>>> [THÀNH CÔNG] Đã chuẩn hóa toàn bộ danh mục và liên kết SpaceId chính xác!';
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    RAISERROR(@ErrorMessage, 16, 1);
END CATCH;
GO

-- Kiểm tra kết quả
SELECT 
    c.Code AS [MaDM],
    c.Name AS [TenDM],
    c.Space AS [KhongGianText],
    s.Code AS [MaKG],
    s.Name AS [KhongGianDb],
    c.SpaceId
FROM [dbo].[categories] c
LEFT JOIN [dbo].[spaces] s ON c.SpaceId = s.Id
ORDER BY s.Code, c.Code;
GO
