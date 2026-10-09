'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
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
  Upload,
  Image,
  Tooltip,
  Dropdown,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  PlusOutlined,
  ReloadOutlined,
  DownloadOutlined,
  ThunderboltOutlined,
  UploadOutlined,
  CloseCircleFilled,
  FileExcelOutlined,
  UpOutlined,
  DownOutlined,
  PrinterOutlined,
  SaveOutlined,
  EyeOutlined,
  ShopOutlined,
  InfoCircleOutlined,
  AppstoreOutlined,
  PictureOutlined,
  DollarOutlined,
  BranchesOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  BarcodeOutlined,
  SafetyCertificateOutlined,
  CarOutlined,
  EllipsisOutlined,
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import {
  AdminDataTable,
  AdminFormDrawer,
  AdminFilterSidebar,
  AdminSidebarSummary,
} from '@/components/admin';
import type { FeaturedCatalogProduct, AdminCategory, AdminUom, AdminSpace } from '@/types/admin';
import { exportToExcel } from '@/utils/exportExcel';
import { productApi } from '@/api/productApi';
import { categoryApi } from '@/api/categoryApi';
import { uploadApi } from '@/api/uploadApi';
import { uomApi } from '@/api/uomApi';
import { spaceApi } from '@/api/spaceApi';

export interface InventoryTabProps {
  catalogList: FeaturedCatalogProduct[];
  setCatalogList: React.Dispatch<React.SetStateAction<FeaturedCatalogProduct[]>>;
  categoriesList: AdminCategory[];
  spacesList?: AdminSpace[];
  uomsList?: AdminUom[];
  selectedGlobalBranch?: string;
  initialSearch?: string;
  onClearInitialSearch?: () => void;
  onOpenCreateProduct?: () => void;
  onOpenEditProduct?: (product: FeaturedCatalogProduct) => void;
  onExportProductsExcel?: () => void;
}

