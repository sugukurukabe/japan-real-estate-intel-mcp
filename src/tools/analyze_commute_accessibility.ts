import type { AnalyzeCommuteAccessibilityInput, AnalyzeCommuteAccessibilityOutput } from '../schemas.js';
import { analyzeCommuteAccessibility } from '../analysis/commute_accessibility.js';

export async function analyzeCommuteAccessibilityTool(input: AnalyzeCommuteAccessibilityInput): Promise<AnalyzeCommuteAccessibilityOutput> {
  return analyzeCommuteAccessibility(input);
}
