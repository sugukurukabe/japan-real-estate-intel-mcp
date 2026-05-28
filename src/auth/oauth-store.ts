import Database from 'better-sqlite3';
import { randomBytes, createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { mkdirSync } from 'node:fs';
import { moduleLogger } from '../logger.js';

const log = moduleLogger('oauth_store');

const DB_PATH = process.env.OAUTH_DB_PATH ?? resolve(process.cwd(), 'db', 'oauth.sqlite');

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;
  mkdirSync(dirname(DB_PATH), { recursive: true });
  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  _db.exec(`
    CREATE TABLE IF NOT EXISTS oauth_clients (
      client_id TEXT PRIMARY KEY,
      client_name TEXT NOT NULL,
      redirect_uris TEXT NOT NULL, -- JSON array
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS auth_codes (
      code TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES oauth_clients(client_id),
      code_challenge TEXT NOT NULL,
      code_challenge_method TEXT NOT NULL DEFAULT 'S256',
      scope TEXT,
      redirect_uri TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS access_tokens (
      token_hash TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES oauth_clients(client_id),
      scope TEXT,
      tier TEXT NOT NULL DEFAULT 'free',
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      token_hash TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES oauth_clients(client_id),
      scope TEXT,
      tier TEXT NOT NULL DEFAULT 'free',
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_auth_codes_expires ON auth_codes(expires_at);
    CREATE INDEX IF NOT EXISTS idx_access_tokens_expires ON access_tokens(expires_at);
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at);
  `);
  log.info({ path: DB_PATH }, 'OAuth SQLite store initialized');
  return _db;
}

function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

function base64url(buf: Buffer): string {
  return buf.toString('base64url');
}

export function registerClient(name: string, redirectUris: string[]): { clientId: string } {
  const clientId = base64url(randomBytes(24));
  getDb()
    .prepare('INSERT INTO oauth_clients (client_id, client_name, redirect_uris) VALUES (?, ?, ?)')
    .run(clientId, name, JSON.stringify(redirectUris));
  return { clientId };
}

export function getClient(
  clientId: string,
): { clientId: string; clientName: string; redirectUris: string[] } | null {
  const row = getDb().prepare('SELECT * FROM oauth_clients WHERE client_id = ?').get(clientId) as
    | {
        client_id: string;
        client_name: string;
        redirect_uris: string;
      }
    | undefined;
  if (!row) return null;
  return {
    clientId: row.client_id,
    clientName: row.client_name,
    redirectUris: JSON.parse(row.redirect_uris),
  };
}

export function createAuthCode(params: {
  clientId: string;
  codeChallenge: string;
  codeChallengeMethod?: string;
  scope?: string;
  redirectUri: string;
}): string {
  const code = base64url(randomBytes(32));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min
  getDb()
    .prepare(
      `INSERT INTO auth_codes (code, client_id, code_challenge, code_challenge_method, scope, redirect_uri, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      code,
      params.clientId,
      params.codeChallenge,
      params.codeChallengeMethod ?? 'S256',
      params.scope ?? '',
      params.redirectUri,
      expiresAt,
    );
  return code;
}

export function exchangeCode(
  code: string,
  codeVerifier: string,
  redirectUri: string,
): {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  scope: string;
  tier: string;
} | null {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT * FROM auth_codes WHERE code = ? AND used = 0 AND expires_at > datetime('now')",
    )
    .get(code) as
    | {
        code: string;
        client_id: string;
        code_challenge: string;
        code_challenge_method: string;
        scope: string;
        redirect_uri: string;
      }
    | undefined;

  if (!row) return null;
  if (row.redirect_uri !== redirectUri) return null;

  const challenge = createHash('sha256').update(codeVerifier).digest('base64url');
  if (challenge !== row.code_challenge) return null;

  db.prepare('UPDATE auth_codes SET used = 1 WHERE code = ?').run(code);

  const accessToken = base64url(randomBytes(32));
  const refreshToken = base64url(randomBytes(32));
  const expiresIn = 3600;
  const tier = 'free';

  db.prepare(
    `INSERT INTO access_tokens (token_hash, client_id, scope, tier, expires_at)
     VALUES (?, ?, ?, ?, datetime('now', '+${expiresIn} seconds'))`,
  ).run(sha256(accessToken), row.client_id, row.scope, tier);

  db.prepare(
    `INSERT INTO refresh_tokens (token_hash, client_id, scope, tier, expires_at)
     VALUES (?, ?, ?, ?, datetime('now', '+30 days'))`,
  ).run(sha256(refreshToken), row.client_id, row.scope, tier);

  return { accessToken, refreshToken, expiresIn, scope: row.scope, tier };
}

export function validateAccessToken(
  token: string,
): { clientId: string; scope: string; tier: string } | null {
  const hash = sha256(token);
  const row = getDb()
    .prepare("SELECT * FROM access_tokens WHERE token_hash = ? AND expires_at > datetime('now')")
    .get(hash) as { client_id: string; scope: string; tier: string } | undefined;
  if (!row) return null;
  return { clientId: row.client_id, scope: row.scope, tier: row.tier };
}

export function refreshAccessToken(refreshToken: string): {
  accessToken: string;
  expiresIn: number;
} | null {
  const db = getDb();
  const hash = sha256(refreshToken);
  const row = db
    .prepare("SELECT * FROM refresh_tokens WHERE token_hash = ? AND expires_at > datetime('now')")
    .get(hash) as { client_id: string; scope: string; tier: string } | undefined;

  if (!row) return null;

  const accessToken = base64url(randomBytes(32));
  const expiresIn = 3600;

  db.prepare(
    `INSERT INTO access_tokens (token_hash, client_id, scope, tier, expires_at)
     VALUES (?, ?, ?, ?, datetime('now', '+${expiresIn} seconds'))`,
  ).run(sha256(accessToken), row.client_id, row.scope, row.tier);

  return { accessToken, expiresIn };
}

export function cleanupExpired(): number {
  const db = getDb();
  const r1 = db.prepare("DELETE FROM auth_codes WHERE expires_at < datetime('now')").run();
  const r2 = db.prepare("DELETE FROM access_tokens WHERE expires_at < datetime('now')").run();
  const r3 = db.prepare("DELETE FROM refresh_tokens WHERE expires_at < datetime('now')").run();
  const total = r1.changes + r2.changes + r3.changes;
  if (total > 0) log.info({ deleted: total }, 'Cleaned up expired OAuth records');
  return total;
}

export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}
