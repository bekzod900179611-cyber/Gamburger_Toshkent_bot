import config from '../config/default.js';
import { escapeHtml } from '../core/bot.js';
import { STATUS_LABELS, PAYMENT_LABELS } from '../models/Order.js';

/** 45000 → "45,000 so‘m" */
export function formatSum(value) {
  return `${Math.round(Number(value) || 0).toLocaleString('en-US')} so‘m`;
}

export function formatDate(value) {
  return new Date(value).toLocaleString('ru-RU', {
    timeZone: 'Asia/Tashkent',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function itemLines(order) {
  return order.items
    .map((item) => `• ${escapeHtml(item.name)} × ${item.quantity} — ${formatSum(item.sum)}`)
    .join('\n');
}

function paymentLine(order) {
  const paid = order.paymentStatus === 'paid' ? ' (to‘langan ✅)' : '';
  return `${PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}${paid}`;
}

/** Admin chatiga yuboriladigan buyurtma xabari. */
export function formatOrderForAdmin(order, user) {
  const lines = [
    // Bitta guruhda bir nechta restoran boti bo'lsa, buyurtmalar aralashmasin
    `🍔 <b>${escapeHtml(config.restaurant.name)}</b>`,
    `${STATUS_LABELS[order.status]} — <b>Buyurtma #${order.id}</b>`,
    '',
    `👤 <b>Mijoz:</b> <a href="tg://user?id=${order.userId}">${escapeHtml(order.customerName)}</a>` +
      (user?.username ? ` (@${escapeHtml(user.username)})` : ''),
    `📞 <b>Telefon:</b> ${escapeHtml(order.phone)}`,
    `📍 <b>Manzil:</b> ${escapeHtml(order.address)}`,
  ];

  if (order.latitude && order.longitude) {
    lines.push(
      `🗺 <a href="https://maps.google.com/?q=${order.latitude},${order.longitude}">Xaritada ochish</a>`,
    );
  }
  if (order.comment) lines.push(`💬 <b>Izoh:</b> ${escapeHtml(order.comment)}`);

  lines.push(
    '',
    '🍽 <b>Taomlar:</b>',
    itemLines(order),
    '',
    `Mahsulotlar: ${formatSum(order.subtotal)}`,
    `Yetkazib berish: ${order.deliveryFee === 0 ? 'Bepul' : formatSum(order.deliveryFee)}`,
    `<b>Jami: ${formatSum(order.total)}</b>`,
    '',
    `💳 <b>To‘lov:</b> ${paymentLine(order)}`,
    `🕒 ${formatDate(order.createdAt)}`,
  );

  return lines.join('\n');
}

/** Mijozga yuboriladigan tasdiq xabari. */
export function formatOrderForUser(order) {
  return [
    `✅ <b>Buyurtmangiz qabul qilindi!</b>`,
    '',
    `<b>Buyurtma #${order.id}</b>`,
    itemLines(order),
    '',
    `Yetkazib berish: ${order.deliveryFee === 0 ? 'Bepul' : formatSum(order.deliveryFee)}`,
    `<b>Jami: ${formatSum(order.total)}</b>`,
    `💳 To‘lov: ${paymentLine(order)}`,
    `📍 Manzil: ${escapeHtml(order.address)}`,
    '',
    'Operatorimiz tez orada siz bilan bog‘lanadi. Holat o‘zgarsa shu yerga xabar beramiz 🙌',
  ].join('\n');
}

/** Buyurtmalar ro'yxatidagi qisqa satr. */
export function formatOrderShort(order) {
  const names = order.items.map((item) => `${escapeHtml(item.name)} × ${item.quantity}`).join(', ');
  return (
    `<b>#${order.id}</b> — ${STATUS_LABELS[order.status]}\n` +
    `   ${names}\n` +
    `   💰 ${formatSum(order.total)} • 📅 ${formatDate(order.createdAt)}`
  );
}
