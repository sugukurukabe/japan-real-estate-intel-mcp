#!/usr/bin/env bash
#
# Japan Real Estate Intel MCP — One-command Production Deploy Script
# Usage on Ubuntu VPS:
#   curl -sSL https://raw.githubusercontent.com/sugukurukabe/japan-real-estate-intel-mcp/main/scripts/deploy.sh | bash
#   or
#   bash scripts/deploy.sh
#
# This script:
#   1. Installs Docker if missing
#   2. Clones/updates the repository
#   3. Creates .env.production with a secure random API_KEY (if not exists)
#   4. Prompts for your domain and updates Caddyfile
#   5. Builds and starts the stack with docker compose
#   6. Shows health check URL and next steps
#

set -euo pipefail

REPO_URL="https://github.com/sugukurukabe/japan-real-estate-intel-mcp.git"
APP_DIR="${HOME}/japan-real-estate-intel-mcp"
DOMAIN_PLACEHOLDER="your-domain.com"

echo "=============================================================="
echo "  Japan Real Estate Intel MCP — Production Deploy"
echo "=============================================================="
echo

# 1. Docker installation check
if ! command -v docker &>/dev/null; then
  echo "[1/6] Docker not found. Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker "$USER" || true
  echo "Docker installed. You may need to log out and back in for group changes."
else
  echo "[1/6] Docker found: $(docker --version)"
fi

if ! command -v docker compose &>/dev/null; then
  echo "Docker Compose plugin not found. Please install it or use a recent Docker version."
  exit 1
fi

# 2. Clone or update repository
echo
if [ -d "$APP_DIR/.git" ]; then
  echo "[2/6] Updating existing repository..."
  cd "$APP_DIR"
  git pull --ff-only || true
else
  echo "[2/6] Cloning repository to $APP_DIR..."
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

# 3. Create or repair .env.production
echo
if [ ! -f ".env.production" ]; then
  echo "[3/6] Creating .env.production with secure API_KEY..."
  cp .env.production.example .env.production
fi

# Idempotent API_KEY repair: strip ALL existing API_KEY lines, then append a fresh one
# only when the current value is missing/placeholder/malformed.
CURRENT_KEY=$(grep -E '^API_KEY=' .env.production | tail -1 | cut -d= -f2- || echo "")
NEEDS_NEW_KEY=false
if [ -z "$CURRENT_KEY" ]; then
  NEEDS_NEW_KEY=true
elif [ "$CURRENT_KEY" = "change-me-to-a-strong-random-secret" ]; then
  NEEDS_NEW_KEY=true
elif [[ "$CURRENT_KEY" == API_KEY=* ]]; then
  # Detect the API_KEY=API_KEY=xxx malformation and repair
  echo "  → Detected malformed API_KEY (double prefix); regenerating"
  NEEDS_NEW_KEY=true
fi

if [ "$NEEDS_NEW_KEY" = "true" ]; then
  NEW_KEY=$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | xxd -p -c 32)
  # Remove every existing API_KEY= line, then append the clean one
  sed -i '/^API_KEY=/d' .env.production
  echo "API_KEY=${NEW_KEY}" >> .env.production
  echo "  → Generated API_KEY and saved to .env.production"
  echo "  → IMPORTANT: Copy this key now (you will need it for ChatGPT/Cursor):"
  echo "     ${NEW_KEY}"
  echo
  read -rp "Press Enter to continue..."
else
  echo "[3/6] .env.production already has a valid API_KEY — keeping existing value"
fi

# 4. Domain configuration
echo
echo "[4/6] Domain configuration"
CURRENT_DOMAIN=$(grep -oE '^[^ ]+' Caddyfile | head -1 || echo "$DOMAIN_PLACEHOLDER")

if [ "$CURRENT_DOMAIN" = "$DOMAIN_PLACEHOLDER" ]; then
  read -rp "Enter your domain (e.g. rei.example.com): " USER_DOMAIN
  if [ -n "$USER_DOMAIN" ]; then
    sed -i "s|${DOMAIN_PLACEHOLDER}|${USER_DOMAIN}|g" Caddyfile
    echo "  → Caddyfile updated with domain: ${USER_DOMAIN}"
  else
    echo "  → Skipped domain update (you can edit Caddyfile manually later)"
  fi
else
  echo "  → Domain already set in Caddyfile: ${CURRENT_DOMAIN}"
fi

# 5. Build and start
echo
echo "[5/6] Building and starting containers..."
docker compose down --remove-orphans || true
docker compose up -d --build

echo
echo "Waiting for services to become healthy..."
sleep 8

# 6. Health check & summary
echo
echo "[6/6] Deployment complete!"
echo "=============================================================="

DOMAIN=$(grep -oE '^[^ ]+' Caddyfile | head -1)
if [ "$DOMAIN" != "$DOMAIN_PLACEHOLDER" ]; then
  HEALTH_URL="https://${DOMAIN}/health"
  DASHBOARD_URL="https://${DOMAIN}/dashboard.html"
  MCP_URL="https://${DOMAIN}/mcp"
else
  HEALTH_URL="http://localhost:3100/health"
  DASHBOARD_URL="http://localhost:3100/dashboard.html"
  MCP_URL="http://localhost:3100/mcp"
fi

echo "Health check:     ${HEALTH_URL}"
echo "Dashboard (PWA):  ${DASHBOARD_URL}"
echo "MCP endpoint:     ${MCP_URL}"
echo
echo "Next steps:"
echo "  1. Point your domain A record to this server's IP"
echo "  2. Wait for DNS propagation (usually < 5 min)"
echo "  3. Visit the health URL above to confirm HTTPS works"
echo "  4. Add the MCP server to ChatGPT / Cursor using the API_KEY from .env.production"
echo
echo "Useful commands:"
echo "  docker compose logs -f          # Follow logs"
echo "  docker compose restart          # Restart services"
echo "  docker compose down             # Stop everything"
echo
echo "Thank you for deploying Japan Real Estate Intel MCP!"
echo "=============================================================="
