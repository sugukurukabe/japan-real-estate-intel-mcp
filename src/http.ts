#!/usr/bin/env node
import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from './server.js';
import { moduleLogger } from './logger.js';
import { randomUUID } from 'node:crypto';
import { registerOAuthRoutes } from './auth/oauth-routes.js';
import { validateAccessToken } from './auth/oauth-store.js';
import { registerStripeWebhookRoutes } from './billing/stripe-webhook.js';
import { getLicenseByEmail } from './billing/license-store.js';
import { collectDefaultMetrics, register, Counter, Histogram, Gauge } from 'prom-client';
import * as Sentry from '@sentry/node';
import type { Tier } from './tiers.js';

const log = moduleLogger('http');

// ── Sentry (opt-in via SENTRY_DSN) ────────────────────────────────────────
if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1 });
  log.info('Sentry error tracking enabled');
}

// ── Prometheus metrics ────────────────────────────────────────────────────
collectDefaultMetrics();
const mcpToolCalls = new Counter({
  name: 'mcp_tool_calls_total',
  help: 'Total MCP tool call requests',
});
const mcpToolDuration = new Histogram({
  name: 'mcp_tool_duration_seconds',
  help: 'MCP tool call latency',
  buckets: [0.1, 0.5, 1, 2, 5, 10],
});
const mcpActiveSessions = new Gauge({
  name: 'mcp_active_sessions',
  help: 'Currently active MCP sessions',
});
const PORT = parseInt(process.env.PORT ?? '3100', 10);
const HOST = process.env.HOST ?? '0.0.0.0';
const API_KEY = process.env.API_KEY; // optional; if set, require X-Api-Key header
const SESSION_TIMEOUT_MS = parseInt(process.env.SESSION_TIMEOUT_MS ?? String(30 * 60 * 1000), 10);
const RATE_LIMIT_ENABLED = process.env.RATE_LIMIT_ENABLED !== 'false';
const RATE_LIMIT_WINDOW_MS = parseInt(
  process.env.RATE_LIMIT_WINDOW_MS ?? String(15 * 60 * 1000),
  10,
);
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10);

// ── Express setup ──────────────────────────────────────────────────────────

const app: Express = express();

// Trust the first proxy (Caddy) so req.ip / rate-limit sees the real client IP
app.set('trust proxy', 1);

// ── X-Request-ID ────────────────────────────────────────────────────────────
app.use((req: Request, res: Response, next: NextFunction) => {
  const id = (req.headers['x-request-id'] as string) || randomUUID();
  res.setHeader('X-Request-Id', id);
  (req as unknown as Record<string, unknown>).requestId = id;
  next();
});

// Security headers: strict CSP for static UI pages, disabled for /mcp JSON
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/mcp') {
    helmet({ contentSecurityPolicy: false })(req, res, next);
  } else {
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            'https://unpkg.com',
            'https://cdnjs.cloudflare.com',
            'https://cdn.jsdelivr.net',
          ],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            'https://unpkg.com',
            'https://cdnjs.cloudflare.com',
            'https://cdn.jsdelivr.net',
          ],
          imgSrc: [
            "'self'",
            'data:',
            'https://*.tile.openstreetmap.org',
            'https://*.basemaps.cartocdn.com',
            'https://api.qrserver.com',
          ],
          connectSrc: [
            "'self'",
            'https://*.tile.openstreetmap.org',
            'https://*.basemaps.cartocdn.com',
          ],
          fontSrc: ["'self'", 'https://cdnjs.cloudflare.com'],
        },
      },
    })(req, res, next);
  }
});

// Rate limiting (skip /health)
if (RATE_LIMIT_ENABLED) {
  const apiLimiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/health',
    handler: (req, res) => {
      log.warn({ ip: req.ip, path: req.path }, 'Rate limit exceeded');
      res.status(429).json({ error: 'Too Many Requests' });
    },
  });
  app.use('/mcp', apiLimiter);
  app.use('/oauth', apiLimiter);
  log.info({ windowMs: RATE_LIMIT_WINDOW_MS, max: RATE_LIMIT_MAX }, 'Rate limiting enabled on API and OAuth endpoints');
}

// ── Stripe Webhook (raw body — must come BEFORE express.json()) ────────────
// Stripe signature verification requires the raw request body as a Buffer.
app.use('/stripe/webhook', express.raw({ type: 'application/json' }));
registerStripeWebhookRoutes(app);

