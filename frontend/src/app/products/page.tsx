'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { Slider, Select, Pagination, Tag, Button, Checkbox, Tooltip, App, Drawer } from 'antd';
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
import { categoryApi } from '@/api/categoryApi';
import { spaceApi } from '@/api/spaceApi';
import { AdminCategory, AdminSpace } from '@/types/admin';
import { WoodMaterialItem, groupDbMaterials, extractPrimaryWood, getMaterialQueryKey } from '@/data/woodMaterials';
import { getProductStockForBranch } from '@/utils/branchHelper';

function toTitleCase(str?: string | null): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/(^|[\s/(+]+)(\p{L})/gu, (_, prefix, char) => prefix + char.toUpperCase());
}

function mapCatalogToCategoryProduct(item: FeaturedCatalogProduct, currentBranch?: string): CategoryProduct {
  const rawSpace = (item.space || '').toLowerCase();
  let space: string = 'living';
  if (rawSpace.includes('bed') || rawSpace.includes('ngủ') || rawSpace === 'kg03') space = 'bedroom';
  else if (rawSpace.includes('din') || rawSpace.includes('ăn') || rawSpace === 'kg02') space = 'dining';
  else if (rawSpace.includes('off') || rawSpace.includes('việc') || rawSpace === 'kg04') space = 'office';
  else if (item.space && item.space.trim()) space = item.space.trim();
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

  const branchStock = getProductStockForBranch(item, currentBranch);
  const isOutOfStock = false;
  const stockStatus = item.stockType === 'custom' ? 'custom' : 'showroom';
  const stockLabel = item.stockType === 'custom' ? 'Đặt may đo' : '';

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
    originalPrice: item.originalPrice && item.originalPrice > item.price
      ? item.originalPrice
      : (item.discountPercent && item.discountPercent > 0 && item.price > 0
          ? Math.round(item.price / (1 - item.discountPercent / 100))
          : undefined),
    stockStatus,
    stockLabel,
    inStock: true,
    inStockQty: branchStock,
    image: item.image || '/logo.png',
    macroImage: (item.images && item.images.length > 1 && item.images[1] !== item.image) ? item.images[1] : '',
    tag: item.collection || 'Tuyệt tác mộc',
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
  other: {
    title: 'Danh Mục Sản Phẩm Khác',
    options: [
      {
        id: 'rattan',
        label: 'Ghế Mây Tự Nhiên',
        matcher: (item) => matchesCategoryFilter(item, 'may') || matchesCategoryFilter(item, 'ghe may'),
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
  rattan: 'Ghế Mây',
};

export function normalizeSpace(spaceStr: string | null | undefined): { key: string; name: string } | null {
  if (!spaceStr || spaceStr === 'all') return null;
  const raw = decodeURIComponent(spaceStr).trim();
  const s = raw.toLowerCase();
  const norm = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/-/g, ' ');

  if (norm.includes('khac') || norm === 'other' || norm === 'kg05' || norm === 'kg06' || norm.includes('san pham khac')) {
    return { key: 'other', name: 'Sản Phẩm Khác' };
  }
  if (norm.includes('khach') || norm === 'living' || norm === 'kg01') {
    return { key: 'living', name: 'Phòng Khách' };
  }
  if (norm.includes('ngu') || norm === 'bedroom' || norm === 'kg03') {
    return { key: 'bedroom', name: 'Phòng Ngủ' };
  }
  if (norm.includes('phong an') || norm === 'dining' || norm === 'kg02' || norm.includes('bep') || norm === 'an') {
    return { key: 'dining', name: 'Phòng Ăn' };
  }
  if (norm.includes('lam viec') || norm === 'office' || norm === 'kg04') {
    return { key: 'office', name: 'Phòng Làm Việc' };
  }

  // Support any custom dynamic space created by user
  const formattedName = raw
    .replace(/-/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return { key: s, name: formattedName };
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

  // Other Room Categories (Sản Phẩm Khác)
  if (norm.includes('may') || norm.includes('ghe may') || norm === 'rattan') {
    return { name: 'Ghế Mây', spaceKey: 'other', spaceName: 'Sản Phẩm Khác' };
  }

  if (norm.includes('ghe') || norm === 'chair') {
    const sKey = currentSpaceKey || 'living';
    return {
      name: 'Ghế Thư Giãn & Đôn',
      spaceKey: sKey,
      spaceName: sKey === 'dining' ? 'Phòng Ăn' : sKey === 'office' ? 'Phòng Làm Việc' : sKey === 'other' ? 'Sản Phẩm Khác' : 'Phòng Khách',
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
    spaceName: sKey === 'bedroom' ? 'Phòng Ngủ' : sKey === 'dining' ? 'Phòng Ăn' : sKey === 'office' ? 'Phòng Làm Việc' : sKey === 'other' ? 'Sản Phẩm Khác' : 'Phòng Khách',
  };
}


function ProductsContent() {
  const router = useRouter();
  const { message } = App.useApp();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL Parameters
  const spaceParam = searchParams.get('space');
  const materialParam = searchParams.get('material');
  const categoryParam = searchParams.get('category');
  const queryParam = searchParams.get('q');

  // Real categories and spaces from Database API
  const [dbCategories, setDbCategories] = useState<AdminCategory[]>([]);
  const [dbSpaces, setDbSpaces] = useState<AdminSpace[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadCategories() {
      try {
        const cats = await categoryApi.getCategories({ status: 'active' });
        if (isMounted && cats && cats.length > 0) {
          setDbCategories(cats);
        }
      } catch (err) {
        console.warn('Could not load categories for customer filter:', err);
      }
    }
    loadCategories();

    async function loadSpaces() {
      try {
        const sp = await spaceApi.getSpaces({ status: 'active' });
        if (isMounted && Array.isArray(sp)) {
          setDbSpaces(sp);
        }
      } catch (err) {
        console.warn('Could not load spaces for customer filter:', err);
      }
    }
    loadSpaces();

    const handleDataChanged = () => {
      loadCategories();
      loadSpaces();
    };
    window.addEventListener('categories_changed', handleDataChanged);
    window.addEventListener('spaces_changed', handleDataChanged);
    return () => {
      isMounted = false;
      window.removeEventListener('categories_changed', handleDataChanged);
      window.removeEventListener('spaces_changed', handleDataChanged);
    };
  }, []);

  // Identify active room or deduce from category if space not in URL
  const resolvedSpace = useMemo(() => {
    if (spaceParam && spaceParam !== 'all') {
      const matchDb = dbSpaces.find(
        (s) =>
          s.slug?.toLowerCase() === spaceParam.toLowerCase() ||
          s.code?.toLowerCase() === spaceParam.toLowerCase() ||
          s.id?.toLowerCase() === spaceParam.toLowerCase() ||
          s.name?.toLowerCase() === spaceParam.toLowerCase()
      );
      if (matchDb) {
        return {
          key: matchDb.slug || matchDb.code.toLowerCase(),
          name: matchDb.name,
          id: matchDb.id,
        };
      }
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
  }, [spaceParam, pathname, categoryParam, dbSpaces]);

  const activeSpecificRoom = resolvedSpace?.key || null;

  // Categories belonging to the active space (or all if browsing all spaces)
  const activeSpaceCategories = useMemo(() => {
    if (!dbCategories || dbCategories.length === 0) return [];
    if (!activeSpecificRoom || activeSpecificRoom === 'all') {
      return dbCategories.filter((c) => c.status !== 'hidden');
    }

    const targetSpaceNorm = activeSpecificRoom.toLowerCase();
    const matchedSpace = dbSpaces.find(
      (s) => (s.slug || s.code.toLowerCase()) === targetSpaceNorm || s.name.toLowerCase() === targetSpaceNorm
    );
    const spaceId = matchedSpace?.id?.toLowerCase();
    const spaceName = matchedSpace?.name?.toLowerCase();

    return dbCategories.filter((cat) => {
      if (cat.status === 'hidden') return false;
      if (spaceId && cat.spaceId && cat.spaceId.toLowerCase() === spaceId) return true;
      const cSpace = (cat.space || '').toLowerCase().trim();
      if (spaceName && (cSpace === spaceName || cSpace.includes(spaceName) || spaceName.includes(cSpace))) return true;

      const normC = cSpace.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
      if (targetSpaceNorm === 'living') {
        return normC.includes('khach') || cSpace.includes('living');
      }
      if (targetSpaceNorm === 'bedroom') {
        return normC.includes('ngu') || cSpace.includes('bed');
      }
      if (targetSpaceNorm === 'dining') {
        return normC.includes('an') || normC.includes('bep') || cSpace.includes('dining');
      }
      if (targetSpaceNorm === 'office') {
        return normC.includes('viec') || normC.includes('sach') || cSpace.includes('office');
      }
      if (targetSpaceNorm === 'other') {
        return normC.includes('khac') || cSpace.includes('other');
      }
      return cSpace === targetSpaceNorm || normC.includes(targetSpaceNorm);
    });
  }, [dbCategories, dbSpaces, activeSpecificRoom]);

  // Filters State
  const [selectedSpaces, setSelectedSpaces] = useState<string[]>(['living', 'bedroom', 'dining', 'office', 'other']);
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
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);

  // Dynamic Products State loaded from API
  const [catalogProducts, setCatalogProducts] = useState<CategoryProduct[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      return 10;
    }
    return 9;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedBranch, setSelectedBranch] = useState<string>('');

  // Auto-switch pageSize: 10 on mobile (5 full rows of 2 columns), 9 on desktop (3x3 grid)
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 1024;
      setPageSize((prev) => {
        if (isMobile && prev === 9) return 10;
        if (!isMobile && prev === 10) return 9;
        return prev;
      });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const saved = typeof window !== 'undefined'
      ? (localStorage.getItem('d2_selected_branch') || localStorage.getItem('d2_customer_branch') || '')
      : '';
    if (saved && saved !== 'all') {
      setSelectedBranch(saved);
    }
    const handleBranchChanged = (e: any) => {
      const b = e.detail?.branch || e.detail?.branchName;
      if (b && b !== 'all') {
        setSelectedBranch(b);
      }
    };
    window.addEventListener('customer_branch_changed', handleBranchChanged);
    window.addEventListener('branch_changed', handleBranchChanged);
    return () => {
      window.removeEventListener('customer_branch_changed', handleBranchChanged);
      window.removeEventListener('branch_changed', handleBranchChanged);
    };
  }, []);

  const [realDbMaterials, setRealDbMaterials] = useState<WoodMaterialItem[]>([]);

  // Fetch real wood materials directly from Database API
  useEffect(() => {
    let isMounted = true;
    async function fetchDbMaterials() {
      try {
        const querySpace = spaceParam || (pathname === '/living-room' ? 'living' : undefined);
        const data = await productApi.getMaterials(querySpace && querySpace !== 'all' ? querySpace : undefined);
        if (isMounted && data && data.length > 0) {
          const grouped = groupDbMaterials(data);
          setRealDbMaterials(grouped);
          if (!materialParam) {
            setSelectedMaterials(grouped.map((m) => m.id));
          }
        }
      } catch (err) {
        console.warn('Could not load real materials from DB API:', err);
      }
    }
    fetchDbMaterials();
    return () => {
      isMounted = false;
    };
  }, [spaceParam, pathname, materialParam]);

  // Distinct wood materials derived directly from database API (/api/products/materials)
  const availableMaterials = useMemo(() => {
    if (realDbMaterials.length > 0) {
      return realDbMaterials.map((m) => ({
        id: m.id,
        label: m.shortName,
        queryKey: m.queryKey,
        count: m.count,
      }));
    }
    return [];
  }, [realDbMaterials]);

  const selectedMaterialsKey = selectedMaterials.join(',');
  const availableMaterialsCount = availableMaterials.length;

  // Reset page when URL parameters change
  useEffect(() => {
    setCurrentPage(1);
  }, [spaceParam, categoryParam, queryParam, pathname]);

  // Fetch real products from Backend using server-side pagination & DB filters
  useEffect(() => {
    let isMounted = true;
    async function loadProducts() {
      setIsLoading(true);
      try {
        const querySpace = spaceParam || (pathname === '/living-room' ? 'living' : undefined);

        // Determine if filtering by specific wood material
        let queryMaterial: string | undefined = undefined;
        if (selectedMaterials.length > 0 && availableMaterialsCount > 0 && selectedMaterials.length < availableMaterialsCount) {
          queryMaterial = selectedMaterials.map((m) => getMaterialQueryKey(m)).join(',');
        }

        const res = await productApi.getPagedProducts({
          page: currentPage,
          pageSize: pageSize,
          space: querySpace && querySpace !== 'all' ? querySpace : undefined,
          category: categoryParam || undefined,
          search: queryParam || searchQuery || undefined,
          material: queryMaterial,
          branch: selectedBranch && selectedBranch !== 'all' ? selectedBranch : undefined,
        });
        if (isMounted) {
          setCatalogProducts(res.items.map((i) => mapCatalogToCategoryProduct(i, selectedBranch)));
          setTotalItems(res.totalItems);
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
  }, [currentPage, pageSize, spaceParam, categoryParam, queryParam, searchQuery, pathname, selectedMaterialsKey, availableMaterialsCount, selectedBranch]);

  // Synchronize state with URL parameters
  useEffect(() => {
    const activeRoom = activeSpecificRoom;

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
      setSelectedSpaces(['living', 'bedroom', 'dining', 'office', 'other']);
      setSelectedSubcategories([]);
    }

    if (materialParam) {
      const decoded = decodeURIComponent(materialParam);
      const targetLabel = extractPrimaryWood(decoded);
      setSelectedMaterials([targetLabel]);
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
  }, [spaceParam, pathname, materialParam, categoryParam, queryParam, activeSpecificRoom]);

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
    setSelectedMaterials((prev) => {
      if (prev.length === availableMaterials.length) {
        return [mat];
      }
      if (prev.includes(mat)) {
        const next = prev.filter((m) => m !== mat);
        return next.length === 0 ? availableMaterials.map((m) => m.id) : next;
      }
      return [...prev, mat];
    });
    setCurrentPage(1);
  };
  const handleResetFilters = () => {
    if (activeSpecificRoom && SPACE_SUBCATEGORIES[activeSpecificRoom]) {
      setSelectedSpaces([activeSpecificRoom]);
      setSelectedSubcategories(SPACE_SUBCATEGORIES[activeSpecificRoom].options.map((o) => o.id));
    } else {
      setSelectedSpaces(['living', 'bedroom', 'dining', 'office', 'other']);
      setSelectedSubcategories([]);
    }
    setSelectedMaterials(availableMaterials.map((m) => m.id));
    setSelectedCategory(null);
    setSearchQuery('');
    setMaxPrice(75);
    setSortBy('best-selling');
    setCurrentPage(1);
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
      stockStatus: item.stockLabel || 'Còn hàng',
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

  // Filtered & Sorted Products from the current page
  const filteredProducts = useMemo(() => {
    return catalogProducts
      .filter((item) => {
        // Material filter
        if (availableMaterials.length > 0 && selectedMaterials.length > 0 && selectedMaterials.length < availableMaterials.length) {
          const itemMat = extractPrimaryWood(item.woodMaterialName || item.description);
          if (!selectedMaterials.includes(itemMat)) {
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
    selectedMaterials,
    availableMaterials,
    maxPrice,
    sortBy,
  ]);

  const pagedProducts = filteredProducts;


  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(val) + ' ₫';
  };

  // Count active filters for badge notification
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategory || categoryParam) count += 1;
    if (
      availableMaterials.length > 0 &&
      selectedMaterials.length > 0 &&
      selectedMaterials.length < availableMaterials.length
    ) {
      count += selectedMaterials.length;
    }
    if (maxPrice < 100) count += 1;
    return count;
  }, [selectedCategory, categoryParam, selectedMaterials, availableMaterials.length, maxPrice]);

  // Reusable Filter Sections (used by both Desktop Sidebar and Mobile Drawer)
  const renderFilterSections = (options?: { isSidebar?: boolean }) => {
    const isSidebar = options?.isSidebar ?? false;
    return (
      <>
        {/* Sắp xếp (Sort by) */}
        <div className="flex flex-col gap-2 pb-3.5 border-b border-[#eae1dd]">
          <label className="font-label-md text-xs text-[#1f1b19] uppercase tracking-wider font-bold">
            Sắp Xếp Theo
          </label>
          <Select
            value={sortBy}
            onChange={(val) => {
              setSortBy(val);
              setCurrentPage(1);
            }}
            size="middle"
            className="w-full font-label-md text-xs [&_.ant-select-selector]:!rounded-none [&_.ant-select-selector]:!border-[#eae1dd] [&_.ant-select-selector]:!bg-white hover:[&_.ant-select-selector]:!border-[#5d371f]"
            options={[
              { value: 'best-selling', label: 'Bán chạy nhất' },
              { value: 'price-asc', label: 'Giá: Thấp đến cao' },
              { value: 'price-desc', label: 'Giá: Cao đến thấp' },
            ]}
          />
        </div>

        {/* Filter 1: Categories (Ẩn hoàn toàn ở Sidebar trái vì đã có hàng Category Pills ngang) */}
        {!isSidebar && activeSpaceCategories.length > 0 && (
        <div className="flex flex-col gap-2.5 pb-3 border-b border-[#eae1dd]">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-xs text-[#1f1b19] uppercase tracking-wider font-bold">
              Danh Mục Sản Phẩm
            </span>
            {(selectedCategory || categoryParam) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory(null);
                  const params = new URLSearchParams(searchParams.toString());
                  params.delete('category');
                  router.push(`${pathname}?${params.toString()}`);
                }}
                className="text-[11px] text-[#83746c] hover:text-[#5d371f] cursor-pointer bg-transparent border-0 p-0 underline"
              >
                Bỏ chọn
              </button>
            )}
          </div>
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
            {activeSpaceCategories.map((cat) => {
              const isChecked = Boolean(
                (selectedCategory && (selectedCategory === cat.slug || selectedCategory === cat.id || selectedCategory === cat.name)) ||
                (categoryParam && (categoryParam === cat.slug || categoryParam === cat.id || categoryParam === cat.name))
              );
              return (
                <Checkbox
                  key={cat.id}
                  checked={isChecked}
                  onChange={() => {
                    const nextVal = isChecked ? null : (cat.slug || cat.id);
                    setSelectedCategory(nextVal);
                    const params = new URLSearchParams(searchParams.toString());
                    if (nextVal) {
                      params.set('category', nextVal);
                    } else {
                      params.delete('category');
                    }
                    router.push(`${pathname}?${params.toString()}`);
                  }}
                  className="text-xs font-medium text-[#51443d]"
                >
                  <span>{cat.name}</span>
                  {typeof cat.productCount === 'number' && cat.productCount > 0 && (
                    <span className="text-[11px] text-[#83746c] ml-1 font-normal font-mono">
                      ({cat.productCount})
                    </span>
                  )}
                </Checkbox>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter 2: Materials */}
      {availableMaterials.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-xs text-[#1f1b19] uppercase tracking-wider font-bold">
              Chất Liệu Tuyển Chọn
            </span>
            {selectedMaterials.length < availableMaterials.length && (
              <button
                type="button"
                onClick={() => {
                  setSelectedMaterials(availableMaterials.map((m) => m.id));
                  setCurrentPage(1);
                }}
                className="text-[11px] text-[#83746c] hover:text-[#5d371f] cursor-pointer bg-transparent border-0 p-0 underline"
              >
                Chọn tất cả
              </button>
            )}
          </div>
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
            min={1}
            max={100}
            step={1}
            value={maxPrice}
            onChange={(val) => setMaxPrice(val)}
            tooltip={{ formatter: (val) => `${val} triệu VNĐ` }}
          />
          <div className="flex justify-between font-data-mono text-[10px] text-[#83746c]">
            <span>1.000.000₫</span>
            <span>100.000.000₫</span>
          </div>
        </div>

        {/* Quick Price Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {[
            { label: 'Dưới 5tr', val: 5 },
            { label: 'Dưới 10tr', val: 10 },
            { label: 'Dưới 15tr', val: 15 },
            { label: 'Dưới 25tr', val: 25 },
            { label: 'Dưới 50tr', val: 50 },
            { label: 'Tất cả (100tr)', val: 100 },
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
    </>
  );
};

  // Dynamic breadcrumb space label
  const breadcrumbSpaceLabel = useMemo(() => {
    if (activeSpecificRoom === 'living') return 'Phòng khách';
    if (activeSpecificRoom === 'bedroom') return 'Phòng ngủ';
    if (activeSpecificRoom === 'dining') return 'Phòng ăn';
    if (activeSpecificRoom === 'office') return 'Phòng làm việc';
    if (activeSpecificRoom === 'other') return 'Sản phẩm khác';
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
        <div className="w-full">
          {/* Breadcrumb Bar */}
          <section className="w-full bg-[#fbf2ee] py-2.5 sm:py-3.5 border-b border-[#eae1dd]">
          <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 sm:gap-2 font-medium text-xs sm:text-[13px] text-[#83746c] flex-wrap"
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
            {/* Left Filter Sidebar (Desktop only - Hidden on Mobile) */}
            <aside className="hidden lg:flex lg:col-span-3 flex-col gap-6 bg-[#fbf2ee] p-5 sm:p-6 rounded-none border border-[#eae1dd] animate-slide-in-left sticky top-24 self-start">
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

              {renderFilterSections({ isSidebar: true })}
            </aside>

            {/* Right Products Grid Container (9 cols) */}
            <div className="lg:col-span-9 flex flex-col gap-4 sm:gap-6 animate-slide-in-right">
              {/* Category Pills (Desktop) & Mobile Filter Button (Left) */}
              <div className="flex items-center justify-start lg:justify-between gap-2 pb-0.5">
                {/* Mobile Filter Icon Button (Left side on mobile) */}
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(true)}
                  className="lg:hidden shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-none bg-[#5d371f] hover:bg-[#784e34] text-white shadow-xs transition-all cursor-pointer relative active:scale-95"
                  title="Mở bộ lọc"
                  aria-label="Bộ lọc"
                >
                  <FilterOutlined className="text-sm" />
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#ba1a1a] text-white font-mono text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {/* Desktop: Horizontal Category Pills */}
                {activeSpaceCategories.length > 0 && (
                  <div className="hidden lg:flex items-center gap-2 overflow-x-auto scrollbar-none flex-1 py-0.5">
                    {activeSpaceCategories.map((cat) => {
                      const isSelected = Boolean(
                        (selectedCategory && (selectedCategory === cat.slug || selectedCategory === cat.id || selectedCategory === cat.name)) ||
                        (categoryParam && (categoryParam === cat.slug || categoryParam === cat.id || categoryParam === cat.name))
                      );
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            const nextVal = isSelected ? null : (cat.slug || cat.id);
                            setSelectedCategory(nextVal);
                            const params = new URLSearchParams(searchParams.toString());
                            if (nextVal) {
                              params.set('category', nextVal);
                            } else {
                              params.delete('category');
                            }
                            router.push(`${pathname}?${params.toString()}`);
                          }}
                          className={`px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                            isSelected
                              ? 'bg-[#5d371f] text-white shadow-xs font-bold'
                              : 'bg-white text-slate-700 hover:bg-[#fbf2ee] hover:text-[#5d371f] border border-[#eae1dd]'
                          }`}
                        >
                          <span>{cat.name}</span>
                          {typeof cat.productCount === 'number' && cat.productCount > 0 && (
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                              {cat.productCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Desktop-only Controls & Sorters Bar */}
              <div className="hidden lg:flex items-center justify-between gap-3 bg-white p-3.5 px-5 rounded-none shadow-sm border border-[#eae1dd]">
                <div className="flex items-center gap-2 font-body-sm text-sm text-[#51443d]">
                  <span className="font-bold text-[#1f1b19]">{totalItems || filteredProducts.length}</span> mẫu thiết kế nội thất
                  <span className="text-[#83746c]">|</span>
                  <span className="text-[#3f4332]">
                    Chế tác thủ công từ D2 LUXURY
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-label-md text-xs text-[#83746c]">Sắp xếp:</span>
                  <Select
                    value={sortBy}
                    onChange={(val) => setSortBy(val)}
                    size="middle"
                    className="w-48 font-label-md text-xs [&_.ant-select-selector]:!rounded-none [&_.ant-select-selector]:!border-[#eae1dd]"
                    options={[
                      { value: 'best-selling', label: 'Bán chạy nhất' },
                      { value: 'price-asc', label: 'Giá: Thấp đến cao' },
                      { value: 'price-desc', label: 'Giá: Cao đến thấp' },
                    ]}
                  />
                </div>
              </div>

              {/* Products Grid */}
              {isLoading ? (
                <div className="grid gap-2.5 sm:gap-6 grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((idx) => (
                    <div
                      key={idx}
                      className="bg-white p-2.5 sm:p-4 border border-[#eae1dd] flex flex-col gap-2 sm:gap-3 animate-pulse"
                    >
                      <div className="aspect-[4/3] bg-[#eae1dd]/60 w-full" />
                      <div className="h-3 sm:h-4 bg-[#eae1dd]/80 w-1/3" />
                      <div className="h-4 sm:h-5 bg-[#eae1dd] w-3/4" />
                      <div className="h-3 sm:h-4 bg-[#eae1dd]/50 w-1/2 mt-1 sm:mt-2" />
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
                <div className="grid gap-2.5 sm:gap-6 grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                  {pagedProducts.map((p) => {
                    const isWishlisted = wishlistIds.includes(p.id);
                    const isOutOfStock = p.stockStatus === 'out_of_stock' || p.inStock === false;

                    return (
                      <Link
                        key={p.id}
                        href={`/products/${p.id}`}
                        className="group flex flex-col bg-white rounded-none overflow-hidden shadow-xs hover:border-[#5d371f]/50 transition-colors duration-300 border border-[#eae1dd] cursor-pointer text-inherit no-underline"
                      >
                        {/* Image & Macro Preview */}
                        <div className="relative aspect-[4/3] bg-white overflow-hidden">
                          <img
                            alt={p.name}
                            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ${isOutOfStock ? 'grayscale-[40%] opacity-80' : ''}`}
                            src={p.image || '/logo.png'}
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              if (!target.src.includes('logo.png')) {
                                target.src = '/logo.png';
                              }
                            }}
                          />

                          {/* Detail thumbnail cutout (chỉ hiển thị khi quản trị viên thực sự đã set ảnh phụ thứ 2) */}
                          {Boolean(p.macroImage && p.macroImage !== p.image) && (
                            <div className="hidden xs:block absolute bottom-1.5 left-1.5 sm:bottom-2.5 sm:left-2.5 w-7 h-7 sm:w-12 sm:h-12 rounded-none overflow-hidden shadow-md ring-1 sm:ring-2 ring-white/90 bg-white group-hover:scale-110 transition-transform">
                              <img
                                alt="Texture macro"
                                className="w-full h-full object-cover"
                                src={p.macroImage}
                                onError={(e) => {
                                  const target = e.currentTarget as HTMLImageElement;
                                  if (!target.src.includes('logo.png')) {
                                    target.src = '/logo.png';
                                  }
                                }}
                              />
                            </div>
                          )}

                          {/* Badges */}
                          <div className="absolute top-1.5 left-1.5 sm:top-3 sm:left-3 flex flex-col gap-1 items-start z-10 pointer-events-none">
                            {p.originalPrice && p.originalPrice > p.price && (
                              <span className="px-1.5 py-0.5 sm:px-2.5 bg-[#ba1a1a] text-white text-[9px] sm:text-[11px] font-bold shadow-md">
                                -{Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)}%
                              </span>
                            )}
                            {Boolean(p.stockLabel) && (
                              <Tag
                                color="rgba(255,255,255,0.9)"
                                className="!text-[#5d371f] !border-[#d5c3ba]/60 font-bold text-[9px] sm:text-xs rounded-none px-1.5 py-0 sm:px-2.5 sm:py-0.5 backdrop-blur-sm shadow-sm m-0"
                              >
                                {p.stockLabel}
                              </Tag>
                            )}
                          </div>
                        </div>

                        {/* Card Info */}
                        <div className="p-2.5 sm:p-5 flex flex-col flex-grow justify-between gap-1.5 sm:gap-3">
                          <div>
                            {/* Wood Material Name: Mixed-case on mobile, Uppercase on desktop */}
                            <div className="text-[#83746c] text-[10px] sm:text-[11px] font-medium sm:font-semibold mb-0.5 sm:mb-1 tracking-normal sm:tracking-wider sm:uppercase line-clamp-1">
                              <span className="sm:hidden">
                                {toTitleCase(p.woodMaterialName)}
                              </span>
                              <span className="hidden sm:inline">
                                {p.woodMaterialName}
                              </span>
                            </div>

                            {/* Product Name: Smaller on mobile (!text-[12px]), 18px on desktop */}
                            <h2 className="!text-[12px] sm:!text-[18px] text-[#1f1b19] group-hover:text-[#5d371f] transition-colors line-clamp-2 sm:line-clamp-1 font-bold leading-snug sm:leading-normal">
                              {p.name}
                            </h2>
                          </div>

                          {/* Pricing and CTA */}
                          <div className="pt-2 sm:pt-3 border-t border-[#eae1dd]/60 flex items-end justify-between gap-1">
                            <div className="flex flex-col min-w-0">
                              <span className="!text-[11.5px] sm:!text-[18px] text-[#5d371f] font-bold truncate">
                                {formatPrice(p.price)}
                              </span>
                              {p.originalPrice && p.originalPrice > p.price && (
                                <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                  <span className="text-[9.5px] sm:text-xs text-[#a89b93] line-through font-mono">
                                    {formatPrice(p.originalPrice)}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                type="primary"
                                size="small"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleAddCategoryProductToCart(p);
                                }}
                                className="bg-[#5d371f] hover:!bg-[#784e34] shadow-xs sm:shadow-md rounded-none flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 p-0"
                                icon={<ShoppingCartOutlined className="text-xs sm:text-[16px]" />}
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
              {totalItems > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#eae1dd]">
                  <span className="font-body-sm text-xs text-[#83746c]">
                    Hiển thị <span className="font-bold text-[#1f1b19]">
                      {Math.min((currentPage - 1) * pageSize + 1, totalItems)} - {Math.min(currentPage * pageSize, totalItems)}
                    </span> của{' '}
                    <span className="font-bold text-[#1f1b19]">{totalItems}</span> mẫu thiết kế
                  </span>

                  <Pagination
                    current={currentPage}
                    total={totalItems}
                    pageSize={pageSize}
                    showSizeChanger={true}
                    pageSizeOptions={['6', '9', '10', '12', '20', '24', '36', '48']}
                    onShowSizeChange={(current, size) => {
                      setPageSize(size);
                      setCurrentPage(1);
                    }}
                    onChange={(page, size) => {
                      setCurrentPage(page);
                      if (size && size !== pageSize) {
                        setPageSize(size);
                      }
                      window.scrollTo({ top: 300, behavior: 'smooth' });
                    }}
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

      {/* Mobile Filter Drawer */}
      <Drawer
        open={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        placement="right"
        destroyOnHidden={false}
        closable={false}
        styles={{
          wrapper: {
            width: '100%',
            maxWidth: '100vw',
          },
          body: {
            padding: 0,
            backgroundColor: '#fff8f5',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          },
        }}
      >
        {/* Drawer Header */}
        <div className="p-4 bg-white border-b border-[#eae1dd] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#5d371f] text-white flex items-center justify-center text-xs">
              <FilterOutlined />
            </div>
            <span className="font-sans font-bold text-sm text-[#1f1b19]">
              Bộ Lọc Chọn Lọc
            </span>
            {activeFilterCount > 0 && (
              <Tag color="#5d371f" className="font-mono text-[10px] rounded-none ml-1">
                {activeFilterCount}
              </Tag>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(false)}
            className="w-8 h-8 rounded-none border border-[#eae1dd] text-[#83746c] hover:text-[#ba1a1a] flex items-center justify-center transition-colors cursor-pointer bg-white"
            aria-label="Đóng bộ lọc"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 flex flex-col gap-6">
          {renderFilterSections()}
        </div>

        {/* Drawer Sticky Footer Actions */}
        <div className="p-3 bg-white border-t border-[#eae1dd] flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              handleResetFilters();
            }}
            className="flex-1 py-2.5 px-3 border border-[#d5c3ba] text-[#51443d] hover:bg-[#fbf2ee] text-xs font-semibold rounded-none transition-colors cursor-pointer text-center"
          >
            Đặt lại
          </button>
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(false)}
            className="flex-1 py-2.5 px-3 bg-[#5d371f] hover:bg-[#784e34] text-white text-xs font-bold rounded-none shadow-sm transition-colors cursor-pointer text-center"
          >
            Áp dụng ({totalItems || filteredProducts.length})
          </button>
        </div>
      </Drawer>

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
