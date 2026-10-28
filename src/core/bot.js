import { Telegraf } from 'telegraf';
import config from '../config/default.js';
import logger from '../utils/logger.js';

if (!config.bot.token) {
  throw new Error('BOT_TOKEN topilmadi. .env faylini tekshiring.');
}

export const bot = new Telegraf(config.bot.token);

/** Mini App tugmasi faqat HTTPS manzil bilan ishlaydi (Telegram talabi). */
export function hasWebApp() {
  return config.bot.webAppUrl.startsWith('https://');
}

/** Foydalanuvchi kiritgan matnni HTML xabarga xavfsiz qo'yish uchun. */
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Xabar yuboradi; xato bo'lsa dastur to'xtamaydi, null qaytaradi. */
export async function sendMessageSafe(chatId, text, extra = {}) {
  if (!chatId) return null;

  try {
    return await bot.telegram.sendMessage(chatId, text, { parse_mode: 'HTML', ...extra });
  } catch (error) {
    logger.warn(`Xabar yuborilmadi (${chatId}): ${error.message}`);
    return null;
  }
}

/** Admin chatiga xabar yuboradi (ADMIN_CHAT_ID sozlanmagan bo'lsa jim o'tadi). */
export async function notifyAdmin(text, extra = {}) {
  if (!config.bot.adminChatId) {
    logger.warn('ADMIN_CHAT_ID sozlanmagan — admin xabari yuborilmadi');
    return null;
  }
  return sendMessageSafe(config.bot.adminChatId, text, extra);
}

export default bot;
