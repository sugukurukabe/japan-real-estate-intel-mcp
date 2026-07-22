# ── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files and install all deps (including devDeps for build).
# corepack reads the pinned version from package.json's "packageManager"
# field (not "@latest") so a future pnpm major bump can't silently change
# install/build-script semantics under us again — see pnpm-workspace.yaml.
#
# Deliberately NOT --ignore-scripts: pnpm already blocks build scripts by
# default for every dependency except the ones explicitly allowlisted in
# pnpm-workspace.yaml's onlyBuiltDependencies (better-sqlite3, esbuild,
# sharp) — that allowlist IS the supply-chain guard. --ignore-scripts would
# override it and block those three too, which is what silently broke
# better-sqlite3's native binding (and therefore every SQLite-backed
# feature: usage quota, license storage, downloadable artifacts) in this
# image before this fix — /health still reported "ok" because sqlite
# failures degrade gracefully in most call paths, not because it worked.
RUN apk add --no-cache python3 make g++
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN corepack enable && corepack prepare --activate \
    && pnpm install --frozen-lockfile

# Copy source and build
COPY . .
RUN pnpm run build

# ── Stage 2: Runner ───────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

# Install production deps only (see builder stage above for why no --ignore-scripts)
RUN apk add --no-cache python3 make g++
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN corepack enable && corepack prepare --activate \
    && pnpm install --frozen-lockfile --prod

# Copy built artifacts and runtime assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/ui ./ui
COPY --from=builder /app/data ./data
COPY --from=builder /app/assets ./assets
COPY --from=builder /app/config ./config

# Non-root user for security. Pre-create /app/db and /app/artifacts (owned by
# rei) *before* switching USER: Docker seeds a fresh named volume's initial
# content — and permissions — from whatever already exists at its mount path
# in the image at container-creation time. Without this, docker-compose's
# rei_sqlite named volume (mounted at /app/db) gets created root-owned, and
# every SQLite open as the non-root `rei` user below fails with
# SQLITE_CANTOPEN even once the native binding itself is present.
RUN addgroup -S rei && adduser -S rei -G rei \
    && mkdir -p /app/db /app/artifacts \
    && chown -R rei:rei /app/db /app/artifacts
USER rei

# Environment defaults (override with docker-compose or -e flags)
ENV PORT=3100 \
    HOST=0.0.0.0 \
    NODE_ENV=production \
    RATE_LIMIT_ENABLED=true \
    RATE_LIMIT_MAX=100 \
    RATE_LIMIT_WINDOW_MS=900000 \
    SESSION_TIMEOUT_MS=1800000

EXPOSE 3100

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3100/health || exit 1

CMD ["node", "dist/http.js"]
