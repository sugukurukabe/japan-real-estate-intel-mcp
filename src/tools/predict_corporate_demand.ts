import type { CorporateDemandInput, CorporateDemandOutput } from '../schemas.js';
import {
  getCorporateForCity,
  getHumanFlowForCity,
} from '../data/loader.js';
import { computeCorporateDemand } from '../analysis/corporate_demand.js';

export function predictCorporateDemand(input: CorporateDemandInput): CorporateDemandOutput {
  const { area, propertyType } = input;

  const corporate = getCorporateForCity(area);
  const humanFlow = getHumanFlowForCity(area);
  const result = computeCorporateDemand(corporate, humanFlow, propertyType, area);

  const summary = [
    `${area}の法人需要分析（${propertyType}）。`,
    `事業所数: ${result.totalEstablishments.toLocaleString()}、`,
    `大企業: ${result.majorCompanyCount}社、`,
    `従業者: ${result.employeeTotal.toLocaleString()}人。`,
    `法人需要スコア: ${result.demandScore}/100、成長性: ${result.growthPotential}。`,
  ].join(' ');

  return {
    summary,
    corporateMetrics: {
      totalEstablishments: result.totalEstablishments,
      majorCompanyCount: result.majorCompanyCount,
      employeeTotal: result.employeeTotal,
      avgCommuteMinutes: result.avgCommuteMinutes,
      industryMix: result.industryMix,
    },
    demandScore: result.demandScore,
    rentabilityScore: result.rentabilityScore,
    growthPotential: result.growthPotential,
    humanFlowAlignment: result.humanFlowAlignment,
    keyInsights: result.insights,
    recommendations: result.recommendations,
  };
}
