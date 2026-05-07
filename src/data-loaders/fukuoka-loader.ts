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

const FUKUOKA_GEOCODE: Record<string, LatLng> = {
  '福岡市中央区': { lat: 33.5902, lng: 130.3985 },
  '福岡市博多区': { lat: 33.5904, lng: 130.4200 },
  '福岡市東区':   { lat: 33.6183, lng: 130.4324 },
  '福岡市南区':   { lat: 33.5538, lng: 130.4180 },
  '福岡市西区':   { lat: 33.5831, lng: 130.3390 },
  '福岡市城南区': { lat: 33.5621, lng: 130.3731 },
  '福岡市早良区': { lat: 33.5696, lng: 130.3498 },
  '福岡市北九州市': { lat: 33.8834, lng: 130.8750 },
  '北九州市小倉北区': { lat: 33.8834, lng: 130.8750 },
  '北九州市小倉南区': { lat: 33.8501, lng: 130.8980 },
  '北九州市八幡西区': { lat: 33.8701, lng: 130.7980 },
  '北九州市八幡東区': { lat: 33.8650, lng: 130.8280 },
  '北九州市戸畑区': { lat: 33.8913, lng: 130.8238 },
  '北九州市若松区': { lat: 33.9042, lng: 130.8013 },
  '北九州市門司区': { lat: 33.9412, lng: 130.9681 },
  '久留米市': { lat: 33.3192, lng: 130.5081 },
  '春日市': { lat: 33.5341, lng: 130.4681 },
  '大野城市': { lat: 33.5351, lng: 130.4781 },
  '筑紫野市': { lat: 33.4912, lng: 130.5121 },
  '太宰府市': { lat: 33.5141, lng: 130.5321 },
  '福津市': { lat: 33.7751, lng: 130.4901 },
  '宗像市': { lat: 33.8051, lng: 130.5401 },
  '古賀市': { lat: 33.7251, lng: 130.4701 },
  '飯塚市': { lat: 33.6451, lng: 130.6921 },
  '福岡県': { lat: 33.6063, lng: 130.4183 },
};

const EMPTY_FC: FeatureCollection = { type: 'FeatureCollection', features: [] };

export class FukuokaLoader extends BaseLoader {
  readonly key = 'fukuoka';
  readonly displayName = '福岡県';
  readonly isoCode = 'JP-40';
  readonly capabilities: LoaderCapabilities = {
    transactions: true, humanFlow: true, education: true, corporate: true, crime: true, plateau: false,
    transport: true, commercial: true, medical: true, neighborhoods: true,
  };

  protected readonly geocodeMap = FUKUOKA_GEOCODE;

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
