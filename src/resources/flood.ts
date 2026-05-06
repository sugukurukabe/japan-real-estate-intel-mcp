import { getFloodZones } from '../data/loader.js';
import { ATTRIBUTION } from '../data/attribution.js';
import { resolvePrefecture, getPrefectureDisplayName } from '../prefecture/resolver.js';

export function getFloodResource(prefecture: string, area: string): string {
  const prefKey = resolvePrefecture(prefecture);
  const displayName = getPrefectureDisplayName(prefKey);
  const fc = getFloodZones(prefKey);
  const isAll = area === `${displayName}全体` || area === '全体';
  const filtered = {
    ...fc,
    features: fc.features.filter(
      (f: { properties?: Record<string, unknown> | null }) =>
        isAll ||
        (f.properties?.area_name as string)?.includes(area) ||
        (f.properties?.name as string)?.includes(area),
    ),
  };

  return JSON.stringify(
    {
      prefecture: displayName,
      featureCount: filtered.features.length,
      geojson: filtered,
      attribution: ATTRIBUTION,
    },
    null,
    2,
  );
}
