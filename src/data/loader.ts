import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point as turfPoint } from '@turf/helpers';
import type { Feature, Geometry } from 'geojson';
import { getLoader } from '../data-loaders/index.js';
import { resolvePrefecture } from '../prefecture/resolver.js';

export type {
  LandPriceRecord,
  TransactionRecord,
  PopulationRecord,
  EarthquakeRecord,
  HumanFlowRecord,
  SchoolDistrictRecord,
  CorporateLocationRecord,
  CrimeStatsRecord,
  PlateauBuildingRecord,
} from '../data-loaders/types.js';

export function getLandPricesForCity(city: string, prefecture = 'aichi') {
  const loader = getLoader(resolvePrefecture(prefecture));
  return loader.getLandPrices().filter((r) => r.city.includes(city) || city.includes(r.city));
}

export function getTransactionsForCity(city: string, prefecture = 'aichi') {
  const loader = getLoader(resolvePrefecture(prefecture));
  return loader.getTransactions().filter((r) => r.city.includes(city) || city.includes(r.city));
}

export function getPopulationForCity(city: string, prefecture = 'aichi') {
  const loader = getLoader(resolvePrefecture(prefecture));
  return loader.getPopulation().find((r) => r.city.includes(city) || city.includes(r.city));
}

export function getPopulation(prefecture = 'aichi') {
  return getLoader(resolvePrefecture(prefecture)).getPopulation();
}

export function getEarthquakeForCity(city: string, prefecture = 'aichi') {
  const loader = getLoader(resolvePrefecture(prefecture));
  return loader.getEarthquakeData().find((r) => r.city.includes(city) || city.includes(r.city));
}

export function getFloodZones(prefecture = 'aichi') {
  return getLoader(resolvePrefecture(prefecture)).getFloodZones();
}

export function getLandslideZones(prefecture = 'aichi') {
  return getLoader(resolvePrefecture(prefecture)).getLandslideZones();
}

export function getMunicipalities(prefecture = 'aichi') {
  return getLoader(resolvePrefecture(prefecture)).getMunicipalities();
}

export function getLandPrices(prefecture = 'aichi') {
  return getLoader(resolvePrefecture(prefecture)).getLandPrices();
}

export function getTransactions(prefecture = 'aichi') {
  return getLoader(resolvePrefecture(prefecture)).getTransactions();
}

export function filterByPropertyType(
  records: import('../data-loaders/types.js').TransactionRecord[],
  propertyType: string,
) {
  if (propertyType === 'mixed') return records;
  return records.filter((r) => r.property_type === propertyType);
}

export function filterByTimeRange<T extends { year: number }>(
  records: T[],
  timeRange: '1y' | '3y' | '5y',
): T[] {
  const currentYear = new Date().getFullYear();
  const yearsBack = timeRange === '1y' ? 1 : timeRange === '3y' ? 3 : 5;
  const cutoff = currentYear - yearsBack;
  return records.filter((r) => r.year >= cutoff);
}

export function getFloodFeatureAtPoint(
  lat: number,
  lng: number,
  prefecture = 'aichi',
): Feature<Geometry> | undefined {
  const fc = getFloodZones(prefecture);
  const pt = turfPoint([lng, lat]);
  return fc.features.find((f: Feature<Geometry>) => {
    try {
      return booleanPointInPolygon(pt, f as any);
    } catch {
      return false;
    }
  });
}

export function getLandslideFeatureAtPoint(
  lat: number,
  lng: number,
  prefecture = 'aichi',
): Feature<Geometry> | undefined {
  const fc = getLandslideZones(prefecture);
  const pt = turfPoint([lng, lat]);
  return fc.features.find((f: Feature<Geometry>) => {
    try {
      return booleanPointInPolygon(pt, f as any);
    } catch {
      return false;
    }
  });
}

export function getHumanFlow(prefecture = 'aichi') {
  return getLoader(resolvePrefecture(prefecture)).getHumanFlow();
}

export function getHumanFlowForCity(city: string, prefecture = 'aichi') {
  return getHumanFlow(prefecture).filter((r) => r.city.includes(city) || city.includes(r.city));
}

export function getSchoolDistricts(prefecture = 'aichi') {
  return getLoader(resolvePrefecture(prefecture)).getSchoolDistricts();
}

export function getSchoolDistrictsForCity(city: string, prefecture = 'aichi') {
  return getSchoolDistricts(prefecture).filter(
    (r) => r.city.includes(city) || city.includes(r.city),
  );
}

export function getCorporateLocations(prefecture = 'aichi') {
  return getLoader(resolvePrefecture(prefecture)).getCorporateLocations();
}

export function getCorporateForCity(city: string, prefecture = 'aichi') {
  return getCorporateLocations(prefecture).filter(
    (r) => r.city.includes(city) || city.includes(r.city),
  );
}

export function getCrimeStats(prefecture = 'aichi') {
  return getLoader(resolvePrefecture(prefecture)).getCrimeStats();
}

export function getCrimeStatsForCity(city: string, prefecture = 'aichi') {
  return getCrimeStats(prefecture).find((r) => r.city.includes(city) || city.includes(r.city));
}

export function getPlateauBuildings(prefecture = 'aichi') {
  return getLoader(resolvePrefecture(prefecture)).getPlateauBuildings();
}

export function getPlateauBuildingsForCity(city: string, prefecture = 'aichi') {
  return getPlateauBuildings(prefecture).filter(
    (r) => r.city.includes(city) || city.includes(r.city),
  );
}
