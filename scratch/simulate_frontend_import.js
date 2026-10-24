const path = require('path');
const XLSX = require(path.resolve(__dirname, '../frontend/node_modules/xlsx'));

const excelPath = path.resolve(__dirname, '../image/Copy of noithatgomay_products.xlsx');
const wb = XLSX.readFile(excelPath);
const worksheet = wb.Sheets['San_Pham'];
const rawRows = XLSX.utils.sheet_to_json(worksheet);

console.log('Raw rows from sheet_to_json:', rawRows.length);

const productsToImport = [];
const skipped = [];

rawRows.forEach((row, idx) => {
  const name = String(row['Tên sản phẩm'] || row['name'] || row['Tên'] || '').trim();
  if (!name) {
    skipped.push({ idx, reason: 'No name', row });
    return;
  }

  const sku = String(row['Mã SKU'] || row['Mã'] || row['sku'] || row['code'] || '').trim();
  const categoryStr = String(row['Danh mục'] || row['Category'] || row['Bộ sưu tập'] || '').trim();
  const spaceStr = String(row['Không gian'] || row['Không gian nội thất'] || row['space'] || '').trim();

  let rawPrice = row['Giá bán'] || row['Giá'] || row['price'] || 0;
  let price = 0;
  if (typeof rawPrice === 'number') {
    price = rawPrice;
  } else if (typeof rawPrice === 'string') {
    const cleaned = rawPrice.replace(/[^\d]/g, '');
    price = cleaned ? parseInt(cleaned, 10) : 0;
  }

  const categories = categoryStr
    ? categoryStr.split(',').map((c) => c.trim()).filter(Boolean)
    : ['Sản phẩm nội thất'];

  categories.forEach((catItem, subIdx) => {
    const finalSku = sku
      ? subIdx === 0
        ? sku
        : `${sku}-D${subIdx + 1}`
      : `SP${(idx + 1).toString().padStart(4, '0')}${subIdx > 0 ? `-D${subIdx + 1}` : ''}`;

    productsToImport.push({
      idx,
      name,
      sku: finalSku,
      collection: catItem,
      space: spaceStr,
      price,
    });
  });
});

console.log('Processed productsToImport length:', productsToImport.length);
console.log('Skipped rows count:', skipped.length);
if (skipped.length > 0) {
  console.log('First 5 skipped:', skipped.slice(0, 5));
}

// Check for duplicate SKUs in productsToImport
const skuMap = new Map();
const duplicates = [];
productsToImport.forEach((p) => {
  if (skuMap.has(p.sku.toLowerCase())) {
    duplicates.push({ current: p, original: skuMap.get(p.sku.toLowerCase()) });
  } else {
    skuMap.set(p.sku.toLowerCase(), p);
  }
});

console.log('Duplicate SKUs in productsToImport:', duplicates.length);
if (duplicates.length > 0) {
  console.log('First 5 duplicates:', duplicates.slice(0, 5));
}
