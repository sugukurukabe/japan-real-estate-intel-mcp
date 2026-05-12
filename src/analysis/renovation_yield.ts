/**
 * Renovation yield estimation engine for Nagoya.
 *
 * Estimates rent, acquisition price, renovation cost, and yield
 * from bundled data (land prices, population, transactions).
 * Rent estimation uses land price × coefficient model (v6.8);
 * real rental API integration planned for v6.9.
 */

import { getLandPricesForCity } from '../data/loader.js';
import { getPlansForChochou } from '../api-client/nagoya.js';

export interface RenovationInput {
  ward: string;
  chochou: string;
  buildingAge: number;
  floorArea: number;
  acquisitionPrice?: number;
  propertyType?: 'mansion' | 'house' | 'office';
}

export interface RenovationYieldResult {
  ward: string;
  chochou: string;
  estimatedRent: {
    monthly: number;
    annual: number;
    confidence: 'high' | 'medium' | 'low';
  };
  estimatedAcquisition: number;
  renovationCost: {
    low: number;
    mid: number;
    high: number;
  };
  totalInvestment: {
    low: number;
    mid: number;
    high: number;
  };
  grossYieldPct: number;
  netYieldPct: number;
  exitStrategy: 'rent' | 'sell';
  whatIfBoost: {
    withFutureProject: number;
    futureProjectName: string | null;
  };
  breakdown: {
    managementFeePct: number;
    vacancyRatePct: number;
    taxRatePct: number;
  };
}

const RENO_COST_PER_SQM: Record<string, { low: number; mid: number; high: number }> = {
  mansion: { low: 80_000, mid: 130_000, high: 200_000 },
  house: { low: 100_000, mid: 160_000, high: 250_000 },
  office: { low: 60_000, mid: 100_000, high: 160_000 },
};

const AGE_DISCOUNT: Record<number, number> = {
  10: 0.95,
  20: 0.85,
  30: 0.70,
  40: 0.55,
  50: 0.40,
};

function getAgeDiscount(age: number): number {
  const keys = Object.keys(AGE_DISCOUNT).map(Number).sort((a, b) => a - b);
  for (let i = keys.length - 1; i >= 0; i--) {
    if (age >= keys[i]) return AGE_DISCOUNT[keys[i]];
  }
  return 1.0;
}

/**
 * Estimates monthly rent per sqm from land price data.
 * Uses empirical ratio: monthly rent ≈ land_price_per_sqm × 0.004 ~ 0.006
 * adjusted by age discount and ward premium.
 */
function estimateMonthlyRentPerSqm(
  landPricePerSqm: number,
  buildingAge: number,
  ward: string,
): number {
  const base = landPricePerSqm * 0.005;
  const ageAdj = getAgeDiscount(buildingAge);
  const premiumWards = ['中区', '東区', '千種区', '中村区', '昭和区'];
  const wardMult = premiumWards.includes(ward) ? 1.15 : 1.0;
  return Math.round(base * ageAdj * wardMult);
}

export function calculateRenovationYield(input: RenovationInput): RenovationYieldResult {
  const { ward, chochou, buildingAge, floorArea, propertyType = 'mansion' } = input;

  const cityKey = `名古屋市${ward}`;
  const cityPrices = getLandPricesForCity(cityKey, 'aichi');
  const avgPrice = cityPrices.length > 0
    ? Math.round(cityPrices.reduce((s, r) => s + r.price_per_sqm, 0) / cityPrices.length)
    : 250_000;
  const landPricePerSqm = avgPrice;

  const ageDiscount = getAgeDiscount(buildingAge);
  const estimatedAcquisition = input.acquisitionPrice ??
    Math.round(landPricePerSqm * ageDiscount * floorArea * 0.8);

  const renoCosts = RENO_COST_PER_SQM[propertyType] ?? RENO_COST_PER_SQM.mansion;
  const ageFactor = buildingAge > 30 ? 1.2 : buildingAge > 20 ? 1.0 : 0.8;
  const renovationCost = {
    low: Math.round(renoCosts.low * floorArea * ageFactor),
    mid: Math.round(renoCosts.mid * floorArea * ageFactor),
    high: Math.round(renoCosts.high * floorArea * ageFactor),
  };

  const totalInvestment = {
    low: estimatedAcquisition + renovationCost.low,
    mid: estimatedAcquisition + renovationCost.mid,
    high: estimatedAcquisition + renovationCost.high,
  };

  const rentPerSqm = estimateMonthlyRentPerSqm(landPricePerSqm, Math.max(0, buildingAge - 5), ward);
  const monthlyRent = Math.round(rentPerSqm * floorArea);
  const annualRent = monthlyRent * 12;

  const managementFeePct = 5;
  const vacancyRatePct = ward === '中区' || ward === '東区' ? 5 : 8;
  const taxRatePct = 2;
  const deductionPct = managementFeePct + vacancyRatePct + taxRatePct;

  const grossYieldPct = Math.round((annualRent / totalInvestment.mid) * 1000) / 10;
  const netYieldPct = Math.round(
    ((annualRent * (1 - deductionPct / 100)) / totalInvestment.mid) * 1000,
  ) / 10;

  const exitStrategy: 'rent' | 'sell' = netYieldPct >= 6 ? 'rent' : 'sell';

  const plans = getPlansForChochou(ward, chochou);
  const topPlan = plans.sort((a, b) => b.expectedPriceImpactPct - a.expectedPriceImpactPct)[0];
  const futureBoost = topPlan ? topPlan.expectedPriceImpactPct : 0;

  const confidence: 'high' | 'medium' | 'low' = cityPrices.length > 0 ? 'medium' : 'low';

  return {
    ward,
    chochou,
    estimatedRent: { monthly: monthlyRent, annual: annualRent, confidence },
    estimatedAcquisition,
    renovationCost,
    totalInvestment,
    grossYieldPct,
    netYieldPct,
    exitStrategy,
    whatIfBoost: {
      withFutureProject: Math.round((grossYieldPct * (1 + futureBoost / 100)) * 10) / 10,
      futureProjectName: topPlan?.project ?? null,
    },
    breakdown: { managementFeePct, vacancyRatePct, taxRatePct },
  };
}
