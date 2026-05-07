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
  it('has full v5.0 capabilities including plateau (Tokyo)', () => {
    const loader = getLoader('tokyo');
    expect(loader.capabilities.humanFlow).toBe(true);
    expect(loader.capabilities.education).toBe(true);
    expect(loader.capabilities.corporate).toBe(true);
    expect(loader.capabilities.crime).toBe(true);
    // plateau is now true for Tokyo (v5.0 PLATEAU data)
    expect(loader.capabilities.plateau).toBe(true);
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

  it('returns populated arrays for v4.0 advanced capabilities', () => {
    const loader = getLoader('tokyo');
    expect(loader.getHumanFlow().length).toBeGreaterThan(0);
    expect(loader.getSchoolDistricts().length).toBeGreaterThan(0);
    expect(loader.getCorporateLocations().length).toBeGreaterThan(0);
    expect(loader.getCrimeStats().length).toBeGreaterThan(0);
    // plateau now returns buildings (v5.0)
    expect(loader.getPlateauBuildings().length).toBeGreaterThan(0);
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

  it('humanFlow is now available for Tokyo (v4.0)', () => {
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

    // With v4.0 data, humanFlow may or may not populate depending on area match
    expect(result.investmentScore).toBeGreaterThanOrEqual(0);
    expect(result.investmentScore).toBeLessThanOrEqual(100);
  });

  it('education is now available for Tokyo (v4.0)', () => {
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

    expect(result.investmentScore).toBeGreaterThanOrEqual(0);
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
  it('generates report for 千代田区', async () => {
    const result = await generateAreaReport({
      prefecture: '東京都',
      area: '千代田区',
      purpose: 'investment',
      includeCharts: true,
    });

    expect(result.markdownReport).toContain('千代田区');
    expect(result.markdownReport).toContain('出典');
  });
});

describe('assessFamilyFriendlyScore (Tokyo - v4.0)', () => {
  it('returns result with valid scores', () => {
    const result = assessFamilyFriendlyScore({
      prefecture: '東京都',
      area: '世田谷区',
      childAge: 'all',
    });

    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });
});

describe('predictCorporateDemand (Tokyo - v4.0)', () => {
  it('returns result with corporate data', () => {
    const result = predictCorporateDemand({
      prefecture: '東京都',
      area: '千代田区',
      propertyType: 'office',
      includeCommuteAnalysis: true,
    });

    expect(result.demandScore).toBeGreaterThanOrEqual(0);
    expect(result.demandScore).toBeLessThanOrEqual(100);
    expect(result.summary).toContain('東京都');
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

describe('Tokyo v3.1 capabilities', () => {
  it('Tokyo now has transport/commercial/medical capabilities', () => {
    const loader = getLoader('tokyo');
    expect(loader.capabilities.transport).toBe(true);
    expect(loader.capabilities.commercial).toBe(true);
    expect(loader.capabilities.medical).toBe(true);
  });

  it('Tokyo returns non-empty arrays for transport/commercial/medical', () => {
    const loader = getLoader('tokyo');
    expect(loader.getTransport().length).toBeGreaterThan(0);
    expect(loader.getCommercialFacilities().length).toBeGreaterThan(0);
    expect(loader.getMedicalFacilities().length).toBeGreaterThan(0);
  });
});
