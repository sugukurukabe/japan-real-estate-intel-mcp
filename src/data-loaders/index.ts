export type { PrefectureLoader, LoaderCapabilities, LatLng } from './types.js';
export type {
  LandPriceRecord, TransactionRecord, PopulationRecord, EarthquakeRecord,
  HumanFlowRecord, SchoolDistrictRecord, CorporateLocationRecord,
  CrimeStatsRecord, PlateauBuildingRecord,
} from './types.js';
export { registerLoader, getLoader, listAvailable } from './registry.js';
export { StubLoader } from './stub-loader.js';

import { registerLoader } from './registry.js';
import { AichiLoader } from './aichi-loader.js';
import { TokyoLoader } from './tokyo-loader.js';
import { OsakaLoader } from './osaka-loader.js';

registerLoader(new AichiLoader());
registerLoader(new TokyoLoader());
registerLoader(new OsakaLoader());
