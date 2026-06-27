import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { completable } from '@modelcontextprotocol/sdk/server/completable.js';
import { z } from 'zod';
import {
  registerAppTool,
  registerAppResource,
  RESOURCE_MIME_TYPE,
} from '@modelcontextprotocol/ext-apps/server';
import { completePrefecture, completeArea, searchAreaCandidates } from './completion/area-completion.js';
import {
  CrossAnalyzeInput,
  AssessRiskInput,
  GenerateReportInput,
  OpenDashboardInput,
  OpenDashboardOutput,
  QuickVisualSummaryInput,
  QuickVisualSummaryOutput,
  FamilyFriendlyInput,
  CorporateDemandInput,
  ComparePrefecturesInput,
  DrillDownInput,
  StoreLocationInput,
  LandscapeInput,
  ForecastLandPriceTrendInput,
  ScenarioWhatIfInput,
  PortfolioOptimizerInput,
  DiscoverOpportunitiesInput,
  DiscoverOpportunitiesOutput,
  RenovationYieldInput,
  FutureTimelineInput,
  ChochouProfileInput,
  RecommendRenovationTargetsInput,
  ContractSupportInput,
  AssessContractRiskInput,
  CompositeValueScoreInput,
  CompositeValueScoreOutput,
  ZoningInfoInput,
  VacancyStatsInput,
  PopulationOutlookInput,
  MacroSnapshotInput,
  ArbitrageScanInput,
  ArbitrageScanOutput,
  PurchaseReviewInput,
  PurchaseReviewOutput,
  LeveragedCashflowInput,
  LeveragedCashflowOutput,
  AssessExteriorVisualsInput,
  AnalyzeCommuteAccessibilityInput,
  OptimizePortfolioInput,
  OptimizePortfolioOutput,
  AuditZoningComplianceInput,
  AuditZoningComplianceOutput,
  ForecastDemographicShiftInput,
  ForecastDemographicShiftOutput,
} from './schemas.js';
import { crossAnalyze } from './tools/cross_analyze_real_estate_market.js';
import { assessPropertyRisk } from './tools/assess_property_risk.js';
import { generateAreaReport } from './tools/generate_area_report.js';
import { openDashboard } from './tools/open_dashboard.js';
import { quickVisualSummary } from './tools/quick_visual_summary.js';
import { assessFamilyFriendlyScore } from './tools/assess_family_friendly_score.js';
import { predictCorporateDemand } from './tools/predict_corporate_demand.js';
import { comparePrefectures } from './tools/compare_prefectures.js';
import { drillDownLocalAnalysis } from './tools/drill_down_local_analysis.js';
import { evaluateStoreLocation } from './tools/evaluate_store_location.js';
import { simulateLandscape } from './tools/simulate_landscape_impact.js';
import { forecastLandPriceTrend } from './tools/forecast_land_price_trend.js';
import { portfolioOptimizer } from './tools/portfolio_optimizer.js';
import { optimizePortfolioTool } from './tools/optimize_portfolio.js';
import { auditZoningComplianceTool } from './tools/audit_zoning_compliance.js';
import { forecastDemographicShiftTool } from './tools/forecast_demographic_shift.js';
import { simulateAichiFuture, AichiFutureInput } from './tools/simulate_aichi_future.js';
import { scenarioWhatIf } from './tools/scenario_what_if.js';
import { discoverOpportunitiesTool } from './tools/discover_opportunities.js';
import { analyzeRenovationYieldTool } from './tools/analyze_renovation_yield.js';
import { getFutureTimelineTool } from './tools/get_future_timeline.js';
import { getChochouProfileTool } from './tools/get_chochou_profile.js';
import { recommendRenovationTargetsTool } from './tools/recommend_renovation_targets.js';
import { generateContractSupportPackageTool } from './tools/generate_contract_support_package.js';
import { assessContractRiskTool } from './tools/assess_contract_risk.js';
import { compositeValueScoreTool } from './tools/composite_value_score.js';
import { getZoningInfoTool } from './tools/get_zoning_info.js';
import { getVacancyStatsTool } from './tools/get_vacancy_stats.js';
import { getPopulationOutlookTool } from './tools/get_population_outlook.js';
import { getRealEstateMacroSnapshotTool } from './tools/get_real_estate_macro_snapshot.js';
import { detectArbitrageSignals } from './tools/detect_arbitrage_signals.js';
import { assessExteriorVisuals } from './tools/assess_exterior_visuals.js';
import { analyzeCommuteAccessibilityTool } from './tools/analyze_commute_accessibility.js';
import { reviewPurchaseRecommendation } from './analysis/purchase_review.js';
import { simulateLeveragedCashflow } from './analysis/leveraged_cashflow.js';
import { mcpSearch } from './tools/search.js';
import { mcpFetch } from './tools/fetch.js';
import { getLandPriceResource } from './resources/land_price.js';
import { getFloodResource } from './resources/flood.js';
import { getPopulationResource } from './resources/population.js';
import { getDashboardHtml } from './resources/ui_dashboard.js';
import { getDashboard3dHtml } from './resources/ui_dashboard_3d.js';
import { ATTRIBUTION } from './data/attribution.js';
import { formatErrorMessage, isClientError } from './errors.js';
import { toolLogger } from './logger.js';
import { checkToolCallBudget, recordToolCall } from './tier-usage.js';
import { isToolAllowed, isResourceAllowed, isPromptAllowed, type Tier } from './tiers.js';
import './data-loaders/index.js';

const DASHBOARD_URI = 'ui://japan-real-estate-intel/dashboard';
const DASHBOARD_3D_URI = 'ui://japan-real-estate-intel/dashboard-3d';
const LEAFLET_CDN = 'https://unpkg.com';
const TILE_CDN = 'https://tile.openstreetmap.org';
const CARTO_TILE_CDN = 'https://*.basemaps.cartocdn.com';
const JSDELIVR_CDN = 'https://cdn.jsdelivr.net';
const DASHBOARD_CSP = {
  resourceDomains: [LEAFLET_CDN, 'https://cdnjs.cloudflare.com', CARTO_TILE_CDN, 'https://api.qrserver.com'],
  connectDomains: [TILE_CDN, 'https://*.tile.openstreetmap.org', CARTO_TILE_CDN],
};
const DASHBOARD_3D_CSP = {
  resourceDomains: [LEAFLET_CDN, 'https://cdnjs.cloudflare.com', JSDELIVR_CDN],
  connectDomains: [TILE_CDN, 'https://*.tile.openstreetmap.org'],
};

type ToolResult = {
  content: { type: 'text'; text: string }[];
  structuredContent?: Record<string, unknown>;
  _meta?: Record<string, unknown>;
  isError?: boolean;
};

const RO = { readOnlyHint: true, destructiveHint: false, openWorldHint: false } as const;
const WIDGET_DOMAIN = 'https://realestate-mcp.jp';
const DEFAULT_TIER: Tier = (process.env.DEFAULT_TIER as Tier) ?? 'free';

/**
 * compact モード時、最初のテキストコンテンツの先頭に TL;DR 行を追加する。
 * detailed モード（または省略時）はそのまま返す。
 */
function applyOutputMode(
  result: ToolResult,
  tldr: string,
  mode: 'compact' | 'detailed' = 'compact',
): ToolResult {
  if (mode === 'detailed' || result.isError || result.content.length === 0) return result;
  const first = result.content[0];
  return {
    ...result,
    content: [
      { type: 'text' as const, text: `**[TL;DR]** ${tldr}\n\n${first.text}` },
      ...result.content.slice(1),
    ],
  };
}

