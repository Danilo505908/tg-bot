"use strict";

const db = require("../core/db");
const telegram = require("../core/telegram");
const { toIsoDate, localParts, addDays, birthdayMatchesTarget, normalizeBirthdayDate } = require("../utils/date-math");
const { reminderText } = require("../ui/renderers");

async function getSettings(env, userId) {
  const result = await db.query(env, `SELECT enabled, remind_days_before, to_char(remind_time, 'HH24:MI') AS remind_time, timezone FROM reminder_settings WHERE user_id = $1`, [userId]);
  return result.rows[0];
}

async function toggleSettings(env, userId) {
  await db.query(env, "UPDATE reminder_settings SET enabled = NOT enabled, updated_at = now() WHERE user_id = $1", [userId]);
}

async function updateSettingsDays(env, userId, days) {
  await db.query(env, "UPDATE reminder_settings SET remind_days_before = $2::int[], updated_at = now() WHERE user_id = $1", [userId, days]);
}

async function updateSettingsTime(env, userId, time) {
  await db.query(env, "UPDATE reminder_settings SET remind_time = $2::time, updated_at = now() WHERE user_id = $1", [userId, time]);
}

async function rowsForReminders(env) {
  const result = await db.query(
    env,
    `SELECT u.id AS user_id, u.chat_id, rs.remind_days_before, to_char(rs.remind_time, 'HH24:MI') AS remind_time, rs.timezone,
       c.id AS contact_id, c.first_name, c.last_name, c.telegram_username, to_char(c.birth_date, 'YYYY-MM-DD') AS birth_date
     FROM reminder_settings rs JOIN app_users u ON u.id = rs.user_id JOIN contacts c ON c.owner_user_id = u.id
     WHERE rs.enabled = TRUE`, []
  );
  return result.rows;
}

async function buildDueReminderMessages(env, node) {
  const outgoing = [];
  try {
    const rows = await rowsForReminders(env);
    for (const row of rows) {
      const timezone = row.timezone || env.get("DEFAULT_TIMEZONE") || "Europe/Kyiv";
      const local = localParts(timezone);
      const currentTime = `${local.hour}:${local.minute}`;
      if (currentTime !== row.remind_time) continue;

      for (const daysBefore of row.remind_days_before) {
        const target = addDays(local.year, local.month, local.day, daysBefore);
        if (!birthdayMatchesTarget(row.birth_date, target)) continue;

        const [birthYear, birthMonth, birthDay] = row.birth_date.split("-").map(Number);
        const birthdayDate = normalizeBirthdayDate(target.year, birthMonth, birthDay);
        const remindForDate = toIsoDate(birthdayDate.year, birthdayDate.month, birthdayDate.day);

        const inserted = await db.query(
          env,
          `INSERT INTO reminder_log (user_id, contact_id, remind_for_date, days_before)
           VALUES ($1, $2, $3::date, $4) ON CONFLICT (user_id, contact_id, remind_for_date, days_before) DO NOTHING RETURNING id`,
          [row.user_id, row.contact_id, remindForDate, daysBefore]
        );
        if (inserted.rowCount === 0) continue;
        outgoing.push(telegram.sendMessage(env, row.chat_id, reminderText(row, birthdayDate, daysBefore)));
      }
    }
    return [outgoing];
  } catch (error) {
    node.error(error);
    return [[]];
  }
}

module.exports = { getSettings, toggleSettings, updateSettingsDays, updateSettingsTime, buildDueReminderMessages };
