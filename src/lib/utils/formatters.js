"use strict";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function chunkText(text, maxLength = 3800) {
  if (text.length <= maxLength) {
    return [text];
  }

  const chunks = [];
  let current = "";
  for (const line of text.split("\n")) {
    if ((current + "\n" + line).length > maxLength) {
      chunks.push(current);
      current = line;
    } else {
      current = current ? `${current}\n${line}` : line;
    }
  }
  if (current) {
    chunks.push(current);
  }
  return chunks;
}

function formatDate(isoDate) {
  const [year, month, day] = isoDate.split("-");
  return `${day}.${month}.${year}`;
}

function formatName(name) {
  if (!name) return "";

  return name
    .trim()
    .split(/\s+/)
    .map(word => {
      if (word.length === 0) return "";
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

function contactLine(contact) {
  const username = contact.telegram_username ? `, ${escapeHtml(contact.telegram_username)}` : "";
  const firstName = formatName(contact.first_name);
  const lastName = formatName(contact.last_name);
  return `${escapeHtml(firstName)} ${escapeHtml(lastName)} — ${formatDate(contact.birth_date)}${username}`;
}

module.exports = {
  escapeHtml, chunkText, formatDate, contactLine, formatName
};
