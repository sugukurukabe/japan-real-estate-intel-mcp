import { describe, it, expect } from 'vitest';
import { getLoader } from '../src/data-loaders/index.js';

describe('Rosenka data layer (v6.15.0)', () => {
  it('aichi loader has rosenka capability', () => {
    const loader = getLoader('aichi');
    expect(loader.capabilities.rosenka).toBe(true);
  });

  it('tokyo loader has rosenka capability', () => {
    const loader = getLoader('tokyo');
    expect(loader.capabilities.rosenka).toBe(true);
  });

  it('getRosenka() returns array', () => {
    const loader = getLoader('aichi');
    const rows = loader.getRosenka();
    expect(Array.isArray(rows)).toBe(true);
  });

  it('getRosenka() returns non-empty data for aichi', () => {
    const loader = getLoader('aichi');
    const rows = loader.getRosenka();
    expect(rows.length).toBeGreaterThan(0);
  });

  it('rosenka rows have required fields', () => {
    const loader = getLoader('aichi');
    const rows = loader.getRosenka();
    if (rows.length > 0) {
      const first = rows[0]!;
      expect(typeof first.city).toBe('string');
      expect(typeof first.district).toBe('string');
      expect(typeof first.year).toBe('number');
      expect(typeof first.median_per_sqm).toBe('number');
      expect(typeof first.max_per_sqm).toBe('number');
      expect(typeof first.min_per_sqm).toBe('number');
      expect(typeof first.sample_lines).toBe('number');
    }
  });

  it('rosenka median_per_sqm is approximately 80% of koji (land price)', () => {
    const loader = getLoader('aichi');
    const rosenka = loader.getRosenka();
    const landPrices = loader.getLandPrices();
    if (rosenka.length > 0 && landPrices.length > 0) {
      const r = rosenka[0]!;
      const matchKoji = landPrices.filter(p => p.city === r.city && p.year === r.year);
      if (matchKoji.length > 0) {
        const kojiMedian = matchKoji[Math.floor(matchKoji.length / 2)]!.price_per_sqm;
        // Should be roughly 80% of koji (allow 5% tolerance for rounding)
        expect(r.median_per_sqm / kojiMedian).toBeCloseTo(0.80, 1);
      }
    }
  });

  it('stub loader getRosenka returns empty array', () => {
    // StubLoader is used for unknown prefectures
    const loader = getLoader('unknown-pref-xyz');
    const rows = loader.getRosenka();
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBe(0);
  });

  it('stub loader has rosenka: false capability', () => {
    const loader = getLoader('unknown-pref-xyz');
    expect(loader.capabilities.rosenka).toBe(false);
  });

  it('getRosenka() for all 10 prefectures returns data', () => {
    const prefs = ['aichi', 'tokyo', 'osaka', 'fukuoka', 'hokkaido', 'kanagawa', 'kyoto', 'hyogo', 'chiba', 'saitama'];
    for (const pref of prefs) {
      const loader = getLoader(pref);
      const rows = loader.getRosenka();
      expect(rows.length).toBeGreaterThan(0);
    }
  });
});
