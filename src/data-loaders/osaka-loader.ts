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

const OSAKA_GEOCODE: Record<string, LatLng> = {
  '中央区': { lat: 34.6723, lng: 135.5013 },
  '北区': { lat: 34.7024, lng: 135.4983 },
  '浪速区': { lat: 34.6625, lng: 135.5012 },
  '天王寺区': { lat: 34.6530, lng: 135.5187 },
  '阿倍野区': { lat: 34.6346, lng: 135.5142 },
  '西区': { lat: 34.6781, lng: 135.4901 },
  '福島区': { lat: 34.6941, lng: 135.4832 },
  '都島区': { lat: 34.7108, lng: 135.5201 },
  '淀川区': { lat: 34.7321, lng: 135.5001 },
  '東淀川区': { lat: 34.7489, lng: 135.5231 },
  '西淀川区': { lat: 34.7012, lng: 135.4521 },
  '此花区': { lat: 34.6812, lng: 135.4321 },
  '港区': { lat: 34.6589, lng: 135.4601 },
  '大正区': { lat: 34.6451, lng: 135.4712 },
  '住之江区': { lat: 34.6112, lng: 135.4832 },
  '住吉区': { lat: 34.6123, lng: 135.5067 },
  '東住吉区': { lat: 34.6198, lng: 135.5312 },
  '平野区': { lat: 34.6212, lng: 135.5567 },
  '生野区': { lat: 34.6512, lng: 135.5321 },
  '城東区': { lat: 34.6912, lng: 135.5412 },
  '鶴見区': { lat: 34.7012, lng: 135.5621 },
  '旭区': { lat: 34.7189, lng: 135.5412 },
  '東成区': { lat: 34.6689, lng: 135.5312 },
  '西成区': { lat: 34.6312, lng: 135.4912 },
  '堺市堺区': { lat: 34.5731, lng: 135.4834 },
  '堺市中区': { lat: 34.5381, lng: 135.5051 },
  '堺市北区': { lat: 34.5621, lng: 135.5123 },
  '堺市南区': { lat: 34.4891, lng: 135.4912 },
  '東大阪市': { lat: 34.6782, lng: 135.5912 },
  '豊中市': { lat: 34.7812, lng: 135.4701 },
  '吹田市': { lat: 34.7621, lng: 135.4921 },
  '高槻市': { lat: 34.8480, lng: 135.6173 },
  '枚方市': { lat: 34.8143, lng: 135.6512 },
  '大阪府': { lat: 34.6863, lng: 135.5200 },
};

const EMPTY_FC: FeatureCollection = { type: 'FeatureCollection', features: [] };

export class OsakaLoader extends BaseLoader {
  readonly key = 'osaka';
  readonly displayName = '大阪府';
  readonly isoCode = 'JP-27';
  readonly capabilities: LoaderCapabilities = {
    humanFlow: false, education: false, corporate: false, crime: false, plateau: false,
    transport: true, commercial: true, medical: true, neighborhoods: true,
  };

  protected readonly geocodeMap = OSAKA_GEOCODE;

  getLandPrices(): LandPriceRecord[] { return this.loadCsv('land_price.csv'); }
  getTransactions(): TransactionRecord[] { return []; }
  getPopulation(): PopulationRecord[] { return this.loadCsv('population.csv'); }
  getEarthquakeData(): EarthquakeRecord[] { return this.loadJson('earthquake.json', []); }
  getFloodZones(): FeatureCollection { return this.loadGeoJson('flood.geojson'); }
  getLandslideZones(): FeatureCollection { return EMPTY_FC; }
  getMunicipalities(): FeatureCollection { return this.loadTopoJson('municipalities.topojson', 'municipalities'); }
  getHumanFlow(): HumanFlowRecord[] { return []; }
  getSchoolDistricts(): SchoolDistrictRecord[] { return []; }
  getCorporateLocations(): CorporateLocationRecord[] { return []; }
  getCrimeStats(): CrimeStatsRecord[] { return []; }
  getPlateauBuildings(): PlateauBuildingRecord[] { return []; }
  getTransport(): TransportRecord[] { return this.loadCsv('transport_stations.csv'); }
  getCommercialFacilities(): CommercialFacilityRecord[] { return this.loadCsv('commercial_facilities.csv'); }
  getMedicalFacilities(): MedicalFacilityRecord[] { return this.loadCsv('medical_facilities.csv'); }
  getNeighborhoods(): NeighborhoodRecord[] { return this.loadCsv('neighborhoods.csv'); }
}
