import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  CrossAnalyzeInput,
  CrossAnalyzeOutput,
  AssessRiskInput,
  AssessRiskOutput,
  GenerateReportInput,
  GenerateReportOutput,
  OpenDashboardInput,
  OpenDashboardOutput,
} from './schemas.js';
import { crossAnalyze } from './tools/cross_analyze_real_estate_market.js';
import { assessPropertyRisk } from './tools/assess_property_risk.js';
import { generateAreaReport } from './tools/generate_area_report.js';
import { openDashboard } from './tools/open_dashboard.js';
import { getLandPriceResource } from './resources/land_price.js';
import { getFloodResource } from './resources/flood.js';
import { getPopulationResource } from './resources/population.js';
import { getDashboardHtml } from './resources/ui_dashboard.js';
import { ATTRIBUTION } from './data/attribution.js';

export function createServer(): McpServer {
  const server = new McpServer({
    name: 'aichi-real-estate-intel-mcp',
    version: '1.0.0',
  });

  // ── Tools ──

  server.tool(
    'cross_analyze_real_estate_market',
    '愛知県内エリアの不動産市場をクロス分析。価格トレンド・需給・災害リスク・投資スコアを返す。',
    CrossAnalyzeInput.shape,
    async (args) => {
      const input = CrossAnalyzeInput.parse(args);
      const result = crossAnalyze(input);
      return {
        content: [
          { type: 'text' as const, text: JSON.stringify(result, null, 2) },
        ],
        structuredContent: { ...result, attribution: ATTRIBUTION },
      };
    },
  );

  server.tool(
    'assess_property_risk',
    '特定物件・住所の災害リスク（浸水・土砂・地震）を評価し、リスクスコアと価格調整率を返す。',
    AssessRiskInput.shape,
    async (args) => {
      const input = AssessRiskInput.parse(args);
      const result = assessPropertyRisk(input);
      return {
        content: [
          { type: 'text' as const, text: JSON.stringify(result, null, 2) },
        ],
        structuredContent: { ...result, attribution: ATTRIBUTION },
      };
    },
  );

  server.tool(
    'generate_area_report',
    'エリア別の投資・開発・賃貸・管理レポートをMarkdown形式で生成する。',
    GenerateReportInput.shape,
    async (args) => {
      const input = GenerateReportInput.parse(args);
      const result = generateAreaReport(input);
      return {
        content: [
          { type: 'text' as const, text: result.markdownReport },
        ],
        structuredContent: { ...result, attribution: ATTRIBUTION },
      };
    },
  );

  server.tool(
    'open_dashboard',
    '愛知県不動産ダッシュボード（地図・ヒートマップ・リスクレイヤー）を開く。MCP Apps対応ホストではインタラクティブUIを表示。',
    OpenDashboardInput.shape,
    async (args) => {
      const input = OpenDashboardInput.parse(args);
      const result = openDashboard(input);
      return {
        content: [
          {
            type: 'text' as const,
            text: `愛知県不動産ダッシュボード: ${result.area} (レイヤー: ${result.layer})`,
          },
        ],
        structuredContent: { ...result, attribution: ATTRIBUTION },
        _meta: {
          ui: { uri: 'ui://aichi-real-estate-intel/dashboard' },
        },
      };
    },
  );

  // ── Resources ──

  server.resource(
    'land-price-aichi',
    'realestate://land-price/aichi/{city}',
    { description: '愛知県の地価公示データ。cityに市区町村名を指定。', mimeType: 'application/json' },
    async (uri) => {
      const city = uri.pathname.split('/').pop() ?? '名古屋市';
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json' as const,
            text: getLandPriceResource(decodeURIComponent(city)),
          },
        ],
      };
    },
  );

  server.resource(
    'flood-aichi',
    'hazard://flood/aichi/{area}',
    { description: '愛知県の浸水想定区域GeoJSON。areaにエリア名を指定。', mimeType: 'application/json' },
    async (uri) => {
      const area = uri.pathname.split('/').pop() ?? '愛知県全体';
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json' as const,
            text: getFloodResource(decodeURIComponent(area)),
          },
        ],
      };
    },
  );

  server.resource(
    'population-aichi',
    'stats://population-trend/aichi/{area}',
    { description: '愛知県の人口統計データ。areaに市区町村名を指定。', mimeType: 'application/json' },
    async (uri) => {
      const area = uri.pathname.split('/').pop() ?? '愛知県全体';
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json' as const,
            text: getPopulationResource(decodeURIComponent(area)),
          },
        ],
      };
    },
  );

  server.resource(
    'dashboard',
    'ui://aichi-real-estate-intel/dashboard',
    { description: '愛知県不動産インテリジェンスダッシュボード', mimeType: 'text/html' },
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

  return server;
}
