/**
 * Static search catalog for the ChatGPT-compatible `search` tool.
 *
 * Builds an in-memory catalog of all searchable entities (prefectures,
 * cities/wards, neighborhoods, future infrastructure projects, tools,
 * data sources) from the loader registry and static data files.
 *
 * Each entry has an ID, title, description, and keyword bag used for
 * ranked keyword matching at query time.
 */

import { listAvailable, getLoader } from '../data-loaders/registry.js';
import { getPrefectureDisplayName } from '../prefecture/resolver.js';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');

export interface CatalogEntry {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  url: string;
}

const BASE_URL = process.env.MCP_PUBLIC_URL ?? 'https://realestate-mcp.jp';

function entryUrl(id: string): string {
  return `${BASE_URL}/r/${encodeURIComponent(id)}`;
}

const TOOL_META: Record<string, { title: string; desc: string; keywords: string[] }> = {
  cross_analyze_real_estate_market: {
    title: '不動産市場クロス分析',
    desc: '地価トレンド・投資スコア・人流・教育・企業立地を総合分析',
    keywords: ['不動産', '地価', '投資', '分析', 'クロス', '人流', '教育', '企業', 'market'],
  },
  assess_property_risk: {
    title: '災害リスク評価',
    desc: '浸水・土砂・地震リスクを統合評価しスコアリング',
    keywords: ['リスク', '災害', '地震', '浸水', '土砂', 'ハザード', 'risk'],
  },
  assess_family_friendly_score: {
    title: 'ファミリー向け適性評価',
    desc: '教育・安全・医療の3軸で住宅適地を総合評価',
    keywords: ['ファミリー', '家族', '教育', '安全', '医療', '住宅', '学校', 'family'],
  },
  predict_corporate_demand: {
    title: '企業立地需要予測',
    desc: '製造業・オフィス・小売の企業需要スコアを算出',
    keywords: ['企業', '法人', 'オフィス', '需要', '製造業', '小売', 'corporate'],
  },
  generate_area_report: {
    title: 'エリアレポート生成',
    desc: 'Markdown / PDF形式の包括的エリア分析レポートを生成',
    keywords: ['レポート', 'PDF', 'Markdown', '報告書', '分析', 'report'],
  },
  open_dashboard: {
    title: 'ダッシュボード表示',
    desc: '可視化ダッシュボード（2D / PLATEAU 3D）を開く',
    keywords: ['ダッシュボード', '可視化', '3D', 'PLATEAU', 'UI', 'dashboard'],
  },
  quick_visual_summary: {
    title: 'ChatGPTビジュアル要約',
    desc: 'ChatGPT内で地図・グラフ・次アクションをまとめて表示するレンダーツール',
    keywords: ['ChatGPT', 'ビジュアル', '要約', '地図', 'グラフ', '次アクション', 'visual', 'summary', 'render'],
  },
  simulate_leveraged_cashflow: {
    title: 'レバレッジ10年キャッシュフロー試算',
    desc: '銀行借入の利率・賃料・経費・税務前提から10年の年次収支、DSCR、IRR、感応度を試算',
    keywords: ['レバレッジ', '融資', '借入', '金利', '賃料', 'キャッシュフロー', 'DSCR', 'IRR', '10年', 'loan', 'cashflow'],
  },
  compare_prefectures: {
    title: '都道府県比較',
    desc: '最大5都道府県を横断比較（地価・人口・リスク・投資スコア）',
    keywords: ['比較', '都道府県', '横断', 'ランキング', 'compare'],
  },
  drill_down_local_analysis: {
    title: '街区ドリルダウン分析',
    desc: '町丁目レベルの詳細分析（人流・商業・教育を含む）',
    keywords: ['ドリルダウン', '街区', '町丁目', '詳細', 'ローカル', '深掘り'],
  },
  evaluate_store_location: {
    title: '店舗出店適地評価',
    desc: '人流・交通・競合分布から店舗出店適地をスコアリング',
    keywords: ['店舗', '出店', '立地', '商業', 'コンビニ', 'カフェ', 'レストラン', 'store'],
  },
  simulate_landscape_impact: {
    title: '日照・影シミュレーション',
    desc: 'PLATEAU 3D建物データ + SunCalc で日影をシミュレート',
    keywords: ['日照', '影', 'シミュレーション', 'PLATEAU', '建物', '高さ', 'shadow', 'sun'],
  },
  forecast_land_price_trend: {
    title: '地価トレンド予測',
    desc: '線形回帰・移動平均で将来地価を予測しCAGR・投資シグナルを返す',
    keywords: ['地価', '予測', 'トレンド', 'CAGR', '投資', 'forecast', 'price'],
  },
  scenario_what_if: {
    title: 'What-If シナリオ分析',
    desc: '新駅・大型施設・人口変動などの仮想イベントが地価に与える影響を試算',
    keywords: ['シナリオ', 'What-If', '新駅', '商業施設', '人口', '仮想', 'scenario'],
  },
  portfolio_optimizer: {
    title: 'ポートフォリオ最適化',
    desc: '複数エリアの投資配分を最適化しシャープレシオ・リスク調整リターンを算出',
    keywords: ['ポートフォリオ', '最適化', '分散', 'シャープレシオ', '配分', 'portfolio'],
  },
  simulate_aichi_future: {
    title: '愛知県将来価値シミュレーター',
    desc: 'リニア中央新幹線・セントレア・トヨタ・万博の地価影響を試算',
    keywords: ['愛知', 'リニア', '新幹線', 'セントレア', 'トヨタ', '万博', '将来', 'aichi', 'future'],
  },
  discover_opportunities: {
    title: 'Opportunity Radar（エリア発見）',
    desc: '都道府県内を横断スキャンし投資/出店/居住/オフィス/開発に適したエリア仮説カードを返す',
    keywords: ['発見', '機会', 'opportunity', 'radar', '投資', '出店', '居住', 'オフィス', '開発', 'エリア', '提案', 'スキャン'],
  },
  get_real_estate_macro_snapshot: {
    title: '不動産マクロスナップショット',
    desc: '地価YoY・取引件数・人口減＋e-Stat建築着工・金利プロキシを一枚で',
    keywords: ['マクロ', '景気', '地価', '取引', '人口', '着工', '金利', 'e-Stat', 'FRED', 'macro', 'snapshot'],
  },
};

