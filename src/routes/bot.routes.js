import { message } from 'telegraf/filters';
import bot from '../core/bot.js';
import startController from '../controllers/startController.js';
import cartController from '../controllers/cartController.js';
import { BUTTONS } from '../utils/keyboards.js';
import logger from '../utils/logger.js';

export const BOT_COMMANDS = [
  { command: 'start', description: 'Botni ishga tushirish' },
  { command: 'menu', description: 'Menyuni ochish' },
  { command: 'orders', description: 'Mening buyurtmalarim' },
  { command: 'help', description: 'Aloqa' },
];

/** Bot handlerlarini bitta joyda ro'yxatdan o'tkazadi. */
export function registerBotHandlers() {
  bot.start(startController.start);

  bot.command('menu', startController.menu);
  bot.command('orders', startController.myOrders);
  bot.command('help', startController.contact);
  bot.command('id', startController.chatId);
  bot.command('admin', startController.admin);

  bot.hears(BUTTONS.menu, startController.menu);
  bot.hears(BUTTONS.order, startController.menu);
  bot.hears(BUTTONS.myOrders, startController.myOrders);
  bot.hears(BUTTONS.contact, startController.contact);

  bot.on(message('contact'), startController.saveContact);

  // To'lovlar (Click, Payme, Telegram Stars)
  bot.on('pre_checkout_query', cartController.preCheckout);
  bot.on(message('successful_payment'), cartController.successfulPayment);

  // Admin chatidagi buyurtma holati tugmalari
  bot.action(/^order:(\d+):(accepted|cooking|delivering|delivered|cancelled)$/, startController.adminStatus);

  bot.on(message('text'), startController.fallback);

  bot.catch((error, ctx) => {
    logger.error(`Bot xatosi (${ctx.updateType})`, error);
  });

  return bot;
}

export default registerBotHandlers;
