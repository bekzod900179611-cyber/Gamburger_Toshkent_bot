// Jadvallarni yaratish: npm run db:init
import { connectDatabase, initDatabase, disconnectDatabase } from './connection.js';
import logger from '../utils/logger.js';

try {
  await connectDatabase();
  await initDatabase();
} catch (error) {
  logger.error('Bazani tayyorlashda xato', error);
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
}
