/**
 * ChatGPT Apps SDK compatible `fetch` tool.
 *
 * Given an ID from the `search` tool, routes to the appropriate
 * existing tool and returns the result as structured text (Markdown).
 *
 * Conforms to the OpenAI MCP connector schema:
 * - Input:  { id: string }
 * - Output: { id, title, text, url, metadata }
 */

import { crossAnalyze } from './cross_analyze_real_estate_market.js';
import { drillDownLocalAnalysis } from './drill_down_local_analysis.js';
import { simulateAichiFuture } from './simulate_aichi_future.js';
import { getLoader, listAvailable } from '../data-loaders/registry.js';
import { resolvePrefecture, getPrefectureDisplayName } from '../prefecture/resolver.js';
import { ATTRIBUTION } from '../data/attribution.js';

const BASE_URL = process.env.MCP_PUBLIC_URL ?? 'https://realestate-mcp.jp';

export interface FetchInput {
  id: string;
}

export interface FetchOutput {
  id: string;
  title: string;
  text: string;
  url: string;
  metadata: Record<string, unknown>;
}

export function mcpFetch(input: FetchInput): FetchOutput {
  const { id } = input;
  const url = `${BASE_URL}/r/${encodeURIComponent(id)}`;

  const [kind, ...rest] = id.split(':');
  switch (kind) {
    case 'area':
      return fetchArea(id, url, rest);
    case 'pref':
      return fetchPrefecture(id, url, rest);
    case 'neighborhood':
      return fetchNeighborhood(id, url, rest);
    case 'future':
      return fetchFuture(id, url, rest);
    case 'tool':
      return fetchToolInfo(id, url, rest);
    case 'data':
      return fetchDataSummary(id, url, rest);
    default:
      return { id, title: 'Unknown', text: `ID "${id}" is not recognized.`, url, metadata: {} };
  }
}

function fetchArea(id: string, url: string, parts: string[]): FetchOutput {
  const [prefKeyRaw, ...cityParts] = parts;
  const prefKey = prefKeyRaw ?? 'aichi';
  const city = cityParts.join(':') || '名古屋市中区';
  const displayName = getPrefectureDisplayName(prefKey);

  const result = crossAnalyze({
    prefecture: displayName,
    area: city,
    propertyType: 'mixed',
    timeRange: '5y',
    includeRisk: true,
    includeHumanFlow: true,
    includeEducation: true,
    includeCorporate: true,
    includeTransport: false,
    includeCommercial: false,
    includeMedical: false,
  });

  const lines = [
    `# ${displayName} ${city} 不動産市場分析`,
    '',
    `## サマリー`,
    result.summary,
    '',
    `## 地価トレンド`,
    `- 現在: ¥${result.priceTrend.current.toLocaleString()}/㎡`,
    `- 変動率: ${result.priceTrend.changeRate}%`,
    `- 予測: ${result.priceTrend.forecast}`,
    '',
    `## スコア`,
    `- 投資スコア: ${result.investmentScore}/100`,
    `- リスクスコア: ${result.riskScore}/100`,
    '',
    `## 主要インサイト`,
    ...result.keyInsights.map((i) => `- ${i}`),
    '',
    `---`,
    ATTRIBUTION,
  ];

  return {
    id,
    title: `${displayName} ${city} 不動産分析`,
    text: lines.join('\n'),
    url,
    metadata: { source: 'cross_analyze_real_estate_market', attribution: ATTRIBUTION, prefecture: prefKey, city },
  };
}

function fetchPrefecture(id: string, url: string, parts: string[]): FetchOutput {
  const prefKey = parts[0] ?? 'aichi';
  const displayName = getPrefectureDisplayName(prefKey);
  const loader = getLoader(prefKey);
  const caps = loader.capabilities;
  const landPrices = loader.getLandPrices();
  const population = loader.getPopulation();

  const avgPrice = landPrices.length > 0
    ? Math.round(landPrices.reduce((s, r) => s + r.price_per_sqm, 0) / landPrices.length)
    : 0;
  const totalPop = population.reduce((s, r) => s + (r.population_2025 ?? r.population_2020 ?? 0), 0);
  const cities = [...new Set(landPrices.map((r) => r.city))].slice(0, 20);

  const capsList = Object.entries(caps)
    .filter(([, v]) => v)
    .map(([k]) => k)
    .join(', ');

  const lines = [
    `# ${displayName} 概要`,
    '',
    `| 項目 | 値 |`,
    `|---|---|`,
    `| 地価データ件数 | ${landPrices.length} |`,
    `| 平均地価 | ¥${avgPrice.toLocaleString()}/㎡ |`,
    `| 人口(2025推計) | ${totalPop.toLocaleString()} |`,
    `| 対応データ種別 | ${capsList} |`,
    '',
    `## 主要エリア`,
    ...cities.map((c) => `- ${c}`),
    '',
    `---`,
    ATTRIBUTION,
  ];

  return {
    id,
    title: `${displayName} 概要`,
    text: lines.join('\n'),
    url,
    metadata: { source: 'prefecture_overview', attribution: ATTRIBUTION, prefecture: prefKey },
  };
}

