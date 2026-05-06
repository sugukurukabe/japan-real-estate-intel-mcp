import type {
  ComparePrefecturesInput,
  ComparePrefecturesOutput,
  PrefectureScore,
} from '../schemas.js';
import { getLoader } from '../data-loaders/index.js';
import { resolvePrefecture, getPrefectureDisplayName } from '../prefecture/resolver.js';
import { computeRisk } from './risk_score.js';
import { geocode } from '../data/geocode.js';
import { ATTRIBUTION } from '../data/attribution.js';

const DEFAULT_AREAS: Record<string, string> = {
  aichi: '名古屋市中区',
  tokyo: '千代田区',
};

function defaultArea(prefKey: string): string {
  return DEFAULT_AREAS[prefKey] ?? Object.values(DEFAULT_AREAS)[0];
}

interface RawMetrics {
  prefKey: string;
  displayName: string;
  area: string;
  price: number | null;
  priceChangeRate: number | null;
  riskScore: number | null;
  humanFlowScore: number | null;
  educationScore: number | null;
  corporateScore: number | null;
  transportScore: number | null;
  commercialScore: number | null;
  medicalScore: number | null;
  investmentScore: number;
}

function extractMetrics(prefKey: string, area: string): { raw: RawMetrics; notes: string[] } {
  const loader = getLoader(prefKey);
  const notes: string[] = [];
  const displayName = loader.displayName;

  // land price
  const landPrices = loader.getLandPrices().filter(
    (r) => r.city.includes(area) || area.includes(r.city),
  );
  let price: number | null = null;
  let priceChangeRate: number | null = null;
  if (landPrices.length > 0) {
    price = Math.round(landPrices.reduce((s, r) => s + r.price_per_sqm, 0) / landPrices.length);
    priceChangeRate = Math.round(
      (landPrices.reduce((s, r) => s + r.change_rate, 0) / landPrices.length) * 10,
    ) / 10;
  }

  // risk
  let riskScore: number | null = null;
  const coords = geocode(area, prefKey);
  if (coords) {
    const risk = computeRisk(coords.lat, coords.lng, area, ['all'], prefKey);
    riskScore = risk.overallScore;
  }

  // human flow
  let humanFlowScore: number | null = null;
  if (loader.capabilities.humanFlow) {
    const flows = loader.getHumanFlow().filter(
      (r) => r.city.includes(area) || area.includes(r.city),
    );
    if (flows.length > 0) {
      const avg = flows.reduce((s, r) => s + r.weekday_avg_flow, 0) / flows.length;
      humanFlowScore = Math.min(100, Math.round(avg / 2000));
    }
  } else {
    notes.push(`${displayName}: 人流データ未対応（v2.2 以降で対応予定）`);
  }

  // education
  let educationScore: number | null = null;
  if (loader.capabilities.education) {
    const schools = loader.getSchoolDistricts().filter(
      (r) => r.city.includes(area) || area.includes(r.city),
    );
    if (schools.length > 0) {
      educationScore = Math.round(
        schools.reduce((s, r) => s + r.education_score, 0) / schools.length,
      );
    }
  } else {
    notes.push(`${displayName}: 教育データ未対応（v2.2 以降で対応予定）`);
  }

  // corporate
  let corporateScore: number | null = null;
  if (loader.capabilities.corporate) {
    const corps = loader.getCorporateLocations().filter(
      (r) => r.city.includes(area) || area.includes(r.city),
    );
    if (corps.length > 0) {
      const totalEst = corps.reduce((s, r) => s + r.total_establishments, 0);
      corporateScore = Math.min(100, Math.round(totalEst / 200));
    }
  } else {
    notes.push(`${displayName}: 企業立地データ未対応（v2.2 以降で対応予定）`);
  }

  // transport
  let transportScore: number | null = null;
  if (loader.capabilities.transport) {
    const stations = loader.getTransport().filter(
      (r) => r.city.includes(area) || area.includes(r.city),
    );
    if (stations.length > 0) {
      const totalPassengers = stations.reduce((s, r) => s + r.daily_passengers, 0);
      transportScore = Math.min(100, Math.round(totalPassengers / 10000));
    }
  } else {
    notes.push(`${displayName}: 交通データ未対応（v2.2 以降で対応予定）`);
  }

  // commercial
  let commercialScore: number | null = null;
  if (loader.capabilities.commercial) {
    const facilities = loader.getCommercialFacilities().filter(
      (r) => r.city.includes(area) || area.includes(r.city),
    );
    if (facilities.length > 0) {
      commercialScore = Math.min(100, Math.round(facilities.length / 5));
    }
  } else {
    notes.push(`${displayName}: 商業施設データ未対応（v2.2 以降で対応予定）`);
  }

  // medical
  let medicalScore: number | null = null;
  if (loader.capabilities.medical) {
    const medicals = loader.getMedicalFacilities().filter(
      (r) => r.city.includes(area) || area.includes(r.city),
    );
    if (medicals.length > 0) {
      const hospitalCount = medicals.filter((r) => r.type === 'hospital').length;
      medicalScore = Math.min(100, Math.round((medicals.length + hospitalCount * 2) / 3));
    }
  } else {
    notes.push(`${displayName}: 医療施設データ未対応（v2.2 以降で対応予定）`);
  }

  // investment score
  const priceComp = priceChangeRate != null ? Math.max(0, Math.min(40, (priceChangeRate + 10) * 2)) : 20;
  const riskComp = riskScore != null ? Math.max(0, (100 - riskScore) * 0.3) : 15;
  const demandComp = humanFlowScore != null ? humanFlowScore * 0.3 : 15;
  const investmentScore = Math.round(Math.max(0, Math.min(100, priceComp + riskComp + demandComp)));

  return {
    raw: { prefKey, displayName, area, price, priceChangeRate, riskScore, humanFlowScore, educationScore, corporateScore, transportScore, commercialScore, medicalScore, investmentScore },
    notes,
  };
}

