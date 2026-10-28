import config, { deliveryFeeFor } from '../config/default.js';
import bot, { notifyAdmin, sendMessageSafe } from '../core/bot.js';
import ProductModel from '../models/Product.js';
import OrderModel, { PAYMENT_METHODS } from '../models/Order.js';
import UserModel from '../models/User.js';
import { HttpError } from '../middlewares/auth.middleware.js';
import { adminOrderKeyboard } from '../utils/keyboards.js';
import { formatOrderForAdmin, formatOrderForUser } from '../utils/format.js';
import logger from '../utils/logger.js';

const MAX_LINES = 30;
const MAX_QUANTITY = 50;

/** Hozir qaysi to'lov usullari ishlaydi (provayder tokeni bor-yo'qligiga qarab). */
export function availablePaymentMethods() {
  return PAYMENT_METHODS.filter((method) => {
    if (method === 'click') return Boolean(config.payments.clickToken);
    if (method === 'payme') return Boolean(config.payments.paymeToken);
    return true;
  });
}

/**
 * Savatchani hisoblaydi. Narxlar faqat bazadan olinadi — frontend yuborgan narxga ishonilmaydi.
 * items: [{ productId, quantity }]
 */
export async function calculateCart(items) {
  if (!Array.isArray(items) || items.length === 0) throw new HttpError(400, 'Savatcha bo‘sh');
  if (items.length > MAX_LINES) throw new HttpError(400, 'Savatchada juda ko‘p mahsulot');

  // Bir xil mahsulot bir necha qatorda kelsa — birlashtiramiz
  const quantities = new Map();
  for (const item of items) {
    const id = Number(item?.productId);
    const quantity = Math.floor(Number(item?.quantity));
    if (!Number.isInteger(id) || !(quantity > 0)) continue;
    quantities.set(id, Math.min(MAX_QUANTITY, (quantities.get(id) || 0) + quantity));
  }

  const products = await ProductModel.findManyByIds([...quantities.keys()]);
  const lines = [];

  for (const product of products) {
    if (!product.isActive) continue;
    const quantity = quantities.get(product.id);
    lines.push({
      productId: product.id,
      name: product.name,
      imageUrl: product.imageUrl,
      price: product.newPrice,
      quantity,
      sum: product.newPrice * quantity,
    });
  }

  if (lines.length === 0) throw new HttpError(400, 'Tanlangan taomlar hozir mavjud emas');

  const subtotal = lines.reduce((sum, line) => sum + line.sum, 0);
  const deliveryFee = deliveryFeeFor(subtotal);

  return { items: lines, subtotal, deliveryFee, total: subtotal + deliveryFee };
}

/** To'lov usuliga qarab Telegram invoys parametrlari. */
export function invoiceParams(order) {
  if (order.paymentMethod === 'telegram_stars') {
    return {
      currency: 'XTR',
      providerToken: '',
      amount: Math.max(1, Math.ceil(order.total / config.payments.starsRate)),
    };
  }

  const providerToken =
    order.paymentMethod === 'click' ? config.payments.clickToken : config.payments.paymeToken;

  // UZS uchun summa tiyinda beriladi
  return { currency: 'UZS', providerToken, amount: order.total * 100 };
}

async function createInvoiceLink(order) {
  const { currency, providerToken, amount } = invoiceParams(order);

  return bot.telegram.createInvoiceLink({
    title: `Buyurtma #${order.id}`,
    description: order.items.map((item) => `${item.name} × ${item.quantity}`).join(', ').slice(0, 255),
    payload: `order:${order.id}`,
    provider_token: providerToken,
    currency,
    prices: [{ label: `Buyurtma #${order.id}`, amount }],
  });
}

/**
 * Buyurtma tasdiqlandi (naqd pul yoki to'lov o'tdi): adminga va mijozga xabar yuboradi.
 */
export async function finalizeOrder(order) {
  const user = await UserModel.findByTelegramId(order.userId);

  const adminMessage = await notifyAdmin(formatOrderForAdmin(order, user), {
    reply_markup: adminOrderKeyboard(order),
    link_preview_options: { is_disabled: true },
  });

  if (adminMessage) {
    await OrderModel.setAdminMessageId(order.id, adminMessage.message_id);

    if (order.latitude && order.longitude) {
      // Venue — xarita, sarlavha va manzil bilan; kuryer bir bosishda navigatorda ochadi
      await bot.telegram
        .sendVenue(
          config.bot.adminChatId,
          order.latitude,
          order.longitude,
          `📍 Buyurtma #${order.id} — ${order.customerName}`,
          order.address.slice(0, 200),
          { reply_parameters: { message_id: adminMessage.message_id } },
        )
        .catch((error) => logger.warn(`Lokatsiya yuborilmadi: ${error.message}`));
    }
  }

  await sendMessageSafe(order.userId, formatOrderForUser(order));
}

