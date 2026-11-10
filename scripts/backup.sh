#!/usr/bin/env bash
# Manual database backup (the self-host stack also takes one every night).
# Usage: DATABASE_URI=postgres://user:pass@host:5432/db scripts/backup.sh [output-dir]
set -euo pipefail

: "${DATABASE_URI:?Set DATABASE_URI to the database to back up}"
OUT_DIR="${1:-./backups}"
mkdir -p "$OUT_DIR"
FILE="$OUT_DIR/ailit-$(date +%F-%H%M).dump"

# Custom format: compressed, and restorable table by table if ever needed.
pg_dump --format=custom --no-owner --dbname="$DATABASE_URI" --file="$FILE"
echo "Backup written: $FILE ($(du -h "$FILE" | cut -f1))"
