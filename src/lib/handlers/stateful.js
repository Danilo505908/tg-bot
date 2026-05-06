"use strict";

const telegram = require("../core/telegram");
const { parseFullName, parseBirthDate, normalizeUsername, parseReminderDays, parseReminderTime, normalizeText } = require("../utils/parsers");
const { setState, clearState } = require("../domain/user-state");
const { addOrUpdateContact, searchContacts } = require("../domain/contacts");
const { getSettings, updateSettingsDays, updateSettingsTime } = require("../domain/reminders");
const { renderDeleteSearchResults, renderSettings, messageChunks } = require("../ui/renderers");
const { contactLine } = require("../utils/formatters");
const { mainMenu } = require("../ui/menus");

async function handleStatefulText(env, chatId, user, state, text) {
  if (state.state === "waiting_contact_name") {
    const fullName = parseFullName(text);
    if (!fullName) return [telegram.sendMessage(env, chatId, "Введи імʼя та прізвище двома словами, наприклад: Іван Петренко")];
    await setState(env, user.id, "waiting_contact_birth_date", fullName);
    return [telegram.sendMessage(env, chatId, "Тепер введи дату народження у форматі ДД.ММ.РРРР, наприклад: 14.08.1999")];
  }
  if (state.state === "waiting_contact_birth_date") {
    const birthDate = parseBirthDate(text);
    if (!birthDate) return [telegram.sendMessage(env, chatId, "Дата має бути реальною і з роком: ДД.ММ.РРРР. Спробуй ще раз.")];
    await setState(env, user.id, "waiting_contact_username", { ...state.data, birthDate });
    return [telegram.sendMessage(env, chatId, "Введи Telegram нік контакту, наприклад @username. Якщо його немає, введи «-».")];
  }
  if (state.state === "waiting_contact_username") {
    const username = normalizeUsername(text);
    if (username === undefined) return [telegram.sendMessage(env, chatId, "Telegram нік має бути у форматі @username, 5-32 символи: латиниця, цифри або _. Або введи «-».")];
    const contact = await addOrUpdateContact(env, user.id, { ...state.data, telegramUsername: username });
    await clearState(env, user.id);
    return [telegram.sendMessage(env, chatId, `Готово, контакт збережено:\n${contactLine(contact)}`, mainMenu())];
  }
  if (state.state === "waiting_search_query") {
    const query = normalizeText(text);
    if (query.length < 2) return [telegram.sendMessage(env, chatId, "Введи хоча б 2 символи для пошуку.")];
    const contacts = await searchContacts(env, user.id, query);
    await clearState(env, user.id);
    if (!contacts.length) return [telegram.sendMessage(env, chatId, "Нічого не знайдено.", mainMenu())];
    const resultText = ["<b>Результати пошуку</b>", "", ...contacts.map((contact, index) => `${index + 1}. ${contactLine(contact)}`)].join("\n");
    return messageChunks(env, chatId, resultText, mainMenu());
  }
  if (state.state === "waiting_delete_query") {
    const query = normalizeText(text);
    if (query.length < 2) return [telegram.sendMessage(env, chatId, "Введи хоча б 2 символи для пошуку контакту.")];
    const contacts = await searchContacts(env, user.id, query);
    await clearState(env, user.id);
    if (!contacts.length) return [telegram.sendMessage(env, chatId, "Нічого не знайдено.", mainMenu())];
    return renderDeleteSearchResults(env, chatId, contacts);
  }
  if (state.state === "waiting_reminder_days") {
    const days = parseReminderDays(text);
    if (!days) return [telegram.sendMessage(env, chatId, "Введи дні через кому. Доступні значення: 0, 1, 3, 7, 14, 30.")];
    await updateSettingsDays(env, user.id, days);
    await clearState(env, user.id);
    const currentSettings = await getSettings(env, user.id);
    return renderSettings(env, chatId, currentSettings);
  }
  if (state.state === "waiting_reminder_time") {
    const time = parseReminderTime(text);
    if (!time) return [telegram.sendMessage(env, chatId, "Введи час у форматі HH:MM, наприклад 09:00 або 18:30.")];
    await updateSettingsTime(env, user.id, time);
    await clearState(env, user.id);
    const currentSettings = await getSettings(env, user.id);
    return renderSettings(env, chatId, currentSettings);
  }
  await clearState(env, user.id);
  return [telegram.sendMessage(env, chatId, "Не впізнав дію. Повертаю головне меню.", mainMenu())];
}

module.exports = { handleStatefulText };
