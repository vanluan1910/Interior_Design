using Microsoft.EntityFrameworkCore;

namespace InteriorDesign.Infrastructure.Data;

public static class DatabaseInitializer
{
    public static async Task InitializeAsync(InteriorDbContext context)
    {
        if (context.Database.IsRelational())
        {
            try
            {
                await context.Database.MigrateAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[MigrateAsync Warning]: {ex.Message}");
            }

            // Execute schema migrations safely in isolated steps
            await ExecuteSafeSqlAsync(context, "Indexes and columns", @"
                IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_spaces_Code' AND object_id = OBJECT_ID('spaces'))
                BEGIN
                    DROP INDEX [IX_spaces_Code] ON [dbo].[spaces];
                END
                IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'spaces')
                BEGIN
                    CREATE UNIQUE NONCLUSTERED INDEX [IX_spaces_Code] ON [dbo].[spaces] ([Code]) WHERE [IsDeleted] = 0;
                END

                IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_categories_Code' AND object_id = OBJECT_ID('categories'))
                BEGIN
                    DROP INDEX [IX_categories_Code] ON [dbo].[categories];
                END
                IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'categories')
                BEGIN
                    CREATE UNIQUE NONCLUSTERED INDEX [IX_categories_Code] ON [dbo].[categories] ([Code]) WHERE [IsDeleted] = 0;
                END

                IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_warehouses_Code' AND object_id = OBJECT_ID('warehouses'))
                BEGIN
                    DROP INDEX [IX_warehouses_Code] ON [dbo].[warehouses];
                END
                IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'warehouses')
                BEGIN
                    CREATE UNIQUE NONCLUSTERED INDEX [IX_warehouses_Code] ON [dbo].[warehouses] ([Code]) WHERE [IsDeleted] = 0;
                END
            ");

            await ExecuteSafeSqlAsync(context, "Clean Spaces ShowOnHome and Descriptions", @"
                IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'spaces')
                BEGIN
                    UPDATE [dbo].[spaces] SET [ShowOnHome] = 1, [IsDeleted] = 0, [Status] = 'active' WHERE [Slug] IN ('living', 'bedroom', 'dining', 'office') OR [Code] IN ('KG01', 'KG02', 'KG03', 'KG04');
                    UPDATE [dbo].[spaces] SET [ShowOnHome] = 0 WHERE [Slug] = 'san-pham-khac' OR [Code] IN ('KG05', 'KG06');
                    UPDATE [dbo].[spaces] SET [Description] = N'Sofa mộc bọc nỉ lanh tự nhiên, bàn trà điêu khắc hữu cơ, hệ kệ TV tinh gọn tôn vinh sự mộc mạc.' WHERE [Slug] = 'living' AND ([Description] LIKE '%#%' OR LEN([Description]) > 180);
                    UPDATE [dbo].[spaces] SET [Description] = N'Giường phản thấp giấu chân, tủ áo lam gỗ thanh mảnh và tab đầu giường nguyên khối.' WHERE [Slug] = 'bedroom' AND ([Description] LIKE '%#%' OR LEN([Description]) > 180);
                    UPDATE [dbo].[spaces] SET [Description] = N'Bàn ăn mở rộng thông minh, ghế tựa công thái học ôm sát sống lưng.' WHERE [Slug] = 'dining' AND ([Description] LIKE '%#%' OR LEN([Description]) > 180);
                    UPDATE [dbo].[spaces] SET [Description] = N'Bàn làm việc cạnh cong bo mềm, giá sách modul tuỳ biến theo kích thước căn hộ.' WHERE [Slug] = 'office' AND ([Description] LIKE '%#%' OR LEN([Description]) > 180);

