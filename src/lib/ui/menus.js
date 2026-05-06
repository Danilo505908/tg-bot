"use strict";

function mainMenu() {
  return {
    inline_keyboard: [
      [{ text: "Додати контакт", callback_data: "menu:add" }],
      [
        { text: "Мої контакти", callback_data: "menu:list" },
        { text: "Пошук", callback_data: "menu:search" }
      ],
      [{ text: "Найближчі дні народження", callback_data: "menu:upcoming" }],
      [{ text: "Налаштування нагадувань", callback_data: "menu:settings" }]
    ]
  };
}

function contactDeleteMenu(contacts) {
  return {
    inline_keyboard: [
      ...contacts.map((contact, index) => [
        { text: `Видалити ${index + 1}`, callback_data: `contact:delete:ask:${contact.id}` }
      ]),
      [{ text: "Головне меню", callback_data: "menu:home" }]
    ]
  };
}

function deleteConfirmMenu(contactId) {
  return {
    inline_keyboard: [
      [{ text: "Так, видалити", callback_data: `contact:delete:confirm:${contactId}` }],
      [{ text: "Скасувати", callback_data: "contact:delete:cancel" }]
    ]
  };
}

function settingsMenu(settings) {
  const enabledText = settings.enabled ? "Вимкнути нагадування" : "Увімкнути нагадування";

  return {
    inline_keyboard: [
      [{ text: enabledText, callback_data: "settings:toggle" }],
      [
        { text: "В день", callback_data: "settings:days:0" },
        { text: "За 1 день", callback_data: "settings:days:1" },
        { text: "За 7 днів", callback_data: "settings:days:7" }
      ],
      [
        { text: "0,1,7", callback_data: "settings:days:0,1,7" },
        { text: "Власні дні", callback_data: "settings:days:custom" }
      ],
      [
        { text: "09:00", callback_data: "settings:time:09:00" },
        { text: "12:00", callback_data: "settings:time:12:00" },
        { text: "18:00", callback_data: "settings:time:18:00" }
      ],
      [{ text: "Власний час", callback_data: "settings:time:custom" }],
      [{ text: "Головне меню", callback_data: "menu:home" }]
    ]
  };
}

module.exports = {
  mainMenu,
  contactDeleteMenu,
  deleteConfirmMenu,
  settingsMenu
};
