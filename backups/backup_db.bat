@echo off
chcp 65001 >nul
echo ========================================================
echo DANG SAO LUU DATABASE Interior_Design...
echo ========================================================

for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set TIMESTAMP=%datetime:~0,8%_%datetime:~8,6%
set BACKUP_FILE=D:\Interior design\backups\Interior_Design_%TIMESTAMP%.bak

sqlcmd -S localhost -U sa -P "Luanlon1904@@" -C -Q "BACKUP DATABASE [Interior_Design] TO DISK = N'%BACKUP_FILE%' WITH FORMAT, INIT, STATS = 10;"

if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo SAO LUU THANH CONG!
    echo File: %BACKUP_FILE%
    echo ========================================================
) else (
    echo ========================================================
    echo CO LOI XAY RA KHI SAO LUU DATABASE!
    echo ========================================================
)

pause
