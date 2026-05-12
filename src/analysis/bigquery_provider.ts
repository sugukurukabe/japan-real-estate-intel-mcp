import { BigQuery } from '@google-cloud/bigquery';
import type { OpportunityDataProvider, CityMetrics } from './opportunity_provider.js';
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
import type { FreshTransactionSignal } from '../schemas.js';
import { moduleLogger } from '../logger.js';

const log = moduleLogger('bigquery_provider');

const DATASET = process.env.BQ_DATASET ?? 'japan_real_estate';
const PROJECT = process.env.GCP_PROJECT;

export class BigQueryProvider implements OpportunityDataProvider {
  readonly sourceLabel = 'BigQuery';
  private bq: BigQuery;

  constructor(projectId?: string) {
    this.bq = new BigQuery({ projectId: projectId ?? PROJECT });
  }

  getCities(prefKey: string): string[] {
    throw new Error(`BigQueryProvider.getCities() must be called via getCitiesAsync(). prefKey=${prefKey}`);
  }

  async getCitiesAsync(prefKey: string): Promise<string[]> {
    const [rows] = await this.bq.query({
      query: `SELECT DISTINCT city FROM \`${DATASET}.land_prices\` WHERE pref_key = @prefKey ORDER BY city`,
      params: { prefKey },
    });
    return rows.map((r: { city: string }) => r.city);
  }

  getCityMetrics(prefKey: string, city: string): CityMetrics {
    throw new Error(`BigQueryProvider.getCityMetrics() must be called via getCityMetricsAsync(). prefKey=${prefKey}, city=${city}`);
  }

  async getCityMetricsAsync(prefKey: string, city: string): Promise<CityMetrics> {
    const [lpRows] = await this.bq.query({
      query: `SELECT AVG(price_per_sqm) as avg_price, AVG(change_rate) as avg_change
              FROM \`${DATASET}.land_prices\`
              WHERE pref_key = @prefKey AND city = @city`,
      params: { prefKey, city },
    });

    const [popRows] = await this.bq.query({
      query: `SELECT * FROM \`${DATASET}.population\` WHERE pref_key = @prefKey AND city = @city LIMIT 1`,
      params: { prefKey, city },
    });

    const lp = lpRows[0] ?? {};
    const pop = popRows[0] ?? null;

    return {
      city,
      avgPricePerSqm: lp.avg_price ?? null,
      avgChangeRate: lp.avg_change ?? null,
      population: pop ? {
        city,
        population_2020: pop.population_2020 ?? 0,
        population_2025: pop.population_2025 ?? 0,
        households_2020: pop.households_2020 ?? 0,
        households_2025: pop.households_2025 ?? 0,
        density_per_sqkm: pop.density_per_sqkm ?? 0,
        aging_rate: pop.aging_rate ?? 0,
      } : null,
      humanFlow: null,
      education: null,
      corporate: null,
      transport: null,
      commercial: null,
      medical: null,
      crime: null,
      earthquake: null,
    };
  }

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
  } {
    log.warn({ prefKey }, 'BigQueryProvider.getAllRawData() returns empty; use async variant for production');
    return {
      landPrices: [], population: [], humanFlow: [], education: [],
      corporate: [], transport: [], commercial: [], medical: [],
      crime: [], earthquake: [],
    };
  }

  async getFreshTransactionSignal(prefKey: string, city: string): Promise<FreshTransactionSignal | null> {
    try {
      const [rows] = await this.bq.query({
        query: `SELECT
                  COUNT(*) as sample_count,
                  APPROX_QUANTILES(price_per_sqm, 2)[OFFSET(1)] as median_price
                FROM \`${DATASET}.mlit_transactions\`
                WHERE pref_key = @prefKey AND city = @city
                  AND fetched_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 90 DAY)`,
        params: { prefKey, city },
      });

      const row = rows[0];
      if (!row || row.sample_count === 0) return null;

      const [histRows] = await this.bq.query({
        query: `SELECT AVG(price_per_sqm) as hist_price
                FROM \`${DATASET}.land_prices\`
                WHERE pref_key = @prefKey AND city = @city`,
        params: { prefKey, city },
      });

      const histPrice = histRows[0]?.hist_price ?? 0;
      const delta = histPrice > 0
        ? Math.round(((row.median_price - histPrice) / histPrice) * 1000) / 10
        : 0;

      return {
        sampleCount: row.sample_count,
        medianPricePerSqm: row.median_price,
        deltaVsHistorical: delta,
        fetchedAt: new Date().toISOString(),
      };
    } catch (err) {
      log.warn({ prefKey, city, err }, 'BigQuery fresh signal query failed');
      return null;
    }
  }
}
