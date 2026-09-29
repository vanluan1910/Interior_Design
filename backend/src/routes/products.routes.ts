import { Router } from 'express';
import {
  getProducts,
  getProductById,
  getFeaturedProducts,
} from '../controllers/products.controller';

const router = Router();

router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/:id', getProductById);

export default router;
