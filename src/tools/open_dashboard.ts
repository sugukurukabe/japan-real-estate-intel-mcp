import type { OpenDashboardInput, OpenDashboardOutput } from '../schemas.js';
import { ATTRIBUTION } from '../data/attribution.js';

export function openDashboard(input: OpenDashboardInput): OpenDashboardOutput {
  return {
    area: input.area ?? '愛知県全体',
    layer: input.layer ?? 'land_price',
    attribution: ATTRIBUTION,
  };
}
