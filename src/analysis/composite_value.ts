import type { CompositeValueScoreInput, CompositeAxisScore, CompositeValueScoreOutput } from '../schemas.js';
import type { CityMetrics } from './opportunity_provider.js';
import { LocalCsvProvider } from './opportunity_provider.js';
import {
  computeRiskComponent,
  computeTransportComponent,
} from './opportunity.js';
import { computeTriangulationForCity } from './price_triangulation.js';
import { resolvePrefecture, getPrefectureDisplayName } from '../prefecture/resolver.js';
import { getLoader } from '../data-loaders/index.js';
import type { VacancyRecord, PopulationProjectionRecord } from '../data-loaders/types.js';
import { ATTRIBUTION } from '../data/attribution.js';
import { generateCompositeNarrative } from './gemini_narrative.js';

interface AxisWeights {
  landPrice: number;
  education: number;
  transport: number;
  futurePlan: number;
  riskSafety: number;
}

const DEFAULT_WEIGHTS: AxisWeights = {
  landPrice: 0.25,
  education: 0.20,
  transport: 0.20,
  futurePlan: 0.20,
  riskSafety: 0.15,
};

function determineTier(score: number): 'S' | 'A' | 'B' | 'C' {
  if (score >= 80) return 'S';
  if (score >= 65) return 'A';
  if (score >= 50) return 'B';
  return 'C';
}

function computeLandPriceAxis(
  m: CityMetrics,
  allMetrics: CityMetrics[],
  loader: ReturnType<typeof getLoader>,
): { score: number; rawValue: string } {
  if (m.avgPricePerSqm == null) return { score: 50, rawValue: 'N/A' };
  const prices = allMetrics.filter(x => x.avgPricePerSqm != null).map(x => x.avgPricePerSqm!);
  if (prices.length < 2) return { score: 50, rawValue: `¥${m.avgPricePerSqm.toLocaleString()}/㎡` };

  const sorted = [...prices].sort((a, b) => a - b);
  const rank = sorted.indexOf(m.avgPricePerSqm);
  const percentile = ((rank + 1) / sorted.length) * 100;

  let growthBonus = 0;
  if (m.avgChangeRate != null) {
    growthBonus = Math.max(-20, Math.min(20, m.avgChangeRate * 5));
  }

  // valueUpside bonus from price triangulation: discount signal adds up to +10 points
  let valueUpside = 0;
  const tri = computeTriangulationForCity(loader, m.city);
  if (tri) {
    if (tri.signal === 'discount') {
      // Transaction < rosenka → undervalued relative to tax-assessed value
      valueUpside = Math.min(10, Math.max(0, (1 - tri.transactionKojiRatio) * 30));
    } else if (tri.signal === 'overheated') {
      // Penalise overheated markets slightly
      valueUpside = -Math.min(10, Math.max(0, (tri.transactionKojiRatio - 1.30) * 20));
    }
  }

  const score = Math.max(0, Math.min(100, percentile * 0.7 + 30 + growthBonus + valueUpside));
  const triSuffix = tri ? ` | 路線/公示比 ${(tri.rosenkaKojiRatio * 100).toFixed(0)}%` : '';
  const rawValue = `¥${m.avgPricePerSqm.toLocaleString()}/㎡ (${m.avgChangeRate != null ? (m.avgChangeRate >= 0 ? '+' : '') + m.avgChangeRate.toFixed(1) + '%' : 'N/A'})${triSuffix}`;
  return { score: Math.round(score), rawValue };
}

function computeEducationAxis(m: CityMetrics): { score: number; rawValue: string } {
  if (!m.education) return { score: 50, rawValue: 'データなし' };
  const score = Math.max(0, Math.min(100, m.education.avgScore));
  return { score: Math.round(score), rawValue: `教育スコア ${m.education.avgScore.toFixed(0)}/100` };
}

function computeTransportAxis(m: CityMetrics): { score: number; rawValue: string } {
  const score = computeTransportComponent(m);
  if (!m.transport) return { score, rawValue: 'データなし' };
  return { score, rawValue: `${m.transport.stationCount}駅, 平均${m.transport.avgPassengers.toLocaleString()}人/日` };
}

