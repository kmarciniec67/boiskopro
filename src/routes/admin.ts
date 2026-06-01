import { Router, Request, Response, NextFunction } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { z } from 'zod';
import { requireAdmin } from '../middleware/auth.js';
import * as productRepo from '../repositories/productRepository.js';
import * as orderRepo from '../repositories/orderRepository.js';
import * as userRepo from '../repositories/userRepository.js';
import { toPublicUser } from '../utils/userDto.js';

export const adminRouter = Router();

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || '.jpg';
      const safe = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
      cb(null, safe);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Dozwolone są tylko pliki graficzne'));
      return;
    }
    cb(null, true);
  },
});

adminRouter.use(requireAdmin);

const createProductSchema = z.object({
  sku: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  category: z.enum(['korki', 'pilki', 'stroje']),
  price: z.number().positive(),
  stock: z.number().int().nonnegative(),
  unit: z.string().min(1).max(20).default('szt'),
  imageUrl: z.union([z.string().url(), z.string().startsWith('/uploads/')]).optional().nullable(),
});

const updateProductSchema = z.object({
  sku: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().nullable().optional(),
  category: z.enum(['korki', 'pilki', 'stroje']).optional(),
  price: z.number().positive().optional(),
  stock: z.number().int().nonnegative().optional(),
  unit: z.string().min(1).max(20).optional(),
  imageUrl: z.union([z.string().url(), z.string().startsWith('/uploads/')]).nullable().optional(),
  isActive: z.boolean().optional(),
});

const orderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']),
});

adminRouter.post('/upload', upload.single('image'), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'Brak pliku' });
    return;
  }
  res.json({ data: { url: `/uploads/${req.file.filename}` } });
});

adminRouter.get('/products', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await productRepo.findAllProducts(false);
    res.json({ data: products });
  } catch (error) {
    next(error);
  }
});

adminRouter.post('/products', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = createProductSchema.parse(req.body);
    const product = await productRepo.createProduct({
      ...body,
      imageUrl: body.imageUrl,
    });
    res.status(201).json({ data: product });
  } catch (error) {
    next(error);
  }
});

adminRouter.delete('/products/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: 'Nieprawidłowe ID produktu' });
      return;
    }

    const product = await productRepo.findProductById(id);
    if (!product) {
      res.status(404).json({ error: 'Produkt nie znaleziony' });
      return;
    }

    try {
      await productRepo.deleteProduct(id);
    } catch (error) {
      if (error instanceof Error && error.message.includes('zamówieniach')) {
        res.status(400).json({ error: error.message });
        return;
      }
      throw error;
    }

    await userRepo.deleteReviewsByProductId(id);

    if (product.image_url?.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), product.image_url.slice(1));
      fs.unlink(filePath, () => undefined);
    }

    res.json({ data: { deleted: true } });
  } catch (error) {
    next(error);
  }
});

adminRouter.patch('/products/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: 'Nieprawidłowe ID produktu' });
      return;
    }
    const body = updateProductSchema.parse(req.body);
    const product = await productRepo.updateProduct(id, {
      sku: body.sku,
      name: body.name,
      description: body.description,
      category: body.category,
      price: body.price,
      stock: body.stock,
      unit: body.unit,
      imageUrl: body.imageUrl,
      isActive: body.isActive,
    });
    if (!product) {
      res.status(404).json({ error: 'Produkt nie znaleziony' });
      return;
    }
    res.json({ data: product });
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/orders', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const orders = await orderRepo.findAllOrders();
    const enriched = await Promise.all(
      orders.map(async (order) => ({
        order,
        items: await orderRepo.findOrderItems(order.id),
      }))
    );
    res.json({ data: enriched });
  } catch (error) {
    next(error);
  }
});

adminRouter.patch('/orders/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: 'Nieprawidłowe ID zamówienia' });
      return;
    }
    const { status } = orderStatusSchema.parse(req.body);
    const order = await orderRepo.updateOrderStatus(id, status);
    if (!order) {
      res.status(404).json({ error: 'Zamówienie nie znalezione' });
      return;
    }
    res.json({ data: order });
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/users', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await userRepo.findAllUsers();
    res.json({ data: users.map(toPublicUser) });
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/users/:id/orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = String(req.params.id);
    const user = await userRepo.findUserById(userId);
    if (!user) {
      res.status(404).json({ error: 'Użytkownik nie znaleziony' });
      return;
    }
    const orders = await orderRepo.findOrdersByUserId(userId);
    const enriched = await Promise.all(
      orders.map(async (order) => ({
        order,
        items: await orderRepo.findOrderItems(order.id),
      }))
    );
    res.json({ data: enriched });
  } catch (error) {
    next(error);
  }
});

adminRouter.delete('/users/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = String(req.params.id);
    const target = await userRepo.findUserById(userId);
    if (!target) {
      res.status(404).json({ error: 'Użytkownik nie znaleziony' });
      return;
    }
    if (target.role === 'admin') {
      res.status(400).json({ error: 'Nie można usunąć konta administratora' });
      return;
    }
    if (req.auth?.userId === userId) {
      res.status(400).json({ error: 'Nie możesz usunąć własnego konta' });
      return;
    }
    const deleted = await userRepo.deleteUserById(userId);
    if (!deleted) {
      res.status(404).json({ error: 'Użytkownik nie znaleziony' });
      return;
    }
    res.json({ data: { deleted: true } });
  } catch (error) {
    next(error);
  }
});
