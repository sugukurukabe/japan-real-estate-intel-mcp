import { getPopulation, getPopulationForCity } from '../data/loader.js';
import { ATTRIBUTION } from '../data/attribution.js';
import { resolvePrefecture, getPrefectureDisplayName } from '../prefecture/resolver.js';

export function getPopulationResource(prefecture: string, area: string): string {
  const prefKey = resolvePrefecture(prefecture);
  const displayName = getPrefectureDisplayName(prefKey);
  const isAll = area === `${displayName}全体` || area === '全体';

  if (isAll) {
    const all = getPopulation(prefKey);
    return JSON.stringify(
      { prefecture: displayName, recordCount: all.length, records: all, attribution: ATTRIBUTION },
      null,
      2,
    );
  }

  const record = getPopulationForCity(area, prefKey);
  if (!record) {
    return JSON.stringify({
      error: `${displayName} ${area}の人口データが見つかりません`,
      attribution: ATTRIBUTION,
    });
  }

  return JSON.stringify({ prefecture: displayName, ...record, attribution: ATTRIBUTION }, null, 2);
}
