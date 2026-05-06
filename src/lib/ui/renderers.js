"use strict";

const { chunkText, contactLine, escapeHtml } = require("../utils/formatters");
const { daysUntilNextBirthday } = require("../utils/date-math");
const telegram = require("../core/telegram");
const { mainMenu, contactDeleteMenu, deleteConfirmMenu, settingsMenu } = require("./menus");


function messageChunks(env, chatId, text, replyMarkup) {
  const chunks = chunkText(text);
  return chunks.map((chunk, index) =>
    telegram.sendMessage(env, chatId, chunk, index === chunks.length - 1 ? replyMarkup : undefined)
  );
}

function renderContactList(env, chatId, contacts) {
  if (!contacts.length) {
    return [
      telegram.sendMessage(
        env,
        chatId,
        "У тебе ще немає збережених контактів. Натисни «Додати контакт», щоб створити перший запис.",
        mainMenu()
      )
    ];
  }

  const text = [
    "<b>Твої контакти</b>",
    "",
    ...contacts.map((contact, index) => `${index + 1}. ${contactLine(contact)}`)
  ].join("\n");

  return messageChunks(env, chatId, text, contactDeleteMenu(contacts));
}

function renderDeleteSearchResults(env, chatId, contacts) {
  const text = [
    "<b>Кого видалити?</b>",
    "",
    ...contacts.map((contact, index) => `${index + 1}. ${contactLine(contact)}`),
    "",
    "Обери контакт зі списку."
  ].join("\n");

  return messageChunks(env, chatId, text, contactDeleteMenu(contacts));
}

function renderDeleteConfirmation(env, chatId, contact) {
  const text = [
    "<b>Підтвердження видалення</b>",
    "",
    `Видалити контакт?`,
    contactLine(contact)
  ].join("\n");

  return [telegram.sendMessage(env, chatId, text, deleteConfirmMenu(contact.id))];
}

function renderUpcoming(env, chatId, contacts) {
  if (!contacts.length) {
    return [telegram.sendMessage(env, chatId, "Контактів поки немає.", mainMenu())];
  }

  const rows = contacts
    .filter((contact) => contact.birth_date)
    .map((contact) => ({
      contact,
      birthday: daysUntilNextBirthday(contact.birth_date)
    }))
    .sort((a, b) => a.birthday.days - b.birthday.days)
    .slice(0, 10);

  const text = [
    "<b>Найближчі дні народження</b>",
    "",
    ...rows.map(({ contact, birthday }, index) => {
      const dayLabel = birthday.days === 0 ? "сьогодні" : `через ${birthday.days} дн.`;
      return `${index + 1}. ${contactLine(contact)} — ${dayLabel}, ${birthday.age} років`;
    })
  ].join("\n");

  return [telegram.sendMessage(env, chatId, text, mainMenu())];
}

function renderSettings(env, chatId, settings) {
  const days = settings.remind_days_before.join(", ");
  const status = settings.enabled ? "увімкнено" : "вимкнено";
  const text = [
    "<b>Налаштування нагадувань</b>",
    "",
    `Статус: ${status}`,
    `Дні до події: ${escapeHtml(days)}`,
    `Час: ${escapeHtml(settings.remind_time)}`,
    `Часовий пояс: ${escapeHtml(settings.timezone)}`,
    "",
    "Обери готовий варіант або введи власні значення."
  ].join("\n");

  return [telegram.sendMessage(env, chatId, text, settingsMenu(settings))];
}

function reminderText(row, birthdayDate, daysBefore) {
  const name = `${escapeHtml(row.first_name)} ${escapeHtml(row.last_name)}`;
  const username = row.telegram_username ? `\nTelegram: ${escapeHtml(row.telegram_username)}` : "";
  const [birthYear] = row.birth_date.split("-").map(Number);
  const age = birthdayDate.year - birthYear;

  const lead =
    daysBefore === 0
      ? `Сьогодні день народження у ${name}.`
      : `Через ${daysBefore} дн. день народження у ${name}.`;

  return [
    "<b>Нагадування</b>",
    "",
    lead,
    `Дата: ${String(birthdayDate.day).padStart(2, "0")}.${String(birthdayDate.month).padStart(2, "0")}.${birthdayDate.year}`,
    `Виповнюється: ${age} років`,
    username
  ].filter(Boolean).join("\n");
}

module.exports = {
  messageChunks,
  renderContactList,
  renderDeleteSearchResults,
  renderDeleteConfirmation,
  renderUpcoming,
  renderSettings,
  reminderText
};
