import { describe, it, expect } from 'vitest';
import { evaluateStoreLocation } from '../src/tools/evaluate_store_location.js';
import { StoreLocationInput, StoreLocationOutput } from '../src/schemas.js';

describe('StoreLocationInput schema', () => {
  it('parses valid convenience store input', () => {
    const input = StoreLocationInput.parse({
      city: '名古屋市中村区',
      storeType: 'convenience',
    });
    expect(input.prefecture).toBe('愛知県');
    expect(input.radiusM).toBe(500);
    expect(input.includeMarkdown).toBe(true);
  });

  it('parses with custom weights', () => {
    const input = StoreLocationInput.parse({
      city: '名古屋市中区',
      storeType: 'cafe',
      customWeights: { humanFlow: 50, population: 20, risk: 10, competition: 10, transport: 10 },
    });
    expect(input.customWeights?.humanFlow).toBe(50);
  });

  it('rejects invalid storeType', () => {
    expect(() =>
      StoreLocationInput.parse({ city: '名古屋市', storeType: 'invalid' }),
    ).toThrow();
  });

  it('accepts all valid store types', () => {
    for (const type of ['convenience', 'family_restaurant', 'cafe', 'drugstore', 'supermarket']) {
      const input = StoreLocationInput.parse({ city: '名古屋市', storeType: type });
      expect(input.storeType).toBe(type);
    }
  });
});

describe('evaluateStoreLocation (Aichi)', () => {
  it('returns overallScore between 0 and 100', () => {
    const result = evaluateStoreLocation({
      prefecture: '愛知県',
      city: '名古屋市中村区',
      storeType: 'convenience',
      radiusM: 500,
      includeMarkdown: true,
    });
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it('returns all breakdown dimensions', () => {
    const result = evaluateStoreLocation({
      prefecture: '愛知県',
      city: '名古屋市中区',
      storeType: 'cafe',
      radiusM: 500,
      includeMarkdown: false,
    });
    const dims = Object.keys(result.breakdown);
    expect(dims).toContain('population');
    expect(dims).toContain('humanFlow');
    expect(dims).toContain('risk');
    expect(dims).toContain('competition');
    expect(dims).toContain('transport');
    expect(dims).toContain('education');
    expect(dims).toContain('commercial');
    expect(dims).toContain('medical');
  });

  it('finds key competitors for convenience store near Nagoya station', () => {
    const result = evaluateStoreLocation({
      prefecture: '愛知県',
      city: '名古屋市中村区',
      storeType: 'convenience',
      radiusM: 5000,
      includeMarkdown: false,
    });
    expect(result.keyCompetitors.length).toBeGreaterThan(0);
    expect(result.keyCompetitors[0]).toHaveProperty('name');
    expect(result.keyCompetitors[0]).toHaveProperty('chainBrand');
    expect(result.keyCompetitors[0]).toHaveProperty('distance');
    expect(result.keyCompetitors[0]).toHaveProperty('strength');
  });

  it('generates differentiation suggestions', () => {
    const result = evaluateStoreLocation({
      prefecture: '愛知県',
      city: '名古屋市中村区',
      storeType: 'convenience',
      radiusM: 500,
      includeMarkdown: false,
    });
    expect(result.differentiationSuggestions.length).toBeGreaterThan(0);
  });

  it('generates markdown report when requested', () => {
    const result = evaluateStoreLocation({
      prefecture: '愛知県',
      city: '名古屋市中村区',
      storeType: 'family_restaurant',
      radiusM: 500,
      includeMarkdown: true,
    });
    expect(result.markdownReport).toBeDefined();
    expect(result.markdownReport).toContain('出店適地評価レポート');
    expect(result.markdownReport).toContain('総合スコア');
    expect(result.markdownReport).toContain('競合分析');
  });

  it('omits markdown when includeMarkdown is false', () => {
    const result = evaluateStoreLocation({
      prefecture: '愛知県',
      city: '名古屋市中村区',
      storeType: 'drugstore',
      radiusM: 500,
      includeMarkdown: false,
    });
    expect(result.markdownReport).toBeUndefined();
  });

  it('applies custom weights correctly', () => {
    const baseResult = evaluateStoreLocation({
      prefecture: '愛知県',
      city: '名古屋市中村区',
      storeType: 'convenience',
      radiusM: 500,
      includeMarkdown: false,
    });
    const customResult = evaluateStoreLocation({
      prefecture: '愛知県',
      city: '名古屋市中村区',
      storeType: 'convenience',
      radiusM: 500,
      includeMarkdown: false,
      customWeights: { humanFlow: 100, population: 0, risk: 0, competition: 0, transport: 0, education: 0, commercial: 0, medical: 0 },
    });
    expect(customResult.overallScore).toBe(customResult.breakdown.humanFlow);
  });

  it('output validates against StoreLocationOutput schema', () => {
    const result = evaluateStoreLocation({
      prefecture: '愛知県',
      city: '名古屋市中村区',
      storeType: 'supermarket',
      radiusM: 500,
      includeMarkdown: true,
    });
    expect(() => StoreLocationOutput.parse(result)).not.toThrow();
  });

  it('handles unknown city gracefully', () => {
    const result = evaluateStoreLocation({
      prefecture: '愛知県',
      city: 'ありえない市XYZ',
      storeType: 'convenience',
      radiusM: 500,
      includeMarkdown: false,
    });
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it('different store types report their storeType correctly', () => {
    const conv = evaluateStoreLocation({
      prefecture: '愛知県',
      city: '名古屋市中村区',
      storeType: 'convenience',
      radiusM: 500,
      includeMarkdown: false,
    });
    const cafe = evaluateStoreLocation({
      prefecture: '愛知県',
      city: '名古屋市中村区',
      storeType: 'cafe',
      radiusM: 500,
      includeMarkdown: false,
    });
    expect(conv.storeType).toBe('convenience');
    expect(cafe.storeType).toBe('cafe');
  });
});

describe('evaluateStoreLocation (Tokyo - no data)', () => {
  it('returns valid output with low scores', () => {
    const result = evaluateStoreLocation({
      prefecture: '東京都',
      city: '渋谷区',
      storeType: 'convenience',
      radiusM: 500,
      includeMarkdown: false,
    });
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.keyCompetitors).toHaveLength(0);
  });
});
