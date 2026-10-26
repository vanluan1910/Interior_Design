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
  AutoComplete,
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
  UploadOutlined,
  InboxOutlined,
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
import {
  AdminDataTable,
  AdminFormDrawer,
  AdminFilterSidebar,
  AdminSidebarSummary,
  AutoCodeButton,
  getNextCode,
} from '@/components/admin';
import type { FeaturedCatalogProduct, AdminCategory, AdminSpace } from '@/types/admin';
import { exportToExcel } from '@/utils/exportExcel';
import { productApi } from '@/api/productApi';
import { categoryApi } from '@/api/categoryApi';
import { uploadApi } from '@/api/uploadApi';
import { spaceApi } from '@/api/spaceApi';
import { WOOD_MATERIAL_AUTOCOMPLETE_OPTIONS } from '@/data/woodMaterials';
import { getProductStockForBranch, isMatchBranch } from '@/utils/branchHelper';

export interface InventoryTabProps {
  catalogList: FeaturedCatalogProduct[];
  setCatalogList: React.Dispatch<React.SetStateAction<FeaturedCatalogProduct[]>>;
  categoriesList: AdminCategory[];
  spacesList?: AdminSpace[];
  branchesList?: import('@/types/admin').AdminBranch[];
  selectedGlobalBranch?: string;
  initialSearch?: string;
  onClearInitialSearch?: () => void;
  onOpenCreateProduct?: () => void;
  onOpenEditProduct?: (product: FeaturedCatalogProduct) => void;
  onExportProductsExcel?: () => void;
  onNavigateToCreateImport?: (product: FeaturedCatalogProduct) => void;
}

