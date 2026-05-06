import { getLandPricesForCity } from '../data/loader.js';
import { ATTRIBUTION } from '../data/attribution.js';
import { resolvePrefecture, getPrefectureDisplayName } from '../prefecture/resolver.js';

export function getLandPriceResource(prefecture: string, city: string): string {
  const prefKey = resolvePrefecture(prefecture);
  const records = getLandPricesForCity(city, prefKey);
  if (records.length === 0) {
    return JSON.stringify({
      error: `${getPrefectureDisplayName(prefKey)} ${city}の地価公示データが見つかりません`,
      attribution: ATTRIBUTION,
    });
  }

  const summary = {
    prefecture: getPrefectureDisplayName(prefKey),
    city,
    recordCount: records.length,
    years: [...new Set(records.map((r) => r.year))].sort(),
    averagePrice: Math.round(records.reduce((s, r) => s + r.price_per_sqm, 0) / records.length),
    records: records.slice(0, 50),
    attribution: ATTRIBUTION,
  };

  return JSON.stringify(summary, null, 2);
}
