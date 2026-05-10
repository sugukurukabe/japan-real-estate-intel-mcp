# ── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files and install all deps (including devDeps for build)
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@latest --activate && pnpm install --frozen-lockfile --ignore-scripts

# Copy source and build
COPY . .
RUN pnpm run build:server

# ── Stage 2: Runner ───────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

# Install production deps only
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@latest --activate && pnpm install --frozen-lockfile --prod --ignore-scripts

# Copy built artifacts and runtime assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/ui ./ui
COPY --from=builder /app/data ./data
COPY --from=builder /app/assets ./assets
COPY --from=builder /app/config ./config

# Non-root user for security
RUN addgroup -S rei && adduser -S rei -G rei
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
  CMD wget -qO- http://localhost:3100/health || exit 1

CMD ["node", "dist/http.js"]
