import { describe, it, expect } from 'vitest';
import { AssessExteriorVisualsInput, AnalyzeCommuteAccessibilityInput } from '../src/schemas.js';
import { assessExteriorVisuals } from '../src/tools/assess_exterior_visuals.js';
import { analyzeCommuteAccessibilityTool } from '../src/tools/analyze_commute_accessibility.js';

describe('assess_exterior_visuals tool', () => {
  it('schema validates correct input', () => {
    expect(() => AssessExteriorVisualsInput.parse({ prefecture: '愛知県' })).not.toThrow();
    expect(() => AssessExteriorVisualsInput.parse({ prefecture: '東京都', city: '新宿区', address: '西新宿1-1' })).not.toThrow();
  });

  it('returns mock visual analysis when API key is missing', async () => {
    const result = await assessExteriorVisuals({
      prefecture: '愛知県',
      city: '名古屋市中区',
      address: '栄3丁目',
    });

    expect(result.imageUrl).toBeDefined();
    expect(result.hasLiveImage).toBe(false);
    expect(result.hasLiveAnalysis).toBe(false);
    expect(result.analysis).toBeDefined();
    expect(result.analysis.overallVibe).toContain('名古屋市中区');
    expect(result.analysis.pros.length).toBeGreaterThan(0);
    expect(result.analysis.cons.length).toBeGreaterThan(0);
    expect(result.markdownReport).toContain('AI 街頭外観・環境監査レポート');
    expect(result.attribution).toContain('Simulation Engine');
  });

  it('resolves coordinates correctly using geocode map fallback', async () => {
    const result = await assessExteriorVisuals({
      prefecture: '東京都',
      city: '世田谷区',
    });
    expect(result.latitude).toBeCloseTo(35.6812, 1); // fallback default
    expect(result.longitude).toBeCloseTo(139.7671, 1); // fallback default
  });
});

describe('analyze_commute_accessibility tool', () => {
  it('schema validates correct input', () => {
    expect(() => AnalyzeCommuteAccessibilityInput.parse({ prefecture: '愛知県' })).not.toThrow();
    expect(() => AnalyzeCommuteAccessibilityInput.parse({ prefecture: '東京都', city: '世田谷区' })).not.toThrow();
  });

  it('calculates estimated commute times to hub stations', async () => {
    const result = await analyzeCommuteAccessibilityTool({
      prefecture: '愛知県',
      city: '名古屋市中村区',
      latitude: 35.1709,
      longitude: 136.8815,
    });

    expect(result.closestStation).toBeDefined();
    expect(result.accessibilityScore).toBeGreaterThan(0);
    expect(result.accessibilityScore).toBeLessThanOrEqual(100);
    expect(result.destinations.length).toBeGreaterThan(0);
    expect(result.destinations[0]!.name).toBe('名古屋駅');
    expect(result.markdownReport).toContain('交通・通勤アクセシビリティ評価レポート');
  });
});
