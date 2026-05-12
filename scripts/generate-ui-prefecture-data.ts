/**
 * Build ui-src/generated-prefectures.json from registered PrefectureLoaders + data/* CSV/JSON.
 * Run automatically from scripts/build-ui.js before esbuild.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Papa from 'papaparse';
import { getLoader, listAvailable } from '../src/data-loaders/index.js';
import type {
  CommercialFacilityRecord,
  CorporateLocationRecord,
  EarthquakeRecord,
  HumanFlowRecord,
  LandPriceRecord,
  LoaderCapabilities,
  MedicalFacilityRecord,
  PlateauBuildingRecord,
  PrefectureLoader,
  SchoolDistrictRecord,
  TransportRecord,
} from '../src/data-loaders/types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = resolve(ROOT, 'ui-src', 'generated-prefectures.json');

type PriceBucket = { min: number; color: string; label: string };

interface UiPrefectureConfig {
  center: [number, number];
  zoom: number;
  displayName: string;
  capabilities: {
    humanFlow: boolean;
    education: boolean;
    corporate: boolean;
    crime: boolean;
    plateau: boolean;
    transport: boolean;
    commercial: boolean;
    medical: boolean;
  };
  municipalities: Record<string, [number, number]>;
  landPrices: Record<string, { price: number; change: number }>;
  priceBuckets: PriceBucket[];
  risk: Record<string, { flood: number; earthquake: string; overall: number }>;
  humanFlow: Record<string, { weekday: number; weekend: number; stay: number; trend: string }>;
  school: Record<string, { score: number; advancement: number }>;
  corporate: Record<string, { establishments: number; major: number; employees: number }>;
  plateau: { name: string; city: string; height: number; lat: number; lng: number }[];
  transport: Record<string, { stations: number; dailyPassengers: number; lines: string[] }>;
  commercial: Record<string, { facilities: number; malls: number; cvs: number; totalGfa: number }>;
  medical: Record<string, { facilities: number; hospitals: number; beds: number }>;
}

const AICHI_PRICE_BUCKETS: PriceBucket[] = [
  { min: 1_000_000, color: '#ff2d55', label: '100万〜' },
  { min: 500_000, color: '#ff6b35', label: '50万〜100万' },
  { min: 300_000, color: '#ffb340', label: '30万〜50万' },
  { min: 200_000, color: '#ffe066', label: '20万〜30万' },
  { min: 150_000, color: '#a8e6cf', label: '15万〜20万' },
  { min: 0, color: '#69b7eb', label: '〜15万' },
];

const TOKYO_PRICE_BUCKETS: PriceBucket[] = [
  { min: 10_000_000, color: '#ff2d55', label: '1000万〜' },
  { min: 5_000_000, color: '#ff6b35', label: '500万〜1000万' },
  { min: 2_000_000, color: '#ffb340', label: '200万〜500万' },
  { min: 1_000_000, color: '#ffe066', label: '100万〜200万' },
  { min: 500_000, color: '#a8e6cf', label: '50万〜100万' },
  { min: 0, color: '#69b7eb', label: '〜50万' },
];

function uiCapabilities(cap: LoaderCapabilities): UiPrefectureConfig['capabilities'] {
  return {
    humanFlow: cap.humanFlow,
    education: cap.education,
    corporate: cap.corporate,
    crime: cap.crime,
    plateau: cap.plateau,
    transport: cap.transport,
    commercial: cap.commercial,
    medical: cap.medical,
  };
}

function intensityContribution(maxIntensity: string): number {
  const m: Record<string, number> = {
    '5弱': 12,
    '5強': 22,
    '6弱': 38,
    '6強': 52,
    '7弱': 65,
    '7': 80,
    '7強': 88,
  };
  return m[maxIntensity] ?? 35;
}

function liquefactionAdd(risk: EarthquakeRecord['liquefaction_risk']): number {
  if (risk === 'high') return 15;
  if (risk === 'medium') return 8;
  return 0;
}

function overallRiskScore(eq: EarthquakeRecord, flood0to100: number): number {
  const eqPart =
    intensityContribution(eq.max_intensity) * 0.55 +
    eq.probability_30y * 35 +
    liquefactionAdd(eq.liquefaction_risk);
  return Math.min(100, Math.round(eqPart * 0.65 + flood0to100 * 0.35));
}

const FLOOD_LEVEL: Record<string, number> = { low: 22, medium: 48, high: 78 };

function floodScoreFromCsvRow(row: Record<string, string>): number {
  const river = FLOOD_LEVEL[String(row.river_flood_risk)] ?? 40;
  const inland = FLOOD_LEVEL[String(row.inland_flood_risk)] ?? 40;
  const surge = FLOOD_LEVEL[String(row.storm_surge_risk)] ?? 40;
  const max3 = Math.max(river, inland, surge);
  const zone = String(row.hazard_zone ?? '');
  const zoneBoost = zone === 'danger' ? 12 : zone === 'warning' ? 6 : zone === 'caution' ? 0 : 4;
  return Math.min(100, Math.round(max3 + zoneBoost));
}

function loadFloodByCity(prefKey: string): Record<string, number> {
  const path = resolve(ROOT, 'data', prefKey, 'flood_risk.csv');
  if (!existsSync(path)) return {};
  const raw = readFileSync(path, 'utf-8').replace(/^\uFEFF/, '');
  const parsed = Papa.parse<Record<string, string>>(raw, { header: true, skipEmptyLines: true });
  const byCity: Record<string, number> = {};
  for (const row of parsed.data) {
    const city = row.city?.trim();
    if (!city) continue;
    byCity[city] = floodScoreFromCsvRow(row);
  }
  return byCity;
}

function buildLandPricesByCity(records: LandPriceRecord[]): Record<string, { price: number; change: number }> {
  const byCity = new Map<string, LandPriceRecord[]>();
  for (const r of records) {
    const city = r.city?.trim();
    if (!city) continue;
    let list = byCity.get(city);
    if (!list) {
      list = [];
      byCity.set(city, list);
    }
    list.push(r);
  }
  const out: Record<string, { price: number; change: number }> = {};
  for (const [city, arr] of byCity) {
    const years = arr.map(a => a.year).filter(y => typeof y === 'number' && !Number.isNaN(y));
    const maxYear = years.length ? Math.max(...years) : 0;
    const latest = maxYear ? arr.filter(a => a.year === maxYear) : arr;
    const priceNums = latest.map(a => a.price_per_sqm).filter(n => typeof n === 'number' && !Number.isNaN(n));
    const changeNums = latest.map(a => a.change_rate).filter(n => typeof n === 'number' && !Number.isNaN(n));
    const price = priceNums.length
      ? Math.round(priceNums.reduce((s, n) => s + n, 0) / priceNums.length)
      : 0;
    const change = changeNums.length
      ? Math.round((changeNums.reduce((s, n) => s + n, 0) / changeNums.length) * 10) / 10
      : 0;
    out[city] = { price, change };
  }
  return out;
}

function pickPriceBuckets(landPrices: Record<string, { price: number }>): PriceBucket[] {
  const vals = Object.values(landPrices)
    .map(x => x.price)
    .filter(p => p > 0);
  if (vals.length === 0) return AICHI_PRICE_BUCKETS;
  const maxP = Math.max(...vals);
  return maxP >= 2_000_000 ? TOKYO_PRICE_BUCKETS : AICHI_PRICE_BUCKETS;
}

function buildRisk(
  earthquake: EarthquakeRecord[],
  floodByCity: Record<string, number>,
): Record<string, { flood: number; earthquake: string; overall: number }> {
  const out: Record<string, { flood: number; earthquake: string; overall: number }> = {};
  for (const eq of earthquake) {
    const city = eq.city?.trim();
    if (!city) continue;
    const flood = floodByCity[city] ?? 35;
    out[city] = {
      flood,
      earthquake: eq.max_intensity,
      overall: overallRiskScore(eq, flood),
    };
  }
  return out;
}

function buildHumanFlow(records: HumanFlowRecord[]): UiPrefectureConfig['humanFlow'] {
  const byCity = new Map<string, HumanFlowRecord[]>();
  for (const r of records) {
    const c = r.city?.trim();
    if (!c) continue;
    let list = byCity.get(c);
    if (!list) {
      list = [];
      byCity.set(c, list);
    }
    list.push(r);
  }
  const out: UiPrefectureConfig['humanFlow'] = {};
  for (const [city, rows] of byCity) {
    const weekday = Math.round(rows.reduce((s, x) => s + (x.weekday_avg_flow ?? 0), 0));
    const weekend = Math.round(rows.reduce((s, x) => s + (x.weekend_avg_flow ?? 0), 0));
    const stay = Math.round(rows.reduce((s, x) => s + (x.avg_stay_minutes ?? 0), 0) / rows.length);
    const trends = rows.map(x => x.flow_trend).filter(
      (t): t is NonNullable<HumanFlowRecord['flow_trend']> =>
        t === 'increasing' || t === 'stable' || t === 'decreasing',
    );
    let trend: string = 'stable';
    if (trends.includes('increasing')) trend = 'increasing';
    else if (trends.includes('decreasing')) trend = 'decreasing';
    out[city] = { weekday, weekend, stay, trend };
  }
  return out;
}

function buildSchool(records: SchoolDistrictRecord[]): UiPrefectureConfig['school'] {
  const agg = new Map<string, { score: number; advancement: number }>();
  for (const r of records) {
    const c = r.city?.trim();
    if (!c) continue;
    const prev = agg.get(c) ?? { score: 0, advancement: 0 };
    agg.set(c, {
      score: Math.max(prev.score, r.education_score ?? 0),
      advancement: Math.max(prev.advancement, r.university_advancement_rate ?? 0),
    });
  }
  return Object.fromEntries(agg);
}

function buildCorporate(records: CorporateLocationRecord[]): UiPrefectureConfig['corporate'] {
  const byCity = new Map<string, { establishments: number; major: number; employees: number }>();
  for (const r of records) {
    const c = r.city?.trim();
    if (!c) continue;
    const prev = byCity.get(c) ?? { establishments: 0, major: 0, employees: 0 };
    byCity.set(c, {
      establishments: prev.establishments + (r.total_establishments ?? 0),
      major: prev.major + (r.major_company_count ?? 0),
      employees: prev.employees + (r.employee_total ?? 0),
    });
  }
  return Object.fromEntries(byCity);
}

function buildPlateau(records: PlateauBuildingRecord[]): UiPrefectureConfig['plateau'] {
  return records.map(r => ({
    name: r.building_name,
    city: r.city,
    height: r.height_m,
    lat: r.lat,
    lng: r.lng,
  }));
}

function buildTransport(records: TransportRecord[]): UiPrefectureConfig['transport'] {
  const byCity = new Map<string, TransportRecord[]>();
  for (const r of records) {
    const c = r.city?.trim();
    if (!c) continue;
    let list = byCity.get(c);
    if (!list) {
      list = [];
      byCity.set(c, list);
    }
    list.push(r);
  }
  const out: UiPrefectureConfig['transport'] = {};
  for (const [city, rows] of byCity) {
    const stationKeys = new Set<string>();
    let passengers = 0;
    const lines = new Set<string>();
    for (const r of rows) {
      const sk = `${r.station_name ?? ''}\t${r.line ?? ''}`;
      if (!stationKeys.has(sk)) {
        stationKeys.add(sk);
        passengers += r.daily_passengers ?? 0;
      }
      if (r.line) lines.add(r.line);
    }
    out[city] = {
      stations: stationKeys.size,
      dailyPassengers: Math.round(passengers),
      lines: [...lines].sort(),
    };
  }
  return out;
}

function buildCommercial(records: CommercialFacilityRecord[]): UiPrefectureConfig['commercial'] {
  const byCity = new Map<string, CommercialFacilityRecord[]>();
  for (const r of records) {
    const c = r.city?.trim();
    if (!c) continue;
    let list = byCity.get(c);
    if (!list) {
      list = [];
      byCity.set(c, list);
    }
    list.push(r);
  }
  const out: UiPrefectureConfig['commercial'] = {};
  for (const [city, rows] of byCity) {
    let malls = 0;
    let cvs = 0;
    let gfa = 0;
    for (const r of rows) {
      if (r.type === 'mall' || r.type === 'sc') malls += 1;
      if (r.type === 'cvs') cvs += 1;
      gfa += r.gfa_sqm ?? 0;
    }
    out[city] = {
      facilities: rows.length,
      malls,
      cvs,
      totalGfa: Math.round(gfa),
    };
  }
  return out;
}

function buildMedical(records: MedicalFacilityRecord[]): UiPrefectureConfig['medical'] {
  const byCity = new Map<string, MedicalFacilityRecord[]>();
  for (const r of records) {
    const c = r.city?.trim();
    if (!c) continue;
    let list = byCity.get(c);
    if (!list) {
      list = [];
      byCity.set(c, list);
    }
    list.push(r);
  }
  const out: UiPrefectureConfig['medical'] = {};
  for (const [city, rows] of byCity) {
    let hospitals = 0;
    let beds = 0;
    for (const r of rows) {
      if (r.type === 'hospital') hospitals += 1;
      beds += r.beds ?? 0;
    }
    out[city] = {
      facilities: rows.length,
      hospitals,
      beds: Math.round(beds),
    };
  }
  return out;
}

function buildForLoader(loader: PrefectureLoader): UiPrefectureConfig {
  const pins = loader.getMunicipalityPins();
  const { center, zoom } = loader.getDefaultMapView();
  const landPrices = buildLandPricesByCity(loader.getLandPrices());
  const floodByCity = loadFloodByCity(loader.key);

  return {
    center,
    zoom,
    displayName: loader.displayName,
    capabilities: uiCapabilities(loader.capabilities),
    municipalities: pins,
    landPrices,
    priceBuckets: pickPriceBuckets(landPrices),
    risk: buildRisk(loader.getEarthquakeData(), floodByCity),
    humanFlow: capabilitiesOn(loader, 'humanFlow') ? buildHumanFlow(loader.getHumanFlow()) : {},
    school: capabilitiesOn(loader, 'education') ? buildSchool(loader.getSchoolDistricts()) : {},
    corporate: capabilitiesOn(loader, 'corporate') ? buildCorporate(loader.getCorporateLocations()) : {},
    plateau: capabilitiesOn(loader, 'plateau') ? buildPlateau(loader.getPlateauBuildings()) : [],
    transport: capabilitiesOn(loader, 'transport') ? buildTransport(loader.getTransport()) : {},
    commercial: capabilitiesOn(loader, 'commercial') ? buildCommercial(loader.getCommercialFacilities()) : {},
    medical: capabilitiesOn(loader, 'medical') ? buildMedical(loader.getMedicalFacilities()) : {},
  };
}

function capabilitiesOn(loader: PrefectureLoader, k: keyof LoaderCapabilities): boolean {
  return !!loader.capabilities[k];
}

function main(): void {
  mkdirSync(dirname(OUT), { recursive: true });
  const keys = listAvailable().sort();
  const json: Record<string, UiPrefectureConfig> = {};
  for (const key of keys) {
    json[key] = buildForLoader(getLoader(key));
  }
  writeFileSync(OUT, JSON.stringify(json, null, 2) + '\n', 'utf-8');
  console.log(`UI prefecture data → ${OUT} (${keys.length} prefectures)`);
}

main();
