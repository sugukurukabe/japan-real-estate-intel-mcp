import { describe, it, expect } from 'vitest';
import {
  CrossAnalyzeInput,
  CrossAnalyzeOutput,
  AssessRiskInput,
  AssessRiskOutput,
  GenerateReportInput,
  GenerateReportOutput,
  OpenDashboardInput,
  FamilyFriendlyInput,
  CorporateDemandInput,
  ComparePrefecturesInput,
  DrillDownInput,
  StoreLocationInput,
} from '../src/schemas.js';

describe('CrossAnalyzeInput', () => {
  it('parses valid input with defaults', () => {
    const result = CrossAnalyzeInput.parse({
      area: '名古屋市中村区',
      propertyType: 'residential',
      timeRange: '3y',
    });
    expect(result.area).toBe('名古屋市中村区');
    expect(result.prefecture).toBe('愛知県');
    expect(result.includeRisk).toBe(true);
    expect(result.includeHumanFlow).toBe(true);
    expect(result.includeEducation).toBe(false);
    expect(result.includeCorporate).toBe(false);
    expect(result.includeTransport).toBe(false);
    expect(result.includeCommercial).toBe(false);
    expect(result.includeMedical).toBe(false);
    expect(result.focusMetrics).toBeUndefined();
  });

  it('accepts all property types', () => {
    for (const t of ['residential', 'commercial', 'logistics', 'office', 'mixed'] as const) {
      const r = CrossAnalyzeInput.parse({ area: '一宮市', propertyType: t, timeRange: '1y' });
      expect(r.propertyType).toBe(t);
    }
  });

  it('rejects invalid property type', () => {
    expect(() =>
      CrossAnalyzeInput.parse({ area: 'test', propertyType: 'invalid', timeRange: '1y' }),
    ).toThrow();
  });

  it('accepts prefecture parameter', () => {
    const r = CrossAnalyzeInput.parse({
      prefecture: '東京都',
      area: '世田谷区',
      propertyType: 'residential',
      timeRange: '3y',
    });
    expect(r.prefecture).toBe('東京都');
  });

  it('accepts includeHumanFlow/Education/Corporate flags', () => {
    const r = CrossAnalyzeInput.parse({
      area: '名古屋市中区',
      propertyType: 'office',
      timeRange: '3y',
      includeHumanFlow: true,
      includeEducation: true,
      includeCorporate: true,
    });
    expect(r.includeHumanFlow).toBe(true);
    expect(r.includeEducation).toBe(true);
    expect(r.includeCorporate).toBe(true);
  });
});

describe('CrossAnalyzeOutput', () => {
  it('validates a well-formed output with optional fields', () => {
    const output = CrossAnalyzeOutput.parse({
      summary: 'テスト',
      priceTrend: { current: 300000, changeRate: 2.5, forecast: '上昇' },
      riskScore: 45,
      investmentScore: 72,
      keyInsights: ['test insight'],
      charts: {},
      humanFlow: { weekdayAvgFlow: 50000, weekendAvgFlow: 40000, avgStayMinutes: 60, flowTrend: 'increasing', peakHour: '12:00' },
      realDemandScore: 65,
      vacancyRiskScore: 20,
      educationSummary: { avgScore: 75, topSchool: 'テスト小学校' },
      corporateSummary: { totalEstablishments: 5000, majorCount: 50 },
    });
    expect(output.investmentScore).toBe(72);
    expect(output.humanFlow?.weekdayAvgFlow).toBe(50000);
    expect(output.educationSummary?.avgScore).toBe(75);
    expect(output.corporateSummary?.totalEstablishments).toBe(5000);
  });

  it('allows optional fields to be undefined', () => {
    const output = CrossAnalyzeOutput.parse({
      summary: 'テスト',
      priceTrend: { current: 0, changeRate: 0, forecast: '' },
      riskScore: 0,
      investmentScore: 50,
      keyInsights: [],
      charts: {},
    });
    expect(output.humanFlow).toBeUndefined();
    expect(output.realDemandScore).toBeUndefined();
  });

  it('rejects riskScore > 100', () => {
    expect(() =>
      CrossAnalyzeOutput.parse({
        summary: '',
        priceTrend: { current: 0, changeRate: 0, forecast: '' },
        riskScore: 101,
        investmentScore: 50,
        keyInsights: [],
        charts: {},
      }),
    ).toThrow();
  });
});