                    UPDATE [dbo].[spaces] SET [Image] = 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&auto=format&fit=crop&q=80' WHERE ([Slug] = 'living' OR [Code] = 'KG01') AND ([Image] IS NULL OR [Image] = '' OR [Image] LIKE '%aida-public%');
                    UPDATE [dbo].[spaces] SET [Image] = 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&auto=format&fit=crop&q=80' WHERE ([Slug] = 'dining' OR [Code] = 'KG02') AND ([Image] IS NULL OR [Image] = '' OR [Image] LIKE '%aida-public%');
                    UPDATE [dbo].[spaces] SET [Image] = 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&auto=format&fit=crop&q=80' WHERE ([Slug] = 'office' OR [Code] = 'KG04') AND ([Image] IS NULL OR [Image] = '' OR [Image] LIKE '%aida-public%');
                    UPDATE [dbo].[spaces] SET [Image] = 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800&auto=format&fit=crop&q=80' WHERE ([Slug] = 'bedroom' OR [Code] = 'KG03') AND ([Image] IS NULL OR [Image] = '' OR [Image] LIKE '%aida-public%');
                    UPDATE [dbo].[spaces] SET [Image] = 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop&q=80' WHERE ([Slug] = 'san-pham-khac' OR [Code] IN ('KG05', 'KG06')) AND ([Image] IS NULL OR [Image] = '');
                END
            ");

