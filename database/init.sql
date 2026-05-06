CREATE TABLE IF NOT EXISTS app_users (
  id BIGSERIAL PRIMARY KEY,
  telegram_user_id BIGINT NOT NULL UNIQUE,
  chat_id BIGINT NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  language_code TEXT,
  timezone TEXT NOT NULL DEFAULT 'Europe/Kyiv',
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contacts (
  id BIGSERIAL PRIMARY KEY,
  owner_user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL CHECK (char_length(btrim(first_name)) BETWEEN 1 AND 80),
  last_name TEXT NOT NULL CHECK (char_length(btrim(last_name)) BETWEEN 1 AND 80),
  first_name_key TEXT GENERATED ALWAYS AS (lower(btrim(first_name))) STORED,
  last_name_key TEXT GENERATED ALWAYS AS (lower(btrim(last_name))) STORED,
  birth_date DATE NOT NULL CHECK (birth_date >= DATE '1900-01-01'),
  telegram_username TEXT CHECK (
    telegram_username IS NULL OR telegram_username ~ '^@[A-Za-z0-9_]{5,32}$'
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_user_id, first_name_key, last_name_key, birth_date)
);

CREATE INDEX IF NOT EXISTS contacts_owner_name_idx
  ON contacts (owner_user_id, first_name_key, last_name_key);

CREATE TABLE IF NOT EXISTS reminder_settings (
  user_id BIGINT PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  remind_days_before INTEGER[] NOT NULL DEFAULT ARRAY[0],
  remind_time TIME NOT NULL DEFAULT TIME '09:00',
  timezone TEXT NOT NULL DEFAULT 'Europe/Kyiv',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (coalesce(array_length(remind_days_before, 1), 0) BETWEEN 1 AND 5),
  CHECK (remind_days_before <@ ARRAY[0, 1, 3, 7, 14, 30])
);

CREATE TABLE IF NOT EXISTS conversation_states (
  user_id BIGINT PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
  state TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reminder_log (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  contact_id BIGINT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  remind_for_date DATE NOT NULL,
  days_before INTEGER NOT NULL CHECK (days_before IN (0, 1, 3, 7, 14, 30)),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, contact_id, remind_for_date, days_before)
);

CREATE INDEX IF NOT EXISTS reminder_log_sent_at_idx
  ON reminder_log (sent_at);
