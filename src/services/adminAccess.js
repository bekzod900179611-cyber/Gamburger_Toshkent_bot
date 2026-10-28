import config from '../config/default.js';
import bot from '../core/bot.js';
import logger from '../utils/logger.js';

// Guruh a'zoligini har so'rovda Telegramdan so'ramaslik uchun qisqa kesh
const CACHE_MS = 5 * 60 * 1000;
const cache = new Map();

/**
 * Admin kim: ADMIN_IDS ro'yxatidagilar yoki admin guruhi (ADMIN_CHAT_ID) a'zolari.
 * Dasturchi rejimida (ALLOW_DEV_AUTH) sinov foydalanuvchisi ham admin.
 */
export async function isAdmin(telegramId) {
  const id = Number(telegramId);
  if (config.admin.ids.includes(id)) return true;
  if (config.dev.allowDevAuth && id === config.dev.telegramId) return true;
  if (!config.bot.adminChatId) return false;

  const cached = cache.get(id);
  if (cached && cached.until > Date.now()) return cached.value;

  let value = false;
  try {
    const member = await bot.telegram.getChatMember(config.bot.adminChatId, id);
    value = ['creator', 'administrator', 'member'].includes(member.status);
  } catch (error) {
    // Bot guruhda bo'lmasa yoki foydalanuvchi topilmasa — admin emas
    logger.warn(`Admin guruhi a'zoligi tekshirilmadi (${id}): ${error.message}`);
  }

  cache.set(id, { value, until: Date.now() + CACHE_MS });
  return value;
}

export default isAdmin;
