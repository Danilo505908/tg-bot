#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ $# -ne 1 ]]; then
  echo "Usage: ./scripts/set-webhook.sh https://your-public-url.example" >&2
  exit 1
fi

if [[ ! -f "$ROOT_DIR/.env" ]]; then
  echo "Missing .env. Copy .env.example to .env and fill TELEGRAM_BOT_TOKEN first." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
source "$ROOT_DIR/.env"
set +a

if [[ -z "${TELEGRAM_BOT_TOKEN:-}" || "$TELEGRAM_BOT_TOKEN" == "put_your_real_bot_token_here" || "$TELEGRAM_BOT_TOKEN" == "put_botfather_token_here" ]]; then
  echo "TELEGRAM_BOT_TOKEN is not set in .env." >&2
  exit 1
fi

if [[ -z "${TELEGRAM_WEBHOOK_SECRET:-}" ]]; then
  echo "TELEGRAM_WEBHOOK_SECRET is not set in .env." >&2
  exit 1
fi

BASE_URL="${1%/}"
WEBHOOK_URL="$BASE_URL/telegram/webhook/$TELEGRAM_WEBHOOK_SECRET"

curl -sS -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"$WEBHOOK_URL\",\"secret_token\":\"$TELEGRAM_WEBHOOK_SECRET\",\"allowed_updates\":[\"message\",\"callback_query\"],\"drop_pending_updates\":true}"

echo
echo "Webhook URL: $WEBHOOK_URL"
