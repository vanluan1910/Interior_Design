/**
 * Script to populate missing dimensions for all products on Live, Local, and generate SQL migration.
 */
const fs = require('fs');
const path = require('path');

const LIVE_BASE = 'https://noithatd2luxurydesign.com';
const LOCAL_BASE = 'http://localhost:5000';

function getStandardDimension(p) {
  const name = (p.name || '').toLowerCase();
  const sku = (p.sku || p.code || '').toUpperCase();

  if (sku.startsWith('BSF')) {
    if (name.includes('góc') || sku.includes('GÓC') || name.includes('chữ l')) {
      return 'Văng góc L2800 x D1600 x C780 mm / Bàn trà D700 x C420 mm (Gia công may đo)';
    }
    return 'Văng chính L2200 x D850 x C780 mm / Đôn L800 x D600 mm (Gia công may đo)';
  }
  if (sku.startsWith('BP')) {
    return 'Bàn L1000 x R500 x C750 mm / Gương D600 mm / Đôn D350 x C420 mm';
  }
  if (sku.startsWith('GA')) {
    return 'D480 x R520 x C820 mm (Chiều cao mặt ngồi 450mm)';
  }
  if (sku.startsWith('KTT') || name.includes('kệ tivi') || name.includes('kệ trang trí')) {
    return 'L2000 x R400 x C550 mm (Gia công theo diện tích)';
  }
  if (sku.startsWith('BT') || name.includes('bàn trà')) {
    return 'Bàn lớn D700 x C420 mm / Bàn nhỏ D500 x C380 mm';
  }
  if (sku.startsWith('BLV') || name.includes('bàn làm việc')) {
    return 'L1400 x R700 x C750 mm';
  }
  if (sku.startsWith('TG') || name.includes('tủ giày')) {
    return 'L1200 x R350 x C1100 mm';
  }
  if (sku.startsWith('TA') || name.includes('tủ áo')) {
    return 'L1800 x R600 x C2200 mm';
  }
  if (sku.startsWith('TB') || name.includes('tủ bếp')) {
    return 'Theo hệ đo đạc thực tế công trình (Thiết kế may đo)';
  }
  return 'Theo thiết kế tiêu chuẩn D2 Luxury (Gia công may đo)';
}

async function fetchAllProducts(baseUrl) {
  let all = [];
  let page = 1;
  while (true) {
    try {
      const res = await fetch(`${baseUrl}/api/products?page=${page}&pageSize=50`);
      if (!res.ok) {
        console.warn(`[${baseUrl}] Page ${page} failed with ${res.status}`);
        break;
      }
      const json = await res.json();
      const items = json.data?.items || [];
      if (!items.length) break;
      all.push(...items);
      if (items.length < 50) break;
      page++;
    } catch (e) {
      console.warn(`[${baseUrl}] fetch error on page ${page}:`, e.message);
      break;
    }
  }
  return all;
}

async function updateProductOnServer(baseUrl, p, newDim) {
  const updatePayload = {
    name: p.name,
    code: p.sku || p.code,
    sku: p.sku || p.code,
    categoryId: p.categoryId,
    price: p.price,
    originalPrice: p.originalPrice,
    discountPercent: p.discountPercent || 0,
    inStock: p.inStock,
    unit: p.unit || 'Bộ',
    stockType: p.stockType,
    shortDescription: p.shortDescription || p.collection || '',
    description: p.description || p.name,
    dimensions: newDim,
    material: p.material || p.woodType || 'Gỗ Sồi tự nhiên (Ash/Oak)',
    woodType: p.woodType || p.material || 'Gỗ Sồi tự nhiên',
    color: p.color || 'Nâu hạt dẻ / tự nhiên (Đa dạng)',
    warranty: p.warranty || '24 tháng',
    shippingNote: p.shippingNote || 'Miễn phí giao hàng và lắp đặt toàn quốc.',
    mainImageUrl: p.mainImageUrl || p.image || '',
    images: Array.isArray(p.images) ? p.images : [],
    space: p.space || 'LivingRoom',
    branch: p.branch,
    branchStocksJson: p.branchStocksJson || '{}'
  };

  const res = await fetch(`${baseUrl}/api/products/${p.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(updatePayload)
  });

  return res.ok;
}

(async () => {
  console.log('=== 1. Fetching all products from LIVE ===');
  const liveProducts = await fetchAllProducts(LIVE_BASE);
  console.log(`Live total products: ${liveProducts.length}`);

  const liveNeedsUpdate = liveProducts.filter(x => !x.dimensions || x.dimensions.trim() === '');
  console.log(`Live products needing dimensions: ${liveNeedsUpdate.length}`);

  const sqlStatements = [
    '-- Migration: Populate missing dimensions for D2 Luxury products',
    'USE [Interior_Design];',
    'GO',
    ''
  ];

  let liveUpdatedCount = 0;
  for (const p of liveNeedsUpdate) {
    const dim = getStandardDimension(p);
    const sku = p.sku || p.code;
    const nameEscaped = (p.name || '').replace(/'/g, "''");
    const dimEscaped = dim.replace(/'/g, "''");

    sqlStatements.push(`UPDATE [dbo].[products] SET [Dimensions] = N'${dimEscaped}' WHERE [Sku] = '${sku}' OR [Id] = '${p.id}';`);

    const ok = await updateProductOnServer(LIVE_BASE, p, dim);
    if (ok) {
      liveUpdatedCount++;
      if (liveUpdatedCount % 10 === 0 || liveUpdatedCount === liveNeedsUpdate.length) {
        console.log(`  Updated on LIVE: ${liveUpdatedCount}/${liveNeedsUpdate.length} (latest: ${sku})`);
      }
    } else {
      console.warn(`  FAILED on LIVE for: ${sku}`);
    }
  }
  console.log(`=> Finished updating LIVE: ${liveUpdatedCount}/${liveNeedsUpdate.length} products.`);

  // Write SQL file
  const sqlContent = '\uFEFF' + sqlStatements.join('\r\n');
  const sqlPath = path.join(__dirname, 'populate_all_missing_dimensions.sql');
  fs.writeFileSync(sqlPath, sqlContent, 'utf8');
  console.log(`=> Saved SQL script to: ${sqlPath}`);

  // Also sync LOCAL backend if running
  console.log('\n=== 2. Checking and syncing LOCAL backend ===');
  try {
    const localProducts = await fetchAllProducts(LOCAL_BASE);
    console.log(`Local total products: ${localProducts.length}`);
    const localNeedsUpdate = localProducts.filter(x => !x.dimensions || x.dimensions.trim() === '');
    console.log(`Local products needing dimensions: ${localNeedsUpdate.length}`);

    let localUpdatedCount = 0;
    for (const p of localNeedsUpdate) {
      const dim = getStandardDimension(p);
      const ok = await updateProductOnServer(LOCAL_BASE, p, dim);
      if (ok) localUpdatedCount++;
    }
    console.log(`=> Finished updating LOCAL: ${localUpdatedCount}/${localNeedsUpdate.length} products.`);
  } catch (err) {
    console.warn('Local update skipped or failed:', err.message);
  }

  console.log('\n=== COMPLETE ===');
})();
