import type {
  SchoolDistrictRecord,
  CrimeStatsRecord,
  PopulationRecord,
} from '../data-loaders/types.js';

interface FamilyFriendlyResult {
  overallScore: number;
  educationScore: number;
  safetyScore: number;
  elementarySchool: string;
  juniorHighSchool: string;
  universityAdvancementRate: number;
  nearbySchoolCount: number;
  crimeRate: number;
  dominantCrimeType: string;
  assetValueFactor: number;
  insights: string[];
  recommendations: string[];
}

export function computeFamilyFriendlyScore(
  schools: SchoolDistrictRecord[],
  crime: CrimeStatsRecord | undefined,
  population: PopulationRecord | undefined,
  riskScore: number,
  pricePerSqm: number,
  area: string,
): FamilyFriendlyResult {
  const bestSchool =
    schools.length > 0
      ? schools.reduce((a, b) => (a.education_score > b.education_score ? a : b))
      : null;

  const educationScore = bestSchool?.education_score ?? 50;
  const safetyScore = crime?.safety_score ?? 60;
  const disasterFactor = Math.max(0, (100 - riskScore) / 100);

  const overallScore = Math.round(
    educationScore * 0.35 +
      safetyScore * 0.25 +
      disasterFactor * 100 * 0.2 +
      (population && population.aging_rate < 25
        ? 15
        : population && population.aging_rate < 30
          ? 10
          : 5) +
      (pricePerSqm > 0 && pricePerSqm < 300000 ? 5 : 0),
  );

  const assetValueFactor =
    educationScore >= 75
      ? 8 + (educationScore - 75) * 0.4
      : educationScore >= 60
        ? 2 + (educationScore - 60) * 0.2
        : -(60 - educationScore) * 0.15;

  const insights: string[] = [];
  if (educationScore >= 75) {
    insights.push(
      `${area}は教育環境が優れた地域（スコア${educationScore}/100）。ファミリー物件の資産価値にプレミアムが期待できます。`,
    );
  } else if (educationScore >= 55) {
    insights.push(`${area}の教育環境は標準的（スコア${educationScore}/100）。`);
  } else {
    insights.push(
      `${area}の教育環境スコアは低め（${educationScore}/100）。ファミリー層の需要は限定的。`,
    );
  }

  if (safetyScore >= 75) {
    insights.push(`安全性が高い地域（スコア${safetyScore}/100）。子育て環境として高評価。`);
  } else if (safetyScore < 50) {
    insights.push(`犯罪発生率がやや高い地域。仲介時の説明に留意。`);
  }

  if (crime && crime.crime_rate_per_1000 > 10) {
    insights.push(
      `犯罪率${crime.crime_rate_per_1000}件/千人。主要類型: ${crime.dominant_crime_type}。`,
    );
  }

  const recommendations: string[] = [];
  if (overallScore >= 70) {
    recommendations.push('ファミリー層向け物件として積極的に推奨できるエリアです。');
    recommendations.push('学区情報を重点的にアピールすることで差別化が可能。');
  } else if (overallScore >= 50) {
    recommendations.push('ファミリー層向けとしては平均的。価格メリットをアピールポイントに。');
  } else {
    recommendations.push(
      'ファミリー層向けとしてはハンディキャップあり。単身・DINKS向けなど別ターゲットを検討。',
    );
  }

  if (riskScore >= 50) {
    recommendations.push('災害リスクが中程度以上。子育て世帯には避難計画の説明が必要。');
  }

  return {
    overallScore: Math.max(0, Math.min(100, overallScore)),
    educationScore,
    safetyScore,
    elementarySchool: bestSchool?.elementary_school ?? '不明',
    juniorHighSchool: bestSchool?.junior_high_school ?? '不明',
    universityAdvancementRate: bestSchool?.university_advancement_rate ?? 0,
    nearbySchoolCount: bestSchool?.nearby_school_count ?? 0,
    crimeRate: crime?.crime_rate_per_1000 ?? 0,
    dominantCrimeType: crime?.dominant_crime_type ?? '不明',
    assetValueFactor: Math.round(assetValueFactor * 10) / 10,
    insights,
    recommendations,
  };
}
