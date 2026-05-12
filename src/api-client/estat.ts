/**
 * e-Stat 政府統計 API クライアント (REST 3.0)
 *
 * 対象: 令和2年（2020年）国勢調査 — 男女別人口（市区町村別）
 * statsDataId: 0003445078
 * https://www.e-stat.go.jp/api/
 *
 * 認証: appId クエリパラメータ
 */

import type {
  EstatApiResponse,
  EstatValue,
  PopulationCsvRow,
  HouseholdCompositionRow,
  VacancyStatsRow,
  EconomicCensusRow,
} from './types.js';

const BASE_URL = 'https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData';

const POPULATION_STATS_ID = '0003445078';
const HOUSEHOLD_STATS_ID = '0003445258';
const VACANCY_STATS_ID = '0003355482';
const ECONOMIC_CENSUS_STATS_ID = '0003353941';
/** 建築物着工統計 時系列（都道府県別・政府統計 e-Stat） */
const BUILDING_CONSTRUCTION_STATS_ID = '0003119768';

/** 都道府県コード (2桁) マッピング — 市区町村は 5桁 (都道府県2桁+市区町村3桁) */
const PREF_CODE: Record<string, string> = {
  aichi: '23',
  tokyo: '13',
  osaka: '27',
  fukuoka: '40',
  hokkaido: '01',
  kanagawa: '14',
  kyoto: '26',
  hyogo: '28',
  saitama: '11',
  chiba: '12',
};

/**
 * 市区町村コード → 市区町村名 のシンプルなキャッシュ。
 * e-Stat API の CLASS_INF から構築する。
 */
function buildAreaNameMap(response: EstatApiResponse): Map<string, string> {
  const map = new Map<string, string>();
  const classObjs = response.GET_STATS_DATA.STATISTICAL_DATA.CLASS_INF.CLASS_OBJ;
  for (const obj of classObjs) {
    if (obj['@id'] !== 'area') continue;
    const classes = Array.isArray(obj.CLASS) ? obj.CLASS : [obj.CLASS];
    for (const c of classes) {
      map.set(c['@code'], c['@name']);
    }
  }
  return map;
}

/**
 * Safely gets VALUE array from e-Stat response.
 * VALUE may be a single object (not array) when only 1 result.
 */
function getValues(response: EstatApiResponse): EstatValue[] {
  const raw = response.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE;
  return Array.isArray(raw) ? raw : [raw];
}

/**
 * Parses a numeric string value. Returns 0 for empty/null.
 */
function parseNum(s: string | undefined): number {
  if (!s) return 0;
  const n = parseInt(s.replace(/,/g, ''), 10);
  return isNaN(n) ? 0 : n;
}

export class EstatClient {
  constructor(private readonly appId: string) {}

