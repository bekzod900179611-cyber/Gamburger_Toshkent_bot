import express, { Router } from 'express';
import catalogController from '../controllers/catalogController.js';
import cartController from '../controllers/cartController.js';
import adminController from '../controllers/adminController.js';
import { telegramAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ ok: true, service: 'gamburger-api', time: new Date().toISOString() });
});

// Taom rasmlari <img> orqali yuklanadi — sarlavha yubora olmaydi, shuning uchun ochiq
router.get('/images/:id', adminController.getImage);

// Quyidagi barcha yo'llar Telegram initData orqali himoyalangan
router.use(telegramAuth);

router.get('/config', catalogController.getConfig);

router.get('/me', catalogController.getMe);
router.post('/me/onboarded', catalogController.setOnboarded);
router.post('/me/phone', catalogController.setPhone);

router.get('/geocode', catalogController.reverseGeocode);

router.get('/categories', catalogController.getCategories);
router.get('/products', catalogController.getProducts);
router.get('/products/popular', catalogController.getPopular);
router.get('/products/bump', catalogController.getBump);
router.get('/products/:id', catalogController.getProduct);

router.post('/cart/calculate', cartController.calculate);

router.get('/orders', cartController.getMyOrders);
router.post('/orders', cartController.createOrder);
router.get('/orders/:id', cartController.getOrder);
router.post('/orders/:id/invoice', cartController.createInvoice);

// Admin panel — faqat ADMIN_IDS yoki admin guruhi a'zolari
const admin = Router();
admin.use(adminController.requireAdmin);
admin.get('/stats', adminController.stats);
admin.get('/orders', adminController.orders);
admin.post('/orders/:id/status', adminController.setOrderStatus);
admin.get('/products', adminController.products);
admin.post('/products', adminController.createProduct);
admin.patch('/products/:id', adminController.updateProduct);
admin.delete('/products/:id', adminController.deleteProduct);
admin.post('/images', express.raw({ type: 'image/*', limit: '3mb' }), adminController.uploadImage);
router.use('/admin', admin);

export default router;
