import type { PriceTrend } from '../schemas.js';
import type { LandPriceRecord, TransactionRecord } from '../data-loaders/types.js';

export function computePriceTrend(
  landPrices: LandPriceRecord[],
  transactions: TransactionRecord[],
): PriceTrend {
  if (landPrices.length === 0 && transactions.length === 0) {
    return { current: 0, changeRate: 0, forecast: 'データ不足のため予測不可' };
  }

  const prices =
    landPrices.length > 0
      ? landPrices.map((r) => ({ year: r.year, price: r.price_per_sqm }))
      : transactions.map((r) => ({ year: r.year, price: r.price_per_sqm }));

  const sorted = [...prices].sort((a, b) => a.year - b.year);
  const current = sorted[sorted.length - 1]?.price ?? 0;

  const yearGroups = new Map<number, number[]>();
  for (const p of sorted) {
    const arr = yearGroups.get(p.year) ?? [];
    arr.push(p.price);
    yearGroups.set(p.year, arr);
  }

  const yearAvgs = [...yearGroups.entries()]
    .map(([year, vals]) => ({ year, avg: vals.reduce((s, v) => s + v, 0) / vals.length }))
    .sort((a, b) => a.year - b.year);

  let changeRate = 0;
  if (yearAvgs.length >= 2) {
    const first = yearAvgs[0].avg;
    const last = yearAvgs[yearAvgs.length - 1].avg;
    const years = yearAvgs[yearAvgs.length - 1].year - yearAvgs[0].year;
    changeRate = years > 0 ? ((last - first) / first) * 100 : 0;
  }

  const annualChange =
    yearAvgs.length >= 2 ? changeRate / (yearAvgs[yearAvgs.length - 1].year - yearAvgs[0].year) : 0;

  let forecast: string;
  if (annualChange > 2) {
    forecast = `上昇傾向（年率約${annualChange.toFixed(1)}%）が続く見込み。駅近・再開発エリアが牽引。`;
  } else if (annualChange > 0) {
    forecast = `緩やかな上昇（年率約${annualChange.toFixed(1)}%）。安定的な市場環境。`;
  } else if (annualChange > -2) {
    forecast = `横ばいから微減傾向（年率約${annualChange.toFixed(1)}%）。需要動向に注視が必要。`;
  } else {
    forecast = `下落傾向（年率約${annualChange.toFixed(1)}%）。構造的な供給過剰や人口減少の影響。`;
  }

  return {
    current: Math.round(current),
    changeRate: Math.round(changeRate * 10) / 10,
    forecast,
  };
}

export function computePriceHistory(
  landPrices: LandPriceRecord[],
): { year: number; price: number }[] {
  const yearGroups = new Map<number, number[]>();
  for (const r of landPrices) {
    const arr = yearGroups.get(r.year) ?? [];
    arr.push(r.price_per_sqm);
    yearGroups.set(r.year, arr);
  }
  return [...yearGroups.entries()]
    .map(([year, vals]) => ({
      year,
      price: Math.round(vals.reduce((s, v) => s + v, 0) / vals.length),
    }))
    .sort((a, b) => a.year - b.year);
}
