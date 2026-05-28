import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Papa from 'papaparse';
import * as topojsonClient from 'topojson-client';
import type { FeatureCollection } from 'geojson';
import type {
  PrefectureLoader,
  LoaderCapabilities,
  LatLng,
  ZoningRecord,
  VacancyRecord,
  PopulationProjectionRecord,
  RosenkaRecord,
} from './types.js';

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
      const result = Papa.parse<T>(raw, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
      });
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

  getZoning(): ZoningRecord[] {
    return this.loadCsv('zoning.csv');
  }
  getVacancy(): VacancyRecord[] {
    return this.loadCsv('vacancy.csv');
  }
  getPopulationProjection(): PopulationProjectionRecord[] {
    return this.loadCsv('population_projection.csv');
  }
  getRosenka(): RosenkaRecord[] {
    return this.loadCsv('rosenka.csv');
  }

  getCities(): string[] {
    return Object.keys(this.geocodeMap).filter((k) => k !== this.displayName);
  }

  getMunicipalityPins(): Record<string, [number, number]> {
    const m: Record<string, [number, number]> = {};
    for (const [name, ll] of Object.entries(this.geocodeMap)) {
      if (name === this.displayName) continue;
      m[name] = [ll.lat, ll.lng];
    }
    return m;
  }

  getDefaultMapView(): { center: [number, number]; zoom: number } {
    const coords = Object.entries(this.geocodeMap)
      .filter(([k]) => k !== this.displayName)
      .map(([, ll]) => ll);
    if (coords.length === 0) return { center: [35.6812, 139.7671], zoom: 10 };
    let lat = 0;
    let lng = 0;
    for (const ll of coords) {
      lat += ll.lat;
      lng += ll.lng;
    }
    lat /= coords.length;
    lng /= coords.length;
    let maxSpan = 0;
    for (const ll of coords) {
      const span = Math.abs(ll.lat - lat) + Math.abs(ll.lng - lng);
      if (span > maxSpan) maxSpan = span;
    }
    const zoom =
      maxSpan > 0.55 ? 9 : maxSpan > 0.38 ? 10 : maxSpan > 0.24 ? 11 : maxSpan > 0.14 ? 12 : 13;
    return { center: [lat, lng], zoom };
  }
}
