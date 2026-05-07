#!/usr/bin/env node
import express, { type Express } from 'express';
import helmet from 'helmet';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from './server.js';
import { moduleLogger } from './logger.js';
import { randomUUID } from 'node:crypto';

const log = moduleLogger('http');
const PORT = parseInt(process.env.PORT ?? '3100', 10);
const HOST = process.env.HOST ?? '0.0.0.0';
const API_KEY = process.env.API_KEY; // optional; if set, require X-Api-Key header
const SESSION_TIMEOUT_MS = parseInt(process.env.SESSION_TIMEOUT_MS ?? String(30 * 60 * 1000), 10);

// ── Express setup ──────────────────────────────────────────────────────────

const app: Express = express();

// Security headers (skip CSP for MCP JSON endpoint)
app.use(helmet({ contentSecurityPolicy: false }));

// Body size limit
app.use(express.json({ limit: '10mb' }));

// Optional API key authentication
app.use((req, res, next) => {
  if (!API_KEY) { next(); return; }
  // Skip auth for health check
  if (req.path === '/health') { next(); return; }
  const provided = req.headers['x-api-key'];
  if (provided !== API_KEY) {
    log.warn({ path: req.path, ip: req.ip }, 'Unauthorized: invalid API key');
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
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

    entry = { transport, lastActivity: Date.now(), timer };
    sessions.set(newId, entry);

    const mcpServer = createServer();
    await mcpServer.connect(transport);
    log.info({ sessionId: newId }, 'New MCP session created');

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
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !sessions.has(sessionId)) {
    res.status(400).json({ error: 'Missing or invalid session ID' });
    return;
  }
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
  res.json({
    status: 'ok',
    version: '2.9.0',
    sessions: sessions.size,
    uptime_s: Math.round(process.uptime()),
  });
});

// ── Graceful shutdown ──────────────────────────────────────────────────────

function gracefulShutdown(signal: string): void {
  log.info({ signal }, 'Shutdown signal received  Eclosing sessions');
  closeAllSessions();
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ── Start server ───────────────────────────────────────────────────────────

const httpServer = app.listen(PORT, HOST, () => {
  log.info(
    { host: HOST, port: PORT, authEnabled: !!API_KEY },
    'Japan Real Estate Intel MCP (HTTP) started',
  );
});

export { app, httpServer, sessions };
