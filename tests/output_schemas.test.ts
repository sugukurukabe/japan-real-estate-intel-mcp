/**
 * End-to-end outputSchema validation.
 *
 * Wires a real MCP Client to the server over an InMemoryTransport pair so that
 * `tools/call` goes through the SDK's actual `validateToolOutput()` step —
 * the same runtime check a Claude/ChatGPT client hits. Unlike unit tests that
 * call analysis functions or tool handlers directly, this catches a mismatch
 * between the declared `outputSchema` and the real `structuredContent` shape
 * (e.g. a required field the schema expects but the handler never sets).
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createServer } from '../src/server.js';

let client: Client;

beforeAll(async () => {
  const server = createServer('enterprise');
  client = new Client({ name: 'test-client', version: '1.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
});

afterAll(async () => {
  await client.close();
});

// Minimal valid arguments per tool — chosen from each Zod input schema's
// required fields (everything else uses schema defaults).
const TOOL_ARGS: Record<string, Record<string, unknown>> = {
  search: { query: '名古屋' },
  fetch: { id: 'area:aichi:名古屋市中区' },
  search_area_candidates: { query: '名古屋' },
  cross_analyze_real_estate_market: {
    area: '名古屋市中区',
    propertyType: 'mixed',
    timeRange: '3y',
  },
  assess_property_risk: { address: '名古屋市中区栄3丁目' },
  assess_family_friendly_score: { area: '名古屋市中区' },
  predict_corporate_demand: { area: '名古屋市中区' },
  generate_area_report: { area: '名古屋市中区', purpose: 'investment' },
  compare_prefectures: { prefectures: ['愛知県', '東京都'] },
  drill_down_local_analysis: { city: '名古屋市中村区' },
  evaluate_store_location: { city: '名古屋市中村区', storeType: 'cafe' },
  simulate_landscape_impact: { lat: 35.1815, lng: 136.9066 },
  assess_exterior_visuals: { city: '名古屋市中村区' },
  analyze_commute_accessibility: { city: '名古屋市中村区' },
  forecast_land_price_trend: { city: '名古屋市中村区' },
  scenario_what_if: { city: '名古屋市中村区', scenario: 'new_station' },
  portfolio_optimizer: {
    targets: [
      { prefecture: '愛知県', city: '名古屋市中区', propertyType: 'residential', budgetManYen: 5000 },
      { prefecture: '愛知県', city: '名古屋市中村区', propertyType: 'commercial', budgetManYen: 8000 },
    ],
  },
  simulate_aichi_future: { city: '名古屋市中村区' },
  analyze_renovation_yield: { ward: '中区', chochou: '栄三丁目', buildingAge: 25, floorArea: 60 },
  get_future_timeline: { ward: '中区' },
  get_chochou_profile: { ward: '中区' },
  recommend_renovation_targets: {},
  generate_contract_support_package: { ward: '中区', buildingAge: 25, floorArea: 60, price: 30000000 },
  assess_contract_risk: { ward: '中区', proposedTerms: { financing_contingency: true } },
  get_zoning_info: { area: '名古屋市中区' },
  get_vacancy_stats: {},
  get_population_outlook: {},
  get_real_estate_macro_snapshot: { includeExternalSeries: false },
};

describe('outputSchema end-to-end validation (real MCP dispatch)', () => {
  for (const [name, args] of Object.entries(TOOL_ARGS)) {
    it(`${name}: structuredContent matches its declared outputSchema`, async () => {
      const result = await client.callTool({ name, arguments: args });
      const content = result.content as { type: string; text?: string }[] | undefined;
      const errorText =
        result.isError && Array.isArray(content) ? content[0]?.text ?? '' : '';
      expect(errorText).not.toContain('Output validation error');
      expect(errorText).not.toContain('利用できません');
      expect(result.structuredContent).toBeDefined();
    });
  }
});
