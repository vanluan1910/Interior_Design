const path = require('path');
const { execSync } = require('child_process');
const XLSX = require(path.resolve(__dirname, '../frontend/node_modules/xlsx'));

const excelPath = path.resolve(__dirname, '../image/Copy of noithatgomay_products.xlsx');
const wb = XLSX.readFile(excelPath);
const excelData = XLSX.utils.sheet_to_json(wb.Sheets['San_Pham']);

const dbSkusRaw = execSync('sqlcmd -S localhost -d Interior_Design -E -Q "SET NOCOUNT ON; SELECT Sku FROM products;"').toString();
const dbSkus = new Set(
  dbSkusRaw
    .split(/\r?\n/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s && !s.includes('---') && s !== 'sku')
);

const missing = excelData.filter((r) => {
  const sku = String(r['Mã SKU'] || '').trim().toLowerCase();
  return !dbSkus.has(sku);
});

console.log('Total in Excel:', excelData.length);
console.log('Found in DB:', dbSkus.size);
console.log('Missing count:', missing.length);

console.log('\n--- Missing items summary by Category ---');
const missingByCat = {};
missing.forEach((m) => {
  const cat = m['Danh mục'] || 'Chưa phân loại';
  missingByCat[cat] = (missingByCat[cat] || 0) + 1;
});
console.log(missingByCat);

console.log('\n--- First 15 missing products ---');
missing.slice(0, 15).forEach((m, idx) => {
  console.log(`${idx + 1}. [${m['Mã SKU']}] ${m['Tên sản phẩm']} | Danh mục: ${m['Danh mục']} | Giá: ${m['Giá bán']}`);
});
