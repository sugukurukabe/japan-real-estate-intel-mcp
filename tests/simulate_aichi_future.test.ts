import { describe, it, expect } from 'vitest';
import { simulateAichiFuture, AichiFutureInput } from '../src/tools/simulate_aichi_future.js';

describe('simulateAichiFuture — schema', () => {
  it('parses with defaults', () => {
    const input = AichiFutureInput.parse({ city: '名古屋市中村区' });
    expect(input.horizon).toBe('10y');
    expect(input.scenarios).toEqual(['all']);
    expect(input.includeMarkdown).toBe(true);
  });

  it('accepts 3y horizon', () => {
    const input = AichiFutureInput.parse({ city: '豊田市', horizon: '3y' });
    expect(input.horizon).toBe('3y');
  });

  it('rejects invalid horizon', () => {
    expect(() => AichiFutureInput.parse({ city: '名古屋市', horizon: '20y' })).toThrow();
  });
});

describe('simulateAichiFuture — Linear Chuo Shinkansen', () => {
  it('returns high uplift for 名古屋市中村区 (direct Linear zone)', () => {
    const result = simulateAichiFuture({
      city: '名古屋市中村区',
      scenarios: ['linear_chuo'],
      horizon: '10y',
      includeMarkdown: false,
    });
    expect(result.scenarios.length).toBeGreaterThanOrEqual(1);
    const linearScenario = result.scenarios.find((s) => s.scenario === 'linear_chuo');
    expect(linearScenario).toBeDefined();
    expect(linearScenario!.upliftPct).toBeGreaterThanOrEqual(20);
    expect(linearScenario!.signal).toBe('strong_buy');
  });

  it('returns buy signal for 名古屋市中区 (wave effect)', () => {
    const result = simulateAichiFuture({
      city: '名古屋市中区',
      scenarios: ['linear_chuo'],
      horizon: '10y',
      includeMarkdown: false,
    });
    const scenario = result.scenarios.find((s) => s.scenario === 'linear_chuo');
    expect(scenario).toBeDefined();
    expect(scenario!.upliftPct).toBeGreaterThan(0);
  });

  it('confidence band spans uplift ± band', () => {
    const result = simulateAichiFuture({
      city: '名古屋市中村区',
      scenarios: ['linear_chuo'],
      horizon: '10y',
      includeMarkdown: false,
    });
    const s = result.scenarios[0];
    expect(s.confidenceHigh).toBeGreaterThan(s.upliftPct);
    expect(s.confidenceLow).toBeLessThanOrEqual(s.upliftPct);
  });
});

describe('simulateAichiFuture — Centrair expansion', () => {
  it('returns positive uplift for 常滑市', () => {
    const result = simulateAichiFuture({
      city: '常滑市',
      scenarios: ['centrair_expansion'],
      horizon: '10y',
      includeMarkdown: false,
    });
    const s = result.scenarios.find((r) => r.scenario === 'centrair_expansion');
    expect(s).toBeDefined();
    expect(s!.upliftPct).toBeGreaterThan(0);
  });
});

describe('simulateAichiFuture — Toyota industrial', () => {
  it('returns positive uplift for 豊田市', () => {
    const result = simulateAichiFuture({
      city: '豊田市',
      scenarios: ['toyota_industrial'],
      horizon: '10y',
      includeMarkdown: false,
    });
    const s = result.scenarios.find((r) => r.scenario === 'toyota_industrial');
    expect(s).toBeDefined();
    expect(s!.upliftPct).toBeGreaterThan(0);
  });

  it('3y horizon returns lower uplift than 10y for same city', () => {
    const r3 = simulateAichiFuture({
      city: '豊田市',
      scenarios: ['toyota_industrial'],
      horizon: '3y',
      includeMarkdown: false,
    });
    const r10 = simulateAichiFuture({
      city: '豊田市',
      scenarios: ['toyota_industrial'],
      horizon: '10y',
      includeMarkdown: false,
    });
    const u3 = r3.scenarios[0]?.upliftPct ?? 0;
    const u10 = r10.scenarios[0]?.upliftPct ?? 0;
    expect(u3).toBeLessThanOrEqual(u10);
  });
});

