'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, usePathname } from 'next/navigation';
import { Slider, Select, Pagination, Tag, Button, Checkbox, Tooltip, App } from 'antd';
import {
  EyeOutlined,
  ShoppingCartOutlined,
  FilterOutlined,
  RightOutlined,
  InboxOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import QuickViewModal from '@/components/QuickViewModal';
import SampleBoxModal from '@/components/SampleBoxModal';
import { type CategoryProduct } from '@/data/categoryProducts';
import { Product, CartItem } from '@/types';
import { useCart } from '@/context/CartContext';
import { productApi, FeaturedCatalogProduct } from '@/api/productApi';

function mapCatalogToCategoryProduct(item: FeaturedCatalogProduct): CategoryProduct {
  const rawSpace = (item.space || '').toLowerCase();
  let space: 'living' | 'bedroom' | 'dining' | 'office' = 'living';
  if (rawSpace.includes('bed') || rawSpace.includes('ngủ') || rawSpace === 'kg03') space = 'bedroom';
  else if (rawSpace.includes('din') || rawSpace.includes('ăn') || rawSpace === 'kg02') space = 'dining';
  else if (rawSpace.includes('off') || rawSpace.includes('việc') || rawSpace === 'kg04') space = 'office';
  else space = 'living';

  const spaceNames: Record<string, string> = {
    living: 'Phòng Khách (Sofa, Bàn trà, Kệ TV)',
    bedroom: 'Phòng Ngủ (Giường, Táp, Tủ áo)',
    dining: 'Phòng Ăn (Bàn ăn, Ghế ăn)',
    office: 'Phòng Làm Việc (Bàn làm việc)',
  };

  const matLower = ((item.material || '') + ' ' + (item.metaInfo || '')).toLowerCase();
  let woodMaterial: 'walnut' | 'oak' | 'ash' | 'leather' = 'oak';
  if (matLower.includes('tần bì') || matLower.includes('ash')) woodMaterial = 'ash';
  else if (matLower.includes('sồi') || matLower.includes('oak')) woodMaterial = 'oak';
  else if (matLower.includes('da') || matLower.includes('leather')) woodMaterial = 'leather';
  else if (matLower.includes('óc chó') || matLower.includes('walnut')) woodMaterial = 'walnut';

  const woodMaterialName = item.material || item.metaInfo || (woodMaterial === 'walnut' ? 'Gỗ óc chó Bắc Mỹ' : woodMaterial === 'oak' ? 'Gỗ sồi tự nhiên' : woodMaterial === 'ash' ? 'Gỗ tần bì tự nhiên' : 'Khung gỗ bọc da bò Ý');

  return {
    id: item.id,
    sku: item.code || `SP-${item.id.slice(0, 5)}`,
    name: item.name,
    space,
    spaceName: spaceNames[space] || item.categoryName || 'Nội thất gỗ',
    categoryId: item.categoryId,
    categoryName: item.categoryName,
    woodMaterial,
    woodMaterialName,
    colorTone: (item.color || '').toLowerCase().includes('nâu') ? 'chestnut' : 'light-oak',
    price: item.price,
    originalPrice: item.originalPrice && item.originalPrice > item.price ? item.originalPrice : undefined,
    stockStatus: item.stockType === 'custom' ? 'custom' : 'showroom',
    stockLabel: item.stockType === 'custom' ? 'Đặt may đo' : 'Sẵn tại Showroom',
    image: item.image || '/logo.png',
    macroImage: item.images?.[1] || item.image || '/logo.png',
    tag: item.stockNote || item.collection || 'Tuyệt tác mộc',
    description: item.description || item.collection || `Sản phẩm ${item.name} chế tác tinh xảo từ gỗ tự nhiên`,
    dimensions: item.dimensions || 'Theo thiết kế',
    warranty: item.warranty || 'Bảo hành 5 năm',
  };
}

function matchesCategoryFilter(item: CategoryProduct, catKeyOrSlug: string): boolean {
  if (!catKeyOrSlug) return true;
  const raw = (item.name + ' ' + item.sku + ' ' + (item.categoryName || '') + ' ' + (item.categoryId || '')).toLowerCase();
  const norm = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  const cNorm = catKeyOrSlug.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/-/g, ' ');

  if (item.categoryId && item.categoryId.toLowerCase() === catKeyOrSlug.toLowerCase()) return true;

  if (cNorm.includes('ban tra') || cNorm === 'table') {
    return (norm.includes('ban tra') || norm.includes('ban nuoc') || item.sku.startsWith('BT-')) && !norm.includes('trang diem') && !norm.includes('ban an') && !norm.includes('ban lam viec');
  }
  if (cNorm.includes('ke tivi') || cNorm === 'cabinet') {
    return (norm.includes('ke tivi') || norm.includes('ke tv') || item.sku.startsWith('KTV-')) && !norm.includes('ban tra');
  }
  if (cNorm.includes('sofa')) {
    return norm.includes('sofa') || item.sku.startsWith('SF-');
  }
  if (cNorm.includes('tu giay')) {
    return norm.includes('tu giay') || item.sku.startsWith('TG-');
  }
  if (cNorm.includes('ke trang tri') || cNorm === 'storage') {
    return norm.includes('ke trang tri') || norm.includes('tu trang tri') || item.sku.startsWith('KTT');
  }
  if (cNorm.includes('tu goc') || cNorm.includes('ruou')) {
    return norm.includes('tu goc') || norm.includes('tu ruou') || item.sku.startsWith('TL-');
  }
  if (cNorm.includes('giuong') || cNorm === 'bed') {
    return norm.includes('giuong') || item.sku.startsWith('GN-') || item.sku.startsWith('GG-');
  }
  if (cNorm.includes('trang diem') || cNorm === 'dresser') {
    return norm.includes('trang diem') || item.sku.startsWith('BTD-');
  }
  if (cNorm.includes('quan ao') || cNorm === 'wardrobe') {
    return norm.includes('quan ao') || item.sku.startsWith('TA-');
  }
  if (cNorm.includes('tap') || cNorm === 'tab') {
    return norm.includes('tap') || norm.includes('tab') || item.sku.startsWith('TAP-');
  }
  if (cNorm.includes('ban an') || cNorm === 'dining') {
    return norm.includes('ban an') || item.sku.startsWith('BA-') || item.sku.startsWith('BM-');
  }
  if (cNorm.includes('ghe an')) {
    return (norm.includes('ghe an') || item.sku.startsWith('GA-')) && !norm.includes('lam viec');
  }
  if (cNorm.includes('chan ly') || cNorm.includes('dao bep') || cNorm === 'island') {
    return norm.includes('chan ly') || norm.includes('dao') || norm.includes('bep');
  }
  if (cNorm.includes('ban lam viec') || cNorm === 'desk') {
    return norm.includes('ban lam viec') || item.sku.startsWith('BLV-');
  }
  if (cNorm.includes('ghe lam viec') || cNorm.includes('ghe ngoi')) {
    return norm.includes('ghe') && (norm.includes('lam viec') || norm.includes('ngoi'));
  }
  if (cNorm.includes('ghe') || cNorm === 'chair') {
    return norm.includes('ghe') || item.sku.startsWith('GM-');
  }
  if (cNorm.includes('sach') || cNorm === 'bookcase') {
    return norm.includes('sach') || item.sku.startsWith('TK-');
  }

  // Fallback direct match
  return norm.includes(cNorm);
}

