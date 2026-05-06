"use strict";

const telegram = require("../core/telegram");
const { clearState, setState } = require("../domain/user-state");
const { renderContactList, renderSettings } = require("../ui/renderers");
const { mainMenu } = require("../ui/menus");
const { getSettings } = require("../domain/reminders");
const { getContacts } = require("../domain/contacts");

// --- Individual command handlers (Single Responsibility) -----------------

async function handleStart(env, chatId, user) {
  await clearState(env, user.id);
  return [telegram.sendMessage(env, chatId, "Вітаю! Я допоможу зберігати дні народження контактів і вчасно нагадувати про них.", mainMenu())];
}

async function handleHelp(env, chatId, user) {
  await clearState(env, user.id);
  return [telegram.sendMessage(env, chatId, ["<b>Команди</b>", "/start — головне меню", "/add — додати контакт", "/list — список контактів", "/search — знайти день народження", "/delete — видалити контакт", "/settings — налаштування нагадувань", "/cancel — скасувати поточну дію"].join("\n"), mainMenu())];
}

async function handleCancel(env, chatId, user) {
  await clearState(env, user.id);
  return [telegram.sendMessage(env, chatId, "Дію скасовано.", mainMenu())];
}

async function handleAdd(env, chatId, user) {
  await setState(env, user.id, "waiting_contact_name");
  return [telegram.sendMessage(env, chatId, "Введи імʼя та прізвище контакту, наприклад: Іван Петренко")];
}

async function handleList(env, chatId, user) {
  await clearState(env, user.id);
  const contacts = await getContacts(env, user.id);
  return renderContactList(env, chatId, contacts);
}

async function handleSearch(env, chatId, user) {
  await setState(env, user.id, "waiting_search_query");
  return [telegram.sendMessage(env, chatId, "Введи імʼя або прізвище для пошуку.")];
}

async function handleDelete(env, chatId, user) {
  await setState(env, user.id, "waiting_delete_query");
  return [telegram.sendMessage(env, chatId, "Введи імʼя або прізвище контакту, який потрібно видалити.")];
}

async function handleSettings(env, chatId, user) {
  await clearState(env, user.id);
  const settings = await getSettings(env, user.id);
  return renderSettings(env, chatId, settings);
}

// --- Command Map (Open/Closed Principle — add new commands here) ---------

/** @type {Record<string, (env: object, chatId: number, user: object) => Promise<object[]>>} */
const commands = {
  "/start": handleStart,
  "/menu": handleStart,
  "/help": handleHelp,
  "/cancel": handleCancel,
  "/add": handleAdd,
  "/list": handleList,
  "/search": handleSearch,
  "/delete": handleDelete,
  "/settings": handleSettings,
};

/**
 * Dispatch a slash-command to the appropriate handler.
 * @param {object} env - Node-RED environment accessor
 * @param {number} chatId - Telegram chat ID
 * @param {object} user - User row from app_users
 * @param {string} text - Full message text starting with "/"
 * @returns {Promise<object[]>} Array of Telegram API request objects
 */
async function handleCommand(env, chatId, user, text) {
  const command = text.split(" ")[0].toLowerCase();
  const handler = commands[command];
  if (!handler) {
    return [telegram.sendMessage(env, chatId, "Такої команди немає. Скористайся меню.", mainMenu())];
  }
  return handler(env, chatId, user);
}

module.exports = { handleCommand };
