/**
 * In-process monthly tool-call budget for Free tier (single-host / demo).
 * Resets each calendar month (UTC). Persisted to SQLite DB with in-memory fallback.
 */
import type { Tier } from './tiers.js';
import { TIER_CONFIG } from './tiers.js';
import { getClientUsage, incrementClientUsage, resetClientUsageForTests } from './auth/oauth-store.js';
import { moduleLogger } from './logger.js';

const log = moduleLogger('quota_store');

type UsageState = { month: string; count: number };
const usageByClient = new Map<string, UsageState>();

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

export function getToolCallUsage(tier: Tier, clientId?: string): { count: number; limit: number; month: string } {
  const month = currentMonthUtc();
  const key = clientId || clientKey();
  const limit = monthlyLimit(tier);
  let count = 0;
  try {
    count = getClientUsage(key, month);
  } catch (err) {
    // Graceful fallback to in-memory for testing or if DB is offline
    const state = usageByClient.get(key);
    count = state?.month === month ? state.count : 0;
  }
  return { count, limit, month };
}

/** Returns error message when Free monthly budget is exhausted. */
export function checkToolCallBudget(tier: Tier, clientId?: string): string | null {
  const limit = monthlyLimit(tier);
  if (!Number.isFinite(limit)) return null;
  const { count } = getToolCallUsage(tier, clientId);
  if (count >= limit) {
    return `Free プランの月間ツール呼び出し上限（${limit} 回）に達しました。翌月（UTC）までお待ちいただくか、Pro プランをご検討ください。`;
  }
  return null;
}

export function recordToolCall(tier: Tier, clientId?: string): void {
  const limit = monthlyLimit(tier);
  if (!Number.isFinite(limit)) return;
  const month = currentMonthUtc();
  const key = clientId || clientKey();
  
  // 1. Update in-memory for tests / fallback
  const state = usageByClient.get(key);
  if (!state || state.month !== month) {
    usageByClient.set(key, { month, count: 1 });
  } else {
    state.count += 1;
  }

  // 2. Persist to SQLite DB
  try {
    incrementClientUsage(key, month);
  } catch (err) {
    // Ignore db-write failure under pure-stdio local contexts
    log.debug({ err }, 'Failed to persist quota usage, using in-memory only');
  }
}

/** Test-only reset */
export function resetToolCallUsageForTests(): void {
  usageByClient.clear();
  try {
    resetClientUsageForTests();
  } catch (err) {
    // Ignore if DB not ready
  }
}
