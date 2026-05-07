import type { OpenDashboardInput, OpenDashboardOutput } from '../schemas.js';
import { resolvePrefecture, getPrefectureDisplayName } from '../prefecture/resolver.js';
import { ATTRIBUTION } from '../data/attribution.js';

export function openDashboard(input: OpenDashboardInput): OpenDashboardOutput {
  const prefKey = resolvePrefecture(input.prefecture ?? '愛知県');
  const mode = input.mode ?? '2d';
  return {
    area: input.area ?? `${getPrefectureDisplayName(prefKey)}全体`,
    layer: input.layer ?? (mode === '3d' ? 'plateau_3d' : 'land_price'),
    prefecture: prefKey,
    attribution: ATTRIBUTION,
    mode,
  };
}
