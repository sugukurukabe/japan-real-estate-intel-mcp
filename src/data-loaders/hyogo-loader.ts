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

const HYOGO_GEOCODE: Record<string, LatLng> = {
  '神戸市中央区': { lat: 34.6913, lng: 135.1956 },
  '神戸市東灘区': { lat: 34.7201, lng: 135.2681 },
  '神戸市灘区':   { lat: 34.7201, lng: 135.2181 },
  '神戸市兵庫区': { lat: 34.6781, lng: 135.1681 },
  '神戸市長田区': { lat: 34.6581, lng: 135.1481 },
  '神戸市須磨区': { lat: 34.6281, lng: 135.1281 },
  '神戸市垂水区': { lat: 34.6181, lng: 135.0981 },
  '神戸市西区':   { lat: 34.6781, lng: 135.0481 },
  '神戸市北区':   { lat: 34.7681, lng: 135.1181 },
  '姫路市': { lat: 34.8394, lng: 134.6939 },
  '西宮市': { lat: 34.7381, lng: 135.3381 },
  '尼崎市': { lat: 34.7351, lng: 135.4061 },
  '明石市': { lat: 34.6551, lng: 134.9981 },
  '宝塚市': { lat: 34.7981, lng: 135.3581 },
  '伊丹市': { lat: 34.7781, lng: 135.4081 },
  '川西市': { lat: 34.8281, lng: 135.4181 },
  '芦屋市': { lat: 34.7281, lng: 135.3081 },
  '加古川市': { lat: 34.7551, lng: 134.8381 },
  '三田市': { lat: 34.8881, lng: 135.2281 },
  '洲本市': { lat: 34.3451, lng: 134.8951 },
  '豊岡市': { lat: 35.5481, lng: 134.8181 },
  '篠山市': { lat: 35.0751, lng: 135.2281 },
  '兵庫県': { lat: 34.6913, lng: 135.1956 },
};

const EMPTY_FC: FeatureCollection = { type: 'FeatureCollection', features: [] };

export class HyogoLoader extends BaseLoader {
  readonly key = 'hyogo';
  readonly displayName = '兵庫県';
  readonly isoCode = 'JP-28';
  readonly capabilities: LoaderCapabilities = {
    humanFlow: false, education: false, corporate: false, crime: false, plateau: false,
    transport: false, commercial: false, medical: false, neighborhoods: true,
  };

  protected readonly geocodeMap = HYOGO_GEOCODE;

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
