import type { ComparePrefecturesInput, ComparePrefecturesOutput } from '../schemas.js';
import { analyzePrefecturesForComparison } from '../analysis/comparison.js';
import { comparePrefecturesToXlsxBase64 } from '../export/excel.js';

/**
 * `xlsxBase64` is intentionally NOT part of the `ComparePrefecturesOutput` Zod
 * schema (and therefore never lands in `structuredContent`/model transcript):
 * src/server.ts pulls it off this wider return type, persists it via
 * src/artifacts.ts, and returns a `resource_link` content block instead.
 */
export function comparePrefectures(
  input: ComparePrefecturesInput,
): ComparePrefecturesOutput & { xlsxBase64?: string } {
  const result = analyzePrefecturesForComparison(input);

  if (input.exportFormat !== 'xlsx') {
    return result;
  }

  const xlsxBase64 = comparePrefecturesToXlsxBase64(result);
  return { ...result, xlsxBase64 };
}
