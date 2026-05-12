import type {
  DiscoverOpportunitiesInput,
  DiscoverOpportunitiesOutput,
  OpportunitySignalType,
} from '../schemas.js';
import type { CityMetrics } from './opportunity_provider.js';
import { LocalCsvProvider } from './opportunity_provider.js';
import { resolvePrefecture, getPrefectureDisplayName } from '../prefecture/resolver.js';
import { getLoader } from '../data-loaders/index.js';
import type { VacancyRecord } from '../data-loaders/types.js';
import { computeTriangulationForCity } from './price_triangulation.js';
import { ATTRIBUTION } from '../data/attribution.js';

export type { CityMetrics };

const GOAL_WEIGHTS: Record<string, Record<string, number>> = {
  investment:   { price: 20, growth: 25, risk: 15, flow: 10, transport: 10, population: 10, corporate: 5, education: 0, commercial: 5, medical: 0 },
  store:        { price: 10, growth: 10, risk: 10, flow: 25, transport: 15, population: 10, corporate: 5, education: 0, commercial: 15, medical: 0 },
  family:       { price: 15, growth: 10, risk: 15, flow: 5,  transport: 10, population: 10, corporate: 0, education: 20, commercial: 5, medical: 10 },
  office:       { price: 15, growth: 15, risk: 10, flow: 10, transport: 15, population: 5, corporate: 20, education: 0, commercial: 5, medical: 5 },
  development:  { price: 25, growth: 20, risk: 15, flow: 10, transport: 10, population: 10, corporate: 5, education: 0, commercial: 5, medical: 0 },
};

function computePriceComponent(m: CityMetrics, allMetrics: CityMetrics[]): number {
  if (m.avgPricePerSqm == null) return 50;
  const prices = allMetrics.filter(x => x.avgPricePerSqm != null).map(x => x.avgPricePerSqm!);
  if (prices.length < 2) return 50;
  const median = prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)];
  const ratio = m.avgPricePerSqm / median;
  return Math.max(0, Math.min(100, (2 - ratio) * 50));
}

function computeGrowthComponent(m: CityMetrics): number {
  let score = 50;
  if (m.avgChangeRate != null) {
    score = Math.max(0, Math.min(100, 50 + m.avgChangeRate * 10));
  }
  if (m.population) {
    const popGrowth = ((m.population.population_2025 - m.population.population_2020) / Math.max(1, m.population.population_2020)) * 100;
    score = Math.max(0, Math.min(100, score * 0.6 + (50 + popGrowth * 10) * 0.4));
  }
  return score;
}

export function computeRiskComponent(m: CityMetrics): number {
  let score = 60;
  if (m.earthquake) {
    const intensityPenalty: Record<string, number> = { '7': 50, '6強': 40, '6弱': 30, '5強': 20, '5弱': 10, '4': 5 };
    score -= intensityPenalty[m.earthquake.max_intensity] ?? 0;
    if (m.earthquake.liquefaction_risk === 'high') score -= 15;
    else if (m.earthquake.liquefaction_risk === 'medium') score -= 5;
  }
  if (m.crime) {
    score = score * 0.6 + m.crime.safety_score * 0.4;
  }
  return Math.max(0, Math.min(100, score));
}

function computeFlowComponent(m: CityMetrics): number {
  if (!m.humanFlow) return 50;
  const trendBonus = m.humanFlow.trend === 'increasing' ? 15 : m.humanFlow.trend === 'decreasing' ? -10 : 0;
  return Math.max(0, Math.min(100, 50 + Math.log10(Math.max(1, m.humanFlow.weekdayAvg)) * 5 + trendBonus));
}

export function computeTransportComponent(m: CityMetrics): number {
  if (!m.transport) return 30;
  const stationScore = Math.min(50, m.transport.stationCount * 8);
  const passengerScore = Math.min(50, Math.log10(Math.max(1, m.transport.avgPassengers)) * 10);
  return Math.max(0, Math.min(100, stationScore + passengerScore));
}

function computePopulationComponent(m: CityMetrics): number {
  if (!m.population) return 50;
  const growth = ((m.population.population_2025 - m.population.population_2020) / Math.max(1, m.population.population_2020)) * 100;
  const densityScore = Math.min(40, Math.log10(Math.max(1, m.population.density_per_sqkm)) * 10);
  return Math.max(0, Math.min(100, 40 + growth * 8 + densityScore));
}

function computeCorporateComponent(m: CityMetrics): number {
  if (!m.corporate) return 30;
  const estScore = Math.min(50, Math.log10(Math.max(1, m.corporate.totalEstablishments)) * 12);
  const majorScore = Math.min(50, m.corporate.majorCompanies * 5);
  return Math.max(0, Math.min(100, estScore + majorScore));
}

