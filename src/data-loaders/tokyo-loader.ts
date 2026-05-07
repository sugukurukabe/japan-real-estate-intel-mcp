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

const TOKYO_GEOCODE: Record<string, LatLng> = {
  '千代田区': { lat: 35.6940, lng: 139.7536 },
  '中央区': { lat: 35.6709, lng: 139.7727 },
  '港区': { lat: 35.6585, lng: 139.7514 },
  '新宿区': { lat: 35.6938, lng: 139.7036 },
  '文京区': { lat: 35.7081, lng: 139.7521 },
  '台東区': { lat: 35.7126, lng: 139.7800 },
  '墨田区': { lat: 35.7108, lng: 139.8019 },
  '江東区': { lat: 35.6729, lng: 139.8171 },
  '品川区': { lat: 35.6092, lng: 139.7302 },
  '目黒区': { lat: 35.6414, lng: 139.6982 },
  '大田区': { lat: 35.5613, lng: 139.7160 },
  '世田谷区': { lat: 35.6462, lng: 139.6532 },
  '渋谷区': { lat: 35.6640, lng: 139.6982 },
  '中野区': { lat: 35.7077, lng: 139.6639 },
  '杉並区': { lat: 35.6995, lng: 139.6364 },
  '豊島区': { lat: 35.7264, lng: 139.7163 },
  '北区': { lat: 35.7527, lng: 139.7349 },
  '荒川区': { lat: 35.7359, lng: 139.7834 },
  '板橋区': { lat: 35.7516, lng: 139.7092 },
  '練馬区': { lat: 35.7355, lng: 139.6516 },
  '足立区': { lat: 35.7746, lng: 139.8044 },
  '葛飾区': { lat: 35.7432, lng: 139.8472 },
  '江戸川区': { lat: 35.7067, lng: 139.8683 },
  '東京都': { lat: 35.6812, lng: 139.7671 },
};

const EMPTY_FC: FeatureCollection = { type: 'FeatureCollection', features: [] };

export class TokyoLoader extends BaseLoader {
  readonly key = 'tokyo';
  readonly displayName = '東京都';
  readonly isoCode = 'JP-13';
  readonly capabilities: LoaderCapabilities = {
    humanFlow: true, education: true, corporate: true, crime: true, plateau: false,
    transport: true, commercial: true, medical: true, neighborhoods: true,
  };

  protected readonly geocodeMap = TOKYO_GEOCODE;

  getLandPrices(): LandPriceRecord[] { return this.loadCsv('land_price.csv'); }
  getTransactions(): TransactionRecord[] { return []; }
  getPopulation(): PopulationRecord[] { return this.loadCsv('population.csv'); }
  getEarthquakeData(): EarthquakeRecord[] { return this.loadJson('earthquake.json', []); }
  getFloodZones(): FeatureCollection { return this.loadGeoJson('flood.geojson'); }
  getLandslideZones(): FeatureCollection { return EMPTY_FC; }
  getMunicipalities(): FeatureCollection { return this.loadTopoJson('municipalities.topojson', 'municipalities'); }
  getHumanFlow(): HumanFlowRecord[] { return this.loadCsv('human_flow.csv'); }
  getSchoolDistricts(): SchoolDistrictRecord[] { return this.loadCsv('school_districts.csv'); }
  getCorporateLocations(): CorporateLocationRecord[] { return this.loadCsv('corporate_locations.csv'); }
  getCrimeStats(): CrimeStatsRecord[] { return this.loadCsv('crime_stats.csv'); }
  getPlateauBuildings(): PlateauBuildingRecord[] { return []; }
  getTransport(): TransportRecord[] { return this.loadCsv('transport_stations.csv'); }
  getCommercialFacilities(): CommercialFacilityRecord[] { return this.loadCsv('commercial_facilities.csv'); }
  getMedicalFacilities(): MedicalFacilityRecord[] { return this.loadCsv('medical_facilities.csv'); }
  getNeighborhoods(): NeighborhoodRecord[] { return this.loadCsv('neighborhoods.csv'); }
}