describe('AssessRiskInput', () => {
  it('parses address-only input with defaults', () => {
    const r = AssessRiskInput.parse({ address: '名古屋市港区' });
    expect(r.riskTypes).toEqual(['all']);
    expect(r.latlng).toBeUndefined();
    expect(r.prefecture).toBe('愛知県');
  });

  it('accepts latlng and prefecture', () => {
    const r = AssessRiskInput.parse({
      prefecture: '東京都',
      address: '江東区',
      latlng: { lat: 35.67, lng: 139.82 },
      riskTypes: ['flood', 'earthquake'],
    });
    expect(r.latlng!.lat).toBe(35.67);
    expect(r.prefecture).toBe('東京都');
  });
});

describe('GenerateReportInput', () => {
  it('parses with defaults including prefecture', () => {
    const r = GenerateReportInput.parse({ area: '岡崎市', purpose: 'investment' });
    expect(r.includeCharts).toBe(true);
    expect(r.prefecture).toBe('愛知県');
  });

  it('accepts all purposes', () => {
    for (const p of ['investment', 'development', 'rental', 'management'] as const) {
      const r = GenerateReportInput.parse({ area: 'test', purpose: p });
      expect(r.purpose).toBe(p);
    }
  });
});

describe('OpenDashboardInput', () => {
  it('parses empty input with defaults', () => {
    const r = OpenDashboardInput.parse({});
    expect(r.area).toBeUndefined();
    expect(r.prefecture).toBe('愛知県');
  });

  it('accepts all layers', () => {
    for (const l of ['land_price', 'transaction', 'flood_risk', 'population', 'human_flow', 'school_district', 'corporate_density', 'plateau_3d'] as const) {
      const r = OpenDashboardInput.parse({ layer: l });
      expect(r.layer).toBe(l);
    }
  });
});

describe('FamilyFriendlyInput', () => {
  it('defaults prefecture to 愛知県', () => {
    const r = FamilyFriendlyInput.parse({ area: '名古屋市千種区' });
    expect(r.prefecture).toBe('愛知県');
    expect(r.childAge).toBe('all');
  });
});

describe('CorporateDemandInput', () => {
  it('defaults prefecture to 愛知県', () => {
    const r = CorporateDemandInput.parse({ area: '名古屋市中区' });
    expect(r.prefecture).toBe('愛知県');
    expect(r.propertyType).toBe('office');
  });
});

describe('neighborhood field on existing tools', () => {
  it('CrossAnalyzeInput accepts neighborhood as optional', () => {
    const r = CrossAnalyzeInput.parse({
      area: '名古屋市中村区',
      neighborhood: '名駅南1丁目',
      propertyType: 'residential',
      timeRange: '3y',
    });
    expect(r.neighborhood).toBe('名駅南1丁目');
  });

  it('CrossAnalyzeInput still works without neighborhood', () => {
    const r = CrossAnalyzeInput.parse({
      area: '名古屋市中村区',
      propertyType: 'residential',
      timeRange: '3y',
    });
    expect(r.neighborhood).toBeUndefined();
  });

  it('OpenDashboardInput accepts neighborhood', () => {
    const r = OpenDashboardInput.parse({ neighborhood: '大須2丁目' });
    expect(r.neighborhood).toBe('大須2丁目');
  });
});

