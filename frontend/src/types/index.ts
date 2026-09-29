export interface Product {
  id: string;
  sku: string;
  name: string;
  category: 'living' | 'bedroom' | 'dining' | 'office';
  categoryName: string;
  price: number;
  originalPrice?: number;
  image: string;
  tag?: string;
  tagColor?: string;
  woodType: string;
  rating: number;
  reviewCount: number;
  subtitle: string;
  description: string;
  dimensions: string;
  stockStatus: string;
  inStock: boolean;
  materialDetails: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