function computeFuturePlanAxis(
  m: CityMetrics,
  popProjection?: PopulationProjectionRecord | null,
): { score: number; rawValue: string } {
  let score = 50;
  let rawValue = '将来計画データなし';

  if (m.avgChangeRate != null && m.avgChangeRate > 0) {
    score += Math.min(20, m.avgChangeRate * 8);
    rawValue = `地価上昇傾向 ${m.avgChangeRate >= 0 ? '+' : ''}${m.avgChangeRate.toFixed(1)}%`;
  }

  if (popProjection && popProjection.decline_rate_2050 != null) {
    const decline = popProjection.decline_rate_2050;
    if (decline < 5) {
      score += 15;
    } else if (decline < 10) {
      score += 5;
    } else if (decline < 20) {
      score -= 5;
    } else {
      score -= 15;
    }
    rawValue += `, 2050年人口${decline >= 0 ? '-' : '+'}${Math.abs(decline).toFixed(1)}%`;
  } else if (m.population) {
    const popGrowth = ((m.population.population_2025 - m.population.population_2020) / Math.max(1, m.population.population_2020)) * 100;
    if (popGrowth > 0) {
      score += Math.min(15, popGrowth * 5);
      rawValue += `, 人口${popGrowth >= 0 ? '+' : ''}${popGrowth.toFixed(1)}%`;
    } else {
      score += Math.max(-10, popGrowth * 3);
      rawValue += `, 人口${popGrowth.toFixed(1)}%`;
    }
  }

  if (m.corporate && m.corporate.majorCompanies > 3) {
    score += Math.min(10, m.corporate.majorCompanies * 2);
    rawValue += `, 主要企業${m.corporate.majorCompanies}社`;
  }

  return { score: Math.max(0, Math.min(100, Math.round(score))), rawValue };
}

function computeRiskSafetyAxis(
  m: CityMetrics,
  vacancy?: VacancyRecord | null,
): { score: number; rawValue: string } {
  let safetyScore = computeRiskComponent(m);
  const parts: string[] = [];
  if (m.earthquake) parts.push(`地震: 最大${m.earthquake.max_intensity}`);
  if (m.crime) parts.push(`治安: ${m.crime.safety_score.toFixed(0)}/100`);

  if (vacancy && vacancy.vacancy_rate > 0) {
    const rate = vacancy.vacancy_rate;
    if (rate > 20) {
      safetyScore -= 10;
    } else if (rate > 15) {
      safetyScore -= 5;
    } else if (rate < 8) {
      safetyScore += 5;
    }
    parts.push(`空き家率: ${rate.toFixed(1)}%`);
  }

  return {
    score: Math.max(0, Math.min(100, Math.round(safetyScore))),
    rawValue: parts.length > 0 ? parts.join(', ') : '安全性データなし',
  };
}

function computeZScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  return Math.round(((value - mean) / stdDev) * 100) / 100;
}

export function computeCompositeValueScore(
  prefKey: string,
  area: string,
  weights?: Partial<AxisWeights>,
): CompositeValueScoreOutput {
  const provider = new LocalCsvProvider();
  const w = { ...DEFAULT_WEIGHTS, ...weights };
  const totalWeight = w.landPrice + w.education + w.transport + w.futurePlan + w.riskSafety;

  const cities = provider.getCities(prefKey);
  const allMetrics = cities.map(c => provider.getCityMetrics(prefKey, c));
  const targetMetrics = allMetrics.find(m => m.city === area || m.city.includes(area) || area.includes(m.city));

  if (!targetMetrics) {
    return {
      compositeScore: 0,
      tier: 'C',
      axes: [],
      peerComparison: [],
      narrative: undefined,
      markdownReport: undefined,
      attribution: ATTRIBUTION,
    };
  }

  const loader = getLoader(prefKey);
  const allVacancy = loader.getVacancy();
  const allPopProj = loader.getPopulationProjection();

  const matchVacancy = (city: string): VacancyRecord | null =>
    allVacancy.find(v => v.city.includes(city) || city.includes(v.city)) ?? null;
  const matchPopProj = (city: string): PopulationProjectionRecord | null =>
    allPopProj.find(p => p.city.includes(city) || city.includes(p.city)) ?? null;

  const targetVacancy = matchVacancy(area);
  const targetPopProj = matchPopProj(area);

  const landPriceResult = computeLandPriceAxis(targetMetrics, allMetrics, loader);
  const educationResult = computeEducationAxis(targetMetrics);
  const transportResult = computeTransportAxis(targetMetrics);
  const futurePlanResult = computeFuturePlanAxis(targetMetrics, targetPopProj);
  const riskSafetyResult = computeRiskSafetyAxis(targetMetrics, targetVacancy);

  const axes: CompositeAxisScore[] = [
    { axis: 'landPrice', label: '地価・成長性', score: landPriceResult.score, rawValue: landPriceResult.rawValue, evidence: '国土交通省 地価公示・路線価' },
    { axis: 'education', label: '教育・子育て', score: educationResult.score, rawValue: educationResult.rawValue, evidence: '教育委員会・e-Stat' },
    { axis: 'transport', label: '交通利便性', score: transportResult.score, rawValue: transportResult.rawValue, evidence: '交通データ (JR/私鉄/市営)' },
    { axis: 'futurePlan', label: '将来計画・成長力', score: futurePlanResult.score, rawValue: futurePlanResult.rawValue, evidence: '地価推移・人口動態・企業立地' },
    { axis: 'riskSafety', label: 'リスク・安全性', score: riskSafetyResult.score, rawValue: riskSafetyResult.rawValue, evidence: '内閣府地震想定・警察庁犯罪統計' },
  ];

  const compositeScore = Math.round(
    (landPriceResult.score * w.landPrice +
     educationResult.score * w.education +
     transportResult.score * w.transport +
     futurePlanResult.score * w.futurePlan +
     riskSafetyResult.score * w.riskSafety) / totalWeight
  );
  const tier = determineTier(compositeScore);

  const allScores = allMetrics.map(m => {
    const lp = computeLandPriceAxis(m, allMetrics, loader).score;
    const ed = computeEducationAxis(m).score;
    const tr = computeTransportAxis(m).score;
    const fp = computeFuturePlanAxis(m, matchPopProj(m.city)).score;
    const rs = computeRiskSafetyAxis(m, matchVacancy(m.city)).score;
    return {
      city: m.city,
      compositeScore: Math.round(
        (lp * w.landPrice + ed * w.education + tr * w.transport + fp * w.futurePlan + rs * w.riskSafety) / totalWeight
      ),
    };
  });

  const mean = allScores.reduce((s, x) => s + x.compositeScore, 0) / Math.max(1, allScores.length);
  const variance = allScores.reduce((s, x) => s + (x.compositeScore - mean) ** 2, 0) / Math.max(1, allScores.length);
  const stdDev = Math.sqrt(variance);

  const peersWithZ = allScores
    .filter(x => x.city !== targetMetrics.city)
    .map(x => ({
      city: x.city,
      compositeScore: x.compositeScore,
      tier: determineTier(x.compositeScore),
      zScore: computeZScore(x.compositeScore, mean, stdDev),
    }));
  peersWithZ.sort((a, b) => b.compositeScore - a.compositeScore);
  const peerComparison = [...peersWithZ.slice(0, 3), ...peersWithZ.slice(-3)].slice(0, 6);

  const prefDisplay = getPrefectureDisplayName(prefKey);

  return {
    compositeScore,
    tier,
    axes,
    peerComparison,
    attribution: ATTRIBUTION,
  };
}

