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

const KYOTO_GEOCODE: Record<string, LatLng> = {
  '京都市中京区': { lat: 35.0116, lng: 135.7681 },
  '京都市下京区': { lat: 34.9886, lng: 135.7581 },
  '京都市上京区': { lat: 35.0281, lng: 135.7581 },
  '京都市東山区': { lat: 34.9981, lng: 135.7821 },
  '京都市左京区': { lat: 35.0421, lng: 135.7821 },
  '京都市右京区': { lat: 35.0121, lng: 135.7181 },
  '京都市伏見区': { lat: 34.9381, lng: 135.7681 },
  '京都市南区':   { lat: 34.9781, lng: 135.7481 },
  '京都市北区':   { lat: 35.0681, lng: 135.7481 },
  '京都市西京区': { lat: 34.9981, lng: 135.6981 },
  '京都市山科区': { lat: 34.9881, lng: 135.8181 },
  '宇治市': { lat: 34.8848, lng: 135.7981 },
  '長岡京市': { lat: 34.9251, lng: 135.6881 },
  '京田辺市': { lat: 34.8151, lng: 135.7681 },
  '亀岡市': { lat: 35.0051, lng: 135.5781 },
  '向日市': { lat: 34.9451, lng: 135.6981 },
  '木津川市': { lat: 34.7651, lng: 135.8081 },
  '舞鶴市': { lat: 35.4751, lng: 135.3781 },
  '福知山市': { lat: 35.2951, lng: 135.1181 },
  '京丹後市': { lat: 35.6251, lng: 134.8781 },
  '綾部市': { lat: 35.3051, lng: 135.2181 },
  '京都府': { lat: 35.0116, lng: 135.7681 },
};

const EMPTY_FC: FeatureCollection = { type: 'FeatureCollection', features: [] };

export class KyotoLoader extends BaseLoader {
  readonly key = 'kyoto';
  readonly displayName = '京都府';
  readonly isoCode = 'JP-26';
  readonly capabilities: LoaderCapabilities = {
    humanFlow: true, education: true, corporate: true, crime: true, plateau: false,
    transport: true, commercial: true, medical: true, neighborhoods: true,
  };

  protected readonly geocodeMap = KYOTO_GEOCODE;

  getLandPrices(): LandPriceRecord[]       { return this.loadCsv('land_price.csv'); }
  getTransactions(): TransactionRecord[]    { return this.loadCsv('transactions.csv'); }
  getPopulation(): PopulationRecord[]       { return this.loadCsv('population.csv'); }
  getEarthquakeData(): EarthquakeRecord[]   { return this.loadJson('earthquake.json', []); }
  getFloodZones(): FeatureCollection        { return this.loadGeoJson('flood.geojson'); }
  getLandslideZones(): FeatureCollection    { return EMPTY_FC; }
  getMunicipalities(): FeatureCollection    { return this.loadTopoJson('municipalities.topojson', 'municipalities'); }
  getHumanFlow(): HumanFlowRecord[]         { return this.loadCsv('human_flow.csv'); }
  getSchoolDistricts(): SchoolDistrictRecord[]     { return this.loadCsv('school_districts.csv'); }
  getCorporateLocations(): CorporateLocationRecord[] { return this.loadCsv('corporate_locations.csv'); }
  getCrimeStats(): CrimeStatsRecord[]       { return this.loadCsv('crime_stats.csv'); }
  getPlateauBuildings(): PlateauBuildingRecord[]   { return []; }
  getTransport(): TransportRecord[]         { return this.loadCsv('transport_stations.csv'); }
  getCommercialFacilities(): CommercialFacilityRecord[] { return this.loadCsv('commercial_facilities.csv'); }
  getMedicalFacilities(): MedicalFacilityRecord[]  { return this.loadCsv('medical_facilities.csv'); }
  getNeighborhoods(): NeighborhoodRecord[]  { return this.loadCsv('neighborhoods.csv'); }
}
