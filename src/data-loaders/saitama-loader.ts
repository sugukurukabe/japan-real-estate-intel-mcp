import type { FeatureCollection } from 'geojson';
import { BaseLoader } from './base-loader.js';
import type {
  LoaderCapabilities,
  LatLng,
  LandPriceRecord,
  TransactionRecord,
  PopulationRecord,
  EarthquakeRecord,
  HumanFlowRecord,
  SchoolDistrictRecord,
  CorporateLocationRecord,
  CrimeStatsRecord,
  PlateauBuildingRecord,
  TransportRecord,
  CommercialFacilityRecord,
  MedicalFacilityRecord,
  NeighborhoodRecord,
} from './types.js';

const SAITAMA_GEOCODE: Record<string, LatLng> = {
  さいたま市大宮区: { lat: 35.9062, lng: 139.6233 },
  さいたま市浦和区: { lat: 35.8617, lng: 139.6455 },
  さいたま市中央区: { lat: 35.8912, lng: 139.6302 },
  さいたま市西区: { lat: 35.9112, lng: 139.5682 },
  さいたま市北区: { lat: 35.9312, lng: 139.6282 },
  さいたま市見沼区: { lat: 35.9212, lng: 139.6682 },
  さいたま市緑区: { lat: 35.8712, lng: 139.6882 },
  さいたま市桜区: { lat: 35.8712, lng: 139.6082 },
  さいたま市南区: { lat: 35.8412, lng: 139.6482 },
  さいたま市岩槻区: { lat: 35.9512, lng: 139.7082 },
  さいたま市: { lat: 35.8617, lng: 139.6455 },
  川越市: { lat: 35.9252, lng: 139.4858 },
  熊谷市: { lat: 36.1477, lng: 139.3888 },
  川口市: { lat: 35.8067, lng: 139.7227 },
  所沢市: { lat: 35.7999, lng: 139.4686 },
  越谷市: { lat: 35.8901, lng: 139.7907 },
  草加市: { lat: 35.8279, lng: 139.8062 },
  春日部市: { lat: 35.975, lng: 139.7526 },
  上尾市: { lat: 35.9773, lng: 139.5942 },
  朝霞市: { lat: 35.7973, lng: 139.5936 },
  志木市: { lat: 35.8344, lng: 139.5769 },
  和光市: { lat: 35.7787, lng: 139.6064 },
  新座市: { lat: 35.7932, lng: 139.5231 },
  埼玉県: { lat: 35.8617, lng: 139.6455 },
};

const EMPTY_FC: FeatureCollection = { type: 'FeatureCollection', features: [] };

export class SaitamaLoader extends BaseLoader {
  readonly key = 'saitama';
  readonly displayName = '埼玉県';
  readonly isoCode = 'JP-11';
  readonly capabilities: LoaderCapabilities = {
    transactions: true,
    humanFlow: true,
    education: true,
    corporate: true,
    crime: true,
    plateau: false,
    transport: true,
    commercial: true,
    medical: true,
    neighborhoods: true,
    zoning: true,
    vacancy: true,
    populationProjection: true,
    rosenka: true,
  };

  protected readonly geocodeMap = SAITAMA_GEOCODE;

  getLandPrices(): LandPriceRecord[] {
    return this.loadCsv('land_price.csv');
  }
  getTransactions(): TransactionRecord[] {
    return this.loadCsv('transactions.csv');
  }
  getPopulation(): PopulationRecord[] {
    return this.loadCsv('population.csv');
  }
  getEarthquakeData(): EarthquakeRecord[] {
    return this.loadJson('earthquake.json', []);
  }
  getFloodZones(): FeatureCollection {
    return this.loadGeoJson('flood.geojson');
  }
  getLandslideZones(): FeatureCollection {
    return EMPTY_FC;
  }
  getMunicipalities(): FeatureCollection {
    return this.loadTopoJson('municipalities.topojson', 'municipalities');
  }
  getHumanFlow(): HumanFlowRecord[] {
    return this.loadCsv('human_flow.csv');
  }
  getSchoolDistricts(): SchoolDistrictRecord[] {
    return this.loadCsv('school_districts.csv');
  }
  getCorporateLocations(): CorporateLocationRecord[] {
    return this.loadCsv('corporate_locations.csv');
  }
  getCrimeStats(): CrimeStatsRecord[] {
    return this.loadCsv('crime_stats.csv');
  }
  getPlateauBuildings(): PlateauBuildingRecord[] {
    return [];
  }
  getTransport(): TransportRecord[] {
    return this.loadCsv('transport_stations.csv');
  }
  getCommercialFacilities(): CommercialFacilityRecord[] {
    return this.loadCsv('commercial_facilities.csv');
  }
  getMedicalFacilities(): MedicalFacilityRecord[] {
    return this.loadCsv('medical_facilities.csv');
  }
  getNeighborhoods(): NeighborhoodRecord[] {
    return this.loadCsv('neighborhoods.csv');
  }
}
