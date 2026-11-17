#!/usr/bin/env bash
# Deploy prebuilt images (built by the "Release" GitHub Actions workflow) on a server: back up the database,
# pull the images, restart, and wait until the app reports healthy. Nothing is built on the server.
#
# Usage (normally run by the Release/Ops workflows over SSH):
#   IMAGE_TAG=sha-abc1234 scripts/deploy.sh          # a specific build
#   scripts/deploy.sh                                # the image tag already in .env.selfhost (default: main)
# Optional: WEB_IMAGE / TOOLS_IMAGE override the image names saved in .env.selfhost.
set -euo pipefail
cd "$(dirname "$0")/.."
ENV_FILE=.env.selfhost
[ -f "$ENV_FILE" ] || { echo "No $ENV_FILE yet: run scripts/selfhost-setup.sh <domain> <email> first."; exit 1; }

# Portable "set KEY=value" in the env file (GNU and macOS sed differ on -i).
set_var() {
  local key="$1" value="$2"
  if grep -q "^${key}=" "$ENV_FILE"; then
    sed "s|^${key}=.*|${key}=${value}|" "$ENV_FILE" > "$ENV_FILE.tmp" && mv "$ENV_FILE.tmp" "$ENV_FILE"
  else
    printf '%s=%s\n' "$key" "$value" >> "$ENV_FILE"
  fi
  chmod 600 "$ENV_FILE"
}
[ -n "${WEB_IMAGE:-}" ] && set_var WEB_IMAGE "$WEB_IMAGE"
[ -n "${TOOLS_IMAGE:-}" ] && set_var TOOLS_IMAGE "$TOOLS_IMAGE"
[ -n "${IMAGE_TAG:-}" ] && set_var IMAGE_TAG "$IMAGE_TAG" && set_var APP_VERSION "$IMAGE_TAG"
grep -q '^WEB_IMAGE=.\+' "$ENV_FILE" || { echo "WEB_IMAGE is not set in $ENV_FILE (e.g. ghcr.io/<owner>/ailit-web)."; exit 1; }

COMPOSE=(docker compose -f docker-compose.selfhost.yml --env-file "$ENV_FILE")
PROFILES=(--profile https)
grep -q '^PUBLIC_URL=http://localhost' "$ENV_FILE" && PROFILES=()
[ "${NO_CADDY:-}" = 1 ] && PROFILES=()
mkdir -p backups

echo "1/4 Backing up the database (if it is running)"
if [ -n "$("${COMPOSE[@]}" ps -q db 2>/dev/null)" ]; then
  "${COMPOSE[@]}" exec -T db sh -c 'pg_dump -U ailit -Fc ailit' > "backups/ailit-pre-deploy-$(date +%F-%H%M).dump"
else
  echo "   database not running yet (first deploy): nothing to back up"
fi

echo "2/4 Pulling the app images ($(grep '^IMAGE_TAG=' "$ENV_FILE" | cut -d= -f2-))"
# Only the app's own images are refreshed on every deploy. Third-party images (Postgres, Caddy, curl) are
# fetched by "up" only when missing, which keeps Docker Hub's anonymous rate limit out of the way.
retry() { for i in 1 2 3 4; do "$@" && return 0; echo "   retrying in $((i * 15))s"; sleep $((i * 15)); done; "$@"; }
retry "${COMPOSE[@]}" --profile tools pull --quiet web tools

echo "3/4 Starting"
retry "${COMPOSE[@]}" "${PROFILES[@]}" up -d --no-build --remove-orphans --pull missing

echo "4/4 Waiting for the app to report healthy"
for _ in $(seq 1 60); do
  if out=$(curl -fsS http://127.0.0.1:8080/api/health 2>/dev/null); then
    echo "Healthy: $out"
    # Free disk space: drop older builds of the app images (keeping this one and "main") and dangling layers.
    current=$(grep '^IMAGE_TAG=' "$ENV_FILE" | cut -d= -f2-)
    for key in WEB_IMAGE TOOLS_IMAGE; do
      repo=$(grep "^${key}=" "$ENV_FILE" | cut -d= -f2-)
      [ -n "$repo" ] || continue
      docker images "$repo" --format '{{.Tag}}' | grep -vx -e "$current" -e main | while read -r old; do
        docker rmi "$repo:$old" >/dev/null 2>&1 || true
      done
    done
    docker image prune -f >/dev/null 2>&1 || true
    exit 0
  fi
  sleep 5
done
echo "The app did not become healthy within 5 minutes. Recent logs:"
"${COMPOSE[@]}" logs --tail 80 web || true
exit 1
