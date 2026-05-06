"use strict";

const telegram = require("./core/telegram");
const { ensureUser, getState } = require("./domain/user-state");
const { handleCommand } = require("./handlers/commands");
const { handleCallback } = require("./handlers/callbacks");
const { handleStatefulText } = require("./handlers/stateful");
const { mainMenu } = require("./ui/menus");
const { normalizeText } = require("./utils/parsers");

/**
 * Main entry point for processing a Telegram webhook update.
 * Dispatches to command handlers, callback handlers, or stateful text handlers.
 *
 * @param {object} msg - Node-RED message (must contain telegramUpdate or payload)
 * @param {object} env - Node-RED environment accessor
 * @param {object} node - Node-RED node instance (for error reporting)
 * @returns {Promise<[object[], object[]]>} [outgoing requests, callback answers]
 */
async function handleTelegramUpdate(msg, env, node) {
  const update = msg.telegramUpdate || msg.payload;
  const outgoing = [];
  const callbacks = [];

  try {
    if (update.callback_query) {
      const callback = update.callback_query;
      const chatId = callback.message.chat.id;
      const user = await ensureUser(env, callback.from, chatId);

      callbacks.push(telegram.answerCallbackQuery(env, callback.id));
      outgoing.push(...(await handleCallback(env, chatId, user, callback.data || "")));
      return [outgoing, callbacks];
    }

    if (!update.message) {
      return [[], []];
    }

    const message = update.message;
    const chatId = message.chat.id;
    const user = await ensureUser(env, message.from, chatId);

    if (message.chat.type !== "private") {
      outgoing.push(telegram.sendMessage(env, chatId, "З міркувань приватності я працюю тільки в особистому чаті."));
      return [outgoing, callbacks];
    }

    const text = normalizeText(message.text);
    if (!text) {
      outgoing.push(telegram.sendMessage(env, chatId, "Поки що я розумію лише текстові повідомлення.", mainMenu()));
      return [outgoing, callbacks];
    }

    if (text.startsWith("/")) {
      outgoing.push(...(await handleCommand(env, chatId, user, text)));
      return [outgoing, callbacks];
    }

    const state = await getState(env, user.id);
    if (state) {
      outgoing.push(...(await handleStatefulText(env, chatId, user, state, text)));
      return [outgoing, callbacks];
    }

    outgoing.push(telegram.sendMessage(env, chatId, "Обери дію в меню або введи /help.", mainMenu()));
    return [outgoing, callbacks];
  } catch (error) {
    node.error(error, msg);
    const chatId =
      update.message?.chat?.id ||
      update.callback_query?.message?.chat?.id;

    if (chatId) {
      outgoing.push(
        telegram.sendMessage(
          env,
          chatId,
          "Сталася помилка. Дані не втрачено, спробуй ще раз або натисни /menu.",
          mainMenu()
        )
      );
    }
    return [outgoing, callbacks];
  }
}

module.exports = {
  handleTelegramUpdate
};
