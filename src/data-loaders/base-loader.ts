import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Papa from 'papaparse';
import * as topojsonClient from 'topojson-client';
import type { FeatureCollection } from 'geojson';
import type { PrefectureLoader, LoaderCapabilities, LatLng } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_ROOT = resolve(__dirname, '..', '..', 'data');

const cache = new Map<string, unknown>();

function memo<T>(key: string, loader: () => T): T {
  if (cache.has(key)) return cache.get(key) as T;
  const value = loader();
  cache.set(key, value);
  return value;
}

export abstract class BaseLoader implements PrefectureLoader {
  abstract readonly key: string;
  abstract readonly displayName: string;
  abstract readonly isoCode: string;
  abstract readonly capabilities: LoaderCapabilities;

  protected abstract readonly geocodeMap: Record<string, LatLng>;

  protected get dataDir(): string {
    return resolve(DATA_ROOT, this.key);
  }

  protected dataPath(filename: string): string {
    return resolve(this.dataDir, filename);
  }

  protected fileExists(filename: string): boolean {
    return existsSync(this.dataPath(filename));
  }

  protected loadCsv<T>(filename: string): T[] {
    return memo(`${this.key}:csv:${filename}`, () => {
      const path = this.dataPath(filename);
      if (!existsSync(path)) return [];
      const raw = readFileSync(path, 'utf-8').replace(/^\uFEFF/, '');
      const result = Papa.parse<T>(raw, { header: true, dynamicTyping: true, skipEmptyLines: true });
      return result.data;
    });
  }

  protected loadJson<T>(filename: string, fallback: T): T {
    return memo(`${this.key}:json:${filename}`, () => {
      const path = this.dataPath(filename);
      if (!existsSync(path)) return fallback;
      const raw = readFileSync(path, 'utf-8').replace(/^\uFEFF/, '');
      return JSON.parse(raw) as T;
    });
  }

  protected loadGeoJson(filename: string): FeatureCollection {
    return this.loadJson<FeatureCollection>(filename, { type: 'FeatureCollection', features: [] });
  }

  protected loadTopoJson(filename: string, objectName: string): FeatureCollection {
    return memo(`${this.key}:topojson:${filename}:${objectName}`, () => {
      const path = this.dataPath(filename);
      if (!existsSync(path)) return { type: 'FeatureCollection' as const, features: [] };
      const raw = readFileSync(path, 'utf-8').replace(/^\uFEFF/, '');
      const topo = JSON.parse(raw);
      if (!topo.objects?.[objectName]) return { type: 'FeatureCollection' as const, features: [] };
      return topojsonClient.feature(topo, topo.objects[objectName]) as unknown as FeatureCollection;
    });
  }

  geocode(address: string): LatLng | undefined {
    for (const [key, value] of Object.entries(this.geocodeMap)) {
      if (address.includes(key)) return value;
    }
    return undefined;
  }

  reverseGeocode(lat: number, lng: number): string | undefined {
    let closest: string | undefined;
    let minDist = Infinity;
    for (const [key, value] of Object.entries(this.geocodeMap)) {
      const d = Math.hypot(value.lat - lat, value.lng - lng);
      if (d < minDist) {
        minDist = d;
        closest = key;
      }
    }
    return minDist < 0.15 ? closest : undefined;
  }

  abstract getLandPrices(): import('./types.js').LandPriceRecord[];
  abstract getTransactions(): import('./types.js').TransactionRecord[];
  abstract getPopulation(): import('./types.js').PopulationRecord[];
  abstract getEarthquakeData(): import('./types.js').EarthquakeRecord[];
  abstract getFloodZones(): FeatureCollection;
  abstract getLandslideZones(): FeatureCollection;
  abstract getMunicipalities(): FeatureCollection;
  abstract getHumanFlow(): import('./types.js').HumanFlowRecord[];
  abstract getSchoolDistricts(): import('./types.js').SchoolDistrictRecord[];
  abstract getCorporateLocations(): import('./types.js').CorporateLocationRecord[];
  abstract getCrimeStats(): import('./types.js').CrimeStatsRecord[];
  abstract getPlateauBuildings(): import('./types.js').PlateauBuildingRecord[];
  abstract getTransport(): import('./types.js').TransportRecord[];
  abstract getCommercialFacilities(): import('./types.js').CommercialFacilityRecord[];
  abstract getMedicalFacilities(): import('./types.js').MedicalFacilityRecord[];
  abstract getNeighborhoods(): import('./types.js').NeighborhoodRecord[];
}