function fetchNeighborhood(id: string, url: string, parts: string[]): FetchOutput {
  const [prefKey, city, ...nhParts] = parts;
  const neighborhood = nhParts.join(':') || '';
  const displayName = getPrefectureDisplayName(prefKey ?? 'aichi');

  const result = drillDownLocalAnalysis({
    prefecture: displayName,
    city: city ?? '名古屋市中区',
    neighborhood: neighborhood || undefined,
    focus: 'all',
    exportFormat: 'markdown',
  });

  return {
    id,
    title: `${displayName} ${city ?? ''} ${neighborhood} 街区分析`,
    text: result.markdownReport ?? JSON.stringify(result, null, 2),
    url,
    metadata: { source: 'drill_down_local_analysis', attribution: ATTRIBUTION, prefecture: prefKey ?? 'aichi', city, neighborhood },
  };
}

function fetchFuture(id: string, url: string, parts: string[]): FetchOutput {
  const [prefKey, scenario] = parts;
  if (prefKey !== 'aichi') {
    return { id, title: '未対応', text: `将来シミュレーションは現在愛知県のみ対応しています。`, url, metadata: {} };
  }

  const result = simulateAichiFuture({
    city: '名古屋市中村区',
    scenarios: scenario === 'all' ? ['all'] : [scenario as 'linear_chuo'],
    horizon: '10y',
    includeMarkdown: true,
  });

  return {
    id,
    title: `愛知県 ${scenario} 将来価値シミュレーション`,
    text: result.markdownReport ?? JSON.stringify(result, null, 2),
    url,
    metadata: { source: 'simulate_aichi_future', attribution: result.attribution, scenario },
  };
}

function fetchToolInfo(id: string, url: string, parts: string[]): FetchOutput {
  const toolName = parts.join(':');
  const meta: Record<string, { title: string; desc: string }> = {
    cross_analyze_real_estate_market: { title: '不動産市場クロス分析', desc: '地価トレンド・投資スコア・人流・教育・企業立地を総合分析するメインツール。prefecture, area, propertyType, timeRange を指定して呼び出す。' },
    assess_property_risk: { title: '災害リスク評価', desc: '浸水・土砂災害・地震リスクを統合評価。prefecture, area を指定。' },
    assess_family_friendly_score: { title: 'ファミリー向け適性評価', desc: '教育・安全・医療の3軸で住宅適地を評価。' },
    predict_corporate_demand: { title: '企業立地需要予測', desc: '製造業・オフィス・小売の需要スコア。' },
    generate_area_report: { title: 'エリアレポート生成', desc: 'Markdown / PDFの包括レポート。branding対応。' },
    compare_prefectures: { title: '都道府県比較', desc: '最大5都道府県を横断比較。' },
    drill_down_local_analysis: { title: '街区ドリルダウン', desc: '町丁目レベルの詳細分析。' },
    evaluate_store_location: { title: '店舗出店適地評価', desc: '人流・競合分布を考慮した出店スコア。' },
    simulate_landscape_impact: { title: '日照シミュレーション', desc: 'PLATEAU 3D + SunCalc。' },
    forecast_land_price_trend: { title: '地価トレンド予測', desc: 'CAGR・投資シグナルを返す。' },
    scenario_what_if: { title: 'What-Ifシナリオ', desc: '仮想イベントの影響試算。' },
    portfolio_optimizer: { title: 'ポートフォリオ最適化', desc: 'シャープレシオ・最適配分。' },
    simulate_aichi_future: { title: '愛知県将来シミュレーター', desc: 'リニア・セントレア・トヨタの影響。' },
    open_dashboard: { title: 'ダッシュボード', desc: '可視化UI（2D/3D）。' },
  };

  const info = meta[toolName];
  if (!info) {
    return { id, title: 'Unknown tool', text: `Tool "${toolName}" not found.`, url, metadata: {} };
  }

  return {
    id,
    title: info.title,
    text: `# ${info.title}\n\nMCPツール名: \`${toolName}\`\n\n${info.desc}`,
    url,
    metadata: { source: 'tool_info', tool_name: toolName },
  };
}

function fetchDataSummary(id: string, url: string, parts: string[]): FetchOutput {
  const [kind, prefKey] = parts;
  const displayName = getPrefectureDisplayName(prefKey ?? 'aichi');
  const loader = getLoader(prefKey ?? 'aichi');

  let summary = '';
  let title = `${displayName} データ`;

  switch (kind) {
    case 'land_price': {
      const data = loader.getLandPrices();
      const cities = [...new Set(data.map((r) => r.city))];
      title = `${displayName} 地価公示データ`;
      summary = `件数: ${data.length}\n対象市区町村: ${cities.slice(0, 15).join(', ')}`;
      break;
    }
    case 'population': {
      const data = loader.getPopulation();
      title = `${displayName} 人口推移データ`;
      summary = `件数: ${data.length}\n対象: ${data.slice(0, 5).map((r) => r.city).join(', ')}`;
      break;
    }
    default:
      title = `${displayName} ${kind ?? 'unknown'} データ`;
      summary = `${kind} データは詳細ビューでご確認ください。`;
  }

  return {
    id,
    title,
    text: `# ${title}\n\n${summary}\n\n---\n${ATTRIBUTION}`,
    url,
    metadata: { source: 'data_summary', kind, prefecture: prefKey ?? 'aichi', attribution: ATTRIBUTION },
  };
}
