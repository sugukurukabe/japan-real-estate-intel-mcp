import { describe, it, expect } from 'vitest';
import { getLoader } from '../src/data-loaders/index.js';
import { drillDownLocalAnalysis } from '../src/tools/drill_down_local_analysis.js';

describe('Neighborhood data loading', () => {
  it('Aichi loader returns neighborhood records', () => {
    const loader = getLoader('aichi');
    expect(loader.capabilities.neighborhoods).toBe(true);
    const records = loader.getNeighborhoods();
    expect(records.length).toBeGreaterThan(30);
  });

  it('neighborhood records have required fields', () => {
    const loader = getLoader('aichi');
    const records = loader.getNeighborhoods();
    for (const r of records.slice(0, 10)) {
      expect(r.city).toBeTruthy();
      expect(r.district).toBeTruthy();
      expect(r.neighborhood).toBeTruthy();
      expect(r.population).toBeGreaterThan(0);
      expect(r.households).toBeGreaterThan(0);
      expect(r.pop_density_sqkm).toBeGreaterThan(0);
      expect(r.avg_age).toBeGreaterThan(20);
      expect(r.child_ratio).toBeGreaterThanOrEqual(0);
      expect(r.elderly_ratio).toBeGreaterThanOrEqual(0);
      expect(r.daytime_pop_ratio).toBeGreaterThan(0);
    }
  });

  it('Tokyo loader returns neighborhood records', () => {
    const loader = getLoader('tokyo');
    expect(loader.capabilities.neighborhoods).toBe(true);
    const records = loader.getNeighborhoods();
    expect(records.length).toBeGreaterThan(10);
  });

  it('Osaka loader returns neighborhood records', () => {
    const loader = getLoader('osaka');
    expect(loader.capabilities.neighborhoods).toBe(true);
    const records = loader.getNeighborhoods();
    expect(records.length).toBeGreaterThan(15);
  });

  it('Stub loader returns no neighborhoods', () => {
    const loader = getLoader('okinawa');
    expect(loader.capabilities.neighborhoods).toBe(false);
    expect(loader.getNeighborhoods()).toHaveLength(0);
  });
});

describe('Neighborhood-level drill down', () => {
  it('uses real neighborhood data when available', () => {
    const result = drillDownLocalAnalysis({
      prefecture: '愛知県',
      city: '名古屋市中村区',
      neighborhood: '名駅南1丁目',
      focus: 'all',
    });
    expect(result.neighborhoodDataAvailable).toBe(true);
    expect(result.households).toBeGreaterThan(0);
    expect(result.avgAge).toBeGreaterThan(20);
    expect(result.daytimePopRatio).toBeGreaterThan(0);
    expect(result.markdownReport).toContain('町丁目');
  });

  it('returns city-level data when neighborhood not found', () => {
    const result = drillDownLocalAnalysis({
      prefecture: '愛知県',
      city: '名古屋市中村区',
      neighborhood: '存在しない町丁目',
      focus: 'all',
    });
    expect(result.neighborhoodDataAvailable).not.toBe(true);
  });

  it('neighborhood data enriches keyInsights', () => {
    const result = drillDownLocalAnalysis({
      prefecture: '愛知県',
      city: '名古屋市中区',
      neighborhood: '栄3丁目',
      focus: 'all',
    });
    const hasNeighborhoodInsight = result.keyInsights.some(
      (i: string) => i.includes('町丁目') || i.includes('栄'),
    );
    expect(hasNeighborhoodInsight).toBe(true);
  });

  it('Osaka neighborhood drill down works', () => {
    const result = drillDownLocalAnalysis({
      prefecture: '大阪府',
      city: '中央区',
      neighborhood: '心斎橋筋1丁目',
      focus: 'all',
    });
    expect(result.scope.prefecture).toBe('大阪府');
    expect(result.markdownReport.length).toBeGreaterThan(0);
  });
});