function computeEducationComponent(m: CityMetrics): number {
  if (!m.education) return 50;
  return Math.max(0, Math.min(100, m.education.avgScore));
}

function computeCommercialComponent(m: CityMetrics): number {
  if (!m.commercial) return 30;
  return Math.max(0, Math.min(100, 30 + m.commercial.count * 4));
}

function computeMedicalComponent(m: CityMetrics): number {
  if (!m.medical) return 30;
  return Math.max(0, Math.min(100, 30 + m.medical.count * 5));
}

export function scoreCity(m: CityMetrics, allMetrics: CityMetrics[], goal: string): number {
  const w = GOAL_WEIGHTS[goal] ?? GOAL_WEIGHTS.investment;
  const components: Record<string, number> = {
    price: computePriceComponent(m, allMetrics),
    growth: computeGrowthComponent(m),
    risk: computeRiskComponent(m),
    flow: computeFlowComponent(m),
    transport: computeTransportComponent(m),
    population: computePopulationComponent(m),
    corporate: computeCorporateComponent(m),
    education: computeEducationComponent(m),
    commercial: computeCommercialComponent(m),
    medical: computeMedicalComponent(m),
  };
  let total = 0;
  let weightSum = 0;
  for (const [k, weight] of Object.entries(w)) {
    if (weight > 0) {
      total += components[k] * weight;
      weightSum += weight;
    }
  }
  return weightSum > 0 ? Math.round(total / weightSum) : 50;
}

export function detectSignal(m: CityMetrics, allMetrics: CityMetrics[], goal: string): OpportunitySignalType {
  const priceComp = computePriceComponent(m, allMetrics);
  const growthComp = computeGrowthComponent(m);
  const flowComp = computeFlowComponent(m);
  const commercialComp = computeCommercialComponent(m);
  const transportComp = computeTransportComponent(m);
  const corpComp = computeCorporateComponent(m);
  const eduComp = computeEducationComponent(m);
  const medComp = computeMedicalComponent(m);
  const popComp = computePopulationComponent(m);
  const riskComp = computeRiskComponent(m);

  if (goal === 'store' && flowComp > 65 && commercialComp < 50) return 'high_flow_low_commercial';
  if (goal === 'family' && eduComp > 65 && medComp > 55) return 'education_medical_hub';
  if (goal === 'office' && corpComp > 65) return 'corporate_momentum';
  if (priceComp > 60 && growthComp > 55) return 'undervalued_growth';
  if (transportComp > 70) return 'transit_oriented';
  if (popComp > 65) return 'population_inflow';
  if (riskComp > 70 && priceComp > 55) return 'low_risk_upside';
  return 'undervalued_growth';
}

export function buildWhyReasons(m: CityMetrics, signal: OpportunitySignalType): string[] {
  const reasons: string[] = [];
  if (m.avgPricePerSqm != null) reasons.push(`平均㎡単価 ¥${Math.round(m.avgPricePerSqm).toLocaleString()}`);
  if (m.avgChangeRate != null) reasons.push(`地価変動率 ${m.avgChangeRate > 0 ? '+' : ''}${m.avgChangeRate.toFixed(1)}%`);
  if (m.population) {
    const growth = ((m.population.population_2025 - m.population.population_2020) / Math.max(1, m.population.population_2020) * 100);
    reasons.push(`人口推移 ${growth > 0 ? '+' : ''}${growth.toFixed(1)}% (${m.population.population_2025.toLocaleString()}人)`);
  }
  if (m.humanFlow) reasons.push(`平日人流 ${Math.round(m.humanFlow.weekdayAvg).toLocaleString()} (${m.humanFlow.trend})`);
  if (m.transport) reasons.push(`駅数 ${m.transport.stationCount}, 平均乗降客 ${Math.round(m.transport.avgPassengers).toLocaleString()}`);
  if (m.education) reasons.push(`教育スコア ${m.education.avgScore.toFixed(0)}`);
  if (m.corporate) reasons.push(`事業所 ${m.corporate.totalEstablishments}, 大企業 ${m.corporate.majorCompanies}`);
  if (m.commercial) reasons.push(`商業施設 ${m.commercial.count}件`);
  if (m.medical) reasons.push(`医療施設 ${m.medical.count}件`);
  return reasons.slice(0, 5);
}

