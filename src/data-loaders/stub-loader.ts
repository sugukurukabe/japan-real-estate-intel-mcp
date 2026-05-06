import type { FeatureCollection } from 'geojson';
import type {
  PrefectureLoader, LoaderCapabilities, LatLng,
  LandPriceRecord, TransactionRecord, PopulationRecord, EarthquakeRecord,
  HumanFlowRecord, SchoolDistrictRecord, CorporateLocationRecord,
  CrimeStatsRecord, PlateauBuildingRecord,
} from './types.js';
import { getPrefectureDisplayName } from '../prefecture/resolver.js';

const EMPTY_FC: FeatureCollection = { type: 'FeatureCollection', features: [] };

export class StubLoader implements PrefectureLoader {
  readonly key: string;
  readonly displayName: string;
  readonly isoCode: string;
  readonly capabilities: LoaderCapabilities = {
    humanFlow: false, education: false, corporate: false, crime: false, plateau: false,
  };

  constructor(key: string) {
    this.key = key;
    this.displayName = getPrefectureDisplayName(key);
    this.isoCode = '';
  }

  geocode(): LatLng | undefined { return undefined; }
  reverseGeocode(): string | undefined { return undefined; }

  getLandPrices(): LandPriceRecord[] { return []; }
  getTransactions(): TransactionRecord[] { return []; }
  getPopulation(): PopulationRecord[] { return []; }
  getEarthquakeData(): EarthquakeRecord[] { return []; }
  getFloodZones(): FeatureCollection { return EMPTY_FC; }
  getLandslideZones(): FeatureCollection { return EMPTY_FC; }
  getMunicipalities(): FeatureCollection { return EMPTY_FC; }
  getHumanFlow(): HumanFlowRecord[] { return []; }
  getSchoolDistricts(): SchoolDistrictRecord[] { return []; }
  getCorporateLocations(): CorporateLocationRecord[] { return []; }
  getCrimeStats(): CrimeStatsRecord[] { return []; }
  getPlateauBuildings(): PlateauBuildingRecord[] { return []; }
}
