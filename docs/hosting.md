# Hosting plan

Production domain: **ailearning.impact.id**.

| Stage | Where | When |
| --- | --- | --- |
| Development | Local machine or a Claude session (`pnpm dev`) | Now |
| Testing / internal demo | IJ's own server via `docker-compose.selfhost.yml` | When the first features are usable |
| Pilot and launch | Google Cloud, Jakarta (`infra/terraform`) | Before real student data is collected |

## Self-hosted server

Needs Docker and a reverse proxy with HTTPS. Everything (app, PostgreSQL, S3-compatible media storage,
nightly backups) runs from one compose file:

```bash
cp .env.selfhost.example .env.selfhost   # set strong passwords
docker compose -f docker-compose.selfhost.yml --env-file .env.selfhost up -d --build
```

Backups land in `./backups`, one dump per day. Remove old dumps on a schedule that fits your disk.

## Moving to Google Cloud later

The app is the same container image in both places; only configuration changes.

1. `terraform apply` in `infra/terraform` (staging first).
2. Restore the database: `pg_restore` the latest dump into Cloud SQL.
3. Copy media from the self-hosted storage to the Cloud Storage bucket (`mc mirror` or `gsutil rsync`).
4. Point ailearning.impact.id at Cloud Run.

Before collecting real student data, check that the server's location and access controls meet UU PDP:
data should stay in Indonesia and only named staff should have access.
