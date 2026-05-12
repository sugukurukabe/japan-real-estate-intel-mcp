import type { QuickVisualSummaryInput, QuickVisualSummaryOutput, VisualNextAction } from '../schemas.js';
import { resolvePrefecture, getPrefectureDisplayName } from '../prefecture/resolver.js';
import { ATTRIBUTION } from '../data/attribution.js';

const DASHBOARD_URI = 'ui://japan-real-estate-intel/dashboard';
const DASHBOARD_3D_URI = 'ui://japan-real-estate-intel/dashboard-3d';

const INTENT_LABEL: Record<QuickVisualSummaryInput['intent'], string> = {
  investment: '投資機会',
  arbitrage: '価格トライアングル',
  comparison: 'エリア比較',
  renovation: 'リノベ利回り',
  contract: '契約支援',
  store: '店舗出店',
  overview: '総合ダッシュボード',
  cashflow: '融資キャッシュフロー',
};

const INTENT_LAYER: Record<QuickVisualSummaryInput['intent'], string> = {
  investment: 'land_price',
  arbitrage: 'land_price',
  comparison: 'land_price',
  renovation: 'land_price',
  contract: 'flood_risk',
  store: 'human_flow',
  overview: 'land_price',
  cashflow: 'land_price',
};

function buildDashboardUrl(input: QuickVisualSummaryInput, prefKey: string, layer: string): string {
  const params = new URLSearchParams();
  params.set('prefecture', prefKey);
  params.set('layer', layer);
  if (input.area) params.set('area', input.area);
  if (input.intent === 'renovation') params.set('mode', 'renovation');
  if (input.intent === 'contract') params.set('mode', 'contract');
  if (input.intent === 'store') params.set('mode', 'store');
  if (input.intent === 'cashflow') params.set('mode', 'cashflow');
  if (input.compact) params.set('embed', 'chatgpt');
  return `dashboard.html?${params.toString()}`;
}

function buildNextActions(area: string, prefDisplay: string, intent: QuickVisualSummaryInput['intent']): VisualNextAction[] {
  const base = [
    {
      label: 'このエリアを深掘り',
      prompt: `${prefDisplay} ${area}を、地価・人流・災害リスク・将来性の観点で深掘り分析して`,
      tool: 'cross_analyze_real_estate_market',
    },
    {
      label: '価格トライアングルで見る',
      prompt: `${prefDisplay} ${area}を含めて、路線価・公示地価・取引価格の歪みを価格トライアングルで分析して`,
      tool: 'detect_arbitrage_signals',
    },
    {
      label: 'レポート化',
      prompt: `${prefDisplay} ${area}の分析結果を、顧客説明に使える短い投資レポートにまとめて`,
      tool: 'generate_area_report',
    },
  ];

  if (intent === 'store') {
    return [
      {
        label: '出店適性を判定',
        prompt: `${prefDisplay} ${area}でカフェ・小売・飲食店の出店適性を比較して`,
        tool: 'evaluate_store_location',
      },
      ...base,
    ];
  }

  if (intent === 'contract') {
    return [
      {
        label: '契約リスクを確認',
        prompt: `${prefDisplay} ${area}の物件について、売買契約前に確認すべきリスクと推奨特約を整理して`,
        tool: 'generate_contract_support_package',
      },
      ...base,
    ];
  }

  if (intent === 'renovation') {
    return [
      {
        label: 'リノベ利回りを見る',
        prompt: `${prefDisplay} ${area}でリノベ向きの物件条件と利回り目安を出して`,
        tool: 'analyze_renovation_yield',
      },
      ...base,
    ];
  }

  if (intent === 'cashflow') {
    return [
      {
        label: 'レバレッジCFを試算',
        prompt:
          `${prefDisplay} ${area}の投資物件想定で simulate_leveraged_cashflow を実行して。購入価格・取得費用・年利・LTV・年間賃料・空室率・経費・固定資産税・出口キャップを仮置きし、年次表・DSCR・税引後CF・期間IRR・Equity Multiple・感応度を表で出して`,
        tool: 'simulate_leveraged_cashflow',
      },
      ...base,
    ];
  }

  if (intent === 'investment') {
    return [
      {
        label: '銀行借入付きCF試算',
        prompt:
          `${prefDisplay} ${area}エリアの投資想定で simulate_leveraged_cashflow を回して。代表的な購入価格帯と金利・LTV・賃料・空室を置き、返済方式は元利均等でDSCRと税引後キャッシュの年次推移を出して`,
        tool: 'simulate_leveraged_cashflow',
      },
      ...base,
    ];
  }

  return base;
}

function buildMarkdown(result: Omit<QuickVisualSummaryOutput, 'markdownReport'>): string {
  const lines = [
    `# ${result.title}`,
    '',
    result.summary,
    '',
    `- 表示: ${result.mode === '3d' ? 'PLATEAU 3D' : '2D地図'} / ${result.layer}`,
    `- 対象: ${result.prefecture} ${result.area}`,
    `- ダッシュボード: ${result.dashboardUrl}`,
    '',
    '## 次にできること',
  ];
  for (const action of result.nextActions) {
    lines.push(`- **${action.label}**: ${action.prompt}`);
  }
  lines.push('', `> ${result.attribution}`);
  return lines.join('\n');
}

export function quickVisualSummary(input: QuickVisualSummaryInput): QuickVisualSummaryOutput {
  const prefKey = resolvePrefecture(input.prefecture);
  const prefDisplay = getPrefectureDisplayName(prefKey);
  const area = input.area ?? `${prefDisplay}全体`;
  const layer = INTENT_LAYER[input.intent];
  const dashboardUri = input.mode === '3d' ? DASHBOARD_3D_URI : DASHBOARD_URI;
  const dashboardUrl = buildDashboardUrl(input, prefKey, layer);
  const nextActions = buildNextActions(area, prefDisplay, input.intent);

  const base = {
    title: `${prefDisplay} ${area} — ${INTENT_LABEL[input.intent]}ビジュアル要約`,
    summary: `ChatGPT内で${INTENT_LABEL[input.intent]}に最適化した地図・グラフ・次アクションを表示します。`,
    prefecture: prefDisplay,
    area,
    intent: input.intent,
    dashboardUri,
    dashboardUrl,
    layer,
    mode: input.mode,
    nextActions,
    attribution: ATTRIBUTION,
  };

  return {
    ...base,
    markdownReport: buildMarkdown(base),
  };
}
