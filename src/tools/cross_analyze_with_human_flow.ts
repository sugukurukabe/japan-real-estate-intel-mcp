import type { HumanFlowAnalyzeInput, HumanFlowAnalyzeOutput } from '../schemas.js';
import {
  getLandPricesForCity,
  getTransactionsForCity,
  getPopulationForCity,
  getHumanFlowForCity,
  filterByPropertyType,
  filterByTimeRange,
} from '../data/loader.js';
import { computePriceTrend, computePriceHistory } from '../analysis/price_trend.js';
import { computeRisk } from '../analysis/risk_score.js';
import { computeInvestmentScore, generateKeyInsights } from '../analysis/investment_score.js';
import { computeHumanFlowMetrics, computeRealDemandScore, computeVacancyRiskScore } from '../analysis/human_flow.js';
import { geocode } from '../data/geocode.js';

export function crossAnalyzeWithHumanFlow(input: HumanFlowAnalyzeInput): HumanFlowAnalyzeOutput {
  const { area, propertyType, timeRange, includeRisk, dayType } = input;

  const landPrices = filterByTimeRange(getLandPricesForCity(area), timeRange);
  const transactions = filterByTimeRange(
    filterByPropertyType(getTransactionsForCity(area), propertyType),
    timeRange,
  );
  const population = getPopulationForCity(area);

  let flowRecords = getHumanFlowForCity(area);
  if (dayType !== 'both') {
    flowRecords = flowRecords.filter(() => true);
  }

  const priceTrend = computePriceTrend(landPrices, transactions);
  const priceHistory = computePriceHistory(landPrices);
  const humanFlow = computeHumanFlowMetrics(flowRecords);
  const realDemandScore = computeRealDemandScore(humanFlow, propertyType);
  const vacancyRiskScore = computeVacancyRiskScore(humanFlow, propertyType);

  let riskScore = 0;
  if (includeRisk) {
    const coords = geocode(area);
    if (coords) {
      const risk = computeRisk(coords.lat, coords.lng, area, ['all']);
      riskScore = risk.overallScore;
    }
  }

  const baseInvestment = computeInvestmentScore({
    priceChangeRate: priceTrend.changeRate,
    riskScore,
    population,
    propertyType,
  });

  const investmentScore = Math.round(Math.max(0, Math.min(100,
    baseInvestment * 0.6 + realDemandScore * 0.3 + (100 - vacancyRiskScore) * 0.1,
  )));

  const baseInsights = generateKeyInsights({
    priceChangeRate: priceTrend.changeRate,
    riskScore,
    investmentScore,
    population,
    propertyType,
    area,
  });

  const keyInsights = [...baseInsights];

  if (humanFlow.weekdayAvgFlow > 50000) {
    keyInsights.push(
      `平日人流${humanFlow.weekdayAvgFlow.toLocaleString()}人/日。商業エリアとして高い集客力。`,
    );
  }
  if (humanFlow.weekendAvgFlow > humanFlow.weekdayAvgFlow * 1.3) {
    keyInsights.push('休日の人流が平日を大幅に上回る。商業・飲食向け物件に好適。');
  }
  if (humanFlow.weekdayAvgFlow > humanFlow.weekendAvgFlow * 1.5) {
    keyInsights.push('平日偏重型のエリア。オフィス需要が主体。');
  }
  if (vacancyRiskScore >= 50) {
    keyInsights.push(`人流分析に基づく空室リスク: ${vacancyRiskScore}/100。テナント確保に注意。`);
  }
  if (humanFlow.flowTrend === 'increasing') {
    keyInsights.push('人流が増加トレンド。エリアの活性化が進行中。');
  } else if (humanFlow.flowTrend === 'decreasing') {
    keyInsights.push('人流が減少傾向。エリアの衰退リスクを検討。');
  }

  const summary = [
    `${area}の${propertyType === 'mixed' ? '全種別' : propertyType}不動産×人流クロス分析（${timeRange}）。`,
    `平日人流: ${humanFlow.weekdayAvgFlow.toLocaleString()}人/日、`,
    `休日: ${humanFlow.weekendAvgFlow.toLocaleString()}人/日。`,
    `実需要スコア: ${realDemandScore}/100、空室リスク: ${vacancyRiskScore}/100。`,
    `投資スコア（人流加味）: ${investmentScore}/100。`,
  ].join(' ');

  return {
    summary,
    priceTrend,
    humanFlow,
    riskScore,
    realDemandScore,
    investmentScore,
    vacancyRiskScore,
    keyInsights,
    charts: {
      priceHistory,
      demandSupply: {
        demand: realDemandScore,
        supply: 100 - vacancyRiskScore,
      },
    },
  };
}
