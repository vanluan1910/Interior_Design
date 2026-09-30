'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, usePathname } from 'next/navigation';
import { Slider, Select, Pagination, Tag, Button, Checkbox, Tooltip, App } from 'antd';
import {
  EyeOutlined,
  ShoppingCartOutlined,
  FilterOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  RightOutlined,
  InboxOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import QuickViewModal from '@/components/QuickViewModal';
import SampleBoxModal from '@/components/SampleBoxModal';
import { categoryProductsData, CategoryProduct } from '@/data/categoryProducts';
import { productsData } from '@/data/products';
import { Product, CartItem } from '@/types';
import { useCart } from '@/context/CartContext';

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
        id: 'sofa',
        label: 'Sofa Gỗ & Da Bò Ý',
        matcher: (item) => item.id.includes('sofa') || item.sku.includes('SF') || item.name.toLowerCase().includes('sofa'),
      },
      {
        id: 'table',
        label: 'Bàn Trà & Bàn Góc',
        matcher: (item) => item.id.includes('table') || item.sku.includes('TB') || item.name.toLowerCase().includes('bàn trà'),
      },
      {
        id: 'cabinet',
        label: 'Kệ Tivi & Tủ Trang Trí',
        matcher: (item) => item.id.includes('cabinet') || item.sku.includes('CB') || item.name.toLowerCase().includes('kệ') || item.name.toLowerCase().includes('tủ'),
      },
      {
        id: 'chair',
        label: 'Ghế Thư Giãn & Đôn Gỗ',
        matcher: (item) => item.id.includes('chair') || item.sku.includes('CH') || item.name.toLowerCase().includes('ghế'),
      },
    ],
  },
  bedroom: {
    title: 'Danh Mục Phòng Ngủ',
    options: [
      {
        id: 'bed',
        label: 'Giường Ngủ Tự Nhiên',
        matcher: (item) => item.id.includes('bed') || item.sku.includes('BD') || item.name.toLowerCase().includes('giường'),
      },
      {
        id: 'tab',
        label: 'Táp Đầu Giường (Nightstand)',
        matcher: (item) => item.id.includes('tab') || item.sku.includes('TB') || item.name.toLowerCase().includes('tab'),
      },
      {
        id: 'wardrobe',
        label: 'Tủ Quần Áo Âm Tường',
        matcher: (item) => item.id.includes('wardrobe') || item.sku.includes('WD') || item.name.toLowerCase().includes('tủ áo'),
      },
      {
        id: 'dresser',
        label: 'Bàn Trang Điểm & Gương',
        matcher: (item) => item.id.includes('dresser') || item.sku.includes('DR') || item.name.toLowerCase().includes('trang điểm'),
      },
    ],
  },
  dining: {
    title: 'Danh Mục Phòng Ăn',
    options: [
      {
        id: 'dining',
        label: 'Bàn Ăn Tự Nhiên & Mở Rộng',
        matcher: (item) => item.id.includes('dining') || item.sku.includes('DT') || item.name.toLowerCase().includes('bàn ăn'),
      },
      {
        id: 'chair',
        label: 'Ghế Ăn Tựa Đan Dây',
        matcher: (item) => item.id.includes('chair') || item.sku.includes('DC') || item.name.toLowerCase().includes('ghế'),
      },
      {
        id: 'island',
        label: 'Tủ Rượu & Quầy Đảo Bếp',
        matcher: (item) => item.id.includes('island') || item.sku.includes('IB') || item.name.toLowerCase().includes('đảo') || item.name.toLowerCase().includes('rượu'),
      },
    ],
  },
  office: {
    title: 'Danh Mục Bàn Làm Việc',
    options: [
      {
        id: 'desk',
        label: 'Bàn Làm Việc Tự Nhiên',
        matcher: (item) => item.id.includes('desk') || item.sku.includes('DK') || item.name.toLowerCase().includes('bàn làm việc'),
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

const MATERIAL_NAMES: Record<string, string> = {
  walnut: 'Gỗ óc chó Bắc Mỹ',
  oak: 'Gỗ sồi trắng Mỹ',
  ash: 'Gỗ tần bì tự nhiên',
  leather: 'Khung gỗ bọc da bò Ý',
};

function ProductsContent() {
  const { message } = App.useApp();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL Parameters
  const spaceParam = searchParams.get('space');
  const materialParam = searchParams.get('material');
  const categoryParam = searchParams.get('category');
  const queryParam = searchParams.get('q');

  // Identify active room if navigating to a specific space
  const activeSpecificRoom = useMemo(() => {
    if (spaceParam && spaceParam !== 'all' && SPACE_SUBCATEGORIES[spaceParam]) {
      return spaceParam;
    }
    if (pathname === '/living-room') return 'living';
    return null;
  }, [spaceParam, pathname]);

  // Filters State
  const [selectedSpaces, setSelectedSpaces] = useState<string[]>(['living', 'bedroom', 'dining', 'office']);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>(['walnut', 'oak', 'ash', 'leather']);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<number>(75);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedStock, setSelectedStock] = useState<string[]>(['showroom', 'custom']);
  const [sortBy, setSortBy] = useState<string>('best-selling');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Synchronize state with URL parameters
  useEffect(() => {
    const activeRoom = (spaceParam && spaceParam !== 'all') ? spaceParam : (pathname === '/living-room' ? 'living' : null);

    if (activeRoom && SPACE_SUBCATEGORIES[activeRoom]) {
      setSelectedSpaces([activeRoom]);
      if (categoryParam) {
        setSelectedSubcategories([categoryParam]);
      } else {
        setSelectedSubcategories(SPACE_SUBCATEGORIES[activeRoom].options.map((o) => o.id));
      }
    } else {
      setSelectedSpaces(['living', 'bedroom', 'dining', 'office']);
      setSelectedSubcategories([]);
    }

    if (materialParam) {
      setSelectedMaterials([materialParam]);
    } else {
      setSelectedMaterials(['walnut', 'oak', 'ash', 'leather']);
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
  }, [spaceParam, pathname, materialParam, categoryParam, queryParam]);

  // Modals & Cart State
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [sampleModalOpen, setSampleModalOpen] = useState<boolean>(false);

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

  const toggleStock = (st: string) => {
    setSelectedStock((prev) =>
      prev.includes(st) ? prev.filter((s) => s !== st) : [...prev, st]
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
    setSelectedMaterials(['walnut', 'oak', 'ash', 'leather']);
    setSelectedCategory(null);
    setSearchQuery('');
    setMaxPrice(75);
    setSelectedColor(null);
    setSelectedStock(['showroom', 'custom']);
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
    return categoryProductsData
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
            return opt ? opt.matcher(item) : false;
          });
          if (!matchesSub) {
            return false;
          }
        }

        // Material filter
        if (selectedMaterials.length > 0 && !selectedMaterials.includes(item.woodMaterial)) {
          return false;
        }

        // Category / Subcategory filter from header menu
        if (selectedCategory) {
          const id = item.id.toLowerCase();
          const sku = item.sku.toLowerCase();
          const name = item.name.toLowerCase();
          const cat = selectedCategory.toLowerCase();

          if (cat === 'sofa' && !id.includes('sofa') && !sku.includes('sf') && !name.includes('sofa')) return false;
          if (cat === 'table' && !id.includes('table') && !sku.includes('tb') && !name.includes('bàn trà')) return false;
          if (cat === 'cabinet' && !id.includes('cabinet') && !sku.includes('cb') && !name.includes('kệ') && !name.includes('tủ')) return false;
          if (cat === 'chair' && !id.includes('chair') && !sku.includes('ch') && !sku.includes('dc') && !name.includes('ghế')) return false;
          if (cat === 'bed' && !id.includes('bed') && !sku.includes('bd') && !name.includes('giường')) return false;
          if (cat === 'tab' && !id.includes('tab') && !sku.includes('tb') && !name.includes('tab')) return false;
          if (cat === 'wardrobe' && !id.includes('wardrobe') && !sku.includes('wd') && !name.includes('tủ áo')) return false;
          if (cat === 'dresser' && !id.includes('dresser') && !sku.includes('dr') && !name.includes('trang điểm')) return false;
          if (cat === 'dining' && !id.includes('dining') && !sku.includes('dt') && !name.includes('bàn ăn')) return false;
          if (cat === 'island' && !id.includes('island') && !sku.includes('ib') && !name.includes('đảo') && !name.includes('rượu')) return false;
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

        // Color tone filter
        if (selectedColor && item.colorTone !== selectedColor) {
          return false;
        }

        // Stock status filter
        if (selectedStock.length > 0 && !selectedStock.includes(item.stockStatus)) {
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
    selectedSpaces,
    activeSpecificRoom,
    selectedSubcategories,
    selectedMaterials,
    selectedCategory,
    searchQuery,
    maxPrice,
    selectedColor,
    selectedStock,
    sortBy,
  ]);

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

              {activeSpecificRoom ? (
                <>
                  <Link
                    href={`/products?space=${activeSpecificRoom}`}
                    className={`transition-colors ${
                      selectedCategory || searchQuery || (materialParam && MATERIAL_NAMES[materialParam])
                        ? 'hover:text-[#5d371f]'
                        : 'text-[#5d371f] font-bold'
                    }`}
                  >
                    {breadcrumbSpaceLabel}
                  </Link>
                </>
              ) : (
                <span className="text-[#5d371f] font-bold">
                  {breadcrumbSpaceLabel}
                </span>
              )}

              {selectedCategory && (
                <>
                  <RightOutlined className="text-[10px] text-[#83746c]" />
                  <span className="text-[#5d371f] font-bold">
                    {CATEGORY_NAMES[selectedCategory] || selectedCategory}
                  </span>
                </>
              )}

              {materialParam && MATERIAL_NAMES[materialParam] && (
                <>
                  <RightOutlined className="text-[10px] text-[#83746c]" />
                  <span className="text-[#5d371f] font-bold">
                    {MATERIAL_NAMES[materialParam]}
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
              <div className="flex flex-col gap-2.5">
                <span className="font-label-md text-xs text-[#1f1b19] uppercase tracking-wider font-bold">
                  Chất Liệu Tuyển Chọn
                </span>
                <div className="flex flex-col gap-2">
                  {[
                    { id: 'walnut', label: 'Gỗ óc chó Bắc Mỹ (Walnut)' },
                    { id: 'oak', label: 'Gỗ sồi trắng Mỹ (White Oak)' },
                    { id: 'ash', label: 'Gỗ tần bì tự nhiên (Ash)' },
                    { id: 'leather', label: 'Khung gỗ bọc da bò Ý' },
                  ].map((item) => (
                    <Checkbox
                      key={item.id}
                      checked={selectedMaterials.includes(item.id)}
                      onChange={() => toggleMaterial(item.id)}
                      className="text-xs font-medium text-[#51443d]"
                    >
                      {item.label}
                    </Checkbox>
                  ))}
                </div>
              </div>

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

              {/* Filter 4: Finish & Swatch Tone */}
              <div className="flex flex-col gap-2.5 pt-2 border-t border-[#eae1dd]">
                <span className="font-label-md text-xs text-[#1f1b19] uppercase tracking-wider font-bold">
                  Tông Màu Hoàn Thiện
                </span>
                <div className="flex items-center gap-2.5">
                  {[
                    { id: 'chestnut', color: '#5c3c26', name: 'Nâu hạt dẻ óc chó' },
                    { id: 'dark-brown', color: '#3a2012', name: 'Nâu cánh gián đậm' },
                    { id: 'light-oak', color: '#cbb493', name: 'Sồi sáng tự nhiên' },
                    { id: 'beige', color: '#eee7dc', name: 'Đệm vải be kem Wabi' },
                    { id: 'grey', color: '#8a8885', name: 'Vải nỉ xám khói' },
                  ].map((swatch) => (
                    <Tooltip key={swatch.id} title={swatch.name}>
                      <button
                        onClick={() =>
                          setSelectedColor(selectedColor === swatch.id ? null : swatch.id)
                        }
                        style={{ backgroundColor: swatch.color }}
                        className={`w-7 h-7 rounded-none shadow-sm transition-transform cursor-pointer flex items-center justify-center ${
                          selectedColor === swatch.id
                            ? 'ring-2 ring-offset-2 ring-[#5d371f] scale-110'
                            : 'hover:scale-105'
                        }`}
                      >
                        {selectedColor === swatch.id && (
                          <CheckOutlined className="text-[11px] text-white" />
                        )}
                      </button>
                    </Tooltip>
                  ))}
                </div>
              </div>

              {/* Filter 5: Stock Status */}
              <div className="flex flex-col gap-2.5 pt-2 border-t border-[#eae1dd]">
                <span className="font-label-md text-xs text-[#1f1b19] uppercase tracking-wider font-bold">
                  Tình Trạng Hàng
                </span>
                <div className="flex flex-col gap-2 font-body-sm text-xs">
                  <Checkbox
                    checked={selectedStock.includes('showroom')}
                    onChange={() => toggleStock('showroom')}
                    className="text-xs font-medium text-[#51443d]"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-none bg-emerald-600 inline-block"></span>
                      Sẵn tại Showroom (Giao 24h)
                    </span>
                  </Checkbox>
                  <Checkbox
                    checked={selectedStock.includes('custom')}
                    onChange={() => toggleStock('custom')}
                    className="text-xs font-medium text-[#51443d]"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-none bg-amber-600 inline-block"></span>
                      Đặt chế tác riêng (7 - 14 ngày)
                    </span>
                  </Checkbox>
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

                  <div className="hidden sm:flex items-center gap-1 bg-[#f5ece8] p-1 rounded-none border border-[#d5c3ba]/60">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded-none transition-colors cursor-pointer ${
                        viewMode === 'grid' ? 'bg-white text-[#5d371f] shadow-sm' : 'text-[#83746c]'
                      }`}
                      aria-label="Lưới 3 cột"
                    >
                      <AppstoreOutlined className="text-[16px]" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded-none transition-colors cursor-pointer ${
                        viewMode === 'list' ? 'bg-white text-[#5d371f] shadow-sm' : 'text-[#83746c]'
                      }`}
                      aria-label="Xem danh sách"
                    >
                      <UnorderedListOutlined className="text-[16px]" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Products Grid */}
              {filteredProducts.length === 0 ? (
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
                <div
                  className={`grid gap-6 ${
                    viewMode === 'grid'
                      ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                      : 'grid-cols-1'
                  }`}
                >
                  {filteredProducts.map((p) => {
                    const isWishlisted = wishlistIds.includes(p.id);

                    return (
                      <article
                        key={p.id}
                        className="group flex flex-col bg-white rounded-none overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-[#eae1dd] hover-lift"
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
                              <Link href={`/products/${p.id}`} className="hover:underline">
                                {p.name}
                              </Link>
                            </h2>
                          </div>

                          {/* Pricing and CTA */}
                          <div className="pt-3 border-t border-[#eae1dd]/60 flex items-end justify-between">
                            <div className="flex flex-col">
                              {p.originalPrice && (
                                <span className="font-data-mono text-[11px] text-[#83746c] line-through">
                                  {formatPrice(p.originalPrice)}
                                </span>
                              )}
                              <span className="font-headline-sm text-base sm:text-lg text-[#5d371f] font-bold">
                                {formatPrice(p.price)}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <Link href={`/products/${p.id}`}>
                                <Button
                                  size="middle"
                                  className="rounded-none bg-[#f5ece8] border-[#eae1dd] text-[#1f1b19] font-bold text-xs hover:!bg-[#eae1dd] hover:!border-[#5d371f]"
                                  icon={<EyeOutlined />}
                                >
                                  <span className="hidden sm:inline">Chi tiết</span>
                                </Button>
                              </Link>

                              <Button
                                type="primary"
                                size="middle"
                                onClick={() => handleAddCategoryProductToCart(p)}
                                className="bg-[#5d371f] hover:!bg-[#784e34] rounded-none shadow-md flex items-center justify-center"
                                icon={<ShoppingCartOutlined className="text-[16px]" />}
                              />
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              {/* Ant Design Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#eae1dd]">
                <span className="font-body-sm text-xs text-[#83746c]">
                  Hiển thị <span className="font-bold text-[#1f1b19]">1 - {filteredProducts.length}</span> của{' '}
                  <span className="font-bold text-[#1f1b19]">24</span> mẫu thiết kế
                </span>

                <Pagination
                  current={currentPage}
                  total={filteredProducts.length}
                  pageSize={6}
                  onChange={(page) => setCurrentPage(page)}
                  showSizeChanger={false}
                />
              </div>
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
