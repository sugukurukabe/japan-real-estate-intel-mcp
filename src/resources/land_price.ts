import { getLandPricesForCity } from '../data/loader.js';
import { ATTRIBUTION } from '../data/attribution.js';

export function getLandPriceResource(city: string): string {
  const records = getLandPricesForCity(city);
  if (records.length === 0) {
    return JSON.stringify({ error: `${city}の地価公示データが見つかりません`, attribution: ATTRIBUTION });
  }

  const summary = {
    city,
    recordCount: records.length,
    years: [...new Set(records.map((r) => r.year))].sort(),
    averagePrice: Math.round(records.reduce((s, r) => s + r.price_per_sqm, 0) / records.length),
    records: records.slice(0, 50),
    attribution: ATTRIBUTION,
  };

  return JSON.stringify(summary, null, 2);
}
