#!/usr/bin/env bash
# First-time setup of the self-hosted stack: writes .env.selfhost with strong random secrets.
# Usage: scripts/selfhost-setup.sh [domain] [certificate-email]
#   scripts/selfhost-setup.sh ailearning.impact.id indra@impact.id
# Safe to re-run: an existing .env.selfhost is never overwritten.
set -euo pipefail
cd "$(dirname "$0")/.."

DOMAIN="${1:-ailearning.impact.id}"
ACME_EMAIL="${2:-indra@impact.id}"
ENV_FILE=.env.selfhost

command -v docker >/dev/null || { echo "Docker is not installed: https://docs.docker.com/engine/install/"; exit 1; }
docker compose version >/dev/null 2>&1 || { echo "Docker Compose v2 is missing (the 'docker compose' plugin)."; exit 1; }

if [ -f "$ENV_FILE" ]; then
  echo "$ENV_FILE already exists; leaving it as it is."
else
  rand() { od -An -N"$1" -tx1 /dev/urandom | tr -d ' \n'; }
  cp .env.selfhost.example "$ENV_FILE"
  set_var() {
    local key="$1" value="$2"
    if grep -q "^${key}=" "$ENV_FILE"; then
      sed -i "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
    else
      printf '%s=%s\n' "$key" "$value" >> "$ENV_FILE"
    fi
  }
  set_var PUBLIC_URL "https://${DOMAIN}"
  set_var DOMAIN "$DOMAIN"
  set_var ACME_EMAIL "$ACME_EMAIL"
  set_var DB_PASSWORD "$(rand 24)"
  set_var PAYLOAD_SECRET "$(rand 32)"
  set_var STORAGE_PASSWORD "$(rand 24)"
  set_var PAYMENTS_WEBHOOK_SECRET "$(rand 24)"
  set_var CRON_SECRET "$(rand 32)"
  set_var APP_VERSION "$(git rev-parse --short HEAD 2>/dev/null || echo dev)"
  chmod 600 "$ENV_FILE"
  echo "Wrote $ENV_FILE with random secrets (readable by you only). Keep a copy somewhere safe, off this"
  echo "server: PAYLOAD_SECRET must stay the same when a backup is restored on a new server."
fi

mkdir -p backups

cat <<EOF

Next steps (details in docs/hosting.md):
  1. Point the DNS A record of ${DOMAIN} at this server; open ports 80 and 443.
  2. Start everything (the first build takes several minutes):
       docker compose -f docker-compose.selfhost.yml --env-file ${ENV_FILE} --profile https up -d --build
  3. Load the curriculum and content:
       docker compose -f docker-compose.selfhost.yml --env-file ${ENV_FILE} --profile tools run --rm tools seed
  4. Create the first platform admin:
       docker compose -f docker-compose.selfhost.yml --env-file ${ENV_FILE} --profile tools run --rm \\
         -e ADMIN_EMAIL=you@impact.id -e ADMIN_PASSWORD='a-long-password' -e ADMIN_NAME='Your Name' tools create-admin
  5. Open https://${DOMAIN}/api/health, then sign in at https://${DOMAIN}/masuk.
EOF
