import config from '../config/default.js';
import { hasWebApp, escapeHtml } from '../core/bot.js';
import UserModel from '../models/User.js';
import { STATUS_LABELS } from '../models/Order.js';
import { mainMenu, contactRequest, openAppInline } from '../utils/keyboards.js';
import { formatOrderShort } from '../utils/format.js';
import { changeOrderStatus, StatusError } from '../services/orderStatus.js';
import { isAdmin } from '../services/adminAccess.js';
import OrderModel from '../models/Order.js';

const NO_WEBAPP_TEXT =
  '⚠️ Mini App hali sozlanmagan. Administrator WEBAPP_URL ga HTTPS manzil yozishi kerak.';

function isAdminChat(ctx) {
  return Boolean(config.bot.adminChatId) && String(ctx.chat?.id) === String(config.bot.adminChatId);
}

export const startController = {
  /** /start */
  async start(ctx) {
    const user = await UserModel.upsertFromTelegram(ctx.from);
    const name = escapeHtml(user.firstName || 'mehmon');

    await ctx.reply(
      `Assalomu alaykum, <b>${name}</b>! 👋\n\n` +
        `🍔 <b>${escapeHtml(config.restaurant.name)}</b> — burgerlar, lavash, hot-dog va issiq fri ` +
        `20–30 daqiqada eshigingizgacha.\n\n` +
        `Buyurtma berish uchun pastdagi tugmani bosing 👇`,
      { parse_mode: 'HTML', reply_markup: mainMenu() },
    );

    if (!hasWebApp()) await ctx.reply(NO_WEBAPP_TEXT);

    if (!user.phone) {
      await ctx.reply('📱 Tezroq buyurtma berish uchun telefon raqamingizni yuboring:', {
        reply_markup: contactRequest(),
      });
    }
  },

  /** Mijoz kontakt yuborganda */
  async saveContact(ctx) {
    const contact = ctx.message.contact;

    // Faqat o'zining raqamini qabul qilamiz (boshqa odamning kontaktini emas)
    if (contact.user_id && contact.user_id !== ctx.from.id) {
      return ctx.reply('Iltimos, «📱 Raqamni yuborish» tugmasi orqali o‘zingizning raqamingizni yuboring.', {
        reply_markup: contactRequest(),
      });
    }

    await UserModel.upsertFromTelegram(ctx.from);
    await UserModel.setPhone(ctx.from.id, contact.phone_number);

    await ctx.reply('✅ Raqamingiz saqlandi. Endi buyurtma berishingiz mumkin!', {
      reply_markup: mainMenu(),
    });
  },

  /** /menu yoki «🍽 Menyu» */
  async menu(ctx) {
    if (!hasWebApp()) return ctx.reply(NO_WEBAPP_TEXT, { reply_markup: mainMenu() });

    await ctx.reply('Menyuni ochish uchun tugmani bosing 👇', {
      reply_markup: openAppInline('🍽 Menyuni ochish'),
    });
  },

  /** /orders yoki «📦 Buyurtmalarim» */
  async myOrders(ctx) {
    const orders = await OrderModel.listByUser(ctx.from.id, 5);

    if (orders.length === 0) {
      return ctx.reply('Sizda hali buyurtmalar yo‘q 🍽\nBirinchi buyurtmangizni bering!', {
        reply_markup: openAppInline(),
      });
    }

    await ctx.reply(`📦 <b>Oxirgi buyurtmalaringiz</b>\n\n${orders.map(formatOrderShort).join('\n\n')}`, {
      parse_mode: 'HTML',
    });
  },

  /** /help yoki «📞 Aloqa» */
  async contact(ctx) {
    const { name, phone, address } = config.restaurant;
    const lines = [`📞 <b>${escapeHtml(name)}</b>`, ''];
    if (phone) lines.push(`Telefon: ${escapeHtml(phone)}`);
    if (address) lines.push(`Manzil: ${escapeHtml(address)}`);
    lines.push('Ish vaqti: 09:00 — 23:00');

    await ctx.reply(lines.join('\n'), { parse_mode: 'HTML' });
  },

  /** /id — ADMIN_CHAT_ID ni bilish uchun (guruhda yoki shaxsiy chatda) */
  async chatId(ctx) {
    await ctx.reply(`Bu chat ID si: <code>${ctx.chat.id}</code>`, { parse_mode: 'HTML' });
  },

  /** Admin chatidagi tugmalar: order:<id>:<status> */
  async adminStatus(ctx) {
    if (!isAdminChat(ctx)) return ctx.answerCbQuery('Bu amal faqat admin uchun', { show_alert: true });

    const [, orderId, nextStatus] = ctx.match;
    const admin = ctx.from.first_name || ctx.from.username || 'admin';

    try {
      await changeOrderStatus(orderId, nextStatus, admin);
    } catch (error) {
      if (!(error instanceof StatusError)) throw error;
      const order = await OrderModel.findById(orderId);
      const text = order ? `Buyurtma allaqachon: ${STATUS_LABELS[order.status]}` : error.message;
      return ctx.answerCbQuery(text, { show_alert: true });
    }

    await ctx.answerCbQuery(STATUS_LABELS[nextStatus]);
  },

  /** /admin — admin panelni ochish tugmasi (faqat adminlarga) */
  async admin(ctx) {
    if (!(await isAdmin(ctx.from.id))) {
      return ctx.reply(
        `⛔ Admin panel faqat adminlar uchun.\n\nSizning ID: <code>${ctx.from.id}</code> — ` +
          'uni .env dagi ADMIN_IDS ga yozing yoki admin guruhiga qo‘shiling.',
        { parse_mode: 'HTML' },
      );
    }
    if (!hasWebApp()) return ctx.reply(NO_WEBAPP_TEXT);

    // Web App tugmasi faqat shaxsiy chatda ishlaydi
    if (ctx.chat.type !== 'private') {
      return ctx.reply('🔐 Admin panelni ochish uchun botga shaxsiy chatda /admin deb yozing.');
    }

    await ctx.reply('🔐 <b>Admin panel</b>\nMenyu, narxlar, stop-list va buyurtmalar — hammasi shu yerda.', {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[{ text: '⚙️ Admin panelni ochish', web_app: { url: `${config.bot.webAppUrl}/admin` } }]],
      },
    });
  },

  /** Boshqa har qanday matn */
  async fallback(ctx) {
    if (ctx.chat.type !== 'private') return;
    await ctx.reply('Buyurtma berish uchun pastdagi tugmalardan foydalaning 👇', {
      reply_markup: mainMenu(),
    });
  },
};

export default startController;