export function InventoryTab({
  catalogList,
  setCatalogList,
  categoriesList,
  spacesList = [],
  branchesList = [],
  selectedGlobalBranch = 'all',
  initialSearch,
  onClearInitialSearch,
  onOpenCreateProduct,
  onOpenEditProduct,
  onExportProductsExcel,
  onNavigateToCreateImport,
}: InventoryTabProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [selectedProductKeys, setSelectedProductKeys] = useState<React.Key[]>([]);
  const [searchQuery, setSearchQuery] = useState(initialSearch || '');
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState('all');
  const [inventoryStockTag, setInventoryStockTag] = useState('all');
  const [branchFilter, setBranchFilter] = useState<string>(selectedGlobalBranch || 'all');

  useEffect(() => {
    if (selectedGlobalBranch) {
      setBranchFilter(selectedGlobalBranch);
    }
  }, [selectedGlobalBranch]);

  // Server-Side Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalProducts, setTotalProducts] = useState(catalogList?.length || 0);
  const [productsList, setProductsList] = useState<FeaturedCatalogProduct[]>(catalogList || []);
  const [loading, setLoading] = useState(false);

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
      }).catch(() => { });
    }
  }, [spacesList]);

  const spaceSelectOptions = useMemo(() => {
    if (!currentSpaces || currentSpaces.length === 0) return [];
    return currentSpaces.map((s) => ({
      value: s.name,
      label: s.name,
    }));
  }, [currentSpaces]);

  // Dynamic Real Wood Materials from Database for Form AutoComplete
  const [dbWoodMaterials, setDbWoodMaterials] = useState<string[]>([]);
  useEffect(() => {
    productApi.getMaterials().then((res) => {
      if (Array.isArray(res) && res.length > 0) {
        setDbWoodMaterials(res.map((r) => r.name).filter(Boolean));
      }
    }).catch(() => { });
  }, []);

  const woodMaterialOptions = useMemo(() => {
    const set = new Set<string>();
    dbWoodMaterials.forEach((m) => set.add(m));
    WOOD_MATERIAL_AUTOCOMPLETE_OPTIONS.forEach((o) => set.add(o.value));
    return Array.from(set).map((m) => ({ value: m, label: m }));
  }, [dbWoodMaterials]);

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
    async (page: number, size: number, search: string, catId: string, status: string, branch: string = branchFilter) => {
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
    [setCatalogList, branchFilter]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(currentPage, pageSize, searchQuery, inventoryCategoryFilter, inventoryStockTag, branchFilter);
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchProducts, currentPage, pageSize, searchQuery, inventoryCategoryFilter, inventoryStockTag, branchFilter]);

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
      const XLSX = await import('xlsx');
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
      const usedSkusInBatch = new Set<string>();
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
          ? allImagesRaw.split(/[\n,;]/).map((s) => s.trim()).filter((s) => s.startsWith('http') || s.startsWith('/'))
          : (mainImage ? [mainImage] : []);

        const rawDimensions = String(row['Kích thước'] || row['dimensions'] || row['Thông số / Kích thước'] || '').trim();
        const rawMaterial = String(row['Chất liệu'] || row['material'] || '').trim();
        const rawColor = String(row['Màu sắc / Màu sơn'] || row['Màu sắc'] || row['Màu sơn gỗ'] || row['color'] || '').trim();
        const rawWarranty = String(row['Bảo hành'] || row['warranty'] || '').trim();
        const rawShipping = String(row['Giao hàng / Lắp đặt'] || row['Vận chuyển & Lắp đặt'] || row['shippingNote'] || '').trim();
        const description = String(row['Mô tả sản phẩm'] || row['Mô tả chi tiết'] || row['Mô tả'] || row['description'] || name).trim();

        // Tự động nhận diện chính xác danh mục nếu tên sản phẩm hoặc mã SKU là đặc trưng:
        let resolvedCategoryStr = categoryStr;
        const lowerName = name.toLowerCase();
        const upperSku = sku.toUpperCase();
        if (lowerName.includes('táp') || upperSku.startsWith('TAP')) {
          resolvedCategoryStr = 'Táp đầu giường';
        }

        // Tách các danh mục bị gộp bởi dấu phẩy thành các sản phẩm riêng biệt nếu có
        const categories = resolvedCategoryStr
          ? resolvedCategoryStr.split(',').map((c) => c.trim()).filter(Boolean)
          : ['Sản phẩm nội thất'];

        categories.forEach((catItem, subIdx) => {
          let matchedCatId = '00000000-0000-0000-0000-000000000000';
          const lowerCat = catItem.toLowerCase().trim();
          
          // 1. Ưu tiên khớp chính xác tên danh mục trước
          let matchedCat = currentCategories.find((c) => lowerCat === c.name.toLowerCase().trim());
          if (!matchedCat) {
            // 2. Nếu không khớp chính xác, thử khớp chứa (ưu tiên tên danh mục dài hơn trước)
            const sortedByLength = [...currentCategories].sort((a, b) => (b.name?.length || 0) - (a.name?.length || 0));
            matchedCat = sortedByLength.find((c) =>
              lowerCat.includes(c.name.toLowerCase().trim()) ||
              c.name.toLowerCase().trim().includes(lowerCat)
            );
          }

          if (matchedCat && matchedCat.id) {
            matchedCatId = matchedCat.id;
          }

          // Chuẩn hóa không gian: Ưu tiên không gian chuẩn của danh mục đã cấu hình
          let finalSpace = matchedCat?.space || spaceStr;
          if (!finalSpace || finalSpace === 'Phòng ăn' && (lowerCat.includes('bàn trà') || lowerCat.includes('bàn nước'))) {
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

          if (usedSkusInBatch.has(finalSku.toLowerCase())) {
            finalSku = `${finalSku}-${(idx + 1).toString().padStart(2, '0')}`;
          }
          usedSkusInBatch.add(finalSku.toLowerCase());

          productsToImport.push({
            name,
            sku: finalSku,
            code: finalSku,
            categoryId: matchedCatId,
            collection: catItem,
            space: finalSpace,
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

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('categories_changed'));
      }

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
    const currentCode = form.getFieldValue('code');
    const genCode = getNextCode(currentCode, productsList || catalogList, 'SP', 4);
    form.setFieldsValue({ code: genCode });
    message.success(`Đã tự động tạo mã sản phẩm mới: ${genCode}`);
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
      const existingCodes = new Set((productsList || catalogList).map((p) => (p.code || '').toUpperCase()));
      let nextNum = (totalProducts || productsList.length || catalogList.length) + 1;
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
        space: 'Phòng khách',
        collection: undefined,
        stockNote: 0,
        unit: 'Bộ',
        originalPrice: undefined,
        discountPercent: 0,
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
    const rawNum = product.stockNote ? Number(product.stockNote.replace(/[^-0-9]/g, '')) : 0;
    const currentStock = product.inStock !== undefined ? product.inStock : (isNaN(rawNum) ? 0 : rawNum);
    const subImagesStr = Array.isArray(product.images) && product.images.length > 0
      ? product.images.join('\n')
      : (product.subImages || '');

    const initialDiscount = product.discountPercent !== undefined && product.discountPercent !== null
      ? product.discountPercent
      : (product.originalPrice && product.price && product.originalPrice > product.price
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0);

    form.setFieldsValue({
      name: product.name,
      code: product.code,
      categoryId: product.categoryId,
      space: product.space || 'Phòng khách',
      collection: product.collection,
      originalPrice: product.originalPrice !== undefined ? product.originalPrice : (product.costPrice !== undefined ? product.costPrice : product.price),
      discountPercent: initialDiscount,
      price: product.price,
      stockNote: currentStock,
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
        selectedProductKeys.map((k) => productApi.deleteProduct(String(k), selectedGlobalBranch))
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
      await productApi.deleteProduct(id, selectedGlobalBranch);
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

  const handlePriceOrDiscountChange = (changedValues: any, allValues: any) => {
    const orig = allValues.originalPrice;
    const curPrice = allValues.price;

    if ('discountPercent' in changedValues) {
      const disc = changedValues.discountPercent;
      if (typeof disc === 'number' && disc > 0 && disc < 100) {
        if (typeof orig === 'number' && orig > 0) {
          const calculatedPrice = Math.round(orig * (1 - disc / 100));
          form.setFieldsValue({ price: calculatedPrice });
        } else if (typeof curPrice === 'number' && curPrice > 0) {
          const calculatedOrig = Math.round(curPrice / (1 - disc / 100));
          form.setFieldsValue({ originalPrice: calculatedOrig });
        }
      } else if (disc === 0 || disc === undefined) {
        if (typeof curPrice === 'number' && curPrice > 0 && (!orig || orig < curPrice)) {
          form.setFieldsValue({ originalPrice: curPrice });
        }
      }
    } else if ('originalPrice' in changedValues) {
      const origVal = changedValues.originalPrice;
      const disc = allValues.discountPercent;
      if (typeof origVal === 'number' && origVal > 0) {
        if (typeof disc === 'number' && disc > 0 && disc < 100) {
          const calculatedPrice = Math.round(origVal * (1 - disc / 100));
          form.setFieldsValue({ price: calculatedPrice });
        } else if (typeof curPrice === 'number' && curPrice > 0 && origVal > curPrice) {
          const calculatedDisc = Math.round(((origVal - curPrice) / origVal) * 100);
          form.setFieldsValue({ discountPercent: calculatedDisc });
        } else if (!curPrice) {
          form.setFieldsValue({ price: origVal, discountPercent: 0 });
        }
      }
    } else if ('price' in changedValues) {
      const newPrice = changedValues.price;
      if (typeof orig === 'number' && orig > 0 && typeof newPrice === 'number' && newPrice > 0) {
        if (orig > newPrice) {
          const calculatedDisc = Math.round(((orig - newPrice) / orig) * 100);
          form.setFieldsValue({ discountPercent: calculatedDisc });
        } else {
          form.setFieldsValue({ discountPercent: 0, originalPrice: newPrice });
        }
      }
    }
  };

  const handleSaveProduct = async (values: any) => {
    const selectedCategory = categoriesList.find((c) => c.id === values.categoryId);
    const subImagesList = typeof values.subImages === 'string'
      ? values.subImages.split(/[\n,]/).map((s: string) => s.trim()).filter(Boolean)
      : (Array.isArray(values.images) ? values.images : []);

    const rawPrice = Number(values.price) || 0;
    let rawOriginalPrice = values.originalPrice !== undefined && values.originalPrice !== null
      ? Number(values.originalPrice)
      : rawPrice;
    let rawDiscount = values.discountPercent !== undefined && values.discountPercent !== null
      ? Number(values.discountPercent)
      : 0;

    // Tự động chuẩn hóa để giảm giá luôn hiển thị chính xác trên toàn hệ thống
    if (rawDiscount > 0 && (rawOriginalPrice <= rawPrice || isNaN(rawOriginalPrice))) {
      rawOriginalPrice = Math.round(rawPrice / (1 - rawDiscount / 100));
    } else if (rawOriginalPrice > rawPrice && rawDiscount <= 0) {
      rawDiscount = Math.round(((rawOriginalPrice - rawPrice) / rawOriginalPrice) * 100);
    }

    if (editingProduct) {
      // Tồn kho không sửa trực tiếp ở màn hình này mà được quản lý qua Nhập hàng, Trả hàng, Kiểm kho & Đơn hàng
      const preservedStock = editingProduct.inStock !== undefined ? editingProduct.inStock : 0;
      const preservedStockNote = editingProduct.stockNote || `${preservedStock}`;
      const preservedBranchStocksJson = editingProduct.branchStocksJson || '{}';
      const preservedStockType = editingProduct.stockType || (preservedStock <= 0 ? 'out_of_stock' : preservedStock <= 5 ? 'low' : 'in_stock');

      const payload: Partial<FeaturedCatalogProduct> = {
        name: values.name,
        code: values.code || editingProduct.code,
        categoryId: values.categoryId,
        categoryName: selectedCategory?.name || values.collection,
        space: values.space || selectedCategory?.space || editingProduct.space || 'Phòng khách',
        collection: values.collection || '',
        originalPrice: rawOriginalPrice,
        discountPercent: rawDiscount,
        price: rawPrice,
        stockType: preservedStockType,
        stockNote: preservedStockNote,
        inStock: preservedStock,
        branch: selectedGlobalBranch !== 'all' ? selectedGlobalBranch : undefined,
        branchStocksJson: preservedBranchStocksJson,
        unit: values.unit || editingProduct.unit || 'Bộ',
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
      // Sản phẩm mới khởi tạo tồn kho là 0 (tồn kho sẽ được tăng khi tạo phiếu Nhập hàng hoặc Kiểm kho)
      const newProductPayload: Partial<FeaturedCatalogProduct> = {
        code: values.code || `SP${(totalProducts + 1).toString().padStart(4, '0')}`,
        name: values.name,
        space: values.space || selectedCategory?.space || 'Phòng khách',
        collection: values.collection || '',
        categoryName: selectedCategory?.name || 'Nội Thất Gỗ',
        categoryId: values.categoryId || categoriesList[0]?.id,
        originalPrice: rawOriginalPrice,
        discountPercent: rawDiscount,
        price: rawPrice,
        stockType: 'out_of_stock',
        stockNote: '0',
        inStock: 0,
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
        branchStocksJson: '{}',
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
      const allProds = await productApi.getProducts();
      const exportData = (allProds.length > 0 ? allProds : productsList).map((p) => {
        const cat = categoriesList.find((c) => c.id === p.categoryId)?.name || p.categoryName || 'Chưa phân loại';
        return {
          'Mã sản phẩm': p.code,
          'Tên sản phẩm': p.name,
          'Danh mục': cat,
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

    const catName = categoriesList.find((c) => c.id === prod.categoryId)?.name || prod.categoryName || 'Chưa có';
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
              className={`border-b-2 px-1 pb-2.5 text-xs font-normal whitespace-nowrap transition-colors cursor-pointer ${currentTab === tab.key
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
                    loading="lazy"
                    decoding="async"
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
                    {stockCount < 0 ? (
                      <Tag className="border-0 bg-red-100 text-red-700 text-xs font-semibold m-0">Âm kho ({stockCount})</Tag>
                    ) : stockCount === 0 || prod.stockType === 'out_of_stock' ? (
                      <Tag className="border-0 bg-red-50 text-red-600 text-xs font-semibold m-0">Hết hàng (0)</Tag>
                    ) : prod.stockType === 'in_stock' || (stockCount > 5 && prod.stockType !== 'custom') ? (
                      <Tag className="border-0 bg-emerald-50 text-emerald-700 text-xs font-normal m-0">Còn hàng sẵn</Tag>
                    ) : prod.stockType === 'custom' ? (
                      <Tag className="border-0 bg-blue-50 text-blue-700 text-xs font-normal m-0">May đo theo đơn</Tag>
                    ) : (
                      <Tag className="border-0 bg-amber-50 text-amber-700 text-xs font-normal m-0">Sắp hết hàng</Tag>
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
                  <div className="text-slate-500 mb-1">Tình trạng tồn kho</div>
                  <div className="text-slate-900 text-sm">
                    {stockCount < 0 ? `Âm kho (${stockCount})` : stockCount === 0 || prod.stockType === 'out_of_stock' ? 'Hết hàng (0)' : prod.stockType === 'in_stock' ? 'Còn hàng sẵn' : prod.stockType === 'custom' ? 'May đo theo đơn' : 'Sắp hết hàng'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 mb-1">Số lượng tồn kho</div>
                  <div className="text-slate-900 text-sm font-semibold">{stockCount}</div>
                </div>

                {/* Row 2 */}
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
                <div>
                  <div className="text-slate-500 mb-1">Chất liệu gỗ / đệm</div>
                  <div className="text-slate-900 text-sm">{prod.material || 'Chưa có'}</div>
                </div>

                {/* Row 3 */}
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

          {/* TAB 3: TỒN KHO THEO CHI NHÁNH */}
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
                  {(() => {
                    let bStocks: Record<string, number> = {};
                    if (prod.branchStocksJson && prod.branchStocksJson !== '{}') {
                      try {
                        bStocks = JSON.parse(prod.branchStocksJson);
                      } catch { }
                    }

                    const displayBranches = branchesList || [];

                    if (displayBranches.length === 0) {
                      return (
                        <tr>
                          <td colSpan={4} className="px-3 py-6 text-center text-slate-400 italic">
                            Chưa có dữ liệu chi nhánh
                          </td>
                        </tr>
                      );
                    }

                    return displayBranches.map((b) => {
                      const matchedKey = Object.keys(bStocks).find((k) => isMatchBranch(k, b.name));
                      const qty = matchedKey !== undefined
                        ? (bStocks[matchedKey] ?? 0)
                        : getProductStockForBranch(prod, b.name);
                      const isHighlighted = isMatchBranch(b.name, branchFilter);
                      return (
                        <tr key={b.id || b.name} className={isHighlighted && branchFilter !== 'all' ? 'bg-amber-50/60 font-semibold' : 'hover:bg-slate-50'}>
                          <td className="px-3 py-2.5 text-slate-900 font-medium">
                            <span className="flex items-center gap-1.5">
                              {b.name}
                              {isHighlighted && branchFilter !== 'all' && (
                                <Tag color="gold" className="m-0 text-[10px] leading-tight">Đang chọn</Tag>
                              )}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-center font-mono font-bold text-slate-900">{qty}</td>
                          <td className="px-3 py-2.5 text-center font-mono text-slate-400">0</td>
                          <td className="px-3 py-2.5 text-center font-mono font-bold text-[#784e34]">{qty}</td>
                        </tr>
                      );
                    });
                  })()}
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
              description={
                selectedGlobalBranch !== 'all'
                  ? `Lưu ý: Sản phẩm thuộc Danh mục dùng chung toàn hệ thống D2 Luxury. Khi xóa, sản phẩm sẽ bị xóa khỏi tất cả các chi nhánh!`
                  : 'Hành động này sẽ xóa vĩnh viễn sản phẩm khỏi toàn bộ hệ thống.'
              }
              onConfirm={(e) => {
                e?.stopPropagation();
                handleDeleteSingleProduct(prod.id, prod.name);
              }}
              okText="Xác nhận xóa"
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
                if (onNavigateToCreateImport) {
                  onNavigateToCreateImport(prod);
                } else {
                  message.info(`Tạo phiếu nhập hàng cho sản phẩm ${prod.code}...`);
                }
              }}
              className="h-8 rounded border-slate-300 px-3 text-xs text-slate-700 bg-white hover:text-[#784e34] hover:border-[#784e34] flex items-center gap-1.5 cursor-pointer"
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
          hasActiveFilters={Boolean(searchQuery || inventoryCategoryFilter !== 'all' || inventoryStockTag !== 'all' || (branchFilter !== 'all' && branchFilter !== selectedGlobalBranch))}
          onResetFilters={() => {
            setSearchQuery('');
            setInventoryCategoryFilter('all');
            setInventoryStockTag('all');
            setBranchFilter(selectedGlobalBranch || '');
            setSelectedProductKeys([]);
            setCurrentPage(1);
          }}
        >

          {/* Filter 1: Danh mục thiết kế */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
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
                { value: 'out_of_stock', label: 'Hết hàng' },
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
            searchPlaceholder="Tìm theo mã sản phẩm, tên, danh mục..."
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
                  const catName = categoriesList.find((c) => c.id === prod.categoryId)?.name || prod.categoryName || 'Chưa phân loại';
                  return (
                    <div className="flex items-center gap-3 min-w-0">
                      {prod.image ? (
                        <img
                          src={prod.image}
                          alt={text}
                          loading="lazy"
                          decoding="async"
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-50"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                          <AppstoreOutlined className="text-lg" />
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
                title: 'Tồn',
                dataIndex: 'stockNote',
                key: 'stockNote',
                align: 'center',
                width: 100,
                render: (note, prod) => {
                  const count = getProductStockForBranch(prod, branchFilter);
                  if (count < 0) {
                    return (
                      <span className="font-mono font-bold text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200 inline-block">
                        {count}
                      </span>
                    );
                  }
                  const isOut = count === 0;
                  return (
                    <span className={`font-mono font-bold text-xs ${isOut ? 'text-red-600' : 'text-slate-800'}`}>
                      {count}
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
                title: 'Giá bán',
                dataIndex: 'price',
                key: 'price',
                align: 'right',
                width: 155,
                render: (p, prod) => {
                  const hasDiscount = prod.discountPercent && prod.discountPercent > 0;
                  return (
                    <div className="flex flex-col items-end">
                      <span className="font-mono font-bold text-xs sm:text-sm text-[#784e34]">
                        {(p || 0).toLocaleString('vi-VN')} đ
                      </span>
                      {hasDiscount ? (
                        <div className="flex items-center gap-1 mt-0.5">
                          {prod.originalPrice && prod.originalPrice > p && (
                            <span className="font-mono text-[10px] text-slate-400 line-through">
                              {prod.originalPrice.toLocaleString('vi-VN')} đ
                            </span>
                          )}
                          <Tag className="!m-0 !px-1 !py-0 text-[10px] font-bold border-0 bg-red-50 text-red-600 rounded">
                            -{prod.discountPercent}%
                          </Tag>
                        </div>
                      ) : null}
                    </div>
                  );
                },
              },
              {
                title: 'Tình trạng',
                dataIndex: 'stockType',
                key: 'stockType',
                align: 'center',
                width: 140,
                render: (type, prod) => {
                  const rawNum = prod.stockNote ? prod.stockNote.replace(/[^-0-9]/g, '') : '';
                  const count = prod.inStock !== undefined ? prod.inStock : (rawNum !== '' ? parseInt(rawNum, 10) : 0);
                  if (count < 0) {
                    return <Tag className="border-0 bg-red-100 text-red-700 text-xs font-bold">Âm kho ({count})</Tag>;
                  }
                  if (type === 'out_of_stock' || count === 0) {
                    return <Tag className="border-0 bg-red-50 text-red-600 text-xs font-bold">Hết hàng (0)</Tag>;
                  }
                  if (type === 'custom') {
                    return <Tag className="border-0 bg-blue-50 text-blue-700 text-xs font-medium">May đo</Tag>;
                  }
                  if (type === 'low' || (count > 0 && count <= 5)) {
                    return <Tag className="border-0 bg-amber-50 text-amber-700 text-xs font-medium">Sắp hết</Tag>;
                  }
                  return <Tag className="border-0 bg-emerald-50 text-emerald-700 text-xs font-medium">Hàng có sẵn</Tag>;
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
          onValuesChange={handlePriceOrDiscountChange}
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
                    <AutoCodeButton
                      onGenerate={handleGenerateProductCode}
                      tooltipTitle="Tự động tạo mã sản phẩm mới"
                    />
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
                  onChange={(selectedCatId) => {
                    const matchedCat = categoriesList.find((c) => c.id === selectedCatId);
                    if (matchedCat && matchedCat.space) {
                      form.setFieldsValue({ space: matchedCat.space });
                    }
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label={<span className="text-xs font-semibold text-slate-700">Không gian nội thất</span>}
                name="space"
                initialValue="Phòng khách"
              >
                <Select
                  placeholder="Chọn không gian"
                  className="h-10 text-sm"
                  options={spaceSelectOptions}
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

          {/* PRICING: GIÁ GỐC, GIẢM GIÁ (%), GIÁ BÁN THỰC TẾ */}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label={<span className="text-xs font-semibold text-slate-700">Giá gốc</span>}
                name="originalPrice"
              >
                <InputNumber
                  className="!w-full h-10 text-sm rounded-lg font-mono font-medium"
                  controls={false}
                  formatter={(val) => (val !== undefined && val !== null ? `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '')}
                  parser={(val) => (val ? Number(val.replace(/\$\s?|(,*)/g, '')) : 0)}
                  placeholder="VD: 40,000,000"
                  suffix={<span className="text-xs text-slate-400 font-normal">VNĐ</span>}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label={<span className="text-xs font-semibold text-slate-700">Giảm giá (%)</span>}
                name="discountPercent"
              >
                <InputNumber
                  className="!w-full h-10 text-sm rounded-lg font-mono font-bold text-amber-700"
                  min={0}
                  max={100}
                  placeholder="0"
                  suffix={<span className="text-xs text-amber-600 font-bold">%</span>}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label={<span className="text-xs font-semibold text-slate-700">Giá bán thực tế <span className="text-red-500">*</span></span>}
                name="price"
                rules={[{ required: true, message: 'Vui lòng nhập giá bán thực tế' }]}
              >
                <InputNumber
                  className="!w-full h-10 text-sm rounded-lg font-mono font-bold text-[#784e34]"
                  controls={false}
                  formatter={(val) => (val !== undefined && val !== null ? `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '')}
                  parser={(val) => (val ? Number(val.replace(/\$\s?|(,*)/g, '')) : 0)}
                  placeholder="VD: 36,000,000"
                  suffix={<span className="text-xs text-slate-400 font-normal">VNĐ</span>}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={<span className="text-xs font-semibold text-slate-700">Số lượng tồn kho</span>}
                name="stockNote"
              >
                <InputNumber
                  disabled
                  className="!w-full h-10 text-sm rounded-lg !bg-slate-50 font-bold font-mono !text-slate-700 cursor-not-allowed"
                  controls={false}
                  placeholder="0"
                />
              </Form.Item>
            </Col>
          </Row>

          {/* ẢNH ĐẠI DIỆN CHÍNH (TẢI TỪ MÁY / KÉO THẢ / URL) */}
          <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-700 block">Ảnh đại diện chính sản phẩm</span>
              </div>
              {currentMainImage && (
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
                    Thay ảnh khác
                  </Button>
                </Upload>
              )}
            </div>

            {/* Dragger khi chưa có ảnh hoặc muốn kéo thả trực tiếp */}
            {!currentMainImage ? (
              <Upload.Dragger
                showUploadList={false}
                beforeUpload={handleUploadMainFile}
                accept="image/*"
                className="!bg-white hover:!border-[#784e34] !p-3 !border-dashed !border-slate-300 rounded-xl transition-all"
                disabled={uploadingMain}
              >
                <div className="flex flex-col items-center justify-center py-2 text-center">
                  <p className="ant-upload-drag-icon !mb-1">
                    <InboxOutlined className="text-2xl text-[#784e34]" />
                  </p>
                  <p className="text-xs font-semibold text-slate-700 !mb-0.5">
                    {uploadingMain ? 'Đang tải ảnh lên máy chủ...' : 'Kéo thả hoặc bấm để chọn ảnh từ máy'}
                  </p>
                  <p className="text-[11px] text-slate-400 !mb-0">
                    Hỗ trợ định dạng JPG, PNG, WebP (Tối đa 20MB)
                  </p>
                </div>
              </Upload.Dragger>
            ) : (
              <div className="relative flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-200">
                <Image
                  src={currentMainImage}
                  alt="Ảnh đại diện"
                  className="!w-20 !h-20 object-cover rounded-lg border border-slate-200 bg-slate-50"
                  fallback="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&auto=format&fit=crop&q=80"
                />
                <div className="flex-1 min-w-0 text-xs">
                  <span className="font-medium text-slate-700 block truncate" title={currentMainImage}>
                    {currentMainImage.split('/').pop() || 'Ảnh sản phẩm'}
                  </span>
                  <span className="text-[11px] text-emerald-600 block mt-0.5">✓ Đã sẵn sàng hiển thị</span>
                </div>
                <button
                  type="button"
                  onClick={() => form.setFieldsValue({ image: '' })}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
                  title="Gỡ ảnh này"
                >
                  <DeleteOutlined className="text-base text-red-500" />
                </button>
              </div>
            )}

            {/* Input URL dự phòng */}
            <div className="pt-1">
              <Form.Item name="image" className="!mb-0">
                <Input
                  placeholder="Hoặc dán đường dẫn ảnh: https://images.unsplash.com/... hoặc /uploads/..."
                  className="h-9 text-xs rounded-lg bg-white"
                />
              </Form.Item>
            </div>
          </div>

          {/* ẢNH PHỤ / BỘ SƯU TẬP ẢNH (TẢI TỪ MÁY NHIỀU FILE / URL) */}
          <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-700 block">Ảnh phụ / Các góc chụp khác</span>
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
                  {uploadingSub ? 'Đang tải lên...' : 'Tải nhiều ảnh từ máy'}
                </Button>
              </Upload>
            </div>

            {/* Thumbnail Gallery với Ant Design Image.PreviewGroup */}
            {currentSubImages && (
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <div className="text-[11px] text-slate-500 font-medium mb-1.5 flex items-center justify-between">
                  <span>Ảnh chi tiết đã thêm ({currentSubImages.split(/[\n,]/).map((u: string) => u.trim()).filter(Boolean).length} ảnh):</span>
                  <span className="text-[10px] text-slate-400">Bấm vào ảnh để phóng to</span>
                </div>
                <Image.PreviewGroup>
                  <div className="flex flex-wrap gap-2">
                    {currentSubImages
                      .split(/[\n,]/)
                      .map((u: string) => u.trim())
                      .filter(Boolean)
                      .map((imgUrl: string, idx: number) => (
                        <div key={idx} className="relative group">
                          <Image
                            src={imgUrl}
                            alt={`Ảnh phụ ${idx + 1}`}
                            width={56}
                            height={56}
                            className="!w-14 !h-14 object-cover rounded-lg border border-slate-200 bg-slate-50 shadow-xs"
                            fallback="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&auto=format&fit=crop&q=80"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const urls = currentSubImages
                                .split(/[\n,]/)
                                .map((u: string) => u.trim())
                                .filter(Boolean);
                              const updated = urls.filter((_: string, i: number) => i !== idx).join('\n');
                              form.setFieldsValue({ subImages: updated });
                            }}
                            className="absolute -top-1 -right-1 bg-white rounded-full text-slate-400 hover:text-red-500 border-0 p-0 cursor-pointer shadow-xs z-10"
                            title="Xóa ảnh này"
                          >
                            <CloseCircleFilled className="text-sm text-red-500 hover:text-red-600" />
                          </button>
                        </div>
                      ))}
                  </div>
                </Image.PreviewGroup>
              </div>
            )}

            <Form.Item name="subImages" className="!mb-0">
              <Input.TextArea
                rows={2}
                placeholder="https://images.unsplash.com/photo-detail-1...&#10;https://images.unsplash.com/photo-detail-2..."
                className="text-xs rounded-lg bg-white font-mono"
              />
            </Form.Item>
          </div>
          {/* THÔNG SỐ KỸ THUẬT CHI TIẾT */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={<span className="text-xs font-semibold text-slate-700">Kích thước</span>}
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
                <AutoComplete
                  options={woodMaterialOptions}
                  className="w-full text-sm"
                  filterOption={(inputValue, option) =>
                    (option?.value ?? '').toLowerCase().includes(inputValue.toLowerCase())
                  }
                >
                  <Input
                    placeholder="VD: Gỗ Óc Chó Bắc Mỹ, Gỗ Sồi tự nhiên, Gỗ Tần Bì..."
                    allowClear
                    className="h-10 text-sm rounded-lg"
                  />
                </AutoComplete>
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

