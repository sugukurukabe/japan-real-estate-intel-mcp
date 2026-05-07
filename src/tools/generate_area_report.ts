import type { GenerateReportInput, GenerateReportOutput } from '../schemas.js';
import { resolvePrefecture } from '../prefecture/resolver.js';
import { getPopulationForCity } from '../data/loader.js';
import { crossAnalyze } from './cross_analyze_real_estate_market.js';
import { generateMarkdownReport } from '../analysis/report.js';
import { markdownToPdfBase64 } from '../export/pdf.js';

export async function generateAreaReport(input: GenerateReportInput): Promise<GenerateReportOutput> {
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

  const base = generateMarkdownReport({
    area: input.area,
    purpose: input.purpose,
    analysis,
    population,
    includeCharts: input.includeCharts,
  });

  if (input.format !== 'pdf') {
    return base;
  }

  const pdfBase64 = await markdownToPdfBase64(
    base.markdownReport,
    `${input.area} エリアレポート`,
  );

  return { ...base, pdfBase64 };
}
