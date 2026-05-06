import type { OpenDashboardInput, OpenDashboardOutput } from '../schemas.js';
import { resolvePrefecture, getPrefectureDisplayName } from '../prefecture/resolver.js';
import { ATTRIBUTION } from '../data/attribution.js';

export function openDashboard(input: OpenDashboardInput): OpenDashboardOutput {
  const prefKey = resolvePrefecture(input.prefecture ?? '愛知県');
  return {
    area: input.area ?? `${getPrefectureDisplayName(prefKey)}全体`,
    layer: input.layer ?? 'land_price',
    prefecture: prefKey,
    attribution: ATTRIBUTION,
  };
}
