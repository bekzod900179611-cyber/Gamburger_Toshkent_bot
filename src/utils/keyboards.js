import config from '../config/default.js';
import { hasWebApp } from '../core/bot.js';

export const BUTTONS = {
  order: '🍽 Buyurtma berish',
  menu: '🍽 Menyu',
  myOrders: '📦 Buyurtmalarim',
  contact: '📞 Aloqa',
  sendPhone: '📱 Raqamni yuborish',
};

/** Pastki asosiy menyu (reply keyboard). */
export function mainMenu() {
  const first = hasWebApp()
    ? [{ text: BUTTONS.order, web_app: { url: config.bot.webAppUrl } }]
    : [{ text: BUTTONS.menu }];

  return {
    keyboard: [first, [{ text: BUTTONS.myOrders }, { text: BUTTONS.contact }]],
    resize_keyboard: true,
    is_persistent: true,
  };
}

/** Telefon raqamini so'rash tugmasi. */
export function contactRequest() {
  return {
    keyboard: [[{ text: BUTTONS.sendPhone, request_contact: true }]],
    resize_keyboard: true,
    one_time_keyboard: true,
  };
}

/** Xabar ostidagi "Mini App'ni ochish" tugmasi. */
export function openAppInline(text = BUTTONS.order) {
  if (!hasWebApp()) return undefined;
  return { inline_keyboard: [[{ text, web_app: { url: config.bot.webAppUrl } }]] };
}

/** Holat bo'yicha admin keyingi bosishi mumkin bo'lgan tugmalar. */
const NEXT_STEPS = {
  new: [
    { text: '✅ Qabul qilish', status: 'accepted' },
    { text: '❌ Bekor qilish', status: 'cancelled' },
  ],
  accepted: [
    { text: '👨‍🍳 Tayyorlanmoqda', status: 'cooking' },
    { text: '❌ Bekor qilish', status: 'cancelled' },
  ],
  cooking: [{ text: '🛵 Yo‘lga chiqdi', status: 'delivering' }],
  delivering: [{ text: '🎉 Yetkazildi', status: 'delivered' }],
  delivered: [],
  cancelled: [],
};

/** Admin chatidagi buyurtma xabari ostidagi tugmalar. */
export function adminOrderKeyboard(order) {
  const steps = NEXT_STEPS[order.status] || [];
  if (steps.length === 0) return { inline_keyboard: [] };

  return {
    inline_keyboard: [
      steps.map((step) => ({ text: step.text, callback_data: `order:${order.id}:${step.status}` })),
    ],
  };
}

/** Admin bosishi mumkin bo'lgan o'tishmi — eski tugmalarni qayta bosishdan himoya. */
export function canMoveTo(currentStatus, nextStatus) {
  return (NEXT_STEPS[currentStatus] || []).some((step) => step.status === nextStatus);
}

export default { BUTTONS, mainMenu, contactRequest, openAppInline, adminOrderKeyboard, canMoveTo };
