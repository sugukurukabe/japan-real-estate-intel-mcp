import { describe, it, expect } from 'vitest';
import { crossAnalyzeWithHumanFlow } from '../src/tools/cross_analyze_with_human_flow.js';
import { assessFamilyFriendlyScore } from '../src/tools/assess_family_friendly_score.js';
import { predictCorporateDemand } from '../src/tools/predict_corporate_demand.js';
import {
  HumanFlowAnalyzeInput,
  HumanFlowAnalyzeOutput,
  FamilyFriendlyInput,
  FamilyFriendlyOutput,
  CorporateDemandInput,
  CorporateDemandOutput,
} from '../src/schemas.js';

describe('cross_analyze_with_human_flow', () => {
  it('returns valid result for 名古屋市中区 commercial', () => {
    const result = crossAnalyzeWithHumanFlow({
      area: '名古屋市中区',
      propertyType: 'commercial',
      timeRange: '3y',
      includeRisk: true,
      dayType: 'both',
    });

    expect(result.summary).toBeTruthy();
    expect(result.humanFlow.weekdayAvgFlow).toBeGreaterThan(0);
    expect(result.realDemandScore).toBeGreaterThanOrEqual(0);
    expect(result.realDemandScore).toBeLessThanOrEqual(100);
    expect(result.vacancyRiskScore).toBeGreaterThanOrEqual(0);
    expect(result.investmentScore).toBeGreaterThanOrEqual(0);
    expect(result.investmentScore).toBeLessThanOrEqual(100);
    expect(result.keyInsights.length).toBeGreaterThan(0);

    HumanFlowAnalyzeOutput.parse(result);
  });

  it('handles unknown area gracefully', () => {
    const result = crossAnalyzeWithHumanFlow({
      area: '存在しない市',
      propertyType: 'residential',
      timeRange: '1y',
      includeRisk: false,
      dayType: 'weekday',
    });

    expect(result.humanFlow.weekdayAvgFlow).toBe(0);
    expect(result.realDemandScore).toBeLessThanOrEqual(15);
  });

  it('validates schema round-trip', () => {
    const input = HumanFlowAnalyzeInput.parse({
      area: '豊田市',
      propertyType: 'office',
      timeRange: '5y',
    });
    expect(input.includeRisk).toBe(true);
    expect(input.dayType).toBe('both');
  });
});

describe('assess_family_friendly_score', () => {
  it('returns high score for education-strong area', () => {
    const result = assessFamilyFriendlyScore({
      area: '名古屋市千種区',
      childAge: 'all',
    });

    expect(result.overallScore).toBeGreaterThan(50);
    expect(result.schoolDistrict.educationScore).toBeGreaterThanOrEqual(0);
    expect(result.safety.crimeScore).toBeGreaterThanOrEqual(0);
    expect(result.keyInsights.length).toBeGreaterThan(0);
    expect(result.recommendations.length).toBeGreaterThan(0);

    FamilyFriendlyOutput.parse(result);
  });

  it('returns lower score for lower-education area', () => {
    const highResult = assessFamilyFriendlyScore({ area: '名古屋市千種区', childAge: 'all' });
    const lowResult = assessFamilyFriendlyScore({ area: '名古屋市港区', childAge: 'all' });

    expect(highResult.schoolDistrict.educationScore).toBeGreaterThan(
      lowResult.schoolDistrict.educationScore,
    );
  });

  it('handles unknown area', () => {
    const result = assessFamilyFriendlyScore({
      area: '存在しない市',
      childAge: 'elementary',
    });

    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.schoolDistrict.elementarySchool).toBe('不明');
  });

  it('validates input schema', () => {
    const input = FamilyFriendlyInput.parse({ area: '名古屋市昭和区' });
    expect(input.childAge).toBe('all');
  });
});

describe('predict_corporate_demand', () => {
  it('returns high demand for 名古屋市中区', () => {
    const result = predictCorporateDemand({
      area: '名古屋市中区',
      propertyType: 'office',
      includeCommuteAnalysis: true,
    });

    expect(result.summary).toBeTruthy();
    expect(result.corporateMetrics.totalEstablishments).toBeGreaterThan(0);
    expect(result.demandScore).toBeGreaterThan(30);
    expect(result.rentabilityScore).toBeGreaterThanOrEqual(0);
    expect(result.keyInsights.length).toBeGreaterThan(0);

    CorporateDemandOutput.parse(result);
  });

  it('returns logistics-appropriate analysis for 刈谷市', () => {
    const result = predictCorporateDemand({
      area: '刈谷市',
      propertyType: 'logistics',
      includeCommuteAnalysis: true,
    });

    expect(result.corporateMetrics.totalEstablishments).toBeGreaterThan(0);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('handles unknown area gracefully', () => {
    const result = predictCorporateDemand({
      area: '存在しない市',
      propertyType: 'office',
      includeCommuteAnalysis: false,
    });

    expect(result.corporateMetrics.totalEstablishments).toBe(0);
    expect(result.demandScore).toBeLessThanOrEqual(10);
  });

  it('validates input schema defaults', () => {
    const input = CorporateDemandInput.parse({ area: '豊田市' });
    expect(input.propertyType).toBe('office');
    expect(input.includeCommuteAnalysis).toBe(true);
  });
});
