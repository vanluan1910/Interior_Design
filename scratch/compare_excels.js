const path = require('path');
const XLSX = require(path.resolve(__dirname, '../frontend/node_modules/xlsx'));

const f1Path = path.resolve(__dirname, '../noithatgomay_products_cleaned.xlsx');
const f2Path = path.resolve(__dirname, '../image/Copy of noithatgomay_products.xlsx');

const wb1 = XLSX.readFile(f1Path);
const wb2 = XLSX.readFile(f2Path);

const data1 = XLSX.utils.sheet_to_json(wb1.Sheets[wb1.SheetNames[0]]);
const data2 = XLSX.utils.sheet_to_json(wb2.Sheets[wb2.SheetNames[0]]);

console.log('File 1 (cleaned) rows:', data1.length);
console.log('File 2 (image/Copy) rows:', data2.length);

const cat1 = {};
data1.forEach((r) => {
  const c = r['Danh mục'] || 'none';
  cat1[c] = (cat1[c] || 0) + 1;
});

const cat2 = {};
data2.forEach((r) => {
  const c = r['Danh mục'] || 'none';
  cat2[c] = (cat2[c] || 0) + 1;
});

console.log('\nCategories in File 1 (cleaned):');
console.log(cat1);

console.log('\nCategories in File 2 (image/Copy):');
console.log(cat2);

// Check differences in SKUs
const skus1 = new Set(data1.map((r) => String(r['Mã SKU'] || '').trim().toLowerCase()));
const skus2 = new Set(data2.map((r) => String(r['Mã SKU'] || '').trim().toLowerCase()));

const in2Not1 = data2.filter((r) => !skus1.has(String(r['Mã SKU'] || '').trim().toLowerCase()));
const in1Not2 = data1.filter((r) => !skus2.has(String(r['Mã SKU'] || '').trim().toLowerCase()));

console.log(`\nSKUs in File 2 but not in File 1: ${in2Not1.length}`);
console.log(`SKUs in File 1 but not in File 2: ${in1Not2.length}`);
