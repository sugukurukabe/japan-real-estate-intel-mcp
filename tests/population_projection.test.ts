import { describe, it, expect } from 'vitest';
import { getLoader } from '../src/data-loaders/index.js';
import { PopulationOutlookInput } from '../src/schemas.js';
import { getPopulationOutlookTool } from '../src/tools/get_population_outlook.js';

describe('PopulationProjectionRecord loader', () => {
  it('loads population projection for aichi', () => {
    const loader = getLoader('aichi');
    const records = loader.getPopulationProjection();
    expect(records.length).toBeGreaterThan(0);
  });

  it('each record has required fields', () => {
    const loader = getLoader('aichi');
    const records = loader.getPopulationProjection();
    for (const r of records) {
      expect(r.city).toBeTruthy();
      expect(typeof r.pop_2020).toBe('number');
      expect(typeof r.pop_2030).toBe('number');
      expect(typeof r.pop_2040).toBe('number');
      expect(typeof r.pop_2050).toBe('number');
      expect(typeof r.decline_rate_2050).toBe('number');
    }
  });

  it('population should decrease over time (national average)', () => {
    const loader = getLoader('aichi');
    const records = loader.getPopulationProjection();
    let declineCount = 0;
    for (const r of records) {
      if (r.pop_2050 < r.pop_2020) declineCount++;
    }
    expect(declineCount / records.length).toBeGreaterThan(0.5);
  });

  it('decline_rate_2050 is reasonable (0-50%)', () => {
    const loader = getLoader('tokyo');
    const records = loader.getPopulationProjection();
    for (const r of records) {
      expect(r.decline_rate_2050).toBeGreaterThanOrEqual(0);
      expect(r.decline_rate_2050).toBeLessThan(50);
    }
  });

  it('capabilities includes populationProjection', () => {
    const loader = getLoader('aichi');
    expect(loader.capabilities.populationProjection).toBe(true);
  });

  it('major prefectures have projection data', () => {
    const prefs = ['aichi', 'tokyo', 'osaka', 'kanagawa', 'fukuoka'];
    for (const pref of prefs) {
      const loader = getLoader(pref);
      expect(loader.getPopulationProjection().length).toBeGreaterThan(0);
    }
  });
});

describe('get_population_outlook tool', () => {
  it('returns structured result for aichi', async () => {
    const result = await getPopulationOutlookTool({ prefecture: '愛知県' });
    expect(result.content).toHaveLength(1);
    expect(result.structuredContent).toBeDefined();
    const sc = result.structuredContent;
    expect(sc.prefectureAvgDecline).toBeDefined();
    expect(sc.attribution).toBeTruthy();
  });

  it('filters by area', async () => {
    const result = await getPopulationOutlookTool({ prefecture: '愛知県', area: '名古屋市' });
    const records = result.structuredContent.records as Array<{ city: string }>;
    for (const r of records) {
      expect(r.city).toContain('名古屋');
    }
  });

  it('PopulationOutlookInput schema validates correct input', () => {
    expect(() => PopulationOutlookInput.parse({ prefecture: '東京都' })).not.toThrow();
    expect(() =>
      PopulationOutlookInput.parse({ prefecture: '東京都', area: '世田谷区' }),
    ).not.toThrow();
  });
});