interface SubcategoryOption {
  id: string;
  label: string;
  matcher: (item: CategoryProduct) => boolean;
}

const SPACE_SUBCATEGORIES: Record<string, { title: string; options: SubcategoryOption[] }> = {
  living: {
    title: 'Danh Mục Phòng Khách',
    options: [
      {
        id: 'table',
        label: 'Bàn Trà – Bàn Nước',
        matcher: (item) => matchesCategoryFilter(item, 'ban tra'),
      },
      {
        id: 'cabinet',
        label: 'Kệ Tivi Cao Cấp',
        matcher: (item) => matchesCategoryFilter(item, 'ke tivi'),
      },
      {
        id: 'sofa',
        label: 'Sofa Gỗ Mây & Da',
        matcher: (item) => matchesCategoryFilter(item, 'sofa'),
      },
      {
        id: 'storage',
        label: 'Tủ Giày & Kệ Trang Trí',
        matcher: (item) => matchesCategoryFilter(item, 'tu giay') || matchesCategoryFilter(item, 'ke trang tri') || matchesCategoryFilter(item, 'tu goc'),
      },
      {
        id: 'chair',
        label: 'Ghế Mây Thư Giãn & Đôn',
        matcher: (item) => matchesCategoryFilter(item, 'ghe') && !matchesCategoryFilter(item, 'ban an'),
      },
    ],
  },
  bedroom: {
    title: 'Danh Mục Phòng Ngủ',
    options: [
      {
        id: 'bed',
        label: 'Giường Ngủ Tự Nhiên',
        matcher: (item) => matchesCategoryFilter(item, 'giuong'),
      },
      {
        id: 'tab',
        label: 'Táp Đầu Giường (Nightstand)',
        matcher: (item) => matchesCategoryFilter(item, 'tap'),
      },
      {
        id: 'wardrobe',
        label: 'Tủ Quần Áo Âm Tường',
        matcher: (item) => matchesCategoryFilter(item, 'quan ao'),
      },
      {
        id: 'dresser',
        label: 'Bàn Trang Điểm & Gương',
        matcher: (item) => matchesCategoryFilter(item, 'trang diem'),
      },
    ],
  },
  dining: {
    title: 'Danh Mục Phòng Ăn',
    options: [
      {
        id: 'dining',
        label: 'Bàn Ăn Tự Nhiên & Nguyên Tấm',
        matcher: (item) => matchesCategoryFilter(item, 'ban an'),
      },
      {
        id: 'chair',
        label: 'Ghế Ăn Tựa Đan Dây',
        matcher: (item) => matchesCategoryFilter(item, 'ghe an'),
      },
      {
        id: 'island',
        label: 'Tủ Rượu & Tủ Chạn Ly',
        matcher: (item) => matchesCategoryFilter(item, 'chan ly') || matchesCategoryFilter(item, 'tu goc'),
      },
    ],
  },
  office: {
    title: 'Danh Mục Bàn Làm Việc',
    options: [
      {
        id: 'desk',
        label: 'Bàn Làm Việc Tự Nhiên',
        matcher: (item) => matchesCategoryFilter(item, 'ban lam viec'),
      },
      {
        id: 'chair',
        label: 'Ghế Ngồi Làm Việc',
        matcher: (item) => matchesCategoryFilter(item, 'ghe lam viec'),
      },
      {
        id: 'bookcase',
        label: 'Tủ Sách & Kệ Hồ Sơ',
        matcher: (item) => matchesCategoryFilter(item, 'sach'),
      },
    ],
  },
};

