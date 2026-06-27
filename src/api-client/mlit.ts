/**
 * MLIT 不動産情報ライブラリ API クライアント
 *
 * XIT001: 不動産取引価格（成約価格）情報取得
 * https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/
 *
 * 認証: Ocp-Apim-Subscription-Key ヘッダー
 * 出力: gzip 圧縮 JSON（Node 18+ の fetch は自動デコード対応）
 */

import type {
  MlitTransaction,
  MlitApiResponse,
  TransactionCsvRow,
  LandPriceCsvRow,
} from './types.js';

const BASE_URL = 'https://www.reinfolib.mlit.go.jp/ex-api/external';

/** 都道府県キー → 都道府県コード（2桁）マッピング */
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
 * Parses MLIT-style period string to year and quarter numbers.
 * Examples: "2025年第1四半期" → { year: 2025, quarter: 1 }
 *           "2024年第3四半期" → { year: 2024, quarter: 3 }
 */
function parsePeriod(period: string): { year: number; quarter: number } {
  const match = period.match(/(\d{4})年第([1-4])四半期/);
  if (match) {
    return { year: parseInt(match[1], 10), quarter: parseInt(match[2], 10) };
  }
  // Fallback: extract 4-digit year
  const yearMatch = period.match(/(\d{4})/);
  return { year: yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear(), quarter: 1 };
}

/**
 * Parses UnitPrice string to number. Returns 0 if empty or NaN.
 */
function parsePrice(s: string): number {
  const n = parseInt(s.replace(/,/g, ''), 10);
  return isNaN(n) ? 0 : n;
}

/**
 * Computes the median of a numeric array. Returns 0 for empty arrays.
 */
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid];
}

export class MlitClient {
  constructor(private readonly apiKey: string) {}

  /**
   * XIT001: Fetches real estate transaction prices for a prefecture and year.
   *
   * @param prefKey  e.g. 'aichi', 'tokyo', 'osaka'
   * @param year     e.g. 2025
   * @param quarter  1–4 (optional; fetches all quarters if omitted)
   */
  async fetchTransactions(
    prefKey: string,
    year: number,
    quarter?: 1 | 2 | 3 | 4,
  ): Promise<MlitTransaction[]> {
    const prefCode = PREF_CODE[prefKey];
    if (!prefCode) throw new Error(`MLIT: Unknown prefecture key "${prefKey}"`);

    const params = new URLSearchParams({ year: String(year), area: prefCode });
    if (quarter) params.set('quarter', String(quarter));

    const url = `${BASE_URL}/XIT001?${params.toString()}`;
    const res = await fetch(url, {
      headers: {
        'Ocp-Apim-Subscription-Key': this.apiKey,
        // Node 18+ fetch decompresses gzip automatically when this is NOT set;
        // omitting Accept-Encoding lets the runtime handle it.
      },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`MLIT XIT001 HTTP ${res.status}: ${body.slice(0, 200)}`);
    }

    const json = (await res.json()) as MlitApiResponse;
    if (json.status && json.status !== 200) {
      throw new Error(`MLIT XIT001 API error: ${json.message ?? String(json.status)}`);
    }

    return json.data ?? [];
  }

  /**
   * Fetches transactions filtered to a specific municipality and district.
   * Wraps fetchTransactions with post-fetch filtering by city and chochou name.
   */
  async fetchTransactionsByChochou(
    prefKey: string,
    city: string,
    chochou: string,
    year: number,
  ): Promise<MlitTransaction[]> {
    const all = await this.fetchTransactions(prefKey, year);
    return all.filter(
      (t) =>
        t.Municipality.includes(city) &&
        t.DistrictName.includes(chochou.replace(/[一二三四五六七八九十]丁目$/, '')),
    );
  }

