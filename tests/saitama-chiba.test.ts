import { describe, it, expect } from 'vitest';
import { getLoader, listAvailable } from '../src/data-loaders/index.js';
import { resolvePrefecture, isKnownPrefecture } from '../src/prefecture/resolver.js';
import { crossAnalyze } from '../src/tools/cross_analyze_real_estate_market.js';

// ── Saitama Tests ─────────────────────────────────────────────────────────────

describe('Saitama prefecture', () => {
  it('is registered and available', () => {
    expect(listAvailable()).toContain('saitama');
    expect(isKnownPrefecture('saitama')).toBe(true);
  });

  it('resolves aliases to saitama', () => {
    expect(resolvePrefecture('埼玉県')).toBe('saitama');
    expect(resolvePrefecture('埼玉')).toBe('saitama');
    expect(resolvePrefecture('saitama')).toBe('saitama');
    expect(resolvePrefecture('JP-11')).toBe('saitama');
  });

  it('loader has correct metadata', () => {
    const loader = getLoader('saitama');
    expect(loader.key).toBe('saitama');
    expect(loader.displayName).toBe('埼玉県');
    expect(loader.isoCode).toBe('JP-11');
  });

  it('has full v5.0 capabilities (all true except plateau)', () => {
    const loader = getLoader('saitama');
    expect(loader.capabilities.humanFlow).toBe(true);
    expect(loader.capabilities.education).toBe(true);
    expect(loader.capabilities.corporate).toBe(true);
    expect(loader.capabilities.crime).toBe(true);
    expect(loader.capabilities.transport).toBe(true);
    expect(loader.capabilities.commercial).toBe(true);
    expect(loader.capabilities.medical).toBe(true);
    expect(loader.capabilities.neighborhoods).toBe(true);
    expect(loader.capabilities.plateau).toBe(false);
  });

  it('getLandPrices returns non-empty data', () => {
    const loader = getLoader('saitama');
    expect(loader.getLandPrices().length).toBeGreaterThan(0);
  });

  it('getTransactions returns non-empty data', () => {
    const loader = getLoader('saitama');
    expect(loader.getTransactions().length).toBeGreaterThan(0);
  });

  it('getPopulation returns non-empty data', () => {
    const loader = getLoader('saitama');
    expect(loader.getPopulation().length).toBeGreaterThan(0);
  });

  it('getHumanFlow returns non-empty data', () => {
    const loader = getLoader('saitama');
    expect(loader.getHumanFlow().length).toBeGreaterThan(0);
  });

  it('getSchoolDistricts returns non-empty data', () => {
    const loader = getLoader('saitama');
    expect(loader.getSchoolDistricts().length).toBeGreaterThan(0);
  });

  it('getCorporateLocations returns non-empty data', () => {
    const loader = getLoader('saitama');
    expect(loader.getCorporateLocations().length).toBeGreaterThan(0);
  });

  it('getCrimeStats returns non-empty data', () => {
    const loader = getLoader('saitama');
    expect(loader.getCrimeStats().length).toBeGreaterThan(0);
  });

  it('getTransport returns non-empty data', () => {
    const loader = getLoader('saitama');
    expect(loader.getTransport().length).toBeGreaterThan(0);
  });

  it('getCommercialFacilities returns non-empty data', () => {
    const loader = getLoader('saitama');
    expect(loader.getCommercialFacilities().length).toBeGreaterThan(0);
  });

  it('getMedicalFacilities returns non-empty data', () => {
    const loader = getLoader('saitama');
    expect(loader.getMedicalFacilities().length).toBeGreaterThan(0);
  });

  it('geocodes さいたま市大宮区', () => {
    const loader = getLoader('saitama');
    const loc = loader.geocode('さいたま市大宮区');
    expect(loc).toBeDefined();
    expect(loc!.lat).toBeGreaterThan(35.5);
    expect(loc!.lat).toBeLessThan(36.5);
  });

  it('crossAnalyze works for Saitama', () => {
    const result = crossAnalyze({
      prefecture: '埼玉県',
      area: 'さいたま市大宮区',
      propertyType: 'residential',
      timeRange: '3y',
      includeRisk: true,
      includeHumanFlow: true,
      includeEducation: false,
      includeCorporate: false,
      includeTransport: false,
      includeCommercial: false,
      includeMedical: false,
    });
    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
  });
});