  /**
   * Fetches municipality-level population data for a prefecture from e-Stat.
   *
   * Uses 2020 Population Census (statsDataId = 0003445078).
   * Returns 総数 (cat01=0) rows for all municipalities in the prefecture.
   * @param prefKey e.g. 'aichi', 'tokyo', 'osaka'
   */
  async fetchPopulation(prefKey: string): Promise<EstatApiResponse> {
    const prefCode = PREF_CODE[prefKey];
    if (!prefCode) throw new Error(`e-Stat: Unknown prefecture key "${prefKey}"`);

    const params = new URLSearchParams({
      appId: this.appId,
      statsDataId: POPULATION_STATS_ID,
      cdAreaFrom: `${prefCode}100`,  // skip prefecture total (xx000)
      cdAreaTo: `${prefCode}999`,
      cdCat01: '0',                  // 総数 only (skip 男/女 breakdown)
      metaGetFlg: 'Y',
      cntGetFlg: 'N',
      explanationGetFlg: 'N',
      annotationGetFlg: 'N',
      sectionHeaderFlg: '1',
    });

    const url = `${BASE_URL}?${params.toString()}`;
    const res = await fetch(url);

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`e-Stat API HTTP ${res.status}: ${body.slice(0, 200)}`);
    }

    const json = (await res.json()) as EstatApiResponse;
    // e-Stat wraps error info in RESULT which is absent from success response types
    const root = json as unknown as { GET_STATS_DATA?: { RESULT?: { STATUS?: number; ERROR_MSG?: string } } };
    const apiStatus = root.GET_STATS_DATA?.RESULT?.STATUS;
    if (apiStatus !== undefined && apiStatus !== 0) {
      const msg = root.GET_STATS_DATA?.RESULT?.ERROR_MSG;
      throw new Error(`e-Stat API error (status ${apiStatus}): ${msg}`);
    }

    return json;
  }

  /**
   * Converts e-Stat getStatsData response to population.csv row format.
   *
   * Table 0003445078 returns cat01=0 (総数) for each municipality.
   * Households and aging_rate require separate tables; estimated here.
   */
  toPopulationRows(response: EstatApiResponse): PopulationCsvRow[] {
    const areaNames = buildAreaNameMap(response);
    const values = getValues(response);

    const byArea = new Map<string, number>();
    for (const v of values) {
      const code = v['@area'];
      if (!code || code.length < 5) continue;
      const val = parseNum(v['$']);
      if (val > 0 && !byArea.has(code)) {
        byArea.set(code, val);
      }
    }

    const rows: PopulationCsvRow[] = [];
    for (const [code, pop] of byArea) {
      const name = areaNames.get(code) ?? code;
      rows.push({
        city: name,
        population_2020: pop,
        population_2025: Math.round(pop * 0.995),
        households_2020: Math.round(pop * 0.42),  // estimated from national avg
        households_2025: Math.round(pop * 0.42 * 0.998),
        density_per_sqkm: 0,
        aging_rate: 0,
      });
    }

    return rows.filter((r) => r.city && r.population_2020 > 0).sort((a, b) =>
      a.city.localeCompare(b.city, 'ja'),
    );
  }

  private async fetchTable(
    statsDataId: string,
    prefKey: string,
    extraParams?: Record<string, string>,
  ): Promise<EstatApiResponse> {
    const prefCode = PREF_CODE[prefKey];
    if (!prefCode) throw new Error(`e-Stat: Unknown prefecture key "${prefKey}"`);
    const params = new URLSearchParams({
      appId: this.appId,
      statsDataId,
      cdAreaFrom: `${prefCode}100`,
      cdAreaTo: `${prefCode}999`,
      metaGetFlg: 'Y',
      cntGetFlg: 'N',
      explanationGetFlg: 'N',
      annotationGetFlg: 'N',
      sectionHeaderFlg: '1',
      ...extraParams,
    });
    return this.requestGetStatsData(params);
  }

  private async requestGetStatsData(params: URLSearchParams): Promise<EstatApiResponse> {
    const res = await fetch(`${BASE_URL}?${params.toString()}`);
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`e-Stat API HTTP ${res.status}: ${body.slice(0, 200)}`);
    }
    const json = (await res.json()) as EstatApiResponse;
    const root = json as unknown as { GET_STATS_DATA?: { RESULT?: { STATUS?: number; ERROR_MSG?: string } } };
    const apiStatus = root.GET_STATS_DATA?.RESULT?.STATUS;
    if (apiStatus !== undefined && apiStatus !== 0) {
      throw new Error(`e-Stat API error (status ${apiStatus}): ${root.GET_STATS_DATA?.RESULT?.ERROR_MSG}`);
    }
    return json;
  }

  /**
   * Prefecture-level building construction starts (建築物着工): sums all breakdown rows per time period for cdArea = {pref}000.
   * Returns null if no values (wrong area code or table change).
   */
  async fetchBuildingConstructionPrefectureSummary(prefKey: string): Promise<{
    latestTime: string;
    latestTotal: number;
    priorTime: string | null;
    priorTotal: number | null;
    yoyPct: number | null;
    attribution: string;
  } | null> {
    const prefCode = PREF_CODE[prefKey];
    if (!prefCode) throw new Error(`e-Stat: Unknown prefecture key "${prefKey}"`);
    const params = new URLSearchParams({
      appId: this.appId,
      statsDataId: BUILDING_CONSTRUCTION_STATS_ID,
      cdArea: `${prefCode}000`,
      metaGetFlg: 'Y',
      cntGetFlg: 'N',
      explanationGetFlg: 'N',
      annotationGetFlg: 'N',
      sectionHeaderFlg: '1',
    });
    const response = await this.requestGetStatsData(params);
    const values = getValues(response);
    if (values.length === 0) return null;
    const byTime = new Map<string, number>();
    for (const v of values) {
      const t = (v['@time'] ?? '').trim();
      if (!t) continue;
      const add = parseNum(v['$']);
      byTime.set(t, (byTime.get(t) ?? 0) + add);
    }
    const times = [...byTime.keys()].sort((a, b) => a.localeCompare(b));
    if (times.length === 0) return null;
    const latestTime = times[times.length - 1]!;
    const priorTime = times.length >= 2 ? times[times.length - 2]! : null;
    const latestTotal = byTime.get(latestTime) ?? 0;
    const priorTotal = priorTime !== null ? (byTime.get(priorTime) ?? null) : null;
    let yoyPct: number | null = null;
    if (priorTime !== null && priorTotal !== null && priorTotal > 0) {
      yoyPct = Math.round(((latestTotal - priorTotal) / priorTotal) * 1000) / 10;
    }
    const attribution =
      `建築物着工: 政府統計 e-Stat getStatsData (statsDataId=${BUILDING_CONSTRUCTION_STATS_ID}, 地域=${prefCode}000) — 内訳系列を時点ごとに合算した参考値です。`;
    return {
      latestTime,
      latestTotal,
      priorTime,
      priorTotal,
      yoyPct,
      attribution,
    };
  }

  async fetchHouseholdComposition(prefKey: string): Promise<HouseholdCompositionRow[]> {
    const response = await this.fetchTable(HOUSEHOLD_STATS_ID, prefKey);
    const areaNames = buildAreaNameMap(response);
    const values = getValues(response);
    const byArea = new Map<string, { total: number; single: number }>();
    for (const v of values) {
      const code = v['@area'];
      if (!code || code.length < 5) continue;
      const cur = byArea.get(code) ?? { total: 0, single: 0 };
      const val = parseNum(v['$']);
      const cat = v['@cat01'] ?? '';
      if (cat === '0' || cat === '000' || cat.includes('総')) {
        if (cur.total === 0) cur.total = val;
      } else if (cat === '1' || cat === '100' || cat.includes('単独')) {
        cur.single = val;
      }
      byArea.set(code, cur);
    }
    const rows: HouseholdCompositionRow[] = [];
    for (const [code, d] of byArea) {
      if (d.total <= 0) continue;
      rows.push({
        city: areaNames.get(code) ?? code,
        totalHouseholds: d.total,
        singlePersonHouseholds: d.single,
        familyHouseholds: d.total - d.single,
        singlePersonRatio: Math.round((d.single / d.total) * 1000) / 10,
      });
    }
    return rows.sort((a, b) => a.city.localeCompare(b.city, 'ja'));
  }

  async fetchVacancyStats(prefKey: string): Promise<VacancyStatsRow[]> {
    const response = await this.fetchTable(VACANCY_STATS_ID, prefKey);
    const areaNames = buildAreaNameMap(response);
    const values = getValues(response);
    const byArea = new Map<string, { total: number; rent: number; sale: number; other: number }>();
    for (const v of values) {
      const code = v['@area'];
      if (!code || code.length < 5) continue;
      const cur = byArea.get(code) ?? { total: 0, rent: 0, sale: 0, other: 0 };
      const val = parseNum(v['$']);
      const cat = v['@cat01'] ?? '';
      if (cat === '0' || cat === '00' || cat.includes('総')) {
        if (cur.total === 0) cur.total = val;
      } else if (cat.includes('賃貸') || cat === '1' || cat === '01') {
        cur.rent = val;
      } else if (cat.includes('売却') || cat === '2' || cat === '02') {
        cur.sale = val;
      } else {
        cur.other += val;
      }
      byArea.set(code, cur);
    }
    const rows: VacancyStatsRow[] = [];
    for (const [code, d] of byArea) {
      if (d.total <= 0) continue;
      rows.push({
        city: areaNames.get(code) ?? code,
        totalVacant: d.total,
        forRent: d.rent,
        forSale: d.sale,
        other: d.other,
      });
    }
    return rows.sort((a, b) => a.city.localeCompare(b.city, 'ja'));
  }

  async fetchEconomicCensus(prefKey: string): Promise<EconomicCensusRow[]> {
    const response = await this.fetchTable(ECONOMIC_CENSUS_STATS_ID, prefKey);
    const areaNames = buildAreaNameMap(response);
    const values = getValues(response);
    const byArea = new Map<string, { establishments: number; employees: number }>();
    for (const v of values) {
      const code = v['@area'];
      if (!code || code.length < 5) continue;
      const cur = byArea.get(code) ?? { establishments: 0, employees: 0 };
      const val = parseNum(v['$']);
      const tab = (v as unknown as Record<string, string>)['@tab'] ?? '';
      if (tab.includes('事業所') || cur.establishments === 0) {
        cur.establishments = val;
      } else {
        cur.employees = val;
      }
      byArea.set(code, cur);
    }
    const rows: EconomicCensusRow[] = [];
    for (const [code, d] of byArea) {
      if (d.establishments <= 0) continue;
      rows.push({
        city: areaNames.get(code) ?? code,
        establishments: d.establishments,
        employees: d.employees,
      });
    }
    return rows.sort((a, b) => a.city.localeCompare(b.city, 'ja'));
  }
}

/** CSV header for population.csv */
export const POPULATION_CSV_HEADER =
  'city,population_2020,population_2025,households_2020,households_2025,density_per_sqkm,aging_rate';

/** Serialises PopulationCsvRow[] to CSV string */
export function populationToCsv(rows: PopulationCsvRow[]): string {
  const lines = rows.map((r) =>
    [
      `"${r.city}"`,
      r.population_2020,
      r.population_2025,
      r.households_2020,
      r.households_2025,
      r.density_per_sqkm,
      r.aging_rate,
    ].join(','),
  );
  return [POPULATION_CSV_HEADER, ...lines].join('\n');
}
