/**
 * Usage Store — SQLite-backed persistence for Free-tier monthly quota tracking.
 *
 * Extracted from the former OAuth store (this MCP server is an authless public
 * connector; see docs/registry-submission.md and README for the auth model).
 * This module only tracks per-client monthly tool-call counts.
 */
import Database from 'better-sqlite3';
import { resolve, dirname } from 'node:path';
import { mkdirSync } from 'node:fs';
import { moduleLogger } from './logger.js';

const log = moduleLogger('usage_store');

function getDbPath(): string {
  return process.env.USAGE_DB_PATH ?? resolve(process.cwd(), 'db', 'usage.sqlite');
}

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;
  const dbPath = getDbPath();
  mkdirSync(dirname(dbPath), { recursive: true });
  _db = new Database(dbPath);
  _db.pragma('journal_mode = WAL');
  _db.exec(`
    CREATE TABLE IF NOT EXISTS client_usage (
      client_id TEXT NOT NULL,
      usage_month TEXT NOT NULL,
      tool_call_count INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (client_id, usage_month)
    );
  `);
  log.info({ path: dbPath }, 'Usage SQLite store initialized');
  return _db;
}

export function getClientUsage(clientId: string, month: string): number {
  const row = getDb()
    .prepare('SELECT tool_call_count FROM client_usage WHERE client_id = ? AND usage_month = ?')
    .get(clientId, month) as { tool_call_count: number } | undefined;
  return row ? row.tool_call_count : 0;
}

export function incrementClientUsage(clientId: string, month: string): void {
  getDb()
    .prepare(
      `
    INSERT INTO client_usage (client_id, usage_month, tool_call_count)
    VALUES (?, ?, 1)
    ON CONFLICT(client_id, usage_month) DO UPDATE SET tool_call_count = tool_call_count + 1
  `,
    )
    .run(clientId, month);
}

export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}

export function resetClientUsageForTests(): void {
  getDb().prepare('DELETE FROM client_usage').run();
}