const CATEGORY_NAMES: Record<string, string> = {
  table: 'Bàn trà – Bàn nước',
  cabinet: 'Kệ tivi – Tủ trang trí',
  sofa: 'Sofa',
  chair: 'Ghế thư giãn & Đôn',
  bed: 'Giường ngủ',
  tab: 'Táp đầu giường',
  wardrobe: 'Tủ quần áo',
  dresser: 'Bàn trang điểm',
  dining: 'Bàn ăn tự nhiên',
  island: 'Tủ rượu & Đảo bếp',
  desk: 'Bàn làm việc',
};

export function normalizeSpace(spaceStr: string | null | undefined): { key: string; name: string } | null {
  if (!spaceStr || spaceStr === 'all') return null;
  const s = decodeURIComponent(spaceStr).toLowerCase().trim();
  const norm = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/-/g, ' ');

  if (norm.includes('khach') || norm === 'living' || norm === 'kg01') {
    return { key: 'living', name: 'Phòng Khách' };
  }
  if (norm.includes('ngu') || norm === 'bedroom' || norm === 'kg03') {
    return { key: 'bedroom', name: 'Phòng Ngủ' };
  }
  if (norm.includes('an') || norm === 'dining' || norm === 'kg02') {
    return { key: 'dining', name: 'Phòng Ăn' };
  }
  if (norm.includes('lam viec') || norm === 'office' || norm === 'kg04') {
    return { key: 'office', name: 'Phòng Làm Việc' };
  }
  return null;
}

export function resolveCategoryInfo(
  catParam: string | null | undefined,
  currentSpaceKey?: string | null
): { name: string; spaceKey: string; spaceName: string } | null {
  if (!catParam) return null;
  const raw = decodeURIComponent(catParam).trim();
  const lower = raw.toLowerCase();
  const norm = lower.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/-/g, ' ');

  // Living Room Categories
  if (norm.includes('ke trang tri') || norm === 'storage') {
    return { name: 'Kệ Trang Trí', spaceKey: 'living', spaceName: 'Phòng Khách' };
  }
  if (norm.includes('ban tra') || norm.includes('ban nuoc') || norm === 'table') {
    return { name: 'Bàn Trà – Bàn Nước', spaceKey: 'living', spaceName: 'Phòng Khách' };
  }
  if (norm.includes('ke tivi') || norm.includes('ke tv') || norm === 'cabinet') {
    return { name: 'Kệ Tivi Cao Cấp', spaceKey: 'living', spaceName: 'Phòng Khách' };
  }
  if (norm.includes('sofa')) {
    return { name: 'Sofa Gỗ Mây & Da', spaceKey: 'living', spaceName: 'Phòng Khách' };
  }
  if (norm.includes('tu giay')) {
    return { name: 'Tủ Giày Hiện Đại', spaceKey: 'living', spaceName: 'Phòng Khách' };
  }
  if (norm.includes('tu goc')) {
    return { name: 'Tủ Góc Trang Trí', spaceKey: 'living', spaceName: 'Phòng Khách' };
  }

  // Bedroom Categories
  if (norm.includes('giuong') || norm === 'bed') {
    return { name: 'Giường Ngủ Tự Nhiên', spaceKey: 'bedroom', spaceName: 'Phòng Ngủ' };
  }
  if (norm.includes('quan ao') || norm === 'wardrobe') {
    return { name: 'Tủ Quần Áo Âm Tường', spaceKey: 'bedroom', spaceName: 'Phòng Ngủ' };
  }
  if (norm.includes('trang diem') || norm === 'dresser') {
    return { name: 'Bàn Trang Điểm & Gương', spaceKey: 'bedroom', spaceName: 'Phòng Ngủ' };
  }
  if (norm.includes('tap') || norm.includes('tab')) {
    return { name: 'Táp Đầu Giường (Nightstand)', spaceKey: 'bedroom', spaceName: 'Phòng Ngủ' };
  }

  // Dining Room Categories
  if (norm.includes('ban an') || norm === 'dining') {
    return { name: 'Bàn Ăn Gỗ Mây & Nguyên Tấm', spaceKey: 'dining', spaceName: 'Phòng Ăn' };
  }
  if (norm.includes('ghe an')) {
    return { name: 'Ghế Ăn Gỗ Mây', spaceKey: 'dining', spaceName: 'Phòng Ăn' };
  }
  if (norm.includes('chan ly') || norm.includes('tu ruou') || norm === 'island') {
    return { name: 'Tủ Chạn Ly & Tủ Rượu', spaceKey: 'dining', spaceName: 'Phòng Ăn' };
  }

  // Office Room Categories
  if (norm.includes('ban lam viec') || norm === 'desk') {
    return { name: 'Bàn Làm Việc Tự Nhiên', spaceKey: 'office', spaceName: 'Phòng Làm Việc' };
  }
  if (norm.includes('ghe lam viec') || norm.includes('ghe ngoi lam viec')) {
    return { name: 'Ghế Ngồi Làm Việc', spaceKey: 'office', spaceName: 'Phòng Làm Việc' };
  }
  if (norm.includes('sach') || norm.includes('ho so') || norm === 'bookcase') {
    return { name: 'Tủ Sách & Kệ Hồ Sơ', spaceKey: 'office', spaceName: 'Phòng Làm Việc' };
  }
  if (norm.includes('ghe') || norm === 'chair') {
    const sKey = currentSpaceKey || 'living';
    return {
      name: 'Ghế Thư Giãn & Đôn',
      spaceKey: sKey,
      spaceName: sKey === 'dining' ? 'Phòng Ăn' : sKey === 'office' ? 'Phòng Làm Việc' : 'Phòng Khách',
    };
  }

  // Generic Formatted Name
  const formattedTitle = raw
    .replace(/-/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const sKey = currentSpaceKey || 'living';
  return {
    name: formattedTitle,
    spaceKey: sKey,
    spaceName: sKey === 'bedroom' ? 'Phòng Ngủ' : sKey === 'dining' ? 'Phòng Ăn' : sKey === 'office' ? 'Phòng Làm Việc' : 'Phòng Khách',
  };
}

