import { Router, Request, Response, NextFunction } from 'express';
import * as productRepo from '../repositories/productRepository.js';
import { param } from '../utils/params.js';

export const productsRouter = Router();

productsRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await productRepo.findAllProducts();
    res.json({ data: products });
  } catch (error) {
    next(error);
  }
});

productsRouter.get('/category/:category', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await productRepo.findProductsByCategory(param(req.params.category));
    res.json({ data: products });
  } catch (error) {
    next(error);
  }
});

productsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: 'Invalid product id' });
      return;
    }
    const product = await productRepo.findProductById(id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json({ data: product });
  } catch (error) {
    next(error);
  }
});