export const cartController = {
  /** POST /api/cart/calculate — savatcha summasini serverda hisoblash */
  async calculate(req, res, next) {
    try {
      const cart = await calculateCart(req.body?.items);
      res.json({ ok: true, data: cart });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/orders
   * Body: { items: [{ productId, quantity }], customerName, phone, address,
   *         latitude?, longitude?, comment?, paymentMethod }
   */
  async createOrder(req, res, next) {
    try {
      const body = req.body || {};
      const customerName = String(body.customerName || '').trim();
      const phone = String(body.phone || '').trim();
      const address = String(body.address || '').trim();
      const comment = String(body.comment || '').trim().slice(0, 500);
      const paymentMethod = String(body.paymentMethod || 'cash');

      if (customerName.length < 2) throw new HttpError(400, 'Ismingizni kiriting');
      if (phone.replace(/\D/g, '').length < 9) throw new HttpError(400, 'Telefon raqamini to‘g‘ri kiriting');
      if (address.length < 5) throw new HttpError(400, 'Yetkazib berish manzilini to‘liq kiriting');
      if (!availablePaymentMethods().includes(paymentMethod)) {
        throw new HttpError(400, 'Bu to‘lov usuli hozircha mavjud emas');
      }

      const latitude = Number(body.latitude);
      const longitude = Number(body.longitude);
      const hasLocation =
        Number.isFinite(latitude) && Number.isFinite(longitude) && latitude !== 0 && longitude !== 0;

      const cart = await calculateCart(body.items);

      const order = await OrderModel.create({
        userId: req.user.telegramId,
        ...cart,
        customerName: customerName.slice(0, 100),
        phone: phone.slice(0, 30),
        address: address.slice(0, 300),
        latitude: hasLocation ? latitude : null,
        longitude: hasLocation ? longitude : null,
        comment,
        paymentMethod,
      });

      if (!req.user.phone) await UserModel.setPhone(req.user.telegramId, order.phone);

      if (paymentMethod === 'cash') {
        // Telegram xabarlari sekin bo'lishi mumkin — mijozni kuttirmaslik uchun javobni darhol qaytaramiz
        finalizeOrder(order).catch((error) => logger.error(`Buyurtma #${order.id} xabarlari yuborilmadi`, error));
        return res.status(201).json({ ok: true, data: { order, invoiceLink: null } });
      }

      // Onlayn to'lov: buyurtma to'lov o'tgandan keyin adminga yuboriladi
      const invoiceLink = await createInvoiceLink(order);
      res.status(201).json({ ok: true, data: { order, invoiceLink } });
    } catch (error) {
      next(error);
    }
  },

  /** POST /api/orders/:id/invoice — to'lanmagan buyurtma uchun to'lov havolasini qayta olish */
  async createInvoice(req, res, next) {
    try {
      const order = await OrderModel.findById(req.params.id);

      if (!order || order.userId !== req.user.telegramId) throw new HttpError(404, 'Buyurtma topilmadi');
      if (order.paymentMethod === 'cash') throw new HttpError(400, 'Bu buyurtma naqd pulda to‘lanadi');
      if (order.paymentStatus !== 'pending' || order.status === 'cancelled') {
        throw new HttpError(400, 'Bu buyurtma uchun to‘lov kerak emas');
      }

      res.json({ ok: true, data: { invoiceLink: await createInvoiceLink(order) } });
    } catch (error) {
      next(error);
    }
  },

  /** GET /api/orders — mijozning buyurtmalari */
  async getMyOrders(req, res, next) {
    try {
      res.json({ ok: true, data: await OrderModel.listByUser(req.user.telegramId) });
    } catch (error) {
      next(error);
    }
  },

  /** GET /api/orders/:id */
  async getOrder(req, res, next) {
    try {
      const order = await OrderModel.findById(req.params.id);
      if (!order || order.userId !== req.user.telegramId) throw new HttpError(404, 'Buyurtma topilmadi');
      res.json({ ok: true, data: order });
    } catch (error) {
      next(error);
    }
  },

  // ---------- TELEGRAM TO'LOVLARI (bot handlerlari) ----------

  /** To'lovdan oldingi tekshiruv — Telegram 10 soniya ichida javob kutadi. */
  async preCheckout(ctx) {
    const query = ctx.preCheckoutQuery;
    const orderId = Number(String(query.invoice_payload).replace('order:', ''));

    try {
      const order = await OrderModel.findById(orderId);
      const expected = order ? invoiceParams(order) : null;

      const valid =
        order &&
        order.userId === query.from.id &&
        order.paymentStatus === 'pending' &&
        order.status !== 'cancelled' &&
        expected.currency === query.currency &&
        expected.amount === query.total_amount;

      if (!valid) {
        return ctx.answerPreCheckoutQuery(false, 'Buyurtma topilmadi yoki allaqachon to‘langan');
      }

      await ctx.answerPreCheckoutQuery(true);
    } catch (error) {
      logger.error('pre_checkout_query xatosi', error);
      await ctx.answerPreCheckoutQuery(false, 'Texnik xatolik, birozdan so‘ng urinib ko‘ring');
    }
  },

  /** To'lov muvaffaqiyatli o'tdi. */
  async successfulPayment(ctx) {
    const payment = ctx.message.successful_payment;
    const orderId = Number(String(payment.invoice_payload).replace('order:', ''));

    const order = await OrderModel.markPaid(orderId, payment.telegram_payment_charge_id);
    if (!order) {
      logger.warn(`Buyurtma #${orderId} uchun takroriy to‘lov xabari keldi`);
      return;
    }

    logger.info(`Buyurtma #${order.id} to‘landi (${order.paymentMethod})`);
    await finalizeOrder(order);
  },
};

export default cartController;
