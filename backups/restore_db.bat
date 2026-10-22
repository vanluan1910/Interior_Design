@echo off
chcp 65001 >nul
echo ========================================================
echo DANG PHUC HOI DATABASE Interior_Design TU FILE .BAK...
echo ========================================================

set BACKUP_FILE=D:\Interior design\backups\Interior_Design_20261022.bak

if not exist "%BACKUP_FILE%" (
    echo [LOI] Khong tim thay file backup tai: %BACKUP_FILE%
    pause
    exit /b 1
)

sqlcmd -S localhost -U sa -P "Luanlon1904@@" -C -Q "ALTER DATABASE [Interior_Design] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; RESTORE DATABASE [Interior_Design] FROM DISK = N'%BACKUP_FILE%' WITH REPLACE; ALTER DATABASE [Interior_Design] SET MULTI_USER;"

if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo PHUC HOI DATABASE THANH CONG!
    echo ========================================================
) else (
    echo ========================================================
    echo CO LOI XAY RA KHI PHUC HOI DATABASE!
    echo ========================================================
)

pause
