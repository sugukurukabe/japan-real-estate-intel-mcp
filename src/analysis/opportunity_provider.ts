import type {
  LandPriceRecord,
  PopulationRecord,
  HumanFlowRecord,
  SchoolDistrictRecord,
  CorporateLocationRecord,
  TransportRecord,
  CommercialFacilityRecord,
  MedicalFacilityRecord,
  CrimeStatsRecord,
  EarthquakeRecord,
} from '../data-loaders/types.js';
import { getLoader } from '../data-loaders/index.js';
import type { FreshTransactionSignal } from '../schemas.js';

export interface CityMetrics {
  city: string;
  avgPricePerSqm: number | null;
  avgChangeRate: number | null;
  population: PopulationRecord | null;
  humanFlow: { weekdayAvg: number; trend: string } | null;
  education: { avgScore: number } | null;
  corporate: { totalEstablishments: number; majorCompanies: number } | null;
  transport: { stationCount: number; avgPassengers: number } | null;
  commercial: { count: number } | null;
  medical: { count: number } | null;
  crime: CrimeStatsRecord | null;
  earthquake: EarthquakeRecord | null;
}

export interface OpportunityDataProvider {
  getCities(prefKey: string): string[];
  getCityMetrics(prefKey: string, city: string): CityMetrics;
  getAllRawData(prefKey: string): {
    landPrices: LandPriceRecord[];
    population: PopulationRecord[];
    humanFlow: HumanFlowRecord[];
    education: SchoolDistrictRecord[];
    corporate: CorporateLocationRecord[];
    transport: TransportRecord[];
    commercial: CommercialFacilityRecord[];
    medical: MedicalFacilityRecord[];
    crime: CrimeStatsRecord[];
    earthquake: EarthquakeRecord[];
  };
  getFreshTransactionSignal?(prefKey: string, city: string): Promise<FreshTransactionSignal | null>;
  readonly sourceLabel: string;
}

function matchCity(a: string, b: string): boolean {
  return a.includes(b) || b.includes(a);
}

function majorityTrend(records: HumanFlowRecord[]): string {
  const counts: Record<string, number> = {};
  for (const r of records) {
    counts[r.flow_trend] = (counts[r.flow_trend] ?? 0) + 1;
  }
  let best = 'stable';
  let max = 0;
  for (const [k, v] of Object.entries(counts)) {
    if (v > max) {
      max = v;
      best = k;
    }
  }
  return best;
}

function aggregateByCity(
  city: string,
  landPrices: LandPriceRecord[],
  population: PopulationRecord[],
  humanFlow: HumanFlowRecord[],
  education: SchoolDistrictRecord[],
  corporate: CorporateLocationRecord[],
  transport: TransportRecord[],
  commercial: CommercialFacilityRecord[],
  medical: MedicalFacilityRecord[],
  crime: CrimeStatsRecord[],
  earthquake: EarthquakeRecord[],
): CityMetrics {
  const lp = landPrices.filter((r) => matchCity(r.city, city));
  const avgPrice = lp.length > 0 ? lp.reduce((s, r) => s + r.price_per_sqm, 0) / lp.length : null;
  const avgChange = lp.length > 0 ? lp.reduce((s, r) => s + r.change_rate, 0) / lp.length : null;

  const pop = population.find((r) => matchCity(r.city, city)) ?? null;

  const hf = humanFlow.filter((r) => matchCity(r.city, city));
  const hfAgg =
    hf.length > 0
      ? {
          weekdayAvg: hf.reduce((s, r) => s + r.weekday_avg_flow, 0) / hf.length,
          trend: majorityTrend(hf),
        }
      : null;

  const edu = education.filter((r) => matchCity(r.city, city));
  const eduAgg =
    edu.length > 0
      ? { avgScore: edu.reduce((s, r) => s + r.education_score, 0) / edu.length }
      : null;

  const corp = corporate.filter((r) => matchCity(r.city, city));
  const corpAgg =
    corp.length > 0
      ? {
          totalEstablishments: corp.reduce((s, r) => s + r.total_establishments, 0),
          majorCompanies: corp.reduce((s, r) => s + r.major_company_count, 0),
        }
      : null;

  const tr = transport.filter((r) => matchCity(r.city, city));
  const trAgg =
    tr.length > 0
      ? {
          stationCount: tr.length,
          avgPassengers: tr.reduce((s, r) => s + r.daily_passengers, 0) / tr.length,
        }
      : null;

  const com = commercial.filter((r) => matchCity(r.city, city));
  const med = medical.filter((r) => matchCity(r.city, city));
  const cr = crime.find((r) => matchCity(r.city, city)) ?? null;
  const eq = earthquake.find((r) => matchCity(r.city, city)) ?? null;

  return {
    city,
    avgPricePerSqm: avgPrice,
    avgChangeRate: avgChange,
    population: pop,
    humanFlow: hfAgg,
    education: eduAgg,
    corporate: corpAgg,
    transport: trAgg,
    commercial: com.length > 0 ? { count: com.length } : null,
    medical: med.length > 0 ? { count: med.length } : null,
    crime: cr,
    earthquake: eq,
  };
}

export class LocalCsvProvider implements OpportunityDataProvider {
  readonly sourceLabel = 'LocalCSV';

  getCities(prefKey: string): string[] {
    return getLoader(prefKey).getCities();
  }

  getAllRawData(prefKey: string) {
    const loader = getLoader(prefKey);
    return {
      landPrices: loader.getLandPrices(),
      population: loader.getPopulation(),
      humanFlow: loader.getHumanFlow(),
      education: loader.getSchoolDistricts(),
      corporate: loader.getCorporateLocations(),
      transport: loader.getTransport(),
      commercial: loader.getCommercialFacilities(),
      medical: loader.getMedicalFacilities(),
      crime: loader.getCrimeStats(),
      earthquake: loader.getEarthquakeData(),
    };
  }

  getCityMetrics(prefKey: string, city: string): CityMetrics {
    const data = this.getAllRawData(prefKey);
    return aggregateByCity(
      city,
      data.landPrices,
      data.population,
      data.humanFlow,
      data.education,
      data.corporate,
      data.transport,
      data.commercial,
      data.medical,
      data.crime,
      data.earthquake,
    );
  }
}
