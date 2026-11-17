#!/usr/bin/env bash
# One-time preparation of a fresh Ubuntu/Debian VPS (tested target: Hostinger KVM, Ubuntu 24.04).
# Run as root:   curl -fsSL <raw url of this file> | sudo bash        or        sudo bash scripts/vps-bootstrap.sh
# Safe to re-run. It:
#   - installs Docker (with the Compose plugin), git, rsync, ufw, fail2ban and automatic security updates
#   - sets the time zone to Asia/Jakarta and adds swap on small machines
#   - opens only SSH, HTTP and HTTPS in the firewall
#   - creates the "deploy" user that GitHub Actions connects as, and /opt/ai-literacy-platform
# Optional environment: DEPLOY_USER (default deploy), APP_DIR (default /opt/ai-literacy-platform),
#   DEPLOY_PUBKEY (an SSH public key to authorise for the deploy user, e.g. the GitHub Actions key).
set -euo pipefail
DEPLOY_USER="${DEPLOY_USER:-deploy}"
APP_DIR="${APP_DIR:-/opt/ai-literacy-platform}"
[ "$(id -u)" = 0 ] || { echo "Run as root (sudo)."; exit 1; }
command -v apt-get >/dev/null || { echo "This script supports Ubuntu/Debian only."; exit 1; }
export DEBIAN_FRONTEND=noninteractive

echo "== Packages"
apt-get update -qq
apt-get install -y -qq ca-certificates curl git rsync ufw fail2ban unattended-upgrades >/dev/null
dpkg-reconfigure -f noninteractive unattended-upgrades >/dev/null 2>&1 || true

echo "== Docker"
if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sh >/dev/null
fi
systemctl enable --now docker >/dev/null
docker compose version >/dev/null || { echo "Docker Compose plugin missing"; exit 1; }
# Keep container logs from filling the disk.
if [ ! -f /etc/docker/daemon.json ]; then
  printf '{\n  "log-driver": "json-file",\n  "log-opts": { "max-size": "10m", "max-file": "3" }\n}\n' > /etc/docker/daemon.json
  systemctl restart docker
fi

echo "== Time zone and swap"
timedatectl set-timezone Asia/Jakarta 2>/dev/null || true
if ! swapon --show | grep -q .; then
  mem_mb=$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo)
  if [ "$mem_mb" -lt 8000 ]; then
    size=$([ "$mem_mb" -lt 3000 ] && echo 4G || echo 2G)
    { fallocate -l "$size" /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=$(( ${size%G} * 1024 )) status=none; } && chmod 600 /swapfile && mkswap /swapfile >/dev/null && swapon /swapfile
    grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo "   added $size swap"
  fi
fi

echo "== Firewall (SSH, HTTP, HTTPS only)"
ufw allow OpenSSH >/dev/null
ufw allow 80/tcp >/dev/null
ufw allow 443/tcp >/dev/null
ufw allow 443/udp >/dev/null
ufw --force enable >/dev/null
systemctl enable --now fail2ban >/dev/null

echo "== Deploy user and app folder"
id "$DEPLOY_USER" >/dev/null 2>&1 || useradd -m -s /bin/bash "$DEPLOY_USER"
usermod -aG docker "$DEPLOY_USER"
install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"
AUTH="/home/$DEPLOY_USER/.ssh/authorized_keys"
touch "$AUTH"
# Reuse the keys root logs in with, and add DEPLOY_PUBKEY if given.
[ -f /root/.ssh/authorized_keys ] && cat /root/.ssh/authorized_keys >> "$AUTH"
[ -n "${DEPLOY_PUBKEY:-}" ] && echo "$DEPLOY_PUBKEY" >> "$AUTH"
sort -u "$AUTH" -o "$AUTH"
chown "$DEPLOY_USER:$DEPLOY_USER" "$AUTH" && chmod 600 "$AUTH"
install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$APP_DIR" "$APP_DIR/backups"

echo
echo "Done. Server: $(hostname) · $(lsb_release -ds 2>/dev/null || uname -sr) · Docker $(docker --version | awk '{print $3}' | tr -d ,)"
echo "Deploy user '$DEPLOY_USER' has $(grep -c . "$AUTH") authorised SSH key(s). App folder: $APP_DIR"
echo "Next: follow docs/deploy-vps.md (DNS record, GitHub secrets, then run the Release workflow)."
