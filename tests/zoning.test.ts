import { describe, it, expect } from 'vitest';
import { getLoader } from '../src/data-loaders/index.js';
import { ZoningInfoInput, ZoningInfoOutput } from '../src/schemas.js';
import { getZoningInfoTool } from '../src/tools/get_zoning_info.js';

describe('ZoningRecord loader', () => {
  it('loads zoning data for aichi', () => {
    const loader = getLoader('aichi');
    const records = loader.getZoning();
    expect(records.length).toBeGreaterThan(0);
  });

  it('each record has required fields', () => {
    const loader = getLoader('aichi');
    const records = loader.getZoning();
    for (const r of records) {
      expect(r.city).toBeTruthy();
      expect(r.district).toBeTruthy();
      expect(r.zone_type).toBeTruthy();
      expect(typeof r.coverage_ratio).toBe('number');
      expect(typeof r.floor_area_ratio).toBe('number');
    }
  });

  it('zone_type contains known values', () => {
    const loader = getLoader('tokyo');
    const records = loader.getZoning();
    const knownZones = [
      '商業地域',
      '近隣商業地域',
      '第1種住居地域',
      '第2種住居地域',
      '第1種低層住居専用地域',
      '第1種中高層住居専用地域',
      '準住居地域',
    ];
    for (const r of records) {
      expect(knownZones).toContain(r.zone_type);
    }
  });

  it('capabilities includes zoning', () => {
    const loader = getLoader('aichi');
    expect(loader.capabilities.zoning).toBe(true);
  });

  it('all 10 prefectures have zoning data', () => {
    const prefs = [
      'aichi',
      'tokyo',
      'osaka',
      'fukuoka',
      'hokkaido',
      'kanagawa',
      'kyoto',
      'hyogo',
      'chiba',
      'saitama',
    ];
    for (const pref of prefs) {
      const loader = getLoader(pref);
      expect(loader.getZoning().length).toBeGreaterThan(0);
    }
  });
});

describe('get_zoning_info tool', () => {
  it('returns structured result for aichi', async () => {
    const result = await getZoningInfoTool({ prefecture: '愛知県', area: '名古屋市中区' });
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    expect(result.structuredContent).toBeDefined();
    expect(result.structuredContent.records).toBeDefined();
    expect(result.structuredContent.attribution).toBeTruthy();
  });

  it('filters by district', async () => {
    const result = await getZoningInfoTool({
      prefecture: '愛知県',
      area: '名古屋市中区',
      district: '栄',
    });
    const records = result.structuredContent.records as unknown[];
    for (const r of records as Array<{ district: string }>) {
      expect(r.district).toContain('栄');
    }
  });

  it('ZoningInfoInput schema validates correct input', () => {
    expect(() => ZoningInfoInput.parse({ prefecture: '東京都', area: '新宿区' })).not.toThrow();
  });
});