describe('simulateAichiFuture — signal thresholds', () => {
  it('strong_buy when uplift >= 20', () => {
    const result = simulateAichiFuture({
      city: '名古屋市中村区',
      scenarios: ['linear_chuo'],
      horizon: '10y',
      includeMarkdown: false,
    });
    const s = result.scenarios[0];
    if (s && s.upliftPct >= 20) expect(s.signal).toBe('strong_buy');
  });

  it('compositeSignal reflects totalUpliftPct', () => {
    const result = simulateAichiFuture({
      city: '名古屋市中村区',
      scenarios: ['all'],
      horizon: '10y',
      includeMarkdown: false,
    });
    expect(result.totalUpliftPct).toBeGreaterThan(0);
    expect(result.totalUpliftPct).toBeLessThanOrEqual(45); // capped
    expect(['strong_buy', 'buy', 'hold', 'watch', 'neutral']).toContain(result.compositeSignal);
  });
});

describe('simulateAichiFuture — all scenarios', () => {
  it('totalUpliftPct is capped at 45%', () => {
    const result = simulateAichiFuture({
      city: '名古屋市中村区',
      scenarios: ['all'],
      horizon: '10y',
      includeMarkdown: false,
    });
    expect(result.totalUpliftPct).toBeLessThanOrEqual(45);
  });

  it('topDrivers lists highest contributors', () => {
    const result = simulateAichiFuture({
      city: '名古屋市中村区',
      scenarios: ['all'],
      horizon: '10y',
      includeMarkdown: false,
    });
    expect(result.topDrivers.length).toBeGreaterThan(0);
    expect(result.topDrivers[0]).toMatch(/\+\d+%/);
  });

  it('riskFactors is non-empty', () => {
    const result = simulateAichiFuture({
      city: '名古屋市中村区',
      scenarios: ['all'],
      horizon: '10y',
      includeMarkdown: false,
    });
    expect(result.riskFactors.length).toBeGreaterThan(0);
  });

  it('includes attribution string', () => {
    const result = simulateAichiFuture({
      city: '名古屋市中村区',
      scenarios: ['all'],
      horizon: '10y',
      includeMarkdown: false,
    });
    expect(result.attribution).toBeTruthy();
    expect(result.attribution.length).toBeGreaterThan(10);
  });
});

describe('simulateAichiFuture — markdown output', () => {
  it('markdownReport is defined when includeMarkdown=true', () => {
    const result = simulateAichiFuture({
      city: '名古屋市中村区',
      scenarios: ['all'],
      horizon: '10y',
      includeMarkdown: true,
    });
    expect(result.markdownReport).toBeDefined();
    expect(result.markdownReport!.length).toBeGreaterThan(50);
  });

  it('markdownReport is undefined when includeMarkdown=false', () => {
    const result = simulateAichiFuture({
      city: '豊田市',
      scenarios: ['all'],
      horizon: '5y',
      includeMarkdown: false,
    });
    expect(result.markdownReport).toBeUndefined();
  });

  it('markdownReport contains city name', () => {
    const result = simulateAichiFuture({
      city: '豊田市',
      scenarios: ['all'],
      horizon: '10y',
      includeMarkdown: true,
    });
    expect(result.markdownReport).toContain('豊田市');
  });

  it('markdownReport contains uplift percentage', () => {
    const result = simulateAichiFuture({
      city: '名古屋市中村区',
      scenarios: ['all'],
      horizon: '10y',
      includeMarkdown: true,
    });
    expect(result.markdownReport).toMatch(/\+\d+/);
  });
});

describe('simulateAichiFuture — unknown city', () => {
  it('returns empty scenarios but does not throw for unknown city', () => {
    const result = simulateAichiFuture({
      city: '架空市',
      scenarios: ['all'],
      horizon: '10y',
      includeMarkdown: true,
    });
    expect(result.scenarios).toEqual([]);
    expect(result.totalUpliftPct).toBe(0);
    expect(result.compositeSignal).toBe('neutral');
  });

  it('markdown for unknown city contains fallback message', () => {
    const result = simulateAichiFuture({
      city: '架空市',
      scenarios: ['all'],
      horizon: '10y',
      includeMarkdown: true,
    });
    expect(result.markdownReport).toContain('架空市');
  });
});
