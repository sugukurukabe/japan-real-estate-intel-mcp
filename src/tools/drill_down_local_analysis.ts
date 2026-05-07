import type { DrillDownInput, DrillDownOutput } from '../schemas.js';
import { buildLocalDrillDown } from '../analysis/local_drilldown.js';
import { drillDownToXlsxBase64 } from '../export/excel.js';

export function drillDownLocalAnalysis(input: DrillDownInput): DrillDownOutput {
  const result = buildLocalDrillDown(input);

  if (input.exportFormat !== 'xlsx') {
    return result;
  }

  const xlsxBase64 = drillDownToXlsxBase64(result);
  return { ...result, xlsxBase64 };
}
