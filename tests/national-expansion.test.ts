import { describe, it, expect } from 'vitest';
import { getLoader, listAvailable } from '../src/data-loaders/index.js';
import { resolvePrefecture, getPrefectureDisplayName, isKnownPrefecture } from '../src/prefecture/resolver.js';
import { crossAnalyze } from '../src/tools/cross_analyze_real_estate_market.js';
import { assessPropertyRisk } from '../src/tools/assess_property_risk.js';

// ── Parameterised test data for all 5 new prefectures + Osaka ─────────────────

const NEW_PREFECTURES = [
  {
    key: 'fukuoka',
    displayName: '福岡県',
    aliases: ['福岡県', '福岡', 'JP-40'],
    representativeArea: '福岡市中央区',
    latRange: [33.0, 34.0] as [number, number],
    lngRange: [130.0, 131.5] as [number, number],
  },
  {
    key: 'hokkaido',
    displayName: '北海道',
    aliases: ['北海道', 'JP-01'],
    representativeArea: '札幌市中央区',
    latRange: [41.5, 45.5] as [number, number],
    lngRange: [139.5, 145.5] as [number, number],
  },
  {
    key: 'kanagawa',
    displayName: '神奈川県',
    aliases: ['神奈川県', '神奈川', 'JP-14'],
    representativeArea: '横浜市西区',
    latRange: [35.1, 35.7] as [number, number],
    lngRange: [139.0, 139.8] as [number, number],
  },
  {
    key: 'kyoto',
    displayName: '京都府',
    aliases: ['京都府', '京都', 'JP-26'],
    representativeArea: '京都市中京区',
    latRange: [34.6, 35.8] as [number, number],
    lngRange: [135.4, 136.0] as [number, number],
  },
  {
    key: 'hyogo',
    displayName: '兵庫県',
    aliases: ['兵庫県', '兵庫', 'JP-28'],
    representativeArea: '神戸市中央区',
    latRange: [34.2, 35.7] as [number, number],
    lngRange: [134.2, 135.5] as [number, number],
  },
  {
    key: 'saitama',
    displayName: '埼玉県',
    aliases: ['埼玉県', '埼玉', 'JP-11'],
    representativeArea: 'さいたま市大宮区',
    latRange: [35.7, 36.3] as [number, number],
    lngRange: [138.7, 139.9] as [number, number],
  },
  {
    key: 'chiba',
    displayName: '千葉県',
    aliases: ['千葉県', '千葉', 'JP-12'],
    representativeArea: '千葉市中央区',
    latRange: [35.0, 36.1] as [number, number],
    lngRange: [139.7, 140.9] as [number, number],
  },
] as const;

// ── resolver tests ────────────────────────────────────────────────────────────

describe('National Expansion — resolver', () => {
  for (const pref of NEW_PREFECTURES) {
    describe(`${pref.displayName}`, () => {
      for (const alias of pref.aliases) {
        it(`resolves "${alias}" to ${pref.key}`, () => {
          expect(resolvePrefecture(alias)).toBe(pref.key);
        });
      }

      it(`isKnownPrefecture("${pref.key}") is true`, () => {
        expect(isKnownPrefecture(pref.key)).toBe(true);
      });

      it(`getPrefectureDisplayName returns "${pref.displayName}"`, () => {
        expect(getPrefectureDisplayName(pref.key)).toBe(pref.displayName);
      });
    });
  }
});

// ── registry tests ────────────────────────────────────────────────────────────

describe('National Expansion — registry', () => {
  it('all 10 prefectures are listed as available', () => {
    const available = listAvailable();
    for (const pref of NEW_PREFECTURES) {
      expect(available).toContain(pref.key);
    }
    expect(available).toContain('aichi');
    expect(available).toContain('tokyo');
    expect(available).toContain('osaka');
    expect(available).toContain('saitama');
    expect(available).toContain('chiba');
  });

  for (const pref of NEW_PREFECTURES) {
    it(`getLoader("${pref.key}") returns a named loader (not stub)`, () => {
      const loader = getLoader(pref.key);
      expect(loader.key).toBe(pref.key);
      expect(loader.displayName).toBe(pref.displayName);
    });
  }
});

