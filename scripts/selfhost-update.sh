#!/usr/bin/env bash
# Update the self-hosted stack to the latest code: back up, rebuild, restart, wait until healthy.
# Usage: scripts/selfhost-update.sh [git-ref]      (default: origin/main)
# Migrations run automatically when the new web container starts. To roll back, see docs/hosting.md.
set -euo pipefail
cd "$(dirname "$0")/.."
REF="${1:-origin/main}"
COMPOSE=(docker compose -f docker-compose.selfhost.yml --env-file .env.selfhost)
PROFILES=(--profile https)
[ "${NO_CADDY:-}" = 1 ] && PROFILES=()
# On your own computer (PUBLIC_URL is localhost) there is no Caddy.
grep -q '^PUBLIC_URL=http://localhost' .env.selfhost && PROFILES=()

echo "1/4 Backing up the database before the update"
"${COMPOSE[@]}" exec -T db sh -c 'pg_dump -U ailit -Fc ailit' > "backups/ailit-pre-update-$(date +%F-%H%M).dump"

echo "2/4 Fetching $REF"
git fetch --quiet origin
git checkout --quiet --detach "$REF"
VERSION="$(git rev-parse --short HEAD)"
sed "s|^APP_VERSION=.*|APP_VERSION=${VERSION}|" .env.selfhost > .env.selfhost.tmp && mv .env.selfhost.tmp .env.selfhost
grep -q '^APP_VERSION=' .env.selfhost || echo "APP_VERSION=${VERSION}" >> .env.selfhost

echo "3/4 Building and restarting ($VERSION)"
"${COMPOSE[@]}" "${PROFILES[@]}" up -d --build

echo "4/4 Waiting for the app to report healthy"
for _ in $(seq 1 60); do
  if curl -fsS http://127.0.0.1:8080/api/health >/dev/null 2>&1; then
    echo "Healthy: $(curl -fsS http://127.0.0.1:8080/api/health)"
    exit 0
  fi
  sleep 5
done
echo "The app did not become healthy within 5 minutes. Check: ${COMPOSE[*]} logs --tail 200 web"
exit 1
