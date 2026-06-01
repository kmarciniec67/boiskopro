import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { connectPostgres } from './db/postgres.js';
import { connectMongo } from './db/mongodb.js';
import { config } from './config/index.js';
import { productsRouter } from './routes/products.js';
import { authRouter } from './routes/auth.js';
import { ordersRouter } from './routes/orders.js';
import { reviewsRouter } from './routes/reviews.js';
import { adminRouter } from './routes/admin.js';
import { errorHandler } from './middleware/errorHandler.js';

const clientDist = path.join(process.cwd(), 'client', 'dist');

const app = express();

app.use(cors());
app.use(express.json());

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/admin', adminRouter);

if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^\/(?!api)(?!uploads).*/, (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use(errorHandler);

async function main(): Promise<void> {
  await connectPostgres();
  await connectMongo();

  app.listen(config.port, () => {
    console.log(`BoiskoPro API: http://localhost:${config.port}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