// ── loader data tests ─────────────────────────────────────────────────────────

describe('National Expansion — loader data', () => {
  for (const pref of NEW_PREFECTURES) {
    describe(`${pref.displayName} loader`, () => {
      it('getLandPrices() is non-empty', () => {
        const loader = getLoader(pref.key);
        expect(loader.getLandPrices().length).toBeGreaterThan(0);
      });

      it('getPopulation() is non-empty', () => {
        const loader = getLoader(pref.key);
        expect(loader.getPopulation().length).toBeGreaterThan(0);
      });

      it('getEarthquakeData() is non-empty', () => {
        const loader = getLoader(pref.key);
        expect(loader.getEarthquakeData().length).toBeGreaterThan(0);
      });

      it('getFloodZones() is a FeatureCollection', () => {
        const loader = getLoader(pref.key);
        const fc = loader.getFloodZones();
        expect(fc.type).toBe('FeatureCollection');
        expect(Array.isArray(fc.features)).toBe(true);
        expect(fc.features.length).toBeGreaterThan(0);
      });

      it('getMunicipalities() is a FeatureCollection', () => {
        const loader = getLoader(pref.key);
        const fc = loader.getMunicipalities();
        expect(fc.type).toBe('FeatureCollection');
        expect(fc.features.length).toBeGreaterThan(0);
      });

      it('getNeighborhoods() is non-empty and capabilities.neighborhoods is true', () => {
        const loader = getLoader(pref.key);
        expect(loader.capabilities.neighborhoods).toBe(true);
        expect(loader.getNeighborhoods().length).toBeGreaterThan(0);
      });

      it('has full v5.0 capabilities (transactions/humanFlow/education/corporate/crime/transport/commercial/medical = true)', () => {
        const loader = getLoader(pref.key);
        expect(loader.capabilities.transactions).toBe(true);
        expect(loader.capabilities.humanFlow).toBe(true);
        expect(loader.capabilities.education).toBe(true);
        expect(loader.capabilities.corporate).toBe(true);
        expect(loader.capabilities.crime).toBe(true);
        expect(loader.capabilities.transport).toBe(true);
        expect(loader.capabilities.commercial).toBe(true);
        expect(loader.capabilities.medical).toBe(true);
        // plateau remains false for non-Aichi/Tokyo/Osaka prefectures
        const plateauPrefs = ['aichi', 'tokyo', 'osaka'];
        if (plateauPrefs.includes(pref.key)) {
          expect(loader.capabilities.plateau).toBe(true);
        } else {
          expect(loader.capabilities.plateau).toBe(false);
        }
      });

      it(`geocode("${pref.representativeArea}") returns coordinates in expected range`, () => {
        const loader = getLoader(pref.key);
        const loc = loader.geocode(pref.representativeArea);
        expect(loc).toBeDefined();
        expect(loc!.lat).toBeGreaterThan(pref.latRange[0]);
        expect(loc!.lat).toBeLessThan(pref.latRange[1]);
        expect(loc!.lng).toBeGreaterThan(pref.lngRange[0]);
        expect(loc!.lng).toBeLessThan(pref.lngRange[1]);
      });
    });
  }
});

// ── tool integration tests ────────────────────────────────────────────────────

describe('National Expansion — tool integration', () => {
  for (const pref of NEW_PREFECTURES) {
    it(`crossAnalyze works for ${pref.displayName}`, () => {
      const result = crossAnalyze({
        prefecture: pref.aliases[0],
        area: pref.representativeArea,
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

    it(`assessPropertyRisk works for ${pref.displayName}`, () => {
      const result = assessPropertyRisk({
        prefecture: pref.aliases[0],
        address: pref.representativeArea,
        propertyValue: 50000000,
        riskTypes: ['all'],
      });
      expect(result.overallRiskScore).toBeGreaterThanOrEqual(0);
    });
  }
});
