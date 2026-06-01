import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import * as userRepo from '../repositories/userRepository.js';
import { findProductById } from '../repositories/productRepository.js';

export const reviewsRouter = Router();

reviewsRouter.get('/product/:productId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = Number(req.params.productId);
    if (Number.isNaN(productId)) {
      res.status(400).json({ error: 'Nieprawidłowe id produktu' });
      return;
    }
    const reviews = await userRepo.findReviewsByProductId(productId);
    res.json({ data: reviews });
  } catch (error) {
    next(error);
  }
});

const createReviewSchema = z.object({
  productId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(1).max(120),
  comment: z.string().min(1).max(2000),
});

reviewsRouter.post('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = createReviewSchema.parse(req.body);
    const userId = req.auth!.userId;

    const product = await findProductById(body.productId);
    if (!product) {
      res.status(404).json({ error: 'Produkt nie istnieje' });
      return;
    }

    const review = await userRepo.createReview({
      ...body,
      userId,
      verifiedPurchase: true,
    });

    await userRepo.logActivity({
      userId,
      action: 'review.created',
      entityType: 'review',
      entityId: review._id.toString(),
      metadata: { productId: body.productId, rating: body.rating },
    });

    res.status(201).json({ data: review });
  } catch (error) {
    next(error);
  }
});