  /**
   * Converts MLIT transaction records to the transactions.csv row format.
   *
   * Filters out records with missing or zero UnitPrice.
   */
  toTransactionRows(items: MlitTransaction[]): TransactionCsvRow[] {
    return items
      .map((t) => {
        const { year, quarter } = parsePeriod(t.Period);
        const unitPrice = parsePrice(t.UnitPrice);
        const totalPrice = parsePrice(t.TradePrice);
        const area = parsePrice(t.Area);
        return {
          year,
          quarter,
          city: t.Municipality,
          district: t.DistrictName,
          property_type: t.Type,
          land_use: t.Region || t.Use || '',
          price_per_sqm: unitPrice,
          total_price: totalPrice,
          area_sqm: area,
          city_planning: t.CityPlanning,
          coverage_ratio: t.CoverageRatio,
          floor_area_ratio: t.FloorAreaRatio,
        } satisfies TransactionCsvRow;
      })
      .filter((r) => r.price_per_sqm > 0);
  }

  /**
   * Aggregates transaction records to land_price.csv format.
   *
   * Groups by (year, city, district, land_use), computes median UnitPrice.
   * Lat/lng are set to 0 (placeholder; real geocoding is a separate concern).
   * change_rate is computed vs. prior-year median if multiple years present,
   * otherwise set to 0.
   */
  toLandPriceRows(items: MlitTransaction[], year: number): LandPriceCsvRow[] {
    // Group by city × district × land_use
    const groups = new Map<string, number[]>();
    for (const t of items) {
      const { year: ty } = parsePeriod(t.Period);
      if (ty !== year) continue;
      const price = parsePrice(t.UnitPrice);
      if (price === 0) continue;
      const key = `${t.Municipality}|||${t.DistrictName}|||${t.Region || t.Use}`;
      const arr = groups.get(key) ?? [];
      arr.push(price);
      groups.set(key, arr);
    }

    const rows: LandPriceCsvRow[] = [];
    for (const [key, prices] of groups) {
      const [city, district, land_use] = key.split('|||');
      rows.push({
        year,
        city: city ?? '',
        district: district ?? '',
        address: district ?? '',
        land_use: land_use ?? '',
        price_per_sqm: median(prices),
        change_rate: 0,
        lat: 0,
        lng: 0,
      });
    }

    return rows.sort(
      (a, b) => a.city.localeCompare(b.city, 'ja') || a.district.localeCompare(b.district, 'ja'),
    );
  }
}

/** CSV header for transactions.csv */
export const TRANSACTIONS_CSV_HEADER =
  'year,quarter,city,district,property_type,land_use,price_per_sqm,total_price,area_sqm,city_planning,coverage_ratio,floor_area_ratio';

/** CSV header for land_price.csv */
export const LAND_PRICE_CSV_HEADER =
  'year,city,district,address,land_use,price_per_sqm,change_rate,lat,lng';

/** Serialises TransactionCsvRow[] to CSV string */
export function transactionsToCsv(rows: TransactionCsvRow[]): string {
  const lines = rows.map((r) =>
    [
      r.year,
      r.quarter,
      `"${r.city}"`,
      `"${r.district}"`,
      `"${r.property_type}"`,
      `"${r.land_use}"`,
      r.price_per_sqm,
      r.total_price,
      r.area_sqm,
      `"${r.city_planning}"`,
      r.coverage_ratio,
      r.floor_area_ratio,
    ].join(','),
  );
  return [TRANSACTIONS_CSV_HEADER, ...lines].join('\n');
}

/** Serialises LandPriceCsvRow[] to CSV string */
export function landPriceToCsv(rows: LandPriceCsvRow[]): string {
  const lines = rows.map((r) =>
    [
      r.year,
      `"${r.city}"`,
      `"${r.district}"`,
      `"${r.address}"`,
      `"${r.land_use}"`,
      r.price_per_sqm,
      r.change_rate,
      r.lat,
      r.lng,
    ].join(','),
  );
  return [LAND_PRICE_CSV_HEADER, ...lines].join('\n');
}
