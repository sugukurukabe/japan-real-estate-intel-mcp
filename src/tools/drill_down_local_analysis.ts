import type { DrillDownInput, DrillDownOutput } from '../schemas.js';
import { buildLocalDrillDown } from '../analysis/local_drilldown.js';

export function drillDownLocalAnalysis(input: DrillDownInput): DrillDownOutput {
  return buildLocalDrillDown(input);
}
