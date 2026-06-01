import dotenv from 'dotenv';
import { pgPool } from '../db/postgres.js';
import { connectMongo, disconnectMongo } from '../db/mongodb.js';
import { User } from '../models/mongo/User.js';
import { Review } from '../models/mongo/Review.js';
import { ActivityLog } from '../models/mongo/ActivityLog.js';
import { createOrder } from '../repositories/orderRepository.js';
import { logActivity } from '../repositories/userRepository.js';
import { hashPassword } from '../utils/password.js';

dotenv.config();

const reset = process.argv.includes('--reset');

const products = [
  {
    sku: 'BOOT-NK-MRC-001',
    name: 'Nike Mercurial Vapor 15 FG',
    description: 'Lekkie korki wyścigowe na naturalną murawę. Cholewka Vaporposite+.',
    category: 'korki',
    price: 449.99,
    stock: 35,
    unit: 'para',
  },
  {
    sku: 'BOOT-AD-PRE-002',
    name: 'Adidas Predator Elite TF',
    description: 'Korki turfy z technologią Strikeprint — lepsza kontrola piłki.',
    category: 'korki',
    price: 399.99,
    stock: 42,
    unit: 'para',
  },
  {
    sku: 'BALL-NK-STR-003',
    name: 'Piłka Nike Strike League',
    description: 'Piłka treningowa rozmiar 5, wysoka trwałość i stabilny lot.',
    category: 'pilki',
    price: 89.99,
    stock: 120,
    unit: 'szt',
  },
  {
    sku: 'BALL-PM-FIN-004',
    name: 'Piłka Puma teamFINAL 1',
    description: 'Piłka meczowa FIFA Quality Pro, idealna na ligowe spotkania.',
    category: 'pilki',
    price: 129.99,
    stock: 80,
    unit: 'szt',
  },
  {
    sku: 'KIT-PL-HOM-005',
    name: 'Koszulka reprezentacji Polski 2024',
    description: 'Oficjalna koszulka domowa z oddychającej tkaniny AEROREADY.',
    category: 'stroje',
    price: 279.99,
    stock: 55,
    unit: 'szt',
  },
  {
    sku: 'KIT-AD-TIR-006',
    name: 'Spodenki treningowe Adidas Tiro',
    description: 'Klasyczne spodenki piłkarskie z kieszeniami bocznymi na trening.',
    category: 'stroje',
    price: 119.99,
    stock: 70,
    unit: 'szt',
  },
];

async function resetPostgres(): Promise<void> {
  await pgPool.query(
    'TRUNCATE payments, order_items, orders, products RESTART IDENTITY CASCADE'
  );
  console.log('PostgreSQL data cleared');
}

async function seedPostgres(): Promise<void> {
  const { rows } = await pgPool.query('SELECT COUNT(*)::int AS count FROM products');
  if (!reset && rows[0].count > 0) {
    console.log('PostgreSQL already seeded (use npm run seed:reset)');
    return;
  }

  if (reset) await resetPostgres();

  for (const p of products) {
    await pgPool.query(
      `INSERT INTO products (sku, name, description, category, price, stock, unit)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [p.sku, p.name, p.description, p.category, p.price, p.stock, p.unit]
    );
  }
  console.log(`Seeded ${products.length} products`);
}

async function seedMongo(): Promise<{ annaId: string; piotrId: string; adminId: string }> {
  await User.deleteMany({});
  await Review.deleteMany({});
  await ActivityLog.deleteMany({});

  const admin = await User.create({
    email: 'admin@boiskopro.pl',
    passwordHash: await hashPassword('admin123'),
    firstName: 'Admin',
    lastName: 'BoiskoPro',
    role: 'admin',
    preferences: { newsletter: false, favoriteCategories: [] },
  });

  const anna = await User.create({
    email: 'anna@example.com',
    passwordHash: await hashPassword('haslo123'),
    firstName: 'Anna',
    lastName: 'Kowalska',
    role: 'customer',
    phone: '+48 600 111 222',
    preferences: { newsletter: true, favoriteCategories: ['korki', 'pilki'] },
  });

  const piotr = await User.create({
    email: 'piotr@example.com',
    passwordHash: await hashPassword('haslo123'),
    firstName: 'Piotr',
    lastName: 'Nowak',
    role: 'customer',
    preferences: { newsletter: false, favoriteCategories: ['stroje', 'korki'] },
  });

  console.log('Seeded users (admin + 2 customers)');
  return {
    adminId: admin._id.toString(),
    annaId: anna._id.toString(),
    piotrId: piotr._id.toString(),
  };
}

async function seedOrdersAndReviews(annaId: string, piotrId: string): Promise<void> {
  const order1 = await createOrder({
    mongoUserId: annaId,
    items: [
      { productId: 1, quantity: 1 },
      { productId: 3, quantity: 2 },
    ],
    shippingAddress: {
      street: 'ul. Sportowa 12',
      city: 'Kraków',
      postalCode: '30-001',
      country: 'PL',
    },
    paymentMethod: 'blik',
  });

  await createOrder({
    mongoUserId: piotrId,
    items: [
      { productId: 2, quantity: 1 },
      { productId: 5, quantity: 1 },
    ],
    shippingAddress: {
      street: 'ul. Boiska 7',
      city: 'Warszawa',
      postalCode: '00-001',
      country: 'PL',
    },
    paymentMethod: 'card',
  });

  await Review.create([
    {
      productId: 1,
      userId: annaId,
      rating: 5,
      title: 'Świetna przyczepność!',
      comment: 'Na murawie trzymają się idealnie, lekkie i wygodne od pierwszego treningu.',
      verifiedPurchase: true,
    },
    {
      productId: 3,
      userId: piotrId,
      rating: 4,
      title: 'Dobra piłka na trening',
      comment: 'Równy lot i solidne wykonanie. Na trening klubowy w zupełności wystarcza.',
      verifiedPurchase: true,
    },
  ]);

  await logActivity({
    userId: annaId,
    action: 'order.created',
    entityType: 'order',
    entityId: String(order1.order.id),
    metadata: { orderNumber: order1.order.order_number },
  });

  console.log('Seeded orders and reviews');
}

async function main(): Promise<void> {
  console.log('\n--- Konta testowe ---');
  console.log('Admin:    admin@boiskopro.pl / admin123');
  console.log('Klient:   anna@example.com / haslo123');
  console.log('Klient:   piotr@example.com / haslo123\n');

  await connectMongo();
  await seedPostgres();
  const { annaId, piotrId } = await seedMongo();
  await seedOrdersAndReviews(annaId, piotrId);
  await pgPool.end();
  await disconnectMongo();
  console.log('Seed completed');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