            await ExecuteSafeSqlAsync(context, "Product Extra Columns", @"
                IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'products')
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('products') AND name = 'Dimensions')
                        ALTER TABLE [dbo].[products] ADD [Dimensions] NVARCHAR(MAX) NOT NULL DEFAULT '';
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('products') AND name = 'Material')
                        ALTER TABLE [dbo].[products] ADD [Material] NVARCHAR(MAX) NOT NULL DEFAULT '';
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('products') AND name = 'WoodType')
                        ALTER TABLE [dbo].[products] ADD [WoodType] NVARCHAR(MAX) NOT NULL DEFAULT '';
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('products') AND name = 'Color')
                        ALTER TABLE [dbo].[products] ADD [Color] NVARCHAR(MAX) NOT NULL DEFAULT '';
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('products') AND name = 'Warranty')
                        ALTER TABLE [dbo].[products] ADD [Warranty] NVARCHAR(MAX) NOT NULL DEFAULT '';
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('products') AND name = 'ShippingNote')
                        ALTER TABLE [dbo].[products] ADD [ShippingNote] NVARCHAR(MAX) NOT NULL DEFAULT '';
                END
            ");

            await ExecuteSafeSqlAsync(context, "Supplier Extra Columns", @"
                IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'suppliers')
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('suppliers') AND name = 'Company')
                        ALTER TABLE [dbo].[suppliers] ADD [Company] NVARCHAR(MAX) NOT NULL DEFAULT '';
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('suppliers') AND name = 'BankName')
                        ALTER TABLE [dbo].[suppliers] ADD [BankName] NVARCHAR(MAX) NOT NULL DEFAULT '';
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('suppliers') AND name = 'BankAccount')
                        ALTER TABLE [dbo].[suppliers] ADD [BankAccount] NVARCHAR(MAX) NOT NULL DEFAULT '';
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('suppliers') AND name = 'Province')
                        ALTER TABLE [dbo].[suppliers] ADD [Province] NVARCHAR(MAX) NOT NULL DEFAULT '';
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('suppliers') AND name = 'Ward')
                        ALTER TABLE [dbo].[suppliers] ADD [Ward] NVARCHAR(MAX) NOT NULL DEFAULT '';
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('suppliers') AND name = 'IdentityNumber')
                        ALTER TABLE [dbo].[suppliers] ADD [IdentityNumber] NVARCHAR(MAX) NOT NULL DEFAULT '';
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('suppliers') AND name = 'CurrentDebt')
                        ALTER TABLE [dbo].[suppliers] ADD [CurrentDebt] DECIMAL(18,2) NOT NULL DEFAULT 0;
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('suppliers') AND name = 'TotalCollected')
                        ALTER TABLE [dbo].[suppliers] ADD [TotalCollected] DECIMAL(18,2) NOT NULL DEFAULT 0;
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('suppliers') AND name = 'CreatedBy')
                        ALTER TABLE [dbo].[suppliers] ADD [CreatedBy] NVARCHAR(MAX) NOT NULL DEFAULT N'Hệ thống';
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('suppliers') AND name = 'IsDeleted')
                        ALTER TABLE [dbo].[suppliers] ADD [IsDeleted] BIT NOT NULL DEFAULT 0;
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('suppliers') AND name = 'DeletedAt')
                        ALTER TABLE [dbo].[suppliers] ADD [DeletedAt] DATETIME2 NULL;
                END
            ");

            await ExecuteSafeSqlAsync(context, "Stock Import Slips Table", @"
                IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'stock_import_slips')
                BEGIN
                    CREATE TABLE [dbo].[stock_import_slips] (
                        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
                        [Code] NVARCHAR(50) NOT NULL,
                        [Supplier] NVARCHAR(255) NOT NULL DEFAULT '',
                        [SupplierId] UNIQUEIDENTIFIER NULL,
                        [WarehouseName] NVARCHAR(255) NOT NULL DEFAULT '',
                        [WarehouseId] UNIQUEIDENTIFIER NULL,
                        [ItemName] NVARCHAR(255) NOT NULL DEFAULT '',
                        [Spec] NVARCHAR(MAX) NOT NULL DEFAULT '',
                        [Quantity] DECIMAL(18,2) NOT NULL DEFAULT 1,
                        [Unit] NVARCHAR(50) NOT NULL DEFAULT N'm³',
                        [UnitPrice] DECIMAL(18,2) NOT NULL DEFAULT 0,
                        [Discount] DECIMAL(18,2) NOT NULL DEFAULT 0,
                        [TotalValue] DECIMAL(18,2) NOT NULL DEFAULT 0,
                        [PaidAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
                        [RemainingDebt] DECIMAL(18,2) NOT NULL DEFAULT 0,
                        [Mc] NVARCHAR(50) NOT NULL DEFAULT '< 12%',
                        [ImportDate] NVARCHAR(100) NOT NULL DEFAULT '',
                        [Status] NVARCHAR(50) NOT NULL DEFAULT 'completed',
                        [StatusLabel] NVARCHAR(100) NOT NULL DEFAULT N'Đã nhập kho',
                        [Inspector] NVARCHAR(150) NOT NULL DEFAULT '',
                        [Note] NVARCHAR(MAX) NOT NULL DEFAULT '',
                        [ItemsJson] NVARCHAR(MAX) NOT NULL DEFAULT '[]',
                        [IsDeleted] BIT NOT NULL DEFAULT 0,
                        [CreatedAt] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
                        [UpdatedAt] DATETIMEOFFSET NULL
                    );
                END
            ");

            await ExecuteSafeSqlAsync(context, "Supplier Return Slips Table", @"
                IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'supplier_return_slips')
                BEGIN
                    CREATE TABLE [dbo].[supplier_return_slips] (
                        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
                        [Code] NVARCHAR(50) NOT NULL,
                        [SourceImportCode] NVARCHAR(50) NOT NULL DEFAULT '',
                        [SupplierId] UNIQUEIDENTIFIER NULL,
                        [SupplierName] NVARCHAR(255) NOT NULL DEFAULT '',
                        [WarehouseId] UNIQUEIDENTIFIER NULL,
                        [WarehouseName] NVARCHAR(255) NOT NULL DEFAULT '',
                        [ItemName] NVARCHAR(255) NOT NULL DEFAULT '',
                        [Quantity] DECIMAL(18,2) NOT NULL DEFAULT 1,
                        [Unit] NVARCHAR(50) NOT NULL DEFAULT N'm³',
                        [TotalValue] DECIMAL(18,2) NOT NULL DEFAULT 0,
                        [Discount] DECIMAL(18,2) NOT NULL DEFAULT 0,
                        [SupplierRefund] DECIMAL(18,2) NOT NULL DEFAULT 0,
                        [PaidAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
                        [ReturnDate] NVARCHAR(100) NOT NULL DEFAULT '',
                        [Reason] NVARCHAR(MAX) NOT NULL DEFAULT '',
                        [Solution] NVARCHAR(MAX) NOT NULL DEFAULT '',
                        [PaymentMethod] NVARCHAR(100) NOT NULL DEFAULT N'Chuyển khoản',
                        [Status] NVARCHAR(50) NOT NULL DEFAULT 'completed',
                        [StatusLabel] NVARCHAR(100) NOT NULL DEFAULT N'Đã cấn trừ công nợ',
                        [StaffName] NVARCHAR(150) NOT NULL DEFAULT '',
                        [Note] NVARCHAR(MAX) NOT NULL DEFAULT '',
                        [ItemsJson] NVARCHAR(MAX) NOT NULL DEFAULT '[]',
                        [IsDeleted] BIT NOT NULL DEFAULT 0,
                        [CreatedAt] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
                        [UpdatedAt] DATETIMEOFFSET NULL
                    );
                END
            ");

            await ExecuteSafeSqlAsync(context, "Stock Audit Slips Table", @"
                IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'stock_audit_slips')
                BEGIN
                    CREATE TABLE [dbo].[stock_audit_slips] (
                        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
                        [Code] NVARCHAR(50) NOT NULL,
                        [Title] NVARCHAR(255) NOT NULL DEFAULT '',
                        [WarehouseId] UNIQUEIDENTIFIER NULL,
                        [ScopeLabel] NVARCHAR(255) NOT NULL DEFAULT '',
                        [Creator] NVARCHAR(150) NOT NULL DEFAULT '',
                        [AuditDate] NVARCHAR(100) NOT NULL DEFAULT '',
                        [Status] NVARCHAR(50) NOT NULL DEFAULT 'in_progress',
                        [StatusLabel] NVARCHAR(100) NOT NULL DEFAULT N'Đang kiểm đếm',
                        [TotalItems] INT NOT NULL DEFAULT 0,
                        [MatchedItems] INT NOT NULL DEFAULT 0,
                        [DiscrepantItems] INT NOT NULL DEFAULT 0,
                        [TotalDifferenceValue] DECIMAL(18,2) NOT NULL DEFAULT 0,
                        [Note] NVARCHAR(MAX) NOT NULL DEFAULT '',
                        [ItemsJson] NVARCHAR(MAX) NOT NULL DEFAULT '[]',
                        [IsDeleted] BIT NOT NULL DEFAULT 0,
                        [CreatedAt] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
                        [UpdatedAt] DATETIMEOFFSET NULL
                    );
                END
            ");

            await ExecuteSafeSqlAsync(context, "Unit Of Measures Table", @"
                IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'unit_of_measures')
                BEGIN
                    CREATE TABLE [dbo].[unit_of_measures] (
                        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
                        [Code] NVARCHAR(50) NOT NULL,
                        [Name] NVARCHAR(150) NOT NULL,
                        [Description] NVARCHAR(MAX) NOT NULL DEFAULT '',
                        [IsDefault] BIT NOT NULL DEFAULT 0,
                        [Status] NVARCHAR(30) NOT NULL DEFAULT 'active',
                        [IsDeleted] BIT NOT NULL DEFAULT 0,
                        [CreatedAt] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
                        [UpdatedAt] DATETIMEOFFSET NULL
                    );
                END
            ");

            await ExecuteSafeSqlAsync(context, "Employees Table", @"
                IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'employees')
                BEGIN
                    CREATE TABLE [dbo].[employees] (
                        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
                        [Code] NVARCHAR(50) NOT NULL,
                        [Name] NVARCHAR(255) NOT NULL,
                        [Phone] NVARCHAR(50) NOT NULL DEFAULT '',
                        [IdNumber] NVARCHAR(50) NOT NULL DEFAULT '',
                        [Gender] NVARCHAR(20) NOT NULL DEFAULT 'Nam',
                        [Birthday] NVARCHAR(50) NOT NULL DEFAULT '',
                        [Email] NVARCHAR(150) NOT NULL DEFAULT '',
                        [Address] NVARCHAR(MAX) NOT NULL DEFAULT '',
                        [Department] NVARCHAR(150) NOT NULL DEFAULT 'Showroom Kinh Doanh',
                        [Title] NVARCHAR(150) NOT NULL DEFAULT 'Chuyên viên Tư vấn',
                        [Branch] NVARCHAR(150) NOT NULL DEFAULT 'Showroom Quận 10 (HQ)',
                        [BranchId] UNIQUEIDENTIFIER NULL,
                        [Login] NVARCHAR(100) NOT NULL DEFAULT '',
                        [Username] NVARCHAR(100) NOT NULL DEFAULT '',
                        [Role] NVARCHAR(50) NOT NULL DEFAULT 'Staff',
                        [Status] NVARCHAR(30) NOT NULL DEFAULT 'working',
                        [WorkingDate] NVARCHAR(50) NOT NULL DEFAULT '',
                        [Area] NVARCHAR(100) NOT NULL DEFAULT '',
                        [Ward] NVARCHAR(100) NOT NULL DEFAULT '',
                        [AddressDetail] NVARCHAR(MAX) NOT NULL DEFAULT '',
                        [Debt] DECIMAL(18,2) NOT NULL DEFAULT 0,
                        [Note] NVARCHAR(MAX) NOT NULL DEFAULT '',
                        [Facebook] NVARCHAR(255) NOT NULL DEFAULT '',
                        [Zalo] NVARCHAR(50) NOT NULL DEFAULT '',
                        [SkillsJson] NVARCHAR(MAX) NOT NULL DEFAULT '[]',
                        [IsDeleted] BIT NOT NULL DEFAULT 0,
                        [CreatedAt] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
                        [UpdatedAt] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
                    );
                END
            ");

            await ExecuteSafeSqlAsync(context, "Employees Index", @"
                IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'employees') AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_employees_Code' AND object_id = OBJECT_ID('employees'))
                BEGIN
                    CREATE UNIQUE NONCLUSTERED INDEX [IX_employees_Code] ON [dbo].[employees] ([Code]) WHERE [IsDeleted] = 0;
                END
            ");

            await ExecuteSafeSqlAsync(context, "store_settings Columns", @"
                DECLARE @tbl NVARCHAR(255);
                DECLARE @sql NVARCHAR(MAX);

                DECLARE cur CURSOR LOCAL FAST_FORWARD FOR 
                SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_TYPE = 'BASE TABLE' AND (TABLE_NAME LIKE '%storesetting%' OR TABLE_NAME LIKE '%store_setting%');

                OPEN cur;
                FETCH NEXT FROM cur INTO @tbl;

                WHILE @@FETCH_STATUS = 0
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = @tbl AND COLUMN_NAME = 'CompanyInfoJson')
                    BEGIN
                        SET @sql = N'ALTER TABLE [dbo].[' + @tbl + N'] ADD [CompanyInfoJson] NVARCHAR(MAX) NULL;';
                        EXEC sp_executesql @sql;
                    END

                    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = @tbl AND COLUMN_NAME = 'PaymentConfigJson')
                    BEGIN
                        SET @sql = N'ALTER TABLE [dbo].[' + @tbl + N'] ADD [PaymentConfigJson] NVARCHAR(MAX) NULL;';
                        EXEC sp_executesql @sql;
                    END

                    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = @tbl AND COLUMN_NAME = 'PrintTemplatesJson')
                    BEGIN
                        SET @sql = N'ALTER TABLE [dbo].[' + @tbl + N'] ADD [PrintTemplatesJson] NVARCHAR(MAX) NULL;';
                        EXEC sp_executesql @sql;
                    END

                    FETCH NEXT FROM cur INTO @tbl;
                END;

                CLOSE cur;
                DEALLOCATE cur;
            ");

            await ExecuteSafeSqlAsync(context, "Roles Table", @"
                IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'roles')
                BEGIN
                    CREATE TABLE [dbo].[roles] (
                        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
                        [Code] NVARCHAR(50) NOT NULL,
                        [Name] NVARCHAR(150) NOT NULL,
                        [Description] NVARCHAR(500) NOT NULL DEFAULT '',
                        [IsSystem] BIT NOT NULL DEFAULT 0,
                        [Status] NVARCHAR(20) NOT NULL DEFAULT 'active',
                        [Permissions] NVARCHAR(MAX) NOT NULL DEFAULT '[]',
                        [IsDeleted] BIT NOT NULL DEFAULT 0,
                        [DeletedAt] DATETIMEOFFSET NULL,
                        [CreatedAt] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
                        [UpdatedAt] DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
                    );
                END
            ");

            await ExecuteSafeSqlAsync(context, "Roles Index", @"
                IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'roles') AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_roles_Code' AND object_id = OBJECT_ID('roles'))
                BEGIN
                    CREATE UNIQUE NONCLUSTERED INDEX [IX_roles_Code] ON [dbo].[roles] ([Code]) WHERE [IsDeleted] = 0;
                END
            ");
        }
        else
        {
            await context.Database.EnsureCreatedAsync();
        }

        // Seeding Data with individual try-catches
        try
        {
            if (!await context.Roles.IgnoreQueryFilters().AnyAsync())
            {
                await context.Roles.AddRangeAsync(InteriorSeedData.GetRoles());
                await context.SaveChangesAsync();
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Seed Roles Warning]: {ex.Message}");
        }

        try
        {
            var existingSpaceCodes = await context.Spaces.IgnoreQueryFilters().Select(s => s.Code.ToUpper()).ToListAsync();
            var defaultSpaces = InteriorSeedData.GetSpaces();
            var missingSpaces = defaultSpaces.Where(s => !existingSpaceCodes.Contains(s.Code.ToUpper())).ToList();
            if (missingSpaces.Count > 0)
            {
                await context.Spaces.AddRangeAsync(missingSpaces);
                await context.SaveChangesAsync();
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Seed Spaces Warning]: {ex.Message}");
        }

        if (!await context.Users.AnyAsync())
        {
            try
            {
                await context.Users.AddAsync(InteriorSeedData.GetAdminUser());
                await context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Seed Users Warning]: {ex.Message}");
            }
        }

        if (!await context.StoreSettings.AnyAsync())
        {
            try
            {
                await context.StoreSettings.AddAsync(InteriorSeedData.GetStoreSetting());
                await context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Seed StoreSettings Warning]: {ex.Message}");
            }
        }

        if (!await context.Branches.IgnoreQueryFilters().AnyAsync())
        {
            try
            {
                await context.Branches.AddRangeAsync(InteriorSeedData.GetBranches());
                await context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Seed Branches Warning]: {ex.Message}");
            }
        }

        if (!await context.Warehouses.IgnoreQueryFilters().AnyAsync())
        {
            try
            {
                await context.Warehouses.AddRangeAsync(InteriorSeedData.GetWarehouses());
                await context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Seed Warehouses Warning]: {ex.Message}");
            }
        }

        try
        {
            if (!await context.UnitOfMeasures.IgnoreQueryFilters().AnyAsync())
            {
                await context.UnitOfMeasures.AddRangeAsync(InteriorSeedData.GetUnitOfMeasures());
                await context.SaveChangesAsync();
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Seed UnitOfMeasures Warning]: {ex.Message}");
        }

        // Employee initial seeding disabled to allow user full custom management
        // (Previously seeded InteriorSeedData.GetEmployees())
    }

    private static async Task ExecuteSafeSqlAsync(InteriorDbContext context, string label, string sql)
    {
        try
        {
            await context.Database.ExecuteSqlRawAsync(sql);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Migration Step - {label} Warning]: {ex.Message}");
        }
    }
}
