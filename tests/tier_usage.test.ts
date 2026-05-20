import { describe, expect, it, beforeEach } from 'vitest';
import {
  checkToolCallBudget,
  recordToolCall,
  resetToolCallUsageForTests,
} from '../src/tier-usage.js';

describe('tier-usage', () => {
  beforeEach(() => {
    resetToolCallUsageForTests();
    delete process.env.TIER_MONTHLY_TOOL_CALLS;
  });

  it('allows calls under free limit', () => {
    process.env.TIER_MONTHLY_TOOL_CALLS = '2';
    expect(checkToolCallBudget('free')).toBeNull();
    recordToolCall('free');
    expect(checkToolCallBudget('free')).toBeNull();
    recordToolCall('free');
    expect(checkToolCallBudget('free')).toMatch(/上限/);
  });

  it('pro tier has no finite limit by default', () => {
    for (let i = 0; i < 60; i++) recordToolCall('pro');
    expect(checkToolCallBudget('pro')).toBeNull();
  });
});
