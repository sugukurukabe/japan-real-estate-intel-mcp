import { describe, it, expect } from 'vitest';
import { crossAnalyze } from '../src/tools/cross_analyze_real_estate_market.js';
import { assessPropertyRisk } from '../src/tools/assess_property_risk.js';
import { generateAreaReport } from '../src/tools/generate_area_report.js';
import { openDashboard } from '../src/tools/open_dashboard.js';

describe('crossAnalyze', () => {
  it('returns a valid result for 名古屋市中村区', () => {
    const result = crossAnalyze({
      area: '名古屋市中村区',
      propertyType: 'residential',
      timeRange: '3y',
      includeRisk: true,
    });

    expect(result.summary).toBeTruthy();
    expect(result.priceTrend.current).toBeGreaterThanOrEqual(0);
    expect(result.riskScore).toBeGreaterThanOrEqual(0);
    expect(result.riskScore).toBeLessThanOrEqual(100);
    expect(result.investmentScore).toBeGreaterThanOrEqual(0);
    expect(result.investmentScore).toBeLessThanOrEqual(100);
    expect(result.keyInsights.length).toBeGreaterThan(0);
  });

  it('returns result without risk when includeRisk=false', () => {
    const result = crossAnalyze({
      area: '豊田市',
      propertyType: 'commercial',
      timeRange: '1y',
      includeRisk: false,
    });

    expect(result.riskScore).toBe(0);
    expect(result.charts.riskBreakdown).toBeUndefined();
  });

  it('handles unknown area gracefully', () => {
    const result = crossAnalyze({
      area: '存在しない市',
      propertyType: 'residential',
      timeRange: '3y',
      includeRisk: true,
    });

    expect(result.summary).toBeTruthy();
    expect(result.priceTrend.current).toBe(0);
  });
});

describe('assessPropertyRisk', () => {
  it('evaluates risk for a known address', () => {
    const result = assessPropertyRisk({
      address: '名古屋市港区',
      riskTypes: ['all'],
    });

    expect(result.overallRiskScore).toBeGreaterThanOrEqual(0);
    expect(result.overallRiskScore).toBeLessThanOrEqual(100);
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.floodRisk.level).toMatch(/^(low|medium|high)$/);
  });

  it('evaluates with latlng', () => {
    const result = assessPropertyRisk({
      address: '名古屋市中区',
      latlng: { lat: 35.17, lng: 136.91 },
      riskTypes: ['flood'],
    });

    expect(result.floodRisk).toBeDefined();
  });

  it('handles unknown address', () => {
    const result = assessPropertyRisk({
      address: 'ありえない住所',
      riskTypes: ['all'],
    });

    expect(result.overallRiskScore).toBe(0);
    expect(result.recommendations).toContain('住所を愛知県内の市区町村名を含む形式で再入力してください。');
  });
});

describe('generateAreaReport', () => {
  it('generates a markdown report', () => {
    const result = generateAreaReport({
      area: '名古屋市中区',
      purpose: 'investment',
      includeCharts: true,
    });

    expect(result.markdownReport).toContain('名古屋市中区');
    expect(result.markdownReport).toContain('投資');
    expect(result.markdownReport).toContain('出典');
    expect(typeof result.chartsData).toBe('object');
  });

  it('generates report for development purpose', () => {
    const result = generateAreaReport({
      area: '豊橋市',
      purpose: 'development',
      includeCharts: false,
    });

    expect(result.markdownReport).toContain('豊橋市');
  });
});

describe('openDashboard', () => {
  it('returns defaults for empty input', () => {
    const result = openDashboard({});
    expect(result.area).toBe('愛知県全体');
    expect(result.layer).toBe('land_price');
    expect(result.attribution).toBeTruthy();
  });

  it('passes through specified area', () => {
    const result = openDashboard({ area: '名古屋市中村区', layer: 'flood_risk' });
    expect(result.area).toBe('名古屋市中村区');
    expect(result.layer).toBe('flood_risk');
  });
});
