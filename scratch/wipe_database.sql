USE Interior_Design;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

BEGIN TRANSACTION;

BEGIN TRY
    -- 1. Xóa chi tiết đơn hàng & đơn hàng
    PRINT 'Deleting order_items and orders...';
    DELETE FROM order_items;
    DELETE FROM orders;

    -- 2. Xóa sản phẩm & biến thể
    PRINT 'Deleting ProductVariants and products...';
    DELETE FROM ProductVariants;
    DELETE FROM products;

    -- 3. Xóa danh mục & không gian
    PRINT 'Deleting categories and spaces...';
    DELETE FROM categories;
    DELETE FROM spaces;

    -- 4. Xóa đặt lịch tư vấn & khách hàng
    PRINT 'Deleting consultation_bookings and customers...';
    DELETE FROM consultation_bookings;
    DELETE FROM customers;

    -- 5. Xóa các phiếu kho, nhà cung cấp, kho và chi nhánh
    PRINT 'Deleting inventory slips, suppliers, warehouses and branches...';
    DELETE FROM stock_import_slips;
    DELETE FROM stock_audit_slips;
    DELETE FROM supplier_return_slips;
    DELETE FROM suppliers;
    DELETE FROM warehouses;
    DELETE FROM branches;

    -- 6. Xóa nhân viên
    PRINT 'Deleting employees...';
    DELETE FROM employees;

    -- 7. Xóa đơn vị tính
    PRINT 'Deleting unit_of_measures...';
    DELETE FROM unit_of_measures;

    -- 8. Giữ lại tài khoản Admin trong users (xóa tất cả tài khoản không phải Admin)
    PRINT 'Deleting non-admin users...';
    DELETE FROM users WHERE Role NOT IN ('Admin', 'admin', 'SuperAdmin');

    -- 9. Giữ lại vai trò Quản trị viên tối cao trong roles
    PRINT 'Deleting non-admin roles...';
    DELETE FROM roles WHERE Name NOT LIKE '%Admin%' AND Name NOT LIKE '%Quản trị%';

    COMMIT TRANSACTION;
    PRINT 'Database wipe completed successfully!';
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    PRINT 'Error occurred during wipe: ' + ERROR_MESSAGE();
    THROW;
END CATCH
GO
