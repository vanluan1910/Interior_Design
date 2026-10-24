USE Interior_Design;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

DECLARE @prefix NVARCHAR(50) = N'$2a$11$';
DECLARE @suffix NVARCHAR(100) = N'Srk96R5aA/m2wkjHj8xsyej6g/nPyAtwE6mnGEPG0//0Gsjf2R9fO';
DECLARE @fullHash NVARCHAR(255) = @prefix + @suffix;

UPDATE users
SET PasswordHash = @fullHash
WHERE Username = 'admin' OR Email = 'admin@d2luxury.vn';

SELECT Id, FullName, Username, Email, PasswordHash FROM users;
GO
