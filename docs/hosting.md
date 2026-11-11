# Hosting plan

Production domain: **ailearning.impact.id**.

| Stage | Where | When |
| --- | --- | --- |
| Development | Local machine or a Claude session (`pnpm dev`) | Now |
| Testing / internal demo | IJ's own server via `docker-compose.selfhost.yml` | When the first features are usable |
| Pilot and launch | Google Cloud, Jakarta (`infra/terraform`) | Before real student data is collected |

## Self-hosted server

Everything runs from one compose file: the app, PostgreSQL 16, S3-compatible media storage (MinIO),
nightly database backups, the hourly job runner and, optionally, Caddy for automatic HTTPS.

### What the server needs

- Linux (Ubuntu 22.04/24.04 tested in spirit; any distribution with Docker works), 2 vCPU, 4 GB RAM
  (the first build needs about 3 GB), 40 GB disk. A Jakarta data centre keeps student data in Indonesia (UU PDP).
- Docker Engine with the Compose plugin, and git.
- A DNS A record for `ailearning.impact.id` pointing at the server, and ports 80 and 443 open.

### First install

```bash
git clone https://github.com/indrakrona/ai-literacy-platform.git /opt/ai-literacy-platform
cd /opt/ai-literacy-platform
scripts/selfhost-setup.sh ailearning.impact.id indra@impact.id   # writes .env.selfhost with random secrets
docker compose -f docker-compose.selfhost.yml --env-file .env.selfhost --profile https up -d --build
```

The web container applies database migrations when it starts. When `https://ailearning.impact.id/api/health`
answers `{"ok":true,...}`, load the content and create the first platform admin:

```bash
docker compose -f docker-compose.selfhost.yml --env-file .env.selfhost --profile tools run --rm tools seed
docker compose -f docker-compose.selfhost.yml --env-file .env.selfhost --profile tools run --rm \
  -e ADMIN_EMAIL=indra@impact.id -e ADMIN_PASSWORD='a-long-password' -e ADMIN_NAME='Indra' tools create-admin
```

`seed` loads the curriculum, lessons, AILIS items, AI Lab activities, projects, website pages, badges,
the draft KKA mapping, help articles and the placeholder products. It matches content by slug or code,
so running it twice creates no duplicates, but it does reset seeded lessons to the seed text: run it once
on a new server, not after editors have started changing content. No demo accounts are created.
`create-admin` makes a **platform super admin**; running it again for the same email resets the password.
Sign in at `/masuk`, then add schools, staff and editors from `/admin` or `/admin-platform`.

### Already running Nginx or a Cloudflare Tunnel?

Leave out `--profile https` and point your proxy at `http://127.0.0.1:8080`. Forward the `Host` and
`X-Forwarded-Proto` headers and allow request bodies up to 25 MB. If the proxy is on another machine,
set `WEB_BIND=0.0.0.0:8080` in `.env.selfhost` and firewall port 8080 to that machine only.

### Updating

```bash
scripts/selfhost-update.sh            # latest main; or pass a tag/commit, e.g. scripts/selfhost-update.sh v1.2.0
```

The script backs up the database into `backups/ailit-pre-update-*.dump`, checks out the code, rebuilds,
restarts and waits until `/api/health` is healthy (add `NO_CADDY=1` if you do not use the https profile).
Migrations run on start-up.

**Rolling back:** run the script with the previous commit. If that release's migrations changed data,
restore the pre-update dump first (see [backup.md](backup.md)) — migrations only move forward.

### Day-to-day

| Task | Command (prefix: `docker compose -f docker-compose.selfhost.yml --env-file .env.selfhost`) |
| --- | --- |
| Status and health | `ps` — the web service shows `healthy` |
| Logs | `logs --tail 200 web` (also `caddy`, `scheduler`, `backup`) |
| Restart the app | `restart web` |
| Run the hourly jobs now | `exec scheduler sh -c 'curl -fsS -X POST -H "x-cron-secret: $CRON_SECRET" http://web:8080/api/jobs/run'` |
| Database shell | `exec db psql -U ailit ailit` |

Uptime monitoring: point any monitor (UptimeRobot, Better Stack, Google Cloud uptime checks) at
`https://ailearning.impact.id/api/health`. It returns 200 when the app and database are up and 503 otherwise.

### Backups

The `backup` service writes one database dump per night into `./backups` and keeps `BACKUP_KEEP_DAYS`
(14). Copy them, and the media bucket, **off the server** every night — see [backup.md](backup.md) for an
rclone example and the restore procedure. Keep `.env.selfhost` in a password manager too.

### Third-party services

The stack runs without any of them; each feature switches on when its settings are added to `.env.selfhost`
and the web container is restarted (`up -d`):

| Service | Settings | Guide |
| --- | --- | --- |
| AI tutor and AI Lab (Anthropic) | `ANTHROPIC_API_KEY` | — |
| Email (sign-in codes, receipts, reminders) | `SMTP_*`, `EMAIL_FROM` | — |
| Online payments | `PAYMENTS_PROVIDER`, `MIDTRANS_*` or `XENDIT_*` | [payments.md](payments.md) |
| WhatsApp messages | `WHATSAPP_*` | [whatsapp.md](whatsapp.md) |
| Google sign-in | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | [sign-in.md](sign-in.md) |
| Analytics | `NEXT_PUBLIC_GA_ID` (needs a rebuild), `POSTHOG_*` | — |

Before going live set `PAYMENTS_ALLOW_MOCK=` (empty) so test payments cannot be used.

## Moving to Google Cloud later

The app is the same container image in both places; only configuration changes.

1. `terraform apply` in `infra/terraform` (staging first).
2. Restore the database: `pg_restore` the latest dump into Cloud SQL.
3. Copy media from the self-hosted storage to the Cloud Storage bucket (`mc mirror` or `gsutil rsync`).
4. Point ailearning.impact.id at Cloud Run.

Before collecting real student data, check that the server's location and access controls meet UU PDP:
data should stay in Indonesia and only named staff should have access.
