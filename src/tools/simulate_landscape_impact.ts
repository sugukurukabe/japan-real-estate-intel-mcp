import type { LandscapeInput, LandscapeOutput } from '../schemas.js';
import { simulateLandscapeImpact } from '../analysis/shadow.js';

export function simulateLandscape(input: LandscapeInput): LandscapeOutput {
  return simulateLandscapeImpact(input);
}