describe('ComparePrefecturesInput', () => {
  it('requires minimum 2 prefectures', () => {
    expect(() => ComparePrefecturesInput.parse({ prefectures: ['愛知県'] })).toThrow();
  });

  it('rejects more than 5 prefectures', () => {
    expect(() =>
      ComparePrefecturesInput.parse({
        prefectures: ['a', 'b', 'c', 'd', 'e', 'f'],
      }),
    ).toThrow();
  });

  it('defaults propertyType to mixed and includeMarkdown to true', () => {
    const r = ComparePrefecturesInput.parse({ prefectures: ['愛知県', '東京都'] });
    expect(r.propertyType).toBe('mixed');
    expect(r.includeMarkdown).toBe(true);
    expect(r.metrics).toEqual(['price', 'risk', 'investment']);
  });
});

describe('DrillDownInput', () => {
  it('requires city field', () => {
    expect(() => DrillDownInput.parse({ prefecture: '愛知県' })).toThrow();
  });

  it('defaults focus to all', () => {
    const r = DrillDownInput.parse({ prefecture: '愛知県', city: '名古屋市中村区' });
    expect(r.focus).toBe('all');
  });

  it('accepts neighborhood as optional', () => {
    const r = DrillDownInput.parse({
      prefecture: '愛知県',
      city: '名古屋市中村区',
      neighborhood: '名駅南1丁目',
    });
    expect(r.neighborhood).toBe('名駅南1丁目');
  });
});

describe('StoreLocationInput', () => {
  it('parses valid input with defaults', () => {
    const r = StoreLocationInput.parse({
      city: '名古屋市中村区',
      storeType: 'convenience',
    });
    expect(r.prefecture).toBe('愛知県');
    expect(r.radiusM).toBe(500);
    expect(r.includeMarkdown).toBe(true);
  });

  it('accepts all store types', () => {
    for (const t of ['convenience', 'family_restaurant', 'cafe', 'drugstore', 'supermarket'] as const) {
      const r = StoreLocationInput.parse({ city: '名古屋市', storeType: t });
      expect(r.storeType).toBe(t);
    }
  });

  it('rejects invalid store type', () => {
    expect(() => StoreLocationInput.parse({ city: '名古屋市', storeType: 'bar' })).toThrow();
  });

  it('accepts custom weights', () => {
    const r = StoreLocationInput.parse({
      city: '名古屋市',
      storeType: 'cafe',
      customWeights: { humanFlow: 60, population: 40 },
    });
    expect(r.customWeights?.humanFlow).toBe(60);
  });

  it('accepts optional neighborhood', () => {
    const r = StoreLocationInput.parse({
      city: '名古屋市中村区',
      storeType: 'supermarket',
      neighborhood: '名駅南1丁目',
    });
    expect(r.neighborhood).toBe('名駅南1丁目');
  });
});

describe('CrossAnalyzeInput v2.2 flags', () => {
  it('includeTransport defaults to false', () => {
    const r = CrossAnalyzeInput.parse({ area: '名古屋市中区', propertyType: 'residential', timeRange: '1y' });
    expect(r.includeTransport).toBe(false);
    expect(r.includeCommercial).toBe(false);
    expect(r.includeMedical).toBe(false);
  });

  it('accepts true for new flags', () => {
    const r = CrossAnalyzeInput.parse({
      area: '名古屋市中区',
      propertyType: 'residential',
      timeRange: '1y',
      includeTransport: true,
      includeCommercial: true,
      includeMedical: true,
    });
    expect(r.includeTransport).toBe(true);
    expect(r.includeCommercial).toBe(true);
    expect(r.includeMedical).toBe(true);
  });
});

describe('ComparePrefecturesInput v2.2 metrics', () => {
  it('accepts new metric types', () => {
    const r = ComparePrefecturesInput.parse({
      prefectures: ['愛知県', '東京都'],
      metrics: ['price', 'transport', 'commercial', 'medical'],
    });
    expect(r.metrics).toContain('transport');
    expect(r.metrics).toContain('commercial');
    expect(r.metrics).toContain('medical');
  });
});
