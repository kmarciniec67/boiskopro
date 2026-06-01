import type { PoolClient } from 'pg';
import { pgPool } from '../db/postgres.js';
import type { Product } from '../types/postgres.js';

export async function findAllProducts(activeOnly = true): Promise<Product[]> {
  const query = activeOnly
    ? 'SELECT * FROM products WHERE is_active = TRUE ORDER BY category, name'
    : 'SELECT * FROM products ORDER BY category, name';
  const { rows } = await pgPool.query<Product>(query);
  return rows;
}

export async function findProductById(
  id: number,
  client: PoolClient | typeof pgPool = pgPool
): Promise<Product | null> {
  const { rows } = await client.query<Product>('SELECT * FROM products WHERE id = $1', [id]);
  return rows[0] ?? null;
}

export async function findProductsByCategory(category: string): Promise<Product[]> {
  const { rows } = await pgPool.query<Product>(
    'SELECT * FROM products WHERE category = $1 AND is_active = TRUE ORDER BY name',
    [category]
  );
  return rows;
}

export async function decrementStock(
  productId: number,
  quantity: number,
  client: PoolClient | typeof pgPool = pgPool
): Promise<void> {
  const { rowCount } = await client.query(
    'UPDATE products SET stock = stock - $1, updated_at = NOW() WHERE id = $2 AND stock >= $1',
    [quantity, productId]
  );
  if (rowCount === 0) {
    throw new Error(`Insufficient stock for product ${productId}`);
  }
}

export async function createProduct(data: {
  sku: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  stock: number;
  unit: string;
  imageUrl?: string | null;
}): Promise<Product> {
  const { rows } = await pgPool.query<Product>(
    `INSERT INTO products (sku, name, description, category, price, stock, unit, image_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      data.sku,
      data.name,
      data.description ?? null,
      data.category,
      data.price,
      data.stock,
      data.unit,
      data.imageUrl ?? null,
    ]
  );
  return rows[0];
}

export async function updateProduct(
  id: number,
  data: {
    sku?: string;
    name?: string;
    description?: string | null;
    category?: string;
    price?: number;
    stock?: number;
    unit?: string;
    imageUrl?: string | null;
    isActive?: boolean;
  }
): Promise<Product | null> {
  const existing = await findProductById(id);
  if (!existing) return null;

  const { rows } = await pgPool.query<Product>(
    `UPDATE products SET
       sku = $2,
       name = $3,
       description = $4,
       category = $5,
       price = $6,
       stock = $7,
       unit = $8,
       image_url = $9,
       is_active = $10,
       updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [
      id,
      data.sku ?? existing.sku,
      data.name ?? existing.name,
      data.description !== undefined ? data.description : existing.description,
      data.category ?? existing.category,
      data.price ?? Number(existing.price),
      data.stock ?? existing.stock,
      data.unit ?? existing.unit,
      data.imageUrl !== undefined ? data.imageUrl : existing.image_url,
      data.isActive ?? existing.is_active,
    ]
  );
  return rows[0] ?? null;
}

export async function isProductInOrders(productId: number): Promise<boolean> {
  const { rows } = await pgPool.query<{ count: string }>(
    'SELECT COUNT(*)::int AS count FROM order_items WHERE product_id = $1',
    [productId]
  );
  return Number(rows[0].count) > 0;
}

export async function deleteProduct(id: number): Promise<boolean> {
  const existing = await findProductById(id);
  if (!existing) return false;

  if (await isProductInOrders(id)) {
    throw new Error('Nie można usunąć produktu — występuje w zamówieniach');
  }

  const { rowCount } = await pgPool.query('DELETE FROM products WHERE id = $1', [id]);
  return (rowCount ?? 0) > 0;
}
