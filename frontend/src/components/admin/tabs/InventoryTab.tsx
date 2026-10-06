'use client';

import React, { useState, useMemo } from 'react';
import {
  Button,
  Select,
  Popconfirm,
  App,
  Form,
  Input,
  InputNumber,
  Row,
  Col,
  Space,
  Tag,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  PlusOutlined,
  ReloadOutlined,
  DownloadOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import {
  AdminDataTable,
  AdminFormDrawer,
  AdminFilterSidebar,
  AdminSidebarSummary,
} from '@/components/admin';
import type { FeaturedCatalogProduct, AdminCategory } from '@/types/admin';
import { exportToExcel } from '@/utils/exportExcel';

export interface InventoryTabProps {
  catalogList: FeaturedCatalogProduct[];
  setCatalogList: React.Dispatch<React.SetStateAction<FeaturedCatalogProduct[]>>;
  categoriesList: AdminCategory[];
  selectedGlobalBranch?: string;
  onOpenCreateProduct?: () => void;
  onOpenEditProduct?: (product: FeaturedCatalogProduct) => void;
  onExportProductsExcel?: () => void;
}

export function InventoryTab({
  catalogList,
  setCatalogList,
  categoriesList,
  selectedGlobalBranch = 'all',
  onOpenCreateProduct,
  onOpenEditProduct,
  onExportProductsExcel,
}: InventoryTabProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [selectedProductKeys, setSelectedProductKeys] = useState<React.Key[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState('all');
  const [inventoryStockTag, setInventoryStockTag] = useState('all');

  // Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<FeaturedCatalogProduct | null>(null);

  const selectedProductRecord = catalogList.find((p) => selectedProductKeys.includes(p.id));

  const handleGenerateProductCode = () => {
    const existingCodes = new Set(catalogList.map((p) => (p.code || '').toUpperCase()));
    let nextNum = catalogList.length + 1;
    let genCode = `SP${nextNum.toString().padStart(4, '0')}`;
    while (existingCodes.has(genCode)) {
      nextNum++;
      genCode = `SP${nextNum.toString().padStart(4, '0')}`;
    }
    form.setFieldsValue({ code: genCode });
    message.success(`Đã tự động tạo mã sản phẩm: ${genCode}`);
  };

  const handleOpenCreateModal = () => {
    if (onOpenCreateProduct) {
      onOpenCreateProduct();
      return;
    }
    setEditingProduct(null);
    const existingCodes = new Set(catalogList.map((p) => (p.code || '').toUpperCase()));
    let nextNum = catalogList.length + 1;
    let autoCode = `SP${nextNum.toString().padStart(4, '0')}`;
    while (existingCodes.has(autoCode)) {
      nextNum++;
      autoCode = `SP${nextNum.toString().padStart(4, '0')}`;
    }
    form.resetFields();
    form.setFieldsValue({
      code: autoCode,
      categoryId: categoriesList[0]?.id || 'cat_1',
      stockType: 'in_stock',
      stockNote: 10,
      price: 15000000,
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&auto=format&fit=crop&q=80',
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEditModal = (product: FeaturedCatalogProduct) => {
    if (onOpenEditProduct) {
      onOpenEditProduct(product);
      return;
    }
    setEditingProduct(product);
    form.setFieldsValue({
      name: product.name,
      code: product.code,
      categoryId: product.categoryId,
      collection: product.collection,
      price: product.price,
      stockType: product.stockType,
      stockNote: Number(product.stockNote.replace(/\D/g, '')) || 1,
      image: product.image,
    });
    setIsDrawerOpen(true);
  };

  const handleCopyProduct = (product: FeaturedCatalogProduct) => {
    const existingCodes = new Set(catalogList.map((p) => (p.code || '').toUpperCase()));
    let nextNum = catalogList.length + 1;
    let autoCode = `SP${nextNum.toString().padStart(4, '0')}`;
    while (existingCodes.has(autoCode)) {
      nextNum++;
      autoCode = `SP${nextNum.toString().padStart(4, '0')}`;
    }
    const cloned: FeaturedCatalogProduct = {
      ...product,
      id: `prod_${Date.now()}`,
      code: autoCode,
      name: `${product.name} (Bản sao)`,
    };
    setCatalogList([cloned, ...catalogList]);
    message.success(`Đã nhân bản sản phẩm "${product.name}"!`);
  };

  const handleDeleteSelectedProducts = () => {
    if (!selectedProductKeys.length) return;
    setCatalogList((prev) => prev.filter((p) => !selectedProductKeys.includes(p.id)));
    message.success(`Đã xóa ${selectedProductKeys.length} sản phẩm đã chọn!`);
    setSelectedProductKeys([]);
  };

  const handleCopySelectedProduct = () => {
    if (selectedProductRecord) {
      handleCopyProduct(selectedProductRecord);
    }
  };

  const handleEditSelectedProduct = () => {
    if (selectedProductRecord) {
      handleOpenEditModal(selectedProductRecord);
    }
  };

  const handleSaveProduct = async (values: any) => {
    const selectedCategory = categoriesList.find((c) => c.id === values.categoryId);

    if (editingProduct) {
      // Edit
      setCatalogList((prev) =>
        prev.map((item) =>
          item.id === editingProduct.id
            ? {
                ...item,
                ...values,
                categoryName: selectedCategory?.name || values.collection,
                stockNote: `${values.stockNote || 1} chiếc`,
              }
            : item
        )
      );
      message.success(`Đã cập nhật sản phẩm "${values.name}" thành công!`);
    } else {
      // Create
      const newProduct: FeaturedCatalogProduct = {
        id: `prod_${Date.now()}`,
        code: values.code || `SP${(catalogList.length + 1).toString().padStart(4, '0')}`,
        name: values.name,
        collection: values.collection || 'Bộ Sưu Tập Mới',
        categoryName: selectedCategory?.name || 'Nội Thất Gỗ',
        categoryId: values.categoryId || categoriesList[0]?.id || 'cat_1',
        price: values.price || 0,
        image: values.image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&auto=format&fit=crop&q=80',
        stockType: values.stockType || 'in_stock',
        stockNote: `${values.stockNote || 1} chiếc`,
      };
      setCatalogList([newProduct, ...catalogList]);
      message.success(`Đã thêm mới sản phẩm "${newProduct.name}" thành công!`);
    }
    setIsDrawerOpen(false);
  };

  const handleExportProductsExcel = () => {
    if (onExportProductsExcel) {
      onExportProductsExcel();
      return;
    }
    const exportData = catalogList.map((p) => {
      const cat = categoriesList.find((c) => c.id === p.categoryId)?.name || p.categoryName;
      return {
        'Mã sản phẩm': p.code,
        'Tên sản phẩm': p.name,
        'Danh mục': cat,
        'Bộ sưu tập': p.collection,
        'Tồn kho': p.stockNote,
        'Giá niêm yết (VNĐ)': p.price,
      };
    });
    exportToExcel(exportData, 'Danh_muc_san_pham');
    message.success('Đã xuất danh mục sản phẩm ra Excel thành công!');
  };

  const filteredCatalog = useMemo(() => {
    return catalogList.filter((prod) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match =
          prod.name.toLowerCase().includes(q) ||
          prod.code.toLowerCase().includes(q) ||
          prod.collection.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (inventoryCategoryFilter !== 'all') {
        if (prod.categoryId !== inventoryCategoryFilter) return false;
      }
      if (inventoryStockTag !== 'all') {
        if (prod.stockType !== inventoryStockTag) return false;
      }
      return true;
    });
  }, [catalogList, searchQuery, inventoryCategoryFilter, inventoryStockTag]);

  return (
    <div className="space-y-4 flex-1 flex flex-col h-full">
      {/* STANDARDIZED 2-COLUMN LAYOUT: SHARED FILTER SIDEBAR + TABLE */}
      <div className="flex flex-col lg:flex-row gap-4 items-start flex-1">
        {/* LEFT FILTER SIDEBAR */}
        <AdminFilterSidebar
          title="Bộ lọc sản phẩm"
          hasActiveFilters={Boolean(searchQuery || inventoryCategoryFilter !== 'all' || inventoryStockTag !== 'all')}
          onResetFilters={() => {
            setSearchQuery('');
            setInventoryCategoryFilter('all');
            setInventoryStockTag('all');
            setSelectedProductKeys([]);
          }}
        >
          {/* Filter 1: Danh mục thiết kế */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-800 text-xs block">Danh mục thiết kế</label>
            <Select
              value={inventoryCategoryFilter}
              onChange={(v) => setInventoryCategoryFilter(v)}
              className="w-full text-xs"
              size="small"
              options={[
                { value: 'all', label: 'Tất cả danh mục' },
                ...categoriesList.map((c) => ({
                  value: c.id,
                  label: `${c.code} - ${c.name}`,
                })),
              ]}
            />
          </div>

          {/* Filter 2: Tình trạng tồn kho */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="font-semibold text-slate-800 text-xs block">Tình trạng tồn kho</label>
            <Select
              value={inventoryStockTag}
              onChange={(v) => setInventoryStockTag(v)}
              className="w-full text-xs"
              size="small"
              options={[
                { value: 'all', label: 'Tất cả trạng thái' },
                { value: 'in_stock', label: 'Còn hàng sẵn' },
                { value: 'custom', label: 'May đo theo đơn' },
                { value: 'low', label: 'Sắp hết hàng' },
              ]}
            />
          </div>

          {/* Quick Summary Card */}
          <AdminSidebarSummary
            title="Thống kê thiết kế"
            items={[
              { label: 'Tổng mẫu thiết kế', value: `${catalogList.length} mẫu` },
              { label: 'Đang sẵn tại kho', value: `${catalogList.filter((p) => p.stockType === 'in_stock').length} mẫu`, color: 'success' },
              { label: 'May đo theo đơn', value: `${catalogList.filter((p) => p.stockType === 'custom').length} mẫu`, color: 'primary' },
              { label: 'Cần bổ sung/Ít', value: `${catalogList.filter((p) => p.stockType === 'low').length} mẫu`, color: 'danger' },
            ]}
          />
        </AdminFilterSidebar>

        {/* RIGHT MAIN CONTENT CONTAINER */}
        <div className="flex-1 w-full min-w-0">
          {/* CATALOG PRODUCTS TABLE WITH SELECTION TOOLBAR */}
          <AdminDataTable
            enableSelectionToolbar
            selectedRowKeys={selectedProductKeys}
            onSelectionChange={(keys) => setSelectedProductKeys(keys)}
            titleText="Quản lý sản phẩm"
            totalCount={catalogList.length}
            countUnit="sản phẩm"
            onCopySelected={handleCopySelectedProduct}
            onEditSelected={handleEditSelectedProduct}
            onDeleteSelected={handleDeleteSelectedProducts}
            deleteConfirmTitle={`Xóa ${selectedProductKeys.length} sản phẩm đã chọn?`}
            onCreateNew={handleOpenCreateModal}
            createButtonText="Thêm mới"
            searchValue={searchQuery}
            onSearchChange={(val) => setSearchQuery(val)}
            searchPlaceholder="Tìm theo mã sản phẩm, tên, bộ sưu tập..."
            extraHeaderActions={
              <>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    setSearchQuery('');
                    setInventoryCategoryFilter('all');
                    setInventoryStockTag('all');
                    setSelectedProductKeys([]);
                    message.success('Đã làm mới danh mục sản phẩm!');
                  }}
                  className="!h-8 px-2.5 rounded-lg border-slate-300 bg-white text-slate-700 text-xs shadow-xs inline-flex items-center justify-center hover:text-[#784e34]"
                  title="Làm mới"
                >
                  Làm mới
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={handleExportProductsExcel}
                  className="!h-8 px-2.5 rounded-lg border-slate-300 bg-white text-slate-700 text-xs shadow-xs inline-flex items-center justify-center hover:text-[#784e34]"
                  title="Xuất Excel"
                >
                  Xuất Excel
                </Button>
              </>
            }
            dataSource={filteredCatalog}
            rowKey="id"
            columns={[
              {
                title: 'Mã / Tên sản phẩm',
                dataIndex: 'name',
                key: 'name',
                render: (text, prod) => {
                  const catName = categoriesList.find((c) => c.id === prod.categoryId)?.name || prod.categoryName || prod.collection;
                  return (
                    <div className="min-w-0">
                      <div
                        onClick={() => handleOpenEditModal(prod)}
                        className="font-semibold text-slate-900 text-sm hover:text-[#784e34] cursor-pointer transition-colors"
                      >
                        {text}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-xs font-semibold text-[#784e34]">{prod.code}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs text-slate-500">{catName}</span>
                      </div>
                    </div>
                  );
                },
              },
              {
                title: 'Tồn kho',
                dataIndex: 'stockNote',
                key: 'stockNote',
                align: 'center',
                width: 140,
                render: (note, prod) => {
                  const rawNum = prod.stockNote ? prod.stockNote.replace(/\D/g, '') : '';
                  const count = rawNum !== '' ? parseInt(rawNum, 10) : 0;
                  return (
                    <span className="font-mono font-semibold text-xs text-slate-800">
                      {count} chiếc
                    </span>
                  );
                },
              },
              {
                title: 'Giá niêm yết',
                dataIndex: 'price',
                key: 'price',
                align: 'right',
                width: 160,
                render: (p) => (
                  <span className="font-mono font-bold text-sm text-[#784e34]">
                    {p.toLocaleString('vi-VN')} đ
                  </span>
                ),
              },
              {
                title: 'Tình trạng',
                dataIndex: 'stockType',
                key: 'stockType',
                align: 'center',
                width: 140,
                render: (type) => {
                  if (type === 'in_stock') {
                    return <Tag className="border-0 bg-emerald-50 text-emerald-700 text-xs font-medium">Hàng có sẵn</Tag>;
                  }
                  if (type === 'custom') {
                    return <Tag className="border-0 bg-blue-50 text-blue-700 text-xs font-medium">May đo</Tag>;
                  }
                  return <Tag className="border-0 bg-amber-50 text-amber-700 text-xs font-medium">Sắp hết</Tag>;
                },
              },
              {
                title: 'Thao tác',
                key: 'action',
                align: 'center',
                width: 110,
                render: (_, prod) => (
                  <Space size={2} onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="small"
                      type="text"
                      icon={<EditOutlined className="text-sm" />}
                      onClick={() => handleOpenEditModal(prod)}
                      className="text-slate-600 hover:text-[#784e34] hover:bg-slate-100"
                      title="Chỉnh sửa"
                    />
                    <Button
                      size="small"
                      type="text"
                      icon={<CopyOutlined className="text-sm" />}
                      onClick={() => handleCopyProduct(prod)}
                      className="text-slate-600 hover:text-[#784e34] hover:bg-slate-100"
                      title="Sao chép"
                    />
                    <Popconfirm
                      title="Xóa sản phẩm này?"
                      description={`Bạn có chắc muốn xóa "${prod.name}"?`}
                      onConfirm={() => {
                        setCatalogList((prev) => prev.filter((p) => p.id !== prod.id));
                        message.success(`Đã xóa sản phẩm ${prod.name}!`);
                      }}
                      okText="Xóa"
                      cancelText="Hủy"
                      okButtonProps={{ danger: true }}
                    >
                      <Button
                        size="small"
                        type="text"
                        icon={<DeleteOutlined className="text-sm" />}
                        className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                        title="Xóa"
                      />
                    </Popconfirm>
                  </Space>
                ),
              },
            ]}
          />
        </div>
      </div>

      {/* CREATE / EDIT PRODUCT DRAWER (STANDARDIZED ADMIN FORM DRAWER) */}
      <AdminFormDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        form={form}
        isEditing={Boolean(editingProduct)}
        recordId={editingProduct?.code || editingProduct?.id}
        editTitle="Chỉnh sửa"
        createTitle="Thêm mới"
        size="default"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveProduct}
          requiredMark={false}
          className="space-y-4"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={<span className="text-xs font-semibold text-slate-700">Mã sản phẩm <span className="text-red-500">*</span></span>}
                name="code"
                rules={[{ required: true, message: 'Vui lòng nhập mã sản phẩm' }]}
              >
                <Input
                  placeholder="Tự động hoặc nhập tay"
                  className="h-10 text-sm font-mono uppercase font-semibold rounded-lg"
                  suffix={
                    <button
                      type="button"
                      onClick={handleGenerateProductCode}
                      className="text-[#784e34] hover:text-[#5d371f] border-none bg-transparent cursor-pointer p-0.5 inline-flex items-center"
                      title="Tự động tạo mã"
                    >
                      <ThunderboltOutlined className="text-sm" />
                    </button>
                  }
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={<span className="text-xs font-semibold text-slate-700">Danh mục thiết kế <span className="text-red-500">*</span></span>}
                name="categoryId"
                rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
              >
                <Select
                  placeholder="Chọn danh mục"
                  className="h-10 text-sm"
                  options={categoriesList.map((c) => ({
                    value: c.id,
                    label: `${c.code} - ${(c.name || '').replace(/\s*\([^)]*\)/g, '').trim()}`,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label={<span className="text-xs font-semibold text-slate-700">Tên sản phẩm <span className="text-red-500">*</span></span>}
            name="name"
            rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}
          >
            <Input placeholder="VD: Sofa Gỗ Óc Chó Kyoto, Bàn Ăn Komorebi..." className="h-10 text-sm rounded-lg" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={<span className="text-xs font-semibold text-slate-700">Bộ sưu tập</span>}
                name="collection"
              >
                <Input placeholder="VD: Kyoto Collection 2026" className="h-10 text-sm rounded-lg" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={<span className="text-xs font-semibold text-slate-700">Giá niêm yết <span className="text-red-500">*</span></span>}
                name="price"
                rules={[{ required: true, message: 'Vui lòng nhập giá niêm yết' }]}
              >
                <InputNumber
                  className="!w-full h-10 text-sm rounded-lg"
                  controls={false}
                  formatter={(val) => (val !== undefined && val !== null ? `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '')}
                  parser={(val) => (val ? Number(val.replace(/\$\s?|(,*)/g, '')) : 0)}
                  placeholder="VD: 38,500,000"
                  suffix={<span className="text-xs text-slate-400 font-normal">VNĐ</span>}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={<span className="text-xs font-semibold text-slate-700">Tình trạng tồn kho</span>}
                name="stockType"
              >
                <Select
                  className="h-10 text-sm"
                  options={[
                    { value: 'in_stock', label: 'Còn hàng sẵn' },
                    { value: 'custom', label: 'May đo theo đơn' },
                    { value: 'low', label: 'Sắp hết hàng' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={<span className="text-xs font-semibold text-slate-700">Số lượng tồn kho</span>}
                name="stockNote"
              >
                <InputNumber
                  min={0}
                  className="!w-full h-10 text-sm rounded-lg"
                  controls={false}
                  placeholder="VD: 10"
                  suffix={<span className="text-xs text-slate-400 font-normal">chiếc</span>}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </AdminFormDrawer>
    </div>
  );
}

