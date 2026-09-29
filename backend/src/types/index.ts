export interface Product {
  id: string;
  name: string;
  category: string;
  categoryName: string;
  woodType: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  dimensions: string;
  description: string;
  image: string;
  tag?: string;
  sku: string;
  stockStatus: string;
}

export interface CategoryProduct {
  id: string;
  name: string;
  space: 'living' | 'bedroom' | 'dining' | 'office';
  spaceLabel: string;
  woodMaterialId: string;
  woodMaterialName: string;
  woodDetail: string;
  colorTone: string;
  price: number;
  originalPrice?: number;
  stockStatus: 'showroom' | 'custom';
  stockLabel: string;
  image: string;
  macroImage: string;
  sku: string;
  description: string;
  dimensions: string;
}

export interface BookingRequest {
  fullName: string;
  phone: string;
  email?: string;
  space: string;
  consultationType: 'showroom' | 'online' | 'home';
  preferredDate: string;
  preferredTime: string;
  notes?: string;
}

export interface OrderRequest {
  customerName: string;
  phone: string;
  address: string;
  items: {
    productId: string;
    quantity: number;
    selectedWoodOption?: string;
  }[];
  totalAmount: number;
  notes?: string;
}
