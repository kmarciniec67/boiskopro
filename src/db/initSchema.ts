import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import mongoose from 'mongoose';

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

async function ensurePostgresDatabase(): Promise<void> {
  const host = process.env.POSTGRES_HOST ?? 'localhost';
  const port = Number(process.env.POSTGRES_PORT ?? 5432);
  const user = process.env.POSTGRES_ADMIN_USER ?? process.env.POSTGRES_USER ?? 'postgres';
  const password = process.env.POSTGRES_ADMIN_PASSWORD ?? process.env.POSTGRES_PASSWORD ?? '';
  const database = required('POSTGRES_DB');

  const adminPool = new pg.Pool({
    host,
    port,
    user,
    password,
    database: 'postgres',
  });

  try {
    const exists = await adminPool.query('SELECT 1 FROM pg_database WHERE datname = $1', [database]);
    if (exists.rowCount === 0) {
      await adminPool.query(`CREATE DATABASE "${database}"`);
      console.log(`Created PostgreSQL database: ${database}`);
    } else {
      console.log(`PostgreSQL database already exists: ${database}`);
    }
  } finally {
    await adminPool.end();
  }

  const appPool = new pg.Pool({
    host,
    port,
    user: required('POSTGRES_USER'),
    password: process.env.POSTGRES_PASSWORD ?? '',
    database,
  });

  try {
    const sqlPath = path.join(process.cwd(), 'db', 'postgres', 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await appPool.query(sql);
    console.log('PostgreSQL schema ready');
  } finally {
    await appPool.end();
  }
}

async function ensureMongoIndexes(): Promise<void> {
  const uri = required('MONGODB_URI');
  await mongoose.connect(uri);

  const db = mongoose.connection.db;
  if (!db) throw new Error('MongoDB connection failed');

  const collections = ['users', 'reviews', 'activity_logs'];
  for (const name of collections) {
    const exists = await db.listCollections({ name }).hasNext();
    if (!exists) {
      await db.createCollection(name);
      console.log(`Created MongoDB collection: ${name}`);
    }
  }

  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('reviews').createIndex({ productId: 1 });
  await db.collection('reviews').createIndex({ userId: 1 });
  await db.collection('reviews').createIndex({ productId: 1, userId: 1 }, { unique: true });
  await db.collection('activity_logs').createIndex({ createdAt: -1 });
  await db.collection('activity_logs').createIndex({ userId: 1 });

  console.log('MongoDB indexes ready');
  await mongoose.disconnect();
}

async function main(): Promise<void> {
  console.log('Initializing databases (no Docker)...');
  await ensurePostgresDatabase();
  await ensureMongoIndexes();
  console.log('Database init completed');
}

main().catch((err) => {
  console.error('Database init failed:', err.message);
  process.exit(1);
});
