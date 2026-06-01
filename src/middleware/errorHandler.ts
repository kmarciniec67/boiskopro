import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Validation failed', details: err.flatten() });
    return;
  }

  if (err instanceof Error) {
    const status = err.message.includes('stock') || err.message.includes('not found') ? 400 : 500;
    res.status(status).json({ error: err.message });
    return;
  }

  res.status(500).json({ error: 'Internal server error' });
}
