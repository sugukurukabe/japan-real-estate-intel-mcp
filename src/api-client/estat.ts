/**
 * e-Stat 政府統計 API クライアント (REST 3.0)
 *
 * 対象: 令和2年（2020年）国勢調査 — 人口・世帯数（statsDataId: 0003443220）
 * https://www.e-stat.go.jp/api/
 *
 * 認証: appId クエリパラメータ
 */

import type { EstatApiResponse, EstatValue, PopulationCsvRow } from './types.js';

const BASE_URL = 'https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData';

/**
 * 令和2年国勢調査 人口・世帯数 statsDataId.
 * Table: 市区町村別人口数及び世帯数 (人口等基本集計)
 */
const POPULATION_STATS_ID = '0003443220';

/** 都道府県コード (2桁) マッピング */
const PREF_CODE: Record<string, string> = {
  aichi: '23',
  tokyo: '13',
  osaka: '27',
  fukuoka: '40',
  hokkaido: '01',
  kanagawa: '14',
  kyoto: '26',
  hyogo: '28',
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
   * Uses 2020 Population Census (statsDataId = 0003443220).
   * @param prefKey e.g. 'aichi', 'tokyo', 'osaka'
   */
  async fetchPopulation(prefKey: string): Promise<EstatApiResponse> {
    const prefCode = PREF_CODE[prefKey];
    if (!prefCode) throw new Error(`e-Stat: Unknown prefecture key "${prefKey}"`);

    const params = new URLSearchParams({
      appId: this.appId,
      statsDataId: POPULATION_STATS_ID,
      cdArea: prefCode,      // filter to prefecture level
      metaGetFlg: 'Y',       // include CLASS_INF for area name lookup
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
   * Produces one row per municipality with population_2020, households_2020
   * (aging_rate and density require supplemental data; set to 0 as placeholder).
   * population_2025 is estimated as population_2020 × 0.995 (synthetic).
   */
  toPopulationRows(response: EstatApiResponse): PopulationCsvRow[] {
    const areaNames = buildAreaNameMap(response);
    const values = getValues(response);

    // Accumulate by area code
    const byArea = new Map<string, { pop: number; households: number }>();
    for (const v of values) {
      const code = v['@area'];
      if (!code || code.length < 5) continue; // skip prefecture-level totals (2-digit)

      const current = byArea.get(code) ?? { pop: 0, households: 0 };
      const cat = v['@cat01'] ?? '';
      const val = parseNum(v['$']);

      // Heuristic: distinguish population vs households by category code
      // 001 / 00100 = 人口総数, 00200 / T000849001 = 世帯数 (varies by table)
      if (cat.includes('002') || cat.includes('世帯') || cat === 'T000849002') {
        current.households = val;
      } else {
        // Treat as population (first/primary metric)
        if (current.pop === 0) current.pop = val;
      }
      byArea.set(code, current);
    }

    const rows: PopulationCsvRow[] = [];
    for (const [code, data] of byArea) {
      const name = areaNames.get(code) ?? code;
      rows.push({
        city: name,
        population_2020: data.pop,
        population_2025: Math.round(data.pop * 0.995), // estimated
        households_2020: data.households,
        households_2025: Math.round(data.households * 0.998), // estimated
        density_per_sqkm: 0,  // requires area data not in this API response
        aging_rate: 0,        // requires age-breakdown table
      });
    }

    return rows.filter((r) => r.city && r.population_2020 > 0).sort((a, b) =>
      a.city.localeCompare(b.city, 'ja'),
    );
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
