import { getPopulation, getPopulationForCity } from '../data/loader.js';
import { ATTRIBUTION } from '../data/attribution.js';

export function getPopulationResource(area: string): string {
  if (area === '愛知県全体') {
    const all = getPopulation();
    return JSON.stringify({ recordCount: all.length, records: all, attribution: ATTRIBUTION }, null, 2);
  }

  const record = getPopulationForCity(area);
  if (!record) {
    return JSON.stringify({ error: `${area}の人口データが見つかりません`, attribution: ATTRIBUTION });
  }

  return JSON.stringify({ ...record, attribution: ATTRIBUTION }, null, 2);
}
