import { getLoader } from '../data-loaders/index.js';
import type { PortfolioOptimizerInput, PortfolioOptimizerOutput } from '../schemas.js';

const PREF_KEY_MAP: Record<string, string> = {
  '愛知県': 'aichi', 'aichi': 'aichi', 'JP-23': 'aichi',
  '東京都': 'tokyo', 'tokyo': 'tokyo', 'JP-13': 'tokyo',
  '大阪府': 'osaka', 'osaka': 'osaka', 'JP-27': 'osaka',
  '神奈川県': 'kanagawa', 'kanagawa': 'kanagawa', 'JP-14': 'kanagawa',
  '福岡県': 'fukuoka', 'fukuoka': 'fukuoka', 'JP-40': 'fukuoka',
  '北海道': 'hokkaido', 'hokkaido': 'hokkaido', 'JP-01': 'hokkaido',
  '京都府': 'kyoto', 'kyoto': 'kyoto', 'JP-26': 'kyoto',
  '兵庫県': 'hyogo', 'hyogo': 'hyogo', 'JP-28': 'hyogo',
  '埼玉県': 'saitama', 'saitama': 'saitama', 'JP-11': 'saitama',
  '千葉県': 'chiba', 'chiba': 'chiba', 'JP-12': 'chiba',
};

// Base expected returns by property type and prefecture tier
const TIER_BASE: Record<string, number> = {
  tokyo: 3.8, osaka: 3.5, kanagawa: 3.2, saitama: 3.0,
  chiba: 2.8, fukuoka: 3.4, kyoto: 3.1, hyogo: 2.9,
  hokkaido: 2.5, aichi: 3.3,
};

const TYPE_MODIFIER: Record<string, number> = {
  commercial: 1.5, office: 0.8, residential: 0.0, land: -0.3,
};

const RISK_BASE: Record<string, number> = {
  tokyo: 4, osaka: 4, kanagawa: 4, saitama: 5,
  chiba: 5, fukuoka: 5, kyoto: 5, hyogo: 5,
  hokkaido: 6, aichi: 5,
};

const TYPE_RISK_MOD: Record<string, number> = {
  commercial: 2, office: 1, residential: 0, land: -1,
};

const LIQUIDITY: Record<string, number> = {
  tokyo: 9, osaka: 8, kanagawa: 8, saitama: 7,
  chiba: 7, fukuoka: 7, kyoto: 7, hyogo: 7,
  hokkaido: 5, aichi: 7,
};

const RISK_TOLERANCE_MULTIPLIER: Record<string, number> = {
  low: 0.7, medium: 1.0, high: 1.3,
};

const HORIZON_BOOST: Record<string, number> = {
  '3y': 0.0, '5y': 0.3, '10y': 0.8,
};

const STRENGTHS: Record<string, string> = {
  tokyo: '国内最大の流動性・企業集積・国際競争力',
  osaka: '西日本最大の商業拠点・訪日観光需要',
  kanagawa: '横浜の都市力・東京圏ベッドタウン需要',
  saitama: '大宮以北の大規模開発・交通利便性向上',
  chiba: '浦安・幕張の再開発・成田空港アクセス',
  fukuoka: '九州最大都市・スタートアップ集積・人口増',
  kyoto: '観光資産・文化ブランド・空き家再生需要',
  hyogo: '神戸の港湾都市力・阪急沿線高級住宅地',
  hokkaido: '観光・農業・データセンター需要・低価格',
  aichi: 'トヨタ産業集積・製造業雇用安定・再開発',
};

const WEAKNESSES: Record<string, string> = {
  tokyo: '地価高騰による利回り低下・地震リスク',
  osaka: '一部エリアの老朽化・空き地問題',
  kanagawa: '老朽マンション比率上昇・郊外空洞化',
  saitama: '東京依存型・単独都市機能やや弱',
  chiba: '液状化リスク（東部）・交通渋滞',
  fukuoka: '供給過多懸念・天候リスク（台風）',
  kyoto: '景観規制による建て替え制限・伝統産業縮小',
  hyogo: '震災復興エリアの格差・一部人口流出',
  hokkaido: '人口減少・冬季需要落ち込み・流動性低',
  aichi: '自動車産業依存度高・工業地帯の転換需要',
};

function calcReturn(prefKey: string, propertyType: string, horizon: string, riskTol: string): number {
  const base = TIER_BASE[prefKey] ?? 3.0;
  const typeMod = TYPE_MODIFIER[propertyType] ?? 0;
  const tolMod = RISK_TOLERANCE_MULTIPLIER[riskTol] ?? 1.0;
  const horizonMod = HORIZON_BOOST[horizon] ?? 0;
  return Math.round((base + typeMod * tolMod + horizonMod) * 10) / 10;
}