export function createServer(defaultTier: Tier = DEFAULT_TIER, clientId?: string): McpServer {
  const server = new McpServer({
    name: 'japan-real-estate-intel-mcp',
    version: '6.16.0',
  });

  function withErrorHandling(
    toolName: string,
    prefecture: string,
    fn: () => Promise<ToolResult>,
    tier: Tier = defaultTier,
  ): Promise<ToolResult> {
    if (!isToolAllowed(tier, toolName)) {
      const msg = `ツール "${toolName}" は現在のプラン (${tier}) では利用できません。アップグレードをご検討ください。`;
      server.sendLoggingMessage({ level: 'warning', data: { tool: toolName, tier, event: 'tier_blocked' } }).catch(() => {});
      return Promise.resolve({
        content: [{ type: 'text' as const, text: msg }],
        isError: true,
      });
    }
    const budgetMsg = checkToolCallBudget(tier, clientId);
    if (budgetMsg) {
      server.sendLoggingMessage({ level: 'warning', data: { tool: toolName, tier, event: 'quota_exceeded' } }).catch(() => {});
      return Promise.resolve({
        content: [{ type: 'text' as const, text: budgetMsg }],
        isError: true,
      });
    }
    recordToolCall(tier, clientId);
    const start = Date.now();
    server.sendLoggingMessage({ level: 'debug', data: { tool: toolName, prefecture, event: 'start' } }).catch(() => {});
    return fn().then(
      (result) => {
        const durationMs = Date.now() - start;
        toolLogger(toolName, prefecture, start);
        server.sendLoggingMessage({ level: 'debug', data: { tool: toolName, prefecture, durationMs, event: 'ok' } }).catch(() => {});
        return result;
      },
      (err: unknown) => {
        const durationMs = Date.now() - start;
        toolLogger(toolName, prefecture, start, err);
        const message = formatErrorMessage(err);
        const isWarn = isClientError(err);
        server.sendLoggingMessage({
          level: isWarn ? 'warning' : 'error',
          data: { tool: toolName, prefecture, durationMs, error: message, event: 'fail' },
        }).catch(() => {});
        return {
          content: [{ type: 'text' as const, text: message }],
          isError: !isWarn,
        };
      },
    );
  }

  function withPromptTierCheck<T>(
    promptName: string,
    handler: (args: T) => any
  ): (args: T) => any {
    return (args: T) => {
      if (!isPromptAllowed(defaultTier, promptName)) {
        throw new Error(`プロンプト "${promptName}" は現在のプラン (${defaultTier}) では利用できません。アップグレードをご検討ください。`);
      }
      return handler(args);
    };
  }

  // ── ChatGPT Apps SDK compatibility tools (search / fetch) ────────────────

  server.tool(
    'search',
    'Search the real estate data catalog for areas, tools, and data sources. ChatGPT-compatible. | 不動産データカタログを検索し、関連するエリア・ツール・データソースの候補一覧を返す。',
    { query: z.string().describe('検索クエリ（自然文OK。例: "名古屋 リニア", "東京 投資", "リスク 地震"）') },
    RO,
    (args) => withErrorHandling('search', 'global', async () => {
      const result = mcpSearch({ query: String(args.query) });
      const payload = { results: result.results };
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(payload) }],
        structuredContent: payload,
      };
    }),
  );

  server.tool(
    'fetch',
    'Fetch full document by ID from search results. Returns area analysis, forecasts, and summaries in Markdown. | 検索結果のIDからドキュメント全文を取得する。分析レポート・将来予測・データサマリをMarkdownで返す。',
    { id: z.string().describe('search ツールで取得したドキュメントID（例: "area:aichi:名古屋市中区"）') },
    RO,
    (args) => withErrorHandling('fetch', 'global', async () => {
      const result = mcpFetch({ id: String(args.id) });
      const payload = { id: result.id, title: result.title, text: result.text, url: result.url, metadata: result.metadata };
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(payload) }],
        structuredContent: payload,
      };
    }),
  );

  server.tool(
    'search_area_candidates',
    'Search municipality name candidates by partial text. Supports hiragana. | 市区町村名の候補検索。部分文字列から有効な市区町村候補を返す。ひらがな対応。',
    {
      prefecture: z.string().optional().describe('都道府県名（例: 愛知県, 東京都）'),
      query: z.string().optional().describe('市区町村名の一部（例: 名古屋, なごやしなか, 新宿）'),
      limit: z.number().int().min(1).max(20).optional().describe('最大候補数（1-20、デフォルト20）'),
    },
    RO,
    (args) => withErrorHandling('search_area_candidates', String(args.prefecture ?? 'aichi'), async () => {
      const result = searchAreaCandidates({
        prefecture: args.prefecture,
        query: args.query,
        limit: args.limit,
      });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        structuredContent: result,
      };
    }),
  );

  // ── Domain tools: 30 registerAppTool/server.tool entries below + 3 ChatGPT tools above = 33 total ──

  server.tool(
    'cross_analyze_real_estate_market',
    'Cross-analyze real estate market: land price trends, investment score, foot traffic, education, corporate presence. 10 prefectures. | 不動産市場クロス分析。地価・投資スコア・人流・教育・企業立地を総合分析。10都道府県対応。',
    CrossAnalyzeInput.shape,
    RO,
    (args) => withErrorHandling('cross_analyze_real_estate_market', String(args.prefecture ?? 'aichi'), async () => {
      const input = CrossAnalyzeInput.parse(args);
      const result = crossAnalyze(input);
      const tldr = `${input.area} 投資スコア ${result.investmentScore}/100、地価変化 ${result.priceTrend?.changeRate?.toFixed(1) ?? '—'}%、リスク ${result.riskScore}/100`;
      return applyOutputMode(
        {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
          structuredContent: { ...result, attribution: ATTRIBUTION },
        },
        tldr,
        input.output_mode,
      );
    }),
  );

  server.tool(
    'assess_property_risk',
    'Assess property disaster risk: flood, landslide, earthquake. Integrated scoring across 10 prefectures. | 災害リスク評価。浸水・土砂・地震リスクを統合スコアリング。全10都道府県対応。',
    AssessRiskInput.shape,
    RO,
    (args) => withErrorHandling('assess_property_risk', String(args.prefecture ?? 'aichi'), async () => {
      const input = AssessRiskInput.parse(args);
      const result = assessPropertyRisk(input);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        structuredContent: { ...result, attribution: ATTRIBUTION },
      };
    }),
  );

  server.tool(
    'assess_family_friendly_score',
    'Assess family-friendliness: education, safety, healthcare across 3 axes. 10 prefectures. | ファミリー向け適性評価。教育・安全・医療の3軸で住宅適地を総合評価。全10都道府県。',
    FamilyFriendlyInput.shape,
    RO,
    (args) => withErrorHandling('assess_family_friendly_score', String(args.prefecture ?? 'aichi'), async () => {
      const input = FamilyFriendlyInput.parse(args);
      const result = assessFamilyFriendlyScore(input);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        structuredContent: { ...result, attribution: ATTRIBUTION },
      };
    }),
  );

  server.tool(
    'predict_corporate_demand',
    'Predict corporate demand: manufacturing, office, retail demand scores. 10 prefectures. | 企業立地需要予測。製造業・オフィス・小売の企業需要スコアを算出。全10都道府県。',
    CorporateDemandInput.shape,
    RO,
    (args) => withErrorHandling('predict_corporate_demand', String(args.prefecture ?? 'aichi'), async () => {
      const input = CorporateDemandInput.parse(args);
      const result = predictCorporateDemand(input);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        structuredContent: { ...result, attribution: ATTRIBUTION },
      };
    }),
  );

  server.tool(
    'generate_area_report',
    'Generate comprehensive area report in Markdown/PDF with branding support. 10 prefectures. | エリアレポート生成。包括的な不動産分析をMarkdown/PDFで出力。ブランディング対応。全10都道府県。',
    GenerateReportInput.shape,
    RO,
    (args, extra) => withErrorHandling('generate_area_report', String(args.prefecture ?? 'aichi'), async () => {
      const input = GenerateReportInput.parse(args);
      const progressToken = extra?._meta?.progressToken;
      const onProgress = progressToken
        ? (progress: number, total: number, message?: string) => {
            extra.sendNotification({
              method: 'notifications/progress' as const,
              params: { progressToken, progress, total, message },
            } as never).catch(() => {});
          }
        : undefined;
      const result = await generateAreaReport(input, onProgress);
      return {
        content: [{ type: 'text' as const, text: result.markdownReport }],
        structuredContent: { ...result, attribution: ATTRIBUTION },
      };
    }),
  );

  registerAppTool(
    server,
    'open_dashboard',
    {
      title: '不動産ダッシュボード',
      description: 'Open visualization dashboard. 2D map or PLATEAU 3D view. MCP Apps UI. | 可視化ダッシュボードを開く。2Dマップ/PLATEAU 3Dビュー。MCP Apps UI対応。',
      inputSchema: OpenDashboardInput.shape,
      outputSchema: OpenDashboardOutput.shape,
      annotations: RO,
      _meta: {
        ui: { resourceUri: DASHBOARD_URI },
        'openai/outputTemplate': DASHBOARD_URI,
        'openai/toolInvocation/invoking': 'ダッシュボードを準備中…',
        'openai/toolInvocation/invoked': 'ダッシュボードの準備ができました。',
      },
    },
    (args) => withErrorHandling('open_dashboard', String(args.prefecture ?? 'aichi'), async () => {
      const input = OpenDashboardInput.parse(args);
      const result = openDashboard(input);
      const uiUri = result.mode === '3d' ? DASHBOARD_3D_URI : DASHBOARD_URI;
      return {
        content: [{
          type: 'text' as const,
          text: `ダッシュボードを表示${result.mode === '3d' ? ' (3D)' : ''}: ${result.prefecture} ${result.area} (レイヤー: ${result.layer})`,
        }],
        structuredContent: { ...result, attribution: ATTRIBUTION },
        _meta: { ui: { resourceUri: uiUri } },
      };
    }),
  );

  registerAppTool(
    server,
    'quick_visual_summary',
    {
      title: 'ChatGPTビジュアル要約',
      description: 'Render a ChatGPT-optimized real estate visual summary with map, charts, recommended next actions, and compact markdown fallback. Always use this when the user asks to show, visualize, compare, or continue in ChatGPT. | ChatGPT向けに地図・グラフ・次アクション・要約をまとめて表示するレンダーツール。',
      inputSchema: QuickVisualSummaryInput.shape,
      outputSchema: QuickVisualSummaryOutput.shape,
      annotations: RO,
      _meta: {
        ui: { resourceUri: DASHBOARD_URI },
        'openai/outputTemplate': DASHBOARD_URI,
        'openai/toolInvocation/invoking': 'ChatGPT向けビジュアル要約を準備中…',
        'openai/toolInvocation/invoked': 'ビジュアル要約を表示できます。',
      },
    },
    (args) => withErrorHandling('quick_visual_summary', String(args.prefecture ?? '愛知県'), async () => {
      const input = QuickVisualSummaryInput.parse(args);
      const result = quickVisualSummary(input);
      const uiUri = result.mode === '3d' ? DASHBOARD_3D_URI : DASHBOARD_URI;
      return {
        content: [{ type: 'text' as const, text: result.markdownReport }],
        structuredContent: result as unknown as Record<string, unknown>,
        _meta: { ui: { resourceUri: uiUri }, 'openai/outputTemplate': uiUri },
      };
    }),
  );

  server.tool(
    'compare_prefectures',
    'Compare up to 5 prefectures: land price, population, risk, investment score ranking. Markdown output. | 都道府県比較。最大5都道府県を横断比較し、地価・人口・リスク・投資スコアをランキング。',
    ComparePrefecturesInput.shape,
    RO,
    (args) => withErrorHandling('compare_prefectures', 'multi', async () => {
      const input = ComparePrefecturesInput.parse(args);
      const result = comparePrefectures(input);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        structuredContent: { ...result, attribution: ATTRIBUTION },
      };
    }),
  );

  server.tool(
    'drill_down_local_analysis',
    'Drill-down local analysis at block/neighborhood level including foot traffic, commercial, education. Markdown output. | 街区ドリルダウン分析。町丁目レベルの詳細分析。Markdown出力。',
    DrillDownInput.shape,
    RO,
    (args) => withErrorHandling('drill_down_local_analysis', String(args.prefecture ?? 'aichi'), async () => {
      const input = DrillDownInput.parse(args);
      const result = drillDownLocalAnalysis(input);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        structuredContent: { ...result, attribution: ATTRIBUTION },
      };
    }),
  );

  server.tool(
    'evaluate_store_location',
    'Evaluate store location suitability considering foot traffic, transport, competitor distribution. 10 prefectures. | 店舗出店適地評価。人流・交通・競合店分布を考慮したスコアを算出。全10都道府県。',
    StoreLocationInput.shape,
    RO,
    (args) => withErrorHandling('evaluate_store_location', String(args.prefecture ?? 'aichi'), async () => {
      const input = StoreLocationInput.parse(args);
      const result = evaluateStoreLocation(input);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        structuredContent: { ...result, attribution: ATTRIBUTION },
      };
    }),
  );

  server.tool(
    'simulate_landscape_impact',
    'Sunlight/shadow simulation using PLATEAU 3D buildings + SunCalc. | 日照・影シミュレーション。PLATEAU 3D建物データ+SunCalcで周辺建物の影響を分析。',
    LandscapeInput.shape,
    RO,
    (args) => withErrorHandling('simulate_landscape_impact', String(args.prefecture ?? 'aichi'), async () => {
      const input = LandscapeInput.parse(args);
      const result = simulateLandscape(input);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        structuredContent: { ...result, attribution: ATTRIBUTION },
      };
    }),
  );

  server.tool(
    'assess_exterior_visuals',
    'AI visual exterior audit of a property based on Google Street View static imagery + Gemini Vision AI. Falls back to simulated audit if API keys are missing. | AI街頭外観監査。ストリートビュー画像とGemini Vision AIを用いて建物の外観・道路幅・環境を自動評価。',
    AssessExteriorVisualsInput.shape,
    RO,
    (args) => withErrorHandling('assess_exterior_visuals', String(args.prefecture ?? 'aichi'), async () => {
      const input = AssessExteriorVisualsInput.parse(args);
      const result = await assessExteriorVisuals(input);
      return {
        content: [{ type: 'text' as const, text: result.markdownReport }],
        structuredContent: { ...result, attribution: ATTRIBUTION },
      };
    }),
  );

  server.tool(
    'analyze_commute_accessibility',
    'Transit commute accessibility analyzer to regional station hubs. Calculates travel times, routes, and overall score. | 交通通勤アクセシビリティ評価。主要ターミナル駅への所要時間、経路、利便性スコアを算出。',
    AnalyzeCommuteAccessibilityInput.shape,
    RO,
    (args) => withErrorHandling('analyze_commute_accessibility', String(args.prefecture ?? 'aichi'), async () => {
      const input = AnalyzeCommuteAccessibilityInput.parse(args);
      const result = await analyzeCommuteAccessibilityTool(input);
      return {
        content: [{ type: 'text' as const, text: result.markdownReport }],
        structuredContent: { ...result, attribution: ATTRIBUTION },
      };
    }),
  );

  server.tool(
    'forecast_land_price_trend',
    'Forecast land price trends using linear regression and moving average. Returns CAGR, confidence interval, investment signal (buy/hold/caution). 10 prefectures. | 地価トレンド予測。線形回帰・移動平均で将来地価を予測。CAGR・投資シグナルを返す。全10都道府県。',
    ForecastLandPriceTrendInput.shape,
    RO,
    (args) => withErrorHandling('forecast_land_price_trend', String(args.prefecture ?? 'aichi'), async () => {
      const input = ForecastLandPriceTrendInput.parse(args);
      const result = forecastLandPriceTrend(input);
      const fc = (result as unknown as { forecast?: { predicted?: number; changeRate?: number } }).forecast;
      const tldr = `${input.city} ${input.horizon}予測: ${fc?.predicted != null ? fc.predicted.toFixed(1) + '万円/㎡' : '—'} (${fc?.changeRate != null ? (fc.changeRate > 0 ? '+' : '') + fc.changeRate.toFixed(1) + '%' : '—'})`;
      return applyOutputMode(
        {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
          structuredContent: { ...result, attribution: ATTRIBUTION },
        },
        tldr,
        input.output_mode,
      );
    }),
  );

  server.tool(
    'scenario_what_if',
    'What-If scenario analysis: simulate impact of new stations, commercial facilities, population changes on land prices and investment scores. 10 prefectures. | シナリオWhat-If分析。新駅・大型商業施設・人口変動の地価影響を試算。全10都道府県。',
    ScenarioWhatIfInput.shape,
    RO,
    (args) => withErrorHandling('scenario_what_if', String(args.prefecture ?? 'aichi'), async () => {
      const input = ScenarioWhatIfInput.parse(args);
      const result = scenarioWhatIf(input);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        structuredContent: { ...result, attribution: ATTRIBUTION },
      };
    }),
  );

  server.tool(
    'portfolio_optimizer',
    'Optimize real estate investment portfolio across up to 5 areas. Returns expected return, risk score, Sharpe ratio. | 不動産投資ポートフォリオ最適化。最大5エリアのリターン・リスク・シャープレシオを算出。',
    PortfolioOptimizerInput.shape,
    RO,
    (args) => withErrorHandling('portfolio_optimizer', 'multi', async () => {
      const input = PortfolioOptimizerInput.parse(args);
      const result = portfolioOptimizer(input);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        structuredContent: { ...result, attribution: ATTRIBUTION },
      };
    }),
  );

  server.tool(
    'simulate_aichi_future',
    'Aichi future value simulator: Linear Chuo Shinkansen, Centrair 2nd runway, Toyota EV investment, Expo legacy impact on land prices. Markdown report. | 愛知県将来価値シミュレーター。リニア・セントレア・トヨタ・万博レガシーの地価影響をMarkdownレポートで出力。',
    AichiFutureInput.shape,
    RO,
    (args) => withErrorHandling('simulate_aichi_future', 'aichi', async () => {
      const input = AichiFutureInput.parse(args);
      const result = simulateAichiFuture(input);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        structuredContent: { ...result, attribution: result.attribution },
      };
    }),
  );

  registerAppTool(
    server,
    'discover_opportunities',
    {
      title: 'Opportunity Radar',
      description: 'Opportunity Radar: scan a prefecture for undervalued areas matching your goal (investment/store/family/office/development). Returns hypothesis cards with multi-source scoring. | Opportunity Radar。都道府県内を横断スキャンし、目的に応じた次に見るべきエリア仮説カードを返す。',
      inputSchema: DiscoverOpportunitiesInput.shape,
      outputSchema: DiscoverOpportunitiesOutput.shape,
      annotations: RO,
      _meta: {
        ui: { resourceUri: DASHBOARD_URI },
        'openai/outputTemplate': DASHBOARD_URI,
        'openai/toolInvocation/invoking': '投資機会をスキャン中…',
        'openai/toolInvocation/invoked': 'Opportunity Radarを表示できます。',
      },
    },
    (args) => withErrorHandling('discover_opportunities', String(args.prefecture ?? 'aichi'), async () => {
      const input = DiscoverOpportunitiesInput.parse(args);
      const result = await discoverOpportunitiesTool(input);
      const topCard = result.cards?.[0];
      const tldr = topCard
        ? `${input.prefecture} トップ候補: ${topCard.city} (スコア ${topCard.score}/100、${topCard.signalType})`
        : `${input.prefecture} 機会スキャン完了 (${result.cards?.length ?? 0}件)`;
      return applyOutputMode(
        {
          content: [{ type: 'text' as const, text: result.markdownReport ?? JSON.stringify(result, null, 2) }],
          structuredContent: result,
        },
        tldr,
        input.output_mode,
      );
    }),
  );

  // ── v6.8.0 Nagoya renovation tools ──────────────────────────────────────

  server.tool(
    'analyze_renovation_yield',
    'Renovation yield analysis: calculate acquisition cost, renovation cost, expected rent, gross/net yield for Nagoya neighborhoods. Includes future plan upside. | リノベ利回り分析。名古屋市の町丁目×物件条件から取得価格・リノベ費用・利回りを算出。',
    RenovationYieldInput.shape,
    RO,
    (args, extra) => withErrorHandling('analyze_renovation_yield', 'aichi', async () => {
      const pt = extra?._meta?.progressToken;
      const notify = pt
        ? (p: number, t: number, m?: string) => { extra.sendNotification({ method: 'notifications/progress' as const, params: { progressToken: pt, progress: p, total: t, message: m } } as never).catch(() => {}); }
        : undefined;
      notify?.(1, 3, '地価・物件データ取得中…');
      const r = analyzeRenovationYieldTool(args as Record<string, unknown>);
      notify?.(2, 3, '利回り計算中…');
      notify?.(3, 3, '完了');
      return { content: r.content, structuredContent: { ...r.structuredContent } as Record<string, unknown> };
    }),
  );

  server.tool(
    'get_future_timeline',
    'Future timeline: upcoming redevelopment, infrastructure, and population projections for Nagoya wards/neighborhoods (2025-2050). | 未来タイムライン。名古屋市の区・町丁目に影響する将来計画を年次タイムラインで返す。',
    FutureTimelineInput.shape,
    RO,
    (args) => withErrorHandling('get_future_timeline', 'aichi', async () => {
      const r = getFutureTimelineTool(args as Record<string, unknown>);
      return { content: r.content, structuredContent: { ...r.structuredContent } as Record<string, unknown> };
    }),
  );

  server.tool(
    'get_chochou_profile',
    'Neighborhood profile: current metrics (land price, population, households, ongoing plans) for Nagoya wards/neighborhoods. | 町丁目プロファイル。名古屋市の区・町丁目単位の現状指標を返す。',
    ChochouProfileInput.shape,
    RO,
    (args) => withErrorHandling('get_chochou_profile', 'aichi', async () => {
      const typedArgs = args as Record<string, unknown>;
      const r = getChochouProfileTool(typedArgs);
      const sc = r.structuredContent as { ward?: string; chochou?: string; populationTotal?: number } | undefined;
      const tldr = sc?.ward
        ? `${sc.ward}${sc.chochou ? ' ' + sc.chochou : ''} プロファイル取得完了${sc.populationTotal != null ? ` (人口 ${sc.populationTotal.toLocaleString()}人)` : ''}`
        : '町丁目プロファイル取得完了';
      return applyOutputMode(
        { content: r.content, structuredContent: { ...r.structuredContent } as Record<string, unknown> },
        tldr,
        (typedArgs.output_mode as 'compact' | 'detailed') ?? 'compact',
      );
    }),
  );

  server.tool(
    'recommend_renovation_targets',
    'Renovation yield ranking: scan all 16 Nagoya wards to rank neighborhoods by yield. | リノベ利回りランキング。名古屋市全16区の主要町丁目を横断スキャンし利回り上位をランキング。',
    RecommendRenovationTargetsInput.shape,
    RO,
    (args) => withErrorHandling('recommend_renovation_targets', 'aichi', async () => {
      const r = recommendRenovationTargetsTool(args as Record<string, unknown>);
      return { content: r.content, structuredContent: { ...r.structuredContent } as Record<string, unknown> };
    }),
  );

  // ── v6.9.0 Contract Intelligence tools ──────────────────────────────────

  server.tool(
    'generate_contract_support_package',
    'Contract support package: generate risk matrix, price negotiation anchors, recommended clauses from neighborhood/property data. Markdown + branded PDF. | 売買契約支援パッケージ。リスクマトリックス・価格交渉アンカー・推奨特約を生成。',
    ContractSupportInput.shape,
    RO,
    (args, extra) => withErrorHandling('generate_contract_support_package', 'aichi', async () => {
      const pt = extra?._meta?.progressToken;
      const notify = pt
        ? (p: number, t: number, m?: string) => { extra.sendNotification({ method: 'notifications/progress' as const, params: { progressToken: pt, progress: p, total: t, message: m } } as never).catch(() => {}); }
        : undefined;
      notify?.(1, 3, 'リスク分析中…');
      const r = generateContractSupportPackageTool(args as Record<string, unknown>);
      notify?.(2, 3, '特約生成中…');
      notify?.(3, 3, '完了');
      return { content: r.content, structuredContent: { ...r.structuredContent } as Record<string, unknown> };
    }),
  );

  server.tool(
    'assess_contract_risk',
    'Contract risk assessment: analyze proposed clauses (financing contingency, inspection, future value terms) and return risk score with deal-breakers. | 契約リスク評価。提案中の契約条項を分析しリスクスコアとディールブレーカーを返す。',
    AssessContractRiskInput.shape,
    RO,
    (args) => withErrorHandling('assess_contract_risk', 'aichi', async () => {
      const r = assessContractRiskTool(args as Record<string, unknown>);
      return { content: r.content, structuredContent: { ...r.structuredContent } as Record<string, unknown> };
    }),
  );

  registerAppTool(
    server,
    'composite_value_score',
    {
      title: '総合価値スコア',
      description: 'Composite value score: fuse 5 axes (land price, education, transport, future plans, risk) into a single 0-100 score with radar, tier, peer comparison, and AI narrative. | 総合価値スコア。地価・教育・交通・将来計画・リスクを 1 つの 0-100 スコアに融合。レーダー・Tier・ピア比較・AIナラティブ付き。',
      inputSchema: CompositeValueScoreInput.shape,
      outputSchema: CompositeValueScoreOutput.shape,
      annotations: RO,
      _meta: {
        ui: { resourceUri: DASHBOARD_URI },
        'openai/outputTemplate': DASHBOARD_URI,
        'openai/toolInvocation/invoking': '総合価値スコアを算出中…',
        'openai/toolInvocation/invoked': 'スコア算出が完了しました。',
      },
    },
    (args) => withErrorHandling('composite_value_score', String((args as unknown as Record<string, string>).prefecture ?? '愛知県'), async () => {
      const typedArgs = args as unknown as Record<string, unknown>;
      const toolResult = await compositeValueScoreTool(typedArgs);
      const sc = toolResult.structuredContent as { score?: number; area?: string } | undefined;
      const tldr = sc?.score != null
        ? `${sc.area ?? String(typedArgs.area ?? '')} 総合スコア ${sc.score}/100`
        : '総合スコア算出完了';
      return applyOutputMode(toolResult, tldr, (typedArgs.output_mode as 'compact' | 'detailed') ?? 'compact');
    }),
  );

  // ── v6.13.0 Data Enrichment tools ─────────────────────────────────────────

  registerAppTool(
    server,
    'get_zoning_info',
    {
      title: '用途地域情報',
      description: 'Look up zoning (用途地域) for an area: zone type, coverage ratio (建蔽率), floor area ratio (容積率), and height limits. | 用途地域・建蔽率・容積率・高さ制限を返す。',
      inputSchema: ZoningInfoInput.shape,
      annotations: RO,
      _meta: {
        ui: { resourceUri: DASHBOARD_URI },
        'openai/toolInvocation/invoking': '用途地域情報を取得中…',
        'openai/toolInvocation/invoked': '用途地域情報の取得が完了しました。',
      },
    },
    (args) => withErrorHandling('get_zoning_info', String((args as unknown as Record<string, string>).prefecture ?? '愛知県'), async () => {
      return getZoningInfoTool(args as unknown as Record<string, unknown>);
    }),
  );

  registerAppTool(
    server,
    'get_vacancy_stats',
    {
      title: '空き家率統計',
      description: 'Vacancy rate statistics (空き家率) by municipality: total vacant, for-rent, for-sale, other — compared to national average. | 市区町村別の空き家率・種類別内訳を全国平均と比較して返す。',
      inputSchema: VacancyStatsInput.shape,
      annotations: RO,
      _meta: {
        ui: { resourceUri: DASHBOARD_URI },
        'openai/toolInvocation/invoking': '空き家率データを取得中…',
        'openai/toolInvocation/invoked': '空き家率データの取得が完了しました。',
      },
    },
    (args) => withErrorHandling('get_vacancy_stats', String((args as unknown as Record<string, string>).prefecture ?? '愛知県'), async () => {
      return getVacancyStatsTool(args as unknown as Record<string, unknown>);
    }),
  );

  registerAppTool(
    server,
    'get_population_outlook',
    {
      title: '将来人口推計',
      description: 'Population outlook to 2050 (将来人口推計): projected population at 2030/2040/2050 with decline rate, based on NIPSSR data. | 2030/2040/2050年の人口推計と減少率を返す。',
      inputSchema: PopulationOutlookInput.shape,
      annotations: RO,
      _meta: {
        ui: { resourceUri: DASHBOARD_URI },
        'openai/toolInvocation/invoking': '将来人口推計を算出中…',
        'openai/toolInvocation/invoked': '人口推計の算出が完了しました。',
      },
    },
    (args) => withErrorHandling('get_population_outlook', String((args as unknown as Record<string, string>).prefecture ?? '愛知県'), async () => {
      return getPopulationOutlookTool(args as unknown as Record<string, unknown>);
    }),
  );

  registerAppTool(
    server,
    'get_real_estate_macro_snapshot',
    {
      title: '不動産マクロスナップショット',
      description:
        'One-screen macro view: land price YoY (median ㎡/year), transaction counts (last 3y), population decline to 2050; optional e-Stat building construction starts by prefecture (needs ESTAT_APP_ID) and FRED policy-rate proxy CSV. | 地価中央値YoY・取引件数・2050人口減、e-Stat建築着工・FRED短期金利プロキシを一枚に。',
      inputSchema: MacroSnapshotInput.shape,
      annotations: RO,
      _meta: {
        ui: { resourceUri: DASHBOARD_URI },
        'openai/toolInvocation/invoking': 'マクロ指標を集計中…',
        'openai/toolInvocation/invoked': 'マクロスナップショットの取得が完了しました。',
      },
    },
    (args) =>
      withErrorHandling(
        'get_real_estate_macro_snapshot',
        String((args as unknown as Record<string, string>).prefecture ?? '愛知県'),
        async () => getRealEstateMacroSnapshotTool(args as unknown as Record<string, unknown>),
      ),
  );

  registerAppTool(
    server,
    'detect_arbitrage_signals',
    {
      title: '価格トライアングル・アービトラージスキャン',
      description: 'Price triangulation arbitrage scanner: cross-checks 路線価(rosenka) × 公示地価(koji) × 取引価格(tx) to detect discount buys, inheritance-tax edges, and overheated markets. | 路線価・公示地価・取引価格の三角測量でディスカウント物件・相続有利エリア・市場過熱を検出する。',
      inputSchema: ArbitrageScanInput.shape,
      outputSchema: ArbitrageScanOutput.shape,
      annotations: RO,
      _meta: {
        ui: { resourceUri: DASHBOARD_URI },
        'openai/outputTemplate': DASHBOARD_URI,
        'openai/toolInvocation/invoking': '価格トライアングルをスキャン中…',
        'openai/toolInvocation/invoked': 'アービトラージスキャンが完了しました。',
      },
    },
    (args) => withErrorHandling('detect_arbitrage_signals', String((args as unknown as Record<string, string>).prefecture ?? '愛知県'), async () => {
      const input = ArbitrageScanInput.parse(args);
      const output = await detectArbitrageSignals(input);
      const discountCount = output.items.filter(i => i.signal === 'discount').length;
      const overheatCount = output.items.filter(i => i.signal === 'overheated').length;
      const tldr = `${output.prefecture}: ${output.scannedCities}市区町村をスキャン — 割安 ${discountCount}件・過熱 ${overheatCount}件検出`;
      return applyOutputMode(
        { content: [{ type: 'text' as const, text: output.markdownReport }], structuredContent: output as unknown as Record<string, unknown> },
        tldr,
        input.output_mode,
      );
    }),
  );

  registerAppTool(
    server,
    'review_purchase_recommendation',
    {
      title: '購入候補物件レビュー',
      description: 'Real estate purchase review for executives: evaluates asking price vs 公示地価/路線価/取引相場, yield (gross/net), risk (vacancy/aging/disaster), future potential, and contract terms. Returns 5-axis scores, decision (buy/negotiate/hold/reject), red flags, negotiation points, and recommended clauses. | 不動産屋経営者向け購入審査：販売価格 vs 公示地価・路線価・取引相場、利回り、リスク、将来性、契約条件を5軸評価。判断（購入/交渉/保留/非推奨）、レッドフラグ、交渉ポイント、推奨特約条項を返却。',
      inputSchema: PurchaseReviewInput.shape,
      outputSchema: PurchaseReviewOutput.shape,
      annotations: RO,
      _meta: {
        ui: { resourceUri: DASHBOARD_URI },
        'openai/outputTemplate': DASHBOARD_URI,
        'openai/toolInvocation/invoking': '購入候補物件を審査中…',
        'openai/toolInvocation/invoked': '購入審査が完了しました。',
      },
    },
    (args) => withErrorHandling('review_purchase_recommendation', String((args as unknown as Record<string, string>).city ?? '不明'), async () => {
      const input = PurchaseReviewInput.parse(args);
      const output = await reviewPurchaseRecommendation(input);
      const tldr = `${input.city}: 総合スコア${output.overallScore}点（${output.decisionLabel}）`;
      return applyOutputMode(
        { content: [{ type: 'text' as const, text: output.markdownReport }], structuredContent: output as unknown as Record<string, unknown> },
        tldr,
        input.output_mode,
      );
    }),
  );

  registerAppTool(
    server,
    'simulate_leveraged_cashflow',
    {
      title: 'レバレッジ10年キャッシュフロー試算',
      description: 'Leveraged 10-year real estate pro-forma: accepts loan interest rate, LTV/loan amount, rent, vacancy, operating costs, property tax, depreciation and exit assumptions, then returns annual NOI, debt service, after-tax cash flow, DSCR, IRR, equity multiple and sensitivity. | 銀行借入の利率・LTV・賃料・空室率・経費・固定資産税・減価償却・出口条件から10年の年次収支、税引後CF、DSCR、IRR、感応度を試算する。',
      inputSchema: LeveragedCashflowInput.shape,
      outputSchema: LeveragedCashflowOutput.shape,
      annotations: RO,
      _meta: {
        ui: { resourceUri: DASHBOARD_URI },
        'openai/outputTemplate': DASHBOARD_URI,
      'openai/toolInvocation/invoking': 'レバレッジCFを試算中…',
      'openai/toolInvocation/invoked': 'レバレッジキャッシュフロー試算が完了しました。',
      },
    },
    (args) => withErrorHandling('simulate_leveraged_cashflow', String((args as unknown as Record<string, string>).city ?? '不明'), async () => {
      const input = LeveragedCashflowInput.parse(args);
      const output = await simulateLeveragedCashflow(input);
      const tldr = `${input.city}: ${output.summary}`;
      return applyOutputMode(
        { content: [{ type: 'text' as const, text: output.markdownReport }], structuredContent: output as unknown as Record<string, unknown> },
        tldr,
        input.output_mode,
      );
    }),
  );

  registerAppTool(
    server,
    'optimize_portfolio_allocation',
    {
      title: 'ポートフォリオ統合リスク・リターン最適化',
      description: 'Optimize real estate portfolio risk & return: aggregates hazards, land price trends, and generates allocation strategies. | 複数物件のポートフォリオ災害リスク・地価動向を横断分析し、最適配分をシミュレートする。',
      inputSchema: OptimizePortfolioInput.shape,
      outputSchema: OptimizePortfolioOutput.shape,
      annotations: RO,
      _meta: {
        ui: { resourceUri: DASHBOARD_URI },
        'openai/outputTemplate': DASHBOARD_URI,
        'openai/toolInvocation/invoking': 'ポートフォリオ最適化を実行中…',
        'openai/toolInvocation/invoked': 'ポートフォリオ最適化が完了しました。',
      },
    },
    (args) => withErrorHandling('optimize_portfolio_allocation', 'multi', async () => {
      const input = OptimizePortfolioInput.parse(args);
      const output = await optimizePortfolioTool(input);
      return {
        content: [{ type: 'text' as const, text: output.markdownReport }],
        structuredContent: output as unknown as Record<string, unknown>,
      };
    }),
  );

  registerAppTool(
    server,
    'audit_zoning_compliance',
    {
      title: '3D用途地域・法的斜線制限自動監査',
      description: 'Audit proposed building metrics (FAR, coverage, slant line, height limit) against local zoning rules. | 敷地での計画建物スペック（建蔽率・容積率・斜線制限など）の適合性を自動監査する。',
      inputSchema: AuditZoningComplianceInput.shape,
      outputSchema: AuditZoningComplianceOutput.shape,
      annotations: RO,
      _meta: {
        ui: { resourceUri: DASHBOARD_3D_URI },
        'openai/outputTemplate': DASHBOARD_3D_URI,
        'openai/toolInvocation/invoking': '用途制限・斜線制限を監査中…',
        'openai/toolInvocation/invoked': '法的監査が完了しました。',
      },
    },
    (args) => withErrorHandling('audit_zoning_compliance', String((args as unknown as Record<string, string>).prefecture ?? 'aichi'), async () => {
      const input = AuditZoningComplianceInput.parse(args);
      const output = await auditZoningComplianceTool(input);
      return {
        content: [{ type: 'text' as const, text: output.markdownReport }],
        structuredContent: output as unknown as Record<string, unknown>,
      };
    }),
  );

  registerAppTool(
    server,
    'forecast_demographic_shift',
    {
      title: '町丁目レベル10年後人流・人口動態予測',
      description: 'Predict demographic, aging and human flow trends for a specific neighborhood or city. | 国勢調査・人流統計から、指定エリア（町丁目単位）の10年後の人口・世帯・高齢化率を予測する。',
      inputSchema: ForecastDemographicShiftInput.shape,
      outputSchema: ForecastDemographicShiftOutput.shape,
      annotations: RO,
      _meta: {
        ui: { resourceUri: DASHBOARD_URI },
        'openai/outputTemplate': DASHBOARD_URI,
        'openai/toolInvocation/invoking': '人流・人口予測を実行中…',
        'openai/toolInvocation/invoked': '人流・人口動態予測が完了しました。',
      },
    },
    (args) => withErrorHandling('forecast_demographic_shift', String((args as unknown as Record<string, string>).prefecture ?? 'aichi'), async () => {
      const input = ForecastDemographicShiftInput.parse(args);
      const output = await forecastDemographicShiftTool(input);
      return {
        content: [{ type: 'text' as const, text: output.markdownReport }],
        structuredContent: output as unknown as Record<string, unknown>,
      };
    }),
  );

  // ── Resources (prefecture/{area} pattern) ────────────────────────────────

  function safeResource(name: string, fn: () => string, uri: URL): { contents: { uri: string; mimeType: 'application/json'; text: string }[] } {
    try {
      return { contents: [{ uri: uri.href, mimeType: 'application/json' as const, text: fn() }] };
    } catch (err: unknown) {
      const message = formatErrorMessage(err);
      server.sendLoggingMessage({ level: 'warning', data: { resource: name, error: message, event: 'resource_error' } }).catch(() => {});
      return { contents: [{ uri: uri.href, mimeType: 'application/json' as const, text: JSON.stringify({ error: message }) }] };
    }
  }

  server.resource(
    'land-price',
    'realestate://land-price/{prefecture}/{area}',
    { description: '地価公示データ（prefecture=都道府県キー、area=市区町村名）', mimeType: 'application/json' },
    async (uri) => {
      if (!isResourceAllowed(defaultTier, uri.href)) {
        return { contents: [{ uri: uri.href, mimeType: 'application/json' as const, text: JSON.stringify({ error: `リソース "${uri.href}" は現在のプラン (${defaultTier}) では利用できません。` }) }] };
      }
      const parts = uri.pathname.split('/').filter(Boolean);
      const prefecture = decodeURIComponent(parts[0] ?? 'aichi');
      const area = decodeURIComponent(parts[1] ?? '名古屋市');
      return safeResource('land-price', () => getLandPriceResource(prefecture, area), uri);
    },
  );

  server.resource(
    'flood',
    'hazard://flood/{prefecture}/{area}',
    { description: '浸水リスクGeoJSONデータ（prefecture=都道府県キー、area=市区町村名）', mimeType: 'application/json' },
    async (uri) => {
      if (!isResourceAllowed(defaultTier, uri.href)) {
        return { contents: [{ uri: uri.href, mimeType: 'application/json' as const, text: JSON.stringify({ error: `リソース "${uri.href}" は現在のプラン (${defaultTier}) では利用できません。` }) }] };
      }
      const parts = uri.pathname.split('/').filter(Boolean);
      const prefecture = decodeURIComponent(parts[0] ?? 'aichi');
      const area = decodeURIComponent(parts[1] ?? '名古屋市');
      return safeResource('flood', () => getFloodResource(prefecture, area), uri);
    },
  );

  server.resource(
    'population',
    'stats://population-trend/{prefecture}/{area}',
    { description: '人口推移データ（prefecture=都道府県キー、area=市区町村名）', mimeType: 'application/json' },
    async (uri) => {
      if (!isResourceAllowed(defaultTier, uri.href)) {
        return { contents: [{ uri: uri.href, mimeType: 'application/json' as const, text: JSON.stringify({ error: `リソース "${uri.href}" は現在のプラン (${defaultTier}) では利用できません。` }) }] };
      }
      const parts = uri.pathname.split('/').filter(Boolean);
      const prefecture = decodeURIComponent(parts[0] ?? 'aichi');
      const area = decodeURIComponent(parts[1] ?? '名古屋市');
      return safeResource('population', () => getPopulationResource(prefecture, area), uri);
    },
  );

  registerAppResource(
    server,
    '不動産ダッシュボード 2D',
    DASHBOARD_URI,
    {
      description: 'Real estate intelligence dashboard (2D map, charts, tables). Interactive MCP App. | 不動産インテリジェンスダッシュボード（2Dマップ・チャート・テーブル付き）。MCP App対応。',
      _meta: {
        ui: {
          csp: DASHBOARD_CSP,
          domain: WIDGET_DOMAIN,
        },
      },
    },
    async () => {
      if (!isResourceAllowed(defaultTier, DASHBOARD_URI)) {
        return { contents: [{ uri: DASHBOARD_URI, mimeType: RESOURCE_MIME_TYPE, text: `<html><body><h1>プラン制限</h1><p>現在のプラン (${defaultTier}) ではダッシュボードを利用できません。アップグレードをご検討ください。</p></body></html>` }] };
      }
      return {
        contents: [{
          uri: DASHBOARD_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: getDashboardHtml(),
          _meta: { ui: { csp: DASHBOARD_CSP } },
        }],
      };
    },
  );

  registerAppResource(
    server,
    '不動産ダッシュボード 3D',
    DASHBOARD_3D_URI,
    {
      description: 'PLATEAU 3D building view dashboard (Three.js). Interactive MCP App. | PLATEAU 3D建物ビューダッシュボード（Three.js）。MCP App対応。',
      _meta: {
        ui: {
          csp: DASHBOARD_3D_CSP,
          domain: WIDGET_DOMAIN,
        },
      },
    },
    async () => {
      if (!isResourceAllowed(defaultTier, DASHBOARD_3D_URI)) {
        return { contents: [{ uri: DASHBOARD_3D_URI, mimeType: RESOURCE_MIME_TYPE, text: `<html><body><h1>プラン制限</h1><p>現在のプラン (${defaultTier}) では3Dダッシュボードを利用できません。アップグレードをご検討ください。</p></body></html>` }] };
      }
      return {
        contents: [{
          uri: DASHBOARD_3D_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: getDashboard3dHtml(),
          _meta: { ui: { csp: DASHBOARD_3D_CSP } },
        }],
      };
    },
  );

  // ── Prompts ──────────────────────────────────────────────────────────────

  server.prompt(
    'investment_report',
    '投資判断レポートテンプレート',
    {
      prefecture: completable(z.string().optional().describe('都道府県'), completePrefecture),
      area: completable(z.string().optional().describe('市区町村'), completeArea),
      property_type: z.string().optional().describe('用途（residential/commercial/office/logistics/mixed）'),
    },
    withPromptTierCheck('investment_report', (args) => ({
      messages: [{
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `投資判断レポートを作成してください。\n\n都道府県: ${args.prefecture ?? '愛知県'}\nエリア: ${args.area ?? '名古屋市中区'}\n用途: ${args.property_type ?? 'mixed'}\n\n手順:\n1. cross_analyze_real_estate_market で市場を総合分析\n2. assess_property_risk でリスク評価\n3. generate_area_report でレポート生成（format: "markdown"）\n4. 結果を統合して投資判断を提示`,
        },
      }],
    })),
  );

  server.prompt(
    'store_location_evaluation',
    '店舗出店適地評価テンプレート',
    {
      prefecture: completable(z.string().optional().describe('都道府県'), completePrefecture),
      area: completable(z.string().optional().describe('市区町村'), completeArea),
      store_type: z.string().optional().describe('店舗種別（convenience/restaurant/cafe/pharmacy/gym/beauty/supermarket/specialty）'),
    },
    withPromptTierCheck('store_location_evaluation', (args) => ({
      messages: [{
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `店舗出店適地を評価してください。\n\n都道府県: ${args.prefecture ?? '愛知県'}\nエリア: ${args.area ?? '名古屋市中区'}\n店舗種別: ${args.store_type ?? 'restaurant'}\n\n手順:\n1. evaluate_store_location で適地スコア算出\n2. drill_down_local_analysis で周辺の詳細分析\n3. 競合・人流を考慮した総合判断\n4. 推奨アクションを提示`,
        },
      }],
    })),
  );

  server.prompt(
    'prefecture_comparison',
    '都道府県横断比較テンプレート',
    {
      prefectures: completable(z.string().optional().describe('比較対象（カンマ区切り、最大5）'), completePrefecture),
      metrics: z.string().optional().describe('比較指標（land_price,population,risk）'),
    },
    withPromptTierCheck('prefecture_comparison', (args) => ({
      messages: [{
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `都道府県横断比較を行ってください。\n\n対象: ${args.prefectures ?? '愛知県,東京都,大阪府'}\n指標: ${args.metrics ?? 'land_price,population,risk'}\n\n手順:\n1. compare_prefectures で一括比較\n2. 各指標のランキングを分析\n3. 投資先として有望な県を推奨\n4. リスクと機会を整理`,
        },
      }],
    })),
  );

  server.prompt(
    'land_price_forecast_report',
    '地価トレンド予測レポートテンプレート',
    {
      prefecture: completable(z.string().optional().describe('対象都道府県（省略時は愛知県）'), completePrefecture),
      city: completable(z.string().optional().describe('市区町村'), completeArea),
      horizon: z.string().optional().describe('予測期間（1y/3y/5y）'),
    },
    withPromptTierCheck('land_price_forecast_report', ({ prefecture, city, horizon }) => ({
      messages: [{
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: [
            `地価トレンド予測レポートを生成してください。`,
            `都道府県: ${prefecture ?? '愛知県'}`,
            `市区町村: ${city ?? '名古屋市中区'}`,
            `予測期間: ${horizon ?? '3y'}`,
            ``,
            `forecast_land_price_trend ツールでCAGR・トレンド方向・将来予測・投資シグナルを含むMarkdownレポートを出力。`,
          ].join('\n'),
        },
      }],
    })),
  );

  server.prompt(
    'scenario_what_if_analysis',
    'What-If シナリオ分析テンプレート',
    {
      prefecture: completable(z.string().optional().describe('対象都道府県'), completePrefecture),
      city: completable(z.string().optional().describe('市区町村'), completeArea),
      scenario: z.string().optional().describe('シナリオ種別'),
      scale: z.string().optional().describe('規模（small/medium/large）'),
    },
    withPromptTierCheck('scenario_what_if_analysis', ({ prefecture, city, scenario, scale }) => ({
      messages: [{
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: [
            `以下の条件でWhat-Ifシナリオ分析を行ってください。`,
            `都道府県: ${prefecture ?? '愛知県'}`,
            `市区町村: ${city ?? '名古屋市中区'}`,
            `シナリオ: ${scenario ?? 'new_commercial_facility'}`,
            `規模: ${scale ?? 'medium'}`,
            ``,
            `scenario_what_if ツールでベースラインvsシナリオ後の地価・投資スコア・リスク影響を比較しMarkdownで出力。`,
          ].join('\n'),
        },
      }],
    })),
  );

  server.prompt(
    'portfolio_optimization',
    'ポートフォリオ最適化テンプレート',
    {
      prefectures: completable(z.string().optional().describe('対象都道府県（例: 東京都,大阪府,埼玉県）'), completePrefecture),
      budget_man_yen: z.string().optional().describe('各エリアの予算（万円、カンマ区切り）'),
      risk_tolerance: z.string().optional().describe('リスク許容度 low/medium/high'),
    },
    withPromptTierCheck('portfolio_optimization', ({ prefectures, budget_man_yen, risk_tolerance }) => ({
      messages: [{
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: [
            `ポートフォリオ最適化レポートを作成してください。`,
            `対象都道府県: ${prefectures ?? '東京都,大阪府,埼玉県'}`,
            `予算(万円): ${budget_man_yen ?? '10000,5000,5000'}`,
            `リスク許容度: ${risk_tolerance ?? 'medium'}`,
            ``,
            `portfolio_optimizer ツールで各エリアのリターン・リスク・推奨配分を算出しMarkdownレポートを生成。`,
          ].join('\n'),
        },
      }],
    })),
  );

  server.prompt(
    'quick_start_examples',
    '初回ユーザー向けクイックスタートガイド。6つの具体的な使用例をコール例付きでMarkdown返却する',
    {
      goal: z.string().optional().describe('investment=投資家向け、store=店舗出店向け、all=全部（デフォルト）'),
    },
    ({ goal: _goal }) => ({
      messages: [{
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: [
            '## Japan Real Estate Intel MCP -- Quick Start',
            '',
            '以下の例をそのままチャットに貼り付けて実行できます。',
            '',
            '---',
            '',
            '### 1. 地価トレンド予測（投資判断）',
            '```',
            'forecast_land_price_trend({ "prefecture": "東京都", "city": "新宿区", "horizon": "5y" })',
            '```',
            '> **用途**: 5年後の地価予測・CAGR・投資シグナル(buy/hold/caution)を取得。',
            '',
            '---',
            '',
            '### 2. 企業立地需要分析',
            '```',
            'predict_corporate_demand({ "prefecture": "愛知県", "city": "名古屋市中区", "industryType": "manufacturing" })',
            '```',
            '> **用途**: 製造業・オフィス・小売の需要スコア。法人調査に有効。',
            '',
            '---',
            '',
            '### 3. ファミリー向け適性評価',
            '```',
            'assess_family_friendly_score({ "prefecture": "神奈川県", "city": "横浜市西区" })',
            '```',
            '> **用途**: 教育・安全・医療の3軸で住宅適地を総合評価。',
            '',
            '---',
            '',
            '### 4. ポートフォリオ最適化',
            '```',
            'portfolio_optimizer({',
            '  "targets": [',
            '    { "prefecture": "東京都", "city": "新宿区", "propertyType": "office", "budgetManYen": 10000 },',
            '    { "prefecture": "大阪府", "city": "大阪市北区", "propertyType": "commercial", "budgetManYen": 6000 },',
            '    { "prefecture": "埼玉県", "city": "さいたま市大宮区", "propertyType": "residential", "budgetManYen": 4000 }',
            '  ],',
            '  "riskTolerance": "medium", "investmentHorizon": "5y", "optimizeFor": "risk_adjusted"',
            '})',
            '```',
            '> **用途**: 3エリアの展開比率・シャープレシオ・推奨配分をMarkdownレポートで出力。',
            '',
            '---',
            '',
            '### 5. What-If シナリオ分析',
            '```',
            'scenario_what_if({ "prefecture": "大阪府", "city": "大阪市中央区", "scenario": "new_station", "scale": "large" })',
            '```',
            '> **用途**: 新駅設置・大型商業施設の地価・投資スコアへの影響を試算。',
            '',
            '---',
            '',
            '### 6. 店舗出店適地評価',
            '```',
            'evaluate_store_location({ "city": "福岡市博多区", "storeType": "cafe", "targetCustomer": "office_worker" })',
            '```',
            '> **用途**: 人流・交通・競合店分布を考慮した出店適地スコアを算出。',
            '',
            '---',
            '',
            '### 7. Opportunity Radar（次に見るべきエリア発見）',
            '```',
            'discover_opportunities({ "prefecture": "愛知県", "goal": "investment", "horizon": "3y", "limit": 5 })',
            '```',
            '> **用途**: 地価・人口・人流・教育・法人・交通・リスクを横断スキャンし、投資/出店/居住/オフィス/開発に適したエリア仮説カードを返す。',
            '',
            '---',
            '',
            '> **ヒント**: cross_analyze_real_estate_market で地価・人流・教育・企業・家族スコアを一括分析できます。',
          ].join('\n'),
        },
      }],
    }),
  );

  server.prompt(
    'opportunity_radar',
    'Opportunity Radar — 次に見るべきエリアを発見する。都道府県・目的・期間を指定して仮説カードを取得',
    {
      prefecture: completable(z.string().optional().describe('都道府県'), completePrefecture),
      goal: z.enum(['investment', 'store', 'family', 'office', 'development']).default('investment').describe('探索目的'),
      horizon: z.enum(['1y', '3y', '5y']).default('3y').describe('投資期間'),
    },
    withPromptTierCheck('opportunity_radar', (args) => ({
      messages: [{
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: [
            'Opportunity Radarを実行してください。',
            `discover_opportunities(${JSON.stringify({ prefecture: args.prefecture ?? '愛知県', goal: args.goal, horizon: args.horizon, limit: 5, includeMarkdown: true })})`,
            '',
            '結果のカードごとに、推奨ツールを使って深掘り分析を行い、総合的な判断材料をまとめてください。',
          ].join('\n'),
        },
      }],
    })),
  );

  server.prompt(
    'aichi_future_value',
    'Aichi future value estimation — simulate land price trends with Linear Chuo Shinkansen impact. | 愛知県の将来価値試算 — リニア中央新幹線の影響を含む地価シミュレーション',
    {
      city: completable(z.string().describe('市区町村名'), (value) => completeArea(value, { arguments: { prefecture: '愛知県' } })),
      horizon: z.enum(['3y', '5y', '10y']).default('10y').describe('試算期間'),
    },
    withPromptTierCheck('aichi_future_value', (args) => ({
      messages: [{
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: [
            '愛知県将来価値シミュレーターを実行してください。',
            JSON.stringify({ city: args.city, horizon: args.horizon, scenarios: ['all'], includeMarkdown: true }),
          ].join('\n'),
        },
      }],
    })),
  );

  server.prompt(
    'composite_value_report',
    'Composite Value Report — 5-axis fused score for any area. | 総合価値レポート — 5 軸融合スコアであらゆるエリアを評価',
    {
      prefecture: completable(z.string().optional().describe('都道府県'), completePrefecture),
      area: completable(z.string().optional().describe('市区町村'), completeArea),
      horizon: z.enum(['1y', '3y', '5y']).default('3y').describe('分析期間'),
    },
    withPromptTierCheck('composite_value_report', (args) => ({
      messages: [{
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: [
            '総合価値スコアレポートを生成してください。',
            `composite_value_score(${JSON.stringify({ prefecture: args.prefecture ?? '愛知県', area: args.area ?? '名古屋市中区', horizon: args.horizon, includeNarrative: true, includeMarkdown: true })})`,
            '',
            '結果の5軸レーダーとTier評価に基づき、投資判断に役立つ総合分析をまとめてください。',
          ].join('\n'),
        },
      }],
    })),
  );

  server.prompt(
    'zoning_check',
    'Zoning lookup — check what can be built in an area. | 用途地域チェック — エリアで何が建てられるか確認',
    {
      prefecture: completable(z.string().optional().describe('都道府県'), completePrefecture),
      area: completable(z.string().optional().describe('市区町村'), completeArea),
    },
    withPromptTierCheck('zoning_check', (args) => ({
      messages: [{
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `用途地域を確認してください。\nget_zoning_info(${JSON.stringify({ prefecture: args.prefecture ?? '愛知県', area: args.area ?? '名古屋市中区' })})\n\n建蔽率・容積率から何が建てられるか分かりやすくまとめてください。`,
        },
      }],
    })),
  );

  server.prompt(
    'vacancy_analysis',
    'Vacancy rate analysis — check empty housing risk. | 空き家率分析 — 空き家リスクを確認',
    {
      prefecture: completable(z.string().optional().describe('都道府県'), completePrefecture),
      area: completable(z.string().optional().describe('市区町村'), completeArea),
    },
    withPromptTierCheck('vacancy_analysis', (args) => ({
      messages: [{
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `空き家率を分析してください。\nget_vacancy_stats(${JSON.stringify({ prefecture: args.prefecture ?? '愛知県', area: args.area })})\n\n全国平均との比較と投資への影響を分かりやすくまとめてください。`,
        },
      }],
    })),
  );

  server.prompt(
    'population_outlook_report',
    'Population outlook to 2050 — long-term demand analysis. | 将来人口推計レポート — 長期需要分析',
    {
      prefecture: completable(z.string().optional().describe('都道府県'), completePrefecture),
      area: completable(z.string().optional().describe('市区町村'), completeArea),
    },
    withPromptTierCheck('population_outlook_report', (args) => ({
      messages: [{
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `将来人口推計を分析してください。\nget_population_outlook(${JSON.stringify({ prefecture: args.prefecture ?? '愛知県', area: args.area })})\n\n2050年までの人口変動が不動産市場に与える影響を分かりやすくまとめてください。`,
        },
      }],
    })),
  );

  server.prompt(
    'arbitrage_scan',
    '価格トライアングル・アービトラージスキャン — 路線価×公示×取引の乖離から割安・相続有利・過熱エリアを検出',
    {
      prefecture: completable(z.string().optional().describe('都道府県'), completePrefecture),
      signal_type: z.string().optional().describe('シグナル種別（discount/inheritance_edge/overheated/fair/未指定=全件）'),
    },
    withPromptTierCheck('arbitrage_scan', (args) => ({
      messages: [{
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: [
            `価格トライアングル分析を実行してください。`,
            `都道府県: ${args.prefecture ?? '愛知県'}`,
            args.signal_type ? `シグナル絞り込み: ${args.signal_type}` : '（全シグナル表示）',
            ``,
            `detect_arbitrage_signals ツールで路線価・公示地価・取引価格の三角測量を実行し、`,
            `割安物件候補（discount）・相続有利エリア（inheritance_edge）・市場過熱（overheated）をMarkdownレポートで返してください。`,
          ].join('\n'),
        },
      }],
    })),
  );

  return server;
}
