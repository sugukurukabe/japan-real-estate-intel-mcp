import { describe, it, expect } from 'vitest';
import { isToolAllowed } from '../src/tiers.js';
import { optimizePortfolio } from '../src/analysis/portfolio_optimization.js';
import { auditZoningCompliance } from '../src/analysis/zoning_compliance.js';
import { forecastDemographicShift } from '../src/analysis/demographic_forecast.js';
import type { OptimizePortfolioInput, AuditZoningComplianceInput, ForecastDemographicShiftInput } from '../src/schemas.js';

// ── Tier access control tests ──────────────────────────────────────────────

describe('Premium tool tier restrictions', () => {
  it('free tier blocks optimize_portfolio_allocation', () => {
    expect(isToolAllowed('free', 'optimize_portfolio_allocation')).toBe(false);
  });

  it('free tier blocks audit_zoning_compliance', () => {
    expect(isToolAllowed('free', 'audit_zoning_compliance')).toBe(false);
  });

  it('free tier blocks forecast_demographic_shift', () => {
    expect(isToolAllowed('free', 'forecast_demographic_shift')).toBe(false);
  });

  it('pro tier allows optimize_portfolio_allocation', () => {
    expect(isToolAllowed('pro', 'optimize_portfolio_allocation')).toBe(true);
  });

  it('pro tier allows forecast_demographic_shift', () => {
    expect(isToolAllowed('pro', 'forecast_demographic_shift')).toBe(true);
  });

  it('pro tier blocks audit_zoning_compliance (enterprise only)', () => {
    expect(isToolAllowed('pro', 'audit_zoning_compliance')).toBe(false);
  });

  it('enterprise tier allows all premium tools', () => {
    expect(isToolAllowed('enterprise', 'optimize_portfolio_allocation')).toBe(true);
    expect(isToolAllowed('enterprise', 'audit_zoning_compliance')).toBe(true);
    expect(isToolAllowed('enterprise', 'forecast_demographic_shift')).toBe(true);
  });
});

// ── Portfolio optimization analysis tests ──────────────────────────────────

describe('optimizePortfolio analysis', () => {
  const sampleInput: OptimizePortfolioInput = {
    properties: [
      {
        name: '物件A — 名古屋',
        prefecture: '愛知県',
        city: '名古屋市中区',
        purchasePriceJpy: 100_000_000,
        annualRentJpy: 5_000_000,
        propertyType: 'office',
      },
      {
        name: '物件B — 東京',
        prefecture: '東京都',
        city: '新宿区',
        purchasePriceJpy: 200_000_000,
        annualRentJpy: 8_000_000,
        propertyType: 'residential',
      },
    ],
    targetGoal: 'balanced',
  };

  it('returns valid output structure', async () => {
    const result = await optimizePortfolio(sampleInput);
    expect(result).toBeDefined();
    expect(result.items).toHaveLength(2);
    expect(result.totalAssetsJpy).toBe(300_000_000);
    expect(result.overallYield).toBeGreaterThan(0);
    expect(result.portfolioRiskScore).toBeGreaterThanOrEqual(0);
    expect(result.portfolioRiskScore).toBeLessThanOrEqual(100);
    expect(result.diversificationScore).toBeGreaterThanOrEqual(0);
    expect(result.diversificationScore).toBeLessThanOrEqual(100);
  });

  it('generates markdown report', async () => {
    const result = await optimizePortfolio(sampleInput);
    expect(result.markdownReport).toContain('ポートフォリオ');
    expect(result.markdownReport).toContain('物件A');
    expect(result.markdownReport).toContain('物件B');
  });

  it('items contain per-property analysis', async () => {
    const result = await optimizePortfolio(sampleInput);
    for (const item of result.items) {
      expect(item.currentYield).toBeGreaterThanOrEqual(0);
      expect(item.hazardRiskScore).toBeGreaterThanOrEqual(0);
      expect(item.riskAdjustedReturnScore).toBeGreaterThanOrEqual(0);
      expect(item.actionRecommendation).toBeTruthy();
    }
  });

  it('yield_max goal changes strategy text', async () => {
    const yieldInput: OptimizePortfolioInput = { ...sampleInput, targetGoal: 'yield_max' };
    const result = await optimizePortfolio(yieldInput);
    expect(result.optimizationStrategyJa).toContain('インカムゲイン');
  });

  it('risk_min goal changes strategy text', async () => {
    const riskInput: OptimizePortfolioInput = { ...sampleInput, targetGoal: 'risk_min' };
    const result = await optimizePortfolio(riskInput);
    expect(result.optimizationStrategyJa).toContain('災害リスク');
  });
});

// ── Zoning compliance audit tests ──────────────────────────────────────────

