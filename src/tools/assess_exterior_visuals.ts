import type { AssessExteriorVisualsInput, AssessExteriorVisualsOutput } from '../schemas.js';
import { analyzeExteriorVisuals } from '../analysis/exterior_visuals.js';

export async function assessExteriorVisuals(input: AssessExteriorVisualsInput): Promise<AssessExteriorVisualsOutput> {
  return analyzeExteriorVisuals(input);
}
