# Telegram Birthday Bot

Бот для Telegram, який зберігає дні народження контактів і нагадує про них вчасно.

Працює на Node-RED + PostgreSQL. Інтеграція з Telegram зроблена через REST API (без спеціальних Telegram-вузлів).

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
psql -h localhost -U birthday_bot -d birthday_bot -f Database/init.sql

# Потім запустити Node-RED:
./scripts/start-node-red.sh
```

Node-RED буде на `http://localhost:1880/admin` (логін: `admin`).

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
- Адмін-панель Node-RED захищена паролем
- Введення користувача валідується (дати, імена, username)
- Дублікати нагадувань блокуються на рівні БД
- Критичні помилки надсилаються вам у Telegram

## Структура проєкту

```
src/lib/
├── bot.js              — головна точка входу
├── core/               — підключення до БД і Telegram API
├── domain/             — бізнес-логіка (контакти, нагадування)
├── handlers/           — обробка команд і кнопок
├── ui/                 — меню і тексти повідомлень
└── utils/              — парсери, форматування, дати
```

## Документація

- [Як все влаштовано](docs/ARCHITECTURE.md)
- [Чеклист для демонстрації](docs/DEMO_CHECKLIST.md)
- [Структура папок](docs/Project_Folders_Structure_Blueprint.md)
- [Схема БД](docs/dbdiagram.dbml) — скопіюй вміст і встав на [dbdiagram.io](https://dbdiagram.io/d)
