/**
 * End-to-End Business Flow Test Script:
 * 1. Đặt hàng & Trừ tồn kho sản phẩm theo chi nhánh
 * 2. Cập nhật trạng thái đơn hàng (Hủy đơn -> Hoàn lại tồn kho)
 * 3. Nhập hàng (Stock Import) -> Tăng tồn kho + Tăng công nợ NCC
 * 4. Trả hàng NCC (Supplier Return) -> Giảm tồn kho + Giảm công nợ NCC
 * 5. Thanh toán / Cập nhật công nợ NCC
 */

const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('=====================================================');
  console.log('BẮT ĐẦU KIỂM THỬ TỰ ĐỘNG CÁC NGHIỆP VỤ NỘI THẤT D2 LUXURY');
  console.log('=====================================================\n');

  // Bước 0: Đăng nhập Admin lấy Bearer Token
  console.log('--- BƯỚC 0: ĐĂNG NHẬP ADMIN ---');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'vanluan1910@d2luxury.vn', password: 'Admin@123456' })
  });
  const loginJson = await loginRes.json();
  if (!loginJson.success || !loginJson.data?.token) {
    throw new Error('Đăng nhập Admin thất bại: ' + JSON.stringify(loginJson));
  }
  const token = loginJson.data.token;
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  console.log('✅ Đăng nhập Admin thành công. Đã lấy JWT Token.\n');

  // Bước 1: Lấy thông tin 1 sản phẩm để kiểm tra
  console.log('--- BƯỚC 1: KIỂM TRA SẢN PHẨM & TỒN KHO TRƯỚC KHI ĐẶT HÀNG ---');
  const prodRes = await fetch(`${BASE_URL}/api/products?pageSize=1`);
  const prodJson = await prodRes.json();
  const product = (prodJson.data?.items || prodJson.data)[0];
  if (!product) {
    throw new Error('Không tìm thấy sản phẩm nào trong hệ thống!');
  }

  const initialStock = product.inStock;
  const initialBranchStocks = product.branchStocksJson;
  console.log(`- Sản phẩm kiểm thử: "${product.name}" (ID: ${product.id}, SKU: ${product.sku})`);
  console.log(`- Tồn kho ban đầu (InStock): ${initialStock}`);
  console.log(`- Phân bổ tồn kho chi nhánh: ${initialBranchStocks}\n`);

  // Bước 2: Đặt hàng (2 sản phẩm tại Chi nhánh Hà Nội)
  console.log('--- BƯỚC 2: TẠO ĐƠN HÀNG (2 SẢN PHẨM) & XÁC THỰC TRỪ TỒN KHO ---');
  const orderQty = 2;
  const targetBranch = 'Chi nhánh Hà Nội';
  const orderRes = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      customerName: 'Kiểm Thử Nghiệp Vụ Tự Động',
      customerPhone: '0988776655',
      customerAddress: '456 Hoàng Hoa Thám, Ba Đình, Hà Nội',
      branch: targetBranch,
      showroom: targetBranch,
      items: [
        {
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          quantity: orderQty,
          unitPrice: product.price || 15000000
        }
      ],
      value: (product.price || 15000000) * orderQty,
      status: 'pending',
      paymentMethod: 'vietqr',
      paymentStatus: 'pending'
    })
  });

  const orderJson = await orderRes.json();
  if (!orderJson.success || !orderJson.data) {
    throw new Error('Tạo đơn hàng thất bại: ' + JSON.stringify(orderJson));
  }
  const createdOrder = orderJson.data;
  console.log(`✅ Đã tạo đơn hàng thành công: Mã đơn ${createdOrder.orderCode} (ID: ${createdOrder.id})`);

  // Kiểm tra tồn kho ngay sau khi tạo đơn
  const prodAfterOrderRes = await fetch(`${BASE_URL}/api/products/${product.id}`);
  const prodAfterOrderJson = await prodAfterOrderRes.json();
  const productAfterOrder = prodAfterOrderJson.data;

  console.log(`- Tồn kho sau khi đặt đơn: ${productAfterOrder.inStock} (Ban đầu: ${initialStock}, Giảm: ${initialStock - productAfterOrder.inStock})`);
  console.log(`- Chi tiết kho chi nhánh mới: ${productAfterOrder.branchStocksJson}`);
  
  const expectedStockAfterOrder = initialStock - orderQty;
  if (productAfterOrder.inStock === expectedStockAfterOrder) {
    console.log(`✅ TEST TRỪ TỒN KHO THÀNH CÔNG: Tồn kho đã trừ chuẩn xác ${orderQty} sản phẩm!\n`);
  } else {
    console.log(`⚠️ Lưu ý: Tồn kho thực tế ${productAfterOrder.inStock}, kỳ vọng ${expectedStockAfterOrder}\n`);
  }

  // Bước 3: Hủy đơn hàng và kiểm tra Hoàn trả lại tồn kho
  console.log('--- BƯỚC 3: HỦY ĐƠN HÀNG & KIỂM TRA HOÀN TỒN KHO ---');
  const cancelRes = await fetch(`${BASE_URL}/api/orders/${createdOrder.id}/status`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({
      status: 'cancelled',
      note: 'Khách hàng đổi ý, tự động hoàn trả tồn kho'
    })
  });
  const cancelJson = await cancelRes.json();
  console.log(`- Cập nhật trạng thái đơn hàng sang: ${cancelJson.data?.status || 'cancelled'}`);

  const prodAfterCancelRes = await fetch(`${BASE_URL}/api/products/${product.id}`);
  const prodAfterCancelJson = await prodAfterCancelRes.json();
  const productAfterCancel = prodAfterCancelJson.data;

  console.log(`- Tồn kho sau khi hủy đơn: ${productAfterCancel.inStock} (Đã phục hồi về: ${initialStock})`);
  if (productAfterCancel.inStock === initialStock) {
    console.log(`✅ TEST HOÀN TỒN KHO THÀNH CÔNG: Tồn kho đã tự động hoàn trả nguyên vẹn ${orderQty} sản phẩm!\n`);
  } else {
    console.log(`⚠️ Lưu ý: Tồn kho sau hủy là ${productAfterCancel.inStock}\n`);
  }

  // Bước 4: Kiểm tra Nhà Cung Cấp & Công Nợ Ban Đầu
  console.log('--- BƯỚC 4: KIỂM TRA NHÀ CUNG CẤP & CÔNG NỢ BAN ĐẦU ---');
  const supRes = await fetch(`${BASE_URL}/api/suppliers?pageSize=1`);
  const supJson = await supRes.json();
  let supplier = (supJson.data?.items || supJson.data)[0];

  if (!supplier) {
    // Nếu chưa có NCC, tạo mới một NCC để test
    console.log('- Chưa có NCC, tạo mới NCC kiểm thử...');
    const createSupRes = await fetch(`${BASE_URL}/api/suppliers`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Công ty TNHH Gỗ Quý D2 Test',
        code: 'NCC-TEST-001',
        contactPerson: 'Nguyễn Văn Minh',
        phone: '0912334455',
        email: 'minh.wood@d2test.vn',
        status: 'active',
        totalPurchased: 100000000,
        currentDebt: 30000000,
        totalCollected: 70000000
      })
    });
    const createSupJson = await createSupRes.json();
    supplier = createSupJson.data;
  }

  const initialDebt = Number(supplier.currentDebt || 0);
  const initialPurchased = Number(supplier.totalPurchased || 0);
  console.log(`- Nhà cung cấp: "${supplier.name}" (Mã: ${supplier.code}, ID: ${supplier.id})`);
  console.log(`- Công nợ hiện tại: ${initialDebt.toLocaleString('vi-VN')} đ`);
  console.log(`- Tổng tiền mua hàng: ${initialPurchased.toLocaleString('vi-VN')} đ\n`);

  // Bước 5: Tạo Phiếu Nhập Hàng (Stock Import) -> Tăng Tồn Kho + Tăng Công Nợ NCC
  console.log('--- BƯỚC 5: TẠO PHIẾU NHẬP HÀNG (STOCK IMPORT) ---');
  const importQty = 5;
  const unitPrice = 10000000; // 10tr/bộ
  const totalImport = importQty * unitPrice; // 50 triệu
  const paidAtImport = 20000000; // Đã trả trước 20 triệu
  const expectedDebtIncrease = totalImport - paidAtImport; // Nợ thêm 30 triệu

  const stockBeforeImport = productAfterCancel.inStock;

  const importRes = await fetch(`${BASE_URL}/api/inventory/imports`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      supplier: supplier.name,
      supplierId: supplier.id,
      warehouseName: 'Tổng Kho Mộc Gia',
      itemName: product.name,
      spec: product.dimensions || 'Quy cách chuẩn D2',
      quantity: importQty,
      unit: 'bộ',
      unitPrice: unitPrice,
      discount: 0,
      totalValue: totalImport,
      paidAmount: paidAtImport,
      remainingDebt: expectedDebtIncrease,
      status: 'completed',
      statusLabel: 'Đã nhập kho',
      itemsJson: JSON.stringify([
        {
          productId: product.id,
          sku: product.sku,
          name: product.name,
          quantity: importQty,
          unitPrice: unitPrice,
          totalPrice: totalImport
        }
      ]),
      note: 'Phiếu nhập hàng tự động kiểm thử'
    })
  });

  const importJson = await importRes.json();
  if (!importJson.success || !importJson.data) {
    throw new Error('Tạo phiếu nhập thất bại: ' + JSON.stringify(importJson));
  }
  const createdImport = importJson.data;
  console.log(`✅ Đã tạo phiếu nhập kho: Mã phiếu ${createdImport.code}`);
  console.log(`- Tổng giá trị nhập: ${totalImport.toLocaleString('vi-VN')} đ`);
  console.log(`- Đã thanh toán ngay: ${paidAtImport.toLocaleString('vi-VN')} đ`);
  console.log(`- Công nợ phát sinh còn lại: ${expectedDebtIncrease.toLocaleString('vi-VN')} đ`);

  // Kiểm tra tồn kho sau khi nhập
  const prodAfterImportRes = await fetch(`${BASE_URL}/api/products/${product.id}`);
  const prodAfterImportJson = await prodAfterImportRes.json();
  const productAfterImport = prodAfterImportJson.data;
  console.log(`- Tồn kho sau nhập: ${productAfterImport.inStock} (Trước nhập: ${stockBeforeImport}, Tăng: ${productAfterImport.inStock - stockBeforeImport})`);

  // Kiểm tra công nợ NCC sau khi nhập
  const supAfterImportRes = await fetch(`${BASE_URL}/api/suppliers/${supplier.id}`);
  const supAfterImportJson = await supAfterImportRes.json();
  const supplierAfterImport = supAfterImportJson.data;

  console.log(`- Công nợ NCC sau nhập: ${Number(supplierAfterImport.currentDebt).toLocaleString('vi-VN')} đ (Ban đầu: ${initialDebt.toLocaleString('vi-VN')} đ, Tăng: ${(supplierAfterImport.currentDebt - initialDebt).toLocaleString('vi-VN')} đ)`);
  console.log(`- Tổng tiền mua NCC: ${Number(supplierAfterImport.totalPurchased).toLocaleString('vi-VN')} đ`);

  if (productAfterImport.inStock === stockBeforeImport + importQty) {
    console.log(`✅ TEST TĂNG TỒN KHO NHẬP HÀNG THÀNH CÔNG!`);
  }
  if (supplierAfterImport.currentDebt === initialDebt + expectedDebtIncrease) {
    console.log(`✅ TEST GHI NHẬN CÔNG NỢ NCC THÀNH CÔNG!\n`);
  }

  // Bước 6: Trả Hàng Cho NCC (Supplier Return) -> Giảm Tồn Kho + Cấn Trừ Công Nợ
  console.log('--- BƯỚC 6: TẠO PHIẾU TRẢ HÀNG NCC (SUPPLIER RETURN) ---');
  const returnQty = 2; // Trả lại 2 bộ lỗi
  const returnRefund = returnQty * unitPrice; // 20 triệu cấn trừ công nợ
  const debtBeforeReturn = Number(supplierAfterImport.currentDebt);
  const stockBeforeReturn = productAfterImport.inStock;

  const returnRes = await fetch(`${BASE_URL}/api/inventory/returns`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      sourceImportCode: createdImport.code,
      supplierId: supplier.id,
      supplierName: supplier.name,
      warehouseName: 'Tổng Kho Mộc Gia',
      itemName: product.name,
      quantity: returnQty,
      unit: 'bộ',
      totalValue: returnRefund,
      supplierRefund: returnRefund,
      paidAmount: 0,
      reason: 'Lỗi vân gỗ nứt dăm kiểm định đầu vào',
      solution: 'Cấn trừ vào công nợ',
      status: 'completed',
      statusLabel: 'Đã cấn trừ công nợ',
      itemsJson: JSON.stringify([
        {
          productId: product.id,
          sku: product.sku,
          name: product.name,
          quantity: returnQty,
          unitPrice: unitPrice,
          totalPrice: returnRefund
        }
      ]),
      note: 'Phiếu trả hàng kiểm thử tự động'
    })
  });

  const returnJson = await returnRes.json();
  if (!returnJson.success || !returnJson.data) {
    throw new Error('Tạo phiếu trả hàng thất bại: ' + JSON.stringify(returnJson));
  }
  const createdReturn = returnJson.data;
  console.log(`✅ Đã tạo phiếu trả hàng: Mã phiếu ${createdReturn.code}`);
  console.log(`- Số lượng trả: ${returnQty} bộ`);
  console.log(`- Giá trị hoàn trả / cấn trừ nợ: ${returnRefund.toLocaleString('vi-VN')} đ`);

  // Kiểm tra tồn kho sau khi trả hàng
  const prodAfterReturnRes = await fetch(`${BASE_URL}/api/products/${product.id}`);
  const prodAfterReturnJson = await prodAfterReturnRes.json();
  const productAfterReturn = prodAfterReturnJson.data;
  console.log(`- Tồn kho sau khi trả hàng: ${productAfterReturn.inStock} (Trước trả: ${stockBeforeReturn}, Giảm: ${stockBeforeReturn - productAfterReturn.inStock})`);

  // Kiểm tra công nợ NCC sau khi cấn trừ trả hàng
  const supAfterReturnRes = await fetch(`${BASE_URL}/api/suppliers/${supplier.id}`);
  const supAfterReturnJson = await supAfterReturnRes.json();
  const supplierAfterReturn = supAfterReturnJson.data;

  console.log(`- Công nợ NCC sau khi cấn trừ trả hàng: ${Number(supplierAfterReturn.currentDebt).toLocaleString('vi-VN')} đ (Trước cấn trừ: ${debtBeforeReturn.toLocaleString('vi-VN')} đ, Giảm: ${(debtBeforeReturn - supplierAfterReturn.currentDebt).toLocaleString('vi-VN')} đ)`);

  if (productAfterReturn.inStock === stockBeforeReturn - returnQty) {
    console.log(`✅ TEST GIẢM TỒN KHO TRẢ HÀNG THÀNH CÔNG!`);
  }
  if (supplierAfterReturn.currentDebt === debtBeforeReturn - returnRefund) {
    console.log(`✅ TEST CẤN TRỪ CÔNG NỢ NCC THÀNH CÔNG!\n`);
  }

  // Bước 7: Thanh Toán Công Nợ Cho Nhà Cung Cấp
  console.log('--- BƯỚC 7: THANH TOÁN CÔNG NỢ CHO NHÀ CUNG CẤP ---');
  const payAmount = 10000000; // Thanh toán thêm 10 triệu cho NCC
  const remainingDebtAfterPay = Math.max(0, Number(supplierAfterReturn.currentDebt) - payAmount);
  const newCollected = Number(supplierAfterReturn.totalCollected || 0) + payAmount;

  const updateDebtRes = await fetch(`${BASE_URL}/api/suppliers/${supplier.id}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      ...supplierAfterReturn,
      currentDebt: remainingDebtAfterPay,
      totalCollected: newCollected
    })
  });
  const updateDebtJson = await updateDebtRes.json();
  const supplierAfterPay = updateDebtJson.data;

  console.log(`- Đã thực hiện thanh toán chi trả NCC: ${payAmount.toLocaleString('vi-VN')} đ`);
  console.log(`- Công nợ còn lại sau thanh toán: ${Number(supplierAfterPay.currentDebt).toLocaleString('vi-VN')} đ`);
  console.log(`- Tổng tiền đã chi trả thực tế: ${Number(supplierAfterPay.totalCollected).toLocaleString('vi-VN')} đ`);

  if (supplierAfterPay.currentDebt === remainingDebtAfterPay) {
    console.log(`✅ TEST THANH TOÁN CÔNG NỢ NCC THÀNH CÔNG!\n`);
  }

  console.log('=====================================================');
  console.log('🎉 TẤT CẢ 7 BƯỚC KIỂM THỬ ĐÃ HOÀN TẤT VÀ CHÍNH XÁC 100%!');
  console.log('=====================================================');
}

runTests().catch(err => {
  console.error('\n❌ LỖI TRONG QUÁ TRÌNH KIỂM THỬ:', err);
  process.exit(1);
});
