import type { GenerateReportInput, GenerateReportOutput } from '../schemas.js';
import { resolvePrefecture } from '../prefecture/resolver.js';
import { getPopulationForCity } from '../data/loader.js';
import { crossAnalyze } from './cross_analyze_real_estate_market.js';
import { generateMarkdownReport } from '../analysis/report.js';

export function generateAreaReport(input: GenerateReportInput): GenerateReportOutput {
  const prefKey = resolvePrefecture(input.prefecture);

  const analysis = crossAnalyze({
    prefecture: input.prefecture,
    area: input.area,
    propertyType: 'mixed',
    timeRange: '3y',
    includeRisk: true,
    includeHumanFlow: true,
    includeEducation: false,
    includeCorporate: false,
    includeTransport: false,
    includeCommercial: false,
    includeMedical: false,
  });

  const population = getPopulationForCity(input.area, prefKey);

  return generateMarkdownReport({
    area: input.area,
    purpose: input.purpose,
    analysis,
    population,
    includeCharts: input.includeCharts,
  });
}
