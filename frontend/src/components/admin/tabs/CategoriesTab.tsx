'use client';

import React, { useState, useMemo } from 'react';
import {
  Input,
  Button,
  Segmented,
  Tag,
  Select,
  Row,
  Col,
  Space,
  Popconfirm,
  App,
  Form,
  Drawer,
  Switch,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  FilterOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import {
  AdminDataTable,
  AdminSearchInput,
  AdminFormDrawer,
} from '@/components/admin';
import type { AdminCategory } from '@/types/admin';

export const CategoryStatusBadge = ({
  status,
  className = '',
}: {
  status: 'active' | 'hidden' | string;
  className?: string;
}) => {
  const isActive = status === 'active';
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap px-3 py-1 rounded-md text-xs font-bold tracking-wide transition-colors ${
        isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
      } ${className}`.trim()}
    >
      {isActive ? 'Đang hoạt động' : 'Tạm dừng'}
    </span>
  );
};

export interface CategoriesTabProps {
  categoriesList: AdminCategory[];
  setCategoriesList: React.Dispatch<React.SetStateAction<AdminCategory[]>>;
  selectedGlobalBranch?: string;
  onOpenCreateCategory?: () => void;
  onOpenEditCategory?: (cat: AdminCategory) => void;
  onExportCategoriesExcel?: () => void;
}

export function CategoriesTab({
  categoriesList,
  setCategoriesList,
  selectedGlobalBranch = 'all',
  onOpenCreateCategory,
  onOpenEditCategory,
  onExportCategoriesExcel,
}: CategoriesTabProps) {
  const { message } = App.useApp();
  const [selectedCategoryKeys, setSelectedCategoryKeys] = useState<React.Key[]>([]);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [categoryStatusFilter, setCategoryStatusFilter] = useState('all');
  const [categoryViewMode, setCategoryViewMode] = useState<'table' | 'grid'>('table');
  const [showCategoryDrawer, setShowCategoryDrawer] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null);
  const [categoryForm] = Form.useForm();

  const selectedCategoryRecord = categoriesList.find((c) => selectedCategoryKeys.includes(c.id));

  const handleResetCategoryFilters = () => {
    setCategorySearchQuery('');
    setCategoryStatusFilter('all');
    setSelectedCategoryKeys([]);
  };

  const handleExportCategoriesExcel = onExportCategoriesExcel || (() => message.success('Đã xuất danh mục ra Excel!'));

  const handleGenerateCategoryCode = () => {
    const existingCodes = new Set(categoriesList.map((c) => (c.code || '').toUpperCase()));
    let nextNum = categoriesList.length + 1;
    let genCode = `NH${nextNum.toString().padStart(2, '0')}`;
    while (existingCodes.has(genCode)) {
      nextNum++;
      genCode = `NH${nextNum.toString().padStart(2, '0')}`;
    }
    categoryForm.setFieldsValue({ code: genCode });
    message.success(`Đã tự động tạo mã danh mục: ${genCode}`);
  };
  
  const handleOpenCreateCategory = () => {
    if (onOpenCreateCategory) {
      onOpenCreateCategory();
      return;
    }
    setEditingCategory(null);
    const existingCodes = new Set(categoriesList.map((c) => (c.code || '').toUpperCase()));
    let nextNum = categoriesList.length + 1;
    let autoCode = `NH${nextNum.toString().padStart(2, '0')}`;
    while (existingCodes.has(autoCode)) {
      nextNum++;
      autoCode = `NH${nextNum.toString().padStart(2, '0')}`;
    }
    categoryForm.resetFields();
    categoryForm.setFieldsValue({
      name: '',
      code: autoCode,
      space: 'Phòng Khách',
      description: '',
      status: 'active',
    });
    setShowCategoryDrawer(true);
  };

  const handleOpenEditCategory = (cat: AdminCategory) => {
    if (onOpenEditCategory) {
      onOpenEditCategory(cat);
      return;
    }
    setEditingCategory(cat);
    categoryForm.setFieldsValue({
      name: cat.name,
      code: cat.code,
      space: cat.space,
      image: cat.image || '',
      description: cat.description,
      status: cat.status,
    });
    setShowCategoryDrawer(true);
  };

  const handleCopyCategory = (cat: AdminCategory) => {
    const newCat: AdminCategory = {
      ...cat,
      id: 'cat_' + Date.now(),
      name: `${cat.name} (Bản sao)`,
      code: `${cat.code}-COPY`,
      slug: `${cat.slug}-copy`,
      displayOrder: categoriesList.length + 1,
    };
    setCategoriesList((prev) => [...prev, newCat]);
    message.success(`Đã nhân bản danh mục "${cat.name}"!`);
  };

  const handleDeleteSelectedCategories = () => {
    if (!selectedCategoryKeys.length) return;
    setCategoriesList((prev) => prev.filter((c) => !selectedCategoryKeys.includes(c.id)));
    message.success(`Đã xóa ${selectedCategoryKeys.length} danh mục đã chọn!`);
    setSelectedCategoryKeys([]);
  };

  const handleCopySelectedCategory = () => {
    if (selectedCategoryRecord) {
      handleCopyCategory(selectedCategoryRecord);
    }
  };

  const handleEditSelectedCategory = () => {
    if (selectedCategoryRecord) {
      handleOpenEditCategory(selectedCategoryRecord);
    }
  };

  const handleCategoryFormSubmit = (values: any) => {
    if (editingCategory) {
      setCategoriesList((prev) =>
        prev.map((c) =>
          c.id === editingCategory.id
            ? {
                ...c,
                name: values.name,
                code: values.code || c.code,
                slug: (values.name || '').toLowerCase().replace(/\s+/g, '-'),
                space: values.space || c.space,
                image: values.image || c.image,
                description: values.description || '',
                status: values.status || c.status,
              }
            : c
        )
      );
      message.success(`Đã cập nhật danh mục "${values.name}"!`);
    } else {
      const newCat: AdminCategory = {
        id: 'cat_' + Date.now(),
        name: values.name,
        code: values.code || 'CAT-' + (categoriesList.length + 1),
        slug: (values.name || '').toLowerCase().replace(/\s+/g, '-'),
        space: values.space || 'Phòng Khách',
        displayOrder: categoriesList.length + 1,
        productCount: 0,
        status: values.status || 'active',
        description: values.description || '',
        image: values.image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80',
        featuredProduct: 'Sản phẩm nội thất',
        showOnHome: true,
        showOnMenu: true,
      };
      setCategoriesList((prev) => [...prev, newCat]);
      message.success(`Đã thêm mới danh mục "${newCat.name}"!`);
    }
    setShowCategoryDrawer(false);
  };

  const handleDeleteCategory = (id: string, name?: string) => {
    setCategoriesList((prev) => prev.filter((c) => c.id !== id));
    message.success(`Đã xóa danh mục ${name ? `"${name}"` : ''} thành công!`);
  };

  const handleChangeCategoryStatus = (cat: AdminCategory, newStatus: 'active' | 'hidden') => {
    setCategoriesList((prev) =>
      prev.map((c) => (c.id === cat.id ? { ...c, status: newStatus } : c))
    );
    message.success(`Đã cập nhật trạng thái danh mục "${cat.name}"!`);
  };

  const filteredCategories = useMemo(() => {
    return categoriesList
      .filter((cat) => {
        const matchSearch =
          !categorySearchQuery ||
          cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase()) ||
          cat.code.toLowerCase().includes(categorySearchQuery.toLowerCase()) ||
          cat.slug.toLowerCase().includes(categorySearchQuery.toLowerCase());
        const matchStatus =
          categoryStatusFilter === 'all' || cat.status === categoryStatusFilter;
        return matchSearch && matchStatus;
      })
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [categoriesList, categorySearchQuery, categoryStatusFilter]);

  return (
    <div className="space-y-4 flex-1 flex flex-col h-full">
      {/* DOMACO 2-COLUMN LAYOUT: FILTER SIDEBAR + TABLE */}
      <div className="flex flex-col lg:flex-row gap-4 items-start flex-1">
        {/* DESKTOP FILTER SIDEBAR */}
        <aside className="hidden lg:block w-60 shrink-0">
          <div className="bg-white rounded-xl shadow-xs p-4 sticky top-4 space-y-4 text-xs text-slate-700">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <FilterOutlined className="text-[#784e34]" /> Bộ lọc danh mục
              </span>
              {(categoryStatusFilter !== 'all' || categorySearchQuery) && (
                <button
                  type="button"
                  onClick={handleResetCategoryFilters}
                  className="text-[11px] text-[#784e34] hover:underline font-semibold bg-transparent border-none cursor-pointer p-0"
                >
                  Xóa lọc
                </button>
              )}
            </div>

            {/* Trạng thái hoạt động */}
            <div>
              <span className="font-semibold text-slate-800 block mb-1.5">Trạng thái</span>
              <div className="space-y-1">
                {[
                  { key: 'all', label: 'Tất cả trạng thái', count: categoriesList.length },
                  { key: 'active', label: 'Đang hiển thị', count: categoriesList.filter((c) => c.status === 'active').length },
                  { key: 'hidden', label: 'Tạm ẩn / Lưu trữ', count: categoriesList.filter((c) => c.status === 'hidden').length },
                ].map((item) => (
                  <div
                    key={item.key}
                    onClick={() => setCategoryStatusFilter(item.key)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${categoryStatusFilter === item.key ? 'bg-[#784e34]/10 text-[#784e34] font-semibold' : 'hover:bg-slate-50 text-slate-600'}`}
                  >
                    <span>{item.label}</span>
                    <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-mono">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick stats */}
            <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
              <span className="font-semibold text-slate-600 uppercase tracking-wider block text-xs">Thống kê nhanh</span>
              <div className="flex justify-between text-slate-600">
                <span>Tổng danh mục:</span>
                <span className="font-semibold text-slate-900 font-mono">{categoriesList.length}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Hiện trên trang chủ:</span>
                <span className="font-semibold text-emerald-700 font-mono">{categoriesList.filter((c) => c.showOnHome).length}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Hiện trên Menu:</span>
                <span className="font-semibold text-[#784e34] font-mono">{categoriesList.filter((c) => c.showOnMenu).length}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT: TABLE OR GRID */}
        <div className="min-w-0 flex-1 w-full">
          {categoryViewMode === 'table' ? (
            <div className="min-w-0 flex-1 w-full">
              <AdminDataTable
                enableSelectionToolbar
                selectedRowKeys={selectedCategoryKeys}
                onSelectionChange={(keys) => setSelectedCategoryKeys(keys)}
                titleText="Danh mục nhóm hàng"
                totalCount={categoriesList.length}
                countUnit="danh mục"
                onCopySelected={handleCopySelectedCategory}
                onEditSelected={handleEditSelectedCategory}
                onDeleteSelected={handleDeleteSelectedCategories}
                deleteConfirmTitle={`Xóa ${selectedCategoryKeys.length} danh mục đã chọn?`}
                onCreateNew={handleOpenCreateCategory}
                createButtonText="Tạo mới"
                searchValue={categorySearchQuery}
                onSearchChange={(val) => setCategorySearchQuery(val)}
                searchPlaceholder="Theo mã, tên danh mục, đường dẫn slug..."
                extraHeaderActions={
                  <>
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={() => {
                        handleResetCategoryFilters();
                        message.success('Đã làm mới danh mục sản phẩm!');
                      }}
                      className="!h-8 px-2.5 rounded-lg border-slate-300 bg-white text-slate-700 text-xs shadow-xs inline-flex items-center justify-center hover:text-[#784e34]"
                      title="Làm mới"
                    >
                      Làm mới
                    </Button>
                    <Button
                      icon={<DownloadOutlined />}
                      onClick={handleExportCategoriesExcel}
                      className="!h-8 px-2.5 rounded-lg border-slate-300 bg-white text-slate-700 text-xs shadow-xs inline-flex items-center justify-center hover:text-[#784e34]"
                      title="Xuất Excel"
                    >
                      Xuất Excel
                    </Button>
                    <Segmented
                      value={categoryViewMode}
                      onChange={(val: any) => setCategoryViewMode(val)}
                      options={[
                        { value: 'table', icon: <UnorderedListOutlined /> },
                        { value: 'grid', icon: <AppstoreOutlined /> },
                      ]}
                      className="!bg-slate-100 p-0.5 rounded-lg text-xs"
                    />
                  </>
                }
                dataSource={filteredCategories}
                rowKey="id"
                columns={[
                  {
                    title: 'Danh mục & Mã nhóm',
                    dataIndex: 'name',
                    key: 'name',
                    render: (_, record) => {
                      const cleanName = (record.name || '').replace(/\s*\([^)]*\)/g, '').trim();
                      return (
                        <div className="min-w-0">
                          <div
                            onClick={() => handleOpenEditCategory(record)}
                            className="font-semibold text-sm text-slate-900 hover:text-[#784e34] cursor-pointer line-clamp-1 transition-colors"
                          >
                            {cleanName}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-xs font-semibold text-[#784e34]">{record.code}</span>
                          </div>
                        </div>
                      );
                    },
                  },
                  {
                    title: 'Không gian',
                    dataIndex: 'space',
                    key: 'space',
                    width: 150,
                    render: (space) => (
                      <Tag className="text-xs font-medium border-0 bg-slate-100 text-slate-700">{space}</Tag>
                    ),
                  },
                  {
                    title: 'Số lượng SP',
                    dataIndex: 'productCount',
                    key: 'productCount',
                    align: 'center',
                    width: 120,
                    render: (count) => (
                      <span className="font-mono font-semibold text-sm text-slate-800">{count} SP</span>
                    ),
                  },
                  {
                    title: 'Trạng thái',
                    dataIndex: 'status',
                    key: 'status',
                    width: 140,
                    render: (status) => (
                      <CategoryStatusBadge status={status} />
                    ),
                  },
                  {
                    title: 'Thao tác',
                    key: 'action',
                    align: 'center',
                    width: 110,
                    render: (_, record) => (
                      <Space size={2} onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="small"
                          type="text"
                          icon={<EditOutlined className="text-sm" />}
                          onClick={() => handleOpenEditCategory(record)}
                          className="text-slate-600 hover:text-[#784e34] hover:bg-slate-100"
                          title="Chỉnh sửa"
                        />
                        <Button
                          size="small"
                          type="text"
                          icon={<CopyOutlined className="text-sm" />}
                          onClick={() => handleCopyCategory(record)}
                          className="text-slate-600 hover:text-[#784e34] hover:bg-slate-100"
                          title="Sao chép"
                        />
                        <Popconfirm
                          title="Xóa danh mục này?"
                          description={`Bạn có chắc muốn xóa "${record.name}"?`}
                          onConfirm={() => handleDeleteCategory(record.id, record.name)}
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
          ) : (
            <div className="space-y-4">
              {/* Toolbar in Grid mode */}
              <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <h3 className="m-0 text-base font-semibold text-slate-900">Danh mục nhóm hàng</h3>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                    {categoriesList.length} danh mục
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleOpenCreateCategory}
                    className="!h-8 px-3.5 !bg-[#784e34] hover:!bg-[#5d371f] text-white border-none font-bold text-xs rounded-lg shadow-xs inline-flex items-center justify-center gap-1.5"
                  >
                    Tạo mới
                  </Button>
                  <Segmented
                    value={categoryViewMode}
                    onChange={(val: any) => setCategoryViewMode(val)}
                    options={[
                      { value: 'table', icon: <UnorderedListOutlined /> },
                      { value: 'grid', icon: <AppstoreOutlined /> },
                    ]}
                    className="!bg-slate-100 p-0.5 rounded-lg text-xs"
                  />
                </div>
              </div>

              <Row gutter={[16, 16]}>
                {filteredCategories.map((cat) => {
                  const cleanName = (cat.name || '').replace(/\s*\([^)]*\)/g, '').trim();
                  return (
                    <Col xs={24} sm={12} xl={8} key={cat.id}>
                      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-shadow group flex flex-col justify-between h-full p-4">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-[10px] font-bold text-[#784e34] uppercase tracking-wider">{cat.space}</span>
                            <CategoryStatusBadge status={cat.status} />
                          </div>
                          <h4 className="font-bold text-base text-slate-900 line-clamp-1 m-0">{cleanName}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono text-xs font-semibold text-[#784e34]">{cat.code}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-xs text-slate-500 font-mono">{cat.productCount} SP</span>
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-2 m-0">{cat.description || 'Không có mô tả'}</p>
                        </div>

                      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-end">
                        <Space size="small">
                          <Button
                            size="small"
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => handleOpenEditCategory(cat)}
                            className="text-slate-600 hover:text-[#784e34]"
                          />
                          <Button
                            size="small"
                            type="text"
                            icon={<CopyOutlined />}
                            onClick={() => handleCopyCategory(cat)}
                            className="text-slate-600 hover:text-[#784e34]"
                          />
                          <Popconfirm
                            title="Xóa danh mục này?"
                            onConfirm={() => handleDeleteCategory(cat.id, cat.name)}
                            okText="Xóa"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true }}
                          >
                            <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                          </Popconfirm>
                        </Space>
                      </div>
                    </div>
                  </Col>
                );
              })}
              </Row>
            </div>
          )}
        </div>
      </div>

      {/* DRAWER: THÊM / CHỈNH SỬA DANH MỤC */}
      <AdminFormDrawer
        open={showCategoryDrawer}
        onClose={() => setShowCategoryDrawer(false)}
        form={categoryForm}
        isEditing={Boolean(editingCategory)}
        recordId={editingCategory?.code || editingCategory?.id}
        editTitle="Chỉnh sửa"
        createTitle="Thêm mới"
        size="default"
      >
        <Form
          form={categoryForm}
          layout="vertical"
          onFinish={handleCategoryFormSubmit}
          requiredMark={false}
          className="space-y-4"
        >
          <Form.Item
            label={<span className="text-xs font-semibold text-slate-700">Tên danh mục <span className="text-red-500">*</span></span>}
            name="name"
            rules={[{ required: true, message: 'Vui lòng nhập tên danh mục' }]}
          >
            <Input placeholder="VD: Sofa Gỗ Óc Chó, Bàn Ăn Hiện Đại..." className="h-10 text-sm rounded-lg" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={<span className="text-xs font-semibold text-slate-700">Mã danh mục</span>}
                name="code"
              >
                <Input
                  placeholder="Tự động hoặc nhập tay"
                  className="h-10 text-sm font-mono uppercase font-semibold rounded-lg"
                  suffix={
                    <button
                      type="button"
                      onClick={handleGenerateCategoryCode}
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
                label={<span className="text-xs font-semibold text-slate-700">Không gian nội thất</span>}
                name="space"
                initialValue="Phòng Khách"
              >
                <Select className="h-10 text-sm">
                  <Select.Option value="Phòng Khách">Phòng Khách</Select.Option>
                  <Select.Option value="Phòng Bếp & Ăn">Phòng Bếp & Ăn</Select.Option>
                  <Select.Option value="Phòng Ngủ">Phòng Ngủ</Select.Option>
                  <Select.Option value="Phòng Làm Việc">Phòng Làm Việc</Select.Option>
                  <Select.Option value="Ngoại Thất">Ngoại Thất</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label={<span className="text-xs font-semibold text-slate-700">Mô tả danh mục</span>}
            name="description"
          >
            <Input.TextArea rows={3} placeholder="Mô tả về phong cách, vật liệu hoặc bộ sưu tập..." className="text-sm rounded-lg" />
          </Form.Item>

          <Form.Item
            label={<span className="text-xs font-semibold text-slate-700">Trạng thái hoạt động</span>}
            name="status"
            initialValue="active"
          >
            <Select className="h-10 text-sm">
              <Select.Option value="active">
                <span className="text-emerald-600 font-medium">● Đang hoạt động (Hiển thị)</span>
              </Select.Option>
              <Select.Option value="hidden">
                <span className="text-slate-500 font-medium">● Tạm dừng (Ẩn)</span>
              </Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </AdminFormDrawer>
    </div>
  );
}
