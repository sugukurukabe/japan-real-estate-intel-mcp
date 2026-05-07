import { describe, it, expect } from 'vitest';
import { crossAnalyze } from '../src/tools/cross_analyze_real_estate_market.js';
import { assessPropertyRisk } from '../src/tools/assess_property_risk.js';
import { generateAreaReport } from '../src/tools/generate_area_report.js';
import { openDashboard } from '../src/tools/open_dashboard.js';

describe('crossAnalyze (Aichi)', () => {
  it('returns a valid result for 名古屋市中村区', () => {
    const result = crossAnalyze({
      prefecture: '愛知県',
      area: '名古屋市中村区',
      propertyType: 'residential',
      timeRange: '3y',
      includeRisk: true,
      includeHumanFlow: true,
      includeEducation: false,
      includeCorporate: false,
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
      prefecture: '愛知県',
      area: '豊田市',
      propertyType: 'commercial',
      timeRange: '1y',
      includeRisk: false,
      includeHumanFlow: false,
      includeEducation: false,
      includeCorporate: false,
    });

    expect(result.riskScore).toBe(0);
    expect(result.charts.riskBreakdown).toBeUndefined();
  });

  it('handles unknown area gracefully', () => {
    const result = crossAnalyze({
      prefecture: '愛知県',
      area: '存在しない市',
      propertyType: 'residential',
      timeRange: '3y',
      includeRisk: true,
      includeHumanFlow: true,
      includeEducation: false,
      includeCorporate: false,
    });

    expect(result.summary).toBeTruthy();
    expect(result.priceTrend.current).toBe(0);
  });

  it('includes human flow when enabled and supported', () => {
    const result = crossAnalyze({
      prefecture: '愛知県',
      area: '名古屋市中区',
      propertyType: 'commercial',
      timeRange: '3y',
      includeRisk: false,
      includeHumanFlow: true,
      includeEducation: false,
      includeCorporate: false,
    });

    expect(result.humanFlow).toBeDefined();
    expect(result.realDemandScore).toBeDefined();
    expect(result.vacancyRiskScore).toBeDefined();
  });

  it('includes education and corporate summaries when enabled', () => {
    const result = crossAnalyze({
      prefecture: '愛知県',
      area: '名古屋市千種区',
      propertyType: 'residential',
      timeRange: '3y',
      includeRisk: false,
      includeHumanFlow: false,
      includeEducation: true,
      includeCorporate: true,
    });

    expect(result.educationSummary).toBeDefined();
  });
});

describe('assessPropertyRisk (Aichi)', () => {
  it('evaluates risk for a known address', () => {
    const result = assessPropertyRisk({
      prefecture: '愛知県',
      address: '名古屋市港区',
      riskTypes: ['all'],
    });

    expect(result.overallRiskScore).toBeGreaterThanOrEqual(0);
    expect(result.overallRiskScore).toBeLessThanOrEqual(100);
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.floodRisk.level).toMatch(/^(low|medium|high)$/);
  });

  it('handles unknown address', () => {
    const result = assessPropertyRisk({
      prefecture: '愛知県',
      address: 'ありえない住所',
      riskTypes: ['all'],
    });

    expect(result.overallRiskScore).toBe(0);
    expect(result.recommendations[0]).toContain('愛知県');
  });
});

describe('generateAreaReport (Aichi)', () => {
  it('generates a markdown report', () => {
    const result = generateAreaReport({
      prefecture: '愛知県',
      area: '名古屋市中区',
      purpose: 'investment',
      includeCharts: true,
    });

    expect(result.markdownReport).toContain('名古屋市中区');
    expect(result.markdownReport).toContain('投資');
    expect(result.markdownReport).toContain('出典');
  });
});

describe('openDashboard', () => {
  it('returns defaults for empty input', () => {
    const result = openDashboard({});
    expect(result.area).toBe('愛知県全体');
    expect(result.layer).toBe('land_price');
    expect(result.prefecture).toBe('aichi');
    expect(result.attribution).toBeTruthy();
  });

  it('passes through specified area with prefecture', () => {
    const result = openDashboard({ prefecture: '東京都', area: '世田谷区', layer: 'flood_risk' });
    expect(result.area).toBe('世田谷区');
    expect(result.layer).toBe('flood_risk');
    expect(result.prefecture).toBe('tokyo');
  });

  it('store mode defaults to human_flow layer', () => {
    const result = openDashboard({ initialMode: 'store' });
    expect(result.layer).toBe('human_flow');
    expect(result.initialMode).toBe('store');
    expect(result.dashboardUrl).toBe('dashboard.html?mode=store');
  });

  it('investment mode keeps default land_price layer', () => {
    const result = openDashboard({ initialMode: 'investment' });
    expect(result.layer).toBe('land_price');
    expect(result.initialMode).toBe('investment');
    expect(result.dashboardUrl).toBe('dashboard.html?mode=investment');
  });

  it('dashboardUrl has no mode param when initialMode not specified', () => {
    const result = openDashboard({});
    expect(result.dashboardUrl).toBe('dashboard.html');
    expect(result.initialMode).toBeUndefined();
  });
});
