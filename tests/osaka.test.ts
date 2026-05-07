import { describe, it, expect } from 'vitest';
import { getLoader, listAvailable } from '../src/data-loaders/index.js';
import { resolvePrefecture } from '../src/prefecture/resolver.js';
import { crossAnalyze } from '../src/tools/cross_analyze_real_estate_market.js';
import { assessPropertyRisk } from '../src/tools/assess_property_risk.js';
import { generateAreaReport } from '../src/tools/generate_area_report.js';

describe('Osaka prefecture resolver', () => {
  it('resolves 大阪府 to osaka', () => {
    expect(resolvePrefecture('大阪府')).toBe('osaka');
  });

  it('resolves 大阪 to osaka', () => {
    expect(resolvePrefecture('大阪')).toBe('osaka');
  });

  it('resolves osaka to osaka', () => {
    expect(resolvePrefecture('osaka')).toBe('osaka');
  });

  it('osaka is in the available list', () => {
    expect(listAvailable()).toContain('osaka');
  });
});

describe('Osaka loader capabilities', () => {
  it('has land_price and population', () => {
    const loader = getLoader('osaka');
    expect(loader.getLandPrices().length).toBeGreaterThan(0);
    expect(loader.getPopulation().length).toBeGreaterThan(0);
  });

  it('has earthquake data', () => {
    const loader = getLoader('osaka');
    expect(loader.getEarthquakeData().length).toBeGreaterThan(0);
  });

  it('has flood data', () => {
    const loader = getLoader('osaka');
    const flood = loader.getFloodZones();
    expect(flood.type).toBe('FeatureCollection');
    expect(flood.features.length).toBeGreaterThan(0);
  });

  it('has municipality data', () => {
    const loader = getLoader('osaka');
    const munis = loader.getMunicipalities();
    expect(munis).toBeDefined();
  });

  it('has neighborhood data', () => {
    const loader = getLoader('osaka');
    expect(loader.capabilities.neighborhoods).toBe(true);
    expect(loader.getNeighborhoods().length).toBeGreaterThan(0);
  });

  it('lacks advanced capabilities', () => {
    const loader = getLoader('osaka');
    expect(loader.capabilities.humanFlow).toBe(false);
    expect(loader.capabilities.education).toBe(false);
    expect(loader.capabilities.corporate).toBe(false);
    expect(loader.capabilities.plateau).toBe(false);
    expect(loader.capabilities.transport).toBe(false);
    expect(loader.capabilities.commercial).toBe(false);
    expect(loader.capabilities.medical).toBe(false);
  });

  it('geocodes known Osaka areas', () => {
    const loader = getLoader('osaka');
    const loc = loader.geocode('中央区');
    expect(loc).toBeDefined();
    expect(loc!.lat).toBeGreaterThan(34);
    expect(loc!.lng).toBeGreaterThan(135);
  });
});

describe('Osaka tool integration', () => {
  it('crossAnalyze works for Osaka', () => {
    const result = crossAnalyze({
      prefecture: '大阪府',
      area: '中央区',
      propertyType: 'commercial',
      timeRange: '3y',
      includeRisk: true,
      includeHumanFlow: false,
      includeEducation: false,
      includeCorporate: false,
      includeTransport: false,
      includeCommercial: false,
      includeMedical: false,
    });
    expect(result.priceTrend).toBeDefined();
  });

  it('assessPropertyRisk works for Osaka', () => {
    const result = assessPropertyRisk({
      prefecture: '大阪府',
      address: '中央区',
      propertyValue: 50000000,
      riskTypes: ['all'],
    });
    expect(result.overallRiskScore).toBeGreaterThanOrEqual(0);
  });

  it('generateAreaReport works for Osaka', () => {
    const result = generateAreaReport({
      prefecture: '大阪府',
      area: '北区',
      reportType: 'investment',
    });
    expect(result.markdownReport.length).toBeGreaterThan(0);
  });
});
