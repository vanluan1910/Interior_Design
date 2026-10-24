const path = require('path');
const { execSync } = require('child_process');
const XLSX = require(path.resolve(__dirname, '../frontend/node_modules/xlsx'));

const excelPath = path.resolve(__dirname, '../image/Copy of noithatgomay_products.xlsx');
const wb = XLSX.readFile(excelPath);
const data = XLSX.utils.sheet_to_json(wb.Sheets['San_Pham']);

const tg = data.find((r) => String(r['Mã SKU'] || '').includes('TG-G03'));
console.log('TG-G03 raw row:', tg);

// Check if TG-G03 was imported under another SKU or Name in DB
const dbTg = execSync('sqlcmd -S localhost -d Interior_Design -E -Q "SET NOCOUNT ON; SELECT Sku, Name, CategoryId, Space FROM products WHERE Sku LIKE \'%TG-G03%\' OR Name LIKE N\'%TG – G03%\';"').toString();
console.log('\nDB lookup by SKU or Name:');
console.log(dbTg);

// Check total products count in DB grouped by Category
const dbCatCounts = execSync('sqlcmd -S localhost -d Interior_Design -E -Q "SET NOCOUNT ON; SELECT c.Name as CatName, COUNT(p.Id) as ProdCount FROM categories c LEFT JOIN products p ON p.CategoryId = c.Id GROUP BY c.Name ORDER BY ProdCount DESC;"').toString();
console.log('\nDB Product Count by Category:');
console.log(dbCatCounts);
