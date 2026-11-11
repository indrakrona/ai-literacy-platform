#!/bin/sh
# Entry point of the "tools" container (docker-compose.selfhost.yml, profile "tools").
#   seed          load the curriculum, AILIS items, help centre and placeholder products (safe to re-run)
#   create-admin  create or promote a super admin from ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME
#   migrate       apply database migrations now (the web container also does this on boot)
set -e
case "${1:-help}" in
  seed) exec pnpm payload run src/seed/run.ts ;;
  create-admin) exec pnpm payload run src/seed/create-admin.ts ;;
  migrate) exec pnpm payload migrate ;;
  *) echo "Usage: seed | create-admin | migrate"; exit 1 ;;
esac
