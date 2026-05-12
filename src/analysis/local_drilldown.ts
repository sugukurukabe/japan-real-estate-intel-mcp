import type { DrillDownInput, DrillDownOutput } from '../schemas.js';
import type { NeighborhoodRecord } from '../data-loaders/types.js';
import { getLoader } from '../data-loaders/index.js';
import { resolvePrefecture, getPrefectureDisplayName } from '../prefecture/resolver.js';
import { geocode } from '../data/geocode.js';
import { computeRisk } from './risk_score.js';
import { ATTRIBUTION } from '../data/attribution.js';

export function buildLocalDrillDown(input: DrillDownInput): DrillDownOutput {
  const prefKey = resolvePrefecture(input.prefecture);
  const loader = getLoader(prefKey);
  const prefDisplayName = loader.displayName;
  const { city, neighborhood, focus } = input;
  const now = new Date().toISOString().split('T')[0];

  // --- neighborhood data lookup ---
  let neighborhoodMatch: NeighborhoodRecord | undefined;
  const neighborhoodDataAvailable = !!(loader.capabilities.neighborhoods && neighborhood);
  if (neighborhoodDataAvailable) {
    const neighborhoods = loader.getNeighborhoods();
    neighborhoodMatch = neighborhoods.find(
      (r) =>
        (r.city.includes(city) || city.includes(r.city)) &&
        (r.neighborhood.includes(neighborhood!) || neighborhood!.includes(r.neighborhood)),
    );
  }

  const granularity: 'city' | 'neighborhood' = neighborhood ? 'neighborhood' : 'city';
  const granularityNote = neighborhoodMatch
    ? `町丁目「${neighborhood}」の実データ（町丁目レベル）を使用しています。`
    : neighborhood
      ? `町丁目「${neighborhood}」の実データは未登録のため、市区町村レベルでのデータ集計です。`
      : '市区町村レベルでのデータ集計です。';

  const scopeLabel = neighborhood ? `${city} ${neighborhood}` : city;

  // --- price ---
  let pricePerSqm: number | null = null;
  let priceChangeRate: number | null = null;
  if (focus === 'all' || focus === 'price') {
    const lps = loader.getLandPrices().filter(
      (r) => r.city.includes(city) || city.includes(r.city),
    );
    if (lps.length > 0) {
      pricePerSqm = Math.round(lps.reduce((s, r) => s + r.price_per_sqm, 0) / lps.length);
      priceChangeRate = Math.round(
        (lps.reduce((s, r) => s + r.change_rate, 0) / lps.length) * 10,
      ) / 10;
    }
  }

  // --- population ---
  let population: DrillDownOutput['population'] = null;
  if (focus === 'all' || focus === 'demand') {
    if (neighborhoodMatch) {
      population = {
        total: neighborhoodMatch.population,
        households: neighborhoodMatch.households,
        aging: neighborhoodMatch.elderly_ratio,
      };
    } else {
      const pop = loader.getPopulation().find(
        (r) => r.city.includes(city) || city.includes(r.city),
      );
      if (pop) {
        population = {
          total: pop.population_2025,
          households: pop.households_2025,
          aging: pop.aging_rate,
        };
      }
    }
  }

  // --- risk ---
  let riskScore: number | null = null;
  let floodLevel: DrillDownOutput['floodLevel'] = null;
  if (focus === 'all' || focus === 'risk') {
    const coords = geocode(city, prefKey);
    if (coords) {
      const risk = computeRisk(coords.lat, coords.lng, city, ['all'], prefKey);
      riskScore = risk.overallScore;
      floodLevel = risk.floodRisk.level;
    }
  }

  // --- human flow ---
  let humanFlowScore: number | null = null;
  if ((focus === 'all' || focus === 'demand') && loader.capabilities.humanFlow) {
    const flows = loader.getHumanFlow().filter(
      (r) => r.city.includes(city) || city.includes(r.city),
    );
    if (flows.length > 0) {
      const avg = flows.reduce((s, r) => s + r.weekday_avg_flow, 0) / flows.length;
      humanFlowScore = Math.min(100, Math.round(avg / 2000));
    }
  }

  // --- competitor density ---
  let competitorDensity = '情報なし';
  if (loader.capabilities.corporate) {
    const corps = loader.getCorporateLocations().filter(
      (r) => r.city.includes(city) || city.includes(r.city),
    );
    if (corps.length > 0) {
      const avg = corps.reduce((s, r) => s + r.total_establishments, 0) / corps.length;
      competitorDensity = avg > 10000 ? '非常に高い' : avg > 5000 ? '高い' : avg > 2000 ? '中程度' : '低い';
    }
  }

  // --- transport ---
  let transportScore: number | null = null;
  if (loader.capabilities.transport) {
    const stations = loader.getTransport().filter(
      (r) => r.city.includes(city) || city.includes(r.city),
    );
    if (stations.length > 0) {
      const totalPassengers = stations.reduce((s, r) => s + r.daily_passengers, 0);
      transportScore = Math.min(100, Math.round(totalPassengers / 10000));
    }
  }

  // --- commercial ---
  let commercialDensity: string | null = null;
  if (loader.capabilities.commercial) {
    const facilities = loader.getCommercialFacilities().filter(
      (r) => r.city.includes(city) || city.includes(r.city),
    );
    if (facilities.length > 0) {
      commercialDensity = facilities.length > 100 ? '非常に高い' : facilities.length > 50 ? '高い' : facilities.length > 20 ? '中程度' : '低い';
    }
  }

  // --- medical ---
  let medicalDensity: string | null = null;
  if (loader.capabilities.medical) {
    const medicals = loader.getMedicalFacilities().filter(
      (r) => r.city.includes(city) || city.includes(r.city),
    );
    if (medicals.length > 0) {
      medicalDensity = medicals.length > 50 ? '非常に充実' : medicals.length > 20 ? '充実' : medicals.length > 10 ? '中程度' : '少ない';
    }
  }

  // --- local pitch ---
  const pitchParts: string[] = [];
  if (neighborhoodMatch) {
    pitchParts.push(`町丁目人口${neighborhoodMatch.population.toLocaleString()}人`);
    pitchParts.push(`世帯数${neighborhoodMatch.households.toLocaleString()}`);
    if (neighborhoodMatch.daytime_pop_ratio > 1.5) {
      pitchParts.push('昼間人口が多く商業・業務需要旺盛');
    } else if (neighborhoodMatch.daytime_pop_ratio < 0.7) {
      pitchParts.push('住宅地型（昼間人口流出型）');
    }
  }
  if (priceChangeRate != null) {
    pitchParts.push(priceChangeRate > 3 ? '地価が上昇傾向' : priceChangeRate < -2 ? '地価がやや下落傾向（底値機会）' : '地価は安定推移');
  }
  if (riskScore != null) {
    pitchParts.push(riskScore < 30 ? '災害リスク低め' : riskScore < 60 ? '災害リスク中程度' : '災害リスク高め（保険要検討）');
  }
  if (humanFlowScore != null) {
    pitchParts.push(humanFlowScore > 60 ? '人通りが多く商業需要旺盛' : humanFlowScore > 30 ? '人流は安定' : '人流は少なめ（静閑居住向き）');
  }
  if (transportScore != null) {
    pitchParts.push(transportScore > 60 ? '交通利便性が高い' : transportScore > 30 ? '交通アクセス中程度' : '交通アクセスやや不便');
  }
  if (commercialDensity != null) {
    pitchParts.push(`商業施設密度: ${commercialDensity}`);
  }
  if (medicalDensity != null) {
    pitchParts.push(`医療環境: ${medicalDensity}`);
  }
  const localPitch = pitchParts.length > 0
    ? `${scopeLabel}: ${pitchParts.join('、')}。`
    : `${scopeLabel}の詳細データを取得しました。`;

  // --- key insights ---
  const keyInsights: string[] = [];
  if (neighborhoodMatch) {
    keyInsights.push(`町丁目実データ使用: 人口${neighborhoodMatch.population.toLocaleString()}人、世帯数${neighborhoodMatch.households.toLocaleString()}、平均年齢${neighborhoodMatch.avg_age}歳。`);
    keyInsights.push(`年少比率${neighborhoodMatch.child_ratio}%、高齢比率${neighborhoodMatch.elderly_ratio}%、昼夜間人口比${neighborhoodMatch.daytime_pop_ratio}。`);
    if (neighborhoodMatch.child_ratio > 15) {
      keyInsights.push('子育て世帯が多いエリア。ファミリー向け物件の需要が高い可能性があります。');
    }
    if (neighborhoodMatch.elderly_ratio > 35) {
      keyInsights.push('高齢化が進行。高齢者向け施設・バリアフリー住宅の需要が見込まれます。');
    }
    if (neighborhoodMatch.daytime_pop_ratio > 2.0) {
      keyInsights.push('昼間人口が夜間の2倍超。オフィス・商業需要が非常に高いエリアです。');
    }
  }
  if (priceChangeRate != null) {
    if (priceChangeRate > 3) keyInsights.push(`地価が上昇（+${priceChangeRate}%）。キャピタルゲインが期待できます。`);
    else if (priceChangeRate < -3) keyInsights.push(`地価が下落中（${priceChangeRate}%）。底値買いか構造的下落か要精査。`);
  }
  if (riskScore != null && riskScore >= 60) {
    keyInsights.push(`リスクスコア${riskScore}/100（高リスク）。浸水・地震への保険や建設仕様強化を検討してください。`);
  }
  if (population && !neighborhoodMatch) {
    if (population.aging > 30) keyInsights.push(`高齢化率${population.aging}%。高齢者向け施設・バリアフリー仕様の需要があります。`);
  }
  if (!loader.capabilities.humanFlow) {
    keyInsights.push(`${prefDisplayName}では人流データを提供していません。`);
  }
  if (transportScore != null && transportScore > 60) {
    keyInsights.push(`交通スコア${transportScore}/100。駅近・高利便性エリアです。`);
  }
  if (!loader.capabilities.transport) {
    keyInsights.push(`${prefDisplayName}では交通データを提供していません。`);
  }
  if (commercialDensity != null && (commercialDensity === '非常に高い' || commercialDensity === '高い')) {
    keyInsights.push(`商業施設が${commercialDensity}密度で集積。生活利便性が高いエリアです。`);
  }
  if (!loader.capabilities.commercial) {
    keyInsights.push(`${prefDisplayName}では商業施設データを提供していません。`);
  }
  if (medicalDensity != null && (medicalDensity === '非常に充実' || medicalDensity === '充実')) {
    keyInsights.push(`医療環境が${medicalDensity}。高齢者向け住宅や福祉施設に好適です。`);
  }
  if (!loader.capabilities.medical) {
    keyInsights.push(`${prefDisplayName}では医療施設データを提供していません。`);
  }
  if (keyInsights.length === 0) {
    keyInsights.push(`${scopeLabel}の市区町村レベルデータを正常に取得しました。`);
  }

  // --- neighborhood section for markdown ---
  const neighborhoodSection = neighborhoodMatch
    ? [
        `## 町丁目レベル実データ`,
        ``,
        `> 「${neighborhoodMatch.neighborhood}」の実データを使用しています。`,
        ``,
        `| 指標 | 値 |`,
        `|---|---|`,
        `| 人口 | ${neighborhoodMatch.population.toLocaleString()} 人 |`,
        `| 世帯数 | ${neighborhoodMatch.households.toLocaleString()} 世帯 |`,
        `| 人口密度 | ${neighborhoodMatch.pop_density_sqkm.toLocaleString()} 人/km² |`,
        `| 平均年齢 | ${neighborhoodMatch.avg_age} 歳 |`,
        `| 年少比率 | ${neighborhoodMatch.child_ratio}% |`,
        `| 高齢比率 | ${neighborhoodMatch.elderly_ratio}% |`,
        `| 昼夜間人口比 | ${neighborhoodMatch.daytime_pop_ratio} |`,
      ].join('\n')
    : null;

  // --- markdown report ---
  const markdownReport = [
    `# ${scopeLabel} ローカル不動産ドリルダウンレポート`,
    ``,
    `生成日: ${now}  `,
    `都道府県: ${prefDisplayName}  `,
    `市区町村: ${city}${neighborhood ? `  \n町丁目: ${neighborhood}${neighborhoodMatch ? '（実データ対応）' : '（データ未登録）'}` : ''}`,
    ``,
    `> ${granularityNote}`,
    ``,
    neighborhoodSection,
    `## ローカルサマリー`,
    ``,
    `${localPitch}`,
    ``,
    `## 価格動向`,
    ``,
    pricePerSqm != null
      ? `| 指標 | 値 |\n|---|---|\n| 平均地価 | ${(pricePerSqm / 10000).toFixed(1)} 万円/㎡ |\n| 変化率 | ${priceChangeRate != null ? `${priceChangeRate > 0 ? '+' : ''}${priceChangeRate}%` : '-'} |`
      : `地価データなし（${city}のデータが未登録または未対応）`,
    ``,
    `## 人口統計`,
    ``,
    population != null
      ? `| 指標 | 値 |\n|---|---|\n| 人口 | ${population.total.toLocaleString()} 人 |\n| 世帯数 | ${population.households.toLocaleString()} 世帯 |\n| 高齢化率 | ${population.aging}% |`
      : `人口データなし`,
    ``,
    `## 災害リスク`,
    ``,
    riskScore != null
      ? `- 総合リスクスコア: **${riskScore}/100**\n- 浸水リスク: **${floodLevel ?? '-'}**`
      : `リスクデータなし（住所ジオコードできませんでした）`,
    ``,
    `## 人流`,
    ``,
    humanFlowScore != null
      ? `- 人流スコア: **${humanFlowScore}/100**`
      : loader.capabilities.humanFlow ? `この市区町村の人流データは未登録です` : `${prefDisplayName}では人流データを提供していません`,
    ``,
    `## 交通利便性`,
    ``,
    transportScore != null
      ? `- 交通スコア: **${transportScore}/100**`
      : loader.capabilities.transport ? `この市区町村の交通データは未登録です` : `${prefDisplayName}では交通データを提供していません`,
    ``,
    `## 商業施設`,
    ``,
    commercialDensity != null
      ? `- 商業施設密度: **${commercialDensity}**`
      : loader.capabilities.commercial ? `この市区町村の商業施設データは未登録です` : `${prefDisplayName}では商業施設データを提供していません`,
    ``,
    `## 医療環境`,
    ``,
    medicalDensity != null
      ? `- 医療充実度: **${medicalDensity}**`
      : loader.capabilities.medical ? `この市区町村の医療施設データは未登録です` : `${prefDisplayName}では医療施設データを提供していません`,
    ``,
    keyInsights.length > 0 ? `## 主要インサイト\n\n${keyInsights.map((i) => `- ${i}`).join('\n')}` : '',
    ``,
    `---`,
    `${ATTRIBUTION}`,
  ].filter((line) => line != null).join('\n');

  return {
    scope: { prefecture: prefDisplayName, city, neighborhood },
    granularity,
    granularityNote,
    pricePerSqm,
    priceChangeRate,
    population,
    riskScore,
    floodLevel,
    humanFlowScore,
    transportScore,
    commercialDensity,
    medicalDensity,
    competitorDensity,
    localPitch,
    keyInsights,
    markdownReport,
    ...(neighborhoodMatch && {
      households: neighborhoodMatch.households,
      avgAge: neighborhoodMatch.avg_age,
      childRatio: neighborhoodMatch.child_ratio,
      elderlyRatio: neighborhoodMatch.elderly_ratio,
      daytimePopRatio: neighborhoodMatch.daytime_pop_ratio,
      popDensity: neighborhoodMatch.pop_density_sqkm,
      neighborhoodDataAvailable: true,
    }),
  };
}
