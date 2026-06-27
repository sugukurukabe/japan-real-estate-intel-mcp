import { describe, expect, it } from 'vitest';
import { QuickVisualSummaryInput, QuickVisualSummaryOutput } from '../src/schemas.js';
import { quickVisualSummary } from '../src/tools/quick_visual_summary.js';

describe('quick_visual_summary', () => {
  it('returns ChatGPT-friendly dashboard metadata and next actions', () => {
    const input = QuickVisualSummaryInput.parse({
      prefecture: '愛知県',
      area: '名古屋市中区',
      intent: 'arbitrage',
    });

    const result = quickVisualSummary(input);
    const parsed = QuickVisualSummaryOutput.parse(result);

    expect(parsed.dashboardUri).toBe('ui://japan-real-estate-intel/dashboard');
    expect(parsed.dashboardUrl).toContain('embed=chatgpt');
    expect(parsed.dashboardUrl).toContain('area=');
    expect(parsed.layer).toBe('land_price');
    expect(parsed.nextActions.length).toBeGreaterThanOrEqual(3);
    expect(parsed.markdownReport).toContain('次にできること');
  });

  it('uses intent-specific dashboard modes', () => {
    const store = quickVisualSummary(
      QuickVisualSummaryInput.parse({
        prefecture: '福岡県',
        area: '福岡市博多区',
        intent: 'store',
      }),
    );

    expect(store.layer).toBe('human_flow');
    expect(store.dashboardUrl).toContain('mode=store');
    expect(store.nextActions[0]?.tool).toBe('evaluate_store_location');
  });

  it('cashflow intent opens leveraged CF mode and suggests simulate_leveraged_cashflow', () => {
    const cf = quickVisualSummary(
      QuickVisualSummaryInput.parse({
        prefecture: '愛知県',
        area: '名古屋市中村区',
        intent: 'cashflow',
      }),
    );

    expect(cf.dashboardUrl).toContain('mode=cashflow');
    expect(cf.nextActions[0]?.tool).toBe('simulate_leveraged_cashflow');
  });

  it('investment intent prioritizes leveraged cashflow next action', () => {
    const inv = quickVisualSummary(
      QuickVisualSummaryInput.parse({
        prefecture: '東京都',
        area: '世田谷区',
        intent: 'investment',
      }),
    );

    expect(inv.nextActions[0]?.tool).toBe('simulate_leveraged_cashflow');
  });
});
