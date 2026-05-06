import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Papa from 'papaparse';
import * as topojsonClient from 'topojson-client';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point as turfPoint } from '@turf/helpers';
import type { FeatureCollection, Feature, Geometry } from 'geojson';

interface Topology {
  type: 'Topology';
  objects: Record<string, any>;
  arcs: number[][][];
  transform?: { scale: [number, number]; translate: [number, number] };
  [key: string]: unknown;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '..', '..', 'data');

function dataPath(name: string): string {
  return resolve(DATA_DIR, name);
}

// ── Memoization ──

const cache = new Map<string, unknown>();

function memo<T>(key: string, loader: () => T): T {
  if (cache.has(key)) return cache.get(key) as T;
  const value = loader();
  cache.set(key, value);
  return value;
}

// ── CSV Loader ──

function loadCsv<T>(filename: string): T[] {
  return memo(`csv:${filename}`, () => {
    const raw = readFileSync(dataPath(filename), 'utf-8');
    const result = Papa.parse<T>(raw, { header: true, dynamicTyping: true, skipEmptyLines: true });
    return result.data;
  });
}

// ── JSON Loader ──

function loadJson<T>(filename: string): T {
  return memo(`json:${filename}`, () => {
    const raw = readFileSync(dataPath(filename), 'utf-8');
    return JSON.parse(raw) as T;
  });
}

// ── GeoJSON Loader ──

function loadGeoJson(filename: string): FeatureCollection {
  return loadJson<FeatureCollection>(filename);
}

// ── TopoJSON Loader ──

function loadTopoJson(filename: string, objectName: string): FeatureCollection {
  return memo(`topojson:${filename}:${objectName}`, () => {
    const topo = loadJson<any>(filename);
    return topojsonClient.feature(topo, topo.objects[objectName]) as unknown as FeatureCollection;
  });
}

function loadTopoJsonRaw(filename: string): Topology {
  return loadJson<Topology>(filename);
}

// ── Domain Types ──

export interface LandPriceRecord {
  year: number;
  city: string;
  district: string;
  address: string;
  land_use: string;
  price_per_sqm: number;
  change_rate: number;
  lat: number;
  lng: number;
}

export interface TransactionRecord {
  year: number;
  quarter: number;
  city: string;
  district: string;
  property_type: string;
  area_sqm: number;
  price_total: number;
  price_per_sqm: number;
  building_year: number | null;
  structure: string;
  use: string;
}

export interface PopulationRecord {
  city: string;
  population_2020: number;
  population_2025: number;
  households_2020: number;
  households_2025: number;
  density_per_sqkm: number;
  aging_rate: number;
}

export interface EarthquakeRecord {
  city: string;
  max_intensity: string;
  probability_30y: number;
  liquefaction_risk: 'low' | 'medium' | 'high';
  description: string;
}

// ── Public API ──

export function getLandPrices(): LandPriceRecord[] {
  return loadCsv<LandPriceRecord>('land_price_aichi.csv');
}

export function getTransactions(): TransactionRecord[] {
  return loadCsv<TransactionRecord>('transactions_aichi.csv');
}

export function getPopulation(): PopulationRecord[] {
  return loadCsv<PopulationRecord>('population_aichi.csv');
}

export function getEarthquakeData(): EarthquakeRecord[] {
  return loadJson<EarthquakeRecord[]>('earthquake_aichi.json');
}

export function getFloodZones(): FeatureCollection {
  return loadGeoJson('flood_aichi.geojson');
}

export function getLandslideZones(): FeatureCollection {
  return loadGeoJson('landslide_aichi.geojson');
}

export function getMunicipalities(): FeatureCollection {
  return loadTopoJson('aichi_municipalities.topojson', 'municipalities');
}

export function getMunicipalitiesTopology(): Topology {
  return loadTopoJsonRaw('aichi_municipalities.topojson');
}

export function getLandPricesForCity(city: string): LandPriceRecord[] {
  return getLandPrices().filter((r) => r.city.includes(city) || city.includes(r.city));
}

export function getTransactionsForCity(city: string): TransactionRecord[] {
  return getTransactions().filter((r) => r.city.includes(city) || city.includes(r.city));
}

export function getPopulationForCity(city: string): PopulationRecord | undefined {
  return getPopulation().find((r) => r.city.includes(city) || city.includes(r.city));
}

export function getEarthquakeForCity(city: string): EarthquakeRecord | undefined {
  return getEarthquakeData().find((r) => r.city.includes(city) || city.includes(r.city));
}

export function filterByPropertyType(
  records: TransactionRecord[],
  propertyType: string,
): TransactionRecord[] {
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

export function getFloodFeatureAtPoint(lat: number, lng: number): Feature<Geometry> | undefined {
  const fc = getFloodZones();
  const pt = turfPoint([lng, lat]);
  return fc.features.find((f: Feature<Geometry>) => {
    try {
      return booleanPointInPolygon(pt, f as any);
    } catch {
      return false;
    }
  });
}

export function getLandslideFeatureAtPoint(lat: number, lng: number): Feature<Geometry> | undefined {
  const fc = getLandslideZones();
  const pt = turfPoint([lng, lat]);
  return fc.features.find((f: Feature<Geometry>) => {
    try {
      return booleanPointInPolygon(pt, f as any);
    } catch {
      return false;
    }
  });
}
