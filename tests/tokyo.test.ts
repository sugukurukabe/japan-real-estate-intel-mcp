import { describe, it, expect } from 'vitest';
import { crossAnalyze } from '../src/tools/cross_analyze_real_estate_market.js';
import { assessPropertyRisk } from '../src/tools/assess_property_risk.js';
import { generateAreaReport } from '../src/tools/generate_area_report.js';
import { openDashboard } from '../src/tools/open_dashboard.js';
import { assessFamilyFriendlyScore } from '../src/tools/assess_family_friendly_score.js';
import { predictCorporateDemand } from '../src/tools/predict_corporate_demand.js';
import { resolvePrefecture } from '../src/prefecture/resolver.js';
import { getLoader, listAvailable } from '../src/data-loaders/index.js';

describe('Prefecture resolver', () => {
  it('resolves 東京都 to tokyo', () => {
    expect(resolvePrefecture('東京都')).toBe('tokyo');
  });

  it('resolves JP-13 to tokyo', () => {
    expect(resolvePrefecture('JP-13')).toBe('tokyo');
  });

  it('resolves 愛知県 to aichi', () => {
    expect(resolvePrefecture('愛知県')).toBe('aichi');
  });

  it('lists all registered prefectures', () => {
    const available = listAvailable();
    expect(available).toContain('aichi');
    expect(available).toContain('tokyo');
    expect(available).toContain('osaka');
  });
});

describe('Tokyo loader capabilities', () => {
  it('has no humanFlow capability', () => {
    const loader = getLoader('tokyo');
    expect(loader.capabilities.humanFlow).toBe(false);
    expect(loader.capabilities.education).toBe(false);
    expect(loader.capabilities.corporate).toBe(false);
    expect(loader.capabilities.crime).toBe(false);
    expect(loader.capabilities.plateau).toBe(false);
  });

  it('returns land prices for Tokyo', () => {
    const loader = getLoader('tokyo');
    const prices = loader.getLandPrices();
    expect(prices.length).toBeGreaterThan(0);
  });

  it('returns population for Tokyo', () => {
    const loader = getLoader('tokyo');
    const pop = loader.getPopulation();
    expect(pop.length).toBe(23);
  });

  it('returns empty arrays for unsupported capabilities', () => {
    const loader = getLoader('tokyo');
    expect(loader.getHumanFlow()).toEqual([]);
    expect(loader.getSchoolDistricts()).toEqual([]);
    expect(loader.getCorporateLocations()).toEqual([]);
    expect(loader.getCrimeStats()).toEqual([]);
    expect(loader.getPlateauBuildings()).toEqual([]);
  });

  it('geocodes 世田谷区', () => {
    const loader = getLoader('tokyo');
    const coords = loader.geocode('世田谷区');
    expect(coords).toBeDefined();
    expect(coords!.lat).toBeCloseTo(35.646, 1);
  });
});

describe('crossAnalyze (Tokyo)', () => {
  it('returns valid result for 世田谷区', () => {
    const result = crossAnalyze({
      prefecture: '東京都',
      area: '世田谷区',
      propertyType: 'residential',
      timeRange: '3y',
      includeRisk: true,
      includeHumanFlow: true,
      includeEducation: false,
      includeCorporate: false,
    });

    expect(result.summary).toContain('東京都');
    expect(result.priceTrend.current).toBeGreaterThan(0);
    expect(result.investmentScore).toBeGreaterThanOrEqual(0);
    expect(result.investmentScore).toBeLessThanOrEqual(100);
  });

  it('indicates humanFlow is not available for Tokyo', () => {
    const result = crossAnalyze({
      prefecture: '東京都',
      area: '千代田区',
      propertyType: 'commercial',
      timeRange: '3y',
      includeRisk: false,
      includeHumanFlow: true,
      includeEducation: false,
      includeCorporate: false,
    });

    expect(result.humanFlow).toBeUndefined();
    expect(result.keyInsights.some(i => i.includes('v2.x'))).toBe(true);
  });

  it('indicates education is not available for Tokyo', () => {
    const result = crossAnalyze({
      prefecture: '東京都',
      area: '渋谷区',
      propertyType: 'commercial',
      timeRange: '3y',
      includeRisk: false,
      includeHumanFlow: false,
      includeEducation: true,
      includeCorporate: false,
    });

    expect(result.educationSummary).toBeUndefined();
    expect(result.keyInsights.some(i => i.includes('教育データ'))).toBe(true);
  });
});