export function extractPrimaryWood(wood: string): string {
  const str = (wood || '').trim();
  if (!str) return 'Gỗ Tự Nhiên Cao Cấp';
  const lower = str.toLowerCase();
  if (lower.includes('me tây')) return 'Gỗ Me Tây Nguyên Tấm';
  if (lower.includes('mây')) return 'Mây Tự Nhiên & Khung Gỗ';
  if (lower.includes('tần bì') || lower.includes('ashwood')) return 'Gỗ Tần Bì & Veneer Sồi';
  if (lower.includes('sồi') || lower.includes('oak')) return 'Gỗ Sồi Tự Nhiên (Ash / Oak)';
  if (lower.includes('óc chó') || lower.includes('walnut')) return 'Gỗ Óc Chó Bắc Mỹ';
  if (lower.includes('gõ đỏ')) return 'Gỗ Gõ Đỏ';
  if (lower.includes('hương')) return 'Gỗ Hương';
  if (lower.includes('gụ')) return 'Gỗ Gụ';
  if (lower.includes('da bò') || lower.includes('leather')) return 'Khung Gỗ Bọc Da';
  return str;
}

function ProductsContent() {
  const { message } = App.useApp();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL Parameters
  const spaceParam = searchParams.get('space');
  const materialParam = searchParams.get('material');
  const categoryParam = searchParams.get('category');
  const queryParam = searchParams.get('q');

  // Identify active room or deduce from category if space not in URL
  const resolvedSpace = useMemo(() => {
    if (spaceParam && spaceParam !== 'all') {
      const normalized = normalizeSpace(spaceParam);
      if (normalized) return normalized;
    }
    if (pathname === '/living-room') {
      return { key: 'living', name: 'Phòng Khách' };
    }
    // If no explicit spaceParam, but categoryParam exists, deduce space from category!
    if (categoryParam) {
      const catInfo = resolveCategoryInfo(categoryParam);
      if (catInfo) {
        return { key: catInfo.spaceKey, name: catInfo.spaceName };
      }
    }
    return null;
  }, [spaceParam, pathname, categoryParam]);

  const activeSpecificRoom = resolvedSpace?.key || null;

  // Filters State
  const [selectedSpaces, setSelectedSpaces] = useState<string[]>(['living', 'bedroom', 'dining', 'office']);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<number>(75);
  const [sortBy, setSortBy] = useState<string>('best-selling');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Resolved dynamic category info
  const resolvedCategory = useMemo(() => {
    return resolveCategoryInfo(selectedCategory || categoryParam, activeSpecificRoom);
  }, [selectedCategory, categoryParam, activeSpecificRoom]);

  // Modals & Cart State
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [sampleModalOpen, setSampleModalOpen] = useState<boolean>(false);

  // Dynamic Products State loaded from API
  const [catalogProducts, setCatalogProducts] = useState<CategoryProduct[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Dynamically extract distinct wood materials from real database products
  const availableMaterials = useMemo(() => {
    const map = new Map<string, number>();
    catalogProducts.forEach((p) => {
      const label = extractPrimaryWood(p.woodMaterialName || p.description);
      map.set(label, (map.get(label) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([label, count]) => ({ id: label, label, count }))
      .sort((a, b) => b.count - a.count);
  }, [catalogProducts]);

  // Fetch real products from Backend (load all products from DB)
  useEffect(() => {
    let isMounted = true;
    async function loadProducts() {
      setIsLoading(true);
      try {
        const items = await productApi.getProducts({ pageSize: 500 });
        if (isMounted && Array.isArray(items)) {
          setCatalogProducts(items.map(mapCatalogToCategoryProduct));
        }
      } catch (err) {
        console.warn('Could not load products from API:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  // Synchronize state with URL parameters
  useEffect(() => {
    const activeRoom = resolvedSpace?.key || null;

    if (activeRoom && SPACE_SUBCATEGORIES[activeRoom]) {
      setSelectedSpaces([activeRoom]);
      if (categoryParam) {
        const roomOpts = SPACE_SUBCATEGORIES[activeRoom].options;
        const normCat = categoryParam.toLowerCase();
        const matchedOpt = roomOpts.find((o) =>
          o.id === normCat ||
          normCat.includes(o.id) ||
          o.id.includes(normCat) ||
          matchesCategoryFilter({ id: '', sku: '', name: o.label, space: 'living', spaceName: '', woodMaterial: 'oak', woodMaterialName: '', colorTone: 'light-oak', price: 0, stockStatus: 'showroom', stockLabel: '', image: '', macroImage: '', description: '', dimensions: '', warranty: '' }, categoryParam)
        );
        if (matchedOpt) {
          setSelectedSubcategories([matchedOpt.id]);
        } else {
          setSelectedSubcategories([categoryParam]);
        }
      } else {
        setSelectedSubcategories(SPACE_SUBCATEGORIES[activeRoom].options.map((o) => o.id));
      }
    } else {
      setSelectedSpaces(['living', 'bedroom', 'dining', 'office']);
      setSelectedSubcategories([]);
    }

    if (materialParam) {
      const decoded = decodeURIComponent(materialParam);
      const targetLabel = extractPrimaryWood(decoded);
      setSelectedMaterials([targetLabel]);
    } else if (availableMaterials.length > 0 && selectedMaterials.length === 0) {
      setSelectedMaterials(availableMaterials.map((m) => m.id));
    }

    if (categoryParam) {
      setSelectedCategory(categoryParam);
    } else {
      setSelectedCategory(null);
    }

    if (queryParam) {
      setSearchQuery(queryParam);
    } else {
      setSearchQuery('');
    }
  }, [spaceParam, pathname, materialParam, categoryParam, queryParam, availableMaterials, resolvedSpace]);

  // Global Cart Context with localStorage
  const { cartCount, wishlistCount, wishlistIds, toggleWishlist: contextToggleWishlist, addToCart } = useCart();


  // Filter Handlers
  const toggleSpace = (space: string) => {
    setSelectedSpaces((prev) =>
      prev.includes(space) ? prev.filter((s) => s !== space) : [...prev, space]
    );
  };

  const toggleSubcategory = (subId: string) => {
    setSelectedSubcategories((prev) =>
      prev.includes(subId) ? prev.filter((id) => id !== subId) : [...prev, subId]
    );
  };

  const toggleMaterial = (mat: string) => {
    setSelectedMaterials((prev) =>
      prev.includes(mat) ? prev.filter((m) => m !== mat) : [...prev, mat]
    );
  };
  const handleResetFilters = () => {
    if (activeSpecificRoom && SPACE_SUBCATEGORIES[activeSpecificRoom]) {
      setSelectedSpaces([activeSpecificRoom]);
      setSelectedSubcategories(SPACE_SUBCATEGORIES[activeSpecificRoom].options.map((o) => o.id));
    } else {
      setSelectedSpaces(['living', 'bedroom', 'dining', 'office']);
      setSelectedSubcategories([]);
    }
    setSelectedMaterials(availableMaterials.map((m) => m.id));
    setSelectedCategory(null);
    setSearchQuery('');
    setMaxPrice(75);
    setSortBy('best-selling');
    message.info('Đã thiết lập lại toàn bộ bộ lọc');
  };

  // Cart & Wishlist Handlers
  const handleAddToCart = (product: Product, quantity = 1) => {
    addToCart({
      id: product.id,
      sku: product.sku,
      name: product.name,
      collection: product.categoryName || 'Sản phẩm mộc',
      badge: product.tag || 'Tuyệt phẩm mộc',
      image: product.image,
      price: product.price,
      originalPrice: product.originalPrice,
      specs: [product.woodType || 'Gỗ tự nhiên', product.dimensions || 'Kích thước chuẩn'],
    }, quantity);
    message.success(`Đã thêm ${quantity} "${product.name}" vào giỏ hàng!`);
  };

  const handleAddCategoryProductToCart = (item: CategoryProduct) => {
    addToCart({
      id: item.id,
      sku: item.sku,
      name: item.name,
      collection: item.spaceName || 'Sản phẩm mộc',
      badge: item.stockLabel || 'Tuyệt phẩm mộc',
      image: item.image,
      price: item.price,
      originalPrice: item.originalPrice,
      specs: [item.woodMaterialName, item.dimensions],
    }, 1);
    message.success(`Đã thêm "${item.name}" vào giỏ hàng!`);
  };

  const handleOpenQuickViewFromCategory = (item: CategoryProduct) => {
    const p: Product = {
      id: item.id,
      sku: item.sku,
      name: item.name,
      category: item.space,
      categoryName: item.spaceName,
      price: item.price,
      originalPrice: item.originalPrice,
      image: item.image,
      woodType: item.woodMaterialName,
      rating: 5.0,
      reviewCount: 38,
      subtitle: item.woodMaterialName,
      description: item.description,
      dimensions: item.dimensions,
      stockStatus: item.stockLabel,
      inStock: true,
      materialDetails: item.woodMaterialName,
    };
    setQuickViewProduct(p);
  };

  const toggleWishlist = (id: string, name: string) => {
    const willBeFavorite = !wishlistIds.includes(id);
    contextToggleWishlist(id);
    if (willBeFavorite) {
      message.success(`Đã lưu "${name}" vào danh sách yêu thích!`);
    } else {
      message.info(`Đã bỏ lưu "${name}"`);
    }
  };

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return catalogProducts
      .filter((item) => {
        // Space filter
        if (selectedSpaces.length > 0 && !selectedSpaces.includes(item.space)) {
          return false;
        }

        // Specific room subcategory filter
        if (activeSpecificRoom && SPACE_SUBCATEGORIES[activeSpecificRoom]) {
          if (selectedSubcategories.length === 0) {
            return false;
          }
          const roomConfig = SPACE_SUBCATEGORIES[activeSpecificRoom];
          const matchesSub = selectedSubcategories.some((subId) => {
            const opt = roomConfig.options.find((o) => o.id === subId);
            if (opt) return opt.matcher(item);
            return matchesCategoryFilter(item, subId);
          });
          if (!matchesSub) {
            return false;
          }
        }

        // Category filter from URL parameter
        if (selectedCategory && !matchesCategoryFilter(item, selectedCategory)) {
          return false;
        }

        // Dynamic Material filter from DB
        if (availableMaterials.length > 0) {
          if (selectedMaterials.length === 0) {
            return false;
          }
          if (selectedMaterials.length < availableMaterials.length) {
            const itemMat = extractPrimaryWood(item.woodMaterialName || item.description);
            if (!selectedMaterials.includes(itemMat)) {
              return false;
            }
          }
        }

        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = item.name.toLowerCase().includes(q);
          const matchDesc = item.description.toLowerCase().includes(q);
          const matchSku = item.sku.toLowerCase().includes(q);
          const matchSpace = item.spaceName.toLowerCase().includes(q);
          const matchWood = item.woodMaterialName.toLowerCase().includes(q);
          if (!matchName && !matchDesc && !matchSku && !matchSpace && !matchWood) {
            return false;
          }
        }

        // Price filter (maxPrice in millions)
        if (item.price > maxPrice * 1000000) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        return 0;
      });
  }, [
    catalogProducts,
    selectedSpaces,
    activeSpecificRoom,
    selectedSubcategories,
    selectedMaterials,
    availableMaterials,
    selectedCategory,
    searchQuery,
    maxPrice,
    sortBy,
  ]);

  const PAGE_SIZE = 9;
  const pagedProducts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, currentPage]);


  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(val) + ' ₫';
  };

  // Dynamic breadcrumb space label
  const breadcrumbSpaceLabel = useMemo(() => {
    if (activeSpecificRoom === 'living') return 'Phòng khách';
    if (activeSpecificRoom === 'bedroom') return 'Phòng ngủ';
    if (activeSpecificRoom === 'dining') return 'Phòng ăn';
    if (activeSpecificRoom === 'office') return 'Phòng làm việc';
    return 'Tất cả sản phẩm';
  }, [activeSpecificRoom]);

  return (
    <div className="min-h-screen bg-[#fff8f5] text-[#1f1b19] selection:bg-[#ffdbc8] selection:text-[#311301]">
      {/* Header */}
      <Header
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        onOpenBooking={() => {}}
      />

      <main className="w-full pt-20 overflow-hidden">
        <div
          key={`screen-${pathname}-${spaceParam || 'all'}-${categoryParam || ''}-${materialParam || ''}`}
          className="animate-page-slide-in w-full"
        >
          {/* Breadcrumb Bar */}
          <section className="w-full bg-[#fbf2ee] py-3 sm:py-4 border-b border-[#eae1dd]">
          <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-2 font-medium text-[13px] text-[#83746c] flex-wrap"
            >
              <Link href="/" className="hover:text-[#5d371f] transition-colors">
                Trang chủ
              </Link>
              <RightOutlined className="text-[10px] text-[#83746c]" />

              {resolvedSpace ? (
                <>
                  <Link
                    href={`/products?space=${resolvedSpace.key}`}
                    className={`transition-colors ${
                      resolvedCategory || searchQuery || materialParam
                        ? 'hover:text-[#5d371f]'
                        : 'text-[#5d371f] font-bold'
                    }`}
                  >
                    {resolvedSpace.name}
                  </Link>
                </>
              ) : (
                <span className="text-[#5d371f] font-bold">
                  Tất cả sản phẩm
                </span>
              )}

              {resolvedCategory && (
                <>
                  <RightOutlined className="text-[10px] text-[#83746c]" />
                  <span className="text-[#5d371f] font-bold">
                    {resolvedCategory.name}
                  </span>
                </>
              )}

              {materialParam && (
                <>
                  <RightOutlined className="text-[10px] text-[#83746c]" />
                  <span className="text-[#5d371f] font-bold">
                    {extractPrimaryWood(decodeURIComponent(materialParam))}
                  </span>
                </>
              )}

              {searchQuery && (
                <>
                  <RightOutlined className="text-[10px] text-[#83746c]" />
                  <span className="text-[#5d371f] font-semibold italic">
                    Từ khóa: &quot;{searchQuery}&quot;
                  </span>
                </>
              )}
            </nav>
          </div>
        </section>

        {/* Main Catalog Section */}
        <section
          key={`catalog-${activeSpecificRoom || selectedCategory || 'all'}`}
          className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 py-8 md:py-12 animate-slide-in-bottom"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Filter Sidebar (3 cols) */}
            <aside className="lg:col-span-3 flex flex-col gap-6 bg-[#fbf2ee] p-5 sm:p-6 rounded-none border border-[#eae1dd] animate-slide-in-left">
              <div className="flex items-center justify-between pb-2 border-b border-[#eae1dd]">
                <span className="font-title-lg text-base text-[#5d371f] font-bold flex items-center gap-2">
                  <FilterOutlined className="text-[15px]" />
                  Bộ Lọc Chọn Lọc
                </span>
                <Button
                  type="link"
                  size="small"
                  onClick={handleResetFilters}
                  className="text-xs text-[#83746c] hover:!text-[#5d371f] p-0 font-medium"
                >
                  Đặt lại tất cả
                </Button>
              </div>

              {/* Filter: Materials */}
              {availableMaterials.length > 0 && (
                <div className="flex flex-col gap-2.5">
                  <span className="font-label-md text-xs text-[#1f1b19] uppercase tracking-wider font-bold">
                    Chất Liệu Tuyển Chọn
                  </span>
                  <div className="flex flex-col gap-2">
                    {availableMaterials.map((item) => (
                      <Checkbox
                        key={item.id}
                        checked={selectedMaterials.includes(item.id)}
                        onChange={() => toggleMaterial(item.id)}
                        className="text-xs font-medium text-[#51443d]"
                      >
                        <span>{item.label}</span>
                        <span className="text-[11px] text-[#83746c] ml-1 font-normal">
                          ({item.count})
                        </span>
                      </Checkbox>
                    ))}
                  </div>
                </div>
              )}

              {/* Filter 3: Budget Range */}
              <div className="flex flex-col gap-2.5 pt-2 border-t border-[#eae1dd]">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-xs text-[#1f1b19] uppercase tracking-wider font-bold">
                    Mức Ngân Sách
                  </span>
                  <Tag color="#5d371f" className="font-data-mono text-xs font-bold rounded-none">
                    Dưới {maxPrice}tr
                  </Tag>
                </div>

                <div className="py-1">
                  <Slider
                    min={5}
                    max={100}
                    step={5}
                    value={maxPrice}
                    onChange={(val) => setMaxPrice(val)}
                    tooltip={{ formatter: (val) => `${val} triệu VNĐ` }}
                  />
                  <div className="flex justify-between font-data-mono text-[10px] text-[#83746c]">
                    <span>5.000.000₫</span>
                    <span>100.000.000₫</span>
                  </div>
                </div>

                {/* Quick Price Pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    { label: 'Dưới 15tr', val: 15 },
                    { label: '15 - 35tr', val: 35 },
                    { label: '35 - 60tr', val: 60 },
                    { label: 'Trên 60tr', val: 100 },
                  ].map((pill) => (
                    <Button
                      key={pill.label}
                      size="small"
                      type={maxPrice === pill.val ? 'primary' : 'default'}
                      onClick={() => setMaxPrice(pill.val)}
                      className={`text-[11px] rounded-none font-medium ${
                        maxPrice === pill.val
                          ? 'bg-[#5d371f]'
                          : 'bg-white hover:!border-[#5d371f] hover:!text-[#5d371f]'
                      }`}
                    >
                      {pill.label}
                    </Button>
                  ))}
                </div>
              </div>
            </aside>

            {/* Right Products Grid Container (9 cols) */}
            <div className="lg:col-span-9 flex flex-col gap-6 animate-slide-in-right">
              {/* Controls & Sorters Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 px-5 rounded-none shadow-sm border border-[#eae1dd]">
                <div className="flex items-center gap-2 font-body-sm text-xs sm:text-sm text-[#51443d]">
                  <span className="font-bold text-[#1f1b19]">{filteredProducts.length}</span> mẫu thiết kế nội thất
                  <span className="text-[#83746c]">|</span>
                  <span className="hidden md:inline text-[#3f4332]">
                    Chế tác thủ công từ D2 LUXURY
                  </span>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <span className="font-label-md text-xs text-[#83746c]">Sắp xếp:</span>
                  <Select
                    value={sortBy}
                    onChange={(val) => setSortBy(val)}
                    size="middle"
                    className="w-48"
                    options={[
                      { value: 'best-selling', label: 'Bán chạy nhất tuần' },
                      { value: 'price-asc', label: 'Giá: Từ thấp đến cao' },
                      { value: 'price-desc', label: 'Giá: Từ cao đến thấp' },
                      { value: 'newest', label: 'Bộ sưu tập mới 2025' },
                      { value: 'rating', label: 'Đánh giá cao nhất' },
                    ]}
                  />
                </div>
              </div>

              {/* Products Grid */}
              {isLoading ? (
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((idx) => (
                    <div
                      key={idx}
                      className="bg-white p-4 border border-[#eae1dd] flex flex-col gap-3 animate-pulse"
                    >
                      <div className="aspect-[4/3] bg-[#eae1dd]/60 w-full" />
                      <div className="h-4 bg-[#eae1dd]/80 w-1/3" />
                      <div className="h-5 bg-[#eae1dd] w-3/4" />
                      <div className="h-4 bg-[#eae1dd]/50 w-1/2 mt-2" />
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="bg-white rounded-none p-12 text-center flex flex-col items-center gap-3 border border-[#eae1dd]">
                  <InboxOutlined className="text-[48px] text-[#83746c]" />
                  <h3 className="font-headline-sm text-lg text-[#1f1b19] font-bold">
                    Không tìm thấy sản phẩm phù hợp
                  </h3>
                  <p className="font-body-sm text-xs text-[#83746c] max-w-sm">
                    Hãy thử điều chỉnh mức giá, từ khóa tìm kiếm hoặc chọn lại phân loại chất liệu để khám phá thêm nhiều mẫu thiết kế.
                  </p>
                  <Button
                    type="primary"
                    onClick={handleResetFilters}
                    className="bg-[#5d371f] hover:!bg-[#784e34] rounded-none font-bold mt-2"
                  >
                    Xóa tất cả bộ lọc
                  </Button>
                </div>
              ) : (
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                  {pagedProducts.map((p) => {
                    const isWishlisted = wishlistIds.includes(p.id);

                    return (
                      <Link
                        key={p.id}
                        href={`/products/${p.id}`}
                        className="group flex flex-col bg-white rounded-none overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-[#eae1dd] hover-lift cursor-pointer text-inherit no-underline"
                      >
                        {/* Image & Macro Preview */}
                        <div className="relative aspect-[4/3] bg-[#eae1dd] overflow-hidden">
                          <img
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            src={p.image}
                          />

                          {/* Detail thumbnail cutout */}
                          <div className="absolute bottom-2.5 left-2.5 w-12 h-12 rounded-none overflow-hidden shadow-md ring-2 ring-white/90 bg-white group-hover:scale-110 transition-transform">
                            <img
                              alt="Texture macro"
                              className="w-full h-full object-cover"
                              src={p.macroImage}
                            />
                          </div>

                          {/* Badges */}
                          <div className="absolute top-3 left-3">
                            <Tag color="rgba(255,255,255,0.9)" className="text-[#5d371f] font-bold text-xs border border-[#d5c3ba]/60 rounded-none px-2.5 py-0.5 backdrop-blur-sm shadow-sm m-0">
                              {p.stockLabel}
                            </Tag>
                          </div>
                        </div>

                        {/* Card Info */}
                        <div className="p-4 sm:p-5 flex flex-col flex-grow justify-between gap-3">
                          <div>
                            <div className="text-[#83746c] text-[11px] font-semibold mb-1 uppercase tracking-wider">
                              {p.woodMaterialName}
                            </div>

                            <h2 className="font-headline-sm text-base sm:text-lg text-[#1f1b19] group-hover:text-[#5d371f] transition-colors line-clamp-1 font-bold">
                              {p.name}
                            </h2>
                          </div>

                          {/* Pricing and CTA */}
                          <div className="pt-3 border-t border-[#eae1dd]/60 flex items-end justify-between">
                            <div className="flex flex-col">
                              <span className="font-headline-sm text-base sm:text-lg text-[#5d371f] font-bold">
                                {formatPrice(p.price)}
                              </span>
                            </div>


                            <div className="flex items-center gap-1.5">
                              <Button
                                type="primary"
                                size="middle"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleAddCategoryProductToCart(p);
                                }}
                                className="bg-[#5d371f] hover:!bg-[#784e34] rounded-none shadow-md flex items-center justify-center"
                                icon={<ShoppingCartOutlined className="text-[16px]" />}
                                title="Thêm vào giỏ hàng"
                              />
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Ant Design Pagination */}
              {filteredProducts.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#eae1dd]">
                  <span className="font-body-sm text-xs text-[#83746c]">
                    Hiển thị <span className="font-bold text-[#1f1b19]">
                      {Math.min((currentPage - 1) * PAGE_SIZE + 1, filteredProducts.length)} - {Math.min(currentPage * PAGE_SIZE, filteredProducts.length)}
                    </span> của{' '}
                    <span className="font-bold text-[#1f1b19]">{filteredProducts.length}</span> mẫu thiết kế
                  </span>

                  <Pagination
                    current={currentPage}
                    total={filteredProducts.length}
                    pageSize={PAGE_SIZE}
                    onChange={(page) => setCurrentPage(page)}
                    showSizeChanger={false}
                  />
                </div>
              )}

            </div>
          </div>
        </section>
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Modals & Slide-out Drawers */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={handleAddToCart}
      />

      <SampleBoxModal
        isOpen={sampleModalOpen}
        onClose={() => setSampleModalOpen(false)}
      />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fff8f5]" />}>
      <ProductsContent />
    </Suspense>
  );
}