function normalize(values: (number | null)[]): number[] {
  const valid = values.filter((v): v is number => v != null);
  if (valid.length === 0) return values.map(() => 50);
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const range = max - min;
  return values.map((v) =>
    v == null ? 0 : range === 0 ? 50 : Math.round(((v - min) / range) * 100),
  );
}

function diffDirection(delta: number): 'up' | 'down' | 'flat' {
  if (delta > 1) return 'up';
  if (delta < -1) return 'down';
  return 'flat';
}

export function buildComparisonOutput(
  input: ComparePrefecturesInput,
  raws: RawMetrics[],
  allNotes: string[],
): ComparePrefecturesOutput {
  // sort by investmentScore desc
  const sorted = [...raws].sort((a, b) => b.investmentScore - a.investmentScore);

  const scores: PrefectureScore[] = sorted.map((r, idx) => ({
    prefecture: r.displayName,
    prefectureKey: r.prefKey,
    area: r.area,
    capabilities: getLoader(r.prefKey).capabilities,
    metrics: {
      price: r.price,
      priceChangeRate: r.priceChangeRate,
      riskScore: r.riskScore,
      humanFlowScore: r.humanFlowScore,
      educationScore: r.educationScore,
      corporateScore: r.corporateScore,
      transportScore: r.transportScore,
      commercialScore: r.commercialScore,
      medicalScore: r.medicalScore,
      investmentScore: r.investmentScore,
    },
    rank: idx + 1,
  }));

  const ranking = sorted.map((r, idx) => ({
    rank: idx + 1,
    prefecture: r.displayName,
    score: r.investmentScore,
  }));

  // radar data (normalize each metric across prefectures)
  const metrics = ['価格', '安全', '人流', '教育', '企業', '投資', '交通', '商業', '医療'];
  const rawByMetric = [
    raws.map((r) => r.price),
    raws.map((r) => r.riskScore != null ? 100 - r.riskScore : null),
    raws.map((r) => r.humanFlowScore),
    raws.map((r) => r.educationScore),
    raws.map((r) => r.corporateScore),
    raws.map((r) => r.investmentScore),
    raws.map((r) => r.transportScore),
    raws.map((r) => r.commercialScore),
    raws.map((r) => r.medicalScore),
  ];

  const radarData = metrics.map((metric, mi) => ({
    metric,
    values: normalize(rawByMetric[mi]).map((val, pi) => ({
      prefecture: raws[pi].displayName,
      value: val,
    })),
  }));

  // diffs (base = first input prefecture, targets = rest)
  const base = raws[0];
  const diffs = raws.slice(1).flatMap((target) => {
    const metricPairs: { metric: string; bv: number | null; tv: number | null }[] = [
      { metric: '投資スコア', bv: base.investmentScore, tv: target.investmentScore },
      { metric: '地価（万円/㎡）', bv: base.price, tv: target.price },
      { metric: 'リスクスコア', bv: base.riskScore, tv: target.riskScore },
    ];
    return metricPairs
      .filter((p) => p.bv != null && p.tv != null)
      .map((p) => {
        const delta = Math.round(((p.tv! - p.bv!) / Math.abs(p.bv! || 1)) * 1000) / 10;
        return {
          metric: p.metric,
          base: base.displayName,
          target: target.displayName,
          delta,
          direction: diffDirection(delta),
        };
      });
  });

  // bestFor
  const bySafety = [...raws].sort((a, b) => (a.riskScore ?? 100) - (b.riskScore ?? 100));
  const byGrowth = [...raws].sort((a, b) => (b.priceChangeRate ?? 0) - (a.priceChangeRate ?? 0));
  const bestFor = {
    investment: sorted[0].displayName,
    safety: bySafety[0].displayName,
    growth: byGrowth[0].displayName,
  };

  // summary
  const nbLabel = input.neighborhood ? `（${input.neighborhood}）` : '';
  const summary = [
    `${raws.map((r) => r.displayName).join(' vs ')}${nbLabel}の${input.propertyType === 'mixed' ? '全種別' : input.propertyType}不動産比較。`,
    `投資スコア順位: ${ranking.map((r) => `${r.rank}位 ${r.prefecture}（${r.score}/100）`).join('、')}。`,
    `${bestFor.investment}が総合投資スコア最高、${bestFor.safety}が災害安全性最高、${bestFor.growth}が価格上昇率最高。`,
  ].join(' ');

  let markdownReport: string | undefined;
  if (input.includeMarkdown) {
    const now = new Date().toISOString().split('T')[0];
    markdownReport = [
      `# 都道府県比較レポート`,
      ``,
      `生成日: ${now}  `,
      `比較対象: ${raws.map((r) => `${r.displayName}（${r.area}${nbLabel}）`).join(' / ')}`,
      ``,
      `## ランキング（投資スコア順）`,
      ``,
      ranking.map((r) => `${r.rank}. **${r.prefecture}** — ${r.score}/100`).join('\n'),
      ``,
      `## 指標比較`,
      ``,
      `| 指標 | ${raws.map((r) => r.displayName).join(' | ')} |`,
      `|---|${raws.map(() => '---').join('|')}|`,
      `| 投資スコア | ${raws.map((r) => `**${r.investmentScore}**`).join(' | ')} |`,
      `| 地価（万円/㎡） | ${raws.map((r) => r.price != null ? `${(r.price / 10000).toFixed(1)}万` : '-').join(' | ')} |`,
      `| 価格変化率 | ${raws.map((r) => r.priceChangeRate != null ? `${r.priceChangeRate > 0 ? '+' : ''}${r.priceChangeRate}%` : '-').join(' | ')} |`,
      `| リスクスコア | ${raws.map((r) => r.riskScore != null ? `${r.riskScore}/100` : '-').join(' | ')} |`,
      `| 人流スコア | ${raws.map((r) => r.humanFlowScore != null ? `${r.humanFlowScore}/100` : '未対応').join(' | ')} |`,
      `| 教育スコア | ${raws.map((r) => r.educationScore != null ? `${r.educationScore}/100` : '未対応').join(' | ')} |`,
      `| 企業立地 | ${raws.map((r) => r.corporateScore != null ? `${r.corporateScore}/100` : '未対応').join(' | ')} |`,
      `| 交通 | ${raws.map((r) => r.transportScore != null ? `${r.transportScore}/100` : '未対応').join(' | ')} |`,
      `| 商業 | ${raws.map((r) => r.commercialScore != null ? `${r.commercialScore}/100` : '未対応').join(' | ')} |`,
      `| 医療 | ${raws.map((r) => r.medicalScore != null ? `${r.medicalScore}/100` : '未対応').join(' | ')} |`,
      ``,
      `## 用途別おすすめ`,
      ``,
      `- **投資リターン**: ${bestFor.investment}`,
      `- **安全性重視**: ${bestFor.safety}`,
      `- **成長性重視**: ${bestFor.growth}`,
      ``,
      ...(diffs.length > 0 ? [
        `## 差分ハイライト（${base.displayName}比）`,
        ``,
        ...diffs.map((d) => {
          const arrow = d.direction === 'up' ? '▲' : d.direction === 'down' ? '▼' : '→';
          const sign = d.delta > 0 ? '+' : '';
          return `- ${d.target} / ${d.metric}: ${arrow} ${sign}${d.delta}%`;
        }),
        ``,
      ] : []),
      ...(allNotes.length > 0 ? [
        `## データ対応状況`,
        ``,
        ...allNotes.map((n) => `- ${n}`),
        ``,
      ] : []),
      `---`,
      `${ATTRIBUTION}`,
    ].join('\n');
  }

  return { summary, scores, ranking, radarData, diffs, bestFor, markdownReport, unsupportedNotes: allNotes };
}

export function analyzePrefecturesForComparison(
  input: ComparePrefecturesInput,
): ComparePrefecturesOutput {
  const dedup = Array.from(new Set(input.prefectures.map(resolvePrefecture)));
  const area = input.area ?? '';

  const allNotes: string[] = [];
  const raws: RawMetrics[] = dedup.map((prefKey) => {
    const resolvedArea = area || defaultArea(prefKey);
    const { raw, notes } = extractMetrics(prefKey, resolvedArea);
    allNotes.push(...notes.filter((n) => !allNotes.includes(n)));
    return raw;
  });

  return buildComparisonOutput(input, raws, allNotes);
}