function calcRisk(prefKey: string, propertyType: string): number {
  const base = RISK_BASE[prefKey] ?? 5;
  const mod = TYPE_RISK_MOD[propertyType] ?? 0;
  return Math.min(10, Math.max(1, base + mod));
}

function getRecommendation(ret: number, risk: number): 'strong_buy' | 'buy' | 'hold' | 'reduce' | 'sell' {
  const ratio = ret / risk;
  if (ratio >= 0.9) return 'strong_buy';
  if (ratio >= 0.7) return 'buy';
  if (ratio >= 0.5) return 'hold';
  if (ratio >= 0.3) return 'reduce';
  return 'sell';
}

function calcAllocation(
  assets: { ret: number; risk: number; budget: number; prefKey: string }[],
  optimizeFor: string,
  totalBudget: number,
): number[] {
  if (optimizeFor === 'diversification') {
    return assets.map(() => Math.round(100 / assets.length));
  }

  // Weight by score: for return-focus use return, for risk-adjusted use return/risk
  const scores = assets.map(a => {
    if (optimizeFor === 'return') return a.ret;
    if (optimizeFor === 'stability') return 11 - a.risk;
    return a.ret / a.risk; // risk_adjusted
  });
  const total = scores.reduce((s, v) => s + v, 0);
  const raw = scores.map(s => Math.round((s / total) * 100));
  // Normalize to sum 100
  const diff = 100 - raw.reduce((s, v) => s + v, 0);
  raw[0] += diff;
  return raw;
}

