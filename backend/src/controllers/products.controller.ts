import { Request, Response } from 'express';
import { productsData } from '../data/products';

export const getProducts = (req: Request, res: Response) => {
  const { category, search, minPrice, maxPrice, sortBy } = req.query;

  let result = [...productsData];

  if (category && category !== 'all') {
    result = result.filter((p) => p.category === category);
  }

  if (search) {
    const q = String(search).toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.woodType.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
    );
  }

  if (minPrice) {
    result = result.filter((p) => p.price >= Number(minPrice));
  }

  if (maxPrice) {
    result = result.filter((p) => p.price <= Number(maxPrice));
  }

  if (sortBy) {
    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      default:
        break;
    }
  }

  res.json({
    success: true,
    total: result.length,
    data: result,
  });
};

export const getProductById = (req: Request, res: Response) => {
  const { id } = req.params;
  const product = productsData.find((p) => p.id === id || p.sku === id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Không tìm thấy sản phẩm.',
    });
  }

  res.json({
    success: true,
    data: product,
  });
};

export const getFeaturedProducts = (_req: Request, res: Response) => {
  const featured = productsData.filter((p) => p.rating >= 4.8);
  res.json({
    success: true,
    data: featured,
  });
};
