"use strict";

const db = require("../core/db");

const SEARCH_LIMIT = 20;
const CONTACT_PAGE_LIMIT = 100;

/**
 * Escape special characters that have meaning in SQL LIKE expressions.
 * @param {string} str - Raw user input
 * @returns {string} Escaped string safe for LIKE
 */
function escapeLike(str) {
  return str.replace(/[%_\\]/g, "\\$&");
}

/**
 * Fetch all contacts for a given user, ordered alphabetically.
 * @param {object} env - Node-RED environment accessor
 * @param {number} userId - Internal app_users.id
 * @param {number} [limit] - Max rows to return
 * @returns {Promise<object[]>} Contact rows
 */
async function getContacts(env, userId, limit = CONTACT_PAGE_LIMIT) {
  const result = await db.query(
    env,
    `SELECT id, first_name, last_name, telegram_username, to_char(birth_date, 'YYYY-MM-DD') AS birth_date
     FROM contacts
     WHERE owner_user_id = $1
     ORDER BY last_name_key, first_name_key, birth_date
     LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
}

/**
 * Fetch one contact by id, scoped to the owner.
 * @param {object} env - Node-RED environment accessor
 * @param {number} userId - Internal app_users.id
 * @param {number|string} contactId - contacts.id
 * @returns {Promise<object|null>} Contact row or null
 */
async function getContactById(env, userId, contactId) {
  const result = await db.query(
    env,
    `SELECT id, first_name, last_name, telegram_username, to_char(birth_date, 'YYYY-MM-DD') AS birth_date
     FROM contacts
     WHERE id = $1 AND owner_user_id = $2`,
    [contactId, userId]
  );
  return result.rows[0] || null;
}

/**
 * Insert a new contact or update the existing one on conflict.
 * @param {object} env - Node-RED environment accessor
 * @param {number} userId - Internal app_users.id
 * @param {object} data - { firstName, lastName, birthDate, telegramUsername }
 * @returns {Promise<object>} The saved contact row
 */
async function addOrUpdateContact(env, userId, data) {
  const result = await db.query(
    env,
    `INSERT INTO contacts (owner_user_id, first_name, last_name, birth_date, telegram_username)
     VALUES ($1, $2, $3, $4::date, $5)
     ON CONFLICT (owner_user_id, first_name_key, last_name_key, birth_date)
     DO UPDATE SET telegram_username = EXCLUDED.telegram_username, updated_at = now()
     RETURNING first_name, last_name, telegram_username, to_char(birth_date, 'YYYY-MM-DD') AS birth_date`,
    [userId, data.firstName, data.lastName, data.birthDate, data.telegramUsername]
  );
  return result.rows[0];
}

/**
 * Search contacts by name using a case-insensitive LIKE query.
 * Special LIKE characters (%, _, \) are escaped to prevent injection.
 * @param {object} env - Node-RED environment accessor
 * @param {number} userId - Internal app_users.id
 * @param {string} query - Raw search input from the user
 * @returns {Promise<object[]>} Matching contact rows
 */
async function searchContacts(env, userId, query) {
  const likeQuery = `%${escapeLike(query.toLowerCase())}%`;
  const result = await db.query(
    env,
    `SELECT id, first_name, last_name, telegram_username, to_char(birth_date, 'YYYY-MM-DD') AS birth_date
     FROM contacts
     WHERE owner_user_id = $1
       AND (
         first_name_key LIKE $2
         OR last_name_key LIKE $2
         OR (first_name_key || ' ' || last_name_key) LIKE $2
       )
     ORDER BY last_name_key, first_name_key
     LIMIT $3`,
    [userId, likeQuery, SEARCH_LIMIT]
  );
  return result.rows;
}

/**
 * Delete one contact by id, scoped to the owner.
 * Reminder logs are removed by the database ON DELETE CASCADE rule.
 * @param {object} env - Node-RED environment accessor
 * @param {number} userId - Internal app_users.id
 * @param {number|string} contactId - contacts.id
 * @returns {Promise<object|null>} Deleted contact row or null
 */
async function deleteContact(env, userId, contactId) {
  const result = await db.query(
    env,
    `DELETE FROM contacts
     WHERE id = $1 AND owner_user_id = $2
     RETURNING id, first_name, last_name, telegram_username, to_char(birth_date, 'YYYY-MM-DD') AS birth_date`,
    [contactId, userId]
  );
  return result.rows[0] || null;
}

module.exports = {
  getContacts,
  getContactById,
  addOrUpdateContact,
  searchContacts,
  deleteContact
};
