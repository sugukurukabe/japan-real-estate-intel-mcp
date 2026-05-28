import { MlitClient } from '../api-client/mlit.js';
import { moduleLogger } from '../logger.js';
import type { FreshTransactionSignal } from '../schemas.js';

const log = moduleLogger('external_freshness');

export interface FreshSignalMap {
  [city: string]: FreshTransactionSignal;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid];
}

/**
 * Fetches the latest quarter of MLIT transaction data for a prefecture,
 * aggregates by city, and computes median ㎡ price + delta vs historical CSV.
 *
 * Returns null when: MLIT_API_KEY is missing, the prefecture has no mapping,
 * or the API call fails (with a warning log).
 */
export async function tryFetchMlitFreshness(
  prefKey: string,
  historicalPrices: Map<string, number>,
): Promise<FreshSignalMap | null> {
  const apiKey = process.env.MLIT_API_KEY;
  if (!apiKey) {
    log.debug('MLIT_API_KEY not set, skipping freshness fetch');
    return null;
  }

  try {
    const client = new MlitClient(apiKey);
    const now = new Date();
    const year = now.getFullYear();
    const quarter = (Math.ceil((now.getMonth() + 1) / 3) - 1 || 4) as 1 | 2 | 3 | 4;

    const items = await client.fetchTransactions(prefKey, year, quarter);

    if (items.length === 0) {
      const prevQ = quarter === 1 ? 4 : ((quarter - 1) as 1 | 2 | 3 | 4);
      const prevYear = quarter === 1 ? year - 1 : year;
      const fallbackItems = await client.fetchTransactions(prefKey, prevYear, prevQ);
      if (fallbackItems.length === 0) {
        log.info({ prefKey, year, quarter }, 'No MLIT transactions found');
        return null;
      }
      return aggregateByCitySignal(fallbackItems, historicalPrices);
    }

    return aggregateByCitySignal(items, historicalPrices);
  } catch (err) {
    log.warn({ prefKey, err }, 'MLIT freshness fetch failed, continuing with CSV only');
    return null;
  }
}

function aggregateByCitySignal(
  items: { Municipality: string; UnitPrice: string }[],
  historicalPrices: Map<string, number>,
): FreshSignalMap {
  const cityPrices = new Map<string, number[]>();

  for (const t of items) {
    const price = parseInt(t.UnitPrice?.replace(/,/g, '') ?? '0', 10);
    if (price <= 0 || !t.Municipality) continue;
    const arr = cityPrices.get(t.Municipality) ?? [];
    arr.push(price);
    cityPrices.set(t.Municipality, arr);
  }

  const result: FreshSignalMap = {};
  const fetchedAt = new Date().toISOString();

  for (const [city, prices] of cityPrices) {
    const med = median(prices);
    const historical = historicalPrices.get(city);
    const delta =
      historical && historical > 0 ? Math.round(((med - historical) / historical) * 1000) / 10 : 0;

    result[city] = {
      sampleCount: prices.length,
      medianPricePerSqm: med,
      deltaVsHistorical: delta,
      fetchedAt,
    };
  }

  return result;
}
