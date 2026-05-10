import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  CrossAnalyzeInput,
  AssessRiskInput,
  GenerateReportInput,
  OpenDashboardInput,
  FamilyFriendlyInput,
  CorporateDemandInput,
  ComparePrefecturesInput,
  DrillDownInput,
  StoreLocationInput,
  LandscapeInput,
  ForecastLandPriceTrendInput,
  ScenarioWhatIfInput,
  PortfolioOptimizerInput,
} from './schemas.js';
import { crossAnalyze } from './tools/cross_analyze_real_estate_market.js';
import { assessPropertyRisk } from './tools/assess_property_risk.js';
import { generateAreaReport } from './tools/generate_area_report.js';
import { openDashboard } from './tools/open_dashboard.js';
import { assessFamilyFriendlyScore } from './tools/assess_family_friendly_score.js';
import { predictCorporateDemand } from './tools/predict_corporate_demand.js';
import { comparePrefectures } from './tools/compare_prefectures.js';
import { drillDownLocalAnalysis } from './tools/drill_down_local_analysis.js';
import { evaluateStoreLocation } from './tools/evaluate_store_location.js';
import { simulateLandscape } from './tools/simulate_landscape_impact.js';
import { forecastLandPriceTrend } from './tools/forecast_land_price_trend.js';
import { portfolioOptimizer } from './tools/portfolio_optimizer.js';
import { simulateAichiFuture, AichiFutureInput } from './tools/simulate_aichi_future.js';
import { scenarioWhatIf } from './tools/scenario_what_if.js';
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
import './data-loaders/index.js';

type ToolResult = {
  content: { type: 'text'; text: string }[];
  structuredContent?: Record<string, unknown>;
  _meta?: Record<string, unknown>;
  isError?: boolean;
};

function withErrorHandling(
  toolName: string,
  prefecture: string,
  fn: () => Promise<ToolResult>,
): Promise<ToolResult> {
  const start = Date.now();
  return fn().then(
    (result) => {
      toolLogger(toolName, prefecture, start);
      return result;
    },
    (err: unknown) => {
      toolLogger(toolName, prefecture, start, err);
      const message = formatErrorMessage(err);
      const isWarn = isClientError(err);
      return {
        content: [{ type: 'text' as const, text: message }],
        isError: !isWarn,
      };
    },
  );
}

const RO = { readOnlyHint: true } as const;