export function buildCatalog(): CatalogEntry[] {
  const entries: CatalogEntry[] = [];

  // -- Tools --
  for (const [name, meta] of Object.entries(TOOL_META)) {
    entries.push({
      id: `tool:${name}`,
      title: `${meta.title} (${name})`,
      description: meta.desc,
      keywords: [...meta.keywords, name],
      url: entryUrl(`tool:${name}`),
    });
  }

  // -- Prefectures + Cities --
  for (const prefKey of listAvailable()) {
    const displayName = getPrefectureDisplayName(prefKey);
    const loader = getLoader(prefKey);
    const caps = loader.capabilities;

    entries.push({
      id: `pref:${prefKey}`,
      title: `${displayName} 概要`,
      description: `${displayName}の不動産市場データ（地価・人口・取引・リスク）`,
      keywords: [displayName, prefKey, '都道府県', '概要'],
      url: entryUrl(`pref:${prefKey}`),
    });

    const cities = loader.getLandPrices().reduce<string[]>((acc, r) => {
      if (!acc.includes(r.city)) acc.push(r.city);
      return acc;
    }, []);

    for (const city of cities) {
      const areaId = `area:${prefKey}:${city}`;
      entries.push({
        id: areaId,
        title: `${displayName} ${city} 不動産分析`,
        description: `${displayName}${city}の地価・取引・人口・リスク総合分析`,
        keywords: [displayName, city, prefKey, '地価', '分析', '不動産'],
        url: entryUrl(areaId),
      });
    }

    // -- Data sources --
    const kinds: [string, string, boolean][] = [
      ['land_price', '地価公示データ', true],
      ['transactions', '取引事例データ', caps.transactions],
      ['population', '人口推移データ', true],
      ['human_flow', '人流データ', caps.humanFlow],
      ['education', '教育環境データ', caps.education],
      ['corporate', '企業立地データ', caps.corporate],
      ['transport', '交通データ', caps.transport],
      ['commercial', '商業施設データ', caps.commercial],
      ['medical', '医療施設データ', caps.medical],
      ['zoning', '用途地域データ', caps.zoning],
      ['vacancy', '空き家率データ', caps.vacancy],
      ['population_projection', '将来人口推計データ', caps.populationProjection],
      ['rosenka', '路線価データ', caps.rosenka],
    ];
    for (const [kind, label, available] of kinds) {
      if (!available) continue;
      entries.push({
        id: `data:${kind}:${prefKey}`,
        title: `${displayName} ${label}`,
        description: `${displayName}の${label}`,
        keywords: [displayName, prefKey, label, kind],
        url: entryUrl(`data:${kind}:${prefKey}`),
      });
    }
  }

  // -- Neighborhoods (Aichi special) --
  try {
    const nhPath = resolve(ROOT, 'data', 'aichi', 'neighborhoods.json');
    if (existsSync(nhPath)) {
      const nhData = JSON.parse(readFileSync(nhPath, 'utf-8')) as Array<{
        cho_me?: string; city?: string; tags?: string[]; notes?: string;
      }>;
      for (const nh of nhData) {
        if (!nh.cho_me) continue;
        const city = nh.city ?? '名古屋市';
        const id = `neighborhood:aichi:${city}:${nh.cho_me}`;
        entries.push({
          id,
          title: `愛知県 ${city} ${nh.cho_me}`,
          description: nh.notes ?? `${city}${nh.cho_me}の街区データ`,
          keywords: ['愛知県', city, nh.cho_me, ...(nh.tags ?? []), '街区', '町丁目'],
          url: entryUrl(id),
        });
      }
    }
  } catch { /* non-fatal */ }

  // -- Future infrastructure (Aichi) --
  try {
    const fiPath = resolve(ROOT, 'data', 'aichi', 'future_infrastructure.json');
    if (existsSync(fiPath)) {
      const fiData = JSON.parse(readFileSync(fiPath, 'utf-8')) as Array<{
        project?: string; scenario?: string; primary_cities?: string[]; impact_summary?: string;
      }>;
      for (const fi of fiData) {
        const scenario = fi.scenario ?? fi.project ?? 'unknown';
        const id = `future:aichi:${scenario}`;
        entries.push({
          id,
          title: `愛知県 ${fi.project ?? scenario} 将来インフラ`,
          description: fi.impact_summary ?? `${fi.project ?? scenario}の地価影響予測`,
          keywords: [
            '愛知県', fi.project ?? '', scenario, '将来', 'インフラ', '開発',
            ...(fi.primary_cities ?? []),
          ].filter(Boolean),
          url: entryUrl(id),
        });
      }
    }
  } catch { /* non-fatal */ }

  return entries;
}
