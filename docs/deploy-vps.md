# Deploying to a VPS (Hostinger)

> **Current staging server:** the Hostinger VPS made from the Docker + Traefik template is run through Hostinger's
> Docker manager instead; see [deploy/hostinger/README.md](../deploy/hostinger/README.md). The SSH-based setup below
> remains the option for a plain Ubuntu server.

The VPS only runs containers; it never builds the app. GitHub Actions builds the images on every push to
`main` (workflow **Release**), stores them privately in GitHub Container Registry, then copies the
deployment files to the VPS over SSH and restarts the app. Day-to-day tasks (status, logs, restart, backup,
seed, create an admin, roll back) run from the workflow **Ops**, so nobody needs to log in to the server.

```
push to main ─▶ Release: build images ─▶ ghcr.io (private) ─▶ SSH to VPS: back up DB, pull, restart, health check
```

## 1. Choose the VPS

- Hostinger **KVM 2** (2 vCPU, 8 GB RAM) is comfortable; **KVM 1** (1 vCPU, 4 GB) works for staging.
- Operating system: **Ubuntu 24.04** (plain; the bootstrap script installs Docker). A data centre in Asia
  (Jakarta if offered, otherwise Singapore) keeps the site fast for Indonesian users. Note for production:
  UU PDP expects student data to stay in Indonesia, so production should run in an Indonesian region.
- In hPanel, add your SSH public key to the VPS (VPS → Settings → SSH keys) so you can log in as root.
- If you use Hostinger's **Firewall** in hPanel, allow TCP 22, 80 and 443 (and UDP 443).

## 2. Point the domain at it

Create a DNS **A record** for the staging address, e.g. `staging.ailearning.impact.id` → the VPS IP
(and an AAAA record if the VPS has IPv6). Wait until `ping staging.ailearning.impact.id` shows the VPS IP:
the HTTPS certificate is issued automatically on first start and needs this.

## 3. Prepare the server (once, about 3 minutes)

Log in as root (`ssh root@<VPS IP>`) and run the bootstrap script. It installs Docker, a firewall,
fail2ban, automatic security updates and swap, and creates the `deploy` user that GitHub Actions uses.

First create a key pair that only GitHub Actions will use (on your own computer):

```bash
ssh-keygen -t ed25519 -N "" -C "github-actions-deploy" -f ailit_deploy
```

Then put the bootstrap script on the VPS. The repository is private, so either open
`scripts/vps-bootstrap.sh` on GitHub, copy it, and paste it into `nano vps-bootstrap.sh` on the server, or copy it
from a computer that has the code:

```bash
scp scripts/vps-bootstrap.sh root@<VPS IP>:
```

Run it on the VPS, passing the **public** half of the key (paste the content of `ailit_deploy.pub` between
the quotes):

```bash
sudo DEPLOY_PUBKEY="ssh-ed25519 AAAA... github-actions-deploy" bash vps-bootstrap.sh
```

## 4. Connect GitHub to the VPS

In GitHub: repository → Settings → **Environments** → New environment `staging`. Add:

| Kind | Name | Value |
| --- | --- | --- |
| Secret | `VPS_HOST` | The VPS IP address |
| Secret | `VPS_SSH_KEY` | The whole **private** key file `ailit_deploy` |
| Secret | `VPS_KNOWN_HOSTS` | Output of `ssh-keyscan -H <VPS IP>` (pins the server's identity) |
| Secret | `ADMIN_PASSWORD` | Password for the first platform admin (used by Ops → create-admin) |
| Variable | `DOMAIN` | `staging.ailearning.impact.id` |
| Variable | `PUBLIC_URL` | `https://staging.ailearning.impact.id` (shown as the environment link) |
| Variable | `ACME_EMAIL` | `indra@impact.id` (certificate expiry notices) |

Optional variables: `VPS_USER` (default `deploy`), `VPS_PORT` (default 22), `APP_DIR`
(default `/opt/ai-literacy-platform`). Then delete the private key from your computer or keep it in a
password manager.

## 5. First deploy

1. Actions → **Release** → Run workflow, with **seed** ticked. On the first run it writes the server's
   `.env.selfhost` with random secrets, starts everything, waits for the health check, and loads the
   curriculum and content.
2. Actions → **Ops** → Run workflow → `create-admin`, with your email. The password is the `ADMIN_PASSWORD`
   secret.
3. Open `https://staging.ailearning.impact.id/masuk` and sign in.

To deploy automatically on every push to `main`, add the repository variable `AUTO_DEPLOY` = `true`
(Settings → Secrets and variables → Actions → Variables).

## Day to day (Actions → Ops)

| Action | What it does |
| --- | --- |
| `status` | Container status, health, disk, memory, latest backups |
| `logs` | Last 200 lines of the app log (with `EMAIL_TO_LOG=true` in `.env.selfhost`, sign-in codes and reset links appear here until SMTP is set up) |
| `restart` | Restart all services (app, HTTPS proxy, database, storage) |
| `backup` | Database dump now, into `backups/` on the server |
| `seed` | Load the curriculum and content again (resets seeded lessons) |
| `create-admin` | Create or reset a platform admin |
| `rollback` | Go back to an earlier build: give its tag, e.g. `sha-abc1234` (each Release run shows its tag) |

Every deploy also takes a database dump first (`backups/ailit-pre-deploy-*.dump`), and the `backup` service
takes one every night. Copy backups off the server too ([backup.md](backup.md)); Hostinger's weekly VPS
backups or a manual snapshot in hPanel before big changes are a good extra layer.

## Settings and third-party keys

The server's settings live in `/opt/ai-literacy-platform/.env.selfhost` (readable only by the deploy user).
To add keys later (Anthropic, SMTP, Midtrans/Xendit, WhatsApp, Google sign-in), log in as `deploy`, edit that
file, and run the Release workflow again (or `scripts/deploy.sh` on the server). Keep a copy of the file in a
password manager: `PAYLOAD_SECRET` must stay the same for existing sign-ins and when restoring a backup.

## If something goes wrong

- **Release fails at "VPS SSH"**: check `VPS_HOST`, `VPS_SSH_KEY`, and that the public key is in
  `/home/deploy/.ssh/authorized_keys`; check the hPanel firewall allows port 22.
- **Health check never passes**: run Ops → `logs`. On the first start, migrations take up to a minute.
- **The site shows a certificate error**: the DNS record did not point at the VPS when Caddy started.
  Fix DNS, then run Ops → `restart`.
- **Disk full**: Ops → `status` shows usage; old images are pruned on each deploy, and dumps older than
  `BACKUP_KEEP_DAYS` (14) are removed automatically.
