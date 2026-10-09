export interface CategoryProduct {
  id: string;
  sku: string;
  name: string;
  space: 'living' | 'bedroom' | 'dining' | 'office';
  spaceName: string;
  categoryId?: string;
  categoryName?: string;
  woodMaterial: 'oak' | 'ash' | 'metay' | 'rattan' | string;
  woodMaterialName: string;
  colorTone: 'chestnut' | 'dark-brown' | 'light-oak' | 'beige' | 'grey';
  price: number;
  originalPrice?: number;
  stockStatus: 'showroom' | 'custom';
  stockLabel: string;
  image: string;
  macroImage: string;
  tag?: string;
  description: string;
  dimensions: string;
  warranty: string;
}

// Category Products loaded dynamically from Backend API (productApi)
export const categoryProductsData: CategoryProduct[] = [];
