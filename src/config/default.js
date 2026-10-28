import 'dotenv/config';
import crypto from 'node:crypto';

/**
 * Telegram webhook kaliti faqat A-Z a-z 0-9 _ - bo'lishi mumkin, Render esa generateValue bilan
 * "+/=" li qiymat yaratadi. Shuning uchun har qanday qiymatdan xavfsiz hex kalit hosil qilamiz.
 */
const webhookSecret = (raw) => {
  const value = String(raw || '').trim();
  if (!value) return '';
  return /^[A-Za-z0-9_-]{1,256}$/.test(value) ? value : crypto.createHash('sha256').update(value).digest('hex');
};

const toBool = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  return String(value).trim().toLowerCase() === 'true';
};

const toNumber = (value, fallback) => {
  const number = Number(value);
  return Number.isFinite(number) && value !== '' && value !== undefined ? number : fallback;
};

const toList = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const env = process.env.NODE_ENV || 'development';
const isProd = env === 'production';

// Render o'zining HTTPS manzilini shu o'zgaruvchida beradi — qo'lda yozish shart emas
const hostedUrl = String(process.env.RENDER_EXTERNAL_URL || '').trim().replace(/\/+$/, '');

const config = {
  env,
  isProd,
  port: toNumber(process.env.PORT, 3000),

  bot: {
    token: process.env.BOT_TOKEN || '',
    adminChatId: process.env.ADMIN_CHAT_ID || '',
    webAppUrl: String(process.env.WEBAPP_URL || hostedUrl).trim().replace(/\/+$/, ''),
    // Bo'sh bo'lsa bot polling rejimida ishlaydi (lokal). To'ldirilsa — webhook: <WEBHOOK_URL>/api/telegram
    webhookUrl: String(process.env.WEBHOOK_URL || hostedUrl).trim().replace(/\/+$/, ''),
    webhookSecret: webhookSecret(process.env.TELEGRAM_WEBHOOK_SECRET),
  },

  database: {
    url: process.env.DATABASE_URL || '',
    // Neon pooler ulanishlari cheklangan — kichik pul yetarli
    poolSize: toNumber(process.env.DB_POOL_SIZE, 10),
  },

  cors: {
    origins: toList(process.env.CORS_ORIGINS || 'http://localhost:3001'),
  },

  delivery: {
    fee: toNumber(process.env.DELIVERY_FEE, 10000),
    // 0 bo'lsa yetkazib berish har doim pullik
    freeFrom: toNumber(process.env.FREE_DELIVERY_FROM, 200000),
  },

  payments: {
    methods: ['cash', 'click', 'payme', 'telegram_stars'],
    clickToken: process.env.CLICK_PROVIDER_TOKEN || '',
    paymeToken: process.env.PAYME_PROVIDER_TOKEN || '',
    starsRate: toNumber(process.env.STARS_RATE, 200),
  },

  restaurant: {
    name: process.env.RESTAURANT_NAME || 'Gamburger',
    phone: process.env.RESTAURANT_PHONE || '',
    address: process.env.RESTAURANT_ADDRESS || '',
  },

  admin: {
    // Admin panelga kira oladigan Telegram ID lar (vergul bilan). Botga /id yozib bilib olinadi.
    // Bundan tashqari ADMIN_CHAT_ID guruhining a'zolari ham admin hisoblanadi.
    ids: toList(process.env.ADMIN_IDS).map(Number).filter(Number.isFinite),
  },

  auth: {
    // Telegram initData shuncha soniyadan eski bo'lsa qabul qilinmaydi
    initDataMaxAge: toNumber(process.env.INIT_DATA_MAX_AGE, 24 * 60 * 60),
  },

  dev: {
    // Ishlab chiqarishda doim o'chiq — aks holda istalgan kishi imzosiz API'ga kira oladi
    allowDevAuth: !isProd && toBool(process.env.ALLOW_DEV_AUTH, false),
    telegramId: toNumber(process.env.DEV_TELEGRAM_ID, 1),
  },
};

export function deliveryFeeFor(subtotal) {
  const { fee, freeFrom } = config.delivery;
  return freeFrom > 0 && subtotal >= freeFrom ? 0 : fee;
}

export default config;