describe('auditZoningCompliance analysis', () => {
  const compliantInput: AuditZoningComplianceInput = {
    prefecture: '愛知県',
    city: '名古屋市中区',
    proposedUse: 'commercial',
    proposedHeightM: 30,
    proposedFloors: 8,
    proposedBuildingAreaSqm: 300,
    proposedTotalFloorAreaSqm: 2400,
    siteAreaSqm: 500,
    frontRoadWidthM: 12,
  };

  it('returns valid output structure', async () => {
    const result = await auditZoningCompliance(compliantInput);
    expect(result).toBeDefined();
    expect(typeof result.coverageRatioCompliant).toBe('boolean');
    expect(typeof result.floorAreaRatioCompliant).toBe('boolean');
    expect(typeof result.slantLineCompliant).toBe('boolean');
    expect(typeof result.heightLimitCompliant).toBe('boolean');
    expect(typeof result.isFullyCompliant).toBe('boolean');
    expect(result.zoningType).toBeTruthy();
  });

  it('calculates coverage and floor area ratios correctly', async () => {
    const result = await auditZoningCompliance(compliantInput);
    // 300/500 = 60%
    expect(result.proposedCoverageRatio).toBeCloseTo(60, 0);
    // 2400/500 = 480%
    expect(result.proposedFloorAreaRatio).toBeCloseTo(480, 0);
  });

  it('generates markdown report with compliance table', async () => {
    const result = await auditZoningCompliance(compliantInput);
    expect(result.markdownReport).toContain('監査レポート');
    expect(result.markdownReport).toContain('建蔽率');
    expect(result.markdownReport).toContain('容積率');
    expect(result.markdownReport).toContain('斜線');
  });

  it('detects height limit violation', async () => {
    const tooTall: AuditZoningComplianceInput = {
      ...compliantInput,
      proposedUse: 'residential',
      proposedHeightM: 100,
      proposedFloors: 25,
    };
    const result = await auditZoningCompliance(tooTall);
    expect(result.heightLimitCompliant).toBe(false);
    expect(result.isFullyCompliant).toBe(false);
    expect(result.complianceSummaryJa).toContain('不適合');
  });

  it('provides optimization tips when non-compliant', async () => {
    const nonCompliant: AuditZoningComplianceInput = {
      ...compliantInput,
      proposedUse: 'residential',
      proposedHeightM: 100,
      proposedFloors: 25,
      proposedBuildingAreaSqm: 400,
      proposedTotalFloorAreaSqm: 10000,
    };
    const result = await auditZoningCompliance(nonCompliant);
    expect(result.optimizationTipsJa.length).toBeGreaterThan(0);
  });
});

// ── Demographic forecast tests ─────────────────────────────────────────────

describe('forecastDemographicShift analysis', () => {
  const sampleInput: ForecastDemographicShiftInput = {
    prefecture: '愛知県',
    city: '名古屋市中区',
  };

  it('returns valid output structure', async () => {
    const result = await forecastDemographicShift(sampleInput);
    expect(result).toBeDefined();
    expect(result.city).toBe('名古屋市中区');
    expect(['active_growth', 'stable', 'moderate_decline', 'rapid_decline']).toContain(result.growthCategory);
    expect(result.growthCategoryJa).toBeTruthy();
    expect(result.timeline.length).toBeGreaterThanOrEqual(3);
  });

  it('timeline years are in ascending order', async () => {
    const result = await forecastDemographicShift(sampleInput);
    for (let i = 1; i < result.timeline.length; i++) {
      expect(result.timeline[i].year).toBeGreaterThan(result.timeline[i - 1].year);
    }
  });

  it('each timeline entry has positive values', async () => {
    const result = await forecastDemographicShift(sampleInput);
    for (const entry of result.timeline) {
      expect(entry.estimatedPopulation).toBeGreaterThan(0);
      expect(entry.estimatedHouseholds).toBeGreaterThan(0);
      expect(entry.agingRate).toBeGreaterThan(0);
      expect(entry.pedestrianFlowIndex).toBeGreaterThan(0);
    }
  });

  it('generates markdown report', async () => {
    const result = await forecastDemographicShift(sampleInput);
    expect(result.markdownReport).toContain('人口動態');
    expect(result.markdownReport).toContain('推計人口');
    expect(result.markdownReport).toContain(result.growthCategoryJa);
  });

  it('includes ten year change rates', async () => {
    const result = await forecastDemographicShift(sampleInput);
    expect(typeof result.tenYearPopulationChangeRate).toBe('number');
    expect(typeof result.tenYearPedestrianFlowChangeRate).toBe('number');
  });

  it('works with optional neighborhood parameter', async () => {
    const withNeighborhood: ForecastDemographicShiftInput = {
      ...sampleInput,
      neighborhood: '栄3丁目',
    };
    const result = await forecastDemographicShift(withNeighborhood);
    expect(result).toBeDefined();
    expect(result.neighborhood).toBe('栄3丁目');
  });
});
