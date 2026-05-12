import { describe, it, expect } from 'vitest';
import { getLoader } from '../src/data-loaders/index.js';
import { VacancyStatsInput } from '../src/schemas.js';
import { getVacancyStatsTool } from '../src/tools/get_vacancy_stats.js';

describe('VacancyRecord loader', () => {
  it('loads vacancy data for aichi', () => {
    const loader = getLoader('aichi');
    const records = loader.getVacancy();
    expect(records.length).toBeGreaterThan(0);
  });

  it('each record has required fields', () => {
    const loader = getLoader('aichi');
    const records = loader.getVacancy();
    for (const r of records) {
      expect(r.city).toBeTruthy();
      expect(typeof r.total_housing).toBe('number');
      expect(typeof r.total_vacant).toBe('number');
      expect(typeof r.vacancy_rate).toBe('number');
      expect(typeof r.for_rent).toBe('number');
      expect(typeof r.for_sale).toBe('number');
    }
  });

  it('vacancy_rate is reasonable (0-50%)', () => {
    const loader = getLoader('tokyo');
    const records = loader.getVacancy();
    for (const r of records) {
      expect(r.vacancy_rate).toBeGreaterThanOrEqual(0);
      expect(r.vacancy_rate).toBeLessThan(50);
    }
  });

  it('capabilities includes vacancy', () => {
    const loader = getLoader('aichi');
    expect(loader.capabilities.vacancy).toBe(true);
  });

  it('all 10 prefectures have vacancy data', () => {
    const prefs = ['aichi', 'tokyo', 'osaka', 'fukuoka', 'hokkaido', 'kanagawa', 'kyoto', 'hyogo', 'chiba', 'saitama'];
    for (const pref of prefs) {
      const loader = getLoader(pref);
      expect(loader.getVacancy().length).toBeGreaterThan(0);
    }
  });
});

describe('get_vacancy_stats tool', () => {
  it('returns structured result for all of aichi', async () => {
    const result = await getVacancyStatsTool({ prefecture: '愛知県' });
    expect(result.content).toHaveLength(1);
    expect(result.structuredContent).toBeDefined();
    const sc = result.structuredContent;
    expect(sc.prefectureAvgRate).toBeDefined();
    expect(sc.nationalAvgRate).toBe(13.6);
    expect(sc.attribution).toBeTruthy();
  });

  it('filters by area', async () => {
    const result = await getVacancyStatsTool({ prefecture: '愛知県', area: '名古屋市' });
    const records = result.structuredContent.records as Array<{ city: string }>;
    for (const r of records) {
      expect(r.city).toContain('名古屋');
    }
  });

  it('VacancyStatsInput schema validates correct input', () => {
    expect(() => VacancyStatsInput.parse({ prefecture: '東京都' })).not.toThrow();
    expect(() => VacancyStatsInput.parse({ prefecture: '東京都', area: '新宿区' })).not.toThrow();
  });
});
