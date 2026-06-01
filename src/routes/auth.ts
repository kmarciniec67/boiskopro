import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { User } from '../models/mongo/User.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { signToken } from '../utils/authToken.js';
import { toPublicUser } from '../utils/userDto.js';
import { requireAuth } from '../middleware/auth.js';
import { findUserById } from '../repositories/userRepository.js';

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
});

authRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = loginSchema.parse(req.body);
    const user = await User.findOne({ email: body.email.toLowerCase() });
    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      res.status(401).json({ error: 'Nieprawidłowy email lub hasło' });
      return;
    }

    const token = signToken({ userId: user._id.toString(), role: user.role });
    res.json({ data: { token, user: toPublicUser(user) } });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = registerSchema.parse(req.body);
    const exists = await User.findOne({ email: body.email.toLowerCase() });
    if (exists) {
      res.status(409).json({ error: 'Ten email jest już zarejestrowany' });
      return;
    }

    const user = await User.create({
      email: body.email,
      passwordHash: await hashPassword(body.password),
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
      role: 'customer',
    });

    const token = signToken({ userId: user._id.toString(), role: user.role });
    res.status(201).json({ data: { token, user: toPublicUser(user) } });
  } catch (error) {
    next(error);
  }
});

authRouter.get('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await findUserById(req.auth!.userId);
    if (!user) {
      res.status(404).json({ error: 'Użytkownik nie istnieje' });
      return;
    }
    res.json({ data: toPublicUser(user) });
  } catch (error) {
    next(error);
  }
});
