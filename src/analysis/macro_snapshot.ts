import type {
  LandPriceRecord,
  PopulationProjectionRecord,
  PrefectureLoader,
  TransactionRecord,
} from '../data-loaders/types.js';

export function median(nums: number[]): number | null {
  const vals = nums.filter((n) => typeof n === 'number' && !Number.isNaN(n));
  if (vals.length === 0) return null;
  const s = [...vals].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 !== 0 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

export function cityMatches(recordCity: string, filter?: string): boolean {
  const f = filter?.trim();
  if (!f) return true;
  return recordCity.includes(f) || f.includes(recordCity);
}

export interface LandPriceYoYSummary {
  latestYear: number | null;
  priorYear: number | null;
  medianLatestPerSqm: number | null;
  medianPriorPerSqm: number | null;
  yoyMedianPct: number | null;
  avgChangeRateLatestYear: number | null;
  rowsLatestYear: number;
}

/**
 * Median ㎡単価 by year from land_price.csv; YoY compares latest vs prior calendar year.
 */
export function computeLandPriceYoY(
  records: LandPriceRecord[],
  cityFilter?: string,
): LandPriceYoYSummary {
  const rows = records.filter((r) => cityMatches(r.city, cityFilter));
  const byYear = new Map<number, number[]>();
  const changeByYear = new Map<number, number[]>();
  for (const r of rows) {
    const y = r.year;
    if (typeof y !== 'number' || Number.isNaN(y)) continue;
    let arr = byYear.get(y);
    if (!arr) {
      arr = [];
      byYear.set(y, arr);
    }
    arr.push(r.price_per_sqm);
    if (typeof r.change_rate === 'number' && !Number.isNaN(r.change_rate)) {
      let cr = changeByYear.get(y);
      if (!cr) {
        cr = [];
        changeByYear.set(y, cr);
      }
      cr.push(r.change_rate);
    }
  }
  const years = [...byYear.keys()].sort((a, b) => a - b);
  const latestYear = years.length ? years[years.length - 1]! : null;
  const priorYear = years.length >= 2 ? years[years.length - 2]! : null;
  const medLatest = latestYear !== null ? median(byYear.get(latestYear) ?? []) : null;
  const medPrior = priorYear !== null ? median(byYear.get(priorYear) ?? []) : null;
  let yoyMedianPct: number | null = null;
  if (medLatest !== null && medPrior !== null && medPrior !== 0) {
    yoyMedianPct = Math.round(((medLatest - medPrior) / medPrior) * 1000) / 10;
  }
  let avgChange: number | null = null;
  let rowsLatest = 0;
  if (latestYear !== null) {
    const crs = changeByYear.get(latestYear) ?? [];
    rowsLatest = (byYear.get(latestYear) ?? []).length;
    if (crs.length > 0) {
      avgChange = Math.round((crs.reduce((a, b) => a + b, 0) / crs.length) * 10) / 10;
    }
  }
  return {
    latestYear,
    priorYear,
    medianLatestPerSqm: medLatest !== null ? Math.round(medLatest) : null,
    medianPriorPerSqm: medPrior !== null ? Math.round(medPrior) : null,
    yoyMedianPct,
    avgChangeRateLatestYear: avgChange,
    rowsLatestYear: rowsLatest,
  };
}

export interface TransactionRecentSummary {
  years: { year: number; count: number; medianPricePerSqm: number | null }[];
  definition: string;
}

const TX_DEF =
  '市区町村を cityFilter で絞った上で、transactions.csv の年別件数と取引㎡単価の中央値（全用途・全構造を合算）';

/**
 * Last `yearSpan` calendar years of transaction counts and median ㎡単価.
 */
export function computeTransactionRecentSummary(
  records: TransactionRecord[],
  cityFilter: string | undefined,
  yearSpan = 3,
): TransactionRecentSummary {
  const rows = records.filter((r) => cityMatches(r.city, cityFilter));
  const byYear = new Map<number, number[]>();
  const countByYear = new Map<number, number>();
  for (const r of rows) {
    const y = r.year;
    if (typeof y !== 'number' || Number.isNaN(y)) continue;
    countByYear.set(y, (countByYear.get(y) ?? 0) + 1);
    let arr = byYear.get(y);
    if (!arr) {
      arr = [];
      byYear.set(y, arr);
    }
    if (typeof r.price_per_sqm === 'number' && !Number.isNaN(r.price_per_sqm)) {
      arr.push(r.price_per_sqm);
    }
  }
  const years = [...countByYear.keys()]
    .sort((a, b) => b - a)
    .slice(0, yearSpan)
    .sort((a, b) => a - b);
  const yearsOut = years.map((year) => ({
    year,
    count: countByYear.get(year) ?? 0,
    medianPricePerSqm: (() => {
      const m = median(byYear.get(year) ?? []);
      return m !== null ? Math.round(m) : null;
    })(),
  }));
  return { years: yearsOut, definition: TX_DEF };
}

export interface PopulationMacroSummary {
  avgDecline2050: number | null;
  municipalityCount: number;
  definition: string;
}

const POP_DEF =
  'population_projection.csv の市区町村別 decline_rate_2050（2050年対2020年比減少率%）の単純平均';

export function computePopulationDeclineAvg(
  records: PopulationProjectionRecord[],
  cityFilter?: string,
): PopulationMacroSummary {
  const rows = records.filter((r) => cityMatches(r.city, cityFilter));
  if (rows.length === 0) {
    return { avgDecline2050: null, municipalityCount: 0, definition: POP_DEF };
  }
  const avg =
    Math.round((rows.reduce((s, r) => s + r.decline_rate_2050, 0) / rows.length) * 10) / 10;
  return { avgDecline2050: avg, municipalityCount: rows.length, definition: POP_DEF };
}

export interface MacroSnapshotCore {
  landPrice: LandPriceYoYSummary;
  transactions: TransactionRecentSummary;
  population: PopulationMacroSummary;
}

export function buildMacroSnapshotCore(
  loader: PrefectureLoader,
  cityFilter?: string,
): MacroSnapshotCore {
  return {
    landPrice: computeLandPriceYoY(loader.getLandPrices(), cityFilter),
    transactions: computeTransactionRecentSummary(loader.getTransactions(), cityFilter, 3),
    population: computePopulationDeclineAvg(loader.getPopulationProjection(), cityFilter),
  };
}
