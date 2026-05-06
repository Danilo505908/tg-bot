"use strict";

const telegram = require("../core/telegram");
const { clearState, setState } = require("../domain/user-state");
const { getContacts, getContactById, deleteContact } = require("../domain/contacts");
const { getSettings, toggleSettings, updateSettingsDays, updateSettingsTime } = require("../domain/reminders");
const { renderContactList, renderDeleteConfirmation, renderUpcoming, renderSettings } = require("../ui/renderers");
const { mainMenu } = require("../ui/menus");
const { parseReminderDays, parseReminderTime } = require("../utils/parsers");
const { contactLine } = require("../utils/formatters");

function parseContactId(data, prefix) {
  const value = data.slice(prefix.length);
  return /^\d+$/.test(value) ? value : null;
}

async function handleCallback(env, chatId, user, data) {
  if (data === "menu:home") {
    await clearState(env, user.id);
    return [telegram.sendMessage(env, chatId, "Головне меню", mainMenu())];
  }
  if (data === "menu:add") {
    await setState(env, user.id, "waiting_contact_name");
    return [telegram.sendMessage(env, chatId, "Введи імʼя та прізвище контакту, наприклад: Іван Петренко")];
  }
  if (data === "menu:list") {
    await clearState(env, user.id);
    const contacts = await getContacts(env, user.id);
    return renderContactList(env, chatId, contacts);
  }
  if (data === "menu:search") {
    await setState(env, user.id, "waiting_search_query");
    return [telegram.sendMessage(env, chatId, "Введи імʼя або прізвище для пошуку.")];
  }
  if (data === "menu:upcoming") {
    await clearState(env, user.id);
    const contacts = await getContacts(env, user.id);
    return renderUpcoming(env, chatId, contacts);
  }
  if (data.startsWith("contact:delete:ask:")) {
    await clearState(env, user.id);
    const contactId = parseContactId(data, "contact:delete:ask:");
    if (!contactId) return [telegram.sendMessage(env, chatId, "Не вдалося визначити контакт для видалення.", mainMenu())];
    const contact = await getContactById(env, user.id, contactId);
    if (!contact) return [telegram.sendMessage(env, chatId, "Контакт уже видалено або не знайдено.", mainMenu())];
    return renderDeleteConfirmation(env, chatId, contact);
  }
  if (data.startsWith("contact:delete:confirm:")) {
    await clearState(env, user.id);
    const contactId = parseContactId(data, "contact:delete:confirm:");
    if (!contactId) return [telegram.sendMessage(env, chatId, "Не вдалося визначити контакт для видалення.", mainMenu())];
    const deleted = await deleteContact(env, user.id, contactId);
    if (!deleted) return [telegram.sendMessage(env, chatId, "Контакт уже видалено або не знайдено.", mainMenu())];
    return [
      telegram.sendMessage(env, chatId, `Контакт видалено:\n${contactLine(deleted)}`, mainMenu())
    ];
  }
  if (data === "contact:delete:cancel") {
    await clearState(env, user.id);
    return [telegram.sendMessage(env, chatId, "Видалення скасовано.", mainMenu())];
  }
  if (data === "menu:settings") {
    await clearState(env, user.id);
    const settings = await getSettings(env, user.id);
    return renderSettings(env, chatId, settings);
  }
  if (data === "settings:toggle") {
    await toggleSettings(env, user.id);
    const settings = await getSettings(env, user.id);
    return renderSettings(env, chatId, settings);
  }
  if (data.startsWith("settings:days:")) {
    const value = data.replace("settings:days:", "");
    if (value === "custom") {
      await setState(env, user.id, "waiting_reminder_days");
      return [telegram.sendMessage(env, chatId, "Введи дні через кому. Доступні значення: 0, 1, 3, 7, 14, 30.")];
    }
    const days = parseReminderDays(value);
    if (days) await updateSettingsDays(env, user.id, days);
    const settings = await getSettings(env, user.id);
    return renderSettings(env, chatId, settings);
  }
  if (data.startsWith("settings:time:")) {
    const value = data.replace("settings:time:", "");
    if (value === "custom") {
      await setState(env, user.id, "waiting_reminder_time");
      return [telegram.sendMessage(env, chatId, "Введи час у форматі HH:MM, наприклад 09:00 або 18:30.")];
    }
    const time = parseReminderTime(value);
    if (time) await updateSettingsTime(env, user.id, time);
    const settings = await getSettings(env, user.id);
    return renderSettings(env, chatId, settings);
  }
  return [telegram.sendMessage(env, chatId, "Не впізнав дію. Повертаю меню.", mainMenu())];
}

module.exports = { handleCallback };
