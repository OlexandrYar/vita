#!/usr/bin/env bash
# First-time VPS setup script for Vita Gerbarium.
# Run once as root (or with sudo) after cloning the repo.
# Usage: sudo bash deploy/setup.sh

set -e

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
echo "Setting up Vita Gerbarium in: $APP_DIR"

# ── 1. System dependencies ───────────────────────────────────────────────────
apt-get update -q
apt-get install -y -q nginx certbot python3-certbot-nginx

# Node.js 22 (if not already installed)
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

# PM2
if ! command -v pm2 &>/dev/null; then
  npm install -g pm2
fi

# ── 2. App setup ─────────────────────────────────────────────────────────────
cd "$APP_DIR"

# Create persistent data/uploads dirs outside the build
mkdir -p uploads data

# Install deps and build
npm ci
npm run build

# ── 3. Environment ───────────────────────────────────────────────────────────
if [ ! -f .env ]; then
  cp .env.example .env
  echo ""
  echo "⚠  .env created from .env.example"
  echo "   Edit it now before starting the app:"
  echo "   nano $APP_DIR/.env"
  echo ""
fi

# ── 4. Nginx ─────────────────────────────────────────────────────────────────
cp deploy/nginx.conf /etc/nginx/sites-available/vita-gerbarium
ln -sf /etc/nginx/sites-available/vita-gerbarium /etc/nginx/sites-enabled/vita-gerbarium
nginx -t && systemctl reload nginx

echo ""
echo "Next steps:"
echo "  1. Edit .env — set ORIGIN, VITA_PASSWORD, VITA_SECRET"
echo "  2. Replace 'yourdomain.com' in /etc/nginx/sites-available/vita-gerbarium"
echo "  3. certbot --nginx -d yourdomain.com"
echo "  4. pm2 start ecosystem.config.cjs"
echo "  5. pm2 save && pm2 startup"
