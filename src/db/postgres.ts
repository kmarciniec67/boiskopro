import pg from 'pg';
import { config } from '../config/index.js';

const { Pool } = pg;

export const pgPool = new Pool({
  host: config.postgres.host,
  port: config.postgres.port,
  user: config.postgres.user,
  password: config.postgres.password,
  database: config.postgres.database,
});

async function runMigrations(client: pg.PoolClient): Promise<void> {
  await client.query(`
    DO $$ BEGIN
      ALTER TABLE products ADD COLUMN image_url VARCHAR(500);
    EXCEPTION
      WHEN duplicate_column THEN NULL;
    END $$;
  `);
}

export async function connectPostgres(): Promise<void> {
  const client = await pgPool.connect();
  try {
    await client.query('SELECT 1');
    await runMigrations(client);
    console.log('PostgreSQL connected');
  } finally {
    client.release();
  }
}

export async function disconnectPostgres(): Promise<void> {
  await pgPool.end();
}
