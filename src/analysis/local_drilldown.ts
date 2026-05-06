import type { DrillDownInput, DrillDownOutput } from '../schemas.js';
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

  const granularity: 'city' | 'neighborhood' = neighborhood ? 'neighborhood' : 'city';
  const granularityNote = neighborhood
    ? `v2.1 では市区町村レベルでのデータ集計です。町丁目「${neighborhood}」はレポートのラベルとして使用しています。町丁目単位の実データ対応は v2.2 以降で予定しています。`
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

  // --- local pitch ---
  const pitchParts: string[] = [];
  if (priceChangeRate != null) {
    pitchParts.push(priceChangeRate > 3 ? '地価が上昇傾向' : priceChangeRate < -2 ? '地価がやや下落傾向（底値機会）' : '地価は安定推移');
  }
  if (riskScore != null) {
    pitchParts.push(riskScore < 30 ? '災害リスク低め' : riskScore < 60 ? '災害リスク中程度' : '災害リスク高め（保険要検討）');
  }
  if (humanFlowScore != null) {
    pitchParts.push(humanFlowScore > 60 ? '人通りが多く商業需要旺盛' : humanFlowScore > 30 ? '人流は安定' : '人流は少なめ（静閑居住向き）');
  }
  const localPitch = pitchParts.length > 0
    ? `${scopeLabel}: ${pitchParts.join('、')}。`
    : `${scopeLabel}の詳細データを取得しました。`;

  // --- key insights ---
  const keyInsights: string[] = [];
  if (priceChangeRate != null) {
    if (priceChangeRate > 3) keyInsights.push(`地価が上昇（+${priceChangeRate}%）。キャピタルゲインが期待できます。`);
    else if (priceChangeRate < -3) keyInsights.push(`地価が下落中（${priceChangeRate}%）。底値買いか構造的下落か要精査。`);
  }
  if (riskScore != null && riskScore >= 60) {
    keyInsights.push(`リスクスコア${riskScore}/100（高リスク）。浸水・地震への保険や建設仕様強化を検討してください。`);
  }
  if (population) {
    const popGrowth = ((population.total - 0) / population.total) * 0;
    if (population.aging > 30) keyInsights.push(`高齢化率${population.aging}%。高齢者向け施設・バリアフリー仕様の需要があります。`);
  }
  if (!loader.capabilities.humanFlow) {
    keyInsights.push(`${prefDisplayName}の人流データは v2.2 以降で対応予定です。`);
  }
  if (keyInsights.length === 0) {
    keyInsights.push(`${scopeLabel}の市区町村レベルデータを正常に取得しました。`);
  }

  // --- markdown report ---
  const markdownReport = [
    `# ${scopeLabel} ローカル不動産ドリルダウンレポート`,
    ``,
    `生成日: ${now}  `,
    `都道府県: ${prefDisplayName}  `,
    `市区町村: ${city}${neighborhood ? `  \n町丁目: ${neighborhood}（※v2.1はラベルのみ）` : ''}`,
    ``,
    `> ${granularityNote}`,
    ``,
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
      : loader.capabilities.humanFlow ? `この市区町村の人流データは未登録です` : `${prefDisplayName}の人流データは v2.2 以降で対応予定`,
    ``,
    keyInsights.length > 0 ? `## 主要インサイト\n\n${keyInsights.map((i) => `- ${i}`).join('\n')}` : '',
    ``,
    `---`,
    `${ATTRIBUTION}`,
  ].filter((line) => line !== undefined).join('\n');

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
    competitorDensity,
    localPitch,
    keyInsights,
    markdownReport,
  };
}
