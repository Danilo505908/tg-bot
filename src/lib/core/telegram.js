"use strict";

function token(env) {
  const value = env.get("TELEGRAM_BOT_TOKEN");
  if (!value) {
    throw new Error("Missing required environment variable: TELEGRAM_BOT_TOKEN");
  }
  return value;
}

function apiUrl(env, methodName) {
  return `https://api.telegram.org/bot${token(env)}/${methodName}`;
}

/**
 * Build an HTTP request descriptor for a Telegram Bot API method.
 * @param {object} env - Node-RED environment accessor
 * @param {string} methodName - Telegram API method name (e.g. "sendMessage")
 * @param {object} payload - JSON body
 * @returns {{ method: string, url: string, headers: object, payload: object }}
 */
function request(env, methodName, payload) {
  return {
    method: "POST",
    url: apiUrl(env, methodName),
    headers: {
      "Content-Type": "application/json"
    },
    payload
  };
}

/**
 * Build a sendMessage request.
 * @param {object} env
 * @param {number} chatId
 * @param {string} text - HTML-formatted message text
 * @param {object} [replyMarkup] - Inline keyboard markup
 * @returns {object} HTTP request descriptor
 */
function sendMessage(env, chatId, text, replyMarkup) {
  const payload = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true
  };

  if (replyMarkup) {
    payload.reply_markup = replyMarkup;
  }

  return request(env, "sendMessage", payload);
}

function answerCallbackQuery(env, callbackQueryId, text) {
  const payload = {
    callback_query_id: callbackQueryId
  };

  if (text) {
    payload.text = text;
  }

  return request(env, "answerCallbackQuery", payload);
}

module.exports = {
  sendMessage,
  answerCallbackQuery
};