export function portfolioOptimizer(input: PortfolioOptimizerInput): PortfolioOptimizerOutput {
  const { targets, riskTolerance, investmentHorizon, optimizeFor, includeMarkdown } = input;
  const totalBudget = targets.reduce((s, t) => s + t.budgetManYen, 0);

  // Build per-asset data
  const assetData = targets.map(t => {
    const prefKey = PREF_KEY_MAP[t.prefecture] ?? t.prefecture.toLowerCase();
    const loader = getLoader(prefKey);
    let currentPrice: number | null = null;
    if (loader) {
      const prices = loader.getLandPrices();
      const matches = prices.filter(p => t.city.includes(p.city) || p.city.includes(t.city));
      if (matches.length > 0) {
        currentPrice = Math.round(
          matches.reduce((s, p) => s + (p.price_per_sqm ?? 0), 0) / matches.length
        );
      }
    }
    const ret = calcReturn(prefKey, t.propertyType, investmentHorizon, riskTolerance);
    const risk = calcRisk(prefKey, t.propertyType);
    return { ...t, prefKey, ret, risk, currentPrice };
  });

  const allocations = calcAllocation(
    assetData.map(a => ({ ret: a.ret, risk: a.risk, budget: a.budgetManYen, prefKey: a.prefKey })),
    optimizeFor,
    totalBudget,
  );

  const assets = assetData.map((a, i) => ({
    prefecture: a.prefecture,
    city: a.city,
    propertyType: a.propertyType,
    budgetManYen: a.budgetManYen,
    allocationPct: allocations[i],
    expectedAnnualReturnPct: a.ret,
    riskScore: a.risk,
    liquidityScore: LIQUIDITY[a.prefKey] ?? 6,
    currentPricePerSqm: a.currentPrice,
    strengthSummary: STRENGTHS[a.prefKey] ?? '地域固有の強み',
    weaknessSummary: WEAKNESSES[a.prefKey] ?? '地域固有の課題',
    recommendation: getRecommendation(a.ret, a.risk),
  }));

  // Portfolio-level metrics
  const wRet = assets.reduce((s, a, i) => s + a.expectedAnnualReturnPct * (allocations[i] / 100), 0);
  const wRisk = assets.reduce((s, a, i) => s + a.riskScore * (allocations[i] / 100), 0);
  const portfolioReturn = Math.round(wRet * 10) / 10;
  const portfolioRisk = Math.round(wRisk * 10) / 10;
  const prefKeys = new Set(assetData.map(a => a.prefKey));
  const typeKeys = new Set(assetData.map(a => a.propertyType));
  const divScore = Math.min(100, Math.round((prefKeys.size / targets.length) * 60 + (typeKeys.size / targets.length) * 40));
  const riskFreeRate = 0.3;
  const sharpe = Math.round(((portfolioReturn - riskFreeRate) / portfolioRisk) * 100) / 100;

  const topAsset = assets.reduce((best, a) => (a.allocationPct > best.allocationPct ? a : best), assets[0]);
  const topRec = `${topAsset.prefecture} ${topAsset.city}（${topAsset.allocationPct}%配分・期待利回り${topAsset.expectedAnnualReturnPct}%）`;

  const keyInsights: string[] = [
    `ポートフォリオ期待年率リターン: ${portfolioReturn}%`,
    `加重リスクスコア: ${portfolioRisk}/10（${riskTolerance === 'low' ? '保守的' : riskTolerance === 'high' ? '積極的' : '標準的'}設定）`,
    `分散スコア: ${divScore}/100 — ${divScore >= 70 ? '良好な分散' : divScore >= 40 ? '中程度の分散' : '集中リスクあり'}`,
    `シャープレシオ: ${sharpe}（> 0.5 で良好）`,
    `投資期間 ${investmentHorizon} では${investmentHorizon === '10y' ? '長期複利効果を最大化可能' : investmentHorizon === '5y' ? '中期的な価格上昇を取り込める' : '流動性重視が推奨'}`,
  ];

  if (prefKeys.size < targets.length) {
    keyInsights.push('同一都道府県への集中投資あり — 地域リスクの分散を検討してください');
  }

  if (!includeMarkdown) {
    return {
      optimizeFor, riskTolerance, investmentHorizon, totalBudgetManYen: totalBudget,
      assets, portfolioReturnPct: portfolioReturn, portfolioRiskScore: portfolioRisk,
      diversificationScore: divScore, sharpeRatio: sharpe, topRecommendation: topRec,
      keyInsights,
    };
  }

  const typeLabel: Record<string, string> = {
    residential: '住宅', commercial: '商業', office: 'オフィス', land: '土地',
  };
  const recLabel: Record<string, string> = {
    strong_buy: '◎ 強く推奨', buy: '○ 推奨', hold: '△ 保留',
    reduce: '▼ 削減検討', sell: '✕ 売却検討',
  };
  const horizonLabel: Record<string, string> = { '3y': '3年', '5y': '5年', '10y': '10年' };
  const optLabel: Record<string, string> = {
    return: '最大リターン重視', risk_adjusted: 'リスク調整後リターン重視',
    diversification: '分散重視', stability: '安定性重視',
  };

  const rows = assets.map((a, i) =>
    `| ${i + 1} | ${a.prefecture} ${a.city} | ${typeLabel[a.propertyType] ?? a.propertyType} | ` +
    `${a.budgetManYen.toLocaleString()} | ${a.allocationPct}% | ${a.expectedAnnualReturnPct}% | ` +
    `${a.riskScore}/10 | ${a.liquidityScore}/10 | ${recLabel[a.recommendation]} |`
  ).join('\n');

  const strengthRows = assets.map((a, i) =>
    `### 物件 ${i + 1}: ${a.prefecture} ${a.city}（${typeLabel[a.propertyType] ?? a.propertyType}）\n` +
    `- **強み**: ${a.strengthSummary}\n` +
    `- **弱み**: ${a.weaknessSummary}\n` +
    (a.currentPricePerSqm ? `- **参考地価**: ${a.currentPricePerSqm.toLocaleString()} 円/㎡\n` : '')
  ).join('\n');

  const markdownReport = `# 不動産投資ポートフォリオ最適化レポート

## 基本設定
- **最適化目標**: ${optLabel[optimizeFor] ?? optimizeFor}
- **リスク許容度**: ${riskTolerance === 'low' ? '低（保守的）' : riskTolerance === 'high' ? '高（積極的）' : '中（標準的）'}
- **投資期間**: ${horizonLabel[investmentHorizon] ?? investmentHorizon}
- **総予算**: ${totalBudget.toLocaleString()} 万円

## ポートフォリオ全体指標

| 指標 | 値 |
|---|---|
| 期待年率リターン | **${portfolioReturn}%** |
| リスクスコア | **${portfolioRisk}/10** |
| 分散スコア | **${divScore}/100** |
| シャープレシオ | **${sharpe}** |

## 推奨配分

| # | エリア | 物件種別 | 予算（万円） | 配分 | 期待利回り | リスク | 流動性 | 判定 |
|---|---|---|---|---|---|---|---|---|
${rows}

## 最優先推奨
**${topRec}**

## 各物件分析
${strengthRows}

## キーインサイト
${keyInsights.map(i => `- ${i}`).join('\n')}

## 総評
${portfolioReturn >= 4.5 ? '積極的な収益性が期待できるポートフォリオです。' :
  portfolioReturn >= 3.5 ? '堅実なリターンが見込まれる標準的なポートフォリオです。' :
  '保守的・安定性重視のポートフォリオです。'}${
  divScore >= 70 ? ' 地理的・物件種別の分散も良好です。' :
  divScore >= 40 ? ' 分散は中程度です。追加エリアの検討も有効です。' :
  ' 集中リスクがあるため、エリア・種別の多様化を検討してください。'
}

---
*本レポートはサンプルデータに基づく参考値です。実際の投資判断は専門家にご相談ください。*`;

  return {
    optimizeFor, riskTolerance, investmentHorizon, totalBudgetManYen: totalBudget,
    assets, portfolioReturnPct: portfolioReturn, portfolioRiskScore: portfolioRisk,
    diversificationScore: divScore, sharpeRatio: sharpe, topRecommendation: topRec,
    keyInsights, markdownReport,
  };
}
