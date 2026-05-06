import type { PopulationRecord } from '../data/loader.js';

interface InvestmentParams {
  priceChangeRate: number;
  riskScore: number;
  population?: PopulationRecord;
  propertyType: string;
}

export function computeInvestmentScore(params: InvestmentParams): number {
  const { priceChangeRate, riskScore, population, propertyType } = params;

  const priceComponent = Math.max(0, Math.min(40, (priceChangeRate + 10) * 2));

  const riskComponent = Math.max(0, (100 - riskScore) * 0.3);

  let demandComponent = 15;
  if (population) {
    const popGrowth =
      ((population.population_2025 - population.population_2020) / population.population_2020) *
      100;
    const householdGrowth =
      ((population.households_2025 - population.households_2020) / population.households_2020) *
      100;

    demandComponent = Math.max(0, Math.min(30, (popGrowth + 5) * 3 + householdGrowth * 0.5));

    if (propertyType === 'residential' && population.aging_rate > 30) {
      demandComponent *= 0.8;
    }
    if (propertyType === 'commercial' && population.density_per_sqkm > 5000) {
      demandComponent *= 1.2;
    }
  }

  const raw = priceComponent + riskComponent + demandComponent;
  return Math.round(Math.max(0, Math.min(100, raw)));
}

export function generateKeyInsights(params: {
  priceChangeRate: number;
  riskScore: number;
  investmentScore: number;
  population?: PopulationRecord;
  propertyType: string;
  area: string;
}): string[] {
  const insights: string[] = [];
  const { priceChangeRate, riskScore, investmentScore, population, propertyType, area } = params;

  if (investmentScore >= 70) {
    insights.push(`${area}は投資適格性が高い地域です（スコア: ${investmentScore}/100）。`);
  } else if (investmentScore >= 40) {
    insights.push(`${area}は中程度の投資機会があります（スコア: ${investmentScore}/100）。`);
  } else {
    insights.push(`${area}は慎重な検討が必要です（スコア: ${investmentScore}/100）。`);
  }

  if (priceChangeRate > 3) {
    insights.push(`地価は上昇傾向（${priceChangeRate > 0 ? '+' : ''}${priceChangeRate}%）。キャピタルゲインが期待できます。`);
  } else if (priceChangeRate < -3) {
    insights.push(`地価は下落傾向（${priceChangeRate}%）。底値買いの機会、または構造的リスクの可能性。`);
  }

  if (riskScore >= 60) {
    insights.push(`災害リスクスコアが高い（${riskScore}/100）。保険コスト増を価格に織り込む必要があります。`);
  } else if (riskScore <= 20) {
    insights.push(`災害リスクが低い地域（${riskScore}/100）。安全性をセールスポイントにできます。`);
  }

  if (population) {
    const popGrowth =
      ((population.population_2025 - population.population_2020) / population.population_2020) *
      100;
    if (popGrowth > 0) {
      insights.push(`人口増加地域（+${popGrowth.toFixed(1)}%）。${propertyType === 'residential' ? '住宅' : '商業'}需要の拡大が見込まれます。`);
    } else if (popGrowth < -3) {
      insights.push(`人口減少が進行中（${popGrowth.toFixed(1)}%）。将来の需要縮小リスクに注意。`);
    }
    if (population.aging_rate > 30) {
      insights.push(`高齢化率${population.aging_rate}%。高齢者向け施設・サービス付き住宅の需要あり。`);
    }
  }

  return insights;
}
