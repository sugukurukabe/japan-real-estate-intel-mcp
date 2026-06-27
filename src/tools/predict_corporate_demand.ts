import type { CorporateDemandInput, CorporateDemandOutput } from '../schemas.js';
import { resolvePrefecture } from '../prefecture/resolver.js';
import { getLoader } from '../data-loaders/index.js';
import { getCorporateForCity, getHumanFlowForCity } from '../data/loader.js';
import { computeCorporateDemand } from '../analysis/corporate_demand.js';

export function predictCorporateDemand(input: CorporateDemandInput): CorporateDemandOutput {
  const prefKey = resolvePrefecture(input.prefecture);
  const loader = getLoader(prefKey);
  const { area, propertyType } = input;

  const corporate = loader.capabilities.corporate ? getCorporateForCity(area, prefKey) : [];
  const humanFlow = loader.capabilities.humanFlow ? getHumanFlowForCity(area, prefKey) : [];
  const result = computeCorporateDemand(corporate, humanFlow, propertyType, area);

  if (!loader.capabilities.corporate) {
    result.insights.unshift(
      `${loader.displayName}では企業立地データを提供していません。汎用推定値を使用しています。`,
    );
  }

  const summary = [
    `${loader.displayName} ${area}の法人需要分析（${propertyType}）。`,
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
