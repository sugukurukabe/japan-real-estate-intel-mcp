import type { ArbitrageScanInput, ArbitrageScanOutput, ArbitrageSignalItem } from '../schemas.js';
import { getLoader } from '../data-loaders/index.js';
import { resolvePrefecture, getPrefectureDisplayName } from '../prefecture/resolver.js';
import { ATTRIBUTION } from '../data/attribution.js';
import {
  computeTriangulationForCity,
  tryFetchLiveTransactionMedian,
  buildMarkdownReport,
  BENCHMARK,
} from '../analysis/price_triangulation.js';

export async function detectArbitrageSignals(
  input: ArbitrageScanInput,
): Promise<ArbitrageScanOutput> {
  const prefKey = resolvePrefecture(input.prefecture);
  const loader = getLoader(prefKey);
  const prefName = getPrefectureDisplayName(prefKey);
  const cities = loader.getCities();

  const items: ArbitrageSignalItem[] = [];
  let latestDataYear = new Date().getFullYear() - 1;

  for (const city of cities) {
    let result = computeTriangulationForCity(loader, city);
    if (!result) continue;

    // Optionally refresh transaction median via MLIT live API
    if (input.includeLive) {
      const liveMedian = await tryFetchLiveTransactionMedian(prefKey, city);
      if (liveMedian !== null) {
        const koji = result.koji;
        const transactionKojiRatio = Math.round((liveMedian / koji) * 1000) / 1000;
        const assessmentGap = liveMedian - result.rosenka;
        // Re-classify with fresh data
        const newSignal =
          transactionKojiRatio < 0.95
            ? ('discount' as const)
            : result.rosenkaKojiRatio < 0.75
              ? ('inheritance_edge' as const)
              : transactionKojiRatio > 1.3
                ? ('overheated' as const)
                : ('fair' as const);
        result = {
          ...result,
          transactionMedian: liveMedian,
          transactionKojiRatio,
          assessmentGap,
          signal: newSignal,
        };
      }
    }

    latestDataYear = Math.max(latestDataYear, result.dataYear);

    // Apply signal type filter (undefined or 'all' means include everything)
    const filterSignal = input.signalType as string | undefined;
    if (filterSignal && filterSignal !== 'all' && result.signal !== filterSignal) continue;

    items.push({
      city: result.city,
      rosenka: result.rosenka,
      koji: result.koji,
      transactionMedian: result.transactionMedian,
      rosenkaKojiRatio: result.rosenkaKojiRatio,
      transactionKojiRatio: result.transactionKojiRatio,
      assessmentGap: result.assessmentGap,
      signal: result.signal,
      interpretation: result.interpretation,
    });
  }

  // Sort: discount first, then inheritance_edge, then overheated, then fair
  const signalOrder: Record<string, number> = {
    discount: 0,
    inheritance_edge: 1,
    overheated: 2,
    fair: 3,
  };
  items.sort((a, b) => {
    const orderDiff = (signalOrder[a.signal] ?? 99) - (signalOrder[b.signal] ?? 99);
    if (orderDiff !== 0) return orderDiff;
    // Within same signal, sort discount/overheated by gap magnitude
    return Math.abs(b.assessmentGap) - Math.abs(a.assessmentGap);
  });

  const limitedItems = items.slice(0, input.limit);
  const liveDataUsed = input.includeLive && !!process.env.MLIT_API_KEY;
  const markdownReport = buildMarkdownReport(
    prefName,
    limitedItems,
    cities.length,
    latestDataYear,
    liveDataUsed,
  );

  return {
    prefecture: prefName,
    scannedCities: cities.length,
    items: limitedItems,
    benchmark: BENCHMARK,
    markdownReport,
    dataYear: latestDataYear,
    liveDataUsed,
    attribution: ATTRIBUTION,
  };
}
