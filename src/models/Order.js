import { query } from '../database/connection.js';

export const ORDER_STATUSES = ['new', 'accepted', 'cooking', 'delivering', 'delivered', 'cancelled'];
export const PAYMENT_METHODS = ['cash', 'click', 'payme', 'telegram_stars'];
export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

export const STATUS_LABELS = {
  new: '🆕 Yangi',
  accepted: '✅ Qabul qilindi',
  cooking: '👨‍🍳 Tayyorlanmoqda',
  delivering: '🛵 Yo‘lda',
  delivered: '🎉 Yetkazildi',
  cancelled: '❌ Bekor qilindi',
};

export const PAYMENT_LABELS = {
  cash: '💵 Naqd pul',
  click: '💳 Click',
  payme: '💳 Payme',
  telegram_stars: '⭐ Telegram Stars',
};

function toOrder(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    // items: [{ productId, name, imageUrl, price, quantity, sum }]
    items: row.items,
    subtotal: row.subtotal,
    deliveryFee: row.delivery_fee,
    total: row.total,
    customerName: row.customer_name,
    phone: row.phone,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    comment: row.comment,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    status: row.status,
    paymentChargeId: row.payment_charge_id,
    adminMessageId: row.admin_message_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const OrderModel = {
  async create(order) {
    const { rows } = await query(
      `INSERT INTO orders
         (user_id, items, subtotal, delivery_fee, total, customer_name, phone,
          address, latitude, longitude, comment, payment_method)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        order.userId,
        JSON.stringify(order.items),
        order.subtotal,
        order.deliveryFee,
        order.total,
        String(order.customerName).trim(),
        String(order.phone).trim(),
        String(order.address).trim(),
        order.latitude ?? null,
        order.longitude ?? null,
        order.comment ? String(order.comment).trim() : null,
        order.paymentMethod,
      ],
    );
    return toOrder(rows[0]);
  },

  async findById(id) {
    const { rows } = await query('SELECT * FROM orders WHERE id = $1', [Number(id)]);
    return toOrder(rows[0]);
  },

  async listByUser(userId, limit = 20) {
    const { rows } = await query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
      [userId, limit],
    );
    return rows.map(toOrder);
  },

  async updateStatus(id, status) {
    if (!ORDER_STATUSES.includes(status)) throw new Error(`Noto‘g‘ri holat: ${status}`);

    const { rows } = await query(
      'UPDATE orders SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *',
      [Number(id), status],
    );
    return toOrder(rows[0]);
  },

  async updatePaymentStatus(id, paymentStatus) {
    if (!PAYMENT_STATUSES.includes(paymentStatus)) {
      throw new Error(`Noto‘g‘ri to‘lov holati: ${paymentStatus}`);
    }

    const { rows } = await query(
      'UPDATE orders SET payment_status = $2, updated_at = NOW() WHERE id = $1 RETURNING *',
      [Number(id), paymentStatus],
    );
    return toOrder(rows[0]);
  },

  /**
   * To'lovni "to'langan" deb belgilaydi. Faqat pending holatdagi buyurtmaga ta'sir qiladi,
   * shuning uchun bir xil to'lov ikki marta kelsa ham buyurtma ikki marta tasdiqlanmaydi.
   * Allaqachon to'langan bo'lsa null qaytaradi.
   */
  async markPaid(id, chargeId) {
    const { rows } = await query(
      `UPDATE orders
       SET payment_status = 'paid', payment_charge_id = $2, updated_at = NOW()
       WHERE id = $1 AND payment_status = 'pending'
       RETURNING *`,
      [Number(id), chargeId || null],
    );
    return toOrder(rows[0]);
  },

  async setAdminMessageId(id, messageId) {
    await query('UPDATE orders SET admin_message_id = $2 WHERE id = $1', [Number(id), messageId]);
  },

  /**
   * Admin uchun buyurtmalar ro'yxati.
   * filter: 'active' — hali yetkazilmaganlar, 'done' — yakunlanganlar, yoki aniq holat nomi.
   */
  async listForAdmin(filter = 'active', limit = 50) {
    const where = {
      active: "status IN ('new', 'accepted', 'cooking', 'delivering')",
      done: "status IN ('delivered', 'cancelled')",
    }[filter] || (ORDER_STATUSES.includes(filter) ? 'status = $2' : 'TRUE');

    const params = [Math.min(Number(limit) || 50, 200)];
    if (ORDER_STATUSES.includes(filter)) params.push(filter);

    const { rows } = await query(`SELECT * FROM orders WHERE ${where} ORDER BY created_at DESC LIMIT $1`, params);
    return rows.map(toOrder);
  },

  /** Bosh sahifa raqamlari. Kunlar Toshkent vaqti bo'yicha hisoblanadi. */
  async stats() {
    const day = "(created_at AT TIME ZONE 'Asia/Tashkent')::date";
    const today = "(NOW() AT TIME ZONE 'Asia/Tashkent')::date";

    const [summary, daily, top] = await Promise.all([
      query(`
        SELECT
          COUNT(*) FILTER (WHERE ${day} = ${today})                                   AS today_orders,
          COALESCE(SUM(total) FILTER (WHERE ${day} = ${today} AND status <> 'cancelled'), 0) AS today_revenue,
          COUNT(*) FILTER (WHERE status IN ('new', 'accepted', 'cooking', 'delivering')) AS active_orders,
          COUNT(*) FILTER (WHERE status = 'new')                                      AS new_orders,
          COALESCE(ROUND(AVG(total) FILTER (WHERE status <> 'cancelled' AND created_at > NOW() - INTERVAL '30 days')), 0) AS avg_check
        FROM orders`),
      query(`
        SELECT to_char(d, 'YYYY-MM-DD') AS day,
               COALESCE(SUM(o.total) FILTER (WHERE o.status <> 'cancelled'), 0) AS revenue,
               COUNT(o.id) AS orders
        FROM generate_series(${today} - 6, ${today}, INTERVAL '1 day') AS d
        LEFT JOIN orders o ON (o.created_at AT TIME ZONE 'Asia/Tashkent')::date = d::date
        GROUP BY d ORDER BY d`),
      query(`
        SELECT item->>'name' AS name, SUM((item->>'quantity')::int) AS quantity, SUM((item->>'sum')::int) AS revenue
        FROM orders, jsonb_array_elements(items) AS item
        WHERE status <> 'cancelled' AND created_at > NOW() - INTERVAL '30 days'
        GROUP BY 1 ORDER BY 2 DESC LIMIT 5`),
    ]);

    const s = summary.rows[0];
    return {
      todayOrders: Number(s.today_orders),
      todayRevenue: Number(s.today_revenue),
      activeOrders: Number(s.active_orders),
      newOrders: Number(s.new_orders),
      avgCheck: Number(s.avg_check),
      week: daily.rows.map((row) => ({
        day: row.day,
        revenue: Number(row.revenue),
        orders: Number(row.orders),
      })),
      top: top.rows.map((row) => ({ name: row.name, quantity: Number(row.quantity), revenue: Number(row.revenue) })),
    };
  },
};

export default OrderModel;
