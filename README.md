# Telegram Birthday Bot

Бот для Telegram, який зберігає дні народження контактів і нагадує про них вчасно.

Працює на Node-RED + PostgreSQL. Інтеграція з Telegram зроблена через REST API (без спеціальних Telegram-вузлів).
Уся бізнес-логіка бота знаходиться в Node-RED flow `src/flows.json`.

## Що вміє бот

- `/start` — реєстрація і головне меню
- **Додати контакт** — ім'я, прізвище, дата народження, Telegram нік
- **Мої контакти** — список всіх збережених з inline-видаленням
- **Пошук** — знайти контакт по імені
- `/delete` — знайти контакт по імені та видалити після підтвердження
- **Найближчі дні народження** — хто святкує найближчим часом
- **Налаштування нагадувань** — коли і за скільки днів нагадувати

## Швидкий старт

### 1. Підготовка

```bash
cp .env.example .env
```

Заповни в `.env`:
- `TELEGRAM_BOT_TOKEN` — токен від @BotFather
- `TELEGRAM_WEBHOOK_SECRET` — будь-який довгий рядок
- `POSTGRES_PASSWORD` — пароль для бази
- `NODE_RED_CREDENTIAL_SECRET` — ключ шифрування
- `ADMIN_CHAT_ID` — ваш Telegram ID (для сповіщень про помилки)

### 2. Запуск локально

```bash
# Запустити PostgreSQL окремо і застосувати схему:
psql -h localhost -U birthday_bot -d birthday_bot -f database/init.sql

# Потім запустити Node-RED:
./scripts/start-node-red.sh
```

Node-RED буде на `http://localhost:1880/admin`. Для продакшену увімкни `adminAuth` у `src/settings.js`.

### 3. Webhook

Для роботи з Telegram потрібен HTTPS. Оскільки у вас є віддалений сервер:

```bash
./scripts/set-webhook.sh https://ваша-адреса-сервера.com
./scripts/webhook-info.sh
```

## Безпека

- SQL-запити параметризовані — захист від SQL injection
- LIKE-спецсимволи екрануються — захист від LIKE injection
- Webhook secret перевіряється в URL і заголовку
- Адмін-панель Node-RED можна захистити через `adminAuth` у `src/settings.js`
- Введення користувача валідується (дати, імена, username)
- Дублікати нагадувань блокуються на рівні БД
- Критичні помилки надсилаються вам у Telegram

## Структура проєкту

```
src/
├── flows.json          — Node-RED flow з усім функціоналом бота
├── settings.js         — налаштування Node-RED runtime
├── package.json        — залежності function nodes, зокрема pg
└── package-lock.json

database/
└── init.sql            — схема PostgreSQL

scripts/
├── start-node-red.sh   — локальний запуск Node-RED
├── set-webhook.sh      — реєстрація Telegram webhook
└── webhook-info.sh     — перевірка webhook
```

## Документація

- [Як все влаштовано](docs/ARCHITECTURE.md)
- [Схема БД](docs/dbdiagram.dbml) — скопіюй вміст і встав на [dbdiagram.io](https://dbdiagram.io/d)
