import { describe, it, expect } from 'vitest';
import { assessFamilyFriendlyScore } from '../src/tools/assess_family_friendly_score.js';
import { predictCorporateDemand } from '../src/tools/predict_corporate_demand.js';
import {
  FamilyFriendlyInput,
  FamilyFriendlyOutput,
  CorporateDemandInput,
  CorporateDemandOutput,
} from '../src/schemas.js';

describe('assess_family_friendly_score (Aichi)', () => {
  it('returns high score for education-strong area', () => {
    const result = assessFamilyFriendlyScore({
      prefecture: '愛知県',
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
    const highResult = assessFamilyFriendlyScore({
      prefecture: '愛知県',
      area: '名古屋市千種区',
      childAge: 'all',
    });
    const lowResult = assessFamilyFriendlyScore({
      prefecture: '愛知県',
      area: '名古屋市港区',
      childAge: 'all',
    });

    expect(highResult.schoolDistrict.educationScore).toBeGreaterThan(
      lowResult.schoolDistrict.educationScore,
    );
  });

  it('handles unknown area', () => {
    const result = assessFamilyFriendlyScore({
      prefecture: '愛知県',
      area: '存在しない市',
      childAge: 'elementary',
    });

    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.schoolDistrict.elementarySchool).toBe('不明');
  });

  it('validates input schema', () => {
    const input = FamilyFriendlyInput.parse({ area: '名古屋市昭和区' });
    expect(input.childAge).toBe('all');
    expect(input.prefecture).toBe('愛知県');
  });
});

describe('predict_corporate_demand (Aichi)', () => {
  it('returns high demand for 名古屋市中区', () => {
    const result = predictCorporateDemand({
      prefecture: '愛知県',
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
      prefecture: '愛知県',
      area: '刈谷市',
      propertyType: 'logistics',
      includeCommuteAnalysis: true,
    });

    expect(result.corporateMetrics.totalEstablishments).toBeGreaterThan(0);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('handles unknown area gracefully', () => {
    const result = predictCorporateDemand({
      prefecture: '愛知県',
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
    expect(input.prefecture).toBe('愛知県');
  });
});