describe('assessPropertyRisk (Tokyo)', () => {
  it('evaluates risk for 江東区 (high flood area)', () => {
    const result = assessPropertyRisk({
      prefecture: '東京都',
      address: '江東区',
      riskTypes: ['all'],
    });

    expect(result.overallRiskScore).toBeGreaterThanOrEqual(0);
    expect(result.overallRiskScore).toBeLessThanOrEqual(100);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('handles unknown Tokyo address', () => {
    const result = assessPropertyRisk({
      prefecture: '東京都',
      address: 'ありえない住所XYZ',
      riskTypes: ['all'],
    });

    expect(result.overallRiskScore).toBe(0);
    expect(result.recommendations[0]).toContain('東京都');
  });
});

describe('generateAreaReport (Tokyo)', () => {
  it('generates report for 千代田区', () => {
    const result = generateAreaReport({
      prefecture: '東京都',
      area: '千代田区',
      purpose: 'investment',
      includeCharts: true,
    });

    expect(result.markdownReport).toContain('千代田区');
    expect(result.markdownReport).toContain('出典');
  });
});

describe('assessFamilyFriendlyScore (Tokyo - limited)', () => {
  it('returns result with limitation notices', () => {
    const result = assessFamilyFriendlyScore({
      prefecture: '東京都',
      area: '世田谷区',
      childAge: 'all',
    });

    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.keyInsights.some(i => i.includes('v2.x'))).toBe(true);
    expect(result.schoolDistrict.elementarySchool).toBe('不明');
  });
});

describe('predictCorporateDemand (Tokyo - limited)', () => {
  it('returns result with limitation notices', () => {
    const result = predictCorporateDemand({
      prefecture: '東京都',
      area: '千代田区',
      propertyType: 'office',
      includeCommuteAnalysis: true,
    });

    expect(result.corporateMetrics.totalEstablishments).toBe(0);
    expect(result.keyInsights.some(i => i.includes('v2.x'))).toBe(true);
  });
});

describe('Osaka loader basic checks', () => {
  it('returns land price data for Osaka', () => {
    const loader = getLoader('osaka');
    expect(loader.key).toBe('osaka');
    expect(loader.getLandPrices().length).toBeGreaterThan(0);
    expect(loader.getPopulation().length).toBeGreaterThan(0);
  });
});

describe('Stub loader for unsupported prefectures', () => {
  it('returns empty data for unsupported prefecture', () => {
    const loader = getLoader('okinawa');
    expect(loader.getLandPrices()).toEqual([]);
    expect(loader.getPopulation()).toEqual([]);
    expect(loader.geocode('那覇市')).toBeUndefined();
  });
});

describe('openDashboard (Tokyo)', () => {
  it('returns tokyo prefecture key', () => {
    const result = openDashboard({ prefecture: '東京都', area: '渋谷区', layer: 'land_price' });
    expect(result.prefecture).toBe('tokyo');
    expect(result.area).toBe('渋谷区');
  });
});

describe('Tokyo v2.2 capabilities', () => {
  it('Tokyo lacks transport/commercial/medical', () => {
    const loader = getLoader('tokyo');
    expect(loader.capabilities.transport).toBe(false);
    expect(loader.capabilities.commercial).toBe(false);
    expect(loader.capabilities.medical).toBe(false);
  });

  it('Tokyo returns empty arrays for new data types', () => {
    const loader = getLoader('tokyo');
    expect(loader.getTransport()).toHaveLength(0);
    expect(loader.getCommercialFacilities()).toHaveLength(0);
    expect(loader.getMedicalFacilities()).toHaveLength(0);
  });
});
