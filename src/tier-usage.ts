import type { Tier } from './tiers.js';
import { TIER_CONFIG } from './tiers.js';
import Database from 'better-sqlite3';
import { resolve, dirname } from 'node:path';
import { mkdirSync } from 'node:fs';
import { moduleLogger } from './logger.js';

const log = moduleLogger('quota_store');
const DB_PATH = process.env.QUOTA_DB_PATH ?? resolve(process.cwd(), 'db', 'quota.sqlite');

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;
  mkdirSync(dirname(DB_PATH), { recursive: true });
  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.exec(`
    CREATE TABLE IF NOT EXISTS ip_quotas (
      client_key TEXT NOT NULL,
      month TEXT NOT NULL,
      call_count INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (client_key, month)
    );
  `);
  return _db;
}

function currentMonthUtc(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function clientKey(): string {
  return process.env.USAGE_CLIENT_ID?.trim() || 'default-ip-client';
}

function monthlyLimit(tier: Tier): number {
  const env = process.env.TIER_MONTHLY_TOOL_CALLS;
  if (tier === 'free' && env !== undefined && env !== '') {
    const n = Number(env);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return TIER_CONFIG[tier].monthlyToolCalls;
}

export function getToolCallUsage(tier: Tier): { count: number; limit: number; month: string } {
  const month = currentMonthUtc();
  const key = clientKey();
  const limit = monthlyLimit(tier);

  try {
    const row = getDb()
      .prepare('SELECT call_count FROM ip_quotas WHERE client_key = ? AND month = ?')
      .get(key, month) as { call_count: number } | undefined;
    return { count: row?.call_count ?? 0, limit, month };
  } catch (err) {
    log.error({ err }, 'Error reading quota usage from DB');
    return { count: 0, limit, month };
  }
}

/** Returns error message when Free monthly budget is exhausted. */
export function checkToolCallBudget(tier: Tier): string | null {
  const limit = monthlyLimit(tier);
  if (!Number.isFinite(limit)) return null;
  const { count } = getToolCallUsage(tier);
  if (count >= limit) {
    return `Free プランの月間ツール呼び出し上限（${limit} 回）に達しました。翌月（UTC）までお待ちいただくか、Pro プランをご検討ください。`;
  }
  return null;
}

export function recordToolCall(tier: Tier): void {
  const limit = monthlyLimit(tier);
  if (!Number.isFinite(limit)) return;
  const month = currentMonthUtc();
  const key = clientKey();

  try {
    getDb()
      .prepare(`
        INSERT INTO ip_quotas (client_key, month, call_count)
        VALUES (?, ?, 1)
        ON CONFLICT(client_key, month) DO UPDATE SET call_count = call_count + 1
      `)
      .run(key, month);
  } catch (err) {
    log.error({ err }, 'Error recording quota usage in DB');
  }
}

/** Test-only reset */
export function resetToolCallUsageForTests(): void {
  try {
    getDb().prepare('DELETE FROM ip_quotas').run();
  } catch (err) {
    // ignore
  }
}

