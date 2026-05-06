import type { CrossAnalyzeInput, CrossAnalyzeOutput } from '../schemas.js';
import {
  getLandPricesForCity,
  getTransactionsForCity,
  getPopulationForCity,
  filterByPropertyType,
  filterByTimeRange,
} from '../data/loader.js';
import { computePriceTrend, computePriceHistory } from '../analysis/price_trend.js';
import { computeRisk } from '../analysis/risk_score.js';
import { computeInvestmentScore, generateKeyInsights } from '../analysis/investment_score.js';
import { geocode } from '../data/geocode.js';

export function crossAnalyze(input: CrossAnalyzeInput): CrossAnalyzeOutput {
  const { area, propertyType, timeRange, includeRisk } = input;

  const landPrices = filterByTimeRange(getLandPricesForCity(area), timeRange);
  const allTransactions = getTransactionsForCity(area);
  const transactions = filterByTimeRange(
    filterByPropertyType(allTransactions, propertyType),
    timeRange,
  );
  const population = getPopulationForCity(area);

  const priceTrend = computePriceTrend(landPrices, transactions);
  const priceHistory = computePriceHistory(landPrices);

  let riskScore = 0;
  let riskBreakdown: { category: string; score: number }[] = [];

  if (includeRisk) {
    const coords = geocode(area);
    if (coords) {
      const risk = computeRisk(coords.lat, coords.lng, area, ['all']);
      riskScore = risk.overallScore;
      riskBreakdown = [
        { category: '浸水リスク', score: risk.floodRisk.level === 'high' ? 80 : risk.floodRisk.level === 'medium' ? 50 : 10 },
        { category: '土砂災害', score: risk.landslideRisk.level === 'high' ? 70 : risk.landslideRisk.level === 'medium' ? 35 : 5 },
        { category: '地震リスク', score: risk.earthquakeRisk.intensity === '7' ? 95 : risk.earthquakeRisk.intensity === '6強' ? 80 : 50 },
      ];
    }
  }

  const investmentScore = computeInvestmentScore({
    priceChangeRate: priceTrend.changeRate,
    riskScore,
    population,
    propertyType,
  });

  const keyInsights = generateKeyInsights({
    priceChangeRate: priceTrend.changeRate,
    riskScore,
    investmentScore,
    population,
    propertyType,
    area,
  });

  const totalTransactions = allTransactions.length;
  const avgPrice = transactions.length > 0
    ? Math.round(transactions.reduce((s, t) => s + t.price_per_sqm, 0) / transactions.length)
    : 0;

  const summary = [
    `${area}の${propertyType === 'mixed' ? '全種別' : propertyType}不動産市場分析（${timeRange}）。`,
    `平均取引価格: ${avgPrice.toLocaleString()}万円/㎡、`,
    `対象期間内取引件数: ${transactions.length}件（全${totalTransactions}件中）。`,
    includeRisk ? `総合リスクスコア: ${riskScore}/100。` : '',
    `投資スコア: ${investmentScore}/100。`,
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
      demandSupply: { demand: demandIndex, supply: 100 },
    },
  };
}