// ── Chiba Tests ───────────────────────────────────────────────────────────────

describe('Chiba prefecture', () => {
  it('is registered and available', () => {
    expect(listAvailable()).toContain('chiba');
    expect(isKnownPrefecture('chiba')).toBe(true);
  });

  it('resolves aliases to chiba', () => {
    expect(resolvePrefecture('千葉県')).toBe('chiba');
    expect(resolvePrefecture('千葉')).toBe('chiba');
    expect(resolvePrefecture('chiba')).toBe('chiba');
    expect(resolvePrefecture('JP-12')).toBe('chiba');
  });

  it('loader has correct metadata', () => {
    const loader = getLoader('chiba');
    expect(loader.key).toBe('chiba');
    expect(loader.displayName).toBe('千葉県');
    expect(loader.isoCode).toBe('JP-12');
  });

  it('has full v5.0 capabilities (all true except plateau)', () => {
    const loader = getLoader('chiba');
    expect(loader.capabilities.humanFlow).toBe(true);
    expect(loader.capabilities.education).toBe(true);
    expect(loader.capabilities.corporate).toBe(true);
    expect(loader.capabilities.crime).toBe(true);
    expect(loader.capabilities.transport).toBe(true);
    expect(loader.capabilities.commercial).toBe(true);
    expect(loader.capabilities.medical).toBe(true);
    expect(loader.capabilities.neighborhoods).toBe(true);
    expect(loader.capabilities.plateau).toBe(false);
  });

  it('getLandPrices returns non-empty data', () => {
    const loader = getLoader('chiba');
    expect(loader.getLandPrices().length).toBeGreaterThan(0);
  });

  it('getTransactions returns non-empty data', () => {
    const loader = getLoader('chiba');
    expect(loader.getTransactions().length).toBeGreaterThan(0);
  });

  it('getPopulation returns non-empty data', () => {
    const loader = getLoader('chiba');
    expect(loader.getPopulation().length).toBeGreaterThan(0);
  });

  it('getHumanFlow returns non-empty data', () => {
    const loader = getLoader('chiba');
    expect(loader.getHumanFlow().length).toBeGreaterThan(0);
  });

  it('getSchoolDistricts returns non-empty data', () => {
    const loader = getLoader('chiba');
    expect(loader.getSchoolDistricts().length).toBeGreaterThan(0);
  });

  it('getCorporateLocations returns non-empty data', () => {
    const loader = getLoader('chiba');
    expect(loader.getCorporateLocations().length).toBeGreaterThan(0);
  });

  it('getCrimeStats returns non-empty data', () => {
    const loader = getLoader('chiba');
    expect(loader.getCrimeStats().length).toBeGreaterThan(0);
  });

  it('getTransport returns non-empty data', () => {
    const loader = getLoader('chiba');
    expect(loader.getTransport().length).toBeGreaterThan(0);
  });

  it('getCommercialFacilities returns non-empty data', () => {
    const loader = getLoader('chiba');
    expect(loader.getCommercialFacilities().length).toBeGreaterThan(0);
  });

  it('getMedicalFacilities returns non-empty data', () => {
    const loader = getLoader('chiba');
    expect(loader.getMedicalFacilities().length).toBeGreaterThan(0);
  });

  it('geocodes 浦安市', () => {
    const loader = getLoader('chiba');
    const loc = loader.geocode('浦安市');
    expect(loc).toBeDefined();
    expect(loc!.lat).toBeGreaterThan(35.0);
    expect(loc!.lat).toBeLessThan(36.0);
  });

  it('crossAnalyze works for Chiba', () => {
    const result = crossAnalyze({
      prefecture: '千葉県',
      area: '浦安市',
      propertyType: 'residential',
      timeRange: '3y',
      includeRisk: true,
      includeHumanFlow: true,
      includeEducation: false,
      includeCorporate: false,
      includeTransport: false,
      includeCommercial: false,
      includeMedical: false,
    });
    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
  });
});
