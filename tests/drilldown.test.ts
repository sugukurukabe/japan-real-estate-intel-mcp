import { describe, it, expect } from 'vitest';
import { drillDownLocalAnalysis } from '../src/tools/drill_down_local_analysis.js';

describe('drill_down_local_analysis', () => {
  it('returns non-null price data for known Aichi city', () => {
    const result = drillDownLocalAnalysis({
      prefecture: '愛知県',
      city: '名古屋市中村区',
      focus: 'all',
    });
    expect(result.scope.prefecture).toBe('愛知県');
    expect(result.scope.city).toBe('名古屋市中村区');
    expect(result.pricePerSqm).not.toBeNull();
    expect(typeof result.pricePerSqm).toBe('number');
  });

  it('returns non-null population for known Aichi city', () => {
    const result = drillDownLocalAnalysis({
      prefecture: '愛知県',
      city: '名古屋市中村区',
      focus: 'demand',
    });
    expect(result.population).not.toBeNull();
    expect(result.population!.total).toBeGreaterThan(0);
  });

  it('Tokyo humanFlowScore is null (capability false) with granularityNote', () => {
    const result = drillDownLocalAnalysis({
      prefecture: '東京都',
      city: '千代田区',
      focus: 'all',
    });
    expect(result.humanFlowScore).toBeNull();
    expect(result.granularityNote).toBeTruthy();
  });

  it('unknown city returns null metrics without crashing', () => {
    const result = drillDownLocalAnalysis({
      prefecture: '愛知県',
      city: '存在しない市XYZ',
      focus: 'all',
    });
    expect(result.pricePerSqm).toBeNull();
    expect(result.population).toBeNull();
    expect(result.markdownReport).toContain('#');
  });

  it('neighborhood appears in localPitch and markdownReport', () => {
    const result = drillDownLocalAnalysis({
      prefecture: '愛知県',
      city: '名古屋市中村区',
      neighborhood: '名駅南1丁目',
      focus: 'all',
    });
    expect(result.scope.neighborhood).toBe('名駅南1丁目');
    expect(result.granularity).toBe('neighborhood');
    expect(result.markdownReport).toContain('名駅南1丁目');
  });

  it('focus=price returns price data only (risk may be null)', () => {
    const result = drillDownLocalAnalysis({
      prefecture: '愛知県',
      city: '名古屋市中区',
      focus: 'price',
    });
    expect(result.pricePerSqm).not.toBeNull();
    expect(result.population).toBeNull();
    expect(result.riskScore).toBeNull();
  });

  it('Osaka prefecture returns valid result', () => {
    const result = drillDownLocalAnalysis({
      prefecture: '大阪府',
      city: '中央区',
      focus: 'all',
    });
    expect(result.scope.prefecture).toBe('大阪府');
    expect(result.markdownReport.length).toBeGreaterThan(0);
  });

  it('StubLoader prefecture does not crash', () => {
    const result = drillDownLocalAnalysis({
      prefecture: '沖縄県',
      city: '那覇市',
      focus: 'all',
    });
    expect(result.scope.prefecture).toBe('沖縄県');
    expect(result.pricePerSqm).toBeNull();
    expect(result.markdownReport.length).toBeGreaterThan(0);
  });

  it('markdownReport contains heading marker', () => {
    const result = drillDownLocalAnalysis({
      prefecture: '愛知県',
      city: '名古屋市中区',
      focus: 'all',
    });
    expect(result.markdownReport).toContain('# ');
  });
});
