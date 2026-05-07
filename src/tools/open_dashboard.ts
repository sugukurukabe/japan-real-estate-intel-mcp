import type { OpenDashboardInput, OpenDashboardOutput } from '../schemas.js';
import { resolvePrefecture, getPrefectureDisplayName } from '../prefecture/resolver.js';
import { ATTRIBUTION } from '../data/attribution.js';

export function openDashboard(input: OpenDashboardInput): OpenDashboardOutput {
  const prefKey = resolvePrefecture(input.prefecture ?? '愛知県');
  const mode = input.mode ?? '2d';
  const initialMode = input.initialMode;

  // Default layer changes based on initialMode
  let defaultLayer = mode === '3d' ? 'plateau_3d' : 'land_price';
  if (initialMode === 'store') {
    defaultLayer = 'human_flow';
  }
  const layer = input.layer ?? defaultLayer;

  // Build dashboard URL hint for MCP Apps (includes ?mode= param when specified)
  const modeParam = initialMode ? `?mode=${initialMode}` : '';
  const dashboardUrl = `dashboard.html${modeParam}`;

  return {
    area: input.area ?? `${getPrefectureDisplayName(prefKey)}全体`,
    layer,
    prefecture: prefKey,
    attribution: ATTRIBUTION,
    mode,
    ...(initialMode ? { initialMode } : {}),
    dashboardUrl,
  };
}
