import pg from 'pg';
import config from '../config/default.js';
import logger from '../utils/logger.js';

if (!config.database.url) {
  throw new Error('DATABASE_URL topilmadi. .env faylini tekshiring.');
}

// BIGINT (telegram_id, COUNT, SUM) JS'ga string bo'lib kelmasligi uchun.
// Telegram ID'lari Number.MAX_SAFE_INTEGER dan ancha kichik.
pg.types.setTypeParser(pg.types.builtins.INT8, (value) => Number(value));

export const pool = new pg.Pool({
  connectionString: config.database.url,
  max: config.database.poolSize,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 15_000,
});

pool.on('error', (error) => {
  // Neon bo'sh ulanishlarni yopib qo'yishi mumkin — dastur yiqilmasligi kerak
  logger.error('PostgreSQL pool xatosi', error);
});

export function query(text, params = []) {
  return pool.query(text, params);
}

/** Bir nechta so'rovni bitta tranzaksiyada bajaradi. */
export async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    telegram_id    BIGINT PRIMARY KEY,
    first_name     TEXT NOT NULL DEFAULT '',
    last_name      TEXT,
    username       TEXT,
    phone          TEXT,
    language_code  TEXT,
    onboarded      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS products (
    id           SERIAL PRIMARY KEY,
    slug         TEXT NOT NULL UNIQUE,
    name         TEXT NOT NULL,
    description  TEXT NOT NULL DEFAULT '',
    ingredients  TEXT[] NOT NULL DEFAULT '{}',
    image_url    TEXT NOT NULL DEFAULT '',
    old_price    INTEGER NOT NULL DEFAULT 0 CHECK (old_price >= 0),
    new_price    INTEGER NOT NULL CHECK (new_price > 0),
    category     TEXT NOT NULL,
    is_popular   BOOLEAN NOT NULL DEFAULT FALSE,
    is_bump      BOOLEAN NOT NULL DEFAULT FALSE,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order   INTEGER NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS orders (
    id                SERIAL PRIMARY KEY,
    user_id           BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
    items             JSONB NOT NULL,
    subtotal          INTEGER NOT NULL,
    delivery_fee      INTEGER NOT NULL DEFAULT 0,
    total             INTEGER NOT NULL,
    customer_name     TEXT NOT NULL,
    phone             TEXT NOT NULL,
    address           TEXT NOT NULL,
    latitude          DOUBLE PRECISION,
    longitude         DOUBLE PRECISION,
    comment           TEXT,
    payment_method    TEXT NOT NULL
                      CHECK (payment_method IN ('cash', 'click', 'payme', 'telegram_stars')),
    payment_status    TEXT NOT NULL DEFAULT 'pending'
                      CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    status            TEXT NOT NULL DEFAULT 'new'
                      CHECK (status IN ('new', 'accepted', 'cooking', 'delivering', 'delivered', 'cancelled')),
    admin_message_id  BIGINT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- Telegram to'lov identifikatori (Stars qaytarish uchun kerak)
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_charge_id TEXT;

  -- Admin paneldan yuklangan taom rasmlari (Render diski vaqtinchalik — shuning uchun bazada)
  CREATE TABLE IF NOT EXISTS product_images (
    id          SERIAL PRIMARY KEY,
    mime        TEXT NOT NULL,
    data        BYTEA NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS orders_user_id_idx    ON orders (user_id);
  CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at DESC);
  CREATE INDEX IF NOT EXISTS products_category_idx ON products (category) WHERE is_active;
`;

/** Jadvallarni yaratadi (mavjud bo'lsa tegmaydi). */
export async function initDatabase() {
  await query(SCHEMA);
  logger.info('PostgreSQL jadvallari tayyor');
}

export async function connectDatabase() {
  const { rows } = await query('SELECT NOW() AS now');
  logger.info(`PostgreSQL (Neon) bazasiga ulanildi — ${rows[0].now.toISOString()}`);
}

export async function disconnectDatabase() {
  await pool.end();
  logger.info('PostgreSQL ulanishi yopildi');
}

export default { pool, query, transaction, initDatabase, connectDatabase, disconnectDatabase };
