import { query } from '../database/connection.js';
import ProductModel, { CATEGORIES } from '../models/Product.js';
import OrderModel, { ORDER_STATUSES } from '../models/Order.js';
import UserModel from '../models/User.js';
import { HttpError } from '../middlewares/auth.middleware.js';
import { changeOrderStatus, StatusError } from '../services/orderStatus.js';
import { isAdmin } from '../services/adminAccess.js';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Admin paneldan kelgan taom ma'lumotini tekshiradi. partial — faqat yuborilgan maydonlar. */
function parseProduct(body, partial) {
  const out = {};
  const has = (key) => body[key] !== undefined;

  if (!partial || has('name')) {
    const name = String(body.name || '').trim();
    if (name.length < 2) throw new HttpError(400, 'Taom nomini kiriting');
    out.name = name.slice(0, 80);
  }
  if (!partial || has('newPrice')) {
    const price = Math.round(Number(body.newPrice));
    if (!Number.isFinite(price) || price <= 0) throw new HttpError(400, 'Narx 0 dan katta bo‘lishi kerak');
    out.newPrice = price;
  }
  if (!partial || has('category')) {
    const category = String(body.category || '').trim();
    if (!category) throw new HttpError(400, 'Bo‘limni tanlang');
    out.category = category.slice(0, 40);
  }
  if (has('oldPrice')) {
    const oldPrice = Math.round(Number(body.oldPrice) || 0);
    if (oldPrice < 0) throw new HttpError(400, 'Eski narx manfiy bo‘lmaydi');
    out.oldPrice = oldPrice;
  }
  if (has('description')) out.description = String(body.description || '').trim().slice(0, 400);
  if (has('ingredients')) {
    const list = Array.isArray(body.ingredients) ? body.ingredients : String(body.ingredients).split(',');
    out.ingredients = list.map((item) => String(item).trim()).filter(Boolean).slice(0, 20);
  }
  if (has('imageUrl')) {
    const url = String(body.imageUrl || '').trim();
    if (url && !/^(https:\/\/|\/api\/images\/\d+$)/.test(url)) throw new HttpError(400, 'Rasm manzili https:// bilan boshlanishi kerak');
    out.imageUrl = url;
  }
  for (const flag of ['isPopular', 'isBump', 'isActive']) {
    if (has(flag)) out[flag] = Boolean(body[flag]);
  }
  if (has('sortOrder')) out.sortOrder = Math.round(Number(body.sortOrder) || 0);

  return out;
}

export const adminController = {
  /** Admin tekshiruvi: /api/admin/* dan oldin */
  async requireAdmin(req, res, next) {
    try {
      if (!(await isAdmin(req.user.telegramId))) throw new HttpError(403, 'Bu bo‘lim faqat adminlar uchun');
      next();
    } catch (error) {
      next(error);
    }
  },

  /** GET /api/admin/stats */
  async stats(req, res, next) {
    try {
      const [stats, users] = await Promise.all([OrderModel.stats(), UserModel.count()]);
      res.json({ ok: true, data: { ...stats, users: Number(users) } });
    } catch (error) {
      next(error);
    }
  },

  /** GET /api/admin/orders?filter=active|done|<status> */
  async orders(req, res, next) {
    try {
      const filter = String(req.query.filter || 'active');
      res.json({ ok: true, data: await OrderModel.listForAdmin(filter, req.query.limit) });
    } catch (error) {
      next(error);
    }
  },

  /** POST /api/admin/orders/:id/status — Body: { status } */
  async setOrderStatus(req, res, next) {
    try {
      const status = String(req.body?.status || '');
      if (!ORDER_STATUSES.includes(status)) throw new HttpError(400, 'Noto‘g‘ri holat');
      const name = req.user.firstName || req.user.username || 'admin';
      res.json({ ok: true, data: await changeOrderStatus(req.params.id, status, `${name} (panel)`) });
    } catch (error) {
      next(error instanceof StatusError ? new HttpError(409, error.message) : error);
    }
  },

  /** GET /api/admin/products — stop-listdagilar bilan birga */
  async products(req, res, next) {
    try {
      const products = await ProductModel.listAll();
      const categories = [...new Set([...CATEGORIES, ...products.map((product) => product.category)])];
      res.json({ ok: true, data: { products, categories } });
    } catch (error) {
      next(error);
    }
  },

  /** POST /api/admin/products */
  async createProduct(req, res, next) {
    try {
      res.json({ ok: true, data: await ProductModel.create(parseProduct(req.body || {}, false)) });
    } catch (error) {
      next(error);
    }
  },

  /** PATCH /api/admin/products/:id — faqat yuborilgan maydonlar o'zgaradi */
  async updateProduct(req, res, next) {
    try {
      const product = await ProductModel.update(req.params.id, parseProduct(req.body || {}, true));
      if (!product) throw new HttpError(404, 'Taom topilmadi');
      res.json({ ok: true, data: product });
    } catch (error) {
      next(error);
    }
  },

  /** DELETE /api/admin/products/:id */
  async deleteProduct(req, res, next) {
    try {
      if (!(await ProductModel.remove(req.params.id))) throw new HttpError(404, 'Taom topilmadi');
      res.json({ ok: true, data: true });
    } catch (error) {
      next(error);
    }
  },

  /** POST /api/admin/images — tanasi: rasm fayli (image/jpeg|png|webp), javob: { url } */
  async uploadImage(req, res, next) {
    try {
      const mime = String(req.get('content-type') || '').split(';')[0].trim();
      if (!IMAGE_TYPES.includes(mime)) throw new HttpError(400, 'Faqat JPG, PNG yoki WEBP rasm');
      if (!Buffer.isBuffer(req.body) || req.body.length === 0) throw new HttpError(400, 'Rasm bo‘sh');

      const { rows } = await query('INSERT INTO product_images (mime, data) VALUES ($1, $2) RETURNING id', [
        mime,
        req.body,
      ]);
      res.json({ ok: true, data: { url: `/api/images/${rows[0].id}` } });
    } catch (error) {
      next(error);
    }
  },

  /** GET /api/images/:id — ochiq: rasm mijozlarga ham ko'rinadi */
  async getImage(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) throw new HttpError(404, 'Rasm topilmadi');
      const { rows } = await query('SELECT mime, data FROM product_images WHERE id = $1', [id]);
      if (!rows[0]) throw new HttpError(404, 'Rasm topilmadi');

      // Rasm hech qachon o'zgarmaydi (yangisi yangi id oladi) — uzoq keshlash mumkin
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
      res.type(rows[0].mime).send(rows[0].data);
    } catch (error) {
      next(error);
    }
  },
};

export default adminController;
