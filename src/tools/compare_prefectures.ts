import type { ComparePrefecturesInput, ComparePrefecturesOutput } from '../schemas.js';
import { analyzePrefecturesForComparison } from '../analysis/comparison.js';

export function comparePrefectures(input: ComparePrefecturesInput): ComparePrefecturesOutput {
  return analyzePrefecturesForComparison(input);
}
