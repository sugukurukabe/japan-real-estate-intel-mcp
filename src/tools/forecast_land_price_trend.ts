import type {
  ForecastLandPriceTrendInput,
  ForecastLandPriceTrendOutput,
  LandPriceForecastPoint,
} from '../schemas.js';
import type { LandPriceRecord } from '../data-loaders/types.js';
import { resolvePrefecture } from '../prefecture/resolver.js';
import { getLoader } from '../data-loaders/index.js';
import { computeTriangulationForCity, BENCHMARK } from '../analysis/price_triangulation.js';

function linearRegression(
  xs: number[],
  ys: number[],
): { slope: number; intercept: number; r2: number } {
  const n = xs.length;
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((a, x, i) => a + x * ys[i], 0);
  const sumX2 = xs.reduce((a, x) => a + x * x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  const yMean = sumY / n;
  const ssTot = ys.reduce((a, y) => a + (y - yMean) ** 2, 0);
  const ssRes = ys.reduce((a, y, i) => a + (y - (slope * xs[i] + intercept)) ** 2, 0);
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
  return { slope, intercept, r2 };
}

function movingAvgSlope(ys: number[], windowSize = 3): number {
  if (ys.length < 2) return 0;
  const recent = ys.slice(-Math.min(windowSize, ys.length));
  const diffs = recent.slice(1).map((v, i) => v - recent[i]);
  return diffs.reduce((a, b) => a + b, 0) / diffs.length;
}

export function forecastLandPriceTrend(
  input: ForecastLandPriceTrendInput,
): ForecastLandPriceTrendOutput {
  const prefKey = resolvePrefecture(input.prefecture);
  const loader = getLoader(prefKey);

  const allPrices: LandPriceRecord[] = loader.getLandPrices();
  const filtered = allPrices.filter((r: LandPriceRecord) => {
    const cityMatch = r.city.includes(input.city) || input.city.includes(r.city);
    const useMatch = input.landUse === 'all' || r.land_use === input.landUse;
    return cityMatch && useMatch;
  });

  // Aggregate by year: compute median price_per_sqm per year
  const byYear = new Map<number, number[]>();
  for (const r of filtered) {
    if (!byYear.has(r.year)) byYear.set(r.year, []);
    byYear.get(r.year)!.push(r.price_per_sqm);
  }

  const historicalYears = [...byYear.keys()].sort();
  const historicalPrices = historicalYears.map((y) => {
    const vals = byYear.get(y)!;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  });

  const latestYear = historicalYears.at(-1) ?? new Date().getFullYear();
  const latestPrice = historicalPrices.at(-1) ?? null;

  const horizonYears = input.horizon === '1y' ? 1 : input.horizon === '3y' ? 3 : 5;
  const forecastYears = Array.from({ length: horizonYears }, (_, i) => latestYear + i + 1);

  const series: LandPriceForecastPoint[] = historicalYears.map((y, i) => ({
    year: y,
    price_per_sqm: Math.round(historicalPrices[i]),
    isForecast: false,
  }));

  let cagr: number | null = null;
  let trendDirection: 'rising' | 'stable' | 'declining' = 'stable';
  let trendStrength: 'strong' | 'moderate' | 'weak' = 'weak';

  if (historicalPrices.length >= 2) {
    const basePrice = historicalPrices[0];
    const endPrice = historicalPrices.at(-1)!;
    const years = historicalYears.length - 1;
    cagr = ((endPrice / basePrice) ** (1 / years) - 1) * 100;
    trendDirection = cagr > 1 ? 'rising' : cagr < -1 ? 'declining' : 'stable';
    trendStrength = Math.abs(cagr) > 5 ? 'strong' : Math.abs(cagr) > 2 ? 'moderate' : 'weak';

    if (input.method === 'linear') {
      const xs = historicalYears.map((y, i) => i);
      const reg = linearRegression(xs, historicalPrices);
      const baseX = xs.length;
      forecastYears.forEach((yr, i) => {
        const predicted = reg.slope * (baseX + i) + reg.intercept;
        const uncertainty = predicted * 0.05 * (i + 1);
        series.push({
          year: yr,
          price_per_sqm: Math.round(Math.max(predicted, 0)),
          isForecast: true,
          confidenceInterval: {
            low: Math.round(Math.max(predicted - uncertainty, 0)),
            high: Math.round(predicted + uncertainty),
          },
        });
      });
    } else {
      const slope = movingAvgSlope(historicalPrices);
      forecastYears.forEach((yr, i) => {
        const predicted = endPrice + slope * (i + 1);
        const uncertainty = Math.abs(predicted * 0.06 * (i + 1));
        series.push({
          year: yr,
          price_per_sqm: Math.round(Math.max(predicted, 0)),
          isForecast: true,
          confidenceInterval: {
            low: Math.round(Math.max(predicted - uncertainty, 0)),
            high: Math.round(predicted + uncertainty),
          },
        });
      });
    }
  } else {
    forecastYears.forEach((yr) => {
      series.push({ year: yr, price_per_sqm: latestPrice ?? 0, isForecast: true });
    });
  }

  const keyDrivers = buildDrivers(trendDirection, input.landUse, input.city);
  const riskFactors = buildRisks(trendDirection, input.city);
  const investmentSignal =
    trendDirection === 'rising' && trendStrength !== 'weak'
      ? 'buy'
      : trendDirection === 'declining'
        ? 'caution'
        : 'hold';

  // Price triangulation context (v6.15.0)
  const tri = computeTriangulationForCity(loader, input.city);
  const triangulationContext = tri
    ? {
        rosenka: tri.rosenka,
        currentSpread: tri.assessmentGap,
        fairValueRange: {
          low: Math.round(tri.rosenka),
          high: Math.round(tri.koji * BENCHMARK.nationalTxKojiRatio),
        },
        signal: tri.signal,
      }
    : undefined;

  let markdownReport: string | undefined;
  if (input.includeMarkdown) {
    markdownReport = buildMarkdown({
      input,
      series,
      cagr,
      trendDirection,
      trendStrength,
      keyDrivers,
      riskFactors,
      investmentSignal,
      latestPrice,
      triangulationContext,
    });
  }

  return {
    prefecture: input.prefecture,
    city: input.city,
    landUse: input.landUse,
    latestPricePerSqm: latestPrice !== null ? Math.round(latestPrice) : null,
    cagr: cagr !== null ? Math.round(cagr * 100) / 100 : null,
    trendDirection,
    trendStrength,
    series,
    keyDrivers,
    riskFactors,
    investmentSignal,
    markdownReport,
  };
}

function buildDrivers(direction: string, landUse: string, city: string): string[] {
  const base = [
    `${city}エリアの人口動態・実需トレンド`,
    `${landUse === 'commercial' ? '商業地' : '住宅地'}への投資需要`,
    '日銀金利政策と不動産ローン環境',
  ];
  if (direction === 'rising') base.push('再開発・都市整備計画の進行', 'インバウンド需要回復');
  if (direction === 'declining') base.push('少子高齢化による需要減退', '空き家増加リスク');
  return base;
}

function buildRisks(direction: string, city: string): string[] {
  return [
    '金利上昇による不動産市況冷却リスク',
    `${city}固有の人口流出リスク`,
    '大規模自然災害（地震・浸水）による価格調整リスク',
    direction === 'rising' ? '過熱警戒：バブル調整リスク' : '更なる下落リスク',
  ];
}

function buildMarkdown(opts: {
  input: ForecastLandPriceTrendInput;
  series: LandPriceForecastPoint[];
  cagr: number | null;
  trendDirection: string;
  trendStrength: string;
  keyDrivers: string[];
  riskFactors: string[];
  investmentSignal: string;
  latestPrice: number | null;
  triangulationContext?: {
    rosenka: number;
    currentSpread: number;
    fairValueRange: { low: number; high: number };
    signal: string;
  };
}): string {
  const {
    input,
    series,
    cagr,
    trendDirection,
    trendStrength,
    keyDrivers,
    riskFactors,
    investmentSignal,
    latestPrice,
    triangulationContext,
  } = opts;
  const signal =
    investmentSignal === 'buy' ? '買い推奨' : investmentSignal === 'hold' ? '様子見' : '慎重対応';
  const dir =
    trendDirection === 'rising' ? '上昇' : trendDirection === 'declining' ? '下落' : '横ばい';
  const historical = series.filter((s) => !s.isForecast);
  const forecasted = series.filter((s) => s.isForecast);

  const rows = [
    `# 地価トレンド予測レポート — ${input.city}`,
    '',
    `**都道府県**: ${input.prefecture} | **地目**: ${input.landUse} | **予測期間**: ${input.horizon}`,
    '',
    `## サマリー`,
    `- 最新地価: **${latestPrice !== null ? latestPrice.toLocaleString() : 'N/A'} 円/㎡**`,
    `- トレンド: **${dir}（${trendStrength === 'strong' ? '強' : trendStrength === 'moderate' ? '中' : '弱'}）**`,
    `- CAGR: **${cagr !== null ? cagr.toFixed(2) + '%' : 'N/A'}**`,
    `- 投資シグナル: **${signal}**`,
    '',
    `## 実績推移`,
    '| 年 | 地価（円/㎡） |',
    '|---|---|',
    ...historical.map((p) => `| ${p.year} | ${p.price_per_sqm.toLocaleString()} |`),
    '',
    `## ${input.horizon} 予測`,
    '| 年 | 予測地価（円/㎡） | 信頼区間（下限〜上限） |',
    '|---|---|---|',
    ...forecasted.map((p) => {
      const ci = p.confidenceInterval
        ? `${p.confidenceInterval.low.toLocaleString()} 〜 ${p.confidenceInterval.high.toLocaleString()}`
        : 'N/A';
      return `| ${p.year} | ${p.price_per_sqm.toLocaleString()} | ${ci} |`;
    }),
    '',
    `## 価格上昇・下落ドライバー`,
    ...keyDrivers.map((d) => `- ${d}`),
    '',
    `## リスク要因`,
    ...riskFactors.map((r) => `- ${r}`),
    '',
    ...(triangulationContext
      ? [
          `## 価格トライアングル（三角測量コンテキスト）`,
          `| 指標 | 値 |`,
          `|------|-----|`,
          `| 路線価（推計） | ${triangulationContext.rosenka.toLocaleString()} 円/㎡ |`,
          `| 取引vs路線価スプレッド | ${triangulationContext.currentSpread >= 0 ? '+' : ''}${triangulationContext.currentSpread.toLocaleString()} 円/㎡ |`,
          `| 適正価格レンジ | ${triangulationContext.fairValueRange.low.toLocaleString()} 〜 ${triangulationContext.fairValueRange.high.toLocaleString()} 円/㎡ |`,
          `| アービトラージシグナル | ${triangulationContext.signal} |`,
          '',
        ]
      : []),
    `> ※本予測は過去の地価公示データを元にした簡易モデルです。投資判断には最新の専門家意見をご確認ください。`,
  ];
  return rows.join('\n');
}
