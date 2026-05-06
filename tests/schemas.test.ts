import { describe, it, expect } from 'vitest';
import {
  CrossAnalyzeInput,
  CrossAnalyzeOutput,
  AssessRiskInput,
  AssessRiskOutput,
  GenerateReportInput,
  GenerateReportOutput,
  OpenDashboardInput,
} from '../src/schemas.js';

describe('CrossAnalyzeInput', () => {
  it('parses valid input with defaults', () => {
    const result = CrossAnalyzeInput.parse({
      area: '名古屋市中村区',
      propertyType: 'residential',
      timeRange: '3y',
    });
    expect(result.area).toBe('名古屋市中村区');
    expect(result.includeRisk).toBe(true);
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

  it('accepts focusMetrics', () => {
    const r = CrossAnalyzeInput.parse({
      area: '豊田市',
      propertyType: 'office',
      timeRange: '5y',
      focusMetrics: ['price_trend', 'risk_score'],
    });
    expect(r.focusMetrics).toEqual(['price_trend', 'risk_score']);
  });
});

describe('CrossAnalyzeOutput', () => {
  it('validates a well-formed output', () => {
    const output = CrossAnalyzeOutput.parse({
      summary: 'テスト',
      priceTrend: { current: 300000, changeRate: 2.5, forecast: '上昇' },
      riskScore: 45,
      investmentScore: 72,
      keyInsights: ['test insight'],
      charts: {},
    });
    expect(output.investmentScore).toBe(72);
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
  });

  it('accepts latlng', () => {
    const r = AssessRiskInput.parse({
      address: '名古屋市中区',
      latlng: { lat: 35.17, lng: 136.91 },
      riskTypes: ['flood', 'earthquake'],
    });
    expect(r.latlng!.lat).toBe(35.17);
  });
});

describe('AssessRiskOutput', () => {
  it('validates a well-formed output', () => {
    const output = AssessRiskOutput.parse({
      floodRisk: { level: 'high', probability: 0.6, description: 'テスト' },
      overallRiskScore: 78,
      recommendations: ['避難経路確認'],
      adjustedPriceImpact: -23.4,
    });
    expect(output.floodRisk.level).toBe('high');
  });
});

describe('GenerateReportInput', () => {
  it('parses with defaults', () => {
    const r = GenerateReportInput.parse({ area: '岡崎市', purpose: 'investment' });
    expect(r.includeCharts).toBe(true);
  });

  it('accepts all purposes', () => {
    for (const p of ['investment', 'development', 'rental', 'management'] as const) {
      const r = GenerateReportInput.parse({ area: 'test', purpose: p });
      expect(r.purpose).toBe(p);
    }
  });
});

describe('OpenDashboardInput', () => {
  it('parses empty input', () => {
    const r = OpenDashboardInput.parse({});
    expect(r.area).toBeUndefined();
  });

  it('accepts all layers', () => {
    for (const l of ['land_price', 'transaction', 'flood_risk', 'population'] as const) {
      const r = OpenDashboardInput.parse({ layer: l });
      expect(r.layer).toBe(l);
    }
  });
});
