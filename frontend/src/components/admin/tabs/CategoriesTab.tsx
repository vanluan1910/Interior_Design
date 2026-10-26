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
  InputNumber,
  Switch,
  Tooltip,
} from 'antd';
import {
  DownloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  FilterOutlined,
  AppstoreOutlined,
  HomeOutlined,
  FileExcelOutlined,
  ReloadOutlined,
  UploadOutlined,
  CloseCircleFilled,
  GlobalOutlined,
} from '@ant-design/icons';
import {
  Upload,
} from 'antd';
import {
  AdminDataTable,
  AdminFormDrawer,
  AutoCodeButton,
  getNextCode,
} from '@/components/admin';
import type { AdminCategory, AdminSpace } from '@/types/admin';
import { categoryApi } from '@/api/categoryApi';
import { spaceApi } from '@/api/spaceApi';
import { uploadApi } from '@/api/uploadApi';

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

const SpaceImageCell = ({
  image,
  code,
  name,
  onEdit,
}: {
  image?: string;
  code?: string;
  name?: string;
  onEdit: () => void;
}) => {
  const [imgError, setImgError] = useState(false);
  const cleanImage = image && image.trim();
  const showImage = Boolean(cleanImage && !imgError);

  return (
    <div
      onClick={onEdit}
      className="w-11 h-11 mx-auto rounded-lg overflow-hidden border border-slate-200/90 bg-slate-50 shadow-xs flex items-center justify-center group cursor-pointer hover:border-[#784e34] transition-all relative select-none"
      title={`Bấm để xem / chỉnh sửa ảnh (${name || 'Không gian'})`}
    >
      {showImage ? (
        <img
          src={cleanImage}
          alt={name || 'Không gian'}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="w-full h-full bg-amber-50/90 border border-amber-200/60 flex items-center justify-center text-[#784e34] font-bold text-xs font-mono">
          {code || 'KG'}
        </div>
      )}
    </div>
  );
};

export interface CategoriesTabProps {
  categoriesList: AdminCategory[];
  setCategoriesList: React.Dispatch<React.SetStateAction<AdminCategory[]>>;
  spacesList?: AdminSpace[];
  setSpacesList?: React.Dispatch<React.SetStateAction<AdminSpace[]>>;
  selectedGlobalBranch?: string;
  onOpenCreateCategory?: () => void;
  onOpenEditCategory?: (cat: AdminCategory) => void;
  onExportCategoriesExcel?: () => void;
}

