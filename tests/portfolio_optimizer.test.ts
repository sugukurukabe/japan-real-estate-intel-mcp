import { describe, it, expect } from 'vitest';
import { portfolioOptimizer } from '../src/tools/portfolio_optimizer.js';
import type { PortfolioOptimizerInput } from '../src/schemas.js';

const SAMPLE_2_TARGETS: PortfolioOptimizerInput = {
  targets: [
    { prefecture: '東京都', city: '新宿区', propertyType: 'office', budgetManYen: 10000 },
    { prefecture: '大阪府', city: '大阪市北区', propertyType: 'commercial', budgetManYen: 5000 },
  ],
  riskTolerance: 'medium',
  investmentHorizon: '5y',
  optimizeFor: 'risk_adjusted',
  includeMarkdown: true,
};

const SAMPLE_3_TARGETS: PortfolioOptimizerInput = {
  targets: [
    { prefecture: '愛知県', city: '名古屋市中区', propertyType: 'residential', budgetManYen: 3000 },
    { prefecture: '福岡県', city: '福岡市博多区', propertyType: 'commercial', budgetManYen: 4000 },
    { prefecture: '北海道', city: '札幌市中央区', propertyType: 'land', budgetManYen: 2000 },
  ],
  riskTolerance: 'low',
  investmentHorizon: '10y',
  optimizeFor: 'diversification',
  includeMarkdown: false,
};

describe('portfolioOptimizer — basic output', () => {
  it('returns valid output structure for 2 targets', () => {
    const result = portfolioOptimizer(SAMPLE_2_TARGETS);
    expect(result).toBeDefined();
    expect(result.assets).toHaveLength(2);
    expect(result.totalBudgetManYen).toBe(15000);
    expect(result.optimizeFor).toBe('risk_adjusted');
    expect(result.riskTolerance).toBe('medium');
    expect(result.investmentHorizon).toBe('5y');
  });

  it('allocations sum to 100', () => {
    const result = portfolioOptimizer(SAMPLE_2_TARGETS);
    const total = result.assets.reduce((s, a) => s + a.allocationPct, 0);
    expect(total).toBe(100);
  });

  it('returns expected annual return per asset > 0', () => {
    const result = portfolioOptimizer(SAMPLE_2_TARGETS);
    for (const asset of result.assets) {
      expect(asset.expectedAnnualReturnPct).toBeGreaterThan(0);
    }
  });

  it('risk scores are within [1, 10]', () => {
    const result = portfolioOptimizer(SAMPLE_2_TARGETS);
    for (const asset of result.assets) {
      expect(asset.riskScore).toBeGreaterThanOrEqual(1);
      expect(asset.riskScore).toBeLessThanOrEqual(10);
    }
  });

  it('liquidity scores are within [1, 10]', () => {
    const result = portfolioOptimizer(SAMPLE_2_TARGETS);
    for (const asset of result.assets) {
      expect(asset.liquidityScore).toBeGreaterThanOrEqual(1);
      expect(asset.liquidityScore).toBeLessThanOrEqual(10);
    }
  });

  it('recommendation is valid enum value', () => {
    const valid = ['strong_buy', 'buy', 'hold', 'reduce', 'sell'];
    const result = portfolioOptimizer(SAMPLE_2_TARGETS);
    for (const asset of result.assets) {
      expect(valid).toContain(asset.recommendation);
    }
  });
});

describe('portfolioOptimizer — portfolio metrics', () => {
  it('portfolioReturnPct is a positive number', () => {
    const result = portfolioOptimizer(SAMPLE_2_TARGETS);
    expect(result.portfolioReturnPct).toBeGreaterThan(0);
  });

  it('portfolioRiskScore is within [1, 10]', () => {
    const result = portfolioOptimizer(SAMPLE_2_TARGETS);
    expect(result.portfolioRiskScore).toBeGreaterThanOrEqual(1);
    expect(result.portfolioRiskScore).toBeLessThanOrEqual(10);
  });

  it('diversificationScore is within [0, 100]', () => {
    const result = portfolioOptimizer(SAMPLE_2_TARGETS);
    expect(result.diversificationScore).toBeGreaterThanOrEqual(0);
    expect(result.diversificationScore).toBeLessThanOrEqual(100);
  });

  it('sharpeRatio is a finite number', () => {
    const result = portfolioOptimizer(SAMPLE_2_TARGETS);
    expect(Number.isFinite(result.sharpeRatio)).toBe(true);
  });

  it('topRecommendation is non-empty string', () => {
    const result = portfolioOptimizer(SAMPLE_2_TARGETS);
    expect(result.topRecommendation.length).toBeGreaterThan(0);
  });

  it('keyInsights is non-empty array', () => {
    const result = portfolioOptimizer(SAMPLE_2_TARGETS);
    expect(result.keyInsights.length).toBeGreaterThan(0);
  });
});

describe('portfolioOptimizer — markdown report', () => {
  it('generates markdownReport when includeMarkdown=true', () => {
    const result = portfolioOptimizer(SAMPLE_2_TARGETS);
    expect(result.markdownReport).toBeDefined();
    expect(result.markdownReport!.length).toBeGreaterThan(100);
    expect(result.markdownReport!).toContain('ポートフォリオ');
  });

  it('does not generate markdownReport when includeMarkdown=false', () => {
    const result = portfolioOptimizer(SAMPLE_3_TARGETS);
    expect(result.markdownReport).toBeUndefined();
  });
});

describe('portfolioOptimizer — optimization modes', () => {
  it('diversification mode distributes allocations more evenly', () => {
    const result = portfolioOptimizer(SAMPLE_3_TARGETS);
    // With 3 targets and diversification mode, each should be ~33%
    for (const asset of result.assets) {
      expect(asset.allocationPct).toBeGreaterThan(25);
      expect(asset.allocationPct).toBeLessThan(45);
    }
  });

  it('10y horizon produces higher return than 3y for same inputs', () => {
    const input3y: PortfolioOptimizerInput = { ...SAMPLE_2_TARGETS, investmentHorizon: '3y' };
    const input10y: PortfolioOptimizerInput = { ...SAMPLE_2_TARGETS, investmentHorizon: '10y' };
    const r3y = portfolioOptimizer(input3y);
    const r10y = portfolioOptimizer(input10y);
    expect(r10y.portfolioReturnPct).toBeGreaterThan(r3y.portfolioReturnPct);
  });

  it('high risk tolerance produces higher expected return than low risk', () => {
    const low: PortfolioOptimizerInput = { ...SAMPLE_2_TARGETS, riskTolerance: 'low', optimizeFor: 'return' };
    const high: PortfolioOptimizerInput = { ...SAMPLE_2_TARGETS, riskTolerance: 'high', optimizeFor: 'return' };
    const rLow = portfolioOptimizer(low);
    const rHigh = portfolioOptimizer(high);
    expect(rHigh.portfolioReturnPct).toBeGreaterThan(rLow.portfolioReturnPct);
  });
});
