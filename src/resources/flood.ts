import { getFloodZones } from '../data/loader.js';
import { ATTRIBUTION } from '../data/attribution.js';

export function getFloodResource(area: string): string {
  const fc = getFloodZones();
  const filtered = {
    ...fc,
    features: fc.features.filter(
      (f: { properties?: Record<string, unknown> | null }) =>
        (f.properties?.area_name as string)?.includes(area) ||
        (f.properties?.name as string)?.includes(area) ||
        area === '愛知県全体',
    ),
  };

  return JSON.stringify(
    {
      featureCount: filtered.features.length,
      geojson: filtered,
      attribution: ATTRIBUTION,
    },
    null,
    2,
  );
}
