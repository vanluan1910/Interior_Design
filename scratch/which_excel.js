const path = require('path');
const { execSync } = require('child_process');
const XLSX = require(path.resolve(__dirname, '../frontend/node_modules/xlsx'));

const f1Path = path.resolve(__dirname, '../noithatgomay_products_cleaned.xlsx');
const f2Path = path.resolve(__dirname, '../image/Copy of noithatgomay_products.xlsx');

const data1 = XLSX.utils.sheet_to_json(XLSX.readFile(f1Path).Sheets['San_Pham']);
const data2 = XLSX.utils.sheet_to_json(XLSX.readFile(f2Path).Sheets['San_Pham']);

const dbSkusRaw = execSync('sqlcmd -S localhost -d Interior_Design -E -Q "SET NOCOUNT ON; SELECT Sku FROM products;"').toString();
const dbSkus = new Set(
  dbSkusRaw
    .split(/\r?\n/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s && !s.includes('---') && s !== 'sku')
);

const match1 = data1.filter((r) => dbSkus.has(String(r['Mã SKU'] || '').trim().toLowerCase()));
const match2 = data2.filter((r) => dbSkus.has(String(r['Mã SKU'] || '').trim().toLowerCase()));

console.log('Total in DB:', dbSkus.size);
console.log('Matches with File 1 (cleaned):', match1.length);
console.log('Matches with File 2 (image/Copy):', match2.length);
