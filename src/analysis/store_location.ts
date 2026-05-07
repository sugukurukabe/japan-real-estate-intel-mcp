import type { StoreLocationInput, StoreLocationOutput, KeyCompetitor } from '../schemas.js';
import type { NeighborhoodRecord } from '../data-loaders/types.js';
import { getLoader } from '../data-loaders/index.js';
import { resolvePrefecture } from '../prefecture/resolver.js';
import { geocode } from '../data/geocode.js';
import { computeRisk } from './risk_score.js';
import { ATTRIBUTION } from '../data/attribution.js';

const STORE_WEIGHTS: Record<string, Record<string, number>> = {
  convenience:       { humanFlow: 35, population: 25, risk: 15, competition: 20, transport: 5,  education: 0, commercial: 0, medical: 0 },
  family_restaurant: { humanFlow: 20, population: 30, risk: 20, competition: 15, transport: 10, education: 5, commercial: 0, medical: 0 },
  cafe:              { humanFlow: 40, population: 20, risk: 10, competition: 20, transport: 10, education: 0, commercial: 0, medical: 0 },
  drugstore:         { humanFlow: 25, population: 35, risk: 15, competition: 15, transport: 10, education: 0, commercial: 0, medical: 0 },
  supermarket:       { humanFlow: 25, population: 35, risk: 20, competition: 10, transport: 10, education: 0, commercial: 0, medical: 0 },
};

const STORE_TYPE_TO_FACILITY: Record<string, string> = {
  convenience: 'cvs',
  family_restaurant: 'fast_food',
  cafe: 'cafe',
  drugstore: 'drugstore',
  supermarket: 'supermarket',
};