export function createServer(): McpServer {
  const server = new McpServer({
    name: 'japan-real-estate-intel-mcp',
    version: '6.2.0',
  });

  // ── ChatGPT Apps SDK compatibility tools (search / fetch) ────────────────

  server.tool(
    'search',
    '不動産データカタログを検索し、関連するエリア・ツール・データソースの候補一覧を返す。ChatGPT Company Knowledge / Deep Research 互換。',
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
    '検索結果のIDからドキュメント全文を取得する。search ツールの結果IDを渡すと、該当エリアの分析レポート・将来予測・データサマリをMarkdownで返す。',
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

  // ── Domain tools (16 total) ──────────────────────────────────────────────

  server.tool(
    'cross_analyze_real_estate_market',
    '不動産市場クロス分析ツール。地価トレンド・投資スコア・人流・教育環境・企業立地を総合的に分析する。対応: 愛知/東京/大阪/福岡/北海道/神奈川/京都/兵庫/埼玉/千葉',
    CrossAnalyzeInput.shape,
    RO,
    (args) => withErrorHandling('cross_analyze', String(args.prefecture ?? 'aichi'), async () => {
      const input = CrossAnalyzeInput.parse(args);
      const result = crossAnalyze(input);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        structuredContent: { ...result, attribution: ATTRIBUTION },
      };
    }),
  );

  server.tool(
    'assess_property_risk',
    '災害リスク評価ツール。浸水・土砂災害・地震リスクを統合評価しスコアリングする。対応: 全10都道府県',
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
    'ファミリー向け適性評価ツール。教育・安全・医療の3軸で住宅適地を総合評価する。対応: 全10都道府県',
    FamilyFriendlyInput.shape,
    RO,
    (args) => withErrorHandling('assess_family_friendly', String(args.prefecture ?? 'aichi'), async () => {
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
    '企業立地需要予測ツール。製造業・オフィス・小売の企業需要スコアを算出する。対応: 全10都道府県',
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
    'エリアレポート生成ツール。包括的な不動産分析をMarkdown/PDFで出力。ブランディング対応（会社名・ロゴ・免責）。対応: 全10都道府県',
    GenerateReportInput.shape,
    RO,
    (args) => withErrorHandling('generate_area_report', String(args.prefecture ?? 'aichi'), async () => {
      const input = GenerateReportInput.parse(args);
      const result = await generateAreaReport(input);
      return {
        content: [{ type: 'text' as const, text: result.markdownReport }],
        structuredContent: { ...result, attribution: ATTRIBUTION },
      };
    }),
  );

  server.tool(
    'open_dashboard',
    '可視化ダッシュボードを開く。2DマップまたはPLATEAU 3Dビュー。mode="3d"で3D建物データを表示。MCP Apps UI対応。',
    OpenDashboardInput.shape,
    RO,
    (args) => withErrorHandling('open_dashboard', String(args.prefecture ?? 'aichi'), async () => {
      const input = OpenDashboardInput.parse(args);
      const result = openDashboard(input);
      const uiUri = result.mode === '3d'
        ? 'ui://japan-real-estate-intel/dashboard-3d'
        : 'ui://japan-real-estate-intel/dashboard';
      return {
        content: [{
          type: 'text' as const,
          text: `ダッシュボードを表示${result.mode === '3d' ? ' (3D)' : ''}: ${result.prefecture} ${result.area} (レイヤー: ${result.layer})`,
        }],
        structuredContent: { ...result, attribution: ATTRIBUTION },
        _meta: { ui: { uri: uiUri } },
      };
    }),
  );

  server.tool(
    'compare_prefectures',
    '都道府県比較ツール。最大5都道府県を横断比較し、地価・人口・リスク・投資スコアをランキング。Markdown出力対応。',
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
    '街区ドリルダウン分析ツール。町丁目レベルの詳細分析（人流・商業・教育を含む）。Markdown出力対応。',
    DrillDownInput.shape,
    RO,
    (args) => withErrorHandling('drill_down', String(args.prefecture ?? 'aichi'), async () => {
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
    '店舗出店適地評価ツール。人流・交通・競合店分布を考慮した出店適地スコアを算出。対応: 全10都道府県',
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
    '日照・影シミュレーションツール。PLATEAU 3D建物データ + SunCalc で周辺建物の影響を分析。',
    LandscapeInput.shape,
    RO,
    (args) => withErrorHandling('simulate_landscape', String(args.prefecture ?? 'aichi'), async () => {
      const input = LandscapeInput.parse(args);
      const result = simulateLandscape(input);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        structuredContent: { ...result, attribution: ATTRIBUTION },
      };
    }),
  );

  server.tool(
    'forecast_land_price_trend',
    '地価トレンド予測ツール。地価公示データの年別推移から線形回帰・移動平均で将来地価を予測。CAGR・トレンド方向・信頼区間および投資シグナル（buy/hold/caution）を返す。対応: 全10都道府県',
    ForecastLandPriceTrendInput.shape,
    RO,
    (args) => withErrorHandling('forecast_land_price_trend', String(args.prefecture ?? 'aichi'), async () => {
      const input = ForecastLandPriceTrendInput.parse(args);
      const result = forecastLandPriceTrend(input);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        structuredContent: { ...result, attribution: ATTRIBUTION },
      };
    }),
  );

  server.tool(
    'scenario_what_if',
    'シナリオWhat-If分析ツール。新駅開業・大型商業施設・人口減少などの仮想イベントが地価・投資スコアに与える影響を試算。ベースライン比較とMarkdownレポートを出力。対応: 全10都道府県',
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
    '複数エリアの不動産投資ポートフォリオを最適化。最大5エリアを比較し、期待年率リターン・リスクスコア・分散スコア・シャープレシオを算出。',
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
    '愛知県固有インフラに基づく将来価値シミュレーター。リニア中央新幹線・セントレア第2滑走路・トヨタ電動化投資・万博レガシーの地価影響をMarkdownレポートで出力。',
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

  // ── Resources (prefecture/{area} pattern) ────────────────────────────────

  server.resource(
    'land-price',
    'realestate://land-price/{prefecture}/{area}',
    { description: '地価公示データ（prefecture=都道府県キー、area=市区町村名）', mimeType: 'application/json' },
    async (uri) => {
      const parts = uri.pathname.split('/').filter(Boolean);
      const prefecture = decodeURIComponent(parts[0] ?? 'aichi');
      const area = decodeURIComponent(parts[1] ?? '名古屋市');
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json' as const,
          text: getLandPriceResource(prefecture, area),
        }],
      };
    },
  );

  server.resource(
    'flood',
    'hazard://flood/{prefecture}/{area}',
    { description: '浸水リスクGeoJSONデータ（prefecture=都道府県キー、area=市区町村名）', mimeType: 'application/json' },
    async (uri) => {
      const parts = uri.pathname.split('/').filter(Boolean);
      const prefecture = decodeURIComponent(parts[0] ?? 'aichi');
      const area = decodeURIComponent(parts[1] ?? '名古屋市');
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json' as const,
          text: getFloodResource(prefecture, area),
        }],
      };
    },
  );

  server.resource(
    'population',
    'stats://population-trend/{prefecture}/{area}',
    { description: '人口推移データ（prefecture=都道府県キー、area=市区町村名）', mimeType: 'application/json' },
    async (uri) => {
      const parts = uri.pathname.split('/').filter(Boolean);
      const prefecture = decodeURIComponent(parts[0] ?? 'aichi');
      const area = decodeURIComponent(parts[1] ?? '名古屋市');
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json' as const,
          text: getPopulationResource(prefecture, area),
        }],
      };
    },
  );

  server.resource(
    'dashboard',
    'ui://japan-real-estate-intel/dashboard',
    { description: '不動産インテリジェンスダッシュボード（2Dマップ・チャート・テーブル付き）', mimeType: 'text/html' },
    async (uri) => ({
      contents: [{
        uri: uri.href,
        mimeType: 'text/html' as const,
        text: getDashboardHtml(),
      }],
    }),
  );

  server.resource(
    'dashboard-3d',
    'ui://japan-real-estate-intel/dashboard-3d',
    { description: 'PLATEAU 3D建物ビューダッシュボード（Three.js）', mimeType: 'text/html' },
    async (uri) => ({
      contents: [{
        uri: uri.href,
        mimeType: 'text/html' as const,
        text: getDashboard3dHtml(),
      }],
    }),
  );

  // ── Prompts ──────────────────────────────────────────────────────────────

  server.prompt(
    'investment_report',
    '投資判断レポートテンプレート',
    {
      prefecture: z.string().optional().describe('都道府県'),
      area: z.string().optional().describe('市区町村'),
      property_type: z.string().optional().describe('用途（residential/commercial/office/logistics/mixed）'),
    },
    (args) => ({
      messages: [{
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `投資判断レポートを作成してください。\n\n都道府県: ${args.prefecture ?? '愛知県'}\nエリア: ${args.area ?? '名古屋市中区'}\n用途: ${args.property_type ?? 'mixed'}\n\n手順:\n1. cross_analyze_real_estate_market で市場を総合分析\n2. assess_property_risk でリスク評価\n3. generate_area_report でレポート生成（format: "markdown"）\n4. 結果を統合して投資判断を提示`,
        },
      }],
    }),
  );

  server.prompt(
    'store_location_evaluation',
    '店舗出店適地評価テンプレート',
    {
      prefecture: z.string().optional().describe('都道府県'),
      area: z.string().optional().describe('市区町村'),
      store_type: z.string().optional().describe('店舗種別（convenience/restaurant/cafe/pharmacy/gym/beauty/supermarket/specialty）'),
    },
    (args) => ({
      messages: [{
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `店舗出店適地を評価してください。\n\n都道府県: ${args.prefecture ?? '愛知県'}\nエリア: ${args.area ?? '名古屋市中区'}\n店舗種別: ${args.store_type ?? 'restaurant'}\n\n手順:\n1. evaluate_store_location で適地スコア算出\n2. drill_down_local_analysis で周辺の詳細分析\n3. 競合・人流を考慮した総合判断\n4. 推奨アクションを提示`,
        },
      }],
    }),
  );

  server.prompt(
    'prefecture_comparison',
    '都道府県横断比較テンプレート',
    {
      prefectures: z.string().optional().describe('比較対象（カンマ区切り、最大5）'),
      metrics: z.string().optional().describe('比較指標（land_price,population,risk）'),
    },
    (args) => ({
      messages: [{
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `都道府県横断比較を行ってください。\n\n対象: ${args.prefectures ?? '愛知県,東京都,大阪府'}\n指標: ${args.metrics ?? 'land_price,population,risk'}\n\n手順:\n1. compare_prefectures で一括比較\n2. 各指標のランキングを分析\n3. 投資先として有望な県を推奨\n4. リスクと機会を整理`,
        },
      }],
    }),
  );

  server.prompt(
    'land_price_forecast_report',
    '地価トレンド予測レポートテンプレート',
    {
      prefecture: z.string().optional().describe('対象都道府県（省略時は愛知県）'),
      city: z.string().optional().describe('市区町村'),
      horizon: z.string().optional().describe('予測期間（1y/3y/5y）'),
    },
    ({ prefecture, city, horizon }) => ({
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
    }),
  );

  server.prompt(
    'scenario_what_if_analysis',
    'What-If シナリオ分析テンプレート',
    {
      prefecture: z.string().optional().describe('対象都道府県'),
      city: z.string().optional().describe('市区町村'),
      scenario: z.string().optional().describe('シナリオ種別'),
      scale: z.string().optional().describe('規模（small/medium/large）'),
    },
    ({ prefecture, city, scenario, scale }) => ({
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
    }),
  );

  server.prompt(
    'portfolio_optimization',
    'ポートフォリオ最適化テンプレート',
    {
      prefectures: z.string().optional().describe('対象都道府県（例: 東京都,大阪府,埼玉県）'),
      budget_man_yen: z.string().optional().describe('各エリアの予算（万円、カンマ区切り）'),
      risk_tolerance: z.string().optional().describe('リスク許容度 low/medium/high'),
    },
    ({ prefectures, budget_man_yen, risk_tolerance }) => ({
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
    }),
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
            '> **ヒント**: cross_analyze_real_estate_market で地価・人流・教育・企業・家族スコアを一括分析できます。',
          ].join('\n'),
        },
      }],
    }),
  );

  server.prompt(
    'aichi_future_value',
    {
      city: z.string().describe('市区町村名'),
      horizon: z.enum(['3y', '5y', '10y']).default('10y').describe('試算期間'),
    },
    (args) => ({
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
    }),
  );

  return server;
}
