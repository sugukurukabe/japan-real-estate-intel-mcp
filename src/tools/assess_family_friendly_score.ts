import type { FamilyFriendlyInput, FamilyFriendlyOutput } from '../schemas.js';
import { resolvePrefecture } from '../prefecture/resolver.js';
import { getLoader } from '../data-loaders/index.js';
import {
  getSchoolDistrictsForCity,
  getCrimeStatsForCity,
  getPopulationForCity,
  getLandPricesForCity,
} from '../data/loader.js';
import { computeRisk } from '../analysis/risk_score.js';
import { computeFamilyFriendlyScore } from '../analysis/family_friendly.js';
import { geocode } from '../data/geocode.js';

export function assessFamilyFriendlyScore(input: FamilyFriendlyInput): FamilyFriendlyOutput {
  const prefKey = resolvePrefecture(input.prefecture);
  const loader = getLoader(prefKey);
  const { area } = input;
  let lat: number | undefined;
  let lng: number | undefined;

  if (input.latlng) {
    lat = input.latlng.lat;
    lng = input.latlng.lng;
  } else {
    const coords = geocode(input.address ?? area, prefKey);
    if (coords) {
      lat = coords.lat;
      lng = coords.lng;
    }
  }

  const schools = loader.capabilities.education ? getSchoolDistrictsForCity(area, prefKey) : [];
  const crime = loader.capabilities.crime ? getCrimeStatsForCity(area, prefKey) : undefined;
  const population = getPopulationForCity(area, prefKey);
  const landPrices = getLandPricesForCity(area, prefKey);
  const avgPrice = landPrices.length > 0
    ? Math.round(landPrices.reduce((s, r) => s + r.price_per_sqm, 0) / landPrices.length)
    : 0;

  let riskScore = 0;
  if (lat !== undefined && lng !== undefined) {
    riskScore = computeRisk(lat, lng, area, ['all'], prefKey).overallScore;
  }

  const result = computeFamilyFriendlyScore(schools, crime, population, riskScore, avgPrice, area);

  if (!loader.capabilities.education) {
    result.insights.unshift(`${loader.displayName}の教育データは v2.x で対応予定です。汎用スコアで算出しています。`);
  }
  if (!loader.capabilities.crime) {
    result.insights.unshift(`${loader.displayName}の犯罪統計は v2.x で対応予定です。`);
  }

  return {
    overallScore: result.overallScore,
    schoolDistrict: {
      elementarySchool: result.elementarySchool,
      juniorHighSchool: result.juniorHighSchool,
      educationScore: result.educationScore,
      universityAdvancementRate: result.universityAdvancementRate,
      nearbySchoolCount: result.nearbySchoolCount,
    },
    safety: {
      crimeScore: result.safetyScore,
      crimeRate: result.crimeRate,
      dominantCrimeType: result.dominantCrimeType,
    },
    assetValueFactor: result.assetValueFactor,
    disasterRiskScore: riskScore,
    pricePerSqm: avgPrice,
    keyInsights: result.insights,
    recommendations: result.recommendations,
  };
}
