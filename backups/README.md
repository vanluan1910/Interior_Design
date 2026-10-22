# Hướng dẫn sao lưu & phục hồi Database: Interior_Design

## 1. Thông tin bản backup
- **Tên cơ sở dữ liệu:** `Interior_Design`
- **File backup:** `Interior_Design_20261022.bak`
- **Thời gian backup:** 22/10/2026 09:03:17
- **Kích thước file:** ~14.7 MB
- **Loại backup:** Full Backup

---

## 2. Cách phục hồi (Restore Database)

### Cách 1: Bằng SQL Server Management Studio (SSMS)
1. Mở **SSMS** và kết nối tới SQL Server (`localhost` hoặc `.\SQLEXPRESS`).
2. Chuột phải vào thư mục **Databases** > chọn **Restore Database...**.
3. Tại mục **Source**, chọn **Device** > click nút `...`.
4. Nhấn **Add** và trỏ tới file: `D:\Interior design\backups\Interior_Design_20261022.bak`.
5. Đặt tên Database đích là `Interior_Design`.
6. Tại mục **Options**:
   - Tích chọn **Overwrite the existing database (WITH REPLACE)** (nếu DB đã tồn tại).
   - Tích chọn **Close existing connections to destination database**.
7. Nhấn **OK** để hoàn tất.

### Cách 2: Bằng dòng lệnh (sqlcmd)
Mở PowerShell hoặc CMD và chạy lệnh sau:
```powershell
sqlcmd -S localhost -U sa -P "Luanlon1904@@" -C -Q "ALTER DATABASE [Interior_Design] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; RESTORE DATABASE [Interior_Design] FROM DISK = N'D:\Interior design\backups\Interior_Design_20261022.bak' WITH REPLACE; ALTER DATABASE [Interior_Design] SET MULTI_USER;"
```

---

## 3. Lệnh tạo bản backup mới bất kỳ lúc nào
```powershell
sqlcmd -S localhost -U sa -P "Luanlon1904@@" -C -Q "BACKUP DATABASE [Interior_Design] TO DISK = N'D:\Interior design\backups\Interior_Design_new.bak' WITH FORMAT, INIT, STATS = 10;"
```
