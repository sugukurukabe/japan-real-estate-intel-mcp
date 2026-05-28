import type { CorporateLocationRecord, HumanFlowRecord } from '../data-loaders/types.js';

interface CorporateDemandResult {
  totalEstablishments: number;
  majorCompanyCount: number;
  employeeTotal: number;
  avgCommuteMinutes: number;
  industryMix: { industry: string; share: number }[];
  demandScore: number;
  rentabilityScore: number;
  growthPotential: 'high' | 'medium' | 'low';
  humanFlowAlignment: number;
  insights: string[];
  recommendations: string[];
}

export function computeCorporateDemand(
  corporate: CorporateLocationRecord[],
  humanFlow: HumanFlowRecord[],
  propertyType: string,
  area: string,
): CorporateDemandResult {
  const totalEstablishments = corporate.reduce((s, r) => s + r.total_establishments, 0);
  const majorCompanyCount = corporate.reduce((s, r) => s + r.major_company_count, 0);
  const employeeTotal = corporate.reduce((s, r) => s + r.employee_total, 0);
  const avgCommuteMinutes =
    corporate.length > 0
      ? Math.round(corporate.reduce((s, r) => s + r.avg_commute_minutes, 0) / corporate.length)
      : 35;

  const industryMap = new Map<string, number>();
  for (const r of corporate) {
    industryMap.set(r.top_industry, (industryMap.get(r.top_industry) ?? 0) + r.industry_share);
  }
  const industryMix = [...industryMap.entries()]
    .map(([industry, share]) => ({
      industry,
      share: Math.round((share / corporate.length) * 100) / 100,
    }))
    .sort((a, b) => b.share - a.share)
    .slice(0, 5);

  let demandScore = 0;
  if (propertyType === 'office') {
    demandScore = Math.min(40, totalEstablishments / 500);
    demandScore += Math.min(25, majorCompanyCount * 2);
    demandScore += Math.min(15, employeeTotal / 20000);
    demandScore += avgCommuteMinutes < 25 ? 15 : avgCommuteMinutes < 35 ? 10 : 5;
  } else if (propertyType === 'logistics') {
    demandScore = Math.min(30, employeeTotal / 15000);
    demandScore += Math.min(20, totalEstablishments / 400);
    demandScore += avgCommuteMinutes > 30 ? 10 : 5;
    const hasManufacturing = industryMix.some(
      (i) => i.industry.includes('製造') || i.industry.includes('卸売'),
    );
    if (hasManufacturing) demandScore += 20;
  } else {
    demandScore = Math.min(35, employeeTotal / 10000);
    demandScore += Math.min(20, totalEstablishments / 300);
    demandScore += Math.min(15, majorCompanyCount * 1.5);
  }

  const avgVacancy =
    corporate.length > 0
      ? corporate.reduce((s, r) => s + r.office_vacancy_rate, 0) / corporate.length
      : 10;
  const rentabilityScore = Math.round(
    Math.max(0, Math.min(100, demandScore * 0.6 + (100 - avgVacancy * 8) * 0.4)),
  );

  const growthPotential: 'high' | 'medium' | 'low' =
    demandScore >= 65 ? 'high' : demandScore >= 35 ? 'medium' : 'low';

  const avgWeekdayFlow =
    humanFlow.length > 0
      ? humanFlow.reduce((s, r) => s + r.weekday_avg_flow, 0) / humanFlow.length
      : 0;
  const humanFlowAlignment = Math.round(
    Math.min(100, (avgWeekdayFlow / 1500) * (demandScore / 100) * 100),
  );

  const insights: string[] = [];
  insights.push(
    `${area}の事業所数: ${totalEstablishments.toLocaleString()}、うち大企業${majorCompanyCount}社。`,
  );
  if (majorCompanyCount >= 10) {
    insights.push('大企業が集積するエリア。安定的な法人需要が見込めます。');
  }
  if (avgCommuteMinutes <= 25) {
    insights.push(`平均通勤時間${avgCommuteMinutes}分。アクセス良好で人材獲得に有利。`);
  } else if (avgCommuteMinutes >= 40) {
    insights.push(`平均通勤時間${avgCommuteMinutes}分。通勤負荷が法人誘致の障壁になる可能性。`);
  }
  if (avgVacancy > 10) {
    insights.push(`空室率${avgVacancy.toFixed(1)}%。供給過剰の兆候に注意。`);
  }

  const recommendations: string[] = [];
  if (demandScore >= 65) {
    recommendations.push('法人需要が高いエリア。オフィス・商業投資に適しています。');
  } else if (demandScore >= 35) {
    recommendations.push('中程度の法人需要。テナント確保にはマーケティング強化が必要。');
  } else {
    recommendations.push('法人需要は限定的。住宅用途や特殊用途への転換を検討してください。');
  }
  if (propertyType === 'logistics' && growthPotential !== 'low') {
    recommendations.push('製造業集積地に近く、物流施設需要のポテンシャルあり。');
  }

  return {
    totalEstablishments,
    majorCompanyCount,
    employeeTotal,
    avgCommuteMinutes,
    industryMix,
    demandScore: Math.round(Math.max(0, Math.min(100, demandScore))),
    rentabilityScore,
    growthPotential,
    humanFlowAlignment,
    insights,
    recommendations,
  };
}
