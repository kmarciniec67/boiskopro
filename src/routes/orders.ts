import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import * as orderRepo from '../repositories/orderRepository.js';
import { logActivity } from '../repositories/userRepository.js';

export const ordersRouter = Router();

const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
  shippingAddress: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().default('PL'),
  }),
  paymentMethod: z.enum(['card', 'blik', 'transfer', 'cash_on_delivery']),
});

ordersRouter.post('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = createOrderSchema.parse(req.body);
    const userId = req.auth!.userId;

    const result = await orderRepo.createOrder({
      mongoUserId: userId,
      items: body.items,
      shippingAddress: body.shippingAddress,
      paymentMethod: body.paymentMethod,
    });

    await logActivity({
      userId,
      action: 'order.created',
      entityType: 'order',
      entityId: String(result.order.id),
      metadata: { orderNumber: result.order.order_number },
    });

    res.status(201).json({ data: result });
  } catch (error) {
    next(error);
  }
});

ordersRouter.get('/mine', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orders = await orderRepo.findOrdersByUserId(req.auth!.userId);
    res.json({ data: orders });
  } catch (error) {
    next(error);
  }
});

ordersRouter.get('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: 'Nieprawidłowe id zamówienia' });
      return;
    }

    const order = await orderRepo.findOrderById(id);
    if (!order) {
      res.status(404).json({ error: 'Zamówienie nie znalezione' });
      return;
    }

    if (req.auth!.role !== 'admin' && order.mongo_user_id !== req.auth!.userId) {
      res.status(403).json({ error: 'Brak dostępu do tego zamówienia' });
      return;
    }

    const items = await orderRepo.findOrderItems(id);
    res.json({ data: { order, items } });
  } catch (error) {
    next(error);
  }
});
