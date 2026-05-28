export type { PrefectureLoader, LoaderCapabilities, LatLng } from './types.js';
export type {
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
  ZoningRecord,
  VacancyRecord,
  PopulationProjectionRecord,
} from './types.js';
export { registerLoader, getLoader, listAvailable } from './registry.js';
export { StubLoader } from './stub-loader.js';

import { registerLoader } from './registry.js';
import { AichiLoader } from './aichi-loader.js';
import { TokyoLoader } from './tokyo-loader.js';
import { OsakaLoader } from './osaka-loader.js';
import { FukuokaLoader } from './fukuoka-loader.js';
import { HokkaidoLoader } from './hokkaido-loader.js';
import { KanagawaLoader } from './kanagawa-loader.js';
import { KyotoLoader } from './kyoto-loader.js';
import { HyogoLoader } from './hyogo-loader.js';
import { SaitamaLoader } from './saitama-loader.js';
import { ChibaLoader } from './chiba-loader.js';

registerLoader(new AichiLoader());
registerLoader(new TokyoLoader());
registerLoader(new OsakaLoader());
registerLoader(new FukuokaLoader());
registerLoader(new HokkaidoLoader());
registerLoader(new KanagawaLoader());
registerLoader(new KyotoLoader());
registerLoader(new HyogoLoader());
registerLoader(new SaitamaLoader());
registerLoader(new ChibaLoader());
