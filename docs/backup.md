# Backups and restore

## What is backed up

| Data | How | Kept |
|---|---|---|
| Database (all platform data) | `backup` service in `docker-compose.selfhost.yml`, every night, `pg_dump` custom format into `./backups` | 14 days (older dumps removed automatically) |
| Media files (images, uploads) | Copy the MinIO volume or bucket, for example `mc mirror local/ailit-media ./media-backup` | Follow the same 14-day cycle |

Keep at least one copy **off the server** (another machine or cloud storage), so a lost server does not take the backups with it.

## Manual backup

```bash
DATABASE_URI=postgres://ailit:PASSWORD@localhost:5432/ailit scripts/backup.sh ./backups
```

## Restore (always into a new database first)

```bash
PG_ADMIN_URI=postgres://ailit:PASSWORD@localhost:5432/postgres scripts/restore.sh ./backups/ailit-2026-11-10.dump ailit_restored
```

1. The script creates the new database, restores into it, and prints row counts for the main tables.
2. Compare the counts with the live database (or with what you expect, if the live one is lost).
3. Switch over by pointing `DATABASE_URI` at the restored database and restarting the app.

The script refuses to restore into a database that already exists, so a live database is never overwritten by mistake.

## Restore drill log

| Date | Backup | Result |
|---|---|---|
| 10 Nov 2026 | Development database, 2.2 MB | Restored into a new database; users, lessons, progress, test attempts and AI conversations matched the source exactly; a second restore to the same name was refused as designed. |

Repeat the drill once a month and after every major upgrade, and add a row here.
