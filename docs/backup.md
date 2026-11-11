# Backups and restore

## What is backed up

| Data | How | Kept |
|---|---|---|
| Database (all platform data) | `backup` service in `docker-compose.selfhost.yml`, every night, `pg_dump` custom format into `./backups` | 14 days (older dumps removed automatically) |
| Media files (images, uploads) | Copy the MinIO volume or bucket, for example `mc mirror local/ailit-media ./media-backup` | Follow the same 14-day cycle |

Keep at least one copy **off the server** (another machine or cloud storage), so a lost server does not take the backups with it.

## Copying backups off the server

A simple nightly job on the host, using [rclone](https://rclone.org) to any storage it supports
(Google Drive, Google Cloud Storage, S3, another server over SFTP). Configure a remote once with `rclone config`, then add to the host's crontab (`crontab -e`):

```bash
# 02:30 every night: copy new database dumps and mirror the media bucket off the server.
30 2 * * * cd /opt/ai-literacy-platform && rclone copy backups offsite:ailit-backups/db --max-age 48h
45 2 * * * cd /opt/ai-literacy-platform && docker compose -f docker-compose.selfhost.yml --env-file .env.selfhost exec -T storage sh -c 'tar -C /data -cz ailit-media' | rclone rcat offsite:ailit-backups/media/media-$(date +\%F).tgz
```

Also keep a copy of `.env.selfhost` somewhere safe (a password manager): `PAYLOAD_SECRET` must stay the same for a restored database to work with existing sign-ins.

## Manual backup

```bash
DATABASE_URI=postgres://ailit:PASSWORD@localhost:5432/ailit scripts/backup.sh ./backups
```

On the self-hosted stack the database is not exposed outside Docker; take a dump through the container instead:

```bash
docker compose -f docker-compose.selfhost.yml --env-file .env.selfhost exec -T db pg_dump -U ailit -Fc ailit > backups/ailit-manual.dump
```

`scripts/selfhost-update.sh` does this automatically before every update.

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
