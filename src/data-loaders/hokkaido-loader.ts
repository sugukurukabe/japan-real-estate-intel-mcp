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

const HOKKAIDO_GEOCODE: Record<string, LatLng> = {
  '札幌市中央区': { lat: 43.0618, lng: 141.3545 },
  '札幌市北区':   { lat: 43.0921, lng: 141.3412 },
  '札幌市東区':   { lat: 43.0821, lng: 141.3812 },
  '札幌市白石区': { lat: 43.0521, lng: 141.3981 },
  '札幌市豊平区': { lat: 43.0321, lng: 141.3812 },
  '札幌市南区':   { lat: 42.9821, lng: 141.3412 },
  '札幌市西区':   { lat: 43.0721, lng: 141.3012 },
  '札幌市厚別区': { lat: 43.0421, lng: 141.4381 },
  '札幌市手稲区': { lat: 43.1121, lng: 141.2512 },
  '札幌市清田区': { lat: 42.9921, lng: 141.4181 },
  '函館市': { lat: 41.7688, lng: 140.7290 },
  '旭川市': { lat: 43.7706, lng: 142.3651 },
  '小樽市': { lat: 43.1907, lng: 140.9947 },
  '釧路市': { lat: 42.9849, lng: 144.3820 },
  '帯広市': { lat: 42.9237, lng: 143.1965 },
  '北見市': { lat: 43.8031, lng: 143.8956 },
  '苫小牧市': { lat: 42.6326, lng: 141.6047 },
  '室蘭市': { lat: 42.3151, lng: 140.9739 },
  '江別市': { lat: 43.1035, lng: 141.5432 },
  '千歳市': { lat: 42.8240, lng: 141.6518 },
  '恵庭市': { lat: 42.8812, lng: 141.5791 },
  '石狩市': { lat: 43.1682, lng: 141.3412 },
  '北広島市': { lat: 42.9812, lng: 141.5612 },
  '北海道': { lat: 43.0646, lng: 141.3468 },
};

const EMPTY_FC: FeatureCollection = { type: 'FeatureCollection', features: [] };

export class HokkaidoLoader extends BaseLoader {
  readonly key = 'hokkaido';
  readonly displayName = '北海道';
  readonly isoCode = 'JP-01';
  readonly capabilities: LoaderCapabilities = {
    humanFlow: false, education: false, corporate: false, crime: false, plateau: false,
    transport: false, commercial: false, medical: false, neighborhoods: true,
  };

  protected readonly geocodeMap = HOKKAIDO_GEOCODE;

  getLandPrices(): LandPriceRecord[]       { return this.loadCsv('land_price.csv'); }
  getTransactions(): TransactionRecord[]    { return []; }
  getPopulation(): PopulationRecord[]       { return this.loadCsv('population.csv'); }
  getEarthquakeData(): EarthquakeRecord[]   { return this.loadJson('earthquake.json', []); }
  getFloodZones(): FeatureCollection        { return this.loadGeoJson('flood.geojson'); }
  getLandslideZones(): FeatureCollection    { return EMPTY_FC; }
  getMunicipalities(): FeatureCollection    { return this.loadTopoJson('municipalities.topojson', 'municipalities'); }
  getHumanFlow(): HumanFlowRecord[]         { return []; }
  getSchoolDistricts(): SchoolDistrictRecord[]     { return []; }
  getCorporateLocations(): CorporateLocationRecord[] { return []; }
  getCrimeStats(): CrimeStatsRecord[]       { return []; }
  getPlateauBuildings(): PlateauBuildingRecord[]   { return []; }
  getTransport(): TransportRecord[]         { return []; }
  getCommercialFacilities(): CommercialFacilityRecord[] { return []; }
  getMedicalFacilities(): MedicalFacilityRecord[]  { return []; }
  getNeighborhoods(): NeighborhoodRecord[]  { return this.loadCsv('neighborhoods.csv'); }
}