function matchCity(recordCity: string, city: string): boolean {
  return recordCity.includes(city) || city.includes(recordCity);
}

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6_371_000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function evaluateStoreLocationAnalysis(input: StoreLocationInput): StoreLocationOutput {
  const prefKey = resolvePrefecture(input.prefecture);
  const loader = getLoader(prefKey);
  const { city, neighborhood, storeType, radiusM, customWeights, includeMarkdown } = input;
  const now = new Date().toISOString().split('T')[0];

  const coords = geocode(city, prefKey);
  const centerLat = coords?.lat ?? 35.17;
  const centerLng = coords?.lng ?? 136.88;

  // --- neighborhood data lookup ---
  let neighborhoodMatch: NeighborhoodRecord | undefined;
  if (loader.capabilities.neighborhoods && neighborhood) {
    const neighborhoods = loader.getNeighborhoods();
    neighborhoodMatch = neighborhoods.find(
      (r) =>
        (r.city.includes(city) || city.includes(r.city)) &&
        (r.neighborhood.includes(neighborhood) || neighborhood.includes(r.neighborhood)),
    );
  }

  // ── Dimension: population ──
  const popRecords = loader.getPopulation().filter((r) => matchCity(r.city, city));
  let populationScore: number;
  if (neighborhoodMatch) {
    populationScore = Math.min(100, Math.round(neighborhoodMatch.pop_density_sqkm / 100));
  } else {
    const popDensity = popRecords.length > 0
      ? popRecords.reduce((s, r) => s + r.density_per_sqkm, 0) / popRecords.length
      : 0;
    populationScore = Math.min(100, Math.round(popDensity / 100));
  }

  // ── Dimension: humanFlow ──
  const flowRecords = loader.getHumanFlow().filter((r) => matchCity(r.city, city));
  const avgWeekdayFlow = flowRecords.length > 0
    ? flowRecords.reduce((s, r) => s + r.weekday_avg_flow, 0) / flowRecords.length
    : 0;
  let humanFlowScore = Math.min(100, Math.round(avgWeekdayFlow / 2000));
  if (neighborhoodMatch && neighborhoodMatch.daytime_pop_ratio > 1.0) {
    humanFlowScore = Math.min(100, Math.round(humanFlowScore * neighborhoodMatch.daytime_pop_ratio));
  }

  // ── Dimension: risk ──
  let riskRaw = 30;
  if (coords) {
    const riskResult = computeRisk(centerLat, centerLng, city, ['all'], prefKey);
    riskRaw = riskResult.overallScore;
  }
  const riskScore = Math.max(0, 100 - riskRaw);

  // ── Dimension: transport ──
  const transportRecords = loader.getTransport().filter((r) => matchCity(r.city, city));
  const totalPassengers = transportRecords.reduce((s, r) => s + r.daily_passengers, 0);
  const stationCount = transportRecords.length;
  const transportScore = Math.min(100, Math.round(
    (totalPassengers / 50_000) * 50 + stationCount * 10,
  ));

  // ── Dimension: education ──
  const schoolRecords = loader.getSchoolDistricts().filter((r) => matchCity(r.city, city));
  const educationScore = schoolRecords.length > 0
    ? Math.round(schoolRecords.reduce((s, r) => s + r.education_score, 0) / schoolRecords.length)
    : 0;

  // ── Dimension: commercial ──
  const commercialRecords = loader.getCommercialFacilities().filter((r) => matchCity(r.city, city));
  const commercialScore = Math.min(100, Math.round(commercialRecords.length * 8));

  // ── Dimension: medical ──
  const medicalRecords = loader.getMedicalFacilities().filter((r) => matchCity(r.city, city));
  const hospitalCount = medicalRecords.filter((r) => r.type === 'hospital').length;
  const medicalScore = Math.min(100, Math.round(
    medicalRecords.length * 5 + hospitalCount * 15,
  ));

  // ── Dimension: competition (inverse) ──
  const facilityType = STORE_TYPE_TO_FACILITY[storeType] ?? storeType;
  const competitors = commercialRecords.filter((r) => r.type === facilityType);
  const nearbyCompetitors = competitors.filter(
    (r) => haversineM(centerLat, centerLng, r.lat, r.lng) <= radiusM,
  );
  const competitionScore = Math.max(0, 100 - nearbyCompetitors.length * 15);

  // ── Weighted overall score ──
  const weights = customWeights ?? STORE_WEIGHTS[storeType] ?? STORE_WEIGHTS.convenience;
  const breakdown = {
    population: populationScore,
    humanFlow: humanFlowScore,
    risk: riskScore,
    competition: competitionScore,
    transport: transportScore,
    education: educationScore,
    commercial: commercialScore,
    medical: medicalScore,
  };
  const dims = Object.keys(breakdown) as (keyof typeof breakdown)[];
  let totalWeight = 0;
  let weightedSum = 0;
  for (const dim of dims) {
    const w = (weights[dim] ?? 0);
    totalWeight += w;
    weightedSum += breakdown[dim] * w;
  }
  const overallScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

  // ── Key competitors ──
  const KNOWN_CHAINS: Record<string, number> = {
    'セブン-イレブン': 90, 'ファミリーマート': 85, 'ローソン': 85,
    'マクドナルド': 90, 'ガスト': 80, 'すき家': 80,
    'スターバックス': 90, 'ドトール': 75, 'コメダ珈琲': 80,
    'マツモトキヨシ': 85, 'ウエルシア': 80, 'スギ薬局': 80,
    'イオン': 90, 'ヨークベニマル': 75, 'バロー': 70,
  };

  const keyCompetitors: KeyCompetitor[] = nearbyCompetitors
    .map((r) => {
      const dist = Math.round(haversineM(centerLat, centerLng, r.lat, r.lng));
      const strength = KNOWN_CHAINS[r.chain_brand] ?? 50;
      const weakness = strength >= 80
        ? '大手チェーンのため価格・品揃えでは差別化が難しいが、接客・ローカル特化で勝機あり'
        : '知名度が低めのため、ブランド力では脅威は小さい';
      return {
        name: r.facility_name,
        chainBrand: r.chain_brand,
        distance: dist,
        type: r.type,
        strength,
        weakness,
      };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5);

  // ── Differentiation suggestions ──
  const differentiationSuggestions: string[] = [];
  const has24hCompetitor = nearbyCompetitors.some(
    (r) => r.chain_brand.includes('セブン') || r.chain_brand.includes('ローソン') || r.chain_brand.includes('ファミリーマート'),
  );
  if (!has24hCompetitor && storeType === 'convenience') {
    differentiationSuggestions.push('24時間営業で差別化');
  }
  if (hospitalCount > 0) {
    differentiationSuggestions.push('医療従事者向けメニュー/品揃えが有効');
  }
  if (transportScore >= 60) {
    differentiationSuggestions.push('駅直結のテイクアウト特化');
  }
  if (educationScore >= 50 && (storeType === 'cafe' || storeType === 'family_restaurant')) {
    differentiationSuggestions.push('学生向け勉強スペース併設で集客強化');
  }
  if (populationScore >= 60 && popRecords.some((r) => r.aging_rate > 25)) {
    differentiationSuggestions.push('高齢者向けバリアフリー・配達サービスで差別化');
  }
  if (competitionScore >= 80) {
    differentiationSuggestions.push('競合が少ないエリア。先行者優位を活かした出店が有効');
  }
  if (humanFlowScore >= 70) {
    differentiationSuggestions.push('通行量が多いため、視認性の高い看板・店頭ディスプレイが効果的');
  }
  if (differentiationSuggestions.length === 0) {
    differentiationSuggestions.push('立地条件は標準的。品揃え・サービス品質での差別化を推奨');
  }

  // ── Key insights ──
  const keyInsights: string[] = [];
  if (neighborhoodMatch) {
    keyInsights.push(`町丁目実データ使用: 人口${neighborhoodMatch.population.toLocaleString()}人、昼夜間人口比${neighborhoodMatch.daytime_pop_ratio}`);
  }
  if (overallScore >= 75) {
    keyInsights.push(`総合スコア${overallScore}/100。${storeType}の出店に非常に適した立地です。`);
  } else if (overallScore >= 50) {
    keyInsights.push(`総合スコア${overallScore}/100。条件付きで出店を検討できる立地です。`);
  } else {
    keyInsights.push(`総合スコア${overallScore}/100。出店リスクが高い立地です。慎重な検討が必要です。`);
  }
  if (nearbyCompetitors.length >= 3) {
    keyInsights.push(`半径${radiusM}m内に同業態${nearbyCompetitors.length}店舗。競合が激しいエリアです。`);
  } else if (nearbyCompetitors.length === 0) {
    keyInsights.push(`半径${radiusM}m内に同業態の競合なし。ブルーオーシャンの可能性があります。`);
  }
  if (humanFlowScore >= 60) {
    keyInsights.push(`平日平均人流が多く（スコア${humanFlowScore}/100）、集客力の高いエリアです。`);
  }
  if (riskScore <= 40) {
    keyInsights.push(`災害リスクがやや高め（安全スコア${riskScore}/100）。店舗保険の加入を推奨します。`);
  }
  if (transportScore >= 60) {
    keyInsights.push(`交通利便性が高く（スコア${transportScore}/100）、通勤・通学客の取り込みが期待できます。`);
  }
  if (keyInsights.length > 5) keyInsights.length = 5;

  // ── Markdown report ──
  const scopeLabel = neighborhood ? `${city} ${neighborhood}` : city;
  const storeTypeLabel: Record<string, string> = {
    convenience: 'コンビニエンスストア',
    family_restaurant: 'ファミリーレストラン',
    cafe: 'カフェ',
    drugstore: 'ドラッグストア',
    supermarket: 'スーパーマーケット',
  };
  let markdownReport: string | undefined;
  if (includeMarkdown) {
    markdownReport = [
      `# ${scopeLabel} ${storeTypeLabel[storeType] ?? storeType} 出店適地評価レポート`,
      ``,
      `生成日: ${now}  `,
      `店舗タイプ: ${storeTypeLabel[storeType] ?? storeType}  `,
      `検索半径: ${radiusM}m`,
      ``,
      `## 総合評価`,
      ``,
      `**総合スコア: ${overallScore}/100**`,
      ``,
      `| 評価軸 | スコア | ウェイト |`,
      `|---|---|---|`,
      ...dims.map((d) => `| ${d} | ${breakdown[d]}/100 | ${weights[d] ?? 0}% |`),
      ``,
      `## 競合分析`,
      ``,
      keyCompetitors.length > 0
        ? [
            `| 店名 | ブランド | 距離 | 強度 |`,
            `|---|---|---|---|`,
            ...keyCompetitors.map((c) => `| ${c.name} | ${c.chainBrand} | ${c.distance}m | ${c.strength}/100 |`),
          ].join('\n')
        : `半径${radiusM}m内に同業態の競合店舗は見つかりませんでした。`,
      ``,
      `## 差別化提案`,
      ``,
      differentiationSuggestions.map((s) => `- ${s}`).join('\n'),
      ``,
      `## 主要インサイト`,
      ``,
      keyInsights.map((i) => `- ${i}`).join('\n'),
      ``,
      `---`,
      ATTRIBUTION,
    ].join('\n');
  }

  return {
    overallScore,
    storeType,
    city,
    neighborhood,
    breakdown,
    keyCompetitors,
    differentiationSuggestions,
    keyInsights,
    markdownReport,
  };
}
