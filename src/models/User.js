import { query } from '../database/connection.js';

/** Bazadagi qatorni API uchun qulay shaklga keltiradi. */
function toUser(row) {
  if (!row) return null;
  return {
    telegramId: row.telegram_id,
    firstName: row.first_name,
    lastName: row.last_name,
    username: row.username,
    phone: row.phone,
    languageCode: row.language_code,
    onboarded: row.onboarded,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const UserModel = {
  async findByTelegramId(telegramId) {
    const { rows } = await query('SELECT * FROM users WHERE telegram_id = $1', [telegramId]);
    return toUser(rows[0]);
  },

  /**
   * Telegram foydalanuvchisini yozadi yoki yangilaydi.
   * Telefon raqami bu yerda tegilmaydi — u faqat mijoz o'zi yuborganda saqlanadi.
   */
  async upsertFromTelegram(tgUser) {
    const { rows } = await query(
      `INSERT INTO users (telegram_id, first_name, last_name, username, language_code)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (telegram_id) DO UPDATE SET
         first_name    = EXCLUDED.first_name,
         last_name     = EXCLUDED.last_name,
         username      = EXCLUDED.username,
         language_code = EXCLUDED.language_code,
         updated_at    = NOW()
       RETURNING *`,
      [
        tgUser.id,
        tgUser.first_name || '',
        tgUser.last_name || null,
        tgUser.username || null,
        tgUser.language_code || null,
      ],
    );
    return toUser(rows[0]);
  },

  async setPhone(telegramId, phone) {
    const { rows } = await query(
      'UPDATE users SET phone = $2, updated_at = NOW() WHERE telegram_id = $1 RETURNING *',
      [telegramId, String(phone).trim()],
    );
    return toUser(rows[0]);
  },

  async setOnboarded(telegramId) {
    const { rows } = await query(
      'UPDATE users SET onboarded = TRUE, updated_at = NOW() WHERE telegram_id = $1 RETURNING *',
      [telegramId],
    );
    return toUser(rows[0]);
  },

  async count() {
    const { rows } = await query('SELECT COUNT(*) AS count FROM users');
    return rows[0].count;
  },
};

export default UserModel;
