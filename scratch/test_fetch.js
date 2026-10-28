const http = require('http');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  const cats = await fetchJson('http://127.0.0.1:5000/api/categories');
  console.log('CATEGORIES:');
  (cats.data || []).forEach(c => {
    console.log(`- [${c.id}] Code: ${c.code} | Name: ${c.name} | Space: ${c.space}`);
  });

  const allProds = await fetchJson('http://127.0.0.1:5000/api/products?pageSize=200');
  const items = allProds.data?.items || [];
  console.log('\nTOTAL PRODUCTS IN DB:', items.length);

  const sofaLike = items.filter(p => 
    (p.name && p.name.toLowerCase().includes('sofa')) ||
    (p.categoryName && p.categoryName.toLowerCase().includes('sofa')) ||
    (p.sku && p.sku.startsWith('SF'))
  );

  console.log('\nSOFA LIKE PRODUCTS IN DB:', sofaLike.length);
  sofaLike.forEach(p => {
    console.log(`\nID: ${p.id} | SKU: ${p.sku} | Name: ${p.name}`);
    console.log(`  Cat: ${p.categoryName} (${p.categoryId})`);
    console.log(`  MainImage: ${p.mainImageUrl}`);
    console.log(`  Images (${p.images ? p.images.length : 0}):`, p.images);
  });
}

run().catch(console.error);
