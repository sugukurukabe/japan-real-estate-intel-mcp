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

const KANAGAWA_GEOCODE: Record<string, LatLng> = {
  '横浜市西区':   { lat: 35.4648, lng: 139.6222 },
  '横浜市中区':   { lat: 35.4437, lng: 139.6380 },
  '横浜市神奈川区': { lat: 35.4801, lng: 139.6298 },
  '横浜市港北区': { lat: 35.5076, lng: 139.6251 },
  '横浜市都筑区': { lat: 35.5432, lng: 139.5812 },
  '横浜市青葉区': { lat: 35.5601, lng: 139.5398 },
  '横浜市鶴見区': { lat: 35.5081, lng: 139.6781 },
  '横浜市保土ケ谷区': { lat: 35.4512, lng: 139.5882 },
  '横浜市旭区':   { lat: 35.4651, lng: 139.5498 },
  '横浜市磯子区': { lat: 35.3981, lng: 139.6381 },
  '横浜市金沢区': { lat: 35.3801, lng: 139.6250 },
  '横浜市港南区': { lat: 35.3981, lng: 139.5981 },
  '横浜市南区':   { lat: 35.4198, lng: 139.6182 },
  '横浜市栄区':   { lat: 35.3781, lng: 139.5481 },
  '横浜市戸塚区': { lat: 35.4012, lng: 139.5381 },
  '横浜市泉区':   { lat: 35.4201, lng: 139.5051 },
  '横浜市瀬谷区': { lat: 35.4501, lng: 139.4981 },
  '横浜市緑区':   { lat: 35.5181, lng: 139.5681 },
  '川崎市川崎区': { lat: 35.5312, lng: 139.7021 },
  '川崎市幸区':   { lat: 35.5481, lng: 139.6721 },
  '川崎市中原区': { lat: 35.5678, lng: 139.6601 },
  '川崎市高津区': { lat: 35.5812, lng: 139.6201 },
  '川崎市宮前区': { lat: 35.5781, lng: 139.5721 },
  '川崎市多摩区': { lat: 35.5981, lng: 139.5481 },
  '川崎市麻生区': { lat: 35.6081, lng: 139.5121 },
  '相模原市中央区': { lat: 35.5712, lng: 139.3731 },
  '相模原市南区': { lat: 35.5198, lng: 139.3781 },
  '相模原市緑区': { lat: 35.6181, lng: 139.3551 },
  '藤沢市': { lat: 35.3378, lng: 139.4890 },
  '平塚市': { lat: 35.3281, lng: 139.3498 },
  '小田原市': { lat: 35.2651, lng: 139.1552 },
  '茅ヶ崎市': { lat: 35.3322, lng: 139.4050 },
  '厚木市': { lat: 35.4433, lng: 139.3613 },
  '大和市': { lat: 35.4891, lng: 139.4612 },
  '海老名市': { lat: 35.4479, lng: 139.3912 },
  '座間市': { lat: 35.4883, lng: 139.4081 },
  '綾瀬市': { lat: 35.4352, lng: 139.4312 },
  '神奈川県': { lat: 35.4478, lng: 139.6425 },
};

const EMPTY_FC: FeatureCollection = { type: 'FeatureCollection', features: [] };

export class KanagawaLoader extends BaseLoader {
  readonly key = 'kanagawa';
  readonly displayName = '神奈川県';
  readonly isoCode = 'JP-14';
  readonly capabilities: LoaderCapabilities = {
    transactions: true, humanFlow: true, education: true, corporate: true, crime: true, plateau: false,
    transport: true, commercial: true, medical: true, neighborhoods: true,
    zoning: true, vacancy: true, populationProjection: true, rosenka: true,
  };

  protected readonly geocodeMap = KANAGAWA_GEOCODE;

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
