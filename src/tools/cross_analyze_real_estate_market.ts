import type { CrossAnalyzeInput, CrossAnalyzeOutput } from '../schemas.js';
import { resolvePrefecture } from '../prefecture/resolver.js';
import { getLoader } from '../data-loaders/index.js';
import {
  getLandPricesForCity,
  getTransactionsForCity,
  getPopulationForCity,
  getHumanFlowForCity,
  getSchoolDistrictsForCity,
  getCorporateForCity,
  filterByPropertyType,
  filterByTimeRange,
} from '../data/loader.js';
import { computePriceTrend, computePriceHistory } from '../analysis/price_trend.js';
import { computeRisk } from '../analysis/risk_score.js';
import { computeInvestmentScore, generateKeyInsights } from '../analysis/investment_score.js';
import { computeHumanFlowMetrics, computeRealDemandScore, computeVacancyRiskScore } from '../analysis/human_flow.js';
import { geocode } from '../data/geocode.js';

export function crossAnalyze(input: CrossAnalyzeInput): CrossAnalyzeOutput {
  const prefKey = resolvePrefecture(input.prefecture);
  const loader = getLoader(prefKey);
  const { area, propertyType, timeRange, includeRisk, includeHumanFlow, includeEducation, includeCorporate } = input;

  const landPrices = filterByTimeRange(getLandPricesForCity(area, prefKey), timeRange);
  const allTransactions = getTransactionsForCity(area, prefKey);
  const transactions = filterByTimeRange(
    filterByPropertyType(allTransactions, propertyType),
    timeRange,
  );
  const population = getPopulationForCity(area, prefKey);

  const priceTrend = computePriceTrend(landPrices, transactions);
  const priceHistory = computePriceHistory(landPrices);

  let riskScore = 0;
  let riskBreakdown: { category: string; score: number }[] = [];

  if (includeRisk) {
    const coords = geocode(area, prefKey);
    if (coords) {
      const risk = computeRisk(coords.lat, coords.lng, area, ['all'], prefKey);
      riskScore = risk.overallScore;
      riskBreakdown = [
        { category: '浸水リスク', score: risk.floodRisk.level === 'high' ? 80 : risk.floodRisk.level === 'medium' ? 50 : 10 },
        { category: '土砂災害', score: risk.landslideRisk.level === 'high' ? 70 : risk.landslideRisk.level === 'medium' ? 35 : 5 },
        { category: '地震リスク', score: risk.earthquakeRisk.intensity === '7' ? 95 : risk.earthquakeRisk.intensity === '6強' ? 80 : 50 },
      ];
    }
  }

  const baseInvestment = computeInvestmentScore({
    priceChangeRate: priceTrend.changeRate,
    riskScore,
    population,
    propertyType,
  });

  const keyInsights = generateKeyInsights({
    priceChangeRate: priceTrend.changeRate,
    riskScore,
    investmentScore: baseInvestment,
    population,
    propertyType,
    area,
  });

  let humanFlowData: CrossAnalyzeOutput['humanFlow'];
  let realDemandScore: number | undefined;
  let vacancyRiskScore: number | undefined;
  let investmentScore = baseInvestment;

  if (includeHumanFlow) {
    if (loader.capabilities.humanFlow) {
      const flowRecords = getHumanFlowForCity(area, prefKey);
      if (flowRecords.length > 0) {
        const hf = computeHumanFlowMetrics(flowRecords);
        humanFlowData = hf;
        realDemandScore = computeRealDemandScore(hf, propertyType);
        vacancyRiskScore = computeVacancyRiskScore(hf, propertyType);

        investmentScore = Math.round(Math.max(0, Math.min(100,
          baseInvestment * 0.6 + realDemandScore * 0.3 + (100 - vacancyRiskScore) * 0.1,
        )));

        if (hf.weekdayAvgFlow > 50000) {
          keyInsights.push(`平日人流${hf.weekdayAvgFlow.toLocaleString()}人/日。商業エリアとして高い集客力。`);
        }
        if (hf.flowTrend === 'increasing') {
          keyInsights.push('人流が増加トレンド。エリアの活性化が進行中。');
        } else if (hf.flowTrend === 'decreasing') {
          keyInsights.push('人流が減少傾向。エリアの衰退リスクを検討。');
        }
      }
    } else {
      keyInsights.push(`${loader.displayName}の人流データは v2.x で対応予定です。`);
    }
  }

  let educationSummary: CrossAnalyzeOutput['educationSummary'];
  if (includeEducation) {
    if (loader.capabilities.education) {
      const schools = getSchoolDistrictsForCity(area, prefKey);
      if (schools.length > 0) {
        const avgScore = Math.round(schools.reduce((s, r) => s + r.education_score, 0) / schools.length);
        const top = schools.reduce((a, b) => (a.education_score > b.education_score ? a : b));
        educationSummary = { avgScore, topSchool: top.elementary_school };
        keyInsights.push(`教育環境スコア平均${avgScore}/100。最高評価学区: ${top.elementary_school}。`);
      }
    } else {
      keyInsights.push(`${loader.displayName}の教育データは v2.x で対応予定です。`);
    }
  }

  let corporateSummary: CrossAnalyzeOutput['corporateSummary'];
  if (includeCorporate) {
    if (loader.capabilities.corporate) {
      const corp = getCorporateForCity(area, prefKey);
      if (corp.length > 0) {
        const totalEst = corp.reduce((s, r) => s + r.total_establishments, 0);
        const majorCount = corp.reduce((s, r) => s + r.major_company_count, 0);
        corporateSummary = { totalEstablishments: totalEst, majorCount };
        keyInsights.push(`事業所数${totalEst.toLocaleString()}、大企業${majorCount}社。法人需要が${totalEst > 5000 ? '高い' : '中程度'}。`);
      }
    } else {
      keyInsights.push(`${loader.displayName}の企業立地データは v2.x で対応予定です。`);
    }
  }

  const totalTransactions = allTransactions.length;
  const avgPrice = transactions.length > 0
    ? Math.round(transactions.reduce((s, t) => s + t.price_per_sqm, 0) / transactions.length)
    : 0;

  const summary = [
    `${loader.displayName} ${area}の${propertyType === 'mixed' ? '全種別' : propertyType}不動産市場分析（${timeRange}）。`,
    avgPrice > 0 ? `平均取引価格: ${avgPrice.toLocaleString()}万円/㎡、` : '',
    totalTransactions > 0 ? `対象期間内取引件数: ${transactions.length}件（全${totalTransactions}件中）。` : '',
    includeRisk ? `総合リスクスコア: ${riskScore}/100。` : '',
    `投資スコア: ${investmentScore}/100。`,
    humanFlowData ? `実需要スコア: ${realDemandScore}/100。` : '',
  ].filter(Boolean).join(' ');

  const demandIndex = population
    ? Math.round((population.households_2025 / population.households_2020) * 100)
    : 100;

  return {
    summary,
    priceTrend,
    riskScore,
    investmentScore,
    keyInsights,
    charts: {
      priceHistory,
      riskBreakdown: includeRisk ? riskBreakdown : undefined,
      demandSupply: realDemandScore !== undefined
        ? { demand: realDemandScore, supply: 100 - (vacancyRiskScore ?? 50) }
        : { demand: demandIndex, supply: 100 },
    },
    humanFlow: humanFlowData,
    realDemandScore,
    vacancyRiskScore,
    educationSummary,
    corporateSummary,
  };
}
