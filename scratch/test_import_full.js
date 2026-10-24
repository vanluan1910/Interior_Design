const path = require('path');
const XLSX = require(path.resolve(__dirname, '../frontend/node_modules/xlsx'));

const excelPath = path.resolve(__dirname, '../image/Copy of noithatgomay_products.xlsx');
const wb = XLSX.readFile(excelPath);
const worksheet = wb.Sheets['San_Pham'];
const rawRows = XLSX.utils.sheet_to_json(worksheet);

console.log('Total rows in user file:', rawRows.length);

async function runTest() {
  // 1. Get categories from API
  const catRes = await fetch('http://localhost:5000/api/categories');
  const catJson = await catRes.json();
  const categories = catJson.data || [];
  console.log('Categories from API:', categories.length);

  // 2. Prepare payload exactly like frontend InventoryTab.tsx
  const usedSkus = new Set();
  const productsToImport = [];

  rawRows.forEach((row, idx) => {
    const name = String(row['Tên sản phẩm'] || row['name'] || row['Tên'] || '').trim();
    if (!name) return;

    let sku = String(row['Mã SKU'] || row['Mã'] || row['sku'] || row['code'] || '').trim();
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

    let rawOriginalPrice = row['Giá gốc'] || row['originalPrice'] || 0;
    let originalPrice = price;
    if (typeof rawOriginalPrice === 'number' && rawOriginalPrice > 0) {
      originalPrice = rawOriginalPrice;
    } else if (typeof rawOriginalPrice === 'string' && rawOriginalPrice.trim()) {
      const cleaned = rawOriginalPrice.replace(/[^\d]/g, '');
      originalPrice = cleaned ? parseInt(cleaned, 10) : price;
    }

    const mainImage = String(row['Ảnh đại diện'] || row['image'] || row['Image'] || '').trim();
    const allImagesRaw = String(row['Tất cả liên kết ảnh'] || row['images'] || row['Ảnh phụ'] || '').trim();
    const imagesList = allImagesRaw
      ? allImagesRaw.split(/[\n,;]/).map((s) => s.trim()).filter((s) => s.startsWith('http') || s.startsWith('/'))
      : (mainImage ? [mainImage] : []);

    const rawDimensions = String(row['Kích thước'] || row['dimensions'] || row['Thông số / Kích thước'] || '').trim();
    const rawMaterial = String(row['Chất liệu'] || row['material'] || '').trim();
    const rawColor = String(row['Màu sắc / Màu sơn'] || row['Màu sắc'] || row['Màu sơn gỗ'] || row['color'] || '').trim();
    const rawWarranty = String(row['Bảo hành'] || row['warranty'] || '').trim();
    const rawShipping = String(row['Giao hàng / Lắp đặt'] || row['Vận chuyển & Lắp đặt'] || row['shippingNote'] || '').trim();
    const description = String(row['Mô tả chi tiết'] || row['Mô tả sản phẩm'] || row['Mô tả'] || row['description'] || name).trim();

    const catItems = categoryStr
      ? categoryStr.split(',').map((c) => c.trim()).filter(Boolean)
      : ['Sản phẩm nội thất'];

    catItems.forEach((catItem, subIdx) => {
      let matchedCatId = '00000000-0000-0000-0000-000000000000';
      const lowerCat = catItem.toLowerCase().trim();

      let matchedCat = categories.find((c) => lowerCat === c.name.toLowerCase().trim());
      if (!matchedCat) {
        const sortedByLength = [...categories].sort((a, b) => (b.name?.length || 0) - (a.name?.length || 0));
        matchedCat = sortedByLength.find((c) =>
          lowerCat.includes(c.name.toLowerCase().trim()) ||
          c.name.toLowerCase().trim().includes(lowerCat)
        );
      }

      if (matchedCat && matchedCat.id) {
        matchedCatId = matchedCat.id;
      }

      let finalSpace = matchedCat?.space || spaceStr;
      if (!finalSpace || (finalSpace === 'Phòng ăn' && (lowerCat.includes('bàn trà') || lowerCat.includes('bàn nước')))) {
        if (lowerCat.includes('bàn trà') || lowerCat.includes('bàn nước') || lowerCat.includes('sofa') || lowerCat.includes('kệ tivi') || lowerCat.includes('tủ giày')) {
          finalSpace = 'Phòng Khách';
        } else if (lowerCat.includes('bàn ăn') || lowerCat.includes('ghế ăn') || lowerCat.includes('chạn ly')) {
          finalSpace = 'Phòng Ăn';
        } else if (lowerCat.includes('giường') || lowerCat.includes('táp') || lowerCat.includes('tủ áo') || lowerCat.includes('quần áo') || lowerCat.includes('trang điểm')) {
          finalSpace = 'Phòng Ngủ';
        } else if (lowerCat.includes('làm việc') || lowerCat.includes('giá sách')) {
          finalSpace = 'Phòng Làm Việc';
        } else {
          finalSpace = 'Phòng Khách';
        }
      }

      let finalSku = sku
        ? (subIdx === 0 ? sku : `${sku}-D${subIdx + 1}`)
        : `SP${(idx + 1).toString().padStart(4, '0')}${subIdx > 0 ? `-D${subIdx + 1}` : ''}`;

      if (usedSkus.has(finalSku.toLowerCase())) {
        finalSku = `${finalSku}-${(idx + 1).toString().padStart(3, '0')}`;
      }
      usedSkus.add(finalSku.toLowerCase());

      productsToImport.push({
        name,
        sku: finalSku,
        code: finalSku,
        categoryId: matchedCatId,
        collection: catItem,
        space: finalSpace,
        price,
        originalPrice: originalPrice > 0 ? originalPrice : price,
        mainImageUrl: mainImage,
        images: imagesList,
        dimensions: rawDimensions,
        material: rawMaterial || 'Gỗ Sồi tự nhiên (Ash / Oak)',
        color: rawColor || 'Nâu hạt dẻ / tự nhiên (Đa dạng)',
        warranty: rawWarranty || '24 tháng',
        shippingNote: rawShipping || 'Miễn phí giao hàng và lắp đặt toàn quốc.',
        description,
        shortDescription: catItem,
        inStock: 10,
        stockType: 'in_stock',
      });
    });
  });

  console.log('Sending products to API. Count:', productsToImport.length);

  const res = await fetch('http://localhost:5000/api/products/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productsToImport),
  });

  const resJson = await res.json();
  console.log('API Response:', res.status, resJson);
}

runTest().catch(console.error);
