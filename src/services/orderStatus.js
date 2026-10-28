import config from '../config/default.js';
import bot, { sendMessageSafe, escapeHtml } from '../core/bot.js';
import UserModel from '../models/User.js';
import OrderModel from '../models/Order.js';
import { adminOrderKeyboard, canMoveTo } from '../utils/keyboards.js';
import { formatOrderForAdmin } from '../utils/format.js';
import logger from '../utils/logger.js';

/** Holat o'zgarganda mijozga boradigan matn. */
const USER_STATUS_TEXT = {
  accepted: 'qabul qilindi ✅ Tez orada tayyorlashni boshlaymiz.',
  cooking: 'tayyorlanmoqda 👨‍🍳',
  delivering: 'yo‘lga chiqdi 🛵 Kuryer tez orada yetib boradi.',
  delivered: 'yetkazildi 🎉 Yoqimli ishtaha!',
  cancelled: 'bekor qilindi ❌ Savollar bo‘lsa, biz bilan bog‘laning.',
};

export class StatusError extends Error {}

/**
 * Buyurtmani keyingi holatga o'tkazadi: bazani yangilaydi, admin guruhidagi xabarni
 * yangi tugmalar bilan qayta yozadi va mijozga xabar yuboradi.
 * Admin guruhidagi tugma ham, admin panel ham shu funksiyadan foydalanadi.
 */
export async function changeOrderStatus(orderId, nextStatus, adminName) {
  const order = await OrderModel.findById(orderId);
  if (!order) throw new StatusError('Buyurtma topilmadi');
  if (!canMoveTo(order.status, nextStatus)) throw new StatusError('Bu holatga o‘tkazib bo‘lmaydi');

  let updated = await OrderModel.updateStatus(order.id, nextStatus);
  if (nextStatus === 'delivered' && updated.paymentMethod === 'cash') {
    updated = await OrderModel.updatePaymentStatus(updated.id, 'paid');
  }

  const user = await UserModel.findByTelegramId(updated.userId);

  if (config.bot.adminChatId && updated.adminMessageId) {
    await bot.telegram
      .editMessageText(
        config.bot.adminChatId,
        updated.adminMessageId,
        undefined,
        `${formatOrderForAdmin(updated, user)}\n\n<i>Oxirgi o‘zgarish: ${escapeHtml(adminName)}</i>`,
        {
          parse_mode: 'HTML',
          reply_markup: adminOrderKeyboard(updated),
          link_preview_options: { is_disabled: true },
        },
      )
      .catch((error) => logger.warn(`Admin xabari yangilanmadi: ${error.message}`));
  }

  await sendMessageSafe(updated.userId, `📦 <b>Buyurtma #${updated.id}</b> ${USER_STATUS_TEXT[nextStatus]}`);

  return updated;
}

export default changeOrderStatus;
