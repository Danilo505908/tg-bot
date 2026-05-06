#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

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

curl -sS "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo"
echo
