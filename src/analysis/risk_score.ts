import {
  getFloodFeatureAtPoint,
  getLandslideFeatureAtPoint,
  getEarthquakeForCity,
} from '../data/loader.js';
import type { FloodRisk } from '../schemas.js';

interface RiskResult {
  floodRisk: FloodRisk;
  landslideRisk: { level: 'low' | 'medium' | 'high'; type: string };
  earthquakeRisk: { intensity: string; liquefaction: string };
  overallScore: number;
  adjustedPriceImpact: number;
  recommendations: string[];
}

const INTENSITY_SCORE: Record<string, number> = {
  '7': 95,
  '6強': 80,
  '6弱': 65,
  '5強': 45,
  '5弱': 30,
  '4': 15,
};

const LIQUEFACTION_SCORE: Record<string, number> = {
  high: 30,
  medium: 15,
  low: 5,
};

export function computeRisk(
  lat: number,
  lng: number,
  city: string,
  riskTypes: string[],
): RiskResult {
  const includeAll = riskTypes.includes('all');

  let floodScore = 0;
  let floodRisk: FloodRisk = { level: 'low', probability: 0.05, description: '浸水リスクは低い地域です。' };

  if (includeAll || riskTypes.includes('flood')) {
    const floodFeature = getFloodFeatureAtPoint(lat, lng);
    if (floodFeature) {
      const depth = (floodFeature.properties?.max_depth_m as number) ?? 1.0;
      const riskLevel = (floodFeature.properties?.risk_level as string) ?? 'medium';
      if (depth >= 3.0 || riskLevel === 'high') {
        floodScore = 80;
        floodRisk = {
          level: 'high',
          probability: 0.6,
          description: `最大浸水深${depth}mの想定区域内。${floodFeature.properties?.river ?? ''}流域の浸水リスクが高い。`,
        };
      } else if (depth >= 1.0 || riskLevel === 'medium') {
        floodScore = 50;
        floodRisk = {
          level: 'medium',
          probability: 0.3,
          description: `最大浸水深${depth}mの想定区域内。中程度の浸水リスクあり。`,
        };
      } else {
        floodScore = 20;
        floodRisk = {
          level: 'low',
          probability: 0.1,
          description: `浸水想定区域の縁辺部。最大浸水深${depth}m。`,
        };
      }
    }
  }

  let landslideScore = 0;
  let landslideResult: { level: 'low' | 'medium' | 'high'; type: string } = { level: 'low', type: 'なし' };

  if (includeAll || riskTypes.includes('landslide')) {
    const lsFeature = getLandslideFeatureAtPoint(lat, lng);
    if (lsFeature) {
      const warnLevel = (lsFeature.properties?.warning_level as string) ?? 'medium';
      const riskType = (lsFeature.properties?.risk_type as string) ?? '急傾斜地';
      if (warnLevel === 'high' || warnLevel === '特別警戒区域') {
        landslideScore = 70;
        landslideResult = { level: 'high', type: riskType };
      } else {
        landslideScore = 35;
        landslideResult = { level: 'medium', type: riskType };
      }
    }
  }

  let eqScore = 0;
  let eqResult = { intensity: '4', liquefaction: 'low' };

  if (includeAll || riskTypes.includes('earthquake')) {
    const eq = getEarthquakeForCity(city);
    if (eq) {
      const intScore = INTENSITY_SCORE[eq.max_intensity] ?? 30;
      const liqScore = LIQUEFACTION_SCORE[eq.liquefaction_risk] ?? 5;
      eqScore = Math.min(100, intScore + liqScore);
      eqResult = { intensity: eq.max_intensity, liquefaction: eq.liquefaction_risk };
    }
  }

  const overallScore = Math.round(
    Math.min(100, floodScore * 0.4 + landslideScore * 0.2 + eqScore * 0.4),
  );

  const adjustedPriceImpact = -Math.round(overallScore * 0.3 * 10) / 10;

  const recommendations: string[] = [];
  if (floodScore >= 50) {
    recommendations.push('水害保険の加入を強く推奨。地盤嵩上げや止水板の設置を検討してください。');
  }
  if (floodScore >= 20 && floodScore < 50) {
    recommendations.push('水害保険の検討を推奨。ハザードマップで避難経路を確認してください。');
  }
  if (landslideScore >= 35) {
    recommendations.push('土砂災害警戒区域内です。擁壁や排水設備の状態を専門家に確認してください。');
  }
  if (eqScore >= 60) {
    recommendations.push('南海トラフ地震の想定震度が高い地域です。耐震性能の確認と地震保険加入を推奨。');
  }
  if (eqResult.liquefaction === 'high') {
    recommendations.push('液状化リスクが高い地域です。地盤調査を実施してください。');
  }
  if (recommendations.length === 0) {
    recommendations.push('全体的にリスクは低い地域です。標準的な災害対策で十分です。');
  }

  return {
    floodRisk,
    landslideRisk: landslideResult,
    earthquakeRisk: eqResult,
    overallScore,
    adjustedPriceImpact,
    recommendations,
  };
}
