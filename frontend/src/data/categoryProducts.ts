export interface CategoryProduct {
  id: string;
  sku: string;
  name: string;
  space: 'living' | 'bedroom' | 'dining' | 'office' | 'other' | string;
  spaceName: string;
  categoryId?: string;
  categoryName?: string;
  woodMaterial: 'oak' | 'ash' | 'metay' | 'rattan' | string;
  woodMaterialName: string;
  colorTone: 'chestnut' | 'dark-brown' | 'light-oak' | 'beige' | 'grey';
  price: number;
  originalPrice?: number;
  stockStatus: 'showroom' | 'custom' | 'out_of_stock' | string;
  stockLabel: string;
  inStock?: boolean;
  inStockQty?: number;
  image: string;
  macroImage: string;
  tag?: string;
  description: string;
  dimensions: string;
  warranty: string;
}

// Category Products loaded dynamically from Backend API (productApi)
export const categoryProductsData: CategoryProduct[] = [];
