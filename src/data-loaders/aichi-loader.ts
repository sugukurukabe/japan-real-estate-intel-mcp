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

const AICHI_GEOCODE: Record<string, LatLng> = {
  '名古屋市中村区': { lat: 35.1709, lng: 136.8716 },
  '名古屋市中区': { lat: 35.1709, lng: 136.9066 },
  '名古屋市東区': { lat: 35.1815, lng: 136.9274 },
  '名古屋市千種区': { lat: 35.1676, lng: 136.9486 },
  '名古屋市名東区': { lat: 35.1825, lng: 136.9906 },
  '名古屋市緑区': { lat: 35.0734, lng: 136.9539 },
  '名古屋市港区': { lat: 35.0828, lng: 136.8472 },
  '名古屋市昭和区': { lat: 35.1509, lng: 136.9331 },
  '名古屋市天白区': { lat: 35.1204, lng: 136.9680 },
  '名古屋市瑞穂区': { lat: 35.1333, lng: 136.9347 },
  '名古屋市熱田区': { lat: 35.1268, lng: 136.9039 },
  '名古屋市中川区': { lat: 35.1338, lng: 136.8538 },
  '名古屋市北区': { lat: 35.1985, lng: 136.9195 },
  '名古屋市西区': { lat: 35.1887, lng: 136.8753 },
  '名古屋市南区': { lat: 35.0984, lng: 136.9104 },
  '名古屋市守山区': { lat: 35.2154, lng: 136.9688 },
  '名古屋市': { lat: 35.1815, lng: 136.9066 },
  '豊田市': { lat: 35.0833, lng: 137.1557 },
  '岡崎市': { lat: 34.9552, lng: 137.1733 },
  '一宮市': { lat: 35.3015, lng: 136.8030 },
  '春日井市': { lat: 35.2512, lng: 136.9722 },
  '豊橋市': { lat: 34.7694, lng: 137.3916 },
  '安城市': { lat: 34.9587, lng: 137.0778 },
  '刈谷市': { lat: 34.9891, lng: 137.0042 },
  '小牧市': { lat: 35.2917, lng: 136.9222 },
  '瀬戸市': { lat: 35.2255, lng: 137.0803 },
  '半田市': { lat: 34.8893, lng: 136.9381 },
  '津島市': { lat: 35.1729, lng: 136.7407 },
  '碧南市': { lat: 34.8835, lng: 136.9906 },
  '犬山市': { lat: 35.3786, lng: 136.9433 },
  '常滑市': { lat: 34.8920, lng: 136.8370 },
  '江南市': { lat: 35.3319, lng: 136.8694 },
  '大府市': { lat: 35.0100, lng: 136.9622 },
  '知多市': { lat: 35.0112, lng: 136.8652 },
  '知立市': { lat: 35.0015, lng: 137.0497 },
  '尾張旭市': { lat: 35.2188, lng: 137.0349 },
  '豊明市': { lat: 35.0534, lng: 137.0095 },
  '日進市': { lat: 35.1305, lng: 137.0372 },
  '蒲郡市': { lat: 34.8268, lng: 137.2180 },
  '西尾市': { lat: 34.8642, lng: 137.0612 },
  '新城市': { lat: 34.9097, lng: 137.4980 },
};

export class AichiLoader extends BaseLoader {
  readonly key = 'aichi';
  readonly displayName = '愛知県';
  readonly isoCode = 'JP-23';
  readonly capabilities: LoaderCapabilities = {
    humanFlow: true, education: true, corporate: true, crime: true, plateau: true,
    transport: true, commercial: true, medical: true, neighborhoods: true,
  };

  protected readonly geocodeMap = AICHI_GEOCODE;

  getLandPrices(): LandPriceRecord[] { return this.loadCsv('land_price.csv'); }
  getTransactions(): TransactionRecord[] { return this.loadCsv('transactions.csv'); }
  getPopulation(): PopulationRecord[] { return this.loadCsv('population.csv'); }
  getEarthquakeData(): EarthquakeRecord[] { return this.loadJson('earthquake.json', []); }
  getFloodZones(): FeatureCollection { return this.loadGeoJson('flood.geojson'); }
  getLandslideZones(): FeatureCollection { return this.loadGeoJson('landslide.geojson'); }
  getMunicipalities(): FeatureCollection { return this.loadTopoJson('municipalities.topojson', 'municipalities'); }
  getHumanFlow(): HumanFlowRecord[] { return this.loadCsv('human_flow.csv'); }
  getSchoolDistricts(): SchoolDistrictRecord[] { return this.loadCsv('school_districts.csv'); }
  getCorporateLocations(): CorporateLocationRecord[] { return this.loadCsv('corporate_locations.csv'); }
  getCrimeStats(): CrimeStatsRecord[] { return this.loadCsv('crime_stats.csv'); }
  getPlateauBuildings(): PlateauBuildingRecord[] { return this.loadJson('plateau_buildings.json', []); }
  getTransport(): TransportRecord[] { return this.loadCsv('transport_stations.csv'); }
  getCommercialFacilities(): CommercialFacilityRecord[] { return this.loadCsv('commercial_facilities.csv'); }
  getMedicalFacilities(): MedicalFacilityRecord[] { return this.loadCsv('medical_facilities.csv'); }
  getNeighborhoods(): NeighborhoodRecord[] { return this.loadCsv('neighborhoods.csv'); }
}