export function buildRisks(m: CityMetrics, vacancy?: VacancyRecord | null): string[] {
  const risks: string[] = [];
  if (m.earthquake) {
    if (['7', '6強', '6弱'].includes(m.earthquake.max_intensity)) risks.push(`地震想定震度 ${m.earthquake.max_intensity}`);
    if (m.earthquake.liquefaction_risk === 'high') risks.push('液状化リスク高');
  }
  if (m.crime && m.crime.safety_score < 50) risks.push(`治安スコア ${m.crime.safety_score}（低め）`);
  if (m.population && m.population.aging_rate > 30) risks.push(`高齢化率 ${m.population.aging_rate}%`);
  if (m.avgChangeRate != null && m.avgChangeRate < -2) risks.push(`地価下落傾向 ${m.avgChangeRate.toFixed(1)}%`);
  if (vacancy && vacancy.vacancy_rate > 15) risks.push(`空き家率 ${vacancy.vacancy_rate.toFixed(1)}%（高め）`);
  if (risks.length === 0) risks.push('特筆すべきリスクなし');
  return risks;
}

export function recommendedToolsForGoal(goal: string): string[] {
  const base = ['cross_analyze_real_estate_market', 'assess_property_risk'];
  switch (goal) {
    case 'investment': return [...base, 'forecast_land_price_trend', 'scenario_what_if', 'portfolio_optimizer'];
    case 'store': return [...base, 'evaluate_store_location', 'drill_down_local'];
    case 'family': return [...base, 'assess_family_friendly_score', 'drill_down_local'];
    case 'office': return [...base, 'predict_corporate_demand', 'drill_down_local'];
    case 'development': return [...base, 'forecast_land_price_trend', 'simulate_landscape_impact'];
    default: return base;
  }
}

export function budgetFilter(m: CityMetrics, budgetLevel: string): boolean {
  if (budgetLevel === 'any' || m.avgPricePerSqm == null) return true;
  switch (budgetLevel) {
    case 'low': return m.avgPricePerSqm < 150000;
    case 'middle': return m.avgPricePerSqm >= 150000 && m.avgPricePerSqm <= 500000;
    case 'high': return m.avgPricePerSqm > 500000;
    default: return true;
  }
}

export const SIGNAL_TITLES: Record<OpportunitySignalType, string> = {
  undervalued_growth: '割安×成長',
  high_flow_low_commercial: '高人流×商業空白',
  education_medical_hub: '教育医療充実',
  corporate_momentum: '法人集積',
  low_risk_upside: '低リスク×上昇余地',
  transit_oriented: '交通優位',
  population_inflow: '人口流入',
  declining_area: '衰退兆候（注意）',
  discount_arbitrage: '価格ディスカウント（割安裁定）',
};

export function scoreOpportunity(m: CityMetrics, allMetrics: CityMetrics[], goal: string): number {
  return scoreCity(m, allMetrics, goal);
}

function buildUiActions(city: string, _goal: string) {
  return [
    { label: '深掘り', tool: 'cross_analyze_real_estate_market', args: { area: city } },
    { label: 'What-if', tool: 'scenario_what_if', args: { area: city } },
    { label: 'レポート', tool: 'generate_area_report', args: { area: city } },
    { label: '地図', tool: 'open_dashboard', args: { area: city, mode: 'map' } },
  ];
}

/**
 * Synchronous backward-compatible entry point (no external freshness).
 * For the full async version with MLIT freshness support, use
 * `discoverOpportunitiesTool` from `src/tools/discover_opportunities.ts`.
 */
