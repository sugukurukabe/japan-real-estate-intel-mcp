import type { FeatureCollection } from 'geojson';
import { BaseLoader } from './base-loader.js';
import type {
  LoaderCapabilities, LatLng,
  LandPriceRecord, TransactionRecord, PopulationRecord, EarthquakeRecord,
  HumanFlowRecord, SchoolDistrictRecord, CorporateLocationRecord,
  CrimeStatsRecord, PlateauBuildingRecord,
  TransportRecord, CommercialFacilityRecord, MedicalFacilityRecord,
  NeighborhoodRecord,
} from './types.js';

const CHIBA_GEOCODE: Record<string, LatLng> = {
  '千葉市中央区': { lat: 35.6073, lng: 140.1063 },
  '千葉市花見川区': { lat: 35.6573, lng: 140.0613 },
  '千葉市稲毛区': { lat: 35.6473, lng: 140.0963 },
  '千葉市若葉区': { lat: 35.6173, lng: 140.1563 },
  '千葉市緑区':   { lat: 35.5373, lng: 140.1463 },
  '千葉市美浜区': { lat: 35.6473, lng: 140.0463 },
  '千葉市':       { lat: 35.6073, lng: 140.1063 },
  '船橋市':       { lat: 35.6943, lng: 139.9823 },
  '松戸市':       { lat: 35.7882, lng: 139.9024 },
  '柏市':         { lat: 35.8681, lng: 139.9758 },
  '市川市':       { lat: 35.7220, lng: 139.9308 },
  '浦安市':       { lat: 35.6510, lng: 139.9037 },
  '成田市':       { lat: 35.7776, lng: 140.3185 },
  '木更津市':     { lat: 35.3764, lng: 139.9261 },
  '市原市':       { lat: 35.4974, lng: 140.1031 },
  '流山市':       { lat: 35.8558, lng: 139.9044 },
  '八千代市':     { lat: 35.7228, lng: 140.1018 },
  '我孫子市':     { lat: 35.8671, lng: 140.0280 },
  '鎌ヶ谷市':     { lat: 35.7786, lng: 140.0012 },
  '君津市':       { lat: 35.3314, lng: 139.8928 },
  '千葉県':       { lat: 35.6047, lng: 140.1233 },
};

const EMPTY_FC: FeatureCollection = { type: 'FeatureCollection', features: [] };

export class ChibaLoader extends BaseLoader {
  readonly key = 'chiba';
  readonly displayName = '千葉県';
  readonly isoCode = 'JP-12';
  readonly capabilities: LoaderCapabilities = {
    transactions: true, humanFlow: true, education: true, corporate: true, crime: true, plateau: false,
    transport: true, commercial: true, medical: true, neighborhoods: true,
  };

  protected readonly geocodeMap = CHIBA_GEOCODE;

  getLandPrices(): LandPriceRecord[]             { return this.loadCsv('land_price.csv'); }
  getTransactions(): TransactionRecord[]          { return this.loadCsv('transactions.csv'); }
  getPopulation(): PopulationRecord[]             { return this.loadCsv('population.csv'); }
  getEarthquakeData(): EarthquakeRecord[]         { return this.loadJson('earthquake.json', []); }
  getFloodZones(): FeatureCollection              { return this.loadGeoJson('flood.geojson'); }
  getLandslideZones(): FeatureCollection          { return EMPTY_FC; }
  getMunicipalities(): FeatureCollection          { return this.loadTopoJson('municipalities.topojson', 'municipalities'); }
  getHumanFlow(): HumanFlowRecord[]               { return this.loadCsv('human_flow.csv'); }
  getSchoolDistricts(): SchoolDistrictRecord[]    { return this.loadCsv('school_districts.csv'); }
  getCorporateLocations(): CorporateLocationRecord[] { return this.loadCsv('corporate_locations.csv'); }
  getCrimeStats(): CrimeStatsRecord[]             { return this.loadCsv('crime_stats.csv'); }
  getPlateauBuildings(): PlateauBuildingRecord[]  { return []; }
  getTransport(): TransportRecord[]               { return this.loadCsv('transport_stations.csv'); }
  getCommercialFacilities(): CommercialFacilityRecord[] { return this.loadCsv('commercial_facilities.csv'); }
  getMedicalFacilities(): MedicalFacilityRecord[] { return this.loadCsv('medical_facilities.csv'); }
  getNeighborhoods(): NeighborhoodRecord[]        { return this.loadCsv('neighborhoods.csv'); }
}
