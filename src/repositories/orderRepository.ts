import { pgPool } from '../db/postgres.js';
import type { CreateOrderInput, Order, OrderItem, Payment } from '../types/postgres.js';
import { findProductById, decrementStock } from './productRepository.js';

function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 9000 + 1000);
  return `BP-${date}-${random}`;
}

export async function findAllOrders(): Promise<Order[]> {
  const { rows } = await pgPool.query<Order>(
    'SELECT * FROM orders ORDER BY created_at DESC'
  );
  return rows;
}

export async function findOrdersByUserId(mongoUserId: string): Promise<Order[]> {
  const { rows } = await pgPool.query<Order>(
    'SELECT * FROM orders WHERE mongo_user_id = $1 ORDER BY created_at DESC',
    [mongoUserId]
  );
  return rows;
}

export async function findOrderById(id: number): Promise<Order | null> {
  const { rows } = await pgPool.query<Order>('SELECT * FROM orders WHERE id = $1', [id]);
  return rows[0] ?? null;
}

export async function updateOrderStatus(
  id: number,
  status: Order['status']
): Promise<Order | null> {
  const { rows } = await pgPool.query<Order>(
    `UPDATE orders SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id, status]
  );
  return rows[0] ?? null;
}

export async function findOrderItems(orderId: number): Promise<OrderItem[]> {
  const { rows } = await pgPool.query<OrderItem>(
    'SELECT * FROM order_items WHERE order_id = $1',
    [orderId]
  );
  return rows;
}

export async function createOrder(input: CreateOrderInput): Promise<{
  order: Order;
  items: OrderItem[];
  payment: Payment;
}> {
  const client = await pgPool.connect();

  try {
    await client.query('BEGIN');

    let totalAmount = 0;
    const lineItems: { productId: number; quantity: number; unitPrice: number; subtotal: number }[] = [];

    for (const item of input.items) {
      const product = await findProductById(item.productId, client);
      if (!product || !product.is_active) {
        throw new Error(`Product ${item.productId} not found or inactive`);
      }
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      const unitPrice = Number(product.price);
      const subtotal = unitPrice * item.quantity;
      totalAmount += subtotal;
      lineItems.push({ productId: item.productId, quantity: item.quantity, unitPrice, subtotal });
    }

    const orderResult = await client.query<Order>(
      `INSERT INTO orders (order_number, mongo_user_id, status, total_amount, shipping_address)
       VALUES ($1, $2, 'pending', $3, $4)
       RETURNING *`,
      [generateOrderNumber(), input.mongoUserId, totalAmount, JSON.stringify(input.shippingAddress)]
    );
    const order = orderResult.rows[0];

    const items: OrderItem[] = [];
    for (const line of lineItems) {
      await decrementStock(line.productId, line.quantity, client);
      const itemResult = await client.query<OrderItem>(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [order.id, line.productId, line.quantity, line.unitPrice, line.subtotal]
      );
      items.push(itemResult.rows[0]);
    }

    const paymentResult = await client.query<Payment>(
      `INSERT INTO payments (order_id, method, status, amount, paid_at)
       VALUES ($1, $2, 'completed', $3, NOW())
       RETURNING *`,
      [order.id, input.paymentMethod, totalAmount]
    );

    await client.query(`UPDATE orders SET status = 'confirmed', updated_at = NOW() WHERE id = $1`, [
      order.id,
    ]);
    order.status = 'confirmed';

    await client.query('COMMIT');

    return { order, items, payment: paymentResult.rows[0] };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
