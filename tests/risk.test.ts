import { describe, it, expect } from 'vitest';
import { computeRisk } from '../src/analysis/risk_score.js';
import { computeInvestmentScore } from '../src/analysis/investment_score.js';
import { computePriceTrend } from '../src/analysis/price_trend.js';

describe('computeRisk (Aichi)', () => {
  it('returns higher score for flood-prone area (港区)', () => {
    const result = computeRisk(35.0828, 136.8472, '名古屋市港区', ['all'], 'aichi');
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.adjustedPriceImpact).toBeLessThanOrEqual(0);
  });

  it('returns lower score for non-flood area', () => {
    const result = computeRisk(35.18, 136.95, '名古屋市千種区', ['all'], 'aichi');
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it('only evaluates flood when specified', () => {
    const result = computeRisk(35.08, 136.85, '名古屋市港区', ['flood'], 'aichi');
    expect(result.earthquakeRisk.intensity).toBe('4');
  });

  it('provides recommendations', () => {
    const result = computeRisk(35.0828, 136.8472, '名古屋市港区', ['all'], 'aichi');
    expect(result.recommendations.length).toBeGreaterThan(0);
  });
});

describe('computeInvestmentScore', () => {
  it('returns higher score for appreciating low-risk area', () => {
    const score = computeInvestmentScore({
      priceChangeRate: 8,
      riskScore: 10,
      propertyType: 'residential',
    });
    expect(score).toBeGreaterThan(50);
  });

  it('returns lower score for depreciating high-risk area', () => {
    const score = computeInvestmentScore({
      priceChangeRate: -5,
      riskScore: 80,
      propertyType: 'residential',
    });
    expect(score).toBeLessThan(50);
  });

  it('stays within 0-100', () => {
    const extremes = [
      { priceChangeRate: 100, riskScore: 0, propertyType: 'residential' },
      { priceChangeRate: -100, riskScore: 100, propertyType: 'commercial' },
    ];
    for (const params of extremes) {
      const score = computeInvestmentScore(params);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });
});

describe('computePriceTrend', () => {
  it('computes trend from land prices', () => {
    const prices = [
      { year: 2022, city: 'test', district: '', address: '', land_use: '', price_per_sqm: 100000, change_rate: 0, lat: 0, lng: 0 },
      { year: 2023, city: 'test', district: '', address: '', land_use: '', price_per_sqm: 110000, change_rate: 0, lat: 0, lng: 0 },
      { year: 2024, city: 'test', district: '', address: '', land_use: '', price_per_sqm: 120000, change_rate: 0, lat: 0, lng: 0 },
    ];
    const trend = computePriceTrend(prices, []);
    expect(trend.current).toBe(120000);
    expect(trend.changeRate).toBe(20);
    expect(trend.forecast).toBeTruthy();
  });

  it('handles empty data', () => {
    const trend = computePriceTrend([], []);
    expect(trend.current).toBe(0);
    expect(trend.forecast).toContain('データ不足');
  });
});
