import crypto from 'node:crypto';
import config from '../config/default.js';
import UserModel from '../models/User.js';
import logger from '../utils/logger.js';

/** API xatosi — status kodi bilan. */
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function computeHash(params, botToken) {
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  return crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
}

function safeEqualHex(a, b) {
  const left = Buffer.from(a, 'hex');
  const right = Buffer.from(b, 'hex');
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

/**
 * Telegram Mini App initData imzosini tekshiradi.
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 * To'g'ri bo'lsa Telegram foydalanuvchisini, aks holda null qaytaradi.
 */
export function verifyInitData(initData, botToken, maxAgeSeconds) {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash || !/^[0-9a-f]{64}$/i.test(hash)) return null;
    params.delete('hash');

    // Yangi Telegram klientlari `signature` maydonini ham yuboradi. Uni hisobga olib ham,
    // olmasdan ham tekshiramiz — ikkala holatda ham imzo bot tokeni bilan qilingan.
    let valid = safeEqualHex(computeHash(params, botToken), hash);
    if (!valid && params.has('signature')) {
      const withoutSignature = new URLSearchParams(params);
      withoutSignature.delete('signature');
      valid = safeEqualHex(computeHash(withoutSignature, botToken), hash);
    }
    if (!valid) return null;

    const authDate = Number(params.get('auth_date'));
    const age = Math.floor(Date.now() / 1000) - authDate;
    if (!authDate || age > maxAgeSeconds) return null;

    const user = JSON.parse(params.get('user') || 'null');
    return user?.id ? user : null;
  } catch {
    return null;
  }
}

function readInitData(req) {
  const authorization = req.get('authorization') || '';
  if (authorization.toLowerCase().startsWith('tma ')) return authorization.slice(4).trim();
  return req.get('x-telegram-init-data') || '';
}

/**
 * Mini App so'rovlarini himoyalaydi: initData imzosini tekshiradi,
 * foydalanuvchini bazadan topadi (yo'q bo'lsa yaratadi) va req.user ga qo'yadi.
 */
export async function telegramAuth(req, res, next) {
  try {
    const initData = readInitData(req);
    let tgUser = initData
      ? verifyInitData(initData, config.bot.token, config.auth.initDataMaxAge)
      : null;

    // Dasturchi rejimi: Mini App'ni Telegramsiz, oddiy brauzerda sinash uchun
    if (!tgUser && config.dev.allowDevAuth) {
      tgUser = { id: config.dev.telegramId, first_name: 'Dasturchi', username: 'dev' };
    }

    if (!tgUser) {
      if (initData) logger.warn('initData imzosi noto‘g‘ri yoki eskirgan');
      throw new HttpError(401, 'Avtorizatsiya muvaffaqiyatsiz. Mini App’ni bot orqali oching.');
    }

    let user = await UserModel.findByTelegramId(tgUser.id);
    const changed =
      !user ||
      user.firstName !== (tgUser.first_name || '') ||
      user.username !== (tgUser.username || null);

    if (changed) user = await UserModel.upsertFromTelegram(tgUser);

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

/** Topilmagan yo'llar uchun. */
export function notFound(req, res) {
  res.status(404).json({ ok: false, error: `Yo‘l topilmadi: ${req.method} ${req.originalUrl}` });
}

/** Umumiy xatolarni ushlovchi middleware. */
export function errorHandler(error, req, res, _next) {
  const status = error.status || (error.type === 'entity.parse.failed' ? 400 : 500);

  if (status >= 500) logger.error(`API xatosi: ${req.method} ${req.originalUrl}`, error);

  res.status(status).json({
    ok: false,
    error: status >= 500 ? 'Serverda kutilmagan xatolik yuz berdi' : error.message,
  });
}

export default { telegramAuth, notFound, errorHandler, HttpError };