// Body size limit (all other routes use JSON)
app.use(express.json({ limit: '10mb' }));

// ── Static UI assets (no auth required) ────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

app.use(express.static(path.join(ROOT, 'ui'), { extensions: ['html'] }));
app.use('/assets', express.static(path.join(ROOT, 'assets')));

// Redirect root to dashboard for convenience
app.get('/', (_req, res) => res.redirect('/dashboard.html'));

// Optional API key authentication (applied AFTER static files so dashboard is public)
function isPublicPath(p: string): boolean {
  if (
    p === '/health' ||
    p === '/metrics' ||
    p === '/' ||
    p === '/sw.js' ||
    p === '/manifest.webmanifest'
  )
    return true;
  if (
    p.startsWith('/dashboard') ||
    p.startsWith('/icons/') ||
    p.startsWith('/data/') ||
    p.startsWith('/assets/')
  )
    return true;
  if (p === '/privacy-policy.html' || p === '/terms.html') return true;
  // Stripe webhook is protected by its own signature verification
  if (p === '/stripe/webhook') return true;
  return false;
}

app.use((req, res, next) => {
  if (!API_KEY) {
    next();
    return;
  }
  if (isPublicPath(req.path)) {
    next();
    return;
  }
  // Accept either x-api-key or Authorization: Bearer <key>
  const xApi = req.headers['x-api-key'];
  const auth = req.headers['authorization'];
  const bearer = typeof auth === 'string' && auth.startsWith('Bearer ') ? auth.slice(7) : undefined;
  if (xApi !== API_KEY && bearer !== API_KEY) {
    log.warn({ path: req.path, ip: req.ip }, 'Unauthorized: invalid API key');
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
});

app.use('/data', express.static(path.join(ROOT, 'data')));

// ── OAuth 2.1 + PKCE endpoints ────────────────────────────────────────────
registerOAuthRoutes(app);

// ── License Lookup API ────────────────────────────────────────────────────
app.get('/api/license', (req: Request, res: Response) => {
  const email = req.query.email as string | undefined;
  if (!email) {
    res.status(400).json({ error: 'email query parameter is required' });
    return;
  }
  const license = getLicenseByEmail(email);
  if (!license) {
    res.status(404).json({ error: 'No active license found for this email' });
    return;
  }
  // Return license info (key included so customer can copy it)
  res.json({
    clientName: license.client_name,
    email: license.email,
    tier: license.tier,
    licenseKey: license.license_key,
    expiresAt: license.expires_at,
    createdAt: license.created_at,
  });
});

// ── Session management ─────────────────────────────────────────────────────

interface SessionEntry {
  transport: StreamableHTTPServerTransport;
  lastActivity: number;
  timer: NodeJS.Timeout;
}

const sessions = new Map<string, SessionEntry>();

function touchSession(id: string): void {
  const entry = sessions.get(id);
  if (!entry) return;
  entry.lastActivity = Date.now();
  clearTimeout(entry.timer);
  entry.timer = setTimeout(() => {
    log.info({ sessionId: id }, 'Session timed out');
    sessions.delete(id);
  }, SESSION_TIMEOUT_MS);
}

function closeAllSessions(): void {
  for (const [id] of sessions) {
    const entry = sessions.get(id);
    if (entry) clearTimeout(entry.timer);
    sessions.delete(id);
  }
  log.info('All sessions closed');
}

// ── MCP endpoint ───────────────────────────────────────────────────────────

app.post('/mcp', async (req, res) => {
  mcpToolCalls.inc();
  const callStart = Date.now();
  res.on('finish', () => mcpToolDuration.observe((Date.now() - callStart) / 1000));
  
  // Set Client IP into environment variable context dynamically for database quota tracking
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown-client';
  process.env.USAGE_CLIENT_ID = clientIp;

  // Extract real-time license key from HTTP headers
  const reqLicenseKey = req.headers['x-license-key'] as string | undefined;
  let clientTierOverride: Tier = 'free';

  if (reqLicenseKey) {
    const { verifyLicenseKeyOffline } = await import('./auth/license.js');
    // Pre-bypass demo keys — only in non-production environments
    if (process.env.NODE_ENV !== 'production') {
      if (reqLicenseKey === 'demo-pro-key' || reqLicenseKey === 'test-valid-pro-key') {
        clientTierOverride = 'pro';
      } else if (reqLicenseKey === 'demo-enterprise-key') {
        clientTierOverride = 'enterprise';
      }
    }
    if (clientTierOverride === 'free') {
      const verifyResult = verifyLicenseKeyOffline(reqLicenseKey);
      if (verifyResult.success) {
        clientTierOverride = verifyResult.tier;
        log.info({ client: verifyResult.clientName, tier: verifyResult.tier }, 'Dynamic HTTP session license verification succeeded');
      } else {
        log.warn({ reason: verifyResult.reason }, 'Dynamic HTTP session license verification rejected');
      }
    }
  }

  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  let entry: SessionEntry | undefined = sessionId ? sessions.get(sessionId) : undefined;

  if (!entry) {
    const newId = randomUUID();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => newId,
    });
    const timer = setTimeout(() => {
      log.info({ sessionId: newId }, 'New session timed out');
      sessions.delete(newId);
    }, SESSION_TIMEOUT_MS);

    const auth = req.headers['authorization'];
    const bearer = typeof auth === 'string' && auth.startsWith('Bearer ') ? auth.slice(7) : undefined;
    const xApi = req.headers['x-api-key'];
    let tier: Tier | undefined = undefined;
    let clientId: string | undefined = undefined;

    if (API_KEY && (bearer === API_KEY || xApi === API_KEY)) {
      tier = (process.env.DEFAULT_TIER as Tier) ?? 'pro';
      clientId = 'api_key_owner';
    } else if (bearer) {
      const tokenInfo = validateAccessToken(bearer);
      if (tokenInfo) {
        tier = tokenInfo.tier as Tier;
        clientId = tokenInfo.clientId;
      }
    }

    if (!clientId) {
      clientId = 'anon:' + (req.ip || 'default');
    }

    entry = { transport, lastActivity: Date.now(), timer };
    sessions.set(newId, entry);

    const activeTier = reqLicenseKey ? clientTierOverride : (tier ?? 'free');
    const mcpServer = createServer({ activeTierOverride: activeTier, clientId });
    await mcpServer.connect(transport);
    log.info({ sessionId: newId, tier: activeTier, clientId }, 'New MCP session created');

    transport.onclose = () => {
      clearTimeout(timer);
      sessions.delete(newId);
      log.info({ sessionId: newId }, 'Session closed by client');
    };
  } else {
    touchSession(sessionId!);
  }

  await entry.transport.handleRequest(req, res, req.body);
});

