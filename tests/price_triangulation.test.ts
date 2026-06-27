import { describe, it, expect } from 'vitest';
import {
  computeTriangulationForCity,
  BENCHMARK,
  buildMarkdownReport,
} from '../src/analysis/price_triangulation.js';
import type { ArbitrageSignalItem } from '../src/schemas.js';
import { getLoader } from '../src/data-loaders/index.js';

describe('price_triangulation (v6.15.0)', () => {
  it('BENCHMARK has expected standard ratios', () => {
    expect(BENCHMARK.nationalRosenkaKojiRatio).toBe(0.8);
    expect(BENCHMARK.nationalTxKojiRatio).toBe(1.05);
  });

  it('computeTriangulationForCity returns null for unknown city', () => {
    const loader = getLoader('aichi');
    const result = computeTriangulationForCity(loader, '存在しない市');
    expect(result).toBeNull();
  });

  it('computeTriangulationForCity returns valid result for known city', () => {
    const loader = getLoader('aichi');
    const cities = loader.getCities();
    // Try cities until we find one with rosenka + land price data
    let result = null;
    for (const city of cities) {
      result = computeTriangulationForCity(loader, city);
      if (result) break;
    }
    expect(result).not.toBeNull();
    if (result) {
      expect(result.city).toBeTruthy();
      expect(result.rosenka).toBeGreaterThan(0);
      expect(result.koji).toBeGreaterThan(0);
      expect(result.rosenkaKojiRatio).toBeGreaterThan(0);
      expect(result.transactionKojiRatio).toBeGreaterThan(0);
      expect(['discount', 'inheritance_edge', 'overheated', 'fair']).toContain(result.signal);
    }
  });

  it('rosenkaKojiRatio is approximately 0.80 for generated data', () => {
    const loader = getLoader('aichi');
    const cities = loader.getCities();
    for (const city of cities) {
      const result = computeTriangulationForCity(loader, city);
      if (result) {
        // The generated rosenka data is 80% of koji, so ratio should be close to 0.80
        expect(result.rosenkaKojiRatio).toBeGreaterThan(0.6);
        expect(result.rosenkaKojiRatio).toBeLessThan(1.0);
        break;
      }
    }
  });

  it('assessmentGap is transactionMedian - rosenka', () => {
    const loader = getLoader('aichi');
    const cities = loader.getCities();
    for (const city of cities) {
      const result = computeTriangulationForCity(loader, city);
      if (result) {
        const expectedGap = result.transactionMedian - result.rosenka;
        expect(result.assessmentGap).toBe(expectedGap);
        break;
      }
    }
  });

  it('signal is fair for typical generated data (tx ≈ koji × 1.05)', () => {
    const loader = getLoader('aichi');
    const cities = loader.getCities();
    // Most cities with tx data close to koji × 1.05 should be 'fair'
    const results = cities.flatMap((c) => {
      const r = computeTriangulationForCity(loader, c);
      return r ? [r] : [];
    });
    expect(results.length).toBeGreaterThan(0);
    const fairCount = results.filter((r) => r.signal === 'fair').length;
    expect(fairCount).toBeGreaterThan(0);
  });

  it('buildMarkdownReport returns non-empty markdown', () => {
    const items: ArbitrageSignalItem[] = [
      {
        city: '名古屋市中区',
        rosenka: 400000,
        koji: 500000,
        transactionMedian: 520000,
        rosenkaKojiRatio: 0.8,
        transactionKojiRatio: 1.04,
        assessmentGap: 120000,
        signal: 'fair',
        interpretation: 'テスト解釈テキスト',
      },
    ];
    const md = buildMarkdownReport('愛知県', items, 20, 2024, false);
    expect(md).toContain('価格トライアングル分析レポート');
    expect(md).toContain('名古屋市中区');
    expect(md).toContain('fair');
  });

  it('interpretation text is non-empty for all signal types', () => {
    const loader = getLoader('aichi');
    const cities = loader.getCities();
    const signals = new Set<string>();
    for (const city of cities) {
      const r = computeTriangulationForCity(loader, city);
      if (r) {
        expect(r.interpretation.length).toBeGreaterThan(0);
        signals.add(r.signal);
      }
    }
    // Should have at least one signal type
    expect(signals.size).toBeGreaterThan(0);
  });
});
