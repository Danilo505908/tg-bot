"use strict";

const ALLOWED_REMINDER_DAYS = new Set([0, 1, 3, 7, 14, 30]);

function normalizeText(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function parseFullName(text) {
  const normalized = normalizeText(text);
  const parts = normalized.split(" ");
  if (parts.length < 2) return null;
  const { formatName } = require("./formatters");
  const firstName = formatName(parts[0]);
  const lastName = formatName(parts.slice(1).join(" "));
  if (firstName.length > 80 || lastName.length > 80) return null;
  return { firstName, lastName };
}

function parseBirthDate(text) {
  const now = new Date();
  const value = normalizeText(text);
  const match = value.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const nowYear = now.getUTCFullYear();
  if (year < 1900 || year > nowYear || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day || date > todayUtc) return null;
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function normalizeUsername(text) {
  const value = normalizeText(text);
  if (!value || value === "-" || value.toLowerCase() === "немає") return null;
  const username = value.startsWith("@") ? value : `@${value}`;
  return /^@[A-Za-z0-9_]{5,32}$/.test(username) ? username : undefined;
}

function parseReminderDays(text) {
  const values = normalizeText(text).split(",").map((part) => Number(part.trim())).filter((value) => Number.isInteger(value));
  const unique = [...new Set(values)].sort((a, b) => a - b);
  if (!unique.length || unique.length > 5 || unique.some((value) => !ALLOWED_REMINDER_DAYS.has(value))) return null;
  return unique;
}

function parseReminderTime(text) {
  const match = normalizeText(text).match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  return match ? `${match[1]}:${match[2]}` : null;
}

module.exports = {
  normalizeText, parseFullName, parseBirthDate, normalizeUsername, parseReminderDays, parseReminderTime
};
