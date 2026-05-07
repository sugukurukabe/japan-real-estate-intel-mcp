import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
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

/**
 * Wraps a tool handler with uniform error handling and structured logging.
 * On success: logs duration and returns result unchanged.
 * On failure: logs the error and returns an isError response to the MCP client.
 */
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

export function createServer(): McpServer {
  const server = new McpServer({
    name: 'japan-real-estate-intel-mcp',
    version: '2.8.0',
  });

  // ── Tools (6) ──

  server.tool(
    'cross_analyze_real_estate_market',
    '都道府県内エリアの不動産市場をクロス分析。価格トレンド・需給・災害リスク・投資スコアに加え、人流・教育・企業データをフラグで統合可能。（対応: 愛知県, 東京都, 大阪府）',
    CrossAnalyzeInput.shape,
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
    '特定物件・住所の災害リスク（浸水・土砂・地震）を評価し、リスクスコアと価格調整率を返す。（対応: 愛知県, 東京都, 大阪府）',
    AssessRiskInput.shape,
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
    '学区・教育環境・犯罪統計を加味したファミリー物件評価。子育て世帯向け資産価値を算出。（対応: 愛知県=フル, 東京都=限定）',
    FamilyFriendlyInput.shape,
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
    '企業立地・事業所統計・通勤データで法人需要を予測。オフィス・物流投資の意思決定を支援。（対応: 愛知県=フル, 東京都=限定）',
    CorporateDemandInput.shape,
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
    'エリア別の投資・開発・賃貸・管理レポートをMarkdown形式で生成する。（対応: 愛知県, 東京都, 大阪府）',
    GenerateReportInput.shape,
    (args) => withErrorHandling('generate_area_report', String(args.prefecture ?? 'aichi'), async () => {
      const input = GenerateReportInput.parse(args);
      const result = generateAreaReport(input);
      return {
        content: [{ type: 'text' as const, text: result.markdownReport }],
        structuredContent: { ...result, attribution: ATTRIBUTION },
      };
    }),
  );

  server.tool(
    'open_dashboard',
    '不動産ダッシュボード（地図・ヒートマップ・リスク・人流・学区・企業レイヤー）を開く。都道府県切替対応。mode="3d"でPLATEAU 3Dビューアを表示。MCP Apps対応ホストではインタラクティブUIを表示。',
    OpenDashboardInput.shape,
    (args) => withErrorHandling('open_dashboard', String(args.prefecture ?? 'aichi'), async () => {
      const input = OpenDashboardInput.parse(args);
      const result = openDashboard(input);
      const uiUri = result.mode === '3d'
        ? 'ui://japan-real-estate-intel/dashboard-3d'
        : 'ui://japan-real-estate-intel/dashboard';
      return {
        content: [{
          type: 'text' as const,
          text: `不動産ダッシュボード${result.mode === '3d' ? ' (3D)' : ''}: ${result.prefecture} ${result.area} (レイヤー: ${result.layer})`,
        }],
        structuredContent: { ...result, attribution: ATTRIBUTION },
        _meta: { ui: { uri: uiUri } },
      };
    }),
  );

  server.tool(
    'compare_prefectures',
    '最大5都道府県を価格・リスク・人流・教育・法人需要で並列比較。レーダーチャート用データとランキング、差分ハイライト、用途別おすすめ（投資/安全/成長）をMarkdownレポートとともに返す。',
    ComparePrefecturesInput.shape,
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
    '市区町村・町丁目レベルで不動産データをドリルダウン。地価・人口・災害リスク・人流・競合密度をクロス集計してローカル不動産屋向けのセールスピッチとMarkdownレポートを生成。',
    DrillDownInput.shape,
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
    '店舗出店候補地を人流・人口・競合・交通・災害リスク等で多角評価し、業態別スコアと差別化提案を返す。（対応: 愛知県, 東京都, 大阪府）',
    StoreLocationInput.shape,
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
    '指定地点の日照・影シミュレーション（PLATEAU 3D建物データ + SunCalc太陽位置計算）',
    LandscapeInput.shape,
    (args) => withErrorHandling('simulate_landscape', String(args.prefecture ?? 'aichi'), async () => {
      const input = LandscapeInput.parse(args);
      const result = simulateLandscape(input);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        structuredContent: { ...result, attribution: ATTRIBUTION },
      };
    }),
  );

  // ── Resources (prefecture/{area} pattern) ──

  server.resource(
    'land-price',
    'realestate://land-price/{prefecture}/{area}',
    { description: '地価公示データ。prefectureに都道府県名、areaに市区町村名を指定。', mimeType: 'application/json' },
    async (uri) => {
      const parts = uri.pathname.split('/').filter(Boolean);
      const prefecture = decodeURIComponent(parts[0] ?? 'aichi');
      const area = decodeURIComponent(parts[1] ?? '名古屋市');
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json' as const,
            text: getLandPriceResource(prefecture, area),
          },
        ],
      };
    },
  );

  server.resource(
    'flood',
    'hazard://flood/{prefecture}/{area}',
    { description: '浸水想定区域GeoJSON。prefectureに都道府県名、areaにエリア名を指定。', mimeType: 'application/json' },
    async (uri) => {
      const parts = uri.pathname.split('/').filter(Boolean);
      const prefecture = decodeURIComponent(parts[0] ?? 'aichi');
      const area = decodeURIComponent(parts[1] ?? '全体');
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json' as const,
            text: getFloodResource(prefecture, area),
          },
        ],
      };
    },
  );

  server.resource(
    'population',
    'stats://population-trend/{prefecture}/{area}',
    { description: '人口統計データ。prefectureに都道府県名、areaに市区町村名を指定。', mimeType: 'application/json' },
    async (uri) => {
      const parts = uri.pathname.split('/').filter(Boolean);
      const prefecture = decodeURIComponent(parts[0] ?? 'aichi');
      const area = decodeURIComponent(parts[1] ?? '全体');
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json' as const,
            text: getPopulationResource(prefecture, area),
          },
        ],
      };
    },
  );

  server.resource(
    'dashboard',
    'ui://japan-real-estate-intel/dashboard',
    { description: '日本不動産インテリジェンスダッシュボード（愛知県・東京都対応）', mimeType: 'text/html' },
    async (uri) => {
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'text/html' as const,
            text: getDashboardHtml(),
          },
        ],
      };
    },
  );

  server.resource(
    'dashboard-3d',
    'ui://japan-real-estate-intel/dashboard-3d',
    { description: 'PLATEAU 3D ビューア — 名古屋駅周辺の建物影シミュレーション（Three.js）', mimeType: 'text/html' },
    async (uri) => {
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'text/html' as const,
            text: getDashboard3dHtml(),
          },
        ],
      };
    },
  );

  return server;
}