export function discoverOpportunities(input: DiscoverOpportunitiesInput): DiscoverOpportunitiesOutput {
  const provider = new LocalCsvProvider();
  const prefKey = resolvePrefecture(input.prefecture);
  const prefDisplay = getPrefectureDisplayName(prefKey);

  const cities = provider.getCities(prefKey);
  const rawData = provider.getAllRawData(prefKey);
  const allMetrics = cities.map(city => provider.getCityMetrics(prefKey, city));

  const loader = getLoader(prefKey);
  const allVacancy = loader.getVacancy();
  const matchVacancy = (city: string): VacancyRecord | null =>
    allVacancy.find(v => v.city.includes(city) || city.includes(v.city)) ?? null;

  const available: string[] = [];
  const missing: string[] = [];
  for (const [name, data] of Object.entries(rawData)) {
    (Array.isArray(data) && data.length > 0 ? available : missing).push(name);
  }

  // Pre-compute discount arbitrage flags from price triangulation
  const discountCities = new Set<string>();
  for (const m of allMetrics) {
    const tri = computeTriangulationForCity(loader, m.city);
    if (tri?.signal === 'discount') discountCities.add(m.city);
  }

  const filtered = allMetrics.filter(m => budgetFilter(m, input.budgetLevel));
  const scored = filtered.map(m => ({
    metrics: m,
    score: scoreCity(m, allMetrics, input.goal),
    signal: detectSignal(m, allMetrics, input.goal),
  }));

  scored.sort((a, b) => b.score - a.score);
  const topN = scored.slice(0, input.limit);

  const cards = topN.map(({ metrics: m, score, signal }) => {
    const cityVacancy = matchVacancy(m.city);
    const effectiveSignal: OpportunitySignalType =
      discountCities.has(m.city)
        ? 'discount_arbitrage'
        : (cityVacancy && cityVacancy.vacancy_rate > 20 && m.avgChangeRate != null && m.avgChangeRate < 0)
          ? 'declining_area'
          : signal;
    return {
      title: `${SIGNAL_TITLES[effectiveSignal]}：${m.city}`,
      city: m.city,
      score,
      signalType: effectiveSignal,
      why: buildWhyReasons(m, effectiveSignal),
      evidence: {
        pricePerSqm: m.avgPricePerSqm != null ? Math.round(m.avgPricePerSqm) : null,
        priceChangeRate: m.avgChangeRate != null ? Math.round(m.avgChangeRate * 10) / 10 : null,
        riskScore: m.earthquake ? Math.round(computeRiskComponent(m)) : null,
        humanFlowWeekday: m.humanFlow ? Math.round(m.humanFlow.weekdayAvg) : null,
        humanFlowTrend: m.humanFlow?.trend ?? null,
        educationScore: m.education ? Math.round(m.education.avgScore) : null,
        corporateCount: m.corporate?.totalEstablishments ?? null,
        transportScore: m.transport ? Math.round(computeTransportComponent(m)) : null,
        commercialFacilities: m.commercial?.count ?? null,
        medicalFacilities: m.medical?.count ?? null,
        population: m.population?.population_2025 ?? null,
        agingRate: m.population?.aging_rate ?? null,
        freshTransactionSignal: null,
      },
      risks: buildRisks(m, cityVacancy),
      recommendedTools: recommendedToolsForGoal(input.goal),
      uiActions: buildUiActions(m.city, input.goal),
    };
  });

  const goalLabel: Record<string, string> = {
    investment: '投資', store: '出店', family: '居住', office: 'オフィス', development: '開発',
  };

  const summary = `${prefDisplay}の${cities.length}市区町村を${goalLabel[input.goal] ?? input.goal}目的でスキャンし、上位${cards.length}件の機会を検出しました。`;

  const nextActions = [
    `上位エリアを cross_analyze_real_estate_market で詳細分析`,
    `scenario_what_if でリスクシナリオを試算`,
    `generate_area_report でレポート出力`,
  ];

  let markdownReport: string | undefined;
  if (input.includeMarkdown) {
    const lines = [`# Opportunity Radar: ${prefDisplay}`, '', `**目的**: ${goalLabel[input.goal] ?? input.goal}`, `**対象**: ${cities.length}市区町村`, ''];

    if (cards.length > 0) {
      lines.push('## スコアランキング', '', '```');
      for (const card of cards) {
        const filled = Math.round(card.score / 5);
        const bar = '█'.repeat(Math.max(1, filled)) + '░'.repeat(Math.max(0, 20 - filled));
        const medal = card.score >= 80 ? '🥇' : card.score >= 60 ? '🥈' : '🥉';
        lines.push(`${medal} ${card.title.padEnd(14)} ${bar} ${card.score}/100`);
      }
      lines.push('```', '');
    }

    lines.push('## 発見された機会', '');
    for (const card of cards) {
      const medal = card.score >= 80 ? '🥇' : card.score >= 60 ? '🥈' : '🥉';
      lines.push(`### ${medal} ${card.title} (スコア: ${card.score}/100)`);
      lines.push('');
      lines.push('**根拠:**');
      for (const w of card.why) lines.push(`- ${w}`);
      lines.push('');
      lines.push('**リスク:**');
      for (const r of card.risks) lines.push(`- ${r}`);
      lines.push('');
    }
    lines.push('## データカバレッジ', '');
    lines.push(`利用可能: ${available.join(', ')}`);
    if (missing.length > 0) lines.push(`未取得: ${missing.join(', ')}`);
    lines.push('', `---`, `出典: ${ATTRIBUTION}`);
    markdownReport = lines.join('\n');
  }

  return {
    summary,
    cards,
    dataCoverage: {
      prefecture: prefDisplay,
      citiesScanned: cities.length,
      availableMetrics: available,
      missingMetrics: missing,
    },
    nextActions,
    attribution: ATTRIBUTION,
    markdownReport,
  };
}
