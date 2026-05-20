/**
 * In-process monthly tool-call budget for Free tier (single-host / demo).
 * Resets each calendar month (UTC). Not durable across restarts — use for
 * soft limits until account-backed metering exists.
 */
import type { Tier } from './tiers.js';
import { TIER_CONFIG } from './tiers.js';

type UsageState = { month: string; count: number };

const usageByClient = new Map<string, UsageState>();

function currentMonthUtc(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function clientKey(): string {
  return process.env.USAGE_CLIENT_ID?.trim() || 'default';
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
  const state = usageByClient.get(key);
  const count = state?.month === month ? state.count : 0;
  const limit = monthlyLimit(tier);
  return { count, limit, month };
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
  const state = usageByClient.get(key);
  if (!state || state.month !== month) {
    usageByClient.set(key, { month, count: 1 });
    return;
  }
  state.count += 1;
}

/** Test-only reset */
export function resetToolCallUsageForTests(): void {
  usageByClient.clear();
}
