import type { ComparePrefecturesInput, ComparePrefecturesOutput } from '../schemas.js';
import { analyzePrefecturesForComparison } from '../analysis/comparison.js';
import { comparePrefecturesToXlsxBase64 } from '../export/excel.js';

export function comparePrefectures(input: ComparePrefecturesInput): ComparePrefecturesOutput {
  const result = analyzePrefecturesForComparison(input);

  if (input.exportFormat !== 'xlsx') {
    return result;
  }

  const xlsxBase64 = comparePrefecturesToXlsxBase64(result);
  return { ...result, xlsxBase64 };
}
