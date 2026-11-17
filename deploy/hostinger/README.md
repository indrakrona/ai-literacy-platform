# Hostinger VPS (Docker manager + Traefik)

The staging server is a Hostinger **KVM 1** VPS in **Jakarta** (`srv2143873.hstgr.cloud`, 31.97.67.61), made from
the template "Ubuntu 24.04 with Docker and Traefik". It is run entirely through Hostinger's Docker manager
(hPanel → VPS → Docker manager, or the Hostinger API / Claude's Hostinger connector). No SSH keys or GitHub
secrets are involved.

```
push to main ─▶ Release workflow builds ghcr.io/indrakrona/ailit-web:main (public image)
Docker manager project "ailit" ─▶ "Update" pulls :main and restarts ─▶ Traefik (HTTPS, Let's Encrypt) ─▶ app
```

Only the **app** image is public. It contains the compiled app, not the source code or the seed content. The
`ailit-tools` image (full source) stays private and is not used here.

## Projects on the VPS

| Project | Compose file | Purpose |
| --- | --- | --- |
| `traefik` | from the Hostinger template | Receives ports 80/443, issues certificates, routes `DOMAIN` to the app |
| `ailit` | [docker-compose.yml](docker-compose.yml) | App, PostgreSQL, nightly backups, hourly jobs |
| `ailit-ops` | [ops-runner.yml](ops-runner.yml) | Created only for a one-off task (seed, create admin), then deleted |

The `ailit` project's environment holds its settings and secrets ([env.example](env.example)). Keep a copy of
it in a password manager: `PAYLOAD_SECRET` must stay the same for sign-ins and backups to keep working.

## First install

1. GitHub → the `ailit-web` package (Profile → Packages) → Package settings → Change visibility → **Public**.
2. DNS for `DOMAIN` (e.g. `ailearning.impact.id`): an **A** record to `31.97.67.61`, and optionally **AAAA** to
   `2a02:4780:59:2323::1`. Traefik obtains the certificate once the name resolves to the VPS.
3. Create project `ailit` from `docker-compose.yml` with the environment filled in (random secrets).
4. Load content: create project `ailit-ops` from `ops-runner.yml` with `OPS_SECRET` (same as `ailit`) and
   `OPS_BODY={"task":"seed"}`; read its logs (`"ok":true`), then delete the project.
5. Create the admin the same way with `OPS_BODY={"task":"create-admin","email":"indra@impact.id","name":"Indra"}`.
   No password is set: on the site choose **Lupa kata sandi**; while `EMAIL_TO_LOG=true` the reset link appears
   in the `ailit` project's logs.

## Troubleshooting

- **Project shows "created" with no containers**: the first start failed, usually because an image could not be
  downloaded (e.g. `ailit-web` still private; a public image such as `postgres:16` works). "Update" and "Start" do
  not rebuild a project that never started: delete it and create it again with the same compose file and
  environment (data volumes do not exist yet at that point, so nothing is lost).
- **GitHub visibility**: the repository and each package have separate settings. The VPS only needs the
  `ailit-web` package public.

## Updating

Every push to `main` publishes a new `:main` image. Press **Update** on the `ailit` project in the Docker
manager (or ask Claude), which pulls the image and restarts; migrations run on start-up. To pin or roll back,
set `IMAGE_TAG` in the environment to a build tag such as `sha-abc1234` (shown in each Release run) and update.

## Backups

The `backup` service writes `backups/ailit-<date>.dump` and `backups/media-<date>.tgz` every night under
`/docker/ailit/` on the VPS, kept 14 days. Also enable Hostinger's weekly VPS backups, and take a manual snapshot
in hPanel before big changes.

## Before real students use it

- Set up SMTP (`SMTP_*`) and set `EMAIL_TO_LOG=false`.
- Set `PAYMENTS_ALLOW_MOCK=` (empty) once a payment gateway is connected.
- Production should stay in the Jakarta data centre (UU PDP).
