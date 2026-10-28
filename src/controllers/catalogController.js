import config from '../config/default.js';
import ProductModel from '../models/Product.js';
import UserModel from '../models/User.js';
import { HttpError } from '../middlewares/auth.middleware.js';
import { availablePaymentMethods } from './cartController.js';
import { isAdmin } from '../services/adminAccess.js';

export const catalogController = {
  /** GET /api/config — Mini App uchun umumiy sozlamalar */
  getConfig(req, res) {
    res.json({
      ok: true,
      data: {
        restaurant: config.restaurant,
        delivery: config.delivery,
        paymentMethods: availablePaymentMethods(),
        starsRate: config.payments.starsRate,
      },
    });
  },

  /** GET /api/me — isAdmin bo'lsa profilda admin panel tugmasi chiqadi */
  async getMe(req, res, next) {
    try {
      res.json({ ok: true, data: { ...req.user, isAdmin: await isAdmin(req.user.telegramId) } });
    } catch (error) {
      next(error);
    }
  },

  /** POST /api/me/onboarded — onboarding bir marta ko'rsatiladi */
  async setOnboarded(req, res, next) {
    try {
      res.json({ ok: true, data: await UserModel.setOnboarded(req.user.telegramId) });
    } catch (error) {
      next(error);
    }
  },

  /** POST /api/me/phone — Body: { phone } */
  async setPhone(req, res, next) {
    try {
      const phone = String(req.body?.phone || '').trim();
      if (phone.replace(/\D/g, '').length < 9) throw new HttpError(400, 'Telefon raqamini to‘g‘ri kiriting');
      res.json({ ok: true, data: await UserModel.setPhone(req.user.telegramId, phone.slice(0, 30)) });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/geocode?lat=41.31&lon=69.27 — koordinatadan o'qiladigan manzil (OpenStreetMap Nominatim).
   * Serverdan so'raladi: Nominatim qoidasi bo'yicha User-Agent kerak va mijoz IP'si uchinchi tomonga ketmaydi.
   */
  async reverseGeocode(req, res, next) {
    try {
      const lat = Number(req.query.lat);
      const lon = Number(req.query.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
        throw new HttpError(400, 'Koordinatalar noto‘g‘ri');
      }

      const url =
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&addressdetails=1` +
        `&accept-language=uz,ru&lat=${lat}&lon=${lon}`;

      let address = '';
      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': `${config.restaurant.name} delivery bot (Telegram Mini App)` },
          signal: AbortSignal.timeout(6000),
        });
        if (response.ok) {
          const data = await response.json();
          const a = data.address || {};
          const street = [a.road || a.pedestrian, a.house_number].filter(Boolean).join(', ');
          const parts = [
            a.district || a.city_district || a.suburb,
            a.city || a.town || a.village || a.quarter || a.neighbourhood,
            street,
          ];
          address = [...new Set(parts.filter(Boolean))].join(', ');
          if (!address) address = data.display_name || '';
        }
      } catch {
        // Xizmat javob bermasa — mijoz manzilni qo'lda yozadi, lokatsiya baribir saqlanadi
      }

      res.json({ ok: true, data: { address } });
    } catch (error) {
      next(error);
    }
  },

  /** GET /api/categories */
  async getCategories(req, res, next) {
    try {
      res.json({ ok: true, data: await ProductModel.categories() });
    } catch (error) {
      next(error);
    }
  },

  /** GET /api/products?category=Burgerlar */
  async getProducts(req, res, next) {
    try {
      res.json({ ok: true, data: await ProductModel.listActive(req.query.category) });
    } catch (error) {
      next(error);
    }
  },

  /** GET /api/products/popular */
  async getPopular(req, res, next) {
    try {
      res.json({ ok: true, data: await ProductModel.listPopular() });
    } catch (error) {
      next(error);
    }
  },

  /** GET /api/products/bump — savatchadagi qo'shimcha taklif */
  async getBump(req, res, next) {
    try {
      res.json({ ok: true, data: await ProductModel.findBump() });
    } catch (error) {
      next(error);
    }
  },

  /** GET /api/products/:id */
  async getProduct(req, res, next) {
    try {
      const product = await ProductModel.findById(req.params.id);
      if (!product || !product.isActive) throw new HttpError(404, 'Taom topilmadi');
      res.json({ ok: true, data: product });
    } catch (error) {
      next(error);
    }
  },
};

export default catalogController;
