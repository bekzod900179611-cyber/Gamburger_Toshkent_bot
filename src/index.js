import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cors from 'cors';

import config from './config/default.js';
import bot, { hasWebApp } from './core/bot.js';
import { connectDatabase, initDatabase, disconnectDatabase } from './database/connection.js';
import { registerBotHandlers, BOT_COMMANDS } from './routes/bot.routes.js';
import apiRoutes from './routes/api.routes.js';
import { notFound, errorHandler } from './middlewares/auth.middleware.js';
import logger from './utils/logger.js';

registerBotHandlers();

const app = express();

app.disable('x-powered-by');
app.use(
  cors({
    // Lokalda istalgan manzildan, ishlab chiqarishda faqat CORS_ORIGINS dan
    origin: config.isProd ? config.cors.origins : true,
  }),
);
app.use(express.json({ limit: '100kb' }));

/** Telegram webhook — WEBHOOK_URL sozlangan bo'lsa yangilanishlar shu yerga keladi. */
app.post('/api/telegram', async (req, res) => {
  const secret = config.bot.webhookSecret;
  if (secret && req.get('x-telegram-bot-api-secret-token') !== secret) {
    return res.status(401).json({ ok: false });
  }

  try {
    await bot.handleUpdate(req.body);
  } catch (error) {
    // 200 qaytarmasak Telegram shu yangilanishni qayta-qayta yuboraveradi
    logger.error('Webhook xatosi', error);
  }
  res.status(200).json({ ok: true });
});

app.use('/api', apiRoutes);
app.use('/api', notFound);

// Mini App build qilingan bo'lsa (web/out) — shu serverning o'zidan tarqatiladi.
// Shunda bitta HTTPS manzil (tunnel yoki hosting) ham API, ham Mini App uchun yetadi.
const webDir = path.join(import.meta.dirname, '..', 'web', 'out');
if (fs.existsSync(path.join(webDir, 'index.html'))) {
  // extensions: /admin → admin.html (Next statik eksporti sahifalarni shunday nomlaydi)
  app.use(express.static(webDir, { maxAge: '1h', index: 'index.html', extensions: ['html'] }));
  app.get('*', (req, res) => res.sendFile(path.join(webDir, 'index.html')));
  logger.info(`Mini App fayllari tarqatilmoqda: ${webDir}`);
}

app.use(notFound);
app.use(errorHandler);

async function startBot() {
  if (config.bot.webhookUrl) {
    await bot.telegram.setWebhook(`${config.bot.webhookUrl}/api/telegram`, {
      secret_token: config.bot.webhookSecret || undefined,
      allowed_updates: ['message', 'callback_query', 'pre_checkout_query'],
    });
    logger.info(`Bot webhook rejimida: ${config.bot.webhookUrl}/api/telegram`);
  } else {
    // Bot serverda (Render) webhook bilan ishlayotgan bo'lsa, lokal ishga tushirish uni "o'g'irlab"
    // qo'ymasin — aks holda internetdagi bot javob bermay qoladi.
    const current = await bot.telegram.getWebhookInfo();
    if (current.url && process.env.FORCE_POLLING !== 'true') {
      logger.warn(`Bot hozir serverda ishlayapti (${current.url}). Lokal bot ishga tushirilmadi.`);
      logger.warn('Baribir lokalda ishlatish kerak bo‘lsa: FORCE_POLLING=true bilan ishga tushiring.');
      return (await bot.telegram.getMe()).username;
    }

    // Webhook o'rnatilgan bo'lsa polling 409 xatosi beradi — avval o'chiramiz
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });
    // launch() bot to'xtaguncha tugamaydi, shuning uchun kutmaymiz
    bot
      .launch({ allowedUpdates: ['message', 'callback_query', 'pre_checkout_query'] })
      .catch((error) => logger.error('Bot polling to‘xtadi', error));
    logger.info('Bot polling rejimida');
  }

  await bot.telegram.setMyCommands(BOT_COMMANDS);

  if (hasWebApp()) {
    await bot.telegram.setChatMenuButton({
      menuButton: { type: 'web_app', text: '🍽 Menyu', web_app: { url: config.bot.webAppUrl } },
    });
  }

  const me = await bot.telegram.getMe();
  return me.username;
}

let server;

async function bootstrap() {
  await connectDatabase();
  await initDatabase();

  server = app.listen(config.port, () => logger.info(`API: http://localhost:${config.port}/api`));

  // Faqat lokal dizayn sinovi uchun: bot boshqa joyda ishlayotgan bo'lsa polling to'qnashmasin
  if (process.env.SKIP_BOT === 'true' && !config.isProd) {
    logger.warn('SKIP_BOT=true — bot ishga tushirilmadi (faqat API)');
    return;
  }

  const username = await startBot();
  logger.info(`Bot: @${username}`);
  logger.info(`Mini App: ${hasWebApp() ? config.bot.webAppUrl : 'WEBAPP_URL sozlanmagan (HTTPS kerak)'}`);
  if (!config.bot.adminChatId) {
    logger.warn('ADMIN_CHAT_ID bo‘sh — admin guruhida botga /id yozib, chiqqan raqamni .env ga yozing');
  }
  if (config.dev.allowDevAuth) logger.warn('ALLOW_DEV_AUTH yoqilgan — faqat lokal sinov uchun!');
}

async function shutdown(signal) {
  logger.info(`${signal} — server to‘xtatilmoqda...`);
  try {
    if (!config.bot.webhookUrl) bot.stop(signal);
  } catch {
    // bot hali ishga tushmagan bo'lishi mumkin
  }
  server?.close();
  await disconnectDatabase().catch(() => {});
  process.exit(0);
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

bootstrap().catch((error) => {
  logger.error('Server ishga tushmadi', error);
  process.exit(1);
});

export default app;
