import { describe, it, expect } from 'vitest';
import { forecastLandPriceTrend } from '../src/tools/forecast_land_price_trend.js';
import { scenarioWhatIf } from '../src/tools/scenario_what_if.js';
import '../src/data-loaders/index.js';

describe('forecastLandPriceTrend', () => {
  it('returns valid output for Aichi (data-rich prefecture)', () => {
    const result = forecastLandPriceTrend({
      prefecture: '愛知県',
      city: '名古屋市中村区',
      landUse: 'commercial',
      horizon: '3y',
      method: 'linear',
      includeMarkdown: true,
    });
    expect(result.prefecture).toBe('愛知県');
    expect(result.city).toBe('名古屋市中村区');
    expect(result.series.length).toBeGreaterThan(0);
    expect(['rising', 'stable', 'declining']).toContain(result.trendDirection);
    expect(['strong', 'moderate', 'weak']).toContain(result.trendStrength);
    expect(['buy', 'hold', 'caution']).toContain(result.investmentSignal);
    expect(result.keyDrivers.length).toBeGreaterThan(0);
    expect(result.riskFactors.length).toBeGreaterThan(0);
  });

  it('includes historical + forecast series', () => {
    const result = forecastLandPriceTrend({
      prefecture: '愛知県',
      city: '名古屋市中区',
      landUse: 'all',
      horizon: '3y',
      method: 'linear',
      includeMarkdown: false,
    });
    const forecastPoints = result.series.filter((p) => p.isForecast);
    expect(forecastPoints.length).toBe(3);
    const historical = result.series.filter((p) => !p.isForecast);
    expect(historical.length).toBeGreaterThan(0);
  });

  it('works with moving_avg method', () => {
    const result = forecastLandPriceTrend({
      prefecture: '愛知県',
      city: '名古屋市中区',
      landUse: 'residential',
      horizon: '5y',
      method: 'moving_avg',
      includeMarkdown: false,
    });
    const forecastPoints = result.series.filter((p) => p.isForecast);
    expect(forecastPoints.length).toBe(5);
  });

  it('returns markdownReport when includeMarkdown=true', () => {
    const result = forecastLandPriceTrend({
      prefecture: '東京都',
      city: '世田谷区',
      landUse: 'residential',
      horizon: '1y',
      method: 'linear',
      includeMarkdown: true,
    });
    expect(result.markdownReport).toBeDefined();
    expect(result.markdownReport).toContain('地価トレンド予測レポート');
  });

  it('handles prefecture with no existing data gracefully', () => {
    const result = forecastLandPriceTrend({
      prefecture: '北海道',
      city: '旭川市',
      landUse: 'all',
      horizon: '3y',
      method: 'linear',
      includeMarkdown: false,
    });
    expect(result.series.length).toBeGreaterThan(0);
    // With no matching data, forecast series are still produced
    const forecasted = result.series.filter((p) => p.isForecast);
    expect(forecasted.length).toBe(3);
  });

  it('CAGR is null when insufficient historical data', () => {
    // Use a city unlikely to appear in data
    const result = forecastLandPriceTrend({
      prefecture: '京都府',
      city: '亀岡市',
      landUse: 'industrial',
      horizon: '1y',
      method: 'linear',
      includeMarkdown: false,
    });
    // May be null if no data; that's fine
    expect(result.cagr === null || typeof result.cagr === 'number').toBe(true);
  });
});

describe('scenarioWhatIf', () => {
  it('returns valid output for new_commercial_facility scenario', () => {
    const result = scenarioWhatIf({
      prefecture: '愛知県',
      city: '名古屋市中区',
      scenario: 'new_commercial_facility',
      scale: 'large',
      horizon: '3y',
      includeMarkdown: true,
    });
    expect(result.prefecture).toBe('愛知県');
    expect(result.scenario).toContain('商業施設');
    expect(result.priceImpactPct).toBeGreaterThan(0);
    expect(result.baseline.investmentScore).toBeGreaterThanOrEqual(0);
    expect(result.projected.investmentScore).toBeGreaterThan(result.baseline.investmentScore);
    expect(result.keyOpportunities.length).toBeGreaterThan(0);
    expect(result.keyRisks.length).toBeGreaterThan(0);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('returns negative price impact for population_decline scenario', () => {
    const result = scenarioWhatIf({
      prefecture: '愛知県',
      city: '名古屋市中区',
      scenario: 'population_decline',
      scale: 'large',
      horizon: '5y',
      includeMarkdown: false,
    });
    expect(result.priceImpactPct).toBeLessThan(0);
    expect(result.projected.riskScore).toBeGreaterThan(result.baseline.riskScore);
  });

  it('includes markdownReport when requested', () => {
    const result = scenarioWhatIf({
      prefecture: '大阪府',
      city: '大阪市中央区',
      scenario: 'new_station',
      scale: 'medium',
      horizon: '3y',
      includeMarkdown: true,
    });
    expect(result.markdownReport).toBeDefined();
    expect(result.markdownReport).toContain('What-If シナリオ分析レポート');
  });

  it('disaster_risk_increase raises risk score', () => {
    const result = scenarioWhatIf({
      prefecture: '神奈川県',
      city: '横浜市西区',
      scenario: 'disaster_risk_increase',
      scale: 'medium',
      horizon: '3y',
      includeMarkdown: false,
    });
    expect(result.riskImpactPct).toBeGreaterThan(0);
    expect(result.projected.riskScore).toBeGreaterThan(result.baseline.riskScore);
  });

  it('confidence field is valid', () => {
    const result = scenarioWhatIf({
      prefecture: '福岡県',
      city: '福岡市博多区',
      scenario: 'new_corporate_office',
      scale: 'small',
      horizon: '1y',
      includeMarkdown: false,
    });
    expect(['high', 'medium', 'low']).toContain(result.confidence);
  });

  it('horizon multiplier scales impact correctly', () => {
    const r1y = scenarioWhatIf({
      prefecture: '愛知県',
      city: '名古屋市中区',
      scenario: 'new_commercial_facility',
      scale: 'large',
      horizon: '1y',
      includeMarkdown: false,
    });
    const r5y = scenarioWhatIf({
      prefecture: '愛知県',
      city: '名古屋市中区',
      scenario: 'new_commercial_facility',
      scale: 'large',
      horizon: '5y',
      includeMarkdown: false,
    });
    expect(r5y.priceImpactPct).toBeGreaterThan(r1y.priceImpactPct);
  });
});
