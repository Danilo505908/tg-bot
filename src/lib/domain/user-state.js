"use strict";

const db = require("../core/db");
const DEFAULT_REMINDER_DAYS = [0];

async function ensureUser(env, telegramUser, chatId) {
  const timezone = env.get("DEFAULT_TIMEZONE") || "Europe/Kyiv";
  const result = await db.query(
    env,
    `INSERT INTO app_users (
       telegram_user_id, chat_id, username, first_name, last_name, language_code, timezone
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (telegram_user_id)
     DO UPDATE SET
       chat_id = EXCLUDED.chat_id,
       username = EXCLUDED.username,
       first_name = EXCLUDED.first_name,
       last_name = EXCLUDED.last_name,
       language_code = EXCLUDED.language_code,
       updated_at = now()
     RETURNING *`,
    [
      telegramUser.id,
      chatId,
      telegramUser.username || null,
      telegramUser.first_name || null,
      telegramUser.last_name || null,
      telegramUser.language_code || null,
      timezone
    ]
  );

  const user = result.rows[0];
  await db.query(
    env,
    `INSERT INTO reminder_settings (user_id, remind_days_before, timezone)
     VALUES ($1, $2::int[], $3)
     ON CONFLICT (user_id) DO NOTHING`,
    [user.id, DEFAULT_REMINDER_DAYS, timezone]
  );

  return user;
}

async function getState(env, userId) {
  const result = await db.query(
    env,
    "SELECT state, data FROM conversation_states WHERE user_id = $1",
    [userId]
  );
  return result.rows[0] || null;
}

async function setState(env, userId, state, data = {}) {
  await db.query(
    env,
    `INSERT INTO conversation_states (user_id, state, data)
     VALUES ($1, $2, $3::jsonb)
     ON CONFLICT (user_id)
     DO UPDATE SET state = EXCLUDED.state, data = EXCLUDED.data, updated_at = now()`,
    [userId, state, JSON.stringify(data)]
  );
}

async function clearState(env, userId) {
  await db.query(env, "DELETE FROM conversation_states WHERE user_id = $1", [userId]);
}

module.exports = {
  ensureUser,
  getState,
  setState,
  clearState
};