export function CategoriesTab({
  categoriesList,
  setCategoriesList,
  spacesList = [],
  setSpacesList,
  selectedGlobalBranch = 'all',
  onOpenCreateCategory,
  onOpenEditCategory,
  onExportCategoriesExcel,
}: CategoriesTabProps) {
  const { message, modal } = App.useApp();
  
  // Tab Switcher: 'categories' (Danh mục nhóm hàng) vs 'spaces' (Không gian nội thất)
  const [activeSubTab, setActiveSubTab] = useState<'categories' | 'spaces'>('categories');

  // Local fallback state for spaces if not provided from parent
  const [localSpacesList, setLocalSpacesList] = useState<AdminSpace[]>(spacesList);
  const currentSpacesList = spacesList || localSpacesList;
  const updateSpacesList = (updater: React.SetStateAction<AdminSpace[]>) => {
    if (setSpacesList) {
      setSpacesList(updater);
    } else {
      setLocalSpacesList(updater);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('spaces_changed'));
    }
  };

  // --- CATEGORIES STATE ---
  const [selectedCategoryKeys, setSelectedCategoryKeys] = useState<React.Key[]>([]);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [categoryStatusFilter, setCategoryStatusFilter] = useState('all');
  const [categorySpaceFilter, setCategorySpaceFilter] = useState('all');
  const [showCategoryDrawer, setShowCategoryDrawer] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null);
  const [categoryForm] = Form.useForm();
  const [importingCategoryExcel, setImportingCategoryExcel] = useState(false);
  const [uploadingCategoryImage, setUploadingCategoryImage] = useState(false);
  const currentCategoryImage = Form.useWatch('image', categoryForm);

  const handleUploadCategoryImage = async (file: File) => {
    setUploadingCategoryImage(true);
    try {
      const url = await uploadApi.uploadFile(file);
      categoryForm.setFieldsValue({ image: url });
      message.success('Tải ảnh đại diện danh mục thành công!');
    } catch (err: any) {
      message.error(err?.message || 'Tải ảnh thất bại.');
    } finally {
      setUploadingCategoryImage(false);
    }
    return false;
  };

  // --- SPACES STATE ---
  const [selectedSpaceKeys, setSelectedSpaceKeys] = useState<React.Key[]>([]);
  const [spaceSearchQuery, setSpaceSearchQuery] = useState('');
  const [spaceStatusFilter, setSpaceStatusFilter] = useState('all');
  const [showSpaceDrawer, setShowSpaceDrawer] = useState(false);
  const [editingSpace, setEditingSpace] = useState<AdminSpace | null>(null);
  const [spaceForm] = Form.useForm();
  const [uploadingSpaceImage, setUploadingSpaceImage] = useState(false);
  const currentSpaceImage = Form.useWatch('image', spaceForm);

  const handleUploadSpaceImage = async (file: File) => {
    setUploadingSpaceImage(true);
    try {
      const url = await uploadApi.uploadFile(file);
      spaceForm.setFieldsValue({ image: url });
      message.success('Tải ảnh không gian thành công!');
    } catch (err: any) {
      message.error(err?.message || 'Tải ảnh thất bại.');
    } finally {
      setUploadingSpaceImage(false);
    }
    return false;
  };

  const selectedCategoryRecord = categoriesList.find((c) => selectedCategoryKeys.includes(c.id));
  const selectedSpaceRecord = currentSpacesList.find((s) => selectedSpaceKeys.includes(s.id));

  // --- CATEGORY ACTIONS ---
  const handleResetCategoryFilters = () => {
    setCategorySearchQuery('');
    setCategoryStatusFilter('all');
    setCategorySpaceFilter('all');
    setSelectedCategoryKeys([]);
  };

  const handleRefreshCategories = async () => {
    try {
      const refreshed = await categoryApi.getCategories({ forceRefresh: true });
      setCategoriesList(refreshed);
      message.success('Đã làm mới danh mục nhóm hàng thành công!');
    } catch (err: any) {
      message.error(err?.message || 'Làm mới thất bại.');
    }
  };

  const handleImportCategoryExcel = async (file: File) => {
    setImportingCategoryExcel(true);
    const hideLoading = message.loading('Đang xử lý đọc file Excel và nhập danh mục...', 0);
    try {
      const XLSX = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      
      // Ưu tiên sheet Danh mục nếu có, hoặc sheet San_Pham / Sản phẩm / đầu tiên
      const categorySheetName = workbook.SheetNames.find((s) =>
        ['danh mục', 'danh muc', 'categories', 'nhóm hàng', 'nhom hang', 'san_pham', 'sản phẩm', 'san pham'].includes(s.trim().toLowerCase())
      ) || workbook.SheetNames[0];

      const worksheet = workbook.Sheets[categorySheetName];
      const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet);

      if (!rawRows || rawRows.length === 0) {
        throw new Error('File Excel không có dữ liệu danh mục.');
      }

      // Thu thập thông tin và đếm số lần xuất hiện của không gian cho từng danh mục
      const categoryMap = new Map<string, {
        name: string;
        code?: string;
        spaceCounts: Record<string, number>;
        description?: string;
        slug?: string;
        status: string;
        displayOrder: number;
        badge?: string;
        featuredProduct?: string;
      }>();

      rawRows.forEach((row: any, idx: number) => {
        const rawName = String(
          row['Danh mục'] ||
          row['Tên danh mục'] ||
          row['Tên nhóm hàng'] ||
          row['Tên nhóm'] ||
          row['name'] ||
          row['Tên'] ||
          row['Category'] ||
          row['Bộ sưu tập'] ||
          ''
        ).trim();

        if (!rawName) return;

        // Tách các tên danh mục nếu có dấu phẩy
        const names = rawName.split(',').map((n) => n.trim()).filter(Boolean);
        const explicitCode = String(row['Mã danh mục'] || row['Mã nhóm'] || row['Mã nhóm hàng'] || row['code'] || '').trim();
        const rawSpace = String(row['Không gian'] || row['Không gian nội thất'] || row['space'] || row['Space'] || '').trim();
        const description = String(row['Mô tả'] || row['Mô tả chi tiết'] || row['description'] || '').trim();
        const slug = String(row['Đường dẫn'] || row['Slug'] || row['slug'] || '').trim();
        const rawStatus = String(row['Trạng thái'] || row['status'] || 'active').trim().toLowerCase();
        const status = (rawStatus === 'tạm dừng' || rawStatus === 'hidden' || rawStatus === 'tạm ẩn') ? 'hidden' : 'active';
        const displayOrder = parseInt(String(row['Thứ tự'] || row['Thứ tự hiển thị'] || row['displayOrder'] || idx + 1), 10) || idx + 1;
        const badge = String(row['Huy hiệu'] || row['badge'] || '').trim();
        const featuredProduct = String(row['Sản phẩm tiêu biểu'] || row['featuredProduct'] || '').trim();

        names.forEach((name) => {
          const key = name.toLowerCase();
          if (!categoryMap.has(key)) {
            categoryMap.set(key, {
              name,
              code: explicitCode && (explicitCode.startsWith('NH') || explicitCode.startsWith('DM')) ? explicitCode : undefined,
              spaceCounts: {},
              description: description || `Danh mục sản phẩm ${name}`,
              slug: slug || undefined,
              status,
              displayOrder: displayOrder,
              badge,
              featuredProduct,
            });
          }

          const entry = categoryMap.get(key)!;
          if (rawSpace) {
            const firstSpace = rawSpace.split(',')[0].trim();
            if (firstSpace) {
              entry.spaceCounts[firstSpace] = (entry.spaceCounts[firstSpace] || 0) + 1;
            }
          }
        });
      });

      const categoriesToImport = Array.from(categoryMap.values()).map((entry) => {
        const lowerName = entry.name.toLowerCase();
        let determinedSpace = '';

        // 1. Quy tắc chuyên ngành nội thất để tránh lỗi nhãn lẫn lộn từ file Excel
        if (lowerName.includes('bàn trà') || lowerName.includes('bàn nước') || lowerName.includes('sofa') || lowerName.includes('kệ tivi') || lowerName.includes('tủ giày')) {
          determinedSpace = 'Phòng khách';
        } else if (lowerName.includes('bàn ăn') || lowerName.includes('ghế ăn') || lowerName.includes('chạn ly') || lowerName.includes('tủ bếp')) {
          determinedSpace = 'Phòng ăn';
        } else if (lowerName.includes('giường') || lowerName.includes('táp') || lowerName.includes('tủ áo') || lowerName.includes('quần áo') || lowerName.includes('trang điểm')) {
          determinedSpace = 'Phòng ngủ';
        } else if (lowerName.includes('làm việc') || lowerName.includes('giá sách') || lowerName.includes('kệ sách')) {
          determinedSpace = 'Phòng làm việc';
        }

        // 2. Nếu không thuộc từ khóa đặc trưng, lấy không gian chiếm đa số từ các dòng dữ liệu
        if (!determinedSpace) {
          const spaces = Object.entries(entry.spaceCounts);
          if (spaces.length > 0) {
            spaces.sort((a, b) => b[1] - a[1]);
            determinedSpace = spaces[0][0];
          }
        }

        if (!determinedSpace) {
          determinedSpace = 'Phòng khách';
        }

        // 3. Chuẩn hóa SpaceId khớp với danh sách không gian thực tế trong hệ thống
        const matchedSpace = currentSpacesList.find((s) =>
          s.name.toLowerCase() === determinedSpace.toLowerCase() ||
          s.name.toLowerCase().includes(determinedSpace.toLowerCase()) ||
          determinedSpace.toLowerCase().includes(s.name.toLowerCase()) ||
          (s.code && s.code.toLowerCase() === determinedSpace.toLowerCase())
        );

        return {
          name: entry.name,
          code: entry.code,
          space: matchedSpace ? matchedSpace.name : determinedSpace,
          spaceId: matchedSpace ? matchedSpace.id : undefined,
          description: entry.description,
          slug: entry.slug,
          status: entry.status,
          displayOrder: entry.displayOrder,
          badge: entry.badge,
          featuredProduct: entry.featuredProduct,
          showOnHome: true,
          showOnMenu: true,
        };
      });

      if (categoriesToImport.length === 0) {
        throw new Error('Không tìm thấy dòng danh mục hợp lệ trong file Excel.');
      }

      const result = await categoryApi.bulkImportCategories(categoriesToImport);
      hideLoading();
      message.success(result.message || `Đã nhập thành công ${result.count} danh mục!`);

      const updated = await categoryApi.getCategories();
      setCategoriesList(updated);
    } catch (err: any) {
      hideLoading();
      message.error(err?.message || 'Có lỗi xảy ra khi nhập file Excel danh mục.');
    } finally {
      setImportingCategoryExcel(false);
    }
    return false;
  };

  const handleExportCategoriesExcel = onExportCategoriesExcel || (() => message.success('Đã xuất danh mục ra Excel!'));

  const handleGenerateCategoryCode = () => {
    const currentCode = categoryForm.getFieldValue('code');
    const genCode = getNextCode(currentCode, categoriesList, 'NH', 2);
    categoryForm.setFieldsValue({ code: genCode });
    message.success(`Đã tự động tạo mã danh mục mới: ${genCode}`);
  };
  
  const handleOpenCreateCategory = () => {
    if (onOpenCreateCategory) {
      onOpenCreateCategory();
      return;
    }
    setEditingCategory(null);
    const existingCodes = new Set(categoriesList.map((c) => (c.code || '').toUpperCase()));
    let nextNum = 1;
    let autoCode = `NH${nextNum.toString().padStart(2, '0')}`;
    while (existingCodes.has(autoCode)) {
      nextNum++;
      autoCode = `NH${nextNum.toString().padStart(2, '0')}`;
    }
    setShowCategoryDrawer(true);
    setTimeout(() => {
      categoryForm.resetFields();
      categoryForm.setFieldsValue({
        name: '',
        code: autoCode,
        space: currentSpacesList[0]?.name || 'Phòng Khách',
        description: '',
        displayOrder: categoriesList.length + 1,
        status: 'active',
        showOnHome: true,
        showOnMenu: true,
      });
    }, 0);
  };

  const handleOpenEditCategory = (cat: AdminCategory) => {
    if (onOpenEditCategory) {
      onOpenEditCategory(cat);
      return;
    }
    setEditingCategory(cat);
    setShowCategoryDrawer(true);
    setTimeout(() => {
      categoryForm.resetFields();
      categoryForm.setFieldsValue({
        name: cat.name,
        code: cat.code,
        space: cat.space || currentSpacesList[0]?.name || 'Phòng Khách',
        description: cat.description,
        displayOrder: cat.displayOrder ?? 1,
        status: cat.status,
        showOnHome: cat.showOnHome ?? true,
        showOnMenu: cat.showOnMenu ?? true,
      });
    }, 0);
  };

  const handleCopyCategory = async (cat: AdminCategory) => {
    const existingCodes = new Set(categoriesList.map((c) => (c.code || '').toUpperCase()));
    let nextNum = 1;
    let genCode = `NH${nextNum.toString().padStart(2, '0')}`;
    while (existingCodes.has(genCode)) {
      nextNum++;
      genCode = `NH${nextNum.toString().padStart(2, '0')}`;
    }
    const clonedPayload: Partial<AdminCategory> = {
      ...cat,
      name: `${cat.name} (Bản sao)`,
      code: genCode,
      slug: `${cat.slug}-copy`,
      displayOrder: categoriesList.length + 1,
    };
    try {
      const created = await categoryApi.createCategory(clonedPayload);
      setCategoriesList((prev) => [...prev, created]);
    } catch {
      const newCat: AdminCategory = {
        ...clonedPayload,
        id: 'cat_' + Date.now(),
      } as AdminCategory;
      setCategoriesList((prev) => [...prev, newCat]);
    }
    message.success(`Đã nhân bản danh mục "${cat.name}"!`);
  };

  const handleDeleteSelectedCategories = async () => {
    if (!selectedCategoryKeys.length) return;
    const categoriesWithProducts = categoriesList.filter(
      (c) => selectedCategoryKeys.includes(c.id) && (c.productCount || 0) > 0
    );
    if (categoriesWithProducts.length > 0) {
      modal.warning({
        title: 'Không thể xóa các danh mục đang có sản phẩm',
        centered: true,
        okText: 'Đã hiểu',
        okButtonProps: { className: '!bg-[#784e34] hover:!bg-[#5c3c28]' },
        content: (
          <div className="space-y-2 mt-2">
            <p className="text-slate-700">
              Phát hiện <b>{categoriesWithProducts.length} danh mục</b> đang có sản phẩm trực thuộc:
            </p>
            <div className="max-h-40 overflow-y-auto space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              {categoriesWithProducts.map((c) => (
                <div key={c.id} className="flex justify-between items-center text-xs py-0.5 border-b border-slate-100 last:border-0">
                  <span className="font-semibold text-slate-800">{c.name}</span>
                  <span className="font-mono text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded">{c.productCount} SP</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 p-2.5 rounded-lg mt-2">
              ⚠️ <b>Quy định hệ thống:</b> Vui lòng chuyển các sản phẩm sang danh mục khác hoặc xóa sản phẩm trước khi thực hiện xóa danh mục!
            </p>
          </div>
        ),
      });
      message.error(
        `Không thể xóa ${categoriesWithProducts.length} danh mục đang có sản phẩm. Vui lòng chuyển hoặc xóa sản phẩm trước!`
      );
      return;
    }
    try {
      await Promise.all(
        selectedCategoryKeys.map((k) => categoryApi.deleteCategory(String(k)))
      );
      setCategoriesList((prev) => prev.filter((c) => !selectedCategoryKeys.includes(c.id)));
      message.success(`Đã xóa ${selectedCategoryKeys.length} danh mục đã chọn!`);
      setSelectedCategoryKeys([]);
    } catch (e: any) {
      modal.error({
        title: 'Xóa danh mục thất bại',
        content: e?.message || 'Có lỗi xảy ra khi xóa danh mục.',
        okText: 'Đóng',
        centered: true,
      });
      message.error(e?.message || 'Xóa danh mục thất bại.');
    }
  };

  const handleRequestDeleteCategory = (record: AdminCategory) => {
    const pCount = record.productCount || 0;
    if (pCount > 0) {
      modal.warning({
        title: 'Không thể xóa danh mục này',
        centered: true,
        okText: 'Đã hiểu',
        okButtonProps: { className: '!bg-[#784e34] hover:!bg-[#5c3c28]' },
        content: (
          <div className="space-y-2 mt-2">
            <p className="text-slate-700">
              Danh mục <b>"{record.name}"</b> hiện đang có <b className="text-rose-600 font-bold">{pCount} sản phẩm</b> trực thuộc.
            </p>
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 p-2.5 rounded-lg mt-2">
              ⚠️ <b>Quy định hệ thống:</b> Để bảo đảm tính toàn vẹn dữ liệu hàng hóa, bạn không thể xóa danh mục khi vẫn còn sản phẩm. Vui lòng chuyển các sản phẩm sang danh mục khác hoặc xóa sản phẩm trước!
            </p>
          </div>
        ),
      });
      message.error(`Không thể xóa danh mục "${record.name}" vì đang có ${pCount} sản phẩm thuộc danh mục này!`);
      return;
    }

    modal.confirm({
      title: 'Xác nhận xóa danh mục',
      content: `Bạn có chắc muốn xóa danh mục "${record.name}"? Danh mục sẽ được chuyển vào thùng rác.`,
      okText: 'Xóa',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      centered: true,
      onOk: () => handleDeleteCategory(record.id, record.name),
    });
  };

  const handleCategoryFormSubmit = async (values: any) => {
    const autoSlug = (values.name || '').toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    const spaceVal = values.space || currentSpacesList[0]?.name || 'Phòng Khách';
    const foundSpace = currentSpacesList.find(
      (s) => s.name.toLowerCase() === spaceVal.toLowerCase() || s.code.toLowerCase() === spaceVal.toLowerCase()
    );
    const spaceIdVal = foundSpace?.id;

    if (editingCategory) {
      const payload: Partial<AdminCategory> = {
        name: values.name,
        code: values.code || editingCategory.code,
        slug: autoSlug || editingCategory.slug,
        space: spaceVal,
        spaceId: spaceIdVal || editingCategory.spaceId,
        image: editingCategory.image || '',
        description: values.description || '',
        status: values.status || editingCategory.status,
        showOnHome: values.showOnHome ?? true,
        showOnMenu: values.showOnMenu ?? true,
        displayOrder: values.displayOrder !== undefined ? values.displayOrder : (editingCategory.displayOrder ?? 1),
        featuredProduct: editingCategory.featuredProduct,
        badge: editingCategory.badge,
      };
      try {
        const updatedCat = await categoryApi.updateCategory(editingCategory.id, payload);
        setCategoriesList((prev) =>
          prev.map((c) => (c.id === editingCategory.id ? { ...c, ...updatedCat } : c))
        );
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('categories_changed'));
        }
        message.success(`Đã cập nhật danh mục "${values.name}"!`);
        setShowCategoryDrawer(false);
      } catch (err: any) {
        message.error(err?.message || 'Cập nhật danh mục thất bại.');
      }
    } else {
      const newCatPayload: Partial<AdminCategory> = {
        name: values.name,
        code: values.code || 'NH' + (categoriesList.length + 1).toString().padStart(2, '0'),
        slug: autoSlug || 'nhom-hang-moi',
        space: spaceVal,
        spaceId: spaceIdVal,
        displayOrder: values.displayOrder !== undefined ? values.displayOrder : (categoriesList.length + 1),
        productCount: 0,
        status: values.status || 'active',
        description: values.description || '',
        image: '',
        featuredProduct: 'Sản phẩm nội thất',
        showOnHome: values.showOnHome ?? true,
        showOnMenu: values.showOnMenu ?? true,
      };
      try {
        const createdCat = await categoryApi.createCategory(newCatPayload);
        setCategoriesList((prev) => [...prev, createdCat]);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('categories_changed'));
        }
        message.success(`Đã thêm mới danh mục "${values.name}"!`);
        setShowCategoryDrawer(false);
      } catch (err: any) {
        message.error(err?.message || 'Thêm mới danh mục thất bại.');
      }
    }
  };

  const handleDeleteCategory = async (id: string, name?: string) => {
    const cat = categoriesList.find((c) => c.id === id);
    if (cat && (cat.productCount || 0) > 0) {
      modal.warning({
        title: 'Không thể xóa danh mục này',
        centered: true,
        okText: 'Đã hiểu',
        okButtonProps: { className: '!bg-[#784e34] hover:!bg-[#5c3c28]' },
        content: `Danh mục "${cat.name}" đang có ${cat.productCount} sản phẩm. Vui lòng chuyển hoặc xóa sản phẩm trước!`,
      });
      message.error(
        `Không thể xóa danh mục "${cat.name}" vì đang có ${cat.productCount} sản phẩm thuộc danh mục này. Vui lòng chuyển hoặc xóa sản phẩm trước!`
      );
      return;
    }
    try {
      await categoryApi.deleteCategory(id);
      setCategoriesList((prev) => prev.filter((c) => c.id !== id));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('categories_changed'));
      }
      message.success(`Đã xóa danh mục ${name ? `"${name}"` : ''} thành công!`);
    } catch (err: any) {
      modal.error({
        title: 'Xóa danh mục thất bại',
        content: err?.message || 'Có lỗi xảy ra khi xóa danh mục.',
        okText: 'Đóng',
        centered: true,
      });
      message.error(err?.message || 'Xóa danh mục thất bại.');
    }
  };

  // --- SPACES ACTIONS ---
  const handleResetSpaceFilters = () => {
    setSpaceSearchQuery('');
    setSpaceStatusFilter('all');
    setSelectedSpaceKeys([]);
  };

  const handleRefreshSpaces = async () => {
    try {
      const refreshed = await spaceApi.getSpaces();
      updateSpacesList(refreshed);
      message.success('Đã làm mới danh sách không gian!');
    } catch (err: any) {
      message.error(err?.message || 'Làm mới không gian thất bại.');
    }
  };

  const handleExportSpacesExcel = async () => {
    try {
      const exportData = currentSpacesList.map((s, idx) => ({
        'STT': idx + 1,
        'Mã không gian': s.code,
        'Tên không gian': s.name,
        'Đường dẫn (Slug)': s.slug,
        'Tiêu đề phụ': s.tagline || '',
        'Mô tả': s.description || '',
        'Thứ tự': s.displayOrder,
        'Trạng thái': s.status === 'active' ? 'Đang hoạt động' : 'Tạm dừng',
        'Hiện trên Header': s.showOnHeader ? 'Có' : 'Không',
        'Hiện trên Trang chủ': s.showOnHome ? 'Có' : 'Không',
      }));

      const XLSX = await import('xlsx');
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'KhongGianNoiThat');
      XLSX.writeFile(workbook, `danh_sach_khong_gian_${new Date().toISOString().slice(0, 10)}.xlsx`);
      message.success('Đã xuất file Excel danh sách không gian!');
    } catch (err: any) {
      message.error(err?.message || 'Xuất Excel không gian thất bại.');
    }
  };

  const handleGenerateSpaceCode = () => {
    const currentCode = spaceForm.getFieldValue('code');
    const genCode = getNextCode(currentCode, currentSpacesList, 'KG', 2);
    spaceForm.setFieldsValue({ code: genCode });
    message.success(`Đã tự động tạo mã không gian mới: ${genCode}`);
  };

  const handleOpenCreateSpace = () => {
    setEditingSpace(null);
    const existingCodes = new Set(currentSpacesList.map((s) => (s.code || '').toUpperCase()));
    let nextNum = 1;
    let autoCode = `KG${nextNum.toString().padStart(2, '0')}`;
    while (existingCodes.has(autoCode)) {
      nextNum++;
      autoCode = `KG${nextNum.toString().padStart(2, '0')}`;
    }
    setShowSpaceDrawer(true);
    setTimeout(() => {
      spaceForm.resetFields();
      spaceForm.setFieldsValue({
        code: autoCode,
        name: '',
        tagline: '',
        image: '',
        description: '',
        displayOrder: currentSpacesList.length + 1,
        status: 'active',
        showOnHeader: true,
        showOnHome: true,
      });
    }, 0);
  };

  const handleOpenEditSpace = (space: AdminSpace) => {
    setEditingSpace(space);
    setShowSpaceDrawer(true);
    setTimeout(() => {
      spaceForm.resetFields();
      spaceForm.setFieldsValue({
        code: space.code,
        name: space.name,
        tagline: space.tagline || '',
        image: space.image || '',
        description: space.description || '',
        displayOrder: space.displayOrder ?? 1,
        status: space.status || 'active',
        showOnHeader: space.showOnHeader ?? true,
        showOnHome: space.showOnHome ?? true,
      });
    }, 0);
  };

  const handleCopySpace = async (space: AdminSpace) => {
    const existingCodes = new Set(currentSpacesList.map((s) => (s.code || '').toUpperCase()));
    let nextNum = 1;
    let autoCode = `KG${nextNum.toString().padStart(2, '0')}`;
    while (existingCodes.has(autoCode)) {
      nextNum++;
      autoCode = `KG${nextNum.toString().padStart(2, '0')}`;
    }
    const clonedPayload: Partial<AdminSpace> = {
      ...space,
      name: `${space.name} (Bản sao)`,
      code: autoCode,
      slug: `${space.slug}-copy`,
      displayOrder: currentSpacesList.length + 1,
    };
    try {
      const created = await spaceApi.createSpace(clonedPayload);
      updateSpacesList((prev) => [...prev, created]);
      message.success(`Đã nhân bản không gian "${space.name}"!`);
    } catch (err: any) {
      message.error(err?.message || 'Nhân bản không gian thất bại.');
    }
  };

  const getSpaceProductCount = (space: AdminSpace) => {
    const sName = (space.name || '').toLowerCase().trim();
    const relatedCategories = categoriesList.filter((c) => {
      if (c.spaceId && c.spaceId === space.id) return true;
      if (!c.space) return false;
      const cSpace = c.space.toLowerCase().trim();
      return cSpace === sName || cSpace.includes(sName) || sName.includes(cSpace);
    });
    const totalProducts = relatedCategories.reduce((sum, c) => sum + (c.productCount || 0), 0);
    return { totalProducts, categoryCount: relatedCategories.length };
  };

  const handleDeleteSelectedSpaces = async () => {
    if (!selectedSpaceKeys.length) return;
    const spacesWithProducts = currentSpacesList
      .map((s) => ({ space: s, ...getSpaceProductCount(s) }))
      .filter((s) => selectedSpaceKeys.includes(s.space.id) && (s.totalProducts > 0 || s.categoryCount > 0));

    if (spacesWithProducts.length > 0) {
      modal.warning({
        title: 'Không thể xóa các không gian đang có dữ liệu',
        centered: true,
        okText: 'Đã hiểu',
        okButtonProps: { className: '!bg-[#784e34] hover:!bg-[#5c3c28]' },
        content: (
          <div className="space-y-2 mt-2">
            <p className="text-slate-700">
              Phát hiện <b>{spacesWithProducts.length} không gian</b> đang có sản phẩm hoặc danh mục liên kết:
            </p>
            <div className="max-h-40 overflow-y-auto space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              {spacesWithProducts.map((s) => (
                <div key={s.space.id} className="flex justify-between items-center text-xs py-0.5 border-b border-slate-100 last:border-0">
                  <span className="font-semibold text-slate-800">{s.space.name}</span>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded">{s.totalProducts} SP</span>
                    <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded">{s.categoryCount} DM</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 p-2.5 rounded-lg mt-2">
              ⚠️ <b>Quy định hệ thống:</b> Vui lòng chuyển các sản phẩm và danh mục sang không gian khác trước khi xóa không gian!
            </p>
          </div>
        ),
      });
      message.error(
        `Không thể xóa ${spacesWithProducts.length} không gian đang có sản phẩm hoặc danh mục. Vui lòng chuyển dữ liệu trước!`
      );
      return;
    }
    try {
      await Promise.all(
        selectedSpaceKeys.map((k) => spaceApi.deleteSpace(String(k)))
      );
      updateSpacesList((prev) => prev.filter((s) => !selectedSpaceKeys.includes(s.id)));
      message.success(`Đã xóa ${selectedSpaceKeys.length} không gian đã chọn!`);
      setSelectedSpaceKeys([]);
    } catch (e: any) {
      modal.error({
        title: 'Xóa không gian thất bại',
        content: e?.message || 'Có lỗi xảy ra khi xóa không gian.',
        okText: 'Đóng',
        centered: true,
      });
      message.error(e?.message || 'Xóa không gian thất bại.');
    }
  };

  const handleRequestDeleteSpace = (record: AdminSpace) => {
    const { totalProducts, categoryCount } = getSpaceProductCount(record);
    if (totalProducts > 0 || categoryCount > 0) {
      modal.warning({
        title: 'Không thể xóa không gian này',
        centered: true,
        okText: 'Đã hiểu',
        okButtonProps: { className: '!bg-[#784e34] hover:!bg-[#5c3c28]' },
        content: (
          <div className="space-y-2 mt-2">
            <p className="text-slate-700">
              Không gian <b>"{record.name}"</b> hiện đang có{' '}
              {totalProducts > 0 && <b className="text-rose-600 font-bold">{totalProducts} sản phẩm</b>}
              {totalProducts > 0 && categoryCount > 0 && ' và '}
              {categoryCount > 0 && <b className="text-amber-700 font-bold">{categoryCount} danh mục</b>}{' '}
              liên kết.
            </p>
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 p-2.5 rounded-lg mt-2">
              ⚠️ <b>Quy định hệ thống:</b> Không thể xóa không gian khi vẫn còn sản phẩm hoặc danh mục. Vui lòng chuyển danh mục và sản phẩm sang không gian khác trước khi xóa!
            </p>
          </div>
        ),
      });
      message.error(
        `Không thể xóa không gian "${record.name}" vì đang có ${totalProducts} sản phẩm (${categoryCount} danh mục)!`
      );
      return;
    }

    modal.confirm({
      title: 'Xác nhận xóa không gian',
      content: `Bạn có chắc muốn xóa không gian "${record.name}"? Không gian sẽ được chuyển vào thùng rác.`,
      okText: 'Xóa',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      centered: true,
      onOk: () => handleDeleteSpace(record.id, record.name),
    });
  };

  const handleDeleteSpace = async (id: string, name?: string) => {
    const space = currentSpacesList.find((s) => s.id === id);
    if (space) {
      const { totalProducts, categoryCount } = getSpaceProductCount(space);
      if (totalProducts > 0 || categoryCount > 0) {
        modal.warning({
          title: 'Không thể xóa không gian này',
          centered: true,
          okText: 'Đã hiểu',
          okButtonProps: { className: '!bg-[#784e34] hover:!bg-[#5c3c28]' },
          content: `Không gian "${space.name}" đang có ${totalProducts} sản phẩm (${categoryCount} danh mục). Vui lòng chuyển hoặc xóa sản phẩm trước!`,
        });
        message.error(
          `Không thể xóa không gian "${space.name}" vì đang có ${totalProducts} sản phẩm (${categoryCount} danh mục) thuộc không gian này. Vui lòng chuyển hoặc xóa sản phẩm trước!`
        );
        return;
      }
    }
    try {
      await spaceApi.deleteSpace(id);
      updateSpacesList((prev) => prev.filter((s) => s.id !== id));
      message.success(`Đã xóa không gian ${name ? `"${name}"` : ''} thành công!`);
    } catch (err: any) {
      modal.error({
        title: 'Xóa không gian thất bại',
        content: err?.message || 'Có lỗi xảy ra khi xóa không gian.',
        okText: 'Đóng',
        centered: true,
      });
      message.error(err?.message || 'Xóa không gian thất bại.');
    }
  };

  const handleSpaceFormSubmit = async (values: any) => {
    const autoSlug = (values.name || '').toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    if (editingSpace) {
      const payload: Partial<AdminSpace> = {
        code: values.code || editingSpace.code,
        name: values.name,
        description: values.description || '',
        slug: autoSlug || editingSpace.slug,
        tagline: values.tagline || editingSpace.tagline,
        image: values.image || editingSpace.image,
        icon: values.icon || editingSpace.icon,
        displayOrder: values.displayOrder !== undefined ? values.displayOrder : (editingSpace.displayOrder ?? 1),
        status: values.status || editingSpace.status || 'active',
        showOnHome: values.showOnHome !== undefined ? values.showOnHome : (editingSpace.showOnHome ?? true),
        showOnHeader: values.showOnHeader !== undefined ? values.showOnHeader : (editingSpace.showOnHeader ?? true),
      };
      try {
        const updatedSpace = await spaceApi.updateSpace(editingSpace.id, payload);
        updateSpacesList((prev) =>
          prev.map((s) => (s.id === editingSpace.id ? { ...s, ...updatedSpace } : s))
        );
        message.success(`Đã cập nhật không gian "${values.name}"!`);
        setShowSpaceDrawer(false);
      } catch (err: any) {
        message.error(err?.message || 'Cập nhật không gian thất bại.');
      }
    } else {
      const newSpacePayload: Partial<AdminSpace> = {
        code: values.code || `KG${(currentSpacesList.length + 1).toString().padStart(2, '0')}`,
        name: values.name,
        description: values.description || '',
        slug: autoSlug || 'khong-gian-moi',
        displayOrder: values.displayOrder !== undefined ? values.displayOrder : (currentSpacesList.length + 1),
        status: values.status || 'active',
        showOnHome: values.showOnHome !== undefined ? values.showOnHome : true,
        showOnHeader: values.showOnHeader !== undefined ? values.showOnHeader : true,
        categoryCount: 0,
      };
      try {
        const createdSpace = await spaceApi.createSpace(newSpacePayload);
        updateSpacesList((prev) => [...prev, createdSpace]);
        message.success(`Đã thêm mới không gian "${values.name}"!`);
        setShowSpaceDrawer(false);
      } catch (err: any) {
        message.error(err?.message || 'Thêm mới không gian thất bại.');
      }
    }
  };

  // --- FILTERED LISTS ---
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
        const matchSpace =
          categorySpaceFilter === 'all' ||
          cat.space.toLowerCase() === categorySpaceFilter.toLowerCase();
        return matchSearch && matchStatus && matchSpace;
      })
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [categoriesList, categorySearchQuery, categoryStatusFilter, categorySpaceFilter]);

  const filteredSpaces = useMemo(() => {
    return currentSpacesList
      .filter((space) => {
        const matchSearch =
          !spaceSearchQuery ||
          space.name.toLowerCase().includes(spaceSearchQuery.toLowerCase()) ||
          space.code.toLowerCase().includes(spaceSearchQuery.toLowerCase()) ||
          space.slug.toLowerCase().includes(spaceSearchQuery.toLowerCase()) ||
          (space.tagline && space.tagline.toLowerCase().includes(spaceSearchQuery.toLowerCase()));
        const matchStatus =
          spaceStatusFilter === 'all' || space.status === spaceStatusFilter;
        return matchSearch && matchStatus;
      })
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [currentSpacesList, spaceSearchQuery, spaceStatusFilter]);

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* SUB-HEADER: TABS SWITCHER (DANH MỤC NHÓM HÀNG vs KHÔNG GIAN NỘI THẤT - Flush with Main Header) */}
      <div className="-mx-4 sm:-mx-5 lg:-mx-6 -mt-4 sm:-mt-5 lg:-mt-6 px-4 sm:px-6 lg:px-8 py-2.5 bg-white border-b border-[#eae1dd] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs mb-4">
        <div className="flex items-center gap-2">
          <Segmented
            value={activeSubTab}
            onChange={(val: any) => {
              setActiveSubTab(val);
              setSelectedCategoryKeys([]);
              setSelectedSpaceKeys([]);
            }}
            options={[
              {
                value: 'categories',
                label: (
                  <div className="flex items-center gap-2 py-1 px-1.5 font-bold text-xs sm:text-sm">
                    <AppstoreOutlined className={activeSubTab === 'categories' ? 'text-[#784e34]' : 'text-slate-400'} />
                    <span>Danh mục nhóm hàng</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${
                        activeSubTab === 'categories' ? 'bg-[#784e34]/15 text-[#784e34]' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {categoriesList.length}
                    </span>
                  </div>
                ),
              },
              {
                value: 'spaces',
                label: (
                  <div className="flex items-center gap-2 py-1 px-1.5 font-bold text-xs sm:text-sm">
                    <HomeOutlined className={activeSubTab === 'spaces' ? 'text-[#784e34]' : 'text-slate-400'} />
                    <span>Không gian nội thất</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${
                        activeSubTab === 'spaces' ? 'bg-[#784e34]/15 text-[#784e34]' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {currentSpacesList.length}
                    </span>
                  </div>
                ),
              },
            ]}
            className="!bg-slate-100 p-1 rounded-lg"
          />
        </div>

        <div className="flex items-center gap-2">
          <Tag color="blue" className="font-normal text-xs rounded-full px-3 py-1 border-blue-200 bg-blue-50 text-blue-700 flex items-center gap-1.5 select-none m-0">
            <GlobalOutlined />
            <span>Danh mục & Không gian dùng chung toàn hệ thống (không phân biệt chi nhánh)</span>
          </Tag>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: QUẢN LÝ DANH MỤC NHÓM HÀNG */}
      {/* ========================================================================= */}
      {activeSubTab === 'categories' && (
        <div className="flex flex-col lg:flex-row gap-4 items-start flex-1">
          {/* DESKTOP FILTER SIDEBAR */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="bg-white rounded-xl shadow-xs p-4 sticky top-[96px] max-h-[calc(100vh-112px)] overflow-y-auto [scrollbar-width:thin] space-y-4 text-xs text-slate-700">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FilterOutlined className="text-[#784e34]" /> Bộ lọc danh mục
                </span>
                {(categoryStatusFilter !== 'all' || categorySpaceFilter !== 'all' || categorySearchQuery) && (
                  <button
                    type="button"
                    onClick={handleResetCategoryFilters}
                    className="text-[11px] text-[#784e34] hover:underline font-semibold bg-transparent border-none cursor-pointer p-0"
                  >
                    Xóa lọc
                  </button>
                )}
              </div>

              {/* Lọc theo không gian */}
              <div>
                <span className="font-semibold text-slate-800 block mb-1.5">Theo không gian</span>
                <div className="space-y-1">
                  <div
                    onClick={() => setCategorySpaceFilter('all')}
                    className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                      categorySpaceFilter === 'all'
                        ? 'bg-[#784e34]/10 text-[#784e34] font-semibold'
                        : 'hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span>Tất cả không gian</span>
                    <span className="text-xs px-2 py-0.2 bg-slate-100 text-slate-500 rounded-full font-mono">
                      {categoriesList.length}
                    </span>
                  </div>
                  {currentSpacesList.map((sp) => {
                    const count = categoriesList.filter((c) => (c.space || '').toLowerCase().includes(sp.name.toLowerCase())).length;
                    return (
                      <div
                        key={sp.id}
                        onClick={() => setCategorySpaceFilter(sp.name)}
                        className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                          categorySpaceFilter.toLowerCase() === sp.name.toLowerCase()
                            ? 'bg-[#784e34]/10 text-[#784e34] font-semibold'
                            : 'hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <span className="truncate">{sp.name}</span>
                        <span className="text-xs px-2 py-0.2 bg-slate-100 text-slate-500 rounded-full font-mono">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
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
                      className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                        categoryStatusFilter === item.key
                          ? 'bg-[#784e34]/10 text-[#784e34] font-semibold'
                          : 'hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <span>{item.label}</span>
                      <span className="text-xs px-2 py-0.2 bg-slate-100 text-slate-500 rounded-full font-mono">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick stats */}
              <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
                <span className="font-semibold text-slate-600 uppercase tracking-wider block text-[11px]">Thống kê nhanh</span>
                <div className="flex justify-between text-slate-600">
                  <span>Tổng danh mục:</span>
                  <span className="font-semibold text-slate-900 font-mono">{categoriesList.length}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Hiện trang chủ:</span>
                  <span className="font-semibold text-emerald-700 font-mono">{categoriesList.filter((c) => c.showOnHome).length}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Hiện trên Menu:</span>
                  <span className="font-semibold text-[#784e34] font-mono">{categoriesList.filter((c) => c.showOnMenu).length}</span>
                </div>
              </div>
            </div>
          </aside>

          {/* MAIN CONTENT: CATEGORIES TABLE */}
          <div className="min-w-0 flex-1 w-full">
            <AdminDataTable
                  enableSelectionToolbar
                  selectedRowKeys={selectedCategoryKeys}
                  onSelectionChange={(keys) => setSelectedCategoryKeys(keys)}
                  titleText="Danh mục nhóm hàng"
                  totalCount={filteredCategories.length}
                  countUnit="danh mục"
                  onCopySelected={() => selectedCategoryRecord && handleCopyCategory(selectedCategoryRecord)}
                  onEditSelected={() => selectedCategoryRecord && handleOpenEditCategory(selectedCategoryRecord)}
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
                        onClick={handleRefreshCategories}
                        className="!h-8 px-2.5 rounded-lg border-slate-300 bg-white text-slate-700 text-xs shadow-xs inline-flex items-center justify-center hover:text-[#784e34]"
                        title="Làm mới"
                      >
                        Làm mới
                      </Button>
                      <Upload
                        accept=".xlsx,.xls"
                        showUploadList={false}
                        beforeUpload={handleImportCategoryExcel}
                        disabled={importingCategoryExcel}
                      >
                        <Button
                          icon={<FileExcelOutlined />}
                          loading={importingCategoryExcel}
                          className="!h-8 px-2.5 rounded-lg border-emerald-600/30 bg-emerald-50 text-emerald-700 text-xs shadow-xs inline-flex items-center justify-center hover:!bg-emerald-100 hover:!border-emerald-600 hover:!text-emerald-800"
                          title="Nhập dữ liệu danh mục từ file Excel"
                        >
                          Nhập Excel
                        </Button>
                      </Upload>
                      <Button
                        icon={<DownloadOutlined />}
                        onClick={handleExportCategoriesExcel}
                        className="!h-8 px-2.5 rounded-lg border-slate-300 bg-white text-slate-700 text-xs shadow-xs inline-flex items-center justify-center hover:text-[#784e34]"
                        title="Xuất Excel"
                      >
                        Xuất Excel
                      </Button>
                    </>
                  }
                  dataSource={filteredCategories}
                  rowKey="id"
                  columns={[
                    {
                      title: 'STT',
                      key: 'stt',
                      width: 60,
                      align: 'center',
                      render: (_, __, index) => (
                        <span className="font-mono text-xs text-slate-500 font-semibold">{index + 1}</span>
                      ),
                    },
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
                      width: 160,
                      render: (space) => (
                        <Tag className="text-xs font-medium border-0 bg-slate-100 text-slate-700 px-2 py-0.5">
                          {space}
                        </Tag>
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
                      render: (status) => <CategoryStatusBadge status={status} />,
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
                          <Button
                            size="small"
                            type="text"
                            icon={<DeleteOutlined className="text-sm" />}
                            onClick={() => handleRequestDeleteCategory(record)}
                            className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                            title="Xóa danh mục"
                          />
                        </Space>
                      ),
                    },
                  ]}
                />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: QUẢN LÝ KHÔNG GIAN NỘI THẤT (LIVING SPACES) */}
      {/* ========================================================================= */}
      {activeSubTab === 'spaces' && (
        <div className="flex flex-col lg:flex-row gap-4 items-start flex-1">
          {/* DESKTOP SPACES FILTER SIDEBAR */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="bg-white rounded-xl shadow-xs p-4 sticky top-[96px] max-h-[calc(100vh-112px)] overflow-y-auto [scrollbar-width:thin] space-y-4 text-xs text-slate-700">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FilterOutlined className="text-[#784e34]" /> Bộ lọc không gian
                </span>
                {(spaceStatusFilter !== 'all' || spaceSearchQuery) && (
                  <button
                    type="button"
                    onClick={handleResetSpaceFilters}
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
                    { key: 'all', label: 'Tất cả không gian', count: currentSpacesList.length },
                    { key: 'active', label: 'Đang hiển thị', count: currentSpacesList.filter((s) => s.status === 'active').length },
                    { key: 'hidden', label: 'Tạm ẩn / Đang sửa', count: currentSpacesList.filter((s) => s.status === 'hidden').length },
                  ].map((item) => (
                    <div
                      key={item.key}
                      onClick={() => setSpaceStatusFilter(item.key)}
                      className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                        spaceStatusFilter === item.key
                          ? 'bg-[#784e34]/10 text-[#784e34] font-semibold'
                          : 'hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <span>{item.label}</span>
                      <span className="text-xs px-2 py-0.2 bg-slate-100 text-slate-500 rounded-full font-mono">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick stats */}
              <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
                <span className="font-semibold text-slate-600 uppercase tracking-wider block text-[11px]">Thống kê không gian</span>
                <div className="flex justify-between text-slate-600">
                  <span>Tổng không gian:</span>
                  <span className="font-semibold text-slate-900 font-mono">{currentSpacesList.length}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Hiện trên Header:</span>
                  <span className="font-semibold text-[#784e34] font-mono">{currentSpacesList.filter((s) => s.showOnHeader).length}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Hiện trên Trang chủ:</span>
                  <span className="font-semibold text-emerald-700 font-mono">{currentSpacesList.filter((s) => s.showOnHome).length}</span>
                </div>
              </div>
            </div>
          </aside>

          {/* MAIN SPACES CONTENT: TABLE */}
          <div className="min-w-0 flex-1 w-full">
            <AdminDataTable
                  enableSelectionToolbar
                  selectedRowKeys={selectedSpaceKeys}
                  onSelectionChange={(keys) => setSelectedSpaceKeys(keys)}
                  titleText="Không gian nội thất"
                  totalCount={filteredSpaces.length}
                  countUnit="không gian"
                  onCopySelected={() => selectedSpaceRecord && handleCopySpace(selectedSpaceRecord)}
                  onEditSelected={() => selectedSpaceRecord && handleOpenEditSpace(selectedSpaceRecord)}
                  onDeleteSelected={handleDeleteSelectedSpaces}
                  deleteConfirmTitle={`Xóa ${selectedSpaceKeys.length} không gian đã chọn?`}
                  onCreateNew={handleOpenCreateSpace}
                  createButtonText="Tạo mới"
                  searchValue={spaceSearchQuery}
                  onSearchChange={(val) => setSpaceSearchQuery(val)}
                  searchPlaceholder="Theo mã, tên không gian, đường dẫn slug, tiêu đề..."
                  extraHeaderActions={
                    <>
                      <Button
                        icon={<ReloadOutlined />}
                        onClick={handleRefreshSpaces}
                        className="!h-8 px-2.5 rounded-lg border-slate-300 bg-white text-slate-700 text-xs shadow-xs inline-flex items-center justify-center hover:text-[#784e34]"
                        title="Làm mới"
                      >
                        Làm mới
                      </Button>
                      <Button
                        icon={<DownloadOutlined />}
                        onClick={handleExportSpacesExcel}
                        className="!h-8 px-2.5 rounded-lg border-slate-300 bg-white text-slate-700 text-xs shadow-xs inline-flex items-center justify-center hover:text-[#784e34]"
                        title="Xuất Excel"
                      >
                        Xuất Excel
                      </Button>
                    </>
                  }
                  dataSource={filteredSpaces}
                  rowKey="id"
                  columns={[
                    {
                      title: 'STT',
                      key: 'stt',
                      width: 60,
                      align: 'center',
                      render: (_, __, index) => (
                        <span className="font-mono text-xs text-slate-500 font-semibold">{index + 1}</span>
                      ),
                    },
                    {
                      title: 'Ảnh',
                      dataIndex: 'image',
                      key: 'image',
                      width: 75,
                      align: 'center',
                      render: (image, record) => (
                        <SpaceImageCell
                          image={image}
                          code={record.code}
                          name={record.name}
                          onEdit={() => handleOpenEditSpace(record)}
                        />
                      ),
                    },
                    {
                      title: 'Không gian & Mã',
                      dataIndex: 'name',
                      key: 'name',
                      render: (_, record) => {
                        return (
                          <div className="min-w-0">
                            <div
                              onClick={() => handleOpenEditSpace(record)}
                              className="font-semibold text-sm text-slate-900 hover:text-[#784e34] cursor-pointer line-clamp-1 transition-colors"
                            >
                              {record.name}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-xs font-semibold text-[#784e34]">{record.code}</span>
                              <span className="text-slate-300">•</span>
                              <span className="font-mono text-[11px] text-slate-500">/{record.slug}</span>
                            </div>
                          </div>
                        );
                      },
                    },
                    {
                      title: 'Hiển thị trên',
                      key: 'displayPlaces',
                      width: 170,
                      render: (_, record) => (
                        <div className="flex flex-wrap gap-1">
                          {record.showOnHeader && (
                            <Tag className="text-[10px] font-semibold border-0 bg-blue-50 text-blue-700 m-0">
                              Header Menu
                            </Tag>
                          )}
                          {record.showOnHome && (
                            <Tag className="text-[10px] font-semibold border-0 bg-emerald-50 text-emerald-700 m-0">
                              Trang Chủ
                            </Tag>
                          )}
                        </div>
                      ),
                    },
                    {
                      title: 'Danh mục / SP',
                      key: 'categoryCount',
                      align: 'center',
                      width: 130,
                      render: (_, record) => {
                        const { totalProducts, categoryCount } = getSpaceProductCount(record);
                        return (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="font-mono font-semibold text-xs text-slate-800">
                              {categoryCount} DM
                            </span>
                            <span className={`text-[11px] font-mono font-medium ${totalProducts > 0 ? 'text-[#784e34]' : 'text-slate-400'}`}>
                              {totalProducts} SP
                            </span>
                          </div>
                        );
                      },
                    },
                    {
                      title: 'Trạng thái',
                      dataIndex: 'status',
                      key: 'status',
                      width: 130,
                      render: (status) => <CategoryStatusBadge status={status} />,
                    },
                    {
                      title: 'Thao tác',
                      key: 'action',
                      align: 'center',
                      width: 110,
                      render: (_, record) => {
                        const { totalProducts, categoryCount } = getSpaceProductCount(record);
                        const hasProducts = totalProducts > 0;
                        return (
                          <Space size={2} onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="small"
                              type="text"
                              icon={<EditOutlined className="text-sm" />}
                              onClick={() => handleOpenEditSpace(record)}
                              className="text-slate-600 hover:text-[#784e34] hover:bg-slate-100"
                              title="Chỉnh sửa"
                            />
                            <Button
                              size="small"
                              type="text"
                              icon={<CopyOutlined className="text-sm" />}
                              onClick={() => handleCopySpace(record)}
                              className="text-slate-600 hover:text-[#784e34] hover:bg-slate-100"
                              title="Sao chép"
                            />
                            <Button
                              size="small"
                              type="text"
                              icon={<DeleteOutlined className="text-sm" />}
                              onClick={() => handleRequestDeleteSpace(record)}
                              className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                              title="Xóa không gian"
                            />
                          </Space>
                        );
                      },
                    },
                  ]}
                />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER 1: THÊM / CHỈNH SỬA DANH MỤC */}
      {/* ========================================================================= */}
      <AdminFormDrawer
        open={showCategoryDrawer}
        onClose={() => setShowCategoryDrawer(false)}
        form={categoryForm}
        isEditing={Boolean(editingCategory)}
        recordId={editingCategory?.code || editingCategory?.id}
        editTitle="Chỉnh sửa danh mục"
        createTitle="Thêm mới danh mục"
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
                    <AutoCodeButton
                      onGenerate={handleGenerateCategoryCode}
                      tooltipTitle="Tự động tạo mã danh mục mới"
                    />
                  }
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={<span className="text-xs font-semibold text-slate-700">Thuộc không gian nội thất <span className="text-red-500">*</span></span>}
                name="space"
                rules={[{ required: true, message: 'Vui lòng chọn không gian' }]}
              >
                <Select
                  className="h-10 text-sm"
                  placeholder="Chọn không gian"
                >
                  {currentSpacesList.map((sp) => (
                    <Select.Option key={sp.id} value={sp.name}>
                      {sp.code} - {sp.name}
                    </Select.Option>
                  ))}
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

          {/* ẢNH ĐẠI DIỆN DANH MỤC (TẢI TỪ MÁY / URL) */}
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-700 block">Ảnh đại diện danh mục</span>
                <span className="text-[11px] text-slate-400">Tải ảnh từ máy tính hoặc dán URL ảnh</span>
              </div>
              <Upload
                showUploadList={false}
                beforeUpload={handleUploadCategoryImage}
                accept="image/*"
              >
                <Button
                  size="small"
                  icon={<UploadOutlined />}
                  loading={uploadingCategoryImage}
                  className="text-xs rounded-lg border-slate-300 hover:text-[#784e34] hover:border-[#784e34]"
                >
                  Tải ảnh từ máy
                </Button>
              </Upload>
            </div>
            <Form.Item name="image" className="!mb-0">
              <Input
                placeholder="https://images.unsplash.com/... hoặc bấm nút tải ảnh từ máy"
                className="h-10 text-sm rounded-lg bg-white"
              />
            </Form.Item>
            {currentCategoryImage && (
              <div className="relative inline-block mt-2">
                <img
                  src={currentCategoryImage}
                  alt="Ảnh danh mục"
                  loading="lazy"
                  decoding="async"
                  className="w-16 h-16 object-cover rounded-lg border border-slate-200 bg-white shadow-xs"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => categoryForm.setFieldsValue({ image: '' })}
                  className="absolute -top-1.5 -right-1.5 bg-white rounded-full text-slate-400 hover:text-red-500 border-0 p-0 cursor-pointer shadow-xs"
                  title="Gỡ ảnh"
                >
                  <CloseCircleFilled className="text-base text-red-500 hover:text-red-600" />
                </button>
              </div>
            )}
          </div>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={<span className="text-xs font-semibold text-slate-700">Thứ tự hiển thị</span>}
                name="displayOrder"
                initialValue={1}
              >
                <InputNumber min={1} className="w-full !h-10 rounded-lg text-sm" placeholder="1, 2, 3..." />
              </Form.Item>
            </Col>
            <Col span={12}>
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
            </Col>
          </Row>
        </Form>
      </AdminFormDrawer>

      {/* ========================================================================= */}
      {/* DRAWER 2: THÊM / CHỈNH SỬA KHÔNG GIAN NỘI THẤT (MÃ, TÊN, TAGLINE, ẢNH, MÔ TẢ) */}
      {/* ========================================================================= */}
      <AdminFormDrawer
        open={showSpaceDrawer}
        onClose={() => setShowSpaceDrawer(false)}
        form={spaceForm}
        isEditing={Boolean(editingSpace)}
        recordId={editingSpace?.code || editingSpace?.id}
        editTitle="Chỉnh sửa không gian"
        createTitle="Thêm mới không gian nội thất"
        size="large"
      >
        <Form
          form={spaceForm}
          layout="vertical"
          onFinish={handleSpaceFormSubmit}
          requiredMark={false}
          className="space-y-4"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={<span className="text-xs font-semibold text-slate-700">Mã không gian <span className="text-red-500">*</span></span>}
                name="code"
                rules={[{ required: true, message: 'Vui lòng nhập mã không gian' }]}
              >
                <Input
                  placeholder="Tự động hoặc nhập tay"
                  className="h-10 text-sm font-mono uppercase font-semibold rounded-lg"
                  suffix={
                    <AutoCodeButton
                      onGenerate={handleGenerateSpaceCode}
                      tooltipTitle="Tự động tạo mã không gian mới"
                    />
                  }
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={<span className="text-xs font-semibold text-slate-700">Tên không gian nội thất <span className="text-red-500">*</span></span>}
                name="name"
                rules={[{ required: true, message: 'Vui lòng nhập tên không gian' }]}
              >
                <Input placeholder="VD: Phòng Khách, Phòng Ngủ, Bàn Ăn..." className="h-10 text-sm rounded-lg font-semibold" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label={<span className="text-xs font-semibold text-slate-700">Tiêu đề phụ / Tagline không gian</span>}
            name="tagline"
          >
            <Input placeholder="VD: Không gian chính, Giấc ngủ thư thái, Bữa cơm ấm cúng, Góc làm việc sáng tạo..." className="h-10 text-sm rounded-lg" />
          </Form.Item>

          {/* UPLOAD ẢNH THỰC TẾ CỦA KHÔNG GIAN */}
          <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">Hình ảnh thực tế của không gian</span>
                <span className="text-[11px] text-slate-500">Tải ảnh từ máy (.jpg, .png, .webp) hoặc dán link URL trực tiếp</span>
              </div>
              <Upload
                showUploadList={false}
                beforeUpload={handleUploadSpaceImage}
                accept="image/*"
              >
                <Button
                  size="small"
                  icon={<UploadOutlined />}
                  loading={uploadingSpaceImage}
                  className="text-xs rounded-lg border-slate-300 hover:text-[#784e34] hover:border-[#784e34]"
                >
                  Tải ảnh từ máy
                </Button>
              </Upload>
            </div>
            <Form.Item name="image" className="!mb-0">
              <Input
                placeholder="https://images.unsplash.com/... hoặc bấm nút tải ảnh từ máy"
                className="h-10 text-sm rounded-lg bg-white"
              />
            </Form.Item>
            {currentSpaceImage && (
              <div className="relative inline-block mt-2">
                <img
                  src={currentSpaceImage}
                  alt="Ảnh không gian xem trước"
                  loading="lazy"
                  decoding="async"
                  className="w-36 h-24 object-cover rounded-lg border border-slate-300 bg-white shadow-xs"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => spaceForm.setFieldsValue({ image: '' })}
                  className="absolute -top-2 -right-2 bg-white rounded-full text-slate-400 hover:text-red-500 border-0 p-0 cursor-pointer shadow-xs"
                  title="Gỡ ảnh"
                >
                  <CloseCircleFilled className="text-base text-red-500 hover:text-red-600" />
                </button>
              </div>
            )}
          </div>

          <Form.Item
            label={<span className="text-xs font-semibold text-slate-700">Mô tả không gian</span>}
            name="description"
          >
            <Input.TextArea rows={3} placeholder="Nhập mô tả về không gian nội thất..." className="text-sm rounded-lg" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={<span className="text-xs font-semibold text-slate-700">Thứ tự hiển thị</span>}
                name="displayOrder"
                initialValue={1}
              >
                <InputNumber min={1} className="w-full !h-10 rounded-lg text-sm" placeholder="1, 2, 3..." />
              </Form.Item>
            </Col>
            <Col span={12}>
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
            </Col>
          </Row>

          <Row gutter={16} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <Col span={12}>
              <Form.Item
                label={<span className="text-xs font-semibold text-slate-700">Hiện trên Menu Header</span>}
                name="showOnHeader"
                valuePropName="checked"
                className="!mb-0"
              >
                <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={<span className="text-xs font-semibold text-slate-700">Hiện trên Trang chủ</span>}
                name="showOnHome"
                valuePropName="checked"
                className="!mb-0"
              >
                <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </AdminFormDrawer>
    </div>
  );
}