export function InventoryTab({
  catalogList,
  setCatalogList,
  categoriesList,
  spacesList = [],
  uomsList = [],
  selectedGlobalBranch = 'all',
  initialSearch,
  onClearInitialSearch,
  onOpenCreateProduct,
  onOpenEditProduct,
  onExportProductsExcel,
}: InventoryTabProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [selectedProductKeys, setSelectedProductKeys] = useState<React.Key[]>([]);
  const [searchQuery, setSearchQuery] = useState(initialSearch || '');
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState('all');
  const [inventoryStockTag, setInventoryStockTag] = useState('all');

  // Server-Side Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalProducts, setTotalProducts] = useState(catalogList?.length || 0);
  const [productsList, setProductsList] = useState<FeaturedCatalogProduct[]>(catalogList || []);
  const [loading, setLoading] = useState(false);

  // UOM Data State
  const [currentUoms, setCurrentUoms] = useState<AdminUom[]>(uomsList || []);
  useEffect(() => {
    if (uomsList && uomsList.length > 0) {
      setCurrentUoms(uomsList);
    } else {
      uomApi.getUoms().then((uoms) => {
        if (uoms && Array.isArray(uoms) && uoms.length > 0) {
          setCurrentUoms(uoms);
        }
      }).catch(() => {});
    }
  }, [uomsList]);

  const uomSelectOptions = useMemo(() => {
    const standard = ['Bộ', 'Chiếc', 'Cái', 'm²', 'm³', 'md', 'Kg', 'Hộp', 'Set'];
    const fromApi = currentUoms.map((u) => u.name).filter(Boolean);
    const combined = Array.from(new Set([...fromApi, ...standard]));
    return combined.map((name) => ({ value: name, label: name }));
  }, [currentUoms]);

  // Spaces Data State
  const [currentSpaces, setCurrentSpaces] = useState<AdminSpace[]>(spacesList || []);
  useEffect(() => {
    if (spacesList && spacesList.length > 0) {
      setCurrentSpaces(spacesList);
    } else {
      spaceApi.getSpaces().then((spaces) => {
        if (spaces && Array.isArray(spaces) && spaces.length > 0) {
          setCurrentSpaces(spaces);
        }
      }).catch(() => {});
    }
  }, [spacesList]);

  const spaceSelectOptions = useMemo(() => {
    const defaultSpaces = [
      { value: 'LivingRoom', label: 'Phòng khách' },
      { value: 'DiningRoom', label: 'Phòng ăn & Bếp' },
      { value: 'BedRoom', label: 'Phòng ngủ' },
      { value: 'Office', label: 'Phòng làm việc' },
      { value: 'Decor', label: 'Đồ trang trí & Phụ kiện' },
    ];
    if (!currentSpaces || currentSpaces.length === 0) return defaultSpaces;
    const fromApi = currentSpaces.map((s) => ({
      value: s.slug || s.name,
      label: s.name,
    }));
    const uniqueMap = new Map<string, string>();
    [...fromApi, ...defaultSpaces].forEach((opt) => {
      if (!uniqueMap.has(opt.value)) uniqueMap.set(opt.value, opt.label);
    });
    return Array.from(uniqueMap.entries()).map(([value, label]) => ({ value, label }));
  }, [currentSpaces]);

  // Expandable row state for Domaco POS detail panel
  const [expandedProductRowKeys, setExpandedProductRowKeys] = useState<string[]>([]);
  const [productRowTabs, setProductRowTabs] = useState<Record<string, 'info' | 'notes' | 'inventory'>>({});
  const initialSearchHandledRef = useRef<string | null>(null);

  const handleToggleExpandProduct = (productId: string) => {
    setExpandedProductRowKeys((prev) => (prev.includes(productId) ? prev.filter((k) => k !== productId) : [productId]));
  };

  // Sync initialSearch
  useEffect(() => {
    if (initialSearch) {
      setSearchQuery(initialSearch);
      setCurrentPage(1);
    }
  }, [initialSearch]);

  // Fetch products from backend with exact pagination and branch filter
  const fetchProducts = useCallback(
    async (page: number, size: number, search: string, catId: string, status: string, branch: string = selectedGlobalBranch) => {
      setLoading(true);
      try {
        const res = await productApi.getPagedProducts({
          page,
          pageSize: size,
          search: search.trim() || undefined,
          categoryId: catId !== 'all' ? catId : undefined,
          status: status !== 'all' ? status : undefined,
          branch: branch !== 'all' ? branch : undefined,
        });
        setProductsList(res.items);
        setTotalProducts(res.totalItems);
        if (setCatalogList) {
          setCatalogList(res.items);
        }

        // If navigated with initial search or query, automatically expand matching product panel
        if (search.trim() && res.items.length > 0) {
          const sNorm = search.toLowerCase().trim();
          const match =
            res.items.find(
              (p) =>
                p.code?.toLowerCase() === sNorm ||
                p.id?.toLowerCase() === sNorm ||
                p.name?.toLowerCase().includes(sNorm) ||
                sNorm.includes(p.code?.toLowerCase() || '') ||
                sNorm.includes(p.name?.toLowerCase() || '')
            ) || res.items[0];
          if (match) {
            setExpandedProductRowKeys([match.id]);
          }
        }
      } catch (err) {
        console.error('Failed to load products from API:', err);
      } finally {
        setLoading(false);
      }
    },
    [setCatalogList, selectedGlobalBranch]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(currentPage, pageSize, searchQuery, inventoryCategoryFilter, inventoryStockTag, selectedGlobalBranch);
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchProducts, currentPage, pageSize, searchQuery, inventoryCategoryFilter, inventoryStockTag, selectedGlobalBranch]);

  // Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<FeaturedCatalogProduct | null>(null);
  const [draftCreateForm, setDraftCreateForm] = useState<any | null>(null);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingSub, setUploadingSub] = useState(false);
  const [importingExcel, setImportingExcel] = useState(false);

  const handleCloseDrawer = () => {
    if (!editingProduct) {
      const currentValues = form.getFieldsValue();
      const hasUserInput = Object.keys(currentValues).some((key) => {
        if (key === 'code' || key === 'stockType') return false;
        return currentValues[key] !== undefined && currentValues[key] !== null && currentValues[key] !== '';
      });
      if (hasUserInput) {
        setDraftCreateForm(currentValues);
      }
    }
    setIsDrawerOpen(false);
  };

  const handleImportExcel = async (file: File) => {
    setImportingExcel(true);
    const hideLoading = message.loading('Đang xử lý đọc file Excel và nhập sản phẩm...', 0);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      
      // Ưu tiên sheet San_Pham hoặc Sản phẩm hoặc sheet đầu tiên
      const productSheetName = workbook.SheetNames.find((s) =>
        ['san_pham', 'sản phẩm', 'san pham', 'products', 'sanpham'].includes(s.trim().toLowerCase())
      ) || workbook.SheetNames[0];

      const worksheet = workbook.Sheets[productSheetName];
      const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet);

      if (!rawRows || rawRows.length === 0) {
        throw new Error('File Excel không có dữ liệu sản phẩm.');
      }

      // Lấy danh sách danh mục mới nhất từ API nếu cần để mapping chính xác
      let currentCategories = categoriesList;
      if (!currentCategories || currentCategories.length === 0) {
        currentCategories = await categoryApi.getCategories().catch(() => []);
      }

      const productsToImport: any[] = [];
      rawRows.forEach((row: any, idx: number) => {
        const name = String(row['Tên sản phẩm'] || row['name'] || row['Tên'] || '').trim();
        if (!name) return;

        const sku = String(row['Mã SKU'] || row['Mã'] || row['sku'] || row['code'] || '').trim();
        const categoryStr = String(row['Danh mục'] || row['Category'] || row['Bộ sưu tập'] || '').trim();
        const spaceStr = String(row['Không gian'] || row['Không gian nội thất'] || row['space'] || '').trim();
        
        // Xử lý giá bán
        let rawPrice = row['Giá bán'] || row['Giá'] || row['price'] || 0;
        let price = 0;
        if (typeof rawPrice === 'number') {
          price = rawPrice;
        } else if (typeof rawPrice === 'string') {
          const cleaned = rawPrice.replace(/[^\d]/g, '');
          price = cleaned ? parseInt(cleaned, 10) : 0;
        }

        // Xử lý giá gốc (nếu có)
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
          ? allImagesRaw.split(/[\n,;]/).map((s) => s.trim()).filter((s) => s.startsWith('http'))
          : (mainImage ? [mainImage] : []);

        const rawDimensions = String(row['Kích thước'] || row['dimensions'] || row['Thông số / Kích thước'] || '').trim();
        const rawMaterial = String(row['Chất liệu'] || row['material'] || '').trim();
        const rawColor = String(row['Màu sắc / Màu sơn'] || row['Màu sắc'] || row['Màu sơn gỗ'] || row['color'] || '').trim();
        const rawWarranty = String(row['Bảo hành'] || row['warranty'] || '').trim();
        const rawShipping = String(row['Giao hàng / Lắp đặt'] || row['Vận chuyển & Lắp đặt'] || row['shippingNote'] || '').trim();
        const description = String(row['Mô tả chi tiết'] || row['Mô tả'] || row['description'] || name).trim();

        // Tách các danh mục bị gộp bởi dấu phẩy thành các sản phẩm riêng biệt nếu có
        const categories = categoryStr
          ? categoryStr.split(',').map((c) => c.trim()).filter(Boolean)
          : ['Bàn ăn Gỗ Mây'];

        categories.forEach((catItem, subIdx) => {
          let matchedCatId = '';
          const lowerCat = catItem.toLowerCase();
          const matchedCat = currentCategories.find((c) =>
            lowerCat === c.name.toLowerCase() ||
            lowerCat.includes(c.name.toLowerCase()) ||
            c.name.toLowerCase().includes(lowerCat)
          );
          if (matchedCat) {
            matchedCatId = matchedCat.id;
          } else if (currentCategories.length > 0) {
            matchedCatId = currentCategories[0].id;
          }

          const finalSku = sku
            ? (subIdx === 0 ? sku : `${sku}-D${subIdx + 1}`)
            : `SP${(idx + 1).toString().padStart(4, '0')}${subIdx > 0 ? `-D${subIdx + 1}` : ''}`;

          productsToImport.push({
            name,
            sku: finalSku,
            code: finalSku,
            categoryId: matchedCatId,
            collection: catItem,
            space: spaceStr || (matchedCat?.space || 'Phòng Khách'),
            price: price,
            originalPrice: originalPrice > 0 ? originalPrice : price,
            mainImageUrl: mainImage,
            images: imagesList,
            dimensions: rawDimensions,
            material: rawMaterial || 'Gỗ Sồi tự nhiên (Ash / Oak)',
            color: rawColor || 'Nâu hạt dẻ / tự nhiên (Đa dạng)',
            warranty: rawWarranty || '24 tháng',
            shippingNote: rawShipping || 'Miễn phí giao hàng và lắp đặt toàn quốc.',
            description: description,
            shortDescription: catItem,
            inStock: 10,
            stockType: 'in_stock',
          });
        });
      });

      if (productsToImport.length === 0) {
        throw new Error('Không tìm thấy dòng sản phẩm hợp lệ trong file Excel.');
      }

      const result = await productApi.bulkImportProducts(productsToImport);
      hideLoading();
      message.success(result.message || `Đã nhập thành công ${result.count} sản phẩm!`);

      setCurrentPage(1);
      await fetchProducts(1, pageSize, searchQuery, inventoryCategoryFilter, inventoryStockTag);
    } catch (err: any) {
      hideLoading();
      message.error(err?.message || 'Có lỗi xảy ra khi nhập file Excel.');
    } finally {
      setImportingExcel(false);
    }
    return false;
  };

  const currentMainImage = Form.useWatch('image', form);
  const currentSubImages = Form.useWatch('subImages', form);

  const handleUploadMainFile = async (file: File) => {
    setUploadingMain(true);
    try {
      const url = await uploadApi.uploadFile(file);
      form.setFieldsValue({ image: url });
      message.success('Tải ảnh đại diện lên thành công!');
    } catch (err: any) {
      message.error(err?.message || 'Tải ảnh lên thất bại.');
    } finally {
      setUploadingMain(false);
    }
    return false;
  };

  const handleUploadSubFiles = async (file: File, fileList: File[]) => {
    if (file === fileList[0]) {
      setUploadingSub(true);
      try {
        const urls = await uploadApi.uploadMultipleFiles(fileList);
        const existing = form.getFieldValue('subImages') || '';
        const combined = existing ? `${existing.trim()}\n${urls.join('\n')}` : urls.join('\n');
        form.setFieldsValue({ subImages: combined });
        message.success(`Đã tải lên ${urls.length} ảnh phụ thành công!`);
      } catch (err: any) {
        message.error(err?.message || 'Tải ảnh phụ thất bại.');
      } finally {
        setUploadingSub(false);
      }
    }
    return false;
  };

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

    if (draftCreateForm) {
      // Khôi phục lại bản nháp người dùng đang nhập dở
      form.setFieldsValue(draftCreateForm);
    } else {
      // Mở mới hoàn toàn: để trống toàn bộ, không tự điền dữ liệu giả định
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
        name: undefined,
        categoryId: undefined,
        space: 'LivingRoom',
        collection: undefined,
        stockType: 'in_stock',
        stockNote: undefined,
        unit: 'Bộ',
        originalPrice: undefined,
        price: undefined,
        image: undefined,
        subImages: undefined,
        dimensions: undefined,
        material: undefined,
        color: undefined,
        warranty: undefined,
        shippingNote: undefined,
        description: undefined,
      });
    }
    setIsDrawerOpen(true);
  };

  const handleOpenEditModal = (product: FeaturedCatalogProduct) => {
    if (onOpenEditProduct) {
      onOpenEditProduct(product);
      return;
    }
    setEditingProduct(product);
    const rawNum = product.stockNote ? Number(product.stockNote.replace(/\D/g, '')) : 1;
    const subImagesStr = Array.isArray(product.images) && product.images.length > 0
      ? product.images.join('\n')
      : (product.subImages || '');

    form.setFieldsValue({
      name: product.name,
      code: product.code,
      categoryId: product.categoryId,
      space: product.space || 'LivingRoom',
      collection: product.collection,
      originalPrice: product.originalPrice !== undefined ? product.originalPrice : (product.costPrice !== undefined ? product.costPrice : product.price),
      price: product.price,
      stockType: product.stockType,
      stockNote: isNaN(rawNum) ? 1 : rawNum,
      unit: product.unit || 'Bộ',
      image: product.image || '',
      subImages: subImagesStr,
      dimensions: product.dimensions || '',
      material: product.material || '',
      color: product.color || '',
      warranty: product.warranty || '',
      shippingNote: product.shippingNote || '',
      description: product.description || '',
    });
    setIsDrawerOpen(true);
  };

  const handleCopyProduct = async (product: FeaturedCatalogProduct) => {
    const existingCodes = new Set(catalogList.map((p) => (p.code || '').toUpperCase()));
    let nextNum = catalogList.length + 1;
    let autoCode = `SP${nextNum.toString().padStart(4, '0')}`;
    while (existingCodes.has(autoCode)) {
      nextNum++;
      autoCode = `SP${nextNum.toString().padStart(4, '0')}`;
    }
    const cloned: Partial<FeaturedCatalogProduct> = {
      ...product,
      code: autoCode,
      name: `${product.name} (Bản sao)`,
      space: product.space || 'LivingRoom',
      unit: product.unit || 'Bộ',
      originalPrice: product.originalPrice !== undefined ? product.originalPrice : (product.costPrice !== undefined ? product.costPrice : product.price),
      price: product.price,
      image: product.image || '',
      images: product.images || [],
      description: product.description || '',
      dimensions: product.dimensions || '',
      material: product.material || '',
      color: product.color || '',
      warranty: product.warranty || '',
      shippingNote: product.shippingNote || '',
    };
    try {
      const created = await productApi.createProduct(cloned);
      message.success(`Đã nhân bản sản phẩm "${product.name}"!`);
      await fetchProducts(currentPage, pageSize, searchQuery, inventoryCategoryFilter, inventoryStockTag);
    } catch (err: any) {
      message.error(err?.message || 'Nhân bản sản phẩm thất bại.');
    }
  };

  const handleDeleteSelectedProducts = async () => {
    if (!selectedProductKeys.length) return;
    try {
      await Promise.all(
        selectedProductKeys.map((k) => productApi.deleteProduct(String(k)))
      );
      message.success(`Đã xóa ${selectedProductKeys.length} sản phẩm đã chọn!`);
      setSelectedProductKeys([]);
      await fetchProducts(currentPage, pageSize, searchQuery, inventoryCategoryFilter, inventoryStockTag);
    } catch (err: any) {
      message.error(err?.message || 'Xóa sản phẩm thất bại.');
    }
  };

  const handleDeleteSingleProduct = async (id: string, name: string) => {
    try {
      await productApi.deleteProduct(id);
      message.success(`Đã xóa sản phẩm ${name}!`);
      await fetchProducts(currentPage, pageSize, searchQuery, inventoryCategoryFilter, inventoryStockTag);
    } catch (err: any) {
      message.error(err?.message || 'Xóa sản phẩm thất bại.');
    }
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
    const subImagesList = typeof values.subImages === 'string'
      ? values.subImages.split(/[\n,]/).map((s: string) => s.trim()).filter(Boolean)
      : (Array.isArray(values.images) ? values.images : []);

    const rawOriginalPrice = values.originalPrice !== undefined && values.originalPrice !== null
      ? Number(values.originalPrice)
      : (values.price || 0);

    if (editingProduct) {
      const payload: Partial<FeaturedCatalogProduct> = {
        name: values.name,
        code: values.code || editingProduct.code,
        categoryId: values.categoryId,
        categoryName: selectedCategory?.name || values.collection,
        space: values.space || editingProduct.space || 'LivingRoom',
        collection: values.collection || '',
        originalPrice: rawOriginalPrice,
        price: values.price || 0,
        stockType: values.stockType || 'in_stock',
        stockNote: `${values.stockNote || 1} chiếc`,
        unit: values.unit || 'Bộ',
        image: values.image !== undefined ? values.image : (editingProduct.image || ''),
        images: subImagesList,
        subImages: values.subImages || '',
        description: values.description || '',
        dimensions: values.dimensions || '',
        material: values.material || '',
        color: values.color || '',
        warranty: values.warranty || '',
        shippingNote: values.shippingNote || '',
      };
      try {
        const updated = await productApi.updateProduct(editingProduct.id, payload);
        message.success(`Đã cập nhật sản phẩm "${values.name}" thành công!`);
        setIsDrawerOpen(false);
        await fetchProducts(currentPage, pageSize, searchQuery, inventoryCategoryFilter, inventoryStockTag);
      } catch (err: any) {
        message.error(err?.message || 'Cập nhật sản phẩm thất bại.');
      }
    } else {
      const newProductPayload: Partial<FeaturedCatalogProduct> = {
        code: values.code || `SP${(totalProducts + 1).toString().padStart(4, '0')}`,
        name: values.name,
        space: values.space || 'LivingRoom',
        collection: values.collection || '',
        categoryName: selectedCategory?.name || 'Nội Thất Gỗ',
        categoryId: values.categoryId || categoriesList[0]?.id,
        originalPrice: rawOriginalPrice,
        price: values.price || 0,
        stockType: values.stockType || 'in_stock',
        stockNote: `${values.stockNote || 1} chiếc`,
        unit: values.unit || 'Bộ',
        image: values.image || '',
        images: subImagesList,
        subImages: values.subImages || '',
        description: values.description || '',
        dimensions: values.dimensions || '',
        material: values.material || '',
        color: values.color || '',
        warranty: values.warranty || '',
        shippingNote: values.shippingNote || '',
        branch: values.branch || (selectedGlobalBranch !== 'all' ? selectedGlobalBranch : undefined),
      };
      try {
        const created = await productApi.createProduct(newProductPayload);
        setDraftCreateForm(null); // Xóa bản nháp sau khi thêm mới thành công
        form.resetFields();
        message.success(`Đã thêm mới sản phẩm "${created.name}" thành công!`);
        setIsDrawerOpen(false);
        await fetchProducts(1, pageSize, searchQuery, inventoryCategoryFilter, inventoryStockTag);
      } catch (err: any) {
        message.error(err?.message || 'Thêm mới sản phẩm thất bại.');
      }
    }
  };

  const handleRefreshProducts = async () => {
    try {
      setSearchQuery('');
      setInventoryCategoryFilter('all');
      setInventoryStockTag('all');
      setSelectedProductKeys([]);
      setCurrentPage(1);
      await fetchProducts(1, pageSize, '', 'all', 'all');
      message.success('Đã làm mới danh mục sản phẩm!');
    } catch (err: any) {
      message.error(err?.message || 'Làm mới thất bại.');
    }
  };

  const handleExportProductsExcel = async () => {
    if (onExportProductsExcel) {
      onExportProductsExcel();
      return;
    }
    const hideLoading = message.loading('Đang chuẩn bị dữ liệu xuất Excel...', 0);
    try {
      const allProds = await productApi.getProducts({ page: 1, pageSize: 1000 });
      const exportData = (allProds.length > 0 ? allProds : productsList).map((p) => {
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
      hideLoading();
      exportToExcel(exportData, 'Danh_muc_san_pham');
      message.success('Đã xuất danh mục sản phẩm ra Excel thành công!');
    } catch (e: any) {
      hideLoading();
      message.error('Xuất Excel thất bại.');
    }
  };

  const renderProductDetailRow = (prod: FeaturedCatalogProduct) => {
    const currentTab = (productRowTabs[prod.id] as any) || 'info';
    const setTab = (t: 'info' | 'notes' | 'inventory') => {
      setProductRowTabs((prev) => ({ ...prev, [prod.id]: t }));
    };

    const catName = categoriesList.find((c) => c.id === prod.categoryId)?.name || prod.categoryName || prod.collection || 'Chưa có';
    const origPrice = prod.originalPrice !== undefined && prod.originalPrice !== null ? prod.originalPrice : (prod.costPrice || prod.price || 0);
    const salePrice = prod.price || 0;

    const rawNum = prod.stockNote ? prod.stockNote.replace(/\D/g, '') : '';
    const stockCount = rawNum !== '' ? parseInt(rawNum, 10) : 0;

    return (
      <div
        className="bg-white border-x border-b border-slate-200 shadow-sm overflow-hidden mb-2 text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header Tabs Strip (Thông tin, Mô tả, ghi chú, Tồn kho) */}
        <div className="flex items-center gap-6 border-b border-slate-200 px-5 pt-3 bg-white">
          {[
            { key: 'info', label: 'Thông tin' },
            { key: 'notes', label: 'Mô tả, ghi chú' },
            { key: 'inventory', label: 'Tồn kho' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setTab(tab.key as any);
              }}
              className={`border-b-2 px-1 pb-2.5 text-xs font-normal whitespace-nowrap transition-colors cursor-pointer ${
                currentTab === tab.key
                  ? 'border-[#784e34] text-[#784e34]'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 2. Tab Content */}
        <div className="p-5">
          {/* TAB 1: THÔNG TIN (Hiện đầy đủ các trường của sản phẩm khi tạo mới/chỉnh sửa) */}
          {currentTab === 'info' && (
            <div className="space-y-6">
              {/* Product Header: Thumbnail + Name + Group + Badges */}
              <div className="flex items-start gap-4">
                {prod.image ? (
                  <img
                    src={prod.image}
                    alt={prod.name}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-md object-cover border border-slate-200 shrink-0 bg-slate-50"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-md bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400 shrink-0">
                    <PictureOutlined className="text-2xl" />
                  </div>
                )}

                <div className="space-y-1.5 min-w-0">
                  <h3 className="text-base sm:text-lg font-normal text-slate-900 m-0 leading-snug">
                    {prod.name}
                  </h3>
                  <div className="text-xs text-slate-500">
                    Danh mục: <span className="text-slate-700">{catName}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {prod.stockType === 'in_stock' ? (
                      <Tag className="border-0 bg-emerald-50 text-emerald-700 text-xs font-normal m-0">Còn hàng sẵn</Tag>
                    ) : prod.stockType === 'custom' ? (
                      <Tag className="border-0 bg-blue-50 text-blue-700 text-xs font-normal m-0">May đo theo đơn</Tag>
                    ) : (
                      <Tag className="border-0 bg-amber-50 text-amber-700 text-xs font-normal m-0">Sắp hết hàng</Tag>
                    )}
                    {prod.collection && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded font-normal">
                        {prod.collection}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 4-Column Key-Value Grid of all product fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6 pt-2 text-xs">
                {/* Row 1 */}
                <div>
                  <div className="text-slate-500 mb-1">Mã sản phẩm</div>
                  <div className="text-slate-900 text-sm">{prod.code || '---'}</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-1">Danh mục thiết kế</div>
                  <div className="text-slate-900 text-sm">{catName}</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-1">Bộ sưu tập</div>
                  <div className="text-slate-900 text-sm">{prod.collection || 'Chưa có'}</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-1">Tình trạng tồn kho</div>
                  <div className="text-slate-900 text-sm">
                    {prod.stockType === 'in_stock' ? 'Còn hàng sẵn' : prod.stockType === 'custom' ? 'May đo theo đơn' : 'Sắp hết hàng'}
                  </div>
                </div>

                {/* Row 2 */}
                <div>
                  <div className="text-slate-500 mb-1">Số lượng tồn kho (ĐVT)</div>
                  <div className="text-slate-900 text-sm font-semibold">{stockCount} <span className="text-[#784e34] font-medium font-mono">({prod.unit || 'Bộ'})</span></div>
                </div>
                <div>
                  <div className="text-slate-500 mb-1">Giá gốc / Giá vốn</div>
                  <div className="text-slate-900 text-sm">{(origPrice || 0).toLocaleString('vi-VN')} đ</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-1">Giá bán niêm yết</div>
                  <div className="text-sm text-[#784e34]">{(salePrice || 0).toLocaleString('vi-VN')} đ</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-1">Kích thước (D x R x C)</div>
                  <div className="text-slate-900 text-sm">{prod.dimensions || 'Chưa có'}</div>
                </div>

                {/* Row 3 */}
                <div>
                  <div className="text-slate-500 mb-1">Chất liệu gỗ / đệm</div>
                  <div className="text-slate-900 text-sm">{prod.material || 'Chưa có'}</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-1">Màu sơn / Hoàn thiện</div>
                  <div className="text-slate-900 text-sm">{prod.color || 'Chưa có'}</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-1">Bảo hành chính hãng</div>
                  <div className="text-slate-900 text-sm">{prod.warranty || '24 tháng'}</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-1">Vận chuyển & Lắp đặt</div>
                  <div className="text-slate-900 text-sm">{prod.shippingNote || 'Miễn phí nội thành'}</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MÔ TẢ, GHI CHÚ */}
          {currentTab === 'notes' && (
            <div className="text-xs text-slate-700 bg-slate-50 p-4 rounded border border-slate-200 leading-relaxed whitespace-pre-line min-h-[100px]">
              {prod.description || 'Chưa có mô tả, ghi chú cho sản phẩm này.'}
            </div>
          )}

          {/* TAB 3: TỒN KHO */}
          {currentTab === 'inventory' && (
            <div className="overflow-x-auto border border-slate-200 bg-white rounded">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-normal">
                  <tr>
                    <th className="px-3 py-2 text-left font-normal">Chi nhánh / Kho hàng</th>
                    <th className="px-3 py-2 text-center w-32 font-normal">Tồn kho</th>
                    <th className="px-3 py-2 text-center w-32 font-normal">Đặt trước</th>
                    <th className="px-3 py-2 text-center w-32 font-normal">Có thể bán</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { name: 'Chi nhánh Trung Tâm (Quận 1)', total: stockCount, reserved: 0, available: stockCount },
                    { name: 'Showroom Nam Sài Gòn (Quận 7)', total: 0, reserved: 0, available: 0 },
                    { name: 'Xưởng Sản Xuất (Bình Dương)', total: 0, reserved: 0, available: 0 },
                  ].map((b, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5 text-slate-900">{b.name}</td>
                      <td className="px-3 py-2.5 text-center font-mono text-slate-900">{b.total}</td>
                      <td className="px-3 py-2.5 text-center font-mono text-slate-500">{b.reserved}</td>
                      <td className="px-3 py-2.5 text-center font-mono text-[#784e34]">{b.available}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 3. Action Footer Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 bg-white border-t border-slate-200">
          {/* Left: Thu gọn, Chỉnh sửa, Xóa */}
          <div className="flex items-center gap-2">
            <Button
              size="small"
              icon={<UpOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                setExpandedProductRowKeys((prev) => prev.filter((k) => k !== prod.id));
              }}
              className="h-8 rounded border-slate-300 px-3 text-xs text-slate-700 bg-white hover:border-slate-400 flex items-center gap-1.5"
            >
              Thu gọn
            </Button>

            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleOpenEditModal(prod);
              }}
              className="h-8 rounded !bg-[#784e34] hover:!bg-[#633f2a] text-white px-3.5 text-xs font-normal flex items-center gap-1.5 border-none shadow-none"
            >
              Chỉnh sửa
            </Button>

            <Popconfirm
              title={`Xóa sản phẩm "${prod.name}"?`}
              description="Hành động này không thể hoàn tác."
              onConfirm={(e) => {
                e?.stopPropagation();
                handleDeleteSingleProduct(prod.id, prod.name);
              }}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
            >
              <Button
                size="small"
                icon={<DeleteOutlined />}
                onClick={(e) => e.stopPropagation()}
                className="h-8 rounded border-rose-300 px-3 text-xs text-rose-500 bg-white hover:bg-rose-50 hover:border-rose-400 flex items-center gap-1.5"
              >
                Xóa
              </Button>
            </Popconfirm>
          </div>

          {/* Right: Nhập hàng */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="small"
              icon={<BarcodeOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                message.info(`Tạo phiếu nhập hàng cho sản phẩm ${prod.code}...`);
              }}
              className="h-8 rounded border-slate-300 px-3 text-xs text-slate-700 bg-white hover:text-[#784e34] hover:border-[#784e34] flex items-center gap-1.5"
            >
              Nhập hàng
            </Button>
          </div>
        </div>
      </div>
    );
  };

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
            setCurrentPage(1);
          }}
        >
          {/* Filter 1: Danh mục thiết kế */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-800 text-xs block">Danh mục thiết kế</label>
            <Select
              value={inventoryCategoryFilter}
              onChange={(v) => {
                setInventoryCategoryFilter(v);
                setCurrentPage(1);
              }}
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
              onChange={(v) => {
                setInventoryStockTag(v);
                setCurrentPage(1);
              }}
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
              { label: 'Tổng mẫu thiết kế', value: `${totalProducts} mẫu` },
              { label: 'Đang hiển thị', value: `${productsList.length} mẫu`, color: 'success' },
              { label: 'Trang hiện tại', value: `Trang ${currentPage}`, color: 'primary' },
            ]}
          />
        </AdminFilterSidebar>

        {/* RIGHT MAIN CONTENT CONTAINER */}
        <div className="flex-1 w-full min-w-0">
          {/* CATALOG PRODUCTS TABLE WITH SELECTION TOOLBAR */}
          <AdminDataTable<FeaturedCatalogProduct>
            enableSelectionToolbar
            selectedRowKeys={selectedProductKeys}
            onSelectionChange={(keys) => setSelectedProductKeys(keys)}
            titleText="Quản lý sản phẩm"
            totalCount={totalProducts}
            countUnit="sản phẩm"
            loading={loading}
            dataSource={productsList}
            rowKey="id"
            onRow={(record) => ({
              onClick: () => handleToggleExpandProduct(record.id),
              className: 'cursor-pointer hover:bg-[#fbf2ee]/40 transition-colors',
            })}
            expandable={{
              expandedRowKeys: expandedProductRowKeys,
              onExpand: (expanded, record) => {
                handleToggleExpandProduct(record.id);
              },
              expandedRowRender: (prod) => renderProductDetailRow(prod),
              showExpandColumn: false,
            }}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: totalProducts,
              onChange: (page, pSize) => {
                setCurrentPage(page);
                if (pSize && pSize !== pageSize) {
                  setPageSize(pSize);
                }
              },
            }}
            onCopySelected={handleCopySelectedProduct}
            onEditSelected={handleEditSelectedProduct}
            onDeleteSelected={handleDeleteSelectedProducts}
            deleteConfirmTitle={`Xóa ${selectedProductKeys.length} sản phẩm đã chọn?`}
            onCreateNew={handleOpenCreateModal}
            createButtonText="Thêm mới"
            searchValue={searchQuery}
            onSearchChange={(val) => {
              setSearchQuery(val);
              setCurrentPage(1);
            }}
            searchPlaceholder="Tìm theo mã sản phẩm, tên, bộ sưu tập..."
            extraHeaderActions={
              <>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleRefreshProducts}
                  className="!h-8 px-2.5 rounded-lg border-slate-300 bg-white text-slate-700 text-xs shadow-xs inline-flex items-center justify-center hover:text-[#784e34]"
                  title="Làm mới"
                >
                  Làm mới
                </Button>
                <Upload
                  accept=".xlsx,.xls"
                  showUploadList={false}
                  beforeUpload={handleImportExcel}
                  disabled={importingExcel}
                >
                  <Button
                    icon={<FileExcelOutlined />}
                    loading={importingExcel}
                    className="!h-8 px-2.5 rounded-lg border-emerald-600/30 bg-emerald-50 text-emerald-700 text-xs shadow-xs inline-flex items-center justify-center hover:!bg-emerald-100 hover:!border-emerald-600 hover:!text-emerald-800"
                    title="Nhập dữ liệu sản phẩm từ file Excel"
                  >
                    Nhập Excel
                  </Button>
                </Upload>
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
            columns={[
              {
                title: 'Mã / Tên sản phẩm',
                dataIndex: 'name',
                key: 'name',
                render: (text, prod) => {
                  const catName = categoriesList.find((c) => c.id === prod.categoryId)?.name || prod.categoryName || prod.collection;
                  return (
                    <div className="flex items-center gap-3 min-w-0">
                      {prod.image ? (
                        <img
                          src={prod.image}
                          alt={text}
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-50"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                          <span className="material-symbols-outlined text-lg">chair</span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleExpandProduct(prod.id);
                          }}
                          className="font-semibold text-slate-900 text-sm hover:text-[#784e34] cursor-pointer transition-colors line-clamp-1"
                        >
                          {text}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleExpandProduct(prod.id);
                            }}
                            className="font-mono text-xs font-semibold text-[#784e34] bg-[#784e34]/10 hover:bg-[#784e34]/20 px-1.5 py-0.5 rounded border-none cursor-pointer"
                          >
                            {prod.code}
                          </button>
                          <span className="text-slate-300">•</span>
                          <span className="text-xs text-slate-500">{catName}</span>
                        </div>
                      </div>
                    </div>
                  );
                },
              },
              {
                title: 'ĐVT',
                dataIndex: 'unit',
                key: 'unit',
                align: 'center',
                width: 80,
                render: (unit, prod) => (
                  <Tag className="border-0 bg-amber-50 text-[#784e34] text-xs font-semibold font-mono m-0">
                    {prod.unit || unit || 'Bộ'}
                  </Tag>
                ),
              },
              {
                title: 'Tồn kho',
                dataIndex: 'stockNote',
                key: 'stockNote',
                align: 'center',
                width: 130,
                render: (note, prod) => {
                  const rawNum = prod.stockNote ? prod.stockNote.replace(/\D/g, '') : '';
                  const count = rawNum !== '' ? parseInt(rawNum, 10) : 0;
                  return (
                    <span className="font-mono font-semibold text-xs text-slate-800">
                      {count} <span className="text-slate-400 font-normal font-sans">{prod.unit || 'chiếc'}</span>
                    </span>
                  );
                },
              },
              {
                title: 'Giá vốn (Gốc)',
                dataIndex: 'originalPrice',
                key: 'originalPrice',
                align: 'right',
                width: 140,
                render: (orig, prod) => {
                  const val = orig !== undefined && orig !== null ? orig : (prod.costPrice || prod.price || 0);
                  return (
                    <span className="font-mono text-xs font-semibold text-slate-700">
                      {(val || 0).toLocaleString('vi-VN')} đ
                    </span>
                  );
                },
              },
              {
                title: 'Giá bán niêm yết',
                dataIndex: 'price',
                key: 'price',
                align: 'right',
                width: 150,
                render: (p) => (
                  <span className="font-mono font-bold text-xs sm:text-sm text-[#784e34]">
                    {(p || 0).toLocaleString('vi-VN')} đ
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
                      onConfirm={() => handleDeleteSingleProduct(prod.id, prod.name)}
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
        onClose={handleCloseDrawer}
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
            <Col span={8}>
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
            <Col span={8}>
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
            <Col span={8}>
              <Form.Item
                label={<span className="text-xs font-semibold text-slate-700">Không gian nội thất</span>}
                name="space"
                initialValue="LivingRoom"
              >
                <Select
                  placeholder="Chọn không gian"
                  className="h-10 text-sm"
                  options={spaceSelectOptions}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                label={<span className="text-xs font-semibold text-slate-700">Tên sản phẩm <span className="text-red-500">*</span></span>}
                name="name"
                rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}
              >
                <Input placeholder="VD: Sofa Gỗ Óc Chó Kyoto, Bàn Ăn Komorebi..." className="h-10 text-sm rounded-lg" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label={<span className="text-xs font-semibold text-slate-700">Bộ sưu tập</span>}
                name="collection"
              >
                <Input placeholder="VD: Kyoto Collection 2026" className="h-10 text-sm rounded-lg" />
              </Form.Item>
            </Col>
          </Row>

          {/* DUAL PRICING: GIÁ GỐC (GIÁ VỐN / NHẬP HÀNG) & GIÁ BÁN (NIÊM YẾT) */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-slate-700">Giá gốc / Giá vốn</span>
                    <span className="text-[11px] text-slate-400 font-normal">(Giá nhập kho)</span>
                  </div>
                }
                name="originalPrice"
                tooltip="Giá vốn dùng khi lập phiếu nhập hàng, xuất trả hàng hoặc tính giá vốn hàng bán"
              >
                <InputNumber
                  className="!w-full h-10 text-sm rounded-lg font-mono font-medium"
                  controls={false}
                  formatter={(val) => (val !== undefined && val !== null ? `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '')}
                  parser={(val) => (val ? Number(val.replace(/\$\s?|(,*)/g, '')) : 0)}
                  placeholder="VD: 25,000,000"
                  suffix={<span className="text-xs text-slate-400 font-normal">VNĐ</span>}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-slate-700">Giá bán niêm yết <span className="text-red-500">*</span></span>
                    <span className="text-[11px] text-slate-400 font-normal">(Giá bán lẻ)</span>
                  </div>
                }
                name="price"
                rules={[{ required: true, message: 'Vui lòng nhập giá bán niêm yết' }]}
                tooltip="Giá bán tiêu chuẩn hiển thị cho khách hàng và lập đơn bán hàng"
              >
                <InputNumber
                  className="!w-full h-10 text-sm rounded-lg font-mono font-bold text-[#784e34]"
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
            <Col span={8}>
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
            <Col span={8}>
              <Form.Item
                label={<span className="text-xs font-semibold text-slate-700">Đơn vị tính</span>}
                name="unit"
                initialValue="Bộ"
              >
                <Select
                  className="h-10 text-sm"
                  showSearch
                  placeholder="Chọn ĐVT"
                  options={uomSelectOptions}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label={<span className="text-xs font-semibold text-slate-700">Số lượng tồn kho</span>}
                name="stockNote"
              >
                <InputNumber
                  min={0}
                  className="!w-full h-10 text-sm rounded-lg"
                  controls={false}
                  placeholder="VD: 10"
                />
              </Form.Item>
            </Col>
          </Row>

          {/* ẢNH ĐẠI DIỆN CHÍNH (URL + TẢI TỪ MÁY) */}
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Ảnh đại diện chính</span>
              <Upload
                showUploadList={false}
                beforeUpload={handleUploadMainFile}
                accept="image/*"
              >
                <Button
                  size="small"
                  icon={<UploadOutlined />}
                  loading={uploadingMain}
                  className="text-xs rounded-lg border-slate-300 hover:text-[#784e34] hover:border-[#784e34]"
                >
                  Tải ảnh từ máy
                </Button>
              </Upload>
            </div>
            <Form.Item name="image" className="!mb-0">
              <Input
                placeholder="https://images.unsplash.com/... hoặc bấm nút tải từ máy"
                className="h-10 text-sm rounded-lg bg-white"
              />
            </Form.Item>
            {currentMainImage && (
              <div className="relative inline-block mt-2">
                <img
                  src={currentMainImage}
                  alt="Ảnh xem trước"
                  className="w-20 h-20 object-cover rounded-lg border border-slate-200 bg-white shadow-xs"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => form.setFieldsValue({ image: '' })}
                  className="absolute -top-1.5 -right-1.5 bg-white rounded-full text-slate-400 hover:text-red-500 border-0 p-0 cursor-pointer shadow-xs"
                  title="Gỡ ảnh"
                >
                  <CloseCircleFilled className="text-base text-red-500 hover:text-red-600" />
                </button>
              </div>
            )}
          </div>

          {/* ẢNH PHỤ / BỘ SƯU TẬP ẢNH (URL + TẢI TỪ MÁY) */}
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-700 block">Ảnh phụ / Bộ sưu tập ảnh</span>
                <span className="text-[11px] text-slate-400">Mỗi link một dòng hoặc tải nhiều file từ máy</span>
              </div>
              <Upload
                multiple
                showUploadList={false}
                beforeUpload={handleUploadSubFiles}
                accept="image/*"
              >
                <Button
                  size="small"
                  icon={<UploadOutlined />}
                  loading={uploadingSub}
                  className="text-xs rounded-lg border-slate-300 hover:text-[#784e34] hover:border-[#784e34]"
                >
                  Tải nhiều ảnh từ máy
                </Button>
              </Upload>
            </div>
            <Form.Item name="subImages" className="!mb-0">
              <Input.TextArea
                rows={3}
                placeholder="https://images.unsplash.com/photo-detail-1...&#10;https://images.unsplash.com/photo-detail-2..."
                className="text-sm rounded-lg bg-white"
              />
            </Form.Item>
            {currentSubImages && (
              <div className="flex flex-wrap gap-2 mt-2">
                {currentSubImages
                  .split(/[\n,]/)
                  .map((u: string) => u.trim())
                  .filter(Boolean)
                  .map((imgUrl: string, idx: number) => (
                    <div key={idx} className="relative group">
                      <img
                        src={imgUrl}
                        alt={`Ảnh phụ ${idx + 1}`}
                        className="w-14 h-14 object-cover rounded-lg border border-slate-200 bg-white shadow-xs"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const urls = currentSubImages
                            .split(/[\n,]/)
                            .map((u: string) => u.trim())
                            .filter(Boolean);
                          const updated = urls.filter((_: string, i: number) => i !== idx).join('\n');
                          form.setFieldsValue({ subImages: updated });
                        }}
                        className="absolute -top-1 -right-1 bg-white rounded-full text-slate-400 hover:text-red-500 border-0 p-0 cursor-pointer shadow-xs"
                        title="Gỡ ảnh"
                      >
                        <CloseCircleFilled className="text-xs text-red-500 hover:text-red-600" />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
          {/* THÔNG SỐ KỸ THUẬT CHI TIẾT */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={<span className="text-xs font-semibold text-slate-700">Kích thước (Dài x Rộng x Cao)</span>}
                name="dimensions"
              >
                <Input placeholder="VD: L1800 x W800 x H750 mm" className="h-10 text-sm rounded-lg" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={<span className="text-xs font-semibold text-slate-700">Chất liệu gỗ / đệm</span>}
                name="material"
              >
                <Input placeholder="VD: Gỗ Sồi tự nhiên (Ash/Oak)" className="h-10 text-sm rounded-lg" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={<span className="text-xs font-semibold text-slate-700">Màu sắc / Màu sơn gỗ</span>}
                name="color"
              >
                <Input placeholder="VD: Nâu hạt dẻ / tự nhiên (Đa dạng)" className="h-10 text-sm rounded-lg" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={<span className="text-xs font-semibold text-slate-700">Thời gian bảo hành</span>}
                name="warranty"
              >
                <Input placeholder="VD: 24 tháng" className="h-10 text-sm rounded-lg" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label={<span className="text-xs font-semibold text-slate-700">Chính sách giao hàng & lắp đặt</span>}
            name="shippingNote"
          >
            <Input placeholder="VD: Miễn phí giao hàng và lắp đặt toàn quốc." className="h-10 text-sm rounded-lg" />
          </Form.Item>

          {/* MÔ TẢ CHI TIẾT SẢN PHẨM */}
          <Form.Item
            label={<span className="text-xs font-semibold text-slate-700">Mô tả chi tiết sản phẩm</span>}
            name="description"
          >
            <Input.TextArea
              rows={4}
              placeholder="Nhập thông tin mô tả chi tiết, câu chuyện thiết kế, nét đẹp không gian..."
              className="text-sm rounded-lg"
            />
          </Form.Item>
        </Form>
      </AdminFormDrawer>
    </div>
  );
}