function buildTextRadar(axes: { label: string; score: number }[]): string {
  const lines: string[] = [];
  for (const ax of axes) {
    const filled = Math.round(ax.score / 5);
    const bar = '█'.repeat(Math.max(1, filled)) + '░'.repeat(Math.max(0, 20 - filled));
    const tier = ax.score >= 80 ? '🟢' : ax.score >= 60 ? '🟡' : ax.score >= 40 ? '🟠' : '🔴';
    lines.push(`${tier} ${ax.label.padEnd(10)} ${bar} ${ax.score}/100`);
  }
  return lines.join('\n');
}

export function generateCompositeMarkdown(
  area: string,
  prefDisplay: string,
  result: CompositeValueScoreOutput,
): string {
  const tierEmoji = { S: '🏆', A: '🥇', B: '🥈', C: '🥉' }[result.tier] ?? '';
  const lines: string[] = [
    `# ${prefDisplay} ${area} — 総合価値スコア`,
    '',
    `## ${tierEmoji} Overall: **${result.compositeScore}/100** (Tier ${result.tier})`,
    '',
    '## 5軸レーダー',
    '',
    '```',
    buildTextRadar(result.axes),
    '```',
    '',
    '| 軸 | スコア | 詳細 | 出典 |',
    '|------|-------|--------|--------|',
  ];

  for (const ax of result.axes) {
    const emoji = ax.score >= 80 ? '🟢' : ax.score >= 60 ? '🟡' : ax.score >= 40 ? '🟠' : '🔴';
    lines.push(`| ${emoji} ${ax.label} | **${ax.score}** | ${ax.rawValue} | ${ax.evidence} |`);
  }

  lines.push('');

  if (result.narrative) {
    lines.push('## AI Summary');
    lines.push('');
    lines.push(result.narrative);
    lines.push('');
  }

  if (result.peerComparison.length > 0) {
    lines.push('## Peer Comparison');
    lines.push('');
    lines.push('| City | Score | Tier | z-score |');
    lines.push('|------|-------|------|---------|');
    for (const p of result.peerComparison) {
      lines.push(`| ${p.city} | ${p.compositeScore} | ${p.tier} | ${p.zScore >= 0 ? '+' : ''}${p.zScore.toFixed(2)} |`);
    }
    lines.push('');
  }

  lines.push(`> ${result.attribution}`);
  return lines.join('\n');
}
