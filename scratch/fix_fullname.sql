SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

UPDATE [dbo].[users]
SET [FullName] = N'Quản trị viên'
WHERE [Username] = 'admin';
GO

SELECT [Id], [Username], [FullName], [Email] FROM [dbo].[users] WHERE [Username] = 'admin';
GO
