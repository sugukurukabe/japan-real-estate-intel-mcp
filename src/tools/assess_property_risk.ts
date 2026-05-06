import type { AssessRiskInput, AssessRiskOutput } from '../schemas.js';
import { computeRisk } from '../analysis/risk_score.js';
import { geocode } from '../data/geocode.js';

export function assessPropertyRisk(input: AssessRiskInput): AssessRiskOutput {
  let lat: number;
  let lng: number;
  let city: string;

  if (input.latlng) {
    lat = input.latlng.lat;
    lng = input.latlng.lng;
    city = input.address;
  } else {
    const coords = geocode(input.address);
    if (!coords) {
      return {
        floodRisk: { level: 'low', probability: 0, description: '住所が愛知県内で特定できませんでした。' },
        overallRiskScore: 0,
        recommendations: ['住所を愛知県内の市区町村名を含む形式で再入力してください。'],
        adjustedPriceImpact: 0,
      };
    }
    lat = coords.lat;
    lng = coords.lng;
    city = input.address;
  }

  const risk = computeRisk(lat, lng, city, input.riskTypes);

  return {
    floodRisk: risk.floodRisk,
    overallRiskScore: risk.overallScore,
    recommendations: risk.recommendations,
    adjustedPriceImpact: risk.adjustedPriceImpact,
  };
}
