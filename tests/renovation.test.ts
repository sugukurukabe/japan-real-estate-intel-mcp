/**
 * Tests for v6.8.0 renovation yield tools and analysis engines.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  RenovationYieldInput,
  FutureTimelineInput,
  ChochouProfileInput,
  RecommendRenovationTargetsInput,
} from '../src/schemas.js';

describe('v6.8.0 Zod schemas', () => {
  it('RenovationYieldInput validates correct input', () => {
    const input = RenovationYieldInput.parse({
      ward: '中区',
      chochou: '栄三丁目',
      buildingAge: 30,
      floorArea: 70,
    });
    expect(input.ward).toBe('中区');
    expect(input.propertyType).toBe('mansion');
  });

  it('RenovationYieldInput rejects invalid buildingAge', () => {
    expect(() =>
      RenovationYieldInput.parse({ ward: '中区', chochou: '栄', buildingAge: 150, floorArea: 70 }),
    ).toThrow();
  });

  it('FutureTimelineInput has default chochou', () => {
    const input = FutureTimelineInput.parse({ ward: '中区' });
    expect(input.chochou).toBe('');
  });

  it('ChochouProfileInput parses', () => {
    const input = ChochouProfileInput.parse({ ward: '中村区' });
    expect(input.ward).toBe('中村区');
  });

  it('RecommendRenovationTargetsInput has defaults', () => {
    const input = RecommendRenovationTargetsInput.parse({});
    expect(input.buildingAge).toBe(30);
    expect(input.floorArea).toBe(70);
    expect(input.limit).toBe(10);
  });
});

describe('renovation yield calculation', () => {
  it('calculates yield in realistic range', async () => {
    const { calculateRenovationYield } = await import('../src/analysis/renovation_yield.js');
    const result = calculateRenovationYield({
      ward: '中区',
      chochou: '栄三丁目',
      buildingAge: 30,
      floorArea: 70,
      propertyType: 'mansion',
    });

    expect(result.grossYieldPct).toBeGreaterThan(0);
    expect(result.grossYieldPct).toBeLessThan(30);
    expect(result.netYieldPct).toBeGreaterThan(0);
    expect(result.netYieldPct).toBeLessThan(result.grossYieldPct);
    expect(result.estimatedRent.monthly).toBeGreaterThan(0);
    expect(result.renovationCost.low).toBeLessThan(result.renovationCost.mid);
    expect(result.renovationCost.mid).toBeLessThan(result.renovationCost.high);
    expect(['rent', 'sell']).toContain(result.exitStrategy);
    expect(result.estimatedRent.confidence).toMatch(/^(high|medium|low)$/);
  });

  it('older buildings have lower acquisition estimates', async () => {
    const { calculateRenovationYield } = await import('../src/analysis/renovation_yield.js');
    const young = calculateRenovationYield({
      ward: '中区', chochou: '栄', buildingAge: 10, floorArea: 70,
    });
    const old = calculateRenovationYield({
      ward: '中区', chochou: '栄', buildingAge: 40, floorArea: 70,
    });
    expect(old.estimatedAcquisition).toBeLessThan(young.estimatedAcquisition);
  });

  it('accepts explicit acquisitionPrice', async () => {
    const { calculateRenovationYield } = await import('../src/analysis/renovation_yield.js');
    const result = calculateRenovationYield({
      ward: '中区', chochou: '栄', buildingAge: 30, floorArea: 70,
      acquisitionPrice: 40_000_000,
    });
    expect(result.estimatedAcquisition).toBe(40_000_000);
  });
});

describe('future timeline', () => {
  it('returns events array', async () => {
    const { getFutureTimeline } = await import('../src/analysis/future_timeline.js');
    const result = getFutureTimeline('中区', '栄');
    expect(Array.isArray(result.events)).toBe(true);
    expect(result.events.length).toBeGreaterThan(0);
    expect(result.summary.totalEvents).toBe(result.events.length);
  });

  it('includes population projections', async () => {
    const { getFutureTimeline } = await import('../src/analysis/future_timeline.js');
    const result = getFutureTimeline('守山区', '');
    const popEvents = result.events.filter((e) => e.source === 'population');
    expect(popEvents.length).toBeGreaterThan(0);
  });

  it('events are sorted by year', async () => {
    const { getFutureTimeline } = await import('../src/analysis/future_timeline.js');
    const result = getFutureTimeline('中村区', '名駅');
    for (let i = 1; i < result.events.length; i++) {
      expect(result.events[i].year).toBeGreaterThanOrEqual(result.events[i - 1].year);
    }
  });
});

describe('tool output format', () => {
  it('analyze_renovation_yield returns markdown content', async () => {
    const { analyzeRenovationYieldTool } = await import('../src/tools/analyze_renovation_yield.js');
    const result = analyzeRenovationYieldTool({
      ward: '中区', chochou: '栄', buildingAge: 30, floorArea: 70,
    });
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('リノベ利回り分析');
    expect(result.structuredContent).toBeDefined();
  });

  it('get_future_timeline returns markdown content', async () => {
    const { getFutureTimelineTool } = await import('../src/tools/get_future_timeline.js');
    const result = getFutureTimelineTool({ ward: '中区' });
    expect(result.content[0].text).toContain('未来タイムライン');
  });

  it('get_chochou_profile returns markdown content', async () => {
    const { getChochouProfileTool } = await import('../src/tools/get_chochou_profile.js');
    const result = getChochouProfileTool({ ward: '中区' });
    expect(result.content[0].text).toContain('町丁目プロファイル');
  });
});

describe('EstatClient new methods', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  function makeMockResponse() {
    return {
      ok: true,
      json: async () => ({
        GET_STATS_DATA: {
          RESULT: { STATUS: 0 },
          STATISTICAL_DATA: {
            CLASS_INF: { CLASS_OBJ: [{ '@id': 'area', '@name': '地域', CLASS: [{ '@code': '23101', '@name': '名古屋市中区' }] }] },
            DATA_INF: { VALUE: [{ '@area': '23101', '@cat01': '0', '$': '52000' }] },
          },
        },
      }),
    };
  }

  it('fetchHouseholdComposition calls correct statsDataId', async () => {
    const mockFn = vi.fn().mockResolvedValue(makeMockResponse());
    vi.stubGlobal('fetch', mockFn);
    const { EstatClient } = await import('../src/api-client/estat.js');

    const client = new EstatClient('test-id');
    await client.fetchHouseholdComposition('aichi');

    expect(mockFn).toHaveBeenCalled();
    const url = mockFn.mock.calls[0][0] as string;
    expect(url).toContain('statsDataId=0003445258');
    expect(url).toContain('cdAreaFrom=23100');
  });

  it('fetchVacancyStats calls correct statsDataId', async () => {
    const mockFn = vi.fn().mockResolvedValue(makeMockResponse());
    vi.stubGlobal('fetch', mockFn);
    const { EstatClient } = await import('../src/api-client/estat.js');

    const client = new EstatClient('test-id');
    await client.fetchVacancyStats('aichi');

    const url = mockFn.mock.calls[0][0] as string;
    expect(url).toContain('statsDataId=0003355482');
  });

  it('fetchEconomicCensus calls correct statsDataId', async () => {
    const mockFn = vi.fn().mockResolvedValue(makeMockResponse());
    vi.stubGlobal('fetch', mockFn);
    const { EstatClient } = await import('../src/api-client/estat.js');

    const client = new EstatClient('test-id');
    await client.fetchEconomicCensus('aichi');

    const url = mockFn.mock.calls[0][0] as string;
    expect(url).toContain('statsDataId=0003353941');
  });
});

describe('MlitClient chochou filter', () => {
  it('fetchTransactionsByChochou filters by city and district', async () => {
    const { MlitClient } = await import('../src/api-client/mlit.js');
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          { Municipality: '名古屋市中区', DistrictName: '栄三丁目', TradePrice: '50000000', UnitPrice: '400000', Period: '2025年第1四半期', Type: 'マンション', Region: '住宅地', MunicipalityCode: '23106', Prefecture: '愛知県', Area: '70', PricePerUnit: '', FloorPlan: '3LDK', LandShape: '', BuildingYear: '2010年', Structure: 'RC', Use: '住宅', CityPlanning: '商業地域', CoverageRatio: '80', FloorAreaRatio: '600', Renovation: '', Remarks: '', PriceCategory: '不動産取引価格情報', DistrictCode: '' },
          { Municipality: '名古屋市中区', DistrictName: '丸の内', TradePrice: '30000000', UnitPrice: '300000', Period: '2025年第1四半期', Type: 'マンション', Region: '住宅地', MunicipalityCode: '23106', Prefecture: '愛知県', Area: '60', PricePerUnit: '', FloorPlan: '2LDK', LandShape: '', BuildingYear: '2005年', Structure: 'RC', Use: '住宅', CityPlanning: '商業地域', CoverageRatio: '80', FloorAreaRatio: '400', Renovation: '', Remarks: '', PriceCategory: '不動産取引価格情報', DistrictCode: '' },
          { Municipality: '名古屋市東区', DistrictName: '泉', TradePrice: '40000000', UnitPrice: '350000', Period: '2025年第1四半期', Type: 'マンション', Region: '住宅地', MunicipalityCode: '23102', Prefecture: '愛知県', Area: '65', PricePerUnit: '', FloorPlan: '2LDK', LandShape: '', BuildingYear: '2008年', Structure: 'RC', Use: '住宅', CityPlanning: '商業地域', CoverageRatio: '80', FloorAreaRatio: '400', Renovation: '', Remarks: '', PriceCategory: '不動産取引価格情報', DistrictCode: '' },
        ],
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const client = new MlitClient('test-key');
    const results = await client.fetchTransactionsByChochou('aichi', '名古屋市中区', '栄三丁目', 2025);

    expect(results).toHaveLength(1);
    expect(results[0].DistrictName).toBe('栄三丁目');
  });
});

describe('nagoya client', () => {
  it('loadNagoyaPlans returns array', async () => {
    const { loadNagoyaPlans } = await import('../src/api-client/nagoya.js');
    const plans = loadNagoyaPlans();
    expect(Array.isArray(plans)).toBe(true);
  });

  it('getPlansForChochou filters correctly', async () => {
    const { getPlansForChochou, loadNagoyaPlans } = await import('../src/api-client/nagoya.js');
    const plans = loadNagoyaPlans();
    if (plans.length > 0) {
      const ward = plans[0].ward;
      const results = getPlansForChochou(ward, '');
      expect(results.length).toBeGreaterThan(0);
    }
  });
});

describe('server registration', () => {
  it('new tools are registered', { timeout: 15000 }, async () => {
    const { createServer } = await import('../src/server.js');
    const server = createServer();
    const raw = (server as unknown as { _registeredTools?: Map<string, unknown> | Record<string, unknown> })
      ._registeredTools;
    const has = (name: string) =>
      raw instanceof Map ? raw.has(name) : Boolean(raw && typeof raw === 'object' && name in raw!);
    expect(has('analyze_renovation_yield')).toBe(true);
    expect(has('get_future_timeline')).toBe(true);
    expect(has('get_chochou_profile')).toBe(true);
    expect(has('recommend_renovation_targets')).toBe(true);
    expect(has('get_real_estate_macro_snapshot')).toBe(true);
  });
});
