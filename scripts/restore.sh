#!/usr/bin/env bash
# Restore a backup into a NEW database, then print row counts so it can be checked before switching over.
# It refuses to touch a database that already exists, so a live database is never overwritten by mistake.
# Usage: PG_ADMIN_URI=postgres://user:pass@host:5432/postgres scripts/restore.sh <file.dump> <new-db-name>
set -euo pipefail

: "${PG_ADMIN_URI:?Set PG_ADMIN_URI to a connection on the server (e.g. .../postgres)}"
DUMP="${1:?Give the backup file}"
TARGET="${2:?Give a name for the new database}"
[[ -f "$DUMP" ]] || { echo "No such file: $DUMP" >&2; exit 1; }
[[ "$TARGET" =~ ^[a-z0-9_]+$ ]] || { echo "Database name may only contain a-z, 0-9 and _" >&2; exit 1; }

EXISTS=$(psql "$PG_ADMIN_URI" -Atc "select 1 from pg_database where datname = '$TARGET'")
if [[ "$EXISTS" == "1" ]]; then
  echo "Database $TARGET already exists. Choose a new name; restore never overwrites." >&2
  exit 1
fi

psql "$PG_ADMIN_URI" -qc "create database $TARGET"
TARGET_URI="${PG_ADMIN_URI%/*}/$TARGET"
pg_restore --no-owner --exit-on-error --dbname="$TARGET_URI" "$DUMP"

echo "Restored into $TARGET. Row counts:"
for t in users schools classes lessons lesson_progress test_items test_attempts submissions ai_conversations audit_logs payload_migrations; do
  printf '  %-20s %s\n' "$t" "$(psql "$TARGET_URI" -Atc "select count(*) from $t" 2>/dev/null || echo 'missing')"
done
echo "Check the counts against the live database, then point DATABASE_URI at $TARGET to switch."