app.get('/mcp', async (req, res) => {
  const sessionId =
    (req.headers['mcp-session-id'] as string | undefined) ||
    (req.query['mcp-session-id'] as string | undefined) ||
    (req.query.sessionId as string | undefined);
  if (!sessionId || !sessions.has(sessionId)) {
    res.status(400).json({ error: 'Missing or invalid session ID' });
    return;
  }
  // Inject into headers and rawHeaders to satisfy the MCP SDK's Hono conversion
  req.headers['mcp-session-id'] = sessionId;
  req.rawHeaders.push('mcp-session-id', sessionId);

  touchSession(sessionId);
  await sessions.get(sessionId)!.transport.handleRequest(req, res);
});

app.delete('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  const entry = sessionId ? sessions.get(sessionId) : undefined;
  if (sessionId && entry) {
    clearTimeout(entry.timer);
    await entry.transport.handleRequest(req, res);
    sessions.delete(sessionId);
    log.info({ sessionId }, 'Session deleted via DELETE /mcp');
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
});

// ── Health check ───────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  mcpActiveSessions.set(sessions.size);
  res.json({
    status: 'ok',
    version: '6.16.0',
    sessions: sessions.size,
    uptime_s: Math.round(process.uptime()),
  });
});

// ── Prometheus metrics ─────────────────────────────────────────────────────

app.get('/metrics', async (_req, res) => {
  try {
    mcpActiveSessions.set(sessions.size);
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(String(err));
  }
});

// ── Graceful shutdown ──────────────────────────────────────────────────────

function gracefulShutdown(signal: string): void {
  log.info({ signal }, 'Shutdown signal received — closing sessions');
  closeAllSessions();
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ── Start server ───────────────────────────────────────────────────────────

let httpServer: ReturnType<typeof app.listen> | null = null;
if (process.env.NODE_ENV !== 'test') {
  httpServer = app.listen(PORT, HOST, () => {
    log.info(
      { host: HOST, port: PORT, authEnabled: !!API_KEY },
      'Japan Real Estate Intel MCP (HTTP) started',
    );
  });
}

export { app, httpServer, sessions };
