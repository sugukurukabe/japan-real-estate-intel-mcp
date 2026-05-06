import type { GenerateReportInput, GenerateReportOutput } from '../schemas.js';
import { getPopulationForCity } from '../data/loader.js';
import { crossAnalyze } from './cross_analyze_real_estate_market.js';
import { generateMarkdownReport } from '../analysis/report.js';

export function generateAreaReport(input: GenerateReportInput): GenerateReportOutput {
  const analysis = crossAnalyze({
    area: input.area,
    propertyType: 'mixed',
    timeRange: '3y',
    includeRisk: true,
  });

  const population = getPopulationForCity(input.area);

  return generateMarkdownReport({
    area: input.area,
    purpose: input.purpose,
    analysis,
    population,
    includeCharts: input.includeCharts,
  });
}
