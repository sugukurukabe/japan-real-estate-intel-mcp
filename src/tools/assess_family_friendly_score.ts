import type { FamilyFriendlyInput, FamilyFriendlyOutput } from '../schemas.js';
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
  const { area } = input;
  let lat: number | undefined;
  let lng: number | undefined;

  if (input.latlng) {
    lat = input.latlng.lat;
    lng = input.latlng.lng;
  } else {
    const coords = geocode(input.address ?? area);
    if (coords) {
      lat = coords.lat;
      lng = coords.lng;
    }
  }

  const schools = getSchoolDistrictsForCity(area);
  const crime = getCrimeStatsForCity(area);
  const population = getPopulationForCity(area);
  const landPrices = getLandPricesForCity(area);
  const avgPrice = landPrices.length > 0
    ? Math.round(landPrices.reduce((s, r) => s + r.price_per_sqm, 0) / landPrices.length)
    : 0;

  let riskScore = 0;
  if (lat !== undefined && lng !== undefined) {
    riskScore = computeRisk(lat, lng, area, ['all']).overallScore;
  }

  const result = computeFamilyFriendlyScore(schools, crime, population, riskScore, avgPrice, area);

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
