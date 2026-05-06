"use strict";

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function normalizeBirthdayDate(year, month, day) {
  if (month === 2 && day === 29 && !isLeapYear(year)) {
    return { year, month: 3, day: 1 };
  }
  return { year, month, day };
}

function dateFromParts(year, month, day) {
  const safeMonth = month === 2 && day === 29 && !isLeapYear(year) ? 3 : month;
  const safeDay = month === 2 && day === 29 && !isLeapYear(year) ? 1 : day;
  return new Date(Date.UTC(year, safeMonth - 1, safeDay));
}

function daysUntilNextBirthday(isoDate, fromDate = new Date()) {
  const [birthYear, month, day] = isoDate.split("-").map(Number);
  const today = new Date(Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate()));
  let next = dateFromParts(today.getUTCFullYear(), month, day);
  if (next < today) {
    next = dateFromParts(today.getUTCFullYear() + 1, month, day);
  }
  const days = Math.round((next - today) / 86400000);
  return { days, age: next.getUTCFullYear() - birthYear, date: next.toISOString().slice(0, 10) };
}

function toIsoDate(year, month, day) {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function localParts(timezone, now = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false, hourCycle: "h23"
  });
  const parts = Object.fromEntries(formatter.formatToParts(now).map((part) => [part.type, part.value]));
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day), hour: parts.hour, minute: parts.minute };
}

function addDays(year, month, day, days) {
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

function birthdayMatchesTarget(birthDateIso, target) {
  const [, birthMonth, birthDay] = birthDateIso.split("-").map(Number);
  const normalized = normalizeBirthdayDate(target.year, birthMonth, birthDay);
  return normalized.month === target.month && normalized.day === target.day;
}

module.exports = {
  isLeapYear, normalizeBirthdayDate, dateFromParts, daysUntilNextBirthday,
  toIsoDate, localParts, addDays, birthdayMatchesTarget
};
