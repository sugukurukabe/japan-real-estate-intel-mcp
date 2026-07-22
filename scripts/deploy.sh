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
#   4. Asks how the server will be reached (Caddy + domain, or Cloudflare
#      Tunnel) and configures Caddyfile / TUNNEL_TOKEN / MCP_PUBLIC_URL
#      accordingly — this determines which `docker compose --profile ...`
#      is used in step 5, since a bare `docker compose up` publishes no ports
#   5. Builds and starts the stack with the resolved profile
#   6. Shows health check URL and next steps
#
# This script always sets a self-hosted-protection API_KEY (pattern 2 in
# .env.production.example). For an authless public-directory instance
# (pattern 1), remove API_KEY from .env.production manually after running
# this script — see .env.production.example and docs/deploy.md.

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

# 4. Exposure profile — a bare `docker compose up` starts only the `mcp`
#    service, which has no published ports (only `expose: 3100` on the
#    internal rei_net). Without --profile caddy|tunnel nothing is reachable
#    from outside the host, so this step is not optional.
echo
echo "[4/6] Public exposure method"
CURRENT_DOMAIN=$(grep -oE '^[^ ]+' Caddyfile | head -1 || echo "$DOMAIN_PLACEHOLDER")
COMPOSE_PROFILE=""

CURRENT_TUNNEL_TOKEN=$(grep -E '^TUNNEL_TOKEN=' .env.production 2>/dev/null | tail -1 | cut -d= -f2- || echo "")

if [ -n "$CURRENT_TUNNEL_TOKEN" ]; then
  COMPOSE_PROFILE="tunnel"
  echo "  → TUNNEL_TOKEN already set in .env.production — using Cloudflare Tunnel (--profile tunnel)"
elif [ "$CURRENT_DOMAIN" != "$DOMAIN_PLACEHOLDER" ]; then
  COMPOSE_PROFILE="caddy"
  echo "  → Domain already set in Caddyfile: ${CURRENT_DOMAIN} — using Caddy (--profile caddy)"
else
  echo "  How will this server be reached from the internet?"
  echo "    1) Caddy — I have a domain + public IP (auto HTTPS via Let's Encrypt)"
  echo "    2) Cloudflare Tunnel — behind NAT / no public IP"
  read -rp "  Choose [1/2]: " EXPOSURE_CHOICE
  if [ "$EXPOSURE_CHOICE" = "2" ]; then
    COMPOSE_PROFILE="tunnel"
    read -rp "  Enter your Cloudflare Tunnel token: " USER_TUNNEL_TOKEN
    if [ -n "$USER_TUNNEL_TOKEN" ]; then
      sed -i '/^TUNNEL_TOKEN=/d' .env.production
      echo "TUNNEL_TOKEN=${USER_TUNNEL_TOKEN}" >> .env.production
      echo "  → Saved TUNNEL_TOKEN to .env.production"
    else
      echo "  → No token entered. Set TUNNEL_TOKEN in .env.production before starting the tunnel profile."
    fi
  else
    COMPOSE_PROFILE="caddy"
    read -rp "  Enter your domain (e.g. realestate-mcp.jp): " USER_DOMAIN
    if [ -n "$USER_DOMAIN" ]; then
      sed -i "s|${DOMAIN_PLACEHOLDER}|${USER_DOMAIN}|g" Caddyfile
      echo "  → Caddyfile updated with domain: ${USER_DOMAIN}"
    else
      echo "  → Skipped domain update (you can edit Caddyfile manually later); Caddy will fail TLS issuance until it's set."
    fi
  fi
fi

# Keep MCP_PUBLIC_URL (used for resource_link / dashboard deep-links) in sync
# with whatever domain ended up in the Caddyfile, when one is set.
FINAL_DOMAIN=$(grep -oE '^[^ ]+' Caddyfile | head -1 || echo "$DOMAIN_PLACEHOLDER")
if [ "$FINAL_DOMAIN" != "$DOMAIN_PLACEHOLDER" ]; then
  sed -i '/^MCP_PUBLIC_URL=/d' .env.production
  echo "MCP_PUBLIC_URL=https://${FINAL_DOMAIN}" >> .env.production
fi

# 5. Build and start
echo
echo "[5/6] Building and starting containers (--profile ${COMPOSE_PROFILE})..."
docker compose --profile "$COMPOSE_PROFILE" down --remove-orphans || true
docker compose --profile "$COMPOSE_PROFILE" up -d --build

echo
echo "Waiting for services to become healthy..."
sleep 8

# 6. Health check & summary
echo
echo "[6/6] Deployment complete!"
echo "=============================================================="

if [ "$FINAL_DOMAIN" != "$DOMAIN_PLACEHOLDER" ]; then
  HEALTH_URL="https://${FINAL_DOMAIN}/health"
  DASHBOARD_URL="https://${FINAL_DOMAIN}/dashboard.html"
  MCP_URL="https://${FINAL_DOMAIN}/mcp"
elif [ "$COMPOSE_PROFILE" = "tunnel" ]; then
  HEALTH_URL="https://<your Cloudflare Tunnel public hostname>/health"
  DASHBOARD_URL="https://<your Cloudflare Tunnel public hostname>/dashboard.html"
  MCP_URL="https://<your Cloudflare Tunnel public hostname>/mcp"
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
if [ "$COMPOSE_PROFILE" = "tunnel" ]; then
  echo "  1. Finish configuring the Public Hostname in the Cloudflare Zero Trust dashboard (Tunnels > your tunnel)"
  echo "  2. Point it at http://mcp:3100 inside this Docker network"
  echo "  3. Visit the health URL above (with your real tunnel hostname) to confirm HTTPS works"
else
  echo "  1. Point your domain A record to this server's IP"
  echo "  2. Wait for DNS propagation (usually < 5 min)"
  echo "  3. Visit the health URL above to confirm HTTPS works"
fi
echo "  4. Add the MCP server to ChatGPT / Cursor using the API_KEY from .env.production"
echo
echo "Useful commands:"
echo "  docker compose logs -f                              # Follow logs"
echo "  docker compose --profile ${COMPOSE_PROFILE} restart  # Restart services"
echo "  docker compose --profile ${COMPOSE_PROFILE} down     # Stop everything"
echo
echo "Thank you for deploying Japan Real Estate Intel MCP!"
echo "=============================================================="
